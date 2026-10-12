"""Acceptance table from cap.mjs metas (W2 Maker S).

python3 -I accept.py <captures-dir> <label> <out.md>
Per configuration and day: lines cut by the fold on arrival (1.5 s / 4 s and settled), elementFromPoint misses,
pairwise box overlaps, footer controls hit-testable, Chai's share above the sheet, the final expanded line against the
footer (end state), axe violations (settled, end).
"""
import json, os, sys

root, label, out = sys.argv[1:4]
rows = []
tot = {'cut': 0, 'occl': 0, 'ovl': 0, 'foot': 0, 'end': 0, 'axe': 0}
for cfg in sorted(os.listdir(root)):
    mp = os.path.join(root, cfg, 'meta.json')
    if not os.path.isfile(mp):
        continue
    M = json.load(open(mp)); st = M['states']
    for day in ('routine', 'bigday'):
        first, settled, end = st.get(f'07-summary-{day}', {}), st.get(f'07-summary-{day}-settled', {}), st.get(f'07-summary-{day}-end', {})
        cuts = [f"{c['kind']}" for c in first.get('cut', [])] + [f"{c['kind']}(settled)" for c in settled.get('cut', [])]
        occl = len(first.get('occluded', [])) + len(settled.get('occluded', [])) + len(end.get('occluded', []))
        ovl = len(first.get('overlaps', [])) + len(settled.get('overlaps', [])) + len(end.get('overlaps', []))
        foot = all(b['hit'] and b['inView'] for s in (first, settled, end) for b in s.get('footerButtons', [])) and bool(settled.get('footerButtons'))
        last = end.get('lastUnit') or {}
        F, fade = end.get('F'), end.get('fade')
        endok = last.get('status') in ('clear', 'cut-top') and last.get('bottom', 1e9) <= (F or 0) - (fade or 0) + 0.5 and last.get('kind', '').startswith('details')
        endcut = [c['kind'] for c in end.get('cut', [])]
        axe = (len(settled.get('axe', [])), len(end.get('axe', [])))
        chai = (first.get('chai') or {}).get('shownAboveSheet'), (settled.get('chai') or {}).get('shownAboveSheet')
        tot['cut'] += len(cuts); tot['occl'] += occl; tot['ovl'] += ovl; tot['foot'] += 0 if foot else 1; tot['end'] += 0 if endok and not endcut else 1; tot['axe'] += sum(axe)
        rev = (settled.get('rev') or M.get('rev', '')).split(' ')[0]
        rows.append(f"| {cfg} | {day} | {rev} | {', '.join(cuts) or '0'} | {occl} | {ovl} | {'yes' if foot else '**no**'} | {chai[0]} / {chai[1]} | {last.get('kind')} bottom {last.get('bottom')} ≤ {F}−{fade} → {'clear' if endok else '**not clear**'}{' (end cut: ' + ', '.join(endcut) + ')' if endcut else ''} | {axe[0]} / {axe[1]} |")
with open(out, 'w') as f:
    f.write(f'**{label}**\n\n| Configuration | Day | Rev | Lines cut by the fold on arrival (1.5/4 s, settled) | elementFromPoint misses | Box overlaps | Tea time + Skip hit-testable | Chai above the sheet (arrival / settled) | Final expanded line vs the footer | axe (settled / end) |\n|---|---|---|---|---|---|---|---|---|---|\n')
    f.write('\n'.join(rows) + '\n')
    f.write(f"\nTotals: cut lines {tot['cut']}, misses {tot['occl']}, overlaps {tot['ovl']}, footer failures {tot['foot']}, end-state failures {tot['end']}, axe violations {tot['axe']}.\n")
print('\n'.join(rows)); print(tot)
