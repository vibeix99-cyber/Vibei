"""W2R2 Maker P: BEFORE/AFTER tables from p2probe.mjs output (probe.json per side/config).

  python3 -I analyze.py <probe-root> [BEFORE AFTER]  ->  <probe-root>/tables.md, <probe-root>/tables.json
"""
import json
import os
import sys

root = sys.argv[1]
sides = sys.argv[2:4] if len(sys.argv) > 3 else ['BEFORE', 'AFTER']
CFG_ORDER = ['390x844', '375x667', '844x390', '667x375', '1440x900']
DAYS = ['routine', 'task', 'big', 'k02', 'best']


def cfgs(side):
    d = os.path.join(root, side)
    out = []
    if not os.path.isdir(d):
        return out
    for c in os.listdir(d):
        p = os.path.join(d, c, 'probe.json')
        if os.path.exists(p):
            out.append(c)
    key = lambda c: (CFG_ORDER.index(c.split('-')[0]) if c.split('-')[0] in CFG_ORDER else 9, c.split('-')[1], c.split('-')[2])
    return sorted(out, key=key)


def load(side, c):
    return json.load(open(os.path.join(root, side, c, 'probe.json')))


rows = []
for side in sides:
    for c in cfgs(side):
        m = load(side, c)
        for day in DAYS:
            v = m['days'].get(day)
            if not v or 'settled' not in v or not v['settled'] or 'error' in v['settled']:
                continue
            for phase in ('arrival', 'settled'):
                s = v.get(phase)
                if not s or 'error' in s:
                    continue
                cl = s.get('clear') or {}
                hi = s['hier']
                hl = hi.get('highlight') or hi.get('unlock')
                rows.append({
                    'side': side, 'cfg': c, 'day': day, 'phase': phase, 'stacked': s['stacked'],
                    'rest': s['sheetRest'], 'lift': s['scrollTop'], 'padTop': s.get('sheetPadTop'), 'sheetTop': s['sheetTop'],
                    'chaiBottom': (s['figs'].get('chai') or {}).get('b'), 'kettleBottom': (s['figs'].get('kettle') or {}).get('b'),
                    'clearChai': cl.get('chai'), 'clearKettle': cl.get('kettle'), 'clearChaiInk': cl.get('chaiInk'), 'clearKettleInk': cl.get('kettleInk'),
                    'cut': len(s['fold']['cut']), 'cutNames': [x['name'] for x in s['fold']['cut']],
                    'headingInView': s['headingInView'], 'ctaHit': s['ctaHit'], 'skipHit': s['skipHit'],
                    'streakText': s['copy']['textContentTotal'], 'streakVisible': s['copy']['visible'], 'streakSr': s['copy']['srOnly'],
                    'streakAria': len(s['copy']['ariaLabels']), 'streakAnnounce': s['copy']['announceStreak'],
                    'streakHits': s['copy']['visibleHits'] + s['copy']['srHits'],
                    # the summary's own words: every "streak" minus the badge catalogue name in a badge pill / "New badge: …"
                    'streakOwn': s['copy']['textContentTotal'] - sum(p['text'].count('Warm Streak') for p in s['pills']) - s['copy']['announce'].count('New badge: Warm Streak'),
                    'headPx': hi['heading']['fontPx'], 'headW': hi['heading']['weight'], 'headArea': hi['heading']['area'],
                    'ctaArea': hi['cta']['area'], 'ctaFillC': hi['cta']['fillContrast'], 'ctaPx': hi['cta']['fontPx'], 'ctaW': hi['cta']['weight'],
                    'hlKind': 'highlight' if hi.get('highlight') else ('unlock' if hi.get('unlock') else None),
                    'hlArea': hl['area'] if hl else None, 'hlFillC': hl['fillContrast'] if hl else None, 'hlEdgeC': hl['edgeContrast'] if hl else None,
                    'hlPx': hl['fontPx'] if hl else None, 'hlW': hl['weight'] if hl else None, 'hlH': hl['box']['h'] if hl else None,
                    'pills': len(s['pills']), 'facts': [p['text'] for p in s['pills']],
                    'end': v.get('end'),
                })

json.dump(rows, open(os.path.join(root, 'tables.json'), 'w'), indent=1)

f = lambda x, n=1: '–' if x is None else (f'{x:.{n}f}' if isinstance(x, float) else str(x))
md = ['# P probe tables (raw)', '', f'Source: `{root}`; sides {sides}. Settled = 4.5 s after #/done; arrival = 1.5 s.', '']
md += ['## At a glance', '', '| side | phase | day-runs | stacked runs: Chai & kettle wholly above the sheet | lines cut by the fold | heading whole | Tea time & Skip hit-testable | end: min last line → footer (px) | "streak" (textContent / visible / sr-only / announcement) | "streak" in the summary’s own words |', '|---|---|---|---|---|---|---|---|---|---|']
for side in sides:
    for phase in ('arrival', 'settled'):
        rs = [r for r in rows if r['side'] == side and r['phase'] == phase]
        if not rs:
            continue
        st = [r for r in rs if r['stacked']]
        okfig = sum(1 for r in st if (r['clearChai'] or -1) >= 0 and (r['clearKettle'] or -1) >= 0)
        cut = sum(r['cut'] for r in rs)
        head = sum(1 for r in rs if r['headingInView'])
        hit = sum(1 for r in rs if r['ctaHit'] and r['skipHit'])
        ends = [r['end']['gapToFooter'] for r in rs if r.get('end')]
        sk = lambda k: sum(r[k] for r in rs)
        md.append(f"| {side} | {phase} | {len(rs)} | {okfig}/{len(st)} | {cut} | {head}/{len(rs)} | {hit}/{len(rs)} | {min(ends) if ends else '–'} | {sk('streakText')} / {sk('streakVisible')} / {sk('streakSr')} / {sk('streakAnnounce')} | {sk('streakOwn')} |")
md += ['', '## Chai / kettle vs the sheet, the fold, the end (settled)', '',
       '| side | cfg | day | rest | lift | sheet top pad | sheet top | Chai box bottom | kettle box bottom | clear Chai | clear kettle | cut lines | heading whole | Tea/Skip hit | end: last line → footer |',
       '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|']
for r in rows:
    if r['phase'] != 'settled' or r['day'] not in ('routine', 'task', 'big', 'k02', 'best'):
        continue
    e = r['end'] or {}
    md.append(f"| {r['side']} | {r['cfg']} | {r['day']} | {r['rest']} | {r['lift']} | {f(r['padTop'])} | {f(r['sheetTop'])} | {f(r['chaiBottom'])} | {f(r['kettleBottom'])} | "
              f"{f(r['clearChai'])} | {f(r['clearKettle'])} | {r['cut']}{(' ' + ','.join(r['cutNames'])) if r['cut'] else ''} | {r['headingInView']} | {r['ctaHit']}/{r['skipHit']} | "
              f"{f(e.get('gapToFooter'))} ({(e.get('last') or '')[:40]}) |")
md += ['', '## Arrival (1.5 s) — Chai / kettle and the fold', '', '| side | cfg | day | lift | clear Chai | clear kettle | cut |', '|---|---|---|---|---|---|---|']
for r in rows:
    if r['phase'] == 'arrival':
        md.append(f"| {r['side']} | {r['cfg']} | {r['day']} | {r['lift']} | {f(r['clearChai'])} | {f(r['clearKettle'])} | {r['cut']} |")
md += ['', '## Copy: "streak" on the summary (settled; details closed — textContent includes the closed arithmetic)', '',
       '| side | cfg | day | textContent | visible | sr-only | reachable aria-labels | announcement | own words | hits |', '|---|---|---|---|---|---|---|---|---|---|']
for r in rows:
    if r['phase'] == 'settled':
        md.append(f"| {r['side']} | {r['cfg']} | {r['day']} | {r['streakText']} | {r['streakVisible']} | {r['streakSr']} | {r['streakAria']} | {r['streakAnnounce']} | {r['streakOwn']} | {'; '.join(r['streakHits'])[:160]} |")
md += ['', '## Hierarchy (settled)', '',
       '| side | cfg | day | heading px/weight/area | Tea time area / fill contrast | highlight kind | highlight title px/weight | card area / height | card fill / edge contrast |',
       '|---|---|---|---|---|---|---|---|---|']
for r in rows:
    if r['phase'] == 'settled':
        md.append(f"| {r['side']} | {r['cfg']} | {r['day']} | {r['headPx']}/{r['headW']}/{r['headArea']} | {r['ctaArea']} / {r['ctaFillC']} | {r['hlKind'] or '–'} | "
                  f"{f(r['hlPx'])}/{f(r['hlW'])} | {f(r['hlArea'])} / {f(r['hlH'])} | {f(r['hlFillC'])} / {f(r['hlEdgeC'])} |")
open(os.path.join(root, 'tables.md'), 'w').write('\n'.join(md) + '\n')
print(f'{len(rows)} rows -> {root}/tables.md')

# Compact BEFORE → AFTER table for the stacked phones (settled): lift, air, clearance of Chai's / the kettle's box.
st = {}
for r in rows:
    if r['phase'] == 'settled' and r['stacked']:
        st[(r['cfg'], r['day'], r['side'])] = r
fm = ['| cfg | day | BEFORE lift | BEFORE clear Chai / kettle | AFTER lift | AFTER air | AFTER clear Chai / kettle | AFTER cut lines |', '|---|---|---|---|---|---|---|---|']
for cfg in sorted({k[0] for k in st}, key=lambda c: (CFG_ORDER.index(c.split('-')[0]), c)):
    for day in DAYS:
        b, a = st.get((cfg, day, sides[0])), st.get((cfg, day, sides[1]))
        if not b and not a:
            continue
        g = lambda r, k: f(r[k]) if r else '–'
        air = (a['padTop'] - 20) if a and a.get('padTop') is not None else None
        fm.append(f"| {cfg} | {day} | {g(b, 'lift')} | {g(b, 'clearChai')} / {g(b, 'clearKettle')} | {g(a, 'lift')} | {f(air, 0) if air is not None else '–'} | {g(a, 'clearChai')} / {g(a, 'clearKettle')} | {g(a, 'cut')} |")
open(os.path.join(root, 'figs.md'), 'w').write('\n'.join(fm) + '\n')
