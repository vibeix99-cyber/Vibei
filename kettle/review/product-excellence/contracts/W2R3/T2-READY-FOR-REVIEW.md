# W2R3 · Maker T2 · I10, notices without overlays

**Status: READY FOR REVIEW**

| | |
|---|---|
| Branch | `pe/w2r3-notices` (from `61aba17`, kettle/src `4556926`) |
| Code | `61b463c` (kettle/src tree `5aa622852015f3df3de4abd7c251ec6c61264e55`) |
| Packet | the commit that adds this file, the only child of `61b463c` on `pe/w2r3-notices` (its hash is in the hand-back) (this file and `W2R3/T2/` only) |
| Trial merge | `git merge-tree --write-tree claude/wizardly-galileo-uy89d9 (f1f059c) 61b463c` → clean, tree `e85f42b600405ced4c529478994a36ab38d9a714` (merge base `61aba17`). No change to `SaveWarning*`, `src/scene/**`, `src/screens/done/**`, `src/screens/focus/stage/**`, `public/**`, `vite.config.ts`, `src/progress/badges.ts` (`git diff --stat 61aba17 61b463c` over those paths is empty) |
| Servers used | fix dev :5471, fix preview :5481 (`/tmp/rv7-servers/dist-w4t2`); controls dev :5474 (worktrees `/home/user/wt/w4t2-ctl` = `acf1c6a`, `/home/user/wt/w4t2-c20671eb`, `-ce866118`, `-cb39202f`, one at a time); base :5470 / :5480 read only |
| Evidence | `W2R3/T2/` — `runs/` (suite logs and JSON), `probes/` (control-first JSON), `shots/` (BEFORE/AFTER), `triples/`, `tools/` (every probe and capture script) |

## 1. The design (Vibei's decision, applied)

There is no overlay and no floating notice left. `src/ui/Toast.tsx` was rewritten; the old placement code (`toastLiftBottom`, `toastRoomTop`, `topBarBottom`, `toastDock`, `foldToFit`, the `body:has([data-toast-above])` lift CSS, the fold CSS, the fixed `.region`) is gone. `toast()` keeps its API, so every caller is unchanged except the three Undo surfaces.

### 1.1 Undo is inline (`src/ui/InlineUndo.tsx`)

| Surface | Where the Undo is | Duration | Focus |
|---|---|---|---|
| Today › "Mark done" (`screens/home/Composer.tsx`) | The "Carried from your last brew · Mark done" line becomes "✓ Crossed off. Nice work. · Undo" in the same line, the Undo in Mark done's own link style and box | 5 s | From the keyboard, focus moves to the Undo that took Mark done's place; a tap leaves focus alone (no phone keyboard, no Recent row sliding in). Undo puts the task back in the field |
| Stats › History › delete (`screens/stats/History.tsx`) | The deleted brew's row turns into "🗑 Brew deleted · Undo", in place, at the person's scroll position. The delete also changes the totals and charts above the row: the page is kept still on the row (`holdTop`/`keepStill`), so the Undo is on screen exactly where the person saw the row (spec: ≤ 2 px) | 5 s | Keyboard: focus goes to the Undo once the sheet has gone |
| Settings › Your data › import (`screens/settings/DataSection.tsx`) | The "Import a backup" row becomes "✓ Added … / Backup restored … · Undo"; after Undo, the same row says what Undo did ("Import undone…" / "Can't undo any more…") for 3.2 s, then is the Import row again | 10 s | Keyboard: focus goes to the Undo once the sheet has gone |

Each is announced once (one polite addition to the notices' light-DOM announcer: "Crossed off. Nice work. Undo"); the button's own name is "Undo: …", so the message is not read twice. The clock pauses while the pointer or keyboard focus is on it, while a sheet is open and while the page is hidden. When its time is up it goes only at a safe moment (1.4).

### 1.2 One in-flow notice strip per screen

`<NoticeStrip/>` is an ordinary block in the page flow: empty, it takes no room; with a notice, it takes the notice's room and pushes what follows down. One notice at a time, whole (icon, every word — it wraps, never clamped or folded — and its action ≥ 36 px tall). The active strip is the most specific mounted strip of the screen that is not leaving (a route layer leaving is marked by `NoticeLayer` in `App.tsx`'s `Dissolve`; a session view leaving by `useIsPresent`).

| Screen | Where the strip sits | Why |
|---|---|---|
| Today (portrait phones, tablets, desktop) | The top of the page, above the stats row and the greeting (`app/Shell.tsx`, top of `<main>`) | The one place in view whenever Today opens, at every size and text size (at 375×667 @200 the docked start already covers everything below the greeting). End's "Saved … of focus" is there in Today's first frame |
| Today (landscape phones) | The head of the pinned left column, above the stats and greeting (`screens/home/HomeScreen.tsx`) | In view when Today opens, and it never pushes the composer column (task field, Mark done, Brew length) under the docked start: measured at 844×390 @100, Mark done stays at 184–228 with a notice up (with the page strip it went to 252–296, under the dock at 290) |
| Stats, Nook, Settings | The top of the page (`app/Shell.tsx`) | Above each tab's title; the same strip instance across tabs, so a notice is not redrawn on a tab change |
| Session screen: focus, break, whistle, Break's over | The head of the panel, above the countdown or "Break's over" (`screens/focus/FocusScreen.tsx`, panel row 1) | Never on the stage (the kettle and Chai stay whole and still: "the stage never moves"); in the panel's flow, it scrolls with the panel at 200 %, so it can never take the scroll gesture. A new view is a new screen: notices raised by the view change (a recipe at a break's end, Next brew) are laid out with that view's first frame. While the previous view is still leaving (the summary reaching over the whole screen), the strip waits |
| Session screen: summary | The head of the summary's layer (`summaryBox`), in its safe area; it pushes the summary sheet down | Never over the card or its footer (P's `Summary.tsx` is untouched; its `data-toast-above` is inert) |
| Welcome (and the kit) | The top of the page (`app/App.tsx`) | The only in-flow place a welcome page has |

### 1.3 Queue, clock, route changes, announcing (ported from T, `pe/w2r2-toast@6f9756c`)

- **Queue:** timed with an action, then timed, then persistent; each by arrival. The persistent update prompt steps aside while a timed notice waits and returns after (it never blocks the others). No notice is dropped by the store (the base's `.slice(-3)` dropped the oldest: shown in 3.2 below); a loop guard of 40 only.
- **Clock:** a timed notice's time is spent only while it is shown: in the active strip, at least 60 % of it in view and on top (hit-tested at the middle of what is in view), the page visible, no sheet open, not under the pointer or keyboard focus. Waiting never spends it.
- **Route change:** nothing is dropped. The shown notice and the queue move to the next screen's strip, with the time each has left, and are drawn in that screen's first frame.
- **Announcer:** T's light-DOM `role="status" aria-live="polite"` element (`[data-notices-said]`), one `<p>` added per notice on arrival; showing, waiting and leaving change no live region.

### 1.4 Entering and leaving without moving a control out from under a finger (`src/ui/moment.ts`)

A strip (or an inline Undo row) changes height only at one of four moments, and otherwise waits (a notice whose time is up stays drawn until then):

1. **A screen's first frame** (and its first 350 ms): nothing on it has been aimed at yet. End → Today's "Saved …" is laid out with Today.
2. **The answer to the person's own tap** (within 600 ms): a notice their tap raised (e.g. "Brew updated" as the sheet closes), or the notice they tapped away / whose action they used.
3. **Out of view:** the strip is wholly above what the person sees of its scroller; it changes and the scroller is scrolled by the same amount in the same frame (`holdView`/`keepStill`, which also undoes any move of the browser's own scroll anchoring), so nothing in view moves at all. The notice then waits, its clock stopped, until the person scrolls back to it.
4. **At rest:** no pointer down and no input (pointer down/up, mouse move, wheel, touch, key, scroll) for 1.2 s.

A change moves content once, at once (no height animation): only the notice's face fades in (and, with motion, settles from 98 % about its own centre, never outside its box).

**Reduced motion:** the face fades in over 120 ms, nothing scales; placement, queue, clock, words, icon, amount, action and announcement are identical (proved at every size in the matrix: §4).

**Residual (stated, not hidden):** a finger already in the air when the page has been at rest for 1.2 s can meet a strip change at rest. This is the inherent limit of any in-flow notice that must eventually close; moments 1–3 cover every change the app makes as a consequence of the person's input.

### 1.5 The rest

- **W2H-D1:** H's Brew length restored (`7a961b7`/`acf1c6a` diff applied to `screens/home/**`, `tests/w2-home.spec.ts` restored, `a11y.spec.ts` line kept): in the docked start on portrait phones, heading the composer column in landscape. Plus: a landscape dock taller than 60 % of the screen (667×375 @200: 339 of 375 px, over the Brew length) stays in the page flow under the composer instead of docking (`Composer.tsx` `tall`).
- **(b) the frozen End sheet:** the sheets are rendered outside the frozen focus frame and not at all once the session has ended (T's fix, ported); `Sheet.tsx` no longer returns focus into a leaving route layer (focus lands on Today's main, as on the base, instead of being lost to `<body>`).
- **(c), (d), (e), (f):** by construction (notices are in flow; nothing can be over a sheet, nothing folds, nothing lies on the status line or takes Break's over's scroll gesture), proved control-first in §3.

## 2. Changed files

| File | Change |
|---|---|
| `src/ui/Toast.tsx` | Rewritten: the queue, the clock (runs only while shown), the light-DOM announcer (`say`), the strip registry and its controller (`decide`: the four safe moments), `<NoticeStrip/>`, `<NoticeLayer/>`; `toast.state()` for probes. All overlay placement removed |
| `src/ui/Toast.module.css` | Rewritten: in-flow strip and notice (no `position`, no z-index, no shadow), inline Undo styles |
| `src/ui/InlineUndo.tsx` (new) | The inline Undo row (announce once, clock, safe-moment exit, keyboard focus hand-over) |
| `src/ui/moment.ts` (new) | Input following and the safe moments: at rest, answering a tap, wholly above the view; `holdView` / `holdTop` / `keepStill` |
| `src/ui/Sheet.tsx` | Focus is not returned into a route layer that is leaving (it lands on the arriving screen's `main`, as on the base) |
| `src/ui/index.ts` | Exports `NoticeStrip`, `NoticeLayer`, `say`, `InlineUndo` |
| `src/app/App.tsx`, `App.module.css` | `Dissolve` marks a leaving layer (`data-route-leaving`, `NoticeLayer`); the welcome's (and kit's) strip at the top of the page |
| `src/app/Shell.tsx`, `Shell.module.css` | The tab screens' strip at the top of `main` |
| `src/app/ShellOverlays.tsx`, `src/app/debug.ts` | Comment; `__kettle.toast`, `notices()`, `noticesSaid()`, `moment()` for setup and probes |
| `src/screens/home/Composer.tsx`, `Home.module.css`, `HomeScreen.tsx` | H's Brew length (dock on portrait phones, column head in landscape, the sliding-highlight tap fix); Mark done's inline Undo; Recent opens only when the field itself takes focus; a too-tall landscape dock stays in flow; landscape Today strip at the head of the pinned column; `data-toast-above` removed |
| `src/screens/focus/FocusScreen.tsx`, `.module.css` | Panel strip (row 1) and summary strip; the strip waits while the previous view leaves; sheets outside the frozen frame; `data-toast-dock` / `data-toast-above` / `--toast-dock` removed; `data-session-controls` on the control groups (tests) |
| `src/screens/stats/History.tsx`, `stats.module.css` | History delete's inline Undo row, kept where the row was on screen |
| `src/screens/settings/DataSection.tsx`, `Settings.module.css` | Import's inline Undo in the Import row (and what Undo did); the `toast.dismiss()` before the import sheet removed (it dropped notices silently) |
| `tests/notice-strip.spec.ts` (new) | The invariant, every notice state, real input, 25 configurations |
| `tests/toast-room.spec.ts` | Rewritten for the in-flow strip, same controls (R5-D1, LEAD-D1, R7-D1, round 8) |
| `tests/w2-home.spec.ts` | H's spec, restored unchanged from `acf1c6a` |
| `tests/break-reach.spec.ts` | Frozen dates, all seven weekdays (375×667 every day; Mon/Thu/Sun at 390×844 and 844×390; `BREAK_REACH_ALL_DAYS=1` for all) |
| `tests/integrity.spec.ts`, `a11y.spec.ts`, `statusbar.spec.ts` | Real-state waits (§5); notice text queried in the page, not the announcer; the session control groups by `data-session-controls` |

Not touched: `SaveWarning*`, `src/scene/**`, `src/screens/done/**`, `src/screens/focus/stage/**`, `public/**`, `vite.config.ts`, `src/progress/badges.ts` and badge-name test strings. No HANDOFF needed.

## 3. Follow-ups, control first (raw numbers)

Every row: the control first, then the fix, same probe, same session. Probes in `T2/tools/`, raw JSON in `T2/probes/`, logs in `T2/runs/`.

### W2H-D1 (H's Brew length; Mark done after End) — control `acf1c6a` (dev :5474) vs fix (dev :5471)

`tools/endtap.mjs`, Monday frozen, real taps (End → End session), every frame for 6 s from the End session tap; Mark done tapped at +0.6 s where it is drawn; Brew length measured at rest (veteran).

| Config | Brew length at rest (all 4 in view, ≥ 24×24, 9/9) ctl → fix | Notice over a protected control (frames) ctl → fix | Dialog / `#root[inert]` frames on Today ctl → fix | Mark done at +0.6 s ctl → fix |
|---|---|---|---|---|
| 390×844 @100 | ✓ → ✓ | 24 (all 4 lengths) → **0** | 19 (last at 787 ms) → **0** | under the End sheet's header → **on top, crossed off** |
| 390×844 @200 | ✓ → ✓ | 36 (start, all lengths) → **0** | 17 → **0** | off screen → off screen (below the docked start at rest, on both) |
| 375×667 @100 | ✓ → ✓ | 29 (field, clear, all lengths) → **0** | 7 → **0** | under the old layer → under the docked start (at rest: 488–532 vs dock top 439, with or without a notice) |
| 375×667 @200 light / dark | ✓ → ✓ | 37 / 36 → **0 / 0** | 18 / 13 → **0 / 0** | off screen → off screen |
| 844×390 @100 | ✓ → ✓ | 167 (field) → **0** | 11 → **0** | on top, crossed off → **on top, crossed off** (a notice up: Mark done stays at 184–228; dock top 290) |
| 844×390 @200 | ✓ → ✓ | 203 (start, all lengths) → **0** | 15 → **0** | off screen → off screen |
| 667×375 @100 | ✓ → ✓ | 36 (Mark done, start, field) → **0** | 14 → **0** | under a notice / the dialog → under the docked start (H's layout, at rest) |
| 667×375 @200 | **✗ (0/9: the dock, 339 of 375 px, over every length)** → **✓ 9/9** | 35 → **0** | 23 → **0** | absent → absent (probe could not type the task at this size on either) |

Where Mark done is not on screen at rest (200 %, and the two shortest phones at 100 %, where H's dock sits over it), a real scroll brings it on top and a real tap crosses it off; its Undo is then drawn where Mark done was (≤ 2 px) with 9/9 points: the invariant spec does exactly this at every one of the 25 configurations (§4).

### (b) the frozen End sheet — control `61aba17`/`acf1c6a` vs fix

Above: 7–23 frames with a dialog or `#root[inert]` on Today, up to 826 ms after End, on the control; **0 at every configuration** on the fix. Focus after End: base `MAIN`, fix before the `Sheet.tsx` change `BODY` (lost with the leaving layer), fix now `MAIN`.

### (c) notices over the Ambience sheet, 844×390 @200 — base `61aba17` (:5470) vs fix (:5471)

`tools/follow.mjs --case ambience`: three notices on a running brew, Ambience opened by a real tap, every frame for 2 s: base **360 of 360** notice-frames drawn over the sheet (on top at their own middle while the dialog is up); fix **0 of 122** (the strip is in the page under the sheet; its clock stands still). Sheet controls on top: both. (`probes/ambience-{base,fix}.json`)

### (d) folded notices — base vs fix, 667×375 @200

`--case fold` (3 notices on a running brew) and `--case foldover` (Break's over scrolled to its end): **the fold did not reproduce on `61aba17`** in these runs (the docked stack fit the stage column: 16–364 of 375). With four notices (`--case fold --n 4`), the base drew three and **dropped "Recipe done: Take 2 full tea breaks · +15 leaves"** (its store keeps the newest three): a fact and a reward amount lost. Fix: all **4 of 4 shown in turn, each with its icon, its full text, no clipping, in view** (`probes/fold4-*.json`). The fold code is gone; a notice wraps, never folds.

### (e) Next brew: a recipe notice over the running status line — base vs fix, 390×844 @100

`--case nextbrew` (Settings › Next brew on, recipe day, the next brew starts by itself), every frame for 4.5 s: base **428 frames of a notice over the readout** (status line "Whistles at …", the countdown's spoken text, "25 minutes left") **and 9 over the break's controls** in 214 notice frames; fix **0 and 0** in 202 notice frames (the notice heads the panel; the readout is pushed down with it, in the first frame of the new brew).

### (f) `break-reach.spec.ts:179` on recipe days — base vs fix, frozen dates

Same spec (frozen dates, real wheel / touch / Tab) on the base (`runs/break-reach179-base-61aba17.log`):

| | Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|---|---|---|---|---|---|---|---|
| base 375×667 light | **✗** | ✓ | ✓ | **✗** | ✓ | ✓ | ✓ |
| base 390×844 dark | **✗** | | | **✗** | | | ✗ |
| base 844×390 light | ✓ | | | ✓ | | | ✓ |
| fix (all three sizes) | ✓ all 13 (375×667 Mon–Sun, 390×844 dark Mon/Thu/Sun, 844×390 light Mon/Thu/Sun) in the final suite run | | | | | | |

The base's failure: "Put the kettle on" never brought wholly into view by the wheel (centre y 730 of 667 / 838 of 844) — the "Recipe done" notice over the panel took the gesture.

### R5-D1, LEAD-D1, R7-D1 — each control revision runs the spec of the revision that fixed it (`tools/controls.sh`, dev :5474)

| Control | Spec (from) | Test | Result on the control |
|---|---|---|---|
| R5-D1 `20671eb` | `e866118` | "an older toast timing out after the list was scrolled never moves the warning out of its room" | **2 of 2 failed**: "times the warning left the page since End: 1" (light, dark) |
| LEAD-D1 `e866118` | `b39202f` | "toasts timing out, and an endless action toast, never move the banner" | **2 of 2 failed**: no in-page banner (the warning is still a toast there) |
| R7-D1 `b39202f` | `61aba17` | "the update prompt and every toast stay whole and tappable … Break's over scrolled to its end" | **2 of 2 failed**: the update prompt not whole (52 of 97 px), Update not on top, over the top bar's words |
| fix | this branch's `toast-room.spec.ts` (same shapes, in-flow strip) | all 14 | **14 / 14 passed** (final suite run; the same shapes: banner never removed, never faded, Save backup inside, never moved on screen by layout within 1.15 s of input; three notices never over Close or a Break's over control, Close reached; the update prompt and each notice in turn whole with its action on top, Undo and Update reached by real click / tap) |

D4 (round 4, "a toast never covers the break-over controls, carried task included"): `a11y.spec.ts` 375×667 and 390×844 4 / 4 passed in the final run (the break-over controls, carried task included, and the session controls and summary footer, with 1 and 2 notices raised).

## 4. The invariant matrix

`tests/notice-strip.spec.ts` (new), final run inside the full chromium suite on `61b463c` (`T2/runs/chromium-final.{log,json}`): **25 of 25 passed, 0 overlaps in every configuration** (5 sizes × light/dark × 100/200 %, plus reduced motion at 200 % light for every size; `NOTICE_REDUCED_ALL=1` runs reduced motion at all 20).

How it measures (every animation frame of the whole test): every drawn notice (`[data-notice-strip] li` and every inline Undo row) against every other drawn control (all interactive roles and the tab order), every element carrying text of its own, and every list row; both boxes clipped by every clipping ancestor and the viewport; an overlap > 0.5 px each way is a hit. Not counted: a leaving route layer (under the arriving one's opaque paper), inert subtrees, 1 px sr-only text; frames with a sheet open are counted apart (the sheet is drawn over the whole page, the notice included, and its clock stands still); and an in-flow notice scrolling under fixed or sticky chrome (tab bar, docked start) is counted apart — it is the page's own content passing under chrome, as every row does, never a notice over anything.

States walked with real taps / wheel / keyboard per configuration (11 notice states drawn and checked in every one): Today right after End ("Saved 3 minutes of focus", Mark done tapped as soon as it can be: its Undo drawn where Mark done was, ≤ 2 px, 9/9 points, ≥ 24×24, then Undo tapped: the task is back); the summary with a notice; the tea break (the summary's notice carried over: nothing dropped on a view change); Break's over on Monday ("Recipe done" in the panel's strip), the panel wheeled to its end and back, "Put the kettle on" tapped; a running brew with a notice; Stats with "Brew updated" and the page wheeled; History delete (the row's Undo in place on screen, Undo tapped: the row is back, same name); Settings and Nook with a notice, wheeled; the welcome with a notice.

| Configuration | Result | Notice frames checked (app / welcome) | Overlap hits | Frames under a sheet (not counted) | In-flow notice under fixed chrome while scrolling (counted apart) | Notice states drawn and checked | Mark done tap | History Undo (row → Undo, on screen) | Keyboard / synthetic fallbacks |
|---|---|---|---|---|---|---|---|---|---|
| 390×844 light 100 % | passed | 1663 / 63 | 0 | 23 | 240 | 11 | +1352 ms, Undo 9/9 43×44 | 723 → 723 | — |
| 390×844 light 200 % | passed | 1789 / 64 | 0 | 23 | 168 | 11 | +3162 ms, Undo 9/9 80×44 | 654 → 654 | — |
| 390×844 light 200 % reduced motion | passed | 1785 / 63 | 0 | 12 | 72 | 11 | +2690 ms, Undo 9/9 80×44 | 654 → 654 | — |
| 390×844 dark 100 % | passed | 1719 / 62 | 0 | 27 | 168 | 11 | +833 ms, Undo 9/9 43×44 | 723 → 723 | — |
| 390×844 dark 200 % | passed | 1805 / 64 | 0 | 25 | 128 | 11 | +2879 ms, Undo 9/9 80×44 | 654 → 654 | — |
| 375×667 light 100 % | passed | 1703 / 63 | 0 | 24 | 192 | 11 | +1265 ms, Undo 9/9 43×44 | 543 → 543 | — |
| 375×667 light 200 % | passed | 1855 / 61 | 0 | 24 | 496 | 11 | +3129 ms, Undo 9/9 80×44 | 489 → 489 | UNREACHABLE by pointer and Tab (pre-exis |
| 375×667 light 200 % reduced motion | passed | 1843 / 61 | 0 | 8 | 80 | 11 | +2934 ms, Undo 9/9 80×44 | 489 → 489 | UNREACHABLE by pointer and Tab (pre-exis |
| 375×667 dark 100 % | passed | 1704 / 63 | 0 | 27 | 176 | 11 | +1446 ms, Undo 9/9 43×44 | 543 → 543 | — |
| 375×667 dark 200 % | passed | 1864 / 61 | 0 | 28 | 528 | 11 | +3175 ms, Undo 9/9 80×44 | 489 → 489 | UNREACHABLE by pointer and Tab (pre-exis |
| 844×390 light 100 % | passed | 1734 / 62 | 0 | 24 | 0 | 11 | +822 ms, Undo 9/9 43×44 | 267 → 267 | — |
| 844×390 light 200 % | passed | 1750 / 56 | 0 | 17 | 0 | 11 | +1692 ms, Undo 9/9 80×44 | 170 → 170 | — |
| 844×390 light 200 % reduced motion | passed | 1797 / 55 | 0 | 18 | 0 | 11 | +2227 ms, Undo 9/9 80×44 | 170 → 170 | — |
| 844×390 dark 100 % | passed | 1713 / 60 | 0 | 17 | 0 | 11 | +1034 ms, Undo 9/9 43×44 | 267 → 267 | — |
| 844×390 dark 200 % | passed | 1782 / 54 | 0 | 23 | 0 | 11 | +2042 ms, Undo 9/9 80×44 | 170 → 170 | — |
| 667×375 light 100 % | passed | 1722 / 62 | 0 | 23 | 0 | 11 | +1243 ms, Undo 9/9 43×44 | 272 → 272 | — |
| 667×375 light 200 % | passed | 1780 / 54 | 0 | 28 | 0 | 11 | +1173 ms, Undo 9/9 80×44 | 219 → 219 | — |
| 667×375 light 200 % reduced motion | passed | 1766 / 54 | 0 | 12 | 0 | 11 | +1070 ms, Undo 9/9 80×44 | 219 → 219 | — |
| 667×375 dark 100 % | passed | 1705 / 60 | 0 | 25 | 0 | 11 | +1162 ms, Undo 9/9 43×44 | 272 → 272 | — |
| 667×375 dark 200 % | passed | 1752 / 54 | 0 | 22 | 0 | 11 | +1108 ms, Undo 9/9 80×44 | 219 → 219 | — |
| 1440×900 light 100 % | passed | 1687 / 64 | 0 | 51 | 0 | 11 | +1241 ms, Undo 9/9 43×44 | 826 → 826 | — |
| 1440×900 light 200 % | passed | 1751 / 151 | 0 | 39 | 0 | 11 | +2306 ms, Undo 9/9 80×44 | 730 → 730 | — |
| 1440×900 light 200 % reduced motion | passed | 1776 / 52 | 0 | 39 | 0 | 11 | +3547 ms, Undo 9/9 80×44 | 730 → 730 | — |
| 1440×900 dark 100 % | passed | 1722 / 68 | 0 | 18 | 0 | 11 | +1172 ms, Undo 9/9 43×44 | 826 → 826 | — |
| 1440×900 dark 200 % | passed | 1810 / 72 | 0 | 41 | 0 | 11 | +2563 ms, Undo 9/9 80×44 | 730 → 730 | — |

Earlier full runs on this branch: `T2/runs/chromium-full.log` (`a0fd8d8`): 25/25 at first except 1440×900 @200 light-reduced and dark (Mark done's real click did not register under 2-worker load plus captures; 7 of 8 targeted reruns passed: `runs/a11y109-and-1440-200-x2.log`, `runs/diag-1440-200.log`): see §7.4.

## 5. Suites

All on the final code `61b463c` (kettle/src `5aa6228`), dev :5471, unless stated.

| Suite | Result | Log |
|---|---|---|
| `tsc --noEmit` | **0 errors** | `runs/tsc.log` |
| `vitest run` | **289 / 289** (30 files) | `runs/vitest.log` |
| Playwright chromium, all specs, `--workers=2` (slot gate `--n 2`) | **166 / 167 passed**, 0 skipped. The one failure: `chai3d.spec.ts:98` (3D Chai slow network; `src/scene/**`, not touched here) — rerun alone **2/2 on the fix and 2/2 on the base** (`runs/chai3d98-{5471,5470}.log`): load timing in the scene's 8 s give-up, not this change | `runs/chromium-final.{log,json}` |
| timer-harness + timer-app + pwa (`KETTLE_PWA_PORT=5484`) | **29 passed, 2 skipped by design** (`timer.spec.ts:294` keyboard-shortcut infra and `:438` rendering budget, skipped in the timer-app project as on the base) | `runs/timer-pwa.log` |

Per spec in the final run (from the JSON): `notice-strip` 25/25, `toast-room` 14/14, `break-reach` 17/17 (`:179` all seven weekdays at 375×667, Mon/Thu/Sun at 390×844 and 844×390, plus the four others), `integrity` 25/25, `a11y` 11/11, `statusbar` 9/9, `w2-home` 18/18 (H's spec, restored), `w2-summary` 18/18, `w2-room` 7/7, `w2-firstvisit` 6/6, `whistle` 8/8, `chai3d` 8/9.

**Timing flakes made deterministic by waiting on real state (no assertion weakened):**
- `integrity.spec.ts:1090` (all three sizes): waits until End's own notice has gone or waits in a strip above the view (`__kettle.notices()` and the strip's box), before the banner part; text queried in the page, not in the announcer. Found on the way and fixed in the app: a notice scrolled a few px off the top never spent its time (the clock now needs 60 % of it in view). 3/3 at 1440 (`runs/flakes-x3.log`), 3 sizes passing in the final run.
- `integrity.spec.ts:1004` @1440: 3/3 here and in the final run; the old flake's cause is not established (§7.3).
- `statusbar.spec.ts:106`: waits for `nav[aria-label="Your progress"]` to be drawn and for the new leaf total to be in the store (R8-F5's cause: Today not yet rendered under load). Dark 3/3 (`runs/flakes-x3.log`).
- `a11y.spec.ts:109`: waits until no route layer is leaving (`[data-route-leaving]`) before each probe (N's cause: the outgoing Nook's controls still in the page). 2/2 under 2-worker load (`runs/a11y109-and-1440-200-x2.log`) and in the final run.
- `break-reach.spec.ts`: dates frozen (`page.clock.install` + `resume`), seven weekdays.
- `toast-room.spec.ts`: the touch run scrolls back until the page is at its top (a fling can overshoot), then waits for the queue to empty (real state).

## 6. Captures

Same session (22:00–22:30 UTC), Monday 07:40 UTC frozen, base **production preview :5480** (`61aba17`) and fix **production preview :5481** (`/tmp/rv7-servers/dist-w4t2`, built from kettle/src `dd1a629` = `a0fd8d8`; the final code differs only in the clock's visibility threshold in `Toast.tsx` `seenNow`, which changes no frame captured here), `animations: 'disabled'`, full size (DPR 2 on phones). `T2/shots/before/<cfg>/` and `T2/shots/after/<cfg>/`, each with `meta.json` (notices with boxes, inline Undo rows, covered controls, dialogs).

- Configurations: 390×844 light @100, 390×844 dark @200, 375×667 dark @200, 844×390 light @200, 667×375 light @200, 1440×900 light @100; reduced motion: 390×844 light @100 (`shots/{before,after}-reduced/`, End and Break's over).
- States (`tools/capture.mjs`, the orchestrator's `r2before.mjs` plus a reduced-motion switch): 01 Today at rest (Brew length), 02 End sheet, 03 Today 0.6 / 1.5 / 3.2 / 6.0 s after End, 04 summary task day (+ settled, full), 05 break, 06 Break's over 0.6 / 1.5 / 3.2 s and full (Monday: "Recipe done"), 08 summary routine day, 09 summary big day.
- Undo surfaces and tab strips (`tools/states.mjs`): 11 Mark done tapped (base: floating toast; fix: the line), 12 History delete confirmed (base: toast; fix: the row in place), 13 Settings import (base: toast; fix: the Import row), 14 Stats "Brew updated" (base: toast; fix: the strip, above the view there, waiting).

Frames opened (full size) and what they show: `after/390x844-light-t100/03-today-after-end-0.6s.png` (notice heads Today; Mark done, field, Brew length clear), `06-break-over-0.6s.png` (recipe notice heads the panel; stage untouched), `11-mark-done-undo.png`, `12-history-delete-undo.png`, `13-import-undo.png`; `after/375x667-dark-t200/03-today-after-end-0.6s.png` (notice at the top; H's dock with the lengths); `after/844x390-light-t200/06-break-over-0.6s.png` (notice heads the panel column, whole: icon, all four lines, "+10 leaves").

**REFERENCE → BEFORE → AFTER** (`T2/triples/`):
- **K01 Today:** `K01-1-REFERENCE-01-home.png` → `K01-2-BEFORE-61aba17.png` → `K01-3-AFTER.png`. The one visible change at rest is H's (W2H-D1): on portrait phones the Brew length rides in the docked start, every length in view from the first frame; no notice is up at rest, so nothing else differs.
- **K02 summary:** `K02-1-REFERENCE-07-summary.png` → `K02-2-BEFORE-61aba17-{task,routine}.png` → `K02-3-AFTER-{task,routine}.png`. Identical apart from the 3D room's fairy lights (scene timing, not this change): no notice arrives with a finished brew, the empty summary strip takes no room, Chai and the kettle are whole.

## 7. Findings outside this item (not fixed: not authorised)

1. **Delete confirmation unreachable at 375×667 @200 (pre-existing on `61aba17`, measured on both):** the "Delete this brew?" dialog's footer runs past its own box (Delete at 641–698 in a dialog ending at 643) with nothing to scroll, and its focus trap cycles on "Keep it" only, so neither a tap nor Tab reaches Delete. The invariant spec reaches it by a synthetic click there (recorded per run as `keyboardFallbacks`). Owner: `ui/Sheet.tsx` dialog variant (a follow-up, not authorised here).
2. **Mark done below the docked start at rest on the shortest phones at 100 % (375×667, 667×375) and everywhere at 200 %**, on H's layout as on its control `acf1c6a`, with or without a notice: a short scroll is needed before the +0.6 s tap is possible. Not caused by notices (measured: 488–532 vs dock top 439 at 375×667 @100 with none up).
3. **`integrity.spec.ts:1004` @1440 ("banner still present 6 s after room was freed")**: 3 of 3 passes here; the cause is not established (it is not notice-related: the banner's recovery waits for every failed key to be saved again; which key lags at 1440 under load is open).
4. **Intermittent under heavy load at 1440×900 @200 (invariant spec):** in the first full run on `a0fd8d8` (2 workers plus the capture job), the real click on Mark done did not register in 2 of the 4 configurations there, so those runs stopped before their invariant result. Then: 7 of 8 targeted reruns passed, 4 of 4 with diagnostics passed, and the final full run passed 25 of 25. No overlap was recorded in any run. The cause is not established. The spec now records every pointerdown and click target from the tap onwards, so a recurrence will show where the click went.
5. "Next: brew 2 of 4" is cut by Close in the landscape session top bar at 200 % (base too; top bar not changed here).
