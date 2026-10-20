# CHECKER W3R3 / C2: Vibei's new 2D Chai masters (LEAD-7)

Independent review of maker C2's swap of the reading, sipping and cheering art. Written in stages; the verdict is at the end.

- **Under review:** `pe/w3r3-chai-2d@17f5a70` (worktree `/home/user/wt/w9c`), trial `4e9961f` (`/home/user/wt/w9tr`, dev :5621, preview :5622). BEFORE: :5560 / :5570 (integration `f034205`).
- **Binding:** `VB-DECISIONS-W3R3.md`; preserve list #2 ("Approved Chai: the capybara, yuzu, silhouette, **proportions**, expressions, **display footprint** and reading/cheering/sipping mappings"); `BRIEF-C2.md`.
- **Logs:** `review/LEAD7/*.txt`; images `review/LEAD7/img/`; my scripts `review/LEAD7/tools/` (Pillow, numpy and scipy in a scratch venv outside the repo).

## 1. Scope and diff

`git diff f034205..17f5a70`: 7 files.

| File | Change | In scope? |
|---|---|---|
| `src/art/chai/chai-{reading,sipping,cheering}.webp` | replaced, same names | yes |
| `src/art/PaintedChai.tsx` | comments only (`PAINTED` w/h unchanged) | yes |
| `scripts/export-chai-2d.py` | new, reproducible export | yes |
| `art-src/chai/README.md`, `docs/areas/art.md` | provenance | yes |

- **Masters:** `art-src/chai/2d-v2/*` identical between `f034205` and `17f5a70` ◆.
- **Untouched:** no change to `package.json`, the lockfile, `src/scene` or `src/screens` ◆. The pose mapping (`Mascot.tsx` `PAINTED_POSE`, `FocusScreen.tsx` stage map, `home/chai.ts`) is untouched, so the reading, cheering and sipping mappings are preserved.
- **Shipped bytes:** the trial worktree files and the bytes served by :5621 are byte-identical to `17f5a70` ◆.
- **No animation** was added.

**Result:** scope is clean.

## 2. Fidelity and proportions (◆ decoded WebPs against the masters)

**Interior fidelity is good.** I resampled each master through the same crop and resize the script uses, and compared it on cream with the decoded shipped WebP.
- **Interior error:** the mean max-channel difference is 2.8 / 2.9 / 2.5 (of 255) for reading / sipping / cheering. That is WebP q82 noise.
- **Where differences sit:** the diff map (`img/diff-all.png`) shows only anti-aliased edges and the removed ground shadow.
- **Nothing lost:** no feature is missing or altered. That includes the steam, book pages, mug leaf, sparkles, blush, the yuzu and its leaf, and the eyes and mouth (`lead7-fidelity-diff.txt`).

**Aspect ratio is not preserved** (`lead7-proportions-ink.txt`). Ink-box w/h, alpha > 8:

| Pose | Master w/h | Shipped w/h | Aspect error | Scale x / y (master→file) |
|---|---|---|---|---|
| reading | 0.6382 | 0.6277 | **−1.64 %** | 0.4229 / 0.4300 |
| sipping | 0.6175 | 0.6086 | **−1.44 %** | 0.4170 / 0.4232 |
| cheering | 0.6983 | 0.7252 | **+3.85 %** | 0.4004 / 0.3856 |

- **Cause:** the script fits each master's ink box independently to the *old* art's ink box in x and in y (`build()`: `crop.resize((X1-X0, Y1-Y0))`). The new masters have different proportions from the old sheet cut-outs, so each pose is squashed or stretched.
- **Cheering:** this is visible side by side with the master at the same height. At equal height the shipped figure is 380 px wide against the master's 366 px (`img/cheer-uniform-vs-shipped.png`). The head, the yuzu and the body read slightly broader.
- **Relative scale between poses:** the yuzu is a fixed-size feature, so it serves as the gauge (`lead7-yuzu-feet.txt`). Cheering / reading yuzu width is 0.87 shipped, 0.88 in the old art and 0.925 in the masters. The per-pose fit therefore keeps the *old* app's relationship (cheering drawn smaller) rather than the masters'.
  - That follows from holding each pose's old footprint, which preserve list #2 names, so I accept it.
  - A single shared scale across the three masters would make cheering about 48 sheet px (~29 CSS px on the Stage) taller than today. That breaks the footprint, so it is not required.

**Ruling 1 (non-uniform stretch).** Each pose must keep the master's aspect ratio.
- **Tolerance:** |Δ(w/h)| ≤ 0.5 %, which is resampling and rounding only.
- **Why:** preserve list #2 names "proportions" and Vibei's review criterion is "on-model fidelity against the masters". A uniform scale is free, so there is no reason to distort approved art. −1.6 % / −1.4 % / +3.9 % all fail.
- **How to hold the footprint:** one uniform scale per pose, set by the old ink **height**. Align the feet baseline to the old ink bottom and the horizontal ink centre to the old ink centre. Leave `PAINTED` w/h untouched, so the image box stays identical.
- **What still holds:** height, baseline, centre and box are held to ≤ 1 CSS px. Only silhouette width follows the master's own proportions.
  - Expected change against the old art: reading +4.8, sipping +3.9 and cheering −11.2 sheet px.
  - At the Stage cap (1 sheet px = 186/500 × 1.6 = 0.595 CSS px) that is +2.9, +2.3 and −6.7 CSS px in total, split across both sides.
  - It stays inside the `PAINTED` box with ≥ 2 sheet px margin.
- **Why that is not a jump:** an ink-width change of a few px is not a "jump or resize" in Vibei's sense. The silhouette changes completely anyway when the pose switches (book → raised paws → mug), while the head height, the yuzu position and the feet stay put.
- **Fallback:** if the fix round cannot meet the box for a pose, a uniform scale set by min(width, height) (contain) is the fallback, with the baseline still aligned. Report it.
- **The brief's "≤ 1 CSS px" limit** therefore applies to box, baseline, ink top, ink bottom and ink centre-x, not to ink width.
