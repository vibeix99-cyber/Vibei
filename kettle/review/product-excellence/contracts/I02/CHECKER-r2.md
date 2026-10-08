# I02 — Recoverable End and task disposition · CHECKER r2

**Verdict: APPROVE**

- **Reviewed commit:** `a6ebe00` (branch `pe/m1`; `a6ebe00:kettle/src` = `e2d8326b…`). Diff base `c80d068`; r1 `6d5969e`
  (I02 APPROVED by Checker r1; re-confirmed here because code changed).
- **Checker:** independent round-2 checker; did not build this work; no application or maker files edited.

## What changed since r1

Only `src/app/flow.ts` (the I03 save-failed warning) — End sheet, Done / Carry forward, Skip break, Next brew, That's
all for now, carried-task and Home code are byte-identical to r1 and to base. The r1 caveat for I02 was that the I03
warning covered End / Pause / Resume (and could cover Tea time) in the storage-full state; that is re-checked below and in
`../I03/CHECKER-r2.md` (now fixed).

## What I ran (on `a6ebe00`)

| Command | Result |
|---|---|
| `npx tsc --noEmit --pretty false` / `npx vitest run` | exit 0 / 265/265 (incl. `src/app/intention.test.ts`) |
| `KETTLE_PORT=5251 KETTLE_PWA_PORT=5261 npx playwright test --project=chromium tests/integrity.spec.ts` | 25/25; I02 tests 10–14 ✓ |
| Timer suites `--project=timer-harness --project=timer-app` | 26 passed, 2 by-design skips |
| Own probe `probe-i0102.mjs` (scratch; 390×844 dpr 2, real touch taps, full motion) | **PASS** |
| Own probes A/B (I03 file) — storage full, real touch taps | End / Pause / Resume / Add 5 / Tea time / Skip break all work at 390×844 and 375×667 (both themes) and 1440×900 |

Independent probe results: End sheet → **Esc**, then End → **Keep brewing**, then leaving to Stats: same `sessionId`, same
`endsAt`, still running · summary **Done** → tap again → **Carry forward**: outcome `done` → cleared → `carried`, one
stored focus record · Tea time from the second tab → break; **Skip break** during the break → Home, no break recorded,
still one focus record; carried task "Checker task" back in the field · next brew, 12 active minutes, End → sheet text
"12 minutes of focus will be saved" → confirm: one record `completed: false`, `focusedMs` 729 s, grants exactly
`focus=12`, no `full:` bonus.

Storage full (I03 probes B, A): on phones Add 5 adds 5 min, Pause pauses, Resume resumes, **End opens the End sheet,
0 downloads**; Keep brewing keeps the brew; End → confirm saves the minutes ("Saved 1 minute of focus"); Tea time starts
the break; Skip break goes home. Desktop: the End sheet's Keep brewing / End session hit-test clear with the warning up.

## What I opened

- Matrix § I02, `PRESERVE_LIST.md` (6, 7), `I02/CHECKER-r1.md`, packet `a6ebe00:…/I02/READY-FOR-REVIEW.md`, I02 test
  bodies in `tests/integrity.spec.ts`, `src/screens/focus/parts/EndSheet.tsx`, `src/ui/Sheet.tsx` (Esc handling).
- **K02** `VISUAL_BENCHMARK_LIBRARY/assets/current/07-summary.png` against the r2 summaries
  `I03/captures/after/*/s1b-warning-before-end-summary.png` (all six configs) and my own probe screenshots
  (`a3-summary.png` 390×844 dark, 375×667 light, 1440×900 light/dark): compact Done / Carry forward + immediate
  Tea time · 5 min / Skip break footer, unchanged from K02 (no carousel, no forced claim, no added confirmation), and
  no warning over it.

## Per-criterion findings

| Clause | Finding |
|---|---|
| Carried forward without a second focus record | PASS — e2e 13 + my probe (1 focus record, task back on Home). |
| Recovered through editing without a second focus record | PASS — e2e 13 (edit, Mark done → Undo, next brew adds exactly one). |
| Early-end effort follows the documented policy | PASS — e2e 11, 12 + my probe (12 min, `completed:false`, `focus=12`, no bonus). |
| Dismissal never silently resets an active brew | PASS — e2e 10 + my probe (Esc, Keep brewing, leaving the screen). |
| Skip break / Next brew / finish for now (PRESERVE 6) | PASS — e2e 14 + my probe (skipped break never recorded). |
| Controls stay usable in the storage-full state (r1 caveat) | PASS — see I03 r2 probes A/B: nothing covers or intercepts these controls any more. |
| Guard: compact choices, immediate rest, confirmation only for destructive actions | PASS — no I02 UI change; End is still the only confirmed action. |
| BLOCKED / UNKNOWN honesty | Honest: swipe-to-dismiss on a real phone not emulated. |
