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

## 7. The 2-tab manual check with real clicks, :5560, 3 iterations of each case (a) to (g)

**Script** `scripts/RF-2tab.mjs` (sha256 prefix `cc66cf8be408cdd4`, the file the W3R2 R2 rerun used for its cases a to g, copied unchanged), `scripts/RF-twotab.sh`; Playwright, one Chromium, **one browser context with two pages = two tabs sharing localStorage**, a fresh context per iteration (viewport 1200×800, onboarded, no 3D scene, reduced motion, muted). Every action of the person is a real mouse or keyboard event: the start (click the composer, `pressSequentially` the words, click "Put the kettle on"), "Pause", "Add 5 minutes", "Start next brew", "End session" and the sheet's "End session" (`locator.click`, `bringToFront` first). The debug API is used only to read state, to put the break on in (g), and to move both tabs' clocks by the same 90 s so a brew gets a record. "Lagging" = tab B's `storage` events for `kettle:timer` are held by an init script (as in `tests/w3r2-stale-tab.spec.ts`) and re-dispatched in order on release. An audio spy on `window.__kettleAudio.audio.play` lists the sound names played in B during its action (the app is muted, the spy sees the call). Run `runs/manual-2tab-rf-5560.log.txt`, 22:06:21 to 22:12:05 (5.7 min), order g, e, f, a, b, c, d; load 7.2 at the start, 12.3 at the end (8 to 13 meanwhile, the capture and W3 load jobs beside it). One gate slot. Per-iteration JSON, both tabs' screenshots at the end of iteration 1 of each case, and `rf-5560-summary.json` in `manual/`; tables `manual/TABLE-rf-5560.md`.

| Case | Iterations passed | What the criteria are (all met 3 of 3) |
|---|---|---|
| (a) pause: A +5, B (behind) pauses | **3 of 3** | paused in A, B and storage; same session; `plannedMs` 30 min everywhere (A's +5 kept); A, B and storage agree; remaining above planned minus 2 min; B's spy shows the pause sound played when the pause was applied |
| (b) +5: A pauses, B (behind) clicks +5 | **3 of 3** | same session; still paused; +5 applied once; agreement |
| (c) end: A ends brew 1 and starts brew 2, B (behind) ends its stale view | **3 of 3** | brew 2 running, not extended, not ended, same `sessionId` and `endsAt` in A, B and storage; B on `#/focus`; exactly one record for brew 1 (storage, A, B), none for brew 2 |
| (d) no hold: B pauses, +5, ends; then a second brew | **3 of 3** | A and B agree after each step; one record per ended brew, two in all |
| (e) +5 on a replaced brew (A ended brew 1, runs brew 2; B behind clicks +5) | **3 of 3** | brew 2 not extended, 25 min, same session and end in A, B, storage; storage byte-identical before and after B's click; **no "5 min · whistles at" note in B at any poll or in the note observer (`plus5Note` `[""]` 3 of 3)**; B shows brew 2 on `#/focus` |
| (f) pause on a replaced brew (same set-up, B clicks Pause) | **3 of 3** | brew 2 running and not paused in A, B, storage; B on `#/focus`; one record for brew 1, none for brew 2; **B's spy `[]` 3 of 3: no `pause` and no `resume` sound** |
| (g) Next brew in a lagging tab (both tabs on a running break; A and B each click "Start next brew") | **3 of 3** | B joined A's brew (no second brew started by B), A's storage byte-identical after B's click, agreement after release, the "Saved ... of focus" toast shown in B, B went home, one record for the joined brew, idle everywhere at the end |

**21 of 21 iterations pass; 0 exceptions; page errors 0 in all 21.** Nothing failed, so nothing was rerun or classified for this check.

## 8. Console check on the preview :5570 (and, extra, on dev :5560)

Script `scripts/RF-console.mjs` (`scripts/RF-console.sh`), one gate slot per run, logs and JSON in `console/`. A fresh browser context per run (`?debug&onboarded=1#/`), DPR 1. Steps, each by real input where the app has a control: (1) load Today and wait for the debug API and the composer; (2) start a brew (click the composer, type, click "Put the kettle on"); (3) Pause, Resume, "Add 5 minutes" (real clicks); (4) move the clock 90 s (debug), "End session" and the sheet's "End session" (real clicks), wait for the "Saved ... of focus" toast; (5) start a second brew, `nearEnd()` and `finish()` (debug) to reach the summary on `#/done`; (6) the summary's "Tea time" button (real click), back to Today, the **Stats** link in the nav (real click), scroll the whole page (it holds History); (7) Settings and back to Today. The page listener records **every** `console` message of every type, every `pageerror`, every failed request and every HTTP status of 400 or more.

| Run | Viewport | console messages | `error` | `warning` | pageerror | failed requests | HTTP ≥ 400 | Steps |
|---|---|---|---|---|---|---|---|---|
| **preview :5570** | 1280×800 | 1 (info) | **0** | **0** | **0** | 0 | 0 | 7 of 7 ok, Stats reached and showed History |
| **preview :5570** | 390×844 touch | 1 (info) | **0** | **0** | **0** | 0 | 0 | 7 of 7 ok |
| dev :5560 (extra) | 1280×800 | 4 (2 info, 2 debug) | 0 | 0 | 0 | 0 | 0 | 7 of 7 ok (the Tea time click found nothing to click in this run; the script goes on and navigates) |
| dev :5560 (extra) | 390×844 touch | 4 (2 info, 2 debug) | 0 | 0 | 0 | 0 | 0 | 7 of 7 ok |

Every message there was: the preview's one `info` is `[chai3d] model ready {state: ready, ms: ..., bytes: 45572} ...` (from `chaiLoad-*.js`); dev adds `[vite] connecting...`, `[vite] connected.` (debug) and React's "Download the React DevTools ..." (info). **No `console.error`, no `console.warn`, no pageerror; no message matching hook, `#310`, `#300`, `#311`, "Rendered more/fewer hooks" or "Invalid hook" (`hookOrder: []` in all four JSONs).** The production build would show a hook-order failure as a pageerror ("Minified React error #310"); dev would show the full text. The toasts that appeared in each run (read from the live regions): "Late-night brew? Let's keep it short and sweet. Try Gentle · 15 min", "Saved 1 minute of focus", "Kettle's off. 1 minute of focus saved." (so the Toast component, which TH changed, rendered in all four runs). The first pass of this check (`console/first-pass-step6-nav-missing/`, same counts: 0 errors, 0 warnings) failed my own step 6: the summary is a full-screen route with no nav, so the click on the Stats link timed out; I changed the script (Tea time, then back to Today) and ran all four again; those are the runs above.
