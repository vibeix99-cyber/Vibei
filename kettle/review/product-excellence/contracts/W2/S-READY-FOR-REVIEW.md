# W2 · Maker S (Summary) — WIP

**Status:** WIP (written incrementally; this header changes to READY FOR REVIEW when every section is filled).
**Item:** I07 (rank the rewards) + Wave-1 follow-up #1 (third pill row half under the footer at 375×667).
**Base:** `90a11e5` (kettle/src `42e106d`). **Branch:** `pe/w2-summary`. **Worktree:** `/home/user/wt/w2s/kettle`.
**Maker model:** Opus 5.5 (`claude-opus-5-5`). No verdict is claimed here.

## 1. Ranking design and rules

Three tiers. Nothing is dropped; the model's `pills`, the announcement and the arithmetic are unchanged
(`summary.test.ts` untouched and green). The ranking is a pure function, `rankRewards(model, report)` in
`src/screens/done/summary.ts`, unit-tested in `src/screens/done/rank.test.ts`.

1. **Primary (unchanged, K02):** the heading "N minutes brewed" and the Tea time / Skip break footer.
2. **Highlight: at most one milestone**, the biggest that happened this brew, by this order (biggest first):

   | Rank | Milestone | Fires when (report fields) | How it is shown | Its one line |
   |---|---|---|---|---|
   | 1 | `unlock` | a level-up that brought a nook item (`level.unlocked`) | the existing record-player close-up card (K03), unchanged | the card's own line |
   | 2 | `level` | a level-up without an item (`level.after > level.before`) | "Cozy level N" leads the rewards list on a honey card | "X leaves to level N+1" |
   | 3 | `best` | a new best streak (`streak.extended && newBest && after > 1`, the existing "your best yet" condition) | "N days warm, your best yet" on the card | "One full brew a day keeps your streak warm." |
   | 4 | `badge` | a badge earned (highest tier first, then report order) | "Badge: X II" on the card | the badge's own description from the catalogue |
   | 5 | `cozy` | a Tea Cozy earned (`streak.cozyEarned`) | "Tea Cozy earned" on the card | "Keeps your streak warm for one missed day." |

   Never a milestone: leaves, the daily goal (met or not), a warm streak that is not a best, recipes, the distance
   to the next level. Every note is existing wording (the badge catalogue, the arithmetic's note, the Tea Cozy's
   screen-reader line, the level pill's wording) or a fact already in the arithmetic. No new currency, claim action
   or animation.
   *Why this order:* how much the moment changes the user's world — a new object in the room, a new cozy level, a
   personal record of the core habit, a collectible, a spare day of warmth. The brief's examples (unlock, level-up,
   best streak) are the top three.
3. **Secondary: everything else**, the same compact pills (K02 styling), in the model's own order (leaves, goal,
   streak, Tea Cozy, recipes, level distance, badges) minus the highlighted pill. Only the highlight moves. On a
   routine day (no milestone) and on an unlock day the compact rows are exactly the old ones, so K02 and K03 keep
   their wrapping. (A first cut ordered leftover milestones by rank; on the 1440×900 big day that wrapped the seven
   pills into five rows instead of four and pushed "How your leaves added up" below the card's fold, so `cdc6035`
   went back to the model order.)

When an unlock is the highlight, every pill stays in the compact group (there is no level pill on an unlock, as
before). The highlighted pill keeps its screen-reader wording and stays inside the "Rewards" list (first item), so
the list still holds every reward.

**Opening position.** The highlight is the summary's moment, like the unlock: it may open the sheet by up to 30 % of
its resting offset (unchanged for the unlock; the routine rewards keep 22 %), and the opening prefers a position where
it is seen whole.

## 2. Cause notes for follow-up #1

- **Where:** `src/screens/done/Summary.tsx` (the opening lift), `Summary.module.css` (the bottom fade).
- **Mechanism (stacked phones):** the sheet rests at `--sheet-top = stage-h − 28` (285 px at 375×667, where
  `stage-h` is 47 dvh). On arrival it was lifted by min(overflow of the featured block, 22 % of the rest = 63 px). The
  lift was sized only to show the featured block; nothing related the fold (the scroll area's bottom = the footer's
  top, 529 px) to the lines of the sheet, so whichever line met it was sliced, inside a 22 px fade.
  At 375 px the "+40 leaves" and "Goal met · 75/60 min" pills no longer share a row (131 + 8 + 203 > 335 px), so the
  pills take four rows instead of three; with a task (K02 layout) the third row ("23 days warm", "Recipes 1/3") sat at
  498–536 px: half under the footer. The same mechanism cut other lines in other states: the details toggle with no
  task, the first pill row on the big day, the sub line or the unlock title at 200 %, and, side by side (no lift at
  all), the third pill row at 844×390.
- **Fix:**
  1. The opening lift is **snapped** within the same limit so the fold falls between two lines: every line marked
     `data-fold` is either wholly clear of the fade or wholly below the fold (a box may show at most its 6 px empty top
     edge in the fade; a text line counts by its glyph ink, from the font's metrics, and may not show at all). The
     nearest clean lift to the old one is used; with a highlight, a clean lift that also shows it whole is preferred.
  2. The bottom fade is **14 px** (from 22 px): an 8 px pill gap can then hold the fold.
  3. **Side by side** (no lift), when the content is taller than the card, the card's scroll area ends up to 25 %
     earlier at a line boundary (the card is centred, so it just gets a little shorter); reset on resize.
  4. The pill gap is `0.5rem` (8 px at 100 %, 16 px at 200 %), so large text keeps room between rows.
  5. The end of the summary is unchanged: the sheet keeps its 34 px bottom padding, so the final expanded line
     clears the footer (PRESERVE 7).

## 3. Control first (90a11e5 on the orchestrator's dev server :5310, this session)

Probe: `S/tools/probe.mjs` + `S/tools/measure.mjs` (real click on "Put the kettle on", the debug API only to seed,
set sound/auto-start off and finish the brew; frozen clock 2026-10-11T07:40Z then resumed). Results:
`S/control/ctl-90a11e5-5310.json`, `S/control/ctl2-90a11e5-5310.json` (+ end-state shots). A line is **cut** when it
is neither wholly clear of the bottom fade nor wholly below the fold. (These two control runs measured text lines by
their full line box; the spec run on 90a11e5 below uses the final ink rule and fails the same way.)

| 90a11e5, 375×667, settled (4.5 s) | Lift | Fold (footer top) / fade | Cut on arrival |
|---|---|---|---|
| **@100 %, a brew with a task (K02 layout) — follow-up #1** | 63 | 529 / 22 | **"23 days warm" and "Recipes 1/3" (the third pill row) at 498–536: half under the footer** |
| @100 %, routine (veteran, no task) | 54 | 529 / 22 | "How your leaves added up" at 513–561 |
| @100 %, big day (celebrate) | 7 | 529 / 22 | "+68 leaves" (first pill row) at 513–551 |
| @100 %, milestone day (atRisk: best streak) | 8 | 529 / 22 | "How your leaves added up" at 513–561 |
| @200 %, routine / task / milestone | 63 | 475 / 22 | the sub line "…before the next one." at 415–461 |
| @200 %, big day | 86 | 475 / 22 | the unlock title "Record player is in your nook" at 461–502 |

**#1 reproduced** in this session on `90a11e5` (row 1 of the table). axe: 0 in every control state.

## 4. Revision, tree and changed files

- **Revision:** see the header of this file (`REV` / `SRC` filled at hand-off).
- **Changed files** (`git diff --stat 90a11e5..REV -- kettle/src kettle/tests`), all inside the files this maker owns:
  - `src/screens/done/summary.ts` — `rankRewards`, `milestoneOf`, `MILESTONES` (+ header comment). `buildSummary`
    is unchanged.
  - `src/screens/done/Summary.tsx` — the highlight row, the ranked render, the fold snapping (`foldLines`,
    `cleanAt`, `cleanLift`, `cleanEnd`), `data-fold` marks, `PillArt big`.
  - `src/screens/done/Summary.module.css` — `.highlight*`, the 14 px fade, the pill gap in rem.
  - `src/screens/done/rank.test.ts` — new (8 tests).
  - `tests/w2-summary.spec.ts` — new (8 tests).
  - Not touched: `FocusScreen.*`, `tests/whistle.spec.ts`, every other file. No toast, scene, stage, Home or art change.

## 5. Acceptance per configuration (AFTER, production preview of the branch, frozen clock)

Measured by `S/tools/measure.mjs` inside each capture (`S/captures/AFTER/<cfg>/meta.json`): every line of the sheet
against the fold on arrival (1.5 s / 4 s and settled), `elementFromPoint` at the centre of every visible line, pairwise
box overlaps, the footer's Tea time and Skip break hit-testable, Chai's share above the sheet, the final expanded line
(arithmetic opened by a click, the wheel to the end) against the footer, axe (WCAG 2.0–2.2 A/AA tags) in the settled
and end states. Routine-day states were captured on `da5f452` (the routine render is identical in the final revision:
no milestone, so the compact group is the model's order in both); big-day states on the final build.

ACCEPT_TABLE

## 6. Fact reachability, BEFORE vs AFTER

FACT_TABLE

## 7. Suites (final revision unless stated)

SUITES

## 8. Captures

- AFTER (branch, production preview :5231): `S/captures/AFTER/<WxH-theme-tNNN>/07-summary-{routine,bigday}{,-settled,-full,-end}.png`
  + `meta.json` (16 configurations). `-end` is new: the arithmetic opened and the wheel to the end.
- BEFORE (`90a11e5`, production preview :5330): BEFORE_NOTE
- Same script for both: `S/tools/cap.mjs` (adapted from `before.mjs`: frozen clock `2026-10-11T07:40:00Z` installed
  then resumed, `animations: 'disabled'`, fresh profile per day, same timings).

## 9. Notes for the reviewer

NOTES
