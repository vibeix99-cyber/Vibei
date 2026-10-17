# W3R2 gate record (orchestrator)

## Start, 2026-10-17 16:10 UTC

- **Integration HEAD:** `494748b` (app `5f78af1`, src `b74e6b3`, tests `3e7b189`); clean and equal to origin.
- **Servers verified:**
  - :5560 / :5570 integration (`w6-int`);
  - :5478 / :5488 old base `4d36939` (`w4-final`);
  - :5581 SG (`w8g`), :5582 TH (`w8t`), :5583 TS (`w8q`), each at `494748b`.
- **Slot gate:** MAX 3 (nproc 4 − 1), state reset. Autocommit restarted.
- **Ownership** (PLAN.md): SG `src/timer/*` plus new or extended race tests; TH `src/ui/Toast.tsx`; TS `tests/timer.spec.ts` and `tests/notice-strip.spec.ts`. No overlap, so all three run in parallel.
- **Makers launched:** SG (Opus, stop 19:15), TH (Sonnet, stop 18:15), TS (Sonnet, stop 18:15).

## Item 2, TH (`Toast.tsx:482` hook): GATE PASSED, 2026-10-17 ~18:00 UTC

| Item | Result |
|---|---|
| Revision | `pe/w3r2-toast-hook@203b057` (one commit on `494748b`), src `07df367`. Packet `contracts/W3R2/TH/TH-READY.md` (through `5ad2478`) |
| Scope (checked) | `src/ui/Toast.tsx` only, +5/−1. `NoticeStrip` reads `useContext(Leaving)` and `useIsPresent()` into variables, then `leaving = layerLeaving \|\| !present \|\| off`. Nothing else |
| **Trial** | **`0ad85b9`** = integration `36402ba` (app `5f78af1`) + `203b057`, worktree `/home/user/wt/w8tr-t`, src `07df367`, tests `17d135a` (= integration). tsc 0, vitest **314/314**, build OK. Dev **:5592** (verified, `Toast.tsx` served), preview **:5594** (200) |
| The maker's claims | **Hook-order errors, base :5560 vs fix :5582:** `notice-strip` 24 vs 0, `w3-notices` 9 vs 0, `w3-notices-idle` 0 vs 0 (never leaves Today), `summary-notice` 28 vs 0, `toast-room` 12 vs 0; **total 73 vs 0**. No other new console error, warning or pageerror. Reproducer (start, end, back to Today): base 1/1 ×3, fix 0 ×3. **Audit:** AST rules-of-hooks over 21 hook calls; base flags 1 (`:482`), fix flags 0. `useIsPresent` is a context read only (motion 13.4.4 `use-presence.mjs:64-69`), with no register, so exit timing is unchanged. **Suites on the fix:** notice suite 74/74 (`notice-strip` 25/25); base 73/74, with one `notice-strip` 844×390 light 200 % reduced setup-tap failure (the `press()` re-aim flake, TS's item). **Captures:** 16 configs × 12 states = 192 pairs, plus a base recapture for the noise floor: 148 identical, 34 within noise, 10 flagged. The maker reads all 10 as capture variance (AFTER varies among itself as much as it differs from base, or ≤ 5 px; none in a notice strip; the 2 large ones are focus-scene motion phases, and an AFTER recapture matched base exactly) |
| Not run by the maker | the rest of the chromium project; the timer and pwa projects. One 4 s console smoke test at ~16:08 ran outside the slot gate |
| Archive | `archive/pe-w3r2-toast-hook-203b057.incremental.bundle` (requires `494748b`) |
| Next | LEAD verdict (Opus) on trial :5592 |

## Item 1, SG (stale-tab guard): GATE PASSED, 2026-10-17 ~18:10 UTC

| Item | Result |
|---|---|
| Revision | `pe/w3r2-sync-guard@54a9721` (`c917293`, `e18b621` app final, `54a9721` adds a Vitest case), src `dd6944e`. Packet `contracts/W3R2/SG/SG-READY.md` |
| Scope (checked, `494748b..54a9721`) | `src/timer/store.ts` (+79/−6 overall with sync), `src/timer/sync.ts`, new `src/timer/staleTab.test.ts` (+563), new `tests/w3r2-stale-tab.spec.ts` (+193). Nothing else: `multitab.test.ts`, `Composer.tsx`, `timer.spec.ts`, `notice-strip.spec.ts` and `Toast.tsx` are untouched |
| **Trial** | **`88d6b64`** = integration `339d85c` (app `5f78af1`) + `54a9721`, worktree `/home/user/wt/w8tr-g`, src `dd6944e`, tests `4701f04`. tsc 0, vitest **338/338**, build OK. Dev **:5591** (verified; `store.ts` and `sync.ts` served), preview **:5593** (200) |
| Design (the maker's) | **Write side** (`store.ts`): every action except `tick`, `reset`, `setIntention`, `syncIdleLength` and `toggle` first takes in what storage holds now. On the same brew it acts on the brew as it is now; on an ended or replaced brew it does nothing and shows the current one; new actions are guarded by default. **Receive side** (`sync.ts` `olderThanMine`): before adopting a stored state, a tab holding a newer brew keeps it and saves it back, which covers the doubly stale case in any event order. "Newer" uses existing fields only. `reset()` now removes the key first, so other tabs follow a wipe. Storage format unchanged |
| The maker's claims | `staleTab.test.ts` 24 cases: **17 fail on HEAD**, 24/24 on the fix (10× deterministic); per trigger: rebase, pause, resume, +5, end, start, doubly stale typed edit (including 3 tabs), doubly stale pause. Browser spec: **12/12 fail on :5560**, 4/4 fail on :5478; 12/12 + 4/4 pass on the fix. The singly stale typed edit passes on HEAD (F1 already guards it). Existing race tests 71/71; `w3-intention-race` 6/6; vitest 338/338; compatibility 12/12 byte-identical; `integrity:309` ×20 under load **20/20 ×2**; integrity 25/25; `w2-home` 18/18; timer 26 + 2 skipped; pwa 3/3 |
| **LEAD ruling needed** | `multitab.test.ts:229` asserts `intention` is `'from B'` (last writer wins). It stays green only because that harness does not install the new catch-up; with the app's wiring, B joins A's brew. The maker proposes installing the catch-up in the harness and expecting `'from A'` (15/15). The file is not edited |
| Open (packet §7) | Same-brew older fields while doubly stale (e.g. A's +5 lost; telling versions apart would need a stored field). A bfcache-restored paused brew could come back over an idle timer, never over a live one. `flow.ts` `startNextBrew` leaves `suppressNextStop` set when its `end` no-ops (same gap on HEAD at 0:00). The Focus screen "+5 min" note shows when the +5 was dropped. Composer label: unchanged, logged |
| Archive | `archive/pe-w3r2-sync-guard-54a9721.incremental.bundle` (requires `494748b`) |
| Next | **Lane R2** (Sonnet) regression on :5591; then the LEAD verdict |

## Item 3, TS (test-only stability): GATE PASSED (scope), handed back with its 10/10 target NOT met, 2026-10-17 ~18:20 UTC

| Item | Result |
|---|---|
| Revision | `pe/w3r2-test-stability@21e5644` (`a6b3790`, `21e5644`), tests `59f5e49`; src unchanged (`b74e6b3`). Packet `contracts/W3R2/TS/TS-READY.md` (evidence `d1b9080`) |
| Scope (checked) | `tests/timer.spec.ts` (+13/−5) and `tests/notice-strip.spec.ts` (+33/−5) only. No `src/` change |
| **Trial** | **`6babf87`** = integration `f4e57e1` + `21e5644`, worktree `/home/user/wt/w8tr-q`, src `b74e6b3` (= integration, so specs run against **:5560**), tests `59f5e49`. tsc 0; `--list` gives 53 tests in the 2 files |
| The maker's changes | **timer `:156`:** observer, `startFocus`, the `endsAt`/`sessionId` read and the freeze are one `page.evaluate` chain. Observer-first alone was not enough: `state()` then read an idle timer. All six asserts are unchanged line for line. **timer `:183` (now `:189`):** `setHidden(true)` moved before `start()`; every `expect` is untouched. **`press()`:** a not-on-top re-check is re-read up to 8× at 250 ms (~2 s); a target that left the view is walked back by the existing wheel walk (max 2). The tap still follows only a move-then-on-top read; the expect and its message are unchanged |
| The maker's claims | **Injected race:** the timer pair fails 8/8 on old and passes 8/8 on new. A transient 300 ms cover: old fails, new passes. A permanent cover: both fail with the same message. A 1.5 s cover passes, a 3.5 s cover fails. **Under load** (2 workers + 4 burners, load 12–23): `:156` 10/10 + 10/10 (timer-app, harness); hidden page 10/10 + 10/10. **notice 844×390 dark 200 % ×10: 9/10, NOT 10/10** (one failure, same message). Whole `timer.spec.ts` 26 + 2 skipped. **Whole `notice-strip` 25/25 NOT run** (partial 3/3) |
| Open (the maker's) | The cause of the remaining first-press failure is not observed (candidate, unconfirmed: the sticky docked Start). An UNVERIFIED chrome-aware rescroll patch is in the packet's `scratch/`. The old tests were not run under the same burners as a control. The 2 s window is a judgement |
| Archive | `archive/pe-w3r2-test-stability-21e5644.incremental.bundle` (requires `494748b`) |
| Next | LEAD verdict. Vibei's bar ("each test must pass 10/10 under load") is not met for `press()` |
