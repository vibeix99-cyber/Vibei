# W2R2 regression review: the P + C combined trial `032d7a5` vs control `b377c62` (lead classification)

| | |
|---|---|
| Reviewer | LEAD-2 |
| Trial | `032d7a5` = integration `2f67fc1` (P merged) + `pe/w2r2-chai3d@2843fb0`; kettle/src `c9876ef`; dev :5445, preview :5455 |
| Lane R receipt | `review/LR/REGRESSION-RECEIPT.md`; matrix `review/LR/matrix/over-0.5pct.md`; pairs `review/LR/pairs/`; repeat takes `review/LR/recheck-takes/` |
| My crops (side by side, control left, trial right) | `review/LEAD2/R/crops/` (opened at full resolution) |

**Result: no defect.** The 60 pairs over 0.5 % (39 at tolerance 16 or with differing size, 21 under strict only) fall into:

| Class | Pairs |
|---|---|
| P's intended change | 20 (every stacked-phone summary state) |
| Timing | 15 |
| Noise | 21 |
| Noise or timing | 4 (the 1440 summary close-up canvas) |
| C | 0 |
| Defect | 0 |

Suites (Lane R, read): tsc 0; vitest 288/288; chromium 113/113; timer/pwa 29 + 2 skipped by design; smoke 8/8 with 0 errors.

## What I opened (full resolution) and what it shows

- **P, intended** (stacked phones, summary states 07 / 08 / 11 / 11b / 14), control left and trial right:
  - `390l-08-summary-end`: the end state with the warm-days closing line ("23 days warm. One full brew a day keeps the kettle warm."); everything else is the same.
  - `390l-11b-summary-unlock-settled` against K03 `11-summary-unlock.png`: the record-player card is whole on arrival, as in K03, and Chai and the kettle are now whole too.
  - `375l-11-summary-unlock`: see note P-a below.
  - `390l-14-summary-first` and `375l-14-summary-first`: the first-brew summary; see note P-b.
- **C:** none visible, as expected. Lane R's captures run at the default 3D tier, which resolves to **low** on this CPU-only machine, so the model is never requested (C's `MODEL_ON_LOW = false`).
  - The Nook pairs differ only because the room had been drawn on one side and not yet on the other. In the 1440 dark take 1 the control has the room and the trial a blank backdrop; in take 2 it is the reverse (`1440d-18-nook-take1.png`, `-take2.png`).
- **Timing:**
  - `19-settings`: take 2 is 0.0 at both configurations.
  - `16-stats-populated`: the whole page is offset (doubled edges everywhere in the diff), and each side differs 14–18 % from its own second take.
  - Neither P nor C touches Settings or Stats.
- **Noise:**
  - focus and break states: clock digits (17:20 vs 17:19; 4:57 vs 4:58), the gauge needle, steam phase and the 3D window backdrop's render (`390l-05-focus-added.png`, `1440d-09-break.png`);
  - `13-first-brew`: visually identical (`375l-13-first-brew.png`).

## Notes for P (added to CHECKER-W2R2-P.md as an addendum; the verdict is unchanged)

- **P-a: the record-player day with a task at 375×667 @100** (`375l-11-summary-unlock`). The record-player close-up card starts a scroll away on arrival, with its honey edge peeking. The control showed it by covering the kettle's gauge and Chai to the chest.
  - It is the same mechanism as the ruled trade-off: a task row plus an unlock card do not fit above the fold at 375×667 with the figures whole.
  - My §4 of CHECKER-W2R2-P.md named only the Fairy-lights task day. The ruling covers **any task-plus-unlock day at 375×667 @100**, the record player included.
  - PRESERVE 8 holds: the close-up itself (drawing, then 3D, stable media box) is unchanged; at 390×844 it is whole on arrival, matching K03; and it is one scroll away at 375×667.
- **P-b: the first-brew summary at 390×844 @100** (`390l-14-summary-first`). The optional "Make Kettle yours · Set up" card now starts below the fold, a scroll away; it was whole on the control.
  - It is covered by the same ruling: an optional prompt, never a gate (PRESERVE 5), reachable by one scroll, its edge at the fold, and also available in Settings.
  - At 375×667 it is a scroll away on both builds.
  - **For Vibei's awareness:** first-brew users at 390×844 see the setup prompt only after a scroll.

## Note for C (added to CHECKER-W2R2-C.md)

The combined trial shows **no visual change from C at the default tier** on this machine. That is consistent with `MODEL_ON_LOW = false`, and the trial's Nook is the procedural Chai, as on control. The high-tier visual change is judged in CHECKER-W2R2-C.md §2/§5 (forced high tier) and awaits Vibei's art sign-off.

## Pre-existing observation (FOLLOW-UP, not P or C)

Under heavy load, the Nook's 3D host was captured showing **only the backdrop gradient**: no static drawing and no room. This happened on **both** builds, alternating between takes (the control in take 2, the trial in take 1).
- The static nook is meant to cover until the canvas is ready, so either the static image had not painted yet or the cross-fade let go early.
- Owner: scene/Nook. It is a timing check under load (compare round-1 N-F1).

## Classification, every pair (take 1 numbers from `over-0.5pct.md`; take 2 from the receipt §5.3)

| # | config | state | % tol 16 / strict (take 1) | take 2 trial vs ctrl (tol 16) | class | basis |
|---|---|---|---|---|---|---|
| 1 | 390x844@2-light | 05-focus-added | 0.602 / 0.619 | 0.0 | **noise** | clock digit / gauge needle / steam phase, or the 3D window backdrop render (frames opened: 17:20 vs 17:19) |
| 2 | 390x844@2-light | 07-summary | 16.008 / 21.406 | 16.0 (each side stable) | **P (intended)** | stacked summary: Chai and the kettle whole, air, quieter card, warm-days words (frames opened) |
| 3 | 390x844@2-light | 08-summary-end | 18.381 / 20.981 | — | **P (intended)** | stacked summary: Chai and the kettle whole, air, quieter card, warm-days words (frames opened) |
| 4 | 390x844@2-light | 11-summary-unlock | 18.009 / 24.757 | — | **P (intended)** | stacked summary: Chai and the kettle whole, air, quieter card, warm-days words (frames opened) |
| 5 | 390x844@2-light | 11b-summary-unlock-settled | 15.883 / 22.614 | — | **P (intended)** | stacked summary: Chai and the kettle whole, air, quieter card, warm-days words (frames opened) |
| 6 | 390x844@2-light | 14-summary-first | 30.814 / 36.895 | — | **P (intended)** | stacked summary: Chai and the kettle whole, air, quieter card, warm-days words (frames opened) |
| 7 | 375x667@2-light | 07-summary | 15.196 / 21.215 | — | **P (intended)** | stacked summary: Chai and the kettle whole, air, quieter card, warm-days words (frames opened) |
| 8 | 375x667@2-light | 08-summary-end | 6.734 / 7.214 | — | **P (intended)** | stacked summary: Chai and the kettle whole, air, quieter card, warm-days words (frames opened) |
| 9 | 375x667@2-light | 11-summary-unlock | 34.467 / 41.313 | — | **P (intended)** | stacked summary: Chai and the kettle whole, air, quieter card, warm-days words (frames opened) |
| 10 | 375x667@2-light | 11b-summary-unlock-settled | 34.368 / 41.329 | — | **P (intended)** | stacked summary: Chai and the kettle whole, air, quieter card, warm-days words (frames opened) |
| 11 | 375x667@2-light | 13-first-brew | 0.656 / 22.493 | 0.90 (ctrl1 vs ctrl2 0.66) | **noise** | clock digit / gauge needle / steam phase, or the 3D window backdrop render (frames opened: 17:20 vs 17:19) |
| 12 | 375x667@2-light | 14-summary-first | 11.261 / 22.463 | — | **P (intended)** | stacked summary: Chai and the kettle whole, air, quieter card, warm-days words (frames opened) |
| 13 | 375x667@2-light | 17-nook-early (sizes differ) | 13.301 / 15.221 | 0.29 | **timing** | room drawn on one side, not yet on the other; the sides flip between takes; default tier is low here, so C's model never loads (no C change visible) |
| 14 | 375x667@2-light | 19-settings | 31.437 / 73.701 | 0.0 | **timing** | take 2 trial vs control 0.0; neither P nor C touches Settings |
| 15 | 1440x900@1-light | 05-focus-added | 0.521 / 3.851 | — | **noise** | clock digit / gauge needle / steam phase, or the 3D window backdrop render (frames opened: 17:20 vs 17:19) |
| 16 | 1440x900@1-light | 11b-summary-unlock-settled | 0.527 / 7.043 | — | **noise / timing** | side-by-side summary: diff is inside the unlock card's 3D close-up canvas (load phase; strict-heavy); P changes nothing side by side but words; C adds no model to the close-up |
| 17 | 1440x900@1-light | 16-stats-populated | 11.638 / 13.923 | 16.0 (ctrl1 vs ctrl2 14.2) | **timing** | whole page offset (doubled edges everywhere); each side varies 14–18 % between its own takes; neither P nor C touches Stats |
| 18 | 390x844@2-dark | 05-focus-added | 0.604 / 0.621 | — | **noise** | clock digit / gauge needle / steam phase, or the 3D window backdrop render (frames opened: 17:20 vs 17:19) |
| 19 | 390x844@2-dark | 07-summary | 10.507 / 21.058 | — | **P (intended)** | stacked summary: Chai and the kettle whole, air, quieter card, warm-days words (frames opened) |
| 20 | 390x844@2-dark | 08-summary-end | 11.15 / 20.939 | — | **P (intended)** | stacked summary: Chai and the kettle whole, air, quieter card, warm-days words (frames opened) |
| 21 | 390x844@2-dark | 11-summary-unlock | 16.189 / 22.523 | — | **P (intended)** | stacked summary: Chai and the kettle whole, air, quieter card, warm-days words (frames opened) |
| 22 | 390x844@2-dark | 11b-summary-unlock-settled | 16.215 / 22.353 | — | **P (intended)** | stacked summary: Chai and the kettle whole, air, quieter card, warm-days words (frames opened) |
| 23 | 390x844@2-dark | 14-summary-first | 25.073 / 36.874 | — | **P (intended)** | stacked summary: Chai and the kettle whole, air, quieter card, warm-days words (frames opened) |
| 24 | 390x844@2-dark | 19-settings | 30.224 / 72.864 | 0.0 | **timing** | take 2 trial vs control 0.0; neither P nor C touches Settings |
| 25 | 375x667@2-dark | 03-focus-mid | 6.154 / 12.637 | 0.0 | **noise** | clock digit / gauge needle / steam phase, or the 3D window backdrop render (frames opened: 17:20 vs 17:19) |
| 26 | 375x667@2-dark | 04-focus-paused | 0.686 / 0.703 | 0.0 | **noise** | clock digit / gauge needle / steam phase, or the 3D window backdrop render (frames opened: 17:20 vs 17:19) |
| 27 | 375x667@2-dark | 05-focus-added | 0.59 / 5.297 | 1.43 (ctrl1 vs ctrl2 1.43) | **noise** | clock digit / gauge needle / steam phase, or the 3D window backdrop render (frames opened: 17:20 vs 17:19) |
| 28 | 375x667@2-dark | 07-summary | 12.014 / 20.761 | — | **P (intended)** | stacked summary: Chai and the kettle whole, air, quieter card, warm-days words (frames opened) |
| 29 | 375x667@2-dark | 08-summary-end | 4.744 / 7.201 | — | **P (intended)** | stacked summary: Chai and the kettle whole, air, quieter card, warm-days words (frames opened) |
| 30 | 375x667@2-dark | 11-summary-unlock | 36.895 / 46.916 | — | **P (intended)** | stacked summary: Chai and the kettle whole, air, quieter card, warm-days words (frames opened) |
| 31 | 375x667@2-dark | 11b-summary-unlock-settled | 33.671 / 40.421 | — | **P (intended)** | stacked summary: Chai and the kettle whole, air, quieter card, warm-days words (frames opened) |
| 32 | 375x667@2-dark | 14-summary-first | 11.09 / 22.334 | — | **P (intended)** | stacked summary: Chai and the kettle whole, air, quieter card, warm-days words (frames opened) |
| 33 | 1440x900@1-dark | 02-focus-start | 0.532 / 4.112 | — | **noise** | clock digit / gauge needle / steam phase, or the 3D window backdrop render (frames opened: 17:20 vs 17:19) |
| 34 | 1440x900@1-dark | 09-break | 1.557 / 1.836 | 2.56 | **noise** | break countdown digit (4:57 vs 4:58) and tip card; 10-break-over take 2 = 0.0 |
| 35 | 1440x900@1-dark | 10-break-over | 1.878 / 3.881 | 0.0 | **noise** | break countdown digit (4:57 vs 4:58) and tip card; 10-break-over take 2 = 0.0 |
| 36 | 1440x900@1-dark | 11-summary-unlock | 1.415 / 1.728 | — | **noise / timing** | side-by-side summary: diff is inside the unlock card's 3D close-up canvas (load phase; strict-heavy); P changes nothing side by side but words; C adds no model to the close-up |
| 37 | 1440x900@1-dark | 11b-summary-unlock-settled | 5.177 / 7.851 | 0.75 | **noise / timing** | side-by-side summary: diff is inside the unlock card's 3D close-up canvas (load phase; strict-heavy); P changes nothing side by side but words; C adds no model to the close-up |
| 38 | 1440x900@1-dark | 17-nook-early | 11.168 / 12.806 | 0.41 | **timing** | room drawn on one side, not yet on the other; the sides flip between takes; default tier is low here, so C's model never loads (no C change visible) |
| 39 | 1440x900@1-dark | 18-nook-earned (sizes differ) | 18.864 / 19.626 | 11.28 (sides flip) | **timing** | room drawn on one side, not yet on the other; the sides flip between takes; default tier is low here, so C's model never loads (no C change visible) |
| 40 | 390x844@2-light | 17-nook-early | 0.169 / 2.164 | — | **timing** | room drawn on one side, not yet on the other; the sides flip between takes; default tier is low here, so C's model never loads (no C change visible) |
| 41 | 390x844@2-light | 18-nook-earned | 0.134 / 1.28 | — | **timing** | room drawn on one side, not yet on the other; the sides flip between takes; default tier is low here, so C's model never loads (no C change visible) |
| 42 | 375x667@2-light | 06-whistle | 0.018 / 1.448 | — | **noise** | strict-only (steam/hop phase); take 2 = 0.0 |
| 43 | 375x667@2-light | 18-nook-earned | 0.112 / 1.023 | — | **timing** | room drawn on one side, not yet on the other; the sides flip between takes; default tier is low here, so C's model never loads (no C change visible) |
| 44 | 1440x900@1-light | 02-focus-start | 0.249 / 0.929 | — | **noise** | clock digit / gauge needle / steam phase, or the 3D window backdrop render (frames opened: 17:20 vs 17:19) |
| 45 | 1440x900@1-light | 03-focus-mid | 0.486 / 3.905 | — | **noise** | clock digit / gauge needle / steam phase, or the 3D window backdrop render (frames opened: 17:20 vs 17:19) |
| 46 | 1440x900@1-light | 11-summary-unlock | 0.458 / 6.122 | — | **noise / timing** | side-by-side summary: diff is inside the unlock card's 3D close-up canvas (load phase; strict-heavy); P changes nothing side by side but words; C adds no model to the close-up |
| 47 | 1440x900@1-light | 17-nook-early | 0.297 / 2.143 | — | **timing** | room drawn on one side, not yet on the other; the sides flip between takes; default tier is low here, so C's model never loads (no C change visible) |
| 48 | 1440x900@1-light | 18-nook-earned | 0.418 / 2.399 | — | **timing** | room drawn on one side, not yet on the other; the sides flip between takes; default tier is low here, so C's model never loads (no C change visible) |
| 49 | 390x844@2-dark | 01-home | 0.0 / 0.592 | — | **noise** | strict-only, 0.0 at tolerance 16 |
| 50 | 390x844@2-dark | 06-whistle | 0.016 / 1.294 | — | **noise** | strict-only (steam/hop phase); take 2 = 0.0 |
| 51 | 390x844@2-dark | 13-first-brew | 0.353 / 4.585 | — | **noise** | clock digit / gauge needle / steam phase, or the 3D window backdrop render (frames opened: 17:20 vs 17:19) |
| 52 | 390x844@2-dark | 17-nook-early | 0.103 / 1.759 | — | **timing** | room drawn on one side, not yet on the other; the sides flip between takes; default tier is low here, so C's model never loads (no C change visible) |
| 53 | 390x844@2-dark | 18-nook-earned | 0.207 / 1.246 | — | **timing** | room drawn on one side, not yet on the other; the sides flip between takes; default tier is low here, so C's model never loads (no C change visible) |
| 54 | 375x667@2-dark | 06-whistle | 0.018 / 9.09 | 0.0 | **noise** | strict-only (steam/hop phase); take 2 = 0.0 |
| 55 | 375x667@2-dark | 09-break | 0.0 / 7.578 | 0.34 | **noise** | break countdown digit (4:57 vs 4:58) and tip card; 10-break-over take 2 = 0.0 |
| 56 | 375x667@2-dark | 17-nook-early | 0.301 / 1.964 | — | **timing** | room drawn on one side, not yet on the other; the sides flip between takes; default tier is low here, so C's model never loads (no C change visible) |
| 57 | 375x667@2-dark | 18-nook-earned | 0.183 / 1.491 | — | **timing** | room drawn on one side, not yet on the other; the sides flip between takes; default tier is low here, so C's model never loads (no C change visible) |
| 58 | 1440x900@1-dark | 03-focus-mid | 0.471 / 3.081 | — | **noise** | clock digit / gauge needle / steam phase, or the 3D window backdrop render (frames opened: 17:20 vs 17:19) |
| 59 | 1440x900@1-dark | 05-focus-added | 0.099 / 3.33 | — | **noise** | clock digit / gauge needle / steam phase, or the 3D window backdrop render (frames opened: 17:20 vs 17:19) |
| 60 | 1440x900@1-dark | 13-first-brew | 0.479 / 6.947 | — | **noise** | clock digit / gauge needle / steam phase, or the 3D window backdrop render (frames opened: 17:20 vs 17:19) |
