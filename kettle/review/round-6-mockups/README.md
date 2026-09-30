# Round 6 mockups: the proposed look of round 1 (Direction A)

**These are mockups, not the app.** No production file was changed and no paid generation was used.

**How they were built:**
- A static review page (`build/mock.html` + `build/mock.tsx`) that uses the app's real design tokens, fonts, UI kit (`Button`, `Chip`, `IconButton`, `TextField`, `ProgressBar`, `Ring`) and art (`Mascot`, `Logo`, `Badge`, `LevelBadge`, `StreakMug`, `TeaTin`, `Leaf`, `ItemGlyph`).
- Room images rendered from the real three.js engine (`build/engine.html`, `build/render-engine.mjs` → `renders/`).
- The one new drawing is `build/HeroKettle.tsx`, the illustrated kettle-timer. It is built from the app's own `KettleMark` shapes and palette.

**Boards** (in `boards/`; single frames in `frames/`):

| Board | Shows |
|---|---|
| `1-focus-phone.png` | Focus today vs the proposal at start (25:00), midpoint (12:30) and whistle, dark and light |
| `2-focus-states-reduced-motion.png` | The kettle at 0 / 25 / 50 / 75 / 95% and the whistle; normal motion vs reduced motion |
| `3-focus-reduced-motion-phone.png` | Reduced motion / 3D off on the phone |
| `4-focus-desktop.png` | Focus on desktop |
| `5-summary.png`, `6-summary-desktop.png` | The single completion summary vs today's 5 cards |
| `7-first-run.png` | Hello → first brew → first summary with optional setup |
| `8-home.png`, `9-home-desktop.png` | Home |
| `10-nook.png`, `11-nook-phone.png` | Nook, with today's desktop defect beside the proposal |

## What each visible change fixes (audit finding → change)
| Audit finding (`review/round-6-audit/REPORT.md`) | Visible change in the mockups |
|---|---|
| A1: Focus has two competing focal points; the kettle's heating is imperceptible at 60 px; a generic ring timer | **The kettle is the timer.** A large illustrated kettle warms from the bottom up: cold oat at 25:00, half persimmon at 12:30, fully persimmon near the end. Steam arrives in steps (0 → 1 → 2 → 3 wisps) and the stove glow strengthens. The exact time stays large (78 px phone, 96 px desktop) directly under it. The ring is gone. |
| D2: two Chais at the whistle (2D in the ring, 3D asleep in the room) | **One Chai**, beside the kettle. Focus uses the existing but never-used `focus` pose (eyes closed, holding a mug); the whistle uses `cheer`. The 3D view is framed on the room's window corner, so neither the 3D kettle nor the 3D Chai appears. |
| 3D room competes / static-vs-3D swap | **The room becomes a calm window.** The nook's own window (rain, moon or daylight, fairy lights) sits behind the kettle: blurred, dimmed, with no kettle or Chai in view. On desktop it is a side panel. Under reduced motion or with 3D off, it is a still of the *same* view, so nothing swaps. The full room lives on Nook. |
| The whistle climax is short and happens in the wrong place | **The whistle plays on the kettle:** lid lifted, steam jet, notes, Chai cheering, "0:00 · Tea's ready". It is planned as a 2–2.5 s beat in sync with the sound. The summary then rises over it (`5-summary.png`). |
| U1: 5 full-screen cards per brew; an 8 s countdown on a reward | **One summary sheet with every system kept:** minutes, leaves (with a breakdown line), today's goal, the streak (with the new badge and Tea Cozy on the same row), recipes, and level with the new nook item as the one highlighted row. The intention's Done / Carry forward is explained in one line. **Tea time** is the primary button and "Skip break" the secondary. No countdown. |
| U6: the break's primary button pushed back to work | The summary's primary is **Tea time · 5 min** in the calm sky tone. |
| U2: 7 setup screens before the first minute of focus | **Hello → "Start a 15-min brew"**, with an optional "What's the first thing?" field. "Set things up first" and "I have a backup" remain. After the first brew, the summary offers **"Make Kettle yours… Set up / or later in Settings"** as a row. The primary button is still Tea time, so no questionnaire is required. |
| U3: dense Home; the Chai bubble repeats the goal card; two competing counters | **Home is one action:** a quiet status line (streak, leaves, level), a greeting, and Chai with one line that includes the goal ring (12 of 30 min). Then the intention, one row with tag and length, and the button. Recipes sit below; on desktop, today's brews and a small nook preview fill the space. The duplicate goal card and "Brew 1 of 4" are gone from Home. |
| D1: desktop Nook tiles scroll over the sticky room; oversized tiles with tiny glyphs | **Room and collection side by side** on desktop. Tiles are 138 px with 69 px glyphs (112 / 56 on the phone). Locked items show their level. |
| U4: vocabulary | "Cup" is used only for the daily goal ("One more brew makes today's cup"). Leaves are explained where they're earned. |

## Motion and reduced motion (how it would behave)
- **Normal motion:** steam drifts; the stove glow breathes slowly; the fill line eases as time passes (it moves about 1 px per minute on a phone, so it's calm). At the whistle: lid rattle, a small tilt and motion arcs for about 2 s, then the summary sheet slides up.
- **Reduced motion:** the same stills (`2-…reduced-motion`, bottom row). Steam changes in steps without drifting; no shake, tilt or arcs. The window is a still image. The sheet fades in instead of sliding. All information stays: time, fill, steam steps, "Tea's ready".

## Honest limits of these mockups
- **The data is static:** from the `celebrate` and `veteran` seeds, typed in by hand. Motion is described, not shown.
- **The kettle** is a first pass at the idea: shape, fill and steam are real SVG, but not yet refined art.
- **Chai** uses existing poses until your concept sheet lands (round 1b).
- **The first brew** is shown with the 25-minute Focus frame. In production it would read 15:00.

## Rebuild
From `kettle/`, with `npx vite --port 5191` running:
1. `node review/round-6-mockups/build/shoot.mjs`
2. Room stills, if needed:
   ```
   node review/round-6-mockups/build/render-engine.mjs <out> <w> <h> '<query>'
   ```
   - Window corner: `cam={"pos":[1.9,1.55,2.7],"at":[0.55,1.6,-2.5],"fov":48}`. Use `time=night&dim=0.85` for dark and `time=day` for light; 390×844 @2 for the phone and 600×860 @1.5 for the desktop panel.
   - Full room: the engine's default camera with `mode=idle`; 390×360 @2 and 760×700 @1.5.
3. Boards: via `.tmp/media/grid.mjs`.
