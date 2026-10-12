# Lane N · fix re-check · Maker N fix `c381ccb` (items floating on the bare sky at brew start)

**Reviewer:** Lane N, `claude-sonnet-5-5`. Facts only; no verdict. **Window:** 2026-10-12 01:18 → ~01:36 UTC (budget 40 min).
**CONTROL** = old N trial `2acc218` (dev :5340, preview :5350). **FIX** = `55eb968` = integration + `pe/w2-room@92241c2` (code `c381ccb`), `kettle/src` `4b49254fa25be7f9e2e4f788b9ad93181d2c8ff6` (verified with `git rev-parse 55eb968:kettle/src`), preview :5356, dev :5346, worktree `/home/user/wt/w2t-n2`.
`git diff 2acc218 55eb968 -- kettle/src kettle/tests …` = **only** `src/scene/Fallback.tsx` (+22/−2) and `tests/w2-room.spec.ts` (+33): the comparison differs in those two files and nothing else under `kettle/`. The fix, read from the diff: the layer `<svg>` renders only after the base still's `img.decode()` has resolved for the current `src`.
Every browser ran through `slots.py run --lane LN --n 1`. No source edit, commit, push or merge. Nothing of mine is left running. Servers not started or stopped.

## 1. Reproduction on the control (:5350), then the same probe on the fix (:5356)

**Probe** (`fix/probes/float.mjs`, sha256 `bcc61e6c…`; analysis `fix/probes/analyze_float.py`): production preview, 390×844@3 touch (and 1440×900@2), light, `veteran` seed, 3D auto (the engine loading behind the still). **A fresh browser context per brew start** (empty HTTP cache) plus CDP `Network.setCacheDisabled(true)`; CDP `Emulation.setCPUThrottlingRate` from before navigation (4× for starts 1–2, 6× for 3–5 and for 1440×900; plus extra starts with no throttle). No Playwright clock in this probe (real epoch times, so the page's per-animation-frame sampler and the CDP screencast share one time base). Brew started with a real `locator.tap()` (click on desktop) as soon as the button exists (0.3–0.8 s into the load). From the tap: (a) a per-`requestAnimationFrame` sampler of the backdrop host (layer count, whether the still `<img>` is `complete`), (b) a CDP screencast with real timestamps. **Float frame (screencast) = a frame in which the shelf/books/pothos layers are visible while the wall patch of the base still is the bare sky gradient** (colour test calibrated on earlier frames: sky patch R−B ≈ −14, painted still ≈ +31; frames of the Home→Focus transition match neither and are not counted; layers visible = ≥ 3 % dark pixels in the shelf region). "Wall-painted stable" = the first painted-still frame after which no later frame shows the bare sky.

| Start | CPU | float rAF frames (DOM) | **float frames** (screencast: items on the bare sky) | float frames at ms after tap | first layer in DOM (ms) | first frame showing layers (ms) | still `complete` (ms) | first wall-painted frame / stable (ms) | note |
|---|---|---|---|---|---|---|---|---|---|
| **CONTROL :5350 (`2acc218`)** | | | | | | | | | |
| 390×844 #1 | 4× | 0 | **7** | 2651–3008 | 678 | 2651 | 678 | 3308 / 3308 | float interval 2651→3308 ms (657 ms) |
| 390×844 #2 | 4× | 3 | **4** | 1464–1849 | 285 | 1464 | 743 | 2164 / 2164 | float interval 1464→2164 ms (700 ms) |
| 390×844 #3 | 6× | 1 | **10** | 1300–1943 | 771 | 1300 | 771 | 1594 / 2160 | float interval 1300→2160 ms (860 ms) |
| 390×844 #4 | 6× | 1 | **7** | 1542–2717 | 659 | 1542 | 659 | 3160 / 3160 | float interval 1542→3160 ms (1618 ms) |
| 390×844 #5 | 6× | 0 | **4** | 1733–2319 | 768 | 1733 | 768 | 2539 / 2539 | float interval 1733→2539 ms (806 ms) |
| 390×844 (no throttle) #1 | 1× | 3 | **4** | 2106–2538 | 94 | 2106 | 133 | 2771 / 2771 | float interval 2106→2771 ms (665 ms) |
| 390×844 (no throttle) #2 | 1× | 3 | **2** | 967–1290 | 163 | 967 | 215 | 1056 / 1392 | float interval 967→1392 ms (425 ms) |
| 1440×900 #1 | 6× | 0 | **3** | 5323–6042 | 1533 | 5323 | 1533 | 7530 / 7530 | float interval 5323→7530 ms (2207 ms) |
| **FIX :5356 (`55eb968`)** | | | | | | | | | |
| 390×844 #1 | 4× | 0 | **0** | – | 438 | 3074 | 365 | 2750 / 2750 | layers drawn 324 ms after the first wall-painted frame; DOM: layer 73 ms after still `complete` |
| 390×844 #2 | 4× | 0 | **0** | – | 786 | 2069 | 486 | 1865 / 1865 | layers drawn 204 ms after the first wall-painted frame; DOM: layer 300 ms after still `complete` |
| 390×844 #3 | 6× | 0 | **0** | – | 753 | 1708 | 648 | 1564 / 1564 | layers drawn 144 ms after the first wall-painted frame; DOM: layer 105 ms after still `complete` |
| 390×844 #4 | 6× | 0 | **0** | – | 925 | 2026 | 609 | 1634 / 2026 | layers drawn 392 ms after the first wall-painted frame; DOM: layer 316 ms after still `complete` |
| 390×844 #5 | 6× | 0 | **0** | – | 928 | 1875 | 477 | 1259 / 1259 | layers drawn 616 ms after the first wall-painted frame; DOM: layer 451 ms after still `complete` |
| 390×844 (no throttle) #1 | 1× | 0 | **0** | – | 1312 | 3114 | 1312 | 3114 / 3114 | layers drawn 0 ms after the first wall-painted frame; DOM: layer 0 ms after still `complete` |
| 390×844 (no throttle) #2 | 1× | 0 | **0** | – | 433 | 1514 | 143 | 1310 / 1310 | layers drawn 204 ms after the first wall-painted frame; DOM: layer 290 ms after still `complete` |
| 390×844 (no throttle) #3 | 1× | 0 | **0** | – | 408 | 1320 | 408 | 1320 / 1320 | layers drawn 0 ms after the first wall-painted frame; DOM: layer 0 ms after still `complete` |
| 1440×900 #1 | 6× | 0 | **0** | – | 837 | 6633 | 539 | 5831 / 5831 | layers drawn 802 ms after the first wall-painted frame; DOM: layer 298 ms after still `complete` |

- **Control reproduced in 8/8 starts** (390×844 ×7 incl. 2 unthrottled, 1440×900 ×1): 2–10 float frames each, items on the bare sky for **425 ms to 2,207 ms** (390×844 under throttle 657–1,618 ms; unthrottled 425 and 665 ms; 1440×900 2,207 ms) before the wall is painted. The DOM-level test (`img.complete` false while layers exist) catches it in only 5/8 starts and only for 1–3 animation frames (≤ 43 ms): the still is `complete` early but is not painted until later, so the screencast is the measure that matches what is on screen.
- **Fix: 0 float frames in 9/9 starts** (5 throttled + 3 unthrottled at 390×844, 1 at 1440×900), by both measures (0 DOM float frames, 0 float screencast frames). Items appear **after** the wall is painted: in the frames, 0–802 ms after the first wall-painted frame (390×844 throttled 144–616 ms; 0, 204, 0 ms unthrottled; 1440×900 802 ms); in the DOM, 0–451 ms after the still is `complete` (the decode wait). The first-layer frame is never earlier than the first painted-wall frame.
- Early-frame sheets, one per start (bare sky → items on sky → painted still → items on painted still): `fix/sheets/ctrl-5350-*.jpg` (control; the shelf with jars, the hanging pothos, the fairy lights, books and record player stand on the plain sky) and `fix/sheets/fix-5356-*.jpg` (fix; bare sky, then the room, then the items). Raw per-start data: `fix/data/*.json` (`*.analysis.json`, `*.frameclass.json`; the raw screencast frames are not kept).
- **Not run:** a 3D-off cold start under the same throttle (the 3D-loading path above is the one that showed the float; the 3D-off backdrop is covered in §2); no network throttling; the lighting state is day-rain only.

## 2. Other N acceptance items, :5356 (fix) vs :5350 (control), 390×844 light 100 % and 375×667 dark 100 %

Probes: `backdrop.mjs` (groups `off`,`loading`; sha256 `1c847cb4…`) and `room2.mjs` (groups `static`,`nowebgl`,`unlock`; sha256 `b0531d43…`), from `runs/probes-mine/`; compare script `fix/probes/acc_cmp.py`; full output `fix/acceptance-compare.txt`; images in `fix/acceptance-backdrop/` and `fix/acceptance-nook/`. Real tap on brew / on the Nook tab; fresh context per group; frozen clock + `animations:'disabled'` for the screenshots.

| Item | 390×844 light | 375×667 dark |
|---|---|---|
| 3D-off Focus backdrop shows the earned items over the room (4 s after a real brew tap) | control 5 layers (pothos, books, fairyLights, shelf, recordPlayer), fix 5 layers, same still `window-day-rain`; full-page, backdrop-only and raw frames **pixel-identical** (mean abs 0.0, 0 px > 8/255) | same 5 layers, still `window-night-rain`; **pixel-identical** (0.0, 0 px) |
| 3D-loading backdrop (brew tap right after a cold load, no throttle) | control: 5 layers at the first poll (377 ms), fix: 0 layers at 329 ms, **5 at 393 ms** (+64 ms). Loading sample at ≈0.45 s: control 5 layers, fix 5 layers. Host then becomes ready and the still unmounts in both (times differ with load); CLS 0 / 0 | control: 5 layers at the first poll (361 ms) **with the still not yet `complete`** (the float, DOM level), fix: 0 layers at 351 ms, 5 at 415 ms. Loading sample at ≈0.45 s: control 5 layers, **fix 0 layers**. CLS tap→end 0 (control) / 0.00012 (fix) |
| Static Nook hint | "A drawing of your room", 1 line, inside the stage, nook icon; no-WebGL the same; flag after tap `kettle:nook-static-hint-seen=1` (3D flag null) | same text, 1 line, inside the stage; same flags |
| Static fallback unchanged (3D off and no WebGL Nook screenshots, control vs fix) | **pixel-identical** (mean abs 0.0, 0 px > 8) for both | **pixel-identical** (0.0, 0 px) for both |
| Reserved media space | backdrop host rect `[−2,−2,390,328]` in both, off and loading | `[−2,−2,375,223]` in both |
| Record-player unlock (`celebrate` seed, tap brew, `finish()`, summary) | both reach `#/done` with the live engine (`ready=true`, no still); **settled summary frame fix vs control: mean abs 0.0 (4 px > 8/255)** | both `#/done`, live engine; settled frame **0.0 (0 px)** |
| Page errors | 0 / 0 | 0 / 0 |

**Differences from the control beyond the items' later appearance, as observed:**
- 375×667 dark loading run, fix only: the layer count went **5 → 0 → 5** (at 415, 489, 562 ms after the tap, read by the 60 ms DOM poll) at the moment the host changed from the static one to the loading live host (`data-scene-ready=false`, i.e. a second `WindowStill` instance mounts and waits for its own `decode()`); the control stayed at 5 throughout. The same event was **not** seen in the 390×844 light loading run (0 → 5, no drop), nor by the per-frame sampler in the 9 float starts (it records every change of layer count: none dropped from 5). Whether the 74 ms gap is visible on screen I did not resolve at frame level (the screencast frames in that window are the route transition).
- That same fix run had a CLS of 0.00012 against 0 on the control (one run each; no layout-shift source analysis).
- Nothing else differed: the settled backdrop, the static Nook (both modes), the hint, the unlock summary and the reserved space are identical at both configurations.
- Not covered: the unlock's frame-by-frame *drawing-then-close-up* sequence (only the settled summary frame and the stage order were compared); other configurations; the 3D-on Nook.

## 3. Spec

`cd /home/user/wt/w2t-n2/kettle && KETTLE_PORT=5346 slots.py run --lane LN --n 1 -- npx playwright test tests/w2-room.spec.ts --project=chromium --workers=1` (01:25:12 → 01:27:10): **7 passed** (1.9 min), 0 failed. The seven: 3D off shows every earned window-visible item; 3D loading carries the same items; **"items never stand on the bare sky …" (the new test)**; 3D failure (context lost) carries the items; Nook hint 3D off; no WebGL; 3D on unchanged. Log: `fix/logs/spec.log`.

## Commands and times (UTC, 2026-10-12)
| What | Server | Gate time |
|---|---|---|
| `float.mjs --label ctrl5350 --cfg 390x844@3 --starts 5 --cpus 4,4,6,6,6 --mode auto` | :5350 | 01:20:39–01:22:09 |
| `float.mjs --label ctrl5350 --cfg 1440x900@2 --starts 1 --cpus 6` | :5350 | 01:22:21–01:23:17 |
| `float.mjs --label fix5356 --cfg 390x844@3 --starts 5 --cpus 4,4,6,6,6` | :5356 | 01:23:53–01:25:11 |
| `playwright test tests/w2-room.spec.ts` (KETTLE_PORT=5346) | :5346 | 01:25:12–01:27:10 |
| `float.mjs --label fix5356 --cfg 1440x900@2 --starts 1 --cpus 6` | :5356 | 01:27:45– |
| `float.mjs --label fix5356cpu1 / ctrl5350cpu1 --cfg 390x844@3 --starts 3 / 2 --cpus 1 --hold 6000` | :5356 / :5350 | ≈01:30–01:34 |
| `backdrop.mjs --groups off,loading` ×4, `room2.mjs --groups static,nowebgl,unlock` ×4 (two configs × two servers) | :5350, :5356 | 01:27–01:34 |
Gate logs in `fix/logs/`. Probe shas: `fix/probes.sha256`. The reproduction table as its own file: `fix/repro-table.md`.

`fix/receipt-sections-3-6-draft.md` is the unassembled draft text for sections 3–6 and the run log of `../RECEIPT.md` (kept as written when the earlier session stopped; not edited into the receipt).
