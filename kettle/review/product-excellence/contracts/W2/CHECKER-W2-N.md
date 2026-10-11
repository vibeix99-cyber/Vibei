# CHECKER W2 · Maker N (Room and Nook: I09 + I06 prep) — round 1

**Verdict: VERDICT_PLACEHOLDER**

| | |
|---|---|
| Lead checker | Opus 5.5 (`claude-opus-5-5`), newly launched; implemented none of this work |
| Revision | `pe/w2-room@fc9f6d8` = code `5d7bb23` + packet/evidence (docs only) |
| `kettle/src` | `81cd36ea83419e210f9360efea397153e1de7860` (`git rev-parse` of `5d7bb23`, `fc9f6d8` and the trial merge: equal) |
| Trial merge | `2acc218` = integration `cb79496` + `fc9f6d8`; dev :5340, preview :5350. `cb79496` vs `90a11e5` and `2acc218` vs `fc9f6d8` differ only in `kettle/review/**` (checked) |
| Base / control | `90a11e5` (src `42e106d`), dev :5310, preview :5330 |
| Packet | `/home/user/wt/w2n/kettle/review/product-excellence/contracts/W2/N-READY-FOR-REVIEW.md`; evidence `…/W2/N/` |
| Lane | Lane N (Sonnet 5.5) receipt `contracts/W2/review/LN/RECEIPT.md` + `LN/runs/` (frames opened by me where cited) |
| My notes / probes | `contracts/W2/review/LEAD/N-interim.md`; probes `/home/user/wt/w2t-n/kettle/.tmp/LEAD/{n-cap,n-float}.mjs` |

## 1. What I verified myself, and what I took from others

**Myself:** the diff review (§2); the bundle and precache effect on the served trial build (§2); the CHAI-3D-SPEC against
`chai.ts`, `kit.ts`, `Engine.ts`, `layout.ts`, `resolve.ts` and three `0.186.1` (§6); the engine's paused-render paths for
the 375×667 question (§5); the visual gate at full size (§4); the loading-order artifact reproduced on control and trial
(§3.3, FLOAT_PLACEHOLDER).
**From Lane N, traced to its raw frames/rows:** the 12-configuration control-vs-trial backdrop table (0 → 5 layers,
±2 px position), the loading timeline, the 375×667 control samples, the night/low-tier difference. **From the maker:**
the render-level match (`layers/match.json`), suites (tsc, vitest 267/267, chromium, timer/pwa), the control run of
`w2-room.spec` (5 fail / 1 pass on `90a11e5`; 6/6 on the fix), the 375×667 reproduction attempts (67 samples).

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
FLOAT_SECTION

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
existing host; host rect identical off/live at 12/12, Lane N).

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

RESIDUAL_PLACEHOLDER

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

FOLLOWUP_PLACEHOLDER
