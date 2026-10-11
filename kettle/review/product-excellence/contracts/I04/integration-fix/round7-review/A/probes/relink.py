#!/usr/bin/env python3
"""Lane A: offline re-judgement of R5 control runs with a wider R5-D1 link (departure while the list was scrolled in the
previous 1500 ms, i.e. 'or shortly after it was scrolled back', CHECKER-r5 R5-D1 wording; bad frame within 1000 ms after it,
outside the entry phase). Read-only."""
import json, glob, os
WARN = 'toast-kettle:save-failed'
R = '/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/A/runs'
for d in sorted(glob.glob(f'{R}/r5d1-*-ctl-*')):
    n = rep = strict = 0
    for p in glob.glob(f'{d}/natural-*.jsonl'):
        for l in open(p):
            r = json.loads(l); n += 1
            fr = r['frames']
            adds = [e[0] for e in r['ev'] if e[2] == WARN and e[1] == '+']
            if not adds: continue
            entryEnd = max([adds[0] + 1200] + [x + 900 for x in adds[1:] if x <= adds[0] + 2000])
            deps = [e[0] for e in r['ev'] if e[1] == '-' and e[2] not in (WARN, 'banner')]
            depS = [t for t in deps if any(t - 1500 <= f[0] <= t and f[7] is not None and abs(f[7]) > 1 for f in fr)]
            bad = [f[0] for f in fr if f[8] != 'B' and f[0] >= entryEnd and (f[2] < 0.98 or (f[4] is not None and f[4] > min(f[5], f[6]) + 0.5))]
            linked = [t for t in bad if any(d0 <= t <= d0 + 1000 for d0 in depS)]
            if linked: rep += 1
            if r.get('r5d1Strict', {}).get('reproduced'): strict += 1
    print(f'{os.path.basename(d)}: runs {n}, strict(300 ms) {strict}, wide-link(1500 ms) {rep}')
