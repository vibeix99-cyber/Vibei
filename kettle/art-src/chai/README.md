# Chai: the approved painted art (masters)

This folder holds the **masters** of the approved mascot art. The app ships the WebP copies in `src/art/chai/`.
Nothing here is bundled.

**Source:** `chai-sheet-approved.webp` is the approved sheet (1254 × 1254, eight figures). It is the mascot's art direction. Every pose below was cut from it with its painted pixels unchanged.

The earlier Chai A/B concept brief is **superseded** (see `review/round-6-mockups/chai-ab-brief.md`). So is the vector-redraw plan in `review/round-6-audit/chai-concept-prompt.md`.

## Poses

| Master (PNG, RGBA) | App asset (`src/art/chai/*.webp`) | Size (px) | Used for |
|---|---|---|---|
| `chai-reading.png` | `chai-reading.webp` (21 KB) | 311 × 487 | Focus: running and paused (`Mascot` pose `focus`) |
| `chai-sipping.png` | `chai-sipping.webp` (20 KB) | 302 × 491 | Tea break; Home in the evening (`sip`) |
| `chai-cheering.png` | `chai-cheering.webp` (21 KB) | 312 × 428 | The whistle and the summary: one, on the stage (`cheer`) |
| `chai-concerned.png` | `chai-concerned.webp` (19 KB) | 298 × 474 | Gentle support only, e.g. the end-early sheet (`concerned`) |
| `chai-happy.png` | `chai-happy.webp` (19 KB) | 303 × 496 | Welcome, Home greeting, idle (`idle`, `wave`, `proud`) |
| `chai-stretch.png` | `chai-stretch.webp` (20 KB) | 288 × 433 | Break's over; Home in the morning (`stretch`) |
| `chai-look.png` | `chai-look.webp` (17 KB) | 310 × 431 | Thinking and empty states (`think`, `peek`) |
| `chai-sleep.png` | `chai-sleep.webp` (15 KB) | 323 × 300 | Late night (`sleep`) |
| `chai-happy-face.png` | `chai-happy-face.webp` (12 KB) | 303 × 312 | Round face avatar, used below 44 px |

The nine delivery files total about 180 KB.

**Scale:**
- Every pose is at the sheet's native scale with a 4 px transparent margin.
- `PaintedChai` (`src/art/PaintedChai.tsx`) sizes them all with one factor: `size` is the height of a 500 px sheet cell (`SHEET_REF_H`). So the poses stay the same size relative to each other and their feet share one baseline.
- `Mascot` (`src/art/Mascot.tsx`) maps the app's 12 legacy pose names to these nine (`PAINTED_POSE`). So every screen that used the vector Chai now shows the painted one.
- The vector drawing is kept as `MascotVector` for the kit page and for history. No screen uses it.

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
- Inspected at 4× zoom on cream, the dark theme (#221829), white and black.
- WebP against the PNG master: alpha is identical, and the mean colour error is about 1.5/255.

## Sharpness at the intended display sizes

The sheet gives about 490 px of height per pose. The Focus stage caps its unit at 1.6 CSS px (`--u` in `src/screens/focus/stage/Stage.module.css`). The reading pose is therefore at most 181 units, or about 290 CSS px, tall.

| Where | Chai height | Device px needed | Source px | Result |
|---|---|---|---|---|
| Phone Focus, 390 px wide, 2× | 177 CSS px | 354 | 487 | downscaled: sharp |
| Phone Focus, 3× | 177 CSS px | 531 | 487 | 1.09× upscale: not visible |
| Tablet / desktop Focus, 1× | 290 CSS px | 290 | 487 | sharp |
| **Tablet / desktop Focus, 2× (Retina)** | 290 CSS px | 580 | 487 | **1.19× upscale: slightly soft up close** |
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
1. Check it on #FFF9F0 and #221829 at 100% and at 40 px.
2. Run it through `extract-chai.py`'s rim check, or inspect at 4× for a halo.
3. Downscale the master so the pose is about 1200 px tall. Ship it as WebP, quality 80, alpha 100.
4. Raise `SHEET_REF_H` in proportion and update `PAINTED` sizes. The 1.6 px stage cap can then go to 2.4 px.

Only priority 1 is needed for the Focus loop on Retina desktops.
