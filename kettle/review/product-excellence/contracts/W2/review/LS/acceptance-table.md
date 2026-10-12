| cfg | day | side | heading in view (arr,set) | footer ok (arr,set,end) | highlights (arr,set,end) / kind | cut text lines, ink rule (arr/set/end) | cut text lines, full box (arr/set/end) + maker-rule cut units | end: atEnd, gap to footer top (px; fade) | occl/ovl (LS; maker) | Chai in-view/not-under-sheet (arr,set) | unlock (bigday) | result |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 375x667-dark-t100 | routine | BEFORE | [True, True] | [True, True, True] | [0, 0, 0]  groups=[1, 1, 1] | 0/0/0 | 1/1/0 ; maker: {'arrival': ['details-toggle@513-561'], 'settled': ['details-toggle@513-561'], 'end': []} | True, 48.8 ; 22 | 0+0 ; 0+0 | [(1, 0.78), (1, 0.78)] | -  | FAIL(cut-box) |
| 375x667-dark-t100 | routine | AFTER | [True, True] | [True, True, True] | [0, 0, 0]  groups=[1, 1, 1] | 0/0/0 | 0/0/0 ; maker: {'arrival': [], 'settled': [], 'end': []} | True, 48.8 ; 14 | 0+0 ; 0+0 | [(1, 0.84), (1, 0.84)] | -  | PASS |
| 375x667-dark-t100 | bigday | BEFORE | [True, True] | [True, True, True] | [1, 1, 1] unlock groups=[1, 1, 1] | 1/1/0 [arrival: straddle-fold:+68 leaves] [settled: straddle-fold:+68 leaves] | 1/1/0 ; maker: {'arrival': ['reward0@513-551'], 'settled': ['reward0@513-551'], 'end': []} | True, 48.6 ; 22 | 0+0 ; 0+0 | [(1, 1), (1, 1)] | [True, True, True] ['clear', 'clear', 'above'] | FAIL(cut-text-line,cut-box) |
| 375x667-dark-t100 | bigday | AFTER | [True, True] | [True, True, True] | [1, 1, 1] unlock groups=[1, 1, 1] | 0/0/0 | 0/0/0 ; maker: {'arrival': [], 'settled': [], 'end': []} | True, 48.6 ; 14 | 0+0 ; 0+0 | [(1, 0.85), (1, 0.85)] | [True, True, True] ['clear', 'clear', 'above'] | PASS |
| 375x667-dark-t200 | routine | BEFORE | [True, True] | [True, True, True] | [0, 0, 0]  groups=[1, 1, 1] | 0/0/0 | 1/1/0 ; maker: {'arrival': ['sub-line1@424-456'], 'settled': ['sub-line1@424-456'], 'end': []} | True, 49.4 ; 22 | 0+0 ; 0+0 | [(1, 0.72), (1, 0.72)] | -  | FAIL(cut-text-line) |
| 375x667-dark-t200 | routine | AFTER | [True, True] | [True, True, True] | [0, 0, 0]  groups=[1, 1, 1] | 0/0/0 | 1/1/0 ; maker: {'arrival': [], 'settled': [], 'end': []} | True, 49.4 ; 14 | 0+0 ; 0+0 | [(1, 0.72), (1, 0.72)] | -  | PASS |
| 375x667-dark-t200 | bigday | BEFORE | [True, True] | [True, True, True] | [1, 1, 1] unlock groups=[1, 1, 1] | 1/1/0 [arrival: straddle-fold:Record player is in yo] [settled: straddle-fold:Record player is in yo] | 1/1/0 ; maker: {'arrival': ['unlock-title-line0@469-502'], 'settled': ['unlock-title-line0@469-502'], 'end': []} | True, 49.6 ; 22 | 0+0 ; 0+0 | [(1, 0.56), (1, 0.56)] | [True, True, True] ['straddle-fold', 'straddle-fold', 'above'] | FAIL(cut-text-line) |
| 375x667-dark-t200 | bigday | AFTER | [True, True] | [True, True, True] | [1, 1, 1] unlock groups=[1, 1, 1] | 0/0/0 | 1/1/0 ; maker: {'arrival': [], 'settled': [], 'end': []} | True, 49.6 ; 14 | 0+0 ; 0+0 | [(1, 0.6), (1, 0.6)] | [True, True, True] ['straddle-fold', 'straddle-fold', 'above'] | PASS |
| 375x667-light-t100 | routine | BEFORE | [True, True] | [True, True, True] | [0, 0, 0]  groups=[1, 1, 1] | 0/0/0 | 1/1/0 ; maker: {'arrival': ['details-toggle@513-561'], 'settled': ['details-toggle@513-561'], 'end': []} | True, 48.8 ; 22 | 0+0 ; 0+0 | [(1, 0.78), (1, 0.78)] | -  | FAIL(cut-box) |
| 375x667-light-t100 | routine | AFTER | [True, True] | [True, True, True] | [0, 0, 0]  groups=[1, 1, 1] | 0/0/0 | 0/0/0 ; maker: {'arrival': [], 'settled': [], 'end': []} | True, 48.8 ; 14 | 0+0 ; 0+0 | [(1, 0.84), (1, 0.84)] | -  | PASS |
| 375x667-light-t100 | bigday | BEFORE | [True, True] | [True, True, True] | [1, 1, 1] unlock groups=[1, 1, 1] | 1/1/0 [arrival: straddle-fold:+68 leaves] [settled: straddle-fold:+68 leaves] | 1/1/0 ; maker: {'arrival': ['reward0@513-551'], 'settled': ['reward0@513-551'], 'end': []} | True, 48.6 ; 22 | 0+0 ; 0+0 | [(1, 1), (1, 1)] | [True, True, True] ['clear', 'clear', 'above'] | FAIL(cut-text-line,cut-box) |
| 375x667-light-t100 | bigday | AFTER | [True, True] | [True, True, True] | [1, 1, 1] unlock groups=[1, 1, 1] | 0/0/0 | 0/0/0 ; maker: {'arrival': [], 'settled': [], 'end': []} | True, 48.6 ; 14 | 0+0 ; 0+0 | [(1, 0.85), (1, 0.85)] | [True, True, True] ['clear', 'clear', 'above'] | PASS |
| 375x667-light-t200 | routine | BEFORE | [True, True] | [True, True, True] | [0, 0, 0]  groups=[1, 1, 1] | 0/0/0 | 1/1/0 ; maker: {'arrival': ['sub-line1@424-456'], 'settled': ['sub-line1@424-456'], 'end': []} | True, 49.4 ; 22 | 0+0 ; 0+0 | [(1, 0.72), (1, 0.72)] | -  | FAIL(cut-text-line) |
| 375x667-light-t200 | routine | AFTER | [True, True] | [True, True, True] | [0, 0, 0]  groups=[1, 1, 1] | 0/0/0 | 1/1/0 ; maker: {'arrival': [], 'settled': [], 'end': []} | True, 49.4 ; 14 | 0+0 ; 0+0 | [(1, 0.72), (1, 0.72)] | -  | PASS |
| 375x667-light-t200 | bigday | BEFORE | [True, True] | [True, True, True] | [1, 1, 1] unlock groups=[1, 1, 1] | 1/1/0 [arrival: straddle-fold:Record player is in yo] [settled: straddle-fold:Record player is in yo] | 1/1/0 ; maker: {'arrival': ['unlock-title-line0@469-502'], 'settled': ['unlock-title-line0@469-502'], 'end': []} | True, 49.6 ; 22 | 0+0 ; 0+0 | [(1, 0.56), (1, 0.56)] | [True, True, True] ['straddle-fold', 'straddle-fold', 'above'] | FAIL(cut-text-line) |
| 375x667-light-t200 | bigday | AFTER | [True, True] | [True, True, True] | [1, 1, 1] unlock groups=[1, 1, 1] | 0/0/0 | 1/1/0 ; maker: {'arrival': [], 'settled': [], 'end': []} | True, 49.6 ; 14 | 0+0 ; 0+0 | [(1, 0.6), (1, 0.6)] | [True, True, True] ['straddle-fold', 'straddle-fold', 'above'] | PASS |
| 390x844-dark-t100 | routine | BEFORE | no capture |||||||||| 
| 390x844-dark-t100 | routine | AFTER | no capture |||||||||| 
| 390x844-dark-t100 | bigday | BEFORE | no capture |||||||||| 
| 390x844-dark-t100 | bigday | AFTER | no capture |||||||||| 
| 390x844-dark-t200 | routine | BEFORE | no capture |||||||||| 
| 390x844-dark-t200 | routine | AFTER | no capture |||||||||| 
| 390x844-dark-t200 | bigday | BEFORE | no capture |||||||||| 
| 390x844-dark-t200 | bigday | AFTER | no capture |||||||||| 
| 390x844-light-t100 | routine | BEFORE | no capture |||||||||| 
| 390x844-light-t100 | routine | AFTER | no capture |||||||||| 
| 390x844-light-t100 | bigday | BEFORE | no capture |||||||||| 
| 390x844-light-t100 | bigday | AFTER | no capture |||||||||| 
| 390x844-light-t200 | routine | BEFORE | no capture |||||||||| 
| 390x844-light-t200 | routine | AFTER | no capture |||||||||| 
| 390x844-light-t200 | bigday | BEFORE | no capture |||||||||| 
| 390x844-light-t200 | bigday | AFTER | no capture |||||||||| 
| 844x390-dark-t100 | routine | BEFORE | no capture |||||||||| 
| 844x390-dark-t100 | routine | AFTER | no capture |||||||||| 
| 844x390-dark-t100 | bigday | BEFORE | no capture |||||||||| 
| 844x390-dark-t100 | bigday | AFTER | no capture |||||||||| 
| 844x390-dark-t200 | routine | BEFORE | no capture |||||||||| 
| 844x390-dark-t200 | routine | AFTER | no capture |||||||||| 
| 844x390-dark-t200 | bigday | BEFORE | no capture |||||||||| 
| 844x390-dark-t200 | bigday | AFTER | no capture |||||||||| 
| 844x390-light-t100 | routine | BEFORE | no capture |||||||||| 
| 844x390-light-t100 | routine | AFTER | no capture |||||||||| 
| 844x390-light-t100 | bigday | BEFORE | no capture |||||||||| 
| 844x390-light-t100 | bigday | AFTER | no capture |||||||||| 
| 844x390-light-t200 | routine | BEFORE | no capture |||||||||| 
| 844x390-light-t200 | routine | AFTER | no capture |||||||||| 
| 844x390-light-t200 | bigday | BEFORE | no capture |||||||||| 
| 844x390-light-t200 | bigday | AFTER | no capture |||||||||| 
| 1440x900-dark-t100 | routine | BEFORE | no capture |||||||||| 
| 1440x900-dark-t100 | routine | AFTER | no capture |||||||||| 
| 1440x900-dark-t100 | bigday | BEFORE | no capture |||||||||| 
| 1440x900-dark-t100 | bigday | AFTER | no capture |||||||||| 
| 1440x900-dark-t200 | routine | BEFORE | no capture |||||||||| 
| 1440x900-dark-t200 | routine | AFTER | no capture |||||||||| 
| 1440x900-dark-t200 | bigday | BEFORE | no capture |||||||||| 
| 1440x900-dark-t200 | bigday | AFTER | no capture |||||||||| 
| 1440x900-light-t100 | routine | BEFORE | no capture |||||||||| 
| 1440x900-light-t100 | routine | AFTER | no capture |||||||||| 
| 1440x900-light-t100 | bigday | BEFORE | no capture |||||||||| 
| 1440x900-light-t100 | bigday | AFTER | no capture |||||||||| 
| 1440x900-light-t200 | routine | BEFORE | no capture |||||||||| 
| 1440x900-light-t200 | routine | AFTER | no capture |||||||||| 
| 1440x900-light-t200 | bigday | BEFORE | no capture |||||||||| 
| 1440x900-light-t200 | bigday | AFTER | no capture |||||||||| 

## Rewards comparison BEFORE vs AFTER
| cfg | day | pills B/A | missing in AFTER | extra in AFTER | numbers equal | announce equal | arithmetic differs |
|---|---|---|---|---|---|---|---|
| 375x667-dark-t100 | routine | 5/5 | [] | [] | True | True | only_before=[] only_after=[] |
| 375x667-dark-t100 | bigday | 7/7 | [] | [] | True | True | only_before=[] only_after=[] |
| 375x667-dark-t200 | routine | 5/5 | [] | [] | True | True | only_before=[] only_after=[] |
| 375x667-dark-t200 | bigday | 7/7 | [] | [] | True | True | only_before=[] only_after=[] |
| 375x667-light-t100 | routine | 5/5 | [] | [] | True | True | only_before=[] only_after=[] |
| 375x667-light-t100 | bigday | 7/7 | [] | [] | True | True | only_before=[] only_after=[] |
| 375x667-light-t200 | routine | 5/5 | [] | [] | True | True | only_before=[] only_after=[] |
| 375x667-light-t200 | bigday | 7/7 | [] | [] | True | True | only_before=[] only_after=[] |
| 390x844-dark-t100 | routine | no BEFORE data |||||| 
| 390x844-dark-t100 | bigday | no BEFORE data |||||| 
| 390x844-dark-t200 | routine | no BEFORE data |||||| 
| 390x844-dark-t200 | bigday | no BEFORE data |||||| 
| 390x844-light-t100 | routine | no BEFORE data |||||| 
| 390x844-light-t100 | bigday | no BEFORE data |||||| 
| 390x844-light-t200 | routine | no BEFORE data |||||| 
| 390x844-light-t200 | bigday | no BEFORE data |||||| 
| 844x390-dark-t100 | routine | no BEFORE data |||||| 
| 844x390-dark-t100 | bigday | no BEFORE data |||||| 
| 844x390-dark-t200 | routine | no BEFORE data |||||| 
| 844x390-dark-t200 | bigday | no BEFORE data |||||| 
| 844x390-light-t100 | routine | no BEFORE data |||||| 
| 844x390-light-t100 | bigday | no BEFORE data |||||| 
| 844x390-light-t200 | routine | no BEFORE data |||||| 
| 844x390-light-t200 | bigday | no BEFORE data |||||| 
| 1440x900-dark-t100 | routine | no BEFORE data |||||| 
| 1440x900-dark-t100 | bigday | no BEFORE data |||||| 
| 1440x900-dark-t200 | routine | no BEFORE data |||||| 
| 1440x900-dark-t200 | bigday | no BEFORE data |||||| 
| 1440x900-light-t100 | routine | no BEFORE data |||||| 
| 1440x900-light-t100 | bigday | no BEFORE data |||||| 
| 1440x900-light-t200 | routine | no BEFORE data |||||| 
| 1440x900-light-t200 | bigday | no BEFORE data |||||| 