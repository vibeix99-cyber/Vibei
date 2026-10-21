# W3R4 gate record: the Windows case-collision fix (light process)

- **Maker CC** (Sonnet) handed back `pe/w3r4-case-collision@e0ed43d`, src `c9257cd`. Packet `CC-READY.md`.
  - Renamed `saveWarning.ts` → `saveWarningState.ts` and `summary.ts` → `summaryModel.ts`, each with its test.
  - Guard `src/caseCollision.test.ts`, plus `caseCollision.node.d.ts`.
- **Gate:** scope checked. Trial `ff795a6`: tsc 0, vitest 344/344, build OK. The orchestrator's own scan found no case-only duplicates under `kettle/` outside `review/`.
- **LEAD-8** (Opus) **APPROVE** (`CHECKER-W3R4-CC.md`, `7190192`):
  - same blobs, no behaviour change;
  - the guard fails on base with both pairs and passes on the trial;
  - Today loads with 0 errors;
  - the `review/` report is accurate (9 `*.frames.json.gz` paths contain `*`; the longest path is 207 characters, correcting the packet's 216).
  - **Advisory:** the ambient `node:` typings are global, so app code could import `node:` modules and still pass tsc.
- **Merged.** Its src, tests and docs equal trial `ff795a6`'s.
