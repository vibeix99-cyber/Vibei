# Receipt BD: the 390 dark first-brew backdrop difference (Sonnet 5.5, investigator BD, report only)

Status: stage 4 (complete; the answer is in section 8). The sections below are filled in stages and committed after each.

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

## 6. Two more checks

**375x667@2 light, base alone** (`--only 02,12,13` six times on :5488, `logs/l375-pairs.log.txt`): run 1 against runs 2 to 5 is 4.98 / 0.89, run 1 against run 6 is 27.18 / 1.55, runs 2 to 5 are identical to each other (0.000). Lane R's 375 light `13` (22.5 / 0.66, "tint-level") is of this kind and size: the base alone shows pairs of 5 to 27 % strict with tol 0.9 to 1.5 (the still and the live frame are close in the light theme's forced day, so the tol is small).

**Why A and B differ in the room, tier forced** (`scripts/BD-hq.mjs`, base :5488, `?nookq=high` and `?nookq=low`, shot 4 s after the scene is ready, so no race; `cap/tier/`, left to right in `A-B-HQ.png`: still A, live low-tier B, live high-tier):

| Frame | Room half, tol, against the still A | against live low B |
|---|---|---|
| live, `nookq=high` (ready after 10.8 s here) | **2.78** | 16.53 |
| live, `nookq=low` (what the CPU rasterizer picks by itself: `src/scene/resolve.ts:114`, `softwareGL()`; ready after 2.5 s) | 17.26 | 0.01 |

The stills are rendered by the **high** tier (`scripts/stills/window.html:15`, `quality: 'high'`). The capture's SwiftShader browser runs the **low** tier, where `kit.liteify` (`src/scene/engine/Engine.ts:338`) swaps the materials, so its live room is lighter on the wall and the right curtain (right-wall mean RGB 68, 46, 61 against the still's 54, 34, 57; the left wall is the same). So on this renderer, still to live is a visible shift of the room, and which one a screenshot catches is a race. The same fade on a GPU device (high tier) would be 2.8 % tol (cloud and rain drift) and was not measured on real hardware.

## 7. Mechanism (file:line, the same in base and in every merge)

1. `kettle/review/product-excellence/tools/capture.mjs:184-186`: click `Start a 15-min brew`, `waitForTimeout(3000)`, then screenshot `13`. There is no wait for the scene.
2. `src/screens/focus/stage/Stage.tsx:87`: the Focus backdrop is `<Nook mode="window" ...>`.
3. `src/scene/NookScene.tsx:222-246` (with `FADE_MS = 420` at `:14`): until the engine's first frame has landed (`onFirstFrame` at `:62`) the host shows the **static still**, `src/scene/Fallback.tsx:26-33` (`windowStill`) and `:113` (`NookStatic` in `window` mode returns `WindowStill`), a pre-rendered `src/scene/stills/window-night-rain.webp`. The canvas (opacity 0, then a 420 ms fade) covers it afterwards. The engine first waits `SETTLE_MS = 650` ms (`src/scene/warm.ts:20`, `NookScene.tsx:79`), builds, compiles its shaders a few per task (`:97`) and renders. Under the CPU rasterizer and a loaded machine (load 3 to 18 here) the first frame lands around the 3 s mark: in-page, the engine was ready 2.1 to 3.0 s after the click, and the page clock ran 1.1 to 3.3 s while the screenshot call waited (the frozen-clock preload fakes `performance.now`, so page time runs slower than wall time when the main thread is busy: the timer read 14:59 in the first A frame and 14:58 in the first B frame).
4. Screenshot with `animations: 'disabled'` (the preload) finishes the 420 ms fade at once, so the frame is never a blend: A (still) or B (live), plus a rare X (live room caught while the screen is still entering, 10 px low; seen once in 6 triples).

None of these files, nor `src/scene/stills/`, nor `Stage.tsx`, has a commit in `4d36939..f2298d3` (`git diff --stat` is empty for them). The only scene-code change in the whole range is N (`3faaf94`): `Engine.ts:+5`, `chai.ts:+6`, `chaiModel.ts:+11`, `palette.ts:+13`, a per-hour value for **Chai's fur emissive** (`chaiFill`, one uniform); CHECKER-W3R1-N N-8 measured the same 23 programs, draw calls and triangles in 18 runs, and the window view has no Chai in frame. The room-half B frames of N, G, F and the current integration are the base's B frame to tol 0.000 (section 3).

## 8. Answer

- **Noise floor:** at 390 dark `13`, base against base is **not** 0.0. When the two captures land in different states it is exactly the finding's number, 29.906 / 8.869 (other pairs: 30.061 / 9.032, 30.009 / 8.972, 32.756 / 9.063 where the live frame is a different moment). In Lane R's order (six triples) base against base differed in state in **5 of 6** and was 0.000 once; on a quiet machine (load 1.2 to 3.0) base alone gave A, B, A. Final (`2be3de1`) against final: **29.908 / 8.870** when the two land in different states (`ws1` against `ws2`, `rr1` against `ws1`), **0.000 / 0.000** when they land the same (five more pairs, `logs/final-vs-final.log.txt`): the same floor as the base's. A state's frame is deterministic under the frozen clock (same-state frames from different runs are bit-identical, 0.000 strict).
- **Bisect table:** sections 4 and 5. Nine builds, cold: every merge gave A in 5 or 6 of 6 and B in at most 1; warm: base A, B, B; `2be3de1` B, A, A (+ six more in the triples: five B, one X); `3faaf94` B, B, B; `f2298d3` B, B, B. Both states occur on the base and on every build tested warm. No merge is a systematic A against the base's B.
- **First bad merge:** **none.** The frames of the same state are identical across builds (section 3), so no merge changed the backdrop image. Lane R's pair is one A-against-B draw, repeated in two matrices (both at the same order and the same time of day) consistent with chance, and not with a code change.
- **Intended:** the still-then-live fade is the pre-existing design of the scene area (the stills are "shown while the engine loads", `Fallback.tsx:26-29`) and no W3R1 maker touched it. N's brief and verdict cover only Chai's fur at night and do not reach the room. The visible room shift between the still and the live frame on the low tier is also in the base. Whether that shift matters for real low-tier phones (the tier is chosen there by `weak && isMobileDevice()`, `resolve.ts:114`) is a product question for the scene area, outside this finding; it was measured only on SwiftShader.
- **Obvious or LEAD-5:** the cause is obvious and fully shown: a capture race, not a code change. Nothing needs to go to LEAD-5 for a verdict on this. If anyone wants a number-stable matrix, the fix is in the capture, not the app: wait for `[data-scene-ready="true"]` plus the 420 ms fade before shot `13` (`11b` already waits for `data-scene-ready` in that way); that is not applied here.

## 9. Unproven

- One machine, SwiftShader, load 3 to 18 from other lanes; the share of A and B depends on load and I did not control it. The counts are small (nine builds x 6 cold; four builds x 3 warm; 6 triples). They show that both states occur on the base; they do not show that every build has the same rate.
- Lane R's full 21-state run was not repeated; `--only 02,12,13` stands in for its warm browser.
- No real-GPU measurement. The tier explanation of the A/B difference in the room is measured on SwiftShader only.
- 844x390, 200 % text and the high tier of the full capture were not covered.

## 10. Evidence layout

`scripts/` (BD-cap.sh, BD-freeze.mjs, BD-pd.py, BD-class.py, BD-table.py, BD-rr.sh, BD-trip.sh, BD-probe.mjs/.sh (a first, perturbing in-page probe: its polling slows the page; used only for the in-page ready times quoted in section 7), BD-hq.mjs/.sh), `logs/` (cold and warm run logs, the order log and pair numbers, the 375 pairs, tables), `cap/t0` (the first A and B frames, the diff, the still), `cap/xbuild` (same-state frames of several builds), `cap/order`, `cap/tier`, `cap/l375`, `cap/cold` (the two B frames of the cold runs).
