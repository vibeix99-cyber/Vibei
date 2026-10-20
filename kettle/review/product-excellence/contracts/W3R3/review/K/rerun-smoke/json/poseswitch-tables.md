
#### 390x844 dark dpr1 full

| step | pose | side | img box x,y,w,h | ink x0,y0,x1,y1 (decoded alpha through the box) | ink w x h | ink cx | baseline y | screenshot-diff ink agrees (<=1 px) |
|---|---|---|---|---|---|---|---|---|
| 1 focus running | reading | before | [236.09, 200.41, 112.8, 176.63] | [237.91, 201.86, 347.08, 375.58] | 109.17 x 173.72 | 292.49 | 375.58 | yes |
| 1 focus running | reading | after | [236.09, 194.56, 112.8, 176.62] | [237.83, 196.01, 346.86, 369.74] | 109.03 x 173.72 | 292.35 | 369.74 | yes |
| 2 whistle | cheering | before | [234.84, 218.5, 115.28, 152.37] | [236.32, 220.28, 348.65, 369.45] | 112.32 x 149.17 | 292.48 | 369.45 | NO: [263.0, 232.0, 346.0, 367.0] |
| 2 whistle | cheering | after | [235.41, 217.34, 114.15, 153.86] | [236.87, 219.06, 348.1, 369.77] | 111.23 x 150.7 | 292.48 | 369.77 | NO: [259.0, 232.0, 347.0, 367.0] |
| 3 summary | cheering | before | [235.91, 215.97, 113.16, 155.23] | [237.36, 217.78, 347.61, 369.75] | 110.25 x 151.97 | 292.48 | 369.75 | yes |
| 3 summary | cheering | after | [235.91, 215.97, 113.16, 155.23] | [237.36, 217.71, 347.61, 369.75] | 110.25 x 152.04 | 292.48 | 369.75 | yes |
| 4 tea break | sipping | before | [237.72, 193.11, 109.53, 178.08] | [239.17, 194.92, 345.8, 369.74] | 106.63 x 174.81 | 292.48 | 369.74 | yes |
| 4 tea break | sipping | after | [237.72, 193.11, 109.53, 178.08] | [239.17, 194.85, 345.51, 369.74] | 106.34 x 174.89 | 292.34 | 369.74 | yes |
| 5 next brew | reading | before | [236.09, 194.56, 112.8, 176.62] | [237.91, 196.01, 347.08, 369.74] | 109.17 x 173.72 | 292.49 | 369.74 | yes |
| 5 next brew | reading | after | [236.09, 194.56, 112.8, 176.62] | [237.83, 196.01, 346.86, 369.74] | 109.03 x 173.72 | 292.35 | 369.74 | yes |

Step-to-step deltas (CSS px; ink = decoded alpha through the box; `box` = the img element):

| transition | side | d box w | d box h | d box bottom | d ink w | d ink h | d ink cx | d baseline |
|---|---|---|---|---|---|---|---|---|
| 1>2 running>whistle | before | 2.48 | -24.26 | -6.16 | 3.15 | -24.55 | -0.01 | -6.13 |
| 1>2 running>whistle | after | 1.35 | -22.76 | 0.01 | 2.2 | -23.02 | 0.13 | 0.03 |
| 2>3 whistle>summary | before | -2.12 | 2.86 | 0.33 | -2.07 | 2.8 | 0.0 | 0.3 |
| 2>3 whistle>summary | after | -0.99 | 1.37 | 0.0 | -0.98 | 1.34 | 0.0 | -0.02 |
| 3>4 summary>tea break | before | -3.63 | 22.85 | -0.01 | -3.62 | 22.84 | 0.0 | -0.01 |
| 3>4 summary>tea break | after | -3.63 | 22.85 | -0.01 | -3.91 | 22.85 | -0.14 | -0.01 |
| 4>5 tea break>next brew | before | 3.27 | -1.46 | 0.0 | 2.54 | -1.09 | 0.01 | 0.0 |
| 4>5 tea break>next brew | after | 3.27 | -1.46 | 0.0 | 2.69 | -1.17 | 0.01 | 0.0 |

rAF trace before: 2315 frames; frames with !=1 figure 6; max single-frame delta {'dw': -3.62, 'dh': 22.84, 'dcx': -0.01, 'dbase': -5.83} at {'dh': (22903, 'sipping', '#/focus'), 'dbase': (7495, 'cheering', '#/focus'), 'dw': (22903, 'sipping', '#/focus'), 'dcx': (7495, 'cheering', '#/focus')}

rAF trace after: 1748 frames; frames with !=1 figure 4; max single-frame delta {'dw': -3.65, 'dh': 22.84, 'dcx': -0.01, 'dbase': 9.85} at {'dbase': (5776, 'cheering', '#/focus'), 'dh': (17160, 'sipping', '#/focus'), 'dw': (5752, 'cheering', '#/focus'), 'dcx': (4872, 'cheering', '#/focus')}