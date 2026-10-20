# RECEIPT-K: capture lane K, W3R3 new 2D Chai masters (raw captures and measurements, no verdicts)

BEFORE = integration `f034205` (dev :5560, preview :5570). AFTER = trial `4e9961f` (dev :5621, preview :5622; worktree `/home/user/wt/w9tr`, integration + C2 `17f5a70`). Playwright 1.56 Chromium; every browser run went through the slot gate (`--lane K --n 1`). Captures were taken on the **dev** servers with `?debug`. Pillow/numpy/scipy in a venv outside the repo. No repo file was changed.

**Stages** (each committed): 1 raw captures, 2 reference + edges + pose-switch + proportions, 3 pixel diff + noise floor + file sizes + hand-back.

**Frozen date (as W3R1/W3R2):** Playwright clock installed at 2026-10-12T07:40Z (Monday), timezone UTC, `setFixedTime` so `Date.now()` is constant (the focus countdown stays 25:00); the `?seed=` profile pins the time of day (veteran 15:30; evening Home = +3.5 h = 19:00). Screenshots: `animations: disabled`, fonts ready, full page, DPR 1. Dark/light by `?theme=`, reduced motion by `?motion=reduce` plus media emulation, 200 % text by `html{font-size:200%!important}` (the a11y-audit approach). Welcome notify: `Notification.permission` forced to `granted` (headless Chromium reports denied, and Chai is the vector idle pose then).

## Stage 1: BEFORE/AFTER capture matrix

13 states per config, file name = state:

| state file | what | pose |
|---|---|---|
| `kit-chai` | Kit gallery `#/kit?part=art&view=chai` (all three) | reading, sipping, cheering |
| `settings` | Settings; About card is the foot of a tall page | sipping |
| `home-evening` | veteran at 19:00, Home hero | sipping |
| `focus-running` | Focus stage, brew running | reading |
| `home-live` | Home hero while a brew runs | reading |
| `focus-paused` | Focus stage, paused | reading |
| `whistle` | the whistle (hop) | cheering |
| `summary` | summary | cheering |
| `focus-break` | tea break on the Stage | sipping |
| `home-break` | Home hero in the break | sipping |
| `welcome-sound` | Welcome, sound step | sipping |
| `welcome-notify` | Welcome, notify step (granted) | cheering |
| `welcome-ready` | Welcome, ready step | cheering |

Per-capture Chai `<img>` box and pose: `shots/<side>/states.log.txt` (identical lines before and after for every capture: the layout footprint is unchanged).

| config dir (`shots/<side>/<dir>/`) | BEFORE PNGs | AFTER PNGs |
|---|---|---|
| `1440x900-dark` | 13 | 13 |
| `1440x900-light` | 13 | 13 |
| `375x667-dark` | 13 | 13 |
| `375x667-light` | 13 | 13 |
| `390x844-dark` | 13 | 13 |
| `390x844-dark-t200` | 13 | 13 |
| `390x844-light` | 13 | 13 |
| `390x844-light-rm` | 13 | 13 |
| `390x844-light-t200` | 13 | 13 |
| **total** | **117** | **117** |

`-t200` = 200 % text (390x844 light and dark, all 13 states), `-rm` = reduced motion (390x844 light, all 13 states). So every pose has a 200 % text and a reduced-motion capture (more than the "at least one of each" asked).

Re-capture note: the animated flow states (`focus-running`, `home-live`, `focus-paused`, `focus-break`, `home-break`) were first taken in parallel runs; under that load the Stage scene and tab bar were caught mid-entrance, so these five were re-taken strictly serially, BEFORE then AFTER per config, with 3x the settle time (`scripts/run-states3.sh`). The PNGs in `shots/` are those final ones.

Scripts (`scripts/`): `lib.mjs`, `states.mjs` (matrix), `run-states.sh`, `run-states3.sh`.

## Stage 2

### 1. REFERENCE (the masters, and each master at its on-screen size)

- `reference/master-chai-{reading,sipping,cheering}.png`: Vibei's masters, byte for byte copies of `kettle/art-src/chai/2d-v2/` (992x1586, RGB, cream ground with a ground shadow).
- `reference/compare-<place>-<pose>-x<1|2>.png` (12 sheets): place = Stage at 390x844 or 1440x900 (the on-screen `<img>` box measured on :5621), x1 = DPR 1, x2 = DPR 2 (the plate is drawn at 2x). Top row on cream (#FFF9F0): **MASTER** (downscaled with Lanczos, **uniformly**, so its ink height equals the AFTER ink height on screen, and its ink bottom sits on the AFTER baseline), **BEFORE** file, **AFTER** file (both stretched to the real box as the page does). Bottom row on dark #221829: BEFORE and AFTER (the master has no alpha).
- Master ink (my own segmentation, `scripts/master_ink.py`: flood-fill of the cream/shadow line from the border; overlay images checked by eye): reading 889 x 1393 px (aspect 0.63819), sipping 879 x 1425 (0.61684), cheering 948 x 1359 (0.69757). `json/master-ink.json`.

### 3. Edge close-ups (DPR 2, 4x nearest-neighbour) and halo numbers

Method (`scripts/edges.mjs`, `scripts/edge_post.py`): for each pose a DPR 2 clip around Chai's `<img>` with the image shown (A) and with it hidden (B; a second hidden shot B2 and a second shown shot A2 mark the pixels the scene animates by itself, which are excluded). Solid ink = pixels where |A-B| > 40; **anti-aliased fringe** = 4 < |A-B| <= 40; **edge pixels just outside the ink** = the 1 to 3 device px ring beyond the solid ink. Reported: the mean colour of those ring pixels in A, the mean colour of the same pixels in B (what is underneath), the luma difference, the share that is cream-coloured (R>=200, G>=190, B>=165) and lighter than the background by >25, and the share lighter than the background by >10. "Outside any ink" = 1 to 3 px beyond every changed pixel: the largest |A-B| there (4 is the floor of the test, i.e. nothing there).

Surfaces: **kit** = the Kit gallery at size 240 on its flat page (`#/kit?part=art&view=chai&size=240`, the cleanest background); **stage** = the real Focus stage (reading: running, cheering: summary, sipping: tea break). Dark theme at 1440x900 for both surfaces and at 390x844 for the stage; light theme once (1440x900, both surfaces). Sheets: `edges/edge-<surface>-<cfg>-<theme>-<pose>.png`, rows BEFORE/AFTER, columns top / feet / left / right extreme of the solid ink, 64 device px per window at 4x (each window is labelled with its device-px origin).

| surface | cfg | theme | pose | side | AA-fringe px | edge pixels just outside the solid ink: mean RGB (page/scene RGB under them) | mean luma vs bg | share cream-coloured and lighter than bg | share lighter than bg by >10 | max diff to bg 1-3 px beyond any ink |
|---|---|---|---|---|---|---|---|---|---|---|
| kit | 1440x900 | dark | reading | before | 4031 | (54, 39, 49) ((46, 35, 57)) | +4.1 | 0.00 % | 16.6 % | 4 |
| kit | 1440x900 | dark | reading | after | 1151 | (50, 37, 53) ((46, 35, 57)) | +1.9 | 0.00 % | 10.3 % | 4 |
| kit | 1440x900 | dark | sipping | before | 3988 | (54, 39, 50) ((46, 35, 57)) | +3.8 | 0.00 % | 14.9 % | 4 |
| kit | 1440x900 | dark | sipping | after | 978 | (50, 37, 56) ((46, 35, 57)) | +2.5 | 0.00 % | 9.6 % | 4 |
| kit | 1440x900 | dark | cheering | before | 3587 | (54, 39, 52) ((46, 35, 57)) | +4.3 | 0.00 % | 18.8 % | 4 |
| kit | 1440x900 | dark | cheering | after | 2468 | (50, 37, 51) ((46, 35, 57)) | +1.7 | 0.00 % | 10.3 % | 4 |
| stage | 1440x900 | dark | reading | before | 27511 | (128, 89, 61) ((113, 79, 65)) | +10.2 | 0.00 % | 46.4 % | 4 |
| stage | 1440x900 | dark | reading | after | 23062 | (122, 80, 52) ((109, 76, 63)) | +5.3 | 0.00 % | 32.5 % | 4 |
| stage | 1440x900 | dark | sipping | before | 28354 | (126, 87, 59) ((111, 78, 64)) | +8.9 | 0.00 % | 45.9 % | 4 |
| stage | 1440x900 | dark | sipping | after | 21619 | (121, 79, 51) ((109, 77, 62)) | +3.1 | 0.00 % | 24.6 % | 4 |
| stage | 1440x900 | dark | cheering | before | 29195 | (123, 85, 59) ((110, 78, 64)) | +7.6 | 0.00 % | 43.3 % | 68 |
| stage | 1440x900 | dark | cheering | after | 26900 | (123, 82, 55) ((111, 78, 64)) | +4.6 | 0.00 % | 30.8 % | 4 |
| stage | 390x844 | dark | reading | before | 7304 | (116, 80, 58) ((103, 71, 60)) | +9.1 | 0.00 % | 40.2 % | 4 |
| stage | 390x844 | dark | reading | after | 6652 | (107, 72, 49) ((95, 67, 56)) | +5.5 | 0.00 % | 31.7 % | 4 |
| stage | 390x844 | dark | sipping | before | 7042 | (114, 78, 55) ((100, 70, 57)) | +8.4 | 0.00 % | 40.0 % | 4 |
| stage | 390x844 | dark | sipping | after | 5784 | (105, 68, 47) ((96, 67, 55)) | +1.9 | 0.00 % | 18.5 % | 4 |
| stage | 390x844 | dark | cheering | before | 6334 | (111, 76, 54) ((100, 68, 54)) | +7.9 | 0.00 % | 37.8 % | 4 |
| stage | 390x844 | dark | cheering | after | 6485 | (110, 74, 52) ((98, 68, 53)) | +6.6 | 0.00 % | 32.4 % | 4 |
| kit | 1440x900 | light | reading | before | 1849 | (252, 249, 242) ((255, 253, 250)) | -4.1 | 0.00 % | 0.0 % | 4 |
| kit | 1440x900 | light | reading | after | 2189 | (253, 250, 242) ((255, 253, 250)) | -3.6 | 0.00 % | 0.0 % | 4 |
| kit | 1440x900 | light | sipping | before | 2260 | (252, 247, 241) ((255, 253, 250)) | -5.6 | 0.00 % | 0.0 % | 4 |
| kit | 1440x900 | light | sipping | after | 2148 | (253, 249, 244) ((255, 253, 250)) | -3.6 | 0.00 % | 0.0 % | 4 |
| kit | 1440x900 | light | cheering | before | 1329 | (253, 250, 244) ((255, 253, 250)) | -3.2 | 0.00 % | 0.0 % | 4 |
| kit | 1440x900 | light | cheering | after | 781 | (253, 250, 246) ((255, 253, 250)) | -2.5 | 0.00 % | 0.0 % | 4 |
| stage | 1440x900 | light | reading | before | 22252 | (178, 148, 105) ((182, 159, 115)) | -9.9 | 0.17 % | 9.1 % | 4 |
| stage | 1440x900 | light | reading | after | 18988 | (178, 144, 101) ((185, 157, 112)) | -11.6 | 0.00 % | 4.9 % | 4 |
| stage | 1440x900 | light | sipping | before | 21037 | (173, 141, 98) ((177, 154, 110)) | -10.5 | 0.05 % | 8.1 % | 4 |
| stage | 1440x900 | light | sipping | after | 17121 | (179, 141, 98) ((183, 154, 110)) | -10.7 | 0.28 % | 4.9 % | 4 |
| stage | 1440x900 | light | cheering | before | 19024 | (172, 141, 99) ((178, 152, 110)) | -10.1 | 0.00 % | 7.6 % | 4 |
| stage | 1440x900 | light | cheering | after | 17286 | (174, 139, 98) ((180, 152, 110)) | -11.7 | 0.00 % | 3.3 % | 4 |

Full table incl. 390x844 stage: `json/edge-halo-table.md`, raw numbers `json/edge-halo.json`. Read-out: on the dark theme the share of ring pixels that are cream-coloured and lighter than the background is 0.00 % in every BEFORE and AFTER row, on both surfaces; on the flat dark page the ring is a warm brown blend (about RGB 50,37,53 over the page's 46,35,57; BEFORE about 54,39,50); beyond the ink nothing differs from the background (max diff 4/255 = the floor). The light-theme rows show the ring slightly darker than the page (-2 to -4 luma), no light halo. The Kit gallery BEFORE leaf tip carries one bright speck (visible in `edges/edge-kit-1440x900-dark-cheering.png`, BEFORE top); AFTER has none.

### 4. Pose-switch sequence (the real flow, both servers)

Flow driven on the Stage (`scripts/poseswitch.mjs`): Focus running (reading) -> `__kettle.finish()` = whistle (cheering) -> summary (cheering) -> "Tea time" = tea break (sipping) -> "Next brew" = Focus running (reading). The timer is shortened with the debug API (`finish()`); the veteran seed at 15:30. At each step: the Chai `<img>` box (`getBoundingClientRect`), the **ink box from the decoded alpha (> 8) mapped through that box** (the number to use), and a cross-check from a screenshot diff (image shown vs hidden). Configs: 390x844 and 1440x900 x light and dark, each at DPR 1 (frames), DPR 1 with reduced motion (clean swap, no hop) and DPR 2; plus a per-frame `requestAnimationFrame` trace of the Chai `<img>` over the whole flow (1.3 to 4.7 k frames per run). BEFORE and AFTER are driven identically.

Strips (BEFORE row above AFTER row, the same crop, 1:1 pixels, DPR 1, normal motion): `strips/strip-390x844-{light,dark}.png`, `strips/strip-1440x900-{light,dark}.png`.

How to read it: the box of a pose is `PAINTED[pose] * size / 500` in both versions, so the box changes between poses (e.g. 390: reading 112.8x176.6, cheering 113.2x155.2, sipping 109.5x178.1), and it does so identically BEFORE and AFTER. What matters is that the **feet (ink bottom) and the ink centre do not move** and that AFTER's steps equal BEFORE's.

Full per-step tables for all 12 config runs (box, ink, centre, baseline, deltas, whether the screenshot cross-check agrees): `json/poseswitch-tables.md`; raw: `json/ps/*.json.gz`; summary json `json/poseswitch-summary.json`. Reduced-motion runs (clean), DPR 1:

**390x844 light, reduced motion, DPR 1** (img box and ink in CSS px; ink = decoded alpha > 8 mapped through the real box; baseline = ink bottom y)

| step | pose | side | img box w x h | ink w x h | ink centre x | baseline y | step delta: box w, box h, ink w, ink h, ink cx, baseline |
|---|---|---|---|---|---|---|---|
| 1 Focus running | reading | before | 112.8 x 176.62 | 109.17 x 173.72 | 292.49 | 369.74 | - |
| 1 Focus running | reading | after | 112.8 x 176.62 | 109.03 x 173.72 | 292.35 | 369.74 | - |
| 2 Whistle | cheering | before | 113.16 x 155.23 | 110.25 x 151.97 | 292.48 | 369.75 | +0.36, -21.39, +1.08, -21.75, -0.01, +0.01 |
| 2 Whistle | cheering | after | 113.16 x 155.23 | 110.25 x 152.04 | 292.48 | 369.75 | +0.36, -21.39, +1.22, -21.68, +0.13, +0.01 |
| 3 Summary | cheering | before | 113.16 x 155.23 | 110.25 x 151.97 | 292.48 | 369.75 | +0.00, +0.00, +0.00, +0.00, +0.00, +0.00 |
| 3 Summary | cheering | after | 113.16 x 155.23 | 110.25 x 152.04 | 292.48 | 369.75 | +0.00, +0.00, +0.00, +0.00, +0.00, +0.00 |
| 4 Tea break | sipping | before | 109.53 x 178.08 | 106.63 x 174.81 | 292.48 | 369.74 | -3.63, +22.85, -3.62, +22.84, +0.00, -0.01 |
| 4 Tea break | sipping | after | 109.53 x 178.08 | 106.34 x 174.89 | 292.34 | 369.74 | -3.63, +22.85, -3.91, +22.85, -0.14, -0.01 |
| 5 Next brew | reading | before | 112.8 x 176.62 | 109.17 x 173.72 | 292.49 | 369.74 | +3.27, -1.46, +2.54, -1.09, +0.01, +0.00 |
| 5 Next brew | reading | after | 112.8 x 176.62 | 109.03 x 173.72 | 292.35 | 369.74 | +3.27, -1.46, +2.69, -1.17, +0.01, +0.00 |

**390x844 dark, reduced motion, DPR 1** (img box and ink in CSS px; ink = decoded alpha > 8 mapped through the real box; baseline = ink bottom y)

| step | pose | side | img box w x h | ink w x h | ink centre x | baseline y | step delta: box w, box h, ink w, ink h, ink cx, baseline |
|---|---|---|---|---|---|---|---|
| 1 Focus running | reading | before | 112.8 x 176.62 | 109.17 x 173.72 | 292.49 | 369.74 | - |
| 1 Focus running | reading | after | 112.8 x 176.62 | 109.03 x 173.72 | 292.35 | 369.74 | - |
| 2 Whistle | cheering | before | 113.16 x 155.23 | 110.25 x 151.97 | 292.48 | 369.75 | +0.36, -21.39, +1.08, -21.75, -0.01, +0.01 |
| 2 Whistle | cheering | after | 113.16 x 155.23 | 110.25 x 152.04 | 292.48 | 369.75 | +0.36, -21.39, +1.22, -21.68, +0.13, +0.01 |
| 3 Summary | cheering | before | 113.16 x 155.23 | 110.25 x 151.97 | 292.48 | 369.75 | +0.00, +0.00, +0.00, +0.00, +0.00, +0.00 |
| 3 Summary | cheering | after | 113.16 x 155.23 | 110.25 x 152.04 | 292.48 | 369.75 | +0.00, +0.00, +0.00, +0.00, +0.00, +0.00 |
| 4 Tea break | sipping | before | 109.53 x 178.08 | 106.63 x 174.81 | 292.48 | 369.74 | -3.63, +22.85, -3.62, +22.84, +0.00, -0.01 |
| 4 Tea break | sipping | after | 109.53 x 178.08 | 106.34 x 174.89 | 292.34 | 369.74 | -3.63, +22.85, -3.91, +22.85, -0.14, -0.01 |
| 5 Next brew | reading | before | 112.8 x 176.62 | 109.17 x 173.72 | 292.49 | 369.74 | +3.27, -1.46, +2.54, -1.09, +0.01, +0.00 |
| 5 Next brew | reading | after | 112.8 x 176.62 | 109.03 x 173.72 | 292.35 | 369.74 | +3.27, -1.46, +2.69, -1.17, +0.01, +0.00 |

**1440x900 light, reduced motion, DPR 1** (img box and ink in CSS px; ink = decoded alpha > 8 mapped through the real box; baseline = ink bottom y)

| step | pose | side | img box w x h | ink w x h | ink centre x | baseline y | step delta: box w, box h, ink w, ink h, ink cx, baseline |
|---|---|---|---|---|---|---|---|
| 1 Focus running | reading | before | 185.09 x 289.86 | 179.14 x 285.1 | 607.19 | 790.24 | - |
| 1 Focus running | reading | after | 185.09 x 289.86 | 178.91 x 285.1 | 606.95 | 790.25 | - |
| 2 Whistle | cheering | before | 185.69 x 254.73 | 180.93 x 249.38 | 607.19 | 790.24 | +0.60, -35.13, +1.79, -35.72, +0.00, +0.00 |
| 2 Whistle | cheering | after | 185.69 x 254.73 | 180.93 x 249.5 | 607.19 | 790.24 | +0.60, -35.13, +2.02, -35.60, +0.24, -0.01 |
| 3 Summary | cheering | before | 185.69 x 254.73 | 180.93 x 249.38 | 607.19 | 790.24 | +0.00, +0.00, +0.00, +0.00, +0.00, +0.00 |
| 3 Summary | cheering | after | 185.69 x 254.73 | 180.93 x 249.5 | 607.19 | 790.24 | +0.00, +0.00, +0.00, +0.00, +0.00, +0.00 |
| 4 Tea break | sipping | before | 179.75 x 292.23 | 174.99 x 286.88 | 607.19 | 790.24 | -5.94, +37.50, -5.94, +37.50, +0.00, +0.00 |
| 4 Tea break | sipping | after | 179.75 x 292.23 | 174.52 x 287.0 | 606.95 | 790.25 | -5.94, +37.50, -6.41, +37.50, -0.24, +0.01 |
| 5 Next brew | reading | before | 185.09 x 289.86 | 179.14 x 285.1 | 607.19 | 790.24 | +5.34, -2.37, +4.15, -1.78, +0.00, +0.00 |
| 5 Next brew | reading | after | 185.09 x 289.86 | 178.91 x 285.1 | 606.95 | 790.25 | +5.34, -2.37, +4.39, -1.90, +0.00, +0.00 |

**1440x900 dark, reduced motion, DPR 1** (img box and ink in CSS px; ink = decoded alpha > 8 mapped through the real box; baseline = ink bottom y)

| step | pose | side | img box w x h | ink w x h | ink centre x | baseline y | step delta: box w, box h, ink w, ink h, ink cx, baseline |
|---|---|---|---|---|---|---|---|
| 1 Focus running | reading | before | 185.09 x 289.86 | 179.14 x 285.1 | 607.19 | 790.24 | - |
| 1 Focus running | reading | after | 185.09 x 289.86 | 178.91 x 285.1 | 606.95 | 790.25 | - |
| 2 Whistle | cheering | before | 185.69 x 254.73 | 180.93 x 249.38 | 607.19 | 790.24 | +0.60, -35.13, +1.79, -35.72, +0.00, +0.00 |
| 2 Whistle | cheering | after | 185.69 x 254.73 | 180.93 x 249.5 | 607.19 | 790.24 | +0.60, -35.13, +2.02, -35.60, +0.24, -0.01 |
| 3 Summary | cheering | before | 185.69 x 254.73 | 180.93 x 249.38 | 607.19 | 790.24 | +0.00, +0.00, +0.00, +0.00, +0.00, +0.00 |
| 3 Summary | cheering | after | 185.69 x 254.73 | 180.93 x 249.5 | 607.19 | 790.24 | +0.00, +0.00, +0.00, +0.00, +0.00, +0.00 |
| 4 Tea break | sipping | before | 179.75 x 292.23 | 174.99 x 286.88 | 607.19 | 790.24 | -5.94, +37.50, -5.94, +37.50, +0.00, +0.00 |
| 4 Tea break | sipping | after | 179.75 x 292.23 | 174.52 x 287.0 | 606.95 | 790.25 | -5.94, +37.50, -6.41, +37.50, -0.24, +0.01 |
| 5 Next brew | reading | before | 185.09 x 289.86 | 179.14 x 285.1 | 607.19 | 790.24 | +5.34, -2.37, +4.15, -1.78, +0.00, +0.00 |
| 5 Next brew | reading | after | 185.09 x 289.86 | 178.91 x 285.1 | 606.95 | 790.25 | +5.34, -2.37, +4.39, -1.90, +0.00, +0.00 |

**Per-frame (requestAnimationFrame) trace of the whole flow: largest single-frame change of the Chai `<img>` (CSS px)**

| config | motion | DPR | side | frames | max |d width| | max |d height| | max |d centre x| | max |d bottom (baseline)| |
|---|---|---|---|---|---|---|---|---|
| 1440x900 dark | full | 1 | before | 2732 | 6.06 | 37.50 | 0.00 | 10.00 |
| 1440x900 dark | full | 1 | after | 2939 | 5.94 | 37.50 | 0.00 | 3.61 |
| 1440x900 dark | reduce | 1 | before | 1758 | 5.94 | 37.50 | 0.00 | 0.00 |
| 1440x900 dark | reduce | 1 | after | 1613 | 5.94 | 37.50 | 0.00 | 0.00 |
| 1440x900 dark | full | 2 | before | 3489 | 6.06 | 37.50 | 0.00 | 13.44 |
| 1440x900 dark | full | 2 | after | 3506 | 8.45 | 37.50 | 0.00 | 14.32 |
| 1440x900 light | full | 1 | before | 2962 | 5.94 | 37.50 | 0.00 | 12.43 |
| 1440x900 light | full | 1 | after | 4681 | 6.38 | 37.50 | 0.00 | 6.56 |
| 1440x900 light | reduce | 1 | before | 1522 | 5.94 | 37.50 | 0.00 | 0.00 |
| 1440x900 light | reduce | 1 | after | 2697 | 5.94 | 37.50 | 0.00 | 0.00 |
| 1440x900 light | full | 2 | before | 4419 | 5.94 | 37.50 | 0.00 | 12.77 |
| 1440x900 light | full | 2 | after | 6631 | 5.94 | 37.50 | 0.00 | 4.15 |
| 390x844 dark | full | 1 | before | 2315 | 3.62 | 22.84 | 0.01 | 5.83 |
| 390x844 dark | full | 1 | after | 2163 | 3.62 | 22.84 | 0.01 | 4.92 |
| 390x844 dark | reduce | 1 | before | 1336 | 3.62 | 22.84 | 0.01 | 0.02 |
| 390x844 dark | reduce | 1 | after | 1227 | 3.62 | 22.84 | 0.01 | 0.02 |
| 390x844 dark | full | 2 | before | 2389 | 4.49 | 22.84 | 0.01 | 9.58 |
| 390x844 dark | full | 2 | after | 1988 | 3.89 | 22.84 | 0.01 | 4.23 |
| 390x844 light | full | 1 | before | 2098 | 3.62 | 22.84 | 0.01 | 4.29 |
| 390x844 light | full | 1 | after | 2324 | 3.69 | 22.84 | 0.01 | 2.44 |
| 390x844 light | reduce | 1 | before | 1168 | 3.62 | 22.84 | 0.01 | 0.02 |
| 390x844 light | reduce | 1 | after | 1234 | 3.62 | 22.84 | 0.01 | 0.02 |
| 390x844 light | full | 2 | before | 2065 | 3.69 | 22.84 | 0.01 | 9.98 |
| 390x844 light | full | 2 | after | 2249 | 4.49 | 22.84 | 0.01 | 2.22 |

Notes: (a) in normal motion the **whistle** step is the hop (a transform animation on the figure, by design and the same BEFORE and AFTER), so its box depends on the instant of the sample: step 2 in the `full` runs, and sometimes step 1 (an arrival bob in the first seconds) are mid-animation; the settled values are steps 3 to 5 and every step of the reduced-motion runs. In the steady steps of every normal-motion run the baseline is 369.74/369.75 (390) and 790.24/790.25 (1440) in both versions. (b) The screenshot-diff cross-check agrees with the alpha-mapped ink within 1 px in 96 of the step rows; it disagrees on step 1 (8 rows: the figure is still arriving 1.5 s after the click) and on the whistle (15 rows: mid hop) and once on step 5; those rows are flagged `NO` in the tables. (c) rAF trace: in the reduced-motion runs the baseline and centre never move in either version (max single-frame |d baseline| and |d centre x| are 0.00); the largest single-frame change is the box height at the swap from cheering to sipping (390: 22.84, 1440: 37.5 CSS px), the same BEFORE and AFTER; the ink bottom stays put because the box is bottom-aligned.

### 5. Proportions: AFTER on-screen ink aspect vs the master

Aspect = ink width / ink height. Width-vs-height change = (AFTER aspect / master aspect - 1). Methods: "stage: decoded alpha" = the shipped file's alpha > 8 box mapped through the real `<img>` box at DPR 2 (exact for what is drawn; steady steps of the stage runs, 4 configs); "kit: screenshot diff" and "stage: screenshot diff" = measured from pixels at DPR 2 with a 16/255 threshold (quantised to 0.5 px, so +-0.2 to 1 point). The BEFORE rows are the **old** art against the new master and only show how different the old proportions were; they are not a stretch figure.

| pose | side | method | n | mean aspect w/h | min..max % | mean width-vs-height vs master |
|---|---|---|---|---|---|---|
| reading | before | stage: decoded alpha through the box | 4 | 0.6284 | -1.54..-1.53 | **-1.54 %** |
| reading | before | kit: screenshot diff (flat page) | 2 | 0.6360 | -0.35..-0.35 | **-0.35 %** |
| reading | before | stage: screenshot diff | 3 | 0.6313 | -1.62..-0.70 | **-1.08 %** |
| reading | after | stage: decoded alpha through the box | 4 | 0.6276 | -1.67..-1.66 | **-1.67 %** |
| reading | after | kit: screenshot diff (flat page) | 2 | 0.6332 | -0.78..-0.78 | **-0.78 %** |
| reading | after | stage: screenshot diff | 3 | 0.6279 | -1.86..-1.27 | **-1.61 %** |
| sipping | before | stage: decoded alpha through the box | 4 | 0.6100 | -1.11..-1.11 | **-1.11 %** |
| sipping | before | kit: screenshot diff (flat page) | 2 | 0.6052 | -1.89..-1.89 | **-1.89 %** |
| sipping | before | stage: screenshot diff | 3 | 0.6055 | -2.45..-1.37 | **-1.84 %** |
| sipping | after | stage: decoded alpha through the box | 4 | 0.6081 | -1.43..-1.42 | **-1.42 %** |
| sipping | after | kit: screenshot diff (flat page) | 2 | 0.6056 | -1.89..-1.75 | **-1.82 %** |
| sipping | after | stage: screenshot diff | 3 | 0.6059 | -2.27..-1.43 | **-1.77 %** |
| cheering | before | stage: decoded alpha through the box | 4 | 0.7255 | +4.00..+4.01 | **+4.00 %** |
| cheering | before | kit: screenshot diff (flat page) | 2 | 0.7291 | +4.39..+4.65 | **+4.52 %** |
| cheering | before | stage: screenshot diff | 3 | 0.7211 | +1.58..+4.63 | **+3.38 %** |
| cheering | after | stage: decoded alpha through the box | 4 | 0.7252 | +3.95..+3.96 | **+3.96 %** |
| cheering | after | kit: screenshot diff (flat page) | 2 | 0.7273 | +4.13..+4.39 | **+4.26 %** |
| cheering | after | stage: screenshot diff | 3 | 0.7185 | +1.39..+4.00 | **+3.01 %** |

Master ink aspect (own segmentation): reading 0.63819 (889x1393 px), sipping 0.61684 (879x1425 px), cheering 0.69757 (948x1359 px)

File level (alpha > 8 box of the shipped WebP, before any DOM stretch): AFTER reading 376 x 599 in a 389 x 609 file (aspect 0.62771, **-1.64 %** vs the master), sipping 367 x 603 in 378 x 614 (0.60862, **-1.33 %**), cheering 380 x 524 in 390 x 535 (0.72519, **+3.96 %**). `json/shipped-file-ink.json`. The file aspect (e.g. 389/609 = 0.6388) equals the `PAINTED` box aspect (311/487 = 0.6386) to 0.03 %, so the DOM adds no further stretch.

Measured independently: **reading -1.6 to -1.7 %, sipping -1.3 to -1.4 %, cheering +4.0 %** (width relative to height). The maker states -1.5 / -1.2 / +3.9 %; the difference of about 0.1 to 0.2 points is my master-ink segmentation (it includes slightly more anti-aliased edge).

### 6. File sizes and PWA precache

| file | BEFORE :5570 (bytes) | AFTER :5622 (bytes) | change | dimensions before -> after |
|---|---|---|---|---|
| chai-reading.webp | 20,900 | 19,084 | -1,816 | 311x487 -> 389x609 |
| chai-sipping.webp | 19,950 | 19,144 | -806 | 302x491 -> 378x614 |
| chai-cheering.webp | 20,626 | 19,782 | -844 | 312x428 -> 390x535 |
| **total** | **61,476** | **58,010** | **-3,466 (-5.6 %)** | |

Served files fetched by their hashed URLs (`assets-served/{before,after}-chai-*.webp`, `content-type: image/webp`, `cache-control: no-cache`); the AFTER files are byte-identical (md5) to `src/art/chai/*.webp` in the trial worktree, the BEFORE sizes equal `git show f034205:...`. Precache: both previews' `sw.js` list **119 entries**; the three chai WebPs are in it as hashed URLs with `revision: null` (before `chai-reading-BrtgDZfI`, `chai-sipping-DTyMuyps`, `chai-cheering-CK8xIJCH`; after `chai-reading-B1vNQyTr`, `chai-sipping-DCqv63U-`, `chai-cheering-D9IFTGSg`). Live check (`scripts/pwa-cache.mjs`, `json/pwa-cache.json`): service worker `activated` on both, and Cache Storage `workbox-precache-v2` holds the three files at the exact byte sizes above on each.

Scripts for stage 2: `edges.mjs`, `edge_post.py`, `run-edges.sh`, `run-edges-stage.sh`, `poseswitch.mjs`, `ps_post.py`, `run-ps.sh`, `master_ink.py`, `ref_post.py`, `prop_post.py`, `pwa-cache.mjs`.
