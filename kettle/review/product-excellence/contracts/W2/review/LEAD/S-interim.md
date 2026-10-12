# LEAD, maker S: interim notes (no verdict yet)

Revision `pe/w2-summary@e0f511a` (last code `f95e0be`), src `67505713…` = trial `3726a71` src (verified). `d62c4a4` vs `90a11e5` and
`3726a71` vs `e0f511a`: only `kettle/review/**` differs (verified).

## Diff review (done)
- Files: `screens/done/{summary.ts, Summary.tsx, Summary.module.css, rank.test.ts(new)}`, `tests/w2-summary.spec.ts` (new). In S's ownership.
  No FocusScreen, whistle.spec, toast, scene, Home or art change. `buildSummary` and `summary.test.ts` unchanged.
- `rankRewards`: highlight = unlock card (existing) if any, else the top of [level, best, badge, cozy] (tier then report order);
  secondary = `m.pills` minus the highlighted pill, model order. Highlight `li` stays first in the one "Rewards" list, keeps `sr` text.
- Fold fix: `foldLines` (data-fold marks; text by glyph ink via canvas metrics, boxes with a 6 px peek), `cleanLift` within the old caps
  (22 % routine, 30 % highlight), prefers the highlight whole; side-by-side `cleanEnd` trims the scroll area ≤ 25 % (reset on resize);
  fade 22 → 14 px; pill gap 0.5rem. Sheet bottom padding unchanged (PRESERVE 7 end line).

## :1090
- S's two chromium failures were both at **1440×900** (`S/suites/*.log`). Lane S `review/LS/t1090/`: base 1440 fails 4/9, S 3/9;
  phones 9/9 both sides. → pre-existing flake F1 (R7-7), not S.

## Visual (so far)
- K02 `07-summary.png` opened: Chai cut at the belly by the sheet is the accepted framing.
- 375×667 light routine: BEFORE vs maker AFTER near-identical; AFTER opens ~10 px lower, toggle top edge in the fade.
- 375×667 light big day (Lane S same-session, final build :5351): BEFORE "+68 leaves" cut by the fold; AFTER whole, next pill's top edge
  in the fade; sheet ~37 px higher, Chai 1.0 → 0.85 visible (Lane S), consistent with K02 framing.

## Pending
- Lane S captures for the remaining 14 configurations (390, 844, 1440; 375 @200 AFTER), especially 1440×900 big day (K03 4 pill rows)
  and 844×390 (side-by-side trim), and the #1 task layout.
