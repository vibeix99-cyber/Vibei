# Round 4: what the private preview actually contains

## Provenance of https://claude.ai/artifact/3CGqyd5xuPzrbmTsw6M3yQ (Version 2)
- Read back from the host (version `1790696339-d7d4`). With the host's 536-byte wrapper removed, its content is identical to `.tmp/preview-single/index.html` (the only difference is surrounding whitespace).
- A fresh single-file build from a clean `a6f75c0` tree (`vite build --config .tmp/vite.single.config.mjs` + `.tmp/single.py`) has SHA-256 `62753ad1…dbfd04`, byte-identical to the published file. So the preview is current.
- The design-fix code is present in it: `data-tablet`, the `clamp(1.875rem…)` title token, "a surprise", "Optional", "Carry forward", "Every badge started".

## Before/after (same seed `veteran`, light theme, same viewport, service workers blocked)
BEFORE = production build of `9f566d7`; AFTER = production build of `a6f75c0`. The app's `innerWidth×innerHeight` is printed on each capture.

| Image | What changes |
|---|---|
| `today-768.png` | Clear: one column → two columns (composer + start on the right), whole page fits |
| `stats-768.png` | Clear: one column → two columns (badges and rhythm beside the level and chart) |
| `settings-land.png` | Subtle: title 28 px instead of about 32 px; content column wider |
| `today-607.png`, `stats-607.png` | Almost none: only the "Optional" tag, "a surprise" and slightly smaller titles |
| `transition-before.png`, `transition-after.png`, `transition-same-moment.png` | Before: at +174–207 ms Today's text is overlaid on the Focus timer. After: Focus fades in on its own paper |

The transition was captured with WebGL disabled in both builds: with software 3D, headless Chromium emitted no frames mid-transition. The Focus room is therefore the static image in both.

Scripts: `capture.mjs` (run once plain, then with `tx` for the transition), `compose.mjs`.
