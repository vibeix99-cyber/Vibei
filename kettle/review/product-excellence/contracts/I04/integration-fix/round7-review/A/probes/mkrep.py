#!/usr/bin/env python3
"""Lane A relaunch: build rep-relaunch.json (placeholder values) from what the evidence folder actually holds. argv[1] = end time text."""
import json, glob, os, re, sys
EV = '/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/A'
A = '/home/user/wt/rv7-r7/kettle/.tmp/A'
def jl(p):
    out = []
    if not os.path.exists(p): return out
    for l in open(p):
        l = l.strip()
        if l:
            try: out.append(json.loads(l))
            except Exception: pass
    return out
rep = {'END': sys.argv[1]}
notrun = []
# ---- R5-D1 touch 375x667 dark on R7 (W)
w = jl(f'{EV}/runs/r5d1-touch-r7-375D/natural-R7.jsonl') or [r for p in glob.glob(f'{EV}/runs/r5d1-touch-r7-375D/natural-*.jsonl') for r in jl(p)]
if w:
    fails = [r for r in w if r['bad']]
    adds = sorted({f"{r['adds']}/{r['rems']}" for r in w}); live = sorted({len(r['said']) for r in w})
    cls = {}
    for r in w: cls[r.get('expiryClass', '?')] = cls.get(r.get('expiryClass', '?'), 0) + 1
    rep['T375DTXT'] = f"{len(w)} (relaunch, descriptive) · **{len(fails)}** · banner adds/removals {adds} · live-region additions per run {live}; expiry {cls}"
    rep['TOUCHCOV'] = "**partly covered** (R7 375×667 dark touch now run, descriptive)"
    rep['TOUCHMISS'] = f"control never established by touch at 375×667 light/dark (0/15 each), at 844×390 only by the probe's judge (3/15): the R7 touch zeros count only at 844×390 and only at the probe-judge level; R7 375×667 dark touch: {len(w)} runs, {len(fails)} failures (does not count)"
    rep['R7NEW_W'] = f"{len(w)}"
else:
    rep['T375DTXT'] = "**not run** (cancelled 04:21 UTC in the first instance; queued again in the relaunch, no slot before the budget end)"
    rep['TOUCHCOV'] = "**partly covered**"
    rep['TOUCHMISS'] = "R7 375×667 dark touch **not run** (first instance: cancelled under the fair-share gate; relaunch: no slot before the end); control never established by touch at 375×667 light/dark (0/15 each), at 844×390 only by the probe's judge (3/15)"
    notrun.append('R5-D1 by touch on R7 at 375×667 dark @200 (10 runs; descriptive only, its control was not established)')
# ---- readwarn
rw = {}
for ser in ('int', 'r7'):
    for r in jl(f'{EV}/runs/readwarn-{ser}/readwarn.jsonl'):
        rw[(ser, r['tag'].split('-t200-')[0].split('-', 1)[1] + '-' + r['theme'] + '-' + r.get('gesture', 'wheel'))] = r
def rwtxt(r):
    if r.get('error'): return f"ERROR {r['error']}"
    return f"{r['linesSeen']}/{r['nLines']} lines wholly seen, Save backup hit {r['saveBackupHit']} ({r['saveBackupStrokes']} strokes), download {r.get('download')}, warning adds/removals {r['warnAdds']}/{r['warnRemovals']}; " + ('; '.join(r.get('fail') or []) or 'no failure')
k844 = ('r7', '844x390-light-wheel'); k667i = ('int', '667x375-dark-wheel'); k667r = ('r7', '667x375-dark-wheel'); k844i = ('int', '844x390-light-wheel')
rwr7 = []; rwmiss = []
if k844 in rw:
    r = rw[k844]; ctl = rw.get(k844i)
    rwr7.append(f"**Relaunch, 844×390 light wheel on R7: {rwtxt(r)}** (INT control, first instance: {rwtxt(ctl) if ctl else 'n/a'}).")
else:
    rwmiss.append('R7 844×390 wheel'); notrun.append('readability probe on R7 at 844×390 (wheel)')
if k667r in rw or k667i in rw:
    if k667i in rw: rwr7.append(f"Relaunch INT 667×375 dark wheel (control): {rwtxt(rw[k667i])}.")
    if k667r in rw: rwr7.append(f"Relaunch R7 667×375 dark wheel: {rwtxt(rw[k667r])}.")
    if k667i not in rw or k667r not in rw: rwmiss.append('667×375 (one side missing)')
else:
    rwmiss.append('667×375'); notrun.append('readability probe at 667×375 dark on INT and R7')
rwmiss.append('every touch run'); notrun.append('readability probe by touch (every configuration, INT and R7)')
rep['RWR7'] = ' '.join(rwr7) if rwr7 else '(no further R7 configuration reached in the relaunch)'
ctl_ok844 = k844i in rw and bool(rw[k844i].get('fail'))
ctl_ok667 = k667i in rw and bool(rw[k667i].get('fail'))
note = []
if k844 in rw: note.append('844×390 wheel: the INT control reproduced the old symptoms in this session, so a clean R7 result counts' if ctl_ok844 else '844×390 wheel: INT control did not fail, so it does not count')
if k667r in rw: note.append('667×375 dark wheel: ' + ('the INT control failed in this session, so a clean R7 result counts' if ctl_ok667 else 'the INT control did not fail there, so it does not count'))
note.append('**Not run** on R7: ' + ', '.join(rwmiss) if rwmiss else '')
rep['RWNOTE'] = '; '.join(n for n in note if n)
done = [x for x in ('375×667 light/dark wheel', '390×844 light wheel') ] + (['844×390 light wheel'] if k844 in rw else []) + (['667×375 dark wheel'] if (k667r in rw and k667i in rw) else [])
rep['RWCOV'] = '**partly covered**'
rep['RWMISS'] = 'not run: ' + ', '.join(rwmiss) + ' (R7 reached: ' + ', '.join(done) + ')'
# ---- D4 on INT at 375x667
lg = f'{EV}/specs/a11y-0d58c5e-g.log'; first = f'{EV}/specs/a11y-0d58c5e-g.first-instance.log'
d4new = None
if os.path.exists(lg) and os.path.exists(first) and open(lg).read() != open(first).read():
    os.replace(lg, f'{EV}/specs/a11y-0d58c5e-g-375x667-relaunch.log'); os.replace(first, lg)
if os.path.exists(f'{EV}/specs/a11y-0d58c5e-g-375x667-relaunch.log'):
    t = open(f'{EV}/specs/a11y-0d58c5e-g-375x667-relaunch.log').read()
    m = re.search(r'(\d+) (passed|failed)', t)
    d4new = ('fail' if re.search(r'\d+ failed', t) else 'pass', t)
if d4new:
    rep['D4INT'] = f"Relaunch: the 375×667 test run alone on INT: **{d4new[0]}** (`specs/a11y-0d58c5e-g-375x667-relaunch.log`)."
    rep['D4ZERO'] = '375×667: ' + ('counts (INT control failed there too)' if d4new[0] == 'fail' else 'does not count (INT passes there)')
    rep['D4COV'] = 'D4 at 375×667 on INT: run alone in the relaunch'
else:
    rep['D4INT'] = 'Not rerun alone in the relaunch.'
    rep['D4ZERO'] = '375×667 at the spec level only (INT 375×667 not run)'
    rep['D4COV'] = 'D4 at 375×667 has no INT control (serial spec; the INT run alone was not reached in the relaunch)'
    notrun.append('INT control for D4 at 375×667 (a11y spec, run alone)')
# ---- item 5
rep['ITEM5SUMMARY'] = {'file': f'{A}/item5-summary.md'}
rep['ITEM5FACTS'] = {'file': f'{A}/item5-facts.md'}
rb = jl(f'{EV}/runs/markdone-cases/r7-setupb-rep2/markdone-b39202f-setupb.jsonl')
rep['ITEM5COV'] = '**covered**: setup a 1 run per row (R7 ×3 configurations, INT ×3), setup b 3 runs per configuration on R7 (1 with a clip + 2 repetitions); one clip per configuration' + ('' if rb else ' (setup b: 1 run per configuration)')
miss = ['667×375 @150 (not requested for item 5)', 'repetitions of setup a (the first instance\'s `markdone-a2` case-1 runs, 3 per configuration, are the repetitions) and of INT']
if not rb: miss.append('R7 setup b repetitions (queued, no slot)'); notrun.append('R7 setup b repetitions (2 more passes of 3 configurations)')
notrun.append('R7 setup a repetitions with markdone-a4 (the first instance\'s markdone-a2 case-1 runs stand for them)')
rep['ITEM5MISS'] = '; '.join(miss)
rep['R7N'] = '57' + (f' + {len(w)}' if w else '') + ' (wheel 30 + 3 clip runs, touch 20, timing variant 4' + (f', relaunch touch 375×667 dark {len(w)}' if w else '') + ')'
rep['R7NEW'] = 'the 3 clip runs of 04:27–04:48 UTC (wheel, all OK)' + (f' and the {len(w)} relaunch touch runs at 375×667 dark' if w else '')
rep['CLIPNOTE'] = ("check 2: e866118 case 1 ×4 configurations (`leadd1-case1-ctl/`), case 2 ×4 (`leadd1-case2-ctl/`; the 844×390 one shows the invalid setup), case 2 keyboard 844×390 (`leadd1-case2key-ctl/`); R7 case 1 ×4 (`leadd1-case1-r7/`), case 2 ×4 (`leadd1-case2-r7/`; 844×390 invalid), case 2 keyboard 844×390 (`leadd1-case2key-r7/`). Check 1: R7 wheel clips for all three configurations (`r5d1-wheel-r7clip-375L/`, `-844L/`, `-375D/`, runs OK). Item 5: one clip per configuration for R7 setup a (`runs/markdone-cases/r7-setupa/`), R7 setup b (`…/r7-setupb/`) and INT setup a (`…/int-setupa/`). **Not recorded:** check-1 touch clips and R5-control clips (not required: one clip per configuration)")
rep['NOTRUN'] = '; '.join(notrun) if notrun else 'nothing queued'
json.dump(rep, open(f'{A}/rep-relaunch.json', 'w'), indent=1, ensure_ascii=False)
print(json.dumps({k: (v if isinstance(v, str) else v) for k, v in rep.items() if k in ('T375DTXT', 'RWR7', 'RWNOTE', 'RWMISS', 'D4INT', 'NOTRUN')}, indent=1, ensure_ascii=False)[:3000])
