# Maker C2 (Sonnet): Vibei's new 2D Chai masters (W3R3)

**Binding:** `VB-DECISIONS-W3R3.md` and preserve list #2 (`kettle/.tmp/pkg/kettle-excellence-integrated/PRESERVE_LIST.md`): "Approved Chai: the capybara, yuzu, silhouette, proportions, expressions, display footprint and reading/cheering/sipping mappings."

**Masters:** `kettle/art-src/chai/2d-v2/chai-{reading,sipping,cheering}.png`, 992×1586 RGB on a cream background, with a soft ground shadow. **Never modify these files.**

**Base:** integration HEAD `f034205` (app src `5f504d4`).
- Branch `pe/w3r3-chai-2d`, worktree `/home/user/wt/w9c` (sparse: `kettle/{src,tests,scripts,public,art-src,docs}`), dev **:5611**.
- BEFORE / control: integration **:5560** (dev) / **:5570** (preview).

**Current assets and provenance:**
- **Files:** `src/art/chai/chai-{reading,sipping,cheering}.webp`, one WebP each, about 311×487, 302×491 and 312×428. Together they are **61,476 bytes**.
- **Rendered by:** `src/art/PaintedChai.tsx`; pose mapping in `src/screens/home/chai.ts` and others.
- **History:** `art-src/chai/README.md` covers how the poses were cut and the sharpness table for each display size. The old cut script is `review/round-6-mockups/build/extract-chai.py`, read-only reference; it is not in your sparse checkout, so read it from `/home/user/Vibei/kettle/review/round-6-mockups/build/`.
- **The other poses** (happy, stretch, look, sleep, concerned, happy-face) are out of scope and stay as they are.

## Steps
1. **Inventory first (packet §1, before any change).**
   - List every file and line that defines, imports or renders the reading, sipping and cheering images, plus every screen and state where each appears: the pose mapping, `Mascot` poses, CSS, tests and docs.
   - Record the current display footprint per place: CSS box, `object-fit`, the image's natural size, and how the baseline is set.
   - **Do not change which pose shows where.**
2. **Cut-outs.**
   - Remove the cream background with clean anti-aliased edges and **no cream halo**: un-premultiply or decontaminate the edge colour, don't just threshold. Check every edge against the dark purple theme.
   - **The ground shadow:** keep it as a separate layer, or reproduce it in CSS, so it sits correctly on both themes. It must not be a cream-tinted blob baked into the alpha. Say which you chose and why.
3. **Exports.**
   - Produce the sizes the app needs (1x/2x/3x, or `srcset` / `sizes`) for the real display sizes in the README table, in a modern format (AVIF and/or WebP) with a fallback the app's browsers will take.
   - **Budget:** the total bytes of all shipped files for these three poses must be at or below **61,476**, unless LEAD approves more. If you can't hold sharpness at 2× within that budget, show the trade-off (bytes vs sharpness per size) in the packet and ask; don't decide it alone.
   - Keep the PWA precache sensible, and say what changes in it.
4. **Footprint.** Chai's displayed size, framing and baseline must match the current one in every place, so nothing jumps or resizes when the pose changes.
   - The new masters share one canvas, unlike the old tight crops, so derive crop and scale explicitly.
   - Prove it numerically: bounding box and baseline y per place, before vs after, ≤ 1 CSS px.
5. **Limits.**
   - No animation.
   - No new **app** dependencies: no `package.json` or lockfile change.
   - Build-time tools outside the repo are fine, for example Pillow in a venv under your scratch area. Commit the processing script, under `kettle/scripts/`, so the export can be reproduced.
   - Update `art-src/chai/README.md` with the new provenance (the 2d-v2 masters and how they were cut). Keep the originals.

## Scope
- **May change:**
  - `src/art/chai/chai-{reading,sipping,cheering}.*` (replace, or add size and format variants);
  - `src/art/PaintedChai.tsx`, plus its CSS module if any, for `srcset` / `<picture>` / the shadow layer;
  - the files that reference these three assets, only as needed to load the new ones;
  - a new script in `kettle/scripts/`;
  - `art-src/chai/README.md`;
  - tests that assert on these assets, to update only, never weaken.
- **Must not touch:**
  - the masters in `art-src/chai/2d-v2/`;
  - other poses;
  - pose mapping logic;
  - layout outside Chai's own box;
  - the 3D scene (`src/scene`);
  - `package.json`.

## Proof (own runs, through the gate)
- tsc 0; full vitest; build OK; a `vite preview` of your build, so the PWA precache and `srcset` work as shipped.
- Spot captures for your own checks: each pose on the dark theme at 390 and 1440, plus an edge close-up.
- **Not yours:** a separate Sonnet capture lane makes the full REFERENCE → BEFORE → AFTER set on your gated trial.
- Numbers in the packet:
  - footprint and baseline per place, before vs after;
  - bytes per shipped file and in total, before vs after;
  - halo check: for example, the mean colour of edge pixels where 0 < alpha < 255, composited on the dark theme background, vs Chai's own outline colour.

## Packet and rules
- **Packet:** `/home/user/Vibei/kettle/review/product-excellence/contracts/W3R3/C2/C2-READY.md`, written in stages:
  - §1 inventory;
  - §2 cut-out method and shadow;
  - §3 exports and bytes;
  - §4 footprint numbers;
  - §5 checks;
  - §6 open items.

  Evidence goes beside it. Logs as `.log.txt`; each file ≤ 20 MB. Commit each stage with:
  `/tmp/rv7-servers/commit-evidence.sh /home/user/Vibei/kettle/review/product-excellence/contracts/W3R3/C2 "<message>"`
- **Commits:** commit locally in stages on `pe/w3r3-chai-2d`; never push. End each commit message with:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01Wn1tcRYjBrm68QxmGYwD9K
  ```
  No AI model names anywhere.
- **Processes:**
  - Every browser run goes through the slot gate: `python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane C2 --n 1|2 -- <cmd>`.
  - Never `pkill -f`; kill only explicit PIDs you started.
  - Leave no server running at hand-back.
- **Budget:** 3 h. Hard stop **04:15 UTC**.
