# I04 integration fix (Today's status bar at 375×667) · CHECKER r1

**Verdict: REJECT**

- **Reviewed commit:** `c9520db` (branch `pe/w1-fix-m2`). App source is identical to `3bc0c66` (`HEAD:kettle/src` =
  `57f00c46…`). Diff base: integration `1bec1a8` (app code = Wave 1 merge `0d58c5e`, `kettle/src` = `1fc4a1b1…`).
- **Checker worktrees:** `/home/user/wt/chk-w1m2` (detached `c9520db`) and `/home/user/wt/chk-w1m2-base` (detached
  `1bec1a8`). Each had an untracked checker-only Vite config: the repo config, plus the symlinked `node_modules` real path
  on `server.fs.allow`, no HMR, and a private cache. Servers: dev 5213 (fix), e2e 5253 (fix), dev 5273 (base), and
  later a production build of `c9520db` (`vite build` into the scratchpad, served by `vite preview` on 5273).
- **Short version:** at 375×667 and 100% text, on a fresh load, the fix works. The row stays on one line in both
  themes, and nothing regressed against `1bec1a8` in any configuration I compared. The ladder still fails in two
  states that fall under this contract (375×667, 100% and 200% text) and under the orchestrator's minimum ("no
  clipping or horizontal scroll"). In both, Today scrolls sideways (defects D1 and D2 below). Both corrections are
  small and stay inside `StatusBar.tsx` / `Home.module.css`.

## What I ran (results)

| Command / probe | Result |
|---|---|
| `npx tsc --noEmit --pretty false` | clean (exit 0) |
| `npx vitest run` | 26 files, **265 passed** |
| `KETTLE_PORT=5253 KETTLE_PWA_PORT=5263 npx playwright test tests/a11y.spec.ts --project=chromium` | **9 passed** (9.4 min): axe in light and dark, targets, 375×667 reach, keyboard journey, welcome by keyboard, quiet live regions, toast clear of the controls at 390 and at 375 |
| `… tests/integrity.spec.ts --project=chromium -g "375×667"` | 1 passed. 1 failed at `integrity.spec.ts:1051`: the storage-full warning shows on the session screen after **Next brew**. This is the same assertion and line as the known Wave 1 interaction failure on `0d58c5e` (`integration/wave1/REGRESSION.md`, `e2e-chromium.txt`), and it belongs to M1's `pe/w1-fix`, not to this branch. The Today half of that test ran first and passed: on Today at 375×667 the warning is visible and "Put the kettle on" still hit-tests as itself, so the toast does not cover the docked start. |
| `… tests/integrity.spec.ts tests/whistle.spec.ts --project=chromium` (full) | **32 passed, 1 failed** (6.8 min). The one failure is the same `integrity.spec.ts:1015` (375×667) at line 1051, the known M1 interaction. The integrated `0d58c5e` run had the same split, 41/1 with the a11y spec included. No other Wave 1 regression. |
| `tools/capture.mjs --base http://localhost:5213 --only 01,01b` at 390×844 (DPR 2), 375×667 (DPR 2), 1440×900 (DPR 1), both themes, plus 375×667 both themes again on 2026‑10‑09 (different leaf total) | capture-meta `revision: c9520db`, 0 page errors |
| Pixel diff of my captures against the integrated captures (`integration/wave1/captures`) and against the maker's AFTER | 390 and 1440: ≤ 0.27 % against integrated (shimmer and steam only). 375: 19–24 % against integrated (the fix itself), ≤ 0.06 % against the maker's AFTER. 01b identical everywhere. |
| Status-bar probe (fresh load per config): 10 viewports (414, 390, 375, 360, 344, 320, 768, 720, 844×390, 1440) × text 100/125/150/200 % × data (veteran 2,296 leaves; 123,456; plus a 365-day streak; 470,000 leaves = level 100+; 12,345,678 leaves with a 1,000-day streak), set live through `__kettle.progress.setState` | Mode always equals the ladder's own expectation, so no stale state after a fresh load or a live data change. No page or ResizeObserver errors. 100 %: one row up to level 100 / 470,000 leaves at 390, 375 and 360. Only the absurd 12,345,678 case wraps (375, 360). Against base `1bec1a8` on the same matrix: **18 configurations have a lower bar, 77 are the same, 0 are worse, and none has new sideways scroll.** |
| Live resize / rotation / text-size probe on one page | Text size changes and live data changes follow the ladder correctly. **Resizes do not**, see D1. |
| "Change brew length" probe (375×667, 390×844, 320×568 × light/dark × normal/reduced motion; touch tap) | All 12 cases pass. The link is visible on load and hit-tests as itself. One tap brings 15/25/50/Custom fully above the docked start (375: 235–288 against a dock top of 330; 390: 323–379 against 421; 320: 185–239 against 281), all four radios hit-test, and focus lands on the checked "25 min". |
| CLS on a cold Today load, **production build**, 3 runs each, layout shifts without input over 7 s; also with every `.woff2` delayed 2.5 s | Phones (390, 375, 360 at 100 % in both themes; 390 and 375 at 200 %): **0.0000** in every run, including slow fonts. 1440: 0, and 0.0028 with slow fonts (the bar stays `normal` throughout, so the shift comes from elsewhere). |

## What I opened (Read tool)

- REFERENCE K01 `…/VISUAL_BENCHMARK_LIBRARY/assets/current/01-home.png`.
- ORIGINAL BASELINE (`8f1044a`) `baseline/<cfg>/01-home.png`: 375×667 light and dark, 390×844 light and dark, 1440×900
  light; `baseline/phone-375x667-light/01b-home-scrolled.png`.
- INTEGRATED (`0d58c5e`, the defect) `integration/wave1/captures/<cfg>/01-home.png`: 375×667 light and dark, 390×844
  light and dark, 1440×900 light and dark.
- AFTER (my `c9520db` captures): 01 at 375×667 light and dark (2026‑10‑08 and 2026‑10‑09), 390×844 light and dark,
  1440×900 light and dark; 01b at 375×667 light. The 01b images in the other configs are byte-identical to the
  integrated ones by pixel diff.
- Maker evidence: `integration-fix/reflow/today-375x667-text200-light.png`.
- My probes: discovery after-tap 375×667 dark and 320×568 light; 200 % text with 12,345 leaves at 375×667 and 390×844
  in light, and at 375×667 in dark; after rotation 414→375×667 in light.

**Visual review.** At 375×667 in both themes, AFTER restores the baseline's single row. Streak, leaves and Level sit
on one line, and the greeting is back at y = 64, where it is in the baseline and at 390, instead of about 50 px lower
as in the integrated capture. The only difference from the baseline is 6 px less pill padding at the row's ends: the
mug now lines up with the greeting's left edge. Stat colours are unchanged (persimmon streak, matcha leaves, honey
level). At 390×844 and 1440×900 AFTER equals the integrated capture. These are preserved and match K01's hierarchy:
the greeting, Chai and the bubble, the goal card, the composer with five categories wrapping, Brew length
15/25/50/Custom, the orange docked "Put the kettle on · 25 min", and the sky "Change brew length" link.

## Per-criterion findings

| Criterion (orchestrator minimum / matrix I04) | Finding |
|---|---|
| No wrap at 375 px at 100 % text | **PASS on load** in both themes, with today's and stressed data. **FAIL after a resize or rotation to 375**: the row stays in `normal` and overruns the screen (D1). |
| Wraps legibly at 200 % text and at 320 px reflow | 320 at 100 %: one row (the existing 320 layout), PASS. 200 %: wraps, but **not legibly once leaves ≥ 10,000 at 375×667**: the "Level NN" label is clipped at the screen edge (D2). |
| No clipping or horizontal scroll | **FAIL**: D1 (2 px, 100 % text) and D2 (13 px, 200 % text). |
| CLS 0 on Today load | PASS (production build, phones 0.0000, including slow fonts). |
| Docked start, "· 25 min", brew-length discovery, sky "Change brew length" link | PASS (captures and discovery probe, including 320 and reduced motion). |
| Nothing else in Wave 1 regressed | The app diff touches only the status bar (`StatusBar.tsx` hook + 4 lines of CSS). The `tests/a11y-probes.mjs` change (`.sr-only` detection by layout size) is test-only and sound. a11y spec 9/9; integrity + whistle 32/1, with the one failure identical to the integrated run and owned by M1. PASS. |

## Defects

### D1: after a resize or rotation, the ladder skips its own "tight" step, and Today scrolls sideways at 375×667, 100 % text

- **Exact defect.** `useWrapWhenCrowded` bails out of `fit()` whenever `document.fonts.status !== 'loaded'`, and the
  only re-run it schedules is the one `document.fonts.ready.then(fit)` registered at mount. In Chromium a viewport
  change briefly flips the FontFaceSet to `loading`, and the status bar's ResizeObserver callback lands inside that
  window. I instrumented it: after a 414×896 → 375×667 resize, "RO callback (bar) fonts=loading" fires at 2597 ms,
  then `loading`/`loadingdone` at 2605/2606 ms, and the mode stays `normal`. So the decision is dropped and never
  made again. The row stays at 12 px padding and the stats end at x = 377 on a 375 px screen. The page becomes 2 px
  wider than the screen (`scrollWidth` 377 > `clientWidth` 375). With the mobile viewport, the layout viewport grows
  to 377×671, so the page is shrunk or pannable and the fixed tab bar ends at y = 671, below the 667 px screen. A
  fresh load at 375 shows the correct `tight`.
- **State.** Today (veteran data, 2,236 leaves on 2026‑10‑09) after the viewport reaches 375×667 from a wider one.
- **Viewport / theme.** 375×667 at DPR 2, 100 % text, light and dark. It reproduces every time from 414×896,
  667×375 → 375×667 (rotation), 844×390 → 375×667, and a desktop window resized 1440×900 or 800×900 → 375×667.
  390×844 → 375×667 happened to work. The same guard exists on `1bec1a8`, which also overflows after such a resize,
  but this fix depends on the ladder running, so it does not hold after any resize or rotation.
- **Required correction.** Never drop a measurement while fonts are loading. For example, re-run `fit` on the
  FontFaceSet `loadingdone` event (a listener for the hook's lifetime, not the one-shot `ready` promise), or re-arm
  `document.fonts.ready.then(fit)` every time `fit` bails. Keep the rule that fallback fonts never decide a wrap, so
  load CLS stays at 0.
- **Required retest.** Resize and rotation sequences 414×896 → 375×667, 667×375 → 375×667, 844×390 → 375×667, and
  desktop 1440×900 → 375×667, in both themes: mode `tight`, one row, `scrollWidth === clientWidth`,
  `innerWidth === 375`, the tab bar's bottom at 667. Also 375 → 414 must return to `normal`, and 200 % must still give
  `wrap`. Repeat the cold-load CLS (production build, phones, including slow fonts: 0) and recapture 01/01b at
  375×667 in both themes.

### D2: at 200 % text, a 5-digit leaf total pushes "Level NN" past the screen edge at 375×667, so Today scrolls sideways and the tab bar is cut off

- **Exact defect.** `.statLevel` has a fixed width of 56 px, and its `white-space: nowrap` "Level NN" label is about
  76–89 px wide at 200 % text. So the label overflows its own pill by 20–33 px (9 px already at 150 %). The ladder
  measures only the pills' boxes, not their overflowing content. When the wrapped layout puts the level pill at the
  right end of a line, the label crosses the screen edge. Leaves and level share the second line once the leaves
  stat is wider than the space left beside the streak, which depends on the data.

  Measured on `c9520db` at 375×667 and 200 %:
  - 2,296 or 9,999 leaves are fine;
  - **10,000, 12,345, 45,678, 99,999 and 123,456 leaves** give a label right edge of 387, `scrollWidth` 388 (+13 px),
    and on mobile a layout viewport of 388×689. "Level 24" is cut to "Level 2" at the right edge, and the tab bar's
    Today / Stats / Nook / Settings labels are cut off at the bottom (tab bar 608–689 on a 667 px screen).

  At 390×844 and 200 %, 123,456 leaves gives +12 px. At 360×740 and 200 %, even the seed data gives +13 px.

  The data is realistic: 10,000 leaves is about level 22, roughly four months of daily use on the level curve.
  `1bec1a8` behaves identically, so this is a pre-existing gap in the approved F6 and was not introduced here. It sits
  in the same component and code path, it is exactly the data-dependent case this review was asked to stress, and the
  packet's claim "200 % text at 390 and 375 … no sideways scroll" holds only for 4-digit totals.
- **State.** Today with leaves ≥ 10,000 (any streak).
- **Viewport / theme.** 375×667 at DPR 2 with 200 % text, light and dark. Also 390×844 at 200 % with ≥ 6-digit
  leaves, and 360×740 at 200 % with any data.
- **Required correction.** Let the level column fit its label at large text, keeping the 100 % layout. For example,
  make `.statLevel` take its label's width with 56 px as a minimum, and have the bar fill that width. Alternatively,
  include each pill's overflowing content (`scrollWidth`) in the ladder's measurement. Do not change colours, order
  or the 100 % row: 375 must stay one `tight` row, and 390 one `normal` row.
- **Required retest.** At 375×667, 390×844 and 360×740, both themes, at 150 / 175 / 200 % text, with leaves 2,296 /
  9,999 / 10,000 / 12,345 / 123,456 / 470,000 (level ≥ 100): no element of the status bar past the screen edge,
  `scrollWidth === clientWidth`, `innerWidth` equal to the viewport, and the tab bar labels fully visible. At 100 %:
  one row at 375 (`tight`) and 390 (`normal`), with matching 01/01b recaptures in both themes. Also confirm the
  200 % screenshots at 375×667 (light and dark) with 12,345 leaves.

## Notes (not defects)

- On an unthrottled cold load the first decision can land before the stat fonts settle: I logged `tight` → `normal`
  at 390. Neither step changes the row height, and CLS is 0.0000.
- Pre-existing and outside this contract's viewport and text-size combinations: at ≤ 344 px with ≥ 150 % text, the
  tab bar ("Settings") overflows the screen on both `1bec1a8` and `c9520db`. At 720–899 px tablet portrait, the
  existing CSS wraps the stats natively (`flex-wrap: wrap`, two rows at 720 already at 100 %), so the ladder never
  engages there.
- The ladder's limit is the screen edge, not the bar's edge. So in `tight` mode the visible content can come within
  about 6 px of the screen edge in theory (worst measured: 12 px). This is polish only.
- The maker's "Today" evidence and audit are consistent with my runs for the seed data. Captures are correctly bound
  to `3bc0c66`, the same `src` tree as `c9520db`.
