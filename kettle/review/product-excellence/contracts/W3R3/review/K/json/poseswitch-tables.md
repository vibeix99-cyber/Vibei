
#### 1440x900 light dpr1 full

| step | pose | side | img box x,y,w,h | ink x0,y0,x1,y1 (shot diff) | ink w x h | ink cx | baseline y |
|---|---|---|---|---|---|---|---|
| 1 focus running | reading | before | [514.64, 502.77, 185.09, 289.86] | [np.float64(518.0), np.float64(506.0), np.float64(697.0), np.float64(790.0)] | 179.0 x 284.0 | 607.5 | 790.0 |
| 1 focus running | reading | after | [514.64, 502.77, 185.09, 289.86] | [np.float64(518.0), np.float64(505.0), np.float64(697.0), np.float64(791.0)] | 179.0 x 286.0 | 607.5 | 791.0 |
| 2 whistle | cheering | before | [512.9, 541.84, 188.57, 250.78] | [np.float64(516.0), np.float64(541.0), np.float64(698.0), np.float64(790.0)] | 182.0 x 249.0 | 607.0 | 790.0 |
| 2 whistle | cheering | after | [512.9, 541.84, 188.57, 250.78] | [np.float64(516.0), np.float64(541.0), np.float64(697.0), np.float64(791.0)] | 181.0 x 250.0 | 606.5 | 791.0 |
| 3 summary | cheering | before | [514.34, 537.89, 185.69, 254.73] | [np.float64(516.0), np.float64(541.0), np.float64(698.0), np.float64(790.0)] | 182.0 x 249.0 | 607.0 | 790.0 |
| 3 summary | cheering | after | [514.34, 537.89, 185.69, 254.73] | [np.float64(516.0), np.float64(541.0), np.float64(697.0), np.float64(791.0)] | 181.0 x 250.0 | 606.5 | 791.0 |
| 4 tea break | sipping | before | [517.31, 500.39, 179.75, 292.23] | [np.float64(520.0), np.float64(503.0), np.float64(694.0), np.float64(791.0)] | 174.0 x 288.0 | 607.0 | 791.0 |
| 4 tea break | sipping | after | [517.31, 500.39, 179.75, 292.23] | [np.float64(519.0), np.float64(503.0), np.float64(694.0), np.float64(791.0)] | 175.0 x 288.0 | 606.5 | 791.0 |
| 5 next brew | reading | before | [514.64, 502.77, 185.09, 289.86] | [np.float64(518.0), np.float64(506.0), np.float64(697.0), np.float64(790.0)] | 179.0 x 284.0 | 607.5 | 790.0 |
| 5 next brew | reading | after | [514.64, 502.77, 185.09, 289.86] | [np.float64(518.0), np.float64(505.0), np.float64(697.0), np.float64(791.0)] | 179.0 x 286.0 | 607.5 | 791.0 |

Step-to-step deltas (CSS px, ink from the screenshot diff; `box` = the img element):

| transition | side | d box w | d box h | d box bottom | d ink w | d ink h | d ink cx | d baseline |
|---|---|---|---|---|---|---|---|---|
| 1>2 running>whistle | before | 3.48 | -39.08 | 0.0 | 3.0 | -35.0 | -0.5 | 0.0 |
| 1>2 running>whistle | after | 3.48 | -39.08 | 0.0 | 2.0 | -36.0 | -1.0 | 0.0 |
| 2>3 whistle>summary | before | -2.88 | 3.95 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| 2>3 whistle>summary | after | -2.88 | 3.95 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| 3>4 summary>tea break | before | -5.94 | 37.5 | 0.0 | -8.0 | 39.0 | 0.0 | 1.0 |
| 3>4 summary>tea break | after | -5.94 | 37.5 | 0.0 | -6.0 | 38.0 | 0.0 | 0.0 |
| 4>5 tea break>next brew | before | 5.34 | -2.37 | 0.0 | 5.0 | -4.0 | 0.5 | -1.0 |
| 4>5 tea break>next brew | after | 5.34 | -2.37 | 0.0 | 4.0 | -2.0 | 1.0 | 0.0 |

rAF trace before: 1931 frames; frames with !=1 figure 5; max single-frame delta {'dw': 7.18, 'dh': 37.5, 'dcx': 0.0, 'dbase': -3.61} at {'dbase': (4786, 'cheering', '#/focus'), 'dh': (18290, 'sipping', '#/focus'), 'dw': (4738, 'cheering', '#/focus'), 'dcx': (5442, 'cheering', '#/focus')}

rAF trace after: 1582 frames; frames with !=1 figure 6; max single-frame delta {'dw': -5.94, 'dh': 37.5, 'dcx': -0.0, 'dbase': -3.61} at {'dbase': (5835, 'cheering', '#/focus'), 'dh': (14731, 'sipping', '#/focus'), 'dw': (14731, 'sipping', '#/focus'), 'dcx': (6559, 'cheering', '#/focus')}

#### 1440x900 light dpr1 reduce

| step | pose | side | img box x,y,w,h | ink x0,y0,x1,y1 (shot diff) | ink w x h | ink cx | baseline y |
|---|---|---|---|---|---|---|---|
| 1 focus running | reading | before | [514.64, 502.77, 185.09, 289.86] | [np.float64(506.0), np.float64(494.0), np.float64(708.0), np.float64(790.0)] | 202.0 x 296.0 | 607.0 | 790.0 |
| 1 focus running | reading | after | [514.64, 502.77, 185.09, 289.86] | [np.float64(518.0), np.float64(505.0), np.float64(697.0), np.float64(791.0)] | 179.0 x 286.0 | 607.5 | 791.0 |
| 2 whistle | cheering | before | [514.34, 537.89, 185.69, 254.73] | [np.float64(516.0), np.float64(541.0), np.float64(698.0), np.float64(790.0)] | 182.0 x 249.0 | 607.0 | 790.0 |
| 2 whistle | cheering | after | [514.34, 537.89, 185.69, 254.73] | [np.float64(516.0), np.float64(541.0), np.float64(697.0), np.float64(791.0)] | 181.0 x 250.0 | 606.5 | 791.0 |
| 3 summary | cheering | before | [514.34, 537.89, 185.69, 254.73] | [np.float64(516.0), np.float64(541.0), np.float64(698.0), np.float64(790.0)] | 182.0 x 249.0 | 607.0 | 790.0 |
| 3 summary | cheering | after | [514.34, 537.89, 185.69, 254.73] | [np.float64(516.0), np.float64(541.0), np.float64(697.0), np.float64(791.0)] | 181.0 x 250.0 | 606.5 | 791.0 |
| 4 tea break | sipping | before | [517.31, 500.39, 179.75, 292.23] | [np.float64(520.0), np.float64(503.0), np.float64(694.0), np.float64(791.0)] | 174.0 x 288.0 | 607.0 | 791.0 |
| 4 tea break | sipping | after | [517.31, 500.39, 179.75, 292.23] | [np.float64(519.0), np.float64(503.0), np.float64(694.0), np.float64(791.0)] | 175.0 x 288.0 | 606.5 | 791.0 |
| 5 next brew | reading | before | [514.64, 502.77, 185.09, 289.86] | [np.float64(518.0), np.float64(506.0), np.float64(697.0), np.float64(790.0)] | 179.0 x 284.0 | 607.5 | 790.0 |
| 5 next brew | reading | after | [514.64, 502.77, 185.09, 289.86] | [np.float64(518.0), np.float64(505.0), np.float64(697.0), np.float64(791.0)] | 179.0 x 286.0 | 607.5 | 791.0 |

Step-to-step deltas (CSS px, ink from the screenshot diff; `box` = the img element):

| transition | side | d box w | d box h | d box bottom | d ink w | d ink h | d ink cx | d baseline |
|---|---|---|---|---|---|---|---|---|
| 1>2 running>whistle | before | 0.6 | -35.13 | 0.0 | -20.0 | -47.0 | 0.0 | 0.0 |
| 1>2 running>whistle | after | 0.6 | -35.13 | 0.0 | 2.0 | -36.0 | -1.0 | 0.0 |
| 2>3 whistle>summary | before | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| 2>3 whistle>summary | after | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| 3>4 summary>tea break | before | -5.94 | 37.5 | 0.0 | -8.0 | 39.0 | 0.0 | 1.0 |
| 3>4 summary>tea break | after | -5.94 | 37.5 | 0.0 | -6.0 | 38.0 | 0.0 | 0.0 |
| 4>5 tea break>next brew | before | 5.34 | -2.37 | 0.0 | 5.0 | -4.0 | 0.5 | -1.0 |
| 4>5 tea break>next brew | after | 5.34 | -2.37 | 0.0 | 4.0 | -2.0 | 1.0 | 0.0 |

rAF trace before: 1088 frames; frames with !=1 figure 2; max single-frame delta {'dw': -5.94, 'dh': 37.5, 'dcx': 0, 'dbase': 0} at {'dw': (10959, 'sipping', '#/focus'), 'dh': (10959, 'sipping', '#/focus')}

rAF trace after: 1086 frames; frames with !=1 figure 3; max single-frame delta {'dw': -5.94, 'dh': 37.5, 'dcx': 0, 'dbase': 0} at {'dw': (11048, 'sipping', '#/focus'), 'dh': (11048, 'sipping', '#/focus')}

#### 1440x900 light dpr2 full

| step | pose | side | img box x,y,w,h | ink x0,y0,x1,y1 (shot diff) | ink w x h | ink cx | baseline y |
|---|---|---|---|---|---|---|---|
| 1 focus running | reading | before | [514.64, 502.77, 185.09, 289.86] | [np.float64(506.0), np.float64(494.0), np.float64(708.0), np.float64(790.0)] | 202.0 x 296.0 | 607.0 | 790.0 |
| 1 focus running | reading | after | [514.64, 502.77, 185.09, 289.86] | [np.float64(518.0), np.float64(505.5), np.float64(697.0), np.float64(790.5)] | 179.0 x 285.0 | 607.5 | 790.5 |
| 2 whistle | cheering | before | [515.51, 517.37, 183.36, 259.84] | [np.float64(516.5), np.float64(541.0), np.float64(697.5), np.float64(785.0)] | 181.0 x 244.0 | 607.0 | 785.0 |
| 2 whistle | cheering | after | [516.05, 513.87, 182.27, 261.86] | [np.float64(516.0), np.float64(541.0), np.float64(697.0), np.float64(783.0)] | 181.0 x 242.0 | 606.5 | 783.0 |
| 3 summary | cheering | before | [514.34, 537.89, 185.69, 254.73] | [np.float64(516.5), np.float64(541.0), np.float64(697.5), np.float64(790.0)] | 181.0 x 249.0 | 607.0 | 790.0 |
| 3 summary | cheering | after | [514.34, 537.89, 185.69, 254.73] | [np.float64(516.0), np.float64(541.0), np.float64(697.5), np.float64(790.5)] | 181.5 x 249.5 | 606.75 | 790.5 |
| 4 tea break | sipping | before | [517.31, 500.39, 179.75, 292.23] | [np.float64(520.0), np.float64(503.0), np.float64(694.0), np.float64(790.5)] | 174.0 x 287.5 | 607.0 | 790.5 |
| 4 tea break | sipping | after | [517.31, 500.39, 179.75, 292.23] | [np.float64(519.5), np.float64(503.0), np.float64(694.0), np.float64(791.0)] | 174.5 x 288.0 | 606.75 | 791.0 |
| 5 next brew | reading | before | [514.64, 502.77, 185.09, 289.86] | [np.float64(518.5), np.float64(506.5), np.float64(697.0), np.float64(790.0)] | 178.5 x 283.5 | 607.75 | 790.0 |
| 5 next brew | reading | after | [514.64, 502.77, 185.09, 289.86] | [np.float64(518.0), np.float64(505.5), np.float64(697.0), np.float64(790.5)] | 179.0 x 285.0 | 607.5 | 790.5 |

Step-to-step deltas (CSS px, ink from the screenshot diff; `box` = the img element):

| transition | side | d box w | d box h | d box bottom | d ink w | d ink h | d ink cx | d baseline |
|---|---|---|---|---|---|---|---|---|
| 1>2 running>whistle | before | -1.73 | -30.02 | -15.41 | -21.0 | -52.0 | 0.0 | -5.0 |
| 1>2 running>whistle | after | -2.82 | -28.0 | -16.88 | 2.0 | -43.0 | -1.0 | -7.5 |
| 2>3 whistle>summary | before | 2.33 | -5.11 | 15.41 | 0.0 | 5.0 | 0.0 | 5.0 |
| 2>3 whistle>summary | after | 3.42 | -7.13 | 16.88 | 0.5 | 7.5 | 0.25 | 7.5 |
| 3>4 summary>tea break | before | -5.94 | 37.5 | 0.0 | -7.0 | 38.5 | 0.0 | 0.5 |
| 3>4 summary>tea break | after | -5.94 | 37.5 | 0.0 | -7.0 | 38.5 | 0.0 | 0.5 |
| 4>5 tea break>next brew | before | 5.34 | -2.37 | 0.0 | 4.5 | -4.0 | 0.75 | -0.5 |
| 4>5 tea break>next brew | after | 5.34 | -2.37 | 0.0 | 4.5 | -3.0 | 0.75 | -0.5 |

rAF trace before: 1799 frames; frames with !=1 figure 3; max single-frame delta {'dw': -5.94, 'dh': 37.5, 'dcx': 0.0, 'dbase': -14.71} at {'dbase': (5550, 'cheering', '#/focus'), 'dh': (16878, 'sipping', '#/focus'), 'dw': (16878, 'sipping', '#/focus'), 'dcx': (5918, 'cheering', '#/focus')}

rAF trace after: 2070 frames; frames with !=1 figure 5; max single-frame delta {'dw': -5.94, 'dh': 37.5, 'dcx': 0.0, 'dbase': 16.89} at {'dbase': (8176, 'cheering', '#/focus'), 'dh': (20192, 'sipping', '#/focus'), 'dw': (20192, 'sipping', '#/focus'), 'dcx': (8128, 'cheering', '#/focus')}

#### 390x844 dark dpr1 full

| step | pose | side | img box x,y,w,h | ink x0,y0,x1,y1 (shot diff) | ink w x h | ink cx | baseline y |
|---|---|---|---|---|---|---|---|
| 1 focus running | reading | before | [236.09, 203.28, 112.8, 176.62] | [np.float64(228.0), np.float64(195.0), np.float64(357.0), np.float64(378.0)] | 129.0 x 183.0 | 292.5 | 378.0 |
| 1 focus running | reading | after | [236.09, 194.56, 112.8, 176.62] | [np.float64(228.0), np.float64(186.0), np.float64(357.0), np.float64(370.0)] | 129.0 x 184.0 | 292.5 | 370.0 |
| 2 whistle | cheering | before | [235.44, 213.66, 114.09, 154.4] | [np.float64(237.0), np.float64(218.0), np.float64(347.0), np.float64(369.0)] | 110.0 x 151.0 | 292.0 | 369.0 |
| 2 whistle | cheering | after | [235.03, 218.38, 114.91, 152.83] | [np.float64(237.0), np.float64(218.0), np.float64(347.0), np.float64(370.0)] | 110.0 x 152.0 | 292.0 | 370.0 |
| 3 summary | cheering | before | [235.91, 215.97, 113.16, 155.23] | [np.float64(237.0), np.float64(218.0), np.float64(348.0), np.float64(370.0)] | 111.0 x 152.0 | 292.5 | 370.0 |
| 3 summary | cheering | after | [235.91, 215.97, 113.16, 155.23] | [np.float64(237.0), np.float64(217.0), np.float64(348.0), np.float64(370.0)] | 111.0 x 153.0 | 292.5 | 370.0 |
| 4 tea break | sipping | before | [237.72, 193.11, 109.53, 178.08] | [np.float64(239.0), np.float64(194.0), np.float64(346.0), np.float64(370.0)] | 107.0 x 176.0 | 292.5 | 370.0 |
| 4 tea break | sipping | after | [237.72, 193.11, 109.53, 178.08] | [np.float64(239.0), np.float64(194.0), np.float64(345.0), np.float64(370.0)] | 106.0 x 176.0 | 292.0 | 370.0 |
| 5 next brew | reading | before | [236.09, 194.56, 112.8, 176.62] | [np.float64(238.0), np.float64(196.0), np.float64(348.0), np.float64(370.0)] | 110.0 x 174.0 | 293.0 | 370.0 |
| 5 next brew | reading | after | [236.09, 194.56, 112.8, 176.62] | [np.float64(237.0), np.float64(196.0), np.float64(347.0), np.float64(370.0)] | 110.0 x 174.0 | 292.0 | 370.0 |

Step-to-step deltas (CSS px, ink from the screenshot diff; `box` = the img element):

| transition | side | d box w | d box h | d box bottom | d ink w | d ink h | d ink cx | d baseline |
|---|---|---|---|---|---|---|---|---|
| 1>2 running>whistle | before | 1.29 | -22.22 | -11.84 | -19.0 | -32.0 | -0.5 | -9.0 |
| 1>2 running>whistle | after | 2.11 | -23.79 | 0.01 | -19.0 | -32.0 | -0.5 | 0.0 |
| 2>3 whistle>summary | before | -0.93 | 0.83 | 3.13 | 1.0 | 1.0 | 0.5 | 1.0 |
| 2>3 whistle>summary | after | -1.75 | 2.4 | 0.0 | 1.0 | 1.0 | 0.5 | 0.0 |
| 3>4 summary>tea break | before | -3.63 | 22.85 | -0.01 | -4.0 | 24.0 | 0.0 | 0.0 |
| 3>4 summary>tea break | after | -3.63 | 22.85 | -0.01 | -5.0 | 23.0 | -0.5 | 0.0 |
| 4>5 tea break>next brew | before | 3.27 | -1.46 | 0.0 | 3.0 | -2.0 | 0.5 | 0.0 |
| 4>5 tea break>next brew | after | 3.27 | -1.46 | 0.0 | 4.0 | -2.0 | 0.0 | 0.0 |

rAF trace before: 1198 frames; frames with !=1 figure 7; max single-frame delta {'dw': -3.62, 'dh': 22.84, 'dcx': -0.01, 'dbase': -8.7} at {'dbase': (4228, 'cheering', '#/focus'), 'dw': (11972, 'sipping', '#/focus'), 'dh': (11972, 'sipping', '#/focus'), 'dcx': (4228, 'cheering', '#/focus')}

rAF trace after: 1165 frames; frames with !=1 figure 7; max single-frame delta {'dw': -3.62, 'dh': 22.84, 'dcx': -0.01, 'dbase': -5.05} at {'dh': (11569, 'sipping', '#/focus'), 'dbase': (534, 'reading', '#/focus'), 'dw': (11569, 'sipping', '#/focus'), 'dcx': (4129, 'cheering', '#/focus')}

#### 390x844 dark dpr1 reduce

| step | pose | side | img box x,y,w,h | ink x0,y0,x1,y1 (shot diff) | ink w x h | ink cx | baseline y |
|---|---|---|---|---|---|---|---|
| 1 focus running | reading | before | [236.09, 194.56, 112.8, 176.62] | [np.float64(228.0), np.float64(186.0), np.float64(357.0), np.float64(370.0)] | 129.0 x 184.0 | 292.5 | 370.0 |
| 1 focus running | reading | after | [236.09, 194.56, 112.8, 176.62] | [np.float64(237.0), np.float64(196.0), np.float64(347.0), np.float64(370.0)] | 110.0 x 174.0 | 292.0 | 370.0 |
| 2 whistle | cheering | before | [235.91, 215.97, 113.16, 155.23] | [np.float64(237.0), np.float64(218.0), np.float64(348.0), np.float64(370.0)] | 111.0 x 152.0 | 292.5 | 370.0 |
| 2 whistle | cheering | after | [235.91, 215.97, 113.16, 155.23] | [np.float64(227.0), np.float64(217.0), np.float64(348.0), np.float64(374.0)] | 121.0 x 157.0 | 287.5 | 374.0 |
| 3 summary | cheering | before | [235.91, 215.97, 113.16, 155.23] | [np.float64(237.0), np.float64(218.0), np.float64(348.0), np.float64(370.0)] | 111.0 x 152.0 | 292.5 | 370.0 |
| 3 summary | cheering | after | [235.91, 215.97, 113.16, 155.23] | [np.float64(237.0), np.float64(217.0), np.float64(348.0), np.float64(370.0)] | 111.0 x 153.0 | 292.5 | 370.0 |
| 4 tea break | sipping | before | [237.72, 193.11, 109.53, 178.08] | [np.float64(239.0), np.float64(194.0), np.float64(346.0), np.float64(370.0)] | 107.0 x 176.0 | 292.5 | 370.0 |
| 4 tea break | sipping | after | [237.72, 193.11, 109.53, 178.08] | [np.float64(239.0), np.float64(194.0), np.float64(345.0), np.float64(370.0)] | 106.0 x 176.0 | 292.0 | 370.0 |
| 5 next brew | reading | before | [236.09, 194.56, 112.8, 176.62] | [np.float64(238.0), np.float64(196.0), np.float64(348.0), np.float64(370.0)] | 110.0 x 174.0 | 293.0 | 370.0 |
| 5 next brew | reading | after | [236.09, 194.56, 112.8, 176.62] | [np.float64(237.0), np.float64(196.0), np.float64(347.0), np.float64(370.0)] | 110.0 x 174.0 | 292.0 | 370.0 |

Step-to-step deltas (CSS px, ink from the screenshot diff; `box` = the img element):

| transition | side | d box w | d box h | d box bottom | d ink w | d ink h | d ink cx | d baseline |
|---|---|---|---|---|---|---|---|---|
| 1>2 running>whistle | before | 0.36 | -21.39 | 0.01 | -18.0 | -32.0 | 0.0 | 0.0 |
| 1>2 running>whistle | after | 0.36 | -21.39 | 0.01 | 11.0 | -17.0 | -4.5 | 4.0 |
| 2>3 whistle>summary | before | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| 2>3 whistle>summary | after | 0.0 | 0.0 | 0.0 | -10.0 | -4.0 | 5.0 | -4.0 |
| 3>4 summary>tea break | before | -3.63 | 22.85 | -0.01 | -4.0 | 24.0 | 0.0 | 0.0 |
| 3>4 summary>tea break | after | -3.63 | 22.85 | -0.01 | -5.0 | 23.0 | -0.5 | 0.0 |
| 4>5 tea break>next brew | before | 3.27 | -1.46 | 0.0 | 3.0 | -2.0 | 0.5 | 0.0 |
| 4>5 tea break>next brew | after | 3.27 | -1.46 | 0.0 | 4.0 | -2.0 | 0.0 | 0.0 |

rAF trace before: 1023 frames; frames with !=1 figure 1; max single-frame delta {'dw': -3.62, 'dh': 22.84, 'dcx': -0.01, 'dbase': 0.02} at {'dw': (10559, 'sipping', '#/focus'), 'dh': (10559, 'sipping', '#/focus'), 'dcx': (3726, 'cheering', '#/focus'), 'dbase': (3726, 'cheering', '#/focus')}

rAF trace after: 980 frames; frames with !=1 figure 4; max single-frame delta {'dw': -3.62, 'dh': 22.84, 'dcx': -0.01, 'dbase': 0.02} at {'dw': (10286, 'sipping', '#/focus'), 'dh': (10286, 'sipping', '#/focus'), 'dcx': (3774, 'cheering', '#/focus'), 'dbase': (3774, 'cheering', '#/focus')}

#### 390x844 dark dpr2 full

| step | pose | side | img box x,y,w,h | ink x0,y0,x1,y1 (shot diff) | ink w x h | ink cx | baseline y |
|---|---|---|---|---|---|---|---|
| 1 focus running | reading | before | [236.09, 194.56, 112.8, 176.62] | [np.float64(228.0), np.float64(186.0), np.float64(357.0), np.float64(369.0)] | 129.0 x 183.0 | 292.5 | 369.0 |
| 1 focus running | reading | after | [236.09, 194.56, 112.8, 176.62] | [np.float64(228.0), np.float64(186.0), np.float64(357.0), np.float64(369.5)] | 129.0 x 183.5 | 292.5 | 369.5 |
| 2 whistle | cheering | before | [234.96, 217.52, 115.04, 152.78] | [np.float64(237.5), np.float64(217.5), np.float64(347.5), np.float64(369.5)] | 110.0 x 152.0 | 292.5 | 369.5 |
| 2 whistle | cheering | after | [236.95, 201.34, 111.08, 159.58] | [np.float64(237.5), np.float64(217.5), np.float64(347.5), np.float64(369.0)] | 110.0 x 151.5 | 292.5 | 369.0 |
| 3 summary | cheering | before | [235.91, 215.97, 113.16, 155.23] | [np.float64(237.5), np.float64(217.5), np.float64(347.5), np.float64(369.5)] | 110.0 x 152.0 | 292.5 | 369.5 |
| 3 summary | cheering | after | [235.91, 215.97, 113.16, 155.23] | [np.float64(237.5), np.float64(217.5), np.float64(347.5), np.float64(369.5)] | 110.0 x 152.0 | 292.5 | 369.5 |
| 4 tea break | sipping | before | [237.72, 193.11, 109.53, 178.08] | [np.float64(239.5), np.float64(194.5), np.float64(345.5), np.float64(369.5)] | 106.0 x 175.0 | 292.5 | 369.5 |
| 4 tea break | sipping | after | [237.72, 193.11, 109.53, 178.08] | [np.float64(239.5), np.float64(194.5), np.float64(345.5), np.float64(369.5)] | 106.0 x 175.0 | 292.5 | 369.5 |
| 5 next brew | reading | before | [236.09, 194.56, 112.8, 176.62] | [np.float64(238.0), np.float64(196.5), np.float64(347.0), np.float64(369.0)] | 109.0 x 172.5 | 292.5 | 369.0 |
| 5 next brew | reading | after | [236.09, 194.56, 112.8, 176.62] | [np.float64(237.5), np.float64(196.5), np.float64(347.0), np.float64(369.5)] | 109.5 x 173.0 | 292.25 | 369.5 |

Step-to-step deltas (CSS px, ink from the screenshot diff; `box` = the img element):

| transition | side | d box w | d box h | d box bottom | d ink w | d ink h | d ink cx | d baseline |
|---|---|---|---|---|---|---|---|---|
| 1>2 running>whistle | before | 2.24 | -23.84 | -0.89 | -19.0 | -31.0 | 0.0 | 0.5 |
| 1>2 running>whistle | after | -1.72 | -17.04 | -10.28 | -19.0 | -32.0 | 0.0 | -0.5 |
| 2>3 whistle>summary | before | -1.88 | 2.45 | 0.9 | 0.0 | 0.0 | 0.0 | 0.0 |
| 2>3 whistle>summary | after | 2.08 | -4.35 | 10.29 | 0.0 | 0.5 | 0.0 | 0.5 |
| 3>4 summary>tea break | before | -3.63 | 22.85 | -0.01 | -4.0 | 23.0 | 0.0 | 0.0 |
| 3>4 summary>tea break | after | -3.63 | 22.85 | -0.01 | -4.0 | 23.0 | 0.0 | 0.0 |
| 4>5 tea break>next brew | before | 3.27 | -1.46 | 0.0 | 3.0 | -2.5 | 0.0 | -0.5 |
| 4>5 tea break>next brew | after | 3.27 | -1.46 | 0.0 | 3.5 | -2.0 | -0.25 | 0.0 |

rAF trace before: 1015 frames; frames with !=1 figure 4; max single-frame delta {'dw': -3.62, 'dh': 22.84, 'dcx': -0.01, 'dbase': 9.85} at {'dh': (9738, 'sipping', '#/focus'), 'dbase': (4658, 'cheering', '#/focus'), 'dw': (9738, 'sipping', '#/focus'), 'dcx': (3754, 'cheering', '#/focus')}

rAF trace after: 1105 frames; frames with !=1 figure 6; max single-frame delta {'dw': -3.62, 'dh': 22.84, 'dcx': -0.01, 'dbase': 8.72} at {'dbase': (5396, 'cheering', '#/focus'), 'dh': (11023, 'sipping', '#/focus'), 'dw': (11023, 'sipping', '#/focus'), 'dcx': (4512, 'cheering', '#/focus')}

#### 390x844 light dpr1 full

| step | pose | side | img box x,y,w,h | ink x0,y0,x1,y1 (shot diff) | ink w x h | ink cx | baseline y |
|---|---|---|---|---|---|---|---|
| 1 focus running | reading | before | [236.09, 194.73, 112.8, 176.62] | [np.float64(232.0), np.float64(186.0), np.float64(357.0), np.float64(370.0)] | 125.0 x 184.0 | 294.5 | 370.0 |
| 1 focus running | reading | after | [236.09, 194.56, 112.8, 176.62] | [np.float64(237.0), np.float64(196.0), np.float64(347.0), np.float64(370.0)] | 110.0 x 174.0 | 292.0 | 370.0 |
| 2 whistle | cheering | before | [235.9, 215.97, 113.16, 155.23] | [np.float64(237.0), np.float64(218.0), np.float64(348.0), np.float64(369.0)] | 111.0 x 151.0 | 292.5 | 369.0 |
| 2 whistle | cheering | after | [235.03, 218.38, 114.91, 152.82] | [np.float64(237.0), np.float64(217.0), np.float64(348.0), np.float64(370.0)] | 111.0 x 153.0 | 292.5 | 370.0 |
| 3 summary | cheering | before | [235.91, 215.97, 113.16, 155.23] | [np.float64(237.0), np.float64(217.0), np.float64(348.0), np.float64(369.0)] | 111.0 x 152.0 | 292.5 | 369.0 |
| 3 summary | cheering | after | [235.91, 215.97, 113.16, 155.23] | [np.float64(237.0), np.float64(217.0), np.float64(348.0), np.float64(370.0)] | 111.0 x 153.0 | 292.5 | 370.0 |
| 4 tea break | sipping | before | [237.72, 193.11, 109.53, 178.08] | [np.float64(239.0), np.float64(194.0), np.float64(345.0), np.float64(370.0)] | 106.0 x 176.0 | 292.0 | 370.0 |
| 4 tea break | sipping | after | [237.72, 193.11, 109.53, 178.08] | [np.float64(239.0), np.float64(194.0), np.float64(345.0), np.float64(370.0)] | 106.0 x 176.0 | 292.0 | 370.0 |
| 5 next brew | reading | before | [236.09, 194.56, 112.8, 176.62] | [np.float64(238.0), np.float64(196.0), np.float64(348.0), np.float64(370.0)] | 110.0 x 174.0 | 293.0 | 370.0 |
| 5 next brew | reading | after | [236.09, 194.56, 112.8, 176.62] | [np.float64(237.0), np.float64(196.0), np.float64(347.0), np.float64(370.0)] | 110.0 x 174.0 | 292.0 | 370.0 |

Step-to-step deltas (CSS px, ink from the screenshot diff; `box` = the img element):

| transition | side | d box w | d box h | d box bottom | d ink w | d ink h | d ink cx | d baseline |
|---|---|---|---|---|---|---|---|---|
| 1>2 running>whistle | before | 0.36 | -21.39 | -0.15 | -14.0 | -33.0 | -2.0 | -1.0 |
| 1>2 running>whistle | after | 2.11 | -23.8 | 0.01 | 1.0 | -21.0 | 0.5 | 0.0 |
| 2>3 whistle>summary | before | 0.0 | 0.0 | 0.0 | 0.0 | 1.0 | 0.0 | 0.0 |
| 2>3 whistle>summary | after | -1.75 | 2.41 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| 3>4 summary>tea break | before | -3.63 | 22.85 | -0.01 | -5.0 | 24.0 | -0.5 | 1.0 |
| 3>4 summary>tea break | after | -3.63 | 22.85 | -0.01 | -5.0 | 23.0 | -0.5 | 0.0 |
| 4>5 tea break>next brew | before | 3.27 | -1.46 | 0.0 | 4.0 | -2.0 | 1.0 | 0.0 |
| 4>5 tea break>next brew | after | 3.27 | -1.46 | 0.0 | 4.0 | -2.0 | 0.0 | 0.0 |

rAF trace before: 1363 frames; frames with !=1 figure 18; max single-frame delta {'dw': 4.49, 'dh': 22.84, 'dcx': -0.01, 'dbase': -2.65} at {'dh': (13570, 'sipping', '#/focus'), 'dbase': (497, 'reading', '#/focus'), 'dw': (4401, 'cheering', '#/focus'), 'dcx': (4321, 'cheering', '#/focus')}

rAF trace after: 1319 frames; frames with !=1 figure 5; max single-frame delta {'dw': -3.62, 'dh': 22.84, 'dcx': -0.01, 'dbase': 5.14} at {'dbase': (4733, 'cheering', '#/focus'), 'dh': (13069, 'sipping', '#/focus'), 'dw': (13069, 'sipping', '#/focus'), 'dcx': (3965, 'cheering', '#/focus')}

#### 390x844 light dpr1 reduce

| step | pose | side | img box x,y,w,h | ink x0,y0,x1,y1 (shot diff) | ink w x h | ink cx | baseline y |
|---|---|---|---|---|---|---|---|
| 1 focus running | reading | before | [236.09, 194.56, 112.8, 176.62] | [np.float64(233.0), np.float64(186.0), np.float64(357.0), np.float64(370.0)] | 124.0 x 184.0 | 295.0 | 370.0 |
| 1 focus running | reading | after | [236.09, 194.56, 112.8, 176.62] | [np.float64(237.0), np.float64(196.0), np.float64(347.0), np.float64(370.0)] | 110.0 x 174.0 | 292.0 | 370.0 |
| 2 whistle | cheering | before | [235.91, 215.97, 113.16, 155.23] | [np.float64(237.0), np.float64(217.0), np.float64(348.0), np.float64(369.0)] | 111.0 x 152.0 | 292.5 | 369.0 |
| 2 whistle | cheering | after | [235.91, 215.97, 113.16, 155.23] | [np.float64(237.0), np.float64(217.0), np.float64(348.0), np.float64(370.0)] | 111.0 x 153.0 | 292.5 | 370.0 |
| 3 summary | cheering | before | [235.91, 215.97, 113.16, 155.23] | [np.float64(237.0), np.float64(217.0), np.float64(348.0), np.float64(369.0)] | 111.0 x 152.0 | 292.5 | 369.0 |
| 3 summary | cheering | after | [235.91, 215.97, 113.16, 155.23] | [np.float64(237.0), np.float64(217.0), np.float64(348.0), np.float64(370.0)] | 111.0 x 153.0 | 292.5 | 370.0 |
| 4 tea break | sipping | before | [237.72, 193.11, 109.53, 178.08] | [np.float64(239.0), np.float64(194.0), np.float64(345.0), np.float64(370.0)] | 106.0 x 176.0 | 292.0 | 370.0 |
| 4 tea break | sipping | after | [237.72, 193.11, 109.53, 178.08] | [np.float64(239.0), np.float64(194.0), np.float64(345.0), np.float64(370.0)] | 106.0 x 176.0 | 292.0 | 370.0 |
| 5 next brew | reading | before | [236.09, 194.56, 112.8, 176.62] | [np.float64(238.0), np.float64(196.0), np.float64(348.0), np.float64(370.0)] | 110.0 x 174.0 | 293.0 | 370.0 |
| 5 next brew | reading | after | [236.09, 194.56, 112.8, 176.62] | [np.float64(237.0), np.float64(196.0), np.float64(347.0), np.float64(370.0)] | 110.0 x 174.0 | 292.0 | 370.0 |

Step-to-step deltas (CSS px, ink from the screenshot diff; `box` = the img element):

| transition | side | d box w | d box h | d box bottom | d ink w | d ink h | d ink cx | d baseline |
|---|---|---|---|---|---|---|---|---|
| 1>2 running>whistle | before | 0.36 | -21.39 | 0.01 | -13.0 | -32.0 | -2.5 | -1.0 |
| 1>2 running>whistle | after | 0.36 | -21.39 | 0.01 | 1.0 | -21.0 | 0.5 | 0.0 |
| 2>3 whistle>summary | before | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| 2>3 whistle>summary | after | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 | 0.0 |
| 3>4 summary>tea break | before | -3.63 | 22.85 | -0.01 | -5.0 | 24.0 | -0.5 | 1.0 |
| 3>4 summary>tea break | after | -3.63 | 22.85 | -0.01 | -5.0 | 23.0 | -0.5 | 0.0 |
| 4>5 tea break>next brew | before | 3.27 | -1.46 | 0.0 | 4.0 | -2.0 | 1.0 | 0.0 |
| 4>5 tea break>next brew | after | 3.27 | -1.46 | 0.0 | 4.0 | -2.0 | 0.0 | 0.0 |

rAF trace before: 976 frames; frames with !=1 figure 4; max single-frame delta {'dw': -3.62, 'dh': 22.84, 'dcx': -0.01, 'dbase': 0.02} at {'dw': (8967, 'sipping', '#/focus'), 'dh': (8967, 'sipping', '#/focus'), 'dcx': (2999, 'cheering', '#/focus'), 'dbase': (2999, 'cheering', '#/focus')}

rAF trace after: 950 frames; frames with !=1 figure 5; max single-frame delta {'dw': -3.62, 'dh': 22.84, 'dcx': -0.01, 'dbase': 0.02} at {'dw': (9365, 'sipping', '#/focus'), 'dh': (9365, 'sipping', '#/focus'), 'dcx': (2789, 'cheering', '#/focus'), 'dbase': (2789, 'cheering', '#/focus')}

#### 390x844 light dpr2 full

| step | pose | side | img box x,y,w,h | ink x0,y0,x1,y1 (shot diff) | ink w x h | ink cx | baseline y |
|---|---|---|---|---|---|---|---|
| 1 focus running | reading | before | [236.09, 194.56, 112.8, 176.62] | [np.float64(238.0), np.float64(196.5), np.float64(347.0), np.float64(369.0)] | 109.0 x 172.5 | 292.5 | 369.0 |
| 1 focus running | reading | after | [236.09, 194.56, 112.8, 176.62] | [np.float64(237.5), np.float64(186.0), np.float64(357.0), np.float64(369.5)] | 119.5 x 183.5 | 297.25 | 369.5 |
| 2 whistle | cheering | before | [236.86, 201.78, 111.24, 159.25] | [np.float64(237.5), np.float64(217.5), np.float64(347.5), np.float64(369.0)] | 110.0 x 151.5 | 292.5 | 369.0 |
| 2 whistle | cheering | after | [236.24, 207.09, 112.48, 157.16] | [np.float64(237.5), np.float64(217.5), np.float64(347.5), np.float64(369.5)] | 110.0 x 152.0 | 292.5 | 369.5 |
| 3 summary | cheering | before | [235.91, 215.97, 113.16, 155.23] | [np.float64(237.5), np.float64(217.5), np.float64(347.5), np.float64(369.5)] | 110.0 x 152.0 | 292.5 | 369.5 |
| 3 summary | cheering | after | [235.91, 215.97, 113.16, 155.23] | [np.float64(237.5), np.float64(217.5), np.float64(347.5), np.float64(369.5)] | 110.0 x 152.0 | 292.5 | 369.5 |
| 4 tea break | sipping | before | [237.72, 193.11, 109.53, 178.08] | [np.float64(239.5), np.float64(195.0), np.float64(345.5), np.float64(369.5)] | 106.0 x 174.5 | 292.5 | 369.5 |
| 4 tea break | sipping | after | [237.72, 193.11, 109.53, 178.08] | [np.float64(239.5), np.float64(194.5), np.float64(345.5), np.float64(369.5)] | 106.0 x 175.0 | 292.5 | 369.5 |
| 5 next brew | reading | before | [236.09, 194.56, 112.8, 176.62] | [np.float64(238.0), np.float64(196.5), np.float64(347.0), np.float64(369.0)] | 109.0 x 172.5 | 292.5 | 369.0 |
| 5 next brew | reading | after | [236.09, 194.56, 112.8, 176.62] | [np.float64(237.5), np.float64(196.5), np.float64(347.0), np.float64(369.5)] | 109.5 x 173.0 | 292.25 | 369.5 |

Step-to-step deltas (CSS px, ink from the screenshot diff; `box` = the img element):

| transition | side | d box w | d box h | d box bottom | d ink w | d ink h | d ink cx | d baseline |
|---|---|---|---|---|---|---|---|---|
| 1>2 running>whistle | before | -1.56 | -17.37 | -10.16 | 1.0 | -21.0 | 0.0 | 0.0 |
| 1>2 running>whistle | after | -0.32 | -19.46 | -6.94 | -9.5 | -31.5 | -4.75 | 0.0 |
| 2>3 whistle>summary | before | 1.92 | -4.02 | 10.17 | 0.0 | 0.5 | 0.0 | 0.5 |
| 2>3 whistle>summary | after | 0.68 | -1.93 | 6.95 | 0.0 | 0.0 | 0.0 | 0.0 |
| 3>4 summary>tea break | before | -3.63 | 22.85 | -0.01 | -4.0 | 22.5 | 0.0 | 0.0 |
| 3>4 summary>tea break | after | -3.63 | 22.85 | -0.01 | -4.0 | 23.0 | 0.0 | 0.0 |
| 4>5 tea break>next brew | before | 3.27 | -1.46 | 0.0 | 3.0 | -2.0 | 0.0 | -0.5 |
| 4>5 tea break>next brew | after | 3.27 | -1.46 | 0.0 | 3.5 | -2.0 | -0.25 | 0.0 |

rAF trace before: 1302 frames; frames with !=1 figure 16; max single-frame delta {'dw': -3.62, 'dh': 22.84, 'dcx': -0.01, 'dbase': 5.25} at {'dh': (13053, 'sipping', '#/focus'), 'dbase': (6892, 'cheering', '#/focus'), 'dw': (13053, 'sipping', '#/focus'), 'dcx': (6028, 'cheering', '#/focus')}

rAF trace after: 1244 frames; frames with !=1 figure 12; max single-frame delta {'dw': 4.37, 'dh': 22.84, 'dcx': -0.01, 'dbase': 7.65} at {'dh': (10624, 'sipping', '#/focus'), 'dbase': (4512, 'cheering', '#/focus'), 'dw': (4320, 'cheering', '#/focus'), 'dcx': (4080, 'cheering', '#/focus')}