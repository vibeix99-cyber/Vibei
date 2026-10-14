# CHECKER W3R1 · Maker N: Chai's night readability

**Verdict: APPROVE** `pe/w3-chai-night@4168428` (code `121f011`, `43b10f2`, `76144b4`; kettle/src `9699774`), as gated in trial `46f33e2`. Lane R's receipt is in and checked (§7). Any change to the branch after this invalidates it.

**One call is Vibei's, not mine (§4): the eye contrast is vb's call** (`VB-DECISIONS-RESUME.md` §1).
- **What the maker shipped.** The eyes stop at 84–88 % of the day's contrast ratio (93–95 % of its lightness difference). The nose matches the day.
- **What I judge.** That meets "as clearly as in the day renders" in substance. I do not reject for it.
- **What Vibei decides.** Whether Chai should go all the way to the day ratio at night, with the fur at about day brightness in a night room, is art direction. That is Vibei's choice. It is two numbers in `palette.ts`.
- **For Vibei:** the dark-theme evening/night phone pairs are listed at the end of §4.

*LEAD-5 note (2026-10-14, after LEAD-4's cutoff):* I added the words "vb's call" and the "For Vibei" pointer in §4, and my reading of Lane R's dark-theme nose numbers (§4, last part). LEAD-4's verdict, findings and classifications are otherwise unchanged.

| | |
|---|---|
| Lead checker | LEAD-4. I implemented none of this work |
| Under review | `pe/w3-chai-night@4168428`. `git rev-parse 4168428:kettle/src` = `969977475e94…` (checked) |
| Trial | `46f33e2` = integration `1af69d7` (src `5cd9a44`) + `4168428`; worktree `/home/user/wt/w5tr-n`; src `9699774`. `git diff 4d36939 46f33e2 -- kettle/src kettle/tests kettle/public kettle/package.json` = N's 7 files only. Dev :5524 (all my trial runs), preview :5534 (Lane R) |
| Base / control | `4d36939` (src `5cd9a44`); worktree `/home/user/wt/w4-final`; dev :5478 (all my base runs), preview :5488 (Lane R) |
| Packet | `/home/user/wt/w5n/kettle/review/product-excellence/contracts/W3R1/N-READY-FOR-REVIEW.md`; evidence `…/W3R1/N/` |
| Lane R | `review/LR/N/RECEIPT-LR-N.md` (raw evidence beside it) |
| My evidence | `contracts/W3R1/review/LEAD/N/`:<br>• `lead-n.mjs` (probe), `chain.sh` (slot-gated runner);<br>• `pngdiff.py` and `pairs.py` (stdlib pixel compare and crops);<br>• `shots/{BASE,TRIAL,WHATIF}/` (frames + `lead-*.json`), `pairs/` (base-left / trial-right crops), `runs/*.log` |

## 1. What I did

### Read
- `PLAN.md`, the four briefs, the preserve list, `GATE.md`, the house style (`CHECKER-W2R3-T2.md`), and the C background (`CHECKER-W2R2-C.md` §3 item 3, `VIBEI-SIGNOFF-C/`).
- The packet in full, and the full src/tests diff `4d36939..4168428` (7 files, +113 −2).
- Lane R's receipt in full.
- **Ownership:** every changed file is in N's set (`src/scene/engine/{Engine,chai,chaiModel,palette}.ts` + tests, `tests/chai3d.spec.ts`). No change to `art-src/chai/**`, `public/**` (`chai.glb` sha `b401bc6c…` on both previews, Lane R §0), palette tokens, lights or exposure.

### The code, judged against the brief
- **One number per hour.** `Mood.chaiFill` (morning 1, day 1, dusk 2.8, night 3.2) is blended with the rest of the mood (`lerpMood`, 1.6 s) and pushed in `Engine.pushMood` through a new `Chai.setFill(k)`.
- **Model:** `chai_fur.emissiveIntensity = 0.16 × k`. The emissive was already C's per-vertex self-fill (`selfFill`: emissive white × `vColor`), so the fill adds the fur's own colour and the hue stays Chai's. `chai_gloss` (eyes, nose), the mug and the yuzu are not touched.
- **Procedural Chai** (first frame and fallback): fur 0.16 × k and snout 0.14 × k, so a night swap-in does not jump.
- **Both tiers hold.** The fur and snout are `uniqueMat` / `kit.own(c, true)`, and `Kit.liteify` skips uniques (`kit.ts:329`). The materials `setFill` writes to are the ones drawn on the low tier, at load and after a runtime step-down (`setQuality('low')` → `liteify`).
- **The swap-in gets the fill.** `useChaiModel` calls `pushMood()` after the swap, so a model that loads at night starts at 0.512, not at the day 0.16. Read back through the URL on both tiers: §3, Lane R §2 and §6.
- **Cost.** One existing uniform's value: no define, program, texture, geometry or draw-call change, and `customProgramCacheKey` is unchanged. The fragment work is the same arithmetic on a different value. With the loop stopped, `frame()` does not call `pushMood` (only during a mood blend).
- **Day by construction.** k = 1 gives exactly the old 0.16 / 0.14.
- **Which pose people see.** In the Nook, Chai is `awake` at every hour (`Engine.ts:772`), so open eyes are the right feature to measure. The focus stage's `window` mode never shows the model (`NookScene.tsx:36`). The unlock close-up frames the record player.
- **Dark theme.** Auto time under the dark theme is always dusk or night (`palette.ts` `autoTime`), so dark-theme users see the change all day, at `DARK_DIM` 0.86 exposure.
- **Tests:**
  - `palette.test` asserts day/morning = 1 and dusk ≤ night, both > 1;
  - `chaiModel.test` asserts `setFill` reaches only the fur on both tiers and returns to 0.16, and the procedural fur/snout scaling;
  - `chai3d.spec` reads 0.16 / 0.448 / 0.512 by hour through the URL, with every other Chai material at emissive 0.

  Nothing existing is weakened.

### Opened at full size
- **References:** Vibei's sign-off renders `W2R2/VIBEI-SIGNOFF-C/model-awake-day.png` and `model-awake-night.png`.
- **The maker's close-ups** (1132², 1440×900@2):
  - `N/measure/BEFORE/1440x900-light-high-{day,dusk,night}-face.png`;
  - `N/tune/1440x900-light-high-{dusk-k2.8,night-k3.2}.png`;
  - `N/tune/1440x900-light-low-{dusk-k2.8,night-k3.2}.png`.
- **Mine, all in `review/LEAD/N/`:**
  - the phone pairs `pairs/390x844-{light-default-{day,dusk,night},dark-default-{dusk,night}}-BASE_TRIAL{,-x2}.png`;
  - the full phone Nook frames `shots/{BASE,TRIAL}/390x844-*-nook.png`;
  - `shots/TRIAL/1440x900-light-high-night-nook.png` (the Nook as people see it at 1440);
  - `shots/TRIAL/1440x900-dark-high-night-close.png`;
  - the base 1440 frames and the what-if frames (§4).

### Pixel checks (`pngdiff.py`, decoded RGB; mine unless stated)
| Pair | Differing px | Note |
|---|---|---|
| Maker's day close-up, `measure/BEFORE` vs `measure/AFTER` | **0** | |
| Maker's `tune/…-night-k1.png` (trial build, fill forced to 1) vs `measure/BEFORE/…-night-face.png` | **0** | The tuned frames come from the same pipeline as BEFORE; the build difference is the fill alone |
| Mine, 1440×900 light high day: close view / face crop | **0 / 0** | |
| Mine, 1440×900 light high day: whole Nook screenshot | 219, all in (2253–2349, 1156–1195) | The record player. `items.ts:515` turns the platter by real `dt` even under reduced motion. Lane R's dt = 0 path shows 0 px there (Lane R §3) |
| Mine, 390×844 light day: face crop | **0** | |
| Mine, 390×844 light day: whole page screenshot | 90,142, all but a handful ±1 level, in the card backdrop around the canvas and the page UI below it; the record player (max 70) | **4 px** in a 300×300 box around Chai, ±1, at the box's rug corner. Lane R: canvas buffer hashes equal at 390 day; same ±1 page noise (its §3). N changes no DOM or CSS |

## 2. Separation: three independent measurements agree

**Who measured what:**
- **Maker:** id-frame masks; AFTER via `setFill` injection.
- **Lane R:** hide-diff masks; preview builds; the URL path.
- **Me:** the maker's `MEASURE` function, which I read; dev builds; the URL path, no injection.

All three agree to ±0.02 in ratio. Each cell is the WCAG contrast ratio (fur ring vs feature), then ΔL*.

**1440×900@2, light theme, the model.** The close view is C's art camera; the Nook view gives the same ratios to ±0.02.

| Hour | Eyes, base | Eyes, trial | Nose, base | Nose, trial | Fur ring L*, base → trial |
|---|---|---|---|---|---|
| **day** (reference) | **4.58 / 48.1** | = (0 px diff) | **3.32 / 37.6** | = | 51.3 |
| dusk | 2.26 / 30.0 | **3.85 / 44.4** | 1.93 / 25.4 | **3.14 / 38.7** | 30.5 → 44.9 |
| night | 2.01 / 26.8 | **3.99 / 45.4** | 1.79 / 23.3 | **3.27 / 40.0** | 27.1 → 45.8 |

High and low tier match to 0.01 (maker, Lane R, mine). Mine (`shots/*/lead-*.json`):
- trial 1440 high light day / dusk / night, eyes 4.58 / 3.85 / 3.99, nose 3.32 / 3.14 / 3.27;
- base day 4.58 / 3.32.

**Share of the same theme's day.**

| Theme | Eyes, dusk | Eyes, night | Nose, dusk | Nose, night |
|---|---|---|---|---|
| Light | 49 % → 84 % | 44 % → 87 % | 58 % → 95 % | 54 % → 98 % |
| Dark (390 low, Lane R; 1440 dark trial high and low, mine) | 52 % → 84 % | 47 % → 88 % | 60 % → 93 % | 55 % → 97 % |

**Dark-theme values** (trial; same-theme day: eyes 4.01, nose 3.01):

| Hour | Eyes | Nose |
|---|---|---|
| Dusk | 3.39 | 2.80 |
| Night | 3.51 | 2.91 |

**Phone (390×844, low tier, the Nook as seen).** Chai is about 39 CSS px tall and the low tier draws into a 442×395 buffer, so after erosion the eyes have no pixels left and only the nose is measurable. Mine and Lane R's agree:

| Theme | Nose, dusk (base → trial) | Nose, night (base → trial) |
|---|---|---|
| Light | 1.93 → 3.13 | 1.79 → 3.27 |
| Dark | 1.80 → 2.80 | 1.67 → 2.91 |

**Where the remaining eye gap comes from.** The eyes are near black at every hour (feature L* 3.2 by day, 0.3–0.5 at dusk and night), so the whole gap is the fur ring: L* 45.8 at night against 51.3 by day. The maker's tuning curve (`N/tune/sep-TUNE.json`) is near linear. Equal eye ratios would need about k 3.6 at dusk and 3.8 at night, with the ring at about L* 49–50.

## 3. What I saw (full size)

- **Close view, 1440, night** (`N/measure/BEFORE/…-night-face.png` → `N/tune/…-night-k3.2.png`; low tier `…-low-night-k3.2.png`; dark `LEAD/N/shots/TRIAL/1440x900-dark-high-night-close.png`):
  - **Base:** a dark brown face where the eyes and the nose's lower edge sink into the fur.
  - **Trial:** black eyes and a black nose with crisp edges on a mid-tan face plate. The mouth, the three brow marks, the inner ears and the paws also read again. The body keeps its lamp modelling (darker flanks, lit front), so it does not read as a flat cut-out.
  - **Colour:** the hue moves back toward the day fur (night ring `#653416` → `#9a5e31`; day `#ae6d34`). The blush lifts with it and stays pink.
- **Dusk** (`…-dusk-face.png` → `…-dusk-k2.8.png`): the same, slightly warmer.
- **The Nook as people see it, 1440 night** (`LEAD/N/shots/TRIAL/1440x900-light-high-night-nook.png`): Chai (about 110 CSS px) sits in the lamp and stove light. The face reads at a glance, and Chai looks lit by the room, not pasted in.
- **Phone, 390×844** (`LEAD/N/pairs/390x844-*-BASE_TRIAL-x2.png`; left base, right trial):
  - **Night, light and dark:** on the base the eyes nearly merge with the fur. On the trial the two eyes and the nose are distinct dark marks, close to how they read in the day pair.
  - **Day:** identical.
  - **Side effect:** at this size the trial's night Chai reads a shade paler and flatter than the warm cushion and rug around it. It is still shaded, and it is the change Vibei asked for.
- **Day, everywhere:** the face is unchanged (0 px).

## 4. "As clearly as in the day renders": my judgement, and what is Vibei's

**My judgement: met in substance.**
- **The nose meets it outright:** 94–99 % of the day's ratio, and above the day's ΔL*.
- **The eyes reach 84–88 % of the day's WCAG ratio and 93–95 % of its ΔL*** (ΔL* is the perceptual measure).
- **At full size, side by side** with the day close-up and Vibei's `model-awake-day.png`, the night trial's eyes and nose separate from the fur as clearly to my eye. What differs is that the whole face sits about 5 L* lower, which is the night room itself.
- **Before:** the separation was about half the day's (44–58 %), under 3:1 for both features. That was Vibei's complaint, and it is gone.
- **Not a defect.** The 84–88 % is a deliberate stopping point, documented in the packet (N-3) and in the code comment. It is not a shortfall the maker could not close.

**What belongs to Vibei: this is vb's call** (art direction, not a defect; `VB-DECISIONS-RESUME.md` §1 holds it for Vibei's own visual check):
- **The question:** does Chai stop at k 3.2 / 2.8, keeping the lamp's modelling at slightly less than day eye contrast? Or go to full eye parity, k ≈ 3.8 at night and 3.6 at dusk, with the fur near day brightness in a night room?
- **The cost of changing it:** two numbers in `palette.ts` (`MOODS.dusk.chaiFill`, `MOODS.night.chaiFill`) and the `chai3d.spec` expectation.
- **Frames to compare,** all close view, 1440×900@2, light, high tier:
  - day: `N/measure/BEFORE/1440x900-light-high-day-face.png`;
  - shipped night: `N/tune/1440x900-light-high-night-k3.2.png`;
  - parity what-if: `LEAD/N/shots/WHATIF/1440x900-light-high-night-k3.8-close.png` (dusk: `…-dusk-k3.6-close.png`). These frames are mine, taken on the trial with the fill forced by `setFill`. They are not a shipped value.

Two related things for Vibei to look at while deciding (§6, O-1 and O-2):
- the yuzu now reads darker than Chai's head at night;
- in the dark theme, which is dusk or night all day under auto time, the nose stays just under 3:1.

**For Vibei: the dark-theme evening/night phone pairs** (390×844, base left, trial right; paths under `contracts/W3R1/`):
- the Nook as seen, default tier: `review/LEAD/N/pairs/390x844-dark-default-dusk-BASE_TRIAL.png` and `review/LEAD/N/pairs/390x844-dark-default-night-BASE_TRIAL.png` (2× nearest: the same names with `-x2`);
- Chai's face close up, low tier: `review/LR/N/captures/montage-face/390x844-dark-low-dusk-close-face_BASE-left_TRIAL-right.png` and `review/LR/N/captures/montage-face/390x844-dark-low-night-close-face_BASE-left_TRIAL-right.png`.

I opened all four at full size. On the base, the eyes and the nose's lower edge sink into a dark brown face. On the trial they are distinct black marks on a mid-tan face, and the mouth and brow marks read again. The trial Chai also reads paler and flatter against the warm cushion and rug, which is the trade-off Vibei is weighing.

**LEAD-5 on Lane R's dark-theme phone nose (2.80 dusk, 2.91 night, under 3:1): it does not change the verdict.** It stays under vb's call, for three reasons:
1. **The bar the brief sets is relative.** "As clearly as in the day renders" means the same theme's day. The dark theme's own day nose is 3.01 under the approved `DARK_DIM` 0.86, so 2.80 and 2.91 are 93 % and 97 % of it. That is the same share as in the light theme.
2. **No absolute contrast rule binds a feature of the mascot art.** WCAG 1.4.11's 3:1 is for UI controls and graphics a person needs to understand content. Chai's nose is neither; nothing is conveyed only through it.
3. **The residual rule.** On the base the dark nose was 1.80 / 1.67. The trial raises it by about 1.1 to 1.2. It is improved, not introduced or worsened, so it cannot BLOCK.

Pushing dark to 3:1 would need a dark-only fill (a new per-theme value). That would make Chai paler still in a frame where he already reads paler than the room. That is art direction, so it is vb's call, and the item stays O-2 (ACCEPTED, for Vibei).

## 5. Defects

**None.** Nothing is introduced or worsened by this change in a way that is a defect, so nothing BLOCKS. The narrow transient-artifact exception is not needed for any item.

## 6. Residuals (rule: BLOCKS = introduced or worsened by this change; FOLLOW-UP = present on the base and not worse, or ruled so by Vibei; ACCEPTED = not a defect)

| # | Item | My check | Class | Owner |
|---|---|---|---|---|
| N-3 | Eyes at 84–88 % of the day's ratio, by design | §2, §4 | **ACCEPTED** (meets the request in substance). **vb's call** whether to go to parity (`VB-DECISIONS-RESUME.md` §1) | Vibei |
| O-1 | **The yuzu is not lifted, so at night it now reads darker than Chai's head.** Sampled L* on the close view:<br>• day: yuzu 61.9, head fur 60.2;<br>• night base: yuzu 23.4, head fur 29.8;<br>• night trial: yuzu 23.4, head fur 47.8.<br>The yuzu's colour and shape are as approved and drawn exactly as on the base. Its silhouette reads more strongly against the lighter head. The brief protects day colours (identical). Visible in `N/tune/…-night-k3.2.png` | — | **ACCEPTED** (not a defect). For Vibei's eye. If wanted, a small follow-up gives the yuzu the same per-hour fill (it is a separate, non-unique material, so on the low tier it would need its own unique copy) | Vibei / scene |
| O-2 | **Dark theme: the nose stays under 3:1** (dusk 2.80, night 2.91; eyes 3.39 / 3.51). The dark theme's own day is 3.01 / 4.01 under `DARK_DIM` 0.86. As a share of the same theme's day it matches light (eyes 84–88 %, nose 93–97 %), and the base was 1.67–1.80. Dark-theme users see dusk or night all day (`autoTime`) | Lane R §2; mine at 390 and 1440 | **ACCEPTED** (not a defect; the dim is the approved dark theme). Under vb's call if dark should get its own fill (LEAD-5's reasoning in §4) | Vibei |
| N-8 | **Low-tier frame time.** Counters identical in all 18 runs (maker 6, Lane R 12): calls 110, triangles 75,007, geometries 113, textures 10, programs 23, heap 11.1–11.3 MB.<br>Paired same-round differences, trial − base: maker (base first) +10, +8, +38; Lane R A (base first) −35, +22, +67; Lane R B (trial first) −20, +65, +8.<br>Within-build spread is up to 57 ms. Load ran 10–18 on 4 CPUs | Raw JSON checked (`LR/N/perf/*.json`, `N/perf/*.json`) | **ACCEPTED.** No cost by construction (one uniform's value; same program, draw calls and fragment arithmetic), and no consistent sign across orders. An equal-load or base-vs-base timing control was not run (E-1) | — |
| C-7 | `w2-room.spec.ts:144` "3D failure (WebGL context lost)" `page.screenshot` timeout under load, run 1 only. Lane R's and the maker's run 1 both fail it; both run 2s pass, 17/17 | Pre-existing (CHECKER-W2R2-C §6: 1/3 on both builds). Not in the fill's path | **FOLLOW-UP** (pre-existing) | Scene tests |
| N-5 | Record-player platter angle accumulates real `dt` even under reduced motion (`items.ts:515`), so probes that stop the loop after it ran are not byte-stable there | Seen in mine (219 px) and the maker's (253 px); absent on Lane R's dt = 0 path | **ACCEPTED** (probe artefact, pre-existing) | — |
| O-3 | ±1-level page-screenshot noise outside the canvas: 390 day (Lane R and mine; canvas buffers equal), and Lane R's 1440 low night 5.4 % outside Chai's box | N changes no DOM or CSS. The canvas buffers at day are identical. ±1 level is invisible. No base-vs-base control | **ACCEPTED** (not a defect) | — |
| O-4 | Packet §5 lists `N/unlock/{BEFORE,AFTER}/…` captures that do not exist (§8 N-2 says they were not taken) | Lane R covered the unlock (§7) | **ACCEPTED** (packet slip) | — |
| E-1 | **Evidence gaps,** not defects:<br>• high tier at phone widths;<br>• 375×667 and 844×390 base-vs-trial (trial-only numbers in Lane R);<br>• 200 % text (N changes no layout; the scene's content does not depend on it);<br>• the procedural Chai's numbers (unit-tested; it shows only for the first frames or on fallback);<br>• an equal-load timing control;<br>• the full chromium suite (only the scene specs ran, twice). | — | Noted. The full suite runs in the final regression on the merged tree | Final regression |

## 7. Lane R receipt (`review/LR/N/RECEIPT-LR-N.md`), and my checks of it

**Read in full.** I checked each fact I rely on against its raw files:
- **Separation** (§2 of the receipt): its own hide-diff masks, previews, the URL path. Base → trial eyes dusk 2.26 → 3.85, night 2.01 → 3.99; nose 1.93 → 3.14, 1.79 → 3.27; day 4.58 / 4.55 and 3.34 / 3.31 unchanged. The fur fill reads 0.16 / 0.448 / 0.512 by hour on the trial and 0.16 at every hour on the base. Equal to the maker's and mine.
- **Day unchanged:** 0 differing pixels in every day drawing-buffer frame (1440 high/low close, 1440 low Nook, 390 light/dark Nook and close) and in the 1440 low full-viewport screenshots. I checked the hashes: base = trial for every day frame in `sep/{BASE,TRIAL}/lr-*.json`; dusk and night differ.
- **Unlock card (PRESERVE 8):**
  - **Chai:** 0 Chai pixels in frame (head projected at |x| 9–12, far outside the view).
  - **Canvas:** the card's drawing buffer is identical base vs trial, 4 of 4 pairs (390@2 and 1440@1, day and night; FNV equal in `unlock/*/lru-*.json`).
  - **Which Chai:** the card engine holds the procedural Chai on both builds.
- **Performance:** both orders run; counters identical in 12/12 (checked in `perf/*.json`: calls 110, triangles 75,007, quality low, Chai model, fill 0.16 / 0.512). Timing in §6 (N-8).
- **Suites** (`runs/`): tsc 0; vitest 30 files 293/293; `src/scene` 17/17; `chai3d` + `w2-room` 16/17 (C-7), then 17/17 including the new fur-fill test.
- **Servers:** the served files equal the committed blobs on :5524 and :5478, and the :5534 bundle holds the four `chaiFill` values.

**What it leaves open** (receipt §9, also E-1):
- the high tier at 390 and dark at 1440 (dark at 1440 is covered by mine, §2);
- 375×667 / 844×390 base;
- 200 % text;
- the procedural numbers;
- a base-vs-base control.

None of these bears on a defect.

## 8. BEFORE / AFTER for Vibei (full size)

**Close view (C's art camera), 1440×900@2, light, high tier** (`/home/user/wt/w5n/kettle/review/product-excellence/contracts/W3R1/N/`):

| Hour | BEFORE | AFTER |
|---|---|---|
| Night | `measure/BEFORE/1440x900-light-high-night-face.png` | `tune/1440x900-light-high-night-k3.2.png` |
| Dusk | `measure/BEFORE/1440x900-light-high-dusk-face.png` | `tune/1440x900-light-high-dusk-k2.8.png` |
| Day | `measure/BEFORE/1440x900-light-high-day-face.png` | `measure/AFTER/1440x900-light-high-day-face.png` (identical, 0 px) |

- **Day reference:** `contracts/W2R2/VIBEI-SIGNOFF-C/model-awake-day.png`.
- **Low tier, night:** `tune/1440x900-light-low-night-k3.2.png`.

**Parity what-if (not shipped):** `contracts/W3R1/review/LEAD/N/shots/WHATIF/1440x900-light-high-night-k3.8-close.png` and `…-dusk-k3.6-close.png`.

**The Nook as people see it** (`contracts/W3R1/review/LEAD/N/`):
- **Phone, base-left / trial-right, 2× nearest:** `pairs/390x844-light-default-{day,dusk,night}-BASE_TRIAL-x2.png`, `pairs/390x844-dark-default-{dusk,night}-BASE_TRIAL-x2.png` (native: the same names without `-x2`).
- **Full phone frames:** `shots/{BASE,TRIAL}/390x844-{light,dark}-default-night-nook.png`.
- **1440:** `shots/{BASE,TRIAL}/1440x900-light-high-night-nook.png`; dark `shots/{BASE,TRIAL}/1440x900-dark-high-night-close.png`.
- **Lane R's montages:** `review/LR/N/captures/montage-face/`.


*Run logs:* `kettle/.gitignore:6` ignores `*.log`, so every `.log` cited here is committed as a `.log.txt` copy beside it (same name plus `.txt`).
