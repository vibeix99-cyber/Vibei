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
