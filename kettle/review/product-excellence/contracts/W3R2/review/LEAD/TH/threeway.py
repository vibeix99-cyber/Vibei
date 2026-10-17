"""LEAD-5 (W3R2 TH): for every BEFORE/AFTER pair that is not pixel-identical, compare AFTER with the second base capture
(BEFORE2, the maker's git-ignored .tmp/th/shots3/before2) and BEFORE with BEFORE2. If AFTER equals one of the two base
captures (within 2 levels), the build did not change that frame. Usage: python3 -I threeway.py <shots3 dir> <pairs list>"""
import os, sys
sys.path.insert(0, '/home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/LEAD/N')
from pngdiff import load

def cmp(a, b):
    wa, ha, ba, pa = load(a); wb, hb, bb, pb = load(b)
    if (wa, ha) != (wb, hb): return ('size', 0)
    n = mx = 0; sa, sb = wa * ba, wb * bb
    for y in range(ha):
        ra, rb = pa[y * sa:(y + 1) * sa], pb[y * sb:(y + 1) * sb]
        if ba == bb and ra == rb: continue
        for x in range(wa):
            d = max(abs(ra[x * ba + c] - rb[x * bb + c]) for c in range(3))
            if d > 2: n += 1
            if d > mx: mx = d
    return (n, mx)

root = sys.argv[1]
print('cfg/state | AFTER vs BEFORE (px>2, max) | AFTER vs BEFORE2 | BEFORE vs BEFORE2 | reading')
for line in open(sys.argv[2]):
    if '|' not in line or line.startswith('pairs'): continue
    cfg, st = [s.strip() for s in line.split('|')[:2]]
    f = lambda k: os.path.join(root, k, cfg, st)
    ab, a2, b2 = cmp(f('after'), f('before')), cmp(f('after'), f('before2')), cmp(f('before'), f('before2'))
    best = min(ab[0], a2[0])
    reading = 'AFTER = a base capture (<=2 levels)' if best == 0 else ('AFTER within base-vs-base spread' if best <= b2[0] else 'AFTER differs from both base captures more than they differ from each other')
    print(f'{cfg}/{st} | {ab[0]}, {ab[1]} | {a2[0]}, {a2[1]} | {b2[0]}, {b2[1]} | {reading}')
