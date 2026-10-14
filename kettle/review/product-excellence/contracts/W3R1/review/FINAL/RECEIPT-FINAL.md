# RECEIPT-FINAL: Lane R, final regression on the merged tree, raw evidence

Raw evidence only. No verdict, no visual judgement. Times are UTC, 2026-10-14. Task received 20:19; box 120 minutes, to 22:19. Written in stages (one section per commit). `*.log` is git-ignored, so logs are saved as `.log.txt`.
No source edits, no commits to app code, no pushes. Only my own PIDs killed (no `pkill -f`).

## 0. What was tested, and how

| | |
|---|---|
| Tree | integration **`2be3de1`** (merge of F `11a7ac6`; also holds N `3faaf94`, G `25b5e26` + docs `a859d86`, S `0efca36`, X-2 `60fdb7e`), kettle/src `d533342`; worktree `/home/user/wt/w5-final` (HEAD `2be3de1`, `git status` empty at start) |
| Dev / preview | dev **:5540**, preview **:5550** (serves `/tmp/rv7-servers/dist-w5final`, built 20:18:57, after the commit at 20:17:58) |
| Base | `4d36939` (kettle/src `5cd9a44`), worktree `/home/user/wt/w4-final`; dev :5478, preview :5488 (`dist-w4final`, built 05:00:25 that day) |
| Server check | `/tmp/rv7-servers/verify.sh /home/user/wt/w5-final 5540` at 20:19: "PORT 5540 serves 2be3de1 (src d533342): VERIFIED". Preview :5550 against my own build of the tree (`kettle/.tmp/LR-final/dist-build`, section 1): the list of hashed `.js` and `.css` file names is identical (152 files in each build) and `index.html` names the same entry chunk (`assets/index-B5OJJwRN.js`), so the preview is the tree's build. All four ports answered HTTP 200 at 20:19 |
| Machine | 4 CPUs, Chromium headless shell with SwiftShader (the flags in `playwright.config.ts`). Load average at start 0.6 to 3 (the earlier combined-trial run was at 5 to 18) |
| Gate | every browser run through `slots.py run --lane LR`; the full run holds 2 slots (`--n 2`, `--workers=2`), everything else `--n 1`. Maker F held 1 slot (X-11) |
| Not in scope now | `tests/notice-strip.spec.ts` is left out of the full run (X-11 changes it; to be run on the final tree when the coordinator says so) |
| Test list | `npx playwright test --project=chromium --list --reporter=json` (saved as `runs/list-chromium.json`): **268 tests in 18 spec files**; without `notice-strip.spec.ts` (25 tests) **243 in 17 files** |

## 1. Basics (tree `2be3de1`, `kettle/`; no browser)

| Command | Result | Log |
|---|---|---|
| `npx tsc --noEmit` | exit 0, no output (3 s) | `runs/tsc.log.txt` |
| `npx vitest run` | exit 0; **32 files, 302/302 passed** (8 s) | `runs/vitest.log.txt` |
| `npx vite build --config .tmp/w2.vite.config.ts --outDir kettle/.tmp/LR-final/dist-build --emptyOutDir` (my own outDir; the same config the preview builds use) | exit 0, "precache 119 entries (3077.59 KiB)", 152 files, 11 MB | `runs/build.log.txt` |

`runs/basics-status.txt` holds the exit codes and wall times.

Resumed 22:29 after a usage limit and a container restart (about 21:00). The full run (section 2) had finished at 20:56 and is reused. After the restart: servers answered 200 on :5540, :5550, :5478, :5488; `verify.sh` printed "PORT 5540 serves 2be3de1 (src d533342): VERIFIED"; the slot gate was empty. Box after resume: 110 minutes, to about 00:20. The reruns and the notice-strip run below were run as two concurrent gate jobs (one slot each), so machine load was higher than for a single job.

## 2. The full chromium project on :5540, without `notice-strip.spec.ts`

Run 20:20:29 to 20:56:30 (36.0 min), `--project=chromium --workers=2` (gate `--n 2`), dev :5540, 17 spec files listed in `runs/full-spec-list.txt`: `runs/full.log.txt`, `runs/full.json`, `runs/list-chromium.json` (the 268-test list). Maker F held one other slot (X-11) during the first part. Load average 7 to 14 during the run (my two workers, F's job, and the dev server's own load), higher than the 2-worker figure would suggest on a quiet machine; it fell to 3 at the end.

**243 tests announced: 215 passed, 3 failed, 25 skipped, 0 flaky.** The 25 skips are `w3-notices-load.spec.ts` (gated on `W3_LOAD=1`; run separately in section 5).

| Spec file | Passed | Failed | Skipped |
|---|---|---|---|
| `a11y` | 11 | 0 | 0 |
| `break-reach` | 17 | 0 | 0 |
| `chai3d` | 10 | 0 | 0 |
| `integrity` | 23 | **2** | 0 |
| `statusbar` | 9 | 0 | 0 |
| `summary-notice` | 14 | 0 | 0 |
| `toast-room` | 14 | 0 | 0 |
| `w2-firstvisit` | 6 | 0 | 0 |
| `w2-home` | 18 | 0 | 0 |
| `w2-room` | 6 | **1** | 0 |
| `w2-summary` | 18 | 0 | 0 |
| `w3-notices-idle` | 12 | 0 | 0 |
| `w3-notices-load` | 0 | 0 | **25** |
| `w3-notices` | 9 | 0 | 0 |
| `w3-settings` | 10 | 0 | 0 |
| `w3-stats` | 30 | 0 | 0 |
| `whistle` | 8 | 0 | 0 |

So this was **not a clean pass**: three failures. Their signatures (error text from `runs/full.json`; Playwright's own trace and error context are in `kettle/.tmp/LR-pw/full/<test dir>/`, not copied):

| # | Test | Time, worker | Signature |
|---|---|---|---|
| F1 | `integrity.spec.ts` I01 "two tabs, the leading one frozen across the end: the other completes it once; the frozen one wakes up and does not add a second" (line 309 in the listing) | 20:26, worker 1, failed after 35.7 s | `timed out waiting for window.__kettle.timer.getState().status === 'idle' && location.hash === '#/done'`; page state at the time: `hash "#/"`, `timer "idle"`, `multiTab true, leader false, leaderMode "locks", leaderForMs -1, scheduler "worker", settling false, dueForMs null, wakes 8, claims true, lastClaim null` (the other tab never moved the app to the done screen in time) |
| F2 | `integrity.spec.ts` I03 "storage-full warning is a banner in the page (phone 390×844) › nothing over the brew; …gone when there is room" (line 1017) | 20:30, worker 2, failed after 45.0 s | `getByRole('region', { name: /storage is full/ })`: `toHaveCount(0)` expected 0, received 1, timeout 6000 ms (the same assertion as in the combined-trial part A, `integrity.spec.ts:1100`) |
| F3 | `w2-room.spec.ts` "Focus backdrop: earned items without the live 3D room › 3D failure (WebGL context lost): the still that takes over carries the same items" (line 167 in this run's listing, 144 in `--list`) | 20:34, worker 3, timed out at 60.9 s | `Test timeout of 60000ms exceeded`; the stack ends at `assertLayersDrawn` (`w2-room.spec.ts:78`, a `page.screenshot`), the same test and step that failed in Lane R-N's first run on the N trial |

The tests' line numbers in Playwright's output do not match the files (as in the combined-trial receipt); tests are identified by title.
