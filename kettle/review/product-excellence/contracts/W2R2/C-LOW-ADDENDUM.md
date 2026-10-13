# Maker C · W2R2 · I06 addendum: the Blender Chai on the low tier (`MODEL_ON_LOW = true`)

Vibei signed off on `pe/w2r2-chai3d@2843fb0` (approved by the lead) and asked for one change before the merge: show
the model on the low tier too, because it has fewer triangles and draw calls than the procedural Chai. This addendum
covers that change only; `C-READY-FOR-REVIEW.md` stands for everything else.

| | |
|---|---|
| Base | `2843fb0` (approved) |
| **Code commit** | **`effe8c0`** (`effe8c0c20914443e30309a9f27769aeba6529c0`) |
| **`git rev-parse effe8c0:kettle/src`** | **`276ad0eede4377d5c8bbc965e5b98a9412d76225`** (was `42b2c1c`) |
| Packet commit | the branch head after `effe8c0` (this file and `W2R2/C/low/`; kettle/src unchanged) |
| Model hash | `art-src/chai/chai.glb` and `src/scene/engine/models/chai.glb` are both `b401bc6c0fa9dd7a2abe27c135821634e7d1a4d9f9ba5263f50a436ceb463d7e` ✔ |
| History | not rewritten, not pushed |

## Changed files (`git diff --stat 2843fb0 effe8c0 -- kettle`: 4 files, +65 −9)
| File | Change |
|---|---|
| `src/scene/chaiHost.ts` | `MODEL_ON_LOW = true`; the comment now gives the reason and says the low tier liteifies the model's materials (the fur keeps PBR, like the procedural fur) |
| `src/scene/chaiHost.test.ts` (new) | the policy: high and low ask for the model, 3D off never does |
| `src/scene/engine/chai.ts` | header comment: no longer says "the low tier keeps it" |
| `tests/chai3d.spec.ts` | see below |

Changes in `tests/chai3d.spec.ts`:
- The "low tier" case now expects the model: liteified (fur `MeshStandardMaterial`, gloss/mug/yuzu `MeshLambertMaterial`), REPORT.md's awake parts, on the cushion, one request.
- New case, "default tier on this machine" (`auto` resolves to low on SwiftShader). The model fetch is held back, so the first frames are certainly the procedural Chai. A per-frame probe then counts frames with no visible `chai` in the scene through the swap: expected 0, and 0 measured.
- Request counts are now per page load. The Home pre-warm fetches the model on the default tier before the spec's own reload.

Unchanged:
- All the fallbacks (404, timeout, invalid file, loader chunk, 3D off, context loss) and their tests.
- The summary-unlock rule (it never adds the model itself).
- `tests/w2-room.spec.ts`: no assumption there needed changing.

## 1. Tests on the default tier (low), my dev server `:5423`
| Suite | Result | Log |
|---|---|---|
| `npx tsc --noEmit` | exit 0 | `C/low/runs/tsc.txt` |
| `npx vitest run` | **286/286** (30 files; +1, `chaiHost.test.ts`) | `C/low/runs/vitest.txt` |
| `tests/chai3d.spec.ts` | **9/9** | `C/low/runs/chromium-chai3d-w2room-5423.txt` |
| `tests/w2-room.spec.ts` | **7/7** (the context-loss case included) | same log; 16 passed in 6.5 min |

The 9 `chai3d.spec` cases:
1. high tier;
2. 404;
3. slow network / 8 s timeout;
4. invalid file;
5. loader chunk missing;
6. 3D off;
7. **low tier → model**;
8. **default tier → procedural first, then the model, 0 frames without Chai**;
9. context loss and restore.

## 2. Captures on the default tier (low): BEFORE control `b377c62` `:5430`, AFTER my preview `:5433` (built from `effe8c0`)
Probe `C/probes/capture.mjs --tier default`:
- no `nookq`, so each device uses its own tier; `quality` is recorded per state, and it was `low` in every one;
- runs alternate BEFORE / AFTER per config, in the same session;
- fresh context per group; frozen clock;
- night uses `nooktime=night` (the seeds pin the time of day).

Raw shots: `C/low/captures/{BEFORE,AFTER}/<cfg>/`. Contact sheets: `C/low/captures/SHEET-10-nook-3d.png`, `SHEET-07-unlock.png`, `SHEET-07-unlock-early.png`.

| Config | Nook Chai BEFORE → AFTER | Unlock close-up Chai BEFORE → AFTER | Unlock ready after Done, ms BEFORE / AFTER | Errors |
|---|---|---|---|---|
| 390×844 light | procedural → **model** | procedural → procedural | 4,576 / 3,548 | 0 / 0 |
| 390×844 dark | procedural → **model** | procedural → procedural | 3,296 / 4,640 | 0 / 0 |
| 390×844 night | procedural → **model** | procedural → procedural | 3,792 / 4,960 | 0 / 0 |
| 1440×900 light | procedural → **model** | procedural → procedural | 25,744 / 8,475 | 0 / 0 |
| 1440×900 dark | procedural → **model** | procedural → procedural | 7,808 / 5,680 | 0 / 0 |
| 1440×900 night | procedural → **model** | procedural → procedural | 12,368 / 3,903 | 0 / 0 |

**PRESERVE 8: the unlock close-up is unchanged.**
- In every AFTER config the unlock card's engine is a fresh one (the Focus engine is still mounted then). It keeps the procedural Chai and is built exactly as on control.
- The close-up frames match BEFORE/AFTER at both sizes and all three looks (the record player; Chai out of frame), as the `SHEET-07-unlock*.png` sheets show.
- Hand-off times are noise on the CPU rasterizer, with no direction: AFTER is faster in 4 rows and slower in 2.

Note: the AFTER `390x844-light-day` close-up of the Nook (`11-nook-chai-close.png`) caught a blink. The eyes go to 15 % height for 0.13 s every 4.2 s, and these captures run with motion on.

## 3. Frame time and memory on the low tier (`C/probes/perf.mjs`)
Raw: `C/low/perf/perf-low-390x844.json`. Summary: `C/low/perf/perf-low-390x844-summary.md`.

Setup:
- same machine, one browser session;
- 3 alternating rounds of: control `:5430` (procedural), my preview with `chai3d=procedural`, my preview with the model;
- low tier (`nookq=low`, the default here), Nook, 390×844@3 (canvas 442×395).

Measures:
- **Frame time:** `engine.frame()` plus a 1-pixel `readPixels`, which forces the CPU rasterizer to finish. 60 frames after 10 warm-up frames, loop stopped.
- **Memory:** JS heap after two GCs (CDP `Runtime.getHeapUsage`); `renderer.info` for the last frame (calls, triangles) and memory (geometries, textures, programs).

| Variant (low tier) | frame ms, median of run medians (runs) | p90 | draw calls | triangles | geometries | textures | programs | JS heap MB | Chai final ms | longest task ms |
|---|---|---|---|---|---|---|---|---|---|---|
| control `b377c62`, procedural | 190 (200, 190, 162) | 225 | 111 | 76,752 | 114 | 8 | 19 | 10.68 | 5,144 | 815 |
| this branch, procedural (`chai3d=procedural`) | 179 (179, 168, 179) | 216 | 111 | 76,752 | 114 | 8 | 19 | 10.75 | 5,729 | 776 |
| **this branch, model (default now)** | **159** (152, 180, 159) | **201** | **108** | **74,910** | **111** | 10 | 23 | 11.20 | 5,326 | 425 |

- **Frame time:** the model is no slower on the low tier. Its median is 20 ms below the procedural Chai, but the per-run ranges overlap (152–180 vs 168–179), so I read it as "no cost", not as a speed-up.
- **Draw calls and triangles:** 3 fewer draw calls and 1,842 fewer triangles, as Vibei expected.
- **Memory:**
  - geometries −3;
  - textures +2: morph-target data for the two `body` primitives;
  - programs +4: the fur's self-fill program, the Lambert/morph variants;
  - JS heap +0.45 MB.
- **Load:** 30–33 ms for fetch, parse and validation. The model is swapped in 22–34 ms after the first frame (procedural first), or is already in it when parsed in time.
- **Long tasks:** not longer than the procedural runs (411–461 ms vs 648–952 ms).

These match the earlier forced-low measurement in `C-READY-FOR-REVIEW.md` (model 233 vs procedural 240 ms at a higher machine load).

## What changes for people
- Every 3D tier now shows the approved Chai, including CPU rasterizers, weak and save-data phones, and iOS and 4-core phones that resolve to low.
- The procedural Chai remains:
  - the first frame when the model is not yet parsed;
  - the fallback for 404, timeout, an invalid file, a missing loader chunk and offline-without-cache;
  - what the summary unlock close-up shows unless the engine it adopts already carries the model.
- 3D off and no-WebGL still show the static drawing.
- With the low tier on, the Home pre-warm now also fetches (45.6 KB, precached) and compiles the model in its idle slices, so the Focus/summary/Nook engine carries it.

Servers: my dev `:5423` and preview `:5433` (started for this round) are stopped, and all my gated browser jobs have ended. The control `:5410`/`:5430` was only read.

READY
