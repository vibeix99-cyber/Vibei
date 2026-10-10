# LEAD independent re-judge of L1 raw race/natural jsonl (frame = [t,n,op,wtop,wbottom,dockTop,listBottom,listScrollTop,...]).
# Per run: re-shows (warning '-' followed by '+' within 1 s), frames after first full opacity + 1.2 s (entry excluded) with the
# warning box bottom > list bottom + 0.5 or > dock top, faded frames (<0.98 while present), list scrolled (|scrollTop|>1).
import json, sys, glob, os
W = 'toast-kettle:save-failed'
root = sys.argv[1]
for series in sys.argv[2:]:
    for rev in ('R5', 'R6'):
        fs = glob.glob(f'{root}/{series}/{rev}/*-{rev}.jsonl')
        if not fs: continue
        tot = dict(runs=0, reshow_runs=0, below_runs=0, overdock_runs=0, fade_runs=0, scrolled=0, maxbelow=-999)
        for line in open(fs[0]):
            r = json.loads(line); tot['runs'] += 1
            ev = [e for e in r['ev'] if e[2] == W]
            re = any(e[1] == '-' and any(x[1] == '+' and 0 < x[0] - e[0] < 1000 for x in ev) for e in ev)
            fr = r['frames']
            full = next((f[0] for f in fr if f[2] >= 0.98 and f[3] is not None), None)
            j = [f for f in fr if full is not None and f[0] >= full + 1200]
            # stop at the warning's own end (a '-' not followed by '+')
            ends = [e[0] for e in ev if e[1] == '-' and not any(x[1] == '+' and 0 < x[0] - e[0] < 1000 for x in ev)]
            if ends: j = [f for f in j if f[0] < min(ends) - 400]
            below = [f[4] - f[6] for f in j if f[4] is not None and f[6] is not None and f[4] > f[6] + 0.5]
            over = [f for f in j if f[4] is not None and f[5] is not None and f[4] > f[5] + 0.5]
            fade = [f for f in j if f[3] is not None and f[2] < 0.98]
            tot['reshow_runs'] += bool(re and any(e[0] > (full or 0) + 1200 for e in ev if e[1] == '-'))
            tot['below_runs'] += bool(below); tot['overdock_runs'] += bool(over); tot['fade_runs'] += bool(fade)
            tot['scrolled'] += any(f[7] is not None and abs(f[7]) > 1 for f in fr)
            tot['maxbelow'] = max([tot['maxbelow']] + below + [max((f[4] - f[6]) for f in j if f[4] is not None and f[6] is not None)] if j else [tot['maxbelow']])
        print(f'{series:14s} {rev} ' + ' '.join(f'{k}={v}' for k, v in tot.items()))
