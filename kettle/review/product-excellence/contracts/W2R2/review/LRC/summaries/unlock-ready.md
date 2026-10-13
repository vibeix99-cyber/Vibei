### 1440x900-light

| run | side | ready after finish() ms | shot at ms | engine in unlock section | chai kind (field) | root.userData.model | .glb requests | card host ready | canvas rect (css px) | scrollY | page errors |
|---|---|---|---|---|---|---|---|---|---|---|---|
| c1 | control | 71196 | 91410 | True | no field (control predates the model) | False | 0 | true | [942, 145, 426, 239] | 0 | 0 |
| c2 | control | 47884 | 67634 | True | no field (control predates the model) | False | 0 | true | [942, 145, 426, 239] | 0 | 0 |
| t1 | trial | 63604 | 79319 | True | procedural | False | 1 | true | [942, 145, 426, 239] | 0 | 0 |
| t2 | trial | 41865 | 61508 | True | procedural | False | 1 | true | [942, 145, 426, 239] | 0 | 0 |

Card-canvas crop, pixel difference between two runs (each crop at that run's own canvas rect, same size):

| pair | kind of pair | % px diff > 16 | % px diff > 0 | max channel diff |
|---|---|---|---|---|
| c1 vs c2 | control vs control (baseline) | 2.326 | 90.714 | 131 |
| c1 vs t1 | control vs trial | 2.212 | 90.435 | 122 |
| c1 vs t2 | control vs trial | 3.775 | 92.953 | 169 |
| c2 vs t1 | control vs trial | 0.132 | 29.347 | 41 |
| c2 vs t2 | control vs trial | 2.577 | 89.374 | 148 |
| t1 vs t2 | trial vs trial | 2.651 | 89.760 | 153 |

### 390x844-light

| run | side | ready after finish() ms | shot at ms | engine in unlock section | chai kind (field) | root.userData.model | .glb requests | card host ready | canvas rect (css px) | scrollY | page errors |
|---|---|---|---|---|---|---|---|---|---|---|---|
| c1 | control | 20366 | 30094 | True | no field (control predates the model) | False | 0 | true | [30, 296, 152, 114] | 0 | 0 |
| c2 | control | 21721 | 31878 | True | no field (control predates the model) | False | 0 | true | [30, 296, 152, 114] | 0 | 0 |
| t1 | trial | 19743 | 30350 | True | procedural | False | 1 | true | [30, 296, 152, 114] | 0 | 0 |
| t2 | trial | 19974 | 28610 | True | procedural | False | 1 | true | [30, 296, 152, 114] | 0 | 0 |

Card-canvas crop, pixel difference between two runs (each crop at that run's own canvas rect, same size):

| pair | kind of pair | % px diff > 16 | % px diff > 0 | max channel diff |
|---|---|---|---|---|
| c1 vs c2 | control vs control (baseline) | 0.430 | 55.266 | 60 |
| c1 vs t1 | control vs trial | 0.107 | 17.886 | 43 |
| c1 vs t2 | control vs trial | 1.326 | 75.642 | 64 |
| c2 vs t1 | control vs trial | 0.290 | 48.365 | 53 |
| c2 vs t2 | control vs trial | 1.806 | 81.094 | 79 |
| t1 vs t2 | trial vs trial | 1.434 | 77.130 | 79 |

