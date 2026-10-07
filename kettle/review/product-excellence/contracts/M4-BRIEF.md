# M4 brief — Chai and calm feedback: I06 (crisp approved Chai at intended sizes)

**Mission.** Chai must look exactly as approved — silhouette, proportions, poses, yuzu, footprint — and as crisp
as genuine source detail allows at every intended size, without popping in at the moment that matters most (the
whistle). Verify first; change only what evidence shows.

- Worktree: `/home/user/wt/m4/kettle` (branch `pe/m4`). Dev port **5204**; Playwright `KETTLE_PORT=5224
  KETTLE_PWA_PORT=5234`; production preview **5244**.
- Read first: `review/product-excellence/PROTOCOL.md`; package `MASTER_EVIDENCE_MATRIX.md` I06 (+ I10, I14 for
  context); `PRESERVE_LIST.md` items 1–4; `art-src/chai/README.md` (sizes, sharpness table, approved sheet);
  `docs/areas/art.md`; `review/product-excellence/perf/BASELINE.md` (I14 baseline, incl. Chai intrinsic vs CSS×DPR).
- **File ownership:** `src/art/**`, `art-src/chai/**` (documentation only), `src/screens/focus/stage/**` (Chai
  placement/loading only), new tests/tools. Do not touch timer/progress/data, UI kit, or other screens.

## Facts established by the orchestrator (verify, don't trust)

- Approved masters (`art-src/chai/*.png`) are the sheet's native pixels: 288–323 × 300–496 px. No higher-resolution
  approved masters exist anywhere in the repo or the package.
- The README's table: phone Focus 2× = downscale (sharp); phone 3× = 1.09× upscale; **desktop/tablet Focus at 2×
  = 1.19× upscale ("slightly soft up close")**; Home/Welcome/summary ≤ 408 device px (sharp).
- The stage (`src/screens/focus/stage/Stage.tsx`) renders one `<PaintedChai pose={chai}>`; the whistle switches
  `reading → cheering`, the break `→ sipping`, break's over `→ stretch`. Nothing preloads/decodes those poses
  before they are needed (`decoding="async"`), so a cold cache could blank Chai for a frame at the whistle.

## What to verify and when to change

1. **Max display size × DPR** for every Chai placement (stage at each layout, Home, Welcome, summary, Stats empty,
   Settings avatar, Nook) at 390×844@2, 375×667@2, 1440×900@1 and @2 (Retina), both themes. Table it.
2. **Pop-in at state changes:** on a cold load of the production build (no service worker, cache disabled via CDP
   `Network.setCacheDisabled`), record the whistle, tea and break's-over transitions frame by frame (CDP
   screencast or rapid screenshots). If Chai is ever missing/blank for a frame, fix it — e.g. warm and `decode()`
   the stage's next poses when a brew starts — and prove the fix with the same recording.
3. **Desktop Retina softness (1.19×):** the contract forbids synthetic upscales presented as detail and forbids
   unapproved replacement art. Without genuinely detailed approved masters, the honest options are: keep the
   approved footprint at 1.19× (documented, slight), or cap the CSS size on DPR ≥ 2 so Chai never exceeds source
   pixels — which changes the protected display footprint. Inspect both at 1:1 device pixels on cream and dark,
   compare with K05 and the existing `chai-sharpness-desktop2x-vs-phone2x.png`, decide with evidence, and record
   **creation of higher-resolution approved masters as BLOCKED** (needs an image-generation run and the user's
   art approval; prompts already exist in `art-src/chai/README.md`).
4. **Alignment and rim:** feet on the counter baseline, no cream/grey halo on the dark theme, same scale across
   poses (the README's single-factor rule).

## Benchmarks (open them)

| ID | File (under `.tmp/pkg/kettle-excellence-integrated/`) | Study | Do not copy |
|---|---|---|---|
| K05 | `VISUAL_BENCHMARK_LIBRARY/assets/approved/chai-approved-pose-sheet.png` | Approved silhouette, proportions, expressions, yuzu, pose mappings | No style change, no photorealism, no enlarged low-res as "master" |
| K05b | `VISUAL_BENCHMARK_LIBRARY/assets/current/chai-sharpness-desktop2x-vs-phone2x.png` | The known desktop-2× softness | — |
| B02 | `VISUAL_BENCHMARK_LIBRARY/assets/official/duolingo-correct.gif` (+ `duolingo-correct-frame-*.png`) | A character reaction inside the task space, no blocking | Duolingo's character/style |
| B08 | `research/videos/Du2lkZ_cux8/frames/EDV-03-phantom-character-06m23s.jpg` | Coherent character art as brand craft | Not proof of anything functional |

## Deliverables

`contracts/I06/READY-FOR-REVIEW.md` with the size table, pop-in recordings/frames BEFORE/AFTER, 1:1 crops, the
decision and its evidence, BLOCKED items; BEFORE/AFTER captures at 390×844, 375×667, 1440×900 both themes for any
visual change (stage states 02, 06, 07, 09, 10 at least). Commit on `pe/m4`. Return **READY FOR REVIEW**.
