vp 390x844@3, rounds 3, frames/round 60, warm-up 10

### Per run

| round | variant | chai kind | root.userData.model | .glb requests (aborted) | frame median ms | mean | p90 | min | max | draw calls | triangles | geometries | textures | programs | JS heap MB | ready ms | final ms | long tasks (n / max ms) | load 1m/5m/15m | errors |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | procedural | procedural | False | 2 (2) | 101 | 102.03 | 118 | 86 | 131 | 111 | 76752 | 114 | 8 | 19 | 10.93 | 4021 | 4041 | 3 / 693 | 3.78 6.49 6.80 | [] |
| 1 | model | model | True | 1 (0) | 97 | 99.07 | 114 | 85 | 121 | 108 | 74910 | 111 | 10 | 23 | 11.2 | 3210 | 3231 | 4 / 293 | 3.91 6.39 6.76 | [] |
| 2 | procedural | procedural | False | 2 (2) | 101 | 99.88 | 111 | 84 | 129 | 111 | 76752 | 114 | 8 | 19 | 10.9 | 2571 | 2589 | 3 / 164 | 3.83 6.20 6.69 | [] |
| 2 | model | model | True | 1 (0) | 95 | 97.67 | 113 | 84 | 134 | 108 | 74910 | 111 | 10 | 23 | 11.23 | 3066 | 3082 | 3 / 156 | 4.01 6.13 6.66 | [] |
| 3 | procedural | procedural | False | 2 (2) | 94 | 97.28 | 114 | 85 | 123 | 111 | 76752 | 114 | 8 | 19 | 10.92 | 2634 | 2653 | 2 / 135 | 3.96 6.01 6.61 | [] |
| 3 | model | model | True | 1 (0) | 94 | 94.92 | 106 | 82 | 121 | 108 | 74910 | 111 | 10 | 23 | 11.24 | 2955 | 2975 | 3 / 215 | 4.17 5.95 6.58 | [] |

### Per variant (medians over rounds)

| variant | runs | frame median ms: per-run medians | median of medians | median of means | median p90 | draw calls | triangles | geometries | textures | programs | JS heap MB (per run) | median heap |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| model | 3 | [97, 95, 94] | 95.00 | 97.67 | 113.00 | [108] | [74910] | [111] | [10] | [23] | [11.2, 11.23, 11.24] | 11.23 |
| procedural | 3 | [101, 101, 94] | 101.00 | 99.88 | 114.00 | [111] | [76752] | [114] | [8] | [19] | [10.93, 10.9, 10.92] | 10.92 |
