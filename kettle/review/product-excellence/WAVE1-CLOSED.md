# Wave 1 closed at `90a11e5`

**Date:** 2026-10-11, 19:40 UTC.
**Branch:** `claude/wizardly-galileo-uy89d9`.
**Restore point:** `8f1044a` is untouched.

## What closed it

- **The merge:** `90a11e5` merges `pe/r8-toastroom@2c3172c`. That branch carries:
  - the round-7 combined fix `pe/r7-banner@7ba0d98`: the storage-full warning as an in-page banner, break reach at 200 % text, and the Close fix;
  - round 8's R7-D1 fix: the toast dock in landscape sessions.
- **The approval:** APPROVE on trial merge `9ff0d04` (`kettle/src` `42e106d`), by an independent round-8 lead Checker (Opus 5.5). Receipt: `contracts/I04/CHECKER-integration-fix-r8.md`.
  - Lane receipts: `contracts/I04/integration-fix/round8-review/{L1,L2,LEAD}/`.
  - Gate: `round8-review/GATE.md`.
- **The tree check:** the merged `kettle/src` is `42e106daaf0628ee8429fb6131ab29848931f367`, equal to the trial merge. `kettle/tests` is identical, and **nothing outside `kettle/review/` differs** from `9ff0d04`.

## Wave 1 regression

Lane 2's results stand, because the merged tree equals the trial merge.

| Suite | Result |
|---|---|
| tsc | exit 0 |
| vitest | 267/267 |
| Playwright chromium | **73/74**. The one failure, `statusbar.spec.ts:106` (dark), was a test readiness flake: Today not yet rendered at 7.5 s. It passed 1/1 when rerun alone. Both results are recorded |
| timer-harness + timer-app + pwa | 29 passed, 2 skipped by design (`timer.spec.ts:294`, `:438`, which run in the harness) |

**Captures, R8 against INT, frozen clock:**
- cap-d: 10 configurations, by Lane 2.
- Standard set: light by Lane 2, dark by the lead.
- Every difference is explained, and none comes from round 8 apart from the landscape dock itself.

## Follow-ups (ranked; owners from the verdict)

1. **Third summary chip half-hidden behind the footer at 375×667** (PRESERVE 7 / K02). R8 equals INT. Files: `screens/done/Summary.tsx`, `Summary.module.css`, `summary.ts`. Owner: M2 (I04), with M3 for milestone-first ordering.
2. **Brew length under the docked start, failing tap-target size** (axe `target-size` at rest). At 844×390 the whole control is behind the dock. Files: `screens/home/Composer.tsx` `.ctaDock`, `Home.module.css`. Owner: M2 (I04).
3. **R8-F3:** toasts above the Ambience sheet; its Close and Turn on are covered at 844×390 @200. Same on `b39202f` and INT. Owner: M2.
4. **Folded toasts** hide their icon and their reward amount. Owner: M8 / M2.
5. **The portrait 375×667 @200 three-toast limit.** Owner: M2 / M8.
6. **R8-F1:** a transient clip inside the docked stack (≤ 0.5–0.8 s). Owner: M8 / M2.
7. **R8-F5:** the `statusbar.spec.ts:106` readiness wait. Owner: M2.
8. **Review probes** should retry on "Execution context was destroyed", an automation-channel error under load. Owner: reviewers.
9. **R7-7:** `integrity.spec.ts:1090` should wait for End's toasts. Owner: M7a.
10. **R7-8** (focus on recovery), **R7-9** (second-episode announcement) and **R7-5** (reward toasts over the summary note). Owner: M7a, with M2.
11. **R7-6** (the entrance shade band) and **R7-10** (the Resume rim after Pause at 375×667 @200). Owner: M7b.
12. **Round-6 #3 / R7-11 / R8-F7** (the 200 % landscape strip on Today), **#8** (toasts over the readout), **#10** (1440 lift lag), **#11** (CLS and over-width), **R7-4** and **R8-F4**. Owner: M2 / I04.
13. **R7-12** (the `:768` pill read) and **R7-13** (the `announce.ts` "saved" wording). Owner: M1 (I03).
14. **R7-13:** the End sheet's "will be saved" wording. Owner: the focus area.

**Not started:** Wave 2 and every follow-up; each needs Vibei's authorisation.
