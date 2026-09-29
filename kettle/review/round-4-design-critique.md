# Round 4: focused design critique (Impeccable) and what was fixed

Method: dual-agent. Assessment A (design review) and Assessment B (detector + browser evidence) ran as isolated sub-agents against the 05:41 build (`review/test-results/dist`, before this pass). The questions step was skipped: the user had already set this round's priorities and scope (the four reported issues plus a ranked audit; refinement, not redesign) and asked for no stops except for user testing or hosting decisions.

## Design health (Nielsen, A): 29/40 — Good

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Start gave no visible response for ~250 ms, then a half-faded double screen |
| 2 | Match with the real world | 3 | Many coined words on Today (days warm, leaves, recipes, Tea Cozies…) |
| 3 | User control and freedom | 3 | Up to 5 celebration cards, each needs Continue |
| 4 | Consistency and standards | 2 | Page titles 22–40 px across tabs; untitled brews named two ways; tablet = phone layout |
| 5 | Error prevention | 3 | Good end-early and import safeguards |
| 6 | Recognition rather than recall | 3 | Focus controls lose labels in phone landscape |
| 7 | Flexibility and efficiency | 3 | No way to skip the whole celebration |
| 8 | Aesthetic and minimalist design | 3 | Chai's bubble repeats the goal card; busy finish card |
| 9 | Error recovery | 3 | Plain-language errors, undo on imports |
| 10 | Help and documentation | 3 | Leaves → levels → nook items never explained |

**Design specificity (A): authored for this product.** The kettle metaphor carries the whole loop (start, pause, end early, whistle, tea break); Chai, the nook, the tactile buttons and the plum dark theme are Kettle's own. Stats is the one screen any habit app could have.

**Detector (B):** 5 CLI findings (3 width transitions, 2 "bounce easing" name matches). URL/overlay scans: low contrast on the Stats calendar (×24), borderline contrast on the Nook hint, long lines in desktop Settings. B classified as false positives: text-occlusion on a screen-reader-only table and on a `pointer-events:none` hint, clipped-overflow on progress bars (intended), findings on hidden elements, border-accent on the system's raised-edge style (a colour-spread threshold), first-viewport overflow on a scrolling app page. Also found: the detector's URL mode reports a clean pass when puppeteer is missing.

## Priority issues and what happened

| Rank | Issue | Sev | Status |
|---|---|---|---|
| 1 | Home→Focus fade showed two (sometimes three) screens' text at once | P1 | **Fixed.** The incoming layer's paper covers the old screen in ~90 ms while its content rises over 240 ms (`src/app/App.tsx` `Dissolve`), also for tab switches. Today keeps the frame you tapped from while it leaves (no "Your kettle's on" swap mid-fade). Frames: `.tmp/xfade-before` vs `.tmp/xfade-after2`. |
| 2 | The level-up item appeared in the room before its card | P1 | **Fixed.** While a celebration with a level-up is pending, the Focus room shows only items unlocked before it (`lastReport.level.unlocked`). Stats no longer names the next item ("a surprise", as Nook says). |
| 3 | Page titles in four sizes; oversized in phone landscape | P2 | **Fixed.** Every page title (Today's greeting, Stats, Nook, Settings, celebration titles) uses `--text-display-l`: 30 → 36 px, 26 px on short landscape, 26 px greeting at 320. |
| 4 | Tablet portrait was a stretched phone | P2 | **Fixed.** At 720–899 px, Today is two columns (greeting + goal / composer, recipes, today's brews) and Stats shows its two-column dashboard; Settings stays one readable column. |
| 5 | Same facts written differently | P2 | **Partly fixed.** One name for untitled brews (`brewTitle`); badges header no longer says "12 of 12 earned" next to "Show 6 more". Not changed: the rail ring's % next to "50 / 60 min" (redundant, not contradictory); Chai's bubble repeating the goal card. |
| 6 | Finish card's Done / Carry forward looks like the bonus pills | P2 | **Not changed.** They are tactile 44 px chips next to flat receipt pills; the choice is now toggleable. A prompt line would add to an already busy card. |
| — | Stats calendar numbers 3.4:1; Nook hint pill ~4.3:1 | P2 | **Fixed.** Done-day numbers on `--persimmon-strong` (4.5:1); hint pills at 72% ink (≥6:1 on the lightest wall). |
| — | Long lines in desktop Settings | P3 | **Fixed** for list footers and the Chai story (68ch). |
| — | Width transitions on progress fills | P3 | **Kept, intentional:** small fills inside `overflow:hidden` tracks, run on progress changes only; `scaleX` would distort their pill ends. |

## Minor observations still open
Phone-landscape Focus controls hide their labels; "Kettle's warming up…" wraps in landscape; the whistle card's empty top on tall phones; level-up rays cut by the footer in landscape; the next-week arrow at the current week looks selected rather than disabled; the three "Brew 1 of 4" phrasings; empty Stats shows a grid of zero tiles; the static→3D framing jump on the level-up card.

## Questions skipped
Questions skipped: the report has 6 priority issues, but the user had already set scope and priority for this round and asked not to be stopped for input.
