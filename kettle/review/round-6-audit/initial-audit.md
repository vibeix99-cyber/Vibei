# Round 6: initial audit (before the critic)

> Superseded: this is the draft **before** the independent critic. See `REPORT.md` (final) and `critic.md` (what changed and why).

Build under review: HEAD `e8b9752`. The app source is unchanged since `210e750`. The private preview (claude.ai artifact, version `1790748177-130a`) is byte-identical, ignoring whitespace, to a fresh single-file build of HEAD. Captures come from the production build (`vite build` + `vite preview`), with seeds `fresh / newbie / celebrate / veteran / blank / atRisk`, in Chromium with software WebGL. Evidence is in `shots/`.

## Verified defects
1. **Desktop Nook layering.** At 1280 / 1440 / 1920 wide, the level card and the item grid scroll over the sticky room. The item tiles are about 300×240 px with 40 px glyphs. Evidence: `nook-1280-light-scrolled.png`, `nook-desktop-dark-items.png`, `nook-1920-light-scrolled.png`.
2. **The static room is not the 3D room.** The two differ in palette (lavender versus warm amber), lighting, item placement and framing. The static room shows first on every focus start, on the break screen and when 3D is off, so the swap is visible. Evidence: `phone-dark-celebrate-03-start-120ms.png` versus `-450ms.png`; `nook-desktop-dark-off.png` versus `-high.png`; `desktop-dark-celebrate-08-done-5.png`.
3. **The whistle climax is cut short.** About 1 s of steam jet and green ring in the room, then a near-blank frame of about 0.5 s (seen frame by frame in ad 01's deterministic recording, frames 110–128), then the card. Evidence: `phone-dark-celebrate-07-whistle-300ms.png`, `-1500ms.png`.

## Usability problems
4. **Reward pile-up.** One brew on the `celebrate` seed produces 5 full-screen cards, each needing Continue: the whistle summary, 7 days warm, recipes, Level 8, a new badge. Then a tea-break prompt that auto-starts in 8 s. Evidence: `phone-dark-celebrate-08-done-0..5.png`.
5. **Onboarding length.** Seven screens (hello, name, goal, rhythm, sound, nudges, summary) before the first minute of focus. The final CTA starts a 50-min Deep brew with no intention. The audience is people who stall before starting. Evidence: `phone-dark-onboard-*.png`.
6. **Home density.** On a phone: 3 status pills, a greeting, a Chai bubble that repeats the goal card, the goal card, a composer (input, 5 tags, 4 rhythms), the CTA, recipes, and today's brews. Two counters conflict: "Brew 1 of 3/4" (the long-break cycle) and the daily goal ("about one more brew"). Evidence: `phone-dark-celebrate-01-home.png`, `vet-home-mobile-dark.png`.
7. **Too many systems for a calm tool.** Streak, leaves, cozy level, recipes, badges × 5 tiers, Tea Cozies, the nook collection. Stats is 8 stacked sections. Evidence: `vet-stats-mobile-dark.png`.
8. **Large-screen composition.** Tablet Home packs everything into the top ~60%. Desktop Home leaves an empty lower-left. Evidence: `tablet-dark-newbie-01-home.png`, `vet-home-desktop-dark.png`.

## Art direction (subjective)
9. **Focus screen has two competing focal points.** A diorama in a card, and a generic ring timer, which takes about 45% of the screen. The metaphor is implemented (steam scales with progress in `Engine.ts`), but the kettle is about 60 px in a corner, so the heating is imperceptible. Evidence: `phone-dark-celebrate-03-start-450ms.png`.
10. **Chai's limited expressiveness.** The silhouette is a rounded rectangle on a barrel, with dot eyes set high. Most poses differ only in arms or eyes; only cheer and sleep change the silhouette. At Home sizes (56–72 px) emotions barely read. The 3D Chai is a head-on-cushion loaf. Evidence: `kit-art-light.png`.
11. **"Card soup" UI.** Nearly every element is a bordered rounded card with a raised lip, at similar weight, on plum. Hierarchy comes from size alone. Light theme is warmer and clearer than dark. Evidence: all tab screens.
12. **The 3D nook floats in a card.** It sits over a void; the camera is fixed (dragging rotates slightly); tapping an item opens a story card; Chai does little. The nook's best framing is on desktop Nook, which few people will see during a session.

## Motion and sound
- Reduced motion works: calm static cards, no leaf fall, dissolve only.
- Whistle, measured not heard: 0.9–1.4 kHz, about 1.5 s, gentle. Ambiences are synthesized. Needs a listening check.

## Reliability (verified this session)
- 249/249 unit tests, 97/98 functional (1 skipped: needs a built service worker), 29/31 e2e (2 skipped).
- axe: 0 violations across 24 screen/theme states.
- Open from round 4:
  - concurrent merges don't re-grant day rewards;
  - the real-device checklist has not been run by me.

## Draft direction and first round
**Direction: "Warm Room".** The 3D nook becomes the stage for the ritual. Focus = a full-bleed room with the kettle as the hero and the timer. Completion happens in the room. Rewards are consolidated into one sheet. The static art is rendered from the real room.

First round:
- (R1) Focus = the room.
- (R2) The whistle stays in the room for about 2.5 s, then one summary sheet rises.
- (R3) A consolidated summary with one tap to the break.
- (R4) Static fallback renders of the real 3D room.
- (R5) Desktop Nook and tablet Home layout fixes.
