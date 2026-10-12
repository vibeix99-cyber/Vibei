# Chai 3D: build report (revision 1)

Built from scratch in Blender 5.2.2 with Python (bmesh) through the Blender MCP tools. No downloaded or
AI-generated model was used.

`chai.glb` SHA-256: `b401bc6c0fa9dd7a2abe27c135821634e7d1a4d9f9ba5263f50a436ceb463d7e`
`chai_r0.glb` (first version) SHA-256: `32d15688d660174872102fd65cdc89b5bc03ed263f056b9a3e03f99e9020ba2b`

## Changes in revision 1

1. **`nap` is one continuous loaf.** The separate back hump is gone. The shape key now lays the whole upright
   body down as a single surface: the face stays in front, the belly lies on the floor, the back of the head and
   body become the top, and the base becomes the rump. Checked from the front, three-quarter, both sides, back
   and back three-quarter (`nap_views.png`): no shell and no crease. Nap IoU is 0.915 (was 0.926).
2. **Softer waist.** Depth and roundness now change gradually between head and body, and the neck is 9 mm wider
   per side. The darker face plate ends in a U under the chin that overlaps the chest, as on the sheet's happy
   cell, where r0 had a straight band ending at the neck. Awake IoU is unchanged at 0.946.
3. **Paws and feet are `#865537`**, as one more vertex colour. Resting paws, raised paws and feet all use it. No
   new material.
4. **New mesh `eyes_sip`**: closed ∪ arcs on the upright head, same origin as `eyes_happy`. **The loader should
   show `eyes_sip` for `sip`.** `eyes_happy` (∩) is kept for cheering and is no longer used by any of the three
   poses.
5. **`eyes_sleep` is bolder.** Its line is now 0.017 thick (was 0.012), measured from the sheet's sleep cell.
   `eyes_sip` uses the same weight.
6. **Final touch: `eyes_happy` has the same 0.017 line** as `eyes_sip` and `eyes_sleep` (was 0.012), with the
   same flattened stroke profile. Nothing else changed; the other six meshes are identical to the previous export.

One loader value changed with the new nap: `yuzu.extras.nap_offset` is now (−0.09, −0.3814, 0.154).

## Results

| Check | Target | Result |
|---|---|---|
| IoU, awake vs `chai-happy` | ≥ 0.90 | **0.946** (0.960 without the yuzu) |
| IoU, nap vs `chai-sleep` | ≥ 0.85 | **0.915** (0.921 without the yuzu) |
| IoU, sip vs `chai-sipping` (not required) | — | 0.913 |
| File size, `chai.glb` | ≤ 300 KB | **45.6 KB** (31.8 KB gzipped); 192.8 KB uncompressed |
| Triangles visible | ≤ 5,000 | awake 4,342 · nap 4,250 · sip 4,780 |
| Triangles in the file | ≤ 8,000 | 5,372 |
| Draw calls visible | ≤ 6 | awake 4 · nap 4 · sip 6 |
| Materials | ≤ 4 | 4: `chai_fur`, `chai_gloss`, `chai_mug`, `chai_yuzu` |
| Textures | prefer none | none; vertex colours only (`COLOR_0`) |
| Skinning | none | none |

How the IoU was computed (numpy inside Blender): the sheet cell is masked by colour, with the cream background and
the grey ground shadow dropped. The model is rendered as an orthographic front view and scaled so the feet line and
the head top (not the yuzu) match the cell. The only free parameter is a horizontal shift, chosen to maximise IoU.
The head-top row under the yuzu is my estimate from the columns beside the fruit (rows 103, 110 and 122 in the
happy, sleep and sipping cells). For nap, the model's head top is the crown under the yuzu, 0.419 above the floor;
the back rises to 0.476 behind it.

Re-import check on the compressed file: eight nodes with the contract names, the `nap` morph target, vertex
colours and all four materials survive, and the basis and nap extents match the source to 0.1 mm. The exported nap
normals match Blender's own on a sample of 674 vertices.

## What is in the file

| Node | Contents | Triangles |
|---|---|---|
| `chai` | root, no mesh, at (0, 0, 0) | — |
| `body` | loaf, ears, feet, resting paws, nose, mouth, blush, brow strokes; shape key `nap` | 3,746 |
| `eyes_open` | two dots with catch-lights; origin at the eye centre, for the blink | 272 |
| `eyes_happy` | two ∩ arcs; same origin | 140 |
| `eyes_sip` | two closed ∪ arcs; same origin | 180 |
| `eyes_sleep` | two closed ∪ arcs, **placed on the lowered nap head** | 180 |
| `paws_mug` | raised paws, mug, tea, handle, leaf mark | 530 |
| `yuzu` | fruit, highlight, stem, leaf; origin at the contact point on the head | 324 |

- Axes: Chai faces Blender −Y, so the face is on glTF +Z. +Y up. No rotation or scale on any node.
- Pivot: floor contact, centred between the feet; lowest point is exactly y = 0, in `nap` too.
- Size awake, unscaled: 0.585 wide × 0.80 to the head top (0.99 to the leaf tip) × 0.57 deep (0.71 with the mug).
- Size in `nap`, unscaled: 0.68 wide × 0.48 to the back (0.61 to the leaf tip) × 1.03 long.
- Roughness 0.9 fur, 0.3 nose, eyes and mug, 0.6 yuzu. Metallic 0. No emission.
- Compression: `gltfpack -cc -kn -km -ke -vpf` (meshopt). `chai_uncompressed.glb` is the raw Blender export.

Pose table for the loader:

| Pose | Eyes | `paws_mug` | `body` shape key `nap` | `yuzu` |
|---|---|---|---|---|
| `awake` | `eyes_open` | hidden | 0 | at rest |
| `nap` | `eyes_sleep` | hidden | 1 | moved by `extras.nap_offset` |
| `sip` | `eyes_sip` | shown | 0 | at rest |
| cheering, later | `eyes_happy` | hidden | 0 | at rest |

## §7.3 rows

| Row | Match? | Note |
|---|---|---|
| Width ÷ height ≈ 0.75 | Yes | 0.73, measured from the sheet's happy cell (292 × 399 px) and built to it |
| Face plate, three brow strokes | Yes | A darker plate on the lower face, arched over the nose and rounded under the chin; three strokes on the crown |
| Muzzle same fur tone, no cream | Partly | No cream patch. But the plate is slightly **darker** than the fur, not lighter; see below |
| Wide dark oval nose | Yes | 0.17 wide, 0.29 of body width, as on the sheet (the spec's 0.22 is too small against the sheet); 27 % down |
| Small wide-set eyes | Yes | 14 % down, ±0.128 from the centre line |
| Small round ears | Yes | At the top corners, half behind the head line |
| Darker front paws on the belly | Yes | `#865537`, the sheet's tone |
| Two dark feet visible from the front | Yes | `#865537` |
| Soft pink blush | Yes | |
| Yuzu with leaf | Yes | 0.27 of body width; pivot at the contact point |

## Where I departed from the spec, and why

- **Width is 0.585, not 0.80.** §5.2 asks for a body 0.80 tall and 0.80 wide, which is the old square loaf; §7.3
  and the sheet ask for 0.75. I kept the 0.80 height and took the width from the sheet. As a result the §6.2
  validator (±10 % of 0.8 × 1.04 × 0.74) would reject this model. The validator box needs to become about
  0.59 × 0.99 × 0.57, or the root scale needs raising from 1.12 if Chai should fill the cushion as before.
- **The face plate is darker, not lighter.** On the sheet the lower face is the darker tone (about `#B57950`
  against fur `#CC8D5C`). I followed the sheet with `#B97B4E`, halfway between fur and shade. It is one colour
  entry in `scripts/chaibuild.py` if you want it lighter.
- **`nap` is the sheet's lying pose, not a squash.** Three things follow:
  - `eyes_sleep` is modelled at the nap head position, so it is only correct with `nap` = 1.
  - The yuzu does not follow a shape key. The loader must move it by `yuzu.extras.nap_offset` =
    (−0.09, −0.3814, 0.154) in glTF axes when `nap` is on.
  - The engine's scale fallback (1.1, 0.84, 1.06) must not be combined with this key.

## What I am unsure about

- **The nap loaf is 1.03 long**, against 0.57 deep when awake. I have not checked it against the cushion; it may
  overhang. The length is a guess, because the sheet only shows the front. It curves to Chai's left behind the
  ears, as the sheet's body does.
- **In `nap` the feet sit under the chin**, as the two dark ovals on the sheet do, and the front paws fold away
  inside the chest. These are placements I chose, not anatomy.
- **`eyes_sip` sits at the awake eye height** (14 % down). The sheet's sipping cell draws the eyes about 21 % down,
  but that whole face is drawn lower, and the model's nose does not move.
- **Two colours are guesses.** The spec names `C.honeyHi` and `C.woodDark` without hex values. I used `#FFE08A`
  for the yuzu highlight and `#5A3A22` for the stem.
- **The model is symmetric; the sheet's happy Chai is turned slightly.** Its head sits about 8 px left of its body.
  That is most of the remaining awake silhouette error.
- **Raised paws are bigger than the sheet's**, so that they cover the resting paws on `body`. From a steep side
  angle an edge of a resting paw may still show.
- **Nook framing is approximated.** I used the camera direction relative to Chai (azimuth 0.56 − 0.62 rad,
  elevation 0.4 rad, plus the portrait term for the 140 px render) at a distance of about 12 world units, with the
  lens narrowed until Chai is 140 or 280 px tall. I assumed azimuth is measured from +Z toward +X. There is no room,
  cushion or real engine lighting.
- **The dusk render is a stand-in.** It uses a warm spot and a dim blue ambient. The engine's night self-fill
  (emissive × 0.16) is not simulated. The nose and eyes do separate from the fur in it.
- The `.glb` scene carries a stray `extras.blendermcp_server_running` key from the Blender MCP add-on. It is
  harmless.

## What I could not do

- Nothing was tested in the engine: no three.js load, no `__nook.stats`, no real-phone frame time, no fallback
  cases. The draw-call counts are primitive counts from the file.
- The nap pose was not checked from below.
- Optional shape keys `breathe` and `blink`, and the extra expressions (concerned, reading), are not built.
- Light and dark app themes at 390 × 844 and 1440 × 900, and the five-viewer check, are yours to run.

## Files

| File | What it is |
|---|---|
| `chai.blend` | source; the `render_rig` collection (floor, two lights) and `chai_cam` are for renders only |
| `chai.glb` | deliverable, revision 1, meshopt-compressed |
| `chai_uncompressed.glb` | raw export of revision 1 |
| `chai_r0.glb`, `chai_r0.blend` | the first version, untouched |
| `side_by_side_awake_vs_happy.png`, `…_nap_vs_sleep.png`, `…_sip_vs_sipping.png` | sheet cell beside the orthographic front render, same scale |
| `overlay_*.png` | silhouette overlay: grey both, blue sheet only, red model only |
| `overlay50_*.png` | 50 % blend of the sheet cell and the render |
| `front_awake.png`, `front_nap.png`, `front_sip.png` | orthographic front, flat shading, 800 px per metre |
| `nook_140px.png`, `nook_280px.png` | Nook framing; awake, nap, sip left to right |
| `three_quarter.png` | 35° from Chai's front-left; awake, nap, sip |
| `nap_views.png` | nap from the front, three-quarter, Chai's left side, back, Chai's right side, back three-quarter |
| `awake_views.png` | awake from the front, three-quarter, Chai's left side, back |
| `dusk_night.png` | Nook framing, dusk lighting |
| `scripts/` | the three Python files that build, render and measure; `build_all()` in `chaibuild.py` rebuilds the model |
