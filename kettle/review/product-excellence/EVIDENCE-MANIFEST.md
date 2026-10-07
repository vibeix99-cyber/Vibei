# Evidence manifest — Product Excellence

Every review packet cites files from this manifest. Paths are relative to the approved package
(`kettle/.tmp/pkg/kettle-excellence-integrated/`) or to `kettle/review/product-excellence/`. Append-only.

## Benchmark references (approved package INTEGRATED-2026-10-06)

| ID | Tier | Product / state | Media | SHA-256 (first 16) |
|---|---|---|---|---|
| K01 | PRIMARY | Kettle / Home | `VISUAL_BENCHMARK_LIBRARY/assets/current/01-home.png` | `c23ed21b6e3a6e47…` |
| K02 | PRIMARY | Kettle / Summary | `VISUAL_BENCHMARK_LIBRARY/assets/current/07-summary.png` | `8327821ea1cdaa30…` |
| K03 | PRIMARY | Kettle / Settled unlock | `VISUAL_BENCHMARK_LIBRARY/assets/current/11b-summary-unlock-settled.png` | `4195ce7f595061c7…` |
| K04 | PRIMARY | Kettle / Whistle→summary→tea | `VISUAL_BENCHMARK_LIBRARY/assets/current/recordings/whistle-to-summary-phone-dark-reduced-motion.mp4` | `82074cd240187ef0…` |
| K05 | PRIMARY | Kettle / Pose sheet | `VISUAL_BENCHMARK_LIBRARY/assets/approved/chai-approved-pose-sheet.png` | `8c60d4f10bef1a38…` |
| K06 | PRIMARY | Kettle / Welcome | `VISUAL_BENCHMARK_LIBRARY/assets/current/r6-context/phone-light/12-hello.png` | `e91703388a0bc484…` |
| K07 | PRIMARY | Kettle / Empty state | `VISUAL_BENCHMARK_LIBRARY/assets/current/live-stats-empty.jpg` | `2a87c745651483d1…` |
| K08 | PRIMARY | Kettle / Nook | `VISUAL_BENCHMARK_LIBRARY/assets/current/live-nook.jpg` | `191902f501dfae43…` |
| K09 | PRIMARY | Kettle / Settings | `VISUAL_BENCHMARK_LIBRARY/assets/current/live-settings.jpg` | `92ccd9afaf1cf6dc…` |
| B01 | PRIMARY | Finch / Daily goals and adventure | `VISUAL_BENCHMARK_LIBRARY/assets/official/finch-publisher-04.jpg` | `43f3197baa783ee6…` |
| B02 | PRIMARY | Duolingo / Correct answer | `VISUAL_BENCHMARK_LIBRARY/assets/official/duolingo-correct.gif` | `c47af1af34bf5c08…` |
| B03 | PRIMARY | Forest / Focus | `VISUAL_BENCHMARK_LIBRARY/assets/official/forest-timer.webp` | `d957f5189b60dbdd…` |
| B04 | PRIMARY | Headspace / Today/Explore | `VISUAL_BENCHMARK_LIBRARY/assets/official/headspace-today-explore-2023.jpg` | `67c025cde1286cc6…` |
| B05 | PRIMARY | Blinkist / Trial timeline | `research/videos/sYRhXB_ZcLI/frames/PW-03.png` | `e0355445a9b07686…` |
| B06 | PRIMARY | Granola / Meeting notes being enhanced | `research/videos/ihWJtNaLYLo/frames/HR-V08-granola-output-0153.jpg` | `946f41b6d4289ec3…` |
| B07 | PRIMARY | Duolingo / Completion/quest | `research/videos/xWGC4Pc3w5E/06-completion-and-quest.png` | `7d2a8b1e6f1714f0…` |
| B08 | PRIMARY | Phantom / Character/brand art | `research/videos/Du2lkZ_cux8/frames/EDV-03-phantom-character-06m23s.jpg` | `4f54c1d460c21130…` |
| S01 | SECONDARY | One Year / Founder letter | https://www.youtube.com/watch?v=Qsq-Sj_rojU&t=116s | — (secondary; inspect before use) |
| S02 | SECONDARY | Focus Flight / Theme selection | https://www.youtube.com/watch?v=Qsq-Sj_rojU&t=202s | — (secondary; inspect before use) |
| S03 | SECONDARY | Blinkist / Trial timeline | https://www.youtube.com/watch?v=9ypqs_2fAl8&t=187s | — (secondary; inspect before use) |
| S04 | SECONDARY | Slopes / Pay ramp | https://www.youtube.com/watch?v=9ypqs_2fAl8&t=227s | — (secondary; inspect before use) |
| S05 | SECONDARY | Blinkist / Cancellation choice | https://www.youtube.com/watch?v=E7RzEZ8GlHE&t=329s | — (secondary; inspect before use) |
| S06 | SECONDARY | Moonly / Activational card | https://www.youtube.com/watch?v=qK7WYCMvjUw&t=59s | — (secondary; inspect before use) |
| S07 | SECONDARY | AI Home Decor / Before/after imagery | https://www.youtube.com/watch?v=LuOZ2PKvd4s&t=422s | — (secondary; inspect before use) |
| S08 | SECONDARY | Duolingo/Opal / Streak discussion | https://www.youtube.com/watch?v=ARq1bx3Sfg8&t=335s | — (secondary; inspect before use) |

## BEFORE baseline (revision 8f1044a)

Captured with `tools/capture.mjs` against the dev server on port 5191 (Chromium + SwiftShader CPU renderer), on
2026-10-07. Each folder has `capture-meta.json` (viewport, DPR, theme, revision, time, per-state notes, page errors).

| Folder | Viewport | DPR | Theme | States |
|---|---|---|---|---|
| `baseline/phone-390x844-light` | 390×844 | 2 | light | 01–19 (22 states) |
| `baseline/phone-390x844-dark` | 390×844 | 2 | dark | 01–19 |
| `baseline/phone-375x667-light` | 375×667 | 2 | light | 01–19 |
| `baseline/phone-375x667-dark` | 375×667 | 2 | dark | 01–19 |
| `baseline/desktop-1440x900-light` | 1440×900 | 1 | light | 01–19 |
| `baseline/desktop-1440x900-dark` | 1440×900 | 1 | dark | 01–19 |
| `baseline/phone-390x844-dark-reduced-motion` | 390×844 | 2 | dark, reduced motion | 02, 04, 06, 07, 09, 10, 11, 11b |

States: 01 Home · 01b Home scrolled to Brew length · 02 focus start · 03 focus mid · 04 paused · 05 +5 added ·
06 whistle · 07 routine summary · 08 summary expanded, scrolled to the last line · 09 tea break · 10 break's over ·
11 major unlock (first frame) · 11b unlock settled · 12 welcome · 13 first 15-min brew · 14 first-brew summary ·
15 Stats empty · 16 Stats populated · 17 Nook early · 18 Nook earned · 19 Settings.
Full-page captures (15–19) show the fixed tab bar and sticky header at their scroll-time position mid-image: a
capture artifact, not a product defect.

## Review packets and verdicts

| Contract | Packet | Reviewed commit | Checker verdicts |
|---|---|---|---|
