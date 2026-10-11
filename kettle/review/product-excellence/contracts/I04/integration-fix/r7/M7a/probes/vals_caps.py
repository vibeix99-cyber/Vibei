import json
SC = '/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/r7/M7a'
V = json.load(open(f'{SC}/vals.json'))
V['captures_text'] = """`r7/M7a/captures/BEFORE-INT/` and `r7/M7a/captures/AFTER-final/` (`<state>-<W>x<H>-t<text>-<theme>.png`, full size:
DPR 2 under 900 px wide, DPR 1 at 1440), each with `notes-*.jsonl` (per shot: route, banner / note / warning toast
present, the toasts listed; for AFTER also the summary-end measurement). Script `r7/M7a/probes/capture-r7.mjs`: **one
fixed timestamp for both revisions, 2026-10-10T15:20:00Z** (`page.clock.install({ time })`, then `resume()`, timezone
UTC), screenshots with `animations: 'disabled'` (CSS animations, transitions and Web Animations — the idle loops —
stopped; the 3D scene is off). Same session: BEFORE (02:3x–02:46 UTC) and AFTER (02:49–03:2x UTC) on this machine,
same flow. Viewports 390×844, 375×667, 1440×900, 844×390; light and dark; 100 % and 200 % text — 16 configurations per
revision. Setup through the debug API (fresh profile, quota fill, `startFocus`, `ff`); "Tea time" and "Mark done" are
real taps / clicks; the panel is wheeled to its end for the Close state; toasts in the focus / Break's over states are
raised with the app's own `toast()` (labelled setup).

States: `today` (Today with the warning), `focus-toasts` (brew running, two toasts), `summary` (the failed-save note),
`summary-end` (details expanded, scrolled to the last line), `breakover-toasts` (Break's over, two toasts),
`breakover-end-3toasts` (**the Close state**: Break's over wheeled to its end, three toasts), `settings-data`
(Settings at "Your data"), `lead-d1` (1.3 s after a real tap on Mark done: "Crossed off · Undo").

**What I saw in the files I opened** (full size, Read tool; BEFORE = INT, AFTER = final):

| File(s) | BEFORE | AFTER |
|---|---|---|
| `today-390x844-t100-light`, `today-375x667-t100-light` | The warning toast (dark, berry bell) above "Put the kettle on", over the composer | The honey banner under Chai's bubble, in the page: bold "This browser’s storage is full." + sentence + **Save backup**; status bar, greeting, Chai and goal card unchanged; the composer starts lower (at 375×667 categories and brew length are below the docked start, reached by scrolling); the docked "Put the kettle on · 25 min" and the sky "Change brew length" unchanged; nothing floats |
| `today-1440x900-t100-light` | Warning toast over the brew-length chooser | Banner at the head of the right column; the left column's layout identical |
| `today-375x667-t200-light` | Old D3: the warning toast, one word per line, rising past the top of the screen | Status bar, a 3-line greeting, then the docked start; the banner is in the page below the fold (reached by scrolling) |
| `focus-toasts-375x667-t100-light`, `focus-toasts-390x844-t200-light` | The warning toast on the stage above two toasts | Two toasts only; no warning anywhere during the brew (toasts over the readout: r6 follow-up 8, unchanged) |
| `summary-375x667-t100-light` | Headline, sub, task row, unlock card | One honey line under the sub: "Not saved: storage is full." + **Save backup**; footer unchanged |
| `summary-end-375x667-t100-light` | — | Details expanded and scrolled to the end: the last line ("Your 1-day streak stays warm…") sits above the footer's top edge — clears Tea time / Skip break (measured: lead point 5) |
| `summary-844x390-t100-light` | — | The note in the narrow landscape panel puts Save backup under its text (two rows) |
| `settings-data-844x390-t100-light` | Rows and footer only | The same banner right after "Everything lives on this device…", Save backup beside the text |
| `lead-d1-390x844-t100-light` | Warning toast + "Crossed off · Undo" stacked over the composer | Banner (already up) steady above the goal card; "Crossed off · Undo" alone |
| `breakover-end-3toasts-375x667-t100-light` | — | Three toasts above "Mark it done, start fresh"; Close, Mark, Put and "That's all for now" clear |
| `breakover-end-3toasts-375x667-t200-dark` | The panel does not scroll on INT: "Put the kettle on" and "That's all for now" are below the bottom edge (unreachable, the pre-M7b defect); three toasts over the title area, Close clear | Panel at its end: Mark / Put / All for now in view; the three toasts sit in a room that starts below the top bar, the top one cut at the room's top (scrolls inside it, round-6 behaviour); **Close clear** |

Earlier sessions' captures of the same states (my revisions `217489c`–`49ea1de`, and INT) are kept in
`superseded-*/` for reference only."""
V['f_extra'] = """- **Measured limits of this design (for the reviewer to classify):**
  - *Summary note:* one line at 390×844, 375×667 and 1440×900 at 100 %; two rows in the narrow landscape panel at
    844×390 and at 200 % text.
  - *Visibility without movement:* the banner is in the page, so it can be out of view: below the fold at 375×667
    @200 % on arrival; above the view after a real "Mark done" when the person had scrolled into the composer
    (lead point 2).
  - *Tab order:* phones — Save backup after the status bar and Chai's bubble, before the composer; desktop — in the
    right column, so after the composer and start.
  - *Toasts at 390×844 @100 % on Break's over:* "Mark it done" overlapped by an entering toast for 2–4 frames on the
    final revision (7 frames, plus "Put the kettle on" 4, on the unfixed revision; INT has it too per M7b's check) —
    round 6's entry slide, pre-existing, not worsened.
- **Pre-existing "saved" wording outside my files** (identical on INT): End sheet "N minutes of focus will be saved";
  `src/timer/announce.ts` "Kettle’s off. N minutes of focus saved."."""
json.dump(V, open(f'{SC}/vals.json', 'w'), ensure_ascii=False)
print('ok')
