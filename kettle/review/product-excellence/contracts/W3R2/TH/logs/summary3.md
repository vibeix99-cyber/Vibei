Pairs: 192. **identical 148**, **within the noise floor 34**, **difference 10**, incomplete 0.
Noise floor (BEFORE vs BEFORE2, same build twice): pixel-identical in 145 of 192 states; where not, median 55 px, max 237538 px, largest channel delta 250/255; states where the base differs from itself by more than 2 levels: 30.

| Configuration | end-sheet | session-running | sheet-warm-atRisk | sheet-warm-missed-cozy | stats-brew-updated | today-after-end-gone | today-after-end-notice | today-atRisk | today-blank | today-missed-cozy | today-missed-nocozy | today-newbie |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| 1440x900-dark-t100 | N | **D** | N | N | **D** | I | I | I | I | I | I | I |
| 1440x900-dark-t200 | N | **D** | N | I | N | I | **D** | I | I | I | I | I |
| 1440x900-light-t100 | N | I | N | N | I | I | I | I | I | I | N | I |
| 1440x900-light-t200 | N | **D** | I | N | N | I | I | I | I | I | I | I |
| 375x667-dark-t100 | **D** | N | I | I | I | N | I | I | I | I | I | I |
| 375x667-dark-t200 | I | I | I | I | I | I | I | I | I | I | I | I |
| 375x667-light-t100 | **D** | I | I | I | I | I | I | I | I | I | I | I |
| 375x667-light-t200 | I | I | I | I | I | I | I | I | I | I | I | I |
| 390x844-dark-t100 | N | N | I | I | I | I | I | I | I | I | I | I |
| 390x844-dark-t200 | **D** | I | I | I | **D** | I | I | I | I | I | I | I |
| 390x844-light-t100 | N | N | I | I | I | I | I | I | I | I | I | I |
| 390x844-light-t200 | I | N | I | I | N | I | I | I | I | I | I | I |
| 844x390-dark-t100 | N | I | N | N | I | I | N | I | I | I | I | I |
| 844x390-dark-t200 | N | N | I | N | I | I | I | I | I | I | I | I |
| 844x390-light-t100 | I | N | N | N | I | I | I | I | I | I | I | I |
| 844x390-light-t200 | N | **D** | N | N | I | I | I | I | I | I | I | I |

I = identical, N = within the noise floor, D = difference, ? = not captured, S = size differs.

Differences:

- `1440x900-dark-t100/session-running`: differing px 11624, real 1499 (max delta 53), bbox [370,505,328,286], noise px 0, crop `crops/1440x900-dark-t100/session-running.png`
- `1440x900-dark-t100/stats-brew-updated`: differing px 4, real 4 (max delta 5), bbox [11,95,216,38], noise px 0, crop `crops/1440x900-dark-t100/stats-brew-updated.png`
- `1440x900-dark-t200/session-running`: differing px 66056, real 8804 (max delta 90), bbox [22,22,1377,860], noise px 0, crop `crops/1440x900-dark-t200/session-running.png`
- `1440x900-dark-t200/today-after-end-notice`: differing px 5, real 5 (max delta 59), bbox [1339,267,2,3], noise px 0, crop `crops/1440x900-dark-t200/today-after-end-notice.png`
- `1440x900-light-t200/session-running`: differing px 11508, real 1 (max delta 14), bbox [389,757,1,1], noise px 11454, crop `crops/1440x900-light-t200/session-running.png`
- `375x667-dark-t100/end-sheet`: differing px 7260, real 121 (max delta 5), bbox [49,27,249,149], noise px 1, crop `crops/375x667-dark-t100/end-sheet.png`
- `375x667-light-t100/end-sheet`: differing px 4, real 4 (max delta 4), bbox [25,458,39,149], noise px 1, crop `crops/375x667-light-t100/end-sheet.png`
- `390x844-dark-t200/end-sheet`: differing px 2054, real 664 (max delta 7), bbox [245,59,67,25], noise px 0, crop `crops/390x844-dark-t200/end-sheet.png`
- `390x844-dark-t200/stats-brew-updated`: differing px 2, real 2 (max delta 5), bbox [37,770,30,1], noise px 0, crop `crops/390x844-dark-t200/stats-brew-updated.png`
- `844x390-light-t200/session-running`: differing px 4, real 4 (max delta 51), bbox [205,243,11,5], noise px 0, crop `crops/844x390-light-t200/session-running.png`
