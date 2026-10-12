# CHECKER W2 · First visit only (I08, first-visit part; split out of Maker H) — round 1

**Verdict: APPROVE** `pe/w2-firstvisit@1b38509` (kettle/src `58aac00dd3036c5cbf9ca8f5795eee939ec05484`).

| | |
|---|---|
| Lead checker | LEAD-2, Opus 5.5 (`claude-opus-5-5`); implemented none of this work |
| Revision | `1b38509` (worktree `/home/user/wt/w2fv`, HEAD = `1b38509`, clean), dev :5343, preview :5353 |
| Base / control | `90a11e5` (src `42e106d`), dev :5310, preview :5330 |
| Origin | Mechanical split of Maker H `7a961b7` per Vibei's ruling (purpose line ships alone; the Brew length change is withdrawn) |

## 1. What I checked

- **Split integrity (myself):** `git diff 7a961b7 1b38509 -- kettle/src/screens/welcome` → empty (tree `3e983c9` on both).
  `git diff 90a11e5 1b38509 --stat` → 3 files: `Welcome.module.css` (+8/−3), `WelcomeScreen.tsx` (+15/−9),
  `tests/w2-firstvisit.spec.ts` (new). One commit on top of `90a11e5`. The test body is byte-identical (modulo indentation)
  to H's first-visit test in `7a961b7:kettle/tests/w2-home.spec.ts` (line 203 on). No Home, dock, toast or Brew length
  code is in this revision, so W2H-D1 (End's toasts over Today's "Mark done") cannot arise from it.
- **Diff review (myself):** the one speech-bubble line changes to "Kettle is focus time, then a tea break if you want
  one."; "Set things up first" goes from a `size="lg" block variant="ghost"` Button to a quiet underlined link next to
  "I have a backup" (shared `.helloLink`: `min-height: 44px; padding: 0 12px`, wrapped in a centred flex row). The
  primary "Start a 15-min brew" (FIRST_BREW_MIN = 15), the optional task field and `onSetup` are unchanged.
- **Spec (read the raw logs, base first):** `contracts/W2/review/FV/spec/control-90a11e5.log` 0/6 (each fails on the
  old line, as required); `split-1b38509.log` 6/6 (390×844, 375×667, 844×390 × 100/200 %): one line, one primary
  button, the two others are quiet links ≥ 24×24, fits without scrolling at 375×667 @100, primary on top, a real tap
  starts a running 15-minute brew with no task.
- **Real keyboard probe (myself, through the gate, trial preview :5353):** `/home/user/wt/w2t-n2/kettle/.tmp/LEAD2/fvk.mjs`.
  375×667 @100 and 390×844 @200: Tab order input → Start → "Set things up first" (third stop); focus ring 3 px solid
  (visible, frame `.tmp/LEAD2/fvk/focus-375x667-1.png`); link box 149×44 (@100) and 276×45 (@200); Enter opens
  "What should I call you?" (the setup flow).

## 2. What I opened (full size, REFERENCE → BEFORE → AFTER)

- REFERENCE K06 `VISUAL_BENCHMARK_LIBRARY/assets/current/r6-context/phone-light/12-hello.png`.
- BEFORE `contracts/W2/BEFORE-90a11e5/<cfg>/00-first-visit.png`, AFTER `contracts/W2/review/FV/AFTER-1b38509-5353/<cfg>/00-first-visit{,-full}.png` for
  **375×667 light @100**, **390×844 dark @200** (+ AFTER full), **844×390 light @200** (+ AFTER full), **1440×900 dark @100**.

Findings:
- 375×667 light @100: BEFORE runs off the screen (the ghost "Set things up first" sits on the bottom edge, "I have a
  backup" is below the fold). AFTER: title, one purpose line (2 lines), Chai, optional task field, one orange primary,
  two quiet underlined links on one row; everything on screen. Same layout family as K06.
- 390×844 dark @200: the line wraps to 4 lines in the bubble, nothing clipped; the page scrolls (as BEFORE) and the
  full capture shows field, primary and both links in order, no overlap.
- 844×390 light @200: two columns as BEFORE; the bubble holds the 5-line text; full capture shows primary then the two
  links stacked, no overlap.
- 1440×900 dark @100: one line in the bubble (2 short lines), one primary, the two links side by side under it.

## 3. Acceptance

| Criterion | Result |
|---|---|
| One plain line: focus time, then an optional tea break | PASS: "Kettle is focus time, then a tea break if you want one." (all 16 AFTER configurations captured; 4 opened) |
| One primary action | PASS: one filled orange "Start a 15-min brew"; setup and restore are underlined links (spec + captures) |
| No extra screens | PASS: no new route or step; the tap goes straight to Focus |
| Task and name optional | PASS: task field "(optional)" unchanged; name only inside the optional setup flow; the tap starts with intention `''` |
| 15-minute first brew kept | PASS: `plannedMs` 15 × 60 000 after a real tap (spec 6/6) |
| "Set things up first" as a quiet link: 24×24 and keyboard | PASS: ≥ 149×44 CSS px; third Tab stop with a visible ring; Enter opens setup |

## 4. Residuals

| Item | Where | Class | Why |
|---|---|---|---|
| Setup is now a quiet link, not a second large button | all | ACCEPTED | The brief asks for one primary action; setup is offered again after the first whistle ("Make Kettle yours"); target and keyboard reach verified |
| 844×390 @200 and 390×844 @200 need a scroll to reach the links | landscape / large text | ACCEPTED (same as BEFORE) | Scrolling page; the spec scrolls the primary into view and finds it on top; nothing overlaps |
| K06 still shows the old line | reference | ACCEPTED | The line is the intended change of this item |

No BLOCKS. No FOLLOW-UP introduced by this revision.

## 5. Follow-ups

None from this revision. (The withdrawn Brew length change and W2H-D1 remain with the I10 toast round, owner the orchestrator/Vibei, as ruled.)

## 6. The one pair that shows the change

BEFORE `contracts/W2/BEFORE-90a11e5/375x667-light-t100/00-first-visit.png` → AFTER `contracts/W2/review/FV/AFTER-1b38509-5353/375x667-light-t100/00-first-visit.png`
