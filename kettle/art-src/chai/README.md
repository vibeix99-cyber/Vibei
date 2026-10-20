# Chai: the approved painted art (masters)

This folder holds the **masters** of the approved mascot art. The app ships the WebP copies in `src/art/chai/`.
Nothing here is bundled.

**Source:** `chai-sheet-approved.webp` is the approved sheet (1254 × 1254, eight figures). It is the mascot's art direction. Every pose below, except reading, sipping and cheering, was cut from it with its painted pixels unchanged.

**W3R3 (2026-10-20): reading, sipping and cheering are now the 2D v2 masters.** Vibei approved three new 2D masters, kept untouched in `2d-v2/` (`chai-reading.png`, `chai-sipping.png`, `chai-cheering.png`; 992 × 1586 RGB on a cream ground with a soft ground shadow, one shared canvas). The app copies `src/art/chai/chai-{reading,sipping,cheering}.webp` are cut from them by `scripts/export-chai-2d.py` (see "How reading, sipping and cheering are cut (2d-v2)" below). The PNG masters of those three poses in this folder (`chai-reading.png`, `chai-sipping.png`, `chai-cheering.png`) are the previous art, kept as history; they no longer ship.

The earlier Chai A/B concept brief is **superseded** (see `review/round-6-mockups/chai-ab-brief.md`). So is the vector-redraw plan in `review/round-6-audit/chai-concept-prompt.md`.

## Poses

| Master (PNG, RGBA) | App asset (`src/art/chai/*.webp`) | Size (px) | Used for |
|---|---|---|---|
| `2d-v2/chai-reading.png` | `chai-reading.webp` (19 KB; file 389 × 609) | 311 × 487 (layout) | Focus: running and paused (`Mascot` pose `focus`) |
| `2d-v2/chai-sipping.png` | `chai-sipping.webp` (19 KB; file 378 × 614) | 302 × 491 (layout) | Tea break; Home in the evening (`sip`) |
| `2d-v2/chai-cheering.png` | `chai-cheering.webp` (19 KB; file 390 × 535) | 312 × 428 (layout) | The whistle and the summary: one, on the stage (`cheer`) |
| `chai-concerned.png` | `chai-concerned.webp` (19 KB) | 298 × 474 | Gentle support only, e.g. the end-early sheet (`concerned`) |
| `chai-happy.png` | `chai-happy.webp` (19 KB) | 303 × 496 | Welcome, Home greeting, idle (`idle`, `wave`, `proud`) |
| `chai-stretch.png` | `chai-stretch.webp` (20 KB) | 288 × 433 | Break's over; Home in the morning (`stretch`) |
| `chai-look.png` | `chai-look.webp` (17 KB) | 310 × 431 | Thinking and empty states (`think`, `peek`) |
| `chai-sleep.png` | `chai-sleep.webp` (15 KB) | 323 × 300 | Late night (`sleep`) |
| `chai-happy-face.png` | `chai-happy-face.webp` (12 KB) | 303 × 312 | Round face avatar, used below 44 px |

The nine delivery files total about 175 KB (the three 2d-v2 poses are 58,224 bytes together, down from 61,476).

**Scale:**
- Every pose is at the sheet's native scale with a 4 px transparent margin.
- `PaintedChai` (`src/art/PaintedChai.tsx`) sizes them all with one factor: `size` is the height of a 500 px sheet cell (`SHEET_REF_H`). So the poses stay the same size relative to each other and their feet share one baseline.
- `Mascot` (`src/art/Mascot.tsx`) maps the app's 12 legacy pose names to these nine (`PAINTED_POSE`). So every screen that used the vector Chai now shows the painted one.
- The vector drawing is kept as `MascotVector` for the kit page and for history. No screen uses it.

## How reading, sipping and cheering are cut (2d-v2)

Reproduce: `python3 -m venv /tmp/c2venv && /tmp/c2venv/bin/pip install pillow numpy scipy && /tmp/c2venv/bin/python kettle/scripts/export-chai-2d.py` (build-time only; not an app dependency).

- **Background:** the cream ground and its shadow lie on one hue line (cream × 0.88 to 1.0). Pixels on that line that connect to the image border are the background. Interior pale parts (steam, book pages, the mug's leaf) are enclosed, so they stay.
- **Rim:** a 3 px band around the background is un-mixed. For each rim pixel, alpha is the projection of (pixel − local background) on (nearest interior colour − local background), and the pixel keeps the interior colour. So no cream or shadow colour is left in the rim. Resizing runs on premultiplied colour.
- **Ground shadow:** not baked in. It is drawn in CSS: the Stage's contact shadow (`Stage.module.css`, `.cShadow`, theme-aware). Other places never had one, so none was added.
- **Footprint, uniform fit:** each pose is scaled by **one uniform factor**, set by the old art's ink height, so it keeps the master's own width-to-height ratio (error −0.07 % reading, +0.06 % sipping, +0.02 % cheering; the limit is ±0.5 %). The feet (ink bottom) and the horizontal ink centre go where the old art's were (old ink box: reading x 5..306, y 4..483; sipping x 4..298, y 5..487; cheering x 4..308, y 5..424 of the 311 × 487, 302 × 491 and 312 × 428 layout box). So the image box, baseline, top and centre do not change (measured ≤ 1 CSS px). Only the ink width follows the new art's proportions: reading +4.6, sipping +3.6 and cheering −11.2 sheet px against the old art (about +2.7, +2.1 and −6.7 CSS px at the Stage cap). If a pose would not fit its canvas with a 1 px margin, the script falls back to a uniform contain-fit; none does. `PAINTED` in `src/art/PaintedChai.tsx` is unchanged.
- **Export:** WebP with alpha, 1.25 px per layout px, quality 82, alpha quality 80, method 6 (58,224 bytes for the three). Layout px stay the unit; the file is simply denser. At the Stage cap (1.6 px unit, 290 CSS px tall) a 2× screen needs 1.19 px per layout px, so every Stage and Mascot case is now a downscale (it was a 1.19× upscale before).
- **Format:** WebP only, no `<picture>` or fallback format. The build targets es2022, so any browser that can run the bundle already decodes WebP with alpha (Chrome 32, Firefox 65, Safari 14). A PNG fallback would be precached dead weight (`png` is in the precache glob), and AVIF is not in the glob, so it would not load offline.
- **Checked:** halo metric on the app's dark background `--bg` **#241a2d** (`src/styles/tokens.css`; mean pull of rim colour towards cream about −0.01; a rim left uncorrected: +0.45), edge close-ups on #241a2d and #FFF9F0.

## Format: raster WebP with alpha, not SVG

- **Character:** the art is soft painted shading. Tracing it to SVG would flatten the approved character, so it stays raster.
- **Delivery:** about 20 KB per pose, one `<img>` per state, decoded once and cached.
- **Live motion:** a slow breathing scale (`painted.module.css`), switched off with reduced motion.

## How the poses were cut (`review/round-6-mockups/build/extract-chai.py`)

- **Background:** the cream background connected to the crop edge, including the sheet's baked grey ground shadow, is removed. The app draws one contact-shadow style for Chai and the kettle.
- **Interior:** interior pixels are copied untouched at full opacity, including the pale steam, glints and book pages.
- **Rim:** only the roughly 2 px anti-aliased rim is recomputed, un-mixed against its local background. This leaves no cream or grey halo on the dark theme.
- **Sleep pose:** it shares its row with the stretch pose, so only components left of x = 318 in the crop are kept.

**Checked:**
- Inspected at 4× zoom on cream, the dark theme (`--bg` #241a2d), white and black.
- WebP against the PNG master: alpha is identical, and the mean colour error is about 1.5/255.

## Sharpness at the intended display sizes

The sheet gives about 490 px of height per pose. The Focus stage caps its unit at 1.6 CSS px (`--u` in `src/screens/focus/stage/Stage.module.css`). The reading pose is therefore at most 181 units, or about 290 CSS px, tall.

| Where | Chai height | Device px needed | Source px | Result |
|---|---|---|---|---|
| Phone Focus, 390 px wide, 2× | 177 CSS px | 354 | 487 | downscaled: sharp |
| Phone Focus, 3× | 177 CSS px | 531 | 487 (older art) / 609, 614, 535 (2d-v2 reading, sipping, cheering) | older art: 1.09× upscale, not visible; **2d-v2: downscale, sharp** |
| Tablet / desktop Focus, 1× | 290 CSS px | 290 | 487 | sharp |
| **Tablet / desktop Focus, 2× (Retina)** | 290 CSS px | 580 | 487 (older art) / 609 (2d-v2 reading) | older art: 1.19× upscale, slightly soft; **2d-v2 reading, sipping and cheering: downscaled, sharp** |
| Home, Welcome, summary | 88–204 CSS px | ≤ 408 | 487–496 | sharp |

The cap exists so the art is never enlarged further. Before this round it allowed about 1.3×.

**What's needed for a fully sharp 2× desktop:** the individual poses at higher resolution. The prompts are below. They have not been run, and no paid generation was used.

## Prompts for higher-resolution individual poses

Run one generation per pose. Use the tool that made the approved sheet, with `chai-sheet-approved.webp` attached as the reference, plus the pose's current master from this folder as a second reference.

> Recreate exactly the capybara character "Chai" from the attached reference sheet, **the [POSE] pose** (the [POSITION] figure on the sheet; second reference: this pose cut from the sheet), as a single character on a **fully transparent background** (PNG with alpha), **2048 px tall**, centred, with about 6% empty margin on every side.
>
> Match the reference exactly:
> - the same proportions: tall rounded head merging into a soft loaf body, blunt muzzle, dark oval nose, small high eyes, small round ears, rosy blush, stubby paws;
> - the same warm chai-brown palette and soft painted shading, lit from the top-left;
> - the same yuzu with a green leaf on the head;
> - the same expression and props.
>
> No outline added, no redesign, no new details, no text. **No ground shadow, no background colour, no vignette, no drop shadow, no glow around the silhouette.** Clean anti-aliased edges with no light or dark fringe.

| Pose | POSITION on the sheet | Expression and props to keep | Priority |
|---|---|---|---|
| reading | top row, 1st | eyes half-closed, reading the open green book held in both paws | **1** (Focus, the most-seen) |
| cheering | bottom row, 4th | eyes closed in a smile, both paws up, two sparkles | **1** (whistle + summary) |
| sipping | top row, 2nd | eyes closed, holding the orange mug with a white leaf, three steam curls | **1** (tea break) |
| stretch | bottom row, 1st | yawning, one paw up | 2 (break's over) |
| happy | top row, 4th | eyes closed, content smile, paws at rest | 2 (Home, Welcome) |
| concerned | top row, 3rd | worried brows, paws together | 3 |
| look | bottom row, 2nd | looking up and to the side | 3 |
| sleep | bottom row, 3rd (lying loaf) | asleep, lying flat | 3 |

**Acceptance check before an asset replaces the extracted one:**
1. Check it on #FFF9F0 and #241a2d at 100% and at 40 px.
2. Run it through `extract-chai.py`'s rim check, or inspect at 4× for a halo.
3. Downscale the master so the pose is about 1200 px tall. Ship it as WebP, quality 80, alpha 100.
4. Raise `SHEET_REF_H` in proportion and update `PAINTED` sizes. The 1.6 px stage cap can then go to 2.4 px.

Only priority 1 is needed for the Focus loop on Retina desktops.
