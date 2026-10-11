#!/usr/bin/env python3 -I
import json, sys
rows = [json.loads(l) for l in open(sys.argv[1]) if l.strip()]
fr = [r for r in rows if r.get('kind') == 'frames']
tp = [r for r in rows if r.get('kind') == 'tap']
THREE = ('^Close$', '^Ambience:', '^(Mute sounds|Turn sound on)$')
def ck(r): return (r['W'], r['H'], r['text'], r['theme'])
order = []
for r in rows:
    if r.get('state') in ('focus', 'paused') and ck(r) not in order: order.append(ck(r))
print('| Configuration | State | Ambience: rect · frames · centre hits · covered | Mute: rect · frames · centre hits · covered | Ambience taps (3 toasts; top / end) | Mute taps (3 toasts; top / end) | Panel controls in view: covered frames after 0.9 s · covered in the entry frames (frames seen) |')
print('|---|---|---|---|---|---|---|')
for k in order:
    for st in ('focus', 'paused'):
        f = [r for r in fr if ck(r) == k and r['state'] == st]
        if not f: continue
        def agg(pat):
            n = h = c = 0; rect = None
            for r in f:
                o = r['per'].get(pat)
                if o: n += o['frames']; h += o['hitSelf']; c += o['covered']; rect = o['rect'] or rect
            return f"{rect} · {n} · {h} · **{c}**"
        pc = 0; pn = 0; ps = 0
        for r in f:
            for kk, o in r['per'].items():
                if kk in THREE: continue
                pc += o['covered']; pn += o['frames'] - o['off'] - o['missing']; ps += r['coveredSettled'].get(kk, 0)
        def tp_(ctl):
            t = [r for r in tp if ck(r) == k and r['state'] == st and r['control'] == ctl]
            if not t: return 'not run'
            s = ' / '.join(f"{'**activated**' if r.get('activated') else '**NOT activated**'}{'' if r.get('hitSelf') else ' (centre hit: ' + str(r.get('hit')) + ')'}" for r in sorted(t, key=lambda r: r['where'] != 'top'))
            return s + (' [click]' if t[0].get('device') == 'mouse click' else '')
        W, H, T, th = k
        print(f"| {W}×{H} @{T} % {th} | {'focus running' if st == 'focus' else 'paused break'} | {agg('^Ambience:')} | {agg('^(Mute sounds|Turn sound on)$')} | {tp_('Ambience')} | {tp_('Mute')} | {ps} settled · {pc} in entry frames ({pn} frames seen) |")
