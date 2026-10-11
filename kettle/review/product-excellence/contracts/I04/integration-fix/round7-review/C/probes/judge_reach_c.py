# Lane C: independent re-judge of reach.mjs jsonl rows. A row fails when any control x method (wheel, touch, key) has
# reached == false, when the tap test reports a control not in view after a tap, or when the page raised errors.
# usage: python3 -I judge_reach_c.py <jsonl> [...]
import json, sys
for f in sys.argv[1:]:
    rows = [json.loads(l) for l in open(f) if l.strip()]
    nf = 0
    print(f'# {f}: {len(rows)} configurations')
    print('| size | theme | state | probe verdict | re-judged failing control/method | scrollers at start | tab order |')
    print('|---|---|---|---|---|---|---|')
    for r in rows:
        bad = []
        for c, v in r['controls'].items():
            for how, res in v.items():
                if isinstance(res, dict) and res.get('reached') is False:
                    bad.append(f'{c}/{how}')
        tp = r.get('tapPause')
        if tp:
            if tp.get('resumeInView') is False: bad.append('tap:Resume not in view after tapping Pause')
            if tp.get('pauseAgainInView') is False: bad.append('tap:Pause not in view after tapping Resume')
        if r.get('errors'): bad.append('ERR:' + str(r['errors'])[:80])
        if bad: nf += 1
        tab = r.get('tabOrder')
        tabs = ' > '.join(tab.get('fwd', [])[:8]) if isinstance(tab, dict) else str(tab)[:80]
        print(f"| {r['size']} | {r['theme']} | {r['state']} | {'PASS' if r.get('pass') else 'FAIL'} ({len(r.get('fails', []))}) | {', '.join(bad) or '-'} | {' '.join(r.get('scrollersAtStart', []))} | {tabs} |")
    print(f'\nfailing configurations: {nf} / {len(rows)}\n')
