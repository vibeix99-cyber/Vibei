import json, glob, collections, os, sys
A = '/home/user/Vibei/kettle/review/product-excellence/contracts/W2R3/review/LT/probes/fix'      # 490ca97, round 3
B = '/home/user/Vibei/kettle/review/product-excellence/contracts/W2R3/review/LT/fix2/probes/inv-fix'  # fix
def summ(path):
    d = json.load(open(path)); T = collections.Counter(); errs = []; seen = set()
    for g, f in d['groups'].items():
        s = f.get('sampler') or {}
        if f.get('error'): errs.append(f"{g}: {f['error'][:80]}")
        T['s'] += s.get('samples', 0); T['ns'] += s.get('nSamples', 0); T['m'] += s.get('modalSamples', 0); T['cut'] += s.get('cut', 0)
        seen |= set(s.get('seen', {}).keys())
        for k, v in (s.get('geoTop') or {}).items():
            kind, _, top = k.partition('|')
            if kind.startswith('efp'):
                T['efpSheet' if 'modal' in kind else 'efpNM'] += v; continue
            if top in ('offViewport', 'noticeClippedAway', 'otherClippedAway'): T['clip'] += v
            elif top.startswith('underSheet') or 'modal' in kind: T['sheet'] += v
            elif top == 'notice': T['dn'] += v; T['dn_' + kind.split('@')[0]] += v
            else: T['do'] += v; T['do_' + kind.split('@')[0]] += v
    return T, errs, len(seen)
print('| Configuration | Revision | 100 ms samples / with a notice | drawn, no sheet: notice on top (ctl/text/row) | drawn, no sheet: other on top (ctl/text/row) | 9-point control hits by a notice, no sheet | sheet in the DOM: intersections / 9-point hits (controls) | clipped notice samples | distinct notices | group errors |')
print('|---|---|---|---|---|---|---|---|---|---|')
for fn in sorted(glob.glob(os.path.join(B, '*.json'))):
    name = os.path.basename(fn)[:-5]
    for label, path in [('490ca97', os.path.join(A, name + '.json')), ('fix 99d9368', fn)]:
        if not os.path.exists(path): print(f'| {name} | {label} | not run | | | | | | | |'); continue
        T, errs, ns = summ(path)
        print(f"| {name} | {label} | {T['s']} / {T['ns']} | {T['dn']} ({T['dn_ctl']}/{T['dn_text']}/{T['dn_row']}) | {T['do']} ({T['do_ctl']}/{T['do_text']}/{T['do_row']}) | {T['efpNM']} | {T['sheet']} / {T['efpSheet']} | {T['cut']} | {ns} | {'; '.join(errs) or '—'} |")
