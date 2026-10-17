# RECEIPT-R2: Lane R2, regression of the W3R2 stale-tab guard (item 1), raw evidence

Raw evidence only. No verdict. Times are UTC, 2026-10-17. Task received 17:58, box 90 minutes, hard stop 19:45. Written in stages; `*.log` is git-ignored, so logs are saved as `.log.txt`. No source or committed-test edits, no pushes; the only git write is `commit-evidence.sh`. No process of mine was killed with a pattern (two explicit PIDs of my own, listed in section 0).

## 0. What was tested, and how

| | |
|---|---|
| Trial | `/home/user/wt/w8tr-g`, HEAD `88d6b64` (src tree `dd6944e`), `git status` clean. The guard is `pe/w3r2-sync-guard@54a9721` merged on integration app `5f78af1` |
| Servers | dev **:5591** (trial, debug API) and preview :5593 (not used); controls: **:5560** = integration `494748b` (no guard, `/home/user/wt/w6-int`), :5570 not used, :5478 old base `4d36939` (not used unless something failed) |
| Served code | `verify.sh /home/user/wt/w8tr-g 5591`: "PORT 5591 serves 88d6b64 (src dd6944e): VERIFIED". Blob hashes of `src/timer/store.ts`, `sync.ts`, `ticker.ts` as served equal the committed blobs: :5591 `9ea4e0e4bac63470` / `51481caac6ac4361` / `ddbf46b63efc5cdf` (trial); :5560 `ecb09baca37315a7` / `cfc45d0b7bb4ccbe` / `ddbf46b63efc5cdf` (integration, no guard) |
| Machine | 4 CPUs; gate maximum 3. **Load average 9 to 15 throughout** (lead and makers TS and TH share the box; at 17:59 it was 12.7), so every browser run below ran loaded; the load at the start and end of each run is in its log header and trailer |
| Gate | every Playwright and every 2-tab script run went through `slots.py run --lane R2` (`--n 1`, one worker; the notice suites `--n 2`, two workers). Reused the gate helper, JSON summary script and spec lists from `W3R1/review/POSTMERGE-F1` (pointed at :5591) |
| Scripts | `scripts/R2-common.sh` (gate helper with the uptime header and trailer), `R2-unit.sh`, `R2-chainX.sh`, `R2-chainY.sh`, `R2-notice.sh`, `R2-2tab.mjs` (the 2-tab script), `R2-jsum.mjs`; superseded: `R2-chain1.sh` (replaced by `R2-chainX.sh` after its first job; I killed its explicit PID 14439 and the waiting gate PID 16685, which had not started any browser), `R2-smoke.sh` |
| Logs and JSON | `runs/*.log.txt`, `json/*.json` (Playwright JSON), `manual/` (2-tab JSON per iteration, summaries, screenshots) |

**Control timeline (orchestrator's note on the integration HEAD).** The control :5560 changed under me: `w6-int` took TH's `Toast.tsx` hook merge (`7cb3242`), HEAD `a1e3d04` (src `07df367`), at **19:02:16 to 19:02:59 UTC by this machine's clock** (commit times; `Toast.tsx` mtime 19:02:59). I checked at 19:04: `verify.sh /home/user/wt/w6-int 5560` says "PORT 5560 serves a1e3d04 (src 07df367): VERIFIED"; the served `store.ts`, `sync.ts`, `ticker.ts` hashes are unchanged and equal the pre-change ones and those of :5583 (`494748b`, src `b74e6b3`): `ecb09baca37315a7` / `cfc45d0b7bb4ccbe` / `ddbf46b63efc5cdf`. There is still no stale-tab guard on it.
- **Control runs BEFORE the change (on `494748b`, src `b74e6b3`):** the whole 2-tab control, `runs/manual-2tab-5560.log.txt`, 18:30:49 to 18:38:12 (section 6). My only other look at :5560 was the served-blob check at 17:59.
- **Control runs AFTER the change (on `a1e3d04`):** none up to this stage. The browser bundle on :5591 had no failure to classify, so no rerun on :5560 was made. (If a post-change control 2-tab run was made later, it is listed at the end of section 6.)
- **:5591 was not touched**: HEAD `88d6b64`, src `dd6944e`, no change during the run (checked 19:04).
- Not used: :5583 (exact `494748b`), :5570, :5478, :5593.

## 1. Typecheck and unit tests (not browser runs, no gate)

| Check | Command | Result |
|---|---|---|
| tsc | `npx tsc --noEmit -p .` in `/home/user/wt/w8tr-g/kettle` (`runs/tsc.log.txt`; the log opens with HEAD `88d6b64`, src `dd6944e`, 0 dirty files) | exit 0, no output (6 s) |
| vitest | `npx vitest run` (`runs/vitest.log.txt`) | **34 test files passed (34), 338 tests passed (338)**, 0 failed, exit 0, 25 s (18:00:18) |

## 2. Timer-harness, timer-app and pwa projects on :5591

`runs/timer-pwa-5591.log.txt`, `json/timer-pwa-5591.json`; `KETTLE_PORT=5591 KETTLE_PWA_PORT=5498 npx playwright test --project=timer-harness --project=timer-app --project=pwa --workers=1`; 19:00:03 to 19:03:57 (3.9 min); load average 14.0 at the start, 18.6 at the end.

**29 passed, 2 skipped, 0 failed, 0 flaky** (31 tests): `timer-harness` 14 passed; `timer-app` 12 passed, 2 skipped; `pwa` 3 passed. The 2 skips are the by-design ones in `tests/timer.spec.ts` (`:294` "Space toggles ..." and `:438` "useRemaining re-renders about once per displayed second"). Nothing to rerun or classify.

## 3. Integrity on :5591

**3a. The whole file once:** `runs/integrity-5591.log.txt`, `json/integrity-5591.json`; `npx playwright test tests/integrity.spec.ts --project=chromium --workers=1`; 18:51:39 to 18:56:46 (5.1 min); load average 10.4 at the start, 12.4 at the end. **25 of 25 passed**, 0 failed, 0 flaky, 0 skipped. `integrity.spec.ts:309` is among them.

**3b. `integrity:309` x10:** `runs/integrity309-x10-5591.log.txt`, `json/integrity309-x10-5591.json`; `-g 'two tabs, the leading one frozen across the end' --repeat-each=10 --workers=1`; 18:56:46 to 19:00:03 (3.3 min); load average 12.4 at the start, 14.0 at the end (no extra CPU burners: the brief asked for the plain x10). **10 of 10 passed.**

## 4a. Race specs on :5591 (first part of check 4)

`runs/race-staletab-5591.log.txt`, `json/race-staletab-5591.json`; `KETTLE_PORT=5591 npx playwright test tests/w3r2-stale-tab.spec.ts tests/w3-intention-race.spec.ts --project=chromium --workers=1`; 18:00:09 to 18:01:35 (1.3 min); load average 9.4 at the start, 14.2 at the end. **6 of 6 passed**: `w3-intention-race` 2 (the intention race 21.0 s, F1X-D1 16.6 s) and `w3r2-stale-tab` 4 (pause 9.7 s, add 5 8.8 s, end 11.1 s, start 7.1 s). 0 failed, 0 flaky, 0 skipped.

## 4b. `w2-home` on :5591 (second part of check 4)

`runs/w2-home-5591.log.txt`, `json/w2-home-5591.json`; `npx playwright test tests/w2-home.spec.ts --project=chromium --workers=1`; 19:03:57 to 19:09:11 (5.2 min); load average 18.6 at the start, 17.5 at the end. **18 of 18 passed** (0 failed, 0 flaky). With 4a (race and stale-tab specs, 6 of 6) the whole of check 4 is 24 of 24.

## 5. The notice suites on :5591

`runs/notice-suite-5591.log.txt`, `json/notice-suite-5591.json`; `KETTLE_PORT=5591 npx playwright test tests/notice-strip.spec.ts tests/w3-notices.spec.ts tests/w3-notices-idle.spec.ts tests/summary-notice.spec.ts tests/toast-room.spec.ts --project=chromium --workers=2`; two gate slots; 19:07:09 to 19:28:15 (21.0 min); load average 19.4 at the start, 5.6 at the end.

**74 passed, 0 failed, 0 flaky, 0 skipped** (74 tests): `notice-strip` 25, `w3-notices` 9, `w3-notices-idle` 12, `summary-notice` 14, `toast-room` 14. Nothing to rerun or classify.

## 6. The 2-tab manual check with real clicks (:5591 fix, :5560 control)

**Script** `scripts/R2-2tab.mjs` (sha256 prefix `d3c8d64ef9a734c2`, the same file for both servers; run through the gate, one slot). Playwright, one Chromium, **one browser context with two pages = two tabs sharing localStorage**, a fresh context per iteration, quiet defaults (onboarded, no 3D scene, reduced motion, muted). Every action of the person is a real mouse or keyboard event: the start (click the composer, `pressSequentially` the words, click "Put the kettle on"), "Pause", "Add 5 minutes", "End session" and the sheet's "End session" (`locator.click`, `bringToFront` first). The debug API is used only to **read** state, and in (c), (d) and (e) to move the clock by 90 s **in both tabs by the same amount**, so a brew has over one minute of focus and gets a record. "Lagging" is the maker's method: an init script (registered before the app's listener, as in `tests/w3r2-stale-tab.spec.ts`) holds tab B's `storage` events for `kettle:timer`, and `release()` re-dispatches them in order. B's own read of storage stays current (the usual "late event" lag, not the doubly stale case). Page errors: 0 in every iteration.

**Cases (5 iterations each, on each server):**
- **(a) pause:** A starts a 25-min brew; B shows it; B held; A clicks "Add 5 minutes" (storage now has 30 min, B still shows 25); B clicks Pause; release.
- **(b) add 5:** as (a), but A clicks Pause first (B still shows it running), then B clicks "Add 5 minutes"; release.
- **(c) end:** A starts, B shows it, both clocks +90 s, B held; A ends the brew (End session, sheet) and starts a new one ("Second brew"); B, still on its stale view of brew 1, clicks End session and confirms in the sheet; release.
- **(d) no hold:** A starts, B shows it, both clocks +90 s; B clicks Pause, "Add 5 minutes", End session (sheet) while A watches; then A starts a second brew, both clocks +90 s, B ends it. One record per ended brew.
- **(e) optional:** as (c), but B clicks "Add 5 minutes" (the +5 that the fix drops); the Focus note is read for 1.5 s after the click.

**What each iteration was checked for** (the criteria are in each `manual/*-<case>-NN.json` under `checks`; a criterion is counted per iteration):
- (a) paused in A, in B and in storage; same `sessionId` in all three; `plannedMs` 30 min in all three (A's +5 kept); A, B and storage agree on status, `sessionId`, `endsAt`, `plannedMs` and `remainingMs`.
- (b) same `sessionId` and agreement in A, B and storage (the brief's expectation); extra facts: still paused in all three, `plannedMs` 30 min in all three.
- (c) A's second brew running in A, B and storage with the same `sessionId` and `endsAt`, 25 min, B on `#/focus`; exactly one record for brew 1 in `kettle:progress`, in A's memory and in B's memory; no record for brew 2.
- (d) after B's Pause: paused and agreeing in A, B and storage; after B's +5: 30 min everywhere and still paused; after B's End: idle everywhere; one record for brew 1; one for brew 2; two records in total.

### 6a. Counts per case (pass = every criterion of the case met in that iteration)

| Case | :5591 fix | :5560 control (no guard) | What the control showed |
|---|---|---|---|
| (a) pause | **5 of 5** | 0 of 5 | the pause is saved with B's 25-min plan: A's +5 lost (`plannedMs` 25 min in A, B and storage); every other criterion (paused, same session, agreement) met 5 of 5 |
| (b) add 5 | **5 of 5** | 0 of 5 | session and agreement met 5 of 5 and the +5 applied 5 of 5, but the brew is **running** again (B's +5 un-paused it) 5 of 5; the fix keeps it paused |
| (c) end | **5 of 5** | 0 of 5 | A's second brew **gone**: A, B and storage `idle`, B on `#/`; one record for brew 1 (5 of 5) |
| (d) no hold | **5 of 5** | 5 of 5 | identical to the fix |
| (e) add 5 on a replaced brew | **5 of 5** | 0 of 5 | B's +5 puts the **ended brew 1** back, running with 30 min, over A's brew 2, in A, B and storage |

Totals: **:5591 25 of 25, :5560 5 of 25** (all five in (d)). Runs: `runs/manual-2tab-5591.log.txt` (18:07:14 to 18:15:35; load average 12.3 at the start, 10.8 at the end; 8 to 15 between) and `runs/manual-2tab-5560.log.txt` (18:30:49 to 18:38:12; load 18.3 at the start, 10.7 at the end). A one-iteration trial of the script on :5591 beforehand (`runs/smoke-2tab-5591.log.txt`, 5 of 5; not counted) was used to check the script. Per-iteration JSON and the screenshots of both tabs at the end of iteration 1 of each case are in `manual/`.

### 6b. The "+5 min" note on the Focus screen when a +5 was dropped (case e, optional)
- **:5591**: 5 of 5 show the note `5 min · whistles at HH:MM now` after B's click although nothing was added. The time in it is the **current brew's real end** (iteration 1: 6:40 PM = brew 2's `endsAt` 18:40:26 UTC), not an end 5 minutes later. The storage string was byte-identical before and after B's click (5 of 5), B went on showing brew 2 on `#/focus`.
- **:5560**: the note shows the end of the resurrected brew 1 with the +5 (iteration 1: 7:06 PM = 19:06:13 UTC, 30 min from its start).

### 6c. After each iteration: A, B and storage (status, last 4 of `sessionId`, planned length, `endsAt`)

`[brew 1]` / `[brew 2]` marks which of the two brews the `sessionId` is, where there were two. "storage" is `kettle:timer` read from A and read from B (the same in every row). Records: brew 1 / brew 2, in storage; in A's memory; in B's memory.

#### fix-5591

| case | iterations | pass | fail | exceptions | page errors |
|---|---|---|---|---|---|
| (a) pause | 5 | 5 | 0 | 0 | 0 |
| (b) add 5 | 5 | 5 | 0 | 0 | 0 |
| (c) end | 5 | 5 | 0 | 0 | 0 |
| (d) no hold | 5 | 5 | 0 | 0 | 0 |
| (e) add 5 on a replaced brew | 5 | 5 | 0 | 0 | 0 |

**(a) pause**, criteria met (of 5): precondition_B_behind 5; paused_in_A 5; paused_in_B 5; paused_in_storage 5; same_session_A_B_storage 5; kept_plus5_A_B_storage 5; A_B_storage_agree 5; remaining_gt_planned_minus_2min 5

| it | result | A (memory) | B (memory) | storage (read in A) | storage (read in B) | records for brew 1 / 2 (storage; A; B) | failed criteria |
|---|---|---|---|---|---|---|---|
| 1 | pass | paused ebce 30m null | paused ebce 30m null | paused ebce 30m null | paused ebce 30m null | 0/-; 0/-; 0/- | - |
| 2 | pass | paused c224 30m null | paused c224 30m null | paused c224 30m null | paused c224 30m null | 0/-; 0/-; 0/- | - |
| 3 | pass | paused 3642 30m null | paused 3642 30m null | paused 3642 30m null | paused 3642 30m null | 0/-; 0/-; 0/- | - |
| 4 | pass | paused 7615 30m null | paused 7615 30m null | paused 7615 30m null | paused 7615 30m null | 0/-; 0/-; 0/- | - |
| 5 | pass | paused 83df 30m null | paused 83df 30m null | paused 83df 30m null | paused 83df 30m null | 0/-; 0/-; 0/- | - |

**(b) add 5**, criteria met (of 5): precondition_B_behind 5; same_session_A_B_storage 5; A_B_storage_agree 5; still_paused_A_B_storage 5; plus5_applied_A_B_storage 5

| it | result | A (memory) | B (memory) | storage (read in A) | storage (read in B) | records for brew 1 / 2 (storage; A; B) | failed criteria |
|---|---|---|---|---|---|---|---|
| 1 | pass | paused 4b52 30m null | paused 4b52 30m null | paused 4b52 30m null | paused 4b52 30m null | 0/-; 0/-; 0/- | - |
| 2 | pass | paused aa24 30m null | paused aa24 30m null | paused aa24 30m null | paused aa24 30m null | 0/-; 0/-; 0/- | - |
| 3 | pass | paused 0ccb 30m null | paused 0ccb 30m null | paused 0ccb 30m null | paused 0ccb 30m null | 0/-; 0/-; 0/- | - |
| 4 | pass | paused 9447 30m null | paused 9447 30m null | paused 9447 30m null | paused 9447 30m null | 0/-; 0/-; 0/- | - |
| 5 | pass | paused 3264 30m null | paused 3264 30m null | paused 3264 30m null | paused 3264 30m null | 0/-; 0/-; 0/- | - |

**(c) end**, criteria met (of 5): precondition_B_behind 5; brew2_running_A_B_storage 5; A_B_storage_agree 5; brew2_not_extended_or_ended 5; B_shows_focus 5; records_brew1_exactly_one_stored 5; records_brew1_exactly_one_A_memory 5; records_brew1_exactly_one_B_memory 5; no_record_for_brew2 5

| it | result | A (memory) | B (memory) | storage (read in A) | storage (read in B) | records for brew 1 / 2 (storage; A; B) | failed criteria |
|---|---|---|---|---|---|---|---|
| 1 | pass | running 0af1 [brew 2] 25m 1792262184266 | running 0af1 [brew 2] 25m 1792262184266 | running 0af1 [brew 2] 25m 1792262184266 | running 0af1 [brew 2] 25m 1792262184266 | 1/0; 1/0; 1/0 | - |
| 2 | pass | running 6228 [brew 2] 25m 1792262211016 | running 6228 [brew 2] 25m 1792262211016 | running 6228 [brew 2] 25m 1792262211016 | running 6228 [brew 2] 25m 1792262211016 | 1/0; 1/0; 1/0 | - |
| 3 | pass | running ea2a [brew 2] 25m 1792262233110 | running ea2a [brew 2] 25m 1792262233110 | running ea2a [brew 2] 25m 1792262233110 | running ea2a [brew 2] 25m 1792262233110 | 1/0; 1/0; 1/0 | - |
| 4 | pass | running 4155 [brew 2] 25m 1792262247277 | running 4155 [brew 2] 25m 1792262247277 | running 4155 [brew 2] 25m 1792262247277 | running 4155 [brew 2] 25m 1792262247277 | 1/0; 1/0; 1/0 | - |
| 5 | pass | running b7ba [brew 2] 25m 1792262264379 | running b7ba [brew 2] 25m 1792262264379 | running b7ba [brew 2] 25m 1792262264379 | running b7ba [brew 2] 25m 1792262264379 | 1/0; 1/0; 1/0 | - |

**(d) no hold**, criteria met (of 5): paused_in_A_and_B_after_B_pause 5; plus5_in_A_B_storage 5; still_paused_after_plus5 5; brew1_ended_idle_in_A_B_storage 5; brew1_one_record_everywhere 5; brew2_one_record_everywhere 5; final_idle_A_B_storage_agree 5; exactly_two_records_total 5

| it | result | A (memory) | B (memory) | storage (read in A) | storage (read in B) | records for brew 1 / 2 (storage; A; B) | failed criteria |
|---|---|---|---|---|---|---|---|
| 1 | pass | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 1/1; 1/1; 1/1 | - |
| 2 | pass | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 1/1; 1/1; 1/1 | - |
| 3 | pass | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 1/1; 1/1; 1/1 | - |
| 4 | pass | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 1/1; 1/1; 1/1 | - |
| 5 | pass | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 1/1; 1/1; 1/1 | - |

**(e) add 5 on a replaced brew**, criteria met (of 5): precondition_B_behind 5; brew2_running_A_B_storage 5; A_B_storage_agree 5; brew2_not_extended_or_ended 5; B_shows_focus 5; storage_byte_identical_after_B_click 5

| it | result | A (memory) | B (memory) | storage (read in A) | storage (read in B) | records for brew 1 / 2 (storage; A; B) | failed criteria |
|---|---|---|---|---|---|---|---|
| 1 | pass | running 712c [brew 2] 25m 1792262426915 | running 712c [brew 2] 25m 1792262426915 | running 712c [brew 2] 25m 1792262426915 | running 712c [brew 2] 25m 1792262426915 | 1/0; 1/0; 1/0 | - |
| 2 | pass | running 931b [brew 2] 25m 1792262454345 | running 931b [brew 2] 25m 1792262454345 | running 931b [brew 2] 25m 1792262454345 | running 931b [brew 2] 25m 1792262454345 | 1/0; 1/0; 1/0 | - |
| 3 | pass | running 810e [brew 2] 25m 1792262479840 | running 810e [brew 2] 25m 1792262479840 | running 810e [brew 2] 25m 1792262479840 | running 810e [brew 2] 25m 1792262479840 | 1/0; 1/0; 1/0 | - |
| 4 | pass | running c64c [brew 2] 25m 1792262500925 | running c64c [brew 2] 25m 1792262500925 | running c64c [brew 2] 25m 1792262500925 | running c64c [brew 2] 25m 1792262500925 | 1/0; 1/0; 1/0 | - |
| 5 | pass | running 1eab [brew 2] 25m 1792262520444 | running 1eab [brew 2] 25m 1792262520444 | running 1eab [brew 2] 25m 1792262520444 | running 1eab [brew 2] 25m 1792262520444 | 1/0; 1/0; 1/0 | - |


#### control-5560

| case | iterations | pass | fail | exceptions | page errors |
|---|---|---|---|---|---|
| (a) pause | 5 | 0 | 5 | 0 | 0 |
| (b) add 5 | 5 | 0 | 5 | 0 | 0 |
| (c) end | 5 | 0 | 5 | 0 | 0 |
| (d) no hold | 5 | 5 | 0 | 0 | 0 |
| (e) add 5 on a replaced brew | 5 | 0 | 5 | 0 | 0 |

**(a) pause**, criteria met (of 5): precondition_B_behind 5; paused_in_A 5; paused_in_B 5; paused_in_storage 5; same_session_A_B_storage 5; kept_plus5_A_B_storage 0; A_B_storage_agree 5; remaining_gt_planned_minus_2min 5

| it | result | A (memory) | B (memory) | storage (read in A) | storage (read in B) | records for brew 1 / 2 (storage; A; B) | failed criteria |
|---|---|---|---|---|---|---|---|
| 1 | FAIL | paused d028 25m null | paused d028 25m null | paused d028 25m null | paused d028 25m null | 0/-; 0/-; 0/- | kept_plus5_A_B_storage |
| 2 | FAIL | paused 0282 25m null | paused 0282 25m null | paused 0282 25m null | paused 0282 25m null | 0/-; 0/-; 0/- | kept_plus5_A_B_storage |
| 3 | FAIL | paused 5e60 25m null | paused 5e60 25m null | paused 5e60 25m null | paused 5e60 25m null | 0/-; 0/-; 0/- | kept_plus5_A_B_storage |
| 4 | FAIL | paused ab43 25m null | paused ab43 25m null | paused ab43 25m null | paused ab43 25m null | 0/-; 0/-; 0/- | kept_plus5_A_B_storage |
| 5 | FAIL | paused aa79 25m null | paused aa79 25m null | paused aa79 25m null | paused aa79 25m null | 0/-; 0/-; 0/- | kept_plus5_A_B_storage |

**(b) add 5**, criteria met (of 5): precondition_B_behind 5; same_session_A_B_storage 5; A_B_storage_agree 5; still_paused_A_B_storage 0; plus5_applied_A_B_storage 5

| it | result | A (memory) | B (memory) | storage (read in A) | storage (read in B) | records for brew 1 / 2 (storage; A; B) | failed criteria |
|---|---|---|---|---|---|---|---|
| 1 | FAIL | running 2e46 30m 1792263715192 | running 2e46 30m 1792263715192 | running 2e46 30m 1792263715192 | running 2e46 30m 1792263715192 | 0/-; 0/-; 0/- | still_paused_A_B_storage |
| 2 | FAIL | running e377 30m 1792263729734 | running e377 30m 1792263729734 | running e377 30m 1792263729734 | running e377 30m 1792263729734 | 0/-; 0/-; 0/- | still_paused_A_B_storage |
| 3 | FAIL | running 3d1b 30m 1792263737871 | running 3d1b 30m 1792263737871 | running 3d1b 30m 1792263737871 | running 3d1b 30m 1792263737871 | 0/-; 0/-; 0/- | still_paused_A_B_storage |
| 4 | FAIL | running 2895 30m 1792263748087 | running 2895 30m 1792263748087 | running 2895 30m 1792263748087 | running 2895 30m 1792263748087 | 0/-; 0/-; 0/- | still_paused_A_B_storage |
| 5 | FAIL | running c66f 30m 1792263754943 | running c66f 30m 1792263754943 | running c66f 30m 1792263754943 | running c66f 30m 1792263754943 | 0/-; 0/-; 0/- | still_paused_A_B_storage |

**(c) end**, criteria met (of 5): precondition_B_behind 5; brew2_running_A_B_storage 0; A_B_storage_agree 5; brew2_not_extended_or_ended 5; B_shows_focus 0; records_brew1_exactly_one_stored 5; records_brew1_exactly_one_A_memory 5; records_brew1_exactly_one_B_memory 5; no_record_for_brew2 5

| it | result | A (memory) | B (memory) | storage (read in A) | storage (read in B) | records for brew 1 / 2 (storage; A; B) | failed criteria |
|---|---|---|---|---|---|---|---|
| 1 | FAIL | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 1/0; 1/0; 1/0 | brew2_running_A_B_storage, B_shows_focus |
| 2 | FAIL | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 1/0; 1/0; 1/0 | brew2_running_A_B_storage, B_shows_focus |
| 3 | FAIL | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 1/0; 1/0; 1/0 | brew2_running_A_B_storage, B_shows_focus |
| 4 | FAIL | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 1/0; 1/0; 1/0 | brew2_running_A_B_storage, B_shows_focus |
| 5 | FAIL | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 1/0; 1/0; 1/0 | brew2_running_A_B_storage, B_shows_focus |

**(d) no hold**, criteria met (of 5): paused_in_A_and_B_after_B_pause 5; plus5_in_A_B_storage 5; still_paused_after_plus5 5; brew1_ended_idle_in_A_B_storage 5; brew1_one_record_everywhere 5; brew2_one_record_everywhere 5; final_idle_A_B_storage_agree 5; exactly_two_records_total 5

| it | result | A (memory) | B (memory) | storage (read in A) | storage (read in B) | records for brew 1 / 2 (storage; A; B) | failed criteria |
|---|---|---|---|---|---|---|---|
| 1 | pass | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 1/1; 1/1; 1/1 | - |
| 2 | pass | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 1/1; 1/1; 1/1 | - |
| 3 | pass | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 1/1; 1/1; 1/1 | - |
| 4 | pass | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 1/1; 1/1; 1/1 | - |
| 5 | pass | idle - 25m null | idle - 25m null | idle - 25m null | idle - 25m null | 1/1; 1/1; 1/1 | - |

**(e) add 5 on a replaced brew**, criteria met (of 5): precondition_B_behind 5; brew2_running_A_B_storage 0; A_B_storage_agree 5; brew2_not_extended_or_ended 0; B_shows_focus 5; storage_byte_identical_after_B_click 0

| it | result | A (memory) | B (memory) | storage (read in A) | storage (read in B) | records for brew 1 / 2 (storage; A; B) | failed criteria |
|---|---|---|---|---|---|---|---|
| 1 | FAIL | running 61ea [brew 1] 30m 1792263973329 | running 61ea [brew 1] 30m 1792263973329 | running 61ea [brew 1] 30m 1792263973329 | running 61ea [brew 1] 30m 1792263973329 | 1/0; 1/0; 1/0 | brew2_running_A_B_storage, brew2_not_extended_or_ended, storage_byte_identical_after_B_click |
| 2 | FAIL | running 4860 [brew 1] 30m 1792264002925 | running 4860 [brew 1] 30m 1792264002925 | running 4860 [brew 1] 30m 1792264002925 | running 4860 [brew 1] 30m 1792264002925 | 1/0; 1/0; 1/0 | brew2_running_A_B_storage, brew2_not_extended_or_ended, storage_byte_identical_after_B_click |
| 3 | FAIL | running eb6e [brew 1] 30m 1792264026411 | running eb6e [brew 1] 30m 1792264026411 | running eb6e [brew 1] 30m 1792264026411 | running eb6e [brew 1] 30m 1792264026411 | 1/0; 1/0; 1/0 | brew2_running_A_B_storage, brew2_not_extended_or_ended, storage_byte_identical_after_B_click |
| 4 | FAIL | running 8378 [brew 1] 30m 1792264050712 | running 8378 [brew 1] 30m 1792264050712 | running 8378 [brew 1] 30m 1792264050712 | running 8378 [brew 1] 30m 1792264050712 | 1/0; 1/0; 1/0 | brew2_running_A_B_storage, brew2_not_extended_or_ended, storage_byte_identical_after_B_click |
| 5 | FAIL | running aa53 [brew 1] 30m 1792264073858 | running aa53 [brew 1] 30m 1792264073858 | running aa53 [brew 1] 30m 1792264073858 | running aa53 [brew 1] 30m 1792264073858 | 1/0; 1/0; 1/0 | brew2_running_A_B_storage, brew2_not_extended_or_ended, storage_byte_identical_after_B_click |


### 6d. The control again AFTER the integration change (`a1e3d04`, src `07df367`, Toast.tsx hook merge; still no guard)
`runs/manual-2tab-5560-after.log.txt`, 19:28:16 to 19:34:32, same script (`d3c8d64ef9a734c2`), cases a, b, c, e, 5 iterations each, label `control-5560-after`; load average 5.6 at the start, 19.4 at the end. **0 of 20**, with the same failed criteria as the run before the change: (a) +5 lost 5/5, (b) brew running again 5/5, (c) A's second brew gone 5/5 (idle in A, B, storage, B on `#/`), (e) the ended brew 1 back over brew 2, 5/5; one record for brew 1 in (c) 5/5. Tables: `manual/TABLE-control-5560-after.md`. Before-the-change control: section 6a (:5560 at `494748b`, 18:30 to 18:38). The two controls behave the same. (The orchestrator said the change landed "about 19:12"; the commit and file times on this machine are 19:02:16 to 19:02:59.)

### 6e. Extra case (f), added by me: pause in the lagging tab after A ended brew 1 and started brew 2
Same set-up as (c); B clicks Pause on its stale view of brew 1. Script `scripts/R2-2tab-v2.mjs` (= the script above plus case f; a to e unchanged). Logs `runs/manual-2tab-5591-f.log.txt` (19:34:33 to 19:36:38) and `runs/manual-2tab-5560-after-f.log.txt` (19:36:42 to 19:39:05, post-change control).
- **:5591: 5 of 5.** Brew 2 running, not paused, same `sessionId` and `endsAt` in A, B and storage; B on `#/focus`; one record for brew 1, none for brew 2.
- **:5560 (after the change): 0 of 5.** A, B and storage hold the **ended brew 1, paused** (25 min), over A's running brew 2; brew 1 still has its one record.
- Tables in `manual/TABLE-fix-5591-f.md` and `manual/TABLE-control-5560-after.md`.

## 7. Index and state at the stop (19:40 UTC)

| Check | Result on :5591 |
|---|---|
| 1 tsc, vitest | tsc exit 0; vitest 34 files, **338/338** |
| 2 timer-harness, timer-app, pwa | **29 passed, 2 skipped** (by design), 0 failed |
| 3 integrity | whole **25/25**; `:309` x10 **10/10** |
| 4 home and race | `w2-home` **18/18**; `w3-intention-race` 2/2 and `w3r2-stale-tab` 4/4 |
| 5 notice suites | **74/74** (notice-strip 25, w3-notices 9, w3-notices-idle 12, summary-notice 14, toast-room 14) |
| 6 2-tab, real clicks | (a) 5/5, (b) 5/5, (c) 5/5, (d) 5/5, (e) 5/5, (f, extra) 5/5; controls (:5560, before and after the change): (a) 0/5, (b) 0/5, (c) 0/5, (d) 5/5, (e) 0/5, (f) 0/5 after |

- No failure occurred in any :5591 run, so nothing was rerun or classified (the bundle script would have rerun a failure once on :5591 and once on :5560; `runs/failures.txt` was never created).
- Page errors: 0 in every 2-tab iteration. Composer-label quirk (words typed in tab 2 becoming the label): not seen in these runs (tab 2 never typed after a brew was running).
- Not run: :5593 preview, :5570, :5478, :5583. Nothing was killed with a pattern; explicit PIDs of mine killed: chain1 14439 and its waiting gate process 16685, chainX 21651.
