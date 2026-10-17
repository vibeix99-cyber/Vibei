#!/usr/bin/env python3
"""RF-pdiff.py <run-name> <tag>...: pixel-diff BEFORE (pre-round app, :5583) against AFTER (merged tree, :5560).
Sides in the capture dir: before, after, before2 (BEFORE again = the noise floor) and, when present, after2.
Per state: sizes, sha256 prefixes, strict % (any channel differs) and tol % (a channel differs by more than 16) for after vs before and
before2 vs before, plus the ROBUST count: pixels where every BEFORE frame agrees (<= 16), every AFTER frame agrees (<= 16) and every AFTER
differs from every BEFORE by more than 16. Class:
  identical     same size and strict 0 (pixel-exact) between after and before
  within noise  not identical, same size, robust pixels <= 50
  different     robust pixels > 50, or a size difference that the two BEFORE frames do not have
Raw frames are kept only for pairs that are not identical, with a diff overlay (red = robust difference, or tol difference when none) and a
crop (before | after | overlay) of the biggest band."""
import sys, os, json, hashlib, shutil
import numpy as np
from PIL import Image
CAP = os.environ.get('RF_CAPROOT', '/home/user/wt/w6-int/kettle/.tmp/RF-cap')
EVROOT = '/home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/review/FINAL/cap'
TOL = 16
RUN = sys.argv[1]
KEEP_RAW = os.environ.get('RF_KEEP_RAW', '1') == '1'
def sha(p): return hashlib.sha256(open(p, 'rb').read()).hexdigest()[:12]
def load(p): return np.asarray(Image.open(p).convert('RGB')).astype(np.int16)
def pair(A, B):
    same = A.shape == B.shape
    h, w = min(A.shape[0], B.shape[0]), min(A.shape[1], B.shape[1])
    d = np.abs(A[:h, :w] - B[:h, :w]).max(axis=2)
    tot = max(A.shape[0] * A.shape[1], B.shape[0] * B.shape[1]); extra = tot - h * w
    s = int((d > 0).sum()); t = int((d > TOL).sum())
    return dict(a=f'{A.shape[1]}x{A.shape[0]}', b=f'{B.shape[1]}x{B.shape[0]}', same_size=same, strict=round(100 * (s + extra) / tot, 4), tol=round(100 * (t + extra) / tot, 4), strict_px=s + extra, tol_px=t + extra), d, h, w
def bands(m):
    out = []
    if not m.any(): return out
    idx = np.where(m.any(axis=1))[0]; runs = []; s = prev = idx[0]
    for y in idx[1:]:
        if y - prev > 24: runs.append((s, prev)); s = y
        prev = y
    runs.append((s, prev))
    for (y0, y1) in runs:
        sub = m[y0:y1 + 1]; xx = np.where(sub.any(axis=0))[0]
        out.append(dict(x0=int(xx.min()), y0=int(y0), x1=int(xx.max()), y1=int(y1), px=int(sub.sum())))
    out.sort(key=lambda b: -b['px']); return out[:6]
out_all = {}
for tag in sys.argv[2:]:
    D = {s: f'{CAP}/{s}/{tag}' for s in ('before', 'after', 'before2', 'after2') if os.path.isdir(f'{CAP}/{s}/{tag}')}
    if not all(k in D for k in ('before', 'after', 'before2')): print('missing', tag); continue
    EV = f'{EVROOT}/{RUN}/{tag}'; os.makedirs(EV, exist_ok=True)
    names = sorted(set(f for x in D.values() for f in os.listdir(x) if f.endswith('.png')))
    rows = []
    for n in names:
        P = {s: f'{D[s]}/{n}' for s in D}
        if not all(os.path.exists(p) for p in P.values()):
            rows.append(dict(name=n, cls='MISSING', present={s: os.path.exists(p) for s, p in P.items()})); continue
        F = {s: load(p) for s, p in P.items()}
        BEF = [F['before'], F['before2']]; AFT = [F['after']] + ([F['after2']] if 'after2' in F else [])
        ra, d_ab, h, w = pair(F['after'], F['before'])
        rn, _, _, _ = pair(F['before2'], F['before'])
        ra2 = pair(F['after2'], F['before'])[0] if 'after2' in F else None
        raa = pair(F['after2'], F['after'])[0] if 'after2' in F else None
        sizes_ok = all(x.shape == BEF[0].shape for x in BEF + AFT)
        ident = ra['same_size'] and ra['strict_px'] == 0
        robust = np.zeros((h, w), bool); rb_px = None
        if sizes_ok:
            def dd(x, y): return np.abs(x - y).max(axis=2) > TOL
            bef_agree = ~dd(BEF[0], BEF[1]); aft_agree = ~dd(AFT[0], AFT[1]) if len(AFT) > 1 else np.ones((h, w), bool)
            differs = np.ones((h, w), bool)
            for a in AFT:
                for b in BEF: differs &= dd(a, b)
            robust = bef_agree & aft_agree & differs; rb_px = int(robust.sum())
        size_vs_noise = (not ra['same_size']) and rn['same_size']
        cls = 'identical' if ident else ('different' if (size_vs_noise or (rb_px is not None and rb_px > 50) or (rb_px is None)) else 'within noise')
        row = dict(name=n, cls=cls, sha={s: sha(p) for s, p in P.items()}, after_vs_before=ra, before2_vs_before=rn, after2_vs_before=ra2, after2_vs_after=raa, robust_px=rb_px, robust_bands=bands(robust))
        if not ident:
            m = robust if (rb_px or 0) > 0 else (d_ab > TOL if (d_ab > TOL).any() else d_ab > 0)
            base = (F['after'][:h, :w] * 0.35 + 255 * 0.65).astype(np.uint8); base[m[:h, :w]] = [255, 0, 0]
            Image.fromarray(base).save(f'{EV}/diff-{n}')
            if KEEP_RAW:
                for s, p in P.items(): shutil.copy(p, f'{EV}/{s}-{n}')
            bs = row['robust_bands'] or bands(m)
            if bs:
                b0 = bs[0]; pad = 20
                x0, x1 = max(0, b0['x0'] - pad), min(w, b0['x1'] + pad); y0, y1 = max(0, b0['y0'] - pad), min(h, b0['y1'] + pad)
                if y1 - y0 > 900: y1 = y0 + 900
                if x1 - x0 > 700: x1 = x0 + 700
                g = np.full((y1 - y0, 8, 3), 128, np.int16)
                Image.fromarray(np.concatenate([F['before'][y0:y1, x0:x1], g, F['after'][y0:y1, x0:x1], g, base[y0:y1, x0:x1].astype(np.int16)], axis=1).astype(np.uint8)).save(f'{EV}/crop-{n}')
                row['crop'] = f'crop-{n}'; row['crop_box'] = [x0, y0, x1, y1]
        rows.append(row)
    for s in D:
        for f in ('freeze.json', 'capture-meta.json', 'run.log'):
            if os.path.exists(f'{D[s]}/{f}'): shutil.copy(f'{D[s]}/{f}', f'{EV}/{s}-{f}')
    json.dump(rows, open(f'{EV}/pairs.json', 'w'), indent=1)
    out_all[tag] = rows
lines = []
for tag, rows in out_all.items():
    lines.append(f'### {RUN} / {tag}')
    lines.append('| state | size after / before | after vs before strict % / tol % | before2 vs before strict % / tol % | after2 vs after strict % / tol % | robust px | class | biggest robust band (x, y, px) |')
    lines.append('|---|---|---|---|---|---|---|---|')
    for r in rows:
        if r['cls'] == 'MISSING': lines.append(f"| {r['name']} | | | | | | MISSING {r['present']} | |"); continue
        a, n, aa = r['after_vs_before'], r['before2_vs_before'], r['after2_vs_after']
        bd = r['robust_bands'][0] if r['robust_bands'] else None
        lines.append(f"| {r['name']} | {a['a']} / {a['b']} | {a['strict']} / {a['tol']} | {n['strict']} / {n['tol']} | {(str(aa['strict']) + ' / ' + str(aa['tol'])) if aa else '-'} | {r['robust_px']} | **{r['cls']}** | {('x %d-%d, y %d-%d (%d)' % (bd['x0'], bd['x1'], bd['y0'], bd['y1'], bd['px'])) if bd else ''} |")
    lines.append('')
open(f'{EVROOT}/{RUN}/matrix.md', 'w').write('\n'.join(lines))
print('\n'.join(lines))
