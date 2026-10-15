# Receipt BD: the 390 dark first-brew backdrop difference (Sonnet 5.5, investigator BD, report only)

Status: stage 3 (Lane R's order, six triples). The sections below are filled in stages and committed after each.

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

## 3. The picture does not change between builds: only which of the two frames the capture catches

Same-state frames compared across builds (full frame, `scripts/BD-pd.py`; the frames are in `cap/xbuild/`):

| Pair | State | strict / tol |
|---|---|---|
| `t0-base1` (base) against `rr1-base`, `rr1-2be3de1`, `rr1-f2298d3`, `ws3-2be3de1` (final) | A against A | 0.000 / 0.000 in each |
| `t0-base2` (base) against `rr3-f2298d3`, `rr6-25b5e26`, `ws2-f2298d3` | B against B | 0.000 to 0.003 / 0.000 in each |
| `ws2-base` (base) against `ws1-2be3de1`, `ws1-f2298d3`, `ws2-3faaf94` (N) | B against B | 11.44 / **0.000** (strict only: a second live frame of the drifting clouds, no channel off by more than 16) |

The pre-rendered still (A) is the same file in every build (`src/scene/stills/` has no commit in `4d36939..f2298d3`) and the live canvas (B) draws the same room in base, in N (`3faaf94`), in G, in F and in the current integration: the room half of a B frame from the base is the room half of a B frame from the final to tol 0.000. What differs between "final against base" and "base against base" in Lane R's matrix is whether the capture landed in A or in B, not what A or B looks like.

## 4. Bisect runs

`--only 13` in a fresh browser (a **cold** GPU process: the engine has to compile its shaders), 390x844@2 dark, 6 round-robin rounds over the nine builds (base and the eight merges; one browser at a time through the gate; machine load 3 to 18 while other lanes ran: `logs/rr-cold.log.txt`, classification per frame `logs/rr-cold-class.log.txt`). State A = the pre-rendered still, B = the live canvas, X = neither (never seen).

| build | rr1 | rr2 | rr3 | rr4 | rr5 | rr6 | A | B | X | load (min to max) |
|---|---|---|---|---|---|---|---|---|---|---|
| base | A | A | A | A | A | A | 6 | 0 | 0 | 3.3 to 16.6 |
| 3faaf94 | A | A | A | A | A | A | 6 | 0 | 0 | 3.8 to 16.2 |
| 25b5e26 | A | A | A | A | A | B | 5 | 1 | 0 | 5.2 to 17.1 |
| a859d86 | A | A | A | A | A | A | 6 | 0 | 0 | 6.2 to 16.4 |
| 0efca36 | A | A | A | A | A | A | 6 | 0 | 0 | 5.7 to 15.7 |
| 60fdb7e | A | A | A | A | A | A | 6 | 0 | 0 | 6.7 to 16.1 |
| 2be3de1 | A | A | A | A | A | A | 6 | 0 | 0 | 6.2 to 17.7 |
| 8b1ed4d | A | A | A | A | A | A | 6 | 0 | 0 | 6.5 to 18.0 |
| f2298d3 | A | A | B | A | A | A | 5 | 1 | 0 | 8.8 to 16.9 |

Plus the three quiet-machine samples of section 2 (load 1.2 to 3.0, `t0-*`): base A, B, A and the current integration A, A, A.

`--only 02,12,13` (the capture's own focus run, then the welcome shot, then 13: a **warm** browser as in Lane R's full run), 3 rounds, four builds (`logs/ws-warm.log.txt`):

| build | ws1 | ws2 | ws3 | A | B | X | load (min to max) |
|---|---|---|---|---|---|---|---|
| base | A | B | B | 1 | 2 | 0 | 8.8 to 17.2 |
| 2be3de1 | B | A | A | 2 | 1 | 0 | 9.6 to 17.3 |
| 3faaf94 | B | B | B | 0 | 3 | 0 | 9.6 to 16.1 |
| f2298d3 | B | B | B | 0 | 3 | 0 | 8.8 to 16.4 |

Reading: both states occur on the base, and both occur on the final and on N. In the warm runs the base gave A, B, B and the final gave B, A, A. No merge shifts the picture (section 3), and no merge is a consistent A where the base is a consistent B in these runs.

## 5. Lane R's order, repeated: final first, then base, then base again (six triples)

`scripts/BD-trip.sh`: per triple one capture of the final build (`2be3de1`, :5585, as Lane R's "trial"), then the base (:5488), then the base again, each `--only 02,12,13` (the capture's own focus run, the welcome shot, then 13: a warm browser, as in the full run), 390x844@2 dark, one browser at a time through the gate, load 10.5 to 16.9 (`logs/tr-order.log.txt`). The pair numbers are in `logs/order-pairs.log.txt`.

| build | tr1 | tr2 | tr3 | tr4 | tr5 | tr6 | A | B | X | load (min to max) |
|---|---|---|---|---|---|---|---|---|---|---|
| trial | X | B | B | B | B | B | 0 | 5 | 1 | 10.5 to 16.1 |
| ctrl | B | A | A | A | B | B | 3 | 3 | 0 | 10.9 to 16.7 |
| ctrl2 | A | B | A | B | A | A | 4 | 2 | 0 | 11.0 to 16.9 |

Pair diffs, full frame, strict / tol:

| Triple | final against base | base again against base |
|---|---|---|
| 1 | 50.270 / 15.772 (X: the live room caught while the screen was still entering, 10 px low) | **29.906 / 8.869** |
| 2 | **29.906 / 8.869** | **29.906 / 8.869** |
| 3 | **29.906 / 8.869** | 0.000 / 0.000 |
| 4 | **30.061 / 9.032** | **30.061 / 9.032** |
| 5 | 0.363 / 0.352 | **32.756 / 9.063** |
| 6 | 0.363 / 0.351 | **30.009 / 8.972** |

- **Base against base alone gives the finding's numbers in 5 of 6 triples** (29.9 to 32.8 strict, 8.9 to 9.1 tol); it was 0.0 once. The finding's pair, 29.906 / 8.869, is the A-against-B pair on any build and any side of the pair.
- In these six triples the final build was the live room (B) five times and mid-entry (X) once, never the still; the base was B in 5 of 12 and A in 7 of 12. That is the opposite direction to Lane R's matrix (final A, base B): there is no consistent direction, and with these counts (final 6 of 6 live against base 5 of 12) it is not shown to be a property of the build (the two orders and the two matrices point opposite ways; a build effect would have to be the same way in each). Pooled warm runs of sections 4 and 5: final 7 of 9 live (B or X), base 7 of 15 live.
- Lane R's matrix (trial, base, base again, one run each, per config) had a single triple at 390 dark twice (the earlier combined matrix and the final one): two draws of this coin.
