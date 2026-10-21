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
