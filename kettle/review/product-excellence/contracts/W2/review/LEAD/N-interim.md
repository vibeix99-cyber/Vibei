# LEAD, maker N: interim notes (no verdict yet)

Revision `pe/w2-room@fc9f6d8` (code `5d7bb23`), src `81cd36e` = trial merge `2acc218` src (verified `git rev-parse`).
Trial merge vs `fc9f6d8`, and `cb79496` vs `90a11e5`: only `kettle/review/**` differs (verified).

## Diff review (done, by me)
- Files changed outside review/: `scene/Fallback.tsx`, `scene/index.tsx`, `scene/stills/items.json`, `scene/stills/items/*.webp` (40),
  `screens/nook/NookScreen.tsx` + `.module.css`, `scripts/stills/render-item-layers.mjs`, `scripts/stills/window.html`, `tests/w2-room.spec.ts`.
  All inside N's ownership (scene/**, screens/nook/**, scripts/stills/**, new spec). No toast, engine, material, lighting, art, Stage, FocusScreen, Summary or Home file.
- `window.html`: default behaviour unchanged (items default empty, `run` default on).
- `WindowStill` paints an absolutely positioned `<svg xMidYMid slice>` over the unchanged base `<img>`; `NookStatic` window mode passes `items`.
  `Stage.tsx` already filters `teaSet` (NOT_IN_BACKDROP) and passes `items`; `NookScene.tsx:196` loading fallback also passes `items`. So 3D off, loading and context-lost all get layers.
- `useStaticNook()` = tier off || !hasWebGL(). Static hint "A drawing of your room" with own seen key; dismissal = `onPointerDown` on the stage (same as before).
- "Existing pre-rendered item images": none existed at `90a11e5` (only the 12 base `window-*.webp` stills). The layers are renders of the existing 3D items through the base stills' own pipeline; no painted/new art. Interpretation accepted (to confirm visually).
- Accuracy note: packet says "only items.json and the URL map are bundled". In the trial build the 4 `shelf-*.webp` layers (< 4 KB) are inlined as base64 in `assets/scene-*.js` (Vite assetsInlineLimit): scene chunk 8,786 B → 33,087 B (gzip 3,779 → 17,286 B). Lazy route chunk, not modulepreloaded in index.html. Minor; precache webp count 21 → 57 (36 files + 4 inlined).

## 375x667 "room disappears"
- Engine paths read (NookScene.tsx lifecycle, Engine.ts setRunning/invalidate/onContextLost). Pending: my own control reproduction attempts.

## Pending
- Own same-session captures control :5330 vs trial :5350 (probe `/home/user/wt/w2t-n/kettle/.tmp/LEAD/n-cap.mjs`, written, not yet run).
- CHAI-3D-SPEC accuracy check vs chai.ts / kit.ts / Engine.ts.
- Interrupted at orchestrator request to rule on H first.

## Update (after the H verdict)
- CHAI-3D-SPEC checked against `90a11e5` chai.ts / Engine.ts / kit.ts / layout.ts / three 0.186.1: geometry, placements, materials,
  roughness/emissive, pose table, update() constants (breath 0.035/0.018, hop 1/2.2 s = 0.45 s, lift 0.16, blink 4.2 s / 0.13 s, roll 0.02),
  STILL_T 7.35, root scale 1.12, cushion (-0.95, 1.15), baseY 0.255/0.05, rotation 0.62, proxy 0.8×0.9×1.1 @ (0,0.4,0.05), FOV 30,
  BASE_AZ/EL 0.56/0.4, drag -0.46..0.3 / -0.14..0.12, zoom 0.72..1.12, WINDOW_CAM, tone mapping, lights, DARK_DIM 0.86, GLTFLoader
  extensions + error lines 1479/1622, draco 1.8 MB / basis 584 KB, manualChunks three, precache glob without glb: ALL ACCURATE.
  Stale line refs only: setPose `chai.ts:160–171` → actual 140–151; update `174–211` → 153–187; root.scale `chai.ts:197` → 190.
  Completeness vs brief: all six asked topics present + judging method (IoU, proportions, checklist). Verdict on doc: complete, accurate (minor refs).
- Lane N RECEIPT (23:46) §2 reports a trial-only loading artifact: item layers paint before the base still decodes (items float on the
  bare sky gradient), 390×844 ~2.5 s, 1440 ~1.5 s, under load 12–14. Frames opened by me: `LN/runs/sheets/loading-390x844-light-floating-items-before-still.jpg`
  (t1137, t1363: items on bare gradient; t3641 room) and `loading-844-1440-trial-early-frames.jpg` (1440: shelf alone at 3077 ms, all items 3939, room 4646).
  Control shows the bare gradient in the same window (pre-existing), without items. Cause: base `<img decoding="async">` and the layers load
  independently; shelf layers inlined (data:) paint first. Own reproduction queued (`.tmp/LEAD/n-float.mjs`).
- Lane N §1: 0→5 layers at 12/12, position within ±2 px, light rows close; dark rows weaker vs low-tier live (pre-existing tier mismatch;
  at high tier as-seen diff 3.0). Baked ♪ note in the record-player layer (static, blurred).
