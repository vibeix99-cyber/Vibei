# CHECKER W2 · Maker S (Summary: I07 rank the rewards + Wave-1 follow-up #1) — round 1

**Verdict: APPROVE** `pe/w2-summary@e0f511a` (code `f95e0be`, kettle/src `67505713c6c04c6c9e536617b52f3b2549f2e918`).

| | |
|---|---|
| Lead checker | LEAD-2, Opus 5.5 (`claude-opus-5-5`); implemented none of this work. Built on LEAD-1's interim notes (`review/LEAD/S-interim.md`), re-verified where relied on |
| Revision | `e0f511a` = `f95e0be` + packet/evidence; `git rev-parse` of `e0f511a`, `f95e0be` and trial `3726a71` `:kettle/src` → `6750571…` (equal) |
| Trial merge | `3726a71`; dev :5341, preview :5351 (only `kettle/review/**` differs from `e0f511a`, LEAD-1, rechecked by tree hash) |
| Base / control | `90a11e5` (src `42e106d`), dev :5310, preview :5330 |
| Packet | `/home/user/wt/w2s/kettle/review/product-excellence/contracts/W2/S-READY-FOR-REVIEW.md` (WIP; its §9 gaps are closed by Lane S + the orchestrator's same-session captures below) |
| My probes and frames | `contracts/W2/review/LEAD/S/` (`ms.mjs`, `ms2.mjs`, `end1440.mjs`, their PNGs and JSON) |

## 1. What I did, and what I took from others

**Myself:**
- Diff review `90a11e5..e0f511a` (5 files: `screens/done/{summary.ts, Summary.tsx, Summary.module.css, rank.test.ts}`, `tests/w2-summary.spec.ts`; all in S's area; `buildSummary` and `summary.test.ts` untouched). `rankRewards`: unlock first (its own card), else the top of level → best streak → badge (tier, then order) → Tea Cozy; never leaves, goal, a plain warm streak, recipes or the level distance. Secondary = the model's pills minus the highlighted one, model order. Fold: lines marked `data-fold`, a snapped lift inside the old caps (22 % / 30 %), side by side a ≤ 25 % trim reset on resize, fade 22 → 14 px, pill gap 0.5rem.
- Rebuilt Lane S's acceptance table over all 16 configurations after "FINISH DONE" (01:38:58) with `python3 -I /home/user/wt/w2t-s/kettle/.tmp/LS/analyze.py` → `review/LS/acceptance-table.md`, `analysis.json`.
- Three same-session BEFORE (:5330) / AFTER (:5351) probes through the gate (lane LEAD, n 1), real clicks:
  - **milestone day without an unlock** (seed `atRisk`: a new best streak) at 375×667 light @100, 390×844 dark @200, 844×390 light @100, 1440×900 dark @100;
  - **the K02 task day, Wave-1 #1 exactly** (seed `veteran`, task "Chapter 3 notes") at 375×667 light @100 and @200, 844×390 dark @100;
  - **1440×900 light @100 big day end state** (real wheel, real click on "How your leaves added up", wheel to the end), because Lane S's AFTER `-end` there (and BEFORE @200) hit a 10 s click timeout under load on both sides.
- Lane R's matrix: every non-summary pair over 0.5 % opened and classified (§5).
- Raw logs re-read: Lane S `t1090/` (counted myself), Lane R `tsc.log`, `vitest.log`, `chromium-full.log`, `timer-app-pwa.log`, `rerun-1004-*.log`, `smoke.log`.

**From Lane S (raw captures, analysed by its script, opened by me where cited):** same-session BEFORE/AFTER routine and big day, arrival / settled / end, 16 configurations. **From Lane R (combined N+S trial `248415c`):** suites and the standard capture set. **From the maker:** vitest `rank.test.ts`, the spec's base run 0/8 → branch 8/8.

## 2. Suites and flakes (raw logs)

| Suite | Result |
|---|---|
| tsc (Lane R, `248415c`) | exit 0 |
| vitest (Lane R) | 28 files, 275/275 |
| chromium full (Lane R, `248415c`) | 87 passed, 1 failed: `integrity.spec.ts:1004` @1440 at l.1085 (storage-full banner still present 6 s after room was freed; Today/Settings part of the flow, not the summary). Reruns of the file: trial 3 runs → `:1004` passed 3/3, `:1090` failed 1/3; base 3 runs → `:1004` 3/3, `:1090` failed 1/3 (same "Crossed off. Nice work." wait) |
| timer-harness / timer-app / pwa (Lane R) | 29 passed + 2 skipped by design |
| smoke (Lane R) | 0 errors |
| `integrity.spec.ts:1090` (Lane S, counted by me) | 375/390: 9/9 both sides. 1440×900: S failed 3/9 (`S-run3`, `rep-S-r1`, `rep-S-r3`), base 4/9 (`rep-base-r1` 1, `-r2` 1, `-r3` 2) → pre-existing flake F1 (R7-7) |

## 3. Acceptance

| Criterion | Result | Evidence |
|---|---|---|
| Minutes and Tea time stay primary (K02) | PASS | heading in view on arrival and settled at 16/16 × 2 days; Tea time + Skip hit-testable 16/16 (table); every frame opened |
| At most ONE milestone highlighted, the biggest | PASS | milestone day: exactly one `li[data-highlight]` = "6 days warm, your best yet" (honey card, note "One full brew a day keeps your streak warm.") at 4/4 configs; big day: the unlock card is the one highlight and no pill is lifted; routine: none (table "highlights" column 0/1 as expected at 16/16) |
| Everything else secondary; nothing hidden | PASS | rewards comparison 16/16 × 2 days: same pills (5/5, 7/7), same numbers, same announcement, same arithmetic; milestone day: the other three pills follow in model order (my JSON) |
| Preserve: compact summary, arithmetic, footer, record-player close-up, Chai | PASS | compact pills unchanged on routine/unlock days; arithmetic identical; footer unchanged; close-up path unchanged (drawing first, then 3D: K03 pairing, same on base); Chai visible on arrival at every config (table, frames) |
| 16 configurations, routine + big day; nothing overlaps | PASS | occlusion/overlap 0+0 at every row; ink-rule cut lines on arrival 0 at every AFTER row except 844×390 @200 (see R-4: a measurement artefact, opened at full size, no glyph above the fold) |
| Final line clears the footer at 375×667 @200 | PASS | end state gap 49.4 px (routine and big day, both themes); 1440 light @100 big day by my real-input run: last line 38 px above the scroll area's bottom, identical to base |
| Wave-1 #1 (third pill row half under the footer at 375×667) | FIXED | task day 375×667 light @100: BEFORE "23 days warm / Recipes 1/3" sliced by the footer; AFTER the sheet opens 25 px lower (lift 38 vs 63 px), only that row's empty top edge peeks into the 14 px fade, more of Chai shows |

AFTER per-config result (Lane S rule set; arrival, settled, end): PASS at 25/32 rows; the 7 others are 844×390 @100 big day ×2 (R-1, same on base), 844×390 @200 ×4 (R-4, false positive) and 1440×900 light @100 big day (`-end` not captured: click timeout under load, as on BEFORE 1440 light @200; replaced by my real-input end check, PASS). BEFORE fails 24/32 rows (cut lines/boxes, Chai at 390 @200 big day).

## 4. What I opened (full size or full-resolution crops; REFERENCE → BEFORE → AFTER)

- K02 `VISUAL_BENCHMARK_LIBRARY/assets/current/07-summary.png` → LS BEFORE/AFTER `390x844-light-t100/07-summary-routine.png` (identical) and `07-summary-bigday-settled.png` (BEFORE "7 days warm, your best yet" sliced in the fade; AFTER clean, sheet higher, Chai's face and arms in view).
- K03 `11b-summary-unlock-settled.png` → LS `1440x900-light-t100/07-summary-bigday-settled.png` BEFORE/AFTER (same four pill rows; both still on the drawing fallback at that moment, see R-6) and LS `1440x900-dark-t100` arrival/settled/full/end crops (drawing fallback until the 3D loads; loaded in `-end`).
- LS `375x667-light-t200` big day arrival + routine/big-day end; `844x390-light-t100` routine, `844x390-dark-t200` big day settled, `844x390-light-t200` routine (full-res crop of the fold).
- Mine: milestone day ×4 configs, task day ×3 configs (`review/LEAD/S/*-atRisk-*.png`, `*-veteran-task-*.png`), dark highlight card crop at 1440.
- Lane R pairs (ctrl / trial / diff): `1440x900@1-light-16-stats-populated`, `1440x900@1-dark-06-whistle`, `1440x900@1-dark-02-focus-start`, `375x667@2-dark-03-focus-mid`, `1440x900@1-dark-{09-break,10-break-over,19-settings}`, `390x844@2-dark-04-focus-paused`, `1440x900@1-light-11-summary-unlock`, `390x844@2-light-14-summary-first`, `1440x900@1-dark-14-summary-first`, and the 11b crops at 1440.

## 5. Lane R matrix (`248415c` vs control), pairs over 0.5 %

| Pair | Cause | Class |
|---|---|---|
| 07 / 11 / 11b / 14 summary states, phones | S: snapped lift / clean fold (opened: first-brew 390 now shows the setup card whole; Chai visible) | expected (S) |
| `1440 light/dark 11-summary-unlock` (16.9 %) | the unlock close-up is still the drawing fallback in the trial frame, already 3D in ctrl; in 11b (settled) the trial shows the 3D close-up in both themes; card trimmed a few px (side-by-side clean end) | load phase + S |
| `1440 dark 14-summary-first` (14 %) | 2 px card shift (clean end) | S |
| `1440 light 16-stats-populated` (16 %) | the **ctrl** frame is the Today screen (navigation not reached); trial is a correct Stats page | capture harness |
| `1440 dark 06-whistle` (7.2 %) | trial frame taken after the summary had already come up | capture phase |
| `03-focus-mid` 375 dark / 390 light (5–6 %) | ctrl frame has the idle-dimmed chrome, trial the shown chrome; clock digit | capture phase |
| `1440 dark/light 02-focus-start` (12.7 / 6.4 %) | trial frame is mid-handover: the room still (now with N's item layers) cross-fading over the live canvas (ghosted window/curtains); clock digit | N, transient mid-fade frame (judged in CHECKER-W2-N) |
| `1440 dark 09-break`, `10-break-over` (2.5 / 1.9 %) | clock digits, the rotating tea tip, a "Recipe done" toast present in one frame | noise |
| `1440 dark 19-settings` (0.6 %) | segmented-control thumbs mid-slide on mount; no S or N file touches Settings | capture phase |
| `04-focus-paused`, `13-first-brew` | clock digits, room animation | noise |
| `17-nook-early`, `18-nook-earned` (SIZE / 0.5 %) | Nook page | N |

No pair shows an S defect.

## 6. Residuals

| # | Item | Where | Class | Reason / owner |
|---|---|---|---|---|
| R-1 | The unlock picture (150 px, no text) starts under the fold on arrival | 844×390 @100, big day | FOLLOW-UP | Same on `90a11e5` (table: `unlock-media` cut both sides); text, pills and footer untouched. Owner: summary area (next summary/toast round) |
| R-2 | At 200 % on phones the highlight is a scroll away on arrival (its top edge peeks in the fade): milestone day 390×844 @200 (sheet not lifted), unlock 375×667 @200 | phones @200 | ACCEPTED | The cap (protects Chai/K02 framing) cannot fit it whole; the alternative is a sliced line (what base did). On base the milestone was not highlighted and also below the fold |
| R-3 | Side by side the card may end up to 25 % earlier: e.g. 1440 K03 day with a task ends after the third pill row ("Badge: Weekend Warmth" peeks) | 844×390, 1440×900 | ACCEPTED | Clean-fold rule, reset on resize, every row a scroll away, the fade + peek say "more" |
| R-4 | Lane S table flags 844×390 @200 "Tea's ready…" as straddling | 844×390 @200, both days, both themes | ACCEPTED (not a defect) | Opened full-res: AFTER shows no glyph of that line above the fold (the card ends after the heading); the tool measures the 2-line paragraph box. BEFORE slices it visibly |
| R-5 | Sheet opens higher on milestone / unlock days (≤ 30 % of rest, as the unlock already could); Chai's lower body covered at 375×667 | phones | ACCEPTED | Within the base caps; Chai's face and arms in view at every config (table) |
| R-6 | Unlock close-up shows the drawing fallback for the first seconds (to 20 s+ under load 12–14) at 1440 | 1440×900 | FOLLOW-UP (pre-existing) | Same on base arrival frames; the reference README pairs K03 with this drawing. Owner: scene/Nook (3D load time under software GL) |
| R-7 | Fade 22 → 14 px | all | ACCEPTED | Still signals more (peek); required for a clean fold in an 8 px gap |
| F1 | `integrity.spec.ts:1090` / `:1004` @1440 flakes | 1440×900 | FOLLOW-UP | Base 4/9 vs S 3/9 (`:1090`); `:1004` 3/3 on reruns both sides. Owner: R7-7 / M7a (test waits) |

No BLOCKS.

**Not verified:** Lane S's synthetic touch swipes did not move the summary in its spot runs (`spot/*/spot.json`, AFTER only; wheel and keyboard did). S changes no touch, overscroll or `touch-action` rule, and CDP touch dispatch without gesture synthesis commonly does not scroll in headless Chromium; no base run exists to compare. Not attributed to S.

## 7. Follow-ups with owners

1. R-1 unlock picture under the fold at 844×390 @100 — summary area (with I10's summary/toast round).
2. R-6 3D close-up load time under software GL — scene/Nook owner.
3. F1 `integrity.spec.ts:1090`/`:1004` waits at 1440 — R7-7 / M7a owner.
4. Packet hygiene: S-READY-FOR-REVIEW.md still says WIP; its §9 gaps are now covered by `review/LS/captures` + the rebuilt table — orchestrator to note on merge.

## 8. The one pair that shows the change

Milestone day (I07), 375×667 light @100: BEFORE `contracts/W2/review/LEAD/S/375x667-light-t100-atRisk-BEFORE.png` → AFTER `contracts/W2/review/LEAD/S/375x667-light-t100-atRisk-AFTER.png`.
(Wave-1 #1 exactly: `contracts/W2/review/LEAD/S/375x667-light-t100-veteran-task-{BEFORE,AFTER}.png`.)
