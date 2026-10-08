# I14 — performance baseline (provisional, Step 0)

Measured **before any M2 change**, on a production build of the unmodified app.

| | |
|---|---|
| App code | identical to `8f1044a` (worktree `pe/m2` at `6ddcdaa`; `git diff 8f1044a 6ddcdaa -- src public index.html vite.config.ts package.json` is empty) |
| Build | `npx vite build --outDir <scratch>/perf-before` → served by `npx vite preview --outDir <scratch>/perf-before --port 5242 --strictPort` (gzip on the wire) |
| Tool | `node review/product-excellence/tools/perf.mjs --base http://127.0.0.1:5242 --name 8f1044a --runs 5 --profiles phone,desktop --out review/product-excellence/perf/baseline` |
| Raw data | [`baseline/perf.json`](baseline/perf.json) (every sample), [`baseline/summary.md`](baseline/summary.md) (all medians with every run), [`baseline/console.txt`](baseline/console.txt) |
| When | 2026-10-07 00:41:06 → 00:48:16 UTC, 5 runs × 2 profiles × 3 journeys, fresh browser context per journey |
| Host | 4 vCPU Intel Xeon @ 2.10 GHz (`nproc` = 4), 15.7 GB RAM, Linux 6.18; **shared with other agents** |
| Load average | 1.69 at start → 8.09 at end (per-sample load in `perf.json`; runs 3–5 ran at 5.7–8). Timing numbers are noisy. |
| Browser | Chromium 141.0.7390.37 headless (Playwright 1.56), no CPU or network throttling, localhost |
| Renderer | `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver)` — **CPU rendering, no GPU**. Kettle detects it (`softwareGL()`) and runs the 3D nook on its **low** tier. |
| Phone profile | 390×844 CSS px, DPR 2, `isMobile`, `hasTouch`, Pixel 7 UA, taps |
| Desktop profile | 1440×900, DPR 1, mouse clicks |
| Data | `?debug&seed=veteran&theme=light&nooktime=day`; service workers blocked (the PWA precache of 73 files / 2.43 MB is a background download and is not in these numbers) |

## Results (median of 5)

| Area | Metric | Phone | Desktop |
|---|---|---:|---:|
| Startup | TTFB | 3.4 ms | 2.9 ms |
| | FCP | 176 ms | 176 ms |
| | LCP (greeting / Chai's bubble) | 520 ms | 532 ms |
| | DOMContentLoaded / load | 127 / 127 ms | 130 / 130 ms |
| | "Put the kettle on" present and enabled | 491 ms | 487 ms |
| | First tap on it handled (→ `#/focus`), first-interactive proxy | 1126 ms | 1119 ms |
| | Total blocking time up to that tap | 67 ms | 97 ms |
| Input (click → next paint, main thread) | Start (cold, first tap) | 310 ms | 279 ms |
| | Start (Today settled 8 s) | 264 ms | 231 ms |
| | Pause | 188 ms | 43 ms |
| | Resume | 37 ms | 22 ms |
| | +5 | 86 ms | 177 ms |
| | Tea time | 50 ms | 113 ms |
| Input (Event Timing, max duration of the interaction, threshold 16 ms) | Start cold / settled | 400 / 144 ms | 912 / 264 ms |
| | Pause / Resume / +5 / Tea time | 384 / 48 / 272 / 120 ms | 312 / 384 / 768 / 528 ms |
| | Longest task during the journey / TBT | 67 / 26 ms | 84 / 34 ms |
| Layout shift (CLS session window) | Today load · focus · break · Nook load | 0 · 0 · 0 · 0 | 0 · 0 · 0 · 0 |
| | **Whistle → summary** | **0.50** (every run) | 0.013 (run 1; median rounds to 0) |
| Memory (JS heap used after GC) | Today · Focus · Summary · Nook (3D) | 8.9 · 10.2 · 10.9 · 9.8 MB | 8.9 · 10.1 · 10.9 · 9.6 MB |
| | DOM nodes on the summary | 548 | 548 |
| Main-thread busy time | Today → focus (3D window adopted) · focus controls · whistle → summary · break | 468 · 331 · 463 · 211 ms | 381 · 215 · 301 · 139 ms |
| 3D | Start → focus stage window ready (pre-warmed on Today) | 1122 ms | 1131 ms |
| | Cold load of `#/nook` → 3D ready | 2200 ms | 4421 ms |
| Bytes on the wire (gzip) | Today settled: JS · CSS · fonts · images | 280 · 41 · 68 · 20 KB | same |
| | Today settled: 3D (three.js 143 KB + NookScene 28 KB, pre-warmed while Today idles) | 172 KB | same |
| | Today settled total · through the summary · cold Nook | 582 · 660 · 562 KB | same |

### Chai: intrinsic vs rendered size (informs I06; nothing changed)

| Where | Asset (source px) | Phone 390×844 @2: CSS → device px (source per device px) | Desktop 1440×900 @1 | Desktop @2 (Retina), computed |
|---|---|---|---|---|
| Today (sipping) | 302×491 | 67.7×109.9 → 135×220 (×2.23) | 91.8×149.2 → 92×149 (×3.29) | 184×298 (×1.64) |
| Focus (reading) | 311×487 | 112.8×176.6 → 226×353 (×1.38) | 185.1×289.9 → 185×290 (×1.68) | 370×580 (**×0.84, upscaled**) |
| Summary (cheering) | 312×428 | 113.2×155.2 → 226×310 (×1.38) | 185.7×254.7 → 186×255 (×1.68) | 371×509 (**×0.84**) |
| Break (sipping) | 302×491 | 109.5×178.1 → 219×356 (×1.38) | 179.8×292.2 → 180×292 (×1.68) | 360×584 (**×0.84**) |

At every measured size the painted Chai has at least as many source pixels as device pixels; on a DPR-2 laptop at
1440×900 the stage Chai would be drawn at about 0.84 source px per device px (slightly soft). The DPR-2 desktop column
is computed from the measured CSS size (CSS layout does not depend on DPR); `perf.mjs --profiles desktop2x` measures it.

## What the baseline says (observations, no changes made)

1. **Whistle → summary shifts layout on phones (CLS 0.50 in every run).** The shift source is the session panel
   (`main._panel` in `FocusScreen`): in the stacked layout the summary panel takes over the whole screen and the sheet
   moves by layout, not by transform. It happens without input (the timer completing), so it counts. Desktop: 0.013.
   Today, focus, break and Nook load: 0.
2. **Start is the slowest control** (≈230–310 ms from tap to the next frame on both profiles): the route change to the
   session screen and adoption of the pre-warmed 3D window. Pause/Resume/+5/Tea time mostly paint within 40–190 ms.
3. **Event Timing durations are renderer-bound here.** They run to the frame's *presentation*, which under SwiftShader
   includes CPU rasterisation of the 3D canvas in the GPU process; on desktop (larger canvas) they scatter from
   <16 ms to 1.5 s for the same control. Use click → next paint (main thread) for comparisons on this machine, and
   Event Timing only in a paired A/B run.
4. **3D costs are paid early but off the critical path:** Today pre-warms three.js + the room (172 KB) after it
   settles, so the first brew's window is ready ≈1.1 s after Start; a cold Nook visit takes 2.2 s (phone) / 4.4 s
   (desktop) to its first 3D frame on CPU rendering. Memory stays small (≈9–11 MB JS heap).

## BLOCKED / UNKNOWN (cannot be measured in this container)

- **Real-phone performance** (startup, input latency, 3D load on an actual phone CPU/GPU): BLOCKED. These numbers come
  from a shared 4-vCPU server with software rendering and no network latency.
- **GPU frame pacing / FPS, jank under real compositing:** BLOCKED. No GPU; no frame-rate claim is made (never "60 FPS").
- **Energy, battery, thermals** during a 25-min brew: BLOCKED (see `docs/REAL_DEVICE_CHECKLIST.md` 5.3).
- **WebGL/GPU texture memory:** UNKNOWN (only the JS heap is visible through CDP).
- **Network cost on a real connection:** UNKNOWN (localhost; bytes are reported so they can be modelled).

## Repeating it (authoritative before/after)

The authoritative comparison is a paired A/B on an idle machine, both builds served side by side:

```sh
npx vite build --outDir /tmp/kettle-before   # at the BEFORE revision
npx vite build --outDir /tmp/kettle-after    # at the AFTER revision
npx vite preview --outDir /tmp/kettle-before --port 5242 --strictPort &
npx vite preview --outDir /tmp/kettle-after  --port 5243 --strictPort &
node review/product-excellence/tools/perf.mjs --base http://127.0.0.1:5242 --name before \
     --base http://127.0.0.1:5243 --name after --runs 5 --out review/product-excellence/perf/ab-<date>
```

Runs alternate the order (A B, B A, …), every journey gets a fresh browser context, and the summary adds an
`after − before` column. `--from <perf.json>` rebuilds a summary without measuring again. Record `uptime` with the run.
