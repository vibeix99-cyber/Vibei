import os, json, struct
R='/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round6-review/L4/captures'
issues=[]; total=0
for rev in ('R6','INT'):
    d=f'{R}/{rev}/warning'
    for cfg in sorted(os.listdir(d)):
        m=json.load(open(f'{d}/{cfg}/meta.json'))
        for k,v in m['states'].items():
            total+=1
            ob=[round(t['opacity'],2) for t in v.get('toastsBefore',[])]; oa=[round(t['opacity'],2) for t in v.get('toastsAfter',[])]
            need = 1 if k.startswith('a-') else (2 if k[0] in 'bc' else 0)
            if k.startswith('a-'): need=2
            full = all(o>=0.9 for o in ob+oa) if k.startswith('a-') else all(o>=0.98 for o in ob+oa)
            same = [t['text'] for t in v.get('toastsBefore',[])]==[t['text'] for t in v.get('toastsAfter',[])]
            ok = (not v.get('error')) and os.path.exists(f'{d}/{cfg}/{v["file"]}') and same and len(ob)>=need and full
            if not ok: issues.append((rev,cfg,k,'err' if v.get('error') else '', 'same' if same else 'DIFF', len(ob),len(oa),ob,oa,v.get('attempt')))
print('states',total,'flagged',len(issues))
for i in issues: print(i)
