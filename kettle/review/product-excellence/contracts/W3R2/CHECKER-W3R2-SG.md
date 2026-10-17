# CHECKER W3R2 · SG: the stale-tab guard (Vibei W3R2 item 1)

*Written in stages; the verdict is at the end.*

| | |
|---|---|
| Lead checker | LEAD-5. I implemented none of this work. I recommended the receiving-side guard (`CHECKER-W3R1-F1FIX.md` §4) |
| Under review | `pe/w3r2-sync-guard@54a9721`, worktree `/home/user/wt/w8g`, src `dd6944e` |
| Trial | `88d6b64` = integration `339d85c` (app `5f78af1`) + `54a9721`; worktree `/home/user/wt/w8tr-g`. `git rev-parse 88d6b64:kettle/src` = `dd6944e` (checked). Dev **:5591** serves it: its `store.ts` has `actsOnCurrentBrew`, and pids 12454/12483 run in `/home/user/wt/w8tr-g/kettle` |
| Controls | :5560 (`494748b`, src `b74e6b3`); :5478 (`4d36939`) |
| Brief / decision | `BRIEF-SG.md`; `VB-DECISIONS-W3R2.md` §1 |
| Packet / gate | `contracts/W3R2/SG/SG-READY.md`; `review/GATE.md`, item 1 |
| My evidence | `contracts/W3R2/review/LEAD/SG/` |

## 1. Scope and the code (read in full)
**Scope.** `git diff --stat 494748b 54a9721` = `src/timer/store.ts` (+77/−2), `src/timer/sync.ts` (+48/−4), new `src/timer/staleTab.test.ts`, new `tests/w3r2-stale-tab.spec.ts`. No other file is touched.

**Write side** (`store.ts`):
- `onCurrentBrew` wraps every action of the store's object except `tick`, `reset`, `setIntention`, `syncIdleLength` and `toggle`. So the wrapped ones are `startFocus`, `startBreak`, `pause`, `resume`, `addTime`, `end` and `rebase`, plus any action added later.
- Each call first runs `catchUp`, which is `mirrorTimerFromStorage()`, installed by `initTabSync`. It then goes ahead only if `sessionId` is unchanged.
- When an action is dropped, the `behind` flag drops the rest of the same task. It is cleared by a microtask.
- Nested actions (`toggle` → `pause`; `startFocus` → `end`) pass the same check again. The storage is unchanged by then, so they go through.

**Receive side** (`sync.ts`):
- `mirrorTimerFromStorage` (every non-removal mirror) reads the stored timer (`readStoredTimer`, sanitised) before adopting it.
- If `olderThanMine(prev, incoming, knownEnded)`, the tab keeps its own state and saves it back whole (`useTimer.setState({})`). Otherwise it rehydrates as before.
- A removal follows the wipe through `followWipe()`.
- `reset()` now removes the key before it saves the idle kettle.

**"Newer"** uses existing fields only: `sessionId`, `lastEnded`, `startedAt`, `endsAt`, the progress records and the completions other tabs announced. **No stored field is added.**

**Unchanged:**
- `tick` and `ticker.ts`;
- the F1 fields-only saves;
- the composer.

The pre-completion refresh (`guard.refresh` → `mirrorTimerFromStorage`) now runs the receive rule. §4 (SG-D1) bears on this.

## 2. ◆ The per-trigger tests: fail on HEAD, pass on the fix (my runs)
**Vitest `staleTab.test.ts` (24 cases):**

| Tree | Result | Log |
|---|---|---|
| trial `88d6b64` (`w8tr-g`) | **24/24** | `LEAD/SG/vitest-staletab-trial.log.txt` |
| HEAD `494748b` (`git archive` of its `kettle/src`; `store.ts` byte-equal to HEAD's; the test file from `54a9721`) | **17 failed / 7 passed**. All 17 fail on a behaviour assertion. The 7 passing are #12, #15 and #19–23, exactly the maker's table | `LEAD/SG/vitest-staletab-on-HEAD-494748b.log.txt` |
| trial, all Vitest | **34 files, 338/338** | `LEAD/SG/vitest-all-trial.log.txt` |
| trial, `tsc --noEmit` | exit 0 | `LEAD/SG/tsc-trial.log.txt` |

- **Every trigger has a case that fails on HEAD and passes on the fix:** `rebase`, pause, resume, add 5, end, start, the doubly stale typed edit and the doubly stale pause.
- **The singly stale typed edit (#12) passes on HEAD too.** F1 already guards it; this is as the maker states.
- **The harness** is `intentionRace.test.ts`'s two-store harness: held events, plus `behindToo` for a stale copy of storage. It installs the catch-up the way `initTabSync` does; on HEAD that function is absent, so a tab acts on its own copy.

## 3. A gap in the receive rule: a brew another tab ended comes back (my probe; Vitest, the same harness)
**The maker's §7.2.2 says** a running brew held by a tab that missed every event (restored from the back/forward cache) "is excluded by the away rule". That holds only for a tab that wakes more than 10 s after the brew's planned end. **A tab restored before the planned end still holds the brew "under way"**, and the receive rule puts it back once nothing names it any more.

**Probe:** `LEAD/SG/lead5-probe.test.ts.txt`, the staleTab harness plus three cases. It was run on `git archive 494748b` (HEAD) and on `git archive 88d6b64` (trial); logs `lead5-probe-sg-head.log.txt` and `lead5-probe-sg-fix.log.txt`.

**Set-up, common to all three cases:**
1. A and Z are in step on brew X.
2. Z then misses every event, as a cached tab does.
3. A ends X at 0:30. Under a minute, so there is no record, and `lastEnded` = X.
4. A starts Y, and ends it 5 minutes later. Y has a record, and `lastEnded` = Y. Storage is idle.

| Case | HEAD `494748b` | Fix |
|---|---|---|
| (1) Z, the leader, ticks at X's planned end | pass: no completion; records [Y] | **FAIL: Z saves X back and completes it.** Records [Y, **X**]: a completed 25-minute record for a brew the person ended at 0:30 |
| (3) Z only receives A's next write (A types its next words, a fields-only save into the idle kettle) | pass: both tabs idle | **FAIL: Z puts X back, running, and A adopts it.** X runs in both tabs, and will complete as in (1) |
| (2) the person presses Pause in Z | FAIL: X comes back paused | FAIL: the same (the maker's §7.2.2) |

**Why the receive rule does this.** In `olderThanMine`, for Z's state X against the incoming idle state with `lastEnded` = Y:
- rule 1: nothing incoming is under way;
- rule 2: X has no record and no announced completion, and it is not 10 s past its end;
- rule 3: `lastEnded` names Y, not X;
- rule 4: an idle incoming state is "older". So Z saves X back.

On HEAD, Z simply adopts the idle kettle on a tick or a received event.

## 4. Rulings asked for
**1 · `multitab.test.ts:229` ("two tabs pressing start at the same time converge on one session"): adopt the maker's proposal (b), in the fix round.**
- **The edit (LEAD-ruled; this is the only change allowed in that file):**
  - its `openTab` installs the catch-up as `initTabSync` does: `sync.installActionCatchUp()`;
  - `expect(A.timer.getState().intention).toBe('from B')` becomes `.toBe('from A')`;
  - the comment `// B's write lands last` says instead that B can read A's brew, so its Start joins it.
- **This is not a weakening.**
  - The test as it is passes only because its harness lacks what the app always installs, so it pins a path the app no longer has.
  - Under Vibei's rule, a Start in a tab that can see a running brew joins it.
  - The changed assertion is exactly as strict as before.
  - Every other assertion in the file still holds: one session id, one completion, one record (the maker's scratch run: 15/15).
  - The doubly stale start, where neither tab can see the other, stays pinned by `staleTab` #20.

**2 · `reset()` removes the key before saving the idle kettle: ACCEPTED.**
- It keeps the receive guard from taking a wipe for a stale tab's idle write.
- Other tabs follow the wipe through `followWipe()`, which writes the same idle state their `reset()` wrote before.
- The stored bytes after a reset are identical on all three builds (maker §4; my compat run below).
- `resetAllData` is its only app caller.

**3 · The open items (packet §7):**

| Item | Class | Why |
|---|---|---|
| §7.2.1 same brew, older fields, doubly stale (A's +5 lost when Z pauses from an old read) | **FOLLOW-UP** | Present on HEAD, where the doubly stale save loses it the same way; not worse. With a current read, the write side now keeps the +5 (#2). Closing it needs a stored version field, which the brief rules out: that is Vibei's call |
| §7.2.2 a tab that missed every event (bfcache), **paused** brew, the person acts there | **FOLLOW-UP** (pre-existing: my probe (2) fails on HEAD too) | The **running** variant is introduced: **SG-D1** below. The fix for SG-D1 should cover this one too |
| §7.3 `flow.ts` `startNextBrew` leaves `suppressNextStop` set when the lagging tab's `end` is dropped | **BLOCKS: SG-D2** | Worsened. A new, user-reachable trigger (both tabs press "Next brew" within the lag) for a flag leak that HEAD had only at 0:00. The next local stop in that tab then loses its "Saved … of focus" toast and the way home |
| §7.3 Focus "+5 min · whistles at …" shown, and the pause / resume sound played, when the store dropped the action | **BLOCKS: SG-D3** | Introduced. The note tells the person a +5 was added when it was not. The pause/resume sound is chosen by the outcome. (The button's generic press sound is press feedback: ACCEPTED) |
| §7.4 the composer label | **FOLLOW-UP** (logged only, per Vibei; for the Final Boss) | Unchanged and pinned by #22 |

## 5. ◆ Browser reruns (my runs, through the gate, `--lane LEAD`)
Tests from the trial tree. Logs in `LEAD/SG/`.

| Run | Result | Log |
|---|---|---|
| `w3r2-stale-tab.spec.ts` on HEAD :5560 ×1 | **4/4 FAIL** at Z's action: pause "paused: the same brew, with A's +5"; add 5 and end "Z now shows the current brew"; start: Z runs its own brew | `stale-tab-HEAD-5560-x1.log.txt` |
| the same on the trial :5591 ×2 | **8/8** | `stale-tab-trial-5591-x2.log.txt` |
| compatibility, HEAD :5560 → trial :5591 (the maker's F1FIX-based script, unchanged, `compat.spec.ts.txt`) | **3/3** (idle, paused, reset). In-memory state equals the stored state field by field, and the bytes are identical after boot | `compat-5560-to-5591.log.txt` |
| compatibility, trial :5591 → HEAD :5560 | **3/3**, byte-identical | `compat-5591-to-5560.log.txt` |
| `integrity:309` ×20, `--workers=2`, plus 6 CPU burners (PIDs 21836–21841, started and killed by PID, `burners.txt`), load 9.5 → 14.4 | **20/20** (3.9 min) | `stress-309-x20-trial-5591.log.txt` |

**Lane R2** (`review/R2/RECEIPT-R2.md`; read as far as it stood at about 19:05, with its last section due 19:45):
- tsc 0; Vitest 338/338; race specs on :5591 6/6.
- **2-tab real-click check:** pause, add 5, end, add 5 on a replaced brew, and no hold. **25/25** on :5591; on :5560, **5/25**, with only the no-hold case passing.
- This agrees with my reruns. The rest of R2's receipt goes into the fix-round review.

## Defect packet: one 90-minute fix round
**SG-D1 · BLOCKS (introduced). The receive rule, and the catch-up that runs it, puts back a brew another tab has already ended, once neither a record nor `lastEnded` names it.**
- **Shown by** `LEAD/SG/lead5-probe.test.ts.txt` (§3):
  - (1) A tab that missed the events and leads at the brew's planned end saves the brew back and completes it. The result is a 25-minute record for a brew the person ended at 0:30.
  - (3) The same tab, on any later write, puts the brew back running in both tabs.
  - Both pass on HEAD and fail on `54a9721`.
- **Required:**
  - A brew another tab has ended is never put back by `olderThanMine` or the catch-up, and never completed by this tab. That holds whether or not a record exists or `lastEnded` still names it.
  - Every doubly stale case must still restore: #13, #14, #16, #17 and #24.
  - Existing fields only; the storage format stays unchanged.
- **A signal the maker can test** (a suggestion, not a mandate): the incoming state proves a later timeline than this tab's brew. For example, its `lastEnded.at`, or its brew's `startedAt`, is later than this brew's `startedAt`. A writer that saw time after this brew began cannot be the stale tab, whereas the doubly stale copies in #13 and #16 carry a `lastEnded` from before.
- **Tests:**
  - Add my probes (1), (2) and (3) to `staleTab.test.ts`, with the comments tidied as the maker likes. (1) and (3) must fail on `54a9721` and pass on the fix.
  - (2) is pre-existing; it should pass with the same rule. If it cannot, say why in the packet.
  - All 24 existing cases stay green.

**SG-D2 · BLOCKS (worsened). `src/app/flow.ts` `startNextBrew` leaves `suppressNextStop` set when the lagging tab's `end('skip')` is dropped.**
- In a lagging tab where the other tab has already pressed "Next brew", the next local stop loses its "Saved … of focus" toast and its way home.
- **Fix:** clear the flag when that `end` did not stop the brew. **Scope widened for this round to `src/app/flow.ts`, for this flag only.**
- **Test:** Vitest, or a case in `w3r2-stale-tab.spec.ts`. After the joined brew is ended locally in that tab, the toast is raised and the tab goes home.

**SG-D3 · BLOCKS (introduced). When the store drops a Focus action, the person is still told it happened.** The "+5 min · whistles at …" note shows, and the pause/resume sound plays.
- **Fix:** show the note and play that sound only when the action applied.
  - The store may report whether it applied (for example, the wrapped action returns `false` when dropped).
  - **Scope widened for this round to `src/screens/focus/FocusScreen.tsx`'s `addFive` and `toggle` only.**
  - The button's generic press sound stays.
- **Test:** in `w3r2-stale-tab.spec.ts`'s add 5 case, no "+5 min" note in Z.

**In the same round:**
- the `multitab.test.ts` edit ruled in §4.1;
- re-run the maker's own proof on the final code: Vitest all, the stale-tab spec on HEAD and on the fix, `integrity:309` ×20 under load, and compatibility.

## Verdict: **REJECT** `pe/w3r2-sync-guard@54a9721` (src `dd6944e`). Three defects (SG-D1, SG-D2, SG-D3), with one 90-minute fix round
**What holds:**
- The design is sound: one write-side entry that every action passes, and one receive-side rule from existing fields.
- Every trigger fails on HEAD and passes on the fix (Vitest 17/24 on HEAD → 24/24; browser 4/4 → 8/8).
- Storage is compatible both ways, byte-identical.
- `integrity:309` passes 20/20 under load.

**What blocks:**
- **SG-D1:** the receive rule can resurrect, and then complete, a brew another tab ended. That is a new false record, which the brief's "exactly-once records" forbids.
- **SG-D2 and SG-D3:** two smaller user-visible side effects of the new "refresh first" path.

**Rulings:** `multitab.test.ts` (b) in the fix round; `reset()` ACCEPTED; open items as in §4.

*Run logs:* `.log` files are git-ignored, so mine are committed as `.log.txt` in `review/LEAD/SG/`. Scratch trees (`git archive` of `494748b` and of `88d6b64`) and my compat copy are in my scratchpad and in the git-ignored `/home/user/wt/w8tr-g/kettle/.tmp/lead5-sg/`.

## 6. Fix round: `pe/w3r2-sync-guard@4b2690f` (src `8a67658`), trial 2 `2c9ec66`
| | |
|---|---|
| Revision | `4b2690f`, one commit on `54a9721`. Packet `SG-READY.md` §8; logs `SG/logs/r2/` |
| Trial 2 | `2c9ec66` = integration `d8749ad` (app `7cb3242`, TH merged) + `4b2690f`; worktree `/home/user/wt/w8tr-g2`; src `5f504d4`. Dev **:5601** serves it: `sync.ts` has `theirEnd`, `flow.ts` has the flag reset, `Toast.tsx` has `layerLeaving`, and pids 27525/27564 run in `w8tr-g2` |
| Controls | :5560 = `/home/user/wt/w6-int` (src `07df367`: TH merged, no guard; its `sync.ts` has no `olderThanMine`; the timer directory is the same as `494748b`'s); :5591 = the first fix `54a9721` |
| My evidence | `review/LEAD/SG/r2/` |

### ◆ Scope, and the code (read in full)
`git diff --stat 54a9721 4b2690f`:
- `sync.ts` +8/−1;
- `store.ts` +17/−12;
- `flow.ts` +4;
- `FocusScreen.tsx` +6/−3;
- `multitab.test.ts` +4/−2;
- `staleTab.test.ts` +72;
- `w3r2-stale-tab.spec.ts` +41.

**Exactly the round's permitted scope.**

**SG-D1, the new rule 4 in `olderThanMine`.** When storage's `lastEnded` is not this tab's own and was made after this brew's `startedAt`, the tab adopts storage: it neither saves its brew back nor completes it.
- **Probes (1) and (3) are covered.** Their writer ended Y after X began, and this tab never knew Y.
- **The doubly stale copies still restore.**
  - #13, #14, #16 and #24 carry this tab's own `lastEnded`, or an older one ended before X began.
  - #17 and #18 are decided by rule 1 first.
  - A stale tab ending its old brew writes the end this tab already knew; that is the new case "still restored".
- **Existing fields only.**
- **The catch-up runs the same rule.** So probe (2), the pause, is now dropped too, and the tab shows the idle kettle. That also closes the paused bfcache variant I had left as a FOLLOW-UP.
- **One residual case: a brew this tab never knew** (two Starts in two tabs within the lag, neither seeing the other), ended in the other tab later. This tab then adopts that end. That is consistent with the accepted doubly stale start (#20), where the later start already wins.

**SG-D2 (`flow.ts`).**
- `suppressNextStop = false` right after `t.end('skip')`.
- `end` emits `timer:stop` synchronously (`lib/events.ts` `emit`), and the handler takes the flag there. So the reset only matters when that end did not stop the brew: a dropped end, or HEAD's 0:00 case.
- In a single tab nothing changes.

**SG-D3 (`store.ts`, `FocusScreen.tsx`).**
- The wrapped actions return `false` when they are dropped (`Acted = void | false`), and `toggle` returns what `pause` or `resume` returned.
- `addFive` sets the note only when `addTime` did not return `false`, and `toggle` plays its sound only when `toggle` did not.
- In a single tab nothing changes: the actions return `undefined`.

**`multitab.test.ts`: exactly the ruled edit** (catch-up installed; `'from A'`; the comment).

### ◆ Vitest (my runs)
| Run | Result | Log |
|---|---|---|
| `staleTab.test.ts` (28) on trial 2 | **28/28** | `r2/vitest-staletab-trial2.log.txt` |
| the same file on `git archive 88d6b64` (src = `54a9721`) | **3 failed / 25 passed**: exactly probes (1), (2) and (3) | `r2/vitest-staletab-new-on-54a9721.log.txt` |
| the same file on `git archive 7cb3242` (integration HEAD; its timer directory equals `494748b`'s) | **19 failed / 9 passed** | `r2/vitest-staletab-new-on-HEAD-7cb3242.log.txt` |
| **my own probe file, unchanged from §3**, on `git archive 2c9ec66` | **3/3**: no completion of X; storage stays idle after Pause; storage, A and Z stay idle after the later write | `r2/lead5-probe-on-trial2.log.txt` |
| `multitab`, `intentionRace`, `store`, `storageFull` on trial 2 | **71/71** | `r2/vitest-existing-race-trial2.log.txt` |
| Vitest, all, on trial 2 | **34 files, 342/342** | `r2/vitest-all-trial2.log.txt` |
| tsc on trial 2 | exit 0 | `r2/tsc-trial2.log.txt` |

### ◆ Browser reruns (my runs, through the gate, `--lane LEAD --n 2`; tests from trial 2)
| Run | Result | Log |
|---|---|---|
| `w3r2-stale-tab.spec.ts` (5 cases) on HEAD :5560 ×1 | **5/5 FAIL**, each at Z's action: pause "with A's +5"; add 5 and end "Z now shows the current brew"; Next brew "Z joined A's brew"; start | `r2/stale-tab-HEAD-5560-x1.log.txt` |
| the same on the first fix :5591 (`54a9721`) ×1 | **2 FAIL**, exactly SG-D3 ("no “+5 min · whistles at …” note in Z") and SG-D2 ("the stop's toast in Z", not found). The other 3 pass | `r2/stale-tab-firstfix-5591-x1.log.txt` |
| the same on trial 2 :5601 ×2 | **10/10** | `r2/stale-tab-trial2-5601-x2.log.txt` |
| compatibility HEAD :5560 → :5601, and :5601 → :5560 (the same script as §5) | **3/3 + 3/3**; in-memory state equals storage, bytes identical after boot | `r2/compat-*.log.txt` |
| `integrity:309` ×20, `--workers=2`, plus 6 CPU burners (PIDs 17247–17252, killed by PID), load 4.8 → 9.5 | **20/20** (3.8 min) | `r2/stress-309-x20-trial2-5601.log.txt` |

**Lane R2's receipt for the first trial :5591** (`review/R2/RECEIPT-R2.md`, read in full):
- tsc 0; Vitest 338/338;
- timer-harness, timer-app and `pwa`: 29 passed + 2 skipped by design;
- integrity 25/25, and `:309` ×10 10/10;
- race and stale-tab specs 6/6; `w2-home` 18/18;
- notice suite 74/74;
- 2-tab real clicks: 25/25 on the fix vs 5/25 on :5560.

Its §6b recorded SG-D3 on :5591 (the note shown, 5/5), which the fix round removes. Nothing else in it needs a rerun to be classified.

### Residuals after the fix round
| Item | Class |
|---|---|
| §7.2.1 the same brew with older fields while doubly stale (a +5 lost) | **FOLLOW-UP** (pre-existing, not worse; closing it needs a stored version field: Vibei's call) |
| §7.2.2 the bfcache **paused** variant | **closed** by SG-D1's rule (probe (2) passes on trial 2) |
| a brew this tab never knew, ended in the other tab later (two Starts within the lag): this tab adopts that end | **ACCEPTED** (the same class as the accepted doubly stale start, #20) |
| §7.4 the composer label | **FOLLOW-UP** (logged only, per Vibei) |

## Final verdict: **APPROVE** `pe/w3r2-sync-guard@4b2690f` (src `8a67658`), as gated in trial 2 `2c9ec66`
**Defects closed:**
- **SG-D1 (an ended brew coming back and completing):** closed. My unchanged probe passes 3/3. The new file fails 3 cases on `54a9721` and 19 on HEAD, and passes 28/28 on the fix. Every doubly stale restore holds.
- **SG-D2 (the Next brew flag):** closed. The browser case fails on `54a9721` and passes 2/2 on the fix.
- **SG-D3 (the "+5 min" note and pause sound on a dropped action):** closed. The browser case fails on `54a9721` and passes 2/2 on the fix.
- **`multitab.test.ts`:** exactly the ruled edit.

**Holding on the final code:**
- every trigger fails on HEAD and passes on the fix;
- storage compatible both ways, byte-identical;
- `integrity:309` 20/20 under load;
- Vitest 342/342, tsc 0.

**Before merge, a Lane R2 rerun on :5601 is required, and any failure there comes back to me.** The fix round changed single-tab code (`app/flow.ts` "Next brew", and `FocusScreen.tsx` pause / +5). Also, :5601 is the first build with TH and SG together, and R2's regression ran on the first trial, without either. The rerun:
- timer-harness, timer-app and `pwa`;
- `integrity` whole, plus `:309` ×10;
- `w2-home`;
- the race and stale-tab specs;
- the notice suite;
- the 2-tab real-click check (a)–(e), where (e) must now show no "+5 min" note.

The one fix round is spent. Any change to the branch after this invalidates the approval.

*Run logs:* mine are in `review/LEAD/SG/r2/` as `.log.txt`. Scratch trees (`git archive` of `7cb3242`, `88d6b64` and `2c9ec66`) are in my scratchpad; my compat copy is in the git-ignored `/home/user/wt/w8tr-g2/kettle/.tmp/lead5-sg/`.

### Addendum: Lane R2's rerun on trial 2, and the `pwa.spec.ts:85` failure (ruling)
**R2's rerun on :5601 is green except `pwa.spec.ts:85`:**
- tsc 0; Vitest 342/342;
- integrity 25/25, and `:309` ×10 10/10;
- race and stale-tab 7/7; `w2-home` 18/18;
- notice suites 74/74;
- 2-tab real clicks (a)–(g) 5/5 each. In (e) no "+5 min" note shows (strict observer), and in (f) no pause sound plays on a dropped action.

**`pwa:85`: ENVIRONMENT ARTIFACT, not a defect.**
- **The mechanism is in the spec itself.**
  - `pwa.spec.ts` builds its own worktree into `test-results/pwa-dist` and spawns `vite preview --strictPort` on `KETTLE_PWA_PORT`.
  - Its readiness check is only "`fetch(BASE)` is ok". So when another worktree's leftover preview holds the port, the new preview exits and the tests run against the stale build.
  - The update test edits *its own* `sw.js`, so `needRefresh` never comes. That is the timeout at :91 that R2 saw on :5601 and on its ":5560" run alike; the PWA test ignores `KETTLE_PORT`.
- **My verified rerun** (`r2/pwa-trial2-clean-port-5495.log.txt`, through the gate):
  - trial 2 `2c9ec66` (src `5f504d4`, 0 dirty files);
  - port 5495 checked free before the run;
  - the serving process recorded during the run was trial 2's own preview of its own `test-results/pwa-dist` (`…listener.txt`);
  - **3/3 passed**, with the update test in 4.0 s;
  - my leftover preview (PID 27011, `w8tr-g2`) was killed by PID, and the port was free afterwards.
- **FOLLOW-UP (timer/PWA owner):**
  - `pwa.spec.ts` should refuse a port that is already answering before it spawns, or check that the server it reaches is its own;
  - its `afterAll` kills only the `npx` wrapper, which leaves the node preview behind.

**Strays and earlier PWA results:**
- The maker's "pwa 3/3" (preview :5597) and R2's first-pass PWA result (trial 1) cannot be shown to have run against their own builds. **They are superseded for the merge by the verified run above.**
- None of my own TH or SG checks used the PWA project, so they are unaffected.

**The SG APPROVE stands; SG can merge.**
