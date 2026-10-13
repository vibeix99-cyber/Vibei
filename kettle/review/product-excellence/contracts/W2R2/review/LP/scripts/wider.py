#!/usr/bin/env python3
import json, glob, os, sys
runs = {}
for d in sys.argv[1:]:
    for f in sorted(glob.glob(f'{d}/*/[CP]-big.json')):
        tag = os.path.basename(os.path.dirname(f)); side = os.path.basename(f)[0]
        runs[(tag, side)] = json.load(open(f))
def ov(a0, a1, b0, b1): return round(max(0, min(a1, b1) - max(a0, b0)), 1)
print('| cfg | build | layout (sheet box l–r × t–b) | scroll lift / air | Chai img box (l–r × t–b), in viewport | viewport | kettle svg box (l–r × t–b) | kettle drawn ink (l–r × t–b), incl. faint glow | horizontal overlap sheet ∩ Chai img / ∩ kettle svg | Chai img wholly in viewport | heading in view (box / ink) | text lines cut by fold (box / ink) | unlock card visible px / height; unlock canvas boxes | controls covered (elementFromPoint) | Tea time + Skip break centre hit-test | last line → footer at end | page errors |')
print('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|')
tags = sorted({k[0] for k in runs}, key=lambda t: (-int(t.split('x')[0]), 'dark' in t, int(t.split('-t')[1])))
for t in tags:
    for side in 'CP':
        r = runs.get((t, side))
        if not r or not r.get('settled'): continue
        s = r['settled']; sh = s['sheet']['box']; ch = s['fig'].get('chai', {}).get('img'); k = s['fig'].get('kettle', {}).get('svg'); kp = s['fig']['kettle']['paint']
        ik = s.get('ink') or {}
        iv = s['inView']; u = iv['unlockCard']; un = s['hierarchy'].get('unlock') or {}
        canv = '; '.join(f"{c['l']:g}–{c['r']:g}×{c['t']:g}–{c['b']:g}" for c in (un.get('canvas') or [])) or 'no canvas'
        cut = len(s['fold']['cut']); icut = len([c for c in ik.get('cut', []) if not c.get('inSvg')])
        cov = s['covered']
        print(f"| {t} | {'control' if side == 'C' else 'P'} | {sh['l']:g}–{sh['r']:g} × {sh['t']:g}–{sh['b']:g} | {s['scroll']['scrollTop']:g} / {s['sheet']['air'].replace('px','')} | {ch['l']:g}–{ch['r']:g} × {ch['t']:g}–{ch['b']:g} | {s['vw']}×{s['vh']} | {k['l']:g}–{k['r']:g} × {k['t']:g}–{k['b']:g} | {kp['l']:g}–{kp['r']:g} × {kp['t']:g}–{kp['b']:g} | {ov(sh['l'],sh['r'],ch['l'],ch['r'])} (and vertical {ov(sh['t'],sh['b'],ch['t'],ch['b'])}) / {ov(sh['l'],sh['r'],k['l'],k['r'])} (vertical {ov(sh['t'],sh['b'],k['t'],k['b'])}) | {s['figures']['chaiInViewport']} | {s['heading']['whole']} / {(ik.get('heading') or {}).get('wholeByInk')} | {cut} / {icut} | {('–' if not u else str(u['visiblePx'])+'/'+str(u['h']))}; {canv} | {len(cov)}{(' '+json.dumps(cov)) if cov else ''} | {'ok' if not cov else 'see covered'} | {(r.get('end') or {}).get('end', {}).get('lastLineToFooter')} | {len(r['errors'])} |")
