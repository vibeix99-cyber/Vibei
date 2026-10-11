## Detail: frames (per cfg x state x scroll position x toasts)

Each cell: `hit/frames` centre-hit by the control · `ovl` frames a painted toast box overlapped it by > 1 px · `cov` frames counted COVERED (overlap or centre not hit) · `off` frames with < 8 px visible · rect = last frame [l,t,r,b].

| cfg | state | where | toasts | scroll | Close | Ambience | Mute | min toast visible px | zen frames |
|---|---|---|---|---|---|---|---|---|---|
| 375x667 @200 light | over-carried | top | 1 | panel 0/236 doc 0/0 | 179/179 · ovl 0 · cov 0 · [319, 10, 363, 54] | — | — | 57 | 0 |
| 375x667 @200 light | over-carried | top | 3 | panel 0/236 doc 0/0 | 134/134 · ovl 0 · cov 0 · [319, 10, 363, 54] | — | — | 57 | 0 |
| 375x667 @200 light | over-carried | end | 1 | panel 236/236 doc 0/0 | 176/176 · ovl 0 · cov 0 · [319, 10, 363, 54] | — | — | 57 | 0 |
| 375x667 @200 light | over-carried | end | 3 | panel 236/236 doc 0/0 | 4/168 · ovl 166 · cov 166 · [319, 10, 363, 54] · hits: {'li:Recipe done: Take 2 full [TOAST]': 1, 'span:Recipe done: Take 2 full [TOAST]': 163} | — | — | 57 | 0 |

## Detail: real taps

| cfg | state | control | where | toasts at tap | rect | centre hit before tap | hit element | activated | evidence |
|---|---|---|---|---|---|---|---|---|---|
| 375x667 @200 light | over-carried | Close | top | 3 | [319, 10, 363, 54] | True | button:Close | True (touch tap) | hash #/focus -> #/ |
| 375x667 @200 light | over-carried | Close | end | 3 | [319, 10, 363, 54] | False | span:Recipe done: Take 2 full [TOAST] | False (touch tap) | hash #/focus -> #/focus |
| 375x667 @200 light | over-carried | Close | end | 1 | [319, 10, 363, 54] | True | button:Close | True (touch tap) | hash #/focus -> #/ |

## Compact per configuration x state

Across the 4 frame sub-runs (top/end x 1/3 toasts) per control: covered frames / frames, centre-hit frames / frames; taps: activated/attempted (hit before tap).

| cfg | state | Close cov · hit | Ambience cov · hit | Mute cov · hit | taps |
|---|---|---|---|---|---|
| 375x667 @200 light | over-carried | 166/657 · 493/657 | — | — | Close 2/3 (hit 2) |

## Toast visibility at the last frame (what a person can read): visible px / full px per toast, top toast first; room clip [top,bottom]

| cfg | state | where | toasts | visible / full px per toast | room clip | min visible |
|---|---|---|---|---|---|---|
| 375x667 @200 light | over-carried | top | 1 | 57/57 | [477, 553] | 57 |
| 375x667 @200 light | over-carried | top | 3 | 138/138 · 97/97 · 57/57 | [226, 553] | 57 |
| 375x667 @200 light | over-carried | end | 1 | 57/57 | [241, 317] | 57 |
| 375x667 @200 light | over-carried | end | 3 | 138/138 · 97/97 · 57/57 | [-10, 317] | 57 |
