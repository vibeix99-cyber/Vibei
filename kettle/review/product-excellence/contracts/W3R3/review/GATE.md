# W3R3 gate record (orchestrator)

## Start, 2026-10-20 01:05 UTC
- **State recovered.** HEAD was `bd34897`, clean and pushed (W3R2 closed).
- **Origin** had Vibei's upload `f034205` ("Add files via upload", parent `bd34897`), adding only `kettle/art-src/chai/2d-v2/chai-{reading,sipping,cheering}.png`. Fast-forwarded.
- **Masters checked:** all three exist with the right names, 992×1586, 8-bit RGB; looked at and match the description. Integration HEAD is `f034205`, with app src `5f504d4` unchanged.
- **Servers verified:**
  - :5560 / :5570 serve integration `f034205` (worktree `w6-int`; the preview is built from src `5f504d4`), the BEFORE control;
  - :5611 serves maker C2 (worktree `w9c`, branch `pe/w3r3-chai-2d`).
- **Slot gate:** MAX 3, reset. Autocommit restarted.
- **Tooling note:** the machine has no Pillow, sharp or image CLI. Pillow is installable via pip into a scratch venv, as a build-time tool outside the repo, not an app dependency.
- **Maker C2 (Sonnet) launched;** brief `BRIEF-C2.md`; hard stop 04:15 UTC.

## Maker C2: GATE PASSED, 2026-10-20 ~01:40 UTC

| Item | Result |
|---|---|
| Revision | `pe/w3r3-chai-2d@17f5a70` (`b0f9c88` assets + script + comments; `17f5a70` docs), src `bf6eeac`. Packet `contracts/W3R3/C2/C2-READY.md` (`31f8035`, `04fa579`) |
| Scope (checked) | `src/art/chai/chai-{reading,sipping,cheering}.webp` (replaced, same names); `src/art/PaintedChai.tsx` (comments only); new `scripts/export-chai-2d.py`; `art-src/chai/README.md`; `docs/areas/art.md`. **Masters in `art-src/chai/2d-v2/`, `package.json` and the lockfile are untouched.** Pose mapping is unchanged |
| **Trial** | **`4e9961f`** = integration `04fa579` (app `f034205`) + `17f5a70`, worktree `/home/user/wt/w9tr`, src `bf6eeac`, tests `266828b` (unchanged). tsc 0, vitest **342/342**, build OK (precache 119 entries). Dev **:5621** (verified; the three WebPs served byte-identical), preview **:5622** |
| The maker's claims | **Inventory:** 15 definition places and 11 pose-by-surface places (§1). **Cut-out:** the cream background (shadow included) flood-filled from the border; a 3 px rim un-mixed (alpha from the projection on F−B, colour from the nearest interior pixel); resize on premultiplied colour. **Shadow:** not baked in; the existing theme-aware CSS contact shadow on the Stage (`.cShadow`) is kept; Home, Welcome and Settings never had one. **Shipped:** WebP only at 1.25 px per layout px, q82 / alpha q80: reading 19,084 B (389×609), sipping 19,144 B (378×614), cheering 19,782 B (390×535). **Total 58,010 B ≤ 61,476.** **Footprint:** 86 places at 390 / 1440: image box Δ 0.00, worst ink Δ 0.47 CSS px, baseline Δ ≤ 0.01. **Halo:** rim pull toward cream ≈ 0.00 on #221829 (+0.45 uncorrected). **PWA:** the SW caches the new hashes and works offline |
| **Points for LEAD** | (1) To hold the old footprint, the art is **stretched non-uniformly**: cheering +3.9 % width relative to height, reading −1.5 %, sipping −1.2 %. Preserve list #2 names "proportions", and Vibei asked for on-model fidelity. (2) **WebP only, no fallback format**; Vibei asked for "modern formats with a fallback". (3) The masters' ground shadow is represented only by the existing Stage CSS shadow. (4) 1.25× density versus the README sharpness table for 2× screens |
| Archive | `archive/pe-w3r3-chai-2d-17f5a70.incremental.bundle` (requires `f034205`) |
| Next | Capture lane (Sonnet) on :5621 vs :5560; LEAD (Opus) verdict |

## C2: REJECT (LEAD-7 `542d3c5`, `CHECKER-W3R3-C2.md`). One 90-minute fix round, 02:50–04:20 UTC

- **R1 (BLOCKS): non-uniform stretch.** Each pose must keep its master's ratio within ±0.5 %; shipped reading −1.6 %, sipping −1.4 %, cheering +3.9 % (lane K measured the same).
  - **Fix:** one uniform scale per pose, set by the old ink height, with feet and centre aligned. Box, baseline, top and centre stay ≤ 1 CSS px; only ink width moves (cheering about −6.7 CSS px at the Stage cap). LEAD-7's scratch run: about 58,224 B.
- **Rulings:**
  - **WebP only: ACCEPTED, no `<picture>` required.** The es2022 build already excludes browsers without WebP alpha. A PNG fallback would be dead precache weight, and AVIF is not in the precache glob, so Chai would vanish offline. *Orchestrator note: Vibei asked for "modern formats with a fallback"; this ruling is reported to Vibei.*
  - **Shadow:** ACCEPTED on the Stage. No shadow on Home, Welcome or Settings is a FOLLOW-UP for Vibei.
  - **Resolution:** 1.25× is sharp (every case is a downscale). The budget stays 61,476 B.
- **Passed:**
  - halo on the real dark background `#241a2d`: the rim is not lighter than the interior;
  - the interior matches the masters to about 2.5/255;
  - scope and bytes.
- **D2:** docs corrections.
- **Housekeeping:** LEAD-7's stage commit `5691316` also swept in some of lane K's in-progress captures. They are evidence only.

## C2 fix round: GATE PASSED, 2026-10-20 ~02:55 UTC

| Item | Result |
|---|---|
| Revision | `pe/w3r3-chai-2d@20dfffe` (one commit on `17f5a70`), src `731e565`. Packet §7 (`5730a80`), `C2/evidence/fix/` |
| Scope (checked) | `scripts/export-chai-2d.py`, the three WebPs, `art-src/chai/README.md`, `docs/areas/art.md`: all allowed. The masters and `package.json` are untouched; `PaintedChai.tsx` is unchanged |
| **Trial 2** | **`481bf28`** = integration `e3a3f8d` + `20dfffe`, worktree `/home/user/wt/w9tr2`, src `731e565`, tests `266828b`. tsc 0, vitest **342/342**, build OK. Dev **:5631** (verified; the WebPs are served byte-identical), preview **:5632**. The first trial's :5621 / :5622 are stopped |
| The maker's claims | **Ratio vs master:** reading −0.07 %, sipping +0.06 %, cheering +0.02 % (limit ±0.5). **Footprint**, 86 places: box Δ 0.00, baseline +0.01, ink top +0.35, centre-x −0.24 CSS px; stage ink width +2.7 / +1.9 / −6.6; stage baseline spread 0.01. **Bytes:** 19,968 + 19,178 + 19,078 = **58,224** (≤ 61,476). **Halo** on `#241a2d`: rim − interior L* −0.84 / −1.12 / −0.73. **Fidelity:** 2.68 / 2.84 / 2.50 of 255. The PWA works offline |
| Archive | `archive/pe-w3r3-chai-2d-fix-20dfffe.incremental.bundle` (requires `17f5a70`) |
| Next | Lane K's AFTER-r2 on :5631 (stop 05:15); LEAD-7's final verdict |

## C2 fix round: APPROVE `20dfffe` (LEAD-7 `682c59f`), conditional on lane K's AFTER-r2

- **LEAD-7's reruns on :5631:**
  - **Ratio:** −0.07 / +0.06 / +0.02 %.
  - **Interior error:** 2.74 / 2.91 / 2.58 of 255.
  - **No halo** on `#241a2d`.
  - **Footprint vs :5560:** box Δ 0, baseline ≤ 0.01, top ≤ 0.35, centre ≤ 0.24 CSS px; pose-switch spread 0.01.
  - **Bytes:** 58,224.
  - **Docs:** corrected.
- **Merge only if K's AFTER-r2 shows all of these:**
  - (a) boxes identical to BEFORE in all 117 captures;
  - (b) no unexplained change outside Chai's box;
  - (c) 0.00 % cream edge pixels on dark;
  - (d) a reduced-motion switch spread ≤ 1 CSS px;
  - (e) on-screen aspect within ±0.5 % (±1 point for screenshot-diff methods).

  If any fails, the case goes back to LEAD-7.
- **FOLLOW-UP:** a ground shadow on Home, Welcome and Settings (for Vibei).

## Lane K AFTER-r2 meets LEAD-7's conditions → merged as `041dd25` (2026-10-20 ~05:10 UTC)

- **K's AFTER-r2** (`review/K/RECEIPT-K.md`, stage 4, `6590482`): 117 AFTER captures on :5631 against BEFORE :5560, in 9 configs × 13 states, plus edge sheets, pose-switch runs and the reference.
- **The conditions, checked by the orchestrator:**
  - **(a) Boxes:** per config and state, the Chai `<img>` box sizes are identical in all 117 pairs (orchestrator's script over `states.log.txt`). Every pair shares an identical position; the only position spread is animated states (Focus arrival, Welcome) captured at different instants.
  - **(b) Outside Chai's box:** 85 identical, 22 within noise, 10 flagged, all explained (break countdown digits, whistle music-note particles, text anti-aliasing). No layout, text or colour change.
  - **(c) Cream edge pixels on dark:** 0.00 % everywhere, on `#241a2d`.
  - **(d) Reduced-motion switch:** baseline and centre jumps 0.00 at 1440 and ≤ 0.02 px at 390, the same as BEFORE.
  - **(e) Aspect vs master:** −0.10 / +0.08 / +0.12 % (file level −0.07 / +0.18 / +0.13 %).
- **Bytes:** 61,476 → 58,224, all precached.
- **Merge check:** `041dd25`'s kettle/src `731e565`, tests `266828b`, scripts, art-src and docs equal trial 2 `481bf28`'s.
- **FOLLOW-UPs:**
  - a ground shadow on Home, Welcome and Settings (Vibei);
  - K's observation, identical BEFORE and AFTER: at 200 % text, the Home hero Chai is not visible in the full-page capture, sitting under the brew-length picker. Possibly a capture artefact; not investigated.
- **Next:** the full regression on the merged tree.

## Full regression on `7e4056d` (Lane RF3, `review/FINAL/RECEIPT-FINAL-W3R3.md`, `1e4d0ff`)

- **Green:**
  - tsc 0; vitest 342/342; build identical to the preview;
  - chromium without notice-strip: 237 passed / 2 failed / 25 skipped;
  - notice-strip 25/25; timer/PWA 29 + 2 skipped;
  - 2-tab check 21/21;
  - console clean, with every Chai request returning 200;
  - offline: the three Chai images are served from the service worker.
- **Failures:**
  - **F1, `integrity:543` I02:** also fails on :5583. Local-hour dependent: before 10:00 the "before 10 am" quest's notices push the toast out of `main`.
  - **F2, `integrity:1048`:** the known W3R2 I03 flake.
  - **F3, `w3-notices-load` 844×390 dark 200 % #0:** "textbox still on top" once under load; the rerun passed, plus 3/3.
  - All three sent to LEAD-7 to classify.
- **Correction to my timestamps:** RF3 found the :5570 preview files dated 04:02:08 UTC, not "about 05:12" as I wrote. My "~05:10" for the merge is likewise an estimate. The preview build's content was verified identical to RF3's own build.
