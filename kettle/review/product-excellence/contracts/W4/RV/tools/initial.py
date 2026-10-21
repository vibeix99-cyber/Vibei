import re, sys, gzip, urllib.request
def get(u): return urllib.request.urlopen(u).read()
for base in sys.argv[1:]:
    html = get(base + '/').decode()
    refs = re.findall(r'(?:src|href)="\./(assets/[^"]+\.(?:js|css))"', html)
    tot = gz = 0; rows = []
    for r in refs:
        b = get(base + '/' + r); g = len(gzip.compress(b, 9)); tot += len(b); gz += g; rows.append((r, len(b), g))
    print(base, 'initial (entry + modulepreload + css):', len(refs), 'files', tot, 'B raw', gz, 'B gzip')
    for r in rows:
        if 'index-' in r[0] or 'NookFallback' in r[0] or 'art-' in r[0]: print('  ', r)
    print('  rive in initial html?', 'rive' in html.lower())
