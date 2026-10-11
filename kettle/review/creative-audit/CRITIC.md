# Creative audit phase 2: independent critique

**Critic:** a separate agent instance (Claude Opus 5.5, `claude-opus-5-5`). I did not write the audit.
**Reviewed:** `PHASE2-REPORT.md` DRAFT 1, its `evidence/`, and the full-size captures in the scratchpad's `aud2/int/`.
**Window:** 2026-10-11, 11:46–12:20 UTC.
**Scope:** advice only. I edited no app code, art, tests or report text, committed nothing, and generated or spent
nothing. My only writes were this file and a read-only probe script, `kettle/.tmp/crit/probe.mjs` (git-ignored), with
its output in the scratchpad's `crit/`.

**Live checks:** 4 runs against the audited preview (:5323, app code `0d58c5e`). Every browser went through
`slots.py --lane CRIT --n 1`. The build was the same SwiftShader setup the audit used.

| Probe | Result |
|---|---|
| `warm390`: 390×844@3 light, 5 s on Home, then start a brew | Window still shown for **2.3 s**; 3D ready at 2.3 s; still removed at 2.7 s |
| `cold390`: the same, but start 0.2 s after load | 3D ready at **9.2 s**; still removed at 10.1 s |
| `summary375`: 375×667@2 light, whistle → summary, sampled at 1.5, 4.5, 10 and 20 s | **Room fully rendered** each time: canvas ready, opacity 1. See `crit/summary375-{1500,10000}.png` |
| `end1440rm`: 1440×900@2 dark, reduced motion, End sheet | "Keep brewing" rect stable over 2 s, and the click succeeded in **487 ms** |

**Verdict key:** UPHELD (stands as written), WEAKENED (real but overstated, mis-classified or mis-routed), REJECTED
(wrong, or not supported by the evidence).

---

## 1. C1 / S1: "The 3D Chai is off-model … DEFECT against PRESERVE 2"

**Claim:**
> "The 3D Chai is off-model … Cause [V]: `chai.ts:1–3` says it was 'built like the 2D mascot (`src/art/Mascot.tsx`)',
> the legacy vector mascot … The static SVG Chai is on-model, so the drift is 3D-only." Seen by: "Everyone who opens
> the Nook, and the Focus backdrop when 3D runs."

**Verdict: WEAKENED.** The visual drift is real. The classification, the cause, the reach and the route are all wrong
or incomplete.

**Evidence:**
- **The drift is real.**
  - `crops/chai-compare.png`: a cream snout, button eyes and no brows.
  - `src/scene/engine/chai.ts:28–30` sets W = H = 0.8. `chai.ts:57` adds a "broad soft pillow" snout in `C.muzzle`
    cream.
- **It is not a defect against PRESERVE 2.**
  - PRESERVE 2 protects the approved painted art and forbids *unapproved replacement art*. It does not certify, or
    condemn, renderings that are older than the approval.
  - Retuning `chai.ts` is itself new Chai art, so PRESERVE 2 requires an approval before it can ship, not after.
  - The 3D toy predates the approval: `chai.ts` was last changed in `e0d3cf6` on 2026-09-28; the approved sheet came in
    `eeff3a0` on 2026-10-03.
  - The rebuild was already a known, deferred follow-up:
    - `review/round-6-audit/REPORT.md:85`: "The 3D Chai is effectively another character … Later, rebuild the 3D Chai
      as a translation of the 2D body."
    - `review/round-6-mockups/chai-ab-brief.md:126`: "then the 3D Chai and icon or badge uses follow."
    - `docs/areas/scene.md`, Iteration 2: the team already rebuilt it once because it "read as a teddy bear".
- **The cause analysis contradicts itself.**
  - The "legacy vector mascot" is `Mascot.tsx` v2. Its header reads "capybara, not bear … **no cream patch**", and it
    landed in `b6577ad`.
  - That same vector is what the static room draws (`src/art/NookFallback.tsx:17, 294`, `ChaiArt`). The report calls
    that drawing *on-model*.
  - The 3D toy follows the **pre-v2** construction (`chai.ts:3`, "broad cream snout"). It was written in `faafba7`,
    7 minutes before the vector moved to v2, and was never brought along.
  - So the 3D Chai was not built from the legacy vector mascot. It was left behind by it.
- **It is never in the Focus backdrop.**
  - `src/scene/types.ts:3`: "`window` … the kettle and Chai are out of frame". The Focus stage uses
    `mode="window"` (`src/screens/focus/stage/Stage.tsx:86`).
  - The 1440 and 820 captures (`02b-focus-mid`) confirm this.
  - The 3D Chai therefore appears only on the Nook screen, a less-visited destination (the report itself says so under
    C).
- **One standard for every derived Chai.**
  - The static room's vector Chai is not the approved painted art either. `art-src/chai/README.md` even says of the
    vector, "No screen uses it", which `NookFallback` contradicts.
  - The report praises one derived rendering and calls the other a DEFECT.
- **The route conflicts with earlier decisions and drops an option.**
  - Round 6 picked Blender for exactly this job and listed "Hand-coding organic meshes in three.js" under **Not this**
    (`review/round-6-audit/REPORT.md:122`).
  - Phase 2 recommends the procedural route first, with no reconciliation.
  - Phase 1 §6.1 also offered an approval-free option: "show the painted pose as a camera-facing card in the room". The
    approved masters `chai-sleep`, `chai-sipping` and `chai-happy` already exist for the `nap`, `sip` and `awake`
    poses. Phase 2 drops this option silently.

**Required change to the report:**
- Re-type C1 as **brand-consistency debt (known round-6 follow-up)**, not "DEFECT against PRESERVE 2". Say that any
  retune needs approval *before* it ships, under PRESERVE 2.
- Correct the cause. The 3D toy follows a pre-v2 vector construction (cream snout) that `Mascot.tsx` abandoned in
  `b6577ad`. Cite `docs/areas/scene.md` Iteration 2 and round-6 A2.
- Change S1's "Seen by" to **the Nook screen only**. Re-rank it below the items that every brew shows.
- List three route options with their approval cost:
  - (a) a painted billboard from the approved masters: no new art;
  - (b) a procedural retune: new art, needs a turnaround approval;
  - (c) Blender, as round 6 chose.
- Explain why the report departs from round 6's Blender call.
- Note that the vector `ChaiArt` in the static room is also a derived, non-approved rendering, and flag the
  `art-src/chai/README.md` "No screen uses it" line as stale.

## 2. N1 / S2: "The 3D-off and loading backdrop drops every earned item … DEFECT against I09"

**Claim:**
> "The user's room 'un-builds' whenever 3D is off, loading (cold start of every session) or unsupported." Seen by:
> "Every brew start until 3D loads; always with 3D off." Route: "about 10 visible items × 4 times = 40 small WebPs …
> ≤ 300 KB total."

**Verdict: WEAKENED.** The gap is real for people who turn 3D off. The frequency, the contract mapping and the asset
route are overstated or unsound.

**Evidence:**
- **The gap is real.** `crops/backdrop-3d-vs-still.png` is fair, and `src/scene/Fallback.tsx:23–28` documents the base
  room.
- **Frequency:**
  - The default 3D setting is `'auto'` (`src/state/settings.ts:91`). The tier becomes `off` only when the user chooses
    it or WebGL is missing (`src/scene/index.tsx:30`); `resolveTier` never chooses `off` itself
    (`src/scene/resolve.ts:96–107`).
  - Home pre-warms the engine (`src/screens/home/HomeScreen.tsx:29`, `usePrewarmNook` in `scene/index.tsx:43–84`,
    `scene/warm.ts`). The next Nook adopts it and only waits `SETTLE_MS` = 650 ms plus a 420 ms fade
    (`scene/warm.ts:19`, `scene/NookScene.tsx:12, 66–68`).
  - Live, on SwiftShader (the worst case), the still showed for **2.3 s** after a normal Home dwell and **9.2 s** on a
    cold start. On a real GPU the floor is about 1.1 s.
  - The backdrop is blurred and desaturated, with an overlay on top (`Stage.module.css:46–62`).
  - So for 3D-on users this is a 1–3 s fade-in of items at each brew start, not the room "un-building". It is
    permanent only for 3D-off and no-WebGL users, and that share is unknown and unmeasurable (PRESERVE 11).
  - The audit's own data agrees: the still was present at 6 s in only 1 of the 3D-on runs (`390x844-light.json`
    `02-focus`).
- **I09 mapping:**
  - I09's observable success is about the **Nook** outcome: "Loading or failure retains the recognizable drawing and
    active controls" (`PRODUCT_EXCELLENCE_PLAN.md` I09).
  - The static Nook screen does draw every earned item (`Fallback.tsx:46–60` passes `items` to `NookFallback`).
  - The Focus backdrop is atmosphere, not the I09 outcome surface. "DEFECT against I09" overreaches; it is a
    consistency or usability gap for 3D-off users.
- **The layer route is under-specified:**
  - **Lighting varies with weather as well as time.** Rain dims the window light by 35 % and adds overcast
    (`Engine.ts:742–763`). That makes 4 × 3 = 12 lighting states, as the 12 base stills already show
    (`render-window-stills.mjs:11–12`). So the count is about 120 layers, not 40, unless a mismatch is accepted.
  - **Items light and shade the room.** The fairy lights "cast a warm wash on the walls" (`docs/areas/scene.md`,
    Iteration 4), and items cast shadows on the high tier. Per-item alpha layers cannot add light spill or shadows onto
    the base still.
  - **Some items change the base room.** The kotatsu hides the table (`Engine.ts:699–700`). Check whether that is in
    the window frame.
  - **The budget and tolerance are guesses.** "≤ 300 KB" and "±4 px at 1250×1000" were not measured, and the backdrop
    is blurred by `1.05 × --u` anyway.
- **A cheaper route is missing.**
  - When the tier is `off` (the only case where the still is permanent), show a window-framed crop of the existing
    `NookFallback` SVG.
  - It already draws every earned item, is crisp at any DPR, and needs no new assets. The report calls it the
    best-looking room art.
  - No crossfade happens when 3D is off, so the framing match matters less.
  - Keep the base still as the brief loading frame.

**Required change to the report:**
- Re-type N1 as **USABILITY (3D-off users)**, medium.
- Replace "every brew start until 3D loads" with the measured 1–3 s fade-in (pre-warmed) and longer cold starts, citing
  the pre-warm code.
- Drop the "DEFECT against I09" wording, and say that the I09 Nook fallback already shows items.
- Rework §6.1 / R3 in three ways:
  - make the 12 lighting states explicit;
  - name light spill, shadows and the kotatsu as risks;
  - add the SVG-crop route as option 1 for 3D-off, with layers as option 2.
- Mark the budgets as estimates.

## 3. The recommendation: "Start with A, then B's two cheapest pieces"

**Claim:**
> "Why A first: it fixes what every user sees after every brew … needs no art approval and no spend … Makers, in
> parallel because their files don't overlap."

**Verdict: REJECTED as sequenced.** The direction is reasonable in spirit. The order, the scope and the readiness claim
do not hold.

**Evidence:**
- **A collides with Wave 1, which is still open.**
  - Round 7 was rejected and round 8 has not started, so Wave 1 is not closed (`product-excellence/STATUS.md`).
  - The round-7 trial diff (`git diff 0d58c5e b39202f -- kettle/src`) changes:
    - `screens/done/Summary.tsx`: the save-warning note sits right above the task and reward rows;
    - `screens/focus/FocusScreen.module.css` and `FocusScreen.tsx`;
    - `screens/home/StatusBar.tsx` (+87 lines), `Home.module.css` and `HomeScreen.tsx`.
  - Those are the exact files that R1, R2 and R4 edit. M-A and M-B don't overlap with each other, but both overlap with
    round 8.
  - The plan makes I07 depend on I01/I02, I08 on I04, and I10 on I04 (`PRODUCT_EXCELLENCE_PLAN.md`). A cannot start
    from `0d58c5e` until Wave 1 merges.
- **A sits outside the plan's P1 priorities.**
  - The plan names I06, I07, I08 and I09 as the P1 craft gaps (`PRODUCT_EXCELLENCE_PLAN.md:13`).
  - A's largest item, R2 (tablet and desktop composition), belongs to no contract. It is TASTE, and its evidence fails
    (§5).
  - B maps directly onto I06 and I09.
- **Two of A's quick fixes are I04's, and already adjudicated.**
  - **U1 / target-size:** I04 judged it scroll-dependent; it passes when scrolled clear. See
    `contracts/I04/CHECKER-r1.md:20` and `READY-FOR-REVIEW.md:51` ("WCAG 2.5.8 is about the target's own
    size/spacing").
  - **V-c:** 13 px labels would widen a status bar that round 7 measured as already over-full at 375 px ("needs
    360–368 px of a 359 px bar", StatusBar diff in `b39202f`).
- **Value per effort favours a smaller, contract-aligned first round.** The cheapest items with real evidence are:
  - U3, the purpose line (XS, I08);
  - N2, the false hint (XS, I09);
  - milestone-first reward order without hiding anything (S, I07; see §4);
  - the 3D-off backdrop via the SVG crop (S, I09; see §2).

  C stays deferred (agreed). C1's art decision and C2's generation are Vibei's actions, so they can be decided in
  parallel without maker time.

**Required change to the report:**
- **State the gate.** Recommend no Wave 2 maker work until Wave 1 closes (round 8 or a ruling), because R1, R2 and R4
  touch files the unmerged round-7 work also changes.
- **Re-cut the first round around the P1 contracts:** U3, N2, milestone ordering, and the 3D-off backdrop.
- **Move U1 and V-c to "for the I04 owner"**, noting the adjudication.
- **Move R2's tablet part out of round 1** (see §5).
- **Correct the claim** that the makers' files don't overlap: they don't overlap with each other, but they do overlap
  with Wave 1.

## 4. R1 / U2: "Summary hierarchy: ≤ 2 chips"

**Claim:**
> "No reward hierarchy … One primary line … Then at most two secondary chips chosen by salience (a milestone > goal met
> > recipes > level distance). The rest goes into the existing 'How your leaves added up'."

**Verdict: WEAKENED.** The real problem is narrow: a milestone can start below the footer. The proposed fix is
broader than that problem and pushes against K02 and I07.

**Evidence:**
- **Equal weight is the accepted calm design.**
  - K02 (`VISUAL_BENCHMARK_LIBRARY/README.md:51–61`): "Minutes-first heading … reward rows, persistent Tea time/Skip
    footer … **Preserve primary rest action above reward emphasis**."
  - Making rewards more prominent works against that accepted hierarchy.
- **There is already an order.**
  - `screens/done/summary.ts:59–90` puts leaves first and the goal second, then the streak, recipes and level.
  - On the unlock path, the K03 unlock card already leads with the accent treatment (`07e-unlock-10s.png`).
  - "Rewards don't lead" is true only of routine brews, which is deliberate.
- **The real gap is upheld.** In `390x844-light-celebrate/07e-unlock-10s.png`, "7 days warm, your best yet" sits half
  under the footer.
  - PRESERVE 7 and K01 say "do not infer unreachable from the initial cropped view", so this is a salience issue, not
    reach.
- **Hiding chips undercuts I07.**
  - "144 leaves to level 13" is the one visible link from leaves to level to Nook, which is what I07 exists to explain.
  - Moving it and "23 days warm" behind a disclosure on every brew reduces progression visibility.
  - That doesn't break PRESERVE 9's arithmetic. It does change K02's accepted reward rows (PRESERVE 7: "routine
    task/reward rows remain compact"; compact is not the same as hidden).
- **The salience order is unevidenced.** Warm days are missing from it, and recipes are ranked above level.
- **The acceptance criterion has side effects.** "Any milestone visible without scrolling at 375×667" on the unlock
  path would mean shrinking the K03 unlock card, which PRESERVE 8 protects ("stable media space").

**Required change to the report:**
- Re-scope R1 to "**milestone pills first**": best yet, Tea Cozy earned, level reached and badges go before routine
  pills, optionally with the existing accent tone. Keep every pill visible.
- Drop "≤ 2 chips" and the move into the disclosure, or re-label it as an I07 experiment that needs the I15
  comprehension check.
- Add K03's stable media space to the acceptance criteria.
- Re-type U2 from "No reward hierarchy" to "Milestones aren't distinguished from routine pills".

## 5. R2 / V-a: "Tablet two-column"

**Claim:**
> "The tablet uses the phone column, stretched … about 35 % empty cream … The summary sheet has a large empty gap …
> use the desktop two-column composition … Summary: anchor the footer to the content."

**Verdict: REJECTED (tablet). WEAKENED (desktop: V-b is taste, low priority).**

**Evidence:**
- **The measurements don't support "dead bands".**
  - **Focus**, from `meta/820x1180-light.json` `02b-focus-mid` and the full-size `820x1180-light/02b-focus-mid.png`:
    - the controls end at y 1035, leaving 145 px below (**12.3 %**);
    - the stage-to-digits gap is about 124 px (**10.5 %**).
    - Both are under the report's own pass mark of "no empty band > 15 %", so **the acceptance criterion is already
      met**.
    - "About 35 %" adds the two bands together and rounds up.
  - **Summary:** the details toggle ends at y 879 and Tea time starts at 1056, including the footer padding. That gap
    is the expansion room for "How your leaves added up".
  - **Tea time:** the break ideas fill the space (Another idea at y 1127). `.ideas` turns on at `min-height: 900px`
    (`FocusScreen.module.css:271–276`).
- **The single column is deliberate.**
  - `FocusScreen.module.css:403–414` is a dedicated portrait-tablet rule: stage `min(56dvh, 120vw)` and a 640 px
    summary box.
  - The side-by-side layout requires `min-aspect-ratio: 5/4` (`:417`).
  - At 820 px portrait, two columns would leave each column about 400–450 px wide. The stage scales with
    min(width, height)/400 (`Stage.tsx` header), so it would shrink to phone size and the vertical bands would grow.
- **"Anchor the footer to the content" conflicts with PRESERVE 7 and K02** ("persistent Tea time/Skip footer"; "the
  footer keeps rest actions available").

**Required change to the report:**
- Remove the tablet two-column proposal and the footer anchoring.
- If anything stays, keep only the report's own alternative ("scale the readout block about 1.4×"), marked TASTE and
  low.
- Correct "about 35 %" to the measured 10.5 % and 12.3 %.
- Keep V-b as TASTE with low priority. The 1440 Focus (`1440x900-light/02b-focus-mid.png`) reads as an intentional
  zen layout.

## 6. N3c: "Fall back to the drawn room on weak GPUs"

**Claim:**
> "If a device drops to low **twice** in a session, switch to the static drawing with a crossfade, which is
> better-looking at zero GPU cost."

**Verdict: REJECTED as specified.**

**Evidence:**
- **The trigger cannot fire as written.**
  - The adaptive step only goes from high to low (`Engine.ts:888–893`), and nothing raises the tier again.
  - The parked engine keeps its dropped quality and is re-adopted (`warm.ts`, `stash` / `takeWarm`).
  - Software and weak-mobile devices **start** on low (`resolve.ts:102–106`) and never "drop". So the devices the
    audit's captures represent would never trigger it.
- **It conflicts with PRESERVE 8.**
  - If the switch makes the effective tier `off`, the unlock card keeps the `ItemGlyph` drawing forever
    (`Summary.tsx:313–327`).
  - The accepted "**then** the actual object close-up" would never arrive.
- **It touches PRESERVE 10 and 6.** 3D is a user preference (`auto`, `high`, `low`, `off`). Silently redefining
  `auto` changes a documented preference's semantics without anything showing in Settings.
- **It removes working interaction.** Drag and tap (N4) would go, and the N2 hint problem would grow.
- **"Better-looking" rests on SwiftShader captures only.** It is [I].

**Required change to the report:**
- Re-specify N3c:
  - Nook screen only;
  - apply it when the effective tier is low, at start or after a drop;
  - **offer**, not force, the drawn room;
  - never touch the unlock close-up;
  - make the effective mode visible in Settings.
- Mark it [I] and gate it on real-device evidence.
- Add the PRESERVE 8 and 10 analysis to §10, decision 4.

## 7. Evidence integrity

**Numeric spot checks (meta JSON):**

| Claim | Result |
|---|---|
| Stage poses upscale 1.09 / 0.70 / 1.19 / 1.19 | **UPHELD** (every run) |
| Home hero 0.67 / 0.45 / 0.45 / 0.61 | **UPHELD** |
| 5 chips, all 38 px, `rgb(252,244,233)`, weight 700 | **UPHELD** (`390x844-light.json` `07-summary.chips`) |
| Brew length y 657–705 vs dock 676–736 (390 dark) | **UPHELD** |
| Landscape: Brew length 279–327 vs dock 290–350 | **UPHELD** |
| Status labels 11 px; greeting 30 px (phone) / 36 px (desktop) | **UPHELD** (tablet is 33 px, unreported) |
| Canvas 1.25 px per CSS px in every run | **UPHELD** numerically (all 12 runs with a canvas) |
| Window still 0.99 (390) / 1.40 (1440) | **UPHELD** |
| axe: 0 violations in 17 tablet states, 1 at 390 | **UPHELD** numerically |
| Tablet "about 35 % empty cream" | **REJECTED** (10.5 % and 12.3 %; see §5) |

**Visual spot checks (full-size captures):**
- `crops/chai-compare.png` (C1): **UPHELD.**
- `crops/backdrop-3d-vs-still.png` (N1): **UPHELD.**
- `390x844-light-celebrate/07e-unlock-10s.png` (milestone under the footer): **UPHELD.**
- `375x667-light/07a-summary-settled.png`, the "empty backdrop" (§4.7, used in S3): **REJECTED.**
  - It did not reproduce live: the room was rendered at 1.5, 4.5, 10 and 20 s (`crit/summary375-*.png`).
  - "Framing at short heights" is also ruled out: the canvas is 375×223 in both Focus and the summary, and Focus frames
    fine.
  - It is either a capture artefact under load, or an intermittent blank paused window canvas after the
    whistle → summary hand-off.

**Overstated or mis-stated:**
- **The adaptive drop.** §0 says the engine "drops to the low tier under software rendering", and §4.7 says "It does
  show the adaptive drop works". Both are wrong.
  - SwiftShader is detected as software GL, so the tier starts low (`resolve.ts:104–105`).
  - The adaptive path (`Engine.ts:888–893`) was never exercised.
  - N3's "visible step" is therefore code-inferred: mark it [I].
- **The 1440 runs, reported as "rerun one at a time".**
  - At 11:50 UTC, `1440x900@2:dark` was still running (no `meta.json`), `844x390@3:dark:land` had not started, and
    `rerun.sh` was still waiting (`aud2/int/logs/worker.log`).
  - `1440x900-light-static` and `1440x900-dark-rm` stop at the End sheet with FATAL entries (`meta/*.json` `errors`).
  - So, as drafted, there is no desktop static Nook or summary, no desktop reduced-motion summary, and no landscape
    dark.
  - The FATALs were load artefacts: live, the click succeeded in 487 ms.
  - The config table still lists all of these as walked.
  - The reruns are also at DPR 1 (`rerun.sh`), not the DPR 2 in the table.
- **"0 page errors in every completed walk"** hides the fact that 6 of 14 runs did not complete.
- **Paths and index.**
  - "The evidence index", cited in §0 and §4.6, does not exist in `evidence/`.
  - `evidence/walk2.mjs` is really at `evidence/probes/walk2.mjs`.
  - Most of the cited sheets (`390x844-dark`, `375x667-*`, `1440x900-light`, `1440x900-dark`) are not in
    `evidence/sheets/`.
- **U1 counts as "1 axe violation"** without saying I04 already judged it scroll-dependent (§3).
- **Sound.** The report compares the whistle's *momentary* maximum (−14.9) with the ambiences' *integrated* level
  (−16/−17).
  - On a like-for-like short-term basis at full gain, the ambiences peak at −14.5 to −15.7 against the whistle's −21.8
    (`audio-check-output.txt`).
  - Report the whistle's margin in the `ambientPlusComplete` scenario, and state the ambience gain used. The app's
    default ambience volume is 0.6 (`e4a78be`).
- **Limits are under-reported.**
  - SwiftShader also distorts timing: the cold start is 9 s here.
  - The `page.clock` install may change idle and rAF behaviour in walk2 compared with real use.
  - Real-device tiers are untested.
  - No desktop static, reduced-motion summary or landscape dark states were captured.

**Required change to the report:**
- Bound §0's table to the runs that completed, and finish or remove the pending ones.
- Fix the adaptive-drop wording.
- Withdraw the 375 empty-backdrop finding, or re-label it "not reproduced; possible intermittent canvas blank under
  load; needs a targeted repro".
- Add an `evidence/INDEX.md` (or remove the references to it) and fix the paths.
- Add the I04 adjudication to U1.
- Restate the sound ranking like for like.

## 8. Other findings

| Finding | Verdict | Evidence | Required change |
|---|---|---|---|
| **U1's fix** ("a dock-aware bottom spacer after the composer") | WEAKENED | A spacer adds scroll room. It cannot move the row's resting position (y 657 at scroll 0), so it fails its own "fully above the dock on arrival" criterion | Hand to the I04 owner as "re-order or move up on short screens", or drop it (K01 is accepted) |
| **V-c** ("13 px labels … Low / XS / low") | WEAKENED | Round 7 measured the 375 px status row as over-full. The "I04 'tight' step" it cites exists only in the rejected trial `b39202f`, not in `0d58c5e` | Re-rate the risk as medium, owned by I04 |
| **Landscape art resolution (missed)** | MISSING | `844x390-light-land.json` `02b-focus-mid`: `chai-reading` upscale **1.23**, the worst in the dataset; window still 1.15 | Add a landscape column to §4.4 and C2. 1.23 also exceeds the cap's stated intent (`art-src/chai/README.md`) |
| **Reduced motion: steam ellipse `rx`/`ry` transitions still run** | NOTE | Live `end1440rm`: `CSSTransition:rx@ellipse`, `ry@ellipse` | Fine to accept as small motion, but list it under I10 "reduced-motion parity" rather than call it fully acceptable |
| **S6 / N2 (false "Drag to look around" hint)** | UPHELD | `NookScreen.tsx:155–164` renders it with no live-scene check | None. This is the best effort-to-value item in the report |
| **U3 (purpose line)** | UPHELD | I08 asks for exactly this | None |

---

## Summary of verdicts

| Point | Verdict |
|---|---|
| 1. C1 3D Chai "DEFECT against PRESERVE 2" | **WEAKENED.** The drift is real. It is known debt, the cause is wrong, it never appears in the Focus backdrop, and the route ignores round 6 and the billboard option |
| 2. N1 still without items "DEFECT against I09" | **WEAKENED.** Real for 3D-off users. About 1–3 s at a pre-warmed brew start. I09's Nook fallback is met. The layer route needs 12 lighting states; the SVG crop is cheaper |
| 3. A first | **REJECTED as sequenced.** It collides with the open Wave 1 files and I04 adjudications, and its largest item (R2) is unevidenced. Re-cut around P1 contracts after Wave 1 closes |
| 4. R1 ≤ 2 chips | **WEAKENED.** Milestones first, hide nothing (K02, I07, K03) |
| 5. R2 tablet two-column | **REJECTED.** The measured bands are 10–12 %, under its own 15 % threshold; the single column is deliberate; footer anchoring breaks PRESERVE 7 |
| 6. N3c drawn-room fallback | **REJECTED as specified.** The trigger can't fire; it conflicts with PRESERVE 8 and 10 |
| 7. Evidence integrity | Numbers **mostly UPHELD**. The adaptive-drop mechanism, the 375 empty backdrop, the "35 %" and the run-completeness claims are wrong or overstated |

## Top 3 changes the author must make

1. **Re-classify and correct the two headline "DEFECT"s.**
   - **C1:** known round-6 brand debt, not a PRESERVE 2 defect. Fix the cause (it follows the pre-v2 cream-snout
     build). Seen on the Nook screen only. Add the approval-free painted-billboard option and reconcile with round 6's
     Blender call.
   - **N1:** a usability gap for 3D-off users. Measured 1–3 s pre-warmed brew start. I09's Nook fallback is already
     met. 12 lighting states, light spill and shadows. Lead with the zero-asset `NookFallback` window crop.
   - Re-rank §3 accordingly.
2. **Rebuild the recommendation and round 1 around the P1 contracts and the open Wave 1.**
   - No Wave 2 maker work until Wave 1 closes: R1, R2 and R4 edit `Summary.tsx`, `FocusScreen.*`, `StatusBar.tsx` and
     `Home.*`, which the unmerged round-7 work also changes.
   - Round 1:
     - U3 purpose line;
     - N2 hint;
     - milestone-first pills, hiding nothing;
     - the 3D-off backdrop via the SVG crop.
   - Hand U1 and V-c to the I04 owner, with the I04 adjudication cited.
   - Drop R2's tablet two-column and footer anchoring.
   - Re-specify N3c as an opt-in on the Nook screen only that never touches the unlock close-up.
3. **Bring the evidence section in line with the evidence.**
   - List only completed runs: 1440 dark, landscape dark and the reruns were missing at draft time, and 1440 static and
     reduced motion stop at the End sheet.
   - Fix the adaptive-drop mechanism: SwiftShader starts low; no drop was observed.
   - Withdraw or re-label the 375×667 "empty backdrop": it did not reproduce live.
   - Correct "35 %" to 10.5 % and 12.3 %.
   - Add landscape upscale 1.23.
   - Restate the sound ranking like for like.
   - Add the missing evidence index and fix the paths.
