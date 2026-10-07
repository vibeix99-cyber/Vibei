# I02 — Recoverable End and task disposition · CHECKER r1

**Verdict: APPROVE**

- **Reviewed commit:** `6d5969e` (branch `pe/m1`), diff base `c80d068`.
- **Checker:** independent; did not build this work; no application or maker files edited.
- **Scope of approval:** I02 semantics (End, dismissal, Done / Carry forward, carried task, editing, Skip break,
  Next brew, That's all for now) at `6d5969e`. No application code was changed for I02. I03 is rejected in r1; two of
  its defects touch I02 controls **only in the storage-full state** (the I03 warning covers End / Pause / Resume on
  phones, and can cover Tea time — see `../I03/CHECKER-r1.md`, defects A and B). They are graded under I03, whose code
  introduced them. Because the I03 correction will create a new commit, this approval must be re-confirmed there by
  re-running `tests/integrity.spec.ts` (tests 10–14 at minimum).

## What I ran

| Command | Result |
|---|---|
| `npx tsc --noEmit --pretty false` / `npx vitest run` (fix) | exit 0 / 265/265 (incl. `src/app/intention.test.ts`) |
| `KETTLE_PORT=5251 KETTLE_PWA_PORT=5261 npx playwright test --project=chromium tests/integrity.spec.ts` (fix) | 20/20; I02 tests 10–14 ✓ |
| same spec on base `c80d068` (`KETTLE_PORT=5252 KETTLE_PWA_PORT=5262`) | I02 tests 10–14 ✓ (behaviour already held; "passes without change" is true) |
| Timer suites `--project=timer-harness --project=timer-app` (fix) | 26/26 |
| Checker probe P6 (390×844 touch, storage full) | tap on End's position while the I03 warning is up starts a backup download, End sheet does not open — I03 defect B, storage-full state only |

## What I opened

- Matrix § I02, `PRESERVE_LIST.md` (6, 7), packet `I02/READY-FOR-REVIEW.md`, I02 test bodies (lines 499–676 of
  `tests/integrity.spec.ts`), `docs/areas/timer.md` policy rows for End / leaving / Skip / Next brew.
- **K02** `VISUAL_BENCHMARK_LIBRARY/assets/current/07-summary.png` and the AFTER summaries
  `I03/captures/after/phone-390x844-dark/s1-…png`, `phone-375x667-light/s1-…png`, `desktop-1440x900-light/s1-…png`
  plus my own recapture at `6d5969e` (375×667 light): compact Done / Carry forward + immediate Tea time / Skip break
  footer are unchanged from K02 (no carousel, no forced claim, no added confirmation).

## Per-criterion findings

| Clause | Finding |
|---|---|
| Task carried forward without a second focus record | PASS — Carry sets `outcome:'carried'`, stored focus records stay 1; task returns on Home with "Carried from your last brew". |
| …or recovered through editing without a second focus record | PASS — Done → tap again restores (outcome cleared, task restored); Home "Mark done" → Undo restores `carried`; editing the carried task leaves 1 focus record; the next brew adds exactly 1 new record with the edited words while the old one keeps its words and `carried`. |
| Early-end effort follows the documented policy | PASS — End after 12 active min with a 5-min pause: sheet states "12 minutes of focus will be saved", one `completed:false` record, `focusedMs` 12–13 min (pause excluded), grant `focus:<id>=12`, no `full:` bonus, cycle unchanged, task kept. < 1 min: sheet says nothing will be saved; nothing stored. Matches `MIN_RECORDABLE_MS` policy written in `docs/areas/timer.md`. |
| Dismissal never silently resets an active brew | PASS — Esc, backdrop, Keep brewing, browser Back, route change, reload on Home: same `sessionId` and `endsAt` each time; "Back to your brew" returns. |
| Skip break / Next brew / That's all for now (PRESERVE 6) | PASS — skipped breaks never recorded; completed break recorded `shortBreak:true`; long-break Skip goes home unrecorded. |
| Guard: compact choices, immediate rest, confirmation only for destructive actions | PASS — no UI changed for I02; End (destroys the running brew) is the only confirmed action. |
| BLOCKED / UNKNOWN honesty | Honest: swipe-to-dismiss on a real phone not emulated. |

Tests are behavioural (stored records, ledger ids, `aria-pressed`, field values), not implementation mirrors. The one
locator tightening (`'Break’s over', level 2`) is justified by the sr-only `h1` duplicate.
