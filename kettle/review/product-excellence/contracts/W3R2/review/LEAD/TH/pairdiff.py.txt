"""LEAD-5 (W3R2 TH): my own BEFORE/AFTER pixel diff over the maker's captures (stdlib only; decoder from
W3R1/review/LEAD/N/pngdiff.py). Per pair: identical (decoded pixels equal), else differing px (any channel > 0 and > 2),
max channel delta, bbox. Usage: python3 -I pairdiff.py <TH/shots> > out.txt"""
import os, sys
sys.path.insert(0, '/home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/LEAD/N')
from pngdiff import load

root = sys.argv[1]
rows = []
for cfg in sorted(os.listdir(os.path.join(root, 'before'))):
    for st in sorted(os.listdir(os.path.join(root, 'before', cfg))):
        a, b = os.path.join(root, 'before', cfg, st), os.path.join(root, 'after', cfg, st)
        if not os.path.exists(b):
            rows.append((cfg, st, 'MISSING')); continue
        wa, ha, ba, pa = load(a); wb, hb, bb, pb = load(b)
        if (wa, ha) != (wb, hb):
            rows.append((cfg, st, f'SIZE {wa}x{ha} vs {wb}x{hb}')); continue
        if ba == bb and pa == pb:
            rows.append((cfg, st, 'identical')); continue
        n = n2 = mx = 0; x0 = y0 = 10**9; x1 = y1 = -1
        sa, sb = wa * ba, wb * bb
        for y in range(ha):
            ra, rb = pa[y * sa:(y + 1) * sa], pb[y * sb:(y + 1) * sb]
            if ba == bb and ra == rb: continue
            for x in range(wa):
                d = max(abs(ra[x * ba + c] - rb[x * bb + c]) for c in range(3))
                if d:
                    n += 1; mx = max(mx, d)
                    if d > 2: n2 += 1
                    x0, y0, x1, y1 = min(x0, x), min(y0, y), max(x1, x), max(y1, y)
        rows.append((cfg, st, f'diff px {n} (>2 levels: {n2}) max {mx} bbox x{x0}-{x1} y{y0}-{y1}' if n else 'identical (alpha/format only)'))
ident = sum(1 for r in rows if r[2].startswith('identical'))
print(f'pairs {len(rows)}; identical {ident}; differing {len(rows) - ident}')
for r in rows:
    if not r[2].startswith('identical'): print(*r, sep=' | ')
