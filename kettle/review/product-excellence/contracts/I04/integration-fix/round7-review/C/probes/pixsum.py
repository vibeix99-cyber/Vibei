# Lane C: summarise pix.jsonl (per shot: revision, mode, real ms since the action, zen, chrome opacity, toasts, status bar)
import json, sys
rows = [json.loads(l) for l in open(sys.argv[1]) if l.strip()]
print('| job | rev | shot | mode | real ms since action | data-zen | chrome opacity | toasts (text @ box top) | status bar (tight/wrap; stat rows) | panel scroll |')
print('|---|---|---|---|---|---|---|---|---|---|')
for r in rows:
    if 'name' not in r:
        if r.get('error'): print(f"| {r['job']} | {r['rev']} | ERROR | | | | | {r['error'][:120]} | | |")
        continue
    st = r.get('status')
    if st:
        tops = sorted(set(k['box'][1] for k in st['kids']))
        sb = f"{'tight' if st['tight'] else ''}{'wrap' if st['wrap'] else ''} rows@{tops} " + ' / '.join(k['t'][:16] for k in st['kids'])
    else:
        sb = '-'
    toasts = '; '.join(f"{t['text'][:40]} @{t['box'][1]}" for t in r.get('toasts', [])) or '-'
    pan = r.get('panel')
    print(f"| {r['job']} | {r['rev']} | {r['name']} | {r['mode']} | {r.get('realMsSinceAction')} | {r.get('zen')} | {','.join(r.get('chromeOpacity', [])) or '-'} | {toasts} | {sb} | {pan['scroll'] if pan else '-'} |")
