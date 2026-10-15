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

## 4. The 2-tab manual check, real input in two tabs of one browser context, :5562 (fix) and :5560 (control)

Script `scripts/LR-manual.mjs` (Playwright, one browser context, two pages = two tabs; Playwright's keyboard sends real key events, `bringToFront` switches tabs; the debug API is used only to read state dumps and to fast-forward). Log `runs/manual-2tab.log.txt`; per cell a JSON with the dumps at four moments for both tabs (`manual/<server>-<scenario>-<phase>.json`), the summary `manual/summary.txt`, screenshots of both tabs at the four moments for the **first iteration of each cell** (`manual/<server>-<scenario>-<phase>-<t1|t2>-<moment>.png`, 64 files). Fresh profile per iteration, with the quiet defaults the race spec uses (onboarded, no 3D scene, reduced motion, muted).

**Procedure per iteration.** Both tabs open Today (idle, composers mounted). Tab 1 (front): click the composer, type "Write the report", press Enter (brew starts). Tab 2 is typed into with real keys, in two orders: **S1**: tab 2 is brought to the front right after tab 1's Enter and "Reply to Sam" is typed into its composer; **S2**: tab 2's composer is typed "Reply" first (its intention sync pending), tab 1 is brought to the front and presses Enter, tab 2 is brought to the front again and " to Sam" is typed. Then three rounds of back and forth (switch tab, type where a composer exists). Then the debug API fast-forwards 27 minutes in tab 1; both tabs are given up to 20 s to reach `#/done`; the records for the session are counted in `kettle:progress` and in each tab's memory. Moments dumped (each: route, the timer in memory and in `kettle:timer`, composer present, record counts): `01` both on Today, `02` brew started and tab 2 typed, `03` after the back and forth, `04` after the fast-forward. **Phases:** quiet, and loaded (CDP `Emulation.setCPUThrottlingRate` 6 on both tabs, so storage events are handled late; no burners, since the notice suite was running at the same time). **6 iterations per cell, 2 scenarios, 2 phases, 2 servers = 48 iterations.** Page errors: 0 in all 48.

**A first version of the script was discarded** (`manual/attempt1-discarded/`): it typed into tab 2 without bringing it to the front, and those keystrokes reached tab 1's composer (the brew label read "Write the reportRep"). Its 6 completed iterations are kept but not counted; the second version brings each tab to the front before typing in it.

**Results (state at moment 03, before the fast-forward, and the record count after it):**

| Check, per server (24 iterations each) | :5562 fix | :5560 control |
|---|---|---|
| **Bug signature: either tab, or `kettle:timer`, `idle` after tab 1 started the brew** | **0 of 24** | **0 of 24** |
| Same `sessionId` as tab 1's, in both tabs and in storage | 24 of 24 | 24 of 24 |
| `running` in both tabs with the same `endsAt` (equal to storage's) | 23 of 24 | 18 of 24 |
| `paused` in both tabs and in storage (see below) | 1 of 24 | 6 of 24 |
| Of those `running`, after the fast-forward: both tabs on `#/done` and **exactly one record** (storage, tab 1 memory, tab 2 memory) | 23 of 23 | 18 of 18 |
| Tab 2's composer still on screen when tab 2 was brought to the front after tab 1's Enter (S1) or after the switch (S2) | 23 of 24 | 24 of 24 |
| The running brew's task label differs from "Write the report" (changed by tab 2's text) | 14 of 24 | 17 of 24 |

By cell (6 iterations each; survives = running, same session and `endsAt`; the full table is `manual/summary.txt`): fix S1 quiet 6, S1 loaded 5, S2 quiet 6, S2 loaded 6; control S1 quiet 4, S1 loaded 5, S2 quiet 5, S2 loaded 4.

**What was seen, and what it is not:**
- **The original bug did not show on :5560 in these runs.** No iteration on the control had `idle` in either tab or in storage, quiet or with CPU ×6. (The coordinator said it might not without load; the lag the race needs is not produced by main-thread throttling here. The deterministic spec, section 3, is what shows it on :5560.) So this check does not distinguish the fix from the control on the bug itself.
- **The 7 iterations that are not `running` (control 6, fix 1) are `paused`, same session, both tabs and storage** (`endsAt null` at the first dump after the Enter). Cause from the data: the words typed in tab 2 contain spaces; once tab 2 has taken in the brew and moved to the focus screen, the remaining keystrokes reach that screen, where Space is the pause shortcut (the screen shows "Space pause"). It happened on both servers; those iterations had no record because a paused brew is not ended by the fast-forward. It is an effect of my typing, not of either build.
- **The task label.** A tab's composer shows the words typed in the other tab (tab 2's composer already held "Write the report" when I typed into it: S2 recorded its value as "Write the reportReply"). Words typed in tab 2 while the brew starts can therefore become the running brew's task label in both tabs: labels seen include "Reply to SamWrite the report", "Write the reportReply" and " to SamWrite the reportReply". It happens on **both** servers (control 17 of 24, fix 14 of 24), so it is not introduced by the fix; S2 changed it in all 12 iterations on each server, S1 in 5 of 12 on the control and 2 of 12 on the fix. In the fix's runs the brew itself is unharmed (same session, same end).
- The 1 `paused` iteration on the fix and the 6 on the control are all the Space effect above; I did not re-run them with text without spaces.

## 5. The notice suite on :5562

`runs/notice-suite.log.txt`, `runs/notice-suite.json`; `KETTLE_PORT=5562 npx playwright test tests/notice-strip.spec.ts tests/w3-notices.spec.ts tests/w3-notices-idle.spec.ts tests/summary-notice.spec.ts tests/toast-room.spec.ts --project=chromium --workers=1`; 09:47:14 to 10:28:11 (40.9 min), one gate slot; a second gate job (integrity, race spec, the 2-tab check) ran beside it for the first part, load average about 3 to 10.

**74 of 74 passed**, 0 failed, 0 flaky, 0 skipped: `notice-strip` 25, `w3-notices` 9, `w3-notices-idle` 12, `summary-notice` 14, `toast-room` 14. The `notice-strip` case at 1440×900 light 200 % reduced motion (the former X-11 flake) passed (1.0 min). One run of each file, no repeats.

## 6. One extra run (not asked for): `integrity.spec.ts` "two tabs, the leading one frozen across the end" ×10 on :5562

`runs/integrity309-x10-5562.log.txt`, `.json`; `--repeat-each=10 --workers=1`, 10:22 to 10:25, load about 3 to 8 (the notice suite beside it): **10 of 10 passed** (17.3 to 17.8 s each). This is the test that failed twice before the fix (1 in the full run at 2 workers and 1 in 6 under 4 burners); there was no burner load in this run, so it says little about the load case. The maker reports 20/20 twice under load (6 burners); I did not repeat that.

## 7. Summary and Unproven

| Item | Result |
|---|---|
| Timer-harness, timer-app, pwa on :5562 (§1) | 29 passed, 2 skipped by design |
| Full `integrity.spec.ts` on :5562, once (§2) | **25 of 25** (including `:309`, and the I03 cases) |
| Notice suite on :5562 (§5) | **74 of 74** |
| `w3-intention-race.spec.ts` (§3) | :5562 **passes**; :5560 **fails** at the storage step (A's whole idle timer over B's running brew) |
| 2-tab manual check with real input (§4) | 48 iterations. On both :5562 and :5560 the brew survived in both tabs (same session, never `idle`) in 24 of 24; **the original bug did not show on :5560** (0 of 24 idle), quiet or with CPU ×6. 7 iterations ended `paused` by my own typed Space (6 control, 1 fix). Of the `running` ones, 41 of 41 made exactly one record. The running brew's label can be overwritten by words typed in tab 2 on **both** servers (control 17 of 24, fix 14 of 24) |
| Extra: `integrity:309` ×10 on :5562 (§6) | 10 of 10, without burner load |

**Unproven**

| Item | Status |
|---|---|
| The manual check does not separate the fix from the control on the bug itself | the race needs the storage-event lag; main-thread throttling did not produce it in 48 iterations. Only the deterministic spec (hold the events) shows it, on :5560 |
| The 7 `paused` iterations | explained from the data (Space typed on the focus screen), not re-run with space-free text; so for those 7 the fast-forward and record step was not exercised |
| `integrity:309` under load on the fix | not run by me (§6 had no burners); the maker's 20/20 ×2 under 6 burners is not reproduced here |
| Full integrity and the notice suite were run once each, at load 3 to 10 with two gate jobs side by side | no repeats; no `--workers=2` |
| The task-label overwrite in the manual check | seen on both servers; I did not look at the code path beyond the data (a tab's composer holds the other tab's words, so words typed in tab 2 are saved as the intention of the brew tab 2 has by then taken in); whether it is intended is not mine to say |
| Screenshots | first iteration of each of the 8 cells only; no screenshot of the failing-looking moments beyond what the four moments show; frames not annotated |
| Judgement | none given |

## 8. Evidence layout (`/home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/F1FIX-LR/`)

`runs/` (timer-pwa, integrity, race spec ×2, notice suite, integrity:309 ×10 logs as `.log.txt` and JSON; `manual-2tab.log.txt`; `race-5560-artifacts/` with the control's error context and trace), `manual/` (8 JSON files, `summary.txt`, 64 screenshots, `attempt1-discarded/`), `scripts/`.
