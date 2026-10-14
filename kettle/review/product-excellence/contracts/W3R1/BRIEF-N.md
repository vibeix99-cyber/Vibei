# Maker N: Chai night readability, scene files only (budget 2 h)

Read `PLAN.md` first. Its ownership and rules bind you.

**Background:**
- C (the 3D Chai) was merged with `MODEL_ON_LOW = true` (`src/scene/chaiHost.ts`), so the model also shows on the low tier.
- Vibei's sign-off came with one follow-up: in evening and night light, raise the fur's readability, with a lighter base or a stronger self-fill, so the eyes and nose separate from the body as clearly as in the day renders.
- See `contracts/W2R2/CHECKER-W2R2-C.md`, `contracts/W2R2/VIBEI-SIGNOFF-C/` and `contracts/W2R2/review/LRC/RECEIPT-LRC.md`.

## Item

In evening and night light, the 3D Chai's eyes and nose separate from the fur as clearly as in the day renders. Tune it on the model, low tier included.
- **Day appearance unchanged:** pixel-compare day renders against `4d36939`.
- **Separation measured, not just eyeballed:** for example, the luminance contrast between eye/nose and the surrounding fur, at day, evening and night, base vs after.
- **No new artwork, and the approved Chai stays the approved Chai:** silhouette, proportions, colours in day light.
- **No performance cost on the low tier:** frame time, draw calls, triangles, textures and programs against `4d36939`, the same method as the LRC receipt.

## Proof

- **Nook and unlock captures** at day, evening and night (`nooktime=day|evening|night`, or as the scene supports), light and dark, high and low tier, against `4d36939` (:5478 / :5488). Full-size crops of Chai's face.
- **Suites:** tsc; vitest; `chai3d.spec.ts` and `w2-room.spec.ts` (twice); the scene unit tests.

**Hard stop:** 12:15 UTC. Then write `contracts/W3R1/N-READY-FOR-REVIEW.md` in your worktree.
