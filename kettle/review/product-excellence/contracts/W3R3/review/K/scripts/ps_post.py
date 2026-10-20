# Lane K task 4 post-processing: ink boxes from the screenshot diffs, baseline, step-to-step deltas, rAF-trace jumps, strips.
import json, glob, os, sys, math
import numpy as np
from PIL import Image, ImageDraw
K='/home/user/Vibei/kettle/review/product-excellence/contracts/W3R3/review/K'
SC='/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/w3r3'
def diff_ink(tag,dpr,clip,thr=16):
    A=np.asarray(Image.open(f'{SC}/ab/{tag}.A.png').convert('RGB')).astype(int); B=np.asarray(Image.open(f'{SC}/ab/{tag}.B.png').convert('RGB')).astype(int)
    import os
    from scipy import ndimage as ndi
    p2=f'{SC}/ab/{tag}.B2.png'; noise=np.zeros(A.shape[:2],bool)
    if os.path.exists(p2):
        nz=np.abs(B-np.asarray(Image.open(p2).convert('RGB')).astype(int)).max(2)>3
        pa=f'{SC}/ab/{tag}.A2.png'
        if os.path.exists(pa): nz|=np.abs(A-np.asarray(Image.open(pa).convert('RGB')).astype(int)).max(2)>3
        noise=ndi.binary_dilation(nz,iterations=3)
    m=(np.abs(A-B).max(2)>thr)&~noise
    lab,nl=ndi.label(ndi.binary_dilation(m,iterations=2))      # keep the connected pieces that touch the main silhouette: biggest component + any piece within 6 px of it
    if nl>1:
        sizes=ndi.sum(m,lab,range(1,nl+1)); big=1+int(np.argmax(sizes)); keep=ndi.binary_dilation(lab==big,iterations=0)
        m=m&(lab>0)&np.isin(lab,[big]+[i+1 for i in range(nl) if sizes[i]>=20])
    ys,xs=np.where(m)
    if not len(xs): return None
    return [clip['x']+xs.min()/dpr, clip['y']+ys.min()/dpr, clip['x']+(xs.max()+1)/dpr, clip['y']+(ys.max()+1)/dpr]
def r2(v): return None if v is None else [round(float(x),2) for x in v]
res={}
for f in sorted(glob.glob(f'{K}/json/ps/*.json')):
    d=json.load(open(f)); key=f"{d['cfg']} {d['theme']} dpr{d['dpr']} {d['motion']}"
    for s in d['steps']:
        s['ink_diff']=diff_ink(s['abTag'],d['dpr'],s['clip'])
    res.setdefault(key,{})[d['side']]=d
rows=[]; md=[]
def metrics(s):
    bx=s['box']; ink=s['ink_diff'] or s['ink']; ia=s['ink']
    return dict(pose=s['pose'],box=r2(bx),ink_alpha=r2(ia),ink_shot=r2(ink),
      ink_w=round(ink[2]-ink[0],2),ink_h=round(ink[3]-ink[1],2),cx=round((ink[0]+ink[2])/2,2),baseline=round(ink[3],2),
      a_w=round(ia[2]-ia[0],2),a_h=round(ia[3]-ia[1],2),a_cx=round((ia[0]+ia[2])/2,2),a_base=round(ia[3],2),
      box_w=round(bx[2],2),box_h=round(bx[3],2),box_cx=round(bx[0]+bx[2]/2,2),box_bottom=round(bx[1]+bx[3],2))
summary={}
for key,sides in sorted(res.items()):
    if 'before' not in sides or 'after' not in sides: continue
    out={}
    for side in ('before','after'):
        ms=[metrics(s) for s in sides[side]['steps']]
        deltas=[]
        for a,b in zip(ms,ms[1:]):
            deltas.append({k:round(b[k]-a[k],2) for k in ('box_w','box_h','box_cx','box_bottom','ink_w','ink_h','cx','baseline','a_w','a_h','a_cx','a_base')})
        out[side]=dict(steps=ms,deltas=deltas)
    # trace
    for side in ('before','after'):
        tr=sides[side]['trace']; prev=None; mx=dict(dw=0,dh=0,dcx=0,dbase=0); at={}; multi=0
        for row in tr:
            if len(row['figs'])!=1: multi+=1; prev=None; continue
            g=row['figs'][0]; cur=(g['w'],g['h'],g['x']+g['w']/2,g['y']+g['h'])
            if prev:
                for k,v in zip(('dw','dh','dcx','dbase'),(cur[0]-prev[0],cur[1]-prev[1],cur[2]-prev[2],cur[3]-prev[3])):
                    if abs(v)>abs(mx[k]): mx[k]=round(v,2); at[k]=(row['t'],g['pose'],row['hash'])
            prev=cur
        out[side]['trace']=dict(frames=len(tr),frames_not_exactly_one_figure=multi,max_frame_delta=mx,at=at)
    summary[key]=out
json.dump(summary,open(f'{K}/json/poseswitch-summary.json','w'),indent=1)
default=lambda o: float(o)
# markdown
L=[]
for key,out in summary.items():
    L.append(f'\n#### {key}\n')
    L.append('| step | pose | side | img box x,y,w,h | ink x0,y0,x1,y1 (shot diff) | ink w x h | ink cx | baseline y |'); L.append('|---|---|---|---|---|---|---|---|')
    names=['1 focus running','2 whistle','3 summary','4 tea break','5 next brew']
    for i in range(5):
        for side in ('before','after'):
            m=out[side]['steps'][i]
            L.append(f"| {names[i]} | {m['pose']} | {side} | {m['box']} | {m['ink_shot']} | {m['ink_w']} x {m['ink_h']} | {m['cx']} | {m['baseline']} |")
    L.append('\nStep-to-step deltas (CSS px, ink from the screenshot diff; `box` = the img element):\n')
    L.append('| transition | side | d box w | d box h | d box bottom | d ink w | d ink h | d ink cx | d baseline |'); L.append('|---|---|---|---|---|---|---|---|---|')
    tn=['1>2 running>whistle','2>3 whistle>summary','3>4 summary>tea break','4>5 tea break>next brew']
    for i in range(4):
        for side in ('before','after'):
            d=out[side]['deltas'][i]
            L.append(f"| {tn[i]} | {side} | {d['box_w']} | {d['box_h']} | {d['box_bottom']} | {d['ink_w']} | {d['ink_h']} | {d['cx']} | {d['baseline']} |")
    for side in ('before','after'):
        t=out[side]['trace']; L.append(f"\nrAF trace {side}: {t['frames']} frames; frames with !=1 figure {t['frames_not_exactly_one_figure']}; max single-frame delta {t['max_frame_delta']} at {t['at']}")
open(f'{K}/json/poseswitch-tables.md','w').write('\n'.join(L))
# strips
for key in summary:
    cfg,theme,dprs,motion=key.split()
    if dprs!='dpr1' or motion!='full': continue
    dirs={s:f'{SC}/frames/{s}-{cfg}-{theme}' for s in ('before','after')}
    files={s:sorted(glob.glob(f'{dirs[s]}/[0-9]-*.png')) for s in dirs}
    if any(len(v)!=5 for v in files.values()): print('strip: frames missing',key,{s:len(v) for s,v in files.items()}); continue
    bxs=[m['box'] for s in summary[key].values() for m in s['steps']]
    x0=min(b[0] for b in bxs)-70; y0=min(b[1] for b in bxs)-50; x1=max(b[0]+b[2] for b in bxs)+70; y1=max(b[1]+b[3] for b in bxs)+90
    img0=Image.open(files['before'][0]); W,H=img0.size
    x0,y0,x1,y1=[int(v) for v in (max(0,x0),max(0,y0),min(W,x1),min(H,y1))]
    cw,ch=x1-x0,y1-y0; lab=22
    names=['1 running (reading)','2 whistle (cheering)','3 summary (cheering)','4 tea break (sipping)','5 next brew (reading)']
    sheet=Image.new('RGB',(cw*5+4*6,(ch+lab)*2+6),(128,128,128)); dr=ImageDraw.Draw(sheet)
    for r,side in enumerate(('before','after')):
        for i,fp in enumerate(files[side]):
            fr=Image.open(fp).convert('RGB').crop((x0,y0,x1,y1)); ox=i*(cw+6); oy=r*(ch+lab+6)
            sheet.paste(fr,(ox,oy+lab)); dr.rectangle([ox,oy,ox+cw,oy+lab-1],fill=(255,255,255)); dr.text((ox+4,oy+5),f'{side.upper()}  {names[i]}  crop {x0},{y0}',fill=(0,0,0))
    p=f'{K}/strips/strip-{cfg}-{theme}.png'; os.makedirs(os.path.dirname(p),exist_ok=True); sheet.save(p,optimize=True); print('strip',p,sheet.size,os.path.getsize(p))
