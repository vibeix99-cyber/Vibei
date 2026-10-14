import sys, os, json, subprocess, shutil
CAP = '/home/user/wt/w5tr-all/kettle/.tmp/LR-cap'
EV = '/home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/LR/ALL/cap'
PD = '/home/user/Vibei/kettle/review/product-excellence/contracts/W2/review/LR/logs/pdiff.py'
env = dict(os.environ, PYTHONPATH='/tmp/claude-0/lr-pylib')
tags = sys.argv[1:] or sorted(os.listdir(CAP + '/trial'))
allrows = {}
for tag in tags:
    t, c = f'{CAP}/trial/{tag}', f'{CAP}/ctrl/{tag}'
    if not (os.path.isdir(t) and os.path.isdir(c)): continue
    d = f'{CAP}/diff/{tag}'
    out = subprocess.run(['python3', PD, t, c, d], capture_output=True, text=True, env=env)
    if out.returncode: print(tag, 'pdiff failed', out.stderr[-300:]); continue
    rows = json.loads(out.stdout)
    allrows[tag] = rows
    os.makedirs(f'{EV}/{tag}', exist_ok=True)
    json.dump(rows, open(f'{EV}/{tag}/pdiff.json', 'w'), indent=1)
    for r in rows:
        if r.get('status') == 'MISSING' or r.get('pct_strict', 0) > 0.5 or r.get('pct_tol', 0) > 0.5:
            n = r['name']
            for side, src in (('trial', t), ('ctrl', c)):
                if os.path.exists(f'{src}/{n}'): shutil.copy(f'{src}/{n}', f'{EV}/{tag}/{side}-{n}')
            dn = n.replace('.png', '-diff.png')
            if os.path.exists(f'{d}/{dn}'): shutil.copy(f'{d}/{dn}', f'{EV}/{tag}/{dn}')
    for side in ('trial', 'ctrl'):
        for f in ('freeze.json', 'capture-meta.json', 'run.log'):
            p = f'{CAP}/{side}/{tag}/{f}'
            if os.path.exists(p): shutil.copy(p, f'{EV}/{tag}/{side}-{f}')
json.dump(allrows, open(f'{EV}/pdiff-all.json', 'w'), indent=1)
# matrix
lines = []
for tag, rows in allrows.items():
    over = [r for r in rows if r.get('status') == 'MISSING' or r.get('pct_strict', 0) > 0.5 or r.get('pct_tol', 0) > 0.5]
    lines.append(f'### {tag}: {len(rows)} pairs, {len(over)} over 0.5 %')
    lines.append('| state | status | size trial / ctrl | pct_strict | pct_tol(16) | bbox |')
    lines.append('|---|---|---|---|---|---|')
    for r in rows:
        flag = ' **>0.5**' if r in over else ''
        lines.append(f"| {r['name']}{flag} | {r['status']} | {r.get('trial_size','-')} / {r.get('ctrl_size','-')} | {r.get('pct_strict','-')} | {r.get('pct_tol','-')} | {r.get('bbox','-')} |")
    lines.append('')
open(f'{EV}/matrix.md', 'w').write('\n'.join(lines))
print('\n'.join(lines))
