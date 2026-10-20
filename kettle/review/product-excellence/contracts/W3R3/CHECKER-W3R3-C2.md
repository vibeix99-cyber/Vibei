# CHECKER W3R3 / C2: Vibei's new 2D Chai masters (LEAD-7)

Independent review of maker C2's swap of the reading, sipping and cheering art. Written in stages; the verdict is at the end.

- **Under review:** `pe/w3r3-chai-2d@17f5a70` (worktree `/home/user/wt/w9c`), trial `4e9961f` (`/home/user/wt/w9tr`, dev :5621, preview :5622). BEFORE: :5560 / :5570 (integration `f034205`).
- **Binding:** `VB-DECISIONS-W3R3.md`; preserve list #2 ("Approved Chai: the capybara, yuzu, silhouette, **proportions**, expressions, **display footprint** and reading/cheering/sipping mappings"); `BRIEF-C2.md`.
- **Logs:** `review/LEAD7/*.txt`; images `review/LEAD7/img/`; my scripts `review/LEAD7/tools/` (Pillow, numpy and scipy in a scratch venv outside the repo).

## 1. Scope and diff

`git diff f034205..17f5a70`: 7 files.

| File | Change | In scope? |
|---|---|---|
| `src/art/chai/chai-{reading,sipping,cheering}.webp` | replaced, same names | yes |
| `src/art/PaintedChai.tsx` | comments only (`PAINTED` w/h unchanged) | yes |
| `scripts/export-chai-2d.py` | new, reproducible export | yes |
| `art-src/chai/README.md`, `docs/areas/art.md` | provenance | yes |

- **Masters:** `art-src/chai/2d-v2/*` identical between `f034205` and `17f5a70` ◆.
- **Untouched:** no change to `package.json`, the lockfile, `src/scene` or `src/screens` ◆. The pose mapping (`Mascot.tsx` `PAINTED_POSE`, `FocusScreen.tsx` stage map, `home/chai.ts`) is untouched, so the reading, cheering and sipping mappings are preserved.
- **Shipped bytes:** the trial worktree files and the bytes served by :5621 are byte-identical to `17f5a70` ◆.
- **No animation** was added.

**Result:** scope is clean.

## 2. Fidelity and proportions (◆ decoded WebPs against the masters)

**Interior fidelity is good.** I resampled each master through the same crop and resize the script uses, and compared it on cream with the decoded shipped WebP.
- **Interior error:** the mean max-channel difference is 2.8 / 2.9 / 2.5 (of 255) for reading / sipping / cheering. That is WebP q82 noise.
- **Where differences sit:** the diff map (`img/diff-all.png`) shows only anti-aliased edges and the removed ground shadow.
- **Nothing lost:** no feature is missing or altered. That includes the steam, book pages, mug leaf, sparkles, blush, the yuzu and its leaf, and the eyes and mouth (`lead7-fidelity-diff.txt`).

**Aspect ratio is not preserved** (`lead7-proportions-ink.txt`). Ink-box w/h, alpha > 8:

| Pose | Master w/h | Shipped w/h | Aspect error | Scale x / y (master→file) |
|---|---|---|---|---|
| reading | 0.6382 | 0.6277 | **−1.64 %** | 0.4229 / 0.4300 |
| sipping | 0.6175 | 0.6086 | **−1.44 %** | 0.4170 / 0.4232 |
| cheering | 0.6983 | 0.7252 | **+3.85 %** | 0.4004 / 0.3856 |

- **Cause:** the script fits each master's ink box independently to the *old* art's ink box in x and in y (`build()`: `crop.resize((X1-X0, Y1-Y0))`). The new masters have different proportions from the old sheet cut-outs, so each pose is squashed or stretched.
- **Cheering:** this is visible side by side with the master at the same height. At equal height the shipped figure is 380 px wide against the master's 366 px (`img/cheer-uniform-vs-shipped.png`). The head, the yuzu and the body read slightly broader.
- **Relative scale between poses:** the yuzu is a fixed-size feature, so it serves as the gauge (`lead7-yuzu-feet.txt`). Cheering / reading yuzu width is 0.87 shipped, 0.88 in the old art and 0.925 in the masters. The per-pose fit therefore keeps the *old* app's relationship (cheering drawn smaller) rather than the masters'.
  - That follows from holding each pose's old footprint, which preserve list #2 names, so I accept it.
  - A single shared scale across the three masters would make cheering about 48 sheet px (~29 CSS px on the Stage) taller than today. That breaks the footprint, so it is not required.

**Ruling 1 (non-uniform stretch).** Each pose must keep the master's aspect ratio.
- **Tolerance:** |Δ(w/h)| ≤ 0.5 %, which is resampling and rounding only.
- **Why:** preserve list #2 names "proportions" and Vibei's review criterion is "on-model fidelity against the masters". A uniform scale is free, so there is no reason to distort approved art. −1.6 % / −1.4 % / +3.9 % all fail.
- **How to hold the footprint:** one uniform scale per pose, set by the old ink **height**. Align the feet baseline to the old ink bottom and the horizontal ink centre to the old ink centre. Leave `PAINTED` w/h untouched, so the image box stays identical.
- **What still holds:** height, baseline, centre and box are held to ≤ 1 CSS px. Only silhouette width follows the master's own proportions.
  - Expected change against the old art: reading +4.8, sipping +3.9 and cheering −11.2 sheet px.
  - At the Stage cap (1 sheet px = 186/500 × 1.6 = 0.595 CSS px) that is +2.9, +2.3 and −6.7 CSS px in total, split across both sides.
  - It stays inside the `PAINTED` box with ≥ 2 sheet px margin.
- **Why that is not a jump:** an ink-width change of a few px is not a "jump or resize" in Vibei's sense. The silhouette changes completely anyway when the pose switches (book → raised paws → mug), while the head height, the yuzu position and the feet stay put.
- **Fallback:** if the fix round cannot meet the box for a pose, a uniform scale set by min(width, height) (contain) is the fallback, with the baseline still aligned. Report it.
- **The brief's "≤ 1 CSS px" limit** therefore applies to box, baseline, ink top, ink bottom and ink centre-x, not to ink width.

## 3. Edges and halo (◆ own measurement)

**Background used.** The app's actual dark background is `--bg: #241a2d` (`src/styles/tokens.css:205`; body computed `rgb(36, 26, 45)` on :5621). The `#221829` in the README is stale. I measured on both, plus `--bg-sunken #1d1525` and black (`lead7-halo.txt`, `tools/halo.py`).

**Method.**
- **Rim pixels:** every pixel with 0 < α < 255, compared with the nearest opaque interior pixel, using CIE L*.
- **Halo pixel:** a rim pixel whose composite on the background is more than 2 L* lighter than *both* the background and its own interior colour.

| Pose | Rim L* − interior L* (mean; old art) | Halo px on #241a2d (new; old) | Mean \|ΔL*\| vs ideal composite (new; old) |
|---|---|---|---|
| reading | **−0.75** (+8.48) | 29 = 0.59 % (19 = 0.61 %) | **0.69** (1.31) |
| sipping | **−0.40** (+9.67) | 40 = 0.82 % (22 = 0.69 %) | **0.57** (1.34) |
| cheering | **−0.79** (+8.72) | 41 = 0.70 % (69 = 1.94 %) | **0.62** (1.57) |

**Result.**
- The new rim carries no cream: it is not lighter than the interior on average, against +8.5 to +9.7 L* in the old art.
- Its composite error is about half the old art's.
- The few halo-flagged pixels (< 1 %) are single pixels at the sparkle tips and yuzu highlight, below 3 L* (p99 ≤ +2.7).

**Visual checks.**
- **6× close-ups on #241a2d** (`img/edges-closeup-x6-dark.png`: raised paw, sparkle, foot, ear, leaf, mug side) and **4× strips per pose** (`tools/tiles2.py`): clean anti-aliasing, no light fringe, no dark ring.
- **On the live Stage** (dark, 1440 and 390; `img/switch-*-dark.png`): the BEFORE cheering sparkles show a light fringe and the AFTER ones do not.
- **Small Mascot sizes** on `#241a2d` at DPR 3 (`img/kit-small-dark-dpr3.png`): clean.

**Cut-out method** (read in `scripts/export-chai-2d.py`): flood-fill along the cream hue line from the border, then a 3 px rim un-mixed by projection, then resize on premultiplied colour.
- It is sound for this flat art, which has no dark outline that "keep colour F" could erase.
- The diff map (`img/diff-all.png`) confirms that no pale interior part was eaten. That includes the steam, book pages and mug leaf.

**Edges: PASS.**

## 4. Footprint and the pose switch (◆ :5621 vs :5560)

**Method:** my own Playwright run (`tools/fp.mjs`, through the slot gate).
- **Path:** veteran seed, reduced motion. Running (reading) → `finish()` whistle (cheering) → summary (cheering) → Tea time break (sipping).
- **Viewports:** 390×844 at DPR 2 and 3, and 1440×900 at DPR 2, on dark and light.
- **Measured:** the `<img>` rect, the alpha > 8 ink box mapped to CSS px, and the `.cShadow` position (`lead7-footprint-stage-{dark,light}.txt`, raw `fp-*.json.txt`).

| Viewport | Box Δ (x, y, w, h) | Baseline Δ | Ink top Δ | Ink centre-x Δ | Ink width Δ | Shadow y |
|---|---|---|---|---|---|---|
| 390×844 (DPR 2 and 3) | 0 / 0 / 0 / 0 in all 4 states | ≤ 0.00 | ≤ 0.07 | ≤ 0.14 | ≤ 0.29 | identical |
| 1440×900 | 0 / 0 / 0 / 0 in all 4 states | ≤ 0.01 | ≤ 0.12 | ≤ 0.24 | ≤ 0.47 | identical |

- **Pose switch, within AFTER:** the feet baseline spread across reading → cheering → summary → sipping is 0.01 CSS px at both widths, the same as BEFORE.
- **Agreement:** these numbers agree with the maker's 86-place table (`C2/evidence/footprint.md`).
- **As shipped:** footprint, framing and baseline are held, and nothing jumps.
- **Under the Ruling 1 fix:** box, baseline, top and centre stay held. Only ink width moves, by the master's own proportions (§2), up to about 6.7 CSS px for cheering at the Stage cap, split across both sides.

## 5. Formats, sizes and bytes (◆)

| File | Before (B) | After (B) | Pixels after |
|---|---|---|---|
| chai-reading.webp | 20,900 | 19,084 | 389 × 609 |
| chai-sipping.webp | 19,950 | 19,144 | 378 × 614 |
| chai-cheering.webp | 20,626 | 19,782 | 390 × 535 |
| **Total** | **61,476** | **58,010** | |

The byte counts come from the files at `17f5a70`, which are byte-identical to the trial and to what :5621 serves. Budget 61,476: under by 3,466. The precache keeps the same names and glob.

**Ruling 2 (WebP only, no fallback format). WebP-only is ACCEPTED. `<picture>` with AVIF and a WebP or PNG fallback is NOT required, and should not be added.**
- **Supported browsers:** the build target is `es2022` (`vite.config.ts:60`, Vite 8). Any browser that can run the bundle (Chrome/Edge ≥ 94, Firefox ≥ 93, Safari ≥ 15.4/16) decodes lossy WebP with alpha, which needs Safari 14, Firefox 65 or Chrome 32. A browser that cannot decode WebP cannot run the app at all.
- **So WebP is the floor**, and a fallback below it is unreachable. Every other piece of Chai art already ships as WebP.
- **A PNG fallback would hurt.** Workbox precaches `**/*.{…,png,webp,…}` (`vite.config.ts:44`), so every install would download dead PNG bytes, several times the WebP size.
- **AVIF would hurt.** `avif` is not in the precache glob, so a `<picture>` that prefers AVIF would load an uncached file and show no Chai offline, unless the glob were widened. Widening it would double the payload for about a 20 % saving.
- **What satisfies Vibei's "modern formats with a fallback"** for this app: a modern format (WebP with alpha) whose support is guaranteed by the app's own browser floor. Record that sentence in `art-src/chai/README.md` (fix round, item D2).

**Ruling 4 (resolution and budget). 1.25× is sharp enough. No budget increase is needed or approved; the budget stays at 61,476 B.**
- **Measured on the live Stage:** device px per file px is 0.95 at 1440@2 (the 1.6 px cap), 0.73 at 390@2 and 0.87 at 390@3. Every case is a downscale; BEFORE was 1.19 at 1440@2.
- **README table, per pose:**
  - phone Focus 2×: 354 device px needed vs 609 file px, a downscale;
  - phone 3×: 531 vs 609, a downscale;
  - Retina desktop at the cap: 580 vs 609, a downscale.
- **Worst real case found:** a 3× phone in landscape (u ≈ 1.17) needs about 1.04 device px per file px, which is not visible.
- **Other surfaces:** the Welcome ready step (200 → 171 CSS px at 3×) is 0.96. Home, Settings and the summary are well under 1.
- **The fix still fits:** the Ruling 1 uniform fit, run in my scratch area, comes to 58,224 B total (`lead7-uniform-fit-feasibility.txt`).
- **Docs fix:** the README's "Phone Focus 3×" row still says "1.09× upscale" for these poses, and its "1.25 covers…" text describes the stretch. Correct both in the fix (D2).

## 6. The ground shadow

**Ruling 3: the Stage CSS contact shadow is ACCEPTED as the brief's "reproduce it in CSS, so it sits correctly on both themes".**
- **How it works:** the masters' baked shadow is removed with the background. The Stage's existing `.cShadow` is centred on Chai, theme-aware via `--shadow-ink`, and darker under `[data-night]`.
- **Verified on both themes:** it sits under the feet in all three poses on dark and light, at 390 and 1440 (`img/switch-*-dark.png`, `img/after-light-1440.png`). Its y and centre are identical BEFORE and AFTER.
- **Style:** it is narrower and tighter than the master's painted ellipse. It is the one contact-shadow style the app shares between Chai and the kettle, so it is kept.

**Home, Welcome and Settings carry no ground shadow, as before: ACCEPTED for this round, logged as a FOLLOW-UP for Vibei.**
- **Why not now:** adding one changes framing on those surfaces. A shadow below the feet extends past Chai's box into neighbouring layout, which is outside this round's scope ("layout outside Chai's own box").
- **Risk if added:** it would need its own BEFORE → AFTER on each surface.
- **No defect:** nothing was lost relative to the current product.

## 7. Lane K receipt (read in full)

I read `review/K/RECEIPT-K.md` in full as it stood at 02:45 UTC (stages 1 and 2, 242 lines). Its stage 3 (pixel diff, noise floor, hand-back) was not yet written when this verdict closed, and nothing in it can turn R1 around.

I viewed these key captures at full size:
- `reference/compare-stage-1440x900-cheering-x1.png`;
- `strips/strip-390x844-dark.png`;
- `edges/edge-stage-1440x900-dark-cheering.png`;
- AFTER `390x844-dark/{welcome-ready,home-live}.png`.

Lane K agrees with my results on every point:
- **Capture matrix:** 117 + 117 captures (9 configs × 13 states, including 200 % text and reduced motion). The `<img>` box is identical BEFORE and AFTER in every state.
- **Edges:** 0.00 % cream-coloured ring pixels on dark, on every surface, and nothing differs from the background beyond the ink. The BEFORE leaf-tip speck and sparkle fringe are gone in AFTER.
- **Pose switch** (5 steps, 12 runs, plus a rAF trace): with reduced motion, the baseline and centre never move in either version. Box-height steps are identical BEFORE and AFTER.
- **Proportions, measured independently:** reading −1.6 to −1.7 %, sipping −1.3 to −1.4 %, **cheering +4.0 %** against the master. The DOM adds no further stretch. K's reference sheet, which shows the master uniformly scaled to the AFTER ink height, shows the AFTER cheering visibly broader.
- **Bytes:** 58,010 total, and the precache holds the three new hashes at those sizes.

## Residual table

| # | Item | Class | Note |
|---|---|---|---|
| R1 | Non-uniform stretch: reading −1.64 %, sipping −1.44 %, **cheering +3.85 %** w/h vs master | **BLOCKS** | Ruling 1. Preserve list #2 "proportions" and Vibei's "on-model fidelity against the masters"; a uniform fit is free (feasibility 58,224 B, aspect ≤ 0.07 %). Fix item D1 |
| R2 | README and art docs describe the stretch; the README sharpness table is stale for these poses (3× row) and names `#221829` as the dark background | **BLOCKS** (rides with D1) | Docs must describe what ships. Fix item D2 |
| R3 | WebP only, no `<picture>` / AVIF / PNG fallback | ACCEPTED | Ruling 2: the es2022 bundle floor guarantees WebP alpha. A PNG fallback would be precached dead weight; AVIF would break offline. Record the ruling in the README (D2) |
| R4 | Ground shadow: Stage CSS `.cShadow` only | ACCEPTED | Ruling 3: theme-aware and verified on dark and light, unchanged from BEFORE |
| R5 | No ground shadow on Home, Welcome or Settings (as before) | FOLLOW-UP | A product decision for Vibei: it touches layout outside Chai's box and needs its own BEFORE → AFTER |
| R6 | 1.25× density, 58,010 B | ACCEPTED | Ruling 4: every Stage and Mascot case is a downscale (≤ 0.96 device px per file px; 3× landscape about 1.04). Budget stays 61,476 B; no increase approved or needed |
| R7 | Cheering drawn about 6 % smaller relative to reading than in the masters (yuzu 0.87 vs 0.925), to keep the old per-pose footprint | ACCEPTED | Preserve list #2 "display footprint" outranks it; the old app had the same relationship (0.88) |
| R8 | Halo, edges, interior fidelity, box, baseline, pose switch, scope, precache | ACCEPTED (PASS) | §2 to §5 |

## Verdict: **REJECT** (one fix round, 90 minutes)

**Why.** The cut-outs are clean, the interior is faithful, and the footprint and baseline hold to ≤ 0.5 CSS px. The bytes are under budget. But the art is non-uniformly rescaled away from Vibei's approved masters, by up to +3.9 % in width on cheering, which is visible side by side. Preserve list #2 binds "proportions", and on-model fidelity is the review criterion. A uniform-scale fit holds box, baseline, height and centre with no budget cost, so the distortion is not a necessary trade-off.

## Fix-round packet (maker C2, 90 min, base `pe/w3r3-chai-2d@17f5a70`)

### Defects
- **D1 (R1): proportions.** `scripts/export-chai-2d.py` `build()` resizes each master's ink crop to the old ink box independently in x and y. Required:
  - **Scale:** one uniform scale per pose, s = (old ink height × DENSITY) / master ink height.
  - **Vertical:** feet baseline (ink bottom) at the old ink bottom.
  - **Horizontal:** ink centre-x at the old ink centre-x.
  - **Unchanged:** canvas = `LOGICAL × DENSITY`, also DENSITY 1.25, q82, alpha q80, method 6 and the cut-out, as already shipped.
  - **Fallback:** if any pose would not fit its canvas with ≥ 1 file px margin, use a uniform contain-fit (min of the width and height scales) for that pose, baseline still aligned, and report it.
  - **Reports:** the `stretch_pct` report becomes `aspect_err_pct`, and the script prints it per pose.
- **D2 (R2, R3): docs.** `art-src/chai/README.md` (2d-v2 section, table and sharpness table) and `docs/areas/art.md`:
  - describe the uniform fit and the per-pose ink-width change vs the old art (sheet px);
  - correct the dark background to `--bg #241a2d`;
  - fix the sharpness-table rows for these three poses (phone 3× and Retina are downscales at 609 / 614 / 535 px);
  - add one line recording the format ruling: WebP with alpha is guaranteed by the es2022 browser floor; no `<picture>` fallback, because a PNG would be precached dead weight and AVIF is not in the precache glob.
  - Remove the "stretch" wording from the `PaintedChai.tsx` comment, if it is there.

### Required outcome
- **Proportions:** |aspect error| ≤ 0.5 % per pose, comparing master ink w/h with shipped ink w/h, alpha > 8.
- **Footprint, per place** (the existing 86-place measurement at 390 and 1440, BEFORE :5560 vs AFTER): image box Δ = 0.00; baseline (ink bottom) Δ ≤ 1 CSS px; ink top Δ ≤ 1 CSS px; ink centre-x Δ ≤ 1 CSS px. Ink width may differ by the master's proportions, expected at the Stage cap about +2.9 (reading), +2.3 (sipping) and −6.7 (cheering) CSS px. No ink may touch the box edge.
- **Pose switch:** the Focus-stage baseline spread across reading → whistle → summary → break is ≤ 1 CSS px.
- **Halo:** on `#241a2d`, the mean rim L* − interior L* is ≤ +1 per pose, and the 4× close-ups are clean (the script's own metric, mean pull to cream, ≤ 0.02).
- **Bytes:** the three files total ≤ 61,476 B (expected about 58.2 KB).
- **Unchanged:** `PAINTED`, the pose mapping, `package.json`, the lockfile, the masters, other poses, `src/scene`, the CSS and the precache glob.
- **Checks:** tsc 0, vitest 342/342, build OK, and a `vite preview` precache/offline check of the three new hashes.

### Files allowed
`kettle/scripts/export-chai-2d.py`, `kettle/src/art/chai/chai-{reading,sipping,cheering}.webp`, `kettle/art-src/chai/README.md`, `kettle/docs/areas/art.md`, `kettle/src/art/PaintedChai.tsx` (comments only), and the C2 packet and evidence. Nothing else.

### Acceptance checks (◆ = LEAD reruns)
1. ◆ Decode the three WebPs and compute the ink w/h against the masters: |err| ≤ 0.5 %.
2. ◆ Fidelity diff of the shipped WebPs against the master resampled with the *uniform* transform: interior mean ≤ 4/255, no missing features.
3. ◆ Halo on `#241a2d` (`review/LEAD7/tools/halo.py`), plus 6× close-ups.
4. ◆ Footprint on the Focus stage (`review/LEAD7/tools/fp.mjs`), reading → whistle → summary → break, at 390 (DPR 2 and 3) and 1440, dark and light: box Δ 0, baseline / top / centre Δ ≤ 1, switch spread ≤ 1.
5. ◆ Bytes per file and total.
6. The maker's 86-place `measure-footprint.mjs` re-run, with a diff table in the packet (`compare-footprint.py`, with the ink-width column labelled "expected").
7. tsc, vitest and build logs; the preview SW precache and offline check.
8. Capture lane: a re-shoot of the AFTER set for the Focus stage (all three poses, 390 and 1440, dark and light), Home hero, Welcome ready/notify and Settings About, against the existing REFERENCE and BEFORE, plus the pose-switch strip.
