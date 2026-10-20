# Lane K task 3 post-processing: halo numbers + 4x nearest-neighbour edge sheets from the DPR 2 A (shown) / B (hidden) pairs.
import json, glob, os, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
K=os.environ.get('K_ROOT','/home/user/Vibei/kettle/review/product-excellence/contracts/W3R3/review/K')
SC=os.environ.get('K_SC','/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/w3r3')
def luma(a): return 0.2126*a[...,0]+0.7152*a[...,1]+0.0722*a[...,2]
def analyse(tag):
    A=np.asarray(Image.open(f'{SC}/ab/{tag}.A.png').convert('RGB')).astype(float); B=np.asarray(Image.open(f'{SC}/ab/{tag}.B.png').convert('RGB')).astype(float)
    d=np.abs(A-B).max(2)
    p2=f'{SC}/ab/{tag}.B2.png'
    noise=np.zeros(d.shape,bool)
    if os.path.exists(p2):
        B2=np.asarray(Image.open(p2).convert('RGB')).astype(float); nz=np.abs(B-B2).max(2)>3
        pa=f'{SC}/ab/{tag}.A2.png'
        if os.path.exists(pa): nz|=np.abs(A-np.asarray(Image.open(pa).convert('RGB')).astype(float)).max(2)>3
        noise=ndi.binary_dilation(nz,iterations=3)
    core=(d>40)&~noise; anyp=(d>4)&~noise
    # keep the big connected parts (drop sparkles?) no: all ink counts
    fringe=anyp&~core                                     # anti-aliased edge pixels (partial coverage), outside the solid ink
    ring=ndi.binary_dilation(core,iterations=3)&~core      # 1..3 device px outside the solid ink (superset of fringe)
    out2=ndi.binary_dilation(anyp,iterations=3)&~anyp      # 1..3 device px outside ANY change: must equal the background
    def stats(m):
        if m.sum()==0: return None
        a=A[m]; b=B[m]; la=luma(a); lb=luma(b)
        cream=((a[:,0]>=200)&(a[:,1]>=190)&(a[:,2]>=165)&(la>lb+25))
        return dict(n=int(m.sum()),mean_rgb=[round(float(v),1) for v in a.mean(0)],bg_rgb=[round(float(v),1) for v in b.mean(0)],
                    mean_luma=round(float(la.mean()),1),bg_luma=round(float(lb.mean()),1),d_luma=round(float((la-lb).mean()),1),
                    frac_lighter_than_bg_by_10=round(float((la>lb+10).mean()),4),frac_cream_over_bg=round(float(cream.mean()),4),
                    max_abs_diff_to_bg=round(float(np.abs(a-b).max()),1))
    ys,xs=np.where(core)
    return dict(size=[A.shape[1],A.shape[0]],noise_px_excluded=int(noise.sum()),core_px=int(core.sum()),fringe=stats(fringe),ring1_3_outside_core=stats(ring),outside_any_ink_1_3px=stats(out2),
                ink_box_dev=[int(xs.min()),int(ys.min()),int(xs.max())+1,int(ys.max())+1],core=core)
def window(A,cx,cy,half=32):
    H,W=A.shape[:2]; x0=int(min(max(cx-half,0),W-2*half)); y0=int(min(max(cy-half,0),H-2*half))
    return Image.fromarray(A[y0:y0+2*half,x0:x0+2*half].astype('uint8')).resize((4*2*half,4*2*half),Image.NEAREST),(x0,y0)
def anchors(core):
    ys,xs=np.where(core)
    t=ys.min(); top=(int(np.median(xs[ys<=t+1])),int(t))
    bm=ys.max(); bot=(int(np.median(xs[ys>=bm-1])),int(bm))
    l=xs.min(); left=(int(l),int(np.median(ys[xs<=l+1])))
    r=xs.max(); right=(int(r),int(np.median(ys[xs>=r-1])))
    return dict(top=top,feet=bot,left=left,right=right)
res={}; os.makedirs(f'{K}/edges',exist_ok=True)
tags=sorted({os.path.basename(f)[:-6] for f in glob.glob(f'{SC}/ab/edge-*.A.png')})
groups={}
for t in tags:
    _,side,mode,cfg,theme,pose=t.split('-'); groups.setdefault((mode,cfg,theme,pose),{})[side]=t
for (mode,cfg,theme,pose),sd in sorted(groups.items()):
    if len(sd)<2: continue
    row={}
    sheet=None
    for r,side in enumerate(('before','after')):
        an=analyse(sd[side]); core=an.pop('core'); an['anchors']=anchors(core); row[side]=an
    # sheet: rows before/after, cols top/feet/left/right, 4x nearest
    names=['top','feet','left','right']; ws=256; lab=20
    sheet=Image.new('RGB',(4*ws+3*6,2*(ws+lab)+6),(120,120,120)); dr=ImageDraw.Draw(sheet)
    for r,side in enumerate(('before','after')):
        A=np.asarray(Image.open(f'{SC}/ab/{sd[side]}.A.png').convert('RGB'))
        for c,nm in enumerate(names):
            cx,cy=row[side]['anchors'][nm]; w,(x0,y0)=window(A,cx,cy)
            ox=c*(ws+6); oy=r*(ws+lab+6); sheet.paste(w,(ox,oy+lab))
            dr.rectangle([ox,oy,ox+ws,oy+lab-1],fill=(255,255,255)); dr.text((ox+3,oy+5),f'{side.upper()} {pose} {nm} @dev({x0},{y0}) 64px x4',fill=(0,0,0))
    p=f'{K}/edges/edge-{mode}-{cfg}-{theme}-{pose}.png'; sheet.save(p,optimize=True)
    res[f'{mode} {cfg} {theme} {pose}']=row
json.dump(res,open(f'{K}/json/edge-halo.json','w'),indent=1)
L=['| mode | cfg | theme | pose | side | fringe px | fringe mean RGB (bg RGB) | fringe dLuma vs bg | ring1-3px mean RGB (bg) | ring dLuma | ring cream-over-bg | ring lighter-than-bg>10 | outside-ink 1-3px max diff to bg |','|---|---|---|---|---|---|---|---|---|---|---|---|---|']
for k,row in res.items():
    mode,cfg,theme,pose=k.split()
    for side in ('before','after'):
        a=row[side]; f=a['fringe']; g=a['ring1_3_outside_core']; o=a['outside_any_ink_1_3px']
        L.append(f"| {mode} | {cfg} | {theme} | {pose} | {side} | {f['n'] if f else 0} | {f['mean_rgb'] if f else '-'} ({f['bg_rgb'] if f else '-'}) | {f['d_luma'] if f else '-'} | {g['mean_rgb']} ({g['bg_rgb']}) | {g['d_luma']} | {g['frac_cream_over_bg']} | {g['frac_lighter_than_bg_by_10']} | {o['max_abs_diff_to_bg'] if o else '-'} |")
open(f'{K}/json/edge-halo-table.md','w').write('\n'.join(L)); print('\n'.join(L[:6]))
