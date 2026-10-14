Contrast ratio (WCAG, median Y of the fur ring + .05) / (median Y of the feature + .05)  /  ΔL* (median L* ring − feature). Ring = fur within ½ feature diameter (1 px gap); "full" ring = 1 diameter.

| config | view | hour | eyes BASE | eyes TRIAL | nose BASE | nose TRIAL | eyes full-ring BASE → TRIAL | nose full-ring BASE → TRIAL | fur ring L* (eyes) BASE → TRIAL | fur ring mean colour BASE → TRIAL | fill BASE → TRIAL | eye px / nose px (BASE, TRIAL) | components eyes/nose (B, T) | errors B/T |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1440x900-light-high | close | day | 4.58 / 48.0 | 4.58 / 48.0 | 3.34 / 37.8 | 3.34 / 37.8 | 4.58 / 48.0 → 4.58 / 48.0 | 3.34 / 37.8 → 3.34 / 37.8 | 51.3 → 51.3 | #ae6d33 → #ae6d33 | 0.16 → 0.16 | 5112/13752, 5112/13752 | 6/3, 6/3 | 5/0 |
| 1440x900-light-high | close | dusk | 2.26 / 30.0 | 3.85 / 44.4 | 1.93 / 25.4 | 3.14 / 38.7 | 2.26 / 30.0 → 3.85 / 44.4 | 1.93 / 25.4 → 3.14 / 38.7 | 30.5 → 44.9 | #723a19 → #9b5b2f | 0.16 → 0.448 | 5044/13250, 5107/13572 | 6/6, 6/4 | 5/0 |
| 1440x900-light-high | close | night | 2.01 / 26.8 | 3.99 / 45.4 | 1.79 / 23.3 | 3.27 / 40.0 | 2.01 / 26.8 → 3.99 / 45.4 | 1.79 / 23.3 → 3.27 / 40.0 | 27.1 → 45.8 | #653416 → #9a5e31 | 0.16 → 0.512 | 5033/13374, 5109/13668 | 3/3, 6/2 | 5/0 |
| 1440x900-light-low | close | day | 4.55 / 47.7 | 4.55 / 47.7 | 3.31 / 37.4 | 3.31 / 37.4 | 4.55 / 47.7 → 4.55 / 47.7 | 3.33 / 37.5 → 3.33 / 37.5 | 51.3 → 51.3 | #ae6d34 → #ae6d34 | 0.16 → 0.16 | 1955/5349, 1955/5349 | 5/1, 5/1 | 4/8 |
| 1440x900-light-low | close | dusk | 2.26 / 30.0 | 3.85 / 44.4 | 1.93 / 25.4 | 3.14 / 38.7 | 2.26 / 30.0 → 3.85 / 44.4 | 1.93 / 25.4 → 3.14 / 38.7 | 30.5 → 44.9 | #723a19 → #9b5b2f | 0.16 → 0.448 | 1932/5254, 1949/5359 | 5/1, 5/1 | 4/8 |
| 1440x900-light-low | close | night | 2.01 / 26.8 | 3.99 / 45.4 | 1.78 / 23.2 | 3.27 / 39.9 | 2.01 / 26.8 → 3.99 / 45.4 | 1.78 / 23.2 → 3.27 / 39.9 | 27.1 → 45.8 | #653416 → #9a5e31 | 0.16 → 0.512 | 1903/5253, 1952/5360 | 3/1, 5/1 | 4/8 |
| 1440x900-light-low | nook | day | 4.55 / 47.7 | 4.55 / 47.7 | 3.33 / 37.5 | 3.33 / 37.5 | 4.55 / 47.7 → 4.55 / 47.7 | 3.33 / 37.5 → 3.33 / 37.5 | 51.3 → 51.3 | #af6d33 → #af6d33 | 0.16 → 0.16 | 56/178, 56/178 | 2/1, 2/1 | 4/8 |
| 1440x900-light-low | nook | dusk | 2.26 / 30.0 | 3.85 / 44.4 | 1.93 / 25.4 | 3.14 / 38.7 | 2.26 / 30.0 → 3.85 / 44.4 | 1.93 / 25.4 → 3.14 / 38.7 | 30.5 → 44.9 | #723a19 → #9b5b2f | 0.16 → 0.448 | 52/163, 55/176 | 2/1, 2/1 | 4/8 |
| 1440x900-light-low | nook | night | 2.01 / 26.8 | 3.99 / 45.4 | 1.78 / 23.2 | 3.27 / 39.9 | 2.01 / 26.8 → 3.99 / 45.4 | 1.78 / 23.2 → 3.27 / 39.9 | 27.1 → 45.8 | #653416 → #9a5e31 | 0.16 → 0.512 | 47/163, 55/177 | 2/1, 2/1 | 4/8 |

Separation as a share of the same build's DAY value (close view, half ring; eyes CR / nose CR):

| config | hour | BASE eyes % of day | TRIAL eyes % of day | BASE nose % of day | TRIAL nose % of day |
|---|---|---|---|---|---|
| 1440x900-light-high | dusk | 49% | 84% | 58% | 94% |
| 1440x900-light-high | night | 44% | 87% | 54% | 98% |
| 1440x900-light-low | dusk | 50% | 85% | 58% | 95% |
| 1440x900-light-low | night | 44% | 88% | 54% | 99% |

Day pixel diff, BASE vs TRIAL, drawing buffer (gl.readPixels, RGBA, every pixel and channel), loop stopped, reducedMotion still frame:

| config | view | buffer | differing pixels | max channel diff | diff bbox (x0,y0,x1,y1) | inside Chai silhouette box | Chai box (BASE) | FNV BASE | FNV TRIAL |
|---|---|---|---|---|---|---|---|---|---|
| 1440x900-light-high | close | 1992×1828 | 0 | 0 | – | 0 | 580,396,1398,1827 | da8bfc7a | da8bfc7a |
| 1440x900-light-low | close | 1245×1142 | 0 | 0 | – | 0 | 371,246,874,1013 | 9e78bf54 | 9e78bf54 |
| 1440x900-light-low | nook | 1245×1142 | 0 | 0 | – | 0 | 404,576,514,730 | 3d800a6d | 3d800a6d |
