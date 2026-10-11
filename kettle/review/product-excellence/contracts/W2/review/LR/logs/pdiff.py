#!/usr/bin/env python3
# Lane R: pixel diff of two capture dirs. usage: pdiff.py <trialDir> <ctrlDir> <outDiffDir> [tol]
import sys, os, json
import numpy as np
from PIL import Image
a_dir, b_dir, out_dir = sys.argv[1:4]
tol = int(sys.argv[4]) if len(sys.argv) > 4 else 16
os.makedirs(out_dir, exist_ok=True)
rows = []
names = sorted(set(f for f in os.listdir(a_dir) if f.endswith('.png')) | set(f for f in os.listdir(b_dir) if f.endswith('.png')))
for n in names:
    pa, pb = os.path.join(a_dir, n), os.path.join(b_dir, n)
    if not (os.path.exists(pa) and os.path.exists(pb)):
        rows.append(dict(name=n, status='MISSING', trial=os.path.exists(pa), ctrl=os.path.exists(pb))); continue
    A = np.asarray(Image.open(pa).convert('RGB')).astype(np.int16)
    B = np.asarray(Image.open(pb).convert('RGB')).astype(np.int16)
    same = A.shape == B.shape
    h = min(A.shape[0], B.shape[0]); w = min(A.shape[1], B.shape[1])
    d = np.abs(A[:h, :w] - B[:h, :w]).max(axis=2)
    tot = max(A.shape[0]*A.shape[1], B.shape[0]*B.shape[1])
    strict = int((d > 0).sum()); tolc = int((d > tol).sum())
    # if sizes differ, the non-overlapping area counts as differing
    extra = tot - h*w
    r = dict(name=n, status='OK' if same else 'SIZE', trial_size=f'{A.shape[1]}x{A.shape[0]}', ctrl_size=f'{B.shape[1]}x{B.shape[0]}',
             pct_strict=round(100*(strict+extra)/tot, 3), pct_tol=round(100*(tolc+extra)/tot, 3), tol=tol)
    if tolc:
        ys, xs = np.where(d > tol)
        r['bbox'] = [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]
    if r['pct_tol'] > 0.5 or r['pct_strict'] > 0.5:
        m = (d > tol)
        base = (A[:h, :w]*0.35 + 255*0.65).astype(np.uint8)
        base[m] = [255, 0, 0]
        Image.fromarray(base).save(os.path.join(out_dir, n.replace('.png', '-diff.png')))
    rows.append(r)
print(json.dumps(rows, indent=1))
