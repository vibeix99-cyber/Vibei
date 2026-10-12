# W2R2 · Maker P — summary polish (I07 follow-up): packet

**Status: see §9 (the last line of this file).** Maker P returns no verdict.

| | |
|---|---|
| Branch | `pe/w2r2-summary` (from `b377c62`, kettle/src `e0aebbf`) |
| Code | `a4f1773` (= `23e7494` + a spec-only fix); **kettle/src tree `f255e9f3fad326ec059d134ff776a8f6254436d9`** (identical at `23e7494`) |
| Packet | the commit that adds this file (hash in the maker's reply; `git log -1 -- kettle/review/product-excellence/contracts/W2R2/P-READY-FOR-REVIEW.md`) |
| Trial merge into `claude/wizardly-galileo-uy89d9` (`34e7751`) | `git merge-tree --write-tree claude/wizardly-galileo-uy89d9 pe/w2r2-summary` → exit 0, no conflicts, tree `a8c9a87`; its `kettle/src` = `f255e9f` (= branch). Also clean with T's `pe/w2r2-toast@dabc8f3` (no shared files) |
| Servers | control `b377c62`: preview :5430 (BEFORE); mine: dev :5422 (specs, trial probes), preview :5432 (AFTER, `vite build` of `23e7494`'s src → `/tmp/rv7-servers/dist-w3p`) |
| Evidence | `contracts/W2R2/P/` (probe, runner, analyzer, captures, logs) |

## 1. Changed files (`b377c62..a4f1773`)

| File | What |
|---|---|
| `src/screens/done/Summary.tsx` | opening: lift capped by the measured room above the figures (`figureRoom`, `shiftY`); `cleanOpen` (lift + even air, heading then highlight kept whole); fold lines carry their block; heading ref; warm-days note; highlight art ×1.2 |
| `src/screens/done/Summary.module.css` | `--air` on the sheet's top padding and gap; quieter `.highlight*` |
| `src/screens/done/summary.ts` | warm-days copy (`WARM_RULE`, `COZY_MEANS`, `warmNote`), announcement, Tea Cozy sr, warm-days badge note |
| `src/screens/done/rank.test.ts` | notes and a "never streak" words test |
| `src/screens/focus/stage/Kettle.tsx`, `Stage.tsx` | `data-stage-figure="kettle" / "chai"` (one attribute each; nothing else) |
| `tests/w2-summary.spec.ts` | Chai/kettle clearance in the fold helper; 390×844 and task-day tests (100/200 %); hierarchy test; copy test |

No T-owned file touched (no `src/ui/**`, `src/screens/home/**`, `FocusScreen.*`); the footer's `data-toast-above` and all toast code untouched (`git diff b377c62 -- kettle/src | grep -ci toast` → 0). No HANDOFF-TO-T needed. `tests/whistle.spec.ts` needed no change.

## 2. Design and cause notes

### 2.1 Chai and the kettle above the sheet (stacked phones)

**Cause.** The sheet rests at `--sheet-top = stage-h − 28px` (FocusScreen, T-owned), just under the figures: at rest
the kettle's box ends 12.8 px (375×667) / 14.4 px (390×844) above the sheet's top edge, Chai's 20.9 / 22.8 px. Round 1
opened the sheet higher on arrival — up to 22 % of that rest (30 % with a highlight) — to show the highlight or snap the
fold, so on control the sheet rises **0–111 px** and covers Chai or the kettle on **20 of 24** stacked runs
(kettle box overlapped by up to 96.6 px, §4.2).

**Change.** The opening lift is also capped by the room between the figures' boxes and the sheet's top edge.
`figureRoom()` reads the stage's `[data-stage-figure]` boxes (the kettle `<svg>` and Chai's box) where they will rest
— subtracting the summary's entrance transform and Chai's whistle hop (`shiftY`) — minus 2 px for the sheet's top-edge
line. On these phones that room is 10–12 px.

**The fold, kept (Wave-1 #1).** With ≤ 12 px of lift, a clean fold needs another degree of freedom. When no lift in
the room puts the fold between two lines, the sheet opens with a little **air**: the same extra px above the heading
and in every gap between blocks (`--air`, at most 1.5 rem = 24 px at 100 %, 48 px at 200 %, where text is twice as
tall but the sheet's px spacing is not). Lower blocks move down more, so the fold falls before the next block while
the spacing stays even (no blank band). Order: keep the heading whole, then the highlight, each with the least air;
then the lift nearest round 1's target. Side by side: unchanged (no lift; the clean end).

**Observed openings (AFTER, settled, 24 stacked runs):** at 100 % lift 0–12 px and air 0–15 px; at 200 % lift 0–12 px, air 0 / 34 px (34 px at 375×667 @200: the fold falls between the two-line heading and the subline, the only clean place there without covering the scene). Chai's box ≥ 10.8 px and the kettle's ≥ 2.4 px above the sheet on every run. Raw: §4.2.

### 2.2 Hierarchy

The highlight card was the one element whose title out-weighed the heading (17px / 700 vs the heading's 28px / 600) and
whose card was larger than Tea time (24 711 vs 20 100 px² at 375). It keeps its honey fill and edge (still the one
highlight) but is the third voice: title 16px / 600, drawing 34 px (art ×1.2, was ×1.45), note 13px / 600 (one line at
375: "One full brew a day keeps the kettle warm."), min-height 50 px, padding 6/14/6/8. The unlock card (K03, the
record-player close-up) is unchanged.

### 2.3 Copy: "warm days", never "streak"

Kettle's own words elsewhere: "N days warm" (this summary's pill, Today's status bar, Stats), "You kept the kettle warm
N days in a row" (status bar, Stats), "each covers one missed day" (Stats, Tea Cozy).

| Where | Before | After |
|---|---|---|
| arithmetic, closing line | Your 23-day streak stays warm with one full brew a day. | 23 days warm. One full brew a day keeps the kettle warm. |
| announcement (screen reader) | … Warm streak: 7 days. … | … 7 days warm. … |
| best-days highlight note | One full brew a day keeps your streak warm. | One full brew a day keeps the kettle warm. |
| Tea Cozy highlight note | Keeps your streak warm for one missed day. | Covers one missed day, so your warm days keep going. |
| Tea Cozy pill (sr-only) | You earned a Tea Cozy: it keeps your streak warm for one missed day | You earned a Tea Cozy: it covers one missed day, so your warm days keep going |
| warm-days badge, as highlight note | Keep a 7-day warm streak (catalogue line) | 7 warm days in a row (same tier threshold, `BADGES` tiers) |

No number, rule, eligibility or ordering changes; `buildSummary`'s pills/details/arithmetic are untouched.
**Left as data:** the badge's catalogue *name* "Warm Streak" (pill "Badge: Warm Streak II", announcement "New badge:
Warm Streak.") — `src/progress/badges.ts` is shared with Stats › Badges, toasts and the badge art and is not P's file;
renaming it only on the summary would give one badge two names. Proposal for its owner: rename to e.g. "Warm Days"
with "Keep the kettle warm {n} days in a row" (id `warm-streak` unchanged).

## 3. Method

`P/p2probe.mjs` (same context as `r2before.mjs`: frozen clock 2026-10-11T07:40Z + resume, fresh profile per day, the
same seeds and start path; real click to start, `__kettle.finish()` for setup only; real wheel and real click on "How
your leaves added up" for the end state). Days: **routine** = `veteran` (r2before 08), **task** = `newbie` + "Chapter
3 notes" (r2before 04; it is also an unlock day, Fairy lights, level 5), **big** = `celebrate` (09, record player).
Arrival = 1.5 s, settled = 4.5 s after `#/done`. Measured from the live DOM of both builds: Chai's box (`[data-pose]`
in the stage) and the kettle's box (the stage `svg[role=img][data-state]`) vs the sheet's top; every `data-fold` line
(text by its ink) vs the 14 px fade; heading/Tea time/highlight styles; every "streak" in textContent, sr-only text,
reachable aria-labels and the live announcement. `P/analyze.py` → `captures/tables.md|json`.

## 4. Control-first measurements (raw; `P/captures/tables.md`, `tables.json`, per-run `probe.json`)

Same session: for each configuration one browser opened control `:5430` and mine `:5432` (BEFORE then AFTER, or the
same day side by side). 20 configurations = {390×844, 375×667, 844×390, 667×375 @2; 1440×900 @1} × light/dark ×
100/200 %; three days each.

### 4.1 At a glance (all 20 configurations × 3 days)

| side | phase | day-runs | stacked runs: Chai & kettle wholly above the sheet | lines cut by the fold | heading whole | Tea time & Skip hit-testable | end: min last line → footer (px) | "streak" (textContent / visible / sr-only / announcement) | "streak" in the summary’s own words |
|---|---|---|---|---|---|---|---|---|---|
| BEFORE | arrival | 60 | 4/24 | 4 | 60/60 | 60/60 | 31.3 | 140 / 20 / 60 / 40 | 100 |
| BEFORE | settled | 60 | 4/24 | 4 | 60/60 | 60/60 | 31.3 | 140 / 20 / 60 / 40 | 100 |
| AFTER | arrival | 60 | 24/24 | 4 | 60/60 | 60/60 | 31.3 | 40 / 20 / 20 / 20 | 0 |
| AFTER | settled | 60 | 24/24 | 4 | 60/60 | 60/60 | 31.3 | 40 / 20 / 20 / 20 | 0 |

The 4 cut lines are the same on both builds: the unlock picture at 844×390 and 667×375 @100 % (round 1's R-1, side by side, untouched). End: the arithmetic's last line clears the footer by ≥ 47.4 px on every stacked run and ≥ 31.3 px side by side, identical BEFORE/AFTER. The 40 AFTER "streak" hits are the badge's catalogue name on the 20 big days (pill + "New badge: Warm Streak."), P-1.

### 4.2 Chai and the kettle vs the sheet (stacked phones, settled; px, + = above the sheet's top)

| cfg | day | BEFORE lift | BEFORE clear Chai / kettle | AFTER lift | AFTER air | AFTER clear Chai / kettle | AFTER cut lines |
|---|---|---|---|---|---|---|---|
| 390x844-dark-t100 | routine | 0 | 22.8 / 14.4 | 0 | 0 | 22.8 / 14.4 | 0 |
| 390x844-dark-t100 | task | 26 | -3.2 / -11.6 | 12 | 0 | 10.8 / 2.4 | 0 |
| 390x844-dark-t100 | big | 27 | -4.2 / -12.6 | 2 | 7 | 20.8 / 12.4 | 0 |
| 390x844-dark-t200 | routine | 61 | -38.2 / -46.6 | 1 | 0 | 21.8 / 13.4 | 0 |
| 390x844-dark-t200 | task | 111 | -88.2 / -96.6 | 1 | 0 | 21.8 / 13.4 | 0 |
| 390x844-dark-t200 | big | 12 | 10.8 / 2.4 | 12 | 0 | 10.8 / 2.4 | 0 |
| 390x844-light-t100 | routine | 0 | 22.8 / 14.4 | 0 | 0 | 22.8 / 14.4 | 0 |
| 390x844-light-t100 | task | 26 | -3.2 / -11.6 | 12 | 0 | 10.8 / 2.4 | 0 |
| 390x844-light-t100 | big | 27 | -4.2 / -12.6 | 2 | 7 | 20.8 / 12.4 | 0 |
| 390x844-light-t200 | routine | 61 | -38.2 / -46.6 | 1 | 0 | 21.8 / 13.4 | 0 |
| 390x844-light-t200 | task | 111 | -88.2 / -96.6 | 1 | 0 | 21.8 / 13.4 | 0 |
| 390x844-light-t200 | big | 12 | 10.8 / 2.4 | 12 | 0 | 10.8 / 2.4 | 0 |
| 375x667-dark-t100 | routine | 44 | -23.1 / -31.2 | 0 | 4 | 20.9 / 12.8 | 0 |
| 375x667-dark-t100 | task | 85 | -64.1 / -72.2 | 1 | 15 | 19.9 / 11.8 | 0 |
| 375x667-dark-t100 | big | 43 | -22.1 / -30.2 | 0 | 1 | 20.9 / 12.8 | 0 |
| 375x667-dark-t200 | routine | 62 | -41.1 / -49.2 | 0 | 34 | 20.9 / 12.8 | 0 |
| 375x667-dark-t200 | task | 69 | -48.1 / -56.2 | 0 | 34 | 20.9 / 12.8 | 0 |
| 375x667-dark-t200 | big | 80 | -59.1 / -67.2 | 0 | 34 | 20.9 / 12.8 | 0 |
| 375x667-light-t100 | routine | 44 | -23.1 / -31.2 | 0 | 4 | 20.9 / 12.8 | 0 |
| 375x667-light-t100 | task | 85 | -64.1 / -72.2 | 1 | 15 | 19.9 / 11.8 | 0 |
| 375x667-light-t100 | big | 43 | -22.1 / -30.2 | 0 | 1 | 20.9 / 12.8 | 0 |
| 375x667-light-t200 | routine | 62 | -41.1 / -49.2 | 0 | 34 | 20.9 / 12.8 | 0 |
| 375x667-light-t200 | task | 69 | -48.1 / -56.2 | 0 | 34 | 20.9 / 12.8 | 0 |
| 375x667-light-t200 | big | 80 | -59.1 / -67.2 | 0 | 34 | 20.9 / 12.8 | 0 |

`air` = the extra px above the heading and in each block gap (sheet padding − 20). Arrival (1.5 s) equals settled (4.5 s) for lift, air, clearance and cuts on all 120 runs (`probe.json`).

Side by side (844×390, 667×375, 1440×900) the summary is a card beside the stage: no lift on either build, the figures
are not under it (`clear` is not applicable; `chaiShown` = 1 in the spec's sense). Unchanged logic (`rest = 0` path).

### 4.3 Hierarchy (375×667 light @100; milestone day `atRisk` from `probe-try/` — control :5430 vs `23e7494` on :5422 —
and big day from `captures/`)

| Element | Control `b377c62` | AFTER |
|---|---|---|
| Minutes heading | 28px / 600 Fredoka, 335×30.8 (10 317 px²) | same |
| Tea time | 335×60 button (face 19 600 px² at 390), sky fill `rgb(52,148,209)`, fill contrast vs sheet **3.28**, label 21px / 700 | same |
| Milestone highlight card | 335×**73.8** (**24 711 px²**, > Tea time), title **17px / 700** (heavier than the heading), art 42 px, note 14px on 2 lines; fill contrast 1.11, edge 1.35 | 335×**50** (**16 750 px²**, < Tea time), title **16px / 600**, art 34 px, note 13px on 1 line; fill 1.11, edge 1.35 (still the one honey card) |
| Unlock card (K03 close-up) | 350×133.8 at 390, title 17px / 600 | unchanged |
| Compact pill | 131×38, 15px / 700 Nunito, fill 1.07 | unchanged |

### 4.4 Copy: "streak" occurrences

Counted in the summary region's textContent (includes the closed arithmetic and the sr-only lines), visible text,
sr-only text, reachable aria-labels and the live announcement. Control: routine 1, task 1, big 5 (visible "Badge: Warm
Streak II"; sr "…keeps your streak warm…", "Warm streak: 7 days.", "New badge: Warm Streak."; arithmetic "Your 7-day
streak stays warm…"), milestone day 3 ("…keeps your streak warm", "Warm streak: 6 days.", arithmetic). AFTER: routine 0,
task 0, milestone day 0, big 2 — both the badge's catalogue name (pill + "New badge: Warm Streak."); the summary's own
words: **0** everywhere (§4.1 last column; `rank.test.ts` "words" test; spec "warm days, never streak").

## 5. Suites

All logs in `P/suites/`. Browser suites under the slot gate (lane P), against my dev server :5422 (`tests` + `src` of
the named commit); no skipped test except the two by design noted.

| Suite | Commit | Result |
|---|---|---|
| `npx tsc --noEmit` | `a4f1773` | exit 0 (`tsc.log`) |
| `npx vitest run` | `a4f1773` | 28 files, **278/278** (`vitest.log`; was 275 on base: +3 in `rank.test.ts`) |
| chromium, touched specs: `w2-summary`, `whistle`, `a11y` (all of a11y, incl. the summary/summary-details states, the keyboard journey and the summary-footer toast tests), `--workers=1` | `23e7494` | **36/37**; the 1 failure is my new hierarchy test's own bug (it read Tea time's fill on the `<button>`, which is transparent; the Button paints it on its face) → fixed in `a4f1773` (spec only), passes in the full run below (`chromium-touched.log`) |
| chromium, full, `--workers=2` (gate `--n 2`) | `a4f1773` | **103/105**, 0 skipped; w2-summary **18/18**, whistle **8/8**, a11y **11/11**. The 2 failures: `break-reach.spec.ts` "200 % text, 375×667 light / 390×844 dark: Break's over with a carried task …" — `wheel: /^Put the kettle on/ brought wholly into view` (centre y 730 / 838) (`chromium-full-w2.log`) |
| ↳ reruns of those 3 break-reach tests, control `b377c62` dev :5410 vs mine :5422, ×2 each | — | **identical**: control 1/3 and 1/3, mine 1/3 and 1/3, same two tests, same messages and numbers → pre-existing on `b377c62`, not P (Break's over is FocusScreen/T's screen; P changes nothing there) (`rerun-break-reach-*.log`) |
| timer-harness + timer-app, `--workers=1` | `a4f1773` | **26 passed, 2 skipped** by design (`timer.spec.ts:295` "infra is exercised in the harness; screens bind their own keys", `:439` "render counter lives in the harness", both skipped in timer-app) (`timer.log`) |
| pwa (build + preview on :5432, after my preview was stopped) | `a4f1773` | **3/3** (`pwa.log`) |

Not run: the new spec tests against the control build (they would fail there on the figure-clearance and copy
assertions; the same facts are measured control-first in §4).

## 6. Captures (full size, same session)

`P/captures/{BEFORE,AFTER}/<W>x<H>-<theme>-t<text>/` — `08-summary-routine*`, `04-summary-task*`, `09-summary-bigday*`:
`.png` arrival (1.5 s), `-settled.png` (4.5 s), `-end.png` (arithmetic opened by a click, wheel to the end),
`-full.png` only where it differs from `-settled` (the page itself does not scroll on these screens; identical
full-page frames were removed to stay under ~100 MB), `probe.json` (all numbers). Extra AFTER days on dev `:5422`
(same src): `probe-try/DEV2/` (K02 task day `12-…`, milestone day `13-…`, 375/390 × 100/200), control 5-day probe
`probe-try/BEFORE/375x667-light-t100/`.

## 7. Residuals

| # | Item | Class | Note |
|---|---|---|---|
| P-1 | Badge catalogue name "Warm Streak" still shows on a big day (pill + announcement) | OWNER DECISION | data shared with Stats/toasts/art (`progress/badges.ts`, not P's); proposal in §2.3 |
| P-2 | On stacked phones the highlight/unlock is less often whole on arrival than in round 1: 375×667 task day (an unlock day with a task) — the unlock card starts at the fold (its honey edge peeks); 375×667 @200 — only the minutes are above the fold (air 34 px), the subline and everything else a scroll away | ACCEPTED TRADE-OFF (by the brief's priority) | round 1 showed them by lifting the sheet 62–111 px over Chai and the kettle; R-2 already accepted a highlight a scroll away at 200 %. No fact hidden; the fold is clean; the heading whole |
| P-3 | Air: up to 15 px (375 @100) / 34 px (375 @200) more above the heading and between blocks on some openings | ACCEPTED | even spacing, no blank band; at 200 % proportional to the doubled text |
| P-4 | `break-reach.spec.ts:179` (Break's over, 200 % text) failed 2/105 in the full run | PRE-EXISTING (follow-up, Break's over owner) | identical on control `b377c62` (2/2 reruns each side, same numbers): "Put the kettle on" not brought wholly into view by the wheel at 200 % on Break's over; not a summary path; P touches nothing there |
| P-5 | R-1 (unlock picture under the fold at 844×390 @100), R-6 (3D close-up load time) from round 1 | unchanged | side by side not touched |

## 8. The pair that shows the change

375×667 light @100, task day: BEFORE `P/captures/BEFORE/375x667-light-t100/04-summary-task-settled.png` (sheet lifted
85 px, kettle box covered by 72 px, Chai to the chest) → AFTER `P/captures/AFTER/375x667-light-t100/04-summary-task-settled.png`
(Chai and the kettle whole, 11.8 px clear; heading, task and choices whole; the unlock card's edge at the fold).
Milestone day (hierarchy + copy): `P/probe-try/BEFORE/375x667-light-t100/13-summary-best-settled.png` →
`P/probe-try/DEV2/375x667-light-t100/13-summary-best-settled.png`.

## 9. Status

**READY FOR REVIEW.** All deliverables are in place: the three changes (§2), control-first raw measurements (§4), the
suites (§5) and same-session BEFORE/AFTER full-size captures for the routine, task and big day at all 20 configurations
(§6). Budget note: finished about 70 min past the 2 h budget, because the three browser slots were shared with the
orchestrator's BEFORE run and lanes C and T. No servers or browsers of mine are left running.
