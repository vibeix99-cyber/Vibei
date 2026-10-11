# Lane C: print resid.jsonl compactly, one line per (scenario, revision), the fields that classify each item
import json, sys
rows = [json.loads(l) for l in open(sys.argv[1]) if l.strip()]
keep = ['reachedSaveBackupAtPress', 'presses', 'kind', 'frames', 'presentFrames', 'goneOrFadedAfterFirst', 'overSessionBoxFrames', 'overSessionHitFrames',
        'toastOverFirstLineFrames', 'adds', 'removals', 'liveAdds', 'maxGap', 'scrollYs', 'reachedSaveBackup', 'presGoneAfterRecoveryMs', 'focusAfterRecovery',
        'linesTotal', 'linesSeenWhole', 'saveBackupHitSeen', 'shownOnToday', 'clicked', 'hash', 'clock', 'status', 'room', 'toasts', 'todayFrames', 'overFrames',
        'overMs', 'firstTodayT', 'cls', 'clsNoInput', 'maxOverWidth', 'overWidthNow', 'before', 'expanded', 'wheels', 'after', 'end', 'clears', 'panel', 'caps',
        'btns', 'innerHeight', 'error', 'errors', 'setup', 'pres0', 'presAtEnd', 'pres', 'presOnToday', 'quota', 'shown', 'tShownMs']
for r in rows:
    d = {k: r[k] for k in keep if k in r and r[k] not in (None, [], {})}
    if 'rows' in r: d['rows'] = [f"{x['y']}:{'P' if x['pres'] else '-'}:{x['focus'][:14]}" for x in r['rows']]
    if 'steps' in r: d['steps'] = [f"{s[0]}|{s[1]}|{s[2]}|{s[3]}" for s in r['steps']][:40]
    print(f"{r['s']:<26} {r['rev']:<4} {json.dumps(d, ensure_ascii=False)}")
