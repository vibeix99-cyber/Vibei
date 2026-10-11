# L1 summariser: reads L1/runs/** and prints markdown tables (no judgement beyond counting).
import json, glob, os, re, sys
R = '/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round8-review/L1/runs'
def rows(pat):
    out = []
    for f in sorted(glob.glob(os.path.join(R, pat))):
        for l in open(f):
            l = l.strip()
            if l:
                try: out.append(json.loads(l))
                except Exception: pass
    return out
which = sys.argv[1:] or ['tr2', 'accept', 'dock', 'l1dock', 'natural', 'markdone']
if 'tr2' in which:
    print('### toastroom2.mjs (lead, update case)\n')
    print('| rev | config | place | panel | toast text, box px, visible px, action on top | top-bar words under a toast |')
    print('|---|---|---|---|---|---|')
    for r in rows('c1-*toastroom2/*.jsonl'):
        for name, s in r['samples']:
            ts = '; '.join(f"{t[0][:14]} {t[1]}/{t[2]} {'on top' if t[4] else ('NOT on top' if t[4] is False else '')}" for t in s['toasts']) or '(none)'
            print(f"| {r['rev']} | {r['W']}x{r['H']} @{r['text']} {r['theme']} | {name} | {s['panel']} | {ts} | {', '.join(s['barOverlap']) or 'none'} |")
    print()
if 'accept' in which:
    print('### accept.mjs (M8) per run\n')
    print('| rev | config | input | utc | frames | covered frames (all / >400 ms) | samples | toasts not whole | folded samples | actions not on top | bar words under toast | docked per sample | real taps activated | error / notes |')
    print('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|')
    for r in rows('c1-*accept/accept-*.jsonl'):
        s = r['samples']
        notwhole = sum(1 for x in s for t in x['toasts'] if t['visible'] < t['box'] - 1 or t['natural'] > t['box'] + 1)
        folded = sum(1 for x in s if any(t.get('folded') for t in x['toasts']))
        act = sum(1 for x in s for t in x['toasts'] if t['actHit'] is False)
        bar = sum(1 for x in s if x['barOverlap'])
        fr = r.get('frames') or {}
        taps = r['taps']; ok = sum(1 for t in taps if t.get('activated'))
        note = '; '.join(([r['error']] if r.get('error') else []) + r['notes'][:3])
        print(f"| {r['rev']} | {r['W']}x{r['H']} @{r['text']} {r['theme']} | {r['mode']} | {r['utc'][11:19]} | {fr.get('frames','-')} | {fr.get('covered','-')} / {fr.get('coveredAfter400ms','-')} | {len(s)} | {notwhole} | {folded} | {act} | {bar} | {''.join('D' if x['docked'] else '-' for x in s)} | {ok}/{len(taps)} | {note} |")
    print()
if 'dock' in which:
    print('### Landscape dock geometry on R8 (accept.mjs samples; region = the toasts\' region rect [l,t,r,b] in CSS px)\n')
    print('| config | place | n | docked | panel scrollTop/max | region rect | toasts: box/natural/visible, folded, rect |')
    print('|---|---|---|---|---|---|---|')
    seen = set()
    for r in rows('c1-r8-accept/accept-*.jsonl'):
        for x in r['samples']:
            k = (r['W'], r['H'], r['text'], r['theme'], x['where'], x['n'], x.get('after'))
            if k in seen or x['where'] == 'middle': continue
            seen.add(k)
            ts = '; '.join(f"{t['text'][:12]} {t['box']}/{t['natural']}/{t['visible']}{' F' if t.get('folded') else ''} {t['rect']}" for t in x['toasts'])
            print(f"| {r['W']}x{r['H']} @{r['text']} {r['theme']} | {x['where']}#{x['i']}{' ' + x['after'] if x.get('after') else ''} | {x['n']} | {'D' if x['docked'] else '-'} | {x['panel']} | {x['region']} | {ts} |")
    print()
if 'l1dock' in which:
    print('### l1dock.mjs (L1) per run\n')
    print('| rev | config | input | utc | frames | frames with ANY control covered (all / >600 ms after event) | frames with a toast not whole (all / >600 ms) | real taps | docked per sample | error / notes |')
    print('|---|---|---|---|---|---|---|---|---|---|')
    for r in rows('c1-l1dock*/l1dock-*.jsonl'):
        fr = r.get('frames') or {}
        taps = ' '.join(f"{t['where']}:{t['label']}/{t.get('how','')}/n{t.get('n','')}{'/folded' if t.get('folded') else ''}={'ok' if t.get('activated') else 'FAIL'}{'/PAGE CHANGED' if t.get('pageChanged') else ''}" for t in r['taps'])
        dk = ' '.join(f"{s['label']}:{'D' if s['docked'] else '-'}" for s in r['samples'])
        note = '; '.join(([r['error']] if r.get('error') else []) + r['notes'][:3])
        print(f"| {r['rev']} | {r['W']}x{r['H']} @{r['text']} {r['theme']} | {r['input']} | {r['utc'][11:19]} | {fr.get('frames','-')} | {fr.get('ctlBad','-')} / {fr.get('ctlBadSettled','-')} | {fr.get('toastBad','-')} / {fr.get('toastBadSettled','-')} | {taps} | {dk} | {note} |")
    print()
    print('#### l1dock samples\n')
    print('| rev | config | input | sample | panel | docked | region | stage | toasts: box/natural/visible F=folded, action on top | controls covered now |')
    print('|---|---|---|---|---|---|---|---|---|---|')
    for r in rows('c1-l1dock*/l1dock-*.jsonl'):
        for s in r['samples']:
            ts = '; '.join(f"{t['text'][:12]} {t['box']}/{t['natural']}/{t['vis']}{' F' if t['folded'] else ''}{' act:' + ('ok' if t['actHit'] else 'NOT') if t['actHit'] is not None else ''}" for t in s['toasts']) or '(none)'
            print(f"| {r['rev']} | {r['W']}x{r['H']} @{r['text']} {r['theme']} | {r['input']} | {s['label']} | {s['panel']} | {'D' if s['docked'] else '-'} | {s['region']} | {s['stage']} | {ts} | {', '.join(s['ctlBadNow']) or 'none'} |")
    print()
if 'natural' in which:
    print('### R5-D1 (natural-a2) per run (stdout lines)\n')
    for d in sorted(glob.glob(os.path.join(R, 'r5d1-*'))):
        print(f"**{os.path.basename(d)}**\n")
        for l in open(os.path.join(d, 'stdout.txt')):
            l = l.rstrip()
            if ' [wheel] ' in l or ' [touch] ' in l or 'failures in' in l or 'Error' in l:
                l = re.sub(r'\| live-region ad', '| live-region ad', l)
                print('- `' + l[:520].replace('`', "'") + '`')
        print()
if 'markdone' in which:
    print('### LEAD-D1 (markdone-a3) per run\n')
    print('| series | rev | config | input | utc | crossed off | warning toast adds/removals | toast box over dock frames | banner adds/removals | banner min opacity | banner page tops | Save backup cut frames | live-region additions (warning text) | banner where last | error |')
    print('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|')
    for d in sorted(glob.glob(os.path.join(R, 'leadd1-*'))):
        for l in open(os.path.join(d, 'stdout.txt')):
            l = l.strip()
            if not l.startswith('{'): continue
            try: x = json.loads(l)
            except Exception: continue
            print(f"| {os.path.basename(d)} | {x.get('rev')} | {x.get('W')}x{x.get('H')} @{x.get('text')} {x.get('theme')}{' +update toast' if x.get('pwa') else ''} | {x.get('input','')} | {str(x.get('utcStart',''))[11:19]} | {len(x.get('crossed') or [])} | {x.get('toastWarnAdds')}/{x.get('toastWarnRemovals')} | {x.get('toastWarnBoxOverDockFrames')} | {x.get('bannerAdds')}/{x.get('bannerRemovals')} | {x.get('bannerMinOpacity')} | {x.get('bannerPageTops')} | {x.get('saveBackupCutFrames')} | {x.get('liveAdds')} | {x.get('bannerWhereLast')} | {x.get('error') or ''} |")
    print()
