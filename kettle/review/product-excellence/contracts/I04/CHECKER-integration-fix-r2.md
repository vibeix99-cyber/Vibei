# I04 integration fix (status bar at 375×667, long toasts at large text) · CHECKER r2

**Verdict: REJECT**

- **Reviewed commit:** `e932f65` (branch `pe/w1-fix-m2`, "I04 INTEGRATION FIX READY FOR REVIEW (r2)"). The code is in `0818962`;
  `e932f65:kettle/src` = `0818962:kettle/src` = `c87308471a001ec71237e28e6bf351dd8c8b89ae` (checked). The shipping change is r1 + r2:
  `git diff 1bec1a8 e932f65 -- kettle/src kettle/tests` (`StatusBar.tsx`, `Home.module.css`, `Toast.module.css`, `tests/a11y-probes.mjs`,
  new `tests/statusbar.spec.ts`). BEFORE for this round: `c9520db`.
- **Trial merge:** `db3418a` (integration + M1 `pe/w1-fix@3f00b57` + `e932f65`). I checked that its `flow.ts`, `Toast.tsx` and
  `integrity.spec.ts` are byte-identical to `3f00b57`, and its `StatusBar.tsx`, `Home.module.css`, `Toast.module.css` and specs to `e932f65`.
  Result: tsc clean, vitest 265/265, Playwright 50/50; M1's storage-full states are unchanged at 100 % text. **Both defects below
  reproduce on the trial merge** (R2-D1 3/3; R2-D3 was found there).
- **Checker:** independent; I did not build this and did not review r1. No application code, tests or maker files edited; nothing committed.
  Worktrees `/home/user/wt/chk-w1m2r2` (e932f65), `/home/user/wt/chk-w1m2r2-base` (c9520db), `/home/user/wt/trial-w1` (db3418a) are clean.
  Scratch (configs, probes, logs, shots): `/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/chk-w1m2r2/`
  (`$S` below). Vite configs were scratch-only (repo config + private cache, no HMR). Servers: Playwright 5238/5239/5235, probes
  5218/5219/5215, production preview 5228/5229 (and, after the CLS runs, an M1-only `git archive 3f00b57` copy on 5229). All stopped.

## Short version

The r2 changes do what they set out to do in the states the r1 Checker listed. The single-step resizes and rotations to 375×667
re-fit. Large text with big leaf totals no longer spills. The lone storage-full warning at 200 % is on screen with "Save backup"
working. 100 % layouts are unchanged in every case I compared except one: three stacked toasts at 568×320 (R2-D3). The CLS
disclosure is acceptable. The M1 interaction is as M2 says at 100 % text. Two defects remain in the same two fixes, and both are
in the exact states this round was meant to close:

- **R2-D1:** the status bar still never re-fits after resizes that do not change the bar's own box. Examples: a window
  narrowed gradually to 375, or one step from 380–385 px. The result is the D1 symptom again (2 px sideways scroll, tab bar
  below the screen; 17 px at 360). This reproduces deterministically.
- **R2-D3:** at 200 % on 375×667, when the warning shares the stack with another toast, the toast rows collapse instead of the
  list scrolling. The warning text overflows its own box and cannot be read, before or after scrolling. The real flow that
  produces this is a brew ended early while storage is full.

## What I ran (all re-run by me)

| Command / probe | Result | Log |
|---|---|---|
| `npx tsc --noEmit --pretty false` (e932f65) | exit 0 | `$S/tsc-head.txt` |
| `npx vitest run` (e932f65) | 26 files, **265/265** | `$S/vitest-head.txt` |
| `KETTLE_PORT=5238 KETTLE_PWA_PORT=5248 npx playwright test --project=chromium tests/a11y.spec.ts tests/statusbar.spec.ts tests/whistle.spec.ts --workers=2` | **22/22 passed** (5.8 min) | `$S/e2e-head.txt` |
| New `tests/statusbar.spec.ts` from my worktree against **c9520db** (`KETTLE_PORT=5239`) | **4 failed, 1 passed**. D1 fails in both themes with `414×896 → 375×667` giving `normal`. D2 fails in both themes with `375×667 200% text, 10000 leaves`, right edge 388. The fresh-load test passes, as it should on r1. | `$S/statusbar-on-c9520db.txt` |
| Trial `db3418a`: tsc, vitest | exit 0; 26 files, **265/265** | `$S/tsc-trial.txt`, `$S/vitest-trial.txt` |
| Trial: `KETTLE_PORT=5235 KETTLE_PWA_PORT=5245 npx playwright test --project=chromium tests/integrity.spec.ts tests/a11y.spec.ts tests/whistle.spec.ts tests/statusbar.spec.ts --workers=2` | **50/50 passed** (7.9 min). Includes all I03 "storage-full warning never covers a control" tests at 390, 375 and 1440, and a11y "a toast never covers the session controls or the summary footer". | `$S/e2e-trial.txt` |
| M1's `contracts/I03/capture-storage-full.mjs` on the trial (5215), six configs | Per-state toast/route/session results are **identical to M1's AFTER** (`/home/user/wt/w1fix/.../after-integration/*/capture-meta.json`) in all 6 configs, with 0 page errors. Pixel diffs against M1's AFTER: ≤ 0.5 % in session states. On Today and the summary the diffs are 2.8–8 %; I opened them and they come from clock- and date-driven copy ("Still up, Sam?" at 22:00, leaf totals). The toast rectangles are identical. | `$S/sf-m1script/` |
| My per-frame storage-full probe (`$S/probes/sf.mjs`): real quota fill, 375×667@2, 390×844@2, 1440×900@1, light and dark, 100 % and 200 %, on the trial | See D3 and the M1 interaction below | `$S/sf-trial.jsonl`, `$S/sf/`, `$S/sf2/` |
| D1 probe (`d1.mjs`): resize from 414×896, 667×375, 844×390, 390×844, 1440×900, 800×900 to 375×667, then back to 414; plus 6 rapid sequences. Both themes, 100 %, on e932f65 and c9520db; also 200 % on e932f65 | See D1 | `$S/d1-*.json` |
| D1 race probe (`d1race.mjs`): repeated sequences, gradual "drag" narrowing, single steps from 380/384, desktop windows | See R2-D1 | `$S/d1race-*.json` |
| D2 matrix (`d2.mjs`): 360×740, 375×667 and 390×844 at DPR 2 × 100/150/175/200 % × seed + leaves 2,296 / 9,999 / 10,000 / 12,345 / 45,678 / 99,999 / 123,456 / 470,000 set live + 2 fresh reloads, both themes. Also 100 % on c9520db. | **264 cells, 0 failures**. At 100 %, 66 of 66 cells are geometry-identical to c9520db. | `$S/d2-*.jsonl` |
| Load CLS (`cls.mjs`): `vite build` of e932f65 and c9520db into scratch, `vite preview` on 5228/5229, cold loads, 7.5 s, `.woff2` delayed 2.5 s or not | See the CLS decision | `$S/cls-light.jsonl`, `$S/cls-extra.jsonl` |
| Toast geometry (`toastgeo.mjs`, `toast()` imported in dev): Today, session and summary × short, long and three-stack × 375, 390, 320, 1440, 667×375 and 844×390 (plus 568×320, 640×360). c9520db against e932f65 at 100 %; e932f65 and c9520db at 125/150/200 %. | 100 %: **54 of 54 cases identical** at the six main viewports. Large text: see R2-D3. | `$S/toast-*.jsonl`, `$S/shots/toast/` |
| Finding 5 (`f5.mjs`, `f5auto.mjs`) on the trial: full tea breaks completed on `/focus`, newbie and veteran, 375 and 390; also with Settings › "Next brew" (autoStartFocus) on | See finding 5 | `$S/f5.json`, `$S/shots/f5*/` |
| Captures: `tools/capture.mjs --only 01,01b` on e932f65 (5218) at 390×844@2, 375×667@2 and 1440×900@1, both themes | capture-meta `revision: e932f65`, no errors. Against M2's r2 AFTER: ≤ 0.08 % (Chai idle frames). Against integrated `0d58c5e`: 390 and 1440 differ by 1.1–3.1 % (date-driven leaf totals, copy and recipes); 375 differs by 19–24 % (the restored single row). | `$S/caps/` |

## What I opened (Read tool, full size)

- REFERENCE K01 `…/VISUAL_BENCHMARK_LIBRARY/assets/current/01-home.png`.
- BASELINE `8f1044a` (`review/product-excellence/baseline/`):
  - `phone-375x667-light/01-home.png` and `01b-home-scrolled.png`;
  - `phone-375x667-dark/01-home.png`;
  - `phone-390x844-dark/01-home.png`;
  - `desktop-1440x900-dark/01-home.png`.
- INTEGRATED `0d58c5e` (`integration/wave1/captures/`):
  - `phone-375x667-light/01-home.png` and `01b-home-scrolled.png`;
  - `phone-390x844-light/01-home.png`;
  - `desktop-1440x900-light/01-home.png`.
- M2 r2 AFTER (`contracts/I04/integration-fix/r2/after/`):
  - `phone-375x667-light/01-home.png` and `01b`;
  - `phone-375x667-dark/01`;
  - `phone-390x844-light/01` and `phone-390x844-dark/01`;
  - `desktop-1440x900-light/01` and `desktop-1440x900-dark/01`.

  Also M2's `r2/d3-toast/toast-long-375x667-text200-light-{after,before}.png`, `toast-long-390x844-text200-dark-after.png` and
  `r2/d2-200/today-375x667-text200-12345-leaves-light-after.png`.
- Mine:
  - captures `$S/caps/phone-375x667-dark/01-home.png` and `$S/caps/phone-390x844-light/01b-home-scrolled.png`;
  - M1 compare: M1 AFTER `phone-375x667-light/s4a` against trial `$S/sf-m1script/phone-375x667-light/s4a`, and trial `desktop-1440x900-dark/s0`;
  - D1: `$S/shots/d1x/head-384-to-360-light.png` and `head-414-drag-to-375-light.png`;
  - finding 5: `$S/shots/f5/f5-375x667-light-newbie-2.png` and `$S/shots/f5auto/f5-375x667-light-newbie-2.png`;
  - toasts: `$S/shots/toast/toast-head-667x375-t150-light-today-{three,long}.png`, `toast-head-667x375-t200-light-today-long.png`,
    `toast-{head,base}-844x390-t200-light-today-three.png`, `toast-head-375x667-t200-light-today-three.png` and
    `toast-head-568x320-t100-light-summary-three.png`;
  - stacks: `$S/shots/stack/trial-375x667-light-t200{,-scrolled}.png` and `trial-earlyend-375x667-dark-t200{,-scrolled}.png`.

## Code review of the shipping diff (r1 + r2)

- **Listeners and cleanup: OK.** The `loadingdone` listener is added once and removed with the same `fit` reference on unmount.
  `ro.disconnect()` runs on unmount. Every `fonts.ready.then(fit)` is guarded by `live`, so it is harmless after unmount, and
  pending promise callbacks are released when the promise settles.
- **SSR and test environments: OK.** `useLayoutEffect` does not run on the server. The hook returns before touching
  `document.fonts` when `ResizeObserver` is missing, and `document.fonts?.` is optional.
- **Loops and oscillation: none.** `fit` always resets and re-derives the state, so a second pass at the same width reaches the
  same state and the ResizeObserver goes quiet. In 12 rapid sequences × both themes I counted 0 further attribute mutations in a
  3 s idle window and no ResizeObserver or page errors. While fonts are loading, the state can only escalate to `wrap`.
- **Resize race (R2-D1).** `fit` is triggered only by the ResizeObserver on the bar and its three stats, plus font events. In
  `normal` mode below about 385 px, the bar is already at its min-content width: 369 px, because the hero's auto grid track grows
  to it. So narrowing the screen further changes neither the bar nor any stat, and nothing calls `fit`. The font retry added in r2
  is correct but does not cover this.
- **D2 CSS.** `.statLevel { width: 56px; min-width: max-content }` is correct. At 100 % the column stays 56 px in every cell, up
  to "Level 100". At large text it grows (68 / 80 / 90 / 103 px). In landscape, where `.statLevel` is `display: none`, it has no
  effect.
- **Toast CSS (R2-D3).** At 100 % on the six main viewports it is inert: 54 of 54 rectangles are identical to c9520db, including
  landscape and 320. The container-query threshold (`106px + 11em` = 282 px at 16 px) is below every phone's toast width at
  100 %, and the query does not apply at 1440 below about 150 %. However, the new `max-height: 100%` / `min-height: 0` cap
  combined with the existing `.toast { min-height: 52px }` lets the grid's auto rows shrink to 52 px when the stack is taller
  than the room. The rows collapse and each toast's text overflows its own box; the list never gets a reason to scroll. This
  happens inside and outside the container query, and at 568×320 even at 100 % text.
- **Sticky action and scroll.** With a single long warning this works: the list scrolls (scrollTop 0 → 28), "Save backup" stays
  sticky, hit-tests as itself and downloads. The 8 px box-shadow mask hides the text behind the action.

## Per-criterion findings

| Criterion | Finding |
|---|---|
| **D1: re-fit after resize or rotation to 375×667, 100 %** | **Required sequences PASS; residual FAIL (R2-D1).** e932f65, both themes, from 414×896, 667×375, 844×390, 390×844, 1440×900 and 800×900: `tight` (6 px), one row, `scrollWidth = clientWidth = innerWidth = 375`, visual viewport 375×667 at scale 1, tab bar bottom 667, greeting at y = 64. Back at 414: `normal` (12 px). On c9520db the same probe gives `normal` and 377/671 from 667×375, 844×390 and 800×900 (and 414 in dark), and stays `tight` at 414 after returning. At 200 % every path gives `wrap` with no overflow. Rapid sequences: no oscillation; 23 of 24 end correct, and 1 of 10 repeats of a 9-step zero-wait bounce stays `normal` (same root cause as R2-D1). **But single steps from 380 or 384 px, and any gradual narrowing into 375 (or 360), leave the row unfitted. See R2-D1.** |
| **D2: "Level NN" at large text** | **PASS.** 264 cells, both themes: no stat or text past the screen edge, `scrollWidth ≤ clientWidth`, `innerWidth` equal to the viewport, tab bar on screen, tab labels unclipped, and no label spilling out of its pill. 100 %: 375 is one `tight` row (9,999 fits `normal`); 390 is one `normal` row (`tight` from 123,456); 360 is one `tight` row. All 66 cells at 100 % are geometry-identical to c9520db. The spec reproduces the r1 failure on c9520db (388 px right edge). |
| **D3: warning at 200 % on phones** | **Single warning PASS; stacked FAIL (R2-D3).** Alone on Today (trial, both themes): 375×667 is 8–324 and scrolls 28 px; 390×844 is 194–501; 1440 is 497–764. All are fully on screen and clear of the dock (dock top 334 / 511 / 774). "Save backup" is visible, hit-tests and downloads; the list scrolls to the end and the page does not move. On M1 alone (`3f00b57`) the same state puts the toast top at −380 and "Save backup" at y −48, and the click times out, so the r1 defect is confirmed and fixed for this state. **With one or two other toasts the warning cannot be read. See R2-D3.** |
| **CLS, disclosure (a)** | **Acceptable, not a regression.** See the decision below. |
| **Finding 5 (ordinary toasts on the session screen)** | **The premise of the packet is inaccurate; I do not grade it as blocking.** See below. |
| **Interaction with M1, disclosure (b)** | **Verified at 100 %.** `protectedUnderToasts()` in the trial reads `live` (horizontal extent), `toastLiftBottom()`, `region.bottom` (only without a lift) and the drawn warning's rectangle. It never reads `region.top`. The six-config M1 capture states are identical to M1's AFTER. My per-frame probe at 100 % shows 0 frames over the readout, controls, summary footer or docked start on phones; on desktop the warning is beside the panel with 0 overlap; it is never lost (shown on Today after Skip break in every config). **At 200 %** the drawn rectangle changes, because the warning is now shorter and on screen. M1's rule still behaves exactly as on M1 alone. Both trees show the same two short transients: about 0.25 s over the session readout when a brew starts with the warning just raised (375×667), and about 0.25 s over the desktop readout on Resume. These belong to M1's 170 px zone assumption, not to this diff (see notes). |

### CLS decision (disclosure a): acceptable

Production builds, cold loads, light (dark identical). "Counted" is Chrome's CLS, which excludes shifts flagged `hadRecentInput`.
"All" adds every layout shift, including those Chrome flagged although no input was sent. Chrome flags every shift in the first
≈ 0.5 s after navigation and every shift that coincides with a layout-viewport size change.

| Case | 390×844 c9520db → e932f65 | 375×667 c9520db → e932f65 |
|---|---|---|
| 100 %, normal fonts, 3 runs | counted 0 → 0; all 0.098 → 0.098–0.100 | counted 0 → 0; all 0.121 → 0.121 |
| 100 %, fonts +2.5 s | counted 0 → 0; all 0.169 → 0.169 | counted 0 → 0; all 0.273 → 0.273 |
| 200 %, normal fonts | counted 0 → 0; all 0.263 → 0.224 | counted 0 → 0; all 0.328 → 0.279 |
| 200 %, fonts +2.5 s | counted **0 → 0.147**; all **0.582 → 0.371** | counted **0 → 0.082**; all **0.589 → 0.361** |
| 360×740 200 % +2.5 s | counted 0 → 0.100; all 0.49–0.56 → 0.142 | |
| 1440×900 200 % +2.5 s | counted 0.094 → 0.094 (same reflow on both) | |

On c9520db at 200 % with slow fonts, the unwrapped row widened the layout viewport to **570 px** for about 2.5 s. Today was drawn
zoomed out and the tab bar jumped 763 → 0 → 763. Chrome treats the viewport resize as input, so it scored those shifts as 0. On
e932f65 the layout viewport stays at 390 (at 375 there is a 2 px blip to 377). The counted 0.08–0.15 is the font-swap reflow at
200 %. Desktop shows the same reflow, 0.094, on both revisions.

So:
- total movement is lower in every 200 % case;
- it is identical at 100 %;
- the required phone 100 % cases, including slow fonts, stay at counted 0.

A real user sends no input during load. This is therefore not a regression against I04 or I14.

Pre-existing, on both revisions: at 100 % with slow fonts the layout viewport briefly widens to 404 px during the 2.5 s font wait
at both 390 and 375. Something other than the status bar overflows with the fallback fonts. Noted, not graded.

### Finding 5: M2's no-change decision

The packet says no ordinary toast appears on the session screen and nothing covers a running countdown. My evidence on the trial
(newbie, full tea breaks completed on `/focus`):

- **Default settings.** Completing the fifth full break raises "New badge: Tea Time" on the **break-over view**, at 410–462
  (375×667) and 553–605 (390×844). It covers the lower half of the "Break's over" title for 3.2 s. No control is covered and
  nothing is counting down.
- **With Settings › "Next brew" on (`autoStartFocus`).** The same toast lands on the **running next brew**: 439–491 against a
  readout of 344–493 at 375, and 593–645 against 466–635 at 390. It covers "Kettle's on. Nice start. Whistles at 4:10 PM" for 3.2 s
  while the countdown runs. The digits stay visible and the controls stay clear. Recipe and level toasts follow the same path
  (`announce(…, completedFocus=false)` for a break record).

My judgement: the no-change decision rests on an incomplete premise. The impact is small: a polite toast for 3.2 s, the digits
readable, no control covered. The behaviour is identical in the approved I04 r1 and in c9520db. I therefore do not grade it as a
defect of this round.

Because this round is rejected anyway, I recommend that the next round either holds non-urgent progress toasts while `/focus` is
showing a running timer and replays them on the summary or on Today, or keeps the lift clear of the readout on phones. The packet's
claim should also be corrected.

## Preservation (PRESERVE_LIST + I04 approval)

| Item | Result |
|---|---|
| Docked start "Put the kettle on · 25 min" | Unchanged at 375, 390 and 1440, both themes. The warning and ordinary toasts float above it at 100 %, and it hit-tests while the warning is up, at 100 % and 200 %. |
| Sky "Change brew length" link and its discovery | Present and unchanged at 375 and 390 in both themes (01, 01b); absent on desktop, as approved. |
| Five wrapping categories, 15 / 25 / 50 / Custom | Unchanged (01b at 375 and 390; 01 at 1440). |
| Cream / purple identity, stat colours (persimmon, matcha, honey) | Unchanged. |
| Approved Chai | Unchanged. |
| 100 % layout elsewhere | Status bar 66 of 66 cells identical to c9520db. 390 and 1440 01/01b equal integrated `0d58c5e` except date-driven data. 375 is the restored baseline single row: greeting at y = 64, 6 px pill padding. Toasts: 54 of 54 identical at the six main viewports. The only 100 % change found is the three-toast stack at 568×320 (R2-D3). |
| I01 / I02 / I03 gates | Trial e2e 50/50: integrity (I01, I02, I03), a11y and whistle. |

## Defects (REJECT)

### R2-D1: after a resize that does not change the bar's own box, the status bar never re-fits, and Today scrolls sideways

- **Exact defect.** `useWrapWhenCrowded` runs `fit` only from the ResizeObserver on the bar and its three stats, plus font
  events. Between about 385 px and the overflow point, the `normal` row is already at its min-content width: the bar stays 369 px
  and the stats stay [126, 109, 126] px. Narrowing the screen further therefore changes no observed box. No callback fires, the
  row stays `normal` and overruns.
  - **384×854 → 375×667 in one step:** stats end at x = 377, `scrollWidth` 377 > `clientWidth` 375, layout viewport 377×671, tab
    bar bottom 671 on a 667 screen. That is exactly the D1 symptom. A fresh load at 375 gives `tight` and ends at x = 367.
  - **384×854 → 360×740:** `scrollWidth` 377 on a 360 screen (17 px), layout viewport 377×775, tab bar bottom 775 on 740.
  - Reproduction rates:

    | Sequence | e932f65 |
    |---|---|
    | single step from 384 | 6/6 light, 4/4 dark |
    | single step from 380 | 6/6 |
    | gradual narrowing 414 → 375 (2 px per 16 ms) | 8/10 light, 9/10 dark |
    | gradual narrowing 414 → 374 (1 px per 20 ms) | 5/6 light, 4/4 dark |
    | desktop window 420 → 375 (1 px steps) | 6/6, horizontal scrollbar (`scrollWidth` 377 > 375) |
    | desktop window 500 → 375 (5 px steps) | 5/6 |
    | trial merge, step from 384 | 3/3 |

  - c9520db behaves the same (step 6/6, drag 6/6). The mechanism is pre-existing, but it sits in the code path this round
    changed, and it is the D1 symptom reached by a resize.
  - The 1-in-10 failure of the zero-wait bounce is the same cause: the font retry ran at an intermediate 390 px, and the final
    375 px matched the last box the observer had seen.
- **State.** Today, veteran data (2,236 leaves; any total that is `normal` at 380–385), 100 % text, after the window narrows into
  375 (or 360) from 377–385 px, or gradually from wider. Real-world paths are windows that resize continuously: tablet, desktop or
  Chromebook windows, split-screen dividers, devtools. Phones that load or rotate into 375 are fine.
- **Viewport / theme.** 375×667 at DPR 2 (also 360×740), light and dark, mobile viewport; and desktop windows at 375 wide.
- **Required correction.** Re-run the fit whenever the screen width changes, not only when the bar's own boxes change. For
  example, also observe a box whose width always follows the viewport (`document.documentElement` or the Today screen container)
  with the same observer, or listen to `resize` / `visualViewport` `resize` and clean up on unmount. Keep the r2 rules: retry
  after fonts load, and no fallback-font near-miss decisions.
- **Required retest.**
  - Both themes, 100 %, mobile viewport at DPR 2, expecting `tight`, one row, `scrollWidth = clientWidth = innerWidth` = width,
    and tab bar bottom = height:
    - single steps 384×854 → 375×667, 380×800 → 375×667 and 384×854 → 360×740;
    - gradual narrowing 414 → 375 in 1–2 px steps;
    - rapid back-and-forth sequences;
    - the existing D1 list.
  - Desktop window 420 → 375 in 1 px steps: no horizontal scrollbar.
  - 375 → 414 returns to `normal`; 200 % still wraps.
  - Add a stepwise-narrowing case and a from-384 case to `tests/statusbar.spec.ts`.
  - Repeat phone load CLS at 100 %, including slow fonts (must stay counted 0), and the 375×667 01/01b captures in both themes.

### R2-D3: at 200 % text, a storage-full warning stacked with other toasts collapses and cannot be read

- **Exact defect.** The new `.live { max-height: 100% }` / `.list { min-height: 0 }` cap, combined with the existing
  `.toast { min-height: 52px }`, makes the list's auto grid rows shrink toward 52 px when the stack is taller than the room. The
  rows collapse instead of the list scrolling. The toast boxes get shorter than their text, and the overflowing text is drawn
  outside the toast background: white on cream in light, dark brown on purple in dark, over the greeting.
  - **Real flow on the trial merge.** Storage full, then a brew ended with End.
    - Within the first minute, Today shows "Kettle's off. See you soon." + the warning. The warning box is 211 px tall for 284 px
      of message: "…storage is full" is visible, then "Save backup" over the rest, and "backup to keep them." spills outside the
      box. Scrolling the list (449 / 316) shows the same unreadable spill.
    - After 12 minutes, Today shows "Cozy level 5!" + "Saved 12 minutes of focus" + the warning. The box is 147 px for 284 px;
      only "Kettle couldn't save your latest chang…" is readable.
  - "Save backup" itself stays visible and works. The same flow on M1 alone puts the stack off the top of the screen, so this is
    not a regression, but D3 is fixed only for the warning shown alone.
  - The same mechanism appears elsewhere:
    - 667×375 at 150 %, where the container query is off: a single warning box of 158 px for 185 px of text, with the first
      line above the screen edge and "them." below the box;
    - 667×375 and 844×390 at 125–200 % with stacks;
    - **at 100 % text**, 568×320 with three toasts: the warning box is 52–59 px for 77 px of text. This is the only 100 % change I
      found; c9520db put the top toast off-screen there instead.
- **State.** Today (and session or summary) whenever the stack is taller than the space above the lifted bottom: the warning
  plus one or two other toasts at 200 % on 375×667; landscape phones from 125 %; 568×320 at 100 % with three toasts.
- **Viewport / theme.** 375×667 at DPR 2, 200 %, light and dark (primary); 667×375 and 844×390 at 125–200 %; 568×320 at 100 %.
- **Required correction.** Toasts must keep their content height while the list scrolls, for example rows sized `max-content`
  or toasts that do not shrink. Then:
  - every toast's text stays inside its own box at every text size;
  - a stack taller than the room scrolls inside the region, as the packet intends;
  - the warning's whole message is readable by scrolling, with "Save backup" visible and working;
  - 100 % geometry at the six main viewports stays identical to c9520db.
- **Required retest.**
  - Configs: 375×667@2, 390×844@2 and 1440×900@1, both themes, 100 / 150 / 200 %.
  - States: the warning alone, and the real early-end flows (within one minute; after 12 minutes with a level-up). For each:
    message height ≤ toast box, text fully reachable by scrolling the list, "Save backup" hit-tests and downloads, docked start
    clear.
  - Landscape 667×375 and 844×390 at 125 / 150 / 200 %, and 568×320 at 100 %, with three toasts: no text outside its box.
  - Re-run M1's `capture-storage-full.mjs` at the six configs, and `tests/integrity.spec.ts`, `a11y.spec.ts` and
    `statusbar.spec.ts` on a fresh trial merge with `3f00b57`.

## Non-blocking notes (not graded)

1. **200 % transients from M1's hold rule (owner I03/M1).** They appear identically on M1 alone (`3f00b57`) and on the trial.
   `TOAST_ZONE_PX = 170` is smaller than a 200 % warning (267–330 px), so the rule only sees the overlap once the warning is drawn.
   - 375×667: when a brew starts while a fresh failure raises the warning, it fades in to opacity 0.98–1.0 over the readout for
     about 0.25 s, then is held.
   - 1440×900: on Resume it sits at full opacity over the readout for one 250 ms tick, then fades.

   Not introduced by this diff.
2. **Lift timing at 200 % (pre-existing I04 F11).** On Today the first ~150–300 ms of a toast are drawn at the stylesheet bottom
   (tab bar + 118 px), which at 200 % overlaps the taller docked start until the measured lift applies. 390×844: 7–9 frames.
3. **Pre-existing and identical on c9520db:** at 320 and in landscape, ordinary toasts on the summary cover "Done / Carry forward";
   on desktop at 150–200 % they cover "How your leaves added up".
4. `statusbar.spec.ts` "normal text … 375 (tight)" depends on the date-seeded leaf total. At 9,999 leaves 375 legitimately fits
   `normal`, so the test could fail on some dates. This is a mild fragility, not a defect.

## BLOCKED / UNKNOWN (never PASS)

- **BLOCKED:** real phones and real touch hardware. Viewports were emulated (DPR 2, `isMobile`, touch) in Chromium with the CPU
  SwiftShader renderer.
- **UNKNOWN:** real OS text-size settings, including Android font scale and iOS Dynamic Type. Large text was simulated with an
  `html { font-size }` override.
- **UNKNOWN:** iOS Safari's handling of a `position: sticky` action inside an `overflow-y: auto` list, and its rotation and resize
  timing. Verified in Chromium only.
- **BLOCKED:** real assistive technology (screen-reader announcement of a stacked or scrolled warning). Only the DOM and the polite
  live region were checked, via the a11y spec.
- **UNKNOWN:** real window managers (iPad Stage Manager, Android freeform or split-screen, Chromebook) producing R2-D1's gradual
  resizes. Reproduced with emulated viewport steps only.
