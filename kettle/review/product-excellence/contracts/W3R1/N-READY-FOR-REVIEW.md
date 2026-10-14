# N · READY FOR REVIEW: Chai's night readability (scene only)

| | |
|---|---|
| Maker | N (Opus). Branch `pe/w3-chai-night`, worktree `/home/user/wt/w5n` |
| Revision | the commit that adds this packet (the head of `pe/w3-chai-night`). Code `121f011`, spec `43b10f2`, comment `76144b4`. `kettle/src` tree `969977475e94a1dde88f8f69c034228939d7a7c6` (the packet commit does not change it) |
| Base / control | `4d36939` (kettle/src `5cd9a44`): dev :5478 (debug), preview :5488 (`dist-w4final`, built from `/home/user/wt/w4-final` at `4d36939`) |
| After | dev :5504 (restarted after the code commit; served `palette.ts`, `chai.ts`, `chaiModel.ts`, `Engine.ts` equal the committed blobs, and `verify.sh` VERIFIED), preview :5514 (`dist-w5n`, built from `121f011`) |
| Evidence | `contracts/W3R1/N/` (`measure/`, `perf/`, `unlock/`, `runs/`, `scripts/`) |

## 1. What changed

The room's mood gains one number, `chaiFill`: Chai's fur self-fill at that hour, as a multiple of its day value.
- **Values:** morning 1, day 1, dusk 2.8, night 3.2.
- **Blending:** it blends with the rest of the mood, so hour changes stay as smooth as before.
- **Where it lands:** `Engine.pushMood` hands it to the Chai through a new `Chai.setFill(k)`.
  - **Model:** `chai_fur` `emissiveIntensity = 0.16 × k`. The emissive was already the fur's own vertex colour (C's `selfFill`), so the face plate, paws and blush lift in proportion and the hue stays Chai's. The eyes and nose (`chai_gloss`), mug and yuzu are untouched.
  - **Procedural Chai** (first frame and fallback): fur 0.16 × k and snout 0.14 × k. A night swap-in therefore does not jump from a dark Chai to a light one.
- **Cost:** a uniform only. There is no new program, texture, geometry or draw call, and nothing is recompiled. The fur stays PBR on the low tier as before (a unique material), so the same path covers both tiers.
- **Day and morning:** k = 1 gives exactly 0.16 / 0.14, the old values, so day frames are byte-identical (§3).

Files (all in N's ownership):
- `src/scene/engine/palette.ts`: `Mood.chaiFill` + values;
- `src/scene/engine/Engine.ts`: `MoodN` field, lerp and clone, push;
- `src/scene/engine/chai.ts`: interface + procedural `setFill`;
- `src/scene/engine/chaiModel.ts`: model `setFill`;
- `src/scene/engine/palette.test.ts` and `src/scene/engine/chaiModel.test.ts`: unit tests;
- `tests/chai3d.spec.ts`: one new browser test.

There is no artwork, geometry, palette token, light or exposure change: the room is lit exactly as before. `art-src/chai/**` and `chai.glb` are unchanged (sha `b401bc6c…` asserted by the existing unit test).

## 2. Controls first, and the separation numbers

**Method** (`scripts/sep.mjs`):
- **Setup:** frozen clock `2026-10-12T07:40:00Z` + `resume()`, `?debug&seed=veteran&theme=…&nookq=high|low&nooktime=day|dusk|night&nookweather=clear&chai3d=model#/nook`. The model is waited for, the loop stopped, and the reduced-motion time is used, so both builds draw the same breath with no blink.
- **Two frames** from the engine's own drawing buffer (`gl.readPixels`):
  - the normal frame;
  - an id frame with the same camera and geometry: only `eyes_open` (red), the body's `chai_gloss` primitive (nose, blue) and the face fur (green) are drawn, which gives exact pixel masks.
- **Regions:** eye and nose pixels (eroded 1 px), and the fur ring around each (face fur within ½ a feature diameter, a 1 px gap, eroded).
- **Statistics:** median relative luminance Y and CIE L* per region.
- **Separation:** WCAG contrast ratio `(Y_ring + 0.05) / (Y_feature + 0.05)`, and ΔL* = L*ring − L*feature.
- **Views:**
  - `close` is C's art camera (the room's own direction moved in on Chai, as in the sign-off renders);
  - `nook` is the Nook framing people see.

**Control:** BEFORE is base :5478, AFTER is :5504, same script.

**Close view, 1440×900@2, light theme, the model.** Each cell is CR / ΔL*. "day ref" is the day value on the same tier.

| tier | hour | eyes BEFORE (`4d36939` :5478) | eyes AFTER | nose BEFORE | nose AFTER | fur ring L*, mean colour BEFORE → AFTER |
|---|---|---|---|---|---|---|
| high | **day** (ref) | **4.58 / 48.1** | = (byte-identical, §3) | **3.32 / 37.6** | = | 51.3 `#ae6d34` → same |
| high | dusk | 2.26 / 30.0 | **3.85 / 44.4** | 1.93 / 25.4 | **3.14 / 38.7** | 30.5 `#723a19` → 44.9 `#9b5b2f` |
| high | night | 2.01 / 26.8 | **3.99 / 45.4** | 1.79 / 23.3 | **3.27 / 40.0** | 27.1 `#653416` → 45.8 `#9a5e31` |
| low | **day** (ref) | **4.55 / 47.8** | = | **3.31 / 37.4** | = | 51.3 `#af6d34` → same |
| low | dusk | 2.26 / 30.0 | **3.85 / 44.4** | 1.93 / 25.4 | **3.14 / 38.7** | 30.5 → 44.9 |
| low | night | 2.01 / 26.8 | **3.99 / 45.4** | 1.79 / 23.2 | **3.27 / 39.9** | 27.1 → 45.8 |

**Sources:**
- **BEFORE:** `N/measure/BEFORE/sep-BEFORE-1440-light.json`, which also has the Nook view (the same numbers within 0.01, e.g. night eyes 2.011 and nose 1.785 at both framings).
- **AFTER:** `N/tune/sep-TUNE.json`, measured on :5504 with the same script and camera.
  - The fill is applied through the shipped `chai.setFill(k)` at the shipped values (dusk 2.8, night 3.2), alongside neighbouring values (1, 1.6, 2, 2.4, 2.8, 3.2).
  - **The k = 1 row on the AFTER build reproduces BEFORE exactly** (the same CR, ΔL*, ring L* and mean colour on every row), so the build difference is the fill alone.
- **The shipped wiring is proven in the browser:** `chai3d.spec` "the fur self-fill follows the hour" reads `chai_fur` `emissiveIntensity` = 0.16 / 0.448 / 0.512 at `nooktime=day|dusk|night` on the low tier, with eyes, nose, mug and yuzu at emissive 0. It passed in run 1 (§6).
- **Not done:** the full AFTER pass of `sep.mjs` through the URL path. Its first try was killed at the 30-minute background limit after one config, and the requeue never got a browser slot before the stop (§8). The day pair it did produce (high, day) is the §3 pixel-compare.

**Reading it:**
- **Before:** at dusk and night the separation fell to about half the day's: eyes 2.0–2.3 against 4.6, nose 1.8–1.9 against 3.3, and both under the 3:1 WCAG graphics threshold. The fur ring sat at L* 27–31 against 51 by day, with the eyes and nose near black. That is Vibei's "darker and warmer" note, measured.
- **After:** the nose matches the day (night 3.27, dusk 3.14, day 3.32) and is above 3:1. The eyes reach 84–87 % of the day's ratio (3.85–3.99 against 4.58), and ΔL* is 93–95 % of the day's (44.4–45.4 against 48.1). The nose ΔL* now exceeds the day's (38.7–40.0 against 37.6), because the night nose itself is darker.
- **Why it stops there:** a fill high enough to give the eyes the full 4.6 would set the fur to its day brightness inside a night room, and that reads as a lit cut-out. At 3.2 the fur keeps the lamp's modelling: compare `N/tune/1440x900-light-high-night-k3.2.png` with `…-k1.png`, and the day crop `N/measure/BEFORE/1440x900-light-high-day-face.png`.
- **The hue moves back toward the day fur:** the night ring mean goes from `#653416` to `#9a5e31`, against day `#ae6d34`.
- **High and low tier give the same face numbers.** The fur is PBR on both tiers. The face is not in a shadow, and the low tier's Lambert eyes are near black like the high tier's.
- **Dark theme:** it lowers exposure (`DARK_DIM` 0.86), and dark-theme "auto" is night most of the day. Its separation was **not measured** in time (§8). The fill is the same, so the expected effect is the same ratio change on a slightly darker frame.

## 3. Day appearance unchanged

The normal frame's raw RGBA is compared BEFORE vs AFTER at day: every pixel and channel, same script, same buffer size.

| config | view | buffer | differing pixels | inside Chai | max channel diff |
|---|---|---|---|---|---|
| 1440×900 light high, day | close (Chai face) | 1992×1828 | **0** | 0 | 0 |
| 1440×900 light high, day | Nook | 1992×1828 | 253 | **0** | 72 |

**Raw data:** `N/measure/summary.md` and `N/measure/day-nook-diff-where.json`.
- **Where the 253 pixels are:** all of them sit in one cluster at canvas (1567–1663, 902–941) of 1992×1828, which is the record player on the shelf, far from Chai (the before and after colours are greys of the label).
- **Cause:** a timing artefact of the probe. `items.ts:514` turns the platter by `dt × 3.5` while the loop runs, and the loop ran for wall-clock time before being frozen, so the platter angle differs between any two runs.
- **Chai's region:** identical, and the close view is byte-identical.
- **By construction:** day and morning set k = 1, which gives exactly the old 0.16 / 0.14, and the unit tests assert it.
- **Not done:** the low-tier and dark day pairs; the AFTER pass was not completed (§8).

## 4. Low-tier performance (LRC receipt method)

**Method** (`scripts/perf.mjs`): `contracts/W2R2/review/LRC/scripts/check4.mjs` adapted to base vs after.
- **Session:** one Chromium launch, 3 alternating rounds, SwiftShader, default tier (low), 390×844@3, Nook, `veteran`, `nooktime=night` (the hour where the change is active), model on both builds.
- **Frame time:** `engine.frame(1/30)` followed by a 1-px `readPixels`, 10 warm-up frames, then 60 timed frames.
- **Counters:** `renderer.info` and the JS heap after 2× GC.
- **Servers:** previews :5488 (base) vs :5514 (after).

**Set 1, base first in each round, 11:36–11:40** (`N/perf/perf-low-390x844-night.json`, log `perf-run.log`). The machine was contended: load 13–15, against LRC's ≈ 4, so absolute times are about 2× the LRC receipt's.

| variant | fur fill read | frame median per run (ms) | median of medians | means | p90 | draw calls | triangles | geometries | textures | programs | JS heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| base `4d36939` (:5488) | 0.16 | 194, 201, 200 | 200 | 206, 219, 205 | 264, 282, 252 | 110 | 75,007 | 113 | 10 | 23 | 11.24, 11.25, 11.25 |
| after (:5514) | 0.512 | 204, 209, 238 | 209 | 206, 220, 248 | 281, 305, 332 | 110 | 75,007 | 113 | 10 | 23 | 11.23, 11.22, 11.25 |

**What is identical:** draw calls, triangles, geometries, textures, programs, canvas (442×395) and heap. This is expected: the change sets one existing uniform's value.

**Frame time:** after reads +10 / +8 / +38 ms per round. In set 1 it always ran second in its round on a machine at load 13–15, and two of the three rounds sit within each side's run-to-run spread (base 194–201).
- The shader, program and per-pixel work are the same, so a value-only uniform change cannot add GPU or CPU work. An ordering or contention effect is the likely reading, but this set alone does not prove it.
- **Set 2, after first:** queued at 11:41 but **never got a browser slot** before the 12:00 stop, so it was withdrawn (open item N-8).

## 5. Captures (full size)

- **Chai face** (close view, 1440×900@2):
  - files: `N/measure/{BEFORE,AFTER}/1440x900-<theme>-<tier>-<day|dusk|night>-face.png`;
  - reference: Vibei's sign-off renders `contracts/W2R2/VIBEI-SIGNOFF-C/model-awake-{day,night}.png`.
- **Nook as seen:** `N/measure/{BEFORE,AFTER}/<vp>-<theme>-<tier>-<time>-nook.png`.
- **Unlock** (Chai out of frame, record-player close-up, PRESERVE 8): `N/unlock/{BEFORE,AFTER}/390x844-<theme>-<time>-default/07-unlock*.png`.

The pairs to open first:
- **Night, Chai's face, high tier:**
  - BEFORE `N/measure/BEFORE/1440x900-light-high-night-face.png`
  - AFTER `N/tune/1440x900-light-high-night-k3.2.png` (the k1 frame of the same run is `N/tune/…-night-k1.png`, identical to BEFORE)
- **Dusk, Chai's face:** `N/measure/BEFORE/1440x900-light-high-dusk-face.png` → `N/tune/1440x900-light-high-dusk-k2.8.png`
- **Low tier, night and dusk:** `N/tune/1440x900-light-low-{night-k1,night-k3.2,dusk-k1,dusk-k2.8}.png`
- **Day, unchanged** (byte-identical close view): `N/measure/{BEFORE,AFTER}/1440x900-light-high-day-face.png`
- **Day reference for "as clearly as by day":** `N/measure/BEFORE/1440x900-light-high-day-face.png`; Vibei's `W2R2/VIBEI-SIGNOFF-C/model-awake-day.png`
- **Nook as seen, BEFORE**, all six hour × tier frames: `N/measure/BEFORE/1440x900-light-*-nook.png`. The AFTER Nook frames exist for day high only (§8).

## 6. Suites

| Suite | Result | Log |
|---|---|---|
| `npx tsc --noEmit` | exit 0 | `N/runs/tsc.txt` |
| `npx vitest run` (all) | 30 files, **293/293**: the base's 290 (`4d36939`, counted in its worktree) plus 3 new (1 palette, 2 for the model and procedural `setFill`) | `N/runs/vitest.txt` |
| scene unit tests (`src/scene`) | 3 files, 17/17 | in the above |
| chromium `chai3d.spec` + `w2-room.spec` on :5504, run 1 (11:01, load ≈ 12) | **16/17**. The one failure is `w2-room` "3D failure (WebGL context lost)": `page.screenshot` timed out at 60 s. This is C-7, the pre-existing flake under load (CHECKER-W2R2-C §6, 1/3 on both builds); it is not in the fill's path | `N/runs/chai3d-w2room-run1.txt` |
| chromium `chai3d.spec` + `w2-room.spec` on :5504, run 2 (11:30) | **17/17** (6.2 min), including the new "fur self-fill follows the hour" | `N/runs/chai3d-w2room-run2.txt` |
| full chromium suite | **not run** (slot time) | – |

## 7. Preserve list

- **2 (approved Chai):** same file, silhouette, proportions and poses. Day colours are byte-identical (§3). Evening and night show the same fur colours with more self-light; the hue moves back toward the day fur (mean ring colours in §2).
- **4 (continuous ritual):** the change is a material uniform. Focus, break and summary rooms carry it the same way, with no new mode or state.
- **8 (unlock):** the record-player close-up frames Chai out of view. The unlock captures are §5.
- No palette token, font, rule, stored data, id or setting change, and no new dependency.

## 8. Open items

| # | Item | Class | Note |
|---|---|---|---|
| N-1 | The AFTER separation numbers come from the shipped build with the fill applied through `chai.setFill(k)` at the shipped values (§2), not from a URL-only pass. The URL path's values are proven by `chai3d.spec` (0.16 / 0.448 / 0.512), and the k = 1 rows equal BEFORE exactly | **FOLLOW-UP** (evidence) | Re-run `scripts/sep.mjs --base <after>` for the full grid once slots allow. The first try was killed at the 30-minute background limit after one config (high/day, used in §3) |
| N-2 | Dark theme (exposure 0.86), 390×844 phone captures and the unlock pair at night were **not captured**. Slot time ran out with three slots for four makers at load ≈ 12, and one SwiftShader high-tier context took ≈ 3 min | **FOLLOW-UP** (evidence) | Commands are in `scripts/chain3.sh`. Unlock (PRESERVE 8): the close-up frames Chai out of view (C, LC check 6), so the fill cannot reach it; this is unproven by capture this round |
| N-3 | Eyes reach 84–87 % of the day's contrast ratio, not 100 %. The nose matches the day | **ACCEPTED** (art call, for Vibei) | A full match needs the fur at day brightness in a night room (k ≈ 4), which flattens the lamp's modelling. The values are two numbers in `palette.ts` |
| N-4 | The procedural Chai (first frame and fallback) gets the same fill, so a night swap-in has no jump. Its numbers were not measured | FOLLOW-UP (minor) | Unit-tested (`setFill` scales fur 0.16 and snout 0.14) |
| N-5 | The record-player platter angle accumulates real `dt` while the loop runs (`items.ts:514`), so frames from a probe that stops the loop are not byte-stable there | **ACCEPTED** (probe artefact, pre-existing) | Not a product defect; noted for future pixel compares |
| N-6 | C-7 `w2-room` context-loss screenshot timeout under load | FOLLOW-UP (pre-existing) | Run 1 only; run 2 passed |
| N-8 | Low-tier frame time: set 1 reads after +8 to +38 ms (median of medians 209 vs 200), with after always run second at load 13–15. Every `renderer.info` counter and the heap are identical. The order-swapped set 2 did not run | **UNPROVEN** (needs the order-swapped set) | `scripts/perf.mjs --first after`; one value-only uniform cannot add work, but this is not yet shown by measurement |
| N-7 | Preview :5514 is built from `121f011`. `76144b4` changes only a comment in `palette.ts` | – | Same code |

No BLOCKS known.

## 9. Cross-owner requests

None.
