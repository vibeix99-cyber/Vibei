# Footprint: Rive Chai ink vs the painted image ink, same page, same box (CSS px, Rive minus image; medians over ground frames)

390x844, DPR 2, light. Image ink: alpha > 8 of the WebP natural pixels mapped to the img rect. Rive ink: alpha > 8 of the canvas pixels mapped to the canvas rect, sampled 24 (Stage) / 16 (Kit) frames 160 ms apart; ground frames = feet at their lowest (cheering hops). Belly = the ink row 30 %% of the ink height above the feet.

| place | pose | box w x h (CSS px) | baseline | ink top (median; range) | ink height | belly centre | belly width (img width) | clipped by an ancestor | canvas pointer-events |
|---|---|---|---|---|---|---|---|---|---|
| stage focus (reading) | reading | 112.8 x 176.6 | +0.15 | +0.68 (-0.82..+1.18) | -0.53 | -0.34 | -1.13 (102.9) | none | none |
| stage summary (cheering) | cheering | 113.2 x 155.2 | -0.12 | +0.14 (-2.36..+3.13) | +0.24 | -0.65 | +8.97 (83.3) | none | none |
| stage break (sipping) | sipping | 109.5 x 178.1 | +0.14 | -0.46 (-0.96..+1.04) | +0.60 | -0.21 | +0.97 (100.8) | none | none |
| kit focus@72 | reading | 44.8 x 70.1 | +0.10 | +0.00 (-0.50..+0.51) | +0.10 | -0.19 | -0.63 (40.9) | none | none |
| kit focus@76 | reading | 47.3 x 74.0 | -0.07 | -0.13 (-0.13..+0.38) | +0.06 | -0.18 | -0.53 (43.1) | none | none |
| kit focus@84 | reading | 52.2 x 81.8 | +0.20 | +0.08 (-0.42..+0.58) | +0.11 | -0.18 | +0.04 (47.7) | none | none |
| kit focus@88 | reading | 54.7 x 85.7 | +0.03 | -0.05 (-0.55..+0.45) | +0.08 | -0.18 | -0.49 (50.0) | none | none |
| kit focus@108 | reading | 67.2 x 105.2 | -0.11 | +0.25 (-0.25..+0.75) | -0.36 | -0.16 | -0.88 (61.3) | none | none |
| kit focus@112 | reading | 69.7 x 109.1 | +0.23 | +0.12 (-0.38..+0.62) | +0.11 | -0.41 | -0.28 (63.6) | none | none |
| kit focus@120 | reading | 74.6 x 116.9 | -0.02 | +0.33 (-0.67..+0.83) | +0.15 | -0.15 | -0.84 (68.1) | none | none |
| kit focus@148 | reading | 92.0 x 144.1 | +0.02 | +0.36 (-0.64..+0.87) | -0.35 | -0.38 | -1.16 (84.0) | none | none |
| kit focus@152 | reading | 94.5 x 148.0 | -0.07 | +0.70 (-0.30..+1.20) | -0.27 | -0.12 | -0.55 (86.3) | none | none |
| kit focus@168 | reading | 104.5 x 163.6 | -0.11 | +0.16 (-0.34..+1.16) | -0.27 | -0.36 | -1.55 (95.3) | none | none |
| kit focus@200 | reading | 124.4 x 194.8 | -0.16 | +1.04 (-0.46..+1.54) | -0.69 | -0.35 | -0.76 (113.5) | none | none |
| kit sip@72 | sipping | 43.5 x 70.7 | +0.08 | -0.16 (-0.66..+0.34) | +0.25 | -0.13 | +0.20 (40.0) | none | none |
| kit sip@76 | sipping | 45.9 x 74.6 | -0.07 | -0.26 (-0.77..+0.24) | +0.20 | -0.12 | +0.35 (42.2) | none | none |
| kit sip@84 | sipping | 50.7 x 82.5 | +0.20 | -0.02 (-0.52..+0.48) | +0.21 | -0.11 | +1.01 (46.7) | none | none |
| kit sip@88 | sipping | 53.1 x 86.4 | +0.03 | -0.13 (-0.63..+0.37) | +0.16 | -0.11 | +0.53 (48.9) | none | none |
| kit sip@108 | sipping | 65.2 x 106.0 | -0.11 | +0.26 (-0.74..+0.26) | +0.12 | -0.07 | +0.37 (60.0) | none | none |
| kit sip@112 | sipping | 67.6 x 110.0 | +0.22 | +0.15 (-0.35..+0.15) | +0.07 | -0.32 | +1.02 (62.3) | none | none |
| kit sip@120 | sipping | 72.5 x 117.8 | -0.02 | -0.11 (-0.61..+0.39) | +0.09 | -0.05 | +0.56 (66.7) | none | none |
| kit sip@148 | sipping | 89.4 x 145.3 | +0.02 | +0.08 (-0.93..+0.58) | -0.06 | -0.26 | +0.56 (82.3) | none | none |
| kit sip@152 | sipping | 91.8 x 149.2 | -0.05 | +0.43 (-0.57..+0.93) | -0.49 | +0.00 | +1.20 (84.5) | none | none |
| kit sip@168 | sipping | 101.5 x 165.0 | -0.13 | -0.05 (-1.05..+0.45) | -0.08 | -0.22 | +0.40 (93.4) | none | none |
| kit sip@200 | sipping | 120.8 x 196.4 | -0.16 | +0.49 (-0.51..+0.99) | -0.65 | -0.18 | +1.05 (111.2) | none | none |
| kit cheer@72 | cheering | 44.9 x 61.6 | -0.09 | -1.03 (-3.52..+1.46) | +0.94 | -0.31 | +3.26 (33.1) | none | none |
| kit cheer@76 | cheering | 47.4 x 65.0 | -0.25 | -0.23 (-1.72..+0.76) | +0.48 | -0.31 | +4.05 (34.9) | none | none |
| kit cheer@84 | cheering | 52.4 x 71.9 | +0.34 | -0.59 (-1.59..+0.92) | +0.93 | -0.31 | +4.14 (38.6) | none | none |
| kit cheer@88 | cheering | 54.9 x 75.3 | +0.18 | +0.22 (-2.29..+0.72) | +0.97 | -0.32 | +4.30 (40.4) | none | none |
| kit cheer@108 | cheering | 67.4 x 92.4 | -0.12 | -0.29 (-2.28..+2.20) | +0.66 | -0.34 | +5.64 (49.6) | none | none |
| kit cheer@112 | cheering | 69.9 x 95.9 | +0.22 | -0.99 (-2.48..+1.01) | +1.20 | -0.33 | +5.93 (51.4) | none | none |
| kit cheer@120 | cheering | 74.9 x 102.7 | +0.31 | +0.16 (-1.84..+1.66) | +0.65 | -0.35 | +6.52 (55.1) | none | none |
| kit cheer@148 | cheering | 92.3 x 126.7 | +0.07 | -1.22 (-2.72..+1.79) | +1.29 | -0.36 | +6.32 (68.0) | none | none |
| kit cheer@152 | cheering | 94.8 x 130.1 | -0.09 | -0.41 (-2.42..+1.59) | +0.32 | -0.37 | +7.11 (69.8) | none | none |
| kit cheer@168 | cheering | 104.8 x 143.8 | +0.27 | -0.22 (-2.71..+1.78) | +0.48 | -0.38 | +8.65 (77.1) | none | none |
| kit cheer@200 | cheering | 124.8 x 171.2 | -0.10 | +0.23 (-2.77..+2.72) | +0.67 | -0.66 | +10.37 (91.8) | none | none |
