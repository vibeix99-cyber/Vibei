# W2 · Maker S (Summary) — WIP (READY-FOR-REVIEW packet incomplete: see §9)

**Status:** WIP (READY-FOR-REVIEW packet incomplete: see §9). No verdict is claimed here.
**Item:** I07 (rank the rewards) + Wave-1 follow-up #1 (third pill row half under the footer at 375×667).
**Base:** `90a11e5` (kettle/src `42e106d`). **Branch:** `pe/w2-summary` (not pushed). **Worktree:** `/home/user/wt/w2s/kettle`.
**Revision:** `f95e0be` — **kettle/src tree:** `67505713c6c04c6c9e536617b52f3b2549f2e918`.
**Maker model:** Opus 5.5 (`claude-opus-5-5`).

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

- **Revision:** `f95e0be`; `git rev-parse f95e0be:kettle/src` = `67505713c6c04c6c9e536617b52f3b2549f2e918`.
- **Changed files** (`git diff --stat 90a11e5..f95e0be -- kettle/src kettle/tests`), all inside the files this maker owns:
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

**AFTER (production preview of the branch; 'Rev' = the build each row was captured on)**

| Configuration | Day | Rev | Lines cut by the fold on arrival (1.5/4 s, settled) | elementFromPoint misses | Box overlaps | Tea time + Skip hit-testable | Chai above the sheet (arrival / settled) | Final expanded line vs the footer | axe (settled / end) |
|---|---|---|---|---|---|---|---|---|---|
| 1440x900-dark-t100 | routine | da5f452 | 0 | 0 | 0 | yes | 1 / 1 | details5 bottom 610 ≤ 648−14 → clear | 0 / 0 |
| 1440x900-dark-t100 | bigday | da5f452 | 0 | 0 | 0 | yes | 1 / 1 | None bottom None ≤ None−None → **not clear** | 0 / 0 |
| 1440x900-light-t100 | routine | da5f452 | 0 | 0 | 0 | yes | 1 / 1 | details5 bottom 610 ≤ 648−14 → clear | 0 / 0 |
| 1440x900-light-t100 | bigday | da5f452 | 0 | 0 | 0 | yes | 1 / 1 | details8 bottom 685 ≤ 723−14 → clear | 0 / 0 |
| 1440x900-light-t200 | routine | da5f452 | 0 | 0 | 0 | yes | 1 / 1 | details5 bottom 692 ≤ 730−14 → clear | 0 / 0 |
| 1440x900-light-t200 | bigday | da5f452 | 0 | 0 | 0 | **no** | 1 / None | None bottom None ≤ None−None → **not clear** | 0 / 0 |
| 375x667-dark-t100 | routine | da5f452 | 0 | 0 | 0 | yes | 0.84 / 0.84 | details5 bottom 481 ≤ 529−14 → clear | 0 / 0 |
| 375x667-dark-t100 | bigday | da5f452 | 0 | 0 | 0 | yes | 0.85 / 0.85 | details8 bottom 481 ≤ 529−14 → clear | 0 / 0 |
| 375x667-dark-t200 | routine | da5f452 | 0 | 0 | 0 | yes | 0.72 / 0.72 | details5 bottom 427 ≤ 475−14 → clear | 0 / 0 |
| 375x667-dark-t200 | bigday | da5f452 | 0 | 0 | 0 | yes | 0.6 / 0.6 | details8 bottom 427 ≤ 475−14 → clear | 0 / 0 |
| 375x667-light-t100 | routine | da5f452 | 0 | 0 | 0 | yes | 0.84 / 0.84 | details5 bottom 481 ≤ 529−14 → clear | 0 / 0 |
| 375x667-light-t100 | bigday | da5f452 | 0 | 0 | 0 | yes | 0.85 / 0.85 | details8 bottom 481 ≤ 529−14 → clear | 0 / 0 |
| 375x667-light-t200 | routine | da5f452 | 0 | 0 | 0 | yes | 0.72 / 0.72 | details5 bottom 427 ≤ 475−14 → clear | 0 / 0 |
| 375x667-light-t200 | bigday | da5f452 | 0 | 0 | 0 | yes | 0.6 / 0.6 | details8 bottom 427 ≤ 475−14 → clear | 0 / 0 |
| 390x844-dark-t100 | routine | da5f452 | 0 | 0 | 0 | yes | 1 / 1 | details5 bottom 658 ≤ 706−14 → clear | 0 / 0 |
| 390x844-dark-t100 | bigday | cdc6035 | 0 | 0 | 0 | yes | 0.97 / 0.97 | details8 bottom 658 ≤ 706−14 → clear | 0 / 0 |
| 390x844-dark-t200 | routine | da5f452 | 0 | 0 | 0 | yes | 0.75 / 0.75 | details5 bottom 604 ≤ 652−14 → clear | 0 / 0 |
| 390x844-dark-t200 | bigday | da5f452 | 0 | 0 | 0 | yes | 1 / 1 | details8 bottom 604 ≤ 652−14 → clear | 0 / 0 |
| 390x844-light-t100 | routine | da5f452 | 0 | 0 | 0 | yes | 1 / 1 | details5 bottom 658 ≤ 706−14 → clear | 0 / 0 |
| 390x844-light-t100 | bigday | cdc6035 | 0 | 0 | 0 | yes | 0.97 / 0.97 | details8 bottom 658 ≤ 706−14 → clear | 0 / 0 |
| 390x844-light-t200 | routine | da5f452 | 0 | 0 | 0 | yes | 0.75 / 0.75 | details5 bottom 604 ≤ 652−14 → clear | 0 / 0 |
| 390x844-light-t200 | bigday | cdc6035 | 0 | 0 | 0 | yes | 1 / 1 | details8 bottom 604 ≤ 652−14 → clear | 0 / 0 |
| 844x390-dark-t100 | routine | da5f452 | 0 | 0 | 0 | yes | 1 / 1 | details5 bottom 199 ≤ 231−14 → clear | 0 / 0 |
| 844x390-dark-t100 | bigday | da5f452 | unlock-media, unlock-media(settled) | 0 | 0 | yes | 1 / 1 | details8 bottom 212 ≤ 244−14 → clear | 0 / 0 |
| 844x390-dark-t200 | routine | da5f452 | 0 | 0 | 0 | yes | 1 / 1 | details5 bottom 143 ≤ 175−14 → clear | 0 / 0 |
| 844x390-dark-t200 | bigday | da5f452 | 0 | 0 | 0 | yes | 1 / 1 | details8 bottom 143 ≤ 175−14 → clear | 0 / 0 |
| 844x390-light-t100 | routine | da5f452 | 0 | 0 | 0 | yes | 1 / 1 | details5 bottom 199 ≤ 231−14 → clear | 0 / 0 |
| 844x390-light-t100 | bigday | da5f452 | unlock-media, unlock-media(settled) | 0 | 0 | yes | 1 / 1 | details8 bottom 212 ≤ 244−14 → clear | 0 / 0 |
| 844x390-light-t200 | routine | da5f452 | 0 | 0 | 0 | yes | 1 / 1 | details5 bottom 143 ≤ 175−14 → clear | 0 / 0 |
| 844x390-light-t200 | bigday | da5f452 | 0 | 0 | 0 | yes | 1 / 1 | details8 bottom 143 ≤ 175−14 → clear | 0 / 0 |

Totals: cut lines 4, misses 0, overlaps 0, footer failures 1, end-state failures 2, axe violations 0.


**Reading the non-zero rows.** (1) 844×390 @100 big day, `unlock-media`: the record-player picture peeks under the
fold (by design, §9). (2) 1440×900 dark @100 and light @200 big day: capture gaps on `da5f452`, not product results
(§9, missing item 1). Every other row: 0 cut lines, 0 `elementFromPoint` misses, 0 overlaps, Tea time and Skip break
hit-testable, the final expanded line clear of the footer, axe 0. **375×667 @200 %: the final line clears the footer
on both days** (`details5` / `details8` bottom 427 ≤ 475 − 14). The new spec checks the same at 375×667 on the final
build (8/8, §7), including the exact #1 layout (a brew with a task) with and without reduced motion. The milestone day
(atRisk, best streak) was probed at 375×667 and other sizes (`S/probes/a3.json`): 0 cut lines, the highlight whole on
arrival.

**Control vs AFTER at the #1 configuration** (375×667 @100 %, light, a brew with a task): 90a11e5 lift 63 px, "23 days
warm" / "Recipes 1/3" at 498–536 under a fold at 529 → branch lift 38 px, the second pill row clear, the third row
wholly below the fold (its 6 px empty top edge in the fade), Chai above the sheet 0.72 → 0.89 (`S/probes/a1…`
and `S/control/ctl2…`).

## 6. Fact reachability, BEFORE vs AFTER

**Verbatim, every fact including the unlock card and the arithmetic** (90a11e5 from the control probe in this session, settled + end with the arithmetic open; AFTER from the captures):

| Configuration | Day | 90a11e5 facts | AFTER facts | Not reachable in AFTER | Only in AFTER |
|---|---|---|---|---|---|
| 375x667-light-t100 | routine | 13 | 13 | **0** | — |
| 375x667-light-t100 | bigday | 20 | 20 | **0** | — |
| 375x667-dark-t200 | routine | 13 | 13 | **0** | — |
| 375x667-dark-t200 | bigday | 20 | 20 | **0** | — |

**Reward lines, all 16 configurations** (the orchestrator's BEFORE set recorded reward lines with their screen-reader wording; each must contain an AFTER reward line):

| Configuration | Day | BEFORE facts | AFTER facts | BEFORE facts not reachable in AFTER | Only in AFTER |
|---|---|---|---|---|---|
| 1440x900-dark-t100 | routine | 5 | 13 | **0** | (BEFORE set recorded reward lines only) |
| 1440x900-dark-t100 | bigday | 7 | 11 | **0** | (BEFORE set recorded reward lines only) |
| 1440x900-light-t100 | routine | 5 | 13 | **0** | (BEFORE set recorded reward lines only) |
| 1440x900-light-t100 | bigday | 7 | 20 | **0** | (BEFORE set recorded reward lines only) |
| 1440x900-light-t200 | routine | 5 | 13 | **0** | (BEFORE set recorded reward lines only) |
| 1440x900-light-t200 | bigday | 7 | 11 | **0** | (BEFORE set recorded reward lines only) |
| 375x667-dark-t100 | routine | 5 | 13 | **0** | (BEFORE set recorded reward lines only) |
| 375x667-dark-t100 | bigday | 7 | 20 | **0** | (BEFORE set recorded reward lines only) |
| 375x667-dark-t200 | routine | 5 | 13 | **0** | (BEFORE set recorded reward lines only) |
| 375x667-dark-t200 | bigday | 7 | 20 | **0** | (BEFORE set recorded reward lines only) |
| 375x667-light-t100 | routine | 5 | 13 | **0** | (BEFORE set recorded reward lines only) |
| 375x667-light-t100 | bigday | 7 | 20 | **0** | (BEFORE set recorded reward lines only) |
| 375x667-light-t200 | routine | 5 | 13 | **0** | (BEFORE set recorded reward lines only) |
| 375x667-light-t200 | bigday | 7 | 20 | **0** | (BEFORE set recorded reward lines only) |
| 390x844-dark-t100 | routine | 5 | 13 | **0** | (BEFORE set recorded reward lines only) |
| 390x844-dark-t100 | bigday | 7 | 20 | **0** | (BEFORE set recorded reward lines only) |
| 390x844-dark-t200 | routine | 5 | 13 | **0** | (BEFORE set recorded reward lines only) |
| 390x844-dark-t200 | bigday | 7 | 20 | **0** | (BEFORE set recorded reward lines only) |
| 390x844-light-t100 | routine | 5 | 13 | **0** | (BEFORE set recorded reward lines only) |
| 390x844-light-t100 | bigday | 7 | 20 | **0** | (BEFORE set recorded reward lines only) |
| 390x844-light-t200 | routine | 5 | 13 | **0** | (BEFORE set recorded reward lines only) |
| 390x844-light-t200 | bigday | 7 | 20 | **0** | (BEFORE set recorded reward lines only) |
| 844x390-dark-t100 | routine | 5 | 13 | **0** | (BEFORE set recorded reward lines only) |
| 844x390-dark-t100 | bigday | 7 | 20 | **0** | (BEFORE set recorded reward lines only) |
| 844x390-dark-t200 | routine | 5 | 13 | **0** | (BEFORE set recorded reward lines only) |
| 844x390-dark-t200 | bigday | 7 | 20 | **0** | (BEFORE set recorded reward lines only) |
| 844x390-light-t100 | routine | 5 | 13 | **0** | (BEFORE set recorded reward lines only) |
| 844x390-light-t100 | bigday | 7 | 20 | **0** | (BEFORE set recorded reward lines only) |
| 844x390-light-t200 | routine | 5 | 13 | **0** | (BEFORE set recorded reward lines only) |
| 844x390-light-t200 | bigday | 7 | 20 | **0** | (BEFORE set recorded reward lines only) |


**Milestone day** (atRisk, 375×667 @100): 90a11e5 12 facts → branch 12 facts, 0 missing; the highlight line adds
its note "One full brew a day keeps your streak warm." (the arithmetic's existing wording).

## 7. Suites (final revision unless stated)

All through the slot gate (lane MS). Logs in `S/suites/`.

| Suite | Revision | Result |
|---|---|---|
| `npx tsc --noEmit` | final (src `6750571`) | exit 0 (23:02) |
| `npx vitest run` | final (src `6750571`) | **275/275** (267 before + 8 in the new `rank.test.ts`; `summary.test.ts` unchanged and green) |
| New spec `tests/w2-summary.spec.ts` on **90a11e5** (:5310, `--workers=2`, n 2) | spec at `ef14ee8` | **0/8 — all 8 fail, as required**: every failure is an arrival cut (the third pill row "23 days warm"/"Recipes 1/3" at 498–536 with the fold at 529, the details toggle, "+68 leaves", the sub line, the unlock title) or no highlight on the milestone day (`spec-on-90a11e5.log`) |
| New spec on the branch (inside the full chromium run below) | `f95e0be` | **8/8** |
| Playwright **chromium, all specs** (`--workers=2`, n 2) | `f95e0be` | **80/82**, 0 skipped. Fails: `integrity.spec.ts:768` (Settings export → reset → import: the Today profile pill read "2,261 leaves" where "184 leaves" was expected) and `integrity.spec.ts:1090` (Today storage-full banner: the "Crossed off. Nice work." toast not found in 10 s — Wave-1 follow-up #9 / R7-7 names this test as needing a wait). Neither flow reaches the summary and no file they exercise changed. Rerun alone (`--last-failed`, `--workers=1`): **`:768` passed**; **`:1090` failed again** (same message). `:1090` ends its brew early with `timer.end('user')` and never shows the summary; it was not run on `90a11e5` in this session |
| `--project=timer-harness --project=timer-app --project=pwa` (n 2) | `f95e0be` | **29 passed, 2 skipped by design** (`timer.spec.ts:294` and `:438` in timer-app: they run in the harness), as at Wave-1 close |
| `a11y.spec.ts` alone (`--workers=1`, an earlier run in the same job) | `cdc6035` | 3/4 + 7 not run after the failure: `a11y.spec.ts:109` failed on the **Settings** page only (controls "stay under" headings during load); it **passed** in the full chromium run above |


## 8. Captures

- AFTER (branch, production preview :5231): `S/captures/AFTER/<WxH-theme-tNNN>/07-summary-{routine,bigday}{,-settled,-full,-end}.png`
  + `meta.json` (16 configurations). `-end` is new: the arithmetic opened and the wheel to the end.
- BEFORE (`90a11e5`, production preview :5330): **not re-captured in this session** (see §9, missing item 3). The orchestrator's frozen-clock BEFORE set of
  `90a11e5` on :5330 (`contracts/W2/BEFORE-90a11e5/`, same script lineage `before.mjs`, same states, same clock, taken
  ~1 h before AFTER in this round) is the comparison set; my `cap.mjs` is that script with only the summary groups, the
  added `-end` state and the in-page measurement. The control probes in `S/control/` are same-session evidence of
  `90a11e5` at 375×667.

- Same script for both: `S/tools/cap.mjs` (adapted from `before.mjs`: frozen clock `2026-10-11T07:40:00Z` installed
  then resumed, `animations: 'disabled'`, fresh profile per day, same timings).

## 9. Notes for the reviewer

### Missing for READY (why this is WIP)

1. **Big-day AFTER captures on the final build:** recaptured on `cdc6035` for 390×844 light 100, dark 100 and light
   200 only. The other 13 big-day rows are from `da5f452`, whose compact group put leftover milestones before recipes
   (one extra pill row on some sizes); the final revision restores the model order, so those 13 rows should be
   re-taken with `S/tools/cap.mjs --days bigday` (≈1 min per configuration on a quiet machine). Two `da5f452` rows are
   incomplete: 1440×900 dark @100 (no `-end`: the toggle sat below the card's fold on that build and the wheel over the
   3D close-up did not scroll) and 1440×900 light @200 (interrupted after the first state).
2. **Same-session BEFORE captures** of `90a11e5` (:5330) were not taken (slot time). `cap.mjs` and `caps.sh` are ready;
   the orchestrator's BEFORE set is used for comparison.
3. `integrity.spec.ts:1090` failed twice on the branch (Today, storage-full banner; no summary in that flow; a known
   wait problem, Wave-1 follow-up #9). Not run on `90a11e5` in this session.

### Other notes

- **Residual, by design:** at **844×390 @100 %, big day**, the record-player close-up (a 150 px picture, no text) is
  taller than the room left under the heading in the landscape card, so its lower part starts under the fold on
  arrival (same on `90a11e5`). The card's text, every pill and the footer are untouched; trimming the card to hide it
  would need 42 % of the scroll area (limit 25 %) and would hide the unlock on arrival, so the picture peeks instead.
  This is the only "cut" in the AFTER table, and it is a picture, not a line of text.
- **Chai:** the opening lift never exceeds the old limits (22 % routine / 30 % highlight of the sheet's rest), and the
  snapped lift is usually *lower* than the old one (375×667 task day: 38 px vs 63 px), so more of Chai shows.
- **The fade:** 22 → 14 px. It still marks "more below" (the next pill's empty top edge, ≤ 6 px, shows in it).
- **Highlight text for assistive tech:** the highlighted pill keeps its screen-reader wording (`sr`) when it has one,
  and adds its note as a second line; the list stays the one "Rewards" list.
- **Toasts:** not touched (not authorised). No toast covered any measured summary line in any captured state
  (`elementFromPoint` misses = 0).
- **a11y short screen:** `a11y.spec.ts:109` failed once in a `--workers=1` run (Settings page only, during load) and
  passed in the full chromium run; its summary and summary-details states were clean both times.
- **Wheel over the unlock's 3D close-up** (1440×900 dark, `da5f452` capture): the capture's wheel over the summary did
  not scroll while the pointer was over the close-up; pre-existing Nook showcase behaviour, outside this item. With the
  final revision the big day fits the 1440 card again, so nothing needs scrolling there.

