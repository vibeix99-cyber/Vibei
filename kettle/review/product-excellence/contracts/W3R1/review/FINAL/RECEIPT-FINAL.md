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

**243 tests announced: 215 passed, 3 failed, 25 skipped, 0 flaky.** The 25 skips are `w3-notices-load.spec.ts` (gated on `W3_LOAD=1`; run separately in section 5).

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

All nine runs passed; none failed on base. Classification on this evidence (6 runs per test: the full run and the five reruns; each failure was seen once, in the 2-worker full run at load 7 to 14):

| # | Class | Owner (PLAN.md) | Signature |
|---|---|---|---|
| F1 | **Flaky** (load): 1 failure in the full run, 0 in 5 later runs, 0 on base. Not a base failure, not shown to be a product failure. The same test passed in the combined-trial part A (its one integrity failure there was I03) | test file: **S** (`tests/integrity.spec.ts`); feature: the multi-tab timer, `src/timer/**` (nobody edits it this round) | the other tab did not take the finished brew to `#/done` within the wait; `leader false, leaderMode "locks", wakes 8` |
| F2 | **Flaky**, the X-1 sighting again: 1 failure in the full run, 1 in the combined-trial part A, 0 in all reruns on this tree and base. Section 6 repeats it 10 times with a trace | test file **S** (`tests/integrity.spec.ts`, I03 unchanged by S); surface: save-warning (unowned) in F's Shell/Toast | `region /storage is full/` count 1, expected 0, 6000 ms, "gone when there is room" step |
| F3 | **Flaky**: the same test and the same step (`assertLayersDrawn`, `page.screenshot`) timed out in Lane R-N's first run on the N trial (passed on its second run); 1 failure here, 0 in 5 later runs, 0 on base | test file and feature: **N** (`tests/w2-room.spec.ts`; `src/scene/**`) | `Test timeout of 60000ms exceeded` at a `page.screenshot` under 2 workers (SwiftShader, WebGL context lost then restored) |

None was a base failure. None reproduced alone or in repeats on this tree.

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
