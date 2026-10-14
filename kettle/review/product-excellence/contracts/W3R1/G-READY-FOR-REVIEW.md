# W3R1 · Maker G · Settings and shared controls (I11): READY FOR REVIEW

- **Branch / worktree:** `pe/w3-settings` · `/home/user/wt/w5g` (local commits only, nothing pushed)
- **Hash:** app/spec `876bf18` · `kettle/src` tree `6b14238` · branch head = the commit carrying this packet
- **Base:** `4d36939` (src `5cd9a44`) on :5478 (dev) / :5488 (preview). **Mine:** dev :5503 (verified with
  `/tmp/rv7-servers/verify.sh` after every restart).
- **Evidence:** `kettle/review/product-excellence/contracts/W3R1/G/` (full-size PNGs, tools, logs).

## Files changed (all within G's ownership)

| File | Change |
|---|---|
| `src/styles/tokens.css` | New non-colour state tokens: `--focus-w` 3px, `--focus-gap` 3px, `--focus-gap-inset` −3px, `--disabled-opacity` 0.5. No palette or font change. |
| `src/styles/global.css` | The global `:focus-visible` ring uses the tokens (same 3px `--focus-ring`, same 3px gap as before). |
| `src/ui/TextField.module.css` | Focus is the shared 3px `--focus-ring` **outline** (was a 2px inset box-shadow + halo, which vanishes in forced colours); border goes to `--ink-3` as on hover. Disabled: token opacity, not-allowed cursor. |
| `src/ui/SegmentedControl.module.css` | Ring drawn 1px out (stays inside the 4px track instead of running 2px past it and over the neighbour). **Pressed** unselected option sinks (`surface-3` → `line-strong` mix), distinct from hover (lighter) and selected (raised cream thumb). Forced colours: the thumb gets a `Highlight` border. Disabled: token. |
| `src/ui/Chip.module.css` | Disabled: token. Forced colours: selected chip keeps a `Highlight` ring (the tick stays). |
| `src/ui/ListRow.tsx`, `ListRow.module.css` | A row whose switch can't change (blocked/unsupported/disabled) is **not pressable**: no pointer, hover fill or press fill (it had all three while doing nothing). Inset ring and disabled opacity use the tokens. |
| `src/ui/Toggle.module.css`, `Slider.module.css`, `Card.module.css`, `NumberStepper.module.css` | Ring and disabled opacity from the tokens (were 0.5 / 0.5 / 0.6 / 0.55). Stepper: not-allowed cursor when disabled; its −/+ no longer fade twice. |
| `src/screens/settings/SettingsScreen.tsx` | Warm-days footer; honest Sounds / Nudges / Keep awake / Haptics copy (below). |
| `src/screens/settings/DataSection.tsx` | Reset sheet: "…your brews, warm days, leaves, recipes and settings…". |
| `src/ui/Gallery.tsx` (dev-only `#/kit`) | Glossary wording for the 9 "streak" strings; new **Inert controls** section showing every disabled control together. |
| `tests/w3-settings.spec.ts` (new) | 9 tests (below). |

Untouched: `ui/Sheet.*`, `ui/Stat.tsx`, `ui/Toast*`, `ui/InlineUndo.tsx`, `ui/moment.ts`, `ui/WeekStrip.tsx`, `ui/index.ts`, and everything outside G's map.

## Inventory (controls and their state tokens, base `4d36939`)

| Control | Focus ring | Disabled | Pressed | Selected |
|---|---|---|---|---|
| Button (all variants) | global 3px `--focus-ring`, +3px | own inert face (outline, readable label, opacity 1), native `disabled` | face sinks into edge | n/a |
| IconButton / session controls | = Button | = Button | = Button | n/a |
| Chip / ChipGroup | global | **0.5** | face sinks 3px | tone fill + ring + tick |
| SegmentedControl | global, +3px (runs 2px past the track) | **0.5** | **inner shifts 1px only: on touch, nothing else; on desktop, same fill as hover** | raised cream thumb |
| Toggle | on track, +3px | **0.5** | thumb widens | matcha track, cream thumb + check |
| ListRow (button / toggle row) | inset −3px | **0.55**; **a row whose switch is disabled kept pointer, hover and press fills** | surface-3 fill | n/a |
| NumberStepper | value box, offset 0 | **0.55** (and its −/+ faded again) | −/+ = Button | n/a |
| Slider | thumb, −4px | row **0.5**, labels ink-3 | thumb grows | n/a |
| TextField | **2px inset box-shadow + 4px halo (not an outline)** | **0.55** | n/a | n/a |
| PressableCard | global | **0.6** | sinks 2px | tone border + tint |
| Pill, Card, Kbd | not interactive | | | |

After: one ring (`--focus-w`/`--focus-gap`, colour `--focus-ring`; inset or tightened only where the geometry needs it),
one inert recipe (`--disabled-opacity`, not-allowed, out of the Tab order, no hover/press), pressed ≠ hover ≠ selected
everywhere. Button keeps its own outlined inert face on purpose (it is "clearly a button, just inert", W2 decision).

## Controls first (each reproduced on base :5478, then shown fixed on :5503)

The same spec, `tests/w3-settings.spec.ts`, run against both servers:

- **Base :5478: 9 failed** (log: `G/controls/base-5478-w3-settings-spec.txt`):
  1. Reset sheet says "…warm streak…" (persistence and reset themselves **passed** on base up to that line: preferences were already kept and reset correctly; this round keeps that behaviour).
  2–5. Focus: the name field has **no outline**; its ring is a box-shadow (`{"name":"input[] ","ring":false,"visible":true}`), unlike every other control (visible in normal colours, lost in forced colours, see 8).
  6. Nudges row, switch blocked: hover fill `rgb(252, 244, 233)` and press fill on a row that does nothing.
  7. Pressed segment = hovered segment (`oklab(0.959 0.0039 0.0176)` both).
  8. Forced colours: focused field `outline-style: none` (the box-shadow ring is dropped: no visible focus); selected segment thumb has no border (choice invisible).
  9. Settings text contains "streak" (Daily goal footer).
- **Mine :5503: 9 passed** (`G/own-suites.txt`).
- Visual: `G/controls/base-states-{light,dark}.png` vs `G/controls/after-states-{light,dark}.png` (rows "Toggle row,
  switch disabled (Nudges, blocked)", "SegmentedControl · unselected option" pressed column, "Today · Brew length ·
  unselected" pressed column, "TextField" focus). Inert opacities measured in the kit:
  `G/controls/*-inert.json` (base: TextField 0.55; after: every control 0.5, none in the Tab order).
- Tab-order audits (every stop: where the ring is drawn, width, contrast, clipping): `G/tools/focus-audit.mjs`.
  Base and after: every ring ≥ 3:1 (light 3.87–4.69, dark 6.98–10.02). Base input had no outline.

## Settings preferences: persistence and reset (item 2)

Test 1 (fresh disposable context, real clicks/keys): Theme Night, Preset Deep, Motion Reduced, 3D Low, Sounds off,
Ambience Fireside, Daily goal A pot, Tea break ↑ (preset → Custom). **Reload:** all kept (`html[data-theme=dark]`,
`html[data-motion=reduce]`, radios, spinbuttons, stored `kettle:settings`). **Reset everything** (row → "Start
fresh?" sheet → Reset everything): stored settings back to defaults (`theme auto, rhythm classic 25/5/15/4, motion
system, scene auto, muted false, ambient rain, dailyGoalMin 30, onboarded false`); after a reload Settings shows them.
No change to persistence or reset code (both live in `src/state`/`src/progress`, not edited). Shortcuts are a static
list (no preference to persist).

## Honest copy (item 3): what the code does (`src/audio/**`, `src/timer/notify.ts`, `src/pwa/sw.ts`; read, not edited)

- Sound needs a first user gesture (`engine.play` refuses to create the AudioContext before activation); it plays while the page lives (the context is suspended only when nothing is playing: hidden, or idle 60 s); nothing can play once Kettle is closed.
  → Sounds on: "The whistle, effects and ambience play while Kettle is open, in a tab or as the app, after your first tap. Closed, Kettle is silent. A phone’s silent switch or lock screen can quiet it too." (muted line unchanged)
- Nudges fire only from the tab that completed the phase, only when **no Kettle tab is visible** (`shouldNotify`), and there is **no push** (the service worker only handles `notificationclick`): closed Kettle = no nudge.
  → On: "On. When a brew or tea break ends while Kettle is open but out of sight, I’ll nudge you. With Kettle closed, no nudge can come. A locked phone may hold the nudge until you’re back." Off/default lines say "while Kettle is out of sight / open but out of sight". Unsupported and denied lines unchanged (F's `whistle.spec.ts` and Welcome copy assert/echo them).
- Wake lock is held only while the page is visible and a brew runs → "Stops your screen dimming while a brew is on screen."
- `navigator.vibrate` exists on desktop Chrome without a motor → "Little buzzes for key moments, on devices that can vibrate."

## Warm-days wording (item 4)

Daily goal footer: "One finished brew makes a warm day. The goal is just for you." · Reset: "…your brews, warm days,
leaves…" · Gallery: "Tea Cozy used. The kettle stayed warm.", "A Tea Cozy keeps the kettle warm through one missed
day.", "Warm days", "Days warm", "Warmest run", "Another warm day", tooltip "Keeps the kettle warm through one missed
day", dialog "…your brews, warm days and nook…". Test 9 checks Settings text, `aria-label`, `title`, `alt` for /streak/i.

## REFERENCE → BEFORE → AFTER (Settings top to bottom, full page)

REFERENCE: `G/reference/K09-live-settings.jpg` (and `K01-home.png`). Frozen 2026-10-12T07:40Z, seed veteran, sounds on,
name "Robin". Notifications are "Blocked" in headless Chromium (the denied help row shows in every capture).

| Size | Light 100 % | Light 200 % | Dark 100 % | Dark 200 % |
|---|---|---|---|---|
| 390×844 | `G/before/settings-390x844-light-100.png` → `G/after/…` | `…-light-200.png` | `…-dark-100.png` | `…-dark-200.png` |
| 375×667 | `G/before/settings-375x667-light-100.png` → `G/after/…` | `…-light-200.png` | `…-dark-100.png` | `…-dark-200.png` |
| 844×390 | `G/before/settings-844x390-light-100.png` → `G/after/…` | `…-light-200.png` | `…-dark-100.png` | `…-dark-200.png` |
| 1440×900 | `G/before/settings-1440x900-light-100.png` → `G/after/…` | `…-light-200.png` | `…-dark-100.png` | `…-dark-200.png` |

(`G/after/` has the same 16 names.) Visible differences: copy only (Daily goal footer, Sounds, Nudges, Keep awake,
Haptics). Page heights grow 19–59 px at 100 % and 78–275 px at 200 % (the longer Sounds/Nudges lines, e.g. 390×844 @200 %: 8735 → 9010 px). Capture
artefact, BEFORE and AFTER alike: phone full-page shots (`isMobile`) repeat the page top under the end of the page
(fixed tab bar / Chromium stitching); not a product defect.

Control-state sheets (rest / hover / keyboard focus / pressed / disabled; Settings, Today's composer, the session
controls, the kit's inert set), 1440×900 @2x: `G/controls/{base,after}-states-{light,dark}.png` (after-light served
from `d1962ac`, after-dark from `3743728`; later commits changed only the Sounds line, the stepper's disabled cursor
and the spec). Tools: `G/tools/capture-settings.mjs`, `G/tools/state-sheet.mjs`, `G/tools/focus-audit.mjs`.

## Suites

- `tsc --noEmit`: clean.
- `vitest run`: **30 files, 290 tests passed**.
- `tests/w3-settings.spec.ts` (new, mine) on :5503: **9 / 9 passed**; on base :5478: **9 / 9 failed** (controls first, above).
- Specs touching my controls, on :5503 (`G/own-suites.txt`): **52 passed, 0 failed**: w3-settings 9, whistle 8,
  w2-home 18, a11y 11, w2-firstvisit 6.
- Rest of the chromium suite, on :5503, **stopped at the 12:18 UTC hard-stop margin** (`G/rest-suites-partial.txt`):
  break-reach 17 / 17 passed; notice-strip 17 passed, **2 failed** ("no notice overlaps…" at 375×667 dark 200 % (1.6 min)
  and 844×390 light 200 % (4.0 min, = its 240 s timeout)), run while F's notice-strip jobs held the other slots.
  **UNPROVEN:** whether these two are contention timeouts or real; their error text was not printed before the stop.
  My changes don't touch Today's layout (outlines and opacity take no space; copy changes are on Settings only), but
  this is not proven. Not run: integrity, summary-notice, toast-room, statusbar, w2-summary, w2-room, chai3d, timer/pwa projects.

## Preserve list

Identity (cream/plum, Fredoka/Nunito, orange focus / blue rest / green progress): no colour or font token changed.
Working controls and destinations: unchanged behaviour; preferences (sound/theme/motion/3D/shortcuts) and backup tools
kept, persistence and reset proven. User data: destructive test in a disposable context only. Implementation: no
rewrites, no dependency change, no new settings, no new chrome.

## Open findings / residuals

- FOLLOW-UP (not mine): `ui/Toast.module.css:75` uses `var(--focus, var(--sky))`; `--focus` is not a token, so the
  toast action's ring is sky, not `--focus-ring` (on the inverse toast surface; may be deliberate for contrast). F's file.
- FOLLOW-UP (not mine): `screens/stats/stats.module.css:654` draws "today" on the calendar with a 2px `--ink-2`
  outline; not a focus ring, noted only so a reviewer doesn't mistake it for one. S's file.
- ACCEPTED: Button keeps its outlined inert face (opacity 1) rather than `--disabled-opacity`, by design (W2).
- ACCEPTED: NumberStepper −/+ are not Tab stops (the spinbutton takes ↑/↓/PgUp/PgDn/Home/End), unchanged.
- Today's pill "N days warm streak" (Today, rail) is F's item; it is outside Settings and not changed here.

## Cross-owner requests

- **F** (`ui/Toast.module.css`): consider `var(--focus-ring)` (or keep sky deliberately and say so) for `.action:focus-visible`.
- **F/S, process:** the shared scratchpad is common to all makers; my logs collided with S's (`pw2.log`, `pw3.log`)
  around 10:53–11:00. I moved to `scratchpad/G/`. Use a lane prefix for log names.

**Hand-off:** app code and spec last changed in `876bf18`; `kettle/src` tree `6b14238` (unchanged by the packet commit that follows). Final branch hash: the commit carrying this file (`git log -1 pe/w3-settings`).
