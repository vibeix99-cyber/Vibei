# Kettle perf run

- Started 2026-10-07T00:41:06.660Z, finished 2026-10-07T00:48:16.277Z
- Host: 4 vCPU Intel(R) Xeon(R) Processor @ 2.10GHz, 15.7 GB; Linux 6.18.44-fc-v77
- Browser: Chromium 141.0.7390.37 (Playwright, headless); WebGL renderer: ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)
- Load average at start: `00:41:06 up 30 min,  0 user,  load average: 1.69, 2.65, 2.51`; at end: `00:48:16 up 37 min,  0 user,  load average: 8.09, 5.88, 4.01`
- 5 runs, alternating base order, fresh context per journey; theme light; service workers block; CPU throttle ×1; scene quality auto (default settings)
- Builds: 8f1044a = http://127.0.0.1:5242

Event duration "<16" means no Event Timing entry reached the 16 ms threshold. Medians, with the individual runs in brackets.

## phone

| Area | Metric | 8f1044a |
|---|---|---:|
| Startup | TTFB (ms) | 3.4 [3.4, 3.2, 10.4, 3.8, 3.2] |
| Startup | FCP (ms) | 176 [244, 176, 168, 204, 176] |
| Startup | LCP (ms) | 520 [700, 512, 520, 536, 516] |
| Startup | DOMContentLoaded (ms) | 126.5 [121.3, 126.5, 124.2, 161.5, 132.1] |
| Startup | load (ms) | 126.9 [121.6, 126.9, 124.5, 161.9, 132.6] |
| Startup | Start button ready (ms) | 490.7 [486.6, 494.4, 484.6, 520.1, 490.7] |
| Startup | first click handled → #/focus (ms) | 1126.2 [888.6, 1126.2, 754.3, 1154.9, 1209.3] |
| Startup | TBT to first interaction (ms) | 67 [83, 51, 88, 51, 67] |
| Input | Start, cold: event duration (ms) | 400 [696, 160, 216, 400, 424] |
| Input | Start, cold: click → next paint (ms) | 309.9 [309.9, 251.6, 349.2, 286.6, 336] |
| Input | start: event duration (ms) | 144 [128, 128, 160, 144, 152] |
| Input | start: click → next paint (ms) | 263.6 [241.6, 263.6, 410.2, 247.5, 280.4] |
| Input | pause: event duration (ms) | 384 [264, 232, 384, 440, 448] |
| Input | pause: click → next paint (ms) | 187.7 [145.9, 85.6, 203.3, 187.7, 265.9] |
| Input | resume: event duration (ms) | 48 [40, 48, 64, 40, 48] |
| Input | resume: click → next paint (ms) | 36.7 [31.3, 30.6, 37, 36.7, 37.6] |
| Input | add5: event duration (ms) | 272 [296, 272, 136, 456, 200] |
| Input | add5: click → next paint (ms) | 86.4 [86.4, 81.3, 71.3, 312.7, 89.8] |
| Input | teaTime: event duration (ms) | 120 [120, 376, 328, 120, 120] |
| Input | teaTime: click → next paint (ms) | 49.7 [49.7, 154.4, 99.5, 47.8, 45.9] |
| Input | longest task during journey (ms) | 67 [59, 57, 79, 67, 76] |
| Input | TBT during journey (ms) | 26 [9, 7, 53, 31, 26] |
| Layout shift | CLS homeLoad (session window) | 0 [0, 0, 0, 0, 0] |
| Layout shift | CLS focus (session window) | 0 [0, 0, 0, 0, 0] |
| Layout shift | CLS whistleToSummary (session window) | 0.5 [0.5, 0.5, 0.5, 0.5, 0.5] |
| Layout shift | CLS break (session window) | 0 [0, 0, 0, 0, 0] |
| Layout shift | CLS journey (session window) | 0.5 [0.5, 0.5, 0.5, 0.5, 0.5] |
| Layout shift | CLS Nook load (session window) | 0 [0, 0, 0, 0, 0] |
| Memory | JS heap used after GC, home (MB) | 8.9 [8.9, 8.9, 8.9, 8.9, 8.9] |
| Memory | JS heap used after GC, focus (MB) | 10.2 [10.1, 10.1, 10.2, 10.3, 10.2] |
| Memory | JS heap used after GC, summary (MB) | 10.9 [10.9, 10.9, 10.8, 10.9, 10.9] |
| Memory | JS heap used after GC, Nook 3D (MB) | 9.8 [9.8, 9.7, 9.7, 9.8, 9.8] |
| Memory | DOM nodes, summary | 548 [548, 548, 548, 548, 548] |
| Main thread | busy ms, homeToFocus | 468.4 [468.4, 477.9, 516.3, 458.4, 402.7] |
| Main thread | busy ms, focusControls | 330.9 [373.1, 353.3, 310.1, 330.9, 330.3] |
| Main thread | busy ms, whistleToSummary | 462.9 [464.5, 462.9, 367.4, 421.5, 480.7] |
| Main thread | busy ms, break | 211.4 [211.4, 193.9, 186.6, 216.2, 234.5] |
| 3D | focus stage: Start → window scene ready (ms) | 1122.3 [1117, 1118.9, 1174.7, 1122.3, 1170.5] |
| 3D | Nook cold load: nav → 3D ready (ms) | 2200.1 [2200.1, 2726.2, 2282.5, 1424.6, 1426.4] |
| Bytes | cold load through first Start + 1.2 s, total (KB on the wire) | 639.2 [639.2, 639.2, 639.2, 639.2, 639.2] |
| Bytes | cold load through first Start + 1.2 s, total (KB gzip -6 est.) | 625 [625, 625, 625, 625, 625] |
| Bytes | Home settled: js (KB on the wire) | 280.2 [280.2, 280.2, 280.2, 280.2, 280.2] |
| Bytes | Home settled: css (KB on the wire) | 41.2 [41.2, 41.2, 41.2, 41.2, 41.2] |
| Bytes | Home settled: font (KB on the wire) | 67.9 [67.9, 67.9, 67.9, 67.9, 67.9] |
| Bytes | Home settled: image (KB on the wire) | 19.7 [19.7, 19.7, 19.7, 19.7, 19.7] |
| Bytes | Home settled: three (KB on the wire) | 143.3 [143.3, 143.3, 143.3, 143.3, 143.3] |
| Bytes | Home settled: scene3d (KB on the wire) | 28.2 [28.2, 28.2, 28.2, 28.2, 28.2] |
| Bytes | Home settled: total (KB on the wire) | 581.7 [581.7, 581.7, 581.7, 581.7, 581.7] |
| Bytes | through summary: total (KB on the wire) | 659.6 [659.6, 659.6, 659.6, 659.6, 659.6] |
| Bytes | Nook cold: total (KB on the wire) | 562 [562, 562, 562, 562, 562] |

Chai (8f1044a, phone): home: chai-sipping.webp 302×491 source px for 67.7×109.9 CSS px = 135×220 device px (×2.23) · focus: chai-reading.webp 311×487 source px for 112.8×176.6 CSS px = 226×353 device px (×1.38) · summary: chai-cheering.webp 312×428 source px for 113.2×155.2 CSS px = 226×310 device px (×1.38) · break: chai-sipping.webp 302×491 source px for 109.5×178.1 CSS px = 219×356 device px (×1.38)

## desktop

| Area | Metric | 8f1044a |
|---|---|---:|
| Startup | TTFB (ms) | 2.9 [3.5, 4.2, 2.9, 2.6, 2.8] |
| Startup | FCP (ms) | 176 [164, 256, 232, 164, 176] |
| Startup | LCP (ms) | 532 [532, 704, 572, 516, 508] |
| Startup | DOMContentLoaded (ms) | 129.9 [117.6, 200.7, 168.8, 123, 129.9] |
| Startup | load (ms) | 130.2 [118, 201.1, 169.3, 123.3, 130.2] |
| Startup | Start button ready (ms) | 486.5 [471, 646, 532.2, 486.5, 482.1] |
| Startup | first click handled → #/focus (ms) | 1118.8 [677, 1209.4, 972, 1118.8, 1142.9] |
| Startup | TBT to first interaction (ms) | 97 [94, 166, 231, 79, 97] |
| Input | Start, cold: event duration (ms) | 912 [344, 1472, 1072, 912, <16] |
| Input | Start, cold: click → next paint (ms) | 279.1 [274.9, 279.1, 450.2, 250.5, 313.1] |
| Input | start: event duration (ms) | 264 [264, 264, 408, 264, 336] |
| Input | start: click → next paint (ms) | 230.8 [218.4, 230.8, 272.6, 213.8, 230.9] |
| Input | pause: event duration (ms) | 312 [312, 672, 280, 272, 1080] |
| Input | pause: click → next paint (ms) | 42.6 [112.6, 48.9, 42.6, 20.2, 35.1] |
| Input | resume: event duration (ms) | 384 [384, 336, 664, 320, 528] |
| Input | resume: click → next paint (ms) | 21.8 [53.8, 24.3, 19.3, 19.4, 21.8] |
| Input | add5: event duration (ms) | 768 [368, 856, 768, 1040, <16] |
| Input | add5: click → next paint (ms) | 177.1 [95.6, 618.7, 193.6, 98.1, 177.1] |
| Input | teaTime: event duration (ms) | 528 [528, 640, 488, 576, 352] |
| Input | teaTime: click → next paint (ms) | 112.5 [106.5, 112.5, 14.9, 112.9, 119.3] |
| Input | longest task during journey (ms) | 84 [79, 84, 112, 76, 99] |
| Input | TBT during journey (ms) | 34 [29, 34, 69, 33, 49] |
| Layout shift | CLS homeLoad (session window) | 0 [0, 0, 0, 0, 0] |
| Layout shift | CLS focus (session window) | 0 [0, 0, 0, 0, 0] |
| Layout shift | CLS whistleToSummary (session window) | 0 [0, 0, 0, 0, 0] |
| Layout shift | CLS break (session window) | 0 [0, 0, 0, 0, 0] |
| Layout shift | CLS journey (session window) | 0 [0, 0, 0, 0, 0] |
| Layout shift | CLS Nook load (session window) | 0 [0, 0, 0, 0, 0] |
| Memory | JS heap used after GC, home (MB) | 8.9 [8.9, 8.9, 8.9, 8.9, 8.9] |
| Memory | JS heap used after GC, focus (MB) | 10.1 [10.1, 10.1, 10.3, 10.1, 10.3] |
| Memory | JS heap used after GC, summary (MB) | 10.9 [10.9, 10.9, 11, 10.9, 11] |
| Memory | JS heap used after GC, Nook 3D (MB) | 9.6 [9.7, 9.5, 9.6, 9.6, 9.8] |
| Memory | DOM nodes, summary | 548 [548, 548, 548, 548, 548] |
| Main thread | busy ms, homeToFocus | 380.7 [376.6, 388.6, 373.2, 380.7, 392.6] |
| Main thread | busy ms, focusControls | 215.1 [215.1, 232.7, 205.5, 218.2, 191.1] |
| Main thread | busy ms, whistleToSummary | 301 [301, 309.4, 255.3, 324.9, 254.5] |
| Main thread | busy ms, break | 138.7 [155, 138.7, 130.5, 198.9, 137.8] |
| 3D | focus stage: Start → window scene ready (ms) | 1130.9 [1130.9, 1101.9, 2558.4, 1091.8, 3509] |
| 3D | Nook cold load: nav → 3D ready (ms) | 4420.6 [3448, 4733.9, 4420.6, 4032.4, 5135.3] |
| Bytes | cold load through first Start + 1.2 s, total (KB on the wire) | 639.2 [639.2, 639.2, 639.2, 639.2, 639.2] |
| Bytes | cold load through first Start + 1.2 s, total (KB gzip -6 est.) | 625 [625, 625, 625, 625, 625] |
| Bytes | Home settled: js (KB on the wire) | 280.2 [280.2, 280.2, 280.2, 280.2, 280.2] |
| Bytes | Home settled: css (KB on the wire) | 41.2 [41.2, 41.2, 41.2, 41.2, 41.2] |
| Bytes | Home settled: font (KB on the wire) | 67.9 [67.9, 67.9, 67.9, 67.9, 67.9] |
| Bytes | Home settled: image (KB on the wire) | 19.7 [19.7, 19.7, 19.7, 19.7, 19.7] |
| Bytes | Home settled: three (KB on the wire) | 143.3 [143.3, 143.3, 143.3, 143.3, 143.3] |
| Bytes | Home settled: scene3d (KB on the wire) | 28.2 [28.2, 28.2, 28.2, 28.2, 28.2] |
| Bytes | Home settled: total (KB on the wire) | 581.7 [581.7, 581.7, 581.7, 581.7, 581.7] |
| Bytes | through summary: total (KB on the wire) | 659.6 [659.6, 659.6, 659.6, 659.6, 659.6] |
| Bytes | Nook cold: total (KB on the wire) | 562 [562, 562, 562, 562, 562] |

Chai (8f1044a, desktop): home: chai-sipping.webp 302×491 source px for 91.8×149.2 CSS px = 92×149 device px (×3.29) · focus: chai-reading.webp 311×487 source px for 185.1×289.9 CSS px = 185×290 device px (×1.68) · summary: chai-cheering.webp 312×428 source px for 185.7×254.7 CSS px = 186×255 device px (×1.68) · break: chai-sipping.webp 302×491 source px for 179.8×292.2 CSS px = 180×292 device px (×1.68)
