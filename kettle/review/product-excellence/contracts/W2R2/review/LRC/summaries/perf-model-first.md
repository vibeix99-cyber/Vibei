vp 390x844@3, rounds 3, frames/round 60, warm-up 10

### Per run

| round | variant | chai kind | root.userData.model | .glb requests (aborted) | frame median ms | mean | p90 | min | max | draw calls | triangles | geometries | textures | programs | JS heap MB | ready ms | final ms | long tasks (n / max ms) | load 1m/5m/15m | errors |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | model | model | True | 1 (0) | 96 | 96 | 107 | 83 | 119 | 108 | 74910 | 111 | 10 | 23 | 11.25 | 4126 | 4145 | 4 / 631 | 4.62 7.69 7.18 | [] |
| 1 | procedural | procedural | False | 2 (2) | 94 | 96.12 | 111 | 84 | 118 | 111 | 76752 | 114 | 8 | 19 | 10.91 | 2570 | 2590 | 3 / 140 | 4.54 7.47 7.12 | [] |
| 2 | model | model | True | 1 (0) | 88 | 91.22 | 104 | 82 | 111 | 108 | 74910 | 111 | 10 | 23 | 11.19 | 2642 | 2672 | 3 / 154 | 4.57 7.33 7.08 | [] |
| 2 | procedural | procedural | False | 2 (2) | 97 | 98.38 | 113 | 85 | 121 | 111 | 76752 | 114 | 8 | 19 | 10.89 | 2734 | 2752 | 3 / 180 | 4.32 7.14 7.02 | [] |
| 3 | model | model | True | 1 (0) | 94 | 93.97 | 105 | 84 | 113 | 108 | 74910 | 111 | 10 | 23 | 11.16 | 2697 | 2718 | 3 / 176 | 4.68 7.08 7.00 | [] |
| 3 | procedural | procedural | False | 2 (2) | 94 | 96.3 | 113 | 83 | 124 | 111 | 76752 | 114 | 8 | 19 | 10.88 | 2584 | 2599 | 2 / 135 | 4.55 6.93 6.95 | [] |

### Per variant (medians over rounds)

| variant | runs | frame median ms: per-run medians | median of medians | median of means | median p90 | draw calls | triangles | geometries | textures | programs | JS heap MB (per run) | median heap |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| model | 3 | [96, 88, 94] | 94.00 | 93.97 | 105.00 | [108] | [74910] | [111] | [10] | [23] | [11.25, 11.19, 11.16] | 11.19 |
| procedural | 3 | [94, 97, 94] | 94.00 | 96.30 | 113.00 | [111] | [76752] | [114] | [8] | [19] | [10.91, 10.89, 10.88] | 10.89 |
