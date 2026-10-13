#!/usr/bin/env python3
"""Compact control-vs-P geometry table (settled; arrival equals settled for the figures, checked separately). python3 compact.py <dir>..."""
import json, glob, os, sys
runs = {}
for d in sys.argv[1:]:
    for f in sorted(glob.glob(f'{d}/*/[CP]-*.json')):
        tag = os.path.basename(os.path.dirname(f)); side, day = os.path.basename(f)[:-5].split('-', 1)
        runs[(tag, day, side)] = json.load(open(f))
def f(x): return '–' if x is None else (f'{x:g}' if isinstance(x, (int, float)) else str(x))
def iv(r):
    c = r['settled']['inView']; c = c['highlightCard'] or c['unlockCard']
    return '–' if not c else f"{c['visiblePx']:g}/{c['h']:g}"
print('| cfg | day | build | sheet lift (scrollTop) | air | Chai img box → sheet edge | Chai ink → edge | kettle svg box → edge | kettle drawn ink (incl. faint glow) → edge | heading in view: line box / ink | highlighted card visible px / height (arrival) | text lines cut by fold (box / ink) | last line → footer at end |')
print('|---|---|---|---|---|---|---|---|---|---|---|---|---|')
tags = sorted({k[0] for k in runs}, key=lambda t: (-int(t.split('x')[0]), 'dark' in t, int(t.split('-t')[1])))
for t in tags:
    for day in ['routine', 'task', 'big', 'milestone']:
        for side in 'CP':
            r = runs.get((t, day, side))
            if not r or not r.get('settled'): continue
            s = r['settled']; a = r['arrival']; fg = s['figures']; ik = s.get('ink') or {}
            cutb = len(s['fold']['cut']); cuti = len([c for c in ik.get('cut', []) if not c.get('inSvg')])
            print(f"| {t} | {day} | {'control' if side == 'C' else 'P'} | {s['scroll']['scrollTop']:g} | {s['sheet']['air'].replace('px','')} | {f(fg['chaiImgClear'])} | {f(fg['chaiPaintClear'])} | {f(fg['kettleSvgClear'])} | {f(fg['kettlePaintClear'])} | {s['heading']['whole']} / {(ik.get('heading') or {}).get('wholeByInk')} | {iv(r)} | {cutb} / {cuti} | {f((r.get('end') or {}).get('end', {}).get('lastLineToFooter'))} |")
