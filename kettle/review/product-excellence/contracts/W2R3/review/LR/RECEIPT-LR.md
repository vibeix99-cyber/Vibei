# Lane R receipt, Wave 2 round 3 (raw evidence only, no verdict)

Two parts. **(A)** the combined trial `490ca97` (first revision of the notices work), run 23:23 to 00:40 UTC on 2026-10-13/14 and cut by the container restart at about 00:40 before a receipt was written; this part is assembled from the logs and files that survived. **(B)** the targeted run on the fix trial `99d9368` (integration `8af5430` + `pe/w2r3-notices@64f29cd`), 03:35 UTC onward.

Rules kept in both parts: no source edits, no commits, no pushes. Browsers only through `slots.py run --lane LR` (see the incident in A.8). Own `--output` directories per run. No `pkill`.

---

# PART A. Combined trial `490ca97` (cut by the restart where marked)

## A.1 Servers

| | |
|---|---|
| Trial | worktree `/home/user/wt/w4tr-t2`, dev :5476: `PORT 5476 serves 490ca97 (src 62672e1): VERIFIED` (5 files OK: Toast.module.css, Toast.tsx, StatusBar.tsx, flow.ts, FocusScreen.tsx) at 23:22 and again at about 00:27 (`logs/servers-verify-end.txt`) |
| Control | worktree `/home/user/wt/w4-base`, dev :5470: `PORT 5470 serves 61aba17 (src 4556926): VERIFIED`, same two times |
| Previews (smoke) | :5486 serves `/tmp/rv7-servers/dist-w4tr-t2` (built 23:21): its JS contains `data-notice-strip`, `data-inline-undo` and "Warm Days", not "Warm Streak". :5480 serves `dist-w4base` (built 19:46): contains "Warm Streak", none of the notice strings. `verify.sh` checks dev servers only; the previews were checked by these string counts and an HTTP 200 |

## A.2 Type-check and unit tests (`logs/tsc.log`, `logs/vitest.log`)

- `npx tsc --noEmit` in `/home/user/wt/w4tr-t2/kettle`: exit 0, no output (219 files under `src/` listed by `--listFiles`).
- `npx vitest run`: 30 files passed (30), 290 tests passed (290), 4.8 s.

## A.3 Full chromium suite (`logs/chromium-full.log`)

`KETTLE_PORT=5476 npx playwright test --project=chromium --workers=2 --reporter=list --output=/tmp/claude-0/lr3-out-full`, gate job `--n 2`, 23:23:31 to 23:59:38.

- **167 passed, 0 failed, 0 skipped, 0 not run (36.1 min).** Playwright: `167 passed (36.1m)`.
- Per file (passed): a11y 11, break-reach 17, chai3d 9, integrity 25, notice-strip 25, statusbar 9, toast-room 14, w2-firstvisit 6, w2-home 18, w2-room 7, w2-summary 18, whistle 8.
- No failure, so no reruns on the trial or on the control were needed.
- Machine load during the run: load average 8 to 16 on 4 cores (Lane T and the lead ran browsers at the same time). Slow files reported by Playwright: a11y 9.5 min, integrity 5.6 min, break-reach 5.4 min.

## A.4 timer-harness, timer-app, pwa (`logs/timer-pwa.log`)

`KETTLE_PORT=5476 KETTLE_PWA_PORT=5497 npx playwright test --project=timer-harness --project=timer-app --project=pwa --workers=1`, gate `--n 1`, 00:00 to 00:03.

- **29 passed, 2 skipped (3.0 min).** Skipped: `timer.spec.ts:294` (timer-app, "keyboard shortcuts infra: Space toggles ...") and `timer.spec.ts:438` (timer-app, "rendering budget: useRemaining re-renders about once per displayed second").
- The pwa spec left a `vite preview` on :5497 (PID 15994, parent PID 1). Killed by that PID; the port answered nothing afterwards.


## A.5 Standard capture set, 21 states (dev :5476 vs dev :5470)

`review/product-excellence/tools/capture.mjs` unchanged (sha256 `aae6cc92073e342bb9a04d01fb0e9920b82296f8a051eb12a3276eb932364518`), run from each worktree's `kettle/` with `node --import ./.tmp/LR/std-freeze.mjs` (preload sha256 `1caad7a6f237…99eef3`, identical copy on both sides; fixed start instant 2026-10-10T16:40:00Z, then real-rate clock; screenshots `animations: "disabled"`). Trial :5476 (`meta.revision` 490ca97) and control :5470 (`meta.revision` 61aba17) ran side by side in one gate job (`--n 2`). `pdiff.py` with default tolerance 16. "pct_strict" = share of pixels with any channel difference; "pct_tol" = share with a channel difference above 16. A pair is listed as over 0.5 % when either figure is above 0.5 (the rule `pdiff.py` itself uses to write a diff image). Not classified.

**Read the dark rows with A.7: the 390 and 375 dark folders are of mixed provenance; 1440 dark was not completed.**

### Matrix

| configuration | states captured trial / control | page errors trial / control | exit trial / control | wall s trial / control | pairs | pairs over 0.5 % |
|---|---|---|---|---|---|---|
| 390x844@2-light | 21 / 21 | 0 / 0 | 0 / 0 | 286 / 303 | 21 | 11 |
| 375x667@2-light | 21 / 21 | 0 / 0 | 0 / 0 | 307 / 305 | 21 | 8 |
| 1440x900@1-light | 21 / 21 | 0 / 0 | 0 / 0 | 570 / 648 | 21 | 11 |
| 390x844@2-dark | 21 / 21 | 0 / 0 | 0 / 0 | 484 / 444 | 21 | 11 |
| 375x667@2-dark | 21 / 21 | 0 / 0 | 0 / 0 | 393 / 360 | 21 | 8 |
| 1440x900@1-dark | not run / not completed | | | | | |

### Pairs over 0.5 %

Files are in `captures/<configuration>/` as `trial-<state>.png`, `ctrl-<state>.png`, `<state>-diff.png` (red = pixels over tolerance 16; faded trial image elsewhere). `pdiff.json` there has every pair's figures (all 21 states, also those under 0.5 %).

**390x844@2-light**: 11 of 21

| state | size trial / control | pct_strict | pct_tol | bbox of pixels over tolerance [x0,y0,x1,y1] |
|---|---|---|---|---|
| 01-home | 780x1688 / 780x1688 | 7.838 | 4.427 | [32, 1193, 747, 1348] |
| 01b-home-scrolled | 780x1688 / 780x1688 | 43.171 | 33.605 | [32, 0, 747, 1547] |
| 03-focus-mid | 780x1688 / 780x1688 | 11.457 | 5.366 | [24, 20, 754, 1585] |
| 05-focus-added | 780x1688 / 780x1688 | 0.548 | 0.523 | [297, 573, 595, 1134] |
| 10-break-over | 780x1688 / 780x1688 | 30.612 | 21.992 | [31, 864, 748, 1568] |
| 11-summary-unlock | 780x1688 / 780x1688 | 8.784 | 2.692 | [21, 283, 426, 1379] |
| 11b-summary-unlock-settled | 780x1688 / 780x1688 | 3.895 | 0.277 | [60, 1152, 363, 1379] |
| 13-first-brew | 780x1688 / 780x1688 | 30.013 | 1.043 | [0, 0, 775, 1134] |
| 17-nook-early | 780x3238 / 780x3238 | 1.915 | 0.276 | [257, 322, 580, 612] |
| 18-nook-earned | 780x8156 / 780x8156 | 1.321 | 0.138 | [115, 280, 672, 611] |
| 19-settings | 780x8256 / 780x8256 | 1.587 | 0.296 | [142, 230, 721, 1779] |

Under 0.5 %: 02-focus-start (0.36/0.35), 04-focus-paused (0.258/0.245), 06-whistle (0.0/0.0), 07-summary (0.0/0.0), 08-summary-end (0.0/0.0), 09-break (0.0/0.0), 12-welcome (0.0/0.0), 14-summary-first (0.0/0.0), 15-stats-empty (0.094/0.087), 16-stats-populated (0.035/0.032)

**375x667@2-light**: 8 of 21

| state | size trial / control | pct_strict | pct_tol | bbox of pixels over tolerance [x0,y0,x1,y1] |
|---|---|---|---|---|
| 01-home | 750x1334 / 750x1334 | 10.878 | 7.149 | [32, 858, 717, 981] |
| 01b-home-scrolled | 750x1334 / 750x1334 | 47.971 | 37.338 | [32, 5, 717, 1193] |
| 05-focus-added | 750x1334 / 750x1334 | 0.527 | 0.507 | [284, 367, 550, 864] |
| 10-break-over | 750x1334 / 750x1334 | 32.43 | 28.16 | [31, 646, 718, 1329] |
| 11-summary-unlock | 750x1334 / 750x1334 | 5.178 | 1.46 | [19, 87, 409, 519] |
| 13-first-brew | 750x1334 / 750x1334 | 0.789 | 0.338 | [288, 1, 549, 860] |
| 17-nook-early | 750x3272 / 750x3272 | 2.345 | 0.243 | [242, 322, 558, 605] |
| 18-nook-earned | 750x8156 / 750x2950 (SIZE differs) | 64.749 | 63.924 | [169, 287, 603, 589] |

Under 0.5 %: 02-focus-start (0.0/0.0), 03-focus-mid (0.252/0.231), 04-focus-paused (0.25/0.237), 06-whistle (0.0/0.0), 07-summary (0.0/0.0), 08-summary-end (0.0/0.0), 09-break (0.0/0.0), 11b-summary-unlock-settled (0.012/0.0), 12-welcome (0.0/0.0), 14-summary-first (0.0/0.0), 15-stats-empty (0.097/0.09), 16-stats-populated (0.036/0.033), 19-settings (0.0/0.0)

**1440x900@1-light**: 11 of 21

| state | size trial / control | pct_strict | pct_tol | bbox of pixels over tolerance [x0,y0,x1,y1] |
|---|---|---|---|---|
| 02-focus-start | 1440x900 / 1440x900 | 42.781 | 2.066 | [29, 55, 1323, 783] |
| 04-focus-paused | 1440x900 / 1440x900 | 0.552 | 0.537 | [397, 335, 1325, 677] |
| 05-focus-added | 1440x900 / 1440x900 | 3.559 | 0.239 | [201, 335, 1322, 783] |
| 10-break-over | 1440x900 / 1440x900 | 9.653 | 6.652 | [521, 94, 1383, 631] |
| 11b-summary-unlock-settled | 1440x900 / 1440x900 | 7.113 | 0.594 | [947, 250, 1338, 705] |
| 13-first-brew | 1440x900 / 1440x900 | 3.337 | 0.078 | [201, 521, 607, 783] |
| 14-summary-first | 1440x900 / 1440x900 | 75.19 | 21.434 | [29, 24, 1401, 880] |
| 16-stats-populated | 1440x2913 / 1440x2913 | 50.861 | 16.006 | [12, 44, 1392, 2800] |
| 17-nook-early | 1440x2888 / 1440x2888 | 1.241 | 0.284 | [638, 308, 1108, 724] |
| 18-nook-earned | 1440x2888 / 1440x2888 | 3.24 | 0.5 | [445, 237, 1225, 706] |
| 19-settings | 1440x3651 / 1440x3651 | 55.651 | 33.055 | [307, 34, 1374, 3617] |

Under 0.5 %: 01-home (0.0/0.0), 01b-home-scrolled (0.0/0.0), 03-focus-mid (0.244/0.233), 06-whistle (0.001/0.0), 07-summary (0.001/0.0), 08-summary-end (0.0/0.0), 09-break (0.0/0.0), 11-summary-unlock (0.092/0.068), 12-welcome (0.0/0.0), 15-stats-empty (0.044/0.039)

**390x844@2-dark**: 11 of 21

| state | size trial / control | pct_strict | pct_tol | bbox of pixels over tolerance [x0,y0,x1,y1] |
|---|---|---|---|---|
| 01-home | 780x1688 / 780x1688 | 7.86 | 4.27 | [32, 1195, 747, 1348] |
| 01b-home-scrolled | 780x1688 / 780x1688 | 42.681 | 29.206 | [32, 0, 747, 1547] |
| 03-focus-mid | 780x1688 / 780x1688 | 12.906 | 0.254 | [92, 347, 593, 1134] |
| 06-whistle | 780x1688 / 780x1688 | 61.493 | 23.287 | [0, 20, 779, 1668] |
| 10-break-over | 780x1688 / 780x1688 | 30.152 | 22.062 | [32, 864, 747, 1568] |
| 11-summary-unlock | 780x1688 / 780x1688 | 7.005 | 2.803 | [60, 412, 412, 1379] |
| 11b-summary-unlock-settled | 780x1688 / 780x1688 | 5.104 | 0.261 | [60, 1152, 363, 1379] |
| 13-first-brew | 780x1688 / 780x1688 | 32.799 | 9.079 | [0, 0, 776, 1134] |
| 17-nook-early | 780x3238 / 780x3238 | 2.491 | 0.332 | [241, 327, 580, 625] |
| 18-nook-earned | 780x3016 / 780x8156 (SIZE differs) | 64.24 | 63.085 | [162, 331, 627, 2050] |
| 19-settings | 780x8256 / 780x8256 | 2.064 | 0.183 | [113, 287, 697, 1779] |

Under 0.5 %: 02-focus-start (0.0/0.0), 04-focus-paused (0.0/0.0), 05-focus-added (0.252/0.239), 07-summary (0.0/0.0), 08-summary-end (0.0/0.0), 09-break (0.357/0.348), 12-welcome (0.0/0.0), 14-summary-first (0.0/0.0), 15-stats-empty (0.095/0.087), 16-stats-populated (0.035/0.032)

**375x667@2-dark**: 8 of 21

| state | size trial / control | pct_strict | pct_tol | bbox of pixels over tolerance [x0,y0,x1,y1] |
|---|---|---|---|---|
| 01-home | 750x1334 / 750x1334 | 11.475 | 3.476 | [32, 860, 717, 981] |
| 01b-home-scrolled | 750x1334 / 750x1334 | 47.403 | 31.589 | [32, 5, 717, 1193] |
| 03-focus-mid | 750x1334 / 750x1334 | 8.445 | 0.697 | [87, 145, 607, 974] |
| 10-break-over | 750x1334 / 750x1334 | 33.16 | 28.458 | [32, 646, 717, 1300] |
| 14-summary-first | 750x1334 / 750x1334 | 19.143 | 4.611 | [19, 87, 464, 544] |
| 17-nook-early | 750x3272 / 750x3272 | 2.163 | 0.307 | [247, 325, 558, 607] |
| 18-nook-earned | 750x8156 / 750x8156 | 1.61 | 0.234 | [98, 275, 669, 594] |
| 19-settings | 750x8434 / 750x8434 | 73.725 | 30.237 | [32, 43, 717, 8433] |

Under 0.5 %: 02-focus-start (0.355/0.337), 04-focus-paused (0.001/0.001), 05-focus-added (0.0/0.0), 06-whistle (0.0/0.0), 07-summary (0.0/0.0), 08-summary-end (0.0/0.0), 09-break (0.0/0.0), 11-summary-unlock (0.031/0.0), 11b-summary-unlock-settled (0.301/0.0), 12-welcome (0.0/0.0), 13-first-brew (0.497/0.024), 15-stats-empty (0.098/0.09), 16-stats-populated (0.036/0.033)


## A.6 Smoke with real input on the previews at 390×844@2 light, touch (`smoke-*/smoke.json`, screenshots in the same folders, `logs/smoke-*.log`)

Script: `/tmp/claude-0/lr3-scratch/smoke.mjs` (Playwright, `locator.tap()` and `keyboard.type`; profile `?debug&seed=veteran&theme=light`; steps as in the brief; page errors, console errors and warnings, and failed requests recorded). Three runs, because the literal "wait a few seconds" session records no brew and leaves no "Carried from your last brew / Mark done" on Today (on either side, runs A and C), so step 3 had nothing to tap:


**Run A: trial preview :5486, literal (a few seconds, no clock jump).** Evidence `smoke-trial-literal/` (smoke.json + screenshots). Page errors 0, console errors 0, console warnings 0, failed requests 0.

| step | result | ms | notes |
|---|---|---|---|
| load | ok | 4606 |  |
| 1 home: type a task, Put the kettle on | ok | 3705 | field=Smoke test task |
| 2 wait, End -> End session -> Today | ok | 11348 | strip=["Kettle’s off. See you soon."] ; dialogs=0 rootInert=false |
| 3 Mark done, then Undo | FAIL: locator.getAttribute: Timeout 30000ms exceeded. | 30005 | markCount=0 |
| 4 start again, finish(), summary, Skip break | ok | 9790 | summaryCta=Tea time · 5 min ; pills=["+55 leaves","Goal met · 75/60 min Daily goal met: 75 of 60 minutes today","23 23 days warm","Recipe done · Name what you’re brewing twice","12 139 leaves to level 13 139 leaves to cozy level 13"] |
| 5 Nook | ok | 2638 |  |
| 6 Stats: delete a brew, then Undo | ok | 7697 | rowsBefore=11 ; undoRow=Brew deleted Undo ; rowsAfterUndo=11 ; firstLabelSame=true |
| 7 Settings | ok | 3584 | scrollY=1800 |

**Run B: trial preview :5486, `__kettle.ff(3 min)` before End (as `notice-strip.spec` does).** Evidence `smoke-trial-ff/` (smoke.json + screenshots). Page errors 0, console errors 0, console warnings 0, failed requests 0.

| step | result | ms | notes |
|---|---|---|---|
| load | ok | 5311 |  |
| 1 home: type a task, Put the kettle on | ok | 4903 | field=Smoke test task |
| 2 wait, End -> End session -> Today | ok | 17816 | ff 3 min before End (spec-style) ; strip=["Recipe done: Name what you’re brewing twice · +15 leaves"] ; dialogs=0 rootInert=false |
| 3 Mark done, then Undo | ok | 2229 | markCount=1 ; markLabel=Mark “Smoke test task” done ; undoRow=Crossed off. Nice work. Undo ; fieldAfterUndo=Smoke test task ; undoRowCountAfter=0 |
| 4 start again, finish(), summary, Skip break | ok | 12987 | summaryCta=Tea time · 5 min ; pills=["+40 leaves","Goal met · 78/60 min Daily goal met: 78 of 60 minutes today","23 23 days warm","Recipes 2/3","12 136 leaves to level 13 136 leaves to cozy level 13"] |
| 5 Nook | ok | 4320 |  |
| 6 Stats: delete a brew, then Undo | ok | 18285 | rowsBefore=12 ; undoRow=Brew deleted Undo ; rowsAfterUndo=12 ; firstLabelSame=true |
| 7 Settings | ok | 4759 | scrollY=1800 |

**Run C: control preview :5480, literal (same script; selectors for the trial's inline Undo).** Evidence `smoke-ctrl-literal/` (smoke.json + screenshots). Page errors 0, console errors 0, console warnings 0, failed requests 0.

| step | result | ms | notes |
|---|---|---|---|
| load | ok | 5696 |  |
| 1 home: type a task, Put the kettle on | ok | 7272 | field=Smoke test task |
| 2 wait, End -> End session -> Today | ok | 21344 | strip=[] ; dialogs=0 rootInert=false |
| 3 Mark done, then Undo | FAIL: locator.getAttribute: Timeout 30000ms exceeded. | 30023 | markCount=0 |
| 4 start again, finish(), summary, Skip break | ok | 14494 | summaryCta=Tea time · 5 min ; pills=["+55 leaves","Goal met · 75/60 min Daily goal met: 75 of 60 minutes today","23 23 days warm","Recipe done · Name what you’re brewing twice","12 139 leaves to level 13 139 leaves to cozy level 13"] |
| 5 Nook | ok | 4554 |  |
| 6 Stats: delete a brew, then Undo | FAIL: locator.waitFor: Timeout 10000ms exceeded. | 21518 | rowsBefore=11 |
| 7 Settings | ok | 4305 | scrollY=1800 |


## A.7 What in Part A is incomplete or not clean

- **Dark captures, 390×844@2 and 375×667@2: mixed provenance, not a clean A/B.** Two capture chains wrote into the same output folders at the same time (A.8). The 390 dark files show the modification times of the second chain (00:28 to 00:36); the 375 dark folders hold the first chain's completed run (00:31 to 00:37) with the second chain's first states written over it before the restart (it was at its 375 dark run, started 00:36:29, when the restart came). The pdiff for these two was computed at 00:38, during that overlap. Treat the dark rows above as indicative only. A clean rerun was not done in Part A.
- **1440×900@1 dark: not completed.** The chain that was running it (started 00:37:40, 10 of 21 trial PNGs on disk) was stopped by me at 00:39 (A.8). No pdiff exists for it.
- **Light captures (390, 375, 1440): clean.** Each side ran once, side by side, in one gate job of `--n 2`; `capture-meta.json` of both sides: 21 states, 0 page errors.
- Smoke run C (control): step 6 failed only because the selector is the trial's inline Undo row (`[data-undo-for="history-delete"]`), which the control does not have; what the control shows after a delete was not recorded (the step stopped before the screenshot).
- No control smoke with the 3-minute fast-forward (run B has no control counterpart).
- The surviving `captures/matrix.md` is the same matrix as above; its dark rows carry the caveat in this list.

## A.8 Process incident (gate)

At about 00:26 I killed (PID 18932) the slots wrapper of a queued dark-capture job (`cap.sh` 390 dark, 375 dark, 1440 dark) and resubmitted two configurations. The wrapper had already started its command a few seconds before: the command (`cap.sh`, PID 29751, parent became PID 1) kept running, **not registered in the gate**, and ran its own 390 dark, 375 dark and 1440 dark captures (two browsers at a time) from about 00:25:50 to 00:39. For that time the machine had up to two browsers of mine beyond the gate's count. At 00:39 I found it (`ps` showed two `cap.sh` trees and four capture processes), and stopped it with explicit `kill` of PIDs 29751, 3972, 3973, 3978, 3979, then the two browser roots 4118 and 4028. The restart at about 00:40 ended everything else. This is also why the dark rows are mixed (A.7).


---

# PART B. Targeted run on the fix trial `99d9368` (`pe/w2r3-notices@64f29cd`, code `40f92b6`)

Fix trial `99d9368` = integration `8af5430` + `64f29cd`, worktree `/home/user/wt/w4tr-t2f`, kettle/src `5cd9a44`, dev :5477, preview :5487. Control: base `61aba17` (worktree `/home/user/wt/w4-base`, dev :5470, preview :5480). Run 03:35 to about 04:50 UTC on 2026-10-14, **one gate slot, one browser at a time** (Lanes T and the lead used the other two). Raw evidence only.

## B.0 How the run differs from the brief

- **One slot means one browser.** The brief's captures ran side by side on two slots in Part A; here the fix side and the base side ran one after the other inside one gate job, so a capture pair costs twice the wall time.
- **Controls not run for the suites.** The brief asked for each suite also on the base. Because no test failed on the fix trial (B.3), there was nothing to classify as pre-existing, and with one slot I spent the time on more fix-trial coverage. The base was run for `tsc`, `vitest` and the captures only. Specs that do not exist on the base: `summary-notice` (new), `notice-strip`, `w2-home` (restored by T2 on the trial; absent from the base tests folder).
- **Capture sets.** `390x844@2 light` is the full 21 states. Every other configuration is the **16 states `01 01b 02-14`** (the tool's own `--only 01,01b,02,03,04,05,06,07,08,09,10,11,11b,12,13,14`): the five full-page tab states 15-19 (stats, nook, settings) were left out because they cost about two thirds of a capture's wall time, and the fix changed nothing in the tabs. All summary states (07, 08, 11, 11b, 14) are in every set. The tool and the preload are the same files as in Part A (`capture.mjs` unchanged, `std-freeze.mjs` sha256 `1caad7a6…99eef3`), run from each worktree's `kettle/`.
- **Previews, not dev servers.** The brief asked for fix preview :5487 vs base preview :5480; Part A used dev :5476 vs :5470. The comparison with Part A therefore has a dev-versus-preview step in it; B.5 carries a noise-floor column (base preview vs base dev, same code) for that reason.
- **Preview :5487 is the fix build.** My own `vite build` of `/home/user/wt/w4tr-t2f/kettle` (outDir `/tmp/claude-0/lr4-dist`) produced the same asset names as :5487 serves and the same `index-rWnj8aw2.js` (sha256 prefix `d46b365145270f3c`, both).

## B.1 Servers (`logs-fix/servers-verify.txt`)

`verify.sh` at 03:35 and again at the end: `PORT 5477 serves 99d9368 (src 5cd9a44): VERIFIED`; `PORT 5470 serves 61aba17 (src 4556926): VERIFIED`; `PORT 5476 serves 490ca97 (src 62672e1): VERIFIED`. Previews :5487, :5480, :5486 answered HTTP 200.

## B.2 Type-check, unit tests, production build

| | fix trial (`logs-fix/*-fix.log`) | base (`logs-fix/*-base.log`) |
|---|---|---|
| `npx tsc --noEmit` | exit 0, no output | exit 0, no output |
| `npx vitest run` | 30 files, **290 passed (290)** | 30 files, 289 passed (289) |
| `npx vite build --outDir /tmp/claude-0/lr4-dist` | exit 0; PWA precache 119 entries (3065.94 KiB) | not built here |

(The one extra vitest test on the fix side is the badge-rename test that came in with B's merge.)

## B.3 Playwright, chromium project, `--workers=1`, `KETTLE_PORT=5477`, own `--output=/tmp/claude-0/lr4-out-<job>`

Specs picked. The brief's six: `w2-summary`, `summary-notice`, `integrity`, `break-reach`, `w2-home`, `statusbar`. Then, from `grep -lE "pwa|needRefresh|update|/done|summary" tests/*.spec.ts`: `a11y`, `break-reach`, `integrity`, `notice-strip`, `pwa`, `summary-notice`, `timer`, `toast-room`, `w2-summary`, `whistle`. Of those, the ones **changed by the fix** are `a11y` (the two "a toast never covers the session controls or the summary footer" cases), `notice-strip` (its summary steps, run for one configuration) and `summary-notice` (new). `timer` and `pwa` run through their projects (B.4). `whistle`, the rest of `a11y` and the other 24 `notice-strip` configurations were **not run** (time, one slot). The jobs below ran in this order.


| job (log in `logs-fix/<job>.log`, json `pw-<job>.json`) | specs | passed | failed | flaky | skipped | wall |
|---|---|---|---|---|---|---|
| A-summary | tests/summary-notice.spec.ts + tests/w2-summary.spec.ts | 32 | 0 | 0 | 0 | 12.8 min |
| B1-integrity-statusbar | tests/integrity.spec.ts + tests/statusbar.spec.ts | 34 | 0 | 0 | 0 | 9.6 min |
| B3-breakreach | tests/break-reach.spec.ts | started, not finished (see log) | | | | |
| C1-a11y-noticestrip | tests/a11y.spec.ts (-g "a toast never covers") + tests/notice-strip.spec.ts (-g "390×844 light 100 %") | not run (time) | | | | |
| C2-toast-room | tests/toast-room.spec.ts | not run (time) | | | | |
| C3-w2-home | tests/w2-home.spec.ts | not run (time) | | | | |
| timer-pwa | projects timer-harness + timer-app + pwa | 29 | 0 | 0 | 2 | 3.8 min |

Passed per file: A-summary: summary-notice.spec.ts 14, w2-summary.spec.ts 18; B1-integrity-statusbar: integrity.spec.ts 25, statusbar.spec.ts 9; timer-pwa: pwa.spec.ts 3, timer.spec.ts 26


## B.4 timer-harness, timer-app, pwa (`logs-fix/timer-pwa.log`)

`KETTLE_PORT=5477 KETTLE_PWA_PORT=5497 npx playwright test --project=timer-harness --project=timer-app --project=pwa --workers=1 --output=/tmp/claude-0/lr4-out-tp`: **29 passed, 2 skipped (3.8 min)**, the same as Part A. Skipped: `timer.spec.ts:294` (timer-app, "keyboard shortcuts infra: Space toggles ...") and `timer.spec.ts:438` (timer-app, "rendering budget: useRemaining re-renders about once per displayed second"). Per project: pwa 3 tests (the pwa spec builds the fix worktree into `test-results/pwa-dist` and serves it on :5497). The `vite preview` it left behind (PID 14764, parent PID 1, `--port 5497`) was killed by that PID; the port answered nothing afterwards.


## B.5 Standard capture set, fix preview :5487 (left, "trial" in the file names) vs base preview :5480 ("ctrl")

Folders: `captures-fix/<configuration>/` hold `trial-<state>.png` (fix), `ctrl-<state>.png` (base) and `<state>-diff.png` for every pair over 0.5 %; `crop-<state>-fix-left-base-right.png` for the summary states (and 06) that differ at all; `pdiff.json` (all pairs); `delta-fix-vs-490ca97.json` and `delta-base-preview-vs-dev.json`; the two sides' `capture-meta.json`, `freeze.json` and `run.log`. Same `pdiff.py` (tolerance 16), same rule as in A.5 for "over 0.5 %". Not classified.

| configuration | states captured fix / base | page errors fix / base | exit fix / base | wall s fix / base | pairs | pairs over 0.5 % (strict or tol) |
|---|---|---|---|---|---|---|
| 390x844@2-light | 21 / 21 | 0 / 0 | 0 / 0 | 337 / 308 | 21 | 12 |
| 375x667@2-light | 16 / 16 | 0 / 0 | 0 / 0 | 103 / 95 | 16 | 5 |
| 1440x900@1-light | 16 / 16 | 0 / 0 | 0 / 0 | 128 / 113 | 16 | 6 |
| 390x844@2-dark | 16 / 16 | 0 / 0 | 0 / 0 | 82 / 84 | 16 | 10 |
| 375x667@2-dark | 16 / 16 | 0 / 0 | 0 / 0 | 74 / 73 | 16 | 5 |
| 1440x900@1-dark | not run / not completed | | | | | |

**Summary states without a notice, fix vs base (strict % / tolerance-16 %, bbox of pixels over tolerance):**

| state | 390x844@2-light | 375x667@2-light | 1440x900@1-light | 390x844@2-dark | 375x667@2-dark |
|---|---|---|---|---|---|
| 07-summary | 0.416 / 0.413 [352, 1016, 483, 1059] | **identical (0 / 0)** | **identical (0 / 0)** | **identical (0 / 0)** | **identical (0 / 0)** |
| 08-summary-end | 0.416 / 0.413 [352, 274, 483, 317] | **identical (0 / 0)** | **identical (0 / 0)** | 0.592 / 0.0 [65, 529, 65, 529] | **identical (0 / 0)** |
| 11-summary-unlock | 5.446 / 2.291 [60, 952, 491, 1379] | 0.181 / 0.0  | 7.956 / 7.917 [942, 250, 1367, 705] | 5.19 / 1.558 [60, 1152, 363, 1379] | 0.302 / 0.02 [104, 1046, 184, 1053] |
| 11b-summary-unlock-settled | 3.75 / 0.726 [60, 952, 491, 1315] | 0.264 / 0.002 [92, 1046, 105, 1053] | 7.339 / 0.553 [949, 250, 1363, 705] | 5.145 / 0.121 [60, 1152, 363, 1333] | 0.296 / 0.001 [92, 1046, 108, 1051] |
| 14-summary-first | 31.081 / 1.553 [0, 0, 775, 633] | **identical (0 / 0)** | 39.338 / 1.759 [29, 54, 1099, 700] | **identical (0 / 0)** | **identical (0 / 0)** |

### Pairs over 0.5 %

**390x844@2-light**: 12 of 21

| state | size fix / base | pct_strict | pct_tol | bbox |
|---|---|---|---|---|
| 01-home | 780x1688 / 780x1688 | 7.838 | 4.427 | [32, 1193, 747, 1348] |
| 01b-home-scrolled | 780x1688 / 780x1688 | 43.171 | 33.605 | [32, 0, 747, 1547] |
| 02-focus-start | 780x1688 / 780x1688 | 0.646 | 0.457 | [300, 24, 593, 1134] |
| 03-focus-mid | 780x1688 / 780x1688 | 3.012 | 0.094 | [102, 449, 412, 732] |
| 04-focus-paused | 780x1688 / 780x1688 | 0.644 | 0.455 | [329, 24, 593, 1134] |
| 10-break-over | 780x1688 / 780x1688 | 30.612 | 21.992 | [31, 864, 748, 1568] |
| 11-summary-unlock | 780x1688 / 780x1688 | 5.446 | 2.291 | [60, 952, 491, 1379] |
| 11b-summary-unlock-settled | 780x1688 / 780x1688 | 3.75 | 0.726 | [60, 952, 491, 1315] |
| 13-first-brew | 780x1688 / 780x1688 | 3.265 | 0.36 | [105, 415, 596, 1134] |
| 14-summary-first | 780x1688 / 780x1688 | 31.081 | 1.553 | [0, 0, 775, 633] |
| 17-nook-early | 780x3238 / 780x3238 | 2.764 | 0.217 | [253, 326, 581, 611] |
| 18-nook-earned | 780x3016 / 780x3016 | 2.1 | 0.413 | [96, 286, 682, 611] |

Under 0.5 %: 05-focus-added (0.446/0.258), 06-whistle (0.285/0.107), 07-summary (0.416/0.413), 08-summary-end (0.416/0.413), 09-break (0.0/0.0), 12-welcome (0.0/0.0), 15-stats-empty (0.094/0.087), 16-stats-populated (0.035/0.032), 19-settings (0.0/0.0)

**375x667@2-light**: 5 of 16

| state | size fix / base | pct_strict | pct_tol | bbox |
|---|---|---|---|---|
| 01-home | 750x1334 / 750x1334 | 10.878 | 7.149 | [32, 858, 717, 981] |
| 01b-home-scrolled | 750x1334 / 750x1334 | 47.971 | 37.338 | [32, 5, 717, 1193] |
| 06-whistle | 750x1334 / 750x1334 | 1.448 | 0.018 | [332, 179, 600, 363] |
| 10-break-over | 750x1334 / 750x1334 | 25.242 | 22.642 | [32, 646, 717, 1329] |
| 13-first-brew | 750x1334 / 750x1334 | 27.121 | 1.495 | [0, 1, 621, 1250] |

Under 0.5 %: 02-focus-start (0.0/0.0), 03-focus-mid (0.252/0.231), 04-focus-paused (0.354/0.347), 05-focus-added (0.0/0.0), 07-summary (0.0/0.0), 08-summary-end (0.0/0.0), 09-break (0.0/0.0), 11-summary-unlock (0.181/0.0), 11b-summary-unlock-settled (0.264/0.002), 12-welcome (0.0/0.0), 14-summary-first (0.0/0.0)

**1440x900@1-light**: 6 of 16

| state | size fix / base | pct_strict | pct_tol | bbox |
|---|---|---|---|---|
| 02-focus-start | 1440x900 / 1440x900 | 39.804 | 2.041 | [29, 55, 1323, 699] |
| 03-focus-mid | 1440x900 / 1440x900 | 2.017 | 0.798 | [397, 24, 1398, 687] |
| 10-break-over | 1440x900 / 1440x900 | 9.653 | 6.652 | [521, 39, 1383, 631] |
| 11-summary-unlock | 1440x900 / 1440x900 | 7.956 | 7.917 | [942, 250, 1367, 705] |
| 11b-summary-unlock-settled | 1440x900 / 1440x900 | 7.339 | 0.553 | [949, 250, 1363, 705] |
| 14-summary-first | 1440x900 / 1440x900 | 39.338 | 1.759 | [29, 54, 1099, 700] |

Under 0.5 %: 01-home (0.0/0.0), 01b-home-scrolled (0.0/0.0), 04-focus-paused (0.257/0.253), 05-focus-added (0.441/0.141), 06-whistle (0.0/0.0), 07-summary (0.0/0.0), 08-summary-end (0.0/0.0), 09-break (0.0/0.0), 12-welcome (0.007/0.0), 13-first-brew (0.001/0.0)

**390x844@2-dark**: 10 of 16

| state | size fix / base | pct_strict | pct_tol | bbox |
|---|---|---|---|---|
| 01-home | 780x1688 / 780x1688 | 7.86 | 4.27 | [32, 1195, 747, 1348] |
| 01b-home-scrolled | 780x1688 / 780x1688 | 42.681 | 29.206 | [32, 0, 747, 1547] |
| 02-focus-start | 780x1688 / 780x1688 | 3.36 | 0.446 | [92, 413, 593, 1134] |
| 03-focus-mid | 780x1688 / 780x1688 | 8.563 | 4.248 | [24, 20, 754, 1585] |
| 08-summary-end | 780x1688 / 780x1688 | 0.592 | 0.0 | [65, 529, 65, 529] |
| 09-break | 780x1688 / 780x1688 | 9.568 | 0.0 | [106, 484, 366, 507] |
| 10-break-over | 780x1688 / 780x1688 | 30.152 | 22.062 | [32, 864, 747, 1568] |
| 11-summary-unlock | 780x1688 / 780x1688 | 5.19 | 1.558 | [60, 1152, 363, 1379] |
| 11b-summary-unlock-settled | 780x1688 / 780x1688 | 5.145 | 0.121 | [60, 1152, 363, 1333] |
| 13-first-brew | 780x1688 / 780x1688 | 29.906 | 8.869 | [0, 0, 776, 1134] |

Under 0.5 %: 04-focus-paused (0.248/0.236), 05-focus-added (0.0/0.0), 06-whistle (0.0/0.0), 07-summary (0.0/0.0), 12-welcome (0.0/0.0), 14-summary-first (0.0/0.0)

**375x667@2-dark**: 5 of 16

| state | size fix / base | pct_strict | pct_tol | bbox |
|---|---|---|---|---|
| 01-home | 750x1334 / 750x1334 | 10.923 | 3.476 | [32, 860, 717, 981] |
| 01b-home-scrolled | 750x1334 / 750x1334 | 47.403 | 31.589 | [32, 5, 717, 1193] |
| 03-focus-mid | 750x1334 / 750x1334 | 11.819 | 6.213 | [24, 20, 723, 1251] |
| 05-focus-added | 750x1334 / 750x1334 | 1.21 | 0.35 | [284, 366, 552, 863] |
| 10-break-over | 750x1334 / 750x1334 | 33.16 | 28.458 | [32, 646, 717, 1300] |

Under 0.5 %: 02-focus-start (0.0/0.0), 04-focus-paused (0.242/0.227), 06-whistle (0.0/0.0), 07-summary (0.0/0.0), 08-summary-end (0.0/0.0), 09-break (0.0/0.0), 11-summary-unlock (0.302/0.02), 11b-summary-unlock-settled (0.296/0.001), 12-welcome (0.0/0.0), 13-first-brew (0.0/0.0), 14-summary-first (0.0/0.0)


**What the differing pixels contain in the summary states** (I opened the `crop-<state>-fix-left-base-right.png` files in `captures-fix/<configuration>/`; left = fix, right = base; facts only, not classified):

- **390×844 light, 07 and 08** (0.416 % / 0.413 %, bbox 131×43 px; 06-whistle 0.285 % / 0.107 %, bbox 103×83 px): the tag word in the header chip reads "Study" in the fix capture and "Work" in the base capture. `capture.mjs` line 131 starts the veteran session with `tag: 'work'`. In the isolated repeat (B.5 repeats) 07 is 0.0 % / 0.0 % fix vs base.
- **390×844 light, 11 and 11b** (5.446 / 2.291 and 3.75 / 0.726): the same chip ("Study" fix, "Work" base) on the "Quarterly report" line; the unlock card's thumbnail differs slightly in its render.
- **1440×900 light, 11 and 11b** (7.956 / 7.917 and 7.339 / 0.553; bbox at the right-hand column): in 11 the unlock card's picture is the flat illustration of the record player in the fix capture and the lit 3D render in the base capture; the pill reads "Badge: Warm Days II" (fix) and "Badge: Warm Streak II" (base). 11b: the thumbnail's render differs.
- **14-summary-first** at 390 light (31.081 / 1.553) and 1440 light (39.338 / 1.759), bbox the stage: a potted plant is drawn right of the kettle and Chai in the fix capture and not in the base capture. Isolated repeats at 390 light: 14 is 0.0 % / 0.0 % fix vs base in both repeats; in the 490ca97 matrix 14 was 0.0 / 0.0 at 390 light and 75.19 / 21.434 at 1440 light.
- **390×844 dark, 11 and 11b** (5.19 / 1.558 and 5.145 / 0.121): the unlock card's thumbnail; a small glint at the lower right is in the base capture and not in the fix capture. **08**: 1 pixel (bbox `[65, 529, 65, 529]`, tolerance figure 0.0).
- **375×667**: light 11 is 0.181 % / 0.0 % (no pixel over tolerance); light 11b 13×7 px (`[92, 1046, 105, 1053]`, 0.264 / 0.002); dark 11 80×7 px (`[104, 1046, 184, 1053]`, 0.302 / 0.02); dark 11b 16×5 px (`[92, 1046, 108, 1051]`, 0.296 / 0.001). Strips at the lower edge of the unlock card's picture.
- **Identical (0 / 0)**: 07 at 375 light, 1440 light, 390 dark, 375 dark; 08 at 375 light, 1440 light, 375 dark; 14 at 375 light, 390 dark, 375 dark.

**Noise floor.** The same table of the *same code on both sides* (base preview :5480 vs base dev :5470 from Part A, same state, same configuration) is in the last column of the delta tables below: for example 390 light 03-focus-mid 11.412 / 5.323, 13-first-brew 32.572 / 0.948, 07/08 0.416 / 0.413 (the chip), 11b 5.166 / 0.693; 1440 light 11 7.888 / 7.851, 11b 7.381 / 0.26. The fix-vs-base figures for 11, 11b and 14 are of that size.


### Repeats at 390×844@2 light (same tool, fix preview and base preview, `captures-fix/repeat-390light/`)

Run 1 captured states 07, 12, 13, 14; run 2 states 12, 13, 14; fix and base alternately, one browser at a time (36 to 52 s each). Cells: strict % / tolerance-16 % / bbox.

| comparison | 07 | 12 | 13 | 14 |
|---|---|---|---|---|
| fix-1 vs base-1 | 0.0 / 0.0 | 0.0 / 0.0 | 2.991 / 0.091 [105, 415, 412, 732] | 0.0 / 0.0 |
| fix-2 vs base-2 | not captured | 0.0 / 0.0 | 0.209 / 0.131 [256, 608, 595, 1134] | 0.0 / 0.0 |
| fix-1 vs fix-2 | not captured | 0.0 / 0.0 | 3.187 / 0.277 [105, 415, 593, 1134] | 0.0 / 0.0 |
| base-1 vs base-2 | not captured | 0.0 / 0.0 | 0.3 / 0.22 [256, 608, 595, 1134] | 0.0 / 0.0 |


### Matrix delta vs the 490ca97 matrix (which states changed between the two trials)

Each cell: strict % / tolerance-16 % of (trial vs base). "490" = first trial (dev :5476 vs base dev :5470, 2026-10-13); "fix" = this run (preview :5487 vs base preview :5480). Differences of 0.3 points or more in either figure are marked `*`. The last column is the direct pixel diff fix-preview vs 490ca97-dev (same state, same configuration) and, in brackets, base-preview vs base-dev (same code on both sides: the dev/preview and run-to-run noise floor).

**390x844@2-light**

| state | 490: strict / tol | fix: strict / tol | marked | fix vs 490ca97 direct: strict / tol / bbox [base-preview vs base-dev] |
|---|---|---|---|---|
| 01-home | 7.838 / 4.427 | 7.838 / 4.427 |  | 0.0 / 0.0 / - [0.0 / 0.0] |
| 01b-home-scrolled | 43.171 / 33.605 | 43.171 / 33.605 |  | 0.0 / 0.0 / - [0.0 / 0.0] |
| 02-focus-start | 0.36 / 0.35 | 0.646 / 0.457 |  | 0.0 / 0.0 / - [0.285 / 0.107] |
| 03-focus-mid | 11.457 / 5.366 | 3.012 / 0.094 | * | 3.268 / 0.338 / [102, 449, 596, 1134] [11.412 / 5.323] |
| 04-focus-paused | 0.258 / 0.245 | 0.644 / 0.455 | * | 0.778 / 0.761 / [329, 571, 595, 1134] [0.934 / 0.736] |
| 05-focus-added | 0.548 / 0.523 | 0.446 / 0.258 |  | 0.183 / 0.166 / [296, 573, 593, 1134] [0.921 / 0.717] |
| 06-whistle | 0.0 / 0.0 | 0.285 / 0.107 |  | 0.0 / 0.0 / - [0.285 / 0.107] |
| 07-summary | 0.0 / 0.0 | 0.416 / 0.413 | * | 0.0 / 0.0 / - [0.416 / 0.413] |
| 08-summary-end | 0.0 / 0.0 | 0.416 / 0.413 | * | 0.0 / 0.0 / - [0.416 / 0.413] |
| 09-break | 0.0 / 0.0 | 0.0 / 0.0 |  | 0.0 / 0.0 / - [0.0 / 0.0] |
| 10-break-over | 30.612 / 21.992 | 30.612 / 21.992 |  | 0.0 / 0.0 / - [0.0 / 0.0] |
| 11-summary-unlock | 8.784 / 2.692 | 5.446 / 2.291 | * | 8.844 / 2.408 / [21, 283, 426, 1379] [0.755 / 0.417] |
| 11b-summary-unlock-settled | 3.895 / 0.277 | 3.75 / 0.726 | * | 4.536 / 0.324 / [60, 1152, 363, 1379] [5.166 / 0.693] |
| 12-welcome | 0.0 / 0.0 | 0.0 / 0.0 |  | 0.0 / 0.0 / - [0.0 / 0.0] |
| 13-first-brew | 30.013 / 1.043 | 3.265 / 0.36 | * | 0.324 / 0.241 / [256, 608, 596, 1133] [32.572 / 0.948] |
| 14-summary-first | 0.0 / 0.0 | 31.081 / 1.553 | * | 31.081 / 1.553 / [0, 0, 775, 633] [0.0 / 0.0] |
| 15-stats-empty | 0.094 / 0.087 | 0.094 / 0.087 |  | 0.0 / 0.0 / - [0.0 / 0.0] |
| 16-stats-populated | 0.035 / 0.032 | 0.035 / 0.032 |  | 0.0 / 0.0 / - [0.0 / 0.0] |
| 17-nook-early | 1.915 / 0.276 | 2.764 / 0.217 | * | 2.326 / 0.255 / [251, 330, 580, 625] [2.539 / 0.222] |
| 18-nook-earned | 1.321 / 0.138 | 2.1 / 0.413 | * | 64.289 / 63.126 / [97, 290, 683, 2050] [64.114 / 63.119] |
| 19-settings | 1.587 / 0.296 | 0.0 / 0.0 | * | 72.651 / 31.234 / [32, 43, 747, 8255] [72.625 / 31.205] |

**375x667@2-light**

| state | 490: strict / tol | fix: strict / tol | marked | fix vs 490ca97 direct: strict / tol / bbox [base-preview vs base-dev] |
|---|---|---|---|---|
| 01-home | 10.878 / 7.149 | 10.878 / 7.149 |  | 0.0 / 0.0 / - [0.0 / 0.0] |
| 01b-home-scrolled | 47.971 / 37.338 | 47.971 / 37.338 |  | 0.0 / 0.0 / - [0.0 / 0.0] |
| 02-focus-start | 0.0 / 0.0 | 0.0 / 0.0 |  | 0.0 / 0.0 / - [0.0 / 0.0] |
| 03-focus-mid | 0.252 / 0.231 | 0.252 / 0.231 |  | 0.252 / 0.231 / [316, 365, 552, 860] [0.252 / 0.231] |
| 04-focus-paused | 0.25 / 0.237 | 0.354 / 0.347 |  | 0.25 / 0.237 / [316, 365, 552, 864] [0.354 / 0.347] |
| 05-focus-added | 0.527 / 0.507 | 0.0 / 0.0 | * | 0.527 / 0.507 / [284, 367, 550, 864] [0.0 / 0.0] |
| 06-whistle | 0.0 / 0.0 | 1.448 / 0.018 | * | 1.448 / 0.018 / [332, 179, 600, 363] [0.0 / 0.0] |
| 07-summary | 0.0 / 0.0 | 0.0 / 0.0 |  | 0.0 / 0.0 / - [0.0 / 0.0] |
| 08-summary-end | 0.0 / 0.0 | 0.0 / 0.0 |  | 0.0 / 0.0 / - [0.0 / 0.0] |
| 09-break | 0.0 / 0.0 | 0.0 / 0.0 |  | 0.0 / 0.0 / - [0.0 / 0.0] |
| 10-break-over | 32.43 / 28.16 | 25.242 / 22.642 | * | 0.0 / 0.0 / - [10.306 / 7.13] |
| 11-summary-unlock | 5.178 / 1.46 | 0.181 / 0.0 | * | 6.46 / 1.218 / [87, 212, 396, 519] [6.385 / 2.242] |
| 11b-summary-unlock-settled | 0.012 / 0.0 | 0.264 / 0.002 |  | 0.29 / 0.001 / [76, 1046, 97, 1051] [0.276 / 0.008] |
| 12-welcome | 0.0 / 0.0 | 0.0 / 0.0 |  | 0.0 / 0.0 / - [0.0 / 0.0] |
| 13-first-brew | 0.789 / 0.338 | 27.121 / 1.495 | * | 22.879 / 0.936 / [0, 25, 621, 859] [4.976 / 0.897] |
| 14-summary-first | 0.0 / 0.0 | 0.0 / 0.0 |  | 0.0 / 0.0 / - [0.0 / 0.0] |

**1440x900@1-light**

| state | 490: strict / tol | fix: strict / tol | marked | fix vs 490ca97 direct: strict / tol / bbox [base-preview vs base-dev] |
|---|---|---|---|---|
| 01-home | 0.0 / 0.0 | 0.0 / 0.0 |  | 0.0 / 0.0 / - [0.0 / 0.0] |
| 01b-home-scrolled | 0.0 / 0.0 | 0.0 / 0.0 |  | 0.0 / 0.0 / - [0.0 / 0.0] |
| 02-focus-start | 42.781 / 2.066 | 39.804 / 2.041 | * | 0.255 / 0.248 / [373, 334, 1323, 698] [6.415 / 0.204] |
| 03-focus-mid | 0.244 / 0.233 | 2.017 / 0.798 | * | 0.243 / 0.233 / [397, 335, 1325, 674] [2.018 / 0.798] |
| 04-focus-paused | 0.552 / 0.537 | 0.257 / 0.253 |  | 0.489 / 0.473 / [397, 335, 1323, 677] [0.214 / 0.206] |
| 05-focus-added | 3.559 / 0.239 | 0.441 / 0.141 | * | 3.854 / 0.528 / [201, 335, 1325, 783] [0.717 / 0.41] |
| 06-whistle | 0.001 / 0.0 | 0.0 / 0.0 |  | 0.001 / 0.0 / - [0.0 / 0.0] |
| 07-summary | 0.001 / 0.0 | 0.0 / 0.0 |  | 0.0 / 0.0 / - [0.001 / 0.0] |
| 08-summary-end | 0.0 / 0.0 | 0.0 / 0.0 |  | 0.0 / 0.0 / - [0.0 / 0.0] |
| 09-break | 0.0 / 0.0 | 0.0 / 0.0 |  | 0.0 / 0.0 / - [0.0 / 0.0] |
| 10-break-over | 9.653 / 6.652 | 9.653 / 6.652 |  | 0.001 / 0.0 / [909, 45, 909, 46] [0.0 / 0.0] |
| 11-summary-unlock | 0.092 / 0.068 | 7.956 / 7.917 | * | 7.762 / 0.0 / [956, 681, 960, 692] [7.888 / 7.851] |
| 11b-summary-unlock-settled | 7.113 / 0.594 | 7.339 / 0.553 |  | 7.318 / 0.496 / [954, 250, 1364, 489] [7.381 / 0.26] |
| 12-welcome | 0.0 / 0.0 | 0.007 / 0.0 |  | 0.007 / 0.0 / - [0.0 / 0.0] |
| 13-first-brew | 3.337 / 0.078 | 0.001 / 0.0 | * | 3.337 / 0.078 / [201, 521, 607, 783] [0.0 / 0.0] |
| 14-summary-first | 75.19 / 21.434 | 39.338 / 1.759 | * | 38.176 / 20.607 / [143, 24, 1401, 880] [1.238 / 0.859] |

**390x844@2-dark** (dark rows of 490 are the mixed-provenance ones, see A.7)

| state | 490: strict / tol | fix: strict / tol | marked | fix vs 490ca97 direct: strict / tol / bbox [base-preview vs base-dev] |
|---|---|---|---|---|
| 01-home | 7.86 / 4.27 | 7.86 / 4.27 |  | 0.0 / 0.0 / - [0.0 / 0.0] |
| 01b-home-scrolled | 42.681 / 29.206 | 42.681 / 29.206 |  | 0.206 / 0.0 / - [0.0 / 0.0] |
| 02-focus-start | 0.0 / 0.0 | 3.36 / 0.446 | * | 3.156 / 0.238 / [92, 413, 593, 1134] [0.367 / 0.351] |
| 03-focus-mid | 12.906 / 0.254 | 8.563 / 4.248 | * | 14.088 / 0.492 / [215, 506, 595, 1134] [15.03 / 4.646] |
| 04-focus-paused | 0.0 / 0.0 | 0.248 / 0.236 |  | 0.698 / 0.681 / [329, 571, 596, 1134] [0.593 / 0.575] |
| 05-focus-added | 0.252 / 0.239 | 0.0 / 0.0 |  | 4.578 / 0.73 / [228, 573, 596, 1133] [4.543 / 0.697] |
| 06-whistle | 61.493 / 23.287 | 0.0 / 0.0 | * | 1.294 / 0.016 / [347, 379, 676, 579] [60.362 / 23.271] |
| 07-summary | 0.0 / 0.0 | 0.0 / 0.0 |  | 0.0 / 0.0 / - [0.0 / 0.0] |
| 08-summary-end | 0.0 / 0.0 | 0.592 / 0.0 | * | 0.592 / 0.0 / [65, 529, 65, 529] [0.0 / 0.0] |
| 09-break | 0.357 / 0.348 | 9.568 / 0.0 | * | 0.357 / 0.348 / [468, 1022, 546, 1134] [9.568 / 0.0] |
| 10-break-over | 30.152 / 22.062 | 30.152 / 22.062 |  | 0.0 / 0.0 / - [0.0 / 0.0] |
| 11-summary-unlock | 7.005 / 2.803 | 5.19 / 1.558 | * | 5.197 / 2.838 / [60, 1152, 363, 1379] [7.01 / 0.555] |
| 11b-summary-unlock-settled | 5.104 / 0.261 | 5.145 / 0.121 |  | 5.074 / 0.237 / [60, 1152, 363, 1331] [5.141 / 0.37] |
| 12-welcome | 0.0 / 0.0 | 0.0 / 0.0 |  | 0.0 / 0.0 / - [0.0 / 0.0] |
| 13-first-brew | 32.799 / 9.079 | 29.906 / 8.869 | * | 0.003 / 0.0 / [309, 617, 324, 697] [3.262 / 0.355] |
| 14-summary-first | 0.0 / 0.0 | 0.0 / 0.0 |  | 0.0 / 0.0 / - [0.0 / 0.0] |

**375x667@2-dark** (dark rows of 490 are the mixed-provenance ones, see A.7)

| state | 490: strict / tol | fix: strict / tol | marked | fix vs 490ca97 direct: strict / tol / bbox [base-preview vs base-dev] |
|---|---|---|---|---|
| 01-home | 11.475 / 3.476 | 10.923 / 3.476 | * | 0.685 / 0.0 / - [0.0 / 0.0] |
| 01b-home-scrolled | 47.403 / 31.589 | 47.403 / 31.589 |  | 0.0 / 0.0 / - [0.0 / 0.0] |
| 02-focus-start | 0.355 / 0.337 | 0.0 / 0.0 | * | 0.355 / 0.337 / [230, 402, 549, 860] [0.0 / 0.0] |
| 03-focus-mid | 8.445 / 0.697 | 11.819 / 6.213 | * | 11.831 / 6.205 / [24, 20, 723, 1251] [8.399 / 0.65] |
| 04-focus-paused | 0.001 / 0.001 | 0.242 / 0.227 |  | 0.583 / 0.561 / [316, 365, 550, 864] [0.592 / 0.569] |
| 05-focus-added | 0.0 / 0.0 | 1.21 / 0.35 | * | 5.948 / 0.643 / [230, 366, 552, 863] [5.402 / 0.656] |
| 06-whistle | 0.0 / 0.0 | 0.0 / 0.0 |  | 1.447 / 0.018 / [332, 179, 639, 363] [1.447 / 0.018] |
| 07-summary | 0.0 / 0.0 | 0.0 / 0.0 |  | 0.0 / 0.0 / - [0.0 / 0.0] |
| 08-summary-end | 0.0 / 0.0 | 0.0 / 0.0 |  | 0.0 / 0.0 / - [0.0 / 0.0] |
| 09-break | 0.0 / 0.0 | 0.0 / 0.0 |  | 0.0 / 0.0 / - [0.0 / 0.0] |
| 10-break-over | 33.16 / 28.458 | 33.16 / 28.458 |  | 0.0 / 0.0 / - [0.0 / 0.0] |
| 11-summary-unlock | 0.031 / 0.0 | 0.302 / 0.02 |  | 19.314 / 7.825 / [9, 87, 488, 549] [19.333 / 7.838] |
| 11b-summary-unlock-settled | 0.301 / 0.0 | 0.296 / 0.001 |  | 0.266 / 0.001 / [75, 1046, 99, 1053] [0.291 / 0.002] |
| 12-welcome | 0.0 / 0.0 | 0.0 / 0.0 |  | 0.0 / 0.0 / - [0.0 / 0.0] |
| 13-first-brew | 0.497 / 0.024 | 0.0 / 0.0 | * | 0.0 / 0.0 / [292, 418, 292, 418] [0.497 / 0.024] |
| 14-summary-first | 19.143 / 4.611 | 0.0 / 0.0 | * | 0.0 / 0.0 / - [19.143 / 4.611] |


## B.6 Failures

**None.** Every Playwright job that ran finished with 0 failed and 0 flaky; no test needed a rerun, so no trace was produced (`trace: retain-on-failure`; the output folders hold none).


## B.7 Not run, incomplete

- **Controls (base :5470) for the Playwright suites**: not run (no failure to classify, B.0).
- **Not run (time, one slot)**: `whistle.spec.ts`; the other 9 `a11y.spec.ts` tests; 24 of the 25 `notice-strip.spec.ts` configurations; the full chromium suite; any dark or other-size configuration of the notice specs. See the table in B.3 for jobs marked "not run" or "not finished".
- **Captures**: 1440×900@1 dark not run. Configurations other than 390 light have 16 states (no 15 to 19). The 21-state comparison fix vs 490ca97 for 390 light is complete; the other configurations' deltas cover the 16 states.
- Lane T's and the lead's probes ran on :5477 at the same time as my jobs; the machine was shared (load average not recorded in Part B).

## B.8 Housekeeping

- No source edits, commits or pushes. Files written outside the evidence folder: `kettle/.tmp/LR/std-freeze.mjs` in both worktrees (gitignored), `kettle/test-results/pwa-dist` in the fix worktree (by the pwa spec, gitignored), scratch and Playwright outputs under `/tmp/claude-0/lr3-*`, `/tmp/claude-0/lr4-*`.
- Nothing of mine left running at the end (checked by PID).

---

## B.9 Orchestrator note, appended after the second container restart (not Lane R's text)

A container restart at about 04:40 UTC stopped Lane R before it updated B.3. The orchestrator read the logs it left. Nothing above was changed.

- **B3-breakreach** (`logs-fix/B3-breakreach.log`) did finish before the restart: **17 passed** (5.2 min), slot freed at 04:36:44. B.3's "started, not finished" predates that.
- **C2-toast-room** (`logs-fix/C2-toast-room.log`) was running when the restart came: **6 passed, 0 failed** of 14 when it was cut.
- **C1 and C3** did not run.
- **Orchestrator follow-up runs** on the fix trial `99d9368` (:5477, re-verified after the restart), slot-gated (`--lane ORCH`), with logs in `review/ORCH/`: `w2-home.spec.ts` and `toast-room.spec.ts`, `--workers=1`. Results are in `review/ORCH/README.md`.
