# Round 6 mockups v2: the refined round-1 look (Direction A, "the kettle is the timer")

**These are mockups, not the app.** No production file was changed and no paid generation was used. v1 of these mockups is in `frames-v1/` and `boards-v1/`, and in commit 3a161cf.

The agreed direction is unchanged:
- the kettle leads Focus;
- Chai is the companion;
- the room supplies atmosphere;
- every reward system stays;
- one summary follows each brew.

## What to look at
| File | Shows |
|---|---|
| `boards/1-focus-phone-current-vs-refined.png` | Focus on a phone: **today's app → v1 → v2**, midpoint (light) and whistle (dark). Phone frames are placed at 390 px, a phone's real width. |
| `boards/2-focus-states-phone.png` | Start, midpoint, paused, +5 added, whistle; light and dark |
| `boards/3-focus-desktop-current-vs-refined.png` | Desktop Focus, today → v1 → v2, each at 1440 × 900 (real size) |
| `boards/4-focus-desktop-states.png` | The five desktop states, light and dark, at half size (full frames are in `frames/`) |
| `boards/5-kettle-art.png` | The kettle: the v1 strip vs the v2 states, at Focus size and large |
| `boards/6-summary-phone.png`, `7-summary-desktop.png` | The summary: today's five cards → v1 → v2 routine / details / major unlock / first brew |
| `boards/8-home-phone.png`, `9-home-desktop.png` | Home: today → v1 → v2 |
| `boards/10-first-run.png` | Brew first, set up later |
| `motion/whistle-to-summary-{dark,light}.mp4` | **The motion prototype** (8.6 s, with the app's own whistle sound): normal and reduced motion side by side |
| `chai-ab-brief.md` + `frames/chai-baseline-{light,dark}.png` | **The Chai A/B concept brief**, with today's Chai as the baseline at 160 / 72 / 56 / 24 px |

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

## 3. Chai: A/B concept brief
See `chai-ab-brief.md`.
- **A:** today's Chai with better posture and expression.
- **B:** a clearer capybara muzzle and more expressive body language.

Both keep the yuzu, the palette and the gentle personality. Both use **the same seven poses in the same order**, plus a cell beside the v2 kettle, with the same model, settings and references. The baseline board shows the problem both must solve: at 56 px and below, today's greeting, focus and concerned poses share one silhouette. **The mascot is not replaced until you choose.**

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
- **Chai uses today's poses** until you choose A or B. The paused state uses the existing `idle` pose (looking up at you). Chai's warm near-side light at night comes from the shared light layer, not from redrawn art.
- **The whistle jet** reads well at Focus size. At 520 px its core still looks like a smooth cone; a final art pass could break its edge into small billows.
- **The Nook screen** was not in scope and is unchanged from v1.
- **Performance figures** come from a CPU-only container, not a phone.

## Rebuild
From `kettle/`, with `npx vite --port 5191` running (the review folder is not watched, so restart after edits):
1. `node review/round-6-mockups/build/shoot.mjs` renders all frames to `frames/`.
2. Kettle and Chai sheets:
   - `mock.html?screen=kettle&theme=…` at 1400 px, @2;
   - `mock.html?screen=chai&theme=…` at 1180 px, @2.
3. `node review/round-6-mockups/build/board.mjs review/round-6-mockups/build/boards.json` builds the boards.
4. `node review/round-6-mockups/build/record-motion.mjs dark` records the motion prototype.
5. Room stills:
   ```
   node review/round-6-mockups/build/render-engine.mjs <out> <w> <h> '<query>'
   ```
   - Window: `cam={"pos":[1.9,1.55,2.7],"at":[0.55,1.6,-2.5],"fov":48}&mode=idle&dpr=1`. Add `time=night&dim=0.85` or `time=day`. Use 780×1688 for the phone and 860×820 for the desktop, and leave the record player out of `items` so its notes don't float in the frame.
   - Unlock: `cam={"pos":[2.75,1.75,0.9],"at":[1.55,0.95,-2.2],"fov":42}&hi=recordPlayer` at 700×340.
