# Kettle creative audit, phase 2: live walkthrough and advice

**Status:** DRAFT 1, before the critic.
**Scope:** investigation and advice only. No app code, art, tests or settings were changed, nothing was generated or
paid for, nothing was published, and no Wave 2 contract was started. This builds on
[`PHASE1-REPORT.md`](PHASE1-REPORT.md) (desk research, `c263167`) and does not repeat it.

**Legend:**
- **[V] verified:** measured live, read from code, or both.
- **[I] inferred:** a judgement still needing a real device or a listening check.
- **DEFECT:** something is wrong against the app's own intent or a standard.
- **USABILITY:** it works, but a person is likely to stumble.
- **TASTE:** a design judgement; reasonable people may disagree.

## 0. What was walked, and how

- **Build:** the integration build, app code `0d58c5e`. Round 7 was **REJECTED** at 11:15 UTC
  (`contracts/I04/CHECKER-integration-fix-r7.md`), so per the brief this is the integration build, not a merged one.
  - It is served as a **production preview** (`vite build` + `vite preview`, port 5323). The build was re-verified
    today: a fresh rebuild is identical to the served files, apart from source maps.
  - Round 7's changes (the storage banner, break reach at 200 % text, the toast room) don't touch anything this audit
    judges at 100 % text.
- **Capture script:** `evidence/walk2.mjs` (sha256 in `evidence/SHA256SUMS.txt`). It runs each step on a fresh,
  disposable profile.
  - **First visit:** a fresh profile, not onboarded: the hello screen, then the first setup step.
  - **Returning user** (the `veteran` seed, level 12, 10 of 14 Nook items):
    - Home;
    - start a brew;
    - focus at 6 s and at about halfway (clock fast-forwarded 12 min);
    - pause, resume, the End sheet, then Keep brewing;
    - near the end: the whistle, at +1.3 s and +2.8 s;
    - the summary, at +1.5 s and +4.5 s, and with details expanded (full page);
    - Tea time;
    - Stats, the Nook (plus a real drag and a real tap on the 3D room), and Settings.
  - **Unlock path** (the `celebrate` seed): a brew that unlocks the record player, then the summary at 1, 4 and 10 s.
  - **Landscape:** Home and focus at about halfway, at 844×390.
- **Configurations:**

  | Device | Viewport | DPR | Runs |
  |---|---|---|---|
  | Phone | 390×844 | 3 | Light and dark; reduced motion (light); static room (dark); unlock path (light) |
  | Small phone | 375×667 | 2 | Light and dark |
  | Tablet | 820×1180 | 2 | Light and dark |
  | Desktop | 1440×900 | 2 | Light and dark; reduced motion (dark); static room (light); unlock path (dark) |
  | Landscape phone | 844×390 | 3 | Light and dark |

- **Conditions:**
  - **Clock:** frozen start with `page.clock.install` at 2026-10-11 07:40 UTC, then real-rate. The seeded profile's
    own clock offset shows "afternoon" on Home.
  - **Screenshots:** `animations: 'disabled'`, so idle animation is paused.
  - **Accessibility:** axe (WCAG 2.2 AA tags) on every state at 390 light and 820 dark.
  - **Motion clips:** webm at 390 light and 1440 light.
  - **Sound:** offline render and measurement of every sound effect and ambience through the app's own audio graph
    (`scripts/audio-check.mjs`): 32 renders, all hard checks passed.
- **Limits** (never reported as passes):
  - **Rendering:** Chromium with SwiftShader (software WebGL) on 4 shared CPUs. The 3D engine's adaptive quality drops
    to the **low tier** under software rendering: the canvas renders at **1.25 px per CSS px** in every run, its low-tier
    cap. So the 3D captures show what a weak GPU shows, not the high tier.
  - **No real devices.** **I cannot hear audio:** the sound section is measurement and code reading, not listening.
  - **Load:** heavy load made some 1440 runs time out mid-walk; they were rerun one at a time (see the evidence
    index).
- **Evidence:** contact sheets (`evidence/sheets/`), crops (`evidence/crops/`), per-run `meta.json` (every visible
  image's delivered-vs-needed pixels, canvas density, headings, buttons, axe results), and audio metrics
  (`evidence/audio/`). Full-size captures are kept out of git for size, and their location is listed in the index.


## 1. Kettle today: a candid assessment

**Kettle is a genuinely warm, coherent focus timer.** On a phone the core loop works end to end without a stumble: a
calm Home, one obvious "Put the kettle on", a readable countdown, a whistle, one summary, then Tea time. The cream and
deep-purple identity, Fredoka/Nunito, and the orange/blue/green action colours hold on every screen walked.
Accessibility is better than most apps in this genre: axe found 0 violations in 17 tablet states, and one at 390×844
(below).

**Its weaknesses are mostly of finish and consistency, not of concept.**
- **Three art languages share each Focus frame:**
  - a painted Chai;
  - a flat vector kettle with one gloss highlight;
  - a soft-rendered 3D room.
- **The 3D Nook is the weakest visual surface.**
  - The 3D Chai is off-model: it was built from the legacy vector mascot.
  - On a weak GPU the room renders soft, at 1.25 px per CSS px.
  - Its own static drawing is crisper, warmer and on-model.
- **Off phone sizes, layouts lose composition:**
  - the tablet Focus and summary leave large dead bands;
  - desktop Focus is a big picture beside a lot of empty cream;
  - the 375×667 summary crops the moment it should celebrate.
- **Rewards don't lead.** The summary gives five facts the same visual weight, and a milestone like "7 days warm, your
  best yet" can sit half under the footer on arrival.

**Net:** the foundations are sound and protected (PRESERVE 1–13). The next gains come from **coherence**: one Chai, one
room, a calmer hierarchy. They don't come from new features or a new look.

## 2. Strongest elements to preserve

1. **The kettle-as-timer stage.**
   - The orange kettle with its gauge, the flame and the steam carry state at a glance.
   - Chai's pose follows the timer: reading during focus, cheering at the whistle, sipping at tea.
   - It is legible at every size walked (PRESERVE 3 and 4).
2. **The approved painted Chai.** It is expressive, on-brand and readable from 68 px on Home to 290 px on the desktop
   stage (PRESERVE 2).
3. **The static drawn room** (`NookFallback`, an SVG). It is the best-looking room art in the app: crisp at any DPR,
   warm lighting, on-model Chai, every earned item. See `evidence/crops/chai-compare.png` and the dark static
   `10-nook`. It is an asset, not just a fallback.
4. **The voluntary first action.**
   - First visit offers "Start a 15-min brew" with an optional task, plus "Set things up first" and "I have a backup".
   - There is no account and no gate (PRESERVE 5).
5. **The calm motion and the zen fade.** The session chrome fades after 7 s, and reduced motion swaps every translate
   for opacity (code: `Summary.tsx:176–177`, `FocusScreen.tsx:110`).
6. **The sound design.**
   - Every sound effect is normalised to its target loudness: measured equal to target for all 21 effects (offline,
     `evidence/audio/`).
   - The whistle ("complete") is the loudest event, at −15 LUFS momentary, peak −6.9 dBFS, no clipping.
   - Ambiences sit at −16/−17 LUFS integrated, the kettle simmer at −30.
   - The levels are deliberate and correctly ranked.
7. **Accessibility discipline:**
   - one live region per event;
   - hit-testable controls;
   - axe-clean tablet states;
   - visible focus rings;
   - text that reflows at 200 % (the round-7 review covers this in depth).

## 3. The most consequential shortcomings

Ranked by user impact × how often it is seen.

| # | Shortcoming | Type | Seen by |
|---|---|---|---|
| S1 | **The 3D Chai is off-model** (a teddy bear or bear cub, not the approved capybara) | DEFECT against PRESERVE 2 | Everyone who opens the Nook, and the Focus backdrop when 3D runs |
| S2 | **The 3D-off and loading backdrop drops every earned item.** The room the user built disappears whenever 3D is off, loading, or on a device without WebGL | DEFECT against I09 "recognizable persistent outcome" | Every brew start until 3D loads; always with 3D off |
| S3 | **The summary does not rank rewards, and on small phones it crops the celebration** | USABILITY | Every completed brew |
| S4 | **Layout outside the phone:** tablet dead bands, a sparse desktop Focus, 11 px status labels against a 36 px greeting | TASTE / USABILITY | Tablet and desktop users |
| S5 | **The weak-GPU 3D tier looks worse than the drawing it replaces** (soft, matte, 1.25 px per CSS px) | TASTE, with a performance trade-off | Low-end phones, and any device after the adaptive drop |
| S6 | **The static Nook still says "Drag to look around · tap things"**, but the drawing can't be dragged or tapped | DEFECT (false affordance) | Everyone with 3D off or without WebGL |


## 4. Findings by area

Each finding gives:
- the screen and evidence;
- what is weak and why it matters;
- a concrete improvement;
- benefit, effort and risk;
- how to verify it.

Verified defects, usability problems and taste are kept apart. Evidence paths are relative to `evidence/`.

### 4.1 Usefulness (does it help someone focus and rest?)

| ID | Type | Screen and evidence | Weak, and why it matters | Improvement | Benefit / effort / risk | Verify |
|---|---|---|---|---|---|---|
| U1 | USABILITY | Home at 390×844 and 375×667. `sheets/390x844-*`, `01-home`. axe `target-size` (serious) on the selected Brew length segment. Measured at 390×844 dark: the Brew length buttons are at y 657–705, the docked start at y 676–736 | **The Brew length row starts half under the docked "Put the kettle on".** It is reachable by scrolling (accepted K01), and "Change brew length" sits under the button, but on arrival the control reads as cut off and fails WCAG 2.5.8 at its resting position | Wave 1 owns this (I04; round-6 follow-up class). Proposal: a 16–24 px dock-aware bottom spacer after the composer, so the resting layout never puts a control under the dock. Or move the duration row above the task chips on short screens. **Do not reopen K01 without the I04 owner** | High / S / low (layout only; K01 regression risk) | axe 0 `target-size` at 375×667, 390×844 and 844×390; Brew length rect fully above the dock rect on arrival; K01 REFERENCE→BEFORE→AFTER |
| U2 | USABILITY | Summary, every size. `07a-summary-settled`, chip metrics in `meta.json`: 5 chips, all 38 px high, the same `rgb(252,244,233)` background, the same weight 700 | **No reward hierarchy.** "+40 leaves", "Goal met", "23 days warm", "Recipes 1/3" and "144 leaves to level 13" look equal. The two facts a person cares about after a brew (time and leaves) aren't separated from bookkeeping, and a milestone such as "7 days warm, your best yet" (unlock path, 390×844) **starts half under the footer** | One **primary line** under the title: "+40 leaves · goal met". Then **at most two** secondary chips chosen by salience (a milestone > goal met > recipes > level distance). The rest goes into the existing "How your leaves added up". Milestones get the accent treatment the unlock card already uses. **I07's territory: one explanation at most, arithmetic on demand** | High / M / medium (touches I07 and K02; preserve exact-once rewards) | At 375×667, 390×844, 820×1180 and 1440×900, the first viewport shows minutes, leaves and any milestone with no scroll. Reward arithmetic unchanged (unit tests). K02 REFERENCE→BEFORE→AFTER |
| U3 | USABILITY | First visit, 390×844. `00-first-visit` | **Strong:** a 15-minute brew in one tap, task optional, setup deferred. **Weak:** "Hi, I'm Chai. Let's start small: one 15-minute brew. I'll keep you company." doesn't say *what happens after*, the tea break, which is the product's promise (I08) | One short purpose line: "Focus for 15 minutes, then a tea break. Chai keeps you company." **I08's territory; copy only** | Medium / XS / low | An unfamiliar tester can say "focus then a break" after 5 s. 375×667 still fits without scrolling |
| U4 | — | Focus, pause, resume, End sheet, whistle, Tea time: every size | **Works and is clear.** Pause shows "The kettle will wait", the End sheet is honest ("your minutes still count"), Tea time is blue and readable. No change advised. The End sheet's "will be saved" wording while storage is full is a known round-7 follow-up (R7-13), not repeated here | — | — | — |

### 4.2 Visual design

| ID | Type | Screen and evidence | Weak, and why it matters | Improvement | Benefit / effort / risk | Verify |
|---|---|---|---|---|---|---|
| V-a | TASTE | Focus at 820×1180. `sheets/820x1180-light.png`, `02b`, `07a` | **The tablet uses the phone column, stretched.** The stage takes the top half. Below it, digits, controls and then about 35 % empty cream. The summary sheet has a large empty gap between the details toggle and Tea time. It reads unfinished on the device class most likely to sit on a desk during focus | A tablet breakpoint (≥ 768 × ≥ 1000) that uses the **desktop two-column composition** (stage left, panel right). Or keep one column but scale the readout block (digits about 1.4×) and vertically centre it in the remaining space. Summary: anchor the footer to the content, not the viewport bottom | Medium / M / low | 820×1180 light and dark: no empty band > 15 % of viewport height; stage, digits and controls visible together; reach and K01/K02 unchanged on phones |
| V-b | TASTE | Desktop Focus at 1440×900. `1440x900-light-static/02b-focus-mid.png` | **A sparse right panel**, as in phase-1 V5, now confirmed live. 130 px digits, a 14 px status line and 62–80 px controls float in about 560 px of cream. The zen fade (correctly) removes the chrome, so nothing else is there | Size the controls with the digits (Pause 96, Add 5 / End 76). Bring the cycle dots and the "whistles at" line into one compact block under the digits. Optionally show the user's task title (when set) above the digits in small caps, which supports focus without adding chrome | Medium / S / low | 1440×900: the panel's content block is ≥ 45 % of the panel height; the controls' hit areas grow; the zen fade still hides chrome after 7 s |
| V-c | TASTE | Home status bar, every size. `meta.json` `01-home.type` | **Status labels are 11 px** ("days warm", "leaves", "Level 12", weight 800) under 20 px numbers, against a **30 px (phone) / 36 px (desktop) greeting**. Confirms phase-1 V6. At desktop scale they read as fine print | 13 px labels on all sizes (12 px is the floor at 200 % reflow anyway). Or drop the word labels on desktop for an icon tooltip | Low / XS / low | Computed size ≥ 13 px; status-bar height unchanged at 375×667 (I04 "tight" step) |
| V-d | TASTE | Status-bar icons (phase-1 V7) | **Mixed icon styles.** An illustrated mug, a flat leaf and a sun badge | Keep. They are recognisable and on-brand, and unifying them is low value. **ACCEPTED as taste** | — | — |

### 4.3 Chai and brand

| ID | Type | Screen and evidence | Weak, and why it matters | Improvement | Benefit / effort / risk | Verify |
|---|---|---|---|---|---|---|
| C1 | **DEFECT** (PRESERVE 2) | Nook and Focus backdrop (3D). **`crops/chai-compare.png`**: painted (approved) vs 3D vs the static SVG | **The 3D Chai is off-model.** It has a square loaf (`chai.ts` W = H = 0.8), a **cream snout patch**, button eyes and no brows, so it reads as a teddy or bear cub. The approved Chai is a tall loaf with a blunt dark nose and high, small, browed eyes. Cause [V]: `chai.ts:1–3` says it was "built like the 2D mascot (`src/art/Mascot.tsx`)", the **legacy vector mascot**; it was last changed in `e0d3cf6`, before the approved sheet (round 6, `eeff3a0`). The static SVG Chai is on-model, so the drift is 3D-only | **Retune `chai.ts` to the approved silhouette.** Loaf height:width about 1.3:1. No cream snout; a dark blunt nose on a slightly lighter muzzle *tone*. Brows on the eye sprites. Ears on the upper sides. Yuzu leaf angle as on the sheet. Geometry and material only; no textures needed. **Needs Vibei's art approval (PRESERVE 2), against a turnaround sheet first** | **High** / M / medium (art approval; the 3D sleep/sip/awake poses must keep reading) | A side-by-side at Nook close-up framing against `art-src/chai/chai-sheet-approved.webp`. 5 blind viewers pick "same character" ≥ 4/5. No frame-time regression |
| C2 | DEFECT (I06) | Focus stage, tablet and desktop. `meta.json`: the painted poses' delivered-vs-needed pixels | **The approved poses are below display resolution on DPR-2 screens: upscale 1.19×** (reading, cheering, sipping; 820×1180 and 1440×900), and 1.09× at DPR 3. That confirms phase-1 flag 1 live. Visible as slight softness at the edges on desktop | **Higher-resolution masters of the same poses** (Vibei generates them on the website; prompts in §6.3). Then raise `SHEET_REF_H` proportionally | Medium / M (generation + approval) / medium (fidelity drift) | Every Chai pose's upscale ≤ 1.0 at 1440×900@2 and 390×844@3 (the `meta.json` `imgs[].upscale` metric); overlay ≤ 2 % silhouette deviation |
| C3 | TASTE | Focus frame, every size. `02b-focus-mid` | **Three rendering styles in one frame** (phase-1 V1, confirmed): painted Chai, a flat vector kettle with one gloss, a soft 3D room. The blur and the shared palette hold it together, so it reads "storybook", not broken. The kettle is the flattest element and the one that tells the time | Give the kettle **two painted shading passes** in its existing SVG: a soft core shadow on the body and a warm bounce under the lid. Same silhouette and gauge, so PRESERVE 3 is untouched. Leave the room as is. **Optional; it needs Vibei's art approval** | Medium / S / low–medium | REFERENCE→BEFORE→AFTER of Focus at 390 and 1440, light and dark. The gauge stays legible at 16 px |
| C4 | — | Home, Welcome, End sheet, Stats | **Chai's voice and poses are consistent** (sipping on Home in the afternoon, concerned on End, look on Stats) | — | — | — |

### 4.4 Artwork at real display sizes

Measured per visible image: delivered pixels ÷ (CSS box × DPR); see `meta.json` `imgs[].upscale`. Above 1.00 means
below display resolution.

| Asset | 390×844@3 | 375×667@2 | 820×1180@2 | 1440×900@2 | Verdict |
|---|---|---|---|---|---|
| Chai reading / cheering / sipping (stage) | 1.09 | 0.70 | 1.19 | 1.19 | **Below on DPR-2 tablet and desktop, and DPR-3 phones** (C2) |
| Chai sipping (Home hero) | 0.67 | 0.45 | 0.45 | 0.61 | OK |
| Window still (3D off / loading) | 0.99 | — | — | **1.40** | Below on desktop, masked by an intentional blur (phase-1 flag 2); also missing items (S2) |
| 3D canvas backing store | 1.25 px per CSS px everywhere (low tier) | | | | **Soft on DPR 2–3.** The high-tier cap is 1.5 (mobile) / 2 (desktop), so real GPUs do better. Needs a real-device check |
| Static SVG room | vector | vector | vector | vector | **Crisp everywhere** |

### 4.5 The 3D Nook

| ID | Type | Screen and evidence | Weak, and why it matters | Improvement | Benefit / effort / risk | Verify |
|---|---|---|---|---|---|---|
| N1 | **DEFECT** (I09) | Focus backdrop with 3D off vs on. **`crops/backdrop-3d-vs-still.png`** (390×844 dark). Code [V]: `scene/Fallback.tsx:23–24` "base room without unlocked items"; `NookStatic` window mode ignores `items` | **The still loses every earned item:** fairy lights, shelf, plant, books, record player. The user's room "un-builds" whenever 3D is off, loading (cold start of every session) or unsupported. That undercuts I09's "recognizable persistent outcome" | **Item layers for the window view.** Render each window-visible item from the engine's window camera as a transparent layer per time of day: about 10 visible items × 4 times = 40 small WebPs, or per item if lighting allows. Composite only the earned ones over the base still in CSS. Same camera and framing, so it matches the live view. Free and deterministic (`scripts/stills/render-window-stills.mjs` already renders this camera) | **High** / M / low | With 3D off: every earned item that is visible in the live window view appears in the still at the same position (±4 px at 1250×1000); the size budget for the layers ≤ 300 KB total, lazily loaded |
| N2 | DEFECT (false affordance) | Static Nook, 390×844 dark. `390x844-dark-static/10-nook.png`. Code [V]: `NookScreen.tsx:155–164` shows the hint whenever it hasn't been dismissed; the static room has no canvas and no handlers (`scene/index.tsx:30`) | "**Drag to look around · tap things**" is shown over a drawing that can't be dragged or tapped | Show the hint only when the live scene is mounted (expose `isLive` from `Nook`). In static mode, use "Your earned things are below" or nothing | Medium / XS / low | 3D off: the hint is absent. 3D on: unchanged |
| N3 | TASTE (+ performance trade-off) | Nook, every size (low tier under SwiftShader). Phase-1 §2 (no environment map; Lambert at low tier; 768/1024 shadow maps) | **The low tier reads matte and soft**, and on weak GPUs it looks worse than the static drawing it replaces. The adaptive drop from high to low is a **visible step** (shadows and standard materials vanish) | **(a)** On high: a procedural `RoomEnvironment` through PMREM, so soft reflections on the kettle, mug and lamp at no file cost. **(b)** On low: keep the 3D but add a baked "contact shadow" decal under each item, so the step is gentler. **(c)** If a device drops to low **twice** in a session, switch to the static drawing with a crossfade, which is better-looking at zero GPU cost | Medium / M / medium (perf; test on real low-end Android) | On a real mid-range phone: no visible pop on the drop (video); frame time p95 ≤ 20 ms on high; a blind preference low-tier-3D vs static ≥ static |
| N4 | — | Nook interaction (390×844 light and tablet): drag rotated the view (`10b`), tap zoomed the item (`10c`, close-up on the stove) | **Works.** Drag and tap behave as advertised with 3D on | — | — | — |
| N5 | USABILITY | Early Nook (phase-1 V9) | Not re-walked live this round (the veteran profile has 10 of 14 items). The phase-1 finding stands as [I] | See direction C | — | `newbie` seed, 390 and 1440 |

### 4.6 Motion and sound

**Motion** (code plus timed stills; the webm clips at 390 light and 1440 light are in the evidence index):
- **The whistle → summary handoff is staged.**
  - +1.3 s: the whistle frame, "0:00 Tea's ready!", Chai cheering.
  - +2.8 s: the summary sheet is up, Chai still cheering above it.
  - Content enters with a 0.42 s ease-out and a 60 ms stagger; under reduced motion, an opacity-only 0.22 s
    (`Summary.tsx:176–177`).
  - It is calm and correct. **No change advised.**
- **The zen fade** (7 s) makes Add 5 / End and their captions faint during focus. That is intentional calm; the
  controls stay hit-testable.
- **Reduced motion** (390 light and 1440 dark): content appears without translate. The only animations still running
  are CSS opacity transitions and SVG steam ellipses (`endsheet-anim.mjs` probe). That is acceptable under
  WCAG 2.3.3 (no large motion).
- **The quality-tier step in 3D** (N3) is the one motion problem worth fixing.

**Sound** (offline measurement through the app's own graph; **I could not listen**):
- Every sound effect hits its target loudness exactly. The ranking is right: the whistle at −15 LUFS momentary is the
  loudest, taps at −30, ambiences −16/−17, the simmer −30.
- No clipping anywhere: the peak is −3.6 dBFS (fire, lofi) and the whistle peaks at −6.9.
- **Phone-speaker check:** brown noise loses 5.5 LU above 250 Hz (−22.5 LUFS on a "phone" vs −17 full-band). On
  phone speakers it will sound noticeably quieter than rain or fire.
  - Improvement: a +3 dB phone-band trim for brown, or a gentle 300–600 Hz shelf.
  - Benefit low, effort XS, risk low. Verify `phone` LUFS within ±2 LU across ambiences.
- **Needs a human listening check:**
  - the whistle's character (a real kettle vs an alarm);
  - lofi on a phone speaker;
  - fire crackle density;
  - the 40 s simmer before the whistle.

### 4.7 Reliability

- **Core flow:** 0 page errors and 0 console errors in every completed walk. The integration build's suites are green:
  chromium 72/72, timer 29/31 with 2 skips by design, vitest 267/267 (round-7 Lane D, the same code paths).
- **Accessibility:** axe WCAG 2.2 AA found 0 violations across 17 tablet-dark states, and 1 at 390×844 light (U1,
  target-size).
- **3D under load:** in heavy software rendering, some 1440×900@2 walks timed out on screenshots, and the 3D engine
  dropped to the low tier in every run.
  - That is expected for SwiftShader, not a product failure.
  - It does show the adaptive drop works.
  - Real-device performance remains unverified [I].
- **Summary at 375×667 shows an empty backdrop** (a plain pale gradient above the sheet) where 390×844 shows the room
  (`375x667-light/07a-summary-settled.png` vs `390x844-light/07a`). The canvas is present (375×223), so the cause is
  likely framing in summary mode at short heights [I]. Combined with the sheet height, the celebration frame is mostly
  empty sky plus a cropped Chai (S3).
- **Known Wave 1 items are not repeated here:** R7-D1, the storage warning and the toast follow-ups. See
  `CHECKER-integration-fix-r7.md`.


## 5. Phase-1 findings, checked live

| Phase-1 finding | Live result | Evidence |
|---|---|---|
| V1: three art styles in one frame | **Confirmed.** It reads as storybook rather than broken; the kettle is the flattest element (C3) | `02b-focus-mid` at every size |
| V10 / §2: the 3D Chai reads as a teddy bear | **Confirmed, and the cause found:** it was built from the legacy vector mascot, before the approved sheet (C1) | `crops/chai-compare.png`; `chai.ts:1–3`; git history |
| Nook materials and pixel density | **Confirmed at the low tier.** The canvas is 1.25 px per CSS px in every run; matte, no environment map. The high tier is unverifiable without a GPU [I] | `meta.json` canvases; N3 |
| Flag 2: window stills miss earned items | **Confirmed live, and it is worse than a resolution issue:** the room loses fairy lights, shelf, plant, books and record player (N1). The still is also 1.40× below resolution at 1440×900@2, masked by blur | `crops/backdrop-3d-vs-still.png`; `meta.json` |
| V2: the summary crops the cheering Chai | **Confirmed at 375×667** (head and paws only; kettle lid and dial). **Not at 390×844**, where Chai is whole. At 375×667 the backdrop is also empty (§4.7) | `375x667-light/07a`; `390x844-light/07a` |
| V3: equal-weight chips | **Confirmed by measurement.** 5 chips, identical height, background and weight (U2) | `meta.json` `07-summary.chips` |
| V12: landscape Focus drops the "min brewed · whistles at" line | **Confirmed visually.** The line is in the DOM but not shown at 844×390 | `844x390-light-land/02b-focus-mid.png`; `meta.json` `statusLine` |
| V13: landscape Home dock covers Brew length | **Confirmed. The whole segmented control is behind the dock** at 844×390 (Brew length buttons at y 279–327, dock at y 290–350). This is the I04 class; a Wave 1 follow-up owner exists | `844x390-light-land/01-home.png` |
| V5: sparse desktop Focus | **Confirmed** (V-b) | `1440x900-*/02b` |
| V6: tiny desktop status labels | **Confirmed: 11 px** on desktop and phone (V-c) | `meta.json` `01-home.type` |
| Flag 1: poses below resolution | **Confirmed: 1.19× on DPR 2, 1.09× on DPR 3** (C2) | `meta.json` `imgs[].upscale` |

## 6. Asset routes

### 6.1 Best route per upgrade

| Upgrade | Best route | Why this route | Budget and fallback |
|---|---|---|---|
| Earned items in the 3D-off / loading backdrop (N1) | **Deterministic engine render** (Three.js, offline): item layers from `render-window-stills.mjs` | The camera already exists; zero generation; pixel-exact with live 3D | About 40 WebP layers, ≤ 300 KB total, lazy; fallback is today's base still |
| On-model 3D Chai (C1) | **Three.js geometry and material work** in `chai.ts`, with Blender optional only if procedural shapes can't reach the silhouette | Procedural keeps it tiny and pose-able (nap, sip, awake). Blender adds a `.glb` and a loader | Procedural: +0 KB. A Blender route: ≤ 150 KB `.glb` (meshopt), ≤ 3k tris, 1 × 256² KTX2 or vertex colours; fallback is the current procedural Chai |
| Sharper painted Chai (C2) | **New images** (Vibei on the website; prompts in §6.3) | The masters equal the delivery size; there is no higher source | ≤ 60 KB WebP per pose at about 1,200 px tall; fallback is the current WebP |
| Kettle depth (C3) | **Improve the SVG** (two painted shading layers as SVG gradients) | It keeps the kettle a crisp vector at any size and keeps PRESERVE 3 | +2–4 KB; nothing to fall back |
| Hero Nook items (e.g. the record player, kettle, lamp) | **Blender → `.glb`** on Vibei's PC through the Blender MCP connector, **only if** direction B is chosen | Real bevels, materials and baked AO read better in close-up (unlock card, showcase) than procedural boxes | Per item: ≤ 3–5k tris, ≤ 250 KB (meshopt + KTX2 512²), loaded after unlock; procedural item on failure or low tier; decoders self-hosted in `public/` for offline PWA |
| Environment reflections (N3a) | **Three.js** `RoomEnvironment` + `PMREMGenerator` | Procedural, with no files | +0 KB; high tier only |
| Quality step (N3b/c) | **Three.js plus the existing SVG room** | It reuses the best-looking asset already shipped | 0 KB |
| Whistle → summary motion | **Deterministic animation** (keep `motion/react`) | It already works; no video needed | — |
| Marketing loops or onboarding demo (not in-app) | **Short video** from real captures (as Ad 01/02) | Only if Vibei wants a store or site loop | Outside the app bundle |

### 6.2 The Blender workflow (only if direction B is chosen)

1. **Vibei's PC:** Blender with the Blender MCP connector.
2. **Model per item:**
   - match the procedural item's footprint and pivot (from `items.ts`);
   - one material, baked AO into vertex colour or a 512² texture;
   - triangulate; apply transforms; Y-up.
3. **Export:** glTF 2.0 binary (`.glb`) with meshopt compression (the `gltfpack -cc` equivalent) and KTX2 textures.
   - **Names:** `nook-<itemId>.glb`.
4. **Vibei pushes** the `.glb` files to a branch, under `kettle/public/models/` (the PWA caches them).
5. **Code (a maker):**
   - `GLTFLoader` with `MeshoptDecoder` (wasm self-hosted) and `KTX2Loader`;
   - load after the item is unlocked and the engine is idle;
   - replace the procedural mesh at the same transform;
   - keep the procedural one on failure, on the `low` tier, and when 3D is off.
6. **Acceptance per item:**
   - ≤ 250 KB;
   - ≤ 5k tris;
   - no frame-time regression;
   - a REFERENCE→BEFORE→AFTER close-up in the unlock card at 390×844 and 1440×900, light and dark.

### 6.3 Prompts for higher-resolution Chai poses (Vibei runs these on the website; not run here)

Phase 1 §4 holds the base prompt. Refinements from the live check:

- **Poses, in priority order:**
  1. reading (Focus; most seen);
  2. cheering (whistle and summary);
  3. sipping (Tea time, Home);
  4. stretch (Break's over).
- **References, attached in this order:**
  1. `kettle/art-src/chai/chai-sheet-approved.webp`;
  2. the pose master `kettle/art-src/chai/chai-<pose>.png`;
  3. a **live crop of the pose in the app at 1:1**, e.g. `evidence/crops/chai-compare.png` left panel. This is the
     anchor for proportions as actually displayed.
- **Dimensions:** **2048 px tall**, portrait, centred, about 6 % margin.
- **Transparency:**
  - **GPT Image:** transparent PNG.
  - **Nano Banana Pro:** flat **#FF00FF** background, then matte with `review/round-6-mockups/build/extract-chai.py`.
- **Prompt:** phase 1's text, plus this sentence: "Keep the exact eyebrow shape and the eye spacing of reference 3;
  keep the muzzle the same brown as the face (no cream patch); the book, mug or raised paws exactly as in reference 2."
- **Acceptance checklist** (all must pass before anything replaces an asset):
  1. **Silhouette:** overlay on the master at the same height; deviation ≤ 2 % of height. Yuzu-leaf angle, eye, nose
     and blush placement unchanged.
  2. **Detail:** at 1440×900@2 and 390×844@3 in the app, the upscale metric is ≤ 1.0 for every pose.
  3. **Edges:** view on `#FFF9F0` and `#221829` at 100 %, at 40 px, and at 4× for halos. No magenta fringe.
  4. **Weight:** WebP q80, alpha 100, ≤ 60 KB per pose at about 1,200 px delivery.
  5. **Consistency:** the four poses side by side read as one character (5 blind viewers).
  6. **Vibei's approval.** PRESERVE 2 bars unapproved replacement art.


## 7. Three upgrade directions

All three keep PRESERVE 1–13:
- identity and colours;
- the approved Chai;
- the kettle state;
- the continuous ritual;
- the voluntary first action;
- the working controls;
- the accepted layouts;
- the unlock;
- progression;
- the destinations;
- user data.

None adds currency, accounts or tracking.

### A. "Calm clarity": hierarchy and composition (recommended first)

- **Feeling:** the app already knows what matters, and the screen agrees. Quieter, more confident, nothing cut off.
- **Visible changes:**
  - **Summary:** one primary result line plus up to two ranked chips. A milestone leads when there is one. The
    celebration frame is never cropped on 375×667 (U2, S3).
  - **Tablet:** the desktop two-column composition. Focus and summary without dead bands (V-a).
  - **Desktop Focus:** controls and readout sized as one block (V-b).
  - **Home:** status labels at 13 px (V-c). Brew length never under the dock, coordinated with Wave 1's I04 owner (U1).
  - **First visit:** one purpose line (U3).
  - **Static Nook:** no false "drag" hint (N2).
- **Preserved:** every art asset as is, all reward arithmetic, K01/K02 structure, Tea time's primacy, the zen fade.
- **Trade-offs:** it doesn't fix the off-model 3D Chai or the empty still. It touches I07 and I08 territory, so it needs
  those contracts' framing. Wave 2 isn't started, so these would be scoped as Wave 2 work when Vibei starts it.
- **Production work:** code only (CSS layout, one summary component, copy). No art and no generation. About 2–3 maker
  days across 2 non-overlapping makers.

### B. "One Chai, one room": coherence of the world

- **Feeling:** the same Chai and the same room everywhere: Focus, summary, Nook, loading, 3D off. What you earned is
  always there.
- **Visible changes:**
  - **3D Chai** rebuilt to the approved silhouette (C1).
  - **Window stills** carry earned items through engine-rendered layers (N1).
  - **Painted poses** at 2048 px, so they're crisp on desktop and tablet (C2).
  - **Kettle:** a soft painted shading pass in SVG (C3).
  - **Weak devices** that keep dropping quality fall back to the static drawn room, crossfaded (N3c).
- **Preserved:** the approved Chai, *more* faithfully; the room layout and items; the unlock close-up; the stage
  composition.
- **Trade-offs:**
  - It needs Vibei's art approvals: the 3D Chai turnaround and the new pose masters.
  - Some website generation, done by Vibei.
  - Some 3D performance testing on real devices.
- **Production work:**
  - Three.js (Chai geometry, about 1–2 days);
  - an offline render script for item layers (about 1 day);
  - image generation and matte by Vibei, then integration (about 1 day);
  - SVG shading (about 0.5 day);
  - real-device checks.

### C. "The Nook as a living room": depth of the reward place

- **Feeling:** the Nook becomes a place you want to visit: richer materials, a few hero objects modelled with care,
  gentle light.
- **Visible changes:**
  - **High tier:** environment reflections (N3a).
  - **Hero items:** 3–4 Blender items (record player, kettle, lamp, bookshelf) as `.glb`.
  - **Tier step:** contact-shadow decals, so the step is smaller (N3b).
  - **Early Nook:** leads with "the next cozy thing" and fewer locked placeholders (phase-1 V9).
- **Preserved:** procedural items as fallback, the static room, the unlock flow, all rules.
- **Trade-offs:**
  - The highest effort and risk: asset pipeline, decoder wasm, bundle and PWA cache, GPU cost.
  - The benefit is concentrated in one destination; most time is spent in Focus, not the Nook.
- **Production work:**
  - Blender modelling on Vibei's PC (about 1–2 days per hero item);
  - loader and fallback code (about 2 days);
  - real-device performance passes.

### Recommendation

1. **Start with A**, then do **B's two cheapest, highest-value pieces** in the same round:
   - **N1:** earned items in the still, engine-rendered and free;
   - **N2:** the hint fix, an XS change.
2. **Schedule the rest of B** as soon as Vibei approves a 3D Chai turnaround (C1). That is the single largest
   brand-fidelity fix.
3. **Defer C** until real-device performance data exists.

**Why A first:**
- It fixes what every user sees after every brew (the summary) and on every non-phone screen.
- It needs no art approval and no spend.
- Its acceptance can be measured exactly with the metrics this audit already collects.

## 8. First improvement round: 4 changes, bounded

All four are proposals for when Vibei authorises the work. **None is started.**

| # | Change | Files (expected) | Acceptance criteria |
|---|---|---|---|
| R1 | **Summary hierarchy** (U2, S3). A primary result line; ≤ 2 ranked secondary chips (milestone > goal > recipes > level); the remainder in "How your leaves added up"; the celebration frame uncropped at 375×667 | `screens/done/Summary.tsx`, `summary.ts`, `Summary.module.css` | <ul><li>First viewport at 375×667, 390×844, 820×1180 and 1440×900, light and dark: minutes, leaves and any milestone visible without scrolling.</li><li>Chai's cheering pose ≥ 85 % visible at 375×667.</li><li>The reward arithmetic unit tests unchanged and green.</li><li>The final expanded line still clears the Tea time / Skip footer (PRESERVE 7).</li><li>K02 REFERENCE→BEFORE→AFTER.</li><li>axe 0.</li></ul> |
| R2 | **Tablet and desktop composition** (V-a, V-b). The two-column layout at ≥ 768×1000; the desktop readout and controls as one block | `screens/focus/FocusScreen.module.css`, `Summary.module.css` (layout only) | <ul><li>820×1180 and 1440×900: no empty band > 15 % of the viewport in Focus, summary or Tea time.</li><li>Phone layouts pixel-identical (diff 0 % at 390×844 and 375×667).</li><li>Reach at 200 % unchanged (`break-reach.spec`).</li><li>Zen fade intact.</li></ul> |
| R3 | **Earned items in the 3D-off / loading backdrop** (N1) | `scripts/stills/*` (layer render), `scene/Fallback.tsx` (composite), `src/scene/stills/items/*.webp` | <ul><li>With 3D off and `veteran` at 390×844 and 1440×900, every earned window-visible item appears in the still at its live-3D position (±4 px at 1250×1000).</li><li>Layers ≤ 300 KB total, lazy.</li><li>No layout shift (CLS 0) when 3D replaces the still.</li></ul> |
| R4 | **The static Nook hint and the small text fixes** (N2, V-c, U3) | `screens/nook/NookScreen.tsx`, `scene/index.tsx` (expose `isLive`), `screens/home/StatusBar*`, `screens/welcome/WelcomeScreen.tsx` (one line) | <ul><li>3D off: no "drag" hint. 3D on: unchanged.</li><li>Status labels ≥ 13 px with the status-bar height unchanged at 375×667.</li><li>The first-visit purpose line fits at 375×667 without a scroll.</li><li>I08's copy is reviewed by its owner.</li></ul> |

**Process (bounded, mirrors the Product Excellence protocol):**
1. **Makers, in parallel because their files don't overlap:**
   - **M-A:** R1 and R4.
   - **M-B:** R2 and R3.
   - Each gets a budget of **one day**, and each returns READY FOR REVIEW with:
     - REFERENCE→BEFORE→AFTER at 390×844, 375×667, 820×1180 and 1440×900, light and dark, with a frozen clock;
     - the metrics above, taken with this audit's `walk2.mjs`;
     - unit, chromium and timer suites as passed/total.
2. **One independent Checker** (a fresh agent) reviews the trial merge against the criteria: APPROVE or REJECT.
3. **At most one fix round** for blockers named in the REJECT, then a targeted re-check.
4. **If it is still red:** stop and report to Vibei. There is no third round.
5. **Merge only on APPROVE**, followed by the regression (unit, chromium, timer and PWA suites, and the capture set).

## 9. Independent critic

<!-- CRITIC PENDING -->

## 10. What I need from Vibei, and the decisions to make

**Inputs needed:**
1. **Art approval for the 3D Chai** (C1). Yes or no to retuning `chai.ts` to the approved silhouette. If yes, approve a
   turnaround render (front, ¾, side) before it ships.
2. **Higher-resolution pose masters** (C2), if wanted. Run §6.3's prompts on the website, pick candidates against the
   checklist, and push the PNGs to a branch.
3. **A real-device check:** 10 minutes on a phone and a laptop.
   - Does the 3D Nook stay on the high tier?
   - Does the whistle sound like a kettle?
   - Is brown noise too quiet on the phone speaker?
4. **Blender**, only if direction C is chosen: confirm the Blender MCP connector on your PC and which 3–4 hero items to
   model first.

**Decisions:**
1. **Direction:** A (recommended), B or C. Or A plus B's quick wins, as recommended.
2. **When:** these map onto Wave 2 contracts (I06, I07, I08, I09). Start them as Wave 2, or as a separate small round
   after Wave 1 closes?
3. **The kettle shading pass** (C3): wanted, or keep today's flat kettle? It's taste, and the current one is accepted.
4. **Weak-GPU behaviour** (N3c): may Kettle switch to the drawn room when a device repeatedly can't hold the 3D high
   tier?
5. **Round 7** (separate, from the Wave 1 review): round 8 for R7-D1, or rule toasts at landscape 200 % acceptable. See
   `review/product-excellence/contracts/I04/integration-fix/round7-review/DEFECT-PACKET-R7.md`.




