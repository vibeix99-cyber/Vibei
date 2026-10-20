
#### 1440x900 dark dpr1 full

| step | pose | side | img box x,y,w,h | ink x0,y0,x1,y1 (decoded alpha through the box) | ink w x h | ink cx | baseline y | screenshot-diff ink agrees (<=1 px) |
|---|---|---|---|---|---|---|---|---|
| 1 focus running | reading | before | [514.64, 512.77, 185.09, 289.86] | [517.62, 515.15, 696.76, 800.24] | 179.14 x 285.1 | 607.19 | 800.24 | NO: [518.0, 712.0, 697.0, 800.0] |
| 1 focus running | reading | after | [514.64, 502.77, 185.09, 289.86] | [517.5, 505.15, 696.4, 790.25] | 178.91 x 285.1 | 606.95 | 790.25 | yes |
| 2 whistle | cheering | before | [512.6, 542.05, 189.17, 250.03] | [515.03, 544.97, 699.35, 789.74] | 184.32 x 244.78 | 607.19 | 789.74 | NO: [545.0, 541.0, 698.0, 790.0] |
| 2 whistle | cheering | after | [512.5, 542.84, 189.37, 249.7] | [514.93, 545.64, 699.44, 790.21] | 184.51 x 244.57 | 607.19 | 790.21 | NO: [550.0, 545.0, 698.0, 786.0] |
| 3 summary | cheering | before | [514.34, 537.89, 185.69, 254.73] | [516.72, 540.87, 697.65, 790.24] | 180.93 x 249.38 | 607.19 | 790.24 | yes |
| 3 summary | cheering | after | [514.34, 537.89, 185.69, 254.73] | [516.72, 540.75, 697.65, 790.24] | 180.93 x 249.5 | 607.19 | 790.24 | yes |
| 4 tea break | sipping | before | [517.31, 500.39, 179.75, 292.23] | [519.69, 503.37, 694.68, 790.24] | 174.99 x 286.88 | 607.19 | 790.24 | yes |
| 4 tea break | sipping | after | [517.31, 500.39, 179.75, 292.23] | [519.69, 503.25, 694.21, 790.25] | 174.52 x 287.0 | 606.95 | 790.25 | yes |
| 5 next brew | reading | before | [514.64, 502.77, 185.09, 289.86] | [517.62, 505.15, 696.76, 790.24] | 179.14 x 285.1 | 607.19 | 790.24 | yes |
| 5 next brew | reading | after | [514.64, 502.77, 185.09, 289.86] | [517.5, 505.15, 696.4, 790.25] | 178.91 x 285.1 | 606.95 | 790.25 | yes |

Step-to-step deltas (CSS px; ink = decoded alpha through the box; `box` = the img element):

| transition | side | d box w | d box h | d box bottom | d ink w | d ink h | d ink cx | d baseline |
|---|---|---|---|---|---|---|---|---|
| 1>2 running>whistle | before | 4.08 | -39.83 | -10.54 | 5.18 | -40.32 | 0.0 | -10.5 |
| 1>2 running>whistle | after | 4.28 | -40.16 | -0.08 | 5.6 | -40.53 | 0.24 | -0.04 |
| 2>3 whistle>summary | before | -3.48 | 4.7 | 0.54 | -3.39 | 4.6 | 0.0 | 0.5 |
| 2>3 whistle>summary | after | -3.68 | 5.03 | 0.08 | -3.58 | 4.93 | 0.0 | 0.03 |
| 3>4 summary>tea break | before | -5.94 | 37.5 | 0.0 | -5.94 | 37.5 | 0.0 | 0.0 |
| 3>4 summary>tea break | after | -5.94 | 37.5 | 0.0 | -6.41 | 37.5 | -0.24 | 0.01 |
| 4>5 tea break>next brew | before | 5.34 | -2.37 | 0.0 | 4.15 | -1.78 | 0.0 | 0.0 |
| 4>5 tea break>next brew | after | 5.34 | -2.37 | 0.0 | 4.39 | -1.9 | 0.0 | 0.0 |

rAF trace before: 2732 frames; frames with !=1 figure 11; max single-frame delta {'dw': 6.06, 'dh': 37.5, 'dcx': 0.0, 'dbase': -10.0} at {'dw': (7340, 'cheering', '#/focus'), 'dh': (24988, 'sipping', '#/focus'), 'dbase': (7212, 'cheering', '#/focus'), 'dcx': (7692, 'cheering', '#/focus')}

rAF trace after: 2939 frames; frames with !=1 figure 8; max single-frame delta {'dw': -5.94, 'dh': 37.5, 'dcx': 0.0, 'dbase': -3.61} at {'dbase': (10160, 'cheering', '#/focus'), 'dh': (28847, 'sipping', '#/focus'), 'dw': (28847, 'sipping', '#/focus'), 'dcx': (10687, 'cheering', '#/focus')}

#### 1440x900 dark dpr1 reduce

| step | pose | side | img box x,y,w,h | ink x0,y0,x1,y1 (decoded alpha through the box) | ink w x h | ink cx | baseline y | screenshot-diff ink agrees (<=1 px) |
|---|---|---|---|---|---|---|---|---|
| 1 focus running | reading | before | [514.64, 502.77, 185.09, 289.86] | [517.62, 505.15, 696.76, 790.24] | 179.14 x 285.1 | 607.19 | 790.24 | yes |
| 1 focus running | reading | after | [514.64, 502.77, 185.09, 289.86] | [517.5, 505.15, 696.4, 790.25] | 178.91 x 285.1 | 606.95 | 790.25 | NO: [518.0, 509.0, 697.0, 791.0] |
| 2 whistle | cheering | before | [514.34, 537.89, 185.69, 254.73] | [516.72, 540.87, 697.65, 790.24] | 180.93 x 249.38 | 607.19 | 790.24 | yes |
| 2 whistle | cheering | after | [514.34, 537.89, 185.69, 254.73] | [516.72, 540.75, 697.65, 790.24] | 180.93 x 249.5 | 607.19 | 790.24 | yes |
| 3 summary | cheering | before | [514.34, 537.89, 185.69, 254.73] | [516.72, 540.87, 697.65, 790.24] | 180.93 x 249.38 | 607.19 | 790.24 | yes |
| 3 summary | cheering | after | [514.34, 537.89, 185.69, 254.73] | [516.72, 540.75, 697.65, 790.24] | 180.93 x 249.5 | 607.19 | 790.24 | yes |
| 4 tea break | sipping | before | [517.31, 500.39, 179.75, 292.23] | [519.69, 503.37, 694.68, 790.24] | 174.99 x 286.88 | 607.19 | 790.24 | yes |
| 4 tea break | sipping | after | [517.31, 500.39, 179.75, 292.23] | [519.69, 503.25, 694.21, 790.25] | 174.52 x 287.0 | 606.95 | 790.25 | yes |
| 5 next brew | reading | before | [514.64, 502.77, 185.09, 289.86] | [517.62, 505.15, 696.76, 790.24] | 179.14 x 285.1 | 607.19 | 790.24 | yes |
| 5 next brew | reading | after | [514.64, 502.77, 185.09, 289.86] | [517.5, 505.15, 696.4, 790.25] | 178.91 x 285.1 | 606.95 | 790.25 | yes |

Step-to-step deltas (CSS px; ink = decoded alpha through the box; `box` = the img element):

| transition | side | d box w | d box h | d box bottom | d ink w | d ink h | d ink cx | d baseline |
|---|---|---|---|---|---|---|---|---|
| 1>2 running>whistle | before | 0.6 | -35.13 | 0.0 | 1.79 | -35.72 | 0.0 | 0.0 |
| 1>2 running>whistle | after | 0.6 | -35.13 | 0.0 | 2.02 | -35.6 | 0.24 | -0.01 |
| 2>3 whistle>summary | before | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| 2>3 whistle>summary | after | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| 3>4 summary>tea break | before | -5.94 | 37.5 | 0.0 | -5.94 | 37.5 | 0.0 | 0.0 |
| 3>4 summary>tea break | after | -5.94 | 37.5 | 0.0 | -6.41 | 37.5 | -0.24 | 0.01 |
| 4>5 tea break>next brew | before | 5.34 | -2.37 | 0.0 | 4.15 | -1.78 | 0.0 | 0.0 |
| 4>5 tea break>next brew | after | 5.34 | -2.37 | 0.0 | 4.39 | -1.9 | 0.0 | 0.0 |

rAF trace before: 1758 frames; frames with !=1 figure 2; max single-frame delta {'dw': -5.94, 'dh': 37.5, 'dcx': 0, 'dbase': 0} at {'dw': (17946, 'sipping', '#/focus'), 'dh': (17946, 'sipping', '#/focus')}

rAF trace after: 1613 frames; frames with !=1 figure 2; max single-frame delta {'dw': -5.94, 'dh': 37.5, 'dcx': 0, 'dbase': 0} at {'dw': (16062, 'sipping', '#/focus'), 'dh': (16062, 'sipping', '#/focus')}

#### 1440x900 dark dpr2 full

| step | pose | side | img box x,y,w,h | ink x0,y0,x1,y1 (decoded alpha through the box) | ink w x h | ink cx | baseline y | screenshot-diff ink agrees (<=1 px) |
|---|---|---|---|---|---|---|---|---|
| 1 focus running | reading | before | [514.64, 502.77, 185.09, 289.86] | [517.62, 505.15, 696.76, 790.24] | 179.14 x 285.1 | 607.19 | 790.24 | yes |
| 1 focus running | reading | after | [514.64, 502.77, 185.09, 289.86] | [517.5, 505.15, 696.4, 790.25] | 178.91 x 285.1 | 606.95 | 790.25 | yes |
| 2 whistle | cheering | before | [514.88, 521.63, 184.61, 257.56] | [517.25, 524.64, 697.13, 776.78] | 179.88 x 252.14 | 607.19 | 776.78 | NO: [541.5, 541.0, 697.5, 787.0] |
| 2 whistle | cheering | after | [510.63, 550.61, 193.11, 242.01] | [513.11, 553.33, 701.27, 790.36] | 188.16 x 237.03 | 607.19 | 790.36 | NO: [543.5, 542.0, 697.5, 790.5] |
| 3 summary | cheering | before | [514.34, 537.89, 185.69, 254.73] | [516.72, 540.87, 697.65, 790.24] | 180.93 x 249.38 | 607.19 | 790.24 | yes |
| 3 summary | cheering | after | [514.34, 537.89, 185.69, 254.73] | [516.72, 540.75, 697.65, 790.24] | 180.93 x 249.5 | 607.19 | 790.24 | yes |
| 4 tea break | sipping | before | [517.31, 500.39, 179.75, 292.23] | [519.69, 503.37, 694.68, 790.24] | 174.99 x 286.88 | 607.19 | 790.24 | yes |
| 4 tea break | sipping | after | [517.31, 500.39, 179.75, 292.23] | [519.69, 503.25, 694.21, 790.25] | 174.52 x 287.0 | 606.95 | 790.25 | yes |
| 5 next brew | reading | before | [514.64, 502.77, 185.09, 289.86] | [517.62, 505.15, 696.76, 790.24] | 179.14 x 285.1 | 607.19 | 790.24 | yes |
| 5 next brew | reading | after | [514.64, 502.77, 185.09, 289.86] | [517.5, 505.15, 696.4, 790.25] | 178.91 x 285.1 | 606.95 | 790.25 | yes |

Step-to-step deltas (CSS px; ink = decoded alpha through the box; `box` = the img element):

| transition | side | d box w | d box h | d box bottom | d ink w | d ink h | d ink cx | d baseline |
|---|---|---|---|---|---|---|---|---|
| 1>2 running>whistle | before | -0.48 | -32.3 | -13.43 | 0.74 | -32.96 | 0.0 | -13.46 |
| 1>2 running>whistle | after | 8.02 | -47.85 | 0.0 | 9.25 | -48.07 | 0.24 | 0.11 |
| 2>3 whistle>summary | before | 1.08 | -2.83 | 13.43 | 1.05 | -2.76 | 0.0 | 13.46 |
| 2>3 whistle>summary | after | -7.42 | 12.72 | 0.0 | -7.23 | 12.47 | 0.0 | -0.12 |
| 3>4 summary>tea break | before | -5.94 | 37.5 | 0.0 | -5.94 | 37.5 | 0.0 | 0.0 |
| 3>4 summary>tea break | after | -5.94 | 37.5 | 0.0 | -6.41 | 37.5 | -0.24 | 0.01 |
| 4>5 tea break>next brew | before | 5.34 | -2.37 | 0.0 | 4.15 | -1.78 | 0.0 | 0.0 |
| 4>5 tea break>next brew | after | 5.34 | -2.37 | 0.0 | 4.39 | -1.9 | 0.0 | 0.0 |

rAF trace before: 3489 frames; frames with !=1 figure 4; max single-frame delta {'dw': 6.06, 'dh': 37.5, 'dcx': -0.0, 'dbase': 13.44} at {'dbase': (11679, 'cheering', '#/focus'), 'dh': (32175, 'sipping', '#/focus'), 'dw': (11103, 'cheering', '#/focus'), 'dcx': (11679, 'cheering', '#/focus')}

rAF trace after: 3506 frames; frames with !=1 figure 4; max single-frame delta {'dw': -8.45, 'dh': 37.5, 'dcx': 0.0, 'dbase': -14.32} at {'dh': (32734, 'sipping', '#/focus'), 'dbase': (11518, 'cheering', '#/focus'), 'dw': (11518, 'cheering', '#/focus'), 'dcx': (11518, 'cheering', '#/focus')}

#### 1440x900 light dpr1 full

| step | pose | side | img box x,y,w,h | ink x0,y0,x1,y1 (decoded alpha through the box) | ink w x h | ink cx | baseline y | screenshot-diff ink agrees (<=1 px) |
|---|---|---|---|---|---|---|---|---|
| 1 focus running | reading | before | [514.64, 502.77, 185.09, 289.86] | [517.62, 505.15, 696.76, 790.24] | 179.14 x 285.1 | 607.19 | 790.24 | yes |
| 1 focus running | reading | after | [514.64, 502.77, 185.09, 289.86] | [517.5, 505.15, 696.4, 790.25] | 178.91 x 285.1 | 606.95 | 790.25 | yes |
| 2 whistle | cheering | before | [512.6, 542.05, 189.17, 250.03] | [515.03, 544.97, 699.35, 789.74] | 184.32 x 244.78 | 607.19 | 789.74 | NO: [519.0, 541.0, 698.0, 789.0] |
| 2 whistle | cheering | after | [512.6, 542.05, 189.17, 250.03] | [515.03, 544.85, 699.35, 789.74] | 184.32 x 244.89 | 607.19 | 789.74 | NO: [519.0, 545.0, 697.0, 788.0] |
| 3 summary | cheering | before | [514.34, 537.89, 185.69, 254.73] | [516.72, 540.87, 697.65, 790.24] | 180.93 x 249.38 | 607.19 | 790.24 | yes |
| 3 summary | cheering | after | [514.34, 537.89, 185.69, 254.73] | [516.72, 540.75, 697.65, 790.24] | 180.93 x 249.5 | 607.19 | 790.24 | yes |
| 4 tea break | sipping | before | [517.31, 500.39, 179.75, 292.23] | [519.69, 503.37, 694.68, 790.24] | 174.99 x 286.88 | 607.19 | 790.24 | yes |
| 4 tea break | sipping | after | [517.31, 500.39, 179.75, 292.23] | [519.69, 503.25, 694.21, 790.25] | 174.52 x 287.0 | 606.95 | 790.25 | yes |
| 5 next brew | reading | before | [514.64, 502.77, 185.09, 289.86] | [517.62, 505.15, 696.76, 790.24] | 179.14 x 285.1 | 607.19 | 790.24 | yes |
| 5 next brew | reading | after | [514.64, 502.77, 185.09, 289.86] | [517.5, 505.15, 696.4, 790.25] | 178.91 x 285.1 | 606.95 | 790.25 | yes |

Step-to-step deltas (CSS px; ink = decoded alpha through the box; `box` = the img element):

| transition | side | d box w | d box h | d box bottom | d ink w | d ink h | d ink cx | d baseline |
|---|---|---|---|---|---|---|---|---|
| 1>2 running>whistle | before | 4.08 | -39.83 | -0.54 | 5.18 | -40.32 | 0.0 | -0.5 |
| 1>2 running>whistle | after | 4.08 | -39.83 | -0.54 | 5.41 | -40.21 | 0.24 | -0.51 |
| 2>3 whistle>summary | before | -3.48 | 4.7 | 0.54 | -3.39 | 4.6 | 0.0 | 0.5 |
| 2>3 whistle>summary | after | -3.48 | 4.7 | 0.54 | -3.39 | 4.61 | 0.0 | 0.5 |
| 3>4 summary>tea break | before | -5.94 | 37.5 | 0.0 | -5.94 | 37.5 | 0.0 | 0.0 |
| 3>4 summary>tea break | after | -5.94 | 37.5 | 0.0 | -6.41 | 37.5 | -0.24 | 0.01 |
| 4>5 tea break>next brew | before | 5.34 | -2.37 | 0.0 | 4.15 | -1.78 | 0.0 | 0.0 |
| 4>5 tea break>next brew | after | 5.34 | -2.37 | 0.0 | 4.39 | -1.9 | 0.0 | 0.0 |

rAF trace before: 2962 frames; frames with !=1 figure 7; max single-frame delta {'dw': -5.94, 'dh': 37.5, 'dcx': 0.0, 'dbase': -12.43} at {'dbase': (10300, 'cheering', '#/focus'), 'dh': (29420, 'sipping', '#/focus'), 'dw': (29420, 'sipping', '#/focus'), 'dcx': (10988, 'cheering', '#/focus')}

rAF trace after: 4681 frames; frames with !=1 figure 12; max single-frame delta {'dw': 6.38, 'dh': 37.5, 'dcx': -0.0, 'dbase': 6.56} at {'dbase': (10187, 'cheering', '#/focus'), 'dh': (43627, 'sipping', '#/focus'), 'dw': (10395, 'cheering', '#/focus'), 'dcx': (10683, 'cheering', '#/focus')}

#### 1440x900 light dpr1 reduce

| step | pose | side | img box x,y,w,h | ink x0,y0,x1,y1 (decoded alpha through the box) | ink w x h | ink cx | baseline y | screenshot-diff ink agrees (<=1 px) |
|---|---|---|---|---|---|---|---|---|
| 1 focus running | reading | before | [514.64, 502.77, 185.09, 289.86] | [517.62, 505.15, 696.76, 790.24] | 179.14 x 285.1 | 607.19 | 790.24 | yes |
| 1 focus running | reading | after | [514.64, 502.77, 185.09, 289.86] | [517.5, 505.15, 696.4, 790.25] | 178.91 x 285.1 | 606.95 | 790.25 | NO: [518.0, 518.0, 697.0, 791.0] |
| 2 whistle | cheering | before | [514.34, 537.89, 185.69, 254.73] | [516.72, 540.87, 697.65, 790.24] | 180.93 x 249.38 | 607.19 | 790.24 | yes |
| 2 whistle | cheering | after | [514.34, 537.89, 185.69, 254.73] | [516.72, 540.75, 697.65, 790.24] | 180.93 x 249.5 | 607.19 | 790.24 | yes |
| 3 summary | cheering | before | [514.34, 537.89, 185.69, 254.73] | [516.72, 540.87, 697.65, 790.24] | 180.93 x 249.38 | 607.19 | 790.24 | yes |
| 3 summary | cheering | after | [514.34, 537.89, 185.69, 254.73] | [516.72, 540.75, 697.65, 790.24] | 180.93 x 249.5 | 607.19 | 790.24 | yes |
| 4 tea break | sipping | before | [517.31, 500.39, 179.75, 292.23] | [519.69, 503.37, 694.68, 790.24] | 174.99 x 286.88 | 607.19 | 790.24 | yes |
| 4 tea break | sipping | after | [517.31, 500.39, 179.75, 292.23] | [519.69, 503.25, 694.21, 790.25] | 174.52 x 287.0 | 606.95 | 790.25 | yes |
| 5 next brew | reading | before | [514.64, 502.77, 185.09, 289.86] | [517.62, 505.15, 696.76, 790.24] | 179.14 x 285.1 | 607.19 | 790.24 | yes |
| 5 next brew | reading | after | [514.64, 502.77, 185.09, 289.86] | [517.5, 505.15, 696.4, 790.25] | 178.91 x 285.1 | 606.95 | 790.25 | yes |

Step-to-step deltas (CSS px; ink = decoded alpha through the box; `box` = the img element):

| transition | side | d box w | d box h | d box bottom | d ink w | d ink h | d ink cx | d baseline |
|---|---|---|---|---|---|---|---|---|
| 1>2 running>whistle | before | 0.6 | -35.13 | 0.0 | 1.79 | -35.72 | 0.0 | 0.0 |
| 1>2 running>whistle | after | 0.6 | -35.13 | 0.0 | 2.02 | -35.6 | 0.24 | -0.01 |
| 2>3 whistle>summary | before | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| 2>3 whistle>summary | after | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| 3>4 summary>tea break | before | -5.94 | 37.5 | 0.0 | -5.94 | 37.5 | 0.0 | 0.0 |
| 3>4 summary>tea break | after | -5.94 | 37.5 | 0.0 | -6.41 | 37.5 | -0.24 | 0.01 |
| 4>5 tea break>next brew | before | 5.34 | -2.37 | 0.0 | 4.15 | -1.78 | 0.0 | 0.0 |
| 4>5 tea break>next brew | after | 5.34 | -2.37 | 0.0 | 4.39 | -1.9 | 0.0 | 0.0 |

rAF trace before: 1522 frames; frames with !=1 figure 3; max single-frame delta {'dw': -5.94, 'dh': 37.5, 'dcx': 0, 'dbase': 0} at {'dw': (14874, 'sipping', '#/focus'), 'dh': (14874, 'sipping', '#/focus')}

rAF trace after: 2697 frames; frames with !=1 figure 3; max single-frame delta {'dw': -5.94, 'dh': 37.5, 'dcx': 0, 'dbase': 0} at {'dw': (25641, 'sipping', '#/focus'), 'dh': (25641, 'sipping', '#/focus')}

#### 1440x900 light dpr2 full

| step | pose | side | img box x,y,w,h | ink x0,y0,x1,y1 (decoded alpha through the box) | ink w x h | ink cx | baseline y | screenshot-diff ink agrees (<=1 px) |
|---|---|---|---|---|---|---|---|---|
| 1 focus running | reading | before | [514.64, 502.77, 185.09, 289.86] | [517.62, 505.15, 696.76, 790.24] | 179.14 x 285.1 | 607.19 | 790.24 | NO: [518.5, 506.5, 697.0, 790.0] |
| 1 focus running | reading | after | [514.64, 502.77, 185.09, 289.86] | [517.5, 505.15, 696.4, 790.25] | 178.91 x 285.1 | 606.95 | 790.25 | yes |
| 2 whistle | cheering | before | [514.18, 529.16, 186.02, 255.45] | [516.56, 532.14, 697.81, 782.22] | 181.25 x 250.07 | 607.19 | 782.22 | NO: [516.5, 541.0, 697.5, 790.0] |
| 2 whistle | reading | after | [514.64, 502.77, 185.09, 289.86] | [517.5, 505.15, 696.4, 790.25] | 178.91 x 285.1 | 606.95 | 790.25 | NO: [516.0, 541.0, 697.0, 790.5] |
| 3 summary | cheering | before | [514.34, 537.89, 185.69, 254.73] | [516.72, 540.87, 697.65, 790.24] | 180.93 x 249.38 | 607.19 | 790.24 | yes |
| 3 summary | cheering | after | [514.34, 537.89, 185.69, 254.73] | [516.72, 540.75, 697.65, 790.24] | 180.93 x 249.5 | 607.19 | 790.24 | yes |
| 4 tea break | sipping | before | [517.31, 500.39, 179.75, 292.23] | [519.69, 503.37, 694.68, 790.24] | 174.99 x 286.88 | 607.19 | 790.24 | yes |
| 4 tea break | sipping | after | [517.31, 500.39, 179.75, 292.23] | [519.69, 503.25, 694.21, 790.25] | 174.52 x 287.0 | 606.95 | 790.25 | yes |
| 5 next brew | reading | before | [514.64, 502.77, 185.09, 289.86] | [517.62, 505.15, 696.76, 790.24] | 179.14 x 285.1 | 607.19 | 790.24 | NO: [518.5, 506.5, 697.0, 790.0] |
| 5 next brew | reading | after | [514.64, 502.77, 185.09, 289.86] | [517.5, 505.15, 696.4, 790.25] | 178.91 x 285.1 | 606.95 | 790.25 | yes |

Step-to-step deltas (CSS px; ink = decoded alpha through the box; `box` = the img element):

| transition | side | d box w | d box h | d box bottom | d ink w | d ink h | d ink cx | d baseline |
|---|---|---|---|---|---|---|---|---|
| 1>2 running>whistle | before | 0.93 | -34.41 | -8.02 | 2.11 | -35.03 | 0.0 | -8.02 |
| 1>2 running>whistle | after | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| 2>3 whistle>summary | before | -0.33 | -0.72 | 8.02 | -0.32 | -0.69 | 0.0 | 8.02 |
| 2>3 whistle>summary | after | 0.6 | -35.13 | 0.0 | 2.02 | -35.6 | 0.24 | -0.01 |
| 3>4 summary>tea break | before | -5.94 | 37.5 | 0.0 | -5.94 | 37.5 | 0.0 | 0.0 |
| 3>4 summary>tea break | after | -5.94 | 37.5 | 0.0 | -6.41 | 37.5 | -0.24 | 0.01 |
| 4>5 tea break>next brew | before | 5.34 | -2.37 | 0.0 | 4.15 | -1.78 | 0.0 | 0.0 |
| 4>5 tea break>next brew | after | 5.34 | -2.37 | 0.0 | 4.39 | -1.9 | 0.0 | 0.0 |

rAF trace before: 4419 frames; frames with !=1 figure 4; max single-frame delta {'dw': -5.94, 'dh': 37.5, 'dcx': -0.0, 'dbase': -12.77} at {'dbase': (11983, 'cheering', '#/focus'), 'dh': (33759, 'sipping', '#/focus'), 'dw': (33759, 'sipping', '#/focus'), 'dcx': (12447, 'cheering', '#/focus')}

rAF trace after: 6631 frames; frames with !=1 figure 12; max single-frame delta {'dw': -5.94, 'dh': 37.5, 'dcx': 0, 'dbase': -4.15} at {'dh': (71922, 'sipping', '#/focus'), 'dbase': (466, 'reading', '#/focus'), 'dw': (71922, 'sipping', '#/focus')}

#### 390x844 dark dpr1 full

| step | pose | side | img box x,y,w,h | ink x0,y0,x1,y1 (decoded alpha through the box) | ink w x h | ink cx | baseline y | screenshot-diff ink agrees (<=1 px) |
|---|---|---|---|---|---|---|---|---|
| 1 focus running | reading | before | [236.09, 200.41, 112.8, 176.63] | [237.91, 201.86, 347.08, 375.58] | 109.17 x 173.72 | 292.49 | 375.58 | yes |
| 1 focus running | reading | after | [236.09, 199.5, 112.8, 176.62] | [237.83, 200.95, 346.86, 374.67] | 109.03 x 173.72 | 292.35 | 374.67 | yes |
| 2 whistle | cheering | before | [234.84, 218.5, 115.28, 152.37] | [236.32, 220.28, 348.65, 369.45] | 112.32 x 149.17 | 292.48 | 369.45 | NO: [263.0, 232.0, 346.0, 367.0] |
| 2 whistle | cheering | after | [235.44, 213.67, 114.1, 154.4] | [236.9, 215.4, 348.07, 366.62] | 111.17 x 151.22 | 292.48 | 366.62 | NO: [273.0, 232.0, 347.0, 367.0] |
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
| 1>2 running>whistle | after | 1.3 | -22.22 | -8.05 | 2.14 | -22.5 | 0.13 | -8.05 |
| 2>3 whistle>summary | before | -2.12 | 2.86 | 0.33 | -2.07 | 2.8 | 0.0 | 0.3 |
| 2>3 whistle>summary | after | -0.94 | 0.83 | 3.13 | -0.92 | 0.82 | 0.0 | 3.13 |
| 3>4 summary>tea break | before | -3.63 | 22.85 | -0.01 | -3.62 | 22.84 | 0.0 | -0.01 |
| 3>4 summary>tea break | after | -3.63 | 22.85 | -0.01 | -3.91 | 22.85 | -0.14 | -0.01 |
| 4>5 tea break>next brew | before | 3.27 | -1.46 | 0.0 | 2.54 | -1.09 | 0.01 | 0.0 |
| 4>5 tea break>next brew | after | 3.27 | -1.46 | 0.0 | 2.69 | -1.17 | 0.01 | 0.0 |

rAF trace before: 2315 frames; frames with !=1 figure 6; max single-frame delta {'dw': -3.62, 'dh': 22.84, 'dcx': -0.01, 'dbase': -5.83} at {'dh': (22903, 'sipping', '#/focus'), 'dbase': (7495, 'cheering', '#/focus'), 'dw': (22903, 'sipping', '#/focus'), 'dcx': (7495, 'cheering', '#/focus')}

rAF trace after: 2163 frames; frames with !=1 figure 9; max single-frame delta {'dw': -3.62, 'dh': 22.84, 'dcx': -0.01, 'dbase': -4.92} at {'dbase': (5822, 'cheering', '#/focus'), 'dw': (22254, 'sipping', '#/focus'), 'dh': (22254, 'sipping', '#/focus'), 'dcx': (5822, 'cheering', '#/focus')}

#### 390x844 dark dpr1 reduce

| step | pose | side | img box x,y,w,h | ink x0,y0,x1,y1 (decoded alpha through the box) | ink w x h | ink cx | baseline y | screenshot-diff ink agrees (<=1 px) |
|---|---|---|---|---|---|---|---|---|
| 1 focus running | reading | before | [236.09, 194.56, 112.8, 176.62] | [237.91, 196.01, 347.08, 369.74] | 109.17 x 173.72 | 292.49 | 369.74 | NO: [238.0, 201.0, 348.0, 370.0] |
| 1 focus running | reading | after | [236.09, 194.56, 112.8, 176.62] | [237.83, 196.01, 346.86, 369.74] | 109.03 x 173.72 | 292.35 | 369.74 | NO: [237.0, 317.0, 347.0, 370.0] |
| 2 whistle | cheering | before | [235.91, 215.97, 113.16, 155.23] | [237.36, 217.78, 347.61, 369.75] | 110.25 x 151.97 | 292.48 | 369.75 | yes |
| 2 whistle | cheering | after | [235.91, 215.97, 113.16, 155.23] | [237.36, 217.71, 347.61, 369.75] | 110.25 x 152.04 | 292.48 | 369.75 | yes |
| 3 summary | cheering | before | [235.91, 215.97, 113.16, 155.23] | [237.36, 217.78, 347.61, 369.75] | 110.25 x 151.97 | 292.48 | 369.75 | yes |
| 3 summary | cheering | after | [235.91, 215.97, 113.16, 155.23] | [237.36, 217.71, 347.61, 369.75] | 110.25 x 152.04 | 292.48 | 369.75 | yes |
| 4 tea break | sipping | before | [237.72, 193.11, 109.53, 178.08] | [239.17, 194.92, 345.8, 369.74] | 106.63 x 174.81 | 292.48 | 369.74 | yes |
| 4 tea break | sipping | after | [237.72, 193.11, 109.53, 178.08] | [239.17, 194.85, 345.51, 369.74] | 106.34 x 174.89 | 292.34 | 369.74 | yes |
| 5 next brew | reading | before | [236.09, 194.56, 112.8, 176.62] | [237.91, 196.01, 347.08, 369.74] | 109.17 x 173.72 | 292.49 | 369.74 | yes |
| 5 next brew | reading | after | [236.09, 194.56, 112.8, 176.62] | [237.83, 196.01, 346.86, 369.74] | 109.03 x 173.72 | 292.35 | 369.74 | yes |

Step-to-step deltas (CSS px; ink = decoded alpha through the box; `box` = the img element):

| transition | side | d box w | d box h | d box bottom | d ink w | d ink h | d ink cx | d baseline |
|---|---|---|---|---|---|---|---|---|
| 1>2 running>whistle | before | 0.36 | -21.39 | 0.01 | 1.08 | -21.75 | -0.01 | 0.01 |
| 1>2 running>whistle | after | 0.36 | -21.39 | 0.01 | 1.22 | -21.68 | 0.13 | 0.01 |
| 2>3 whistle>summary | before | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| 2>3 whistle>summary | after | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| 3>4 summary>tea break | before | -3.63 | 22.85 | -0.01 | -3.62 | 22.84 | 0.0 | -0.01 |
| 3>4 summary>tea break | after | -3.63 | 22.85 | -0.01 | -3.91 | 22.85 | -0.14 | -0.01 |
| 4>5 tea break>next brew | before | 3.27 | -1.46 | 0.0 | 2.54 | -1.09 | 0.01 | 0.0 |
| 4>5 tea break>next brew | after | 3.27 | -1.46 | 0.0 | 2.69 | -1.17 | 0.01 | 0.0 |

rAF trace before: 1336 frames; frames with !=1 figure 3; max single-frame delta {'dw': -3.62, 'dh': 22.84, 'dcx': -0.01, 'dbase': 0.02} at {'dw': (13154, 'sipping', '#/focus'), 'dh': (13154, 'sipping', '#/focus'), 'dcx': (4145, 'cheering', '#/focus'), 'dbase': (4145, 'cheering', '#/focus')}

rAF trace after: 1227 frames; frames with !=1 figure 1; max single-frame delta {'dw': -3.62, 'dh': 22.84, 'dcx': -0.01, 'dbase': 0.02} at {'dw': (11563, 'sipping', '#/focus'), 'dh': (11563, 'sipping', '#/focus'), 'dcx': (3227, 'cheering', '#/focus'), 'dbase': (3227, 'cheering', '#/focus')}

#### 390x844 dark dpr2 full

| step | pose | side | img box x,y,w,h | ink x0,y0,x1,y1 (decoded alpha through the box) | ink w x h | ink cx | baseline y | screenshot-diff ink agrees (<=1 px) |
|---|---|---|---|---|---|---|---|---|
| 1 focus running | reading | before | [236.09, 194.56, 112.8, 176.62] | [237.91, 196.01, 347.08, 369.74] | 109.17 x 173.72 | 292.49 | 369.74 | yes |
| 1 focus running | reading | after | [236.09, 195.19, 112.8, 176.62] | [237.83, 196.64, 346.86, 370.36] | 109.03 x 173.72 | 292.35 | 370.36 | yes |
| 2 whistle | cheering | before | [236.8, 202.56, 111.38, 159.06] | [238.22, 204.42, 346.74, 360.14] | 108.52 x 155.72 | 292.48 | 360.14 | NO: [254.0, 217.5, 347.5, 369.5] |
| 2 whistle | cheering | after | [235.03, 218.38, 114.91, 152.83] | [236.5, 220.09, 348.47, 369.77] | 111.97 x 149.68 | 292.48 | 369.77 | NO: [254.5, 217.5, 347.5, 369.5] |
| 3 summary | cheering | before | [235.91, 215.97, 113.16, 155.23] | [237.36, 217.78, 347.61, 369.75] | 110.25 x 151.97 | 292.48 | 369.75 | yes |
| 3 summary | cheering | after | [235.91, 215.97, 113.16, 155.23] | [237.36, 217.71, 347.61, 369.75] | 110.25 x 152.04 | 292.48 | 369.75 | yes |
| 4 tea break | sipping | before | [237.72, 193.11, 109.53, 178.08] | [239.17, 194.92, 345.8, 369.74] | 106.63 x 174.81 | 292.48 | 369.74 | yes |
| 4 tea break | sipping | after | [237.72, 193.11, 109.53, 178.08] | [239.17, 194.85, 345.51, 369.74] | 106.34 x 174.89 | 292.34 | 369.74 | yes |
| 5 next brew | reading | before | [236.09, 194.56, 112.8, 176.62] | [237.91, 196.01, 347.08, 369.74] | 109.17 x 173.72 | 292.49 | 369.74 | yes |
| 5 next brew | reading | after | [236.09, 194.56, 112.8, 176.62] | [237.83, 196.01, 346.86, 369.74] | 109.03 x 173.72 | 292.35 | 369.74 | yes |

Step-to-step deltas (CSS px; ink = decoded alpha through the box; `box` = the img element):

| transition | side | d box w | d box h | d box bottom | d ink w | d ink h | d ink cx | d baseline |
|---|---|---|---|---|---|---|---|---|
| 1>2 running>whistle | before | -1.42 | -17.56 | -9.57 | -0.65 | -18.0 | -0.01 | -9.6 |
| 1>2 running>whistle | after | 2.11 | -23.79 | -0.61 | 2.94 | -24.04 | 0.13 | -0.59 |
| 2>3 whistle>summary | before | 1.78 | -3.83 | 9.58 | 1.73 | -3.75 | 0.0 | 9.61 |
| 2>3 whistle>summary | after | -1.75 | 2.4 | 0.0 | -1.72 | 2.36 | 0.0 | -0.02 |
| 3>4 summary>tea break | before | -3.63 | 22.85 | -0.01 | -3.62 | 22.84 | 0.0 | -0.01 |
| 3>4 summary>tea break | after | -3.63 | 22.85 | -0.01 | -3.91 | 22.85 | -0.14 | -0.01 |
| 4>5 tea break>next brew | before | 3.27 | -1.46 | 0.0 | 2.54 | -1.09 | 0.01 | 0.0 |
| 4>5 tea break>next brew | after | 3.27 | -1.46 | 0.0 | 2.69 | -1.17 | 0.01 | 0.0 |

rAF trace before: 2389 frames; frames with !=1 figure 8; max single-frame delta {'dw': 4.49, 'dh': 22.84, 'dcx': -0.01, 'dbase': 9.58} at {'dh': (22316, 'sipping', '#/focus'), 'dbase': (7868, 'cheering', '#/focus'), 'dw': (7676, 'cheering', '#/focus'), 'dcx': (6940, 'cheering', '#/focus')}

rAF trace after: 1988 frames; frames with !=1 figure 17; max single-frame delta {'dw': 3.89, 'dh': 22.84, 'dcx': -0.01, 'dbase': -4.23} at {'dh': (19589, 'sipping', '#/focus'), 'dbase': (7222, 'cheering', '#/focus'), 'dw': (7589, 'cheering', '#/focus'), 'dcx': (7077, 'cheering', '#/focus')}

#### 390x844 light dpr1 full

| step | pose | side | img box x,y,w,h | ink x0,y0,x1,y1 (decoded alpha through the box) | ink w x h | ink cx | baseline y | screenshot-diff ink agrees (<=1 px) |
|---|---|---|---|---|---|---|---|---|
| 1 focus running | reading | before | [236.09, 194.56, 112.8, 176.62] | [237.91, 196.01, 347.08, 369.74] | 109.17 x 173.72 | 292.49 | 369.74 | NO: [238.0, 253.0, 348.0, 370.0] |
| 1 focus running | reading | after | [236.09, 195.25, 112.8, 176.63] | [237.83, 196.7, 346.86, 370.43] | 109.03 x 173.72 | 292.35 | 370.43 | yes |
| 2 whistle | cheering | before | [235.03, 218.38, 114.91, 152.82] | [236.5, 220.16, 348.47, 369.77] | 111.97 x 149.61 | 292.48 | 369.77 | NO: [237.0, 218.0, 348.0, 367.0] |
| 2 whistle | cheering | after | [234.84, 218.5, 115.28, 152.37] | [236.32, 220.21, 348.65, 369.45] | 112.32 x 149.24 | 292.48 | 369.45 | NO: [240.0, 232.0, 345.0, 366.0] |
| 3 summary | cheering | before | [235.91, 215.97, 113.16, 155.23] | [237.36, 217.78, 347.61, 369.75] | 110.25 x 151.97 | 292.48 | 369.75 | yes |
| 3 summary | cheering | after | [235.91, 215.97, 113.16, 155.23] | [237.36, 217.71, 347.61, 369.75] | 110.25 x 152.04 | 292.48 | 369.75 | yes |
| 4 tea break | sipping | before | [237.72, 193.11, 109.53, 178.08] | [239.17, 194.92, 345.8, 369.74] | 106.63 x 174.81 | 292.48 | 369.74 | yes |
| 4 tea break | sipping | after | [237.72, 193.11, 109.53, 178.08] | [239.17, 194.85, 345.51, 369.74] | 106.34 x 174.89 | 292.34 | 369.74 | yes |
| 5 next brew | reading | before | [236.09, 194.56, 112.8, 176.62] | [237.91, 196.01, 347.08, 369.74] | 109.17 x 173.72 | 292.49 | 369.74 | yes |
| 5 next brew | reading | after | [236.09, 194.56, 112.8, 176.62] | [237.83, 196.01, 346.86, 369.74] | 109.03 x 173.72 | 292.35 | 369.74 | yes |

Step-to-step deltas (CSS px; ink = decoded alpha through the box; `box` = the img element):

| transition | side | d box w | d box h | d box bottom | d ink w | d ink h | d ink cx | d baseline |
|---|---|---|---|---|---|---|---|---|
| 1>2 running>whistle | before | 2.11 | -23.8 | 0.01 | 2.8 | -24.11 | -0.01 | 0.03 |
| 1>2 running>whistle | after | 2.48 | -24.26 | -1.01 | 3.29 | -24.48 | 0.13 | -0.98 |
| 2>3 whistle>summary | before | -1.75 | 2.41 | 0.0 | -1.72 | 2.36 | 0.0 | -0.02 |
| 2>3 whistle>summary | after | -2.12 | 2.86 | 0.33 | -2.07 | 2.8 | 0.0 | 0.3 |
| 3>4 summary>tea break | before | -3.63 | 22.85 | -0.01 | -3.62 | 22.84 | 0.0 | -0.01 |
| 3>4 summary>tea break | after | -3.63 | 22.85 | -0.01 | -3.91 | 22.85 | -0.14 | -0.01 |
| 4>5 tea break>next brew | before | 3.27 | -1.46 | 0.0 | 2.54 | -1.09 | 0.01 | 0.0 |
| 4>5 tea break>next brew | after | 3.27 | -1.46 | 0.0 | 2.69 | -1.17 | 0.01 | 0.0 |

rAF trace before: 2098 frames; frames with !=1 figure 5; max single-frame delta {'dw': -3.62, 'dh': 22.84, 'dcx': -0.01, 'dbase': -4.29} at {'dh': (19083, 'sipping', '#/focus'), 'dbase': (7371, 'cheering', '#/focus'), 'dw': (19083, 'sipping', '#/focus'), 'dcx': (6779, 'cheering', '#/focus')}

rAF trace after: 2324 frames; frames with !=1 figure 11; max single-frame delta {'dw': 3.69, 'dh': 22.84, 'dcx': -0.01, 'dbase': -2.44} at {'dbase': (393, 'reading', '#/focus'), 'dh': (23257, 'sipping', '#/focus'), 'dw': (8489, 'cheering', '#/focus'), 'dcx': (8377, 'cheering', '#/focus')}

#### 390x844 light dpr1 reduce

| step | pose | side | img box x,y,w,h | ink x0,y0,x1,y1 (decoded alpha through the box) | ink w x h | ink cx | baseline y | screenshot-diff ink agrees (<=1 px) |
|---|---|---|---|---|---|---|---|---|
| 1 focus running | reading | before | [236.09, 194.56, 112.8, 176.62] | [237.91, 196.01, 347.08, 369.74] | 109.17 x 173.72 | 292.49 | 369.74 | yes |
| 1 focus running | reading | after | [236.09, 194.56, 112.8, 176.62] | [237.83, 196.01, 346.86, 369.74] | 109.03 x 173.72 | 292.35 | 369.74 | NO: [237.0, 253.0, 347.0, 370.0] |
| 2 whistle | cheering | before | [235.91, 215.97, 113.16, 155.23] | [237.36, 217.78, 347.61, 369.75] | 110.25 x 151.97 | 292.48 | 369.75 | yes |
| 2 whistle | cheering | after | [235.91, 215.97, 113.16, 155.23] | [237.36, 217.71, 347.61, 369.75] | 110.25 x 152.04 | 292.48 | 369.75 | yes |
| 3 summary | cheering | before | [235.91, 215.97, 113.16, 155.23] | [237.36, 217.78, 347.61, 369.75] | 110.25 x 151.97 | 292.48 | 369.75 | yes |
| 3 summary | cheering | after | [235.91, 215.97, 113.16, 155.23] | [237.36, 217.71, 347.61, 369.75] | 110.25 x 152.04 | 292.48 | 369.75 | yes |
| 4 tea break | sipping | before | [237.72, 193.11, 109.53, 178.08] | [239.17, 194.92, 345.8, 369.74] | 106.63 x 174.81 | 292.48 | 369.74 | yes |
| 4 tea break | sipping | after | [237.72, 193.11, 109.53, 178.08] | [239.17, 194.85, 345.51, 369.74] | 106.34 x 174.89 | 292.34 | 369.74 | yes |
| 5 next brew | reading | before | [236.09, 194.56, 112.8, 176.62] | [237.91, 196.01, 347.08, 369.74] | 109.17 x 173.72 | 292.49 | 369.74 | yes |
| 5 next brew | reading | after | [236.09, 194.56, 112.8, 176.62] | [237.83, 196.01, 346.86, 369.74] | 109.03 x 173.72 | 292.35 | 369.74 | yes |

Step-to-step deltas (CSS px; ink = decoded alpha through the box; `box` = the img element):

| transition | side | d box w | d box h | d box bottom | d ink w | d ink h | d ink cx | d baseline |
|---|---|---|---|---|---|---|---|---|
| 1>2 running>whistle | before | 0.36 | -21.39 | 0.01 | 1.08 | -21.75 | -0.01 | 0.01 |
| 1>2 running>whistle | after | 0.36 | -21.39 | 0.01 | 1.22 | -21.68 | 0.13 | 0.01 |
| 2>3 whistle>summary | before | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| 2>3 whistle>summary | after | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| 3>4 summary>tea break | before | -3.63 | 22.85 | -0.01 | -3.62 | 22.84 | 0.0 | -0.01 |
| 3>4 summary>tea break | after | -3.63 | 22.85 | -0.01 | -3.91 | 22.85 | -0.14 | -0.01 |
| 4>5 tea break>next brew | before | 3.27 | -1.46 | 0.0 | 2.54 | -1.09 | 0.01 | 0.0 |
| 4>5 tea break>next brew | after | 3.27 | -1.46 | 0.0 | 2.69 | -1.17 | 0.01 | 0.0 |

rAF trace before: 1168 frames; frames with !=1 figure 2; max single-frame delta {'dw': -3.62, 'dh': 22.84, 'dcx': -0.01, 'dbase': 0.02} at {'dw': (11280, 'sipping', '#/focus'), 'dh': (11280, 'sipping', '#/focus'), 'dcx': (3007, 'cheering', '#/focus'), 'dbase': (3007, 'cheering', '#/focus')}

rAF trace after: 1234 frames; frames with !=1 figure 2; max single-frame delta {'dw': -3.62, 'dh': 22.84, 'dcx': -0.01, 'dbase': 0.02} at {'dw': (11497, 'sipping', '#/focus'), 'dh': (11497, 'sipping', '#/focus'), 'dcx': (3577, 'cheering', '#/focus'), 'dbase': (3577, 'cheering', '#/focus')}

#### 390x844 light dpr2 full

| step | pose | side | img box x,y,w,h | ink x0,y0,x1,y1 (decoded alpha through the box) | ink w x h | ink cx | baseline y | screenshot-diff ink agrees (<=1 px) |
|---|---|---|---|---|---|---|---|---|
| 1 focus running | reading | before | [236.09, 204.56, 112.8, 176.62] | [237.91, 206.01, 347.08, 379.74] | 109.17 x 173.72 | 292.49 | 379.74 | yes |
| 1 focus running | reading | after | [236.09, 194.59, 112.8, 176.62] | [237.83, 196.04, 346.86, 369.76] | 109.03 x 173.72 | 292.35 | 369.76 | yes |
| 2 whistle | cheering | before | [235.16, 215.94, 114.65, 153.45] | [236.63, 217.73, 348.34, 367.95] | 111.71 x 150.22 | 292.48 | 367.95 | yes |
| 2 whistle | cheering | after | [234.79, 219.03, 115.39, 152.17] | [236.27, 220.74, 348.7, 369.78] | 112.43 x 149.04 | 292.48 | 369.78 | NO: [237.5, 217.5, 347.5, 368.5] |
| 3 summary | cheering | before | [235.91, 215.97, 113.16, 155.23] | [237.36, 217.78, 347.61, 369.75] | 110.25 x 151.97 | 292.48 | 369.75 | yes |
| 3 summary | cheering | after | [235.91, 215.97, 113.16, 155.23] | [237.36, 217.71, 347.61, 369.75] | 110.25 x 152.04 | 292.48 | 369.75 | yes |
| 4 tea break | sipping | before | [237.72, 193.11, 109.53, 178.08] | [239.17, 194.92, 345.8, 369.74] | 106.63 x 174.81 | 292.48 | 369.74 | yes |
| 4 tea break | sipping | after | [237.72, 193.11, 109.53, 178.08] | [239.17, 194.85, 345.51, 369.74] | 106.34 x 174.89 | 292.34 | 369.74 | yes |
| 5 next brew | reading | before | [236.09, 194.56, 112.8, 176.62] | [237.91, 196.01, 347.08, 369.74] | 109.17 x 173.72 | 292.49 | 369.74 | yes |
| 5 next brew | reading | after | [236.09, 194.56, 112.8, 176.62] | [237.83, 196.01, 346.86, 369.74] | 109.03 x 173.72 | 292.35 | 369.74 | yes |

Step-to-step deltas (CSS px; ink = decoded alpha through the box; `box` = the img element):

| transition | side | d box w | d box h | d box bottom | d ink w | d ink h | d ink cx | d baseline |
|---|---|---|---|---|---|---|---|---|
| 1>2 running>whistle | before | 1.85 | -23.17 | -11.8 | 2.54 | -23.5 | -0.01 | -11.79 |
| 1>2 running>whistle | after | 2.59 | -24.45 | -0.01 | 3.4 | -24.68 | 0.13 | 0.02 |
| 2>3 whistle>summary | before | -1.49 | 1.78 | 1.81 | -1.46 | 1.75 | 0.0 | 1.8 |
| 2>3 whistle>summary | after | -2.23 | 3.06 | 0.0 | -2.18 | 3.0 | 0.0 | -0.03 |
| 3>4 summary>tea break | before | -3.63 | 22.85 | -0.01 | -3.62 | 22.84 | 0.0 | -0.01 |
| 3>4 summary>tea break | after | -3.63 | 22.85 | -0.01 | -3.91 | 22.85 | -0.14 | -0.01 |
| 4>5 tea break>next brew | before | 3.27 | -1.46 | 0.0 | 2.54 | -1.09 | 0.01 | 0.0 |
| 4>5 tea break>next brew | after | 3.27 | -1.46 | 0.0 | 2.69 | -1.17 | 0.01 | 0.0 |

rAF trace before: 2065 frames; frames with !=1 figure 3; max single-frame delta {'dw': 3.69, 'dh': 22.84, 'dcx': -0.01, 'dbase': -9.98} at {'dw': (4876, 'cheering', '#/focus'), 'dh': (18204, 'sipping', '#/focus'), 'dcx': (4732, 'cheering', '#/focus'), 'dbase': (4732, 'cheering', '#/focus')}

rAF trace after: 2249 frames; frames with !=1 figure 12; max single-frame delta {'dw': 4.49, 'dh': 22.84, 'dcx': -0.01, 'dbase': -2.22} at {'dbase': (6353, 'cheering', '#/focus'), 'dh': (21697, 'sipping', '#/focus'), 'dw': (5873, 'cheering', '#/focus'), 'dcx': (5761, 'cheering', '#/focus')}