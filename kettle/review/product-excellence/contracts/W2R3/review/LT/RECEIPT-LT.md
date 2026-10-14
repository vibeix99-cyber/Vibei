# W2R3 round 3 · Lane T receipt · Maker T2 notices (I10)

Raw evidence only, no verdict. Lane T did not build this work.

| | |
|---|---|
| Under review | `pe/w2r3-notices@6a64fbf`, code `61b463c`, kettle/src `5aa6228` |
| Trial (fix) | `490ca97` (integration `f1f059c` + T2), worktree `/home/user/wt/w4tr-t2` (clean), `HEAD:kettle/src` = `62672e1`, dev **:5476** (served `src/ui/Toast.tsx` contains `NoticeStrip`, `src/ui/InlineUndo.tsx` contains `data-inline-undo`) |
| Base | `61aba17`, dev **:5470** (served `Toast.tsx` still has `toastLiftBottom` / `foldToFit`) |
| Lane window | 23:22:55 to about 00:54 UTC, 2026-10-13/14 |
| Browser gate | every browser ran through `slots.py run --lane LT --n 1` (LR held 2 slots and LEAD queued jobs the whole time, so Lane T only had one slot) |
| Scripts | `/home/user/wt/w4tr-t2/kettle/.tmp/LT/` (`ltprobe.mjs` = the probe, `agg.py` = the tables, `chain.sh`, `suites.sh`); copies in `LT/tools/` |
| Evidence | `LT/probes/fix/*.json` (one per configuration), `LT/probes/cmp/*.json` (base, plus the tap and storage checks), `LT/probes/*/shot-*.png` (taken automatically on the first non-modal drawn overlap in a group, max 3 per group), `LT/runs/*.log` / `*.json` |


## Key raw numbers (details and every exception below)

- **Invariant probe, fix, 22 configurations, 30,481 samples at 100 ms, 14,402 with a notice drawn:** 0 control intersections and 0 nine-point control hits by a notice with no sheet in the DOM; 0 list-row intersections; 330 drawn text intersections with no sheet: 280 are the session countdown's ":" text line box reaching 1–6 px into the bottom of the notice above it (667×375 and 844×390 at 200 %, countdown on top, no ink overlap in the screenshots), 50 are the History "Brew deleted · Undo" row under the sticky Stats header's "23" (844×390 dark 200 %; header drawn on top in the screenshots, `elementFromPoint` returns the Undo row). 0 samples with a clipped notice.
- **Sheets:** with a sheet open at +2 s, 0 sheet controls covered in all 22 (base: 2 of 10 at 390×844 @100, 1 of 6 at 844×390 @200). 3,649 nine-point hits on sheet controls by a notice (sheet in the DOM) carry only the states History delete, Import and Ambience; in the sheet-exit sequence they start at Escape +0 ms (sheet still in the DOM, `pointer-events: none` on its wrapper) and not while open; no frame of a leaving sheet was captured.
- **Inline Undo:** all three surfaces at all 22 configurations: drawn within one frame of the tap, 9/9 on top (one exception: Mark done at 844×390 dark @200, row drawn at y −54, Undo 6/9), announced once per action, Undo restores; run-out 5.1–5.2 s (Mark done), 5.4–8.2 s (History), 10.2–10.7 s (Import). History last row: Undo row 3–39 px lower and scrollY 3–93 px lower at 10 of 22; Import at 844×390 @200: 30 px lower.
- **W2H-D1:** fix Brew length 4/4 in view, ≥ 24×24, 9/9 at all 16 W2H-D1 runs (4 sizes × 100/200 % × 2 themes); base in view at 2 of 8. Mark done tapped and crossed off at all 22 on the fix; on top at about +0.6 s without scrolling only at 390×844 @100, 844×390 @100 and 1440 @100 (base also 667×375 @100).
- **break-reach "Break's over with a carried task", 7 weekdays × (375×667 light, 390×844 dark) @200:** base 9 passed / 5 failed (Mon, Thu; Mon, Thu, Sun); fix 14 / 14 passed.
- **"Finger in the air":** a notice arriving at rest moved the target 68 px before a tap 0–400 ms later in 9 of 9 trials where the strip went from empty to shown; that tap landed on another element. With the pointer held down, 0 px of movement (4 of 4).
- **Suites on the fix:** `toast-room.spec.ts` 14 / 14 passed (the R5-D1, LEAD-D1 and R7-D1 shapes included). `notice-strip.spec.ts` (`--workers=1`): 7 passed, 0 failed of 25 when the container restart (about 00:40 UTC) killed the run; 18 not run. `integrity`, `w2-home`, `statusbar` and `a11y` (D4) not run in the time box (2 `a11y:61` tests passed before Lane T stopped that run).


## Commands and times (UTC)

| Time | Command (cwd `/home/user/wt/w4tr-t2/kettle`, every one through `python3 -I …/round7-review/tools/slots.py run --lane LT --n <n> --`) | Result |
|---|---|---|
| 23:24–23:27 | `env KETTLE_PORT=5476 npx playwright test tests/integrity.spec.ts tests/toast-room.spec.ts tests/w2-home.spec.ts tests/statusbar.spec.ts tests/a11y.spec.ts --project=chromium --workers=1 --output=/tmp/claude-0/lt3-out-6` (n 1) | **Stopped by Lane T** (PID 22119, SIGTERM) after 2 of 77 tests (`a11y.spec.ts:61` light and dark, both passed) so the slot could go to check 1; log `runs/suites6-aborted.log` |
| 23:27–23:37 | `node .tmp/LT/ltprobe.mjs …` smoke runs on 2 configurations (n 1) | probe debugged (not evidence) |
| 23:38:57–23:44:16 | `node .tmp/LT/ltprobe.mjs --base http://127.0.0.1:5476 --kind fix --out LT/probes/fix --cfgs <22> --par 3` (n 1) | 3 configurations written (844×390 light 200, 375×667 dark 200, 667×375 light 200), then the process died on an unhandled `filechooser` timeout (fixed in the probe); log `runs/probe-fix-part1.log` |
| 23:48:45–00:07:50 | `bash .tmp/LT/chain.sh` part A1: the other 19 configurations, same probe (n 1) | `runs/chain.log` |
| 00:07:50–00:13:55 | `chain.sh` part A2: `ltprobe.mjs --base2 http://127.0.0.1:5470 --out LT/probes/cmp` (base W2H-D1, base follow-ups, fix tap and storage, sheet exit) | base groups that raise a notice failed: the base debug API has no `__kettle.toast` (re-run in C) |
| 00:13:55– | `chain.sh` part B: `BREAK_REACH_ALL_DAYS=1 KETTLE_PORT=<5470, then 5476> npx playwright test tests/break-reach.spec.ts --project=chromium --workers=1 -g "Break's over with a carried task" --grep-invert "844×390" --output=/tmp/claude-0/lt3-out-b<port>` (the trial's spec on both servers) | `runs/break-reach-{5470,5476}.{log,json}` |
| 00:22:16–00:23:45 | `chain.sh` part C (appended to the running chain, same slot): `ltprobe.mjs --out LT/probes/cmp2` base re-run of the notice-raising groups at 4 configurations (the probe now raises a notice on the base through `import('/src/ui/Toast.tsx')`, the module the app uses) | `runs/probe-cmp2.log` |
| 00:23:45– | `chain.sh`: `KETTLE_PORT=5476 npx playwright test tests/toast-room.spec.ts --project=chromium --workers=1 --output=/tmp/claude-0/lt3-out-toast-room` | §6 |
| after toast-room | `chain.sh`: `KETTLE_PORT=5476 npx playwright test tests/notice-strip.spec.ts --project=chromium --workers=1 --output=/tmp/claude-0/lt3-out-ns` (**workers=1**, not 2: only one slot) | §1.4 |

Dates: every probe context installs `page.clock.install({ time: 2026-10-12T07:40:00Z })` (a Monday) then `resume()`. Setup through `?debug&seed=…&theme=…` and `window.__kettle` only (seed, `startFocus`, `ff`, `finish`, settings, raising a notice where the app has no button for it); every action under test is a real `touchscreen.tap` (phones, `hasTouch`, DPR 2) or `mouse.click` (1440), real `mouse.wheel`, real keys. 200 % = `html{font-size:200%!important}` injected at DOMContentLoaded (same method as the BEFORE set).

## 1. The invariant, measured independently

### 1.1 How the probe measures (different from `notice-strip.spec.ts`)

The maker's spec checks every animation frame, element boxes (`getBoundingClientRect`) of controls / own-text elements / rows against each notice's box clipped by its ancestors, and counts apart: frames with a sheet open, and anything inside fixed or sticky chrome (`underChrome`).

Lane T's probe (`tools/ltprobe.mjs`, `sampler()`): a `setInterval` of **100 ms** in every document, independent of rAF. Notices = `[data-notice-strip] li`, `[data-inline-undo]` and the base's `[aria-label="Notifications"] li`, not inside `[data-route-leaving]`, with a box in the viewport.
- **(a) Geometry:** every notice box against every control box (button, link, field, every interactive role, tab order), every **text node's `Range.getClientRects()`** rect (not element boxes), and every list row box (`li`, `role=row|listitem`, `tr`); > 0.5 px each way. Each intersection is classified, in this order: outside the viewport; clipped away from the notice (by its scroll/clip ancestors); clipped away from the other element; **inside a sheet's box** (the point lies in a `[role=dialog]` box the notice is not in; open or leaving); else **drawn**, and then the element on top at the centre of the drawn intersection (`elementFromPoint`): the notice, the other element, or a third element. Nothing is excluded for being fixed/sticky: those are labelled `@fixed` and still counted.
- **(b) Hit test:** `elementFromPoint` at **9 points** (15/50/85 % × 15/50/85 %) of every visible control; a point whose top element is inside a notice (and not inside the control) is a covered point.
- Each sample is tagged with the state the driver is in and whether a sheet is open. On the first non-modal drawn hit in a group the driver takes a screenshot (max 3 per group).

States walked per configuration (each group a fresh context): `home` (veteran at rest), `end` (task typed, Put the kettle on, `ff` 3 min, End session → End session: Today with "Saved 3 minutes of focus"; Mark done at +0.6 s if 9/9 on top, else wheeled to and tapped; its inline Undo; Undo tapped; Mark done again and left to run out), `break` (summary → Tea time → Break's over on Monday with "Recipe done", panel wheeled down 6 and up 6 → Put the kettle on (real tap) → running brew → three notices raised → Ambience opened by tap, 2 s, Escape), `nextbrew` (Settings › Next brew on: autoStartBreaks + autoStartFocus; finish focus, wait for the break running, finish: the next brew starts by itself on Monday), `stats` (veteran, History: a mid-list row and the last row, each tapped → Edit brew → Delete this brew → Delete; mid: Undo tapped; last: left to run out), `import` (Settings › Your data › Import a backup tapped → real file chooser → `setFiles(backup)` → Add; Undo tapped; second import left to run out), `update` (the update prompt raised exactly as `ShellOverlays.tsx` raises it, then "Brew updated"), `queue` (four notices raised on Today, then the Stats tab tapped while three wait).

Configurations: 390×844, 375×667, 844×390, 667×375, 1440×900 × light/dark × 100/200 % (20), plus reduced motion at 390×844 light 100 % and 375×667 dark 200 % = **22**, all on the fix :5476.


### 1.2 Results, fix :5476 (raw counts; one row per configuration, all 8 groups)

| Configuration (fix :5476) | 100 ms samples | samples with a notice drawn | of which a sheet open | drawn intersections, no sheet: notice on top | drawn, no sheet: other on top | 9-point control hits by a notice, no sheet | intersections inside a sheet's box (open or leaving) | 9-point hits on sheet controls while a sheet is in the DOM (points; all inside a dialog box?) | clipped / off-viewport intersections (not drawn) | notice samples with clipped text | distinct notices seen | group errors |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 390x844-light-t100 | 1275 | 666 | 45 | 0 | 0 | 0 | 234 (+0 sheet open, not in its box) | 168 (168 inside a dialog box) | 0 | 0 | 13 | — |
| 390x844-light-t200 | 1473 | 671 | 45 | 0 | 0 | 0 | 229 (+0 sheet open, not in its box) | 100 (100 inside a dialog box) | 8 | 0 | 13 | — |
| 390x844-dark-t100 | 1409 | 649 | 53 | 0 | 0 | 0 | 194 (+0 sheet open, not in its box) | 179 (179 inside a dialog box) | 0 | 0 | 13 | — |
| 390x844-dark-t200 | 1535 | 618 | 42 | 0 | 0 | 0 | 228 (+0 sheet open, not in its box) | 117 (117 inside a dialog box) | 8 | 0 | 13 | — |
| 390x844-light-t100-reduced | 1412 | 644 | 66 | 0 | 0 | 0 | 351 (+0 sheet open, not in its box) | 342 (342 inside a dialog box) | 0 | 0 | 13 | — |
| 375x667-light-t100 | 1386 | 640 | 42 | 0 | 0 | 0 | 198 (+0 sheet open, not in its box) | 130 (130 inside a dialog box) | 1 | 0 | 13 | — |
| 375x667-light-t200 | 1724 | 650 | 42 | 0 | 0 | 0 | 186 (+0 sheet open, not in its box) | 285 (285 inside a dialog box) | 52 | 0 | 13 | — |
| 375x667-dark-t100 | 1229 | 625 | 38 | 0 | 0 | 0 | 197 (+0 sheet open, not in its box) | 106 (106 inside a dialog box) | 3 | 0 | 13 | — |
| 375x667-dark-t200 | 1535 | 548 | 31 | 0 | 0 | 0 | 87 (+0 sheet open, not in its box) | 6 (6 inside a dialog box) | 45 | 0 | 12 | stats: locator.waitFor: Timeout 10000ms exceeded. |
| 375x667-dark-t200-reduced | 1245 | 639 | 39 | 0 | 0 | 0 | 194 (+0 sheet open, not in its box) | 288 (288 inside a dialog box) | 104 | 0 | 13 | — |
| 844x390-light-t100 | 1355 | 617 | 39 | 0 | 0 | 0 | 158 (+0 sheet open, not in its box) | 35 (35 inside a dialog box) | 0 | 0 | 13 | — |
| 844x390-light-t200 | 1417 | 672 | 59 | 0 | 63 | 0 | 266 (+1 sheet open, not in its box) | 306 (306 inside a dialog box) | 521 | 0 | 13 | — |
| 844x390-dark-t100 | 1197 | 625 | 38 | 0 | 0 | 0 | 123 (+0 sheet open, not in its box) | 50 (50 inside a dialog box) | 20 | 0 | 13 | — |
| 844x390-dark-t200 | 1472 | 682 | 49 | 50 | 94 | 0 | 192 (+8 sheet open, not in its box) | 320 (316 inside a dialog box) | 210 | 0 | 14 | — |
| 667x375-light-t100 | 1314 | 650 | 50 | 0 | 0 | 0 | 238 (+0 sheet open, not in its box) | 390 (389 inside a dialog box) | 47 | 0 | 13 | — |
| 667x375-light-t200 | 1528 | 661 | 45 | 0 | 56 | 0 | 181 (+3 sheet open, not in its box) | 199 (199 inside a dialog box) | 650 | 0 | 13 | — |
| 667x375-dark-t100 | 1236 | 627 | 41 | 0 | 0 | 0 | 210 (+0 sheet open, not in its box) | 317 (305 inside a dialog box) | 38 | 0 | 13 | — |
| 667x375-dark-t200 | 1508 | 645 | 43 | 0 | 67 | 0 | 178 (+1 sheet open, not in its box) | 169 (169 inside a dialog box) | 647 | 0 | 13 | — |
| 1440x900-light-t100 | 1250 | 679 | 39 | 0 | 0 | 0 | 39 (+0 sheet open, not in its box) | 48 (48 inside a dialog box) | 0 | 0 | 13 | import: locator.waitFor: Timeout 20000ms exceeded. |
| 1440x900-light-t200 | 1337 | 735 | 38 | 0 | 0 | 0 | 49 (+0 sheet open, not in its box) | 0 (0 inside a dialog box) | 14 | 0 | 13 | import: locator.waitFor: Timeout 20000ms exceeded. |
| 1440x900-dark-t100 | 1271 | 722 | 47 | 0 | 0 | 0 | 47 (+0 sheet open, not in its box) | 72 (72 inside a dialog box) | 0 | 0 | 13 | import: locator.waitFor: Timeout 20000ms exceeded. |
| 1440x900-dark-t200 | 1373 | 737 | 54 | 0 | 0 | 0 | 57 (+0 sheet open, not in its box) | 22 (22 inside a dialog box) | 0 | 0 | 13 | import: locator.waitFor: Timeout 20000ms exceeded. |
| **total** | 30481 | 14402 | 985 | **50** | **280** | **0** | 3836 (+13) | 3649 (3632) | 2368 | 0 | | |

Reading the columns: a "sample" is one 100 ms tick; an "intersection" is one (notice, element or text rect) pair in one sample. "Drawn, no sheet" means the intersection lies in the viewport and is not clipped away from either box, with no `[role=dialog]` in the DOM and `#root` not inert.

**Every drawn intersection with no sheet in the DOM (330 in 22 configurations), listed in full** (`probes/fix/<cfg>.json` → `groups.<g>.sampler.hits`):

| Configuration | Group / state | Notice box [x, y, w, h] | Other | Other's box | Overlap | On top at the overlap centre | Samples |
|---|---|---|---|---|---|---|---|
| 844×390 light 200 | break / Ambience state (running brew, 3 notices) | "Notice one, waiting its turn." [524–527, 153–154, 283–288, 135–138] | text node ":" of the countdown (Range rect) | [657, 285, 21, 117] | 5–6 px tall, 21 px wide | the countdown span | 32 |
| 844×390 light 200 | nextbrew (next brew started by itself) | "Recipe done: Take a full tea break · +10 leaves" [524, 77, 288, 178] | ":" of the countdown | [657, 250–254, 21, 117] | 1–5 px | countdown | 31 |
| 844×390 dark 200 | break / Ambience state | "Notice one…" [524, 77, 288, 137–138] | ":" | [657, 210, 21, 117] | 5 px | countdown | 64 |
| 844×390 dark 200 | nextbrew | "Recipe done…" [524, 77, 288, 178] | ":" | [657, 250–251, 21, 117] | 4–5 px | countdown | 30 |
| 667×375 light 200 | break / Ambience state | "Notice one…" [347–348, 153, 287–288, 137–138] | ":" | [480, 285, 21, 117] | 5–6 px | countdown | 24 |
| 667×375 light 200 | nextbrew | "Recipe done…" [347, 77, 288, 178] | ":" | [480, 250–253, 21, 117] | 2–5 px | countdown | 32 |
| 667×375 dark 200 | break / Ambience state | "Notice one…" [347–349, 153–154, 284–288, 135–138] | ":" | [480, 285, 21, 117] | 4–6 px | countdown | 36 |
| 667×375 dark 200 | nextbrew | "Recipe done…" [347, 77, 288, 178] | ":" | [480, 250–251, 21, 117] | 4–5 px | countdown | 31 |
| **844×390 dark 200** | **stats / History, last row deleted** | inline Undo row "Brew deleted · Undo" [513, 9, 283, 145] | text "23" (leaf count) in the sticky Stats header (`@fixed`) | [778, 3, 42, 43] | 18 × 37 px | **the Undo row** (`elementFromPoint`) | **50** |

- The ":" rows: the countdown's text line box (117 px tall at 200 %) reaches 1–6 px into the bottom of the notice above it in the session panel. Screenshots: `probes/fix/shot-667x375-light-t200-nextbrew-0.png`, `shot-844x390-light-t200-nextbrew-*.png`, `shot-844x390-*-t200-break-*.png`: the glyphs of "25:00" / "24:59" start about 25 px below the notice's bottom edge; no ink overlaps.
- The "23" row: `shot-844x390-dark-t200-stats-0..2.png` show the sticky Stats header drawn over the top ~45 px of the Undo row (its trash icon is hidden under the header), "23" fully visible. `elementFromPoint(787, 27)` nevertheless returned the Undo row there (the header is not the hit target at that point). The deleted row had been at y 6 (its top already under the header when tapped), and the Undo row is drawn where it was (y 9).
- **Controls:** 0 drawn control intersections and **0** 9-point control hits by a notice in any configuration without a sheet. **Rows:** 0.
- **Notice text clipped:** 0 samples (any notice, or any descendant with overflow / line clamp, whose scroll size exceeds its client size).
- **Errors:** 375×667 dark 200 `stats` (the Edit brew / Delete dialog did not open within 10 s after the row tap; the same group passed in a smoke run of the same configuration at 23:34, and History at 375×667 dark 200 was re-run in A2: `probes/cmp/375x667-dark-t200-stats.json`); 1440 × 4 `import`: the second import never started because, after the Undo was clicked with the mouse, the "Import undone. Everything is as it was." row stayed while the mouse rested on it (208–224 samples of 100 ms, i.e. 21–22 s, until the 20 s wait timed out). The Undo itself was measured at 1440 (table §2).

### 1.3 Sheets (counted apart, with what they are)

- **Sheet open, at rest:** in every configuration the Ambience check at +2 s after opening found every visible sheet control (5–10 per configuration) on top at its centre (`groups.break.ambience.sheetCtlsCovered.cov = 0`). The open-sheet screenshot `probes/cmp/sheetexit-844x390-light-t200-sheetexit-amb-open.png` shows the sheet and its scrim over the panel; "Notice one…" is under the scrim.
- **3,632 of 3,649 9-point hits on sheet controls** lie inside a `[role=dialog]` box; the 17 others are sheet controls of the same leaving sheets (e.g. Edit brew's "Work"/"Study"/"Save") just outside the dialog element's own box. They come only from these states: `history-mid` (173 records), `history-end` (60), `import-undo` (56), `import-expire` (25), `ambience` (67): the moments right after Delete, Add or Escape, i.e. a sheet leaving. Sequence at 844×390 light 200 (`probes/cmp/844x390-light-t200-sheetexit.json`): Ambience open +300 ms and +1000 ms: Close, Turn on, Rain, Fireside, Forest → **sheet** at their centres (Brown noise below the viewport). Escape +0 ms: the dialog still in the DOM, its wrapper `pointer-events: none`; at the same points: Close → `div`, **Turn on → the notice**, Rain → `div`, Fireside → `div`, Forest → `span`. The next screenshot (taken a few seconds later under load) shows the sheet gone. Lane T did not capture a frame of the leaving sheet itself, so whether any notice pixel is drawn above the leaving sheet is not established by this run.
- 375×667 dark 200 sheet-exit: Escape +0 ms: sheet controls → `img` / `span` (page under it), no notice at those points; the History part of that group timed out (`locator.evaluate` 30 s).

### 1.4 `notice-strip.spec.ts` once on :5476

`KETTLE_PORT=5476 npx playwright test tests/notice-strip.spec.ts --project=chromium --workers=1 --output=/tmp/claude-0/lt3-out-ns` (workers=1, not 2: see §7). Log `runs/notice-strip-5476-w1.log`.

**Cut by the container restart at about 00:40 UTC**: the log ends after test 7 (no summary line, no JSON). 18 of 25 configurations not run. Results recorded: 7 passed, 0 failed of 7 reported.

| Result | Configuration | Time |
|---|---|---|
| ✓ | (390×844 light 100 %) (1.2m) | None |
| ✓ | (390×844 light 200 %) (1.4m) | None |
| ✓ | (390×844 light 200 % reduced motion) (1.2m) | None |
| ✓ | (390×844 dark 100 %) (1.3m) | None |
| ✓ | (390×844 dark 200 %) (1.7m) | None |
| ✓ | (375×667 light 100 %) (1.2m) | None |
| ✓ | (375×667 light 200 %) (2.3m) | None |


## 2. Inline Undo, per surface (fix :5476, all 22 configurations)

| Configuration | Mark done: tapped at (ms after End tap) / wheeled first | Undo appears (ms from pointerdown) | Undo button box, 9/9 | scrollY before Lane T wheeled to Mark done → at Undo | Undo tap restores task to field | run-out: shown ms | said (per action) | History mid: row top → Undo row top, scrollY | 9/9, Undo tap restores row | History last: row top → Undo top, scrollY | run-out ms | said | Import: row top → Undo row top, scrollY | 9/9; brews after import → after Undo | run-out ms | said |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 390x844-light-t100 | 1834 / no | 2 | [217, 556, 43, 44] 9/9 | 0 → 0 | 'Chapter 3 notes' | 5168 | 2 for 2 | 619 → 619, 2800 → 2800 (tap) | 9/9, True | 638 → 638, 3200 → 3200 (tap) | 5458 | 1, 1 | 445 → 445, 2369 → 2369 | 9/9; 89 → 6 | 10351 | 1+1 result |
| 390x844-light-t200 | 2519 / wheeled 5 | -3 | [36, 282.6, 80, 44] 9/9 | 0 → 1019 | 'Chapter 3 notes' | 5152 | 2 for 2 | 376 → 376, 6000 → 6000 (tap) | 9/9, True | 385 → 412, 6787 → 6760 (tap) | 5519 | 1, 1 | 285 → 285, 5137 → 5137 | 9/9; 89 → 6 | 10352 | 1+1 result |
| 390x844-dark-t100 | 805 / no | -4 | [217, 556, 43, 44] 9/9 | 0 → 0 | 'Chapter 3 notes' | 5171 | 2 for 2 | 619 → 619, 2800 → 2800 (tap) | 9/9, True | 638 → 638, 3200 → 3200 (tap) | 6416 | 1, 1 | 445 → 445, 2369 → 2369 | 9/9; 89 → 6 | 10383 | 1+1 result |
| 390x844-dark-t200 | 2843 / wheeled 5 | 4 | [36, 282.6, 80, 44] 9/9 | 0 → 1019 | 'Chapter 3 notes' | 5136 | 2 for 2 | 376 → 376, 6000 → 6000 (tap) | 9/9, True | 385 → 412, 6787 → 6760 (tap) | 5568 | 1, 1 | 285 → 285, 5137 → 5137 | 9/9; 89 → 6 | 10464 | 1+1 result |
| 390x844-light-t100-reduced | 841 / no | 2 | [217, 556, 43, 44] 9/9 | 0 → 0 | 'Chapter 3 notes' | 5136 | 2 for 2 | 219 → 219, 3200 → 3200 (tap) | 9/9, True | 638 → 638, 3200 → 3200 (tap) | 5760 | 1, 1 | 445 → 445, 2369 → 2369 | 9/9; 89 → 6 | 10163 | 1+1 result |
| 375x667-light-t100 | 3175 / wheeled 1 | 4 | [217, 356, 43, 44] 9/9 | 0 → 200 | 'Chapter 3 notes' | 5138 | 2 for 2 | 238 → 238, 3200 → 3200 (tap) | 9/9, True | 347 → 353, 3510 → 3504 (tap) | 6193 | 1, 1 | 450 → 450, 2400 → 2400 | 9/9; 89 → 6 | 10368 | 1+1 result |
| 375x667-light-t200 | 2448 / wheeled 6 | -1 | [36, 106.6, 80, 44] 9/9 | 0 → 1241 | 'Chapter 3 notes' | 5168 | 2 for 2 | 268 → 268, 6400 → 6400 (synthetic) | 9/9, True | 264 → 264, 7200 → 7200 (synthetic) | 8162 | 1, 1 | 377 → 377, 5200 → 5200 | 9/9; 89 → 6 | 10383 | 1+1 result |
| 375x667-dark-t100 | 2135 / wheeled 2 | 15 | [217, 156, 43, 44] 9/9 | 0 → 400 | 'Chapter 3 notes' | 5152 | 2 for 2 | 331 → 331, 3107 → 3107 (tap) | 9/9, True | 347 → 353, 3510 → 3504 (tap) | 5600 | 1, 1 | 450 → 450, 2400 → 2400 | 9/9; 89 → 6 | 10367 | 1+1 result |
| 375x667-dark-t200 | 3218 / wheeled 6 | 1 | [36, 106.6, 80, 44] 9/9 | 0 → 1241 | 'Chapter 3 notes' | 5136 | 2 for 2 | 268 → 268, 6400 → 6400 (synthetic) (A2 re-run) | 9/9, True | 264 → 264, 7200 → 7200 (synthetic) | 6706 | 1, 1 | 377 → 377, 5200 → 5200 | 9/9; 89 → 6 | 10527 | 1+1 result |
| 375x667-dark-t200-reduced | 5387 / wheeled 6 | 15 | [36, 106.6, 80, 44] 9/9 | 0 → 1128 | 'Chapter 3 notes' | 5136 | 2 for 2 | 268 → 268, 6400 → 6400 (synthetic) | 9/9, True | 264 → 264, 7200 → 7200 (synthetic) | 5872 | 1, 1 | 377 → 377, 5200 → 5200 | 9/9; 89 → 6 | 10384 | 1+1 result |
| 844x390-light-t100 | 1446 / no | 14 | [639.5, 184.3, 43, 44] 9/9 | 0 → 0 | 'Chapter 3 notes' | 5152 | 2 for 2 | 165 → 165, 1486 → 1486 (tap) | 9/9, True | 184 → 184, 1886 → 1886 (tap) | 5391 | 1, 1 | 173 → 173, 2389 → 2389 | 9/9; 89 → 6 | 10256 | 1+1 result |
| 844x390-light-t200 | 3430 / wheeled 2 | 0 | [458.5, 59.6, 80, 44] 9/9 | 0 → 336 | 'Chapter 3 notes' | 5136 | 2 for 2 | 86 → 86, 3019 → 3019 (tap) | 9/9, True | 85 → 85, 3816 → 3816 (tap) | 6243 | 1, 1 | 282 → 312, 3600 → 3600 | 9/9; 89 → 6 | 10238 | 1+1 result |
| 844x390-dark-t100 | 1299 / no | -3 | [639.5, 184.3, 43, 44] 9/9 | 0 → 0 | 'Chapter 3 notes' | 5140 | 2 for 2 | 165 → 165, 1486 → 1486 (tap) | 9/9, True | 184 → 184, 1886 → 1886 (tap) | 5951 | 1, 1 | 173 → 173, 2389 → 2389 | 9/9; 89 → 6 | 10276 | 1+1 result |
| 844x390-dark-t200 | 2682 / wheeled 3 | 0 | [458.5, -10.4, 80, 44] 6/9 | 0 → 406 | 'Chapter 3 notes' | 5140 | 2 for 2 | 86 → 86, 3019 → 3019 (tap) | 9/9, True | 6 → 9, 3895 → 3892 (tap) | 5744 | 1, 1 | 282 → 312, 3600 → 3600 | 9/9; 89 → 6 | 10672 | 1+1 result |
| 667x375-light-t100 | 1132 / wheeled 1 | 4 | [559.1, 140.8, 43, 44] 9/9 | 0 → 70 | 'Chapter 3 notes' | 5168 | 2 for 2 | 219 → 219, 3200 → 3200 (tap) | 9/9, True | 238 → 238, 3600 → 3600 (tap) | 6047 | 1, 1 | 164 → 164, 2398 → 2398 | 9/9; 89 → 6 | 10336 | 1+1 result |
| 667x375-light-t200 | 2116 / wheeled 1 | 14 | [378.1, 182.7, 80, 44] 9/9 | 0 → 314 | 'Chapter 3 notes' | 5140 | 2 for 2 | 112 → 112, 5065 → 5065 (tap) | 9/9, True | 116 → 116, 5717 → 5717 (tap) | 5823 | 1, 1 | 139 → 139, 4000 → 4000 | 9/9; 89 → 6 | 10576 | 1+1 result |
| 667x375-dark-t100 | 1249 / wheeled 1 | -8 | [559.1, 140.8, 43, 44] 9/9 | 0 → 70 | 'Chapter 3 notes' | 5136 | 2 for 2 | 219 → 219, 3200 → 3200 (tap) | 9/9, True | 238 → 238, 3600 → 3600 (tap) | 5584 | 1, 1 | 164 → 164, 2398 → 2398 | 9/9; 89 → 6 | 10384 | 1+1 result |
| 667x375-dark-t200 | 1322 / wheeled 1 | -6 | [378.1, 182.7, 80, 44] 9/9 | 0 → 314 | 'Chapter 3 notes' | 5152 | 2 for 2 | 112 → 112, 5065 → 5065 (tap) | 9/9, True | 72 → 111, 5761 → 5722 (tap) | 6159 | 1, 1 | 139 → 139, 4000 → 4000 | 9/9; 89 → 6 | 10367 | 1+1 result |
| 1440x900-light-t100 | 687 / no | -1 | [489, 499.4, 43, 44] 9/9 | 0 → 0 | 'Chapter 3 notes' | 5152 | 2 for 2 | 622 → 622, 1600 → 1600 (tap) | 9/9, True | 629 → 634, 2013 → 1956 (tap) | 5391 | 1, 1 | 587 → 587, 2000 → 2000 | 9/9; 89 → 6 | not run | 1+1 result |
| 1440x900-light-t200 | 3223 / wheeled 1 | 14 | [638, 496.2, 80, 44] 9/9 | 0 → 249 | 'Chapter 3 notes' | 5152 | 2 for 2 | 743 → 743, 2800 → 2800 (tap) | 9/9, True | 599 → 620, 3600 → 3507 (tap) | 5503 | 1, 1 | 634 → 634, 3200 → 3200 | 9/9; 89 → 6 | not run | 1+1 result |
| 1440x900-dark-t100 | 694 / no | 1 | [489, 499.4, 43, 44] 9/9 | 0 → 0 | 'Chapter 3 notes' | 5155 | 2 for 2 | 622 → 622, 1600 → 1600 (tap) | 9/9, True | 629 → 634, 2013 → 1956 (tap) | 5488 | 1, 1 | 587 → 587, 2000 → 2000 | 9/9; 89 → 6 | not run | 1+1 result |
| 1440x900-dark-t200 | 6908 / wheeled 2 | 9 | [638, 320.2, 80, 44] 9/9 | 0 → 425 | 'Chapter 3 notes' | 5168 | 2 for 2 | 743 → 743, 2800 → 2800 (tap) | 9/9, True | 599 → 620, 3600 → 3507 (tap) | 5776 | 1, 1 | 634 → 634, 3200 → 3200 | 9/9; 89 → 6 | not run | 1+1 result |

Notes on the columns:
- "Undo appears": an rAF watcher installed before the action records when `[data-undo-for=…]` first has a box, against the first `pointerdown` after it was installed. Values are within one frame of the tap (−42 … +15 ms; negative = the watcher's rAF tick landed before the window `pointerdown` listener's timestamp).
- Mark done "scrollY" includes Lane T's own wheel steps to reach Mark done where it was not on top at rest; where no wheel was needed (390×844 @100, 844×390 @100, 1440 @100) scrollY stayed 0 → 0 and the Undo row took Mark done's line.
- "said": additions to the light-DOM announcer `[data-notices-said]` (MutationObserver on every `aria-live` / `role=status|alert|log` region). Mark done: one "Crossed off. Nice work. Undo" per Mark done (2 actions per run, 2 entries) in all 22. History: one "Brew deleted. Undo" per delete in all 22. Import: one "Added 52 brews from your backup. Undo" per import, plus one "Import undone. Everything is as it was." after Undo. No other region repeated them (the other entries in the live log are the timer's own status lines, e.g. "Kettle's off. 3 minutes of focus saved.").
- Durations when left alone (pointer parked at the bottom-left corner, no input): Mark done 5,136–5,171 ms; History (last row) 5,391–8,162 ms; Import 10,163–10,672 ms.
- **History, last row ("to the end")**: the Undo row was 3–39 px lower than the row it replaced and scrollY dropped 3–93 px at 10 of 22 configurations (390×844 @200 both themes: 385 → 412, scrollY 6787 → 6760; 375×667 @100 both: 347 → 353, 3510 → 3504; 667×375 dark @200: 72 → 111, 5761 → 5722; 1440 @100 both: 629 → 634, 2013 → 1956; 1440 @200 both: 599 → 620, 3600 → 3507; 844×390 dark @200: 6 → 9, 3895 → 3892). The other 12: 0 px, no scroll change. History mid-list row: 0 px and no scroll change at all 22.
- **Import at 844×390 @200 (light and dark)**: the Undo row's top was 30 px below where "Import a backup" was when tapped (282 → 312), scrollY unchanged (3600). All other configurations: 0 px.
- **Mark done at 844×390 dark @200**: the Undo row was drawn at y −54 (row box [459, −54, 345, 88]) after the wheel-and-tap; Undo button [458, −10, 80, 44], 6 of 9 points in the viewport. (844×390 light @200: row at y 16, 9/9.)
- **375×667 @200 (light, dark, dark reduced)**: "Delete this brew?" → Delete not brought on screen by 15 wheel steps and not reached by 12 Tabs; Lane T clicked it synthetically to continue (recorded `how: synthetic`). Same as the maker's §7.1.
- **1440 (all four)**: after the Undo was clicked with the mouse and the mouse left resting there, "Import undone. Everything is as it was." stayed for the rest of the run (208–224 samples, 21–22 s); the Import row did not come back while the pointer rested on it, so the second (run-out) import was not run at 1440.
- Restored: Mark done → "Chapter 3 notes" back in the field and the Mark done line back (22/22); History mid → same row count and same first label (22/22); Import → 89 brews after Add, 6 after Undo (22/22).

## 3. W2H-D1: Brew length at rest, and Mark done right after End (fix vs base)

| Configuration | Brew length at rest, fix :5476 (light / dark) | Brew length at rest, base :5470 (light) | Mark done at about +0.6 s after the End-session tap, fix light / dark | Mark done tapped, fix light | Mark done at about +0.6 s, base light | Mark done tapped, base light |
|---|---|---|---|---|---|---|
| 390x844-*-t100 | 4/4 in view, 4/4 ≥24×24, 4/4 9/9; y 620–664 / 4/4 in view, 4/4 ≥24×24, 4/4 9/9; y 620–664 | 4/4 in view, 4/4 ≥24×24, 0/4 9/9; y 657–705 | 1347 ms: 9/9 in view / 612 ms: 9/9 in view | 1834 ms, no scroll; crossed off: True | 611 ms: 9/9 in view | 1267 ms, no scroll; crossed off: True |
| 390x844-*-t200 | 4/4 in view, 4/4 ≥24×24, 4/4 9/9; y 396–499 / 4/4 in view, 4/4 ≥24×24, 4/4 9/9; y 396–499 | 0/4 in view, 4/4 ≥24×24, 0/4 9/9; y 1368–1532 | 608 ms: 0/9 not wholly in view (top element: none) / 641 ms: 0/9 not wholly in view (top element: none) | 2519 ms, after 5 wheel steps; crossed off: True | 632 ms: 0/9 not wholly in view (top element: none) | 3643 ms, after 3 wheel steps; crossed off: True |
| 375x667-*-t100 | 4/4 in view, 4/4 ≥24×24, 4/4 9/9; y 443–487 / 4/4 in view, 4/4 ≥24×24, 4/4 9/9; y 443–487 | 0/4 in view, 4/4 ≥24×24, 0/4 9/9; y 657–703 | 608 ms: 0/9 in view (top element: BUTTON._linkBtn_ahnin_329, DIV._ctaDock_ahnin_439) / 637 ms: 0/9 in view (top element: BUTTON._linkBtn_ahnin_329, DIV._ctaDock_ahnin_439) | 3175 ms, after 1 wheel steps; crossed off: True | 615 ms: 3/9 in view (top element: SPAN._face_1npvj_34, SPAN._label_1npvj_64) | 5712 ms, after 2 wheel steps; crossed off: True |
| 375x667-*-t200 | 4/4 in view, 4/4 ≥24×24, 4/4 9/9; y 219–322 / 4/4 in view, 4/4 ≥24×24, 4/4 9/9; y 219–322 | 0/4 in view, 4/4 ≥24×24, 0/4 9/9; y 1414–1578 | 610 ms: 0/9 not wholly in view (top element: none) / 622 ms: 0/9 not wholly in view (top element: none) | 2448 ms, after 6 wheel steps; crossed off: True | 609 ms: 0/9 not wholly in view (top element: none) | 5182 ms, after 3 wheel steps; crossed off: True |
| 844x390-*-t100 | 4/4 in view, 4/4 ≥24×24, 4/4 9/9; y 20–64 / 4/4 in view, 4/4 ≥24×24, 4/4 9/9; y 20–64 | 4/4 in view, 4/4 ≥24×24, 0/4 9/9; y 279–327 | 1313 ms: 9/9 in view / 1220 ms: 9/9 in view | 1446 ms, no scroll; crossed off: True | 702 ms: 9/9 in view | 2469 ms, no scroll; crossed off: True |
| 844x390-*-t200 | 4/4 in view, 4/4 ≥24×24, 4/4 9/9; y 69–173 / 4/4 in view, 4/4 ≥24×24, 4/4 9/9; y 69–173 | 0/4 in view, 4/4 ≥24×24, 0/4 9/9; y 413–577 | 610 ms: 0/9 not wholly in view (top element: none) / 623 ms: 0/9 not wholly in view (top element: none) | 3430 ms, after 2 wheel steps; crossed off: True | 776 ms: 0/9 in view (top element: SPAN._label_1npvj_64) | 5640 ms, after 3 wheel steps; crossed off: True |
| 667x375-*-t100 | 4/4 in view, 4/4 ≥24×24, 4/4 9/9; y 47–91 / 4/4 in view, 4/4 ≥24×24, 4/4 9/9; y 47–91 | 0/4 in view, 4/4 ≥24×24, 0/4 9/9; y 331–377 | 614 ms: 3/9 in view (top element: SPAN._face_1npvj_34) / 772 ms: 3/9 in view (top element: SPAN._face_1npvj_34) | 1132 ms, after 1 wheel steps; crossed off: True | 634 ms: 9/9 in view | 1674 ms, no scroll; crossed off: True |
| 667x375-*-t200 | 4/4 in view, 4/4 ≥24×24, 4/4 9/9; y 69–173 / 4/4 in view, 4/4 ≥24×24, 4/4 9/9; y 69–173 | 0/4 in view, 4/4 ≥24×24, 0/4 9/9; y 556–720 | 614 ms: 0/9 not wholly in view (top element: none) / 953 ms: 0/9 not wholly in view (top element: none) | 2116 ms, after 1 wheel steps; crossed off: True | 614 ms: 0/9 in view (top element: BUTTON._linkBtn_ef3d0_329) | 5008 ms, after 4 wheel steps; crossed off: True |
| 1440x900-*-t100 | 4/4 in view, 4/4 ≥24×24, 4/4 9/9; y 548–596 / 4/4 in view, 4/4 ≥24×24, 4/4 9/9; y 548–596 | not run | 611 ms: 9/9 in view / 633 ms: 9/9 in view | 687 ms, no scroll; crossed off: True | not run |  |
| 1440x900-*-t200 | 0/4 in view, 4/4 ≥24×24, 0/4 9/9; y 864–944 / 0/4 in view, 4/4 ≥24×24, 0/4 9/9; y 864–944 | not run | 619 ms: 6/9 in view (top element: SPAN._label_1npvj_64) / 618 ms: 6/9 in view (top element: SPAN._label_1npvj_64) | 3223 ms, after 1 wheel steps; crossed off: True | not run |  |

- Fix: Brew length 4/4 wholly in view, ≥ 24×24, 9/9 on top at rest at all 8 W2H-D1 configurations (both themes), and at 1440 @100. At 1440 @200 the four options sit at y 864–944 in a 900 px viewport (not wholly in view at rest; 1440 is not in the W2H-D1 list).
- Base `61aba17` "9/9" for Brew length reads 0/4 because the role=radio element is not the hit target over the option's visible face (`span._face_1npvj_34`, as also recorded in `BEFORE-61aba17/*/meta.json` `01-home.covered`); the base's in-view numbers are the comparable ones.
- Mark done on top 9/9 at about +0.6 s and tapped without scrolling: fix 390×844 @100, 844×390 @100, 1440 @100 (taps landed 687–1,834 ms after the End-session tap: the 9/9 check plus the tap took longer than planned under 3 parallel contexts); crossed off in all. Elsewhere on the fix it is under the docked start at rest (375×667 @100: `ctaDock`; 667×375 @100: 3/9, a Button face; 1440 @200: 6/9, a Button label) or not in view (@200), and was reached by real wheel then tapped: crossed off in all 22.
- Base: Mark done 9/9 at +0.6 s at 390×844 @100, 844×390 @100 and **667×375 @100** (the fix has it 3/9 there, under the docked start); covered or out of view at the other five.


## 4. Strip behaviour

### 4.1 A strip change during a tap (fix :5476, Settings, veteran; `probes/cmp/*-tap*.json`)

Target: the first in-flow control below the (empty) strip with its centre in view: "Classic" (Brew length preset in Settings) at all four sizes. (a) `mouse.down` on it, a notice raised while held, 500 ms, `mouse.up`. (b) "Finger in the air": page at rest ≥ 1.6 s (pointer parked), a notice raised, then a real tap / click δ ms later at the target's centre as it was before the notice.

| Size (100 %, light) | (a) held: target top before / during hold / at up / 2.5 s after up; click target | (b) δ = 0 ms | δ = 60 ms | δ = 150 ms | δ = 400 ms |
|---|---|---|---|---|---|
| 390×844 (touch) | 355 / 355 / 355 / 427; the target | 355 → 423 before the tap; click on the preset group `div` (not the target) | strip already occupied at load (top 423 before raising): no move; target | same: no move; target | same: no move; target |
| 375×667 (touch) | 355 / 355 / 355 / 427; the target | 355 → 423; group `div` | strip already occupied (423): target | 355 → 423; group `div` | 355 → 423; group `div` |
| 844×390 (touch) | 325 / 325 / 325 / 393; the target | 325 → 393; group `div` | 325 → 393; group `div` | 325 → 393; group `div` | 325 → 393; group `div` |
| 1440×900 (mouse) | 349 / 349 / 349 / 417; the target | 349 → 417; group `div` | strip already occupied (417): target | same: target | same: target |

- (a): 0 px of movement between pointer-down and pointer-up in 4 of 4; the strip appeared after release (+68 to +72 px).
- (b): in every trial where the strip went from empty to showing (9 trials), the target had moved down 68 px before the tap arrived (δ 0–400 ms) and the click landed on a different element. In the 7 other trials the strip already showed a notice before Lane T raised the trial's notice (what it was is not recorded; between those trials the probe navigated to the identical URL `/?debug&theme=…#/settings`, so the page may not have reloaded and the previous trial's notice may still have been up), and nothing moved. This is the case the maker states as the residual ("a finger already in the air when the page has been at rest for 1.2 s"); Lane T raised the notice through `__kettle.toast` with no input for ≥ 1.6 s.

### 4.2 The queue across a route change (fix, all 22; `groups.queue`)

Four notices raised on Today; the Stats tab tapped after 1 s. `__kettle.notices()` before the tap: 4 in the queue (t1 shown); after: 4 in the queue, t1 shown on `/stats`, its time left 2,200–2,493 ms before the tap and 1,595–2,200 ms after. Drawn on Stats in order in all 22: "Queue one…", "Queue two…" (at 1.5–3.4 s), "Queue three…" (5.3–7.1 s), "Queue four…" (8.7–12.0 s). Nothing dropped; 0 clipped-text samples.

### 4.3 The update prompt (fix, all 22; `groups.update`)

Raised exactly as `ShellOverlays.tsx` raises it (id `pwa-update`, duration Infinity, action Update). At +1.5 s it is the drawn notice. "Brew updated" (3.2 s) raised: sampled every 500 ms, it is the drawn notice from +0.5 s to +3.0 s (20 configurations), to +2.5 s (1) or to +2.0 s (1); then the update prompt is drawn again until the end of the run (+7 s) in all 22. Update then tapped / clicked for real: its handler ran once (22/22), Update 9/9 on top.

### 4.4 Storage banner (storage really full: `QuotaExceededError` on a filler write; a brew started and ended through the debug API; measured 3 s and 7 s after Today returned)

| Size | DOM (`section[data-save-warning]` and its children, attributes, text) fix vs base | `position` fix / base | Box at +3 s fix / base | Box at +7 s fix / base | Strip at +3 s (fix) |
|---|---|---|---|---|---|
| 390×844 light 100 | identical | static / static | [16, **302**, 358, 143] / [16, 234, 358, 143] | [16, 234, 358, 143] / same | "Kettle's off. See you soon." |
| 375×667 dark 200 | identical | static / static | [16, **755**, 343, 332] / [16, 642, 343, 332] | [16, 642, …] / same | same notice |
| 844×390 light 200 | identical | static / static | [443, 16, 377, 292] / same | same / same | same notice (strip in the left column) |
| 1440×900 light 100 | identical | static / static | [929, **112**, 464, 109] / [929, 44, 464, 109] | [929, 44, …] / same | same notice |

The banner's previous / next siblings are the same on both, except 844×390 @200 where the next sibling is the Brew length on the fix and the task field on the base (H's restored layout). While a notice is in Today's strip the banner sits 68 px (390×844 @100, 1440 @100) or 113 px (375×667 @200) lower than on the base; once the strip is empty its box equals the base's.


## 5. The other follow-ups, controls first (base :5470 vs fix :5476)

### 5.1 `break-reach.spec.ts` "Break's over with a carried task" (the old `:179`, line 201 in the trial's spec), all 7 weekdays, frozen dates, 375×667 light @200 and 390×844 dark @200

Same spec file (the trial's, `BREAK_REACH_ALL_DAYS=1`, `-g "Break's over with a carried task" --grep-invert "844×390"`), `--workers=1`, run against each server. Base 00:13:55–00:18:03 (4.1 min), fix 00:18:03–00:22:16 (4.2 min). Logs `runs/break-reach-{5470,5476}.log`, JSON alongside.

| | Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|---|---|---|---|---|---|---|---|
| base 375×667 light | **✘** | ✓ | ✓ | **✘** | ✓ | ✓ | ✓ |
| base 390×844 dark | **✘** | ✓ | ✓ | **✘** | ✓ | ✓ | **✘** |
| fix 375×667 light | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| fix 390×844 dark | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

Base: 9 passed, 5 failed. Every base failure message: `wheel: /^Put the kettle on/ brought wholly into view (centre y 730, visible 313–667)` (375×667 Mon, Thu) / `(centre y 838, visible 422–844)` (390×844 Mon, Thu, Sun), at `break-reach.spec.ts:172`. Fix: 14 passed.
(Playwright printed the test location as `:201:5` on the base run and `:261:136` on the fix run, same file and titles.)

### 5.2 Next brew over the status line (Settings › Next brew on, Monday; the next brew starts by itself; ~4.5 s sampled)

| Configuration | Base: drawn intersections with the notice on top (no sheet) | Base: what (first records) | Base: 9-point control hits | Fix: drawn intersections (no sheet) | Fix: 9-point control hits |
|---|---|---|---|---|---|
| 390×844 light 100 | 70 text | "Kettle's on. Nice start." 30, "Whistles at 16:25" 30 | 0 | 0 | 0 |
| 844×390 light 200 | 158 text | "Kettle's on. Nice start." 28, countdown digits "2" 15, "5" 9, "4" 5 | 0 | 31 text, all the countdown ":" line box (1–5 px), the countdown on top | 0 |
| 375×667 dark 200 | 233 text + 3 control | countdown digits, "Whistles at 16:25", "Kettle's on. Nice start.", "Next brew whenever you're ready" | 3 points | 0 | 0 |

Fix, all 22 configurations (§1.2): the "Recipe done: Take a full tea break · +10 leaves" notice was drawn in the nextbrew state in every configuration; the only drawn intersections in that state are the ":" rows listed in §1.2 (667×375 and 844×390 at 200 %), 0 control hits.

### 5.3 The Ambience sheet with notices queued

Three notices raised on a running brew (after Break's over on Monday), Ambience opened by a real tap, sampled 2 s, then Escape.

| Configuration | Base: sheet controls not on top at their centre, sheet open +2 s | Base: intersections inside the sheet's box with the notice the hit target (open and leaving) | Base: 9-point sheet-control hits (controls) | Fix: sheet controls not on top, +2 s | Fix: same intersections | Fix: 9-point sheet-control hits |
|---|---|---|---|---|---|---|
| 390×844 light 100 | **2 of 10** | 569 | 80 | 0 of 10 | 10 | 5 |
| 844×390 light 200 | **1 of 6** | 462 | 52 | 0 of 6 | 42 | 14 |
| 375×667 dark 200 | 0 of 5 | 532 | 25 | 0 of 5 | 4 | 0 |
| 667×375 light 200 | 0 of 5 | 325 | 17 | 0 of 5 | 9 | 3 |

Fix, all 22 configurations: sheet controls not on top at +2 s with the sheet open = 0 in every one.

- Base 844×390 @200 sheet-exit sequence (`probes/cmp2/844x390-light-t200-BASE-break+queue+sheetexit.json`): open +300 ms: all sheet controls on top; **open +1000 ms (sheet open, panel `pointer-events: auto` chain): "Turn on" (y 236) → a `span` outside the sheet**, with the base's three toasts at y −35–62, 70–167 and below; fix, same moment: "Turn on" → sheet.
- Fix: the strip is in the panel's flow under the scrim (screenshot `probes/cmp/sheetexit-844x390-light-t200-sheetexit-amb-open.png`); the notices wait while the sheet is open.
- The "intersections inside the sheet's box" column is geometric plus `elementFromPoint`; Lane T did not separate open frames from leaving frames for it. On the base the toasts are a fixed layer, so those include toasts drawn over the open sheet; on the fix §1.3 lists the states they come from.

### 5.4 Folded notices

"Clipped text" = a notice (or any descendant with `overflow` ≠ visible or a line clamp) whose scroll size exceeds its client size, per 100 ms sample.

| Configuration | Base: samples with a clipped notice | Base: which | Fix: samples with a clipped notice |
|---|---|---|---|
| 667×375 light 200, Break's over → running brew, 3 notices (break group) | **46** | "Notice one, waiting its turn." 46 | 0 (and 0 in every group of all 22 configurations) |
| 667×375 light 200, 4 notices on Today, then Stats (queue group) | **38** | "Queue four…" 29, "Queue three…" 5, "Queue one…" 2, "Queue two…" 2 | 0 |
| 844×390 light 200 / 390×844 light 100 / 375×667 dark 200 (break and queue groups) | 0 | — | 0 |

Dropped notices (queue group, four raised at once, then the Stats tab): base 390×844 @100, 844×390 @200 and 667×375 @200: "Queue one: Saved 3 minutes of focus." was drawn in 4, 3 and 2 samples, then never again; "Queue two/three/four" stayed drawn together (stacked) until the end of the run. Fix (all 22): all four drawn one at a time, in order (§4.2).

### 5.5 Today right after End (base vs fix, same group)

| Configuration (light) | Base: 9-point control hits by a notice, no sheet | Base: drawn control / text intersections, notice on top | Fix: 9-point control hits, no sheet | Fix: drawn intersections, no sheet |
|---|---|---|---|---|
| 390×844 100 | 318 | 341 / 278 | 0 | 0 |
| 390×844 200 | 447 | 478 / 558 | 0 | 0 |
| 375×667 100 | 266 | 294 / 220 | 0 | 0 |
| 375×667 200 | 133 | 199 / 287 | 0 | 0 |
| 844×390 100 | 168 | 245 / 441 | 0 | 0 |
| 844×390 200 | 133 | 255 / 413 | 0 | 0 |
| 667×375 100 | 169 | 201 / 500 | 0 | 0 |
| 667×375 200 | 177 | 177 / 301 | 0 | 0 |

(Base: `probes/cmp/*-BASE-home+end.json`, the `end` group only; fix: the `end` group of `probes/fix/*.json`.)

### 5.6 R5-D1, LEAD-D1, R7-D1 and D4 (must keep passing)

| Control (round) | The trial's test that carries its shape (`toast-room.spec.ts` / `a11y.spec.ts`) | Result on the fix :5476 |
|---|---|---|
| R5-D1 (banner never moved out of its room by a notice timing out) | "the storage-full banner stays in the page, whole and steady, while … the strip … read by wheel / touch" | 6 passed, 0 failed of 6 run |
| LEAD-D1 (timed notices and the endless update prompt never move the banner) | "notices timing out, and the endless update prompt, never move the banner under the person" | 2 passed, 0 failed of 2 run |
| R7-D1 (update prompt and every notice whole and tappable on Break's over scrolled to its end) | "the update prompt and every notice stay whole and tappable, never over a control, on Break's over…" | 2 passed, 0 failed of 2 run |
| round 8 / Close (three notices never over Close or a Break's over control) | "three notices never cover the session top bar's Close…" | 2 passed, 0 failed of 2 run |
| last notice / docked start | "the last notice leaves where it was, never over the docked start" | 2 passed, 0 failed of 2 run |
| D4 (a toast never covers the break-over controls, carried task included) | `a11y.spec.ts` (375×667 and 390×844) | **not run** (time; see §7). Lane T's probe covers the same state (Break's over on Monday with a carried task, wheeled): 0 control intersections, 0 nine-point hits, all 22 configurations (§1.2) |

Controls were not re-run by Lane T on the control revisions (`20671eb`, `e866118`, `b39202f`); the maker's control-first results are in the packet §3. The base `61aba17` (:5470) has no in-flow strip, so the trial's `toast-room.spec.ts` was not run against it.


## 6. Not worse (fix :5476, `--workers=1`, own `--output`)

### `toast-room.spec.ts` (log `runs/suite-toast-room.log`)

Run 00:23:45–00:28:22 UTC, complete. Summary line: 14 passed (4.6m)

| Result | Test | Time |
|---|---|---|
| ✓ | `tests/toast-room.spec.ts:242:5` the storage-full banner stays in the page, whole and steady, while the notices in the strip are read by wheel (375×667, 200 % text) | 22.6s |
| ✓ | `tests/toast-room.spec.ts:242:5` the storage-full banner stays in the page, whole and steady, while the notices in the strip are read by touch (375×667, 200 % text) | 31.0s |
| ✓ | `tests/toast-room.spec.ts:242:5` the storage-full banner stays in the page, whole and steady, while the notices in the strip are read by wheel (844×390, 200 % text) | 19.1s |
| ✓ | `tests/toast-room.spec.ts:242:5` the storage-full banner stays in the page, whole and steady, while the notices in the strip are read by touch (844×390, 200 % text) | 24.8s |
| ✓ | `tests/toast-room.spec.ts:242:5` the storage-full banner stays in the page, whole and steady, while every notice in the strip is read by wheel (667×375, 200 % text) | 20.0s |
| ✓ | `tests/toast-room.spec.ts:242:5` the storage-full banner stays in the page, whole and steady, while every notice in the strip is read by touch (667×375, 200 % text) | 28.4s |
| ✓ | `tests/toast-room.spec.ts:332:3` notices timing out, and the endless update prompt, never move the banner under the person (375×667, 200 % text, wheel, light) | 23.8s |
| ✓ | `tests/toast-room.spec.ts:332:3` notices timing out, and the endless update prompt, never move the banner under the person (375×667, 200 % text, wheel, dark) | 23.4s |
| ✓ | `tests/toast-room.spec.ts:398:3` the last notice leaves where it was, never over the docked start (375×667, 200 % text) | 5.1s |
| ✓ | `tests/toast-room.spec.ts:398:3` the last notice leaves where it was, never over the docked start (844×390, 200 % text) | 5.0s |
| ✓ | `tests/toast-room.spec.ts:610:3` three notices never cover the session top bar's Close or a Break's over control, panel scrolled to its end (375×667, 200 % text, light) | 12.8s |
| ✓ | `tests/toast-room.spec.ts:610:3` three notices never cover the session top bar's Close or a Break's over control, panel scrolled to its end (375×667, 200 % text, dark) | 12.7s |
| ✓ | `tests/toast-room.spec.ts:658:3` the update prompt and every notice stay whole and tappable, never over a control, on Break's over scrolled to its end and back (667×375, 200 % text, w | 18.5s |
| ✓ | `tests/toast-room.spec.ts:658:3` the update prompt and every notice stay whole and tappable, never over a control, on Break's over scrolled to its end and back (844×390, 200 % text, t | 26.8s |

## 7. Incomplete, deviations, and things to know about this run

- **Slots:** Lane R held 2 of the 3 browser slots and Lead queued jobs for the whole window, so Lane T ran one browser at a time (`--n 1`); the probe ran 3 contexts in that one browser (`--par 3`), which slowed timing-sensitive steps (the "+0.6 s" Mark done taps landed at 687–1,834 ms where no scroll was needed).
- **`notice-strip.spec.ts`** was run with `--workers=1` under one slot, not `--workers=2` as the brief says (two slots were never free to Lane T); see §1.4. It was cut by the container restart after 7 of 25 tests (all 7 passed).
- **Not run:** `integrity.spec.ts`, `w2-home.spec.ts`, `statusbar.spec.ts` (the first combined run was stopped by Lane T at 2 of 77 tests to give the slot to check 1), `a11y.spec.ts` (2 tests of `:61`, light and dark, passed in that stopped run; D4's tests not reached).
- **Probe gaps:** History at 375×667 dark @200 failed in the matrix (dialog wait) and was taken from the A2 re-run; Import "run out" not measured at 1440 (the result row stays while the mouse rests on it, §2); Lane T captured no frame of a leaving sheet, so whether a notice pixel is drawn over a leaving sheet is not established (§1.3); the "finger in the air" trials did not record what already occupied the strip in 7 of 16 trials (§4.1); base groups that raise notices on demand were run only at 4 configurations (C).
- Every setup used the debug API; under test, only real taps, wheel, keys and the real file chooser. No source was edited; nothing committed or pushed. Scripts live in `/home/user/wt/w4tr-t2/kettle/.tmp/LT/` (untracked) and are copied to `LT/tools/`.
- The run ended with a container restart at about 00:40 UTC (not a Lane T action), during `notice-strip.spec.ts`; see §8.


## 8. End state

- **Closed after the fact (03:35 UTC, 2026-10-14) as the record of trial `490ca97`.** A container restart at about 00:40 UTC killed the last job (`chain.sh` → `notice-strip.spec.ts --workers=1` on :5476) after 7 of 25 tests; no summary line or JSON was written for it. Everything before it had completed: probe matrix (22), comparisons (A2, C), `break-reach` base and fix, `toast-room` 14/14.
- Not re-run after the restart (as instructed). Cut by the restart: the remaining 18 `notice-strip` configurations. Never started in the time box: `integrity`, `w2-home`, `statusbar`, `a11y` (D4).
- Processes: at 03:35 UTC no Lane T process existed (`ps`: no `ltprobe`, `chain.sh` or Playwright from Lane T); slot gate `held 0`.
- Evidence size: about 34 MB under `review/LT/` (limit 150 MB).
- The later fix revision is reviewed separately in `RECEIPT-LT-FIX.md`.
