# I14 — Performance baseline + measured change (M2 scope) · CHECKER r1

**Verdict: APPROVE**

- **Reviewed commit:** `2becb78` (branch `pe/m2`); BEFORE = `6ddcdaa` (app code = `8f1044a`).
- **Scope graded:** the M2 Step 0 deliverable (reusable `tools/perf.mjs`, `perf/BASELINE.md` + JSON on unmodified code,
  BLOCKED list) and the one measured change M2 made (phone whistle → summary layout shift, fixed as I04 F1), plus "no new
  CLS on Today" and "controls usable while media loads". Real-device performance, GPU frame pacing and energy stay
  **BLOCKED**, as the packet says.
- **Conditions:** 4 vCPU Xeon @ 2.10 GHz, Chromium 141 headless (Playwright 1.56), SwiftShader CPU rendering, localhost,
  service workers blocked; production builds of both revisions (`vite build`) served side by side by `vite preview` on
  5274 (base) and 5273 (fix); every journey in a fresh browser context, A/B order alternating per run.

## What I ran (results)

**1. Independent layout-shift probe** (my own script, not `perf.mjs`: `PerformanceObserver('layout-shift')` from an
init script; Today settles 6 s → tap/click "Put the kettle on" → 4 s → `__kettle.finish()` → Tea time visible + 4 s;
sum of shifts without recent input). 3 runs × {390×844 @2 mobile, 375×667 @2 mobile, 1440×900 @1} × {light, dark} ×
{base, fix} = 36 journeys:

| Viewport | Theme | Whistle → summary, base `6ddcdaa` (3 runs) | Whistle → summary, fix `2becb78` (3 runs) | Today load, both |
|---|---|---|---|---|
| 390×844 | light | 0.5032 · 0.5034 · 0.5034 | **0.0034 · 0.0034 · 0.0034** | 0 in every run |
| 390×844 | dark | 0.5034 · 0.5034 · 0.5034 | **0.0034 · 0.0034 · 0.0034** | 0 |
| 375×667 | light | 0.4736 · 0.49 · 0.49 | **0.0201 · 0.0201 · 0.0201** | 0 |
| 375×667 | dark | 0.4736 · 0.4736 · 0.49 | **0.0036 · 0.0036 · 0.0036** | 0 |
| 1440×900 | light | 0.016 · 0.016 · 0.016 | 0.016 · 0.016 · 0.016 | 0 |
| 1440×900 | dark | 0.016 · 0.016 · 0.016 | 0.016 · 0.016 · 0.016 | 0 |

Shift sources: base = `MAIN._panel` + `DIV._readout` (the whole session panel moves); fix = `DIV._readout` only (the
exiting countdown), desktop unchanged in both. **The claim holds:** the phone whistle → summary shift (≈0.5, every run)
is gone; what remains (0.003–0.02) is the countdown readout's own exit, far under the 0.1 "good" bound, and rounds to the
packet's "0". No new CLS on Today load at any size or theme (the StatusBar 200 %-text wrap does not shift Today).

**2. Input A/B on a quiet machine** (load ≈ 0.8; click → next paint via rAF + MessageChannel, phone 390×844, taps,
6 alternating runs): Pause base 118 ms [76–251] → fix 122 ms [92–259]; Resume 109 → 102 ms; +5 122 → 115 ms (medians).
The maker's A/B flagged phone Pause 126 → 279 ms and called it noise; on an idle host there is no difference.

**3. Media loading doesn't block controls:** with the three.js chunk held back by route interception, the summary shows
the record-player drawing and **Tea time is enabled**; the 3D close-up replaces the drawing in the same box once released
(390×844 and 1440×900, both themes; screenshots read).

**4. Bytes:** gzip of all built JS/CSS chunks: base 462 441 / 40 433 B → fix 463 219 / 40 714 B (+0.78 KB JS,
+0.28 KB CSS), consistent with the packet's +1.1 KB on Today.

**5. Deliverable review:** `tools/perf.mjs` (585 lines; alternating multi-base A/B, fresh contexts, `--from` re-summary,
SW blocked by default with the reason) and `perf/BASELINE.md` + `baseline/perf.json` / `summary.md` / `console.txt`
cover every item in the M2 brief: device/browser/renderer and load averages; TTFB, FCP, LCP, DCL, load, Start-enabled and
first-tap-handled; Event Timing (threshold 16) and click → next paint for Start, Pause, Resume, +5, Tea time; CLS for
Today/focus/whistle→summary/break/Nook; JS heap on Today/Focus/Summary/Nook 3D; bytes by type including the 3D chunk;
3D first-render times; Chai intrinsic vs rendered size at phone and desktop (reported for I06, nothing changed). The
baseline JSON is timestamped 2026-10-07 00:41–00:48 UTC, before the maker's first WIP commit (09:15), and my own base
measurement on `6ddcdaa` reproduces its defining number (phone whistle → summary ≈ 0.50 every run). BLOCKED/UNKNOWN items
are honest: no FPS claim, no phone claim, GPU memory UNKNOWN, timings flagged as noisy on a shared host.

`npx tsc --noEmit` clean and `npx vitest run` 256/256 on 2becb78 (see I04 verdict for the Playwright suites).

## What I opened (Read tool)

K03 `…/assets/current/11b-summary-unlock-settled.png`; BEFORE `baseline/*/07-summary.png`, `08-summary-end.png`,
`11-summary-unlock.png`; AFTER `contracts/I04/after/*/07`, `08`, `11`, `11b` (390×844 and 1440×900); my 2becb78
captures of the unlock drawing/close-up (390×844 dark, 1440×900 light) and recaptured 07/08/11/11b — the summary is
pixel-identical to BEFORE (≤ 0.12 %), so the CLS fix costs no visual change.

## Per-criterion findings

| Criterion | Finding |
|---|---|
| Baseline recorded on unmodified code before changes, with device/conditions | PASS |
| Reusable tool for the identical measurement later | PASS (`tools/perf.mjs`, documented usage, A/B mode) |
| Measured change compared before/after under the same conditions | PASS — re-measured independently: phone CLS 0.50 → 0.003 (390) / 0.004–0.02 (375); desktop and Today unchanged at their baseline values; no input or byte regression |
| Controls usable while media loads | PASS (Tea time enabled while 3D is held; drawing → close-up preserved) |
| Approved detail preserved as progressive enhancement | PASS (no art, 3D or motion change) |
| BLOCKED/UNKNOWN honesty | PASS |

## Notes (not defects)

- The committed A/B (`perf/ab-m2/`, 17:21–17:30 UTC) does not record which source revision "after-m2" was built from,
  and `StatusBar.tsx`/`Home.module.css` were committed four hours later (`16bde5a`). It is therefore not bound to
  `2becb78` by itself; my re-measurement above is what binds this verdict. Future A/B runs should print the build's
  revision (e.g. `git rev-parse` + `git status --porcelain -- src`) into `perf.json`.
- "0.50 → 0" is a rounded statement; the precise residual is 0.003–0.02 from the countdown's exit.
