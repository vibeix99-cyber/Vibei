# I02 — Recoverable End and task disposition · READY FOR REVIEW

- **Maker:** M1. Branch `pe/m1`, worktree `/home/user/wt/m1/kettle`.
- **Revision:** the commit that adds this file (`git log -1 --format=%H -- kettle/review/product-excellence/contracts/I02/READY-FOR-REVIEW.md`),
  message `I01 I02 I03 READY FOR REVIEW: …`. Parent `49fcb3d`.
- **Diff base:** `c80d068` (app source identical to `8f1044a`).
- **Proposed state:** **CLOSED — PASSES WITHOUT CHANGE.** Every I02 behaviour already held on the base revision; no
  application code was changed for I02. No confirmation was added (none was missing: End already confirms; Done/Carry are
  reversible in place; nothing else is destructive).

## Changed files (for I02)

| File | Change |
|---|---|
| `tests/integrity.spec.ts` | I02 tests (5 tests, `test.describe('I02 End, dismissal and task disposition')`). |
| `docs/areas/timer.md` | End / leaving the screen / Skip break / Next brew policies in the "Integrity policies" table. |

## Commands run and results

| Command | Result | Log |
|---|---|---|
| `KETTLE_PORT=5221 KETTLE_PWA_PORT=5231 npx playwright test --project=chromium tests/integrity.spec.ts` (final tree) | 20/20; I02 tests 10–14 ✓ | `../I01/runs/integrity-e2e-on-fix.txt` |
| same spec on a clean `c80d068` copy | I02 tests 10–14 ✓ (unchanged behaviour) | `../I01/runs/integrity-e2e-on-base.txt` |
| `npx tsc --noEmit --pretty false`; `npx vitest run` | exit 0; 265/265 (incl. `src/app/intention.test.ts`) | `../I03/runs/unit-on-fix.txt` |

## Policy table (actual semantics, verified)

| Action | What happens |
|---|---|
| **End** during focus | Sheet "Leave the kettle early?". Esc, backdrop tap and **Keep brewing** close it and the brew runs on untouched (same `sessionId`, same `endsAt`). |
| End confirmed, ≥ 1 active minute (`MIN_RECORDABLE_MS`) | Sheet says "your minutes still count … 12 minutes of focus will be saved". Saved as **one unfinished** record (`completed:false`), `focusedMs` = active minutes (paused time excluded), **1 leaf per whole minute** (`focus:<id>` = 12), **no full-brew bonus**, cycle count unchanged, toast "Saved 12 minutes of focus", task kept on Home ("Carried from your last brew"). |
| End confirmed, < 1 minute | Sheet says it's "under a minute, so there's nothing to save yet"; nothing is recorded; toast "Kettle's off. See you soon." |
| Leaving the session screen (Back, tab bar/another route, reload on Home) | Never stops the brew; on load an active brew owns the screen; Home shows "Your kettle's on" + **Back to your brew**. |
| Summary **Done** | Marks the record's outcome `done` and clears the next brew's task. Tapping it again takes it back (outcome cleared, task restored). |
| Summary **Carry forward** | Outcome `carried`; the task waits on Home ("Carried from your last brew"). Reversible the same way. |
| Home **Mark "…" done** → **Undo** | Done, then Undo restores `carried` and the task text. |
| Editing the carried task on Home | Changes only the next brew's task; the past record keeps its words. No focus record is created. |
| **Tea time → Start next brew** | Break ended as a skip (**not recorded**); next brew starts with the same task. |
| Break runs out → "Break's over" → **That's all for now** | The completed break is recorded (`shortBreak:true`); home. |
| **Skip break** on the summary | Home; no break started or recorded. |
| **Skip break** during a (long) break | Home; the break is not recorded. |

## Coverage map (observable success → test → result)

| Clause (MASTER_EVIDENCE_MATRIX I02) | Test | Result |
|---|---|---|
| A task can be **carried forward** … without a second focus record | `Done / Carry forward are reversible; the carried task returns on Home; editing it and Mark done → Undo never add a focus record` | PASS (base + fix) |
| … or **recovered through editing** without a second focus record | same test: edit → still 1 focus record; the next brew records 1 new record with the edited words; the old one keeps `outcome:'carried'` | PASS |
| **Early-end effort** follows the documented policy | `End early after 12 active minutes (with a pause): 12 minutes saved as an unfinished brew, 12 leaves, no full-brew bonus, task kept`; `End within the first minute: the sheet says nothing will be saved, and nothing is` | PASS |
| **Dismissal never silently resets** an active brew | `dismissing the End sheet (Esc, backdrop, Keep brewing) or leaving the screen never stops the brew` | PASS |
| Skip break / next brew / finish for now (PRESERVE 6) | `Skip break, Next brew and That's all for now do what they say, and never record a skipped break` | PASS |
| Guard: compact choices, immediate rest, confirmation only for destructive actions | No UI changed. End (destroys the running brew) is the only confirmed action; Done/Carry stay one tap and reversible. | Preserved |

## References opened (Read tool) — transfer / do not copy

- **K02** `VISUAL_BENCHMARK_LIBRARY/assets/current/07-summary.png`: compact Done / Carry forward + immediate Tea time.
  Transfers: consequences visible without extra steps (verified: both toggles reversible in place, `aria-pressed` reflects
  state). Do not copy into a carousel or forced claim; nothing changed.
- **B05** `research/videos/sYRhXB_ZcLI/frames/PW-03.png`: a paywall timeline that states each consequence and how to cancel.
  Transfers: say plainly what an action does — the End sheet already states the minutes that will be saved (or that nothing
  will). Do not copy: trial/billing mechanics.

## Notes

- One test locator was made stricter during the final run (`heading 'Break's over', level 2`) because the screen also has
  an sr-only `h1` with the same name; behaviour unchanged.

## BLOCKED / UNKNOWN

- None for the functional contract. Touch-specific gestures (swipe-to-dismiss on a real phone) are not emulated; the sheet's
  dismissal paths tested are Esc, backdrop click and the button.
