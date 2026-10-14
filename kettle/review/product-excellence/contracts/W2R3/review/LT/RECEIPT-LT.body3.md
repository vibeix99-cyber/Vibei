
## 2. Inline Undo, per surface (fix :5476, all 22 configurations)

UNDOTABLE

Notes on the columns:
- "Undo appears": an rAF watcher installed before the action records when `[data-undo-for=…]` first has a box, against the first `pointerdown` after it was installed. Values are within one frame of the tap (−42 … +15 ms; negative = the watcher's rAF tick landed before the window `pointerdown` listener's timestamp).
- Mark done "scrollY" includes Lane T's own wheel steps to reach Mark done where it was not on top at rest; where no wheel was needed (390×844 @100, 844×390 @100, 1440 @100) scrollY stayed 0 → 0 and the Undo row took Mark done's line.
- "said": additions to the light-DOM announcer `[data-notices-said]` (MutationObserver on every `aria-live` / `role=status|alert|log` region). Mark done: one "Crossed off. Nice work. Undo" per Mark done (2 actions per run, 2 entries) in all 22. History: one "Brew deleted. Undo" per delete in all 22. Import: one "Added 52 brews from your backup. Undo" per import, plus one "Import undone. Everything is as it was." after Undo. No other region repeated them (the other entries in the live log are the timer's own status lines, e.g. "Kettle's off. 3 minutes of focus saved.").
- Durations when left alone (pointer parked at the bottom-left corner, no input): Mark done 5,136–5,171 ms; History (last row) 5,391–8,162 ms; Import 10,163–10,672 ms.
- **History, last row ("to the end")**: the Undo row was 3–39 px lower than the row it replaced and scrollY dropped 3–93 px at 10 of 22 configurations (390×844 @200 both themes: 385 → 412, scrollY 6787 → 6760; 375×667 @100 both: 347 → 353, 3510 → 3504; 667×375 dark @200: 72 → 111, 5761 → 5722; 1440 @100 both: 629 → 634, 2013 → 1956; 1440 @200 both: 599 → 620, 3600 → 3507; 844×390 dark @200: 6 → 9, 3895 → 3892). The other 12: 0 px, no scroll change. History mid-list row: 0 px and no scroll change at all 22.
- **Import at 844×390 @200 (light and dark)**: the Undo row's top was 30 px below where "Import a backup" was when tapped (282 → 312), scrollY unchanged (3600). All other configurations: 0 px.
- **Mark done at 844×390 dark @200**: the Undo row was drawn at y −54 (row box [459, −54, 345, 88]) after the wheel-and-tap; Undo button [458, −10, 80, 44], 6 of 9 points in the viewport. (844×390 light @200: row at y 16, 9/9.)
- **375×667 @200 (light, dark, dark reduced)**: "Delete this brew?" → Delete not brought on screen by 15 wheel steps and not reached by 12 Tabs; Lane T clicked it synthetically to continue (recorded `how: synthetic`). Same as the maker's §7.1.
- **1440 (all four)**: after the Undo was clicked with the mouse and the mouse left resting there, "Import undone. Everything is as it was." stayed for the rest of the run (about 22 s, 223 samples); the Import row did not come back while the pointer rested on it, so the second (run-out) import was not run at 1440.
- Restored: Mark done → "Chapter 3 notes" back in the field and the Mark done line back (22/22); History mid → same row count and same first label (22/22); Import → 89 brews after Add, 6 after Undo (22/22).

## 3. W2H-D1: Brew length at rest, and Mark done right after End (fix vs base)

W2HTABLE

- Fix: Brew length 4/4 wholly in view, ≥ 24×24, 9/9 on top at rest at all 8 W2H-D1 configurations (both themes), and at 1440 @100. At 1440 @200 the four options sit at y 864–944 in a 900 px viewport (not wholly in view at rest; 1440 is not in the W2H-D1 list).
- Base `61aba17` "9/9" for Brew length reads 0/4 because the role=radio element is not the hit target over the option's visible face (`span._face_1npvj_34`, as also recorded in `BEFORE-61aba17/*/meta.json` `01-home.covered`); the base's in-view numbers are the comparable ones.
- Mark done on top 9/9 at about +0.6 s and tapped without scrolling: fix 390×844 @100, 844×390 @100, 1440 @100 (taps landed 687–1,834 ms after the End-session tap: the 9/9 check plus the tap took longer than planned under 3 parallel contexts); crossed off in all. Elsewhere on the fix it is under the docked start at rest (375×667 @100: `ctaDock`; 667×375 @100: 3/9, a Button face; 1440 @200: 6/9, a Button label) or not in view (@200), and was reached by real wheel then tapped: crossed off in all 22.
- Base: Mark done 9/9 at +0.6 s at 390×844 @100, 844×390 @100 and **667×375 @100** (the fix has it 3/9 there, under the docked start); covered or out of view at the other five.
