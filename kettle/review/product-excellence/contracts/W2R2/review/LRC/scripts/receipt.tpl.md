# RECEIPT-LRC: Lane R (C), targeted regression of Maker C's 3D Chai change (`MODEL_ON_LOW = true`)

Raw evidence only. No verdict and no visual judgement. Times are UTC, 2026-10-13. Lane started 18:50:14; box ends 19:55.
No source edits, commits, pushes or merges. No server started or stopped by me, except the `vite preview` that the pwa spec itself spawns (section 5).

## 0. What was tested, and how

| | |
|---|---|
| Trial | `0f01c47` (integration `2f67fc1` + `pe/w2r2-chai3d@6fb2136`), worktree `/home/user/wt/w4tr-c`, kettle/src `4556926`. Dev `:5460` (debug API), preview `:5461` (pid 5047, `--outDir /tmp/rv7-servers/dist-w4tr-c`, `index.html` mtime 18:49:26) |
| Control | `b377c62` (src `e0aebbf`), dev `:5410`, preview `:5430` (`dist-w3base`). Lacks P's summary change as well as C's change |
| Machine | 4 CPUs, Chromium headless shell with SwiftShader (`--enable-unsafe-swiftshader --use-angle=swiftshader --ignore-gpu-blocklist`); `navigator.hardwareConcurrency` = 4; `settings.scene` = `auto` (default) |
| Gate | every browser job via `slots.py run --lane LR --n <1|2>`; I killed one PID, my own (section 5) |
| Server verification (read-only `verify.sh`, curl of served sources vs committed blobs) | `:5460` VERIFIED as `0f01c47` (src `4556926`); `:5410` VERIFIED as `b377c62` (src `e0aebbf`). Log: `runs/server-verify.txt`. The trial preview's built `chai-B-OZIeNI.glb` has sha256 `b401bc6c0fa9dd7a2abe27c135821634e7d1a4d9f9ba5263f50a436ceb463d7e`, and the same bytes come back over HTTP from `:5461` |
| Scripts | `/home/user/wt/w4tr-c/kettle/.tmp/LR/` (git-ignored); copies in `scripts/` |
| Frozen clock | `page.clock.install({time})` then `page.clock.resume()` in every script of mine (day `2026-10-11T07:40:00Z`; night look `2026-10-11T21:40:00Z`); service workers blocked in my scripts (so the console shows "Service Worker registration blocked by Playwright", excluded from the error columns) |
| Looks | `light` = theme light; `dark` = theme dark; `night` = theme light + `nooktime=night` (the debug seeds pin the time of day, so the clock alone does not make night) |
| Layout of this folder | `runs/` raw logs, `perf/` raw JSON, `summaries/` generated tables, `captures/` (pass 1), `captures-pass2-quiet/` (pass 2), `captures-unlock-ready/` (supplement), `scripts/` |

## 1. Fallback and room specs on the trial, tsc, vitest

Command (twice), from `/home/user/wt/w4tr-c/kettle`: `KETTLE_PORT=5460 npx playwright test tests/chai3d.spec.ts tests/w2-room.spec.ts --project=chromium --workers=1` (gate `--n 1`).

| Run | Start | End | Result | Per file | Failures | Log |
|---|---|---|---|---|---|---|
| 1 | 18:50:40 | 18:53:49 | **16 passed / 16** (3.1 min), exit 0 | `chai3d.spec.ts` 9/9, `w2-room.spec.ts` 7/7 | none | `runs/check1-run1-chai3d-w2room.txt` |
| 2 | 18:54:37 | 18:58:38 | **16 passed / 16** (4.0 min), exit 0 | `chai3d.spec.ts` 9/9, `w2-room.spec.ts` 7/7 | none | `runs/check1-run2-chai3d-w2room.txt` |

| Command | Time | Result | Log |
|---|---|---|---|
| `npx tsc --noEmit` | 18:54:24 | exit 0, no output | `runs/tsc.txt` |
| `npx vitest run` | 18:54:25 to 18:54:31 | **289 passed / 289**, 30 test files passed / 30, exit 0 (the maker's addendum reports 286 on the C branch alone) | `runs/vitest.txt` |

The nine `chai3d.spec.ts` cases include "low tier: the model too (liteified), one request" and "default tier on this machine (auto to low on SwiftShader): the model, with no frame without Chai"; both passed in both runs. `w2-room.spec.ts` includes the context-loss case; it passed in both runs.

## 2. Default-tier behaviour on the preview `:5461`, no forcing

Script `scripts/check2.mjs` (no `nookq`, no `chai3d`, `settings.scene` left at `auto`; "3D on" is the default). Setup used the debug API only (`?debug&seed=veteran&theme=light`, `settings.set({muted, autoStartBreaks:false, autoStartFocus:false})`, `__kettle.navigate('/nook')`).

Variants per viewport (390×844 at DPR 2, 1440×900 at DPR 1):
- **A**: load Home `#/`, wait for the timer to be ready, wait 1.5 s, then `navigate('/nook')`.
- **B**: cold load straight at `#/nook`.
- **C**: cold load at `#/nook`; the `.glb` data request is held by a Playwright route until 1 s after the room is ready. The tier is still the default one. This guarantees a procedural-first frame sequence.
- **D**: cold load at `#/nook`; the `.glb` request is held until 150 ms after `window.__nook` exists, then released (so the swap lands inside the sampling window).

Programmatic tells read from the engine: `window.__nook.quality` (resolved tier), `window.__nook.chaiKind` (`procedural` | `model`), `window.__nook.chai.root.userData.model` (true on the model), the `chai` object's child count in the scene graph (7 on the model, 8 on the procedural Chai), and `window.__chai3d.status()`.

Per-frame probe (installed at document start, so it sees the engine from its first sampled frame):
- every `requestAnimationFrame` (faked clock rAF, about 16 ms apart) it traverses `__nook.scene` and counts samples with no visible object named `chai`;
- run 2 also wraps `renderer.render` and counts the engine's real renders in which the scene holds no visible `chai` (the real render rate is much lower than the rAF rate on SwiftShader);
- "first 3 s" = the 3 s after the engine object first appears.

**Run 1** (18:54:37 onward; variants A, B, C; D run at 19:10:41 in `pass2.sh`; this run did not yet record `root.userData.model` or render counts):

{{include:summaries/check2-run1.md}}

**Run 2** (19:19:33 onward, variants A, B, C; D at about 19:24; adds `root.userData.model` and render counts; check 6 was running at the same time, load average 3 to 14):

{{include:summaries/check2-run2.md}}

Facts from these tables:
- All 16 runs (8 per run set): resolved tier `low`, `settings.scene` `auto`, 0 page errors, 0 console errors or warnings other than the blocked-service-worker noise.
- Exactly one `.glb` request per page load in A, B and D (HTTP 200, 45,572 bytes, `/assets/chai-B-OZIeNI.glb`). In A the request is made on the Home route, 1.2 to 1.8 s after load (before the Nook is entered); in B at 0.9 to 1.2 s.
- In A and B the Nook engine's first sampled frame already has the model (`chaiKind` `model`); no swap happens in the Nook engine's life.
- In C and D the first frames are procedural, then the model replaces it in place (swap seen in 7 of the 8 C and D runs; the exception is run 1, 1440×900, C, below). Samples and renders with no visible `chai`: 0 in every run.
- 1440×900, C, run 1: the room took 17.1 s to be ready on this machine, longer than the model loader's 8 s timeout that runs from the request. Status ended `failed`, `reason: timeout (8000 ms)`, procedural Chai stayed, request aborted at the timeout. In run 2 the same variant made a second `.glb` request at 18.7 s (after the first timed out), which completed after my release; the swap was seen 9.3 s after the engine appeared. 0 samples and 0 renders with no `chai` in both.

## 3. Nook and summary-unlock captures, trial `:5461` vs control `:5430`

Script `scripts/capture3.mjs`; configurations 390×844 (DPR 2) and 1440×900 (DPR 1), each in light, dark and night; default tier (no `nookq`, no `chai3d`); fresh browser context per group; control and trial alternate per look inside one browser session.
- **Nook:** `veteran` seed on Home, `navigate('/nook')`, wait for `data-scene-ready="true"`, wait 4 s, hold the engine loop (`setRunning(false)`), screenshot.
- **Unlock:** `celebrate` seed on Home, click "Put the kettle on", wait 3 s, `window.__kettle.finish()` (t0), wait for `#/done`, then the screenshot at t0+4 s and at t0+10 s (the unlock card scrolled into view, loop not held). The facts are read from the page in the same step as each screenshot. On this CPU rasterizer the main thread is busy rendering, so the screenshot starts later than the target; the actual start time after `finish()` is in the tables (`actual shot start ms`).

Two passes were taken because the first ran two browsers plus the timer-app tests at once (load average 12 to 14):
- **Pass 1** (contended): `captures/`, 18:58:46 to 19:06:49, gate `--n 2` (one process per viewport).
- **Pass 2** (one browser, nothing else heavy running): `captures-pass2-quiet/`, 19:10:41 to 19:19:24, gate `--n 1`. Pass 2 also recorded the unlock section and canvas rectangles.

Files per configuration and side: `nook-3d.png`, `unlock-4s.png`, `unlock-10s.png`, `meta.json`. Capture list in section 9.

### 3.1 Pass 2 (quiet): engine facts

{{include:summaries/captures-pass2-quiet.md}}

### 3.2 Pass 1 (contended): the same tables

`summaries/captures-pass1-contended.md` has the full set. Summary of its engine facts: Nook trial 6/6 `model` with `root.userData.model` true and 1 `.glb` request; Nook control 6/6 no `chaiKind` field, 0 requests; unlock card engine, trial: 12/12 captures `procedural`, `root.userData.model` false, `engineInUnlockSection` true, `engineMode` `showcase`; unlock card engine, control: 12/12 captures with no `chaiKind` field (the control predates the model), `root.userData.model` false, `engineInUnlockSection` true. Page errors 0 in all 24 groups; console errors/warnings other than the blocked-service-worker noise: 0.

Card host `data-scene-ready` at the capture instants (6 captures per side and time, per pass):
- at the "4 s" capture: `false` in 6 of 6 per side in both passes (the card's close-up engine had not reported ready yet);
- at the "10 s" capture, pass 1: control `true` 4 of 6, trial `true` 2 of 6; pass 2: control `true` 3 of 6, trial `true` 5 of 6;
- actual start of the screenshot after `finish()`, min / median / max: "4 s" shot, pass 1 control 8.0 / 11.9 / 21.6 s, trial 9.7 / 11.4 / 31.7 s; pass 2 control 7.1 / 7.8 / 11.4 s, trial 7.0 / 11.9 / 12.3 s; "10 s" shot, pass 1 control 10.9 / 21.4 / 27.1 s, trial 11.6 / 17.2 / 37.4 s; pass 2 control 10.1 / 12.5 / 14.7 s, trial 10.2 / 15.1 / 15.3 s;
- pass 1, 1440×900 light, trial: the card never reported ready within the 40 s tick window (`readyAfterDoneMs` null); its "10 s" capture started 37.4 s after `finish()` with the host still `false`.

### 3.3 Summary text differences, recorded and not attributed

Control lacks P's summary change, so text differences are expected from that. Programmatic comparison of `main.innerText` (first 1,500 characters) between control and trial, all 12 unlock captures of each pass:
- the unlock card section text (`section[aria-label^="Cozy level"]`): identical in 12 of 12 captures in each pass;
- `main` text differs in 12 of 12 captures in each pass, always in the same four places: control "keeps your streak warm for one missed day" vs trial "covers one missed day, so your warm days keep going"; control "Warm streak:" present vs trial absent; control "days." vs trial "days warm.";
- the Nook page `main` text: identical in 6 of 6 per pass.
- Layout consequence, pass 2, 390×844 (all three looks): the unlock card section is at y=460 on control and y=499 on trial (both `scrollY` 0, same 350×134 box), i.e. 39 CSS px lower on the trial. At 1440×900 the card box is at the same place on both sides (`[932,135,446,321]`).

### 3.4 Pixel numbers (raw, no interpretation)

Whole-viewport difference, control vs trial, tolerance 16 on the largest channel (also "any difference"), bounding box of the pixels over 16. Pass 2:

{{include:summaries/pixeldiff-pass2-quiet.md}}

Pass 1 numbers: `summaries/pixeldiff-pass1-contended.md`.

Card-canvas crop only, pass 2 (each side cropped at its own canvas rectangle from `meta.json`; the card host `ready` flag of each side at the capture is in the second and third columns):

{{include:summaries/cropdiff-pass2-quiet.md}}

### 3.5 Supplement: the unlock card at "scene ready + 3.5 s", loop held, each side taken twice

Script `scripts/unlockready.mjs`: celebrate seed, `finish()`, wait until the card host reports `data-scene-ready="true"`, wait 3.5 s, scroll the card to the middle, `setRunning(false)`, 400 ms, read facts, screenshot. Order per config: control r1, trial r1, control r2, trial r2. The control-vs-control pair is the baseline for the control-vs-trial pairs.

{{include:summaries/unlock-ready.md}}

## 4. Low-tier frame time and memory, preview `:5461`, same browser session

Script `scripts/check4.mjs`. One Chromium launch; six contexts in sequence (3 rounds, alternating); 390×844 at DPR 3 (the engine's canvas is capped by its own pixel budget: the canvas size is in the raw JSON); default tier (`quality` low in all runs); Nook, cold load at `#/nook`, `veteran` seed.
- **model**: default, no routing.
- **procedural**: every `.glb` data request aborted by a Playwright route (`route.abort('failed')`), so the engine keeps the procedural Chai; confirmed per run by `chaiKind` `procedural`, `root.userData.model` false and `chai3d.status()` `failed`.
- Frame time: `engine.frame(1/30)` followed by a 1-pixel `gl.readPixels` (forces the CPU rasterizer to finish), loop stopped with `setRunning(false)`, 10 warm-up frames, then 60 timed frames.
- Counters: `renderer.info` read from `window.__nook.renderer` (a private field in TypeScript, present at run time because `?debug` exposes the engine): `info.render.calls`, `info.render.triangles`, `info.memory.geometries`, `info.memory.textures`, `info.programs.length`.
- JS heap: CDP `HeapProfiler.collectGarbage` twice, then `Runtime.getHeapUsage`.
- Set 1, model first in each round, 19:06:55 to 19:08:33: `perf/check4-perf-low-390x844.json`. Set 2 (extra, procedural first in each round), 19:08:5x to 19:10:2x: `perf/check4b-perf-low-390x844-procedural-first.json`. Machine otherwise idle (load average at the start of each run in the tables).

Set 1 (model first), per run and per variant:

{{include:summaries/perf-model-first.md}}

Set 2 (procedural first), per run and per variant:

{{include:summaries/perf-procedural-first.md}}

## 5. timer-harness, timer-app and pwa

Command: `KETTLE_PORT=5460 KETTLE_PWA_PORT=5493 npx playwright test --project=timer-harness --project=timer-app --project=pwa --workers=1 --output=/tmp/claude-0/lrc-scratch/out-timer` (gate `--n 1`), 18:59:00 to 19:02:44.
- **29 passed, 2 skipped, 0 failed** (3.7 min), exit 0. Matches the expected 29 + 2.
- The 2 skips are `[timer-app]` `timer.spec.ts:294` (keyboard shortcuts infra: Space toggles) and `timer.spec.ts:438` (rendering budget: useRemaining re-renders about once per displayed second).
- Stray process: the pwa spec left `node /home/user/wt/w4tr-c/kettle/node_modules/.bin/vite preview --outDir .../test-results/pwa-dist --port 5493 --strictPort` running as PID 9738 (parent 1). I killed it by that PID at 19:02 and confirmed port 5493 no longer answers. Its build output `kettle/test-results/pwa-dist` is git-ignored.
- The pwa case "precaches the shell, fonts, 3D chunk and tick worker; boots and times a brew offline" passed.
- Log: `runs/check5-timer-pwa.txt`.

## 6. Full chromium suite

{{include:summaries/check6.md}}

## 7. Commands and times (chronological)

| Time | Command or action |
|---|---|
| 18:50:14 | start; read the addendum, specs, probes |
| 18:50:40 to 18:53:49 | check 1, run 1 |
| 18:54:24 to 18:54:31 | `npx tsc --noEmit`; `npx vitest run` |
| 18:54:37 to 18:58:38 | check 1, run 2; in parallel check 2 run 1 (`check2.mjs`, A, B, C) |
| 18:55:35 | read-only `verify.sh` on `:5460` and `:5410` |
| 18:58:46 to 19:06:49 | check 3 pass 1 (`capture3.mjs`, 2 processes, gate `--n 2`) |
| 18:59:00 to 19:02:44 | check 5 (timer-harness, timer-app, pwa); PID 9738 killed |
| 19:06:55 to 19:08:33 | check 4 set 1 (`check4.mjs`, model first) |
| 19:08:5x to 19:10:2x | check 4 set 2 (procedural first) |
| 19:10:41 to 19:11:28 | check 2 variant D (`check2.mjs --variants D`) |
| 19:11:28 to 19:19:24 | check 3 pass 2 (quiet) |
| 19:19:33 onward | check 6 (full chromium, gate `--n 2`); check 2 run 2 (A, B, C) in parallel |
| 19:23:56 onward | check 2 variant D again (with render counts); unlock-ready supplement (`unlockready.mjs`) |

## 8. Incomplete, deviations and caveats

{{include:summaries/incomplete.md}}

## 9. Capture list

{{include:summaries/capture-list.md}}
