# Compare portrait geometry rows (accept.mjs geom mode): fix vs control, per config and sample.
import json, sys
fix, ctl = sys.argv[1], sys.argv[2]
def load(f):
    d = {}
    for l in open(f):
        r = json.loads(l)
        for s in r['samples']:
            key = (f"{r['W']}x{r['H']} @{r['text']} {r['theme']}", s['where'], s['n'])
            d[key] = dict(panel=s['panel'], docked=s['docked'], region=s['region'], clip=s['clip'],
                          toasts=[(t['text'], t['box'], t['visible'], t['rect'], t['actHit']) for t in s['toasts']], bar=s['barOverlap'],
                          err=r.get('error'))
    return d
A, B = load(fix), load(ctl)
print('| config | place | n | panel (scrollTop/max) | region rect | list clip | toast rects (box/visible) | equal to b39202f |')
print('|---|---|---|---|---|---|---|---|')
eq = 0
for k in sorted(set(A) | set(B)):
    a, b = A.get(k), B.get(k)
    same = a is not None and b is not None and all(a[x] == b[x] for x in ('docked', 'region', 'clip', 'toasts', 'panel'))
    eq += same
    show = a or b
    ts = '; '.join(f"{t[1]}/{t[2]} @{t[3]}" for t in show['toasts'])
    diff = '' if same else ' DIFF: ' + ', '.join(x for x in ('docked', 'region', 'clip', 'toasts', 'panel') if not a or not b or a[x] != b[x])
    print(f"| {k[0]} | {k[1]} | {k[2]} | {show['panel']} | {show['region']} | {show['clip']} | {ts} | {'yes' if same else 'NO'}{diff} |")
print(f"\n{eq}/{len(set(A) | set(B))} samples identical")
