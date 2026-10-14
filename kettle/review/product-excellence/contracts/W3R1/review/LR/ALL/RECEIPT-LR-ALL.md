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

Script `scripts/LR-batch1.sh` is the exact list: 13 separate playwright processes (4 on the combined dev server, 4 on base, 5 on maker trials). Its `exit=` field in `rerun/batch1.log` is the exit of the `git rev-parse` in the same line, not of playwright (my script's error); the results are in each `rerun/<label>.log` and `.json`.

## 4. The standard capture matrix, preview :5530 (trial `e478604`) against preview :5488 (base `4d36939`)

Tool: `review/product-excellence/tools/capture.mjs` (21 states, debug seeds), run by `scripts/LR-cap.sh` through the gate, trial first, then base, one browser at a time. Both sides get the same frozen start clock `2026-10-12T07:40:00Z` (`clock.install` + `resume`, from the preload `LR/std-freeze.mjs` copied from Lane D; every screenshot is taken with `animations: 'disabled'`). `capture-meta.json` per side (in `cap/<config>/{trial,ctrl}-capture-meta.json`): revision `e478604` on the trial and `4d36939` on the base, 0 page errors on all 8 runs. Pair diff: `pdiff.py` (strict = any channel differs; tol = a channel differs by more than 16; a size mismatch counts the unmatched area as differing; "over 0.5 %" = strict or tol above 0.5). Per-config tables: `cap/matrix-main.md`, `cap/pdiff-all-main.json`, `cap/<config>/pdiff.json`. Over-threshold pairs are kept as `trial-*.png`, `ctrl-*.png` (base) and `*-diff.png`; for pairs that are only live clocks or animation I deleted the two raw frames and kept the diff image (size budget).

| Config | Trial run (UTC) | Base run (UTC) | Pairs over 0.5 % |
|---|---|---|---|
| 390×844@2 light | 17:53:09, 264 s | 17:57:33, 391 s | 10 of 21 |
| 390×844@2 dark | 18:04:04, 253 s | 18:08:17, 167 s | 10 of 21 |
| 375×667@2 light | 18:11:09, 152 s | 18:13:42, 137 s | 8 of 21 |
| 1440×900@1 light | 18:18:55, 501 s | 18:27:16, 461 s | 8 of 21 |

The trial side of each config was always captured 2 to 9 minutes before the base side, under different machine load, so live clocks, the 3D scene's idle motion and route cross-fades differ between sides for that reason alone. Every capture was run under the gate, one at a time. The Nook in light is forced to `nooktime=day` by the tool; in dark it follows the clock (the dark Nook frames show night lighting).

**Two defects of the capture sequence, found when opening frames (not product differences).** The tool takes 15 → 17 and 16 → 18 → 19 in one page, so a full-page frame can still contain the screen being left. (a) In the 390×844 light and dark and 375×667 runs the base `19-settings` frame shows the **Nook**, not Settings (`ctrl-19-settings.png`, route says `#/settings`), and in the 1440 run the base `16-stats-populated` frame shows **Today**. (b) Page heights of 16/18 differ by the leaving Stats layer (for example 8504 vs 8122 px). I re-captured 16, 17, 18 and 19 each alone in its own page at 390×844 light (`scripts/LR-capsolo.sh`, tag `390x844@2-light-solo`, `cap/390x844@2-light-solo/`): 17 and 18 then have equal sizes on both sides; 16 and 19 differ in size for real reasons (below). The solo re-capture was done for 390×844 light only.

### 4a. Pairs over 0.5 %, with what is in them and the owning maker's area

Cells: strict % / tol %. "Opened" = I looked at the frames. "Box only" = I judged from the diff box and its place on the screen, without opening the frames.

| Config | State | Strict / tol | What is in the difference | Area (maker) |
|---|---|---|---|---|
| 390 L | 03 focus-mid | 11.56 / 5.47 | Opened: the trial frame has the top chips, the three control labels and the brew dots faded (mid-fade of the session chrome) where the base shows them solid; clocks read 12:22 vs 12:24. Not isolated: same signature at 375 L (11.82 / 7.71); absent in dark (0.26) and at 1440 (0.00). A repeat run is in section 4c if it finished | Focus screen (F), unproven that it is F's change |
| 390 L | 05 focus-added | 0.73 / 0.71 | Opened: only the countdown digits (17:21 vs 17:18) | live clock; Focus (F) unchanged otherwise |
| 390 L | 11, 11b summary-unlock | 4.43 / 0.37, 4.66 / 0.30 | Opened (11): the unlock card's picture (sparkles and 3D render) only; text, buttons and layout identical | no maker (Done/Summary untouched); not N (no Chai in the card, as Lane R-N found) |
| 390 L | 13 first-brew | 30.01 / 1.04 | Opened: countdown digit (14:59 vs 14:58) and idle motion of the scene (window, curtains) | live clock / scene idle motion |
| 390 L | 15 stats-empty | 0.57 / 0.52 | Opened: wording. "Your streak, charts and badges…" becomes "Your warm days, charts and badges…"; tiles "Day streak / Best streak" become "Days warm / Warmest run" with a small "days" unit on the second | **S** |
| 390 L | 16 stats-populated | 41.3 / 34.5 (size 8736 vs 8354) | Opened. New **Today / Last 7 days** card above the tiles ("Today Mon, Oct 12, 50 min focused, 2 full brews, 50 min of your 1h goal" and "Last 7 days Oct 6–12, 4h 35m focused, Brewed on 7 of 7 days, 1 day at goal"); tiles "Day streak/Best streak" → "Days warm" / "23 days Warmest run"; the page is 191 css px taller. The solo re-capture gives the same numbers | **S** |
| 390 L | 17 nook-early | 1.61 / 0.21 | Box only: inside the Nook canvas. Solo re-capture 1.64 / 0.21, equal size | scene (N area); at `nooktime=day`. Not isolated (N's own day check found 0 px on a still frame, this capture is animated) |
| 390 L | 18 nook-earned | 5.37 / 4.61 (size 8504 vs 8122) | Opened: same content on both sides; the size is the leaving Stats layer. Solo re-capture: equal size, 1.84 / 0.30 | none (artifact) / scene idle motion |
| 390 L | 19 settings | 73.4 / 31.8 | Base frame is the **Nook** (artifact). Solo re-capture (both sides Settings): 13.2 / 10.3, size +34 px (+17 css px). Opened: Daily goal footer "Your warm streak only needs one brew a day." → "One finished brew makes a warm day."; "Keep screen awake" line "during a brew" → "while a brew is on screen"; Haptics line "Little buzzes for key moments." → "…, on devices that can vibrate." (one extra line, +17 css px); the rest of the page sits lower by that amount | **G** |
| 390 D | 05 focus-added | 6.18 / 0.26 | Box only (central timer box); tol 0.26 says tint-level | live clock |
| 390 D | 06 whistle | 1.29 / 0.02 | Box only: a glow area of about 330×200 px; almost all below the tol 16 | scene / not isolated |
| 390 D | 11, 11b summary-unlock | 19.76 / 6.62, 5.20 / 0.34 | Box only (11: wide box over the hero and card; 11b: the card) | unlock card art / scene timing |
| 390 D | 13 first-brew | 29.91 / 8.87 | Box only: whole screen, scene area | live clock / scene idle motion |
| 390 D | 15 stats-empty | 0.75 / 0.53 | Same wording change as 390 L (tile and empty-state text) | **S** |
| 390 D | 16 stats-populated | 41.3 / 32.7 (size 8736 vs 8354) | Same new Today / Last 7 days card and tile labels as 390 L (the same size difference); not opened in dark | **S** |
| 390 D | 17 nook-early | 7.11 / 1.31 | Opened: night lighting; differences along the room's edges (a small camera or animation offset), the steam and around the kettle and Chai; Chai is small in this view | scene (N area, night): Chai fur is N's change; not separable from animation in this pair |
| 390 D | 18 nook-earned | 65.99 / 64.77 (trial 8504 vs base 3016 tall) | Not opened; the trial frame carries the leaving Stats layer (artifact) | none (artifact) |
| 390 D | 19 settings | 19.59 / 14.89 (size +34 px) | Opened (both sides are Settings here): same wording change in the Daily goal footer ("Your warm streak only needs one brew a day" → "One finished brew makes a warm day"); the trial's content sits about 2 css px lower in the first screen (judged from the downscaled view, not measured); the same +34 px height as in light | **G** |
| 375 L | 03 focus-mid | 11.82 / 7.71 | Not opened; same box and size of difference as 390 L 03 | Focus (F), see 390 L |
| 375 L | 04 focus-paused | 1.00 / 0.83 | Opened: digits differ (12:23 vs 12:21), and the **"Paused" pill sits lower in the trial: its text rows are 703–721 px (base) and 711–730 px (trial), about 4 css px**; the controls and the line below are at the same rows. At 390×844 the same rows are equal | Focus (F) area (`FocusScreen.module.css` +10 lines); not isolated, could be a transition caught at a different moment |
| 375 L | 05 focus-added | 0.65 / 0.57 | Box only (timer box): digits | live clock |
| 375 L | 15 stats-empty | 22.2 / 16.8 (size 3540 vs 3504) | Opened: wording as at 390; the stat tiles are 18 css px taller in the trial (the second tile's label "Warmest run" looks wrapped; the rest of the row is under the tab bar in this frame, so I did not see it) and the tile row pushes the rest down | **S** |
| 375 L | 16 stats-populated | 42.3 / 35.4 (size 8772 vs 8354) | Box only: as 390 L (Glance card, tiles); the page is 209 css px taller | **S** |
| 375 L | 17, 18 | 2.52 / 1.32, 5.77 / 4.99 | Box only: Nook canvas; sizes differ by the leaving screen (artifact, not re-captured at 375) | scene / artifact |
| 375 L | 19 settings | 13.5 / 10.4 (size 8474 vs 8434) | Box only for the difference (starts at y 2297, below the first screen); the base frame is a valid Settings here (opened: top of both frames; not the Nook); +40 px of height | **G** |
| 1440 L | 02, 04, 05 focus | 0.93 / 0.25, 0.51 / 0.49, 0.22 / 0.21 | Box only (central timer box of the wide layout): digits | live clock |
| 1440 L | 11, 11b summary-unlock | 7.88 / 7.85, 7.05 / 0.56 | Opened (11): the base card shows the 3D nook render (a record player on a table, green plants), the trial card shows the flat picture (a record player on blue) at that moment; text and layout identical. 11b settled: 0.56 tol | timing of the card's 3D (no maker's change shown) |
| 1440 L | 13 first-brew | 3.77 / 0.51 | Box only: central box (timer and scene) | live clock / scene |
| 1440 L | 16 stats-populated | 55.8 / 20.2 (size 3091 vs 2913) | Opened: **the base frame is Today**, not Stats (artifact); the trial frame is Stats with the new Today / Last 7 days card, tiles "Days warm / Warmest run" | **S** (trial side valid) |
| 1440 L | 17, 18 nook | 1.91 / 0.27, 7.63 / 5.07 | Box only: Nook canvas; 18 differs in height (leaving layer) | scene / artifact |

Pairs at or under 0.5 % include Today (01, 01b), the summary and break (07, 08, 10; 09 and 14), the welcome (12), the first summary (14) and, at 1440, Settings (19: 0.17 / 0.13) and Stats-empty (15: 0.26 / 0.23, box [435,365,1018,593]); these were not opened except Today and the summary (below).

### 4b. Today, summary, Stats and Settings frames: what changed

Opened: trial `01-home`, `07-summary`, `08-summary-end`, `14-summary-first` (390×844 light); base-versus-trial pairs for Stats-empty, Stats-populated and Settings at 390×844 light and dark, Stats-empty at 375, Stats-populated at 1440.
- **Today (`01-home`, `01b-home-scrolled`):** 0 differing pixels (strict 0.0) at all four configs. The veteran seed at the frozen date already reads "23 days warm" on the base, so F's Today copy does not show in this state.
- **Summary (`07-summary`, `08-summary-end`, `09`, `10`, `14`):** 0.0 at all four configs, except 1440 `09-break` (0.255 %, a 64×94 px box at [1221,246,1285,340], not opened). The unlock summary (11, 11b) differs only in the unlock card's picture and 3D timing.
- **Stats:** S's changes are visible in every Stats frame that is valid: the empty state and tiles speak of warm days ("Days warm", "Warmest run"); the populated page gains the Today / Last 7 days card at the top and is 191 css px taller at 390, 209 at 375 and 178 at 1440 (device px 382, 418, 178). Nothing else on the page was seen to change in the opened part.
- **Settings:** G's changes are copy only in what I saw: the Daily goal footer, the Keep screen awake line and the Haptics line (one more line). The rest of the page keeps its form; in dark the content sits about 2 css px lower in the first screen (not measured).
- **Chai at evening and night (N):** in light the tool forces day; in the dark Nook (night lighting) the pair differs around Chai and along the room's edges together; I cannot separate N's fur change from scene animation in these captures. N's own receipts (Lane R-N) cover that with still frames.

### 3b. Repeat runs of the tests that passed alone (batch 2, 18:34 to 18:41, natural machine load 5 to 11)

`scripts/LR-batch2.sh`: one playwright process per line, `--repeat-each`, `--workers=1`, logs and JSON in `rerun/R*.{log,json}`; `playwright-exit` and `load` are in `rerun/batch2.log`.

| Test | Server and tests from | Runs | Passed | Failed | Failure |
|---|---|---|---|---|---|
| T2 pressed segment | combined dev :5520, combined tests | 8 | 4 | **4** (runs 3, 4, 6, 7) | `w3-settings.spec.ts:249`, `pressed` = `hover` = `oklab(0.959197 0.00389533 0.0175539)`, the same assertion and value as in the suite and on base |
| T2 pressed segment | **G trial :5523**, G's tests (`3d91793`) | 8 | 4 | **4** (runs 1, 3, 5, 8) | the same assertion and value |
| T1 integrity I03 | combined :5520 | 4 | 4 | 0 | |
| T3 `w3-notices` room | combined :5520 | 4 | 4 | 0 | |
| T4 `w3-stats` Delete 390×844 @200 | combined :5520 | 4 | 4 | 0 | |

### 3c. Classification (all evidence above)

| # | Test | Seen failing | Rerun results | Class | Owner |
|---|---|---|---|---|---|
| T2 | `w3-settings` "a pressed segment reads as pressed…" | 1 of 1 in complete C (it passed in the cut C) | alone: pass on combined, pass on G trial; repeats: **fail 4 of 8 on combined and 4 of 8 on the G trial**, same assertion; fails on base too (no pressed colour there, by design) | **Flaky, and present on the maker's own trial** (not a combined-only effect). A timing-dependent test: it reads the colour a fixed 120 ms after `mouse.down()` while `.inner` has a colour transition (candidate, not proven) | **G** (`tests/w3-settings.spec.ts`, `src/ui/SegmentedControl.module.css`) |
| T1 | `integrity` I03 storage-full banner "gone when there is room" (390×844) | 1 of 1 in A (load 10 to 18) | alone: pass on combined, base, S trial, F trial; repeats: 4 of 4 pass on combined | **Flaky** (1 failure in 6 combined-tree runs, 0 in 3 on base, S and F). Too few runs to exclude a rare combined-only effect | test file **S**; surface F (Shell/Toast) and the unowned save-warning |
| T3 | `w3-notices` "the room a gone notice keeps…" (390×844 @200) | cut C only | complete C pass; alone pass on combined and F trial; repeats 4 of 4 pass; fails on base by design | **Flaky or load-sensitive** (one sighting, in the run the restart cut) | **F** |
| T4 | `w3-stats` "Delete this brew?" 390×844 @200 "both choices can be tapped…" | cut C only | complete C pass; alone pass on combined and S trial; repeats 4 of 4 pass; fails on base by design | **Flaky or load-sensitive** (one sighting, in the cut run) | **S** (`Sheet.tsx`) |

No failure was a base failure (T1 passes on base; T2 to T4 fail on base only because they test the fix). No failure was combined-only: each passes on, or is flaky on, its owner's trial. One failure (T2) fails equally on the maker's trial.
