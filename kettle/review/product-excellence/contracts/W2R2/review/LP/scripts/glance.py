#!/usr/bin/env python3
"""At-a-glance aggregates over lp-probe2 output dirs (raw counts, no judgement). python3 glance.py <dir> [<dir>...]"""
import json, sys, glob, os

runs = []
for d in sys.argv[1:]:
    for f in sorted(glob.glob(f'{d}/*/[CP]-*.json')):
        tag = os.path.basename(os.path.dirname(f)); side, day = os.path.basename(f)[:-5].split('-', 1)
        runs.append((tag, day, side, json.load(open(f))))

def stacked(tag):
    w, h = tag.split('-')[0].split('x'); return int(w) < int(h) and int(w) < 900

print('| build | phase | runs | stacked runs | Chai img box wholly above the sheet top edge (clear ≥ 0) | kettle svg box wholly above | Chai ink wholly above | kettle ink wholly above (incl. faint glow ellipse) | min Chai img clear | min kettle svg clear | text lines cut by the fold (line box / glyph ink) | heading wholly in view (line box / glyph ink) | max highlighted cards on one screen (hl+unlock) | runs whose highlighted card is wholly in view on arrival / has ≥1 px in view / is wholly under the fold | min last line → footer (end) | covered controls (elementFromPoint) | overlapping text lines | errors |')
print('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|')
for side in 'CP':
    for ph in ('arrival', 'settled'):
        rs = [(t, d, r) for t, d, s, r in runs if s == side and r.get(ph) and 'error' not in r[ph]]
        st = [(t, d, r) for t, d, r in rs if stacked(t)]
        def cnt(f, pool): return f'{sum(1 for t, d, r in pool if f(r[ph]))}/{len(pool)}'
        chai = lambda s: s['figures']['chaiImgClear'] is not None and s['figures']['chaiImgClear'] >= 0
        ket = lambda s: s['figures']['kettleSvgClear'] is not None and s['figures']['kettleSvgClear'] >= 0
        chaip = lambda s: s['figures']['chaiPaintClear'] is not None and s['figures']['chaiPaintClear'] >= 0
        ketp = lambda s: s['figures']['kettlePaintClear'] is not None and s['figures']['kettlePaintClear'] >= 0
        mc = [r[ph]['figures']['chaiImgClear'] for t, d, r in st if r[ph]['figures']['chaiImgClear'] is not None]
        mk = [r[ph]['figures']['kettleSvgClear'] for t, d, r in st if r[ph]['figures']['kettleSvgClear'] is not None]
        cutb = sum(len(r[ph]['fold']['cut']) for t, d, r in rs)
        cuti = sum(len([c for c in r[ph].get('ink', {}).get('cut', []) if not c.get('inSvg')]) for t, d, r in rs)
        headb = sum(1 for t, d, r in rs if r[ph]['heading']['whole'])
        headi = sum(1 for t, d, r in rs if (r[ph].get('ink', {}).get('heading') or {}).get('wholeByInk'))
        mh = max((r[ph]['nHl'] + r[ph]['nUnlock']) for t, d, r in rs) if rs else '–'
        # highlighted card in view
        w = p1 = u = n = 0
        for t, d, r in rs:
            iv = r[ph]['inView']; c = iv['highlightCard'] or iv['unlockCard']
            if not c: continue
            n += 1; w += c['whole']; p1 += c['visiblePx'] >= 1; u += c['visiblePx'] < 1
        ends = [r['end']['end']['lastLineToFooter'] for t, d, r in rs if r.get('end') and r['end'].get('end') and r['end']['end']['lastLineToFooter'] is not None]
        cov = sum(len(r[ph]['covered']) for t, d, r in rs); ov = sum(len([o for o in r[ph]['overlaps'] if o.split(' × ')[0].split(' [')[0] != o.split(' × ')[1].split(' [')[0]]) for t, d, r in rs)
        er = sum(len(r['errors']) for t, d, r in rs)
        print(f"| {'control' if side == 'C' else 'P'} | {ph} | {len(rs)} | {len(st)} | {cnt(chai, st)} | {cnt(ket, st)} | {cnt(chaip, st)} | {cnt(ketp, st)} | {min(mc) if mc else '–'} | {min(mk) if mk else '–'} | {cutb} / {cuti} | {headb}/{len(rs)} / {headi}/{len(rs)} | {mh} | {w}/{n} · {p1}/{n} · {u}/{n} | {min(ends) if ends else '–'} | {cov} | {ov} | {er} |")
