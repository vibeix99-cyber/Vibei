
#### 1440x900 dark dpr1 full

| step | pose | side | img box x,y,w,h | ink x0,y0,x1,y1 (shot diff) | ink w x h | ink cx | baseline y |
|---|---|---|---|---|---|---|---|
| 1 focus running | reading | before | [514.64, 512.77, 185.09, 289.86] | [518.0, 712.0, 697.0, 800.0] | 179.0 x 88.0 | 607.5 | 800.0 |
| 1 focus running | reading | after | [514.64, 502.77, 185.09, 289.86] | [518.0, 505.0, 697.0, 791.0] | 179.0 x 286.0 | 607.5 | 791.0 |
| 2 whistle | cheering | before | [512.6, 542.05, 189.17, 250.03] | [545.0, 541.0, 698.0, 790.0] | 153.0 x 249.0 | 621.5 | 790.0 |
| 2 whistle | cheering | after | [512.5, 542.84, 189.37, 249.7] | [550.0, 545.0, 698.0, 786.0] | 148.0 x 241.0 | 624.0 | 786.0 |
| 3 summary | cheering | before | [514.34, 537.89, 185.69, 254.73] | [516.0, 541.0, 698.0, 790.0] | 182.0 x 249.0 | 607.0 | 790.0 |
| 3 summary | cheering | after | [514.34, 537.89, 185.69, 254.73] | [516.0, 540.0, 698.0, 791.0] | 182.0 x 251.0 | 607.0 | 791.0 |
| 4 tea break | sipping | before | [517.31, 500.39, 179.75, 292.23] | [520.0, 503.0, 694.0, 791.0] | 174.0 x 288.0 | 607.0 | 791.0 |
| 4 tea break | sipping | after | [517.31, 500.39, 179.75, 292.23] | [519.0, 503.0, 694.0, 791.0] | 175.0 x 288.0 | 606.5 | 791.0 |
| 5 next brew | reading | before | [514.64, 502.77, 185.09, 289.86] | [518.0, 506.0, 697.0, 790.0] | 179.0 x 284.0 | 607.5 | 790.0 |
| 5 next brew | reading | after | [514.64, 502.77, 185.09, 289.86] | [518.0, 505.0, 697.0, 791.0] | 179.0 x 286.0 | 607.5 | 791.0 |

Step-to-step deltas (CSS px, ink from the screenshot diff; `box` = the img element):

| transition | side | d box w | d box h | d box bottom | d ink w | d ink h | d ink cx | d baseline |
|---|---|---|---|---|---|---|---|---|
| 1>2 running>whistle | before | 4.08 | -39.83 | -10.54 | -26.0 | 161.0 | 14.0 | -10.0 |
| 1>2 running>whistle | after | 4.28 | -40.16 | -0.08 | -31.0 | -45.0 | 16.5 | -5.0 |
| 2>3 whistle>summary | before | -3.48 | 4.7 | 0.54 | 29.0 | 0.0 | -14.5 | 0.0 |
| 2>3 whistle>summary | after | -3.68 | 5.03 | 0.08 | 34.0 | 10.0 | -17.0 | 5.0 |
| 3>4 summary>tea break | before | -5.94 | 37.5 | 0.0 | -8.0 | 39.0 | 0.0 | 1.0 |
| 3>4 summary>tea break | after | -5.94 | 37.5 | 0.0 | -7.0 | 37.0 | -0.5 | 0.0 |
| 4>5 tea break>next brew | before | 5.34 | -2.37 | 0.0 | 5.0 | -4.0 | 0.5 | -1.0 |
| 4>5 tea break>next brew | after | 5.34 | -2.37 | 0.0 | 4.0 | -2.0 | 1.0 | 0.0 |

rAF trace before: 2732 frames; frames with !=1 figure 11; max single-frame delta {'dw': 6.06, 'dh': 37.5, 'dcx': 0.0, 'dbase': -10.0} at {'dw': (7340, 'cheering', '#/focus'), 'dh': (24988, 'sipping', '#/focus'), 'dbase': (7212, 'cheering', '#/focus'), 'dcx': (7692, 'cheering', '#/focus')}

rAF trace after: 2939 frames; frames with !=1 figure 8; max single-frame delta {'dw': -5.94, 'dh': 37.5, 'dcx': 0.0, 'dbase': -3.61} at {'dbase': (10160, 'cheering', '#/focus'), 'dh': (28847, 'sipping', '#/focus'), 'dw': (28847, 'sipping', '#/focus'), 'dcx': (10687, 'cheering', '#/focus')}

#### 1440x900 dark dpr1 reduce

| step | pose | side | img box x,y,w,h | ink x0,y0,x1,y1 (shot diff) | ink w x h | ink cx | baseline y |
|---|---|---|---|---|---|---|---|
| 1 focus running | reading | before | [514.64, 502.77, 185.09, 289.86] | [518.0, 506.0, 697.0, 790.0] | 179.0 x 284.0 | 607.5 | 790.0 |
| 1 focus running | reading | after | [514.64, 502.77, 185.09, 289.86] | [518.0, 509.0, 697.0, 791.0] | 179.0 x 282.0 | 607.5 | 791.0 |
| 2 whistle | cheering | before | [514.34, 537.89, 185.69, 254.73] | [516.0, 541.0, 698.0, 790.0] | 182.0 x 249.0 | 607.0 | 790.0 |
| 2 whistle | cheering | after | [514.34, 537.89, 185.69, 254.73] | [516.0, 540.0, 698.0, 791.0] | 182.0 x 251.0 | 607.0 | 791.0 |
| 3 summary | cheering | before | [514.34, 537.89, 185.69, 254.73] | [516.0, 541.0, 698.0, 790.0] | 182.0 x 249.0 | 607.0 | 790.0 |
| 3 summary | cheering | after | [514.34, 537.89, 185.69, 254.73] | [516.0, 540.0, 698.0, 791.0] | 182.0 x 251.0 | 607.0 | 791.0 |
| 4 tea break | sipping | before | [517.31, 500.39, 179.75, 292.23] | [520.0, 503.0, 694.0, 791.0] | 174.0 x 288.0 | 607.0 | 791.0 |
| 4 tea break | sipping | after | [517.31, 500.39, 179.75, 292.23] | [519.0, 503.0, 694.0, 791.0] | 175.0 x 288.0 | 606.5 | 791.0 |
| 5 next brew | reading | before | [514.64, 502.77, 185.09, 289.86] | [518.0, 506.0, 697.0, 790.0] | 179.0 x 284.0 | 607.5 | 790.0 |
| 5 next brew | reading | after | [514.64, 502.77, 185.09, 289.86] | [518.0, 505.0, 697.0, 791.0] | 179.0 x 286.0 | 607.5 | 791.0 |

Step-to-step deltas (CSS px, ink from the screenshot diff; `box` = the img element):

| transition | side | d box w | d box h | d box bottom | d ink w | d ink h | d ink cx | d baseline |
|---|---|---|---|---|---|---|---|---|
| 1>2 running>whistle | before | 0.6 | -35.13 | 0.0 | 3.0 | -35.0 | -0.5 | 0.0 |
| 1>2 running>whistle | after | 0.6 | -35.13 | 0.0 | 3.0 | -31.0 | -0.5 | 0.0 |
| 2>3 whistle>summary | before | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| 2>3 whistle>summary | after | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| 3>4 summary>tea break | before | -5.94 | 37.5 | 0.0 | -8.0 | 39.0 | 0.0 | 1.0 |
| 3>4 summary>tea break | after | -5.94 | 37.5 | 0.0 | -7.0 | 37.0 | -0.5 | 0.0 |
| 4>5 tea break>next brew | before | 5.34 | -2.37 | 0.0 | 5.0 | -4.0 | 0.5 | -1.0 |
| 4>5 tea break>next brew | after | 5.34 | -2.37 | 0.0 | 4.0 | -2.0 | 1.0 | 0.0 |

rAF trace before: 1758 frames; frames with !=1 figure 2; max single-frame delta {'dw': -5.94, 'dh': 37.5, 'dcx': 0, 'dbase': 0} at {'dw': (17946, 'sipping', '#/focus'), 'dh': (17946, 'sipping', '#/focus')}

rAF trace after: 1613 frames; frames with !=1 figure 2; max single-frame delta {'dw': -5.94, 'dh': 37.5, 'dcx': 0, 'dbase': 0} at {'dw': (16062, 'sipping', '#/focus'), 'dh': (16062, 'sipping', '#/focus')}

#### 1440x900 dark dpr2 full

| step | pose | side | img box x,y,w,h | ink x0,y0,x1,y1 (shot diff) | ink w x h | ink cx | baseline y |
|---|---|---|---|---|---|---|---|
| 1 focus running | reading | before | [514.64, 502.77, 185.09, 289.86] | [518.0, 506.0, 697.0, 790.0] | 179.0 x 284.0 | 607.5 | 790.0 |
| 1 focus running | reading | after | [514.64, 502.77, 185.09, 289.86] | [518.0, 505.0, 697.0, 790.5] | 179.0 x 285.5 | 607.5 | 790.5 |
| 2 whistle | cheering | before | [514.88, 521.63, 184.61, 257.56] | [541.5, 541.0, 697.5, 787.0] | 156.0 x 246.0 | 619.5 | 787.0 |
| 2 whistle | cheering | after | [510.63, 550.61, 193.11, 242.01] | [543.5, 542.0, 697.5, 790.5] | 154.0 x 248.5 | 620.5 | 790.5 |
| 3 summary | cheering | before | [514.34, 537.89, 185.69, 254.73] | [516.5, 541.0, 697.5, 790.0] | 181.0 x 249.0 | 607.0 | 790.0 |
| 3 summary | cheering | after | [514.34, 537.89, 185.69, 254.73] | [516.5, 540.5, 697.5, 790.5] | 181.0 x 250.0 | 607.0 | 790.5 |
| 4 tea break | sipping | before | [517.31, 500.39, 179.75, 292.23] | [519.5, 503.0, 694.0, 790.5] | 174.5 x 287.5 | 606.75 | 790.5 |
| 4 tea break | sipping | after | [517.31, 500.39, 179.75, 292.23] | [519.5, 502.5, 694.0, 790.5] | 174.5 x 288.0 | 606.75 | 790.5 |
| 5 next brew | reading | before | [514.64, 502.77, 185.09, 289.86] | [518.0, 506.0, 697.0, 790.0] | 179.0 x 284.0 | 607.5 | 790.0 |
| 5 next brew | reading | after | [514.64, 502.77, 185.09, 289.86] | [518.0, 505.0, 697.0, 790.5] | 179.0 x 285.5 | 607.5 | 790.5 |

Step-to-step deltas (CSS px, ink from the screenshot diff; `box` = the img element):

| transition | side | d box w | d box h | d box bottom | d ink w | d ink h | d ink cx | d baseline |
|---|---|---|---|---|---|---|---|---|
| 1>2 running>whistle | before | -0.48 | -32.3 | -13.43 | -23.0 | -38.0 | 12.0 | -3.0 |
| 1>2 running>whistle | after | 8.02 | -47.85 | 0.0 | -25.0 | -37.0 | 13.0 | 0.0 |
| 2>3 whistle>summary | before | 1.08 | -2.83 | 13.43 | 25.0 | 3.0 | -12.5 | 3.0 |
| 2>3 whistle>summary | after | -7.42 | 12.72 | 0.0 | 27.0 | 1.5 | -13.5 | 0.0 |
| 3>4 summary>tea break | before | -5.94 | 37.5 | 0.0 | -6.5 | 38.5 | -0.25 | 0.5 |
| 3>4 summary>tea break | after | -5.94 | 37.5 | 0.0 | -6.5 | 38.0 | -0.25 | 0.0 |
| 4>5 tea break>next brew | before | 5.34 | -2.37 | 0.0 | 4.5 | -3.5 | 0.75 | -0.5 |
| 4>5 tea break>next brew | after | 5.34 | -2.37 | 0.0 | 4.5 | -2.5 | 0.75 | 0.0 |

rAF trace before: 3489 frames; frames with !=1 figure 4; max single-frame delta {'dw': 6.06, 'dh': 37.5, 'dcx': -0.0, 'dbase': 13.44} at {'dbase': (11679, 'cheering', '#/focus'), 'dh': (32175, 'sipping', '#/focus'), 'dw': (11103, 'cheering', '#/focus'), 'dcx': (11679, 'cheering', '#/focus')}

rAF trace after: 3506 frames; frames with !=1 figure 4; max single-frame delta {'dw': -8.45, 'dh': 37.5, 'dcx': 0.0, 'dbase': -14.32} at {'dh': (32734, 'sipping', '#/focus'), 'dbase': (11518, 'cheering', '#/focus'), 'dw': (11518, 'cheering', '#/focus'), 'dcx': (11518, 'cheering', '#/focus')}

#### 1440x900 light dpr1 full

| step | pose | side | img box x,y,w,h | ink x0,y0,x1,y1 (shot diff) | ink w x h | ink cx | baseline y |
|---|---|---|---|---|---|---|---|
| 1 focus running | reading | before | [514.64, 502.77, 185.09, 289.86] | [518.0, 506.0, 697.0, 790.0] | 179.0 x 284.0 | 607.5 | 790.0 |
| 1 focus running | reading | after | [514.64, 502.77, 185.09, 289.86] | [518.0, 505.0, 697.0, 791.0] | 179.0 x 286.0 | 607.5 | 791.0 |
| 2 whistle | cheering | before | [512.6, 542.05, 189.17, 250.03] | [519.0, 541.0, 698.0, 789.0] | 179.0 x 248.0 | 608.5 | 789.0 |
| 2 whistle | cheering | after | [512.6, 542.05, 189.17, 250.03] | [519.0, 545.0, 697.0, 788.0] | 178.0 x 243.0 | 608.0 | 788.0 |
| 3 summary | cheering | before | [514.34, 537.89, 185.69, 254.73] | [516.0, 541.0, 698.0, 790.0] | 182.0 x 249.0 | 607.0 | 790.0 |
| 3 summary | cheering | after | [514.34, 537.89, 185.69, 254.73] | [516.0, 541.0, 697.0, 791.0] | 181.0 x 250.0 | 606.5 | 791.0 |
| 4 tea break | sipping | before | [517.31, 500.39, 179.75, 292.23] | [520.0, 503.0, 694.0, 791.0] | 174.0 x 288.0 | 607.0 | 791.0 |
| 4 tea break | sipping | after | [517.31, 500.39, 179.75, 292.23] | [519.0, 503.0, 694.0, 791.0] | 175.0 x 288.0 | 606.5 | 791.0 |
| 5 next brew | reading | before | [514.64, 502.77, 185.09, 289.86] | [518.0, 506.0, 697.0, 790.0] | 179.0 x 284.0 | 607.5 | 790.0 |
| 5 next brew | reading | after | [514.64, 502.77, 185.09, 289.86] | [518.0, 505.0, 697.0, 791.0] | 179.0 x 286.0 | 607.5 | 791.0 |

Step-to-step deltas (CSS px, ink from the screenshot diff; `box` = the img element):

| transition | side | d box w | d box h | d box bottom | d ink w | d ink h | d ink cx | d baseline |
|---|---|---|---|---|---|---|---|---|
| 1>2 running>whistle | before | 4.08 | -39.83 | -0.54 | 0.0 | -36.0 | 1.0 | -1.0 |
| 1>2 running>whistle | after | 4.08 | -39.83 | -0.54 | -1.0 | -43.0 | 0.5 | -3.0 |
| 2>3 whistle>summary | before | -3.48 | 4.7 | 0.54 | 3.0 | 1.0 | -1.5 | 1.0 |
| 2>3 whistle>summary | after | -3.48 | 4.7 | 0.54 | 3.0 | 7.0 | -1.5 | 3.0 |
| 3>4 summary>tea break | before | -5.94 | 37.5 | 0.0 | -8.0 | 39.0 | 0.0 | 1.0 |
| 3>4 summary>tea break | after | -5.94 | 37.5 | 0.0 | -6.0 | 38.0 | 0.0 | 0.0 |
| 4>5 tea break>next brew | before | 5.34 | -2.37 | 0.0 | 5.0 | -4.0 | 0.5 | -1.0 |
| 4>5 tea break>next brew | after | 5.34 | -2.37 | 0.0 | 4.0 | -2.0 | 1.0 | 0.0 |

rAF trace before: 2962 frames; frames with !=1 figure 7; max single-frame delta {'dw': -5.94, 'dh': 37.5, 'dcx': 0.0, 'dbase': -12.43} at {'dbase': (10300, 'cheering', '#/focus'), 'dh': (29420, 'sipping', '#/focus'), 'dw': (29420, 'sipping', '#/focus'), 'dcx': (10988, 'cheering', '#/focus')}

rAF trace after: 4681 frames; frames with !=1 figure 12; max single-frame delta {'dw': 6.38, 'dh': 37.5, 'dcx': -0.0, 'dbase': 6.56} at {'dbase': (10187, 'cheering', '#/focus'), 'dh': (43627, 'sipping', '#/focus'), 'dw': (10395, 'cheering', '#/focus'), 'dcx': (10683, 'cheering', '#/focus')}

#### 1440x900 light dpr1 reduce

| step | pose | side | img box x,y,w,h | ink x0,y0,x1,y1 (shot diff) | ink w x h | ink cx | baseline y |
|---|---|---|---|---|---|---|---|
| 1 focus running | reading | before | [514.64, 502.77, 185.09, 289.86] | [518.0, 506.0, 697.0, 790.0] | 179.0 x 284.0 | 607.5 | 790.0 |
| 1 focus running | reading | after | [514.64, 502.77, 185.09, 289.86] | [518.0, 518.0, 697.0, 791.0] | 179.0 x 273.0 | 607.5 | 791.0 |
| 2 whistle | cheering | before | [514.34, 537.89, 185.69, 254.73] | [516.0, 541.0, 698.0, 790.0] | 182.0 x 249.0 | 607.0 | 790.0 |
| 2 whistle | cheering | after | [514.34, 537.89, 185.69, 254.73] | [516.0, 541.0, 697.0, 791.0] | 181.0 x 250.0 | 606.5 | 791.0 |
| 3 summary | cheering | before | [514.34, 537.89, 185.69, 254.73] | [516.0, 541.0, 698.0, 790.0] | 182.0 x 249.0 | 607.0 | 790.0 |
| 3 summary | cheering | after | [514.34, 537.89, 185.69, 254.73] | [516.0, 541.0, 697.0, 791.0] | 181.0 x 250.0 | 606.5 | 791.0 |
| 4 tea break | sipping | before | [517.31, 500.39, 179.75, 292.23] | [520.0, 503.0, 694.0, 791.0] | 174.0 x 288.0 | 607.0 | 791.0 |
| 4 tea break | sipping | after | [517.31, 500.39, 179.75, 292.23] | [519.0, 503.0, 694.0, 791.0] | 175.0 x 288.0 | 606.5 | 791.0 |
| 5 next brew | reading | before | [514.64, 502.77, 185.09, 289.86] | [518.0, 506.0, 697.0, 790.0] | 179.0 x 284.0 | 607.5 | 790.0 |
| 5 next brew | reading | after | [514.64, 502.77, 185.09, 289.86] | [518.0, 505.0, 697.0, 791.0] | 179.0 x 286.0 | 607.5 | 791.0 |

Step-to-step deltas (CSS px, ink from the screenshot diff; `box` = the img element):

| transition | side | d box w | d box h | d box bottom | d ink w | d ink h | d ink cx | d baseline |
|---|---|---|---|---|---|---|---|---|
| 1>2 running>whistle | before | 0.6 | -35.13 | 0.0 | 3.0 | -35.0 | -0.5 | 0.0 |
| 1>2 running>whistle | after | 0.6 | -35.13 | 0.0 | 2.0 | -23.0 | -1.0 | 0.0 |
| 2>3 whistle>summary | before | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| 2>3 whistle>summary | after | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| 3>4 summary>tea break | before | -5.94 | 37.5 | 0.0 | -8.0 | 39.0 | 0.0 | 1.0 |
| 3>4 summary>tea break | after | -5.94 | 37.5 | 0.0 | -6.0 | 38.0 | 0.0 | 0.0 |
| 4>5 tea break>next brew | before | 5.34 | -2.37 | 0.0 | 5.0 | -4.0 | 0.5 | -1.0 |
| 4>5 tea break>next brew | after | 5.34 | -2.37 | 0.0 | 4.0 | -2.0 | 1.0 | 0.0 |

rAF trace before: 1522 frames; frames with !=1 figure 3; max single-frame delta {'dw': -5.94, 'dh': 37.5, 'dcx': 0, 'dbase': 0} at {'dw': (14874, 'sipping', '#/focus'), 'dh': (14874, 'sipping', '#/focus')}

rAF trace after: 2697 frames; frames with !=1 figure 3; max single-frame delta {'dw': -5.94, 'dh': 37.5, 'dcx': 0, 'dbase': 0} at {'dw': (25641, 'sipping', '#/focus'), 'dh': (25641, 'sipping', '#/focus')}

#### 1440x900 light dpr2 full

| step | pose | side | img box x,y,w,h | ink x0,y0,x1,y1 (shot diff) | ink w x h | ink cx | baseline y |
|---|---|---|---|---|---|---|---|
| 1 focus running | reading | before | [514.64, 502.77, 185.09, 289.86] | [518.5, 506.5, 697.0, 790.0] | 178.5 x 283.5 | 607.75 | 790.0 |
| 1 focus running | reading | after | [514.64, 502.77, 185.09, 289.86] | [518.0, 505.5, 697.0, 790.5] | 179.0 x 285.0 | 607.5 | 790.5 |
| 2 whistle | cheering | before | [514.18, 529.16, 186.02, 255.45] | [516.5, 541.0, 697.5, 790.0] | 181.0 x 249.0 | 607.0 | 790.0 |
| 2 whistle | reading | after | [514.64, 502.77, 185.09, 289.86] | [516.0, 541.0, 697.0, 790.5] | 181.0 x 249.5 | 606.5 | 790.5 |
| 3 summary | cheering | before | [514.34, 537.89, 185.69, 254.73] | [516.5, 541.0, 697.5, 790.0] | 181.0 x 249.0 | 607.0 | 790.0 |
| 3 summary | cheering | after | [514.34, 537.89, 185.69, 254.73] | [516.0, 541.0, 697.5, 790.5] | 181.5 x 249.5 | 606.75 | 790.5 |
| 4 tea break | sipping | before | [517.31, 500.39, 179.75, 292.23] | [520.0, 503.0, 694.0, 790.5] | 174.0 x 287.5 | 607.0 | 790.5 |
| 4 tea break | sipping | after | [517.31, 500.39, 179.75, 292.23] | [519.5, 503.0, 694.0, 791.0] | 174.5 x 288.0 | 606.75 | 791.0 |
| 5 next brew | reading | before | [514.64, 502.77, 185.09, 289.86] | [518.5, 506.5, 697.0, 790.0] | 178.5 x 283.5 | 607.75 | 790.0 |
| 5 next brew | reading | after | [514.64, 502.77, 185.09, 289.86] | [518.0, 505.5, 697.0, 790.5] | 179.0 x 285.0 | 607.5 | 790.5 |

Step-to-step deltas (CSS px, ink from the screenshot diff; `box` = the img element):

| transition | side | d box w | d box h | d box bottom | d ink w | d ink h | d ink cx | d baseline |
|---|---|---|---|---|---|---|---|---|
| 1>2 running>whistle | before | 0.93 | -34.41 | -8.02 | 2.5 | -34.5 | -0.75 | 0.0 |
| 1>2 running>whistle | after | 0.0 | 0.0 | 0.0 | 2.0 | -35.5 | -1.0 | 0.0 |
| 2>3 whistle>summary | before | -0.33 | -0.72 | 8.02 | 0.0 | 0.0 | 0.0 | 0.0 |
| 2>3 whistle>summary | after | 0.6 | -35.13 | 0.0 | 0.5 | 0.0 | 0.25 | 0.0 |
| 3>4 summary>tea break | before | -5.94 | 37.5 | 0.0 | -7.0 | 38.5 | 0.0 | 0.5 |
| 3>4 summary>tea break | after | -5.94 | 37.5 | 0.0 | -7.0 | 38.5 | 0.0 | 0.5 |
| 4>5 tea break>next brew | before | 5.34 | -2.37 | 0.0 | 4.5 | -4.0 | 0.75 | -0.5 |
| 4>5 tea break>next brew | after | 5.34 | -2.37 | 0.0 | 4.5 | -3.0 | 0.75 | -0.5 |

rAF trace before: 4419 frames; frames with !=1 figure 4; max single-frame delta {'dw': -5.94, 'dh': 37.5, 'dcx': -0.0, 'dbase': -12.77} at {'dbase': (11983, 'cheering', '#/focus'), 'dh': (33759, 'sipping', '#/focus'), 'dw': (33759, 'sipping', '#/focus'), 'dcx': (12447, 'cheering', '#/focus')}

rAF trace after: 6631 frames; frames with !=1 figure 12; max single-frame delta {'dw': -5.94, 'dh': 37.5, 'dcx': 0, 'dbase': -4.15} at {'dh': (71922, 'sipping', '#/focus'), 'dbase': (466, 'reading', '#/focus'), 'dw': (71922, 'sipping', '#/focus')}

#### 390x844 dark dpr1 full

| step | pose | side | img box x,y,w,h | ink x0,y0,x1,y1 (shot diff) | ink w x h | ink cx | baseline y |
|---|---|---|---|---|---|---|---|
| 1 focus running | reading | before | [236.09, 200.41, 112.8, 176.63] | [238.0, 202.0, 348.0, 376.0] | 110.0 x 174.0 | 293.0 | 376.0 |
| 1 focus running | reading | after | [236.09, 199.5, 112.8, 176.62] | [237.0, 201.0, 347.0, 375.0] | 110.0 x 174.0 | 292.0 | 375.0 |
| 2 whistle | cheering | before | [234.84, 218.5, 115.28, 152.37] | [263.0, 232.0, 346.0, 367.0] | 83.0 x 135.0 | 304.5 | 367.0 |
| 2 whistle | cheering | after | [235.44, 213.67, 114.1, 154.4] | [273.0, 232.0, 347.0, 367.0] | 74.0 x 135.0 | 310.0 | 367.0 |
| 3 summary | cheering | before | [235.91, 215.97, 113.16, 155.23] | [237.0, 218.0, 348.0, 370.0] | 111.0 x 152.0 | 292.5 | 370.0 |
| 3 summary | cheering | after | [235.91, 215.97, 113.16, 155.23] | [237.0, 217.0, 348.0, 370.0] | 111.0 x 153.0 | 292.5 | 370.0 |
| 4 tea break | sipping | before | [237.72, 193.11, 109.53, 178.08] | [239.0, 194.0, 346.0, 370.0] | 107.0 x 176.0 | 292.5 | 370.0 |
| 4 tea break | sipping | after | [237.72, 193.11, 109.53, 178.08] | [239.0, 194.0, 345.0, 370.0] | 106.0 x 176.0 | 292.0 | 370.0 |
| 5 next brew | reading | before | [236.09, 194.56, 112.8, 176.62] | [238.0, 196.0, 348.0, 370.0] | 110.0 x 174.0 | 293.0 | 370.0 |
| 5 next brew | reading | after | [236.09, 194.56, 112.8, 176.62] | [237.0, 196.0, 347.0, 370.0] | 110.0 x 174.0 | 292.0 | 370.0 |

Step-to-step deltas (CSS px, ink from the screenshot diff; `box` = the img element):

| transition | side | d box w | d box h | d box bottom | d ink w | d ink h | d ink cx | d baseline |
|---|---|---|---|---|---|---|---|---|
| 1>2 running>whistle | before | 2.48 | -24.26 | -6.16 | -27.0 | -39.0 | 11.5 | -9.0 |
| 1>2 running>whistle | after | 1.3 | -22.22 | -8.05 | -36.0 | -39.0 | 18.0 | -8.0 |
| 2>3 whistle>summary | before | -2.12 | 2.86 | 0.33 | 28.0 | 17.0 | -12.0 | 3.0 |
| 2>3 whistle>summary | after | -0.94 | 0.83 | 3.13 | 37.0 | 18.0 | -17.5 | 3.0 |
| 3>4 summary>tea break | before | -3.63 | 22.85 | -0.01 | -4.0 | 24.0 | 0.0 | 0.0 |
| 3>4 summary>tea break | after | -3.63 | 22.85 | -0.01 | -5.0 | 23.0 | -0.5 | 0.0 |
| 4>5 tea break>next brew | before | 3.27 | -1.46 | 0.0 | 3.0 | -2.0 | 0.5 | 0.0 |
| 4>5 tea break>next brew | after | 3.27 | -1.46 | 0.0 | 4.0 | -2.0 | 0.0 | 0.0 |

rAF trace before: 2315 frames; frames with !=1 figure 6; max single-frame delta {'dw': -3.62, 'dh': 22.84, 'dcx': -0.01, 'dbase': -5.83} at {'dh': (22903, 'sipping', '#/focus'), 'dbase': (7495, 'cheering', '#/focus'), 'dw': (22903, 'sipping', '#/focus'), 'dcx': (7495, 'cheering', '#/focus')}

rAF trace after: 2163 frames; frames with !=1 figure 9; max single-frame delta {'dw': -3.62, 'dh': 22.84, 'dcx': -0.01, 'dbase': -4.92} at {'dbase': (5822, 'cheering', '#/focus'), 'dw': (22254, 'sipping', '#/focus'), 'dh': (22254, 'sipping', '#/focus'), 'dcx': (5822, 'cheering', '#/focus')}

#### 390x844 dark dpr1 reduce

| step | pose | side | img box x,y,w,h | ink x0,y0,x1,y1 (shot diff) | ink w x h | ink cx | baseline y |
|---|---|---|---|---|---|---|---|
| 1 focus running | reading | before | [236.09, 194.56, 112.8, 176.62] | [238.0, 201.0, 348.0, 370.0] | 110.0 x 169.0 | 293.0 | 370.0 |
| 1 focus running | reading | after | [236.09, 194.56, 112.8, 176.62] | [237.0, 317.0, 347.0, 370.0] | 110.0 x 53.0 | 292.0 | 370.0 |
| 2 whistle | cheering | before | [235.91, 215.97, 113.16, 155.23] | [237.0, 218.0, 348.0, 370.0] | 111.0 x 152.0 | 292.5 | 370.0 |
| 2 whistle | cheering | after | [235.91, 215.97, 113.16, 155.23] | [237.0, 217.0, 348.0, 370.0] | 111.0 x 153.0 | 292.5 | 370.0 |
| 3 summary | cheering | before | [235.91, 215.97, 113.16, 155.23] | [237.0, 218.0, 348.0, 370.0] | 111.0 x 152.0 | 292.5 | 370.0 |
| 3 summary | cheering | after | [235.91, 215.97, 113.16, 155.23] | [237.0, 217.0, 348.0, 370.0] | 111.0 x 153.0 | 292.5 | 370.0 |
| 4 tea break | sipping | before | [237.72, 193.11, 109.53, 178.08] | [239.0, 194.0, 346.0, 370.0] | 107.0 x 176.0 | 292.5 | 370.0 |
| 4 tea break | sipping | after | [237.72, 193.11, 109.53, 178.08] | [239.0, 194.0, 345.0, 370.0] | 106.0 x 176.0 | 292.0 | 370.0 |
| 5 next brew | reading | before | [236.09, 194.56, 112.8, 176.62] | [238.0, 196.0, 348.0, 370.0] | 110.0 x 174.0 | 293.0 | 370.0 |
| 5 next brew | reading | after | [236.09, 194.56, 112.8, 176.62] | [237.0, 196.0, 347.0, 370.0] | 110.0 x 174.0 | 292.0 | 370.0 |

Step-to-step deltas (CSS px, ink from the screenshot diff; `box` = the img element):

| transition | side | d box w | d box h | d box bottom | d ink w | d ink h | d ink cx | d baseline |
|---|---|---|---|---|---|---|---|---|
| 1>2 running>whistle | before | 0.36 | -21.39 | 0.01 | 1.0 | -17.0 | -0.5 | 0.0 |
| 1>2 running>whistle | after | 0.36 | -21.39 | 0.01 | 1.0 | 100.0 | 0.5 | 0.0 |
| 2>3 whistle>summary | before | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| 2>3 whistle>summary | after | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| 3>4 summary>tea break | before | -3.63 | 22.85 | -0.01 | -4.0 | 24.0 | 0.0 | 0.0 |
| 3>4 summary>tea break | after | -3.63 | 22.85 | -0.01 | -5.0 | 23.0 | -0.5 | 0.0 |
| 4>5 tea break>next brew | before | 3.27 | -1.46 | 0.0 | 3.0 | -2.0 | 0.5 | 0.0 |
| 4>5 tea break>next brew | after | 3.27 | -1.46 | 0.0 | 4.0 | -2.0 | 0.0 | 0.0 |

rAF trace before: 1336 frames; frames with !=1 figure 3; max single-frame delta {'dw': -3.62, 'dh': 22.84, 'dcx': -0.01, 'dbase': 0.02} at {'dw': (13154, 'sipping', '#/focus'), 'dh': (13154, 'sipping', '#/focus'), 'dcx': (4145, 'cheering', '#/focus'), 'dbase': (4145, 'cheering', '#/focus')}

rAF trace after: 1227 frames; frames with !=1 figure 1; max single-frame delta {'dw': -3.62, 'dh': 22.84, 'dcx': -0.01, 'dbase': 0.02} at {'dw': (11563, 'sipping', '#/focus'), 'dh': (11563, 'sipping', '#/focus'), 'dcx': (3227, 'cheering', '#/focus'), 'dbase': (3227, 'cheering', '#/focus')}

#### 390x844 dark dpr2 full

| step | pose | side | img box x,y,w,h | ink x0,y0,x1,y1 (shot diff) | ink w x h | ink cx | baseline y |
|---|---|---|---|---|---|---|---|
| 1 focus running | reading | before | [236.09, 194.56, 112.8, 176.62] | [238.0, 196.5, 347.0, 369.0] | 109.0 x 172.5 | 292.5 | 369.0 |
| 1 focus running | reading | after | [236.09, 195.19, 112.8, 176.62] | [237.5, 197.0, 347.0, 370.5] | 109.5 x 173.5 | 292.25 | 370.5 |
| 2 whistle | cheering | before | [236.8, 202.56, 111.38, 159.06] | [254.0, 217.5, 347.5, 369.5] | 93.5 x 152.0 | 300.75 | 369.5 |
| 2 whistle | cheering | after | [235.03, 218.38, 114.91, 152.83] | [254.5, 217.5, 347.5, 369.5] | 93.0 x 152.0 | 301.0 | 369.5 |
| 3 summary | cheering | before | [235.91, 215.97, 113.16, 155.23] | [237.5, 217.5, 347.5, 369.5] | 110.0 x 152.0 | 292.5 | 369.5 |
| 3 summary | cheering | after | [235.91, 215.97, 113.16, 155.23] | [237.5, 217.5, 347.5, 369.5] | 110.0 x 152.0 | 292.5 | 369.5 |
| 4 tea break | sipping | before | [237.72, 193.11, 109.53, 178.08] | [239.5, 194.5, 345.5, 369.5] | 106.0 x 175.0 | 292.5 | 369.5 |
| 4 tea break | sipping | after | [237.72, 193.11, 109.53, 178.08] | [239.5, 194.5, 345.5, 369.5] | 106.0 x 175.0 | 292.5 | 369.5 |
| 5 next brew | reading | before | [236.09, 194.56, 112.8, 176.62] | [238.0, 196.5, 347.0, 369.0] | 109.0 x 172.5 | 292.5 | 369.0 |
| 5 next brew | reading | after | [236.09, 194.56, 112.8, 176.62] | [237.5, 196.5, 347.0, 369.5] | 109.5 x 173.0 | 292.25 | 369.5 |

Step-to-step deltas (CSS px, ink from the screenshot diff; `box` = the img element):

| transition | side | d box w | d box h | d box bottom | d ink w | d ink h | d ink cx | d baseline |
|---|---|---|---|---|---|---|---|---|
| 1>2 running>whistle | before | -1.42 | -17.56 | -9.57 | -15.5 | -20.5 | 8.25 | 0.5 |
| 1>2 running>whistle | after | 2.11 | -23.79 | -0.61 | -16.5 | -21.5 | 8.75 | -1.0 |
| 2>3 whistle>summary | before | 1.78 | -3.83 | 9.58 | 16.5 | 0.0 | -8.25 | 0.0 |
| 2>3 whistle>summary | after | -1.75 | 2.4 | 0.0 | 17.0 | 0.0 | -8.5 | 0.0 |
| 3>4 summary>tea break | before | -3.63 | 22.85 | -0.01 | -4.0 | 23.0 | 0.0 | 0.0 |
| 3>4 summary>tea break | after | -3.63 | 22.85 | -0.01 | -4.0 | 23.0 | 0.0 | 0.0 |
| 4>5 tea break>next brew | before | 3.27 | -1.46 | 0.0 | 3.0 | -2.5 | 0.0 | -0.5 |
| 4>5 tea break>next brew | after | 3.27 | -1.46 | 0.0 | 3.5 | -2.0 | -0.25 | 0.0 |

rAF trace before: 2389 frames; frames with !=1 figure 8; max single-frame delta {'dw': 4.49, 'dh': 22.84, 'dcx': -0.01, 'dbase': 9.58} at {'dh': (22316, 'sipping', '#/focus'), 'dbase': (7868, 'cheering', '#/focus'), 'dw': (7676, 'cheering', '#/focus'), 'dcx': (6940, 'cheering', '#/focus')}

rAF trace after: 1988 frames; frames with !=1 figure 17; max single-frame delta {'dw': 3.89, 'dh': 22.84, 'dcx': -0.01, 'dbase': -4.23} at {'dh': (19589, 'sipping', '#/focus'), 'dbase': (7222, 'cheering', '#/focus'), 'dw': (7589, 'cheering', '#/focus'), 'dcx': (7077, 'cheering', '#/focus')}

#### 390x844 light dpr1 full

| step | pose | side | img box x,y,w,h | ink x0,y0,x1,y1 (shot diff) | ink w x h | ink cx | baseline y |
|---|---|---|---|---|---|---|---|
| 1 focus running | reading | before | [236.09, 194.56, 112.8, 176.62] | [238.0, 253.0, 348.0, 370.0] | 110.0 x 117.0 | 293.0 | 370.0 |
| 1 focus running | reading | after | [236.09, 195.25, 112.8, 176.63] | [237.0, 196.0, 347.0, 371.0] | 110.0 x 175.0 | 292.0 | 371.0 |
| 2 whistle | cheering | before | [235.03, 218.38, 114.91, 152.82] | [237.0, 218.0, 348.0, 367.0] | 111.0 x 149.0 | 292.5 | 367.0 |
| 2 whistle | cheering | after | [234.84, 218.5, 115.28, 152.37] | [240.0, 232.0, 345.0, 366.0] | 105.0 x 134.0 | 292.5 | 366.0 |
| 3 summary | cheering | before | [235.91, 215.97, 113.16, 155.23] | [237.0, 217.0, 348.0, 369.0] | 111.0 x 152.0 | 292.5 | 369.0 |
| 3 summary | cheering | after | [235.91, 215.97, 113.16, 155.23] | [237.0, 217.0, 348.0, 370.0] | 111.0 x 153.0 | 292.5 | 370.0 |
| 4 tea break | sipping | before | [237.72, 193.11, 109.53, 178.08] | [239.0, 194.0, 345.0, 370.0] | 106.0 x 176.0 | 292.0 | 370.0 |
| 4 tea break | sipping | after | [237.72, 193.11, 109.53, 178.08] | [239.0, 194.0, 345.0, 370.0] | 106.0 x 176.0 | 292.0 | 370.0 |
| 5 next brew | reading | before | [236.09, 194.56, 112.8, 176.62] | [238.0, 196.0, 348.0, 370.0] | 110.0 x 174.0 | 293.0 | 370.0 |
| 5 next brew | reading | after | [236.09, 194.56, 112.8, 176.62] | [237.0, 196.0, 347.0, 370.0] | 110.0 x 174.0 | 292.0 | 370.0 |

Step-to-step deltas (CSS px, ink from the screenshot diff; `box` = the img element):

| transition | side | d box w | d box h | d box bottom | d ink w | d ink h | d ink cx | d baseline |
|---|---|---|---|---|---|---|---|---|
| 1>2 running>whistle | before | 2.11 | -23.8 | 0.01 | 1.0 | 32.0 | -0.5 | -3.0 |
| 1>2 running>whistle | after | 2.48 | -24.26 | -1.01 | -5.0 | -41.0 | 0.5 | -5.0 |
| 2>3 whistle>summary | before | -1.75 | 2.41 | 0.0 | 0.0 | 3.0 | 0.0 | 2.0 |
| 2>3 whistle>summary | after | -2.12 | 2.86 | 0.33 | 6.0 | 19.0 | 0.0 | 4.0 |
| 3>4 summary>tea break | before | -3.63 | 22.85 | -0.01 | -5.0 | 24.0 | -0.5 | 1.0 |
| 3>4 summary>tea break | after | -3.63 | 22.85 | -0.01 | -5.0 | 23.0 | -0.5 | 0.0 |
| 4>5 tea break>next brew | before | 3.27 | -1.46 | 0.0 | 4.0 | -2.0 | 1.0 | 0.0 |
| 4>5 tea break>next brew | after | 3.27 | -1.46 | 0.0 | 4.0 | -2.0 | 0.0 | 0.0 |

rAF trace before: 2098 frames; frames with !=1 figure 5; max single-frame delta {'dw': -3.62, 'dh': 22.84, 'dcx': -0.01, 'dbase': -4.29} at {'dh': (19083, 'sipping', '#/focus'), 'dbase': (7371, 'cheering', '#/focus'), 'dw': (19083, 'sipping', '#/focus'), 'dcx': (6779, 'cheering', '#/focus')}

rAF trace after: 2324 frames; frames with !=1 figure 11; max single-frame delta {'dw': 3.69, 'dh': 22.84, 'dcx': -0.01, 'dbase': -2.44} at {'dbase': (393, 'reading', '#/focus'), 'dh': (23257, 'sipping', '#/focus'), 'dw': (8489, 'cheering', '#/focus'), 'dcx': (8377, 'cheering', '#/focus')}

#### 390x844 light dpr1 reduce

| step | pose | side | img box x,y,w,h | ink x0,y0,x1,y1 (shot diff) | ink w x h | ink cx | baseline y |
|---|---|---|---|---|---|---|---|
| 1 focus running | reading | before | [236.09, 194.56, 112.8, 176.62] | [238.0, 196.0, 348.0, 370.0] | 110.0 x 174.0 | 293.0 | 370.0 |
| 1 focus running | reading | after | [236.09, 194.56, 112.8, 176.62] | [237.0, 253.0, 347.0, 370.0] | 110.0 x 117.0 | 292.0 | 370.0 |
| 2 whistle | cheering | before | [235.91, 215.97, 113.16, 155.23] | [237.0, 217.0, 348.0, 369.0] | 111.0 x 152.0 | 292.5 | 369.0 |
| 2 whistle | cheering | after | [235.91, 215.97, 113.16, 155.23] | [237.0, 217.0, 348.0, 370.0] | 111.0 x 153.0 | 292.5 | 370.0 |
| 3 summary | cheering | before | [235.91, 215.97, 113.16, 155.23] | [237.0, 217.0, 348.0, 369.0] | 111.0 x 152.0 | 292.5 | 369.0 |
| 3 summary | cheering | after | [235.91, 215.97, 113.16, 155.23] | [237.0, 217.0, 348.0, 370.0] | 111.0 x 153.0 | 292.5 | 370.0 |
| 4 tea break | sipping | before | [237.72, 193.11, 109.53, 178.08] | [239.0, 194.0, 345.0, 370.0] | 106.0 x 176.0 | 292.0 | 370.0 |
| 4 tea break | sipping | after | [237.72, 193.11, 109.53, 178.08] | [239.0, 194.0, 345.0, 370.0] | 106.0 x 176.0 | 292.0 | 370.0 |
| 5 next brew | reading | before | [236.09, 194.56, 112.8, 176.62] | [238.0, 196.0, 348.0, 370.0] | 110.0 x 174.0 | 293.0 | 370.0 |
| 5 next brew | reading | after | [236.09, 194.56, 112.8, 176.62] | [237.0, 196.0, 347.0, 370.0] | 110.0 x 174.0 | 292.0 | 370.0 |

Step-to-step deltas (CSS px, ink from the screenshot diff; `box` = the img element):

| transition | side | d box w | d box h | d box bottom | d ink w | d ink h | d ink cx | d baseline |
|---|---|---|---|---|---|---|---|---|
| 1>2 running>whistle | before | 0.36 | -21.39 | 0.01 | 1.0 | -22.0 | -0.5 | -1.0 |
| 1>2 running>whistle | after | 0.36 | -21.39 | 0.01 | 1.0 | 36.0 | 0.5 | 0.0 |
| 2>3 whistle>summary | before | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| 2>3 whistle>summary | after | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| 3>4 summary>tea break | before | -3.63 | 22.85 | -0.01 | -5.0 | 24.0 | -0.5 | 1.0 |
| 3>4 summary>tea break | after | -3.63 | 22.85 | -0.01 | -5.0 | 23.0 | -0.5 | 0.0 |
| 4>5 tea break>next brew | before | 3.27 | -1.46 | 0.0 | 4.0 | -2.0 | 1.0 | 0.0 |
| 4>5 tea break>next brew | after | 3.27 | -1.46 | 0.0 | 4.0 | -2.0 | 0.0 | 0.0 |

rAF trace before: 1168 frames; frames with !=1 figure 2; max single-frame delta {'dw': -3.62, 'dh': 22.84, 'dcx': -0.01, 'dbase': 0.02} at {'dw': (11280, 'sipping', '#/focus'), 'dh': (11280, 'sipping', '#/focus'), 'dcx': (3007, 'cheering', '#/focus'), 'dbase': (3007, 'cheering', '#/focus')}

rAF trace after: 1234 frames; frames with !=1 figure 2; max single-frame delta {'dw': -3.62, 'dh': 22.84, 'dcx': -0.01, 'dbase': 0.02} at {'dw': (11497, 'sipping', '#/focus'), 'dh': (11497, 'sipping', '#/focus'), 'dcx': (3577, 'cheering', '#/focus'), 'dbase': (3577, 'cheering', '#/focus')}

#### 390x844 light dpr2 full

| step | pose | side | img box x,y,w,h | ink x0,y0,x1,y1 (shot diff) | ink w x h | ink cx | baseline y |
|---|---|---|---|---|---|---|---|
| 1 focus running | reading | before | [236.09, 204.56, 112.8, 176.62] | [238.0, 206.5, 347.0, 379.0] | 109.0 x 172.5 | 292.5 | 379.0 |
| 1 focus running | reading | after | [236.09, 194.59, 112.8, 176.62] | [237.5, 196.5, 347.0, 369.5] | 109.5 x 173.0 | 292.25 | 369.5 |
| 2 whistle | cheering | before | [235.16, 215.94, 114.65, 153.45] | [237.5, 217.5, 347.5, 368.5] | 110.0 x 151.0 | 292.5 | 368.5 |
| 2 whistle | cheering | after | [234.79, 219.03, 115.39, 152.17] | [237.5, 217.5, 347.5, 368.5] | 110.0 x 151.0 | 292.5 | 368.5 |
| 3 summary | cheering | before | [235.91, 215.97, 113.16, 155.23] | [237.5, 217.5, 347.5, 369.5] | 110.0 x 152.0 | 292.5 | 369.5 |
| 3 summary | cheering | after | [235.91, 215.97, 113.16, 155.23] | [237.5, 217.5, 347.5, 369.5] | 110.0 x 152.0 | 292.5 | 369.5 |
| 4 tea break | sipping | before | [237.72, 193.11, 109.53, 178.08] | [239.5, 195.0, 345.5, 369.5] | 106.0 x 174.5 | 292.5 | 369.5 |
| 4 tea break | sipping | after | [237.72, 193.11, 109.53, 178.08] | [239.5, 194.5, 345.5, 369.5] | 106.0 x 175.0 | 292.5 | 369.5 |
| 5 next brew | reading | before | [236.09, 194.56, 112.8, 176.62] | [238.0, 196.5, 347.0, 369.0] | 109.0 x 172.5 | 292.5 | 369.0 |
| 5 next brew | reading | after | [236.09, 194.56, 112.8, 176.62] | [237.5, 196.5, 347.0, 369.5] | 109.5 x 173.0 | 292.25 | 369.5 |

Step-to-step deltas (CSS px, ink from the screenshot diff; `box` = the img element):

| transition | side | d box w | d box h | d box bottom | d ink w | d ink h | d ink cx | d baseline |
|---|---|---|---|---|---|---|---|---|
| 1>2 running>whistle | before | 1.85 | -23.17 | -11.8 | 1.0 | -21.5 | 0.0 | -10.5 |
| 1>2 running>whistle | after | 2.59 | -24.45 | -0.01 | 0.5 | -22.0 | 0.25 | -1.0 |
| 2>3 whistle>summary | before | -1.49 | 1.78 | 1.81 | 0.0 | 1.0 | 0.0 | 1.0 |
| 2>3 whistle>summary | after | -2.23 | 3.06 | 0.0 | 0.0 | 1.0 | 0.0 | 1.0 |
| 3>4 summary>tea break | before | -3.63 | 22.85 | -0.01 | -4.0 | 22.5 | 0.0 | 0.0 |
| 3>4 summary>tea break | after | -3.63 | 22.85 | -0.01 | -4.0 | 23.0 | 0.0 | 0.0 |
| 4>5 tea break>next brew | before | 3.27 | -1.46 | 0.0 | 3.0 | -2.0 | 0.0 | -0.5 |
| 4>5 tea break>next brew | after | 3.27 | -1.46 | 0.0 | 3.5 | -2.0 | -0.25 | 0.0 |

rAF trace before: 2065 frames; frames with !=1 figure 3; max single-frame delta {'dw': 3.69, 'dh': 22.84, 'dcx': -0.01, 'dbase': -9.98} at {'dw': (4876, 'cheering', '#/focus'), 'dh': (18204, 'sipping', '#/focus'), 'dcx': (4732, 'cheering', '#/focus'), 'dbase': (4732, 'cheering', '#/focus')}

rAF trace after: 2249 frames; frames with !=1 figure 12; max single-frame delta {'dw': 4.49, 'dh': 22.84, 'dcx': -0.01, 'dbase': -2.22} at {'dbase': (6353, 'cheering', '#/focus'), 'dh': (21697, 'sipping', '#/focus'), 'dw': (5873, 'cheering', '#/focus'), 'dcx': (5761, 'cheering', '#/focus')}