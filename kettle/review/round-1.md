# Round 1: critic review

**Build:** `e0d3cf6` (= `ae19185` + scene framing tweak), exported with `git archive` and served as a production
build (`vite build` → `vite preview` on :5190), so no HMR could touch the pages. Audio ran on a frozen dev server (:5191).
**Harness:** functional 91 tests → **85 passed on the full run; the other 6 failures were harness faults. After fixing them all 6
pass** (see Harness notes). axe WCAG 2.2 AA on 12 scenes × light/dark → **23/24 clean**, with the 1 serious violation caused by the
offline toast. Layout sweep 320 / 390 / 844×390 / 820 / 1440 / 1920 → **no horizontal scroll, no overflow, no overlapping controls, no
targets under 44 px**. Keyboard-only loop, focus trap and restore, reload mid-brew, reload mid-celebration, and offline after first
load all **pass**. Console errors across all captures: **0**. Audio: all offline hard checks pass; live soundscape checks 11/11.
**Evidence** (local, gitignored): stills `review/out/round-1/shots/<id>.png` (126), motion frames
`review/out/round-1/frames/<seq>/` (CDP screencast), functional output `review/test-results/functional/`, full-run JSON
`review/out/round-1/functional-results.json`, audio `review/out/round-1/audio-*.log`, blind pairs `review/pairs/round-1/`.

This is the first build where Kettle looks like a product. The celebration sequence, stats page and onboarding are close to
Duolingo craft. Most of what keeps areas from passing is the connective tissue: what happens *between* screens (3D-init stall,
blank transition frames, glitching digits) and what happens on the *less common* viewports (landscape phone, 320, desktop).

## Summary

Scores 1–10 per RUBRIC §1. A dash (–) means not applicable. PASS requires every criterion ≥ 8.

| Area | Clarity | Charm | Polish | Ease | A11y | Resp | Cohesion | Delight | Verdict |
|---|---|---|---|---|---|---|---|---|---|
| design-system | 8 | 8 | **6** | 8 | **7** | **7** | 8 | **7** | **SEND BACK** |
| art | 9 | 9 | 8 | 8 | 8 | 8 | 9 | 8 | **PASS** |
| timer (+PWA) | **7** | – | **7** | 8 | **7** | 8 | 8 | – | **SEND BACK** (one fix) |
| audio | 8 | 8 | 8 | 8 | 8 | – | 8 | 8 | **PASS** |
| scene (3D, nook) | 8 | 9 | **6** | **7** | 8 | **6** | **6** | 8 | **SEND BACK (PROVISIONAL)** |
| progress (stats) | 8 | 8 | 8 | 8 | 9 | **7** | **7** | 8 | **SEND BACK** |
| core-loop (focus, done, break) | 8 | 9 | **7** | **7** | 8 | **7** | 8 | 8 | **SEND BACK** |
| home (home, welcome, settings) | 8 | 9 | 8 | 8 | 9 | **6** | 8 | 8 | **SEND BACK** |

Blind review: 34 anonymised pairs (15 Kettle screens × Duolingo comparables) are in `review/pairs/round-1/` with
`JUDGE.md`. The key is in `review/pairs/round-1-key/`. I have **not** scored them; the Blind Δ column fills in after the judge reports
(`node review/blind.mjs --aggregate review/pairs/round-1/scores.json`).

---

## Top 10 issues (whole app, by impact)

1. **P1 · scene:** 3D init blocks the main thread right when a brew starts: long tasks of 310 / 465 / 679 ms within the first 1.9 s
   (748 ms max at 4× CPU; SwiftShader inflates GL, but shader compile and scene build are still on the critical path). While it runs,
   timer digits freeze half-rolled, a Pause tap takes more than 2.5 s to register, and `finish()` is celebrated 2.7 s late.
   Evidence: `frames/card1-entrance/00…12`, `frames/pause/00…08`.
2. **P1 · timer + design-system:** "Kettle works offline now." toast on every first load covers the header: streak and leaves pills,
   greeting, onboarding progress bar, the Stats and Settings titles, and the focus top bar at 320. Under an open sheet it sits
   beneath the scrim at a **1.06:1** contrast ratio. This is the only serious axe violation in the build (`axe-end-sheet-light.json`).
3. **P1 · design-system (`Digits`):** rolling digit glyphs aren't clipped to their cells and stall mid-roll. Almost every still shows
   a ghost: "15:5⁴" (`focus-running.light.png`), a floating "1" above "13:3" (long break), "ᵛ5:00" stuck for 600 ms or more
   (`frames/break-start/05…10`). The brief says "numbers never jitter".
4. **P1 · design-system / core-loop:** screen changes pass through empty cream. Home → focus shows 1 blank frame
   (`frames/start-brew/04`), whistle → done shows about 300 ms blank (`frames/whistle-to-done/08–09`), and break start double-exposes
   "Warm Streak II" over "Tea time" (`frames/break-start/04`). Duolingo never shows an empty frame between lesson and result.
5. **P1 · core-loop:** in zen mode the controls stay visible at 35 % opacity but get `pointer-events: none`, so the first tap on Pause
   or End is silently swallowed. Found by the 1440 layout test; reproduced after 7 s idle.
6. **P1 · scene:** the 3D room ignores the theme. In dark mode a bright daylight room sits inside the plum UI
   (`focus-running.dark.png`, `nook-veteran.dark.png`). The static fallback is a *different* night room that hard-cuts to the daylight
   3D room (`frames/card1-entrance/11→13`). The level-up nook preview is blank in dark mode (`done-card4.dark.png`).
7. **P1 · core-loop:** celebration cards at 1440 are a phone-sized column about 350 px wide, floating in a huge empty stage, with a
   small Continue in the far corner (`done-card2.desk.png`). At 1440 the whistle ring was still showing 4.2 s after completion
   (`done-card1.desk.png`).
8. **P1 · home:** at 320×640 the primary "Put the kettle on" is below the fold (`home-veteran.small.png`). On a landscape phone
   (844×390) home shows only the greeting and goal, with the CTA about 2 screens down (`home-veteran.land.png`), and the welcome
   screen's giant Chai pushes "Get started" off-screen (`onb-hello.land.png`).
9. **P1 · progress:** desktop stats is one ~420 px column plus a right rail that repeats the same streak, level and recipe cards
   the page already shows (`stats-veteran.desk.png`), using about 40 % of a 1440 screen.
10. **P2 · core-loop:** the whistle beat is the emotional peak but reads as a status indicator: a green check ring and an 11 px
    "Whistling…" label, with no Chai and no steam burst (`frames/whistle-to-done/02–07`). Duolingo turns completion into a
    character moment.

---

## design-system: SEND BACK

The foundation is strong: tokens, pressable buttons with a darker bottom edge, cards with a 2 px border and 4 px edge, a
genuinely designed plum night theme, custom toggles, sliders and steppers, a desktop sidebar with a right rail, and a mobile tab bar
with a pill active state. What fails is motion and layering.

- **P1 Digits roll** (issue 3). Clip each cell (`overflow: hidden` on the cell, not the row), cap the roll at 150–180 ms, and
  never leave a glyph mid-translate. If the main thread stalls, snap to the final value. Under reduced motion, cross-fade.
  Duolingo's timed challenges tick crisply.
- **P1 Toast layering and placement** (issue 2, placement part). Toasts must sit above sheet scrims (z-order), must never cover
  header chrome, and should sit bottom-centre above the tab bar or CTA on mobile. On desktop, use the bottom-right of the content
  column. Any screen: `home-*.png`, `settings.light.png`, `stats-*.png`.
- **P1 Route transitions** (issue 4). `AnimatePresence mode="wait"` in `App.tsx` exits fully before entering, which leaves a
  blank frame. Overlap them instead: enter over exit, or use `mode="popLayout"`, and slide the new screen up over the old.
  `App.tsx` is shared, so coordinate with the orchestrator.
- **P1 Landscape-phone shell.** At 844×390 the shell switches to the desktop sidebar while screens keep their tall portrait
  stacks. Add a compact-height breakpoint (`max-height: 500px`): a slim icon rail, tighter vertical rhythm, and a sticky primary CTA
  slot the screens can opt into. Evidence: `home-veteran.land.png`, `nook-veteran.land.png`.
- **P2 Rail duplicates page content** on `/stats` (see progress) and `/nook` (`nook-veteran.desk.png`: streak, level and recipes in
  the rail, level again in the page). Make rail content route-aware.
- **P2 Disabled primary** is beige on beige and almost disappears (`onb-name.light.png`, `onb-goal.light.png`). Duolingo's
  disabled button is clearly a button, just inert. Use a visible neutral fill and a 3:1 outline.
- **P2 Bundle:** the main chunk is 518 KB (167 KB gzipped) before three.js. Lazy-load `motion` for non-first screens and the audio
  engine until first gesture (coordinate with timer, who owns the build config).

## art: PASS

Chai is charming, legible at 24–240 px, consistent in construction, and uses a real range of poses: wave, focus (eyes closed with
mug), sip, cheer, sleep, think, concerned, peek. Badges (hex with tier pills), the recipe tin, the streak mug with its number
badge, goal and ambience spots, and break-idea art are one coherent family. Live animation is correctly gated by
`useReducedMotion`. (A reduced-motion failure in my first run was a harness bug; see Harness notes.)
- **P2** The `concerned` pose reads well at 3× but is subtle at the sheet's ~80 px (`focus-endsheet.light.png`). Push the brow
  tilt and add a held-cup "hmm" gesture so it reads at a glance, like the sad Duo on Duolingo's quit sheet.
- **P2** The reset-data sheet reuses the neutral pose (`settings-reset-confirm.png`). Use `concerned` there too.

## timer (+PWA): SEND BACK (single fix)

The engine is solid:
- Wall-clock accurate across reloads (drift under 1.5 s), and paused state survives a reload.
- Two tabs record exactly one brew.
- Tab title shows "13:30 · Long tea break — Kettle".
- Offline works after first load, with lazy chunks precached.
- The shortcut infrastructure and help sheet are good.

- **P1 Suppress the "Kettle works offline now." toast** (issue 2, trigger part). Caching is plumbing, not news: don't
  announce it during onboarding or on first home load. If you must say it, say it once, quietly, *after* the first brew or in
  Settings → About ("Works offline ✓"). Every first-load screenshot is affected, and it is the one serious axe violation.
- **P2 (note)** Under load, completion recording across two tabs took more than 2.5 s to land in both stores. It is correct but
  slow (`two tabs` needed a longer poll). Worth a look once scene's init stall is fixed, since they share the main thread.

## audio: PASS

Offline render: all hard checks pass. Levels are tiered sensibly: taps about −30 LUFS, start −20, streak and badge −18,
level-up and complete −15. There is no clipping or DC, and the streak tick rises in pitch through the count-up. Live: fade-in on
start, a −9.4 dB pause dip (not a stop), crossfade on picker change, ambience survives navigation, simmer rises in the last 40 s,
mute and unmute work, only one of two tabs plays, fade-out on end, and settings preview plays then stops.
- **P2** Ambience beds render at about −16 LUFS integrated, within 1–2 dB of the completion whistle's momentary loudness. Duck
  ambience by about 6 dB under `complete`, `levelUp` and `streak`, or lower bed targets to about −20 LUFS, so the whistle is
  unmistakable (`audio-check.log`, scenario `ambientPlusComplete`).
- **P2** Lo-fi has click score 39 and fire 25, the highest of all renders. Audition for zipper or transient clicks at loop and
  grain boundaries.
- (The live check's 403 console errors come from my frozen-copy server setup, not the app.)

## scene: SEND BACK (PROVISIONAL, mid-build)

The room itself is lovely: warm isometric 3D, stove and kettle with steam, lamp, rainy window, plants, a rug, and Chai at the table.
Unlocked items appear, and the nook screen's "A surprise at level 14" teaser, item grid and in-voice item stories are great.
- **P1 Main-thread stall at brew start** (issue 1). Don't build the scene on the start tap. Pre-warm on Home when idle
  (`requestIdleCallback`), compile shaders asynchronously (`renderer.compileAsync`), and build meshes across frames. Show the
  fallback until the first frame renders *after* the start animation. Budget: no task over 50 ms in the first 2 s of a brew.
- **P1 Theme and time-of-day mismatch** (issue 6). Night theme should mean dusk or lamplight (brief §5). Make the static fallback
  match the 3D composition and lighting, then cross-fade (300 ms) instead of hard-cutting between two different rooms.
- **P1 Level-up preview blank in dark** (`done-card4.dark.png`), while the light version renders (`done-card4.light.png`).
- **P2** Large canvases (1440 / 1920 / landscape @2×) were still fading in 3–5 s after mount on software GL
  (`focus-running.wide.png`, `nook-veteran.land.png`). Render a low-DPR first frame and cap DPR harder at large sizes.
- **P2** The dark-UI focus screen puts a bright 3D card on plum; even at night, a slight dim or vignette would sit better
  (`focus-running.dark.png`).

## progress (stats): SEND BACK

The mobile stats page reaches Duolingo-profile craft:
- 2×2 overview tiles with icons
- a Cozy-level card with its next unlock
- last-7-days bars against a goal line
- a month calendar with joined warm-streak runs and a distinct Tea-Cozy day
- honey personal-best tiles and tiered hex badges
- "You're a morning brewer" with a 24-hour histogram, and a tag breakdown
- editable history with "Show earlier days"

The empty state is warm ("Nothing brewed yet." with Chai and a CTA).
- **P1 Desktop layout** (issue 9). At 1440 and above, use two columns: overview, streak calendar and last 7 days on the left;
  badges, rhythm and history on the right. Drop the rail cards the page already shows (coordinate the rail with design-system).
  Evidence: `stats-veteran.desk.png`, `stats-veteran.wide.png`.
- **P2** The mobile page is about 5,000 CSS px long. Show 6 badges plus "View all" (as Duolingo's achievements row does) and
  collapse "Your rhythm" to its headline card until tapped.
- **P2** The toast covers the "Stats" title on first load (fix via timer and design-system).

## core-loop (focus, done, break): SEND BACK

Focus at 390 is calm and clear. The paused state is unmistakable: desaturated scene, "Paused" pill, "the kettle will wait", a
persimmon Resume. The end sheet matches the Duolingo quit-sheet pattern with Kettle's no-guilt copy and a "9 minutes of focus
will be saved" chip. The celebration sequence is the best thing in the app: count-up tiles with a leaves receipt; a streak card
where the badge flips 6→7, the week fills and then leaves burst; the tin-opening recipe card; level-up with the nook item; a badge
card; a sky-blue "Start tea break" with a 10 s auto-start and "Wait". Break is sky-toned with rotating ideas; break-over offers
"Put the kettle on" / "Done for now".
- **P1 Zen swallows taps** (issue 5). While dimmed, keep controls interactive: the first tap both wakes *and* acts.
  Alternatively, hide them completely so they don't look tappable.
- **P1 Desktop celebration scale** (issue 7). At 1440 and above, scale art by about 2×, set the headline at 40–48 px, make stat
  tiles 1.5×, and centre the CTA under the content. Duolingo web's lesson-end uses the stage. Also cap the whistle beat at about
  1.2 s regardless of scene state.
- **P1 Blank or double-exposed transitions** (issue 4, your parts). Focus → done and done → break both run through your own
  crossfades.
- **P2 Whistle beat** (issue 10). Put Chai in (cheer or ears-up), burst the steam from the scene kettle, and grow the ring into
  the first card. Right now the peak moment is the quietest screen.
- **P2** The badge card (card 5) leaves about 25 % dead space between content and CTA (`done-card5.light.png`). Pull the CTA up or
  grow the badge.
- **P2** The break-idea rotation cross-fades through an *empty* card (`break-long.light.png`). Overlap old and new.

## home (home, welcome, settings): SEND BACK

Home is the right Duolingo-grade hierarchy:
- a time-of-day greeting and a Chai line that reacts to progress ("Lovely work so far. 10 more minutes and today's pot is full.",
  "Still up, Sam? Late-night brew? Let's keep it short and sweet." with a "Try Gentle · 15 min" nudge)
- a goal ring
- the intention composer, tag chips and rhythm segment
- a big CTA with "Then a 5 min tea break."
- recipes and a brew timeline

Desktop uses sidebar, content and rail properly. Onboarding is one question per screen with Chai, big option cards, a progress
bar and a lovely summary step ("You're all set, Robin." with goal, rhythm, sound and nudges). Settings is complete and well grouped.
- **P1 CTA below the fold at 320×640** (`home-veteran.small.png`). On short viewports make "Put the kettle on" sticky above the
  tab bar, or collapse the composer into a one-line "What are you brewing?" row that expands.
- **P1 Landscape phone** (`home-veteran.land.png`, `onb-hello.land.png`). Use a two-column layout (greeting and goal | composer and
  CTA), with Chai at 72 px beside the bubble. On welcome, put Chai left and bubble plus "Get started" right. The CTA must be
  visible without scrolling.
- **P2** Time of day changes only the greeting. The same pose and line appear at 08:20 and 21:40 for the same progress
  (`home-veteran-morning.png` vs `-evening.png`). Add a morning stretch and an evening lamp or sleepy variant.
- **P2** The name step disables Continue although the name is optional (`onb-name.light.png`). Keep it enabled ("Continue"
  becomes "Skip for now" when empty) and drop the separate top-right Skip.
- **P2** The tag chip row is hard-clipped at the edge with no fade (`home-*.light.png`). Add a 24 px fade mask to signal scroll.
- **P2** Desktop welcome is underscaled: a small Chai and a 170 px CTA in a large empty canvas (`onb-hello.desk.png`).

---

## Cross-cutting cohesion (one owner each)

| Issue | Owner |
|---|---|
| Toast placement, z-order above scrims, never over header chrome | design-system |
| When the PWA "offline ready" toast fires (don't, on first load) | timer |
| Blank frame between routes (`App.tsx` `mode="wait"`); coordinate with orchestrator since `App.tsx` is shared | design-system |
| Landscape-phone strategy (compact-height breakpoint, sticky CTA slot) | design-system (screens adopt it) |
| Desktop scaling is inconsistent: home, stats and focus adapt; done and welcome don't | core-loop (done); home (welcome) |
| 3D scene ignores dark theme, and its fallback doesn't match | scene |
| Right rail repeats page content on /stats and /nook | design-system |
| Digit roll glitch shared by focus, break and done tiles | design-system |

## Harness notes (so results are reproducible)

- Six failures in my first full run were harness faults, fixed in `functional.spec.ts`:
  - a covered radio needed a real card click
  - break-over is a designed view (not auto-home)
  - digits are split spans (the test now uses `timerView()` and the tab title)
  - nook items are buttons
  - zen needs a pointer wake
  - `test.use({ reducedMotion })` silently did not apply (`matchMedia` stayed false), so the tests now use `page.emulateMedia`
- The reduced-motion "violation" and the transient done-card contrast hit both came from that last bug. With real emulation, Chai
  is static under reduced motion.
- `press()` no longer re-clicks on a *slow* click. One slow click is itself evidence: Pause took more than 2.5 s during 3D init
  (issue 1).
- The capture matrix is `node review/capture.mjs --round 1`, and frames use CDP screencast (real cadence).
  `review/split.mjs` makes long full-page shots reviewable.
