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
