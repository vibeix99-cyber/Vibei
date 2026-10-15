# RECEIPT-LR-POSTMERGE-F1: Lane R, post-merge regression of the F1 fix, raw evidence

Raw evidence only. No verdict. Times are UTC, 2026-10-15. Task received 11:23, box 75 minutes (to 12:38), hard stop 12:50. Written in stages; `*.log` is git-ignored, so logs are saved as `.log.txt`. No source edits, no pushes, only `commit-evidence.sh` for git. No process of mine was killed with a pattern.

## 0. What was tested, and how

| | |
|---|---|
| Tree | integration worktree `/home/user/wt/w6-int` at `f817931`, app `5f78af1`, `kettle/src` tree `b74e6b3`; `git status` clean |
| Servers | dev **:5560** (debug API, `window.__kettle`) and **:5570** (preview) answered 200 at 11:24. `verify.sh /home/user/wt/w6-int 5560`: "PORT 5560 serves f817931 (src b74e6b3): VERIFIED"; the served `src/timer/store.ts` has the same hash as the committed blob (`ecb09baca37315a7`). Old base :5478 / :5488 answered 200 (a control only if something failed) |
| Machine | 4 CPUs; gate maximum 3 browser processes; a second maker lane (N2) shared the machine and the gate. **Load average was 13 to 15 for most of the run** (1-minute average, from 11:31 on; it was 0.6 at 11:24), so every browser run below ran loaded; the load at the start and the end of each run is in its log header and trailer |
| Gate | every Playwright and every manual-script run went through `slots.py run --lane LR`: the notice suite with `--n 2` and two workers; every other job `--n 1`, one worker. Up to three of my jobs were queued side by side; the gate let at most one per lane hold while another lane waited |
| Reused | commands, environment and spec lists from `F1FIX-LR/RECEIPT-LR-F1FIX.md`, pointed at :5560; the 2-tab script is rewritten (below) |
| Scripts | `scripts/`: `LR-common.sh` (the gate helper that writes the load header and trailer), `LR-lane1.sh`, `LR-lane2.sh`, `LR-lane3.sh`, `LR-manual.mjs` |

## 1. Typecheck and unit tests (not browser runs, no gate)

| Check | Command | Result |
|---|---|---|
| tsc | `npx tsc --noEmit -p .` (`runs/tsc.log.txt`) | exit 0, no output, 1.7 s |
| vitest | `npx vitest run` (`runs/vitest.log.txt`) | **33 test files passed (33), 314 tests passed (314)**, 0 failed, exit 0, 4.4 s |

## 2. Timer-harness, timer-app and pwa projects on :5560

First run: `runs/timer-pwa.log.txt`, `runs/timer-pwa.json`; `KETTLE_PORT=5560 KETTLE_PWA_PORT=5499 npx playwright test --project=timer-harness --project=timer-app --project=pwa --workers=1`; 11:25:44 to 11:35:50 (10.1 min); load average 1.4 at the start, 14.7 at the end (the notice suite and the maker lane ran beside it).

**27 passed, 2 failed, 2 skipped** (31 tests): `timer-harness` 14 passed; `timer-app` 10 passed, **2 failed**, 2 skipped; `pwa` 3 passed. The 2 skips are the by-design ones in `tests/timer.spec.ts` (lines 294 and 438).

| Failed (first run) | Error | Error-context (first lines) |
|---|---|---|
| `timer.spec.ts:156` "background: the worker completes on time even with main-thread timers frozen" (22.0 s) | `expect.poll(() => window.__doneAt ?? null).not.toBeNull()` at line 175: still `null` after the 10 s poll | page snapshot: the done screen, heading "1 minute brewed", "Tea's ready. Take five before the next one.", badge "First Brew" |
| `timer.spec.ts:183` "hidden page: completion shows a warm notification; coming back restores the title" (26.3 s) | `expect.poll(() => window.__notes.length).toBe(1)` at line 204: expected 1, received 0 after the 10 s poll | page snapshot: the done screen, heading "1 minute brewed", task "Essay", "done, or carry it forward to your next brew?" |

Files: `runs/failures/first-run-timer-timer-reliability-*/` (error-context.md and trace.zip each).

**Reruns, once each, same two tests:**
- A first attempt at the rerun used `tests/timer.spec.ts:156 tests/timer.spec.ts:183` and found no tests ("Error: No tests found", 11:53:17 to 11:53:19, nothing ran; I removed that log when I replaced it, by mistake). The rerun by title, `-g 'background: the worker completes on time…|hidden page: completion shows a warm notification'`, is the one counted.
- **:5560**, `runs/rerun-timer-app-5560.log.txt`, 11:55:16: **2 of 2 passed** (9.0 s and 7.8 s); load average 11.9 at the start, 14.3 at the end.
- **:5478** (old base, control), `runs/control-timer-app-5478.log.txt`, 11:55:38: **2 of 2 passed** (9.2 s and 12.1 s); load average 14.3 to 15.8.

Classification: **does not reproduce** on :5560 (both pass on the rerun); **does not fail on :5478** either. Both failures were a 10 s poll on a 2-second brew while the machine's load average was 13 to 15.

With the two reruns counted in place of the two failures: 29 passed, 2 skipped (the expected 29 + 2). A whole second run of the three projects, asked for by nobody, is in section 2b if it finished.

## 3. Integrity on :5560

**3a. The whole file once**: `runs/integrity-5560.log.txt`, `.json`; `KETTLE_PORT=5560 npx playwright test tests/integrity.spec.ts --project=chromium --workers=1`; 11:43:45 to 11:49:04 (5.3 min); load average 13 at the start (the notice suite and the maker lane beside it), 8.4 at the end. **25 of 25 passed**, 0 failed, 0 flaky, 0 skipped. `integrity.spec.ts:309` ("two tabs, the leading one frozen across the end") is among them.

**3b. `integrity:309` x10**: `runs/integrity309-x10.log.txt`, `.json`; `-g 'two tabs, the leading one frozen across the end' --repeat-each=10 --workers=1`; 11:50:58 to 11:54:19 (3.3 min); load average about 10 to 11 at both ends. **10 of 10 passed.**

## 4. The notice suite on :5560

`runs/notice-suite.log.txt`, `runs/notice.json`; `KETTLE_PORT=5560 npx playwright test tests/notice-strip.spec.ts tests/w3-notices.spec.ts tests/w3-notices-idle.spec.ts tests/summary-notice.spec.ts tests/toast-room.spec.ts --project=chromium --workers=2`; two gate slots; 11:25:45 to 11:50:56 (25.1 min); load average 1.4 at the start, 10.0 at the end (13 to 15 in between).

**73 passed, 1 failed** (74 tests): `notice-strip` 24 passed + 1 failed (of 25), `w3-notices` 9, `w3-notices-idle` 12, `summary-notice` 14, `toast-room` 14 (all passed). 0 flaky, 0 skipped.

| Failed (first run) | Error | Error-context (first lines) |
|---|---|---|
| `notice-strip.spec.ts:338` "no notice overlaps a control, text or a row: every notice state, real input (844×390 dark 200 %)" (8.2 s) | at line 300 (`press`): "getByRole('textbox', { name: /What are you brewing/ }) still on top as the tap is aimed", `expect(at).not.toBeNull()` received `null` (called from line 350) | page snapshot of Today: "Good afternoon, Sam", progress buttons ("3 days warm", "188 leaves", "Cozy level 4"), Today's goal 25 min brewed / 5 min to go, the Brew length group with "25 min" checked, the composer textbox; no notice in the first 90 lines |

Files: `runs/failures/first-run-notice-strip-*/error-context.md`.

**Rerun once, :5560**: `runs/rerun-notice-strip-5560.log.txt`, `-g '844×390 dark 200 %\)$'` (matches that one test), 11:53:21 to 11:54:26, load average 10.9 to 11.5: **passed** (1.0 min).
**Same case on :5478** (old base, control): `runs/control-notice-strip-5478.log.txt`, 11:57:03 to 11:58:26, load average 17.7 to 19.6: **passed** (1.3 min).

Classification: **does not reproduce** on :5560 (the rerun passes); it does not fail on :5478 either. The failing step is the real-input "still on top as the tap is aimed" check, 8.2 s into the test, on a run at load average 10 to 15.

Counted with the rerun in place of the failure: 74 of 74 (as in the previous round, 74 tests).

## 5. `w2-home` (the brew-length control) and the new race spec on :5560

**5a. `w2-home`**: `runs/w2-home.log.txt`; `KETTLE_PORT=5560 npx playwright test tests/w2-home.spec.ts --project=chromium --workers=1`; 11:54:59 to 11:59:43 (4.7 min); load average 12.9 at the start, 15.5 at the end. **18 of 18 passed** (12 "Brew length: every option on screen at rest, clear of the docked start, tapped and keyed", 6 "first visit: one plain line, one primary action, the 15-minute brew").

**5b. `w3-intention-race.spec.ts`**: `runs/race-5560.log.txt`, `.json`; `--workers=1`; 11:54:27 to 11:54:59 (31 s); load average 11.5 to 12.9. **2 of 2 passed**: the intention race (13.6 s) and "F1X-D1: B picks another brew length and starts; A (idle, its timer events held) takes in the length change first: the brew survives, one record" (14.5 s).

