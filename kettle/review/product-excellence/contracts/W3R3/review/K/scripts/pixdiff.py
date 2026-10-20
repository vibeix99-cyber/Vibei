# Lane K: BEFORE vs AFTER pixel diff per capture pair, split into "inside Chai's box (+margin)" and "outside".
# usage: pixdiff.py <beforeDir> <afterDir> <before2Dir or -> <out.json>
# Chai box per capture = the union of the <img> rects logged by states.mjs in BEFORE and AFTER (CSS px == png px at DPR 1), plus MARGIN px.
import sys, json, os, re, glob
import numpy as np
from PIL import Image
MARGIN=16
bdir,adir,b2dir,out=sys.argv[1:5]
def boxes(d):
    m={}
    for line in open(f'{d}/states.log.txt'):
        mm=re.match(r'(\S+) (\S+) (\[.*\])$',line.strip())
        if not mm: continue
        tag,state,js=mm.groups()
        m[(tag,state)]=[[float(v) for v in s.split(':')[1].split(',')] for s in json.loads(js)]
    return m
bb,ba=boxes(bdir),boxes(adir)
def load(p): return np.asarray(Image.open(p).convert('RGB')).astype(np.int16)
def mask(shape,bxs):
    H,W=shape[:2]; m=np.zeros((H,W),bool)
    for x,y,w,h in bxs:
        m[max(0,int(y-MARGIN)):min(H,int(y+h+MARGIN)+1), max(0,int(x-MARGIN)):min(W,int(x+w+MARGIN)+1)]=True
    return m
def cmp(p1,p2,bxs):
    a,b=load(p1),load(p2)
    if a.shape!=b.shape: return dict(shape_mismatch=[list(a.shape[:2]),list(b.shape[:2])])
    d=np.abs(a-b).max(2); m=mask(a.shape,bxs)
    res=dict(size=[a.shape[1],a.shape[0]])
    for name,sel in (('in',m),('out',~m)):
        dd=d[sel]
        res[name]=dict(px=int(sel.sum()),ne0=int((dd>0).sum()),gt8=int((dd>8).sum()),gt32=int((dd>32).sum()),maxd=int(dd.max()) if dd.size else 0)
    o=(d>8)&~m
    if o.any():
        ys,xs=np.where(o); res['out_bbox_gt8']=[int(xs.min()),int(ys.min()),int(xs.max())+1,int(ys.max())+1]
    return res
rows=[]
for p in sorted(glob.glob(f'{bdir}/*/*.png')):
    tag=os.path.basename(os.path.dirname(p)); state=os.path.basename(p)[:-4]
    pa=f'{adir}/{tag}/{state}.png'
    if not os.path.exists(pa): rows.append(dict(tag=tag,state=state,missing='after')); continue
    bxs=(bb.get((tag,state),[])+ba.get((tag,state),[]))
    r=dict(tag=tag,state=state,pair=cmp(p,pa,bxs))
    if b2dir!='-' and os.path.exists(f'{b2dir}/{tag}/{state}.png'): r['noise']=cmp(p,f'{b2dir}/{tag}/{state}.png',bxs)
    rows.append(r)
json.dump(rows,open(out,'w'),indent=1)
print(len(rows),'pairs;',sum(1 for r in rows if 'noise' in r),'with noise pair')
