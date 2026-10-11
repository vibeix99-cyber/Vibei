# Lane C receipt, round-7 review (IN PROGRESS: written as I go; not final)

- Lane C. I run checks and write receipts only. **No verdict** is given here. I implemented nothing in round 7 and
  edited no app code, tests or maker files. Nothing committed or pushed. Orchestrator servers never stopped.
- Model: Claude Opus 5.5 (`claude-opus-5-5`). Effort: not inspectable.
- Wall clock start: 2026-10-11T03:23:56Z. End: (pending).
- Under review: R7 = trial merge `b39202f` (worktree `/home/user/wt/rv7-r7`, `kettle/src` `6db18ad`), dev server +
  debug API http://127.0.0.1:5301. Control / BEFORE: INT `0d58c5e` (`kettle/src` `1fc4a1b`), http://127.0.0.1:5303.
  At 03:26Z I checked that :5301 serves the R7 blobs and :5303 the INT blobs of `FocusScreen.module.css`, `Toast.tsx`,
  `flow.ts` (`?raw` module text, sha256 equal to `git show <rev>:kettle/<path>`). Previews :5321 / :5323 not used.

## Check 1. M7b at 200 % on R7

### 1a. Reach by real wheel, CDP touch drag and Tab / Shift+Tab — DONE (1 run per configuration per revision)

- Probe: M7b's `reach.mjs`, copied unedited to `/home/user/wt/rv7-r7/kettle/.tmp/C/m7b/reach.mjs`, sha256
  `9d8ef06e9f1e4c7a94f53962c512a5b647238397fe952cd8d8f1c11d41a4fcfe` (= M7b's `probe/SHA256SUMS.txt`). Runner
  `run-reach.sh`: per size one Chromium (`slots.py --lane C --n 1`), a fresh context (disposable profile) per state.
- Input: `page.mouse.wheel` 100 px notches, CDP `Input.dispatchTouchEvent` drags, `page.keyboard` Tab / Shift+Tab
  (keyboard last). Reached = whole box inside the visible screen ∩ clipping ancestors **and** `elementFromPoint` at the
  centre hits it, in both directions. `tap` = a real tap on "Pause break" must leave "Resume break" in view, and back.
- Setup (debug API): newbie seed, brew with "Chapter 3 notes" (none for `over-plain`), `nearEnd` + `finish`, **real tap
  on Tea time**, `timer.pause()` for `paused`, `finish()` for Break's over.
- Judging: the probe's verdicts, re-judged independently from the raw rows (`judge_reach_c.py`: any control × method
  with `reached:false`, a tap failure, or a page error). Same result on every row.

**Control first, reproduced.** INT ran first (03:24:56–03:45:37Z, in parallel with R7 03:24:58–03:36Z). INT
reproduces the off-screen controls: scroller chain `doc 0/0` only, e.g. 375×667 "Pause break" y 645 / "Resume break"
706 / "Put the kettle on" 730 / "That's all for now" 840 of 667, all unreachable by wheel and by touch. My INT rows
equal M7b's INT rows configuration by configuration (failing control/method sets compared programmatically). So R7's
zeros count.

| | Runs | Failing runs | Failing configurations | control × method failures |
|---|---|---|---|---|
| **INT** `0d58c5e` | 30 | **22** | 22 / 30 (375×667: 10/10; 390×844: 4/10; 844×390: 8/10) | 96 (40 + 20 + 36) |
| **R7** `b39202f` | 30 | **0** | 0 / 30 | 0 |

Per configuration (sizes 375×667, 390×844, 844×390; light and dark; 5 states): `check1-reach/TABLE.md`. Raw rows:
`check1-reach/{INT,R7}-reach.jsonl`, stdout `check1-reach/{INT,R7}-run1.log`, re-judged tables
`check1-reach/{INT,R7}-judged.md`, every probe screenshot full size (JPEG q88) in `check1-reach/{INT,R7}/`.

- On R7 the page never scrolls (`doc 0/0`); the session panel does (`main._panel_… 0/<range>`): 375×667 break 116,
  paused 177, Break's over (task) 236, (no task) 81; 390×844 80 / 137 / 126 / fits; 844×390 fits / 83 / 338 / 183.
- **Tab order** is the same on both revisions: break Skip → Pause/Resume → Start next brew → top bar (chip, Ambience,
  Mute); Break's over (Mark it done →) Put the kettle on → That's all for now → top bar (Close). Every control was in
  view when focused on R7 (`key.fwd` / `key.back` true in every row). On INT, Tab also "reaches" the cut-off controls,
  because focus scrolls the `overflow:hidden` screen (M7b's side finding) — wheel / touch cannot.
- `tap` on R7: Pause y 645 → Resume y 645 (375×667), 774 → 773 (390×844), 343 → 345 (844×390). **Observation:** at
  375×667 Resume (and Pause after the round trip) is in view with its centre hit-testable but **not whole**
  (`resumeWhole: false`; the lower part of the round button is under the bottom edge: `R7/R7-375x667-light-t200-tap-tap-pause-resume.jpg`).
  The probe counts this as reached (centre hit-tests); it is the same measurement LEAD noted in prep.
- **Observation (R7, both themes):** in the probe's "bottom" frames for the paused break at 375×667 the round buttons
  are whole but their captions are cut at the bottom edge ("Resume" half-visible; the second caption lines "break" /
  "brew" below the edge), e.g. `R7/R7-375x667-dark-t200-paused-wheel-bottom.jpg`. Those frames are where the probe
  stopped (control whole), not necessarily the panel's end; the panel's end is measured separately in 1d.

### 1b. Bottom shade hint at 844×390 — DONE (from the reach probe's own state-open frames, both revisions)

Measured on the probe's full-size "0-start" frames (panel at its top as each state opens), 844×390 @200 %, with
`shade.mjs`: mean luminance of 4-device-px bands over the panel column (x 1060–1640 device px), panel-background
pixels only, bottom 60 device px; delta = darkest band − the panel background (`check1-reach/SHADE-844x390.txt`).

| State (more below the edge?) | INT light | R7 light | INT dark | R7 dark |
|---|---|---|---|---|
| break paused (yes, R7 range 83) | −1.1 (none) | **−24.3** (18 css px gradient) | +0.5 (none) | **−5.8** |
| Break's over with task (yes, range 338) | −0.4 | **−24.4** | +0.5 | **−6.4** |
| Break's over, no task (yes, range 183) | −0.7 | −0.4 | +0.5 | −0.4 |
| break running (no: fits, no scroll) | −3.9 | −3.9 (identical) | −9.5 | −9.5 (identical) |

- Present at 844×390 on R7 where more lies below: clear in light (−24 of 250), **subtle in dark** (−6 of 29), as M7b's
  packet says. Opened full size: `R7/R7-844x390-light-t200-over-carried-0-start.jpg` (grey shade along the panel's
  bottom edge under "Chapter 3 notes?") and `R7/R7-844x390-dark-t200-paused-0-start.jpg` (barely visible).
- Break's over without a task: no measurable shade, because "Put the kettle on" itself is cut at the edge there and
  the shade paints behind content (`R7/R7-844x390-light-t200-over-plain-0-start.jpg`); the cut button is the cue.
- At the end of the range the shade is gone (bands back to the background in the `*-wheel-bottom` frames of the
  paused and Break's over states).

(Sections 1c–1d, check 2 and check 3 follow as runs land; the browser runs for them are queued behind lanes A, LEAD, Dcap and B.)

## Status of the remaining checks (updated as runs land)

| Part | Probe | State at this update |
|---|---|---|
| 1c summary footer (Tea time / Skip) at 100 / 200 %, 375 / 390 / 844×390 / 1440 | `resid.mjs` footer group (via the third slot's `spec15.sh`) | queued (no browser slot yet) |
| 1d 100 % brew / break INT vs R7 pixel diff, frozen clock | `pix.mjs` flows at 375×667, 390×844, 1440×900 | queued |
| 2 round-6 follow-ups / unknowns | `resid.mjs`, `spec15.sh`, plus 1a and 3 | queued |
| 3 three pixel differences | `pix.mjs` home / first / rm / zen04 / flow jobs | queued |
