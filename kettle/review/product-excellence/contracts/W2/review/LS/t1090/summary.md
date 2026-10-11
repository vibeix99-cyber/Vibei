| # | invocation (log) | side | start (UTC) | phone 390×844 | phone 375×667 | desktop 1440×900 | failing line |
|---|---|---|---|---|---|---|---|
| 1 | base-run1.log | control 90a11e5 (:5310) | 2026-10-11T23:10:24Z | pass | pass | pass | - |
| 2 | S-run1.log | S trial 3726a71 (:5341) | 2026-10-11T23:10:55Z | pass | pass | pass | - |
| 3 | base-run2.log | control 90a11e5 (:5310) | 2026-10-11T23:11:27Z | pass | pass | pass | - |
| 4 | S-run2.log | S trial 3726a71 (:5341) | 2026-10-11T23:27:07Z | pass | pass | pass | - |
| 5 | base-run3.log | control 90a11e5 (:5310) | 2026-10-11T23:27:29Z | pass | pass | pass | - |
| 6 | S-run3.log | S trial 3726a71 (:5341) | 2026-10-11T23:27:51Z | pass | pass | FAIL | 1127 |
| 7 | rep-base-r1.log | control 90a11e5 (:5310) | 2026-10-11T23:33:20Z | pass, pass | pass, pass | pass, FAIL | 1127 |
| 8 | rep-S-r1.log | S trial 3726a71 (:5341) | 2026-10-11T23:34:08Z | pass, pass | pass, pass | FAIL, pass | 1127 |
| 9 | rep-base-r2.log | control 90a11e5 (:5310) | 2026-10-11T23:34:57Z | pass, pass | pass, pass | pass, FAIL | 1127 |
| 10 | rep-S-r2.log | S trial 3726a71 (:5341) | 2026-10-11T23:35:47Z | pass, pass | pass, pass | pass, pass | - |
| 11 | rep-base-r3.log | control 90a11e5 (:5310) | 2026-10-11T23:36:31Z | pass, pass | pass, pass | FAIL, FAIL | 1127 |
| 12 | rep-S-r3.log | S trial 3726a71 (:5341) | 2026-10-11T23:37:39Z | pass, pass | pass, pass | pass, FAIL | 1127 |

| side | viewport variant | passes | fails |
|---|---|---|---|
| S trial 3726a71 (:5341) | desktop 1440×900 | 6 | 3 |
| S trial 3726a71 (:5341) | phone 375×667 | 9 | 0 |
| S trial 3726a71 (:5341) | phone 390×844 | 9 | 0 |
| control 90a11e5 (:5310) | desktop 1440×900 | 5 | 4 |
| control 90a11e5 (:5310) | phone 375×667 | 9 | 0 |
| control 90a11e5 (:5310) | phone 390×844 | 9 | 0 |