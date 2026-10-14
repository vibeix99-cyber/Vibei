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
