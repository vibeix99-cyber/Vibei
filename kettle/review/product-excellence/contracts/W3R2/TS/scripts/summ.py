#!/usr/bin/env python3
"""summ.py <json report>: counts per (project, test title) from a Playwright JSON report."""
import json, sys, collections
r = json.load(open(sys.argv[1]))
c = collections.OrderedDict()
def walk(suite, path):
    for s in suite.get('suites', []):
        walk(s, path + [s['title']])
    for sp in suite.get('specs', []):
        for t in sp['tests']:
            k = (t['projectName'], sp['title'][:90], sp['line'])
            d = c.setdefault(k, collections.Counter())
            res = t['results'][-1] if t['results'] else {}
            d[t['status'] + (':retry' if len(t['results']) > 1 else '')] += 1
            d['ms'] += res.get('duration', 0)
for s in r['suites']:
    walk(s, [s['title']])
tot = collections.Counter()
for k, d in c.items():
    print(k[0], f':{k[2]}', k[1], dict((a, b) for a, b in d.items() if a != 'ms'), f"{d['ms']/1000:.0f}s total")
    for a, b in d.items():
        if a != 'ms': tot[a] += b
print('TOTAL', dict(tot), 'stats', r.get('stats', {}).get('expected'), 'expected,', r.get('stats', {}).get('unexpected'), 'unexpected,', r.get('stats', {}).get('flaky'), 'flaky,', r.get('stats', {}).get('skipped'), 'skipped')
