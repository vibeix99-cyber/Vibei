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
