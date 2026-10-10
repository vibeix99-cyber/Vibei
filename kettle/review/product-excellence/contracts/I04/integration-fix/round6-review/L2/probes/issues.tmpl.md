Evidence names are files under this folder. "R6 better/same/worse" is relative to INT for the same state; where INT could not reach the state I say so.

### Issue 1: a stack of 2 or 3 toasts covers the countdown digits on the session and break screens (phones; landscape at 200 %)
- **R6.** Hit-test at the centre of the digits returns a toast and the boxes overlap, for the rest of the toasts' 3.2 s, in every running, paused and break window with 2 or 3 toasts at 375×667 (100 % and 200 %, light and dark) and 390×844 (3 toasts; 2 not tested), and at 844×390 and 200 % (1 toast in 1 of 3 windows, 2 toasts 2 of 2, 3 toasts 6 of 6). With 1 toast the digits are clear on phones. At 1440×900 and 844×390 at 100 % never. Protected controls are never covered. Evidence: `analysis/check4-R6-table.md`, `shots/check4/R6-375x667-light-t100-running-n3.png`, `R6-390x844-dark-t100-break-n3.png`, `R6-844x390-light-t200-running-n3.png`.
- **INT.** {{INT1}}
- **R6 vs INT:** {{INT1V}}

### Issue 2: some controls sit below the bottom edge at 200 % text and the page cannot be scrolled to them
- **R6.** Document not scrollable (`scrollTop 0/0`, no scrolling ancestor); wheel and touch drags at three positions never moved it. 375×667: "Resume break" in the paused break (y 706), "That's all for now" in Break's over with a carried task (y 840; "Put the kettle on" is below it). 390×844: "That's all for now" (y 927). 844×390: "Resume break" (428), "Mark it done" (430), "Put the kettle on" (548). The 844×390 journey could not continue past Break's over (3 windows untested). Light and dark identical. Evidence: `shots/check4-unreachable/`, `check4-R6-table.md`.
- **INT.** {{INT2}}
- **R6 vs INT:** {{INT2V}}

### Issue 3: at 667×375 and 200 % text, in the three-toast stack, older toasts slide over the first line of the warning right after it appears
- **R6.** 17 of 26 stack runs at 667×375/200 % (wheel 20/53/100, touch, flick, natural sequence; both themes): at full opacity the first line is not visible for 99-830 ms; it is visible 0.43-1.03 s after the warning was added. Cause seen in the frames and the clip: the older toasts are animated down from over the warning (z-order above it) to below the 58 px room. Not seen at 375×667, 390×844, 844×390, 568×320 or 667×375 at 125/150 % (0 of the other 100 R6 reading runs). Evidence: `video/read-R6-coarse/R6-667x375-light-t200-stack-wheel20.webm`, `shots/check1-2/R6-667x375-light-t200-stack-videoframe-older-toast-over-warning-8.4s.png` and `...-first-line-clear-8.8s.png`, per-run column "first line covered" in `analysis/check2-R6-coarse.md`, `r5d1-R6-natural.md`.
- **INT.** At 667×375/200 % the warning's box is 375-386 px above the top of the screen in all 6 stack runs: the first line is never visible, 1/11 lines are ever seen, Save backup is unreachable. At 375×667/200 % and 390×844/200 % (stack, wheel and touch, 4 runs) the first line is never visible either (7/17 and 11-12/17 lines seen; Save backup unreachable at 375).
- **R6 vs INT:** R6 better (transient ≤ 0.83 s at one size; INT never shows the first line).

### Issue 4: coarse wheel notches and drags skip text in a 58 px room (667×375, 200 %)
- **R6.** 20 px wheel: 11/11 lines. 53 px wheel: 5/11 lines wholly seen (all text passes through the window, coverage 1.0). 100 px wheel: 3/11 lines, 64 % of the message ever on screen (the rest skipped). Same in both themes, alone and stack. Touch: 24 px drags move the message only about 9 px each (touch slop) so 11 lines need about 45 drags and the 12 s timer ended before the end (7-8 of 11 lines wholly seen, the warning gone before the final tap in 5 of 8 runs); 120 px flicks: 9-10/11 lines, coverage 0.25-0.57. No hide or jump in any of them. Evidence: `analysis/check2-table.md`, `check1-R6-extra.md`, `shots/check1-2/R6-667x375-light-t200-alone-wheel100-end.png`.
- **INT.** 1/11 lines (cannot scroll; box above the screen), Save backup unreachable, in all 6 runs.
- **R6 vs INT:** R6 better (11/11 by fine wheel steps versus 1/11).

### Issue 5: a warning raised alone on Today is mounted, taken away and mounted again about a quarter of a second later
- **R6.** In 38 of 42 "alone" reading runs (21 of 24 in the 48-run matrix) and in the 1440×900 runs (2 of 8): the first instance lives 167-237 ms at opacity ≤ 0.12 (no visible flash) and the second is mounted 28-82 ms later; 0 of 94 stack runs. The first frame is laid out at the stylesheet position over the docked start, so the hold rule removes it. Evidence: `analysis/check1-R6-agg.md` (column B), `raw/read-R6-*/` frames (`instances` in the jsonl).
- **INT.** The lone warning on Today was never shown at all: 0 of {{INTALONE}} "alone" runs (375×667 and 390×844 phones, 667×375 landscape, 1440×900) within 12 s, because the old hold rule keeps it held while the idle toast region overlaps the docked start.
- **R6 vs INT:** R6 better (warning shown, one invisible re-mount versus not shown).

### Issue 6: at 1440×900 a toast stack is drawn over the top of the docked start for 0.15-0.5 s before it lifts
- **R6.** Up to 50 px (ordinary toasts at 100 %), 22-24 px (lone warning, 70 px in the run with the re-mount), 25 px at 200 %, for 29-538 ms, at opacity up to 1; none after the stack settles; none at departure. Evidence: `analysis/check3-summary.md`, `check3-R6-1440.md`.
- **INT.** Same arrival overlap; plus an overlap of 49-61 px at departure while the last toast fades (opacity ≤ 0.3, about 85 ms); the lone warning is never shown.
- **R6 vs INT:** same at arrival, better at departure.

### Issue 7 (not reproduced): the a11y gate "short screen (375×667)" failed once on R6 with Settings entries
- **R6.** 1 of 3 runs failed with 17 entries of the form `settings: "<control>" stays under <element>` (Time of day, Window, Nook items); the break-over entries passed in that run. The other 2 runs passed. Not investigated. Evidence: `logs/specs2-R6.log`, `logs/specs4.log`.
- **INT.** Its own spec and R6's spec file against the INT server each fail once, on the break-over entries only (D4), never on Settings entries.
- **R6 vs INT:** break-over entries fixed on R6; Settings entries seen once on R6 only (flaky or not, unknown).

### Not issues on R6 (checked)
No hide, fade or jump while reading in 136 reading runs; R5-D1 not reproduced (52 natural runs); no protected control covered after settling in any configuration; D1, R2-D1, D2, R4-D2 pass; no squeezed toast.
