# I04 integration fix (status bar, toasts at large text, break-over) · CHECKER r5

**Verdict: REJECT**

- **Reviewed commit:** `33a72e6c298ef3959a08d7a7dae6a7ffb61093ca` (branch `pe/w1-fix-m2`, "I04 INTEGRATION FIX READY FOR REVIEW (r5)").
  `33a72e6:kettle/src` = `8d4a9790c3032b253be8c67c14a85b68c2fec06a` (checked). Code in `c9c263a` + `371f999`, tests in `f8997d2`;
  `33a72e6` adds evidence only. Whole shipping diff reviewed: `git diff 1bec1a8 33a72e6 -- kettle/src kettle/tests` (r1–r5:
  `StatusBar.tsx`, `Home.module.css`, `Toast.module.css`, `FocusScreen.tsx/.module.css`, `statusbar.spec.ts`, `toast-room.spec.ts`,
  `a11y.spec.ts`, `a11y-probes.mjs`).
- **Trial merge (what will ship):** `20671eb` (src `b38ad5e527ce67a3237e51c640aabd0edf9b1f9e`) = integration `bc5cfaa` + M1
  `pe/w1-fix@3f00b57` + `33a72e6`. Checked: `flow.ts`, `Toast.tsx`, `integrity.spec.ts` byte-identical to `3f00b57`; all nine M2 files
  byte-identical to `33a72e6`; the trial src tree equals the maker's trial `929576d`; `git diff bc5cfaa 20671eb` touches only those files plus
  M1's `docs/areas/timer.md`. **The defect below reproduces on the trial merge.**
- **BEFORE:** integration `bc5cfaa` (app `0d58c5e`, src `1fc4a1b`, worktree `/home/user/wt/chk-r5-base`); baseline `8f1044a` and r4
  `adec1a2` / r4 trial `1f1558e` as scratch worktrees (removed afterwards); M1 alone `/home/user/wt/w1fix` (`3f00b57`) served read-only.
- **Checker:** independent; I did not build this and did not review r1–r4. No application code, tests or maker files edited; nothing
  committed. All worktrees clean at the end (the pwa spec's `test-results/pwa-dist` and its orphaned preview on 5245 removed/stopped).
  Scratch: `/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/chk-r5/` (`$S`; probes `$S/probes/`,
  logs `$S/logs/`). Vite servers used scratch configs (repo config + private dep cache, no HMR, symlinked `node_modules` on the allow
  list): dev 5215 (trial) / 5216 (r4 trial, M1 alone, as needed) / 5217 (base), Playwright 5236 (commit) / 5237 (adec1a2, r4 trial) /
  5235+5245 (trial), production previews 5228 / 5229. All stopped by PID. 4 CPUs, Chromium headless shell, CPU SwiftShader, emulated
  viewports. Runs on 2026-10-10, 07:00–09:30 UTC.
- Note on method: a first commit run let Playwright start its own `tests/e2e.vite.config.ts` server; with the symlinked
  `node_modules` it could not serve the fonts ("outside of Vite serving allow list"), so I stopped it (`$S/logs/e2e-head-ABORTED-fallbackfonts.txt`)
  and re-ran every suite against my scratch-config server on the Playwright port (real fonts).

## Short version

r5 fixes what r4 rejected in the cases the r4 Checker measured: the status bar no longer widens the page while it measures (100 live-resize
sequences at 150–200 %, final scale 1 every time; the new spec still catches the zoom on r4 `adec1a2` and on the r4 trial), and with real wheel and touch input the
storage-full warning can now be read to its end and the older toasts revealed (R4-D1 matrix: 57 of 64 real-input runs clean as
recorded; of the other 7, four are not product defects — explained below — and three are R5-D1). D1, R2-D1, D2, D4, the 100 % layout, M1's approved behaviour and the protected visuals all hold, and the
new tests are real and fail on r4.

One defect remains, in the exact R4-D1 retest state (End after 12 min with a level-up, storage full: three toasts):

- **R5-D1:** when an older toast leaves (its 3.2 s timer runs out) while the person is scrolling the toast list, or just after they
  scrolled it back down, Chromium re-anchors the reversed scroll list and the pinned warning's layout box lands 7–47 px **below its room,
  over "Put the kettle on"**. M1's hold rule (which measures that box) then **takes the warning away and re-shows it** with the list and
  the warning's own scroll reset — the R4-D1 symptom by another path. Reproduced with fully real input and no synthetic events at
  375×667 @200 % (light 4/8, dark 4/6 natural sequences) and 844×390 @200 % (2/7), in the maker-style matrix (3 of 12 three-toast wheel
  runs), and in a targeted wheel sequence (11 of 13 runs). The packet's claim "at every scroll offset its drawn box stays inside the room"
  does not hold. The maker's evidence and `toast-room.spec.ts` hold every toast's timer on every frame, so an older toast never leaves
  during their runs.

## What I ran (all re-run by me)

| Command / probe | Result | Log / output |
|---|---|---|
| commit `npx tsc --noEmit --pretty false` / `npx vitest run` | exit 0 / 26 files **265/265** | `$S/logs/tsc-head.txt`, `vitest-head.txt` |
| commit `KETTLE_PORT=5236 KETTLE_PWA_PORT=5246 npx playwright test --project=chromium tests/a11y.spec.ts tests/statusbar.spec.ts tests/toast-room.spec.ts tests/whistle.spec.ts --workers=2` | **32/32 passed** (7.4 min) | `$S/logs/e2e-head.txt` |
| New tests (`toast-room.spec.ts` ×4 + statusbar "rapid live resizes" ×2) from my worktree against **r4 `adec1a2`** (5237) | **6/6 fail**: zoom left at ×1.288 and ×2.376; warning over the dock in 241 / 1317 / 837 / 1339 frames | `$S/logs/newtests-on-adec1a2.txt` |
| Same against the **r4 trial `1f1558e`** (5237) | **6/6 fail**: ×1.288 / ×1.515; 391 / 532 / 399 / 458 frames without the warning | `$S/logs/newtests-on-r4trial-1f1558e.txt` |
| trial tsc / vitest | exit 0 / **265/265** | `$S/logs/tsc-trial.txt`, `vitest-trial.txt` |
| trial `KETTLE_PORT=5235 KETTLE_PWA_PORT=5245 npx playwright test --project=chromium tests/integrity.spec.ts tests/a11y.spec.ts tests/statusbar.spec.ts tests/toast-room.spec.ts tests/whistle.spec.ts --workers=2` | **60/60 passed** (11.4 min) | `$S/logs/e2e-trial.txt` |
| trial `… --project=timer-harness --project=timer-app --project=pwa --workers=2` | **29 passed, 2 skipped** (the two harness-only timer-app tests, by design) | `$S/logs/e2e-trial-timer-pwa.txt` |
| R4-D1 real-input matrix `readscroll.mjs` (new; real `mouse.wheel` 20 px or CDP touch drags; per-frame recorder; read the warning to its end, scroll up past its opening to the oldest toast, read older toasts, rest 2.3 s at the top, scroll back down, rest 2.3 s, then tap/click "Save backup") on trial: 375×667 @200, 667×375 & 844×390 @150/200, both themes × alone / End < 1 min / End after 12 min + level-up × wheel / touch; 568×320 @100 three-stack | **57/64 clean as recorded**; the 7 others: 3 × R5-D1, 2 × probe step limit (11/11 lines on re-run), 2 × an older toast timing out at the top (benign) | `$S/logs/rs-A.txt`, `rs-B.txt`, `$S/rs/` |
| R5-D1 isolation: `natural.mjs` (no synthetic events at all), `race.mjs`, `expire.mjs`, `olderleave.mjs` | see R5-D1 | `$S/logs/r5d1-natural-summary.txt`, `r5d1-race-summary.txt`, `$S/race/`, `$S/natural/` |
| 390×844 and 1440×900 @100/150/200 %, both themes, three-stack (wheel) + 390 @200 alone/End<1 min (touch) | **14/14 clean**; no list scroll needed; every line read; "Save backup" hit-tests and downloads | `$S/logs/rs-big.txt` |
| Coarse wheel notches 53 / 100 px at 667×375 @200 % (End<1 min, three-stack) | see disclosures | `$S/rscoarse/` |
| R4-D2 `zoomr5.mjs` (bounce, 414↔376 drag ×3, 2 px/16 ms and 1 px/no-wait drags, four zero-wait rotations; per-frame layout width, bar inline-style check) at 200/150 % × both themes × 3 reps, + 5 more reps of rotations/bounce at 150/175 % | **100/100 final scale 1**, vv width = innerWidth, no overflow; 0 frames with the measuring style left on the bar | `$S/logs/zoom-trial*.txt`, `$S/zoom-*.jsonl` |
| D1/R2-D1 `d1.mjs` (r4 Checker's probe): 16 sequences × 3 reps × both themes, 100 %, 2,296 leaves | **0 failures / 96**; all 32 end states identical to the r4 trial | `$S/logs/d1-trial.txt` |
| D2 `d2.mjs`: 360/375/390 × 100/150/175/200 % × 9 leaf totals + reload × both themes | **216/216 clean**; all 240 cells geometry-identical to the r4 Checker's `1f1558e` run (the 24 "reload lost the total" lines are a probe artefact: `setState({leaves})` is not persisted); at 100 % vs base `0d58c5e`: 24 identical, 36 = the intended wrap → one tight row | `$S/logs/d2-trial.txt`, `d2-base100.txt` |
| D4 `d4.mjs` on trial: 375/390/1440 × both themes × 100/200 % × 0–3 toasts + taps (Mark / start / leave) | **80/80 cases clean** (48 Mark-it-done contexts × toasts + 32 start/leave), **20/20 real taps worked** | `$S/logs/d4-trial.txt`, `$S/d4/` |
| M1 behaviour `m1.mjs` on trial (6 configs × 100/200 %) and on M1 alone (5 configs) | same classes and magnitudes on both (see M1 section) | `$S/logs/m1-trial.txt`, `$S/m1alone/` |
| M1's `contracts/I03/capture-storage-full.mjs` on trial, 6 configs | **59/60 states identical** to M1's AFTER; the 60th (1440 dark s4a) hit the known desktop entry gap and was identical on 2/2 re-runs | `$S/m1caps/`, `$S/m1caps-re*/` |
| Load CLS `clsr5.mjs` on production builds (`vite build` into scratch) of baseline `8f1044a`, base `0d58c5e`, r4 `adec1a2` and trial, previews 5228/5229, 390×844 & 375×667 × 100/200 % × normal / +2.5 s fonts × 3 cold loads | see CLS decision | `$S/cls.jsonl`, `$S/logs/cls-*.txt` |
| Captures `node review/product-excellence/tools/capture.mjs --base http://localhost:5215 --out $S/caps/<cfg> --w W --h H --dpr N --theme light|dark --only 01,01b,10` (390×844@2, 375×667@2, 1440×900@1, both themes) | revision `20671eb`, `errors: []`; 01/01b **0.000 %** vs M2's r5 AFTER on phones, ≤ 0.011 % at 1440 | `$S/caps/` |
| Keyboard reach `kbreach.mjs` (Tab to "Save backup", Enter) | 375/390 @200 %: reached after 16 Tabs, Enter downloads (r5 and r4 alike) | console |

## What I opened (Read tool, full size)

- **REFERENCE:** K01 `…/VISUAL_BENCHMARK_LIBRARY/assets/current/01-home.png`; K02 `…/assets/current/07-summary.png`; K04
  `…/assets/current/whistle-to-summary-phone-dark-reduced-motion-frames.jpg` (the brief's `assets/current/recordings/…-frames.jpg` does not
  exist; `recordings/` holds only the mp4s).
- **History:** `PROTOCOL.md`; master prompt §7–8; `MASTER_EVIDENCE_MATRIX.md` I04, I14; `PRESERVE_LIST.md`; `STATUS.md` (top checkpoint,
  verdict table, log); `contracts/I04/CHECKER-integration-fix-r1.md`, `-r2.md`, `-r4.md` (incl. traces and notes), `CHECKER-r1.md`;
  `contracts/I03/CHECKER-integration-fix-r1.md`; `integration/wave1/a11y-short-screen-2026-10-10/README.md`; the maker's packet r1–r5 and
  `r5/*.txt` logs; the r4 Checker's probes (copied, not edited).
- **BEFORE:** integrated `phone-375x667-light/01-home.png` (bar wrapped, greeting ~50 px lower) and `10-break-over.png`; baseline
  `phone-375x667-light/01-home.png`.
- **Maker AFTER (r5):** `after/phone-375x667-dark/01-home.png`, `after/desktop-1440x900-dark/01b-home-scrolled.png`;
  `realscroll/realscroll-375x667-t200-light-end1-wheel-after.png`, `-667x375-t200-light-end1-wheel-after.png`,
  `-375x667-t200-dark-end12lv-touch-after.png`.
- **M1 AFTER:** `/home/user/wt/w1fix/…/I03/captures/after-integration/phone-375x667-light/s4a-today-pending-warning.png` against my trial
  `$S/m1caps/phone-375x667-light/s4a-today-pending-warning.png` (same warning box and placement; only clock/date copy differs).
- **Mine (trial):** `$S/caps/phone-375x667-light/{01-home,01b-home-scrolled}.png`, `phone-375x667-dark/10-break-over.png`,
  `desktop-1440x900-light/01-home.png`; `$S/d4/d4-trial-375x667-light-t200-n2.png`, `d4-trial-1440x900-dark-t100-n2.png`;
  `$S/warnshots/ws-trial-375x667-dark-t200-end12lv-first.png`, `ws-trial-375x667-light-t200-end12lv-focus.png`;
  `$S/rsdbg/rs-dbg-375x667-light-t200-end1-wheel20-rest.png`; `$S/rs/rs-trial-667x375-light-t150-end1-wheel20-{top,rest}.png`;
  R5-D1 sequence `$S/race/race-shot-375x667-light-wheel-0-afterstep-{0-t6261,1-t6558,2-t7036}.png` and
  `race-shot-375x667-dark-wheel-0-afterstep.png`.

## Code review of the shipping diff

- **`StatusBar.tsx` measuring containment (r5).** `measuring(fn)` sets `contain: inline-size; overflow-x: clip` on the bar, keeps them
  only when the bar's `justify-content` is start/space-between and its left edge does not move, runs the measurement, and clears both in
  `finally`, synchronously, inside the same `fit` call. It is applied on every `fit` (loaded path and the fonts-loading "far too wide"
  path), i.e. on phones (`space-between`), tablets portrait and landscape phones (`flex-start`); desktop rows (`flex-end`) are measured as
  before. Nothing is painted with it: per-frame sampling over 100 resize sequences found **0 frames** with an inline style on the bar.
  It cannot clip visible content, and it does not change any decision: D2 240/240 cells and D1 32/32 end states are identical to r4,
  01/01b are pixel-identical to r3/r4/r5 AFTER, and 100 % differs from `0d58c5e` only where the wrapped bar became one tight row.
  No new listeners or observers; the r1–r3 listeners are all removed on unmount; no oscillation (0 attribute flaps in 96 D1 runs).
  Compatibility: older engines without `contain: inline-size` or `overflow: clip` fall back to r4's measurement (UNKNOWN, see below).
- **`Toast.module.css` (r5), short-room mode only.** Each toast is capped at `100cqh` (the region's height; `.live` is an inline-size
  container, so `cqh` resolves to the region) and scrolls its own message (`overflow-y: auto`, `align-items: safe center`, sticky
  action); the toast with an action is `position: sticky; bottom: 0` in the reversed list (z 1), older toasts over it (z 2), newer under
  it (z 0). At rest and during ordinary scrolling this works as claimed (warning first shown at its opening, scrollTop 0; every line
  reachable; "Save backup" in view). **But the pinned box is a sticky item in a reversed scroll box whose content changes**: when an older
  toast is removed while the list is scrolled, Chromium's scroll anchoring shifts `scrollTop` (e.g. +1 → −63) and the next scroll step
  leaves the warning's layout box below the scrollport (R5-D1). In a scratch experiment, injecting `overflow-anchor: none` on the list
  removed the take-away (0/6 natural, 0/3 targeted) but the box was still measured up to 9 px below the room in 3/6 runs, so anchoring is
  a trigger, not the whole cause.
- **Older toasts over the warning.** Works (z-order), and every older toast is readable; at rest nothing covers the warning (see
  disclosures). Focus ring of "Save backup": with the toast now a scroll box, the 3 px + 3 px ring can be clipped where the sticky action
  meets the toast's edge (polish).
- **`FocusScreen.*` (r4), `Home.module.css` (r1–r2):** unchanged since r4; re-verified (D4, D2).
- **Tests.** `statusbar.spec.ts` "rapid live resizes" is a real behaviour test (real viewport changes, `visualViewport.scale`), tracing
  off for timing; fails on r4, passes on r5. `toast-room.spec.ts` uses real wheel and CDP touch and records every frame — good — but its
  recorder dispatches `pointerenter` to **every toast on every frame**, so no older toast can time out during the test, and it only uses
  fine 20/40 px steps. That is why it cannot see R5-D1 (or the coarse-notch limit).

## Per-defect findings (trial `20671eb`)

| Defect | Finding |
|---|---|
| **D1** (re-fit after resize/rotation to 375×667, 100 %) | **PASS.** From 414×896, 667×375, 844×390, 390×844 (phone) and 1440×900, 800×900 (desktop window), both themes × 3: `tight`, one row, right edge 367, `scrollWidth = clientWidth = innerWidth = 375`, visual viewport 375 @ scale 1, tab bar bottom 667, greeting 64; back to 414 → `normal`. |
| **R2-D1** (narrowing without a box change) | **PASS.** 384×854 → 375×667, 380×800 → 375×667, 384×854 → 360×740; drags 414 → 375 at 1 px/20 ms and 2 px/16 ms; desktop windows 420 → 375 (1 px) and 500 → 375 (5 px); bounces; triple rotation: 0/96 failures, 0 flaps, identical to r4. |
| **D2** ("Level NN" at large text) | **PASS.** 216/216 (no stat/text past the edge, no spill, no clip, tab labels whole, `innerWidth` = width). 100 %: identical to `0d58c5e` except the intended single row (36 cells: 375 for totals needing tight, 360 always, 390 at ≥ 123,456). |
| **D3** (long warning at large text) | **PASS for reading, FAIL for staying (R5-D1).** First shown at its opening (375×667 @200: box 8–324, own scroll 0/32; 667×375 @200: 8–68, 0/402); every line read with real wheel (20 px) and touch in every config; "Save backup" visible, hit-tests and **downloads** in every run (64 + 14 + reruns); dock clear at rest; no text outside its box. Keyboard: Tab → "Save backup" → Enter downloads at 375/390 @200 %. |
| **R2-D3** (stacks at large text) | **PASS** for squeeze and readability: no toast squeezed; older toasts revealed and wholly on screen with wheel and touch (375 @200, landscape @150/200, 568×320 @100 three-stack 4/4). The stack's stability fails under R5-D1. |
| **D4** (toast over "Mark it done") | **PASS.** 375/390/1440 × both themes × 100/200 % × 0–3 toasts: every control hit-tests as itself and no toast box overlaps it, as shown and scrolled to the middle (48/48, plus 32/32 in the start/leave runs); real taps: Mark it done gone 12/12, start 4/4, leave 4/4. Break-over composition unchanged (screenshots). |
| **R4-D1** (warning taken away by real scrolling) | **Fixed for scrolling itself, not closed:** 57/64 matrix runs clean as recorded; ordinary wheel/touch reading never takes the warning away (0 in all alone / End < 1 min runs, 568×320, 844×390 @150, 390, 1440). Matrix failures: 3 × the R5-D1 take-away (375 @200 light, 844 @200 light + dark, three-stack wheel); 2 × "10/11 lines" at 667×375 @200 touch = my probe's step limit (11/11 on re-run); 2 × "list moved 65 px while resting at the top" at 667×375 @200 = an older toast timing out and shrinking the list (warning unaffected; not a defect). **See R5-D1.** |
| **R4-D2** (zoom after live resizes) | **PASS.** 100/100 sequences end at scale 1, `visualViewport.width = innerWidth`, no sideways scroll, bar inside (200/175/150 %, both themes). The new spec fails on r4 (×1.29–2.38). Transients at 150 % are larger than disclosed (see disclosures) but always recover. |

## Interaction with M1 (trial vs M1 alone `3f00b57`)

| Phase (per frame, quota really full) | Trial (375/390/1440, both themes, 100/200 %) | M1 alone |
|---|---|---|
| Summary (Tea time/Skip), break, break-over | **0 frames shown**, every config | 0 |
| Today: warning raised; after "That's all for now" | shown, never lost (today2 shown in all 12), docked start hit-tests as itself; 2–4 low-opacity (0.19–0.22) frames over the **exiting** break-over group | same class (2–5 frames over `.overActions`) |
| Brew start with the warning up (real tap) | phones 1–5 frames at opacity ≤ 0.19 during the dissolve (200 %: 2–3 of them over the readout/dock); 1440: 1–2 frames over the exiting Today radios | same class (200 %: 1–3 frames, opacity ≤ 0.33) |
| Paused | phones 0; 1440 shown beside the panel, 0 overlap | same |
| 1440 Today entry | shown at the stylesheet position for a moment, taken away and re-shown (known F11/M1 note) | same |
| `capture-storage-full.mjs`, 6 configs | 59/60 states identical; the 60th identical on 2/2 re-runs (entry gap) | — |

M1's approved behaviour is unchanged by this diff in every phase it governs. (R5-D1 is M1's rule reacting correctly to a box M2's CSS
puts over the dock.)

## Load CLS (I14) — decision: not a regression, not a defect of this round

Production builds, cold loads, light, 3 runs each. "Counted" = Chrome's CLS (shifts without `hadRecentInput`); "all" = every layout-shift
entry; "px" = summed per-entry max move; "max iw" = widest layout viewport during load.

| Case | baseline `8f1044a` | base `0d58c5e` | r4 `adec1a2` | **r5 trial** |
|---|---|---|---|---|
| 390×844, 100 %, normal / slow fonts | 0 / 0 | 0 / 0 | 0 / 0 | **0 / 0** |
| 375×667, 100 %, normal / slow fonts | 0 / 0 | 0 / 0 | 0 / 0 | **0 / 0** |
| 390×844, 200 %, normal fonts | 0 (all 0.18, iw **534** for the whole load) | 0 (0.26) | 0 (0.24) | **0** (0.24, iw 390) |
| 375×667, 200 %, normal fonts | 0 (0.17, iw **534**) | 0 (0.33) | 0 (0.28) | **0** (0.28) |
| 390×844, 200 %, +2.5 s fonts | counted **0**; all 0.31; **1,626 px**; iw **570** for 7.5 s | counted **0**; all 0.58–0.67; **1,621–1,733 px**; iw **570** for 2.6 s | 0.147 / 0.384 / 0.147; all 0.384; 159 px; iw 390 | counted **0.384** ×3; all 0.384; **159 px**; iw 390 |
| 375×667, 200 %, +2.5 s fonts | 0; 0.18; 1,184 px; iw 570 | 0; 0.59–0.64; 1,192–1,789 px; iw 570 | 0.082; 0.363; 164 px | **0.082**; 0.363; **164 px** |

The 0.384 is two shifts that exist in every build: the font-swap reflow at ≈2.7 s (0.147, includes the bar going from 3 to 2 rows) and a
later reflow at ≈3.0 s (0.236: greeting −22 px, Chai row, goal card, dock backdrop up to −64 px), which base `0d58c5e` also has with the
**same sources and offsets** (0.258) and the baseline has in its own form (0.140). In the baseline and base Chrome excludes all of it only
because their 200 % page is 534–570 px wide during load (the overflow that I04 fixed), and every layout-viewport resize counts as input.
r5 never widens the page, moves an order of magnitude less (159 px vs ≈1,600 px), and is identical to r4 in movement. The required
cases — phones at 100 %, normal and slow fonts — are **0** in all builds. Decision: no regression in what a person sees; not a defect
under I04/I14 for this round. Recommendation (I14, outside this diff): find the ≈0.24 late reflow on Today at 200 % (sources
`::before 557→493`, `chaiRow 375→354`, `card 663→642`); once nothing masks it, Chrome counts it whenever fonts arrive late.

## The maker's disclosures

1. **667×375 @200 %: a two-line older toast wholly visible at one offset; a coarse notch skips it.** Confirmed and **understated**: in
   that 60 px room the warning itself (11 lines in a 60 px box) is wholly read only with fine steps — 11/11 lines by touch and 20 px
   wheel, **9/11 with 53 px notches, 3/11 with 100 px notches**; with 100 px notches the one-line "Saved 12 minutes of focus" is never
   wholly visible. Not graded as a defect: that configuration is a landscape phone (touch reads everything) or a 667×375 desktop window
   with 200 % text; R5-D1 already forces a rework of this area, and the retest below includes coarse notches.
2. **Older toasts slid down cover the pinned warning until you scroll back.** Confirmed (in a 60 px room all of it, "Save backup"
   included; in light theme the same-coloured cards read as one block, e.g. "Kettle's off. See you soon." directly above "changes: this
   browser's storage…"). At rest nothing covers it, "Save backup" hit-tests and downloads, and older toasts expire after 3.2 s while
   the warning lasts 12 s. **Not a defect** (polish: a visible separation between stacked cards).
3. **Transient 1–4 px over-width during 150 % drags.** **Understated.** At 150 %, every bounce and every rotation sequence (32/32) has
   1–3 frames where the layout viewport is **409 px (+34)** after a bounce or **446 px (+71)** after a rotation, and 7 of 16 rotation
   sequences show a transient page scale of **1.187** — base `0d58c5e`: 0 frames in the same sequences. It is the previous mode applied
   at the new width before `fit` runs. It always recovers (100/100 final scale 1), so **not a defect**; the disclosure should state
   these magnitudes, and the R4-D2 mechanism (page scale reacting to a transient width) is still observable at 150 %. (Drags at 150 %
   and everything at 175/200 % had 0 such frames in my runs.)
4. **200 % + slow fonts, 390×844: Chrome counts 0.384 instead of 0.147.** Confirmed; see the CLS decision (accepted).

## REFERENCE → BEFORE → AFTER and preservation (100 % text)

- K01's hierarchy holds. Today 01 at 375×667: BEFORE (integrated) wraps "Level 12" onto a second row and pushes the greeting ~50 px
  down; AFTER (mine, light and dark) is the baseline's single row (6 px pill padding, greeting at 64). 390 and 1440 01/01b differ from
  integrated only in date-driven data (1.1–1.9 %); mine equal M2's r5 AFTER (0.000 % phones, ≤ 0.011 % 1440: Chai idle).
- Break-over 10: stage, "Break's over", "Ready for another brew of Chapter 3 notes?", green "Mark it done, start fresh", full-width orange
  "Put the kettle on", ghost "That's all for now" — unchanged; today's recipe toast sits above "Mark it done" instead of over it
  (5.7–7.5 % diff on phones = the toast band and steam/Chai frames). K04 continuity (room persists through whistle → summary → tea →
  break-over, actions available) holds.
- Preserved: docked "Put the kettle on · 25 min"; sky "Change brew length" link on phones (absent at 1440 as approved); five wrapping
  categories and 15/25/50/Custom (01b, 1440 01); cream/purple identity and stat colours; approved Chai; summary/footer untouched; no
  other change at 100 % text (toast geometry at 100 % only differs in short rooms, where it was already scrollable in r3/r4).

## Defect (REJECT)

### R5-D1: an older toast leaving while the list is scrolled puts the pinned warning below its room; M1's rule takes it away and re-shows it reset

- **Exact defect.** In short-room mode the warning is a `position: sticky; bottom: 0` item of the reversed (`column-reverse`) scroll list.
  When an older toast is removed while the list is scrolled up, or shortly after it was scrolled back to its end (resting `scrollTop` is
  +1 there), Chromium's scroll anchoring adjusts the list's offset (+1 → −63 at 375×667 @200 %, the removed toast's height). On the next
  scroll step the warning's **layout box** is drawn 7–47 px below the list's bottom edge — over the docked "Put the kettle on" by up to
  33 px (375×667) / 34–37 px (844×390) — at full opacity for ≈150–250 ms (`getBoundingClientRect`, transform `none`; a screenshot in that
  window still shows the warning painted in its room, so the box the hold rule and hit-testing use is the wrong one). M1's approved
  watcher measures that box, dismisses the warning (fade, DOM removal) and re-shows it 60–190 ms later at its opening, with the list back at
  rest and the warning's own scroll at 0. Trace (375×667 @200 %, light, `$S/race/race-shot.jsonl`): `[5972] 3 toasts, box 7–323, list +1`
  → `[5989] "Saved 12 minutes" removed, list −63` → wheel 20 px → `[6156] list −43, box 51–367` (room ends 324, dock 334) → `[6355]` opacity
  0.81 … `[6525]` removed → `[6587]` re-added at 0/0. Screenshots: `$S/race/race-shot-375x667-light-wheel-0-afterstep-{0,1,2}-*.png`
  (painted in place → **gone**, only "Cozy level 5!" left → back at its opening).
- **How often, with real input.**
  - Fully natural sequence, **no synthetic events at all** (`natural.mjs`: real pointer on the stack, wheel up to the oldest toast, wait,
    wheel back down; toast timers run as in use): 375×667 @200 % light **4/8** (all 4 taken away; waits 1.2–1.5 s), dark **4/6** (2 taken
    away, 2 drawn over the dock without being caught); 844×390 @200 % light **2/7** (1 taken away with the box 47 px below the room,
    1 drawn 6 px below it); 667×375 @200 % 0/3.
  - Maker-style matrix (timers held at the start, real wheel): 3 of 12 three-toast wheel runs (375 @200 light; 844 @200 light and dark),
    plus 2 of 6 extra repeats at 375 @200 light.
  - Targeted (`race.mjs`: middle toast's timer resumes after scroll-back, one more wheel step): 375×667 @200 % **7/7** (light 5, dark 2),
    844×390 @200 % **4/6**; not at 667×375 @150, 844×390 @150, 568×320 @100 (2/2 clean each); the touch version of this targeted path
    was clean 2/2 at 375 dark and the touch matrix runs were clean, so a touch trigger is not shown (UNKNOWN) — the wheel one is.
- **State.** Today, storage full, three toasts after End with a level-up ("Cozy level N!", "Saved 12 minutes of focus", the warning) —
  the R4-D1 retest state — while the person scrolls the list and an older toast's 3.2 s timer runs out (natural, since only the toast
  under the pointer is paused).
- **Viewport / theme.** 375×667 @2 at 200 % text and 844×390 @2 at 200 %, light and dark (Chromium mobile emulation).
- **Required correction.** The warning's layout box must stay inside its room in every list state, including while other toasts
  enter or leave a scrolled list; R4-D1's outcome must hold with real toast timers. For example: keep the warning out of the scrolling
  content (pinned below a scroll box that holds only the older toasts), or remove the dependence on sticky + scroll anchoring in the
  reversed list (disabling anchoring alone was not sufficient in my experiment) — and verify. Changing M1's hold rule instead needs M1 and
  an independent re-review (as r4 said). Keep everything r5 achieved: opening shown first, every line readable, "Save backup" visible and
  working, older toasts revealable, 100 % geometry unchanged, no squeeze.
- **Required retest.**
  - Real input with **real toast timers** (no per-frame `pointerenter`): the natural sequence (pointer on the stack, wheel up to the
    oldest toast, wait 0.6–1.8 s, wheel back down in 20 px notches and keep going) and the touch equivalent, ≥ 3 reps per wait, at
    375×667 and 844×390 @200 % and 667×375 @150/200 %, both themes, flows End < 1 min and End after 12 min + level-up; plus the targeted
    path (middle older toast times out right after the list was scrolled back, then one more scroll step). Per-frame sampling ≥ 2 s after
    the last input: the warning's box never below the room / over the dock, never faded or removed, list not reset.
  - The full R4-D1 retest set again (alone, End < 1 min, End after 12 min + level-up; 375×667 @200, 667×375 & 844×390 @150/200,
    568×320 @100; wheel and touch), with 53 px and 100 px wheel notches added at 667×375 @200 %.
  - Extend `tests/toast-room.spec.ts` with a case where an older toast times out while the list is scrolled (no per-frame timer hold), and
    show it fails on r5.
  - Then: M1's `capture-storage-full.mjs` (6 configs vs M1's AFTER), `integrity` / `a11y` / `statusbar` / `toast-room` / `whistle` and
    timer/pwa on a fresh trial merge with `3f00b57`, D4 probe, 01/01b/10 recaptures, and phone load CLS at 100 %.

## Non-blocking notes (not graded)

1. **Entry flicker (pre-existing).** With three toasts at 375×667 @200 %, the warning is often taken away and re-shown within ≈0.5 s of
   first appearing (entry transform `y: 18` puts its box over the dock): r5 4/8, r4 trial 6/8. Owner M1/F11 (same class as r4 note 1).
2. **Keyboard at 375×667, 100 % (pre-existing, M1-owned).** Tabbing from the top never reached "Save backup" within 45 Tabs on the trial
   or on M1 alone: the warning is taken away while focus passes the composer/dock and re-shown 1.8 s later, so the Tab cycle misses it. At
   200 % (375, 390) Tab → "Save backup" → Enter downloads.
3. **Hit-testing during R5-D1.** Hit-testing follows the layout box, so for those ≈150–250 ms a tap aimed at the painted "Save backup"
   would be resolved against the displaced box (inferred from the geometry; I did not time a tap into that window). Covered by the R5-D1
   correction.
4. Unchanged from r4: Finding 5 / I10 (progress toasts raised on `/focus`), landscape 200 % break-over room ≈0, 8 px higher break-over
   toasts without a carried task; r3's clipped bottom shadow in short rooms.

## BLOCKED / UNKNOWN (never PASS)

- **BLOCKED:** real phones and touch hardware; everything above is Chromium headless with CPU SwiftShader and emulated viewports
  (`isMobile`, touch, DPR 2).
- **UNKNOWN:** iOS Safari / WebKit: `contain: inline-size` and `overflow-x: clip` during measurement (older engines fall back to r4's
  measuring), size container queries and `cqh`, `:has()`, `align-items: safe center` (an engine without `safe` alignment would centre an overlong message and
  hide its opening), a sticky action in a scrolling toast inside a sticky warning in a reversed scroll box, scroll anchoring, and page-scale
  handling on resize.
- **UNKNOWN:** real OS text-size settings (Android font scale, iOS Dynamic Type); large text was simulated with `html { font-size }`.
- **UNKNOWN:** real window managers (Android freeform, split screen, foldables, Stage Manager, Chromebook) and real mouse-wheel notch
  sizes (emulated 20/53/100 px).
- **BLOCKED:** real assistive technology. Note that every R5-D1 take-away and every entry flicker re-adds the warning to the polite live
  region.
