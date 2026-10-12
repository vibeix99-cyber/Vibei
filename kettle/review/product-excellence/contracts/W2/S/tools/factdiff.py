"""Fact-reachability diff, BEFORE vs AFTER, per configuration and day (W2 Maker S).

python3 -I factdiff.py <before-dir> <after-dir> <out.md> <out.json>
AFTER metas come from cap.mjs (`facts`: every reward line's visible text, the unlock's title and line, the heading
and its line; in the -end state, with the arithmetic open, every arithmetic row and the level line and note).
BEFORE metas may be cap.mjs metas (same `facts`) or the orchestrator's before.mjs metas (`pills`: each reward line's
text incl. its screen-reader wording and the digits drawn in its art). For the latter, a BEFORE pill is matched when an
AFTER reward line's visible text (or its title, for the highlight) is contained in it.
A BEFORE fact is "reachable" in AFTER when it is matched by any AFTER state of the same day.
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
        af = []
        for k, v in A['states'].items():
            if day in k: af += [norm(x) for x in v.get('facts', [])]
        aset = list(dict.fromkeys(af))
        bstates = {k: v for k, v in B['states'].items() if day in k}
        if any('facts' in v for v in bstates.values()):
            bset = list(dict.fromkeys(norm(x) for v in bstates.values() for x in v.get('facts', [])))
            joined = ' ‖ '.join(aset)
            missing = [f for f in bset if f and f not in joined]
            mode = 'verbatim'
        else:
            bset = list(dict.fromkeys(norm(p['text']) for v in bstates.values() for p in v.get('pills', [])))
            missing = [f for f in bset if not any(a and (a in f) for a in aset)]
            mode = 'pill text (orchestrator BEFORE: incl. screen-reader wording)'
        bj = ' ‖ '.join(bset)
        added = [f for f in aset if f and f not in bj and not any(f in b for b in bset)] if mode == 'verbatim' else ['(BEFORE set recorded reward lines only)']
        report[f'{cfg}/{day}'] = {'mode': mode, 'before': bset, 'after': aset, 'missing': missing, 'added': added}
        rows.append(f'| {cfg} | {day} | {len(bset)} | {len(aset)} | **{len(missing)}**{" — " + "; ".join(missing) if missing else ""} | {"; ".join(added) or "—"} |')
json.dump(report, open(out_json, 'w'), indent=1, ensure_ascii=False)
with open(out_md, 'w') as f:
    f.write('| Configuration | Day | BEFORE facts | AFTER facts | BEFORE facts not reachable in AFTER | Only in AFTER |\n|---|---|---|---|---|---|\n')
    f.write('\n'.join(rows) + '\n')
print('\n'.join(rows))
print('total missing', sum(len(v['missing']) for v in report.values()))
