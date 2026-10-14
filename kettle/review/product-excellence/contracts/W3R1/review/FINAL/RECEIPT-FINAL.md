# RECEIPT-FINAL: Lane R, final regression on the merged tree, raw evidence

Raw evidence only. No verdict, no visual judgement. Times are UTC, 2026-10-14. Task received 20:19; box 120 minutes, to 22:19. Written in stages (one section per commit). `*.log` is git-ignored, so logs are saved as `.log.txt`.
No source edits, no commits to app code, no pushes. Only my own PIDs killed (no `pkill -f`).

## 0. What was tested, and how

| | |
|---|---|
| Tree | integration **`2be3de1`** (merge of F `11a7ac6`; also holds N `3faaf94`, G `25b5e26` + docs `a859d86`, S `0efca36`, X-2 `60fdb7e`), kettle/src `d533342`; worktree `/home/user/wt/w5-final` (HEAD `2be3de1`, `git status` empty at start) |
| Dev / preview | dev **:5540**, preview **:5550** (serves `/tmp/rv7-servers/dist-w5final`, built 20:18:57, after the commit at 20:17:58) |
| Base | `4d36939` (kettle/src `5cd9a44`), worktree `/home/user/wt/w4-final`; dev :5478, preview :5488 (`dist-w4final`, built 05:00:25 that day) |
| Server check | `/tmp/rv7-servers/verify.sh /home/user/wt/w5-final 5540` at 20:19: "PORT 5540 serves 2be3de1 (src d533342): VERIFIED". Preview :5550 against my own build of the tree (`kettle/.tmp/LR-final/dist-build`, section 1): the list of hashed `.js` and `.css` file names is identical (152 files in each build) and `index.html` names the same entry chunk (`assets/index-B5OJJwRN.js`), so the preview is the tree's build. All four ports answered HTTP 200 at 20:19 |
| Machine | 4 CPUs, Chromium headless shell with SwiftShader (the flags in `playwright.config.ts`). Load average at start 0.6 to 3 (the earlier combined-trial run was at 5 to 18) |
| Gate | every browser run through `slots.py run --lane LR`; the full run holds 2 slots (`--n 2`, `--workers=2`), everything else `--n 1`. Maker F held 1 slot (X-11) |
| Not in scope now | `tests/notice-strip.spec.ts` is left out of the full run (X-11 changes it; to be run on the final tree when the coordinator says so) |
| Test list | `npx playwright test --project=chromium --list --reporter=json` (saved as `runs/list-chromium.json`): **268 tests in 18 spec files**; without `notice-strip.spec.ts` (25 tests) **243 in 17 files** |

## 1. Basics (tree `2be3de1`, `kettle/`; no browser)

| Command | Result | Log |
|---|---|---|
| `npx tsc --noEmit` | exit 0, no output (3 s) | `runs/tsc.log.txt` |
| `npx vitest run` | exit 0; **32 files, 302/302 passed** (8 s) | `runs/vitest.log.txt` |
| `npx vite build --config .tmp/w2.vite.config.ts --outDir kettle/.tmp/LR-final/dist-build --emptyOutDir` (my own outDir; the same config the preview builds use) | exit 0, "precache 119 entries (3077.59 KiB)", 152 files, 11 MB | `runs/build.log.txt` |

`runs/basics-status.txt` holds the exit codes and wall times.

Resumed 22:29 after a usage limit and a container restart (about 21:00). The full run (section 2) had finished at 20:56 and is reused. After the restart: servers answered 200 on :5540, :5550, :5478, :5488; `verify.sh` printed "PORT 5540 serves 2be3de1 (src d533342): VERIFIED"; the slot gate was empty. Box after resume: 110 minutes, to about 00:20. The reruns and the notice-strip run below were run as two concurrent gate jobs (one slot each), so machine load was higher than for a single job.

## 2. The full chromium project on :5540, without `notice-strip.spec.ts`

Run 20:20:29 to 20:56:30 (36.0 min), `--project=chromium --workers=2` (gate `--n 2`), dev :5540, 17 spec files listed in `runs/full-spec-list.txt`: `runs/full.log.txt`, `runs/full.json`, `runs/list-chromium.json` (the 268-test list). Maker F held one other slot (X-11) during the first part. Load average 7 to 14 during the run (my two workers, F's job, and the dev server's own load), higher than the 2-worker figure would suggest on a quiet machine; it fell to 3 at the end.

**243 tests announced: 215 passed, 3 failed, 25 skipped, 0 flaky.** The 25 skips are `w3-notices-load.spec.ts` (gated on `W3_LOAD=1`; run separately in section 6).

| Spec file | Passed | Failed | Skipped |
|---|---|---|---|
| `a11y` | 11 | 0 | 0 |
| `break-reach` | 17 | 0 | 0 |
| `chai3d` | 10 | 0 | 0 |
| `integrity` | 23 | **2** | 0 |
| `statusbar` | 9 | 0 | 0 |
| `summary-notice` | 14 | 0 | 0 |
| `toast-room` | 14 | 0 | 0 |
| `w2-firstvisit` | 6 | 0 | 0 |
| `w2-home` | 18 | 0 | 0 |
| `w2-room` | 6 | **1** | 0 |
| `w2-summary` | 18 | 0 | 0 |
| `w3-notices-idle` | 12 | 0 | 0 |
| `w3-notices-load` | 0 | 0 | **25** |
| `w3-notices` | 9 | 0 | 0 |
| `w3-settings` | 10 | 0 | 0 |
| `w3-stats` | 30 | 0 | 0 |
| `whistle` | 8 | 0 | 0 |

So this was **not a clean pass**: three failures. Their signatures (error text from `runs/full.json`; Playwright's own trace and error context are in `kettle/.tmp/LR-pw/full/<test dir>/`, not copied):

| # | Test | Time, worker | Signature |
|---|---|---|---|
| F1 | `integrity.spec.ts` I01 "two tabs, the leading one frozen across the end: the other completes it once; the frozen one wakes up and does not add a second" (line 309 in the listing) | 20:26, worker 1, failed after 35.7 s | `timed out waiting for window.__kettle.timer.getState().status === 'idle' && location.hash === '#/done'`; page state at the time: `hash "#/"`, `timer "idle"`, `multiTab true, leader false, leaderMode "locks", leaderForMs -1, scheduler "worker", settling false, dueForMs null, wakes 8, claims true, lastClaim null` (the other tab never moved the app to the done screen in time) |
| F2 | `integrity.spec.ts` I03 "storage-full warning is a banner in the page (phone 390×844) › nothing over the brew; …gone when there is room" (line 1017) | 20:30, worker 2, failed after 45.0 s | `getByRole('region', { name: /storage is full/ })`: `toHaveCount(0)` expected 0, received 1, timeout 6000 ms (the same assertion as in the combined-trial part A, `integrity.spec.ts:1100`) |
| F3 | `w2-room.spec.ts` "Focus backdrop: earned items without the live 3D room › 3D failure (WebGL context lost): the still that takes over carries the same items" (line 167 in this run's listing, 144 in `--list`) | 20:34, worker 3, timed out at 60.9 s | `Test timeout of 60000ms exceeded`; the stack ends at `assertLayersDrawn` (`w2-room.spec.ts:78`, a `page.screenshot`), the same test and step that failed in Lane R-N's first run on the N trial |

The tests' line numbers in Playwright's output do not match the files (as in the combined-trial receipt); tests are identified by title.

## 3. The three failures, rerun alone and repeated (`scripts/LR-fb1.sh`, 22:31 to 22:38, one gate slot; `rerun/F*.{log.txt,json}`, `rerun/fb1.log.txt`)

Each test: once alone on :5540 (this tree), once alone on base :5478 (this tree's test files, base server code), then `--repeat-each=3` on :5540. One playwright process per line, `--workers=1`, own `--output`. Load at these runs 2.9 to 6.4 (a second gate job, the notice-strip run, was on the machine at the same time).

| # | Test | Alone :5540 | Alone base :5478 | 3× :5540 |
|---|---|---|---|---|
| F1 | `integrity` I01 "two tabs, the leading one frozen across the end…" | **pass** 21.8 s | **pass** 18.0 s | **3 of 3 pass** (17.7, 17.9, 17.4 s) |
| F2 | `integrity` I03 storage-full banner at 390×844 (X-1) | **pass** 26.7 s | **pass** 27.2 s | **3 of 3 pass** (26.5, 28.9, 26.5 s) |
| F3 | `w2-room` "3D failure (WebGL context lost): the still that takes over carries the same items" | **pass** 29.5 s | **pass** 34.8 s | **3 of 3 pass** (30.4, 33.6, 26.9 s) |

All nine runs passed; none failed on base. Artifacts of the three failures of the full run (copied from `kettle/.tmp/LR-pw/full/`): `rerun/fullrun-artifacts/` holds `F1-I01-trace.zip` (the test uses raw CDP tabs, so its Playwright trace has only the test's own steps, no page snapshots; no error-context was written for F1), `F2-I03-trace.zip` and `F2-I03-error-context.md`, `F3-w2room-trace.zip` and `F3-w2room-error-context.md` (the page snapshot at the timeout: the focus screen, "Kettle's on. Nice start", 24:12 left). Original paths: `.tmp/LR-pw/full/integrity-I01-session-time-17740-p-and-does-not-add-a-second-chromium/`, `.../integrity-I03-storage-full-5c5d1-ull-gone-when-there-is-room-chromium/`, `.../w2-room-Focus-backdrop-ear-6a083-over-carries-the-same-items-chromium/`.

### 3a. Reading of the failing traces

- **F3 (`w2-room`, 60.9 s):** the trace's steps show where the 60 s went: `expect(host).toHaveAttribute('data-scene-ready', 'true', { timeout: 45000 })` took **30.4 s** (spec line 149), then six `page.screenshot` calls took 0.6 to 2.8 s each (about 11 s in all), and the seventh was cut by the test timeout. The same test passes alone in 27 to 35 s. So the budget went to the 3D scene taking 30 s to become ready on SwiftShader with two workers running.
- **F1 (`integrity` I01, 35.7 s):** the trace has only the hook steps (the test drives raw Chromium tabs over CDP), so it shows nothing of the two tabs. Its assertion output is the signature in section 2: the *other* tab, 30 s after the brew started, had `status idle` at `#/` with `leader false`, so it never reached `#/done`.
- **F2 (`integrity` I03):** `toHaveCount(0)` on the banner failed after its 6 s limit; the 10-run trace table in section 7 gives the same step's usual duration (0.1 to 2.9 s).

### 3b. The same three tests under load (`scripts/LR-stress.sh`, 23:52 to 23:58, `rerun/stress.{log.txt,json}`, `rerun/stress-run.log.txt`)

To see whether the failures follow load: `--workers=2` (as in the full run, gate `--n 2`) plus four CPU burners (my own PIDs, stopped after), `--repeat-each=6 --trace=on` over the three tests (18 runs). Load average 4.5 at the start and 11.6 at the end.

| Test | Result under load | Time per run |
|---|---|---|
| F1 `integrity` I01 two tabs, frozen leader | **5 passed, 1 failed** (the first run of the batch, 35.4 s) | 19.4 to 20.7 s when it passed (17.4 to 21.8 s unloaded) |
| F2 `integrity` I03 banner (X-1) | **6 of 6 passed** | 30.2 to 32.4 s (26.5 to 29 s unloaded) |
| F3 `w2-room` WebGL lost | **6 of 6 passed** | **41.4 to 47.4 s** (26.9 to 34.8 s unloaded; the limit is 60 s) |

The F1 failure under load: `Error: timed out waiting for window.__kettle.timer.getState().sessionId === "s_mv8rme7s5b5f0835"` (page: `hash "#/"`, `timer "idle"`, `multiTab true`, `leader true`, `leaderMode "locks"`, `leaderForMs 31415`, `wakes 6`). That is a different step from the one in the full run: here the **leader** tab never saw the session that the other tab started, within 30 s (trace `rerun/fullrun-artifacts/F1-stress-failing-run-trace.zip`; again only test steps in it). In the full run the failing wait was the other tab's wait for completion and `#/done`.

### 3c. Classification (Vibei's standard: flaky only if the reruns show it, with the signature explained)

| # | Reruns | Signature explained? | Class | Owner (PLAN.md) |
|---|---|---|---|---|
| **F3** `w2-room` WebGL context lost | alone :5540 pass; alone base pass; 3× :5540 pass; under load 6 of 6 pass | **Yes, as a load timeout:** the failing run spent 30.4 s of its 60 s waiting for the scene to be ready (trace), screenshots 1 to 3 s each; under load the same test takes 41 to 47 s against 27 to 35 s unloaded. Not reproduced as a failure in my 18 later runs (its margin under load is 13 to 19 s). The same test and step timed out in Lane R-N's first run on the N trial. A known environment limit (SwiftShader, 2 workers) | **Flaky (load, test timeout).** Not a product failure shown; the margin under load is thin | test file and feature **N** (`tests/w2-room.spec.ts`, `src/scene/**`; the test is N-owned by PLAN.md) |
| **F1** `integrity` I01 two tabs, frozen leader | alone :5540 pass; alone base pass; 3× :5540 pass; under load **1 of 6 failed** | **Partly.** The failure follows load (1 in the full run at load 7 to 14, 1 in 6 under burners, 0 in 8 unloaded or lightly loaded runs), and both failures are 30 s timeouts of a cross-tab wait; but the failing step differs between the two (the other tab never completed, in the full run; the leader never saw the session, under load), and I did not determine whether the cause is the test (it fixes an 800 ms wait for the leader election between two freshly opened tabs, then starts a brew in the tab it believes is the follower) or the app's cross-tab hand-off being slow under load | **Not cleared as flaky: record as an open finding.** Load-sensitive, reproduced, mechanism not determined, product versus test unresolved | test file **S** (`tests/integrity.spec.ts`); feature: multi-tab timer leadership, `src/timer/**` (**unowned this round**) |
| **F2** `integrity` I03 banner (X-1) | alone :5540 pass; alone base pass; 3× pass; 10× with trace pass (section 7); under load 6 of 6 pass | **Only from the code, not from a failing trace:** the banner leaves at a 2 s recovery tick (`RECOVERY_CHECK_MS = 2000`, `saveWarning.ts`); the step took 0.1 to 2.9 s in 10 traces against the 6 s limit. Two failures were seen (combined-trial part A and this full run), both in loaded multi-job runs; none in 20 later runs | **Intermittent, load-associated, not reproduced**; I cannot call the mechanism shown. Keep as X-1 "not isolated" | test file **S**; surface: the save-warning (`src/app/saveWarning.ts`, unowned) |

None was a base failure (all pass on base alone). None failed alone or in the 3× repeats on :5540.

## 4. `notice-strip.spec.ts`, the whole file once on :5540 (X-11 withdrawn, so the final tree is `2be3de1`)

`runs/notice-strip.log.txt`, `runs/notice-strip.json`. Started 22:31:30, freed 22:56:28 (25.0 min), `--project=chromium --workers=1`, one gate slot; a second gate job (the failure reruns, then timer/pwa and the `W3_LOAD` run) was on the machine meanwhile.

**25 passed, 0 failed, 0 flaky, 0 skipped.** All 25 cases are the one test at line 292 "no notice overlaps a control, text or a row: every notice state, real input" in its 25 configurations (the listing's line number; durations 51.7 to 70.1 s). The known flaky case **1440×900 light 200 % reduced motion passed** (55.3 s). Nothing needed classifying against the three X-11 signatures.

## 5. Timer-harness, timer-app and pwa projects

`runs/timer-pwa.log.txt`, `runs/timer-pwa.json`. Started 22:38:34, freed 22:41:30 (2.9 min), `KETTLE_PORT=5540 KETTLE_PWA_PORT=5499 npx playwright test --project=timer-harness --project=timer-app --project=pwa --workers=1`, one gate slot (a second job, the notice-strip run, was on the machine).

**29 passed, 2 skipped, 0 failed, 0 flaky** (31 tests): `timer-harness` 14 passed; `timer-app` 12 passed, 2 skipped; `pwa` 3 passed. The 2 skips are by design in `tests/timer.spec.ts`: line 295 ("infra is exercised in the harness; screens bind their own keys") and line 439 ("render counter lives in the harness"), both `test.skip(!kettlePage.includes('harness'))`, so they run in `timer-harness` and skip in `timer-app`. Same result as on the combined trial `e478604` (29 passed, 2 skipped).

## 6. `w3-notices-load.spec.ts` with `W3_LOAD=1`, once on :5540 (the load control, normally skipped)

`runs/w3-notices-load.log.txt`, `runs/w3-notices-load.json`. `W3_LOAD=1 KETTLE_PORT=5540 npx playwright test tests/w3-notices-load.spec.ts --project=chromium --workers=1`, 22:41:31 to 23:06:56 (25.4 min), one gate slot, load 5 to 8. The spec is F's copy of the notice-strip spec "with three switches" (its header), CPU throttle off by default (`CPU` and `REP` unset).

**25 tests: 23 passed, 2 failed.** The two failures are the same case at two sizes: "no notice overlaps a control, text or a row: every notice state, real input (**390×844 light 200 % reduced motion**) #0" (15.3 s) and "(**375×667 light 200 % reduced motion**) #0" (16.1 s). Both: `Error: waiting with all its time`, `expect(received).toEqual(expected)` at `tests/w3-notices-load.spec.ts` (the listing says line 374), expected `[4000]`, received `[300, 4000]`: on the summary, where the strip is not drawn, `__kettle.notices().queue.map(q => q.left)` holds a second notice with 300 ms left besides the one with its full 4000 ms.

Rerun alone (`scripts/LR-lg.sh`, 23:11 to 23:14, `rerun/L*.{log.txt,json}`; the `playwright-exit` field printed in `rerun/lg.log.txt` is not reliable, the JSON is):

| Case | Alone :5540 | Alone base :5478 | 3× :5540 |
|---|---|---|---|
| 390×844 light 200 % reduced motion | **fail** (16.0 s), same assertion and value | **fail** (14.7 s), same | **3 of 3 fail** (16.0, 16.4, 16.1 s), same |
| 375×667 light 200 % reduced motion | **fail** (16.4 s), same | **fail** (17.2 s), same | not repeated |

Classification: **deterministic, and a base failure**: the two cases fail identically on base 4d36939 (2 of 2) and on this tree (5 of 5 runs). It is not a regression of the tree and not flaky. Owner by PLAN.md: **F** (`tests/w3-notices-load.spec.ts`, F's control copy). The same assertion exists in the maintained `tests/notice-strip.spec.ts` (line 380), where both configurations pass (section 4: 25 of 25), so the two files' flows differ at the step before it; I did not find out how (the load copy was last changed in `53775c0`, the maintained spec in `1130a13`).

## 7. X-1: `integrity.spec.ts` I03 (storage-full banner, phone 390×844), `--repeat-each=10 --trace=on`, :5540

`x1/x1-i03-x10.log.txt`, `x1/x1-i03-x10.json`; command `KETTLE_PORT=5540 npx playwright test tests/integrity.spec.ts --project=chromium --workers=1 --repeat-each=10 --trace=on -g 'I03 storage-full warning is a banner in the page \(phone 390×844\) nothing over the brew'`, one gate slot, 23:06:55 to 23:11:55 (5.0 min; 26.8 to 30.0 s per run), load average 5 to 6 (a capture job and the load-control reruns were on the machine).

**10 of 10 passed**, 0 failed, 0 flaky. There is no failing run to open a trace for. What the 10 traces show about the step that failed twice before ("gone when there is room", `integrity.spec.ts:1100`, `toHaveCount(0)` within 6000 ms): I read each trace's before/after events for that expect (`x1/banner-step-ms.txt`). The step took **113, 370, 373, 874, 1878, 1878, 1881, 1887, 1888 and 2881 ms** (median about 1.88 s) of the 6000 ms allowed. The times cluster at about 0.1 to 0.9 s, at about 1.9 s (four runs) and at 2.9 s. Traces kept: the slowest (`x1/trace-repeat6-slowest-banner-step.zip`) and the fastest (`x1/trace-repeat8-fastest-banner-step.zip`).

What the code does at that step (read, not run): the test frees the filler keys and calls `setState({})` on the timer, progress and settings stores; the banner (`src/app/saveWarning.ts`) is removed by `checkRecovered`, which runs on a `setInterval` of `RECOVERY_CHECK_MS = 2000` ms and only clears the warning when no failed key still reports `lastWriteFailed`. So the banner can go only at a 2-second tick that comes after the write succeeded; the observed 2.9 s case is a tick that came before the write had landed, followed by the next one. The margin is 6000 ms against about 0.1 to 2.9 s here. **I did not see a failing run on this tree under 10 repeats, so what happened in the two earlier failures (the combined-trial part A at 20:30-type load, and this tree's full run at 2 workers, load 7 to 14) is not shown by a trace.** Of the two explanations the question names, "a write still failing" would show as the banner outlasting every tick, "a timing issue" as the tick or the write arriving late under load; the 10 runs show tick-quantised times, which is consistent with the second, but a failing trace was not obtained.

## 8. X-7: where the Settings blocks sit, :5550 against base :5488, 390×844@2, dark and light

`scripts/LR-x7.mjs` (one gate slot, 22:56 to 22:57), dump `x7/x7-dump.json`, tables `x7/x7-section-tops.md`. For each of dark and light, for each of two ways of getting there (a direct load of `#/settings`, and `Home` then `navigate('/settings')`), two repetitions per side: frozen clock `2026-10-12T07:40:00Z`, `?debug&seed=veteran`, `nooktime=day` in light, fonts ready, the leaving screen gone (`[data-route-leaving]` absent) and 600 ms more. The script records the document y of every block of `main` down to depth 7 (75 blocks), the shell blocks above 140 px, and the notice strip. The two repetitions gave identical numbers in all 8 cells.

**Result (identical in dark and light, direct and via Home, base then final):**

| Block | base y | final y | shift |
|---|---|---|---|
| h1 "Settings" | 16 | 16 | 0 |
| Profile card | 77 | 77 | 0 |
| Rhythm | 279 | 279 | 0 |
| Auto-start | 732.3 | 732.3 | 0 |
| Daily goal | 950.06 | 950.06 | 0 |
| Sound | 1200.86 | 1200.86 | 0 |
| Notifications & device | 1868.64 | 1868.64 | 0 |
| **Appearance** | 2264.41 | 2281.39 | **+16.98** |
| Your data | 2729.2 | 2746.19 | +16.99 |
| Keyboard shortcuts | 3016.17 | 3033.16 | +16.99 |
| About | 3430.47 | 3447.45 | +16.98 |
| document height | 4150 | 4167 | +17 |

- **Above the Haptics row nothing moves:** the largest shift of any of the first 47 blocks (everything from the heading down to the row above Haptics) is **0.00 px** in all 8 cells. The first screen is where it was on base.
- **The one change:** the Haptics row (in "Notifications & device") is **64 px high on base and 80.98 px on the final tree** (+16.98), and every block after it moves by that amount. No other block changes height.
- **Cause:** G's copy in `src/screens/settings/SettingsScreen.tsx` (a diff against base): the Haptics description goes from "Little buzzes for key moments." to "Little buzzes for key moments, on devices that can vibrate." and now wraps to a second line. The same diff changes the Daily goal footer, the Sounds and Nudges lines and the Keep-awake line, but none of those changes a block height here. G's tokens in `src/styles/{tokens,global}.css` and the `src/ui/*.module.css` files change outlines, opacities and an outline offset only (diff read), and no block above the Haptics row moved.
- **F's strip is not involved:** the notice strip is at y 16 with height 0 on both sides in all cells (no room kept).
- **The "about 2 px lower in dark at 390" of the combined matrix:** it is not a layout difference of the tree. I measured the old frames (`LR/ALL/cap/390x844@2-dark/{ctrl,trial}-19-settings.png`, combined trial `e478604`, full-page frames) by sliding the trial frame over the base frame in 200 px bands of the first 1700 device px: in dark the best match is a rigid shift of **3 device px (1.5 css px)** in every band, with an error of 0.01 to 0.06 (grey levels) after the shift, against 3 to 9 without it; so the two frames hold the same pixels, one moved down by 3 device px as a whole. In the light solo pair (`LR/ALL/cap/390x844@2-light-solo`) the best shift is 0 in every band with error 0.0. A uniform shift of the whole page in one capture of a sequence is what a screen caught mid-transition looks like (that frame was taken without waiting for the route change); it is consistent with, but I did not prove, that cause. `scripts/LR-shift.py` is the script. On the final tree, with the route settled, the first screen has no shift in dark or light.

## 9. Capture matrix, preview :5550 (final `2be3de1`) against preview :5488 (base `4d36939`), with a base-vs-base control

Tool `review/product-excellence/tools/capture.mjs` (21 states), `scripts/LR-capF.sh`: per config, **trial, base, base again** (`ctrl2`), one browser at a time through the gate (two jobs side by side, one slot each, machine load 4 to 9). Same frozen start clock `2026-10-12T07:40:00Z` on all three, from the preload `scripts/LR-freeze2.mjs`, which is last time's freeze preload plus two waits before every screenshot: no `[data-route-leaving]` element in the page (up to 25 s) and `document.fonts.ready`. `capture-meta.json`: revision `2be3de1` for the trial, `4d36939` for both base runs, 0 page errors (per side in `cap/<config>/*-capture-meta.json`; start times, wall times and loads in `*-freeze.json`).

Pair diff (`pdiff.py`, `scripts/LR-pdiffF.py`): strict = any channel differs, tol = a channel differs by more than 16. **Over 0.5 %** = strict or tol above 0.5 for trial against base. **Over noise** (my rule, stated here): over 0.5 % and (tol above the base-vs-base tol + 0.25, or strict above the base-vs-base strict + 0.5, or a size difference that the base pair does not have). Tables: `cap/matrix-<config>.md`, `cap/<config>/pairs.json`; the numbers in the cells below are strict / tol, trial against base, then base against base.

| Config | Trial run (UTC) | Pairs over 0.5 % | Over noise |
|---|---|---|---|
| 390×844@2 light | 23:20, 366 s | 7 of 21 | 6 |
| 390×844@2 dark | 23:38, 362 s | 10 of 21 | 8 |
| 375×667@2 light | 23:03, 338 s | 7 of 21 | 5 |
| 1440×900@1 light | 23:24, 573 s | 9 of 21 | 3 |

**What the control shows (noise floor, base against base):** most states are exactly 0.0 (Today, summary, break, welcome, first summary, and most focus states). Noise appears as: the unlock card art (11, 11b: up to 7.5 % strict at 1440 and 5 % at 390 dark), the focus session's chrome caught mid-fade (`03` at 390 light: **8.56 / 5.38 base against base**, while the trial against base was 0.0 there, and 8.57 / 4.24 trial against base in dark with 0.0 base against base: it appears in any one of three captures), the first-brew scene (`13`: 30.0 / 1.04 base against base at 390 light), a whistle glow (`06`), the Nook scene's idle motion (`17`, `18`: 1.3 to 2.9 % strict, tol 0.1 to 0.4), and, in the sequence run, the page height of `18` and `17`, where the base frames kept a leaving layer's height (8122 and 3238/3272 px against the trial's 3016 and 2912/2844 px, in both base captures). So the earlier combined-trial list had a floor now measured.

### 9a. Pairs over noise, with the owner

| Config | State | Strict / tol (trial vs base; base vs base) | What it is | Owner |
|---|---|---|---|---|
| 390 L | 15 stats-empty | 0.57 / 0.52; 0.0 / 0.0 | wording: "Your warm days, charts and badges…", tiles "Days warm" / "Warmest run" (opened in the earlier matrix, same numbers: 0.573 / 0.521) | **S** |
| 390 L | 16 stats-populated | 41.3 / 34.5; 0.0 / 0.0 (size 8736 vs 8354) | the Today / Last 7 days card above the tiles; +191 css px | **S** |
| 390 L | 19 settings | 13.2 / 10.4; 0.0 / 0.0 (size 8290 vs 8256) | the copy changes and the Haptics line (+17 css px), no shift above it (section 8) | **G** |
| 390 L | 11 summary-unlock | 4.84 / 0.11; 2.85 / 0.04 | the unlock card's picture; text and layout 0 | none (noise-sized, no maker) |
| 390 L | 17 nook-early | 2.38 / 0.27; 1.41 / 0.22 | scene idle motion (light: forced day) | none shown |
| 390 L | 18 nook-earned | 64.3 / 63.0 (sizes 3016 vs 8122); 1.3 / 0.14 | page height only: the base frames keep a leaving layer (twice). The solo re-capture (below) has equal sizes and 3.75 / 0.37 vs 2.23 / 0.43 | artifact |
| 390 D | 03 focus-mid | 8.57 / 4.24; 0.0 / 0.0 | the session chrome caught mid-fade; the same pattern fell on the base-vs-base pair at 390 light | artifact (capture timing) |
| 390 D | 05 focus-added | 0.74 / 0.67; 1.07 / 0.36 | timer box | noise |
| 390 D | **13 first-brew** | **29.9 / 8.87; 0.0 / 0.0** | **the same numbers as in the earlier combined matrix (29.906 / 8.869) and 0.0 base against base: a repeatable difference** in the backdrop room image (window, curtains, wall; opened: the red area of the diff is the room behind the kettle and Chai, not Chai). N's code change is Chai's fur emissive only (diff read), so the cause is **not isolated**. The same state in light is 0.0 | scene area (N), **unproven** |
| 390 D | 15, 16, 19 | 0.58 / 0.52; 41.3 / 32.7; 13.2 / 10.3 | as at 390 light (S, S, G) | **S, S, G** |
| 390 D | 17, 18 | 13.3 / 10.5 (sizes 2912 vs 3238); 2.9 / 0.33 and 64.8 / 63.1 (3016 vs 8122) | Nook at night; sizes are the sequence artifact; not opened | scene (N) area, not separable |
| 375 L | 13 first-brew | 22.5 / 0.66; 0.0 / 0.0 | tint-level (tol 0.66); not opened | scene, not isolated |
| 375 L | 15 stats-empty | 22.2 / 16.8 (size 3540 vs 3504); 0.0 / 0.0 | wording and 18 css px taller tiles (as in the earlier matrix) | **S** |
| 375 L | 16 stats-populated | 42.3 / 35.4 (8772 vs 8354); 0.0 / 0.0 | Today / Last 7 days card, +209 css px | **S** |
| 375 L | 17 nook-early | 15.4 / 13.3 (2844 vs 3272); 1.7 / 0.25 | content opened and identical; the base frames have blank page height at the bottom (both captures) | artifact |
| 375 L | 19 settings | 13.5 / 10.4 (8474 vs 8434); 0.0 / 0.0 | copy and Haptics line, +40 px | **G** |
| 1440 L | 02 focus-start | 3.31 / 0.07; 0.0 / 0.0 | tint-level (tol 0.07), whole of the timer/scene box; not opened | not isolated |
| 1440 L | 11b | 7.07 / 0.66; 7.20 / 0.33 | unlock card picture | noise |
| 1440 L | 16 stats-populated | 28.8 / 24.3 (3091 vs 2913); 0.02 / 0.0 | the Today / Last 7 days card (base frame is Stats this time) | **S** |

Not over noise but over 0.5 % at 1440: `13` (0.575 / 0.463, base against base 0.557 / 0.475), `14 summary-first` (68.3 / 10.4 in all three: one base capture is the odd one), `17`, `18`, and **`19 settings` 1.05 / 0.84 against base-vs-base 0.85 / 0.71**: the copy changes of Settings are of the size of the noise at 1440 and my rule does not separate them.

**Solo re-capture at 390×844 light** (`scripts/LR-capsoloF.sh`: 16 to 19 each alone in its own page, trial and base twice): 16: 41.3 / 34.5 (size 8736 vs 8354, base twice the same); 17: 0.95 / 0.15 against 1.85 / 0.10 (noise); 18: 3.75 / 0.37 against 2.23 / 0.43 (equal sizes, noise); 19: 13.2 / 10.35 (8334 vs 8300, base twice the same).

### 9b. Today, summary, Stats, Settings (as in the earlier matrix)

- **Today** (`01`, `01b`): 0.0 at all four configs, trial against base. **Summary** (`07`, `08`, `09`, `10`, `14`): 0.0 at all four configs, except 1440 `14` (68.3 in all three captures, noise) and the unlock card (noise).
- **Focus** (`02`, `04`, `05`): 0.0 trial against base at 390 light and 375 light (at 390 dark and 1440 small differences at noise level, `02` at 1440 tint-level); the 375 "Paused" pill (X-8) was 0.0 at `04`.
- **Stats:** S's Today / Last 7 days card and warm-days wording, at all four configs. **Settings:** G's copy and the Haptics line, a +17 px page height and no shift above the Haptics row.
- **Chai at night (N):** the dark first-brew frame differs in the backdrop (above); the dark Nook frames differ at a size mixed with the sequence artifact. N's still-frame receipts remain the measure of Chai itself.
