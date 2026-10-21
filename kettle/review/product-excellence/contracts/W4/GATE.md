# W4 gate record: the animated Rive Chai (light process)

## Start, 2026-10-21 18:10 UTC
- **Source:** Vibei's `2b8e753` ("Add Chai Rive character", parent `76686f8`) adds `art-src/chai/rive/{chai.riv (45,395 B, RIVE header), README.md, src/scene.rml, src/gen_scene.py}`. Fast-forwarded; integration HEAD `2b8e753`.
- **Runtime:** none installed (no `@rive-app`). The npm registry is reachable (`@rive-app/canvas` 2.45.0, `@rive-app/react-canvas` 4.37.0 at the time of the check).
- **Netlify:** no `netlify.toml` in the repo; the deploy is configured on Netlify's side.
- **Notes from the README:** it mentions `refs/` and `tools/`, which are not in the upload. The file has its own `groundShadow` layer, so the Stage's CSS shadow must not double it.
- **Servers:** :5560 / :5570 serve integration `2b8e753` (BEFORE, verified).
- **Maker RV** (Opus, normal intensity) launched; worktree `w11`, branch `pe/w4-rive-chai`, its own `node_modules` via `npm ci`; brief `BRIEF-RV.md`; stop 21:15 UTC.

## Maker RV: GATE PASSED, 2026-10-21 ~19:45 UTC
- **Revision:** `pe/w4-rive-chai@1a7b797` (3 commits), src `aa8c94f`. Packet `contracts/W4/RV-READY.md` (§0–§8), evidence in `W4/RV/`.
- **Watermark check (§0): clean.** No logo, splash or injected DOM; no requests to a CDN.
- **Scope (checked):**
  - `package.json` + lockfile (`@rive-app/canvas` pinned 2.45.0);
  - new `src/art/LiveChai.tsx` and `src/art/rive/*` (`riveChai`, `fit`, `pose`, `clearBackground`, with tests);
  - `PaintedChai.tsx` + CSS;
  - `src/art/chai/chai.riv`, byte-identical to `art-src`;
  - `lib/scene3dLive.ts` (pause Rive while 3D runs), with small hooks in `NookScene.tsx` and `Stage.tsx`;
  - `vite.config.ts` (precache);
  - `tests/w4-rive-chai.spec.ts`, plus a new offline test in `tests/pwa.spec.ts`.

  `art-src` is untouched.
- **Trial `64ad821`** = integration `2b8e753` + `1a7b797`, worktree `w11tr`, using the maker's `node_modules`.
  - tsc 0, vitest **352/352**, build OK.
  - Precache 123 entries, including `chai-*.riv` and `rive-*.wasm`, as local assets.
  - Dev **:5661**, preview **:5662**.
  - **Note:** the built `riveChai` chunk contains 3 CDN URL strings, probably the runtime's default fallback. The reviewer must confirm no CDN request ever happens.
- **The maker's numbers:**
  - runtime JS 278 KB (70 KB gzip), lazy; wasm 2.10 MB (866 KB gzip), self-hosted; `.riv` 45 KB; initial bundle +1.4 KB gzip;
  - FCP 960 ms, with the runtime fetched at 1,262 ms;
  - footprint over 39 places: baseline ≤ 0.34, centre ≤ 0.66, height ≤ 0.69 (cheering ≤ 1.29), no clipping, `pointer-events: none`;
  - **the cheering body is 3.3–10.4 CSS px wider** (+9.0 on the Stage);
  - fallback and reduced motion OK (0 runtime requests under reduced motion);
  - DPR cap 2; 60 fps at ×1, 53.9 fps at ×4;
  - **CPU +144 ms/s on the Stage** vs the static image;
  - tests green, with one `w2-summary` flake.
- **Points for review:**
  - the load-time patch: the cream artboard background's alpha is zeroed and `groundShadow` collapsed via the runtime's private `artboard`;
  - the cheering width;
  - the start-on-reading delay before sipping and cheering appear (2.0–2.7 s of WebP first);
  - the whistle showing a mid-raise;
  - the CPU cost.

## RV: REJECT (LEAD-9 `8c0819f`, `CHECKER-W4-RV.md`). One 90-minute fix round, from about 20:40 UTC
- **Passes:**
  - the watermark is clean on :5662;
  - **no CDN request on 7 paths** (normal, wasm aborted, garbage, 404, truncated, bad `.riv`, offline); the CDN strings are unused defaults, overwritten, with the fallback set to null;
  - the lazy load, the self-hosted wasm, offline animation, and the pose mapping.
- **ACCEPTED:**
  - the footprint (the extra cheering width is in the file; the scale-by-height rule is met);
  - the load-time patch, for now (FOLLOW-UP: Vibei's transparent file);
  - the whistle mid-raise and the settle hold, provided the canvas is hidden during the hold.
- **BLOCKS:**
  - **B1:** the canvas is visible over the WebP during the 2.0–2.7 s hold (reading Chai over sipping or cheering);
  - **B2:** Chai disappears for about 0.5 s on every Stage pose change (a width/height transition clears the canvas);
  - **B3:** no frame cap (+143 ms/s; 95 % main thread at ×4);
  - **B4:** `riveUp` is never reset on unmount.
- **Fix:** FX1–FX4 (hide until reveal; redraw on resize and no size transition; a 30 fps cap to about +80 ms/s and ≥ 55 fps at ×4; regression and captures).

## RV fix round: GATE PASSED
- **Revision:** `pe/w4-rive-chai@58f54e0` (`e6e402f`, `58f54e0`), src `7b6fdde`. Scope: the Rive wiring (`LiveChai`, `PaintedChai`, CSS, `riveChai.ts`) and `w4-rive-chai.spec.ts`. `package.json` and `art-src` unchanged.
- **Trial 2 `62bb1ba`:** tsc 0, vitest 352/352, build OK. Served on :5671 / :5672 (the first trial's :5661 / :5662 stopped).
- **The maker's claims:**
  - **FX1:** hidden until the reveal; reset on unmount.
  - **FX2:** 0 empty frames (was 37 of 67).
  - **FX3:** 30 fps cap. Cost +101 ms/s at ×1 (LEAD aim about +80); 56.0 fps at ×4 (≥ 55). Option: 24 fps gives +65 ms/s.
  - **FX4:** regression 109/111 (two explained misses); PWA 4/4.
- **Next:** LEAD-9's final verdict, including the FX3 ruling.
