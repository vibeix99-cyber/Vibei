# I03 × I04 integration fix (combined) — Today's stats wrap at 375×667, toasts at large text, the storage-full warning · READY FOR REVIEW (r6, combined)

> **r6 (this revision, combined)** answers Checker r5's REJECT (`CHECKER-integration-fix-r5.md`: R5-D1) on the
> **combined** branch: M1's approved `pe/w1-fix` (`3f00b57`, I03) is merged in (`ca23385`). The branch is now the single
> Wave 1 integration fix for I03 × I04. See **"r6 (combined)"** at the end, items (a)–(f) as the coordinator required.
> M1's own packet is `contracts/I03/INTEGRATION-FIX-READY-FOR-REVIEW.md` (unchanged).
>
> **r5** answered Checker r4's REJECT (`CHECKER-integration-fix-r4.md`: R4-D1, R4-D2); see **"r5"** at the
> end. **r4** added the orchestrator-adjudicated D4 (a toast covers the break-over "Mark it done, start
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

---

## r5

- **Revision:** the commit that adds this section (`I04 INTEGRATION FIX READY FOR REVIEW (r5): …`). r5 code: `c9c263a` →
  `371f999`; tests: `f8997d2`. The final commit adds evidence only. `kettle/src` tree of `371f999`, `f8997d2` and the final
  commit: `8d4a9790c3032b253be8c67c14a85b68c2fec06a`. Base for review: `adec1a2` (r4).
- **Files:** `src/screens/home/StatusBar.tsx` (R4-D2), `src/ui/Toast.module.css` (R4-D1), `tests/statusbar.spec.ts`
  (page-scale test; tracing off), `tests/toast-room.spec.ts` (new, real input). Not touched: `Toast.tsx`, `flow.ts`,
  `progress/**`, `integrity.spec.ts`. M1's hold rule is unchanged and still measures the drawn box; r5 makes that box stay
  in the room.
- **Proposed state:** **FIXED**, with the disclosures under "Still open (r5)".
- **Evidence:** `contracts/I04/integration-fix/r5/`. Probes in `.tmp/w1fix/` (gitignored).
- **BEFORE** for every comparison below is the Checker's r4 trial `1f1558e` (integration `4992956` + `3f00b57` + `adec1a2`),
  served from a `git archive` copy. **AFTER** is a fresh trial `929576d` (see "Trial merge (r5)") or this branch.

### R4-D2: live resizes at large text left Today zoomed in

- **Cause (measured, 375×667 at 200 %):** with the row unwrapped for measuring, the stats' min-content widened their column
  (`.heroTop` 343 → 483 px), so the document and the layout viewport became 507 px wide inside `fit`. During a live
  resize Chromium's page scale could settle on that width.
- **Fix** (`StatusBar.tsx`): while `fit` measures, the bar is `contain: inline-size; overflow-x: clip`. Its column cannot
  grow and its overflow does not reach the document: measured on r4 code at 375×667 / 200 %, `.heroTop` stays 343, the
  document 375, `innerWidth` 375, and the stats' right edges (what is measured) are the same 507. Both properties are
  removed again in the same task, before anything is painted.
  - It is applied only where it cannot change the measurement: stats packed from the bar's left edge (`normal`,
    `flex-start`, `space-between`, i.e. every phone layout) and the bar's left edge not moving under containment.
    Right-packed bars sized to their content (the ≥ 720 px row layouts, not phones) are measured as before.
  - The ladder (normal → tight → wrap), the 40 px "far too wide" rule, the fallback-font rule and every listener are
    unchanged.
- **Retest** (`r5/zoom-after.txt`, `.tmp/w1fix/zoom.mjs`): mobile viewport at DPR 2, 200 % and 150 %, both themes, 3 reps:
  the zero-wait bounce 414/375/390/375/400/375/384/375/414/375; the 414↔376 drag (2 px / 16 ms) back and forth three
  times; single drags 414 → 375 at 2 px / 16 ms and at 1 px / no wait; four zero-wait rotations 667×375 ↔ 375×667.
  Final check 2 s later: `visualViewport.scale` = 1, `visualViewport.width` = `innerWidth`, no sideways scroll, bar inside.

  | Sequence | AFTER 200 % | AFTER 150 % | BEFORE (r4 trial) 200 % | BEFORE 150 % |
  |---|---|---|---|---|
  | zero-wait bounce | 0/6 | 0/6 | **6/6** zoomed, up to ×2.15 | 3/6, ×1.06 |
  | 414↔376 drag ×3 | 0/6 | 0/6 | **6/6**, up to ×2.78 | 1/6, ×1.02 |
  | 414 → 375, 2 px / 16 ms | 0/6 | 0/6 | 2/6, ×1.18 | 2/6, ×1.003 |
  | 414 → 375, 1 px, no wait | 0/6 | 0/6 | 5/6, ×1.18 | 0/6 |
  | four zero-wait rotations | 0/6 | 0/6 | 1/6, ×1.26 | 1/6, ×1.06 |

  **AFTER 0/60** (`r5/zoom-after.txt`, which also holds an earlier full run, 0/60, and five more reps of every sequence at
  150 %, 0/40, all on the final `StatusBar.tsx`); **BEFORE 27/60 zoomed** (`r5/zoom-before-r4-trial.txt`).
- **Mechanism check** (`r5/zoom-mechanism-after.txt`, `.tmp/w1fix/zoomwide.mjs`): every `getBoundingClientRect` on the bar
  and every animation frame recorded during the drag and bounce sequences. At 200 %: 0 of 2,160 measurements and 0 frames
  with the document wider than the screen (r4: 475–511 px inside every measurement, Checker r4). At 150 %: in some runs
  one measurement starts 1–4 px wide, because the browser first lays out the new width with the previous decision (a
  tight row that fitted at 402 px is 1–3 px too wide at 398–400 px) before `fit` corrects it; in 1 of 6 runs this showed
  in 5 frames. No lasting zoom in 100 runs at 150 %.
- **Regression test:** `tests/statusbar.spec.ts` "rapid live resizes at large text leave the page unzoomed" (light, dark):
  200 % and 150 %; zero-wait bounce, 414↔376 drag, 1 px no-wait drag; then scale 1, `visualViewport.width` =
  `innerWidth`, no sideways scroll.
  - **Fails on the r4 trial** (scale 2.38 and 1.22 after the bounce; `r5/new-tests-on-r4-trial.txt`); passes on the
    branch and on the trial.
  - The spec file now runs with tracing off (`test.use({ trace: 'off' })`): Playwright's per-action trace snapshots spaced
    the resizes so far apart that the race never happened, and the same test passed on r4 with tracing on.
- **Kept:**
  - D1/R2-D1 at 100 % (`r5/d1-race.txt`, fixed 2,296 leaves): **0 failures in 52 runs** on the branch and on the r4 trial.
    (The probe used the date-seeded total until r5; today's 2,211 fits `normal` at 375, so it now fixes the total.)
  - D2 (`r5/d2-matrix.txt`): the 144-cell large-text matrix is **byte-identical** to the r4 trial; its 2 failures are
    360×740 at 100 % with 470,000 leaves wrapping, as on r4 and on base.
  - Load CLS at 100 % on phones is 0, including slow fonts and a profile that loads `tight` (below).

### R4-D1: a warning taller than its room could not be read by scrolling

- **Cause (Checker):** scrolling the bottom-up list moved the warning's own box below the room, over the docked start; M1's
  hold rule measures that box and took the warning away, then re-showed it unscrolled.
- **Fix** (`Toast.module.css`, short-room mode only: `@container toast-room (max-height: 24em) or (max-width: …)`):
  - **The warning never moves down.** A toast with an action is `position: sticky; bottom: 0` in the list, so at every
    scroll offset its drawn box stays inside the room, clear of the docked start.
  - **Older toasts can still be revealed.** Scrolling the list up slides the older toasts (above it) down over it:
    `z-index` 2 over its 1. Newer toasts (below it) pass under it (0).
  - **Every toast is at most as tall as the room** (`max-height: 100cqh`) and scrolls its own message when longer
    (`overflow-y: auto`). Its items are centred as before but `safe`, so a longer message starts at its top: the opening
    comes first and is reachable. Its action is sticky (`top: 0; bottom: 0` inside the toast), so "Save backup" stays in
    view while the message scrolls, beside it or (large-text layout) under it.
  - At its top the warning's own scroll hands on to the list, so scrolling up over it first returns to its opening and
    then reveals the older toasts.
  - The bottom-up list, its shadow padding and the tiny-room layout (action beside the message under 4 em) are as in r4.
- **Retest with real input** (`.tmp/w1fix/realscroll.mjs`; `r5/realscroll-after-trial.txt`,
  `r5/realscroll-before-r4-trial.txt`; frames in `r5/realscroll/`):
  - Setup: localStorage really full (`QuotaExceededError`); Today with the warning alone, after End within the first
    minute ("Kettle's off" + warning), or after End at 12 min with a level-up (three toasts).
  - Input: `page.mouse.wheel`, or CDP `Input.dispatchTouchEvent` finger drags. First read the warning down to its end;
    then scroll up past its opening to the oldest toast, in 20 px steps; then scroll inside any older toast taller than
    the room.
  - Recording: every animation frame, from before the first input to more than 2 s after the last.
  - Configs: 375×667 @200 %; 667×375 and 844×390 @150 % and @200 %; three cases each; wheel and touch; plus the 568×320
    @100 % three-stack (wheel, touch); both themes. 64 runs.
  - Pass means all of:
    - the warning mounted at ≥ 0.98 opacity in every frame;
    - its box never below the docked start or the room in any frame;
    - the list `scrollTop` unchanged for ≥ 2 s after the last input;
    - every line of the warning wholly in view (not under its action or an older toast) in some frame;
    - every other toast wholly in the room (not under a toast painted over it) in some frame, with each of its lines
      read.
  - **AFTER: 0 failures in 64.** **BEFORE (r4 trial): 64/64 fail.** In all 64 the warning was taken away (faded or
    unmounted) and its box was over the docked start; in 36 an older toast was never wholly on screen, and in 36 a warning
    line was never readable.
- **Regression test:** `tests/toast-room.spec.ts`, 4 tests: 375×667 and 844×390 at 200 % × wheel and touch, storage really
  full, End within the first minute.
  - Each reads the warning to its end and scrolls up past its opening to "Kettle's off" with real input, then records
    every frame to 2 s past the last input.
  - It asserts: no frame without the warning at full opacity, no frame with it over the dock, the list unmoved, every
    line of the warning read, and the older toast wholly on screen.
  - **Fails 4/4 on the r4 trial** (261–404 frames without the warning; `r5/new-tests-on-r4-trial.txt`); passes on the
    branch and on the trial.
- **Kept:**
  - "Save backup" taps and downloads: `r5/earlyend-save-backup-trial.txt`, 18/18 real taps or clicks downloaded the backup
    (375×667 @150/200 %, 390×844 @200 %, both flows, both themes; the level-up flow at 375/390/1440 @200 %).
  - **100 % toast geometry unchanged:** 56 of 56 toast rectangles at 100 % text are identical to r3/r4
    (`r5/stack-geometry-100.txt`). That covers 375, 390, 1440, 320×568, 568×320, 667×375 and 844×390, all four stacks,
    both themes.
  - No squeeze: no text outside its toast's box in any run (a longer toast scrolls its own message).
  - D4: break-over controls clear, 0/24 (`r5/breakover-r5.txt`).

### Trial merge (r5)

- `git worktree add --detach <scratch>/trial-r5 claude/wizardly-galileo-uy89d9` (`bc5cfaa`; its `kettle/src` is still
  `1fc4a1b…` = `0d58c5e`'s), merge `pe/w1-fix` (`3f00b57`), merge `pe/w1-fix-m2` (`371f999`, then `f8997d2`): `929576d`,
  `kettle/src` `b38ad5e527ce67a3237e51c640aabd0edf9b1f9e`.
  - `flow.ts`, `Toast.tsx` and `integrity.spec.ts` are byte-identical to `3f00b57`.
  - `StatusBar.tsx`, `Home.module.css`, `Toast.module.css`, `FocusScreen.tsx`, `FocusScreen.module.css`,
    `statusbar.spec.ts`, `a11y.spec.ts` and `toast-room.spec.ts` are byte-identical to the branch.
- tsc clean; vitest 26 files, 265 passed (`r5/tsc-vitest.txt`, branch and trial).
- `integrity.spec.ts`, `a11y.spec.ts`, `statusbar.spec.ts`, `whistle.spec.ts` and `toast-room.spec.ts` (`--workers=2`):
  **60/60 passed** (`r5/trial-e2e.txt`).
- M1's `contracts/I03/capture-storage-full.mjs` at the six configs (`r5/m1-capture-storage-full/`): **every state
  identical** to M1's AFTER (route, toasts, session counts; `node .tmp/w1fix/metacmp.mjs`: 0 of 60 differ), 0 page errors.
- The worktree was removed afterwards.

### Load CLS (production builds; `r5/cls-today-load.txt`)

| Case | 390×844 | 375×667 | 360×740 | 1440×900 |
|---|---|---|---|---|
| 100 %, seed (2,211 → `normal` at 375), 5 loads | 0 | 0 | 0 (`tight`) | 0 |
| 100 %, seed, fonts delayed 2.5 s, 3 loads | 0 | 0 | 0 | 0.0028 (as before) |
| 100 %, a saved profile with 2,296 leaves (`tight` at load at 375), 3 loads | 0 | 0 (`tight`) | 0 | 0 |
| the same, fonts delayed 2.5 s, 3 loads | 0 | 0 (`tight`) | 0 | 0.0028 |
| 200 %, fonts delayed 2.5 s: every shift (counted + flagged) | 0.384 | 0.363 | 0.359 | 0.091–0.094 |
| the same on the r4 trial | 0.384 | 0.363 | 0.359 | 0.094 |

**The required phone cases at 100 % are all 0.**

At 200 % with slow fonts **the movement is the same as r4** (identical sums of every shift). Chrome's *counted* value at
390×844 differs, though:
- r5 counts 0.384 in 8/8 loads; r4 counted 0.147 in 7/8.
- On r4 the bar's measurement after the font swap widened the layout viewport. Chrome treats that like a viewport resize
  and flags the following shifts `hadRecentInput`, so they were not counted.
- r5 removes that widening, so the shift that was always there is now counted.
- 375/360/1440 count the same as r4 (0.082 / 0.100 / 0.091–0.094).

### Captures (01/01b; capture-meta `"revision": "f8997d2"`, 0 page errors)

- Files: `r5/after/{phone-390x844,phone-375x667,desktop-1440x900}-{light,dark}/01-home.png` and `01b-home-scrolled.png`.
- Phones: **pixel-identical** to r3/r4 (0.000 %), 375 and 390, both themes. 1440: ≤ 0.066 % (Chai's idle frame).
- Opened: 375×667 dark 01 and 1440×900 dark 01b.

### Commands and results (r5, final tree `8d4a979…`)

```
npx tsc --noEmit (branch and trial)                                              → clean
npx vitest run (branch and trial)                                                → 26 files, 265 passed
KETTLE_PORT=5202 npx playwright test tests/a11y.spec.ts tests/statusbar.spec.ts \
     tests/toast-room.spec.ts --project=chromium --workers=2 (branch)            → 24 passed (r5/specs-on-branch.txt)
KETTLE_PORT=5232 … integrity + a11y + statusbar + whistle + toast-room (trial)   → 60 passed (r5/trial-e2e.txt)
KETTLE_PORT=5222 … toast-room + statusbar -g "rapid live resizes|…can be read"
     against the r4 trial 1f1558e                                                → 6 failed (as intended)
node .tmp/w1fix/zoom.mjs <base> <tag> 3   (+ 5 reps at 150 %)                     → AFTER 0/60 + 0/40; BEFORE 27/60
node .tmp/w1fix/zoomwide.mjs <base> after <pct> <theme> <seq> 3                  → 200 %: 0 wider measurements/frames
node .tmp/w1fix/realscroll.mjs <base> after|before <dir>                         → AFTER 0/64; BEFORE 64/64
node .tmp/w1fix/d1race.mjs <base> 3                                              → 0/52 (branch and r4 trial)
node .tmp/w1fix/matrix.mjs <base>                                                → D2 byte-identical to r4
node .tmp/w1fix/toaststack.mjs <base> after <dir> @100 + geomcmp.py              → 56/56 identical to r3/r4
node .tmp/w1fix/earlyend.mjs … (subset; + LEVELUP=1)                             → 18/18, every tap downloaded
node .tmp/w1fix/breakover.mjs <base> r5 <dir>                                    → 0/24 (D4 kept)
node review/…/I03/capture-storage-full.mjs … (trial, 6 configs)                  → 0/60 states differ from M1 AFTER
node .tmp/w1fix/clsprobe.mjs / clsprobe200all.mjs <production build>             → see the table
node review/product-excellence/tools/capture.mjs … --only 01,01b                 (6 configs)
```

Servers on 5202 / 5222 / 5232 (dev servers of the branch, the r4-trial copy and the trial; production previews for CLS)
were all stopped, and the trial worktree was removed.

### Still open (r5)

1. **150 %, during a drag:** occasionally one layout pass (rarely a few frames) where the document is 1–4 px wider than
   the screen, before `fit` corrects the previous decision for the new width. There was no lasting zoom in 100 runs.
2. **667×375 at 200 %** (a 60 px room): an older two-line toast is capped at 60 px, so it is wholly in view at exactly one
   list offset. Touch, a touchpad or 20 px wheel steps stop there; one coarse 40 px+ wheel notch can pass it. Its text is
   then read inside it.
3. **While older toasts are slid down to be read**, they cover part of the pinned warning (in a 60 px room, all of it,
   "Save backup" included). Scrolling back down uncovers it; at rest nothing covers it.
4. **200 % + slow fonts at 390×844:** Chrome now counts 0.384 instead of 0.147 for the same movement (see Load CLS).
5. Unchanged from r4: Finding 5 / I10; Checker r4 non-blocking notes 1–5; r3's clipped shadow in short rooms.
6. **BLOCKED / UNKNOWN:**
   - BLOCKED: real phones and touch hardware, and real screen readers. Note that a warning no longer re-enters the live
     region on scroll, since it is no longer taken away.
   - UNKNOWN: iOS Safari / WebKit handling of `align-items: safe center`, a sticky action inside a scrolling toast inside
     a sticky warning inside a reversed-column scroll box, and of `contain: inline-size` during measurement.
   - UNKNOWN: real window managers producing live resizes, and OS text-size settings.

## r6 (combined) — I03 × I04 on one branch

- **Proposed state:** **FIXED**. Disclosures are under "Still open (r6)", and anything not produced is under "Not
  produced".
- **Evidence:** `contracts/I04/integration-fix/r6/`. Probes are in `.tmp/w1fix/` (gitignored).
  - The Checker's r5 scripts (`readscroll.mjs`, `race.mjs`, `natural.mjs`, `lib.mjs`) were copied and never edited.
  - Where a probe had to change for the new layout, it is a new file (`readscroll6.mjs`, `race6.mjs`).

### (a) Hashes

| What | Commit | `kettle/src` tree |
|---|---|---|
| **Combined revision, code** (the last code commit) | **`091249a86c3be233d6724b0b36c814152c26208e`** | **`05bb3f827117545cbbc9f212e0a5f7332490092c`** |
| Submission commit (`I03 I04 INTEGRATION FIX READY FOR REVIEW (r6, combined): …`) | the commit that adds this section | the same tree (it adds only this packet and `integration-fix/r6/**`) |
| **Scratch merge** of `091249a` onto integration HEAD `c6c7922` (`--no-ff`, no conflicts) | **`859f9fb25b601d3cd1d09826045c0da74757aa0f`** | **`05bb3f827117545cbbc9f212e0a5f7332490092c`** (identical) |
| Integration HEAD (app code = `0d58c5e`) | `c6c7922` | `1fc4a1b1091d92a947f6234641718c9ad6b87ba5` |
| M1, approved | `3f00b57` | `3c58bf904d3d3df83726a56e52f83e82bf6f67c8` |
| r5 | `33a72e6` | `8d4a9790c3032b253be8c67c14a85b68c2fec06a` |

- **The scratch merge:**
  - Made in a scratch worktree: `git worktree add --detach <scratch>/trial-r6 c6c7922`, then
    `git merge --no-ff 091249a`.
  - It differs from the branch only under `kettle/review` (the integration side's status and archive files).
  - On it: tsc clean, vitest 26 files / 265 passed.
  - The worktree was removed. The commit object stays in the repository, unreferenced.
- **The branch for r6:**
  - `ca23385`: M1's approved `pe/w1-fix` (`3f00b57`) merged into r5 `33a72e6` with `--no-ff`, no conflicts. Its
    `kettle/src`, `b38ad5e…`, is the r5 trial's tree.
  - `db8220e`: WIP checkpoint after a container restart.
  - `cb1cd9e`, `d074863`: code, first and second versions.
  - **`091249a`: code, final.**
  - Then the submission commit.
  - What each code step fixed is under "How r6 got here".

### (e, part 1) Changed files

Full lists (`git diff --stat` and `--name-status`) are in `r6/changed-files.txt`.

- **vs integration `c6c7922`, outside `kettle/review`:** 13 files.
  - M1 (I03): `docs/areas/timer.md`, `src/app/flow.ts`, `tests/integrity.spec.ts`.
  - M1 and M2: `src/ui/Toast.tsx`.
  - M2 (I04 r1–r6): `src/screens/focus/FocusScreen.{tsx,module.css}`, `src/screens/home/Home.module.css`,
    `src/screens/home/StatusBar.tsx`, `src/ui/Toast.module.css`, `tests/a11y-probes.mjs`, `tests/a11y.spec.ts`,
    `tests/statusbar.spec.ts` (new), `tests/toast-room.spec.ts` (new).
- **vs r5 `33a72e6`:** 6 files.
  - From M1's merge: `timer.md`, `flow.ts`, `Toast.tsx`, `integrity.spec.ts`.
  - From r6: `Toast.module.css`, `Toast.tsx` (the Toaster call site) and `toast-room.spec.ts`.
- **r6 alone (`ca23385` → `091249a`):** `src/ui/Toast.module.css`, `src/ui/Toast.tsx` (+7 −2) and
  `tests/toast-room.spec.ts`.
- **M1's files:**
  - `$ git diff --stat 3f00b57 091249a -- kettle/tests/integrity.spec.ts` prints **nothing**: byte-identical.
  - The same holds on the scratch merge `859f9fb`, and for `src/app/flow.ts`.
  - `Toast.tsx` differs only at the Toaster's call site (see (b)). `toastLiftBottom()` and `useToastAbove()` are
    byte-identical to `3f00b57`, compared function by function in `r6/toast-lift-identical.txt`.
  - No toast id is special-cased.

### (b) R5-D1: root cause, and why the new structure removes it by construction

- **The defect (Checker r5).** An older toast leaving a scrolled list put the warning's **layout box** 7–47 px below its
  room, over the docked start, for ≈150–250 ms.
  - M1's hold rule (`protectedUnderToasts()` in `flow.ts`, unchanged) reads that box with `getBoundingClientRect()`.
  - It therefore took the warning away and re-showed it reset.
- **Root cause.** In r5, where the warning's box sat was not a fixed fact of the layout. It was recomputed every frame
  from the list's scroll state:
  - The warning was a `position: sticky; bottom: 0` item of a **reversed** (`column-reverse`) scroll list. Its in-flow
    place is the list's end, below everything else.
  - Only the sticky offset brought it back into view. That offset depends on the scroll offset and is clamped by the
    sticky item's containing block, the list's content.
  - When an older toast left, the content and the scroll range changed, and Chromium's scroll anchoring moved the
    offset (+1 → −63 in the Checker's trace).
  - On the next scroll step the in-flow position was below the scroll box, and the sticky offset did not bring it
    back in that frame.
  - The Checker showed anchoring is the trigger but not the whole cause: with `overflow-anchor: none` the box was
    still up to 9 px low.
  - So the box was correct only if anchoring, sticky resolution and input happened in a favourable order. That is a
    race.
- **New structure.** In short-room mode, a stack holding a toast with an action is a plain **top-down** column, with
  that toast **first** (`order: -1`).
  - It has no sticky item, no reversed scroll origin and no `z-index` layers.
  - Its transform is forced to `none`.
  - Where it rests ends **2 px above the room's bottom edge**: the list has `padding-bottom: 2px`, and that toast has
    `max-height: calc(100cqh - 2px)`.
- **Its box then follows from three invariants that hold in every frame,** whatever the timers, anchoring or input do:
  1. **The list's offset is in [0, range].** A top-down block-axis scroller's `scrollTop` is clamped by the browser to
     `0 … scrollHeight − clientHeight`. Removals and anchoring can move the offset only inside that range. The first
     item's top is `content top − scrollTop`, so its box is at its resting place at offset 0 and higher at every other
     offset. It is never lower than where it rests.
  2. **Where it rests is inside the room, 2 px clear of its bottom edge.** The room is the toast region; the stack sits
     at its bottom, and the list ends 2 px short of it.
     - Content shorter than the room: the list is sized to its content, so the first item ends at or above the
       content's end, 2 px above the room's bottom.
     - Content taller: the list fills the room, and at offset 0 the first item starts at the room's top. It is at
       most the room's height less 2 px.
  3. **The measured box is the layout box.** `transform: none !important` overrides framer-motion's inline transforms
     (entry `y: 18, scale: 0.94`, layout projection, exit `y: 8`). `getBoundingClientRect()` never sees a displaced
     box.
  - Nothing waits for a frame, a timer or an input. The warning's box is inside the room at any offset, with any set
    of toasts, as toasts arrive or leave, with anchoring on or off.
- **The two other ways the warning met the docked start,** both found by r6's own reproduction runs and both closed
  by construction:
  - **Entry (the warning taken away while Today rises into place).**
    - Route changes bring the new screen in from 10 px lower (`App.tsx`, content `y: 10 → 0`, unchanged).
    - `toastLiftBottom()` places the room 10 px above the docked start *as measured*. `useToastAbove()` re-measures
      every 250 ms.
    - If the measure came while Today was still up to 10 px low, the start rose by up to 10 px under a warning whose
      box ended exactly at the room's edge.
    - In the recorded frames both were at 334 px (375×667 @200 %) until the next measure. M1's watcher saw the boxes
      meet and hid and re-showed the warning.
    - This happened in 22 of 72 `race6.mjs` runs at 375×667 @200 % and 3 of 72 at 844×390 @200 % on `cb1cd9e`
      (`intermediate-cb1cd9e/race6-natural-cb1cd9e.txt`, entry count at its end).
    - With the 2 px slack, the start can come no closer than 2 px (−0.5 px rounding) to the warning's box before the
      next measure. That holds wherever in the rise the measure fell.
  - **The last toast's own end.**
    - The list empties the moment the last toast is dismissed or times out. `useToastAbove(list.length > 0)` then
      released the lift, although AnimatePresence still draws the toast while it fades (~160 ms).
    - At 200 % the region's stylesheet place is over the docked start, so the fading toast was drawn over the start
      for 2–9 frames. This was pre-existing; it shows here when the warning's own 12 s ends under touch.
    - The Toaster now passes `list.length > 0 || drawn` (`Toast.tsx`, call site only). `drawn` is set while the list
      has toasts and cleared by AnimatePresence's `onExitComplete`, so the lift is kept until nothing is drawn.
    - `toastLiftBottom()` and `useToastAbove()` are unchanged.
- **Not covered (timing outside the toast list, M1's and I04's own):**
  - The room follows the docked start through the 250 ms lift poll. When the **page** scrolls the start itself (it
    stops being sticky at the end of Today), the room catches up within 250 ms.
  - See (d): keyboard focus scrolls the page there.
- **Nothing of a warning-led stack is drawn below the room.** The list's scroll box ends at the room's edge, so no
  toast is painted over the start at any offset.
  - A first version (`cb1cd9e`) let the scroll box reach 8 px below the room. During Today's rise an older toast's
    edge was drawn over the start for 1–2 frames, so that was removed.
- **Reading in very short rooms.** In a room under 4 em (667×375 at 200 %: 60 px) the warning has a 14 px gap below it
  instead of 8.
  - An older toast nearly as tall as the room is wholly in view only over a narrow range of list offsets: 67.5–80.5 px
    for a 56 px toast.
  - 20, 24 and 40 px steps from rest come to rest inside that range (80, 72 and 80).
  - 53 and 100 px wheel notches do not, as in r5 (see Still open).
- **Removed from r5:** the sticky warning, its `z-index` layers, and `position: relative` on toasts.
- **Unchanged:**
  - Toasts are capped at the room's height and scroll their own message (`align-items: safe center`).
  - The sticky action inside a toast.
  - The large-text and tiny-room layouts.
  - The bottom-up list for stacks **without** an action toast.
  - Everything outside short-room mode: no change at 100 % on 375, 390 or 1440, apart from the lift being kept while
    the last toast fades.
- **What a person sees** (large text, or a short landscape room, with the warning):
  - The warning is at the top of the stack, opening first, with "Save backup" in view.
  - Reading down scrolls its message to the end, then hands the scroll on to the list: the warning moves up and the
    older toasts come into view below it.
  - Scrolling back up returns to the warning.
  - In r5 the older toasts were above the warning and were revealed by scrolling up.

### (c) The round-5 reproduction on a disposable profile (real timers, real input)

Probe `.tmp/w1fix/repro6.mjs`; evidence in `r6/c-repro/` (`repro6-final.txt` log, `repro6-final.jsonl` every frame of
every run, three clips).

- **Setup, per run:**
  - A fresh browser context, so a disposable profile.
  - 200 % text; the newbie seed one leaf below its next level; localStorage really full (`QuotaExceededError`).
  - A brew started, fast-forwarded 12 min with the debug build's brew clock (`__kettle.ff`, setup only), then ended:
    Today with three toasts ("Cozy level 5!", "Saved 12 minutes of focus", the warning).
- **Toast timers are never touched.** No synthetic `pointerenter`/`pointerleave`, no held toasts, no timer changes. A
  toast pauses only under the real pointer (wheel runs) or a real touch, as in use. The older toasts expire after their
  natural 3.2 s.
- **Input is real only.** `page.mouse.wheel` in 20 px notches, or CDP `Input.dispatchTouchEvent` finger drags of 24 px.
  It lands on a toast. There is no programmatic scrolling.
  - The person reads the warning down, goes on down as far as the stack goes, pauses 0.3 s, then comes back up as far
    as it goes.
  - Each phase stops when nothing has moved twice.
- **Timing varied** so the older toasts' expiry lands before, during or after the gesture:
  - first input 3.6, 4.2 or 4.8 s after the warning appears ("before");
  - 1.0, 1.6, 2.2 or 2.8 s ("during");
  - 0.3, 0.6 or 0.9 s with a short gesture of 4 notches down and 4 up, after which the pointer leaves ("after").
  - Each timing runs once by wheel and once by touch: 20 runs per configuration.
- **Recording:** every animation frame, from before End to more than 2 s after the last input.
- **Judged from the first frame the warning is at full opacity** (its fade-in, ≈0.2 s):
  - **hide/reset:** the warning's element removed (any re-add counts: M1's rule re-shows it reset), or below 0.98
    opacity. The one exception is its own 12 s timed end, judged to its first fading frame.
  - **overlap**, any of:
    1. the warning's layout box (what M1's rule measures) over a protected control;
    2. the drawn part of **any** toast (its box clipped to the list's scroll box) over a protected control, in any
       frame including the warning's own exit;
    3. a protected control's centre hit-testing as a toast.
  - Protected means M1's set on Today: `[data-toast-above] :is(button, a[href], [role="button"], input, textarea,
    select)`.

| Configuration | Runs (wheel / touch) | Failures | Hide/reset events | Overlaps (box / drawn / hit-test) | Older-toast expiry landed before / during / after the gesture (runs) |
|---|---|---|---|---|---|
| 375×667 @200 % light | 20 (10 / 10) | **0** | **0** | **0 / 0 / 0** | 6 / 10 / 4 |
| 375×667 @200 % dark | 20 (10 / 10) | **0** | **0** | **0 / 0 / 0** | 6 / 9 / 5 |
| 844×390 @200 % light | 20 (10 / 10) | **0** | **0** | **0 / 0 / 0** | 6 / 9 / 5 |

- In 2 of the 844×390 touch runs the warning's own 12 s also ran out (no pointer holds it under touch).
  - That is not a hide or reset: its element leaves once, with no re-add.
  - Its exit was still judged for overlaps: 0 frames.
- In every run the warning's bottom stayed at least 2 px above the room's bottom: the maximum of (warning bottom − room
  bottom) over all judged frames is −2 px.
- **Clips:** video, not a frame sequence. Playwright `recordVideo`, webm, 25 fps, at the viewport size. One per
  configuration, each the first "during" wheel run, covering the whole run from setup to 2 s after the last input:
  - `clip-final-375x667-light-wheel-during-d1000.webm`
  - `clip-final-375x667-dark-wheel-during-d1000.webm`
  - `clip-final-844x390-light-wheel-during-d1000.webm`
  - Two frames of the first, extracted with Playwright's own ffmpeg, are next to them as PNG and were opened: the
    warning scrolled up with "Save backup" in view, "Cozy level 5!" fading out on its timer and "Saved 12 minutes of
    focus" below, all above the docked start.
- **The same probe on earlier r6 code found two problems** (`r6/intermediate-*/`). Both are fixed in `091249a`; see (b):
  - on `cb1cd9e`: entry hide/reset in 3 of 10 runs, and older toasts drawn over the start for 1–2 frames;
  - on `d074863`: the fading warning drawn over the start at its own 12 s end, in 1 of 9 runs at 844×390.

### (d) Keyboard: does Tab reach "Save backup" at 375×667?

Probe `.tmp/w1fix/kbd6.mjs`; evidence in `r6/d-keyboard/` (`keyboard-final.txt`, `keyboard-why-100.txt`, screenshots).

- **Setup:** Today with the warning. Storage is really full, and a brew was ended within its first minute, so the stack
  is "Kettle's off" plus the warning.
- **Input:** real key presses from the top of the document, one `Tab` every 500 ms, up to 80.
- **Logged for every Tab:** the focused element, the warning, the toast region, the docked start and the page scroll.
  Every removal or re-add of the warning is timed.

| Text size | Theme | Result | Focus ring on "Save backup" | Enter |
|---|---|---|---|---|
| **200 %** | light | **reached** after 14 Tabs | `:focus-visible`; 3 px solid `rgb(36,119,184)`, 3 px offset | backup downloaded |
| **200 %** | dark | **reached** after 14 Tabs | `:focus-visible`; 3 px solid `rgb(143,208,255)`, 3 px offset | backup downloaded |
| **100 %** | light | **not reached** in 80 Tabs (4 full cycles) | — | — |
| **100 %** | dark | **not reached** in 80 Tabs | — | — |
| 100 %, **Shift+Tab** from the top | light / dark | reached after 7 presses | `:focus-visible`, same rings | backup downloaded |

- **Screenshots, opened:**
  - `kbd-final-375x667-200-{light,dark}-Tab-save-backup-focused.png`: the ring is visible round "Save backup", at the
    bottom of the scrolled warning, above "Put the kettle on".
  - `kbd-final-375x667-100-{light,dark}-ShiftTab-save-backup-focused.png`: the same ring at 100 %, reached in reverse
    order.
  - `kbd-final-375x667-100-{light,dark}-Tab-not-reached.png`: taken after the 80th Tab. Focus has wrapped back to the
    composer's text field, and the warning has been re-shown, as at the end of every cycle; focus never reached it.
- **Why forward Tab fails at 100 %.** Measured every 50 ms by `.tmp/w1fix/kbdwhy.mjs` (`keyboard-why-100.txt`); no
  estimates:
  1. In DOM order the toast region comes after Today's docked start. So "Save backup" is the next stop after "Change
     brew length".
  2. Tab 12 focuses "Put the kettle on". Chromium scrolls the focused element into view, and the page scrolls 223 → 513,
     its end.
  3. Until then the docked start (`Composer` `.ctaDock`, `data-toast-above`) was stuck to the bottom at 499–599. At the
     page's end it sits in flow at 235–335.
  4. `toastLiftBottom()` counts a `data-toast-above` element only if its bottom is below 60 % of the viewport
     (`r.bottom > innerHeight * 0.6`, i.e. 400). 335 is not, so `lift = null`, and the region falls back to its
     stylesheet bottom, 489 → 481.
  5. M1's `protectedUnderToasts()` then uses that bottom. Its zone `[bottom − 170, bottom]` = `[319, 489]` (later
     `[311, 481]`) overlaps "Change brew length" at 301–325.
  6. `watchSaveWarning()` therefore dismisses the warning and holds it. It was gone ≈390 ms after the Tab, before the
     next Tab.
  7. Tab 13 reaches "Change brew length". Tab 14 leaves the document, because the warning is not there.
  8. Tabs 15–19 go to the skip link and the tab bar. Tab 20 is back on the status bar at the top, and the page scrolls
     back to 0.
  9. The start sticks again at 499, the lift returns (bottom 489), the zone clears, and the warning is re-shown 3.8 s
     after it went. Focus has passed it by then.
  10. Every cycle repeats this.
  - The Checker's r5 note 2 found the same on the r5 trial and on M1 alone. I did not re-measure those this round.
  - It needs `toastLiftBottom()`'s 60 % rule, `protectedUnderToasts()`'s zone, or Today's page length to change.
    `flow.ts` is frozen, `toastLiftBottom()` must keep its logic, and Today's 100 % geometry must not change. So it is
    **not fixed in r6**.
  - Keyboard users can reach the button in reverse order (Shift+Tab, 7 presses).
- **At 200 % (passes):**
  - At the end of the page the lift stays active: at Tab 13 the region's bottom is 245, the docked start's top 255 −
    10 (logged). The room follows the start, and the zone stays clear of "Change brew length".
  - **One timing blip remains:** on Tab 13 the page scroll moves the start under a room whose lift updates every
    250 ms. The warning was briefly taken away and re-shown (60–90 ms) in 1 of 2 runs on the final code and in 4 of 6
    on `cb1cd9e` (the same Today and lift code).
  - Focus still reached "Save backup" on Tab 14 in 8/8 runs.
  - The r5 trial had the blip in 6/6 runs, reaching the button on Tab 14–15 (`d-keyboard/keyboard-200-repeats.txt`).
  - It is a page-scroll and lift-poll interaction outside the toast list, so (b)'s construction does not cover it.

### (e, part 2) Test results on the combined revision `091249a`

| Suite | Command | Result | File |
|---|---|---|---|
| Typecheck | `npx tsc --noEmit --pretty false` | **clean** (branch and scratch merge) | `r6/tsc-vitest.txt` |
| Unit | `npx vitest run` | **26 files, 265 passed** (branch and scratch merge) | `r6/tsc-vitest.txt` |
| Browser, chromium | `KETTLE_PORT=5202 npx playwright test --project=chromium --workers=1` (every spec except timer and PWA: `a11y` 11, `integrity` 28, `statusbar` 9, `toast-room` 10, `whistle` 8) | **66 passed**, 0 failed, 0 skipped | `r6/e2e-chromium.txt` |
| Timer and PWA | `KETTLE_PORT=5202 KETTLE_PWA_PORT=5232 npx playwright test --project=timer-harness --project=timer-app --project=pwa --workers=1` | **29 passed, 2 skipped** | `r6/e2e-timer-pwa.txt` |

- **Why 2 are skipped.** Both are timer-app tests, skipped by the spec itself because they test the harness only:
  - "Space toggles …": `test.skip(!kettlePage.includes('harness'), 'infra is exercised in the harness; screens bind
    their own keys')`;
  - "useRemaining re-renders …": `'render counter lives in the harness'`.
  - Both run and pass in `timer-harness`. The skips are the same as in every earlier run, M1's included.
- **`tests/integrity.spec.ts`** (M1's, 28 tests) is byte-identical to `3f00b57` and passes. See (e, part 1) for
  `git diff --stat 3f00b57 091249a -- kettle/tests/integrity.spec.ts`, which prints nothing.
- **`tests/toast-room.spec.ts` (10 tests):**
  - **R5-D1, real toast timers** (light, dark). Follows the Checker's targeted path:
    1. every toast held once, as a pointer resting on the stack would;
    2. read the warning to its end and scroll as far as the stack goes;
    3. rest 2.3 s and come back;
    4. the middle older toast's timer released, so it expires;
    5. one more wheel step.
    - It asserts no frame with the warning's box below the room or over the start, no frame below full opacity, and
      the warning never leaving the page from End on.
    - **It fails on the r5 trial.** The committed file: the warning left the page once in each theme
      (`r6/before-r5-trial/toast-room-final-spec-on-r5-trial.txt`). The earlier working version: 23 and 24 frames out
      of the room (`toast-room-on-r5-trial.txt`).
  - **Reading** at 375×667, 844×390 and (new) 667×375 at 200 %, by wheel and by touch:
    - every warning line read, every older toast wholly on screen (hit-tested), the list still after the last input;
    - the warning never out of its room, and never taken away since End.
    - Input lands on a toast, because the list between toasts lets input through to the page.
  - **The last toast fades where it was** (375×667 and 844×390 at 200 %). It fails on `d074863` (8 and 9 frames;
    `r6/intermediate-d074863/`) and on the r5 trial (4 frames each).
  - On the r5 trial the committed file passes the 6 reading tests (r5's held-timer reading) and fails the 4 others.
  - The file runs with tracing off. Per-action trace snapshots spaced the steps so far apart that the races never
    happened.

### (f) Full-size BEFORE / AFTER captures

Probe `.tmp/w1fix/capture6.mjs`; files in `r6/captures/{before-0d58c5e,after-091249a}/<viewport>-<theme>/`.

- **BEFORE** is app code `0d58c5e` (integration `c6c7922`, `kettle/src` `1fc4a1b…`), served from a `git archive` copy.
  **AFTER** is `091249a`.
- **Viewports:** 390×844, 375×667 and 844×390 (DPR 2, touch) and 1440×900 (DPR 1), each light and dark, 100 % text.
- **Setup:** each state is captured in a fresh context with the newbie seed; the 3D scene is off (stills) and sound is
  muted. 64 PNGs (2 × 8 configs × 4 states); 0 page errors on either side. Routes, toasts and warning boxes per state
  are in `meta.json`.
- **All 64 were opened at full size.**

| State | BEFORE `0d58c5e` | AFTER `091249a` |
|---|---|---|
| **Home with the warning** (storage full, End within the first minute) | 390×844: "Kettle's off" above the warning, which sits just above "Put the kettle on". 375×667: the warning (312–429 px) above "Kettle's off". 844×390: "Kettle's off" above the warning, over the stats card. 1440: the warning over the composer, "Kettle's off" under it, both above the start. | 390×844 and 1440: the same as BEFORE in the screenshots (the 100 % geometry is unchanged). 375×667: "Kettle's off" above the warning, which sits 10 px above "Put the kettle on", as in r5. **844×390 (a short room):** the warning-led stack, with the warning first and "Kettle's off" below it, above the start. (1440's `meta.json` was read mid-settle; see Still open 10.) |
| **Focus running with the warning plus toasts** (storage full; two toasts raised 3 s in) | Phones and 844×390: **the warning is shown over the countdown and readout** ("Kettle couldn't save …" over 24:56 at 390/375/844). This is the integration regression M1 fixed. 1440: the warning and toasts over the stage. | Phones and 844×390: the warning is **held** (M1's rule; it shows when the brew ends). The two toasts sit above Add 5 / Pause / End. At 844×390 "Recipe done" touches the top of the 24:56 digits (unchanged class, Still open 7). 1440: the warning and toasts over the stage, beside the panel (M1). |
| **Break's over with toasts** | Phones and 844×390: the toasts cover **"Mark it done, start fresh"** (D4). 1440: over the stage. | The toasts sit above "Mark it done, start fresh" (over the "Break's over" heading on phones; D4, r4, accepted). Every control is clear. 1440: unchanged. |
| **The summary after a level-up** | "25 minutes brewed", Done / Carry forward, "Fairy lights is in your nook · Cozy level 5", Tea time / Skip break. No toast. | The same, apart from date-driven copy. |

### Real-input matrices on the final code (R5-D1 and R4-D1 retests, as the r5 Checker required)

All on `091249a`, served on 5202. Logs in `r6/`.

| Probe | Timers | Set | Result |
|---|---|---|---|
| The Checker's `race.mjs` (unedited copy, `POST=80`): the targeted R5-D1 path | held once; the middle older toast released after scroll-back, then one more step | 375×667 @200, 844×390 @200, 667×375 @150 and @200, 568×320 @100; light and dark; wheel and touch; 3 reps | **0 failures in 60** (`chk-race-final.txt`); strict re-judge 0 of 60, the warning's bottom at most −2 px from the room's |
| The Checker's `natural.mjs` (unedited copy): no synthetic events at all | real | 375×667 and 844×390 @200, 667×375 @150 and @200; light and dark; waits 0.6, 1.2 and 1.8 s; 3 reps | **0 failures in 72** (`chk-natural-final.txt`); strict re-judge 0 of 72, at most −2 px |
| `race6.mjs` natural (mine): up as far as the stack goes, wait, down in 20 px notches and keep going, wait, up and keep going; wheel and touch; End < 1 min and End after 12 min + level-up | real | the same 4 configs × 2 themes × 2 flows × 2 inputs × waits 0.6/1.2/1.8 s × 3 reps | **0 failures in 288** after re-judging; race6 itself flagged 5. Entry hide/reset: **0 of 288** (`cb1cd9e`: 25 of 288) (`race6-natural-final.txt`) |
| `readscroll6.mjs`: the full R4-D1 set (the Checker's r5 `readscroll.mjs`, made independent of where older toasts sit) | held, as in the Checker's | 375×667 @200, 667×375 @150/@200, 844×390 @150/@200, 568×320 @100 × alone / End < 1 min / End + level-up × wheel 20 px and touch × light and dark | **0 failures in 72**. Every line of the warning and of every older toast read; every older toast wholly on screen; "Save backup" in view, hit-testing and **downloading** in 84/84 |
| the same, coarse notches | held | 667×375 @200 × three flows × 53 px and 100 px × two themes | 12/12 flagged, as in r5 (see Still open 3) |

- **The 5 runs race6 flagged** (667×375 @150 %, touch, 1.8 s waits) are the warning's **own** 12 s end. Its exit fade
  began in the last 20–120 ms of the recording, before its element was removed. race6 recognises a timed end only by
  that removal.
  - `.tmp/w1fix/rejudge6.mjs` re-judges a run as an own end only if all of these hold:
    - the warning was never removed or re-added;
    - the fade is monotonic and lasts to the last frame;
    - its box was inside the room and 12 px clear of the docked start in every judged frame.
  - The faded frames (0.81 → 0.08) are logged in `race6-natural-final.txt`.
- **How the Checker's two scripts behave on r6:**
  - They were written for r5's bottom-up stack. `race.mjs` scrolls "up to the oldest toast" and back to an offset of
    −1. On r6 the list cannot scroll up past 0, so the release happens with the list at rest.
  - `natural.mjs` wheels up (nothing moves) and then down four notches.
  - They are run unedited, as the Checker's own check. `race6.mjs` and `readscroll6.mjs` cover the r6 directions: down
    to the older toasts, rest there, then back.
- **The Checker's scripts judge the warning against the list's box.** In r6 that box ends at the room's edge, so they
  are re-judged against the region's bottom by `.tmp/w1fix/strictjudge.mjs`: 0 of 60 and 0 of 72, with the warning's bottom at most −2 px from the room's bottom in every judged frame.
- **Resting-list motion in readscroll.** In 12 of the 72 runs the resting list's offset changed in the very frame an
  older toast timed out and left: the toasts above the one under the pointer slid down by its height.
  - That is the real timer, not a scroll reset. The warning is unaffected.
  - The probe still fails any other change. r5 shows the same in 11 runs (`r6/before-r5-trial/`), and the Checker
    judged it "not a defect" in r5.

### Kept (on the final code)

- **M1's `contracts/I03/capture-storage-full.mjs`** at the six configs, compared with M1's AFTER by `metacmp.mjs`
  (route and toasts, state by state): **0 of 60 states differ**, 0 page errors (`r6/m1-capture-storage-full/`).
- **D4** (break-over controls never under a toast; `.tmp/w1fix/breakover.mjs`): **0 failures in 24**
  (`r6/breakover-final.txt`).
- **The last toast leaving** (`.tmp/w1fix/lastexit.mjs`, every frame, 6 configs × 2 themes × warning / plain toast):
  **0 of 24** (`r6/lastexit-final.txt`). `d074863` failed 10 of 24, every 200 % case.
- **100 % toast geometry** (`toaststack.mjs @100` vs r3's `stack-after.txt`, `geomcmp.py`; `r6/stack-geometry-100.txt`):
  - **identical** for all 24 rectangles at 375×667, 390×844 and 1440×900 (four stacks, both themes);
  - **different** for all 32 in the short rooms at 100 % (568×320, 667×375, 844×390, 320×568). A stack with the
    warning leads with it, and a warning alone sits 2 px higher. See Still open 4 and 5.
- **R4-D2 kept:** `StatusBar.tsx` is unchanged since r5. `statusbar.spec.ts` "rapid live resizes at large text leave
  the page unzoomed" (light and dark) and the other 7 statusbar tests pass in the chromium run above.
- **01 / 01b / 10 recaptures** (`review/product-excellence/tools/capture.mjs --only 01,01b,10`, the six usual configs,
  AFTER `091249a` and BEFORE `0d58c5e`; `r6/captures-01-01b-10/`, `pixel-diff.txt`), 0 page errors:
  - 01 and 01b vs r5's AFTER: phones **0.000 %**; 1440 ≤ 0.019 % (Chai's idle frame).
  - 10 vs BEFORE: 12–16 % on phones and 3.3 % at 1440. The raised toast sits above "Mark it done, start fresh" (D4,
    r4) instead of over it, plus Chai's frames.
  - Opened: 375×667 light 10 (AFTER and BEFORE), 390×844 dark 01, 1440×900 light 01b.
- **Phone load CLS at 100 %** (production build of `091249a`, `vite preview` on 5232, `clsprobe.mjs`;
  `r6/cls-today-load.txt`):
  - **0 on 390×844, 375×667 and 360×740** in every load: 5 loads with the seed, then 3 each with fonts delayed 2.5 s,
    a saved profile of 2,296 leaves (`tight` at 375), and both together.
  - 1440×900 is 0, or 0.0028 with slow fonts, as in r5.

### How r6 got here (intermediate code, kept as evidence)

1. **`cb1cd9e`: warning-led top-down stack.** Its scroll box reached 8 px below the room (for older toasts in a 60 px
   room).
   - The Checker's targeted `race.mjs`: 0/60. `natural.mjs`: 0/72. `race6.mjs` natural: 0/288. readscroll matrix:
     72/72 on wheel and touch.
   - `r6/intermediate-cb1cd9e/`.
   - **But** `repro6.mjs`, which judges from the warning's full opacity rather than +1.2 s, found two things in its
     first 10 runs:
     - the entry hide/reset of (b), in 3 of 10 runs; race6's records show it in 25 of 288 runs, at 375×667 and
       844×390 @200 %;
     - an older toast's edge drawn over the start for 1–2 frames, through the 8 px strip, while Today rose.
2. **`d074863`:** the stack ends 2 px above the room, and nothing is drawn below it. In rooms under 4 em the gap below
   the warning is 14 px, so 20/24/40 px steps still stop with the older toast wholly in view. The spec checks that the
   warning never leaves the page from End on.
   - `repro6.mjs`: 0 failures in the first 11 runs at 375×667.
   - At 844×390, 1 of 9 runs failed: the warning's own 12 s end under touch dropped the region, and the fading
     warning was drawn over the start.
   - `r6/intermediate-d074863/`, including `lastexit.mjs`: 10 of 24 cases drew the last toast over the start while
     fading, every 200 % case of a warning or a plain toast.
3. **`091249a`:** the Toaster keeps the lift until the last exit has finished. `lastexit.mjs`: 0 of 24 (see (e)). The
   new spec test fails on `d074863` (8 and 9 frames) and passes on `091249a`.

### Still open (r6)

1. **Keyboard at 375×667 / 100 %:** forward Tab never reaches "Save backup"; Shift+Tab does. The exact mechanism is in
   (d). It is not fixable without changing frozen or must-keep logic, or Today's 100 % geometry.
2. **Page scroll moving the docked start** (keyboard focus at 200 %, or any page scroll at the end of Today) can still
   make M1's rule hide and re-show the warning, for 73–92 ms on r6.
   - The room follows the start through the 250 ms lift poll.
   - The r5 trial does the same: 6 of 6 keyboard runs, 21–133 ms.
   - It is outside the toast list.
3. **Coarse wheel notches at 667×375 @200 %** (a 60 px room), as recorded by the Checker in r5:
   - **53 px notches:**
     - the warning alone: 9 of 11 lines read, the same as r5;
     - End < 1 min and End + level-up: **7 of 11** lines (r5: 9 of 11). The warning's box is now 2 px shorter, 58 px,
       so a line is wholly in its box over fewer offsets.
   - **100 px notches:** 3 of 11 lines read, the same as r5.
   - With 53 or 100 px notches one older toast is never wholly in view: r6's first older toast, r5's second.
   - Sources: `readscroll-final.txt` and `before-r5-trial/readscroll-r5-trial.txt`.
   - Lines that pass between notches are not stopped on. Touch, a touchpad and 20/24/40 px steps read every line.
4. **Short rooms at 100 % reorder.** In 568×320, 667×375, 844×390 and 320×568, a stack with the warning shows it at the
   top, with older toasts below; a warning alone sits 2 px higher.
   - All 32 toast rectangles there differ from r5. For example, at 844×390 with "Kettle's off" the warning's box is at
     141–218 instead of 203–280 (`r6/stack-geometry-100.txt`).
   - 375, 390 and 1440 at 100 % are identical (24/24).
5. **Older toasts scrolled out below the room have layout boxes over the docked start.**
   - In a warning-led stack taller than its room, the older toasts not yet scrolled into view are laid out below the
     room's edge, clipped by the list.
   - They are not painted there and not hit-testable. The control-centre hit-tests and the drawn-area checks in (c),
     `toaststack.mjs` and `lastexit.mjs` all pass.
   - But their `getBoundingClientRect()` reaches over the docked start. `toaststack.mjs`'s layout-box check
     ("noneBelowRoom") flags the 4 three-toast stacks at 568×320 @100 % for this.
   - Only the warning's box is measured by M1's rule, and it never leaves the room.
   - r5 laid the same overflow out above the room instead.
6. **In short rooms the warning fades in and out without sliding** (transform off). Other toasts keep their motion.
7. **Visual order differs from DOM order** for the warning in a short-room stack: it is drawn first and is last in the
   DOM.
   - The live region announces additions, so the order of announcements is unchanged.
   - "Save backup" is the only focusable element in the stack.
   - A screen reader browsing the list reads oldest first. That is BLOCKED for real assistive technology.
8. **Ordinary toasts on the session screen at 844×390 / 100 %** sit over the stage and the top of the readout:
   "Recipe done …" covers the top of the "24:56" digits in (f).
   - This is unchanged: the bottom-up list without an action toast, as in r5. It is the r2 note 5 / I10 class.
   - The warning itself is held there by M1's rule.
9. **Break-over:** the two raised toasts sit above "Mark it done, start fresh" (D4, r4) and so over the "Break's over"
   heading. This is unchanged since r4 and was accepted by Checker r5.
10. **Home at 1440×900 right after End**, the same class on BEFORE and AFTER (`r6/captures/lift1440.txt`):
    - for ≈0.5–2 s the leaving session layer's control row (`data-toast-above`) is still in the DOM, so
      `toastLiftBottom()` lifts the toasts above it (378 instead of 266 px), and they float ≈110 px higher before
      settling above "Put the kettle on";
    - how long the region keeps the higher lift after the row has gone differs from run to run:
      - BEFORE: under 1 s;
      - AFTER: in the 3 repeats that also sample the app's own `toastLiftBottom()`, it returned 266 while the
        region's style still said 378 for up to ≈1 s. In 1 earlier run the style stayed at 378 for 2–4 s;
      - both of the slower samples were taken while another browser was capturing in parallel;
    - the lift is M1's unchanged `useToastAbove()` (250 ms poll). The Toaster change cannot act here: toasts are on
      screen throughout, so the hook is active either way. The cause of the longer lag is **not established**;
    - the two capture sets' `meta.json` caught different moments of this. The screenshots show both settled.
11. Unchanged from r5: the 150 % transient over-width during drags; 200 % + slow fonts at 390×844 counted 0.384; r3's
   clipped bottom shadow in short rooms.

### BLOCKED / UNKNOWN (never PASS)

- **BLOCKED:**
  - real phones and touch hardware, real mouse-wheel notch sizes, real window managers and OS text-size settings.
    Everything here is Chromium headless with SwiftShader and emulated viewports, `isMobile` with touch at DPR 2, and
    `html { font-size }` for large text;
  - real assistive technology;
  - real-device audio, lock screen and real-device performance.
- **UNKNOWN:**
  - iOS Safari / WebKit handling of `:has()` with `order` in a flex column, of `cqh`, `align-items: safe center`, the
    sticky action inside a scrolling toast, and AnimatePresence's `onExitComplete` timing there;
  - scroll anchoring in other engines. r6 no longer depends on it: the offset is clamped either way.

### Not produced

Nothing the coordinator listed is missing. These limits apply:

- **Clips:** the three clips are video (webm). They are recorded by Playwright in headless Chromium with SwiftShader,
  not on a phone.
- **(d) at 100 %:** forward Tab does not reach "Save backup". The reason is measured and given in (d); it is reported
  as a failure, not estimated away.
- **BEFORE for the R5-D1 reproduction (c):** the 60 reproduction runs were made on the final code only. The r5 failure
  was shown by:
  - the Checker's own runs;
  - the new spec test on the r5 trial (`before-r5-trial/`);
  - `race6.mjs` natural on the r5 trial during development (375×667 @200 light, End + level-up, one wheel and one
    touch run): the wheel run failed, with the warning's box below the room in 12 frames (up to +3 px).
    `before-r5-trial/race6-natural-r5-trial-2runs.jsonl`.
  - The coordinator's pause stopped the planned r5-side matrices (race6 and the Checker's race/natural on 5222)
    before they started. The readscroll R4-D1 set *was* run on the r5 trial: `before-r5-trial/readscroll-r5-trial.txt`,
    72/72 with held timers.

### Commands (final code `091249a`; servers: 5202 the branch; 5222 `git archive` copies of BEFORE `0d58c5e`, and of the r5 trial `20671eb` at other times; 5232 previews)

```
npx tsc --noEmit --pretty false                                   → clean (branch; scratch merge 859f9fb)
npx vitest run                                                    → 26 files, 265 passed (branch; scratch merge)
KETTLE_PORT=5202 npx playwright test --project=chromium --workers=1                   → 66 passed
KETTLE_PORT=5202 KETTLE_PWA_PORT=5232 npx playwright test --project=timer-harness \
     --project=timer-app --project=pwa --workers=1                                    → 29 passed, 2 skipped (harness-only)
node .tmp/w1fix/repro6.mjs http://127.0.0.1:5202 final <dir> '<cfg>' 20 1             → 0 failures in 60 (c)
node .tmp/w1fix/kbd6.mjs http://127.0.0.1:5202 final <dir> 100,200 light,dark 500 80 Tab   (+ Shift+Tab; kbdwhy.mjs) (d)
node .tmp/w1fix/capture6.mjs http://127.0.0.1:5202|5222 <rev> <dir>                   → 64 captures, 0 page errors (f)
POST=80 node .tmp/w1fix/chk-r5/race.mjs … ; node .tmp/w1fix/chk-r5/natural.mjs …    → 0/60, 0/72
node .tmp/w1fix/race6.mjs http://127.0.0.1:5202 final <dir> natural '<cfg>' 3         → 288 runs, 0 after rejudge6.mjs (5 own-end cuts)
node .tmp/w1fix/readscroll6.mjs …                                                     → 0/72 (+ coarse 12 flagged)
node .tmp/w1fix/strictjudge.mjs <Checker jsonl>                                       → 0 below the region
node review/product-excellence/contracts/I03/capture-storage-full.mjs … ×6 + metacmp  → 0/60 states differ
node .tmp/w1fix/breakover.mjs … ; lastexit.mjs … ; toaststack.mjs … @100 + geomcmp.py
node review/product-excellence/tools/capture.mjs … --only 01,01b,10 (6 configs, AFTER and BEFORE)
npx vite build --outDir <scratch> && npx vite preview --port 5232 ; node .tmp/w1fix/clsprobe.mjs …
git worktree add --detach <scratch>/trial-r6 c6c7922 ; git merge --no-ff 091249a → 859f9fb ; git worktree remove
```

All servers (5202, 5222, 5232) and probes were stopped. The scratch worktree was removed, and the scratch copies in
the session's scratch directory are not worktrees.
