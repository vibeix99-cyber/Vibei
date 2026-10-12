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
