# Aggregate accept.mjs rows: one line per run (config x input).
import json, sys
rows = [json.loads(l) for f in sys.argv[1:] for l in open(f)]
print('| rev | config | input | frames | covered frames (all / >400 ms after input) | samples | toasts not whole (visible<box or own>box) | folded samples | actions not on top | top-bar words under a toast | docked (per sample) | real taps activated | error / notes |')
print('|---|---|---|---|---|---|---|---|---|---|---|---|---|')
for r in rows:
    s = r['samples']
    notwhole = sum(1 for x in s for t in x['toasts'] if t['visible'] < t['box'] - 1 or t['natural'] > t['box'] + 1)
    folded = sum(1 for x in s if any(t.get('folded') for t in x['toasts']))
    act = sum(1 for x in s for t in x['toasts'] if t['actHit'] is False)
    bar = sum(1 for x in s if x['barOverlap'])
    fr = r.get('frames') or {}
    taps = r['taps']
    ok = sum(1 for t in taps if t.get('activated'))
    pos = ' '.join(f"{x['where'][0]}{x['n']}{'D' if x['docked'] else '-'}" for x in s)
    note = (r.get('error') or '') + ('; ' if r.get('error') and r['notes'] else '') + '; '.join(r['notes'][:2])
    print(f"| {r['rev']} | {r['W']}x{r['H']} @{r['text']} {r['theme']} | {r['mode']} | {fr.get('frames','-')} | {fr.get('covered','-')} / {fr.get('coveredAfter400ms','-')} | {len(s)} | {notwhole} | {folded} | {act} | {bar} | {''.join('D' if x['docked'] else '-' for x in s)} | {ok}/{len(taps)} | {note} |")
