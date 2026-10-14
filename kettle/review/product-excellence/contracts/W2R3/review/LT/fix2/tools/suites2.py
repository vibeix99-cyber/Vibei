import re, os
R='/home/user/Vibei/kettle/review/product-excellence/contracts/W2R3/review/LT/fix2/runs/'
times = {}
for l in open(R+'suites.log'):
    m = re.match(r'(\S+) (start|end) (\S+)', l)
    if m: times.setdefault(m.group(1), {})[m.group(2)] = m.group(3)
out = ['| Spec | Run (UTC) | Result (Playwright summary line) | Failures |', '|---|---|---|---|']
details = []
for S in ['summary-notice', 'toast-room', 'a11y', 'notice-strip']:
    log = R + f'suite-{S}.log'
    if not os.path.exists(log): out.append(f'| `{S}.spec.ts` | — | not run | |'); continue
    t = re.sub(r'\x1b\[[0-9;]*m', '', open(log, errors='replace').read())
    res = re.findall(r'^\s+([✓✘-])\s+\d+ \[chromium\] › (tests/[\w.-]+:\d+:\d+) › (.+?)(?: \(([\d.]+m?s)\))?$', t, re.M)
    summ = '; '.join(x.strip() for x in re.findall(r'^\s+(\d+ (?:passed|failed|flaky|skipped|did not run|interrupted)[^\n]*)$', t, re.M)) or f'(running: {len(res)} reported so far)'
    fails = [r for r in res if r[0] == '✘']
    tm = times.get(S, {})
    out.append(f"| `{S}.spec.ts` | {tm.get('start','?')}–{tm.get('end','running')} | {summ} | {'; '.join(f'`{f[1]}` {f[2][-60:]} ({f[3]})' for f in fails) or '—'} |")
    blocks = re.split(r'\n\s+\d+\) \[chromium\]', t)
    for b in blocks[1:]:
        details.append(f'**`{S}`** failure:\n```\n' + b.strip()[:1800] + '\n```')
    details.append(f'`{S}` per test: ' + ', '.join(f"{r[0]} {r[2].split('(')[-1].rstrip(')') if '(' in r[2] else r[2][:50]}" for r in res))
open('/tmp/claude-0/lt4-suites.md', 'w').write('\n'.join(out) + '\n\n' + '\n\n'.join(details))
print('\n'.join(out))
