# I04 integration fix — Today's stats wrap at 375×667 · READY FOR REVIEW (r2)

> **r2 (this revision)** answers Checker r1's REJECT (`CHECKER-integration-fix-r1.md`, D1 and D2) and the I03 checker's
> routed finding D3 (long toast at 200 % text) and note 5. See **"r2"** at the end. The r1 text below is kept as it was
> submitted at `c9520db`.

- **Maker:** M2 · branch `pe/w1-fix-m2` · worktree `/home/user/wt/w1fix-m2/kettle`
- **Revision:** the commit that adds this file (`I04 INTEGRATION FIX READY FOR REVIEW: …`). **Base:** integration HEAD
  `1bec1a8`. Code change: commit `3bc0c66` (2 files). The later commits on this branch add evidence plus a fix to a
  test helper (`tests/a11y-probes.mjs`, see "Audit tool correction"). **App source is identical from `3bc0c66` to the
  final commit:** `git rev-parse <rev>:kettle/src` = `57f00c464f3339859c604f9f5112687f0d60210a` for `3bc0c66`,
  `d3f4e06` and the final commit. The capture-meta `revision` values below (`3bc0c66`) point at that source tree.
- **Proposed state:** **FIXED**.

## Defect (reported by the orchestrator, `contracts/I04/home-top-phone-375x667-{light,dark}.png`)

On Today at 375×667, normal (100 %) text, both themes, the status bar wrapped. "Level 12" dropped onto a second row,
"leaves" was pushed to the right, and the greeting moved down by about 50 px. At 390×844 the bar stayed on one row.
In the `8f1044a` baseline, 375×667 is also one row.

## Cause (measured)

My I04 F6 hook wrapped the bar as soon as any stat reached past the screen edge. At 375 px the three stats only just
fit: on one line they need 126 + 108 + 126 px + 2 × 4 px of gap = **368 px** in a 359 px bar (the bar's −8 px side
margins). Ending at x = 376 on a 375 px screen, the row was **1 px over**, so it wrapped.
- **Why the data matters:** the numbers are date-dependent. On 2026-10-07 the leaves stat read "2,361" (106 px wide),
  the row needed 366 px, ended at 374 and stayed on one row. That is what my approved 375 captures showed. With
  "2,296" (108 px) on 2026-10-08 it tipped over. A 2 px change in one number should not change the layout.
- **Probe:** `.tmp/w1fix/nowrap.mjs`, run on `1bec1a8`: bar right edge with the row forced onto one line was 376 at
  375 px and 382 at 390 px.
- **Stale capture-meta:** when I recaptured 01/01b at 375 for 2becb78, I merged those states into the existing
  capture-meta. The top-level `revision` field still read `651bc54+dirty`; only the per-state notes recorded the
  recapture. The captures in this packet are fresh folders with their own meta.

## Fix (`src/screens/home/StatusBar.tsx`, `src/screens/home/Home.module.css`)

A measured three-step ladder in place of a single wrap decision. Each step is tried only if the previous one still
ends past the screen edge:

1. As designed, with 12 px pill padding.
2. **`data-tight`**: the 6 px pill padding that the existing 320 px layout already uses (`@media (max-width:
   359px) .stat { padding: 0 6px }`). This saves 36 px. Same row, same height, nothing below moves.
3. **`data-wrap`**: only when it still cannot fit, e.g. at 200 % text (needs about 470 px).

Kept from F6:
- The decision is made with the real fonts only, so a fallback-font wrap/unwrap cannot cause layout shift.
- The decision is measured against the screen edge.
- 200 % text and 320 px reflow results are unchanged.

There is no new token, colour, copy or component. The order, size and colours of the stats are unchanged.

## Evidence

Captures of Today 01 and 01b, made on `3bc0c66` (capture-meta `"revision": "3bc0c66"`, no `+dirty`), with
`review/product-excellence/tools/capture.mjs`. All of them were opened and checked:
`contracts/I04/integration-fix/after/{phone-390x844,phone-375x667,desktop-1440x900}-{light,dark}/01-home.png` and
`01b-home-scrolled.png` (phones at DPR 2, desktop at DPR 1).

**Comparison, REFERENCE / ORIGINAL BASELINE / INTEGRATED (defect) / AFTER**, side by side:
`contracts/I04/integration-fix/compare/today-phone-375x667-{light,dark}.png` and `today-phone-390x844-light.png`.
The four panels are:
- K01 (`VISUAL_BENCHMARK_LIBRARY/assets/current/01-home.png`, 390×844)
- baseline `review/product-excellence/baseline/<config>/01-home.png` (8f1044a)
- the orchestrator's integrated capture (`1bec1a8`)
- this fix

| Check | Integrated `1bec1a8` | After fix |
|---|---|---|
| Status bar at 390×844, 100 % (light/dark) | one row | **one row**, `normal`; greeting top at 64 px (unchanged) |
| Status bar at 375×667, 100 % (light/dark) | **two rows**; greeting about 50 px lower | **one row**, `tight`; greeting top at 64 px, the same as 390 and the baseline |
| 360×740, 100 % | — | one row, `tight` (no sideways scroll; page width 360) |
| 320×568, 100 % (reflow) | one row (320 layout) | one row; page width 320 |
| 200 % text at 390 and 375 | wraps | **wraps** (2 rows), no sideways scroll |
| 1440×900 at 100 % / 200 % | one row / two rows from the existing desktop CSS | unchanged |

Sources: `integration-fix/statusbar-modes.txt` (`.tmp/w1fix/statrow.mjs`, dev server on this tree) and
`integration-fix/reflow/today-{360x740,320x568}-text100-light.png`, `today-{390x844,375x667,320x568}-text200-light.png`.
All screenshots were opened.

**CLS on a cold Today load**, production build of this source, 5 runs each, layout shifts without input over the
first 6 s (`integration-fix/cls-today-load.txt`, `.tmp/w1fix/clsprobe.mjs`):
- 390×844: **0** in all runs, mode `normal`
- 375×667: **0** in all runs, mode `tight`
- 360×740: 0, `tight`
- 1440×900: 0
- 200 % text: 390/375/360 give 0 in 3/3 runs (`wrap`); 1440 gives 0.00003.

**"Change brew length" on short phones** (`integration-fix/discovery/`, screenshots + `results.txt`):
- The link is visible on load (375×667 at y = 565, 390×844 at y = 742, 320×568 at y = 466).
- One tap scrolls the 15/25/50/Custom control clear of the docked start and focuses "25 min":
  - 375×667: 190–288 against a dock top of 330
  - 390×844: 278–379 against 421
  - 320×568: 141–239 against 281
- The same holds with reduced motion.

**Home hierarchy and colour semantics** are unchanged. Comparing the panels shows:
- the greeting, Chai and bubble, goal card, composer, the orange docked start with "· 25 min", and the tab bar keep
  the baseline's positions;
- the stats keep their colours (orange streak, green leaves, honey level).

At 375 the only visible difference from the baseline is 6 px less pill padding at the row's two ends. Differences in
data and copy ("2,296" leaves, "Lovely work so far.") come from the date and the integrated M1 copy, not this change.

**Accessibility audit for Today**: production build of this source, 390×844 and 375×667, both themes. Suites: main,
320 reflow, 200 % text (390/375/1440), keyboard-open, reduced motion. States: home, home-custom, home-typing. Report:
`integration-fix/audit-today/audit.md` + `audit.json`.
- **axe: 0 serious/critical.** The one target-size node per config is the known scroll-dependent case that passes
  scrolled clear, as in the approved audit.
- 114 targets, none under 24 px.
- 15 contrast rows measured, all pass.
- No horizontal scroll in any suite.
- Nothing covered except the "Skip to content" link, which is off-screen until focused (by design).
- The only clipped text is the known placeholder hint.
- Reduced motion keeps every fact (64/64 lines).

These results are identical to the approved `audit-after` rows for these states.

### Audit tool correction (test helper only)

On its first run, the audit flagged "Brew length" and "Tea break length" in the custom-rhythm sheet at 1440 / 200 % as
clipped (1/179 px). These are the steppers' intentional `.sr-only` labels (`NumberStepper hideLabel`). The probe skips
`.sr-only` boxes by their on-screen width (≤ 1 px), but inside a sheet that is still scaling in, that width read just
over 1 px. `tests/a11y-probes.mjs` now uses the layout size (`clientWidth`/`clientHeight` ≤ 1) instead. The rerun is
clean. No app change.

## Commands (final tree)

```
npx tsc --noEmit --pretty false                                                   → clean
npx vitest run                                                                    → 26 files, 265 tests passed
KETTLE_PORT=5222 KETTLE_PWA_PORT=5232 npx playwright test tests/a11y.spec.ts --project=chromium → 9 passed (8.1 min)
node review/product-excellence/tools/capture.mjs --base http://127.0.0.1:5202 --out <…>/integration-fix/after/<cfg> \
     --w W --h H --dpr N --theme light|dark --only 01,01b                         (6 configs)
node review/product-excellence/tools/a11y-audit.mjs --base http://127.0.0.1:5242 --out <…>/integration-fix/audit-today \
     --suites main,reflow,text200,keyboard,motion --configs 390x844@2,375x667@2 --only home,home-custom,home-typing
node .tmp/w1fix/clsprobe.mjs http://127.0.0.1:5242 5      (and 200 % text variant, 3 runs)
```

The dev server for the captures and Playwright was `npx vite --config .tmp/w1fix/vite.dev.config.ts` on ports 5202
and 5222: the repo config plus the symlinked `node_modules` real path on the allow list. The build was `npx vite
build` served by `vite preview` on port 5242. All servers have been stopped.

## Preservation

- I did not touch M1's files (`src/app/flow.ts`, `src/ui/Toast.tsx`).
- The five wrapping categories, 15/25/50/Custom, the docked start and its "· 25 min", and the "Change brew length"
  link are unchanged.
- No new onboarding or dependency.

## BLOCKED / UNKNOWN

- **UNKNOWN:** real phones with OS-level text sizes between 100 % and 200 %. Those are decided by the same
  measurement: tight first, wrap only if still over. Manual step: `docs/REAL_DEVICE_CHECKLIST.md` 9.5.

---

## r2

- **Revision:** the commit that adds this section (`I04 INTEGRATION FIX READY FOR REVIEW (r2): …`). The r2 code is in
  `0818962`. The final commit adds evidence only. The app source is the same in `e1e672d` (the orchestrator's
  preservation commit), `0818962` and the final commit: `kettle/src` tree `c87308471a001ec71237e28e6bf351dd8c8b89ae`.
  Base for review: `c9520db` (r1).
- **Files:** `src/screens/home/StatusBar.tsx` and `src/screens/home/Home.module.css` (D1, D2),
  `src/ui/Toast.module.css` (D3, CSS only), and the new `tests/statusbar.spec.ts`. I did not touch `Toast.tsx`,
  `flow.ts` or `integrity.spec.ts`.
- **Proposed state:** **FIXED**.

### D1: after a resize or rotation to 375×667, the row stayed "normal" and overran the screen

- **Cause** (confirmed by the Checker's trace): `fit()` returned early while `document.fonts.status` was
  `"loading"`. Chromium reports that for a moment on every viewport change. The only retry was the single
  `fonts.ready` callback registered at mount, so the decision was dropped.
- **Fix:**
  - A bail never drops the decision. Each bail re-arms `document.fonts.ready.then(fit)`, and a `loadingdone` listener
    lives as long as the hook.
  - Fallback fonts still never decide a near miss, so load CLS stays 0.
  - New rule: a row that is more than 40 px too wide even in `tight` (large text) wraps at once, before it is
    painted. No font swap can rescue it, and deciding before paint removed a 0.22 shift at 200 % text (CLS below).
- **Retest:** `r2/d1-resize.txt` and screenshots `r2/d1-resize/*` (before = `c9520db`, after = fix), plus
  `r2/matrix-fix.txt` §D1.
  - Each start size was resized to 375×667, then back to 414×896. Start sizes: 414×896, 667×375 (rotation),
    844×390, 390×844, and desktop windows 1440×900 and 800×900. Both themes.
  - Result: `tight`, one row, `scrollWidth = clientWidth = innerWidth = 375`, tab bar bottom at 667. Going back to
    414×896 returns to `normal`.
  - At 200 % text the resize gives `wrap`, staying `wrap` at 414.
  - `c9520db`, same sequences: `normal`, `scrollWidth` 377, `innerWidth` 377×671, tab bar bottom at 671.

### D2: at 200 % text, "Level NN" spilled out of its 56 px column and past the screen edge

- **Fix** (`Home.module.css`): `.statLevel { width: 56px; min-width: max-content }`. At 100 % text the label is
  narrower than 56 px, so the column stays 56 (measured `lvl56` in every 100 % cell). With large text it grows to the
  label (68 px at 150 %, 80 px at 175 %, 90 px at 200 %, 103 px for "Level 100"). Each pill's box now contains its
  label, so the ladder measures the real width. No colour, order or 100 % change.
- **Retest:** `r2/matrix-fix.txt` §D2. Grid: 375×667, 390×844 and 360×740 × text 100/150/175/200 % × leaves 2,296 /
  9,999 / 10,000 / 12,345 / 123,456 / 470,000 (set live) × both themes = 144 cells.
  - **No cell has a stat or label past the screen edge**, and every cell has `scrollWidth ≤ clientWidth`,
    `innerWidth` equal to the viewport and the tab bar's bottom on screen.
  - At 100 %: 375 is one `tight` row (9,999 fits `normal`), and 390 is one `normal` row (`tight` from 123,456).
  - The matrix flags 2 cells only because I wrote it to require one row at 360 as well. 360×740 at 100 % with 470,000
    leaves wraps to 2 rows with no overflow. `c9520db` does the same (`r2/360-470000-c9520db-vs-fix.txt`): on one
    row it would need 363 px.
  - Screenshots at 200 % with 12,345 leaves, 375 and 390, both themes, before and after: `r2/d2-200/*`. Before, at
    375, "Level 2…" is cut and the page is 388×689. After, "Level 24" sits whole on the second row and the page is
    375×667. All opened.

### Regression test (`tests/statusbar.spec.ts`, new)

- Resize or rotation to 375×667 re-fits to one `tight` row with no sideways scroll and the tab bar on screen. Covers
  414×896, 667×375 and 844×390, back to 414 = `normal`, and a desktop window narrowed to 375. Both themes.
- 150 % and 200 % text with 2,296 / 10,000 / 123,456 / 470,000 leaves at 375, 390 and 360: nothing past the screen
  edge and no sideways scroll. Both themes.
- 100 % text on a fresh load: one row at 390 (`normal`) and 375 (`tight`).

Results:
- **On `c9520db`: 4 failed, 1 passed** (`r2/statusbar-spec-on-c9520db.txt`). D1 fails in both themes with "414×896 →
  375×667: normal". D2 fails in both themes with "375×667 200 % 10,000 leaves: right edge 388". The fresh-load test
  passes, as it should on r1.
- **On the fix: 5 passed** (`r2/specs-a11y-statusbar-on-fix.txt`, together with `a11y.spec.ts`: 14/14).

### D3: a long warning toast at 200 % text rose past the top of the screen (routed from the I03 checker)

- **Reproduced on `c9520db`** (`r2/d3-toast.before.txt`, screenshots `r2/d3-toast/*-before.png`): the storage-full
  text with "Save backup", on Today.
  - 390×844 at 200 %: 705 px tall, top at −203.
  - 375×667 at 200 %: top at −380, and "Save backup" itself off screen at y = −48.
  - At 150 %: 350 / 381 px tall, one word per line beside the action.
- **Fix, `src/ui/Toast.module.css` only:**
  - The region now spans from the top safe edge (`top: env(safe-area-inset-top) + 8px`). The stack sits at its bottom
    as before (`align-items: flex-end`), and `.live` is a column capped at the region's height.
  - When the text is large for the width (container query on `.live`: below 106 px + 11 em, which is 282 px at 100 %
    and so below every phone's toast width) three things change:
    - the message keeps the full width beside the icon, and the action moves under it, right-aligned;
    - a stack taller than the room left scrolls inside its rounded box, with `overscroll-behavior: contain`;
    - the action is `sticky` at the bottom, so "Save backup" stays in view while a long message scrolls.
  - `Toast.tsx` and `flow.ts` are unchanged. `Toast.module.css` is identical in `1bec1a8` and M1's `3f00b57`.
- **Retest** (`r2/d3-toast.after.txt`, screenshots `r2/d3-toast/*-after.png`, opened):

  | Viewport | Text | Theme | Result |
  |---|---|---|---|
  | 390×844 | 200 % | both | 308 px, top at 194, fully on screen, action below the text, clear of the docked start (dock top 511) |
  | 375×667 | 200 % | both | top at 8; the whole message is visible; the 28 px that does not fit scrolls (touch drag on the toast scrolls it to the end, the page stays put; wheel too); "Save backup" visible, hit-tests as itself, works by tap and by keyboard Enter (`r2/d3-toast-scroll.txt`) |
  | 1440×900 | 200 % | both | 267 px, action below |
  | 390 / 375 | 150 % | both | 212 px, action below |

  - **100 % text is unchanged:** identical boxes at 390, 375, 320 and 1440 in both themes. The pixel diff of the
    screenshots, before against after, is 0.00–0.02 % (`r2/d3-toast-pixel-diff.txt`; the 0.02 % is Chai's idle
    animation, rows 209–292, not the toast).
- **With M1's approved `Toast.tsx` / `flow.ts`** (scratch tree = `pe/w1-fix@3f00b57` + my three r2 files):
  - the same toast geometry in every case (`r2/d3-toast-with-m1-3f00b57.txt`);
  - `integrity.spec.ts` (M1's merged-state e2e) plus `statusbar.spec.ts`: **33 passed**
    (`r2/combo-m1-3f00b57-integrity-statusbar.txt`).
- **One interaction to know about.** On this branch alone (`1bec1a8`'s `flow.ts`), the old hold rule measures the
  region's top (`Math.min(region.top, bottom − TOAST_ZONE_PX)`). With the region now reaching the top edge, that rule
  treats the whole column above the toast as "under the toast". So it holds the warning on the session screen. The
  known `integrity.spec.ts:1051` failure (M1's interaction, which M1's `3f00b57` fixes by measuring the lifted
  position and the drawn toast instead) therefore **does not reproduce on this branch**: `integrity.spec.ts` 25/25
  (`r2/integrity-on-branch.txt`).
  - M1's approved rule does not read the region's top, so in the integrated tree this CSS has no effect on when the
    warning shows. The combined run above confirms it.
  - If M1's fix were not merged, the side effect is only more conservative holding. The warning is never lost.

### Note 5: ordinary toasts on the session screen sit above the controls, over the readout

**Decision: no change.** I found no case where an ordinary toast appears on the session screen.
- **Run** (`r2/f5/session-toasts.txt`): newbie and veteran profiles at 390×844 and 375×667, through running brew →
  summary → tea break running → break over, with a MutationObserver logging every toast. **No toast appeared** on
  `/focus` or `/done` in any of them.
- **Code paths**, every `toast()` / `ui:toast`:
  - The PWA update toast is dismissed and suppressed while the timer is busy (`ShellOverlays.tsx`).
  - "Break's over" is emitted only when the route is not `/focus` (`flow.ts`).
  - "Saved N minutes" and "Kettle's off" fire on a timer stop or sync that navigates to Today.
  - History, Data and Gallery toasts belong to other screens.
  - Recipe, badge and level toasts are emitted only for records that are not a completed brew. That means a break or
    an early end, and an early end goes to Today. A recipe toast at the end of a break would appear on the break-over
    view, where nothing is running and the readout says the break is over. With the lift it would sit above
    "Put the kettle on" (still tappable) rather than over it. I did not see one in the runs above.

  Nothing covers a running countdown, so I left the lift as approved.

### Load CLS (production builds, `r2/cls-today-load.txt`)

| Case | 390×844 | 375×667 | 360×740 | 1440×900 |
|---|---|---|---|---|
| 100 % text, 5 cold loads | 0 (`normal`) | 0 (`tight`) | 0 (`tight`) | 0 |
| 100 %, every `.woff2` delayed 2.5 s, 3 loads | 0 | 0 | 0 | 0.0028 (also on `c9520db`; not the status bar) |
| 200 % text, 5 loads | 0 (`wrap`) | 0 | 0 | 0 |
| 200 % + fonts delayed 2.5 s, 3 loads | 0.147 | 0.082 | 0.100 | 0.094 |
| same on `c9520db` | 0 | 0 | 0 | 0.091–0.109 |

**The required cases are all 0**: phones at 100 % text, including with slow fonts.

The last two rows need explaining. With 200 % text and slow fonts, the font swap reflows Today in both revisions
(`r2/cls-200-slowfonts-trace.txt`):
- On the fix, the bar is wrapped from the first paint. With the fallback font it takes 3 rows, and the swap brings it
  to 2. The greeting moves 158 → 137 px, which is −21 px.
- On `c9520db`, the bar spills sideways until the fonts arrive and then wraps. The greeting moves 85 → 137 px, which
  is +52 px, and the bottom tab bar jumps (763 → 0 → 763).

Chrome scored those bigger `c9520db` shifts as 0 only because it flagged them `hadRecentInput: true` (no input was
sent). It counted the fix's first, smaller shift. The visible movement is smaller on the fix. 1440 moves the same in
both, from text reflow outside the bar.

### Captures (r2 code, capture-meta `"revision": "0818962"`, 0 page errors)

- Files: `r2/after/{phone-390x844,phone-375x667,desktop-1440x900}-{light,dark}/01-home.png` and
  `01b-home-scrolled.png`, made with `tools/capture.mjs`. All opened.
- 375×667: one row in both themes, greeting at y = 64, as in the baseline and at 390.
- 390 and 1440: unchanged from r1.
- Data and copy follow the date (2,236 leaves; "Nice going…" today).

### Commands and results (r2 tree)

```
npx tsc --noEmit --pretty false                                                → clean
npx vitest run                                                                 → 26 files, 265 passed
KETTLE_PORT=5222 KETTLE_PWA_PORT=5232 npx playwright test tests/a11y.spec.ts tests/statusbar.spec.ts \
     --project=chromium --workers=2                                            → 14 passed
… tests/statusbar.spec.ts against c9520db (served on 5232)                     → 4 failed, 1 passed (as intended)
… tests/integrity.spec.ts (this branch)                                        → 25 passed (see the D3 interaction note)
… integrity + statusbar on pe/w1-fix@3f00b57 + r2 files                        → 33 passed
node .tmp/w1fix/matrix.mjs http://127.0.0.1:5202                                → D1 14/14 OK; D2 144 cells, no overflow
node .tmp/w1fix/toast200.mjs <base> before|after <dir>                          → D3 table above
node .tmp/w1fix/clsprobe.mjs <prod build> 5   (+ SLOWFONTS=1, BIG=1 variants)   → CLS above
node review/product-excellence/tools/capture.mjs … --only 01,01b               (6 configs)
```

- Probes are in `.tmp/w1fix/`, which is gitignored and in the worktree.
- Servers:
  - dev, with `.tmp/w1fix/vite.dev.config.ts`, on 5202 and 5222;
  - `c9520db` and the combined tree from `git archive` copies in the scratchpad, on 5232;
  - production builds via `vite preview` on 5222 and 5232 for CLS.

  All stopped.

### BLOCKED / UNKNOWN

- **UNKNOWN:** OS text-size settings on real phones and real rotation timing. The same measurement decides them,
  re-run on every `loadingdone`, and the manual step is `docs/REAL_DEVICE_CHECKLIST.md` 9.5.
- **UNKNOWN:** iOS Safari's handling of a `sticky` action inside an `overflow` list. It is standard CSS and was
  verified in Chromium only.
- **BLOCKED:** real-device screen readers announcing the scrolled toast. It is the same polite live region, and the
  text is complete in the DOM.
