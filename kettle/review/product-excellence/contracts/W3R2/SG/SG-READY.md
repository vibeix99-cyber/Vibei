# SG: the stale-tab guard (W3R2 item 1). Packet, in stages

| | |
|---|---|
| Brief | `contracts/W3R2/BRIEF-SG.md`; binding `VB-DECISIONS-W3R2.md` §1; background `W3R1/CHECKER-W3R1-F1FIX.md` §4, §7–§9, `W3R1/F1FIX/F1FIX-READY.md`, `W3R1/review/F1-ROOT-CAUSE.md` |
| Branch | `pe/w3r2-sync-guard`, worktree `/home/user/wt/w8g`, base `494748b` (app `5f78af1`, src `b74e6b3`). Local commits only, never pushed |
| **Head** | **`54a9721` (src `dd6944e`)**. Commits: `c917293` the guard + `staleTab.test.ts`; `e18b621` the "away" rule (§1.2, 2.) + `tests/w3r2-stale-tab.spec.ts` (app code final here, src `0fafc69`); `54a9721` one more Vitest case (three tabs), test only |
| Scope | `git diff --stat 494748b 54a9721`: `src/timer/store.ts` +77/−2, `src/timer/sync.ts` +48/−4, new `src/timer/staleTab.test.ts`, new `tests/w3r2-stale-tab.spec.ts`. Nothing else: no `Composer.tsx`, `src/ui`, `src/screens`, `multitab.test.ts`, `intentionRace.test.ts`, `w3-intention-race.spec.ts`, `integrity.spec.ts` or `timer.spec.ts` change |
| Dev | :5581 (HMR) serves the branch. Checked by blob hash of `src/timer/store.ts` and `sync.ts` (and `verify.sh`): `PORT 5581 serves c917293 (src f88ab8a): VERIFIED`; re-checked before each browser run (§3) |
| Controls | :5560 integration = HEAD `494748b` (its `store.ts` and `sync.ts` blobs equal HEAD's, checked); :5478 old base `4d36939` |
| Evidence | `SG/logs/*.log.txt`, `SG/scripts/*.txt` |

**Status: READY for LEAD.** All of the brief's proof is in (§3–§6). One existing-test question is for LEAD to rule (§7.1); residuals are in §7.2–§7.4.

**Summary of the proof:**
- **Vitest:** 24 cases, 17 FAIL on HEAD `494748b`, 24/24 on the fix. Every trigger fails on HEAD and passes on the fix, except the singly stale typed edit, which F1 already guards.
- **Browser** (real clicks in the lagging tab): pause, add 5, end and start fail **12/12** on :5560, fail 4/4 on :5478, and pass **12/12** plus 4/4 on the fix.
- **Existing race tests** green.
- **Compatibility:** byte-identical both ways (12/12 pairs).
- **`integrity:309` ×20 under load:** 20/20.
- **Suites:** integrity 25/25, `w2-home` 18/18, timer 26 + 2 skipped by design, `pwa` 3/3, tsc 0, Vitest 338/338.

## 1. Design: one rule, applied where every write passes

**The rule:** a tab never saves its timer over a newer brew. "Newer" is decided only from existing fields: `sessionId`, `lastEnded`, `startedAt`, `endsAt`, the session records in `kettle:progress`, and the completions other tabs announce. No stored field is added; the storage format is unchanged (§4).

Files: `src/timer/store.ts` and `src/timer/sync.ts` only (no other `src/timer/*` file was needed). `Composer.tsx`, `src/ui/*`, `src/screens/*` and every existing test file are untouched.

### 1.1 Write side: every action acts on the current brew (`store.ts`, `onCurrentBrew` / `actsOnCurrentBrew`)
- The action creators' object is wrapped once. **Every action passes the same entry**, except an explicit list of five, so **an action added later is guarded by default**:
  - `tick`: re-reads storage itself (completion guard);
  - `reset`: a wipe;
  - `setIntention` and `syncIdleLength`: fields-only saves (F1 / F1X-D1), which never write this tab's copy of the brew;
  - `toggle`: it only picks `pause` or `resume`, which are guarded. It picks by the status the person saw, so Space on a brew shown running means "pause".
- **At the entry**, the tab first takes in what storage holds now. The hook is installed by `initTabSync` (`installActionCatchUp`) and runs `mirrorTimerFromStorage()`, so the change is re-emitted as `timer:sync` and the screens follow. Then:
  - **same brew** (`sessionId` unchanged: another tab only paused, resumed, extended or re-worded it): the action applies to the brew **as it is now**;
  - **another brew, or none** (it was ended, or another tab started one this tab had not seen): the action was aimed at a brew that is gone. **It does nothing more**, and the tab now shows the current brew: a start **joins** the running brew.
  - **The rest of that gesture is dropped too** (`behind`, cleared on the next microtask). "Next brew" from a break is `end` then `startFocus` in one handler; without this, the start would go through once the end had refreshed the tab.
- **When the tab's own last save failed** (storage full), the catch-up does not rehydrate, as before (`mirrorTimerFromStorage`'s existing rule). Storage-full behaviour is unchanged.

### 1.2 Receive side: the tab with the newer brew keeps it and saves it back (`sync.ts`, `olderThanMine`)
- **Why it is needed.** In Chromium a tab's copy of localStorage is updated with the same message that brings its `storage` event (F1FIX §1). So a tab that is behind usually also **reads** an old copy, and nothing in that tab can tell. This is the doubly stale case.
- **Where.** `mirrorTimerFromStorage` (every non-removal mirror: a storage event, the action catch-up, and the ticker's pre-completion refresh) reads what storage holds (`readStoredTimer`, sanitised as a rehydrate is) **before** adopting it. If that state is older than this tab's own (rule below), the tab keeps its timer and **saves it back whole** (`useTimer.setState({})`). The stale tab then mirrors that save. Otherwise it rehydrates, as before.
- **Coverage.** It covers every writer, present or future, whatever path the stale save came from: whole saves, the fields-only saves, the composer.
- **`olderThanMine(mine, incoming)`**, in order:
  1. `incoming` holds a brew under way that this tab knows has **ended**: its own `lastEnded`, a record in progress, or a completion another tab announced. A stale tab brought it back. **Older** (this also covers an idle tab: an ended brew does not come back over its idle kettle).
  2. Only a brew **still under way here** can be lost. That excludes a brew with a record or an announced completion, and a brew running here **more than `WHILE_AWAY_AFTER_MS` (10 s) past its end**: this tab's ticker would have completed it, so the tab was away (frozen, asleep) and its copy is the old one (§1.3).
  3. `incoming` **accounts for** this brew: the same `sessionId` (paused, resumed, extended, re-worded) or `lastEnded` naming it (ended or completed, and perhaps the next brew started). **Not older.**
  4. Anything else was written by a tab that never saw this brew:
     - an **idle** kettle is older;
     - **another brew under way** is older only if it **started earlier** (`startedAt`). Of two brews started in two tabs within the lag, neither knowing the other, the later start is the newer one. Both tabs reach the same verdict, so they converge with no ping-pong. On a tie, storage's copy stays.
- **Not passed through the rule:**
  - **a removal** (`kettle:timer` removed, or `localStorage.clear()`): the existing wipe path, which now calls `followWipe()` (the same idle save the follower's `reset()` made before);
  - **`reset()` itself**: now removes the key before saving the idle kettle, so other tabs see a wipe rather than a stale idle save, and do not put their brew back. Same key and shape afterwards.

### 1.3 Why one guard covers every trigger
- The triggers in the brief are all one shape: a whole save computed from a copy of the timer that is older than storage.
- **The receive side** checks every write any tab makes, before any tab adopts it. Whatever wrote it (`rebase`, pause, resume, +5, end, start, a typed edit, or a writer not yet written), a newer brew that a live tab holds is put back. **That alone guarantees the brew is never lost**, in any event order (§3: four orders for the typed edit).
- **The write side** is one entry that every action passes (default-on for future actions). It gives the person's action the right meaning when the tab's read is current: applied to the current brew, or a refresh.
- **"Newer" in one line:** a state that names this brew (same `sessionId`, or `lastEnded`) is newer; an ended brew is never newer; between two live brews unknown to each other, the later start is newer; anything else (idle, older) loses to a live brew. "Live" excludes a brew this tab was away for.

## 2. The outcome per trigger

**Terms.** *Lagging tab Z*: its `storage` events for the timer have not arrived, but its read of storage is current. *Doubly stale*: Z's read is behind too. *A*: the tab whose write is newer. "Shows the current brew": Z's timer and screen follow A's brew at once, with a `timer:sync`.

| Trigger (in Z) | Same brew, newer in storage (A paused / resumed / +5 / re-worded it) | A ended it, or started another brew Z has not seen | Doubly stale |
|---|---|---|---|
| `rebase` (leader's clock-jump fix) | shifts the anchors of the brew as it is now | nothing; Z shows the current brew | A puts its brew back |
| pause | pauses the brew current in storage, with its **real remaining time** (A's +5 included); already paused: nothing | nothing; the newer brew runs on, Z shows it | A puts its brew back (an ended brew stays ended) |
| resume | already running: nothing (its end and +5 kept); paused: resumes with its current remaining time | nothing; Z shows the current brew | A puts its brew back |
| add 5 | adds 5 min to the brew as it is now (paused stays paused) | nothing added; the newer brew is untouched, Z shows it | A puts its brew back |
| end (`end` / `endActive`) | ends the brew as it is now, with its **real focus time** (a pause elsewhere is not counted); one record | nothing; **no second record**, the newer brew is not ended. Z shows it (or the idle kettle, if A had ended it) | A puts its brew back |
| start (`startFocus` / `startBreak`, Tea time, Next brew = end + start in one gesture) | both idle: starts as before | **does not replace A's brew: Z joins and shows it** (A's words, A's end); Z starts nothing (no `timer:start`) | both pressed Start within the lag, neither able to see the other: both tabs settle on the **later** start, one record. The earlier brew is under a second old (the lag), so no record can be lost. Same as HEAD |
| typed edit (`setIntention`, a real change) | only the words change in the stored brew (F1, unchanged) | nothing saved (F1, unchanged); the event brings Z up to date | Z's old idle copy plus its words lands over A's brew. **A puts its brew back**, whatever order the events land in: write order; Z's event first; A acting first (pause); A's ticker first (it then completes the brew once). Z's words are dropped: they were for an idle kettle |
| (unchanged) reset data | — | — | a wipe still stops the brew in every tab |
| (unchanged) composer label | words typed in Z for the running brew (same session) become its words in both tabs (logged in §7, not changed) | — | — |

Exactly-once is unchanged:
- `lastEnded`, the IndexedDB claims and progress de-duplication are untouched;
- the completion path (`tick`, the ticker, `guard.refresh`) is unchanged;
- the refresh now also puts back a brew that a stale tab overwrote just before its end (the ticker-first order in §3), which is then completed once.

The F1 fix is unchanged: `setIntention` writes only its fields, and `syncIdleLength`'s following tab writes nothing. Both are outside the wrapper.

## 3. Tests: fail on HEAD, pass on the fix

### 3a. Vitest `src/timer/staleTab.test.ts` (24 tests; the two-store harness of `intentionRace.test.ts`)
Harness:
- each tab is its own module graph over one shared localStorage;
- a tab takes in another tab's write only when the test delivers its `storage` event, so its events are held and released in the order the test chooses;
- `behindToo(raw, fn)` makes the tab's own read of storage old while `fn` runs (the doubly stale case);
- the action catch-up is installed as `initTabSync` does in the app, through `installActionCatchUp?.()`. That export is absent on HEAD, so there the tab acts on its own copy, as it does on HEAD.

**HEAD run:** `git archive 494748b kettle/src kettle/vite.config.ts kettle/package.json kettle/tsconfig.json` into scratch, `node_modules` symlinked, this test file copied in. Its `store.ts` was diffed equal to HEAD's.

| # | Test (trigger) | HEAD `494748b` | fix |
|---|---|---|---|
| 1 | **rebase**: the leader, still on a brew A ended and replaced, corrects a clock jump → storage untouched, Z shows the newer brew, completes once | **FAIL** (Z's old brew saved over A's) | pass |
| 2 | **pause**, A added 5 min → storage: the same brew paused, `plannedMs` 30, `remainingMs` 25 min (real); both tabs paused at 25 | **FAIL** (paused at 20 min, `plannedMs` 25: A's +5 lost) | pass |
| 3 | **pause**, A ended the brew and started another → nothing paused, the newer brew runs on, Z shows it | **FAIL** (the old brew, paused, over A's) | pass |
| 4 | **resume**, A resumed and added 5 → storage byte-identical, Z running with A's end | **FAIL** (Z's resume rewrites the end without the +5) | pass |
| 5 | **add 5**, A ended and replaced the brew → storage byte-identical, Z shows the newer brew, nothing added | **FAIL** | pass |
| 6 | **add 5**, A paused → +5 on the paused brew, still paused | **FAIL** (Z's +5 un-pauses it) | pass |
| 7 | **end**, A ended and replaced the brew → the newer brew is not ended; one record for the old one | **FAIL** (idle saved over A's brew) | pass |
| 8 | **end**, A paused for 5 min → the record has 10 min focus, not 15 | **FAIL** (`focusedMs` 15 min) | pass |
| 9 | **start** (Composer's start: words saved, then started) while A's brew runs → storage byte-identical; Z joins (sync `start`, no `timer:start`), A's words | **FAIL** (Z's brew replaces A's) | pass |
| 10 | **start** (Tea time, `startBreak`) after A started the next brew → not replaced | **FAIL** | pass |
| 11 | **start** (Next brew from a break: `end` + `startFocus`, one gesture) after A already did → neither goes through | **FAIL** | pass |
| 12 | **typed edit** (singly stale), A paused and extended → only the words change | pass (F1 already guards this) | pass |
| 13 | **doubly stale typed edit**, events in write order → A puts its brew back; both tabs on it; completes once | **FAIL** (A mirrors the idle kettle: brew gone) | pass |
| 14 | the same, Z's event lands first, then A's, then Z's again | **FAIL** | pass |
| 15 | the same, A acts (pause) before its event | pass (A's whole save happens to restore it) | pass |
| 16 | the same, A's ticker re-reads first → restores the brew and completes it once | **FAIL** (no completion: the brew is gone) | pass |
| 17 | **doubly stale pause** of a brew A ended and replaced → A puts its newer brew back | **FAIL** | pass |
| 18 | **doubly stale pause** of a brew A ended → it stays ended (A keeps its idle kettle) | **FAIL** (the ended brew comes back) | pass |
| 19 | a tab that was away (brew 25 min past its end) does not put it back; no record | pass | pass |
| 20 | **doubly stale start** in both tabs within the lag → both on the later start, one record | pass (same outcome) | pass |
| 21 | reset data in one tab still stops the brew in the other | pass | pass |
| 22 | composer label: words typed in Z for the running brew become its words (unchanged) | pass | pass |
| 23 | in step: pause, +5, resume, end from either tab reach the other | pass | pass |
| 24 | **three tabs**, doubly stale typed edit; A and C both hold the brew, either order → it is put back, at most one save per holding tab, **no further writes** when every event is delivered again (no ping-pong); completes once | **FAIL** | pass |

**Every trigger has a case that fails on HEAD and passes on the fix:**

| Trigger | Cases |
|---|---|
| `rebase` | 1 |
| pause | 2, 3 |
| resume | 4 |
| add 5 | 5, 6 |
| end | 7, 8 |
| start | 9–11 |
| doubly stale typed edit | 13, 14, 16, 24 (three tabs) |
| doubly stale pause (added) | 17, 18 |

The singly stale typed edit (12) already passes on HEAD: F1's fields-only save guards it. It stays as a regression guard; its fail-on-HEAD form is the doubly stale case.

| Run | Result | Log |
|---|---|---|
| HEAD `494748b`, the 24 tests as committed in `54a9721` | **17 failed / 7 passed**. All 17 fail on a behaviour assertion (no crash). The 7 passing are 12, 15, 19–23, as the table says | `logs/vitest-staletab-on-HEAD-494748b.log.txt` |
| fix `54a9721` (src `dd6944e`; app code as in `e18b621`) | **24/24** | `logs/vitest-staletab-on-fix.log.txt` |
| fix: `staleTab` + `intentionRace` + `multitab`, 10 runs in a row | **10 × 51/51** (deterministic) | `logs/vitest-race-files-x10-fix.log.txt` |

### 3b. Existing tests (unchanged files)

| Run | Result | Log |
|---|---|---|
| `intentionRace.test.ts`, `multitab.test.ts`, `store.test.ts`, `storageFull.test.ts` on the fix | 4 files, **71/71** | `logs/vitest-existing-race-on-fix.log.txt` |
| Vitest, all, on the fix `54a9721` | **34 files, 338/338** (was 314; +24) | `logs/vitest-all-fix.log.txt` |
| tsc (`tsc --noEmit`) | exit 0 | `logs/tsc-fix.log.txt` |

`multitab.test.ts` "two tabs pressing start at the same time converge on one session" stays green. Its harness does not install the action catch-up, so it models two starts that cannot see each other (the doubly stale start, #20), whose outcome is unchanged. **But it encodes "last writer wins", which Vibei's rule overturns for a tab whose read is current. See §7.1 (for LEAD).**

### 3c. Browser: `tests/w3r2-stale-tab.spec.ts` (real browser, two tabs of one profile; through the gate, lane SG)
Set-up:
- An init script, registered before the app's own listener (as in `w3-intention-race.spec.ts`), holds tab Z's `storage` events for `kettle:timer` while `__w3r2.hold` is on.
- `release()` re-dispatches them in order.
- Tab A acts through the debug API; **the person in Z uses Focus's real buttons**: Pause, Add 5 minutes, End session, then End session in the sheet. For the start case, Z types in Today's composer and presses Enter.
- Each case asserts its precondition before Z acts: storage holds A's write, Z has a held event, and Z's timer is still the old one.

| Case | What is asserted on the fix |
|---|---|
| **pause** (A added 5 min to the 10-min brew) | storage: the same brew, `paused`, `plannedMs` 15 min, `remainingMs` > 13 min (the real remaining time, with A's +5). After release, both tabs paused with that remaining time; A shows Resume |
| **add 5** (A ended its brew and started another) | Z's timer moves to A's new brew, nothing added (`plannedMs` 10 min). After 400 ms, A's storage string is **byte-identical** and A still runs it on `#/focus`. After release, both tabs on it, Z showing its words |
| **end** (the same) | the same as add 5, after Z's End session and the sheet's End session |
| **start** (Z on Today, idle; A started a brew) | Z's typing writes nothing over A's brew. Enter → Z goes to `#/focus` **on A's brew** (A's words). Storage byte-identical; A unaffected |

| Server | Result | Log |
|---|---|---|
| :5581 fix, first run | **4/4** (44 s) | `logs/stale-tab-pw-fix-5581-try1.log.txt` |
| :5581 fix ×3 (`--repeat-each=3`, load 13 → 21) | **12/12** | `logs/stale-tab-pw-fix-5581-x3.log.txt` |
| :5560 HEAD `494748b` ×3 | **12/12 FAIL**, each at Z's action (details below) | `logs/stale-tab-pw-HEAD-5560-x3.log.txt` |
| :5478 old base `4d36939` ×1 | **4/4 FAIL**: pause, add 5 and end as on HEAD. Start fails one step earlier, at "Z's typing did not touch A's brew": the pre-F1 composer saves its whole idle timer | `logs/stale-tab-pw-base-5478-x1.log.txt` |

How each case fails on HEAD:
- **pause:** "paused: the same brew, with A's +5"; storage holds Z's stale 10-min plan;
- **add 5:** "Z now shows the current brew"; Z stays on its old brew, which it saved over A's;
- **end:** the same message, with Z `null`: it ended its old brew and saved its idle kettle over A's;
- **start:** Z runs **its own** brew (`Reply to Sam`, another `sessionId`) in place of A's.

Served code: `logs/served-blobs.log.txt`. Blob hashes of `store.ts`, `sync.ts` and `ticker.ts` on each server equal the branch head (:5581), `494748b` (:5560) and `4d36939` (:5478).

Reporter quirk, as F1FIX noted: the HEAD run lists the four tests at `:154`, `:197`, `:221`, `:251`, while the fix runs list `:121`, `:145`, `:158`, `:174`. It is the same file and the same four tests; their titles are printed in full in every log.

### 3d. The existing browser race spec (unchanged file)
| Run | Result | Log |
|---|---|---|
| `tests/w3-intention-race.spec.ts` (F1 case + F1X-D1 case) on the fix :5581 ×3 | **6/6** | `logs/intention-race-pw-fix-5581-x3.log.txt` |

## 4. Storage compatibility (real browsers, through the gate): all byte-identical
**Script.** `scripts/compat.spec.ts.txt` (config `scripts/compat-pw.config.ts.txt`) is F1FIX's §3 script, unchanged but for one added profile.

**Three profiles**, each made on FROM through the real UI or the debug API:
- **idle:** typed, started with Enter, ended, then new words typed on Today (`lastEnded` set);
- **paused:** typed, started with Enter, paused;
- **reset (new):** typed, started, then `reset()`. On the fix that removes the key, then saves the idle kettle.

**Method.** Every `kettle:*` key is copied into a fresh profile on TO before boot.

**Asserts:**
- TO's in-memory timer equals FROM's stored `state`, field by field;
- after TO has booted and its composer has synced, `kettle:timer` and `kettle:progress` are byte-identical;
- the envelope keys are `['state', 'version']`, version 1, and the 14 state keys are in order.

| FROM → TO | idle | paused | reset | Log |
|---|---|---|---|---|
| HEAD `494748b` :5560 → fix :5581 | pass | pass | pass | `logs/compat-5560-to-5581.log.txt` |
| fix :5581 → HEAD :5560 | pass | pass | pass | `logs/compat-5581-to-5560.log.txt` |
| old base `4d36939` :5478 → fix :5581 | pass | pass | pass | `logs/compat-5478-to-5581.log.txt` |
| fix :5581 → old base :5478 | pass | pass | pass | `logs/compat-5581-to-5478.log.txt` |

**Byte comparison** (`SGCOMPAT` lines in each log, saved vs after boot): all 12 pairs are identical.
- The reset profile has the same bytes on all three servers (sha256 prefix `e47c72404da7`): the removal-first reset leaves exactly what the base's reset left.
- Nothing in the guard writes a new key or field. The re-assert is an ordinary whole save of the same 14 fields, and the catch-up writes nothing.

## 5. `integrity:309` ×20 under load
**Command:** `integrity.spec.ts -g 'two tabs, the leading one frozen across the end' --repeat-each=20 --workers=2` on :5581, through the gate with `--n 2`, plus **6 CPU burners**. The burners are my own subshells; their PIDs are printed, and each is killed by its explicit PID at the end. Script: `scripts/chain.sh.txt`, step `stress`.

| Run | Result | Load (1 / 5 / 15 min) | Log |
|---|---|---|---|
| 1 (17:44:59–17:48:47) | **20/20** (3.8 min). Burners 26227–26232 started and killed by PID | start 5.7 / 10.7 / 13.7 (burners just started; the other lanes had been at 13–20); end 10.5 / 11.0 / 13.2 | `logs/stress-309-x20-w2-nb6.log.txt` |
| 2 | (queued) | | `logs/stress-309-x20-w2-nb6-run2.log.txt` |

The app code under test is `e18b621`'s (served on :5581; the head commit `54a9721` adds a Vitest case only).

## 6. The rest (on the fix, through the gate: `scripts/bundle.sh.txt`, one SG slot)
Branch `54a9721` (src `dd6944e`). The app code served on :5581 is `e18b621`'s: `54a9721` adds one Vitest case and nothing else. Load average 13–20 throughout (the other lanes running).

| Run | Result | Log |
|---|---|---|
| `integrity.spec.ts`, whole, once (includes `:309`, the freeze cases and I03) | **25/25** (7.0 min) | `logs/integrity-all-fix.log.txt` |
| `w2-home.spec.ts` (Today's composer and brew-length control) | **18/18** (5.0 min) | `logs/w2-home-fix.log.txt` |
| `timer.spec.ts`, `timer-app` + `timer-harness` | **26 passed, 2 skipped** by design (`timer.spec.ts:294` and `:438` skip outside the harness, as in F1FIX) | `logs/timer-app-harness-fix.log.txt` |
| `pwa` (a production build of the worktree, previewed on :5597) | **3/3** | `logs/pwa-fix.log.txt` |
| tsc (`tsc --noEmit`) | exit 0 | `logs/tsc-fix.log.txt` |
| Vitest, all | 34 files, **338/338** | `logs/vitest-all-fix.log.txt` |

Not mine (the regression lane's): the notice suites and the 2-tab manual check with real clicks.

## 7. Open items, for LEAD

### 7.1 Existing test whose behaviour Vibei's rule overturns (not edited)
**Test:** `src/timer/multitab.test.ts:229`, "two tabs pressing start at the same time converge on one session":
```ts
A.timer.getState().startFocus({ intention: 'from A' });
B.timer.getState().startFocus({ intention: 'from B' }); // B's write lands last
...
expect(A.timer.getState().intention).toBe('from B');
```
- **As run, it stays green.** That harness does not install the action catch-up (`initTabSync` is never called there), so B's start is computed from B's own copy, as when B cannot see A's write: the doubly stale start. Both tabs then settle on the later start, B's (the startedAt tie in the harness's frozen clock leaves storage's copy, B's).
- **In the app, B's read is current here** (storage holds A's brew), so under Vibei's rule B's Start **joins** A's brew: the stored brew stays `from A`. Staletab #9 is that case.
- **Proposal (LEAD rules):**
  - (a) keep the test as it is, read as the doubly stale start (its comment would need "B cannot yet see A's write"); or
  - (b) make its harness install the catch-up (`sync.installActionCatchUp()`, as `initTabSync` does) and change the assertion to `expect(A.timer.getState().intention).toBe('from A')`. Its other assertions (one session id in both tabs, one completion, one record with that id) hold unchanged under (b).
- I recommend (b) plus a one-line comment change, so the suite pins the app's behaviour.

**Evidence for 7.1** (scratch copies of `multitab.test.ts` run on the fix, then deleted; the file itself is untouched):
- catch-up installed, assertions as they are: **1 failed / 14 passed**, exactly this assertion (`expected 'from A' to be 'from B'`). Log: `logs/multitab-with-catchup-as-is.log.txt`.
- catch-up installed and proposal (b) applied: **15/15**. Log: `logs/multitab-with-catchup-proposal-b.log.txt`, with the 2-line diff.

### 7.2 Residuals of the guard (known, not fixed)
1. **Same brew, older fields, doubly stale.** Example: Z's copy lacks A's +5 *and* Z's read is behind; Z pauses; the pause is saved with Z's remaining time, without the +5.
   - The receive side restores whole brews (session level). It cannot tell an older version of the same brew from a newer one without a stored version field, which the brief rules out.
   - With a current read (the usual case: the event is merely late), the write side applies the pause to the current brew (Vitest #2, browser pause case).
2. **A tab that missed events entirely** (restored from the back/forward cache, not merely frozen). Example: it holds a *paused* brew that another tab ended without a record (< 1 min, or a break), after which `lastEnded` moved on. If the person then acts there, the catch-up may put that brew back over an idle kettle.
   - It is never put back over another live brew (the later start wins).
   - A *running* brew in that position is excluded by the away rule (§1.2, 2.), which keeps a brew ended elsewhere from completing.
   - A frozen (not cached) tab gets its queued events in order and is not affected.
3. **The doubly stale start.** Two starts within the lag, neither tab able to see the other: the later start wins in both tabs (#20, unchanged from HEAD). The earlier brew is less than one lag old, so nothing it would have recorded is lost.

### 7.3 Outside my files, for their owners (found while checking the outcomes; nothing changed)
- **`src/app/flow.ts` `startNextBrew`** sets `suppressNextStop = true` before `end('skip')`. If that end does nothing (now: a lagging tab whose break another tab already ended; on HEAD: a break ended at 0:00, which completes through `tick` and emits no stop), the flag stays set. The next *local* `timer:stop` in that tab then skips its toast and its navigation home. Fix there: clear the flag when the end did not happen.
- **`FocusScreen.addFive`** shows "+5 min · whistles at …" after calling `addTime`, even when the lagging tab's +5 was dropped (the tab now shows the newer brew). The note shows that brew's real end, so it is cosmetic. The pause/resume sound in `FocusScreen.toggle` likewise plays before the store acts.

### 7.4 Composer label (logged only, per Vibei; behaviour unchanged)
- Words typed in tab 2's Today composer for a brew that tab has already taken in are a same-session edit. `setIntention` saves them into that brew (F1's fields-only save), and they become its words in both tabs.
- The guard does not touch this: a same `sessionId` is "not older" by rule 3, and `setIntention` is outside the action wrapper.
- Pinned unchanged by Vitest #22. Open for the Final Boss, as listed in `VB-DECISIONS-W3R2.md`.
- **Where it meets the new start join.** A person in a lagging Today types and presses Enter within 150 ms of the last keystroke. Z then joins A's brew (A's words). If Today is still mounted when the composer's pending 150 ms sync fires, that sync is exactly the quirk above: Z's typed words become the brew's words.
  - Normally Today unmounts first: the join navigates to Focus, and the unmount clears the timer.
  - The browser start case waits 400 ms before Enter, so it tests the join, not the quirk.
