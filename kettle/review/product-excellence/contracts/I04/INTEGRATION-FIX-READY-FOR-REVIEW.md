# I04 integration fix — Today's stats wrap at 375×667 · READY FOR REVIEW

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
