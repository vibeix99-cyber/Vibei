# Round 3: critic review (2026-09-28)

**Build:** `2863681`, clean `src/`, production build (`vite build` → `vite preview` on :4191). No HMR touched any page.
**Harness:** new round-3 drivers in `review/out/round-3/`:
- `lib.mjs` adds a hit-test audit (`covered`). It flags a control whose centre is under another element, and ignores content that is merely scrolled beneath sticky or fixed chrome. This closes round 2's blind spot, where a card covering a button passed.
- `verify.mjs` holds the per-item assertions.
- `flows.mjs` is round 2's real-click flows, now in both themes at 390 / 844×390 / 1440.
- The other drivers: `frames.mjs` (CDP screencast, per-frame luminance σ + size), `pause-latency.mjs`, `keys*.mjs`, `zen.mjs`, `h1.mjs`.

**Totals:**
- `verify.mjs` (final runs): **101 assertions, 4 failed**, all harness artefacts that were re-checked. A first pass that fed `btnRect` a string was fixed and re-run.
  - `fresh` redirects to /welcome, so there is no home CTA to find (expected)
  - onboarding goal options aren't `role=radio` (the screenshots show the fix)
- Sweep: **198 audited flow states + 32 verify states**
  - **0 console errors / pageerrors**
  - **0 horizontal scroll**
  - **0 covered controls**
  - primary action in view in every state that has one
- axe (WCAG 2.2 AA): **106 runs** over home, welcome (every step), focus, end sheet, ambience sheet, done cards 1–2, break, break-over, stats, nook, settings, the badge, history, item and reset sheets, and blank states, in light + dark at 390 / 844×390 / 1440. They are **clean, except for one new serious violation: the idle ("zen") focus state in both themes** (see core-loop P1).

Evidence (local) is under `review/out/round-3/`:
- `verify/<item>-*.png` + `verify-<item>.json`
- `flows/<flow>-NN-<state>.png` + `flows/<flow>.json`
- `frames/<seq>/NNN-<ms>.jpg` + `frames.json`
- `zen/`, `keys/`
- contact sheets `m-*.png`

## Round-2 fixes: verified

| # | Item (viewport it failed on) | Assertion | Result |
|---|---|---|---|
| 1 | Home overflow @ 320×640 | `innerWidth === 320`, status bar ⊂ [0,320] (kids end at 94/221/304), CTA one line (h 60) in view, 0 covered; also stats/nook/settings/focus @ 320 | **FIXED**: `verify/i1-home-320-light-01-home.png` |
| 2 | Break phase pill @ 1440 | axe clean + computed small-text contrast scan (0 fails) light + dark | **FIXED**: `verify/i2-break-1440-{light,dark}-01-break.png` |
| 3 | Landscape home overlap @ 844×390 | 0 covered controls, 0 block overlaps, CTA in view; veteran + atRisk, light + dark | **FIXED**: `verify/i3-home-land-light-veteran-01-home.png` |
| 4 | Toast over Start CTA | toast rect ∩ CTA = ∅ and CTA hit-testable; 390 L/D, 320, 844×390, 1440 | **FIXED** (see new P2: it now sits on the rhythm selector): `verify/i4-toast-phone-light-01-after-end.png` |
| 5 | End-early dialog clipped @ 844×390 | both actions fully in view + hittable, axe clean, focus in dialog, Esc closes; also 320/390/1440 | **FIXED**: `verify/i5-end-land-light-01-end-sheet.png` |
| 6 | Static fallback always night, cropped | fallback SVG ⊂ host (`xMidYMid meet`) at 390/844/1440; light = day room, dark = lamplit night; same cutaway as 3D | **FIXED** (framing P2 below): `m-i6.png`, `m-i6b.png` |
| 7 | Landscape onboarding questions | name input visible, not under footer; Chai + question left; 3 options visible; Continue in view before and after scrolling the list; notify CTA in view; light + dark | **FIXED**: `verify/i7-onb-land-light-03-goal.png`, `m-onb-land.png` |
| 8 | Nook @ 844×390 | h1 24 px; room 360/390 px tall on the left; details right; 0 covered | **FIXED**: `verify/i8-nook-land-light-01-nook.png` |
| – | Celebration hero fill; "Today 37/30" | tile reads `TODAY 37/30`, sr "Daily goal met: 37 of 30 minutes"; Continue in view @ 390/320/dark | **FIXED** for cards 1–4. Card 5 is still open. `flows/done-02-card1.png` |
| – | Stats badges copy + sticky header | compact bar `rgb(255,249,240)` / `rgb(36,26,45)` opaque, no backdrop; "12 of 12 badges earned · 25 of 56 tiers" | **FIXED**: `out/round-3/kettle/stats-badges.png` |

Probes:
- **Pause after Start** (prod build, rAF probe + real tap, 3 runs each):
  - 390 light: visible 325–588 ms, paused 460–628 ms
  - 390 dark: paused 446–667 ms
  - 844×390: paused 483–595 ms
  - 1440: paused 520–**817** ms (cold)
  - Largest long task: 141 ms (round 2: 148). Mobile meets ~600 ms apart from the first cold run; desktop's cold run doesn't.
- **Blank frames:**
  - Home → focus: no blank frames (min σ 16.5, min 24 KB, 390 L/D, landscape, 1440).
  - Whistle → celebration: **one near-blank frame at 390** (σ 10.5, 6 KB against a 26 KB median, held for 614 ms); see core-loop P1.

## Summary

Scores are 1–10 per RUBRIC §1. PASS needs every criterion ≥ 8 and no hard fail. Blind Δ comes from the round-3 pairs once the judge has scored them.

| Area | Clarity | Charm | Polish | Ease | A11y | Resp | Cohesion | Delight | Blind Δ | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|
| design-system | 8 | 8 | 8 | 8 | 8 | 8 | 8 | 8 | – | **PASS** |
| timer (+PWA) | 8 | – | 8 | 8 | 8 | 8 | 8 | – | – | **PASS** |
| scene (3D, nook) | 8 | 9 | 8 | 8 | 8 | 8 | 8 | 8 | – | **PASS** |
| progress (stats) | 8 | 8 | 8 | 8 | 9 | 8 | 8 | 8 | pending | **PASS** (pending blind) |
| core-loop (focus, done, break) | 8 | 9 | **7** | 8 | **6** | 8 | 8 | **7** | pending | **SEND BACK** (hard fail: axe serious) |
| home (home, welcome, settings) | 8 | 9 | 8 | 8 | 8 | 8 | 8 | 8 | pending | **PASS** (pending blind) |

## New or still-open issues, by impact

1. **P1 · core-loop (hard fail, NEW): the idle "zen" focus state fails contrast.**
   - About 8–10 s after Start (no pointer or key), the controls dim to opacity 0.4.
   - The Add time / Pause / End captions and the "+5" glyph then drop to **2.28:1** (light, `#b1a79f` on `#fffbf4`) and **2.75:1** (dark, `#6d5f66` on `#241a2d`).
   - axe reports this as *serious*, at 390 and 1440, in both themes.
   - Round 2 missed it because its axe ran before the dim.
   - Evidence: `zen/zen-{desk,phone}-{light,dark}.json`, `flows/focus-desk-full.json`.
   - **Good looks like:** idle chrome that either stays legible or truly leaves.
     - Keep the Pause ring and icon at ≥ 3:1 (non-text contrast), e.g. opacity ≥ 0.7 on those tokens.
     - Fade captions and key hints fully out (`opacity:0; visibility:hidden` after the transition) and bring them back on any pointer or key.
     - The timer digits already stay at full ink; keep that.
2. **P1 · core-loop: the whistle → card 1 hand-off stalls on a near-blank screen.**
   - At 390, Chai and the green ring fade out (1.69–1.84 s). Then a cream wipe covers everything but the top edge of the scene card and **sits there for 614 ms** (frame `020-01951ms`, σ 10.5, 6 KB) before card 1 appears at 2.57 s.
   - In landscape, the same wipe freezes half-way for 464 ms (`whistle-land-light/019-01985ms`).
   - At 1440 dark, the running timer stays on screen for about 3.6 s after `finish()`, with a 1.3 s freeze before the ring appears (`whistle-1440-dark/006`). SwiftShader inflates this, but the stall pattern is the Done screen mounting under the wipe.
   - Round 2's P2 (the peak character fades to an empty glow) is still there and is now measurable as a blank beat.
   - Evidence: `frames/whistle-390-light/`, `m-whistle390.png`.
   - **Good looks like:**
     - Mount card 1 *before* the wipe starts: pre-render it hidden, or split the heavy work into idle chunks so no frame freezes over 100 ms mid-transition.
     - Carry Chai across as a shared element: the ring Chai becomes the card-1 Chai with no fade-out, as Duo's lesson-end keeps Duo on screen.
3. **P2 · design-system (NEW, from fix 4): the toast now covers the rhythm selector.**
   - At 390, "Saved 9 minutes of focus" (y 606–658) sits over the Deep/Gentle segment labels just above the CTA.
   - It is transient, but it hides a control the user may want next.
   - Evidence: `verify/i4-toast-phone-light-01-after-end.png`.
   - **Good looks like:** anchor the toast inside the CTA dock, in the gap between the CTA and "Then a 5 min tea break", or morph the confirmation into the CTA's sub-line for 3 s.
4. **P2 · design-system (still open): the home → focus cross-fade double-exposes.**
   - At about 1.1 s after the Start tap, the greeting, the recipes and a transient **"Your kettle's on · Back to your brew"** card (home reacting to the new brew mid-fade) show through the 25:00 timer.
   - Evidence: `frames/brew-390-light/012-01101ms.jpg`, `m-freeze.png`.
   - **Good looks like:** enter over exit with an opaque entering screen, and freeze the exiting home's render (no state-driven re-render during the exit).
5. **P2 · scene (still open): the level-up reveal is still spoiled.** The level-8 record player appears by the window at the whistle (`frames/whistle-390-light/013-01347ms.jpg` against `000-00168ms.jpg`), two cards before card 4 announces it. Hold unlocked items back until card 4 has been seen.
6. **P2 · scene (NEW, from fix 6): the fallback → 3D swap reframes the room.**
   - The static room is drawn about 15–20 % smaller and lower than the 3D camera frames it, so the cross-fade visibly zooms and shifts. At 844×390 the static room hugs the bottom-left, with empty sky top-right.
   - Evidence: `m-i6.png` (static vs 3D, same viewport), `m-i6b.png`.
   - **Good looks like:** match the static projection to the 3D camera's fit, so that the room's floor corners land on the same pixels.
7. **P2 · core-loop (still open): card 5 (badge) composition.** The top ~35 % is empty violet glow and the hex badge sits at mid-height (`flows/done-06-card5.png`, same at 1440). The hero-fill fix covered cards 1–4 only. Apply the same hero sizing to card 5, with the badge at about 140–160 px, optically centred in the hero.
8. **P2 · core-loop (still open): the receipt chips orphan.** "+10 daily goal met" wraps alone onto a second row at 390, 844×390 and 1440 (`flows/done-desk-02-card1.png`, `flows/done-land-02-card1.png`). Balance them 2 + 2, or use a single row at ≥ 600 px.
9. **P2 · core-loop (NEW): the landscape level-up preview framing.** The nook thumbnail crops Chai at its left edge and leaves the right third as empty sky, so the new record player sits at the edge (`flows/done-land-05-card4.png`). Frame the preview on the new item.
10. **P2 · core-loop (still open): phase copy regresses after +5.** At 20:46 it reads "Kettle's warming up…" again (`flows/focus-04-plus5.png`). Drive it from elapsed minutes.
11. **P2 · timer (NEW): the Space hint conflicts with focus restore.**
    - After the end sheet closes by mouse, focus returns to the End button, so Space re-opens the sheet instead of pausing (`keys2.mjs` log).
    - Esc-open and body-focus Space both work.
    - **Good looks like:** the global Space handler wins while a focus-screen control (not an input) has focus, with `preventDefault` on keydown, as media players do.
12. **P2 · timer / scene (still open): the cold Start → Pause path.**
    - At 1440 the cold run takes 817 ms. The largest long task is 141 ms against a 50 ms budget.
    - Evidence: `pause-latency.mjs` output (in this report).
    - Split the scene build and shader compile.
13. **P2 · progress + home (still open): compact-height titles on stats and settings.** At 844×390, "Stats" is 38 px and "Settings" 34 px, while nook now uses 24 px (`flows/stats-land-light-01-stats.png`, `flows/settings-land-light-01-settings.png`). Adopt the nook's compact header.
14. **P2 · progress (still open): 1440 stats.**
    - The left column ends well above the right (history), and dark personal bests are still olive-brown tiles.
    - Evidence: `flows/stats-desk-dark-01-stats.png`.
15. **P2 · home (still open):**
    - **Name step:** Continue is disabled for an optional field, and "Skip" sits top-right (`flows/onb-02-name.png`, also in landscape).
    - **At-risk evening:** "One short brew keeps it going" but the CTA is Classic 25 min, with no Gentle chip (`flows/home-atrisk-evening-01-atrisk-2040.png`).
    - **Desktop welcome** is still underscaled (`flows/onb-desk-01-hello.png`).
    - **Tablet (820)** is still a single phone column (`flows/home-tablet-light-01-veteran.png`).
    - **Landscape tag chips:** "Read" is hard-clipped at the composer's edge with no fade or scroll affordance (`verify/i3-home-land-light-veteran-01-home.png`).
16. **P2 · design-system (still open): the reset sheet's destructive weight.** "Reset everything" is still a filled berry button at full size (`flows/settings-int-01-reset-sheet.png`). Make it a text button, as in the end-early sheet.

---

## design-system: PASS

- Layering is fixed:
  - toasts never cover the CTA or the tab bar at any viewport
  - the sky text token (`--sky-strong`) is in place
  - the compact-height contract is adopted by home, onboarding, sheets and nook
- Remaining work is P2: toast placement over the rhythm selector (3), the cross-fade double exposure (4), and the stats/settings compact titles (13, shared).

## timer (+PWA): PASS

- Keyboard (Space / Esc / focus trap / restore) works.
- Pause is actionable in ≤ ~600 ms on phones.
- No console errors.
- P2 (11) Space on the focused End button, (12) the cold desktop path.

## scene: PASS

- The fallback is now the same room: same cutaway, a day room in light and a lamplit night room in dark, never cropped at 390 / 844 / 1440.
- Nook landscape is designed: the room fills the height on the left.
- P2 (5) spoiled reveal, (6) swap reframing, (12) long task.

## progress (stats): PASS (pending blind)

- The badge count copy is clear, and the compact header is opaque in both themes.
- axe is clean in every theme and viewport.
- P2 (13) landscape title, (14) 1440 balance and dark personal bests.

## core-loop: SEND BACK

- The cards, break and break-over hold at 390, 844×390 and 1440 in both themes. There are 0 covered controls, and every CTA is in view.
- "Today 37/30" reads unambiguously.
- The end-early sheet is fixed everywhere.
- Blocking:
  - **P1 (1)**: zen-dim contrast, axe serious (a hard fail)
  - **P1 (2)**: the near-blank whistle hand-off stall
- Also P2 (7) card 5, (8) chip orphan, (9) landscape level-up preview, (10) phase copy.

## home: PASS (pending blind)

- The 320 and landscape fixes hold in both themes.
- Landscape onboarding is designed side by side all the way to "Put the kettle on" and the first brew.
- The P2 bundle (15) is carried from round 2.

## Blind round 3

- There are **9 pairs** over the 6 changed screens: onboarding-question ×3, home ×2, done-1, done-streak, done-recipes and stats-badges.
- They are in `review/pairs/round-3/`, and `JUDGE.md` is brand-neutral (grep-checked).
- The key, with a per-pair `state` note, is `review/pairs/round-3-key/key.json`, and the plan is `review/blind-plan-round-3.json`.
- The Kettle shots are `review/out/round-3/kettle/*.png`: 390×844 @2x, light, prod build, settled, no toasts, with capture-log `ok` on all six.
- stats-badges uses an instant scroll that clears the opaque sticky header, so the "Badges" heading and count are visible.
- Aggregate with `node review/blind.mjs --aggregate review/pairs/round-3/scores.json`.
