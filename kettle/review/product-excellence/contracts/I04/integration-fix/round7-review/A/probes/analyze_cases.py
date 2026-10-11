#!/usr/bin/env python3
"""Lane A r7 relaunch: tables for A/runs/markdone-cases (markdone-a4 jsonl). Read-only."""
import json, glob, os, sys, collections
RUNS = '/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/A/runs/markdone-cases'
def jl(p):
    out = []
    for l in open(p):
        l = l.strip()
        if l:
            try: out.append(json.loads(l))
            except Exception: pass
    return out
def rect(r):
    return 'none' if not r else f"top {r['t']}, bottom {r['b']}, left {r['l']}, right {r['r']}, h {r['h']}" if 'h' in r else f"top {r['t']}, bottom {r['b']}"
rows = []
for d in sorted(glob.glob(f'{RUNS}/*/')):
    s = os.path.basename(d.rstrip('/'))
    if s.startswith('smoke'): continue
    for p in sorted(glob.glob(f'{d}markdone-*-setup*.jsonl')):
        for r in jl(p):
            rows.append((s, r))
def tapfmt(r, x): return f"{x - r['tapT']:+d}"
print('## Item 5 — the banner after "Mark done" at 200 % (markdone-a4)\n')
print('Times are ms relative to the tap\'s `pointerdown` (t = 0). `scrollTop` = `document.scrollingElement.scrollTop`. "in view" = any part of the banner inside the viewport; "whole" = all of it.\n')
print('### One row per run\n')
print('| # | series | config / setup | warning presenter · first appears | scrollTop: last frames before tap · at pointerdown · range in the 6 s after | scroll jumps after the tap (t · from→to · Δ · doc height · max scroll) | banner rect at top of Today · at the tap · 3 s after | banner in view / whole, frames before tap · after tap (frames total) | live-region additions after the tap (exact text) | warning-text additions to live regions (before · after the tap; everything added to a live region before the tap) | notes |')
print('|---|---|---|---|---|---|---|---|---|---|---|')
k = 0
for s, r in rows:
    k += 1
    if r.get('error'):
        print(f"| {k} | {s} | {r['tag']} | ERROR {r['error']} | | | | | | | |"); continue
    banner = r.get('bannerFramesTotal', 0) > 0
    if banner:
        pres = f"banner · +W at {r['bannerFirstAtMs'] - r['tapT']:+d} ms ({'**already on Today before any input**' if r['setup'] == 'b' else '**first appears at the tap**'}); adds/removals {r['bannerAdds']}/{r['bannerRemovals']}; min opacity {r['bannerMinOpacity']}"
    else:
        tw3 = next((f['tw'] for f in r['framesRaw'] if f['t'] >= r['tapT'] + 3000 and f.get('tw')), None)
        pres = f"toast `toast-kettle:save-failed` (not a banner) · first appears {r['bannerFirstAtMs'] - r['tapT']:+d} ms (**first appears at the tap**); adds/removals {r['toastWarnAdds']}/{r['toastWarnRemovals']} (a loop if more than 1/0); frames with the toast in view {r['toastWarnFramesInView']} of {r['frames']}; toast box at +3 s {('top %s, bottom %s, left %s, right %s' % (tw3['t'], tw3['b'], tw3['l'], tw3['r'])) if tw3 else 'gone'}"
    jumps = '; '.join(f"{j['t'] - r['tapT']:+d} · {j['from']}→{j['to']} · {j['d']:+} · {j['docH'][0]}→{j['docH'][1]} · {j['maxScroll'][0]}→{j['maxScroll'][1]}" for j in r['jumpsAfterTap'][:6]) or 'none'
    if len(r['jumpsAfterTap']) > 6: jumps += f" … ({len(r['jumpsAfterTap'])} in all)"
    top = rect(r['atTop']) if False else (f"top {r['atTop']['banT']}, bottom {r['atTop']['banB']} (in view {r['atTop']['banInView']}, whole {r['atTop']['banWhole']})" if r.get('atTop') else 'n/a (not yet there)')
    bn = f"{top} · {rect(r['bannerRectAtTap']) if banner else rect(r['toastWarnRectLast'])} · {rect(r['bannerRectAt3sAfterTap']) if banner else 'n/a'}"
    live_after = [l for l in r['liveAdditionsAll'] if l['afterTap']]
    la = '; '.join(f"{l['t'] - r['tapT']:+d}: [{l['region']}] “{l['text']}”" for l in live_after[:5]) or 'none'
    if len(live_after) > 5: la += f" … ({len(live_after)} in all, {r['liveAdditionsWarnAfterTap']} with the warning text)"
    warn_all = r['liveAdditionsWarn']
    fa = [f for f in r['framesRaw'] if f['t'] >= r['tapT']]
    sb_after = sum(1 for f in fa if f.get('ban') and f.get('sbHit') == 0)
    tob_after = sum(1 for f in fa if f.get('tob') == 1)
    live_before = [l for l in r['liveAdditionsAll'] if not l['afterTap']]
    lb = '; '.join(f"{l['t'] - r['tapT']:+d}: [{l['region']}] “{l['text'][:160]}”" for l in live_before[:6]) or 'none'
    print(f"| {k} | {s} | {r['tag']} | {pres} | {r['scrollTopFramesBeforeTap']} · {r['scrollTopAtTapEvent']} · {r['scrollTopRangeAfterTap']} | {jumps} | {bn} | {r['bannerInViewFramesBeforeTap']}/{r['bannerWholeInViewFramesBeforeTap']} · {r['bannerInViewFramesAfterTap']}/{r['bannerWholeInViewFramesAfterTap']} ({r['frames']}) | {la} | {warn_all - r['liveAdditionsWarnAfterTap']} · {r['liveAdditionsWarnAfterTap']} ({lb}) | doc height at tap {r['docHeightAtTap']}→{r['docHeightLast']}; max scroll at tap {r['maxScrollAtTap']}→{r['maxScrollLast']}; Mark done gone from {('+%d ms' % (r['markDoneGoneAfterTapMs'] - r['tapT'])) if r.get('markDoneGoneAfterTapMs') is not None else 'never'}; visualViewport.scale {r['vvRange']}; after the tap: frames with Save backup's centre in view but covered {sb_after}, frames with a toast box over the banner box {tob_after} (whole run: {r.get('saveBackupCutOrMissFrames')} and {r.get('toastOverBannerFrames')}: sticky chrome / dock / End's own toasts while the person scrolls or before any input); page errors {r['errors']} |")
print('\n### Scroll steps to Mark done (setup b: real input from the top of Today; banner and Mark done rects after each drag/wheel)\n')
print('| series | config | start (top of Today) | steps: scrollTop · banner top..bottom · in view · Mark done top | before the tap |')
print('|---|---|---|---|---|')
for s, r in rows:
    if r.get('error') or r['setup'] != 'b': continue
    st = ' → '.join(f"{x['st']:g} · {x['banT']}..{x['banB']} · {'whole' if x['banWhole'] else ('part' if x['banInView'] else 'no')} · md {x['mdT']}" for x in r['steps'])
    a = r['atTop']; b = r['beforeTap']
    print(f"| {s} | {r['tag']} | scrollTop {a['st']:g} · banner {a['banT']}..{a['banB']} · {'whole' if a['banWhole'] else ('part' if a['banInView'] else 'not in view')} · md {a['mdT']}..{a['mdB']} | {st} | scrollTop {b['st']:g} · banner {b['banT']}..{b['banB']} · {'whole' if b['banWhole'] else ('part' if b['banInView'] else 'not in view')} · md {b['mdT']}..{b['mdB']} |")
print('\n### Per configuration and setup (all runs)\n')
agg = collections.defaultdict(list)
for s, r in rows:
    if not r.get('error'): agg[(r['rev'], r['setup'], f"{r['W']}x{r['H']}@{r['text']} {r['theme']}")].append(r)
print('| rev · setup · config | runs | warning first appears (ms from tap) | scrollTop change at the tap (Δ px; first jump within 1 s of the tap) | banner in view at the tap (frames in view in the 3 s after) | live-region additions after the tap (count; warning text count) | banner adds/removals |')
print('|---|---|---|---|---|---|---|')
for key in sorted(agg):
    rs = agg[key]
    ban = [r for r in rs if r.get('bannerFramesTotal')]
    first = sorted({(r['bannerFirstAtMs'] - r['tapT']) if r.get('bannerAdds') else None for r in rs}, key=lambda x: (x is None, x))
    first_s = ', '.join('toast design' if x is None else f"{x:+d}" for x in first)
    dj = []
    for r in rs:
        near = [j for j in r['jumpsAfterTap'] if j['t'] - r['tapT'] <= 1000]
        dj.append('none' if not near else '+'.join(f"{j['d']:+g}" for j in near))
    inv = []
    for r in rs:
        f3 = [f for f in r['framesRaw'] if r['tapT'] <= f['t'] <= r['tapT'] + 3000 and f.get('ban')] if 'framesRaw' in r else []
        inv.append(sum(1 for f in f3 if f['ban']['b'] > 0 and f['ban']['t'] < r['H']))
    print(f"| {key[0]} · setup {key[1]} · {key[2]} | {len(rs)} | {first_s} | {', '.join(dj)} | {sum(1 for r in rs if (r.get('bannerRectAtTap') and r['bannerRectAtTap']['b'] > 0 and r['bannerRectAtTap']['t'] < r['H']))}/{len(rs)} runs; frames in view in 3 s after: {inv} | {sorted({(r['liveAdditionsAfterTapAll'], r['liveAdditionsWarnAfterTap']) for r in rs})} | {sorted({(r['bannerAdds'], r['bannerRemovals']) for r in rs})} |")
