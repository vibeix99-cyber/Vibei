#!/usr/bin/env python3
"""Emit the 2a table (control vs P reward texts) for the receipt from check1 (+ check1m) data."""
import json, os, glob
LP = '/home/user/Vibei/kettle/review/product-excellence/contracts/W2R2/review/LP'
def esc(x): return str(x).replace('|', '\\|')
print('| day | element | control `b377c62` | P trial | same? |')
print('|---|---|---|---|---|')
for day, base in [('routine', f'{LP}/check1/375x667-light-t100/'), ('task', f'{LP}/check1/375x667-light-t100/'), ('big', f'{LP}/check1/375x667-light-t100/'), ('milestone', f'{LP}/check1m/375x667-light-t100/')]:
    if not os.path.exists(base + f'C-{day}.json') or not os.path.exists(base + f'P-{day}.json'): continue
    C = json.load(open(base + f'C-{day}.json')); P = json.load(open(base + f'P-{day}.json'))
    c, p, c0, p0 = C['settled']['copy'], P['settled']['copy'], C['end']['copy'], P['end']['copy']
    def row(name, a, b):
        print(f"| {day} | {name} | {esc(a)} | {esc(b)} | {'yes' if a == b else '**NO**'} |")
    row('reward pills (textContent of each Rewards `li`)', ' ‖ '.join(c['pills']), ' ‖ '.join(p['pills']))
    row('headline / sub', ' / '.join(c['visible'].split('\n')[:2]), ' / '.join(p['visible'].split('\n')[:2]))
    row('sr-only strings', ' ‖ '.join(c['srOnly']), ' ‖ '.join(p['srOnly']))
    row('live announcement (role=status)', c['said'], p['said'])
    row('arithmetic rows (after real click on the toggle)', json.dumps(c0['detailsRows'], ensure_ascii=False), json.dumps(p0['detailsRows'], ensure_ascii=False))
    ta = ' '.join((c0['detailsText'] or '').split()); tb = ' '.join((p0['detailsText'] or '').split())
    row('arithmetic closing line', ta.split('leaves to go', 1)[-1].strip(), tb.split('leaves to go', 1)[-1].strip())
    row('arithmetic text up to the closing line (level line included)', ta.split('leaves to go', 1)[0] + 'leaves to go', tb.split('leaves to go', 1)[0] + 'leaves to go')
    row('footer', c['footer'], p['footer'])
    # visible (painted) lines, minus sr-only duplicates: innerText lines that differ
    cl = [x.strip() for x in c['visible'].split('\n') if x.strip()]; pl = [x.strip() for x in p['visible'].split('\n') if x.strip()]
    diff = [x for x in cl if x not in pl] ; diff2 = [x for x in pl if x not in cl]
    print(f"| {day} | innerText lines present on one build only (sr-only text included) | {esc(' ‖ '.join(diff)) or '–'} | {esc(' ‖ '.join(diff2)) or '–'} | {'yes' if not diff and not diff2 else '**NO**'} |")
