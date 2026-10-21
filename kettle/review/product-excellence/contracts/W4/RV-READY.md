# W4 RV-READY: the animated Rive Chai

Maker RV. Worktree `/home/user/wt/w11`, branch `pe/w4-rive-chai`, base `2b8e753`. Evidence in `W4/RV/`.

## §0 Watermark check: CLEAN (no splash, no watermark)

- Runtime: `@rive-app/canvas@2.45.0` (official), its own `rive.js` + self-hosted `rive.wasm`, fallback wasm URL disabled
  (`RuntimeLoader.setWasmFallbackUrl(null)`), headless Chromium 1194 (canvas2d), isolated harness page on :5651 (no app code).
- Canvas captured at the first rendered frame after `onLoad`, ~1 s, ~5 s, then each pose via the view model
  (`viewModelInstance.number('pose').value = 0|1|2`), twice per pose 3 s apart, plus a full-page capture:
  `RV/watermark/{t0-first-frame,t1s,t5s,pose0-reading(-b),pose1-sipping(-b),pose2-cheering(-b),fullpage-after-cheer}.png`.
- Result: every frame shows only Chai on a transparent canvas; no Rive logo, splash, badge or text in any corner or frame.
  DOM after the run holds only our `CANVAS#c` + 2 scripts (no injected overlay).
- Network (`RV/watermark/watermark-run.json`): exactly 4 requests, all to 127.0.0.1 (`index.html`, `rive.js`, `rive.wasm`,
  `chai.riv`); zero to unpkg / jsdelivr / rive.app.
- File contents as read by the runtime: artboard `Chai`, 13 animations, state machine `Chai` with one number input
  `pose` (default 0); 1 view model, auto-bound instance present, `pose` = -1 (unset). Matches the README.
- README snippet vs runtime 2.45.0 `.d.ts`: `viewModelInstance.number('pose').value` and `stateMachineInputs('Chai')`
  exist as written. `stateMachines:` still works but logs a deprecation warning; the app uses `stateMachine: 'Chai'`.

## §1 Inventory and pose mapping (base `2b8e753`; prior: W3R3 C2-READY §1, 15 definitions / 11 surfaces)

Definitions (file:line at base): `src/art/PaintedChai.tsx:14-16` (the 3 WebP imports), `:25` `PaintedPose`, `:28-31`
`PAINTED` boxes (311x487 / 302x491 / 312x428 sheet px), `:36-47` `SHEET_REF_H`/`SHEET_MARGIN`/`paintedBox`, `:62-82`
`PaintedChai` (span + `<img>` 100%), `painted.module.css:1-30` (`.pose`, `.img`, `.live`), `art/index.ts:3-4`,
`Mascot.tsx:602,604,605` (`focus->reading`, `sip->sipping`, `cheer->cheering`), `Mascot.tsx:617-620` (square box,
feet on its floor, `key={pose}`), `FocusScreen.tsx:56-59,293` (Stage map), `Stage.tsx:48,54-58,106` (`CHAI_SIZE` 186),
`Stage.module.css:155-166,209-214` (`.chai` box, `.cShadow`), `Summary.tsx:566` (`[data-stage-figure]`).
15 definitions, unchanged in meaning; none moved.

Surfaces (11) and the pose each keeps, now animated (Rive) unless noted:

| Pose | Surface | file:line | Rive? |
|---|---|---|---|
| reading (0) | Focus stage, running + paused | `FocusScreen.tsx:56,293` -> `Stage.tsx:106` | yes (`rive` prop) |
| reading (0) | Home hero, brew live | `home/chai.ts:87` -> `Hero.tsx:38` (`animate`) | yes |
| reading (0) | Kit gallery | `art/Gallery.tsx:72,81,106` | yes unless `animate=0` |
| sipping (1) | Focus stage, tea break | `FocusScreen.tsx:59,293` | yes |
| sipping (1) | Home hero: break live; evening goal met/progress/hello/idle | `home/chai.ts:90,103,144,147,156,162` -> `Hero.tsx:38` | yes |
| sipping (1) | Settings, About | `SettingsScreen.tsx:329` (Mascot default `animate`) | yes |
| sipping (1) | Welcome, sound step | `WelcomeScreen.tsx:288` -> `:206` | yes |
| sipping (1) | Kit gallery | as above | yes unless `animate=0` |
| cheering (2) | Focus stage, whistle + summary | `FocusScreen.tsx:57,58,293` | yes |
| cheering (2) | Welcome, notify granted + ready | `WelcomeScreen.tsx:291,294` -> `:206` | yes |
| cheering (2) | Kit gallery | as above | yes unless `animate=0` |

Rule (code): `PaintedChai` gets `rive?: boolean` (default = `animate`; the Stage passes `rive` because it never had
CSS breathing). Rive runs when `rive && !reducedMotion && pose in {reading, sipping, cheering}` and the runtime has
not failed; the pose number comes straight from `RIVE_POSE` (`LiveChai.tsx`), driven through the view-model
`pose` (input `pose` only if the view model is missing). The Stage keeps one instance across focus -> whistle ->
summary -> break (pose changes blend through rest); `Mascot` keeps `key={pose}`, so Home/Welcome remount per pose.
Not touched (stay WebP): happy, stretch, look, sleep, concerned, happy-face (`ChaiFace`), and the vector/3D Chai.
`?rive=0` in the URL forces the painted images (diagnostics, BEFORE/AFTER captures).

## §2 Runtime and loading

**Choice: `@rive-app/canvas@2.45.0` (exact pin), used directly (~230 lines in `src/art/rive/riveChai.ts` + `LiveChai.tsx`).**
- Why canvas (Canvas2D renderer), not webgl/webgl2: the 3D Nook owns WebGL; Chai never takes a second GL context. Why not
  `@rive-app/react-canvas` (4.37.0): it is a hook wrapper over this same package (same JS + wasm), and we need our own
  lazy import, pause gates and pose/geometry control anyway, so it would add code without removing any.
  (`@rive-app/canvas-lite` is smaller but is not on the brief's list; open item §8.)
- Sizes (production build, `RV/perf/build-sizes.txt`):

| asset | raw | gzip (-9) | when |
|---|---|---|---|
| `riveChai-*.js` (runtime JS + our glue) | 278,375 B | 70,025 B (Vite: 71.07 kB) | lazy, on the first eligible Chai mount |
| `rive-*.wasm` (self-hosted) | 2,096,365 B | 866,432 B (Vite: 884.36 kB) | lazy, with the runtime |
| `chai-*.riv` | 45,395 B | 18,041 B | lazy, with the runtime |
| initial bundle (entry + modulepreloads + CSS) | 757,907 -> 760,950 B (+3,043) | 233,291 -> 234,695 B (+1,404) | `RV/perf/initial-bundle.txt`: :5570 vs :5652 |

  The +1.4 kB gzip initial delta is `LiveChai` + the pose fit + the 3D-running store + a 0.3 kB rolldown runtime chunk.
- **Lazy, not in the first paint:** `LiveChai` calls `import('./rive/riveChai')` in an effect; `index.html` has no
  rive reference and no modulepreload for it (`RV/perf/initial-bundle.txt`). Home on :5652 (`RV/perf/lazy-load-home.json`):
  FCP 960 ms; `riveChai-*.js` requested at 1,262 ms, wasm 1,397 ms, riv 1,399 ms. Chunk graph: the `import()` sits in
  the `NookFallback-*` chunk (Vite's art grouping) and points at `riveChai-*.js`, which alone holds the runtime and the
  wasm/riv URLs (`grep RuntimeLoader` hits only that chunk).
- **Self-hosted wasm, no CDN:** `RuntimeLoader.setWasmUrl(<hashed asset>)` and `setWasmFallbackUrl(null)` (the default
  fallback is jsdelivr); `enableRiveAssetCDN: false`. Network logs: 0 requests to unpkg / jsdelivr / rive.app in the
  watermark harness, all four BEFORE/AFTER flows (`RV/captures/*-rects.json`, `cdn: []`), the e2e spec and the offline
  PWA test (both assert it).
- **Precache:** `vite.config.ts` globPatterns `+riv,wasm` (max file size was already 6 MiB). Build: 123 entries,
  5,443.89 KiB (was 119 entries in W3R3). `pwa.spec.ts` asserts `chai-*.riv`, `rive-*.wasm`, `riveChai-*.js` in the
  cache and that Chai animates offline (§6).
- **Two load-time fixes to the file, both guarded** (a miss = load error = painted image):
  1. The artboard has an opaque cream **Background fill** (`FFFDF9F1`, `gen_scene.py:896`). Found when measuring ink: the
     whole 1312x1586 canvas was opaque. On the dark theme and over the Stage it would be a cream rectangle. The shipped
     `chai.riv` stays byte-identical to `art-src` (unit test); after fetch, `clearBackground()` sets that one fill's
     alpha byte to 0 (the 6-byte sequence `12 25 F1 F9 FD FF` = SolidColor / colorValue occurs once; unit test proves
     exactly 1 byte changes). A republished transparent file is left alone.
  2. **Shadow choice:** the file's `groundShadow` is an opaque `EEE6DC` ellipse (light disc on dark). The app keeps the
     Stage's theme-aware CSS `.cShadow`; the file's shadow is collapsed at load (`scaleY = 0`; `gen_scene.py` keys only
     its `scaleX`/`opacity`, never `scaleY`). This needs the runtime's private `artboard` (no public node API in the
     high-level class); the version is pinned and a missing artboard is a load error. No doubled shadow; elsewhere
     (Home, Welcome, Settings, Kit) the painted Chai never had one, and none is added.
- README snippet vs `.d.ts`: `viewModelInstance.number('pose').value`, `stateMachineInputs('Chai')`, `autoBind` all
  exist; `stateMachines:` is deprecated (warns), so the app passes `stateMachine: 'Chai'`.

## §3 Footprint (`RV/footprint/footprint.md`, raw `footprint-rows.json`, method `fp-lib.mjs`)

- Box and layout: `PAINTED`, `paintedBox`, the Mascot/Stage rules and the `<img>` are unchanged; the canvas is
  `position:absolute; pointer-events:none; max-width:none` inside the pose box, sized/placed in % of it
  (`rive/fit.ts`). At the swap only the img's `visibility` changes. BEFORE :5560 vs AFTER :5651 pose-box rects on the
  Stage (`RV/captures/*-rects.json`): identical (0.000 px) in focus/whistle/summary/break, light and dark (one BEFORE
  dark focus sample was taken mid-entrance at y +1.63; the AFTER value equals the BEFORE light value).
- Mapping (scale by height): artboard feet (y 1452) -> the painted ink baseline, body centre (x 656) -> the painted ink
  centre, scale k = painted ink height / Rive body height at rest: reading 479.0/1401, sipping 481.4/1408 (the same
  k, 0.3419: one body size), cheering 419.2/1372 (0.3055: the painted cheering is drawn smaller; kept).
  Artboard body extents measured at 1:1 (`footprint/rive-artboard-ink-1to1.json`); reading matches the C2 master ink.
- Measured, Rive ink vs painted ink in the same box, 39 places (Stage x3, Home hero brew live + evening, Settings
  About, Kit at every Mascot size a screen uses: 72, 76, 84, 88, 108, 112, 120, 148, 152, 168, 200 x 3 poses), CSS px:
  - **baseline <= 0.34**, **centre <= 0.66**, **height <= 0.69** for reading/sipping and <= 1.29 for cheering (its top
    is the bouncing yuzu: ground-frame tops range about +-3 px on the Stage), ink top median <= 1.22.
  - **Width is not held** (scale by height): reading/sipping belly width within 1.55 px (the WebP carries W3R3's
    -1.5 % / -1.2 % stretch); **cheering's Rive body is wider: +3.3 px at 72 to +10.4 px at 200 (+9.0 on the Stage)**.
    That is the art: the Rive cheering body is the same sitting body as reading, while the painted cheering is narrower
    at the same height. Open item §8 (an alternative is one k for all poses: same body size everywhere, cheering
    ~11 % taller than today).
  - Overflow: no ancestor clips the Rive ink union in any of the 39 places (Stage: 2 clipping ancestors checked; the
    cheering arms overflow the pose box sideways and stay inside them). Canvas `pointer-events: none` everywhere.
    Welcome (cheering 120-200 / sipping 84-148) uses the same Mascot box, measured in the Kit at those sizes; its
    `overflow: clip` `.stage` wraps the step body, not the Chai (`WelcomeScreen.tsx:198-206`).

## §4 Fallback and reduced motion

- Painted image until Rive's first settled frame: the img stays in flow and visible; it is hidden only when Rive has
  run long enough to settle in the requested pose (the state machine enters on reading; sipping settles ~1.65 s,
  cheering ~2.3 s per the frame strips; reveal after 2.0 / 2.7 s of running time) and a frame has been drawn. The e2e
  swap watcher asserts the canvas already holds Chai (> 500 ink px) at every swap and the layout box moved 0.
- Rive or wasm fails (`onLoadError`, `RuntimeLoader.awaitInstance` rejects, fetch fails, no pose property/input, no
  artboard): the canvas unmounts and the image stays for good (`riveFailed`). e2e: wasm aborted -> image; riv aborted
  -> image (both visible, no canvas).
- Reduced motion (system or Settings): `PaintedChai` never mounts `LiveChai`, so no import, no wasm, no riv. e2e: focus
  + summary under `reducedMotion: 'reduce'` show the image and the request log has nothing matching
  `riveChai|@rive-app|rive*.wasm|.riv`. `?rive=0` forces images too (BEFORE/AFTER idle-CPU baseline).

## §5 Performance (`RV/perf/`)

- Pauses: `IntersectionObserver` on the canvas, `visibilitychange`, and while any 3D Nook engine runs
  (`lib/scene3dLive.ts`, set from `NookScene.applyRun`): `pause()` + `stopRendering()`. Measured on the Stage (preview):
  tab hidden -> 0 Rive frames in 2 s, resumes (62 frames next 1 s); moved off-screen -> 0 frames in 2 s, resumes (51).
- DPR cap **2**: drawing surface = CSS size x min(devicePixelRatio, 2). At DPR 3 the Stage canvas is 326x394 for
  163x197 CSS px (2x). 2x is crisp for this art at these sizes and saves 56 % of the pixels a 3x phone would draw.
- Low-tier profile, Stage focus (reading), 390x844 DPR 2, Chromium headless, preview :5652, 10 s windows:

| | Rive fps | page rAF fps | main-thread TaskDuration | ScriptDuration |
|---|---|---|---|---|
| Rive, CPU x1 | 60.0 | 60.2 | 240 ms/s | 62 ms/s |
| static image (`?rive=0`), CPU x1 | - | 60.2 | 96 ms/s | 6 ms/s |
| Rive, **CPU x4** | **53.9** | 51.9 | 901 ms/s | 240 ms/s |
| static image, CPU x4 | - | 58.1 | 379 ms/s | 26 ms/s |

  Idle CPU cost of animating Chai: **+144 ms/s main thread at x1** (+56 ms/s script; the rest is canvas raster, which
  headless Chromium does in software on the main thread; a phone GPU rasterises Canvas2D off it), +522 ms/s at x4.
  Rive's own advance+draw is ~0.6 ms per frame (`fpsx.mjs`, isolated harness, 60 fps). With the SwiftShader GL flags
  the e2e config uses, raster goes through software GL and everything is slower (Rive 15 fps, page 13 vs 33 fps
  without Rive; `perf-preview-swiftshader.json`), an artefact of that flag set: the same page with default flags runs
  at 60. Open item: a 30 fps cap would roughly halve the cost; the high-level runtime has no fps option.

## §7 Captures and strips

- **BEFORE (:5560) / AFTER (:5651), 390x844, DPR 2, light + dark** (`RV/captures/`, `tools/cap.mjs`):
  `{before,after}-{light,dark}-{1-focus-reading,2-whistle-cheering,3-summary-cheering,4-break-sipping}.png`, with
  `*-rects.json` (pose box rects, render mode, CDN requests = none). Pose identical in all 8 pairs; AFTER renders are
  Rive in all 8. Box rects equal to 0.000 px except dark whistle (15.4 px: the existing CSS whistle hop is a transform,
  captured at a different phase; layout offsets are equal, see the e2e swap check).
  Captured with real time (no Playwright clock; see §8: a faked clock also fakes rAF time and slows Rive).
- Whistle note: the whistle is short (~2 s) and the file blends reading -> rest -> arms up in ~2.3 s (designed: every
  change goes through rest), so the whistle capture shows Chai mid-raise; the summary shows the full cheer.
- **Frame strips** (`RV/strips/`, isolated harness with the app's two load-time fixes, 164x198 per frame, time stamps):
  `loop-0-reading.png` (12 s, page turn + leaf), `loop-1-sipping.png` (9 s, sips + steam), `loop-2-cheering.png`
  (4.5 s, hops + sparkles + wave), `switch-2-to-0-cheering-to-reading.png`, `switch-2-to-1-cheering-to-sipping.png`,
  `switch-0-to-2-reading-to-cheering.png` (10 s, 250 ms steps). 2 -> 0: arms fold, rest, book fully back by ~2.0 s.
- Watermark captures: §0 (`RV/watermark/`).
