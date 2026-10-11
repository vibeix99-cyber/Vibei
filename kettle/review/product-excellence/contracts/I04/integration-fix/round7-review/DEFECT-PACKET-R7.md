# Round 7 review: REJECT, defect packet, and the decision for Vibei

**Prepared by:** the orchestrator, 2026-10-11 11:15 UTC.
**Round 8:** not started, per Vibei's instruction ("On REJECT: stop with the defect packet and its cause. Don't start
round 8; Vibei will decide").

- **Verdict:** **REJECT** of trial merge **`b39202f`** (`kettle/src` tree `6db18ad`): integration `2e9095c` plus
  `pe/r7-banner@7ba0d98`.
  - Issued by a newly launched lead Checker (Opus 5.5) that built nothing in round 7.
  - Its receipt is `contracts/I04/CHECKER-integration-fix-r7.md`. Its notes are in `round7-review/LEAD/L2-NOTES.md`.
- **Nothing was merged.** Integration app code is still `0d58c5e`, and Wave 1 is not closed.
- **The trial merge is archived** as `archive/rv7-trial-b39202f.incremental.bundle`, with local branch `pe/rv7-trial`.

## What round 7 achieved (verified by the lead from raw evidence)

- **The storage warning** is an in-page banner on Today and in Settings › Your data, plus a one-line note on the
  summary.
  - It is never laid over the brew. It is announced exactly once per episode, and Save backup is reachable by Tab.
  - The old toast's hold, withdraw and re-show loop is gone. That loop caused LEAD-D1, R5-D1, D3, R2-D3, R4-D1 and
    round-6 items 14, 16, 18 and 19.
  - The controls reproduced this session, and the zeros count.
- **M1's data behaviour is unchanged.** `storage.ts`, `timer/**` and `progress/**` are byte-identical to the approved
  version, and every data assertion passes.
- **Close, Ambience and Mute are clear everywhere:**
  - 0 covered frames, and 100 of 100 real taps activated, across 10 configurations;
  - the control `49ea1de` reproduced: Close covered in 166 frames, Ambience in 435.
- **M7b's reach holds at 200 %:** R7 failed 0 of 30 configurations; INT failed 22 of 30.
- **The summary's last line still clears the Tea time / Skip footer.** The gap is identical to INT.
- **The banner after "Mark done" is ACCEPTED under Vibei's ruling.**
  - When the warning first appears at the tap, it is announced once with its full text.
  - When the banner was already showing, the tap never scrolled it off screen.
- **Regression on `b39202f`:**
  - tsc exit 0; vitest 267/267; chromium 72/72;
  - timer-harness, timer-app and pwa: 29 passed, 2 skipped by design;
  - the standard capture set is complete except 390×844 dark with reduced motion.

  Because the verdict is REJECT, this regression does not stand for a merge. A round-8 revision needs its own run.

## The single blocker: R7-D1, the toast room on Break's over at landscape phones with 200 % text

| Field | Content |
|---|---|
| State | Break's over with a carried task, scrolled to the end of its panel. That is the only way to reach "Put the kettle on" at this size. Any toast up. |
| Viewport and text size | **667×375 or 844×390, 200 % text**, light or dark |
| What happens | The toast room shrinks to a 27–42 px strip at the top edge. <ul><li>A single toast shows 11–34 of its 52–57 px.</li><li>Older toasts are fully off screen.</li><li>The never-expiring update prompt ("A fresh brew of Kettle is ready · Update") becomes an 11–26 px sliver over the top bar's "Next: brew 2 of" line.</li><li>Its **Update action cannot be hit** until the person scrolls back up.</li></ul> |
| Control | INT `0d58c5e`: the panel cannot scroll there. The update toast is whole (97 px) and "Update" is hit-testable in every position. **Introduced by round 7.** |
| Cause | Two parts. <ul><li>`src/ui/Toast.tsx` `toastLiftBottom()` (l.112) lifts the room above `[data-toast-above]`. On Break's over that is the whole action group (`FocusScreen.tsx` l.369, round-4 D4).</li><li>M7b's new scrollable panel (`FocusScreen.module.css` l.154) brings that group to the top at the end of its scroll. `useToastRoom()` then falls back below `MIN_ROOM_PX = 56` (l.158 and l.178).</li></ul> The maker's packet called this room "pre-existing, r6 residual 3", which is wrong: that residual is Today's strip. |
| Why it BLOCKS | It hides text and a control. For the update prompt it is not transient. Vibei's narrow transient-artifact exception does not apply, and the Mark-done ruling covers the storage warning, not toasts. |
| Owner | **M7a** (combined owner of the round-7 room logic), consulting M7b |
| Evidence | `LEAD/runs/L2-toastroom/toastroom{,2}-*.jsonl` and their frames; Lane C check 4 (`C/check4-close/`); the earlier lead's `close-r7` rows |
| A fix must bring | The `toastroom2.mjs` rows (sha `7123da04`) on the new revision and on INT, at 667×375 and 844×390 @200, light and dark, with 1 and 3 toasts and the update prompt, at panel top, end and back. The Close / Ambience / Mute sweep rerun. `toast-room.spec.ts` plus a new test for this state. The same owner should also fix the test follow-up `integrity.spec.ts:1090`. |

## Decision for Vibei

1. **Round 8.** One focused round. Per the lead, it qualifies: a single blocker, one owner, a clear reproduction.
   - M7a fixes R7-D1 (and the `:1090` test timing).
   - Then a targeted re-review: the R7-D1 rows, the Close / Ambience / Mute sweep, and the full regression on the new
     trial merge.
   - Estimate: about 90 minutes for the fix plus 60–75 minutes of review.
2. **Or rule R7-D1 acceptable.** If toasts may be read the way the banner may be read (seen on arrival, announced
   politely, back in view on scrolling back), the lead says R7-D1 becomes ACCEPTED and **nothing else blocks**.
   - `b39202f` could then be merged as reviewed, after a check that the merged tree matches `6db18ad`.
   - The regression above would then apply.
   - R7-D1 would become a follow-up.

**Follow-ups recorded, with owners:** see the verdict's "Follow-up list". They cover:
- R7-5 to R7-13: test timing, focus on recovery, re-announcement, toasts over the note, the shade band, and the
  "saved" wordings;
- round 6's remaining items.
