# Kettle accessibility audit

- Base http://127.0.0.1:5242 · revision d3f4e06 · 2026-10-08T13:33:47.044Z
- Chromium (Playwright) + SwiftShader (CPU); axe-core tags wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa

## axe-core (main suite)

| Viewport | Theme | States | Violations (serious/critical) | Violations (moderate/minor) | Contrast nodes passed by axe | Undecided → measured |
|---|---|---:|---:|---:|---:|---:|
| 390x844 | light | 2 | 0 (+1 scroll-dependent) | 0 | 61 | 8 |
| 390x844 | dark | 2 | 0 (+1 scroll-dependent) | 0 | 62 | 7 |
| 375x667 | light | 2 | 0 (+1 scroll-dependent) | 0 | 60 | 9 |
| 375x667 | dark | 2 | 0 (+1 scroll-dependent) | 0 | 62 | 7 |

### Violations

"Scroll-dependent" = every node is only partly covered by sticky chrome at the captured scroll offset and passes target-size when scrolled to the middle of the screen (re-checked by axe on that node).

| Rule | Impact | Where | Targets | Summary | Scroll-dependent |
|---|---|---|---|---|---|
| target-size | serious | home 390x844 light | ._selected_chqjy_38 | Target has insufficient size because it is partially obscured (smallest space is 74.5px by 19.5px, should be at least 24px by 24px) | yes (passes scrolled clear) |
| target-size | serious | home 390x844 dark | ._selected_chqjy_38 | Target has insufficient size because it is partially obscured (smallest space is 74.5px by 19.5px, should be at least 24px by 24px) | yes (passes scrolled clear) |
| target-size | serious | home 375x667 light | ._selected_kjzqi_87; button[data-tone="sky"] | Target has insufficient size because it is partially obscured (smallest space is 110px by 1px, should be at least 24px by 24px) | yes (passes scrolled clear) |
| target-size | serious | home 375x667 dark | ._selected_kjzqi_87; button[data-tone="sky"] | Target has insufficient size because it is partially obscured (smallest space is 110px by 1px, should be at least 24px by 24px) | yes (passes scrolled clear) |

## Measured contrast (text axe could not decide)

| Where | Text | px/weight | Need | p5 | min | median | Result |
|---|---|---|---:|---:|---:|---:|---|
| home 390x844 light | 23 | 20/700 | 3 | 5.76 | 5.76 | 5.76 | pass |
| home 390x844 light | 2,296 | 20/700 | 3 | 5.98 | 5.98 | 5.98 | pass |
| home 390x844 light | leaves | 11/800 | 4.5 | 6.74 | 6.74 | 6.74 | pass |
| home 390x844 light | 12 | 14.8/700 | 4.5 | 4.55 | 4.55 | 4.55 | pass |
| home 390x844 light | Put the kettle on · 25 min | 21/700 | 3 | 3.29 | 3.25 | 3.38 | pass |
| home 390x844 light | Then a 5 min tea break. Change brew leng | 14/700 | 4.5 | 6.74 | 6.74 | 6.74 | pass |
| home 390x844 light | Change brew length | 14/800 | 4.5 | 6.04 | 6.04 | 6.04 | pass |
| home-custom 390x844 light | Use 25/5 min | 19/700 | 3 | 3.29 | 3.28 | 3.38 | pass |
| home 390x844 dark | 23 | 20/700 | 3 | 9.12 | 9.12 | 9.12 | pass |
| home 390x844 dark | 2,296 | 20/700 | 3 | 10.15 | 10.15 | 10.15 | pass |
| home 390x844 dark | 12 | 14.8/700 | 4.5 | 4.55 | 4.55 | 4.55 | pass |
| home 390x844 dark | Put the kettle on · 25 min | 21/700 | 3 | 3.29 | 3.25 | 3.38 | pass |
| home 390x844 dark | Then a 5 min tea break. Change brew leng | 14/700 | 4.5 | 10.21 | 10.21 | 10.21 | pass |
| home 390x844 dark | Change brew length | 14/800 | 4.5 | 10.07 | 10.07 | 10.07 | pass |
| home-custom 390x844 dark | Use 25/5 min | 19/700 | 3 | 3.29 | 3.28 | 3.38 | pass |

## Pointer targets (WCAG 2.5.8; product goal 44×44)

| Viewport | Theme | State | Targets | ≥44 | 24–44 | spacing/inline exception | <24 fail | Under 44 |
|---|---|---|---:|---:|---:|---:|---:|---|
| 390x844 | light | home | 20 | 19 | 1 | 0 | 0 | Change brew length 146×24 (ok24) |
| 390x844 | light | home-custom | 9 | 9 | 0 | 0 | 0 |  |
| 390x844 | dark | home | 20 | 19 | 1 | 0 | 0 | Change brew length 146×24 (ok24) |
| 390x844 | dark | home-custom | 9 | 9 | 0 | 0 | 0 |  |
| 375x667 | light | home | 19 | 18 | 1 | 0 | 0 | Change brew length 146×24 (ok24) |
| 375x667 | light | home-custom | 9 | 9 | 0 | 0 | 0 |  |
| 375x667 | dark | home | 19 | 18 | 1 | 0 | 0 | Change brew length 146×24 (ok24) |
| 375x667 | dark | home-custom | 9 | 9 | 0 | 0 | 0 |  |

## Reach, overflow, clipping — main

| Viewport | Theme | State | Controls | Covered (unreachable) | Horizontal scroll px | Clipped text |
|---|---|---|---:|---|---:|---|
| 390x844 | light | home | 19 | — | 0 | — |
| 390x844 | light | home-custom | 9 | — | 0 | — |
| 390x844 | dark | home | 19 | — | 0 | — |
| 390x844 | dark | home-custom | 9 | — | 0 | — |
| 375x667 | light | home | 19 | — | 0 | placeholder: e.g. Chapter 3 notes, or leave it blank 271/283 |
| 375x667 | light | home-custom | 9 | — | 0 | — |
| 375x667 | dark | home | 19 | — | 0 | placeholder: e.g. Chapter 3 notes, or leave it blank 271/283 |
| 375x667 | dark | home-custom | 9 | — | 0 | — |

## Reach, overflow, clipping — reflow

| Viewport | Theme | State | Controls | Covered (unreachable) | Horizontal scroll px | Clipped text |
|---|---|---|---:|---|---:|---|
| 320x568 | light | home | 19 | — | 0 | placeholder: e.g. Chapter 3 notes, or leave it blank 216/283 |
| 320x568 | light | home-custom | 9 | — | 0 | — |

## Reach, overflow, clipping — text200

| Viewport | Theme | State | Controls | Covered (unreachable) | Horizontal scroll px | Clipped text |
|---|---|---|---:|---|---:|---|
| 390x844 | light | home | 19 | — | 0 | placeholder: e.g. Chapter 3 notes, or leave it blank 286/573 |
| 390x844 | light | home-custom | 9 | — | 0 | — |
| 375x667 | light | home | 19 | — | 0 | placeholder: e.g. Chapter 3 notes, or leave it blank 271/573 |
| 375x667 | light | home-custom | 9 | — | 0 | — |
| 1440x900 | light | home | 19 | — | 0 | placeholder: e.g. Chapter 3 notes, or leave it blank 519/573 |
| 1440x900 | light | home-custom | 9 | — | 0 | — |

## Reach, overflow, clipping — keyboard

| Viewport | Theme | State | Controls | Covered (unreachable) | Horizontal scroll px | Clipped text |
|---|---|---|---:|---|---:|---|
| 390x508 (keyboard 336px) | light | home-typing | 23 | Skip to content (under off-screen) | 0 | — |
| 390x508 (keyboard 336px) | light | welcome-typing | 4 | — | 0 | — |
| 390x508 (keyboard 336px) | light | settings-name | 53 | — | 0 | — |
| 375x376 (keyboard 291px) | light | home-typing | 23 | Skip to content (under off-screen) | 0 | placeholder: e.g. Chapter 3 notes, or leave it blank 271/283 |
| 375x376 (keyboard 291px) | light | welcome-typing | 4 | — | 0 | — |
| 375x376 (keyboard 291px) | light | settings-name | 53 | — | 0 | — |

## Reduced motion keeps every fact (390×844 light; visible text in full vs reduced motion)

| State | Lines (full) | Lines (reduced) | Missing under reduced motion |
|---|---:|---:|---|
| home | 64 | 64 | — |
| home-custom | 64 | 64 | — |
