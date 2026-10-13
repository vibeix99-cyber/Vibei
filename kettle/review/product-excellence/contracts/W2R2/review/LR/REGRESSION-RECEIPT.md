# Lane R regression receipt: Wave 2 round 2, combined trial 032d7a5 vs control b377c62

Raw facts only; no verdict and no classification of any visual difference. Times are UTC, 2026-10-13 (started 11:46, written about 13:1x).
Trial = `/home/user/wt/w3tr-pc/kettle` (HEAD 032d7a5, src c9876ef, dev :5445, preview :5455). Control = `/home/user/wt/w3-base/kettle` (HEAD b377c62, src e0aebbf, dev :5410).
No source edits, commits, pushes or merges. I started and stopped no server except one `vite preview` on :5497 that the pwa spec itself spawned (see section 4).
Machine load during the later phases (captures, rechecks) was heavy because of other lanes: load average 12 to 14.5 on 4 CPUs (`uptime` at 13:03).

## 1. Server verification (run 11:46)

```
$ bash /tmp/rv7-servers/verify.sh /home/user/wt/w3tr-pc 5445
  src/ui/Toast.module.css OK (eda3afc2bcf6b1a0)
  src/ui/Toast.tsx OK (f3ee659bd58c7aaa)
  src/screens/home/StatusBar.tsx OK (b47742ab759a5785)
  src/app/flow.ts OK (0bd8dd9623b52bae)
  src/screens/focus/FocusScreen.tsx OK (0704d7b045dbd58b)
PORT 5445 serves 032d7a5 (src c9876ef): VERIFIED          (exit 0)
$ bash /tmp/rv7-servers/verify.sh /home/user/wt/w3-base 5410
  (same five files, all OK)
PORT 5410 serves b377c62 (src e0aebbf): VERIFIED          (exit 0)
```
- Preview :5455: process 19720 is `vite preview ... --outDir /tmp/rv7-servers/dist-w3tr-pc --port 5455`, cwd `/home/user/wt/w3tr-pc/kettle`. verify.sh does not cover a built bundle, so the commit of that bundle is not independently checked by me beyond that process line.
- Both capture sides recorded `meta.revision` 032d7a5 (trial) and b377c62 (control), no `+dirty` suffix, in every `capture-meta.json`.

## 2. tsc and vitest (no browser), trial worktree

| check | result | log |
|---|---|---|
| `npx tsc --noEmit` | exit 0 (tsconfig `include: ["src"]`) | `logs/tsc.log` |
| `npx vitest run` | 288 passed / 288 total; 29 test files passed / 29; exit 0 | `logs/vitest.log` |

## 3. Full chromium run (trial, :5445)

Command: `KETTLE_PORT=5445 npx playwright test --project=chromium --workers=2 --reporter=list --output=/tmp/claude-0/lr2-out`, via the gate with `--n 2`, 11:47:06 to 12:07:03.

- **113 passed / 113 total. 0 failed, 0 skipped, 0 flaky, 0 not run.** Playwright exit 0, "113 passed (19.9m)". Log: `logs/chromium-full.log`.
- Per spec file (passed): a11y 11, break-reach 7, chai3d 8, integrity 25, statusbar 9, toast-room 14, w2-firstvisit 6, w2-room 7, w2-summary 18, whistle 8.
- The two known base failures did not occur on the trial:
  - `break-reach.spec.ts:179` (200 % text, 375×667 light, "Break's over with a carried task") passed (17.7 s). Its other two variants (390×844 dark, 844×390 light) also passed.
  - `w2-room.spec.ts:144` (WebGL context lost, the still carries the same items) passed (45.7 s). `chai3d.spec.ts:157` (context lost and restored) passed (44.9 s).
- Because nothing failed there was nothing to rerun alone on the trial or the control, and no failure to compare. I did not run the full suite on the control.

## 4. timer-harness, timer-app, pwa (trial)

Command: `KETTLE_PORT=5445 KETTLE_PWA_PORT=5497 npx playwright test --project=timer-harness --project=timer-app --project=pwa --workers=1 --reporter=list --output=/tmp/claude-0/lr2-out-timer`, gate `--n 1`, 12:09:32 to 12:12:39.

- **29 passed, 2 skipped, 0 failed**, exit 0 ("29 passed (3.1m)"). The 2 skips are both by design in `[timer-app]`: `timer.spec.ts:294` (keyboard shortcuts infra: Space toggles ...) and `timer.spec.ts:438` (rendering budget: useRemaining re-renders about once per displayed second). Log: `logs/timer-app-pwa.log`.
- Stray process: the pwa spec left `node .../w3tr-pc/kettle/node_modules/.bin/vite preview --outDir .../test-results/pwa-dist --port 5497 --strictPort` running as PID 7491 (parent 1). I killed it by that explicit PID at 12:12 and confirmed nothing listens on :5497. The build output `kettle/test-results/pwa-dist` in the trial worktree is git-ignored.

## 5. Standard capture set: trial vs control

- Tool: `/home/user/Vibei/kettle/review/product-excellence/tools/capture.mjs`, unchanged, run from each worktree's `kettle/` with the frozen-clock preload (`./.tmp/LR/std-freeze.mjs`: fixed start instant 2026-10-10T16:40:00.000Z, screenshots `animations:'disabled'`). Trial base http://127.0.0.1:5445, control base http://127.0.0.1:5410. Deviations from the brief are in section 7.
- Configurations captured (all with exit 0, `errors: []`, 21 images per side): 390×844@2 light, 375×667@2 light, 1440×900@1 light, 390×844@2 dark, 375×667@2 dark, 1440×900@1 dark. Wall time per configuration 254 to 631 s (the 1440 ones are the slowest).
- Diff: `contracts/W2/review/LR/logs/pdiff.py` (numpy/PIL from `/tmp/claude-0/lr-pylib`), tolerance 16 (a pixel counts when its largest per-channel difference is over 16). "strict" counts any difference above 0. Raw numbers: `logs/pdiff-<config>.json`.
- Image sizes differ (a size difference counts the non-overlapping area as differing) in 2 of 126 pairs: 375×667 light 17-nook-early (trial 750×2844, control 750×3272) and 1440×900 dark 18-nook-earned (trial 1440×3125, control 1440×2888). All other pairs are the same size.
- Pairs at exactly 0 / 0 (identical): 44 of 126. Pairs over 0.5 % at tolerance 16 (or differing size): 39. Pairs over 0.5 % only when strict (under 0.5 % at tolerance 16): 21. (Counted from `matrix/over-0.5pct.md` and `matrix/compact-matrix.md`.)

### 5.1 Matrix (21 states × 6 configurations)

Cell = % of pixels over tolerance 16 / % of pixels differing at all (strict). `S` = image sizes differ (non-overlap counted as differing). Bold = over 0.5 % at tolerance 16.

| state | 390x844@2-light | 375x667@2-light | 1440x900@1-light | 390x844@2-dark | 375x667@2-dark | 1440x900@1-dark |
|---|---|---|---|---|---|---|
| 01-home | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0.592 | 0 / 0 | 0 / 0 |
| 01b-home-scrolled | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0.288 | 0 / 0 |
| 02-focus-start | 0 / 0 | 0 / 0 | 0.249 / 0.929 | 0 / 0 | 0.337 / 0.354 | **0.532 / 4.112** |
| 03-focus-mid | 0 / 0 | 0.316 / 0.323 | 0.486 / 3.905 | 0.24 / 0.264 | **6.154 / 12.637** | 0.471 / 3.081 |
| 04-focus-paused | 0 / 0 | 0.323 / 0.332 | 0 / 0 | 0.244 / 0.257 | **0.686 / 0.703** | 0 / 0 |
| 05-focus-added | **0.602 / 0.619** | 0.35 / 0.419 | **0.521 / 3.851** | **0.604 / 0.621** | **0.59 / 5.297** | 0.099 / 3.33 |
| 06-whistle | 0 / 0 | 0.018 / 1.448 | 0 / 0.048 | 0.016 / 1.294 | 0.018 / 9.09 | 0 / 0.001 |
| 07-summary | **16.008 / 21.406** | **15.196 / 21.215** | 0 / 0 | **10.507 / 21.058** | **12.014 / 20.761** | 0 / 0 |
| 08-summary-end | **18.381 / 20.981** | **6.734 / 7.214** | 0.164 / 0.195 | **11.15 / 20.939** | **4.744 / 7.201** | 0.165 / 0.195 |
| 09-break | 0 / 0 | 0 / 0 | 0.248 / 0.254 | 0 / 0 | 0 / 7.578 | **1.557 / 1.836** |
| 10-break-over | 0 / 0 | 0 / 0 | 0 / 0.001 | 0 / 0 | 0 / 0 | **1.878 / 3.881** |
| 11-summary-unlock | **18.009 / 24.757** | **34.467 / 41.313** | 0.458 / 6.122 | **16.189 / 22.523** | **36.895 / 46.916** | **1.415 / 1.728** |
| 11b-summary-unlock-settled | **15.883 / 22.614** | **34.368 / 41.329** | **0.527 / 7.043** | **16.215 / 22.353** | **33.671 / 40.421** | **5.177 / 7.851** |
| 12-welcome | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| 13-first-brew | 0.35 / 0.408 | **0.656 / 22.493** | 0.245 / 0.284 | 0.353 / 4.585 | 0.023 / 0.495 | 0.479 / 6.947 |
| 14-summary-first | **30.814 / 36.895** | **11.261 / 22.463** | 0 / 0.001 | **25.073 / 36.874** | **11.09 / 22.334** | 0 / 0 |
| 15-stats-empty | 0 / 0 | 0 / 0 | 0 / 0.018 | 0 / 0 | 0 / 0 | 0 / 0 |
| 16-stats-populated | 0 / 0 | 0 / 0.189 | **11.638 / 13.923** | 0 / 0 | 0 / 0 | 0.166 / 0.208 |
| 17-nook-early | 0.169 / 2.164 | **13.301 / 15.221 S** | 0.297 / 2.143 | 0.103 / 1.759 | 0.301 / 1.964 | **11.168 / 12.806** |
| 18-nook-earned | 0.134 / 1.28 | 0.112 / 1.023 | 0.418 / 2.399 | 0.207 / 1.246 | 0.183 / 1.491 | **18.864 / 19.626 S** |
| 19-settings | 0 / 0 | **31.437 / 73.701** | 0.002 / 0.01 | **30.224 / 72.864** | 0 / 0 | 0.007 / 0.038 |

### 5.2 Pairs over 0.5 % (listed, not classified)

"bbox" is the bounding box of the pixels over tolerance 16, in CSS px (x0,y0-x1,y1). Image pairs and diff images for every row of both tables are in `pairs/<config>/`.

#### Over 0.5 % at tolerance 16 (or sizes differ)

| config | state | image size (px) | % over tol 16 | % strict | differing-pixel bbox (CSS px) |
|---|---|---|---|---|---|
| 390x844@2-light | 05-focus-added | 780x1688 | 0.602 | 0.619 | 148,286-298,567 |
| 390x844@2-light | 07-summary | 780x1688 | 16.008 | 21.406 | 0,368-390,700 |
| 390x844@2-light | 08-summary-end | 780x1688 | 18.381 | 20.981 | 0,13-390,654 |
| 390x844@2-light | 11-summary-unlock | 780x1688 | 18.009 | 24.757 | 0,142-390,700 |
| 390x844@2-light | 11b-summary-unlock-settled | 780x1688 | 15.883 | 22.614 | 0,366-390,700 |
| 390x844@2-light | 14-summary-first | 780x1688 | 30.814 | 36.895 | 0,335-390,692 |
| 375x667@2-light | 07-summary | 750x1334 | 15.196 | 21.215 | 0,237-374,524 |
| 375x667@2-light | 08-summary-end | 750x1334 | 6.734 | 7.214 | 20,0-318,478 |
| 375x667@2-light | 11-summary-unlock | 750x1334 | 34.467 | 41.313 | 0,189-374,527 |
| 375x667@2-light | 11b-summary-unlock-settled | 750x1334 | 34.368 | 41.329 | 0,189-374,527 |
| 375x667@2-light | 13-first-brew | 750x1334 | 0.656 | 22.493 | 0,0-310,212 |
| 375x667@2-light | 14-summary-first | 750x1334 | 11.261 | 22.463 | 0,276-374,524 |
| 375x667@2-light | 17-nook-early | 750x2844 vs 750x3272 | 13.301 | 15.221 | 120,159-278,302 |
| 375x667@2-light | 19-settings | 750x8434 | 31.437 | 73.701 | 16,22-358,4216 |
| 1440x900@1-light | 05-focus-added | 1440x900 | 0.521 | 3.851 | 201,335-1325,783 |
| 1440x900@1-light | 11b-summary-unlock-settled | 1440x900 | 0.527 | 7.043 | 955,250-1354,489 |
| 1440x900@1-light | 16-stats-populated | 1440x2913 | 11.638 | 13.923 | 288,51-1392,2810 |
| 390x844@2-dark | 05-focus-added | 780x1688 | 0.604 | 0.621 | 148,286-298,567 |
| 390x844@2-dark | 07-summary | 780x1688 | 10.507 | 21.058 | 0,370-390,692 |
| 390x844@2-dark | 08-summary-end | 780x1688 | 11.15 | 20.939 | 0,21-390,654 |
| 390x844@2-dark | 11-summary-unlock | 780x1688 | 16.189 | 22.523 | 0,366-390,700 |
| 390x844@2-dark | 11b-summary-unlock-settled | 780x1688 | 16.215 | 22.353 | 0,366-390,700 |
| 390x844@2-dark | 14-summary-first | 780x1688 | 25.073 | 36.874 | 0,337-390,692 |
| 390x844@2-dark | 19-settings | 780x8256 | 30.224 | 72.864 | 16,22-374,4128 |
| 375x667@2-dark | 03-focus-mid | 750x1334 | 6.154 | 12.637 | 12,10-362,626 |
| 375x667@2-dark | 04-focus-paused | 750x1334 | 0.686 | 0.703 | 158,182-274,432 |
| 375x667@2-dark | 05-focus-added | 750x1334 | 0.59 | 5.297 | 115,184-276,432 |
| 375x667@2-dark | 07-summary | 750x1334 | 12.014 | 20.761 | 0,242-374,514 |
| 375x667@2-dark | 08-summary-end | 750x1334 | 4.744 | 7.201 | 20,0-318,478 |
| 375x667@2-dark | 11-summary-unlock | 750x1334 | 36.895 | 46.916 | 0,44-374,528 |
| 375x667@2-dark | 11b-summary-unlock-settled | 750x1334 | 33.671 | 40.421 | 0,189-374,528 |
| 375x667@2-dark | 14-summary-first | 750x1334 | 11.09 | 22.334 | 0,276-374,518 |
| 1440x900@1-dark | 02-focus-start | 1440x900 | 0.532 | 4.112 | 201,100-607,783 |
| 1440x900@1-dark | 09-break | 1440x900 | 1.557 | 1.836 | 911,248-1398,732 |
| 1440x900@1-dark | 10-break-over | 1440x900 | 1.878 | 3.881 | 515,380-919,456 |
| 1440x900@1-dark | 11-summary-unlock | 1440x900 | 1.415 | 1.728 | 912,24-1398,505 |
| 1440x900@1-dark | 11b-summary-unlock-settled | 1440x900 | 5.177 | 7.851 | 942,250-1367,489 |
| 1440x900@1-dark | 17-nook-early | 1440x2888 | 11.168 | 12.806 | 378,207-1307,960 |
| 1440x900@1-dark | 18-nook-earned | 1440x3125 vs 1440x2888 | 18.864 | 19.626 | 378,207-1307,960 |

#### Over 0.5 % only when strict (any channel change > 0), under 0.5 % at tolerance 16

| config | state | image size (px) | % over tol 16 | % strict | differing-pixel bbox at tol 16 (CSS px) |
|---|---|---|---|---|---|
| 390x844@2-light | 17-nook-early | 780x3238 | 0.169 | 2.164 | 129,166-290,309 |
| 390x844@2-light | 18-nook-earned | 780x8156 | 0.134 | 1.28 | 48,142-342,304 |
| 375x667@2-light | 06-whistle | 750x1334 | 0.018 | 1.448 | 166,90-300,182 |
| 375x667@2-light | 18-nook-earned | 750x8156 | 0.112 | 1.023 | 47,141-328,298 |
| 1440x900@1-light | 02-focus-start | 1440x900 | 0.249 | 0.929 | 373,334-1323,698 |
| 1440x900@1-light | 03-focus-mid | 1440x900 | 0.486 | 3.905 | 201,38-1332,783 |
| 1440x900@1-light | 11-summary-unlock | 1440x900 | 0.458 | 6.122 | 959,250-1367,489 |
| 1440x900@1-light | 17-nook-early | 1440x2888 | 0.297 | 2.143 | 634,303-1107,730 |
| 1440x900@1-light | 18-nook-earned | 1440x2888 | 0.418 | 2.399 | 446,238-1224,710 |
| 390x844@2-dark | 01-home | 780x1688 | 0.0 | 0.592 | - |
| 390x844@2-dark | 06-whistle | 780x1688 | 0.016 | 1.294 | 174,190-338,290 |
| 390x844@2-dark | 13-first-brew | 780x1688 | 0.353 | 4.585 | 117,304-296,567 |
| 390x844@2-dark | 17-nook-early | 780x3238 | 0.103 | 1.759 | 132,168-290,304 |
| 390x844@2-dark | 18-nook-earned | 780x8156 | 0.207 | 1.246 | 47,142-348,304 |
| 375x667@2-dark | 06-whistle | 750x1334 | 0.018 | 9.09 | 166,90-320,182 |
| 375x667@2-dark | 09-break | 750x1334 | 0.0 | 7.578 | 190,230-190,230 |
| 375x667@2-dark | 17-nook-early | 750x3272 | 0.301 | 1.964 | 118,163-279,305 |
| 375x667@2-dark | 18-nook-earned | 750x8156 | 0.183 | 1.491 | 48,138-326,298 |
| 1440x900@1-dark | 03-focus-mid | 1440x900 | 0.471 | 3.081 | 397,335-1322,676 |
| 1440x900@1-dark | 05-focus-added | 1440x900 | 0.099 | 3.33 | 201,463-607,783 |
| 1440x900@1-dark | 13-first-brew | 1440x900 | 0.479 | 6.947 | 201,335-1325,783 |

### 5.3 Repeat-take check (same tool, same preload, second take of selected states)

Added so the lead can see how much a state moves between two takes of the same side. The second takes ran as `--only <ids>` (standalone state groups, not the full 21-state flow, so the page history before each state differs from take 1), sequentially, ctrl then trial, 12:52 to 13:12, under the same heavy machine load. Cell = % over tol 16 / % strict. "trial1/ctrl1" are the takes in section 5.1; "trial2/ctrl2" are the second takes. Images are in `recheck-takes/`; script `tools/rediff.py`; raw numbers `logs/rediff.json`.

| config | state | trial1 vs ctrl1 (% over tol 16 / % strict) | trial1 vs trial2 | ctrl1 vs ctrl2 | trial2 vs ctrl2 |
|---|---|---|---|---|---|
| 1440x900@1-dark | 09-break | 1.557 / 1.836 | 1.364 / 1.644 | 2.453 / 8.856 | 2.564 / 8.968 |
| 1440x900@1-dark | 10-break-over | 1.878 / 3.881 | 0.0 / 0.0 | 1.878 / 3.881 | 0.0 / 0.001 |
| 1440x900@1-dark | 11b-summary-unlock-settled | 5.177 / 7.851 | 0.262 / 7.85 | 0.324 / 7.681 | 0.75 / 7.807 |
| 1440x900@1-dark | 17-nook-early | 11.168 / 12.806 | 0.405 / 2.844 | 11.173 / 12.806 | 0.41 / 1.122 |
| 1440x900@1-dark | 18-nook-earned | 18.864 / 19.626 (1440x3125 vs 1440x2888) | 11.276 / 11.919 | 18.864 / 19.626 (1440x2888 vs 1440x3125) | 11.276 / 11.919 |
| 1440x900@1-light | 16-stats-populated | 11.638 / 13.923 | 17.98 / 26.025 | 14.158 / 52.098 | 16.013 / 50.854 |
| 375x667@2-dark | 02-focus-start | 0.337 / 0.354 | 0.615 / 1.068 | 0.912 / 4.919 | 1.191 / 5.632 |
| 375x667@2-dark | 03-focus-mid | 6.154 / 12.637 | 6.188 / 12.688 | 0.47 / 3.694 | 0.0 / 0.0 |
| 375x667@2-dark | 04-focus-paused | 0.686 / 0.703 | 0.609 / 0.63 | 0.347 / 0.355 | 0.0 / 0.0 |
| 375x667@2-dark | 05-focus-added | 0.59 / 5.297 | 0.59 / 5.297 | 1.426 / 6.191 | 1.426 / 6.191 |
| 375x667@2-dark | 06-whistle | 0.018 / 9.09 | 0.0 / 0.0 | 0.018 / 9.09 | 0.0 / 0.0 |
| 375x667@2-dark | 09-break | 0.0 / 7.578 | 0.335 / 0.343 | 0.0 / 7.578 | 0.335 / 0.343 |
| 375x667@2-light | 13-first-brew | 0.656 / 22.493 | 0.897 / 4.976 | 0.656 / 22.493 | 0.897 / 4.976 |
| 375x667@2-light | 17-nook-early | 13.301 / 15.221 (750x2844 vs 750x3272) | 0.246 / 1.556 | 13.333 / 14.912 (750x3272 vs 750x2844) | 0.291 / 2.612 |
| 375x667@2-light | 19-settings | 31.437 / 73.701 | 0.322 / 0.348 | 31.437 / 73.701 | 0.0 / 0.0 |
| 390x844@2-dark | 19-settings | 30.224 / 72.864 | 31.08 / 73.472 (780x8256 vs 780x8300) | 12.041 / 15.539 (780x8256 vs 780x8300) | 0.0 / 0.014 |
| 390x844@2-light | 05-focus-added | 0.602 / 0.619 | 0.652 / 1.065 | 0.252 / 0.657 | 0.0 / 0.0 |
| 390x844@2-light | 07-summary | 16.008 / 21.406 | 0.0 / 0.0 | 0.0 / 0.0 | 16.008 / 21.406 |

Facts read off this table (no interpretation):

- Of the 18 rechecked pairs, 8 are still over 0.5 % at tolerance 16 between trial and control in take 2 (1440 dark 09-break, 11b, 18-nook-earned; 1440 light 16-stats-populated; 375 dark 02-focus-start, 05-focus-added; 375 light 13-first-brew; 390 light 07-summary) and 10 are not.
- 19-settings, 375×667 light: take 1 trial vs control 31.4 / 73.7; ctrl take 1 vs ctrl take 2 is also 31.4 / 73.7, trial take 1 vs trial take 2 is 0.3 / 0.3; take 2 trial vs control 0.0 / 0.0.
- 19-settings, 390×844 dark: take 1 trial vs control 30.2 / 72.9 (both 8256 px tall); both sides' take 2 images are 8300 px tall; take 2 trial vs control 0.0 / 0.014.
- 03-focus-mid, 375×667 dark: take 1 6.2 / 12.6; trial take 1 vs trial take 2 is 6.2 / 12.7, ctrl take 1 vs ctrl take 2 is 0.5 / 3.7; take 2 trial vs control 0.0 / 0.0.
- 07-summary, 390×844 light: each side is identical between its two takes (0.0 / 0.0); trial vs control stays 16.0 / 21.4 in take 2.
- 16-stats-populated, 1440×900 light: trial1 vs ctrl1 11.6 / 13.9; trial1 vs trial2 18.0 / 26.0; ctrl1 vs ctrl2 14.2 / 52.1; trial2 vs ctrl2 16.0 / 50.9.
- 17-nook-early and 18-nook-earned, 1440×900 dark: take 1 trial vs control 11.2 / 12.8 and 18.9 / 19.6 (sizes differ); ctrl1 vs ctrl2 11.2 / 12.8 and 18.9 / 19.6; take 2 trial vs control 0.4 / 1.1 and 11.3 / 11.9.
- 17-nook-early, 375×667 light: the two ctrl takes differ in height (3272 vs 2844 px); take 2 trial vs control 0.3 / 2.6 (same size).

## 6. Smoke with real input (preview :5455, 390×844 @2, light, touch-emulated clicks)

Script `tools/smoke.mjs` (Playwright mouse/touch input pipeline, one continuous flow in one context), gate `--n 1`, 12:08:14 to 12:09:56. Setup: `/?debug&onboarded=1#/`, then `autoStartBreaks:false` set once through the debug settings store so the summary's break countdown cannot start during a slow screenshot (all later steps are real clicks). 3D scene setting stayed `"auto"` (low tier on this CPU-only machine, so no model load).

| # | step | result |
|---|---|---|
| 1 | load home (`#/`) | OK |
| 2 | click "Put the kettle on" → `#/focus`, wait 4 s | OK |
| 3 | click "End session" → dialog "Leave the kettle early?" (text: "That's okay. It's been under a minute, so there's nothing to save yet. Keep brewing / End session") | OK |
| 4 | click "End session" in the dialog → back at `#/` (Today) | OK |
| 5 | click "Put the kettle on" again → `#/focus`, wait 3 s | OK |
| 6 | `__kettle.finish()` → `#/done`, heading "25 minutes brewed", summary text read ("Tea's ready. Take five before the next one. Trailing pothos is in your nook ... +43 leaves ... 25/30 min today ... Recipe done · Finish a full brew ... Tea time · 5 min / Skip break") | OK |
| 7 | click "Skip break" → `#/` | OK |
| 8 | click "Nook" tab → `#/nook`, wait 6 s; `p[class*=hint]` count 1 | OK |

- **Page errors: 0. Console errors: 0. Console warnings: 0. Failed requests: 0. HTTP responses >= 400: 0.** (`ERRORS: []` in `logs/smoke.log` and `smoke/smoke-log.json`.)
- 8 screenshots in `smoke/` (home, focus-running, end-sheet, today-after-end, focus-running-2, summary, today-after-skip, nook).
- Only the trial preview was driven; the control was not smoked.

## 7. Incomplete, deviations, caveats

- **Capture invocation differs from the brief in two ways.** (a) `node --import .tmp/LR/std-freeze.mjs` fails on this Node (`ERR_INVALID_MODULE_SPECIFIER`, ".tmp/LR/std-freeze.mjs is not a valid package name"), so the runs use `--import ./.tmp/LR/std-freeze.mjs`; the first attempt (12 failed runs, 0 s each, nothing captured) is kept as `logs/capture-*.attempt0-bad-import-path.log` and its output was deleted. (b) The planned side-by-side `--n 2` job could not get a slot (another lane held two single slots and a waiting 2-slot job blocks the queue behind it), so each side ran as its own `--n 1` gate job (`tools/std-side.sh`), both jobs started together at 12:12:59 and ran the six configurations in the same order. `capture.mjs` itself is the unchanged file at `/home/user/Vibei/kettle/review/product-excellence/tools/capture.mjs`, run from each worktree (`node_modules` of both worktrees is a symlink to the same install, so the preload and the tool share one `playwright` module). The preload file is the existing `/tmp/claude-0/lr-tools/r8-trial/kettle/.tmp/L2/std-freeze.mjs` (no archive extraction needed), copied to `.tmp/LR/` in both worktrees (git-ignored).
- All 6 configurations were captured on both sides (dark included): 126 pairs, 21 images per side per configuration, every capture exit 0, `errors: []` in every `capture-meta.json`.
- Not done: no control-side smoke; no control-side full chromium run (no trial failure to compare); no capture at other sizes, reduced motion or `--static`; the repeat-take check in section 5 covers only the 18 pairs listed there (second takes of those states only, not of the whole set).
- The full-page states (stats, nook, settings) are tall images; "bbox" is the bounding box of pixels over tolerance 16, which for a few pairs spans most of the page.
- Elapsed machine load was high during sections 5 to 6 (other lanes), so absolute durations are not comparable with a quiet-machine run.

## 8. Evidence layout (90 MB, all under this directory)

- `logs/`: tsc, vitest, chromium-full (log, start/end/exit, gate), jobA, timer-app-pwa, smoke, capture (per side), recheck, `pdiff-<config>.json` (raw per-state numbers), `rediff.json`.
- `matrix/`: `compact-matrix.md` (21 states × 6 configurations), `over-0.5pct.md`, one full table per configuration (`matrix-*.md`).
- `pairs/<config>/`: `<state>-trial.png`, `<state>-ctrl.png`, `<state>-diff.png` (red = pixels over tolerance 16 on a faded trial image) for every pair over 0.5 % at tolerance 16 or strict, or with differing sizes.
- `capture/<side>/<config>/`: `capture-meta.json`, `freeze.json`, `run.log` (the full image sets were kept in scratch and deleted).
- `recheck-takes/`: the second-take images, `capture-meta.json` and `run.log` of section 5.3.
- `smoke/`: 8 PNG + `smoke-log.json`. `tools/`: every script used (gate job wrappers, capture driver, smoke, diff/summary scripts).
- Left in place (git-ignored, not source): `.tmp/LR/` in both worktrees (preload copy; smoke script copy in the trial one), `kettle/test-results/pwa-dist` in the trial worktree.
