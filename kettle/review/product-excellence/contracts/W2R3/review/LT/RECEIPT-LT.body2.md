
### 1.2 Results, fix :5476 (raw counts; one row per configuration, all 8 groups)

INVTABLE

Reading the columns: a "sample" is one 100 ms tick; an "intersection" is one (notice, element or text rect) pair in one sample. "Drawn, no sheet" means the intersection lies in the viewport and is not clipped away from either box, with no `[role=dialog]` in the DOM and `#root` not inert.

**Every drawn intersection with no sheet in the DOM (330 in 22 configurations), listed in full** (`probes/fix/<cfg>.json` → `groups.<g>.sampler.hits`):

| Configuration | Group / state | Notice box [x, y, w, h] | Other | Other's box | Overlap | On top at the overlap centre | Samples |
|---|---|---|---|---|---|---|---|
| 844×390 light 200 | break / Ambience state (running brew, 3 notices) | "Notice one, waiting its turn." [524–527, 153–154, 283–288, 135–138] | text node ":" of the countdown (Range rect) | [657, 285, 21, 117] | 5–6 px tall, 21 px wide | the countdown span | 32 |
| 844×390 light 200 | nextbrew (next brew started by itself) | "Recipe done: Take a full tea break · +10 leaves" [524, 77, 288, 178] | ":" of the countdown | [657, 250–254, 21, 117] | 1–5 px | countdown | 31 |
| 844×390 dark 200 | break / Ambience state | "Notice one…" [524, 77, 288, 137–138] | ":" | [657, 210, 21, 117] | 5 px | countdown | 64 |
| 844×390 dark 200 | nextbrew | "Recipe done…" [524, 77, 288, 178] | ":" | [657, 250–251, 21, 117] | 4–5 px | countdown | 30 |
| 667×375 light 200 | break / Ambience state | "Notice one…" [347–348, 153, 287–288, 137–138] | ":" | [480, 285, 21, 117] | 5–6 px | countdown | 24 |
| 667×375 light 200 | nextbrew | "Recipe done…" [347, 77, 288, 178] | ":" | [480, 250–253, 21, 117] | 2–5 px | countdown | 32 |
| 667×375 dark 200 | break / Ambience state | "Notice one…" [347–349, 153–154, 284–288, 135–138] | ":" | [480, 285, 21, 117] | 4–6 px | countdown | 36 |
| 667×375 dark 200 | nextbrew | "Recipe done…" [347, 77, 288, 178] | ":" | [480, 250–251, 21, 117] | 4–5 px | countdown | 31 |
| **844×390 dark 200** | **stats / History, last row deleted** | inline Undo row "Brew deleted · Undo" [513, 9, 283, 145] | text "23" (leaf count) in the sticky Stats header (`@fixed`) | [778, 3, 42, 43] | 18 × 37 px | **the Undo row** (`elementFromPoint`) | **50** |

- The ":" rows: the countdown's text line box (117 px tall at 200 %) reaches 1–6 px into the bottom of the notice above it in the session panel. Screenshots: `probes/fix/shot-667x375-light-t200-nextbrew-0.png`, `shot-844x390-light-t200-nextbrew-*.png`, `shot-844x390-*-t200-break-*.png`: the glyphs of "25:00" / "24:59" start about 25 px below the notice's bottom edge; no ink overlaps.
- The "23" row: `shot-844x390-dark-t200-stats-0..2.png` show the sticky Stats header drawn over the top ~45 px of the Undo row (its trash icon is hidden under the header), "23" fully visible. `elementFromPoint(787, 27)` nevertheless returned the Undo row there (the header is not the hit target at that point). The deleted row had been at y 6 (its top already under the header when tapped), and the Undo row is drawn where it was (y 9).
- **Controls:** 0 drawn control intersections and **0** 9-point control hits by a notice in any configuration without a sheet. **Rows:** 0.
- **Notice text clipped:** 0 samples (any notice, or any descendant with overflow / line clamp, whose scroll size exceeds its client size).
- **Errors:** 375×667 dark 200 `stats` (the Edit brew / Delete dialog did not open within 10 s after the row tap; the same group passed in a smoke run of the same configuration at 23:34, and History at 375×667 dark 200 was re-run in A2: `probes/cmp/375x667-dark-t200-stats.json`); 1440 × 4 `import`: the second import never started because, after the Undo was clicked with the mouse, the "Import undone. Everything is as it was." row stayed while the mouse rested on it (208–224 samples of 100 ms, i.e. 21–22 s, until the 20 s wait timed out). The Undo itself was measured at 1440 (table §2).

### 1.3 Sheets (counted apart, with what they are)

- **Sheet open, at rest:** in every configuration the Ambience check at +2 s after opening found every visible sheet control (5–10 per configuration) on top at its centre (`groups.break.ambience.sheetCtlsCovered.cov = 0`). The open-sheet screenshot `probes/cmp/sheetexit-844x390-light-t200-sheetexit-amb-open.png` shows the sheet and its scrim over the panel; "Notice one…" is under the scrim.
- **3,632 of 3,649 9-point hits on sheet controls** lie inside a `[role=dialog]` box; the 17 others are sheet controls of the same leaving sheets (e.g. Edit brew's "Work"/"Study"/"Save") just outside the dialog element's own box. They come only from these states: `history-mid` (173 records), `history-end` (60), `import-undo` (56), `import-expire` (25), `ambience` (67): the moments right after Delete, Add or Escape, i.e. a sheet leaving. Sequence at 844×390 light 200 (`probes/cmp/844x390-light-t200-sheetexit.json`): Ambience open +300 ms and +1000 ms: Close, Turn on, Rain, Fireside, Forest → **sheet** at their centres (Brown noise below the viewport). Escape +0 ms: the dialog still in the DOM, its wrapper `pointer-events: none`; at the same points: Close → `div`, **Turn on → the notice**, Rain → `div`, Fireside → `div`, Forest → `span`. The next screenshot (taken a few seconds later under load) shows the sheet gone. Lane T did not capture a frame of the leaving sheet itself, so whether any notice pixel is drawn above the leaving sheet is not established by this run.
- 375×667 dark 200 sheet-exit: Escape +0 ms: sheet controls → `img` / `span` (page under it), no notice at those points; the History part of that group timed out (`locator.evaluate` 30 s).
