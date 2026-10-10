# I04 integration fix (status bar, toasts at large text, break-over) · CHECKER r4

**Verdict: REJECT**

- **Reviewed commit:** `adec1a223fab6fda94a23636829dc7b3e4e6e52f` (branch `pe/w1-fix-m2`, "I04 INTEGRATION FIX READY FOR REVIEW (r4)").
  `adec1a2:kettle/src` = `dcc3778dd31e832041817e95c8677be87406b617` (checked). The code is in `9326de5` (same tree); `adec1a2`
  adds evidence only. Whole shipping diff reviewed: `git diff 1bec1a8 adec1a2 -- kettle/src kettle/tests` (r1 + r2 + r3 + r4).
- **Trial merge (what will ship):** `1f1558e` (src `0d0db47afef52a7788d012e335e0c537cbb5532d`) = integration `4992956` + M1
  `pe/w1-fix@3f00b57` + `adec1a2`. I checked: `flow.ts`, `Toast.tsx`, `integrity.spec.ts` byte-identical to `3f00b57`; `StatusBar.tsx`,
  `Home.module.css`, `Toast.module.css`, `FocusScreen.tsx`, `FocusScreen.module.css`, `statusbar.spec.ts`, `a11y.spec.ts`,
  `a11y-probes.mjs` byte-identical to `adec1a2`; `git merge-tree 2f643f4 adec1a2` = `1f1558e^{tree}`. **Both defects below reproduce on
  the trial merge.**
- **BEFORE:** integration `4992956` (app code `0d58c5e`, worktree `/home/user/wt/chk-r4-base`). For root-causing only I also served
  read-only `git archive` copies of `e932f65` (r2) and `c9520db` (r1) from the scratchpad, and M1's `/home/user/wt/w1fix` (`3f00b57`) as is.
- **Checker:** independent; I did not build this and did not review r1–r3. No application code, tests or maker files edited; nothing
  committed. All four worktrees are clean at the end (`git status` empty; the `test-results/pwa-dist` the pwa spec built in the trial
  worktree during my run was removed). Scratch: `/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/chk-r4/`
  (`$S` below; probes in `$S/probes/`, logs in `$S/logs/`). Servers (scratch Vite configs = repo config + private dep cache, no HMR):
  dev 5216 (commit) / 5217 (base) / 5215 (trial), Playwright 5236/5246 (commit) / 5237 (base) / 5235/5245 (trial), production
  previews 5228 (trial) / 5229 (base); 5236 was later reused for the scratch r2/r1 copies and M1's worktree. All stopped by PID.
- Environment: 4 CPUs, Chromium (Playwright) with CPU SwiftShader, emulated viewports. Runs on 2026-10-10, 02:30–04:45 UTC.

## Short version

r4 does what it says for **D4**: on every phone and desktop size I tried, "Mark it done, start fresh", "Put the kettle on" and
"That's all for now" stay uncovered and tappable with 0–3 toasts up (base: "Mark it done" covered in 24/24 phone cases), and the new
gate is real, deterministic and fails on `0d58c5e`. **D1, R2-D1 and D2 pass** at the required 100 % / large-text matrices, **M1's
approved behaviour is unchanged**, **load CLS stays 0** at 100 %, and the protected Home/break-over visuals are preserved.

Two defects remain, both in the shipping diff and both reproduced on the trial merge:

- **R4-D1 (D3 / R2-D3 not met):** where the storage-full warning is taller than its room (375×667 at 200 %; 667×375 and 844×390 at
  150–200 %) its opening lines start above the screen and **cannot be read by scrolling**. Any real scroll of the list moves the
  warning's box down over the docked start; M1's frozen hold rule (which measures the drawn box) then takes the warning away within
  ≈ 0.13 s and re-shows it at the original offset ≈ 0.25 s later. The packet's "readable by scrolling" was measured with a programmatic
  scroll inside one script turn, which the 250 ms hold watcher never sees.
- **R4-D2 (resize race, regression from r2):** at large text, the status bar's re-fit runs its "unwrap and measure" layout while a
  mobile viewport change is settling. That transiently widens the mobile layout viewport to 475–511 px, and Chromium's page-scale
  logic is left **zoomed in (×1.2–3.2)** after live window resizes (back-and-forth or quick drags), app-wide, until the person
  pinches out. Base `0d58c5e` and r1 `c9520db`: never.

## What I ran (all re-run by me)

| Command / probe | Result | Log / output |
|---|---|---|
| `npx tsc --noEmit --pretty false` — commit and trial | exit 0 / exit 0 | `$S/logs/tsc-{head,trial}.txt` |
| `npx vitest run` — commit and trial | 26 files, **265/265** / **265/265** | `$S/logs/vitest-{head,trial}.txt` |
| commit: `KETTLE_PORT=5236 KETTLE_PWA_PORT=5246 npx playwright test --project=chromium tests/a11y.spec.ts tests/statusbar.spec.ts tests/whistle.spec.ts --workers=2` | **26/26 passed** (6.7 min), incl. "short screen", both new break-over tests, statusbar 7/7 | `$S/logs/e2e-head.txt` |
| New gate (commit's spec) against **base `0d58c5e`** (5237): `-g "short screen"`, then each "carried task included" twin alone | **3/3 fail**: short screen → `break-over`, `break-over + 1 toast`, `break-over + 2 toasts`: "Mark it done, start fresh" stays under `span._message…`; 390×844 and 375×667 twins → "Mark it done, start fresh: under a toast (1 up)" | `$S/logs/gate-on-base-{shortscreen,bo390,bo375}.txt` |
| trial: `KETTLE_PORT=5235 KETTLE_PWA_PORT=5245 npx playwright test --project=chromium tests/integrity.spec.ts tests/a11y.spec.ts tests/statusbar.spec.ts tests/whistle.spec.ts --workers=2` | **54/54 passed** (8.7 min), incl. every I03 "storage-full warning never covers a control" test and a11y "a toast never covers the session controls or the summary footer" | `$S/logs/e2e-trial.txt` |
| trial: `… --project=timer-harness --project=timer-app --project=pwa --workers=2` (as in `playwright.config.ts`) | **29 passed, 2 skipped** (harness-only tests, by design, as in every earlier run) | `$S/logs/e2e-trial-timer-pwa.txt` |
| D4 probe `d4.mjs` (real journey to break-over with the intention carried; toasts raised with the app's own `toast()`; each control measured as shown and scrolled to the middle; real tap with 2 toasts up) — trial and base, 375×667@2, 390×844@2, 1440×900@1, both themes, 100/200 %, 0–3 toasts | see D4 | `$S/d4/`, `$S/logs/d4-*.txt` |
| D4 extras: short/landscape 320×568, 667×375, 844×390, 568×320 @100/200 % (trial, base); no carried task (trial, base); taps on "Put the kettle on" / "That's all for now" with 2 toasts | see D4 | `$S/d4x/`, `$S/d4t/`, `$S/logs/d4-*.txt` |
| D1 probe `d1.mjs` on trial: 16 sequences × 3 reps × both themes at 100 %, fixed 2,296 leaves; checks mode, rows, right edge, `scrollWidth/clientWidth/innerWidth`, visual viewport (width, scale), tab-bar bottom, 2 s attribute-quiet window, back to 414 | **0 failures in 96 runs**; at 200 %: 15/16 (see R4-D2) | `$S/d1-trial.jsonl`, `$S/logs/d1-trial*.txt` |
| D2 probe `d2.mjs`: 360×740/375×667/390×844 × 100/150/175/200 % × seed + 2,296 / 9,999 / 10,000 / 12,345 / 45,678 / 99,999 / 123,456 / 470,000 leaves × both themes (trial); 100 + 200 % on base | trial **216/216 clean**; base **60/120 fail** (all at 200 %) | `$S/d2-{trial,base}.jsonl` |
| D3 probe `d3.mjs` (newbie profile, **localStorage really full** – `QuotaExceededError` checked; warning alone / End within the first minute / End after 12 min with a forced level-up; text-inside-box, newest in view, every toast and warning line reachable **by programmatic scroll**, "Save backup" hit-test + real tap/click → download, dock clear, no sideways scroll) | 375/390/1440 × both themes × 100/150/200 %, 667×375 & 844×390 × 125/150/200 %, 568×320 @100 %: all pass these static checks (one 1440 "no warning" artefact explained under notes) | `$S/d3/`, `$S/logs/d3-*.txt` |
| D3 follow-up `d3read.mjs`: the same states, then a **real** scroll of the list (mouse wheel, or CDP touch drag), sampled every 100 ms (and per frame) for 3 s | **13/13 configurations: the scroll is undone and the warning's opening is never readable** (R4-D1) | `$S/logs/d3read-summary.txt`, `$S/d3read/` |
| Zoom investigation `zoom.mjs`, `zoom2.mjs`, `zoom3.mjs` (rapid / live resizes at large text; visual-viewport scale; measured layout-viewport width inside the bar's measurements) on trial, commit, base, `e932f65`, `c9520db`; desktop control | R4-D2 | `$S/logs/zoom-200-summary.txt`, `$S/zoomshots/` |
| M1 behaviour `m1.mjs` (quota full; per-frame warning vs readout, controls, footer, break, break-over, docks; Today → brew by real tap → pause → summary → Tea time → break-over → "That's all for now" → Today) — trial at 375/390/1440 both themes; M1 alone (`3f00b57`) at 375 both themes and 1440 light | unchanged from M1 alone (see M1 section) | `$S/m1/`, `$S/logs/m1-*.txt` |
| M1's `contracts/I03/capture-storage-full.mjs` (from `/home/user/wt/w1fix`) against the trial, 6 configs, `--rev "trial 1f1558e"` | **60/60 states identical** (route, toasts, session counts) to M1's AFTER `capture-meta.json`; 0 page errors | `$S/m1caps/` |
| Load CLS `cls.mjs`: `vite build` of trial and base into scratch, `vite preview` 5228/5229, cold loads, 7.5 s; fonts normal or every `.woff2` delayed 2.5 s | see CLS | `$S/cls.jsonl` |
| Captures: `node review/product-excellence/tools/capture.mjs --base http://localhost:5215 --out $S/caps/<cfg> --w W --h H --dpr N --theme light|dark --only 01,01b,10` at 390×844@2, 375×667@2, 1440×900@1, both themes | capture-meta `revision: 1f1558e`, `errors: []` | `$S/caps/` |
| Pixel diffs (`pxdiff.mjs`, Chromium canvas, channel tolerance 24) | see preservation | console |

## What I opened (Read tool, full size)

- **REFERENCE:** K01 `…/VISUAL_BENCHMARK_LIBRARY/assets/current/01-home.png`; K02 `…/assets/current/07-summary.png`; K04
  `…/assets/current/whistle-to-summary-phone-dark-reduced-motion-frames.jpg` (the brief's `recordings/…-frames.jpg` path does not exist;
  the frame sheet is in `assets/current/`).
- **History:** `PROTOCOL.md`; master prompt §7–8; `MASTER_EVIDENCE_MATRIX.md` I04 + I14; `PRESERVE_LIST.md`; `STATUS.md` top checkpoint;
  `CHECKER-integration-fix-r1.md`, `-r2.md` (incl. non-blocking notes), `I03/CHECKER-integration-fix-r1.md`, `I04/CHECKER-r1.md`;
  `integration/wave1/a11y-short-screen-2026-10-10/README.md`, its log, probe and screenshot `break-over-375x667-light-recipe-toast-0d58c5e.png`
  (toast fully over "Mark it done"). The maker's packet (all of r1–r4).
- **BEFORE:** integrated `0d58c5e` `phone-375x667-light/01-home.png` (stats wrapped, greeting ~50 px lower) and `10-break-over.png`;
  `desktop-1440x900-light/10-break-over.png`. Baseline `8f1044a` `phone-375x667-light/01-home.png`, `10-break-over.png`,
  `desktop-1440x900-dark/01-home.png`.
- **Maker AFTER:** `r4/breakover/breakover-1toast-375x667-t100-light-{after,before}.png`, `breakover-1toast-1440x900-t100-light-{after,before}.png`,
  `breakover-2toast-375x667-t200-light-after.png`; `r3/after/phone-375x667-light/01-home.png`;
  `r3/earlyend/earlyend-after12min-375x667-t200-light-trial-levelup.png`.
- **Mine (trial `1f1558e`):** `$S/caps/phone-375x667-light/{01-home,01b-home-scrolled,10-break-over}.png`, `phone-375x667-dark/01-home.png`,
  `phone-390x844-light/01-home.png`, `phone-390x844-dark/10-break-over.png`, `desktop-1440x900-light/{01-home,10-break-over}.png`,
  `desktop-1440x900-dark/01-home.png`; `$S/caps-base/desktop-1440x900-light/10-break-over.png`, `$S/caps-hover/trial-1/10-break-over.png`;
  D4 `$S/d4/d4-{trial,base}-390x844-dark-t100-n2.png`, `d4-trial-1440x900-dark-t100-n2.png`, `$S/d4x/d4-{trial,base}-x-667x375-light-t200-n1.png`;
  D3 `$S/d3/d3-trial-375x667-dark-t200-end12lv{,-scrolled}.png`, `d3-trial-568x320-light-t100-end12lv.png`, `d3-trial-667x375-light-t150-alone.png`;
  M1 `$S/m1caps/phone-375x667-light/s4a-today-pending-warning.png` against M1's AFTER `…/after-integration/phone-375x667-light/s4a-…png`;
  zoom `$S/zoomshots/{trial-wiggle16-t200-0,trial-drag16-t200-0,base-wiggle16-t200-0}.png`.

## Code review of the shipping diff

- **`StatusBar.tsx` (r1–r3).** Listeners and observers are all removed on unmount (`loadingdone`, `window` `resize`,
  `visualViewport` `resize`, `ro.disconnect()`); every re-armed `fonts.ready.then(fit)` is guarded by `live`. No oscillation: `fit`
  resets and re-derives from the same layout, the 2 s attribute-quiet window was 0 in all 96 D1 runs. **But** every loaded-path `fit`
  lays the row out unwrapped and then tight to measure it; at large text that row is 475–511 px, and on a mobile viewport the layout
  viewport (`innerWidth` / `clientWidth`) expands to that width inside the forced layout (measured, `zoom2.mjs`). Since r2 this runs at
  `loadingdone` right after every viewport change, and since r3 on every `resize`/`visualViewport` resize and `<html>` resize: see R4-D2.
- **`Home.module.css`.** `data-tight` padding and `.statLevel { min-width: max-content }`: inert at 100 % (column stays 56 px), correct
  at large text (D2 clean).
- **`Toast.module.css`.** Region now spans top-safe-edge → (lifted) bottom with `pointer-events: none` (no hit-testing impact);
  `max-content` rows outside short rooms (100 % geometry unchanged on 375/390/1440, pixel-identical to M2's r3 AFTER); in short rooms a
  bottom-up (`column-reverse`) scroll list. The bottom-up list keeps every box inside the room **only at the initial scroll offset**;
  scrolling it up moves the newest toast's box below the room, which M1's frozen `protectedUnderToasts()` reads (R4-D1). `position:
  sticky` action works in the scroll box (Chromium); real wheel and touch scroll an ordinary stack fully (375×667 @200 %, 3 toasts:
  −153 px, page does not scroll).
- **`FocusScreen.tsx/.module.css` (r4).** `.overDock[data-toast-above]` wraps "Mark it done" and `.overActions`; control rectangles are
  identical to base in every config I measured (375/390/1440/320/landscape, 100/200 %). Effects on M1's frozen code: `toastLiftBottom()`
  now measures from "Mark it done"'s top (or, with no carried task, from 8 px above "Put the kettle on", because `.overActions`'
  `margin-top` is now inside the group: toasts sit 8 px higher than base; undisclosed, harmless). M1's hold on break-over is decided by
  `ritualOnScreen()` first (route `/focus`, timer idle), and on `/focus` every button is a candidate anyway, so the hold is unchanged
  (0 warning frames on break-over in every config).
- **Tests.** `raiseToasts()` imports the dev server's own `/src/ui/Toast.tsx` instance — I confirmed with the same mechanism that the
  toasts really render at the lifted position on head/trial (D4 probe), so the gate cannot pass vacuously; it dismisses all toasts first,
  so the real date-dependent toast (present today: "Recipe done: Take 2 full tea breaks · +15 leaves") cannot make it flaky. The
  original `break-over` reach check still runs before the raised-toast checks, so nothing was hidden. `statusbar.spec.ts` uses a fixed
  2,296 leaf total. `a11y-probes.mjs` `.sr-only` detection by layout size is sound. **Gap:** no test scrolls a toast list with real
  input and waits for the 250 ms hold tick, and none checks the visual-viewport scale after resizes (both defects slipped through).

## Per-defect findings (trial `1f1558e` unless noted)

| Defect | Finding |
|---|---|
| **D1** (re-fit after resize/rotation to 375×667, 100 %) | **PASS.** From 414×896, 667×375, 844×390, 390×844 (phone) and 1440×900, 800×900 (desktop window) → 375×667, both themes, 3 reps each: `tight`, one row, right edge 367, `scrollWidth = clientWidth = innerWidth = 375` (desktop: 360 with its 15 px scrollbar, no horizontal scroll), visual viewport 375 at scale 1, tab bar bottom 667, greeting 64; back to 414 → `normal`. |
| **R2-D1** (narrowing without a box change) | **PASS.** Single steps 384×854 → 375×667, 380×800 → 375×667, 384×854 → 360×740; drag 414 → 375 at 1 px/20 ms and 2 px/16 ms; desktop windows 420 → 375 (1 px) and 500 → 375 (5 px); zero-wait bounce and 30 ms bounce; triple rotation — all `tight`, no overflow, 0/96 failures, 0 attribute flaps. At 200 % the mode is `wrap` with no layout overflow, **but see R4-D2** (visual zoom). |
| **D2** ("Level NN" at large text) | **PASS.** 216/216 cells (360/375/390 × 100–200 % × 9 totals × both themes): no stat or text past the edge, no label outside its pill, no clipped text, `scrollWidth ≤ clientWidth`, `innerWidth` = width, tab bar on screen and labels unclipped. Base fails 60/120 at 200 % (label spill to 372–388 px, layout viewport 373–388). **100 %:** 24 of 60 comparable cells identical to `0d58c5e`; the other 36 are exactly integration defect 2 being fixed (base wraps to 2 rows with the greeting at 116 → trial one `tight` row, greeting 64: 375 with totals needing tight, 360 always, 390 at ≥123,456). 360 @470,000 wraps on both. |
| **D3** (long warning at large text) | **Partly met.** "Save backup" visible, hit-tests as itself and downloads `kettle-backup-2026-10-10.json` in every run; the docked start stays clear; no text outside its box; no sideways scroll; 375×667 / 390×844 / 1440×900 × both themes × 100/150/200 % in all three flows. **Not met:** where the warning is taller than its room its opening cannot be read (R4-D1). |
| **R2-D3** (stacks at large text) | **Squeeze fixed; readability not.** No toast squeezed anywhere (0 text-outside-box in every config, incl. 568×320 three-stack at 100 %); tall ordinary stacks scroll with wheel and touch. With the warning in the stack, older toasts above the screen (375×667 @200 %: "Kettle's off" −129…−32; landscape from 125 %; 568×320 @100 % "Cozy level 5!" top −10) cannot be revealed either — the same mechanism as R4-D1. |
| **D4** (toast over "Mark it done") | **PASS.** Trial, 375×667 / 390×844 / 1440×900 × both themes × 100/200 % × 0/1/2/3 toasts: every control hit-tests as itself and no toast box overlaps it, as shown and scrolled to the middle (48/48; one 1440 run interrupted by a page navigation on both trial and base, re-run clean). Real tap on "Mark it done" with 2 toasts up removes it 12/12; "Put the kettle on" starts the brew (2/2), "That's all for now" goes to Today (2/2). Base: "Mark it done" covered in **24/24** phone cases with ≥1 toast, real tap times out (toast intercepts) 4/4 at 100 %. Short/landscape extras: trial 0/32 covered vs base 22/24. Gate: fails on base 3/3, passes on commit and trial. |

## Interaction with M1 (trial vs M1 alone `3f00b57`)

| Phase (per-frame) | Trial 375 / 390 / 1440, both themes | M1 alone |
|---|---|---|
| Today, warning raised (quota full) | shown above the dock, never over it on phones (155/155, 164/164 frames at 375); 1440 entry flicker (below) | same |
| Brew started by a real tap with the warning up | phones held (0–4 frames during the route dissolve, over the exiting Today brew-length radios); 1440 shown beside the panel (1 dissolve frame over the exiting Today radios), never over the readout or controls | same class (phones 0–2 frames; 1440 1 frame) |
| Paused | phones 0 frames; 1440 shown beside the panel | same |
| Summary (Tea time / Skip), break, break-over | **0 frames** in every config | same |
| "That's all for now" → Today | shown, never lost; 2–7 low-opacity (0.12–0.45) frames over the **exiting** break-over group during the dissolve; start button hit-tests as itself afterwards | same class (2–4 frames over `.overActions`) |
| `capture-storage-full.mjs`, 6 configs | 60/60 states identical to M1's AFTER; pixel diffs only clock/date copy (e.g. "Still up, Sam?") | — |

M1's approved behaviour is unchanged by this diff. The `data-toast-above` move does not change the break-over hold (ritual rule wins).

## Load CLS (production builds, cold loads, Chrome's counted CLS = shifts without recent input)

| Case | 390×844 | 375×667 |
|---|---|---|
| 100 %, seed (2,211 → `normal` at 375), fonts normal ×3 / +2.5 s ×3 | **0 / 0** | **0 / 0** |
| 100 %, persisted 2,296 (`tight` at load at 375) ×3 / slow ×3 | **0 / 0** | **0 / 0** |
| 360×740 100 % (`tight`), normal / slow | 0 / 0 | |
| 200 %, slow fonts, trial (×2) | 0.147 (all-shift 0.384) | 0.082 (0.363) |
| 200 %, slow fonts, base `0d58c5e` (×2) | 0 (all-shift 0.58–0.67; layout viewport 570 for 2.5 s) | 0 (0.589; 570) |

Required phone cases at 100 % are 0, including slow fonts and a load that decides `tight`. The 200 % slow-font numbers are exactly
r2's (`e932f65`: 0.147 / 0.082), so the disclosure accepted in r2 has not worsened; total movement is still lower than base.

## The maker's disclosures

1. **"A warning taller than its whole room first shows with its opening line above the edge, readable by scrolling."** Not true in
   practice → **defect R4-D1.** At 375×667 @200 % the hidden opening is "Kettle couldn't" (the visible text then reads like an
   instruction: "save your latest changes: …"); at 667×375 @150 % about three lines; at 667×375 @200 % all but the last line (461 px in a
   60 px room); 844×390 @150/200 %: 13 / 95 px.
2. **Clipped shadow in short rooms.** Seen (hard edge under the bottom toast at 568×320, 667×375, 375×667 @200 %). Cosmetic; **not a
   defect.**
3. **Phones: a break-over toast sits over "Ready for another brew of …" for 3.2 s.** Confirmed; with two toasts the "Break's over" title
   is covered too (390×844 dark). Text only, transient, every control clear and tappable — previously a control was covered. **Not a
   defect**; it remains the Finding-5 / I10 question of raising progress toasts on `/focus` at all.
4. **1440: the toast sits 60 px higher.** Confirmed (382–434 vs 442–494): over the stage's window and sill, not over Chai, the kettle or
   the panel. **Not a defect.**

## REFERENCE → BEFORE → AFTER and preservation (100 % text)

- Today 01 at 375×667: BEFORE (integrated) wraps "Level 12" to a second row and pushes the greeting ~50 px down; AFTER restores the
  baseline single row (greeting at 64, 6 px pill padding), matching K01's hierarchy. Trial 01/01b are **pixel-identical (0.000 %)** to
  M2's r3 AFTER at 375 and 390 in both themes and at 1440 (01b ≤ 0.063 %, Chai idle). Against integrated: 390 and 1440 differ 1.1–1.9 %
  only in date-driven data (leaves, bubble copy, recipes); 1440 dark 01 matches the 8f1044a baseline apart from the same data.
- Break-over 10: composition (stage, title, "Ready for another brew of Chapter 3 notes?", green "Mark it done", full-width orange
  "Put the kettle on", ghost "That's all for now") unchanged; today's real recipe toast now sits above "Mark it done" instead of on it
  (diff to integrated: the toast band and steam/Chai animation frames only). K04 continuity (room persists, actions available) holds.
- Preserved: docked "Put the kettle on · 25 min"; sky "Change brew length" link (phones; absent on desktop as approved); five wrapping
  categories and 15/25/50/Custom (01b, 1440 01); cream/purple identity and stat colours; approved Chai; no other 100 % change found.

## Defects (REJECT)

### R4-D1: a storage-full warning taller than its room cannot be read by scrolling — scrolling makes it disappear and come back unscrolled

- **Exact defect.** In short rooms the toast list is a bottom-up scroll box and the warning is first shown with its last lines and
  "Save backup" in view and its opening above the screen. Scrolling the list up (to read the opening, or an older toast) moves the
  warning's own box down past the room, over Today's docked start. M1's approved hold rule measures that drawn box
  (`#toast-kettle:save-failed` `getBoundingClientRect()`), finds it over "Put the kettle on", dismisses the warning and re-shows it on the
  next free tick, at scroll offset 0. Frame trace, 375×667 @200 %, light, warning alone, one wheel scroll up of 32 px:
  t = 14 ms box 8–356 (first line visible at y 15), t ≈ 131 ms dismissal starts (opacity 0.79 → 0.03 by 264 ms), 313 ms gone,
  382 ms re-shown, 530 ms back at −22…325 with the first line at y −15. `d3read.mjs`, 3 s sampling after the scroll, all on the trial:

  | Config | Warning box as shown (room bottom) | Result after a real scroll |
  |---|---|---|
  | 375×667 @200 %, light + dark, alone / End < 1 min / End after 12 min + level-up, wheel | −24…324 (324; dock 334) | scrolled to 8–356 / 113–461 / 177–525, then taken away and re-shown at −24…324 within ~0.5 s, 6/6 |
  | 375×667 @200 %, alone, CDP touch drag | same | either taken away and re-shown, or (dark) no scroll at all; first line never readable, 2/2 |
  | 667×375 @150 % / @200 %, alone, wheel | −63…166 / −393…68 | same loop, first line back at −56 / −386 |
  | 844×390 @150 % / @200 %, alone, wheel | −13…216 / −95…172 | same loop |
  | 568×320 @100 %, three toasts (End after 12 min + level-up), touch | warning 110–187; oldest toast top −10 | warning taken away (opacity 0.65) and re-shown; oldest toast's top not revealable |

  The packet's r3/r4 "every line of the warning read by scrolling" and my own first D3 pass both scrolled programmatically within one
  `page.evaluate`, so the 250 ms watcher never observed the scrolled state.
- **State.** Today with the storage-full warning (alone, or with "Kettle's off" / "Saved N minutes" / "Cozy level N!"), whenever the
  warning or the stack is taller than the room above the docked start.
- **Viewport / theme.** 375×667 @2 at 200 % text; 667×375 and 844×390 @2 at 150 % and 200 %; 568×320 @100 % with three toasts (older
  toast only). Light and dark. Not affected: 390×844 and 1440×900 (the warning fits at every tested size), and stacks without the warning.
- **Required correction.** Make the whole warning readable on these screens without its drawn box ever leaving the room at any scroll
  position, so that M1's approved rule never takes it away while it is being read — for example keep the warning pinned inside the room
  (e.g. sticky at the bottom of the scroll box) with its own message scrolling inside its box and "Save backup" in view, or show its
  opening first. Older toasts in a stack with the warning must also be revealable without the warning disappearing. If the owner instead
  decides the hold rule must measure only the visible part, that changes M1's frozen `flow.ts` and needs M1 + independent re-review.
  Keep: "Save backup" visible and working, dock clear, 100 % geometry on 375/390/1440 unchanged, no squeeze.
- **Required retest.** With **real input** (mouse wheel and a touch drag) and per-frame sampling for ≥ 2 s after the scroll: the warning
  stays mounted at full opacity, the list stays where it was scrolled, and every line of the warning (and every older toast) is wholly
  on screen and not under the action at some offset. Configs: 375×667 @200 %, 667×375 and 844×390 @150/200 %, both themes, warning alone,
  End < 1 min, End after 12 min + level-up; 568×320 @100 % three-stack. Then M1's `capture-storage-full.mjs` (6 configs, compare with M1's
  AFTER), `integrity.spec.ts`, `a11y.spec.ts`, `statusbar.spec.ts` on a fresh trial merge with `3f00b57`, and 01/01b recaptures. Add a
  regression test that scrolls the list with real input and waits past the 250 ms tick.

### R4-D2: at large text, live window resizes leave the mobile page zoomed in (status bar re-fit race)

- **Exact defect.** `useWrapWhenCrowded`'s measurement removes `data-wrap`/`data-tight` and forces a layout of the unwrapped and tight
  row. At 200 % that row is 475–511 px wide, and on a mobile viewport Chromium expands the layout viewport to it inside the forced layout
  (inside `fit`, `innerWidth` = `clientWidth` = 511 / 475 on a 375–414 px screen; `zoom2.mjs`). r1 never measured while a resize was
  settling (it bailed while fonts were "loading"); r2 re-runs `fit` on `loadingdone` right after every viewport change, and r3 also on
  every `resize`, `visualViewport` resize and `<html>` resize. When these transient expansions coincide with Chromium's page-scale
  update for a viewport change, the page is left zoomed in. It persists across in-app navigation (Today → Stats → Today: 1.98 → 1.98;
  1.66 → 1.66) and only partly decays after a later rotation (→ 1.47 / 1.23); the person has to pinch out.

  | Sequence (mobile viewport, DPR 2, 200 % text) | trial `1f1558e` | commit `adec1a2` | r2 `e932f65` | r1 `c9520db` | base `0d58c5e` |
  |---|---|---|---|---|---|
  | zero-wait width bounce 414/375/390/375/400/375/384/375/414/375 | **10/10**, ×1.48–2.38 | **2/2**, ×1.91–2.32 | **3/3**, ×2.32 | 0/3 | 0/11 |
  | back-and-forth drag 414↔376, 2 px / 16 ms, ×3 | **11/12**, ×1.18–2.66 | — | — | 0/3 | 0/7 |
  | one drag 414 → 375, 2 px / 16 ms | **3/11**, ×1.21 | — | — | — | 0/9 |
  | one drag 414 → 375, 1 px, no wait | **3/3**, ×1.21 | — | — | — | 0/3 |
  | four zero-wait rotations 667×375 ↔ 375×667 | 1/2, ×1.29 | — | — | — | — |

  At 150 % the zero-wait bounce leaves ×1.03–1.10 (2/2); at 100 % none (96 D1 runs + 3 back-and-forth drags). Single rotations, a
  rotation followed by a browser-controls height change, keyboard-like height changes, rotations 600–800 ms apart and drags that end at
  a wider width did not drift (0/21). Desktop windows (no mobile page scale) are unaffected. Screenshots: `$S/zoomshots/trial-wiggle16-t200-0.png`
  (×2.18, only "23 days warm / Level 12 / Good" visible) and `trial-drag16-t200-0.png` (×1.21, leaves cut at "2,2…", tab bar out of view)
  against `base-wiggle16-t200-0.png` (fits, scale 1).
- **State.** Today (status bar mounted) while a mobile browser window changes width several times within a fraction of a second.
- **Viewport / theme.** Phone widths 375–414 with 200 % text (also 150 % for rapid bounces); light (dark uses the same code path);
  Chromium mobile emulation. Real devices that resize live (Android freeform / desktop windowing, foldables, DeX): **UNKNOWN**.
- **Required correction.** Decide the row's mode without a layout in which the document becomes wider than the screen (e.g. measure the
  one-row width off-layout from the stats' intrinsic widths, or in a contained/clipped measuring copy), or at least never run the
  unwrap-and-measure while a viewport change is in flight (defer to the frame after the last resize event and skip it when the outcome
  cannot change, e.g. a row far wider than the screen). Keep the r1–r3 guarantees: D1/R2-D1 re-fit at 100 %, fallback fonts never decide
  a near miss, load CLS 0, D2 large-text behaviour.
- **Required retest.** At 200 % and 150 %, mobile viewport @2, both themes, ≥ 3 reps each: the zero-wait bounce, the 414↔376 back-and-forth
  drag, single 2 px/16 ms and 1 px/no-wait drags into 375, four zero-wait rotations — final `visualViewport.scale` = 1 and
  `visualViewport.width` = `innerWidth`. Plus the full D1/R2-D1 list at 100 % (expect `tight`, no overflow, tab bar at the bottom), the
  D2 matrix, `statusbar.spec.ts`, and load CLS (phones, 100 %, normal and slow fonts). Add a visual-viewport-scale assertion after rapid
  resizes to `statusbar.spec.ts`.

## Non-blocking notes (not graded)

1. **Pre-existing (same on M1 alone `3f00b57`, 4/4):** on desktop Today the warning's first frames are drawn at the stylesheet position
   (bottom 782) before the lift applies, its box overlaps "Put the kettle on" by ~4 px during the entry/layout animation, and M1's watcher
   takes it away and re-shows it once or twice within ~1.5 s. My first 1440 D3 batch inspected inside such a gap ("no warning"); a quiet
   re-run passed 17/18 with the same artefact. Owner: M1 / I04 F11 lift timing.
2. **Landscape @200 % break-over with the panel scrolled to the controls:** the lift now uses "Mark it done"'s top, so the room above can
   shrink to 0–23 px and a progress toast is almost entirely clipped (667×375: room 8–31; 568×320: 8–8). Controls are clear (base covered
   "Mark it done"). An I10 matter (whether `/focus` should raise these toasts at all).
3. With no carried task, break-over toasts now sit 8 px higher than base (the group includes `.overActions`' top margin). Harmless.
4. Today → break-over/brew transitions keep their known 2–7 low-opacity frames of the warning over the *exiting* layer (same class on
   M1 alone).
5. Pre-existing: at 320 px with 200 % text the layout viewport widens to 464 on both base and trial (not this diff).

## BLOCKED / UNKNOWN (never PASS)

- **BLOCKED:** real phones and real touch hardware; everything here is Chromium (Playwright) with CPU SwiftShader and emulated viewports
  (`isMobile`, touch, DPR 2).
- **UNKNOWN:** real OS text-size settings (Android font scale, iOS Dynamic Type); large text was simulated with `html { font-size }`.
- **UNKNOWN:** iOS Safari / WebKit behaviour of size container queries, a `column-reverse` scroll box, `position: sticky` inside it, and
  its page-scale handling on resize (R4-D2 is reproduced in Chromium's mobile emulation only).
- **UNKNOWN:** real window managers (Android freeform / desktop windowing, split screen, foldables, Stage Manager, Chromebook) producing
  the live resizes of R4-D2.
- **BLOCKED:** real assistive technology (announcement of the toast stack; note that each dismiss/re-show in R4-D1 re-adds the warning
  to the polite live region).
