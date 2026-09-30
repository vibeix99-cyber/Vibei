# Round 6 mockups v3: the refined round-1 look with the approved Chai

**These are mockups, not the app.** No production file was changed and no paid generation was used. Production changes are pending your review.

Earlier versions are in git history: v1 in commit 3a161cf, and v2 (the SVG Chai) in commit 6a6c856.

The agreed direction is unchanged:
- the kettle leads Focus;
- Chai is the companion;
- the room supplies atmosphere;
- every reward system stays;
- one summary follows each brew.

**New in v3:** Chai is the approved art direction (`assets/chai/`). The poses are used as painted artwork, not redrawn:
- **reading** during Focus (running and paused);
- **sipping** on the tea break (a new Focus state);
- **cheering** at the whistle and completion;
- **concerned** only for gentle support;
- **happy** for the Home greeting (my choice; say if you prefer another pose).

## The seven deliverables (`exports/`)
Every image tags each frame **CURRENT APP** (captured today from the unchanged app build, in `current-app/`) or **PROPOSED MOCKUP**.

| # | File | Shows |
|---|---|---|
| 1 | `exports/1-focus-phone-current-vs-proposed.png` | Focus on a phone, light and dark: current vs proposed (midpoint and whistle), plus the proposed start, paused, +5 added and tea break. At 390 px, a phone's real width. |
| 2 | `exports/2-focus-desktop-current-vs-proposed.png` | Desktop Focus at 1440 × 900 (real size): current vs proposed, light and dark, plus the proposed whistle and tea break |
| 3 | `exports/3-kettle-state-sheet.png` | The kettle's states, light and dark: start, early, midpoint, late, paused, +5 added, whistle, tea break (resting) |
| 4a | `exports/4a-completion-phone-current-vs-proposed.png` | Completion on a phone: a routine brew and the major room unlock (level 8, record player), current vs proposed, light and dark |
| 4b | `exports/4b-completion-desktop-current-vs-proposed.png` | The same on desktop (routine light, unlock dark) |
| 5a | `exports/5a-home-phone-current-vs-proposed.png` | Home on a phone, light and dark |
| 5b | `exports/5b-home-desktop-current-vs-proposed.png` | Home on desktop, light and dark |
| 6 | `exports/6-chai-size-checks.png` | Chai at actual display sizes, light and dark: in the Focus scene (phone and desktop), Home, gentle support, and 72 → 24 px (full pose vs face avatar) |
| 7a | `exports/7a-motion-whistle-to-summary-light.mp4` | Motion prototype, light: normal and reduced motion side by side, with the app's own whistle sound |
| 7b | `exports/7b-motion-whistle-to-summary-dark.mp4` | Motion prototype, dark |

Single frames are in `frames/`. The Chai assets and their notes are in `assets/chai/`; see its `README.md` for extraction, format, resolution and the regeneration prompt.

## 1. The kettle (`build/Kettle2.tsx`)
**Silhouette and details:**
- A squat enamel stovetop kettle in the brand persimmon.
- A swan-neck spout with a hinged whistle cap.
- A wire bail handle with a wooden grip in the nook's wood tone, and the yuzu from the logo as the lid knob.
- It stands on a small cast-iron burner, on a trivet, so the flames show under it.
- Shading follows Chai's rules: flat forms, no outlines, light from the top-left, one lit face and one shade per form.

**Warmth and progress, without "disabled" and without "water filling":** the body is fully orange from the first second, and nothing inside it rises. Progress is carried by what heats a real kettle:

| Signal | Start (25:00) | Midpoint | Late | Whistle |
|---|---|---|---|---|
| **Heat gauge** on the belly: a needle sweeping a warm arc (the exact fraction; the digits give the exact time) | needle at the left | straight up | near the right | pinned right |
| **Flame** under the kettle | small | medium | tall | full |
| **Warm under-glow** on the lower belly, and the warm pool on the counter | faint | clear | strong | strongest |
| **Steam**, in three stepped sizes: a small curl → two billows → a full plume with puffs breaking away | small curl | two billows | full plume | the jet |

**The steam:**
- The chain of white circles is gone.
- Each billow is now one fused silhouette. Its lit face is offset and clipped inside the shape, so the shade is a crescent *inside* the form rather than a rim around each circle.
- The plume starts as a thin neck at the spout, widens as it rises, and breaks into drifting puffs.
- At night it stays cream rather than turning grey, so it never reads as smoke.

**The whistle as a still:**
- the cap is flipped open;
- a straight, fast jet leaves the spout along its axis and blooms into a cloud;
- there are speed marks, the lid is lifted and tilted, the notes rise, and the gauge is pinned.

All of it reads with no motion at all, which is exactly what reduced motion shows.

## 2. Focus composition (`build/FocusScene.tsx`)
- **One surface.** A wooden counter, in the room's own wood colours, spans the frame. The kettle's burner and Chai both sit on it.
- **Scale.** Chai is about as tall as the kettle including its handle, on both phone and desktop.
- **Shadows.** One set of contact shadows, drawn once, in one style for both. Each has a tight dark contact and a soft shadow cast toward the viewer, because the light is the window behind them.
- **Light follows the window.**
  - *By day:* the window's light spills forward across the counter in the shape of the panes, split by the mullion.
  - *At night:* the window is dim moonlight and the stove is the key light. A warm pool on the counter also warms Chai's near side.
  - One soft-light layer over the whole scene ties the kettle, Chai and the room together.
  - *Paused:* the stove's light goes out.
- **Blur.** The window backdrop is the real 3D room rendered once, now at 2× for the phone. Blur went from 3 px at 55% opacity (v1) to **1 px at full opacity**: just enough depth. The 3D kettle, mug and record player are hidden behind the counter or left out of the render, so nothing competes.
- **Readable countdown.** The digits (84 px on a phone, 148 px on desktop) sit below the counter, on the solid page colour, never over the picture.
- **Desktop.** The scene is a framed still life on the left. All text lives in the right column: the intention, digits, status and controls.

**States:**
- **Start:** 25:00, "Kettle's on", a small steam curl.
- **Midpoint.**
- **Paused:**
  - the flame is out and there is no steam;
  - the gauge holds its position;
  - Chai looks up at you;
  - the digits dim, with a "Paused" pill;
  - "The kettle will wait";
  - Resume becomes the one primary button.
- **+5 added:** see below.
- **Whistle:** 0:00 in persimmon, "Tea's ready!", Chai cheering, and no controls. The summary rises about 2.4 s later.

### What happens to visual progress when five minutes are added
Progress is always **elapsed ÷ planned length**, so it stays honest. Example: at 20:00 into a 25-min brew, the gauge reads 20/25 = 80%.

1. **Tap +5:** the brew becomes 30 min. The digits jump from 5:00 to **10:00** immediately, and a pill says "+5 min · whistles at 3:35 now".
2. **The needle eases back** from 80% to 20/30 = 67% over about 0.6 s. Under reduced motion it moves instantly.
3. **A honey "+5" segment** appears at the end of the gauge's arc: the last sixth, marking the added time. The needle then sweeps through it as the extra minutes pass.
4. **Flame, glow and steam** are driven by the same fraction. They only step down if a threshold is crossed (steam sizes change at 20% and 60%), with a 1 s fade. At 67% nothing steps down, which is what the frame shows.
5. The control reads **"Add 5 more"** once an extension exists.

**Rejected alternative:** freezing the kettle ("it can't cool down") would make the gauge disagree with the digits.

## 3. Chai: the approved art in the mockups
- **One Chai on screen, always:**
  - on Focus, Chai sits on the counter beside the kettle, at the same scale and with the same contact shadow;
  - on the phone summary, the scene's cheering Chai stays visible above the sheet;
  - when the sheet covers the scene (the unlock and details variants), cheering Chai sits on the sheet's top edge instead;
  - on the desktop summary, cheering Chai joins the card's headline, because the card covers the scene.
- **Scale in the Focus scene:** 178 CSS px on a phone and 322 on desktop (the reading pose's height). Every pose uses one scale factor, so cheering is shorter because the pose itself sits lower.
- **Light:** the scene's shared light layer (window light by day, the warm stove pool at night) falls on Chai as it does on the kettle. The art itself is unchanged.
- **Small sizes:** the full pose reads down to 40 px; below that, a round face avatar (happy head and yuzu) stays readable at 24 px.
- **Not updated:** the first-run hello screen, and other screens outside this request, still use the old SVG Chai.

## 4. The summary: one per brew, a clear hierarchy
1. **The message:** "25 minutes brewed", with "Tea's ready. Take five…". **Tea time · 5 min** is the primary button, in a footer that never scrolls away. Skip break is next to it.
2. **The intention:** Done / Carry forward, one row.
3. **Routine rewards, compact:** a band of pills: leaves, daily goal, streak, recipes, level progress. All systems stay; none gets a card.
4. **A major unlock gets room:** "New in your nook" with a full-width picture of the item in the player's own room (rendered by the 3D engine), its name, one line, and "See it".
5. **Arithmetic on request:** "How your leaves added up" expands to show the per-line breakdown, the total, level progress and the streak rule.

**First brew:** the same shape, plus an optional "Make Kettle yours · Set up" row. No questionnaire before the first brew.

## 5. Home
- **Today's minutes are explicit:** "**12 min** brewed" and "**18 min** to go", over the goal bar (goal 30 min), on phone and desktop.
- **Desktop:**
  - larger scale: 50 px greeting, 22 px Chai line, large fields;
  - two real columns, start a brew | today (minutes, today's brews, recipes);
  - vertically centred.
- **Removed:** the v1 "Your nook" preview, because it was filling space.
- The lower part of the desktop stays calm and empty rather than holding a widget.

## Motion prototype
`motion/whistle-to-summary-dark.mp4` (and `-light`) shows the last seconds of a brew, then the whistle, then the summary. The sound is the app's own whistle, at 3.0 s.

| | Normal motion | Reduced motion |
|---|---|---|
| Last seconds | steam sways, flames flicker | stepped steam, still flames |
| 3.0 s whistle | cap flips, jet grows in about 0.45 s, lid rattles, notes rise, Chai hops, controls fade | the static whistle frame, instantly; no rattle, hop or rising notes |
| 5.4 s summary | the scene pans up as the sheet slides up (0.7 s, ease-out), content staggered by 70 ms | the finished summary cross-fades in over 0.3 s; no pan, slide or stagger |

The sound plays in both, subject to the app's sound setting.

**Rebuild:** `node build/record-motion.mjs dark|light`. The page is a pure function of `t`, stepped at 30 fps.

## Implementation that preserves this art and meets performance
- **The kettle as inline SVG in a React component** (Kettle2 is written that way):
  - 160 elements;
  - the state (progress, paused, extended, whistle) comes from props;
  - scales crisply at every size and theme, with no raster assets and no extra download.
  - *Motion in production:* CSS transforms and opacity on groups (steam sway, flame flicker, lid rattle, jet scale), not per-frame React renders. The gauge needle is a rotate transform. Updates are driven once per second by the timer.
  - *Pausing:* animation stops when the tab is hidden, and under reduced motion only the stepped states render. No GSAP is needed: every sequence here is a few transforms. The app already ships `motion/react` for the sheet.
- **The window backdrop is the real 3D room, rendered once and frozen:**
  - the engine renders a frame, then `setRunning(false)`, so it matches the Nook exactly with no ongoing GPU cost during a 25-minute brew;
  - no-WebGL fallback: small pre-rendered stills (the renders here are about 0.6 MB as PNG and would ship as WebP/AVIF at about 80–150 KB);
  - optional: rain streaks as a CSS layer on top.
- **The counter, shadows and light** are one SVG and one CSS gradient layer: static, cheap and theme-aware.
- **The unlock picture** is rendered by the engine at unlock time (the item highlighted), with the existing `ItemGlyph` as the fallback.
- **The summary** is mounted, hidden, before the whistle. It rises with transform and opacity only.
  - *Why:* in this mockup, re-rendering both phones of the motion page from React on every step costs a median of 5 ms but spikes to about 20 ms when the summary first mounts, on this CPU-only container.
  - *Consequence:* pre-mounting it and animating transforms avoids that spike.
- **Visual quality is checked by eye, not by passing tests.** The approved v2 frames become visual-regression references, but only after you approve them. Test passes and SVG output are not evidence that it looks right.

## Honest limits
- **Data is static and typed by hand** (a veteran with 690 leaves at level 7).
- **The first brew** is shown with a 25-minute Focus frame; in production it would read 15:00.
- **Chai's resolution:** the approved sheet gives about 490 px per pose. That is sharp everywhere except the desktop Focus Chai on a 2× (Retina) monitor, where it is upscaled about 1.3×. `assets/chai/README.md` has a precise prompt for transparent 2048 px poses for production.
- **Paused Focus** keeps reading Chai; the "Paused" pill, dimmed digits and the unlit stove carry the state.
- **The whistle jet** reads well at Focus size. At 520 px its core still looks like a smooth cone; a final art pass could break its edge into small billows.
- **The Nook screen** was not in scope and is unchanged from v1.
- **Performance figures** come from a CPU-only container, not a phone.

## Rebuild
From `kettle/`, with `npx vite --port 5191` running (the review folder is not watched, so restart after edits):
0. Chai assets (only when the sheet changes):
   ```
   python3 review/round-6-mockups/build/extract-chai.py
   ```
   Needs numpy, scipy and Pillow.
1. `node review/round-6-mockups/build/shoot.mjs` renders all frames to `frames/`.
2. Sheets:
   - `mock.html?screen=kettle&theme=…` at 1400 px, @2 → `frames/kettle-sheet-*.png`;
   - `mock.html?screen=chaisize&theme=…` at 1300 px, @2 → `frames/chai-sizes-*.png`.
3. Current-app captures: build the app, then run `npx vite preview --port 4173` and
   ```
   node review/round-6-mockups/build/capture-current.mjs celebrate <light|dark> <390 844 phone | 1440 900 desktop>
   ```
   The output goes to `current-app/`.
4. `node review/round-6-mockups/build/board.mjs review/round-6-mockups/build/exports.json` builds `exports/`. Copy the two motion videos into `exports/` as 7a and 7b.
5. `node review/round-6-mockups/build/record-motion.mjs dark|light` records the motion prototype.
6. Room stills:
   ```
   node review/round-6-mockups/build/render-engine.mjs <out> <w> <h> '<query>'
   ```
   - Window: `cam={"pos":[1.9,1.55,2.7],"at":[0.55,1.6,-2.5],"fov":48}&mode=idle&dpr=1`. Add `time=night&dim=0.85` or `time=day`. Use 780×1688 for the phone and 860×820 for the desktop, and leave the record player out of `items` so its notes don't float in the frame.
   - Unlock: `cam={"pos":[2.75,1.75,0.9],"at":[1.55,0.95,-2.2],"fov":42}&hi=recordPlayer` at 700×340.
