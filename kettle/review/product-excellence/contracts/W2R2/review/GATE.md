# Wave 2 round 2: packet gates (orchestrator)

**Base:** `b377c62` (kettle/src `e0aebbf`). Control `/home/user/wt/w3-base`: dev **:5410**, preview **:5430**.
**BEFORE set:** `contracts/W2R2/BEFORE-b377c62/` (`r2before.mjs`).
**Design gate T:** APPROVE of `TOAST-ARCHITECTURE.md` @ `dabc8f3`, with binding rulings (`contracts/W2R2/DESIGN-GATE-T.md`).

## Maker P: summary polish (I07 follow-up). GATE PASSED, 2026-10-12

| Item | Result |
|---|---|
| Packet | `/home/user/wt/w3p/kettle/review/product-excellence/contracts/W2R2/P-READY-FOR-REVIEW.md`. Evidence is in `…/W2R2/P/` (98 MB) |
| Revision | `pe/w2r2-summary@dc7a28d`, which is code `a4f1773` (`23e7494` plus a spec-only fix) plus the packet. kettle/src is `f255e9f3fad326ec059d134ff776a8f6254436d9` |
| Files (ownership OK) | `src/screens/done/{Summary.tsx, Summary.module.css, summary.ts, rank.test.ts}`, `src/screens/focus/stage/{Kettle.tsx, Stage.tsx}` (one `data-stage-figure` attribute each) and `tests/w2-summary.spec.ts`. It touches no T- or C-owned file, and leaves the footer's `data-toast-above` and all toast code alone |
| **Trial merge** | **`d07bd2d`**: integration plus `dc7a28d`, in worktree `/home/user/wt/w3tr-p`. src `f255e9f`, equal to the branch. Dev **:5442** (served `Summary.tsx` and `Stage.tsx` verified), preview **:5452** |
| Maker's results | Chai and the kettle are whole above the sheet on arrival on 24/24 stacked phone runs (the control managed 4/24). The lift is now 0–12 px (it was 0–111). The milestone card dropped from 17px/700 to 16px/600, below the minutes (28px/600), and its area from 24,711 to 16,750 px², below Tea time's 20,100 px². "streak" in the summary's own copy: 100 on the control, 0 on P. The end state clears the footer by at least 47.4 px stacked. Lines cut by the fold: 4 on both builds (the side-by-side unlock picture, R-1) |
| Suites (maker) | tsc exits 0. vitest 278/278. Full chromium at `--workers=2`: 103/105. The 2 failures are `break-reach.spec.ts:179`, which fails identically on `b377c62` in 2 reruns; that is T's item f. timer-harness and timer-app: 26 passed, 2 skipped by design. pwa: 3/3 |
| Decisions flagged | (1) The badge name "Warm Streak" still appears, because it comes from `src/progress/badges.ts`, which has another owner. P suggests renaming it "Warm Days" across Kettle. (2) An accepted trade-off: at 375×667, on the task/unlock day and at 200 %, the highlight starts a scroll away on arrival |
| Archive | `archive/pe-w2r2-summary-dc7a28d.incremental.bundle.part-00..01` (+ `.sha256`), reassembled and verified |

## Maker C: 3D Chai integration (I06). GATE PASSED, 2026-10-13 ~11:00 UTC

| Item | Result |
|---|---|
| Packet | `/home/user/wt/w3c/kettle/review/product-excellence/contracts/W2R2/C-READY-FOR-REVIEW.md`. Evidence is in `…/W2R2/C/` (77 MB). The art-review sheet for Vibei is `C/art/ART-REVIEW-SHEET.png`; contact sheets are `C/captures/SHEET-*.png` |
| Revision | `pe/w2r2-chai3d@2843fb0`. Code `c698d74`; then `14e758e` (spec), `563bd28` (evidence), `d59e015` (the orchestrator's WIP save) and `2843fb0` (packet). kettle/src is `42b2c1c2615f4c95013cd6cdf931729543d2dae8` throughout |
| Base | `assets/chai3d-r1@68caa31` = integration `15e8abe` (app `b377c62`) + "Add 3D Chai r1 (Blender)". The orchestrator verified the `chai.glb` hash `b401bc6c…63d7e`; the runtime copy `src/scene/engine/models/chai.glb` is identical |
| Files (ownership OK) | `src/scene/{NookScene.tsx, chaiHost.ts, index.tsx, resolve.ts, warm.ts}`, `src/scene/engine/{Engine.ts, chai.ts, chaiLoad.ts, chaiModel.ts, chaiModel.test.ts, kit.ts, models/chai.glb}`, `tests/chai3d.spec.ts` (new) and `vite.config.ts` (precache). No 2D art, and no T or P file |
| **Trial merge** | **`d23bc04`** = integration + `2843fb0`, worktree `/home/user/wt/w3tr-c`, src `42b2c1c`. Dev **:5443** (served `chaiModel.ts`, `chaiHost.ts` and `Engine.ts` verified), preview **:5453** (bundles `chai-*.glb`) |
| What ships by default | The model loads on the **high tier only** (`MODEL_ON_LOW = false`). Low tier, 3D off and no-WebGL behave as before, and any load, timeout or validation failure keeps the procedural Chai. The summary unlock close-up never adds the model (PRESERVE 8). The model is precached (+45.6 KB; the change adds +155.6 KB to the precache) |
| Maker's results | `chai3d.spec` 8/8: 404, 8 s timeout, invalid file, missing loader chunk, 3D off, low tier, context loss and restore. Placement: awake and sip at ×1.12, unchanged; nap gets a 0.031 forward offset because it overhung the rim by 0.046. Perf on SwiftShader is within noise, with 3–6 fewer draw calls, +2 textures, +4–6 programs and +0.5 MB heap |
| Suites (maker) | tsc 0. vitest 285/285. `w2-room` 7/7 (targeted). Full chromium (`--workers=2`) 99/103: `break-reach` ×2 fails identically on control; statusbar resize passes on rerun on both; the `w2-room` context-loss test fails under load at 1 of 3 on **both** builds when run at the same time. timer-harness 14/14, timer-app 12 + 2 skipped by design, pwa 3/3 |
| Decisions flagged | (1) Low tier keeps the procedural Chai (most iOS and 4-core phones) until someone measures a real low-end phone. (2) The summary close-up shows the old Chai unless the reused engine already carries the model. (3) Art: under the room's warm lamp and stove light the fur reads darker and warmer than the flat sheet; lighting is unchanged |
| **Merge** | Needs **Vibei's art sign-off** in addition to the lead's verdict |
| Archive | `archive/pe-w2r2-chai3d-2843fb0.incremental.bundle.part-00..01` (+ `.sha256`), covering `15e8abe..2843fb0` and so including the asset commit |
