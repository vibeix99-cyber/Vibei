# Vibei's decisions after the W3R1 follow-ups (2026-10-15)

**Models:**
- Opus 5.5: the `integrity:309` fix maker, and every LEAD-5 review.
- Sonnet 5.5: the backdrop investigation (item 2), the N-2 fix maker (item 3), and the regression runs and captures.
- LEAD-5 (Opus) gives the verdict on everything before merge.

1. **`integrity:309`: fix it now.** One Opus fix maker; LEAD-5 reviews; merge only on APPROVE.
   - **Scope:** `setIntention` (`src/timer/store.ts:399`) and its composer call (`Composer.tsx:83–86`) only.
     - Saving the intention writes **only** the intention. It never writes this tab's in-memory timer state over storage: read fresh, or update just the intention field.
     - Storage format and existing user data stay compatible; no migration.
   - **Test:** add a **deterministic** test that reproduces the race. It must fail on the base and pass on the fix. Leave `integrity:309` itself unchanged; it must pass **20/20 under load** on the fix.
   - **Audit:** list every other function in `store.ts` that writes the whole state the same way, with file:line, in the receipt. Do **not** fix them this round unless LEAD-5 rules one to be the same bug.
   - **Regression (Sonnet lane):**
     - timer/PWA;
     - the full integrity suite;
     - the notice suite;
     - a 2-tab manual check: start a brew, open Today in a second tab, type a task in each, and confirm the brew survives in both and the record is made.
2. **Backdrop investigation (Sonnet):** find the cause of the unexplained 390 dark first-brew backdrop difference from the final capture matrix, before the Final Boss.
   - First check the base-vs-base noise, then bisect the merges.
   - If it is a real change, name the merge that caused it and say whether it is intended.
   - **Report only;** no fix without Vibei's go. If the cause is non-obvious, hand it to LEAD-5 to judge.
3. **N-2 (the History focus scroll):** a Sonnet fix maker, in a **separate phase after item 1 merges**, scoped to S's History file only. LEAD-5 gates and reviews it separately from item 1.
4. **Final Product Boss: still on hold.** Vibei is generating the 2D sipping and cheering poses next, and gives the go-ahead after they are checked and wired in.
