# Round 6 implementation: evidence

Captures and recordings from the **real app**, at the final build of this round (commit `eeff3a0`). They were taken with Playwright on the dev server, using `?debug&seed=…`. Light-theme captures pin the window to day (`nooktime=day`). Dark-theme captures use the evening room that the dark theme always shows.

The renderer is CPU-only (SwiftShader), so the 3D window and the frame rate here are pessimistic. Animation smoothness and sound still need a real device (`docs/REAL_DEVICE_CHECKLIST.md` §7).

## captures/

Each folder is one device and theme. Every folder holds the same numbered states.

| # | State |
|---|---|
| 01 | Home (Today): explicit minutes, brew length, optional task |
| 02 | Focus at the start (25:00, "Whistles at …") |
| 03 | Focus midway (gauge about half, "12 min brewed · whistles at …") |
| 04 | Paused (flame out, Paused flag, Resume) |
| 05 | Added time (+5: honey gauge segment, "whistles at … now", "now a 30 min brew") |
| 06 | The whistle (0:00, puff jet, cheering Chai) |
| 07 | Routine completion: the one summary |
| 08 | The summary, scrolled, with "How your leaves added up" open |
| 09 | Tea break (sipping Chai, kettle off the heat) |
| 10 | Break's over (stretching Chai) |
| 11 | A major unlock (level 8, the record player) |
| 12 | Welcome / first visit |
| 13 | The first brew: a real 15:00 |
| 14 | The first brew's summary, with "Make Kettle yours" |

**Folders:**
- `phone-light`, `phone-dark`: 390 × 844 at 2×.
- `desktop-light`, `desktop-dark`: 1440 × 900.
- `phone-dark-reduced-motion`: the same states with reduced motion.

**Contact sheets:** `sheet-*.png` shows each folder on one page.

## recordings/ (MP4, H.264, muted)

| File | What it shows |
|---|---|
| `whistle-to-summary-phone-light.mp4` | The last seconds of a brew, the whistle, the summary rising on the same stage, then Tea time and the break |
| `whistle-to-summary-desktop-dark.mp4` | The same sequence on desktop, dark |
| `whistle-to-summary-phone-dark-reduced-motion.mp4` | The same with reduced motion: a still whistle frame (no hops, rattle or notes), then a simple fade into the summary |
| `pause-resume-add-time-phone-light.mp4` | Pause (flame out, digits dim), resume, then +5 (flag and honey gauge segment) |
| `first-visit-15-min-brew-phone-dark.mp4` | Welcome: type an optional task, then "Start a 15-min brew" starts a real 15:00 brew |

## checks/

- `chai-sharpness-desktop2x-vs-phone2x.png`: Chai's face at 1:1 device pixels. On the left, desktop Focus at 2× (a 1.19× upscale of the 487 px source, slightly soft). On the right, a phone at 2× (downscaled, crisp).
- `chai-desktop-2x-1to1.png`: the whole desktop 2× Chai at 1:1.
