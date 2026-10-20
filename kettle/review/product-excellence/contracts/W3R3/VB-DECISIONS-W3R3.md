# Vibei's W3R3 brief: new 2D Chai masters (2026-10-20 ~01:00 UTC)

Recorded by the orchestrator. Vibei's wording is kept where it binds.

**W3R3: swap in Vibei's new 2D Chai masters. The Final Product Boss stays on hold.**

## First
- Recover state from STATUS.md.
- Confirm HEAD `bd34897` (or later) is clean and pushed.
- Restart the servers, the slot gate and autocommit.

## Source
- Vibei uploaded three new approved masters to `kettle/art-src/chai/2d-v2/`: `chai-reading.png`, `chai-sipping.png` and `chai-cheering.png`.
- **Format:** 992×1586, the same canvas and character position, a cream background with a soft ground shadow.
- **Approval:** Vibei has approved these as the new reading, sipping and cheering art.
- **Check before starting:** all three must exist on the branch. If any is missing or misnamed, stop and tell Vibei.

## Maker (Sonnet 5.5)
**Scope:** the 2D Chai asset pipeline and the files that reference those assets.
1. **Inventory first.** Find where the current 2D reading, sipping and cheering images live and every place they are used. List them with file:line before changing anything. Don't change which pose shows where.
2. **Cut-outs.** Cut out the backgrounds with clean anti-aliased edges and no cream halo. Check specifically on the dark purple theme. Keep the ground shadow as a separate layer, or reproduce it in CSS, so it sits correctly on both themes.
3. **Exports.**
   - Sizes: the ones the app needs (1x/2x/3x or responsive).
   - Formats: modern formats with a fallback.
   - Budget: total file size at or below the current assets, unless LEAD approves more.
   - Originals: keep the masters in `art-src` unchanged.
4. **Footprint.** Keep the current display footprint, framing and baseline position (preserve list #2), so Chai doesn't jump or resize when the pose changes.
5. **Limits.** No animation and no new dependencies in this round.

## Proof (Sonnet capture lane)
- **Sequence:** REFERENCE (Vibei's masters) → BEFORE → AFTER, full-size captures of every screen where each pose appears.
- **Sizes:** 390×844, 375×667 and 1440×900, light and dark, plus 200 % text and reduced motion.
- **Also include:**
  - a close-up of the edges on the dark theme;
  - a pose-switch sequence showing no jump in size or position.

## Review
- **LEAD (Opus)** checks edge quality, footprint, file sizes, and on-model fidelity against the masters. One fix round at most.
- **Then:** merge only on APPROVE, run the full regression on the merged tree, and report to Vibei.

## Orchestrator's start-of-round check (2026-10-20 01:03 UTC)
- **Masters present:** all three are on the branch, in Vibei's upload commit `f034205` (parent `bd34897`, only these three files), fast-forwarded locally. Each is 992×1586, 8-bit RGB with no alpha, about 1.17–1.20 MB.
- **Images match:** looked at; they match the description.
- **Current assets:** `src/art/chai/chai-{reading,sipping,cheering}.webp` (about 311×487, 302×491 and 312×428; 20.9 + 20.0 + 20.6 KB = **61,476 bytes** total), rendered by `src/art/PaintedChai.tsx`. Provenance: `art-src/chai/README.md`.
