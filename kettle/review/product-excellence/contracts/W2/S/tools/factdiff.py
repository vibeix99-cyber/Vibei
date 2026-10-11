"""Fact-reachability diff, BEFORE vs AFTER, per configuration and day (W2 Maker S).

python3 -I factdiff.py <before-dir> <after-dir> <out.md> <out.json>
Each dir holds <WxH-theme-tNNN>/meta.json written by cap.mjs (measureInPage: `facts` = every reward line, the unlock's
title and line, the heading and its line, and — in the -end state, with the arithmetic open — every arithmetic row).
A BEFORE fact is "reachable" in AFTER when it appears verbatim in any AFTER state of the same day.
"""
import json, os, re, sys

bdir, adir, out_md, out_json = sys.argv[1:5]
norm = lambda t: re.sub(r'\s+', ' ', t or '').strip()
rows, report = [], {}
for cfg in sorted(os.listdir(adir)):
    ap, bp = os.path.join(adir, cfg, 'meta.json'), os.path.join(bdir, cfg, 'meta.json')
    if not (os.path.isfile(ap) and os.path.isfile(bp)):
        continue
    A, B = json.load(open(ap)), json.load(open(bp))
    for day in ('routine', 'bigday'):
        bf, af = [], []
        for k, v in B['states'].items():
            if day in k: bf += [norm(x) for x in v.get('facts', [])]
        for k, v in A['states'].items():
            if day in k: af += [norm(x) for x in v.get('facts', [])]
        bset, aset = list(dict.fromkeys(bf)), list(dict.fromkeys(af))
        joined = ' ‖ '.join(aset)
        missing = [f for f in bset if f and f not in joined]
        bj = ' ‖ '.join(bset)
        added = [f for f in aset if f and f not in bj]
        report[f'{cfg}/{day}'] = {'before': bset, 'after': aset, 'missing': missing, 'added': added}
        rows.append(f'| {cfg} | {day} | {len(bset)} | {len(aset)} | **{len(missing)}** | {"; ".join(added) or "—"} |')
json.dump(report, open(out_json, 'w'), indent=1, ensure_ascii=False)
with open(out_md, 'w') as f:
    f.write('| Configuration | Day | BEFORE facts | AFTER facts | BEFORE facts not reachable in AFTER | Added in AFTER |\n|---|---|---|---|---|---|\n')
    f.write('\n'.join(rows) + '\n')
print('\n'.join(rows))
print('total missing', sum(len(v['missing']) for v in report.values()))
