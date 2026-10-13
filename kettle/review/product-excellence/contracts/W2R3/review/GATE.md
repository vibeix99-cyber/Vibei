# Wave 2 round 3: packet gates (orchestrator)

**Base:** `61aba17` = integration after merging **C** (the Blender Chai on every tier: `MODEL_ON_LOW=true`, per Vibei's sign-off) on top of `2f67fc1` (P). kettle/src `4556926`.
- **C's merge equals its tested trial:** `0f01c47` has the same src, tests and `vite.config.ts`.
- **Lane R's targeted regression of C** (`contracts/W2R2/review/LRC/RECEIPT-LRC.md`):
  - chai3d + w2-room specs: 16/16, twice.
  - vitest 289/289; tsc 0.
  - Default tier on this machine is low, and the model loads there. 0 frames without Chai.
  - Unlock card: procedural on both sides in 24/24 captures (PRESERVE 8).
  - Low-tier performance, model vs procedural: frame median 94–95 vs 94–101 ms; 108 vs 111 draw calls; 74,910 vs 76,752 triangles; +2 textures; +4 programs; about +0.3 MB heap.
  - timer/pwa: 29 passed + 2 skipped.
  - Full chromium: 106 passed, 1 failed (`a11y:109` under load), 7 not run (the rest of that serial file). Rerun alone, `a11y.spec` passed 11/11 on both the trial and control.
- **Base servers:** worktree `/home/user/wt/w4-base`, dev **:5470**, preview **:5480** (verified).
- **BEFORE set:** `contracts/W2R3/BEFORE-61aba17/` (`r2before.mjs`), Monday recipe day, 20 configurations. In progress.

**Makers** (Opus, high effort):

| Maker | Item | Branch | Worktree | Ports | Budget |
|---|---|---|---|---|---|
| **T2** | I10, notices without overlays (inline Undo + one in-flow strip per screen) | `pe/w2r3-notices` | `/home/user/wt/w4t2` | 5471/5481, 5474/5484 | 4 h, to about 23:50 UTC |
| **B** | "Warm Streak" → "Warm Days" (display name only, migration-safe) | `pe/w2r3-badge` | `/home/user/wt/w4b` | 5472/5482 | 45 min, to about 20:37 UTC |

**File ownership:**
- **T2:** `src/ui/**`, `src/app/**`, `src/screens/home/**`, `src/screens/focus/**` except `stage/**`, the Undo parts of `stats/**` and `settings/**`, and the toast-related specs.
- **B:** `src/progress/badges.ts` (names), display-time resolution under `progress/**`, and the tests that assert the name.

## Maker B: "Warm Streak" → "Warm Days". GATE PASSED, 2026-10-13 ~20:25 UTC

| Item | Result |
|---|---|
| Packet | `/home/user/wt/w4b/kettle/review/product-excellence/contracts/W2R3/B-READY-FOR-REVIEW.md`. Evidence is in `…/W2R3/B/` |
| Revision | `pe/w2r3-badge@2994005`, code `0a95fbc`, kettle/src `f40b306` |
| Files | `src/progress/{badges.ts, validate.ts, seed.ts (comments), engine.test.ts}`, `src/screens/done/{rank.test.ts, summary.ts}` and `tests/w2-summary.spec.ts`. `summary.ts` has a **one-line comment change only**; it is Maker P's merged file and owned by no maker this round, so it is noted, not a conflict. No T2 file changed |
| Design | Title "Warm Days". `badgeTitle(id, stored)` resolves the name from the id. `coerceData` resolves `lastReport.badges[].title` from the id **on a copy**, so stored data is never rewritten. That field is the only place a title is persisted; backups and export store ids |
| **Trial** | **`e1ddf9d`** = integration + `2994005`, worktree `/home/user/wt/w4tr-b`, src `f40b306`. Dev **:5475** (verified; served `badges.ts` matches), preview **:5485** |
| Maker's results | A real pre-rename profile, made on the BEFORE build, shows "Warm Days II" on the summary pill, its aria label, the announcement and Stats › Badges. The stored data is byte-identical after load. tsc 0; vitest 290/290; `w2-summary` 18/18; `a11y` + `integrity` 24/24; `statusbar` 9/9. The full chromium suite was not run (time) |
| Follow-ups noted | The badge description still says "warm streak". `docs/areas/progress.md` has a dated history entry. Non-badge "warm streak" wording sits in T2's files: `StreakCard`, `Rail`, Settings, `DataSection` and `Gallery` |
| Archive | `archive/pe-w2r3-badge-2994005.incremental.bundle` |

## Verdict B: APPROVE (`CHECKER-W2R3-B.md`), merged as `8df3076`
- **Merge check:** the merged src `f40b306` and tests `cf55287` equal the B trial `e1ddf9d`.
- **The lead's ruling B-A1, ACCEPTED:** the display name is persisted on the next ordinary write. `lastReport` is the summary's temporary copy, written as null in backups and never used in any arithmetic.
- **Follow-ups:**
  - B-F1: at 200 % the tier numeral can sit alone on the pill's last line. This already happens on the base; the fix is a no-break space.
  - B-F2: the badge description still says "warm streak". Vibei decides the wording.
  - B-F3: other "warm streak" wording (`StreakCard`, `Rail`, Settings). Vibei decides the wording.
  - B-F5: Stats tiles break mid-word at 200 %. Already on the base.
  - B-F6: floating toasts over the chips and Brew length. Already on the base; that is T2's work.
- **Next:** T2's trial will be integration `8df3076` (with B) + T2. That trial is also the combined trial for Lane R.

## Maker T2: notices without overlays (I10). GATE PASSED, 2026-10-13 ~21:50 UTC

| Item | Result |
|---|---|
| Packet | `/home/user/wt/w4t2/kettle/review/product-excellence/contracts/W2R3/T2-READY-FOR-REVIEW.md`. Evidence: `…/W2R3/T2/` (108 MB) |
| Revision | `pe/w2r3-notices@6a64fbf` (packet), code `61b463c`, kettle/src `5aa6228` |
| Files (ownership OK) | `src/ui/{Toast.tsx, Toast.module.css, InlineUndo.tsx (new), moment.ts (new), Sheet.tsx, index.ts}`, `src/app/{App.tsx, App.module.css, Shell.tsx, Shell.module.css, ShellOverlays.tsx, debug.ts}`, `src/screens/focus/*` (not `stage/`), `src/screens/home/*`, the Undo parts of `src/screens/stats/*` and `src/screens/settings/*`. Tests: `notice-strip.spec.ts` (new), `w2-home.spec.ts` (H's, restored), `toast-room`, `integrity`, `statusbar`, `break-reach` and `a11y`. Not touched: `SaveWarning*`, `scene/**`, `screens/done/**`, `focus/stage/**`, `public/**`, `vite.config.ts` and `badges.ts` |
| Design | No overlays: floating, zone, fold and lift code removed. One in-flow strip per screen: the top of the page on the tabs, portrait Today and Welcome; the head of the pinned left column on landscape Today; the head of the panel or summary layer in a session. One notice at a time, queued; the update prompt yields; a notice's clock runs only while it is ≥ 60 % in view; the queue carries over a route change. Inline Undo (`InlineUndo.tsx`) on Today's Mark done, the deleted History row and the Your data import row. `moment.ts` limits when the strip may change: first frame, the person's own tap, wholly above the view (scroll compensated), or at rest (1.2 s). H's Brew length restored. The End sheet is out of the frozen frame. Sheet focus returns to Today's main |
| **Trial** | **`490ca97`** = integration `f1f059c` (with **B**) + `6a64fbf`, worktree `/home/user/wt/w4tr-t2`, src `62672e1`. Dev **:5476** (verified; served `Toast.tsx`, `InlineUndo.tsx` and `badges.ts` match), preview **:5486**. **This is also the combined trial for Lane R** (B + T2 on `61aba17`) |
| The maker's results, control first | **W2H-D1:** notice-over-control frames 24–203 → 0; dialog/inert frames on Today 7–23 → 0; Brew length 9/9 in view. **c:** 360/360 → 0/122. **e:** 428 frames over the readout and 9 over controls → 0. **d:** the fold no longer reproduces on `61aba17`; the base silently dropped one of four notices, the fix shows all four in turn. **f:** the base fails Mon/Thu at 375×667 and Mon/Thu/Sun at 390×844; the fix passes all 13. R5-D1, LEAD-D1 and R7-D1 controls each fail 2/2; the fix passes `toast-room` 14/14 and D4 4/4. **Invariant spec:** 25/25 configurations, 0 overlaps in about 1,700–1,860 checked notice frames each |
| Suites (maker) | tsc 0; vitest 289/289; chromium 166/167 (`chai3d:98`, scene, passes 2/2 alone on fix and base); timer/pwa 29 + 2 skipped. Flakes now wait on real state: `:1090`, `:1004`, `statusbar:106` and `a11y:109` |
| Open findings (maker §7) | At 375×667 @200 "Delete this brew?" can't be reached by tap or Tab (base too). `:1004` cause not established. At 1440 @200 a Mark done click sometimes didn't register under heavy load (later 25/25). Residual: a finger in the air can meet a change made at rest |
| Archive | `archive/pe-w2r3-notices-6a64fbf.incremental.bundle.part-00..01` (+ `.sha256`) |
