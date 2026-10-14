# RECEIPT-LR-N: Lane R, Maker N (Chai night readability), raw evidence

Raw evidence only. No verdict, no visual judgement. Times are UTC, 2026-10-14. Lane started 11:53; the 80-minute box ended 13:13 (spec run 2 finished 13:14 and is included).
No source edits, commits, pushes or merges. I killed only my own PIDs (my queued slot-gate wrappers, including the two still queued at the end, `lr-small` and `lr-text200`, and one of my own capture jobs, section 3).

## 0. What was tested, and how

| | |
|---|---|
| Trial | `46f33e2` = integration `1af69d7`+ + `pe/w3-chai-night@4168428`, worktree `/home/user/wt/w5tr-n` (kettle/src `9699774`). Dev `:5524` (suites), preview `:5534` (captures and perf) |
| Base | `4d36939` (kettle/src `5cd9a44`), worktree `/home/user/wt/w4-final`. Dev `:5478` (not used), preview `:5488` (captures and perf) |
| Servers verified (`runs/server-verify.txt`, `scripts/servedcheck.sh`) | Dev `:5524`: `palette.ts`, `chai.ts`, `chaiModel.ts`, `Engine.ts`, `tests/chai3d.spec.ts` served = committed blobs of `46f33e2` (5/5 OK); `:5478` served = blobs of `4d36939` (5/5 OK, and no `chaiFill` in the served `palette.ts`; `:5524` has 4 hits). Preview `:5534` bundle `scene-BkWyrHlL.js` holds `chaiFill:1 chaiFill:1 chaiFill:2.8 chaiFill:3.2`; preview `:5488` bundles hold none. `chai.glb` sha256 over HTTP is `b401bc6c0fa9dd7a…` on both previews (the approved asset) |
| Machine | 4 CPUs, Chromium headless shell with SwiftShader (`--enable-unsafe-swiftshader --use-angle=swiftshader --ignore-gpu-blocklist`). Load average 10 to 18 during my runs (makers F, S, G and lanes LI, LEAD were running), against about 4 in the LRC receipt, so absolute times are not comparable with LRC's |
| Gate | every browser run through `slots.py run --lane LR --n 1`; each Playwright run has its own `--output`. Slot wait was the limit: the lane often waited 5 to 10 minutes for a slot |
| Frozen clock | `page.clock.install({time: 2026-10-12T07:40:00Z})` then `resume()` in every capture script; service workers blocked |
| Hour | The scene's hours are `morning`, `day`, `dusk`, `night`. **"Evening" in the brief is `dusk`.** The first hour of a context comes from the app's own `?debug&nooktime=` override (`src/scene/resolve.ts`; the debug seeds pin the time of day, so the clock alone does not make night). Later hours in the same context use `window.__nook.setState({time})` with the loop stopped, the call React makes (the mood applies at once when the loop is stopped, `Engine.setState`). Tier: `?nookq=low|high`. The model is awaited (`chaiKind === 'model'`), not forced |
| Still frame (capture scripts; not the perf script, which runs the loop as LRC did) | The context emulates `prefers-reduced-motion: reduce` and the script also calls `setState({reducedMotion:true})`, loop stopped: the engine draws single frames with dt = 0 at its fixed still time. The record-player platter angle (`items.ts:514`, `rotation.y -= dt*3.5`) therefore never accumulates, which is what made the maker's day Nook frames differ by 253 px |
| Scripts | `/home/user/wt/w5tr-n/kettle/.tmp/LR/` (git-ignored); copies in `scripts/` |

### Scripts: written by me or reused

| Script | Origin | What it measures (checked) |
|---|---|---|
| `scripts/lr.mjs` | **mine**, not the maker's `sep.mjs` | frames from the engine's drawing buffer (`gl.readPixels`), masks from hide-diff frames (section 2) |
| `scripts/lru.mjs` | mine; the flow (celebrate seed, "Put the kettle on", `finish()`, wait for the card's `data-scene-ready`) is the maker's `unlock.mjs` / LRC's `unlockready.mjs` flow | the unlock card |
| `scripts/perf.mjs` | **reused verbatim** from maker N's `scripts/perf.mjs` (one header line added; `diff` of the rest is empty), which is LRC's `check4.mjs` adapted to base vs trial | I read it: one Chromium launch; per round a fresh 390×844@3 mobile context; `nooktime=night`, default tier (low on this machine); `engine.frame(1/30)` + 1-px `readPixels` per frame, 10 warm-up and 60 timed frames after `setRunning(false)`; `renderer.info` counters; JS heap after 2 GCs via CDP. It does **not** use `--first` order unless told: I ran both orders |
| `scripts/sumsep.mjs`, `sumperf.mjs`, `cmpraw.mjs`, `pngtool.mjs`, `pngout.mjs` | mine | tables, raw pixel diff, PNG diff and montage |

## 1. Summary of what the evidence shows (numbers only; details in the sections)

- **Separation, close view, 1440×900@2, light, base `4d36939` → trial `46f33e2`** (contrast ratio / ΔL*; my own masks):
  - eyes, dusk 2.26 → 3.85 (high and low tier), night 2.01 → 3.99; day 4.58 (high) / 4.55 (low), unchanged;
  - nose, dusk 1.93 → 3.14, night 1.79 → 3.27 (both tiers); day 3.34 / 3.31, unchanged.
- **Day pixel diff:** 0 differing pixels in every day frame compared (3 frames, section 3), both as drawing buffers and (low tier, Nook and close) as full-viewport screenshots.
- **Unlock card:** Chai covers 0 px in the card frame at both viewports and both hours, on both builds; the card's drawing buffer is pixel-identical base vs trial (4 of 4 pairs, 0 differing pixels).
- **Low-tier performance:** draw calls 110, triangles 75,007, geometries 113, textures 10, programs 23: identical on both builds in 12 of 12 runs; heap 11.1 to 11.3 MB both. Frame time differs by run and by load, with no consistent sign across the two orders (section 6).
- **Suites:** tsc 0; vitest 293/293 (scene unit tests 17/17); the browser specs are in section 7.
- **390×844@2, low tier, light and dark** (captured late, when slots freed): the same shape. Close view, eyes dusk / night: light 2.26 → 3.85 / 2.01 → 3.99, dark 2.07 → 3.39 / 1.87 → 3.51; nose dusk / night: light 1.93 → 3.14 / 1.78 → 3.27, dark 1.80 → 2.80 / 1.67 → 2.91. Day identical (frame hashes equal).
- **Not done** (slot starvation): the high tier at phone widths and in the dark theme at 1440, 375×667, 844×390, 200 % text, see section 9 for exactly which.

## 2. Separation, measured independently

**Method (`scripts/lr.mjs`).** Everything is read from the engine's own drawing buffer after tone mapping (`gl.readPixels`), loop stopped, still frame, so no UI or DOM overlay is in it. I did not use the maker's id-frame masks. Masks come from hide-diff frames, the same camera and the same frame:

1. `N` = the normal frame.
2. Frames with (a) the `eyes_open` subtree hidden, (b) the nose hidden (the `body` primitive `mesh_0_1`), (c) every Chai mesh whose material is not `chai_fur`, or that is in the eyes, hidden, (d) the whole Chai root hidden. `chai.update` is neutralised while hiding (it would re-toggle `eyes_open`/`eyes_closed` each frame). After restoring, the frame equals `N` byte for byte (`restoreDiffBytes` 0 in every row).
3. A pixel belongs to a part when the maximum channel difference to its hide frame is above 24 (above 8 for the whole Chai). Fur = Chai pixels minus the non-fur parts dilated by 1 px, eroded by 1 px. Feature core = the part's mask eroded by 1 px.
4. Ring around a feature = fur pixels within `r` px of the feature's mask, outside a 1-px gap. `r = round(0.5 × feature diameter)` ("half ring", used in the tables; the same rule as the maker's) and a second ring at `r = 1 × diameter` ("full ring"). Feature diameter = `sqrt(4·area/pieces/π)` (eyes 2 pieces, nose 1).
5. Per region: median relative luminance Y (WCAG, from sRGB), median CIE L*, also mean Y, p25/p75 L* and mean colour. **Contrast ratio** = `(Y_ring + 0.05) / (Y_feature + 0.05)` on the medians. **ΔL\*** = `L*_ring − L*_feature` on the medians.
6. Views: `close` = the camera of C's art renders (the room's direction moved in on Chai: `fitTarget (-0.95, 0.82, 1.15)`, zoom 0.2; copied from the maker's script so the numbers are comparable); `nook` = the default camera people see.

**How independent this is.** The masks, ring and statistics code are mine. The frames come from the same engine and camera as the maker's, and the statistic's definition (median-based WCAG ratio, ring ½ diameter) is the same one by choice, so the check is independent in masks and implementation, not in frame source or metric.

Full table (all rows, with full ring, mean colours, pixel counts and component counts): `sep/SEPARATION-TABLES.md`. Raw: `sep/BASE/lr-*.json`, `sep/TRIAL/lr-*.json`.

**Close view, 1440×900@2, light theme, the model, preview servers.** Cells are contrast ratio / ΔL*.

| tier | hour | eyes BASE | eyes TRIAL | nose BASE | nose TRIAL | fur ring L* (eyes) BASE → TRIAL | fur ring mean colour BASE → TRIAL | fur fill read BASE → TRIAL |
|---|---|---|---|---|---|---|---|---|
| high | day | 4.58 / 48.0 | 4.58 / 48.0 | 3.34 / 37.8 | 3.34 / 37.8 | 51.3 → 51.3 | #ae6d33 → #ae6d33 | 0.16 → 0.16 |
| high | dusk | 2.26 / 30.0 | 3.85 / 44.4 | 1.93 / 25.4 | 3.14 / 38.7 | 30.5 → 44.9 | #723a19 → #9b5b2f | 0.16 → 0.448 |
| high | night | 2.01 / 26.8 | 3.99 / 45.4 | 1.79 / 23.3 | 3.27 / 40.0 | 27.1 → 45.8 | #653416 → #9a5e31 | 0.16 → 0.512 |
| low | day | 4.55 / 47.7 | 4.55 / 47.7 | 3.31 / 37.4 | 3.31 / 37.4 | 51.3 → 51.3 | #ae6d34 → #ae6d34 | 0.16 → 0.16 |
| low | dusk | 2.26 / 30.0 | 3.85 / 44.4 | 1.93 / 25.4 | 3.14 / 38.7 | 30.5 → 44.9 | #723a19 → #9b5b2f | 0.16 → 0.448 |
| low | night | 2.01 / 26.8 | 3.99 / 45.4 | 1.78 / 23.2 | 3.27 / 39.9 | 27.1 → 45.8 | #653416 → #9a5e31 | 0.16 → 0.512 |

Share of the same build's day ratio (eyes / nose): base dusk 49-50 % / 58 %, night 44 % / 54 %; trial dusk 84-85 % / 94-95 %, night 87-88 % / 98-99 %.

**Nook framing (what people see), 1440×900@2, light, low tier.** The same ratios to ±0.02 (eyes dusk 2.26 → 3.85, night 2.01 → 3.99; nose dusk 1.93 → 3.14, night 1.78 → 3.27), but on 47 to 56 eye pixels and 163 to 178 nose pixels per frame (the face is small in the default camera), against 1,900 to 1,960 and 5,250 to 5,360 in the close view.

**390×844@2, low tier, close view (the same camera; the canvas there is 442×395), light and dark theme.** Cells are contrast ratio / ΔL*.

| theme | hour | eyes BASE | eyes TRIAL | nose BASE | nose TRIAL | fur ring L* BASE → TRIAL | fill BASE → TRIAL |
|---|---|---|---|---|---|---|---|
| light | day | 4.55 / 47.7 | 4.55 / 47.7 | 3.33 / 37.5 | 3.33 / 37.5 | 51.3 → 51.3 | 0.16 → 0.16 |
| light | dusk | 2.26 / 30.0 | 3.85 / 44.4 | 1.93 / 25.4 | 3.14 / 38.7 | 30.5 → 44.9 | 0.16 → 0.448 |
| light | night | 2.01 / 26.8 | 3.99 / 45.4 | 1.78 / 23.2 | 3.27 / 39.9 | 27.1 → 45.8 | 0.16 → 0.512 |
| dark | day | 4.01 / 44.5 | 4.01 / 44.5 | 3.01 / 35.3 | 3.01 / 35.3 | 47.5 → 47.5 | 0.16 → 0.16 |
| dark | dusk | 2.07 / 27.6 | 3.39 / 40.9 | 1.80 / 23.4 | **2.80** / 35.7 | 28.0 → 41.4 | 0.16 → 0.448 |
| dark | night | 1.87 / 24.7 | 3.51 / 42.0 | 1.67 / 21.1 | **2.91** / 36.8 | 24.9 → 42.2 | 0.16 → 0.512 |

In the dark theme the trial's nose ratio at dusk (2.80) and night (2.91) is below 3.0 (the dark day value is 3.01), and the eyes reach 3.39 and 3.51 against a dark day value of 4.01. As a share of the same build's day ratio, dark: eyes dusk 52 % → 84 %, night 47 % → 88 %; nose dusk 60 % → 93 %, night 55 % → 97 %.

In the **Nook framing at 390×844** the eyes are too small to measure: 0 pixels after the 1-px erosion (two small components in the raw mask), the nose is 9 to 13 pixels. Its ratio agrees with the close view (nose, light: dusk 1.92 → 3.13, night 1.78 → 3.26; dark: dusk 1.79 → 2.79, night 1.67 → 2.91). So at phone size only the close view carries a measurement for the eyes.

**Against the maker's packet.** My base rows reproduce the maker's BEFORE rows (eyes 2.01 / 2.26 / 4.58, nose 1.79 / 1.93 / 3.32 on the high tier) to ±0.02 in ratio and ±0.3 in ΔL*. My trial rows reproduce the maker's AFTER rows (3.85 / 3.99 and 3.14 / 3.27) to the second decimal. The maker's AFTER rows came from `chai.setFill(k)` on the dev build; mine come from the hour the app sets, through the URL, on the preview build, so the shipped wiring from hour to fill is now measured: the fur's `emissiveIntensity` reads 0.16 / 0.448 / 0.512 at day / dusk / night on the trial and 0.16 on every hour on the base.

**Things in the data that are not what you would assume.**
- The eye mask has 5 to 6 connected components on the trial and 3 to 6 on the base (two eyes plus eye highlights or fragments), where two were expected. The nose mask is 1 component on the low tier and 2 to 6 on the high tier, with 2.5× more pixels there (13,250 to 13,750 against 5,250 to 5,360): on the high tier a hide-diff catches shadow or occlusion changes around the nose as well. The ratios agree with the maker's id-frame ratios (same to 0.02), so the medians are robust to that, but the high-tier nose pixel count is not "just the nose".
- The "full ring" ratios equal the half-ring ratios to the printed precision in every row (the face plate is a flat vertex colour).
- Chrome logs a "GPU stall due to ReadPixels" performance warning from my own `readPixels`; no page error and no other console error in any capture job (`sep/*/lr-*.json`, field `errors`).

## 3. Day unchanged: pixel diff

Frames are compared at day on the same still-frame path (section 0), every pixel and channel.

| config | what | size | differing pixels | max channel diff | FNV-1a of the buffer, base / trial |
|---|---|---|---|---|---|
| 1440×900@2 light high | drawing buffer, close view | 1992×1828 | **0** | 0 | `da8bfc7a` / `da8bfc7a` |
| 1440×900@2 light low | drawing buffer, close view | 1245×1142 | **0** | 0 | `9e78bf54` / `9e78bf54` |
| 1440×900@2 light low | drawing buffer, Nook view | 1245×1142 | **0** (platter included) | 0 | `3d800a6d` / `3d800a6d` |
| 390×844@2 light low | drawing buffer, Nook view and close view | 442×395 each | **0** | 0 | Nook `559f00b3` / `559f00b3`, close `ed09b85c` / `ed09b85c` |
| 390×844@2 dark low | drawing buffer, Nook view and close view | 442×395 each | **0** | 0 | Nook `a4fcf9e` / `a4fcf9e`, close `bae31d88` / `bae31d88` |
| 1440×900@2 light low | full-viewport screenshot, Nook view | 2880×1800 | **0** | 0 | (PNG diff) |
| 1440×900@2 light low | full-viewport screenshot, close view | 2880×1800 | **0** | 0 | (PNG diff) |

How moving parts were handled: loop stopped, reduced-motion still frame (dt = 0, fixed still time), so the platter, steam and breath do not depend on wall time; the clock is frozen. The maker's 253-px platter difference does not occur on this path. I did not run a base-versus-base control (two base day frames from separate contexts) and did not compare the base and trial day frames of the same build across two contexts, so "same-build repeatability across contexts" is not shown; the base-vs-trial result of 0 px is.

Evening and night, for contrast, on the low tier Nook frame, full-viewport screenshots 2880×1800 (`pngtool.mjs`, `pngout.mjs`):
- **dusk:** 21,888 differing pixels, all inside Chai's screen box (x 1351-1489, y 1210-1413 in screenshot pixels); outside a box x 1340-1500, y 1200-1420 0 pixels differ.
- **night:** 21,900 differing pixels inside that box (max channel difference up to 68); outside it 280,787 pixels (5.4 %) differ by exactly 1 level and 1 pixel by 3. Day and dusk show no such 1-level noise. I did not find the source (candidates: a time-dependent night effect not covered by the still time; screenshot compositing) and did not run a base-vs-base night control, so I cannot say whether it is present base-vs-base.
- Diff map: `diff/1440x900-light-low-night-nook-frame_diffmap.png`.
- **Full-viewport screenshots at 390×844 day are not identical although the canvas buffers are** (hashes above): light 32,836 pixels (2.5 %) differ, 32,762 of them by exactly 1 level, 32 by more than 2 (max 23), those within x 81-464, y 1061-1512 (screenshot pixels, i.e. below the canvas, in the page UI); dark the same (33,195 px; 32 above 2, same box). Diff map `diff/390x844-light-low-day-nook-frame_diffmap.png`. I did not find the cause (the page's animated UI is the candidate); the 1440 screenshots at day are 0. The scene itself, as drawn, is identical.

**One defect of my own, disclosed.** My first trial job (`lr-TRIAL-1440L`) ran the views as `close,nook`; the close camera persists in the engine, so its "nook" frames were copies of the close frames (identical hashes). I removed those frames and files and re-ran the trial's Nook view for the low tier (`lr-TRIAL-1440L-nook.json`, valid); the high-tier trial Nook view was dropped to save slot time (not captured). The script now always runs `nook` before `close`. The base's first job was killed by me (own PID) after its low config, and its high tier was re-run close-view only (`lr-BASE-1440H.json`).

## 4. Captures

Everything is full size and native. Names: `<viewport>-<theme>-<tier>-<hour>-<view>-frame.png` (full-viewport screenshot) and `…-face.png` (native crop of the drawing buffer around Chai's eyes and nose, about 3.8× the eye-to-nose span on each side, no UI). `BASE` = `4d36939` preview `:5488`, `TRIAL` = `46f33e2` preview `:5534`.

| Set | Where | Done |
|---|---|---|
| 1440×900@2 light, low tier, day / dusk / night, Nook and close views, BASE and TRIAL | `sep/BASE/`, `sep/TRIAL/` (`…-nook-frame.png`, `…-close-frame.png`, `…-close-face.png`, `…-nook-face.png`) | yes |
| 1440×900@2 light, high tier, day / dusk / night, close view, BASE and TRIAL | `sep/BASE/` (face crops only; the base high job ran without screenshots), `sep/TRIAL/` (close frame and face crop) | yes, close view only |
| Base-left / trial-right montages of the face crops, low tier: close view native, Nook view enlarged 4× (nearest neighbour, `_x4`) | `captures/montage-face/` | yes (low tier only) |
| 390×844@2 light and dark, low tier, day / dusk / night: Nook frames (full-viewport), close-view face crops, Nook face crops | `sep/BASE/390x844-*`, `sep/TRIAL/390x844-*`; montages `captures/montage-face/390x844-*` (close-view face crops, all 6 states; night Nook frames light and dark) | yes |
| 375×667, 844×390; dark theme at 1440; high tier at 390; 200 % text | | see section 9 |

## 5. The unlock card

Script `scripts/lru.mjs`, previews, default tier (no `nookq`; the resolved tier is `low` on this machine), light theme, `celebrate` seed on Home, "Put the kettle on", `__kettle.finish()`, the Done route, the early frame (about 0.9 s: the drawing), then the card's `data-scene-ready="true"` + 3.5 s, loop stopped. Night first by the URL override, day second by `setState({time})` on the card's engine. Reduced motion emulated (still frames). Raw: `unlock/BASE/lru-BASE.json`, `unlock/TRIAL/lru-TRIAL.json`; frames `unlock/{BASE,TRIAL}/<vp>-light-<hour>-unlock-{early,frame,card-canvas}.png`.

| viewport | hour | engine mode / tier / Chai kind (both builds) | card canvas (buffer px) | Chai pixels in the card frame (base / trial) | Chai head, NDC x, y | card buffer, differing pixels base vs trial | FNV base / trial |
|---|---|---|---|---|---|---|---|
| 390×844@2 | night | showcase / low / procedural | 189×142 (css 152×114 at 30,509) | 0 / 0 | -12.46, -1.69 | **0** | `a4b1cf73` / `a4b1cf73` |
| 390×844@2 | day | showcase / low / procedural | 189×142 | 0 / 0 | -12.46, -1.69 | **0** | `c954648b` / `c954648b` |
| 1440×900@1 | night | showcase / low / procedural | 425×239 | 0 / 0 | -9.35, -1.69 | **0** | `ba1d601a` / `ba1d601a` |
| 1440×900@1 | day | showcase / low / procedural | 425×239 | 0 / 0 | -9.35, -1.69 | **0** | `b1aadd35` / `b1aadd35` |

- **Is Chai in frame?** No. "Chai pixels in frame" = pixels that change when the Chai root is hidden (threshold 8): 0 in all 8 states. The head's projected position is far outside the view (|x| of 9 to 12). The card shows the record player (`highlight: recordPlayer`) at camera zoom 0.125.
- **Chai kind in the card engine is `procedural`** on both builds (the card's engine does not hold the model), as the LRC receipt also recorded. Its fur fill was therefore not read (`furFill` null); it is out of frame either way.
- **Anything different?** In the card's drawing buffer, no: 0 of 26,838 and 0 of 101,575 pixels, in all 4 pairs. The night and day card frames do differ from each other (the hour reaches the card: `unlock/TRIAL/…-night-unlock-card-canvas.png` against `…-day-…`).
- **Full-viewport screenshots of the Done page differ** base vs trial outside the card (e.g. 390: 131,219 px, 10 %, max channel 24; 1440: 3,013 px, max channel 1). The page's hero scene, confetti and entry animations are not frozen by my stop (`setRunning(false)` stops the card's engine only), and the day and night pairs show the same clusters, so I take this to be page animation, not the scene change; I did not isolate it further. The unlock card's own canvas is the comparison that matters here.
- The "drawing" stage (the early frames, night, both builds) is in `…-unlock-early.png`; I did not compare it pixel by pixel.

## 6. Low-tier performance, LRC method

Method: `scripts/perf.mjs` (verbatim from the maker; section 0). Previews `:5488` (base) and `:5534` (trial), 390×844@3 mobile, light, `veteran`, `nooktime=night`, default tier (low, confirmed `quality` low in all 12 runs), model on both (`chaiKind` model, `root.userData.model` true, 1 `.glb` request each), canvas 442×395. One Chromium launch per set; 3 rounds, alternating; 10 warm-up and 60 timed frames. Full tables: `perf/PERF-TABLES.md`; raw JSON `perf/perf-low-390x844-night-*.json`; logs `runs/perf-*.log`.

| set | order in each round | slot start | load at runs |
|---|---|---|---|
| A | base first, then trial | 12:02 | 10 to 14 |
| B | trial first, then base | 12:48 | 17 to 18 |

Frame time, median per run (ms), engine frame + 1-px readPixels:

| set | base per run | base median of medians | trial per run | trial median of medians |
|---|---|---|---|---|
| A (base first) | 135, 164, 107 | **135** | 100, 186, 174 | **174** |
| B (trial first) | 307, 286, 277 | **286** | 287, 351, 285 | **287** |

Same-round difference (trial minus base, ms): set A: -35, +22, +67; set B: -20, +65, +8.

Counters, identical in all 12 runs on both builds: draw calls **110**, triangles **75,007**, geometries **113**, textures **10**, programs **23**. JS heap after 2 GCs: base 11.17 to 11.25 MB, trial 11.09 to 11.26 MB. The fur fill read from the model is 0.16 on the base and 0.512 on the trial in every run. No page error. (The LRC receipt's numbers, 108 calls / 74,910 triangles / 111 geometries, belong to its older build and are not comparable.)

Facts about the timing: in the two sets the trial reads slower in set A (second in each round, +39 ms on the medians) and level in set B (first in each round, +1 ms), and the run-to-run spread inside one build is larger than either difference (base 107 to 164 in set A; trial 285 to 351 in set B). The load average was different between sets, so the two sets are not on the same footing; I ran no control of base against base.

## 7. Suites (trial dev :5524)

| Command | Result | Log |
|---|---|---|
| `npx tsc --noEmit` (trial worktree) | exit 0, no output | `runs/tsc.txt` |
| `npx vitest run` (all) | 30 files, **293/293** passed | `runs/vitest-all.txt` |
| `npx vitest run src/scene` | 3 files, **17/17** passed: `palette.test.ts` (incl. "Chai fur self-fill by hour"), `chaiModel.test.ts` (incl. "setFill scales the fur self-fill only…" and "procedural Chai: setFill…"), `chaiHost.test.ts` | `runs/vitest-scene.txt` |
| `KETTLE_PORT=5524 npx playwright test tests/chai3d.spec.ts tests/w2-room.spec.ts --project=chromium --workers=1`, run 1 | **16 passed / 17** (8.6 min, 12:55 to 13:04, load about 12 to 18), 1 failed, exit non-zero. Passed: all 10 `chai3d.spec.ts` cases, including the new "the fur self-fill follows the hour (day unchanged, stronger at dusk and night); eyes and nose untouched" (1.3 min), and 6 of 7 `w2-room.spec.ts` cases. **Failed:** `w2-room.spec.ts:144` "Focus backdrop: earned items without the live 3D room › 3D failure (WebGL context lost): the still that takes over carries the same items": `page.screenshot: Test timeout of 60000ms exceeded` at `w2-room.spec.ts:80` (the second screenshot of `assertLayersDrawn`). This is the same test and the same step the maker's run 1 reported as failing (its C-7); I did not run this test on the base, so I have nothing on the base | `runs/spec-run1.log` |
| the same, run 2 | **17 passed / 17** (8.2 min, 13:06 to 13:14, exit 0), including the new fur-fill test (1.1 min) and `w2-room.spec.ts` "3D failure (WebGL context lost)…" (51.4 s), the case that failed in run 1 | `runs/spec-run2.log` |

Facts about the two runs: both ran the same 17 tests in the same order (10 in `chai3d.spec.ts`, 7 in `w2-room.spec.ts`). The line numbers in run 2's list (e.g. `chai3d.spec.ts:93` for a test that is on line 72 of the file) differ from run 1's, which match the file; the maker's own run 2 log shows the same shifted numbers. The two spec files in the trial worktree are the committed blobs (`git show HEAD:` equals the file, mtime 11:51:59, before my first run), so I take it as a line-mapping effect of Playwright's cache on a second run; I did not confirm that. Run 1 failed on the same test as the maker's run 1; run 2 passed it, as the maker's did.

## 8. Notes on the maker's packet (claims checked)

- Claim "eyes/nose contrast evening 2.26/1.93 → 3.85/3.14, night 2.01/1.79 → 3.99/3.27, day 4.58/3.32": reproduced (section 2), with my own masks.
- Claim "day close-up 0 px diff": reproduced on the high and low tier close view, and also for the Nook view and full-viewport screenshots on the low tier (section 3); the 253-px platter difference did not reproduce on the still-frame path.
- Claim "low tier: draw calls, triangles, textures and programs identical": reproduced (110 / 75,007 / 10 / 23, plus geometries 113 and the heap).
- Claim "frame time 200 → 209 ms, order not swapped": the order-swapped set was run (section 6): no consistent sign.
- Claim "vitest 293/293": reproduced. Claim "chai3d + w2-room 16/17 then 17/17": reproduced, 16/17 then 17/17, with the same failing test in run 1 (section 7).
- The packet's gaps I covered: the unlock pair (section 5) and the order-swapped frame time (section 6). Gaps still open: dark theme, 390×844 frames, the procedural Chai's numbers (section 9).

## 9. Not proven, and why

| Item | Status |
|---|---|
| 375×667 and 844×390 base-vs-trial grids (queued as `lr-small`, not run before the box ended) | **not captured, not measured** |
| Dark theme at 1440×900 (queued, not run) | **not captured, not measured** (the dark theme at 390×844, low tier, is in section 2) |
| High tier at 390×844, light and dark; the high tier at 1440 in the dark theme | **not captured, not measured** |
| The high-tier Nook view at 1440, trial and base (the high tier was run close-view only) | **not captured** |
| 200 % text spot check (queued as `lr-text200`, not run) | **not captured** |
| Separation measured on the real unlock card | n/a: Chai is out of frame (section 5) |
| The procedural Chai's separation numbers (first frame and fallback) | **not measured** |
| Same-build repeatability across contexts (base vs base) for the day frames, the 1-level night noise (section 3) and the 390 screenshot differences | **not run** |
| Order-swapped performance on equal load; a base-vs-base timing control | **not run**; sets A and B ran at different load |
| Captures and measurements used the preview builds; the dev servers were used for the suites only | the dev build's frames were not captured by me |
| Unlock: default tier only (low); the high-tier card; the drawing stage not diffed; Done-page screenshots differ outside the card (animation not frozen) | **not run / not isolated** |
| Full chromium suite | **not run** |
| "As clearly as by day", "looks right", fur "lit cut-out" | judgement, not mine |

## 10. Evidence layout (`/home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/LR/N/`)

- `runs/`: command logs (vitest, tsc, specs, every capture/perf job, `server-verify.txt`).
- `sep/BASE`, `sep/TRIAL`: frames, face crops and `lr-*.json` (all numbers); `sep/SEPARATION-TABLES.md`: all rows.
- `unlock/BASE`, `unlock/TRIAL`: unlock frames and JSON.
- `perf/`: JSON and `PERF-TABLES.md`.
- `diff/`: day and night diff maps.
- `captures/montage-face/`: base-left / trial-right face montages.
- `scripts/`: every script used.
