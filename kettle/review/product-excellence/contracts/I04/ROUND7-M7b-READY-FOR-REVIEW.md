# I04 round 7 · M7b — every break and Break's over control reachable at 200 % text · READY FOR REVIEW

- **Maker:** M7b · branch `pe/r7-break` · worktree `/home/user/wt/r7b/kettle` · base `51521cf` (round 6 combined fix).
- **Defect fixed:** round-6 follow-up 12 (L2 receipt "Issue 2"; `CHECKER-integration-fix-r6.md` residual 12). Pre-existing on
  INT `0d58c5e`, identical on round 6.
- **Proposed state:** **FIXED** (for the states and sizes below; limits in (f)).
- I submit READY FOR REVIEW only. I do not approve my own work.

## (a) Hashes

| | Value |
|---|---|
| Revision | the commit that adds this file (message `I04 ROUND 7 READY FOR REVIEW (break reach): …`) |
| Code commit | `886acd7` (`886acd764e01cd6b92d16641f1dfdf164abc753a`): the 3 source files and the new spec |
| `git rev-parse <rev>:kettle/src` | `ba4707cfff01e234f6a31b3be7e9e999db256c13`, identical for `886acd7` and the final commit (the final commit adds only this packet and evidence) |
| Base `51521cf:kettle/src` | `05bb3f827117545cbbc9f212e0a5f7332490092c` |
| INT control | `0d58c5e` at http://127.0.0.1:5303 (orchestrator-owned; never stopped) |

The bound runs used my servers on 5207 (probe, captures) and 5227 (Playwright). Neither has a file watcher, so I
restarted both after the last source edit, at 00:55:22 UTC (the edit, `RoundButton.module.css`, was at 00:55:22.49).
`curl` of the served modules showed the final rules on both (`text-wrap: balance`; the `--scrim` 18 px shade), so
both served tree `ba4707c`. Before that, the code commit was amended twice (not pushed; the hashes no longer exist on
the branch):
- `9623a66` (tree `9f06a48`): a fainter cue (`--scrim` at 70 %, 14/16 px) and no caption wrap.
- `1575b3b` (tree `08f8a40`): no caption wrap.

Runs on those trees are marked as such in (c) and (d). Every result reported for this revision is from `ba4707c`.

## (b) Changed files, cause and design notes

### Verified first (code reading and a real run on INT, before any change)

- The session screen (`#/focus`, `#/done`) is **not** inside the Shell: it is its own route layer (`src/app/App.tsx`,
  `layerKey === 'session'`). The Shell's scroll container is not involved, so I did not touch `src/app/Shell*`.
- `.screen` in `src/screens/focus/FocusScreen.module.css` is a `100dvh` grid with `overflow: hidden`: row 1 is the
  stage (room, counter, kettle, Chai), row 2 the panel (`minmax(0, 1fr)`). The panel is `display: grid` with one
  implicit row, and its child (`.timer`: countdown + controls; `.over`: Break's over) had no scroll container. At
  200 % text that child is taller than the panel, so the overflow was simply clipped by `.screen`.
- Measured on INT with `probe/explore.mjs` (setup by the debug API, layout read only): 375×667 @200 %, paused
  break panel 354 px tall, content 516 px, "Resume break" centre y 706; Break's over with a carried task content
  590 px, "Put the kettle on" 730 and "That's all for now" 840; document 0/0. 844×390: break panel 236 px, content
  319; Break's over panel 315 px, content 653; "Resume break" 428, "Mark it done" 430, "Put the kettle on" 548.
  These are L2's numbers exactly.
- Side finding (INT): Tab **does** move focus to the cut-off controls on INT, because focusing them scrolls the
  `overflow: hidden` `.screen` programmatically (by the clipped overflow). That pushes the top bar off the screen,
  and no wheel or drag can scroll it back. Only Shift+Tab to the top bar does. A trial run of my probe with the keyboard
  first showed this: on INT, after the Tab pass, "Ambience" in the paused break at 375×667 was unreachable by wheel
  and touch. The final probe therefore runs the keyboard last (see (c)).

### Changed files (`git diff 51521cf 886acd7 --stat`: 4 files, +295 −4)

| File | Change |
|---|---|
| `src/screens/focus/FocusScreen.module.css` (+16) | New rule `.panel:has(> .timer, > .over)`: `overflow: hidden auto; overscroll-behavior: contain;` plus a two-layer background, the bottom-edge scroll cue |
| `src/screens/focus/FocusScreen.tsx` (+35 −3) | `panelRef` on `<main className={s.panel}>`. `toggle()` notes where the Pause/Resume control is, and a layout effect on `paused` scrolls the panel by the control's shift so it stays where it was pressed. `AnimatePresence onExitComplete` puts a new panel view at its top. Helper `shownTop()` |
| `src/screens/focus/parts/RoundButton.module.css` (+5 −1) | `.caption`: `white-space: nowrap` → `text-align: center; text-wrap: balance` |
| `tests/break-reach.spec.ts` (new, 239) | See (d) |

### Design

1. **The panel is the scroll container, and only for the countdown and Break's over.** The rule uses
   `.panel:has(> .timer, > .over)`, so it never applies while the panel holds the summary. The summary's sheet is
   absolutely positioned and reaches up over the stage (`.summaryBox { inset: calc(-1 * var(--stage-h)) 0 0 }`), and a
   scrolling panel would clip it. With `AnimatePresence mode="wait"`, the break's `.timer` mounts only after the summary
   has finished leaving, so the summary is never clipped, not even during its exit. When everything fits, nothing
   scrolls, and the layout is unchanged:
   - the implicit row still stretches to the panel (`align-content: normal`);
   - `.timer`'s `justify-content: safe center` and `.over`'s `align-content: center` centre exactly as before.

   At 200 % the row grows to its content and the panel scrolls. The stage, the room and the counter never move: the
   scroll lives entirely below the counter, in the solid `--bg` panel, so the literal countdown stays on a solid
   surface. `overflow-x` is `hidden`, so a long line never makes the panel scroll sideways. `overscroll-behavior:
   contain` keeps a fling at either end from chaining to the page (no pull-to-refresh).
2. **Keyboard.** The scroll container is an ancestor of every panel control, so the browser scrolls a focused control
   into view by itself. The tab order is unchanged:
   - break: Skip break → Pause/Resume break → Start next brew → top bar;
   - Break's over: Mark it done → Put the kettle on → That's all for now → Close.

   Because the overflow is now inside the panel, `.screen` has nothing to scroll. Focus can no longer push the top bar
   off the screen, as it did on INT.
3. **Discoverability.** At 375×667 Break's over shows "Mark it done, start fresh" whole, with a gap below it. Nothing
   was cut at the edge, so nothing said there was more. So while more lies below, the bottom edge carries a soft shade:
   - It is a `radial-gradient` of `--scrim` (theme-aware), 18 px, `background-attachment: scroll`, so it is fixed to
     the panel's bottom.
   - A 20 px band of `--bg` with `background-attachment: local` sits at the very end of the content and covers the
     shade once the end is reached.
   - Where nothing scrolls, the band covers the shade, painting `--bg` on `--bg`. So it is invisible at 100 %.

   No JS and no animation. The shade is painted behind content, so it never dims a control.
4. **Pause keeps Resume under the finger.** Pausing adds lines above the controls: the "Paused" flag, and the status
   "Paused. The tea will keep." wraps to two lines at 200 %. At 375×667 that moved the control from y 645 (Pause) to
   706 (Resume), below the edge. Tapping Pause made Resume vanish.
   - `toggle()` records the control's top if any of it is visible in the panel.
   - A layout effect on `paused` adds the control's shift to `panel.scrollTop`, as native scroll anchoring would.
     Native scroll anchoring does not act at scroll offset 0.
   - The effect is a no-op when the panel cannot scroll (100 %) and when the control was scrolled out of sight (a Space
     press while reading the countdown at the top does not scroll the countdown away).
   - It applies to the brew's Pause/Resume too (the same `mainRef`).
   - Measured: Pause 645 → Resume 645 at 375×667, 774 → 773 at 390×844, and 343 → 345 at 844×390.
5. **A new view starts at its top.** Break → Break's over → next brew reuse one scrolling panel, so the panel's offset
   would otherwise carry over. `onExitComplete` resets it between the old view leaving and the new one mounting.
6. **Captions wrap instead of running off the screen.**
   - Once the controls row was reachable at 200 %, it showed a pre-existing clip. The three captions are
     `nowrap`, and at 200 % they are wider than a phone, so "Skip break" and "Next brew" ran past both screen edges
     ("kip break", "Next bre"). INT 390×844 @200 % shows exactly the same clip in its BEFORE capture.
   - A caption now wraps between its words ("Skip / break", "Next / brew") when the row is too narrow for it. A flex
     item shrinks only when the row overflows, so at 100 % every caption stays on one line.
   - In landscape phones the captions are hidden (an existing rule), so nothing changes there.
7. **Toasts (round 6 D4) unchanged.** `[data-toast-above]` stays on `.controls` and on the whole `.overDock`, and
   `toastLiftBottom()` measures their on-screen boxes every 250 ms. So when the panel is scrolled, the toasts float
   above wherever the group now is. See the toast check in (c).

### References opened

- K04 `VISUAL_BENCHMARK_LIBRARY/assets/current/whistle-to-summary-phone-dark-reduced-motion-frames.jpg` (opened). The
  brief's path under `assets/current/recordings/` holds only the `.mp4`; the frames image is one level up. It
  shows the room and counter fixed on top, the countdown on the solid panel below, the blue rest countdown on the
  break, and the controls row Skip break / Pause / Next brew with the dots.
  - **Transfers:** the stage is never moved or resized; the scroll is confined to the solid panel under the counter;
    the controls row, the dots and the blue/orange tones are untouched.
  - **Not copied / not changed:** nothing at 100 % text (no new chrome, no sticky footer for the break, no
    re-ordering). I chose a scrolling panel over a sticky action bar. At 375×667 @200 % Break's over's action group is
    326 px tall in a 354 px panel: pinned, it would hide the title and question.
- PRESERVE_LIST read. Items touched:
  - 4: room/counter continuous; literal countdown on a solid surface. Both kept.
  - 6: working controls. All reachable; Pause/Resume semantics unchanged.
  - 7: the summary footer is untouched; the rule excludes the summary.
  - 1: orange focus / blue rest. No colour changes.

## (c) Probe runs

### Probe

- **Probe:** `integration-fix/r7/M7b/probe/reach.mjs`, sha256 `9d8ef06e9f1e4c7a94f53962c512a5b647238397fe952cd8d8f1c11d41a4fcfe`
  (`probe/SHA256SUMS.txt` lists every script used, plus the spec). Written for this task rather than adapted from
  L2's `ctl.mjs`, which reaches controls only as a step toward its toast checks. Same conventions as L2's `lib.mjs`:
  - SwiftShader Chromium;
  - phones `isMobile` + `hasTouch`, DPR 2;
  - `html{font-size:200%!important}` injected at DOMContentLoaded;
  - the newbie seed;
  - setup by the debug API.
- **Run:** `node reach.mjs <base> <rev> <out> <WxH> light,dark 200`, through `slots.py --lane M7b --n 1`.
- **Fresh contexts.** Every state is a fresh browser context (a new disposable in-memory profile). The probe sets
  the state up as follows:
  - Seed, start a brew (with the task "Chapter 3 notes", or with none for `over-plain`), `nearEnd` + `finish`.
  - **Tea time by a real tap** at its box centre.
  - `paused`: `timer.pause()` by the debug API, so the paused state opens at the panel's top. That is the worst case,
    with no help from the tap anchoring.
  - Break's over: `finish()`.
- **Real input only.** `page.mouse.wheel` (100 px notches over the panel's visible centre), CDP
  `Input.dispatchTouchEvent` drags (start 12 px inside the panel's visible edge, up to 160 px, 8 px per 16 ms step,
  450 ms settle), and `page.keyboard` Tab / Shift+Tab. There are no scrolling calls or writes:
  `grep -nE "scrollIntoView\(|scrollTo\(|scrollBy\(|scrollTop *[-+]?= " probe/reach.mjs probe/capture.mjs
  probe/toastcheck.mjs tests/break-reach.spec.ts` finds nothing (exit 1). The only mentions of those names are
  header comments and read-only `scrollTop` reads for the scroller report. The probe reads layout only.
- **Reached.** A control counts as reached by a method when, after that input, two things hold:
  - its whole box lies inside the visible part of the screen (the viewport intersected with every clipping ancestor);
  - `elementFromPoint` at its centre hits it.
- **Per method:**
  - Wheel and touch: move toward each control in order, then in reverse order, until it is reached or 3 steps in a
    row move nothing. Both directions must reach every control.
  - Keyboard: Tab through the screen. Each control, when focused, must be in view. Then Shift+Tab back, with the
    same check.
  - Methods run in the order wheel → touch → keyboard (see "Side finding" in (b): on INT, keyboard focus scrolls the
    `overflow: hidden` screen, which no pointer input can undo).
- **States:**
  - `break` (running): Ambience, Mute, Skip break, Pause break, Start next brew.
  - `paused`: Ambience, Mute, Skip break, Resume break, Start next brew.
  - `over-carried`: Close, Mark it done, Put the kettle on, That's all for now.
  - `over-plain`: Close, Put the kettle on, That's all for now.
  - Plus a fifth, `tap`: the break as it opens. A real tap on "Pause break" must leave "Resume break" hit-testable,
    and a tap on that must leave "Pause break" hit-testable.

### The probe reproduces the defect on INT first

On INT at 375×667 @200 %, the probe's first state-open readings match L2 exactly:
- "Resume break" at centre y 706 in the paused break;
- "Put the kettle on" 730 and "That's all for now" 840 in Break's over with a carried task;
- the scroller chain is `doc 0/0` only.

At 390×844: "That's all for now" 927. At 844×390: "Resume break" 428, "Mark it done" 430, "Put the kettle on" 548.
Every one of those is reported **unreached by wheel and by touch** on INT. So its zeros on this revision count.

### Results per configuration (3 phone sizes × 2 themes × 5 states, 200 % text)

Two full runs per revision, each on fresh contexts: 30 configurations × 2 runs = 60 runs each. This revision ran on
`ba4707c` (`probe-runs/final-ba4707c/`: `M7b-reach.jsonl`, `M7b-reach-run2.jsonl`), INT on `0d58c5e`
(`probe-runs/INT-0d58c5e/`). The fourth column gives INT's centre y for each control not wholly in view as the
state opens. For `tap` it gives where Resume lands after the tap: on INT it moves below the edge, while this revision
keeps it in place (375×667: 645 → 645; 390×844: 774 → 773; 844×390: 343 → 345). Failing control/method pairs are
listed for INT; this revision has none.

| Size | Theme | State | Not wholly in view as the state opens (centre y; INT) | M7b runs / failing | INT runs / failing | INT failing control/method |
|---|---|---|---|---|---|---|
| 375x667 | dark | break | Skip break 637, Pause break 645, Start next brew 637 | 2 / 0 | 2 / 2 | Skip/wheel, Skip/touch, Pause/wheel, Pause/touch, Next/wheel, Next/touch |
| 375x667 | dark | paused | Skip break 698, Resume break 706, Start next brew 698 | 2 / 0 | 2 / 2 | Skip/wheel, Skip/touch, Resume/wheel, Resume/touch, Next/wheel, Next/touch |
| 375x667 | dark | over-carried | Put the kettle on 730, That's all for now 840 | 2 / 0 | 2 / 2 | Put/wheel, Put/touch, All for now/wheel, All for now/touch |
| 375x667 | dark | over-plain | That's all for now 685 | 2 / 0 | 2 / 2 | All for now/wheel, All for now/touch |
| 375x667 | dark | tap | Pause 645 → Resume 706 | 2 / 0 | 2 / 2 | Resume in view after the tap, Pause in view after the tap |
| 375x667 | light | break | Skip break 637, Pause break 645, Start next brew 637 | 2 / 0 | 2 / 2 | Skip/wheel, Skip/touch, Pause/wheel, Pause/touch, Next/wheel, Next/touch |
| 375x667 | light | paused | Skip break 698, Resume break 706, Start next brew 698 | 2 / 0 | 2 / 2 | Skip/wheel, Skip/touch, Resume/wheel, Resume/touch, Next/wheel, Next/touch |
| 375x667 | light | over-carried | Put the kettle on 730, That's all for now 840 | 2 / 0 | 2 / 2 | Put/wheel, Put/touch, All for now/wheel, All for now/touch |
| 375x667 | light | over-plain | That's all for now 685 | 2 / 0 | 2 / 2 | All for now/wheel, All for now/touch |
| 375x667 | light | tap | Pause 645 → Resume 706 | 2 / 0 | 2 / 2 | Resume in view after the tap, Pause in view after the tap |
| 390x844 | dark | break | all in view | 2 / 0 | 2 / 0 | — |
| 390x844 | dark | paused | Skip break 822, Resume break 830, Start next brew 822 | 2 / 0 | 2 / 2 | Skip/wheel, Skip/touch, Resume/wheel, Resume/touch, Next/wheel, Next/touch |
| 390x844 | dark | over-carried | Put the kettle on 838, That's all for now 927 | 2 / 0 | 2 / 2 | Put/wheel, Put/touch, All for now/wheel, All for now/touch |
| 390x844 | dark | over-plain | all in view | 2 / 0 | 2 / 0 | — |
| 390x844 | dark | tap | Pause 774 → Resume 830 | 2 / 0 | 2 / 0 | — |
| 390x844 | light | break | all in view | 2 / 0 | 2 / 0 | — |
| 390x844 | light | paused | Skip break 822, Resume break 830, Start next brew 822 | 2 / 0 | 2 / 2 | Skip/wheel, Skip/touch, Resume/wheel, Resume/touch, Next/wheel, Next/touch |
| 390x844 | light | over-carried | Put the kettle on 838, That's all for now 927 | 2 / 0 | 2 / 2 | Put/wheel, Put/touch, All for now/wheel, All for now/touch |
| 390x844 | light | over-plain | all in view | 2 / 0 | 2 / 0 | — |
| 390x844 | light | tap | Pause 774 → Resume 830 | 2 / 0 | 2 / 0 | — |
| 844x390 | dark | break | all in view | 2 / 0 | 2 / 0 | — |
| 844x390 | dark | paused | Skip break 421, Resume break 428, Start next brew 421 | 2 / 0 | 2 / 2 | Skip/wheel, Skip/touch, Resume/wheel, Resume/touch, Next/wheel, Next/touch |
| 844x390 | dark | over-carried | Mark it done 430, Put the kettle on 548, That's all for now 658 | 2 / 0 | 2 / 2 | Mark/wheel, Mark/touch, Put/wheel, Put/touch, All for now/wheel, All for now/touch |
| 844x390 | dark | over-plain | Put the kettle on 393, That's all for now 503 | 2 / 0 | 2 / 2 | Put/wheel, Put/touch, All for now/wheel, All for now/touch |
| 844x390 | dark | tap | Pause 343 → Resume 428 | 2 / 0 | 2 / 2 | Resume in view after the tap, Pause in view after the tap |
| 844x390 | light | break | all in view | 2 / 0 | 2 / 0 | — |
| 844x390 | light | paused | Skip break 421, Resume break 428, Start next brew 421 | 2 / 0 | 2 / 2 | Skip/wheel, Skip/touch, Resume/wheel, Resume/touch, Next/wheel, Next/touch |
| 844x390 | light | over-carried | Mark it done 430, Put the kettle on 548, That's all for now 658 | 2 / 0 | 2 / 2 | Mark/wheel, Mark/touch, Put/wheel, Put/touch, All for now/wheel, All for now/touch |
| 844x390 | light | over-plain | Put the kettle on 393, That's all for now 503 | 2 / 0 | 2 / 2 | Put/wheel, Put/touch, All for now/wheel, All for now/touch |
| 844x390 | light | tap | Pause 343 → Resume 428 | 2 / 0 | 2 / 2 | Resume in view after the tap, Pause in view after the tap |

- **M7b:** 60 runs, 0 failing runs, 0/30 configurations failing.
- **INT:** 60 runs, 44 failing runs, 22/30 configurations failing.

- The 8 INT configurations that pass are exactly those where every control already fits the screen as the state
  opens: the running break at 390×844 and 844×390, plain Break's over at 390×844, and the 390×844 tap, where Resume
  lands at 830 of 844.
- On INT the `tap` row's second failure follows from the first: Resume never came into view, so it could not be
  tapped.
- Superseded tree `9f06a48` (one run, `probe-runs/superseded-9f06a48/`): 30/30 passed too. It is not counted for this
  revision.

On this revision the scroller chain is `main._panel_… 0/<range>` then `doc 0/0`. The page itself still does not
scroll; the panel does. Ranges at 375×667 @200 %: break 102, paused 177, Break's over (task) 236, Break's over (no
task) 81. The full rows (per control and method, both directions, the Tab order, centre y when focused) are in
`probe-runs/*/…-reach.jsonl`.

**Keyboard on INT** passes for the cut-off controls, as explained in (b): focus scrolls the hidden-overflow screen.
That pushes the top bar off and leaves the page stuck until Shift+Tab. On this revision, `.screen` has no overflow
left to scroll.

The tab order is the same on both revisions:
- break: Skip break → Pause/Resume break → Start next brew → `body` → Ambience → Mute;
- Break's over: (Mark it done →) Put the kettle on → That's all for now → `body` → Close.

The `body` entry is focus wrapping past the end of the document. It is not a tab stop.

### Toasts with the panel scrolled (round 6 D4 preserved)

`probe/toastcheck.mjs` raises 1 and then 3 toasts with the app's own `toast()`. It does this at the panel's top and
again after a real wheel to its end, in the paused break and in Break's over with a task, on both revisions. For each
on-screen control it checks two things: a hit test at its centre, and its box against every toast box (clipped by the
list's scrollport). The top-bar controls (Ambience, Mute, Close) are included.

Run on `ba4707c` and INT at 375×667 light, 390×844 dark and 844×390 dark: 24 rows per revision. Results are in
`toast-check/toastcheck.log` and the JSONL, with a frame for every row.

| | Panel controls covered | Top-bar controls covered |
|---|---|---|
| **M7b** | **0 of 24 rows**: Skip / Resume / Next and Mark / Put / All for now clear wherever they are on screen, at the top and at the end of the scroll, with 1 and 3 toasts | **1 row**: 375×667, Break's over (task) scrolled to its end, **3 toasts** → **Close** covered |
| **INT** | **4 of 24 rows**: 390×844 dark, Break's over, **"Mark it done" covered** by 1 and by 3 toasts, at both positions (pre-existing) | 0 |

**The Close row is new exposure, not a change to toast behaviour. It needs a decision.**
- Round 6's room (`src/ui/Toast.module.css`) runs from the top safe edge down to the lift above
  `[data-toast-above]`. A stack taller than the room scrolls inside it.
- With Break's over scrolled to its end at 375×667 @200 %, the action group starts at y 327, so the room is
  0–317 px. Three 200 % toasts fill it up to the top bar, over Close (`toast-check/M7b-375x667-light-over-carried-bottom-n3.png`).
- On INT that scroll position did not exist: the actions below the edge could not be reached at all. One toast
  leaves Close clear.
- At 844×390 the same scroll leaves a room of a few dozen px. The stack scrolls inside it and its newest toast shows
  cut at the top edge (`…844x390-dark-over-carried-bottom-n3.png`). This is the existing short-room behaviour (r6
  residual 3); no control is covered.
- Toasts are transient (3.2 s; 5 s with an action). Close also works from the keyboard.
- I did not change the room. It is `src/ui/Toast*` (M7a's files), and the brief requires round 6's toast behaviour
  kept.
- **Routed as a follow-up:** the room's top could stop below the session's top bar (for example, a "toast below"
  marker on `.top`). Listed again in (f).

## (d) Tests

All Playwright runs used the `chromium` project, 1 worker, `KETTLE_PORT=5227 KETTLE_PWA_PORT=5237`, through
`slots.py --lane M7b --n 1`.

| Run | Tree | Result | Log |
|---|---|---|---|
| `tests/break-reach.spec.ts` on **51521cf** (exported with `git archive 51521cf`, served on 5227) | `05bb3f8` | **6 failed / 7**, 1 passed (the 100 % guard, which is meant to pass on both). Failures: wheel cannot bring "Put the kettle on" (y 730 of 667; 838 of 844), "Mark it done" (430 of 390) or "Skip break" (698 of 667; 421 of 390) into view; after tapping Pause, "Resume break" is at 706, off-screen | `spec-runs/break-reach-on-51521cf.log` |
| `break-reach` + `a11y` + `toast-room` + `statusbar` | **`ba4707c`** | **37 passed / 37**, 0 skipped, 0 flaky (19.7 min): break-reach 7/7, a11y 11/11, statusbar 9/9, toast-room 10/10 | `spec-runs/final-ba4707c-break-reach+a11y+toast-room+statusbar.log` |
| `npx tsc --noEmit --pretty false` | `ba4707c` | exit 0 | `spec-runs/final-ba4707c-tsc.log` |
| `npx vitest run` | `ba4707c` | **265 passed / 265**, 26 files | `spec-runs/final-ba4707c-vitest.log` |
| `a11y` + `toast-room` + `statusbar` (superseded tree) | `9f06a48` | 30/30 | `spec-runs/superseded-…log` |

`tests/break-reach.spec.ts` (sha256 `4a48f1e8b5739f933e83c1ee685391d17d6982d95ef1d8a54a9b3fd47c638018`; unchanged
between the 51521cf run and the final run) has 7 tests. All use real input and fresh phone contexts:

1–3. Break's over with a carried task at 375×667 light, 390×844 dark and 844×390 light. Mark it done, Put the kettle
   on and That's all for now are each brought wholly into view (and hit-testable): by wheel, then by touch, top to
   bottom and back; then focused in view by Tab and by Shift+Tab.
4–5. The paused tea break at 375×667 dark and 844×390 dark: the same for Skip break, Resume break and Start next brew.
6. At 375×667, tapping "Pause break" leaves "Resume break" hit-testable within 2 px of where Pause was, and tapping that
   brings "Pause break" back.
7. 100 % text at 375×667 and 390×844: the break and Break's over need no scrolling, and every control is wholly on
   screen. This is a guard; it passes on 51521cf too.

## (e) BEFORE (INT :5303) and AFTER (this revision) captures

- **Script:** `probe/capture.mjs`, one browser session, BEFORE and AFTER interleaved per state, fresh context each.
- **Clock and date frozen:** `page.clock.install({ time: 2026-10-12T10:30:00Z })` in every context, so both revisions
  run the same date. The break's countdown is frozen at **4:55** with `page.clock.pauseAt`, 5 s into the break: the
  break's `endsAt` is converted from the app's debug clock to the page's `Date.now()`. Every screenshot uses
  `animations: 'disabled'`. Light uses `nooktime=day`.
- **States:**
  - 200 %: `break-running`, `break-paused-top`, `break-paused-bottom`, `over-carried-top`, `over-carried-bottom`.
    The "bottom" captures come from a **real wheel** over the panel until nothing moves; the log records the panel
    offset reached (INT `0/…` every time; AFTER e.g. 177/177, 236/236).
  - 100 %: `break-running`, `break-paused-top`, `over-carried-top`.
- **Sizes:** 375×667, 390×844, 844×390 at 200 %; 375×667, 390×844, 1440×900 at 100 %. Both themes. Phones DPR 2,
  desktop DPR 1.
- **Paths:** `integration-fix/r7/M7b/captures/BEFORE-INT/` and `…/AFTER-M7b/`, 48 + 48 full-size PNGs, plus
  `captures/captures.log`.

**Opened by me (full size).** Each AFTER below is paired with its BEFORE:

- 375×667 dark `break-paused-bottom`: BEFORE ends at "you're ready" with the controls below the edge. AFTER shows Skip
  break / Resume / Next brew whole, the captions wrapped onto two lines, and "1 of 4 brewed" with the dots.
- 375×667 dark `over-carried-bottom`: BEFORE stops at "Mark it done, start fresh"; AFTER shows Mark it done, Put the
  kettle on and That's all for now.
- 390×844 light `break-running`: BEFORE runs "Skip break" / "Next brew" past both screen edges (`Skip break` cut at
  x 0, `Next brew` at 390), with "Pause" cut at the bottom. AFTER has the same countdown and the buttons at the same
  height. Skip and Next sit about 12 css px further in, because the row is narrower once their captions wrap ("Skip /
  break", "Next / brew"). The second caption lines and "Pause" continue below the edge, over the bottom shade, and
  the panel scrolls to them.
- 844×390 dark `break-paused-bottom`: BEFORE shows Paused / 4:55 / the status with no controls; AFTER shows the three
  controls under the status.
- The 100 % sets, by pixel diff (below).

**100 % unchanged, measured** (`probe/pixdiff.mjs`, a canvas decode, counting pixels with any channel differing by
more than 2; `captures/PIXDIFF-t100.txt`):
- 14 of 18 pairs: **0 differing pixels**, including every 1440×900 pair and every 375×667 dark pair.
- 4 pairs: 39–250 scattered pixels. The magenta maps are in `captures/pixdiff-t100/`. They show only:
  - anti-aliasing at rounded edges (the corners of "Put the kettle on", the cycle dots);
  - raster noise in the stage (the counter's grain, the steam's edge), which my change does not touch.
- Controls (`captures/PIXDIFF-controls.txt`): two separate INT capture runs of 375×667 light paused differ from each
  other by the same 132 pixels in the same box. Two separate AFTER runs differ by 0. Nothing moved: a layout shift of
  even 1 px would differ along every text edge, thousands of pixels.
- The 100 % layout is also asserted structurally by spec test 7: no scroll range, and every control whole.

## (f) BLOCKED / UNKNOWN (never PASS) and limits

- **BLOCKED (environment):**
  - Real phones and touch hardware: touch is CDP-synthesised. Real mouse-wheel notch sizes (100 px synthetic notches).
  - Real browser text zoom or OS font scaling: 200 % is simulated with `html { font-size: 200% }`, as the brief asks.
    Platform zoom that also scales px values is not exercised.
  - Screen readers: the tab order and accessible names are unchanged, but no AT was run.
  - iOS Safari momentum scrolling and `overscroll-behavior` on iOS.
- **UNKNOWN:**
  - Discoverability of the scroll at 200 %. The bottom-edge shade is clear in light. In dark it is **subtle**: a
    shadow on deep purple. At 844×390 @200 % Break's over opens with only its title and question in view, and the
    shade is the main hint that the actions are below. Reaching does not depend on the cue (the probe and spec
    reach everything), but whether people notice it is unmeasured.
  - Browsers without `:has()` (before Safari 15.4 / Firefox 121) would keep the old clipped layout. Chromium is the
    only engine tested.
- **New exposure, follow-up for the toast owner:** with Break's over scrolled to its end at 375×667 @200 %, a stack of
  3 toasts covers the top bar's Close for its lifetime (see (c), toasts). The panel controls are never covered.
- **Observed, pre-existing, not in this fix (identical on INT; follow-ups):**
  - 844×390 @200 %: the top bar's chip squeezes "Tea break · 5 min" to "Te / a / b..", and on Break's over the cycle
    label "Next: brew 2 of 4" runs under the Close button.
  - INT 390×844 dark @200 %: one toast covers "Mark it done" in Break's over (`toast-check/INT-390x844-dark-…`). This
    revision is clear there.
- **Superseded trees.** The code commit was amended twice before READY (see (a)); runs on `9f06a48` / `08f8a40` are
  labelled and not counted for this revision.
