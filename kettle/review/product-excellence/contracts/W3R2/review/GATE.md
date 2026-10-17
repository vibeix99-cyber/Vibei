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
