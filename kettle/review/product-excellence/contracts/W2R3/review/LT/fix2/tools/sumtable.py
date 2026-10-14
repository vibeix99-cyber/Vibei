import json, glob, os, sys, collections
d = sys.argv[1]; mode = sys.argv[2] if len(sys.argv) > 2 else 'matrix'
runs = {}
for fn in glob.glob(os.path.join(d, '*.json')):
    r = json.load(open(fn)); runs[(r['cfg'], r['day'], r['kase'])] = r
def st(r): return [x for x in (r.get('summary') or {}).get('series', []) if x['t'] >= 900]
def rng(v):
    v = [x for x in v if x is not None]
    if not v: return '—'
    a, b = min(v), max(v); return f'{a:g}' if a == b else f'{a:g}–{b:g}'
MSG = {'adebug': 'A persistent notice, pending', 'b': 'A persistent notice raised after', 'c': 'Couldn’t save just now', 'areal': 'A fresh brew of Kettle is ready'}
order = ['375x667-light-t100','375x667-dark-t100','375x667-light-t200','375x667-dark-t200','390x844-light-t100','390x844-dark-t100','390x844-light-t200','390x844-dark-t200','844x390-light-t100','844x390-dark-t100','844x390-light-t200','844x390-dark-t200','667x375-light-t100','667x375-dark-t100','667x375-light-t200','667x375-dark-t200','1440x900-light-t100','1440x900-dark-t100','1440x900-light-t200','1440x900-dark-t200']
if mode == 'matrix':
    print('| Configuration | Day | No notice: sheet top / bottom; footer top (settled) | Cases run | max \\|Δ\\| sheet top / bottom / footer top vs no notice | Rows cut by footer / wholly under it (no notice → with notices) | Chai face / gauge centre top element (no notice → with notices) | Frames with a notice drawn on the summary | Next screen: first drawn (ms after the tap), adebug·c → tea break, b → Today | Notices drawn at once (max) | Said once (adebug, b, c) |')
    print('|---|---|---|---|---|---|---|---|---|---|---|')
    for cfg in order:
        for day in ['task', 'big']:
            n = runs.get((cfg, day, 'none'))
            if not n: continue
            ns = st(n)
            ks = [k for k in ['adebug', 'b', 'c'] if (cfg, day, k) in runs]
            dts, dbs, dfs, cuts, faces, drawn, firsts, maxn, said = [], [], [], set(), set(), 0, [], 0, []
            for k in ks:
                r = runs[(cfg, day, k)]; s = st(r)
                for f, acc in [(lambda x: x['sheet'] and x['sheet'][1], dts), (lambda x: x['sheet'] and x['sheet'][3], dbs), (lambda x: x['footer'] and x['footer'][1], dfs)]:
                    a = [f(x) for x in s if f(x) is not None]; b = [f(x) for x in ns if f(x) is not None]
                    if a and b: acc.append(max(abs(max(a) - max(b)), abs(min(a) - min(b))))
                cuts |= {f"{x['cut']}/{x['under']}" for x in s}
                faces |= {f"{x.get('faceTop')}/{x.get('gaugeTop')}" for x in s}
                drawn += sum(1 for x in (r.get('summary') or {}).get('series', []) if x['notices'])
                nx = [x for x in (r.get('next') or []) if x['s']]
                if nx: firsts.append(f"{k}:{nx[0]['ms']}"); maxn = max(maxn, max(x['n'] for x in nx))
                live = r.get('live') or []
                said.append(len([x for x in live if x['said'] and x['text'].startswith(MSG[k][:20])]))
            top = rng([x['sheet'][1] for x in ns]); bot = rng([x['sheet'][3] for x in ns]); ft = rng([x['footer'][1] for x in ns if x['footer']])
            ncut = sorted({f"{x['cut']}/{x['under']}" for x in ns}); nface = sorted({f"{x.get('faceTop')}/{x.get('gaugeTop')}" for x in ns})
            print(f"| {cfg} | {day} | {top} / {bot}; {ft} | {','.join(ks)} | {rng(dts)} / {rng(dbs)} / {rng(dfs)} | {','.join(ncut)} → {','.join(sorted(cuts))} | {','.join(nface)} → {','.join(sorted(faces))} | {drawn} | {' '.join(firsts)} | {maxn} | {said} |")
elif mode == 'control':
    print('| Server | Configuration | Case | Sheet top / bottom (settled) | max \\|Δ\\| top / bottom vs no notice (same server) | Footer top | Rows cut / under | Frames with a notice drawn on the summary | Frames with a notice over sheet, footer, Chai face or gauge | Chai face / gauge centre top element |')
    print('|---|---|---|---|---|---|---|---|---|---|')
    for (cfg, day, k), r in sorted(runs.items()):
        s = st(r); n = runs.get((cfg, day, 'none')); ns = st(n) if n else []
        def dm(f):
            a = [f(x) for x in s if f(x) is not None]; b = [f(x) for x in ns if f(x) is not None]
            return max(abs(max(a) - max(b)), abs(min(a) - min(b))) if a and b else None
        allser = (r.get('summary') or {}).get('series', [])
        print(f"| :{r['base'][-4:]} | {cfg} {day} | {k} | {rng([x['sheet'][1] for x in s])} / {rng([x['sheet'][3] for x in s])} | {dm(lambda x: x['sheet'][1])} / {dm(lambda x: x['sheet'][3])} | {rng([x['footer'][1] for x in s if x['footer']])} | {','.join(sorted({str(x['cut'])+'/'+str(x['under']) for x in s}))} | {sum(1 for x in allser if x['notices'])} | {sum(1 for x in allser if x.get('noticeOverSheet') or x.get('noticeOverFooter') or x.get('noticeOverFigures'))} | {','.join(sorted({str(x.get('faceTop'))+'/'+str(x.get('gaugeTop')) for x in s}))} |")
