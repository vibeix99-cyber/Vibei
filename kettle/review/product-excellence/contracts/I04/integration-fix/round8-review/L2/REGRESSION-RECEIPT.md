# Round 8 review, Lane 2: regression receipt (R8 `9ff0d04`)

Checks and receipts only. **No verdict.** Final (partial coverage is listed in 6; partial is never a pass).

- **Wall clock:** started 2026-10-11 18:07:24 UTC; budget to 19:22:24 UTC; ended 19:12:46 UTC (receipt finalized; within the budget).
- **Model:** Claude Opus 5.5 (`claude-opus-5-5`), newly launched; implemented nothing in rounds 7 or 8.
- **Revision under test:** R8 = trial merge `9ff0d04` (integration `61a60b2` + `pe/r8-toastroom@2c3172c`), `kettle/src` tree `42e106daaf0628ee8429fb6131ab29848931f367`. Worktree `/home/user/wt/r8-trial/kettle`, detached at `9ff0d04`, `git status` clean at start (only the untracked private `.tmp/`).
- **Comparison side:** INT `0d58c5e` (dev :5303, worktree `/home/user/wt/rv7-int/kettle`, clean).
- **Servers** (orchestrator-owned; not stopped): R8 dev :5306 (debug API), R8 preview :5326, INT dev :5303, INT preview :5323. All answered HTTP 200 at 18:08 UTC.
- **Gate:** every browser launch went through `slots.py run --lane L2`. One deviation: when I stopped the standard-capture job at 19:10:41, its two capture browsers ran on for about 10 s after the gate had freed the slots, until I killed them by PID (5.4).
- **Machine load:** LEAD and Lane 1 ran browser jobs at the same time by design; load average 7.6 to 16.8 on 4 CPUs during my runs, so wall times are inflated.

## Summary table

| Check | Result |
|---|---|
| tsc | **exit 0** |
| vitest | **27/27 files, 267/267 tests passed, 0 skipped** |
| Playwright chromium, all specs (gate `--n 2`) | **73/74 passed, 1 failed, 0 skipped, 0 flaky** (retries 0) |
| Rerun of the failing test, alone (gate `--n 1`) | **1/1 passed** (both results stand; see 3) |
| timer-harness + timer-app + pwa (gate `--n 2`) | **29/31 passed, 2 skipped (by design), 0 failed** |
| Captures (cap-d round-7/8 states, 10 configs; standard set 3 of 6 configs) | 5.1 to 5.4; flagged items in 5.3; not run in 6 |

## 1. tsc

- Command: `npx tsc --noEmit --pretty false` (cwd `/home/user/wt/r8-trial/kettle`, revision `9ff0d04`, no server).
- Ran 18:07:52 to 18:07:55 UTC, **wall 3 s**. **Exit 0**, no output. Log `logs/tsc.log`.

## 2. vitest

- Command: `npx vitest run` (cwd as above, revision `9ff0d04`, no server). vitest v5.0.2.
- Ran 18:08:01 UTC, **wall 11 s** (vitest duration 9.34 s). **Test files 27 passed (27); tests 267 passed (267); 0 skipped, 0 todo.** Exit 0. Log `logs/vitest.log`.

## 3. Playwright, chromium project, all specs

- Command (wrapper `tools/job-pw-chromium.sh`), from `/home/user/wt/r8-trial/kettle` at `9ff0d04`:
  `PLAYWRIGHT_JSON_OUTPUT_NAME=<scratch>/pw-chromium.json KETTLE_PORT=5306 KETTLE_PWA_PORT=5316 python3 -I …/round7-review/tools/slots.py run --lane L2 --n 2 -- npx playwright test --project=chromium --workers=2 --output <scratch>/pw-out-chromium --reporter=list,json`
- Server: R8 dev **:5306** (reused; `reuseExistingServer`). Gate: queued 18:07:52, slots taken 18:07:52, freed 18:23:07. **Wall 915 s (15.2 min).**
- **Result: 73 passed, 1 failed, 0 skipped, 0 flaky, of 74** (retries 0). By file: a11y 11/11, break-reach 7/7, integrity 25/25, statusbar 8/9, toast-room 14/14, whistle 8/8.
- **Failure:** `tests/statusbar.spec.ts:106` › `large text with large leaf totals never pushes "Level NN" past the screen (dark)`, failed after 7.5 s:
  `Error: page.evaluate: TypeError: Cannot read properties of null (reading 'children')` at `row (tests/statusbar.spec.ts:22:15)` called from `tests/statusbar.spec.ts:121:27`, i.e. `document.querySelector('nav[aria-label="Your progress"]')` returned null.
  - **Trace:** none. The spec sets `test.use({ trace: 'off' })` (line 17, so resizes are not slowed), so `retain-on-failure` writes no trace.zip. The only artifact is `error-context.md` (copied to `logs/chromium-fail-statusbar-106-dark.error-context.md`; original under `<scratch>/pw-out-chromium/statusbar-large-text-with--c6e57-el-NN-past-the-screen-dark--chromium/`). Its page snapshot shows the Main tab bar (Today, Stats, Nook, Settings) and an **empty `main`**: Today had not rendered its content, so the "Your progress" bar did not exist yet.
  - Which of the six (viewport × text size) contexts failed is not in the error. At 7.5 s it was an early one.
  - Fact for the lead: the test's readiness wait is `open()` in `tests/a11y-probes.mjs` (waits for `window.__kettle`, fonts, then a fixed 900 ms) plus `settle()`; it does not wait for Today's content. The spec file is unchanged by round 8 (not in the round-8 changed-file list).
- **Rerun, once, alone** (wrapper `tools/job-rerun.sh`): `KETTLE_PORT=5306 KETTLE_PWA_PORT=5316 python3 -I …/slots.py run --lane L2 --n 1 -- npx playwright test "tests/statusbar.spec.ts:106" -g "past the screen \(dark\)" --project=chromium --workers=1 --output <scratch>/pw-out-rerun --reporter=list`. Gate: queued 18:23:53, slot 18:25:08, freed 18:26:06, **wall 58 s**. **1 passed (54.5 s).** The light twin of the test passed in the full run.
- **Both results stand:** full run 73/74 with one failure; the rerun of the failing test alone 1/1.
- Logs: `logs/pw-chromium.log`, `logs/pw-chromium.json`, `logs/pw-rerun.log`.

## 4. Playwright, timer-harness + timer-app + pwa

- Command (wrapper `tools/job-pw-timer-pwa.sh`), from `/home/user/wt/r8-trial/kettle` at `9ff0d04`:
  `PLAYWRIGHT_JSON_OUTPUT_NAME=<scratch>/pw-timer-pwa.json KETTLE_PORT=5306 KETTLE_PWA_PORT=5316 python3 -I …/slots.py run --lane L2 --n 2 -- npx playwright test --project=timer-harness --project=timer-app --project=pwa --workers=2 --output <scratch>/pw-out-timer-pwa --reporter=list,json`
- Servers: R8 dev **:5306** for timer-harness/timer-app; the pwa spec builds the worktree into `test-results/pwa-dist` and runs its own `vite preview` on **:5316**. Gate: queued 18:09:37, slots taken 18:23:09, freed 18:25:08. **Wall 119 s.**
- **Result: 29 passed, 2 skipped, 0 failed, of 31**: timer-harness 14/14; timer-app 12 passed + 2 skipped; pwa 3/3.
- **Skips (both by design, `test.skip` in the spec, timer-app project only):**
  - `timer.spec.ts:294` Space toggles…: "infra is exercised in the harness; screens bind their own keys" (skip at line 295).
  - `timer.spec.ts:438` useRemaining re-renders about once per displayed second: "render counter lives in the harness" (skip at line 439).
- Logs: `logs/pw-timer-pwa.log`, `logs/pw-timer-pwa.json`.

## 5. Captures, R8 against INT, same session

### 5.0 Tooling (copied into `/home/user/wt/r8-trial/kettle/.tmp/L2/`; copies also in `L2/tools/`)

| Script | Source and sha256 of the source | What I changed in the copy | sha256 of my copy |
|---|---|---|---|
| `std-freeze.mjs` | Lane D's `std-freeze.mjs` (`.tmp/D/` and `round7-review/D/probes/` identical): `1caad7a6f2378e63b11ef8b8697fddc91aac425a78fbabe75a767354aa99eef3` | nothing (byte copy) | same |
| `cap-d.mjs` | `fbd6cab00a059a2c56ea5708e0832007c1d43a6ef25f0078934b651da462f5a8` (`.tmp/D/` = `probes/`) | `SIDES.R7` (:5301) replaced by `R8` (`http://127.0.0.1:5306`, revision `9ff0d04`, src tree `42e106d`); default sides `R8,INT`; one header comment line. INT (:5303) unchanged | `c4e67f2f15c1468e864f4f4cd89dcb791671f3e3f7ad6e4451aa11a6fe441b1c` |
| `pixdiff-node.cjs` | `d0c3c17184b7fc32f526ae3bcaaaeb8c8c76b242394dbb778af9a7fa34ca77a7` | nothing | same |
| `summarize-caps.cjs` | `fb42cc9c196140dcc22147a888fbafe80d8ed8a612db5008e4e2e3cf41358b9e` | side name R7 → R8 | `810fd788…` |
| `stdmatrix.cjs` | `20f2c0198b49ddddd164abc8e28442a430abece69ea6e3701339e848143acb75` | side name R7 → R8 | `5d47359e…` |
| `sbs.cjs` | `a8794b6d4aac82534c5f7a18a718ed5c79a1076cee4f559c547848dee6531d41` | nothing | same |
| `std-captures.sh` / `std2.sh` | `96bbb5f0…` / `22947a81…` | not used as is; replaced by `std-L2.sh` (same command per side, R8 :5306 from the R8 worktree, INT :5303 from the INT worktree, the two sides run side by side in one `--n 2` gate job) | `6b35ab94…` |
| new: `capdiff.cjs`, `r7cross.cjs`, `capjob.sh`, `job-*.sh` | mine | diff aggregation (node only), gate wrappers | in `tools/` |

- Standard tool: `review/product-excellence/tools/capture.mjs`, sha256 `aae6cc92073e342bb9a04d01fb0e9920b82296f8a051eb12a3276eb932364518`, byte-identical in the R8, R7 and INT worktrees, **unchanged**. It writes **21** states (01, 01b, 02 to 10, 11, 11b, 12 to 19). (`review/capture.mjs`, sha `3b882936…`, is the older visual-critique matrix with its own `--round` interface, identical in R8 and INT; not the 21-state tool and not used.)
- **Freeze:** cap-d: `page.clock.install({ time: 2026-10-10T16:40:00.000Z })` then `resume()` on every page, the same instant for both sides; every screenshot `animations: 'disabled'`. Standard set: the same through the preload `std-freeze.mjs` (`context.clock.install` + `resume`, screenshots default to `animations: 'disabled'`); `freeze.json` beside each output dir. Canvas/3D scene animation and the real-rate clock after the start instant are not frozen.
- **Gate:** one job, `slots.py run --lane L2 --n 2 -- .tmp/L2/capjob.sh` (two browsers at a time: the R8 side and the INT side run side by side). Queued 18:25:09, slots taken 18:35:28. cap-d 18:35:28 to 18:48:11 (12.7 min); standard set 18:48:11 to 19:10:41 (see 5.4).

### 5.1 Round-7/8 state captures (cap-d, profiles W, N, T), R8 :5306 against INT :5303

- Command per side, run at the same time: `node .tmp/L2/cap-d.mjs --profiles W,N,T --sides R8|INT --cfgs <10 configs> --root <scratch>/capd` (cwd R8 worktree).
- **10 configurations, all complete on both sides, 0 page errors:** landscape session states **844×390@2 light 200 %** and **667×375@2 light 200 %**; 390×844@2 light 200 % and 100 %; 375×667@2 light 200 %; 1440×900@1 light 200 % and 100 %; dark 200 % at 390×844@2, 375×667@2, 1440×900@1.
- States: a1 Today with storage full (a2 banner scrolled into view, R8 only, when not wholly in view); b1 Settings › Your data (b2 likewise); c1 summary note, c2 summary end; d1 to d4 break and Break's over top/bottom by real wheel (200 % only); e0 Break's over at its top with three toasts, e1/e2 Break's over wheeled to its end with three toasts (e0/e2 record toast rects); f1 focus running, f2 focus running with storage full.
- **Inventory:** 133 PNGs on R8, 122 on INT (R8 extra: a2 ×5, b2 ×6, by design; INT has no banner). Full-size images in scratch `<scratch>/capd/{R8,INT}/<cfg>/`; every `meta.json` in `L2/captures/capd-meta/`; landscape full-size e0/e1/a1/d4 (and R8 a2) in `L2/captures/landscape-full/`; side-by-side composites (R8 left, INT right) in `L2/captures/sbs/`.

**Diff R8 against INT** (percent of pixels with any channel differing by more than 2; all 133 rows in `L2/diffs/capd-diff.jsonl`: 122 compared pairs plus 11 R8-only banner states):

| State | 1440 dark t200 | 1440 light t100 | 1440 light t200 | 375×667 dark t200 | 375×667 light t200 | 390×844 dark t200 | 390×844 light t100 | 390×844 light t200 | **667×375 light t200** | **844×390 light t200** |
|---|---|---|---|---|---|---|---|---|---|---|
| a1-today-warning | 29.099 | 19.974 | 29.082 | 0 | 0 | 0 | 39.836 | 0 | 2.002 | 18.329 |
| b1-settings-your-data | 22.28 | 18.981 | 22.43 | 87.784 | 89.278 | 85.047 | 40.084 | 86.517 | 70.268 | 55.531 |
| c1-summary-note | 13.881 | 16.158 | 13.828 | 2.84 | 2.936 | 11.546 | 15.29 | 11.631 | 0 | 0 |
| c2-summary-end | 0.209 | 0 | 0.208 | 0 | 0 | 0 | 0.017 | 0 | 0 | 0 |
| d1-break-top | 0.05 | - | 0.147 | 3.155 | 3.387 | 3.491 | - | 3.875 | 1.027 | 0 |
| d2-break-bottom | 0.287 | - | 0 | 17.746 | 17.982 | 16.087 | - | 16.075 | 8.059 | 0 |
| d3-breakover-top | 0 | - | 0 | 1.531 | 2.012 | 0.011 | - | 0.038 | 1.199 | 1.3 |
| d4-breakover-bottom | 0 | - | 0 | 21.571 | 21.563 | 24.131 | - | 24.124 | 17.958 | 13.432 |
| e0-breakover-top-3toasts | 10.771 | 4.499 | 9.592 | 40.549 | 37.3 | 38.384 | 19.853 | 34.956 | 52.542 | 34.84 |
| e1-breakover-end-3toasts | 10.771 | 4.499 | 9.593 | 61.18 | 57.461 | 67.645 | 19.853 | 64.73 | 61.122 | 52.047 |
| e2-…-rects | 10.774 | 4.499 | 9.592 | 61.18 | 57.461 | 67.645 | 19.87 | 64.73 | 61.122 | 52.047 |
| f1-focus-running | 0.881 | 0.797 | 0.007 | 2.239 | 2.252 | 1.734 | 0.196 | 2.662 | 2.47 | 2.166 |
| f2-focus-running-storage-full | 0.253 | 0.253 | 0.991 | 1.868 | 2.252 | 1.738 | 0 | 78.943 | 3.379 | 2.631 |

("-" = state not taken at that text size, by design.)

**Supplement: R8 (this session) against Lane D's round-7 R7 `b39202f` captures** (same cap-d script apart from the side, same fixed instant, different session; node only; `L2/diffs/r7cross.md` / `.jsonl`). It isolates what round 8 changed, since R8 = R7 + the round-8 toast fix:
- **Every UI state is pixel-identical (0 %) to R7 in all 9 configurations Lane D also captured**, except **e1/e2 at 844×390 light 200 %: 30.407 %** (the round-8 dock; image opened, below). The only other non-zero pairs are f1/f2 (0.125 to 1.329 %; f1 at 1440 dark t200 40.667 %, where R7's 3D room had not rendered at shot time, as Lane D recorded) and d1/d2 at 1440 (0.05 to 0.238 %): the 3D scene, and the same magnitudes appear INT-against-INT across the two sessions (f1 up to 40.641 %, f2 up to 77.487 % where INT's transient warning toast was or was not on screen).
- 667×375 has no Lane D baseline (Lane D did not capture it), so round 8's change there is shown against INT only.

### 5.2 Every pair over 0.5 %, explained

Images I opened are marked (opened); the rest are explained from the bounding box plus the R8 = R7 identity above and Lane D's opened round-7 images (`round7-review/D/REGRESSION-RECEIPT.md` §5).

| State, configs | Cause | Expected? |
|---|---|---|
| a1, 1440 all and 390×844 t100 and 844×390 t200 (18.3 to 39.8 %) | R8 shows the in-page storage-full banner on Today (in view, top 44/234/16 px); INT shows no banner (and at 390 t100 its warning toast). (opened 390×844 t200, 667×375, 844×390) | **Round 7, banner** |
| a1, 667×375 light t200 (2.0 %) | R8's banner starts at 16 px in the right column **under the sticky "Put the kettle on" start block**: only its yellow top edge shows above the button; INT shows a white card edge there. (opened, and a2 opened) | **Round 7 banner, but flagged:** see 5.4 |
| b1, all (19.0 to 89.3 %) | R8's banner under "Your data" pushes the settings list down; INT shows the warning toast over the list | **Round 7, banner** |
| c1, all except landscape (2.8 to 16.2 %) | R8 has the one-line note "Not saved: storage is full. Save backup" and the summary shifts (opened at 390×844 t200); identical in landscape (note off screen) | **Round 7, note** |
| d1, 375/390/667 t200 (1.0 to 3.9 %) | R8's break control labels wrap and fit inside the panel; R8 draws the panel's bottom-edge shadow | **Round 7, break reach at 200 %** |
| d2, 375/390/667 t200 (8.1 to 18.0 %) | R8's real wheel reaches the bottom of the break panel; INT's does not | **Round 7, break reach** |
| d3, 375/667/844 (1.2 to 2.0 %) | bottom-edge shadow strip of the scrollable panel (bbox is the panel's bottom 20 px) | **Round 7, break reach** |
| d4, all t200 phones (13.4 to 24.1 %) | R8's wheel reaches "Put the kettle on" and "That's all for now"; INT's panel stays at its top (INT `main` scroll 0 of 338 at 844×390) (opened 390×844, 844×390) | **Round 7, break reach** |
| e0, portrait and desktop (4.5 to 40.5 %) | toast stack placement: R8's stack sits in the round-7 room (higher at phones, about 30 px higher at 1440), INT's lower; at phones R8's stack overlaps the panel's body copy (opened 390×844 t200 e1; R8 = R7 pixel-identical) | **Round 7, toast room below the top bar** (unchanged by round 8) |
| e0, **844×390** t200 (34.8 %) | R8's stack is not docked at the panel's top (it fits above the controls): centred, y 146 to 379 px, over the stage's right edge and the body copy "Ready for another brew of Chapter 3 notes?"; INT's stack starts at y 46 over the top bar's lower edge and the heading. R8 = R7 here (0 %). (opened) | **Round 7, toast room** (unchanged by round 8) |
| e0, **667×375** t200 (52.5 %) | R8 docks the stack in the stage column (region 12,12 303×351 px): the oldest toast is **folded** to one line ("Recipe done: Tak…", icon hidden), "Saved 12 minutes of focus" wraps to three lines (287 px wide), "Cozy level 5!" whole; the top bar, heading and body copy are uncovered. INT's stack covers the top bar ("Next: brew 2 of"), the heading and "Ready for". (opened) | **Round 8, landscape dock + fold** (maker's disclosures) |
| e1/e2, portrait and desktop (4.5 to 67.6 %) | as e0 (R8 = R7, 0 %) | **Round 7, toast room** |
| e1/e2, **844×390** t200 (52.0 %) | R8: panel wheeled to its end (`main` 338/338), all three toasts **docked whole over the stage** (x 32 to 472, y 152 to 379), Put the kettle on / That's all for now uncovered; INT: panel not scrolled, stack over the top bar and heading. **R8 against R7: 30.4 %**: on R7 the stack was pushed above the top edge (only "Cozy level 5!" partly visible) (opened both) | **Round 8, the R7-D1 fix** |
| e1/e2, **667×375** t200 (61.1 %) | R8 docked and folded as in e0 (same rects), panel at its end (353/353); INT panel not scrolled, stack over the top bar | **Round 8, dock** + round 7 reach |
| f1, phones (1.7 to 2.7 %), 1440 (0.8 to 0.9 %) | 3D scene animation phase and a one-second clock difference; bbox the scene/timer; INT-vs-INT across sessions shows the same (opened 844×390) | not a build difference |
| f2, 390×844 light t200 (78.9 %) | INT shows the storage-full warning **toast** during the session (a narrow column over the timer); R8 shows none (`warningToast` false) | **Round 7, banner** (no toast in session) |
| f2, others (0.99 to 3.4 %) | scene phase and clock; INT's transient toast not on screen at shot time | not a build difference |

### 5.3 Flagged for the lead from the cap-d set (facts, no verdict; the standard-set items are in 5.4)

1. **667×375 @200 % light, Today with storage full (a1, a2):** R8's banner (round-7 code, not touched by round 8) lies in the right column **under the sticky start block** ("Put the kettle on · 25 min", "Then a 5 min tea break.", "Change brew length"). In a1 (scroll 0, banner top 16, bottom 429 in a 375 px viewport) and in a2 (cap-d's `scrollIntoView({block:'start'})`, banner top 0) **only the banner's yellow top edge (and in a2 its icon corner) shows; its text and "Save backup" are not visible in either shot.** Not compared with R7: Lane D did not capture 667×375, and round 8 did not change the banner files, so the same is expected on `b39202f` (not verified here). At 844×390 @200 % the banner is wholly in view (top 16, R8 = R7). Composites `L2/captures/sbs/667x375-light-t200--a1-today-warning.png` and `--R8-a1-a2.png`; full size in `L2/captures/landscape-full/R8/667x375-light-t200/`.
2. **844×390 @200 %, Break's over at its top with three toasts (e0):** R8's undocked stack overlaps the body copy "Ready for another brew of Chapter 3 notes?" (identical to R7; round-7 room). The panel's controls are below the fold there, so the dock does not engage.
3. **667×375 @200 %, docked stack:** the folded oldest toast drops its icon and its tail ("+15 leaves" not shown), as the maker disclosed.

### 5.4 Standard capture set (capture.mjs, 21 states), R8 :5306 against INT :5303

- Command per side, the two sides side by side (wrapper `tools/std-L2.sh`, inside the same `--n 2` gate job as 5.1): `node --import .tmp/L2/std-freeze.mjs review/product-excellence/tools/capture.mjs --base http://127.0.0.1:5306|5303 --out <scratch>/std/{R8,INT}/<cfg> --w W --h H --dpr D --theme T`, run from the R8 worktree (meta revision `9ff0d04`) and the INT worktree (meta revision `0d58c5e`). `capture-meta.json`, `freeze.json` and `run.log` per run in `L2/captures/std-meta/`.
- **Complete (21/21 states both sides, exit 0, 0 page errors):** 390×844@2 light (18:48:11 to 18:53:06, 291/295 s), 375×667@2 light (to 18:57:20, 254/235 s), 1440×900@1 light (to 19:08:15, 655/634 s).
- **Not run:** 390×844@2 dark (started 19:08:15, **stopped by me at 19:10:41** at 14/21 states for the budget; partial images discarded from the comparison), 375×667@2 dark, 1440×900@1 dark. Dark is covered only by cap-d (5.1) at 200 % text.
- Stopping note: killing `capjob.sh` freed the gate slots at 19:10:41, but its two capture browsers (`std-L2.sh` children) ran on for about 10 s outside the gate until I killed them by PID (19:10:50). Recorded as a gate deviation.

**Diff R8 against INT** (`L2/diffs/std-matrix.md`, diff images `L2/diffs/std/`), with the same pairs **R8 against Lane D's round-7 R7** (cross-session, `L2/diffs/std-r7cross.jsonl`):

| State | 1440 light: R8/INT | R8/R7 | 375×667 light: R8/INT | R8/R7 | 390×844 light: R8/INT | R8/R7 |
|---|---|---|---|---|---|---|
| 01-home | 0 | 0 | 0 | 0 | 0 | 0 |
| 01b-home-scrolled | 0 | 0 | 0 | 0 | 0.001 | 0 |
| 02-focus-start | **25.033** | 24.718 | 0 | 0.343 | 0.357 | 0.356 |
| 03-focus-mid | 0.267 | 2.418 | 0 | 0 | 0.819 | 0 |
| 04-focus-paused | 0.3 | 0.477 | 0 | 0.354 | 0 | 0.256 |
| 05-focus-added | 0.223 | 0.786 | 0.386 | 0.386 | 0 | 0.719 |
| 06-whistle | 0 | 0 | 0.242 | 0 | 0 | 0.025 |
| 07-summary | 0 | 0 | 0 | 0 | 0.015 | 0 |
| 08-summary-end | 0 | 0 | 0.005 | 0 | 0 | 0 |
| 09-break | **8.224** | 8.155 | 0 | 0 | 0 | 0 |
| 10-break-over | 4.634 | 0 | 21.793 | 0 | 17.443 | 0 |
| 11-summary-unlock | 1.751 | 0.96 | 0.061 | 4.338 | 5.215 | 5.203 |
| 11b-summary-unlock-settled | 7.263 | 0.46 | 4.825 | 4.935 | 4.765 | 4.672 |
| 12-welcome | 0 | 0 | 0 | 0 | 0 | 0 |
| 13-first-brew | 1.018 | 0.504 | 10.468 | 1.744 | 0.506 | 0 |
| 14-summary-first | 0 | 36.544 | 0 | 0 | 0 | 0 |
| 15-stats-empty | 0 | 0 | 0 | 0 | 0 | 0.012 |
| 16-stats-populated | 0.573 | 25.138 | 0.009 | 0.009 | 0.005 | 0 |
| 17-nook-early | 0.632 | 0.917 | 0.539 | 0.603 | 0.549 | 0.576 |
| 18-nook-earned | 1.159 | 1.548 | 0.539 | 0.583 | SIZE 8156 vs 3016 | SIZE |
| 19-settings | **56.118** | 0 | 0 | 0 | 0 | 0 |

Every R8/INT pair over 0.5 %:
- **10-break-over** (4.6 / 21.8 / 17.4 %): the Break's over toast stack placement (round-7 toast room); R8 = R7 at all three (0 %); the R8/INT values equal Lane D's R7/INT values to the third decimal (4.634, 21.793, 17.443). **Round 7, expected.**
- **11, 11b, 17, 18** (0.5 to 7.3 %): 3D scene animation phase (unlock scene, nook steam/flame); 18 at 390 is the full-page height flip between runs that Lane D recorded (8156 against 3016). Not a build difference.
- **03 at 390, 13 at 390 and 1440** (0.5 to 1.0 %): one-second clock digits and scene phase.
- **13-first-brew at 375×667** (10.5 %; opened): the UI column is identical; the 3D room differs (rain/light phase in the window and wall, bbox the scene's top 211 px). Not a build difference.
- **02-focus-start at 1440** (25.0 %; opened): R8's 3D room is drawn **without its earned decorations** (string lights, shelf, plant, books, record player) at shot time; INT's has them; clock 24:58 against 24:57. R8 against Lane D's R7 is 24.7 % for the same reason. By 03 (12.5 min later in app time) the R8 room matches INT (0.267 %). Load timing of the scene's decorations on a run that took 655 s; **flagged only as unexplained-by-build, not rechecked.**
- **09-break at 1440** (8.2 %; opened): in the full run **R8's break panel was empty** (top bar only: no timer, controls or tip card); INT's showed 4:56, the controls and the tip. **Rechecked at 19:11 alone** (gate `--n 2`, `tools/recheck09.sh`: `capture.mjs --only 09` on both sides, same preload): **R8 and INT pixel-identical (0 %)**, panel complete on both (`L2/captures/std-recheck-09/`, composite `captures/sbs/std-1440-09-recheck.png`). Both results stand: the full-run image is a mid-entry frame on the loaded 655 s run.
- **19-settings at 1440** (56.1 %; opened): **INT's image is the Nook page, not Settings** (its fixed wait expired under load); R8's is Settings and equals R7 (0 %). Not comparable.
- **16 at 1440** (0.573 %): bbox the status chips at the left (11,96 to 241,303); not opened. R8/R7 25.1 % and **14 R8/R7 36.5 %**: Lane D's R7 1440 run had the summary/Stats where mine has other frames (Lane D's own INT run had the same mismatch); my R8 and INT agree (0 % at 14, 0.573 % at 16). Load-timed waits; not comparable across sessions.

## 6. Not run / partial

- **Standard set, dark:** 390×844@2 dark (stopped at 14/21 at 19:10:41, budget), 375×667@2 dark and 1440×900@1 dark not run. Dark is covered by cap-d only (390×844, 375×667, 1440×900 at 200 % text).
- **Standard set, landscape** (844×390, 667×375): not run with capture.mjs; the landscape session states were captured with cap-d at 200 % (5.1), as asked.
- **cap-d at 100 % in landscape** (where the maker disclosed that two toasts can dock): not captured.
- **667×375 against R7:** no R7 baseline in this session or in Lane D's (round 8's change there is shown against INT only).
- **std 02 at 1440** (R8 room without decorations at shot time): not rechecked.
- The chromium failure's trace: none exists (the spec turns tracing off).

## Wall clock

Started 18:07:24 UTC; receipt finalized 19:12:46 UTC (about 65 min). Model Claude Opus 5.5 (`claude-opus-5-5`). R8 worktree still clean at `9ff0d04` at the end (`git status` shows nothing outside the ignored `.tmp/`). No app code, test or maker file edited; nothing committed or pushed.
