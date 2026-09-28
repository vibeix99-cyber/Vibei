# Round 2: critic review (2026-09-28)

**Build:** `3a13008`, clean tree, production build (`vite build` → `vite preview` on :4190, and a second preview on :5190 for the
Playwright suite), so no HMR touched any page.
**Harness:** functional suite **90 / 91** after two harness fixes (below). The one failure is real: `layout: home @ 320`, which
the suite could not see before.
**axe (WCAG 2.2 AA):** the suite's 12 scenes × light/dark at 390 are **24/24 clean**. My flow audits add about 40 more states
(normal motion, 390 / 844×390 / 1440, both themes), and there is **1 serious violation**: the desktop break phase pill, in both
themes.
**Console errors:** **0** across 126 matrix captures, ~40 driven flows and the suite.
**Evidence** (local, gitignored), all under `review/out/round-2/`:
- `shots/<id>.png`: `capture.mjs` matrix
- `flows/<flow>-NN-<state>.png` + `flows/<flow>.json`: real-click flows with a per-state audit (CTA in view, h-scroll, <44 px
  targets, "!" count, placeholder text, axe)
- `frames2/<seq>/`: CDP screencast sequences
- drivers: `flows.mjs`, `frames.mjs`, `longtask.mjs`, `keys.mjs`, `axe-extra.mjs`

## What round 1's fixes look like now

Verified fixed, with no regression:
- **Brew start is responsive.** Pause is fully opaque 0.40–0.68 s after the tap (rAF probe). The largest long task is 148 ms
  (see scene P2).
- **No offline toast.**
- **Digits swap cleanly.**
- **Zen:** the first tap acts. At 1440 the status went to `paused` on the first click.
- **CTA visibility:** the Start CTA is in view at 390, landscape and 1440. Welcome "Get started" is visible in landscape.
- **Stats at 1440** is a real two-column page, and the rail no longer duplicates it.
- "Recipes complete" copy and streak footer copy are fixed.
- **Toasts sit at the bottom**, and disabled buttons read as buttons.
- **Dark theme:** the 3D room is lamplit, and the level-up preview renders in dark (`shots/done-card4.dark.png`).
- **Paused room:** it desaturates and Chai sleeps (`flows/keys-shortcuts-sheet.png`).
- **Screen changes:** no blank frames. They are now cross-fades (see design-system P2).

Also new and good:
- Time-of-day Chai (morning stretch, evening lamp, late-night sleep, `flows/tod-*.png`)
- Desktop celebration now uses the stage (`flows/done-desk-02-card1.png`)
- Landscape celebration and break are designed side by side (`flows/done-land-*.png`)
- Collapsible "See your rhythm" and "View all 12 badges"

## Summary

Scores are 1–10 per RUBRIC §1. A dash (–) means not applicable. PASS needs every criterion ≥ 8 and no hard fail. Blind Δ fills
in after the judge scores the pairs.

| Area | Clarity | Charm | Polish | Ease | A11y | Resp | Cohesion | Delight | Blind Δ | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|
| design-system | 8 | 8 | **7** | 8 | **7** | **7** | 8 | 8 | – | **SEND BACK** |
| timer (+PWA) | 8 | – | 8 | 8 | 9 | 8 | 8 | – | – | **PASS** |
| scene (3D, nook) | 8 | 9 | **7** | 8 | 8 | **7** | **7** | 8 | – | **SEND BACK** |
| progress (stats) | 8 | 8 | 8 | 8 | 9 | 8 | 8 | 8 | pending | **PASS** (pending blind) |
| core-loop (focus, done, break) | 8 | 9 | **7** | **7** | **6** | **7** | 8 | 8 | pending | **SEND BACK** (hard fail) |
| home (home, welcome, settings) | 8 | 9 | **7** | 8 | 8 | **5** | 8 | 8 | pending | **SEND BACK** (hard fail) |

## Top issues (whole app, by impact)

1. **P0 · home (hard fail): horizontal overflow at 320.** The home status bar (`.statusBar`, `Home.module.css`) is 332 px wide
   with −8 px side margins. Its third stat ends at x=340. With `isMobile` the browser widens the layout viewport to
   340 px, so a real 320 phone either scrolls sideways or shrinks the page to fit. In the 320×640 capture:
   - the speech bubble and the level bar are clipped at the right edge
   - the tab-bar labels are cut at the bottom
   - the sticky CTA wraps to two lines

   Pages are clean from about 350 px. Evidence: `shots/home-veteran.small.png`, `test-results/functional/layout-320-home.json`
   (`innerW: 340`).
2. **P0 · core-loop (hard fail): the desktop break phase pill fails contrast.** White on `--sky #3494d1` at 14 px is **3.33:1**
   (axe serious), light and dark, at 1440. Evidence: `flows/done-desk-07-break.png`, `axe-extra.mjs` output. `--sky` needs a
   text-safe partner (design-system).
3. **P1 · home (hard fail, overlap): landscape home.** The composer card starts at x=446 and covers the Cozy-level pill
   (x 344–466, a button), plus the right edges of the speech bubble and the goal card. Evidence:
   `flows/home-land-light-01-veteran.png`.
4. **P1 · design-system: a toast covers the primary CTA.** After ending early, "Saved 9 minutes of focus" sits on top of "Put
   the kettle on" (390, light). Evidence: `flows/focus-09-after-end.png`.
5. **P1 · core-loop: the end-early dialog is clipped in landscape (844×390).**
   - "Keep brewing" is cut by the bottom edge, and "End session" is off-screen.
   - Evidence: `flows/focus-land-light-03-end-sheet.png`.
6. **P1 · scene: the fallback is still a different room.**
   - The fallback is a flat, front-on *night* room, even in the light theme. On software GL it cross-fades after about 5 s
     into an isometric *daylight* 3D room, which then brightens again (`frames2/brew-start/10→18`).
   - With reduced motion or `nookq=off`, the night fallback is permanent inside a light UI (`shots/rm-focus.png`).
   - Its crop cuts the kettle at the left edge and the lamp glow at the right (`shots/focus-running.land.png`).
7. **P1 · home: landscape onboarding questions.**
   - Chai and the question scroll away.
   - About 1.5 option cards are visible in a ~220 px strip between the header and a sticky footer.
   - The name input sits under the footer.
   - Evidence: `flows/onb-land-02-name.png`, `flows/onb-land-goal-scrolled.png`.
8. **P1 · scene: nook in landscape.** A ~40 px title takes the top quarter of the screen, and the room is cut in half.
   Evidence: `flows/nook-land-light-01-nook.png`.
9. **P2 · core-loop: the whistle beat ends on an empty panel.** In landscape, Chai and the green ring fade out and leave an empty
   glow (~2.3 s) before card 1 re-introduces Chai. The "00:00" digits also double-expose over Chai and "Tea's ready". Evidence:
   `frames2/whistle-land2/06, 09–11`.
10. **P2 · scene: the level-up reveal is spoiled.** The level-8 record player pops into the room during the whistle beat,
    before card 4 announces it. It is absent while brewing (`flows/reveal-before-finish.png`) and present at the whistle
    (`flows/done-01-whistle.png`). Card 4 is `flows/done-05-card4.png`.

---

## design-system: SEND BACK

The kit is at Duolingo grade, with very few misses:
- tokens and the pressable edge
- plum night theme
- sticky compact stats header ("Stats · 23" when scrolled)
- desktop celebration scale
- sheet pattern
- no raw controls

What keeps it from passing is **layering** and **short-height layout**.

- **P1 Toast vs CTA** (issue 4) · home · 390 · light.
  - **Problem:** the toast is bottom-anchored at a fixed offset, so it lands on the sticky CTA.
  - **Good looks like:** the toast host knows the "primary action slot". Place toasts 12 px above whichever sticky CTA or tab
    bar is present. If there is no room, show the confirmation inline under the CTA (Duo shows its "Streak extended" pill
    *above* CONTINUE, never over it).
  - Evidence: `flows/focus-09-after-end.png`.
- **P1 Text-on-sky token** (issue 2). White on `--sky` #3494d1 is 3.33:1.
  - **Problem:** that is fine for "Start tea break" (21 px bold, large text; axe is clean on cards 2–5 at 390 and 1440). It fails
    for small text such as the 14 px desktop phase pill.
  - **Good looks like:** add a `--sky-strong` (≈ #1f6fa8, ≥4.5:1 with white) for small text-bearing fills, or use ink text on
    sky. Audit every white-on-sky and white-on-honey use below 18.66 px bold.
- **P1 Compact-height strategy is only half-adopted** (844×390). Celebration, break and focus are designed side by side. Home
  overlaps (issue 3), onboarding questions scroll in a slit (issue 7), and nook, stats and settings keep ~40 px page titles.
  - **Good looks like:** one `@media (max-height: 500px)` contract:
    - header and title ≤ 24 px
    - two-column split for any "mascot + question" or "summary + controls" screen
    - dialogs cap at `100dvh − 24px` with actions pinned
  - Evidence: `flows/*-land-*.png`, `flows/stats-land-light-01-stats.png`, `flows/settings-land-light-01-settings.png`.
- **P2 Route cross-fade double-exposes text.** At home → focus, the greeting, goal card and recipe list show through the new
  timer for about 150 ms (`frames2/brew-start/06`). Cross-fading two text-heavy screens reads as a glitch. Duo slides the lesson
  up *over* the path.
  - **Good looks like:** enter over exit with an opaque background on the entering screen (slide up 24 px + fade in; the exit
    stays static underneath).
- **P2 Destructive action weight in sheets.** The reset sheet gives "Reset everything" a filled berry button at the same size
  as "Keep my data".
  - **Good looks like:** the destructive action as a text button (Duo's quit sheet `dialog-quit-confirm`). The end-early
    sheet uses a tinted secondary, so the two sheets are inconsistent.
  - Evidence: `flows/settings-int-01-reset-sheet.png`.

## timer (+PWA): PASS

Everything I could throw at it held up:
- **Tab title and favicon:** the title reads "24:58 · Focusing — Kettle" and "… · Paused — Kettle", with a data-URL favicon.
- **Live regions** are polite and eventful, not per-second: "Paused. 15 minutes 48 seconds left.", "Added 5 minutes…",
  "Kettle's off. 9 minutes of focus saved."
- **Keyboard:** Space, `+` and Esc work, and they are hinted under the controls.
- **Reliability:** reload mid-brew, paused and running, and mid-celebration all hold. Offline after first load works.
- **Two tabs:** they record exactly one brew, and pause in B reflects in A (`twotabs3.mjs`).
- **P2** A 148 ms long task lands on the start tap (with 78 ms at +2.6 s), against round 1's 50 ms budget. It is not
  user-visible at this size, but it is the first thing to grow on a slow phone. Shared with scene.
- (Harness, not app) Two faults in the functional two-tab test are fixed. Seeds pin the debug clock, so tab B must load the
  same seed, and fast-forward must use `__kettle.clock.now()` rather than `Date.now()`.

## scene: SEND BACK

The lamplit dark room is lovely:
- the paused state desaturates and Chai sleeps
- steam builds and the room pauses
- the nook item story ("It grows a little every time you focus. Probably.") and the badge-tier sheet are delightful

Issues:
- **P1 Fallback ≠ room** (issue 6), in the light theme at every viewport.
  - **Good looks like:** a pre-rendered still *of the actual 3D room* for the current theme (render once at build time or cache
    the first frame to IndexedDB), framed identically, so the swap is invisible. Night art belongs only to the dark theme.
  - Evidence: `frames2/brew-start/`, `shots/rm-focus.png`, `flows/done-desk-01-whistle.png` → `flows/done-desk-08-break-1min.png`.
- **P1 Nook in landscape** (issue 8) · 844×390 · light.
  - **Good looks like:** the room fills the height on the left, with level and "Cozy things" in a right column, as the
    landscape break layout already does. Evidence: `flows/nook-land-light-01-nook.png`.
- **P2 Level-up reveal spoiled** (issue 10). Hold newly unlocked items out of the scene until card 4 has shown them, then pop
  them in on the next room mount with a little sparkle.
- **P2 3D brightens after appearing.** The first frames of the 3D room are dim and it then jumps to daylight
  (`frames2/brew-start/17→18`). Start at the final exposure.
- **P2 148 ms long task** on the start tap (see timer). Split scene build and shader compile so that nothing exceeds 50 ms.

## progress (stats): PASS (pending blind)

Mobile is at Duolingo profile craft:
- 2×2 tiles
- Cozy level with the next unlock
- 7-day bars against a goal line
- a streak calendar with a distinct Tea-Cozy day
- honey personal bests
- tiered hex badges with a tier-history sheet
- a collapsed rhythm section and editable history

At 1440 it is now a real two-column page. axe is clean in both themes.
- **P2 Dark personal bests** read as muddy olive-brown (`flows/stats-desk-dark-01-stats.png`,
  `shots/stats-veteran.desk.dark.png`). Use a honey-tinted plum (honey at ~14 % over `--card`) with honey numerals.
- **P2 Column imbalance at 1440.** The left column ends about 360 px before the right (history), leaving a dead block. Move
  Personal bests to the right column, or let history span both columns below.
- **P2 Landscape title** is oversized (see design-system compact-height).

## core-loop (focus, done, break): SEND BACK

The celebration is the best sequence in the app. All five cards are in view with one CONTINUE and correct copy:
- whistle tiles with a leaves receipt
- a 7-day streak with an earned Tea Cozy
- the tin opening, with 2 of 3 recipes
- level 8 with the nook preview
- a new badge with "Start tea break" and an auto-start timer

Break has rotating ideas and "Start next brew". Break-over has "Put the kettle on" and "Done for now". Reduced motion passes (no
transform animations). Landscape and 1440 are designed.

Issues:
- **P0 Desktop break pill contrast** (issue 2) · 1440 · light + dark · axe serious. Evidence: `flows/done-desk-07-break.png`.
- **P1 End-early dialog in landscape** (issue 5) · 844×390 · light.
  - **Good looks like:** at compact height, a two-column sheet: Chai and the copy on the left, "Keep brewing" and "End session"
    stacked on the right, all within 390 px. Or a bottom sheet with pinned actions that scrolls only the body.
- **P2 Whistle hand-off** (issue 9) · landscape (and portrait) · light.
  - **Good looks like:** the ring and Chai carry into card 1 as a shared element (Chai stays; the ring morphs into the tile
    row). Never fade the peak character out to an empty glow. Also fade the "00:00" digits out *before* Chai scales in.
  - Evidence: `frames2/whistle-land2/`.
- **P2 Card 5 (badge) composition.** The top ~40 % of the card is empty and the badge sits low (`flows/done-06-card5.png`). Centre
  the badge group optically and grow the hex to about 140 px.
- **P2 "GOAL MET 37 min" is ambiguous.** Is it 37 of what? Show "37 / 30 min" with the check, or label the tile "Today". Also,
  at 1440 the receipt chips wrap 3 + 1 with an orphan (`flows/done-desk-02-card1.png`). Keep them on one row or balance them
  2 + 2.
- **P2 Phase copy regresses after +5.** At 20:46 it goes back to "Kettle's warming up…" after "Deep in it. Nice."
  (`flows/focus-04-plus5.png`). Drive the copy from elapsed minutes, not from the fraction.

## home (home, welcome, settings): SEND BACK

At 390 and 1440, home, onboarding and settings are at the bar:
- time-of-day Chai
- "Try Gentle · 15 min" late at night
- warm at-risk copy
- a sticky CTA with "Then a 5 min tea break."
- a context-rich notifications step with a preview notification
- a summary step and a direct hand-off into the first brew
- settings grouped with overlines, keyboard shortcuts listed and a blocked-nudges helper

Small and landscape phones break it.

- **P0 320 overflow** (issue 1) · 320×640 · light.
  - **Good looks like:** the status bar fits in 288 px. Use `gap: 4px`, no negative margins, and hide the level progress bar
    below 360 px (keep the badge).
  - After that fix, make sure the sticky CTA stays on one line: drop "· 25 min" to the sub-line under 360 px.
  - Evidence: `shots/home-veteran.small.png`.
- **P1 Landscape home overlap** (issue 3) · 844×390.
  - **Good looks like:** a true 2-column grid, with greeting, stats, goal and Chai left, and composer plus CTA right, and no
    absolute or overflowing composer.
- **P1 Landscape onboarding questions** (issue 7) · 844×390.
  - **Good looks like:** the welcome step's layout: Chai and bubble left (fixed), options scroll on the right, and Continue
    under the options on the right.
- **P2 The name step still disables Continue** although the name is optional, and it keeps a separate top-right "Skip"
  (`flows/onb-02-name.png`). This was carried from round 1. Make it "Skip for now" → "Continue" as the user types.
- **P2 The at-risk evening nudge is inconsistent.** Chai says "One short brew keeps it going", but the CTA is Classic 25 min
  (`flows/home-atrisk-evening-01-atrisk-2040.png`). Offer the "Try Gentle · 15 min" chip there too.
- **P2 Desktop welcome is still underscaled.** A ~150 px Chai and a 280 px CTA float in a 1440 canvas
  (`shots/onb-hello.desk.png`). Use a two-column hero (Chai at 280 px | wordmark + CTA).
- **P2 Tablet (820) home** is a single phone column with wide margins (`shots/home-veteran.tablet.png`). Use two columns (goal +
  composer | recipes + brews).
- **P2 Reset sheet destructive weight** (see design-system).

---

## Cross-cutting owners

| Issue | Owner |
|---|---|
| `--sky` text contrast token; audit white-on-sky and white-on-honey at small sizes | design-system (pill fix: core-loop) |
| Toast placement relative to sticky CTA | design-system |
| Compact-height (`max-height: 500px`) contract; screens adopt it | design-system → home, scene (nook), core-loop (end sheet) |
| Enter-over-exit route transition (no text double exposure) | design-system (`App.tsx`, coordinate with the orchestrator) |
| Fallback still of the actual room per theme; hold new items until revealed | scene |
| 320 status bar overflow, landscape home grid | home |

## Harness notes

- **`functional.spec.ts` · layout:** with `isMobile`, Chromium widens the layout viewport to fit overflowing content, so
  `scrollWidth ≤ innerWidth` passed while the page was zoomed out to 340 px. I added an assertion that `innerWidth` equals the
  configured viewport width. It now catches the 320 home overflow.
- **`functional.spec.ts` · two tabs:** tab B now loads with the same seed, and fast-forward uses the debug clock (see timer).
  The test passes.
- **Remaining blind spots:**
  - The layout test's overlap check only compares controls with each other, so a card covering a button (landscape home)
    passes.
  - axe in the suite runs only at 390 with reduced motion, which is how the desktop break pill got through. `axe-extra.mjs` covers
    1440 and landscape for now.
- **`capture.mjs` frame triggers** `start-brew` and `pause` failed on stale accessible-name regexes. The flows and `frames.mjs`
  replace them this round.
- Blind round 2: 21 pairs over 13 screens in `review/pairs/round-2/` (`JUDGE.md` is brand-neutral). The key with a per-pair
  state note is in `review/pairs/round-2-key/key.json`, and the plan is in `review/blind-plan-round-2.json`.
  - Duolingo refs are cropped copies (`review/out/round-2/crop.mjs` with `review/out/round-2/crops.json`).
  - Two Kettle shots come from `review/out/round-2/recap.mjs`: the notifications step with the permission stubbed to
    `default`, and badges scrolled clear of the sticky header.
  - Dropped for lack of a clean, settled ref: focus in-session (the CHECK button is cropped), break running, nook, the streak
    calendar (an infographic) and all GIF mid-animation frames.
  - Aggregate with `node review/blind.mjs --aggregate review/pairs/round-2/scores.json`.
