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

## Verdicts so far (2026-10-14 17:05 UTC)

- **N: APPROVE** (LEAD-4, final; confirmed by LEAD-5 at `6e5441f`). The eye-contrast choice is "vb's call" (§4, row O-2).
- **G: REJECT** (LEAD-5, `7848a9e`). G-D1…G-D4 are text-only and match Vibei's §4. The fix round runs **17:05–18:35 UTC** on `pe/w3-settings` from `808421d`; the packet is `CHECKER-W3R1-G.md` §6.
  - **C-1:** F's `tests/whistle.spec.ts:203` asserts the old locked-phone sentence. It changes in F's fix round, or at merge by the orchestrator (one line of test text).
  - **C-2:** `docs/REAL_DEVICE_CHECKLIST.md` rows 2.3 and 8.5 are reworded at merge.

## Maker G fix round. GATE PASSED, 2026-10-14 17:52 UTC

| Item | Result |
|---|---|
| Hand-back | 17:49 UTC (window 17:05–18:35). Packet `/home/user/wt/w5g/kettle/review/product-excellence/contracts/W3R1/G-FIX-READY.md`; evidence `…/W3R1/G/fix/` (4.7 MB) |
| Revision | `pe/w3-settings@7f95c18`; code `0320211`; kettle/src `a53263f` |
| Scope (checked) | `git diff 808421d 7f95c18 -- kettle/src kettle/tests` touches only `SettingsScreen.tsx` (4 string literals: `:134` Sounds, `:187` Nudges On, `:233` Keep awake (optional, allowed), `:240` Haptics) and `tests/w3-settings.spec.ts`. No CSS. `:182` unchanged |
| **Trial** | **`c8b849e`** = integration + `7f95c18`, worktree `/home/user/wt/w5tr-g2`, src `a53263f`. tsc 0, build OK. Dev **:5525** (verified), preview **:5535** |
| C-1 key sentence | `If Kettle is closed or your phone has paused it by then, no nudge comes.` (for F's `whistle.spec.ts:203`) |
| Archive | `archive/pe-w3-settings-fix-7f95c18.incremental.bundle`, `archive/w3r1-trial-c8b849e.incremental.bundle` |

## Merges (2026-10-14 ~18:00 UTC)

- **N: APPROVE → merged as `3faaf94`** (`pe/w3-chai-night@4168428`). The merged kettle/src `9699774` equals trial `46f33e2`'s. Eye contrast: vb's call, open (two numbers in `palette.ts` if Vibei wants it changed).
- **G: APPROVE (final, after the fix round) → merged as `25b5e26`** (`pe/w3-settings@7f95c18`). Every file G touched is byte-identical to `7f95c18`'s, and the merged change set is exactly N ∪ G. kettle/src is `c264faf`.
- **C-2:** `docs/REAL_DEVICE_CHECKLIST.md` rows 2.3 and 8.5 were reworded to match G's nudge line (`a859d86`, orchestrator, as the verdict assigned).
- **Check on `a859d86`:** tsc 0; vitest **293/293** (290 + N's 3).
- **Known red until F's fix lands:** `tests/whistle.spec.ts:203` (F's file) still asserts the old "may hold" sentence (C-1). It goes in F's fix packet; if F does not merge, the orchestrator changes that one line, as CHECKER-W3R1-G.md allows.

## F: REJECT (LEAD-5, `7b2b081`). Fix round 18:16–19:46 UTC

- **Defects:**
  - **F-D1:** the band never collapses on idle (Vibei §3).
  - **F-D2:** the F-T2-8 wrap pushes the session controls 17 px lower at 200 % landscape.
  - **F-D3:** the StatusBar accessible name.
  - **C-1:** `whistle.spec.ts:203`.
- The packet is `CHECKER-W3R1-F.md` §6.
- The fix trial will be the integration branch (N + G + docs) + F's fix.

## S: REJECT (LEAD-5, `d3033de`). Fix round 18:19–19:49 UTC

- **Defect S-D1:** the "Warmest run" tile is cut at 200 %. Before the fonts load, the page widens to 408/401 px, which is the cause of the combined trial's `w3-stats:98` failure.
- The packet is `CHECKER-W3R1-S.md` §6.
- Vibei §2 is confirmed: exactly "Last 7 days"; the calendar logic is identical across the week boundary.

## Maker S fix round. GATE PASSED, 2026-10-14 18:47 UTC

| Item | Result |
|---|---|
| Hand-back | ≈18:43 UTC (window 18:19–19:49). Packet `/home/user/wt/w5s/kettle/review/product-excellence/contracts/W3R1/S-FIX-READY.md`; evidence `…/W3R1/S/fix/` (1 MB) |
| Revision | `pe/w3-stats@697c1eb`; code `0d240b6` (CSS) and `1d899b3` (spec); kettle/src `6a020d9` |
| Scope (checked) | `git diff 344069c 697c1eb -- kettle/src kettle/tests` touches only `stats.module.css` (one `@container (max-width: 21rem)` block: tiles one a row at large text) and `tests/w3-stats.spec.ts` |
| **Fix trial** | **`f63286e`** = integration `283ae93` (N + G + docs) + `697c1eb`, worktree `/home/user/wt/w5tr-s2`, src `db28295`. tsc 0, vitest **295/295**, build OK. Dev **:5526** (verified), preview **:5536** |
| Archive | `archive/pe-w3-stats-fix-697c1eb.incremental.bundle`, `archive/w3r1-trial-f63286e.incremental.bundle` |

## Cross-effects (LEAD-5, `CHECKER-W3R1-CROSS.md`, `4223062`)

**Result:** no proven combined-only effect.

| Item | Owner | Status / action |
|---|---|---|
| X-4 `w3-stats` Delete | S | Proven cause S-D1; closed in S's fix |
| X-2 G's pressed-segment test | G | Flaky 4/8. Test-only change assigned to Maker G at 18:58 UTC on `pe/w3r1-x2-segment-test` (worktree `w5g-x2`, from `4223062`; stop 19:30). LEAD-5 checks 8/8 on the merged tree; until then it is known-flaky |
| X-1 integrity I03 | test file S; surface: the unowned save-warning | Run ×10 with trace in the final regression |
| X-3 `w3-notices` room | F | Changes in F's fix round |

## S: APPROVE (final, LEAD-5 `1c241d3`) → merged as `0efca36` (2026-10-14 ~18:55 UTC)

`pe/w3-stats@697c1eb`. The merged kettle/src `db28295` and kettle/tests `0da133e` equal fix trial `f63286e`'s exactly. The integration branch now holds N, G (+ docs) and S.

## X-2 (G's pressed-segment test, test-only). GATE PASSED, 2026-10-14 19:00 UTC

| Item | Result |
|---|---|
| Revision | `pe/w3r1-x2-segment-test@7bb8540` (test change `9fb1aca`), from integration `4223062`. kettle/src unchanged |
| Scope | `tests/w3-settings.spec.ts` only (+6 / −2), plus `G-X2-READY.md` and logs `G/x2/` |
| **Trial** | **`7145f49`** = integration `8251a74` (N + G + S) + `7bb8540`, worktree `/home/user/wt/w5tr-x2`, src `db28295`. Dev **:5527** (verified) |
| Maker's result | That test 8/8 at `--workers=2` and 8/8 at `--workers=1` under load; fails on base by design; the whole `w3-settings` 10/10 |
| Archive | `archive/pe-w3r1-x2-segment-test-7bb8540.incremental.bundle` |

## X-2: APPROVE (LEAD-5 `8350fb3`; 8/8 under load) → merged as `60fdb7e` (2026-10-14 ~19:20 UTC)

The merged kettle/src `db28295` and kettle/tests `f071f53` equal trial `7145f49`'s. Lane run logs: `kettle/.gitignore` ignores `*.log`, so 149 lane logs under `W3R1/review/` are now kept as `.log.txt` copies (`c0d942b`).

## Maker F fix round. GATE PASSED, 2026-10-14 19:36 UTC

| Item | Result |
|---|---|
| Hand-back | ≈19:31 UTC (window 18:16–19:46). Packet `/home/user/wt/w5f/kettle/review/product-excellence/contracts/W3R1/F-FIX-READY.md`; evidence `…/W3R1/F/fix/` (the F folder is 59 MB) |
| Revision | `pe/w3-notices-polish@11a7ac6`; final code `58d1b88` (+ spec `cbc88ac`); kettle/src `27d83ac` |
| Scope (checked against §6) | `ui/Toast.tsx` (F-D1), `focus/FocusScreen.module.css` (F-D2: the wrap reverted), `home/StatusBar.tsx` (F-D3), `tests/whistle.spec.ts` (line 203 only, C-1), `tests/w3-notices.spec.ts`, new `tests/w3-notices-idle.spec.ts`, `tests/notice-strip.spec.ts` (`press()` hardening). All allowed |
| **Fix trial** | **`1358e00`** = integration `8af9fcb` (N + G + S + X-2) + `11a7ac6`, worktree `/home/user/wt/w5tr-f2`, src `d533342`. tsc 0, vitest **302/302**, build OK. Dev **:5528** (verified), preview **:5538** |
| Maker's gaps | 1440 light @200 reduced ×3 gave 2/3 twice (one failure is N-2, S's History focus scroll; one is a server restart by someone else). `notice-strip` 25/25 and the owned specs ran on `14703f3`, one code commit before final. C-1 not provable on F's branch |
| Archive | `archive/pe-w3-notices-polish-fix-11a7ac6.incremental.bundle`, `archive/w3r1-trial-1358e00.incremental.bundle` |

## F: APPROVE (final, LEAD-5 `d73a3dc`) → merged as `2be3de1` (2026-10-14 20:18 UTC)

- `pe/w3-notices-polish@11a7ac6`. The merged kettle/src `d533342` and kettle/tests `f2fec9a` equal fix trial `1358e00`'s exactly.
- **All four makers are now merged:** N `3faaf94`, G `25b5e26` (+ docs `a859d86`), S `0efca36`, X-2 `60fdb7e`, F `2be3de1`.
- **X-11 (test-only, F's `notice-strip.spec.ts:292`):** assigned to Maker F at 20:20 UTC on `pe/w3r1-x11-strip-test` (worktree `w5f-x11`, from `2be3de1`; stop 21:00). LEAD-5 checks it 6/6.
- **Final regression:** started on `2be3de1` (worktree `/home/user/wt/w5-final`, dev :5540, preview :5550) by Lane R. `notice-strip.spec.ts` is held back until X-11 merges, then run on the final tree.

## X-11: not achieved (Maker F, 20:20–20:45 UTC); nothing merged

- `pe/w3r1-x11-strip-test@f0c84a5`, with its tests identical to `2be3de1` after the withdrawal.
- **Attempt 1:** 3/6. The failures were Mark done's tap landing on the tag group with `why: "idle"`: the F-D1 idle band collapsed between the spec's on-top check and its tap, which is a third signature.
- **Attempts 2–3:** timed out, undiagnosed.
- Note `F-X11-READY.md` in the worktree; archive `archive/pe-w3r1-x11-strip-test-f0c84a5.incremental.bundle`.
- **The final tree is `2be3de1`.** `notice-strip:292` at 1440 light @200 reduced is recorded as known flaky (X-11) in the final regression. LEAD-5 is asked for an outcome ruling.

## Maker Q Phase A (Vibei item 2: band idle 1.2 → 4 s). GATE PASSED, 2026-10-15 ~00:45 UTC

| Item | Result |
|---|---|
| Revision | `pe/w3r1-stability@04b1ad9` (code `61aec4b`), src `db6de7e`. Packet: `/home/user/wt/w5q/kettle/review/product-excellence/contracts/W3R1/Q-READY.md` (Phase A) |
| Scope | `src/ui/moment.ts`: new `BAND_IDLE_MS = 4000`, plus `atRest(now, quiet = QUIET_MS)` so existing callers are unchanged. `src/ui/Toast.tsx`: the band's give-back uses `BAND_IDLE_MS`, and the `QUIET_MS` import is removed. Tests: `w3-notices.spec.ts` and `w3-notices-idle.spec.ts` assert ≥ 4000 / ≤ 6500 ms. Nothing gives the room back "in answer to the next tap" |
| **Trial** | **`cf4a89c`** = integration (final `2be3de1`) + `04b1ad9`, worktree `/home/user/wt/w5tr-qa`, src `db6de7e`. tsc 0, vitest 302/302, build OK. Dev **:5546** (verified), preview **:5556** |
| The maker's suites | `w3-notices` + `w3-notices-idle` ×2: 42/42 (collapse at 4037–4125 ms); `notice-strip` 25/25; `toast-room` + `summary-notice` + `w2-home` 46/46 |

## Phase A: APPROVE (LEAD-5 `695f4ec`) → merged (see the next commit)

The merged src and tests equal trial `cf4a89c`'s. LEAD-5 on :5546:
- aimed taps 0/64 off target;
- `w3-notices` + idle 42/42 (collapse at 4026–4121 ms);
- `notice-strip` 23/25 at load 12, both failures X-11 signature (a) (the spec's wheel race; no band involved) and left to Phase B.

## Maker Q Phase B (Vibei item 3: test stability, plus F1). GATE PASSED, 2026-10-15 ~02:15 UTC

| Item | Result |
|---|---|
| Revision | `pe/w3r1-stability@01575cb`. **Phase B changes tests only**; src `db6de7e` is unchanged since Phase A (`61aec4b`) |
| Tests changed | `notice-strip.spec.ts` (X-11 `press()`: one wheel at a time and bounded, aim and tap in one input window, bounded reads, History row read after its focus scroll); `integrity.spec.ts` (I03/X-1 waits on real state: failed saves gone through, then the banner gone ≤ 3 s in page time); `w3-notices-load.spec.ts` (the control synced with `press()` and N-1; the per-frame logger opt-in, `W3_LOG=1`); `w2-room.spec.ts` (test budget 120 s for its own 45 s scene-ready bound) |
| **Trial** | **`d7f9126`** = integration (with Phase A) + `01575cb`, worktree `/home/user/wt/w5tr-qb`, src `db6de7e`, tests `0927568`. tsc 0, vitest 302/302, build OK. Dev **:5547** (verified), preview **:5557** |
| The maker's results | `:292` 1440 light @200 reduced **6/6** under load (2 workers + 4 burners); `notice-strip` 25/25; X-1 **10/10** under load; `w3-notices-load` 25/25 (`W3_LOAD=1`); `w2-room:167` 3/3 under load; `integrity` 25/25. **Cause of the 4-minute timeouts:** the History inline Undo (5 s) expired under load, and `locator.evaluate` without a timeout then waited for a vanished element until the 240 s test timeout |
| **F1, `integrity:309`** | **Product race, pre-existing.** `Composer.tsx:83–86` syncs the intention 150 ms after Today mounts → `store.ts:399 setIntention` → persist writes that tab's stale idle timer over the brew another tab just started; both tabs lose it. Reproduced 3/20 and 2/12 under load on the trial, and **1/20 on base `4d36939`**. No timer change made; the test is left as is. Note: `review/F1-ROOT-CAUSE.md` (copied from `…/W3R1/Q/F1-ROOT-CAUSE.md`). **Waiting on Vibei** |
| Archive | `archive/pe-w3r1-stability-01575cb.incremental.bundle` |

## Phase B: APPROVE (LEAD-5 `5efdb39`) → merged as `f2298d3` (2026-10-15 02:45 UTC)

- The merged src `db6de7e` and tests `0927568` equal trial `d7f9126`'s.
- **LEAD-5 under load (≈10.5):** `:292` 6/6; X-1 10/10; `w2-room:167` 3/3; `notice-strip` 25/25; `w3-notices-load` (`W3_LOAD=1`) 25/25. Nothing weakened (I03 is stricter). X-11 and X-1 are closed.
- **F1 (`integrity:309`):** LEAD-5 confirms a pre-existing product race, severity medium. A real finding (Vibei §0) to fix before the Final Product Boss, **waiting on Vibei's decision** (`review/F1-ROOT-CAUSE.md`).
- **Integration HEAD app code is now `f2298d3`** (src `db6de7e`).

## F1 fix (`integrity:309`, Vibei post-follow-up item 1). GATE PASSED, 2026-10-15 ~11:00 UTC

| Item | Result |
|---|---|
| Revision | `pe/w3r1-f1-intention@74138d3`; app code `9a41a1a` + `882233b`; src `e2041c1`. Packet `contracts/W3R1/F1FIX/F1FIX-READY.md` (committed through `d9c0dd7`) |
| Scope (checked) | `src/timer/store.ts`; new `src/timer/intentionRace.test.ts`; new `tests/w3-intention-race.spec.ts`. `Composer.tsx` untouched; `integrity.spec.ts` unchanged |
| **Trial** | **`986bda4`** = integration (app `f2298d3`) + `74138d3`, worktree `/home/user/wt/w6tr-x`, src `e2041c1`. tsc 0, vitest **309/309**, build OK. Dev **:5562** (verified, `store.ts` served), preview **:5572** |
| The maker's claims | Storage format unchanged: `4d36939`/`f2298d3` → fix and fix → `4d36939` round-trips 6/6, byte-identical. The vitest race test fails 4/7 on `4d36939` and `f2298d3`, passes 7/7 on the fix. The Playwright race test fails 3/3 on :5560 and :5478, passes 5/5 on the fix. `integrity:309` **20/20 ×2** under load (6 burners). Audit: `syncIdleLength` is the nearest relative (automatic, not reproduced), plus `rebase`; the rest fire on user action; `tick` re-reads. **Open:** a real edit in a tab whose storage copy is also behind can still overwrite; the robust guard belongs in `sync.ts`, out of scope |
| Archive | `archive/pe-w3r1-f1-intention-74138d3.incremental.bundle` |

## F1 fix: REJECT (LEAD-5 `5060817`, final for this pass). Fix round 10:32–12:02 UTC

- **Defect F1X-D1:** `syncIdleLength` is the same bug as F1 (a length change in another tab makes every idle tab write its whole stale timer). Packet: `CHECKER-W3R1-F1FIX.md` §6.
- **What verifies:**
  - the `setIntention` fix;
  - the race tests: vitest fails 4/7 on base and passes 7/7 on the fix; Playwright fails 3/3 on base and passes 5/5 on the fix;
  - compatibility, byte-identical;
  - `integrity:309` 20/20 under load (load 15);
  - Lane R: timer/pwa, integrity 25/25, notice suite 74/74.
- **Follow-ups** (for Vibei to schedule; a single `sync.ts` guard suggested):
  - `rebase`;
  - the action-triggered writers;
  - the maker's typed-edit-in-a-stale-tab case.
- **Lane R's label finding** (each composer mirrors shared words): a pre-existing FOLLOW-UP, a composer design question, low priority.

## F1 fix round (F1X-D1). GATE PASSED, 2026-10-15 ~11:02 UTC

| Item | Result |
|---|---|
| Revision | `pe/w3r1-f1-intention@10ecf2c` (fix-round commits `f7b66da`, `db31fbb`, `ac9f1e0`, `10ecf2c` on top of `74138d3`); src `b74e6b3`. Packet `contracts/W3R1/F1FIX/F1FIX-READY.md` §8 (committed through `90cc348`, logs `F1FIX/logs/r2/`) |
| Scope (checked, `74138d3..10ecf2c`) | `src/timer/store.ts` (+49/−28), `src/timer/intentionRace.test.ts` (+105), `tests/w3-intention-race.spec.ts` (+60/−5). Nothing else; `Composer.tsx` and `integrity.spec.ts` untouched |
| Change | `syncIdleLength`: the tab picking the length saves only phase/plannedMs/remainingMs over the same idle timer; a no-op writes nothing; a tab following another tab's length change (settings rehydrate, `persist.hasHydrated()` false) writes nothing |
| **Trial** | **`37de54a`** = integration (app `f2298d3`) + `10ecf2c`, worktree `/home/user/wt/w6tr-x2`, src `b74e6b3`, tests `5aa1d48`. tsc 0, vitest **314/314**, build OK. Dev **:5563** (verified, `store.ts` served), preview **:5573** (200). Old trial servers :5561/:5562/:5572 stopped |
| The maker's claims | Vitest F1X-D1 case fails on `4d36939`, `f2298d3`, `74138d3`, `f7b66da`; 12/12 on the fix. Browser F1X-D1 case fails 3/3 on :5560, :5562, :5478; passes 3/3 on the fix. Earlier 7 race tests pass; vitest 314/314. Compatibility base↔fix and integration→fix 2/2 each, byte-identical. `integrity:309` ×20 under load (2 workers + 6 burners) 20/20; race file 10/10 on fix, fails 6/6 on :5560. `integrity` 25/25, `w2-home` 18/18, timer 26 + 2 skipped |
| Archive | `archive/pe-w3r1-f1-intention-fix-10ecf2c.incremental.bundle` (requires `74138d3`) |
| Next | LEAD-5 final F1FIX verdict on trial :5563 (its ◆ checks from `CHECKER-W3R1-F1FIX.md` §6). Merge only on APPROVE |
