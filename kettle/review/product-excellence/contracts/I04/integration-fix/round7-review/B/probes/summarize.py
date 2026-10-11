#!/usr/bin/env python3
"""Lane B: summarise the probe jsonl files into markdown tables (stdout). Usage: python3 -I summarize.py <scratch dir>"""
import json, sys, glob, os
S = sys.argv[1]

def rows(pat):
    out = []
    for f in sorted(glob.glob(os.path.join(S, pat))):
        if 'superseded' in f: continue
        for line in open(f):
            line = line.strip()
            if line:
                try: out.append(json.loads(line))
                except Exception: pass
    return out

print('## read (checks 1, 2, 8)\n')
print('| run | warning pos | lines read (seen/total) | all lines at once | Save backup hit-testable | input steps | download (sessions) | warning kept after save | error |')
print('|---|---|---|---|---|---|---|---|---|')
for r in rows('read/*/read-*.jsonl'):
    rd = r.get('read') or {}
    dl = r.get('download')
    print(f"| {r['tag']} | {(r.get('arrive') or {}).get('pos')} {(r.get('arrive') or {}).get('tag')} | {rd.get('linesSeen')}/{rd.get('nLines')} | {rd.get('allLinesAtOnce')} | {rd.get('saveBackupHitTestable')} | {rd.get('steps')} | {(dl or {}).get('name','NONE')} ({(dl or {}).get('sessions')}) | {(r.get('afterUse') or {}).get('warningStill')} | {r.get('error','')} |")

print('\n### keyboard (Tab from the top of Today)\n')
print('| run | reached Save backup | Tab presses | DOM order monotonic | :focus-visible on Save backup | ring (style width colour offset) | Save backup hit-testable when focused | sequence |')
print('|---|---|---|---|---|---|---|---|')
for r in rows('read/*/read-*.jsonl'):
    t = r.get('tab')
    if not t: continue
    last = t['order'][-1] if t['order'] else {}
    seq = ' → '.join(o.get('d', '')[:22] for o in t['order'][:40])
    print(f"| {r['tag']} | {t['reached']} | {t['presses']} | {t['domOrderMonotonic']} | {last.get('fv') if t['reached'] else '-'} | {' '.join(last.get('ring', [])[:4]) if t['reached'] else '-'} | {t.get('sbVisibleWhenFocused')} | {seq} |")

print('\n### tone (check 8)\n')
print('| run | background | border | text | contrast text/bg | contrast border/bg | HSL bg | HSL border | icon tile | animations | transitions | role / aria-live | page h-scroll |')
print('|---|---|---|---|---|---|---|---|---|---|---|---|---|')
seen = set()
for r in rows('read/*/read-*.jsonl'):
    t = r.get('tone')
    if not t: continue
    key = (r['rev'], r['theme'], r['text'], r['W'])
    if key in seen: continue
    seen.add(key)
    print(f"| {r['rev']} {r['W']}x{r['H']} t{r['text']} {r['theme']} | {t.get('bg')} | {t.get('border')} {t.get('borderW')} | {t.get('color')} | {t.get('contrastText')} | {t.get('contrastBorder')} | {t.get('hslBg')} | {t.get('hslBorder')} | {t.get('iconBg')} {t.get('hslIcon')} | {t.get('anims')} {t.get('animNames')} | {t.get('trans')} | {t.get('role')} / {t.get('ariaLive')} | {t.get('hScroll')} |")

print('\n## cover (checks 3, 4)\n')
for r in rows('cover/*/cover-*.jsonl'):
    print(f"\n**{r['tag']}** {('ERROR ' + r['error']) if r.get('error') else ''}\n")
    print('| state | warning element (pos) | toasts | control: covered frames / frames (missing, off) |')
    print('|---|---|---|---|')
    for name, s in (r.get('states') or {}).items():
        cells = []
        for n, row in s['rows'].items():
            cells.append(f"{n}: {row['covered']}/{row['frames']}" + (f" (m{row['missing']}, o{row['off']})" if row['missing'] or row['off'] else '') + (f" by {row['by']}" if row['covered'] else ''))
        w = s.get('warning')
        print(f"| {name} | {(w or {}).get('tag')} {(w or {}).get('pos')}{' WARN-TOAST' if s.get('warnToast') else ''} | {s.get('toasts')} | {'; '.join(cells)} |")
    n = r.get('note') or {}
    print(f"\nnote: present={n.get('present')} text={n.get('text')!r} textLines={n.get('textLines')} oneRow={n.get('oneRow')} height={n.get('height')} pos={n.get('pos')}; download={r.get('noteDownload')}; saved-words on summary={n.get('savedWords')}")
    print(f"summary end: scroll={r.get('detailsScroll')} {r.get('summaryEnd')}; Break's over scroll={r.get('overScroll')}")

print('\n## behave (checks 5, 6)\n')
for r in rows('behave/*/behave-*.jsonl'):
    print(f"\n**{r['tag']}** {('ERROR ' + r['error']) if r.get('error') else ''}")
    print(f"- before any failed save (storage full): warning={r.get('beforeFail')}")
    print(f"- appear: {r.get('appear')}")
    print(f"- kept on Today 13 s (1/s): {r.get('keptOnToday13s')}")
    print(f"- nav (real taps): {[(l['to'], l['hash'], l['warning']) for l in r.get('log', [])]}")
    print(f"- settings: {r.get('settings')}")
    print(f"- live-region additions of the warning text: {r.get('saidCount')} {r.get('said')}")
    print(f"- after room made (6 s, 4/s): {r.get('presentAfterFree6s')}")
    print(f"- disappear: {r.get('disappear')}")

print('\n## markdone (check 6, LEAD probe)\n')
for f in sorted(glob.glob(os.path.join(S, 'markdone', 'markdone-*.jsonl'))):
    for line in open(f):
        r = json.loads(line)
        keys = ['tag', 'markDoneInView', 'scrollYBeforeTap', 'quota', 'toastWarnAdds', 'toastWarnRemovals', 'bannerAdds', 'bannerRemovals', 'bannerFirstAt', 'bannerInViewFrames', 'bannerWholeInViewFrames', 'bannerViewportTopFirst', 'bannerViewportTopLast', 'bannerViewportBottomLast', 'scrollYFirst', 'scrollYLast', 'fieldTopRange', 'said', 'notificationsAdds', 'error']
        print('- ' + json.dumps({k: r.get(k) for k in keys}, ensure_ascii=False))

print('\n## truth (End early)\n')
for r in rows('truth/truth-*.jsonl'):
    print('- ' + json.dumps({k: r.get(k) for k in ['tag', 'failedBeforeEnd', 'warningBeforeEnd', 'sheetText', 'toastsAfterEnd', 'writesAfterEnd', 'said', 'hash', 'warningAfter', 'claimsSaved', 'error']}, ensure_ascii=False))
