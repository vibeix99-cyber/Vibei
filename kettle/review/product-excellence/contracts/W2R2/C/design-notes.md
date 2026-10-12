# I06 design notes (Maker C, W2R2)

## Where the runtime copy lives: an imported asset URL, not `public/`
`src/scene/engine/models/chai.glb`, imported as `./models/chai.glb?url` by `scene/engine/chaiLoad.ts`.
- Vite fingerprints it (`assets/chai-<hash>.glb`): a changed model gets a new URL, so no browser, CDN or service-worker
  cache can serve a stale Chai, and it can be cached forever. A `public/chai.glb` keeps one URL across versions and
  relies on revalidation and the precache revision for updates.
- It is byte-identical to `art-src/chai/chai.glb` (the source stays there, untouched). `chaiModel.test.ts` checks both
  hashes against `b401bc6c…463d7e`, so the copy cannot drift silently.
- It was not imported straight from `art-src/`: that folder's README says nothing in it is bundled (the app ships
  copies, like `src/art/chai/*.webp`).

## Flow (CHAI-3D-SPEC §6.2)
1. The engine always builds the procedural Chai first, synchronously, exactly as before (`Engine` constructor unchanged).
2. Who asks for the model (`scene/chaiHost.ts`): engines whose mode can show Chai, on the high tier. Never the
   `window` view (Focus backdrop). The loader (`GLTFLoader` + meshopt decoder, 70.3 KB) is its own lazy chunk
   (`three-gltf`), so the first 3D frame never parses it.
3. Load (`chaiLoad.ts`): `fetch` with an 8 s `AbortController` timeout → `GLTFLoader.parseAsync` (meshopt) →
   `validateChai`. One template per page (module cache). Network failures and timeouts are not cached (the next
   mount retries, e.g. back online); a validation failure is (same file). Failures log only under `?debug`.
4. Swap (`Engine.useChaiModel`): a model-backed `Chai` (`chaiModel.ts`, same interface) takes the procedural one's
   position, turn, base height, pose, tap proxy, steam and zZ; it is liteified on the low tier; the procedural
   geometry is freed. `Engine.upgradeChai` does this inside `warm()` and compiles only the new subtree, a few programs
   per task, holding the last frame (no frame shows an uncompiled Chai, no frame compiles them all).
5. When it joins, so that the model is in the first frame where possible without ever waiting for the network:
   - Home's pre-warm starts the load before the page settles; the pre-warmed engine (which goes on to Focus, the
     summary and the Nook by stash/adopt) includes the model in its own sliced compile if it is parsed by then,
     otherwise swaps it in while still parked.
   - A fresh engine (direct Nook visit, a context restore) includes it in its first compile pass if it is already in
     memory; otherwise the procedural Chai is the first frame and the model follows once loaded.
   - **A summary unlock close-up never adds it** (not interactive + an item highlighted): no extra compile before or
     during the drawing → close-up hand-off (PRESERVE 8). It shows the model only if the engine it adopts already
     carries it.

## Pose mapping (REPORT.md)
| Pose | Eyes | `paws_mug` | `body` key `nap` | `yuzu` | engine extras |
|---|---|---|---|---|---|
| awake | `eyes_open` (blink: y-scale about its own origin, the eye centre) | hidden | 0 | rest | roll ±0.02 |
| nap | `eyes_sleep` | hidden | 1 | rest + `extras.nap_offset` | zZ above the sleeping head; model moved `NAP_FORWARD` |
| sip | `eyes_sip` | shown (lift every few s) | 0 | rest | steam from the mug rim (from the mug's bounds) |
`eyes_happy` stays hidden (cheering, later). Breathing scales the whole model from the floor origin (±1.8 %, ±3.5 % in
nap); the procedural nap scale (1.1, 0.84, 1.06) is never applied to the model (unit test checks a full breath).

## Materials (only what the model needs)
- Geometry and materials are cloned per engine and registered with the kit (`kit.own`), so they are disposed with it.
- Fur (`chai_fur`): keeps the procedural Chai's night self-fill (emissive = own colour × 0.16, scene.md iteration 4).
  The model's colour is per vertex, so the emissive is multiplied by the vertex colour in the shader (one line after
  `emissivemap_fragment`, fixed program key). It is "unique" like the procedural fur, so it keeps PBR on the low tier.
- `chai_gloss`, `chai_mug`, `chai_yuzu`: as exported (Lambert on the low tier via `kit.liteify`, like every other prop).
- Shadows: body, paws/mug and yuzu cast on the high tier; the eyes do not. The contact blob is the engine's
  (shared plane + material), sized to the model's footprint per pose.
- No lighting changes.

## Validator (`validateChai`)
Contract nodes; `nap` key on every `body` primitive; numeric `yuzu.extras.nap_offset`; extents measured from the
vertices (the nap key applied, the yuzu moved) within ±10 % of awake 0.59 × 0.99 × 0.57 and nap 0.68 × 0.61 × 1.03;
lowest point within 1 cm of y = 0 awake and in nap; ≤ 5,000 triangles and ≤ 6 draw calls per pose, ≤ 8,000 in the
file. Measured on the file: awake 0.585 × 0.993 × 0.567, nap 0.682 × 0.612 × 1.032, min y 0 / 0; awake 4,342 tris
4 calls, nap 4,250 / 4, sip 4,780 / 6, file 5,372. The spec's old box (0.8 × 1.04 × 0.74) is rejected (unit test).

## Low tier
Kept procedural (`MODEL_ON_LOW = false`), as §6.2 recommends until the model is measured on a real low-end phone,
which I cannot do here. The measured SwiftShader numbers (the slowest renderer there is) are in the packet; if the
lead accepts them as enough, enabling the model on the low tier is that one constant (the low-tier path itself is
already exercised: adaptive step-down after load keeps the model with liteified materials, and `?chai3d=model`
forces it for measurement).

## Debug
`?debug&chai3d=model|procedural` forces either Chai on any tier (measurement, captures). `window.__nook.chaiKind` and
`window.__chai3d.status()` report the state under `?debug`.
