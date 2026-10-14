import json, glob, os, sys, collections
d = sys.argv[1]
runs = {}
for fn in glob.glob(os.path.join(d, '*.json')):
    r = json.load(open(fn)); runs[(r['cfg'], r['day'], r['kase'])] = r
def st(r): return [x for x in (r.get('summary') or {}).get('series', []) if x['t'] >= 900]
MSG = {'adebug': 'A persistent notice, pending', 'b': 'A persistent notice raised after', 'c': 'Couldn’t save just now', 'areal': 'A fresh brew of Kettle is ready'}
agg = collections.defaultdict(list); issues = []
cfgs = sorted(set(k[0] for k in runs))
for (cfg, day, k), r in sorted(runs.items()):
    if r.get('error'): issues.append(f'{cfg} {day} {k}: ERROR {r["error"][:120]}'); continue
    if k == 'none': continue
    n = runs.get((cfg, day, 'none'))
    s, ns = st(r), st(n) if n else []
    def dm(f):
        a = [f(x) for x in s if f(x) is not None]; b = [f(x) for x in ns if f(x) is not None]
        if not a or not b: return None
        return max(abs(max(a) - max(b)), abs(min(a) - min(b)))
    dt, db, df = dm(lambda x: x['sheet'] and x['sheet'][1]), dm(lambda x: x['sheet'] and x['sheet'][3]), dm(lambda x: x['footer'] and x['footer'][1])
    cuts = sorted(set(x['cut'] for x in s)); ncuts = sorted(set(x['cut'] for x in ns))
    unders = sorted(set(x['under'] for x in s)); nunders = sorted(set(x['under'] for x in ns))
    allser = (r.get('summary') or {}).get('series', [])
    drawn = sum(1 for x in allser if x['notices']); over = sum(1 for x in allser if x.get('noticeOverSheet') or x.get('noticeOverFooter') or x.get('noticeOverFigures'))
    face = sorted(set(str(x.get('faceTop')) for x in s)); nface = sorted(set(str(x.get('faceTop')) for x in ns))
    gauge = sorted(set(str(x.get('gaugeTop')) for x in s)); ngauge = sorted(set(str(x.get('gaugeTop')) for x in ns))
    nxt = [x for x in (r.get('next') or []) if x['s']]
    maxn = max([x['n'] for x in nxt], default=0); whole = all(x['whole'] for x in nxt); clip = any(x['cut'] for x in nxt)
    first = nxt[0] if nxt else None
    live = r.get('liveBeforeAction') if k == 'areal' and r.get('liveBeforeAction') else (r.get('live') or [])
    said = [x for x in live if x['said'] and x['text'].startswith(MSG[k][:20])]
    allsaid = collections.Counter(x['text'][:40] for x in live if x['said'])
    act = r.get('action') or {}
    agg['runs'].append(1)
    for nm, v in [('dt', dt), ('db', db), ('df', df)]:
        if v is not None: agg[nm].append(v)
    if dt is None or db is None: issues.append(f'{cfg} {day} {k}: no settled sheet edges (dt={dt}, db={db})')
    if cuts != ncuts or unders != nunders: issues.append(f'{cfg} {day} {k}: rows cut {cuts} vs none {ncuts}; under {unders} vs {nunders}')
    if face != nface or gauge != ngauge: issues.append(f'{cfg} {day} {k}: face {face} vs {nface}; gauge {gauge} vs {ngauge}')
    agg['drawnOnSummary'].append(drawn); agg['over'].append(over)
    if not nxt: issues.append(f'{cfg} {day} {k}: nothing drawn on the next screen ({r.get("nextScreen")})')
    else:
        agg['firstMs'].append(first['ms']); agg['maxn'].append(maxn)
        if not whole or clip: issues.append(f'{cfg} {day} {k}: next-screen notice whole={whole} clipped={clip}')
        if first['hash'] not in ('#/focus', '#/'): issues.append(f'{cfg} {day} {k}: first drawn on {first["hash"]}')
    agg['said'].append(len(said))
    if len(said) != 1: issues.append(f'{cfg} {day} {k}: said {len(said)} times ({[x["hash"] for x in said]})')
    dup = [t for t, c in allsaid.items() if c > 1]
    if dup: issues.append(f'{cfg} {day} {k}: announcer lines more than once: {dup}')
    if k in ('adebug', 'b', 'areal'):
        if not act: issues.append(f'{cfg} {day} {k}: action not tapped')
        else:
            agg['act9'].append(act.get('nine', {}).get('n'))
            ok = act.get('onClick') == 1 if k != 'areal' else act.get('reloaded') is True
            if not ok: issues.append(f'{cfg} {day} {k}: action result {act}')
            agg['actOk'].append(ok)
print('configurations:', len(cfgs), cfgs)
print('runs with a notice:', len(agg['runs']), '| none runs:', sum(1 for k in runs if k[2] == 'none'))
for nm in ['dt', 'db', 'df', 'drawnOnSummary', 'over', 'maxn', 'said', 'act9']:
    v = agg[nm]; print(f'{nm}: n={len(v)} min={min(v) if v else None} max={max(v) if v else None}')
v = agg['firstMs']; print('first drawn on next screen ms: min', min(v) if v else None, 'max', max(v) if v else None)
print('action results ok:', sum(agg['actOk']), 'of', len(agg['actOk']))
print('ISSUES:', len(issues)); [print(' -', x) for x in issues]
