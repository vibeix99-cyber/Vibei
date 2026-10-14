"""LEAD-5 · W3R1 G: sample the Nudges (blocked) and Tea breaks (live) row fills at rest / hover / pressed
in the maker's control-state sheets (1440x900@2). Columns: rest x=450, hover x=880, pressed x=1600; rows y=540 / 478."""
import json, sys
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from pngdiff import load
C = '/home/user/wt/w5g/kettle/review/product-excellence/contracts/W3R1/G/controls/'
out = {}
for n in ['base-states-light.png', 'after-states-light.png', 'base-states-dark.png', 'after-states-dark.png']:
    W, H, b, px = load(C + n)
    p = lambda x, y: list(px[(y * W + x) * b:(y * W + x) * b + 3])
    out[n] = {row: {col: p(x, y) for col, x in (('rest', 450), ('hover', 880), ('pressed', 1600))} for row, y in (('nudges_blocked', 540), ('teabreaks_live', 478))}
json.dump(out, open(__file__.rsplit('/', 1)[0] + '/rowfill.json', 'w'), indent=1)
print(json.dumps(out))
