# W4 maker RV (Opus, normal intensity): the animated Rive Chai

**Binding:** Vibei's W4 brief, below. Light process: one maker, one Opus review, targeted captures only. Merge on APPROVE. The Final Product Boss stays on hold.

**Source** (Vibei's commit `2b8e753`, now integration HEAD): `kettle/art-src/chai/rive/`
- `chai.riv` (45,395 B), `README.md`, `src/scene.rml`, `src/gen_scene.py`.
- **Artboard** `Chai`, 1312×1586 (the old images are 992×1586, plus 160 px of empty margin on each side for the cheering arms).
- **State machine** `Chai`.
- **Pose:** view-model number `pose` (0 reading, 1 sipping, 2 cheering; −1 = unset), with the state-machine number input `pose` as fallback.
- No scripting.
- **The README's JS snippet was NOT tested.** Verify every API name against the installed runtime's actual `.d.ts`.
- **Note:** the file has its own `groundShadow` layer. Today the Stage has a theme-aware CSS contact shadow (`.cShadow`). Do not double the shadow; say what you chose.

## Requirements (Vibei's)
1. **FIRST, the watermark check.** Load `chai.riv` in the real web runtime (headless Chromium is fine; a real GPU is not needed for canvas2d) and confirm whether any Rive splash or watermark appears.
   - Capture the canvas at several moments: the first frame, about 1 s, about 5 s, and each pose.
   - **If any watermark or splash appears, STOP:** commit your evidence and hand back. Vibei will get a Cadet plan and publish a clean file.
2. **Runtime.**
   - Use the official Rive web runtime, `@rive-app/canvas` or `@rive-app/react-canvas`. Justify the choice and its bundle size, gzip and raw, JS and wasm.
   - **Lazy-load it:** it must not be in the initial bundle or the first paint. Show the built chunk graph.
   - **Self-host the `.wasm`** (no CDN fetch; check the network log for zero requests to `unpkg`, `jsdelivr` or `rive.app`).
   - **Precache** both the `.wasm` and `chai.riv` in the PWA, so Chai animates offline.
3. **Mapping.**
   - List every place the 2D Chai reading, sipping and cheering images show today, with file:line. `src/art/PaintedChai.tsx` is the renderer; see also `art-src/chai/README.md`, `docs/areas/art.md` and `contracts/W3R3/C2/C2-READY.md` §1, the previous inventory of 15 definitions and 11 surfaces.
   - Keep the same pose in each place.
   - Drive the pose through the view-model `pose`, with the input as fallback if needed.
   - Other poses (happy, stretch, look, sleep, concerned, happy-face) stay as WebP; they are not in this file.
4. **Footprint.** Chai's body must keep the exact on-screen size and position of the current images.
   - Scale by height, so the 992-wide body region maps onto the old box. The current WebP boxes come from `PAINTED` in `PaintedChai.tsx`; read how the box and the art's ink relate.
   - The extra 160 px side margins may overflow the box for the cheering arms. They must not change layout, must not block taps (`pointer-events: none`), and must not be clipped by a parent; check `overflow` up the tree on each surface.
   - **Prove it numerically:** the body's ink box and baseline vs the current image, ≤ 1 CSS px, per surface.
5. **Fallback.** Show the current WebP image:
   - until Rive's first frame (no blank flash, and no layout shift at the swap);
   - if Rive or the wasm fails;
   - whenever reduced motion is on (a static image, no runtime loaded).
6. **Performance.**
   - Pause when the tab is hidden or Chai is off-screen (`IntersectionObserver`).
   - Cap the device-pixel ratio sensibly (e.g. ≤ 2), and say what you chose.
   - Stay smooth on a low-tier phone profile: CPU throttle ×4, and report the fps.
   - **Report** the added bundle size and the idle CPU, Chai animating vs the old static image (for example `performance` or CDP `Performance.getMetrics` TaskDuration over 10 s).
   - The 3D Nook already loads lazily; keep the two from both running where they share a screen, if any.
7. **Tests.**
   - fallback (Rive fails → image);
   - reduced motion → image, with no runtime request;
   - offline after the first load (SW precache: Chai animates offline);
   - pose mapping per screen;
   - the existing suites green: tsc, full vitest, the chromium project (or at least `w2-home`, `integrity`, `summary-notice`, `toast-room`, `chai3d`, `w3r2-stale-tab`), plus timer/PWA (pwa on a port you checked is free).

**Evidence**, targeted, no full matrix:
- **Before / after captures** at 390×844, light and dark, of each pose's screen: Focus running (reading), the tea break (sipping), and the whistle and summary (cheering). BEFORE is :5560.
- **A short frame strip or screen recording** of each pose animating, and of switching from cheering to reading (2→0).

## Setup
- **Worktree** `/home/user/wt/w11`, branch `pe/w4-rive-chai`, base `2b8e753`. It is sparse (`kettle/{src,tests,scripts,public,art-src,docs}` plus kettle root files).
- **`node_modules`:** this worktree has none. Run `npm ci` in `/home/user/wt/w11/kettle` to get its own copy, then add the runtime with `npm install`. **Do not touch `/home/user/Vibei/kettle/node_modules`**, which the other worktrees share.
- **`package.json` and the lockfile** may change for the Rive runtime only.
- **BEFORE:** :5560 (dev) / :5570 (preview), integration `2b8e753`.
- **Your servers:** dev :5651, preview :5652 (`npx vite build --config .tmp/w2.vite.config.ts --outDir /tmp/rv7-servers/dist-w11 --emptyOutDir`, then `vite preview`).
- **Playwright:** Chromium in `/opt/pw-browsers`; never run `playwright install`.

## Rules
- **Slot gate:** every browser run goes through it: `python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane RV --n 1|2 -- <cmd>`.
- **Processes:** never `pkill -f`; kill only your own explicit PIDs, and leave nothing running at hand-back.
- **Commits:** commit locally in stages on the branch; never push. End every message with these two lines:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01Wn1tcRYjBrm68QxmGYwD9K
  ```
  No AI model names anywhere.
- **Packet:** `/home/user/Vibei/kettle/review/product-excellence/contracts/W4/RV-READY.md`, in stages:
  - §0 watermark;
  - §1 inventory;
  - §2 runtime and loading;
  - §3 footprint numbers;
  - §4 fallback and reduced motion;
  - §5 performance;
  - §6 tests;
  - §7 captures and strips;
  - §8 open items.

  Evidence goes beside it in `W4/RV/`; each file ≤ 20 MB. Commit each stage with `/tmp/rv7-servers/commit-evidence.sh <absolute path> "<msg>"`.
- **Hard stop:** 3 h, **21:15 UTC**.
