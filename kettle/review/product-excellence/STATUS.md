# Product Excellence — execution status (durable checkpoint)

Resume here after any interruption. Do not overwrite past verdicts; append.

## Authority and restore point

- **Authorized:** user execution authorization, 2026-10-07 ("BEGIN THE KETTLE PRODUCT EXCELLENCE BUILD").
- **Source of truth:** approved package `INTEGRATED-2026-10-06` (independent APPROVE 131/140; all 28 reviewed canonical hashes verified in preflight). Extracted locally at `kettle/.tmp/pkg/kettle-excellence-integrated/` (git-ignored; not app source).
- **Protected pre-rebuild restore point:** `8f1044a` (local annotated tag `pre-product-excellence`; the session's git proxy refuses tag pushes, so on the remote it stays reachable as an ancestor of the integration branch, which is never rewritten). Never reset or rewrite past it.
- **Integration branch:** `claude/wizardly-galileo-uy89d9`. Maker branches are local `pe/*` worktrees, merged only after an independent APPROVE.
- **Orchestrator / model:** Claude Opus 5.5 (`claude-opus-5-5`, verified via session metadata). Makers, Checkers and the Final Product Boss are separate agent instances with their own context; a Checker never reviews work it built.

## Recovered state at start (revision 8f1044a)

- Working tree clean; `8f1044a` = `0532913` code (empty diff) + checkpoint commit.
- Accepted, preserved work (COMPLETE, protected by PRESERVE_LIST): round 6 implementation (`eeff3a0`), follow-up 1 (`0532913`: phone summary room, wrapping Home tags, record-player drawing → close-up).
- Checks at 8f1044a (from the follow-up-1 run): tsc clean · vitest 256/256 · Playwright e2e 29 passed / 2 skipped · core-loop checker 85/85.
- Contract states at start: **I01–I15 NOT STARTED** (no prior Product Excellence work exists).

## Contract board

| ID | Pri | Owner | State | Evidence / verdict |
|---|---|---|---|---|
| I01 Reliable time, exactly-once completion | P0 | M1 | NOT STARTED | |
| I02 Recoverable End and task disposition | P0 | M1 | NOT STARTED | |
| I03 Data safety, truthful storage consequences | P0 | M1 | NOT STARTED | |
| I04 Access and short-screen reachability | P0 | M2 | NOT STARTED | gate: retest after all UI work |
| I05 Real whistle, mute, ambience expectations | P0 | M2 | NOT STARTED | real-device cases BLOCKED in this environment |
| I06 Crisp approved Chai | P1 | M4 | NOT STARTED | |
| I07 Effort → leaves → level → Nook, once | P1 | M3 | NOT STARTED | |
| I08 Plain purpose, first useful brew | P1 | M3 | NOT STARTED | |
| I09 Persistent Nook outcome and fallback | P1 | M3 | NOT STARTED | |
| I10 Calm state feedback | P2 | M4 | NOT STARTED | conditional |
| I11 Consistent settings and controls | P2 | M5 | NOT STARTED | conditional |
| I12 Truthful history and Stats | P2 | M5 | NOT STARTED | conditional |
| I13 Supportive return | P2 | M3 | NOT STARTED | conditional |
| I14 Measured responsiveness | P2 | M2 | NOT STARTED | baseline before any art/motion change; real-device BLOCKED |
| I15 Bounded comprehension check | P3 | M3 | NOT STARTED | only if I07/I08 comprehension stays uncertain |

## Waves and file ownership

| Wave | Maker | Contracts | Owns (exclusive while active) |
|---|---|---|---|
| 1 | M1 Session and data integrity | I01, I02, I03 | `src/timer/**` (except `notify.ts`), `src/progress/**` (logic, not UI), `src/app/{flow,intention}.ts`, `src/lib/storage.ts`, `src/screens/settings/DataSection.tsx`, new tests |
| 1 | M2 Access and device quality | I04, I05, I14 baseline | `src/ui/**`, `src/styles/**`, `src/audio/**`, `src/timer/notify.ts`, a11y/layout fixes in `src/screens/**` other than M1's files, new tests and measurement tools |
| 2 | M3 Activation and progression clarity | I08, I07, I09 (+I13, I15 later) | `src/screens/{welcome,home,done,nook}/**` (copy/hierarchy), `src/scene/index.tsx` fallback |
| 2 | M4 Chai and calm feedback | I06 (+I10 later) | `src/art/**`, Chai asset pipeline |
| 3 | M5 Existing system and secondary utility | I11, I12 (if warranted) | `src/screens/{settings,stats}/**` |

## Tools

- Capture: `node review/product-excellence/tools/capture.mjs --base <url> --out <dir> --w <w> --h <h> --dpr <n> --theme light|dark [--rm] [--only ids]` (22 states, writes `capture-meta.json`).
- Dev servers: orchestrator 5191 (main checkout). Makers: M1 5201, M2 5202, M3 5203, M4 5204, M5 5205. Checkers 5211+.

## Log

- 2026-10-07: preflight passed; execution authorized. Package extracted to `.tmp/pkg`. Capture tool written and smoke-tested. BEFORE baseline capture started (6 viewport/theme configs + reduced motion).

## Exact next action

Finish BEFORE baseline → inspect it → write maker briefs → launch Wave 1 (M1, M2) in isolated worktrees.
