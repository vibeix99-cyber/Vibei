import re
R = '/home/user/Vibei/kettle/review/product-excellence/contracts/W2R2/review/LRC'
def lines(p):
    try: return open(p).read().splitlines()
    except Exception: return []
full = lines(f'{R}/runs/check6-full-chromium.txt')
per = {}
for l in full:
    m = re.match(r'\s+(✓|✘|-)\s+\d+ \[chromium\] › tests/([\w.-]+\.spec\.ts)', l)
    if m: per.setdefault(m.group(2), {'✓': 0, '✘': 0, '-': 0})[m.group(1)] += 1
summ = [l for l in full if re.search(r'\d+ (passed|failed|did not run|skipped)', l)]
start = [l for l in full if l.startswith('START')]; exit_ = [l for l in full if l.startswith('EXIT')]
o = []
o.append('Command: `KETTLE_PORT=5460 npx playwright test --project=chromium --workers=2 --output=/tmp/claude-0/lrc-scratch/out-full` (gate `--n 2`), %s, %s. Machine load was 3 to 14 (check 2 run 2, the unlock-ready supplement and this suite overlapped until about 19:33).' % (start[0] if start else '?', exit_[0] if exit_ else '?'))
o.append('')
o.append('**Result: 106 passed, 1 failed, 7 did not run, 114 total** (Playwright: `1 failed`, `7 did not run`, `106 passed (17.5m)`, exit 1). Log: `runs/check6-full-chromium.txt`.')
o.append('')
o.append('| spec file | passed | failed | not run (listed) |')
o.append('|---|---|---|---|')
for f, c in sorted(per.items()): o.append(f'| `{f}` | {c["✓"]} | {c["✘"]} | {c["-"]} |')
o.append('')
o.append('The one failure: `tests/a11y.spec.ts:109` "short screen (375×667): every control can be scrolled clear of sticky chrome, no sideways scroll", 51.8 s, between about 19:22 and 19:25, while three of my browser jobs were running (load average 11 to 14). The assertion `expect(out).toEqual([])` received 16 entries, all on the settings page, of the form `settings: "Trailing pothos" stays under h2._groupTitle_...` (the list: Time of day, Window, Trailing pothos, Stack of books, Floor cushion, Fairy lights, Wall shelf, Tea set, Record player, Knitted blanket, Mountain painting, Paper lantern, and four "Locked. Unlocks at cozy level 14/16/18/20" rows). The 7 "did not run" are the remaining tests of `a11y.spec.ts` that follow it in the file (the file runs serially). Trace: `/tmp/claude-0/lrc-scratch/out-full/a11y-short-screen-.../trace.zip`.')
o.append('')
o.append('Rerun alone (the whole `a11y.spec.ts`, 11 tests, one worker, nothing else of mine running except the other side of this pair):')
o.append('')
o.append('| Where | Command | Start | End | Result | 109 (the failed case) | Log |')
o.append('|---|---|---|---|---|---|---|')
for label, port, f in (('trial `:5460`', 5460, 'rerun-a11y-trial-5460.txt'), ('control `:5410`', 5410, 'rerun-a11y-control-5410.txt')):
    L = lines(f'{R}/runs/{f}')
    st = next((l.split()[1] for l in L if l.startswith('START')), '?'); en = next((l.split()[2] for l in L if l.startswith('EXIT')), 'still running at write time')
    res = ' / '.join(l.strip() for l in L if re.search(r'^\s+\d+ (passed|failed|did not run|skipped)', l)) or 'not finished at write time'
    c109 = next((l.strip()[:3] + ' ' + re.search(r'\(([\d.]+m?s)\)', l).group(1) for l in L if 'a11y.spec.ts:109' in l and re.search(r'\(([\d.]+m?s)\)', l)), 'n/a')
    o.append(f'| {label} | `KETTLE_PORT={port} npx playwright test tests/a11y.spec.ts --project=chromium --workers=1` | {st} | {en} | {res} | {c109} | `runs/{f}` |')
open(f'{R}/summaries/check6.md', 'w').write('\n'.join(o) + '\n')
print('\n'.join(o))
