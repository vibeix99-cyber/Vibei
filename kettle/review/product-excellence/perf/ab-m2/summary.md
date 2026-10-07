# Kettle perf run

- Started 2026-10-07T17:21:05.438Z, finished 2026-10-07T17:30:11.333Z
- Host: 4 vCPU Intel(R) Xeon(R) Processor @ 2.10GHz, 15.7 GB; Linux 6.18.44-fc-v77
- Browser: Chromium 141.0.7390.37 (Playwright, headless); WebGL renderer: ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)
- Load average at start: `17:21:05 up  1:05,  0 user,  load average: 11.09, 13.85, 13.25`; at end: `17:30:11 up  1:14,  0 user,  load average: 8.56, 8.95, 10.81`
- 3 runs, alternating base order, fresh context per journey; theme light; service workers block; CPU throttle ×1; scene quality auto (default settings)
- Builds: before-6ddcdaa = http://127.0.0.1:5243; after-m2 = http://127.0.0.1:5242

Event duration "<16" means no Event Timing entry reached the 16 ms threshold. Medians, with the individual runs in brackets.

## phone

| Area | Metric | before-6ddcdaa | after-m2 | after-m2 − before-6ddcdaa |
|---|---|---:|---:|---:|
| Startup | TTFB (ms) | 4.4 [4.4, 6.9, 3.9] | 6.3 [6.5, 6.3, 3.7] | 1.9 |
| Startup | FCP (ms) | 272 [352, 204, 272] | 164 [164, 196, 156] | -108 |
| Startup | LCP (ms) | 592 [804, 564, 592] | 524 [524, 544, 504] | -68 |
| Startup | DOMContentLoaded (ms) | 175.9 [175.9, 155.9, 212.1] | 126.3 [126.3, 149, 117.8] | -49.6 |
| Startup | load (ms) | 176.4 [176.4, 156.3, 212.9] | 126.8 [126.8, 149.3, 118.1] | -49.6 |
| Startup | Start button ready (ms) | 543.2 [543.2, 525.4, 569.2] | 486.2 [486.2, 516.5, 485.3] | -57 |
| Startup | first click handled → #/focus (ms) | 1136.3 [1092.8, 1325.1, 1136.3] | 891 [1212.2, 862.2, 891] | -245.3 |
| Startup | TBT to first interaction (ms) | 119 [201, 119, 74] | 164 [110, 164, 217] | 45 |
| Input | Start, cold: event duration (ms) | 672 [928, 672, 384] | 312 [232, 312, 336] | -360 |
| Input | Start, cold: click → next paint (ms) | 425.9 [443.2, 425.9, 321] | 453.3 [329.4, 453.3, 535.8] | 27.4 |
| Input | start: event duration (ms) | 184 [200, 184, 144] | 152 [120, 152, 208] | -32 |
| Input | start: click → next paint (ms) | 319.4 [319.4, 418.5, 273] | 304.8 [270.5, 304.8, 364.5] | -14.6 |
| Input | pause: event duration (ms) | 352 [456, 352, 168] | 496 [536, 496, 432] | 144 |
| Input | pause: click → next paint (ms) | 126.4 [126.4, 135.5, 50.7] | 279.1 [328.1, 210.3, 279.1] | 152.7 |
| Input | resume: event duration (ms) | 56 [56, 96, 40] | 56 [56, 128, 48] | 0 |
| Input | resume: click → next paint (ms) | 33.7 [36.4, 33.7, 29.9] | 36.8 [24.7, 37.9, 36.8] | 3.1 |
| Input | add5: event duration (ms) | 480 [776, 480, 360] | 536 [536, 672, 352] | 56 |
| Input | add5: click → next paint (ms) | 288.1 [289.4, 288.1, 126.3] | 217 [278.2, 217, 158.3] | -71.1 |
| Input | teaTime: event duration (ms) | 288 [248, 288, 320] | 200 [136, 200, 216] | -88 |
| Input | teaTime: click → next paint (ms) | 108.6 [103.7, 112.1, 108.6] | 75.4 [55.6, 81.1, 75.4] | -33.2 |
| Input | longest task during journey (ms) | 102 [102, 103, 70] | 69 [58, 69, 104] | -33 |
| Input | TBT during journey (ms) | 52 [52, 86, 20] | 19 [8, 19, 54] | -33 |
| Layout shift | CLS homeLoad (session window) | 0 [0, 0, 0] | 0 [0, 0, 0] | 0 |
| Layout shift | CLS focus (session window) | 0 [0, 0, 0] | 0 [0, 0, 0] | 0 |
| Layout shift | CLS whistleToSummary (session window) | 0.5 [0.5, 0.5, 0.5] | 0 [0, 0, 0] | -0.5 |
| Layout shift | CLS break (session window) | 0 [0, 0, 0] | 0 [0, 0, 0] | 0 |
| Layout shift | CLS journey (session window) | 0.5 [0.5, 0.5, 0.5] | 0 [0, 0, 0] | -0.5 |
| Layout shift | CLS Nook load (session window) | 0 [0, 0, 0] | 0 [0, 0, 0] | 0 |
| Memory | JS heap used after GC, home (MB) | 8.9 [8.9, 8.9, 8.9] | 8.9 [8.9, 8.9, 8.9] | 0 |
| Memory | JS heap used after GC, focus (MB) | 10.2 [10.1, 10.2, 10.2] | 10.2 [10.1, 10.3, 10.2] | 0 |
| Memory | JS heap used after GC, summary (MB) | 10.9 [11, 10.9, 10.9] | 10.9 [10.9, 10.9, 10.9] | 0 |
| Memory | JS heap used after GC, Nook 3D (MB) | 9.7 [9.8, 9.7, 9.7] | 9.8 [9.8, 9.8, 9.8] | 0.1 |
| Memory | DOM nodes, summary | 548 [548, 548, 548] | 548 [548, 548, 548] | 0 |
| Main thread | busy ms, homeToFocus | 454.8 [450.9, 476.7, 454.8] | 462.3 [499, 449.8, 462.3] | 7.5 |
| Main thread | busy ms, focusControls | 322.6 [322.6, 321.6, 401.9] | 323.6 [323.6, 311.8, 356.4] | 1 |
| Main thread | busy ms, whistleToSummary | 419 [397.6, 419, 468.1] | 469.2 [503.3, 445.8, 469.2] | 50.2 |
| Main thread | busy ms, break | 200.6 [191.5, 200.6, 217.7] | 206.5 [253.8, 206.5, 205.5] | 5.9 |
| 3D | focus stage: Start → window scene ready (ms) | 1157.4 [1197.6, 1157.4, 1135.4] | 1163.3 [1124.8, 1163.3, 1176.9] | 5.9 |
| 3D | Nook cold load: nav → 3D ready (ms) | 2559.5 [3727.9, 2559.5, 2275.7] | 2545.9 [1474, 2545.9, 2876.5] | -13.6 |
| Bytes | cold load through first Start + 1.2 s, total (KB on the wire) | 639.2 [639.2, 639.2, 639.2] | 640.3 [640.3, 640.3, 640.3] | 1.1 |
| Bytes | cold load through first Start + 1.2 s, total (KB gzip -6 est.) | 625 [625, 625, 625] | 626 [626, 626, 626] | 1 |
| Bytes | Home settled: js (KB on the wire) | 280.2 [280.2, 280.2, 280.2] | 281 [281, 281, 281] | 0.8 |
| Bytes | Home settled: css (KB on the wire) | 41.2 [41.2, 41.2, 41.2] | 41.5 [41.5, 41.5, 41.5] | 0.3 |
| Bytes | Home settled: font (KB on the wire) | 67.9 [67.9, 67.9, 67.9] | 67.9 [67.9, 67.9, 67.9] | 0 |
| Bytes | Home settled: image (KB on the wire) | 19.7 [19.7, 19.7, 19.7] | 19.7 [19.7, 19.7, 19.7] | 0 |
| Bytes | Home settled: three (KB on the wire) | 143.3 [143.3, 143.3, 143.3] | 143.3 [143.3, 143.3, 143.3] | 0 |
| Bytes | Home settled: scene3d (KB on the wire) | 28.2 [28.2, 28.2, 28.2] | 28.2 [28.2, 28.2, 28.2] | 0 |
| Bytes | Home settled: total (KB on the wire) | 581.7 [581.7, 581.7, 581.7] | 582.8 [582.8, 582.8, 582.8] | 1.1 |
| Bytes | through summary: total (KB on the wire) | 659.6 [659.6, 659.6, 659.6] | 660.7 [660.7, 660.7, 660.7] | 1.1 |
| Bytes | Nook cold: total (KB on the wire) | 562 [562, 562, 562] | 563 [563, 563, 563] | 1 |

Chai (before-6ddcdaa, phone): home: chai-sipping.webp 302×491 source px for 67.7×109.9 CSS px = 135×220 device px (×2.23) · focus: chai-reading.webp 311×487 source px for 112.8×176.6 CSS px = 226×353 device px (×1.38) · summary: chai-cheering.webp 312×428 source px for 113.2×155.2 CSS px = 226×310 device px (×1.38) · break: chai-sipping.webp 302×491 source px for 109.5×178.1 CSS px = 219×356 device px (×1.38)

Chai (after-m2, phone): home: chai-sipping.webp 302×491 source px for 67.7×109.9 CSS px = 135×220 device px (×2.23) · focus: chai-reading.webp 311×487 source px for 112.8×176.6 CSS px = 226×353 device px (×1.38) · summary: chai-cheering.webp 312×428 source px for 113.2×155.2 CSS px = 226×310 device px (×1.38) · break: chai-sipping.webp 302×491 source px for 109.5×178.1 CSS px = 219×356 device px (×1.38)

## desktop

| Area | Metric | before-6ddcdaa | after-m2 | after-m2 − before-6ddcdaa |
|---|---|---:|---:|---:|
| Startup | TTFB (ms) | 3.5 [3.5, 3.4, 4.1] | 8 [8, 10.6, 4.8] | 4.5 |
| Startup | FCP (ms) | 224 [168, 224, 232] | 256 [248, 256, 292] | 32 |
| Startup | LCP (ms) | 580 [524, 588, 580] | 592 [556, 596, 592] | 12 |
| Startup | DOMContentLoaded (ms) | 164.5 [118.9, 174.6, 164.5] | 190.9 [183.4, 192.5, 190.9] | 26.4 |
| Startup | load (ms) | 164.9 [119.3, 175.3, 164.9] | 191.4 [184, 193.5, 191.4] | 26.5 |
| Startup | Start button ready (ms) | 539.3 [480.3, 539.3, 545.9] | 548.3 [531.7, 548.3, 551.7] | 9 |
| Startup | first click handled → #/focus (ms) | 1142.8 [1142.8, 1309.6, 797] | 1290.9 [1290.9, 817.8, 1294.9] | 148.1 |
| Startup | TBT to first interaction (ms) | 140 [100, 246, 140] | 166 [166, 141, 181] | 26 |
| Input | Start, cold: event duration (ms) | 600 [1056, <16, 600] | <16 [<16, 464, <16] | -600 |
| Input | Start, cold: click → next paint (ms) | 344.5 [245.3, 384.7, 344.5] | 362.7 [391.3, 301.8, 362.7] | 18.2 |
| Input | start: event duration (ms) | 400 [456, 400, 384] | 440 [344, 488, 440] | 40 |
| Input | start: click → next paint (ms) | 283.9 [291.8, 283.9, 244.5] | 317.5 [304.5, 343.9, 317.5] | 33.6 |
| Input | pause: event duration (ms) | <16 [776, <16, <16] | 280 [<16, 1152, 280] | 280 |
| Input | pause: click → next paint (ms) | 35.8 [35.8, 366, 32.4] | 24.3 [86.5, 24.3, 23.3] | -11.5 |
| Input | resume: event duration (ms) | 592 [536, 760, 592] | 888 [1040, 888, 640] | 296 |
| Input | resume: click → next paint (ms) | 25 [25, 97.2, 20] | 110.3 [23.6, 150.8, 110.3] | 85.3 |
| Input | add5: event duration (ms) | 376 [1032, <16, 376] | <16 [<16, <16, <16] | -376 |
| Input | add5: click → next paint (ms) | 30.9 [14.3, 112, 30.9] | 177.1 [32.4, 372.9, 177.1] | 146.2 |
| Input | teaTime: event duration (ms) | 480 [512, 376, 480] | 384 [464, 384, 176] | -96 |
| Input | teaTime: click → next paint (ms) | 19.1 [100.4, 10.5, 19.1] | 14.6 [14.6, 11.4, 16.3] | -4.5 |
| Input | longest task during journey (ms) | 127 [137, 122, 127] | 125 [128, 120, 125] | -2 |
| Input | TBT during journey (ms) | 116 [162, 72, 116] | 108 [92, 108, 147] | -8 |
| Layout shift | CLS homeLoad (session window) | 0 [0, 0, 0] | 0 [0, 0, 0] | 0 |
| Layout shift | CLS focus (session window) | 0 [0, 0, 0] | 0 [0, 0, 0] | 0 |
| Layout shift | CLS whistleToSummary (session window) | 0 [0, 0, 0] | 0 [0, 0, 0] | 0 |
| Layout shift | CLS break (session window) | 0 [0, 0, 0] | 0 [0, 0, 0] | 0 |
| Layout shift | CLS journey (session window) | 0 [0, 0, 0] | 0 [0, 0, 0] | 0 |
| Layout shift | CLS Nook load (session window) | 0 [0, 0, 0] | 0 [0, 0, 0] | 0 |
| Memory | JS heap used after GC, home (MB) | 8.9 [8.9, 8.8, 8.9] | 8.9 [8.9, 8.9, 8.9] | 0 |
| Memory | JS heap used after GC, focus (MB) | 10.2 [10.2, 10.2, 10.2] | 10.2 [10.2, 10.2, 10.1] | 0 |
| Memory | JS heap used after GC, summary (MB) | 10.9 [10.9, 10.9, 11] | 10.9 [10.9, 10.9, 10.9] | 0 |
| Memory | JS heap used after GC, Nook 3D (MB) | 9.6 [9.7, 9.6, 9.6] | 9.6 [9.5, 9.6, 9.7] | 0 |
| Memory | DOM nodes, summary | 548 [548, 548, 548] | 548 [548, 548, 548] | 0 |
| Main thread | busy ms, homeToFocus | 442.6 [474.1, 442.6, 424.3] | 434.3 [433, 434.3, 434.6] | -8.3 |
| Main thread | busy ms, focusControls | 224.4 [217.8, 229.8, 224.4] | 197 [194.4, 216.4, 197] | -27.4 |
| Main thread | busy ms, whistleToSummary | 308.7 [325.7, 308.7, 289.3] | 277.4 [267.8, 277.4, 287.8] | -31.3 |
| Main thread | busy ms, break | 157.7 [181.5, 152.9, 157.7] | 160.1 [130.9, 166.1, 160.1] | 2.4 |
| 3D | focus stage: Start → window scene ready (ms) | 3003 [3003, 3677.4, 2972.3] | 2675.3 [2479.7, 2675.3, 2829.9] | -327.7 |
| 3D | Nook cold load: nav → 3D ready (ms) | 5358 [3583.2, 6168.4, 5358] | 5602.9 [5602.9, 5846, 5056.6] | 244.9 |
| Bytes | cold load through first Start + 1.2 s, total (KB on the wire) | 639.2 [639.2, 639.2, 639.2] | 640.3 [640.3, 640.3, 640.3] | 1.1 |
| Bytes | cold load through first Start + 1.2 s, total (KB gzip -6 est.) | 625 [625, 625, 625] | 626 [626, 626, 626] | 1 |
| Bytes | Home settled: js (KB on the wire) | 280.2 [280.2, 280.2, 280.2] | 281 [281, 281, 281] | 0.8 |
| Bytes | Home settled: css (KB on the wire) | 41.2 [41.2, 41.2, 41.2] | 41.5 [41.5, 41.5, 41.5] | 0.3 |
| Bytes | Home settled: font (KB on the wire) | 67.9 [67.9, 67.9, 67.9] | 67.9 [67.9, 67.9, 67.9] | 0 |
| Bytes | Home settled: image (KB on the wire) | 19.7 [19.7, 19.7, 19.7] | 19.7 [19.7, 19.7, 19.7] | 0 |
| Bytes | Home settled: three (KB on the wire) | 143.3 [143.3, 143.3, 143.3] | 143.3 [143.3, 143.3, 143.3] | 0 |
| Bytes | Home settled: scene3d (KB on the wire) | 28.2 [28.2, 28.2, 28.2] | 28.2 [28.2, 28.2, 28.2] | 0 |
| Bytes | Home settled: total (KB on the wire) | 581.7 [581.7, 581.7, 581.7] | 582.8 [582.8, 582.8, 582.8] | 1.1 |
| Bytes | through summary: total (KB on the wire) | 659.6 [659.6, 659.6, 659.6] | 660.7 [660.7, 660.7, 660.7] | 1.1 |
| Bytes | Nook cold: total (KB on the wire) | 562 [562, 562, 562] | 563 [563, 563, 563] | 1 |

Chai (before-6ddcdaa, desktop): home: chai-sipping.webp 302×491 source px for 91.8×149.2 CSS px = 92×149 device px (×3.29) · focus: chai-reading.webp 311×487 source px for 185.1×289.9 CSS px = 185×290 device px (×1.68) · summary: chai-cheering.webp 312×428 source px for 185.7×254.7 CSS px = 186×255 device px (×1.68) · break: chai-sipping.webp 302×491 source px for 179.8×292.2 CSS px = 180×292 device px (×1.68)

Chai (after-m2, desktop): home: chai-sipping.webp 302×491 source px for 91.9×149.1 CSS px = 92×149 device px (×3.29) · focus: chai-reading.webp 311×487 source px for 185.1×289.9 CSS px = 185×290 device px (×1.68) · summary: chai-cheering.webp 312×428 source px for 185.7×254.7 CSS px = 186×255 device px (×1.68) · break: chai-sipping.webp 302×491 source px for 179.8×292.2 CSS px = 180×292 device px (×1.68)
