# CHECKER W3R1 · F1FIX: the `integrity:309` intention-save race

**Verdict: DRAFT, pending Lane R's receipt (`review/F1FIX-LR/RECEIPT-LR-F1FIX.md`).** My reading so far: **REJECT, with one defect for the fix round.** F1X-D1 is audit #1 (`syncIdleLength`), which I rule to be **the same bug**: shown deterministically on the fix, §4. Everything else in the fix verifies.

| | |
|---|---|
| Lead checker | LEAD-5. I implemented none of this work |
| Binding | `VB-DECISIONS-POSTFOLLOWUP.md` §1; `BRIEF-F1FIX.md`; root cause `review/F1-ROOT-CAUSE.md` (assessed in `CHECKER-W3R1-CROSS.md`) |
| Under review | `pe/w3r1-f1-intention@74138d3`: app code `9a41a1a` + `882233b`; src `e2041c1` (`git rev-parse 986bda4:kettle/src`, checked). The last commit touches tests only |
| Trial | `986bda4` = integration (app `f2298d3`) + `74138d3`; worktree `/home/user/wt/w6tr-x`; dev :5562 (my runs) |
| Controls | integration `f2298d3` :5560; old base `4d36939` :5478 |
| Packet | `contracts/W3R1/F1FIX/F1FIX-READY.md` (through `d9c0dd7`); logs and scripts beside it |
| My evidence | `contracts/W3R1/review/LEAD/F1FIX/` (`chain1.sh`, `chain2.sh`, logs as `.log.txt`, the scratch test `scratch-syncIdleLengthRace.test.ts.txt`) |

## 1. Scope and code (read in full)
`git diff --stat f2298d3 986bda4 -- kettle/src kettle/tests` lists three files:
- `src/timer/store.ts` (+100 / −20);
- the new `src/timer/intentionRace.test.ts`;
- the new `tests/w3-intention-race.spec.ts`.

`Composer.tsx` and `integrity.spec.ts` are unchanged. **In scope.**

### (a) A save that changes nothing writes nothing
`setIntention` returns early when the words and tag equal what this tab holds. That removes the composer's mount sync and every repeat sync, which were the writes behind every observed failure (the maker's probe: 20 writes per 20 runs on `84a7e18`, **0 on the final**).

### (b) A save that changes the words writes only the words, into what storage holds now
`setIntention` snapshots the persisted fields (`intentionSave`) around its `set`. zustand 5's `persist` calls `storage.setItem` synchronously inside `setState`, so the window is exact.

The persist storage is a thin wrapper (`timerStorage`). A save during that window **that changes nothing but `intention`/`tag`** (`onlyIntentionChanged`, compared field by field over `INITIAL_TIMER`'s keys) goes to `saveIntentionOnly`. `INITIAL_TIMER` is typed `TimerState` and holds exactly the 14 persisted fields, so a new field cannot slip past. `saveIntentionOnly` handles four cases:
1. **This tab's own last save failed:** write whole, which keeps the storage-full repair.
2. **Nothing readable, or another envelope version:** write whole (a fresh profile).
3. **Storage holds another session:** write nothing.
4. **Same session:** write the stored envelope back with only `state.intention` and `state.tag` replaced.

Any other save, including a nested one by a listener that changes other fields, is written whole, as before. `partialize` is the same 14 fields in the same order (`persistedTimer`, moved, not changed).

**What (b) does to a stale tab's typed words.** They are dropped when another session is stored (case 3). That is right: they were typed for a timer that has moved on, and the arriving event navigates that tab to the running brew.

**It meets Vibei's §1:** "Saving the intention writes only the intention … read fresh, or update just the intention field."

## 2. The deterministic tests fail on base and pass on the fix (my runs)

**Vitest `src/timer/intentionRace.test.ts`** (7 tests; the two-module-graph tab harness, no load, no timing). I ran it on the fix trial's tree, and on scratch `git archive`s of `f2298d3` and `4d36939` with the same test file copied in (`LEAD/F1FIX/vitest-race-*.log`):

| Tree | Result | Failing |
|---|---|---|
| fix (`986bda4`) | **7/7** | — |
| `f2298d3` | **4 failed / 3 passed** | the four race cases: a new brew survives the save; an ended brew is not brought back; a pause is kept; a no-op save from a doubly stale tab writes nothing |
| `4d36939` | **4 failed / 3 passed** | the same four |

The three that pass everywhere are compatibility guards: same format, a fresh profile saves as before, and the storage-full repair. They should pass on base too.

**Playwright `tests/w3-intention-race.spec.ts`** (real browser, two tabs of one profile; tab A's `storage` events held by an init script; the precondition "A still idle" asserted before A types), through the gate:

| Server | Result | Log |
|---|---|---|
| :5560 integration `f2298d3` | **3/3 FAIL** at "storage still holds B’s running brew" | `LEAD/F1FIX/race-5560-x3.log` |
| :5478 base `4d36939` | **3/3 FAIL**, same assertion | `LEAD/F1FIX/race-5478-x3.log` |
| :5562 fix | **5/5 pass** (1.4 min) | `LEAD/F1FIX/race-5562-x5.log` |

**The new tests are right.** Both reproduce the race without load or luck; both fail on base and pass on the fix. Vibei's test requirement is met.

## 3. Storage compatibility (my runs)
I ran the maker's `compat.spec.ts` (read: real composer typing on FROM, every `kettle:*` key copied into a fresh profile on TO before boot; it asserts the envelope keys, version 1, the 14 fields in order, and TO's in-memory timer equal to FROM's stored state):
- **base `4d36939` → fix: 2/2** (idle profile with `lastEnded`; paused profile);
- **fix → base: 2/2.**

I compared each pair's printed `kettle:timer` myself: saved by FROM against the same key after TO booted and its composer synced. **All four are byte-identical** (370 / 303 bytes). The fix's idle profile's last save was an intention-only save (case 4).

Code agrees: same key, same `{ state, version: 1 }` envelope, `partialize` unchanged in content and order, no migration. **PASS.**

## 4. The audit: my rulings

The maker's table (packet §5) lists every other `set` in `store.ts` that persists the whole timer, with file:line and trigger. I checked each against the code. The question for each: **is it the same bug?** That is, can a tab that has not yet taken in another tab's newer timer write put its stale whole timer over storage **automatically**, without the person acting on that tab's timer?

### #1 `syncIdleLength` (`store.ts:416` base / `:506` fix): **the same bug. It is F1X-D1, for this round.**
**The trigger is automatic, in every idle tab.**
- On Today, picking 15 / 25 / 50 min calls `applyRhythm` (`Composer.tsx:286` → `settings.ts:111`), which changes `focusMin` and writes `kettle:settings`.
- Every other idle Kettle tab, on any screen, gets that `storage` event, rehydrates its settings (`sync.ts:176–178`), and its subscription (`ticker.ts:304`) runs `syncIdleLength`.
- `syncIdleLength` then `set`s `plannedMs` / `remainingMs`, and `persist` writes that tab's **whole** idle timer.

**The race follows a natural sequence:** pick a length, then tap Start. Events arrive in write order, so the other tab handles the settings event, and writes its idle timer, before it has taken in the start. If Start came within the event lag (a few ms unloaded, 0.1–0.6 s under load), the brew is undone in both tabs with no record. That is F1's outcome, with no typing at all.

**Shown deterministically, on the fix.** I wrote a scratch case in the maker's own Vitest harness (`LEAD/F1FIX/scratch-syncIdleLengthRace.test.ts.txt`; not committed to the branch):
1. B sets `focusMin: 50` and starts a brew; storage holds it running.
2. A rehydrates its settings (B's settings event) and runs `syncIdleLength`, as its subscription would, before taking in B's timer write.

Result: **storage holds `status: 'idle'`**, so B's brew is gone. That is **1/1 FAIL on the fix `74138d3`** and **1/1 FAIL on `f2298d3`** (`LEAD/F1FIX/scratch-syncIdleLength-on-*.log`).

**Why the same bug and not a FOLLOW-UP.**
- **Same mechanism and outcome:** an automatic whole-timer write from a stale tab, undoing another tab's brew in both tabs with no record.
- **A more natural trigger than F1's:** F1 needed Today mounting or typing in the other tab. This needs only another Kettle tab open and idle, and the person's own length-then-Start.
- **Narrower exposure in time:** it needs a length change just before the start.

Vibei's §1 asks me to say whether one is the same bug. It is, so it is fixed this round.

### #2 `rebase` (`:404` / `:499`): **FOLLOW-UP**
Automatic, but only in the leader, only while not idle, and only on a wall-clock jump back (or remaining > plan) inside the lag. Same shape, but it needs a clock jump inside a 0.1–0.6 s window. Rare.

### #3–#6 `pause` / `resume` / `toggle`, `addTime`, `end` (and `endActive`), `startFocus` / `startBreak`: **FOLLOW-UP (not the same bug)**
They write only on the person's own action on that tab's timer (a tap, Space, the OS media keys). One person cannot act on tab Z within the lag of starting in tab A. Starts replace by design (last writer wins; `multitab.test.ts`), and the completion case is already guarded.

### #7 `reset`: **ACCEPTED (by design)**
A deliberate wipe (reset or import), or mirroring a cleared key.

### `tick`: **not the same bug**
It re-reads storage first (`guard.refresh()`), with the `lastEnded` and IndexedDB claims for exactly-once.

### The maker's open item: a real edit typed in a tab whose copy of storage is also behind: **FOLLOW-UP, not blocking**
Case 3 of `saveIntentionOnly` relies on that tab's read of storage being current. If the browser has not yet updated the tab's copy either, a *real* change (typed words, Done / Carry, the day turning at midnight) inside the lag still writes over the newer state.
- **Typed words and Done / Carry** are the person acting in Z within 0.1–0.6 s of starting in A. One person cannot do that.
- **The day turning** (`Composer.tsx:77`) is automatic, but only at midnight and only inside the lag.

The robust guard is on the receiving side (`sync.ts`): the tab that owns a running session re-asserts it when it sees that session replaced by an idle state with no `lastEnded` for it. That one guard would close #2–#6, this item, and any future writer of the same shape. It is outside this brief, so it is a **FOLLOW-UP for Vibei / the timer owner**, recommended for the next round.

## 5. Defect

### F1X-D1 · `syncIdleLength` writes a stale tab's whole idle timer over another tab's new brew (BLOCKS by ruling: the same bug as F1, Vibei §1 audit)
**Where:** `src/timer/store.ts` `syncIdleLength` (`:506` on the fix). It is triggered by `ticker.ts:304` on every `focusMin` change, including one made in another tab.

**Required** (the approach is the maker's; this is the outcome):
- A brew-length sync never writes this tab's in-memory timer over storage. Either:
  - persist only the fields it changes (`phase`, `plannedMs`, `remainingMs`) into what storage holds now, and only when storage holds an idle timer of the same session as this tab (`sessionId` equal; with idle, null); write nothing when storage holds another session or a non-idle state; or
  - do not persist it at all, if each tab can derive its idle length locally.
- A no-op still writes nothing.
- The storage-full repair (after this tab's own failed save) behaves as before.
- Same key, envelope and field order; no migration.
