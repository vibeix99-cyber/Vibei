#!/usr/bin/env python3
"""Tables from the round-7 M7a probe runs (runs/<series>/<rev>/*.jsonl)."""
import json, glob, os, sys, re
EV = sys.argv[1]
out = []
for ser in sorted(os.listdir(EV)):
    d = os.path.join(EV, ser)
    if not os.path.isdir(d): continue
    out.append(f'\n### {ser}\n')
    if ser.startswith('r5d1'):
        out.append('| rev | config | wait | presenter | adds/removals | live-region additions | result |\n|---|---|---|---|---|---|---|')
        tot = {}
        for rev in sorted(os.listdir(d)):
            for f in glob.glob(f'{d}/{rev}/natural-*.jsonl'):
                for line in open(f):
                    r = json.loads(line)
                    m = re.search(r'(\d+x\d+) (\w+) t(\d+) wait=(\d+) #(\d+)', r['tag'])
                    k = (rev, f'{m[1]}@{m[3]} {m[2]}')
                    t = tot.setdefault(k, [0, 0]); t[0] += 1; t[1] += bool(r['bad'])
                    out.append(f"| {rev} | {k[1]} | {m[4]} #{m[5]} | {r.get('kind','T')} | {r.get('adds','?')}/{r.get('rems','?')} | {len(r.get('said',[]))} | {'FAIL: ' + '; '.join(r['bad']) if r['bad'] else 'OK'} |")
        out.append('\n| rev | config | runs | failures |\n|---|---|---|---|')
        for k, v in sorted(tot.items()): out.append(f'| {k[0]} | {k[1]} | {v[0]} | {v[1]} |')
    else:
        out.append('| rev | config | presenter | warning adds/removals | judged frames | full opacity | toast box over dock | banner drift px | Save backup cut | live-region additions | error |\n|---|---|---|---|---|---|---|---|---|---|---|')
        for rev in sorted(os.listdir(d)):
            for f in glob.glob(f'{d}/{rev}/*pair-*.jsonl'):
                for line in open(f):
                    r = json.loads(line)
                    out.append(f"| {rev} | {r['label'].split(' ',1)[1]} | {r.get('presenter','T')} | {r.get('warnAdds')}/{r.get('warnRemovals')} | {r.get('judgedFrames')} | {r.get('framesFullOpacity')} | {r.get('framesBoxOverDock')} | {r.get('bannerDriftPx')} | {r.get('framesSaveBackupCut')} | {r.get('liveRegionAdditions')} | {r.get('error','')} |")
print('\n'.join(out))
