# Kettle review rubric

Quality bar: **the current Duolingo app** (2025–26 path, quests, profile, lesson-end
and streak flows — see `review/refs/duolingo/`). Kettle must match Duolingo's
*craft* with its *own* identity (Chai, persimmon/matcha/honey, cream paper,
Fredoka + Nunito). Imitating Duolingo's owl, green, flame or copy counts as a defect,
not a match.

## 0. Pass bar

A screen/area **PASSES** only when all three hold:

1. Every criterion in §1 scores **≥ 8** at every required viewport and in both
   themes (light + dark), with reduced motion checked where motion matters.
2. No hard-fail in §2.
3. In the **blind review** (§4) the Kettle side is judged **at least equal** to
   its Duolingo comparable, i.e. the Kettle side's mean over Clarity / Charm / Polish /
   Ease is ≥ the Duolingo side's mean minus 0.25, and the judge's overall preference
   is not "clearly Duolingo".

Anything else is **SEND BACK**, with specific issues ranked P0 (broken or blocks the
core loop), P1 (visibly below bar), P2 (polish).

Required viewports: **320×640**, **390×844** (primary), **844×390 landscape** (focus/break),
**820×1180** tablet (spot check), **1440×900** desktop. Themes: light + dark.

---

## 1. Criteria and anchors

Score each 1–10. The anchors describe 4 / 6 / 8 / 10; odd scores sit between them.
"Duo" means the Duolingo reference screens.

### 1.1 Clarity: can I tell in one glance what this is and what to do?
- **4**: Several things compete for attention; the primary action is unclear or below the fold at 390px; labels are jargon ("phase", "session 3/4").
- **6**: The primary action is findable but not dominant. Hierarchy is flat: 3+ text sizes of similar weight, or stats with no labels or units. You need to read to understand.
- **8**: One obvious primary action per screen (full-width pressable, bottom-anchored on mobile like Duo's CONTINUE / START). Clear three-level type hierarchy (display, title, body). Every number has a unit or label. Kettle vocabulary (brew, tea break, leaves, warm streak) is used consistently and makes sense on first read.
- **10**: Duo lesson-end or quest-card clarity: you know the outcome in <1 s (big number + short headline), secondary info is visibly secondary, and nothing is left to explain. Progressive disclosure: advanced items tucked away, not removed.

### 1.2 Charm: does it have warmth, personality and a point of view?
- **4**: A generic template, or Chai is a sticker in a corner. Copy is neutral system text ("Session complete").
- **6**: Chai and the palette are present, but Chai uses the same pose everywhere. Copy is on-brand in places only. The nook and kettle metaphor are decorative, not woven in.
- **8**: Chai's pose matches the moment (think / wave / focus / sip / cheer / concerned / proud / sleep / peek), as Duo's 25-mood widget range does. Copy follows the brief's voice on every screen: warm, short, sentence case, at most one "!". The kettle metaphor carries meaning (steam = progress, whistle = done, tea = break).
- **10**: Moments you'd screenshot and share, e.g. Duo's "3 day streak" phoenix or the friend-streak hug. Small surprises (an idle blink or yuzu wobble, time-of-day greeting, seasonal window). The identity is unmistakably Kettle and never reads as a Duolingo skin.

### 1.3 Polish: is every pixel deliberate?
- **4**: Misaligned edges, inconsistent radii and borders, default browser controls, emoji standing in for icons, clipped text, layout shift.
- **6**: Mostly consistent, but with noticeable rough spots: mixed icon styles, uneven spacing rhythm, a raw focus outline, a missing hover or pressed state, timer digits that jitter.
- **8**: Everything is on the token grid: radius 10/16/22/28/999, spacing scale, 2px warm borders with a 4px darker bottom edge on cards and controls. Pressable controls compress on press. Icons are chunky duotone, one family. Timer digits use tabular cells. Illustrations share light direction (top-left), with one highlight and one shade. Dark theme is designed (plum + lamplight), not inverted.
- **10**: Indistinguishable in finish from Duo's 2026 tab screens: optical alignment, edges that line up across sections, balanced negative space, no orphan words in headlines, and images that are crisp at 2× DPR.

### 1.4 Ease of use: can a first-timer do the core loop without thinking?
- **4**: The core loop (start, pause, end, break) needs trial and error. Destructive actions have no confirmation, or confirmations are nagging. Tap targets are under 44px.
- **6**: The loop works, but with friction: extra taps, unclear state (paused vs running), no undo, settings in the wrong place, or errors with no recovery path.
- **8**: Start is one tap from Home. State is always visible (running, paused or done, and time left). End-early uses a confirm sheet with a safe default. Everything is reachable in ≤2 taps. Targets are ≥44px. Keyboard shortcuts work and are discoverable.
- **10**: Anticipates you: remembers your last intention, tag and rhythm; suggests the next step ("Start next brew" or "Take a long tea break"); recovers from reload, tab close and a background tab without the user noticing.

### 1.5 Accessibility (WCAG 2.2 AA, per brief)
- **4**: axe violations (serious or critical), contrast failures on body text, focus not visible, or dialogs that don't trap focus.
- **6**: axe clean, but screen-reader flow is noisy or confusing (timer announced every second, decorative art read out, unlabeled icon buttons). Reduced motion only partly honored.
- **8**: axe clean (both themes). Every control has a name and role. Focus ring is visible and on-brand. Timer uses polite, periodic announcements. Reduced motion swaps to fades. Usable at 200% zoom and 320px. Colour is never the only signal.
- **10**: A pleasant screen-reader experience with meaningful live-region copy ("10 minutes left in your brew"). Headings and landmarks are logical. Motion, haptics and sound are each independently controllable.

### 1.6 Responsiveness
- **4**: Horizontal scroll or overlap at 320px or in landscape. Desktop looks like a stretched phone.
- **6**: No breakage, but desktop is a centered phone column with dead space, landscape focus is cramped, and the tab bar or sidebar switch is awkward.
- **8**: Mobile uses a bottom tab bar with safe-area insets. Desktop uses left sidebar + content + right rail that actually use the space. Landscape phone focus puts the timer and scene side by side. Text never truncates mid-word.
- **10**: Each breakpoint feels designed for its device (e.g. the desktop rail shows today's recipes and streak; tablet uses two columns). No layout shift while fonts or 3D load.

### 1.7 Cohesion: does it feel like one app?
- **4**: Screens look like they were built by different people (because they were): different card styles, button variants, header treatments and icon sets.
- **6**: Shared kit, but inconsistent application: different header patterns per tab, three greys, sheets that look unlike cards.
- **8**: One header pattern, card language, button hierarchy and icon family across all routes. Colour roles are stable: persimmon = primary action, matcha = done, honey = leaves, sky = break, berry = gentle alert. Duo's 2026 "consistent header" refresh (`profile-header-2026.png`) is the bar.
- **10**: Transitions connect screens spatially (focus → done → break flows like one sequence). Chai's behaviour is consistent in every context.

### 1.8 Delight and motion
- **4**: No motion, or janky motion (layout thrash, <60fps, animation blocks input).
- **6**: Basic fades and slides. Numbers don't count up. The celebration is one static card.
- **8**: "Cozy bounce" springs: everything arrives (scale 0.9→1 + fade). Numbers count up with a tick sound. Progress fills with a sheen. The celebration is a *sequence* of cards: whistle, stats, streak, recipes/tin, level-up (Duo's lesson-end, streak and chest rhythm). Sound and haptics accompany key moments. Reduced motion gets calm equivalents.
- **10**: Duo's streak phoenix or chest-burst level: choreographed, anticipatory (a wind-up before the payoff), never longer than it's welcome, and skippable. The 3D nook breathes (steam builds with progress, lamp flicker) without distracting.

---

## 2. Hard fails (automatic SEND BACK, whatever the scores)

- Any `console.error` or `pageerror` during a scripted run of the core loop.
- Horizontal page scroll, or overlapping or clipped interactive elements, at 320 / 390 / landscape / 1440.
- axe-core `serious` or `critical` violations on any route, light or dark.
- Text contrast below 4.5:1 (body) or 3:1 (≥18.66px bold, UI components).
- Keyboard: the core loop can't be completed without a mouse; focus is invisible; a dialog doesn't trap and restore focus.
- Timer: drift more than 1 s over a fast-forwarded session; paused state lost on reload; double-recorded session; ending early at ≥1 min not saved.
- Settings that don't persist across reload or don't apply (durations, theme, sounds, goal).
- Copy: guilt or pressure ("You'll lose everything!"), more than one "!" per screen, Title Case headings, ALL CAPS anything except overline labels.
- Identity: green owl-like mascot, flame streak icon, Feather-green primary, or copied Duo copy. Kettle's streak is a *steaming mug*.
- An empty or placeholder state shown to a real user ("TODO", "Lorem", raw JSON, `NaN`, `undefined`, `Invalid Date`).

---

## 3. Per-screen checklists

Tick every box before scoring. Each unticked box becomes an issue in the round report.
Each checklist names its Duolingo comparable(s) in `refs/duolingo/`.

### Onboarding / welcome (comparables: `onboarding-course-pick`, `onboarding-where-to-start`, `onboarding-reminders`, `onboarding-set-goal-2020`)
- [ ] Top progress bar advances per step; a back affordance exists (except on step 1).
- [ ] One question per screen. Chai (think / wave) + speech bubble asks it, the way Duo does.
- [ ] Options are big pressable cards (not radios) with a clear selected state (border + tint + check), keyboard- and arrow-navigable.
- [ ] Name step is optional and skippable; the goal step uses "A sip / A cup / A pot / A whole kettle" with minutes; rhythm step shows Classic 25/5 · Deep 50/10 · Gentle 15/3.
- [ ] Notifications are asked *with context* ("I'll whistle when your tea's ready") and are skippable; declining is not punished.
- [ ] Final CTA is "Put the kettle on" and lands on Home (or starts a brew) with a warm hand-off.
- [ ] Bottom CTA is sticky on mobile and disabled until a choice is made. Enter advances.

### Home / Today (comparables: `home-path-2026`, `home-path-start-bubble`, `quests-daily-cards`)
- [ ] Time-of-day greeting (+ name if given). Chai reacts to your day (morning wave, done-for-the-day proud, late-night sleepy).
- [ ] Header stats: warm streak (mug) + leaves, tappable, legible at 320px (Duo's top stat bar is the bar).
- [ ] Daily goal ring shows minutes/goal with a label, plus a completed state.
- [ ] Today's recipes preview: 3 rows, each with a progress bar + reward, and a tin icon.
- [ ] Intention input ("What are you brewing?") + tag chips; the last-used tag is prefilled.
- [ ] Rhythm selector (segmented) that reflects settings.
- [ ] Huge primary CTA "Put the kettle on" is visible without scrolling at 390×844 and 320×640.
- [ ] Empty state for a fresh user is warm (Chai peek, "Nothing brewed yet…").
- [ ] Desktop: the right rail holds streak, recipes and goal, and the content column isn't a stretched phone.

### Focus (comparables: `timer-in-session`, `timer-match-madness`, `timer-side-quest`)
- [ ] Calm, full-screen. The nook scene is visible, and its steam builds with progress.
- [ ] Huge timer with tabular digits (no jitter) and a progress ring; remaining time is readable at arm's length.
- [ ] Intention label is shown, and the phase copy is on-brand ("Kettle's warming up…").
- [ ] Pause/resume is the dominant control; +5 min and End early are secondary; the ambience picker is reachable.
- [ ] Paused state is unmistakable (label + visual change, not just the button text).
- [ ] End early → sheet with Chai `concerned`, copy "Leave the kettle early? That's okay — your minutes still count.", safe default "Keep brewing", and the session is saved if ≥1 min.
- [ ] Space toggles pause, Esc opens end, `+` adds 5 min, and shortcuts are hinted.
- [ ] Tab title and favicon show remaining time. The SR announces periodically, not every second.
- [ ] Landscape phone puts timer and scene side by side, with no scrolling.
- [ ] Reload mid-session resumes with the correct time. The static fallback appears when WebGL is unavailable or motion is reduced.

### Break / tea time (comparables: `timer-session-intro`, `lesson-end-reward-2025`)
- [ ] Sky-toned palette distinct from focus; Chai `sip` with steam.
- [ ] Rotating break suggestions (stretch, water, 20-20-20) with a gentle transition.
- [ ] "Skip break" / "Start next brew" are both clear; long tea break is labeled as such.
- [ ] Break end → sound + a clear next step (or auto-start per setting).

### Done / celebration sequence (comparables: `lesson-end-goal-achieved-2020`, `lesson-end-reward-2025`, `lesson-end-walk-anim.gif.1200ms`, `streak-3-day-screen`, `streak-extended-anim.gif.2200ms`, `streak-friends-extended`, `quests-chest-open.gif.400ms`)
- [ ] Card 1 "The kettle's whistling!": Chai `cheer`, stat tiles (time, leaves earned, goal progress) that count up, each with a label and an icon, as in Duo's lesson-end tiles.
- [ ] Card 2 (first brew of the day) warm streak extended: the big number animates n-1 → n, a week row with today lighting up, and "N days warm".
- [ ] Card 3 recipes: progress bars fill; a completed recipe gets the tin-opening moment (anticipation, then burst, then reward).
- [ ] Card 4 level-up (if any): new Cozy level + the unlocked nook item, shown.
- [ ] One CONTINUE-style primary per card, bottom-anchored. The sequence is skippable, and reduced motion gets fades.
- [ ] Leaf confetti / steam puffs + the complete sound, well-timed; no card lingers >4 s without input.
- [ ] Ends in the break, with no dead-end.

### Stats (comparables: `profile-2026`, `profile-statistics-2023`, `profile-achievements-2023`)
- [ ] Overview tiles (total time, brews, best streak, current streak) in Duo's 2×2 stat-tile craft: icon, big number, small label.
- [ ] Week bars vs goal line, with today highlighted and axis labels legible.
- [ ] Month calendar with warm-streak runs joined (like Duo's streak calendar), today marked, and Tea Cozy days distinct.
- [ ] Time-of-day pattern + tag breakdown are readable, not decorative.
- [ ] Session history is editable (rename / retag / delete with undo).
- [ ] Badges grid: tiered I–V art, locked vs unlocked obvious, tap for details.
- [ ] Empty state for a fresh profile: "Nothing brewed yet. Your first cup is one tap away." + CTA.
- [ ] Charts are accessible (text alternative or table).

### Nook (no direct Duo analogue; judge against `profile-achievements-2023` for collection craft and the brief)
- [ ] Warm, dusk-lit 3D room that loads lazily with a graceful static fallback; DPR is capped; it pauses when hidden.
- [ ] Unlocked items are visible in the room; locked items are listed with their level requirement.
- [ ] Tapping an item shows its name + story (sheet/card), keyboard accessible.
- [ ] Performance: no jank on scroll, no console WebGL errors, no fan-spinning idle loop.

### Settings (comparables: `settings-preferences`, `settings-reminders`, `settings-menu`)
- [ ] Grouped sections with overline labels (Rhythm, Sounds, Notifications, Look & feel, Data, About), as in Duo's grouped list rows.
- [ ] Kit toggles, sliders and steppers only; no raw `<input type=range>` look.
- [ ] Every change applies instantly and persists across reload.
- [ ] Destructive actions (reset) need confirmation; export/import round-trips.
- [ ] Keyboard shortcuts list; about/version.

### Dialogs and sheets (comparables: `dialog-quit-confirm`, `dialog-energy-sheet`, `dialog-protect-streak`)
- [ ] Bottom sheet on mobile, centered dialog on desktop; the scrim dims the context.
- [ ] Chai pose fits the ask; headline + one-line body; primary safe action on top, destructive as a text button (Duo's pattern, with Kettle's no-guilt copy).
- [ ] Focus trap, Esc closes, focus is restored, `aria-modal`, labelled.

### Shell / navigation (global)
- [ ] Mobile bottom tab bar: 4 tabs, active state = filled icon + tint pill (Duo 2026 tab bar), labels, safe-area padding.
- [ ] Desktop sidebar + right rail; the active route is obvious; there are no dead links.
- [ ] Route transitions are consistent; the focus/done/welcome routes hide the chrome deliberately.

---

## 4. Blind review protocol

Tooling: `node review/blind.mjs` (see `review/README.md`). For each Kettle screen it
pairs a fresh Kettle screenshot with one or more Duolingo comparables from the table
in `review/blind-plan.json`. It randomises left/right, scales both to the same height
(never upscaling the smaller native image), and labels them **A** and **B**. The key
(`key.json`) is written to a separate folder that the judge never sees.

**Judge instructions.** The blind judge gets **only** the `pairs/round-<n>/` folder: the
`pair-*.png` composites plus `JUDGE.md`, which `blind.mjs` writes. `JUDGE.md` contains these
instructions and a *brand-neutral* version of the §1.1–1.4 anchors. Do **not** give the judge
this file or the key: this rubric names both apps and uses Duolingo as the anchor, which would
bias the scores. Summary of what `JUDGE.md` asks:

1. Each image shows two app screens of the same *kind* (e.g. "end-of-session
   celebration"). They come from different apps with different brands. Judge
   **craft, not brand familiarity**. Ignore device chrome, status bars, language
   (some references are not in English) and small resolution differences.
2. For each pair, score **A** and **B** 1–10 on Clarity, Charm, Polish and Ease of use
   using the §1 anchors, then give an overall preference: `A clearly`, `A slightly`,
   `tie`, `B slightly`, `B clearly`, with one sentence of justification per side
   naming concrete visual evidence.
3. Don't guess which app is which. If you recognise one, say so and still score on craft.

**Aggregation** (critic, using the key): per screen, take the mean of each side over the
four criteria, averaged over all of that screen's pairs. Kettle "matches" when
`kettle_mean ≥ duo_mean − 0.25` and no pair is `Duo clearly`. Report per-screen deltas in
`round-<n>.md`.

## 5. Round report format (`review/round-<n>.md`)

```
# Round n — <date>
Build: <git sha / dirty>, harness: functional <pass>/<total>, axe <violations>, console errors <n>
## Summary table
| Area | Clarity | Charm | Polish | Ease | A11y | Resp | Cohesion | Delight | Blind Δ | Verdict |
## <Area> — PASS | SEND BACK (owner: <area>)
P0 …  (screen · viewport · theme — what's wrong — what Duolingo-level looks like — evidence: shot path)
P1 …
P2 …
```

Issues must be **specific and actionable**, e.g. "Focus · 390 · dark: the Pause button is
the same visual weight as End (both secondary). Make Pause the full-width persimmon
primary; move End to a text button under it, as Duo's quit sheet does
(`dialog-quit-confirm`). Evidence: out/round-1/focus-mobile-dark.png". Vague praise or
vague criticism is not allowed.
