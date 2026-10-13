import json, sys, glob
R='/home/user/Vibei/kettle/review/product-excellence/contracts/W2R2/review/LT/runs/'
rows=[]
for f in ['ABC.jsonl','R.jsonl','D.jsonl']:
    try:
        for l in open(R+f):
            try: d=json.loads(l); d['_src']=f; rows.append(d)
            except Exception: pass
    except FileNotFoundError: pass
def hitstr(d):
    h={k:v['hitRows'] for k,v in d['byTag'].items() if v['hitRows']}
    return f"{d['hitRowsAll']}/{d['samples']}" + (f" {h} {sorted({e for v in d['byTag'].values() for e in v['hitEls']})}" if h else '')
# Keep each configuration's final run (R reruns come after ABC); key includes the inset.
_k=lambda d:(d['flow'],d['side'],d['cfg'],d.get('pos'),d.get('when'),json.dumps((d.get('inset') or {}).get('requested')))
_last={}
for d in rows: _last[_k(d)]=d
superseded=[d for d in rows if _last[_k(d)] is not d]
rows=[d for d in rows if _last[_k(d)] is d]
which=sys.argv[1]
if which=='superseded':
    for d in superseded: print(d['_src'], d['flow'], d['side'], d['cfg'], d.get('pos'), d.get('when'))
if which=='fixmin':
    fx=[d for d in rows if d['side']=='fix' and not d.get('inset') and d['minNoticeTop'] is not None]
    print(min(d['minNoticeTop'] for d in fx), sum(d['noticeOutsideViewport'] for d in rows if d['side']=='fix'), [ (d['flow'],d['cfg'],d.get('pos'),d.get('when')) for d in fx if d['minNoticeTop']==min(x['minNoticeTop'] for x in fx)])
if which=='end':
    print('| Side | Config | Samples hit / total (phases with hits; controls hit) | Mark done box at tap / scroll | Crossed off first sample after tap | Undo box, 9-pt | Real Undo → field | Min notice top | Not-whole samples |')
    print('|---|---|---|---|---|---|---|---|---|')
    for d in rows:
        if d['flow']!='end-scrolled': continue
        at=d.get('atTap') or {}; cf=d.get('crossedFirst') or {}
        print(f"| {d['side']} | {d['cfg']} | {hitstr(d)} | {at.get('box')} / {at.get('scroll')} | {d.get('crossedFirstDrawnMs')} ms (poll {d.get('crossedPolledMs')} ms) | {cf.get('undo',{}).get('w')}×{cf.get('undo',{}).get('h')}, {cf.get('undo',{}).get('on')}/9 | {(d.get('undo') or {}).get('fieldValue', (d.get('undo') or {}).get('reason'))} | {d['minNoticeTop']} | {d['notWholeAll']} |")
if which=='today':
    print('| Config | Pos / End notices | At tap: Mark done box, scroll, ms after Today arrived, End notices drawn / waiting | First sample with Undo (ms after tap; poll) | Notice box at first sample | Undo w×h, 9-pt | Real Undo → field | Hit samples | Min top | Not whole | Src |')
    print('|---|---|---|---|---|---|---|---|---|---|---|')
    for d in rows:
        if d['flow']!='today': continue
        at=d.get('atTap') or {}; cf=d.get('crossedFirst') or {}; u=cf.get('undo') or {}
        res = d.get('na') or d.get('error') or ''
        ins = f" inset {d['inset']['requested']}" if d.get('inset') else ''
        print(f"| {d['cfg']}{ins} | {d['pos']} / {d['when']} | {at.get('box')}, {at.get('scroll')}, {at.get('msSinceArrive')}, {len(at.get('noticesDrawn') or [])} / {at.get('waiting')}{(' covered by '+str(at.get('coveredBy'))) if at.get('coveredBy') else ''} | {d.get('crossedFirstDrawnMs')} ({d.get('crossedPolledMs')}) | {cf.get('box')} | {u.get('w')}×{u.get('h')}, {u.get('on')}/9 | {(d.get('undo') or {}).get('fieldValue', (d.get('undo') or {}).get('reason'))} {res} | {hitstr(d)} | {d['minNoticeTop']} | {d['notWholeAll']} | {d['_src']} |")
if which=='hist':
    print('| Side | Config | Flow | Scroll / rows (index) | Dialog gone (ms after confirm tap) | First sample drawn with Undo (ms) | Δ first − gone | Notice box / region | Nav top; zones | Placement (inferred) | Undo w×h, 9-pt | Real Undo → state | Hit samples | Edit taps |')
    print('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|')
    for d in rows:
        if d['flow'] not in ('history','import'): continue
        f=d.get('deletedFirst') or d.get('importFirst') or {}; u=f.get('undo') or {}
        nav=d.get('nav') or {}
        reg=f.get('region')
        place='—'
        if reg and nav:
            bottom=reg[1]+reg[3]
            place = 'R-3 fallback (region bottom = nav top − 14)' if abs(bottom-(nav.get('top',0)-14))<=3 else f'band (region bottom {bottom}, nav top {nav.get("top")})'
        un=d.get('undo') or {}
        if d['flow']=='history':
            st=f"rows {d.get('rowsBefore')}→{d.get('rowsAfterDelete')}→{un.get('rowsAfter')}"
            pos=f"{d.get('scrolledTo')} / {d.get('rowsBefore')} ({d.get('rowIndex')})"
            fl=f"history {d.get('pos')}"
        else:
            st=f"brews {d.get('sessionsBefore')}→{d.get('sessionsAfterImport')}→{un.get('sessionsAfter')}"
            pos=f"{d.get('scrolledTo')} / —"
            fl='import'
        if d.get('confirmRetry') or d.get('sheetButtons') is not None: st += f" [confirm retries {d.get('confirmRetry')}; sheet buttons {d.get('sheetButtons')}]"
        print(f"| {d['side']} | {d['cfg']} | {fl} | {pos} | {d.get('dialogGoneMs')} | {d.get('deletedFirstDrawnMs') or d.get('importFirstDrawnMs')} | {((d.get('deletedFirstDrawnMs') or d.get('importFirstDrawnMs')) - d['dialogGoneMs']) if (d.get('dialogGoneMs') is not None and (d.get('deletedFirstDrawnMs') or d.get('importFirstDrawnMs')) is not None) else '—'} | {f.get('box')} / {reg} | {nav.get('top')}; {d.get('zones')} | {place} | {u.get('w')}×{u.get('h')}, {u.get('on')}/9 | {st} {('tapped' if un.get('tapped') else un.get('reason',''))} {d.get('error') or ''} | {hitstr(d)} | {d.get('editTaps')} |")
if which=='top':
    print('| Flow | Side | Config | Inset (CDP) / probe-read inset | Min notice top | Notice boxes outside viewport | Samples |')
    print('|---|---|---|---|---|---|---|')
    for d in rows:
        print(f"| {d['flow']} {d.get('pos') or ''}{('/'+d['when']) if d.get('when') else ''} | {d['side']} | {d['cfg']} | {(d.get('inset') or {}).get('requested','none')} {(d.get('inset') or {}).get('cdp','')} / {d.get('safeProbe')} | {d['minNoticeTop']} | {d['noticeOutsideViewport']} | {d['samples']} |")
