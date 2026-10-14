# CHECKER W3R1 · Maker N: Chai's night readability

**Verdict: DRAFT — APPROVE pending Lane R** (`review/LR/N/RECEIPT-LR-N.md`). Not final until that receipt is in and checked (§7). Any change to the branch after this invalidates it.

| | |
|---|---|
| Lead checker | LEAD-4. I implemented none of this work |
| Under review | `pe/w3-chai-night@4168428`. Code commits `121f011`, `43b10f2`, `76144b4`. `git rev-parse 4168428:kettle/src` = `9699774…` (checked) |
| Trial | `46f33e2` = integration `1af69d7` (src `5cd9a44`) + `4168428`; worktree `/home/user/wt/w5tr-n`; src `9699774`; dev :5524 (all my trial runs), preview :5534. `git diff 4d36939 46f33e2 -- src tests public package.json` = N's 7 files only |
| Base / control | `4d36939` (src `5cd9a44`); worktree `/home/user/wt/w4-final`; dev :5478 (all my base runs), preview :5488 |
| Packet | `/home/user/wt/w5n/kettle/review/product-excellence/contracts/W3R1/N-READY-FOR-REVIEW.md`; evidence `…/W3R1/N/` |
| My evidence | `contracts/W3R1/review/LEAD/N/`: `lead-n.mjs` (probe), `chain.sh` (slot-gated runner), `pngdiff.py` (stdlib pixel compare), `shots/{BASE,TRIAL}/` (frames + `lead-*.json`), `runs/*.log` |

## 1. What I did

### Read
- `PLAN.md`, the four briefs, the preserve list, `GATE.md`, the house style (`CHECKER-W2R3-T2.md`), and the C background (`CHECKER-W2R2-C.md` §3 item 3, `VIBEI-SIGNOFF-C/`).
- The packet in full, and the full src/tests diff `4d36939..4168428` (7 files, +113 −2).
- Ownership: every changed file is in N's set (`src/scene/engine/**`, `tests/chai3d.spec.ts`). No change to `art-src/chai/**`, `public/**` (the `.glb`), palette tokens, lights or exposure.

### Code, judged against the brief
- **One number per hour.** `Mood.chaiFill` (morning 1, day 1, dusk 2.8, night 3.2) is blended with the rest of the mood (`lerpMood`, 1.6 s) and pushed in `Engine.pushMood` through a new `Chai.setFill(k)`.
- **Model:** `chai_fur.emissiveIntensity = 0.16 × k`. The emissive was already C's per-vertex self-fill (`selfFill`: emissive white × `vColor`), so the fill adds the fur's own colour and the hue stays Chai's. `chai_gloss` (eyes, nose), the mug and the yuzu are not touched.
- **Procedural Chai** (first frame and fallback): fur 0.16 × k and snout 0.14 × k, so a night swap-in does not jump.
- **Both tiers hold.** The fur and snout are `uniqueMat` / `kit.own(c, true)`, and `Kit.liteify` skips uniques (`kit.ts:329`). The references `setFill` writes to are therefore the materials drawn on the low tier, at load and after a runtime step-down (`setQuality('low')` → `liteify`).
- **The swap-in gets the fill.** `useChaiModel` calls `pushMood()` after the swap, so a model that loads at night starts at 0.512, not at the day 0.16.
- **Cost.** One existing uniform's value: no define, program, texture, geometry or draw-call change, and `customProgramCacheKey` is unchanged.
- **Day by construction.** k = 1 gives exactly the old 0.16 / 0.14.
- **Which pose people see.** In the Nook, Chai is `awake` at every hour (`Engine.ts:772`), so open eyes are the right feature to measure. The focus stage's `window` mode never shows the model (`NookScene.tsx:36`). The unlock close-up frames the record player.
- **Tests:**
  - `palette.test` asserts day/morning = 1 and dusk ≤ night, both > 1;
  - `chaiModel.test` asserts `setFill` reaches only the fur on both tiers and returns to 0.16;
  - `chai3d.spec` reads 0.16 / 0.448 / 0.512 by hour through the URL, with every other Chai material at emissive 0.

  Nothing existing is weakened.

### Opened at full size
- **References:** Vibei's sign-off renders `W2R2/VIBEI-SIGNOFF-C/model-awake-day.png` and `model-awake-night.png`.
- **The maker's close-up faces** (1132², 1440×900@2):
  - `N/measure/BEFORE/1440x900-light-high-{day,dusk,night}-face.png`;
  - `N/tune/1440x900-light-high-{dusk-k2.8,night-k3.2}.png`;
  - `N/tune/1440x900-light-low-night-k3.2.png`.
- **Mine:** §3.

### Pixel checks of the maker's frames (`pngdiff.py`, decoded RGB)
- Day close-up `measure/BEFORE` vs `measure/AFTER` `1440x900-light-high-day-face.png`: **0 px differ**.
- `tune/1440x900-light-high-night-k1.png` (trial build, fill forced to 1) vs `measure/BEFORE/…-night-face.png`: **0 px differ**. The tuned AFTER frames come from the same pipeline as BEFORE, so the build difference is the fill alone.
- **The 253-px day Nook difference** (`day-nook-diff-where.json`) is three clusters at canvas (1567–1663, 902–941), the record player's label. Its cause is real: `items.ts:515` turns the platter by `dt × 3.5` even under reduced motion. Chai's region is identical.

## 2. Separation: the maker's numbers

From `N/measure/BEFORE/sep-BEFORE-1440-light.json` and `N/tune/sep-TUNE.json`, which I re-read. The close view is 1440×900@2, light theme. Each cell is the WCAG contrast ratio (fur ring vs feature), then ΔL*.

| Hour | Eyes, base | Eyes, after | Nose, base | Nose, after | Fur ring L*, base → after |
|---|---|---|---|---|---|
| **day** (reference) | **4.58 / 48.1** | = | **3.32 / 37.6** | = | 51.3 |
| dusk | 2.26 / 30.0 | 3.85 / 44.4 | 1.93 / 25.4 | 3.14 / 38.7 | 30.5 → 44.9 |
| night | 2.01 / 26.8 | 3.99 / 45.4 | 1.79 / 23.3 | 3.27 / 40.0 | 27.1 → 45.8 |

High and low tier match to 0.01. The eyes themselves are near black at every hour (feature L* 3.2 day, 0.3–0.5 dusk and night), so the whole remaining eye gap is the fur ring: L* 45.8 at night against 51.3 by day. The tuning curve is near linear. Equal eye ratios would need about k 3.6 at dusk and 3.8 at night, with the ring at about L* 49–50.

## 3. My own frames and numbers (URL path, no fill injection)

(pending: filled in when `chain.sh` completes)

## 4. "As clearly as in the day renders": my judgement, and what is Vibei's

(pending §3)

## 5. Defects

(pending)

## 6. Residuals

(pending)

## 7. Lane R receipt

Pending: `review/LR/N/RECEIPT-LR-N.md`. Items I need from it before this verdict is final:
- order-swapped low-tier frame time (maker N-8, UNPROVEN);
- the day pixel diff beyond the 1440 light high close view (low tier, dark, phone);
- the unlock card at day, evening and night (PRESERVE 8);
- the suites: tsc, vitest, `chai3d` + `w2-room` twice, the scene unit tests, and whatever the full chromium run gives.
