import sys, os, json, subprocess, shutil
CAP = '/home/user/wt/w5-final/kettle/.tmp/LR-capF'
EV = '/home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/FINAL/cap'
PD = '/home/user/Vibei/kettle/review/product-excellence/contracts/W2/review/LR/logs/pdiff.py'
env = dict(os.environ, PYTHONPATH='/tmp/claude-0/lr-pylib')
tags = sys.argv[1:]
allrows = {}
def run(a, b, d):
    out = subprocess.run(['python3', PD, a, b, d], capture_output=True, text=True, env=env)
    if out.returncode: print('pdiff failed', out.stderr[-300:]); return None
    return {r['name']: r for r in json.loads(out.stdout)}
for tag in tags:
    t, c, c2 = f'{CAP}/trial/{tag}', f'{CAP}/ctrl/{tag}', f'{CAP}/ctrl2/{tag}'
    if not all(os.path.isdir(x) for x in (t, c, c2)): print('missing', tag); continue
    T = run(t, c, f'{CAP}/diff/{tag}'); N = run(c2, c, f'{CAP}/noise/{tag}')
    if T is None or N is None: continue
    os.makedirs(f'{EV}/{tag}', exist_ok=True)
    rows = []
    for name, r in T.items():
        n = N.get(name, {})
        ts, tt = r.get('pct_strict', 100), r.get('pct_tol', 100)
        ns, nt = n.get('pct_strict', 100), n.get('pct_tol', 100)
        over05 = r.get('status') == 'MISSING' or ts > 0.5 or tt > 0.5
        size_diff = r.get('status') == 'SIZE'
        noise_size_diff = n.get('status') == 'SIZE'
        over_noise = over05 and (tt > nt + 0.25 or ts > ns + 0.5 or (size_diff and not noise_size_diff))
        rows.append(dict(name=name, trial_vs_base_strict=ts, trial_vs_base_tol=tt, trial_size=r.get('trial_size'), base_size=r.get('ctrl_size'), bbox=r.get('bbox'),
                         base_vs_base_strict=ns, base_vs_base_tol=nt, base2_size=n.get('trial_size'), over_0_5=over05, over_noise=over_noise))
        if over05 or ns > 0.5 or nt > 0.5:
            for side, src in (('trial', t), ('ctrl', c), ('ctrl2', c2)):
                if over_noise or side != 'ctrl2':
                    if os.path.exists(f'{src}/{name}') and (over_noise or over05): shutil.copy(f'{src}/{name}', f'{EV}/{tag}/{side}-{name}')
            dn = name.replace('.png', '-diff.png')
            if os.path.exists(f'{CAP}/diff/{tag}/{dn}'): shutil.copy(f'{CAP}/diff/{tag}/{dn}', f'{EV}/{tag}/{dn}')
    for side in ('trial', 'ctrl', 'ctrl2'):
        for f in ('freeze.json', 'capture-meta.json', 'run.log'):
            p = f'{CAP}/{side}/{tag}/{f}'
            if os.path.exists(p): shutil.copy(p, f'{EV}/{tag}/{side}-{f}')
    json.dump(rows, open(f'{EV}/{tag}/pairs.json', 'w'), indent=1)
    allrows[tag] = rows
lines = []
for tag, rows in allrows.items():
    lines.append(f"### {tag}: {len(rows)} pairs, {sum(r['over_0_5'] for r in rows)} over 0.5 % (trial vs base), {sum(r['over_noise'] for r in rows)} over the base-vs-base noise")
    lines.append('| state | trial vs base strict / tol | base vs base strict / tol | sizes trial / base / base2 | over 0.5 | over noise |')
    lines.append('|---|---|---|---|---|---|')
    for r in rows:
        lines.append(f"| {r['name']} | {r['trial_vs_base_strict']} / {r['trial_vs_base_tol']} | {r['base_vs_base_strict']} / {r['base_vs_base_tol']} | {r['trial_size']} / {r['base_size']} / {r['base2_size']} | {'yes' if r['over_0_5'] else ''} | {'**yes**' if r['over_noise'] else ''} |")
    lines.append('')
open(f'{EV}/matrix-{"-".join(t.replace("@","at") for t in tags)}.md', 'w').write('\n'.join(lines))
print('\n'.join(lines))
