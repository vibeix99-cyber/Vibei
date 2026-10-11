#!/usr/bin/env python3 -I
"""Lane C: summarise closecheck2 jsonl -> markdown (compact per config x state; full detail table)."""
import json, sys, collections
paths = sys.argv[1:]
rows = []
for p in paths:
    for l in open(p):
        l = l.strip()
        if l: rows.append(json.loads(l))
CTL = {'^Ambience:': 'Ambience', '^(Mute sounds|Turn sound on)$': 'Mute', '^Close$': 'Close'}
def cfgkey(r): return f"{r['W']}x{r['H']} @{r['text']} {r['theme']}"
frames = [r for r in rows if r.get('kind') == 'frames']
taps = [r for r in rows if r.get('kind') == 'tap']
errs = [r for r in rows if r.get('kind') == 'error' or ('error' in r and r.get('kind') != 'frames')]
order = []
for r in rows:
    k = (cfgkey(r))
    if k not in order: order.append(k)
print('## Detail: frames (per cfg x state x scroll position x toasts)\n')
print('Each cell: `hit/frames` centre-hit by the control · `ovl` frames a painted toast box overlapped it by > 1 px · `cov` frames counted COVERED (overlap or centre not hit) · `off` frames with < 8 px visible · rect = last frame [l,t,r,b].\n')
print('| cfg | state | where | toasts | scroll | Close | Ambience | Mute | panel controls: covered frames / frames seen (off-screen frames) | min toast visible px | zen frames |')
print('|---|---|---|---|---|---|---|---|---|---|---|')
THREE = ('^Close$', '^Ambience:', '^(Mute sounds|Turn sound on)$')
def panel(per):
    out = []
    for k, o in per.items():
        if k in THREE: continue
        seen = o['frames'] - o['off'] - o['missing']
        out.append(f"{k.strip('^$')[:16]}: {o['covered']}/{seen}" + (f" ({o['off']} off)" if o['off'] else ''))
    return '; '.join(out) or '—'
def cell(per, pat):
    o = per.get(pat)
    if not o: return '—'
    return f"{o['hitSelf']}/{o['frames']} · ovl {o['overlap']} · cov {o['covered']}" + (f" · off {o['off']}" if o['off'] else '') + (f" · MISSING {o['missing']}" if o['missing'] else '') + f" · {o['rect']}" + (f" · hits: {o['hitOther']}" if o['hitOther'] else '')
for k in order:
    for r in frames:
        if cfgkey(r) != k: continue
        per = r['per']
        print(f"| {k} | {r['state']} | {r['where']} | {r['n']} | {r['scroll']} | {cell(per,'^Close$')} | {cell(per,'^Ambience:')} | {cell(per,'^(Mute sounds|Turn sound on)$')} | {panel(per)} | {r['minVisibleToast']} | {r['zenFrames']} |")
print('\n## Detail: real taps\n')
print('| cfg | state | control | where | toasts at tap | rect | centre hit before tap | hit element | activated | evidence |')
print('|---|---|---|---|---|---|---|---|---|---|')
for k in order:
    for r in taps:
        if cfgkey(r) != k: continue
        ev = ''
        if r['control'] == 'Mute': ev = f"label {r.get('before')} -> {r.get('after')}; restored {r.get('restored')}"
        elif r['control'] == 'Ambience': ev = f"dialog {r.get('dialog')}; closed {r.get('closed')} by {r.get('closedBy')}"
        elif r['control'] == 'Close': ev = f"hash {r.get('hashBefore')} -> {r.get('after',{}).get('hash')}"
        print(f"| {k} | {r['state']} | {r['control']} | {r['where']} | {r.get('nToasts')} | {r.get('rect')} | {r.get('hitSelf')} | {r.get('hit')} | {r.get('activated')} ({r.get('device','')}) | {ev} |")
if errs:
    print('\n## Errors\n')
    for r in errs: print('-', json.dumps({k: v for k, v in r.items() if k not in ('fr',)}))
print('\n## Compact per configuration x state\n')
print('Across the 4 frame sub-runs (top/end x 1/3 toasts) per control: covered frames / frames, centre-hit frames / frames; taps: activated/attempted (hit before tap).\n')
print('| cfg | state | Close cov · hit | Ambience cov · hit | Mute cov · hit | taps |')
print('|---|---|---|---|---|---|')
for k in order:
    for st in ('focus', 'paused', 'over-carried'):
        fr = [r for r in frames if cfgkey(r) == k and r['state'] == st]
        tp = [r for r in taps if cfgkey(r) == k and r['state'] == st]
        if not fr and not tp: continue
        def agg(pat):
            f = c = h = 0
            for r in fr:
                o = r['per'].get(pat)
                if o: f += o['frames']; c += o['covered']; h += o['hitSelf']
            return f"{c}/{f} · {h}/{f}" if f else '—'
        def taps_(ctl):
            t = [r for r in tp if r['control'] == ctl]
            return f"{ctl} {sum(1 for r in t if r.get('activated'))}/{len(t)} (hit {sum(1 for r in t if r.get('hitSelf'))})" if t else ''
        print(f"| {k} | {st} | {agg('^Close$')} | {agg('^Ambience:')} | {agg('^(Mute sounds|Turn sound on)$')} | {'; '.join(x for x in (taps_('Close'), taps_('Ambience'), taps_('Mute')) if x)} |")
print('\n## Toast visibility at the last frame (what a person can read): visible px / full px per toast, top toast first; room clip [top,bottom]\n')
print('| cfg | state | where | toasts | visible / full px per toast | room clip | min visible |')
print('|---|---|---|---|---|---|---|')
for k in order:
    for r in frames:
        if cfgkey(r) != k: continue
        tl = ' · '.join(f"{t[2]}/{t[3]}" for t in r['toastsLast'])
        print(f"| {k} | {r['state']} | {r['where']} | {r['n']} | {tl} | {r['clip']} | {r['minVisibleToast']} |")
