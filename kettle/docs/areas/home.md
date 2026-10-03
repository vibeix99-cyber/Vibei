# Home · Onboarding · Settings — area log

Owner: home area (`src/screens/home/**`, `src/screens/welcome/**`, `src/screens/settings/**`).
Dev port 5188. Screenshots in `.shots/home/`.

## Structure

- **`home/HomeScreen.tsx`:** StatusBar → Hero (greeting + Chai line) → ResumeBanner (when a brew or break is live) → GoalCard → Composer (task, tags, brew length, CTA) → Today's recipes → Today's brews.
  - **Desktop (≥ 1200 px):** two real columns, start a brew | today (minutes, today's brews, recipes). The shell's right rail steps aside on Today (`data-layout="home"`), so nothing on the page appears twice.
- **GoalCard (`home/Hero.tsx`)** states today's minutes explicitly: "**12 min** brewed · **18 min** to go" over the goal bar, then "Today's goal · 30 min (a cup)". When the goal is met, the right side reads "✓ Goal met".
- **Composer (`home/Composer.tsx`):**
  - The task heading is "What are you brewing? (optional)", with the placeholder "e.g. Chapter 3 notes, or leave it blank".
  - "Brew length" is a segmented control with **minutes first** (15 min Gentle · 25 min Classic · 50 min Deep · Custom), sorted by length.
  - The CTA names the selected length.
- **`home/chai.ts`:** pure, unit-tested (`chai.test.ts`) logic for the greeting and Chai's contextual line.
  - *Priority:* first ever → goal met → late night → back after 3+ days → evening streak at risk (invite, never warn; mentions a Tea Cozy on standby) → progress → first visit today (by time of day) → idle.
  - *Wording follows the user's own numbers:*
    - The goal's own vessel: "today's cup is full" for 30 min, pot for 60, kettle for 120, "today's goal is met" otherwise (`goalFull`).
    - The selected brew length: "One 25‑minute brew keeps your 5‑day streak warm".
    - "One more brew and …" appears only when the selected brew covers what's left; otherwise "18 min to go, about 2 more 15‑minute brews".
    - The Gentle chip is offered only when the selected brew is longer than 15 minutes.
  - Copy is seeded per day so it doesn't flicker. Non-breaking hyphens keep "5‑day" and "15‑minute" together.
- **`home/useHomeData.ts`:** derives everything from stores and `useNow()` (re-renders on debug clock jumps, so `__kettle.ff` works).
- **`home/content.ts`:** goal, rhythm, tag and ambience metadata shared by all three screens (ambience comes from `AMBIENTS` in `@/audio`).
- **`welcome/`:** the first visit is one tap to a real brew, with setup optional.
  - **Hello:** painted Chai on the valley; "Let's start small: one 15‑minute brew"; an optional "What's the first thing?" field. Then **Start a 15-min brew** (Enter in the field works too), "Set things up first", and "I have a backup".
  - **Starting the brew** sets `onboarded` and `setupPending`, and starts a real 15-minute brew (`FIRST_BREW_MIN`) without changing the user's rhythm.
  - **After the whistle**, the first summary offers "Make Kettle yours · Set up", which opens the setup at the name question. "Back to Today" leaves it and clears `setupPending`.
  - **"Set things up first"** runs the six questions (name, goal, rhythm, ambience, nudges, ready) as before. Chai and the bubble stay put while the body slides. Native radios give arrow keys and screen-reader semantics. Enter advances (except inside a form), the question heading takes focus on each step, and the footer CTA is sticky.
  - **The App gate** allows `#/welcome` for an onboarded user only while `setupPending`.
- **`settings/`:** kit `ListGroup` / `ListRow` sections, plus `DataSection` (export, import with preview + replace/merge confirm, reset with a serious confirm).

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
  - The CTA was below the fold on a 390×844 phone. Recents now appear only when the field is focused, and the rhythm header row is gone. The CTA now sits above the tab bar.
  - Tags wrap instead of scrolling sideways (round 6 follow-up): on phones Create and Life were off the edge of a one-line scroller. All five now show on two lines, each with a 44 px touch target.
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

## Iteration 4

- Goal met: the ring keeps the minutes (in matcha) and gets a small check badge. The earlier full-ring bullseye was too heavy. Chai uses the proud pose with "You did it. Today's pot is brewed."
- CTA caption: "Then a 5 min tea break." or "Then a long tea break, 15 min. You've earned it.", from `nextBreakKind(completedInCycle + 1)`.
- Recent intentions (shown on focus) are kit `Chip size="sm"` with a refresh icon, and `mousedown` doesn't steal focus.
- Rhythm step: `RhythmSpot` illustrations on each card, plus a single legend line under the options ("Brew · Tea break · Bars share one 60‑minute scale") instead of repeating it per card. There's a screen-reader sentence per option.
- The status pills sit in the greeting row from 720 px (tablet and landscape), not 900 px.
- Removed unused CSS. `vite build` passes and the whole-project `tsc` is clean.
- Critic smoke note (quest reward contrast): the faded reward on completed recipes was the only failure (2.5:1). Fixed in iteration 2 with full-strength `--ink-2`. Re-verified with axe across seeds, themes and sizes (below).

## Iteration 5

- Relays applied:
  - Tags now come from the shared `@/state/tags` (TAGS/TAG_BY_ID). Tag chips use each tag's tone, and the brews timeline shows tone-coloured kit `Pill`s.
  - Data flows use the progress API directly (`exportData`, `backupFileName`, `previewImport`, `importData(json, {mode})`, `resetAllData`).
  - `RhythmSpot` added to the rhythm cards.
- Local AA inks replaced with the design system's `--*-ink` tokens. Removed the TextField workaround now that the kit ships `min-width: 0`.
- Hello and ready bubble tails are centered on Chai (`tailAt="50%"`).
- Re-verified:
  - `tsc` clean; 11 unit tests pass.
  - `vite build` passes.
  - axe is clean on all onboarding steps, Home (5 seeds × light/dark × 390/1024/1440) and Settings.
  - The keyboard-only onboarding walk completes and lands on `#/focus` with the timer running.

## Iteration 6 (round 6: the approved direction)

- **Goal card:**
  - The ring and the uppercase "Daily goal · A cup" eyebrow are gone.
  - Minutes are stated in words: brewed on the left, to go on the right in persimmon.
  - The bar sits underneath, with the goal and its vessel in plain words.
- **Brew length:** the minutes are the option labels and the rhythm names are the small print. Previously "Classic / Deep / Gentle" read like moods rather than durations.
- **Optional task:** "(optional)" sits next to the question instead of floating at the card's far edge.
- **Chai copy agrees with the screen:**
  - it uses the goal's own vessel (a cup is not a pot);
  - it names the selected brew length;
  - it never promises "one more brew" when that brew is shorter than what's left.
- **Desktop:** two columns; the rail is hidden on Today.
- **Welcome:** one tap to a real 15-minute first brew, with setup after the first whistle. The 25-minute placeholder from the mockups is gone.

## Final screenshots

`.shots/home/final/`:
- `welcome/*`: every step, mobile light and desktop dark.
- `home/*`: veteran afternoon, at-risk evening, late night, blank morning, plus mobile light/dark, desktop light/dark, 320 px, streak sheet and resume banner.
- `settings/*`: mobile scroll frames and desktop dark.

Data-flow sheets are in `.shots/home/flows/`.

## Known gaps

- The daily goal can only be one of the four presets (no custom-minutes goal).
- The setup step isn't persisted across a reload; choices are saved as you go, so a reload restarts the questions (at hello before the first brew, at the name question after it) with selections kept.
- First-visit-today uses a `kettle:home:lastVisit` localStorage key. It isn't part of backups, by design.
- Ambience previews call `audio.preview`; checked in code, not by ear.

## Requests for other areas

- None blocking.
- design-system (nice to have): a `ghost`/`subtle` danger Button variant, so destructive confirms can pair a solid safe action with a quieter destructive one. Reset currently stacks two solid buttons.
- art (nice to have): a larger Chai "wave from bottom edge" peek for empty states at 72 px. The current peek crops well but the ears get clipped on the dashed empty card.
