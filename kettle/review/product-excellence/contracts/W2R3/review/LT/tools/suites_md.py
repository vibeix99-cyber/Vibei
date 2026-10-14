import re, os, json
R='/home/user/Vibei/kettle/review/product-excellence/contracts/W2R3/review/LT/runs/'
def parse(log):
    if not os.path.exists(log): return None
    t=open(log, errors='replace').read()
    t=re.sub(r'\x1b\[[0-9;]*m','',t)
    res=[]
    for m in re.finditer(r'^\s+([✓✘-])\s+\d+ \[chromium\] › (tests/[\w.-]+:\d+:\d+) › (.+?)(?: \(([\d.]+m?s)\))?$', t, re.M):
        res.append((m.group(1), m.group(2), m.group(3)[:150], m.group(4)))
    summ=' / '.join(x.strip() for x in re.findall(r'^\s+(\d+ (?:passed|failed|flaky|skipped|did not run|interrupted).*)$', t, re.M))
    errs=re.findall(r'^\s+(Error: .+)$', t, re.M)
    return res, summ, errs
out6=[]; out56=[]
for name, log in [('toast-room.spec.ts', R+'suite-toast-room.log')]:
    p=parse(log)
    if not p: out6.append(f'- `{name}`: not run'); continue
    res, summ, errs = p
    out6.append(f'### `{name}` (log `runs/suite-toast-room.log`)\n\nSummary line(s): {summ or "(run not finished at receipt time)"}\n')
    out6.append('| Result | Test | Time |\n|---|---|---|')
    for r in res: out6.append(f'| {r[0]} | `{r[1]}` {r[2]} | {r[3]} |')
    for e in errs: out6.append(f'- failure: `{e[:300]}`')
open('/tmp/claude-0/lt3-s6.md','w').write('\n'.join(out6))
p=parse(R+'notice-strip-5476-w1.log')
ns=['### 1.4 `notice-strip.spec.ts` once on :5476\n', '`KETTLE_PORT=5476 npx playwright test tests/notice-strip.spec.ts --project=chromium --workers=1 --output=/tmp/claude-0/lt3-out-ns` (workers=1, not 2: see §7). Log `runs/notice-strip-5476-w1.log`.\n']
if p:
    res, summ, errs = p
    ns.append(f'Summary line(s): {summ or "(run not finished at receipt time)"}; results recorded: {sum(1 for r in res if r[0]=="✓")} passed, {sum(1 for r in res if r[0]=="✘")} failed of {len(res)} reported.\n')
    ns.append('| Result | Configuration | Time |\n|---|---|---|')
    for r in res: ns.append(f'| {r[0]} | {re.sub(r"^.*real input ","",r[2])} | {r[3]} |')
    for e in errs: ns.append(f'- failure: `{e[:300]}`')
else:
    ns.append('Not started.')
open('/home/user/Vibei/kettle/review/product-excellence/contracts/W2R3/review/LT/RECEIPT-LT.ns.md','w').write('\n'.join(ns)+'\n')
