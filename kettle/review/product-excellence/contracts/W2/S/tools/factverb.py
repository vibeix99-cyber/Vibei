"""Verbatim fact diff at 375×667: 90a11e5 control probe (settled + end with the arithmetic open) vs AFTER captures."""
import json, re, sys
E = '/home/user/wt/w2s/kettle/review/product-excellence/contracts/W2/S'
norm = lambda t: re.sub(r'\s+', ' ', t or '').strip()
ctl = json.load(open(f'{E}/control/ctl-90a11e5-5310.json'))
rows = []
for r in ctl:
    cfg = r['cfg']; day = r['day']
    w, h = cfg.split(':')[0].split('x'); theme = cfg.split(':')[1]; text = cfg.split(':')[2]
    A = json.load(open(f'{E}/captures/AFTER/{w}x{h}-{theme}-t{text}/meta.json'))['states']
    bset = list(dict.fromkeys(norm(x) for k in ('settled', 'end') for x in (r.get(k) or {}).get('facts', [])))
    aset = list(dict.fromkeys(norm(x) for k, v in A.items() if day in k for x in v.get('facts', [])))
    j = ' ‖ '.join(aset)
    missing = [f for f in bset if f not in j]
    added = [f for f in aset if f not in ' ‖ '.join(bset)]
    rev = (A.get(f'07-summary-{day}-settled', {}).get('rev') or 'meta').split(' ')[0]
    rows.append(f"| {w}x{h}-{theme}-t{text} | {day} | {len(bset)} | {len(aset)} | **{len(missing)}**{' — ' + '; '.join(missing) if missing else ''} | {'; '.join(added) or '—'} |")
out = '**Verbatim, every fact including the unlock card and the arithmetic** (90a11e5 from the control probe in this session, settled + end with the arithmetic open; AFTER from the captures):\n\n| Configuration | Day | 90a11e5 facts | AFTER facts | Not reachable in AFTER | Only in AFTER |\n|---|---|---|---|---|---|\n' + '\n'.join(rows) + '\n\n**Reward lines, all 16 configurations** (the orchestrator\'s BEFORE set recorded reward lines with their screen-reader wording; each must contain an AFTER reward line):\n'
open(f'{E}/facts-verbatim-375x667.md', 'w').write(out)
print(out)
