# RECEIPT-LRC: Lane R (C), targeted regression of Maker C's 3D Chai change (`MODEL_ON_LOW = true`)

Raw evidence only. No verdict and no visual judgement. Times are UTC, 2026-10-13. Lane started 18:50:14; box ends 19:55.
No source edits, commits, pushes or merges. No server started or stopped by me, except the `vite preview` that the pwa spec itself spawns (section 5).

## 0. What was tested, and how

| | |
|---|---|
| Trial | `0f01c47` (integration `2f67fc1` + `pe/w2r2-chai3d@6fb2136`), worktree `/home/user/wt/w4tr-c`, kettle/src `4556926`. Dev `:5460` (debug API), preview `:5461` (pid 5047, `--outDir /tmp/rv7-servers/dist-w4tr-c`, `index.html` mtime 18:49:26) |
| Control | `b377c62` (src `e0aebbf`), dev `:5410`, preview `:5430` (`dist-w3base`). Lacks P's summary change as well as C's change |
| Machine | 4 CPUs, Chromium headless shell with SwiftShader (`--enable-unsafe-swiftshader --use-angle=swiftshader --ignore-gpu-blocklist`); `navigator.hardwareConcurrency` = 4; `settings.scene` = `auto` (default) |
| Gate | every browser job via `slots.py run --lane LR --n 1 or --n 2`; I killed one PID, my own (section 5) |
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

| viewport | variant | resolved tier (settings.scene) | .glb requests | chai kind at end (engine field / root.userData.model / childCount) | chai3d status | scene-graph samples (every rAF): total / no visible chai | first 3 s after the engine appears: samples / no chai | renderer.render calls: total / no chai / model / procedural | swap procedural -> model seen | page errors | console error/warn (SW-blocked noise excluded) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 390x844@2 | A | low (auto) | chai-B-OZIeNI.glb 200 at 1186 ms on #/ | model / not recorded / 7 | state=ready, ms=20, bytes=45572 | 352 / 0 (1 engine) | 188 / 0 | not recorded in this run | no (first kind sampled: model, last: model) | 0  | none  |
| 390x844@2 | B | low (auto) | chai-B-OZIeNI.glb 200 at 872 ms on #/nook | model / not recorded / 7 | state=ready, ms=46, bytes=45572 | 494 / 0 (1 engine) | 188 / 0 | not recorded in this run | no (first kind sampled: model, last: model) | 0  | none  |
| 390x844@2 | C | low (auto) | chai-B-OZIeNI.glb 200 at 948 ms on #/nook | model / not recorded / 7 | state=ready, ms=2648, bytes=45572 | 382 / 0 (1 engine) | 187 / 0 | not recorded in this run | yes: sample #122, 1936 ms after the engine appeared | 0  | none  |
| 1440x900@1 | A | low (auto) | chai-B-OZIeNI.glb 200 at 1402 ms on #/ | model / not recorded / 7 | state=ready, ms=32, bytes=45572 | 334 / 0 (1 engine) | 188 / 0 | not recorded in this run | no (first kind sampled: model, last: model) | 0  | none  |
| 1440x900@1 | B | low (auto) | chai-B-OZIeNI.glb 200 at 933 ms on #/nook | model / not recorded / 7 | state=ready, ms=28, bytes=45572 | 702 / 0 (1 engine) | 188 / 0 | not recorded in this run | no (first kind sampled: model, last: model) | 0  | none  |
| 1440x900@1 | C | low (auto) | chai-B-OZIeNI.glb no response (aborted) at 1117 ms on #/nook | procedural / not recorded / 8 | state=failed, reason=timeout (8000 ms), ms=8000 | 784 / 0 (1 engine) | 188 / 0 | not recorded in this run | no (first kind sampled: procedural, last: procedural) | 0  | none ['17318ms http://127.0.0.1:5461/assets/chai-B-OZIeNI.glb net::ERR_ABORTED'] |
| 390x844@2 | D | low (auto) | chai-B-OZIeNI.glb 200 at 831 ms on #/nook | model / True / 7 | state=ready, ms=817, bytes=45572 | 394 / 0 (1 engine) | 188 / 0 | not recorded in this run | yes: sample #87, 1376 ms after the engine appeared | 0  | none  |
| 1440x900@1 | D | low (auto) | chai-B-OZIeNI.glb 200 at 867 ms on #/nook | model / True / 7 | state=ready, ms=814, bytes=45572 | 511 / 0 (1 engine) | 188 / 0 | not recorded in this run | yes: sample #205, 3264 ms after the engine appeared | 0  | none  |


**Run 2** (19:19:33 onward, variants A, B, C; D at about 19:24; adds `root.userData.model` and render counts; check 6 was running at the same time, load average 3 to 14):

| viewport | variant | resolved tier (settings.scene) | .glb requests | chai kind at end (engine field / root.userData.model / childCount) | chai3d status | scene-graph samples (every rAF): total / no visible chai | first 3 s after the engine appears: samples / no chai | renderer.render calls: total / no chai / model / procedural | swap procedural -> model seen | page errors | console error/warn (SW-blocked noise excluded) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 390x844@2 | A | low (auto) | chai-B-OZIeNI.glb 200 at 1275 ms on #/ | model / True / 7 | state=ready, ms=20, bytes=45572 | 355 / 0 (1 engine) | 188 / 0 | 99 / 0 / 99 / 0 | no (first kind sampled: model, last: model) | 0  | none  |
| 390x844@2 | B | low (auto) | chai-B-OZIeNI.glb 200 at 1121 ms on #/nook | model / True / 7 | state=ready, ms=8, bytes=45572 | 588 / 0 (1 engine) | 189 / 0 | 97 / 0 / 97 / 0 | no (first kind sampled: model, last: model) | 0  | none  |
| 390x844@2 | C | low (auto) | chai-B-OZIeNI.glb 200 at 973 ms on #/nook | model / True / 7 | state=ready, ms=4423, bytes=45572 | 501 / 0 (1 engine) | 187 / 0 | 113 / 0 / 91 / 22 | yes: sample #231, 3696 ms after the engine appeared | 0  | none  |
| 1440x900@1 | A | low (auto) | chai-B-OZIeNI.glb 200 at 1780 ms on #/ | model / True / 7 | state=ready, ms=24, bytes=45572 | 360 / 0 (1 engine) | 188 / 0 | 104 / 0 / 104 / 0 | no (first kind sampled: model, last: model) | 0  | none  |
| 1440x900@1 | B | low (auto) | chai-B-OZIeNI.glb 200 at 1178 ms on #/nook | model / True / 7 | state=ready, ms=30, bytes=45572 | 883 / 0 (1 engine) | 186 / 0 | 97 / 0 / 97 / 0 | no (first kind sampled: model, last: model) | 0  | none  |
| 1440x900@1 | C | low (auto) | chai-B-OZIeNI.glb 200 at 986 ms on #/nook; chai-B-OZIeNI.glb no response (aborted) at 18718 ms on #/nook | model / True / 7 | state=ready, ms=1288, bytes=45572 | 869 / 0 (1 engine) | 188 / 0 | 122 / 0 / 95 / 27 | yes: sample #585, 9344 ms after the engine appeared | 0  | none ['17756ms http://127.0.0.1:5461/assets/chai-B-OZIeNI.glb net::ERR_ABORTED'] |
| 390x844@2 | D | low (auto) | chai-B-OZIeNI.glb 200 at 1165 ms on #/nook | model / True / 7 | state=ready, ms=823, bytes=45572 | 594 / 0 (1 engine) | 189 / 0 | 117 / 0 / 116 / 1 | yes: sample #246, 3910 ms after the engine appeared | 0  | none  |
| 1440x900@1 | D | low (auto) | chai-B-OZIeNI.glb 200 at 1620 ms on #/nook | model / True / 7 | state=ready, ms=740, bytes=45572 | 591 / 0 (1 engine) | 188 / 0 | 95 / 0 / 94 / 1 | yes: sample #310, 4944 ms after the engine appeared | 0  | none  |


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

In all 12 trial groups (6 Nook, 6 unlock) of pass 2 the single `.glb` request was made while the route was Home (`#/`), before the Nook or the Done route was entered (field `hash` in each `meta.json`); no `.glb` request was made on `#/nook` or `#/done`. Control: 0 requests in all 12.

#### Nook (4 s after ready)

| cfg | side | tier | chai kind (field) | root.userData.model | .glb requests | errors (page/console err) | files |
|---|---|---|---|---|---|---|---|
| 1440x900-dark | control | low | no field (control predates the model) | False | 0 | 0 / 0 | nook-3d.png |
| 1440x900-dark | trial | low | model | True | 1 | 0 / 0 | nook-3d.png |
| 1440x900-light | control | low | no field (control predates the model) | False | 0 | 0 / 0 | nook-3d.png |
| 1440x900-light | trial | low | model | True | 1 | 0 / 0 | nook-3d.png |
| 1440x900-night | control | low | no field (control predates the model) | False | 0 | 0 / 0 | nook-3d.png |
| 1440x900-night | trial | low | model | True | 1 | 0 / 0 | nook-3d.png |
| 390x844-dark | control | low | no field (control predates the model) | False | 0 | 0 / 0 | nook-3d.png |
| 390x844-dark | trial | low | model | True | 1 | 0 / 0 | nook-3d.png |
| 390x844-light | control | low | no field (control predates the model) | False | 0 | 0 / 0 | nook-3d.png |
| 390x844-light | trial | low | model | True | 1 | 0 / 0 | nook-3d.png |
| 390x844-night | control | low | no field (control predates the model) | False | 0 | 0 / 0 | nook-3d.png |
| 390x844-night | trial | low | model | True | 1 | 0 / 0 | nook-3d.png |

#### Summary unlock card (after finish())

| cfg | side | capture | hash | engine in unlock section | engine mode | chai kind (field) | root.userData.model | .glb requests so far | actual shot start ms | host (mode/ready/static) |
|---|---|---|---|---|---|---|---|---|---|---|
| 1440x900-dark | control | unlock-4s | #/done | True | showcase | no field (control predates the model) | False | 0 | 11419 | [('showcase', 'false', None)] |
| 1440x900-dark | control | unlock-10s | #/done | True | showcase | no field (control predates the model) | False | 0 | 14667 | [('showcase', 'false', None)] |
| 1440x900-dark | trial | unlock-4s | #/done | True | showcase | procedural | False | 1 | 12330 | [('showcase', 'false', None)] |
| 1440x900-dark | trial | unlock-10s | #/done | True | showcase | procedural | False | 1 | 15300 | [('showcase', 'true', None)] |
| 1440x900-light | control | unlock-4s | #/done | True | showcase | no field (control predates the model) | False | 0 | 7808 | [('showcase', 'false', None)] |
| 1440x900-light | control | unlock-10s | #/done | True | showcase | no field (control predates the model) | False | 0 | 12485 | [('showcase', 'true', None)] |
| 1440x900-light | trial | unlock-4s | #/done | True | showcase | procedural | False | 1 | 12152 | [('showcase', 'false', None)] |
| 1440x900-light | trial | unlock-10s | #/done | True | showcase | procedural | False | 1 | 15298 | [('showcase', 'true', None)] |
| 1440x900-night | control | unlock-4s | #/done | True | showcase | no field (control predates the model) | False | 0 | 10008 | [('showcase', 'false', None)] |
| 1440x900-night | control | unlock-10s | #/done | True | showcase | no field (control predates the model) | False | 0 | 13492 | [('showcase', 'false', None)] |
| 1440x900-night | trial | unlock-4s | #/done | True | showcase | procedural | False | 1 | 11878 | [('showcase', 'false', None)] |
| 1440x900-night | trial | unlock-10s | #/done | True | showcase | procedural | False | 1 | 15079 | [('showcase', 'false', None)] |
| 390x844-dark | control | unlock-4s | #/done | True | showcase | no field (control predates the model) | False | 0 | 7173 | [('showcase', 'false', None)] |
| 390x844-dark | control | unlock-10s | #/done | True | showcase | no field (control predates the model) | False | 0 | 10206 | [('showcase', 'true', None)] |
| 390x844-dark | trial | unlock-4s | #/done | True | showcase | procedural | False | 1 | 7028 | [('showcase', 'false', None)] |
| 390x844-dark | trial | unlock-10s | #/done | True | showcase | procedural | False | 1 | 10278 | [('showcase', 'true', None)] |
| 390x844-light | control | unlock-4s | #/done | True | showcase | no field (control predates the model) | False | 0 | 7391 | [('showcase', 'false', None)] |
| 390x844-light | control | unlock-10s | #/done | True | showcase | no field (control predates the model) | False | 0 | 10102 | [('showcase', 'true', None)] |
| 390x844-light | trial | unlock-4s | #/done | True | showcase | procedural | False | 1 | 7141 | [('showcase', 'false', None)] |
| 390x844-light | trial | unlock-10s | #/done | True | showcase | procedural | False | 1 | 10217 | [('showcase', 'true', None)] |
| 390x844-night | control | unlock-4s | #/done | True | showcase | no field (control predates the model) | False | 0 | 7095 | [('showcase', 'false', None)] |
| 390x844-night | control | unlock-10s | #/done | True | showcase | no field (control predates the model) | False | 0 | 10080 | [('showcase', 'false', None)] |
| 390x844-night | trial | unlock-4s | #/done | True | showcase | procedural | False | 1 | 7093 | [('showcase', 'false', None)] |
| 390x844-night | trial | unlock-10s | #/done | True | showcase | procedural | False | 1 | 10173 | [('showcase', 'true', None)] |

#### Unlock timing and errors

| cfg | side | doneAtMs | mounted after done | ready after done | errors | console err/warn (SW noise excluded) |
|---|---|---|---|---|---|---|
| 1440x900-dark | control | 2377 | 0 | None | [] | [] |
| 1440x900-dark | trial | 2429 | 0 | 9312 | [] | [] |
| 1440x900-light | control | 2364 | 0 | 4848 | [] | [] |
| 1440x900-light | trial | 2332 | 0 | 9216 | [] | [] |
| 1440x900-night | control | 2297 | 0 | None | [] | [] |
| 1440x900-night | trial | 2404 | 0 | None | [] | [] |
| 390x844-dark | control | 2329 | 0 | 4429 | [] | [] |
| 390x844-dark | trial | 2328 | 0 | 4320 | [] | [] |
| 390x844-light | control | 2313 | 0 | 4640 | [] | [] |
| 390x844-light | trial | 2351 | 0 | 4384 | [] | [] |
| 390x844-night | control | 2370 | 0 | None | [] | [] |
| 390x844-night | trial | 2345 | 0 | 4320 | [] | [] |

#### Text differences (control vs trial), recorded, not attributed

- 1440x900-dark unlock-4s unlockText: identical text
- 1440x900-dark unlock-4s mainText: DIFFERENT
  - control: 25 minutes brewed Tea’s ready. Take five before the next one. Record player is in your nook 8 Cozy level 8 · Plays mostly rain sounds. Chai approves. +68 leaves Goal met · 37/30 min Daily goal met: 37 of 30 minutes today 7 7 days warm, your best yet Tea Cozy earned You earned a Tea Cozy: it keeps your streak warm for one missed day 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves added up Tea time · 5 min Skip break 25 minutes brewed. 68 leaves earned. Daily goal met. Warm streak: 7 days. Cozy level 8: something new in your nook. New badge: Warm Streak. New bad
  - trial:   25 minutes brewed Tea’s ready. Take five before the next one. Record player is in your nook 8 Cozy level 8 · Plays mostly rain sounds. Chai approves. +68 leaves Goal met · 37/30 min Daily goal met: 37 of 30 minutes today 7 7 days warm, your best yet Tea Cozy earned You earned a Tea Cozy: it covers one missed day, so your warm days keep going 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves added up Tea time · 5 min Skip break 25 minutes brewed. 68 leaves earned. Daily goal met. 7 days warm. Cozy level 8: something new in your nook. New badge: Warm Streak. New b
- 1440x900-dark unlock-10s unlockText: identical text
- 1440x900-dark unlock-10s mainText: DIFFERENT
  - control: 25 minutes brewed Tea’s ready. Take five before the next one. Record player is in your nook 8 Cozy level 8 · Plays mostly rain sounds. Chai approves. +68 leaves Goal met · 37/30 min Daily goal met: 37 of 30 minutes today 7 7 days warm, your best yet Tea Cozy earned You earned a Tea Cozy: it keeps your streak warm for one missed day 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves added up Tea time · 5 min Skip break 25 minutes brewed. 68 leaves earned. Daily goal met. Warm streak: 7 days. Cozy level 8: something new in your nook. New badge: Warm Streak. New bad
  - trial:   25 minutes brewed Tea’s ready. Take five before the next one. Record player is in your nook 8 Cozy level 8 · Plays mostly rain sounds. Chai approves. +68 leaves Goal met · 37/30 min Daily goal met: 37 of 30 minutes today 7 7 days warm, your best yet Tea Cozy earned You earned a Tea Cozy: it covers one missed day, so your warm days keep going 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves added up Tea time · 5 min Skip break 25 minutes brewed. 68 leaves earned. Daily goal met. 7 days warm. Cozy level 8: something new in your nook. New badge: Warm Streak. New b
- 1440x900-dark nook mainText: identical text
- 1440x900-light unlock-4s unlockText: identical text
- 1440x900-light unlock-4s mainText: DIFFERENT
  - control: 25 minutes brewed Tea’s ready. Take five before the next one. Record player is in your nook 8 Cozy level 8 · Plays mostly rain sounds. Chai approves. +68 leaves Goal met · 37/30 min Daily goal met: 37 of 30 minutes today 7 7 days warm, your best yet Tea Cozy earned You earned a Tea Cozy: it keeps your streak warm for one missed day 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves added up Tea time · 5 min Skip break 25 minutes brewed. 68 leaves earned. Daily goal met. Warm streak: 7 days. Cozy level 8: something new in your nook. New badge: Warm Streak. New bad
  - trial:   25 minutes brewed Tea’s ready. Take five before the next one. Record player is in your nook 8 Cozy level 8 · Plays mostly rain sounds. Chai approves. +68 leaves Goal met · 37/30 min Daily goal met: 37 of 30 minutes today 7 7 days warm, your best yet Tea Cozy earned You earned a Tea Cozy: it covers one missed day, so your warm days keep going 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves added up Tea time · 5 min Skip break 25 minutes brewed. 68 leaves earned. Daily goal met. 7 days warm. Cozy level 8: something new in your nook. New badge: Warm Streak. New b
- 1440x900-light unlock-10s unlockText: identical text
- 1440x900-light unlock-10s mainText: DIFFERENT
  - control: 25 minutes brewed Tea’s ready. Take five before the next one. Record player is in your nook 8 Cozy level 8 · Plays mostly rain sounds. Chai approves. +68 leaves Goal met · 37/30 min Daily goal met: 37 of 30 minutes today 7 7 days warm, your best yet Tea Cozy earned You earned a Tea Cozy: it keeps your streak warm for one missed day 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves added up Tea time · 5 min Skip break 25 minutes brewed. 68 leaves earned. Daily goal met. Warm streak: 7 days. Cozy level 8: something new in your nook. New badge: Warm Streak. New bad
  - trial:   25 minutes brewed Tea’s ready. Take five before the next one. Record player is in your nook 8 Cozy level 8 · Plays mostly rain sounds. Chai approves. +68 leaves Goal met · 37/30 min Daily goal met: 37 of 30 minutes today 7 7 days warm, your best yet Tea Cozy earned You earned a Tea Cozy: it covers one missed day, so your warm days keep going 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves added up Tea time · 5 min Skip break 25 minutes brewed. 68 leaves earned. Daily goal met. 7 days warm. Cozy level 8: something new in your nook. New badge: Warm Streak. New b
- 1440x900-light nook mainText: identical text
- 1440x900-night unlock-4s unlockText: identical text
- 1440x900-night unlock-4s mainText: DIFFERENT
  - control: 25 minutes brewed Tea’s ready. Take five before the next one. Record player is in your nook 8 Cozy level 8 · Plays mostly rain sounds. Chai approves. +68 leaves Goal met · 37/30 min Daily goal met: 37 of 30 minutes today 7 7 days warm, your best yet Tea Cozy earned You earned a Tea Cozy: it keeps your streak warm for one missed day 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves added up Tea time · 5 min Skip break 25 minutes brewed. 68 leaves earned. Daily goal met. Warm streak: 7 days. Cozy level 8: something new in your nook. New badge: Warm Streak. New bad
  - trial:   25 minutes brewed Tea’s ready. Take five before the next one. Record player is in your nook 8 Cozy level 8 · Plays mostly rain sounds. Chai approves. +68 leaves Goal met · 37/30 min Daily goal met: 37 of 30 minutes today 7 7 days warm, your best yet Tea Cozy earned You earned a Tea Cozy: it covers one missed day, so your warm days keep going 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves added up Tea time · 5 min Skip break 25 minutes brewed. 68 leaves earned. Daily goal met. 7 days warm. Cozy level 8: something new in your nook. New badge: Warm Streak. New b
- 1440x900-night unlock-10s unlockText: identical text
- 1440x900-night unlock-10s mainText: DIFFERENT
  - control: 25 minutes brewed Tea’s ready. Take five before the next one. Record player is in your nook 8 Cozy level 8 · Plays mostly rain sounds. Chai approves. +68 leaves Goal met · 37/30 min Daily goal met: 37 of 30 minutes today 7 7 days warm, your best yet Tea Cozy earned You earned a Tea Cozy: it keeps your streak warm for one missed day 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves added up Tea time · 5 min Skip break 25 minutes brewed. 68 leaves earned. Daily goal met. Warm streak: 7 days. Cozy level 8: something new in your nook. New badge: Warm Streak. New bad
  - trial:   25 minutes brewed Tea’s ready. Take five before the next one. Record player is in your nook 8 Cozy level 8 · Plays mostly rain sounds. Chai approves. +68 leaves Goal met · 37/30 min Daily goal met: 37 of 30 minutes today 7 7 days warm, your best yet Tea Cozy earned You earned a Tea Cozy: it covers one missed day, so your warm days keep going 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves added up Tea time · 5 min Skip break 25 minutes brewed. 68 leaves earned. Daily goal met. 7 days warm. Cozy level 8: something new in your nook. New badge: Warm Streak. New b
- 1440x900-night nook mainText: identical text
- 390x844-dark unlock-4s unlockText: identical text
- 390x844-dark unlock-4s mainText: DIFFERENT
  - control: 25 minutes brewed Tea’s ready. Take five before the next one. Record player is in your nook 8 Cozy level 8 · Plays mostly rain sounds. Chai approves. +68 leaves Goal met · 37/30 min Daily goal met: 37 of 30 minutes today 7 7 days warm, your best yet Tea Cozy earned You earned a Tea Cozy: it keeps your streak warm for one missed day 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves added up Tea time · 5 min Skip break 25 minutes brewed. 68 leaves earned. Daily goal met. Warm streak: 7 days. Cozy level 8: something new in your nook. New badge: Warm Streak. New bad
  - trial:   25 minutes brewed Tea’s ready. Take five before the next one. Record player is in your nook 8 Cozy level 8 · Plays mostly rain sounds. Chai approves. +68 leaves Goal met · 37/30 min Daily goal met: 37 of 30 minutes today 7 7 days warm, your best yet Tea Cozy earned You earned a Tea Cozy: it covers one missed day, so your warm days keep going 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves added up Tea time · 5 min Skip break 25 minutes brewed. 68 leaves earned. Daily goal met. 7 days warm. Cozy level 8: something new in your nook. New badge: Warm Streak. New b
- 390x844-dark unlock-10s unlockText: identical text
- 390x844-dark unlock-10s mainText: DIFFERENT
  - control: 25 minutes brewed Tea’s ready. Take five before the next one. Record player is in your nook 8 Cozy level 8 · Plays mostly rain sounds. Chai approves. +68 leaves Goal met · 37/30 min Daily goal met: 37 of 30 minutes today 7 7 days warm, your best yet Tea Cozy earned You earned a Tea Cozy: it keeps your streak warm for one missed day 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves added up Tea time · 5 min Skip break 25 minutes brewed. 68 leaves earned. Daily goal met. Warm streak: 7 days. Cozy level 8: something new in your nook. New badge: Warm Streak. New bad
  - trial:   25 minutes brewed Tea’s ready. Take five before the next one. Record player is in your nook 8 Cozy level 8 · Plays mostly rain sounds. Chai approves. +68 leaves Goal met · 37/30 min Daily goal met: 37 of 30 minutes today 7 7 days warm, your best yet Tea Cozy earned You earned a Tea Cozy: it covers one missed day, so your warm days keep going 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves added up Tea time · 5 min Skip break 25 minutes brewed. 68 leaves earned. Daily goal met. 7 days warm. Cozy level 8: something new in your nook. New badge: Warm Streak. New b
- 390x844-dark nook mainText: identical text
- 390x844-light unlock-4s unlockText: identical text
- 390x844-light unlock-4s mainText: DIFFERENT
  - control: 25 minutes brewed Tea’s ready. Take five before the next one. Record player is in your nook 8 Cozy level 8 · Plays mostly rain sounds. Chai approves. +68 leaves Goal met · 37/30 min Daily goal met: 37 of 30 minutes today 7 7 days warm, your best yet Tea Cozy earned You earned a Tea Cozy: it keeps your streak warm for one missed day 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves added up Tea time · 5 min Skip break 25 minutes brewed. 68 leaves earned. Daily goal met. Warm streak: 7 days. Cozy level 8: something new in your nook. New badge: Warm Streak. New bad
  - trial:   25 minutes brewed Tea’s ready. Take five before the next one. Record player is in your nook 8 Cozy level 8 · Plays mostly rain sounds. Chai approves. +68 leaves Goal met · 37/30 min Daily goal met: 37 of 30 minutes today 7 7 days warm, your best yet Tea Cozy earned You earned a Tea Cozy: it covers one missed day, so your warm days keep going 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves added up Tea time · 5 min Skip break 25 minutes brewed. 68 leaves earned. Daily goal met. 7 days warm. Cozy level 8: something new in your nook. New badge: Warm Streak. New b
- 390x844-light unlock-10s unlockText: identical text
- 390x844-light unlock-10s mainText: DIFFERENT
  - control: 25 minutes brewed Tea’s ready. Take five before the next one. Record player is in your nook 8 Cozy level 8 · Plays mostly rain sounds. Chai approves. +68 leaves Goal met · 37/30 min Daily goal met: 37 of 30 minutes today 7 7 days warm, your best yet Tea Cozy earned You earned a Tea Cozy: it keeps your streak warm for one missed day 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves added up Tea time · 5 min Skip break 25 minutes brewed. 68 leaves earned. Daily goal met. Warm streak: 7 days. Cozy level 8: something new in your nook. New badge: Warm Streak. New bad
  - trial:   25 minutes brewed Tea’s ready. Take five before the next one. Record player is in your nook 8 Cozy level 8 · Plays mostly rain sounds. Chai approves. +68 leaves Goal met · 37/30 min Daily goal met: 37 of 30 minutes today 7 7 days warm, your best yet Tea Cozy earned You earned a Tea Cozy: it covers one missed day, so your warm days keep going 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves added up Tea time · 5 min Skip break 25 minutes brewed. 68 leaves earned. Daily goal met. 7 days warm. Cozy level 8: something new in your nook. New badge: Warm Streak. New b
- 390x844-light nook mainText: identical text
- 390x844-night unlock-4s unlockText: identical text
- 390x844-night unlock-4s mainText: DIFFERENT
  - control: 25 minutes brewed Tea’s ready. Take five before the next one. Record player is in your nook 8 Cozy level 8 · Plays mostly rain sounds. Chai approves. +68 leaves Goal met · 37/30 min Daily goal met: 37 of 30 minutes today 7 7 days warm, your best yet Tea Cozy earned You earned a Tea Cozy: it keeps your streak warm for one missed day 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves added up Tea time · 5 min Skip break 25 minutes brewed. 68 leaves earned. Daily goal met. Warm streak: 7 days. Cozy level 8: something new in your nook. New badge: Warm Streak. New bad
  - trial:   25 minutes brewed Tea’s ready. Take five before the next one. Record player is in your nook 8 Cozy level 8 · Plays mostly rain sounds. Chai approves. +68 leaves Goal met · 37/30 min Daily goal met: 37 of 30 minutes today 7 7 days warm, your best yet Tea Cozy earned You earned a Tea Cozy: it covers one missed day, so your warm days keep going 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves added up Tea time · 5 min Skip break 25 minutes brewed. 68 leaves earned. Daily goal met. 7 days warm. Cozy level 8: something new in your nook. New badge: Warm Streak. New b
- 390x844-night unlock-10s unlockText: identical text
- 390x844-night unlock-10s mainText: DIFFERENT
  - control: 25 minutes brewed Tea’s ready. Take five before the next one. Record player is in your nook 8 Cozy level 8 · Plays mostly rain sounds. Chai approves. +68 leaves Goal met · 37/30 min Daily goal met: 37 of 30 minutes today 7 7 days warm, your best yet Tea Cozy earned You earned a Tea Cozy: it keeps your streak warm for one missed day 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves added up Tea time · 5 min Skip break 25 minutes brewed. 68 leaves earned. Daily goal met. Warm streak: 7 days. Cozy level 8: something new in your nook. New badge: Warm Streak. New bad
  - trial:   25 minutes brewed Tea’s ready. Take five before the next one. Record player is in your nook 8 Cozy level 8 · Plays mostly rain sounds. Chai approves. +68 leaves Goal met · 37/30 min Daily goal met: 37 of 30 minutes today 7 7 days warm, your best yet Tea Cozy earned You earned a Tea Cozy: it covers one missed day, so your warm days keep going 2 recipes done 7 II Badge: Warm Streak II I Badge: Weekend Warmth How your leaves added up Tea time · 5 min Skip break 25 minutes brewed. 68 leaves earned. Daily goal met. 7 days warm. Cozy level 8: something new in your nook. New badge: Warm Streak. New b
- 390x844-night nook mainText: identical text


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
- Layout consequence, pass 2 (card canvas rectangle from `meta.json`, `scrollY` 0 on both sides): at 390×844 in all three looks the card canvas is at y=470 on control and y=509 on trial (same 152×114 box; the card section is at y=460 vs 499 in light), i.e. 39 CSS px lower on the trial. At 1440×900 in all three looks the card canvas is at the same place on both sides (`[942,145,426,239]`).

### 3.4 Pixel numbers (raw, no interpretation)

Whole-viewport difference, control vs trial, tolerance 16 on the largest channel (also "any difference"), bounding box of the pixels over 16. Pass 2:

| cfg | image | size | % px diff > 16 | % px diff > 0 | bbox of diff > 16 (x0,y0,x1,y1) |
|---|---|---|---|---|---|
| 1440x900-dark | nook-3d | 1440x900 | 1.239 | 9.813 | (537, 315, 1156, 714) |
| 1440x900-dark | unlock-4s | 1440x900 | 0.000 | 0.000 | None |
| 1440x900-dark | unlock-10s | 1440x900 | 7.874 | 7.875 | (942, 145, 1367, 384) |
| 1440x900-light | nook-3d | 1440x900 | 1.417 | 12.192 | (536, 312, 1170, 716) |
| 1440x900-light | unlock-4s | 1440x900 | 0.000 | 0.001 | None |
| 1440x900-light | unlock-10s | 1440x900 | 2.830 | 7.513 | (942, 145, 1367, 384) |
| 1440x900-night | nook-3d | 1440x900 | 1.025 | 8.582 | (537, 318, 1172, 714) |
| 1440x900-night | unlock-4s | 1440x900 | 0.000 | 0.000 | None |
| 1440x900-night | unlock-10s | 1440x900 | 0.000 | 0.000 | None |
| 390x844-dark | nook-3d | 780x1688 | 0.370 | 2.091 | (175, 346, 623, 616) |
| 390x844-dark | unlock-4s | 780x1688 | 17.390 | 27.294 | (0, 730, 779, 1383) |
| 390x844-dark | unlock-10s | 780x1688 | 20.014 | 27.147 | (0, 730, 779, 1383) |
| 390x844-light | nook-3d | 780x1688 | 0.399 | 2.925 | (177, 337, 628, 618) |
| 390x844-light | unlock-4s | 780x1688 | 20.821 | 27.448 | (0, 723, 779, 1401) |
| 390x844-light | unlock-10s | 780x1688 | 22.153 | 27.490 | (0, 723, 779, 1401) |
| 390x844-night | nook-3d | 780x1688 | 0.772 | 7.461 | (174, 329, 623, 617) |
| 390x844-night | unlock-4s | 780x1688 | 20.778 | 27.294 | (0, 730, 779, 1401) |
| 390x844-night | unlock-10s | 780x1688 | 22.235 | 27.156 | (0, 730, 779, 1401) |


Pass 1 numbers: `summaries/pixeldiff-pass1-contended.md`.

Card-canvas crop only, pass 2 (each side cropped at its own canvas rectangle from `meta.json`; the card host `ready` flag of each side at the capture is in the second and third columns):

| cfg | image | control: card host ready / canvas rect (css px x,y,w,h) | trial: card host ready / canvas rect | crop used (device px) | % px diff > 16 in card canvas | % px diff > 0 | max channel diff |
|---|---|---|---|---|---|---|---|
| 1440x900-dark | unlock-4s | ['false'] [942, 145, 426, 239] | ['false'] [942, 145, 426, 239] | (control 942,145; trial 942,145; 426x239) | 0.000 | 0.000 | 0 |
| 1440x900-dark | unlock-10s | ['false'] [942, 145, 426, 239] | ['true'] [942, 145, 426, 239] | (control 942,145; trial 942,145; 426x239) | 99.836 | 99.847 | 224 |
| 1440x900-light | unlock-4s | ['false'] [942, 145, 426, 239] | ['false'] [942, 145, 426, 239] | (control 942,145; trial 942,145; 426x239) | 0.000 | 0.000 | 0 |
| 1440x900-light | unlock-10s | ['true'] [942, 145, 426, 239] | ['true'] [942, 145, 426, 239] | (control 942,145; trial 942,145; 426x239) | 35.909 | 95.234 | 168 |
| 1440x900-night | unlock-4s | ['false'] [942, 145, 426, 239] | ['false'] [942, 145, 426, 239] | (control 942,145; trial 942,145; 426x239) | 0.000 | 0.000 | 0 |
| 1440x900-night | unlock-10s | ['false'] [942, 145, 426, 239] | ['false'] [942, 145, 426, 239] | (control 942,145; trial 942,145; 426x239) | 0.000 | 0.000 | 0 |
| 390x844-dark | unlock-4s | ['false'] [30, 470, 152, 114] | ['false'] [30, 509, 152, 114] | (control 60,940; trial 60,1018; 304x228) | 0.000 | 7.277 | 2 |
| 390x844-dark | unlock-10s | ['true'] [30, 470, 152, 114] | ['true'] [30, 509, 152, 114] | (control 60,940; trial 60,1018; 304x228) | 1.801 | 97.661 | 181 |
| 390x844-light | unlock-4s | ['false'] [30, 470, 152, 114] | ['false'] [30, 509, 152, 114] | (control 60,940; trial 60,1018; 304x228) | 0.000 | 7.228 | 2 |
| 390x844-light | unlock-10s | ['true'] [30, 470, 152, 114] | ['true'] [30, 509, 152, 114] | (control 60,940; trial 60,1018; 304x228) | 2.170 | 71.112 | 133 |
| 390x844-night | unlock-4s | ['false'] [30, 470, 152, 114] | ['false'] [30, 509, 152, 114] | (control 60,940; trial 60,1018; 304x228) | 0.000 | 7.270 | 2 |
| 390x844-night | unlock-10s | ['false'] [30, 470, 152, 114] | ['true'] [30, 509, 152, 114] | (control 60,940; trial 60,1018; 304x228) | 98.215 | 98.852 | 223 |


### 3.5 Supplement: the unlock card at "scene ready + 3.5 s", loop held, each side taken twice

Script `scripts/unlockready.mjs`: celebrate seed, `finish()`, wait until the card host reports `data-scene-ready="true"`, wait 3.5 s, scroll the card to the middle, `setRunning(false)`, 400 ms, read facts, screenshot. Order per config: control r1, trial r1, control r2, trial r2. The control-vs-control pair is the baseline for the control-vs-trial pairs.

#### 1440x900-light

| run | side | ready after finish() ms | shot at ms | engine in unlock section | chai kind (field) | root.userData.model | .glb requests | card host ready | canvas rect (css px) | scrollY | page errors |
|---|---|---|---|---|---|---|---|---|---|---|---|
| c1 | control | 71196 | 91410 | True | no field (control predates the model) | False | 0 | true | [942, 145, 426, 239] | 0 | 0 |
| c2 | control | 47884 | 67634 | True | no field (control predates the model) | False | 0 | true | [942, 145, 426, 239] | 0 | 0 |
| t1 | trial | 63604 | 79319 | True | procedural | False | 1 | true | [942, 145, 426, 239] | 0 | 0 |
| t2 | trial | 41865 | 61508 | True | procedural | False | 1 | true | [942, 145, 426, 239] | 0 | 0 |

Card-canvas crop, pixel difference between two runs (each crop at that run's own canvas rect, same size):

| pair | kind of pair | % px diff > 16 | % px diff > 0 | max channel diff |
|---|---|---|---|---|
| c1 vs c2 | control vs control (baseline) | 2.326 | 90.714 | 131 |
| c1 vs t1 | control vs trial | 2.212 | 90.435 | 122 |
| c1 vs t2 | control vs trial | 3.775 | 92.953 | 169 |
| c2 vs t1 | control vs trial | 0.132 | 29.347 | 41 |
| c2 vs t2 | control vs trial | 2.577 | 89.374 | 148 |
| t1 vs t2 | trial vs trial | 2.651 | 89.760 | 153 |

#### 390x844-light

| run | side | ready after finish() ms | shot at ms | engine in unlock section | chai kind (field) | root.userData.model | .glb requests | card host ready | canvas rect (css px) | scrollY | page errors |
|---|---|---|---|---|---|---|---|---|---|---|---|
| c1 | control | 20366 | 30094 | True | no field (control predates the model) | False | 0 | true | [30, 296, 152, 114] | 0 | 0 |
| c2 | control | 21721 | 31878 | True | no field (control predates the model) | False | 0 | true | [30, 296, 152, 114] | 0 | 0 |
| t1 | trial | 19743 | 30350 | True | procedural | False | 1 | true | [30, 296, 152, 114] | 0 | 0 |
| t2 | trial | 19974 | 28610 | True | procedural | False | 1 | true | [30, 296, 152, 114] | 0 | 0 |

Card-canvas crop, pixel difference between two runs (each crop at that run's own canvas rect, same size):

| pair | kind of pair | % px diff > 16 | % px diff > 0 | max channel diff |
|---|---|---|---|---|
| c1 vs c2 | control vs control (baseline) | 0.430 | 55.266 | 60 |
| c1 vs t1 | control vs trial | 0.107 | 17.886 | 43 |
| c1 vs t2 | control vs trial | 1.326 | 75.642 | 64 |
| c2 vs t1 | control vs trial | 0.290 | 48.365 | 53 |
| c2 vs t2 | control vs trial | 1.806 | 81.094 | 79 |
| t1 vs t2 | trial vs trial | 1.434 | 77.130 | 79 |


## 4. Low-tier frame time and memory, preview `:5461`, same browser session

Script `scripts/check4.mjs`. One Chromium launch; six contexts in sequence (3 rounds, alternating); 390×844 at DPR 3 (the engine's canvas is capped by its own pixel budget: the canvas size is in the raw JSON); default tier (`quality` low in all runs); Nook, cold load at `#/nook`, `veteran` seed.
- **model**: default, no routing.
- **procedural**: every `.glb` data request aborted by a Playwright route (`route.abort('failed')`), so the engine keeps the procedural Chai; confirmed per run by `chaiKind` `procedural`, `root.userData.model` false and `chai3d.status()` `failed`.
- Frame time: `engine.frame(1/30)` followed by a 1-pixel `gl.readPixels` (forces the CPU rasterizer to finish), loop stopped with `setRunning(false)`, 10 warm-up frames, then 60 timed frames.
- Counters: `renderer.info` read from `window.__nook.renderer` (a private field in TypeScript, present at run time because `?debug` exposes the engine): `info.render.calls`, `info.render.triangles`, `info.memory.geometries`, `info.memory.textures`, `info.programs.length`.
- JS heap: CDP `HeapProfiler.collectGarbage` twice, then `Runtime.getHeapUsage`.
- Set 1, model first in each round, 19:06:55 to 19:08:33: `perf/check4-perf-low-390x844.json`. Set 2 (extra, procedural first in each round), 19:08:42 to 19:10:23: `perf/check4b-perf-low-390x844-procedural-first.json`. Machine otherwise idle (load average at the start of each run in the tables).

Set 1 (model first), per run and per variant:

vp 390x844@3, rounds 3, frames/round 60, warm-up 10

#### Per run

| round | variant | chai kind | root.userData.model | .glb requests (aborted) | frame median ms | mean | p90 | min | max | draw calls | triangles | geometries | textures | programs | JS heap MB | ready ms | final ms | long tasks (n / max ms) | load 1m/5m/15m | errors |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | model | model | True | 1 (0) | 96 | 96 | 107 | 83 | 119 | 108 | 74910 | 111 | 10 | 23 | 11.25 | 4126 | 4145 | 4 / 631 | 4.62 7.69 7.18 | [] |
| 1 | procedural | procedural | False | 2 (2) | 94 | 96.12 | 111 | 84 | 118 | 111 | 76752 | 114 | 8 | 19 | 10.91 | 2570 | 2590 | 3 / 140 | 4.54 7.47 7.12 | [] |
| 2 | model | model | True | 1 (0) | 88 | 91.22 | 104 | 82 | 111 | 108 | 74910 | 111 | 10 | 23 | 11.19 | 2642 | 2672 | 3 / 154 | 4.57 7.33 7.08 | [] |
| 2 | procedural | procedural | False | 2 (2) | 97 | 98.38 | 113 | 85 | 121 | 111 | 76752 | 114 | 8 | 19 | 10.89 | 2734 | 2752 | 3 / 180 | 4.32 7.14 7.02 | [] |
| 3 | model | model | True | 1 (0) | 94 | 93.97 | 105 | 84 | 113 | 108 | 74910 | 111 | 10 | 23 | 11.16 | 2697 | 2718 | 3 / 176 | 4.68 7.08 7.00 | [] |
| 3 | procedural | procedural | False | 2 (2) | 94 | 96.3 | 113 | 83 | 124 | 111 | 76752 | 114 | 8 | 19 | 10.88 | 2584 | 2599 | 2 / 135 | 4.55 6.93 6.95 | [] |

#### Per variant (medians over rounds)

| variant | runs | frame median ms: per-run medians | median of medians | median of means | median p90 | draw calls | triangles | geometries | textures | programs | JS heap MB (per run) | median heap |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| model | 3 | [96, 88, 94] | 94.00 | 93.97 | 105.00 | [108] | [74910] | [111] | [10] | [23] | [11.25, 11.19, 11.16] | 11.19 |
| procedural | 3 | [94, 97, 94] | 94.00 | 96.30 | 113.00 | [111] | [76752] | [114] | [8] | [19] | [10.91, 10.89, 10.88] | 10.89 |


Set 2 (procedural first), per run and per variant:

vp 390x844@3, rounds 3, frames/round 60, warm-up 10

#### Per run

| round | variant | chai kind | root.userData.model | .glb requests (aborted) | frame median ms | mean | p90 | min | max | draw calls | triangles | geometries | textures | programs | JS heap MB | ready ms | final ms | long tasks (n / max ms) | load 1m/5m/15m | errors |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | procedural | procedural | False | 2 (2) | 101 | 102.03 | 118 | 86 | 131 | 111 | 76752 | 114 | 8 | 19 | 10.93 | 4021 | 4041 | 3 / 693 | 3.78 6.49 6.80 | [] |
| 1 | model | model | True | 1 (0) | 97 | 99.07 | 114 | 85 | 121 | 108 | 74910 | 111 | 10 | 23 | 11.2 | 3210 | 3231 | 4 / 293 | 3.91 6.39 6.76 | [] |
| 2 | procedural | procedural | False | 2 (2) | 101 | 99.88 | 111 | 84 | 129 | 111 | 76752 | 114 | 8 | 19 | 10.9 | 2571 | 2589 | 3 / 164 | 3.83 6.20 6.69 | [] |
| 2 | model | model | True | 1 (0) | 95 | 97.67 | 113 | 84 | 134 | 108 | 74910 | 111 | 10 | 23 | 11.23 | 3066 | 3082 | 3 / 156 | 4.01 6.13 6.66 | [] |
| 3 | procedural | procedural | False | 2 (2) | 94 | 97.28 | 114 | 85 | 123 | 111 | 76752 | 114 | 8 | 19 | 10.92 | 2634 | 2653 | 2 / 135 | 3.96 6.01 6.61 | [] |
| 3 | model | model | True | 1 (0) | 94 | 94.92 | 106 | 82 | 121 | 108 | 74910 | 111 | 10 | 23 | 11.24 | 2955 | 2975 | 3 / 215 | 4.17 5.95 6.58 | [] |

#### Per variant (medians over rounds)

| variant | runs | frame median ms: per-run medians | median of medians | median of means | median p90 | draw calls | triangles | geometries | textures | programs | JS heap MB (per run) | median heap |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| model | 3 | [97, 95, 94] | 95.00 | 97.67 | 113.00 | [108] | [74910] | [111] | [10] | [23] | [11.2, 11.23, 11.24] | 11.23 |
| procedural | 3 | [101, 101, 94] | 101.00 | 99.88 | 114.00 | [111] | [76752] | [114] | [8] | [19] | [10.93, 10.9, 10.92] | 10.92 |


## 5. timer-harness, timer-app and pwa

Command: `KETTLE_PORT=5460 KETTLE_PWA_PORT=5493 npx playwright test --project=timer-harness --project=timer-app --project=pwa --workers=1 --output=/tmp/claude-0/lrc-scratch/out-timer` (gate `--n 1`), 18:59:00 to 19:02:44.
- **29 passed, 2 skipped, 0 failed** (3.7 min), exit 0. Matches the expected 29 + 2.
- The 2 skips are `[timer-app]` `timer.spec.ts:294` (keyboard shortcuts infra: Space toggles) and `timer.spec.ts:438` (rendering budget: useRemaining re-renders about once per displayed second).
- Stray process: the pwa spec left `node /home/user/wt/w4tr-c/kettle/node_modules/.bin/vite preview --outDir .../test-results/pwa-dist --port 5493 --strictPort` running as PID 9738 (parent 1). I killed it by that PID at 19:02 and confirmed port 5493 no longer answers. Its build output `kettle/test-results/pwa-dist` is git-ignored.
- The pwa case "precaches the shell, fonts, 3D chunk and tick worker; boots and times a brew offline" passed.
- Log: `runs/check5-timer-pwa.txt`.

## 6. Full chromium suite

Command: `KETTLE_PORT=5460 npx playwright test --project=chromium --workers=2 --output=/tmp/claude-0/lrc-scratch/out-full` (gate `--n 2`), START 2026-10-13T19:19:33Z load=3.36 4.16 5.34, EXIT 1 2026-10-13T19:37:02Z. Machine load was 3 to 14 (check 2 run 2, the unlock-ready supplement and this suite overlapped until about 19:33).

**Result: 106 passed, 1 failed, 7 did not run, 114 total** (Playwright: `1 failed`, `7 did not run`, `106 passed (17.5m)`, exit 1). Log: `runs/check6-full-chromium.txt`.

| spec file | passed | failed | not run (listed) |
|---|---|---|---|
| `a11y.spec.ts` | 3 | 1 | 7 |
| `break-reach.spec.ts` | 7 | 0 | 0 |
| `chai3d.spec.ts` | 9 | 0 | 0 |
| `integrity.spec.ts` | 25 | 0 | 0 |
| `statusbar.spec.ts` | 9 | 0 | 0 |
| `toast-room.spec.ts` | 14 | 0 | 0 |
| `w2-firstvisit.spec.ts` | 6 | 0 | 0 |
| `w2-room.spec.ts` | 7 | 0 | 0 |
| `w2-summary.spec.ts` | 18 | 0 | 0 |
| `whistle.spec.ts` | 8 | 0 | 0 |

The one failure: `tests/a11y.spec.ts:109` "short screen (375×667): every control can be scrolled clear of sticky chrome, no sideways scroll", 51.8 s, between about 19:22 and 19:25, while three of my browser jobs were running (load average 11 to 14). The assertion `expect(out).toEqual([])` received 16 entries, all on the settings page, of the form `settings: "Trailing pothos" stays under h2._groupTitle_...` (the list: Time of day, Window, Trailing pothos, Stack of books, Floor cushion, Fairy lights, Wall shelf, Tea set, Record player, Knitted blanket, Mountain painting, Paper lantern, and four "Locked. Unlocks at cozy level 14/16/18/20" rows). The 7 "did not run" are the remaining tests of `a11y.spec.ts` that follow it in the file (the file runs serially). Trace: `/tmp/claude-0/lrc-scratch/out-full/a11y-short-screen-.../trace.zip`.

Rerun alone (the whole `a11y.spec.ts`, 11 tests, one worker, nothing else of mine running except the other side of this pair):

| Where | Command | Start | End | Result | 109 (the failed case) | Log |
|---|---|---|---|---|---|---|
| trial `:5460` | `KETTLE_PORT=5460 npx playwright test tests/a11y.spec.ts --project=chromium --workers=1` | 2026-10-13T19:37:13Z | 2026-10-13T19:46:03Z | 11 passed (8.8m) | ✓   46.7s | `runs/rerun-a11y-trial-5460.txt` |
| control `:5410` | `KETTLE_PORT=5410 npx playwright test tests/a11y.spec.ts --project=chromium --workers=1` | 2026-10-13T19:37:13Z | 2026-10-13T19:46:03Z | 11 passed (8.8m) | ✓   45.0s | `runs/rerun-a11y-control-5410.txt` |


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
| 19:08:42 to 19:10:23 | check 4 set 2 (procedural first) |
| 19:10:41 to 19:11:28 | check 2 variant D (`check2.mjs --variants D`) |
| 19:11:28 to 19:19:24 | check 3 pass 2 (quiet) |
| 19:19:33 onward | check 6 (full chromium, gate `--n 2`); check 2 run 2 (A, B, C) in parallel |
| 19:23:56 onward | check 2 variant D again (with render counts); unlock-ready supplement (`unlockready.mjs`) |

## 8. Incomplete, deviations and caveats

- **Nothing in the brief was left unrun.** Checks 1 to 6 ran. Check 6 had one failure (plus 7 not run after it in the same serial file); the whole `a11y.spec.ts` was rerun alone on the trial and on control (11/11 passed on each, section 6).
- **"4 s" and "10 s" captures are not at 4 s and 10 s.** The CPU rasterizer keeps the page's main thread busy, so the screenshot starts later than the target. The actual start after `finish()` is recorded per capture (section 3.2 for ranges; `sinceT0Ms` in each `meta.json`). At the "4 s" capture the card host reported `ready=false` in 24 of 24 captures (both passes, both sides), so the card shows its pre-ready state there; at "10 s" it varied (section 3.2). Section 3.5 gives the card at "scene ready + 3.5 s" for light at both sizes (not for dark and night).
- **Pixel numbers are confounded** by (a) the card host ready flag differing between the two sides at the same capture index, (b) live animation in the unlock card (loop not held in the 4 s and 10 s shots), (c) layout shifts from the summary text change at 390×844. The control-vs-control baseline in 3.5 shows how much two captures of the same build differ.
- **DPR:** captures use 390×844 at DPR 2 and 1440×900 at DPR 1 (the maker used 3 and 2) to keep the CPU rasterizer time down; the same on both sides.
- **Service workers were blocked** in my scripts (checks 2, 3, 4), so the precache path was not part of those; it is covered by the `pwa` project in check 5.
- **Check 2:** run 1 lacks `root.userData.model` and renderer-call counts (added for run 2). The held-request variants C and D delay the `.glb` request on purpose; with the 8 s loader timeout this produced the timeout case at 1440×900 in run 1. "Samples every frame" are `requestAnimationFrame` samples on the page's clock (about 16 ms apart); the engine's own renders are far fewer on SwiftShader, so renders are counted separately in run 2.
- **Check 4:** the procedural variant aborts the `.glb` route, so two aborted data requests per page load appear in the raw JSON (`glbRequests`); `info.programs.length` is read from `renderer.info`. Heap and counters are from one run each per round; the raw frame times are in the JSON (`rawMs`). Absolute milliseconds are lower than the maker's (idle machine here, load average about 4).
- **Control scope:** control `:5430` lacks P as well as C, so every difference in section 3 between control and trial is a difference between those two builds, not attributed to either change.
- **`main` text comparison** is limited to the first 1,500 characters of `main.innerText`.
- **Not done:** no comparison of the dev servers (`:5460`, `:5410`) in the browser except specs and the a11y rerun; no visual review of any capture (not in this lane's remit).
- **Processes:** all my browser jobs have ended; the only process I killed was the pwa spec's own preview, PID 9738. No server of the brief was started or stopped.


## 9. Capture list

| path (relative to this folder) | bytes |
|---|---|
| `captures/control/1440x900-dark/nook-3d.png` | 581314 |
| `captures/control/1440x900-dark/unlock-10s.png` | 647761 |
| `captures/control/1440x900-dark/unlock-4s.png` | 714291 |
| `captures/control/1440x900-light/nook-3d.png` | 461712 |
| `captures/control/1440x900-light/unlock-10s.png` | 595440 |
| `captures/control/1440x900-light/unlock-4s.png` | 580603 |
| `captures/control/1440x900-night/nook-3d.png` | 585702 |
| `captures/control/1440x900-night/unlock-10s.png` | 694105 |
| `captures/control/1440x900-night/unlock-4s.png` | 713562 |
| `captures/control/390x844-dark/nook-3d.png` | 451977 |
| `captures/control/390x844-dark/unlock-10s.png` | 596718 |
| `captures/control/390x844-dark/unlock-4s.png` | 581883 |
| `captures/control/390x844-light/nook-3d.png` | 409989 |
| `captures/control/390x844-light/unlock-10s.png` | 523323 |
| `captures/control/390x844-light/unlock-4s.png` | 514203 |
| `captures/control/390x844-night/nook-3d.png` | 451524 |
| `captures/control/390x844-night/unlock-10s.png` | 554669 |
| `captures/control/390x844-night/unlock-4s.png` | 621798 |
| `captures/trial/1440x900-dark/nook-3d.png` | 585013 |
| `captures/trial/1440x900-dark/unlock-10s.png` | 647736 |
| `captures/trial/1440x900-dark/unlock-4s.png` | 714264 |
| `captures/trial/1440x900-light/nook-3d.png` | 464964 |
| `captures/trial/1440x900-light/unlock-10s.png` | 560569 |
| `captures/trial/1440x900-light/unlock-4s.png` | 580621 |
| `captures/trial/1440x900-night/nook-3d.png` | 588851 |
| `captures/trial/1440x900-night/unlock-10s.png` | 646777 |
| `captures/trial/1440x900-night/unlock-4s.png` | 713543 |
| `captures/trial/390x844-dark/nook-3d.png` | 452216 |
| `captures/trial/390x844-dark/unlock-10s.png` | 603084 |
| `captures/trial/390x844-dark/unlock-4s.png` | 637735 |
| `captures/trial/390x844-light/nook-3d.png` | 410222 |
| `captures/trial/390x844-light/unlock-10s.png` | 537789 |
| `captures/trial/390x844-light/unlock-4s.png` | 503964 |
| `captures/trial/390x844-night/nook-3d.png` | 452066 |
| `captures/trial/390x844-night/unlock-10s.png` | 560644 |
| `captures/trial/390x844-night/unlock-4s.png` | 636767 |
| `captures-pass2-quiet/control/1440x900-dark/nook-3d.png` | 581322 |
| `captures-pass2-quiet/control/1440x900-dark/unlock-10s.png` | 647761 |
| `captures-pass2-quiet/control/1440x900-dark/unlock-4s.png` | 714293 |
| `captures-pass2-quiet/control/1440x900-light/nook-3d.png` | 462081 |
| `captures-pass2-quiet/control/1440x900-light/unlock-10s.png` | 598089 |
| `captures-pass2-quiet/control/1440x900-light/unlock-4s.png` | 580631 |
| `captures-pass2-quiet/control/1440x900-night/nook-3d.png` | 584598 |
| `captures-pass2-quiet/control/1440x900-night/unlock-10s.png` | 646777 |
| `captures-pass2-quiet/control/1440x900-night/unlock-4s.png` | 713543 |
| `captures-pass2-quiet/control/390x844-dark/nook-3d.png` | 452296 |
| `captures-pass2-quiet/control/390x844-dark/unlock-10s.png` | 597958 |
| `captures-pass2-quiet/control/390x844-dark/unlock-4s.png` | 622434 |
| `captures-pass2-quiet/control/390x844-light/nook-3d.png` | 410007 |
| `captures-pass2-quiet/control/390x844-light/unlock-10s.png` | 525163 |
| `captures-pass2-quiet/control/390x844-light/unlock-4s.png` | 514203 |
| `captures-pass2-quiet/control/390x844-night/nook-3d.png` | 451535 |
| `captures-pass2-quiet/control/390x844-night/unlock-10s.png` | 554669 |
| `captures-pass2-quiet/control/390x844-night/unlock-4s.png` | 621800 |
| `captures-pass2-quiet/trial/1440x900-dark/nook-3d.png` | 584228 |
| `captures-pass2-quiet/trial/1440x900-dark/unlock-10s.png` | 693916 |
| `captures-pass2-quiet/trial/1440x900-dark/unlock-4s.png` | 714291 |
| `captures-pass2-quiet/trial/1440x900-light/nook-3d.png` | 463527 |
| `captures-pass2-quiet/trial/1440x900-light/unlock-10s.png` | 594004 |
| `captures-pass2-quiet/trial/1440x900-light/unlock-4s.png` | 580627 |
| `captures-pass2-quiet/trial/1440x900-night/nook-3d.png` | 586333 |
| `captures-pass2-quiet/trial/1440x900-night/unlock-10s.png` | 646777 |
| `captures-pass2-quiet/trial/1440x900-night/unlock-4s.png` | 713543 |
| `captures-pass2-quiet/trial/390x844-dark/nook-3d.png` | 452873 |
| `captures-pass2-quiet/trial/390x844-dark/unlock-10s.png` | 604851 |
| `captures-pass2-quiet/trial/390x844-dark/unlock-4s.png` | 637735 |
| `captures-pass2-quiet/trial/390x844-light/nook-3d.png` | 410105 |
| `captures-pass2-quiet/trial/390x844-light/unlock-10s.png` | 535051 |
| `captures-pass2-quiet/trial/390x844-light/unlock-4s.png` | 525687 |
| `captures-pass2-quiet/trial/390x844-night/nook-3d.png` | 451435 |
| `captures-pass2-quiet/trial/390x844-night/unlock-10s.png` | 603350 |
| `captures-pass2-quiet/trial/390x844-night/unlock-4s.png` | 636767 |
| `captures-unlock-ready/control/1440x900-light-r1/ready+3.5s.png` | 594916 |
| `captures-unlock-ready/control/1440x900-light-r2/ready+3.5s.png` | 594297 |
| `captures-unlock-ready/control/390x844-light-r1/ready+3.5s.png` | 409317 |
| `captures-unlock-ready/control/390x844-light-r2/ready+3.5s.png` | 409245 |
| `captures-unlock-ready/trial/1440x900-light-r1/ready+3.5s.png` | 594309 |
| `captures-unlock-ready/trial/1440x900-light-r2/ready+3.5s.png` | 593083 |
| `captures-unlock-ready/trial/390x844-light-r1/ready+3.5s.png` | 389070 |
| `captures-unlock-ready/trial/390x844-light-r2/ready+3.5s.png` | 388469 |

80 PNG files. Each configuration folder also holds `meta.json` with the facts read from the page at each capture. `captures/` is pass 1, `captures-pass2-quiet/` is pass 2 (section 3); the layout asked for is `captures/{control,trial}/<cfg>/`, and pass 2 and the supplement use the same layout under their own folder names.

