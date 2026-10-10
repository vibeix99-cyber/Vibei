# L2 (interaction) receipt, round-6 combined review

**Lane:** L2 (interaction). **Reviewer role:** checks only, no verdict. No application code, tests or maker files were edited; nothing was committed or pushed.
**Coverage:** {{COVERAGE}}
**Wall clock (UTC):** start 2026-10-10 18:24; end {{END}}.
**Model / effort:** claude-sonnet-5-5 (Sonnet 5.5). Reasoning effort: the session settings show 30; I cannot inspect more than that.

## 0. What was tested

| | |
|---|---|
| **R6** | trial merge `e866118`, dev server http://127.0.0.1:5301 (port 5301, debug API, `kettle/src` `05bb3f8`) |
| **INT** | `0d58c5e`, dev server http://127.0.0.1:5303 (port 5303, `kettle/src` `1fc4a1b`) |
| Browser | Chromium `141.0.7390.37` headless (Playwright package 1.63.0, `/opt/pw-browsers`), CPU SwiftShader, 4 shared cores. Emulated phones: `isMobile`, touch, DPR 2; 1440×900 is a desktop window at DPR 1. |
| Gate | every browser-launching command ran through `slots.py run --lane L2 --n 1` (one browser or one Playwright worker each). Usually one or two of my jobs ran at once; for about ten minutes around 21:34 UTC three of my jobs (nat-R6, ctl-R6-844, d2-R6) held all three slots, because no other lane was waiting at that moment. Other lanes' browsers shared the 4 cores throughout, which affects timing (frame rate, stalls). |
| Profile | a new Playwright context (empty, disposable profile) for every run. |
| Large text | `html { font-size: 150% | 200% !important }`. **Real OS text size is UNKNOWN.** |

### Method and its limits (read before the numbers)

- **Real input only.** Reading used `page.mouse.move` + `page.mouse.wheel` (20, 53 or 100 px notches) and CDP `Input.dispatchTouchEvent` drags (24 px) and flicks (120 px). Taps used `page.touchscreen.tap` (phones) or `page.mouse.click`. Controls off-screen were brought into view by real wheel or touch drags at three screen positions, never by `scrollIntoView`/`scrollTo`.
- **Real timers.** No toast was held, paused or extended. Toasts last 3.2 s, the storage-full warning 12 s (the pointer pausing it, as in the app). In the control-coverage runs the app's own `toast()` raised 1, 2 or 3 toasts with their default 3.2 s timers (`toast.dismiss()` only between windows).
- **Debug API = setup only:** seed the newbie profile, fill localStorage until `QuotaExceededError`, set leaves one short of a level-up, start a brew, `ff`/`nearEnd`/`finish` to skip brew time, `timer.end('user')` to end a brew in the reading runs, and a failing ledger write to raise the warning on Today. In the control-coverage journeys Add 5, Pause, Resume, End, Tea time, Skip break, Next brew, Mark it done, Put the kettle on and That's all for now were real taps made while toasts were up.
- **Per-frame recording** is `requestAnimationFrame`. Reading runs record video (Playwright `recordVideo`), which held the page at roughly 37-55 frames/s (`fpsApprox` in the jsonl). At 1440×900 (no video) the page still stalled for up to 0.3-1.4 s at a time on this CPU renderer, so durations measured there (lift, settle) are upper bounds that include renderer stalls. The region's `bottom` style was also stamped with a `MutationObserver`, which does not depend on frames.
- **Judging** is offline, from the saved per-frame recordings, with one set of criteria for every run (`probes/judge.mjs`). A line counts as read when its whole line box is inside the toast box, the list's scroll area, the screen and above the docked start, no other toast is painted over it, and `elementFromPoint` at three points along it hits the toast.
- **Probe versions.** Probes were edited while the lane ran. Superseded runs are listed in section 7 and are not used for conclusions. The files in `probes/` are the final versions with `SHA256SUMS.txt`.
- **Not tested at all:** real phones, real touch hardware, iOS Safari/WebKit and Firefox, real OS text-size settings, real assistive technology. These are BLOCKED/UNKNOWN, never PASS.

## 1. Check 1: readability of the warning on R6

Matrix: 375×667, 390×844 and 844×390 × 150 % and 200 % × light and dark × warning alone and the three-toast stack (End after a level-up) × real wheel (20 px) and touch (24 px drags). 48 runs (`analysis/check1-R6-phones-landscape.*`), plus 667×375 at 125/150 % and 568×320 at 100 % (R2-D3 landscape/short), and 667×375 at 200 % by touch and flick (24 runs, `check1-R6-extra`). Each run is recorded from before the warning appears to at least 2.3 s after the last input (`recordedAfterLastMs` is in the jsonl). Per-run table: `analysis/check1-R6-phones-landscape.md`, `check1-R6-extra.md`; per-configuration counts below. Video of every run: `video/read-R6-*`.

Flags (letters used in all tables): **A** first line covered at full opacity; **B** entry re-mount (the first mounted instance is removed before any input and re-added); **C** warning taken away, faded or absent while being read; **D** warning's own scroll or the list scrolled back toward the start without upward input; **E** not every line of the warning wholly seen; **F** "Save backup" not hit-testable / not tapped successfully at the end; **G** warning box over the docked start or below its room; **H** a toast box shorter than its own content and not capped by the room (R2-D3 squeeze).

{{include:check1-R6-agg.md}}

(The 667×375 / 200 % rows are the touch and flick runs only; the check-2 notch runs are in section 2 and the R5-D1 natural runs in section 5. Their E/F counts are explained in issue 4.)

Result for the 48-run matrix (375×667, 390×844, 844×390): **0 runs with A, C, D, E, F, G or H.** The whole warning is on screen when it appears at 375×667 and 390×844 (no scrolling was needed there: 5/5, 6/6, 7/7 lines seen with the list at rest; the three wheel notches or drags that were still sent changed nothing and did not hide it). At 844×390 it is read to its end by wheel (1-3 notches) and touch (2-7 drags): 5/5 lines at 200 %, 7/7 at 150 %. "Save backup" hit-tested as itself and a real click/tap downloaded `kettle-backup-2026-10-10.json` in every one of them. The only flag is **B**: {{BCOUNT}}.

**Entry re-mount (B), details.** A warning raised alone on Today is mounted at the stylesheet position (over the docked start) and the hold rule takes that first instance away after 167-237 ms; a second instance is mounted 28-82 ms later and stays (stable instance 210-281 ms after the first mount). The first instance never exceeded opacity 0.12 in any recorded frame, so nothing visible flashes; the visible effect is that the warning appears about a quarter of a second later and is re-announced to the polite live region. It happened in 21 of 24 "alone" runs and 0 of 24 "stack" runs (the toasts raised just before the warning have already lifted the region). It happens at every size tested including 1440×900 (sections 3 and 6). INT comparison: section 6, issue 5.

## 2. Check 2: coarse wheel notches at 667×375, 200 %, R6 and INT

53 px and 100 px notches (and 20 px for reference), light and dark, warning alone and stack. The room above the docked start is 58-60 px: the warning is 11 lines (462 px of text) in a 58 px box.

{{include:check2-table.md}}

Reading of the table:
- **R6, 20 px:** 11/11 lines wholly seen in 20 notches, no hide or jump.
- **R6, 53 px:** 5/11 lines are ever wholly inside the 58 px window, but the windows overlap, so all text passes through the window (coverage 1.0). No hide, no jump.
- **R6, 100 px:** 3/11 lines wholly seen; the visited windows cover only 64 % of the message, so about a third of the text is never on screen. No hide, no jump.
- **INT:** the warning's box is 384-386 px above the top of the screen (top -383..-375, bottom 76), the list does not scroll, **1/11 lines** are ever seen, "Save backup" never hit-tests and cannot be tapped, in all 6 runs (both themes, all three notch sizes). On INT the "alone" warning was never shown at all (6/6 runs timed out after 12 s: held by the old rule), so there is no INT "alone" row.

## 3. Check 3: 1440×900, R6 and INT

No video, no input after setup (real timers). Per run, per frame: the position of every toast, the docked start, the toast region, and the region's `bottom` style stamped by a MutationObserver. Flows: warning alone on Today; the three-toast stack after End with a level-up; three ordinary toasts. 100 % and 200 %, light and dark, 2 repeats each. Raw: `raw/desk-R6-v0`, `raw/desk-INT-v0` (jsonl and gzip frame recordings), screenshots `shots/check3/`.

{{include:check3-summary.md}}

Per-run table R6: `analysis/check3-R6-1440.md`; INT: `analysis/check3-INT-1440.md`.

## 4. Check 4: protected controls under toasts

Journey per configuration (real taps while toasts are up): Today (Put the kettle on) → running (Pause, Resume, Add 5, End and the End sheet) → summary (Tea time) → break (Pause/Resume break) → Break's over with a carried intention (Mark it done, start fresh; Put the kettle on) → summary (Skip break) → break (Next brew) → Break's over (That's all for now). Each state is probed with 1 toast, and (running and break) 2 toasts, then 3 toasts (long recipe toast, "Saved 12 minutes of focus", "Cozy level 5!"). Today is also probed with the real storage-full warning plus 2 toasts. In the table, a/b means a windows with the digits covered out of b windows probed with that many toasts. 390×844 comes from `ctl-R6-390b` (an earlier probe version: 1 and 3 toasts only, two scroll positions). A recorder hit-tests each control at its centre and intersects its box with every toast's drawn box (clipped to the toast list's scroll area) every frame. "After settling" = later than 600 ms after the first toast frame. The countdown is the digits element (`.clock`).

{{include:check4-R6-table.md}}

Findings for R6 (details and screenshots in `shots/check4/`, `shots/check4-unreachable/`; INT comparison in section 6):
- **Protected controls:** Put the kettle on, Add 5, Pause/Resume, End, Tea time, Skip, Skip break, Pause/Resume break, Next brew, Mark it done, That's all for now: **never covered after settling in any window of any configuration** (hit-test returned the control itself; no toast box on top of it). Every real tap that could be made while 1-3 toasts were up worked (the counts above). The End sheet buttons hit-tested as themselves.
- **Transient:** in the first 600 ms after toasts appear, the docked controls were overlapped by a toast box for 2-6 frames at a time on phones (the lift is measured every 250 ms) and for up to 14 frames on 1440 Today at 100 %; none after settling.
- **Countdown (not a control, but listed in the check):** with **1 toast** the digits are never covered (the toast overlaps only the status/meta lines of the readout box). With **2 and 3 toasts** the digits are covered, as shown by hit-test and box, in every running, paused and break window on phones: 375×667 (per configuration 2 toasts in 2 of 2 windows, 3 toasts in 7 of 7), 390×844 (3 toasts in 7 of 7; 2 toasts not run there), and at 844×390 at 200 % (1 toast in 1 of 3 windows, 2 toasts 2 of 2, 3 toasts 6 of 6). At 1440×900 and at 844×390 at 100 % never. The covering lasts for the rest of the toast's 3.2 s. Screenshots: `shots/check4/R6-375x667-light-t100-running-n3.png`, `R6-390x844-dark-t100-break-n3.png`.
- **Controls off-screen and not scrollable at 200 % text:** the document is not scrollable (`scrollTop 0/0`, no scrolling ancestor) while some controls sit below the bottom edge, so wheel and touch drags at three positions could not bring them into view: 375×667: "Resume break" in the paused break (centre y 706) and "That's all for now" in Break's over with a carried task (y 840); 390×844: "That's all for now" (y 927); 844×390: "Resume break" (428), "Mark it done" (430) and "Put the kettle on" (548) in Break's over. At 844×390 and 200 % the journey could not continue after Break's over, so the later windows there (summary Skip, break Next brew, final Break's over, today+warning) were **not tested** (19 windows instead of 22). Screenshots in `shots/check4-unreachable/`. I did not test whether keyboard or browser zoom reaches them.
- **Today with the real warning + 2 toasts:** the docked start was uncovered and a real tap on it started the brew in every configuration run (1 per configuration).

## 5. Check 5: earlier M2 defects on R6

| defect | what I ran (R6, port 5301) | result |
|---|---|---|
| **D1** resize/rotation to 375×667 re-fits | `d1.mjs`: from 414×896, 667×375, 844×390, 390×844 (phone) and 1440×900, 800×900 (desktop window) → 375×667 and back to 414, both themes, 2 reps, plus 200 % from 414×896 and 844×390. Checks mode `tight`/`normal`/`wrap`, one row, `scrollWidth`/`clientWidth`/`innerWidth`, visual-viewport scale, tab bar bottom. | **0 failures of 28.** INT control: 14 of 16 fail. |
| **R2-D1** narrowing without a box change | `d1race.mjs` (M2's probe, import path only changed): single steps from 384/380, 1-2 px drags, bounce, desktop windows 420 → 375, back to 414, 200 % wrap; both themes, 2 reps. | **0 failures of 36.** INT control: 16 of 20 fail. |
| **D2** "Level NN" at large text | `d2.mjs`: 360×740, 375×667, 390×844 × 100/150/175/200 % × 9 leaf totals (seed .. 470,000) set live + 2 reloads × light and dark; pill boxes and any visible text inside the bar against the screen edge, label spill, `scrollWidth`, scale, tab-bar position and labels. | **0 failures of 264.** INT control (light only, 132 cells): 69 fail. (A first run of the probe in `sb-R6` had 92 false failures from a clipped decorative layer and visually hidden text; superseded by `d2-R6`, the probe was fixed, see section 7.) |
| **R4-D2** zoom after rapid live resizes | `zoom.mjs`: bounce, 414↔376 drag ×3, 2 px/16 ms and 1 px drags, four rotations (zero-wait and 120 ms), a 390→360 drag with height changes; 200 % and 150 %, both themes, 3 reps. Final `visualViewport.scale`, `vv.width == innerWidth`, no sideways scroll, bar inside. | **final scale 1 in 84 of 84.** INT control (200 %, light, 1 rep of 7): 0 failures, as in the earlier rounds. |
| **D3** warning at large text fully on screen, Save backup reachable | check 1 and 2 above. | Alone and in the stack, at 375×667, 390×844 and 844×390 (150/200 %): whole warning on screen or read to its end, Save backup tapped and downloaded in all 48 runs. At 667×375 and 200 % (60 px room) readable by 20 px wheel steps (11/11); limited by notch size, see issue 4. |
| **R4-D1** scrolling made the warning vanish and return unscrolled | wheel and touch reading with per-frame recording ≥ 2.3 s after the last input (check 1, 2). | **0 hides, 0 fades, 0 jumps back in 136 reading runs** (all configurations in the check-1 aggregate, including 667×375 at 125/150/200 % and 568×320 at 100 %). |
| **R5-D1** older toast leaves while the list is scrolled | `read.mjs` in natural mode (pointer on the stack, wheel down to the older toasts, wait 0.6/1.2/1.8 s with real timers, wheel back up; touch variant at 1200 ms), 375×667, 844×390, 667×375 at 200 %, 667×375 and 844×390 at 150 %, both themes, 2 reps: 52 runs (`analysis/r5d1-R6-natural.*`). | **0 hides, 0 jumps.** 23 of 52 runs saw an older toast leave while the list was scrolled (the list offset dropped by the toast's height, "clamp"): the warning stayed mounted and in its room every time. The 5 E / 4 F flags in that aggregate are from the touch runs at 667×375 where the 12 s timer ended while the probe was still scrolling (not a reading run). |
| **R2-D3** stacks at large text squeeze/overflow | squeeze flag H in all reading runs; 568×320 at 100 % with the stack; 667×375 at 125/150 %. | **0 squeezed toasts in 136 runs**; 568×320, 3/3 lines read in all 8 runs. |
| **D4** toast over "Mark it done" | check 4 (Break's over with a carried intention, 1/2/3 toasts, 16 configurations) and the repo spec (below). | Mark it done hit-tested as itself in every window, never overlapped after settling; real tap worked with 3 toasts up in every configuration where it was on screen (not on screen at 844×390 and 200 %). INT control (375×667, 100 %, light): "Mark it done" is covered by a toast (hit-test returns the toast, box overlap) in 3 windows and the real tap did not take effect. |
| Repo specs | `statusbar.spec.ts`, `toast-room.spec.ts`, `a11y.spec.ts` on R6 (KETTLE_PORT=5301, KETTLE_PWA_PORT=5311, `--workers=1`, own `--output`) | {{SPECS}} |

## 6. Issues found, with R6 vs INT (classification is the lead's)

{{ISSUES}}

## 7. Runs, probes, superseded runs

{{include:runs-table.md}}

## 8. Not covered

{{NOTCOVERED}}

## 9. Files

`RECEIPT.md` (this file); `analysis/` (tables and per-run judge JSON); `raw/` (every run's jsonl, per-frame recordings as `.frames.json.gz` for the reading/1440 runs); `logs/` (console output of every job and the queue log); `probes/` (final probe sources, job lists, `SHA256SUMS.txt`, `ORIGINAL-SOURCES-SHA256.txt` for the two copied M2 probes); `shots/` (screenshots); `video/` (webm per reading run: R6 phones, landscape, coarse, extra and INT coarse).
