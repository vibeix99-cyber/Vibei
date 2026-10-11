# Kettle creative audit, phase 2: live walkthrough and advice

**Status:** final. Draft 1 (`8ebe81c`) was challenged by one independent critic (`CRITIC.md`) and reconciled here
(§9).
**Scope:** investigation and advice only.
- No app code, art, tests or settings were changed.
- Nothing was generated or paid for, nothing was published, and no Wave 2 contract was started.
- It builds on [`PHASE1-REPORT.md`](PHASE1-REPORT.md) (desk research, `c263167`) without repeating it.

**Legend:**
- **[V] verified:** measured live, read from code, or both.
- **[I] inferred:** a judgement that still needs a real device or a listening check.
- **DEFECT:** wrong against the app's own intent or a standard.
- **USABILITY:** it works, but people are likely to stumble.
- **DEBT:** a known, deferred gap.
- **TASTE:** a design judgement.

## 0. What was walked, and how

**Build:** integration app code `0d58c5e`. Round 7 was **REJECTED** at 11:15 UTC
(`review/product-excellence/contracts/I04/CHECKER-integration-fix-r7.md`), so this is the integration build, not a
merged one.
- It is served as a **production preview** (`vite build` + `vite preview`, :5323).
- A fresh rebuild today was identical to the served files, apart from source maps.
- Round 7's changes (storage banner, 200 % break reach, toast room) don't affect what this audit judges at 100 % text.

**Script:** `evidence/probes/walk2.mjs` (sha256 in `evidence/SHA256SUMS.txt`), with a fresh disposable profile per
run.
- **First visit** (`fresh` seed, not onboarded): hello, then setup step 1.
- **Returning user** (`veteran`: level 12, 10 of 14 Nook items):
  - Home;
  - start a brew;
  - focus at 6 s and at about halfway (clock fast-forwarded 12 min);
  - pause and resume;
  - the End sheet, then Keep brewing;
  - near the end, the whistle at +1.3 s and +2.8 s;
  - the summary at +1.5 s and +4.5 s, plus details expanded (full page);
  - Tea time;
  - Stats;
  - the Nook, with a real drag and a real tap on the 3D room;
  - Settings.
- **Unlock path** (`celebrate`): a brew that unlocks the record player, with the summary at 1, 4 and 10 s.
- **Landscape:** Home and focus at about halfway.

**Completed runs** (the per-run `evidence/meta/*.json` lists every state):

| Configuration | Coverage |
|---|---|
| 390×844@3 light; light with reduced motion; dark | Full walk: 23 states |
| 390×844@3 dark, static room (3D off) | Full walk: 21 states (no canvas, so no drag or tap) |
| 390×844@3 light, unlock path | 4 states |
| 375×667@2 light and dark | Full walk: 23 states |
| 820×1180@2 light and dark (tablet) | Through the Nook's drag and tap (20 states). Settings was not captured; screenshots timed out under load |
| 1440×900@2 dark | Through Settings (22 states) |
| 1440×900@2 light | Through the Nook (18 states) |
| 1440×900@1 dark, reduced motion (rerun alone) | Full walk: 23 states |
| 1440×900@1 dark, unlock path (rerun alone) | 4 states |
| 1440×900@2 light, static room | **Only to the End sheet** (9 states). The desktop static Nook was **not** captured |
| 844×390@3 light and dark, landscape | Home and focus (3 states each) |

**Also run:**
- **axe** (WCAG 2.2 AA tags) on every state at 390 light and 820 dark.
- **Motion clips** (webm) at 390 light and 1440 light.
- **Sound:** offline render and measurement of every sound effect and ambience through the app's own graph
  (`scripts/audio-check.mjs`): 32 renders, all hard checks passed (`evidence/audio/`).
- **Probes:**
  - `endsheet-anim.mjs`: End sheet stability under reduced motion;
  - `static-nook.mjs`: the static Nook's affordance;
  - the critic's warm and cold start timing (`CRITIC.md`).

**Limits** (never reported as passes):
- **Software WebGL.** Chromium with SwiftShader on 4 shared CPUs. The engine **detects software rendering at start
  and runs the low tier from the first frame** (`scene/resolve.ts:104–105`): 1.25 px per CSS px.
  - The same low tier is chosen for **phones with ≤ 4 cores or ≤ 3 GB RAM, and Save-Data** (`resolve.ts:102–105`), so
    the captures show what a real share of phones get.
  - The high tier, and its one-way adaptive drop (`Engine.ts:888–894`), were **not exercised**.
- **No real devices.**
- **No listening:** I cannot hear audio. The sound section is measurement and code reading.
- **Load.** Heavy load made several 1440×900@2 and 820×1180 walks time out partway; their coverage is listed above.
  Two desktop configurations were rerun alone at DPR 1.

**Evidence:** `evidence/INDEX.md` lists everything.
- **Committed:** contact sheets, crops, per-run metrics, audio metrics and spectrograms, probes.
- **Not committed:** full-size captures (for size). They are in the session scratchpad.

## 1. Kettle today: a candid assessment

**Kettle is a warm, coherent focus timer, and its core loop is finished.** On a phone the loop runs end to end
without a stumble:
- a calm Home;
- one obvious "Put the kettle on";
- a readable countdown;
- a whistle;
- one summary;
- Tea time.

The cream and deep-purple identity, Fredoka/Nunito, and the orange/blue/green action colours hold on every screen
walked. Accessibility is strong: axe found **0 violations in 17 tablet-dark states**. At 390×844 there was one, a
scroll-dependent target-size hit that Wave 1 already knows about. **The static drawn room is the best-looking art in
the app.**

**Its gaps are coherence and finish, not concept:**
- **The 3D Nook is the weakest visual surface.** Its Chai was never brought along to the approved design. That is a
  known, deferred rebuild. On low-tier devices the room renders soft, at 1.25 px per CSS px, and looks worse than the
  drawing it stands in for.
- **3D-off users lose their earned items in the Focus backdrop.** Everyone else sees a 1–3 s fade-in of them at each
  brew start.
- **The painted poses are slightly below display resolution.** 1.19× on DPR-2 tablet and desktop, 1.09× on DPR-3
  phones, and **1.23× in landscape** (the worst).
- **On the unlock path, milestones don't stand out.** On a big day the desktop summary shows seven equal pills. On a
  390×844 phone the "7 days warm, your best yet" pill starts half under the footer.

**Net:** the foundations are sound and protected (PRESERVE 1–13). The next gains come from **coherence (one Chai, one
room) and small clarity fixes**, not new features or a new look. **Wave 1 is still open**, after the round-7 REJECT,
so no creative work should touch its files until it closes.

## 2. Strongest elements to preserve

1. **The kettle-as-timer stage.**
   - The orange kettle with its gauge, flame and steam reads its state at a glance.
   - Chai's pose follows the timer: reading during focus, cheering at the whistle, sipping at tea.
   - It is legible at every size walked (PRESERVE 3 and 4).
2. **The approved painted Chai.** Expressive and readable from 68 px on Home to 290 px on the desktop stage
   (PRESERVE 2).
3. **The static drawn room** (`NookFallback`, an SVG). It is crisp at any DPR, warmly lit, shows every earned item, and
   its Chai matches the approved character (`evidence/crops/chai-compare.png`, right panel). It is an asset, not just a
   fallback.
4. **The voluntary first action.**
   - "Start a 15-min brew" with an optional task;
   - "Set things up first" and "I have a backup" as alternatives;
   - no account and no gate (PRESERVE 5).
5. **Calm motion.**
   - The session chrome fades after 7 s.
   - The summary enters with a 0.42 s ease-out and a 60 ms stagger; under reduced motion, opacity only for 0.22 s
     (`Summary.tsx:176–177`).
   - The whistle → summary handoff is staged and unhurried.
6. **Deliberate sound levels.**
   - Every sound effect is normalised to its target: all 21 measured on target.
   - No clipping anywhere; the highest peak is −3.6 dBFS.
   - The ambience fades out at session end so the whistle plays alone (`audio/session.ts`).
7. **Accessibility discipline:**
   - one live region per event;
   - hit-testable controls;
   - visible focus rings;
   - 200 % reflow (the round-7 review covers it in depth).

## 3. The most consequential shortcomings (re-ranked after the critic)

| # | Shortcoming | Type | Who sees it |
|---|---|---|---|
| S1 | **The 3D Nook Chai is off-model** (boxy loaf, cream snout, button eyes: a teddy, not the approved capybara) | **DEBT** (known since round 6; PRESERVE 2 needs Vibei's approval before any fix ships) | Everyone who opens the Nook screen. **Not** the Focus backdrop, where Chai is out of frame |
| S2 | **The low-tier 3D room looks worse than its own drawing** (soft, matte) | TASTE + a performance trade-off | Low-tier devices: software GL, phones with ≤ 4 cores or ≤ 3 GB, Save-Data |
| S3 | **Earned items are missing from the Focus backdrop when 3D is off or unavailable**, plus a 1–3 s fade-in at each warm brew start (9 s cold) | USABILITY (I09-adjacent) | Persistently: 3D-off and no-WebGL users. Briefly: everyone |
| S4 | **Painted poses below display resolution** (1.09–1.23×) | DEFECT against I06's own test ("max CSS × DPR") | Desktop, tablet and landscape users; mildly on phones |
| S5 | **Milestones are not surfaced on the summary.** Up to 7 equal pills on unlock days; "best yet" half under the footer on arrival at 390×844 | USABILITY | Unlock and milestone days |
| S6 | **The static Nook says "Drag to look around · tap things" over a drawing that can't be dragged or tapped** | DEFECT (false affordance) | 3D-off and no-WebGL users |


## 4. Findings by area

Each finding gives:
- the screen and evidence;
- what is weak and why it matters;
- an improvement;
- benefit, effort and risk;
- how to verify it.

Evidence paths are under `evidence/` unless stated.

### 4.1 Usefulness

| ID | Type | Screen and evidence | Weak, and why it matters | Improvement | Benefit / effort / risk | Verify |
|---|---|---|---|---|---|---|
| U1 | USABILITY → **hand to I04 (Wave 1)** | Home, 390×844 portrait (`meta/390x844-dark.json` `01-home`): the Brew length buttons are at y 657–705 and the docked start at y 676–736. axe flags `target-size` at rest; I04 already ruled it scroll-dependent (`CHECKER-r1.md:20`). **Landscape 844×390** (`frames/844x390-light-home.png`): **the whole segmented control is behind the dock** (buttons y 279–327, dock y 290–350) | In portrait the duration row starts half-covered. In landscape, the control that sets the brew length is invisible until the person scrolls (phase-1 V13, confirmed) | Route to the I04 owner with the measurements. It belongs to the open Wave 1 follow-ups (round-6 #3/#11 class), not to a creative round | High / S / low | I04's own acceptance (K01 REFERENCE→BEFORE→AFTER, axe at rest) |
| U2 | USABILITY | Summary on the unlock path. **1440×900 dark** (`frames/1440x900-dark-unlock-summary.png`): the unlock card, then **7 equal pills**: +68 leaves, Goal met, 7 days warm (your best yet), Tea Cozy earned, 2 recipes done, Badge: Warm Streak II, Badge: Weekend Warmth. **390×844 light** (`frames/390x844-light-unlock-summary.png`): the "best yet" pill starts half under the footer | Equal weight is the **accepted K02 design** (a calm "rest above reward" choice), and leaves and goal already lead. The real gap is narrower: **a milestone can be the third-to-seventh pill and start below the fold**, so the moment worth noticing is the easiest to miss | **Milestone-first ordering, hiding nothing.** Order: leaves → goal → milestones ("best yet", Tea Cozy, badges) → recipes → level distance. Keep every pill and the equal styling. Keep "leaves to next level", which carries I07's leaves → level → Nook link | Medium / XS / low | Unlock path at 390×844, 375×667 and 1440×900: the milestone pill is wholly visible on arrival. Pill count and arithmetic unchanged (unit tests). K02 REFERENCE→BEFORE→AFTER |
| U3 | USABILITY | First visit, 390×844 (`sheets/390x844-light.png`, `00-first-visit`) | "Hi, I'm Chai. Let's start small: one 15-minute brew. I'll keep you company." doesn't say what follows: the tea break, which is the product's promise (I08) | One purpose line: "Focus for 15 minutes, then a tea break." **I08's territory; copy only** | Medium / XS / low | An unfamiliar tester can say "focus, then a break". It still fits 375×667 without scrolling |
| U4 | — | Focus, pause, resume, End sheet, whistle, Tea time, at every size | **Works and is clear.** No change advised. The End sheet's "will be saved" wording while storage is full is a known round-7 follow-up (R7-13) | — | — | — |

### 4.2 Visual design

| ID | Type | Screen and evidence | Finding | Improvement | Benefit / effort / risk | Verify |
|---|---|---|---|---|---|---|
| V-a | **ACCEPTED** (was TASTE in draft 1) | Tablet 820×1180 (`sheets/820x1180-light.png`) | The single column is a **deliberate portrait-tablet rule** (`FocusScreen.module.css:403–414`). Measured empty bands are **10.5 % and 12.3 %** of the viewport (critic), not the "about 35 %" draft 1 estimated by eye. Anchoring the summary footer to the content would break PRESERVE 7's persistent footer | None | — | — |
| V-b | TASTE | Desktop Focus at 1440×900 (`frames/1440x900-light-static-focus.png`; `meta`: Pause 78×80, Add 5 / End 62×64) | A sparse right panel (phase-1 V5, confirmed). 130 px digits and small controls float in cream. The zen fade (correctly) hides the chrome | **Optional:** size the controls with the digits (Pause about 96, Add 5 / End about 76) on ≥ 1280 px wide. No new content. **Low priority** | Low / XS / low | 1440×900: larger hit areas; zen fade unchanged; phone layouts unchanged |
| V-c | TASTE → **hand to I04** | Home status bar (`meta/*.json` `01-home.type`): 11 px labels under 20 px numbers; 30 px (phone) / 36 px (desktop) greeting | Labels read as fine print on desktop. But round 7 measured the 375 px status bar as already over-full, so a size bump there is an I04 decision | Desktop only (≥ 1024 px): 13 px labels. Phones: leave to I04 | Low / XS / low | Computed size at 1440; the 375×667 status bar unchanged |
| V-d | ACCEPTED | Status-bar icon styles (phase-1 V7) | Mixed but recognisable and on-brand | None | — | — |

### 4.3 Chai and brand

| ID | Type | Screen and evidence | Finding | Improvement | Benefit / effort / risk | Verify |
|---|---|---|---|---|---|---|
| C1 | **DEBT** (known since round 6; PRESERVE 2 governs any fix) | **Nook screen only.** The Focus backdrop's `window` mode has Chai out of frame (`scene/types.ts:3`). See **`crops/chai-compare.png`**: approved painted, 3D, static SVG | **The 3D Chai is off-model:** a square loaf (`chai.ts:28–30`, W = H = 0.8), a cream snout (`chai.ts:57`), button eyes, no brows. It reads as a teddy.<br><br>**Cause [V], corrected after the critic:** the 3D toy kept the **pre-v2** construction ("broad cream snout"). The 2D vector `Mascot.tsx` moved to v2 ("capybara, not bear … no cream patch") minutes later (`b6577ad`), and the static room draws that v2 vector, which is why the static Chai is on-model. The 3D Chai was **left behind**; it predates the approved sheet (`e0d3cf6` vs `eeff3a0`). Round 6 already listed the rebuild as a deferred follow-up (`round-6-audit/REPORT.md:85`) and chose **Blender** for it (`REPORT.md:122`) | Three routes, all needing Vibei's decision:<ol><li>**Blender rebuild** (round 6's choice): a rigged `.glb` matching the approved silhouette, ≤ 300 KB, with the procedural Chai as fallback.</li><li>**Show the approved painted pose in the room** as a camera-facing card. It uses already-approved art, so the only decision is placement and no new character art is needed (phase-1 option).</li><li>**Procedural retune** of `chai.ts`, which is new character art and needs a turnaround approved first.</li></ol> | **High** / route 2 S, route 1 M–L, route 3 M / medium | A side-by-side at Nook close-up framing against `art-src/chai/chai-sheet-approved.webp`. 5 blind viewers judge "same character" ≥ 4/5. No frame-time regression on a real phone |
| C2 | DEFECT (I06's own test) | Stage poses (`meta/*.json` `imgs[].upscale`) | **Below display resolution: 1.09× (390×844@3), 1.19× (820×1180@2, 1440×900@2), 1.23× (844×390@3 landscape, the worst)**. Visible as slight edge softness on desktop | **Higher-resolution masters of the same poses** (Vibei generates them on the website; prompts in §6.3), then raise `SHEET_REF_H` | Medium / M / medium (fidelity drift) | Every pose's upscale ≤ 1.0 at 390×844@3, 844×390@3 and 1440×900@2. Overlay deviation ≤ 2 % |
| C3 | TASTE | Focus frame, every size (`*/02b-focus-mid.png`) | **Three rendering styles in one frame** (phase-1 V1, confirmed): painted Chai, a flat vector kettle, a soft 3D room. The blur and shared palette make it read "storybook", not broken | **Optional:** two painted shading layers in the kettle's SVG. The silhouette and gauge stay, so PRESERVE 3 is kept. Art approval needed | Low–medium / S / low | REFERENCE→BEFORE→AFTER at 390 and 1440, light and dark |
| C4 | — | Home, Welcome, End sheet, Stats | Chai's poses and voice are consistent | — | — | — |

### 4.4 Artwork at real display sizes

Measured per visible image: delivered pixels ÷ (CSS box × DPR). Above 1.00 means below display resolution.

| Asset | 390×844@3 | 375×667@2 | 844×390@3 | 820×1180@2 | 1440×900@2 | Verdict |
|---|---|---|---|---|---|---|
| Chai stage poses (reading, cheering, sipping) | 1.09 | 0.70 | **1.23** | 1.19 | 1.19 | Below on DPR 2–3 (C2) |
| Chai sipping (Home hero) | 0.67 | 0.45 | — | 0.45 | 0.61 | OK |
| Window still (3D off / loading) | 0.99 | — | — | — | **1.40** | Below on desktop, masked by an intentional blur |
| 3D canvas backing store | 1.25 px per CSS px (low tier, every run) | | | | | Soft on DPR 2–3 at the low tier. The high tier (1.5 mobile / 2 desktop) was not exercised |
| Static SVG room | vector | vector | — | — | vector | Crisp everywhere |

### 4.5 The 3D Nook

| ID | Type | Screen and evidence | Finding | Improvement | Benefit / effort / risk | Verify |
|---|---|---|---|---|---|---|
| N1 | USABILITY (I09-adjacent) | Focus backdrop with 3D off vs on (**`crops/backdrop-3d-vs-still.png`**, 390×844 dark). Code: the still is "the base room without unlocked items" (`scene/Fallback.tsx:23–24`). Timing (critic): a warm start shows the still **2.3 s**, a cold start **9.2 s** | **3D-off and no-WebGL users never see their earned items in the Focus backdrop**: fairy lights, shelf, plant, books, record player. Everyone else sees a short fade-in of them at brew start. The **Nook screen's** static room already draws every earned item, so I09's own fallback test is met there | **For tier `off` and no-WebGL only:** render the Focus backdrop from the existing **drawn room** (window-framed), which already carries the items. There is no swap, because 3D never arrives for these users, and no new assets. **Not recommended:** per-item pre-rendered layers. Weather changes item lighting (`Engine.ts:742–763`), so it would take about 12 lighting states × about 10 items ≈ 120 layers, and it can't carry the fairy-light wash or shadows | Medium / S / low (framing must match the stage's window crop) | With 3D off at 390×844 and 1440×900, every earned window-visible item appears in the Focus backdrop. 3D-on behaviour and timings unchanged. CLS 0 |
| N2 | DEFECT (false affordance) | Static Nook (`frames/390x844-dark-static-nook.png`). Code: `NookScreen.tsx:155–164` shows the hint until it is dismissed; the static room has no canvas or handlers (`scene/index.tsx:30`) | "**Drag to look around · tap things**" over a drawing that can't be dragged or tapped | Show the hint only when the live scene is mounted (expose `isLive` from `Nook`) | Medium / XS / low | 3D off: no hint. 3D on: unchanged |
| N3 | TASTE + a performance trade-off | Nook, every size, low tier (`sheets/*`, `10-nook`) | **The low tier reads matte and soft**, and worse than the static drawing. There is no environment map (phase 1 §2) | **(a) High tier:** procedural `RoomEnvironment` through PMREM. Unverified here; real-device check needed. **(b) Low tier:** baked contact-shadow decals under items. **(c) Re-specified after the critic:** an **opt-in "Drawn room" view on the Nook screen only**. It never replaces the unlock close-up (PRESERVE 8) and never redefines the 3D "auto" preference (PRESERVE 10). "Drop twice" can't happen; the engine steps down once (`Engine.ts:888–894`) | Medium / M / medium | Real mid-range and low-end phones: frame time, a blind preference test. The unlock flow is unchanged |
| N4 | — | 3D Nook drag and tap (390 light, 820 light/dark: `10b`, `10c`) | **Works:** drag orbits; a tap zooms to the item | — | — | — |
| N5 | [I] | Early Nook (phase-1 V9) | Not re-walked (veteran profile) | Check with the `newbie` seed | — | — |

### 4.6 Motion and sound

**Motion** (code plus timed stills; webm clips at 390 light and 1440 light):
- **Whistle → summary:**
  - +1.3 s: whistle frame, "0:00 Tea's ready!", Chai cheering;
  - +2.8 s: the summary is up;
  - the content enters with a 0.42 s ease-out and a 60 ms stagger, or opacity-only for 0.22 s under reduced motion.

  It is calm and correct.
- **Zen fade (7 s):** Add 5 and End fade but stay hit-testable. Intentional.
- **Reduced motion** (390 light; 1440 dark rerun): no translates. What keeps running is CSS opacity transitions and the
  SVG steam ellipses (`endsheet-anim.mjs`). Acceptable.
- **Not observed:** the one-way high → low tier step (`Engine.ts:888–894`). It needs a real GPU.

**Sound** (offline; **I could not listen**). Like-for-like, using short-term (3 s) maximum loudness:

| Element | Short-term max | Note |
|---|---|---|
| Whistle ("complete") | **−21.8 LUFS** | Momentary max −14.9, peak −6.9 dBFS |
| Ambience beds | **−14.5 to −16.9 LUFS** | — |
| Kettle simmer | −26.9 LUFS | — |

- **The whistle is quieter than the beds over 3 s windows.** That is by design: the session fades the ambience out at
  the end, so the whistle plays alone (`audio/session.ts`). The mixed scenario `ambientPlusComplete` integrates to
  −20.4 LUFS.
- **Phone-speaker proxy** (integrated loudness above 250 Hz):
  - The whistle is −19.3. Brown noise is −22.5, against −16 to −20 for the other beds.
  - On phone speakers, brown noise will sound noticeably quieter than rain or fire.
  - **Optional:** about +3 dB phone-band trim for brown. Verify that phone LUFS fall within ±2 LU across the beds.
- **A listening check is needed:**
  - the whistle's character (a kettle, not an alarm) and that it is clear at the handoff;
  - lofi on a phone speaker;
  - the fire crackle density;
  - the 40 s simmer.

### 4.7 Reliability

- **Errors:** 0 page errors and 0 console errors in every completed walk.
- **Suites** (round-7 Lane D, the same code paths): chromium 72/72; timer 29/31 with 2 skips by design;
  vitest 267/267.
- **axe:** 0 violations in 17 tablet-dark states. At 390×844 light, one scroll-dependent `target-size` (U1).
- **Under load:** several 1440×900@2 and 820×1180 walks hit 120 s screenshot timeouts, and two "Keep brewing" clicks
  timed out. Probes alone show the button stable and clickable (my probe 629 ms; the critic's 487 ms). These are
  environment artifacts, not product defects.
- **Withdrawn from draft 1:** "the 375×667 summary shows an empty backdrop". The critic could not reproduce it: the room
  rendered at 1.5, 4.5, 10 and 20 s. My capture was most likely taken before the canvas drew, under load.
- **Wave 1 items are not repeated here:** R7-D1, the storage warning, toasts. See
  `CHECKER-integration-fix-r7.md`.

## 5. Phase-1 findings, checked live

| Phase-1 finding | Live result | Evidence |
|---|---|---|
| V1: three art styles in one frame | **Confirmed**, and it reads as storybook (C3) | `*/02b-focus-mid.png` |
| V10 / §2: the 3D Chai reads as a teddy | **Confirmed. The cause is corrected:** the 3D toy kept the pre-v2 construction. Nook screen only (C1) | `crops/chai-compare.png`; `chai.ts:3, 28–30, 57`; `Mascot.tsx` header |
| Nook materials and pixel density | **Confirmed at the low tier** (1.25 px per CSS px, matte). High tier not exercised | `meta` canvases; N3 |
| Flag 2: window stills miss earned items | **Confirmed.** It matters persistently for 3D-off users and for 1–3 s otherwise (N1). The still is also 1.40× below resolution on desktop | `crops/backdrop-3d-vs-still.png`; `CRITIC.md` timings |
| V2: the summary crops the cheering Chai | **Confirmed at 375×667** (head and paws; kettle lid and dial). **Not at 390×844** | `frames/375x667-light-07a-summary.png`; 390×844 in `sheets/390x844-light.png` |
| V3: equal-weight chips | **Confirmed by measurement** (identical height, background and weight). **Re-judged:** an accepted K02 choice. Only milestone placement is a problem (U2) | `meta` `07-summary.chips`; `frames/1440x900-dark-unlock-summary.png` |
| V12: landscape Focus drops the "min brewed · whistles at" line | **Confirmed visually** (present in the DOM, not shown at 844×390) | `frames/844x390-light-focus.png` |
| V13: landscape dock covers Brew length | **Confirmed: the whole control is behind the dock** (U1, handed to I04) | `frames/844x390-light-home.png` |
| V5: sparse desktop Focus | **Confirmed** (V-b; taste) | `1440x900-*/02b` |
| V6: small status labels | **Confirmed: 11 px** (V-c; handed to I04 for phones) | `meta` `01-home.type` |
| Flag 1: poses below resolution | **Confirmed: 1.09–1.23×** (C2) | `meta` `imgs[].upscale` |
| Phone Focus "empty band" (V4) | **Confirmed as composition:** about 150 px of cream below the controls at 390×844; on tablet 10.5–12.3 % | `*/02b-focus-mid.png`; `CRITIC.md` §5 |

## 6. Asset routes

### 6.1 Best route per upgrade

| Upgrade | Best route | Why | Budget and fallback |
|---|---|---|---|
| On-model 3D Chai (C1) | **Blender → `.glb`** (round 6's choice), **or** the approved painted pose as an in-room card (no new art) | Organic shapes, a rig for nap, sip and awake, and baked light are what Blender is for. The card is cheapest and stays on-model by construction | `.glb` ≤ 300 KB (meshopt), ≤ 3–5k tris, vertex colours or 1 × 256² KTX2, loaded after the Nook mounts. Fallback: the current procedural Chai |
| Earned items in the 3D-off Focus backdrop (N1) | **Reuse the drawn room** (SVG, window-framed) | It already shows every earned item; no new assets | 0 KB. Fallback: today's still |
| Sharper painted poses (C2) | **New images** (Vibei on the website; prompts in §6.3) | The masters equal the delivery size; there is no higher source | ≤ 60 KB WebP per pose at about 1,200 px delivery. Fallback: the current WebP |
| Kettle depth (C3, optional) | **Improve the SVG** (gradient layers) | It stays a crisp vector and keeps PRESERVE 3 | +2–4 KB |
| Hero Nook items (only with direction C) | **Blender → `.glb`** via the Blender MCP on Vibei's PC | Real bevels and baked AO read in close-up | Per item ≤ 3–5k tris, ≤ 250 KB (meshopt + KTX2 512²). Procedural on failure, low tier or 3D off. Decoders self-hosted for the offline PWA |
| High-tier reflections (N3a) | **Three.js** `RoomEnvironment` + PMREM | Procedural, no files | +0 KB, high tier only |
| Whistle → summary motion | **Deterministic animation** (keep `motion/react`) | It already works | — |
| Store or site loop (outside the app) | **Short video** from real captures | Only if Vibei wants marketing loops | Outside the bundle |

### 6.2 Blender workflow (for C1's route 1, and for direction C)

1. **Vibei's PC:** Blender with the Blender MCP connector.
2. **Model:**
   - Match the footprint and pivot of the procedural object it replaces (`scene/engine/chai.ts`, `items.ts`).
   - For Chai, match the approved sheet front and ¾ (`art-src/chai/chai-sheet-approved.webp`).
   - Use one material with baked AO in vertex colour or a 256–512² texture.
   - Rig or shape-key the three poses: nap, sip, awake.
3. **Export:** glTF 2.0 `.glb`, Y-up, transforms applied, meshopt-compressed, KTX2 textures. Names: `nook-chai.glb`,
   `nook-<itemId>.glb`.
4. **Push:** Vibei pushes them to a branch under `kettle/public/models/`, so the PWA caches them.
5. **Code (a maker):**
   - `GLTFLoader` with `MeshoptDecoder` (wasm self-hosted) and `KTX2Loader`;
   - load after the Nook mounts and the engine is idle;
   - same transform as the procedural mesh;
   - keep the procedural one on failure, on the low tier and with 3D off.
6. **Acceptance:**
   - size and triangle budgets met;
   - no frame-time regression on a real phone;
   - a REFERENCE→BEFORE→AFTER close-up at 390×844 and 1440×900, light and dark;
   - Vibei's art approval for Chai (PRESERVE 2).

### 6.3 Prompts for higher-resolution Chai poses (Vibei runs these on the website; not run here)

Phase 1 §4 holds the base prompt. Refinements from the live check:

- **Poses, in priority order:**
  1. reading (Focus; most seen; 1.23× in landscape);
  2. cheering (whistle and summary);
  3. sipping (Tea time, Home);
  4. stretch (Break's over).
- **References, attached in this order:**
  1. `kettle/art-src/chai/chai-sheet-approved.webp`;
  2. the pose master `kettle/art-src/chai/chai-<pose>.png`;
  3. a 1:1 live crop of the pose as displayed (e.g. `evidence/crops/chai-compare.png`, left panel).
- **Dimensions:** **2048 px tall**, portrait, centred, about 6 % margin.
- **Transparency:**
  - **GPT Image:** transparent PNG.
  - **Nano Banana Pro:** flat **#FF00FF** background, matted with `review/round-6-mockups/build/extract-chai.py`.
- **Prompt:** phase 1's text, plus: "Keep the exact eyebrow shape and eye spacing of reference 3; the muzzle is a
  slightly darker warm brown, never a cream patch; the book, mug or raised paws exactly as in reference 2."
- **Acceptance checklist** (every item must pass):
  1. Silhouette overlay on the master at the same height: deviation ≤ 2 % of height. Yuzu-leaf angle, eye, nose and
     blush placement unchanged.
  2. In-app upscale ≤ 1.0 at 390×844@3, 844×390@3 and 1440×900@2 (the `meta` `upscale` metric).
  3. Edges on `#FFF9F0` and `#221829` at 100 %, at 40 px, and at 4× for halos. No magenta fringe.
  4. WebP q80, alpha 100, ≤ 60 KB per pose at about 1,200 px delivery.
  5. The four poses side by side read as one character (5 blind viewers).
  6. **Vibei's approval** (PRESERVE 2).

## 7. Three upgrade directions

All three keep PRESERVE 1–13. None adds currency, accounts or tracking. **None starts before Wave 1 closes.**

### A. "One Chai, one room": coherence (recommended)

- **Feeling:** the same Chai and the same room everywhere you look: the stage, the Nook, 3D off, any device. Crisp on
  every screen.
- **Visible changes:**
  - The **Nook's 3D Chai** becomes the approved capybara (C1: Blender, or the approved pose as an in-room card).
  - **Painted poses** at 2048 px, so they're crisp on desktop, tablet and landscape (C2).
  - **3D-off users** see their earned items in the Focus backdrop (N1, from the drawn room).
  - The static Nook **stops promising drag and tap** (N2).
- **Preserved:**
  - the approved Chai, *more* faithfully;
  - the room layout, items and unlock close-up;
  - the stage composition and all reward rules.
- **Trade-offs:**
  - It needs Vibei's art approvals: the 3D route and the pose masters.
  - Website generation by Vibei.
  - A real-device check for the 3D.
- **Production work:**
  - C1: route 2 about 1 day, route 1 about 2–3 days plus Blender time;
  - C2: generation by Vibei, then about 0.5 day to integrate;
  - N1: about 1 day;
  - N2: about 1 hour.
- **Maps onto the P1 contracts:** I06 (crisp Chai) and I09 (the Nook's outcome and fallback).

### B. "Quiet clarity": small hierarchy and copy fixes

- **Feeling:** the same calm screens, with the moment that matters easy to see.
- **Visible changes:**
  - **Milestone-first pills** that hide nothing (U2);
  - a **first-visit purpose line** (U3);
  - **desktop Focus controls** sized with the digits (V-b);
  - **desktop status labels** at 13 px (V-c).
  - **To I04:** Brew length under the dock, and the phone label sizes.
- **Preserved:** K01/K02 structure and their equal-weight calm, the tablet single column, the persistent footer, the
  arithmetic.
- **Trade-offs:** small gains. U2 and U3 touch I07/I08 framing.
- **Production work:** about 1 day.

### C. "The Nook as a living room": depth (defer)

- **Feeling:** a richer reward place, with modelled hero objects and soft light.
- **Visible changes:**
  - high-tier reflections (N3a);
  - 3–4 Blender hero items;
  - low-tier contact shadows (N3b);
  - an opt-in drawn-room view (N3c);
  - an early Nook that leads with "the next cozy thing".
- **Trade-offs:** the highest effort and risk (asset pipeline, decoders, GPU cost), and the benefit sits in one
  destination.
- **Production work:**
  - Blender, about 1–2 days per item;
  - loader and fallbacks, about 2 days;
  - real-device performance passes.

### Recommendation

1. **After Wave 1 closes, run A as the first creative upgrade, with B's two XS items (U2, U3) in the same round.**
   - A fixes the largest brand gap (C1) and the clearest measured asset gap (C2).
   - It maps straight onto the P1 contracts (I06, I09).
   - It only touches files outside Wave 1's open work: `scene/*`, `screens/nook/*`, assets.
2. **Defer C** until real-device performance data exists.
3. **Until Wave 1 closes, the useful work is Vibei's:**
   - choose C1's route;
   - generate the pose masters;
   - run a 10-minute real-device check.

## 8. First improvement round: 4 changes, bounded (after Wave 1 closes; none started)

| # | Change | Files (expected) | Acceptance criteria |
|---|---|---|---|
| R1 | **The static Nook hint shows only when the live 3D room is mounted** (N2) | `screens/nook/NookScreen.tsx`, `scene/index.tsx` (expose `isLive`) | <ul><li>3D off or no WebGL: no "drag" hint.</li><li>3D on: hint behaviour unchanged.</li><li>axe 0.</li></ul> |
| R2 | **3D-off Focus backdrop from the drawn room** (N1) | `scene/Fallback.tsx` (window mode uses `NookStaticRoom` framing when the tier is `off` or there is no WebGL), `art/NookFallback.tsx` (a window crop, if needed) | <ul><li>Tier `off` at 390×844 and 1440×900, light and dark: every earned window-visible item is in the backdrop.</li><li>Tier high or low: the backdrop and the 2.3 s / 9.2 s timings are unchanged.</li><li>CLS 0.</li><li>REFERENCE→BEFORE→AFTER.</li></ul> |
| R3 | **Milestone-first summary pills, nothing hidden** (U2) | `screens/done/summary.ts` (ordering) | <ul><li>Unlock path at 390×844, 375×667 and 1440×900: the milestone pill is wholly visible on arrival.</li><li>Pill count, text and arithmetic unchanged (unit tests).</li><li>The final expanded line clears the footer (PRESERVE 7).</li><li>K02 REFERENCE→BEFORE→AFTER.</li></ul> |
| R4 | **The first-visit purpose line** (U3) | `screens/welcome/WelcomeScreen.tsx` (copy) | <ul><li>Fits 375×667 without scrolling, in both themes.</li><li>I08's owner reviews the wording.</li></ul> |

**Not in round 1:**
- C1 and C2 need Vibei's art approval and assets first.
- U1 and V-c go to I04 inside Wave 1.

**Process (bounded, mirrors the Product Excellence protocol):**
1. **One maker** (R1–R4 are small and don't overlap), with a budget of **half a day**. It returns READY FOR REVIEW
   with:
   - REFERENCE→BEFORE→AFTER at 390×844, 375×667, 844×390 and 1440×900, light and dark, with a frozen clock;
   - this audit's `walk2.mjs` metrics;
   - unit, chromium and timer suites as passed/total.
2. **One independent Checker** reviews the trial merge: APPROVE or REJECT.
3. **At most one fix round** for named blockers, then a targeted re-check. If it is still red: stop and report.
4. **Merge only on APPROVE**, then the regression (unit, chromium, timer and PWA suites, and the capture set).


## 9. Independent critic and reconciliation

**The critic:** a separate Opus 5.5 instance that wrote none of the audit.
- Its file is `CRITIC.md`.
- It ran 4 live probes, every browser through the slot gate.
- It spot-checked the numbers: the upscale values, chip metrics, Brew length and dock rects, 11 px labels, the canvas
  1.25 and the axe counts all match `meta/*.json`.

| Draft-1 claim | Critic | Reconciliation |
|---|---|---|
| C1: the 3D Chai is a "DEFECT against PRESERVE 2", seen in the Nook **and the Focus backdrop**; "built from the legacy vector" | WEAKENED | **Accepted.** Now DEBT, Nook screen only (`types.ts:3`). The cause is corrected to the pre-v2 construction. Added round 6's Blender choice and the approval-free painted-pose route |
| N1: "DEFECT against I09"; "every brew start until 3D loads"; 40 item layers | WEAKENED | **Accepted.** Now USABILITY for 3D-off users, plus a measured 2.3 s (warm) / 9.2 s (cold) bridge. The I09 fallback is met on the Nook screen. The route switches to reusing the drawn room; item layers need about 120 lighting variants and are dropped |
| Recommendation: "A (Calm clarity) first" | REJECTED as sequenced | **Accepted.** It touched Wave 1's files (`Summary.tsx`, `FocusScreen.*`, `StatusBar`, Home) while round 7 is unmerged. The recommendation is now **coherence (A, renamed) after Wave 1 closes**, with two XS clarity items. U1 and V-c go to I04 |
| R1: "≤ 2 summary chips" | WEAKENED | **Accepted.** Equal weight is accepted K02 calm, and hiding "leaves to level" would cut I07's link. Now **milestone-first ordering, nothing hidden** |
| R2: "Tablet two-column; about 35 % dead band" | REJECTED | **Accepted.** The bands measure 10.5 % / 12.3 %, the portrait-tablet rule is deliberate (`FocusScreen.module.css:403–414`), and footer anchoring breaks PRESERVE 7. V-a is now ACCEPTED |
| N3c: "Switch to the drawn room after two drops" | REJECTED | **Accepted.** The engine drops once; forcing static would freeze the unlock close-up (PRESERVE 8) and redefine "auto" (PRESERVE 10). Now an **opt-in Nook-only view** |
| §0 runs listed as walked while still running | Flagged | **Accepted.** §0 now lists only completed runs and their exact coverage, including where the desktop static run stopped |
| "Adaptive quality drops to low under SwiftShader" | Flagged | **Accepted.** Software GL starts on low (`resolve.ts:104–105`); the drop was not exercised |
| 375×667 summary "empty backdrop" | Not reproduced | **Withdrawn** (§4.7) |
| Sound ranking compared unlike measures | Flagged | **Accepted.** Restated with short-term maxima (§4.6) |
| "Evidence index" missing; wrong `walk2.mjs` path | Flagged | **Fixed:** `evidence/INDEX.md` was added and the paths corrected |
| Missed: landscape reading pose upscale 1.23× | Added | **Accepted** into C2 and §4.4 |

**Where I keep my position:**
- **C2 stays a DEFECT.** I06's own observable test is "max CSS × DPR" against the source. The critic did not contest
  the numbers.
- **The static drawn room** stays named as a strength to build on.

## 10. What I need from Vibei, and the decisions to make

**Inputs:**
1. **C1 route:** Blender rebuild (round 6's choice), the approved painted pose as an in-room card (no new art), or a
   procedural retune. Then approve a turnaround or placement mock before it ships.
2. **Pose masters (C2):** run §6.3's prompts on the website, pick against the checklist, and push the PNGs to a branch.
3. **A 10-minute real-device check** on a phone and a laptop:
   - Does the Nook stay on the high tier?
   - Does the whistle sound like a kettle, clear at the handoff?
   - Is brown noise too quiet on the phone speaker?
4. **Blender** (only for C1 route 1 or direction C): confirm the Blender MCP connector on your PC.

**Decisions:**
1. **Direction:** A "One Chai, one room" (recommended), B "Quiet clarity", or C "Living Nook". Or A with B's two XS
   items, as recommended.
2. **When:** run it as Wave 2 (it maps onto I06 and I09) once Wave 1 closes, or as a separate small round.
3. **Kettle shading** (C3): wanted, or keep the accepted flat kettle?
4. **An opt-in drawn-room view in the Nook** (N3c): wanted?
5. **Round 7** (Wave 1, separate): a round 8 for R7-D1, or rule toasts at landscape 200 % acceptable. See
   `review/product-excellence/contracts/I04/integration-fix/round7-review/DEFECT-PACKET-R7.md`.


