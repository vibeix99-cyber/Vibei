# F1X: `integrity:309` intention-save race, fixed (packet, in stages)

| | |
|---|---|
| Brief | `contracts/W3R1/BRIEF-F1FIX.md`; binding `VB-DECISIONS-POSTFOLLOWUP.md` §1; root cause `review/F1-ROOT-CAUSE.md` |
| Branch | `pe/w3r1-f1-intention`, worktree `/home/user/wt/w6x`, local commits only (never pushed) |
| Base | integration `793321b` (app `f2298d3`, src `db6de7e`) |
| Head | `84a7e18` (src `f11b545`); commits `9a41a1a` (fix + Vitest test), `84a7e18` (Playwright test) |
| Dev | :5561, restarted after the fix; `verify.sh` → `PORT 5561 serves 84a7e18 (src f11b545): VERIFIED` |
| Evidence | `F1FIX/logs/*.log.txt` (this folder) |

Status: **stage 1** (change, deterministic tests, fail on base / pass on fix). The rest follows below as it lands.

## 1. The change (scope: `src/timer/store.ts` only; `Composer.tsx` untouched)

`git diff --stat 793321b 84a7e18`: `src/timer/store.ts` +95 / −20, new `src/timer/intentionRace.test.ts`, new `tests/w3-intention-race.spec.ts`. Nothing else.

**Before:** `setIntention` (base `store.ts:399`) was `set({ intention, tag })`. zustand `persist` then wrote `partialize(get())`, which is this tab's **whole** in-memory timer, including `status`, `sessionId` and `endsAt`. That is what put a stale tab's idle timer over another tab's new brew.

**After:**
- `setIntention` (`store.ts:481`) marks the call as an intention save: it snapshots the saved fields first (`intentionSave`, `:254`) and runs the same `set`.
- The persist storage is now a thin wrapper, `timerStorage` (`:298`), around the same `createJSONStorage(() => safeStorage)`.
  - A save made while `intentionSave` is set **and** that changes nothing but `intention`/`tag` (`onlyIntentionChanged`, `:256`, compared field by field against the snapshot) goes to `saveIntentionOnly` (`:269`).
  - Every other save is written whole, exactly as before, even one made during `setIntention`. A listener that started a brew inside it would still be written whole.
- `saveIntentionOnly` re-reads `kettle:timer` **now** and decides:
  1. **This tab's own last save failed** (`lastWriteFailed`, storage full or blocked; `:272`): storage holds an *older* timer than this tab, so it writes the whole (newer) timer, as before. This keeps the storage-full repair: the I03 banner waits for that save.
  2. **Nothing readable stored** (no key, unparseable, or another envelope version): nothing to overwrite, so it writes the whole timer as before. This is the fresh-profile case.
  3. **Storage holds another session than this tab knows** (`stored.sessionId !== this tab's sessionId`; `:294`): another tab started or ended a brew and its `storage` event has not arrived yet. **It writes nothing.** The words were typed for a timer that has moved on, and the other tab's brew keeps its own intention. The event then brings this tab up to date: Focus for a new brew, the summary or Today for an ended one.
  4. **Same session:** it writes the stored envelope back with **only `state.intention` and `state.tag` replaced**: `{ ...stored, state: { ...stored.state, intention, tag } }`. This keeps another tab's newer `status`, `endsAt`, `pausedAt`, `lastEnded` and so on.
- `partialize` now calls `persistedTimer()` (`:229`), the same 14 fields in the same order (moved, not changed).

**Storage format:** the same key `kettle:timer`, the same `{ state, version: 1 }` envelope, the same field order, no migration. The merge keeps the stored object's own keys and order and swaps two values (proven in §3, and in the Vitest test "keeps the stored format").

**Why this shape:** it satisfies "read fresh (merge into what storage holds now) or update just the intention field" for the call that raced, with no change to any other save, to `sync.ts`, to the mirroring, or to the composer. The other whole-state writers are audited in §5 and not changed.

## 2. Deterministic tests: fail on base, pass on fix

### 2a. Vitest `src/timer/intentionRace.test.ts` (6 tests)
This is the two-module-graph tab harness of `multitab.test.ts`: two tabs sharing one localStorage. A tab takes in another tab's write only when its `storage` event is delivered (`mirrorTimerFromStorage({ event: true })`), so "not yet taken in" is exact. There is no load and no timing.

| Test | Base | Fix |
|---|---|---|
| **The race:** B starts a brew; A (not yet taken in) saves `Reply to Sam`; storage still holds B's `running` session, `endsAt`, `startedAt` and B's own words; events delivered → both tabs `running` on B's session; A emits `start`, B emits nothing (no `reset`); completes once (A leads), 1 record in storage and in each tab | **FAIL** (storage `idle`) | pass |
| A has not yet seen B **end** the brew; A's save does not bring it back (storage stays idle, `sessionId: null`; A then mirrors `stop`) | **FAIL** (storage `running` again) | pass |
| Same brew, B paused it; A (still `running` in memory) saves new words → storage = B's paused state with only the words changed; both tabs end `paused` with the new words | **FAIL** (storage `running`) | pass |
| Format: an intention-only save has the same envelope keys, the same state keys in the same order, and is byte-identical to the whole save but for the two values; a fresh tab loads it | pass | pass |
| Fresh profile (nothing stored): saves as before | pass | pass |
| Storage full: after this tab's own failed save, the intention save writes the whole newer timer and repairs storage, as before | pass | pass |

**How "base" was run:**
- **`f2298d3`:** in `/home/user/wt/w6x`, `git stash push -- src/timer/store.ts` (the test file stays), `npx vitest run src/timer/intentionRace.test.ts`, then `git stash pop`. Result: **3 failed / 3 passed** (`logs/vitest-race-on-base-f2298d3.log.txt`).
- **`4d36939`:** `git archive 4d36939 kettle/src kettle/vite.config.ts kettle/package.json kettle/tsconfig*` into a scratch directory, `node_modules` symlinked, the test file copied in. Result: **3 failed / 3 passed** (`logs/vitest-race-on-base-4d36939.log.txt`). `git diff 4d36939 f2298d3 -- kettle/src/timer kettle/src/screens/home/Composer.tsx kettle/src/lib/storage.ts` is empty.
- **Fix:** **6/6** (`logs/vitest-race-on-fix.log.txt`).

### 2b. Playwright `tests/w3-intention-race.spec.ts` (real browser, two tabs, one profile)
Setup:
- An init script, registered before the app's own listener, holds tab A's `storage` events for `kettle:timer` while `__f1.hold` is on.
- `__f1.release()` re-dispatches them in order as real `StorageEvent`s.

Steps:
1. Both tabs are on Today, idle.
2. Hold A's events.
3. **B starts a 6-second brew.** Poll until storage holds B's `sessionId`, and until A has at least one event held.
4. **Precondition** (asserted): A is still `idle` with `sessionId: null`.
5. **A saves its intention with a real keystroke sequence** in its Today composer (`Reply to Sam`), then waits until A's store has the words. A is still idle (asserted).
6. **Assert storage still holds B's brew:** `running`, B's `sessionId`, `endsAt`, `startedAt`, and B's words `Chapter 3 notes`; version 1.
7. Release. Both tabs go to `#/focus` on B's session, then `#/done`. **One record** in `kettle:progress` and in each tab's memory.

| Server | Result | Log |
|---|---|---|
| :5560 integration `f2298d3` | **3/3 FAIL** at step 6: storage holds `{ status: 'idle', sessionId: null, endsAt: null, intention: 'Reply to Sam' }` (A's whole idle timer over B's brew, the F1 signature) | `logs/race-pw-base-5560-x3.log.txt` |
| :5478 old base `4d36939` | **3/3 FAIL**, same | `logs/race-pw-base-5478-x3.log.txt` |
| :5561 fix | **5/5 pass** (12–13 s each) | `logs/race-pw-fix-5561-x5.log.txt` |

Note on Maker Q's earlier attempt (`f1-repro.spec.ts.txt`, which did not reproduce):
- It added its hold listener late, through `page.evaluate`.
- Here the hold is an init script, so it is the first `storage` listener on `window`.
- The test also asserts the precondition (A still idle) before A saves, so a hold that leaks fails the test by name instead of passing it.
- Why Q's version leaked was not investigated further.

**tsc:** clean (`logs/tsc-fix.log.txt`). **Vitest, all:** 33 files, **308/308** (`logs/vitest-all-fix.log.txt`).
