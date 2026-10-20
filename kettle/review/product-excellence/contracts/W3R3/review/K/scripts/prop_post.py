# Lane K task 5: proportions. On-screen ink aspect (w/h) AFTER vs the master's ink aspect (own segmentation: json/master-ink.json).
import json, glob, os, re
import numpy as np
from PIL import Image
K='/home/user/Vibei/kettle/review/product-excellence/contracts/W3R3/review/K'
SC='/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/w3r3'
master=json.load(open(f'{K}/json/master-ink.json'))
POSE={'1-focus-running-reading':'reading','2-whistle-cheering':'cheering','3-summary-cheering':'cheering','4-tea-break-sipping':'sipping','5-next-brew-reading':'reading'}
def diff_box(tag,dpr,clip,thr=16):
    A=np.asarray(Image.open(f'{SC}/ab/{tag}.A.png').convert('RGB')).astype(int); B=np.asarray(Image.open(f'{SC}/ab/{tag}.B.png').convert('RGB')).astype(int)
    ys,xs=np.where(np.abs(A-B).max(2)>thr); return xs.min()/dpr,ys.min()/dpr,(xs.max()+1)/dpr,(ys.max()+1)/dpr
rows=[]
for f in sorted(glob.glob(f'{K}/json/ps/*-d2-full.json')):
    d=json.load(open(f))
    for s in d['steps']:
        if s['name'] in ('3-summary-cheering','1-focus-running-reading','4-tea-break-sipping'):
            x0,y0,x1,y1=diff_box(s['abTag'],2,{'x':0,'y':0}) if False else (None,)*4
            A=np.asarray(Image.open(f"{SC}/ab/{s['abTag']}.A.png").convert('RGB')).astype(int); B=np.asarray(Image.open(f"{SC}/ab/{s['abTag']}.B.png").convert('RGB')).astype(int)
            ys,xs=np.where(np.abs(A-B).max(2)>16); w=(xs.max()-xs.min()+1)/2; h=(ys.max()-ys.min()+1)/2
            rows.append(dict(src=f"stage {d['cfg']} {d['theme']} {d['side']}",pose=POSE[s['name']],ink_w=w,ink_h=h))
for f in sorted(glob.glob(f'{SC}/ab/edge-*.json')):
    for e in json.load(open(f)):
        side,mode,cfg,theme=os.path.basename(f)[5:-5].split('-') if False else (None,)*4
        m=re.match(r'edge-(\w+)-(\w+)-(\w+)-(\w+)\.json',os.path.basename(f)); side,mode,cfg,theme=m.groups()
        A=np.asarray(Image.open(f"{SC}/ab/{e['tag']}.A.png").convert('RGB')).astype(int); B=np.asarray(Image.open(f"{SC}/ab/{e['tag']}.B.png").convert('RGB')).astype(int)
        ys,xs=np.where(np.abs(A-B).max(2)>16); rows.append(dict(src=f"{mode} {cfg} {theme} {side}",pose=e['pose'],ink_w=(xs.max()-xs.min()+1)/2,ink_h=(ys.max()-ys.min()+1)/2))
# shipped files, alpha > 8 box (file level)
files={}
for side in ('before','after'):
    for pose in ('reading','sipping','cheering'):
        im=Image.open(f'{K}/assets-served/{side}-chai-{pose}.webp').convert('RGBA'); a=np.asarray(im)[...,3]
        ys,xs=np.where(a>8); files[f'{side} {pose}']=dict(natural=im.size,ink=[int(xs.min()),int(ys.min()),int(xs.max())+1,int(ys.max())+1],ink_aspect=round((xs.max()+1-xs.min())/(ys.max()+1-ys.min()),5))
out=dict(master={p:master[p]['aspect'] for p in master},files=files,onscreen=[])
for r in rows:
    asp=r['ink_w']/r['ink_h']; ma=master[r['pose']]['aspect']
    out['onscreen'].append(dict(src=r['src'],pose=r['pose'],ink_w=r['ink_w'],ink_h=r['ink_h'],aspect=round(asp,5),master_aspect=ma,width_vs_height_pct=round((asp/ma-1)*100,2)))
json.dump(out,open(f'{K}/json/proportions.json','w'),indent=1)
L=['| source | pose | ink w x h (CSS px) | on-screen aspect w/h | master aspect | width vs height |','|---|---|---|---|---|---|']
for o in sorted(out['onscreen'],key=lambda o:(o['pose'],o['src'])):
    L.append(f"| {o['src']} | {o['pose']} | {o['ink_w']} x {o['ink_h']} | {o['aspect']} | {o['master_aspect']} | {o['width_vs_height_pct']:+.2f} % |")
open(f'{K}/json/proportions-table.md','w').write('\n'.join(L)); print('\n'.join(L)); print(json.dumps(files))
