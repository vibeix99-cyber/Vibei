Rendered lines = description height ÷ computed line-height. Phone configs measured twice: a phone context (`isMobile`, overlay scrollbars) and a desktop context (`isMobile: false`, the 15 px stable scrollbar gutter; this is the context that reproduces the checker's base 12 / trial 17).

| Config | Context | Sounds: base | Sounds: BEFORE (trial) | **Sounds: AFTER** | Nudges On: base* | Nudges On: BEFORE | **Nudges On: AFTER** | AFTER ≤ BEFORE |
|---|---|---|---|---|---|---|---|---|
| 390x844-light-100 | phone | 5 | 7 | **5** | 4 | 7 | **6** | yes |
| 390x844-light-200 | phone | 9 | 13 | **9** | 8 | 14 | **12** | yes |
| 390x844-dark-100 | phone | 5 | 7 | **5** | 4 | 7 | **6** | yes |
| 390x844-dark-200 | phone | 9 | 13 | **9** | 8 | 14 | **12** | yes |
| 375x667-light-100 | phone | 5 | 7 | **5** | 4 | 7 | **6** | yes |
| 375x667-light-200 | phone | 11 | 14 | **10** | 8 | 15 | **13** | yes |
| 375x667-dark-100 | phone | 5 | 7 | **5** | 4 | 7 | **6** | yes |
| 375x667-dark-200 | phone | 11 | 14 | **10** | 8 | 15 | **13** | yes |
| 844x390-light-100 | desktop | 2 | 3 | **2** | 2 | 3 | **3** | yes |
| 844x390-light-200 | desktop | 4 | 6 | **4** | 3 | 6 | **5** | yes |
| 844x390-dark-100 | desktop | 2 | 3 | **2** | 2 | 3 | **3** | yes |
| 844x390-dark-200 | desktop | 4 | 6 | **4** | 3 | 6 | **5** | yes |
| 1440x900-light-100 | desktop | 2 | 3 | **2** | 2 | 3 | **3** | yes |
| 1440x900-light-200 | desktop | 4 | 5 | **4** | 3 | 5 | **5** | yes |
| 1440x900-dark-100 | desktop | 2 | 3 | **2** | 2 | 3 | **3** | yes |
| 1440x900-dark-200 | desktop | 4 | 5 | **4** | 3 | 5 | **5** | yes |
| 375x667-light-100 | desktop ctx | 6 | 8 | **5** | 5 | 8 | **7** | yes |
| 375x667-light-200 | desktop ctx | 12 | 17 | **10** | 9 | 16 | **14** | yes |
| 375x667-dark-100 | desktop ctx | 6 | 8 | **5** | 5 | 8 | **7** | yes |
| 375x667-dark-200 | desktop ctx | 12 | 17 | **10** | 9 | 16 | **14** | yes |

*Base On line: "On. I’ll nudge you when a brew or tea break ends. A locked phone may hold the nudge until you’re back."
