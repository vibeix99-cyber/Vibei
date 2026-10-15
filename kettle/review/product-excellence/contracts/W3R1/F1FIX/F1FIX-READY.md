# F1X: `integrity:309` intention-save race, fixed (packet, in stages)

| | |
|---|---|
| Brief | `contracts/W3R1/BRIEF-F1FIX.md`; binding `VB-DECISIONS-POSTFOLLOWUP.md` §1; root cause `review/F1-ROOT-CAUSE.md` |
| Branch | `pe/w3r1-f1-intention`, worktree `/home/user/wt/w6x`, local commits only (never pushed) |
| Base | integration `793321b` (app `f2298d3`, src `db6de7e`) |
| **Head** | **`74138d3` (src `e2041c1`)**. App code is final at `882233b` (src `3738f08`); `74138d3` changes only the Vitest file |
| Commits | `9a41a1a` fix part 1 (intention-only save) + Vitest test · `84a7e18` Playwright test · `882233b` fix part 2 (no-op saves write nothing; found by my own stress probe, §4) · `74138d3` Vitest tweak |
| Dev | :5561, restarted after each source change; final `verify.sh` → `PORT 5561 serves 74138d3 (src e2041c1): VERIFIED` |
| Evidence | `F1FIX/logs/*.log.txt`, scripts in `F1FIX/scripts/*.txt` |

**Status: READY for LEAD-5.** All proof is in (§2–§4, §6). Open points: §7.

## 1. The change (scope: `src/timer/store.ts` only; `Composer.tsx` untouched)

`git diff --stat 793321b 74138d3`: `src/timer/store.ts` +100 / −20, new `src/timer/intentionRace.test.ts`, new `tests/w3-intention-race.spec.ts`. Nothing else.

**Before.** `setIntention` (base `store.ts:399`) was `set({ intention, tag })`. zustand `persist` then wrote `partialize(get())`, the tab's **whole** in-memory timer (`status`, `sessionId`, `endsAt`, …), on every call. That includes Today's composer sync on mount and 150 ms after each keystroke (`Composer.tsx:84–86`), which usually changes nothing.

**After: two parts, both in `setIntention` and its persistence.**

**(a) A save that changes nothing writes nothing** (`store.ts:486`, commit `882233b`).
- If the words and tag equal what the timer holds, `setIntention` returns: no `set`, no save.
- This is the composer's mount sync in I01, `setIntention('', null)` over `''`/`null`, and every repeat sync.

**Why (a) is needed and (b) alone is not.** A tab that has not had another tab's `storage` event yet can also *read* an old copy of localStorage. Chromium updates a renderer's copy of the storage area with the same message that queues the event. My stress probe on `84a7e18` (part (b) only) caught exactly this: 2/20 failures, §4. The stale tab's read of `kettle:timer` came back empty, so it wrote its whole idle timer, as for a fresh profile.

**(b) A save that does change the words writes only the words** (`9a41a1a`).
- `setIntention` (`:481`) snapshots the saved fields (`intentionSave`, `:254`) and runs the same `set`.
- The persist storage is a thin wrapper, `timerStorage` (`:298`), around the same `createJSONStorage(() => safeStorage)`.
  - A save made during `setIntention` **that changes nothing but `intention`/`tag`** (`onlyIntentionChanged`, `:256`, compared field by field) goes to `saveIntentionOnly` (`:269`).
  - Every other save is written whole, exactly as before. That includes a save made by a listener during `setIntention` that changes any other field.
- `saveIntentionOnly` re-reads `kettle:timer` now and decides:
  1. **This tab's own last save failed** (`lastWriteFailed`; storage full or blocked; `:272`): storage holds an older timer than this tab, so it writes the whole newer timer, as before. This keeps the storage-full repair that the I03 banner waits for.
  2. **Nothing readable stored** (no key, unparseable, or another envelope version): nothing to overwrite, so it writes whole, as before (a fresh profile).
  3. **Storage holds another session than this tab knows** (`:294`): another tab started or ended a brew and this tab has not had the event. **It writes nothing.** The words were for a timer that has moved on, and the other tab's brew keeps its own words. The event brings this tab up to date.
  4. **Same session:** it writes the stored envelope back with **only `state.intention` and `state.tag` replaced**: `{ ...stored, state: { ...stored.state, intention, tag } }`. Another tab's newer `status`, `endsAt`, `pausedAt`, `lastEnded` and so on survive.
- `partialize` now calls `persistedTimer()` (`:229`): the same 14 fields in the same order (moved, not changed).

**Storage format:** the same key `kettle:timer`, the same `{ state, version: 1 }` envelope, the same field order, no migration (§3).

**What (b) cannot cover, stated plainly.** Case 3 relies on the tab's read of storage being current. A **real edit** (typed words, a Done/Carry outcome, the day turning) made in a tab whose copy of storage is *also* behind, inside the lag, is still written over the newer state.
- Unloaded the lag is a few ms; under load it is 0.1–0.6 s.
- In that case case 2 or case 4 runs on the old copy, as the base did for every save.
- Closing it from inside one tab is not possible with localStorage alone. A tab cannot tell that its copy is old.
- The robust guard is on the receiving side, in `sync.ts` (out of this brief): the tab that owns the brew refuses or re-asserts when it sees its running session replaced by an idle state with no `lastEnded` for it. That is LEAD-5's call. The automatic writes (mount sync, repeat syncs) are now gone, so what remains needs a person typing in tab Z and starting in tab A within that window.

## 2. Deterministic tests: fail on base, pass on fix

### 2a. Vitest `src/timer/intentionRace.test.ts` (7 tests)
This is the two-module-graph tab harness of `multitab.test.ts`: two tabs sharing one localStorage. A tab takes in another tab's write only when its `storage` event is delivered (`mirrorTimerFromStorage({ event: true })`), so "not yet taken in" is exact. A `stale` map on the fake storage models a tab whose copy of storage is behind too. There is no load and no timing.

| Test | `4d36939` | `f2298d3` | `9a41a1a` (part b only) | fix |
|---|---|---|---|---|
| **The race:** B starts a brew; A (behind) saves `Reply to Sam` → storage still holds B's `running` session, `endsAt`, `startedAt` and B's words. Events delivered → both tabs `running` on B's session; A emits `start`, B nothing (no `reset`). Completes once (A leads): 1 record in storage and in each tab | **FAIL** (storage `idle`) | **FAIL** | pass | pass |
| A has not yet seen B **end** the brew → A's save does not bring it back | **FAIL** | **FAIL** | pass | pass |
| Same brew, B paused it; A (still `running` in memory) saves new words → storage = B's paused state with only the words changed; both tabs end `paused` with them | **FAIL** | **FAIL** | pass | pass |
| **No-op save from a tab that is behind, whose copy of storage is also behind** (reads nothing stored, as in the probe failures) → B's stored brew byte-identical; A then mirrors B's brew | **FAIL** | **FAIL** | **FAIL** (A's whole idle timer: the probe signature) | pass |
| Format: an intention-only save has the same envelope keys and the same state keys in the same order, and is byte-identical to the whole save but for the two values; a fresh tab loads it | pass | pass | pass | pass |
| Fresh profile (nothing stored): a real save writes as before | pass | pass | pass | pass |
| Storage full: after this tab's own failed save, the intention save writes the whole newer timer and repairs storage, as before | pass | pass | pass | pass |

**How (logs in `logs/`):**
- each older tree is `git archive <rev> kettle/src kettle/vite.config.ts kettle/package.json kettle/tsconfig*` into a scratch directory, with `node_modules` symlinked and the final test file copied in, then `npx vitest run src/timer/intentionRace.test.ts --reporter=verbose`;
- `4d36939` → **4 failed / 3 passed** (`vitest-race-on-base-4d36939.log.txt`);
- `793321b` = `f2298d3` app (its `store.ts` diffed equal) → **4 failed / 3 passed** (`vitest-race-on-base-f2298d3.log.txt`);
- `9a41a1a` → **1 failed / 6 passed**, the no-op case (`vitest-race-on-9a41a1a.log.txt`);
- the fix → **7/7** (`vitest-race-on-fix.log.txt`);
- `git diff 4d36939 f2298d3 -- kettle/src/timer kettle/src/screens/home/Composer.tsx kettle/src/lib/storage.ts` is empty.

### 2b. Playwright `tests/w3-intention-race.spec.ts` (real browser, two tabs, one profile)
Setup:
- An init script, registered before the app's own listener, holds tab A's `storage` events for `kettle:timer` while `__f1.hold` is on.
- `__f1.release()` re-dispatches them in order as real `StorageEvent`s.

Steps:
1. Both tabs on Today, idle.
2. Hold A's events.
3. **B starts a 6-second brew.** Poll until storage holds B's `sessionId` and A has at least one event held.
4. **Precondition** (asserted): A is still `idle` with `sessionId: null`.
5. **A saves its intention with real typing** in its Today composer (`Reply to Sam`), then waits until A's store has the words. A is still idle (asserted).
6. **Assert storage still holds B's brew:** `running`, B's `sessionId`, `endsAt`, `startedAt`, and B's words `Chapter 3 notes`; version 1.
7. Release. Both tabs go to `#/focus` on B's session, then `#/done`. **One record** in `kettle:progress` and in each tab's memory.

This test covers part (b): the browser's copy of storage is current here (the hold delays only the event). Part (a)'s stale read is pinned by the Vitest case above and by the stress probe (§4).

| Server | Result | Log |
|---|---|---|
| :5560 integration `f2298d3` | **3/3 FAIL** at step 6: storage holds `{ status: 'idle', sessionId: null, endsAt: null, intention: 'Reply to Sam' }`, A's whole idle timer over B's brew | `race-pw-base-5560-x3-on-84a7e18.log.txt` (same spec) · rerun: §6 |
| :5478 old base `4d36939` | **3/3 FAIL**, same | `race-pw-base-5478-x3-on-84a7e18.log.txt` · rerun: §6 |
| :5561 fix | 5/5 pass on `84a7e18`; on the final code: §6 | §6 |

Note on Maker Q's earlier attempt (`f1-repro.spec.ts.txt`, which did not reproduce):
- It added its hold through `page.evaluate`, after boot.
- Here the hold is an init script, the first `storage` listener on `window`.
- The precondition is asserted before A saves, so a leaking hold fails by name instead of passing.

**tsc:** clean (`tsc-fix.log.txt`). **Vitest, all:** 33 files, **309/309** (`vitest-all-fix.log.txt`).

## 3. Storage compatibility (real browsers): all pass
Script: `scripts/compat.spec.ts.txt`, run with `scripts/pw.config.ts.txt`, through the gate.

| FROM → TO | idle profile | paused profile | Log |
|---|---|---|---|
| base `4d36939` :5478 → fix :5561 | pass | pass | `compat-base4d-to-fix.log.txt` |
| fix :5561 → base `4d36939` :5478 | pass | pass | `compat-fix-to-base4d.log.txt` |
| integration `f2298d3` :5560 → fix :5561 | pass | pass | `compat-int-to-fix.log.txt` |

Each log prints the saved `kettle:timer` and the same key after TO booted (`F1XCOMPAT` lines); they are identical. The fix's idle profile is the one whose last save went through `saveIntentionOnly` (same session, case 4): typed words after an ended brew, with `lastEnded` kept.

Two profiles are made on FROM with real composer typing:
- **idle:** typed, started with Enter, ended, then new words typed on Today. This has `lastEnded`, and the words are the last save.
- **paused:** typed, started with Enter, paused.

Every `kettle:*` key is copied into a fresh profile on TO before boot. The script asserts:
- TO's in-memory timer equals FROM's stored `state`, field by field;
- `kettle:timer` and `kettle:progress` are byte-identical after TO has booted and its composer has synced;
- the envelope keys are `['state', 'version']`, version 1, and the 14 state keys are in order.

Runs: base `4d36939` (:5478) → fix (:5561); fix → base; integration (:5560) → fix.

## 4. `integrity:309` under load
Load: `--workers=2` plus **6** CPU burners (own PIDs, killed at the end). This is the setting under which Q's base run failed 1/20. LR-stress used 4. `--repeat-each=20`, `-g 'two tabs, the leading one frozen across the end'`. Script: `scripts/f1x-stress.sh.txt`.

| App code | Run | Result | Log |
|---|---|---|---|
| `84a7e18` (part b only) | I01 ×20 | **19/20.** 1 fail with the full-run signature: the starting tab idle at `#/`, `leader: false` | `stress-I01-x20-nb6-on-84a7e18.log.txt` |
| `84a7e18` | Q's instrumented copy ×20 (`f1-probe.spec.ts`; every `kettle:timer` write logged with its stack) | **18/20.** In both failures the non-starting tab wrote `idle` 667 ms / 217 ms after the start. Stack: `Composer.tsx` 150 ms sync → `setIntention` → `saveIntentionOnly`, **"nothing readable stored" branch**: its copy of storage was also behind. Its storage event came 50–66 ms after. That is a no-op save (`''`, `null`), which led to part (a) | `probe-I01-x20-nb6-on-84a7e18.log.txt` (`QDUMP` lines) |
| **`882233b` (final)** | I01 ×20 | **20/20** (4.6 min, load 16.2 at the end) | `stress-I01-x20-nb6-on-882233b-run1.log.txt` |
| `882233b` | Q's instrumented copy ×20 | **20/20** (4.3 min, load 15.9 at the end). **The non-starting tab made 0 `kettle:timer` writes in 20 runs**; on `84a7e18` it made 20 (one composer sync per run, 7 of them `idle` within 2 s of the start) | `probe-I01-x20-nb6-on-882233b.log.txt` (`QOK` lines) |
| `882233b` | I01 ×20, second run | **20/20** (3.7 min, load 10.1 at the end) | `stress-I01-x20-nb6-on-882233b-run2.log.txt` |

**On the final code: I01 40/40 and the instrumented copy 20/20 under load.** For comparison, base failed 1/20 in Q's run at the same setting, and `84a7e18` failed 1/20 and 2/20. 60 clean runs alone would not rule out a rate of about 1 in 20 at high confidence. The stronger evidence is the probe's write log: the write that caused every observed failure no longer happens (0 writes against 20).

## 5. Audit: other whole-state writers in `store.ts` (not changed)

**Rule:** every `set` inside the store goes through zustand `persist`, which writes `partialize(get())`, the whole timer. Any of them, run in a tab that has not yet taken in another tab's `kettle:timer` write, can therefore carry that tab's stale `status` / `sessionId` / `endsAt` over storage. Lines are given as base `f2298d3` / fix `882233b`.

The table is ordered by how close each one is to F1, which is an **automatic** write that the person did not aim at the timer.

| # | Function, `set` at | Trigger | Same mechanism as F1? |
|---|---|---|---|
| 1 | **`syncIdleLength`** `:416` / `:511` | **Automatic.** `initTimer` at boot (`ticker.ts:302`), and **on every `focusMin` change** (`ticker.ts:304`), including a change made in **another** tab: its `kettle:settings` storage event rehydrates settings, and the subscription runs here. Only while this tab is idle and its displayed length differs | **Yes, the closest.** Tab A changes the brew length, then starts within the storage-event lag. Tab Z gets A's settings event first (events arrive in write order) while still idle, and writes its whole idle timer over A's brew before A's timer event lands. **Not reproduced here.** No single action writes `focusMin` and starts (checked `Composer.tsx`, `CustomRhythmSheet.save` `:313`), so it needs a length change then a Start inside the lag. **For LEAD-5 to rule.** |
| 2 | **`rebase`** `:404` / `:499` | **Automatic.** The ticker's `wake()` when the wall clock jumps back (`ticker.ts:98`), or remaining > plan (`ticker.ts:108`); only in the leader (`mayMutate`) and only while not idle | Same shape: a leader still on an old session can write it back over a newer one. Needs a clock jump inside the lag: rare |
| 3 | `pause` `:293` / `:374`, `resume` `:303` / `:384`, `toggle` (calls them) | Person: Pause/Resume, Space, OS media keys (`mediaSession.ts:46–47`) | Same shape, but a person's action on a tab showing the old brew. Example: another tab ended s1, this tab still shows it, pause → s1 comes back paused |
| 4 | `addTime` `:331`, `:333` / `:412`, `:414` | Person: +5 / −time | As 3 |
| 5 | `end` `:356` / `:437` (also `endActive` inside `startFocus` / `startBreak`) | Person: End sheet, Skip break; `startNextBrew` (`flow.ts:134`) | As 3. If another tab has already started s2, ending the stale s1 writes idle over s2. The completion case is already guarded (`isDue` → `tick`; multitab test "a stale tab that ends early after the leader completed cannot resurrect the session") |
| 6 | `startFocus` `:244` / `:325`, `startBreak` `:266` / `:347` | Person: Start / Enter (`Composer.tsx:89–94`), Tea time (`flow.ts:114`), Next brew (`flow.ts:138`); auto-start after a break (`flow.ts:220`, in the tab that just completed, after its own fresh `tick`) | A new session replaces whatever is stored by design (last writer wins; multitab "two tabs pressing start at the same time converge on one session"). From a stale tab it can replace another tab's just-started brew without ending it. That brew is < 1 min old, so no record would be lost. Not the F1 shape |
| 7 | `reset` `:396` / `:477` | Reset data / import (`portability.ts:315`); mirroring a cleared key (`sync.ts:75`) | Wipes on purpose; not this bug |
| — | `tick` `:373`, `:381` / `:454`, `:462` | Ticker | **Not the same bug:** it re-reads storage first (`guard.refresh()` → `mirrorTimerFromStorage`, `:367` / `:448`). The exception is deliberate: after its own failed save it keeps its newer state. Note: after this fix's finding (§1(a)), that re-read can also be a stale copy under load. It still falls back on `lastEnded` and the IndexedDB claims for exactly-once |

**Other callers of `setIntention`, now covered by the fix:**
- `app/intention.ts:21`, `:23` (`setIntentionOutcome`: Done / Carry forward);
- `Composer.tsx:77` (day turned) and `:91` (`start`, followed at once by the whole `startFocus` save).

**Not fixed, per the brief.** If LEAD-5 rules #1 to be the same bug, the same two-part pattern applies: skip a no-op, and persist only the changed fields into what storage holds now.

## 6. Suites and reruns on the final code (`scripts/chain.sh.txt`, every browser run through the gate)

| Run | Result | Log |
|---|---|---|
| tsc | clean | `tsc-fix.log.txt` |
| Vitest, all | 33 files, **309/309** | `vitest-all-fix.log.txt` |
| `w3-intention-race` on the fix :5561 ×5 | **5/5** | `race-pw-fix-5561-x5-final.log.txt` |
| `w3-intention-race` on :5560 (`f2298d3`) ×3 | **3/3 FAIL** at "storage still holds B's running brew" | `race-pw-base-5560-x3-final.log.txt` |
| `w3-intention-race` on :5478 (`4d36939`) ×3 | **3/3 FAIL**, same | `race-pw-base-5478-x3-final.log.txt` |
| `integrity.spec.ts`, whole file, once | **25/25** (5.1 min) | `integrity-all.log.txt` |
| `w2-home.spec.ts` (the composer) | **18/18** (3.9 min) | `w2-home.log.txt` |
| `timer.spec.ts`, `timer-app` + `timer-harness` | **26 passed, 2 skipped** (by design: `:295` and `:439` skip outside the harness) | `timer-spec.log.txt` |
| Compatibility, three directions | 6/6 (§3) | `compat-*.log.txt` |
| `integrity:309` ×20 under load, twice, plus the probe ×20 | 20/20, 20/20, 20/20 (§4) | `stress-*`, `probe-*` |

Reporter quirk, for the record: Playwright listed the race test as `:73:1` in some runs and `:58:1` in others. The file has one test, at line 58. The runs are the same file and the same test, whose title is printed in full in every log.

## 7. Open, for LEAD-5
1. **Residual inside the fix's own scope** (§1, "What (b) cannot cover"): a *real* edit typed in a tab whose copy of localStorage is also behind, inside the lag, still writes over the newer state. The automatic writes that caused every observed failure are gone. The robust guard is on the receiving side (`sync.ts`), outside this brief.
2. **Audit #1, `syncIdleLength`**: an automatic whole-state write from a possibly stale tab, triggered by another tab's brew-length change. Same mechanism; not reproduced; not fixed. Your ruling.
3. **Not run by me** (the Sonnet regression lane's): timer/PWA (`pwa` project), the notice suite, and the 2-tab manual check.

## 8. Fix round: F1X-D1, `syncIdleLength` (LEAD-5 `CHECKER-W3R1-F1FIX.md` §5–§6)

| | |
|---|---|
| From | `74138d3` (REJECT, one defect: F1X-D1) |
| **Head** | **`ac9f1e0` (src `b74e6b3`)**. Commits: `f7b66da` (fields-only length sync), `db31fbb` (a tab following another tab's length change writes nothing), `ac9f1e0` (test label only) |
| Files (check 1) | `git diff --stat 74138d3 ac9f1e0`: `src/timer/store.ts` +54 / −23, `src/timer/intentionRace.test.ts` +105, `tests/w3-intention-race.spec.ts` +40. **No `sync.ts`, `ticker.ts` or `Composer.tsx` change** |
| Dev | :5561 restarted; `verify.sh` → `PORT 5561 serves ac9f1e0 (src b74e6b3): VERIFIED` |
| Evidence | `F1FIX/logs/r2/*.log.txt`; `scripts/chain2.sh.txt` |

### 8.1 The change
**Mechanism.** The intention-only save becomes a general **fields-only save**:
- `FieldSave` `store.ts:255`, `saveFieldsOnly` `:282`, `savingOnly` `:326`;
- the same decision as before: the whole timer after this tab's own failed save; the whole timer when nothing is stored; nothing over another session; otherwise only the given fields into what storage holds now. Same key, envelope and field order;
- new option `idleOnly` (`:310`): write only over an **idle** stored timer;
- new option `memoryOnly` (`:283`): write nothing.

`setIntention` (`:510`) uses it unchanged, with fields `intention`/`tag`.

**`syncIdleLength` (`:536`):**
- not idle, or nothing to change → returns, as before (a no-op writes nothing);
- **the person changed the length in this tab**, or at boot → a fields-only save of `phase`/`plannedMs`/`remainingMs`, `idleOnly`. Over the same idle session in storage now it changes only those three. Over another session, or a running or paused timer, nothing. After its own failed save, the whole timer (the storage-full repair, as before);
- **following another tab's change** (`:541`: `useSettings.persist.hasHydrated()` is false; zustand runs the settings subscribers, and so `ticker.ts:304`, inside `rehydrate()`, before it sets hydrated) → **memory only, no write**. The other tab saved the length, and every tab derives its idle length from its settings anyway (`sanitizeTimer`'s `idle()`).

**Why the second branch is needed (found in a real browser, not in the harness):**
- `f7b66da` (fields-only for every tab) passed LEAD's harness case, but **failed my Playwright case on the fix** (`r2/d1-try2-5561.log.txt`): B's brew was undone at once.
- Tab A gets B's `kettle:settings` event **before its own copy of localStorage has B's `kettle:timer` write**. Chromium delivers storage changes in write order, and the settings event task runs before the timer change is applied to the tab's copy. So any read A makes then sees the old timer, or nothing.
- The setIntention no-op had the same root; here the trigger is the other tab's own write, so it is deterministic.
- So a tab that is only following another tab's change must not write at all. This is LEAD §5's second option, applied to the following tab.
- The Vitest race models this with the stale-copy hook and **fails on `f7b66da`** (below).

### 8.2 Check 2: deterministic Vitest (`src/timer/intentionRace.test.ts`, 12 tests: the 7 earlier ones + 5 new)
The harness now subscribes the timer to `focusMin` exactly as `ticker.ts:304` does. `settingsEvent()` = `useSettings.persist.rehydrate()` (another tab's settings change arriving); `pickLength(n)` = this tab's person setting `focusMin`.

| New test (F1X-D1) | `4d36939` | `f2298d3` | `74138d3` | `f7b66da` | **fix** |
|---|---|---|---|---|---|
| **The race (LEAD's case, completed):** both tabs in step on a saved idle timer. B picks 50 min and starts. A takes in B's settings change first, **with its copy of `kettle:timer` still the old idle one** (the browser's order). Asserted: storage still holds B's `running` session, `endsAt`, `startedAt`, 50 min and B's words; after the timer events both tabs `running` on B's session (A `start`, B nothing); completes once (A leads); 1 record in storage and in each tab | **FAIL** | **FAIL** | **FAIL** | **FAIL** | pass |
| A real length change persists, **one tab**: nothing stored → whole idle timer at 40 min (as before); then over the same idle timer → byte-identical except `plannedMs`/`remainingMs`; a fresh tab loads 30 min with the words | pass | pass | pass | pass | pass |
| A real length change persists, **two tabs in step**: A picks 45 min while B's newer words are in storage → storage has 45 min **and B's words**; B takes in the settings change → storage unchanged; both tabs at 45 min with B's words | **FAIL** (A's stale words written back) | **FAIL** | **FAIL** | pass | pass |
| A sync that changes nothing writes nothing (storage marked, then `syncIdleLength()` and `pickLength(same)` → byte-identical) | pass | pass | pass | pass | pass |
| Storage full: after this tab's own failed save, the length sync writes the whole newer timer (repair), as before | pass | pass | pass | pass | pass |

| Tree | Result | Log |
|---|---|---|
| `4d36939` | 6 failed / 6 passed (the 4 F1 cases + D1 race + two-tabs-in-step) | `r2/vitest-race-on-4d36939.log.txt` |
| `f2298d3` (`793321b`) | 6 failed / 6 passed | `r2/vitest-race-on-f2298d3.log.txt` |
| **`74138d3`** | **2 failed** (D1 race, two-tabs-in-step) / 10 passed | `r2/vitest-race-on-74138d3.log.txt` |
| `f7b66da` | 1 failed (D1 race, stale copy) / 11 passed | `r2/vitest-race-on-f7b66da.log.txt` |
| **fix `ac9f1e0`** | **12/12** | `r2/vitest-race-on-fix.log.txt` |

Older trees were run as before: `git archive <rev> kettle/src kettle/vite.config.ts kettle/package.json kettle/tsconfig*` into scratch, `node_modules` symlinked, this test file copied in.

**Check 3:** the 7 earlier race tests pass on the fix (above); **Vitest, all: 33 files, 314/314** (`r2/vitest-all-fix.log.txt`); tsc clean (`r2/tsc-fix.log.txt`).

### 8.3 Real browser: `tests/w3-intention-race.spec.ts`, new case "F1X-D1"
Two tabs of one profile on Today, as for F1.
1. A's `kettle:timer` **and** `kettle:settings` events are held.
2. In one task, B sets `focusMin` 50 (its own idle length follows) and starts a 6-second brew.
3. Polls until storage holds B's session and A has both kinds of event held.
4. **A's settings events are released** (its timer events still held): A takes in the length change while B's brew is already in storage. This is the order of a tab that is a moment behind.
5. Asserted: A's idle length is 50 min, and A is still idle with no session (precondition). After 300 ms, **B is still running** (any write by A would have reached B). **Storage still holds B's brew.** Then everything is released: both tabs go to Focus on B's session, then to the summary, with **one record** in storage and in each tab.

**Why there are two versions:** the first (`ac9f1e0`) did not hold the settings events. A could then handle them, and write, before B's running write committed: harmless ordering, but the case failed on base only 1/3 (:5560) and 2/3 (:5562) (`*-d1v1.log.txt`). The final version (`10ecf2c`, tests only) is deterministic:

| Server | F1X-D1 case ×3 | Log |
|---|---|---|
| :5561 fix | **3/3 pass** | `r2/d1v2-5561-x3.log.txt` |
| :5560 `f2298d3` | **3/3 FAIL**: "B's brew is still running in B (not undone by A's length sync)" | `r2/d1v2-5560-x3.log.txt` |
| :5562 `74138d3` (LEAD's trial `w6tr-x@986bda4`, src identical to `74138d3`; used read-only) | **3/3 FAIL**, same | `r2/d1v2-5562-x3.log.txt` |
| :5478 `4d36939` | **3/3 FAIL**, same | `r2/d1v2-5478-x3.log.txt` |

On base the brew is undone **in B itself** within moments: A's idle write reaches B, and B mirrors `reset`. This is F1's full-run signature.

### 8.4 Check 4: storage compatibility (`scripts/compat.spec.ts.txt`, unchanged), all byte-identical
| FROM → TO | idle | paused | Log |
|---|---|---|---|
| base `4d36939` → fix | pass | pass | `r2/compat-base4d-to-fix.log.txt` |
| fix → base `4d36939` | pass | pass | `r2/compat-fix-to-base4d.log.txt` |
| integration `f2298d3` → fix | pass | pass | `r2/compat-int-to-fix.log.txt` |
