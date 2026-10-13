# RECEIPT-LC: Lane C review of Maker C, I06 3D Chai (W2R2)

Reviewer: Lane C (check runner; raw numbers only, no verdicts and no visual judgements). Started 09:56 UTC, written 10:5x to 11:2x UTC (see "Times").

- **Revision under review:** `pe/w2r2-chai3d@2843fb0` (code `c698d74`, `kettle/src` tree `42b2c1c`). Trial = `d23bc04` (integration + that branch), worktree `/home/user/wt/w3tr-c`: dev :5443 (debug API), production preview :5453 (`/tmp/rv7-servers/dist-w3tr-c`, built 09:54). Control = `b377c62`: dev :5410, preview :5430.
- **Machine:** 4 cores, load average 9 to 15 during the run, WebGL = ANGLE/SwiftShader (CPU rasterizer), Playwright 1.56.1 / Chromium headless shell 141, flags `--enable-unsafe-swiftshader --use-angle=swiftshader --ignore-gpu-blocklist`.
- **Browser gate:** every browser launch went through `slots.py run --lane LC --n 1` (one browser at a time). The first slot was granted 10:25 (about 29 min after queueing at 09:59; other lanes held the slots), which is why not everything could be run; see "Incomplete".
- **Harness:** scripts in `/home/user/wt/w3tr-c/kettle/.tmp/LC/` (`lib.mjs`, `a-default.mjs`, `b-forced.mjs`, `c-fallback.mjs`, `d-offline.mjs`, `e-unlock.mjs`, `f-diff.mjs`, `g-perf.mjs`, `h-validate.mjs`, `i-ctxshot.mjs`, job wrappers `job*.sh`). Scratch in `/tmp/claude-0/lc-scratch/`. No source file, commit, push or server was touched. Instrumentation is read-only except where stated (`setState({mode})` / `setRunning` on `window.__nook` to hold a pose; `renderer.render` wrapped for 10 s in check 7; `WEBGL_lose_context`).
- **How the high tier was forced (as the packet does):** Settings `3D = high` set through `__kettle.settings` then a reload (the spec's method), plus `?nookq=high` for the PRESERVE 8 and perf runs (the packet's capture method). Default path = no forcing at all. `?debug&seed=veteran&theme=...&nooktime=...&nookweather=clear` for setup only.
- **Engine reads:** `window.__nook` (the engine, debug only) and `window.__chai3d.status()`. Chai facts are read from `__nook.chai.root` and the scene graph (visible meshes, `morphTargetInfluences` / `morphTargetDictionary`, `userData`), not from the maker's own spec helpers.

## Facts at a glance (each is backed by a table below; no verdict)

1. Hashes: source, runtime copy, bundled `chai-B-OZIeNI.glb` and the bytes served by :5453 all equal `b401bc6c...463d7e`. No change under `art-src/` or `src/art/` since `68caa31`.
2. Default path (no forcing, SwiftShader machine): tier `low`, procedural Chai, 0 page-level `.glb` requests at 390x844, 1440x900 and 390x844 with mobile emulation; the service worker's precache nevertheless holds `chai-B-OZIeNI.glb` (119 entries).
3. Forced high tier: model ready (status.ms) in 22 to 39 ms (45,572 B), 1 `.glb` request, awake = `eyes_open` / nap = `eyes_sleep` + `nap` key 1 on both body primitives + yuzu at rest + `nap_offset` / sip = `eyes_sip` + `paws_mug`; root scale 1.12 and position (-0.95, 0.255, 1.15) in all poses; loaf scale never near (1.1, 0.84, 1.06); nap key and that scale never together; placement gap p05 about -0.016 (awake, sip) / -0.021 (nap), nap with 0 to 2 underside vertices beyond the rim by at most 0.0011.
4. Fallbacks (404, abort, 12 s delay, corrupt, HTML 200, 3D off, low tier): final Chai procedural / static as expected, 0 pageerrors, 0 bad 100 ms samples. Context loss: 4.4 s unusable engine with the static drawing mounted, rebuilt with the model and no second request.
5. Offline: model served from the service worker (`fromServiceWorker: true`); uncached-offline not isolated by this harness (as in the packet).
6. PRESERVE 8: the unlock card's engine is `procedural` in both builds at default and forced-high tiers, same camera (zoom 0.125, fitTarget identical), Chai out of frame (NDC x -10.26 at 390, -7.69 at 1440); pixel differences control vs C are listed with bounding boxes (1440x900 default and high settled frames: inside x 942..1367, y 145..384, which is the close-up canvas area of the card in the screenshot; 390x844: boxes listed, not checked against the layout); frames are not time-synchronised.
7. Perf (high tier, 2 runs each, load 14 to 16): sync frame ms medians 530 (control) / 569 (C procedural) / 562 (C model); draw calls 161 / 161 / 155, triangles 128,792 / 128,792 / 125,500, programs 19 / 19 / 25, textures 10 / 10 / 12, geometries 114 / 114 / 111; JS heap 10.25 / 10.39 / 10.81 MB; process-tree RSS 671 / 675 / 685 MB.

## Times (UTC, 2026-10-13) and commands

| Job | Start to end | Command |
|---|---|---|
| Check 1 | 09:56 to 10:05 | `sha256sum`, `git diff`, `h-validate.mjs` (node), `npx vitest run src/scene/engine/chaiModel.test.ts` |
| Check 2 (default path) | 10:25:26 to 10:27:21 | `slots.py run --lane LC --n 1 -- bash .tmp/LC/jobB.sh` (first line: `node .tmp/LC/a-default.mjs --base http://127.0.0.1:5453 --tag C-5453`) |
| Check 3 (forced high) | 10:27:21 to 10:33:27; placement re-run 10:33:29 to 10:34:51 | `node .tmp/LC/b-forced.mjs --vp 390x844@2` then `--vp 1440x900@1`; re-run `--noshots true --variants light` |
| Check 4 (fallback matrix) | 10:34:51 to 10:44:24; ctx-loss re-run with raw samples 10:53:35 to 10:54:20; DOM probe 11:04:08 to 11:05:01 | `node .tmp/LC/c-fallback.mjs`; `--only 10-context-loss-restore --raw true`; `node .tmp/LC/i-ctxshot.mjs` |
| Check 5 (offline) | 10:44:30 to 10:45:30 | `PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS=1 node .tmp/LC/d-offline.mjs` |
| Check 6 (PRESERVE 8) | 10:45:31 to 10:53:33 | `node .tmp/LC/e-unlock.mjs` then `node .tmp/LC/f-diff.mjs <c6 dir>` |
| Check 7 (perf, memory) | invalid attempt 10:54:20 to 10:58:06 (killed); re-run 10:58:06 to 11:04:07 | `node .tmp/LC/g-perf.mjs --set high --reps 2` |
| Check 8 (specs) | 11:05:02 to see the table | `KETTLE_PORT=5443 npx playwright test tests/chai3d.spec.ts tests/w2-room.spec.ts --project=chromium --workers=1 --reporter=list --output /tmp/claude-0/lc-scratch/pw-results-N` x2 (via `jobS.sh`, one slot) |


## Results

### Check 1: hash and diff (raw: `check1-hash-diff.txt`, `c1-validate-glb.json`, `c1-precache-manifest.json`, `c8-vitest-chaiModel.txt`)

| Item | Result |
|---|---|
| sha256 `kettle/art-src/chai/chai.glb` | `b401bc6c0fa9dd7a2abe27c135821634e7d1a4d9f9ba5263f50a436ceb463d7e` (equals the brief's value) |
| sha256 runtime copy `kettle/src/scene/engine/models/chai.glb` (trial) | `b401bc6c...463d7e` (same) |
| sha256 preview bundle `/tmp/rv7-servers/dist-w3tr-c/assets/chai-B-OZIeNI.glb` | `b401bc6c...463d7e` (same), 45,572 bytes |
| sha256 of the bytes served by :5453 for `/assets/chai-B-OZIeNI.glb` | `b401bc6c...463d7e` (same) |
| `git diff 68caa31 HEAD --stat -- kettle/art-src kettle/src/art` | empty (no change); `--name-only` also empty |
| `git diff b377c62 HEAD --stat -- kettle/src kettle/tests kettle/vite.config.ts` | 14 files, +1004 / -10: `src/scene/{NookScene.tsx, chaiHost.ts, index.tsx, resolve.ts, warm.ts}`, `src/scene/engine/{Engine.ts, chai.ts, chaiLoad.ts, chaiModel.ts, chaiModel.test.ts, kit.ts, models/chai.glb}`, `tests/chai3d.spec.ts`, `vite.config.ts`. No file outside `src/scene/**`, `vite.config.ts`, `tests/chai3d.spec.ts`. |
| `kettle/src` tree | HEAD `42b2c1c2615f4c95013cd6cdf931729543d2dae8` = `2843fb0:kettle/src` = `c698d74:kettle/src` |
| Precache (from `sw.js`, files present) | control dist: 116 entries, 2,975,711 B. trial dist: 119 entries, 3,131,346 B (+3 entries: `three-gltf-DPXo6Yfo.js` 70,339 B, `chaiLoad-Cf4zRQAm.js` 1,506 B, `chai-B-OZIeNI.glb` 45,572 B; +155,635 B). `index.html` does not reference the glTF loader or the glb. |
| Validator on the real file, independent code (`h-validate.mjs`, node, GLTFLoader + meshopt) | awake extents 0.5854 x 0.9929 x 0.5670, min y 0 (deviation from 0.59 x 0.99 x 0.57: -0.78 %, +0.29 %, -0.53 %). nap (key `nap` = 1, `eyes_sleep`, yuzu + `nap_offset`) 0.6816 x 0.6115 x 1.0319, min y 0 (deviation +0.24 %, +0.25 %, +0.18 % from 0.68 x 0.61 x 1.03). sip 0.5854 x 0.9929 x 0.7140. `nap_offset` = (-0.09, -0.3814, 0.154). Node names: chai, body (2 prims, key `nap`), eyes_happy, eyes_open, eyes_sip, eyes_sleep, paws_mug (2 prims), yuzu. |
| The shipped `validateChai` (imported from `src/scene/engine/chaiModel.ts` in node) on the same parse | accepts: awake size [0.585, 0.993, 0.567], tris 4342, calls 4; nap [0.682, 0.612, 1.032], tris 4250, calls 4, centre [0.006, -0.052]; sip tris 4780, calls 6; fileTris 5372. Negative controls: file with `eyes_sip` removed -> `rejected: missing node "eyes_sip"`; body scaled x1.3 -> `rejected: awake x extent 0.761 is not within +-10 % of 0.59`. |
| `npx vitest run src/scene/engine/chaiModel.test.ts` | 10/10 passed (1.4 s) |


### Check 2: default path, production preview :5453, no forcing (settings.scene = auto, 3D on), Nook

| Viewport | WebGL renderer (page) | cores / mem | pointer coarse | Tier (`engine.quality`) | Chai shown (`chaiKind`, `root.userData.model`, meshes with morph targets, model nodes in Chai) | page requests for `*.glb` | `__chai3d.status()` | SW precache has `chai-*.glb` | console / pageerrors |
|---|---|---|---|---|---|---|---|---|---|
| 390x844 | ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver) | 4 / 8 | False | low | procedural, False, 0, [] | 0 | {'state': 'idle'} | True (entries [119]) | 0 console lines, 0 pageerrors |
| 1440x900 | ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver) | 4 / 8 | False | low | procedural, False, 0, [] | 0 | {'state': 'idle'} | True (entries [119]) | 0 console lines, 0 pageerrors |
| 390x844-mobileEmu | ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver) | 4 / 8 | True | low | procedural, False, 0, [] | 0 | {'state': 'idle'} | True (entries [119]) | 0 console lines, 0 pageerrors |

- 390x844: all requests matching /chai|.glb|three-gltf/ seen by the page: [('chai-sipping-DTyMuyps.webp', 'image')]; samples (100 ms) {'n': 157, 'kinds': {'procedural': 157}, 'notInScene': 0, 'notShown': 0}
- 1440x900: all requests matching /chai|.glb|three-gltf/ seen by the page: [('chai-sipping-DTyMuyps.webp', 'image')]; samples (100 ms) {'n': 162, 'kinds': {'procedural': 162}, 'notInScene': 0, 'notShown': 0}
- 390x844-mobileEmu: all requests matching /chai|.glb|three-gltf/ seen by the page: [('chai-sipping-DTyMuyps.webp', 'image')]; samples (100 ms) {'n': 157, 'kinds': {'procedural': 157}, 'notInScene': 0, 'notShown': 0}

### Check 3: forced high tier (Settings: 3D = high, reload), Nook; pose read from the scene graph

Time-of-day: light = `nooktime=day`; dark = theme dark (auto time); night = theme dark + `nooktime=night`. Facts read with the loop paused (after 3.5 s in each pose).

#### 390x844

| Variant (engine time) | Model loaded (status) | Pose (mode) | Eyes shown | `paws_mug` | Active shape keys | Yuzu local pos | Root pos / scale | loaf scale seen over a 40 s `update()` sweep (min..max per axis) | nap key and scale fallback (1.1,0.84,1.06) both? | Chai extents in its own frame (unscaled) |
|---|---|---|---|---|---|---|---|---|---|---|
| light (day) | ready (35 ms, 45572 B) | awake (showcase) | ['eyes_open'] | False | none (nap=0) | [0.028, 0.8, 0] | [-0.95, 0.255, 1.15] / 1.12 | [0.9937, 0.982, 0.9946]..[1.0063, 1.018, 1.0054] | False | [0.589, 1.0165, 0.57] |
| light (day) | ready (35 ms, 45572 B) | nap (focus) | ['eyes_sleep'] | False | [('nap', 1), ('nap', 1)] | [-0.062, 0.4186, 0.154] | [-0.95, 0.255, 1.15] / 1.12 | [0.9878, 0.965, 0.9895]..[1.0122, 1.035, 1.0105] | False | [0.6891, 0.6331, 1.0417] |
| light (day) | ready (35 ms, 45572 B) | sip (break) | ['eyes_sip'] | True | none (nap=0) | [0.028, 0.8, 0] | [-0.95, 0.255, 1.15] / 1.12 | [0.9937, 0.982, 0.9946]..[1.0063, 1.018, 1.0054] | False | [0.5817, 0.9701, 0.6925] |
| dark (night) | ready (27 ms, 45572 B) | awake (showcase) | ['eyes_open'] | False | none (nap=0) | [0.028, 0.8, 0] | [-0.95, 0.255, 1.15] / 1.12 | [0.9937, 0.982, 0.9946]..[1.0063, 1.018, 1.0054] | False | [0.5889, 1.0159, 0.5699] |
| dark (night) | ready (27 ms, 45572 B) | nap (focus) | ['eyes_sleep'] | False | [('nap', 1), ('nap', 1)] | [-0.062, 0.4186, 0.154] | [-0.95, 0.255, 1.15] / 1.12 | [0.9878, 0.965, 0.9895]..[1.0122, 1.035, 1.0105] | False | [0.6892, 0.6333, 1.0418] |
| dark (night) | ready (27 ms, 45572 B) | sip (break) | ['eyes_sip'] | True | none (nap=0) | [0.028, 0.8, 0] | [-0.95, 0.255, 1.15] / 1.12 | [0.9937, 0.982, 0.9946]..[1.0063, 1.018, 1.0054] | False | [0.5818, 0.9693, 0.6939] |
| night (night) | ready (39 ms, 45572 B) | awake (showcase) | ['eyes_open'] | False | none (nap=0) | [0.028, 0.8, 0] | [-0.95, 0.255, 1.15] / 1.12 | [0.9937, 0.982, 0.9946]..[1.0063, 1.018, 1.0054] | False | [0.589, 1.0164, 0.57] |
| night (night) | ready (39 ms, 45572 B) | nap (focus) | ['eyes_sleep'] | False | [('nap', 1), ('nap', 1)] | [-0.062, 0.4186, 0.154] | [-0.95, 0.255, 1.15] / 1.12 | [0.9878, 0.965, 0.9895]..[1.0122, 1.035, 1.0105] | False | [0.6883, 0.6301, 1.0407] |
| night (night) | ready (39 ms, 45572 B) | sip (break) | ['eyes_sip'] | True | none (nap=0) | [0.028, 0.8, 0] | [-0.95, 0.255, 1.15] / 1.12 | [0.9937, 0.982, 0.9946]..[1.0063, 1.018, 1.0054] | False | [0.5817, 0.9691, 0.6936] |

Page samples at 100 ms (whole run, from page start): light: {'n': 315, 'kinds': {'model': 315}, 'notInScene': 0, 'notShown': 0, 'zeroVisMeshes': 0}; dark: {'n': 329, 'kinds': {'model': 329}, 'notInScene': 0, 'notShown': 0, 'zeroVisMeshes': 0}; night: {'n': 300, 'kinds': {'model': 300}, 'notInScene': 0, 'notShown': 0, 'zeroVisMeshes': 0}

Chai requests per run: light: [('three-gltf-DPXo6Yfo.js', 'script'), ('chai-B-OZIeNI.glb', 'fetch')] -> [('three-gltf-DPXo6Yfo.js', 200), ('chai-B-OZIeNI.glb', 200)], pageerrors 0; dark: [('three-gltf-DPXo6Yfo.js', 'script'), ('chai-B-OZIeNI.glb', 'fetch')] -> [('three-gltf-DPXo6Yfo.js', 200), ('chai-B-OZIeNI.glb', 200)], pageerrors 0; night: [('three-gltf-DPXo6Yfo.js', 'script'), ('chai-B-OZIeNI.glb', 'fetch')] -> [('three-gltf-DPXo6Yfo.js', 200), ('chai-B-OZIeNI.glb', 200)], pageerrors 0

Placement against the visible cushion puff (re-run 390x844, light; `c3/forced-high-390x844-placement.json`). Cushion puff world bbox y 0.0358..0.2765, rim radius 0.587, centre [-0.95, 1.15]. Gap = vertex y minus cushion surface hit by a ray straight down from each underside vertex (world y < Chai min y + 0.09), scene units; negative = pressed in.

| Pose | Chai min y | puff top y | min y minus puff top | underside verts | gap min | gap p05 | gap median | rays that missed the puff | verts beyond rim radius (max beyond) | Chai bbox half-extents x,z | Chai centre minus cushion centre x,z |
|---|---|---|---|---|---|---|---|---|---|---|---|
| awake | 0.2536 | 0.2765 | -0.0229 | 265 | -0.0225 | -0.0164 | 0.0159 | 1 | 0 (0) | [0.3386, 0.3438] | [-0.0025, 0.009] |
| nap | 0.255 | 0.2765 | -0.0215 | 459 | -0.0215 | -0.021 | 0.0171 | 1 | 0 (0) | [0.3853, 0.5566] | [-0.0592, 0.0086] |
| sip | 0.255 | 0.2765 | -0.0215 | 266 | -0.0213 | -0.0154 | 0.0136 | 1 | 0 (0) | [0.3595, 0.3712] | [0.0235, 0.0388] |

#### 1440x900

| Variant (engine time) | Model loaded (status) | Pose (mode) | Eyes shown | `paws_mug` | Active shape keys | Yuzu local pos | Root pos / scale | loaf scale seen over a 40 s `update()` sweep (min..max per axis) | nap key and scale fallback (1.1,0.84,1.06) both? | Chai extents in its own frame (unscaled) |
|---|---|---|---|---|---|---|---|---|---|---|
| light (day) | ready (39 ms, 45572 B) | awake (showcase) | ['eyes_open'] | False | none (nap=0) | [0.028, 0.8, 0] | [-0.95, 0.255, 1.15] / 1.12 | [0.9937, 0.982, 0.9946]..[1.0063, 1.018, 1.0054] | False | [0.5888, 1.0166, 0.5698] |
| light (day) | ready (39 ms, 45572 B) | nap (focus) | ['eyes_sleep'] | False | [('nap', 1), ('nap', 1)] | [-0.062, 0.4186, 0.154] | [-0.95, 0.255, 1.15] / 1.12 | [0.9878, 0.965, 0.9895]..[1.0122, 1.035, 1.0105] | False | [0.6881, 0.6293, 1.0404] |
| light (day) | ready (39 ms, 45572 B) | sip (break) | ['eyes_sip'] | True | none (nap=0) | [0.028, 0.8, 0] | [-0.95, 0.255, 1.15] / 1.12 | [0.9937, 0.982, 0.9946]..[1.0063, 1.018, 1.0054] | False | [0.5817, 0.9719, 0.6917] |
| dark (night) | ready (62 ms, 45572 B) | awake (showcase) | ['eyes_open'] | False | none (nap=0) | [0.028, 0.8, 0] | [-0.95, 0.255, 1.15] / 1.12 | [0.9937, 0.982, 0.9946]..[1.0063, 1.018, 1.0054] | False | [0.5886, 1.0157, 0.5697] |
| dark (night) | ready (62 ms, 45572 B) | nap (focus) | ['eyes_sleep'] | False | [('nap', 1), ('nap', 1)] | [-0.062, 0.4186, 0.154] | [-0.95, 0.255, 1.15] / 1.12 | [0.9878, 0.965, 0.9895]..[1.0122, 1.035, 1.0105] | False | [0.6877, 0.628, 1.0398] |
| dark (night) | ready (62 ms, 45572 B) | sip (break) | ['eyes_sip'] | True | none (nap=0) | [0.028, 0.8, 0] | [-0.95, 0.255, 1.15] / 1.12 | [0.9937, 0.982, 0.9946]..[1.0063, 1.018, 1.0054] | False | [0.5819, 0.9715, 0.6953] |
| night (night) | ready (90 ms, 45572 B) | awake (showcase) | ['eyes_open'] | False | none (nap=0) | [0.028, 0.8, 0] | [-0.95, 0.255, 1.15] / 1.12 | [0.9937, 0.982, 0.9946]..[1.0063, 1.018, 1.0054] | False | [0.5886, 1.0159, 0.5697] |
| night (night) | ready (90 ms, 45572 B) | nap (focus) | ['eyes_sleep'] | False | [('nap', 1), ('nap', 1)] | [-0.062, 0.4186, 0.154] | [-0.95, 0.255, 1.15] / 1.12 | [0.9878, 0.965, 0.9895]..[1.0122, 1.035, 1.0105] | False | [0.6878, 0.6283, 1.04] |
| night (night) | ready (90 ms, 45572 B) | sip (break) | ['eyes_sip'] | True | none (nap=0) | [0.028, 0.8, 0] | [-0.95, 0.255, 1.15] / 1.12 | [0.9937, 0.982, 0.9946]..[1.0063, 1.018, 1.0054] | False | [0.5818, 0.9698, 0.6945] |

Page samples at 100 ms (whole run, from page start): light: {'n': 586, 'kinds': {'model': 586}, 'notInScene': 0, 'notShown': 0, 'zeroVisMeshes': 0}; dark: {'n': 655, 'kinds': {'model': 655}, 'notInScene': 0, 'notShown': 0, 'zeroVisMeshes': 0}; night: {'n': 613, 'kinds': {'model': 613}, 'notInScene': 0, 'notShown': 0, 'zeroVisMeshes': 0}

Chai requests per run: light: [('three-gltf-DPXo6Yfo.js', 'script'), ('chai-B-OZIeNI.glb', 'fetch')] -> [('three-gltf-DPXo6Yfo.js', 200), ('chai-B-OZIeNI.glb', 200)], pageerrors 0; dark: [('three-gltf-DPXo6Yfo.js', 'script'), ('chai-B-OZIeNI.glb', 'fetch')] -> [('three-gltf-DPXo6Yfo.js', 200), ('chai-B-OZIeNI.glb', 200)], pageerrors 0; night: [('three-gltf-DPXo6Yfo.js', 'script'), ('chai-B-OZIeNI.glb', 'fetch')] -> [('three-gltf-DPXo6Yfo.js', 200), ('chai-B-OZIeNI.glb', 200)], pageerrors 0

Placement against the visible cushion puff (re-run 1440x900, light; `c3/forced-high-1440x900-placement.json`). Cushion puff world bbox y 0.0358..0.2765, rim radius 0.587, centre [-0.95, 1.15]. Gap = vertex y minus cushion surface hit by a ray straight down from each underside vertex (world y < Chai min y + 0.09), scene units; negative = pressed in.

| Pose | Chai min y | puff top y | min y minus puff top | underside verts | gap min | gap p05 | gap median | rays that missed the puff | verts beyond rim radius (max beyond) | Chai bbox half-extents x,z | Chai centre minus cushion centre x,z |
|---|---|---|---|---|---|---|---|---|---|---|---|
| awake | 0.253 | 0.2765 | -0.0235 | 264 | -0.023 | -0.0169 | 0.0164 | 1 | 0 (0) | [0.3384, 0.3435] | [-0.0031, 0.0092] |
| nap | 0.255 | 0.2765 | -0.0215 | 457 | -0.0215 | -0.0209 | 0.0172 | 2 | 2 (0.0011) | [0.3867, 0.5586] | [-0.0594, 0.0087] |
| sip | 0.255 | 0.2765 | -0.0215 | 265 | -0.0213 | -0.0155 | 0.014 | 1 | 0 (0) | [0.3605, 0.372] | [0.0231, 0.0383] |


### Check 4: fallback matrix (production preview :5453, 390x844 @1, light/day, Settings 3D as noted, service worker blocked so `page.route` sees the request)

Sampler: in-page, every 100 ms from page start, reads the engine scene: Chai root in scene, shown, visible meshes > 0, engine usable. "bad" = a sample with the engine present but any of those false. Console lines "Service Worker registration blocked by Playwright" and "[pwa] service worker registration failed ... reading 'waiting'" are artefacts of the blocked-SW context and appear in every case; they are excluded below.

| Case | 3D setting | Final Chai (`chaiKind`) | `__chai3d.status()` final | `.glb` requests (this page life) | Engine samples / bad samples (whole run) | Kind transitions (ms from page start) | First 3 s after the engine appears (n / bad / max gap ms) | Canvas / static hosts at end | Console (non-SW) | pageerrors |
|---|---|---|---|---|---|---|---|---|---|---|
| 00-baseline-ok | high | model | {'state': 'ready', 'ms': 22, 'bytes': 45572} | 1 | 259 / 0 | [{'t': 6778, 'k': 'model'}] | 28 / 0 / 461 | [{'mode': 'showcase', 'ready': 'true', 'static': None, 'canvas': 1}] | ['info: [chai3d] model ready {state: ready, ms: 22, bytes: 45572} {awake: Object, nap: Object, sip'] | 0 |
| 01-404-fulfil | high | procedural | {'state': 'failed', 'reason': 'Error: HTTP 404', 'ms': 7} | 5 | 385 / 0 | [{'t': 6066, 'k': 'procedural'}] | 30 / 0 / 240 | [{'mode': 'showcase', 'ready': 'true', 'static': None, 'canvas': 1}] | ['error: Failed to load resource: the server responded with a status of 404 (Not Found)', 'info: [chai3d] keeping the procedural Chai: Error: HTTP 404', 'error: Failed to load resource: the server responded with a status of 404 (Not Found)', 'info: [chai3d] keeping the procedural Chai: Error: HTTP 404'] | 0 |
| 02-abort | high | procedural | {'state': 'failed', 'reason': 'TypeError: Failed to fetch', 'ms': 68} | 5 | 377 / 0 | [{'t': 5626, 'k': 'procedural'}] | 28 / 0 / 393 | [{'mode': 'showcase', 'ready': 'true', 'static': None, 'canvas': 1}] | ['error: Failed to load resource: net::ERR_FAILED', 'info: [chai3d] keeping the procedural Chai: TypeError: Failed to fetch', 'error: Failed to load resource: net::ERR_FAILED', 'info: [chai3d] keeping the procedural Chai: TypeError: Failed to fetch'] | 0 |
| 03-slow-12s-then-continue | high | procedural | {'state': 'failed', 'reason': 'timeout (8000 ms)', 'ms': 8000} | 1 | 334 / 0 | [{'t': 4766, 'k': 'procedural'}] | 30 / 0 / 254 | [{'mode': 'showcase', 'ready': 'true', 'static': None, 'canvas': 1}] | ['info: [chai3d] keeping the procedural Chai: timeout (8000 ms)'] | 0 |
| 05-corrupt-junk-200 | high | procedural | {'state': 'failed', 'reason': 'SyntaxError: Unexpected token \'\x07\', "\x07�\r�\x13�\x19�\x1f�"... is not valid JSON', 'ms': 23} | 2 | 259 / 0 | [{'t': 4936, 'k': 'procedural'}] | 30 / 0 / 270 | [{'mode': 'showcase', 'ready': 'true', 'static': None, 'canvas': 1}] | ['info: [chai3d] keeping the procedural Chai: SyntaxError: Unexpected token \'\x07\', "\x07�\r�\x13�\x19�\x1f�"... i', 'info: [chai3d] keeping the procedural Chai: SyntaxError: Unexpected token \'\x07\', "\x07�\r�\x13�\x19�\x1f�"... i'] | 0 |
| 07-html-200-spa-fallback | high | procedural | {'state': 'failed', 'reason': 'SyntaxError: Unexpected token \'<\', "<!doctype "... is not valid JSON', 'ms': 12} | 2 | 260 / 0 | [{'t': 3153, 'k': 'procedural'}] | 30 / 0 / 291 | [{'mode': 'showcase', 'ready': 'true', 'static': None, 'canvas': 1}] | ['info: [chai3d] keeping the procedural Chai: SyntaxError: Unexpected token \'<\', "<!doctype "... i', 'info: [chai3d] keeping the procedural Chai: SyntaxError: Unexpected token \'<\', "<!doctype "... i'] | 0 |
| 08-3d-off | off | None | None | 0 | 0 / None | None | None / None / None | [{'mode': 'showcase', 'ready': None, 'static': 'true', 'canvas': 0}] | none | 0 |
| 09-low-tier | low | procedural | {'state': 'idle'} | 0 | 157 / 0 | [{'t': 5928, 'k': 'procedural'}] | 30 / 0 / 174 | [{'mode': 'showcase', 'ready': 'true', 'static': None, 'canvas': 1}] | none | 0 |
| 10-context-loss-restore | high | model | {'state': 'ready', 'ms': 28, 'bytes': 45572} | 1 | 166 / 42 | [{'t': 4510, 'k': 'model'}, {'t': 13006, 'k': 'model!unusable'}, {'t': 22746, 'k': 'model'}] | 28 / 0 / 400 | [{'mode': 'showcase', 'ready': 'true', 'static': None, 'canvas': 1}] | ['info: [chai3d] model ready {state: ready, ms: 28, bytes: 45572} {awake: Object, nap: Object, sip', 'warning: WebGL: INVALID_OPERATION: delete: object does not belong to this context', 'warning: WebGL: INVALID_OPERATION: delete: object does not belong to this context', 'warning: WebGL: INVALID_OPERATION: delete: object does not belong to this context'] | 0 |

- **00-baseline-ok**: status timeline [[0, "model", "ready", null]]; failed requests [["three-CuGugm9M.js", "net::ERR_ABORTED"], ["NookScene-BxjwMMOz.js", "net::ERR_ABORTED"]]; glb responses [[200, false]]
- **01-404-fulfil**: status timeline [[0, "procedural", "failed", "Error: HTTP 404"]]; extra {"before": 2, "after": 5, "kind": "procedural", "status": {"state": "failed", "reason": "Error: HTTP 404", "ms": 7}, "hosts": [{"mode": "showcase", "ready": "true", "static": null, "canvas": 1}]}; glb responses [[404, false], [404, false], [404, false], [404, false], [404, false]]
- **02-abort**: status timeline [[0, "procedural", "failed", "TypeError: Failed to fetch"]]; extra {"before": 2, "after": 5, "kind": "procedural", "status": {"state": "failed", "reason": "TypeError: Failed to fetch", "ms": 68}, "hosts": [{"mode": "showcase", "ready": "true", "static": null, "canvas": 1}]}; failed requests [["chai-B-OZIeNI.glb", "net::ERR_FAILED"], ["chai-B-OZIeNI.glb", "net::ERR_FAILED"], ["chai-B-OZIeNI.glb", "net::ERR_FAILED"], ["chai-B-OZIeNI.glb", "net::ERR_FAILED"], ["chai-B-OZIeNI.glb", "net::ERR_FAILED"]]
- **03-slow-12s-then-continue**: status timeline [[0, "procedural", "loading", null], [4025, "procedural", "failed", "timeout (8000 ms)"]]; failed requests [["chai-B-OZIeNI.glb", "net::ERR_ABORTED"]]
- **05-corrupt-junk-200**: status timeline [[0, "procedural", "failed", "SyntaxError: Unexpected token '\u0007', \"\u0007\ufffd\r\ufffd\u0013\ufffd\u0019\ufffd\u001f\ufffd\"... is not valid JSON"]]; glb responses [[200, false], [200, false]]
- **07-html-200-spa-fallback**: status timeline [[0, "procedural", "failed", "SyntaxError: Unexpected token '<', \"<!doctype \"... is not valid JSON"]]; glb responses [[200, false], [200, false]]
- **08-3d-off**: status timeline [[0, null, null, null]]
- **09-low-tier**: status timeline [[0, "procedural", "idle", null]]
- **10-context-loss-restore**: status timeline [[0, "model", "ready", null]]; extra {"steps": [], "before": {"kind": "model", "st": {"state": "ready", "ms": 28, "bytes": 45572}}, "whileLost": {"hosts": [{"mode": "showcase", "ready": "false", "static": null, "canvas": 1}], "kind": "model", "nook": true, "usable": false}, "afterRestore": {"hosts": [{"mode": "showcase", "ready": "true", "static": null, "canvas": 1}], "kind": "model", "st": {"state": "ready", "ms": 28, "bytes": 45572}, "usable": true, "facts": {"kind": "model", "shownParts": ["body", "eyes_open", "yuzu"], "activeMorphs": [], "quality": "high"}}, "lostAt": 12999, "restoredAt": 17008}; glb responses [[200, false]]

### Check 5: offline (service worker ON; `PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS=1` so `setOffline` also applies to the worker). Forced high tier.

- **A-precached-as-shipped**: online: {'k': 'model', 'st': {'state': 'ready', 'ms': 130, 'bytes': 45572}, 'ms': 4}; sw {'scope': 'http://127.0.0.1:5453/', 'active': 'activated', 'controller': True}; precache before: {'workbox-precache-v2-http://127.0.0.1:5453/': {'total': 119, 'chai': ['three-gltf-DPXo6Yfo.js', 'chaiLoad-Cf4zRQAm.js', 'chai-B-OZIeNI.glb']}}; evicted entries: None; offline reload err: None; navigator.onLine False; offline result: kind **model**, status {'state': 'ready', 'ms': 44, 'bytes': 45572}; glb responses while offline [(200, True, 'three-gltf-DPXo6Yfo.js'), (200, True, 'chai-B-OZIeNI.glb')]; SW-side requests [{'url': 'http://127.0.0.1:5453/assets/three-gltf-DPXo6Yfo.js', 't': '10:44:27'}, {'url': 'http://127.0.0.1:5453/assets/chaiLoad-Cf4zRQAm.js', 't': '10:44:29'}, {'url': 'http://127.0.0.1:5453/assets/chai-stretch-C0-cRH4_.webp', 't': '10:44:29'}, {'url': 'http://127.0.0.1:5453/assets/chai-sleep-CGUxQw--.webp', 't': '10:44:29'}, {'url': 'http://127.0.0.1:5453/assets/chai-sipping-DTyMuyps.webp', 't': '10:44:29'}, {'url': 'http://127.0.0.1:5453/assets/chai-reading-BrtgDZfI.webp', 't': '10:44:29'}, {'url': 'http://127.0.0.1:5453/assets/chai-look-DqB_Gsfd.webp', 't': '10:44:29'}, {'url': 'http://127.0.0.1:5453/assets/chai-happy-face-BjtAdoSq.webp', 't': '10:44:29'}, {'url': 'http://127.0.0.1:5453/assets/chai-happy-BAALIhDR.webp', 't': '10:44:29'}, {'url': 'http://127.0.0.1:5453/assets/chai-concerned-owi0mQpG.webp', 't': '10:44:29'}, {'url': 'http://127.0.0.1:5453/assets/chai-cheering-CK8xIJCH.webp', 't': '10:44:29'}, {'url': 'http://127.0.0.1:5453/assets/chai-B-OZIeNI.glb', 't': '10:44:29'}]; failed requests []; hosts [{'mode': 'showcase', 'ready': 'true', 'static': None, 'canvas': 1}]; facts {'kind': 'model', 'shownParts': ['body', 'eyes_open', 'yuzu'], 'quality': 'high', 'activeMorphs': []}; offline samples {'n': 35, 'bad': 0, 'kinds': ['model']}; console(non-SW) ['[chai3d] model ready {state: ready, ms: 130, bytes: 45572} {awake: Object, nap: Object, sip: Object,', '[chai3d] model ready {state: ready, ms: 44, bytes: 45572} {awake: Object, nap: Object, sip: Object, ']; pageerrors []; error None
- **B-glb-evicted-from-cache**: online: {'k': 'model', 'st': {'state': 'ready', 'ms': 22, 'bytes': 45572}, 'ms': 11}; sw {'scope': 'http://127.0.0.1:5453/', 'active': 'activated', 'controller': True}; precache before: {'workbox-precache-v2-http://127.0.0.1:5453/': {'total': 119, 'chai': ['three-gltf-DPXo6Yfo.js', 'chaiLoad-Cf4zRQAm.js', 'chai-B-OZIeNI.glb']}}; evicted entries: 1; offline reload err: None; navigator.onLine False; offline result: kind **model**, status {'state': 'ready', 'ms': 25, 'bytes': 45572}; glb responses while offline [(200, True, 'three-gltf-DPXo6Yfo.js'), (200, True, 'chai-B-OZIeNI.glb')]; SW-side requests [{'url': 'http://127.0.0.1:5453/assets/three-gltf-DPXo6Yfo.js', 't': '10:44:59'}, {'url': 'http://127.0.0.1:5453/assets/chaiLoad-Cf4zRQAm.js', 't': '10:45:00'}, {'url': 'http://127.0.0.1:5453/assets/chai-stretch-C0-cRH4_.webp', 't': '10:45:00'}, {'url': 'http://127.0.0.1:5453/assets/chai-sleep-CGUxQw--.webp', 't': '10:45:00'}, {'url': 'http://127.0.0.1:5453/assets/chai-sipping-DTyMuyps.webp', 't': '10:45:00'}, {'url': 'http://127.0.0.1:5453/assets/chai-reading-BrtgDZfI.webp', 't': '10:45:00'}, {'url': 'http://127.0.0.1:5453/assets/chai-look-DqB_Gsfd.webp', 't': '10:45:00'}, {'url': 'http://127.0.0.1:5453/assets/chai-happy-face-BjtAdoSq.webp', 't': '10:45:00'}, {'url': 'http://127.0.0.1:5453/assets/chai-happy-BAALIhDR.webp', 't': '10:45:00'}, {'url': 'http://127.0.0.1:5453/assets/chai-concerned-owi0mQpG.webp', 't': '10:45:00'}, {'url': 'http://127.0.0.1:5453/assets/chai-cheering-CK8xIJCH.webp', 't': '10:45:00'}, {'url': 'http://127.0.0.1:5453/assets/chai-B-OZIeNI.glb', 't': '10:45:00'}, {'url': 'http://127.0.0.1:5453/assets/chai-B-OZIeNI.glb', 't': '10:45:14'}]; failed requests []; hosts [{'mode': 'showcase', 'ready': 'true', 'static': None, 'canvas': 1}]; facts {'kind': 'model', 'shownParts': ['body', 'eyes_open', 'yuzu'], 'quality': 'high', 'activeMorphs': []}; offline samples {'n': 41, 'bad': 0, 'kinds': ['model']}; console(non-SW) ['[chai3d] model ready {state: ready, ms: 22, bytes: 45572} {awake: Object, nap: Object, sip: Object, ', '[chai3d] model ready {state: ready, ms: 25, bytes: 45572} {awake: Object, nap: Object, sip: Object, ']; pageerrors []; error None

### Check 4 detail: context loss and restore, raw 100 ms sampler timeline (re-run with raw samples saved: `c4/raw-samples-10-context-loss-restore.json`, `c4/fallback-matrix-10-context-loss-restore.json`)

`WEBGL_lose_context.loseContext()` at 18,292 ms (page time), `restoreContext()` 4,045 ms later (22,337 ms). Sampler segments (ms from page start, n samples, state):

| From to (ms) | n | Engine | Chai kind | in scene / shown | `engine.usable` | `data-scene-static` | canvases in the host |
|---|---|---|---|---|---|---|---|
| 167 to 1,100 | 10 | none | n/a | n/a | n/a | absent | 0 |
| 1,200 to 1,300 | 2 | none | n/a | n/a | n/a | **true** (the static nook) | 0 |
| 1,417 to 5,000 | 37 | none | n/a | n/a | n/a | absent | 0 |
| 9,482 to 14,600 | 49 | present | model | true / true | true | absent | 1 |
| **18,296 to 22,751 (the loss)** | **42** | present (same object) | model | true / true | **false** | **absent in all 42** | 1 |
| 22,903 to 23,300 | 5 | none (engine disposed, rebuild) | n/a | n/a | n/a | absent | 0 |
| 25,417 to 35,116 | 94 | present (rebuilt) | model | true / true | true | absent | 1 |

- No sample for 23,300 to 25,417 ms (about 2.1 s, main thread busy with the rebuild/compile). No `.glb` request after the loss: `.glb` requests for the page = 1.
- During the lost window the sampler's `data-scene-static="true"` check (the attribute used for 3D-off) never fired (0 of 42 samples), and the host kept its `<canvas>` with `data-scene-ready="false"`. **A separate DOM probe (`i-ctxshot.mjs`, `c4/ctxloss-dom.json`, screenshots `c4/ctxloss-*.png`) shows what is mounted in the host during the loss:** the host's first child (aria-hidden, contains an `svg`/`img`, i.e. the static nook) is mounted at opacity 1 and the canvas layer is fading: loss + 0.3 s canvas-layer opacity 0.093, loss + 1.5 s and + 3.5 s opacity 0; `engine.usable` false throughout. At restore + 0.5 s: static layer present, no canvas (engine being rebuilt, `__nook` absent). At restore + 2.5 s and + 6 s: canvas layer opacity 1, no static layer, `chaiKind` model, `usable` true. Before the loss: only the canvas layer (opacity 1). So the static drawing is on screen while the context is lost; it is not flagged with `data-scene-static`. Console in that probe: `THREE.WebGLRenderer: Context Lost.` / `Context Restored.` (log), then the `INVALID_OPERATION: delete` warnings; no pageerrors.
- Console during the loss and restore: repeated `WebGL: INVALID_OPERATION: delete: object does not belong to this context` and `deleteVertexArray` warnings (three.js disposing the old engine's objects against the new context); no pageerrors.
- The first run of the matrix (`c4/fallback-matrix.json`, case `10-context-loss-restore`) agrees: `usable` false 9.7 s (13,006 to 22,746 ms), rebuilt engine has `chaiKind` model, `shownParts` body, eyes_open, yuzu.

### Check 5 reading notes

- Both offline variants returned the model from the service worker (`fromServiceWorker: true`, 200). In variant B (the `chai-*.glb` entry deleted from the precache before going offline) the worker made its own network request for the glb at 10:45:14 and it **succeeded**: there is no failed request in the worker log, so `setOffline(true)` (with `PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS=1` as well) did not cut the worker's own fetch here. As in the packet, a real offline cache miss is **not isolated** by this harness; the 404 / abort cases above are the same code path (`fetch` rejects or returns non-ok -> procedural stays).
- The precache install fetched the glb on a visit that never used the model: Check 2 (default path, low tier on this machine) shows `chai-B-OZIeNI.glb` in `workbox-precache-v2` (119 entries) and no page-level glb request.

### Check 4 notes

- **Sampling.** The in-page sampler asks for 100 ms but the main thread is busy with the CPU rasterizer: the largest gap between consecutive samples in the first 3 s after the engine appeared was 174 to 461 ms (column "first 3 s", max gap). In every case the samples that exist show the Chai root in the scene, shown, with visible meshes, and the engine usable (0 bad), except the context-loss window (engine `usable` false, 42 samples). Whole-run gaps up to 6 s (404 / abort cases) are the Home -> Nook re-entry step, where `__nook` does not exist.
- **No swap observed.** On this machine the model (35 ms load) is parsed before the first compile finishes, so with a healthy network the first sampled engine already carries the model (`kindTransitions` has a single `model` entry); a procedural -> model swap on a running engine was therefore not sampled. The failure cases show a single `procedural` entry from the first sample to the end.
- **Slow network (12 s hold, 8 s timeout):** status `loading` then `failed: timeout (8000 ms)`; the held request later completes (`net::ERR_ABORTED` is recorded for it); the Chai stays procedural for the rest of the run (32 s observation); 1 glb request.
- **Re-requests.** After a 404 / abort the page re-requests the file on later mounts: `.glb` request count 2 after the initial load, 5 after one Home -> Nook round trip (404 case: responses 404 x5; abort case: `net::ERR_FAILED` x5). `chaiLoad.ts` documents this ("a network failure or a timeout is not cached, so the next mount tries again"). Corrupt (junk bytes, 200) and HTML-200 bodies: 2 requests in the page's life (initial load and the page reload of the harness), status `failed: SyntaxError ... is not valid JSON`, procedural stays; re-entry after those two was not run. By the code in `chaiLoad.ts`, only a `ChaiModelError` (validation failure) sets `rejected` for the page's life; a parse `SyntaxError` does not.
- **3D off (`08-3d-off`):** the room host has `data-scene-static="true"`, 0 canvases, 0 `.glb` requests, no engine (`__nook` absent), no pageerrors. The harness waited 200 s for `data-scene-ready="true"` (which the static host does not set) before reading it, hence its long wall time.
- **Low tier (`09-low-tier`):** engine `quality` low, `chaiKind` procedural, status `idle` (the load never starts), 0 `.glb` requests.


### Check 6: PRESERVE 8, summary unlock close-up (celebrate seed, "Put the kettle on", `finish()`), control :5430 vs C :5453; DPR 1, light/day, frozen start clock

Frames are page screenshots; "started/done" are ms after `finish()` (a screenshot under this CPU renderer takes seconds, so the frame is taken somewhere between started and done). Engine facts are read at the moment the screenshot starts (`window.__nook` = the last mounted engine).

| Run | Shot (target ms) | started / done ms | route | card hosts (mode, ready, static, canvases) | engine: chaiKind, quality, mode, interactive, highlightItem, camera az/el/zoom, chai NDC (x,y,z) | items |
|---|---|---|---|---|---|---|---|
| control 390x844 default | 500 | 501 / 5618 | #/focus | none in card | procedural(no field), low, window, False, None, 0.56/0.4/1, [-2.062, -1.548, 0.912] | 5 |
| control 390x844 default | 2000 | 5618 / 8850 | #/done | [('showcase', 'false', None, 1)] | procedural(no field), low, showcase, False, recordPlayer, 0.56/0.4/1, [2.312, -0.828, 1.177] | 7 |
| control 390x844 default | 4000 | 8851 / 11243 | #/done | [('showcase', 'true', None, 1)] | procedural(no field), low, showcase, False, recordPlayer, 0.56/0.4/0.125, [-10.257, -2.954, 0.837] | 7 |
| control 390x844 default | 8000 | 11243 / 14585 | #/done | [('showcase', 'true', None, 1)] | procedural(no field), low, showcase, False, recordPlayer, 0.56/0.4/0.125, [-10.257, -2.954, 0.837] | 7 |
| C 390x844 default | 500 | 500 / 2646 | #/focus | none in card | procedural, low, window, False, None, 0.56/0.4/1, [-2.062, -1.548, 0.912] | 5 |
| C 390x844 default | 2000 | 2647 / 5305 | #/done | [('showcase', 'false', None, 0)] | procedural, low, window, False, None, 0.56/0.4/1, [-2.062, -1.548, 0.912] | 6 |
| C 390x844 default | 4000 | 5305 / 6854 | #/done | [('showcase', 'false', None, 1)] | procedural, low, showcase, False, recordPlayer, 0.56/0.4/1, [2.312, -0.828, 1.177] | 7 |
| C 390x844 default | 8000 | 8000 / 11464 | #/done | [('showcase', 'true', None, 1)] | procedural, low, showcase, False, recordPlayer, 0.56/0.4/0.125, [-10.257, -2.954, 0.837] | 7 |
| control 390x844 high | 500 | 500 / 2156 | #/focus | none in card | procedural(no field), high, window, False, None, 0.56/0.4/1, [-2.062, -1.548, 0.912] | 5 |
| control 390x844 high | 2000 | 2156 / 2419 | #/focus | none in card | procedural(no field), high, window, False, None, 0.56/0.4/1, [-2.062, -1.548, 0.912] | 5 |
| control 390x844 high | 4000 | 4000 / 13584 | #/done | [('showcase', 'false', None, 1)] | procedural(no field), high, showcase, False, recordPlayer, 0.56/0.4/1, [2.312, -0.828, 1.177] | 7 |
| control 390x844 high | 8000 | 13584 / 14124 | #/done | [('showcase', 'false', None, 1)] | procedural(no field), high, showcase, False, recordPlayer, 0.56/0.4/1, [2.312, -0.828, 1.177] | 7 |
| C 390x844 high | 500 | 503 / 2488 | #/focus | none in card | model, high, window, False, None, 0.56/0.4/1, [-2.062, -1.548, 0.912] | 5 |
| C 390x844 high | 2000 | 2488 / 4591 | #/done | [('showcase', 'false', None, 0)] | model, high, window, False, None, 0.56/0.4/1, [-2.062, -1.548, 0.912] | 6 |
| C 390x844 high | 4000 | 4591 / 6533 | #/done | [('showcase', 'false', None, 1)] | procedural, high, showcase, False, recordPlayer, 0.56/0.4/1, [2.312, -0.828, 1.177] | 7 |
| C 390x844 high | 8000 | 8000 / 13036 | #/done | [('showcase', 'true', None, 1)] | procedural, high, showcase, False, recordPlayer, 0.56/0.4/0.125, [-10.257, -2.954, 0.837] | 7 |
| control 1440x900 default | 500 | 514 / 7613 | #/focus | none in card | procedural(no field), low, window, False, None, 0.56/0.4/1, [-2.02, -1.548, 0.912] | 5 |
| control 1440x900 default | 2000 | 7613 / 12136 | #/done | [('showcase', 'false', None, 1)] | procedural(no field), low, showcase, False, recordPlayer, 0.56/0.4/1, [1.734, -0.828, 1.177] | 7 |
| control 1440x900 default | 4000 | 12136 / 16677 | #/done | [('showcase', 'false', None, 1)] | procedural(no field), low, showcase, False, recordPlayer, 0.56/0.4/0.125, [-7.693, -2.954, 0.837] | 7 |
| control 1440x900 default | 8000 | 16677 / 30085 | #/done | [('showcase', 'true', None, 1)] | procedural(no field), low, showcase, False, recordPlayer, 0.56/0.4/0.125, [-7.693, -2.954, 0.837] | 7 |
| C 1440x900 default | 500 | 500 / 5113 | #/focus | none in card | procedural, low, window, False, None, 0.56/0.4/1, [-2.02, -1.548, 0.912] | 5 |
| C 1440x900 default | 2000 | 5114 / 10903 | #/done | [('showcase', 'false', None, 1)] | procedural, low, showcase, False, recordPlayer, 0.56/0.4/1, [1.734, -0.828, 1.177] | 7 |
| C 1440x900 default | 4000 | 10904 / 22989 | #/done | [('showcase', 'true', None, 1)] | procedural, low, showcase, False, recordPlayer, 0.56/0.4/0.125, [-7.693, -2.954, 0.837] | 7 |
| C 1440x900 default | 8000 | 22990 / 56930 | #/done | [('showcase', 'true', None, 1)] | procedural, low, showcase, False, recordPlayer, 0.56/0.4/0.125, [-7.693, -2.954, 0.837] | 7 |
| control 1440x900 high | 500 | 509 / 8002 | #/focus | none in card | procedural(no field), high, window, False, None, 0.56/0.4/1, [-2.02, -1.548, 0.912] | 5 |
| control 1440x900 high | 2000 | 8002 / 12499 | #/done | [('showcase', 'false', None, 1)] | procedural(no field), high, showcase, False, recordPlayer, 0.56/0.4/1, [1.734, -0.828, 1.177] | 7 |
| control 1440x900 high | 4000 | 12499 / 16061 | #/done | [('showcase', 'false', None, 1)] | procedural(no field), high, showcase, False, recordPlayer, 0.56/0.4/1, [1.734, -0.828, 1.177] | 7 |
| control 1440x900 high | 8000 | 16061 / 51203 | #/done | [('showcase', 'true', None, 1)] | procedural(no field), high, showcase, False, recordPlayer, 0.56/0.4/0.125, [-7.693, -2.954, 0.837] | 7 |
| C 1440x900 high | 500 | 500 / 8618 | #/focus | none in card | model, high, window, False, None, 0.56/0.4/1, [-2.02, -1.548, 0.912] | 5 |
| C 1440x900 high | 2000 | 8618 / 11930 | #/done | [('showcase', 'false', None, 1)] | procedural, high, showcase, False, recordPlayer, 0.56/0.4/1, [1.734, -0.828, 1.177] | 7 |
| C 1440x900 high | 4000 | 11930 / 15791 | #/done | [('showcase', 'false', None, 1)] | procedural, high, showcase, False, recordPlayer, 0.56/0.4/1, [1.734, -0.828, 1.177] | 7 |
| C 1440x900 high | 8000 | 15791 / 30288 | #/done | [('showcase', 'true', None, 1)] | procedural, high, showcase, False, recordPlayer, 0.56/0.4/0.125, [-7.693, -2.954, 0.837] | 7 |

| Run | card scene ready (ms after finish) | settled frame (3.5 s after ready): chaiKind, quality, highlightItem, fitTarget, fitDist, zoom, chai NDC, chai3d status | card text | errors |
|---|---|---|---|---|---|
| control 390x844 default | 14604 | procedural(no field), low, recordPlayer, [-0.429, 0.868, -0.337], 14.767, 0.125, [-10.257, -2.954, 0.837], None | 'Record player is in your nook\n\n8\n Cozy level 8 · Plays mostly rain sounds. Chai ' | [] |
| C 390x844 default | 11475 | procedural, low, recordPlayer, [-0.429, 0.868, -0.337], 14.767, 0.125, [-10.257, -2.954, 0.837], {'state': 'idle'} | 'Record player is in your nook\n\n8\n Cozy level 8 · Plays mostly rain sounds. Chai ' | [] |
| control 390x844 high | 21267 | procedural(no field), high, recordPlayer, [-0.429, 0.868, -0.337], 14.767, 0.125, [-10.257, -2.954, 0.837], None | 'Record player is in your nook\n\n8\n Cozy level 8 · Plays mostly rain sounds. Chai ' | [] |
| C 390x844 high | 13048 | procedural, high, recordPlayer, [-0.429, 0.868, -0.337], 14.767, 0.125, [-10.257, -2.954, 0.837], {'state': 'ready', 'ms': 26, 'bytes': 45572} | 'Record player is in your nook\n\n8\n Cozy level 8 · Plays mostly rain sounds. Chai ' | [] |
| control 1440x900 default | 30094 | procedural(no field), low, recordPlayer, [-0.429, 0.868, -0.337], 14.767, 0.125, [-7.693, -2.954, 0.837], None | 'Record player is in your nook\n\n8\n Cozy level 8 · Plays mostly rain sounds. Chai ' | [] |
| C 1440x900 default | 56942 | procedural, low, recordPlayer, [-0.429, 0.868, -0.337], 14.767, 0.125, [-7.693, -2.954, 0.837], {'state': 'idle'} | 'Record player is in your nook\n\n8\n Cozy level 8 · Plays mostly rain sounds. Chai ' | [] |
| control 1440x900 high | 51495 | procedural(no field), high, recordPlayer, [-0.429, 0.868, -0.337], 14.767, 0.125, [-7.693, -2.954, 0.837], None | 'Record player is in your nook\n\n8\n Cozy level 8 · Plays mostly rain sounds. Chai ' | [] |
| C 1440x900 high | 30320 | procedural, high, recordPlayer, [-0.429, 0.868, -0.337], 14.767, 0.125, [-7.693, -2.954, 0.837], {'state': 'ready', 'ms': 38, 'bytes': 45572} | 'Record player is in your nook\n\n8\n Cozy level 8 · Plays mostly rain sounds. Chai ' | [] |

Pixel comparison control vs C (same viewport/tier/target; PNG decoder bundled with Playwright; a pixel counts as differing when any RGB channel differs; over16 = a channel differs by more than 16/255):

| Pair | pixels | differing % | differing >16 % | max channel delta | bbox of >16 pixels [x0,y0,x1,y1] |
|---|---|---|---|---|---|
| control-1440x900-default-settled.png vs C-1440x900-default-settled.png | 1296000 | 7.435 | 1.554 | 180  | [942, 145, 1367, 384] |
| control-1440x900-default-t2000.png vs C-1440x900-default-t2000.png | 1296000 | 0.004 | 0 | 3  | None |
| control-1440x900-default-t4000.png vs C-1440x900-default-t4000.png | 1296000 | 7.876 | 6.878 | 211  | [942, 145, 1367, 384] |
| control-1440x900-default-t500.png vs C-1440x900-default-t500.png | 1296000 | 0.68 | 0 | 16  | None |
| control-1440x900-default-t8000.png vs C-1440x900-default-t8000.png | 1296000 | 7.508 | 1.902 | 180  | [942, 145, 1367, 384] |
| control-1440x900-high-settled.png vs C-1440x900-high-settled.png | 1296000 | 2.507 | 0.612 | 176  | [949, 145, 1338, 384] |
| control-1440x900-high-t2000.png vs C-1440x900-high-t2000.png | 1296000 | 0.006 | 0 | 54  | [1355, 682, 1358, 685] |
| control-1440x900-high-t4000.png vs C-1440x900-high-t4000.png | 1296000 | 0 | 0 | 1  | None |
| control-1440x900-high-t500.png vs C-1440x900-high-t500.png | 1296000 | 0.724 | 0 | 25  | [426, 494, 475, 538] |
| control-1440x900-high-t8000.png vs C-1440x900-high-t8000.png | 1296000 | 7.495 | 1.307 | 178  | [944, 145, 1367, 384] |
| control-390x844-default-settled.png vs C-390x844-default-settled.png | 329160 | 4.898 | 0.868 | 151  | [30, 470, 181, 583] |
| control-390x844-default-t2000.png vs C-390x844-default-t2000.png | 329160 | 12.056 | 6.507 | 220  | [0, 460, 389, 821] |
| control-390x844-default-t4000.png vs C-390x844-default-t4000.png | 329160 | 11.144 | 7.097 | 223  | [10, 141, 344, 583] |
| control-390x844-default-t500.png vs C-390x844-default-t500.png | 329160 | 0 | 0 | 0  | None |
| control-390x844-default-t8000.png vs C-390x844-default-t8000.png | 329160 | 3.686 | 0.358 | 165  | [30, 470, 175, 583] |
| control-390x844-high-settled.png vs C-390x844-high-settled.png | 329160 | 4.881 | 0.33 | 167  | [30, 470, 181, 581] |
| control-390x844-high-t2000.png vs C-390x844-high-t2000.png | 329160 | 63.098 | 31.86 | 234  | [0, 10, 389, 821] |
| control-390x844-high-t4000.png vs C-390x844-high-t4000.png | 329160 | 0 | 0 | 0  | None |
| control-390x844-high-t500.png vs C-390x844-high-t500.png | 329160 | 0 | 0 | 0  | None |
| control-390x844-high-t8000.png vs C-390x844-high-t8000.png | 329160 | 5.214 | 5.16 | 223  | [30, 470, 181, 583] |

### Check 7: perf and memory (390x844 @2 mobile-emulated, Nook, veteran, light/day, forced high via `nookq=high`; alternating variants, fresh browser per run; control :5430 vs C :5453 `chai3d=procedural` vs `chai3d=model`)

Live = 10 s of the real loop, page rAF intervals. Sync = engine `frame()` + 1-pixel `readPixels` x40 after 8 warm-up, loop stopped. Heap = CDP `Runtime.getHeapUsage` after two GCs. RSS = sum of the process tree of my own browser (ps), MB.

#### high set

| Run (order) | ready ms | live rAF frames / 10 s | interval mean / p50 / p90 / max ms | render() JS ms mean | sync frame ms median / mean / p90 | draw calls | triangles | geometries | textures | programs | heap MB (after GC) | RSS MB renderer / gpu / total | long tasks (n, max ms) | load avg | chaiKind / quality / canvas |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ctl-high #1 | 9602 | 33 | 330.7 / 416.5 / 633.3 / 1250 | 4.4 | 476.6 / 495.5 / 680.5 | 161 | 128792 | 114 | 10 | 19 | 10.26 | 160.1 / 199.7 / 671.5 | 7, 31579 | 13.68 14.22 13.69 | procedural(no field) / high / [531, 474] |
| C-procedural-high #2 | 10644 | 27 | 389.1 / 283.2 / 933.3 / 1433.3 | 3.19 | 591.5 / 577.9 / 729.2 | 161 | 128792 | 114 | 10 | 19 | 10.38 | 157.1 / 197.7 / 670.4 | 9, 34619 | 14.60 14.46 13.81 | procedural / high / [531, 474] |
| C-model-high #3 | 10910 | 25 | 428.5 / 550 / 733.3 / 1016.7 | 2.46 | 578 / 596 / 757.1 | 155 | 125500 | 111 | 12 | 25 | 10.78 | 161.1 / 205.2 / 682 | 10, 36348 | 15.09 14.63 13.91 | model / high / [531, 474] |
| ctl-high #4 | 9652 | 26 | 398.7 / 466.6 / 799.9 / 1116.6 | 4.02 | 584.2 / 585.2 / 693.8 | 161 | 128792 | 114 | 10 | 19 | 10.25 | 154.4 / 200.6 / 670.4 | 7, 35437 | 15.76 14.92 14.06 | procedural(no field) / high / [531, 474] |
| C-procedural-high #5 | 9129 | 34 | 310.1 / 350 / 599.9 / 1233.3 | 2.73 | 546.1 / 541.4 / 683.1 | 161 | 128792 | 114 | 10 | 19 | 10.39 | 159.9 / 201.9 / 679.7 | 9, 32914 | 15.75 15.00 14.13 | procedural / high / [531, 474] |
| C-model-high #6 | 10768 | 20 | 513.1 / 533.3 / 883.2 / 1166.5 | 2.47 | 545.4 / 550.6 / 681.8 | 155 | 125500 | 111 | 12 | 25 | 10.85 | 164.6 / 205.9 / 688.9 | 8, 32467 | 14.53 14.81 14.12 | model / high / [531, 474] |

Per-variant medians over the runs: 

| Variant | runs | live interval mean ms (median of runs) | live frames | sync frame ms (median of medians) | heap MB | RSS total MB | draw calls | triangles | programs | textures | geometries |
|---|---|---|---|---|---|---|---|---|---|---|---|
| C-model-high | 2 | 470.8 ([428.5, 513.1]) | [25, 20] | 561.7 ([578, 545.4]) | 10.81 ([10.78, 10.85]) | 685.45 ([682, 688.9]) | 155 | 125500 | 25 | 12 | 111 |
| C-procedural-high | 2 | 349.6 ([389.1, 310.1]) | [27, 34] | 568.8 ([591.5, 546.1]) | 10.39 ([10.38, 10.39]) | 675.05 ([670.4, 679.7]) | 161 | 128792 | 19 | 10 | 114 |
| ctl-high | 2 | 364.7 ([330.7, 398.7]) | [33, 26] | 530.4 ([476.6, 584.2]) | 10.25 ([10.26, 10.25]) | 670.95 ([671.5, 670.4]) | 161 | 128792 | 19 | 10 | 114 |

### Check 8: specs on the trial dev server :5443 (`KETTLE_PORT=5443 npx playwright test tests/chai3d.spec.ts tests/w2-room.spec.ts --project=chromium --workers=1 --reporter=list`)

Spec list = 8 tests in `chai3d.spec.ts` + 7 in `w2-room.spec.ts` = 15 total. Raw: `c8/spec-run1.txt`, `c8/spec-run2.txt`, `c8/spec-times.txt`.

| Run | Started / ended (UTC) | Passed / total | Failed | Raw summary line(s) |
|---|---|---|---|---|
| 1 | 11:05:02 / NOT FINISHED at receipt time | 10 / 15 so far | 0 | (no summary line yet) |
| 2 | not run | | | |

Run 1 test lines:
```
✓   1 [chromium] › tests/chai3d.spec.ts:70:3 › 3D Chai: the model replaces the procedural Chai › high tier: loads, validates and swaps in place, awake = eyes_open, on the cushion (32.0s)
✓   2 [chromium] › tests/chai3d.spec.ts:83:3 › 3D Chai: fallbacks keep the procedural Chai › 404: procedural Chai, no error, the room is live (29.2s)
✓   3 [chromium] › tests/chai3d.spec.ts:96:3 › 3D Chai: fallbacks keep the procedural Chai › slow network: the first frame is the procedural Chai; after 8 s the load gives up and it stays (34.2s)
✓   4 [chromium] › tests/chai3d.spec.ts:112:3 › 3D Chai: fallbacks keep the procedural Chai › a file that fails validation (the r0 model: no eyes_sip) keeps the procedural Chai (32.0s)
✓   5 [chromium] › tests/chai3d.spec.ts:125:3 › 3D Chai: fallbacks keep the procedural Chai › the loader chunk itself fails to load: procedural Chai, no error (29.9s)
✓   6 [chromium] › tests/chai3d.spec.ts:138:3 › 3D Chai: fallbacks keep the procedural Chai › 3D off: the static drawing, no engine, no model request (16.4s)
✓   7 [chromium] › tests/chai3d.spec.ts:147:3 › 3D Chai: fallbacks keep the procedural Chai › low tier: the procedural Chai, no model request (26.7s)
✓   8 [chromium] › tests/chai3d.spec.ts:157:3 › 3D Chai: fallbacks keep the procedural Chai › WebGL context lost and restored: the engine is rebuilt with the model from memory, no second request (57.7s)
✓   9 [chromium] › tests/w2-room.spec.ts:87:3 › Focus backdrop: earned items without the live 3D room › 3D off: the window still shows every earned window-visible item (43.3s)
✓  10 [chromium] › tests/w2-room.spec.ts:96:3 › Focus backdrop: earned items without the live 3D room › 3D loading: the still shown before the engine is ready carries the same items (35.9s)
```

## Incomplete, caveats and harness notes

1. **Slot wait.** Queued 09:59; first slot 10:25 (other lanes held all slots). Jobs ran back to back after that. Not run for lack of time: (a) default-path run with a spoofed non-software renderer string (script `a-default.mjs --spoof true`, queued, killed unstarted at the end): the default path was therefore only observed on this SwiftShader machine (tier low, procedural) and was not observed on a "normal GPU" auto tier; (b) perf on the low tier / default tier (control vs C default); the high set only; (c) a `nooktime=dusk` evening variant: in Check 3 the "dark" variant (theme dark, auto time) resolved to engine time `night`, the same as the "night" variant, so light / dark / night were 2 distinct engine times (day, night); (d) the 1440x900 pose runs did not use `NAP_FORWARD`-free comparison; the 1440 pose facts come from the same script as 390.
2. **Check 3 placement numbers.** My first pose runs (`c3/forced-high-390x844.json`, `forced-high-1440x900.json`, fields `placement`) picked the cushion's hit-test proxy (a `RoundedBoxGeometry` with `material.visible = false`, top y 0.31, rim 0.55) instead of the visible puff (top y 0.2765, rim radius 0.587). Those `placement` / `cushion` blocks are **superseded**; the placement table uses the re-run `c3/forced-high-{390x844,1440x900}-placement.json` (light only, awake / nap / sip, no screenshots). All other fields (eyes, shape keys, scale, extents) in the first runs are unaffected.
3. **Breathing phase.** Facts are read with the loop paused after 3.5 s in a pose, so the loaf's breathing scale is at some phase (awake `loaf.scale.y` 1.0177 at the pause, nap 1.0317): the unscaled extents in the first table (awake y 1.0165, nap y 0.633) are the validator's extents times that scale plus the yuzu tilt; node (validator) extents above are the unscaled file values.
4. **Perf.** The first perf attempt (`c7/perf-high-run1-FAKECLOCK-invalid-live.json`) ran under `page.clock.install`, which makes rAF / `performance.now` virtual; its "live" numbers are invalid and it hit a `browser.process()` API error; it was killed and re-run without the fake clock (the table above). Only 2 runs per variant, machine load average 13.7 to 15.8 on 4 cores (other lanes' browsers running), so the ranges overlap; the sync-frame method matches the packet's (`frame()` + 1-pixel `readPixels`).
5. **Fake-clock note for Check 6.** Check 6 used `page.clock.install` + `resume()` as the packet does (frozen start time, then real-time); screenshots are slow on this CPU renderer so frames are taken between the "started" and "done" times shown, not at exactly 0.5 / 2 / 4 / 8 s. The pixel comparison is therefore not frame-synchronised (animation phases differ); the `bbox` column says where the over-16 differences are.
6. **Service worker console noise.** Fallback / forced-high runs blocked the service worker so `page.route` could see the `.glb`; every such page logs `Service Worker registration blocked by Playwright` and `[pwa] service worker registration failed ... 'waiting'`. Not from the Chai code; excluded from the matrix console column.
7. **`__nook` / `__chai3d`** exist only with `?debug`; this review used them for reads. The packet's own spec helpers were not used for the facts in Checks 2 to 7.
8. **Servers.** Never started or stopped. My queued jobs and browsers are gone (checked at the end).


### Capture and evidence list (all under `contracts/W2R2/review/LC/`)

Total 26.9 MB in 119 files.

| File | KB |
|---|---|
| `RECEIPT-LC.md` | 56 |
| `c1-precache-manifest.json` | 1 |
| `c1-validate-glb.json` | 2 |
| `c8-vitest-chaiModel.txt` | 0 |
| `check1-hash-diff.txt` | 3 |
| `c2/C-5453-1440x900.png` | 445 |
| `c2/C-5453-390x844-mobileEmu.png` | 137 |
| `c2/C-5453-390x844.png` | 133 |
| `c2/default-path-C-5453.json` | 16 |
| `c3/1440x900-dark-awake-crop.png` | 43 |
| `c3/1440x900-dark-awake.png` | 620 |
| `c3/1440x900-dark-nap-crop.png` | 48 |
| `c3/1440x900-dark-nap.png` | 631 |
| `c3/1440x900-dark-sip-crop.png` | 48 |
| `c3/1440x900-dark-sip.png` | 629 |
| `c3/1440x900-light-awake-crop.png` | 39 |
| `c3/1440x900-light-awake.png` | 485 |
| `c3/1440x900-light-nap-crop.png` | 41 |
| `c3/1440x900-light-nap.png` | 492 |
| `c3/1440x900-light-sip-crop.png` | 43 |
| `c3/1440x900-light-sip.png` | 494 |
| `c3/1440x900-night-awake-crop.png` | 43 |
| `c3/1440x900-night-awake.png` | 620 |
| `c3/1440x900-night-nap-crop.png` | 48 |
| `c3/1440x900-night-nap.png` | 632 |
| `c3/1440x900-night-sip-crop.png` | 48 |
| `c3/1440x900-night-sip.png` | 629 |
| `c3/390x844-dark-awake-crop.png` | 56 |
| `c3/390x844-dark-awake.png` | 448 |
| `c3/390x844-dark-nap-crop.png` | 59 |
| `c3/390x844-dark-nap.png` | 453 |
| `c3/390x844-dark-sip-crop.png` | 58 |
| `c3/390x844-dark-sip.png` | 453 |
| `c3/390x844-light-awake-crop.png` | 50 |
| `c3/390x844-light-awake.png` | 406 |
| `c3/390x844-light-nap-crop.png` | 52 |
| `c3/390x844-light-nap.png` | 410 |
| `c3/390x844-light-sip-crop.png` | 52 |
| `c3/390x844-light-sip.png` | 411 |
| `c3/390x844-night-awake-crop.png` | 56 |
| `c3/390x844-night-awake.png` | 448 |
| `c3/390x844-night-nap-crop.png` | 59 |
| `c3/390x844-night-nap.png` | 454 |
| `c3/390x844-night-sip-crop.png` | 58 |
| `c3/390x844-night-sip.png` | 453 |
| `c3/forced-high-1440x900-placement.json` | 22 |
| `c3/forced-high-1440x900.json` | 64 |
| `c3/forced-high-390x844-placement.json` | 22 |
| `c3/forced-high-390x844.json` | 64 |
| `c4/00-baseline-ok.png` | 136 |
| `c4/01-404-fulfil.png` | 136 |
| `c4/02-abort.png` | 136 |
| `c4/03-slow-12s-then-continue.png` | 136 |
| `c4/05-corrupt-junk-200.png` | 136 |
| `c4/07-html-200-spa-fallback.png` | 136 |
| `c4/08-3d-off.png` | 108 |
| `c4/09-low-tier.png` | 133 |
| `c4/10-context-loss-restore.png` | 136 |
| `c4/ctxloss-0-before.png` | 136 |
| `c4/ctxloss-1-lost-1500ms.png` | 117 |
| `c4/ctxloss-1-lost-300ms.png` | 116 |
| `c4/ctxloss-1-lost-3500ms.png` | 117 |
| `c4/ctxloss-2-restored-2500ms.png` | 136 |
| `c4/ctxloss-2-restored-500ms.png` | 117 |
| `c4/ctxloss-2-restored-6000ms.png` | 136 |
| `c4/ctxloss-dom.json` | 4 |
| `c4/fallback-matrix-10-context-loss-restore.json` | 40 |
| `c4/fallback-matrix.json` | 62 |
| `c4/raw-samples-10-context-loss-restore.json` | 47 |
| `c5/offline-A-precached-as-shipped.png` | 136 |
| `c5/offline-B-glb-evicted-from-cache.png` | 136 |
| `c5/offline.json` | 7 |
| `c6/C-1440x900-default-settled.png` | 556 |
| `c6/C-1440x900-default-t2000.png` | 542 |
| `c6/C-1440x900-default-t4000.png` | 556 |
| `c6/C-1440x900-default-t500.png` | 449 |
| `c6/C-1440x900-default-t8000.png` | 559 |
| `c6/C-1440x900-high-settled.png` | 563 |
| `c6/C-1440x900-high-t2000.png` | 547 |
| `c6/C-1440x900-high-t4000.png` | 528 |
| `c6/C-1440x900-high-t500.png` | 452 |
| `c6/C-1440x900-high-t8000.png` | 568 |
| `c6/C-390x844-default-settled.png` | 176 |
| `c6/C-390x844-default-t2000.png` | 171 |
| `c6/C-390x844-default-t4000.png` | 171 |
| `c6/C-390x844-default-t500.png` | 139 |
| `c6/C-390x844-default-t8000.png` | 175 |
| `c6/C-390x844-high-settled.png` | 176 |
| `c6/C-390x844-high-t2000.png` | 171 |
| `c6/C-390x844-high-t4000.png` | 171 |
| `c6/C-390x844-high-t500.png` | 140 |
| `c6/C-390x844-high-t8000.png` | 177 |
| `c6/control-1440x900-default-settled.png` | 561 |
| `c6/control-1440x900-default-t2000.png` | 542 |
| `c6/control-1440x900-default-t4000.png` | 560 |
| `c6/control-1440x900-default-t500.png` | 448 |
| `c6/control-1440x900-default-t8000.png` | 563 |
| `c6/control-1440x900-high-settled.png` | 563 |
| `c6/control-1440x900-high-t2000.png` | 547 |
| `c6/control-1440x900-high-t4000.png` | 528 |
| `c6/control-1440x900-high-t500.png` | 451 |
| `c6/control-1440x900-high-t8000.png` | 565 |
| `c6/control-390x844-default-settled.png` | 176 |
| `c6/control-390x844-default-t2000.png` | 171 |
| `c6/control-390x844-default-t4000.png` | 176 |
| `c6/control-390x844-default-t500.png` | 139 |
| `c6/control-390x844-default-t8000.png` | 175 |
| `c6/control-390x844-high-settled.png` | 177 |
| `c6/control-390x844-high-t2000.png` | 140 |
| `c6/control-390x844-high-t4000.png` | 171 |
| `c6/control-390x844-high-t500.png` | 140 |
| `c6/control-390x844-high-t8000.png` | 165 |
| `c6/pixel-diff.json` | 5 |
| `c6/unlock-runs.json` | 53 |
| `c7/perf-high-run1-FAKECLOCK-invalid-live.json` | 1 |
| `c7/perf-high.json` | 9 |
| `c8/spec-run1.txt` | 5 |
| `c8/spec-run2.txt` | 0 |
| `c8/spec-times.txt` | 0 |