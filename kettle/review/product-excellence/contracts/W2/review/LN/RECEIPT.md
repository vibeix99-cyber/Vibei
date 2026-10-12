# Lane N receipt · Wave 2 round 1 · Maker N (Room and Nook, I09)

**Reviewer:** Lane N, model Sonnet 5.5 (`claude-sonnet-5-5`). **I issue no verdict.** This is a receipt of checks run.
**Wall clock:** start 2026-10-11 22:59:24 UTC · end {{END}} UTC (budget 75 min).
**Under review:** `pe/w2-room@fc9f6d8` (code `5d7bb23`, `kettle/src` `81cd36e`), trial merge `2acc218` (worktree `/home/user/wt/w2t-n`, `git rev-parse HEAD:kettle/src` = `81cd36ea83419e210f9360efea397153e1de7860`).
**Control:** `90a11e5` (`/home/user/wt/w2-base`). Never stopped or touched.
Packet and gate read in full. Nothing edited, committed or pushed outside my own lane directory and `.tmp/LN/` (git-ignored). **One slip, disclosed:** a `pip download pillow` run with its working directory in N's `…/W2/N/probes/` saved a 6.9 MB wheel there; I deleted it within a minute, N's probe files are byte-identical to the shas listed at the start (checked) and `git status` in `/home/user/wt/w2n/kettle` was clean afterwards. Python imaging for my analysis lives in `/tmp/claude-0/ln-pylib`.

## 0. Setup, servers, environment

| Role | URL | Revision | Served build |
|---|---|---|---|
| Control dev | http://127.0.0.1:5310 (`?debug&seed=…&theme=…`) | `90a11e5` | `src/scene/Fallback.tsx` as served has 0 occurrences of `windowLayers` |
| Control preview | http://127.0.0.1:5330 (`?debug…`) | `90a11e5` | `assets/index-DN0z2L-f.js`, `scene-BZdoouTv.js` (8,786 B) |
| Trial dev | http://127.0.0.1:5340 | `2acc218` | served `Fallback.tsx` has 2 occurrences of `windowLayers` |
| Trial preview | http://127.0.0.1:5350 (`?debug…`) | `2acc218` | `assets/index-03-mwJGp.js`, `scene-ByIe2ZIb.js` (33,087 B) |

- **Every pixel run used the production previews :5330 (control) and :5350 (trial).** The dev servers :5310/:5340 were not used for any run (the dev network probe was queued but did not run; see "Not run").
- **Browsers:** every launch went through `slots.py run --lane LN --n 1` (one Chromium per job; max 3 machine-wide; the lane never held more than one job at a time while others waited). Chromium with `--enable-unsafe-swiftshader --use-angle=swiftshader --ignore-gpu-blocklist`.
- **Isolation:** a fresh `newContext` (no stored state) per group of a run, `serviceWorkers:'block'`, `colorScheme`, `timezoneId:'UTC'`, `locale:'en-GB'`. 200 % text = an injected `html{font-size:200%!important}`. Frozen clock `page.clock.install({time: Date.parse('2026-10-11T07:40:00Z')})` then `resume()`; `animations:'disabled'` on every screenshot.
- **Input:** a real tap (`locator.tap()`, touch contexts below 900 px) or click (desktop) starts every brew; real `touchscreen.tap`/`mouse.click` for dismissal and the tap grid; CDP `Input.dispatchTouchEvent` or real `mouse` down/move/up for the Nook drag; real `p.tap` on the Nook tab. The debug API was used only for setup: seed (`?seed=`), `settings.set({scene, muted, autoStartBreaks…})`, `finish()` to end a brew, and the debug URL params `nooktime`/`nookweather`/`nookq` (none used in the main matrix).
- **Machine:** 4 cores, load average 12–14 during the whole session (other lanes). SwiftShader (no GPU). **In this environment the app resolves the live engine to the `low` tier** (`resolveTier`: `softwareGL()` → `low`, `kit.liteify`), whereas the stills and N's layers are `high`-quality renders. This matters for the dark rows of §1.
- **Probes (mine, written in `.tmp/LN/`, copied to `runs/probes-mine/`, sha256 in `runs/probes-mine.sha256`).** I did not run N's probes; the "colour spread of the top fifth" blank metric of §5 is N's idea, re-implemented and calibrated here against the audit's raw frames. **Probe edit history (disclosed):** `backdrop.mjs`/`common.mjs` were patched while the matrix ran: after the first two configs I fixed the layer-file resource regex (production hashes the filenames, so the first config's `items`/`requests` lists are empty by regex, not by fact), then added an `ic` field (still `complete`) to the loading poll, then `--seed/--extra/--nolayers` arguments (unused for the main matrix); `room2.mjs`: tap grid 5×4 → at 390×844 only, 3×2 elsewhere. The pixel data of the main matrix are unaffected by these edits. Final shas: see the sha file. Raw jsonl-equivalents are the per-run `meta.json` / `room2-meta.json` / `log.json` under `runs/`.

Evidence layout under `runs/`: `backdrop/{ctrl,trial,trialHQ-*}/<config>/` (JPEG q74 of every capture: `off`/`live` full page, `-back` backdrop alone as the user sees it, `-raw` backdrop without blur/overlay; `meta.json`), `room2/`, `p375/`, `net/`, `analysis/`, `sheets/`, `probes-mine/`. PNG → JPEG q74 only for size; all analysis ran on the original PNGs.

## 1. Earned items in the backdrop, 3D off

**Setup per run:** `veteran` seed (cozy level 12; "10 of 14 cozy things" on the Nook; earned = pothos, books, cushion, fairyLights, shelf, teaSet, recordPlayer, blanket, painting, lantern; the Focus backdrop drops teaSet; the manifest has layers for 8 items, of which the veteran has 5), `settings.scene='off'`, reload, real tap on "Put the kettle on", capture at 4 s. Live reference: same seed, scene `auto`, real tap, wait for `data-scene-ready=true` + canvas, hold to 4 s after the tap, capture. Default ambient is rain, so the lighting states exercised are **day-rain** (light theme) and **night-rain** (dark theme) only.

### 1a. Control reproduces the defect (this session, before any trial run)
Control :5330, `390x844-light-t100`, 3D off: `[data-scene-mode=window]` has `data-scene-static=true`, base still `window-day-rain`, **0 item layers**. Live 3D of the same run shows the shelf with jars and picture, fairy lights, books and a pencil pot, the hanging pothos and the record player on its stand; the still has none of them (`runs/sheets/ctrl-390x844-light-off-vs-live.jpg`, `raw-390x844-light-ctrl-trial-live.jpg`). On the control at **all 12 configurations** the 3D-off backdrop had 0 layers (table below, column "ctrl"). Pixel level at 390×844 light: on the pixels the earned items change in the live view (16.6 % of the backdrop), the control still is within 40/255 on 11 % of them.

### 1b. Control vs trial at 12 configurations (preview :5330 vs :5350)
**Method (mine):** capture the backdrop host's parent (`.back`) alone with every other element hidden: (i) *as the user sees it* (blur + saturation + quiet overlay), (ii) *raw* (host filter off, overlay hidden). Raw frames from the 3D-off run (control and trial) and the live run are the same size and framing. "Live-changed pixels" = pixels where the live render differs from the control's item-less still by more than 30/255 (max channel): these are the earned items and their light, in place. Reported: mean absolute difference (RGB mean) between the still and the live render over those pixels, the share of them the still reproduces within 40/255, the as-seen mean absolute difference over the whole backdrop, and the best global shift (search ±12 px at half resolution) of the trial still against live. N's method differs (render-level compositing against a fresh engine render); mine compares the page as served.

| Config | lighting | ctrl: layers (still) | trial: layers (still) | live-changed px | mean abs diff vs live, on live-changed px (ctrl → trial) | live-changed px within 40/255 (ctrl → trial) | as-seen backdrop mean abs diff (ctrl → trial) | best global shift trial vs live | CLS off (ctrl / trial) | host rect same off/live |
|---|---|---|---|---|---|---|---|---|---|---|
| 390x844-light-t100 | day-rain | 0 | 5 (pothos, books, fairyLights, shelf, recordPlayer) | 16.6% | 56.9 → 20.0 | 0.11 → 0.75 | 8.9 → 4.2 | (-1, 1) | 0.0000 / 0.0000 | yes |
| 390x844-dark-t100 | night-rain | 0 | 5 (pothos, books, fairyLights, shelf, recordPlayer) | 40.0% | 50.6 → 32.8 | 0.17 → 0.46 | 17.6 → 12.9 | (-1, 1) | 0.0000 / 0.0000 | yes |
| 375x667-light-t100 | day-rain | 0 | 5 (pothos, books, fairyLights, shelf, recordPlayer) | 15.7% | 56.7 → 21.5 | 0.11 → 0.71 | 8.3 → 4.2 | (-1, 0) | 0.0000 / 0.0000 | yes |
| 375x667-dark-t100 | night-rain | 0 | 5 (pothos, books, fairyLights, shelf, recordPlayer) | 37.5% | 49.9 → 37.7 | 0.18 → 0.37 | 16.7 → 13.6 | (-1, 1) | 0.0000 / 0.0000 | yes |
| 844x390-light-t100 | day-rain | 0 | 5 (pothos, books, fairyLights, shelf, recordPlayer) | 14.1% | 58.8 → 20.3 | 0.09 → 0.75 | 8.0 → 4.0 | (0, 0) | 0.0000 / 0.0000 | yes |
| 844x390-dark-t100 | night-rain | 0 | 5 (pothos, books, fairyLights, shelf, recordPlayer) | 35.7% | 50.6 → 38.5 | 0.17 → 0.36 | 16.3 → 13.4 | (-1, 0) | 0.0000 / 0.0000 | yes |
| 1440x900-light-t100 | day-rain | 0 | 5 (pothos, books, fairyLights, shelf, recordPlayer) | 15.7% | 58.8 → 15.0 | 0.10 → 0.83 | 8.9 → 3.7 | (0, 0) | 0.0001 / 0.0000 | yes |
| 1440x900-dark-t100 | night-rain | 0 | 5 (pothos, books, fairyLights, shelf, recordPlayer) | 38.8% | 51.5 → 31.3 | 0.16 → 0.48 | 17.6 → 12.4 | (1, 0) | 0.0001 / 0.0000 | yes |
| 375x667-light-t200 | day-rain | 0 | 5 (pothos, books, fairyLights, shelf, recordPlayer) | 15.7% | 56.7 → 21.5 | 0.11 → 0.71 | 8.3 → 4.2 | (-1, 0) | 0.0000 / 0.0000 | yes |
| 375x667-dark-t200 | night-rain | 0 | 5 (pothos, books, fairyLights, shelf, recordPlayer) | 37.5% | 49.9 → 37.7 | 0.18 → 0.37 | 16.7 → 13.6 | (-1, 1) | 0.0000 / 0.0000 | yes |
| 844x390-light-t200 | day-rain | 0 | 5 (pothos, books, fairyLights, shelf, recordPlayer) | 14.1% | 58.8 → 20.3 | 0.09 → 0.75 | 8.0 → 4.0 | (0, 0) | 0.0000 / 0.0000 | yes |
| 844x390-dark-t200 | night-rain | 0 | 5 (pothos, books, fairyLights, shelf, recordPlayer) | 35.7% | 50.6 → 38.5 | 0.17 → 0.36 | 16.3 → 13.4 | (-1, 0) | 0.0000 / 0.0003 | yes |


Facts from the table and the images:
- **0 → 5 layers at 12/12 configurations**; the same five items at every configuration (pothos, books, fairy lights, shelf, record player). The control has 0 at 12/12. Live 3D from control and trial are pixel-identical (mean abs diff 0.0 at every configuration: the live path is unchanged).
- **Position:** the best global shift of the trial still against live is within 1 px (half-resolution) at every configuration. Per item (raw frames, five earned window items, ±16 px search at full res, e.g. 390×844 light): pothos (−2,+2), books (0,+2), record player (−2,+2), shelf (0,+2) px, fairy lights search hit the window edge (−16) because they span the full width, which makes that estimate unreliable; at 844×390 and 1440×900 pothos, books, shelf and record player are within ±2 px (mostly (0,0)). The pixel-difference images (`runs/sheets/diff-trial-still-vs-live-night-HQ-and-day.jpg`) show only thin contour lines along edges (resolution of a 0.75× WebP layer), the animated rain/snow in the window, the swaying pothos leaves, and a baked **♪ music note** (see below). No item is displaced or missing in the diff.
- **Light rows:** the still reproduces the live view closely (as-seen difference 3.7–4.2 vs 8.0–8.9 on the control; 71–83 % of live-changed pixels within 40/255 vs 9–11 %).
- **Dark rows (night-rain) are weaker against the live render of this environment** (as-seen 12.4–13.6 vs 16.3–17.6 on the control; only 36–48 % of live-changed pixels within 40/255). Cause (measured, not assumed): in this SwiftShader environment the live engine runs at the `low` tier, which draws the night room lit evenly (olive wall panel, no diagonal moon-light shaft, lighter curtains), whereas the committed night still and N's layers are `high`-quality renders (dark panel, light shaft). The **base still alone already differs from the low-tier live** (control column). When the live backdrop is forced to the `high` tier (`?nookq=high`, 390×844 dark, trialHQ run): trial still+layers vs live-HQ: as-seen mean abs diff **3.0** (base still alone 10.2), live-changed pixels within 40/255: **0.89** (base 0.15), layers cover 0.85 of the pixels the items change, 5 % of layer pixels fall outside them (`runs/sheets/raw-390x844-dark-base-vs-HQlive-vs-lowtier-live.jpg`). So the layers match the `high` live render at night; on a software-GL device (live = `low` tier) the hand-over from the drawing to the live room is a visible lighting change at night, with or without the items (pre-existing).
- **Baked animated particle:** the record-player layer carries the ♪ note of the still frame it was rendered from; it sits in the still at a fixed spot right of the window, and the live frame at capture time had none there (diff images; also visible in `full-375x667-light-t200-and-844x390-dark-t200.jpg`, the dark 844×390 trial frame). Small, static, blurred by the backdrop filter.
- **Layers are less sharp than live in the raw frames** (0.75× resolution); under the real backdrop blur (≥ 0.9 px) and overlay this is what the "as-seen" columns measure.
- **Earned but not window-visible items** (cushion, blanket, painting, lantern; teaSet is excluded by design): nothing in the raw live-vs-still differences points to a missing item at the three lighting-independent checks above (no localized residual beyond the five items, animated particles and edges). I did not isolate them one by one in the live engine (see "Not run").
- **CLS 3D-off (brew tap → 4 s):** control / trial equal to 4 decimals at all 12 except 844×390 dark 200 % (0.0000 / 0.0003). The host rectangle is identical between control off, trial off and live at every config (reserved space kept; `rect` in `meta.json`).

**Not covered:** lighting states other than day-rain and night-rain (morning, dusk, snow, clear) in the page; N covers all 12 at render level in the packet, I did not re-measure them (no run: see "Not run / partial").

## 2. Loading (brew 0.2–0.5 s after a cold load)

Cold `goto` (`waitUntil:'commit'`), as soon as `window.__kettle` exists: settings muted, CLS observer, real tap on "Put the kettle on" (0.63–0.75 s after navigation start), then DOM polled every ~60 ms and a CDP screencast recorded (frames with real timestamps). Preview :5330 (control) vs :5350 (trial), light, 100 %, four viewports (dark and 200 % not run for this group).

| Config | label | tap after navigation start (ms) | first DOM poll after the tap | engine canvas mounted (ms after tap) | engine ready, still still mounted (ms) | still unmounted (ms) | CLS (tap → end) | page errors |
|---|---|---|---|---|---|---|---|---|
| 390x844-light-t100 | ctrl | 743 | t=443 ms: still `img` present, **0 layers** | 12489 | 18449 | 20956 | 0.00033 | 0 |
| 390x844-light-t100 | trial | 688 | t=269 ms: still `img` present, **5 layers** | 5595 | 9780 | 12285 | 0.00000 | 0 |
| 375x667-light-t100 | ctrl | 688 | t=364 ms: still `img` present, **0 layers** | 2878 | 4350 | 4851 | 0.00000 | 0 |
| 375x667-light-t100 | trial | 625 | t=251 ms: still `img` present, **5 layers** | 3497 | 5969 | 6504 | 0.00000 | 0 |
| 844x390-light-t100 | ctrl | 643 | t=391 ms: still `img` present, **0 layers** | 6626 | 12170 | 14674 | 0.06445 | 0 |
| 844x390-light-t100 | trial | 723 | t=295 ms: still `img` present, **5 layers** | 7374 | 13444 | 15954 | 0.06450 | 0 |
| 1440x900-light-t100 | ctrl | 679 | t=1007 ms: still `img` present, **0 layers** | 37667 | 70475 | 72981 | 0.00069 | 0 |
| 1440x900-light-t100 | trial | 754 | t=446 ms: still `img` present, **5 layers** | 36349 | 70978 | 73485 | 0.00066 | 0 |

Facts:
- **Layers present before 3D takes over: yes at 4/4 configurations** (trial: 5 layers from the first poll, 0.25–0.45 s after the tap, until the still unmounts). Control: 0 layers throughout.
- **Handover (still → live):** the live canvas mounts under the still, the engine reports ready, and the still is removed 0.5–2.5 s later (same code path as control; timeline in `meta.json`). Backdrop-crop difference between the last still frame and the final live frame (screencast, indicative; frames are sparse under load): 390×844 control 9.2 → trial 5.0; 375×667 control 6.0 → trial 0.3; 844×390 control 3.4 → trial 3.0; 1440×900 not meaningful (the crop is contaminated by the Home → Focus transition over a 70 s load). The final frame step at unmount is a change of 1.6 (390×844 trial) on the same scale.
- **Visible artefact found in the loading sequence (trial only):** on first paint of the Focus screen the item layers can paint **before the base window still has decoded**, so for a short time the items stand over the plain sky gradient with no room behind them (a shelf with jars and books, then fairy lights, pothos, books). Seen in the trial screencast at all four configurations: 390×844 from ≈1.1 s to ≈3.6 s after the tap (≈2.5 s), 375×667 at ≈1.3 s (gone by ≈1.7 s), 844×390 at ≈1.3 s (gone by ≈1.4 s), 1440×900 ≈3.1 s to ≈4.6 s. The control shows the plain sky gradient in the same interval (no items). Cause visible in the DOM: the shelf's four layer files are under Vite's 4 KB inline limit, so they are `data:` URIs in the eager `scene` chunk and paint immediately, while the base still is a hashed file with `decoding="async"`. Frames: `runs/sheets/loading-390x844-light-floating-items-before-still.jpg`, `loading-375x667-light-trial-early-frames.jpg`, `loading-844-1440-trial-early-frames.jpg`. (Duration depends on the environment; the machine ran at load 12–14.)
- **CLS (brew tap → end of handover):** identical control vs trial at 375×667 (0 / 0), 844×390 (0.0645 / 0.0645, the pre-existing shift N also saw) and 1440×900 (0.00069 / 0.00066); 390×844 0.00033 / 0.00000. No layout shift sources inside the scene host in the trial (`clsSources` in `meta.json`).
- 0 page errors in all runs.

{{SECTIONS_3_TO_6}}
