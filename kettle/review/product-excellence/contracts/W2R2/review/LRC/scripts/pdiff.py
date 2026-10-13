import sys, os, json
sys.path.insert(0, '/tmp/claude-0/lr-pylib')
import numpy as np
from PIL import Image
root = sys.argv[1]
rows = []
for cfg in sorted(os.listdir(f'{root}/control')):
    for name in ('nook-3d', 'unlock-4s', 'unlock-10s'):
        a, b = f'{root}/control/{cfg}/{name}.png', f'{root}/trial/{cfg}/{name}.png'
        if not (os.path.exists(a) and os.path.exists(b)):
            rows.append((cfg, name, 'MISSING')); continue
        A, B = Image.open(a).convert('RGB'), Image.open(b).convert('RGB')
        if A.size != B.size:
            rows.append((cfg, name, f'size differs {A.size} vs {B.size}')); continue
        x, y = np.asarray(A).astype(int), np.asarray(B).astype(int)
        d = np.abs(x - y).max(axis=2)
        n = d.size
        ys, xs = np.nonzero(d > 16)
        bbox = (int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())) if len(xs) else None
        rows.append((cfg, name, f'{A.size[0]}x{A.size[1]}', f'{100*(d>16).sum()/n:.3f}', f'{100*(d>0).sum()/n:.3f}', bbox))
print('| cfg | image | size | % px diff > 16 | % px diff > 0 | bbox of diff > 16 (x0,y0,x1,y1) |')
print('|---|---|---|---|---|---|')
for r in rows:
    if len(r) == 3: print(f'| {r[0]} | {r[1]} | {r[2]} | | | |')
    else: print(f'| {r[0]} | {r[1]} | {r[2]} | {r[3]} | {r[4]} | {r[5]} |')
