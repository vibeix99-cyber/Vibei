## Detail: frames (per cfg x state x scroll position x toasts)

Each cell: `hit/frames` centre-hit by the control · `ovl` frames a painted toast box overlapped it by > 1 px · `cov` frames counted COVERED (overlap or centre not hit) · `off` frames with < 8 px visible · rect = last frame [l,t,r,b].

| cfg | state | where | toasts | scroll | Close | Ambience | Mute | panel controls: covered frames / frames seen (off-screen frames) | min toast visible px | zen frames |
|---|---|---|---|---|---|---|---|---|---|---|
| 375x667 @200 light | over-carried | top | 1 | panel 0/236 doc 0/0 | 179/179 · ovl 0 · cov 0 · [319, 10, 363, 54] | — | — | Mark it done: 0/179; Put the kettle o: 0/0 (179 off); That's all for n: 0/0 (179 off) | 57 | 0 |
| 375x667 @200 light | over-carried | top | 3 | panel 0/236 doc 0/0 | 134/134 · ovl 0 · cov 0 · [319, 10, 363, 54] | — | — | Mark it done: 0/134; Put the kettle o: 0/0 (134 off); That's all for n: 0/0 (134 off) | 57 | 0 |
| 375x667 @200 light | over-carried | end | 1 | panel 236/236 doc 0/0 | 176/176 · ovl 0 · cov 0 · [319, 10, 363, 54] | — | — | Mark it done: 0/176; Put the kettle o: 0/176; That's all for n: 0/176 | 57 | 0 |
| 375x667 @200 light | over-carried | end | 3 | panel 236/236 doc 0/0 | 4/168 · ovl 166 · cov 166 · [319, 10, 363, 54] · hits: {'li:Recipe done: Take 2 full [TOAST]': 1, 'span:Recipe done: Take 2 full [TOAST]': 163} | — | — | Mark it done: 0/168; Put the kettle o: 0/168; That's all for n: 0/168 | 57 | 0 |
| 375x667 @200 light | paused | top | 1 | panel 0/177 doc 0/0 | — | 125/125 · ovl 0 · cov 0 · [194, 48, 311, 97] | 125/125 · ovl 0 · cov 0 · [319, 50, 363, 94] | Skip break: 0/0 (125 off); Resume break: 0/0 (125 off); Start next brew: 0/0 (125 off) | 57 | 0 |
| 375x667 @200 light | paused | top | 3 | panel 0/177 doc 0/0 | — | 77/77 · ovl 0 · cov 0 · [194, 48, 311, 97] | 77/77 · ovl 0 · cov 0 · [319, 50, 363, 94] | Skip break: 0/0 (77 off); Resume break: 0/0 (77 off); Start next brew: 0/0 (77 off) | 57 | 0 |
| 375x667 @200 light | paused | end | 1 | panel 177/177 doc 0/0 | — | 118/118 · ovl 0 · cov 0 · [194, 48, 311, 97] | 118/118 · ovl 0 · cov 0 · [319, 50, 363, 94] | Skip break: 0/118; Resume break: 0/118; Start next brew: 0/118 | 57 | 0 |
| 375x667 @200 light | paused | end | 3 | panel 177/177 doc 0/0 | — | 109/109 · ovl 0 · cov 0 · [194, 48, 311, 97] | 109/109 · ovl 0 · cov 0 · [319, 50, 363, 94] | Skip break: 0/109; Resume break: 0/109; Start next brew: 0/109 | 57 | 0 |
| 375x667 @200 light | focus | top | 1 | panel 0/60 doc 0/0 | — | 71/71 · ovl 0 · cov 0 · [194, 48, 311, 97] | 71/71 · ovl 0 · cov 0 · [319, 50, 363, 94] | Add 5 minutes: 0/71; (Pause|Resume): 0/71; End session: 0/71 | 57 | 0 |
| 375x667 @200 light | focus | top | 3 | panel 0/60 doc 0/0 | — | 54/54 · ovl 0 · cov 0 · [194, 48, 311, 97] | 54/54 · ovl 0 · cov 0 · [319, 50, 363, 94] | Add 5 minutes: 0/54; (Pause|Resume): 0/54; End session: 0/54 | 57 | 0 |
| 375x667 @200 light | focus | end | 1 | panel 60/60 doc 0/0 | — | 87/87 · ovl 0 · cov 0 · [194, 48, 311, 97] | 87/87 · ovl 0 · cov 0 · [319, 50, 363, 94] | Add 5 minutes: 0/87; (Pause|Resume): 0/87; End session: 0/87 | 57 | 0 |
| 375x667 @200 light | focus | end | 3 | panel 60/60 doc 0/0 | — | 88/88 · ovl 0 · cov 0 · [194, 48, 311, 97] | 88/88 · ovl 0 · cov 0 · [319, 50, 363, 94] | Add 5 minutes: 0/88; (Pause|Resume): 0/88; End session: 0/88 | 57 | 0 |
| 667x375 @200 light | paused | top | 1 | panel 0/98 doc 0/0 | — | 185/185 · ovl 0 · cov 0 · [482, 50, 599, 99] | 185/185 · ovl 0 · cov 0 · [607, 52, 651, 96] | Skip break: 0/0 (185 off); Resume break: 0/0 (185 off); Start next brew: 0/0 (185 off) | 57 | 0 |
| 667x375 @200 light | paused | top | 3 | panel 0/98 doc 0/0 | — | 1/181 · ovl 178 · cov 180 · [482, 50, 599, 99] · hits: {'li:Recipe done: Take 2 full [TOAST]': 6, 'span:Recipe done: Take 2 full [TOAST]': 174} | 181/181 · ovl 0 · cov 0 · [607, 52, 651, 96] | Skip break: 0/0 (181 off); Resume break: 0/0 (181 off); Start next brew: 0/0 (181 off) | 57 | 0 |
| 667x375 @200 light | paused | end | 1 | panel 98/98 doc 0/0 | — | 207/207 · ovl 0 · cov 0 · [482, 50, 599, 99] | 207/207 · ovl 0 · cov 0 · [607, 52, 651, 96] | Skip break: 0/207; Resume break: 0/207; Start next brew: 0/207 | 57 | 0 |
| 667x375 @200 light | paused | end | 3 | panel 98/98 doc 0/0 | — | 5/182 · ovl 181 · cov 181 · [482, 50, 599, 99] · hits: {'li:Recipe done: Take 2 full [TOAST]': 2, 'span:Recipe done: Take 2 full [TOAST]': 175} | 182/182 · ovl 0 · cov 0 · [607, 52, 651, 96] | Skip break: 0/182; Resume break: 0/182; Start next brew: 0/182 | 57 | 0 |
| 667x375 @200 light | focus | top | 1 | panel 0/56 doc 0/0 | — | 133/133 · ovl 0 · cov 0 · [482, 50, 599, 99] | 133/133 · ovl 0 · cov 0 · [607, 52, 651, 96] | Add 5 minutes: 0/133; (Pause|Resume): 0/133; End session: 0/133 | 57 | 0 |
| 667x375 @200 light | focus | top | 3 | panel 0/56 doc 0/0 | — | 70/70 · ovl 0 · cov 0 · [482, 50, 599, 99] | 70/70 · ovl 0 · cov 0 · [607, 52, 651, 96] | Add 5 minutes: 0/70; (Pause|Resume): 0/70; End session: 0/70 | 57 | 0 |
| 667x375 @200 light | focus | end | 1 | panel 56/56 doc 0/0 | — | 134/134 · ovl 0 · cov 0 · [482, 50, 599, 99] | 134/134 · ovl 0 · cov 0 · [607, 52, 651, 96] | Add 5 minutes: 1/134; (Pause|Resume): 0/134; End session: 0/134 | 57 | 0 |
| 667x375 @200 light | focus | end | 3 | panel 56/56 doc 0/0 | — | 5/77 · ovl 74 · cov 74 · [482, 50, 599, 99] · hits: {'span:Recipe done: Take 2 full [TOAST]': 72} | 77/77 · ovl 0 · cov 0 · [607, 52, 651, 96] | Add 5 minutes: 0/77; (Pause|Resume): 0/77; End session: 0/77 | 57 | 0 |

## Detail: real taps

| cfg | state | control | where | toasts at tap | rect | centre hit before tap | hit element | activated | evidence |
|---|---|---|---|---|---|---|---|---|---|
| 375x667 @200 light | over-carried | Close | top | 3 | [319, 10, 363, 54] | True | button:Close | True (touch tap) | hash #/focus -> #/ |
| 375x667 @200 light | over-carried | Close | end | 3 | [319, 10, 363, 54] | False | span:Recipe done: Take 2 full [TOAST] | False (touch tap) | hash #/focus -> #/focus |
| 375x667 @200 light | over-carried | Close | end | 1 | [319, 10, 363, 54] | True | button:Close | True (touch tap) | hash #/focus -> #/ |
| 375x667 @200 light | paused | Mute | top | 3 | [319, 50, 363, 94] | True | button:Turn sound on | True (touch tap) | label ['Turn sound on', 'true'] -> ['Mute sounds', 'false']; restored True |
| 375x667 @200 light | paused | Ambience | top | 3 | [194, 48, 311, 97] | True | button:Ambience: Rain. Change | True (touch tap) | dialog {'open': True, 'text': 'AmbienceTap to listen. The win'}; closed True by none |
| 375x667 @200 light | paused | Mute | end | 3 | [319, 50, 363, 94] | True | button:Turn sound on | True (touch tap) | label ['Turn sound on', 'true'] -> ['Mute sounds', 'false']; restored True |
| 375x667 @200 light | paused | Ambience | end | 3 | [194, 48, 311, 97] | True | button:Ambience: Rain. Change | True (touch tap) | dialog {'open': True, 'text': 'AmbienceTap to listen. The win'}; closed True by Escape |
| 375x667 @200 light | focus | Mute | top | 3 | [319, 50, 363, 94] | True | button:Turn sound on | True (touch tap) | label ['Turn sound on', 'true'] -> ['Mute sounds', 'false']; restored True |
| 375x667 @200 light | focus | Ambience | top | 3 | [194, 48, 311, 97] | True | button:Ambience: Rain. Change | True (touch tap) | dialog {'open': True, 'text': 'AmbienceTap to listen. The win'}; closed True by Escape |
| 375x667 @200 light | focus | Mute | end | 3 | [319, 50, 363, 94] | True | button:Turn sound on | True (touch tap) | label ['Turn sound on', 'true'] -> ['Mute sounds', 'false']; restored True |
| 375x667 @200 light | focus | Ambience | end | 3 | [194, 48, 311, 97] | True | button:Ambience: Rain. Change | True (touch tap) | dialog {'open': True, 'text': 'AmbienceTap to listen. The win'}; closed True by Escape |
| 667x375 @200 light | paused | Mute | top | 3 | [607, 52, 651, 96] | True | button:Turn sound on | True (touch tap) | label ['Turn sound on', 'true'] -> ['Mute sounds', 'false']; restored True |
| 667x375 @200 light | paused | Ambience | top | 3 | [482, 50, 599, 99] | False | span:Recipe done: Take 2 full [TOAST] | False (touch tap) | dialog {'open': False}; closed True by Escape |
| 667x375 @200 light | paused | Mute | end | 3 | [607, 52, 651, 96] | True | button:Turn sound on | True (touch tap) | label ['Turn sound on', 'true'] -> ['Mute sounds', 'false']; restored True |
| 667x375 @200 light | paused | Ambience | end | 3 | [482, 50, 599, 99] | False | span:Recipe done: Take 2 full [TOAST] | False (touch tap) | dialog {'open': False}; closed True by Escape |
| 667x375 @200 light | focus | Mute | top | 3 | [607, 52, 651, 96] | True | button:Turn sound on | True (touch tap) | label ['Turn sound on', 'true'] -> ['Mute sounds', 'false']; restored True |
| 667x375 @200 light | focus | Ambience | top | 3 | [482, 50, 599, 99] | True | button:Ambience: Rain. Change | True (touch tap) | dialog {'open': True, 'text': 'AmbienceTap to listen. The win'}; closed True by none |
| 667x375 @200 light | focus | Mute | end | 3 | [607, 52, 651, 96] | True | button:Turn sound on | True (touch tap) | label ['Turn sound on', 'true'] -> ['Mute sounds', 'false']; restored True |
| 667x375 @200 light | focus | Ambience | end | 3 | [482, 50, 599, 99] | False | span:Recipe done: Take 2 full [TOAST] | False (touch tap) | dialog {'open': False}; closed False by none |

## Compact per configuration x state

Across the 4 frame sub-runs (top/end x 1/3 toasts) per control: covered frames / frames, centre-hit frames / frames; taps: activated/attempted (hit before tap).

| cfg | state | Close cov · hit | Ambience cov · hit | Mute cov · hit | taps |
|---|---|---|---|---|---|
| 375x667 @200 light | focus | — | 0/300 · 300/300 | 0/300 · 300/300 | Ambience 2/2 (hit 2); Mute 2/2 (hit 2) |
| 375x667 @200 light | paused | — | 0/429 · 429/429 | 0/429 · 429/429 | Ambience 2/2 (hit 2); Mute 2/2 (hit 2) |
| 375x667 @200 light | over-carried | 166/657 · 493/657 | — | — | Close 2/3 (hit 2) |
| 667x375 @200 light | focus | — | 74/414 · 342/414 | 0/414 · 414/414 | Ambience 1/2 (hit 1); Mute 2/2 (hit 2) |
| 667x375 @200 light | paused | — | 361/755 · 398/755 | 0/755 · 755/755 | Ambience 0/2 (hit 0); Mute 2/2 (hit 2) |

## Toast visibility at the last frame (what a person can read): visible px / full px per toast, top toast first; room clip [top,bottom]

| cfg | state | where | toasts | visible / full px per toast | room clip | min visible |
|---|---|---|---|---|---|---|
| 375x667 @200 light | over-carried | top | 1 | 57/57 | [477, 553] | 57 |
| 375x667 @200 light | over-carried | top | 3 | 138/138 · 97/97 · 57/57 | [226, 553] | 57 |
| 375x667 @200 light | over-carried | end | 1 | 57/57 | [241, 317] | 57 |
| 375x667 @200 light | over-carried | end | 3 | 138/138 · 97/97 · 57/57 | [-10, 317] | 57 |
| 375x667 @200 light | paused | top | 1 | 57/57 | [580, 656] | 57 |
| 375x667 @200 light | paused | top | 3 | 138/138 · 97/97 · 57/57 | [329, 656] | 57 |
| 375x667 @200 light | paused | end | 1 | 57/57 | [403, 479] | 57 |
| 375x667 @200 light | paused | end | 3 | 138/138 · 97/97 · 57/57 | [152, 479] | 57 |
| 375x667 @200 light | focus | top | 1 | 57/57 | [477, 553] | 57 |
| 375x667 @200 light | focus | top | 3 | 138/138 · 97/97 · 57/57 | [226, 553] | 57 |
| 375x667 @200 light | focus | end | 1 | 57/57 | [417, 493] | 57 |
| 375x667 @200 light | focus | end | 3 | 138/138 · 97/97 · 57/57 | [166, 493] | 57 |
| 667x375 @200 light | paused | top | 1 | 57/57 | [181, 257] | 57 |
| 667x375 @200 light | paused | top | 3 | 97/97 · 57/57 · 57/57 | [11, 257] | 57 |
| 667x375 @200 light | paused | end | 1 | 57/57 | [209, 285] | 57 |
| 667x375 @200 light | paused | end | 3 | 97/97 · 57/57 · 57/57 | [39, 285] | 57 |
| 667x375 @200 light | focus | top | 1 | 57/57 | [265, 341] | 57 |
| 667x375 @200 light | focus | top | 3 | 97/97 · 57/57 · 57/57 | [95, 341] | 57 |
| 667x375 @200 light | focus | end | 1 | 57/57 | [209, 285] | 57 |
| 667x375 @200 light | focus | end | 3 | 97/97 · 57/57 · 57/57 | [39, 285] | 57 |
