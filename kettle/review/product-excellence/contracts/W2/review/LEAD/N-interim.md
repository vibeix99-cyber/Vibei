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
