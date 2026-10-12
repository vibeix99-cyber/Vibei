# Maker N (Room and Nook) · Wave 2 round 1 · READY FOR REVIEW

**Items:** I09 (earned items in the 3D-off and loading Focus backdrop; the truthful static-Nook hint; the
375 × 667 "room disappears" question) and I06 preparation (`CHAI-3D-SPEC.md`, a document, no code).
**Maker:** Claude Opus 5.5 (`claude-opus-5-5`). I issue no verdicts.

| | |
|---|---|
| Base | `90a11e5` (kettle/src `42e106d`) |
| Branch / worktree | `pe/w2-room` · `/home/user/wt/w2n/kettle` (not pushed) |
| **Revision for review** | **`5d7bb23`** (`5d7bb23ebcba9225b9baafc4b16f2239a042f54d`) |
| **`git rev-parse 5d7bb23:kettle/src`** | **`81cd36ea83419e210f9360efea397153e1de7860`** |
| Commits | `ed6d004` change · `03dc2a9` spec adds the context-lost case, script header · `4b3ef8c` doc-comment order in `scene/index.tsx` (no runtime change) · `5d7bb23` static hint shortened (§3); the packet and evidence are committed on top (docs only) |
| CHAI-3D-SPEC | `review/product-excellence/contracts/W2/N/CHAI-3D-SPEC.md` |
| Evidence | `review/product-excellence/contracts/W2/N/` (size in §9) |

## 1. Changed files (vs `90a11e5`)

| File | Change |
|---|---|
| `src/scene/Fallback.tsx` | `WindowStill` takes `items` and paints the earned-item layers over the base still (one `<svg viewBox="0 0 1250 1000" preserveAspectRatio="xMidYMid slice">`, one `<image>` per layer); `windowLayers()`; `NookStatic` passes `items` to it |
| `src/scene/stills/items.json` (new) | Layer manifest: frame, unlock order, per item its box on the frame and the file for each `${time}-${weather}` |
| `src/scene/stills/items/*.webp` (new, 40 files) | Pre-rendered layers of the existing 3D items, 391,542 bytes in all |
| `src/scene/index.tsx` | `useStaticNook()`: 3D off or no WebGL |
| `src/screens/nook/NookScreen.tsx` | Static room: truthful hint text and icon, its own "seen" flag; 3D hint unchanged |
| `src/screens/nook/NookScreen.module.css` | `.hint[data-static]` may wrap inside the stage |
| `scripts/stills/render-item-layers.mjs` (new) | Renders, cuts, merges and encodes the layers; header documents design and regeneration |
| `scripts/stills/window.html` | Harness: optional `items`, `run=0`, exposes the engine to the driver (default behaviour unchanged) |
| `tests/w2-room.spec.ts` (new) | 6 tests (§6) |
| `review/…/W2/N/CHAI-3D-SPEC.md` (new) | I06 preparation |

Nothing outside my ownership was edited. No engine, material, lighting, Stage, FocusScreen, Summary or art file
changed; the 12 base stills are byte-identical.

## 2. Earned items in the 3D-off and loading Focus backdrop

### 2.1 Cause
At `90a11e5` `WindowStill` (`scene/Fallback.tsx:34–39`) drew only the base still, "the base room without unlocked
items" (l.24), and `NookStatic` did not hand it `items` (l.42). So whenever the still is the backdrop — 3D off,
no WebGL, the engine loading, or a lost WebGL context — the user's earned room was missing.

### 2.2 Layer design (no new artwork)
- **Same pipeline as the base stills:** `NookEngine`, quality high, software rasteriser, reduced-motion still frame,
  `window` mode and camera, 1250 × 1000 frame, `scripts/stills/window.html`, Playwright screenshot.
- **Cumulative difference layers.** Per lighting state the engine renders the base room, then adds the backdrop's
  items one at a time in unlock order. Layer *k* = what item *k* changes over the previous render, cut out with a
  soft alpha (change < 6 → 0, > 18 → 1, per channel max). It therefore carries what the critic listed as
  impossible for per-item alpha cut-outs: the fairy lights' wash on the walls, shadows an item casts, occlusion
  between items, and the kotatsu hiding the table. Painted in the same order over the base still they rebuild
  the live render exactly for the sets the app shows: the backdrop items are always the unlock-order prefix for
  the user's level (`itemsUnlockedAt`) minus `teaSet` (`Stage.tsx NOT_IN_BACKDROP`). Other sets (debug only)
  still compose sensibly.
- **Which items** (measured, `layers/visible-items-night-clear.json`): 8 change pixels in the window frame —
  pothos, books, fairy lights, shelf, record player, monstera, telescope, kotatsu. Cushion, blanket, painting,
  lantern and cat bed change none (out of frame); tea set is kept out of the backdrop by design.
- **Variant count, principled and measured.** All 12 lighting states (4 times × 3 weathers, the same as the base
  stills) are rendered; two states share a layer file when their layers differ by ≤ 4/255 (mean premultiplied)
  inside it. Weather reaches items only through the window light (rain × 0.65, `Engine.ts:742–763`) and the glass
  behind their edges, so snow and clear always merge and rain merges where the window light barely reaches;
  time of day never merges. Result **40 files** (not the critic's ≈ 120 estimate, nor 12 × 8 = 96):

| Item (unlock level) | Box on 1250 × 1000 frame | Files | Merged states | Bytes |
|---|---|---|---|---|
| pothos (2) | 803, 493, 447 × 507 | 4 | one per time (all weathers) | 29,254 |
| books (3) | 68, 694, 460 × 219 | 5 | day: rain apart | 26,180 |
| fairyLights (5) | 0, 0, 1250 × 213 | 4 | one per time | 35,584 |
| shelf (6) | 88, 157, 1130 × 223 | 4 | one per time | 11,354 |
| recordPlayer (8) | 937, 469, 313 × 531 | 4 | one per time | 22,502 |
| monstera (14) | 0, 250, 1250 × 750 | 7 | rain apart except dusk | 178,802 |
| telescope (18) | 784, 421, 319 × 579 | 4 | one per time | 23,324 |
| kotatsu (20) | 0, 506, 804 × 494 | 8 | rain apart at every time | 64,542 |
| **Total** | | **40** | | **391,542 B (382.4 KiB) ≤ 400 KB** |

- **Encoding:** 0.75 × frame resolution, WebP colour quality 0.45, alpha in steps of 43, ICC profile stripped. The
  backdrop is blurred by ≥ 0.9 CSS px, desaturated (0.76) and quieted by an 18–40 % overlay
  (`Stage.module.css .window/.quiet`), which hides all three.
- **Lazy:** only `items.json` and the URL map are bundled (`import.meta.glob(… '?url')`, as for the stills); a file is
  fetched only when the still first shows that item in that lighting. Note: the service worker's existing
  `**/*.webp` precache glob (owned by the PWA area) now also precaches the 40 files (+382 KiB of the 2,900 KiB
  precache) in the background at install; that is what keeps 3D-off users' items offline.
- **Fallback and space:** the base `<img>` is unchanged and drawn first. A layer that is missing or fails to load is
  simply absent. The `<svg>` is `position:absolute; inset:0` inside the existing absolutely positioned host, so it
  reserves nothing new and cannot shift layout (measured CLS 0, §7).
- **Regeneration:** steps in the header of `scripts/stills/render-item-layers.mjs` (with `--reuse` to re-cut
  without re-rendering).

### 2.3 Position-match method
1. **Render level** (`layers/match.json`, all 12 states): the committed still + the 8 layers, composited exactly as
   the app paints them (scaled into their boxes), against the live engine render of all 8 items in the same frame:
   mean |Δ| **4.5–5.7 / 255**, pixels off by > 32 levels **1.2–1.5 %**; the still alone is 24–31 / 255 and
   22–29 %. The residual is WebP loss in the still and the layers (a fresh base render vs the committed still alone
   already differs by a mean of 2.9). Sheets: `sheets/render-{day-clear,night-rain,morning-snow,dusk-clear}.jpg`.
2. **Viewport level:** the SVG uses the still's own frame with `xMidYMid slice`, which is the still's
   `object-fit: cover; object-position: 50% 50%` and the live camera's cover-fit (`Engine.ts windowCamera`).
   Same-session AFTER captures 3D off vs 3D on (live engine) at 16 configurations; side-by-sides in `sheets/`.
3. **Test:** every layer file decodes, and hiding the layers changes the pixels inside each layer's on-screen box.

## 3. The static Nook hint
- **Cause:** `NookScreen.tsx:155–164` always said "Drag to look around · tap things"; with 3D off or no WebGL the
  room is the static drawing with no canvas or handlers (`scene/index.tsx:30`).
- **Change:** `useStaticNook()` (`tier === 'off' || !hasWebGL()`). When true the hint reads **"A drawing of your
  room"** with the nook icon instead of the eye: it says what the picture is and promises nothing it can't do
  (the "Cozy things" list beside or below it still opens every story, as before). It has its own seen-flag
  (`kettle:nook-static-hint-seen`), so a later switch to 3D still gets the drag hint once. It may wrap inside the
  stage (`max-width: 100% − 24px`) instead of running past its edges as the old hint did at 375 px / 200 %
  (`sheets/375x667-light-t200-nook.jpg`): one line at 100 % text, two lines at 375 px / 200 %. **3D on: same text, icon, key and dismissal as before** (tested). While
  three.js loads, the room is a brief stand-in for the live one, so the 3D hint stays (as specified).
- `5d7bb23` shortened the text from `4b3ef8c`'s "A drawing of your room · stories in Cozy things", which wrapped to
  three lines over the drawing at 375 px / 200 % (seen in `captures/AFTER-4b3ef8c-5233/375x667-light-t200`).

## 4. 375 × 667: "the room behind Chai disappears" — not reproducible on `90a11e5`; no change

**What the audit saw** (raw run `scratchpad/aud2/int/375x667-light`, prod preview of `0d58c5e`, SwiftShader, a
run where peers hit 120 s screenshot timeouts): the room was drawn at `02-focus` … `04-resumed`, then the backdrop
was a plain day-sky gradient from `05-end-sheet` (End sheet open) through `06-whistle`, `07-summary`,
`07a-summary-settled`, `07b` and `08-tea-time`; the 3D Nook drew normally later. Its metadata shows the canvas present
with its backing store (468 × 279) and no still image, i.e. the engine had reported its first frame (the still
unmounts only then) but the paused engine's canvas content was gone.

**Reproduction attempts on `90a11e5`** (`p375/*/log.json`, `probes/probe375.mjs`; 375 × 667 @2 light, real clicks;
the audit's exact path: Home → brew → `ff(12 min)` → Pause → Resume → End sheet (sampled +0.1/0.3/0.6/1.2 s) →
Keep brewing → `nearEnd` → whistle → summary sampled at 0, 0.5, 1.5, 4.5 and 10 s). Each sample logs the engine
state and the colour spread (SD) of the top fifth of the screen. The SD only separates "room" from "blank" **per
state** (calibrated on the audit's own frames, `probes/sd.mjs`): summary blank 23.9 vs room 30.8–34.5; End sheet
blank 17.5 vs room 20.2. The saved frames (`p375/*/*.png`) were also checked by eye: the room is there.

| Run | Server | Load | Samples | Blank (by the per-state SD, and the saved frames by eye) |
|---|---|---|---|---|
| `audit-light-cpu1` | dev :5310 | machine shared by 3 makers | 16 | **0** |
| `audit-light-cpu1-prod` | prod :5330 | same | 16 | **0** |
| `audit-light-cpu4-prod` | prod :5330 | + CPU throttled × 4 (CDP) | 16 | **0** |
| `audit-light-cpu1-prod-gpucrash` | prod :5330 | `chrome://gpucrash` attempted (refused, `ERR_ABORTED`), so a 4th plain run | 19 | **0** |

Also clean: the orchestrator's BEFORE `07-summary-routine` and `-settled` at all four 375 × 667 configurations
(SD 30.8–50.7), my same-session BEFORE and AFTER `07-summary-routine` there (34.5–50.7), and the critic's 4 samples. The engine paths that could blank it are handled: a *reported* context
loss shows the still (now with the items; test 3 in §6), and a resize re-renders.

**Finding:** not reproducible; the evidence points to a capture-environment artifact of that one run (the paused
backdrop engine's composited frame lost under GPU-process load in SwiftShader, with no `webglcontextlost`
delivered). If it were real, the code would be mine (`scene/NookScene.tsx`), but there is no reproduction to fix
against, so **nothing was changed**. A possible hardening for a later round, not done: re-render the paused engine
once on `visibilitychange` / `pageshow` and when a sheet closes.

## 5. CHAI-3D-SPEC.md (I06 preparation, no code)
`review/product-excellence/contracts/W2/N/CHAI-3D-SPEC.md`: where the 3D Chai appears; mesh, materials and textures
(with measured triangles, draw calls and bounds per pose); scale, origin, orientation and the camera framings; how
`setPose`/`update` drive poses, blink, wobble, hop, zZ and steam; the budget; `.glb` conventions (Y-up, 1 m = 1
scene unit, pivot, names, meshopt over Draco, WebP over KTX2, how three `0.186.1`'s loaders resolve, the PWA
precache gap for `.glb`); the swap-in design with the procedural Chai as fallback (hook point, async, failure,
low tier, 3D off, context loss) and the pose contract for a Blender model; how to judge it against K05.
The procedural Chai is unchanged.

## 6. Control-first runs and acceptance tests (`tests/w2-room.spec.ts`)

| Test | `90a11e5` (:5310) | `5d7bb23` (:5213) |
|---|---|---|
| 3D off: the window still shows every earned window-visible item | **fails** (layers `[]` vs 5 expected) | passes |
| 3D loading (scene module held back): the still carries the same items | **fails** (`[]`) | passes |
| 3D failure (WebGL context lost): the still that takes over carries the items | **fails** | passes |
| Nook, 3D off: no drag-and-tap promise over the drawing | **fails** ("Drag to look around · tap things") | passes |
| Nook, no WebGL: the same truthful hint | **fails** (same) | passes |
| Nook, 3D on: hint unchanged | passes | passes |

Control run of the final spec on `90a11e5` (dev :5310, `KETTLE_PORT=5310`): **5 failed, 1 passed** — each failure
for the reason in the table (layers `[]` where `["pothos","books","fairyLights","shelf","recordPlayer"]` is expected;
the drag text over the drawing). Log: `runs/control-90a11e5-w2-room.txt` (and the first 5-test run,
`runs/control-90a11e5-w2-room-first5.txt`). The same spec on the fix: §8.

## 7. Acceptance per configuration (same-session captures)

All 16 configurations, same session, BEFORE = `90a11e5` production preview :5330, AFTER = the `4b3ef8c` production
build (its `src` differs from `5d7bb23` only in the static hint's text); the 3D-off group (`02-focus-3doff`,
`10-nook-static`) was captured again on the `5d7bb23` build: **16/16** show the 5 layers with 3D off and the hint "A drawing of your
room"; 0 errors (`captures/AFTER-5d7bb23-5233/`). The superseded `4b3ef8c` frames of those two states were removed
for the size cap, except `375x667-light-t200/10-nook-static.png` (the three-line hint that led to `5d7bb23`). Read from each configuration's
`meta.json`: "still, N layers" = the window still is the backdrop with N item layers; "live" = the 3D canvas was
already up. The veteran profile (level 12) has 5 window-visible items: pothos, books, fairy lights, shelf, record
player.

| Config | 3D off: BEFORE → AFTER | Loading 0.5 s: BEFORE → AFTER | 3D on 4 s (AFTER) | Static Nook hint B → A | 3D Nook hint B → A | CLS (3D off, loading) B / A | errors B / A |
|---|---|---|---|---|---|---|---|
| 390x844-light-t100 | still, 0 layers → **still, 5 layers** | live, 0 layers → **still, 5 layers** | live, 0 layers | drag → **drawing** | drag → drag | 0 / 0 | 0 / 0 |
| 390x844-dark-t100 | still, 0 layers → **still, 5 layers** | still, 0 layers → **still, 5 layers** | live, 0 layers | drag → **drawing** | drag → drag | 0 / 0 | 0 / 0 |
| 390x844-light-t200 | still, 0 layers → **still, 5 layers** | still, 0 layers → **still, 5 layers** | live, 0 layers | drag → **drawing** | drag → drag | 0 / 0 | 0 / 0 |
| 390x844-dark-t200 | still, 0 layers → **still, 5 layers** | live, 0 layers → **still, 5 layers** | live, 0 layers | drag → **drawing** | drag → drag | 0 / 0 | 0 / 0 |
| 375x667-light-t100 | still, 0 layers → **still, 5 layers** | still, 0 layers → **still, 5 layers** | live, 0 layers | drag → **drawing** | drag → drag | 0 / 0 | 0 / 0 |
| 375x667-dark-t100 | still, 0 layers → **still, 5 layers** | still, 0 layers → **still, 5 layers** | live, 0 layers | drag → **drawing** | drag → drag | 0 / 0 | 0 / 0 |
| 375x667-light-t200 | still, 0 layers → **still, 5 layers** | still, 0 layers → **still, 5 layers** | live, 0 layers | drag → **drawing** | drag → drag | 0 / 0 | 0 / 0 |
| 375x667-dark-t200 | still, 0 layers → **still, 5 layers** | still, 0 layers → **still, 5 layers** | live, 0 layers | drag → **drawing** | drag → drag | 0 / 0 | 0 / 0 |
| 844x390-light-t100 | still, 0 layers → **still, 5 layers** | still, 0 layers → **still, 5 layers** | live, 0 layers | drag → **drawing** | drag → drag | 0.06443243838959747 / 0.06443243838959747 | 0 / 0 |
| 844x390-dark-t100 | still, 0 layers → **still, 5 layers** | live, 0 layers → **still, 5 layers** | live, 0 layers | drag → **drawing** | drag → drag | 0.06443243838959747 / 0.06443243838959747 | 0 / 0 |
| 844x390-light-t200 | still, 0 layers → **still, 5 layers** | still, 0 layers → **still, 5 layers** | live, 0 layers | drag → **drawing** | drag → drag | 0 / 0.15126118351209153 | 0 / 0 |
| 844x390-dark-t200 | still, 0 layers → **still, 5 layers** | still, 0 layers → **still, 5 layers** | live, 0 layers | drag → **drawing** | drag → drag | 0.15126118351209153 / 0.15126118351209153 | 0 / 0 |
| 1440x900-light-t100 | still, 0 layers → **still, 5 layers** | live, 0 layers → **still, 5 layers** | live, 0 layers | drag → **drawing** | drag → drag | 6.864711934156378e-05 / 0.00010498971193415637 | 0 / 0 |
| 1440x900-dark-t100 | still, 0 layers → **still, 5 layers** | still, 0 layers → **still, 5 layers** | live, 0 layers | drag → **drawing** | drag → drag | 0.00012795621141975308 / 5.905671296296296e-05 | 0 / 0 |
| 1440x900-light-t200 | still, 0 layers → **still, 5 layers** | still, 0 layers → **still, 5 layers** | live, 0 layers | drag → **drawing** | drag → drag | 0.00011483249742798353 / 0.00019584619341563787 | 0 / 0 |
| 1440x900-dark-t200 | still, 0 layers → **still, 5 layers** | still, 0 layers → **live, 0 layers** | live, 0 layers | drag → **drawing** | drag → drag | 1.968557098765432e-05 / 0.00012795621141975308 | 0 / 0 |

- **Earned items, 3D off:** 0 → 5 layers at **16/16**; positions match the live 3D backdrop of the same run (e.g.
  `AFTER-4b3ef8c-5233/390x844-light-t100/02-focus-3doff.png` vs `02-focus.png`; `sheets/*-focus-backdrop.jpg`).
- **While loading (0.5 s after a cold start):** the still carries the 5 layers at **15/16**; at 1440 × 900 dark 200 %
  the live canvas was already up at 0.5 s. The layers were decoded in time in every still frame captured.
- **3D on:** the live engine at 4 s in all 16 (unchanged path).
- **Hint:** static Nook says "A drawing of your room…" at 16/16; the 3D Nook keeps "Drag to look around · tap
  things" at 16/16. (At 1440 × 900 some `10-nook-3d` frames at 7 s still show the drawing under the 3D hint,
  BEFORE and AFTER alike: three.js still loading on SwiftShader under load.)
- **Unlock (PRESERVE 8):** `07-summary-bigday` BEFORE vs AFTER at 4 configurations, `sheets/*-unlock.jpg`: the
  same drawing-then-close-up card; that path passes its own `still` and never reaches `WindowStill`.
- **CLS** (layout-shift observer from the brew click to the capture): 0 / 0 at every phone-portrait configuration;
  at 1440 × 900 ≤ 0.0002 both sides; at 844 × 390 the same pre-existing 0.064 / 0.151 shift appears BEFORE and
  AFTER (one AFTER run caught it where its BEFORE twin did not). The layers are an absolutely positioned `<svg>`
  inside the already absolutely positioned backdrop host, so they cannot move anything; the recapture records the
  shift sources: across the 16 `5d7bb23` recaptures the largest 3D-off CLS is 0.0002, and no shift source lies
  inside the scene host (sources are the timer readout, controls and text in the panel).

## 8. Suites on `4b3ef8c`

All on `5d7bb23` (src `81cd36e`), dev server :5213 (`KETTLE_PORT=5213 KETTLE_PWA_PORT=5233`), every run through
`slots.py --lane MN`. Logs in `runs/`.

| Suite | Result | Notes |
|---|---|---|
| `npx tsc --noEmit` | **pass** (exit 0) | |
| `npx vitest run` | **267 / 267** (27 files) | |
| Playwright chromium, all specs, `--workers=2`, `--n 2` | **72 passed, 1 failed, 7 did not run** (80) | The failure: `a11y.spec.ts:109` "short screen (375×667)…": on the `settings` page check the probe still found the *outgoing* Nook screen's controls under Settings' elements — `page.goto` there only changes the hash, so the Nook leaves through the route transition, and under load (three browsers machine-wide on 4 cores) it was still in the DOM after the 1.5 s settle. Nothing in this change touches routing, the screen transition or the 3D Nook's unmount. The 7 are the rest of that serial file. Re-run below. `runs/chromium-5d7bb23.txt` |
| `a11y.spec.ts` alone (re-run of the failed file), `--workers=1`, `--n 1` | **11 / 11** — the short-screen test and the 7 that did not run all pass | `runs/a11y-5d7bb23.txt` |
| `--project=timer-harness --project=timer-app --project=pwa`, `--workers=2`, `--n 2` | **29 passed, 2 skipped** (31) | Skips by design in `timer-app`: `timer.spec.ts:294` "infra is exercised in the harness; screens bind their own keys" and `:438` "render counter lives in the harness"; pwa 3/3 | `runs/timer-pwa-5d7bb23.txt` |
| `tests/w2-room.spec.ts` (in the chromium run) | **6 / 6** | fails 5/6 on `90a11e5` (§6) |

**Chromium, combined:** all 80 tests passed on `5d7bb23` across the full run and the a11y re-run; one
load-timing failure in the full run (`a11y.spec.ts:109`, explained above) passed on re-run. I did not re-run it on
`90a11e5` for lack of time; nothing in this change reaches the route transition it tripped on.

## 9. Captures and evidence

- Same-session full-size captures, frozen clock (`page.clock.install({time: 2026-10-11T07:40:00Z})` + resume),
  `animations: 'disabled'`, fresh context per state group, real clicks (debug API for seeding, the 3D preference,
  `finish` and `navigate`, as the orchestrator's BEFORE script), 16 configurations (390 × 844 @3, 375 × 667 @2,
  844 × 390 @3, 1440 × 900 @2; light and dark; 100 and 200 % text), captured BEFORE and AFTER in pairs:
  - BEFORE `90a11e5` production preview :5330 → `captures/BEFORE-90a11e5-5330/<WxH-theme-tNNN>/`
  - AFTER `4b3ef8c` production build, preview :5233 → `captures/AFTER-4b3ef8c-5233/<WxH-theme-tNNN>/`
  - AFTER `5d7bb23` (final) production build, preview :5233, 3D-off group only (`02-focus-3doff`,
    `10-nook-static`) → `captures/AFTER-5d7bb23-5233/<WxH-theme-tNNN>/`
  - States: `02-focus` (3D on, 4 s; AFTER only, see Size), `02-focus-3doff`, `02-focus-loading` (0.5 s after a cold start),
    `10-nook-3d`, `10-nook-static`; `07-summary-routine` at the four 375 × 667 configurations; `07-summary-bigday`
    (the unlock, PRESERVE 8) at 390 × 844 light 100, 375 × 667 dark 100, 844 × 390 dark 200, 1440 × 900 dark 100.
    `meta.json` per configuration lists the backdrop state, still, layers, hint text and CLS.
- `sheets/` (JPEG): side-by-sides — Focus backdrop and Nook at 6 configurations, Nook at 375 × 667 and 844 × 390
  200 %, the unlock at 2, and the render-level match at 4 lighting states.
- `layers/`: `match.json`, the final render log, the visibility probe.
- `runs/`: Playwright logs (control and final).
- `p375/`: the 375 × 667 reproduction logs and sample frames.
- `probes/`: the scripts used (capture, 375 probe, sheets, composite, Chai geometry count).
- `p375/sd-calibration.txt`: the per-state SD check (orchestrator BEFORE, my BEFORE/AFTER, the audit's raw frames).
- **Size:** `contracts/W2/N/` 147,112,421 bytes + the 40 layer files 391,542 bytes = **147.5 MB ≤ 150 MB**. To stay
  under the cap I removed the superseded `AFTER-4b3ef8c` 3D-off frames (above) and my BEFORE `02-focus` (3D on, an
  unchanged path; the orchestrator's `BEFORE-90a11e5` set has it at all 16, and every AFTER `02-focus` is kept).
