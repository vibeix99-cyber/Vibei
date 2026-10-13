import json, sys
logs = sys.argv[1]; tags = sys.argv[2:]
data = {t: {x['name'][:-4]: x for x in json.load(open(f'{logs}/pdiff-{t}.json'))} for t in tags}
states = sorted({s for t in tags for s in data[t]})
print('Cell = % of pixels over tolerance 16 / % of pixels differing at all (strict). `S` = image sizes differ (non-overlap counted as differing). Bold = over 0.5 % at tolerance 16.\n')
print('| state | ' + ' | '.join(tags) + ' |'); print('|---|' + '---|' * len(tags))
for s in states:
    cells = []
    for t in tags:
        x = data[t].get(s)
        if not x: cells.append('-'); continue
        if x['status'] == 'MISSING': cells.append('MISSING'); continue
        c = f"{x['pct_tol']:g} / {x['pct_strict']:g}" + (' S' if x['status'] == 'SIZE' else '')
        if x['pct_tol'] > 0.5 or x['status'] == 'SIZE': c = f'**{c}**'
        cells.append(c)
    print(f'| {s} | ' + ' | '.join(cells) + ' |')
