# Kettle accessibility audit

- Base http://127.0.0.1:5242 · revision 6ddcdaa · 2026-10-07T00:51:54.486Z
- Chromium (Playwright) + SwiftShader (CPU); axe-core tags wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa

## axe-core (main suite)

| Viewport | Theme | States | Violations (serious/critical) | Violations (moderate/minor) | Contrast nodes passed by axe | Undecided → measured |
|---|---|---:|---:|---:|---:|---:|
| 390x844 | light | 17 | 2 | 0 | 519 | 83 |
| 390x844 | dark | 17 | 2 | 0 | 520 | 82 |
| 375x667 | light | 17 | 2 | 0 | 517 | 83 |
| 375x667 | dark | 17 | 2 | 0 | 517 | 83 |
| 1440x900 | light | 17 | 2 | 0 | 615 | 76 |
| 1440x900 | dark | 17 | 1 | 0 | 606 | 75 |

### Violations

| Rule | Impact | Where | Targets |
|---|---|---|---|
| target-size | serious | home 390x844 light | ._selected_chqjy_38 |
| color-contrast | serious | settings 390x844 light | ._slider_bboaj_1._disabled_bboaj_119[data-tone="persimmon"] > ._head_bboaj_8 > ._value_bboaj_21[aria-hidden="true"]; ._slider_bboaj_1._disabled_bboaj_119[data-tone="honey"] > ._head_bboaj_8 > ._value_bboaj_21[aria-hidden="true"]; ._slider_bboaj_1._disabled_bboaj_119[data-tone="sky"] > ._head_bboaj_8 > ._value_bboaj_21[aria-hidden="true"] |
| target-size | serious | home 390x844 dark | ._selected_chqjy_38 |
| color-contrast | serious | settings 390x844 dark | ._slider_bboaj_1._disabled_bboaj_119[data-tone="persimmon"] > ._head_bboaj_8 > ._value_bboaj_21[aria-hidden="true"]; ._slider_bboaj_1._disabled_bboaj_119[data-tone="honey"] > ._head_bboaj_8 > ._value_bboaj_21[aria-hidden="true"]; ._slider_bboaj_1._disabled_bboaj_119[data-tone="sky"] > ._head_bboaj_8 > ._value_bboaj_21[aria-hidden="true"] |
| target-size | serious | home 375x667 light | ._selected_kjzqi_87; button[data-tone="sky"] |
| color-contrast | serious | settings 375x667 light | ._slider_bboaj_1._disabled_bboaj_119[data-tone="persimmon"] > ._head_bboaj_8 > ._value_bboaj_21[aria-hidden="true"]; ._slider_bboaj_1._disabled_bboaj_119[data-tone="honey"] > ._head_bboaj_8 > ._value_bboaj_21[aria-hidden="true"]; ._slider_bboaj_1._disabled_bboaj_119[data-tone="sky"] > ._head_bboaj_8 > ._value_bboaj_21[aria-hidden="true"] |
| target-size | serious | home 375x667 dark | ._selected_kjzqi_87; button[data-tone="sky"] |
| color-contrast | serious | settings 375x667 dark | ._slider_bboaj_1._disabled_bboaj_119[data-tone="persimmon"] > ._head_bboaj_8 > ._value_bboaj_21[aria-hidden="true"]; ._slider_bboaj_1._disabled_bboaj_119[data-tone="honey"] > ._head_bboaj_8 > ._value_bboaj_21[aria-hidden="true"]; ._slider_bboaj_1._disabled_bboaj_119[data-tone="sky"] > ._head_bboaj_8 > ._value_bboaj_21[aria-hidden="true"] |
| color-contrast | serious | paused 1440x900 light | ._flag_kjsz3_161 |
| color-contrast | serious | settings 1440x900 light | ._slider_bboaj_1._disabled_bboaj_119[data-tone="persimmon"] > ._head_bboaj_8 > ._value_bboaj_21[aria-hidden="true"]; ._slider_bboaj_1._disabled_bboaj_119[data-tone="honey"] > ._head_bboaj_8 > ._value_bboaj_21[aria-hidden="true"]; ._slider_bboaj_1._disabled_bboaj_119[data-tone="sky"] > ._head_bboaj_8 > ._value_bboaj_21[aria-hidden="true"] |
| color-contrast | serious | settings 1440x900 dark | ._slider_bboaj_1._disabled_bboaj_119[data-tone="persimmon"] > ._head_bboaj_8 > ._value_bboaj_21[aria-hidden="true"]; ._slider_bboaj_1._disabled_bboaj_119[data-tone="honey"] > ._head_bboaj_8 > ._value_bboaj_21[aria-hidden="true"]; ._slider_bboaj_1._disabled_bboaj_119[data-tone="sky"] > ._head_bboaj_8 > ._value_bboaj_21[aria-hidden="true"] |

## Measured contrast (text axe could not decide)

| Where | Text | px/weight | Need | p5 | min | median | Result |
|---|---|---|---:|---:|---:|---:|---|
| home 390x844 light | 23 | 20/700 | 3 | 5.76 | 5.76 | 5.76 | pass |
| home 390x844 light | 2,361 | 20/700 | 3 | 5.98 | 5.98 | 5.98 | pass |
| home 390x844 light | 12 | 14.8/700 | 4.5 | 4.55 | 4.55 | 4.55 | pass |
| home 390x844 light | Put the kettle on · 25 min | 21/700 | 3 | 3.29 | 3.25 | 3.38 | pass |
| home 390x844 light | Then a 5 min tea break. | 14/700 | 4.5 | 6.74 | 6.74 | 6.74 | pass |
| home 390x844 light | 1/1 | 13/800 | 4.5 | 6.95 | 6.95 | 6.95 | pass |
| home-custom 390x844 light | Use 25/5 min | 19/700 | 3 | 3.29 | 3.28 | 3.38 | pass |
| focus 390x844 light | Chapter 3 notes · Work | 15/600 | 4.5 | 12.8 | 12.72 | 12.89 | pass |
| focus 390x844 light | · Work | 15/600 | 4.5 | 3.6 | 3.5 | 4.58 | **FAIL** |
| end-sheet 390x844 light | That’s okay — your minutes still count. | 16/600 | 4.5 | 6.95 | 6.95 | 6.95 | pass |
| end-sheet 390x844 light | Keep brewing | 21/700 | 3 | 3.3 | 3.25 | 3.38 | pass |
| ambience-sheet 390x844 light | Tap to listen. The window in your nook f | 16/600 | 4.5 | 6.95 | 6.95 | 6.95 | pass |
| ambience-sheet 390x844 light | Brown noise | 16/600 | 4.5 | 13.45 | 13.45 | 13.45 | pass |
| ambience-sheet 390x844 light | Done | 21/700 | 3 | 3.3 | 3.28 | 3.38 | pass |
| paused 390x844 light | Chapter 3 notes · Work | 15/600 | 4.5 | 12.8 | 12.72 | 12.89 | pass |
| paused 390x844 light | · Work | 15/600 | 4.5 | 6.66 | 6.66 | 6.66 | pass |
| added 390x844 light | Chapter 3 notes · Work | 15/600 | 4.5 | 12.8 | 12.72 | 12.89 | pass |
| added 390x844 light | · Work | 15/600 | 4.5 | 6.66 | 6.66 | 6.66 | pass |
| whistle 390x844 light | Chapter 3 notes · Work | 15/600 | 4.5 | 7.16 | 6.77 | 8.65 | pass |
| summary 390x844 light | 23 | 7/600 | 4.5 | 2.88 | 2.88 | 2.88 | below, incidental (art, aria-hidden, repeats adjacent text) |
| summary 390x844 light | 12 | 8.7/700 | 4.5 | 4.55 | 4.55 | 4.55 | pass |
| summary 390x844 light | Tea time · 5 min | 21/700 | 3 | 3.21 | 3.17 | 3.33 | pass |
| summary-details 390x844 light | 23 | 7/600 | 4.5 | 2.88 | 2.88 | 2.88 | below, incidental (art, aria-hidden, repeats adjacent text) |
| summary-details 390x844 light | 12 | 8.7/700 | 4.5 | 4.55 | 4.55 | 4.55 | pass |
| summary-details 390x844 light | Tea time · 5 min | 21/700 | 3 | 3.21 | 3.17 | 3.33 | pass |
| break 390x844 light | Tea break · 5 min | 15/600 | 4.5 | 12.8 | 12.71 | 12.9 | pass |
| break 390x844 light | · 5 min | 15/600 | 4.5 | 6.62 | 6.57 | 6.66 | pass |
| break-over 390x844 light | Put the kettle on | 21/700 | 3 | 3.3 | 3.25 | 3.38 | pass |
| welcome 390x844 light | Kettle | 23.5/600 | 4.5 | 12.82 | 12.82 | 12.83 | pass |
| welcome 390x844 light | What’s the first thing? (optional) | 16/800 | 4.5 | 12.61 | 12.6 | 12.7 | pass |
| welcome 390x844 light | Start a 15-min brew | 21/700 | 3 | 3.3 | 3.25 | 3.38 | pass |
| welcome 390x844 light | Set things up first | 21/700 | 3 | 6.74 | 6.74 | 6.74 | pass |
| welcome 390x844 light | I have a backup | 15/700 | 4.5 | 6.74 | 6.74 | 6.74 | pass |
| stats-empty 390x844 light | Put the kettle on | 21/700 | 3 | 3.3 | 3.25 | 3.38 | pass |
| stats-empty 390x844 light | 1 | 32.2/700 | 3 | 4.55 | 4.55 | 4.55 | pass |
| stats 390x844 light | 12 | 27.8/700 | 3 | 4.55 | 4.55 | 4.55 | pass |
| stats 390x844 light | 0 | 13/800 | 4.5 | 5.65 | 5.65 | 5.65 | pass |
| stats 390x844 light | 30 | 13/800 | 4.5 | 5.65 | 5.65 | 5.65 | pass |
| stats 390x844 light | 90 | 13/800 | 4.5 | 5.65 | 5.65 | 5.65 | pass |
| stats 390x844 light | T | 13.9/800 | 4.5 | 6.95 | 6.95 | 6.95 | pass |
| stats 390x844 light | 1 | 13/700 | 4.5 | 5.65 | 5.65 | 5.65 | pass |
| stats 390x844 light | F | 13.9/800 | 4.5 | 6.95 | 6.95 | 6.95 | pass |
| stats 390x844 light | 2 | 13/700 | 4.5 | 5.65 | 5.65 | 5.65 | pass |
| stats 390x844 light | S | 13.9/800 | 4.5 | 6.95 | 6.95 | 6.95 | pass |
| stats 390x844 light | 3 | 13/700 | 4.5 | 5.65 | 5.65 | 5.65 | pass |
| stats 390x844 light | 75 | 13.9/900 | 4.5 | 13.45 | 13.45 | 13.45 | pass |
| stats 390x844 light | S | 13.9/800 | 4.5 | 6.95 | 6.95 | 6.95 | pass |
| stats 390x844 light | 4 | 13/700 | 4.5 | 5.65 | 5.65 | 5.65 | pass |
| stats 390x844 light | M | 13.9/800 | 4.5 | 6.95 | 6.95 | 6.95 | pass |
| stats 390x844 light | 5 | 13/700 | 4.5 | 5.65 | 5.65 | 5.65 | pass |
| stats 390x844 light | T | 13.9/800 | 4.5 | 6.95 | 6.95 | 6.95 | pass |
| stats 390x844 light | 6 | 13/700 | 4.5 | 5.65 | 5.65 | 5.65 | pass |
| stats 390x844 light | 50 | 13.9/900 | 4.5 | 13.45 | 13.45 | 13.45 | pass |
| stats 390x844 light | W | 13.9/900 | 4.5 | 5.94 | 5.94 | 5.94 | pass |
| stats 390x844 light | 7 | 13/900 | 4.5 | 5.94 | 5.94 | 5.94 | pass |
| stats 390x844 light | 60 | 13/900 | 4.5 | 6.16 | 6.16 | 6.16 | pass |
| stats 390x844 light | 1 | 14/900 | 4.5 | 4.52 | 4.52 | 4.52 | pass |
| stats 390x844 light | 2 | 14/900 | 4.5 | 4.52 | 4.52 | 4.52 | pass |
| stats 390x844 light | 3 | 14/900 | 4.5 | 4.52 | 4.52 | 4.52 | pass |
| stats 390x844 light | 4 | 14/900 | 4.5 | 4.52 | 4.52 | 4.52 | pass |
| stats 390x844 light | 5 | 14/900 | 4.5 | 4.52 | 4.52 | 4.52 | pass |
| stats 390x844 light | 6 | 14/900 | 4.5 | 4.52 | 4.52 | 4.52 | pass |
| stats 390x844 light | 7 | 14/900 | 4.5 | 4.52 | 4.52 | 4.52 | pass |
| stats 390x844 light | III | 13/900 | 4.5 | 8.33 | 8.33 | 8.33 | pass |
| stats 390x844 light | IV | 13/900 | 4.5 | 10.1 | 10.1 | 10.1 | pass |
| stats 390x844 light | II | 13/900 | 4.5 | 8.48 | 8.48 | 8.48 | pass |
| stats 390x844 light | 14 | 14.8/700 | 4.5 | 3.67 | 3.67 | 3.67 | below, incidental (art, aria-hidden, repeats adjacent text) |
| stats 390x844 light | III | 13/900 | 4.5 | 8.33 | 8.33 | 8.33 | pass |
| stats 390x844 light | III | 13/900 | 4.5 | 8.33 | 8.33 | 8.33 | pass |
| stats 390x844 light | I | 13/900 | 4.5 | 9.53 | 9.53 | 9.53 | pass |
| nook 390x844 light | Drag to look around · tap things | 13/800 | 4.5 | 6.91 | 6.89 | 6.99 | pass |
| nook 390x844 light | 12 | 22.6/700 | 3 | 4.55 | 4.55 | 4.55 | pass |
| settings 390x844 light | Settings | 30/600 | 3 | 13.04 | 13.04 | 13.04 | pass |
| settings 390x844 light | Tea break | 16/800 | 4.5 | 13.45 | 13.45 | 13.45 | pass |
| settings 390x844 light | 5 | 28/600 | 3 | 13.45 | 13.45 | 13.45 | pass |
| settings 390x844 light | min | 14/800 | 4.5 | 6.95 | 6.95 | 6.95 | pass |
| settings 390x844 light | Long tea break | 16/800 | 4.5 | 13.45 | 13.45 | 13.45 | pass |
| settings 390x844 light | 1 | 28/600 | 3 | 13.45 | 13.45 | 13.45 | pass |
| settings 390x844 light | 5 | 28/600 | 3 | 13.45 | 13.45 | 13.45 | pass |
| settings 390x844 light | min | 14/800 | 4.5 | 6.95 | 6.95 | 6.95 | pass |
| settings 390x844 light | 4 | 28/600 | 3 | 13.45 | 13.45 | 13.45 | pass |
| settings 390x844 light | brews | 14/800 | 4.5 | 6.95 | 6.95 | 6.95 | pass |
| home 390x844 dark | 23 | 20/700 | 3 | 9.12 | 9.12 | 9.12 | pass |
| home 390x844 dark | 2,361 | 20/700 | 3 | 10.15 | 10.15 | 10.15 | pass |
| home 390x844 dark | 12 | 14.8/700 | 4.5 | 4.55 | 4.55 | 4.55 | pass |
| home 390x844 dark | Put the kettle on · 25 min | 21/700 | 3 | 3.29 | 3.25 | 3.38 | pass |
| home 390x844 dark | Then a 5 min tea break. | 14/700 | 4.5 | 10.21 | 10.21 | 10.21 | pass |
| home-custom 390x844 dark | Use 25/5 min | 19/700 | 3 | 3.29 | 3.28 | 3.38 | pass |
| focus 390x844 dark | Chapter 3 notes · Work | 15/600 | 4.5 | 12.28 | 12.12 | 12.96 | pass |
| focus 390x844 dark | · Work | 15/600 | 4.5 | 8.98 | 8.83 | 8.99 | pass |
| end-sheet 390x844 dark | That’s okay — your minutes still count. | 16/600 | 4.5 | 9.1 | 9.1 | 9.1 | pass |
| end-sheet 390x844 dark | Keep brewing | 21/700 | 3 | 3.3 | 3.25 | 3.38 | pass |
| ambience-sheet 390x844 dark | Tap to listen. The window in your nook f | 16/600 | 4.5 | 9.1 | 9.1 | 9.1 | pass |
| ambience-sheet 390x844 dark | Brown noise | 16/600 | 4.5 | 13.14 | 13.14 | 13.14 | pass |
| ambience-sheet 390x844 dark | Done | 21/700 | 3 | 3.3 | 3.28 | 3.38 | pass |
| paused 390x844 dark | Chapter 3 notes · Work | 15/600 | 4.5 | 12.28 | 12.12 | 12.96 | pass |
| paused 390x844 dark | · Work | 15/600 | 4.5 | 8.98 | 8.83 | 8.99 | pass |
| added 390x844 dark | Chapter 3 notes · Work | 15/600 | 4.5 | 12.28 | 12.12 | 12.96 | pass |
| added 390x844 dark | · Work | 15/600 | 4.5 | 8.98 | 8.83 | 8.99 | pass |
| whistle 390x844 dark | Chapter 3 notes · Work | 15/600 | 4.5 | 4.36 | 2.32 | 8.54 | **FAIL** |
| summary 390x844 dark | 23 | 7/600 | 4.5 | 2.88 | 2.88 | 2.88 | below, incidental (art, aria-hidden, repeats adjacent text) |
| summary 390x844 dark | 12 | 8.7/700 | 4.5 | 4.55 | 4.55 | 4.55 | pass |
| summary 390x844 dark | Tea time · 5 min | 21/700 | 3 | 3.21 | 3.17 | 3.33 | pass |
| summary-details 390x844 dark | 23 | 7/600 | 4.5 | 2.88 | 2.88 | 2.88 | below, incidental (art, aria-hidden, repeats adjacent text) |
| summary-details 390x844 dark | 12 | 8.7/700 | 4.5 | 4.55 | 4.55 | 4.55 | pass |
| summary-details 390x844 dark | Tea time · 5 min | 21/700 | 3 | 3.21 | 3.17 | 3.33 | pass |
| break 390x844 dark | Tea break · 5 min | 15/600 | 4.5 | 12.28 | 12.11 | 12.6 | pass |
| break 390x844 dark | · 5 min | 15/600 | 4.5 | 8.72 | 8.72 | 8.75 | pass |
| break-over 390x844 dark | Put the kettle on | 21/700 | 3 | 3.3 | 3.25 | 3.38 | pass |
| welcome 390x844 dark | Kettle | 23.5/600 | 4.5 | 13.8 | 13.69 | 13.86 | pass |
| welcome 390x844 dark | What’s the first thing? (optional) | 16/800 | 4.5 | 12.83 | 12.72 | 13.05 | pass |
| welcome 390x844 dark | Start a 15-min brew | 21/700 | 3 | 3.3 | 3.25 | 3.38 | pass |
| welcome 390x844 dark | Set things up first | 21/700 | 3 | 10.21 | 10.21 | 10.21 | pass |
| welcome 390x844 dark | I have a backup | 15/700 | 4.5 | 10.21 | 10.21 | 10.21 | pass |
| stats-empty 390x844 dark | Put the kettle on | 21/700 | 3 | 3.3 | 3.25 | 3.38 | pass |
| stats-empty 390x844 dark | 1 | 32.2/700 | 3 | 4.55 | 4.55 | 4.55 | pass |
| stats 390x844 dark | 12 | 27.8/700 | 3 | 4.55 | 4.55 | 4.55 | pass |
| stats 390x844 dark | 0 | 13/800 | 4.5 | 6.35 | 6.35 | 6.35 | pass |
| stats 390x844 dark | 30 | 13/800 | 4.5 | 6.35 | 6.35 | 6.35 | pass |
| stats 390x844 dark | 90 | 13/800 | 4.5 | 6.35 | 6.35 | 6.35 | pass |
| stats 390x844 dark | T | 13.9/800 | 4.5 | 9.1 | 9.1 | 9.1 | pass |
| stats 390x844 dark | 1 | 13/700 | 4.5 | 6.35 | 6.35 | 6.35 | pass |
| stats 390x844 dark | F | 13.9/800 | 4.5 | 9.1 | 9.1 | 9.1 | pass |
| stats 390x844 dark | 2 | 13/700 | 4.5 | 6.35 | 6.35 | 6.35 | pass |
| stats 390x844 dark | S | 13.9/800 | 4.5 | 9.1 | 9.1 | 9.1 | pass |
| stats 390x844 dark | 3 | 13/700 | 4.5 | 6.35 | 6.35 | 6.35 | pass |
| stats 390x844 dark | 75 | 13.9/900 | 4.5 | 13.14 | 13.14 | 13.14 | pass |
| stats 390x844 dark | S | 13.9/800 | 4.5 | 9.1 | 9.1 | 9.1 | pass |
| stats 390x844 dark | 4 | 13/700 | 4.5 | 6.35 | 6.35 | 6.35 | pass |
| stats 390x844 dark | M | 13.9/800 | 4.5 | 9.1 | 9.1 | 9.1 | pass |
| stats 390x844 dark | 5 | 13/700 | 4.5 | 6.35 | 6.35 | 6.35 | pass |
| stats 390x844 dark | T | 13.9/800 | 4.5 | 9.1 | 9.1 | 9.1 | pass |
| stats 390x844 dark | 6 | 13/700 | 4.5 | 6.35 | 6.35 | 6.35 | pass |
| stats 390x844 dark | 50 | 13.9/900 | 4.5 | 13.14 | 13.14 | 13.14 | pass |
| stats 390x844 dark | W | 13.9/900 | 4.5 | 8.12 | 8.12 | 8.12 | pass |
| stats 390x844 dark | 7 | 13/900 | 4.5 | 8.12 | 8.12 | 8.12 | pass |
| stats 390x844 dark | 60 | 13/900 | 4.5 | 9.04 | 9.04 | 9.04 | pass |
| stats 390x844 dark | 1 | 14/900 | 4.5 | 4.52 | 4.52 | 4.52 | pass |
| stats 390x844 dark | 2 | 14/900 | 4.5 | 4.52 | 4.52 | 4.52 | pass |
| stats 390x844 dark | 3 | 14/900 | 4.5 | 4.52 | 4.52 | 4.52 | pass |
| stats 390x844 dark | 4 | 14/900 | 4.5 | 4.52 | 4.52 | 4.52 | pass |
| stats 390x844 dark | 5 | 14/900 | 4.5 | 4.52 | 4.52 | 4.52 | pass |
| stats 390x844 dark | 6 | 14/900 | 4.5 | 4.52 | 4.52 | 4.52 | pass |
| stats 390x844 dark | 7 | 14/900 | 4.5 | 4.52 | 4.52 | 4.52 | pass |
| stats 390x844 dark | III | 13/900 | 4.5 | 8.33 | 8.33 | 8.33 | pass |
| stats 390x844 dark | IV | 13/900 | 4.5 | 10.1 | 10.1 | 10.1 | pass |
| stats 390x844 dark | II | 13/900 | 4.5 | 8.48 | 8.48 | 8.48 | pass |
| stats 390x844 dark | 14 | 14.8/700 | 4.5 | 3.67 | 3.67 | 3.67 | below, incidental (art, aria-hidden, repeats adjacent text) |
| stats 390x844 dark | III | 13/900 | 4.5 | 8.33 | 8.33 | 8.33 | pass |
| stats 390x844 dark | III | 13/900 | 4.5 | 8.33 | 8.33 | 8.33 | pass |
| stats 390x844 dark | I | 13/900 | 4.5 | 9.53 | 9.53 | 9.53 | pass |
| nook 390x844 dark | Drag to look around · tap things | 13/800 | 4.5 | 15.14 | 15.14 | 15.16 | pass |
| nook 390x844 dark | 12 | 22.6/700 | 3 | 4.55 | 4.55 | 4.55 | pass |
| settings 390x844 dark | Settings | 30/600 | 3 | 14.75 | 14.75 | 14.75 | pass |
| settings 390x844 dark | Tea break | 16/800 | 4.5 | 13.14 | 13.14 | 13.14 | pass |
| settings 390x844 dark | 5 | 28/600 | 3 | 13.14 | 13.14 | 13.14 | pass |
| settings 390x844 dark | min | 14/800 | 4.5 | 9.1 | 9.1 | 9.1 | pass |
| settings 390x844 dark | Long tea break | 16/800 | 4.5 | 13.14 | 13.14 | 13.14 | pass |
| settings 390x844 dark | 1 | 28/600 | 3 | 13.14 | 13.14 | 13.14 | pass |
| settings 390x844 dark | 5 | 28/600 | 3 | 13.14 | 13.14 | 13.14 | pass |
| settings 390x844 dark | min | 14/800 | 4.5 | 9.1 | 9.1 | 9.1 | pass |
| settings 390x844 dark | 4 | 28/600 | 3 | 13.14 | 13.14 | 13.14 | pass |
| settings 390x844 dark | brews | 14/800 | 4.5 | 9.1 | 9.1 | 9.1 | pass |
| home 1440x900 light | Kettle | 27/600 | 3 | 13.04 | 13.04 | 13.04 | pass |
| home 1440x900 light | 12 | 14.8/700 | 4.5 | 4.55 | 4.55 | 4.55 | pass |
| home 1440x900 light | Put the kettle on · 25 min | 21/700 | 3 | 3.3 | 3.28 | 3.38 | pass |
| home 1440x900 light | Then a 5 min tea break. | 14/700 | 4.5 | 6.74 | 6.74 | 6.74 | pass |
| home-custom 1440x900 light | Use 25/5 min | 19/700 | 3 | 2.9 | 2.88 | 2.97 | **FAIL** |
| end-sheet 1440x900 light | Keep brewing | 21/700 | 3 | 3.34 | 3.28 | 3.4 | pass |
| ambience-sheet 1440x900 light | Done | 21/700 | 3 | 3.3 | 3.28 | 3.4 | pass |
| summary 1440x900 light | 23 | 7/600 | 4.5 | 2.88 | 2.88 | 2.88 | below, incidental (art, aria-hidden, repeats adjacent text) |
| summary 1440x900 light | 12 | 8.7/700 | 4.5 | 4.55 | 4.55 | 4.55 | pass |
| summary 1440x900 light | Tea time · 5 min | 21/700 | 3 | 3.21 | 3.17 | 3.33 | pass |
| summary-details 1440x900 light | 23 | 7/600 | 4.5 | 2.88 | 2.88 | 2.88 | below, incidental (art, aria-hidden, repeats adjacent text) |
| summary-details 1440x900 light | 12 | 8.7/700 | 4.5 | 4.55 | 4.55 | 4.55 | pass |
| summary-details 1440x900 light | Tea time · 5 min | 21/700 | 3 | 3.21 | 3.17 | 3.33 | pass |
| break-over 1440x900 light | Put the kettle on | 21/700 | 3 | 3.3 | 3.25 | 3.38 | pass |
| welcome 1440x900 light | Kettle | 29.6/600 | 3 | 12.81 | 12.73 | 12.82 | pass |
| welcome 1440x900 light | What’s the first thing? (optional) | 16/800 | 4.5 | 12.62 | 12.61 | 12.7 | pass |
| welcome 1440x900 light | Start a 15-min brew | 21/700 | 3 | 3.3 | 3.25 | 3.38 | pass |
| welcome 1440x900 light | Set things up first | 21/700 | 3 | 6.74 | 6.74 | 6.74 | pass |
| welcome 1440x900 light | I have a backup | 15/700 | 4.5 | 6.74 | 6.74 | 6.74 | pass |
| stats-empty 1440x900 light | Kettle | 27/600 | 3 | 13.04 | 13.04 | 13.04 | pass |
| stats-empty 1440x900 light | Put the kettle on | 21/700 | 3 | 3.3 | 3.28 | 3.38 | pass |
| stats-empty 1440x900 light | 1 | 32.2/700 | 3 | 4.55 | 4.55 | 4.55 | pass |
| stats 1440x900 light | Kettle | 27/600 | 3 | 13.04 | 13.04 | 13.04 | pass |
| stats 1440x900 light | 12 | 27.8/700 | 3 | 4.55 | 4.55 | 4.55 | pass |
| stats 1440x900 light | 0 | 13/800 | 4.5 | 5.65 | 5.65 | 5.65 | pass |
| stats 1440x900 light | 30 | 13/800 | 4.5 | 5.65 | 5.65 | 5.65 | pass |
| stats 1440x900 light | 90 | 13/800 | 4.5 | 5.65 | 5.65 | 5.65 | pass |
| stats 1440x900 light | Thu | 13.9/800 | 4.5 | 6.95 | 6.95 | 6.95 | pass |
| stats 1440x900 light | 1 | 13/700 | 4.5 | 5.65 | 5.65 | 5.65 | pass |
| stats 1440x900 light | Fri | 13.9/800 | 4.5 | 6.95 | 6.95 | 6.95 | pass |
| stats 1440x900 light | 2 | 13/700 | 4.5 | 5.65 | 5.65 | 5.65 | pass |
| stats 1440x900 light | Sat | 13.9/800 | 4.5 | 6.95 | 6.95 | 6.95 | pass |
| stats 1440x900 light | 3 | 13/700 | 4.5 | 5.65 | 5.65 | 5.65 | pass |
| stats 1440x900 light | 75 | 13.9/900 | 4.5 | 13.45 | 13.45 | 13.45 | pass |
| stats 1440x900 light | Sun | 13.9/800 | 4.5 | 6.95 | 6.95 | 6.95 | pass |
| stats 1440x900 light | 4 | 13/700 | 4.5 | 5.65 | 5.65 | 5.65 | pass |
| stats 1440x900 light | Mon | 13.9/800 | 4.5 | 6.95 | 6.95 | 6.95 | pass |
| stats 1440x900 light | 5 | 13/700 | 4.5 | 5.65 | 5.65 | 5.65 | pass |
| stats 1440x900 light | Tue | 13.9/800 | 4.5 | 6.95 | 6.95 | 6.95 | pass |
| stats 1440x900 light | 6 | 13/700 | 4.5 | 5.65 | 5.65 | 5.65 | pass |
| stats 1440x900 light | 50 | 13.9/900 | 4.5 | 13.45 | 13.45 | 13.45 | pass |
| stats 1440x900 light | Today | 13.9/900 | 4.5 | 5.94 | 5.94 | 5.94 | pass |
| stats 1440x900 light | 7 | 13/900 | 4.5 | 5.94 | 5.94 | 5.94 | pass |
| stats 1440x900 light | 60 | 13/900 | 4.5 | 6.16 | 6.16 | 6.16 | pass |
| stats 1440x900 light | 1 | 14/900 | 4.5 | 4.52 | 4.52 | 4.52 | pass |
| stats 1440x900 light | 2 | 14/900 | 4.5 | 4.52 | 4.52 | 4.52 | pass |
| stats 1440x900 light | 3 | 14/900 | 4.5 | 4.52 | 4.52 | 4.52 | pass |
| stats 1440x900 light | 4 | 14/900 | 4.5 | 4.52 | 4.52 | 4.52 | pass |
| stats 1440x900 light | 5 | 14/900 | 4.5 | 4.52 | 4.52 | 4.52 | pass |
| stats 1440x900 light | 6 | 14/900 | 4.5 | 4.52 | 4.52 | 4.52 | pass |
| stats 1440x900 light | 7 | 14/900 | 4.5 | 4.52 | 4.52 | 4.52 | pass |
| stats 1440x900 light | III | 13/900 | 4.5 | 8.33 | 8.33 | 8.33 | pass |
| stats 1440x900 light | IV | 13/900 | 4.5 | 10.1 | 10.1 | 10.1 | pass |
| stats 1440x900 light | II | 13/900 | 4.5 | 8.48 | 8.48 | 8.48 | pass |
| stats 1440x900 light | 14 | 14.8/700 | 4.5 | 3.67 | 3.67 | 3.67 | below, incidental (art, aria-hidden, repeats adjacent text) |
| stats 1440x900 light | III | 13/900 | 4.5 | 8.33 | 8.33 | 8.33 | pass |
| stats 1440x900 light | III | 13/900 | 4.5 | 8.33 | 8.33 | 8.33 | pass |
| stats 1440x900 light | I | 13/900 | 4.5 | 9.53 | 9.53 | 9.53 | pass |
| stats 1440x900 light | 12a | 13/800 | 4.5 | 5.65 | 5.65 | 5.65 | pass |
| stats 1440x900 light | 6a | 13/800 | 4.5 | 5.65 | 5.65 | 5.65 | pass |
| stats 1440x900 light | 12p | 13/800 | 4.5 | 5.65 | 5.65 | 5.65 | pass |
| stats 1440x900 light | 6p | 13/800 | 4.5 | 5.65 | 5.65 | 5.65 | pass |
| nook 1440x900 light | Kettle | 27/600 | 3 | 13.04 | 13.04 | 13.04 | pass |
| nook 1440x900 light | Drag to look around · tap things | 13/800 | 4.5 | 1.05 | 1.04 | 1.05 | **FAIL** |
| nook 1440x900 light | 12 | 22.6/700 | 3 | 4.55 | 4.55 | 4.55 | pass |
| settings 1440x900 light | Kettle | 27/600 | 3 | 13.04 | 13.04 | 13.04 | pass |
| settings 1440x900 light | Settings | 36/600 | 3 | 13.04 | 13.04 | 13.04 | pass |
| settings 1440x900 light | 5 | 28/600 | 3 | 13.45 | 13.45 | 13.45 | pass |
| settings 1440x900 light | min | 14/800 | 4.5 | 6.95 | 6.95 | 6.95 | pass |
| settings 1440x900 light | 1 | 28/600 | 3 | 13.45 | 13.45 | 13.45 | pass |
| settings 1440x900 light | 5 | 28/600 | 3 | 13.45 | 13.45 | 13.45 | pass |
| settings 1440x900 light | min | 14/800 | 4.5 | 6.95 | 6.95 | 6.95 | pass |
| settings 1440x900 light | 4 | 28/600 | 3 | 13.45 | 13.45 | 13.45 | pass |
| settings 1440x900 light | brews | 14/800 | 4.5 | 6.95 | 6.95 | 6.95 | pass |
| settings 1440x900 light | 83% | 17/600 | 4.5 | 13.45 | 13.45 | 13.45 | pass |
| settings 1440x900 light | 12 | 19.1/700 | 3 | 4.55 | 4.55 | 4.55 | pass |
| home 1440x900 dark | Kettle | 27/600 | 3 | 14.75 | 14.75 | 14.75 | pass |
| home 1440x900 dark | 12 | 14.8/700 | 4.5 | 4.55 | 4.55 | 4.55 | pass |
| home 1440x900 dark | Put the kettle on · 25 min | 21/700 | 3 | 3.3 | 3.28 | 3.38 | pass |
| home 1440x900 dark | Then a 5 min tea break. | 14/700 | 4.5 | 10.21 | 10.21 | 10.21 | pass |
| home-custom 1440x900 dark | Use 25/5 min | 19/700 | 3 | 2.9 | 2.88 | 2.97 | **FAIL** |
| end-sheet 1440x900 dark | Keep brewing | 21/700 | 3 | 3.34 | 3.28 | 3.4 | pass |
| summary 1440x900 dark | 23 | 7/600 | 4.5 | 2.88 | 2.88 | 2.88 | below, incidental (art, aria-hidden, repeats adjacent text) |
| summary 1440x900 dark | 12 | 8.7/700 | 4.5 | 4.55 | 4.55 | 4.55 | pass |
| summary 1440x900 dark | Tea time · 5 min | 21/700 | 3 | 3.21 | 3.17 | 3.33 | pass |
| summary-details 1440x900 dark | 23 | 7/600 | 4.5 | 2.88 | 2.88 | 2.88 | below, incidental (art, aria-hidden, repeats adjacent text) |
| summary-details 1440x900 dark | 12 | 8.7/700 | 4.5 | 4.55 | 4.55 | 4.55 | pass |
| summary-details 1440x900 dark | Tea time · 5 min | 21/700 | 3 | 3.21 | 3.17 | 3.33 | pass |
| break-over 1440x900 dark | Put the kettle on | 21/700 | 3 | 3.3 | 3.25 | 3.38 | pass |
| welcome 1440x900 dark | Kettle | 29.6/600 | 3 | 13.55 | 13.51 | 13.66 | pass |
| welcome 1440x900 dark | What’s the first thing? (optional) | 16/800 | 4.5 | 12.99 | 12.88 | 13.05 | pass |
| welcome 1440x900 dark | Start a 15-min brew | 21/700 | 3 | 3.3 | 3.25 | 3.38 | pass |
| welcome 1440x900 dark | Set things up first | 21/700 | 3 | 10.21 | 10.21 | 10.21 | pass |
| welcome 1440x900 dark | I have a backup | 15/700 | 4.5 | 10.21 | 10.21 | 10.21 | pass |
| stats-empty 1440x900 dark | Kettle | 27/600 | 3 | 14.75 | 14.75 | 14.75 | pass |
| stats-empty 1440x900 dark | Put the kettle on | 21/700 | 3 | 3.3 | 3.28 | 3.38 | pass |
| stats-empty 1440x900 dark | 1 | 32.2/700 | 3 | 4.55 | 4.55 | 4.55 | pass |
| stats 1440x900 dark | Kettle | 27/600 | 3 | 14.75 | 14.75 | 14.75 | pass |
| stats 1440x900 dark | 12 | 27.8/700 | 3 | 4.55 | 4.55 | 4.55 | pass |
| stats 1440x900 dark | 0 | 13/800 | 4.5 | 6.35 | 6.35 | 6.35 | pass |
| stats 1440x900 dark | 30 | 13/800 | 4.5 | 6.35 | 6.35 | 6.35 | pass |
| stats 1440x900 dark | 90 | 13/800 | 4.5 | 6.35 | 6.35 | 6.35 | pass |
| stats 1440x900 dark | Thu | 13.9/800 | 4.5 | 9.1 | 9.1 | 9.1 | pass |
| stats 1440x900 dark | 1 | 13/700 | 4.5 | 6.35 | 6.35 | 6.35 | pass |
| stats 1440x900 dark | Fri | 13.9/800 | 4.5 | 9.1 | 9.1 | 9.1 | pass |
| stats 1440x900 dark | 2 | 13/700 | 4.5 | 6.35 | 6.35 | 6.35 | pass |
| stats 1440x900 dark | Sat | 13.9/800 | 4.5 | 9.1 | 9.1 | 9.1 | pass |
| stats 1440x900 dark | 3 | 13/700 | 4.5 | 6.35 | 6.35 | 6.35 | pass |
| stats 1440x900 dark | 75 | 13.9/900 | 4.5 | 13.14 | 13.14 | 13.14 | pass |
| stats 1440x900 dark | Sun | 13.9/800 | 4.5 | 9.1 | 9.1 | 9.1 | pass |
| stats 1440x900 dark | 4 | 13/700 | 4.5 | 6.35 | 6.35 | 6.35 | pass |
| stats 1440x900 dark | Mon | 13.9/800 | 4.5 | 9.1 | 9.1 | 9.1 | pass |
| stats 1440x900 dark | 5 | 13/700 | 4.5 | 6.35 | 6.35 | 6.35 | pass |
| stats 1440x900 dark | Tue | 13.9/800 | 4.5 | 9.1 | 9.1 | 9.1 | pass |
| stats 1440x900 dark | 6 | 13/700 | 4.5 | 6.35 | 6.35 | 6.35 | pass |
| stats 1440x900 dark | 50 | 13.9/900 | 4.5 | 13.14 | 13.14 | 13.14 | pass |
| stats 1440x900 dark | Today | 13.9/900 | 4.5 | 8.12 | 8.12 | 8.12 | pass |
| stats 1440x900 dark | 7 | 13/900 | 4.5 | 8.12 | 8.12 | 8.12 | pass |
| stats 1440x900 dark | 60 | 13/900 | 4.5 | 9.04 | 9.04 | 9.04 | pass |
| stats 1440x900 dark | 1 | 14/900 | 4.5 | 4.52 | 4.52 | 4.52 | pass |
| stats 1440x900 dark | 2 | 14/900 | 4.5 | 4.52 | 4.52 | 4.52 | pass |
| stats 1440x900 dark | 3 | 14/900 | 4.5 | 4.52 | 4.52 | 4.52 | pass |
| stats 1440x900 dark | 4 | 14/900 | 4.5 | 4.52 | 4.52 | 4.52 | pass |
| stats 1440x900 dark | 5 | 14/900 | 4.5 | 4.52 | 4.52 | 4.52 | pass |
| stats 1440x900 dark | 6 | 14/900 | 4.5 | 4.52 | 4.52 | 4.52 | pass |
| stats 1440x900 dark | 7 | 14/900 | 4.5 | 4.52 | 4.52 | 4.52 | pass |
| stats 1440x900 dark | III | 13/900 | 4.5 | 8.33 | 8.33 | 8.33 | pass |
| stats 1440x900 dark | IV | 13/900 | 4.5 | 10.1 | 10.1 | 10.1 | pass |
| stats 1440x900 dark | II | 13/900 | 4.5 | 8.48 | 8.48 | 8.48 | pass |
| stats 1440x900 dark | 14 | 14.8/700 | 4.5 | 3.67 | 3.67 | 3.67 | below, incidental (art, aria-hidden, repeats adjacent text) |
| stats 1440x900 dark | III | 13/900 | 4.5 | 8.33 | 8.33 | 8.33 | pass |
| stats 1440x900 dark | III | 13/900 | 4.5 | 8.33 | 8.33 | 8.33 | pass |
| stats 1440x900 dark | I | 13/900 | 4.5 | 9.53 | 9.53 | 9.53 | pass |
| stats 1440x900 dark | 12a | 13/800 | 4.5 | 6.35 | 6.35 | 6.35 | pass |
| stats 1440x900 dark | 6a | 13/800 | 4.5 | 6.35 | 6.35 | 6.35 | pass |
| stats 1440x900 dark | 12p | 13/800 | 4.5 | 6.35 | 6.35 | 6.35 | pass |
| stats 1440x900 dark | 6p | 13/800 | 4.5 | 6.35 | 6.35 | 6.35 | pass |
| nook 1440x900 dark | Kettle | 27/600 | 3 | 14.75 | 14.75 | 14.75 | pass |
| nook 1440x900 dark | Drag to look around · tap things | 13/800 | 4.5 | 2.34 | 1.04 | 16.3 | **FAIL** |
| nook 1440x900 dark | 12 | 22.6/700 | 3 | 4.55 | 4.55 | 4.55 | pass |
| settings 1440x900 dark | Kettle | 27/600 | 3 | 14.75 | 14.75 | 14.75 | pass |
| settings 1440x900 dark | Settings | 36/600 | 3 | 14.75 | 14.75 | 14.75 | pass |
| settings 1440x900 dark | 5 | 28/600 | 3 | 13.14 | 13.14 | 13.14 | pass |
| settings 1440x900 dark | min | 14/800 | 4.5 | 9.1 | 9.1 | 9.1 | pass |
| settings 1440x900 dark | 1 | 28/600 | 3 | 13.14 | 13.14 | 13.14 | pass |
| settings 1440x900 dark | 5 | 28/600 | 3 | 13.14 | 13.14 | 13.14 | pass |
| settings 1440x900 dark | min | 14/800 | 4.5 | 9.1 | 9.1 | 9.1 | pass |
| settings 1440x900 dark | 4 | 28/600 | 3 | 13.14 | 13.14 | 13.14 | pass |
| settings 1440x900 dark | brews | 14/800 | 4.5 | 9.1 | 9.1 | 9.1 | pass |
| settings 1440x900 dark | 83% | 17/600 | 4.5 | 13.14 | 13.14 | 13.14 | pass |
| settings 1440x900 dark | 12 | 19.1/700 | 3 | 4.55 | 4.55 | 4.55 | pass |

## Pointer targets (WCAG 2.5.8; product goal 44×44)

| Viewport | Theme | State | Targets | ≥44 | 24–44 | spacing/inline exception | <24 fail | Under 44 |
|---|---|---|---:|---:|---:|---:|---:|---|
| 390x844 | light | home | 19 | 19 | 0 | 0 | 0 |  |
| 390x844 | light | home-custom | 9 | 9 | 0 | 0 | 0 |  |
| 390x844 | light | focus | 3 | 3 | 0 | 0 | 0 |  |
| 390x844 | light | end-sheet | 3 | 3 | 0 | 0 | 0 |  |
| 390x844 | light | ambience-sheet | 10 | 10 | 0 | 0 | 0 |  |
| 390x844 | light | paused | 5 | 5 | 0 | 0 | 0 |  |
| 390x844 | light | added | 5 | 5 | 0 | 0 | 0 |  |
| 390x844 | light | whistle | 5 | 5 | 0 | 0 | 0 |  |
| 390x844 | light | summary | 5 | 5 | 0 | 0 | 0 |  |
| 390x844 | light | summary-details | 5 | 5 | 0 | 0 | 0 |  |
| 390x844 | light | break | 5 | 5 | 0 | 0 | 0 |  |
| 390x844 | light | break-over | 4 | 4 | 0 | 0 | 0 |  |
| 390x844 | light | welcome | 4 | 4 | 0 | 0 | 0 |  |
| 390x844 | light | stats-empty | 13 | 13 | 0 | 0 | 0 |  |
| 390x844 | light | stats | 27 | 26 | 1 | 0 | 0 | Wednesday, October 7 (today): 50 min, 2 full bre 40.6×192 (ok24) |
| 390x844 | light | nook | 21 | 21 | 0 | 0 | 0 |  |
| 390x844 | light | settings | 50 | 50 | 0 | 0 | 0 |  |
| 390x844 | dark | home | 19 | 19 | 0 | 0 | 0 |  |
| 390x844 | dark | home-custom | 9 | 9 | 0 | 0 | 0 |  |
| 390x844 | dark | focus | 5 | 5 | 0 | 0 | 0 |  |
| 390x844 | dark | end-sheet | 3 | 3 | 0 | 0 | 0 |  |
| 390x844 | dark | ambience-sheet | 10 | 10 | 0 | 0 | 0 |  |
| 390x844 | dark | paused | 5 | 5 | 0 | 0 | 0 |  |
| 390x844 | dark | added | 5 | 5 | 0 | 0 | 0 |  |
| 390x844 | dark | whistle | 5 | 5 | 0 | 0 | 0 |  |
| 390x844 | dark | summary | 5 | 5 | 0 | 0 | 0 |  |
| 390x844 | dark | summary-details | 5 | 5 | 0 | 0 | 0 |  |
| 390x844 | dark | break | 5 | 5 | 0 | 0 | 0 |  |
| 390x844 | dark | break-over | 4 | 4 | 0 | 0 | 0 |  |
| 390x844 | dark | welcome | 4 | 4 | 0 | 0 | 0 |  |
| 390x844 | dark | stats-empty | 13 | 13 | 0 | 0 | 0 |  |
| 390x844 | dark | stats | 27 | 26 | 1 | 0 | 0 | Wednesday, October 7 (today): 50 min, 2 full bre 40.6×192 (ok24) |
| 390x844 | dark | nook | 21 | 21 | 0 | 0 | 0 |  |
| 390x844 | dark | settings | 50 | 50 | 0 | 0 | 0 |  |
| 375x667 | light | home | 18 | 18 | 0 | 0 | 0 |  |
| 375x667 | light | home-custom | 9 | 9 | 0 | 0 | 0 |  |
| 375x667 | light | focus | 5 | 5 | 0 | 0 | 0 |  |
| 375x667 | light | end-sheet | 3 | 3 | 0 | 0 | 0 |  |
| 375x667 | light | ambience-sheet | 10 | 10 | 0 | 0 | 0 |  |
| 375x667 | light | paused | 5 | 5 | 0 | 0 | 0 |  |
| 375x667 | light | added | 5 | 5 | 0 | 0 | 0 |  |
| 375x667 | light | whistle | 2 | 2 | 0 | 0 | 0 |  |
| 375x667 | light | summary | 5 | 5 | 0 | 0 | 0 |  |
| 375x667 | light | summary-details | 5 | 5 | 0 | 0 | 0 |  |
| 375x667 | light | break | 5 | 5 | 0 | 0 | 0 |  |
| 375x667 | light | break-over | 4 | 4 | 0 | 0 | 0 |  |
| 375x667 | light | welcome | 4 | 4 | 0 | 0 | 0 |  |
| 375x667 | light | stats-empty | 12 | 12 | 0 | 0 | 0 |  |
| 375x667 | light | stats | 26 | 25 | 1 | 0 | 0 | Wednesday, October 7 (today): 50 min, 2 full bre 38.4×192 (ok24) |
| 375x667 | light | nook | 20 | 20 | 0 | 0 | 0 |  |
| 375x667 | light | settings | 49 | 49 | 0 | 0 | 0 |  |
| 375x667 | dark | home | 18 | 18 | 0 | 0 | 0 |  |
| 375x667 | dark | home-custom | 9 | 9 | 0 | 0 | 0 |  |
| 375x667 | dark | focus | 5 | 5 | 0 | 0 | 0 |  |
| 375x667 | dark | end-sheet | 3 | 3 | 0 | 0 | 0 |  |
| 375x667 | dark | ambience-sheet | 10 | 10 | 0 | 0 | 0 |  |
| 375x667 | dark | paused | 5 | 5 | 0 | 0 | 0 |  |
| 375x667 | dark | added | 5 | 5 | 0 | 0 | 0 |  |
| 375x667 | dark | whistle | 2 | 2 | 0 | 0 | 0 |  |
| 375x667 | dark | summary | 5 | 5 | 0 | 0 | 0 |  |
| 375x667 | dark | summary-details | 5 | 5 | 0 | 0 | 0 |  |
| 375x667 | dark | break | 5 | 5 | 0 | 0 | 0 |  |
| 375x667 | dark | break-over | 4 | 4 | 0 | 0 | 0 |  |
| 375x667 | dark | welcome | 4 | 4 | 0 | 0 | 0 |  |
| 375x667 | dark | stats-empty | 12 | 12 | 0 | 0 | 0 |  |
| 375x667 | dark | stats | 26 | 25 | 1 | 0 | 0 | Wednesday, October 7 (today): 50 min, 2 full bre 38.4×192 (ok24) |
| 375x667 | dark | nook | 20 | 20 | 0 | 0 | 0 |  |
| 375x667 | dark | settings | 49 | 49 | 0 | 0 | 0 |  |
| 1440x900 | light | home | 19 | 19 | 0 | 0 | 0 |  |
| 1440x900 | light | home-custom | 9 | 9 | 0 | 0 | 0 |  |
| 1440x900 | light | focus | 5 | 5 | 0 | 0 | 0 |  |
| 1440x900 | light | end-sheet | 3 | 3 | 0 | 0 | 0 |  |
| 1440x900 | light | ambience-sheet | 10 | 10 | 0 | 0 | 0 |  |
| 1440x900 | light | paused | 5 | 5 | 0 | 0 | 0 |  |
| 1440x900 | light | added | 5 | 5 | 0 | 0 | 0 |  |
| 1440x900 | light | whistle | 2 | 2 | 0 | 0 | 0 |  |
| 1440x900 | light | summary | 5 | 5 | 0 | 0 | 0 |  |
| 1440x900 | light | summary-details | 5 | 5 | 0 | 0 | 0 |  |
| 1440x900 | light | break | 6 | 6 | 0 | 0 | 0 |  |
| 1440x900 | light | break-over | 4 | 4 | 0 | 0 | 0 |  |
| 1440x900 | light | welcome | 4 | 4 | 0 | 0 | 0 |  |
| 1440x900 | light | stats-empty | 14 | 14 | 0 | 0 | 0 |  |
| 1440x900 | light | stats | 31 | 30 | 0 | 1 | 0 | 8 am to 9 am: 3h 26m focused (your sweet spot) 17.4×142 (inline) |
| 1440x900 | light | nook | 22 | 22 | 0 | 0 | 0 |  |
| 1440x900 | light | settings | 51 | 51 | 0 | 0 | 0 |  |
| 1440x900 | dark | home | 19 | 19 | 0 | 0 | 0 |  |
| 1440x900 | dark | home-custom | 9 | 9 | 0 | 0 | 0 |  |
| 1440x900 | dark | focus | 5 | 5 | 0 | 0 | 0 |  |
| 1440x900 | dark | end-sheet | 3 | 3 | 0 | 0 | 0 |  |
| 1440x900 | dark | ambience-sheet | 10 | 10 | 0 | 0 | 0 |  |
| 1440x900 | dark | paused | 5 | 5 | 0 | 0 | 0 |  |
| 1440x900 | dark | added | 5 | 5 | 0 | 0 | 0 |  |
| 1440x900 | dark | whistle | 0 | 0 | 0 | 0 | 0 |  |
| 1440x900 | dark | summary | 5 | 5 | 0 | 0 | 0 |  |
| 1440x900 | dark | summary-details | 5 | 5 | 0 | 0 | 0 |  |
| 1440x900 | dark | break | 6 | 6 | 0 | 0 | 0 |  |
| 1440x900 | dark | break-over | 4 | 4 | 0 | 0 | 0 |  |
| 1440x900 | dark | welcome | 4 | 4 | 0 | 0 | 0 |  |
| 1440x900 | dark | stats-empty | 14 | 14 | 0 | 0 | 0 |  |
| 1440x900 | dark | stats | 31 | 30 | 0 | 1 | 0 | 8 am to 9 am: 3h 26m focused (your sweet spot) 17.4×142 (inline) |
| 1440x900 | dark | nook | 22 | 22 | 0 | 0 | 0 |  |
| 1440x900 | dark | settings | 51 | 51 | 0 | 0 | 0 |  |

## Reach, overflow, clipping — main

| Viewport | Theme | State | Controls | Covered (unreachable) | Horizontal scroll px | Clipped text |
|---|---|---|---:|---|---:|---|
| 390x844 | light | home | 18 | — | 0 | — |
| 390x844 | light | home-custom | 9 | — | 0 | — |
| 390x844 | light | focus | 3 | — | 0 | — |
| 390x844 | light | end-sheet | 3 | — | 0 | — |
| 390x844 | light | ambience-sheet | 10 | — | 0 | — |
| 390x844 | light | paused | 5 | — | 0 | — |
| 390x844 | light | added | 5 | — | 0 | — |
| 390x844 | light | whistle | 5 | — | 0 | — |
| 390x844 | light | summary | 5 | — | 0 | — |
| 390x844 | light | summary-details | 5 | — | 0 | — |
| 390x844 | light | break | 5 | — | 0 | — |
| 390x844 | light | break-over | 4 | — | 0 | — |
| 390x844 | light | welcome | 4 | — | 0 | — |
| 390x844 | light | stats-empty | 12 | — | 0 | — |
| 390x844 | light | stats | 28 | — | 0 | — |
| 390x844 | light | nook | 20 | — | 0 | — |
| 390x844 | light | settings | 53 | — | 0 | — |
| 390x844 | dark | home | 18 | — | 0 | — |
| 390x844 | dark | home-custom | 9 | — | 0 | — |
| 390x844 | dark | focus | 5 | — | 0 | — |
| 390x844 | dark | end-sheet | 3 | — | 0 | — |
| 390x844 | dark | ambience-sheet | 10 | — | 0 | — |
| 390x844 | dark | paused | 5 | — | 0 | — |
| 390x844 | dark | added | 5 | — | 0 | — |
| 390x844 | dark | whistle | 5 | — | 0 | — |
| 390x844 | dark | summary | 5 | — | 0 | — |
| 390x844 | dark | summary-details | 5 | — | 0 | — |
| 390x844 | dark | break | 5 | — | 0 | — |
| 390x844 | dark | break-over | 4 | — | 0 | — |
| 390x844 | dark | welcome | 4 | — | 0 | — |
| 390x844 | dark | stats-empty | 12 | — | 0 | — |
| 390x844 | dark | stats | 28 | — | 0 | — |
| 390x844 | dark | nook | 20 | — | 0 | — |
| 390x844 | dark | settings | 53 | — | 0 | — |
| 375x667 | light | home | 18 | — | 0 | placeholder: e.g. Chapter 3 notes, or leave it blank 271/283 |
| 375x667 | light | home-custom | 9 | — | 0 | — |
| 375x667 | light | focus | 5 | — | 0 | — |
| 375x667 | light | end-sheet | 3 | — | 0 | — |
| 375x667 | light | ambience-sheet | 10 | — | 0 | — |
| 375x667 | light | paused | 5 | — | 0 | — |
| 375x667 | light | added | 5 | — | 0 | — |
| 375x667 | light | whistle | 2 | — | 0 | — |
| 375x667 | light | summary | 5 | — | 0 | — |
| 375x667 | light | summary-details | 3 | — | 0 | — |
| 375x667 | light | break | 5 | — | 0 | — |
| 375x667 | light | break-over | 4 | — | 0 | — |
| 375x667 | light | welcome | 4 | — | 0 | — |
| 375x667 | light | stats-empty | 12 | — | 0 | — |
| 375x667 | light | stats | 28 | — | 0 | — |
| 375x667 | light | nook | 20 | — | 0 | — |
| 375x667 | light | settings | 53 | — | 0 | — |
| 375x667 | dark | home | 18 | — | 0 | placeholder: e.g. Chapter 3 notes, or leave it blank 271/283 |
| 375x667 | dark | home-custom | 9 | — | 0 | — |
| 375x667 | dark | focus | 5 | — | 0 | — |
| 375x667 | dark | end-sheet | 3 | — | 0 | — |
| 375x667 | dark | ambience-sheet | 10 | — | 0 | — |
| 375x667 | dark | paused | 5 | — | 0 | — |
| 375x667 | dark | added | 5 | — | 0 | — |
| 375x667 | dark | whistle | 2 | — | 0 | — |
| 375x667 | dark | summary | 5 | — | 0 | — |
| 375x667 | dark | summary-details | 3 | — | 0 | — |
| 375x667 | dark | break | 5 | — | 0 | — |
| 375x667 | dark | break-over | 4 | — | 0 | — |
| 375x667 | dark | welcome | 4 | — | 0 | — |
| 375x667 | dark | stats-empty | 12 | — | 0 | — |
| 375x667 | dark | stats | 28 | — | 0 | — |
| 375x667 | dark | nook | 20 | — | 0 | — |
| 375x667 | dark | settings | 53 | — | 0 | — |
| 1440x900 | light | home | 19 | — | -15 | — |
| 1440x900 | light | home-custom | 9 | — | -15 | — |
| 1440x900 | light | focus | 5 | — | 0 | — |
| 1440x900 | light | end-sheet | 3 | — | 0 | — |
| 1440x900 | light | ambience-sheet | 10 | — | 0 | — |
| 1440x900 | light | paused | 5 | — | 0 | — |
| 1440x900 | light | added | 5 | — | 0 | — |
| 1440x900 | light | whistle | 2 | — | 0 | — |
| 1440x900 | light | summary | 5 | — | 0 | — |
| 1440x900 | light | summary-details | 5 | — | 0 | — |
| 1440x900 | light | break | 6 | — | 0 | — |
| 1440x900 | light | break-over | 4 | — | 0 | — |
| 1440x900 | light | welcome | 4 | — | -15 | — |
| 1440x900 | light | stats-empty | 13 | — | -15 | — |
| 1440x900 | light | stats | 32 | — | -15 | — |
| 1440x900 | light | nook | 21 | — | -15 | — |
| 1440x900 | light | settings | 54 | — | -15 | — |
| 1440x900 | dark | home | 19 | — | -15 | — |
| 1440x900 | dark | home-custom | 9 | — | -15 | — |
| 1440x900 | dark | focus | 5 | — | 0 | — |
| 1440x900 | dark | end-sheet | 3 | — | 0 | — |
| 1440x900 | dark | ambience-sheet | 10 | — | 0 | — |
| 1440x900 | dark | paused | 5 | — | 0 | — |
| 1440x900 | dark | added | 5 | — | 0 | — |
| 1440x900 | dark | whistle | 0 | — | 0 | — |
| 1440x900 | dark | summary | 5 | — | 0 | — |
| 1440x900 | dark | summary-details | 5 | — | 0 | — |
| 1440x900 | dark | break | 6 | — | 0 | — |
| 1440x900 | dark | break-over | 4 | — | 0 | — |
| 1440x900 | dark | welcome | 4 | — | -15 | — |
| 1440x900 | dark | stats-empty | 13 | — | -15 | — |
| 1440x900 | dark | stats | 32 | — | -15 | — |
| 1440x900 | dark | nook | 21 | — | -15 | — |
| 1440x900 | dark | settings | 54 | — | -15 | — |

## Reach, overflow, clipping — reflow

| Viewport | Theme | State | Controls | Covered (unreachable) | Horizontal scroll px | Clipped text |
|---|---|---|---:|---|---:|---|
| 320x568 | light | home | 18 | — | 0 | placeholder: e.g. Chapter 3 notes, or leave it blank 216/283 |
| 320x568 | light | home-custom | 9 | — | 0 | — |
| 320x568 | light | focus | 5 | — | 0 | Chapter 3 notes · Work 130/154 |
| 320x568 | light | end-sheet | 3 | — | 0 | — |
| 320x568 | light | ambience-sheet | 10 | — | 0 | — |
| 320x568 | light | paused | 5 | — | 0 | Chapter 3 notes · Work 130/154 |
| 320x568 | light | added | 5 | — | 0 | Chapter 3 notes · Work 130/154 |
| 320x568 | light | whistle | 2 | — | 0 | Chapter 3 notes · Work 130/154 |
| 320x568 | light | summary | 5 | — | 0 | — |
| 320x568 | light | summary-details | 3 | — | 0 | — |
| 320x568 | light | break | 5 | — | 0 | — |
| 320x568 | light | break-over | 4 | — | 0 | — |
| 320x568 | light | welcome | 4 | — | 0 | — |
| 320x568 | light | stats-empty | 12 | — | 0 | — |
| 320x568 | light | stats | 28 | — | 0 | — |
| 320x568 | light | nook | 20 | — | 0 | — |
| 320x568 | light | settings | 53 | — | 0 | — |

## Reach, overflow, clipping — text200

| Viewport | Theme | State | Controls | Covered (unreachable) | Horizontal scroll px | Clipped text |
|---|---|---|---:|---|---:|---|
| 390x844 | light | home | 18 | — | 110 | placeholder: e.g. Chapter 3 notes, or leave it blank 286/573 |
| 390x844 | light | welcome | 4 | — | 0 | — |
| 390x844 | light | stats-empty | 12 | — | 0 | — |
| 390x844 | light | stats | 28 | — | 0 | — |
| 390x844 | light | nook | 20 | — | 0 | Stack of books 83/83 |
| 390x844 | light | settings | 53 | — | 0 | Reduced 94/105; Kettle 0.1.0 145/170 |
| 375x667 | light | home | 18 | — | 124 | placeholder: e.g. Chapter 3 notes, or leave it blank 271/573 |
| 375x667 | light | welcome | 4 | — | 0 | — |
| 375x667 | light | stats-empty | 12 | — | 0 | — |
| 375x667 | light | stats | 28 | — | 1 | — |
| 375x667 | light | nook | 20 | — | 0 | Stack of books 81/81 |
| 375x667 | light | settings | 53 | — | 0 | System 89/92; Reduced 89/105; Kettle 0.1.0 138/170 |
| 1440x900 | light | home | 19 | — | -15 | placeholder: e.g. Chapter 3 notes, or leave it blank 519/573 |
| 1440x900 | light | home-custom | 9 | — | -15 | — |
| 1440x900 | light | focus | 3 | — | 0 | — |
| 1440x900 | light | end-sheet | 3 | — | 0 | — |
| 1440x900 | light | ambience-sheet | 0 | — | 0 | — |
| 1440x900 | light | paused | 5 | — | 0 | Chapter 3 notes · Work 203/310 |
| 1440x900 | light | added | 5 | — | 0 | Chapter 3 notes · Work 203/310 |
| 1440x900 | light | whistle | 2 | — | 0 | Chapter 3 notes · Work 203/310 |
| 1440x900 | light | summary | 5 | — | 0 | — |
| 1440x900 | light | summary-details | 5 | — | 0 | — |
| 1440x900 | light | break | 6 | — | 0 | Tea break · 5 min 201/222 |
| 1440x900 | light | break-over | 4 | — | 0 | — |
| 1440x900 | light | welcome | 4 | — | -15 | — |
| 1440x900 | light | stats-empty | 13 | — | -15 | — |
| 1440x900 | light | stats | 32 | — | -15 | 30 days 87/96; All time 87/100 |
| 1440x900 | light | nook | 21 | — | -15 | — |
| 1440x900 | light | settings | 54 | — | -15 | — |

## Reach, overflow, clipping — keyboard

| Viewport | Theme | State | Controls | Covered (unreachable) | Horizontal scroll px | Clipped text |
|---|---|---|---:|---|---:|---|
| 390x508 (keyboard 336px) | light | home-typing | 21 | — | 0 | — |
| 390x508 (keyboard 336px) | light | welcome-typing (focused field hidden!) | 4 | — | 0 | — |
| 390x508 (keyboard 336px) | light | settings-name | 53 | — | 0 | — |
| 375x376 (keyboard 291px) | light | home-typing (focused field hidden!) | 21 | — | 0 | placeholder: e.g. Chapter 3 notes, or leave it blank 271/283 |
| 375x376 (keyboard 291px) | light | welcome-typing (focused field hidden!) | 4 | — | 0 | — |
| 375x376 (keyboard 291px) | light | settings-name | 53 | — | 0 | — |

## Reduced motion keeps every fact (390×844 light; visible text in full vs reduced motion)

| State | Lines (full) | Lines (reduced) | Missing under reduced motion |
|---|---:|---:|---|
| home | 64 | 64 | — |
| home-custom | 64 | 64 | — |
| focus | 14 | 14 | — |
| end-sheet | 14 | 14 | — |
| ambience-sheet | 14 | 14 | — |
| paused | 16 | 16 | — |
| added | 16 | 16 | — |
| whistle | 12 | 12 | — |
| summary | 19 | 19 | — |
| summary-details | 32 | 32 | — |
| break | 13 | 13 | — |
| break-over | 6 | 6 | — |
| welcome | 7 | 7 | — |
| stats-empty | 48 | 48 | — |
| stats | 220 | 220 | — |
| nook | 30 | 30 | — |
| settings | 125 | 125 | — |

## Errors

- text200 390x844 journey: locator.click: Timeout 30000ms exceeded.
- text200 375x667 journey: locator.click: Timeout 30000ms exceeded.
