# Lane K: pixel diff BEFORE vs AFTER with the noise floor. Per pair:
#   out = pixels outside Chai's box (+16 px); a pixel "differs" when max channel diff > 8.
#   noise mask = pixels that differ between BEFORE and the BEFORE recapture (dilated 10 px), where a recapture exists.
#   verdict: identical (out diff == 0 at > 0), within noise (all out diffs > 8 lie in the noise mask, or out diffs are <= 8 everywhere),
#            different (out diffs > 8 not explained by the noise mask, or no noise pair: listed with bbox components for a look).
import sys, json, os, re, glob
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
K=os.environ.get('K_ROOT','/home/user/Vibei/kettle/review/product-excellence/contracts/W3R3/review/K')
SC=os.environ.get('K_SC','/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/w3r3')
MARGIN=16
def boxes(f):
    m={}
    for line in open(f):
        mm=re.match(r'(\S+) (\S+) (\[.*\])$',line.strip())
        if mm: m[(mm.group(1),mm.group(2))]=[[float(v) for v in s.split(':')[1].split(',')] for s in json.loads(mm.group(3))]
    return m
bb,ba=boxes(f'{K}/shots/before/states.log.txt'),boxes(f'{K}/shots/after/states.log.txt')
def load(p): return np.asarray(Image.open(p).convert('RGB')).astype(np.int16)
def chai_mask(shape,bxs):
    H,W=shape[:2]; m=np.zeros((H,W),bool)
    for x,y,w,h in bxs: m[max(0,int(y-MARGIN)):min(H,int(y+h+MARGIN)+1), max(0,int(x-MARGIN)):min(W,int(x+w+MARGIN)+1)]=True
    return m
os.makedirs(f'{K}/outside-diffs',exist_ok=True)
rows=[]
for p in sorted(glob.glob(f'{K}/shots/before/*/*.png')):
    tag=os.path.basename(os.path.dirname(p)); st=os.path.basename(p)[:-4]
    pa=f'{K}/shots/after/{tag}/{st}.png'
    if not os.path.exists(pa): continue   # a partial re-run: only the configs that were captured
    pn=f'{SC}/before2/{tag}/{st}.png'; pn2=f'{SC}/after2/{tag}/{st}.png'
    if st in ('focus-running','home-live','focus-paused','focus-break','home-break'):   # final (3x settle) recapture has its own noise pair
        pn=f'{SC}/before3/{tag}/{st}.png'; pn2=f'{SC}/after3/{tag}/{st}.png'
    a,b=load(p),load(pa); r=dict(tag=tag,state=st,size_before=list(a.shape[1::-1]),size_after=list(b.shape[1::-1]),noise_pairs=[x for x,f in (('before-recapture',pn),('after-recapture',pn2)) if os.path.exists(f)])
    r['has_noise_pair']=bool(r['noise_pairs'])
    n=load(pn) if os.path.exists(pn) else None; n2=load(pn2) if os.path.exists(pn2) else None
    # compare on the common top-left area (page heights can differ by a few px between runs)
    h=min(a.shape[0],b.shape[0]); w=min(a.shape[1],b.shape[1])
    for q in (n,n2):
        if q is not None: h=min(h,q.shape[0]); w=min(w,q.shape[1])
    A,B=a[:h,:w],b[:h,:w]; d=np.abs(A-B).max(2); bxs=bb.get((tag,st),[])+ba.get((tag,st),[]); cm=chai_mask((h,w),bxs)
    if st.startswith('welcome'):   # the Welcome mascot is animated (hop/bob): the logged box is from a different instant, so mask its whole column of the prompt row
        for x,y,bw,bh in bxs: cm[0:260,max(0,int(x-MARGIN)):min(w,int(x+bw+MARGIN)+1)]=True
    r['height_differs_before_vs_after']=a.shape[0]!=b.shape[0]
    r['compared']=[w,h]
    r['inside_chai_box_gt8_px']=int(((d>8)&cm).sum()); r['inside_px']=int(cm.sum())
    out=(d>8)&~cm; r['out_ne0']=int(((d>0)&~cm).sum()); r['out_gt8']=int(out.sum()); r['out_max']=int(d[~cm].max()) if (~cm).any() else 0
    if n is not None or n2 is not None:
        dn=np.zeros((h,w),bool)
        for q in (n,n2):
            if q is not None: dn|=np.abs((A if q is n else B)-q[:h,:w]).max(2)>8
        nm=ndi.binary_dilation(dn,iterations=10)
        r['noise_out_gt8']=int((dn&~cm).sum()); r['noise_inside_gt8']=int((dn&cm).sum())
        un=out&~nm; r['out_gt8_unexplained_by_noise']=int(un.sum())
    else: un=out
    n=n if n is not None else n2
    if r['out_ne0']==0 and not r['height_differs_before_vs_after']: v='identical outside Chai box'
    elif r['out_gt8']==0: v='within noise (outside diffs <= 8/255)'
    elif n is not None and un.sum()==0: v='within noise (diffs coincide with the BEFORE-vs-BEFORE recapture)'
    elif n is not None: v='DIFFERENT outside (not covered by the noise pair)'
    else: v='no noise pair: see components'
    r['verdict']=v
    comps=[]
    if un.any():
        lab,nl=ndi.label(ndi.binary_dilation(un,iterations=6))
        for i,sl in enumerate(ndi.find_objects(lab)):
            comps.append([int(sl[1].start),int(sl[0].start),int(sl[1].stop),int(sl[0].stop),int((un&(lab==i+1)).sum())])
    r['components']=comps; rows.append(r)
json.dump(rows,open(f'{K}/json/pixdiff2.json','w'),indent=1)
from collections import Counter
print(Counter(r['verdict'] for r in rows))
for r in rows:
    if r['verdict'].startswith(('DIFF','no noise')) : print(r['tag'],r['state'],r['verdict'][:30],'out_gt8',r['out_gt8'],'unexpl',r.get('out_gt8_unexplained_by_noise'),r['components'][:4])
