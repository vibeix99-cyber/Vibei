#!/usr/bin/env python3
"""Tables from sumprobe JSON. usage: sumagg.py DIR [DIR_NONE_REF]"""
import json, glob, os, sys, collections
d = sys.argv[1]
runs = {}
for fn in glob.glob(os.path.join(d, '*.json')):
    r = json.load(open(fn))
    runs[(r['cfg'], r['day'], r['kase'])] = r

def settled(r):
    ser = [x for x in (r.get('summary') or {}).get('series', []) if x['t'] >= 900]
    return ser

def rng(vals):
    vals = [v for v in vals if v is not None]
    if not vals: return None
    a, b = min(vals), max(vals)
    return f'{a}' if a == b else f'{a}–{b}'

MSG = {'adebug': 'A persistent notice, pending', 'b': 'A persistent notice raised after', 'c': 'Couldn’t save just now', 'areal': 'A fresh brew of Kettle is ready'}
rows = []
for key in sorted(runs):
    cfg, day, k = key
    r = runs[key]
    ser = settled(r)
    none = runs.get((cfg, day, 'none'))
    nser = settled(none) if none else []
    tops = [x['sheet'][1] for x in ser if x['sheet']]; bots = [x['sheet'][3] for x in ser if x['sheet']]
    ntops = [x['sheet'][1] for x in nser if x['sheet']]; nbots = [x['sheet'][3] for x in nser if x['sheet']]
    ft = [x['footer'][1] for x in ser if x['footer']]; fb = [x['footer'][3] for x in ser if x['footer']]
    nft = [x['footer'][1] for x in nser if x['footer']]
    def dmax(a, b):
        if not a or not b: return None
        return round(max(abs(max(a) - max(b)), abs(min(a) - min(b))), 1)
    drawn_on_summary = sum(1 for x in ser if x['notices'])
    allser = (r.get('summary') or {}).get('series', [])
    drawn_any = sum(1 for x in allser if x['notices'])
    over = sum(1 for x in allser if x.get('noticeOverSheet') or x.get('noticeOverFooter') or x.get('noticeOverFigures'))
    cut = rng([x['cut'] for x in ser]); under = rng([x['under'] for x in ser])
    face = sorted(set(str(x.get('faceTop')) for x in ser)); gauge = sorted(set(str(x.get('gaugeTop')) for x in ser))
    sof = f"{sum(1 for x in ser if x.get('sheetOverFace'))}/{sum(1 for x in ser if x.get('sheetOverGauge'))} of {len(ser)}" 
    nface = sorted(set(str(x.get('faceTop')) for x in nser)); ngauge = sorted(set(str(x.get('gaugeTop')) for x in nser))
    # next screen
    nxt = r.get('next') or []
    shown = [x for x in nxt if x['s']]
    order = []
    for x in shown:
        for t in x['s'].split(' | '):
            if not order or order[-1] != t: order.append(t)
    maxn = max([x['n'] for x in shown], default=0)
    whole = all(x['whole'] for x in shown) if shown else None
    cutn = any(x['cut'] for x in shown) if shown else None
    msg = MSG.get(k)
    said = [x for x in ((r.get('liveBeforeAction') if k == 'areal' and r.get('liveBeforeAction') else None) or r.get('live') or []) if x['said']]
    said_k = len([x for x in said if msg and x['text'].startswith(msg[:20])]) if msg else 0
    said_where = sorted(set(x['hash'] for x in said if msg and x['text'].startswith(msg[:20])))
    act = r.get('action') or {}
    q = r.get('queueOnSummary') or {}
    qs = [x['message'][:28] for x in (q.get('queue') or [])]
    rows.append((cfg, day, k, r.get('base', '')[-4:], rng(tops), rng(bots), dmax(tops, ntops), dmax(bots, nbots), rng(ft), dmax(ft, nft), cut, under, drawn_on_summary, over, '/'.join(face) + (' (none: ' + '/'.join(nface) + ')' if k != 'none' else ''), '/'.join(gauge), sof, '; '.join(qs) or '—', r.get('nextScreen'), ' → '.join(order) or '—', maxn, whole, cutn, f"{act.get('label')} 9/9={act.get('nine', {}).get('n')} onClick={act.get('onClick')} reload={act.get('reloaded')}" if act else '—', f"{said_k} {said_where}" if msg else '—', r.get('error') or '', json.dumps(r.get('duringBrew'))[:160] if r.get('duringBrew') else ''))

head = ['cfg', 'day', 'case', 'port', 'sheet top (settled)', 'sheet bottom', 'max |Δ top| vs none', 'max |Δ bottom| vs none', 'footer top', 'max |Δ footer top|', 'rows cut by footer', 'rows under footer', 'settled frames with a notice drawn on the summary', 'frames with a notice over sheet/footer/Chai/gauge', "Chai face centre top element", 'gauge centre top element', 'sheet box over Chai face / gauge (settled frames)', 'queue on the summary', 'next', 'drawn on next screen, in order', 'max drawn at once', 'whole', 'clipped', 'action', 'said (count, where)', 'error', 'during brew']
print('| ' + ' | '.join(head) + ' |')
print('|' + '---|' * len(head))
for r in rows:
    print('| ' + ' | '.join(str(x).replace('|', '/') for x in r) + ' |')
