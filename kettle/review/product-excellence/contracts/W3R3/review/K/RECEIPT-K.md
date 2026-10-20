# RECEIPT-K: capture lane K, W3R3 new 2D Chai masters (raw captures and measurements, no verdicts)

**Space note: to keep the folder near 60 MB the AFTER-r1 PNGs (`shots/after/`, 117 files) were removed from the working tree after AFTER-r2 was captured; they are in git commit `613c43d` (path `kettle/review/product-excellence/contracts/W3R3/review/K/shots/after/`). Their measurements, strips, edge sheets and diff json stay in place. The AFTER-r2 PNGs are in `rerun-r2/shots/after/`.**

**Label: every AFTER in this receipt is `AFTER-r1` = the first trial (:5621, `4e9961f`), which LEAD-7 has since rejected (non-uniform stretch). REFERENCE and BEFORE stay valid. The re-run on the fix trial is `scripts/rerun-after.sh <port> <label>` (see "Re-run entry point" at the end).**

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

Notes: (a) in normal motion the **whistle** step is the hop (a transform animation on the figure, by design and the same BEFORE and AFTER), so its box depends on the instant of the sample: step 2 in the `full` runs, and sometimes step 1 (an arrival bob in the first seconds) are mid-animation; the settled values are steps 3 to 5 and every step of the reduced-motion runs. In the steady steps of every normal-motion run the baseline is 369.74/369.75 (390) and 790.24/790.25 (1440) in both versions. (b) The screenshot-diff cross-check agrees with the alpha-mapped ink within 1 px in 96 of the step rows; it disagrees on step 1 (8 rows: the figure is still arriving 1.5 s after the click) and on the whistle (15 rows: mid hop) and once on step 5; those rows are flagged `NO` in the tables. (c) rAF trace: in the reduced-motion runs the baseline and centre never move in either version (max single-frame |d baseline| and |d centre x| are 0.00 at 1440x900 and at most 0.02 at 390x844); the largest single-frame change is the box height at the swap from cheering to sipping (390: 22.84, 1440: 37.5 CSS px), the same BEFORE and AFTER; the ink bottom stays put because the box is bottom-aligned.

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

## Stage 3

### 2b. Pixel diff BEFORE vs AFTER-r1 and the noise floor

Method (`scripts/pixdiff2.py`, `json/pixdiff2.json`): for each of the 117 pairs, compare full-page PNGs (common top-left area; page heights can differ by a few px between runs). A pixel "differs" when max channel difference > 8/255. **Inside** = the union of the BEFORE and AFTER `<img>` boxes (from `states.log.txt`) + 16 px; **outside** = everything else (for the three Welcome states the whole prompt-row column of the mascot, y < 260, counts as inside, because the Welcome mascot is animated and its logged box is from another instant). **Noise floor:** BEFORE was recaptured once for a subset (`before2`: 390x844 light, dark, t200 light and dark, rm; 1440x900 light and dark; 375x667 light and dark) and AFTER-r1 was recaptured once as well (`after2`/`before3`/`after3` for the animated flow states, taken in the final serial, 3x-settle condition). A BEFORE/AFTER outside difference counts as "within noise" when it lies where BEFORE-vs-recapture (or AFTER-vs-recapture) also differs (dilated 10 px). 102 of 117 pairs have such a noise pair; 15 do not (flagged below).

Verdict per pair (I = identical outside Chai's box: 0 differing pixels > 0/255; N = within noise: outside diffs <= 8/255, or coincide with the recapture noise; D* = outside diff not covered by a noise pair, explained below):

| config | kit-chai | settings | home-evening | focus-running | home-live | focus-paused | whistle | summary | focus-break | home-break | welcome-sound | welcome-notify | welcome-ready |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `1440x900-dark` | I | N | I | I | I | I | N | I | I | N | I | I | I |
| `1440x900-light` | I | I | I | N | I | I | N | I | I | N | I | I | I |
| `375x667-dark` | I | I | N | N | I | I | I | I | D* | D* | I | I | I |
| `375x667-light` | I | I | I | N | I | I | I | I | I | I | I | I | I |
| `390x844-dark` | I | I | N | I | I | I | N | I | I | D* | I | I | I |
| `390x844-dark-t200` | I | I | I | D* | I | I | I | I | I | I | I | I | I |
| `390x844-light` | I | I | I | N | I | I | N | I | I | N | I | I | I |
| `390x844-light-rm` | I | I | I | I | I | N | N | I | I | I | I | I | I |
| `390x844-light-t200` | I | I | I | I | N | N | N | I | I | D* | I | N | N |

**Totals: 91 identical, 21 within noise, 5 D\*.** Inside Chai's box the pair differs (> 8/255) in 115 of 117 captures (expected); the two exceptions are `390x844-{light,dark}-t200 home-evening`, where Chai is not visible in the capture at all (at 200 % text the Home hero's Chai sits under the brew-length picker in the full-page frame, in BEFORE and AFTER-r1 alike; this may be an artefact of fixed layers in a full-page capture, not looked into further).

Nothing outside Chai's box changed in any pair except these five, which I looked at (`outside-diffs/*.png`, BEFORE | AFTER | recaptures, 3x):
- `390x844-dark-t200 focus-running` (11,473 px, the chrome chips at the top and the controls at the foot): AFTER-r1 was caught mid fade-in (Rain and mute chips at about 30 % opacity); BEFORE and its recapture are fully in. Timing, not content.
- `375x667-dark focus-break` (the Pause button disc, 3,936 px) and `390x844-dark home-break` (2 px unexplained of 8): a button fill and an icon tint at slightly different transition phases (BEFORE and its recapture differ the same way).
- `375x667-dark home-break` (590 px at the "Nook" tab of the bottom bar): the tab shows a hover/active tint in AFTER-r1 only (the pointer rests at a different place after the preceding click); BEFORE and recapture agree with each other.
- `390x844-light-t200 home-break`: 1 px.
No Chai-unrelated content change (text, layout, colour) was found. The two outside-diff sources that do recur are real-time: the **break countdown digits** (the break timer is not covered by the fixed `Date.now()`: 4:50 vs 4:47 and "17 left" vs "18 left" between runs, also BEFORE vs BEFORE) and the Stage scene / tab-bar entrance transitions (why the flow states were re-taken serially, see Stage 1). The ground shadow under Chai on the Stage (CSS `.cShadow`) is outside-the-box pixels in these diffs and is identical in every captured pair.

Full per-pair numbers: `json/pixdiff2.json` (inside/outside counts, noise-pair counts, components). The first-pass diff (before the serial re-take and noise subsets) is `json/pixdiff.json`, kept only for reference.

### Re-run entry point

`scripts/rerun-after.sh <dev-port> [label]` (label default `r2`; used for AFTER-r2 as `scripts/rerun-after.sh 5631 r2`). It runs, on `http://localhost:<dev-port>`, the full 13-state matrix over 9 configs, the edge close-ups (plate, kit, stage), the pose-switch flow (12 runs), the noise recaptures, then the post-processing against the existing BEFORE data. Output: `rerun-<label>/`. BEFORE and REFERENCE are not re-run (BEFORE PNGs and A/B inputs are reused read-only). `K_ONLY=A|B` re-runs one of the two parallel streams, `K_SMOKE=1` is a 5-minute plumbing check. About 40 minutes with two slots. The post scripts take their roots from `K_ROOT` / `K_SC`.

## Stage 4: AFTER-r2 (fix trial)

**AFTER-r2** = fix trial `481bf28` (integration + C2 `20dfffe`, src `731e565`; worktree `/home/user/wt/w9tr2`), dev **:5631** (captures), preview **:5632** (bytes, precache). BEFORE = :5560 / :5570 as before, REFERENCE unchanged. Everything for this stage is in `rerun-r2/` (same layout as above: `shots/after/<config>/`, `edges/`, `strips/`, `reference/`, `outside-diffs/`, `json/`, `logs/`); BEFORE PNGs are the same files as in `shots/before/` (linked, not duplicated). Entry point used: `scripts/rerun-after.sh 5631 r2`.

Capture details that differ from AFTER-r1: the animated flow states (`focus-running`, `home-live`, `focus-paused`, `focus-break`, `home-break`) get 3x settle plus a wait (max 5 s) until no finite animation is running, exactly the condition BEFORE's final capture had except the animation wait; all other states have the plain waits. One first AFTER-r2 pass caught the whistle with the summary sheet already up (the animation wait advanced the flow); the capture script was fixed (the wait applies to the five flow states only) and the whole matrix was re-taken; the PNGs in `rerun-r2/shots/after/` are that final pass.

### 4.1 Capture counts (AFTER-r2)

117 PNGs: 13 states x 9 configs, one per BEFORE capture: `390x844-light` 13, `390x844-dark` 13, `375x667-light` 13, `375x667-dark` 13, `1440x900-light` 13, `1440x900-dark` 13, `390x844-light-t200` 13, `390x844-dark-t200` 13, `390x844-light-rm` 13. Per-capture Chai box and pose: `rerun-r2/shots/after/states.log.txt` (the Chai `<img>` boxes equal BEFORE's in every capture, to within 0.01 px in two lines).

### 4.2 REFERENCE sheets re-drawn with the AFTER-r2 file

`rerun-r2/reference/compare-<place>-<pose>-x<1|2>.png` (12 sheets, same layout as stage 2: MASTER downscaled uniformly | BEFORE | AFTER-r2, cream and dark plates). The master copies and the master ink json are unchanged (`reference/`, `json/master-ink.json`).

### 4.3 Pixel diff BEFORE vs AFTER-r2

Same method as 2b (`scripts/pixdiff2.py` with `K_ROOT=rerun-r2`; inside = BEFORE and AFTER img boxes + 16 px, Welcome prompt-row column special-cased; noise pairs: BEFORE recaptures `before2/before3` and AFTER-r2 recaptures `after2/after3`, 102 of 117 pairs have one). I = identical outside Chai's box; N = within noise; D* = outside diff not covered by a noise pair, listed below.

| config | kit-chai | settings | home-evening | focus-running | home-live | focus-paused | whistle | summary | focus-break | home-break | welcome-sound | welcome-notify | welcome-ready |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `1440x900-dark` | I | I | I | I | I | I | D* | I | N | N | I | I | I |
| `1440x900-light` | I | N | I | N | I | I | N | I | N | N | I | I | I |
| `375x667-dark` | I | N | I | I | I | I | I | I | D* | D* | I | I | I |
| `375x667-light` | I | I | I | N | I | I | I | I | N | D* | I | I | I |
| `390x844-dark` | I | I | I | I | I | N | N | I | N | N | I | I | I |
| `390x844-dark-t200` | I | I | I | D* | I | I | D* | I | D* | D* | I | I | I |
| `390x844-light` | I | I | I | I | I | N | N | I | N | N | I | I | I |
| `390x844-light-rm` | I | I | I | I | I | N | N | I | N | N | I | I | I |
| `390x844-light-t200` | I | I | I | I | I | I | I | I | D* | D* | I | I | I |

**85 identical, 22 within noise, 10 D\*.** Inside Chai's box the pair differs in 115 of 117 captures; the two exceptions are the `390x844-*-t200 home-evening` captures where Chai is not visible (as in r1).

The ten D\* (`rerun-r2/outside-diffs/*.png`, BEFORE | AFTER-r2 | recaptures at 3x) are all live or timing content, none is Chai-related: `1440x900-dark whistle` (193 px) and `390x844-dark-t200 whistle` (143 px): the floating music-note particles of the ambience are at different phases (BEFORE vs its own recapture differ the same way); `375x667-dark focus-break`, `390x844-{dark,light}-t200 focus-break`: break countdown digits (e.g. 4:58 / 4:55 / 4:54); `375x667-dark home-break`, `390x844-{dark,light}-t200 home-break`: "N:NN left" countdown digits on Home; `375x667-light home-break` (180 px unexplained of 817): the same countdown and a nav tint; `390x844-dark-t200 focus-running` (1,549 px): sub-pixel text anti-aliasing fringes on the "Add 5" label and neighbours, same variation between BEFORE and its recapture. No text, layout or colour change outside Chai's box was found. The Stage ground shadow (`.cShadow`, CSS) is identical in every pair.

Details: `rerun-r2/json/pixdiff2.json`.

### 4.4 Edge close-ups, dark theme on the app's real background

Same method as stage 2 section 3 (DPR 2, shown/hidden pairs, noise excluded). **New surface `plate`**: the three poses on a flat plate whose colour is read from the app (`--bg` on `<html>` in the dark theme = **#241a2d** = rgb(36,26,45), confirmed in the capture json; light theme #FFF9F0), using the same `<img>` source and CSS size as the Kit gallery at size 240 (`scripts/edges.mjs ... plate`). BEFORE was captured on the same plates. Also repeated: `kit` (the Kit gallery's own flat page, rgb 46,35,57) and `stage` (the real Focus stage). Sheets (BEFORE row / AFTER-r2 row, top / feet / left / right, 4x nearest): `rerun-r2/edges/edge-<surface>-<cfg>-<theme>-<pose>.png`.

| surface | cfg | theme | pose | side | AA-fringe px | ring just outside the solid ink: mean RGB (RGB underneath) | mean luma vs bg | cream-coloured and lighter than bg | lighter than bg by >10 | max diff to bg 1-3 px beyond any ink |
|---|---|---|---|---|---|---|---|---|---|---|
| plate | 1440x900 | dark | reading | BEFORE | 4119 | (46, 32, 40) ((36, 26, 45)) | +5.7 | 0.00 % | 25.7 % | 4 |
| plate | 1440x900 | dark | reading | AFTER-r2 | 3881 | (42, 28, 37) ((36, 26, 45)) | +2.2 | 0.00 % | 9.0 % | 4 |
| plate | 1440x900 | dark | sipping | BEFORE | 4174 | (46, 31, 40) ((36, 26, 45)) | +5.4 | 0.00 % | 22.7 % | 4 |
| plate | 1440x900 | dark | sipping | AFTER-r2 | 3689 | (41, 26, 36) ((36, 26, 45)) | +0.7 | 0.00 % | 7.0 % | 4 |
| plate | 1440x900 | dark | cheering | BEFORE | 3559 | (44, 31, 42) ((36, 26, 45)) | +5.1 | 0.00 % | 21.7 % | 4 |
| plate | 1440x900 | dark | cheering | AFTER-r2 | 2768 | (42, 29, 40) ((36, 26, 45)) | +2.9 | 0.00 % | 10.2 % | 4 |
| kit | 1440x900 | dark | reading | BEFORE | 4031 | (54, 39, 49) ((46, 35, 57)) | +4.1 | 0.00 % | 16.6 % | 4 |
| kit | 1440x900 | dark | reading | AFTER-r2 | 1157 | (50, 37, 54) ((46, 35, 57)) | +2.1 | 0.00 % | 10.6 % | 4 |
| kit | 1440x900 | dark | sipping | BEFORE | 3988 | (54, 39, 50) ((46, 35, 57)) | +3.8 | 0.00 % | 14.9 % | 4 |
| kit | 1440x900 | dark | sipping | AFTER-r2 | 882 | (50, 37, 56) ((46, 35, 57)) | +2.3 | 0.00 % | 11.6 % | 4 |
| kit | 1440x900 | dark | cheering | BEFORE | 3587 | (54, 39, 52) ((46, 35, 57)) | +4.3 | 0.00 % | 18.8 % | 4 |
| kit | 1440x900 | dark | cheering | AFTER-r2 | 2453 | (50, 37, 52) ((46, 35, 57)) | +1.8 | 0.00 % | 9.7 % | 4 |
| stage | 1440x900 | dark | reading | BEFORE | 27511 | (128, 89, 61) ((113, 79, 65)) | +10.2 | 0.00 % | 46.4 % | 4 |
| stage | 1440x900 | dark | reading | AFTER-r2 | 23496 | (122, 80, 52) ((109, 75, 63)) | +5.5 | 0.00 % | 32.4 % | 72 |
| stage | 1440x900 | dark | sipping | BEFORE | 28354 | (126, 87, 59) ((111, 78, 64)) | +8.9 | 0.00 % | 45.9 % | 4 |
| stage | 1440x900 | dark | sipping | AFTER-r2 | 21906 | (121, 78, 51) ((109, 77, 62)) | +3.0 | 0.00 % | 25.0 % | 4 |
| stage | 1440x900 | dark | cheering | BEFORE | 29195 | (123, 85, 59) ((110, 78, 64)) | +7.6 | 0.00 % | 43.3 % | 68 |
| stage | 1440x900 | dark | cheering | AFTER-r2 | 25862 | (123, 82, 56) ((111, 78, 65)) | +4.3 | 0.00 % | 30.6 % | 4 |
| stage | 390x844 | dark | reading | BEFORE | 7304 | (116, 80, 58) ((103, 71, 60)) | +9.1 | 0.00 % | 40.2 % | 4 |
| stage | 390x844 | dark | reading | AFTER-r2 | 6743 | (108, 72, 50) ((96, 67, 57)) | +5.5 | 0.00 % | 30.6 % | 4 |
| stage | 390x844 | dark | sipping | BEFORE | 7042 | (114, 78, 55) ((100, 70, 57)) | +8.4 | 0.00 % | 40.0 % | 4 |
| stage | 390x844 | dark | sipping | AFTER-r2 | 5817 | (105, 68, 47) ((96, 67, 55)) | +2.0 | 0.00 % | 19.4 % | 4 |
| stage | 390x844 | dark | cheering | BEFORE | 6334 | (111, 76, 54) ((100, 68, 54)) | +7.9 | 0.00 % | 37.8 % | 4 |
| stage | 390x844 | dark | cheering | AFTER-r2 | 6186 | (109, 73, 51) ((98, 67, 53)) | +6.4 | 0.00 % | 32.2 % | 4 |
| plate | 1440x900 | light | reading | BEFORE | 2505 | (251, 244, 230) ((255, 249, 240)) | -5.1 | 0.00 % | 0.0 % | 4 |
| plate | 1440x900 | light | reading | AFTER-r2 | 2301 | (253, 246, 234) ((255, 249, 240)) | -2.9 | 0.00 % | 0.0 % | 4 |
| plate | 1440x900 | light | sipping | BEFORE | 2322 | (252, 244, 232) ((255, 249, 240)) | -5.1 | 0.00 % | 0.0 % | 4 |
| plate | 1440x900 | light | sipping | AFTER-r2 | 1266 | (253, 246, 236) ((255, 249, 240)) | -2.4 | 0.00 % | 0.0 % | 4 |
| plate | 1440x900 | light | cheering | BEFORE | 1339 | (253, 246, 234) ((255, 249, 240)) | -3.3 | 0.00 % | 0.0 % | 4 |
| plate | 1440x900 | light | cheering | AFTER-r2 | 800 | (253, 246, 236) ((255, 249, 240)) | -2.7 | 0.00 % | 0.0 % | 4 |
| kit | 1440x900 | light | reading | BEFORE | 1849 | (252, 249, 242) ((255, 253, 250)) | -4.1 | 0.00 % | 0.0 % | 4 |
| kit | 1440x900 | light | reading | AFTER-r2 | 2284 | (253, 249, 242) ((255, 253, 250)) | -3.7 | 0.00 % | 0.0 % | 4 |
| kit | 1440x900 | light | sipping | BEFORE | 2260 | (252, 247, 241) ((255, 253, 250)) | -5.6 | 0.00 % | 0.0 % | 4 |
| kit | 1440x900 | light | sipping | AFTER-r2 | 2046 | (253, 249, 244) ((255, 253, 250)) | -3.4 | 0.00 % | 0.0 % | 4 |
| kit | 1440x900 | light | cheering | BEFORE | 1329 | (253, 250, 244) ((255, 253, 250)) | -3.2 | 0.00 % | 0.0 % | 4 |
| kit | 1440x900 | light | cheering | AFTER-r2 | 786 | (253, 250, 246) ((255, 253, 250)) | -2.6 | 0.00 % | 0.0 % | 4 |
| stage | 1440x900 | light | reading | BEFORE | 22252 | (178, 148, 105) ((182, 159, 115)) | -9.9 | 0.17 % | 9.1 % | 4 |
| stage | 1440x900 | light | reading | AFTER-r2 | 19221 | (177, 143, 100) ((184, 156, 111)) | -11.7 | 0.00 % | 4.8 % | 4 |
| stage | 1440x900 | light | sipping | BEFORE | 21037 | (173, 141, 98) ((177, 154, 110)) | -10.5 | 0.05 % | 8.1 % | 4 |
| stage | 1440x900 | light | sipping | AFTER-r2 | 17339 | (179, 140, 97) ((182, 153, 109)) | -11.0 | 0.24 % | 4.5 % | 4 |
| stage | 1440x900 | light | cheering | BEFORE | 19024 | (172, 141, 99) ((178, 152, 110)) | -10.1 | 0.00 % | 7.6 % | 4 |
| stage | 1440x900 | light | cheering | AFTER-r2 | 16213 | (175, 140, 99) ((180, 153, 111)) | -11.4 | 0.00 % | 2.9 % | 4 |


Read-out (dark): on every surface the share of ring pixels that are cream-coloured and lighter than the background is 0.00 %, in BEFORE and AFTER-r2. On the #241a2d plate the ring just outside the ink is a warm brown blend (AFTER-r2 about RGB 42,28,37 over 36,26,45; BEFORE about 46,32,40): AFTER-r2 is closer to the background than BEFORE for all three poses (mean luma +2.2 / +0.7 / +2.9 vs +5.7 / +5.4 / +5.1), the share of ring pixels lighter than the plate by more than 10 is 9.0 / 7.0 / 10.2 % vs 25.7 / 22.7 / 21.7 %, and 1 to 3 px beyond the ink nothing differs from the plate (4/255 is the test floor). Light plate: ring slightly darker than the page (-2.4 to -2.9), no light halo. Two single-pixel scene outliers (max diff 72 and 68 on the Stage, one BEFORE and one AFTER-r2) are scene particles, not Chai. Full table: `rerun-r2/json/edge-halo-table.md`.

### 4.5 Pose-switch sequence (the real flow, BEFORE :5560 vs AFTER-r2 :5631)

Same flow, steps and measures as stage 2 section 4 (`scripts/poseswitch.mjs`; 390x844 and 1440x900, light and dark, DPR 1 frames, DPR 1 reduced motion, DPR 2). Strips (BEFORE row above AFTER-r2 row, same crop, 1:1 px): `rerun-r2/strips/strip-{390x844,1440x900}-{light,dark}.png`. All tables: `rerun-r2/json/poseswitch-tables.md`; raw `rerun-r2/json/ps/*.json.gz`; summary `rerun-r2/json/poseswitch-summary.json`.

Because each pose now has its own uniform scale, the **ink box is no longer held to BEFORE's** (the img box still is: box delta 0.00 everywhere); the baseline is:

**Footprint, AFTER-r2 minus BEFORE (CSS px; reduced-motion runs, DPR 1; ink = decoded alpha > 8 through the real box; the img box itself is unchanged: box delta 0.00)**

| config | step | pose | d ink w | d ink h | d ink centre x | d baseline (ink bottom) | d ink top | d ink left | d ink right |
|---|---|---|---|---|---|---|---|---|---|
| 390x844 | 1 Focus running | reading | +1.60 | +0.00 | -0.14 | +0.00 | +0.00 | -0.95 | +0.65 |
| 390x844 | 2 Whistle | cheering | -4.06 | +0.07 | +0.00 | +0.00 | -0.07 | +2.03 | -2.03 |
| 390x844 | 4 Tea break | sipping | +1.16 | -0.21 | +0.00 | +0.00 | +0.22 | -0.58 | +0.58 |
| 1440x900 | 1 Focus running | reading | +2.62 | +0.00 | -0.24 | +0.01 | +0.00 | -1.55 | +1.07 |
| 1440x900 | 2 Whistle | cheering | -6.67 | +0.12 | +0.00 | +0.00 | -0.12 | +3.34 | -3.33 |
| 1440x900 | 4 Tea break | sipping | +1.91 | -0.36 | +0.00 | +0.01 | +0.35 | -0.95 | +0.96 |

**390x844 light, reduced motion, DPR 1** (CSS px)

| step | pose | side | img box w x h | ink w x h | ink centre x | baseline y | step delta: box w, box h, ink w, ink h, ink cx, baseline |
|---|---|---|---|---|---|---|---|
| 1 Focus running | reading | BEFORE | 112.8 x 176.62 | 109.17 x 173.72 | 292.49 | 369.74 | - |
| 1 Focus running | reading | AFTER-r2 | 112.8 x 176.62 | 110.77 x 173.72 | 292.35 | 369.74 | - |
| 2 Whistle | cheering | BEFORE | 113.16 x 155.23 | 110.25 x 151.97 | 292.48 | 369.75 | +0.36, -21.39, +1.08, -21.75, -0.01, +0.01 |
| 2 Whistle | cheering | AFTER-r2 | 113.16 x 155.23 | 106.19 x 152.04 | 292.48 | 369.75 | +0.36, -21.39, -4.58, -21.68, +0.13, +0.01 |
| 3 Summary | cheering | BEFORE | 113.16 x 155.23 | 110.25 x 151.97 | 292.48 | 369.75 | +0.00, +0.00, +0.00, +0.00, +0.00, +0.00 |
| 3 Summary | cheering | AFTER-r2 | 113.16 x 155.23 | 106.19 x 152.04 | 292.48 | 369.75 | +0.00, +0.00, +0.00, +0.00, +0.00, +0.00 |
| 4 Tea break | sipping | BEFORE | 109.53 x 178.08 | 106.63 x 174.81 | 292.48 | 369.74 | -3.63, +22.85, -3.62, +22.84, +0.00, -0.01 |
| 4 Tea break | sipping | AFTER-r2 | 109.53 x 178.08 | 107.79 x 174.6 | 292.48 | 369.74 | -3.63, +22.85, +1.60, +22.56, +0.00, -0.01 |
| 5 Next brew | reading | BEFORE | 112.8 x 176.62 | 109.17 x 173.72 | 292.49 | 369.74 | +3.27, -1.46, +2.54, -1.09, +0.01, +0.00 |
| 5 Next brew | reading | AFTER-r2 | 112.8 x 176.62 | 110.77 x 173.72 | 292.35 | 369.74 | +3.27, -1.46, +2.98, -0.88, -0.13, +0.00 |

**390x844 dark, reduced motion, DPR 1** (CSS px)

| step | pose | side | img box w x h | ink w x h | ink centre x | baseline y | step delta: box w, box h, ink w, ink h, ink cx, baseline |
|---|---|---|---|---|---|---|---|
| 1 Focus running | reading | BEFORE | 112.8 x 176.62 | 109.17 x 173.72 | 292.49 | 369.74 | - |
| 1 Focus running | reading | AFTER-r2 | 112.8 x 176.62 | 110.77 x 173.72 | 292.35 | 369.74 | - |
| 2 Whistle | cheering | BEFORE | 113.16 x 155.23 | 110.25 x 151.97 | 292.48 | 369.75 | +0.36, -21.39, +1.08, -21.75, -0.01, +0.01 |
| 2 Whistle | cheering | AFTER-r2 | 113.16 x 155.23 | 106.19 x 152.04 | 292.48 | 369.75 | +0.36, -21.39, -4.58, -21.68, +0.13, +0.01 |
| 3 Summary | cheering | BEFORE | 113.16 x 155.23 | 110.25 x 151.97 | 292.48 | 369.75 | +0.00, +0.00, +0.00, +0.00, +0.00, +0.00 |
| 3 Summary | cheering | AFTER-r2 | 113.16 x 155.23 | 106.19 x 152.04 | 292.48 | 369.75 | +0.00, +0.00, +0.00, +0.00, +0.00, +0.00 |
| 4 Tea break | sipping | BEFORE | 109.53 x 178.08 | 106.63 x 174.81 | 292.48 | 369.74 | -3.63, +22.85, -3.62, +22.84, +0.00, -0.01 |
| 4 Tea break | sipping | AFTER-r2 | 109.53 x 178.08 | 107.79 x 174.6 | 292.48 | 369.74 | -3.63, +22.85, +1.60, +22.56, +0.00, -0.01 |
| 5 Next brew | reading | BEFORE | 112.8 x 176.62 | 109.17 x 173.72 | 292.49 | 369.74 | +3.27, -1.46, +2.54, -1.09, +0.01, +0.00 |
| 5 Next brew | reading | AFTER-r2 | 112.8 x 176.62 | 110.77 x 173.72 | 292.35 | 369.74 | +3.27, -1.46, +2.98, -0.88, -0.13, +0.00 |

**1440x900 light, reduced motion, DPR 1** (CSS px)

| step | pose | side | img box w x h | ink w x h | ink centre x | baseline y | step delta: box w, box h, ink w, ink h, ink cx, baseline |
|---|---|---|---|---|---|---|---|
| 1 Focus running | reading | BEFORE | 185.09 x 289.86 | 179.14 x 285.1 | 607.19 | 790.24 | - |
| 1 Focus running | reading | AFTER-r2 | 185.09 x 289.86 | 181.76 x 285.1 | 606.95 | 790.25 | - |
| 2 Whistle | cheering | BEFORE | 185.69 x 254.73 | 180.93 x 249.38 | 607.19 | 790.24 | +0.60, -35.13, +1.79, -35.72, +0.00, +0.00 |
| 2 Whistle | cheering | AFTER-r2 | 185.69 x 254.73 | 174.26 x 249.5 | 607.19 | 790.24 | +0.60, -35.13, -7.50, -35.60, +0.24, -0.01 |
| 3 Summary | cheering | BEFORE | 185.69 x 254.73 | 180.93 x 249.38 | 607.19 | 790.24 | +0.00, +0.00, +0.00, +0.00, +0.00, +0.00 |
| 3 Summary | cheering | AFTER-r2 | 185.69 x 254.73 | 174.26 x 249.5 | 607.19 | 790.24 | +0.00, +0.00, +0.00, +0.00, +0.00, +0.00 |
| 4 Tea break | sipping | BEFORE | 179.75 x 292.23 | 174.99 x 286.88 | 607.19 | 790.24 | -5.94, +37.50, -5.94, +37.50, +0.00, +0.00 |
| 4 Tea break | sipping | AFTER-r2 | 179.75 x 292.23 | 176.9 x 286.52 | 607.19 | 790.25 | -5.94, +37.50, +2.64, +37.02, +0.00, +0.01 |
| 5 Next brew | reading | BEFORE | 185.09 x 289.86 | 179.14 x 285.1 | 607.19 | 790.24 | +5.34, -2.37, +4.15, -1.78, +0.00, +0.00 |
| 5 Next brew | reading | AFTER-r2 | 185.09 x 289.86 | 181.76 x 285.1 | 606.95 | 790.25 | +5.34, -2.37, +4.86, -1.42, -0.24, +0.00 |

**1440x900 dark, reduced motion, DPR 1** (CSS px)

| step | pose | side | img box w x h | ink w x h | ink centre x | baseline y | step delta: box w, box h, ink w, ink h, ink cx, baseline |
|---|---|---|---|---|---|---|---|
| 1 Focus running | reading | BEFORE | 185.09 x 289.86 | 179.14 x 285.1 | 607.19 | 790.24 | - |
| 1 Focus running | reading | AFTER-r2 | 185.09 x 289.86 | 181.76 x 285.1 | 606.95 | 790.25 | - |
| 2 Whistle | cheering | BEFORE | 185.69 x 254.73 | 180.93 x 249.38 | 607.19 | 790.24 | +0.60, -35.13, +1.79, -35.72, +0.00, +0.00 |
| 2 Whistle | cheering | AFTER-r2 | 185.69 x 254.73 | 174.26 x 249.5 | 607.19 | 790.24 | +0.60, -35.13, -7.50, -35.60, +0.24, -0.01 |
| 3 Summary | cheering | BEFORE | 185.69 x 254.73 | 180.93 x 249.38 | 607.19 | 790.24 | +0.00, +0.00, +0.00, +0.00, +0.00, +0.00 |
| 3 Summary | cheering | AFTER-r2 | 185.69 x 254.73 | 174.26 x 249.5 | 607.19 | 790.24 | +0.00, +0.00, +0.00, +0.00, +0.00, +0.00 |
| 4 Tea break | sipping | BEFORE | 179.75 x 292.23 | 174.99 x 286.88 | 607.19 | 790.24 | -5.94, +37.50, -5.94, +37.50, +0.00, +0.00 |
| 4 Tea break | sipping | AFTER-r2 | 179.75 x 292.23 | 176.9 x 286.52 | 607.19 | 790.25 | -5.94, +37.50, +2.64, +37.02, +0.00, +0.01 |
| 5 Next brew | reading | BEFORE | 185.09 x 289.86 | 179.14 x 285.1 | 607.19 | 790.24 | +5.34, -2.37, +4.15, -1.78, +0.00, +0.00 |
| 5 Next brew | reading | AFTER-r2 | 185.09 x 289.86 | 181.76 x 285.1 | 606.95 | 790.25 | +5.34, -2.37, +4.86, -1.42, -0.24, +0.00 |

**rAF trace (largest single-frame change of the Chai img, CSS px)**

| config | motion | DPR | side | frames | max abs d width | max abs d height | max abs d centre x | max abs d bottom |
|---|---|---|---|---|---|---|---|---|
| 1440x900 dark | full | 1 | BEFORE | 2732 | 6.06 | 37.50 | 0.00 | 10.00 |
| 1440x900 dark | full | 1 | AFTER-r2 | 3866 | 5.94 | 37.50 | 0.00 | 3.40 |
| 1440x900 dark | reduce | 1 | BEFORE | 1758 | 5.94 | 37.50 | 0.00 | 0.00 |
| 1440x900 dark | reduce | 1 | AFTER-r2 | 2055 | 5.94 | 37.50 | 0.00 | 0.00 |
| 1440x900 dark | full | 2 | BEFORE | 3489 | 6.06 | 37.50 | 0.00 | 13.44 |
| 1440x900 dark | full | 2 | AFTER-r2 | 3865 | 7.36 | 37.50 | 0.00 | 16.69 |
| 1440x900 light | full | 1 | BEFORE | 2962 | 5.94 | 37.50 | 0.00 | 12.43 |
| 1440x900 light | full | 1 | AFTER-r2 | 3880 | 6.06 | 37.50 | 0.00 | 3.61 |
| 1440x900 light | reduce | 1 | BEFORE | 1522 | 5.94 | 37.50 | 0.00 | 0.00 |
| 1440x900 light | reduce | 1 | AFTER-r2 | 2348 | 5.94 | 37.50 | 0.00 | 0.00 |
| 1440x900 light | full | 2 | BEFORE | 4419 | 5.94 | 37.50 | 0.00 | 12.77 |
| 1440x900 light | full | 2 | AFTER-r2 | 4934 | 7.18 | 37.50 | 0.00 | 2.76 |
| 390x844 dark | full | 1 | BEFORE | 2315 | 3.62 | 22.84 | 0.01 | 5.83 |
| 390x844 dark | full | 1 | AFTER-r2 | 2084 | 3.62 | 22.84 | 0.01 | 9.90 |
| 390x844 dark | reduce | 1 | BEFORE | 1336 | 3.62 | 22.84 | 0.01 | 0.02 |
| 390x844 dark | reduce | 1 | AFTER-r2 | 1101 | 3.62 | 22.84 | 0.01 | 0.02 |
| 390x844 dark | full | 2 | BEFORE | 2389 | 4.49 | 22.84 | 0.01 | 9.58 |
| 390x844 dark | full | 2 | AFTER-r2 | 2035 | 3.69 | 22.84 | 0.01 | 2.30 |
| 390x844 light | full | 1 | BEFORE | 2098 | 3.62 | 22.84 | 0.01 | 4.29 |
| 390x844 light | full | 1 | AFTER-r2 | 1805 | 3.99 | 22.84 | 0.01 | 10.66 |
| 390x844 light | reduce | 1 | BEFORE | 1168 | 3.62 | 22.84 | 0.01 | 0.02 |
| 390x844 light | reduce | 1 | AFTER-r2 | 1148 | 3.62 | 22.84 | 0.01 | 0.02 |
| 390x844 light | full | 2 | BEFORE | 2065 | 3.69 | 22.84 | 0.01 | 9.98 |
| 390x844 light | full | 2 | AFTER-r2 | 1696 | 3.80 | 22.84 | 0.01 | 10.38 |


Reading: in every step of every run the **baseline (ink bottom) is within 0.01 px of BEFORE** and the ink centre within 0.24 px; the reading ink is 1.6 (390) / 2.6 (1440) px wider, the sipping ink 1.2 / 1.9 px wider and 0.2 / 0.4 px shorter, and the cheering ink **4.1 (390) / 6.7 (1440) px narrower** than BEFORE (height +0.07 / +0.12). Between poses the baseline does not move in either version (AFTER-r2 steps 3 to 5 of the normal-motion runs: 369.74 to 369.75 at 390, 790.24 to 790.25 at 1440); in the reduced-motion per-frame trace the largest single-frame change of the baseline or the centre is 0.00 (1440) and at most 0.02 (390), the same as BEFORE; the only large frame step is the box height at the cheering-to-sipping swap (22.84 / 37.5 px), identical BEFORE and AFTER-r2, with the bottom fixed. The normal-motion notes of stage 2 (arrival bob and whistle hop make steps 1 and 2 sample-dependent) apply unchanged.

### 4.6 Proportions against the masters

Method as stage 2 section 5. Aspect = ink w / ink h; change = AFTER-r2 aspect / master aspect - 1 (own master segmentation).

| pose | side | method | n | mean aspect w/h | min..max % | mean width-vs-height vs master |
|---|---|---|---|---|---|---|
| reading | before | stage: decoded alpha through the box | 4 | 0.6284 | -1.54..-1.53 | **-1.54 %** |
| reading | before | kit: screenshot diff (flat page) | 2 | 0.6360 | -0.35..-0.35 | **-0.35 %** |
| reading | before | stage: screenshot diff | 5 | 0.6303 | -1.62..-0.70 | **-1.24 %** |
| reading | after | stage: decoded alpha through the box | 4 | 0.6376 | -0.10..-0.09 | **-0.10 %** |
| reading | after | kit: screenshot diff (flat page) | 2 | 0.6441 | +0.93..+0.93 | **+0.93 %** |
| reading | after | stage: screenshot diff | 5 | 0.6381 | -0.21..+0.54 | **-0.02 %** |
| sipping | before | stage: decoded alpha through the box | 4 | 0.6100 | -1.11..-1.11 | **-1.11 %** |
| sipping | before | kit: screenshot diff (flat page) | 2 | 0.6052 | -1.89..-1.89 | **-1.89 %** |
| sipping | before | stage: screenshot diff | 5 | 0.6056 | -2.45..-1.37 | **-1.82 %** |
| sipping | after | stage: decoded alpha through the box | 4 | 0.6174 | +0.08..+0.09 | **+0.08 %** |
| sipping | after | kit: screenshot diff (flat page) | 2 | 0.6160 | -0.13..-0.13 | **-0.13 %** |
| sipping | after | stage: screenshot diff | 5 | 0.6164 | -0.59..+0.14 | **-0.07 %** |
| cheering | before | stage: decoded alpha through the box | 4 | 0.7255 | +4.00..+4.01 | **+4.00 %** |
| cheering | before | kit: screenshot diff (flat page) | 2 | 0.7291 | +4.39..+4.65 | **+4.52 %** |
| cheering | before | stage: screenshot diff | 5 | 0.7243 | +1.58..+4.65 | **+3.83 %** |
| cheering | after | stage: decoded alpha through the box | 4 | 0.6984 | +0.12..+0.12 | **+0.12 %** |
| cheering | after | kit: screenshot diff (flat page) | 2 | 0.7024 | +0.56..+0.81 | **+0.69 %** |
| cheering | after | stage: screenshot diff | 5 | 0.6982 | -0.50..+0.56 | **+0.10 %** |

Master ink aspect (own segmentation): reading 0.63819 (889x1393 px), sipping 0.61684 (879x1425 px), cheering 0.69757 (948x1359 px)

File level (alpha > 8 box of the shipped WebP, before any DOM stretch; `rerun-r2/json/shipped-file-ink-r2.json`): reading 382 x 599 in a 389 x 609 file (aspect 0.63773, **-0.07 %** vs the master), sipping 372 x 602 in 378 x 614 (0.61794, **+0.18 %**), cheering 366 x 524 in 390 x 535 (0.69847, **+0.13 %**). The file aspect equals the `PAINTED` box aspect for all three (e.g. cheering 390/535 = 0.72897 = 312/428), so the page adds no further stretch. Measured independently on the screen (decoded alpha through the real box, DPR 2, steady steps, 4 configs): **reading -0.10 %, sipping +0.08 %, cheering +0.12 %** (width relative to height). The maker states -0.07 / +0.06 / +0.02 %; my numbers differ by 0.03 to 0.10 points (my master segmentation vs theirs, and the file-level sipping/cheering are 0.1 points off the maker's). The pixel-based rows (kit/stage screenshot diff, 0.5 px quantised, 16/255 threshold) agree within about +-1 point; their means are -0.02 to +0.69 %. For comparison the first trial (AFTER-r1) was -1.64 / -1.33 / +3.96 %.

### 4.7 File sizes and PWA precache (:5570 BEFORE vs :5632 AFTER-r2)

| file | BEFORE :5570 (bytes) | AFTER-r2 :5632 (bytes) | change | dimensions before -> after |
|---|---|---|---|---|
| chai-reading.webp | 20,900 | 19,968 | -932 | 311x487 -> 389x609 |
| chai-sipping.webp | 19,950 | 19,178 | -772 | 302x491 -> 378x614 |
| chai-cheering.webp | 20,626 | 19,078 | -1,548 | 312x428 -> 390x535 |
| **total** | **61,476** | **58,224** | **-3,252 (-5.3 %)** | |

Served by hashed URL on :5632 (`chai-reading-CMLk2MAx`, `chai-sipping-DwyPxpxw`, `chai-cheering-ZKPXRG7z`; `image/webp`), md5 identical to `src/art/chai/*.webp` in `/home/user/wt/w9tr2` (copies: `rerun-r2/assets-served-preview/r2-*.webp`; the dev-server copies used for the sheets are `rerun-r2/assets-served/after-chai-*.webp`, same bytes). Precache: `sw.js` on :5632 lists 119 entries, the three WebPs among them as hashed URLs with `revision: null`; live check (`scripts/pwa-cache.mjs`, `json/pwa-cache-r2.json`): service worker `activated` on :5570 and :5632 and `workbox-precache-v2` holds the three files at exactly the byte sizes above on each.
