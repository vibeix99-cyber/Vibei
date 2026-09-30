# Chai concept brief v2: A (refine today's Chai) vs B (a clearer capybara)

**Status: waiting for your choice.** Nothing in the app changes until you pick A or B from the sheets you generate. No paid generation was run from this session.

This replaces `review/round-6-audit/chai-concept-prompt.md` (v1: one posture sheet).

## Why compare two concepts
The baseline board, `frames/chai-baseline-light.png` / `-dark.png`, shows today's Chai in the six poses the app actually uses, at 160 / 72 / 56 / 24 px. It shows three problems:

- **The silhouette hardly changes.** Greeting, focus and concerned are the same shape: a tall, rounded-rectangle head over a loaf. Only the eyes and brows change, and those vanish below 72 px. At 24 px, poses 1, 2 and 5 cannot be told apart.
- **The head reads as a brown block, not a capybara.** The snout is a slightly darker band across the lower head. Nothing projects forward, so the blunt, boxy capybara muzzle that makes the animal recognisable is missing.
- **Body language is carried by props:** the mug, sparkles and "z z". The body itself barely leans, tilts or shifts weight.

The two concepts differ in how far to go.

| | **A: today's Chai, better posture and expression** | **B: refined Chai, clearer muzzle, more expressive body** |
|---|---|---|
| Head | Same tall rounded head merging into the body, with the same snout band and oval nose | Head slightly lower and longer. A **blunt, boxy muzzle projects forward** (about a third of the head length). The nose sits on the front-top of the muzzle, with nostril dots. The eyes sit high and toward the sides of the head. Small ears sit high and back. |
| Body | Same loaf | The same soft loaf, but with a visible **haunch** at the back and a slight **barrel** chest. The front paws can reach, hold and gesture. |
| Posture | A head tilt, a small lean and different paw positions per pose | **Whole-body lines:** lean, curl, stretch and slump. The head angle and ear angle change per pose. Squash and stretch on cheer. |
| Expression | Adds brow and eyelid shapes, and a wider range of mouth shapes | The same, plus muzzle and cheek movement (the smile lifts the cheeks) and ears that droop when concerned |
| Risk | Low: an evolution that everyone who knows the app still recognises | Medium: the character changes; it needs every icon, badge, ad and 3D Chai updated to match |
| Redraw cost in code | Small: new pose paths in `Mascot.tsx` on the existing construction | Larger: a new head and body construction, then all 11 poses |

**Both concepts keep:**
- the yuzu with its leaf on the head;
- the warm palette (fur #C98B5B family, blush, dark brown nose; no new hues outside `src/art/palette.ts`);
- the flat vector style: no outlines, one highlight and one shade per form, lit from the top-left;
- the gentle, slightly funny personality: never frantic, never sarcastic.

## Matching poses (same order, same scale, both concepts)
Draw the same seven poses for A and for B, in this order, in a 4×2 grid. The eighth cell is the side-by-side scale check.

1. **Greeting (Home):** sitting, facing us, small smile, one paw slightly raised.
2. **Focus with mug:** eyes closed, content, the orange mug held low in both paws. Steam beside the face, never across the nose.
3. **Waiting (paused):** patient; looking at us, paws together, head tilted slightly, ears relaxed.
4. **Cheer (the whistle):** both paws up, eyes happy-closed, body stretched up. The silhouette must differ clearly from pose 1.
5. **Concerned (streak at risk):** leaning forward a little, brows raised in the middle, paws together. B: ears drooped.
6. **Asleep:** curled in a loaf, eyes closed, yuzu slipping sideways.
7. **Three-quarter view, sitting calmly:** the muzzle in profile. This is where A and B differ most.
8. **Scale check:** pose 2 standing beside the round-6 v2 kettle, at the same scale as the Focus screen. Chai is about as tall as the kettle including its handle.

## Run it fairly
- **Same model, same settings, same references and same number of variations for A and B.**
  - GPT Image 2.5 through your own access, or Nano Banana Pro on its website. Neither is reachable from this session.
  - Use the same seed where the tool exposes one.
  - Run 2–3 variations per concept. Pick the best of each; don't iterate endlessly.
- **Output:** 2048×2048, one sheet per concept, plain cream background #FFF9F0, no text or labels.
- **Upload these references:**
  - `review/round-6-audit/refs/chai-{idle,sip,cheer,sleep,concerned,wave}-1024.png` (today's Chai, rendered from the app's own component);
  - `review/round-6-mockups/frames/kettle-sheet-light.png` (the v2 kettle, for style and for cell 8).

### Prompt A (paste as is)
> A character sheet for "Chai", the capybara mascot in the reference images. **Keep Chai's current design exactly**:
> - the tall rounded head that merges into a soft loaf body with no neck;
> - the slightly darker snout band and the big dark oval nose;
> - small dark eyes set high and wide, tiny round ears, a rosy blush and stubby paws;
> - chai-brown fur (#C98B5B);
> - a small yuzu with a green leaf on the head;
> - a flat vector style with one highlight and one shade per shape, no outlines, light from the top-left.
>
> **Improve only posture and expression.** Give each pose a clear head tilt or lean and purposeful paw placement, and use expressive brows and eyelids and varied mouth shapes, so that each pose has a distinct silhouette at thumbnail size.
>
> Draw 8 cells in a 4×2 grid, same scale, full body, no text:
> 1. greeting, one paw slightly raised;
> 2. eyes closed, content, holding an orange mug low in both paws, steam beside the face;
> 3. waiting patiently, looking at us, paws together, head tilted;
> 4. cheering, both paws up, body stretched up, happy closed eyes;
> 5. gently worried, leaning forward, brows raised in the middle, paws together;
> 6. curled asleep in a loaf, yuzu slipping sideways;
> 7. three-quarter view sitting calmly;
> 8. pose 2 standing beside the orange stovetop kettle from the reference, Chai as tall as the kettle including its handle.
>
> Soft, warm, calm, gently funny. No clothing, no background, only a soft oval shadow under each pose.

### Prompt B (paste as is)
> A character sheet for a **refined** "Chai", the capybara mascot in the reference images. **Keep**:
> - the chai-brown fur (#C98B5B family), rosy blush and dark brown nose;
> - the small yuzu with a green leaf on the head;
> - the flat vector style with one highlight and one shade per shape, no outlines, light from the top-left;
> - the gentle, calm personality.
>
> **Refine the anatomy toward a real capybara:**
> - a slightly lower, longer head with a **blunt, boxy muzzle that projects forward**;
> - the nose on the front-top of the muzzle with two nostril dots;
> - small eyes high on the sides of the head;
> - small ears set high and back;
> - a soft barrel body with a visible haunch and stubby legs.
>
> Give it **expressive body language**: whole-body lean and curl, head and ear angles that change per pose, cheeks that lift when smiling, and ears that droop when worried.
>
> Draw 8 cells in a 4×2 grid, same scale, full body, no text:
> 1. greeting, one paw slightly raised;
> 2. eyes closed, content, holding an orange mug low in both paws, steam beside the face;
> 3. waiting patiently, looking at us, paws together, head tilted;
> 4. cheering, both paws up, body stretched up, happy closed eyes;
> 5. gently worried, leaning forward, brows raised in the middle, ears drooped;
> 6. curled asleep in a loaf, yuzu slipping sideways;
> 7. three-quarter view sitting calmly, the muzzle clearly in profile;
> 8. pose 2 standing beside the orange stovetop kettle from the reference, Chai as tall as the kettle including its handle.
>
> Cute and round, never realistic or rodent-like: large head-to-body ratio, soft shapes. No clothing, no background, only a soft oval shadow under each pose.

**Negative guidance** (both, where the tool accepts it): 3D rendering, outlines, gradients, a bear, hamster or dog face, big anime eyes, teeth, extra fingers, text, logos, a watermark.

## How to compare (a checklist to use on the two sheets)
Place each sheet next to `frames/chai-baseline-light.png` and shrink it in any image viewer.

- [ ] **Identity:** the yuzu, palette and gentleness clearly survive. You would call it Chai.
- [ ] **Species:** in pose 7 it reads as a capybara, not a bear, hamster or beaver.
- [ ] **Silhouettes:** at 56 px, all seven poses are distinguishable. Poses 1, 4 and 5 must differ in outline, not just in face.
- [ ] **24 px (the tab bar and status line):** the head, yuzu and one clear gesture still read. Only 1, 4 and 6 need to.
- [ ] **72 px and 160 px (Home and Focus):** the expression is readable without the props.
- [ ] **Focus scale (cell 8):** beside the v2 kettle it feels like a companion, not a second focal point.
- [ ] **Dark theme:** imagine it on #221829; fur and shade must not merge (the redraw will check this).
- [ ] **Redraw feasibility:** each form is a simple closed shape, so it can be redrawn as SVG paths with one shade and one highlight.

## After you choose
1. Tell me A or B, and which variation.
2. I redraw the chosen design as SVG in `src/art/Mascot.tsx`, keeping the component's props contract (`pose`, `size`, `animate`), so every screen, theme and animation keeps working. The generated sheet stays a reference; it never ships as a bitmap.
3. Before anything replaces the current mascot, I produce the same baseline board (six poses × 160 / 72 / 56 / 24, light and dark) for the redraw, next to today's Chai. You approve that, then the 3D Chai and icon or badge uses follow.
