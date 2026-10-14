# W3R1 gate record (orchestrator)

## Maker N: Chai night readability. GATE PASSED, 2026-10-14 11:55 UTC

| Item | Result |
|---|---|
| Packet | `/home/user/wt/w5n/kettle/review/product-excellence/contracts/W3R1/N-READY-FOR-REVIEW.md`. Evidence: `…/W3R1/N/` (20 MB) |
| Revision | `pe/w3-chai-night@4168428`, kettle/src `9699774`. Code commits `121f011`, `43b10f2`, `76144b4` |
| Files (ownership OK) | `src/scene/engine/{Engine.ts, chai.ts, chaiModel.ts, chaiModel.test.ts, palette.ts, palette.test.ts}`, `tests/chai3d.spec.ts`. Nothing outside N's files |
| Checks | No secrets. No model identifiers outside the standard trailers. No file > 47 MB |
| **Trial** | **`46f33e2`** = integration `1af69d7`+ + `4168428`, worktree `/home/user/wt/w5tr-n`, src `9699774`. tsc 0, build OK. Dev **:5524** (served scene files verified), preview **:5534** |
| The maker's claims (to verify) | **Change:** the fur's self-fill by hour, ×1 day, ×2.8 dusk, ×3.2 night; eyes, nose, mug and yuzu untouched. **Contrast eyes/nose:** evening 2.26/1.93 → 3.85/3.14, night 2.01/1.79 → 3.99/3.27 (day 4.58/3.32). **Day close-up:** 0 px diff. **Low tier:** draw calls, triangles, textures and programs identical; frame time 200 → 209 ms (order not swapped, unproven). **Suites:** vitest 293/293; chai3d + w2-room 16/17, then 17/17 |
| Maker's gaps | Dark theme, 390×844 frames, the unlock pair, order-swapped frame time, the procedural Chai's numbers. Maker N's servers are stopped |
| Archive | `archive/pe-w3-chai-night-4168428.incremental.bundle` |

## Maker G: Settings and shared controls (I11). GATE PASSED, 2026-10-14 12:25 UTC

| Item | Result |
|---|---|
| Packet | `/home/user/wt/w5g/kettle/review/product-excellence/contracts/W3R1/G-READY-FOR-REVIEW.md`. Evidence: `…/W3R1/G/` (18 MB) |
| Revision | `pe/w3-settings@808421d` (packet); app code and spec last changed at `876bf18`; kettle/src `6b14238` |
| Files (ownership OK) | `src/screens/settings/{DataSection.tsx, SettingsScreen.tsx}`, `src/styles/{global.css, tokens.css}`, `src/ui/{Card, Chip, ListRow, NumberStepper, SegmentedControl, Slider, TextField, Toggle}.module.css`, `src/ui/{ListRow.tsx, Gallery.tsx}`, `tests/w3-settings.spec.ts`. All are G's |
| Checks | No secrets. No model identifiers outside the standard trailers. No file > 47 MB |
| **Trial** | **`3d91793`** = integration + `808421d`, worktree `/home/user/wt/w5tr-g`, src `6b14238`. tsc 0, build OK. Dev **:5523** (served files verified), preview **:5533** |
| The maker's claims (to verify) | **Tokens:** new `--focus-w`, `--focus-gap`, `--focus-gap-inset` and `--disabled-opacity` (no colour or font change). **States:** one disabled opacity (0.5); the TextField focus is now an outline; a pressed state on segments; selected segments and chips survive forced colours; a blocked row has no hover or press. **Copy:** honest Sound/Nudges/Keep awake/Haptics lines; warm-days wording. **Tests:** `w3-settings` 9/9 fails on base and 9/9 passes on the fix; 52/52 on the specs touching G's controls |
| Maker's open items | Full chromium was stopped at 12:18. `notice-strip` had **2 failures at 200 %** (375×667 dark, 844×390 light), timeout or real unknown. integrity, summary-notice, toast-room, statusbar, w2-summary, w2-room and chai3d were not run. **Cross-owner (F):** `Toast.module.css` uses the non-token `var(--focus, var(--sky))` |
| Archive | `archive/pe-w3-settings-808421d.incremental.bundle` |

## Maker S: Stats and History (I12), F-T2-4, the backup test. GATE PASSED, 2026-10-14 12:58 UTC

| Item | Result |
|---|---|
| Packet | `/home/user/wt/w5s/kettle/review/product-excellence/contracts/W3R1/S-READY-FOR-REVIEW.md`. Evidence: `…/W3R1/S/` (23 MB) |
| Revision | `pe/w3-stats@344069c`; code last changed at `8158134`; kettle/src `20a4698` |
| Files (ownership OK) | `src/screens/stats/{Glance.tsx (new), History.tsx, StatsScreen.tsx, StreakCard.tsx, format.ts, format.test.ts, stats.module.css}`, `src/ui/{Sheet.tsx, Sheet.module.css, Stat.tsx}`, `src/progress/dst.test.ts`, `tests/{integrity.spec.ts, w3-stats.spec.ts}`. All are S's |
| Test change check | `integrity.spec.ts` `profilePills`: now reads the Profile card only, after the route settles (`[data-route-leaving]` exists in `App.tsx`) and once the card shows the stored leaves total. It waits on real state; the before/after comparison is kept. The lead to judge |
| Checks | No secrets. No model identifiers outside the standard trailers. No file > 47 MB |
| **Trial** | **`c7a6b8f`** = integration + `344069c`, worktree `/home/user/wt/w5tr-s`, src `20a4698`. tsc 0, build OK. Dev **:5522** (served files verified), preview **:5532** |
| The maker's claims (to verify) | **F-T2-4:** a sheet only handles Tab from inside itself, which fixes Tab frozen in the stacked "Delete this brew?"; `data-tight` keeps the footer pinned on short screens, also fixing Settings "Start fresh?" and the End sheet at 375×667 @200. **Stats:** a "Today / Last 7 days" glance (rolling week); minutes rounded down, as the engine counts them; warm-days wording, with the Tea Cozy line only when true. **Suites:** vitest 292/292; integrity 25/25; backup test 5/5 under `--workers=2`; `w3-stats` 21/21 (17 fail on base) |
| Maker's gaps | Full BEFORE/AFTER only at 375×667; 390×844, 844×390 and 1440 have probe shots only. Full chromium suite not run. **Cross-owner:** F, the badge description (`badges.ts`) and the summary rounding minutes to the nearest; G, keep the Profile card's `aria-label` and pills. **Lead:** a rolling "Last 7 days" vs a calendar week |
| Archive | `archive/pe-w3-stats-344069c.incremental.bundle` |

## Maker F: notices polish, warm-days wording, I13. GATE PASSED, 2026-10-14 13:00 UTC

| Item | Result |
|---|---|
| Packet | `/home/user/wt/w5f/kettle/review/product-excellence/contracts/W3R1/F-READY-FOR-REVIEW.md`. Evidence: `…/W3R1/F/` (35 MB) |
| Revision | `pe/w3-notices-polish@5ee3e7c`; code last changed at `9f30a9b`; kettle/src `0acce1a` |
| Files (ownership OK) | `src/ui/Toast.tsx`, `src/app/Rail.tsx`, `src/screens/home/{StatusBar.tsx, chai.ts, chai.test.ts, useHomeData.ts, warm.ts (new), warm.test.ts (new)}`, `src/screens/focus/{FocusScreen.tsx, FocusScreen.module.css, parts/EndSheet.tsx}`, `src/screens/done/{summary.ts, rank.test.ts}`, `src/progress/{badges.ts, badges.test.ts, engine.test.ts}`, `tests/{notice-strip.spec.ts, w3-notices.spec.ts, w3-notices-load.spec.ts}`. All are F's |
| Checks | No secrets. No model identifiers outside the standard trailers. No file > 47 MB |
| **Trial** | **`e3b9eac`** = integration + `5ee3e7c`, worktree `/home/user/wt/w5tr-f`, src `0acce1a`. tsc 0, build OK. Dev **:5521** (verified), preview **:5531** |
| The maker's claims (to verify) | **F-T2-1:** a leaving notice keeps its room (an empty band) until a new screen or the page is hidden. Changes with nobody touching wait for a fresh frame and no pending input. On the session panel the strip closes if the notice holds controls past the edge. **F-T2-8:** the landscape top bar wraps at 200 %. **N-1:** the spec asserts the task before Start. **Wording and I13:** a new `home/warm.ts`; Today, rail, Chai, status sheet, badge line, summary notes and End's line. **Controls:** the new `w3-notices` fails 4/5 on base; under CPU ×6 base reproduces the tap on the tag group 2/4, the fix 4/4. **Suites:** vitest 297/297; notice-strip 25/25 (src `2d5719e`); a combined run of 11 specs 146/147 (src `3027de2`) |
| Maker's gaps | The break-reach re-run on the final src. Two clean 1440 @200 reduced passes in a row (1/2; the failure was N-2, History Undo 111 px). The 1440 AFTER shots (rail). The full chromium suite. **Trade-offs for Vibei:** the kept band of 57–97 px; a notice arriving at rest still pushes content. **Follow-ups:** F-T2-2, N-3. **Cross-owner:** S, N-2 (`History.tsx` focus scroll) |
| Archive | `archive/pe-w3-notices-polish-5ee3e7c.incremental.bundle` |

## Combined trial (Lane R regression and cross-effects)

**`e478604`** = integration + F (`5ee3e7c`) + S (`344069c`) + G (`808421d`) + N (`4168428`): no conflicts. Worktree `/home/user/wt/w5tr-all`, src `07c26ff`, tests `b0ed48b`. tsc 0. vitest **302/302** (290 + F 7 + S 2 + N 3). Build OK. Dev **:5520** (verified), preview **:5530**. Archive: `archive/w3r1-trials-e478604.incremental.bundle`.
