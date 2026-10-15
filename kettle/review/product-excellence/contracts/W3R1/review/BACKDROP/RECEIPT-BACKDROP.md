# Receipt BD: the 390 dark first-brew backdrop difference (Sonnet 5.5, investigator BD, report only)

Status: stage 1 (setup and first noise samples). The sections below are filled in stages and committed after each.

## 1. Method

- Capture: the unchanged `review/product-excellence/tools/capture.mjs`, `--only 13` (state `13`: first visit, `Start a 15-min brew`, wait 3 s, screenshot), 390x844@2 dark, the frozen start clock `2026-10-12T07:40:00Z` and the screenshot waits of Lane R's preload (`scripts/BD-freeze.mjs` is a copy of `FINAL/scripts/LR-freeze2.mjs`), one browser at a time through the gate (`--lane BD --n 1`). `scripts/BD-cap.sh` is the wrapper.
- Pixel diff: `scripts/BD-pd.py` (strict = any channel differs; tol = a channel differs by more than 16), the same rule as Lane R's `pdiff.py`. `scripts/BD-class.py` classifies a frame by its room half (top 850 px of 1688) against the two reference frames of section 2.
- Servers: base `4d36939` on :5488 (`w4-final`), current integration on :5570; bisect builds of the eight merges on :5580 to :5587 (`/home/user/wt/w6-bd-<hash>`, sparse, `node_modules` symlinked, private `.tmp/w2.vite.config.ts`, build to `/tmp/rv7-servers/dist-w6bd-<hash>`).

## 2. First finding (noise floor): base against base is not 0.0 here, it has two states

`13` at 390 dark, base `4d36939` on :5488, three captures one after another (`cap/t0/`):

| Capture | Room half | Pair vs `t0-base1` strict / tol |
|---|---|---|
| `t0-base1` | state **A** | (reference) |
| `t0-base2` | state **B** | **29.906 / 8.869** (full frame) |
| `t0-base3` | state **A** | 0.000 / 0.000 |

29.906 / 8.869 are the same two numbers as in RECEIPT-FINAL §9 ("trial against base"), to the third decimal. So the base reproduces the finding on its own: it has two states, A and B, and a pair that lands in different states differs by exactly that amount. The current integration (`f2298d3`, :5570) gave A three times out of three (`t0-cur1..3`, 0.000 / 0.000 against `t0-base1`).

What the two states are (`cap/t0/AB-side-by-side.png`, left A, right B):
- **A** is the pre-rendered window still, `src/scene/stills/window-night-rain.webp` (two clouds in the window at fixed places, darker wall and curtains): it is bit-identical from run to run (0.000 strict).
- **B** is the live three.js canvas faded in over it (one cloud, drifting; the wall and curtains lighter). On this CPU rasterizer the engine runs on the low tier and its picture is not the high-tier still's.
- The focus screen shows the still while the engine is built and has compiled its shaders (`src/scene/Fallback.tsx:26-31` and `src/scene/NookScene.tsx:222-246`: the still stays mounted under the canvas; the canvas fades in over 420 ms once the first frame has landed). `capture.mjs` shoots 3 s after the click. Whether the first frame has landed by then decides A or B.
