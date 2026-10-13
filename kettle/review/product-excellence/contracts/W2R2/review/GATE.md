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

## Verdicts so far (LEAD-2, Opus)
- **P: APPROVE.** `pe/w2r2-summary@dc7a28d` (`CHECKER-W2R2-P.md`). **Merged** as `2f67fc1`. The merged kettle/src `f255e9f` and tests `90bf6f5` equal trial `d07bd2d`.
- **C: APPROVE.** `pe/w2r2-chai3d@2843fb0` (`CHECKER-W2R2-C.md`). **Not merged: it waits for Vibei's art sign-off** (§5).

## Maker T: toast architecture (I10). Submitted as WIP at its deadline, 2026-10-13 11:45 UTC

| Item | Result |
|---|---|
| Packet | `/home/user/wt/w3t/kettle/review/product-excellence/contracts/W2R2/T-READY-FOR-REVIEW.md` (status WIP; §9 lists what is missing). Evidence is in `…/W2R2/T/` (59 MB) |
| Revision | `pe/w2r2-toast@4620796`, code `8d0d8a6`, kettle/src `efc44574…` |
| Files (ownership OK) | `src/ui/Toast.{tsx,module.css}`, `src/app/{App.tsx,debug.ts}`, `src/screens/focus/FocusScreen.*`, `src/screens/home/*` (Hero, Composer, HomeScreen, Home.module.css), and tests: `notice-zone.spec.ts` (new), `w2-home.spec.ts` (H's, restored), `toast-room.spec.ts`, `a11y.spec.ts`, `integrity.spec.ts` (4 notice-text locators scoped to the notices group; no assertion changed), `break-reach.spec.ts` (Monday frozen) |
| **Trial merge** | **`acfe851`**: integration `2f67fc1` (which **includes P**) + `4620796`, worktree `/home/user/wt/w3tr-t`, src `7b9634c`. Dev **:5444** (verified), preview **:5454** |
| Maker's results | **a:** `integrity :1090` 9/9 on the fix. **b:** the dialog and inert root no longer persist on Today (control: up to 562 ms). **c:** Ambience tests 2/2. **e:** the status line is covered 0/32 (control 32/32). **f:** a **real user-facing cover**: on the control it fails Monday and Thursday (the recipe days) because the notice over the panel takes the scroll gesture; on the fix all 7 days pass. **A:** 0 intersections. **D:** light-DOM announcer. **E1:** the guard raised to 40; at most 18 notices from one event. Suites: chromium 130/132 on `c43e30b` (not rerun on `8d0d8a6`); timer and pwa 29 passed + 2 skipped; tsc 0; vitest 275/275 |
| **Maker-declared gaps** | (1) **Ruling B not met.** Undo waits about 3 s at 375×667 when scrolled, and never draws at 200 % when scrolled; History and Settings Undo have no zone and no proof rows. (2) **E2 fails:** on T+P the summary has no stage zone, so notices fall back to the viewport and cover P's card. (3) A: at 375×667 @100 a two-line notice touches the kettle by about 2 px. (4) No dump from the D accessibility tree. (5) At 375×667 @200, three-line notices scroll inside a 112 px band. (6) The session rows of the waits-at-rest table are unverified. (7) The full suite was not rerun on `8d0d8a6`. (8) Captures cover 11 configurations; reduced motion and K01–K03 triples are missing. (9) The R5-D1 / LEAD-D1 / R7-D1 controls were not rerun. (10) **Invariant 1 fails** at 390×844 @200: "Saved…" overlaps the tag chips and Brew length in 24 of 62 samples; `integrity :637` failed 1 of 3. (11) R8-F1 was argued, not measured |
| Process note | The maker reports one `pkill -f` and a broad kill of "playwright test" processes around 09:55 UTC. Another lane may have lost a run then |
| Archive | `archive/pe-w2r2-toast-4620796.incremental.bundle*` |

**The orchestrator's handling:** T's work in progress goes to the lead for a verdict now. On REJECT, T gets its single 90-minute fix round, followed by a targeted re-review: Lane T (Opus) and the lead, on a new trial that includes P.

## Combined trial for Lane R (P merged + C)
**`032d7a5`** = integration `2f67fc1` + `pe/w2r2-chai3d@2843fb0`, worktree `/home/user/wt/w3tr-pc`, src `c9876ef`. Dev **:5445**, preview **:5455**, both verified. T joins only if it is approved.

## Maker T fix round (after REJECT T-D1…T-D6): submitted WIP, 2026-10-13 ~13:30 UTC

| Item | Result |
|---|---|
| Fix packet | `/home/user/wt/w3t/kettle/review/product-excellence/contracts/W2R2/T-FIX-READY-FOR-REVIEW.md` (WIP). Evidence is in `…/W2R2/T/fix/` |
| Revision | `pe/w2r2-toast@6f9756c` (code `887696e`, kettle/src `ed027d6`), on top of `4620796` |
| Changed in the fix | `src/ui/Toast.tsx`, `src/screens/home/{Composer.tsx, Home.module.css}`. Ownership OK |
| **Trial** | **`a8fb34a`** = integration `2f67fc1` (with P) + `6f9756c`, worktree `/home/user/wt/w3tr-t2`, src `958ce86` (equals the maker's own T+P tree). Dev **:5446** (verified), preview **:5456** |
| Maker's results | **T-D1:** Undo drawn 101–454 ms after the tap with 9/9 hit points, and a real Undo restores at every portrait configuration, 844×390 and 667×375 @100. 667×375 @200 was not drawn within 3 s. **T-D2:** History end-of-page in a band, mid-list via the R-3 fallback, real Undo restores; Settings rows missing. **T-D3 still fails:** in the final full suite, notice-zone End→Today at 375×667 @100 puts "Saved…" over the field, its clear button and Mark done in 15/20 samples. **T-D4:** minimum top 8 px on Today, 11 px on the summary; inset emulation not attempted. **T-D5:** summary on T+P with 0 hits at 390/375 @100/@200; the triples are missing. **Suites:** chromium 128/132 (`:637` also fails 4/5 on the control; `:1004` @1440; C's `w2-room:144` timeout; notice-zone 375 @100), tsc 0, vitest 275/275, timer/pwa 29 + 2 |
| Archive | `archive/pe-w2r2-toast-fix-6f9756c.incremental.bundle` |

**The orchestrator's handling:** targeted re-review now. Lane T (Opus) checks the §6 items on `a8fb34a` against the control, then the lead gives the final T verdict. There is no second fix round.

**Final merged-tree regression** (integration `2f67fc1` = `b377c62` + P; C waits for Vibei; T pending): worktree `/home/user/wt/w3-final`, dev **:5447** (verified). Chromium, timer/pwa, tsc and vitest are running; logs go to `review/LR/final-merged-2f67fc1/`.
