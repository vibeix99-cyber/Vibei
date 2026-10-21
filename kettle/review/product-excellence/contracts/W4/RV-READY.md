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
