# I04 integration fix — Today's stats wrap at 375×667 · READY FOR REVIEW (r4)

> **r4 (this revision)** adds the orchestrator-adjudicated D4 (a toast covers the break-over "Mark it done, start
> fresh" button); see **"r4"** at the end. r3 was not reviewed. **r3** answers Checker r2's REJECT (`CHECKER-integration-fix-r2.md`: R2-D1, R2-D3, note 4, finding 5);
> see **"r3"** at the end. **r2** answered Checker r1's REJECT (`CHECKER-integration-fix-r1.md`, D1 and D2) and the I03 checker's
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

> **Corrected in r3:** the claim below is incomplete. See "r3 › Finding 5".

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

---

## r3

- **Revision:** the commit that adds this section (`I04 INTEGRATION FIX READY FOR REVIEW (r3): …`). The r3 code is in
  `24bb9d0` → `44f33d3` → `f62339d` → `e10297b` → `54bf8be` (each later commit replaces the toast CSS of the one before;
  see R2-D3). The final commit adds evidence only. `kettle/src` tree of `54bf8be` and of the final commit:
  `97d26c5c29fe7651fbc16af7b4cbd2aa30a6a0b2`. Base for review: `e932f65` (r2).
- **Files:** `src/screens/home/StatusBar.tsx` (R2-D1), `src/ui/Toast.module.css` (R2-D3), `tests/statusbar.spec.ts`
  (new cases, determinism). I did not touch `Toast.tsx`, `flow.ts` or `integrity.spec.ts`.
- **Proposed state:** **FIXED**, with the disclosures under R2-D3 and "Still open".
- **Evidence:** `contracts/I04/integration-fix/r3/`. Probes are in `.tmp/w1fix/` (gitignored, in the worktree).

### R2-D1: no re-fit after a resize that leaves the bar's own box unchanged

- **Cause** (as the Checker found): below about 385 px the `normal` row is already at its min-content width, so
  narrowing the screen changes no box the ResizeObserver watches.
- **Fix:** `fit` now also runs whenever the screen's size changes. It listens to `window` `resize` and
  `visualViewport` `resize`, and the same ResizeObserver also watches `document.documentElement`. All of these are
  removed on unmount. The r2 rules are unchanged: retry after fonts load, and no fallback-font near-miss decisions.
- **Retest** (`r3/d1-race-fix.txt`, 3 repeats each, both themes; `StatusBar.tsx` is unchanged from `24bb9d0` to the
  final commit): **0 failures in 46 runs.**
  - Single steps 384×854 → 375×667, 380×800 → 375×667 and 384×854 → 360×740.
  - Gradual narrowing 414 → 375 at 2 px / 16 ms and at 1 px / 20 ms.
  - A zero-wait bounce 414 / 375 / 390 / 375 / 400 / 375 / 384 / 375 / 414 / 375.
  - Result every time: `tight`, one row, `scrollWidth = clientWidth = innerWidth` = width, tab bar bottom = height.
  - Desktop windows 420 → 375 in 1 px steps and 500 → 375 in 5 px steps: one row, no horizontal scrollbar.
  - 384 → 375 → 414 goes back to `normal`; at 200 % text, 384 → 375 gives `wrap` with no overflow.
  - **Same probe on `e932f65`: 27 failures in 34 runs** (`r3/d1-race-e932f65.txt`). On `c9520db`: 28/34
    (`r3/d1-race-c9520db.txt`).
- **Regression test:** `tests/statusbar.spec.ts` gains "narrowing that leaves the bar's own box unchanged still
  re-fits" (light and dark). It covers the three single steps, a 414 → 375 narrowing 1 px at a time, and a desktop
  window 420 → 375 in 1 px steps.
  - It **fails on `e932f65`** with `384×854 → 375×667: normal`, in both themes (`r3/statusbar-spec-on-e932f65.txt`:
    2 failed, 5 passed).
    That run used the spec as of `24bb9d0`; `44f33d3` only added the fixed leaf total to the resize cases.
  - It passes on the fix (see "Commands and results").
- **Note 4, fixed:** every `statusbar.spec.ts` case that expects a particular mode now sets a fixed leaf total (2,296)
  before measuring: the fresh-load cases and the resize/rotation cases. (On 2026-10-10 the date-seeded veteran total,
  2,211, fits `normal` at 375, so the r2 resize case would have failed today for a reason unrelated to the code.)

### R2-D3: stacked toasts squeezed at large text (and three toasts at 568×320, 100 %)

- **Cause:** r2 capped the stack's height (`.live { max-height: 100% }`, `.list { min-height: 0 }`). The toasts sit in
  the list's auto grid rows, so those rows shrank toward each toast's `min-height` instead of the list scrolling, and
  text spilled out of its own box.
- **Fix** (`Toast.module.css` only; final form in `54bf8be`):
  - Outside short rooms the list's grid rows are `max-content`, so a toast always keeps its content height.
  - The region (top safe edge to its lifted bottom) is a size container, `toast-room`. The scrolling applies only where
    a stack can outgrow its room: `@container toast-room (max-height: 24em) or (max-width: calc(106px + 11em))`, i.e.
    a short room (landscape phone, 320 px) or large text for the width. 24 em is 384 px at 100 %, and no portrait-phone
    or desktop room is that short, so at 100 % on 375, 390 and 1440 nothing changes.
  - In that mode:
    - `.live` is capped at the room and `.list` is the scroll box (`overflow-y: auto`, overscroll contained).
    - **Every toast keeps its full content height** (`flex-shrink: 0`; nothing caps or squeezes a toast).
    - **The list scrolls from the bottom up.** It is a reversed flex column, whose scroll origin is its bottom edge,
      and `order` on `:nth-last-child(1…6)` keeps the on-screen order the document's (oldest at the top, newest at the
      bottom, as everywhere else). So the newest toast (nearest the docked start) is in view first, and the part of a
      stack that does not fit is above it, reached by scrolling up. Nothing ever overflows downwards.
    - The scroll box reaches 20 px above and 32 px beside the stack (negative margins give the space back), so the
      toasts don't move and their top and side shadows aren't clipped. Below the stack the box ends at the toasts.
  - The r2 large-text toast layout is kept: message beside the icon, the action under it, `position: sticky;
    bottom: 0`. Inside the scrolling list "Save backup" therefore stays at the bottom of the room while the rest of a
    tall warning is scrolled into view.
  - **Rooms shorter than 4 em** (667×375 at 200 %: the docked start leaves 60 px above it) can't show a line of text
    above an action under it. There the action goes back beside the message and sticks to the top of the room
    instead, and the message scrolls past beside it a line at a time.
- **Why bottom-up (interaction with M1's frozen hold rule).** `protectedUnderToasts()` in `flow.ts` measures the
  warning's drawn box (`#toast-kettle:save-failed`) and holds the warning while that box overlaps the docked start.
  With a list that scrolls top-down (my first r3 CSS, `24bb9d0`: `max-content` rows plus scrolling), any stack taller
  than its room pushes the bottom toast's box below the room, over the docked start. The rule then takes the warning
  away and puts it back every 250 ms: on the trial at 375×667 / 200 %, the warning was off the screen when measured in 3
  of the 4 early-end runs (`hasWarning: false`; that log is in git at `44f33d3`, `r3/earlyend-trial.txt`). Two
  intermediate commits did not remove it: with `44f33d3` (each toast capped at the room, scrolling its own message)
  "Kettle's off" + warning at 375×667 / 200 % still put the warning's box at 113–429 with the room ending at 324; with
  `f62339d` (the warning shrinking first) three toasts at 375×667 / 200 %, and 667×375 at 150–200 %, still did.
  Scrolling bottom-up removes the cause: a toast's box can extend above the room (off the top of the screen, inside
  the scroll box) but never below it.
- **Retest, toast stacks** (`toast()` imported in dev; `r3/stack-after.txt`, screenshots `r3/stack/*-after.png`;
  against `e932f65` in `r3/stack-e932f65.txt` / `*-before.png`):
  - Stacks: the warning alone; "Kettle's off" + warning; "Cozy level 5!" + "Saved 12 minutes" + warning; three
    toasts ("Recipe done …", "New badge …", warning).
  - Configs: 375×667, 390×844 and 1440×900 at 100 / 150 / 200 %; 667×375 and 844×390 at 100 / 125 / 150 / 200 %;
    568×320 and 320×568 at 100 %. Both themes. 152 cases.
  - Checks per case (all must hold):
    - **no text outside its toast's box** (every descendant of every toast inside the toast's rectangle);
    - the newest toast in view as first shown (its whole box, or its bottom when it is taller than the room);
    - **no toast's box below the room** (bottom ≤ the docked start's top), which is what M1's hold rule measures;
    - **every toast reachable**: scrolling the list through its whole range brings each toast's top and bottom edge into
      view;
    - **the whole warning readable**: every line of its message is wholly in view, and not under its action, at some
      scroll position;
    - "Save backup" hit-tests as itself as first shown and again after scrolling;
    - the scroll box clear of the docked start.
  - Result: **fix: 0 failures in 152 cases** (`r3/stack-after.txt`). `e932f65`: **50 failures** in the same 152
    (`r3/stack-e932f65.txt`), all text spilling out of a squeezed toast: 375 at 200 % (6), 390 at 200 % (2), 667×375
    at 125–200 % (20), 844×390 at 125–200 % (18), 568×320 at 100 % (4). That run used the first r3 version of this
    probe; its spill check is unchanged.
  - Where the list scrolls on the fix: 375×667 at 200 % (32–283 px), 390×844 at 200 % with three toasts (65 px),
    667×375 and 844×390 from 125 % (stacks of two or three; from 150 % also the warning alone), 568×320 at 100 % with
    three toasts (18 px). The warning alone is taller
    than its room at 375×667 / 200 % (348 px in 316), 667×375 / 150 % (229 in 158), 667×375 / 200 % (461 in 60) and
    844×390 at 150–200 % (229 in 208, 267 in 164): there its last lines and "Save backup" are in view first, and its
    first lines are read by scrolling the list up.
  - **100 % geometry** (`r3/stack-geometry-100.txt`): 52 of 56 cases are rect-identical to `e932f65`, which the
    Checker found identical to `c9520db`. That covers every case at 375, 390 and 1440 in both themes, and at 320×568,
    667×375 and 844×390. The 4 that differ are the 568×320 stacks of three: r2 squeezed the warning to 59 px for 77 px
    of text; now every toast keeps its height, the stack is 18 px taller than its room, and the oldest toast's top
    10 px sit above the screen edge, reached by scrolling up (`c9520db` put that toast off-screen, per the Checker).
  - Pixels at 100 % (`r3/stack-pixel-diff.txt`, the "three" stacks): inside the toasts' own rectangles, **0 differing
    pixels** at 375, 390, 1440, 667×375 and 844×390 in both themes (320×568: 38 px in light, 0.01 %; 0 in dark).
    568×320 differs, as above. In the short rooms (320×568, 568×320, 667×375, 844×390) the soft shadow under the bottom
    toast is cut where the scroll box ends (19–53 % of a 16 px band under it differs); at 375, 390 and 1440 that band is
    identical. Whole frames at 375, 390 and 1440 differ more only because the `e932f65` shots were taken on
    2026-10-09 and the seeded profile's copy follows the date.
- **Retest, real flows on the trial merge** (`.tmp/w1fix/earlyend.mjs`; `r3/earlyend-trial.txt`, screenshots
  `r3/earlyend/`): a newbie profile whose localStorage quota is really full (`QuotaExceededError`) starts a brew; it is
  ended with End within the first minute, or after 12 minutes (fast-forwarded); back on Today the toasts
  are paused (pointer over them) and measured once their entry animation has finished. 375×667 and 390×844 at DPR 2,
  1440×900 at DPR 1, both themes, 100 / 150 / 200 %: 36 runs. Same checks as above (newest in view, nothing below the
  room, every toast reachable, every line of the warning read by scrolling, no text outside its box), then a real tap
  (phones) or click (desktop) at the centre of "Save backup", which must hit-test as itself and **download the backup
  file**.

- **Default flows: 0 failures in 36 runs** (`r3/earlyend-trial.txt`). Today the newbie profile's 12 minutes do not reach a
  new cozy level, so "after 12 minutes" gives "Saved 12 minutes of focus" + the warning.
- **With a level-up: 0 failures in 18 runs** (`r3/earlyend-levelup-trial.txt`; `LEVELUP=1` parks the profile one leaf
  below its next level before the brew). This gives the Checker's three-toast state: "Cozy level 5!" + "Saved 12
  minutes of focus" + the warning.
- In every run: `QuotaExceededError`, the warning on screen, every line of its message read (3–7 lines), nothing below
  the room, every toast reachable, "Save backup" hit-testing as itself at the tap point, and the tap or click
  **downloaded the backup**.

| Config (both themes) | 100 % | 150 % | 200 % |
|---|---|---|---|
| 375×667 | fits: list 312–489 (level-up 252–489) | fits: 129–421 / 104–421 (level-up 44–421) | the warning is 348 px in a 316 px room: the list scrolls 137 px (202 with the level-up); the warning's box is −24…324, its last lines and "Save backup" in view, its first line read by scrolling up |
| 390×844 | fits: 489–666 (429–666) | fits: 306–598 (246–598) | fits: 69–501 (4–501) |
| 1440×900 | fits | fits | fits: 413–764 (348–764) |

### Finding 5: correction (no behaviour change this round)

My r2 claim that "no ordinary toast appears on the session screen" was **incomplete**. The Checker showed that a
badge, recipe or level toast raised when a full tea break completes on `/focus` (`announce(…, completedFocus=false)`):
- with **Settings › "Next brew" on** (`autoStartFocus`), lands on the running next brew. At 375 it covers the status
  line ("Kettle's on… Whistles at …") for 3.2 s. The digits stay visible and the controls stay clear.
- with default settings, covers the "Break's over" title on the break-over view.

My r2 runs used default settings and profiles whose breaks raised no such toast, so they missed both. Changing this
needs `flow.ts`, `progress/store.ts` or `Toast.tsx`, which are frozen or M1-owned. As instructed, I changed nothing
here. The orchestrator is recording it as a candidate for I10 (calm state feedback).

### Trial merge with M1

- **Setup:** `git worktree add --detach <scratch>/trial-r3 claude/wizardly-galileo-uy89d9` (`2f5f1f3`), merge
  `pe/w1-fix` (`3f00b57`), then `pe/w1-fix-m2`; each later r3 code commit was merged in as it landed, ending at
  `54bf8be` (trial `HEAD` `4c5ec7f`). Its `kettle/src` tree, `1e91ac3f9f80357387caa62449ea580271a6db69`, is the same
  as a fresh two-step merge of the same three commits gives (`git merge-tree`).
  - `flow.ts`, `Toast.tsx` and `integrity.spec.ts` are byte-identical to `3f00b57`.
  - `StatusBar.tsx`, `Home.module.css`, `Toast.module.css` and `statusbar.spec.ts` are byte-identical to `54bf8be`.
- **On the trial (final code):**
  - tsc clean; vitest 26 files, 265 passed (`r3/tsc-vitest.txt`, branch and trial).
  - `integrity.spec.ts`, `a11y.spec.ts`, `statusbar.spec.ts` and `whistle.spec.ts` (`--workers=2`): **51 of 52 pass**
    (`r3/trial-e2e.txt`: 46 passed, 1 failed, 5 did not run). The failure is a11y "short screen (375×667)", which is
    date-driven and fails identically on `c9520db` (see "Still open"). `a11y.spec.ts` runs serially, so the 5 a11y
    tests after it did not run; run on their own they pass 5/5 (`r3/trial-e2e-a11y-rest.txt`), including "a toast
    never covers the session controls or the summary footer" at 390×844 and 375×667. Every integrity, statusbar and
    whistle test passes, including the I03 "storage-full warning never covers a control" tests.
  - M1's `contracts/I03/capture-storage-full.mjs` at the six configs (`r3/m1-capture-storage-full/`): every state (s0,
    s0b, s1, s3, s3b, s1a, s1b, s4a, s4b, s2) has the same route and the same toasts as M1's AFTER
    (`/home/user/wt/w1fix/…/I03/captures/after-integration/*/capture-meta.json`) in all six configs, with 0 page
    errors (`node .tmp/w1fix/metacmp.mjs <M1 AFTER> <mine>`: 0 states differ). Opened: 375×667 light s4a (the warning
    above "Put the kettle on", the status bar one row).
- The worktree was removed afterwards.

### Load CLS and captures

**Load CLS** (production build of the final source, `r3/cls-today-load.txt`; veteran seed; shifts without recent input):

| Case | 390×844 | 375×667 | 360×740 | 1440×900 |
|---|---|---|---|---|
| 100 % text, 5 cold loads | 0 (`normal`) | 0 (`normal`*) | 0 (`tight`) | 0 |
| 100 %, every `.woff2` delayed 2.5 s, 3 loads | 0 | 0 | 0 | 0.0028 (as in r2 and on `c9520db`) |
| 200 % text, 3 loads | 0 (`wrap`) | 0 (`wrap`) | 0 (`wrap`) | 0 |

\* Today the seeded veteran total is 2,211 leaves, which fits `normal` at 375; 360×740 covers `tight`. **The required
phone cases at 100 %, including slow fonts, are all 0.** (The r2 row "200 % + slow fonts" was not re-run: r3 does not
change what happens at load.)

**Captures** (`tools/capture.mjs --only 01,01b`, dev server of this branch, capture-meta `"revision": "54bf8be"`, 0 page
errors): `r3/after/{phone-390x844,phone-375x667,desktop-1440x900}-{light,dark}/01-home.png` and `01b-home-scrolled.png`.
Opened: 375×667 light and dark 01, 375×667 dark 01b, 390×844 dark 01, 1440×900 light 01. 375×667: one row in both
themes (`normal` today at 2,211 leaves), greeting right under it, as at 390. 390 and 1440 unchanged in layout from r2;
data and copy follow the date.

### Commands and results (r3, final tree `97d26c5…`)

```
npx tsc --noEmit (branch and trial)                                              → clean
npx vitest run (branch and trial)                                                → 26 files, 265 passed
KETTLE_PORT=5222 npx playwright test tests/a11y.spec.ts tests/statusbar.spec.ts \
     --project=chromium --workers=2 (branch)                                     → 10 passed, 1 failed (a11y "short screen",
                                                                                    date-driven), 5 did not run (serial);
                                                                                    the 5 alone: 5 passed. statusbar 7/7
                                                                                    (r3/specs-a11y-statusbar-on-fix.txt,
                                                                                    r3/specs-a11y-rest-on-fix.txt)
… tests/statusbar.spec.ts against e932f65                                       → 2 failed (new R2-D1 cases), 5 passed
KETTLE_PORT=5232 … integrity + a11y + statusbar + whistle (trial, --workers=2)   → 46 passed, 1 failed (same), 5 did not run;
                                                                                    the 5 alone: 5 passed (r3/trial-e2e.txt,
                                                                                    r3/trial-e2e-a11y-rest.txt)
… tests/a11y.spec.ts -g "short screen" against c9520db (5232)                  → 1 failed, same message
node .tmp/w1fix/d1race.mjs <base> 3                                              → fix 0/46 failures; e932f65 27/34
node .tmp/w1fix/toaststack.mjs <base> after <dir>                                → fix 0/152 failures; e932f65 50/152
node .tmp/w1fix/earlyend.mjs http://127.0.0.1:5232 trial <dir>                   → 0/36 failures; LEVELUP=1 FLOW=after12min: 0/18
node review/product-excellence/contracts/I03/capture-storage-full.mjs … (trial)  → 6 configs, 0 states differ from M1 AFTER
node .tmp/w1fix/clsprobe.mjs <production build> 5   (+ SLOWFONTS=1)              → phones 0 (incl. slow fonts); see table
node review/product-excellence/tools/capture.mjs … --only 01,01b                 (6 configs)
```

Servers on 5202 / 5222 / 5232 (dev servers of this worktree and of the trial, production builds for CLS) were all
stopped, and the trial worktree was removed.

### Still open (disclosed, not fixed here)

1. **a11y.spec "short screen (375×667)" fails today, on this branch, on the trial and on `c9520db` alike**
   (`r3/specs-a11y-statusbar-on-fix.txt`, `r3/trial-e2e.txt`, `r3/a11y-short-screen-on-c9520db.txt`):
   `break-over: "Mark it done, start fresh" stays under span._message…`. A progress toast raised when the tea break
   completes sits over the break-over view's button. This is the Finding 5 case, and it depends on the date: the
   seeded profile earns such a toast on some days, and the Checker's run on 2026-10-09 passed. Fixing it needs
   `flow.ts`, `progress/store.ts` or `Toast.tsx` (frozen or M1-owned); it belongs with the I10 candidate. Because
   `a11y.spec.ts` is serial, a full run skips the 5 tests after it; they pass on their own.
2. **A warning taller than its whole room** (375×667 at 200 %; 667×375 and 844×390 at 150–200 %) is first shown with
   its last lines and "Save backup" in view, and its first line or lines above the screen edge (at 375×667 / 200 %,
   24 px). Reading them takes a scroll up of the list; "Save backup" stays in view throughout. At 667×375 / 200 % the
   docked start leaves a 60 px room, so the message is read about a line at a time beside the action.
3. **Short rooms** (landscape phones, 320 px): the soft shadow under the bottom toast is cut where the scroll box ends.
4. The Checker's non-blocking notes 1–3 (M1's 200 % transients, I04 F11 lift timing, summary toasts at 320 / landscape
   and on desktop at 150–200 %) are unchanged by this round.

### BLOCKED / UNKNOWN

- **BLOCKED:** real phones and touch hardware; everything above is Chromium (Playwright) with SwiftShader, emulated
  viewports.
- **UNKNOWN:** real window managers (Stage Manager, split screen, Chromebook) and real OS text-size settings (large text
  was simulated with an `html { font-size }` override).
- **UNKNOWN:** iOS Safari's handling of size container queries, a reversed-column scroll box and a `position: sticky`
  action inside it. Chromium only.
- **BLOCKED:** real screen readers. The live region and DOM order are unchanged (only the visual layout is reversed and
  re-ordered back).

---

## r4

- **Revision:** the commit that adds this section (`I04 INTEGRATION FIX READY FOR REVIEW (r4): …`). The r4 code is
  `9326de5`; the final commit adds evidence only. `kettle/src` tree of `9326de5` and of the final commit:
  `dcc3778dd31e832041817e95c8677be87406b617`. Base for review: `e4be56e` (r3, not reviewed).
- **Files:** `src/screens/focus/FocusScreen.tsx`, `src/screens/focus/FocusScreen.module.css`, `tests/a11y.spec.ts`.
  Not touched: `Toast.tsx`, `flow.ts`, `progress/**`, `integrity.spec.ts`. The r3 files are unchanged.
- **Proposed state:** **FIXED**.
- **Evidence:** `contracts/I04/integration-fix/r4/`. Probes in `.tmp/w1fix/` (gitignored).

### D4: a toast covers the break-over "Mark it done, start fresh" button

- **Adjudication (orchestrator):** pre-existing on the integration branch (`0d58c5e`), not caused by either fix. It
  shows on dates when a recipe completes as the tea break ends ("Recipe done: Take 2 full tea breaks · +15 leaves").
- **Cause:** the carried task's `.overMark` button sat outside the toast-above group (`.overActions[data-toast-above]`),
  so the lift floated a toast just above "Put the kettle on", which is where "Mark it done" is (375×667: button
  451–495, toast 445–501).
- **Fix:** one toast-above group for every break-over control. A new `.overDock[data-toast-above]` wraps "Mark it
  done" and `.overActions` (the attribute moves from `.overActions` to it). `useToastAbove` / M1's `toastLiftBottom()`
  already read every `[data-toast-above]`; the group's top is now "Mark it done"'s top and its bottom stays at the
  actions, so the lift's "low enough to cover" (60 %) test counts it at every tested size.
  - `.overDock` is a centred 8 px-gap grid at full width, i.e. the same layout as when its children were direct items of
    `.over`: **every control's rectangle is identical before and after in all 24 probe cases**.
  - Without a carried task the group is just the two actions, as before.
  - Effect: on phones a toast now sits over the "Ready for another brew of …" line (text, not a control) for its 3.2 s;
    at 1440 the toast sits 60 px higher, still over the stage beside the panel.
  - M1's rule (`[data-toast-above] :is(button…)`) now also lists "Mark it done". On break-over the ritual rule holds
    the warning before that list matters (verified below).
- **Gate, now independent of the date** (`tests/a11y.spec.ts`):
  - "short screen (375×667)": after the existing break-over check, every toast is put away and 1, then 2, of the toasts
    the end of a break can bring are raised (the app's own `toast()`, 60 s, "Recipe done: Take 2 full tea breaks · +15
    leaves", "New badge: Tea Time"), and the reach check runs again (`break-over + 1 toast`, `break-over + 2 toasts`).
  - New "toasts never cover the break-over controls, carried task included" at 390×844 and 375×667: the real journey to
    break-over with the intention carried; with 1 and 2 toasts each of the three controls hit-tests as itself and no
    toast's box overlaps it; then "Mark it done" is tapped with the toasts up and goes away.
  - **Fails on `e4be56e` and on `0d58c5e`** (`r4/gate-on-e4be56e.txt`, `r4/gate-on-0d58c5e.txt`): short screen reports
    `break-over`, `break-over + 1 toast` and `break-over + 2 toasts`: `"Mark it done, start fresh" stays under
    span._message…`; the new test at 390×844: `Mark it done, start fresh: under a toast (1 up)` (its 375 twin does not
    run after that in serial mode).
  - **Passes on the fix:** `a11y.spec.ts` + `statusbar.spec.ts` **18/18** (`r4/specs-a11y-statusbar-on-fix.txt`).
- **Retest, break-over probe** (`.tmp/w1fix/breakover.mjs`): 375×667 and 390×844 at DPR 2, 1440×900 at DPR 1, both
  themes, 100 % and 200 % text, 1 and 2 toasts. Each control is scrolled to the middle of the screen (at 200 % the panel
  is taller than a phone), the lift re-measures, then the control is hit-tested at its centre and checked against every
  toast's box.
  - `e4be56e`: **16 failures in 24** (`r4/breakover-before-e4be56e.txt`): every phone case, "Mark it done" under the
    toast; 1440 clear (the toast is over the stage).
  - Fix: **0 / 24** (`r4/breakover-after.txt`). Fresh trial merge: **0 / 24** (`r4/breakover-trial.txt`).
  - "Put the kettle on" and "That's all for now" hit-test clear in every case, before and after.
- **Captures** (`r4/breakover/breakover-{1,2}toast-<viewport>-t{100,200}-<theme>-{before,after}.png`, 48 frames).
  Opened: 375×667 light and dark after (1 toast), 375×667 light after at 200 % (2 toasts), 390×844 dark before and after
  (1 toast), 1440×900 light before and after (1 toast), 1440×900 dark after (2 toasts), and the orchestrator's
  `adj/break-over-0d58c5e.png`.
  - REFERENCE K04 (`VISUAL_BENCHMARK_LIBRARY/assets/current/whistle-to-summary-phone-dark-reduced-motion-frames.jpg`)
    opened for continuity. It runs from Today through the whistle and summary to the tea break. Break-over continues
    that panel: title, the "Ready for another brew" line, the carried task's green "Mark it done", the full-width orange
    primary and the ghost "That's all for now". The after frames keep that layout unchanged; only the toast moves up.

### Trial merge with M1 (fresh, r4)

- **Setup:** `git worktree add --detach <scratch>/trial-r4 claude/wizardly-galileo-uy89d9` (`4b0507b`), merge
  `pe/w1-fix` (`3f00b57`), then `pe/w1-fix-m2` (`9326de5`), giving `056931b`, `kettle/src`
  `0d0db47afef52a7788d012e335e0c537cbb5532d`. The integration branch later moved to `4992956` with no change under
  `kettle/src` or `kettle/tests` (its `kettle/src` is still `1fc4a1b…`, the same as `0d58c5e`).
  - `flow.ts`, `Toast.tsx` and `integrity.spec.ts` are byte-identical to `3f00b57`.
  - `StatusBar.tsx`, `Home.module.css`, `Toast.module.css`, `FocusScreen.tsx`, `FocusScreen.module.css`,
    `statusbar.spec.ts` and `a11y.spec.ts` are byte-identical to `9326de5`.
- tsc clean; vitest 26 files, 265 passed (`r4/tsc-vitest.txt`, branch and trial).
- `integrity.spec.ts`, `a11y.spec.ts`, `statusbar.spec.ts` and `whistle.spec.ts` (`--workers=2`): **54/54 passed**
  (`r4/trial-e2e.txt`). The full `a11y.spec.ts` is green, including "short screen", the two new break-over tests and
  "a toast never covers the session controls or the summary footer"; the I03 storage-full tests in `integrity.spec.ts`
  pass.
- **M1's warning hold on break-over is unaffected** (`r4/warning-hold-on-breakover-trial.txt`,
  `.tmp/w1fix/bo-warning.mjs`, frames in `r4/warning-hold/`). localStorage really full; brew → summary → tea break →
  break-over with the carried task; 375×667, 390×844 and 1440×900, both themes:
  - on break-over the warning is never on screen: **0 of 40 samples** over 4 s, in every config (on 1440 it had shown
    during the brew, beside the panel);
  - after "That's all for now" it shows on Today in every config; over 70 samples in 7 s the start button never
    hit-tests as a toast, and at 7 s it hit-tests as itself with the warning up.
  - In the first 0.3–0.6 s on Today the start's centre hits Today's own entering elements (the page transition), not a
    toast. A first version of this probe hit-tested once, 1.2 s after the warning appeared, and failed once (dark
    390×844) in that transition: the trace showed the warning re-shown by M1's watcher while Today settled, never
    over the start. The probe now samples over 7 s.
- The worktree was removed.

### Commands and results (r4, final tree `dcc3778…`)

```
npx tsc --noEmit (branch and trial)                                               → clean
npx vitest run (branch and trial)                                                 → 26 files, 265 passed
KETTLE_PORT=5202 npx playwright test tests/a11y.spec.ts tests/statusbar.spec.ts \
     --project=chromium --workers=2 (branch)                                      → 18 passed
KETTLE_PORT=5222|5232 … tests/a11y.spec.ts -g "short screen|break-over controls"
     against e4be56e / 0d58c5e (git-archive copies)                               → short screen failed (D4); then
                                                                                     -g "break-over controls": failed
KETTLE_PORT=5232 … integrity + a11y + statusbar + whistle (fresh trial)           → 54 passed
node .tmp/w1fix/breakover.mjs <base> before|after|trial <dir>                     → e4be56e 16/24 failures; fix 0/24;
                                                                                     trial 0/24
node .tmp/w1fix/bo-warning.mjs http://127.0.0.1:5232 trial <dir>                  → 0 failures (6 configs)
```

Servers on 5202 / 5222 / 5232 were all stopped, and the trial worktree was removed.

### Still open (r4)

1. r3's "Still open" item 1 (a11y "short screen" failing on dates when a recipe completes at break end) is **resolved**
   by D4, and the gate no longer depends on the date.
2. On phones a progress toast raised at break end now sits over the "Ready for another brew of …" line for its 3.2 s.
   That line is text, not a control; the toast is still raised there at all because of Finding 5 (I10 candidate).
3. r3's "Still open" items 2–4 are unchanged.
4. BLOCKED / UNKNOWN as in r3 (real devices, OS text size, iOS Safari, real screen readers).
