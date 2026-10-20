# C2-READY: W3R3, new 2D Chai masters (reading, sipping, cheering)

Branch `pe/w3r3-chai-2d` (worktree `/home/user/wt/w9c`), base `f034205`. Stages are appended as they are finished.

## 1. Inventory (written before any change to the app tree)

### 1a. Where the three images are defined, imported and sized

| # | file:line | what |
|---|---|---|
| 1 | `kettle/src/art/chai/chai-reading.webp` (20,900 B, 311x487), `chai-sipping.webp` (19,950 B, 302x491), `chai-cheering.webp` (20,626 B, 312x428) | the shipped files; 61,476 B together |
| 2 | `kettle/src/art/PaintedChai.tsx:14-16` | the only three imports (Vite-hashed URLs) |
| 3 | `kettle/src/art/PaintedChai.tsx:25` | `PaintedPose` union (`reading`, `sipping`, `cheering`) |
| 4 | `kettle/src/art/PaintedChai.tsx:28-31` | `PAINTED`: logical size per pose, 311x487 / 302x491 / 312x428 (`w`, `h` in sheet px). This is the layout footprint; every place below derives from it. |
| 5 | `kettle/src/art/PaintedChai.tsx:36-47` | `SHEET_REF_H` (500) and `SHEET_MARGIN` (4); `paintedBox(pose,size)` = `PAINTED.w|h * size/500` |
| 6 | `kettle/src/art/PaintedChai.tsx:62-82` | `PaintedChai`: a `span` of `paintedBox` size (`transform-origin: 50% 100%`), one `<img width height>` at 100% x 100% |
| 7 | `kettle/src/art/painted.module.css:1-14` | `.pose` (inline-block, `line-height:0`) and `.img` (`display:block; width/height:100%`; no `object-fit`, so the file is stretched to the box) |
| 8 | `kettle/src/art/painted.module.css:16-30` | `.live` breathing (existing, untouched; reduced motion turns it off) |
| 9 | `kettle/src/art/index.ts:3-4` | re-exports `PAINTED`, `paintedBox`, `SHEET_REF_H`, `SHEET_MARGIN` |
| 10 | `kettle/src/art/Mascot.tsx:599-611` | `PAINTED_POSE`: `focus` -> `reading` (602), `sip` -> `sipping` (604), `cheer` -> `cheering` (605) |
| 11 | `kettle/src/art/Mascot.tsx:617-622` | `Mascot`: square `size` x `size` box, `inline-flex`, `align-items:flex-end`, centred; feet sit on the box floor |
| 12 | `kettle/src/screens/focus/FocusScreen.tsx:55-61` | Stage pose map: `focus` -> `reading` (56), `whistle` -> `cheering` (57), `summary` -> `cheering` (58), `break` -> `sipping` (59). Passed at `:293`. |
| 13 | `kettle/src/screens/focus/stage/Stage.tsx:48,54-58,105-107` | `CHAI_SIZE = 186`; `chaiW/chaiH/chaiDrop` from `PAINTED[pose]`, `SHEET_REF_H`, `SHEET_MARGIN`; `<PaintedChai size={186} faceBelow={0}>` |
| 14 | `kettle/src/screens/focus/stage/Stage.module.css:4,155-166,209-214` | `--u: min(0.25cqw, 0.3cqh, 1.6px)`; `.chai` box = `--chai-w/h * --u`, bottom at counter line + 4u (the 4 sheet-px margin); `.cShadow` ground shadow in CSS (width `chai-w * 0.78`, theme-aware ink, `[data-night]` darker). `img` forced 100% x 100% (`:163-166`). |
| 15 | `kettle/src/screens/done/Summary.tsx:562-566` | reads the stage figure box via `[data-stage-figure]` (the Chai wrapper), so it depends on the same box |

No other module imports the three files. No `<picture>`, `srcset`, CSS `url()` or `object-fit` refers to them. Docs/tests: `kettle/art-src/chai/README.md:14-16` (table), `kettle/docs/areas/art.md:8-11`, `kettle/docs/areas/core-loop.md:116`; tests: none assert on these files or their sizes (`tests/w2-summary.spec.ts:157` only reads `[data-pose]` in the focus view).

PWA precache: `kettle/vite.config.ts:44` `globPatterns: ['**/*.{js,css,html,svg,png,webp,ico,woff2,glb}']`. The three WebPs are precached by hash today; same file names and format keep that unchanged.

### 1b. Every screen and state where each pose shows (pose mapping must not change)

| Pose | Surface | file:line | State / condition | Size (CSS px, `Mascot size` or `CHAI_SIZE`) |
|---|---|---|---|---|
| reading | Focus stage | `FocusScreen.tsx:56,293` -> `Stage.tsx:106` | focus view: running and paused | 186 units x `--u` (<= 1.6 px) |
| reading | Home hero | `home/chai.ts:87` -> `Hero.tsx:38` | a brew is running/paused (`mood: live`, `pose: focus`) | 76 landscape / 152 wide / 88 narrow / 112 default |
| reading | Kit gallery | `art/Gallery.tsx:17,72,81,105-106` | `#/kit?part=art&view=chai` (all poses) and `view=pose&pose=focus&size=N` | `size` param / `sz` |
| sipping | Focus stage | `FocusScreen.tsx:59,293` | tea break | 186 units |
| sipping | Home hero | `home/chai.ts:90,103,144,147,156,162` -> `Hero.tsx:38` | break live; evening: goal met, progress, hello, idle | 76 / 152 / 88 / 112 |
| sipping | Settings, About | `SettingsScreen.tsx:329` | static `pose="sip"` | 72 |
| sipping | Welcome | `WelcomeScreen.tsx:288` -> `:206` | sound step | 148 wide / 84 compact / 108 |
| sipping | Kit gallery | `art/Gallery.tsx:17,72,81,105-106` | as above, `pose=sip` | `size` param / `sz` |
| cheering | Focus stage | `FocusScreen.tsx:57,58,293` | whistle (hop animation) and summary | 186 units |
| cheering | Welcome | `WelcomeScreen.tsx:291,294` -> `:206` | notify granted; ready step | ready: 200 wide / 120 compact / 168; notify: 148 / 84 / 108 |
| cheering | Kit gallery | `art/Gallery.tsx:17,72,81,105-106` | as above, `pose=cheer` | `size` param / `sz` |

Not reaching these three images: `StatsScreen.tsx:46` (`proud|think|sleep|idle`), `EndSheet/History/DataSection` (`concerned`), `Recipes/StatusBar/EmptyState` (`peek`), `Nook`/`Fallback.tsx:23` (vector `ChaiArt` and 3D, out of scope).

### 1c. Current display footprint rule (the same for every place)

Footprint of a place = `span.pose` box = `PAINTED[pose].w|h * size / 500` CSS px, `<img>` 100% x 100% (no `object-fit`; the box is the contract), bottom-aligned (`Mascot`: `align-items:flex-end`; Stage: bottom at the counter line + 4u). The art inside the box is a tight crop with a 4 sheet-px transparent margin. Measured ink boxes of the files being replaced (alpha > 8, sheet px): reading x 5..306, y 4..483; sipping x 4..298, y 5..487; cheering x 4..308, y 5..424.

Numbers per place, before vs after, are in section 4.

## 2. Cut-out method and shadow

Script: `kettle/scripts/export-chai-2d.py` (Pillow + numpy + scipy in a venv outside the repo; no `package.json` or lockfile change). Masters in `art-src/chai/2d-v2/` untouched.

1. **Background.** The cream ground and its shadow lie on one hue line (cream x 0.88..1.0, perpendicular distance < 9). Pixels on that line connected to the image border are background, so the ground shadow goes with it. Pale interior parts (steam, book pages, mug leaf) are enclosed and stay.
2. **Rim un-mixing (not a threshold).** A 3 px band around the background: for each pixel the local background B is the nearest background pixel and the foreground F the nearest interior pixel; alpha = projection of (C - B) on (F - B); the pixel keeps colour F. No cream or shadow colour survives in the rim.
3. **Resize** on premultiplied colour (Pillow does this for RGBA), so the clear ground cannot bleed in.
4. **Shadow: CSS, not baked.** The Stage already draws one theme-aware contact shadow for Chai (`Stage.module.css:168-214`, `.cShadow`, darker under `[data-night]`). It sits correctly on both themes, so the art carries no shadow and no cream-tinted blob. Elsewhere (Home, Welcome, Settings) the replaced art never had a ground shadow, so none was added; adding one would change the footprint. If LEAD wants one there, it is a CSS-only addition in `painted.module.css`.

## 3. Exports and bytes

One WebP per pose, same file names (imports, hashing and the PWA precache glob unchanged). WebP with alpha is the one format every browser that runs this PWA decodes, and the app already ships all its art as WebP, so no fallback format is needed; AVIF plus a WebP fallback would add bytes. No `srcset` or `<picture>`: one density (1.25 px per layout px) covers every display need (Stage cap on a 2x screen needs 1.19; phone 3x needs at most 1.1).

| file | before | after | pixels (before -> after) |
|---|---|---|---|
| chai-reading.webp | 20,900 | 19,084 | 311x487 -> 389x609 |
| chai-sipping.webp | 19,950 | 19,144 | 302x491 -> 378x614 |
| chai-cheering.webp | 20,626 | 19,782 | 312x428 -> 390x535 |
| **total** | **61,476** | **58,010** | budget 61,476: **3,466 under** |

Settings: quality 82, alpha quality 80 (alpha error <= 1/255; 70 already gives 9/255 rim steps), method 6. Trade-off tried (three poses, total bytes): 1.0x q82 45,496; 1.2x q82 55,354; 1.25x q82 58,010 (shipped); 1.3x q82 60,060; 1.25x q86 64,282 (over budget). Alpha quality 100 at 1.25x/q82 is 63,472 (over). No budget increase is requested.

Precache: the three hashed WebPs stay in the Workbox precache (build: 119 entries, 3,076.55 KiB, 3,466 B less than before). In the vite preview of this build the service worker is active, the cache holds the three new hashes, and offline fetches return 200 with 19,084 / 19,144 / 19,782 bytes (`evidence/captures/pwa-check.json`, `evidence/offline-check.log.txt`).

## 4. Footprint and baseline (before :5560 vs after :5611, real browser, dark theme, reduced motion, DPR 2)

Method: `evidence/measure-footprint.mjs` loads each place, decodes the image, finds the alpha > 8 ink box and maps it to CSS px through the image's rect. `compare-footprint.py` diffs BEFORE and AFTER. 86 places (43 per viewport at 390x844 and 1440x900): the Kit gallery at every Mascot size used by a screen (72, 76, 84, 88, 108, 112, 120, 148, 152, 168, 186, 200) for each of the three poses, Settings About, Home hero (brew live and break live), and the Focus stage in running, whistle, summary and break. Pose shown in each place is identical before and after (0 mismatches; 28 reading, 30 sipping, 28 cheering). Full table: `evidence/footprint.md`; raw: `footprint-before.json`, `footprint-after.json`.

How it is held: `PAINTED` w/h and every layout rule are unchanged, so the image box is identical by construction (box delta 0.00 in all 86). The art is fitted to the old art's ink box, so the ink box and feet baseline match too. Cost: the fit stretches the new art slightly (width relative to height): reading -1.5 %, sipping -1.2 %, cheering +3.9 %. A uniform scale could not hold both width and height, because the new cheering pose is proportionally wider and taller than the old one; the brief asks for <= 1 CSS px, so the fit wins. Alternative for LEAD if the stretch is judged too much: uniform scale by height, which moves the cheering ink width by about -6 CSS px on the Stage.

Worst deltas (after minus before, CSS px) per measure (CSS px, after minus before):
- box w: +0.00 ()
- box h: +0.00 ()
- ink w: -0.47 (1440x900 focus stage break (sipping))
- ink h: +0.13 (1440x900 focus stage break (sipping))
- ink left: -0.12 (1440x900 focus stage reading (running))
- ink right: -0.47 (1440x900 focus stage break (sipping))
- ink top: -0.12 (1440x900 focus stage whistle)
- baseline: +0.01 (390x844 kit focus @84)

All <= 0.47 CSS px (limit 1).

## 5. Checks

- **Halo (dark theme #221829).** For every rim pixel (0 < alpha < 255) of the shipped WebP: pull of its colour towards cream, relative to the nearest interior colour (0 = none, +1 = fully cream); lightness shift; and distance of the composite on #221829 from the ideal composite (interior colour x alpha). Control = same alpha, rim colours left as the master has them.

| pose | rim px | pull to cream, shipped | control | lightness shift, shipped | control | composite error, shipped | control |
|---|---|---|---|---|---|---|---|
| reading | 4916 | -0.007 | +0.447 | -1.86 | +55.96 | 4.06 | 44.77 |
| sipping | 4861 | +0.000 | +0.464 | -0.98 | +59.42 | 3.54 | 44.03 |
| cheering | 5843 | -0.009 | +0.462 | -2.05 | +57.23 | 3.66 | 47.01 |

  Shipped rim shows no cream pull (about 0.00, control +0.45). Close-ups on #221829 and #FFF9F0 (`evidence/captures/edge-*`, and a 3x tile in the script's own check) are clean at ears, paws, feet, leaf, sparkles, steam.
- **Captures** (own spot checks, preview build): `evidence/captures/focus-{reading,whistle-cheering,break-sipping}-{390,1440}-dark.png`, `pose-*-dark-560-dpr3.png`, `edge-*`.
- **tsc** `--noEmit`: exit 0 (`evidence/tsc.log.txt`). **vitest run**: 34 files, 342 tests passed (`evidence/vitest.log.txt`). **build** (`.tmp/w2.vite.config.ts`): OK (`evidence/build.log.txt`). **vite preview** of that build on :5612: SW active, precache and offline checked above; preview stopped.
- Scope: no change to `package.json`, lockfile, `src/scene`, masters, other poses, pose mapping or animation. Tests: none assert on these assets, so none changed.

## 6. Open items

- The cheering fit stretches width +3.9 % to hold the old footprint (section 4); a uniform-scale option is available if LEAD prefers fidelity to footprint.
- Ground shadow is CSS on the Stage only (as before); no shadow added on Home/Welcome/Settings.
- Not mine: the full REFERENCE -> BEFORE -> AFTER capture set (390x844, 375x667, 1440x900, light/dark, 200 % text, reduced motion) and the pose-switch sequence belong to the capture lane. Footprint numbers above are the numeric proof that nothing moves on a pose switch.
- No budget request.
- Branch tip and tree hashes are in the hand-back message.
