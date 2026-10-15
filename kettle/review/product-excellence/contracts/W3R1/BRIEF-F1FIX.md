# Fix maker F1X (Opus): the `integrity:309` intention-save race

**Binding:** `VB-DECISIONS-POSTFOLLOWUP.md` §1. **Root cause:** `review/F1-ROOT-CAUSE.md` (Maker Q), assessed by LEAD-5 in `CHECKER-W3R1-CROSS.md`.

**Base:** integration app code `f2298d3` (src `db6de7e`).
- Branch `pe/w3r1-f1-intention`, worktree `/home/user/wt/w6x`, dev **:5561**.
- Controls: the current integration on :5560 / :5570 (worktree `w6-int`) and the old base `4d36939` on :5478 / :5488.

## Scope (only these)

- **`src/timer/store.ts` `setIntention` (`:399`)** and whatever it needs to persist only its field.
- **Its composer call** (`src/screens/home/Composer.tsx:83–86`).
- **A new deterministic test.** A Vitest unit test next to the store, or a new `tests/w3-intention-race.spec.ts`, or both.
- **Nothing else.** Leave `integrity:309` (I01 in `tests/integrity.spec.ts`) unchanged.

## Requirements

1. **Saving the intention writes only the intention.** It must never write this tab's in-memory timer state over storage. Read fresh (merge into what storage holds now) or update just the intention field. Any other tab's newer `status`, `sessionId`, `endsAt` and so on must survive a save from a stale tab.
2. **Storage format and existing user data stay compatible**: the same `kettle:timer` key and shape (the zustand persist envelope, version), and no migration. Prove that a profile saved by base `4d36939` loads unchanged on the fix, and a profile saved by the fix loads on base.
3. **The deterministic test reproduces the race without load or timing luck.**
   - Tab B starts a brew (storage holds `running`).
   - Before tab A has taken in that write, A saves its intention.
   - Assert storage still holds B's running session, and that both tabs end with the brew and one record.
   - **It must FAIL on base** (current integration `f2298d3`, and `4d36939`) **and PASS on the fix.** Show both runs.
4. **`integrity:309` unchanged:** **20/20 under load** on the fix (`--workers=2` plus CPU burners, as in `review/FINAL/scripts/LR-stress.sh`, with `--repeat-each=20`).
5. **Audit `store.ts`:** list every other function that writes the whole state the same way (a `set` whose persisted state can carry a stale `status`/`sessionId`/`endsAt` from a tab that has not yet taken in another tab's write), with file:line and the trigger. **Do not fix them** unless LEAD-5 rules one to be the same bug.

## Proof (own runs, through the gate)

- tsc and vitest.
- The new test: fail on base, pass on fix.
- `integrity:309` 20/20 under load.
- The whole `integrity.spec.ts` once.
- `w2-home` (the composer) and `timer.spec.ts` (the `timer-app` / `timer-harness` projects).

A Sonnet regression lane then runs timer/PWA, the full integrity suite, the notice suite and the 2-tab manual check.

## Rules

- **Commits:** commit locally in stages on `pe/w3r1-f1-intention`; never push. Never `pkill -f`. Trailers as usual; no model names.
- **Browsers:** every browser run goes through the slot gate `--lane F1X --n 1|2`. The Sonnet backdrop investigator runs in parallel.
- **Packet:** your worktree has no contracts folder, so the packet and evidence go straight into the integration checkout. Write `/home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/F1FIX/F1FIX-READY.md` in stages, with evidence beside it (logs as `.log.txt`, ≤ 20 MB). Commit each stage with `/tmp/rv7-servers/commit-evidence.sh kettle/review/product-excellence/contracts/W3R1/F1FIX "<message>"`.
- **Budget:** 2.5 h. Hard stop **11:30 UTC**.
