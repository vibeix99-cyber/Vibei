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
