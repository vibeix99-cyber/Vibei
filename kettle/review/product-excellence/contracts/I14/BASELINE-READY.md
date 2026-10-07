# I14 — performance baseline (Step 0) · READY FOR REVIEW

- **Maker:** M2 · branch `pe/m2` · worktree `/home/user/wt/m2/kettle`
- **Revision:** the commit that adds this file (`I04 I05 I14 READY FOR REVIEW: …`, `git log -1 pe/m2`).
  **Baseline measured on:** `6ddcdaa` (app code identical to `8f1044a`:
  `git diff 8f1044a 6ddcdaa -- src public index.html vite.config.ts package.json` is empty), before any M2 change.
- **Scope:** I14 is a *baseline* deliverable for this maker (measure, do not optimise). I06 (art) and later contracts
  re-run the same tool on their AFTER revision.
- **Proposed state:** baseline **DELIVERED**; real-device performance **BLOCKED** (below).

## Deliverables

| File | What |
|---|---|
| `review/product-excellence/tools/perf.mjs` | Reusable probe: production build via `vite preview`, phone (390×844 DPR 2, mobile emulation, taps) and desktop (1440×900), N runs with fresh contexts, alternating A/B order when given two `--base` values, B − A column |
| `review/product-excellence/perf/BASELINE.md` | The baseline: device/renderer/conditions, startup, input, CLS, memory, bytes, 3D, Chai intrinsic-vs-rendered size, observations, BLOCKED list, how to repeat |
| `review/product-excellence/perf/baseline/perf.json` · `summary.md` · `console.txt` | Every sample, medians with every run, console |
| `review/product-excellence/perf/ab-m2/` | Paired A/B of this branch's AFTER build vs the baseline build (same tool), see below |

Commands (baseline, from `kettle/`):

```
npx vite build --outDir <scratch>/perf-before
npx vite preview --outDir <scratch>/perf-before --port 5242 --strictPort
node review/product-excellence/tools/perf.mjs --base http://127.0.0.1:5242 --name 8f1044a --runs 5 \
     --profiles phone,desktop --out review/product-excellence/perf/baseline
```

## Key baseline measurements (median of 5; Chromium 141 headless, SwiftShader CPU rendering, shared 4 vCPU)

| Metric | Phone | Desktop |
|---|---:|---:|
| FCP / LCP | 176 / 520 ms | 176 / 532 ms |
| Start present+enabled / first tap handled | 491 / 1126 ms | 487 / 1119 ms |
| Click → next paint: Start (settled) · Pause · Resume · +5 · Tea time | 264 · 188 · 37 · 86 · 50 ms | 231 · 43 · 22 · 177 · 113 ms |
| CLS whistle → summary | **0.50 (every run)** | 0.013 (run 1 only) |
| CLS Today load · focus · break · Nook load | 0 · 0 · 0 · 0 | 0 · 0 · 0 · 0 |
| JS heap Today · Focus · Summary · Nook 3D | 8.9 · 10.2 · 10.9 · 9.8 MB | 8.9 · 10.1 · 10.9 · 9.6 MB |
| Bytes (gzip) Today settled: JS · CSS · fonts · images · 3D | 280 · 41 · 68 · 20 · 172 KB | same |
| 3D: Start → focus window ready · cold Nook → 3D ready | 1122 · 2200 ms | 1131 · 4421 ms |
| Chai source px per device px (focus/summary/break) | ×1.38 | ×1.68 (DPR 1); **×0.84 at DPR 2** (computed) |

The only measured defect in the baseline was the **phone whistle → summary layout shift (CLS 0.50)**. It belongs to
the critical journey's screen stability, so I fixed it under I04 (see `contracts/I04/READY-FOR-REVIEW.md`, fix F1)
and re-measured it with this tool below. Chai's DPR-2 desktop softness is reported for I06 and not changed.

## Re-measurement on this branch (paired A/B, same tool)

AB_PLACEHOLDER

## BLOCKED / UNKNOWN (never PASS)

- **BLOCKED:** real-phone performance (startup, input latency, 3D load on a phone CPU/GPU); GPU frame pacing / FPS
  (no GPU here: no frame-rate claim is made); energy, battery, thermals over a 25-min brew
  (`docs/REAL_DEVICE_CHECKLIST.md` 5.3).
- **UNKNOWN:** WebGL/GPU texture memory (only JS heap is visible via CDP); network cost on a real connection
  (localhost; bytes are reported for modelling).
- Timing numbers are from a shared, loaded machine (load average recorded per sample); compare only paired A/B runs.
