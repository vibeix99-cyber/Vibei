# Lane K task 5: proportions. AFTER (and BEFORE) on-screen ink aspect (w/h) vs the master's ink aspect (own segmentation: json/master-ink.json).
# Sources: (a) the Stage at DPR 2 (pose-switch runs): ink from the decoded alpha mapped through the real <img> box (exact) and from the screenshot diff;
#          (b) the Kit gallery at size 240 on the flat page (edge runs): ink from the screenshot diff (A vs hidden), DPR 2.
import json, glob, os, re
K='/home/user/Vibei/kettle/review/product-excellence/contracts/W3R3/review/K'
master=json.load(open(f'{K}/json/master-ink.json')); S=json.load(open(f'{K}/json/poseswitch-summary.json')); E=json.load(open(f'{K}/json/edge-halo.json'))
POSE=['reading','cheering','cheering','sipping','reading']
rows=[]
for key,sides in S.items():
    if ' dpr2 ' not in key+' ': continue
    for side in ('before','after'):
        for i,m in enumerate(sides[side]['steps']):
            rows.append(dict(src=f'stage {key} {side} step{i+1}',side=side,pose=m['pose'],kind='alpha-mapped',w=m['a_w'],h=m['a_h']))
            rows.append(dict(src=f'stage {key} {side} step{i+1}',side=side,pose=m['pose'],kind='screenshot',w=m['ink_w'],h=m['ink_h']))
for k,row in E.items():
    mode,cfg,theme,pose=k.split()
    for side in ('before','after'):
        b=row[side]['ink_box_dev']; rows.append(dict(src=f'{mode} {cfg} {theme} {side}',side=side,pose=pose,kind='screenshot',w=(b[2]-b[0])/2,h=(b[3]-b[1])/2))
out=[]
for r in rows:
    a=r['w']/r['h']; ma=master[r['pose']]['aspect']; out.append(dict(r,aspect=round(a,5),master_aspect=ma,width_vs_height_pct=round((a/ma-1)*100,2)))
json.dump(out,open(f'{K}/json/proportions.json','w'),indent=1)
import statistics as st
L=['| pose | side | method | n | mean aspect w/h | min..max % | mean width-vs-height vs master |','|---|---|---|---|---|---|---|']
for pose in ('reading','sipping','cheering'):
    for side in ('before','after'):
        for kind in ('alpha-mapped','screenshot'):
            x=[o for o in out if o['pose']==pose and o['side']==side and o['kind']==kind]
            if not x: continue
            p=[o['width_vs_height_pct'] for o in x]
            L.append(f"| {pose} | {side} | {kind} | {len(x)} | {st.mean(o['aspect'] for o in x):.4f} | {min(p):+.2f}..{max(p):+.2f} | **{st.mean(p):+.2f} %** |")
L.append('\nMaster ink aspect (own segmentation): '+', '.join(f"{p} {master[p]['aspect']} ({master[p]['ink_w']}x{master[p]['ink_h']} px)" for p in master))
open(f'{K}/json/proportions-table.md','w').write('\n'.join(L)); print('\n'.join(L))
