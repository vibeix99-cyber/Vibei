| run | lift applied (ms after first toast mount) | stack settled (ms, from first frame) | toast-over-dock overlap while arriving: frames / max px / span ms (max opacity) | overlap after settle | warning: first-instance life → re-shown | warning rest box | frames in first 2.5 s / max frame gap ms | notes |
|---|---|---|---|---|---|---|---|---|
| INT 1440x900 light t100 alone | - | - | - / - / - (-) | - | - | - | - / - | ERROR page.waitForSelector: Timeout 12000ms exceeded. |
| INT 1440x900 light t100 alone | - | - | - / - / - (-) | - | - | - | - / - | ERROR page.waitForSelector: Timeout 12000ms exceeded. |
| INT 1440x900 light t100 stack | 0 (+0:378px +997:228px +12141:(stylesheet)) | 2289 | 6 / 57.4 / 83 (0.31) | 0 | [12171] | [595.3,672] | 11 / 1093 |  |
| INT 1440x900 light t100 stack | 0 (+0:378px +1247:228px +12141:(stylesheet)) | 2343 | 6 / 56.7 / 83 (0.3) | 0 | [12171] | [595.3,672] | 13 / 1008 |  |
| INT 1440x900 light t100 plain3 | 9 (+9:266px +3212:(stylesheet)) | 566 | 13 / 49 / 3287 (1) | 0 | - | - | 103 / 270 |  |
| INT 1440x900 light t100 plain3 | 10 (+10:266px +3214:(stylesheet)) | 549 | 12 / 49.1 / 3030 (0.71) | 0 | - | - | 57 / 254 |  |
| INT 1440x900 light t200 alone | - | - | - / - / - (-) | - | - | - | - / - | ERROR page.waitForSelector: Timeout 12000ms exceeded. |
| INT 1440x900 light t200 alone | - | - | - / - / - (-) | - | - | - | - / - | ERROR page.waitForSelector: Timeout 12000ms exceeded. |
| INT 1440x900 light t200 stack | 0 (+0:321px +1495:136px +12147:(stylesheet)) | 3408 | 0 / 0 / 0 (0) | 0 | [12190] | [302.5,764] | 4 / 2488 |  |
| INT 1440x900 light t200 stack | 0 (+0:321px +743:136px +12100:(stylesheet)) | 2624 | 0 / 0 / 0 (0) | 0 | [12178] | [302.5,764] | 5 / 1329 |  |
| INT 1440x900 light t200 plain3 | 5 (+5:136px +3217:(stylesheet)) | 346 | 5 / 24.5 / 3172 (1) | 0 | - | - | 58 / 469 |  |
| INT 1440x900 light t200 plain3 | 10 (+10:136px +3215:(stylesheet)) | 560 | 5 / 24.5 / 2966 (1) | 0 | - | - | 32 / 848 |  |
| INT 1440x900 dark t100 alone | - | - | - / - / - (-) | - | - | - | - / - | ERROR page.waitForSelector: Timeout 12000ms exceeded. |
| INT 1440x900 dark t100 alone | - | - | - / - / - (-) | - | - | - | - / - | ERROR page.waitForSelector: Timeout 12000ms exceeded. |
| INT 1440x900 dark t100 stack | 0 (+0:378px +971:228px +12078:(stylesheet)) | 3233 | 6 / 60.9 / 82 (0.27) | 0 | [12180] | [595.3,672] | 4 / 3099 |  |
| INT 1440x900 dark t100 stack | 0 (+0:378px +747:228px +12187:(stylesheet)) | 2454 | 6 / 60.9 / 84 (0.28) | 0 | [12174] | [595.3,672] | 7 / 1028 |  |
| INT 1440x900 dark t100 plain3 | 8 (+8:266px +3217:(stylesheet)) | 572 | 11 / 51.1 / 3320 (1) | 0 | - | - | 76 / 339 |  |
| INT 1440x900 dark t100 plain3 | 6 (+6:266px +3217:(stylesheet)) | 907 | 12 / 49.1 / 3100 (1) | 0 | - | - | 56 / 785 |  |
| INT 1440x900 dark t200 alone | - | - | - / - / - (-) | - | - | - | - / - | ERROR page.waitForSelector: Timeout 12000ms exceeded. |
| INT 1440x900 dark t200 alone | - | - | - / - / - (-) | - | - | - | - / - | ERROR page.waitForSelector: Timeout 12000ms exceeded. |
| INT 1440x900 dark t200 stack | 0 (+0:321px +1499:136px +12122:(stylesheet)) | 2247 | 0 / 0 / 0 (0) | 0 | [12169] | [302.5,764] | 6 / 807 |  |
| INT 1440x900 dark t200 stack | 0 (+0:321px +491:136px +12098:(stylesheet)) | 1928 | 0 / 0 / 0 (0) | 0 | [12178] | [302.5,764] | 22 / 661 |  |
| INT 1440x900 dark t200 plain3 | 5 (+5:136px +3216:(stylesheet)) | 990 | 5 / 24.5 / 3325 (1) | 0 | - | - | 67 / 829 |  |
| INT 1440x900 dark t200 plain3 | 6 (+6:136px +3215:(stylesheet)) | 403 | 7 / 24.5 / 3335 (1) | 0 | - | - | 109 / 163 |  |
