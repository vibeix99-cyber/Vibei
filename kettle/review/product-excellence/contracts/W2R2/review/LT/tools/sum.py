import json, sys
for f in sys.argv[1:]:
  for l in open(f):
    try: d=json.loads(l)
    except Exception: continue
    at=d.get('atTap') or {}
    fl=d['flow']
    base=f"{d['side']:7} {d['cfg']:20} {fl:12} {d.get('pos') or ''}{('/'+d['when']) if d.get('when') else ''} hit {d['hitRowsAll']}/{d['samples']} minTop {d['minNoticeTop']} outVP {d['noticeOutsideViewport']} notWhole {d['notWholeAll']} modal {d['modalAll']}"
    if fl in ('today','end-scrolled'):
      print(base, '| tap', at.get('box'), 'onTop', at.get('onTop'), 'scroll', at.get('scroll'), 'drawnAtTap', at.get('noticesDrawn'), 'waitingAtTap', at.get('waiting'), 'coveredBy', at.get('coveredBy'), 'maxScroll', d.get('maxScrollReached'), d.get('endWheelBack'), 'tArr', at.get('msSinceArrive'), '| firstSample', d.get('crossedFirstDrawnMs'), 'poll', d.get('crossedPolledMs'), (d.get('crossedFirst') or {}), '| undo', d.get('undo'), d.get('na') or '', d.get('error') or '', '| hitEls', {k:v['hitEls'] for k,v in d['byTag'].items() if v['hitRows']}, {k:v['hitRows'] for k,v in d['byTag'].items() if v['hitRows']})
    elif fl in ('history','import'):
      print(base, '| scroll', d.get('scrolledTo'), 'rows', d.get('rowsBefore'), d.get('rowsAfterDelete'), 'sess', d.get('sessionsBefore'), d.get('sessionsAfterImport'), 'editTaps', d.get('editTaps'), '| dlgGone', d.get('dialogGoneMs'), 'first', d.get('deletedFirstDrawnMs') or d.get('importFirstDrawnMs'), d.get('deletedFirst') or d.get('importFirst'), 'nav', d.get('nav'), 'zones', d.get('zones'), '| undo', d.get('undo'), d.get('error') or '', '| hitEls', {k:v['hitEls'] for k,v in d['byTag'].items() if v['hitRows']}, {k:(v['hitRows'],v['n']) for k,v in d['byTag'].items()})
    else:
      print(base, json.dumps({k:d.get(k) for k in ('inset','safeProbe','focusDom','error')}), {k:(v['hitRows'],v['n'],v['texts']) for k,v in d['byTag'].items()})
