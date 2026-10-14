#!/usr/bin/env python3
# LR-sumpw.py <json> ...: per-file counts and the failing tests from Playwright JSON reports
import sys, json, collections
tot = collections.Counter(); per = collections.defaultdict(collections.Counter); fails = []; dur = 0
for f in sys.argv[1:]:
    try: j = json.load(open(f))
    except Exception as e: print('cannot read', f, e); continue
    dur += j.get('stats', {}).get('duration', 0)
    def walk(s, file=''):
        file = s.get('file', file)
        for sp in s.get('specs', []):
            for t in sp['tests']:
                st = t['status']  # expected / unexpected / flaky / skipped
                per[sp['file']][st] += 1; tot[st] += 1
                if st in ('unexpected', 'flaky'):
                    r = t['results']
                    fails.append((sp['file'], sp['line'], sp['title'], st, [ (x['status'], round(x['duration']/1000,1)) for x in r ], (r[-1].get('error') or {}).get('message', '')[:300].replace('\n', ' ')))
        for c in s.get('suites', []): walk(c, file)
    for s in j['suites']: walk(s)
print('duration (sum of runs) %.1f min' % (dur/60000))
print(dict(tot))
for k, v in sorted(per.items()): print(f'{k}: {dict(v)}')
for x in fails: print('FAIL', x)
