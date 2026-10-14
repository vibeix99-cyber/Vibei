# Maker S: Stats and History (I12), F-T2-4, the backup round-trip test (budget 3 h)

Read `PLAN.md` first. Its ownership, glossary and rules bind you. References: K07 (`live-stats-empty.jpg`), B06, and the audit's Stats findings (`kettle/.tmp/pkg/kettle-excellence-integrated/KETTLE_CURRENT_PRODUCT_AUDIT.md`, the Stats parts; I12 in `PRODUCT_EXCELLENCE_PLAN.md` / `MASTER_EVIDENCE_MATRIX.md`).

## Items

1. **Populated Stats use genuine history.** Totals and dates follow the documented policy, including late completions: a brew that finishes after midnight, a brew ended late, DST. Find the documented policy in the code and docs (`progress/time.ts`, `progress/insights.ts`, `dst.test.ts`, `docs/`) and cite it.
   - Inspect the populated views (seeds `veteran`, `celebrate`, `newbie`) and fix only misleading totals, date attribution or unclear output that the evidence supports.
   - Keep the useful empty-state action, the existing data and the categories.
   - No fictional records, and no claims about focus quality, skill or wellbeing.
2. **A short summary at the top of Stats** (today and this week), built only from genuine numbers already computed from history. No invented metrics.
3. **F-T2-4:** "Delete this brew?" (`History.tsx` → `Dialog` in `ui/Sheet.tsx`, yours this round) must be reachable by tap and by Tab, and usable, at every size and text size. That includes 375×667 @200, where today neither Delete nor Keep it can be reached.
   - Controls first: show the failure on base :5478.
   - The fix must not regress other Dialog/Sheet uses (Settings' reset, Today's sheets, Ambience). Check them.
4. **The backup round-trip test** (`integrity.spec.ts:768`, "export → reset → import restores…"): make it robust by waiting on real state, never weakened.
   - In the final regression it failed once under load: `profilePills` read "194 leaves" from `document.body.innerText` right after `navigate('/settings')`, probably from a screen still leaving (Today's animated counter).
   - Read the pills inside Settings' own `main` once the route has settled, or similar.
   - Prove it with `--repeat-each` under load (`--workers=2`).
5. **Warm-days wording in your files**, per the glossary:
   - the `StatsScreen.tsx` tiles ("Day streak", "Best streak"…);
   - `StreakCard.tsx` lines ("Finish a brew to start your warm streak.", the sr calendar caption);
   - the History dialog ("…your history, stats and streak").
   The StreakCard's missed-day and return lines follow I13's principles: invite, never threaten; explain the Tea Cozy only when relevant; no rule change.

## Proof

- **Controls first.**
- **REFERENCE (K07) → BEFORE (:5488 / :5478) → AFTER** at full size: 390×844, 375×667, 844×390 and 1440×900, light and dark, 100 % and 200 %. Cover empty and populated Stats, History, the delete dialog, and the summary at the top.
- **Totals:** a table of the numbers shown against the numbers recomputed from the seeded history.
- **Suites:** tsc; vitest; `integrity.spec.ts` (whole file, plus `:768` with `--repeat-each=5 --workers=2`); your new specs; the full chromium suite if time allows.

**Hard stop:** 13:00 UTC. Then write `contracts/W3R1/S-READY-FOR-REVIEW.md` in your worktree.
