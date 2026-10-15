# CHECKER W3R1 · F1FIX: the `integrity:309` intention-save race

**Verdict: DRAFT, pending Lane R's receipt (`review/F1FIX-LR/RECEIPT-LR-F1FIX.md`).** My reading so far: **REJECT, with one defect for the fix round.** F1X-D1 is audit #1 (`syncIdleLength`), which I rule to be **the same bug**: shown deterministically on the fix, §3. Everything else in the fix verifies.

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
