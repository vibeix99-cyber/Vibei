# W3R4 CHECKER (LEAD-8): case-collision fix

Branch `pe/w3r4-case-collision@e0ed43d` (worktree /home/user/wt/w10, base `d8b475e`), commits `9ea9fb1` (renames) + `e0ed43d` (typings).
Trial `ff795a6` (/home/user/wt/w10tr, dev :5643). I made no code changes. The branch and the trial were only read.

## 1. No behaviour change: PASS
- `git diff -M d8b475e..e0ed43d` read in full: 14 files, +71/-14.
- The moved modules are byte-identical. Each pair has the same blob, base vs branch:
  - `app/saveWarning.ts` -> `app/saveWarningState.ts`: `dcd2892…` = `dcd2892…`
  - `screens/done/summary.ts` -> `screens/done/summaryModel.ts`: `ee6fe55…` = `ee6fe55…`
  - In both moved tests, the only change is the import line (similarity 98%).
- Every importer is updated: `flow.ts`, `SaveWarning.tsx`, `Summary.tsx`, `rank.test.ts` and both tests. Comments and docs are updated too: `Summary.tsx` header, `Summary.module.css`, `tests/integrity.spec.ts`, `docs/areas/timer.md`, `docs/areas/core-loop.md`.
- I ran `git grep` at e0ed43d over the repo, excluding `kettle/review`, for `saveWarning.ts`, `done/summary.ts`, `./summary'` and `from './saveWarning'`. The only hit is the guard's own header comment (`SaveWarning.tsx` vs `saveWarning.ts`), which names the old bug on purpose and is correct.
- The trial's `kettle/src` is identical to e0ed43d, so the trial runs exactly this fix.

## 2. Collision scan of kettle/ (excluding review/): PASS
- I ran my own scan over the trial tree on disk (475 paths, no node_modules/dist/test-results) and the branch tree on disk (476 paths). I also scanned every tracked path and its parent directories in `kettle/` except `review/`, ignoring case and `.ts/.tsx/.js`. Result: 0 collisions. This matches the packet: only the two pairs existed, and both are fixed.

## 3. Ambient `src/caseCollision.node.d.ts`: PASS (one advisory)
- It is a global script, with no top-level import or export, so its `declare module 'node:fs' | 'node:path' | 'node:url'` blocks are true ambient declarations. They are not augmentations.
- No real typings exist that it could shadow: there is no `@types/node`, `tsconfig` sets `types: ["vite/client"]`, and no `.d.ts` in node_modules declares those modules. If `@types/node` is added later, the declarations merge as overloads. They would not conflict.
- Only types are affected. The built bundle (`/tmp/rv7-servers/dist-w10tr`) has no `caseCollision` or `readdirSync`. Vite does not compile `.d.ts`, and Vitest does not collect it (the name does not end in `.test.ts`).
- It is in the right place. `tsconfig` includes only `src`, so the declarations have to sit under `src/` for tsc to see the test's imports. Putting the file next to the guard, with a self-describing name, is reasonable.
- Advisory, not a defect: the declarations are global, so app code could now `import 'node:fs'` and still typecheck, then fail in the browser. `chaiModel.test.ts` avoids this by importing node modules dynamically without types. Nothing in the app imports `node:` today. Optional hardening is a lint or grep rule against `node:` imports outside `*.test.ts`.

## 4. Guard (`src/caseCollision.test.ts`): PASS
- The rule matches Vibei's. It walks every file and directory under `kettle/src`, including untracked ones and excluding node_modules. Its key is the path, lowercased, with a trailing `.ts|.tsx|.js|.jsx|.mjs|.cjs` removed. Any two paths with the same key fail the test. This covers everything Vibei listed (`.ts/.tsx/.js`) and also `.jsx/.mjs/.cjs`, so it is slightly stricter, which is harmless. It catches directory clashes, as its self-check shows.
- It catches both pairs on the base. I made a scratch copy (`git archive d8b475e kettle/src` into my scratchpad), added the trial's configs, symlinked node_modules and added the two guard files, then ran `vitest run src/caseCollision.test.ts`. It failed with:
  `app/SaveWarning.tsx  <->  app/saveWarning.ts` and `screens/done/Summary.tsx  <->  screens/done/summary.ts` (1 failed, 1 passed: the self-check).
- On the trial it passes. The full suite is part of `npm test`, so it fails CI when a collision appears.

## 5. tsc / unit / build: PASS
- In the trial: `tsc --noEmit` exit 0, and `vitest run` gave 35 files, **344/344** passed.
- Build: the orchestrator's build output `dist-w10tr` is present. I checked that the guard and its typings do not reach the bundle.

## 6. Today loads on :5643: PASS
- I used Playwright with Chromium from /opt/pw-browsers, through the slot gate (lane LEAD8, n 1). The fresh context was seeded with onboarded `kettle:settings`, as in the specs.
- `#/` showed Today: nav, "Good afternoon", the first-brew card and the task field. Screenshot: `checker-today-5643.png`.
- **0 console errors and 0 page errors while Today loaded.** In the same page, dynamic imports of `/src/app/SaveWarning.tsx` (`SaveWarningBanner` is a function), `saveWarningState.ts`, `Summary.tsx` and `summaryModel.ts` all resolved with the expected exports.
- My probes of the old paths `/src/app/saveWarning.ts` and `/src/screens/done/summary.ts` then returned 404. This proves the old files are gone. These two 404s are the only console errors the run logged, and both come from my deliberate probes.
- The browser was closed. The :5643 dev server was already running for the orchestrator, so I did not start or stop it.

## 7. `kettle/review/` Windows-name report: PASS (one note)
- Repo HEAD is now `dad452d`, with 21221 tracked paths. The packet saw 21218, before the later auto-commits.
- I listed paths with `git ls-tree -r -z`. Exactly **9** contain a Windows-invalid character, and the only such character is `*`. They are the nine `round6-review/L2/raw/<run>/*.frames.json.gz` paths the packet lists, and the count was also 9 at d8b475e.
- There are no trailing dots or spaces, no reserved device names, and no case-only duplicates inside `review/`. Nothing was renamed, which is correct.
- Note: the packet's "longest 216 chars" is the length of git's *quoted* form, which writes `×` as `\303\227`. The real longest path is **207** characters. Either way it is under 260. Paths containing `×` are valid on Windows, so the six quoted hits a naive non-`-z` scan finds are false positives. The packet correctly left them out.

## Housekeeping
- The scratch base copy was in my scratchpad and has been deleted. No server, browser or background process of mine is left running.

## Verdict: **APPROVE**
The renames are pure (`git mv`) and every reference is updated. No case-only collisions remain in `kettle/` outside `review/`. The guard follows Vibei's rule, fails on the base with exactly the two pairs and passes on the trial. tsc is 0, vitest is 344/344, and the ambient typings stay out of the bundle. Today loads on :5643 with no console error. The `review/` report is accurate: 9 `*` paths. The advisory about the global node typings and the corrected path length are notes only, not required fixes.
