# CHECKER W2R2 · Maker C — I06 3D Chai integration

**Verdict: APPROVE** `pe/w2r2-chai3d@2843fb0` (code `c698d74` + spec fix `14e758e`; kettle/src `42b2c1c2615f4c95013cd6cdf931729543d2dae8`).

**The merge also waits for Vibei's art sign-off** (brief; CHAI-3D-SPEC §7.4). This verdict covers the integration, the fallbacks, PRESERVE 8, placement, validation and cost. §5 lists exactly what Vibei is asked to judge.

| | |
|---|---|
| Lead checker | LEAD-2. I implemented none of this work |
| Revision | `2843fb0` (packet head). `git rev-parse 2843fb0:kettle/src` = `d23bc04:kettle/src` = `42b2c1c…`. kettle/src is unchanged since `c698d74` |
| Base | `assets/chai3d-r1@68caa31` = integration `15e8abe` + the asset commit. Its kettle/src and tests equal `b377c62`'s (`git diff --stat b377c62 68caa31 -- kettle/src kettle/tests` is empty) |
| Trial merge | `d23bc04` (integration + `2843fb0`), worktree `/home/user/wt/w3tr-c`, dev :5443, preview :5453 |
| Control | `b377c62`, dev :5410, preview :5430 |
| Packet | `/home/user/wt/w3c/kettle/review/product-excellence/contracts/W2R2/C-READY-FOR-REVIEW.md`; evidence `…/W2R2/C/` |
| Lane C receipt | `contracts/W2R2/review/LC/RECEIPT-LC.md` (Sonnet), read. The facts I rely on are marked "LC" and were checked against code or my own runs |
| My evidence | `contracts/W2R2/review/LEAD2/C/` (`tsc.log`, `vitest.log`, `chai3d-w2room-trial-5443.log`, `nook.log` + `nook/*.png`). Probe `/home/user/wt/w3-base/kettle/.tmp/LEAD2/c-lead.mjs` |

## 1. What I did

**Hashes, verified myself.** `sha256sum` of `art-src/chai/chai.glb` and of the runtime copy `src/scene/engine/models/chai.glb` gives `b401bc6c0fa9dd7a2abe27c135821634e7d1a4d9f9ba5263f50a436ceb463d7e` for both. The bytes the trial preview serves at `/assets/chai-B-OZIeNI.glb` hash the same. That file is in the service worker's precache manifest (`sw.js`) together with `three-gltf-DPXo6Yfo.js`.

**Diff review**, `68caa31..2843fb0`, all within C's ownership:
- `src/scene/**`, `tests/chai3d.spec.ts` and `vite.config.ts`;
- no `src/ui/**`, `src/screens/**`, `src/art/**` or `art-src/**` change.

What the code does:
- **`chaiModel.ts`.** The pose mapping is exactly REPORT.md's table:
  - awake = `eyes_open`;
  - nap = `eyes_sleep` + shape key `nap` = 1 on every body primitive + yuzu moved by `extras.nap_offset`;
  - sip = `eyes_sip` + `paws_mug`;
  - `eyes_happy` is hidden.
- **No scale fallback.** `loaf.scale` is breathing only: ±1.2 % x, ±3.5 % y, ±1.05 % z in nap. The procedural Chai's (1.1, 0.84, 1.06) nap scale is never applied. LC swept `update()` for 40 s in every pose: never near it, and never together with the key.
- **`validateChai`.** It checks:
  - the contract nodes;
  - the `nap` key on every body primitive;
  - a numeric `nap_offset`;
  - extents measured from vertices (with the nap key and `nap_offset` applied) within ±10 % of awake 0.59 × 0.99 × 0.57 and nap 0.68 × 0.61 × 1.03;
  - the floor origin within 1 cm;
  - ≤ 5,000 triangles and ≤ 6 draw calls per pose, ≤ 8,000 in the file.
- **`chaiLoad.ts`.**
  - fetch with an 8 s abort, meshopt `GLTFLoader` and validation, in a lazy chunk;
  - one template per page;
  - a network failure or timeout is retried on a later mount; a validation failure is rejected for the page's life.
- **`Engine.useChaiModel` / `upgradeChai`.**
  - The swap is in place: position, turn, `baseY`, the tap proxy, steam and zZ carry over.
  - The procedural geometry is disposed, except the shared unit plane. I checked `kit.sphere` and the other primitives: each call makes its own geometry, so nothing shared is freed.
  - The swap compiles only the new subtree, held behind `compiling++`.
- **`chaiHost.ts`.** The model is wanted on the high tier only (`MODEL_ON_LOW = false`), never in `window` mode. `?debug&chai3d=model|procedural` overrides it.
- **`NookScene`.** The summary close-up (`!interactive && highlightItem`) never adds the model itself. A fresh engine adds an already-parsed model inside its first sliced compile; otherwise the model swaps in after the first frame.
- **`warm.ts` / `index.tsx`.** Home's prewarm starts the load early, and the parked warm engine carries the model.
- **`vite.config.ts`.** `glb` is added to the precache glob, and the loader goes in its own `three-gltf` chunk.
- **Tests are real behaviour:** the request count, `chaiKind`, `__chai3d.status()` and the visible parts read from the scene graph. One weakness: the invalid-file spec falls back to junk bytes if `/art-src/chai/chai_r0.glb` is not served, so it may prove "a parse error keeps the procedural Chai" rather than "the validator rejects r0". The validator's own rejections are unit-tested in `chaiModel.test.ts` (old box, missing node, key or offset, floating origin), and LC rejected `eyes_sip`-missing and ×1.3 files against the shipped validator. Not a defect.

**Suites, run myself on the trial `d23bc04`:**

| Suite | Result | Log |
|---|---|---|
| `npx tsc --noEmit` | exit 0 | `review/LEAD2/C/tsc.log` |
| `npx vitest run` | 29 files, **285/285** (incl. `chaiModel.test.ts`) | `review/LEAD2/C/vitest.log` |
| chromium `chai3d.spec` + `w2-room.spec` vs dev :5443 | **15/15** (chai3d 8, w2-room 7), 4.4 min | `review/LEAD2/C/chai3d-w2room-trial-5443.log` |

Re-read, not re-run:
- the maker's full chromium (99/103: `break-reach:179` ×2 identical on control; statusbar resize passes on rerun on both; `w2-room` context loss 1/3 on **both** builds when run concurrently, per `C/runs/ctxloss-parallel-{5410,5423}.txt`, which I read);
- timer 14 + 12 (+2 skipped by design);
- pwa 3/3, whose own production build includes the glob (`C/runs/pwa.txt`).

**My own Nook probe** (`c-lead.mjs`, one browser): control :5430, trial :5453 with the model, and trial :5453 with `chai3d=procedural`, each at 390×844@3 light and 1440×900@2 dark, high tier forced with `nookq=high`. Result: NOOK_RESULT.

## 2. What I opened (full size)

- **Approved sheet and Chai art:**
  - `art-src/chai/chai-happy.png`;
  - the maker's art sheet `C/art/ART-REVIEW-SHEET.png` (overview), then full-size renders `C/art/model-awake-day.png`, `model-awake-night.png` and `model-nap-day.png`, against the procedural row on the sheet.
- **Nook at the size people see it** (the reference for the Nook frame is `live-nook.jpg` in the benchmark library), BEFORE → AFTER:
  - 390×844 light day: `C/captures/{BEFORE,AFTER}/390x844-light-day/10-nook-3d.png`;
  - 1440×900 light day: `C/captures/{BEFORE,AFTER}/1440x900-light-day/10-nook-3d.png`;
  - AFTER `1440x900-light-night/10-nook-3d.png`.
- **PRESERVE 8 (K03):**
  - `VISUAL_BENCHMARK_LIBRARY/assets/current/11b-summary-unlock-settled.png`;
  - then `C/captures/{BEFORE,AFTER}/390x844-light-day/07-unlock.png`: the record-player close-up is identical in framing and content, and Chai is out of frame.
- **My own probe frames:** `review/LEAD2/C/nook/*.png` (NOOK_FRAMES).

## 3. Acceptance

| Criterion (brief) | Result | Evidence |
|---|---|---|
| `chai.glb` sha `b401bc6c…63d7e` | **PASS** | my `sha256sum` of source, runtime copy and served bytes; unit test asserts both files |
| Pose table: awake = `eyes_open`; nap = `eyes_sleep` + nap key + yuzu `nap_offset`; sip = `eyes_sip` + `paws_mug` | **PASS** | code (`POSE_PARTS`, `setPose`); `chai3d.spec` "high tier" (parts `['eyes_open']`, nap `[0, 0]`); LC check 3 reads all three poses from the scene graph at 390 and 1440 (nap: `[('nap',1),('nap',1)]`, yuzu at `nap_offset`) |
| Never the nap key together with the scale fallback | **PASS** | code (breathing-only scale); unit test; LC 40 s sweep |
| Validator bounds | **PASS** | measured awake 0.585 × 0.993 × 0.567 and nap 0.682 × 0.612 × 1.032 (maker; LC independently 0.5854 × 0.9929 × 0.5670 / 0.6816 × 0.6115 × 1.0319), inside ±10 % of the targets. The targets are REPORT.md's own recommendation: the spec's 0.8 × 1.04 × 0.74 box was the old square loaf and would reject the sheet-proportioned model. Rejections unit-tested |
| Placement on the cushion | **PASS** | maker's ray probe (`C/placement.json`, read raw): awake and sip gap p05 −0.015, the same as the procedural Chai's; median +0.014 (procedural +0.043); 0 underside vertices beyond the rim; nap overhung 0.046 at the pivot, fixed by `NAP_FORWARD` 0.031 (nap only) → 0. LC independently: p05 −0.016 / −0.021, 0 beyond the rim at 390 and ≤ 0.0011 at 1440 nap (negligible; nap is mounted on no screen today). Frames: Chai sits on the cushion, no float, no sink |
| Procedural Chai first frame and fallback: load failure | **PASS** | `chai3d.spec` 404; LC 404, abort, junk 200 and HTML 200: procedural, 0 page errors |
| …timeout | **PASS** | `chai3d.spec` slow network (procedural while `loading`, `timeout (8000 ms)`, stays); LC 12 s hold |
| …offline (precache decision) | **PASS**, decision **ACCEPTED** | glb precached (in `sw.js`; pwa 3/3); offline Nook gets the model from the service worker (maker and LC, `fromServiceWorker: true`). The uncached-offline miss is not isolatable in this harness (**UNKNOWN**, environment); it is the same failed-fetch path as 404/abort, which pass |
| …3D off | **PASS** | static drawing, 0 canvases, 0 glb requests (`chai3d.spec`; LC) |
| …low tier | **PASS** | procedural, 0 glb requests (`chai3d.spec`; LC's default path on this machine resolves to low: procedural, 0 requests) |
| …context loss | **PASS** | static drawing while lost; rebuilt engine carries the model from memory, no second request (`chai3d.spec`; LC raw 100 ms timeline) |
| Unlock close-up unchanged (PRESERVE 8) | **PASS** | code path: no model added when not interactive and highlighted. LC check 6: the card's engine is `procedural` on both builds at the default and the forced-high tier, same camera (az 0.56 / el 0.4 / zoom 0.125), Chai out of frame (NDC x −10.26). BEFORE/AFTER frames identical in framing |
| Frame time and memory vs the procedural Chai | **PASS (within noise), real phone UNKNOWN** | Maker (3 alternating runs per variant, SwiftShader, load 12–14): sync frame median model-high 521 / procedural 501 / control 486 ms, with per-run ranges overlapping (485–530 vs 487–582). LC (2 runs, load 14–16): 562 / 569 / 530. Draw calls −6 (high) / −3 (low); triangles −3.3k / −1.8k; geometries −3; textures +2 (morph-target data); programs +4–6; JS heap +0.46–0.58 MB. LC's live rAF interval (model 471 vs procedural 350 vs control 365 ms) varies 20–34 frames/10 s *within* each variant at load 14–16 and is contradicted by the controlled sync measure and by lower `render()` JS time (2.5 vs 3.2 ms); I do not read it as a regression. A real-phone frame time cannot be measured here |

## 4. Rulings on the maker's three questions

1. **Low tier keeps the procedural Chai (`MODEL_ON_LOW = false`): ACCEPTED as the shipped default.**
   - It is exactly CHAI-3D-SPEC §6.2's recommendation ("keep the procedural Chai, unless measurement on a real low-end phone shows the model costs no more frame time"), and no real phone is available in this environment.
   - It is not a regression: before this change everyone saw the procedural Chai in 3D; after it, the high tier sees the approved character and the low tier is unchanged.
   - **The product consequence goes to Vibei as an owner decision.** The low tier covers CPU rasterizers, mobile devices with ≤ 4 cores or ≤ 3 GB, and save-data; the maker states this includes iOS and 4-core phones. Many phone users will therefore keep the old 3D Chai until the constant flips.
   - The evidence so far: SwiftShader, the slowest renderer, shows fewer draw calls and triangles and no measurable frame-time cost, against +4 shader programs to compile and +0.5 MB.
   - Recommended next step for Vibei: open `/?debug&chai3d=model&nookq=low#/nook` once on a real low-end phone (the override works on any tier) and compare with `chai3d=procedural`. If the frame time is the same, flip the one constant. Owner: scene.
2. **The summary close-up shows the procedural Chai unless the engine it adopts already carries the model: ACCEPTED.**
   - The brief requires the unlock close-up unchanged (PRESERVE 8), and this is the only design that adds no compile before or during the drawing → close-up hand-off.
   - The record-player close-up (the K03 reference) frames Chai out of view, so no one sees which Chai it is.
   - FOLLOW-UP (scene): a close-up that frames Chai (a cushion unlock) would show the procedural Chai on the high tier. Measure the extra sliced compile against the drawing hand-off before changing it.
3. **The fur reads darker and warmer under the room's warm lamp and stove light: for Vibei's art sign-off; not a defect of C.**
   - The procedural Chai darkens the same way in the same frames (the art sheet's "Night reference" row), so this is the room's lighting, which the brief does not authorise changing.
   - At night the face stays readable: nose and eyes separate from the fur (`model-awake-night.png`).

## 5. What Vibei is asked to judge (art sign-off, CHAI-3D-SPEC §7.4)

- The three poses in the room, day, evening and night: `C/art/ART-REVIEW-SHEET.png` and the full-size renders in `C/art/`.
- **Fur tone under the warm room light** (ruling 3).
- **Display footprint (PRESERVE 2).**
  - At the root scale kept at 1.12, the model has the sheet's proportions: the same height as the procedural Chai on the cushion, about 70 % of its width.
  - At the Nook framing it reads as a slimmer, smaller figure on the cushion: 390×844 light day and 1440×900 light day BEFORE → AFTER.
  - REPORT.md offered the alternative of raising the root scale "if Chai should fill the cushion as before". C kept 1.12 so that Chai does not grow taller than before.
  - My view: the approved proportions at the preserved height are the right default. Whether the footprint should be restored by scale is an art call.
- The checklist items that cannot run here: the five-viewer "same character" check, and a real-phone frame time (with ruling 1).

## 6. Residuals

| # | Item | Class | Owner / note |
|---|---|---|---|
| C-1 | Low tier keeps the procedural 3D Chai | **OWNER DECISION** (Vibei) | §4.1; one constant after a real-phone check |
| C-2 | Fur reads darker/warmer under the room's warm light; display footprint slimmer at scale 1.12 | **ART SIGN-OFF** (Vibei) | §5 |
| C-3 | After a network failure the model is re-requested on every later mount and by several callers: LC saw 5 requests (404 ×5) over one Home → Nook round trip; a junk/HTML 200 (parse `SyntaxError`) is also not remembered | **FOLLOW-UP** (minor) | scene: back off after a failure (e.g. retry only on `online` or after a delay); remember parse failures like validation failures. No user-visible effect: the procedural Chai stays, 0 errors |
| C-4 | The precache downloads the 45.6 KB glb (and the 70 KB loader chunk) on low-tier installs that never use them; the `three` chunk grows 29.8 KB for every 3D user | **ACCEPTED** (trade-off) | Content-hashed, +5 % of a 2.98 MB precache, keeps the same Chai offline. If C-1 stays "high only" for long, consider runtime caching on first use instead. Owner: scene/pwa |
| C-5 | Summary close-up that frames Chai would show the procedural Chai on the high tier | **FOLLOW-UP** | §4.2; scene |
| C-6 | Uncached-offline miss not isolatable here; real-phone frame time; five-viewer check | **UNKNOWN / BLOCKED** (environment) | Covered by the 404/abort path; §5 |
| C-7 | `w2-room.spec` "3D failure (WebGL context lost)" screenshot timeout under load | **FOLLOW-UP** (pre-existing test flake) | 1/3 on both builds concurrently (maker); LC run 1 failed / run 2 passed. Test owner (scene) |
| C-8 | `break-reach.spec.ts:179` @200 % | **FOLLOW-UP** (pre-existing) | identical on control; T's item f |
| C-9 | `statusbar.spec` rapid resize (dark) | **FOLLOW-UP** (pre-existing load flake) | passes on rerun on both builds (maker) |
| C-10 | A Focus backdrop (`window` view) built from the adopted warm engine may carry the model unseen (its programs compiled) | **ACCEPTED** | high tier only, Chai out of frame; LC check 6 shows `chaiKind` model in `window` at 500 ms on the high tier |

No BLOCKS.

## 7. The pairs that show the change

- **Nook, 390×844 light day:**
  - BEFORE `/home/user/wt/w3c/kettle/review/product-excellence/contracts/W2R2/C/captures/BEFORE/390x844-light-day/10-nook-3d.png`
  - AFTER `/home/user/wt/w3c/kettle/review/product-excellence/contracts/W2R2/C/captures/AFTER/390x844-light-day/10-nook-3d.png`
- **Nook, 1440×900 light day:** `…/C/captures/{BEFORE,AFTER}/1440x900-light-day/10-nook-3d.png`
- **The character close (art):** `C/art/procedural-awake-day.png` → `C/art/model-awake-day.png`
- **PRESERVE 8 unchanged:** `…/C/captures/{BEFORE,AFTER}/390x844-light-day/07-unlock.png`
