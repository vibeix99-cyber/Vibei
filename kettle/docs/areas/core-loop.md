# Core loop — Focus · Break · Session complete · Flow

Owner: core-loop area. Files: `src/screens/focus/**`, `src/screens/done/**`, `src/app/flow.ts`.

## How to reach every state (dev, `?debug`)

| State | Recipe |
|---|---|
| Focus | `__kettle.timer.getState().startFocus({intention:'Thesis chapter 3', tag:'study'}); __kettle.ff(9*60e3)` |
| Paused | …then `__kettle.timer.getState().pause()` |
| Zen | focus running, no input for 7 s → chrome fades, cursor hides |
| End sheet | focus → `Esc` (or End) |
| Ambience sheet | focus → "Rain" button |
| Whistle beat | focus → `__kettle.nearEnd()` (≈2 s on #/focus, then #/done) |
| Celebration | `?seed=celebrate` then start + `__kettle.finish()` → every card (whistle, streak 7 + Tea Cozy, recipes w/ tin, level up + item, 3 badges) |
| While-away variant | finish while the tab is hidden / app closed → "The kettle whistled" + "Your brew finished while you were away — nice." |
| Short break | `__kettle.timer.setState({completedInCycle:2}); __kettle.timer.getState().startBreak('shortBreak')` |
| Long break | `…setState({completedInCycle:4}); …startBreak('longBreak')` |
| Break's over | settings `autoStartFocus:false`, start a break, `__kettle.finish()` |
| End-early toast | focus 12 min → Esc → End session → home + "Saved 12 minutes of focus" |

Scripts used for the loop (scratchpad, not committed): a Playwright screenshot driver with the states above
(isolated context per state, `--scene off` for fast layout passes) and a flow checker (22 assertions: whistle→done,
Enter/Space advance, heading focus, reload keeps card, done→break, no-report guards, end-early toast,
break-over + reload, next brew, skip, autoStartFocus, Space/+/Esc, focus return after the sheet). All pass.

## Flow (`src/app/flow.ts`)

- `timer:complete` focus → sound, then **whistle beat** on #/focus (1.9 s; 1.1 s reduced) if the user is
  watching, else straight to #/done. Celebration card index lives in a sessionStorage store (`useFlow`), so a
  reload lands on the same card.
- #/done → "Start tea break" (auto-countdown 10 s when `autoStartBreaks`, pausable with "Wait", paused while
  the tab is hidden) or "Skip break" → home. Both clear `lastReport`.
- Break complete → next brew if `autoStartFocus` (and not while away), else **Break's over** card (persists
  across reload); stale (>30 min, app closed) → home quietly; not on #/focus → toast.
- End focus early → home + toast ("Saved N minutes of focus" / "Kettle's off. See you soon.").
- `timer:sync` (other tab) mirrors routes only.
- Guards: #/focus with nothing to show → #/done if a celebration is pending, else home; #/done without a
  report → home (only on arrival — leaving via CTAs keeps the last card on screen during the exit).

## Decisions

- Timer dial is a local `TimerRing` (tactile edge under the arc + head bead + phase color crossfade via CSS
  vars, driven per frame by `useProgressFrame`, zero React re-renders). Everything else uses the kit
  (`Digits roll="down"`, `Button`/`IconButton`, `Sheet` hero/footer/initialFocus, `Slider`, `PressableCard`,
  `Pill`, `Kbd`, `Ring`, `Counter`) and the art kit (`Mascot`, `StreakMug`, `TeaTin`, `TeaCozy`, `LevelBadge`,
  `Badge`, `QuestIcon`, `Leaf`, `BreakSpot`).
- Big round controls = kit `Button` made round via `--h` (`RoundButton`), caption underneath.
- Leaf confetti is custom (≤26 SVG leaves, transforms only). Reduced motion: 6 static leaves fade.
- Leaves card (a) counts brew leaves only; recipe rewards are celebrated on the tin card (c) — no double counting.
- Streak card uses the **last 7 days ending today** (not the calendar week) so a long streak reads as a run
  that today extends; today warms last.
- Sounds follow the audio contract: pentatonic `step` for count-ups, paired haptics come from `audio.play`
  (no manual `haptic()` next to a sound), tick sounds pass `haptic:false`.
- Ambience: screen requests it for focus/break, quiet during whistle/celebration (audio's session controller
  owns focus ambience anyway).

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

## Open issues / requests

- **scene**: `mode="showcase"` + `highlightItem` renders the whole room small in the 180–230 px level-up card —
  please frame/zoom the highlighted item there. The scene needs a few seconds under swiftshader; the card shows
  its loading gradient meanwhile.
- **design-system**: `html { scrollbar-gutter: stable }` shows a strip on full-screen routes (overridden locally via
  `html:has([data-focus-view]) / html:has([data-done-screen])`). Consider an `xl` round `IconButton` with a caption
  slot (would replace `RoundButton`).
- **timer**: add `M` (mute) to `SHORTCUTS` registry (bound on the focus screen).
- **orchestrator**: App's route transition leaves a ~0.3 s blank between the whistle and the celebration
  (AnimatePresence `mode="wait"`); a crossfade for `/focus → /done` would be smoother.
