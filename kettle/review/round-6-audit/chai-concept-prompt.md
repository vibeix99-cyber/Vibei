# Chai posture exploration: a kit for GPT Image 2.5 or Nano Banana Pro (run it yourself)

Neither model is reachable from this session:
- Nano Banana Pro is website-only.
- GPT Image 2.5 is used through your own access.

**Purpose: reference only.** The output is a concept sheet to choose postures from. It is not an app asset. The chosen postures are then redrawn in code, in `src/art/Mascot.tsx`, using the existing shapes and palette. That keeps every size, theme and animation deterministic.

## Upload these references (they are the current, real Chai)
`review/round-6-audit/refs/`:
- `chai-idle-1024.png`
- `chai-sip-1024.png`
- `chai-cheer-1024.png`
- `chai-sleep-1024.png`
- `chai-concerned-1024.png`
- `chai-wave-1024.png`

All are 1024×1024 on a transparent background, rendered from the app's own component.

## Settings
- **Output:** 2048×2048, square, one sheet. A plain cream background (#FFF9F0) is fine; no transparency is needed for a reference sheet.
- **Variations:** 2–4 per model. Don't iterate endlessly. Pick, then redraw.

## Prompt (paste as is)
> A character posture sheet for "Chai", the capybara mascot shown in the reference images. Keep Chai exactly on-model:
> - the same flat vector style with one highlight and one shade per shape, and no outlines;
> - the same chai-brown fur (#C98B5B), a slightly darker, warmer brown snout block, and a big dark oval nose;
> - small dark eyes set high and wide, tiny round ears, a rosy blush, and stubby paws;
> - the soft loaf body;
> - a small yuzu with a green leaf balanced on the head.
>
> Draw 8 poses in a 4×2 grid, each on its own, same scale, full body, with no text or labels:
> 1. Focused, reading a small open book held low in both paws, head tilted slightly down, eyes half-closed and content.
> 2. Sipping from an orange mug held below the snout. Steam rises beside the face, not over the nose.
> 3. Gently worried: leaning forward a little, brows raised in the middle, paws together.
> 4. Proud: chest out, chin up, eyes shut in a smile.
> 5. Waking up and stretching as a kettle whistles: one paw up, mouth open in a yawn, yuzu tilted.
> 6. Three-quarter view, sitting calmly, showing the capybara's long blunt muzzle in profile.
> 7. Curled asleep in a loaf, eyes closed.
> 8. Cheering: both paws up, happy closed eyes.
>
> Each pose must have a clearly different silhouette that reads at a thumbnail size. Keep the proportions of the reference: a tall rounded head merging into the body with no neck.
>
> Soft, warm, calm, gently funny; never frantic. No clothing, no extra accessories except the book and the mug, no background scene, no shadows other than a soft oval under each pose.

**Negative guidance** (add it where the tool accepts it): 3D rendering, outlines, gradients, a bear or hamster face, big anime eyes, extra fingers, text, logos, a watermark.

## Checklist before anything moves into the app
- [ ] Recognisable as the same Chai next to `chai-idle-1024.png`: yuzu with leaf, nose, eye placement, colours.
- [ ] Each pose reads at 56 px and 24 px. To check, shrink the sheet in any viewer: at 56 px the eight silhouettes should still be distinguishable.
- [ ] In the sip pose, the mug is below the snout and the steam doesn't cross the nose.
- [ ] The three-quarter muzzle reads as a capybara, not a bear or hamster.
- [ ] No new colours outside `src/art/palette.ts` (Chai's own colours are in `Mascot.tsx`).
- [ ] Choose at most 3 postures for round 1 (suggested: focus-reading, sip-fixed, concerned-lean). They are then redrawn as SVG in code and compared side by side against the current poses at 24 / 56 / 72 / 160 px, in light and dark, before any replacement.

## Cheaper API alternative (reachable now, estimate only; nothing was submitted)
| Model (Higgsfield API) | Per image (estimate) | Fit |
|---|---|---|
| Qwen Image 3 · edit (from a reference) | 0.64 credits · $0.04 | Best API route for pose variations of the real Chai; fidelity to the flat style unproven |
| Recraft V4.1 | 0.56 credits · $0.035 | Vector-leaning; weaker at keeping a specific character |
| Recraft V4.1 Pro | 3.36 credits · $0.21 | Higher quality, same caveat |
| Ideogram 4.0 / Grok Image 2.0 | 0.96 credits · $0.06 | General; no advantage here |
