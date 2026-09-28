# Home · Onboarding · Settings — area log

Owner: home area (`src/screens/home/**`, `src/screens/welcome/**`, `src/screens/settings/**`).
Dev port 5188. Screenshots in `.shots/home/`.

## Structure

- `home/HomeScreen.tsx`: StatusBar → Hero (greeting + Chai line) → ResumeBanner (when a brew or break is live) → GoalCard (ring) → Composer (intention, tags, rhythm, CTA) → Today's recipes → Today's brews.
- `home/chai.ts`: pure, unit-tested (`chai.test.ts`) logic for the greeting and Chai's contextual line. Priority: first ever → goal met → late night (suggest Gentle, mention a streak at risk) → back after 3+ days → evening streak at risk (invite, never warn; mentions a Tea Cozy on standby) → progress → first visit today (by time of day) → idle. Copy is seeded per day so it doesn't flicker. Non-breaking hyphens in "5‑day" and "15‑minute".
- `home/useHomeData.ts`: derives everything from stores and `useNow()` (re-renders on debug clock jumps, so `__kettle.ff` works). Today's minutes are computed from sessions + the current day key, not a memo that could go stale.
- `home/content.ts`: goal, rhythm, tag and ambience metadata shared by all three screens (ambience comes from `AMBIENTS` in `@/audio`).
- `welcome/`: 7 steps (hello, name, goal, rhythm, ambience, notify, ready). Chai and the bubble stay put while the body slides. Native radios inside tactile option cards give arrow keys and screen-reader semantics. Enter advances, the question heading takes focus on each step, and there's a sticky footer CTA.
- `settings/`: kit `ListGroup` / `ListRow` sections, plus `DataSection` (export, import with preview + replace/merge confirm, reset with a serious confirm).

## Iteration 1

- Built all three screens on local stand-ins (kit and art weren't there yet), then migrated to the real `@/ui` kit as it landed. The local kit folder is deleted.
- Onboarding fixes after the first screenshots:
  - Rhythm bars were identical because all three presets are 5:1 ratios. Now they sit on a shared 60‑min scale, so Deep reads longer.
  - Picking a goal pushed the list down (reaction in the bubble). The reaction now sits below the options and the greeting is a lead‑in line.
  - Autofocus ring on first paint removed.
  - Step body was still springing when captured. Now it's a snappier spring with a short exit.
  - Two-button footers wrapped labels on phones. They now stack with the primary first (correct focus order). On desktop they sit in a row, primary on the right.
  - Name step: Continue is disabled until you type; Skip handles "no name".
- Home fixes:
  - The CTA was below the fold on a 390×844 phone. Recents now appear only when the field is focused, tags sit in one scrolling row, and the rhythm header row is gone. The CTA now sits above the tab bar.
  - The night greeting read "Hello, night owl, Robin". It's now "Still up, Robin?".
  - A nowrap chip blew out the page width. Fixed with `minmax(0, 1fr)` grid columns and a wrapping chip.
  - Quest rows: title and reward share one line, with the bar and count underneath.
- Settings: auto-start titles shortened (the group title carries "Auto-start"), stepper rows trimmed, profile meta shown as pills, and Chai's story stacked for phones.

## Iteration 2

- Swapped every stand-in for real art from `@/art`: StreakMug (warm, at-risk and cold states), Leaf, LevelBadge, TeaCozy, QuestIcon, GoalVessel, NotifySpot and Logo. Only the rhythm cycle bar remains local, since it's a data viz.
- Status sheets now use the kit Sheet's hero, description and footer slots. Streak sheet: this week's strip (done ✓, cozy uses the TeaCozy art, today ring, future), best streak, cozies as n/max, and a Tea Cozy explainer with days to the next one. Leaves sheet lists the real `BONUS` values. Level sheet shows progress, the next nook unlock with its story, and "Visit your nook".
- Status bar level item is the numbered badge plus a mini progress bar (dropped the redundant "Level" text).
- Desktop:
  - At 900 px and up, the status pills move into the greeting row.
  - At 1200 px and up, the rail already shows streak, level, goal and recipes, so Home hides its status bar, goal card and recipes card. The main column is now the action: greeting, composer, CTA and today's brews.
  - Chai is 152 px on wide screens.
- Resume banner: a progress ring with a kettle, pause or cup inside, time left and intention, and a full-width "Back to your brew" / "Back to tea" button. Chai's bubble acknowledges a live brew or break (new `live` mood, tested).
- 320 px: smaller Chai and ring, tighter goal typography.
- Accessibility:
  - axe (WCAG 2.2 AA tags) is clean on every onboarding step, Home, the streak sheet and Settings, in light and dark. Fixed the faded reward text on completed recipes (2.5:1).
  - Keyboard-only onboarding passes end to end: Enter, Tab, Space and arrows. Focus now lands on Continue after the permission prompt instead of falling to `body`.
  - Enter on Today starts a brew via `useShortcut` (it's in the `SHORTCUTS` registry).

## Iteration 3

- Onboarding on a 320×640 phone: compact mode (smaller Chai on question and ready steps, tighter spacing, smaller ambience discs). Dark theme ambience, reason and summary icons use bright tones instead of murky edge tones.
- Motion: the step body uses `AnimatePresence mode="popLayout"`, so exit and enter overlap with no blank gap. It settles in about 280 ms, measured by sampling transforms. Reduced motion is verified fade-only (x stays 0). The outgoing step is clipped (with a 10 px allowance for focus rings) so it never adds a scrollbar.
- Settings data flows:
  - Errors stay inline with `role=alert`, next to the control. Successes use a kit `toast` (no double messaging).
  - Import runs `previewImport`, then a sheet with a summary (brews, days, level, leaves, date range, skipped entries) and a Replace / Add toggle.
  - Reset: Chai concerned as the sheet hero, "It can't be undone", an "Export a backup first" link, and stacked "Keep my data" (primary) and "Reset everything" (danger) buttons.
- Custom rhythm sheet on Home: kit steppers plus a sticky footer "Use 25/5 min" that snaps back to a preset if the numbers match one.

## Requests for other areas

- design-system: `TextField` input needs `min-width: 0` inside `.box` (it overflows narrow containers; worked around in Settings). Button primary white-on-persimmon text is 2.9:1 (below AA for 17px).
