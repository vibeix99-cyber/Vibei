# Maker C · Wave 2 round 2 · I06 3D Chai integration · READY FOR REVIEW

> **Status after the resume (09:46 UTC), checklist against the brief:**
> - [x] Hash check
> - [x] Integration: Nook, the pre-warm chain and fresh engines; REPORT pose mapping
> - [x] Validator on the real bounds
> - [x] Placement (nap overhang fixed, numbers below)
> - [x] Fallback matrix (`chai3d.spec` 8/8 plus the offline probe)
> - [x] PRESERVE 8
> - [x] Perf and memory
> - [x] BEFORE/AFTER captures
> - [x] Art-review sheet
> - [x] Suites. Full chromium 99/103: the 4 failures reproduce on control or are load flakes (proof below).
>
> **What ships by default:** the model is wired in and loads on the **high tier only** (`MODEL_ON_LOW = false` in
> `src/scene/chaiHost.ts`). The low tier (every CPU rasterizer, weak phones, save-data), 3D off and no-WebGL keep the
> procedural Chai or the drawing, exactly as before. Any load, timeout or validation failure also keeps the procedural
> Chai.

**Item:** I06, wire the Blender Chai (`art-src/chai/chai.glb`, r1) into the 3D room, with the procedural Chai as the
first frame and the fallback (CHAI-3D-SPEC §6). The merge also needs **Vibei's art sign-off**: see "Art review"
below and `C/art/ART-REVIEW-SHEET.png`.

| | |
|---|---|
| Base | `assets/chai3d-r1@68caa31` = integration `15e8abe` (app `b377c62`, kettle/src `e0aebbf`) + "Add 3D Chai r1 (Blender)" |
| **Code commit** | **`c698d74`** (`c698d740850f8fef163c0cb445b3deebb9a75f9e`) |
| **`git rev-parse c698d74:kettle/src`** | **`42b2c1c2615f4c95013cd6cdf931729543d2dae8`** |
| Packet commit | the branch head: `14e758e` (spec fix) → `563bd28` (evidence) → `d59e015` (the orchestrator's WIP save) → the head commit that records the full-run diagnosis. kettle/src is `42b2c1c` throughout (unchanged since `c698d74`) |
| Branch / worktree | `pe/w2r2-chai3d`, `/home/user/wt/w3c` (not pushed) |
| Trial merge | `git merge-tree --write-tree pe/w2r2-chai3d claude/wizardly-galileo-uy89d9` (integration at `a9171ee`, kettle/src still `e0aebbf`): **clean**, exit 0, tree `a63b9d47` (at `c698d74`; re-run at the evidence commit `563bd28`: clean, exit 0, tree `9575db92`) |

## Hash check
`sha256sum kettle/art-src/chai/chai.glb` = `b401bc6c0fa9dd7a2abe27c135821634e7d1a4d9f9ba5263f50a436ceb463d7e` ✔ (matches;
checked before any use). The runtime copy `kettle/src/scene/engine/models/chai.glb` has the same hash; the unit test
`chaiModel.test.ts` asserts both. No file in `art-src/chai/` and nothing under `src/art/` was changed.

## Changed files (`git diff --stat 68caa31 c698d74 -- kettle`, plus the spec fix in the packet commit)
| File | What |
|---|---|
| `src/scene/engine/chaiModel.ts` (new) | `validateChai` (the load validator) and `buildModelChai`, a model-backed `Chai` with REPORT.md's pose mapping, the night self-fill and `NAP_FORWARD` |
| `src/scene/engine/chaiLoad.ts` (new) | fetch + 8 s timeout + meshopt `GLTFLoader` parse + validate; one template per page; lazy chunk |
| `src/scene/engine/models/chai.glb` (new) | runtime copy, byte-identical to `art-src/chai/chai.glb` |
| `src/scene/engine/Engine.ts` | `chaiKind`, `useChaiModel` (in-place swap), `upgradeChai` (sliced compile of the new subtree only); `warm()` takes an optional subtree |
| `src/scene/engine/kit.ts` | `own(material, unique)`: adopt a loaded material (disposed with the kit; unique = kept out of the low-tier swap) |
| `src/scene/engine/chai.ts` | header comment only (now the first frame and fallback) |
| `src/scene/chaiHost.ts` (new) | policy: who asks for the model, `MODEL_ON_LOW`, the lazy import |
| `src/scene/warm.ts`, `src/scene/index.tsx` | Home pre-warm starts the load early and builds the warm engine with the model when it is parsed |
| `src/scene/NookScene.tsx` | starts the load at mount; fresh engine includes a parsed model in its first compile; later swap after the first frame; never in a summary unlock close-up; `__chai3d` debug status |
| `src/scene/resolve.ts` | `?debug&chai3d=model|procedural` override (measurement / captures) |
| `vite.config.ts` | `glb` in the precache glob; `GLTFLoader` + meshopt decoder in their own `three-gltf` chunk |
| `src/scene/engine/chaiModel.test.ts` (new) | vitest: hashes, validator (accepts the file, rejects the old box, missing node/key/offset, floating origin), pose mapping, no scale fallback, `NAP_FORWARD`, low-tier materials, size in the room |
| `tests/chai3d.spec.ts` (new) | chromium: the fallback matrix (below) |

No file outside `src/scene/**`, `vite.config.ts` and my tests changed: nothing in `src/ui/**`, `src/screens/**`
(home, focus, done, nook) or `src/pwa/**`. No HANDOFF needed.

## Design notes
Full notes: `C/design-notes.md`. The decisions in short:
- **Runtime copy: an imported asset URL** (`src/scene/engine/models/chai.glb?url`), not `public/`: Vite fingerprints
  it (`assets/chai-B-OZIeNI.glb`), so a new model is a new URL. No HTTP, CDN or service-worker cache can serve a
  stale Chai, and it can be cached as immutable. A `public/chai.glb` keeps one URL across versions. `art-src` stays
  the source; the hash test catches drift.
- **The procedural Chai is always built first** (the engine constructor is unchanged). The model replaces it in place
  through the same `Chai` interface. The swap keeps position, turn, base height, pose, tap proxy, steam and zZ, and
  frees the procedural geometry.
- **When it joins.** The room never waits for the network. The model is in the first frame when it is already parsed:
  - Home's pre-warm starts the load before the page settles;
  - a fresh engine includes a model that is already in memory in its first sliced compile.
  Otherwise the procedural Chai is the first frame, and the model swaps in after loading. The swap compiles only the
  new subtree, a few programs per task, and holds the last frame meanwhile.
- **Summary unlock close-up (PRESERVE 8):** never adds the model itself. There is no extra compile before or during the
  drawing → close-up hand-off. It shows the model only if the engine it adopts already carries it.
- **Never in the `window` view** (Focus backdrop, Chai out of frame). An adopted warm engine may carry the model
  there unseen.
- **Materials:** cloned per engine. The fur keeps the night self-fill (vertex colour × 0.16, one shader line) and stays
  PBR on the low tier like the procedural fur. Gloss, mug and yuzu are as exported. No lighting changes.
- **Never the nap scale fallback:** nap is the shape key plus `eyes_sleep` plus `nap_offset`. Breathing is ±3.5 % from
  the floor. The unit test checks a full breath never reaches (1.1, 0.84, 1.06).

## Load validator (`validateChai`)
- **Targets:** the model's real extents, ±10 %: awake **0.59 × 0.99 × 0.57**, nap **0.68 × 0.61 × 1.03**. The extents
  are measured from the vertices, with the nap key applied and the yuzu moved by `nap_offset`.
- **Other checks:**
  - the lowest point is within 1 cm of y = 0, awake and in nap;
  - the contract nodes exist;
  - every `body` primitive has the `nap` key;
  - `nap_offset` is numeric;
  - ≤ 5,000 triangles and ≤ 6 draw calls per pose, ≤ 8,000 triangles in the file.
- **Measured on the file:**

| | Size | Min y | Triangles | Draw calls |
|---|---|---|---|---|
| awake | 0.585 × 0.993 × 0.567 | 0 | 4,342 | 4 |
| nap | 0.682 × 0.612 × 1.032 | 0 | 4,250 | 4 |
| sip | | | 4,780 | 6 |
| file | | | 5,372 | |

- The spec's old box (0.8 × 1.04 × 0.74) is rejected, as REPORT.md predicted (unit test).

## Placement (probe `C/probes/placement.probe.test.ts`, raw `C/placement.json`)
The probe uses the engine's own cushion builder and the room transform: cushion spot, y 0.255, turn 0.62, scale
1.12. From every underside vertex of Chai (local y < 0.08), it casts a ray straight down onto the visible cushion
mesh. The gap is the vertex y minus the cushion surface; a negative gap means pressed into the cushion. An underside
vertex with no cushion below it overhangs. Units are scene units (about 0.5 m).

| Chai | gap min | gap 5th pct | gap median | underside verts beyond the rim (max beyond) |
|---|---|---|---|---|
| procedural awake (today) | −0.019 | −0.015 | +0.043 | 0 |
| procedural nap (today) | −0.020 | −0.017 | +0.050 | 0 |
| **model awake** | −0.037 | **−0.015** | +0.014 | **0** |
| **model sip** | −0.037 | −0.015 | +0.014 | 0 |
| model nap at the pivot (no adjustment) | −0.029 | −0.021 | +0.016 | **6 of 481 (0.046)** |
| **model nap as shipped (`NAP_FORWARD` 0.031)** | −0.035 | **−0.021** | +0.019 | **0** |

- **Awake and sip:** resting contact is the same as the procedural Chai's (5th percentile −0.015 for both): no float,
  no sink beyond a soft-cushion press, no overhang. **Root scale (1.12) and placement are unchanged.**
- **Nap overhung.** The lying loaf is 1.03 long (1.16 in the room) against the cushion's 0.57 rim radius, and centred
  0.052 behind the feet pivot. So its rump went past the rim by up to 0.046.
- **The fix:** nap only, the model moves 0.031 toward its face (0.035 in the room). The root and the tap proxy do not
  move. The probe's sweep picked this value: 0 underside vertices beyond the rim, same contact (5th percentile
  −0.021). A scale of 1.0 would also fit, but it would make Chai change size between poses.
- No screen shows nap today (focus mode is not mounted); this is for when one does.

## Fallback matrix
| Case | Behaviour | Evidence | Result |
|---|---|---|---|
| Model loads (high tier) | validated, swapped in place; awake = `eyes_open`, nap key 0, on the cushion (baseY 0.255, ×1.12), proxy moved, one request | `chai3d.spec` "high tier…" | **pass** |
| Load failure (404) | procedural stays, status `failed: Error: HTTP 404`, no page error | `chai3d.spec` "404…" | **pass** |
| Timeout (slow network, response held 15 s) | first frame procedural while `loading`; after 8 s `timeout (8000 ms)`, procedural stays | `chai3d.spec` "slow network…" | **pass** |
| Invalid file (r0 model, no `eyes_sip`) | `invalid: missing node "eyes_sip"`, procedural stays | `chai3d.spec` | **pass** |
| Loader chunk unavailable | procedural stays, no request for the model, no error | `chai3d.spec` | **pass** |
| Offline, precached (as shipped) | the offline Nook shows the model; the `.glb` response is served by the service worker (`fromServiceWorker: true`, 200), status ready in 12 ms | `C/probes/offline.mjs`, `C/offline/offline.json`, `offline-nook-precached.png` | **pass** |
| Offline, not cached | **could not be isolated in this harness**: with the precache entry deleted (and, in a third variant, the HTTP cache cleared and disabled), the model still loaded through the service worker, because Chromium's offline emulation does not cut the worker's own network fetches here. A real offline miss is a failed fetch: the same code path as the 404 and timeout cases above (procedural stays) | same probe, variants `glb-evicted-from-cache`, `glb-evicted-no-http-cache` | not isolated; path covered by the 404 and timeout tests |
| 3D off | static drawing, no canvas, no model request | `chai3d.spec` | **pass** |
| Low tier | procedural Chai, no model request | `chai3d.spec` | **pass** |
| WebGL context lost → restored | static drawing while lost; the rebuilt engine has the model from the module cache (no second request), awake parts | `chai3d.spec` | **pass** |
| Adaptive step-down after load | the model stays, non-fur materials become Lambert, fur stays PBR | unit test "keeps the night self-fill… survives the low tier" | pass |
| Reduced motion | `update(7.35, 0)` as before: the art renders use exactly this frame | `C/art/*` | as rendered |

**Offline decision: precache the `.glb`. Evidence:**
- **Size:** +45.6 KB (31.8 KB gzipped) on a 2.98 MB precache. The whole change adds 155.6 KB (2,975,711 → 3,131,268
  bytes; 116 → 119 entries): the `.glb`, the `three-gltf` loader chunk (70.3 KB, which is precached anyway as a
  `.js`), and +29.8 KB in the `three` chunk (the core classes `GLTFLoader` imports; the chunk cannot be split further).
- **Update flow:** the file name is content-hashed, so a new model is a new precache entry. `cleanupOutdatedCaches`
  drops the old one when the new worker activates, and nothing can serve a stale model. The `pwa` project (install →
  precache → offline → update prompt) passes with the glob: **3/3**.
- **Offline Nook:** without the precache, an installed user offline would get a failed fetch and the procedural Chai, a
  different character from the one they saw online, unless the browser's HTTP cache happened to keep the file (that
  is not guaranteed). With the precache, the probe shows the offline Nook getting the model from the service worker,
  so they see the same Chai online and offline.

## PRESERVE 8: the unlock close-up
- **Code path:** `NookScene` never adds the model when not interactive and an item is highlighted. So the close-up
  engine is built, compiled and framed exactly as before. In the captures the unlock card gets a fresh engine (the
  Focus engine is still mounted then), and `__nook.chaiKind` there is `procedural`.
- **Captures** (record player, Chai out of frame): BEFORE and AFTER close-ups match in framing at every size and theme
  (`C/captures/SHEET-07-unlock.png`, `SHEET-07-unlock-early.png`).
- **Hand-off timing**, Done → unlock `data-scene-ready`, 390×844 (raw in each `meta.json`):

| Theme | BEFORE (ms) | AFTER (ms) |
|---|---|---|
| light | 11,968 | 4,208 |
| dark | 9,280 | 4,255 |
| night (`nooktime=night` re-shoot) | 5,515 | 4,096 |
| 1440×900 night (the one 1440 run where the selector matched) | 17,376 | 23,263 |

  These numbers are noise on a CPU rasterizer at load average ~14: the direction flips between runs (AFTER is faster
  in 3 of 4 rows, slower at 1440 night). The close-up engine runs the same code path in both builds (no model added,
  `chaiKind` procedural). My timing selector missed in the other 1440 runs; their close-ups were captured anyway.

## Perf and memory (`C/probes/perf.mjs`, raw `C/perf/perf-390x844.json`, summary `C/perf/perf-390x844-summary.md`)
- **Setup:** same machine, one browser, one session. Alternating runs ×3: control `:5430` procedural, then my
  preview procedural (`chai3d=procedural`), then my preview with the model. Nook, 390×844@3 (canvas 442×395 on low,
  531×474 on high), veteran profile.
- **Frame time:** `engine.frame()` plus a 1-pixel `readPixels`, which forces the CPU rasterizer to finish the frame.
  60 frames after 10 warm-up frames, loop stopped.
- **Memory:** JS heap after two GCs (CDP `Runtime.getHeapUsage`), and `renderer.info`.

| Variant | frame ms (median of per-run medians; runs) | p90 | draw calls | triangles | geometries | textures | programs | JS heap MB | longest task ms |
|---|---|---|---|---|---|---|---|---|---|
| control, low | 246 (246, 257, 232) | 317 | 111 | 76,752 | 114 | 8 | 19 | 10.66 | 794 |
| procedural, low | 240 (251, 240, 221) | 334 | 111 | 76,752 | 114 | 8 | 19 | 10.75 | 709 |
| **model, low** (forced) | **233** (250, 233, 212) | 340 | **108** | **74,910** | **111** | 10 | 23 | 11.21 | 799 |
| control, high | 486 (481, 486, 548) | 636 | 161 | 129,040 | 114 | 10 | 19 | 10.94 | 963 |
| procedural, high | 501 (487, 582, 501) | 628 | 161 | 129,040 | 114 | 10 | 19 | 11.03 | 756 |
| **model, high** | **521** (485, 530, 521) | 684 | **155** | **125,748** | **111** | 12 | 25 | 11.61 | 660 |

- **Frame time:** within run-to-run noise on both tiers. The per-run ranges overlap fully: low 212–250 vs 221–251,
  high 485–530 vs 487–582. The machine's load average was 12–14 on 4 cores throughout.
- **Draw calls and triangles:** −3 draw calls and −1.8k triangles on low; −6 draw calls and −3.3k triangles on high
  (shadow pass included).
- **Memory:**
  - geometries −3;
  - textures +2: the two `body` primitives' morph-target data textures (WebGL2 stores shape keys as textures);
  - programs +4 on low, +6 on high: self-fill fur, the morph-target variants, and their shadow depth programs;
  - JS heap +0.46 MB on low, +0.58 MB on high (the template, the clones and the loader code).
- **Load:**
  - fetch + parse + validate: 17–26 ms (`__chai3d.status().ms`), about 45 ms in the captures;
  - with the model the room was not later to be ready (median ready 5,223 vs 6,323 ms on low);
  - long tasks were no worse.
- **Low tier decision:** kept **procedural** (`MODEL_ON_LOW = false`), as §6.2 recommends "unless measurement on a real
  low-end phone shows the model costs no more frame time". I have no phone here. The numbers above are from
  SwiftShader, the slowest renderer there is, and show no cost. Enabling the model on the low tier is that one
  constant. **This is the lead's call:** iOS and 4-core phones resolve to `low`, so many people would keep the old
  Chai.
- The perf build differs from `c698d74` only in `NAP_FORWARD` (nap only; the Nook measures awake) and a comment.

## Suites
| Suite | Result | Log |
|---|---|---|
| `npx tsc --noEmit` | exit 0 | — |
| `npx vitest run` | **285/285** (29 files; +10 in `chaiModel.test.ts`) | — |
| chromium `tests/chai3d.spec.ts` | **8/8** (after the spec fix, `14e758e`) | `C/runs/chromium-chai3d.txt` |
| chromium `tests/w2-room.spec.ts` | **7/7** | `C/runs/chromium-chai3d-w2room.txt` |
| chromium full, `--workers=2` | **99/103** (19.5 min, 2 workers, machine load 12–15). The 4 failures either reproduce on control or are load flakes that hit control equally (below). | `C/runs/chromium-full-workers2.txt` |
| timer-harness | **14/14** | `C/runs/timer-harness.txt` |
| timer-app | **12/14**, 2 skipped by design (`timer.spec.ts:295` "infra is exercised in the harness; screens bind their own keys", `:439` "render counter lives in the harness") | `C/runs/timer-app.txt` |
| pwa | **3/3** (its own production build of this tree, so the `glb` glob included: installable, precache + offline brew, update prompt) | `C/runs/pwa.txt` |

**The 4 full-run failures, checked against control `b377c62` (dev `:5410`) on the same machine:**
| Test | Branch | Control | Verdict |
|---|---|---|---|
| `break-reach.spec.ts` "200 % text, 375×667 light: Break's over…" | fails (wheel: "Put the kettle on" not wholly in view) | **fails the same way** (`C/runs/rerun4-5410.txt`) | pre-existing, not mine (Maker T / P area) |
| `break-reach.spec.ts` "200 % text, 390×844 dark: Break's over…" | fails | **fails the same way** | pre-existing, not mine |
| `statusbar.spec.ts` "rapid live resizes at large text… (dark)" (visualViewport.scale 1.04) | **passes** on rerun (`rerun4-5423.txt`) | passes | load flake |
| `w2-room.spec.ts` "3D failure (WebGL context lost)…" (`page.screenshot` 60 s timeout, "waiting for fonts to load") | 1/3 | **1/3** | load flake in the test; not mine |

How the last one was settled:
- It failed on the branch 3/3 sequentially at load ~14 (`w2room-contextloss-x3-5423.txt`). Control passed its single
  sequential rerun.
- So I ran **both builds at the same time**, 3 repeats each, to give them identical CPU contention
  (`C/probes/ctxloss-parallel.sh`, `C/runs/ctxloss-parallel-{5423,5410}.txt`, load 8 → 15). Branch: 1 pass, 2 fail.
  Control: 1 pass, 2 fail. Same error each time.
- Sequentially at lower load both pass: `ctxloss-r2-5423.txt` and `ctxloss-r2-5410.txt`, plus `ctxloss-r1-5410.txt`.
  `ctxloss-r1-5423.txt` was killed during the cold dev-server start, before any test ran.
- It passed 7/7 in the targeted w2-room run on this branch (`chromium-chai3d-w2room.txt`).
- Nothing of mine runs on that path:
  - the `auto` tier resolves to `low` on SwiftShader, so no model is wanted (`chai3d.spec` "low tier" asserts no
    request);
  - the Focus view is `window` mode, which never asks for the model;
  - after the context loss, the only new effect returns early (`chaiOn` false).

First `chai3d.spec` run (`C/runs/chromium-chai3d-w2room.txt`): 3 of 7 passed. All four failures were in the spec,
not the app:
- In dev, Vite serves `chai.glb?url` as the JS module that exports the URL. It has the same pathname as the data
  request.
- So the request counter saw 2, and the 404 and invalid-file routes also blocked the loader module. The app correctly
  stayed procedural, but its status read `idle`.
- The spec now matches only the data request (no query string). It also gained the "loader chunk unavailable" case.

## BEFORE / AFTER captures (`C/captures/`, probe `C/probes/capture.mjs`)
- **Setup:** BEFORE `b377c62` on `:5430`, AFTER on my preview `:5433` (built from `c698d74`). Same session,
  alternating per config. Frozen clock, fresh context per group. High tier on both (`nookq=high`): the low tier is
  unchanged by design, and the tests prove it.
- **Configs:** 390×844@3 and 1440×900@2; light, dark, and night.
  - The seeds pin the time of day (`progress/seed.ts` `pinTimeOfDay`), so the 21:40 clock alone gave a daytime room.
  - The night set was re-shot with the scene's own `nooktime=night` override on both servers. The first night shots
    are overwritten.
- **States:** `10-nook-3d` (Nook), `11-nook-chai-close` (the same camera direction moved in on Chai, debug camera),
  `07-unlock-early` (~0.9 s after Done), `07-unlock` (the close-up).
- **Contact sheets:** `C/captures/SHEET-10-nook-3d.png`, `SHEET-07-unlock.png`, `SHEET-07-unlock-early.png`.

## Art review for Vibei (`C/art/ART-REVIEW-SHEET.png`, renders `C/art/*.png`, probe `C/probes/art.mjs`)
- **Per pose:** the approved sheet cell, REPORT.md's `front_*` render, then the model in the real room in day, dark
  (evening) and night, then today's procedural Chai in the same frame.
- **Render setup:** the shipped engine on the high tier, Chai on the cushion. The room's camera direction is moved in
  on Chai. The frame is the fixed reduced-motion one (t = 7.35 s).
- **The sheet also includes:** REPORT.md's three-quarter, Nook and dusk renders, and the AFTER Nook captures at the
  size people see.
- **What I see, for Vibei to judge:**
  - **awake:** reads as the sheet's happy Chai: face plate, wide nose, small wide-set eyes, brow strokes, blush, dark
    paws and feet, yuzu with leaf.
  - **nap:** one continuous lying loaf with ∪ eyes, the yuzu on the crown, on the cushion.
  - **sip:** ∪ eyes, paws round the persimmon mug, steam from the rim.
  - **At night** the nose and eyes stay separate from the fur.
  - **One thing to judge:** under the room's warm lamp and stove light the fur reads darker and warmer than the flat
    sheet, in evening and night more than by day. The procedural Chai does the same in those frames. Lighting was not
    changed (not authorised).

## Open points for the lead
1. **Low tier:** `MODEL_ON_LOW` (see Perf).
2. **Summary close-up:** keeps the procedural Chai unless the engine it adopts already carries the model. If Vibei wants
   the new Chai in a cushion-unlock close-up, the close-up would have to accept one extra sliced compile before its
   first frame.
3. The five-viewer "same character" check (§7.4) and a real-phone frame time are not things I can run here.

Servers and browsers: my dev `:5423` (restarted after the container restart, for the reruns) and preview `:5433` are stopped; no browser of mine is running. The shared control (`:5410`/`:5430`) was only read.

READY FOR REVIEW
