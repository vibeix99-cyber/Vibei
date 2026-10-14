
## 4. Invariant re-probe on the fix (the round-3 `ltprobe.mjs`, unchanged method)

`chainfix.sh` P3, 04:04:43–04:16:13 UTC, :5477, 10 configurations (the 8 phone/landscape ones at 200 %, plus 1440×900 light 200 and dark 100), all 8 groups (`home`, `end`, `break`, `nextbrew`, `stats`, `import`, `update`, `queue`). JSON `fix2/probes/inv-fix/`. Compared with Lane T's round-3 run of the same probe on `490ca97` (`review/LT/probes/fix/`). Base `61aba17` was not re-probed (round-3 base numbers: `RECEIPT-LT.md` §5).

INVTABLE2

Totals on the fix: 15,603 samples, 6,443 with a notice drawn; **0 nine-point control hits by a notice with no sheet in the DOM; 0 drawn control or row intersections with no sheet**; 0 clipped-notice samples. Drawn text intersections with no sheet, by kind (`hits` in the JSON):
- the countdown ":" line box under the panel notice (other on top), as on `490ca97`: 667×375 and 844×390 @200;
- the History Undo row under the sticky Stats header (`@fixed` text "23" / "Stats", the Undo row the `elementFromPoint` target there): 844×390 dark @200 (last row, 50 samples, as on `490ca97`), and on this run also **390×844 light @200** (mid row: "Stats" 8 and "23" 8 records, 16 samples) and **844×390 light @200** (mid row: "23", 60 samples); in both the deleted row had been tapped near the top, under the header, and the Undo row is drawn in its place (`shot-390x844-light-t200-stats-*.png`, `shot-844x390-light-t200-stats-0.png`). This depends on where the row was when tapped, not on the summary change.
- Sheet-in-DOM 9-point hits: 3,207 points, 3,162 of them inside a `[role=dialog]` box; states as in round 3 (History delete, Import, Ambience: leaving sheets).
- `import` at 667×375 @200 (light and dark): the real tap on "Import a backup" (9/9 on top after 10 wheel steps) opened **no file chooser within 10 s** in this run. Classified by one second run (`fix2/probes/inv-fix-import2/`, 04:20:12): fix light and dark and `490ca97` light: file chooser opened, Undo at the row (139 → 139), 89 → 6 brews after Undo, run-out 10.4 s. Both results reported.

## 5. Suites on the fix (:5477, `--workers=1`, own `--output`, one after another under one slot; `fix2/runs/suites.log`)

SUITES

## 6. REFERENCE → BEFORE → AFTER (full size; summary with a queued notice, then the next screen)

The design reference: `fix2/shots/REFERENCE-07-summary.png` (copied from the maker's `T2/triples/K02-1-REFERENCE-07-summary.png`). All captures `animations` live, DPR 2 on phones; the summary frame is taken 3.5 s after the summary's first frame.

| Configuration | BEFORE base `61aba17` (:5470) | BEFORE `490ca97` (:5476) | AFTER fix (:5477) summary | AFTER fix, the next screen with the notice drawn |
|---|---|---|---|---|
| 375×667 light 200 % | `shots/5470-c/375x667-light-t200-task-c-summary.png` (case `c`: the toast floats over the sheet's heading; case `adebug` on the base navigated away twice, "Execution context was destroyed", so it has no frame) | `shots/5476/375x667-light-t200-task-adebug-summary.png` (strip over Chai's face, sheet pushed under the footer) | `shots/5477/375x667-light-t200-task-adebug-summary.png` | tea break: `shots/5477-next/375x667-light-t200-task-adebug-next-drawn.png`; Today: `shots/5477-today/375x667-light-t200-task-b-next-drawn.png` |
| 390×844 dark 100 % | `shots/5470/390x844-dark-t100-task-adebug-summary.png` (toast over the sheet's unlock row) | `shots/5476/390x844-dark-t100-task-adebug-summary.png` | `shots/5477/390x844-dark-t100-task-adebug-summary.png` | `shots/5477-next/390x844-dark-t100-task-adebug-next-drawn.png`; Today: `shots/5477-today/390x844-dark-t100-task-b-next-drawn.png` |
| 1440×900 light 100 % | `shots/5470/1440x900-light-t100-task-adebug-summary.png` | `shots/5476/1440x900-light-t100-task-adebug-summary.png` | `shots/5477/1440x900-light-t100-task-adebug-summary.png` | `shots/5477-next/1440x900-light-t100-task-adebug-next-drawn.png`; Today: `shots/5477-today/1440x900-light-t100-task-b-next-drawn.png` |

Opened and checked by Lane T: the 375×667 @200 base / `490ca97` / fix summary frames, the fix tea-break frame (notice whole under the scene, "Open" in view, countdown below) and the fix Today frame at 390×844 dark (notice at the top of Today, whole).

## 7. Not proven / incomplete / deviations

- **The real update prompt in a production build:** not run (needs a new service worker). The `areal` runs use the app's own code from `patch({ needRefresh: true })` onward; the service-worker side is by code only (§ How).
- **A prompt re-raised (and re-said) on each return from the session screen** while `needRefresh` stays true: by code only; not run.
- **Several notices queued at once from the summary:** Lane T's runs queue one notice each; multi-notice order on Today comes from `summary-notice.spec.ts` (maker's spec, run by Lane T, §5) only.
- **Next-screen appearance time:** measured 310–4,739 ms after the tap, not "the first frame"; Lane T did not separate the causes.
- **Landscape @200:** with Lane T's 52-character message plus an action, the notice on the tea break is taller than the space under the top bar (§3); reachable by a short wheel (50 px), not by a 240 px one.
- `ltprobe` re-probe covered 10 of 22 configurations (the brief's minimum plus 1440); base not re-probed in this round.
- Base `adebug` at 375×667 @200 (and once at 390×844 dark @100): the page navigated during the run (Playwright: "Execution context was destroyed"); cause not established.
- Not run: the other suites (`integrity`, `w2-home`, `statusbar`, `break-reach`).
- Setup used the debug API (and, for `areal`, the served-module hook); actions under test were real taps / clicks / wheel. No source edited, nothing committed.
