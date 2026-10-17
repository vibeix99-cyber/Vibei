#!/usr/bin/env python3
"""RF-pdiff.py <tag>...: pixel-diff BEFORE (pre-round app) against AFTER (merged tree), and BEFORE against BEFORE-again (noise floor).
Per state: size, sha256 prefix, strict % (any channel differs), tol % (a channel differs by more than 16), bbox and row bands of the tol pixels.
Class: identical (same size, strict 0) | within noise (not identical, same size, tol <= max(noise tol, 0.02) and strict <= noise strict + 0.5) | different.
Raw frames are kept only for pairs that are not identical, plus a crop (before | after | diff) of the biggest band of the difference."""
import sys, os, json, hashlib, shutil
import numpy as np
from PIL import Image
CAP = '/home/user/wt/w6-int/kettle/.tmp/RF-cap'
EV = '/home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/review/FINAL/cap'
TOL = 16
def sha(p): return hashlib.sha256(open(p, 'rb').read()).hexdigest()[:12]
def load(p): return np.asarray(Image.open(p).convert('RGB')).astype(np.int16)
def cmp(pa, pb):
    A, B = load(pa), load(pb)
    same = A.shape == B.shape
    h, w = min(A.shape[0], B.shape[0]), min(A.shape[1], B.shape[1])
    d = np.abs(A[:h, :w] - B[:h, :w]).max(axis=2)
    tot = max(A.shape[0] * A.shape[1], B.shape[0] * B.shape[1])
    extra = tot - h * w
    strict = int((d > 0).sum()); tolc = int((d > TOL).sum())
    r = dict(size_a=f'{A.shape[1]}x{A.shape[0]}', size_b=f'{B.shape[1]}x{B.shape[0]}', same_size=same,
             strict=round(100 * (strict + extra) / tot, 4), tol=round(100 * (tolc + extra) / tot, 4), strict_px=strict + extra, tol_px=tolc + extra)
    m = d > TOL if tolc else (d > 0)
    r['bands'] = []
    if m.any():
        ys, xs = np.where(m)
        r['bbox'] = [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]
        rows = m.any(axis=1); idx = np.where(rows)[0]
        runs = []; s = idx[0]; prev = idx[0]
        for y in idx[1:]:
            if y - prev > 24: runs.append((s, prev)); s = y
            prev = y
        runs.append((s, prev))
        for (y0, y1) in runs:
            sub = m[y0:y1 + 1]; xx = np.where(sub.any(axis=0))[0]
            r['bands'].append(dict(y0=int(y0), y1=int(y1), x0=int(xx.min()), x1=int(xx.max()), px=int(sub.sum())))
        r['bands'].sort(key=lambda b: -b['px']); r['bands'] = r['bands'][:6]
    return r, A, B, d, h, w
out_all = {}
for tag in sys.argv[1:]:
    D = {s: f'{CAP}/{s}/{tag}' for s in ('before', 'after', 'before2')}
    if not all(os.path.isdir(x) for x in D.values()): print('missing', tag); continue
    names = sorted(set(f for x in D.values() for f in os.listdir(x) if f.endswith('.png') and not f.endswith('-diff.png')))
    rows = []
    for n in names:
        P = {s: f'{D[s]}/{n}' for s in D}
        if not all(os.path.exists(P[s]) for s in P):
            rows.append(dict(name=n, cls='MISSING', present={s: os.path.exists(P[s]) for s in P})); continue
        ra, A, B, d, h, w = cmp(P['after'], P['before'])       # a = after, b = before
        rn, *_ = cmp(P['before2'], P['before'])
        ident = ra['same_size'] and ra['strict_px'] == 0
        within = (not ident) and ra['same_size'] and ra['tol'] <= max(rn['tol'], 0.02) and ra['strict'] <= rn['strict'] + 0.5
        cls = 'identical' if ident else ('within noise' if within else 'different')
        row = dict(name=n, cls=cls, sha=dict(before=sha(P['before']), after=sha(P['after']), before2=sha(P['before2'])),
                   after_vs_before=ra, before2_vs_before=rn)
        if not ident:
            os.makedirs(f'{EV}/{tag}', exist_ok=True)
            for s in P: shutil.copy(P[s], f'{EV}/{tag}/{s}-{n}')
            # diff overlay (red = channel difference above 16) and a crop of the biggest band
            base = (A[:h, :w] * 0.35 + 255 * 0.65).astype(np.uint8)
            mm = d > TOL
            if not mm.any(): mm = d > 0
            base[mm] = [255, 0, 0]
            Image.fromarray(base).save(f'{EV}/{tag}/diff-{n}')
            if ra['bands']:
                bd = ra['bands'][0]; pad = 20
                x0, x1 = max(0, bd['x0'] - pad), min(w, bd['x1'] + pad); y0, y1 = max(0, bd['y0'] - pad), min(h, bd['y1'] + pad)
                if y1 - y0 > 900: y1 = y0 + 900
                if x1 - x0 > 900: x1 = x0 + 900
                trip = np.concatenate([B[y0:y1, x0:x1], np.full((y1 - y0, 8, 3), 128, np.int16), A[y0:y1, x0:x1], np.full((y1 - y0, 8, 3), 128, np.int16), base[y0:y1, x0:x1].astype(np.int16)], axis=1).astype(np.uint8)
                Image.fromarray(trip).save(f'{EV}/{tag}/crop-{n}')
                row['crop'] = f'crop-{n}'; row['crop_box'] = [x0, y0, x1, y1]
        rows.append(row)
    os.makedirs(f'{EV}/{tag}', exist_ok=True)
    for s in D:
        for f in ('freeze.json', 'capture-meta.json', 'run.log'):
            if os.path.exists(f'{D[s]}/{f}'): shutil.copy(f'{D[s]}/{f}', f'{EV}/{tag}/{s}-{f}')
    json.dump(rows, open(f'{EV}/{tag}/pairs.json', 'w'), indent=1)
    out_all[tag] = rows
lines = []
for tag, rows in out_all.items():
    lines.append(f'### {tag}')
    lines.append('| state | size after / before | after vs before strict % / tol % | before vs before2 strict % / tol % | class | where (biggest band: x0-x1, y0-y1) |')
    lines.append('|---|---|---|---|---|---|')
    for r in rows:
        if r['cls'] == 'MISSING': lines.append(f"| {r['name']} | | | | MISSING {r['present']} | |"); continue
        a, n = r['after_vs_before'], r['before2_vs_before']
        bd = a['bands'][0] if a['bands'] else None
        lines.append(f"| {r['name']} | {a['size_a']} / {a['size_b']} | {a['strict']} / {a['tol']} | {n['strict']} / {n['tol']} | **{r['cls']}** | {('x %d-%d, y %d-%d (%d px)' % (bd['x0'], bd['x1'], bd['y0'], bd['y1'], bd['px'])) if bd else ''} |")
    lines.append('')
open(f'{EV}/matrix-{"-".join(t.replace("@", "at") for t in out_all)}.md', 'w').write('\n'.join(lines))
print('\n'.join(lines))
