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
