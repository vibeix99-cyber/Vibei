# RECEIPT-LR-POSTMERGE-F1: Lane R, post-merge regression of the F1 fix, raw evidence

Raw evidence only. No verdict. Times are UTC, 2026-10-15. Task received 11:23, box 75 minutes (to 12:38), hard stop 12:50. Written in stages; `*.log` is git-ignored, so logs are saved as `.log.txt`. No source edits, no pushes, only `commit-evidence.sh` for git. No process of mine was killed with a pattern.

## 0. What was tested, and how

| | |
|---|---|
| Tree | integration worktree `/home/user/wt/w6-int` at `f817931`, app `5f78af1`, `kettle/src` tree `b74e6b3`; `git status` clean |
| Servers | dev **:5560** (debug API, `window.__kettle`) and **:5570** (preview) answered 200 at 11:24. `verify.sh /home/user/wt/w6-int 5560`: "PORT 5560 serves f817931 (src b74e6b3): VERIFIED"; the served `src/timer/store.ts` has the same hash as the committed blob (`ecb09baca37315a7`). Old base :5478 / :5488 answered 200 (a control only if something failed) |
| Machine | 4 CPUs; gate maximum 3 browser processes; a second maker lane (N2) shared the machine and the gate. **Load average was 13 to 15 for most of the run** (1-minute average, from 11:31 on; it was 0.6 at 11:24), so every browser run below ran loaded; the load at the start and the end of each run is in its log header and trailer |
| Gate | every Playwright and every manual-script run went through `slots.py run --lane LR`: the notice suite with `--n 2` and two workers; every other job `--n 1`, one worker. Up to three of my jobs were queued side by side; the gate let at most one per lane hold while another lane waited |
| Reused | commands, environment and spec lists from `F1FIX-LR/RECEIPT-LR-F1FIX.md`, pointed at :5560; the 2-tab script is rewritten (below) |
| Scripts | `scripts/`: `LR-common.sh` (the gate helper that writes the load header and trailer), `LR-lane1.sh`, `LR-lane2.sh`, `LR-lane3.sh`, `LR-manual.mjs` |

## 1. Typecheck and unit tests (not browser runs, no gate)

| Check | Command | Result |
|---|---|---|
| tsc | `npx tsc --noEmit -p .` (`runs/tsc.log.txt`) | exit 0, no output, 1.7 s |
| vitest | `npx vitest run` (`runs/vitest.log.txt`) | **33 test files passed (33), 314 tests passed (314)**, 0 failed, exit 0, 4.4 s |

