#!/usr/bin/env python3
# usage: summ.py <capRoot> <logsDir> <cfgtag>...   -> runs pdiff per cfg, writes <logsDir>/pdiff-<tag>.json and prints a markdown matrix
import sys, os, json, subprocess, re
root, logs = sys.argv[1], sys.argv[2]
PD = '/home/user/Vibei/kettle/review/product-excellence/contracts/W2/review/LR/logs/pdiff.py'
env = dict(os.environ, PYTHONPATH='/tmp/claude-0/lr-pylib')
for tag in sys.argv[3:]:
    t, c = f'{root}/trial/{tag}', f'{root}/ctrl/{tag}'
    d = f'{root}/diff/{tag}'
    r = subprocess.run(['python3', PD, t, c, d, '16'], capture_output=True, text=True, env=env)
    if r.returncode: print(tag, 'pdiff failed', r.stderr[-500:]); continue
    rows = json.loads(r.stdout)
    json.dump(rows, open(f'{logs}/pdiff-{tag}.json', 'w'), indent=1)
    dpr = float(re.search(r'@(\d+)', tag).group(1))
    print(f'\n### {tag}  (tolerance 16 per channel-max; pct = share of pixels differing)\n')
    print('| state | size trial | size ctrl | % strict (>0) | % over tol 16 | bbox (CSS px x0,y0-x1,y1) |')
    print('|---|---|---|---|---|---|')
    for x in rows:
        if x['status'] == 'MISSING': print(f"| {x['name']} | MISSING (trial={x['trial']}, ctrl={x['ctrl']}) | | | | |"); continue
        bb = x.get('bbox'); bbs = '-' if not bb else f"{bb[0]/dpr:.0f},{bb[1]/dpr:.0f}-{bb[2]/dpr:.0f},{bb[3]/dpr:.0f}"
        print(f"| {x['name'][:-4]} | {x['trial_size']} | {x['ctrl_size']}{' (SIZE DIFF)' if x['status']=='SIZE' else ''} | {x['pct_strict']} | {x['pct_tol']} | {bbs} |")
