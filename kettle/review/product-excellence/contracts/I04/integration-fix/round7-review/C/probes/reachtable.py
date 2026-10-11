import json, sys
S = sys.argv[1]
def load(f): return {(r['size'], r['theme'], r['state']): r for r in map(json.loads, open(f))}
i = load(S + '/reach/INT-run1/INT-reach.jsonl'); r = load(S + '/reach/R7-run1/R7-reach.jsonl')
SH = {'Start next brew': 'Next', "That's all for now": 'All for now', 'Put the kettle on': 'Put', 'Mark it done': 'Mark', 'Skip break': 'Skip', 'Resume break': 'Resume', 'Pause break': 'Pause'}
def fails(x):
    b = []
    for c, v in x['controls'].items():
        for how, res in v.items():
            if isinstance(res, dict) and res.get('reached') is False: b.append(SH.get(c, c) + '/' + how)
    tp = x.get('tapPause')
    if tp and tp.get('resumeInView') is False: b.append('tap: Resume off-screen after Pause')
    return b
print('| Size | Theme | State | INT runs / failing | INT failing control/method | R7 runs / failing | R7 panel scroll range at start |')
print('|---|---|---|---|---|---|---|')
for k in i:
    fi = fails(i[k]); fr = fails(r[k])
    sc = [s for s in r[k]['scrollersAtStart'] if s.startswith('main')]
    tp = r[k].get('tapPause')
    extra = f" · tap: Pause y {tp['pauseCy']} → Resume y {tp['resumeCy']} (whole: {tp['resumeWhole']})" if tp else ''
    print(f"| {k[0]} | {k[1]} | {k[2]} | 1 / {1 if fi else 0} | {', '.join(fi) or '—'} | 1 / {1 if fr else 0}{(' ' + ', '.join(fr)) if fr else ''} | {(sc[0].split(' ')[1] if sc else 'none (fits)')}{extra} |")
