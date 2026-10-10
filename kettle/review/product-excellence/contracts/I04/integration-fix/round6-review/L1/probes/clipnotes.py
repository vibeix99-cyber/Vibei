import json, datetime, sys
SC, DST = sys.argv[1], sys.argv[2]
rs = json.load(open(f'{SC}/runs.json'))
clips = json.load(open(f'{DST}/clips/clips.json'))
def dur(r):
    a = datetime.datetime.fromisoformat(r['start_utc'].replace('Z','+00:00')); b = datetime.datetime.fromisoformat(r['end_utc'].replace('Z','+00:00'))
    return (b-a).total_seconds()
out = []
for c in clips:
    r = next(x for x in rs if x['series']==c['series'] and x['rev']==c['rev'] and x['run']==c['run'])
    d = dur(r); span = r['span_ms']; ev = r.get('first_evidence_t')
    note = {'clip': c['clip'], 'series': c['series'], 'rev': c['rev'], 'run': c['run'], 'label': c['label'], 'probe_result': c['result'], 'probe_text': r.get('probe_text','')[:260],
            'run_duration_s': round(d,1), 'recorder_span_ms': span, 'start_utc': r['start_utc'], 'end_utc': r['end_utc']}
    if c['rev']=='R5':
        note.update(first_R5D1_evidence_recorder_ms=ev, reset_times_ms=r.get('reset_times'), d1_parts=r.get('d1_parts'),
                    approx_clip_time_of_first_evidence_s=round(d - (span-ev)/1000, 1) if ev is not None else None)
    else:
        note.update(list_scroll_range=[r.get('list_min'), r.get('list_max')], older_toasts_left_recorder_ms=r.get('older_gone'), older_left_while_scrolled=r.get('older_expiry_while_scrolled'),
                    tTop_ms=r.get('tTop'), tDown_ms=r.get('tDown'), approx_clip_time_of_older_leave_s=[round(d - (span-t)/1000,1) for t in (r.get('older_gone') or [])])
    out.append(note)
json.dump(out, open(f'{DST}/clips/clips-notes.json','w'), indent=1)
for n in out: print({k:v for k,v in n.items() if k in ('clip','probe_result','run_duration_s','first_R5D1_evidence_recorder_ms','approx_clip_time_of_first_evidence_s','list_scroll_range','older_toasts_left_recorder_ms','approx_clip_time_of_older_leave_s','d1_parts')})
