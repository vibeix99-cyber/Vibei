# CHECKER W2 · Maker N (Room and Nook: I09 + I06 prep) — round 1, after its one fix round

**Verdict: APPROVE** `pe/w2-room@92241c2` (code `c381ccb`, kettle/src `4b49254fa25be7f9e2e4f788b9ad93181d2c8ff6`).
The one blocker of round 1 (N-F1, earned items floating on the bare sky at brew start, ruled BLOCKING by Vibei) is fixed and
verified control-first under load; no new defect. Sections 2, 3.1–3.2, 3.4–3.6, 4 and 6 are LEAD-1's work on `fc9f6d8`, which the fix leaves
untouched (the fix changes `scene/Fallback.tsx` and adds one test, nothing else); LEAD-2 finished §3.3, §5, §7, §8 and the header.

| | |
|---|---|
| Lead checkers | LEAD-1 (diff review, CHAI-3D-SPEC, visual gate on `fc9f6d8`; stopped by a usage limit) and LEAD-2 (fix round, residuals, verdict); Opus 5.5 (`claude-opus-5-5`); neither implemented any of this work |
| Revision under verdict | `pe/w2-room@92241c2` = fix code `c381ccb` + fix packet/evidence (docs only) on top of `fc9f6d8` |
| `kettle/src` | `4b49254fa25be7f9e2e4f788b9ad93181d2c8ff6` (`git rev-parse` of `c381ccb:kettle/src`, `92241c2:kettle/src` and trial `55eb968:kettle/src`: equal, LEAD-2) |
| Trial merge (fix) | `55eb968` = integration + `92241c2`; dev :5346, preview :5356 (worktree `/home/user/wt/w2t-n2`). `git diff 2acc218 55eb968 -- kettle/src kettle/tests` = `scene/Fallback.tsx` (+22/−2) and `tests/w2-room.spec.ts` (+33) only (Lane N; consistent with `git diff fc9f6d8 c381ccb`, read by LEAD-2) |
| Round-1 revision (control for the fix) | `pe/w2-room@fc9f6d8` (code `5d7bb23`, src `81cd36e`), trial `2acc218`, dev :5340, preview :5350 |
| Base / control | `90a11e5` (src `42e106d`), dev :5310, preview :5330 |
| Packets | `/home/user/wt/w2n/kettle/review/product-excellence/contracts/W2/N-READY-FOR-REVIEW.md` (round 1), `…/W2/N-FIX-READY-FOR-REVIEW.md` (fix); evidence `…/W2/N/`, `…/W2/N/fix/` |
| Lane | Lane N (Sonnet 5.5): `contracts/W2/review/LN/RECEIPT.md` + `LN/runs/` (round 1) and `LN/FIX-RECHECK.md` + `LN/fix/` (fix, control-first) |
| Notes | `contracts/W2/review/LEAD/N-interim.md` (LEAD-1). LEAD-1's probes `/home/user/wt/w2t-n/kettle/.tmp/LEAD/{n-cap,n-float,n-float2}.mjs` were written but left no output; nothing below relies on them |

## 1. What I verified myself, and what I took from others

**LEAD-1:** the diff review (§2); the bundle and precache effect on the served trial build (§2); the CHAI-3D-SPEC against
`chai.ts`, `kit.ts`, `Engine.ts`, `layout.ts`, `resolve.ts` and three `0.186.1` (§6); the engine's paused-render paths for
the 375×667 question (§5); the visual gate at full size (§4). **LEAD-2:** the fix diff `fc9f6d8..c381ccb` (§3.3), the Lane N re-check and its frames
(§3.3), Lane R's combined N+S standard captures for the N-owned pairs (§3.7).
**From Lane N, traced to its raw frames/rows:** the 12-configuration control-vs-trial backdrop table (0 → 5 layers,
±2 px position), the loading timeline, the 375×667 control samples, the night/low-tier difference. **From the maker:**
the render-level match (`layers/match.json`), suites (tsc, vitest 267/267, chromium, timer/pwa), the control run of
`w2-room.spec` (5 fail / 1 pass on `90a11e5`; 6/6 on `fc9f6d8`; 7/7 on `c381ccb` with the new test, also 7/7 by Lane N on :5346), the 375×667 reproduction attempts (67 samples).

## 2. Diff review (`90a11e5..5d7bb23`)

| File | Owner | Finding |
|---|---|---|
| `scene/Fallback.tsx` | N | `WindowStill` keeps the base `<img>` unchanged and adds one absolutely positioned `<svg viewBox=1250×1000 xMidYMid slice>` with one `<image>` per earned layer, in unlock order; `NookStatic` window mode now passes `items`. Reaches every still path: 3D off/no WebGL (`scene/index.tsx`), loading (Suspense fallback) and engine-not-ready / context lost (`NookScene.tsx:196`) |
| `scene/stills/items.json`, `stills/items/*.webp` (40) | N | Manifest + layers rendered from the existing 3D items through the base stills' own harness; no painted/new artwork. No pre-rendered item images existed at `90a11e5` (only the 12 `window-*.webp`), so "existing pre-rendered item images" can only mean renders of the existing items — accepted |
| `scene/index.tsx` | N | `useStaticNook()` = tier off or no WebGL |
| `screens/nook/NookScreen.tsx`, `.module.css` | N | Static hint "A drawing of your room" + nook icon, own seen-key; 3D hint unchanged; `.hint[data-static]` wraps inside the stage. Dismissal unchanged (pointerdown on the stage); hint keeps `pointer-events: none` |
| `scripts/stills/render-item-layers.mjs` (new), `scripts/stills/window.html` | N | Script only; harness defaults unchanged (`items` empty, loop on unless `run=0`) |
| `tests/w2-room.spec.ts` (new) | N | 6 tests; 5 fail on `90a11e5` for the stated reasons, 1 passes (3D-on guard) |

No engine, material, lighting, Stage, FocusScreen, Summary, Home, toast or art change; the 12 base stills are byte-identical.
The unlock card (PRESERVE 8) passes its own `still` (`Summary.tsx:320–331`, showcase mode) and never reaches `WindowStill`.

**Bundle (measured on the served builds):** the four `shelf-*.webp` layers (< 4 KB) are inlined by Vite as `data:` URIs in
`assets/scene-*.js`: that chunk grows 8,786 → 33,087 B (gzip 3,779 → 17,286 B; a lazy route chunk, not modulepreloaded).
The precache gains 36 files. The packet's "only items.json and the URL map are bundled" is therefore slightly inaccurate;
within budget, but it is also why the shelf paints first in §3.3.

## 3. Acceptance (brief)

### 3.1 3D off: the Focus backdrop shows the user's actual earned items — MET
Control reproduces the gap at 12/12 configurations (0 layers); trial 5 layers (pothos, books, fairy lights, shelf, record
player — the veteran's window-visible items; tea set excluded by design) at 12/12 (Lane N table; maker 16/16). Position
against the live 3D view of the same run within ±2 px per item (Lane N), render-level mean |Δ| 4.5–5.7/255 across all 12
lighting states (maker). Seen by me at full size: §4.

### 3.2 Loading: the still carries the same items — MET
Trial: 5 layers from the first DOM poll (0.25–0.45 s after the tap) until the still unmounts, 4/4 configurations (Lane N);
held-chunk and context-lost cases covered by `w2-room.spec` (5 fail on control). CLS unchanged (0 / 0; 844×390's
pre-existing 0.064 on both).

### 3.3 Loading-order artifact (new, found by Lane N; reproduced by me)
**Round 1 (`fc9f6d8`):** BLOCKS (Vibei's ruling): the feature's own output, the earned items, stood on the bare sky
gradient for 0.4–2.5 s at brew start. Cause: the base still is a hashed `<img decoding="async">`; the four shelf layers are
inlined `data:` URIs (N-F7) and the others are small, so the layers painted first.

**Fix (`c381ccb`, read by LEAD-2):** `WindowStill` keeps the base `<img>` in a ref; an effect keyed on `src` calls
`img.decode()` and sets `roomReady = src` on success; the layer `<svg>` renders only while `roomReady === src`. Rejection is
swallowed (`() => {}`); an `alive` flag drops a late resolve after unmount or a `src` change. Consequences, each checked:
- **A still that never decodes** (404, corrupt, offline without precache): no items ever, i.e. the plain static fallback
  (the base `90a11e5` look). Acceptable as ruled.
- **Time / weather switch** (`src` changes): `roomReady !== src` at once, so the old time's items never sit on the new
  room; items return when the new still has decoded. While the new file loads, the `<img>` keeps its current image (HTML
  current/pending request), so the frames are "room without items" then "room with items", never items on the sky.
- **3D-on path:** untouched. `WindowStill` exists only in the still paths (3D off, no WebGL, Suspense/loading, context
  lost); the engine, the hand-over and the unlock close-up (own `still`) do not use it. Lane N: settled unlock summary
  fix vs control mean abs 0.0; spec "3D on unchanged" passes.
- **Host swap static → loading-live host** mounts a second `WindowStill`, which waits for its own `decode()` of the
  already-loaded file: see N-F10 (the 5 → 0 → 5 over 74 ms Lane N saw once).
- **New test** (`w2-room.spec.ts`, "items never stand on the bare sky"): holds back only the base still request
  (layer files and `?url` modules pass), counts every animation frame for 1.5 s (expects 0 frames with a layer), then
  releases and expects all layers. Fails on `fc9f6d8`'s `Fallback.tsx` (2 frames, maker log), passes on the fix.

**Verification (raw rows and frames):**
- Lane N re-check, control first (`LN/FIX-RECHECK.md` §1, `LN/fix/data`, `LN/fix/sheets`): control `2acc218` :5350
  floats in **8/8** cold-cache starts (CPU 4–6× and 2 unthrottled; 390×844@3 ×7, 1440×900@2 ×1), 2–10 screencast frames,
  **425–2,207 ms** of items on the bare sky; fix `55eb968` :5356 **0/9** (5 throttled + 3 unthrottled at 390×844, 1 at
  1440×900), by DOM sampler and by screencast; the first frame with items is never before the first frame with the
  painted room (items 0–802 ms after it).
- Maker (`N/fix/float-*.json`): `fc9f6d8` 6/6 starts float, fix 0/6, CPU 6×, cold cache.
- Opened by LEAD-2: `LN/fix/sheets/ctrl-5350-390x844-start4.jpg` (shelf, pothos, books and record-player stand on the
  bare sky at 1,542 / 2,094 / 2,717 ms; room at 3,160 ms) and `fix-5356-390x844-start4.jpg` (bare sky at 1,501 ms with no
  items — the base loading look —, room at 1,634 ms, items on the room at 2,026 ms).
- Spec `w2-room.spec.ts` on the fix (dev :5346): **7/7** (`LN/fix/logs/spec.log`); maker: 7/7, tsc 0, vitest 267/267.

**Result: FIXED.** The remaining cost is that the items can arrive after the room (0–0.8 s in Lane N's runs, up to 2.5 s
under the maker's 6× throttle): every frame is either the base look (room without items) or the intended one.

### 3.4 Static Nook: truthful hint — MET
"Drag to look around · tap things" → "A drawing of your room" with 3D off and with no WebGL (16/16 maker; spec); 3D on
unchanged (16/16). One line at 100 %; two lines at 375×667 @200 % (BEFORE: one line running past both edges of the stage).

### 3.5 375×667 "room behind Chai disappears" — investigated, not reproducible, no change: ACCEPTED
Not reproduced on `90a11e5` by the maker (67 samples incl. throttled), the audit's own critic (4 samples), or Lane N
(control runs at 375×667, `LN/runs/sheets/p375-ctrl-run1-samples.jpg`: room present at 1.5/4.5/10 s). The audit
withdrew it. I read the paused-engine paths: `setSize` → `invalidate()`; `invalidate` bails while compiling, but `warm()`
always ends with `invalidate()` (`Engine.ts` warm `finally`), and an adaptive step-down goes through `warm`; a reported
context loss shows the still (now with items). I found no path that leaves a paused canvas blank. The maker's hardening
idea (re-render the paused engine on `visibilitychange`/`pageshow`) stays an optional follow-up.

### 3.6 Preserved — MET
Drawing-then-close-up unlock (unchanged path; maker's `07-summary-bigday` sheets at 4 configurations), the static fallback
(base `<img>` first; a failed layer is simply absent), reserved media space (the `<svg>` is absolutely positioned inside the
existing host; host rect identical off/live at 12/12, Lane N). On the fix (Lane N, 390×844 light and 375×667 dark): 3D-off
backdrop, static Nook (3D off and no WebGL), hint, host rect and settled unlock summary pixel-identical to `2acc218`.

### 3.7 Lane R combined N+S trial `248415c` (old N + S), N-owned pairs (LEAD-2)
- `1440x900@1-{dark,light}-02-focus-start` (12.7 / 6.4 %): the trial frame is mid-hand-over: the room still (with the
  item layers) cross-fading over the live canvas, so window frame and curtains show ghosted; clock digit. The hand-over
  fade is the base mechanism (Lane N round 1: the still unmounts 0.5–2.5 s after the engine is ready on both sides); a
  mid-fade frame of the CPU renderer that hides nothing interactive → transient exception (N-F11).
- `17-nook-early` / `18-nook-earned` SIZE differences (390 light, 1440 dark): opened; same content, the full-page height
  differs by trailing blank space, and the 1440 dark ctrl frame has the 3D Nook not yet drawn → capture phase.
- Every other N-relevant pair under 0.5 %. Suites on `248415c` (Lane R): tsc 0, vitest 275/275, chromium 87/1 (the `:1004`
  @1440 flake, F1), timer/pwa 29 + 2 skips, smoke 0 errors with the Nook hint "A drawing of your room".

## 4. Visual gate — PASS

Opened at full size: REFERENCE K03 `11b-summary-unlock-settled.png` (live backdrop with fairy lights, shelf, books, pothos)
and K08 `live-nook.jpg` → BEFORE `BEFORE-90a11e5/390x844-light-t100/02-focus-3doff.png` (bare room) and `02-focus.png`
(3D on: items) → AFTER `N/captures/AFTER-5d7bb23-5233/390x844-light-t100/02-focus-3doff.png` (items where the live view has
them); sheets `375x667-dark-t200-focus-backdrop.jpg`, `1440x900-dark-t100-focus-backdrop.jpg` (BEFORE off | AFTER off |
loading | live), `375x667-light-t200-nook.jpg` (static hint before/after, 3D hint); Lane N
`full-375x667-light-t200-and-844x390-dark-t200.jpg`, `loading-*.jpg`, `p375-*.jpg`.
- The 3D-off backdrop now reads as the user's room, matching the live view in placement and lighting (day); at night it
  matches the high-tier render, while this environment's live view is the low tier (pre-existing tier mismatch, F-N3).
- No text or control is covered by any change; the hint stays `pointer-events: none`.

## 5. Residual table

| # | Item | Configs | Class | Reason / owner |
|---|---|---|---|---|
| N-F1 | Item layers paint before the base window still at brew start (items over the bare sky gradient) | every size, first paint of the Focus backdrop; observed 1–2.5 s under load | FIXED (was BLOCKS) | Round 1: introduced by N, ruled blocking by Vibei. Fix `c381ccb`: 0/9 (Lane N) and 0/6 (maker) float starts vs 8/8 and 6/6 on `fc9f6d8`, same load; new spec test (§3.3) |
| N-F2 | Static Nook hint wraps to two lines at 375×667 @200 and sits over part of the drawing until the first tap | 375×667 @200 | ACCEPTED | One-time, `pointer-events: none`, dismissed on the first tap; BEFORE ran past both edges of the stage, unreadable |
| N-F3 | At night the 3D-off/loading still (high-quality render) differs from the live view on low-tier devices (evenly lit room) | dark / night lighting, low tier | FOLLOW-UP | Pre-existing: the base still alone differs the same way (Lane N control column); the layers match the high tier (as-seen diff 3.0). Owner: scene area |
| N-F4 | ♪ note particle baked into the record-player layer | where the record player is earned | ACCEPTED | It is the live engine's reduced-motion frame, which is what the base still already is |
| N-F5 | While three.js loads in the Nook, the drawing shows the 3D hint ("Drag to look around") | Nook, 3D on, loading | ACCEPTED | Specified (the room becomes interactive moments later); unchanged from base |
| N-F6 | A WebGL context lost mid-session in the Nook shows the drawing under the drag hint | Nook, context lost | FOLLOW-UP | Pre-existing (hint keyed on tier/WebGL, not on engine failure). Owner: N / scene |
| N-F7 | Packet says only the manifest and URL map are bundled; 4 shelf layers are inlined (`scene` chunk 8.8 → 33 KB, gzip 3.8 → 17.3 KB) | build | ACCEPTED (note) | Within budget, lazy chunk; correct the packet wording; relevant to N-F1 |
| N-F8 | 375×667 "room disappears" | 375×667 | ACCEPTED | Not reproducible (maker, critic, Lane N); no blanking path found in the engine; withdrawn by the audit |
| N-F9 | CHAI-3D-SPEC stale line references (`setPose`, `update`, `root.scale`) | doc | FOLLOW-UP | Doc fix, owner N |
| N-F10 | Host swap at brew start (static still → loading-live host): the second `WindowStill` waits for its own `decode()` of the already-loaded still, so the items left for 74 ms (5 → 0 → 5) once, at 375×667 dark, during the Home → Focus transition | 375×667 dark, loading, 1 run of 1 (not at 390×844 light, not in 9 float starts) | ACCEPTED | Not a defect: every frame is the room without items (the base look and the fix's own decode-pending state, accepted by Vibei) or the room with items; never items on the sky; under the route transition and the backdrop blur; hides nothing interactive. Optional hardening in §7 |
| N-F11 | Mid-hand-over frame (still fading over the live canvas) shows ghosted window/curtains | 1440×900 brew start (Lane R `02-focus-start`) | ACCEPTED (transient exception) | Sub-second fade of the CPU renderer, base mechanism, hides nothing interactive |
| N-F12 | CLS 0.00012 vs 0 in the same 375×667 dark loading run | 1 run | ACCEPTED (noise) | The layer `<svg>` is absolutely positioned and cannot shift layout; 0.00012 ≪ 0.1; not seen elsewhere |
| N-F13 | Items can arrive after the room (0–0.8 s, Lane N; up to 2.5 s under 6× CPU, maker) | cold start, slow device | ACCEPTED | The intended degrade: room first (base look), then items; nothing floats |
| F1 | `integrity.spec.ts:1090` @1440×900 flake | 1440×900 | FOLLOW-UP | Base fails 4/9 (Lane S). R7-7 / M7a. N's suites did not hit it; listed for completeness |

## 6. CHAI-3D-SPEC.md (I06 prep) — complete; accurate apart from three stale line references

Checked against `90a11e5`: every mesh part, placement and scale in §2.1 (`chai.ts` snout, nose, highlight, mouth, blush,
ears, paws, eyes ×3, yuzu, mug, raised paws, blob, zZ, steam); materials, roughness and the 0.16/0.14 self-fill; no texture
files (canvas `TextureBank`); `NeutralToneMapping`/sRGB/exposure and `DARK_DIM` 0.86; the lights; root scale 1.12, cushion
(−0.95, 1.15), baseY 0.255/0.05, rotation 0.62, proxy 0.8×0.9×1.1 at (0, 0.4, 0.05); FOV 30, `BASE_AZ`/`BASE_EL` 0.56/0.4,
drag −0.46…0.30 / −0.14…0.12, zoom 0.72…1.12, padding 0.035/0.02, `WINDOW_CAM`; pose mapping and the instant `setPose`
swap; `update()` constants (breath 3.5 %/1.8 %, hop 0.45 s/0.16, blink 4.2 s/0.13 s, roll 0.02, `STILL_T` 7.35); three
`0.186.1`, GLTFLoader extensions incl. `EXT_meshopt_compression`/`EXT_texture_webp`, the error strings at l.1479/1622, Draco
1.8 MB / Basis 584 KB, `manualChunks` three, and the precache glob without `glb`. The swap-in design (hook = the `Chai`
interface, async load only where Chai is visible, validation, fallback table incl. low tier, 3D off and context loss), the
`.glb` conventions (+Y up, front = glTF +Z, pivot at floor contact, node names, meshopt over Draco, WebP over KTX2) and the
judging method against K05 (IoU ≥ 0.90/0.85, proportion table, sign-off checklist incl. 5 blind viewers) cover every topic
the brief lists.
Stale references (to fix in the doc, not blocking): `setPose` is `chai.ts:140–151` (doc: 160–171); `update` 153–187
(doc: 174–211, past the file's 202 lines); `root.scale.setScalar(1.12)` is `chai.ts:190` (doc: 197).

## 7. Follow-ups with owners

1. **N-F3** night still vs low-tier live lighting — scene area (pre-existing; consider low-tier stills or matching the
   low tier's night lighting).
2. **N-F6** context lost mid-session in the Nook keeps the drag hint over the drawing — Maker N / scene (key the hint on the
   engine's state, not only on tier/WebGL).
3. **N-F9** CHAI-3D-SPEC stale line refs (`setPose` 140–151, `update` 153–187, `root.scale` 190) — Maker N, doc fix with I06.
4. **N-F7** packet wording on bundling (4 shelf layers inlined) — Maker N, doc fix.
5. **N-F10 hardening (optional)** — Maker N / scene: remember decoded still URLs (module-level set) so a remounted
   `WindowStill` with an already-decoded `src` draws its items at once.
6. **F1** `integrity.spec.ts:1090`/`:1004` waits at 1440 — R7-7 / M7a owner.
7. The 375×667 "room disappears" hardening (re-render a paused engine on `visibilitychange`/`pageshow`) — optional, scene.

## 8. The one pair that shows the change

3D off, Focus backdrop, 390×844 light: BEFORE `contracts/W2/BEFORE-90a11e5/390x844-light-t100/02-focus-3doff.png` →
AFTER on the fix revision `contracts/W2/review/LN/fix/acceptance-backdrop/fxf/390x844-light-t100/off.jpg` (fairy lights,
shelf, books, pothos and record player in the drawing, where the live room has them). For the fix itself:
`contracts/W2/review/LN/fix/sheets/ctrl-5350-390x844-start4.jpg` → `fix-5356-390x844-start4.jpg`.
