# Maker N · Wave 2 round 1 · FIX ROUND · READY FOR REVIEW

**Finding** (`review/LN/RECEIPT.md:83`, Vibei's ruling): at brew start the earned-item layers could paint before
the base room still, so the items stood on the bare sky for 1–2.5 s. **Model:** Claude Opus 5.5 (`claude-opus-5-5`).

| | |
|---|---|
| Base of this round | `fc9f6d8` (kettle/src `81cd36ea83419e210f9360efea397153e1de7860`) |
| **Fix commit** | **`c381ccb`** (`c381ccb6015d856884e2cfb4f4e1d3e32d92f193`) |
| **`git rev-parse c381ccb:kettle/src`** | **`4b49254fa25be7f9e2e4f788b9ad93181d2c8ff6`** |
| Branch head | the commit adding this packet and `contracts/W2/N/fix/` on top of `c381ccb` (docs and evidence only) |
| Branch | `pe/w2-room`, `/home/user/wt/w2n` (not pushed, no history rewritten) |

## Changed files
- `src/scene/Fallback.tsx`: `WindowStill` holds the `<img>` in a ref. The effect calls `img.decode()` for the
  current `src`, and the layer `<svg>` renders only once that has resolved for that `src` (`roomReady === src`).
  A still that fails to load or decode leaves no items. A time or weather change hides the items until the new
  still has decoded. No new artwork, no other file.
- `tests/w2-room.spec.ts`: a new test, "items never stand on the bare sky". With 3D off it holds back only the
  base still's image request and checks every animation frame for 1.5 s for a layer `<image>` (expected 0), then
  releases the still and expects all layers to draw (`assertLayersDrawn`).

## Cause and fix
- **Cause** (as the lead found):
  - The shelf's four layer files are under Vite's 4 KB inline limit, so the build turns them into `data:` URIs in
    the eager `scene` chunk; the other layers are small and quick to load.
  - The base still is a hashed file with `decoding="async"`.
  - Both were mounted together, so the items could paint first.
- **Fix:** the minimal one of the two allowed. The layers are drawn only after the base room image has decoded.

## Results (raw numbers)
**(1) Under load, every frame.** Probe `fix/float.mjs`:
- **Setup:** production builds; a fresh context per brew start; CDP `Network.setCacheDisabled` (cold cache); CPU
  throttled **6×** from just before the tap.
- **Recording:** for 4 s after the tap, every animation frame logs the number of layers and whether the still has
  loaded. A "float" frame has layers but no loaded still.
- **Gate:** run through `slots.py --lane N --n 1`.
- Same probe, same conditions, old revision first:

| Brew start | `fc9f6d8` (old) :5233: float frames / first layer ms / still loaded ms | fix `c381ccb` :5213: float frames / first layer ms / still loaded ms |
|---|---|---|
| 390×844 #1 | **1** / 1336 / 1455 | **0** / 2245 / 1500 |
| 390×844 #2 | **5** / 1256 / 1366 | **0** / 1801 / 1028 |
| 390×844 #3 | **4** / 791 / 940 | **0** / 916 / 793 |
| 390×844 #4 | **1** / 1314 / 1456 | **0** / 1224 / 1136 |
| 390×844 #5 | **1** / 1482 / 1617 | **0** / 1221 / 947 |
| 1440×900 | **1** / 812 / 934 | **0** / 3422 / 870 |
| **Total** | **reproduced in 6/6** (13 float frames) | **0/6** (0 float frames); layers always after the still |

- The old revision's floats are counted only until the still *loads*; on screen they last longer, until it has
  also decoded and painted (the lead saw 1–2.5 s).
- With the fix, the first layer always comes after the still has loaded: 88–2552 ms later, which is the decode
  wait.
- Raw data: `fix/float-old-fc9f6d8.json`, `fix/float-new.json`.

**(2) Tests.**
- `tests/w2-room.spec.ts` on `c381ccb` (dev :5213): **7/7** (`fix/w2-room-c381ccb.txt`).
- The new test against `fc9f6d8`'s `Fallback.tsx` (swapped in temporarily, then restored): **fails, 2 frames with
  item layers but no base room** (`fix/w2-room-bare-sky-on-fc9f6d8-Fallback.txt`).
- `npx tsc --noEmit`: exit 0.
- `npx vitest run`: **267/267** (27 files).
- The full chromium suite was not run, as instructed.

**(3) Same-session BEFORE / AFTER early frames, 390×844@3 light.**
- Conditions: CPU 4×, cold cache, production builds; probe `fix/early.mjs`.
- Sheet: `fix/early-frames-390x844-before-after.jpg`. Raw frames: `fix/early-old-fc9f6d8/`, `fix/early-new/`
  (`early.json` per run).
- With the base still held back (a slow still file):
  - **BEFORE:** the shelf, books, fairy lights, pothos and record player float on the bare sky (5 layers, still not
    loaded).
  - **AFTER:** plain sky with no items (0 layers), the same as the `90a11e5` control; the items arrive with the room.
- The first natural frame after the tap is in the sheet too:
  - BEFORE: 510 ms, 5 layers.
  - AFTER: 592 ms, 0 layers while the still is still decoding.

## Capture paths
`/home/user/wt/w2n/kettle/review/product-excellence/contracts/W2/N/fix/` (4.5 MB): the sheet, early frames, float
JSON, test logs, and the two probes.

Servers started this round (previews on 5233 and 5213, the dev server on 5213) are stopped; no browser is left
running.
