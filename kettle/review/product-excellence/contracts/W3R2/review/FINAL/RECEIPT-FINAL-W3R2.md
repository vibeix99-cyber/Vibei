# RECEIPT-FINAL-W3R2: Lane RF, full regression on the merged tree, raw evidence

Raw evidence only. No verdict, no visual judgement beyond the counts and the crops named. Times are UTC, 2026-10-17. Task received 21:25; hard stop 00:30. Written in stages (one section per commit). `*.log` is git-ignored, so logs are saved as `.log.txt`.
No source or test edits, no commits to app code, no pushes. Only my own PIDs killed (no `pkill -f`).

## 0. What was tested, and how

| | |
|---|---|
| Tree | integration **`1c791f3`** (app merge `72214c8`), kettle/src **`5f504d4`**, worktree `/home/user/wt/w6-int` (detached at `1c791f3`, `git status` empty at start). Over the pre-round app `494748b` (src `b74e6b3`) it changes `src/timer/{store,sync}.ts`, `src/timer/multitab.test.ts`, new `src/timer/staleTab.test.ts`, `src/app/flow.ts`, `src/screens/focus/FocusScreen.tsx`, `src/ui/Toast.tsx`; tests: `notice-strip.spec.ts`, `timer.spec.ts`, new `w3r2-stale-tab.spec.ts` |
| Dev (run against) | **:5560**, `/home/user/wt/w6-int`. `verify.sh /home/user/wt/w6-int 5560` at 21:25: "PORT 5560 serves 1c791f3 (src 5f504d4): VERIFIED" (Toast.module.css, Toast.tsx, StatusBar.tsx, flow.ts, FocusScreen.tsx all OK) |
| Preview | **:5570**, `/tmp/rv7-servers/dist-w6int`, files written 21:24:49 (the checkout's files are 21:24:47; the brief's "about 21:40" is not what the file times say). Entry chunk `assets/index-DiqM5a-K.js` |
| Control, pre-round app | **:5583** dev, `/home/user/wt/w8q` HEAD `89396e8` (the TS tests on top of app `494748b`), kettle/src **`b74e6b3`** (= `494748b:kettle/src`); `verify.sh` "PORT 5583 serves 89396e8 (src b74e6b3): VERIFIED". This is the BEFORE side of the captures |
| Control, old base | `4d36939` (src `5cd9a44`) dev :5478 (`verify.sh`: VERIFIED), preview :5488 (used only if a failure needed it) |
| Machine | 4 CPUs, 16 GB, Chromium headless shell with SwiftShader (the flags in `playwright.config.ts`). Load average at the start 0.2 to 0.5 (nothing else running; 5 servers on the ports above only) |
| Gate | every Playwright and every browser script through `slots.py run --lane RF` (MAX 3). Full run `--n 2`, everything else `--n 1`; I kept up to three slots busy at once (full run + two single-slot jobs), so load during the long runs was 10 to 20. `uptime` is written at the start and end of every run (first and last line of each `runs/*.log.txt`) |
| Scripts | `scripts/` (`RF-common.sh` gate helper, `RF-basics.sh`, `RF-full.sh`, `RF-chainB.sh`, `RF-pwa.sh`, `RF-stress*.sh`, `RF-twotab.sh` + `RF-2tab.mjs`, `RF-console.{sh,mjs}`, `RF-cap.sh`, `RF-freeze.mjs`, `RF-pdiff.py`) |
| Test list | `npx playwright test --project=chromium --list --reporter=json` (`json/list-chromium.json`): **289 tests in 21 spec files**; without `notice-strip.spec.ts` (25 tests) **264 in 20 files**. All projects (`json/list-all.json`): 320 (chromium 289, timer-harness 14, timer-app 14, pwa 3) |
| Reused | the W3R1 final receipt and scripts (`contracts/W3R1/review/FINAL/`), the W3R2 R2 rerun 2-tab script `RR-2tab.mjs` (sha256 prefix `cc66cf8be408cdd4`, cases a to g, copied unchanged as `scripts/RF-2tab.mjs`) |

## 1. Basics (tree `1c791f3`, `kettle/`; no browser)

| Command | Result | Log |
|---|---|---|
| `npx tsc --noEmit -p .` | exit 0, no output (2 s) | `runs/tsc.log.txt` |
| `npx vitest run` | exit 0; **34 files, 342/342 passed** (5 s) | `runs/vitest.log.txt` |
| `npx vite build --config .tmp/w2.vite.config.ts --outDir .tmp/RF-dist-build --emptyOutDir` (my own outDir; the same config the preview builds use) | exit 0, "precache 119 entries (3079.93 KiB)", 152 files, 11 MB | `runs/build.log.txt` |

**Build against the :5570 preview** (`runs/dist-*`): the lists of hashed `.js` and `.css` files are **identical** (45 files in each; `runs/dist-mine-hashed.txt`, `runs/dist-5570-hashed.txt`); the lists of all files are identical (152 each); `index.html` names the same entry chunk `assets/index-DiqM5a-K.js` in both. Every non-sourcemap file (js, css, `sw.js`, html, images) has the same sha256 in both builds (`runs/dist-*-sha.txt`); only 31 `.map` files differ (source-map paths), so the preview serves this tree's build.

## 2. The full chromium project on :5560, without `notice-strip.spec.ts`

`runs/full.log.txt`, `json/full.json`, `runs/full-summary.txt`, spec list `runs/full-spec-list.txt` (20 files). Run 21:27:47 to 22:06:20 (38.5 min), `--project=chromium --workers=2` (gate `--n 2`), dev :5560. Load average 0.5 at the start, 7.4 at the end; 12 to 18 for most of the run (two more gate jobs, the notice-strip file and, later, the timer/pwa and capture jobs, ran at the same time).

**264 tests announced (the `--list` count): 237 passed, 2 failed, 25 skipped, 0 flaky.** The 25 skips are `w3-notices-load.spec.ts` (gated on `W3_LOAD=1`; run separately in section 4).

| Spec file | Passed | Failed | Skipped |
|---|---|---|---|
| `a11y` | 11 | 0 | 0 |
| `break-reach` | 17 | 0 | 0 |
| `chai3d` | 10 | 0 | 0 |
| `integrity` | 24 | **1** | 0 |
| `statusbar` | 9 | 0 | 0 |
| `summary-notice` | 14 | 0 | 0 |
| `toast-room` | 14 | 0 | 0 |
| `w2-firstvisit` | 6 | 0 | 0 |
| `w2-home` | 18 | 0 | 0 |
| `w2-room` | 7 | 0 | 0 |
| `w2-summary` | 18 | 0 | 0 |
| `w3-history-focus-scroll` | 14 | 0 | 0 |
| `w3-intention-race` | 2 | 0 | 0 |
| `w3-notices-idle` | 12 | 0 | 0 |
| `w3-notices-load` | 0 | 0 | **25** |
| `w3-notices` | 9 | 0 | 0 |
| `w3-settings` | 9 | **1** | 0 |
| `w3-stats` | 30 | 0 | 0 |
| `w3r2-stale-tab` | 5 | 0 | 0 |
| `whistle` | 8 | 0 | 0 |
| **total** | **237** | **2** | **25** |

So this was **not a clean pass**: two failures. Error text is from `json/full.json`; Playwright's own trace and error context for each are in `rerun/fullrun-artifacts/`.

| # | Test | Time, worker | Error (first lines) |
|---|---|---|---|
| F1 | `integrity.spec.ts:1048` I03 "storage-full warning is a banner in the page (phone 390×844) › nothing over the brew; the summary says the brew is not saved, with Save backup; Today and Settings show the banner in the page, said once, kept while storage is full, gone when there is room" | 21:37:47, worker 1, failed after 45.2 s | `Error: every failed save has gone through` (an `expect.poll(...).toEqual([])`, 10 s) at `integrity.spec.ts:1136`; `- Expected - 1 / + Received + 3`: `- Array [] / + Array [ "kettle:home:lastVisit" ]`, "Timeout 10000ms exceeded while waiting on the predicate" |
| F2 | `w3-settings.spec.ts:39` "preferences persist across a reload; Reset everything returns each to its default" | 21:45:09, worker 0, failed after 27.2 s | `expect(locator).toBeHidden() failed`, locator `getByRole('dialog', { name: 'Start fresh?' })`, "Expected: hidden / Received: visible", timeout 10000 ms, 12 polls "locator resolved to `<div role="dialog" tabindex="-1" ... class="_panel_344q3_25 _md_344q3_56">`", at `w3-settings.spec.ts:83` (the line after the click on the sheet's "Reset everything" button). The page snapshot at failure (`F2-w3-settings-error-context.md`) shows the welcome screen "Hi, I'm Chai." and no dialog |

### 2a. The two failures, rerun once on :5560 (`scripts/RF-rerun.sh`, `rerun/F*.json`, `runs/rerun-F*.log.txt`)

Each test once, `--workers=1`, one gate slot, own output directory. They were not run in a quiet machine: the W3 load control and the capture jobs were running beside them (load 11 to 12).

| # | Rerun on :5560 | Time | Load start to end |
|---|---|---|---|
| F1 `integrity` I03 banner | **pass** | 32.7 s (22:09:24 to 22:09:58) | 12.0 to 11.95 |
| F2 `w3-settings` Reset everything | **pass** | 22.6 s (22:12:07 to 22:12:31) | 11.3 to 11.4 |

Both passed on the rerun, so, by the brief, no run on :5583 or :5478 was made for them. (Extra repeats of both, if made, are in section 10.)

## 3. `notice-strip.spec.ts`, the whole file once on :5560

`runs/notice-strip.log.txt`, `json/notice-strip.json`, `runs/notice-strip-summary.txt`. 21:27:50 to 21:57:09 (29.3 min), `--project=chromium --workers=1`, one gate slot, load 0.5 at the start and 13.2 at the end (12 to 18 meanwhile: the full run and a third job were on the machine).

**25 passed, 0 failed, 0 flaky, 0 skipped.** All 25 cases are the one test at line 388 "no notice overlaps a control, text or a row: every notice state, real input" in its 25 configurations (durations 62 to 78 s). The case W3R1 named as known flaky, 1440×900 light 200 % reduced motion, passed (71.7 s); 844×390 dark 200 % passed (73.8 s).

## 5. Timer-harness, timer-app and pwa projects

`runs/timer-pwa.log.txt`, `json/timer-pwa.json`, `runs/timer-pwa-summary.txt`. 21:57:10 to 22:00:36 (3.4 min), `KETTLE_PORT=5560 KETTLE_PWA_PORT=5495 npx playwright test --project=timer-harness --project=timer-app --project=pwa --workers=1`, one gate slot, load 12.5 to 15.3.

**29 passed, 2 skipped, 0 failed, 0 flaky** (31 tests): `timer-harness` 14 passed; `timer-app` 12 passed, 2 skipped (`timer.spec.ts:305` and `:449`, by design `test.skip(!kettlePage.includes('harness'))`); `pwa` 3 passed. `timer.spec.ts:156` passed in both projects (4.0 s in the harness, 9.8 s in the app).

**PWA port (the trap).** `pwa.spec.ts` reads `KETTLE_PWA_PORT` (default 5193), builds the worktree it runs in into `test-results/pwa-dist` and previews it on that port; it only checks that the port answers. I used port **5495** (as LEAD-5 did). Before the run, inside the gated job: `curl` to 5495 and to 5193: no answer on either; `/proc/net/tcp` shows 0 listeners on 5495 (`runs/timer-pwa.log.txt`, lines 3 to 6). During the run a sampler recorded every process whose command line has `preview --outDir ... --port 5495` (`runs/timer-pwa.listener.txt`): from 22:00:22 only pids 32142, 32154, 32155, all with cwd `/home/user/wt/w6-int/kettle` (the `npm exec`, `sh -c` and `node .../vite preview --outDir /home/user/wt/w6-int/kettle/test-results/pwa-dist` of my own run, started by the spec). After the run I killed the leftover by explicit PID (**32155**; the two parents had gone with it) and probed again: "port 5495 free after cleanup" (and a later `curl` at 22:01: no answer, no process with `--port 5495` in `ps`).
