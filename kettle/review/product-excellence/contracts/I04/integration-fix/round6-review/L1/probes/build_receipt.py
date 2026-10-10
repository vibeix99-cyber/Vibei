#!/usr/bin/env python3
"""Compose RECEIPT.md from the generated tables and the hand-written text. python3 -I build_receipt.py <receipt L1 dir> <scratch>"""
import json, os, sys, collections, hashlib

DST, SC = sys.argv[1], sys.argv[2]
runs = json.load(open(f'{DST}/runs.json'))
clips = json.load(open(f'{DST}/clips/clips-notes.json'))
start_utc = open(f'{SC}/L1-start-utc.txt').read().strip()
end_utc = open(f'{SC}/L1-end-utc.txt').read().strip()
read = lambda n: open(f'{DST}/{n}').read()
sha = {l.split()[1]: l.split()[0] for l in open(f'{DST}/probes/SHA256.txt') if len(l.split()) == 2}

def filt(md, pred):
    lines = md.strip().split('\n')
    return '\n'.join(lines[:2] + [l for l in lines[2:] if pred(l.split('|')[1].strip() if '|' in l else l)])

results = read('tables-results.md')
control = read('tables-control.md')

# page-scroll-induced events
pg = collections.OrderedDict()
for r in runs:
    if r.get('page_scrolled'):
        pg.setdefault((r['series'], r['rev']), []).append(r)
pg_rows = '| series | rev | runs with the PAGE scrolled behind the toasts | of which the warning was hidden/re-shown or overlapped a control | label(s) | page scroll px | first evidence (recorder ms) |\n|---|---|---|---|---|---|---|\n'
tot = collections.Counter(); ind = collections.Counter(); nrun = collections.Counter()
for r in runs:
    nrun[(r['series'], r['rev'])] += 1
for (s, rev), rs in pg.items():
    pg_rows += f"| {s} | {rev} | {len(rs)} of {nrun[(s, rev)]} | {sum(1 for r in rs if r.get('page_induced'))} | " + '; '.join(f"#{r['label'].split('#')[-1]} {r['label'].split()[-3] if 'd=' in r['label'] else ''}" for r in rs) + f" | {', '.join(str(r['page_scroll_px']) for r in rs)} | {', '.join(str(r.get('first_evidence_t')) for r in rs)} |\n"

# page-induced summary text
pi = collections.OrderedDict()
for rev in ('R6', 'R5'):
    d = collections.Counter()
    for r in runs:
        if r['rev'] == rev and r.get('page_induced'):
            d[r['series']] += 1
    pi[rev] = d
def pitxt(rev):
    return ', '.join(f"{k} {v}/{nrun[(k, rev)]}" for k, v in pi[rev].items())
pxr = [r['page_scroll_px'] for r in runs if r['rev'] == 'R6' and r.get('page_induced')]
loads = [r['load_start'] for r in runs] + [r['load_end'] for r in runs]
gest = [r for r in runs if r['rev'] == 'R6' and r['series'].split('-')[0] in ('gfling', 'gfine', 'gkbd', 'ngfling', 'ngfine', 'gflingpage')]
gest_g6 = [r for r in gest if not r['series'].startswith('ng')]
gest_ng = [r for r in gest if r['series'].startswith('ng')]
# series totals
by_rev = collections.Counter(r['rev'] for r in runs)

clip_rows = '| config | rev | file | series / run | probe result | what it shows | approx. time in clip |\n|---|---|---|---|---|---|---|\n'
for c in clips:
    if c['rev'] == 'R5':
        what = f"R5-D1: {', '.join(c['d1_parts'])} (warning removed and re-added at recorder {c['reset_times_ms']} ms)"
        at = f"first evidence ~{c['approx_clip_time_of_first_evidence_s']} s of {c['run_duration_s']} s"
    else:
        what = f"natural-x flow: list scrolled {c['list_scroll_range']} px to the oldest toast and back; older toast(s) left at recorder {c['older_toasts_left_recorder_ms']} ms while the list was scrolled; warning never left"
        at = f"older toast(s) leave ~{c['approx_clip_time_of_older_leave_s']} s of {c['run_duration_s']} s"
    clip_rows += f"| {c['clip'].split('-')[2]}-{c['clip'].split('-')[3]} | {c['rev']} | `clips/{c['clip']}` | {c['series']} run {c['run']} | {c['probe_result']} | {what} | {at} |\n"

txt = f"""# L1 receipt: R5-D1 race (timing-critical), round-6 combined review

Lane **L1**. Checks and receipt only: **no verdict**, no application code, tests or maker files edited, nothing committed or pushed.

| | |
|---|---|
| Wall-clock start (UTC) | **2026-10-10 18:24:08** (first command); first measurement 18:41:18 |
| Wall-clock end (UTC) | **{end_utc.replace('Sat Oct 10 ', '2026-10-10 ').replace(' UTC 2026', '')}** (last run finished; packaging after) |
| Model / reasoning effort | Claude Sonnet 5.5 (`claude-sonnet-5-5`); reasoning effort: not inspectable |
| Machine | 4 CPUs, shared with the other lanes (browser gate `tools/slots.py`, 3 slots). `/proc/loadavg` 1-min at run starts/ends: min {min(r['load_start'] for r in runs)}, median {sorted(r['load_start'] for r in runs)[len(runs)//2]}, max {max(max(r['load_start'], r['load_end']) for r in runs)} |
| Runs | **{len(runs)}** ({by_rev['R5']} on R5 `20671eb` :5302, {by_rev['R6']} on R6 `e866118` :5301), 0 harness errors |
| Servers | `/tmp/rv6-servers/verify.sh` re-run at the end of the lane: port 5301 serves e866118 (src 05bb3f8) VERIFIED; port 5302 serves 20671eb (src b38ad5e) VERIFIED. Never stopped or restarted. |

## 1. What was found (no verdict)

1. **R6: no R5-D1 event in any run.** In {by_rev['R6']} R6 runs, 0 had the warning removed and re-added, faded below 0.98, or its layout box below its room / over the docked start *by the R5-D1 mechanism* (reading phase, definition A below; and 0 under the wider definition B). In {sum(1 for r in runs if r['rev']=='R6' and (r.get('list_max') or 0) > 1)} of those R6 runs the toast list was scrolled, and in {sum(1 for r in runs if r['rev']=='R6' and r.get('older_expiry_while_scrolled'))} an older toast left the DOM while the list was scrolled (R5-D1's trigger); the unedited race.mjs / natural.mjs (60 R6 runs) never scrolled the R6 list. On R6 the warning's box bottom is never more than 0.5 px below the room's bottom in any frame of any run (typically 2 px above it, e.g. 8 to 322 px in the 324 px room at 375x667), except in the page-scroll runs of item 3, where the room itself shrinks when the page behind moves.
2. **The pre-existing "entry flicker" is gone on R6**: 0 entry-phase re-shows in {sum(1 for r in runs if r['rev']=='R6')} R6 runs; R5 had {sum(r.get('resets_entry',0) for r in runs if r['rev']=='R5')} entry-phase re-shows in {sum(1 for r in runs if r['rev']=='R5' and r.get('resets_entry'))} of {by_rev['R5']} R5 runs, and the repro6 harness's own judge FAILs R5 in 7/10, 10/10, 10/10 runs per config (375 light, 375 dark, 844 light) through entry-phase symptoms (box displaced by the entry transform, flicker re-show); R6: 0/20 per config.
3. **A different mechanism hides the warning on R6 (and on R5): the page behind scrolls.** With **touch flings** and **keyboard arrows** the scroll chains past the end of the toast stack into the page; the docked start rises under the toast region, the region follows up to 250 ms late, the warning overlaps a protected control and M1's hold rule takes it away and re-shows it (reset). R6 runs hit: {pitxt('R6')} ({len(pxr)} runs; page moved {min(pxr)} to {max(pxr)} px). The same happens on R5: {pitxt('R5')}. It is not R5-D1 (the warning's box is never below its room on R6; the dock moved up). Reported because the lead asked for every hide/reset event; the cause is outside R5-D1.
4. **The R5 control did NOT reproduce for every probe and configuration** (section 4). Reproduced at least twice per config under the side-by-side load: **race.mjs** (10/10, 10/10, 7/10) and **race-x** (9/10, 10/10, 8/10); **natural.mjs** at 375x667 light and dark (3/10 each) but not 844x390 (0/10). **natural-x, repro6/repro6-sel and the extra-gesture probes did not reproduce R5-D1 itself twice** (reading-phase) under the pair load. Details and `CONTROL-FAILED-UNDER-LOAD` in section 7.
5. **Which R6 zeros count** (rule: only if that probe reproduced on R5 for that configuration, and the trigger state was exercised on R6): section 5.

## 2. Setup actually used (and deviations)

* **Servers**: R5 `20671eb` http://127.0.0.1:5302, R6 `e866118` http://127.0.0.1:5301, debug API (`?debug&seed=...&theme=...`, `window.__kettle`). Every browser launch went through `python3 -I tools/slots.py run --lane L1 --n 2 -- python3 -I pair.py ...` (`pair.py` starts the R5 and R6 probe processes at the same time; `--n 1` for the single-process R6-only / R5-only series).
* **Configs**: 375x667 light, 375x667 dark, 844x390 light; 200 % text (`html{{font-size:200%}}`, injected like the probes do), `localStorage` really full (probes fill it until `QuotaExceededError`), brew started, fast-forwarded 12 min with `__kettle.ff`, End, newbie seed one leaf below the next level: three toasts ("Cozy level N!", "Saved 12 minutes of focus", the storage-full warning). The debug API is used for setup only (seed, `progress.setState`, `ff`, `end('user')`).
* **Fresh browser context per run** (new Playwright context = disposable profile; one Chromium per probe process).
* **Real input only**: `page.mouse.wheel`, CDP `Input.dispatchTouchEvent`, `page.keyboard`. No programmatic scrolling in any probe (scroll offsets are only *read*). No timer changes.
* **Deviation (declared): race.mjs and race-x.mjs use a one-shot synthetic hold.** The Checker's `race.mjs` (run **unedited** as instructed) dispatches `new PointerEvent('pointerenter')` once on every toast (timers paused) and `pointerleave` on `toast-t2` after the scroll-back (timer resumes); the touch variant also re-dispatches `pointerenter` after each drag. That is a held toast in the lead's sense, although not "per frame". It is the Checker's targeted path, so its R5 control is strong, but it is **not** natural expiry. natural*.mjs, repro6*.mjs, gesture6*.mjs, natural-g.mjs dispatch no synthetic events at all (grep `dispatchEvent`: none).
* **Natural expiry** everywhere except the one-shot hold above.
* **Probes**: Checker's `race.mjs`, `natural.mjs`, `lib.mjs` and M2's `repro6.mjs` ran **unedited** (sha256 match `/tmp/rv6-servers/probe-sha256.txt`). Adapted copies (originals kept; diffs in `probes/*.diff`):

| file | sha256 | what differs from the original |
|---|---|---|
| race.mjs | `{sha['race.mjs']}` | unedited |
| natural.mjs | `{sha['natural.mjs']}` | unedited |
| lib.mjs | `{sha['lib.mjs']}` | unedited |
| repro6.mjs | `{sha['repro6.mjs']}` | unedited |
| natural-x.mjs | `{sha['natural-x.mjs']}` | natural.mjs made **direction-aware**: the toast list is `column-reverse` on R5 and top-down on R6, so the unedited probe never scrolls the R6 list. R5 branch = original code path. |
| race-x.mjs | `{sha['race-x.mjs']}` | race.mjs made direction-aware; on R6 the pointer sits on the toast with the most visible area (the list itself is `pointer-events:none`: a pointer in a gap scrolls the page, not the list). |
| repro6-sel.mjs | `{sha['repro6-sel.mjs']}` | repro6.mjs + env `IDX` to choose which run indices (timing x input) run; used to spend the R5 "at most 10 runs" on the productive indices 6,8,10,12,14,16,6,8,10,12 (wheel, "during"/"after" classes). |
| gesture6.mjs | `{sha['gesture6.mjs']}` | repro6.mjs with only the input primitive replaced (extra gestures, section 6). |
| gesture6-sel.mjs | `{sha['gesture6-sel.mjs']}` | gesture6.mjs + `IDX`. |
| natural-g.mjs | `{sha['natural-g.mjs']}` | natural-x.mjs flow with extra gesture primitives (section 6). |
| L1hook.mjs | `{sha['L1hook.mjs']}` | `node --import` preload: logs `/proc/loadavg`, `uptime` and UTC at context creation and close of **every** run; optional `recordVideo`. Changes nothing else. |
| pair.py, analyze.py, report.py, package.py, build_receipt.py, drive*.sh | see `probes/SHA256.txt` | runner and post-processing. |

* **Video** (`recordVideo` through the hook) was on only for the clip series (`naturalx-*`, `racex-*`); the main natural-x / race-x series (`nx-*`, `rx-*`) ran without it because video changes timing.
* **Not run** (time-boxed, stated): `ngkbd-*` (natural-g keyboard) and `ngfling-844L` were marked skipped (`SKIPPED.txt` in the scratch dir); no touch variant of race.mjs; no 1440 / 100 % configs (not requested). About 30 pilot runs used to debug the adapted probes are not counted anywhere.

## 3. Definitions used by my uniform post-processing (`probes/analyze.py`)

Applied to every probe's raw per-frame data, independent of each probe's own pass/fail:

* **hide/reset**: the warning element removed and re-added within 1 s (M1's re-show resets it).
* **faded/absent**: warning (with ancestors) below 0.98 opacity or absent after first reaching 0.98, before its own timed end (a removal not followed by a re-add = its own 12 s end or a dismiss; excluded).
* **below room**: warning layout box bottom more than 0.5 px under the room's bottom. **over dock / control**: box bottom under the top of the docked start (natural/race) or a protected control (repro6/gesture6: M1's `[data-toast-above] :is(button, a[href], ...)`).
* **A (strict reading phase)**: any of the above outside the *entry phase*. Entry phase = first 1.2 s after the warning first appears, extended to 0.9 s after the last re-show within the first 2 s (the pre-existing entry flicker, Checker non-blocking note 1: the entering warning's transform puts its box over the dock, M1's rule removes and re-shows it, and that re-shown element enters again). **B (wide reading)**: the same evidence anywhere after the person's first input began (so entry flicker that overlaps the start of reading counts).
* **page-scroll-induced**: the docked start / protected control rose by more than 10 px (the *page* scrolled) and the first evidence is within 200 ms of that. Such runs are counted separately and are **not** in A or B.
* **trigger state exercised** (R6 columns): the list's scrollTop was non-zero in the run; "older toast left while scrolled": an older toast left the DOM while |scrollTop| > 1 in the 300 ms before (that is R5-D1's trigger on R5).
* **Probe FAIL** = the probe's own verdict (race.mjs only judges frames after the scroll-back; repro6/gesture6 judge from the first full-opacity frame, i.e. including the entry phase).

## 4. R5 control and R6 result per probe x configuration (side by side, 10 runs each unless stated)

`R5 R5-D1 runs (A)` = runs with an A event; `(B)` = wide reading. "control reproduced twice? (A / B)". The R6 columns are the same measures on R6. Runs are pairs (R5 and R6 processes started together under the same load) except the rows marked R5-alone / R6-alone (diagnostics, one browser each). `repro6` (M2's unedited 20-run harness, R6 only) is controlled by `repro6-sel` on R5, the same code.

{control}

## 5. Which R6 zeros count (rule: the probe reproduced R5-D1 on R5 for that configuration, and the R6 run reached the trigger state)

| probe | 375x667 light | 375x667 dark | 844x390 light | note |
|---|---|---|---|---|
| race.mjs (unedited) | control YES (10/10); R6 zeros **do not count** (R6 list never scrolled in 30 runs: the probe assumes `column-reverse`) | same (10/10) | same (7/10) | R6 sat unscrolled; vacuous |
| race-x.mjs | **count** (R5 9/10; R6 0/10, list scrolled 10/10) | **count** (10/10; 0/10) | **count** (8/10; 0/10, older toast left while scrolled 10/10) | uses the one-shot synthetic hold (section 2). R6 trigger state: list scrolled in 10/10 runs of each config; the older toast (t2) leaves after the scroll-back, at rest, so "older toast left while scrolled" is 0/10 at 375 and 10/10 at 844x390 |
| natural.mjs (unedited) | control YES (3/10); R6 zeros do not count (list never scrolled) | YES (3/10); same | control NO (0/10 A; B 8/10; its 3 probe FAILs are entry flicker) | vacuous on R6 |
| natural-x.mjs (pair load) | control **NO** (0/10; B 6/10) | NO (1/10) | NO (1/10) | `CONTROL-FAILED-UNDER-LOAD`. R6 reached the trigger in 10/10 (older toast left while scrolled 10/10) and showed 0 events. |
| natural-x.mjs (R5 alone, then R6 alone) | R5 alone **4/10**; R6 alone 0/10 (30 of 30 R6-alone runs scrolled the list and an older toast left while scrolled) | R5 alone 1/10 (NO); R6 alone 0/10 | R5 alone **2/10**; R6 alone 0/10 | conditional: the R6 zeros count at 375x667 light and 844x390 light if the R5-alone control is accepted (the pair-load control failed); not at 375x667 dark (1/10) |
| repro6.mjs (M2's harness; R6 20 runs, R5 control = repro6-sel) | control **NO** (A 0/10; B 0/10; harness FAIL 7/10 = entry phase) | NO (A 0; B 2/10; FAIL 10/10 = entry phase) | NO (A 0; B 2; FAIL 10/10 = entry phase) | R6: 0 FAIL in 60 runs. The R6 zeros do **not** count against R5-D1 proper; they count only against the entry-phase symptoms the harness judge counts on R5 (R6 0/20 per config). R6 reached the scrolled list in 8/20, 8/20 and 2/20 runs. |
| extra gestures (gesture6 fling / fine / kbd, natural-g fling / fine) | control **NO** in every cell (A 0 to 1 of 10) | NO | NO | R6 zeros reported, do not count (section 6) |

## 6. Extra gesture series (gestures M2 did not use)

M2 used 20 px wheel notches and 24 px finger drags. All of these use real input and natural expiry (no synthetic events):

* **fling** (touch): CDP touch, 7 moves x 22 px about 8 ms apart (about 2.7 px/ms), touchEnd, Chromium fling inertia. `gesture6.mjs GESTURE=fling` (repro6's timing classes before/during/after, 10 runs per config) and `natural-g.mjs GESTURE=fling` (natural flow: to the oldest toast, wait 0.6 to 1.8 s, back, four more strokes).
* **fine** (trackpad-like wheel): 12 (`gesture6`) or 24 (`natural-g`) wheel events of 2 to 5 px (seeded) 16 or 8 ms apart per stroke.
* **kbd**: Shift+Tab from the document start to the last tabbable ("Save backup" in the warning, verified by `activeElement`), then ArrowDown / ArrowUp x3 per stroke (`gesture6.mjs GESTURE=kbd` only; `natural-g` keyboard not run).

Results (R5 and R6 side by side, same load; columns as in section 8):

{filt(results, lambda g: g.startswith(('gesture', 'natural-g')))}

* **R6: {sum(1 for r in gest if r.get('d1') or r.get('d1_B'))} R5-D1 events (A or B) in {len(gest)} gesture runs** (gesture6 fling/fine/kbd {len([r for r in gest_g6 if not r['series'].startswith('gflingpage')])}, gesture6-sel fling warning-only classes {len([r for r in gest_g6 if r['series'].startswith('gflingpage')])}, natural-g {len(gest_ng)}). In the natural-g runs the R6 list was scrolled in {sum(1 for r in gest_ng if (r.get('list_max') or 0) > 1)}/{len(gest_ng)} and an older toast left while it was scrolled in {sum(1 for r in gest_ng if r.get('older_expiry_while_scrolled'))}/{len(gest_ng)}.
* **The R5 control is weak for these gestures**: reading-phase A events on R5 are 0 to 1 of 10 per cell (natural-g fling 375 light 1/10; gesture-fine 375 light 1/10); wide reading B gives 3 to 7 of 10 for natural-g (entry-type flicker after the first input). So the extra-gesture R6 zeros are **exploratory, not counted**. Why: in the repro6-structured series (down through the warning first, then up) the R5 list was scrolled up in only 1/30 (fine), 0/30 (fling), 6/30 (kbd) runs and 8/30 in repro6-sel, because the older toasts have expired by the time the up phase starts; R5-D1's trigger state was mostly not reached. The natural-g series did reach it on R5 (list scrolled up in 30/30 fine and 20/20 fling runs; an older toast left while it was scrolled in 30/30 and 13/20) and still produced A events in only 1 of 50 R5 runs.
* **Touch and keyboard scroll the page behind the toasts** when the stack cannot scroll further (below). That is where every hide/reset on R6 in these series comes from.

### Page-scroll chain (not R5-D1; present on R5 and R6)

{pg_rows}
Trace (gesture6 fling, 375x667 light, R6, run 6, `gfling-375L/R6/gesture6-R6.jsonl`): older toasts leave at 3616 ms; only the warning is left; fling strokes at 3204, 4009, 4470, 5230 ms; at 5128 ms the first protected control top goes 334 -> 317 -> 224 -> 161 px (page scrolled 173 px), the toast region (lagging, re-measured every 250 ms) still ends at 281, the warning box (8 to 281) overlaps the control for 16 frames, a control's centre hit-tests as a toast for 11 frames, the warning is removed at 5454 ms and re-shown (reset) at 5537 ms. gkbd-844L R6 run 3 shows 7 hide/reset cycles while the page scrolls 286 px under the warning (M1's hold rule oscillating); R5 shows 6 removals (5 re-shown) in the same run (`gkbd-844L/R5`).

## 7. CONTROL-FAILED-UNDER-LOAD

Under the side-by-side pair load (1-min load average {min(loads)} to {max(loads)}, median {sorted(loads)[len(loads)//2]}) the R5 control **did not reproduce R5-D1 twice within 10 runs** where the round-5 receipt had it reproducing, for:

* **natural-x.mjs** (adapted natural.mjs; R5 code path identical to natural.mjs, which reproduced 3/10 at 375x667): 375x667 light **0/10**, dark **1/10**, 844x390 light **1/10**. Diagnostic R5-alone (one browser, `dnx-*`, beyond the 10-run cap): light **4/10**, dark 1/10, 844x390 **2/10**. So the pair load (or the R6 partner's work) suppressed it at light and 844; at dark it stayed at 1/10 alone.
* **natural.mjs** at **844x390 light**: A 0/10 (round 5: 2/7 incl. a 47 px displacement); three FAILs are entry flicker (re-show at 0.7 to 1.1 s, still entering at 1.4 s). Diagnostic R5-alone `dn-844L`: A 0/10 (3 probe FAILs, entry flicker) too.
* **repro6.mjs / repro6-sel.mjs** (not in the round-5 receipt): never reproduced the reading-phase defect on R5 (A 0/10 in all three configs; also alone: 375x667 light 0/10, 844x390 light 0/10; wide reading B 0, 2, 2 of 10). Its own judge FAILs R5 7/10, 10/10, 10/10 but only through entry-phase symptoms.
* extra-gesture probes (section 6): control not reproduced.

The orchestrator should rerun L1 alone before trusting R6 zeros for natural.mjs / natural-x (pair-load controls failed; alone-run evidence exists only for natural-x, 375x667 dark stayed at 1/10), repro6 and the extra gestures. The R5-alone / R6-alone diagnostics are in the results table below (rows "R5-alone", "R6-alone"): natural-x R6-alone 0/10 in each config, repro6-sel R6-alone 0/10 (375x667 light, 844x390 light).

## 8. Results per probe x configuration x revision (all series, incl. diagnostics)

Columns: runs; probe FAIL (probe's own verdict incl. entry phase); R5-D1 runs (A); hide/reset events (runs; reading phase, includes page-scroll-induced); entry-flicker re-shows; faded/absent runs; box-below-room runs (max px); box over dock/control runs; protected-control overlap runs (repro6/gesture6 only: box over a control, a toast drawn over one, or a control's centre hit-testing as a toast); list-scrolled runs; runs where an older toast left while the list was scrolled; runs where the warning ended by its own 12 s timer; runs where the page scrolled / where that caused a hide or overlap.

{results}

## 9. Clips (Playwright `recordVideo`, `clips/`)

One per configuration for R5 (a reproducing run: the probe's own verdict FAIL and A events) and one per configuration for R6. R5 clips come from `racex-*` (race-x, the video series; it holds toasts synthetically). R6 clips come from `naturalx-*` run 0 (natural-x, no synthetic events, list scrolled to the oldest toast and back while the older toasts expire). A video starts at context creation (page load first), so the event times are estimated from the run's duration and the recorder span.

{clip_rows}
Details: `clips/clips-notes.json`. The natural-x video series could not reproduce R5-D1 on R5 (0/10, 0/4, 0/4 A), so no natural-only R5 clip exists.

## 10. Series, files and logs

* `logs/<series>/<R5|R6>/`: `stdout.txt` (probe lines), `runs.jsonl` (per run: URL, port, revision, probe sha256, UTC start/end, `/proc/loadavg` and `uptime` at start and end), per-frame `*.jsonl` (every animation frame: time, toast count, warning opacity, box top/bottom, dock, room, list/warning scroll, protected-control flags; events of every toast `li` added/removed). `logs/pairs.jsonl`: per pair start/end with load. `logs/driver*.log`: slot waits.
* `runs.json`: one record per run with the uniform analysis; `tables-*.md`; `probes/` (all probes, adaptations, diffs, runner, analysis, `SHA256.txt`).
* Series table (URL, revision, probe and sha256 per series):

{read('tables-series.md')}

## 11. Per-run table (every run)

{read('tables-perrun.md')}
"""
open(f'{DST}/RECEIPT.md', 'w').write(txt)
print(len(txt))
