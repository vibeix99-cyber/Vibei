# W4 checker (LEAD-9): the animated Rive Chai

**Under review:** `pe/w4-rive-chai@1a7b797` (worktree `/home/user/wt/w11`). **Trial:** `64ad821` (`/home/user/wt/w11tr`), preview :5662, dev :5661.
**BEFORE:** :5560 / :5570.
**Logs and captures:** `W4/review/LEAD9/`; probe scripts in `review/LEAD9/tools/p*.mjs`.
**Browser runs:** all went through the slot gate, lane LEAD9, on headless Chromium 1194 with the default flags. No servers were started or left running.

## Verdict: **REJECT** (one fix round, 90 min)

The integration is sound: the runtime is clean, there is no CDN request on any path, offline works, and the poses map correctly. Two bugs are visible on screen, and the maker's tests missed both:

- **B1:** the Rive canvas draws over the still-visible WebP before it is revealed.
- **B2:** the Chai blanks and flickers on every pose change on the Stage.

The CPU cost also needs a frame-rate cap (**B3**).

## Rulings by point

1. **Watermark: CLEAN** (`wm-dark-*.png` with `*-canvas.png` raw buffers; `p1-dark.json`).
   - I captured the canvas on :5662 (dark) at:
     - the first reveal;
     - +1 s and +5 s (reading);
     - the summary (cheering);
     - the break (sipping);
     - 24 frames through the whistle.
   - No logo, badge, splash or text appeared in any frame. The raw canvas is transparent: 0 opaque pixels on the top and bottom rows.
   - The DOM holds only the app's canvases: no iframe, no injected node, no "rive" text.
2. **No CDN: PROVEN** (`p6-failure-cdn.json`, `p7-offline.json`, `p1`, `p8`).
   - **Method:** every request not to 127.0.0.1 was aborted and logged.
   - **Paths tested:** normal load, wasm aborted, wasm garbage (CompileError), wasm 404, wasm truncated, riv garbage, and offline with the service worker.
   - **Result:** **0 external requests on every path.** On a failure, the wasm is retried only at the local hashed URL (twice per load), and the Chai falls back to the image.
   - **Why:** the runtime's fallback (`rive.js:227–235`) runs only when `wasmFallbackURL !== null`, and `riveChai.ts` sets it to `null` before the first `awaitInstance()`.
   - **The CDN strings:** the `unpkg` and `jsdelivr` strings in the chunk are dead static defaults, overwritten before use. The `rive.app` strings are documentation links. `enableRiveAssetCDN: false` covers the CDN asset loader. **Not a defect.**
3. **Lazy loading, self-hosted wasm, precache: PASS.**
   - `index.html` has no Rive modulepreload. `RuntimeLoader` and the CDN strings live only in `riveChai-*.js`.
   - Offline test (`p7`): the SW is active, the cache holds `riveChai-*.js`, `rive-*.wasm` and `chai-*.riv`. I set the context offline and reloaded; the Stage renders Rive, its canvas keeps changing, and nothing goes to a CDN.
4. **Mapping: PASS.** Every pose matched what it should be (`p1`, `p8`, `p10`, `p12`):

   | Surface | Pose | Render |
   |---|---|---|
   | Stage running | reading | rive |
   | Stage whistle | cheering | rive |
   | Stage summary | cheering | rive |
   | Stage break | sipping | rive |
   | Stage "over" | stretch | image, correct |
   | Home hero | sipping | rive |
   | Welcome sound step | sipping | rive |
   | Welcome ready | cheering | rive (105×144) |

   The non-Rive poses (happy, look) stay WebP.
5. **Footprint: ACCEPTED as is.**
   - **Why the cheering body is wider:** the extra width comes from the file, not from the maker's fit. The Rive cheering body is the same sitting body as reading: rest-body height 1372 vs 1401 artboard px, and the same belly extents. The painted cheering is a narrower figure for its height: at the Stage size the belly is 83.3 wide over a 419 sheet-px ink height, against Rive's 92.3 at the same height. So no uniform scale can match both height and width.
   - **Why it meets the requirement:** Vibei's binding rule is "scale by height". Baseline, height and centre stay ≤ 1.29 px over 39 places, which meets it.
   - **The alternative is worse:** one k for every pose would grow cheering about 11 % taller.
   - **Layout, taps and clipping:** pose-box rects are identical BEFORE and AFTER, `pointer-events: none` is verified, and no clipping ancestor was found.
   - Flagged to Vibei as a FOLLOW-UP; see F1.
6. **The load-time patch: ACCEPTED for now, with a FOLLOW-UP to replace it with Vibei's transparent file.**
   - **Why it is acceptable now:**
     - A unit test ties the shipped `.riv` to `art-src` byte for byte, and another proves exactly 1 byte changes.
     - The runtime is pinned exactly (`"@rive-app/canvas": "2.45.0"`).
     - A missing private `artboard` throws, and the Chai falls back to the image (fails safe).
   - **On the dark theme:** no cream shows at any frame (raw buffers: transparent corners; screenshots: no disc and no rectangle).
   - **Two silent gaps** (F2):
     - `transformComponent('groundShadow')` returning null is skipped silently;
     - a republished file whose background is not `FFFDF9F1` would skip the clear silently.

     Both can only happen with a new `.riv`. Close them with Vibei's transparent file, or with a corner-alpha check after the first frame that fails to the image.
7. **Fallback: FAIL (B1, BLOCKS), plus a latent stale-state bug (B4, folded into the fix).**
   - **On failure: PASS.** The image is visible and loaded, and the canvas is removed (`p6`).
   - **Reduced motion:** by code (`riveOn` requires `!reduced`, so `LiveChai` never mounts), plus the maker's e2e test (0 runtime requests). I did not re-run it.
   - **"Until the first settled frame": FAILS.** During the 2.0–2.7 s hold the canvas is `visibility: visible; opacity: 1` and **draws on top of the visible WebP**.
     - Kit, cheer@168 and sip@168, compositor frames: `prereveal-cheer-sheet.png` and `prereveal-sip-sheet.png`.
     - What shows: a **reading Chai with the green book superimposed on the cheering and sipping image**, then a cross-blend of two Chais, until the swap.
     - Where it hits: every sipping or cheering mount (Home hero, Welcome, Settings, Kit, and a Stage mounted mid-break or mid-summary).
     - The e2e "swap watcher" checks only that the canvas has ink at the swap, so it cannot see this.
   - **The hold itself is ACCEPTED** (the state machine enters on reading) once the canvas is hidden during it.
   - **The whistle's mid-raise: ACCEPTED.** It is the file's designed reading → rest → arms-up blend: arms are up about 1 s after `finish()` in `whistle-dark-*.png`. The CSS hop still plays. If Vibei wants an instant cheer, that is a file change (F3).
8. **Performance: pauses PASS, cost needs a cap (B3).**
   - I reproduced the cost on :5662 (`p13-perf.json`):

     | CPU throttle | Rive (ms/s main thread) | static image (ms/s) | page fps with Rive |
     |---|---|---|---|
     | ×1 | 244 | 101 | 60 |
     | ×4 | 951 | 421 | 48 |

   - At ×4 the main thread is **95 % busy**, for a screen meant to stay up for 25 minutes. The reading loop is slow (a page turn and a leaf), so 60 fps buys nothing.
   - **A frame-rate cap is required:** 30 fps.
   - DPR cap 2, IntersectionObserver, visibility and the 3D-exclusive pause: as the maker reported (code read; hidden and off-screen pauses are measured in the maker's `RV/perf`).
9. **Tests and evidence: INSUFFICIENT for B1 and B2.**
   - The unit tests (byte patch, fit, scene3d) are meaningful. The e2e covers fallback, reduced motion and offline well.
   - **The captures:** the 16 BEFORE/AFTER PNGs and the strips are real and correct for what they show, but they are all settled states. None catches the pre-reveal overlay or the pose-change blanking.
   - **B2 evidence:**
     - `screencast-light/whistle-010..019.png` and `break-079..088.png` are compositor frames with **no Chai at all**: ~170 ms continuous, then alternate frames blank for ~0.5 s.
     - `p3-light.log`: a ResizeObserver registered after `LiveChai`'s observer, i.e. the canvas as it is about to be painted, found **37 of 67 frames empty while the image is hidden**.

## B2 root cause
On a pose change, `.rive` transitions `left/top/width/height` over 0.5 s. The flow on each frame:

1. `ResizeObserver` fires, and `resize()` sets `canvas.width/height`, which clears the buffer.
2. `r.drawFrame()` is a **no-op while playing**, because `rive.js:7434` draws synchronously only when `!this.frameRequestId`.
3. The browser paints an empty canvas.

This repeats on every frame of the transition. It hits:
- focus → whistle;
- summary → break;
- any later Rive-to-Rive pose change.

## Residuals

| # | Item | Class |
|---|---|---|
| B1 | Canvas visible and drawing over the WebP during the settle hold (reading Chai with book over sipping/cheering image) | **BLOCKS** |
| B2 | Chai blanks/flickers for ~0.5 s on every Stage pose change (resize clears the canvas; `drawFrame` no-op while playing) | **BLOCKS** |
| B3 | No frame-rate cap: +143 ms/s at ×1, main thread 95 % at ×4 on a 25-min screen | **BLOCKS** (fix in round) |
| B4 | `riveUp` is never reset when `LiveChai` unmounts (pose leaves the Rive set, e.g. break → over → focus, or reduced motion toggled on then off), so a fresh canvas starts with the image already hidden. Not visible today (reading settles at 0 ms); becomes a blank once B1 hides the canvas | **BLOCKS** (part of the B1 fix) |
| F1 | Cheering body +3.3 to +10.4 px wider than painted (inherent to the file under scale-by-height); Vibei to accept or change the art | FOLLOW-UP (Vibei) |
| F2 | Load-time patch: replace with Vibei's transparent file (and a way to hide `groundShadow`); until then, optionally add a first-frame corner-alpha guard that fails to the image | FOLLOW-UP |
| F3 | Whistle shows the reading → arms-up blend (~1 s); an instant cheer needs a file change | FOLLOW-UP (Vibei) |
| F4 | Wasm retried locally on failure (2 fetches per mount attempt; each new Chai mount retries after a failure). Harmless, but a session-wide "failed" latch would avoid it | FOLLOW-UP |
| A1 | CDN strings in the chunk (dead defaults; fallback disabled; 0 external requests on 7 paths) | ACCEPTED |
| A2 | Lazy chunk, self-hosted wasm, precache, offline animation | ACCEPTED |
| A3 | Footprint (baseline/height/centre ≤ 1.29 px, no layout change, `pointer-events: none`, no clipping) | ACCEPTED |
| A4 | Start-on-reading hold of 2.0 / 2.7 s for sipping/cheering, once the canvas is hidden during it | ACCEPTED |
| A5 | Bundle: +1.4 kB gzip initial; runtime 70 kB + wasm 866 kB gzip, lazy | ACCEPTED |
| A6 | `w2-summary` single flake (passed on repeat; passes on BEFORE) | ACCEPTED (watch) |

## Fix packet: one round, 90 min, on `pe/w4-rive-chai`

**FX1 (B1 + B4): hide the canvas until the reveal, and reset the reveal state per Rive mount.**

- **Hide:**
  - In `LiveChai`/`PaintedChai`, the canvas gets `visibility: hidden` until `onReady`, e.g. a `data-ready` attribute plus a CSS rule, or a prop.
  - The image stays visible until the same commit that shows the canvas.
  - Hide and show must flip in one React commit, so no frame shows both or neither.
  - Optional: a 150 ms opacity cross-fade (canvas in, image out) to soften the pose difference at the swap. If you add it, the image must stay fully opaque until the canvas is fully drawn.
- **Reset:**
  - Reset `riveUp` to `false` whenever `riveOn` goes false or `LiveChai` remounts. Simplest: hold `riveUp` inside a keyed child, or reset it in an effect on `riveOn`.
  - A fresh canvas must never start with the image hidden.
- **Test, in `tests/w4-rive-chai.spec.ts`:** sample on every rAF from mount to reveal for a sipping and a cheering Chai (Kit `#/kit?view=pose&pose=sip|cheer&size=168`, scrolled into view).
  - Assert that while `data-chai-render=image`, the canvas's computed visibility is `hidden` (or its opacity is 0).
  - Assert that after the swap the image is hidden and the canvas has ink.
  - Add the break → over → focus path and assert there is never a frame with the image hidden and the canvas empty.

**FX2 (B2): no empty painted frame on a resize or pose change.**

- **(a)** In `riveChai.ts` `resize()`, after changing the backing size, redraw synchronously even while playing: `r.stopRendering(); r.drawFrame(); if (running) r.startRendering();`.
  - Check against `rive.js:7434` and `:8657–8686` that this draws now and resumes the loop.
  - Check that `_explicitlyStoppedRendering` does not break the visibility and IO pauses.
- **(b)** Stop transitioning `width/height` (it reallocates the backing store on every frame). Either:
  - re-fit instantly at the pose change, which is acceptable because Rive blends through rest anyway; or
  - animate a `transform` (translate + scale) from the old box to the new one, with the backing store sized once.
- **Test:** register a `ResizeObserver` on the canvas after `LiveChai`'s observer, as `review/LEAD9/tools/p3.mjs` does. Run focus → whistle → summary → break on the Stage and assert **0** callbacks where the image is hidden and the canvas has 0 ink.
- **Evidence:** a CDP screencast of the same path (as `p4.mjs` does), showing Chai present in every compositor frame. Report the minimum Chai-pixel count per frame.

**FX3 (B3): cap Rive at 30 fps.**

- The high-level runtime has no fps option.
- **Approach:** drive the frames yourself while running.
  1. `stopRendering()` after load.
  2. Run your own rAF loop that, when ≥ 33 ms have passed, calls `r.drawFrame()` then immediately `r.stopRendering()`. `draw()` advances by the real elapsed time (`lastRenderTime`) and would otherwise re-schedule itself.
  3. Pause and hide stop your loop.
- The private-method route is not allowed. If the public-call route does not hold, say so with evidence and stop; do not ship a half-cap.
- **Report** with `review/LEAD9/tools/p13.mjs` on your preview: ms/s and fps at ×1 and ×4, Rive vs `?rive=0`. The target is roughly half the Rive delta: about ≤ +80 ms/s at ×1, and page fps ≥ 55 at ×4.
- **Visual check:** a frame strip of reading and cheering at 30 fps; motion must still read as smooth.

**FX4: regressions.**

- tsc and full vitest.
- Chromium: `w4-rive-chai`, `integrity`, `w2-home`, `w2-summary`, `summary-notice`, `toast-room`, `chai3d`, `w3r2-stale-tab`.
- `pwa` on a port you have checked is free.
- Re-shoot the 8 AFTER captures, plus the two pre-reveal sheets and the two pose-change screencasts after the fix.
- Update RV-READY §4, §5 and §6.

**Out of scope for the round:** F1–F4. Do not touch the `.riv`, the fit numbers, or `art-src`.

## Fix round: `pe/w4-rive-chai@58f54e0` (src `7b6fdde`), trial 2 `62bb1ba`, preview :5672: **APPROVE**

I read the diff `1a7b797..58f54e0`:
- `LiveChai.tsx`: a `shown` prop sets the canvas's `visibility` in the same commit as the image.
- `PaintedChai.tsx`: `riveUp` resets when `riveOn` goes false.
- `painted.module.css`: the size transition is removed.
- `riveChai.ts`: `drawNow()` redraws inside the ResizeObserver, plus a 30 fps rAF driver that uses only public calls (`play`, `stopRendering`, `drawFrame`).
- `package.json` and `art-src` are unchanged.

I re-ran my own probes on :5672 (logs in `review/LEAD9/fix/`):

| Probe | Before (1a7b797) | After (58f54e0) | |
|---|---|---|---|
| `p3` empty painted frames, image hidden (focus → whistle → summary → break) | 37 / 67 | **0 / 7** | B2 closed |
| `p4` screencast, min Chai pixels per frame (whistle + break, 150 frames) | ~2,400 (no Chai) | **6,041** (Chai in every frame) | B2 closed |
| `p5` break → over → focus, min Chai pixels | 7,628 | 7,628 (no blank) | B4 closed |
| `p11` pre-reveal, Kit cheer/sip @168 | reading Chai + book drawn over the image | canvas `hidden` until the swap; image only, then Rive (`prereveal-*-sheet.png`) | B1 closed |
| `p13` main thread, Rive − image, ×1 | +143 ms/s | **+92 ms/s** (187 vs 95) | |
| `p13` main thread, Rive − image, ×4 / page fps | +530 / 48.2 fps | +384 / **56.1 fps** | |
| `p14` canvas changes in 2 s: running / tab hidden / visible again | n/a | 60 / **0** / 61 (30 fps; pause holds) | |
| `p6` CDN on 6 paths (normal, wasm abort/garbage/404/truncated, riv garbage) | 0 | **0**; every failure falls back to the image | |

**FX3 ruling: 30 fps is ACCEPTED, and `FPS_CAP` stays 30.**
- My measurement is +92 ms/s at ×1, not the maker's +101. That is close enough to the "about +80" I asked for.
- The binding target, page fps ≥ 55 at ×4, is met (56.1).
- Headless raster runs in software on the main thread, so it overstates the cost a phone sees.
- 24 fps would make the hops and the page turn visibly choppier for about 30 ms/s more saving. If wanted, that is a one-constant FOLLOW-UP (F5), not a block.

**Swap:** at the reveal, the painted cheering gives way to the Rive cheering in one frame. The arms and body widths differ slightly (F1, inherent to the file). There is no blank frame and no double Chai; this is ACCEPTED.

**Residuals, updated:**
- B1–B4 → **closed**.
- F1–F4 → FOLLOW-UP, unchanged.
- **F5 (new): `FPS_CAP` 24** if a lower cost is ever wanted; it measured +65 ms/s.
- A1–A6 → ACCEPTED, unchanged.
- The `w2-summary` footer flake stays ACCEPTED (watch).

**Final verdict: APPROVE `pe/w4-rive-chai@58f54e0` for merge.**
