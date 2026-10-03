# Core loop — Focus · Whistle · Summary · Tea break · Flow

Owner: core-loop area. Files: `src/screens/focus/**` (the session screen and its stage), `src/screens/done/**`
(the summary), `src/app/flow.ts`.

## One session screen (round 6)

`#/focus` and `#/done` render the same screen (`src/screens/focus/FocusScreen.tsx`). The App gives both routes one
layer key (`session`), so the brew, the whistle, the summary and the tea break never dissolve into each other.
- **The stage stays put:** the window, the counter, the kettle and Chai keep their position in every state, so
  there is no empty hand-off and no cross-fade of whole scenes, in normal or reduced motion.
- **What changes:** only the kettle's state, Chai's pose and the panel beside the stage (or below it, stacked).

| View | Kettle (`stage/Kettle.tsx`) | Chai (painted) | Panel |
|---|---|---|---|
| focus | `run`: flame, stepped steam, gauge needle on progress | reading | countdown, status, "12 min brewed · whistles at 3:55 PM", Add 5 / Pause / End |
| paused | `paused`: flame out, no steam, gauge holds | reading | "Paused" flag, dimmed digits, "The kettle will wait.", "12 min brewed so far", Resume (primary) |
| added time | honey segment on the gauge for the added part | reading | flag "+5 min · whistles at 4:00 PM now", "… · now a 30 min brew", caption "Add 5 more" |
| whistle | `whistle`: cap flips, puff jet, cloud, notes, lid rattle | cheering, three hops | "0:00 · Tea's ready! · 25 min brewed"; controls fade |
| summary (`#/done`) | whistles about 1.8 s more, then `rest` | cheering (the only one) | the one summary, see below |
| break | `rest`: off the heat, a small curl, gauge full | sipping | sky countdown "4:59", "Tea time. Sip slowly.", Skip break / Pause / Next brew, break ideas when tall enough |
| over | `rest` | stretch | "Break's over", Put the kettle on / That's all for now, "Mark it done" for a carried task |

**Every visual state follows the real timer:**
- Progress is `useRemaining().progress`, and the gauge has a 0.9 s CSS transition between seconds.
- Added time is the timer's persisted `addedMs`. `addedFrom = (plannedMs − addedMs) / plannedMs` places the honey
  segment, so extended and restored sessions draw correctly after a reload.
- The countdown digits are the exact reference. The gauge is the at-a-glance one: a 240° dial, readable at phone size.

**Layouts:**
- **Stacked** (portrait): stage on top, full-bleed (`--stage-h: clamp(250px, 50dvh, 150vw)`; 56 dvh on tablets). The
  task and ambience chips sit on the window. The panel is below; on the summary it is a sheet that rises over the
  counter's front edge.
- **Side by side** (aspect ≥ 5/4 and ≥ 560 px wide): stage left in a rounded frame, panel right. The summary is a
  content-sized card in that column (no modal). Landscape phones tighten everything.

### The stage (`src/screens/focus/stage/`)
- **Back:** the nook's own window, from the 3D engine's `window` mode (fixed camera, cover-fit). It is held as a
  still and quieted with a blur that scales with the stage, desaturation and a theme-tinted gradient. The room's
  tea set is left out of it (it read as a second kettle). Before the engine is ready, or with 3D off, a
  pre-rendered still of the same view shows instead (`src/scene/stills/`, 12 WebPs).
- **Middle:** one wooden counter in the room's palette, with window light spilling forward by day and the stove's
  warm pool at night.
- **Front:** one contact-shadow style for both figures, then one soft-light layer.
- **Sizing:** everything is in `--u = min(0.25cqw, 0.3cqh, 1.6px)`. The cap keeps the painted Chai near its source
  resolution.

### The summary (`src/screens/done/Summary.tsx`, model `summary.ts`)
- **Built from** the `CompletionReport` the progress engine computed, and granted, once when the brew completed.
  `buildSummary` is pure and grants nothing. Reloading or re-opening the summary cannot change a reward (unit
  tested, and checked across a real reload).
- **Order:**
  1. "25 minutes brewed" and the sub-line; **Tea time · 5 min** sits in a footer that never scrolls away.
  2. The task, only when there was one: its name, then Done / Carry forward, with a line saying what each means.
  3. Routine rewards as compact pills: leaves; today's goal; streak; Tea Cozy; recipes (once one is done); level
     progress; badges.
  4. A major room unlock gets a full-width picture of the item in the user's room.
  5. "How your leaves added up" expands the arithmetic, level progress and the streak rule.
- **First brew:** the first brew started from the welcome adds "Make Kettle yours · Set up".
- **Motion:** the content rises in a 60 ms stagger. With reduced motion it is a single fade and nothing moves.
- **Keys:** Enter or Space anywhere outside a control starts tea time. The optional auto-start countdown can be
  stopped with "Wait".

## How to reach every state (dev, `?debug`)

| State | Recipe |
|---|---|
| Focus | `__kettle.timer.getState().startFocus({intention:'Thesis chapter 3', tag:'study'}); __kettle.ff(9*60e3)` |
| Paused | …then `__kettle.timer.getState().pause()` (or Space) |
| Added time | focus → `+` (or Add 5) |
| Zen | focus running, no input for 7 s → chrome fades, cursor hides |
| End sheet | focus → `Esc` (or End) |
| Ambience sheet | focus → the ambience chip |
| Whistle → summary | focus → `__kettle.finish()` (2.2 s whistle on #/focus, 1.2 s reduced, then #/done in the same layer) |
| Major unlock | `?seed=celebrate`, start, `__kettle.finish()` |
| While-away variant | finish while the tab is hidden or the app is closed → "The kettle whistled while you were away" |
| First brew | `?seed=fresh#/welcome` → "Start a 15-min brew" → finish → "Make Kettle yours" |
| Short / long break | `__kettle.timer.setState({completedInCycle:2 or 4}); __kettle.timer.getState().startBreak()` |
| Break's over | settings `autoStartFocus:false`, start a break, `__kettle.finish()` |
| End-early toast | focus 12 min → Esc → End session → home + "Saved 12 minutes of focus" |
| Window time / weather | `&nooktime=day|dusk|night&nookweather=rain|snow|clear` |

## Flow (`src/app/flow.ts`)

- **Focus completes:** `timer:complete` focus → sound, then the **whistle** on #/focus (2.2 s; 1.2 s with reduced
  motion) if the user is watching, else straight to #/done (the while-away copy). The pending summary's id lives in
  a sessionStorage store (`useFlow.celebration`), so a reload lands on the summary.
- **From #/done:**
  - "Tea time" (auto-countdown of 10 s when `autoStartBreaks`; "Wait" stops it; paused while the tab is hidden)
    starts the break.
  - "Skip break" → home.
  - "Set up" (first brew only) → `#/welcome` at the name question.
  - All three clear `lastReport`.
- **Break completes:** the next brew starts if `autoStartFocus` (and not while away). Otherwise the **Break's over**
  view shows; it persists across a reload. A break stale by more than 30 min (app closed) goes home quietly; if
  the user isn't on #/focus, a toast.
- **End focus early:** home + toast ("Saved N minutes of focus" / "Kettle's off. See you soon.").
- **Other tab:** `timer:sync` mirrors routes only.
- **Guards:**
  - #/focus with nothing to show → #/done if a summary is pending, else home.
  - #/done without a report → home. This applies only on arrival; leaving through a button keeps the summary on
    screen during the exit.
  - While the screen is the outgoing layer, it freezes its last frame.

## Decisions

- **The kettle is the timer.** It is an inline SVG (`stage/Kettle.tsx`) whose state comes from props. All motion is
  CSS transforms and opacity on groups: flame flicker, steam sway, lid rattle, puff jet. The gauge needle is a
  rotate transform. No per-frame React renders and no GSAP. Reduced motion renders the same states, still.
- **Chai is the approved painted art** (`src/art/PaintedChai.tsx`; masters in `art-src/chai/`). The stage shows
  exactly one Chai, and the summary shows no second one.
- Big round controls are the kit `Button`, made round via `--h` (`RoundButton`), with a caption underneath.
- Leaf confetti only marks a major unlock (gold, 18 leaves). Reduced motion: 6 static leaves fade.
- Sounds follow the audio contract: paired haptics come from `audio.play`. The level-up sound plays once, for a
  major unlock.
- **Ambience:** the audio session owns it during a brew. The screen asks for it on tea breaks, and for quiet
  around the whistle, the summary and break-over.
- **Removed:** the five-card celebration (`DoneScreen`, `steps/`, `choreo`) and the timer ring (`TimerRing`). Also
  removed is the whistle "bloom" that painted over the route change; with one layer there is no route change to
  hide.

## Iterations

1. **Skeleton** — flow store + events; focus layout (portrait / landscape / desktop split); break with ideas +
   breathing guide; celebration sequence with local stand-ins. Critique: +5 caption redundant, "Start next brew"
   wrapped, desktop gutter strip, receipt too long (6 chips incl. recipes), streak strip showed the calendar
   week (1 dot for a 7-day streak), heading focus ring visible, badge shine left a white band.
2. **Fixes** — caption "Add time", break pause moved to the header, rolling 7-day strip, recipe rewards moved to
   the tin card, heading outline removed (programmatic focus target), glint clipped to the medal,
   `scrollbar-gutter` override on full-screen routes.
3. **Kit + art migration** — kit Digits/Buttons/Sheet/Slider/PressableCard/Pill/Kbd/Ring/Counter, TimerAnnouncer,
   useShortcut, useProgressFrame ring; art StreakMug/TeaTin/Badge/LevelBadge/QuestIcon/Leaf/BreakSpot. Compact
   ambience tiles (label only + "now playing" line). Whistle steam moved above the ring.
4. **Behaviour + a11y** — done→break race (report cleared → redirect home) fixed; double-press guard on exits;
   focus returns to Pause after the Esc sheet; doubled haptics removed; steam puffs dropped from the
   celebration hero (read as smudges in dark mode); narrow-phone labels ("Next brew" < 360 px).

5. **Small screens + polish** — 320 px: compact tiles (icon over value), cycle label + ambience label collapse
   to icons, "Next brew" short label; short portrait breaks (< 700 px) hide the room so nothing overlaps;
   landscape celebration becomes two columns (hero left) with a real sticky footer (`overflow-x: clip`);
   streak number anchored to the mug; confetti passes *behind* text and cards; whistle steam (overlapped the
   intention on desktop) replaced by a check ripple, no bead on the full ring; tin goes closed → opening → open;
   tags from `@/state/tags`; ambience during a brew left to the audio session. Unit tests (12) for
   `buildSteps`/`summarize`/`cycleInfo`/`focusStatus`/`suggestionsFor`; axe: 0 violations on focus, paused,
   break and every celebration card in light + dark.

6. **Late kit/art pickups** — streak card uses the kit `WeekStrip` (`celebrate` lights today); end sheet's
   "End session" is `dangerSoft` under the primary "Keep brewing". Final screenshots: `.shots/core-loop/final/`.

7. **Round 6: the kettle is the timer.**
   - **One session screen** with a stage that never moves: the whistle, the summary and the tea break are panel
     changes, not route dissolves.
   - **The kettle SVG** has a readable gauge, an added-time segment and a whistle jet of separate puffs. The
     earlier solid cone neck is gone.
   - **Chai** is the painted pose for each state.
   - **One summary** replaces five cards: minutes and Tea time first, compact pills, a prominent unlock,
     arithmetic on request.
   - **Rewards** come from the engine report, with nothing granted in the UI.
   - **The first visit** goes from hello straight to a real 15-minute brew, with setup optional afterwards.
   - **Verified** (scratchpad checker, 83 assertions, static and 3D):
     - start, pause and resume, +5, and reload restore;
     - whistle → summary on the same stage node;
     - exactly one cheering Chai;
     - rewards granted exactly once across a reload;
     - Done and Carry forward, and the carried task on Home;
     - Enter starts tea time;
     - break restore, break's over, end early, Esc, M, Tab order;
     - small-phone scrolling and fit;
     - the first visit;
     - under reduced motion, nothing moves.

## Open issues / requests

- **scene**: `mode="showcase"` + `highlightItem` renders the whole room small in the 180–230 px level-up card —
  please frame/zoom the highlighted item there. The scene needs a few seconds under swiftshader; the card shows
  its loading gradient meanwhile.
- **design-system**: `html { scrollbar-gutter: stable }` shows a strip on full-screen routes (overridden locally via
  `html:has([data-focus-view]) / html:has([data-done-screen])`). Consider an `xl` round `IconButton` with a caption
  slot (would replace `RoundButton`).
- **timer**: add `M` (mute) to `SHORTCUTS` registry (bound on the focus screen).
- ~~**orchestrator**: a blank between the whistle and the celebration~~ — resolved in round 6: one session layer.
