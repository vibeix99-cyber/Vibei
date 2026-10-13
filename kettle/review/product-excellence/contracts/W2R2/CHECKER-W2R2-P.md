# CHECKER W2R2 · Maker P — summary polish (I07 follow-up)

**Verdict: APPROVE** `pe/w2r2-summary@dc7a28d` (code `a4f1773`, kettle/src `f255e9f3fad326ec059d134ff776a8f6254436d9`).

| | |
|---|---|
| Lead checker | LEAD-2 (new lead, replacing LEAD-1, who was stopped by a usage limit). I implemented none of this work |
| Revision | `dc7a28d` = code `a4f1773` + packet. `git rev-parse` of `dc7a28d`, `a4f1773`, `23e7494` and trial `d07bd2d` at `:kettle/src` all give `f255e9f…` (equal). Tests at `dc7a28d` = `a4f1773` = `d07bd2d` (`90bf6f5`) |
| Trial merge | `d07bd2d` (integration + `dc7a28d`), worktree `/home/user/wt/w3tr-p`, dev :5442, preview :5452. Outside `kettle/review/**`, it differs from `dc7a28d` only by integration files that P does not touch |
| Base / control | `b377c62` (src `e0aebbf`), dev :5410, preview :5430 |
| Packet | `/home/user/wt/w3p/kettle/review/product-excellence/contracts/W2R2/P-READY-FOR-REVIEW.md`; evidence `…/W2R2/P/` |
| My evidence | `contracts/W2R2/review/LEAD2/P/` (`tsc.log`, `vitest.log`, `specs-trial-5442.log`, `probe.log` + `probe/*.png`, `probe-b/`). Probe script `/home/user/wt/w3-base/kettle/.tmp/LEAD2/p2-lead.mjs` |
| LEAD-1's P probes (re-read, frames opened) | `contracts/W2R2/review/LEAD/P/` (`probe.log`, `probe/*.png`, `rotate.log`, `w2-summary-trial-5442.log`) |
| Lane P receipt | `contracts/W2R2/review/LP/RECEIPT-LP.md` (Sonnet; raw numbers only), read in full. Lane P's facts that I rely on are checked in §3 (see "From Lane P, verified") |

## 1. What I did

**Diff review**, `b377c62..dc7a28d`, all within P's ownership:
- `screens/done/{Summary.tsx, Summary.module.css, summary.ts, rank.test.ts}`;
- `screens/focus/stage/{Kettle.tsx, Stage.tsx}`: one `data-stage-figure` attribute each, nothing else;
- `tests/w2-summary.spec.ts`.

No `src/ui/**`, `screens/home/**` or `FocusScreen.*` file is touched, and nothing in toast code. The footer's `data-toast-above` is left as an inert no-op (DESIGN-GATE-T, Decision 4).

What the code does:
- **Opening.** `cleanOpen` caps the lift by `figureRoom()`, the room between the stage's `[data-stage-figure]` boxes and the sheet's resting top edge, measured without entrance or hop transforms, minus 2 px. When no lift in that room gives a clean fold, it adds `--air`: extra px above the heading and in every block gap, at most 1.5 rem. The heading is kept whole first, then the highlight.
- **Runs once.** The opening runs once per mount (`opened` ref), so air is never applied twice. Side by side keeps the base's `rest = 0` path.
- **Hierarchy.** `.highlight*` is quieter: title 16px/600 (was 17/700), art ×1.2 (was ×1.45), card 50 px min (was 56), note 13px.
  - The note's contrast is 6.28:1 light and 7.16:1 dark, computed from the `--ink-2`/`--honey-soft` tokens.
- **Words.** "Warm days" copy (`WARM_RULE`, `COZY_MEANS`, `warmNote`) appears in the arithmetic, the notes, Tea Cozy's screen-reader line and the announcement. `buildSummary`'s pills, numbers and order are unchanged.
- **Tests.** The spec's `chaiShown ≥ 0.5` became `clear.chai ≥ 0 && clear.kettle ≥ 0`, which is stronger, not weaker. The new tests check real geometry, styles and text; none mirrors the implementation.

**Suites on the trial `d07bd2d`, run myself:**

| Suite | Result | Log |
|---|---|---|
| `npx tsc --noEmit` | exit 0 | `review/LEAD2/P/tsc.log` |
| `npx vitest run` | 28 files, **278/278** | `review/LEAD2/P/vitest.log` |
| chromium `w2-summary` + `whistle` + `a11y` vs dev :5442 | **37/37** (w2-summary 18, whistle 8, a11y 11), 20.6 min | `review/LEAD2/P/specs-trial-5442.log` |

Re-read but not re-run:
- the maker's full chromium (103/105; the 2 are `break-reach:179`, identical on `b377c62`, which is T's item f);
- timer (26 + 2 skipped by design);
- pwa 3/3;
- LEAD-1's `w2-summary` 18/18 on :5442.

**Same-session probe, control :5430 vs trial :5452** (`p2-lead.mjs`, adapted from LEAD-1's `p-lead.mjs`, which I read in full):
- one browser, fresh context per run, frozen clock 2026-10-11 07:40Z;
- a real click to start and a real touch tap on Tea time; `__kettle.finish()` used for setup only;
- arrival measured at 1.5 s and settled at 4.5 s, then one 200 px wheel on the sheet.

Raw rows are in `review/LEAD2/P/probe.log`, frames in `probe/`. The first run was stopped by the session's background time limit after 23 of 36 runs. The missing rows (390×844 @200 big day, 844×390 dark @200, 1440×900 dark @100) ran again as `probe-b/`.

## 2. What I opened (full size; REFERENCE → BEFORE → AFTER)

- **K02** `VISUAL_BENCHMARK_LIBRARY/assets/current/07-summary.png`, then the task day at 390×844 light @100:
  - P BEFORE `P/captures/BEFORE/390x844-light-t100/04-summary-task-settled.png`: the sheet over Chai's feet and the kettle's stand;
  - AFTER `…/AFTER/…`: both whole, unlock card whole;
  - my own trial arrival frame `review/LEAD2/P/probe/390x844-light-t100-task-trial-arrival.png`, at the whistle: steam, flame, Chai and the kettle all whole; the card's content whole, only its bottom padding at the 14 px fade.
- **375×667 light @100, task/unlock day:**
  - BEFORE: the sheet lifted 85 px, the kettle's gauge cut in half, Chai to the chest;
  - AFTER: both whole, heading, task and choices whole, the Fairy lights card's honey edge peeking at the fold, air 15 px.
- **375×667 light @100, big day (record player, PRESERVE 8)**, BEFORE → AFTER: the record-player drawing card is whole on arrival on both builds, and Chai and the kettle are whole only on AFTER.
- **375×667 light @200, task and big day**: P BEFORE/AFTER settled, then my own `375x667-light-t200-task-{control,trial}-{arrival,onescroll}.png`.
  - On arrival, AFTER shows the whistle scene whole, then "25 minutes brewed" (ink clear of the fade), then the footer. My box-based "heading whole" flag reads false there only because the h1's line box, not its ink, enters the fade; the frame settles it.
  - One wheel brings in the subline and the task row. The spacing is even, with 48 px gaps.
- **390×844 dark @200, task day**, BEFORE → AFTER:
  - BEFORE: sheet lifted 111 px, Chai's face to the eyes and the kettle under the sheet;
  - AFTER: both whole, heading and subline whole.
- **Milestone day (hierarchy and words)**, 375×667 light @100, LEAD-1's control vs trial: the honey card, 73.8 px tall with a 17/700 title and a two-line "…keeps your streak warm.", becomes 50 px, 16/600, with one line, "One full brew a day keeps the kettle warm."; the sheet no longer covers Chai. 390×844 dark @200 milestone trial too.

## 3. Acceptance

| Criterion (brief) | Result | Evidence |
|---|---|---|
| Minutes ("25 minutes brewed") and Tea time stay the strongest elements | **PASS** | Heading 28px/600 (56 at 200 %) and the filled sky Tea time button are unchanged. The highlight title is 16/600 (was 17/700, heavier than the heading). The card's area is 16,750 px² against Tea time's 20,100 at 375 (was 24,711, larger than Tea time); at 390 @200, 55,081 vs 37,931 for Tea time's box (was 72,718). Spec "the highlight is quieter…" |
| The milestone card stays highlighted, but quieter than both | **PASS** | It is still the one honey card (fill and edge unchanged), full width and first in the rewards; frames opened |
| "Warm days" replaces "streak" | **PASS** | The summary's own words contain no "streak" on any trial run (my probe: own = 0 in 23/23 trial rows; control 1–3). The only hits are the badge's catalogue name "Warm Streak" (pill and "New badge: Warm Streak."), which is out of scope (§5, F-1). `rank.test.ts` "words" test; spec "warm days, never streak" |
| Chai and the kettle fully visible above the sheet at 375×667 and 390×844, arrival and settled | **PASS** | Trial: Chai's box 10.8–22.8 px and the kettle's 2.4–14.4 px above the sheet in every stacked row, mine and the maker's (24/24 runs, arrival = settled). Control: covered in 9 of 12 of my stacked rows, by up to 88/97 px |
| …without undoing footer clearance | **PASS** | End state: the last line ≥ 47.4 px above the footer stacked and ≥ 31.3 side by side, identical to control (P §4.1; LEAD-1 `gap` 47.5–48 both builds) |
| …or hiding any fact | **PASS** | Same pill list, same count (4 or 7) and same order on both builds in every row; the announcement carries the same facts in warm-days words; nothing is clamped or removed. See the ruling in §4 for what moves below the fold |
| Preserve: at most one highlight | **PASS** | 0 or 1 in every row (spec; frames) |
| Preserve: fold between lines | **PASS** | 0 lines cut on every stacked run (P §4.1; spec). The 4 cut "lines" side by side are the base's R-1 unlock picture, identical on both builds |
| Preserve: footer clearance | **PASS** | as above; Tea time and Skip hit-test on top 60/60 (P); a real tap on Tea time starts the break in 23/23 of my runs on both builds |
| Preserve: record-player unlock close-up (PRESERVE 8) | **PASS** | The drawing-then-3D card code is untouched. The big day at 375×667 @100 and 390×844 @100 shows the card whole on arrival on both builds. 375 @200 had it a scroll away on control too (447 px) |
| Side by side (844×390, 667×375, 1440×900) unchanged | **PASS** | `rest = 0` path untouched; P's 30 side-by-side rows identical lift (0), cut lines and end gap; LEAD-1 1440 light @100 and my `probe-b` (844×390 dark @200, 1440×900 dark @100) |
| Reduced motion | **PASS** | LEAD-1 375 @100 `-rm` rows are identical to motion rows on both builds; spec's reduced-motion fold test |

From Lane P, verified:
- **The kettle box clears by 0.4 px in four runs** (390×844 task @100, big @200; lift 12). That is ≥ 0, so it is whole. Lane P measures from the sheet box's edge; P's 2.4 px includes the sheet's 2 px top line, so the two agree.
- **The only drawn part under the sheet edge is the kettle's radial-gradient glow ellipse** (effective opacity 0.08 at settled). It is under the edge on *both* builds in every run. The opaque plate clears by ≥ 14.2 px. It is not the kettle's body, gauge, flame or stand: my arrival frames at 390×844 show the whole kettle, flame included.
- **"Heading in view" is 18/24 by line box but 24/24 by glyph ink, with 0 ink cuts.** This matches my own box-vs-ink observation and the frames. What a person sees is the ink.
- **Side by side at 200 %, P's end-state scroll height is 42 px taller.** Lane P did not isolate the cause. It is exactly one line of the arithmetic's closing note (0.875 rem × 200 % = 28 px × 1.5 line-height = 42 px): "7 days warm. One full brew a day keeps the kettle warm." wraps once more in the narrow card than the old sentence. The last line's gap to the footer is the same 34.4 px on both builds. Benign.

Not worse, observed: on rotation the control carries its 85 px lift into landscape, where the heading ends up 59 px above the card's top. The trial's lift is 0–12 px, so after rotation its heading is at 25 px, in view (LEAD-1 `rotate.log`). Its `--air` persists after rotation; side by side its CSS overrides padding and gap (14 / 12 px), and back in portrait the spacing is the same even air. Harmless.

## 4. Ruling on P's flagged trade-off (asked for by Vibei)

**The trade-off:**
- At 375×667 on the task/unlock day (@100), the highlight (here the unlock card) starts a short scroll away on arrival. My probe: 126 px to whole; one 200 px wheel brings it whole. Its honey edge peeks at the fold.
- At 375×667 @200, every highlight starts a scroll away. Task day 771 px, milestone 303, big day 595, against the control's 600 / 227 / 447. At @200 the control already had it a scroll away; P adds 76–171 px.
- Round 1 showed the @100 card by lifting the sheet 85 px over Chai and the kettle's gauge.

**Ruling: ACCEPTED (not a defect).**
1. **The brief ranks it.** The third criterion is the round's purpose: "Chai and the kettle fully visible above the sheet at 375×667 and 390×844, without undoing footer clearance or hiding any fact." The only way round 1 brought the card up on that day was the lift over Chai's body and the kettle's gauge, which this criterion removes. On a 375×667 sheet with the task row and choices first, at most ~12 px of figure room is left. So "highlight whole on arrival" and "figures whole" cannot both hold there, and the brief has chosen.
2. **No fact is hidden.** The card is in the sheet, reachable by one scroll at @100. It is named in the announcement ("Cozy level 5: something new in your nook"), and its honey edge signals it at the fold. At @200, the control showed only the heading and subline too; the highlight was a scroll away on both.
3. **Preserve list.** At most one highlight: unchanged. Fold between lines: 0 cut lines, which is exactly what forces the air instead of a lift. Footer clearance: unchanged. Record-player close-up (PRESERVE 8): unchanged and whole on arrival on the record-player day at 375×667 @100 and 390×844. The trade-off falls only on the Fairy-lights task day at @100 and on @200.
4. **Precedent.** Round 1's R-2 already accepted "at 200 % on phones the highlight is a scroll away on arrival".

What would make this a defect: the card cut by the fold (it is not, the fold falls between lines), the heading not whole (it is whole, by ink, in every frame), or the card missing from the scroll. None occurs.

## 5. Residuals

| # | Item | Where | Class | Owner / note |
|---|---|---|---|---|
| F-1 | The badge's catalogue name "Warm Streak" still shows (pill "Badge: Warm Streak II", "New badge: Warm Streak.") | big days, every configuration | **FOLLOW-UP** (out of scope; not counted against P) | Vibei approved renaming it "Warm Days" next round, as a display-name-only change in `src/progress/badges.ts` (id `warm-streak` unchanged, so no data migration). Owner: progress/badges, next round |
| P-2 | Highlight a scroll away on arrival: 375×667 task/unlock day @100, all days @200 | 375×667 | **ACCEPTED** | §4 ruling |
| P-3 | `--air`: up to 15 px (375 @100) / 34 px (375 @200) more above the heading and in every block gap | stacked phones | **ACCEPTED** | Even rhythm, no blank band, proportional at @200 (frames opened); it is the only clean fold that keeps the figures whole |
| F-2 | `break-reach.spec.ts:179` fails at @200 | Break's over | **FOLLOW-UP** (pre-existing) | Identical on `b377c62` (the maker's 2×2 reruns; Lane R round 1). T's item f |
| F-3 | R-1, the unlock picture under the fold at 844×390 @100 (side by side) | 844×390 | **FOLLOW-UP** (unchanged from round 1) | Summary area |
| F-4 | R-6, the 3D close-up's load time under software GL | 1440 | **FOLLOW-UP** (unchanged) | Scene/Nook owner |
| F-5 | The summary footer's `data-toast-above` is now an inert attribute once T merges (DESIGN-GATE-T Decision 4) | `Summary.tsx` | **FOLLOW-UP** (cleanup) | Summary area: delete it in the next summary change after T merges |
| X-1 | **T × P interaction.** T's summary protection is a structural selector into P's DOM, and T's notices on the summary stage sit over the art above this sheet | integration | **Condition on T, not P** | DESIGN-GATE-T-RECONFIRM A (stage stack top-aligned, so notices sit over the window, not Chai and the kettle) and E.2 (T's summary proofs run on a trial of T with this revision) |

No BLOCKS.

## 6. The pairs that show the change

- **Chai and the kettle whole (the round's purpose), 375×667 light @100, task day:**
  - BEFORE `/home/user/wt/w3p/kettle/review/product-excellence/contracts/W2R2/P/captures/BEFORE/375x667-light-t100/04-summary-task-settled.png`
  - AFTER `/home/user/wt/w3p/kettle/review/product-excellence/contracts/W2R2/P/captures/AFTER/375x667-light-t100/04-summary-task-settled.png`
- **Hierarchy and words, milestone day, 375×667 light @100:**
  - BEFORE `contracts/W2R2/review/LEAD/P/probe/375x667-light-t100-milestone-control-settled.png`
  - AFTER `contracts/W2R2/review/LEAD/P/probe/375x667-light-t100-milestone-trial-settled.png`
- **At 200 % (the trade-off), on arrival:**
  - BEFORE `contracts/W2R2/review/LEAD2/P/probe/375x667-light-t200-task-control-arrival.png`
  - AFTER `contracts/W2R2/review/LEAD2/P/probe/375x667-light-t200-task-trial-arrival.png`
