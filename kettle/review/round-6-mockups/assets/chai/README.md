# Chai: approved art direction, extracted poses (mockup assets)

**Source:** `source/chai-sheet-approved.webp`, the approved sheet (1254 × 1254, lossy WebP, 8 poses). This is the mascot art direction. The earlier A/B concept brief (`../../chai-ab-brief.md`) is superseded.

> **Production copies:** the app's masters are now in `art-src/chai/` (all nine poses), and its delivery WebPs are in `src/art/chai/`. `art-src/chai/README.md` is the current document: sizes, sharpness at the app's display sizes, and per-pose prompts. This file describes the mockup assets.

## The assets
| File | Pose | Used for | Size (px) | WebP | PNG master |
|---|---|---|---|---|---|
| `chai-reading.webp` / `.png` | reading a green book | **Focus**: running and paused | 311 × 487 | 20 KB | 96 KB |
| `chai-sipping.webp` / `.png` | sipping from the orange mug | **Tea break** | 302 × 491 | 19 KB | 94 KB |
| `chai-cheering.webp` / `.png` | both paws up, sparkles | **Whistle and completion** | 312 × 428 | 20 KB | 85 KB |
| `chai-concerned.webp` / `.png` | paws together, worried brows | **Gentle support only** (e.g. a streak at risk) | 298 × 474 | 19 KB | 85 KB |
| `chai-happy.webp` / `.png` | eyes closed, content smile | Home greeting (my choice for Home; say if you prefer another) | 303 × 496 | 19 KB | 83 KB |
| `chai-happy-face.webp` / `.png` | head and yuzu | round avatar below 40 px | 303 × 312 | 11 KB | 50 KB |

All poses are at the sheet's native scale, so one scale factor keeps them the same size relative to each other. Every edge has a 4 px transparent margin.

## How they were extracted (`build/extract-chai.py`)
The painted pixels are kept exactly as they are, and nothing is redrawn or vectorised.
- **Background:** the background is the near-cream, low-saturation region connected to the edge of the crop. It includes the sheet's baked grey ground shadow, which is removed because the scene draws one contact-shadow style for Chai and the kettle.
- **Interior:** interior pixels are copied untouched at full opacity. The steam wisps, eye glints and book pages stay opaque even though they are pale, because they are enclosed.
- **Rim:** only the anti-aliased rim (about 2 px) is recomputed. Each rim pixel is un-mixed against its *local* background, which is cream along most of the outline and the grey shadow at the feet. This leaves no cream or grey halo on a dark theme.

**Checked:**
- Inspected at 4× zoom on cream, #221829 (dark theme), white and black.
- No halo and no shadow specks remain.
- One 1 px light pixel sits where the leaf meets the yuzu, visible only at 4× zoom.
- WebP versus the PNG master: alpha is identical; mean colour error is 1.5/255, which is not visible.

## Format decision: raster WebP with alpha (not SVG)
- **Fidelity:** the art is soft painted shading with subtle gradients. Tracing it to SVG would flatten exactly what was approved, so no SVG conversion.
- **Weight:** about 20 KB per pose. Focus plus the tea break plus the whistle is about 60 KB in total, decoded once and then cached. The scene composites one `<img>` per state; there is no per-frame drawing cost.
- **Production** would use `<img>` (or `image-set` with 1× and 2× files) with explicit width and height, preloaded before the whistle so the switch to cheering is instant.

## Resolution limit (important for production)
The sheet gives about 490 px of height per pose. That is sharp for:
- phone Focus (Chai 178 CSS px tall, about 356 device px on a 2× phone);
- phone Home (104 px);
- the desktop Home and summary (150–196 px);
- a 1× desktop Focus (322 px).

On a **2× (Retina) desktop monitor**, the desktop Focus Chai (322 CSS px, so 644 device px) is upscaled about 1.3× and looks slightly soft. For production, regenerate the individual poses at higher resolution with the prompt below; the mockups can keep these.

## Small sizes
See `exports/6-chai-size-checks.png`.
- **40 px and up:** the full pose reads.
- **Below 40 px:** the full pose becomes a brown blob; use the round face avatar (`ChaiFace`, the happy head and yuzu in a circle). It stays readable down to 24 px.

## Prompt for individual transparent poses (for production quality; not run, no paid generation)
Use the same tool that made the approved sheet, with `source/chai-sheet-approved.webp` attached as the reference. Run one pose per generation.

> Recreate exactly the capybara character "Chai" from the reference sheet, **the [READING / SIPPING / CHEERING / CONCERNED / HAPPY] pose** (the [first / second / eighth / third / fourth] figure on the sheet), as a single character on a **fully transparent background** (PNG with alpha), **2048 px tall**, centred, with about 6% empty margin on every side.
>
> Match the reference exactly:
> - the same proportions: tall rounded head merging into a soft loaf body, blunt muzzle, dark oval nose, small high eyes, small round ears, rosy blush, stubby paws;
> - the same warm chai-brown palette and soft painted shading, lit from the top-left;
> - the same yuzu with a green leaf on the head;
> - the same expression and props: the green book, or the orange mug with a white leaf and steam, or the sparkles.
>
> No outline added, no redesign, no new details, no text.
>
> **No ground shadow, no background colour, no vignette, no drop shadow, no glow around the silhouette.** Clean anti-aliased edges with no light or dark fringe.

After generating, check each pose on #FFF9F0 and on #221829 at 100% and at 40 px before it replaces the extracted asset.
