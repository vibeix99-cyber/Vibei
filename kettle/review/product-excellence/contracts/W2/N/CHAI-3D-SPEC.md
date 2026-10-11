# Chai in 3D: how the current model is built, and a spec for a Blender replacement

**Item:** I06 preparation (Wave 2, round 1, Maker N). **No code.** This document describes the procedural 3D
Chai as it is at `90a11e5` (kettle/src `42e106d`) and specifies what a Blender-built `.glb` must satisfy to replace
it, with the procedural Chai kept as the fallback. Vibei builds the model; a later, separately authorised round
wires it in.

**Binding constraints (PRESERVE 2):** the approved Chai is the capybara on the approved pose sheet
(`art-src/chai/chai-sheet-approved.webp`, K05 = `VISUAL_BENCHMARK_LIBRARY/assets/approved/chai-approved-pose-sheet.png`):
silhouette, proportions, expressions, the yuzu, no cream patch. A new 3D model is new character art. It needs
Vibei's approval **before** it ships (CRITIC §1), judged by §7 below.

All file and line references are to `kettle/src` at `90a11e5`.

---

## 1. Where the 3D Chai appears today

| Surface | Scene mode | Chai pose | Framing | Visible? |
|---|---|---|---|---|
| **Nook screen** (`screens/nook/NookScreen.tsx`) | `showcase`, interactive | `awake` | Whole-room fit, user can orbit and zoom | **Yes**: the main place anyone sees the 3D Chai |
| **Summary unlock card** (`screens/done/Summary.tsx:321`) | `showcase`, `highlightItem` | `awake` | Close-up on the unlocked item | Only if the item is near the cushion |
| **Focus backdrop** (`screens/focus/stage/Stage.tsx:86`) | `window` | `awake` (unused) | Fixed window camera | **No**: Chai is out of frame (`scene/types.ts:3`). The painted Chai on the stage is a 2D image |
| Home pre-warm (`scene/index.tsx:65`) | `focus` (off-screen) | `nap` | — | No (detached canvas) |

The engine still supports `focus` (Chai `nap`) and `break` (Chai `sip`) modes with a tight framing
(`Engine.ts:783–790`), but **no screen mounts them at `90a11e5`**. A replacement must still implement all three
poses, because the engine contract (§4) requires them and a later screen may use them.

## 2. How the current Chai is built (`scene/engine/chai.ts`)

Header (`chai.ts:1–8`): "a soft toy, built like the 2D mascot … broad cream snout". This is the **pre-v2**
construction that `src/art/Mascot.tsx` abandoned in `b6577ad` ("capybara, not bear … no cream patch"); see the
audit C1 and CRITIC §1. It predates the approved sheet (`e0d3cf6` vs `eeff3a0`).

### 2.1 Mesh

Everything is built from three.js primitives through the shared `Kit` (`kit.ts`), in **local units before the root
scale** (`chai.ts:28–31`): `W = 0.8`, `H = 0.8`, `D = 0.74`, front face at `FZ = D/2 = +0.37` (Chai faces **+Z**).

| Part | Geometry | Placement (local) | Group |
|---|---|---|---|
| Body ("loaf"; head and body are one form) | `RoundedBoxGeometry(0.8, 0.8, 0.74, seg 5, r 0.25)`, vertices tapered toward the top: x × (1 − 0.12·y), z × (1 − 0.05·y) (`chai.ts:50–57`) | centre (0, 0.4, 0) | `loafStatic` |
| Snout ("broad soft pillow") | sphere r 0.5 scaled (0.5, 0.36, 0.2), cream `C.muzzle` | (0, 0.32, 0.335) | `loafStatic` |
| Nose | sphere scaled (0.22, 0.09, 0.08), tilted −0.25 rad | (0, 0.44, 0.415) | `loafStatic` |
| Nose highlight | small white sphere | (−0.045, 0.462, 0.452) | `loafStatic` |
| Mouth ("w") | 2 half-tori r 0.026 | (±0.026, 0.33, 0.433) | `loafStatic` |
| Blush | 2 flattened spheres | (±0.3, 0.37, 0.3) | `loafStatic` |
| Ears | 2 small spheres, tilted outward | (±0.25, 0.755, −0.1) | `loafStatic` |
| Front paws (stubby) | 2 flattened spheres | (±0.16, 0.04, 0.32) | `loafStatic` |
| Eyes, open | 2 dark ellipsoids + 2 white catch-lights | (±0.19, 0.6, 0.365) | `eyesOpen` (dyn) |
| Eyes, sleepy ∪ | 2 half-tori, arc down | (±0.19, 0.612, 0.377) | `eyesSleep` (dyn) |
| Eyes, happy ∩ | 2 half-tori, arc up | (±0.19, 0.585, 0.377) | `eyesHappy` (dyn) |
| Yuzu + highlight + stem + leaf | sphere r 0.115 (squashed 0.88), small sphere, cylinder, flattened sphere | group at (0.02, 0.78, 0.02) | `yuzu` (dyn) |
| Mug (sip), tea surface, handle | smooth lathe, cylinder, partial torus | (0, 0.1, 0.49) | `pawsUp` (dyn) |
| Raised paws (sip) | 2 spheres, `C.furShade` | (±0.1, 0.17, 0.47) | `pawsUp` (dyn) |
| Contact shadow | `kit.blob(0, 0.02, 1.15, 1.1, 0.55)`: an unlit textured quad | floor | root |
| zZ (nap) | 3 `Sprite`s, `kit.tex.zee()` | animated | root |
| Mug steam (sip) | `makeSteam` (`fx.ts`): instanced shader quads, `kit.tex.puff()` | origin (0, 0.32, 0.49) | root |

`kit.mergeStatic()` (`kit.ts:265`) then collapses every static mesh in a group into one mesh per material bucket,
baking plain colours into vertex colours (`bakeable`, `kit.ts:140`). Groups flagged `userData.dyn = true` are merged
separately so they can still move or toggle.

**Measured** (geometry walk of `buildChai` in Node, `.tmp/n/chai.probe.test.ts`, at `90a11e5`; visible meshes only,
raycast proxy excluded):

| Pose | Meshes (≈ draw calls) | Triangles | Vertices | Bounds incl. root scale 1.12 (x × y × z) |
|---|---|---|---|---|
| `awake` | 8 | 6,186 | 7,408 | 0.862 × 1.162 × 0.925 |
| `nap` | 8 | 5,762 | 7,108 | 0.949 × 0.976 × 0.981 |
| `sip` | 11 (+ steam) | 6,788 | 7,810 | 0.862 × 1.162 × 1.069 |

### 2.2 Materials

All lit materials are `MeshStandardMaterial` (high tier) and become `MeshLambertMaterial` on the **low tier**
(`kit.liteify`, `kit.ts:315`), except "unique" materials, which keep their PBR material.

| Material | Colour (`palette.ts`) | Roughness | Notes |
|---|---|---|---|
| Fur | `C.fur` `#C98A59` | 0.9 | **unique**; emissive = own colour × 0.16 ("self-fill so the face reads at night", `docs/areas/scene.md` iteration 4) |
| Snout | `C.muzzle` `#F8E4C8` | 0.9 | **unique**; emissive × 0.14. **Off-model**: the approved Chai has no cream patch |
| Fur shade (raised paws) | `C.furShade` `#A96C42` | 0.9 | baked to vertex colour |
| Nose / eyes | `C.nose` `#3A251B` / `C.eye` `#2B1C14` | 0.32 | baked |
| Catch-lights | `#FFFFFF` | 0.32 | baked |
| Blush / ears / mouth | `C.blush` `#F28B84` / `C.ear` `#9E643D` / `C.espresso` `#4A3226` | 0.9 | baked |
| Yuzu / highlight / stem / leaf | `C.yuzu` `#FFC83D` / `C.honeyHi` / `C.woodDark` / `C.leaf` `#6DB85A` | 0.58–0.9 | baked |
| Mug / tea | `C.persimmon` `#F2733A` / `C.tea` `#A8622E` | 0.32 | baked |
| zZ sprites | `C.cream`, `SpriteMaterial`, transparent | — | opacity animated |

The renderer uses `NeutralToneMapping`, `SRGBColorSpace` output, exposure 1 (0.86 in the dark app theme,
`DARK_DIM`). Lights that touch Chai: a hemisphere light, the floor lamp's `SpotLight` (casts shadows on the high
tier only), the window's `DirectionalLight`, the stove's `PointLight`, and a highlight `PointLight` that is only on
for a highlighted item (`Engine.ts:291–313`). There is **no environment map**.

### 2.3 Textures

**No image files.** `TextureBank` (`textures.ts`) draws small canvas textures once per engine: `soft()` 128² (blob
shadow), `zee()` 64² (zZ), `puff()` 128² (steam). The body has no texture: its colour is vertex colour or material
colour.

## 3. Scale, origin and orientation

- **World:** y up, floor at y = 0, one world unit ≈ half a metre (`layout.ts:1`). The room spans x −3.2…3.2,
  z −2.5 (back wall)…2.5, wall height 4.
- **Chai's local frame:** origin at the **bottom centre** of the loaf (the floor contact; the body box is centred at
  y = H/2), **front = +Z**, up = +Y. The loaf "breathes" by scaling from this origin, so the origin must stay on the
  floor plane.
- **Root transform** (set by the engine, `Engine.ts:706–711`, and `chai.ts:197`):
  - `root.scale = 1.12` (uniform);
  - `root.position = (SPOTS.cushion.x, y, SPOTS.cushion.z) = (−0.95, y, 1.15)`, where `y = 0.255` when the
    **cushion** is earned (level 4) and `0.05` before that (`root.userData.baseY`; the hop adds to it);
  - `root.rotation.y = 0.62` rad (35.5°), turning Chai toward the default camera azimuth.
- **Size in the room** (measured above, root scale included): about 0.86 wide, 1.16 tall to the leaf tip and 0.93
  deep, so about 0.43 m × 0.58 m × 0.46 m. The loaf alone is 0.8 × 0.8 × 0.74 before the 1.12 scale.
- **Tap target:** an invisible proxy box 0.8 × 0.9 × 1.1 centred at (0, 0.4, 0.05) on the root (`Engine.ts:285`).
  Tapping it calls `chai.poke()` (a hop).

### 3.1 Camera framings that show Chai

| Framing | Where | Parameters (`Engine.ts`) |
|---|---|---|
| **Nook, whole room** (main) | Nook screen | Perspective, vertical FOV 30°. Azimuth `BASE_AZ` 0.56 rad, elevation `BASE_EL` 0.4 rad, plus (1 − aspect) × 0.22 on portrait screens (`baseEl`). The distance fits the room silhouette with 3.5 % padding (`fit`, `fitPoints`). The user can drag azimuth −0.46…+0.30 and elevation −0.14…+0.12, and zoom 0.72…1.12 (`onMove`, `onWheel`) |
| Nook, item selected | Nook screen | The same camera, zoom × 0.88, target moved 30 % toward the item |
| Unlock close-up | Summary card | Camera on the item at about 1 item radius over the half-FOV tangent (`ITEM_FILL`); Chai appears only when the item is beside the cushion |
| Focus / break (tight) | not mounted at `90a11e5` | Same azimuth and elevation, tighter silhouette, padding 2 % |
| Window | Focus backdrop | Fixed camera at (1.75, 1.62, 2.7) looking at (0.3, 1.66, −2.5), FOV 44°. Chai is not in this frame |

On a 390 × 844 phone the whole-room Nook shows Chai about 70–90 CSS px tall; on a 1440 × 900 desktop, about
150–190 CSS px. Judge the model at these sizes as well as close up (§7).

## 4. Poses and animation: what `setPose` and `update` do

The engine talks to Chai through the `Chai` interface only (`chai.ts:14–24`):

```
root: Group                 // added to the scene; engine sets position, rotation.y, userData.baseY
setPose(p: 'nap' | 'sip' | 'awake')
update(t: number, dt: number)   // every rendered frame; t frozen at 7.35 s and dt = 0 under reduced motion
poke()                      // tapped: one happy hop
steam: SteamFX              // the engine recolours steam.u.uColor with the time of day (Engine.ts:772)
sprites: Sprite[]           // the zZ sprites
focus: Vector3              // unused by the engine today
```

**Pose mapping** (`Engine.ts:714–717`): mode `focus` → `nap`, `break` → `sip`, everything else → `awake`.

**`setPose` is an instant swap, not a blend** (`chai.ts:160–171`):

| Pose | Eyes | Raised paws + mug | Mug steam | zZ | Loaf base scale |
|---|---|---|---|---|---|
| `awake` | open | hidden | hidden | hidden | (1, 1, 1) |
| `nap` | sleepy ∪ | hidden | hidden | 3 sprites | (1.1, 0.84, 1.06): "melted loaf" |
| `sip` | happy ∩ | shown | shown | hidden | (1, 1, 1) |

**`update(t, dt)`** (`chai.ts:174–211`) animates continuously; nothing is keyframed:

- **Breathing:** loaf scale from the bottom, sin(t × 1.1) in `nap` (amplitude 3.5 %) or sin(t × 1.6) otherwise (1.8 %).
- **Hop** (after `poke`): 0.45 s, root lifted up to 0.16 with a squash and stretch.
- **Yuzu:** sways ±0.05 rad, with an occasional fast wobble, and tilts with the squash.
- **Blink** (`awake`): eyes scale to 15 % in y for 0.13 s every 4.2 s. A gentle body roll of ±0.02 rad.
- **Sip:** the paws and mug lift up to 0.06 now and then; the steam shader time advances.
- **Nap zZ:** three sprites rise and fade on a loop.

Reduced motion: the engine calls `update(STILL_T = 7.35, 0)`, a fixed, pleasant frame (eyes open in `awake`).

## 5. Budget and `.glb` conventions for a Blender model

### 5.1 Budget

| | Current procedural | Target `.glb` |
|---|---|---|
| Transfer size | 0 KB (code) | **≤ 300 KB** gzip-or-not, all poses in one file (audit §6.1) |
| Triangles, one pose visible | 5.8k–6.8k | **≤ 5,000** visible at a time; ≤ 8,000 in the file with every pose part |
| Draw calls | 8–11 | **≤ 6** visible (merge per material; one body mesh) |
| Materials | 4 buckets | **≤ 4**: body (vertex colour or one texture), eyes and nose (dark gloss), mug, yuzu and leaf |
| Textures | none | **Prefer none** (vertex colours). If painted shading is needed: **one 256² texture** (512² maximum) |
| Skinning | none | **None required**; see §6.3 |

### 5.2 Export conventions

- **Format:** glTF 2.0 binary (`.glb`), one file, `chai.glb`.
- **Axes:** Blender's glTF exporter with **+Y Up** (the default). Model Chai facing **Blender −Y** (the front view,
  numpad 1, looks at the face). The exporter maps Blender (x, y, z) to glTF (x, z, −y), so the face ends up on
  **glTF +Z**, which is the engine's front.
- **Units:** **1 Blender metre = 1 scene unit.** Model at the *unscaled* procedural size: body about **0.80 m tall**
  at the top of the head, about 0.80 wide at the base and 0.74 deep; the yuzu leaf tip about **1.04 m**. The engine
  keeps applying `root.scale = 1.12`, so do not bake that scale in.
- **Pivot:** the object origin at the **floor contact, centred between the feet**, at (0, 0, 0). Apply all
  transforms (Ctrl+A → All Transforms) before export. The yuzu's own pivot sits at its contact point on the head, so
  it can sway from there.
- **Names** (the loader looks these up; they are the contract):
  - `chai` (root);
  - `body` (one mesh, all poses' body);
  - `eyes_open`, `eyes_sleep`, `eyes_happy`;
  - `paws_mug` (raised paws plus mug, for `sip`);
  - `yuzu` (yuzu, stem and leaf).
  - Optional shape keys on `body`: `nap` (the melted loaf), `breathe`. Optional on `eyes_open`: `blink`.
- **Colour:** vertex colours in the `Col` attribute (sRGB in Blender; the exporter writes linear `COLOR_0`), or a
  base-colour texture. Materials: Principled BSDF only, roughness 0.85–0.9 for fur and 0.3 for the nose, eyes and
  mug, metallic 0. No emission baked into the base colour; the engine adds the night self-fill (§6.2).
- **Compression: meshopt, not Draco.** Run `gltfpack -cc -kn -km` (or gltf-transform `meshopt`) after export. That
  writes `EXT_meshopt_compression` plus `KHR_mesh_quantization`. The decoder already ships with three
  (`three/examples/jsm/libs/meshopt_decoder.module.js`, about 32 KB, the WASM inline). Draco needs the 1.8 MB
  `libs/draco/` decoder files served separately, which is out of proportion for a 5k-triangle model.
- **Textures, only if used:** prefer **WebP** (`EXT_texture_webp`, which `GLTFLoader` decodes natively). **KTX2**
  (`KHR_texture_basisu`) needs `KTX2Loader` plus the Basis transcoder (`libs/basis/`, about 584 KB) and
  `detectSupport(renderer)`; it is only worth it at 512² or more.
- **Do not export:** cameras, lights, the zZ, steam or the contact shadow (the engine owns these), empty nodes, or
  unused UV maps.

### 5.3 How three `0.186.1` resolves the loaders

- `GLTFLoader` is at `three/examples/jsm/loaders/GLTFLoader.js` and supports `EXT_meshopt_compression`,
  `KHR_mesh_quantization`, `KHR_draco_mesh_compression`, `KHR_texture_basisu`, `EXT_texture_webp`,
  `KHR_materials_emissive_strength` and `KHR_texture_transform`, among others (file header, l.84–103).
- Meshopt: `loader.setMeshoptDecoder(MeshoptDecoder)`, importing `MeshoptDecoder` from
  `three/examples/jsm/libs/meshopt_decoder.module.js`. Loading a meshopt file without it throws
  ("setMeshoptDecoder must be called before loading compressed files", l.1622).
- Draco: `new DRACOLoader().setDecoderPath(<url of a copy of libs/draco/>)` then `loader.setDRACOLoader(...)`.
- KTX2: `new KTX2Loader().setTranscoderPath(<url of a copy of libs/basis/>).detectSupport(renderer)` then
  `loader.setKTX2Loader(...)`. Without it, KTX2 textures throw (l.1479).
- Shape keys load as `mesh.morphTargetInfluences` with `mesh.morphTargetDictionary` mapping the names.
- Bundling: import the file as `import chaiUrl from './chai.glb?url'` so Vite fingerprints it into `assets/`. The
  three.js code stays in the lazy `three` chunk (`vite.config.ts` `manualChunks`).
- **Offline:** the service worker precaches `**/*.{js,css,html,svg,png,webp,ico,woff2}` (`vite.config.ts`). **`.glb`
  is not in that list**, so offline the model fails to load and the procedural Chai stays. Adding `glb` there is the
  PWA area's decision (it owns `vite.config.ts`).

## 6. Swapping in a new model, with the procedural Chai as the fallback

### 6.1 Hook point

Only `NookEngine` touches Chai: it calls `buildChai(kit)` in its constructor (`Engine.ts:283`) and then uses the
`Chai` interface (§4) plus `root.userData.baseY`, `root.position`, `root.rotation.y` (`applyLayout`) and the
proxy it attaches to `root`. So **the swap point is the `Chai` object**: a `.glb`-backed implementation of the same
interface. Nothing outside `scene/engine/` needs to change.

### 6.2 Recommended flow (for the later implementation round)

1. **Always build the procedural Chai first**, synchronously, exactly as today. It is the first frame, the
   fallback, and the low-memory path.
2. **Load the model asynchronously**, only where Chai can be seen: when an engine is in `showcase`, `focus` or
   `break` mode. Never for `window` mode, the Focus backdrop where Chai is out of frame. Never block the first
   frame, pre-warming or the unlock close-up on it (PRESERVE 8).
3. **Validate** before swapping: the required nodes exist; triangles ≤ budget; the bounding box is within ±10 % of
   0.8 × 1.04 × 0.74 (unscaled); the origin is on the floor (min y ≈ 0).
4. **Swap in place:** create a `Chai` from the glTF scene. Copy `position`, `rotation.y`, `userData.baseY` and the
   current pose. Move the proxy to the new root and replace the old root in the scene. Compile the new materials
   in slices with the engine's existing `warm()`/`compileAll()` pattern, so there is no frame-time spike, then
   render. Keep the procedural Chai around (hidden) or disposed, but dispose of nothing the fallback still needs.
5. **Materials:** register the model's fur material as "unique" (`kit.uniqueMat` semantics) if it keeps the night
   self-fill (an emissive equal to the base colour × 0.16). Otherwise let `kit.liteify` convert it on the low tier.
6. **Steam and zZ:** keep the engine's `makeSteam` and zZ sprites. Position them from the model's `paws_mug` mug
   rim and the head top (empties named `mug_rim` and `head_top`, if Vibei adds them; otherwise use the current
   offsets).

| Situation | Behaviour |
|---|---|
| Load in progress | Procedural Chai shows. No spinner (it is a companion, not content) |
| Network or decode failure, timeout (about 8 s), or validation failure | Keep the procedural Chai; log only under `?debug` |
| Offline (`.glb` not precached) | Same as failure |
| **3D off** (`settings.scene = 'off'`) or no WebGL | No engine, so no model. The static drawn room shows the 2D vector Chai (`NookFallback`); unchanged |
| **Low tier** (SwiftShader, weak mobile, save-data) | Recommended: keep the procedural Chai (no extra download or parse), unless measurement on a real low-end phone shows the model costs no more frame time |
| Adaptive step-down to low after the model loaded | Keep the model, liteify its materials |
| WebGL context lost and restored | The engine is rebuilt; reuse the parsed glTF from a module-level cache (clone it) |
| Reduced motion | Same static frame rules: `update(7.35, 0)` |

### 6.3 Pose-switching contract a Blender rig must satisfy

The engine's poses are **state toggles plus procedural motion**, not clips. A Blender model fits that most cheaply as
**separate meshes for the face states and props, and shape keys for body deformations**. An armature with actions
is **not needed**, and it would add skinning cost and an `AnimationMixer`.

| Requirement | How to model it | How the loader drives it |
|---|---|---|
| `awake`, `nap`, `sip` eyes | Three meshes `eyes_open`, `eyes_sleep`, `eyes_happy`, at the same place on the face | `visible` toggles |
| `sip` raised paws and mug | Mesh `paws_mug`. The resting paws are part of `body` and are hidden by the raised ones, or use a shape key `paws_up` | `visible` toggle (or shape key 0/1) |
| `nap` melted loaf | Shape key `nap` on `body` (lower and wider, like the sheet's sleep pose), **or** none, letting the engine scale (1.1, 0.84, 1.06) | `morphTargetInfluences[nap] = 1`, or the scale fallback |
| Breathing | Nothing (the engine scales `chai` from the floor origin), or shape key `breathe` | engine |
| Blink | Shape key `blink` on `eyes_open`, or nothing (the engine scales `eyes_open` in y about the eye centre, so give `eyes_open` its origin at the eye centre) | engine |
| Yuzu sway and wobble | Separate object `yuzu`, origin at its contact with the head | `yuzu.rotation.z` |
| Hop | Nothing | engine moves `chai.position.y` |
| Approved extra expressions (concerned, cheering, reading) | Optional extra meshes `eyes_concerned`, `paws_cheer`, `book` for later screens; hidden by default | not wired yet |

Shape keys must be **relative to the basis** and exported with "Shape Keys" on and "Shape Key Normals" on. Keep
them to 4 or fewer.

## 7. How to judge the model against the approved pose sheet (K05)

### 7.1 Framings to render (in Blender, and again in the engine once wired)

1. **Orthographic front**, camera on +glTF Z (Blender −Y), flat emission shading, at the same scale as one sheet
   cell. Compare with `chai-happy` (pose 4, row 1), `chai-sleep` (row 2, pose 7) and `chai-sipping` (row 1, pose 2).
2. **Nook framing:** perspective, FOV 30°, camera azimuth 0.56 rad (≈ 32°) and elevation 0.4 rad (≈ 23°) relative
   to the room, with Chai at (−0.95, 0.255, 1.15), turned 0.62 rad, scale 1.12. Render at the CSS sizes in §3.1 ×
   DPR 2 and 3.
3. **Three-quarter** from Chai's own front-left at about 35°, as the Nook mostly shows it.

### 7.2 Silhouette overlay

Render framing 1 as a black-on-white mask. Scale it so the **feet line and the top of the head (not the yuzu)**
match the sheet cell. Overlay at 50 % with the sheet's silhouette, traced from the cream background.
**Pass: intersection-over-union ≥ 0.90** for `awake` vs `chai-happy`, and ≥ 0.85 for `nap` vs `chai-sleep`.

### 7.3 Proportion checks

These are approximate ratios from K05 (1254² sheet), `chai-happy` cell; measure them precisely against the
reference image in Blender.

| Feature | Approved sheet (approx.) | Current 3D (why it reads as a teddy) |
|---|---|---|
| Body width ÷ height (feet to head top, without the yuzu) | ≈ 0.75: a tall, slightly pear-shaped loaf, wider at the hips | 1.0: "square loaf" (W = H = 0.8) |
| Head region | A face plate that reads as the upper third. Faint brow tufts (3 short strokes) on top | Not separated; no brows |
| Muzzle | **Same fur tone**, a slightly lighter band. **No cream patch** | Cream `#F8E4C8` pillow |
| Nose | Wide dark oval, about 0.22 of body width, at about 27 % down from the head top | 0.22 × 0.09: close, but set on the cream pillow |
| Eyes | Small, wide-set, at about 14 % down; dots or arcs; expressive brows in some poses | Button ellipsoids, no brows |
| Ears | Small round ears at the top corners, partly behind the head line | Similar |
| Front paws | Darker brown ovals held on the belly | Stubby spheres at the floor |
| Feet | Two dark brown ovals at the base, visible from the front | None |
| Blush | Soft pink ovals under the eyes, outside the nose | Present |
| Yuzu | ≈ 0.27 of body width, sitting on the head, a leaf to one side | Similar |

### 7.4 Checklist (sign-off by Vibei before any merge)

- [ ] IoU thresholds in §7.2 met; side-by-side image saved with the model's hash.
- [ ] Every row of §7.3 matches the approved column; no cream patch.
- [ ] `awake`, `nap` and `sip` read as the sheet's happy, sleep and sipping Chai at the Nook framing, in light and
      dark, at 390 × 844 and 1440 × 900.
- [ ] Night lighting (dusk, night) keeps the face readable: the nose and eyes separate from the fur.
- [ ] Budget in §5.1 met: file size, triangles, draw calls (read `__nook.stats` with `?debug`).
- [ ] Names, axes, units and pivot as in §5.2: Chai sits on the cushion without floating or sinking; the yuzu
      sways from its base.
- [ ] Fallback cases in §6.2 verified: offline, failure, 3D off, low tier.
- [ ] No frame-time regression on a real phone, and the unlock close-up (PRESERVE 8) unchanged.
- [ ] Five blind viewers judge "same character" as the sheet ≥ 4/5 (audit C1).
