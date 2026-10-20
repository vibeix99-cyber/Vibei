import sys, numpy as np
from PIL import Image
S=sys.argv[1]; M='/home/user/Vibei/kettle/art-src/chai/2d-v2'
CREAM=(254,249,240)
mink={'reading':(49,60,938,1453),'sipping':(52,54,932,1479),'cheering':(16,69,965,1428)}
OLD={'reading':(5,4,306,483),'sipping':(4,5,298,487),'cheering':(4,5,308,424)}
for p in mink:
    n=Image.open(f'{S}/new/chai-{p}.webp').convert('RGBA'); W,H=n.size
    X0,Y0,X1,Y1=[round(v*1.25) for v in OLD[p]]
    m=Image.open(f'{M}/chai-{p}.png').convert('RGB').crop(mink[p]).resize((X1-X0,Y1-Y0),Image.LANCZOS)
    ref=Image.new('RGB',(W,H),CREAM); ref.paste(m,(X0,Y0))
    on=Image.new('RGBA',(W,H),CREAM+(255,)); on.alpha_composite(n); on=on.convert('RGB')
    d=np.abs(np.asarray(on,float)-np.asarray(ref,float)).max(-1)
    a=np.asarray(n)[...,3]
    inside=a==255
    print(f'{p}: on-cream max-channel diff vs master (same transform): mean {d.mean():.2f}, interior mean {d[inside].mean():.2f}, interior p99.9 {np.percentile(d[inside],99.9):.1f}, px>40: {(d>40).sum()}')
    vis=np.clip(d*4,0,255).astype(np.uint8); Image.fromarray(vis).save(f'{S}/out/diff-{p}.png')
    # side by side for eyeballing
    sb=Image.new('RGB',(W*2+10,H),(128,128,128)); sb.paste(ref,(0,0)); sb.paste(on,(W+10,0)); sb.save(f'{S}/out/sbs-{p}.png')
