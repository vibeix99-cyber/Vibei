#!/usr/bin/env python3
# repeat-take noise baseline: same side take1 vs take2, and trial2 vs ctrl2, for the re-captured states
import os, sys, glob, json
import numpy as np
from PIL import Image
CAP, CAP2 = '/tmp/claude-0/lr2-scratch/cap', '/tmp/claude-0/lr2-scratch/cap2'
def cmp(pa, pb, tol=16):
    A = np.asarray(Image.open(pa).convert('RGB')).astype(np.int16); B = np.asarray(Image.open(pb).convert('RGB')).astype(np.int16)
    h = min(A.shape[0], B.shape[0]); w = min(A.shape[1], B.shape[1])
    d = np.abs(A[:h, :w] - B[:h, :w]).max(axis=2); tot = max(A.shape[0]*A.shape[1], B.shape[0]*B.shape[1]); extra = tot - h*w
    return dict(size=f'{A.shape[1]}x{A.shape[0]}' + ('' if A.shape == B.shape else f' vs {B.shape[1]}x{B.shape[0]}'), strict=round(100*((d > 0).sum()+extra)/tot, 3), tol=round(100*((d > tol).sum()+extra)/tot, 3))
rows = []
for f in sorted(glob.glob(f'{CAP2}/trial/*/*.png')):
    tag = f.split('/')[-2]; n = os.path.basename(f)
    t1, c1 = f'{CAP}/trial/{tag}/{n}', f'{CAP}/ctrl/{tag}/{n}'
    t2, c2 = f, f'{CAP2}/ctrl/{tag}/{n}'
    r = dict(tag=tag, state=n[:-4])
    if os.path.exists(t1): r['trial1_vs_trial2'] = cmp(t1, t2)
    if os.path.exists(c1) and os.path.exists(c2): r['ctrl1_vs_ctrl2'] = cmp(c1, c2)
    if os.path.exists(c2): r['trial2_vs_ctrl2'] = cmp(t2, c2)
    if os.path.exists(c1) and os.path.exists(t1): r['trial1_vs_ctrl1'] = cmp(t1, c1)
    rows.append(r)
json.dump(rows, open(sys.argv[1], 'w'), indent=1)
print('| config | state | trial1 vs ctrl1 (% over tol 16 / % strict) | trial1 vs trial2 | ctrl1 vs ctrl2 | trial2 vs ctrl2 |'); print('|---|---|---|---|---|---|')
g = lambda r, k: (f"{r[k]['tol']} / {r[k]['strict']}" + (f" ({r[k]['size']})" if ' vs ' in r[k]['size'] else '')) if k in r else 'n/a'
for r in rows: print(f"| {r['tag']} | {r['state']} | {g(r,'trial1_vs_ctrl1')} | {g(r,'trial1_vs_trial2')} | {g(r,'ctrl1_vs_ctrl2')} | {g(r,'trial2_vs_ctrl2')} |")
