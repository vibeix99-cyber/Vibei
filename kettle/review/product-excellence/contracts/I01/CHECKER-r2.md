# I01 — Reliable session time and exactly-once completion · CHECKER r2

**Verdict: APPROVE**

- **Reviewed commit:** `a6ebe00` (branch `pe/m1`; `a6ebe00:kettle/src` = `e2d8326b6aa3b15b609eb1c8e76bda5f68b38d53`).
  Diff base `c80d068`; r1 submission `6d5969e` (I01 APPROVED by Checker r1, re-confirmed here because code changed).
- **Checker:** independent round-2 checker; did not build this work; no application or maker files edited.
- Worktrees: `/home/user/wt/chk-m1` @ `a6ebe00`, `/home/user/wt/chk-m1-r1` @ `6d5969e` (both removed after review).

## What changed since r1 (scope of the re-check)

- `git diff 6d5969e a6ebe00 -- kettle/src` touches **only `src/app/flow.ts`** (the I03 save-failed warning). 
  `git diff --stat 6d5969e a6ebe00 -- kettle/src/timer kettle/src/progress kettle/src/lib` is **empty**. So the
  Checker r1 condition for a full I01 re-check ("if the I03 correction touches `src/timer/**` beyond flow-level toast
  handling") is not triggered.
- The only additions on I01 paths are `recheckSaveWarning()` calls at the top of the `timer:start`, `timer:complete`
  and `timer:sync` handlers. Read: they return immediately when no warning exists (`if (!warning) return;`), otherwise
  only queue a microtask + a 60 ms timeout that dismiss/show a toast. They cannot throw, reorder or skip the handlers'
  routing, whistle or completion logic.

## What I ran (on `a6ebe00`)

| Command | Result |
|---|---|
| `npx tsc --noEmit --pretty false` | exit 0 |
| `npx vitest run` | 26 files, **265/265** passed (incl. `multitab`, `dst`, `store`, `storageFull` tests) |
| `KETTLE_PORT=5251 KETTLE_PWA_PORT=5261 npx playwright test --project=chromium tests/integrity.spec.ts` | **25/25** passed (4.4 min); I01 tests 1–9 ✓ |
| `KETTLE_PORT=5251 KETTLE_PWA_PORT=5261 npx playwright test --project=timer-harness --project=timer-app` | **26 passed, 2 skipped** (3.0 min). The 2 skips are by design (`test.skip(!kettlePage.includes('harness'))`: keyboard-infra and render-budget run in the harness project only). |
| Own probe `probe-i0102.mjs` (scratch, outside repo; 390×844 dpr 2, real touch taps, full motion, my dev server on 5211 serving `a6ebe00`) | **PASS** — see below |

Independent probe results (not the maker's tests): +5 by tap → reload: same `sessionId`, identical `endsAt`,
`addedMs` 300000, still on `#/focus` · Pause by tap → 1.5 s → reload: still paused, `remainingMs` identical → Resume:
`endsAt = now + remaining` (±1.5 s), moved later by the pause · second page in the same context, leader fast-forwarded to
the end: both tabs reach `#/done`; stored records for the session = **1** (`completed: true`), grants unique
(`focus=30`, `full=5`) · reload on the summary: summary back, one `h1`, no second record or grant · Tea time tapped in
tab 2 moves tab 1 to the tea break too.

## What I opened

- `MASTER_EVIDENCE_MATRIX.md` § I01, `PRESERVE_LIST.md`, `PROTOCOL.md`, `M1-BRIEF.md`, `I01/CHECKER-r1.md`,
  packet `a6ebe00:…/I01/READY-FOR-REVIEW.md`.
- Full `git diff c80d068 a6ebe00 -- kettle/src` and `git diff 6d5969e a6ebe00 -- kettle/src kettle/tests kettle/docs`;
  `src/app/flow.ts` at `a6ebe00` (whole file); `docs/areas/timer.md` "Integrity policies" + "Storage full".
- No visual change in I01 (K04 / B03 are referenced by the packet only); no capture review needed for I01.

## Per-criterion findings (matrix: Observable success)

| Clause | Finding |
|---|---|
| Started sessions survive reload | PASS — e2e 2, 10 + my probe (+5 → reload, same `endsAt`). |
| Paused sessions survive reload | PASS — e2e 1 + my probe (paused across reload, remaining kept, deadline moves by the pause). |
| Extended sessions survive reload | PASS — e2e 2 + my probe. |
| Survive suspension | PASS — e2e 3, 4 (raw-CDP Page Lifecycle freeze) re-run green. |
| Survive late return | PASS — e2e 5, 6 re-run green. |
| Repeated completion attempts → one record | PASS — e2e 7, 8 + my probe (reload on summary). |
| Duplicate tabs → one record | PASS — e2e 9 + unit `multitab.test.ts` + my two-page probe (1 record, unique grants). |
| Under the documented policy | PASS — `docs/areas/timer.md` policy table matches observed behaviour. |
| No unsupported background-audio guarantee | PASS — unchanged since r1 (no copy change); the M2 note (Settings + the two welcome strings) stands. |
| Clock edge cases mapped, not duplicated | PASS — `dst.test.ts`, `store.test.ts` green. |
| BLOCKED / UNKNOWN honesty | Honest: real mobile OS suspension/kill, hidden-page audibility, Firefox/Safari not proven here. |

## Notes (non-blocking)

- Checker r1 note on the `sync.ts` per-key "last write failed" guard (a tab that missed another tab's `storage` event
  could keep an older timer) is unchanged and remains a documented residual risk, not reproducible in Chromium.
- Storage-full interaction with I01 paths (warning placement during a brew, at completion, across tabs) is graded in
  `../I03/CHECKER-r2.md`; it never altered completion: in every storage-full probe the brew completed once.

## Preserve List

PRESERVE 3, 4, 6: timer engine, leader/claims, whistle beat, summary and Tea time untouched since r1. PRESERVE 11:
storage keys/format unchanged. PRESERVE 12: existing timer e2e and multitab unit tests green.
