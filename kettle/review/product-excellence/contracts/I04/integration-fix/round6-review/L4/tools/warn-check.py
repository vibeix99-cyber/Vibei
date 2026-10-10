import os, struct, json
R='/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round6-review/L4/captures'
def dims(p):
    with open(p,'rb') as f: h=f.read(24)
    return struct.unpack('>II', h[16:24])
tot=0; bad=[]
for rev in ('R6','INT'):
    d=f'{R}/{rev}/warning'
    for cfg in sorted(os.listdir(d)):
        p=f'{d}/{cfg}'
        m=json.load(open(f'{p}/meta.json'))
        pngs=sorted(x for x in os.listdir(p) if x.endswith('.png'))
        tot+=len(pngs)
        sz={dims(f'{p}/{x}') for x in pngs}
        st=m['states']
        att={k[:2]:v.get('attempt') for k,v in st.items()}
        stable=all(v.get('stable') for v in st.values())
        fonts={v['page']['htmlFontPx'] for v in st.values() if 'page' in v}
        warn={k.split('-')[0]:('W' if v.get('warningRect') else '-') for k,v in st.items()}
        tn={k.split('-')[0]:len(v.get('toastsAfter',[])) for k,v in st.items()}
        print(rev, cfg, m['revision'], m['kettleSrcTree'], m['url'], len(pngs),'png', sz, 'stable' if stable else 'UNSTABLE', 'attempts',att, 'font',fonts, 'warn',warn,'toasts',tn,'errs',len(m['errors']))
        if not stable or len(pngs)!=6 or m['errors']: bad.append((rev,cfg))
print('total warning PNGs',tot,'sets with issues',bad)
