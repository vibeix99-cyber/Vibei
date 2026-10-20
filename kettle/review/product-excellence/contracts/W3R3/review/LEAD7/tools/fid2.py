import sys, numpy as np
from PIL import Image
S=sys.argv[1]; M='/home/user/Vibei/kettle/art-src/chai/2d-v2'; CREAM=(254,249,240)
mink={'reading':(49,60,938,1453),'sipping':(52,54,932,1479),'cheering':(16,69,965,1428)}
def box(a,thr=8):
    ys,xs=np.where(a>thr); return xs.min(),ys.min(),xs.max()+1,ys.max()+1
for p in mink:
    n=Image.open(f'{S}/new/chai-{p}.webp').convert('RGBA'); W,H=n.size; a=np.asarray(n)[...,3]
    x0,y0,x1,y1=box(a)
    m=Image.open(f'{M}/chai-{p}.png').convert('RGB').crop(mink[p]).resize((x1-x0,y1-y0),Image.LANCZOS)  # uniform within 0.5%
    ref=Image.new('RGB',(W,H),CREAM); ref.paste(m,(x0,y0))
    on=Image.new('RGBA',(W,H),CREAM+(255,)); on.alpha_composite(n); on=on.convert('RGB')
    d=np.abs(np.asarray(on,float)-np.asarray(ref,float)).max(-1); inside=a==255
    print(f'{p}: interior mean {d[inside].mean():.2f}/255, p99.9 {np.percentile(d[inside],99.9):.1f}, px>40 {(d>40).sum()}  file {W}x{H} ink {x0},{y0},{x1},{y1} margins L{x0} R{W-x1} T{y0} B{H-y1}')
    Image.fromarray(np.clip(d*4,0,255).astype(np.uint8)).save(f'{S}/out/diff-{p}.png')
