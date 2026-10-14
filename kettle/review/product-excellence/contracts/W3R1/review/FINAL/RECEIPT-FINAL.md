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
