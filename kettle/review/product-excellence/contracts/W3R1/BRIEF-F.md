# Maker F: notices polish, Today copy, warm-days wording, I13 supportive return (budget 3 h)

Read `PLAN.md` first. Its ownership, glossary and rules bind you.

**Background:**
- T2 (I10, merged `4d36939`) replaced floating toasts with one in-flow notice strip per screen and inline Undo.
- Vibei's rulings stand:
  - no notice or strip ever covers a control, text or list row;
  - one notice at a time, the rest queued, never dropped;
  - no strip on the summary;
  - no update prompt during a brew or on the summary;
  - the storage banner is unchanged.
- The T2 verdict and its residual table are in `contracts/W2R3/CHECKER-W2R3-T2.md` (§4, §7). The final-regression note is in `contracts/W2R3/review/FINAL/README.md`.

## Items

1. **F-T2-1:** a notice entering or leaving never moves content under a pending or just-landed tap.
   - For example, the strip could reserve its height while a notice leaves, or change only between interactions (no pointer down, and none within a short settle time after the last pointer or key event).
   - Today the strip's at-rest exit moves content 57–97 px. In `notice-strip.spec.ts:275` at 1440×900 @200 with reduced motion, End's "Saved…" notice leaves at rest just before the tap on Mark done; the page shifts 60 px and the click lands on the tag group. It fails 2/2, alone too.
   - That test must pass **without being weakened**, at every configuration of the spec.
   - Controls first: show the failure on base :5478, then the fix.
2. **Triage** F-T2-2, F-T2-8, N-1, N-2 and N-3 (definitions in `CHECKER-W2R3-T2.md` §7):
   - F-T2-2: at 200 % on short screens a notice pushes the session readout or controls below the fold.
   - F-T2-8: the landscape session top bar squeezes the task label at 200 %.
   - N-1: `notice-strip` at 844×390 @200 timed out because the task never reached the field; assert the field holds it before Start.
   - N-2: the History Undo read races the base's focus scroll; that scroll is in S's `History.tsx`, so list it.
   - N-3: a long persistent notice on the tea break runs below the fold at landscape @200.

   Fix what lies in your files. List the rest with reasons.
3. **Warm-days wording:** replace every remaining "warm streak" wording in your files with the glossary's language:
   - the badge description "Keep a {n}-day warm streak" in `progress/badges.ts` (update its test assertions in `badges.test.ts`, `engine.test.ts` and `done/rank.test.ts`);
   - the rail (`Rail.tsx`: "Start a warm streak", `title="Warm streak"`, the sr text);
   - Today, Welcome, the session and the summary wording;
   - any other visible or sr "streak" in your files.

   Stored ids and arithmetic stay unchanged, and nothing is migrated. S and G change the strings in their own files (`PLAN.md`). Give them nothing; just list in your packet every file and string you changed.
4. **I13, supportive return** (plan I13): on the fresh, new, returning and missed-day states (seeds `fresh`, `newbie`, `veteran`, `atRisk`, and a missed day with and without a Tea Cozy available):
   - the copy invites rather than threatens;
   - it explains warm days and Tea Cozy protection once, and only when relevant to this person's actual state;
   - it changes no rules;
   - skip break and "finish for now" stay viable;
   - End's consequences are stated honestly.

   Where: Today (greeting, Chai's line, StatusBar sheets), the rail, Welcome, the session and the summary wording. Stats is S's (the StreakCard lines).

## Proof

- **Controls first:** each item reproduced on base :5478, then fixed on your dev :5501.
- **REFERENCE (K01) → BEFORE (:5488 / :5478) → AFTER** at full size: 390×844, 375×667, 844×390 and 1440×900, light and dark, 100 % and 200 %. Cover every state you change (Today in each return state, the rail at 1440, the strip moments, the session at 200 %).
- **Invariant kept:** zero overlap between any notice and any control, text or list row, with real input at every size, text size and theme. R5-D1, LEAD-D1, R7-D1, D4, W2H-D1 and T2-D1 stay passing (`toast-room`, `a11y`, `w2-home`, `summary-notice`).
- **Suites:** tsc; vitest; `notice-strip` 25/25 (with the 1440 @200 reduced-motion test passing twice in a row); your specs; the full chromium suite if time allows.

**Hard stop:** 13:15 UTC. Then write `contracts/W3R1/F-READY-FOR-REVIEW.md` in your worktree.
