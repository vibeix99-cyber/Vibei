Separation = WCAG contrast ratio (Y_fur_ring + 0.05) / (Y_feature + 0.05) / ΔL* (CIE L*, fur ring − feature), medians over the region. Eyes = `eyes_open`, nose = the body's `chai_gloss` primitive, ring = face fur within ½ a feature diameter (1 px gap), all eroded 1 px. Measured from the engine's drawing buffer (gl.readPixels) with an id frame for the masks.

| config | view | eyes BEFORE (CR / ΔL*) | eyes AFTER | nose BEFORE | nose AFTER | fur ring L* (mean colour) BEFORE → AFTER | tier / Chai (B / A) | errors |
|---|---|---|---|---|---|---|---|---|
| 1440x900-light-high-day | close | 4.58 / 48.0 | – | 3.32 / 37.6 | – | 51.3 (#ae6d34) → – | high model / – | 0 |
| 1440x900-light-high-day | nook | 4.60 / 48.1 | – | 3.34 / 37.7 | – | 51.5 (#ae6d33) → – | high model / – | 0 |
| 1440x900-light-high-dusk | close | 2.26 / 30.0 | – | 1.93 / 25.4 | – | 30.5 (#723a19) → – | high model / – | 0 |
| 1440x900-light-high-dusk | nook | 2.26 / 30.0 | – | 1.93 / 25.4 | – | 30.5 (#713a19) → – | high model / – | 0 |
| 1440x900-light-high-night | close | 2.01 / 26.8 | – | 1.79 / 23.3 | – | 27.1 (#653416) → – | high model / – | 0 |
| 1440x900-light-high-night | nook | 2.01 / 26.8 | – | 1.78 / 23.2 | – | 27.1 (#653416) → – | high model / – | 0 |
| 1440x900-light-low-day | close | 4.55 / 47.8 | – | 3.31 / 37.4 | – | 51.3 (#af6d34) → – | low model / – | 0 |
| 1440x900-light-low-day | nook | 4.61 / 48.1 | – | 3.33 / 37.5 | – | 51.7 (#ae6d33) → – | low model / – | 0 |
| 1440x900-light-low-dusk | close | 2.26 / 30.0 | – | 1.93 / 25.4 | – | 30.5 (#723a19) → – | low model / – | 0 |
| 1440x900-light-low-dusk | nook | 2.26 / 30.0 | – | 1.93 / 25.3 | – | 30.5 (#713919) → – | low model / – | 0 |
| 1440x900-light-low-night | close | 2.01 / 26.8 | – | 1.78 / 23.2 | – | 27.1 (#653416) → – | low model / – | 0 |
| 1440x900-light-low-night | nook | 2.01 / 26.8 | – | 1.78 / 23.2 | – | 27.1 (#653416) → – | low model / – | 0 |

Day pixel-compare (drawing buffer, full frame, BEFORE `4d36939` :5478 vs AFTER :5504):

| config | view | size | FNV BEFORE | FNV AFTER | differing pixels | max channel diff |
|---|---|---|---|---|---|---|
| 1440x900-light-high-day | close | 1992×1828 | da8bfc7a | (raw only) | 0 | 0 |
| 1440x900-light-high-day | nook | 1992×1828 | dcd2be86 | (raw only) | 253 | 72 |
