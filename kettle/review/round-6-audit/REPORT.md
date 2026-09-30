# Kettle quality audit, round 6: advice only, nothing implemented

**Scope.** No app code was changed and no paid generation was submitted. The only costs were free estimate calls.

**Method.**
- The build was walked end to end in a browser, frame by frame where timing mattered.
- The design skills were used as lenses: Impeccable critique heuristics and its detector, ui-ux-pro-max, taste-skill, and GSAP timeline guidance.
- Instead of the Impeccable playbook's two sub-agents, a single independent critic challenged the draft (your instruction wins). This is `⚠️ DEGRADED: single-context` in Impeccable's terms.
- Evidence boards are in `evidence/`, raw captures in `shots/`, and the pre-critic draft in `initial-audit.md`.

## 0. What was reviewed (verified)
- **Build.** HEAD `e8b9752`; the app source is unchanged since `210e750`. Everything after that commit is marketing and review files.
- **Preview.** The private preview (claude.ai artifact, version `1790748177-130a`) is byte-identical, ignoring whitespace, to a fresh single-file build of HEAD. It is the current app.
- **Capture setup.**
  - Production build (`vite build` + `vite preview`).
  - Chromium with software WebGL.
  - Seeds: `fresh`, `blank`, `newbie`, `celebrate`, `veteran`, `atRisk`.
  - Phone 390×844, small 320, landscape 844×390, tablet 820×1180, desktop 1024 / 1280 / 1440 / 1920.
  - Light and dark themes, reduced motion, 3D off (static room).
- **Tests run today:**

  | Suite | Result |
  |---|---|
  | Unit | 249/249 |
  | Functional (critic plan) | 97 passed, 1 skipped (it needs a built service worker) |
  | e2e | 29 passed, 2 skipped |
  | axe (24 screen/theme states) | 0 violations |
  | Impeccable detector | 8 minor findings: bounce-easing name matches and width transitions, previously judged intentional |

**What I could not verify:**
- I cannot hear audio. Sound findings are measured (spectrum, level, length), not listened to.
- Real devices: I did not check iPhone Safari as an installed web app (notifications, background timing), Android mid/low-end 3D frame rate, heat and battery over a 50-minute brew, wake lock, haptics, or VoiceOver / TalkBack.
- Motion was checked by deterministic frame capture, not at real speed on a phone.

## 1. Candid assessment
Kettle is well engineered, reliable and accessible:
- a real timer engine;
- cross-tab safety;
- backups;
- zero axe violations;
- reduced motion that works;
- 375 automated tests passing.

The idea is genuinely good: put the kettle on, it whistles, tea time.

The finished product doesn't yet deliver that idea at the moments that matter. On Focus, the kettle is a 60 px prop in a diorama above a generic ring timer. At completion, the whistle lasts 1.25 s. The climax is played by a second, 2D Chai inside the ring while the 3D Chai sleeps in the room. The reward then arrives as up to five full-screen cards.

Around that, the app has grown every habit-app system (streak, leaves, levels, recipes, tiered badges, Tea Cozies, a collection). The surface reads as a competent, cute productivity kit: rounded bordered cards of similar weight, and a plum dark theme. It doesn't yet read as a distinctive ritual.

That gap, not polish, is what separates it from the standard you imagined.

## 2. Strongest elements to preserve
- **The metaphor and the voice.** "Put the kettle on", "Tea's ready", "Leave the kettle early? That's okay." The copy is kind and specific.
- **Chai's recognisers:** the yuzu with its leaf (the strongest), the loaf body, chai-brown fur with a darker snout, the big oval nose, the blush, small high eyes. The flat, no-outline shape language.
- **The nook as a place.** Warm lamp light, fairy lights, rain on the window, the kettle on the stove. It is lovely on desktop Nook (`evidence/5-nook.png`). The steam already scales with progress in `Engine.ts`.
- **Reliability and accessibility,** as listed above.
- **The light theme,** which is warmer and clearer than dark. **Reduced motion,** which gives calm, complete states.

## 3. Findings

### 3a. Verified defects
| # | Where / evidence | What is wrong | Fix | Effort · risk | How to verify |
|---|---|---|---|---|---|
| D1 | Nook at 1024–1920 px (`evidence/5-nook.png`; `shots/nook-1280-light-scrolled.png`) | The level card and item grid scroll over the sticky room. The tiles are about 300×240 px with 40 px glyphs. **Cause:** `.root` is its own size container, so `@container (min-width:860px) { .root {…} }` never applies. A container can't query itself. The sticky rule and 3-column grid inside that same block do apply. | Move `container-type` to a wrapper; size the tiles to their content | Minutes · low | Capture 1024 / 1280 / 1440 / 1920 top and scrolled: room and panel side by side, no overlap, glyph ≥ 48 px |
| D2 | Completion (`shots/phone-dark-celebrate-07-whistle-300ms.png`) | Two Chais at once: a 2D cheering Chai in the ring, and the 3D Chai asleep in the room | One Chai owns the climax (see Direction A) | Part of R2 | Frame capture of the completion sequence |
| D3 | Level-up card (`done-3`) | The record-player preview has about 30% empty space on the right | Crop and frame the item render | Small · low | Screenshot |
| D4 | Code comments (`flow.ts:4`, `FocusScreen.tsx:6`) | They say the whistle lasts ~1.7 s and ~2 s. `WHISTLE_MS` is 1250. | Correct as part of R2 | Trivial | — |

### 3b. Usability problems (evidence-based; the impact on people is inferred)
| # | Evidence | Why it matters | Proposed change | Benefit · effort · risk | Verify |
|---|---|---|---|---|---|
| U1 | One brew on the `celebrate` seed produces **5 full-screen cards**, each with Continue: whistle summary → 7 days warm → recipes → Level 8 → Warm Streak II badge. Then an 8 s tea-break countdown runs on the reward card (`evidence/4-completion.png`). The streak card and the streak badge celebrate the same event. | A calm ritual turns into a slot machine; the tea break, the actual reward, is delayed. | **One brew, one celebration:** a single summary with sections. At most one "special" moment (level-up item or new badge) stays inside it. Primary action: **Tea time**. | High · M · low | ≤ 1 tap from whistle to break; nothing dropped; screen reader order; reduced motion |
| U2 | **7 screens** before the first minute of focus: hello, name, goal, rhythm, sound, nudges, summary.<br>Rhythm has no default, so Continue is disabled until you pick; goal has no Skip.<br>The final CTA can start a 50-min Deep brew under a 30-min goal, with no intention (`evidence/1-onboarding.png`). | The audience is people who stall before starting, and first-run friction is the product's first promise broken. | **One tap to a first brew:** the hello screen offers "Start a 15-min brew". Name, goal, rhythm, sound and nudges come after the first whistle, as a short, skippable "make it yours". | High · M · low | From first load to a running timer in ≤ 2 taps and ≤ 10 s; every setting still reachable |
| U3 | Home is dense: 3 status pills, greeting, a Chai bubble that repeats the goal card, goal card, a composer with 5 tags and 4 rhythms, CTA, recipes, today's brews.<br>Two counters compete: "Brew 1 of 4" (the long-break cycle) vs "about one more brew" (the goal).<br>At-risk Home says "one short brew keeps it going", but the CTA is still Classic 25 (`evidence/2-home.png`, `shots/atrisk-home-mobile-dark.png`). | Too many decisions before the one action; mixed signals. | Distil Home: greeting + Chai (one line) + intention + one CTA. Tags and rhythm collapse behind one "25 min · Study" control. Recipes and brews go below the fold. | High · M · low-med | The CTA is above the fold at 320×640; count of choices before start |
| U4 | Vocabulary load: days warm, leaves, cozy level, recipes, Tea Cozies, tiers I–V, brews, cups.<br>"Cup" means both the 30-min goal and one brew.<br>The cycle label is spelled three ways.<br>"Carry forward" is never explained; "Earn 85 leaves" is a circular recipe. | Every coined word is a small tax. | Keep 3 words (brew, warm streak, nook); retire or hide the rest (see Decision 2); one spelling per concept | M · S–M · low | Copy inventory before and after |
| U5 | Colour meaning in Stats: orange means "warm day" (success) on the calendar but "Under goal" on the week bars. A user on a 23-day streak sees mostly failure-coloured bars. | It punishes a good week, which contradicts the no-guilt voice. | Under-goal bars in a neutral tone; orange only for warmth | High for tone · S · low | Screenshot plus a contrast check |
| U6 | The break's primary (orange) button is **Start next brew**; Skip is secondary. The break sits on plum-navy, not the brief's sky tone. | It pushes people back to work during the rest. | Primary = rest; next brew secondary until the break ends | M · S · low | Screenshot |
| U7 | Tablet Home packs everything into the top ~60%; desktop Home leaves an empty lower-left | It looks unfinished on larger screens | Recompose after U3, which removes content | M · M · low | Captures at 820 / 1024 / 1440 |
| U8 | Nothing pulls toward tomorrow; the intention is not prefilled on return | "Return tomorrow" relies only on the streak | End of day: "Tomorrow: Chapter 3 notes?" prefilled; Chai's line points forward, not at a number | M · S · low | Next-day seed capture |

### 3c. Art direction (subjective, argued)
| # | Evidence | What feels weak | Proposal |
|---|---|---|---|
| A1 | Focus (`evidence/3-focus.png`) | Two focal points: a diorama in a card and a generic ring. The kettle heats, but at 60 px nobody sees it. Zen mode hides even the intention after 7 s. | **The kettle is the timer** (Direction A): a large, flat SVG kettle whose water and steam carry progress, and Chai beside it reading (a quiet companion, which also helps people who stall). Keep the room as the backdrop. The intention stays visible. |
| A2 | Chai (`evidence/6-chai.png`) | Idle, focus, sip, proud, concerned and think share one silhouette and differ by 2–3 px eye marks. At 24–48 px only sleep, cheer and stretch read. Head-on, the rounded rectangle reads as a loaf or a bear; the long blunt capybara muzzle never shows. The sip mug covers the snout and the steam crosses the nose; at 56–72 px it reads as a snorkel. Chai sleeps through focus, so the brief's `focus` pose is never used. The 3D Chai is effectively another character. | **A posture system:** head tilt, body lean, a three-quarter turn with the muzzle visible. New focus-reading, a fixed sip, and a concerned lean. Everything in the "preserve" list stays. Later, rebuild the 3D Chai as a translation of the 2D body. |
| A3 | Every screen | "Card soup": nearly every element is a bordered, rounded card with a raised lip at similar weight. Hierarchy comes only from size. Dark cards barely separate from the plum background. | Fewer containers, stronger typographic hierarchy, and one hero per screen. Dark theme: warmer, lighter surfaces, or lean on light as the default. |
| A4 | Static vs 3D room (`evidence/5-nook.png`, `3-focus.png`) | Items sit in the same places, but the lighting and palette (cool flat lavender vs warm amber bloom), the camera height and Chai differ. The static art shows for about 0.2 s at every focus start, and in full when 3D is off. | Align the static art's palette and lighting to the 3D mood, and use the same Chai. Don't make the static art depend on 3D renders (see Direction A). |
| A5 | 3D close-ups (`evidence/3-focus.png`, `6-chai.png`) | The room was built for a distant isometric view. Up close the steam is a cotton blob, the stove is a box and Chai is low-detail. | Any "room as hero" plan needs asset work first (see Direction B) |

### 3d. Motion and sound
- **Motion.** Transitions are consistent and reduced motion is honoured.
  - The biggest motion flaw is the ending. The whistle beat is 1.25 s, followed by a designed bloom into the card. The bloom is intentional, not a glitch; my first draft called it a blank frame and was wrong.
  - The climax happens on the wrong object (the ring and a 2D Chai).
  - Proposal: a 2–2.5 s whistle sequence on the hero kettle: lid rattle, steam jet, Chai waking and stretching, the sound in sync. Then the single summary rises over it.
  - GSAP: a labelled timeline (`whistle`, `wake`, `sheet`) is a good fit when one sequence drives DOM, SVG and engine uniforms, with `gsap.matchMedia()` giving the reduced-motion variant. The app already uses motion/react, so adding GSAP only pays off if that orchestration is needed. Otherwise sequence it in motion. Use one orchestrator, never both on the same element.
- **Sound (measured, not heard).**
  - The whistle ("complete") peaks at 0.9–1.4 kHz and lasts about 1.5 s. It is gentle, not shrill, and already longer than the 1.25 s visual.
  - Ambiences are synthesized: rain has a spectral centroid around 2.1 kHz; lo-fi is a low loop.
  - **Needs your ears.**
    - Is the whistle pleasant and recognisably a kettle?
    - Does rain sound like rain or like noise?
    - Is the lo-fi loop tiring after 25 minutes?
    - Are levels balanced across ambiences on a phone speaker and on headphones?

### 3e. Reliability
- Everything automated passes (section 0).
- Still open from round 4, documented:
  - concurrent two-tab merges don't re-grant same-day rewards until the next brew;
  - layout tests use the static room.
- **Needs real devices** (`docs/REAL_DEVICE_CHECKLIST.md` exists; I have no record of it being run):
  - iPhone: installed-PWA notifications and background timing, audio unlock, wake lock;
  - a mid/low-end Android: 3D frame rate and heat over 50 minutes;
  - VoiceOver / TalkBack on Focus and the celebration.
- **Performance.** Initial JS is 164 KB gzipped. three.js (142 KB) and the scene (27 KB) are lazy-loaded. That's acceptable. A full-screen 3D stage for 25–50 minutes would be the main battery risk (Direction B).

## 4. Asset and tool routes (per upgrade)
| Upgrade | Best route | Why this route | Not this |
|---|---|---|---|
| Kettle-as-timer art (water level, steam, whistle states) | Hand-built SVG in code, animated deterministically (CSS / motion, or a GSAP timeline) | Needs exact, parametric states, both themes, and a reduced-motion still; a few KB | Generated images or video can't express continuous progress or respect reduced motion |
| Chai posture pass | Explore postures with GPT Image 2.5 or Nano Banana Pro (you run them: `chai-concept-prompt.md`, refs in `refs/`), then redraw chosen poses in `Mascot.tsx` | Generation is good for ideas; the shipped asset must stay vector and on-model | Shipping raster generations as the mascot |
| Whistle and celebration moment | Deterministic animation of existing art + sound | Must sync to real timer state and reduced motion | Generated video (heavy, can't react to state) |
| 3D Chai rebuild, better kettle and stove (Direction B, or later in A) | **Blender** → glTF/GLB (meshopt/Draco, Chai under 300 KB) → `GLTFLoader`; bake soft AO/light; keep the procedural room | Organic shapes, a rig for nap, sip and wake, baked light are what Blender is for | Hand-coding organic meshes in three.js |
| 3D polish without new models | Tune the three.js scene directly: palette and lighting tokens shared with 2D, camera, steam shader | Cheapest way to align 2D and 3D | — |
| Window view (outside the window) | Optional image generation (Recraft V4.1 about $0.035, Qwen Image 3 about $0.04 per image), used as a texture | Low stakes, big atmosphere | — |
| Short video | Not recommended in-app | No state, no reduced motion, weight | — |

**Blender, verified today:**
- **This container:** no Blender binary. The `bpy` 5.0.1 wheel for Python 3.11 downloads fine; I didn't install it. That gives headless scripting, GLB export and CPU (Cycles) renders, with no GPU and no viewport.
- **Higgsfield "3D Jutsu" (hosted Blender 5.2):** reachable through this session's connector. The read-only project list returned empty. It supports bpy scripts, GLB and .blend download, and a GLB catalog. Pricing is not stated in its tool descriptions; to be confirmed before use.
- **Higgsfield "use Blender":** a local MCP that drives Blender on *your* computer. It needs Blender installed and Claude Code running locally, not this cloud session. Higgsfield does not control Blender beyond these two routes.

**Pipeline in all cases:** .blend → GLB (Y-up, metres) → `/public/scene/*.glb` → `GLTFLoader` + meshopt → the engine swaps the procedural Chai for the GLB. The static fallback keeps the flat 2D Chai. Compare the old and new Chai side by side at the Focus camera, Nook camera and a close camera, in both themes, before replacing anything.

**Higgsfield models, from the current docs; estimates are free and nothing was submitted:**

| Model | Estimate |
|---|---|
| Recraft V4.1 | 0.56 credits ($0.035) |
| Recraft V4.1 Pro | 3.36 ($0.21) |
| Qwen Image 3 (text or edit) | 0.64 ($0.04) |
| Ideogram 4.0 | 0.96 ($0.06) |
| Grok Image 2.0 | 0.96 ($0.06) |
| Kling 3.0 Pro image-to-video, 5 s | 4.93 ($0.31, with the 45% promotion) |

Not reachable from this session:
- Nano Banana Pro (website-only);
- GPT Image 2.5 (your own access);
- Marketing Studio via the API (it is token-billed);
- the connector's `models_explore` / `generate_3d` tools, which aren't exposed here.

## 5. Three directions
**A. "The kettle is the timer" (2D-first ritual). Recommended.**
- **Feeling:** a small, warm, tactile ritual; calm on any device.
- **Most visible changes:**
  - Focus becomes a big illustrated kettle filling and steaming, with Chai reading beside it; the room sits softly behind.
  - The whistle plays on the kettle.
  - One summary replaces five cards.
  - A one-tap first brew.
  - Chai's postures become expressive.
- **Preserved:** everything in section 2, including the 3D nook as ambience and as the Nook reward.
- **Trade-offs:** the 3D room is demoted from the focus hero it never really was. It relies on strong 2D illustration craft.
- **Production:** new kettle SVG system and a whistle sequence; Chai posture pass; Home and celebration distil; onboarding reorder; copy and colour clean-up.
- **Why recommended:** it serves the audience (works with reduced motion, without WebGL, on battery), follows the brief ("3D only where it meaningfully adds atmosphere… never distracting"), and fixes the three weakest moments at once.

**B. "Warm Room" (3D-first stage).**
- **Feeling:** cinematic and cosy, like being in the room.
- **Changes:**
  - A full-bleed room on Focus with a close camera. The steam becomes the progress, which is legible up close (`evidence/3-focus.png`, 25% vs 90%). The mock there is a concept, not the app.
  - Completion happens in the room.
  - The static art is made to match.
- **Preserved:** the metaphor, Chai, and the engine.
- **Trade-offs:**
  - Up close, the current assets fall apart, so it needs a real asset pipeline (Blender Chai, kettle, stove, steam).
  - A full-screen GPU load for 25–50 min is a battery and heat risk on the audience's cheaper phones.
  - It adds peripheral motion during focus.
  - Users without WebGL get a lesser product.
- **Production:** the largest of the three: 3D art, a camera and layout rewrite, a performance budget and device testing.

**C. "Quiet tool" (distil).**
- **Feeling:** calm, fast, clearly useful.
- **Changes:** one-screen Home, a single summary, a two-section Stats, fewer systems, tidy typography; art as is.
- **Preserved:** the look, largely.
- **Trade-offs:** the quickest win in usefulness, but it doesn't make Kettle more beautiful or distinctive.
- **Production:** the smallest.

The critic argued for A over my first draft, which was B. I agree after checking its evidence:
- the brief's 3D constraint;
- desktop Focus already gives the room about 60% of the screen and the heating still doesn't read;
- the battery cost;
- the fact that the close-up concept only worked by exposing asset debt.

B remains a credible second step once A lands.

## 6. First round: five changes, bounded
| # | Change | Acceptance criteria |
|---|---|---|
| R1 | **One brew, one celebration.** The whistle beat, then a single summary sheet: minutes and leaves, a streak line, recipe progress, and at most one special row (level-up item *or* new badge, with a small preview). Primary: **Tea time**; secondary: Skip break. No countdown on a reward. | ≤ 1 tap from whistle to break; every current fact still shown; no two cards for one event; reduced-motion variant; screen-reader reading order checked; the `celebrate` seed shows 1 screen, not 5 |
| R2 | **The kettle is the timer, and it whistles.** Replace the ring on Focus with an illustrated kettle: water level, colour warmth and steam map to progress. Chai beside it in a reading pose. The intention stays visible. The room stays as the calm backdrop. The whistle becomes a 2–2.5 s sequence on the kettle with Chai waking; one Chai only. | Progress is readable at 0 / 25 / 50 / 75 / 95% in still frames at 390 and 320 px; digits ≥ 44 px; controls ≥ 44 px; a static reduced-motion state per quarter; no double Chai; the sound and visual beats end within 150 ms of each other; the room still pauses when hidden |
| R3 | **One tap to the first brew.** The hello screen offers "Start a 15-min brew" plus "I have a backup". After the first whistle, "make it yours" (name, goal, rhythm, sound, nudges), every step skippable with defaults. Day-one recipes scale to the goal; no wall of zeros. | Fresh load to a running timer in ≤ 2 taps; all settings reachable; functional onboarding test updated; day-one Home shows no grey "cold" state |
| R4 | **Chai posture pass (2D).** Three new or fixed postures: focus-reading, sip with the mug below the snout, concerned lean. Head tilt or lean so silhouettes differ. Preserve-list intact. | Side-by-side sheet vs the current poses at 24 / 56 / 72 / 160 px in both themes; each new pose distinguishable at 56 px (a blind "which pose?" check by the critic); no new colours |
| R5 | **Verified-fix bundle.** Nook container query (D1); under-goal colour (U5); break CTA emphasis (U6); one spelling per concept, "cup" disambiguated, "Carry forward" explained (U4); badge tier pill that doesn't read as a pause icon; level-up preview crop (D3); at-risk CTA offers a short brew (U3); comment drift (D4) | Each item has a before/after capture; the Nook correct at 1024–1920 |

**Process (bounded, no "until perfect" loop):**
1. Implement R1–R5 with tests.
2. **One** batched capture round:
   - phone 390 and 320, tablet 820, desktop 1440;
   - light and dark;
   - reduced motion and 3D off;
   - frame-by-frame capture of the completion sequence.
3. **One** independent critic on selected before/after evidence, plus **your** listening check and a real phone.
4. **One** fix batch.
5. A final verification capture, the test suites, then republish the preview.
6. Stop. Anything left goes to round 2.

## 7. What I need from you
- A **listening check** on a phone and headphones: the whistle, the rain, the lo-fi loop, and balance between them.
- One **real-phone session**:
  - iPhone Safari installed to the Home Screen: a 25-min brew with the screen locked, the notification, the whistle;
  - if you have one, a mid-range Android for 3D smoothness and warmth.
- If you want GPT Image 2.5 or Nano Banana Pro concepts for Chai: run `chai-concept-prompt.md` with the files in `refs/` and send back the sheet. This is optional; R4 can proceed from the brief alone.

## 8a. Decisions taken (30 Sep 2026)
- **Direction A**, "the kettle is the timer".
- **Gamification:** keep every system, but quieter. R1 merges them into one summary per brew; nothing is removed.
- **Chai:** wait for your concept sheet. R4 moves out of round 1 and becomes round 1b, starting once you've picked from the sheet.

**Adjusted round 1:**
- **R1** One celebration.
- **R2** The kettle is the timer and it whistles. Chai beside the kettle uses the existing, currently unused `focus` pose (eyes closed, holding a mug) until round 1b replaces it.
- **R3** One tap to the first brew.
- **R5** The fix bundle.

**Still open:** the onboarding reorder (decision 4) is part of Direction A as proposed, so R3 assumes yes. Tell me if setup should stay before the first brew. Dark theme (decision 5) is untouched in round 1.

## 8. Decisions for you before implementation
1. **Direction:** A (recommended), B, or C.
2. **Gamification:** keep all systems but quieter (R1 only), or retire some (e.g. badge tiers → single badges; recipes optional; Tea Cozies kept).
3. **Chai:** a posture refinement within the current style (recommended), or a deeper redesign (e.g. a three-quarter default with a visible capybara muzzle). And whether you'll run the external concept kit.
4. **Onboarding:** OK to move the questions after the first whistle?
5. **Dark theme:** keep plum and warm it up, or make light the default look and treat dark as secondary.
