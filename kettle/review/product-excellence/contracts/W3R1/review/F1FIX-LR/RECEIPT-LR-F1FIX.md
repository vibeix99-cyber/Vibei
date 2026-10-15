# RECEIPT-LR-F1FIX: Lane R, regression for the `integrity:309` fix, raw evidence

Raw evidence only. No verdict. Times are UTC, 2026-10-15. Task received 09:46, box 75 minutes, to 11:01. Written in stages; `*.log` is git-ignored, so logs are saved as `.log.txt`. No source edits, no commits to app code, no pushes. Only my own PIDs killed (none needed).

## 0. What was tested, and how

| | |
|---|---|
| Fix | `pe/w3r1-f1-intention@74138d3`: `src/timer/store.ts` (`setIntention` writes only the intention; a save that changes nothing writes nothing), new `src/timer/intentionRace.test.ts` and `tests/w3-intention-race.spec.ts` (packet `F1FIX/F1FIX-READY.md`, read) |
| **Trial** | **`986bda4`** = integration (app `f2298d3`) + the fix, kettle/src `e2041c1`; worktree `/home/user/wt/w6tr-x`; dev **:5562** (`verify.sh`: "PORT 5562 serves 986bda4 (src e2041c1): VERIFIED"), preview :5572. `git diff HEAD~1 HEAD -- kettle` lists only `store.ts`, `intentionRace.test.ts`, `w3-intention-race.spec.ts` (+430 / −20) |
| Control | integration, worktree `/home/user/wt/w6-int` (HEAD `793321b`, src `db6de7e`, app code `f2298d3`): dev :5560 (`verify.sh`: "PORT 5560 serves 793321b (src db6de7e): VERIFIED"). Old base `4d36939`: :5478 / :5488 (all ports answered 200 at 09:46) |
| Machine | 4 CPUs, Chromium headless shell with SwiftShader (the flags in `playwright.config.ts`). Load average 2.2 at the start; two of my gate jobs ran side by side (one slot each) for most of the time |
| Gate | every browser run through `slots.py run --lane LR --n 1`, two jobs at once (lane 1: timer/pwa, integrity, race spec, then the 2-tab check; lane 2: the notice suite). Own `--output` under `kettle/.tmp/LR-pw/` |
| Scripts | `scripts/` (copied at the end): `LR-lane1.sh`, `LR-lane2.sh`, `LR-lane3.sh`, `LR-manual.mjs` |

## 1. Timer-harness, timer-app and pwa projects on :5562

`runs/timer-pwa.log.txt`, `runs/timer-pwa.json`; `KETTLE_PORT=5562 KETTLE_PWA_PORT=5499 npx playwright test --project=timer-harness --project=timer-app --project=pwa --workers=1`; 09:47 to 09:50:39 (3.4 min).

**29 passed, 2 skipped, 0 failed, 0 flaky** (31 tests): `timer-harness` 14 passed; `timer-app` 12 passed, 2 skipped; `pwa` 3 passed. The 2 skips are by design in `tests/timer.spec.ts` (lines 295 and 439, `test.skip(!kettlePage.includes('harness'))`). Same counts as the earlier final run on `2be3de1` and the combined trial.

## 2. The full integrity suite on :5562, once

`runs/integrity-5562.log.txt`, `runs/integrity-5562.json`; `KETTLE_PORT=5562 npx playwright test tests/integrity.spec.ts --project=chromium --workers=1`; 09:50:41 to 09:55:46 (5.1 min); load average about 3 to 8 (the notice suite ran at the same time).

**25 of 25 passed**, 0 failed, 0 flaky, 0 skipped. This includes `integrity.spec.ts:309` (I01 "two tabs, the leading one frozen across the end…": passed, 18.4 s) and the two I03 storage-full cases at 390×844, 375×667 and 1440×900 (the earlier-flaky I03 "gone when there is room" among them). `integrity.spec.ts` is unchanged by the fix (the packet and `git diff` agree). One run of the whole file, no repeats.

## 3. The new `tests/w3-intention-race.spec.ts`, once on :5562 and once on :5560

`runs/race-5562.log.txt`, `runs/race-5560.log.txt` (+ `.json`), the file from the trial worktree both times, `--workers=1`, 09:56 to 10:00.

| Server | Result |
|---|---|
| **:5562** (trial `986bda4`, the fix) | **passed** (12.1 s) |
| **:5560** (integration `f2298d3`, control) | **failed** (5.3 s) as expected, at the "storage still holds B's running brew" step (spec line 91): storage `kettle:timer.state` held `status "idle"`, `sessionId null`, `endsAt null`, `startedAt null`, `intention "Reply to Sam"` where B's brew was expected (`status "running"`, B's `sessionId`, `endsAt`, `startedAt`, `intention "Chapter 3 notes"`): tab A's whole idle timer written over tab B's running brew. Error context and trace: `runs/race-5560-artifacts/` |

One run each; no repeats (the packet reports 3/3 failing on :5560 and :5478 and 5/5 passing on the fix).
