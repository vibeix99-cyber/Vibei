
#### 1440x900 dark dpr1 full

| step | pose | side | img box x,y,w,h | ink x0,y0,x1,y1 (decoded alpha through the box) | ink w x h | ink cx | baseline y | screenshot-diff ink agrees (<=1 px) |
|---|---|---|---|---|---|---|---|---|
| 1 focus running | reading | before | [514.64, 512.77, 185.09, 289.86] | [517.62, 515.15, 696.76, 800.24] | 179.14 x 285.1 | 607.19 | 800.24 | NO: [518.0, 712.0, 697.0, 800.0] |
| 1 focus running | reading | after | [514.64, 512.77, 185.09, 289.86] | [516.07, 515.15, 697.83, 800.25] | 181.76 x 285.1 | 606.95 | 800.25 | NO: [516.0, 509.0, 698.0, 791.0] |
| 2 whistle | cheering | before | [512.6, 542.05, 189.17, 250.03] | [515.03, 544.97, 699.35, 789.74] | 184.32 x 244.78 | 607.19 | 789.74 | NO: [545.0, 541.0, 698.0, 790.0] |
| 2 whistle | cheering | after | [514.34, 537.89, 185.69, 254.73] | [520.06, 540.75, 694.32, 790.24] | 174.26 x 249.5 | 607.19 | 790.24 | NO: [546.0, 545.0, 694.0, 787.0] |
| 3 summary | cheering | before | [514.34, 537.89, 185.69, 254.73] | [516.72, 540.87, 697.65, 790.24] | 180.93 x 249.38 | 607.19 | 790.24 | yes |
| 3 summary | cheering | after | [514.34, 537.89, 185.69, 254.73] | [520.06, 540.75, 694.32, 790.24] | 174.26 x 249.5 | 607.19 | 790.24 | yes |
| 4 tea break | sipping | before | [517.31, 500.39, 179.75, 292.23] | [519.69, 503.37, 694.68, 790.24] | 174.99 x 286.88 | 607.19 | 790.24 | yes |
| 4 tea break | sipping | after | [517.31, 500.39, 179.75, 292.23] | [518.74, 503.72, 695.64, 790.25] | 176.9 x 286.52 | 607.19 | 790.25 | yes |
| 5 next brew | reading | before | [514.64, 502.77, 185.09, 289.86] | [517.62, 505.15, 696.76, 790.24] | 179.14 x 285.1 | 607.19 | 790.24 | yes |
| 5 next brew | reading | after | [514.64, 502.77, 185.09, 289.86] | [516.07, 505.15, 697.83, 790.25] | 181.76 x 285.1 | 606.95 | 790.25 | yes |

Step-to-step deltas (CSS px; ink = decoded alpha through the box; `box` = the img element):

| transition | side | d box w | d box h | d box bottom | d ink w | d ink h | d ink cx | d baseline |
|---|---|---|---|---|---|---|---|---|
| 1>2 running>whistle | before | 4.08 | -39.83 | -10.54 | 5.18 | -40.32 | 0.0 | -10.5 |
| 1>2 running>whistle | after | 0.6 | -35.13 | -10.0 | -7.5 | -35.6 | 0.24 | -10.01 |
| 2>3 whistle>summary | before | -3.48 | 4.7 | 0.54 | -3.39 | 4.6 | 0.0 | 0.5 |
| 2>3 whistle>summary | after | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| 3>4 summary>tea break | before | -5.94 | 37.5 | 0.0 | -5.94 | 37.5 | 0.0 | 0.0 |
| 3>4 summary>tea break | after | -5.94 | 37.5 | 0.0 | 2.64 | 37.02 | 0.0 | 0.01 |
| 4>5 tea break>next brew | before | 5.34 | -2.37 | 0.0 | 4.15 | -1.78 | 0.0 | 0.0 |
| 4>5 tea break>next brew | after | 5.34 | -2.37 | 0.0 | 4.86 | -1.42 | -0.24 | 0.0 |

rAF trace before: 2732 frames; frames with !=1 figure 11; max single-frame delta {'dw': 6.06, 'dh': 37.5, 'dcx': 0.0, 'dbase': -10.0} at {'dw': (7340, 'cheering', '#/focus'), 'dh': (24988, 'sipping', '#/focus'), 'dbase': (7212, 'cheering', '#/focus'), 'dcx': (7692, 'cheering', '#/focus')}

rAF trace after: 3866 frames; frames with !=1 figure 10; max single-frame delta {'dw': -5.94, 'dh': 37.5, 'dcx': 0, 'dbase': -3.4} at {'dbase': (395, 'reading', '#/focus'), 'dh': (34027, 'sipping', '#/focus'), 'dw': (34027, 'sipping', '#/focus')}

#### 1440x900 dark dpr1 reduce

| step | pose | side | img box x,y,w,h | ink x0,y0,x1,y1 (decoded alpha through the box) | ink w x h | ink cx | baseline y | screenshot-diff ink agrees (<=1 px) |
|---|---|---|---|---|---|---|---|---|
| 1 focus running | reading | before | [514.64, 502.77, 185.09, 289.86] | [517.62, 505.15, 696.76, 790.24] | 179.14 x 285.1 | 607.19 | 790.24 | yes |
| 1 focus running | reading | after | [514.64, 502.77, 185.09, 289.86] | [516.07, 505.15, 697.83, 790.25] | 181.76 x 285.1 | 606.95 | 790.25 | NO: [516.0, 509.0, 698.0, 791.0] |
| 2 whistle | cheering | before | [514.34, 537.89, 185.69, 254.73] | [516.72, 540.87, 697.65, 790.24] | 180.93 x 249.38 | 607.19 | 790.24 | yes |
| 2 whistle | cheering | after | [514.34, 537.89, 185.69, 254.73] | [520.06, 540.75, 694.32, 790.24] | 174.26 x 249.5 | 607.19 | 790.24 | yes |
| 3 summary | cheering | before | [514.34, 537.89, 185.69, 254.73] | [516.72, 540.87, 697.65, 790.24] | 180.93 x 249.38 | 607.19 | 790.24 | yes |
| 3 summary | cheering | after | [514.34, 537.89, 185.69, 254.73] | [520.06, 540.75, 694.32, 790.24] | 174.26 x 249.5 | 607.19 | 790.24 | yes |
| 4 tea break | sipping | before | [517.31, 500.39, 179.75, 292.23] | [519.69, 503.37, 694.68, 790.24] | 174.99 x 286.88 | 607.19 | 790.24 | yes |
| 4 tea break | sipping | after | [517.31, 500.39, 179.75, 292.23] | [518.74, 503.72, 695.64, 790.25] | 176.9 x 286.52 | 607.19 | 790.25 | yes |
| 5 next brew | reading | before | [514.64, 502.77, 185.09, 289.86] | [517.62, 505.15, 696.76, 790.24] | 179.14 x 285.1 | 607.19 | 790.24 | yes |
| 5 next brew | reading | after | [514.64, 502.77, 185.09, 289.86] | [516.07, 505.15, 697.83, 790.25] | 181.76 x 285.1 | 606.95 | 790.25 | NO: [520.0, 509.0, 694.0, 787.0] |

Step-to-step deltas (CSS px; ink = decoded alpha through the box; `box` = the img element):

| transition | side | d box w | d box h | d box bottom | d ink w | d ink h | d ink cx | d baseline |
|---|---|---|---|---|---|---|---|---|
| 1>2 running>whistle | before | 0.6 | -35.13 | 0.0 | 1.79 | -35.72 | 0.0 | 0.0 |
| 1>2 running>whistle | after | 0.6 | -35.13 | 0.0 | -7.5 | -35.6 | 0.24 | -0.01 |
| 2>3 whistle>summary | before | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| 2>3 whistle>summary | after | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| 3>4 summary>tea break | before | -5.94 | 37.5 | 0.0 | -5.94 | 37.5 | 0.0 | 0.0 |
| 3>4 summary>tea break | after | -5.94 | 37.5 | 0.0 | 2.64 | 37.02 | 0.0 | 0.01 |
| 4>5 tea break>next brew | before | 5.34 | -2.37 | 0.0 | 4.15 | -1.78 | 0.0 | 0.0 |
| 4>5 tea break>next brew | after | 5.34 | -2.37 | 0.0 | 4.86 | -1.42 | -0.24 | 0.0 |

rAF trace before: 1758 frames; frames with !=1 figure 2; max single-frame delta {'dw': -5.94, 'dh': 37.5, 'dcx': 0, 'dbase': 0} at {'dw': (17946, 'sipping', '#/focus'), 'dh': (17946, 'sipping', '#/focus')}

rAF trace after: 2055 frames; frames with !=1 figure 3; max single-frame delta {'dw': -5.94, 'dh': 37.5, 'dcx': 0, 'dbase': 0} at {'dw': (21491, 'sipping', '#/focus'), 'dh': (21491, 'sipping', '#/focus')}

#### 1440x900 dark dpr2 full

| step | pose | side | img box x,y,w,h | ink x0,y0,x1,y1 (decoded alpha through the box) | ink w x h | ink cx | baseline y | screenshot-diff ink agrees (<=1 px) |
|---|---|---|---|---|---|---|---|---|
| 1 focus running | reading | before | [514.64, 502.77, 185.09, 289.86] | [517.62, 505.15, 696.76, 790.24] | 179.14 x 285.1 | 607.19 | 790.24 | yes |
| 1 focus running | reading | after | [514.64, 502.77, 185.09, 289.86] | [516.07, 505.15, 697.83, 790.25] | 181.76 x 285.1 | 606.95 | 790.25 | yes |
| 2 whistle | cheering | before | [514.88, 521.63, 184.61, 257.56] | [517.25, 524.64, 697.13, 776.78] | 179.88 x 252.14 | 607.19 | 776.78 | NO: [541.5, 541.0, 697.5, 787.0] |
| 2 whistle | cheering | after | [515.91, 514.62, 182.55, 261.32] | [521.53, 517.55, 692.85, 773.5] | 171.32 x 255.95 | 607.19 | 773.5 | NO: [543.0, 540.5, 694.0, 784.0] |
| 3 summary | cheering | before | [514.34, 537.89, 185.69, 254.73] | [516.72, 540.87, 697.65, 790.24] | 180.93 x 249.38 | 607.19 | 790.24 | yes |
| 3 summary | cheering | after | [514.34, 537.89, 185.69, 254.73] | [520.06, 540.75, 694.32, 790.24] | 174.26 x 249.5 | 607.19 | 790.24 | yes |
| 4 tea break | sipping | before | [517.31, 500.39, 179.75, 292.23] | [519.69, 503.37, 694.68, 790.24] | 174.99 x 286.88 | 607.19 | 790.24 | yes |
| 4 tea break | sipping | after | [517.31, 500.39, 179.75, 292.23] | [518.74, 503.72, 695.64, 790.25] | 176.9 x 286.52 | 607.19 | 790.25 | yes |
| 5 next brew | reading | before | [514.64, 502.77, 185.09, 289.86] | [517.62, 505.15, 696.76, 790.24] | 179.14 x 285.1 | 607.19 | 790.24 | yes |
| 5 next brew | reading | after | [514.64, 502.77, 185.09, 289.86] | [516.07, 505.15, 697.83, 790.25] | 181.76 x 285.1 | 606.95 | 790.25 | yes |

Step-to-step deltas (CSS px; ink = decoded alpha through the box; `box` = the img element):

| transition | side | d box w | d box h | d box bottom | d ink w | d ink h | d ink cx | d baseline |
|---|---|---|---|---|---|---|---|---|
| 1>2 running>whistle | before | -0.48 | -32.3 | -13.43 | 0.74 | -32.96 | 0.0 | -13.46 |
| 1>2 running>whistle | after | -2.54 | -28.54 | -16.68 | -10.44 | -29.15 | 0.24 | -16.75 |
| 2>3 whistle>summary | before | 1.08 | -2.83 | 13.43 | 1.05 | -2.76 | 0.0 | 13.46 |
| 2>3 whistle>summary | after | 3.14 | -6.59 | 16.68 | 2.94 | -6.45 | 0.0 | 16.74 |
| 3>4 summary>tea break | before | -5.94 | 37.5 | 0.0 | -5.94 | 37.5 | 0.0 | 0.0 |
| 3>4 summary>tea break | after | -5.94 | 37.5 | 0.0 | 2.64 | 37.02 | 0.0 | 0.01 |
| 4>5 tea break>next brew | before | 5.34 | -2.37 | 0.0 | 4.15 | -1.78 | 0.0 | 0.0 |
| 4>5 tea break>next brew | after | 5.34 | -2.37 | 0.0 | 4.86 | -1.42 | -0.24 | 0.0 |

rAF trace before: 3489 frames; frames with !=1 figure 4; max single-frame delta {'dw': 6.06, 'dh': 37.5, 'dcx': -0.0, 'dbase': 13.44} at {'dbase': (11679, 'cheering', '#/focus'), 'dh': (32175, 'sipping', '#/focus'), 'dw': (11103, 'cheering', '#/focus'), 'dcx': (11679, 'cheering', '#/focus')}

rAF trace after: 3865 frames; frames with !=1 figure 5; max single-frame delta {'dw': 7.36, 'dh': 37.5, 'dcx': -0.0, 'dbase': 16.69} at {'dh': (35476, 'sipping', '#/focus'), 'dbase': (10735, 'cheering', '#/focus'), 'dw': (10148, 'cheering', '#/focus'), 'dcx': (10687, 'cheering', '#/focus')}

#### 1440x900 light dpr1 full

| step | pose | side | img box x,y,w,h | ink x0,y0,x1,y1 (decoded alpha through the box) | ink w x h | ink cx | baseline y | screenshot-diff ink agrees (<=1 px) |
|---|---|---|---|---|---|---|---|---|
| 1 focus running | reading | before | [514.64, 502.77, 185.09, 289.86] | [517.62, 505.15, 696.76, 790.24] | 179.14 x 285.1 | 607.19 | 790.24 | yes |
| 1 focus running | reading | after | [514.64, 502.77, 185.09, 289.86] | [516.07, 505.15, 697.83, 790.25] | 181.76 x 285.1 | 606.95 | 790.25 | yes |
| 2 whistle | cheering | before | [512.6, 542.05, 189.17, 250.03] | [515.03, 544.97, 699.35, 789.74] | 184.32 x 244.78 | 607.19 | 789.74 | NO: [519.0, 541.0, 698.0, 789.0] |
| 2 whistle | cheering | after | [513.12, 537.84, 188.14, 251.8] | [518.91, 540.67, 695.47, 787.29] | 176.56 x 246.62 | 607.19 | 787.29 | NO: [524.0, 544.0, 694.0, 788.0] |
| 3 summary | cheering | before | [514.34, 537.89, 185.69, 254.73] | [516.72, 540.87, 697.65, 790.24] | 180.93 x 249.38 | 607.19 | 790.24 | yes |
| 3 summary | cheering | after | [514.34, 537.89, 185.69, 254.73] | [520.06, 540.75, 694.32, 790.24] | 174.26 x 249.5 | 607.19 | 790.24 | yes |
| 4 tea break | sipping | before | [517.31, 500.39, 179.75, 292.23] | [519.69, 503.37, 694.68, 790.24] | 174.99 x 286.88 | 607.19 | 790.24 | yes |
| 4 tea break | sipping | after | [517.31, 500.39, 179.75, 292.23] | [518.74, 503.72, 695.64, 790.25] | 176.9 x 286.52 | 607.19 | 790.25 | yes |
| 5 next brew | reading | before | [514.64, 502.77, 185.09, 289.86] | [517.62, 505.15, 696.76, 790.24] | 179.14 x 285.1 | 607.19 | 790.24 | yes |
| 5 next brew | reading | after | [514.64, 502.77, 185.09, 289.86] | [516.07, 505.15, 697.83, 790.25] | 181.76 x 285.1 | 606.95 | 790.25 | yes |

Step-to-step deltas (CSS px; ink = decoded alpha through the box; `box` = the img element):

| transition | side | d box w | d box h | d box bottom | d ink w | d ink h | d ink cx | d baseline |
|---|---|---|---|---|---|---|---|---|
| 1>2 running>whistle | before | 4.08 | -39.83 | -0.54 | 5.18 | -40.32 | 0.0 | -0.5 |
| 1>2 running>whistle | after | 3.05 | -38.06 | -2.98 | -5.2 | -38.48 | 0.24 | -2.96 |
| 2>3 whistle>summary | before | -3.48 | 4.7 | 0.54 | -3.39 | 4.6 | 0.0 | 0.5 |
| 2>3 whistle>summary | after | -2.45 | 2.93 | 2.98 | -2.3 | 2.88 | 0.0 | 2.95 |
| 3>4 summary>tea break | before | -5.94 | 37.5 | 0.0 | -5.94 | 37.5 | 0.0 | 0.0 |
| 3>4 summary>tea break | after | -5.94 | 37.5 | 0.0 | 2.64 | 37.02 | 0.0 | 0.01 |
| 4>5 tea break>next brew | before | 5.34 | -2.37 | 0.0 | 4.15 | -1.78 | 0.0 | 0.0 |
| 4>5 tea break>next brew | after | 5.34 | -2.37 | 0.0 | 4.86 | -1.42 | -0.24 | 0.0 |

rAF trace before: 2962 frames; frames with !=1 figure 7; max single-frame delta {'dw': -5.94, 'dh': 37.5, 'dcx': 0.0, 'dbase': -12.43} at {'dbase': (10300, 'cheering', '#/focus'), 'dh': (29420, 'sipping', '#/focus'), 'dw': (29420, 'sipping', '#/focus'), 'dcx': (10988, 'cheering', '#/focus')}

rAF trace after: 3880 frames; frames with !=1 figure 11; max single-frame delta {'dw': 6.06, 'dh': 37.5, 'dcx': 0.0, 'dbase': -3.61} at {'dbase': (10930, 'cheering', '#/focus'), 'dh': (38530, 'sipping', '#/focus'), 'dw': (10850, 'cheering', '#/focus'), 'dcx': (11330, 'cheering', '#/focus')}

#### 1440x900 light dpr1 reduce

| step | pose | side | img box x,y,w,h | ink x0,y0,x1,y1 (decoded alpha through the box) | ink w x h | ink cx | baseline y | screenshot-diff ink agrees (<=1 px) |
|---|---|---|---|---|---|---|---|---|
| 1 focus running | reading | before | [514.64, 502.77, 185.09, 289.86] | [517.62, 505.15, 696.76, 790.24] | 179.14 x 285.1 | 607.19 | 790.24 | yes |
| 1 focus running | reading | after | [514.64, 502.77, 185.09, 289.86] | [516.07, 505.15, 697.83, 790.25] | 181.76 x 285.1 | 606.95 | 790.25 | NO: [516.0, 507.0, 698.0, 791.0] |
| 2 whistle | cheering | before | [514.34, 537.89, 185.69, 254.73] | [516.72, 540.87, 697.65, 790.24] | 180.93 x 249.38 | 607.19 | 790.24 | yes |
| 2 whistle | cheering | after | [514.34, 537.89, 185.69, 254.73] | [520.06, 540.75, 694.32, 790.24] | 174.26 x 249.5 | 607.19 | 790.24 | yes |
| 3 summary | cheering | before | [514.34, 537.89, 185.69, 254.73] | [516.72, 540.87, 697.65, 790.24] | 180.93 x 249.38 | 607.19 | 790.24 | yes |
| 3 summary | cheering | after | [514.34, 537.89, 185.69, 254.73] | [520.06, 540.75, 694.32, 790.24] | 174.26 x 249.5 | 607.19 | 790.24 | yes |
| 4 tea break | sipping | before | [517.31, 500.39, 179.75, 292.23] | [519.69, 503.37, 694.68, 790.24] | 174.99 x 286.88 | 607.19 | 790.24 | yes |
| 4 tea break | sipping | after | [517.31, 500.39, 179.75, 292.23] | [518.74, 503.72, 695.64, 790.25] | 176.9 x 286.52 | 607.19 | 790.25 | yes |
| 5 next brew | reading | before | [514.64, 502.77, 185.09, 289.86] | [517.62, 505.15, 696.76, 790.24] | 179.14 x 285.1 | 607.19 | 790.24 | yes |
| 5 next brew | reading | after | [514.64, 502.77, 185.09, 289.86] | [516.07, 505.15, 697.83, 790.25] | 181.76 x 285.1 | 606.95 | 790.25 | yes |

Step-to-step deltas (CSS px; ink = decoded alpha through the box; `box` = the img element):

| transition | side | d box w | d box h | d box bottom | d ink w | d ink h | d ink cx | d baseline |
|---|---|---|---|---|---|---|---|---|
| 1>2 running>whistle | before | 0.6 | -35.13 | 0.0 | 1.79 | -35.72 | 0.0 | 0.0 |
| 1>2 running>whistle | after | 0.6 | -35.13 | 0.0 | -7.5 | -35.6 | 0.24 | -0.01 |
| 2>3 whistle>summary | before | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| 2>3 whistle>summary | after | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| 3>4 summary>tea break | before | -5.94 | 37.5 | 0.0 | -5.94 | 37.5 | 0.0 | 0.0 |
| 3>4 summary>tea break | after | -5.94 | 37.5 | 0.0 | 2.64 | 37.02 | 0.0 | 0.01 |
| 4>5 tea break>next brew | before | 5.34 | -2.37 | 0.0 | 4.15 | -1.78 | 0.0 | 0.0 |
| 4>5 tea break>next brew | after | 5.34 | -2.37 | 0.0 | 4.86 | -1.42 | -0.24 | 0.0 |

rAF trace before: 1522 frames; frames with !=1 figure 3; max single-frame delta {'dw': -5.94, 'dh': 37.5, 'dcx': 0, 'dbase': 0} at {'dw': (14874, 'sipping', '#/focus'), 'dh': (14874, 'sipping', '#/focus')}

rAF trace after: 2348 frames; frames with !=1 figure 2; max single-frame delta {'dw': -5.94, 'dh': 37.5, 'dcx': 0, 'dbase': 0} at {'dw': (21818, 'sipping', '#/focus'), 'dh': (21818, 'sipping', '#/focus')}

#### 1440x900 light dpr2 full

| step | pose | side | img box x,y,w,h | ink x0,y0,x1,y1 (decoded alpha through the box) | ink w x h | ink cx | baseline y | screenshot-diff ink agrees (<=1 px) |
|---|---|---|---|---|---|---|---|---|
| 1 focus running | reading | before | [514.64, 502.77, 185.09, 289.86] | [517.62, 505.15, 696.76, 790.24] | 179.14 x 285.1 | 607.19 | 790.24 | NO: [518.5, 506.5, 697.0, 790.0] |
| 1 focus running | reading | after | [514.64, 502.77, 185.09, 289.86] | [516.07, 505.15, 697.83, 790.25] | 181.76 x 285.1 | 606.95 | 790.25 | yes |
| 2 whistle | cheering | before | [514.18, 529.16, 186.02, 255.45] | [516.56, 532.14, 697.81, 782.22] | 181.25 x 250.07 | 607.19 | 782.22 | NO: [516.5, 541.0, 697.5, 790.0] |
| 2 whistle | cheering | after | [512.45, 538.24, 189.48, 248.65] | [518.28, 541.03, 696.1, 784.56] | 177.82 x 243.53 | 607.19 | 784.56 | NO: [519.5, 541.0, 694.0, 790.5] |
| 3 summary | cheering | before | [514.34, 537.89, 185.69, 254.73] | [516.72, 540.87, 697.65, 790.24] | 180.93 x 249.38 | 607.19 | 790.24 | yes |
| 3 summary | cheering | after | [514.34, 537.89, 185.69, 254.73] | [520.06, 540.75, 694.32, 790.24] | 174.26 x 249.5 | 607.19 | 790.24 | yes |
| 4 tea break | sipping | before | [517.31, 500.39, 179.75, 292.23] | [519.69, 503.37, 694.68, 790.24] | 174.99 x 286.88 | 607.19 | 790.24 | yes |
| 4 tea break | sipping | after | [517.31, 500.39, 179.75, 292.23] | [518.74, 503.72, 695.64, 790.25] | 176.9 x 286.52 | 607.19 | 790.25 | yes |
| 5 next brew | reading | before | [514.64, 502.77, 185.09, 289.86] | [517.62, 505.15, 696.76, 790.24] | 179.14 x 285.1 | 607.19 | 790.24 | NO: [518.5, 506.5, 697.0, 790.0] |
| 5 next brew | reading | after | [514.64, 502.77, 185.09, 289.86] | [516.07, 505.15, 697.83, 790.25] | 181.76 x 285.1 | 606.95 | 790.25 | yes |

Step-to-step deltas (CSS px; ink = decoded alpha through the box; `box` = the img element):

| transition | side | d box w | d box h | d box bottom | d ink w | d ink h | d ink cx | d baseline |
|---|---|---|---|---|---|---|---|---|
| 1>2 running>whistle | before | 0.93 | -34.41 | -8.02 | 2.11 | -35.03 | 0.0 | -8.02 |
| 1>2 running>whistle | after | 4.39 | -41.21 | -5.74 | -3.94 | -41.57 | 0.24 | -5.69 |
| 2>3 whistle>summary | before | -0.33 | -0.72 | 8.02 | -0.32 | -0.69 | 0.0 | 8.02 |
| 2>3 whistle>summary | after | -3.79 | 6.08 | 5.74 | -3.56 | 5.97 | 0.0 | 5.68 |
| 3>4 summary>tea break | before | -5.94 | 37.5 | 0.0 | -5.94 | 37.5 | 0.0 | 0.0 |
| 3>4 summary>tea break | after | -5.94 | 37.5 | 0.0 | 2.64 | 37.02 | 0.0 | 0.01 |
| 4>5 tea break>next brew | before | 5.34 | -2.37 | 0.0 | 4.15 | -1.78 | 0.0 | 0.0 |
| 4>5 tea break>next brew | after | 5.34 | -2.37 | 0.0 | 4.86 | -1.42 | -0.24 | 0.0 |

rAF trace before: 4419 frames; frames with !=1 figure 4; max single-frame delta {'dw': -5.94, 'dh': 37.5, 'dcx': -0.0, 'dbase': -12.77} at {'dbase': (11983, 'cheering', '#/focus'), 'dh': (33759, 'sipping', '#/focus'), 'dw': (33759, 'sipping', '#/focus'), 'dcx': (12447, 'cheering', '#/focus')}

rAF trace after: 4934 frames; frames with !=1 figure 22; max single-frame delta {'dw': 7.18, 'dh': 37.5, 'dcx': 0, 'dbase': -2.76} at {'dbase': (608, 'reading', '#/focus'), 'dh': (44352, 'sipping', '#/focus'), 'dw': (17560, 'cheering', '#/focus')}

#### 390x844 dark dpr1 full

| step | pose | side | img box x,y,w,h | ink x0,y0,x1,y1 (decoded alpha through the box) | ink w x h | ink cx | baseline y | screenshot-diff ink agrees (<=1 px) |
|---|---|---|---|---|---|---|---|---|
| 1 focus running | reading | before | [236.09, 200.41, 112.8, 176.63] | [237.91, 201.86, 347.08, 375.58] | 109.17 x 173.72 | 292.49 | 375.58 | yes |
| 1 focus running | reading | after | [236.09, 194.56, 112.8, 176.62] | [236.96, 196.01, 347.73, 369.74] | 110.77 x 173.72 | 292.35 | 369.74 | yes |
| 2 whistle | cheering | before | [234.84, 218.5, 115.28, 152.37] | [236.32, 220.28, 348.65, 369.45] | 112.32 x 149.17 | 292.48 | 369.45 | NO: [263.0, 232.0, 346.0, 367.0] |
| 2 whistle | cheering | after | [235.16, 215.94, 114.65, 153.45] | [238.69, 217.66, 346.28, 367.95] | 107.6 x 150.29 | 292.48 | 367.95 | NO: [261.0, 232.0, 345.0, 367.0] |
| 3 summary | cheering | before | [235.91, 215.97, 113.16, 155.23] | [237.36, 217.78, 347.61, 369.75] | 110.25 x 151.97 | 292.48 | 369.75 | yes |
| 3 summary | cheering | after | [235.91, 215.97, 113.16, 155.23] | [239.39, 217.71, 345.58, 369.75] | 106.19 x 152.04 | 292.48 | 369.75 | yes |
| 4 tea break | sipping | before | [237.72, 193.11, 109.53, 178.08] | [239.17, 194.92, 345.8, 369.74] | 106.63 x 174.81 | 292.48 | 369.74 | yes |
| 4 tea break | sipping | after | [237.72, 193.11, 109.53, 178.08] | [238.59, 195.14, 346.38, 369.74] | 107.79 x 174.6 | 292.48 | 369.74 | NO: [238.0, 194.0, 346.0, 370.0] |
| 5 next brew | reading | before | [236.09, 194.56, 112.8, 176.62] | [237.91, 196.01, 347.08, 369.74] | 109.17 x 173.72 | 292.49 | 369.74 | yes |
| 5 next brew | reading | after | [236.09, 194.56, 112.8, 176.62] | [236.96, 196.01, 347.73, 369.74] | 110.77 x 173.72 | 292.35 | 369.74 | yes |

Step-to-step deltas (CSS px; ink = decoded alpha through the box; `box` = the img element):

| transition | side | d box w | d box h | d box bottom | d ink w | d ink h | d ink cx | d baseline |
|---|---|---|---|---|---|---|---|---|
| 1>2 running>whistle | before | 2.48 | -24.26 | -6.16 | 3.15 | -24.55 | -0.01 | -6.13 |
| 1>2 running>whistle | after | 1.85 | -23.17 | -1.81 | -3.17 | -23.43 | 0.13 | -1.79 |
| 2>3 whistle>summary | before | -2.12 | 2.86 | 0.33 | -2.07 | 2.8 | 0.0 | 0.3 |
| 2>3 whistle>summary | after | -1.49 | 1.78 | 1.82 | -1.41 | 1.75 | 0.0 | 1.8 |
| 3>4 summary>tea break | before | -3.63 | 22.85 | -0.01 | -3.62 | 22.84 | 0.0 | -0.01 |
| 3>4 summary>tea break | after | -3.63 | 22.85 | -0.01 | 1.6 | 22.56 | 0.0 | -0.01 |
| 4>5 tea break>next brew | before | 3.27 | -1.46 | 0.0 | 2.54 | -1.09 | 0.01 | 0.0 |
| 4>5 tea break>next brew | after | 3.27 | -1.46 | 0.0 | 2.98 | -0.88 | -0.13 | 0.0 |

rAF trace before: 2315 frames; frames with !=1 figure 6; max single-frame delta {'dw': -3.62, 'dh': 22.84, 'dcx': -0.01, 'dbase': -5.83} at {'dh': (22903, 'sipping', '#/focus'), 'dbase': (7495, 'cheering', '#/focus'), 'dw': (22903, 'sipping', '#/focus'), 'dcx': (7495, 'cheering', '#/focus')}

rAF trace after: 2084 frames; frames with !=1 figure 3; max single-frame delta {'dw': -3.62, 'dh': 22.84, 'dcx': -0.01, 'dbase': -9.9} at {'dbase': (7759, 'cheering', '#/focus'), 'dh': (19887, 'sipping', '#/focus'), 'dw': (19887, 'sipping', '#/focus'), 'dcx': (7487, 'cheering', '#/focus')}

#### 390x844 dark dpr1 reduce

| step | pose | side | img box x,y,w,h | ink x0,y0,x1,y1 (decoded alpha through the box) | ink w x h | ink cx | baseline y | screenshot-diff ink agrees (<=1 px) |
|---|---|---|---|---|---|---|---|---|
| 1 focus running | reading | before | [236.09, 194.56, 112.8, 176.62] | [237.91, 196.01, 347.08, 369.74] | 109.17 x 173.72 | 292.49 | 369.74 | NO: [238.0, 201.0, 348.0, 370.0] |
| 1 focus running | reading | after | [236.09, 194.56, 112.8, 176.62] | [236.96, 196.01, 347.73, 369.74] | 110.77 x 173.72 | 292.35 | 369.74 | NO: [236.0, 317.0, 348.0, 370.0] |
| 2 whistle | cheering | before | [235.91, 215.97, 113.16, 155.23] | [237.36, 217.78, 347.61, 369.75] | 110.25 x 151.97 | 292.48 | 369.75 | yes |
| 2 whistle | cheering | after | [235.91, 215.97, 113.16, 155.23] | [239.39, 217.71, 345.58, 369.75] | 106.19 x 152.04 | 292.48 | 369.75 | yes |
| 3 summary | cheering | before | [235.91, 215.97, 113.16, 155.23] | [237.36, 217.78, 347.61, 369.75] | 110.25 x 151.97 | 292.48 | 369.75 | yes |
| 3 summary | cheering | after | [235.91, 215.97, 113.16, 155.23] | [239.39, 217.71, 345.58, 369.75] | 106.19 x 152.04 | 292.48 | 369.75 | yes |
| 4 tea break | sipping | before | [237.72, 193.11, 109.53, 178.08] | [239.17, 194.92, 345.8, 369.74] | 106.63 x 174.81 | 292.48 | 369.74 | yes |
| 4 tea break | sipping | after | [237.72, 193.11, 109.53, 178.08] | [238.59, 195.14, 346.38, 369.74] | 107.79 x 174.6 | 292.48 | 369.74 | NO: [238.0, 194.0, 346.0, 370.0] |
| 5 next brew | reading | before | [236.09, 194.56, 112.8, 176.62] | [237.91, 196.01, 347.08, 369.74] | 109.17 x 173.72 | 292.49 | 369.74 | yes |
| 5 next brew | reading | after | [236.09, 194.56, 112.8, 176.62] | [236.96, 196.01, 347.73, 369.74] | 110.77 x 173.72 | 292.35 | 369.74 | yes |

Step-to-step deltas (CSS px; ink = decoded alpha through the box; `box` = the img element):

| transition | side | d box w | d box h | d box bottom | d ink w | d ink h | d ink cx | d baseline |
|---|---|---|---|---|---|---|---|---|
| 1>2 running>whistle | before | 0.36 | -21.39 | 0.01 | 1.08 | -21.75 | -0.01 | 0.01 |
| 1>2 running>whistle | after | 0.36 | -21.39 | 0.01 | -4.58 | -21.68 | 0.13 | 0.01 |
| 2>3 whistle>summary | before | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| 2>3 whistle>summary | after | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| 3>4 summary>tea break | before | -3.63 | 22.85 | -0.01 | -3.62 | 22.84 | 0.0 | -0.01 |
| 3>4 summary>tea break | after | -3.63 | 22.85 | -0.01 | 1.6 | 22.56 | 0.0 | -0.01 |
| 4>5 tea break>next brew | before | 3.27 | -1.46 | 0.0 | 2.54 | -1.09 | 0.01 | 0.0 |
| 4>5 tea break>next brew | after | 3.27 | -1.46 | 0.0 | 2.98 | -0.88 | -0.13 | 0.0 |

rAF trace before: 1336 frames; frames with !=1 figure 3; max single-frame delta {'dw': -3.62, 'dh': 22.84, 'dcx': -0.01, 'dbase': 0.02} at {'dw': (13154, 'sipping', '#/focus'), 'dh': (13154, 'sipping', '#/focus'), 'dcx': (4145, 'cheering', '#/focus'), 'dbase': (4145, 'cheering', '#/focus')}

rAF trace after: 1101 frames; frames with !=1 figure 3; max single-frame delta {'dw': -3.62, 'dh': 22.84, 'dcx': -0.01, 'dbase': 0.02} at {'dw': (10442, 'sipping', '#/focus'), 'dh': (10442, 'sipping', '#/focus'), 'dcx': (3082, 'cheering', '#/focus'), 'dbase': (3082, 'cheering', '#/focus')}

#### 390x844 dark dpr2 full

| step | pose | side | img box x,y,w,h | ink x0,y0,x1,y1 (decoded alpha through the box) | ink w x h | ink cx | baseline y | screenshot-diff ink agrees (<=1 px) |
|---|---|---|---|---|---|---|---|---|
| 1 focus running | reading | before | [236.09, 194.56, 112.8, 176.62] | [237.91, 196.01, 347.08, 369.74] | 109.17 x 173.72 | 292.49 | 369.74 | yes |
| 1 focus running | reading | after | [236.09, 194.56, 112.8, 176.62] | [236.96, 196.01, 347.73, 369.74] | 110.77 x 173.72 | 292.35 | 369.74 | yes |
| 2 whistle | cheering | before | [236.8, 202.56, 111.38, 159.06] | [238.22, 204.42, 346.74, 360.14] | 108.52 x 155.72 | 292.48 | 360.14 | NO: [254.0, 217.5, 347.5, 369.5] |
| 2 whistle | cheering | after | [234.96, 217.52, 115.04, 152.78] | [238.5, 219.23, 346.46, 368.87] | 107.96 x 149.64 | 292.48 | 368.87 | NO: [254.5, 217.5, 345.5, 369.5] |
| 3 summary | cheering | before | [235.91, 215.97, 113.16, 155.23] | [237.36, 217.78, 347.61, 369.75] | 110.25 x 151.97 | 292.48 | 369.75 | yes |
| 3 summary | cheering | after | [235.91, 215.97, 113.16, 155.23] | [239.39, 217.71, 345.58, 369.75] | 106.19 x 152.04 | 292.48 | 369.75 | yes |
| 4 tea break | sipping | before | [237.72, 193.11, 109.53, 178.08] | [239.17, 194.92, 345.8, 369.74] | 106.63 x 174.81 | 292.48 | 369.74 | yes |
| 4 tea break | sipping | after | [237.72, 193.11, 109.53, 178.08] | [238.59, 195.14, 346.38, 369.74] | 107.79 x 174.6 | 292.48 | 369.74 | yes |
| 5 next brew | reading | before | [236.09, 194.56, 112.8, 176.62] | [237.91, 196.01, 347.08, 369.74] | 109.17 x 173.72 | 292.49 | 369.74 | yes |
| 5 next brew | reading | after | [236.09, 194.56, 112.8, 176.62] | [236.96, 196.01, 347.73, 369.74] | 110.77 x 173.72 | 292.35 | 369.74 | yes |

Step-to-step deltas (CSS px; ink = decoded alpha through the box; `box` = the img element):

| transition | side | d box w | d box h | d box bottom | d ink w | d ink h | d ink cx | d baseline |
|---|---|---|---|---|---|---|---|---|
| 1>2 running>whistle | before | -1.42 | -17.56 | -9.57 | -0.65 | -18.0 | -0.01 | -9.6 |
| 1>2 running>whistle | after | 2.24 | -23.84 | -0.89 | -2.81 | -24.08 | 0.13 | -0.87 |
| 2>3 whistle>summary | before | 1.78 | -3.83 | 9.58 | 1.73 | -3.75 | 0.0 | 9.61 |
| 2>3 whistle>summary | after | -1.88 | 2.45 | 0.9 | -1.77 | 2.4 | 0.0 | 0.88 |
| 3>4 summary>tea break | before | -3.63 | 22.85 | -0.01 | -3.62 | 22.84 | 0.0 | -0.01 |
| 3>4 summary>tea break | after | -3.63 | 22.85 | -0.01 | 1.6 | 22.56 | 0.0 | -0.01 |
| 4>5 tea break>next brew | before | 3.27 | -1.46 | 0.0 | 2.54 | -1.09 | 0.01 | 0.0 |
| 4>5 tea break>next brew | after | 3.27 | -1.46 | 0.0 | 2.98 | -0.88 | -0.13 | 0.0 |

rAF trace before: 2389 frames; frames with !=1 figure 8; max single-frame delta {'dw': 4.49, 'dh': 22.84, 'dcx': -0.01, 'dbase': 9.58} at {'dh': (22316, 'sipping', '#/focus'), 'dbase': (7868, 'cheering', '#/focus'), 'dw': (7676, 'cheering', '#/focus'), 'dcx': (6940, 'cheering', '#/focus')}

rAF trace after: 2035 frames; frames with !=1 figure 4; max single-frame delta {'dw': 3.69, 'dh': 22.84, 'dcx': -0.01, 'dbase': -2.3} at {'dh': (19179, 'sipping', '#/focus'), 'dbase': (283, 'reading', '#/focus'), 'dw': (6491, 'cheering', '#/focus'), 'dcx': (6364, 'cheering', '#/focus')}

#### 390x844 light dpr1 full

| step | pose | side | img box x,y,w,h | ink x0,y0,x1,y1 (decoded alpha through the box) | ink w x h | ink cx | baseline y | screenshot-diff ink agrees (<=1 px) |
|---|---|---|---|---|---|---|---|---|
| 1 focus running | reading | before | [236.09, 194.56, 112.8, 176.62] | [237.91, 196.01, 347.08, 369.74] | 109.17 x 173.72 | 292.49 | 369.74 | NO: [238.0, 253.0, 348.0, 370.0] |
| 1 focus running | reading | after | [236.09, 196.55, 112.8, 176.62] | [236.96, 198.0, 347.73, 371.73] | 110.77 x 173.72 | 292.35 | 371.73 | yes |
| 2 whistle | cheering | before | [235.03, 218.38, 114.91, 152.82] | [236.5, 220.16, 348.47, 369.77] | 111.97 x 149.61 | 292.48 | 369.77 | NO: [237.0, 218.0, 348.0, 367.0] |
| 2 whistle | cheering | after | [235.03, 218.38, 114.91, 152.83] | [238.56, 220.09, 346.4, 369.77] | 107.84 x 149.68 | 292.48 | 369.77 | NO: [239.0, 217.0, 346.0, 364.0] |
| 3 summary | cheering | before | [235.91, 215.97, 113.16, 155.23] | [237.36, 217.78, 347.61, 369.75] | 110.25 x 151.97 | 292.48 | 369.75 | yes |
| 3 summary | cheering | after | [235.91, 215.97, 113.16, 155.23] | [239.39, 217.71, 345.58, 369.75] | 106.19 x 152.04 | 292.48 | 369.75 | yes |
| 4 tea break | sipping | before | [237.72, 193.11, 109.53, 178.08] | [239.17, 194.92, 345.8, 369.74] | 106.63 x 174.81 | 292.48 | 369.74 | yes |
| 4 tea break | sipping | after | [237.72, 193.11, 109.53, 178.08] | [238.59, 195.14, 346.38, 369.74] | 107.79 x 174.6 | 292.48 | 369.74 | yes |
| 5 next brew | reading | before | [236.09, 194.56, 112.8, 176.62] | [237.91, 196.01, 347.08, 369.74] | 109.17 x 173.72 | 292.49 | 369.74 | yes |
| 5 next brew | reading | after | [236.09, 194.56, 112.8, 176.62] | [236.96, 196.01, 347.73, 369.74] | 110.77 x 173.72 | 292.35 | 369.74 | yes |

Step-to-step deltas (CSS px; ink = decoded alpha through the box; `box` = the img element):

| transition | side | d box w | d box h | d box bottom | d ink w | d ink h | d ink cx | d baseline |
|---|---|---|---|---|---|---|---|---|
| 1>2 running>whistle | before | 2.11 | -23.8 | 0.01 | 2.8 | -24.11 | -0.01 | 0.03 |
| 1>2 running>whistle | after | 2.11 | -23.79 | -1.98 | -2.93 | -24.04 | 0.13 | -1.96 |
| 2>3 whistle>summary | before | -1.75 | 2.41 | 0.0 | -1.72 | 2.36 | 0.0 | -0.02 |
| 2>3 whistle>summary | after | -1.75 | 2.4 | 0.0 | -1.65 | 2.36 | 0.0 | -0.02 |
| 3>4 summary>tea break | before | -3.63 | 22.85 | -0.01 | -3.62 | 22.84 | 0.0 | -0.01 |
| 3>4 summary>tea break | after | -3.63 | 22.85 | -0.01 | 1.6 | 22.56 | 0.0 | -0.01 |
| 4>5 tea break>next brew | before | 3.27 | -1.46 | 0.0 | 2.54 | -1.09 | 0.01 | 0.0 |
| 4>5 tea break>next brew | after | 3.27 | -1.46 | 0.0 | 2.98 | -0.88 | -0.13 | 0.0 |

rAF trace before: 2098 frames; frames with !=1 figure 5; max single-frame delta {'dw': -3.62, 'dh': 22.84, 'dcx': -0.01, 'dbase': -4.29} at {'dh': (19083, 'sipping', '#/focus'), 'dbase': (7371, 'cheering', '#/focus'), 'dw': (19083, 'sipping', '#/focus'), 'dcx': (6779, 'cheering', '#/focus')}

rAF trace after: 1805 frames; frames with !=1 figure 5; max single-frame delta {'dw': -3.99, 'dh': 22.84, 'dcx': -0.01, 'dbase': -10.66} at {'dbase': (6583, 'cheering', '#/focus'), 'dw': (6583, 'cheering', '#/focus'), 'dh': (17767, 'sipping', '#/focus'), 'dcx': (5687, 'cheering', '#/focus')}

#### 390x844 light dpr1 reduce

| step | pose | side | img box x,y,w,h | ink x0,y0,x1,y1 (decoded alpha through the box) | ink w x h | ink cx | baseline y | screenshot-diff ink agrees (<=1 px) |
|---|---|---|---|---|---|---|---|---|
| 1 focus running | reading | before | [236.09, 194.56, 112.8, 176.62] | [237.91, 196.01, 347.08, 369.74] | 109.17 x 173.72 | 292.49 | 369.74 | yes |
| 1 focus running | reading | after | [236.09, 194.56, 112.8, 176.62] | [236.96, 196.01, 347.73, 369.74] | 110.77 x 173.72 | 292.35 | 369.74 | NO: [236.0, 198.0, 348.0, 370.0] |
| 2 whistle | cheering | before | [235.91, 215.97, 113.16, 155.23] | [237.36, 217.78, 347.61, 369.75] | 110.25 x 151.97 | 292.48 | 369.75 | yes |
| 2 whistle | cheering | after | [235.91, 215.97, 113.16, 155.23] | [239.39, 217.71, 345.58, 369.75] | 106.19 x 152.04 | 292.48 | 369.75 | yes |
| 3 summary | cheering | before | [235.91, 215.97, 113.16, 155.23] | [237.36, 217.78, 347.61, 369.75] | 110.25 x 151.97 | 292.48 | 369.75 | yes |
| 3 summary | cheering | after | [235.91, 215.97, 113.16, 155.23] | [239.39, 217.71, 345.58, 369.75] | 106.19 x 152.04 | 292.48 | 369.75 | yes |
| 4 tea break | sipping | before | [237.72, 193.11, 109.53, 178.08] | [239.17, 194.92, 345.8, 369.74] | 106.63 x 174.81 | 292.48 | 369.74 | yes |
| 4 tea break | sipping | after | [237.72, 193.11, 109.53, 178.08] | [238.59, 195.14, 346.38, 369.74] | 107.79 x 174.6 | 292.48 | 369.74 | yes |
| 5 next brew | reading | before | [236.09, 194.56, 112.8, 176.62] | [237.91, 196.01, 347.08, 369.74] | 109.17 x 173.72 | 292.49 | 369.74 | yes |
| 5 next brew | reading | after | [236.09, 194.56, 112.8, 176.62] | [236.96, 196.01, 347.73, 369.74] | 110.77 x 173.72 | 292.35 | 369.74 | yes |

Step-to-step deltas (CSS px; ink = decoded alpha through the box; `box` = the img element):

| transition | side | d box w | d box h | d box bottom | d ink w | d ink h | d ink cx | d baseline |
|---|---|---|---|---|---|---|---|---|
| 1>2 running>whistle | before | 0.36 | -21.39 | 0.01 | 1.08 | -21.75 | -0.01 | 0.01 |
| 1>2 running>whistle | after | 0.36 | -21.39 | 0.01 | -4.58 | -21.68 | 0.13 | 0.01 |
| 2>3 whistle>summary | before | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| 2>3 whistle>summary | after | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| 3>4 summary>tea break | before | -3.63 | 22.85 | -0.01 | -3.62 | 22.84 | 0.0 | -0.01 |
| 3>4 summary>tea break | after | -3.63 | 22.85 | -0.01 | 1.6 | 22.56 | 0.0 | -0.01 |
| 4>5 tea break>next brew | before | 3.27 | -1.46 | 0.0 | 2.54 | -1.09 | 0.01 | 0.0 |
| 4>5 tea break>next brew | after | 3.27 | -1.46 | 0.0 | 2.98 | -0.88 | -0.13 | 0.0 |

rAF trace before: 1168 frames; frames with !=1 figure 2; max single-frame delta {'dw': -3.62, 'dh': 22.84, 'dcx': -0.01, 'dbase': 0.02} at {'dw': (11280, 'sipping', '#/focus'), 'dh': (11280, 'sipping', '#/focus'), 'dcx': (3007, 'cheering', '#/focus'), 'dbase': (3007, 'cheering', '#/focus')}

rAF trace after: 1148 frames; frames with !=1 figure 2; max single-frame delta {'dw': -3.62, 'dh': 22.84, 'dcx': -0.01, 'dbase': 0.02} at {'dw': (11071, 'sipping', '#/focus'), 'dh': (11071, 'sipping', '#/focus'), 'dcx': (3135, 'cheering', '#/focus'), 'dbase': (3135, 'cheering', '#/focus')}

#### 390x844 light dpr2 full

| step | pose | side | img box x,y,w,h | ink x0,y0,x1,y1 (decoded alpha through the box) | ink w x h | ink cx | baseline y | screenshot-diff ink agrees (<=1 px) |
|---|---|---|---|---|---|---|---|---|
| 1 focus running | reading | before | [236.09, 204.56, 112.8, 176.62] | [237.91, 206.01, 347.08, 379.74] | 109.17 x 173.72 | 292.49 | 379.74 | yes |
| 1 focus running | reading | after | [236.09, 194.56, 112.8, 176.62] | [236.96, 196.01, 347.73, 369.74] | 110.77 x 173.72 | 292.35 | 369.74 | yes |
| 2 whistle | cheering | before | [235.16, 215.94, 114.65, 153.45] | [236.63, 217.73, 348.34, 367.95] | 111.71 x 150.22 | 292.48 | 367.95 | yes |
| 2 whistle | cheering | after | [235.03, 218.38, 114.91, 152.83] | [238.56, 220.09, 346.4, 369.77] | 107.84 x 149.68 | 292.48 | 369.77 | NO: [239.5, 217.5, 345.5, 368.5] |
| 3 summary | cheering | before | [235.91, 215.97, 113.16, 155.23] | [237.36, 217.78, 347.61, 369.75] | 110.25 x 151.97 | 292.48 | 369.75 | yes |
| 3 summary | cheering | after | [235.91, 215.97, 113.16, 155.23] | [239.39, 217.71, 345.58, 369.75] | 106.19 x 152.04 | 292.48 | 369.75 | yes |
| 4 tea break | sipping | before | [237.72, 193.11, 109.53, 178.08] | [239.17, 194.92, 345.8, 369.74] | 106.63 x 174.81 | 292.48 | 369.74 | yes |
| 4 tea break | sipping | after | [237.72, 193.11, 109.53, 178.08] | [238.59, 195.14, 346.38, 369.74] | 107.79 x 174.6 | 292.48 | 369.74 | yes |
| 5 next brew | reading | before | [236.09, 194.56, 112.8, 176.62] | [237.91, 196.01, 347.08, 369.74] | 109.17 x 173.72 | 292.49 | 369.74 | yes |
| 5 next brew | reading | after | [236.09, 194.56, 112.8, 176.62] | [236.96, 196.01, 347.73, 369.74] | 110.77 x 173.72 | 292.35 | 369.74 | yes |

Step-to-step deltas (CSS px; ink = decoded alpha through the box; `box` = the img element):

| transition | side | d box w | d box h | d box bottom | d ink w | d ink h | d ink cx | d baseline |
|---|---|---|---|---|---|---|---|---|
| 1>2 running>whistle | before | 1.85 | -23.17 | -11.8 | 2.54 | -23.5 | -0.01 | -11.79 |
| 1>2 running>whistle | after | 2.11 | -23.79 | 0.01 | -2.93 | -24.04 | 0.13 | 0.03 |
| 2>3 whistle>summary | before | -1.49 | 1.78 | 1.81 | -1.46 | 1.75 | 0.0 | 1.8 |
| 2>3 whistle>summary | after | -1.75 | 2.4 | 0.0 | -1.65 | 2.36 | 0.0 | -0.02 |
| 3>4 summary>tea break | before | -3.63 | 22.85 | -0.01 | -3.62 | 22.84 | 0.0 | -0.01 |
| 3>4 summary>tea break | after | -3.63 | 22.85 | -0.01 | 1.6 | 22.56 | 0.0 | -0.01 |
| 4>5 tea break>next brew | before | 3.27 | -1.46 | 0.0 | 2.54 | -1.09 | 0.01 | 0.0 |
| 4>5 tea break>next brew | after | 3.27 | -1.46 | 0.0 | 2.98 | -0.88 | -0.13 | 0.0 |

rAF trace before: 2065 frames; frames with !=1 figure 3; max single-frame delta {'dw': 3.69, 'dh': 22.84, 'dcx': -0.01, 'dbase': -9.98} at {'dw': (4876, 'cheering', '#/focus'), 'dh': (18204, 'sipping', '#/focus'), 'dcx': (4732, 'cheering', '#/focus'), 'dbase': (4732, 'cheering', '#/focus')}

rAF trace after: 1696 frames; frames with !=1 figure 5; max single-frame delta {'dw': -3.8, 'dh': 22.84, 'dcx': -0.01, 'dbase': -10.38} at {'dbase': (5897, 'cheering', '#/focus'), 'dh': (15097, 'sipping', '#/focus'), 'dw': (5897, 'cheering', '#/focus'), 'dcx': (5017, 'cheering', '#/focus')}