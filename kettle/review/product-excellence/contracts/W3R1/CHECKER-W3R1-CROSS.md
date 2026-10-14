# CHECKER W3R1 · Cross-effects of the combined trial (F + S + G + N)

**Finding: no proven combined-only cross-effect.**
- **Four tests were seen failing on the combined trial.** Each is attributed below to an owner by file.
- **One has a proven cause:** S-D1 (closed in S's fix round).
- **One is a flaky test now on the integration branch:** G's pressed-segment test. It needs one test-only change before the final regression (§2, X-2). G's APPROVE stands.
- **Two are one-off or rare load sightings,** carried to F's fix verdict and to the final regression.

| | |
|---|---|
| Lead checker | LEAD-5. I implemented none of this work |
| Combined trial | `e478604` = integration + F `5ee3e7c` + S `344069c` + G `808421d` + N `4168428` (worktree `/home/user/wt/w5tr-all`, src `07c26ff`; dev :5520, preview :5530). It predates G's and S's fix rounds and F's |
| Lane R | `review/LR/ALL/RECEIPT-LR-ALL.md` (complete; six stages, last commit `283ae93`), raw evidence beside it |
| Since then | N `3faaf94` and G `25b5e26` (= `7f95c18`) merged; docs `a859d86`. S's fix `697c1eb` (`CHECKER-W3R1-S.md` §8). F's fix round running |

## 1. What Lane R ran, and what I checked

**The chromium project:** 244/244 tests matched against `--list`, run in three parts on `e478604`:
- **A** (load 10–18): 87 passed, 1 failed;
- **B** (load 6–15): 86/86;
- **C** (load 12): 44 passed, 1 failed, 25 skipped (`w3-notices-load`, gated on `W3_LOAD`).

That is **217 passed, 2 failed, 25 skipped** in the union. Timer, harness and PWA: 29 passed, 2 skipped by design.

**The four failures** were each rerun alone on combined, on base and on the owner's trial (batch 1), then repeated (batch 2, load 5–11). I read the receipt in full, including its rerun tables (§3, §3b, §3c) and its unproven list (§5). For S's case (X-4) I add my own probe's result: the mechanism.
