#!/usr/bin/env python3
"""Lane A r7: tables from the raw jsonl under A/runs (read-only)."""
import json, glob, os, collections
RUNS = '/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/A/runs'
def jl(p):
    out = []
    for l in open(p):
        l = l.strip()
        if l:
            try: out.append(json.loads(l))
            except Exception: pass
    return out
print('## R5-D1 (natural-a2)\n')
print('| series | runs | probe FAIL | strict R5-D1 reproduced | presenter | warning adds/removals (per run) | live-region additions (per run) | expiry classes | list scrolled | older toast left while scrolled (runs) | failing details |')
print('|---|---|---|---|---|---|---|---|---|---|---|')
for d in sorted(glob.glob(f'{RUNS}/r5d1-*')):
    for p in sorted(glob.glob(f'{d}/natural-*.jsonl')):
        rs = jl(p)
        if not rs: continue
        fails = [r for r in rs if r['bad']]
        strict = [r for r in rs if r.get('r5d1Strict', {}).get('reproduced')]
        kinds = ''.join(sorted(set(''.join(r['kind'] for r in rs))))
        ar = collections.Counter(f"{r['adds']}/{r['rems']}" for r in rs)
        la = collections.Counter(len(r['said']) for r in rs)
        ex = collections.Counter(r.get('expiryClass', '?') for r in rs)
        ls = sum(1 for r in rs if r.get('listScrolled'))
        lw = sum(1 for r in rs if r.get('leftWhileScrolled'))
        det = '; '.join(f"w{r['wait']}: {' & '.join(r['bad'])}" for r in fails)[:400]
        print(f"| {os.path.basename(d)} | {len(rs)} | {len(fails)} | {len(strict)} {[ (r['wait'], r['r5d1Strict']['firstLinked']) for r in strict]} | {kinds} | {dict(ar)} | {dict(la)} | {dict(ex)} | {ls} | {lw} | {det} |")
print('\n## LEAD-D1 (markdone-a / markdone-a2)\n')
print('| series | tag | toast warn adds/removals | toast box over dock (frames) | banner adds/removals | banner min opacity | banner page tops | Save backup cut (frames) | toast over banner (frames) | live-region additions | said (announcer) | banner in view frames / frames | where after tap | scrollY first→last | field top range | errors |')
print('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|')
for d in sorted(glob.glob(f'{RUNS}/leadd1-*')):
    for p in sorted(glob.glob(f'{d}/markdone-*.jsonl')):
        for r in jl(p):
            print(f"| {os.path.basename(d)} | {r['tag']} | {r.get('toastWarnAdds')}/{r.get('toastWarnRemovals')} | {r.get('toastWarnBoxOverDockFrames')} | {r.get('bannerAdds')}/{r.get('bannerRemovals')} | {r.get('bannerMinOpacity')} | {r.get('bannerPageTops')} | {r.get('saveBackupCutFrames', 'n/a')} | {r.get('toastOverBannerFrames')} | {r.get('liveAdds')} | {len(r.get('said') or [])} | {r.get('bannerInViewFrames')}/{r.get('bannerFrames')} | {r.get('bannerWhereLast')} | {r.get('scrollYFirst')}→{r.get('scrollYLast')} | {r.get('fieldTopRange')} | {r.get('errors')} {r.get('error','')} |")
print('\n## Warning readability (readwarn)\n')
print('| series | tag | presenter | lines seen / lines | Save backup hit (strokes) | download | squeeze frames | warn adds/removals | faded/gone frames after first | top range | fail |')
print('|---|---|---|---|---|---|---|---|---|---|---|')
for d in sorted(glob.glob(f'{RUNS}/readwarn-*')):
    for r in jl(f'{d}/readwarn.jsonl') if os.path.exists(f'{d}/readwarn.jsonl') else []:
        print(f"| {os.path.basename(d)} | {r['tag']} | {r.get('presenter')} | {r.get('linesSeen')}/{r.get('nLines')} | {r.get('saveBackupHit')} ({r.get('saveBackupStrokes')}) | {r.get('download')} | {r.get('squeezeFrames')} | {r.get('warnAdds')}/{r.get('warnRemovals')} | {r.get('fadedOrGoneAfterFirst')} | {r.get('warnTopRange')} | {'; '.join(r.get('fail') or []) or ('ERROR ' + r['error'] if r.get('error') else 'none')} |")

# ---- per-run appendix -------------------------------------------------------------------------------------------
import re, sys
if len(sys.argv) > 1 and sys.argv[1] == 'perrun':
    ser = collections.defaultdict(set)
    for l in open(f'{RUNS}/series.log'):
        m = re.search(r'START (\S+) series=(\S+) port=(\d+) rev=(\S+) probe=(\S+) sha256=(\S+)', l)
        if m: ser[m.group(2)].add(f"{m.group(5)} `{m.group(6)}…` :{m.group(3)} {m.group(4)}")
    print('\n## Appendix: every run\n')
    print('| # | series | probe sha256 · port · rev | URL | input | UTC start | load (1/5/15) | timing | result |')
    print('|---|---|---|---|---|---|---|---|---|')
    k = 0
    for d in sorted(glob.glob(f'{RUNS}/*/')):
        s = os.path.basename(d.rstrip('/'))
        for p in sorted(glob.glob(f'{d}*.jsonl')):
            for r in jl(p):
                k += 1
                if 'natural' in p:
                    res = 'FAIL ' + ' & '.join(r['bad']) if r['bad'] else 'OK'
                    st = r.get('r5d1Strict')
                    if st: res += f" · strict R5-D1 {'REPRODUCED' if st['reproduced'] else 'no'}"
                    res += f" · presenter {r['kind']} · adds/removals {r['adds']}/{r['rems']} · live {len(r['said'])}"
                    timing = f"wait {r.get('wait')} ms{(' pre ' + str(r['pre'])) if r.get('pre') else ''} · gesture {r.get('tStart')}–{r.get('tEnd')} ms · expiry {r.get('expiryClass')} · list scrolled {r.get('listScrolled')} · left while scrolled {r.get('leftWhileScrolled')}"
                    print(f"| {k} | {s} | {'; '.join(sorted(ser.get(s, ['?'])))} | {r.get('url','')} | {r.get('gesture','wheel')} | {r.get('utcStart','')} | {r.get('loadStart','')} | {timing} | {res} |")
                elif 'markdone' in p:
                    if r.get('error'):
                        res = 'ERROR ' + r['error']
                    elif r.get('bannerFrames'):
                        res = f"banner {r['bannerAdds']}/{r['bannerRemovals']} · min op {r['bannerMinOpacity']} · page tops {r['bannerPageTops']} · Save backup cut {r.get('saveBackupCutFrames','n/a')} · live {r.get('liveAdds')} · said {len(r.get('said') or [])} · {r.get('bannerWhereLast')}"
                    else:
                        res = f"toast warning {r.get('toastWarnAdds')}/{r.get('toastWarnRemovals')} · over dock {r.get('toastWarnBoxOverDockFrames')} frames · live {r.get('liveAdds')}"
                    res += f" · Mark done in view {r.get('markDoneInView')} · hit before tap {r.get('hitBeforeTap')} · crossed {r.get('crossed')}"
                    print(f"| {k} | {s} | {'; '.join(sorted(ser.get(s, ['?'])))} | {r.get('base','')}/?debug&theme={r.get('theme')}{'&nooktime=day' if r.get('theme') == 'light' else ''}#/ | {'touch tap' if r.get('W', 0) < 900 else 'click'} + touch/wheel to bring into view | {r.get('utcStart','')} | {r.get('loadStart','')} | {r.get('tag')} · {'case 2 (endless update toast)' if r.get('pwa') else 'case 1'} | {res} |")
                elif 'readwarn' in p:
                    res = '; '.join(r.get('fail') or []) or ('ERROR ' + r['error'] if r.get('error') else 'OK')
                    print(f"| {k} | {s} | {'; '.join(sorted(ser.get(s, ['?'])))} | {r.get('base','')}/?debug&theme={r.get('theme')}{'&nooktime=day' if r.get('theme') == 'light' else ''}#/ | {r.get('gesture')} | {r.get('utcStart','')} | {r.get('loadStart','')} | {r.get('tag')} | {res} · lines {r.get('linesSeen')}/{r.get('nLines')} · download {r.get('download')} |")
