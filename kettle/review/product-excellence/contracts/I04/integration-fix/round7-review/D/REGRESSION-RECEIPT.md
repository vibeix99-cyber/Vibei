# Lane D: Wave 1 regression on R7 (round 7), relaunch final receipt

Checks and receipts only. **No verdict.** Relaunched 09:43 UTC; ended 10:51 UTC (within the 75-minute budget, to 10:58). Model: Claude Sonnet 5.5 (claude-sonnet-5-5); effort not inspectable.
Revision under test: R7 `b39202f` (worktree /home/user/wt/rv7-r7/kettle, clean). INT `0d58c5e` (:5303, /home/user/wt/rv7-int/kettle). Servers re-verified by the orchestrator at 09:40 UTC (R7 dev :5301, INT dev :5303, previews :5321/:5323). All gate runs went through `slots.py` (lane D for Playwright, lane Dcap for captures). LEAD's exclusive integrity run had left the gate before my first job took slots (09:48:27).
**Machine load:** other lanes (A, B, C, LEAD) ran browser jobs concurrently by design; load average was 9 to 14 on 4 CPUs during my runs, so wall times are inflated (captures took 5 to 9 min per run against about 2 min in the first instance).

## Coverage at a glance

| Item | Status |
|---|---|
| tsc | covered (first instance, 03:27 UTC, same build): exit 0 (not rerun, as instructed) |
| vitest | covered (first instance, 03:28 UTC): 27/27 files, 267/267 tests, 0 skipped (not rerun) |
| 1. Playwright chromium, all specs | **covered**: 72/72 passed, 0 skipped, 0 failed |
| 2. Playwright timer-harness + timer-app + pwa | **covered**: 29 passed, 2 skipped, 0 failed, of 31 |
| 3. Standard capture set, R7 vs INT | **partly covered**: 3 of 7 configs (all light: 390x844@2, 375x667@2, 1440x900@1). Not run: the three dark configs and 390x844 dark `--rm` |
| 4. Finish the round-7 captures (cap-d) | **partly covered**: all brief states in all 16 configs exist for both sides; supplementary profile T (e0 and e2 with toast rects) exists in 4 of 8 t200 configs; **not run** for 1440x900 light and dark t200, 375x667 dark t200, 390x844 dark t200 |
| 5. Pixel-diff summary | **covered** for everything captured (162 cap-d pairs, 3 std configs x 21 states); causes stated below, for pairs over 0.5 % |

## 1. Playwright chromium (all specs)

- Command (from /home/user/wt/rv7-r7/kettle): `KETTLE_PORT=5301 KETTLE_PWA_PORT=5311 python3 -I .../round7-review/tools/slots.py run --lane D --n 2 -- npx playwright test --project=chromium --workers=2 --output <scratch>/run2/pw-out-chromium --reporter=list,json` (the reporter flag only adds a JSON file; JSON via PLAYWRIGHT_JSON_OUTPUT_NAME).
- Revision `b39202f`, dev :5301, PWA port 5311. Slot taken 09:48:27, freed 10:03:01. **Wall time 14.5 min** (Playwright 872.6 s).
- **72/72 passed, 0 skipped, 0 failed, 0 flaky** (retries 0). By file: a11y 11, break-reach 7, integrity 25, statusbar 9, toast-room 12, whistle 8.
- M1 test `integrity.spec.ts:768` "export → reset (explicit confirmation) → import restores brews, settings and every reward exactly": **passed first attempt, 16.9 s**, no timeout, under load average about 13. (Maker disclosure of one timeout under load: not reproduced in this run.)
- `integrity.spec.ts:1090` "a banner that appears while Today is open moves nothing under the finger": passed at 390x844 (5.4 s), 375x667 (5.1 s), 1440x900 (6.4 s). No failure, so no rerun was needed.
- For the record, the **first instance's run on the same build** (04:30 to 04:44 UTC, concurrent with captures): 71 passed, 1 failed: `integrity.spec.ts:1090` desktop 1440x900, `expect(getByText('Crossed off. Nice work.')).toBeVisible()` timed out at 10 s (trace: `D/logs/first-instance/trace.zip`, `error-context.md`). Re-run alone with `--workers=1` (slot --n 1): 3/3 passed (all three viewports of that test). Both results stand; today's full run did not reproduce the failure.
- Logs: `D/logs/relaunch/pw-chromium.log`, `pw-chromium.json`. Output dir had no failure artifacts.

## 2. Playwright timer-harness + timer-app + pwa

- Command: `KETTLE_PORT=5301 KETTLE_PWA_PORT=5311 python3 -I .../slots.py run --lane D --n 2 -- npx playwright test --project=timer-harness --project=timer-app --project=pwa --workers=2 --output <scratch>/run2/pw-out-timer-pwa --reporter=list,json`. Revision `b39202f`, :5301, pwa builds and previews on 5311.
- Playwright 10:04:18 to 10:06:17 (**wall 2.0 min**). **29 passed, 2 skipped, 0 failed** of 31 (timer-harness 14 passed; timer-app 12 passed + 2 skipped; pwa 3 passed).
- Skips (by design, in the timer-app project only; both run and passed in timer-harness): `timer.spec.ts:295` "Space toggles..." skipped with "infra is exercised in the harness; screens bind their own keys"; `timer.spec.ts:439` "useRemaining re-renders about once per displayed second" skipped with "render counter lives in the harness".
- Logs: `D/logs/relaunch/pw-timer-pwa.log`, `pw-timer-pwa.json`. (First instance, same build: also 29 passed, 2 skipped.)

## 3. Standard capture set, R7 vs INT (`review/product-excellence/tools/capture.mjs`, unchanged)

- Command per side (back to back, same session, one Dcap slot): `node --import .tmp/D/std-freeze.mjs review/product-excellence/tools/capture.mjs --base http://127.0.0.1:5301|5303 --out <dir> --w W --h H --dpr D --theme light`, run from each side's own worktree so `capture-meta.json` records revision b39202f and 0d58c5e. Wrapper script `probes/std2.sh`.
- **Freeze:** capture.mjs itself freezes nothing, so the preload `probes/std-freeze.mjs` (no maker file touched) gives every context `clock.install({time: 2026-10-10T16:40:00Z})` plus `resume()` (same start instant on both sides, time then runs at the real rate) and defaults every screenshot to `animations: 'disabled'`. `freeze.json` beside each capture records it. Canvas/3D scene animation and the real-rate clock are not frozen by this (see causes).
- Gate: queued 10:06:51, slot taken 10:14:02 (7 min wait), ran 10:14:02 to 10:49:19 (about 5, 5, 5, 4.5, 8, 9 min per run), then stopped by me at 10:49 to leave time for the receipt. The tool writes **21** images per run (ids 01 to 19 with 01b and 11b), not 22.
- Captured and complete (21/21 states, 0 page errors, both sides): **390x844@2 light, 375x667@2 light, 1440x900@1 light.** Path: `D/captures-std/{R7,INT}/<W>x<H>@<DPR>-light/`.
- **Not run:** 390x844@2 dark, 375x667@2 dark, 1440x900@1 dark, 390x844@2 dark with `--rm`.
- Diff matrix (percent of pixels differing by more than 2 per channel; R7 against INT; diff images in `D/diffs/std/`):

| State | 1440x900@1-light | 375x667@2-light | 390x844@2-light |
|---|---|---|---|
| 01-home | 0 | 0 | 0 |
| 01b-home-scrolled | 0 | 0 | 0 |
| 02-focus-start | 0 | 0.343 | 0 |
| 03-focus-mid | 2.418 | 0 | 0.819 |
| 04-focus-paused | 0 | 0.353 | 0.256 |
| 05-focus-added | 0.006 | 0 | 0.719 |
| 06-whistle | 0 | 0.26 | 0.025 |
| 07-summary | 0 | 0 | 0 |
| 08-summary-end | 0 | 0 | 0 |
| 09-break | 0.253 | 0 | 0 |
| 10-break-over | 4.634 | 21.793 | 17.443 |
| 11-summary-unlock | 0.594 | 3.423 | 4.542 |
| 11b-summary-unlock-settled | 7.257 | 2.986 | 4.663 |
| 12-welcome | 0 | 0 | 0 |
| 13-first-brew | 0.456 | 1.744 | 0.357 |
| 14-summary-first | 54.235 | 0 | 0 |
| 15-stats-empty | 0 | 0 | 0.012 |
| 16-stats-populated | 50.785 | 0 | 0 |
| 17-nook-early | 0.608 | 0.658 | 0.643 |
| 18-nook-earned | 1.491 | SIZE 750x8156 vs 750x2950 | SIZE 780x3016 vs 780x8156 |
| 19-settings | 0.867 | 0 | 0 |

Causes for every pair over 0.5 % (both images opened for states 10, 11, 11b, 13, 14, 16, 17 and 18; for 03, 05 and 19 the cause is inferred from the diff bounding boxes and the same pattern, not opened):
- **10-break-over** (4.6 to 21.8 %): the toast stack ("Recipe done: Take 2 full tea breaks") sits higher in R7 than in INT. At 390 and 375 the R7 toast covers the line "Ready for another brew of Chapter 3 notes?"; in INT the toast sits below that line (above the Put the kettle on button). Round-7 change (toast room); the cover of the body line is a fact for the lead to weigh.
- **11-summary-unlock, 11b** (0.6 to 7.3 %): 3D scene animation phase (kettle steam, lid, music notes) and the record-player card edges; same screen, same text. Not frozen by the clock or animations setting.
- **03, 05, 13** (0.7 to 2.4 %): the real-rate clock digits differ by one second between the two sides (for example 14:57 against 14:58) and the kettle scene is in a different animation phase.
- **17-nook-early** (0.6 %): 3D nook scene steam and flame phase.
- **18-nook-earned**: full-page image height differs between the sides (R7 3016 against INT 8156 at 390; R7 8156 against INT 2950 at 375; both about 8100 at 1440 with 1.5 % diff): the height flips from run to run, so this is a capture artifact, not a build difference; the visible content is the same.
- **14-summary-first** (54 %) and **16-stats-populated** (51 %) at 1440 light: **not the same screen.** INT's 14 shows the focus view at "0:00 Almost whistling" where R7 shows the summary; INT's 16 shows Today ("Good afternoon, Robin") where R7 shows Stats. The INT 1440 run took 9.3 min under load and its fixed waits expired before the state arrived. Not comparable; a rerun would be needed to say anything about these two states at 1440.
- **19-settings** (0.9 %, 1440 only) and **18 at 1440** (1.5 %): small regions (settings page bbox [329,34,1374,2450], nook scene); not opened beyond the bounding box, listed as unexplained below 1 %.
- Under 0.5 % (not opened): 02, 04, 06, 09, 15 at some configs, 0.006 to 0.35 %: bounding boxes are the scene or timer digits.

## 4. Round-7 captures (cap-d, R7 and INT in the same browser session per profile)

- Script `probes/cap-d.mjs` (frozen start instant 2026-10-10T16:40:00Z via `page.clock.install` plus `resume`, `animations:'disabled'`, fresh disposable context per profile, real wheel for scroll). Real storage full (quota filled). Output `D/captures/{R7,INT}/<W>x<H>-<theme>-t<100|200>/`, with `meta.json` per directory (URL, port, revision, viewport, DPR, theme, text, state, fixed time, facts). 16 configs: 390x844@2, 375x667@2, 1440x900@1, 844x390@2; light and dark; 100 % and 200 % text.
- **Complete:** brief states a (today with warning), b (Settings > Your data), c (summary note and summary end), e1 (Break's over to its end with three toasts, the Close state), f (focus running, and focus with storage full) in all 16 configs; d1 to d4 (break and Break's over at 200 %, top and bottom) in all 8 t200 configs; a2/b2 (banner scrolled into view where it was not wholly in view at the top) for R7 at 375/390 t200 (a2 and b2) and 844x390 t200 (b2).
- **Supplementary, partial:** e0 and e2 (toast rects) exist in 375x667-light-t200, 390x844-light-t200, 844x390-light-t200, 844x390-dark-t200. **Not run:** the other four t200 configs (queued behind the standard set in the same slot, stopped at 10:49).
- Inventory (PNG counts, R7 against INT; INT has no a2/b2/banner states by design):

| Config | R7 | INT | extra on R7 | extra on INT |
|---|---|---|---|---|
| 1440x900-dark-t100 | 7 | 7 |  |  |
| 1440x900-dark-t200 | 11 | 11 |  |  |
| 1440x900-light-t100 | 7 | 7 |  |  |
| 1440x900-light-t200 | 11 | 11 |  |  |
| 375x667-dark-t100 | 7 | 7 |  |  |
| 375x667-dark-t200 | 13 | 11 | extra vs INT: a2,b2 |  |
| 375x667-light-t100 | 7 | 7 |  |  |
| 375x667-light-t200 | 15 | 13 | extra vs INT: a2,b2 |  |
| 390x844-dark-t100 | 7 | 7 |  |  |
| 390x844-dark-t200 | 13 | 11 | extra vs INT: a2,b2 |  |
| 390x844-light-t100 | 7 | 7 |  |  |
| 390x844-light-t200 | 15 | 13 | extra vs INT: a2,b2 |  |
| 844x390-dark-t100 | 7 | 7 |  |  |
| 844x390-dark-t200 | 14 | 13 | extra vs INT: b2 |  |
| 844x390-light-t100 | 7 | 7 |  |  |
| 844x390-light-t200 | 14 | 13 | extra vs INT: b2 |  |

- Caveat: in the first-pass `meta.json` files (profiles W and N), the toast and banner facts were read after the shot, and `animations:'disabled'` can end a toast right after the shot, so INT's `toasts` and `warningToast` fields under-report. The PNGs are the evidence (INT's warning toast is visible in the a1, b1 and f2 images at phone sizes). Facts are read before the shot in the later runs.
- A sample opened to confirm states: 390x844 light t100 (a1, b1, c1, e1, f1, f2), t200 (d1, d2, d4, e0), 375x667 light t200 (c1, d3, f1), 844x390 light t200 (d3), 1440x900 light t100 and t200 (a1, e1, f2, c2).
- Page errors: none recorded in any `meta.json`.

## 5. Pixel-diff summary, round-7 captures (R7 against INT; 162 pairs; 36 identical; diff images over 0.5 % in `D/diffs/cap/`, all pairs in `D/logs/relaunch/pixdiff-captures.jsonl`)

| State | Pairs | Identical | Under 0.5 % | Over 0.5 % | Range | Cause (images opened) |
|---|---|---|---|---|---|---|
| a1-today-warning | 16 | 4 | 0 | 12 | 18.3 to 40.7 % | R7 shows the in-page banner on Today, INT the warning toast (toast visible at phone sizes, none at 1440 light t100). The 4 identical pairs are 375x667 and 390x844 at 200 % text: the R7 banner starts below the fold (top 621 to 690 px), so a1 equals INT's; a2 shows the banner |
| b1-settings-your-data | 16 | 0 | 0 | 16 | 18.9 to 89.3 % | R7 banner under the heading and the settings list pushed down; INT shows the toast over the list. At 200 % up to 89 % because the content is shifted |
| c1-summary-note | 16 | 2 | 0 | 14 | 2.8 to 22.8 % | R7 has the one-line "Not saved: storage is full. Save backup" note and the summary shifts; identical at 844x390 t200 (note off screen) |
| c2-summary-end | 16 | 14 | 2 | 0 | 0.21 % | 1440 t200 only: text colour of two lines (fade frame) |
| d1-break-top | 8 | 2 | 2 | 4 | 0.05 to 3.9 % | 375/390 at 200 %: R7 control labels wrap and fit ("Skip break", "Pause", "Next brew" wholly inside), INT's labels run past both edges; R7 shows a bottom-edge shadow. 1440: scene |
| d2-break-bottom | 8 | 2 | 2 | 4 | 0.05 to 18.0 % | R7 wheel reaches the bottom (controls and "1 of 4 brewed" visible); INT stays higher (Pause and labels cut off). 844x390 identical |
| d3-breakover-top | 8 | 2 | 2 | 4 | 0.01 to 2.0 % | R7 draws a soft shadow strip at the bottom edge of the panel (375/844); same text |
| d4-breakover-bottom | 8 | 2 | 0 | 6 | 13.4 to 24.1 % | R7's wheel reaches "Put the kettle on" and "That's all for now"; INT's stops with the heading still showing and the buttons below the fold. 1440 identical |
| e0-breakover-top-3toasts | 4 | 0 | 0 | 4 | 34.8 to 38.8 % | R7's three toasts sit higher, covering the heading and body copy of Break's over at 390 (INT's toasts sit lower, over the "Mark it done" line) |
| e1-breakover-end-3toasts | 16 | 0 | 0 | 16 | 4.5 to 67.6 % | Toast stack position: R7 higher than INT at every size (at 1440 about 30 px higher, at phones the R7 stack overlaps the panel text, INT the Mark it done line); panel content otherwise the same |
| e2-...-rects | 4 | 0 | 0 | 4 | 43.1 to 64.7 % | same as e1 |
| f1-focus-running | 16 | 4 | 2 | 10 | 0.12 to 41.4 % | 1440 dark and t100 light: R7 shows a flat backdrop where INT shows the 3D room (scene not yet rendered in R7 at shot time, likely load; the UI column is identical); other sizes: 3D scene animation phase and a one-second clock difference |
| f2-focus-running-storage-full | 16 | 4 | 1 | 11 | 0.006 to 53.0 % | INT shows the warning toast over the focus view (at 200 % text a narrow column covering the timer); R7 shows no toast during the session |

## Observations for the lead (facts, no verdict)

- R7 raises no storage warning while a brew is running (f2); INT raised a toast. The in-page banner (Today, Settings) and the summary note carry it in R7.
- In R7 the Break's over toasts overlap the panel body copy at phone sizes (std state 10 at 390 and 375; cap-d e0 and e1). The toast-room spec passes in the chromium run.
- Break controls are reached by wheel at 200 % in R7 (d2, d4) and are not in INT.
- All 72 chromium tests passed in this run, including the test that failed once in the first instance under load.

## Not run

- Standard capture set: 390x844 dark, 375x667 dark, 1440x900 dark, 390x844 dark `--rm` (time: gate wait plus 5 to 9 min per run under load).
- cap-d profile T for 1440x900 light and dark t200, 375x667 dark t200, 390x844 dark t200.
- tsc and vitest were not rerun (covered by the first instance, as instructed).
- Standard-set states 14 and 16 at 1440 light are not comparable (different screens); no rerun.

Files: `D/logs/relaunch/` (Playwright logs and JSON, pixdiff, matrices, gate logs), `D/logs/first-instance/`, `D/probes/` (scripts), `D/captures/`, `D/captures-std/`, `D/diffs/`.
