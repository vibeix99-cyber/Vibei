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
