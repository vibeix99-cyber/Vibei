# I04 — Access and short-screen reachability · READY FOR REVIEW

- **Maker:** M2 · branch `pe/m2` · worktree `/home/user/wt/m2/kettle`
- **Revision:** the commit that adds this file (`I04 I05 I14 READY FOR REVIEW: …`, `git log -1 pe/m2`).
  **Diff base:** `6ddcdaa` (app code identical to `8f1044a`). Earlier partial commits of this maker on the branch:
  `ccb4ae4`, `651bc54`, `87393e7`, `f28d803` (WIP, not for review).
- **Proposed state:** **FIXED** (every measured failure below repaired and re-measured), with the human/assistive-tech
  items **BLOCKED** (end of file).

## Changed files (I04)

`src/app/Shell.module.css`, `src/styles/tokens.css`, `src/styles/global.css`, `src/ui/Button.module.css`,
`src/ui/Slider.module.css`, `src/ui/ListRow.module.css`, `src/ui/TextField.module.css`, `src/ui/SegmentedControl.tsx`,
`src/ui/Toast.tsx`, `src/screens/home/Composer.tsx`, `src/screens/home/Home.module.css`,
`src/screens/focus/FocusScreen.tsx`, `src/screens/focus/FocusScreen.module.css`, `src/screens/done/Summary.tsx`,
`src/screens/done/Summary.module.css`, `src/screens/stats/stats.module.css`, `src/screens/nook/NookScreen.module.css`.
New: `tests/a11y.spec.ts`, `tests/a11y-probes.mjs`, `review/product-excellence/tools/a11y-audit.mjs`, evidence under
`contracts/I04/`. No dependency, token value, art or copy change outside what is listed. Nothing in M1's files.

## Commands and results (on this revision)

```
npx tsc --noEmit --pretty false                                            → clean
npx vitest run                                                             → 24 files, 256 tests passed
# dev server for Playwright: npx vite --config .tmp/m2/vite.m2.config.ts --port 5222 (repo config + the real path of
# the symlinked node_modules on Vite's allow list so self-hosted fonts load; Playwright reuses it)
KETTLE_PORT=5222 KETTLE_PWA_PORT=5232 npx playwright test tests/a11y.spec.ts --project=chromium      → 9 passed
KETTLE_PORT=5222 KETTLE_PWA_PORT=5232 npx playwright test tests/whistle.spec.ts --project=chromium   → 8 passed
KETTLE_PORT=5222 KETTLE_PWA_PORT=5232 npx playwright test --project=timer-harness --project=timer-app --project=pwa
                                                                           → 29 passed, 2 skipped (existing suites)
npx vite build --outDir <scratch>/perf-after && npx vite preview --outDir <scratch>/perf-after --port 5242
node review/product-excellence/tools/a11y-audit.mjs --base http://127.0.0.1:5242 --out review/product-excellence/contracts/I04/audit-after
```

`tests/a11y.spec.ts` (regression gate, phone 390×844 touch): axe in every journey state + destination, both themes;
pointer targets; 375×667 short-screen reach; keyboard-only critical journey with focus trap/Esc/focus restoration;
welcome → first brew by keyboard; live regions silent while the countdown runs; toast never covers the session
controls or the summary footer (390×844 and 375×667). The full measured audit is the tool above:
`audit-before/` (on `6ddcdaa`) vs `audit-after/` (this revision), `audit.md` tables + `audit.json`.

AUDIT_SECTION

## Keyboard and screen-reader semantics (critical journey)

Keyboard log of every focus stop: `contracts/I04/keyboard-journey.json` (92 stops: Today 28, focus 12, summary 4,
Stats 27, Nook 21) — **every stop shows a visible focus change, none is hidden behind sticky chrome.**

| Step | Result |
|---|---|
| Welcome → first brew (keys only) | type the task, Enter → brew running (`welcome: first brew…` test) |
| Today: task → tag (arrows) → brew length (arrows; 25→50→25) → Start | works; label follows ("· 50 min") |
| Custom rhythm sheet (arrow onto Custom) | focus moves in, Tab stays inside (8 presses), **Esc closes, focus returns to Custom** |
| Pause / Resume / Add 5 | Enter on each; after Pause focus lands on Resume; +5 adds 5:00 |
| End sheet | opens with focus inside, Tab trapped (6), **Esc closes, focus back on End session**, brew still running |
| Ambience sheet | **Esc returns focus to the Ambience chip** |
| Whistle → summary: Done, details, Tea time | Done → `aria-pressed=true`; "How your leaves added up" → `aria-expanded=true`; Tea time → break |
| Break → Skip break → Today; Stats, Nook, Settings via tab bar | all reached by Tab + Enter |
| Live regions during a brew | 8 s of countdown: **nothing announced**; the countdown is one `role=timer` (implicit `aria-live=off`). `src/timer/announce.ts` (M1) announces start/pause/end only — reported, not edited |
| Icon buttons | names present (axe `button-name` passes in all 102 main states); e.g. "Add 5 minutes", "End session", "Skip break", "Ambience: Rain", "Mute" |

## Fixes: measured failure → fix → re-measurement

BEFORE/AFTER of the standard set (22 states × 390×844@2, 375×667@2, 1440×900@1 × light/dark, + 390×844 dark reduced
motion): BEFORE `/home/user/Vibei/kettle/review/product-excellence/baseline/<config>/`, AFTER
`review/product-excellence/contracts/I04/after/<config>/` (same tool, same ids; data: `seed=veteran` /
`fresh`, light theme `nooktime=day`). Targeted pairs for states the set does not show are in `contracts/I04/fixes/`
(`*-before.png` from `6ddcdaa` served side by side, `*-after.png` from this revision).

| # | Measured failure (before) | Fix | Re-measured (after) | Evidence |
|---|---|---|---|---|
| F1 | Phone whistle → summary **CLS 0.50 every run** (I14 baseline): the session panel itself jumped from the lower grid row to the whole screen | Panel box stays put; the summary box is absolutely positioned and reaches up over the stage (`FocusScreen.module.css`); desktop keeps its side card | CLS see I14 A/B; final summary pixel-identical at 390 (07/08) and desktop side-by-side unchanged (1440 07/08) | `after/*/07-summary.png`, `08-summary-end.png`; `perf/ab-m2/` |
| F2 | Disabled volume sliders (Settings, muted): values/labels **axe color-contrast serious in all 6 configs** (opacity 0.5) | Only track/thumb fade; label and value use `--ink-3` | axe 0; readable | `fixes/settings-muted-volumes-390x844-{light,dark}-{before,after}.png` |
| F3 | Mouse hover on persimmon buttons: white label **2.9:1** (`brightness(1.06)`) — e.g. "Use 25/5 min" at 1440 | Hover warms (`saturate(1.1)`) instead of lightening | 3.15:1 p5 (large text, ≥3) | audit tables |
| F4 | "How your leaves added up" toggle showed **no focus indicator** (`box-shadow: var(--focus-ring)` was invalid — the token is a colour) | `inset 0 0 0 3px var(--focus-ring)` | computed `rgb(36,119,184) 0 0 0 3px inset` light / `rgb(143,208,255)` dark | `fixes/summary-details-focus-390x844-*` |
| F5 | **Keyboard open** (375×376): the focused task field sat **under the tab bar** (hit-test → tab bar) | `scroll-margin-block` on the input itself (the browser scrolls the input, not its wrapper) | field at 135–187 of 376, hit-test → the input; welcome unchanged | `fixes/keyboard-open-*-{before,after}.png` |
| F6 | **200 % text**: Today scrolled sideways **110 px (390) / 124 px (375)**; tab bar labels widened the bar; "Kettle 0.1.0", "Reduced", "System" clipped in Settings rows; "Stack of books" cut in Nook; Stats 1 px | status bar wraps; tab bar `minmax(0,1fr)`; `--tabbar-h` grows with text; ListRow value wraps; SegmentedControl falls back to one option per row; Nook tile names 3 lines; Stats badge column `minmax(0,1fr)` | hscroll 0 and no clipped words (see text200 table) | `fixes/text200-home-390x844-light-{before,after}.png` |
| F7 | Task chip on the session screen **cut off**: "Chapter 3 notes · Wo…" at 375, tag lost at 320 (130/154 px) and at 200 % (137/310 px) | Chip text wraps up to 3 lines instead of ellipsis | full text shown; one line where it fits (390, 1440 unchanged) | `fixes/focus-task-chip-*-{before,after}.png`; `after/phone-375x667-*/02–06` |
| F8 | Tab from controls landed **behind the tab bar** (Stats history rows at 776–844 under a 68 px bar) and Shift+Tab under Stats' sticky title | `scroll-padding-bottom` (phones) and `scroll-padding-top` under the compact bar | keyboard log: 0 obscured stops | `keyboard-journey.json` |
| F9 | Docked start: the 10 px strip under it was painted over but **passed taps to hidden tag chips** (axe target-size at 375×667) | Dock box reaches the tab bar (gap is padding) | target-size: only the scroll-position-dependent case remains (passes scrolled clear) | audit tables |
| F10 | **Duration discoverability** (K01 audit): at 390×844 Brew length is half under the dock; at 375×667 below the fold — the editable length was not unmistakable | "Change brew length" link in the dock's note (phones only): scrolls the control clear of the dock and focuses the chosen length (instant under reduced motion). Kept: five wrapping categories, 15/25/50/Custom, docked start and its "· 25 min", no onboarding | after tap: length 190–288, dock 330 (375×667); 278–379 vs 421 (390×844); 141–239 vs 281 (320×568); focus on "25 min" | `after/*/01-home.png`; `fixes/change-brew-length-tapped-*` |
| F11 | **Toasts** (M1 request: storage-failure toast can last 12 s) covered Add 5 / Pause / End and Tea time / Skip on phones | Session control row(s), next-brew actions and the summary footer carry `data-toast-above`; the Toaster measures the highest marked element on screen and floats above it | toast clear of controls at 390×844 and 375×667, Pause still operable (spec) | `fixes/toast-{focus,summary}-{390x844,375x667}-{light,dark}-{before,after}.png` |
| F12 | **Nook at 1440×900**: the room pinned (sticky) though the page is one column; its "Drag to look around · tap things" hint stayed **below the screen** (889–920 of 900) and the level card slid over the room (contrast tool read 1.05:1 = the card) | No sticky room in the one-column layout (the side-panel grid never applies: `.root` is its own query container; see `docs/areas/scene.md` note) | hint at 435–466, fully visible; full-page captures unchanged | `fixes/nook-hint-1440x900-{light,dark}-{before,after}.png` |
| F13 | Placeholder cut mid-letter at 375/200 % | `text-overflow: ellipsis` on the field | ends in "…" | `after/phone-375x667-*/01b` |

Passed unchanged (measured, no change): reduced motion (OS and in-app) keeps every visible fact in all 17 states;
focus traps/Esc/restoration in all sheets; live regions; 44×44 on every primary control.

## References opened (Read tool) — transfer / do not copy

- K01 `VISUAL_BENCHMARK_LIBRARY/assets/current/01-home.png` + baseline `01b`: one clear Start, plain time facts.
  Transfer: the duration stays where it is; a plain link gets you there. Do not copy: no questionnaire, no extra
  dashboard; nothing inferred from the cropped view.
- K02 `…/07-summary.png`: minutes and Tea time outrank secondary facts; the final line clears the footer (verified
  in `after/*/08-summary-end.png`). Do not copy: no carousel, no claim step.
- K04 `…/whistle-to-summary-phone-dark-reduced-motion-frames.jpg`: continuity, still states keep 0:00 / "Tea's
  ready!" / minutes. Do not copy: a silent clip proves no audio or FPS.
- K03 `…/11b-summary-unlock-settled.png`: 3D close-up never blocks completion (after `11/11b` unchanged).
- Q02/Q03/Q06 via `REFERENCE-GUIDE.md`: WCAG 2.2 AA bars (1.4.3, 1.4.4, 1.4.10, 1.4.11, 2.4.7, 2.4.11, 2.5.8), C39,
  APG modal dialog. Selected checks ≠ full conformance.

## Preservation (PRESERVE_LIST)

Identity, tokens' colours, Chai, kettle states, room continuity and the countdown surface are untouched. Measured
per capture (`contracts/I04/PIXEL-DIFF.txt`: share of pixels that changed by more than 48/765 between BEFORE and AFTER):
Welcome, Stats, summaries 07/08, break 09/10 and Nook ≤ 0.6 %, i.e. unchanged apart from animation/rain timing;
focus 02–06 and unlock 11 differ by the live stage (rain, steam, 3D load timing) and, at 375, the task chip (F7);
Settings is 34 px taller (the two longer I05 descriptions); Today 01 shows the link (F10), 01b lands at a
different scroll offset (the new scroll padding) with the same content; **14-summary-first differs by data, not
code**: the baseline was captured at night (first brew earned +23 leaves and the Moonlit Sipper badge); captured
now, the *unmodified* `6ddcdaa` build gives exactly the AFTER picture (level 2 unlock) —
`before-same-time/phone-390x844-light/14-summary-first.png` (also 01, 01b). Five categories still wrap; 15/25/50/Custom kept;
docked start and "· 25 min" kept; the final expanded summary line clears the footer; Tea time/Skip footer kept; the
unlock drawing → close-up kept (11/11b). No new onboarding, gate or dependency.

## BLOCKED / UNKNOWN (never PASS)

- **BLOCKED:** human screen-reader sessions (VoiceOver iOS/macOS, TalkBack, NVDA) — the semantics above are
  verified by DOM/ARIA and axe only; real on-screen-keyboard behaviour on iOS/Android (emulated here by shrinking the
  viewport with the field focused); real-device text-size settings (emulated with root font-size 200 %); real phone
  touch accuracy. Manual steps: `docs/REAL_DEVICE_CHECKLIST.md`.
- **UNKNOWN:** contrast over the live 3D/stage is measured from SwiftShader pixels (CPU rendering); a GPU may render
  the window slightly differently.
