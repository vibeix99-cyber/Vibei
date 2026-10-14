# RECEIPT-LR-ALL: Lane R, combined trial (Maker F + S + G + N), raw evidence

Raw evidence only. No verdict, no visual judgement. Times are UTC, 2026-10-14. This receipt is written in stages (one section per commit). A previous Lane R instance was cut by a usage limit and a container restart mid-run; its complete parts are reused (section 1), its cut parts are re-run (section 2). Resumed at 16:53; box 120 minutes, to 18:53.
No source edits, commits to app code, pushes or merges. Only my own PIDs killed (no `pkill -f`).

## 0. What was tested, and how

| | |
|---|---|
| Combined trial | `e478604` = integration + F `5ee3e7c` + S `344069c` + G `808421d` + N `4168428`, worktree `/home/user/wt/w5tr-all`, kettle/src `07c26ff`, tests `b0ed48b`. Worktree clean at resume (`git status` empty) |
| Dev / preview | dev **:5520**, preview **:5530** (serves `/tmp/rv7-servers/dist-w5tr-all`, built 12:56:57 right after the commit at 12:56:29) |
| Base | `4d36939` (kettle/src `5cd9a44`), worktree `/home/user/wt/w4-final`, dev **:5478**, preview **:5488** (`dist-w4final`, built 05:00:25) |
| Per-maker trials (for classification) | F `e3b9eac` :5521, S `c7a6b8f` :5522, G `3d91793` :5523, N `46f33e2` :5524 (all answered HTTP 200 at resume 16:53) |
| Server check at resume | `/tmp/rv7-servers/verify.sh /home/user/wt/w5tr-all 5520`: "PORT 5520 serves e478604 (src 07c26ff): VERIFIED" (5 of 5 distinguishing files equal the committed blobs). Earlier verification of the same servers: `runs/server-verify.txt` (dev: 38 of 38 changed src files match; preview :5530 bundle holds `chaiFill:3.2`, `warm days in a row`, `Warmest run`; preview :5488 holds none of them) |
| Machine | 4 CPUs, Chromium headless shell with SwiftShader (the flags in `playwright.config.ts`). Load average at resume 1.9 (the earlier part A ran under load 10 to 18) |
| Gate | every browser run through `slots.py run --lane LR --n 1`, one job at a time; each Playwright run has its own `--output` under `kettle/.tmp/LR-pw/` |
| Suite command (parts B and C) | `env KETTLE_PORT=5520 PLAYWRIGHT_JSON_OUTPUT_NAME=…/LR-pw/full-<X>.json npx playwright test --project=chromium --workers=1 --reporter=list,json --output=…/LR-pw/full-<X> <spec files>` |
| Chromium project | `npx playwright test --project=chromium --list`: **244 tests in 17 spec files** (the `chromium` project ignores `timer` and `pwa`) |

The slot gate records only the first 200 characters of a command, so the spec lists in the old log headers are cut. The lists were rebuilt from the test names inside the old logs and checked by counts: A (88) + B (86) + C (70) = 244.

| Part | Spec files | Tests |
|---|---|---|
| A | `a11y`, `break-reach`, `chai3d`, `integrity`, `notice-strip` | 11 + 17 + 10 + 25 + 25 = 88 |
| B | `statusbar`, `summary-notice`, `toast-room`, `w2-firstvisit`, `w2-home`, `w2-room`, `w2-summary` | 9 + 14 + 14 + 6 + 18 + 7 + 18 = 86 |
| C | `w3-notices-load`, `w3-notices`, `w3-settings`, `w3-stats`, `whistle` | 25 + 7 + 9 + 21 + 8 = 70 |

## 1. Reused parts (same commit `e478604`, same servers)

### 1a. Part A, complete: `runs/full-A.log`, `runs/full-A.json`

Started 13:21:27, freed 14:16:12 (54.7 min), `--workers=1`, dev :5520. **87 passed, 1 failed**, 0 flaky, 0 skipped.

| Spec file | Passed | Failed |
|---|---|---|
| `a11y.spec.ts` | 11 | 0 |
| `break-reach.spec.ts` | 17 | 0 |
| `chai3d.spec.ts` | 10 | 0 |
| `integrity.spec.ts` | 24 | **1** |
| `notice-strip.spec.ts` | 25 | 0 |

Failure: `tests/integrity.spec.ts:1017`, "I03 storage-full warning is a banner in the page (phone 390×844) › nothing over the brew; the summary says the brew is not saved, with Save backup; Today and Settings show the banner in the page, said once, kept while storage is full, gone when there is room" (36.2 s). Assertion at `integrity.spec.ts:1100`: `expect(getByRole('region', { name: /storage is full/ })).toHaveCount(0, { timeout: 6000 })`, expected 0, received 1 ("gone when there is room" step). Trace and error context are kept by Playwright at `kettle/.tmp/LR-pw/full-A/integrity-I03-storage-full-5c5d1-ull-gone-when-there-is-room-chromium/` (not copied; 3.1 MB for all of part A). Classification is in section 3.

### 1b. Timer, harness and PWA, complete: `runs/timer-pwa.log`

Started 14:39:11, freed 14:44:19 (5.1 min), `--project=timer-harness --project=timer-app --project=pwa --workers=1`, dev :5520, `KETTLE_PWA_PORT=5499`. **29 passed, 2 skipped, 0 failed, 0 flaky** (31 tests).

| Project | Passed | Skipped |
|---|---|---|
| `timer-harness` (`timer.spec.ts`) | 14 | 0 |
| `timer-app` (`timer.spec.ts`) | 12 | 2 |
| `pwa` (`pwa.spec.ts`) | 3 | 0 |

The 2 skips are in the spec itself: `timer.spec.ts:295` ("infra is exercised in the harness; screens bind their own keys") and `:439` ("render counter lives in the harness"), both `test.skip(!kettlePage.includes('harness'))`, so they run in `timer-harness` and skip in `timer-app` by design.

### 1c. Cut parts, kept as evidence of the cut

`runs/full-B-cut.log` (86 tests announced, cut at the restart, no failure line in it) and `runs/full-C-cut.log` (70 announced; cut; failures seen: `w3-notices.spec.ts:252` at 390×844 200 %, `w3-stats.spec.ts:98` "Delete this brew?" at 390×844 200 %). These two are not counted anywhere; section 2 reruns B and C completely.

## 2. Full chromium parts B and C on dev :5520, `--workers=1`

### 2a. Part B, complete: `runs/full-B.log`, `runs/full-B.json`

Started 16:54:52, freed 17:24:37 (29.7 min of test time), dev :5520, `--workers=1`, load average 6 to 15 during the run (Lanes I, I2, G and the lead were all on the machine). **86 passed, 0 failed, 0 flaky, 0 skipped** (86 of the 86 announced).

| Spec file | Passed | Failed |
|---|---|---|
| `statusbar.spec.ts` | 9 | 0 |
| `summary-notice.spec.ts` | 14 | 0 |
| `toast-room.spec.ts` | 14 | 0 |
| `w2-firstvisit.spec.ts` | 6 | 0 |
| `w2-home.spec.ts` | 18 | 0 |
| `w2-room.spec.ts` | 7 | 0 |
| `w2-summary.spec.ts` | 18 | 0 |

Facts to read these numbers by: the pre-cut run of B (`runs/full-B-cut.log`, 85 of 86 done) also had no failure. `w2-home.spec.ts` (Lane I2 saw `w2-home:203` fail at 375×667 @100 on the F trial `e3b9eac`) passed 18 of 18 here, on the combined tree. Playwright prints line numbers that do not match the files (for example `w3-notices.spec.ts:252` for a test that is on line 152 of the file; `--list` prints the same shifted numbers). Tests are therefore identified by title in this receipt.

### 2b. Part C, complete: `runs/full-C.log`, `runs/full-C.json`

Started 17:25:26, freed 17:32:07 (6.7 min), dev :5520, `--workers=1`, load average 12 to 13. **44 passed, 1 failed, 25 skipped, 0 flaky** (70 tests).

| Spec file | Passed | Failed | Skipped |
|---|---|---|---|
| `w3-notices-load.spec.ts` | 0 | 0 | **25** |
| `w3-notices.spec.ts` | 7 | 0 | 0 |
| `w3-settings.spec.ts` | 8 | **1** | 0 |
| `w3-stats.spec.ts` | 21 | 0 | 0 |
| `whistle.spec.ts` | 8 | 0 | 0 |

- The 25 skips are by design: `w3-notices-load.spec.ts:40` is `test.skip(!process.env.W3_LOAD, 'the load control: run with W3_LOAD=1')` (F's control copy of the notice-overlap test with three switches). I did not set `W3_LOAD`; those 25 did not run.
- Failure: `tests/w3-settings.spec.ts` "a pressed segment reads as pressed: unlike hover and unlike the selected one" (5.7 s). Assertion `w3-settings.spec.ts:249`: `expect(pressed).not.toBe(hover)`, received `"oklab(0.959197 0.00389533 0.0175539)"` for both (the segment's background while the mouse button is down equals its hover background). Trace: `kettle/.tmp/LR-pw/full-C/w3-settings-a-pressed-segm-82854-and-unlike-the-selected-one-chromium/` (not copied). Classification in section 3.
- The two tests that failed in the cut run of C (`w3-notices` "the room a gone notice keeps stays while the page is scrolled over it and back…" at 390×844 @200, and `w3-stats` "Delete this brew?" at 390×844 @200 "both choices can be tapped, and Tab reaches them in a loop") **passed** in this complete run. The pressed-segment test passed in the cut run and failed in this one. Both go to section 3 as "seen failing in some run".

### 2c. Union of A, B and C against the whole chromium project

`npx playwright test --project=chromium --list --reporter=json` (saved as `runs/list-chromium.json`): **244 tests in 17 spec files**. I compared the (file, title, project) multiset of the three JSON reports with it: **244 of 244 match, none missing, none extra**, and the set of 17 spec files is the same. So no spec file was missing from A+B+C and none had to be run separately.

| | Passed | Failed | Skipped | Total |
|---|---|---|---|---|
| A | 87 | 1 | 0 | 88 |
| B | 86 | 0 | 0 | 86 |
| C | 44 | 1 | 25 | 70 |
| **Union (chromium)** | **217** | **2** | **25** | **244** |
| timer-harness, timer-app, pwa (1b) | 29 | 0 | 2 | 31 |

Failures in the union: `integrity.spec.ts` "I03 storage-full warning is a banner in the page (phone 390×844) › nothing over the brew; …" (A) and `w3-settings.spec.ts` "a pressed segment reads as pressed…" (C). The 25 skips are one spec file (`w3-notices-load`, `W3_LOAD` unset); nothing else in the chromium project was skipped. The four runs were made at different times and under different load (A at load 10 to 18, B 6 to 15, C 12), not as one pass.

## 3. Every failure, rerun alone (batch 1)

Four tests were seen failing on the combined tree: two in the complete runs (`integrity` I03, `w3-settings` pressed segment) and two in the cut runs of the previous instance (`w3-notices` room, `w3-stats` Delete). Each was rerun once alone (one `playwright test -g <title>` process, `--workers=1`, own `--output`, 17:47 to 17:52, one gate slot): on the combined dev :5520, on base :5478, and on the owning maker's trial. The scripts are `scripts/LR-batch1.sh` (below) and the logs and JSON are in `rerun/<label>.{log,json}`. For base :5478 the test files are the combined tree's (the `w3-*` specs exist only on the maker branches, so they run against base code; `integrity.spec.ts` differs from base only in `profilePills`, not in the I03 tests). For a maker trial the test files are that trial's own. Machine load during these runs was lower than during the suites; I did not measure it per run (batch 2 records it).

| # | Test (spec file, owner of the file) | In the suite | Alone, combined :5520 | Alone, base :5478 | Alone, owner trial |
|---|---|---|---|---|---|
| T1 | `integrity.spec.ts` I03 "storage-full warning is a banner in the page (phone 390×844) › nothing over the brew; …" (file: **S**; feature: the save-warning banner, no maker's file, shown by F's Shell/Toast surface) | **failed** in A (`:1100`, banner still there 6 s after room was freed) | **passed** 30.3 s | **passed** 29.3 s | S :5522 **passed** 38.9 s; F :5521 **passed** 29.6 s |
| T2 | `w3-settings.spec.ts` "a pressed segment reads as pressed: unlike hover and unlike the selected one" (file and feature: **G**) | **failed** in C (`:249`, `pressed` = `hover` = `oklab(0.959197 0.00389533 0.0175539)`); passed in the cut C | **passed** 4.2 s | **failed** 4.1 s, same assertion `:249`, same value `oklab(0.959197 0.00389533 0.0175539)` | G :5523 **passed** 12.7 s |
| T3 | `w3-notices.spec.ts` "the room a gone notice keeps stays while the page is scrolled over it and back… (390×844, 200 %)" (file and feature: **F**) | failed in the cut C; **passed** in the complete C | **passed** 16.7 s | **failed** 21.5 s: `[data-notice-strip][data-room]` count 0, expected 1 ("the strip keeps its room, empty", spec line 160) | F :5521 **passed** 28.2 s |
| T4 | `w3-stats.spec.ts` "Delete this brew? at 390×844 with 200 % text › both choices can be tapped, and Tab reaches them in a loop" (file and feature: **S**, `ui/Sheet.tsx`) | failed in the cut C; **passed** in the complete C | **passed** 8.7 s | **failed** 6.8 s: first Tab focus "Keep it", expected "Delete" (spec line 118) | S :5522 **passed** 12.2 s |

What each base result is: T2, T3 and T4 are the makers' new "fails on base, passes on the fix" tests (G claims `w3-settings` 9/9 fail on base; F claims `w3-notices` fails 4/5 on base; S claims 17 of 21 `w3-stats` fail on base), so a base failure here shows the test reaches the changed behaviour, not that base has a defect. T1 is an old test and passes on base.

Mechanism candidates, from reading the test code (not proven by a run): T2 reads the segment's `inner` background 120 ms after `mouse.down()` (`w3-settings.spec.ts:244`), and `SegmentedControl.module.css:84` gives `.inner` a `background-color var(--dur-fast)` transition; if the main thread is starved the colour read still equals the hover colour that the transition starts from, which is the value the failure shows (identical to base, where no pressed colour exists). T1's last step waits 6 s for the banner to go after storage is freed (`integrity.spec.ts:1100`). Both are timing-dependent steps, and part A ran at load 10 to 18 and C at load 12.

### Classification on this evidence (before batch 2)

| # | Failed in | Alone on combined | Class (on one rerun each) | Owner |
|---|---|---|---|---|
| T1 | A of the complete suite | passed; passes on base, on S and on F trial | **not reproduced alone, so flaky or load-dependent**; no base failure, no combined-only cross-effect shown, no maker-trial failure | test file: S (`integrity.spec.ts`); surface: F (Shell/Toast) and the unowned save-warning |
| T2 | C of the complete suite | passed; passes on G trial | **not reproduced alone, so flaky or load-dependent**; not a combined-only effect (passes on combined and on G) | G (`w3-settings.spec.ts`, `SegmentedControl.module.css`) |
| T3 | cut C only | passed in the complete C and alone | **not reproduced in the complete run or alone: flaky** (one sighting in the cut run) | F (`w3-notices.spec.ts`) |
| T4 | cut C only | passed in the complete C and alone | **not reproduced in the complete run or alone: flaky** (one sighting in the cut run) | S (`w3-stats.spec.ts`, `Sheet.tsx`) |

None of the four failed on a maker trial alone; none failed alone on the combined tree. One run each cannot tell flaky from rare, so batch 2 repeats them (section 3b).

Script `scripts/LR-batch1.sh` is the exact list of eight-plus invocations (13 processes).
