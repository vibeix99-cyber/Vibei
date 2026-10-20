#!/usr/bin/env python3
"""Compare before.json / after.json from measure-footprint.mjs. Prints a markdown table and the worst deltas (CSS px).
usage: compare-footprint.py before.json after.json > footprint.md"""
import json, sys
b = json.load(open(sys.argv[1])); a = json.load(open(sys.argv[2]))
rows = []; worst = {k: (0, '') for k in ('box w', 'box h', 'ink w', 'ink h', 'ink left', 'ink right', 'ink top', 'baseline')}
print('| viewport | place | pose | img box w x h (before -> after) | ink w x h (before -> after) | baseline y (before -> after) | max delta |')
print('|---|---|---|---|---|---|---|')
for vp in b:
    for k, v in b[vp].items():
        w = a[vp].get(k)
        if not v or not w:
            print(f'| {vp} | {k} | MISSING | | | | |'); continue
        bw, bh = v['img'][2] - v['img'][0], v['img'][3] - v['img'][1]
        aw, ah = w['img'][2] - w['img'][0], w['img'][3] - w['img'][1]
        iw0, ih0 = v['ink'][2] - v['ink'][0], v['ink'][3] - v['ink'][1]
        iw1, ih1 = w['ink'][2] - w['ink'][0], w['ink'][3] - w['ink'][1]
        d = {'box w': aw - bw, 'box h': ah - bh, 'ink w': iw1 - iw0, 'ink h': ih1 - ih0, 'ink left': w['ink'][0] - v['ink'][0],
             'ink right': w['ink'][2] - v['ink'][2], 'ink top': w['ink'][1] - v['ink'][1], 'baseline': w['ink'][3] - v['ink'][3]}
        # box position too
        d['box left'] = w['img'][0] - v['img'][0]; d['box top'] = w['img'][1] - v['img'][1]
        m = max(abs(x) for x in d.values())
        for kk in worst:
            if abs(d[kk]) > abs(worst[kk][0]): worst[kk] = (d[kk], f'{vp} {k}')
        print(f"| {vp} | {k} | {v['pose']} | {bw:.1f}x{bh:.1f} -> {aw:.1f}x{ah:.1f} | {iw0:.1f}x{ih0:.1f} -> {iw1:.1f}x{ih1:.1f} | {v['ink'][3]:.1f} -> {w['ink'][3]:.1f} | {m:.2f} |")
print()
print('Worst delta per measure (CSS px, after minus before):')
for kk, (d, where) in worst.items(): print(f'- {kk}: {d:+.2f} ({where})')
