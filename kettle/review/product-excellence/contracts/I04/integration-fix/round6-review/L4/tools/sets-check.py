import os, struct, json, sys
R='/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round6-review/L4/captures'
def dims(p):
    with open(p,'rb') as f:
        h=f.read(24)
    return struct.unpack('>II', h[16:24])
rows=[]
for rev in ('R6','INT'):
    d=f'{R}/{rev}'
    if not os.path.isdir(d): continue
    for cfg in sorted(os.listdir(d)):
        p=f'{d}/{cfg}'
        if cfg=='warning' or not os.path.isdir(p): continue
        pngs=sorted(x for x in os.listdir(p) if x.endswith('.png'))
        m=json.load(open(f'{p}/capture-meta.json')) if os.path.exists(f'{p}/capture-meta.json') else None
        sizes={dims(f'{p}/{x}') for x in pngs if not x[:2] in ('15','16','17','18','19')}
        print(rev,cfg,len(pngs),'png', 'meta' if m else 'NO META', m and (m['base'],m['revision'],m['viewport'],m['dpr'],m['theme'],m['reducedMotion'],'errors',len(m['errors'])), 'viewport-shot sizes',sizes)
