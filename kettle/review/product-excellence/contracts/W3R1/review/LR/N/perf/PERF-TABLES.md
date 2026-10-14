#### perf-low-390x844-night-baseFirst.json: vp 390x844@3, hour night, rounds 3, frames/round 60, warm-up 10, 2026-10-14T12:05:41.256Z

| round | variant (order in round) | tier / chai | fur fill read | frame median ms | mean | p90 | min | max | draw calls | triangles | geometries | textures | programs | JS heap MB | canvas | ready ms | long tasks (n / max ms) | load 1m/5m/15m | errors |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | BASE `4d36939` (1st) | low / model (model) | 0.16 | 135 | 139.45 | 177 | 104 | 218 | 110 | 75007 | 113 | 10 | 23 | 11.17 | 442×395 | 9691 | 5 / 2817 | 14.42 15.22 14.80 | [] |
| 1 | TRIAL `46f33e2` (2nd) | low / model (model) | 0.512 | 100 | 109.02 | 156 | 85 | 189 | 110 | 75007 | 113 | 10 | 23 | 11.25 | 442×395 | 10840 | 4 / 1137 | 13.49 14.94 14.72 | [] |
| 2 | BASE `4d36939` (1st) | low / model (model) | 0.16 | 164 | 162.27 | 220 | 99 | 251 | 110 | 75007 | 113 | 10 | 23 | 11.24 | 442×395 | 8040 | 6 / 783 | 12.36 14.53 14.60 | [] |
| 2 | TRIAL `46f33e2` (2nd) | low / model (model) | 0.512 | 186 | 187.17 | 216 | 139 | 251 | 110 | 75007 | 113 | 10 | 23 | 11.09 | 442×395 | 4385 | 4 / 483 | 11.34 14.11 14.46 | [] |
| 3 | BASE `4d36939` (1st) | low / model (model) | 0.16 | 107 | 108.75 | 125 | 90 | 174 | 110 | 75007 | 113 | 10 | 23 | 11.23 | 442×395 | 9558 | 5 / 382 | 10.10 13.57 14.27 | [] |
| 3 | TRIAL `46f33e2` (2nd) | low / model (model) | 0.512 | 174 | 172.42 | 205 | 120 | 253 | 110 | 75007 | 113 | 10 | 23 | 11.26 | 442×395 | 5778 | 6 / 712 | 10.17 13.26 14.14 | [] |

| variant | runs | per-run medians (ms) | median of medians | median of means | median p90 | calls | triangles | geometries | textures | programs | heap MB per run |
|---|---|---|---|---|---|---|---|---|---|---|---|
| BASE | 3 | 135, 164, 107 | 135 | 139.45 | 177 | 110 | 75007 | 113 | 10 | 23 | 11.17, 11.24, 11.23 |
| TRIAL | 3 | 100, 186, 174 | 174 | 172.42 | 205 | 110 | 75007 | 113 | 10 | 23 | 11.25, 11.09, 11.26 |

#### perf-low-390x844-night-trialFirst.json: vp 390x844@3, hour night, rounds 3, frames/round 60, warm-up 10, 2026-10-14T12:53:28.796Z

| round | variant (order in round) | tier / chai | fur fill read | frame median ms | mean | p90 | min | max | draw calls | triangles | geometries | textures | programs | JS heap MB | canvas | ready ms | long tasks (n / max ms) | load 1m/5m/15m | errors |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | TRIAL `46f33e2` (1st) | low / model (model) | 0.512 | 287 | 276.07 | 353 | 177 | 388 | 110 | 75007 | 113 | 10 | 23 | 11.22 | 442×395 | 10244 | 8 / 2240 | 16.91 13.30 12.73 | [] |
| 1 | BASE `4d36939` (2nd) | low / model (model) | 0.16 | 307 | 312.4 | 458 | 170 | 529 | 110 | 75007 | 113 | 10 | 23 | 11.25 | 442×395 | 7898 | 6 / 498 | 17.65 14.07 13.02 | [] |
| 2 | TRIAL `46f33e2` (1st) | low / model (model) | 0.512 | 351 | 351.23 | 486 | 214 | 547 | 110 | 75007 | 113 | 10 | 23 | 11.21 | 442×395 | 7754 | 5 / 1570 | 16.78 14.45 13.21 | [] |
| 2 | BASE `4d36939` (2nd) | low / model (model) | 0.16 | 286 | 302.08 | 441 | 171 | 660 | 110 | 75007 | 113 | 10 | 23 | 11.24 | 442×395 | 7266 | 6 / 1478 | 16.73 14.75 13.37 | [] |
| 3 | TRIAL `46f33e2` (1st) | low / model (model) | 0.512 | 285 | 293.03 | 420 | 178 | 546 | 110 | 75007 | 113 | 10 | 23 | 11.22 | 442×395 | 5150 | 4 / 559 | 17.95 15.36 13.65 | [] |
| 3 | BASE `4d36939` (2nd) | low / model (model) | 0.16 | 277 | 288.62 | 393 | 184 | 477 | 110 | 75007 | 113 | 10 | 23 | 11.22 | 442×395 | 4286 | 3 / 613 | 18.24 15.77 13.86 | [] |

| variant | runs | per-run medians (ms) | median of medians | median of means | median p90 | calls | triangles | geometries | textures | programs | heap MB per run |
|---|---|---|---|---|---|---|---|---|---|---|---|
| BASE | 3 | 307, 286, 277 | 286 | 302.08 | 441 | 110 | 75007 | 113 | 10 | 23 | 11.25, 11.24, 11.22 |
| TRIAL | 3 | 287, 351, 285 | 287 | 293.03 | 420 | 110 | 75007 | 113 | 10 | 23 | 11.22, 11.21, 11.22 |

#### Pooled over both orders (all rounds)

| variant | position | n | per-run medians (ms) | median of medians |
|---|---|---|---|---|
| BASE | first in round | 3 | 135, 164, 107 | 135 |
| BASE | second in round | 3 | 307, 286, 277 | 286 |
| TRIAL | first in round | 3 | 287, 351, 285 | 287 |
| TRIAL | second in round | 3 | 100, 186, 174 | 174 |
