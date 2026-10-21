# W3R4 CC-READY: case-collision fix

Branch pe/w3r4-case-collision (base d8b475e), worktree /home/user/wt/w10.

## Changes (no behaviour change)
- git mv src/app/saveWarning.ts -> saveWarningState.ts; saveWarning.test.ts -> saveWarningState.test.ts
- git mv src/screens/done/summary.ts -> summaryModel.ts; summary.test.ts -> summaryModel.test.ts
- Imports and comments/docs updated: flow.ts, SaveWarning.tsx, Summary.tsx, Summary.module.css, rank.test.ts, tests/integrity.spec.ts, docs/areas/timer.md, docs/areas/core-loop.md.
- Guard: src/caseCollision.test.ts (+ src/caseCollision.node.d.ts, typings for node built-ins; app has no @types/node).

## Collisions (tracked + untracked, kettle/ excluding review/, ext-agnostic, files and dirs)
1. src/app/SaveWarning.tsx <-> saveWarning.ts: renamed the .ts to saveWarningState.ts
2. src/screens/done/Summary.tsx <-> summary.ts: renamed the .ts to summaryModel.ts
No others (no directory-level clashes, no untracked files).

## kettle/review/ Windows-invalid names (report only; 21218 paths)
- 9 paths with a literal `*` in the name: round6-review/L2/raw/{desk-INT-v0,desk-R6-v0,nat-R6,read-INT-coarse,read-R6-coarse,read-R6-extra,read-R6-land,read-R6-phones-dark,read-R6-phones-light}/`*.frames.json.gz`
  (under kettle/review/product-excellence/contracts/I04/integration-fix/). These cannot be checked out on Windows.
- No trailing dot/space, no reserved device names. Longest repo-relative path 216 chars (none over 260).

## Guard proof
- Base layout (renames reverted): FAIL, message:
  `app/SaveWarning.tsx  <->  app/saveWarning.ts` / `screens/done/Summary.tsx  <->  screens/done/summary.ts`
- On the fix: 2/2 pass. Includes a self-check that a synthetic file pair and dir pair are detected.

## Checks
- tsc --noEmit: 0 errors. vitest full: 35 files, 344 tests pass. vite build to /tmp/rv7-servers/dist-w10: ok.
- Dev server :5641 (slot gate): `/` and Today (onboarded seed) render, 0 console errors, 0 pageerrors. Server stopped by PID.
- playwright tests/integrity.spec.ts -g storage (5641): 8 passed.
