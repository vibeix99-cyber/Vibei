# Final audit of the 192 warning states: file present, no error, same toasts before/after the shot, every toast fully drawn
# (opacity >= 0.98; >= 0.9 for state a), no toast moved more than 1 px during the shot, minimum toasts (a: 1, b/c/c2: 2).
import os, json
R='/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round6-review/L4/captures'
issues=[]; total=0; a_both=0; a_only=0
for rev in ('R6','INT'):
    d=f'{R}/{rev}/warning'
    for cfg in sorted(os.listdir(d)):
        m=json.load(open(f'{d}/{cfg}/meta.json'))
        for k,v in m['states'].items():
            total+=1
            B=v.get('toastsBefore',[]); A=v.get('toastsAfter',[])
            thr=0.9 if k.startswith('a-') else 0.98
            full=all(t['opacity']>=thr for t in B+A)
            same=[t['text'] for t in B]==[t['text'] for t in A]
            moved=any(any(abs(x-y)>1 for x,y in zip(b['rect'],a['rect'])) for b in B for a in A if a['id']==b['id'])
            need=1 if k.startswith('a-') else (2 if k[0] in 'bc' else 0)
            if k.startswith('a-'):
                if len(A)>=2: a_both+=1
                else: a_only+=1
            ok=(not v.get('error')) and os.path.exists(f'{d}/{cfg}/{v["file"]}') and same and full and not moved and len(B)>=need
            if not ok: issues.append((rev,cfg,k[:2],'same' if same else 'DIFF','full' if full else 'MID-FADE','moved' if moved else 'still',len(B),len(A),[round(t['opacity'],2) for t in B],[round(t['opacity'],2) for t in A],'att',v.get('attempt')))
print('states',total,'flagged',len(issues),'| state a: both toasts',a_both,'warning only',a_only)
for i in issues: print(i)
