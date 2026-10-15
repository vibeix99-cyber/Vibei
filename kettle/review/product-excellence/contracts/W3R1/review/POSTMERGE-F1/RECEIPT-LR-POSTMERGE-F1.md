# RECEIPT-LR-POSTMERGE-F1: Lane R, post-merge regression of the F1 fix, raw evidence

Raw evidence only. No verdict. Times are UTC, 2026-10-15. Task received 11:23, box 75 minutes (to 12:38), hard stop 12:50. Written in stages; `*.log` is git-ignored, so logs are saved as `.log.txt`. No source edits, no pushes, only `commit-evidence.sh` for git. No process of mine was killed with a pattern.

## 0. What was tested, and how

| | |
|---|---|
| Tree | integration worktree `/home/user/wt/w6-int` at `f817931`, app `5f78af1`, `kettle/src` tree `b74e6b3`; `git status` clean |
| Servers | dev **:5560** (debug API, `window.__kettle`) and **:5570** (preview) answered 200 at 11:24. `verify.sh /home/user/wt/w6-int 5560`: "PORT 5560 serves f817931 (src b74e6b3): VERIFIED"; the served `src/timer/store.ts` has the same hash as the committed blob (`ecb09baca37315a7`). Old base :5478 / :5488 answered 200 (a control only if something failed) |
| Machine | 4 CPUs; gate maximum 3 browser processes; a second maker lane (N2) shared the machine and the gate. **Load average was 8 to 19 for most of the run** (1-minute average, mostly 10 to 15 from 11:31 on; it was 0.6 at 11:24), so every browser run below ran loaded; the load at the start and the end of each run is in its log header and trailer |
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

Classification: **does not reproduce** on :5560 (both pass on the rerun); **does not fail on :5478** either. Both failures were a 10 s `expect.poll` for a marker the page sets when the brew completes (`__doneAt`, `__notes`), while the machine's load average was 13 to 15; the snapshot at the failure shows the done screen.

With the two reruns counted in place of the two failures: 29 passed, 2 skipped (the expected 29 + 2). A whole second run of the three projects, asked for by nobody, is in section 2b if it finished.

## 3. Integrity on :5560

**3a. The whole file once**: `runs/integrity-5560.log.txt`, `.json`; `KETTLE_PORT=5560 npx playwright test tests/integrity.spec.ts --project=chromium --workers=1`; 11:43:45 to 11:49:04 (5.3 min); load average 13 at the start (the notice suite and the maker lane beside it), 8.4 at the end. **25 of 25 passed**, 0 failed, 0 flaky, 0 skipped. `integrity.spec.ts:309` ("two tabs, the leading one frozen across the end") is among them.

**3b. `integrity:309` x10**: `runs/integrity309-x10.log.txt`, `.json`; `-g 'two tabs, the leading one frozen across the end' --repeat-each=10 --workers=1`; 11:50:58 to 11:54:19 (3.3 min); load average about 10 to 11 at both ends. **10 of 10 passed.**

## 4. The notice suite on :5560

`runs/notice-suite.log.txt`, `runs/notice.json`; `KETTLE_PORT=5560 npx playwright test tests/notice-strip.spec.ts tests/w3-notices.spec.ts tests/w3-notices-idle.spec.ts tests/summary-notice.spec.ts tests/toast-room.spec.ts --project=chromium --workers=2`; two gate slots; 11:25:45 to 11:50:56 (25.1 min); load average 1.4 at the start, 10.0 at the end (13 to 19 in between).

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

## 2b. Extra (not asked): the timer-harness, timer-app and pwa projects once more, as one run

`runs/timer-pwa-run2.log.txt`, `runs/timer-pwa-run2.json`; the same command as section 2; 12:03:05 to 12:06:12 (3.1 min); load average 15.8 at the start, 11.0 at the end. **29 passed, 2 skipped, 0 failed, 0 flaky** (31 tests): `timer-harness` 14 passed; `timer-app` 12 passed, 2 skipped; `pwa` 3 passed. This is the expected 29 + 2 in one run. The two tests that failed in the first run (section 2) passed in it.

## 6. The 2-tab manual check, real input in two tabs of one browser context, :5560

Script `scripts/LR-manual.mjs` (rewritten from the earlier round's; Playwright, one browser context, two pages = two tabs sharing localStorage; `locator.click`, `pressSequentially` and `keyboard.press` send real mouse and key events; `bringToFront` switches tabs; the debug API is used only to read state dumps and to fast-forward the clock). A fresh profile per iteration, the quiet defaults the race spec uses (onboarded, no 3D scene, reduced motion, muted). Per iteration, dumps of both tabs (route, the timer in memory and in `kettle:timer`, `focusMin` in memory and in `kettle:settings`, the Start button text, composer present, record counts) at four moments; JSON per cell, `summary.txt` (counts per cell), and screenshots of both tabs at the four moments for iteration 1 of each cell. Logs: `runs/manual-2tab-quiet.log.txt`, `runs/manual-2tab-loaded.log.txt`, `runs/manual-2tab-loaded-slowtype.log.txt` (each with the load average at its start and end, and per iteration). Files: `manual/` (cells above), `manual-loaded-slowtype/` (the re-run below).

Phases: **quiet** = no throttling (the machine itself was at load average 8 to 13 from the other jobs); **loaded** = CDP `Emulation.setCPUThrottlingRate` 6 on the open pages (load average 11 to 18 on top). Page errors: 0 in every iteration. Typed words contain no space, `+`, `=` or `m` (on the focus screen Space pauses, +/= add five minutes, m mutes), the cause of the earlier round's seven paused brews.

### 6a. (a) Tab A on Today, idle; tab B changes the brew length with the Home length control and starts a brew (cell `LEN`)

Tab B clicks the "Brew length" radio (lengths in order 15, 50, 50, 15, 15, 50 min), then clicks "Put the kettle on". Iterations 1 to 3: the Start click comes 150 ms after the length click ("quick"). Iterations 4 to 6: B waits until A's own Start button reads the new length, then clicks Start ("settled"). Checked 3.7 s after the Start click. After that (extra) the clock is fast-forwarded past the end in B.

| Check | quiet (6) | loaded (6) |
|---|---|---|
| B running; A running | 6 of 6; 6 of 6 | 6 of 6; 6 of 6 |
| Same `sessionId` in A, in B and in `kettle:timer` | 6 of 6 | 6 of 6 |
| `kettle:timer` `running` | 6 of 6 | 6 of 6 |
| Same `endsAt` in A, B and storage | 6 of 6 | 6 of 6 |
| `plannedMs` equals B's chosen length in A, B and storage | 6 of 6 | 6 of 6 |
| `focusMin` equals B's chosen length in A's settings (memory and `kettle:settings`) | 6 of 6 | 6 of 6 |
| A on the focus screen | 6 of 6 | 6 of 6 |
| Settled iterations: A's Start button read B's length after (ms) | 18, 45, 3 | 130, 14, 60 |
| Extra: both tabs reach `#/done` after the end; exactly one record (storage, A memory, B memory) | 6 of 6; 6 of 6 | 6 of 6; 6 of 6 |

### 6b. (b) A brew started in A; a task typed in each tab; the brew survives in both; it ends; exactly one record

Cells (each 6 iterations): **S1** both tabs on Today; A types "Write the report" and presses Enter; B is brought to the front at once and "ReplyToBob" is typed. **S2** both on Today; B is typed "Reply" first (its intention save pending); A is brought to the front and presses Enter; B is brought to the front again and "ToBob" is typed. **S0** (the literal reading of "open Today in B"): A starts the brew first, then a new tab B opens Today. After that, in S1 and S2, three rounds of switching tabs and typing "-1", "-2", "-3" where a composer exists; then the clock is fast-forwarded 27 minutes in A; both tabs get up to 20 s to reach `#/done`; records for the session are counted in `kettle:progress` and in each tab's memory. "Survives" = at the end of the rounds, both tabs `running` with A's `sessionId`, storage `running` with the same `sessionId`, the same `endsAt` in A, B and storage, and neither tab nor storage `idle` at any dump.

| Cell | survives (running, same session, same `endsAt`, never idle) | both tabs `#/done` | exactly one record | intention equal in A, B and storage | page errors |
|---|---|---|---|---|---|
| S1 quiet | 6 of 6 | 6 of 6 | **6 of 6** | 6 of 6 | 0 |
| S2 quiet | 6 of 6 | 6 of 6 | **6 of 6** | 6 of 6 | 0 |
| S0 quiet (B opened after the start) | 6 of 6 | 6 of 6 | **6 of 6** | 6 of 6 | 0 |
| S1 loaded (CPU x6) | 6 of 6 | 6 of 6 | **6 of 6** | 6 of 6 | 0 |
| S2 loaded (CPU x6) | 6 of 6 | 6 of 6 | **6 of 6** | 6 of 6 | 0 |
| S1 loaded, re-run with an 8 s typing wait (`manual-loaded-slowtype/`) | 6 of 6 | 6 of 6 | **6 of 6** | 6 of 6 | 0 |
| S2 loaded, re-run with an 8 s typing wait | 6 of 6 | 6 of 6 | **6 of 6** | 6 of 6 | 0 |

Totals for 6a and 6b: 54 iterations (12 in 6a, 42 in 6b), **54 of 54 with the brew surviving as defined, 54 of 54 with exactly one record, 0 page errors**; no dump taken after the Start (the two moments before the end, both tabs and storage, in all 54 iterations) showed `idle`; S0 also timed out typing in tab A's missing composer in 6 of 6.

What else was seen:
- **S0 (B opened after the start):** B's Today is sent to `#/focus` at once in 6 of 6 (composer present on B: 0 of 6), so there is no task field to type in on either tab; the typing calls in both tabs timed out (1.5 s) in 6 of 6. The brew survived in 6 of 6.
- **Typing in B did not always happen.** In S1 and S2 the typing call in B gave up (B was on the focus screen at the next dump, composer gone; B had taken in the brew) in: S1 quiet 1 of 6; S1 loaded 5 of 6 (first run) and 2 of 6 (8 s wait); S2 quiet 0 of 6; S2 loaded 3 of 6 (first run) and 5 of 6 (8 s wait). A longer wait did not change that (the element was gone, not slow), so the loaded S1 and S2 counts above are for runs in which B's text was typed in part or in whole in some iterations and not in others; the brew survived in all of them.
- **The running brew's task label can be changed by the words typed in B**, as in the earlier round: the label differs from "Write the report" in S1 quiet 1 of 6, S2 quiet 6 of 6, S0 quiet 0 of 6, S1 loaded 3 of 6 and 2 of 6 (re-run), S2 loaded 6 of 6 and 6 of 6 (re-run). Examples: "ReplyToBobWrite the report", "ToBobWrite the reportReply", "Write the reportReply", "RepWrite the report", "-1Write the report". In S2, B's composer already held A's "Write the report" (taken in by the sync) when "Reply" was typed (`valueBefore` "Write the reportReply" in 18 of 18 S2 iterations). The label is the same in A, B and storage in every iteration. The earlier round saw the same on both the old and the fixed build (control 17 of 24, fix 14 of 24); I did not run this script on :5478, so there is no control for these counts. Whether it is intended is not mine to say.
- The A/B Start-button text, `focusMin` and `plannedMs` all moved together (6a).

## 7. Summary and Unproven

| Item | Result |
|---|---|
| `tsc --noEmit -p .` (section 1) | exit 0, no output |
| `vitest run` (section 1) | 33 files, **314 of 314 passed** |
| timer-harness + timer-app + pwa (sections 2, 2b) | first run 27 passed, 2 failed (`timer.spec.ts:156` and `:183`, 10 s polls at load average 13 to 15), 2 skipped; the 2 passed on rerun on :5560 and on :5478; a whole second run: **29 passed, 2 skipped, 0 failed** |
| `integrity.spec.ts` whole (3a) | **25 of 25** |
| `integrity:309` x10 (3b) | **10 of 10** |
| Notice suite (4) | first run 73 of 74 (`notice-strip.spec.ts:338` at 844×390 dark 200 %: "still on top as the tap is aimed"); the case passes on rerun on :5560 and on :5478 |
| `w2-home` (5a) | **18 of 18** |
| `w3-intention-race` (5b) | **2 of 2** |
| 2-tab check (6) | 54 iterations (12 length-change, 42 task-typing), brew survived in 54 of 54, exactly one record in 54 of 54, 0 page errors |

**Unproven**

| Item | Status |
|---|---|
| Everything ran at a load average of 8 to 19 (my parallel jobs and the other lane); the machine was never quiet | the two timer-app failures and the one notice-strip failure happened at that load, and passed on rerun; a quiet-machine run of the whole set was not done |
| The manual check does not separate this build from the old one | I ran it on :5560 only. The earlier round saw that the original bug did not show in this kind of check on the unfixed build either (the deterministic race spec is what shows it); no control run on :5478 this time |
| 6b "type a task in each tab" | B's composer was gone before or during the typing in a share of the iterations (counts in section 6b); in those the brew survives, but B's text was not (all) entered |
| Notice suite and the other files were run once each (plus one rerun of each failure), not repeated | no repeats beyond `integrity:309` x10; notice suite at two workers this time (the earlier round used one) |
| `scripts/LR-manual.mjs` was edited once after the first quiet and loaded cells (the typing wait became settable by `TYPE_TIMEOUT_MS`, default 1500 ms: the same as before); the copy in `scripts/` is the edited one | no other change |
| The first rerun attempt of the two timer-app tests (file:line filter) ran nothing and its log is gone | the rerun counted is the one by title (section 2) |
| Judgement | none given |

## 8. Evidence layout (`/home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/POSTMERGE-F1/`)

`runs/` (every run's `.log.txt` with its start and end load average; `.json` for the Playwright runs; `failures/` with the error-context and trace of the three first-run failures), `manual/` and `manual-loaded-slowtype/` (per-cell JSON, `summary.txt`, screenshots of iteration 1 of each cell), `scripts/` (the gate helper, lane scripts, `LR-manual.mjs`, `LR-summarize.mjs`).
