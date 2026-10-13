#!/usr/bin/env python3
"""Lane P analysis: read <dir>/<cfg-tag>/{C,P}-<day>.json (lp-probe2 output) and print markdown tables (raw numbers only)."""
import json, sys, glob, os

d = sys.argv[1]
mode = sys.argv[2] if len(sys.argv) > 2 else 'all'
DAYN = {'routine': 'routine', 'task': 'task', 'big': 'big', 'milestone': 'milestone'}
rows = {}
for f in sorted(glob.glob(f'{d}/*/[CP]-*.json')):
    tag = os.path.basename(os.path.dirname(f))
    side, day = os.path.basename(f)[:-5].split('-', 1)
    rows[(tag, day, side)] = json.load(open(f))

def order(k):
    tag, day, side = k
    w = int(tag.split('x')[0]); th = 'light' in tag; tx = int(tag.split('-t')[1])
    return (-w, not th, tx, ['routine', 'task', 'big', 'milestone'].index(day), side)

keys = sorted({(t, dd) for (t, dd, s) in rows}, key=lambda k: order((k[0], k[1], 'C')))

def g(r, ph, *path, dflt=None):
    x = r.get(ph)
    for p in path:
        if x is None: return dflt
        x = x.get(p) if isinstance(x, dict) else None
    return x if x is not None else dflt

def f1(x):
    return '–' if x is None else (f'{x:.1f}' if isinstance(x, float) else str(x))

def hit(r, ph, who):
    h = g(r, ph, 'figures', who)
    return '–' if not h else f"{h.get('bySheet', '?')}/{h['samples']}"

if mode in ('all', 'geom'):
    print('## Geometry: Chai, kettle, sheet, heading, fold, end (px; clear = sheet top edge (box top − 2 px line) − figure bottom; + = figure above the sheet)\n')
    print('| cfg | day | build | phase | lift (scrollTop) | air | sheet top | Chai img clear | Chai ink clear | kettle svg clear | kettle ink clear | kettle lowest ink el (bottom; over svg box) | Chai/kettle ink samples under the sheet (of) | heading in view by line box (top–bottom) / by glyph ink (lowest ink → fold top) | highlighted cards (hl+unlock) | highlight / unlock card in view (visible px of height) | lines cut by the fold: text-box / glyph-ink | lines starting in the 14 px fade: text-box / ink | end: last line→footer | errors |')
    print('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|')
    for (tag, day) in keys:
        for side in 'CP':
            r = rows.get((tag, day, side))
            if not r: continue
            for ph in ('arrival', 'settled'):
                s = r.get(ph)
                if not s or 'error' in s: print(f'| {tag} | {day} | {side} | {ph} | NO DATA |'); continue
                low = g(r, ph, 'fig', 'kettle', 'lowest')
                svgb = g(r, ph, 'fig', 'kettle', 'svg', 'b')
                lowtxt = '–' if not low else f"{low['tag']}.{low['cls'] or low['id'] or ''} {low['bottom']} (+{low['bottom']-svgb:.1f}) op {low['opacity']}/{low['fillOpacity']}"
                cut = s['fold']['cut']; peek = s['fold']['peek']
                ik = s.get('ink') or {}
                icut = [c for c in ik.get('cut', []) if not c.get('inSvg')]; ipeek = [c for c in ik.get('peek', []) if not c.get('inSvg')]
                svgcut = [c for c in ik.get('cut', []) if c.get('inSvg')]
                hi = (ik.get('heading') or {})
                iv = s['inView']
                def vv(x):
                    return '–' if not x else f"{x['visiblePx']}/{x['h']}" + (' whole' if x['whole'] else '')
                hlv = f"hl {vv(iv['highlightCard'])}; unlock {vv(iv['unlockCard'])}"
                print(f"| {tag} | {day} | {side} | {ph} | {s['scroll']['scrollTop']} | {s['sheet']['air']} | {s['sheet']['box']['t']} | {f1(g(r,ph,'figures','chaiImgClear'))} | {f1(g(r,ph,'figures','chaiPaintClear'))} | {f1(g(r,ph,'figures','kettleSvgClear'))} | {f1(g(r,ph,'figures','kettlePaintClear'))} | {lowtxt} | {hit(r,ph,'chaiHit')} / {hit(r,ph,'kettleHit')} | {s['heading']['whole']} ({s['heading']['box']['t']}–{s['heading']['box']['b']}) / {hi.get('wholeByInk')} ({hi.get('lowestInkB')} → {hi.get('toFoldTop')}) | {s['nHl']}+{s['nUnlock']} | {hlv} | {len(cut)}{(' '+'; '.join(c['text'] for c in cut)) if cut else ''} / {len(icut)}{(' '+'; '.join(c['text']+' ('+str(c['inFadePx'])+'px in fade)' for c in icut)) if icut else ''}{(' (+'+str(len(svgcut))+' svg art)') if svgcut else ''} | {len(peek)} / {len(ipeek)}{(' '+'; '.join(p['text']+' '+str(p['inFadePx']) for p in ipeek)) if ipeek else ''} | {f1(g(r,'end','end','lastLineToFooter'))} (atBottom {g(r,'end','end','atBottom')}) | {len(r['errors'])} |")

if mode in ('all', 'hier'):
    print('\n## Hierarchy: minutes heading, Tea time, highlight card, unlock card (computed style and element area px²), settled\n')
    print('| cfg | day | build | minutes: size/weight/colour/area | Tea time label: size/weight/colour | Tea time: button area / face area / fill | highlight card: title size/weight/colour | highlight: card area / box h / art | highlight note (size/weight) | unlock card: title size/weight | unlock: area / h | highlighted cards | highlight/unlock in view on arrival (visible px of h; whole?) | covered controls | text overlaps between different text nodes |')
    print('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|')
    for (tag, day) in keys:
        for side in 'CP':
            r = rows.get((tag, day, side))
            if not r or 'error' in (r.get('settled') or {}) or not r.get('settled'): continue
            s = r['settled']; a = r['arrival']; h = s['hierarchy']
            H = h['heading']; T = h['teaTime']; L = h['highlight']; U = h['unlock']
            hlt = '–' if not L else f"{L['titleFont']['size']}/{L['titleFont']['weight']}/{L['titleFont']['color']}"
            hla = '–' if not L else f"{L['area']} / {L['box']['h']} / {L['art']}"
            hln = '–' if not L or not L.get('noteFont') else f"{L['noteFont']['size']}/{L['noteFont']['weight']} “{L['note']}”"
            ut = '–' if not U else f"{U['titleFont']['size']}/{U['titleFont']['weight']}"
            ua = '–' if not U else f"{U['area']} / {U['box']['h']}"
            iv = a['inView']
            def v(x):
                return '–' if not x else f"{x['visiblePx']}/{x['h']} {'whole' if x['whole'] else 'part' if x['partial'] else 'none'}"
            print(f"| {tag} | {day} | {side} | {H['size']}/{H['weight']}/{H['color']}/{H['area']} | {T['label']['size']}/{T['label']['weight']}/{T['label']['color']} | {T['area']} / {T['face']['w']*T['face']['h']:.0f} / {T['fill']} | {hlt} | {hla} | {hln} | {ut} | {ua} | {s['nHl']}+{s['nUnlock']} | hl {v(iv['highlightCard'])}; unlock {v(iv['unlockCard'])} | {len(s['covered'])}{(' '+json.dumps(s['covered'])) if s['covered'] else ''} | {len([o for o in s['overlaps'] if o.split(' × ')[0].split(' [')[0] != o.split(' × ')[1].split(' [')[0]])} |")
