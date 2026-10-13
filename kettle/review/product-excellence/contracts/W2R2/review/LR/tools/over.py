#!/usr/bin/env python3
# usage: over.py <logsDir> <tag>... -> markdown list of pairs over 0.5 % (tolerance-16 share, and strict-only)
import sys, json, re
logs = sys.argv[1]
prim, strict_only = [], []
for tag in sys.argv[2:]:
    try: rows = json.load(open(f'{logs}/pdiff-{tag}.json'))
    except Exception: print(f'(no pdiff for {tag})'); continue
    dpr = float(re.search(r'@(\d+)', tag).group(1))
    for x in rows:
        if x['status'] == 'MISSING': prim.append((tag, x['name'][:-4], 'MISSING', '', '', '')); continue
        bb = x.get('bbox'); bbs = '-' if not bb else f"{bb[0]/dpr:.0f},{bb[1]/dpr:.0f}-{bb[2]/dpr:.0f},{bb[3]/dpr:.0f}"
        size = x['trial_size'] if x['status'] == 'OK' else f"{x['trial_size']} vs {x['ctrl_size']}"
        if x['pct_tol'] > 0.5 or x['status'] == 'SIZE': prim.append((tag, x['name'][:-4], size, x['pct_tol'], x['pct_strict'], bbs))
        elif x['pct_strict'] > 0.5: strict_only.append((tag, x['name'][:-4], size, x['pct_tol'], x['pct_strict'], bbs))
print('#### Over 0.5 % at tolerance 16 (or sizes differ)\n')
print('| config | state | image size (px) | % over tol 16 | % strict | differing-pixel bbox (CSS px) |'); print('|---|---|---|---|---|---|')
for r in prim: print('| ' + ' | '.join(str(v) for v in r) + ' |')
print('\n#### Over 0.5 % only when strict (any channel change > 0), under 0.5 % at tolerance 16\n')
print('| config | state | image size (px) | % over tol 16 | % strict | differing-pixel bbox at tol 16 (CSS px) |'); print('|---|---|---|---|---|---|')
for r in strict_only: print('| ' + ' | '.join(str(v) for v in r) + ' |')
