## Detail: frames (per cfg x state x scroll position x toasts)

Each cell: `hit/frames` centre-hit by the control · `ovl` frames a painted toast box overlapped it by > 1 px · `cov` frames counted COVERED (overlap or centre not hit) · `off` frames with < 8 px visible · rect = last frame [l,t,r,b].

| cfg | state | where | toasts | scroll | Close | Ambience | Mute | panel controls: covered frames / frames seen (off-screen frames) | min toast visible px | zen frames |
|---|---|---|---|---|---|---|---|---|---|---|
| 375x667 @200 light | over-carried | top | 1 | panel 0/236 doc 0/0 | 199/199 · ovl 0 · cov 0 · [319, 10, 363, 54] | — | — | Mark it done: 0/199; Put the kettle o: 0/0 (199 off); That's all for n: 0/0 (199 off) | 57 | 0 |
| 375x667 @200 light | over-carried | top | 3 | panel 0/236 doc 0/0 | 169/169 · ovl 0 · cov 0 · [319, 10, 363, 54] | — | — | Mark it done: 0/169; Put the kettle o: 0/0 (169 off); That's all for n: 0/0 (169 off) | 57 | 0 |
| 375x667 @200 light | over-carried | end | 1 | panel 236/236 doc 0/0 | 161/161 · ovl 0 · cov 0 · [319, 10, 363, 54] | — | — | Mark it done: 0/161; Put the kettle o: 0/161; That's all for n: 0/161 | 57 | 0 |
| 375x667 @200 light | over-carried | end | 3 | panel 236/236 doc 0/0 | 151/151 · ovl 0 · cov 0 · [319, 10, 363, 54] | — | — | Mark it done: 0/151; Put the kettle o: 0/151; That's all for n: 0/151 | 57 | 0 |
| 375x667 @200 light | paused | top | 1 | panel 0/177 doc 0/0 | — | 124/124 · ovl 0 · cov 0 · [194, 48, 311, 97] | 124/124 · ovl 0 · cov 0 · [319, 50, 363, 94] | Skip break: 0/0 (124 off); Resume break: 0/0 (124 off); Start next brew: 0/0 (124 off) | 57 | 0 |
| 375x667 @200 light | paused | top | 3 | panel 0/177 doc 0/0 | — | 108/108 · ovl 0 · cov 0 · [194, 48, 311, 97] | 108/108 · ovl 0 · cov 0 · [319, 50, 363, 94] | Skip break: 0/0 (108 off); Resume break: 0/0 (108 off); Start next brew: 0/0 (108 off) | 57 | 0 |
| 375x667 @200 light | paused | end | 1 | panel 177/177 doc 0/0 | — | 133/133 · ovl 0 · cov 0 · [194, 48, 311, 97] | 133/133 · ovl 0 · cov 0 · [319, 50, 363, 94] | Skip break: 0/133; Resume break: 0/133; Start next brew: 0/133 | 57 | 0 |
| 375x667 @200 light | paused | end | 3 | panel 177/177 doc 0/0 | — | 112/112 · ovl 0 · cov 0 · [194, 48, 311, 97] | 112/112 · ovl 0 · cov 0 · [319, 50, 363, 94] | Skip break: 0/112; Resume break: 0/112; Start next brew: 0/112 | 57 | 0 |
| 375x667 @200 light | focus | top | 1 | panel 0/60 doc 0/0 | — | 69/69 · ovl 0 · cov 0 · [194, 48, 311, 97] | 69/69 · ovl 0 · cov 0 · [319, 50, 363, 94] | Add 5 minutes: 0/69; (Pause|Resume): 0/69; End session: 0/69 | 57 | 0 |
| 375x667 @200 light | focus | top | 3 | panel 0/60 doc 0/0 | — | 71/71 · ovl 0 · cov 0 · [194, 48, 311, 97] | 71/71 · ovl 0 · cov 0 · [319, 50, 363, 94] | Add 5 minutes: 0/71; (Pause|Resume): 0/71; End session: 0/71 | 57 | 0 |
| 375x667 @200 light | focus | end | 1 | panel 60/60 doc 0/0 | — | 79/79 · ovl 0 · cov 0 · [194, 48, 311, 97] | 79/79 · ovl 0 · cov 0 · [319, 50, 363, 94] | Add 5 minutes: 0/79; (Pause|Resume): 0/79; End session: 0/79 | 57 | 0 |
| 375x667 @200 light | focus | end | 3 | panel 60/60 doc 0/0 | — | 58/58 · ovl 0 · cov 0 · [194, 48, 311, 97] | 58/58 · ovl 0 · cov 0 · [319, 50, 363, 94] | Add 5 minutes: 0/58; (Pause|Resume): 0/58; End session: 0/58 | 57 | 0 |
| 375x667 @200 dark | over-carried | top | 1 | panel 0/236 doc 0/0 | 178/178 · ovl 0 · cov 0 · [319, 10, 363, 54] | — | — | Mark it done: 0/178; Put the kettle o: 0/0 (178 off); That's all for n: 0/0 (178 off) | 57 | 0 |
| 375x667 @200 dark | over-carried | top | 3 | panel 0/236 doc 0/0 | 169/169 · ovl 0 · cov 0 · [319, 10, 363, 54] | — | — | Mark it done: 0/169; Put the kettle o: 0/0 (169 off); That's all for n: 0/0 (169 off) | 57 | 0 |
| 375x667 @200 dark | over-carried | end | 1 | panel 236/236 doc 0/0 | 203/203 · ovl 0 · cov 0 · [319, 10, 363, 54] | — | — | Mark it done: 0/203; Put the kettle o: 0/203; That's all for n: 0/203 | 57 | 0 |
| 375x667 @200 dark | over-carried | end | 3 | panel 236/236 doc 0/0 | 163/163 · ovl 0 · cov 0 · [319, 10, 363, 54] | — | — | Mark it done: 0/163; Put the kettle o: 0/163; That's all for n: 0/163 | 57 | 0 |
| 375x667 @200 dark | paused | top | 1 | panel 0/177 doc 0/0 | — | 146/146 · ovl 0 · cov 0 · [194, 48, 311, 97] | 146/146 · ovl 0 · cov 0 · [319, 50, 363, 94] | Skip break: 0/0 (146 off); Resume break: 0/0 (146 off); Start next brew: 0/0 (146 off) | 57 | 0 |
| 375x667 @200 dark | paused | top | 3 | panel 0/177 doc 0/0 | — | 124/124 · ovl 0 · cov 0 · [194, 48, 311, 97] | 124/124 · ovl 0 · cov 0 · [319, 50, 363, 94] | Skip break: 0/0 (124 off); Resume break: 0/0 (124 off); Start next brew: 0/0 (124 off) | 57 | 0 |
| 375x667 @200 dark | paused | end | 1 | panel 177/177 doc 0/0 | — | 156/156 · ovl 0 · cov 0 · [194, 48, 311, 97] | 156/156 · ovl 0 · cov 0 · [319, 50, 363, 94] | Skip break: 0/156; Resume break: 0/156; Start next brew: 0/156 | 57 | 0 |
| 375x667 @200 dark | paused | end | 3 | panel 177/177 doc 0/0 | — | 131/131 · ovl 0 · cov 0 · [194, 48, 311, 97] | 131/131 · ovl 0 · cov 0 · [319, 50, 363, 94] | Skip break: 0/131; Resume break: 0/131; Start next brew: 0/131 | 57 | 0 |
| 375x667 @200 dark | focus | top | 1 | panel 0/60 doc 0/0 | — | 87/87 · ovl 0 · cov 0 · [194, 48, 311, 97] | 87/87 · ovl 0 · cov 0 · [319, 50, 363, 94] | Add 5 minutes: 0/87; (Pause|Resume): 0/87; End session: 0/87 | 57 | 0 |
| 375x667 @200 dark | focus | top | 3 | panel 0/60 doc 0/0 | — | 113/113 · ovl 0 · cov 0 · [194, 48, 311, 97] | 113/113 · ovl 0 · cov 0 · [319, 50, 363, 94] | Add 5 minutes: 0/113; (Pause|Resume): 0/113; End session: 0/113 | 57 | 0 |
| 375x667 @200 dark | focus | end | 1 | panel 60/60 doc 0/0 | — | 103/103 · ovl 0 · cov 0 · [194, 48, 311, 97] | 103/103 · ovl 0 · cov 0 · [319, 50, 363, 94] | Add 5 minutes: 0/103; (Pause|Resume): 0/103; End session: 0/103 | 57 | 0 |
| 375x667 @200 dark | focus | end | 3 | panel 60/60 doc 0/0 | — | 85/85 · ovl 0 · cov 0 · [194, 48, 311, 97] | 85/85 · ovl 0 · cov 0 · [319, 50, 363, 94] | Add 5 minutes: 0/85; (Pause|Resume): 0/85; End session: 0/85 | 57 | 0 |
| 390x844 @200 light | over-carried | top | 1 | panel 0/126 doc 0/0 | 201/201 · ovl 0 · cov 0 · [334, 10, 378, 54] | — | — | Mark it done: 0/201; Put the kettle o: 0/201; That's all for n: 0/0 (201 off) | 57 | 0 |
| 390x844 @200 light | over-carried | top | 3 | panel 0/126 doc 0/0 | 184/184 · ovl 0 · cov 0 · [334, 10, 378, 54] | — | — | Mark it done: 0/184; Put the kettle o: 0/184; That's all for n: 0/0 (184 off) | 57 | 0 |
| 390x844 @200 light | over-carried | end | 1 | panel 126/126 doc 0/0 | 192/192 · ovl 0 · cov 0 · [334, 10, 378, 54] | — | — | Mark it done: 0/192; Put the kettle o: 0/192; That's all for n: 0/192 | 57 | 0 |
| 390x844 @200 light | over-carried | end | 3 | panel 126/126 doc 0/0 | 191/191 · ovl 0 · cov 0 · [334, 10, 378, 54] | — | — | Mark it done: 0/191; Put the kettle o: 0/191; That's all for n: 0/191 | 57 | 0 |
| 390x844 @200 light | paused | top | 1 | panel 0/137 doc 0/0 | — | 156/156 · ovl 0 · cov 0 · [209, 29, 326, 78] | 156/156 · ovl 0 · cov 0 · [334, 32, 378, 76] | Skip break: 0/156; Resume break: 0/156; Start next brew: 0/156 | 57 | 0 |
| 390x844 @200 light | paused | top | 3 | panel 0/137 doc 0/0 | — | 125/125 · ovl 0 · cov 0 · [209, 29, 326, 78] | 125/125 · ovl 0 · cov 0 · [334, 32, 378, 76] | Skip break: 0/125; Resume break: 0/125; Start next brew: 0/125 | 57 | 0 |
| 390x844 @200 light | paused | end | 1 | panel 137/137 doc 0/0 | — | 154/154 · ovl 0 · cov 0 · [209, 29, 326, 78] | 154/154 · ovl 0 · cov 0 · [334, 32, 378, 76] | Skip break: 0/154; Resume break: 0/154; Start next brew: 0/154 | 57 | 0 |
| 390x844 @200 light | paused | end | 3 | panel 137/137 doc 0/0 | — | 148/148 · ovl 0 · cov 0 · [209, 29, 326, 78] | 148/148 · ovl 0 · cov 0 · [334, 32, 378, 76] | Skip break: 0/148; Resume break: 0/148; Start next brew: 0/148 | 57 | 0 |
| 390x844 @200 light | focus | top | 1 | panel 0/24 doc 0/0 | — | 119/119 · ovl 0 · cov 0 · [209, 48, 326, 97] | 119/119 · ovl 0 · cov 0 · [334, 50, 378, 94] | Add 5 minutes: 0/119; (Pause|Resume): 0/119; End session: 0/119 | 57 | 0 |
| 390x844 @200 light | focus | top | 3 | panel 0/24 doc 0/0 | — | 52/52 · ovl 0 · cov 0 · [209, 48, 326, 97] | 52/52 · ovl 0 · cov 0 · [334, 50, 378, 94] | Add 5 minutes: 0/52; (Pause|Resume): 0/52; End session: 0/52 | 57 | 0 |
| 390x844 @200 light | focus | end | 1 | panel 24/24 doc 0/0 | — | 118/118 · ovl 0 · cov 0 · [209, 48, 326, 97] | 118/118 · ovl 0 · cov 0 · [334, 50, 378, 94] | Add 5 minutes: 0/118; (Pause|Resume): 0/118; End session: 0/118 | 57 | 0 |
| 390x844 @200 light | focus | end | 3 | panel 24/24 doc 0/0 | — | 82/82 · ovl 0 · cov 0 · [209, 48, 326, 97] | 82/82 · ovl 0 · cov 0 · [334, 50, 378, 94] | Add 5 minutes: 0/82; (Pause|Resume): 0/82; End session: 0/82 | 57 | 0 |
| 390x844 @200 dark | over-carried | top | 1 | panel 0/126 doc 0/0 | 179/179 · ovl 0 · cov 0 · [334, 10, 378, 54] | — | — | Mark it done: 0/179; Put the kettle o: 0/179; That's all for n: 0/0 (179 off) | 57 | 0 |
| 390x844 @200 dark | over-carried | top | 3 | panel 0/126 doc 0/0 | 198/198 · ovl 0 · cov 0 · [334, 10, 378, 54] | — | — | Mark it done: 0/198; Put the kettle o: 0/198; That's all for n: 0/0 (198 off) | 57 | 0 |
| 390x844 @200 dark | over-carried | end | 1 | panel 126/126 doc 0/0 | 182/182 · ovl 0 · cov 0 · [334, 10, 378, 54] | — | — | Mark it done: 0/182; Put the kettle o: 0/182; That's all for n: 0/182 | 57 | 0 |
| 390x844 @200 dark | over-carried | end | 3 | panel 126/126 doc 0/0 | 172/172 · ovl 0 · cov 0 · [334, 10, 378, 54] | — | — | Mark it done: 0/172; Put the kettle o: 0/172; That's all for n: 0/172 | 57 | 0 |
| 390x844 @200 dark | paused | top | 1 | panel 0/137 doc 0/0 | — | 136/136 · ovl 0 · cov 0 · [209, 29, 326, 78] | 136/136 · ovl 0 · cov 0 · [334, 32, 378, 76] | Skip break: 0/136; Resume break: 0/136; Start next brew: 0/136 | 57 | 0 |
| 390x844 @200 dark | paused | top | 3 | panel 0/137 doc 0/0 | — | 106/106 · ovl 0 · cov 0 · [209, 29, 326, 78] | 106/106 · ovl 0 · cov 0 · [334, 32, 378, 76] | Skip break: 0/106; Resume break: 0/106; Start next brew: 0/106 | 57 | 0 |
| 390x844 @200 dark | paused | end | 1 | panel 137/137 doc 0/0 | — | 158/158 · ovl 0 · cov 0 · [209, 29, 326, 78] | 158/158 · ovl 0 · cov 0 · [334, 32, 378, 76] | Skip break: 0/158; Resume break: 0/158; Start next brew: 0/158 | 57 | 0 |
| 390x844 @200 dark | paused | end | 3 | panel 137/137 doc 0/0 | — | 135/135 · ovl 0 · cov 0 · [209, 29, 326, 78] | 135/135 · ovl 0 · cov 0 · [334, 32, 378, 76] | Skip break: 0/135; Resume break: 0/135; Start next brew: 0/135 | 57 | 0 |
| 390x844 @200 dark | focus | top | 1 | panel 0/24 doc 0/0 | — | 103/103 · ovl 0 · cov 0 · [209, 48, 326, 97] | 103/103 · ovl 0 · cov 0 · [334, 50, 378, 94] | Add 5 minutes: 0/103; (Pause|Resume): 0/103; End session: 0/103 | 57 | 0 |
| 390x844 @200 dark | focus | top | 3 | panel 0/24 doc 0/0 | — | 118/118 · ovl 0 · cov 0 · [209, 48, 326, 97] | 118/118 · ovl 0 · cov 0 · [334, 50, 378, 94] | Add 5 minutes: 0/118; (Pause|Resume): 0/118; End session: 0/118 | 57 | 0 |
| 390x844 @200 dark | focus | end | 1 | panel 24/24 doc 0/0 | — | 70/70 · ovl 0 · cov 0 · [209, 48, 326, 97] | 70/70 · ovl 0 · cov 0 · [334, 50, 378, 94] | Add 5 minutes: 0/70; (Pause|Resume): 0/70; End session: 0/70 | 57 | 0 |
| 390x844 @200 dark | focus | end | 3 | panel 24/24 doc 0/0 | — | 82/82 · ovl 0 · cov 0 · [209, 48, 326, 97] | 82/82 · ovl 0 · cov 0 · [334, 50, 378, 94] | Add 5 minutes: 0/82; (Pause|Resume): 0/82; End session: 0/82 | 57 | 0 |
| 667x375 @200 light | over-carried | top | 1 | panel 0/353 doc 0/0 | 180/180 · ovl 0 · cov 0 · [607, 13, 651, 57] | — | — | Mark it done: 0/0 (180 off); Put the kettle o: 0/0 (180 off); That's all for n: 0/0 (180 off) | 57 | 0 |
| 667x375 @200 light | over-carried | top | 3 | panel 0/353 doc 0/0 | 182/182 · ovl 0 · cov 0 · [607, 13, 651, 57] | — | — | Mark it done: 0/0 (182 off); Put the kettle o: 0/0 (182 off); That's all for n: 0/0 (182 off) | 57 | 0 |
| 667x375 @200 light | over-carried | end | 1 | panel 353/353 doc 0/0 | 201/201 · ovl 0 · cov 0 · [607, 13, 651, 57] | — | — | Mark it done: 0/201; Put the kettle o: 0/201; That's all for n: 0/201 | 19 | 0 |
| 667x375 @200 light | over-carried | end | 3 | panel 353/353 doc 0/0 | 195/195 · ovl 0 · cov 0 · [607, 13, 651, 57] | — | — | Mark it done: 0/195; Put the kettle o: 0/195; That's all for n: 0/195 | 0 | 0 |
| 667x375 @200 light | paused | top | 1 | panel 0/98 doc 0/0 | — | 170/170 · ovl 0 · cov 0 · [482, 50, 599, 99] | 170/170 · ovl 0 · cov 0 · [607, 52, 651, 96] | Skip break: 0/0 (170 off); Resume break: 0/0 (170 off); Start next brew: 0/0 (170 off) | 57 | 0 |
| 667x375 @200 light | paused | top | 3 | panel 0/98 doc 0/0 | — | 189/189 · ovl 0 · cov 0 · [482, 50, 599, 99] | 189/189 · ovl 0 · cov 0 · [607, 52, 651, 96] | Skip break: 0/0 (189 off); Resume break: 0/0 (189 off); Start next brew: 0/0 (189 off) | 25 | 0 |
| 667x375 @200 light | paused | end | 1 | panel 98/98 doc 0/0 | — | 187/187 · ovl 0 · cov 0 · [482, 50, 599, 99] | 187/187 · ovl 0 · cov 0 · [607, 52, 651, 96] | Skip break: 0/187; Resume break: 0/187; Start next brew: 0/187 | 57 | 0 |
| 667x375 @200 light | paused | end | 3 | panel 98/98 doc 0/0 | — | 173/173 · ovl 0 · cov 0 · [482, 50, 599, 99] | 173/173 · ovl 0 · cov 0 · [607, 52, 651, 96] | Skip break: 0/173; Resume break: 0/173; Start next brew: 0/173 | 53 | 0 |
| 667x375 @200 light | focus | top | 1 | panel 0/56 doc 0/0 | — | 149/149 · ovl 0 · cov 0 · [482, 50, 599, 99] | 149/149 · ovl 0 · cov 0 · [607, 52, 651, 96] | Add 5 minutes: 0/149; (Pause|Resume): 0/149; End session: 0/149 | 57 | 0 |
| 667x375 @200 light | focus | top | 3 | panel 0/56 doc 0/0 | — | 92/92 · ovl 0 · cov 0 · [482, 50, 599, 99] | 92/92 · ovl 0 · cov 0 · [607, 52, 651, 96] | Add 5 minutes: 0/92; (Pause|Resume): 0/92; End session: 0/92 | 57 | 0 |
| 667x375 @200 light | focus | end | 1 | panel 56/56 doc 0/0 | — | 123/123 · ovl 0 · cov 0 · [482, 50, 599, 99] | 123/123 · ovl 0 · cov 0 · [607, 52, 651, 96] | Add 5 minutes: 0/123; (Pause|Resume): 0/123; End session: 0/123 | 57 | 0 |
| 667x375 @200 light | focus | end | 3 | panel 56/56 doc 0/0 | — | 137/137 · ovl 0 · cov 0 · [482, 50, 599, 99] | 137/137 · ovl 0 · cov 0 · [607, 52, 651, 96] | Add 5 minutes: 0/137; (Pause|Resume): 0/137; End session: 0/137 | 53 | 0 |
| 667x375 @200 dark | over-carried | top | 1 | panel 0/353 doc 0/0 | 192/192 · ovl 0 · cov 0 · [607, 13, 651, 57] | — | — | Mark it done: 0/0 (192 off); Put the kettle o: 0/0 (192 off); That's all for n: 0/0 (192 off) | 57 | 0 |
| 667x375 @200 dark | over-carried | top | 3 | panel 0/353 doc 0/0 | 161/161 · ovl 0 · cov 0 · [607, 13, 651, 57] | — | — | Mark it done: 0/0 (161 off); Put the kettle o: 0/0 (161 off); That's all for n: 0/0 (161 off) | 57 | 0 |
| 667x375 @200 dark | over-carried | end | 1 | panel 353/353 doc 0/0 | 208/208 · ovl 0 · cov 0 · [607, 13, 651, 57] | — | — | Mark it done: 0/208; Put the kettle o: 0/208; That's all for n: 0/208 | 19 | 0 |
| 667x375 @200 dark | over-carried | end | 3 | panel 353/353 doc 0/0 | 191/191 · ovl 0 · cov 0 · [607, 13, 651, 57] | — | — | Mark it done: 0/191; Put the kettle o: 0/191; That's all for n: 0/191 | 0 | 0 |
| 667x375 @200 dark | paused | top | 1 | panel 0/98 doc 0/0 | — | 177/177 · ovl 0 · cov 0 · [482, 50, 599, 99] | 177/177 · ovl 0 · cov 0 · [607, 52, 651, 96] | Skip break: 0/0 (177 off); Resume break: 0/0 (177 off); Start next brew: 0/0 (177 off) | 57 | 0 |
| 667x375 @200 dark | paused | top | 3 | panel 0/98 doc 0/0 | — | 174/174 · ovl 0 · cov 0 · [482, 50, 599, 99] | 174/174 · ovl 0 · cov 0 · [607, 52, 651, 96] | Skip break: 0/0 (174 off); Resume break: 0/0 (174 off); Start next brew: 0/0 (174 off) | 25 | 0 |
| 667x375 @200 dark | paused | end | 1 | panel 98/98 doc 0/0 | — | 162/162 · ovl 0 · cov 0 · [482, 50, 599, 99] | 162/162 · ovl 0 · cov 0 · [607, 52, 651, 96] | Skip break: 0/162; Resume break: 0/162; Start next brew: 0/162 | 57 | 0 |
| 667x375 @200 dark | paused | end | 3 | panel 98/98 doc 0/0 | — | 160/160 · ovl 0 · cov 0 · [482, 50, 599, 99] | 160/160 · ovl 0 · cov 0 · [607, 52, 651, 96] | Skip break: 0/160; Resume break: 0/160; Start next brew: 0/160 | 53 | 0 |
| 667x375 @200 dark | focus | top | 1 | panel 0/56 doc 0/0 | — | 142/142 · ovl 0 · cov 0 · [482, 50, 599, 99] | 142/142 · ovl 0 · cov 0 · [607, 52, 651, 96] | Add 5 minutes: 0/142; (Pause|Resume): 0/142; End session: 0/142 | 57 | 0 |
| 667x375 @200 dark | focus | top | 3 | panel 0/56 doc 0/0 | — | 139/139 · ovl 0 · cov 0 · [482, 50, 599, 99] | 139/139 · ovl 0 · cov 0 · [607, 52, 651, 96] | Add 5 minutes: 0/139; (Pause|Resume): 0/139; End session: 0/139 | 57 | 0 |
| 667x375 @200 dark | focus | end | 1 | panel 56/56 doc 0/0 | — | 117/117 · ovl 0 · cov 0 · [482, 50, 599, 99] | 117/117 · ovl 0 · cov 0 · [607, 52, 651, 96] | Add 5 minutes: 0/117; (Pause|Resume): 0/117; End session: 0/117 | 57 | 0 |
| 667x375 @200 dark | focus | end | 3 | panel 56/56 doc 0/0 | — | 110/110 · ovl 0 · cov 0 · [482, 50, 599, 99] | 110/110 · ovl 0 · cov 0 · [607, 52, 651, 96] | Add 5 minutes: 0/110; (Pause|Resume): 0/110; End session: 0/110 | 53 | 0 |
| 844x390 @200 light | over-carried | top | 1 | panel 0/338 doc 0/0 | 199/199 · ovl 0 · cov 0 · [784, 13, 828, 57] | — | — | Mark it done: 0/0 (199 off); Put the kettle o: 0/0 (199 off); That's all for n: 0/0 (199 off) | 57 | 0 |
| 844x390 @200 light | over-carried | top | 3 | panel 0/338 doc 0/0 | 175/175 · ovl 0 · cov 0 · [784, 13, 828, 57] | — | — | Mark it done: 0/0 (175 off); Put the kettle o: 0/0 (175 off); That's all for n: 0/0 (175 off) | 57 | 0 |
| 844x390 @200 light | over-carried | end | 1 | panel 338/338 doc 0/0 | 207/207 · ovl 0 · cov 0 · [784, 13, 828, 57] | — | — | Mark it done: 0/207; Put the kettle o: 0/207; That's all for n: 0/207 | 34 | 0 |
| 844x390 @200 light | over-carried | end | 3 | panel 338/338 doc 0/0 | 179/179 · ovl 0 · cov 0 · [784, 13, 828, 57] | — | — | Mark it done: 0/179; Put the kettle o: 0/179; That's all for n: 0/179 | 0 | 0 |
| 844x390 @200 light | paused | top | 1 | panel 0/83 doc 0/0 | — | 139/139 · ovl 0 · cov 0 · [659, 50, 776, 99] | 139/139 · ovl 0 · cov 0 · [784, 52, 828, 96] | Skip break: 0/0 (139 off); Resume break: 0/0 (139 off); Start next brew: 0/0 (139 off) | 57 | 0 |
| 844x390 @200 light | paused | top | 3 | panel 0/83 doc 0/0 | — | 143/143 · ovl 0 · cov 0 · [659, 50, 776, 99] | 143/143 · ovl 0 · cov 0 · [784, 52, 828, 96] | Skip break: 0/0 (143 off); Resume break: 0/0 (143 off); Start next brew: 0/0 (143 off) | 57 | 0 |
| 844x390 @200 light | paused | end | 1 | panel 83/83 doc 0/0 | — | 168/168 · ovl 0 · cov 0 · [659, 50, 776, 99] | 168/168 · ovl 0 · cov 0 · [784, 52, 828, 96] | Skip break: 0/168; Resume break: 0/168; Start next brew: 0/168 | 57 | 0 |
| 844x390 @200 light | paused | end | 3 | panel 83/83 doc 0/0 | — | 120/120 · ovl 0 · cov 0 · [659, 50, 776, 99] | 120/120 · ovl 0 · cov 0 · [784, 52, 828, 96] | Skip break: 0/120; Resume break: 0/120; Start next brew: 0/120 | 57 | 0 |
| 844x390 @200 light | focus | top | 1 | panel 0/41 doc 0/0 | — | 89/89 · ovl 0 · cov 0 · [659, 50, 776, 99] | 89/89 · ovl 0 · cov 0 · [784, 52, 828, 96] | Add 5 minutes: 0/89; (Pause|Resume): 0/89; End session: 0/89 | 57 | 0 |
| 844x390 @200 light | focus | top | 3 | panel 0/41 doc 0/0 | — | 46/46 · ovl 0 · cov 0 · [659, 50, 776, 99] | 46/46 · ovl 0 · cov 0 · [784, 52, 828, 96] | Add 5 minutes: 0/46; (Pause|Resume): 0/46; End session: 0/46 | 57 | 0 |
| 844x390 @200 light | focus | end | 1 | panel 41/41 doc 0/0 | — | 78/78 · ovl 0 · cov 0 · [659, 50, 776, 99] | 78/78 · ovl 0 · cov 0 · [784, 52, 828, 96] | Add 5 minutes: 0/78; (Pause|Resume): 0/78; End session: 0/78 | 57 | 0 |
| 844x390 @200 light | focus | end | 3 | panel 41/41 doc 0/0 | — | 68/68 · ovl 0 · cov 0 · [659, 50, 776, 99] | 68/68 · ovl 0 · cov 0 · [784, 52, 828, 96] | Add 5 minutes: 0/68; (Pause|Resume): 0/68; End session: 0/68 | 57 | 0 |
| 844x390 @200 dark | over-carried | top | 1 | panel 0/338 doc 0/0 | 198/198 · ovl 0 · cov 0 · [784, 13, 828, 57] | — | — | Mark it done: 0/0 (198 off); Put the kettle o: 0/0 (198 off); That's all for n: 0/0 (198 off) | 57 | 0 |
| 844x390 @200 dark | over-carried | top | 3 | panel 0/338 doc 0/0 | 177/177 · ovl 0 · cov 0 · [784, 13, 828, 57] | — | — | Mark it done: 0/0 (177 off); Put the kettle o: 0/0 (177 off); That's all for n: 0/0 (177 off) | 57 | 0 |
| 844x390 @200 dark | over-carried | end | 1 | panel 338/338 doc 0/0 | 226/226 · ovl 0 · cov 0 · [784, 13, 828, 57] | — | — | Mark it done: 0/226; Put the kettle o: 0/226; That's all for n: 0/226 | 34 | 0 |
| 844x390 @200 dark | over-carried | end | 3 | panel 338/338 doc 0/0 | 189/189 · ovl 0 · cov 0 · [784, 13, 828, 57] | — | — | Mark it done: 0/189; Put the kettle o: 0/189; That's all for n: 0/189 | 0 | 0 |
| 844x390 @200 dark | paused | top | 1 | panel 0/83 doc 0/0 | — | 132/132 · ovl 0 · cov 0 · [659, 50, 776, 99] | 132/132 · ovl 0 · cov 0 · [784, 52, 828, 96] | Skip break: 0/0 (132 off); Resume break: 0/0 (132 off); Start next brew: 0/0 (132 off) | 57 | 0 |
| 844x390 @200 dark | paused | top | 3 | panel 0/83 doc 0/0 | — | 84/84 · ovl 0 · cov 0 · [659, 50, 776, 99] | 84/84 · ovl 0 · cov 0 · [784, 52, 828, 96] | Skip break: 0/0 (84 off); Resume break: 0/0 (84 off); Start next brew: 0/0 (84 off) | 57 | 0 |
| 844x390 @200 dark | paused | end | 1 | panel 83/83 doc 0/0 | — | 160/160 · ovl 0 · cov 0 · [659, 50, 776, 99] | 160/160 · ovl 0 · cov 0 · [784, 52, 828, 96] | Skip break: 0/160; Resume break: 0/160; Start next brew: 0/160 | 57 | 0 |
| 844x390 @200 dark | paused | end | 3 | panel 83/83 doc 0/0 | — | 101/101 · ovl 0 · cov 0 · [659, 50, 776, 99] | 101/101 · ovl 0 · cov 0 · [784, 52, 828, 96] | Skip break: 0/101; Resume break: 0/101; Start next brew: 0/101 | 57 | 0 |
| 844x390 @200 dark | focus | top | 1 | panel 0/41 doc 0/0 | — | 47/47 · ovl 0 · cov 0 · [659, 50, 776, 99] | 47/47 · ovl 0 · cov 0 · [784, 52, 828, 96] | Add 5 minutes: 0/47; (Pause|Resume): 0/47; End session: 0/47 | 57 | 0 |
| 844x390 @200 dark | focus | top | 3 | panel 0/41 doc 0/0 | — | 46/46 · ovl 0 · cov 0 · [659, 50, 776, 99] | 46/46 · ovl 0 · cov 0 · [784, 52, 828, 96] | Add 5 minutes: 0/46; (Pause|Resume): 0/46; End session: 0/46 | 57 | 0 |
| 844x390 @200 dark | focus | end | 1 | panel 41/41 doc 0/0 | — | 44/44 · ovl 0 · cov 0 · [659, 50, 776, 99] | 44/44 · ovl 0 · cov 0 · [784, 52, 828, 96] | Add 5 minutes: 0/44; (Pause|Resume): 0/44; End session: 0/44 | 57 | 0 |
| 844x390 @200 dark | focus | end | 3 | panel 41/41 doc 0/0 | — | 31/31 · ovl 0 · cov 0 · [659, 50, 776, 99] | 31/31 · ovl 0 · cov 0 · [784, 52, 828, 96] | Add 5 minutes: 0/31; (Pause|Resume): 0/31; End session: 0/31 | 57 | 0 |
| 375x667 @100 light | over-carried | top | 1 | panel 0/0 doc 0/0 | 178/178 · ovl 0 · cov 0 · [319, 10, 363, 54] | — | — | Mark it done: 0/178; Put the kettle o: 0/178; That's all for n: 0/178 | 52 | 0 |
| 375x667 @100 light | over-carried | top | 3 | panel 0/0 doc 0/0 | 145/145 · ovl 0 · cov 0 · [319, 10, 363, 54] | — | — | Mark it done: 0/145; Put the kettle o: 0/145; That's all for n: 0/145 | 52 | 0 |
| 375x667 @100 light | over-carried | end | 1 | panel 0/0 doc 0/0 | 172/172 · ovl 0 · cov 0 · [319, 10, 363, 54] | — | — | Mark it done: 0/172; Put the kettle o: 0/172; That's all for n: 0/172 | 52 | 0 |
| 375x667 @100 light | over-carried | end | 3 | panel 0/0 doc 0/0 | 151/151 · ovl 0 · cov 0 · [319, 10, 363, 54] | — | — | Mark it done: 0/151; Put the kettle o: 0/151; That's all for n: 0/151 | 52 | 0 |
| 375x667 @100 light | paused | top | 1 | panel 0/0 doc 0/0 | — | 143/143 · ovl 0 · cov 0 · [225, 10, 311, 54] | 143/143 · ovl 0 · cov 0 · [319, 10, 363, 54] | Skip break: 2/143; Resume break: 3/143; Start next brew: 2/143 | 52 | 0 |
| 375x667 @100 light | paused | top | 3 | panel 0/0 doc 0/0 | — | 78/78 · ovl 0 · cov 0 · [225, 10, 311, 54] | 78/78 · ovl 0 · cov 0 · [319, 10, 363, 54] | Skip break: 2/78; Resume break: 3/78; Start next brew: 2/78 | 52 | 0 |
| 375x667 @100 light | paused | end | 1 | panel 0/0 doc 0/0 | — | 129/129 · ovl 0 · cov 0 · [225, 10, 311, 54] | 129/129 · ovl 0 · cov 0 · [319, 10, 363, 54] | Skip break: 1/129; Resume break: 2/129; Start next brew: 1/129 | 52 | 0 |
| 375x667 @100 light | paused | end | 3 | panel 0/0 doc 0/0 | — | 111/111 · ovl 0 · cov 0 · [225, 10, 311, 54] | 111/111 · ovl 0 · cov 0 · [319, 10, 363, 54] | Skip break: 1/111; Resume break: 3/111; Start next brew: 1/111 | 52 | 0 |
| 375x667 @100 light | focus | top | 1 | panel 0/0 doc 0/0 | — | 88/88 · ovl 0 · cov 0 · [225, 13, 311, 57] | 88/88 · ovl 0 · cov 0 · [319, 13, 363, 57] | Add 5 minutes: 1/88; (Pause|Resume): 1/88; End session: 1/88 | 52 | 0 |
| 375x667 @100 light | focus | top | 3 | panel 0/0 doc 0/0 | — | 60/60 · ovl 0 · cov 0 · [225, 13, 311, 57] | 60/60 · ovl 0 · cov 0 · [319, 13, 363, 57] | Add 5 minutes: 1/60; (Pause|Resume): 1/60; End session: 1/60 | 52 | 0 |
| 375x667 @100 light | focus | end | 1 | panel 0/0 doc 0/0 | — | 76/76 · ovl 0 · cov 0 · [225, 13, 311, 57] | 76/76 · ovl 0 · cov 0 · [319, 13, 363, 57] | Add 5 minutes: 3/76; (Pause|Resume): 3/76; End session: 3/76 | 52 | 0 |
| 375x667 @100 light | focus | end | 3 | panel 0/0 doc 0/0 | — | 34/34 · ovl 0 · cov 0 · [225, 13, 311, 57] | 34/34 · ovl 0 · cov 0 · [319, 13, 363, 57] | Add 5 minutes: 3/34; (Pause|Resume): 3/34; End session: 3/34 | 52 | 0 |
| 1440x900 @100 light | over-carried | top | 1 | panel 0/0 doc 0/0 | 151/151 · ovl 0 · cov 0 · [1356, 24, 1400, 68] | — | — | Mark it done: 0/151; Put the kettle o: 0/151; That's all for n: 0/151 | 52 | 0 |
| 1440x900 @100 light | over-carried | top | 3 | panel 0/0 doc 0/0 | 132/132 · ovl 0 · cov 0 · [1356, 24, 1400, 68] | — | — | Mark it done: 0/132; Put the kettle o: 0/132; That's all for n: 0/132 | 52 | 0 |
| 1440x900 @100 light | over-carried | end | 1 | panel 0/0 doc 0/0 | 152/152 · ovl 0 · cov 0 · [1356, 24, 1400, 68] | — | — | Mark it done: 0/152; Put the kettle o: 0/152; That's all for n: 0/152 | 52 | 0 |
| 1440x900 @100 light | over-carried | end | 3 | panel 0/0 doc 0/0 | 133/133 · ovl 0 · cov 0 · [1356, 24, 1400, 68] | — | — | Mark it done: 0/133; Put the kettle o: 0/133; That's all for n: 0/133 | 52 | 0 |
| 1440x900 @100 light | paused | top | 1 | panel 0/0 doc 0/0 | — | 64/64 · ovl 0 · cov 0 · [1262, 24, 1348, 68] | 64/64 · ovl 0 · cov 0 · [1356, 24, 1400, 68] | Skip break: 0/64; Resume break: 0/64; Start next brew: 0/64 | 52 | 0 |
| 1440x900 @100 light | paused | top | 3 | panel 0/0 doc 0/0 | — | 69/69 · ovl 0 · cov 0 · [1262, 24, 1348, 68] | 69/69 · ovl 0 · cov 0 · [1356, 24, 1400, 68] | Skip break: 0/69; Resume break: 0/69; Start next brew: 0/69 | 52 | 0 |
| 1440x900 @100 light | paused | end | 1 | panel 0/0 doc 0/0 | — | 79/79 · ovl 0 · cov 0 · [1262, 24, 1348, 68] | 79/79 · ovl 0 · cov 0 · [1356, 24, 1400, 68] | Skip break: 0/79; Resume break: 0/79; Start next brew: 0/79 | 52 | 0 |
| 1440x900 @100 light | paused | end | 3 | panel 0/0 doc 0/0 | — | 73/73 · ovl 0 · cov 0 · [1262, 24, 1348, 68] | 73/73 · ovl 0 · cov 0 · [1356, 24, 1400, 68] | Skip break: 0/73; Resume break: 0/73; Start next brew: 0/73 | 52 | 0 |
| 1440x900 @100 light | focus | top | 1 | panel 0/0 doc 0/0 | — | 39/39 · ovl 0 · cov 0 · [1262, 24, 1348, 68] | 39/39 · ovl 0 · cov 0 · [1356, 24, 1400, 68] | Add 5 minutes: 0/39; (Pause|Resume): 0/39; End session: 0/39 | 52 | 0 |
| 1440x900 @100 light | focus | top | 3 | panel 0/0 doc 0/0 | — | 60/60 · ovl 0 · cov 0 · [1262, 24, 1348, 68] | 60/60 · ovl 0 · cov 0 · [1356, 24, 1400, 68] | Add 5 minutes: 0/60; (Pause|Resume): 0/60; End session: 0/60 | 52 | 0 |
| 1440x900 @100 light | focus | end | 1 | panel 0/0 doc 0/0 | — | 41/41 · ovl 0 · cov 0 · [1262, 24, 1348, 68] | 41/41 · ovl 0 · cov 0 · [1356, 24, 1400, 68] | Add 5 minutes: 0/41; (Pause|Resume): 0/41; End session: 0/41 | 52 | 0 |
| 1440x900 @100 light | focus | end | 3 | panel 0/0 doc 0/0 | — | 51/51 · ovl 0 · cov 0 · [1262, 24, 1348, 68] | 51/51 · ovl 0 · cov 0 · [1356, 24, 1400, 68] | Add 5 minutes: 0/51; (Pause|Resume): 0/51; End session: 0/51 | 52 | 0 |

## Detail: real taps

| cfg | state | control | where | toasts at tap | rect | centre hit before tap | hit element | activated | evidence |
|---|---|---|---|---|---|---|---|---|---|
| 375x667 @200 light | over-carried | Close | top | 3 | [319, 10, 363, 54] | True | button:Close | True (touch tap) | hash #/focus -> #/ |
| 375x667 @200 light | over-carried | Close | end | 3 | [319, 10, 363, 54] | True | button:Close | True (touch tap) | hash #/focus -> #/ |
| 375x667 @200 light | paused | Mute | top | 3 | [319, 50, 363, 94] | True | button:Turn sound on | True (touch tap) | label ['Turn sound on', 'true'] -> ['Mute sounds', 'false']; restored True |
| 375x667 @200 light | paused | Ambience | top | 3 | [194, 48, 311, 97] | True | button:Ambience: Rain. Change | True (touch tap) | dialog {'open': True, 'text': 'AmbienceTap to listen. The win'}; closed True by Escape |
| 375x667 @200 light | paused | Mute | end | 3 | [319, 50, 363, 94] | True | button:Turn sound on | True (touch tap) | label ['Turn sound on', 'true'] -> ['Mute sounds', 'false']; restored True |
| 375x667 @200 light | paused | Ambience | end | 3 | [194, 48, 311, 97] | True | button:Ambience: Rain. Change | True (touch tap) | dialog {'open': True, 'text': 'AmbienceTap to listen. The win'}; closed True by Escape |
| 375x667 @200 light | focus | Mute | top | 3 | [319, 50, 363, 94] | True | button:Turn sound on | True (touch tap) | label ['Turn sound on', 'true'] -> ['Mute sounds', 'false']; restored True |
| 375x667 @200 light | focus | Ambience | top | 3 | [194, 48, 311, 97] | True | button:Ambience: Rain. Change | True (touch tap) | dialog {'open': True, 'text': 'AmbienceTap to listen. The win'}; closed True by Escape |
| 375x667 @200 light | focus | Mute | end | 3 | [319, 50, 363, 94] | True | button:Turn sound on | True (touch tap) | label ['Turn sound on', 'true'] -> ['Mute sounds', 'false']; restored True |
| 375x667 @200 light | focus | Ambience | end | 3 | [194, 48, 311, 97] | True | button:Ambience: Rain. Change | True (touch tap) | dialog {'open': True, 'text': 'AmbienceTap to listen. The win'}; closed True by Escape |
| 375x667 @200 dark | over-carried | Close | top | 3 | [319, 10, 363, 54] | True | button:Close | True (touch tap) | hash #/focus -> #/ |
| 375x667 @200 dark | over-carried | Close | end | 3 | [319, 10, 363, 54] | True | button:Close | True (touch tap) | hash #/focus -> #/ |
| 375x667 @200 dark | paused | Mute | top | 3 | [319, 50, 363, 94] | True | button:Turn sound on | True (touch tap) | label ['Turn sound on', 'true'] -> ['Mute sounds', 'false']; restored True |
| 375x667 @200 dark | paused | Ambience | top | 3 | [194, 48, 311, 97] | True | button:Ambience: Rain. Change | True (touch tap) | dialog {'open': True, 'text': 'AmbienceTap to listen. The win'}; closed True by Escape |
| 375x667 @200 dark | paused | Mute | end | 3 | [319, 50, 363, 94] | True | button:Turn sound on | True (touch tap) | label ['Turn sound on', 'true'] -> ['Mute sounds', 'false']; restored True |
| 375x667 @200 dark | paused | Ambience | end | 3 | [194, 48, 311, 97] | True | button:Ambience: Rain. Change | True (touch tap) | dialog {'open': True, 'text': 'AmbienceTap to listen. The win'}; closed True by Escape |
| 375x667 @200 dark | focus | Mute | top | 3 | [319, 50, 363, 94] | True | button:Turn sound on | True (touch tap) | label ['Turn sound on', 'true'] -> ['Mute sounds', 'false']; restored True |
| 375x667 @200 dark | focus | Ambience | top | 3 | [194, 48, 311, 97] | True | button:Ambience: Rain. Change | True (touch tap) | dialog {'open': True, 'text': 'AmbienceTap to listen. The win'}; closed True by Escape |
| 375x667 @200 dark | focus | Mute | end | 3 | [319, 50, 363, 94] | True | button:Turn sound on | True (touch tap) | label ['Turn sound on', 'true'] -> ['Mute sounds', 'false']; restored True |
| 375x667 @200 dark | focus | Ambience | end | 3 | [194, 48, 311, 97] | True | button:Ambience: Rain. Change | True (touch tap) | dialog {'open': True, 'text': 'AmbienceTap to listen. The win'}; closed True by Escape |
| 390x844 @200 light | over-carried | Close | top | 3 | [334, 10, 378, 54] | True | button:Close | True (touch tap) | hash #/focus -> #/ |
| 390x844 @200 light | over-carried | Close | end | 3 | [334, 10, 378, 54] | True | button:Close | True (touch tap) | hash #/focus -> #/ |
| 390x844 @200 light | paused | Mute | top | 3 | [334, 32, 378, 76] | True | button:Turn sound on | True (touch tap) | label ['Turn sound on', 'true'] -> ['Mute sounds', 'false']; restored True |
| 390x844 @200 light | paused | Ambience | top | 3 | [209, 29, 326, 78] | True | button:Ambience: Rain. Change | True (touch tap) | dialog {'open': True, 'text': 'AmbienceTap to listen. The win'}; closed True by Escape |
| 390x844 @200 light | paused | Mute | end | 3 | [334, 32, 378, 76] | True | button:Turn sound on | True (touch tap) | label ['Turn sound on', 'true'] -> ['Mute sounds', 'false']; restored True |
| 390x844 @200 light | paused | Ambience | end | 3 | [209, 29, 326, 78] | True | button:Ambience: Rain. Change | True (touch tap) | dialog {'open': True, 'text': 'AmbienceTap to listen. The win'}; closed True by Escape |
| 390x844 @200 light | focus | Mute | top | 3 | [334, 50, 378, 94] | True | button:Turn sound on | True (touch tap) | label ['Turn sound on', 'true'] -> ['Mute sounds', 'false']; restored True |
| 390x844 @200 light | focus | Ambience | top | 3 | [209, 48, 326, 97] | True | button:Ambience: Rain. Change | True (touch tap) | dialog {'open': True, 'text': 'AmbienceTap to listen. The win'}; closed True by none |
| 390x844 @200 light | focus | Mute | end | 3 | [334, 50, 378, 94] | True | button:Turn sound on | True (touch tap) | label ['Turn sound on', 'true'] -> ['Mute sounds', 'false']; restored True |
| 390x844 @200 light | focus | Ambience | end | 3 | [209, 48, 326, 97] | True | button:Ambience: Rain. Change | True (touch tap) | dialog {'open': True, 'text': 'AmbienceTap to listen. The win'}; closed True by Escape |
| 390x844 @200 dark | over-carried | Close | top | 3 | [334, 10, 378, 54] | True | button:Close | True (touch tap) | hash #/focus -> #/ |
| 390x844 @200 dark | over-carried | Close | end | 3 | [334, 10, 378, 54] | True | button:Close | True (touch tap) | hash #/focus -> #/ |
| 390x844 @200 dark | paused | Mute | top | 3 | [334, 32, 378, 76] | True | button:Turn sound on | True (touch tap) | label ['Turn sound on', 'true'] -> ['Mute sounds', 'false']; restored True |
| 390x844 @200 dark | paused | Ambience | top | 3 | [209, 29, 326, 78] | True | button:Ambience: Rain. Change | True (touch tap) | dialog {'open': True, 'text': 'AmbienceTap to listen. The win'}; closed True by none |
| 390x844 @200 dark | paused | Mute | end | 3 | [334, 32, 378, 76] | True | button:Turn sound on | True (touch tap) | label ['Turn sound on', 'true'] -> ['Mute sounds', 'false']; restored True |
| 390x844 @200 dark | paused | Ambience | end | 3 | [209, 29, 326, 78] | True | button:Ambience: Rain. Change | True (touch tap) | dialog {'open': True, 'text': 'AmbienceTap to listen. The win'}; closed True by none |
| 390x844 @200 dark | focus | Mute | top | 3 | [334, 50, 378, 94] | True | button:Turn sound on | True (touch tap) | label ['Turn sound on', 'true'] -> ['Mute sounds', 'false']; restored True |
| 390x844 @200 dark | focus | Ambience | top | 3 | [209, 48, 326, 97] | True | button:Ambience: Rain. Change | True (touch tap) | dialog {'open': True, 'text': 'AmbienceTap to listen. The win'}; closed True by Escape |
| 390x844 @200 dark | focus | Mute | end | 3 | [334, 50, 378, 94] | True | button:Turn sound on | True (touch tap) | label ['Turn sound on', 'true'] -> ['Mute sounds', 'false']; restored True |
| 390x844 @200 dark | focus | Ambience | end | 3 | [209, 48, 326, 97] | True | button:Ambience: Rain. Change | True (touch tap) | dialog {'open': True, 'text': 'AmbienceTap to listen. The win'}; closed True by Escape |
| 667x375 @200 light | over-carried | Close | top | 3 | [607, 13, 651, 57] | True | button:Close | True (touch tap) | hash #/focus -> #/ |
| 667x375 @200 light | over-carried | Close | end | 3 | [607, 13, 651, 57] | True | button:Close | True (touch tap) | hash #/focus -> #/ |
| 667x375 @200 light | paused | Mute | top | 3 | [607, 52, 651, 96] | True | button:Turn sound on | True (touch tap) | label ['Turn sound on', 'true'] -> ['Mute sounds', 'false']; restored True |
| 667x375 @200 light | paused | Ambience | top | 3 | [482, 50, 599, 99] | True | button:Ambience: Rain. Change | True (touch tap) | dialog {'open': True, 'text': 'AmbienceTap to listen. The win'}; closed True by Escape |
| 667x375 @200 light | paused | Mute | end | 3 | [607, 52, 651, 96] | True | button:Turn sound on | True (touch tap) | label ['Turn sound on', 'true'] -> ['Mute sounds', 'false']; restored True |
| 667x375 @200 light | paused | Ambience | end | 3 | [482, 50, 599, 99] | True | button:Ambience: Rain. Change | True (touch tap) | dialog {'open': True, 'text': 'AmbienceTap to listen. The win'}; closed True by Escape |
| 667x375 @200 light | focus | Mute | top | 3 | [607, 52, 651, 96] | True | button:Turn sound on | True (touch tap) | label ['Turn sound on', 'true'] -> ['Mute sounds', 'false']; restored True |
| 667x375 @200 light | focus | Ambience | top | 3 | [482, 50, 599, 99] | True | button:Ambience: Rain. Change | True (touch tap) | dialog {'open': True, 'text': 'AmbienceTap to listen. The win'}; closed True by Escape |
| 667x375 @200 light | focus | Mute | end | 3 | [607, 52, 651, 96] | True | button:Turn sound on | True (touch tap) | label ['Turn sound on', 'true'] -> ['Mute sounds', 'false']; restored True |
| 667x375 @200 light | focus | Ambience | end | 3 | [482, 50, 599, 99] | True | button:Ambience: Rain. Change | True (touch tap) | dialog {'open': True, 'text': 'AmbienceTap to listen. The win'}; closed True by Escape |
| 667x375 @200 dark | over-carried | Close | top | 3 | [607, 13, 651, 57] | True | button:Close | True (touch tap) | hash #/focus -> #/ |
| 667x375 @200 dark | over-carried | Close | end | 3 | [607, 13, 651, 57] | True | button:Close | True (touch tap) | hash #/focus -> #/ |
| 667x375 @200 dark | paused | Mute | top | 3 | [607, 52, 651, 96] | True | button:Turn sound on | True (touch tap) | label ['Turn sound on', 'true'] -> ['Mute sounds', 'false']; restored True |
| 667x375 @200 dark | paused | Ambience | top | 3 | [482, 50, 599, 99] | True | button:Ambience: Rain. Change | True (touch tap) | dialog {'open': True, 'text': 'AmbienceTap to listen. The win'}; closed True by Escape |
| 667x375 @200 dark | paused | Mute | end | 3 | [607, 52, 651, 96] | True | button:Turn sound on | True (touch tap) | label ['Turn sound on', 'true'] -> ['Mute sounds', 'false']; restored True |
| 667x375 @200 dark | paused | Ambience | end | 3 | [482, 50, 599, 99] | True | button:Ambience: Rain. Change | True (touch tap) | dialog {'open': True, 'text': 'AmbienceTap to listen. The win'}; closed True by Escape |
| 667x375 @200 dark | focus | Mute | top | 3 | [607, 52, 651, 96] | True | button:Turn sound on | True (touch tap) | label ['Turn sound on', 'true'] -> ['Mute sounds', 'false']; restored True |
| 667x375 @200 dark | focus | Ambience | top | 3 | [482, 50, 599, 99] | True | button:Ambience: Rain. Change | True (touch tap) | dialog {'open': True, 'text': 'AmbienceTap to listen. The win'}; closed True by Escape |
| 667x375 @200 dark | focus | Mute | end | 3 | [607, 52, 651, 96] | True | button:Turn sound on | True (touch tap) | label ['Turn sound on', 'true'] -> ['Mute sounds', 'false']; restored True |
| 667x375 @200 dark | focus | Ambience | end | 3 | [482, 50, 599, 99] | True | button:Ambience: Rain. Change | True (touch tap) | dialog {'open': True, 'text': 'AmbienceTap to listen. The win'}; closed True by Escape |
| 844x390 @200 light | over-carried | Close | top | 3 | [784, 13, 828, 57] | True | button:Close | True (touch tap) | hash #/focus -> #/ |
| 844x390 @200 light | over-carried | Close | end | 3 | [784, 13, 828, 57] | True | button:Close | True (touch tap) | hash #/focus -> #/ |
| 844x390 @200 light | paused | Mute | top | 3 | [784, 52, 828, 96] | True | button:Turn sound on | True (touch tap) | label ['Turn sound on', 'true'] -> ['Mute sounds', 'false']; restored True |
| 844x390 @200 light | paused | Ambience | top | 3 | [659, 50, 776, 99] | True | button:Ambience: Rain. Change | True (touch tap) | dialog {'open': True, 'text': 'AmbienceTap to listen. The win'}; closed True by Escape |
| 844x390 @200 light | paused | Mute | end | 3 | [784, 52, 828, 96] | True | button:Turn sound on | True (touch tap) | label ['Turn sound on', 'true'] -> ['Mute sounds', 'false']; restored True |
| 844x390 @200 light | paused | Ambience | end | 3 | [659, 50, 776, 99] | True | button:Ambience: Rain. Change | True (touch tap) | dialog {'open': True, 'text': 'AmbienceTap to listen. The win'}; closed True by Escape |
| 844x390 @200 light | focus | Mute | top | 3 | [784, 52, 828, 96] | True | button:Turn sound on | True (touch tap) | label ['Turn sound on', 'true'] -> ['Mute sounds', 'false']; restored True |
| 844x390 @200 light | focus | Ambience | top | 3 | [659, 50, 776, 99] | True | button:Ambience: Rain. Change | True (touch tap) | dialog {'open': True, 'text': 'AmbienceTap to listen. The win'}; closed True by none |
| 844x390 @200 light | focus | Mute | end | 3 | [784, 52, 828, 96] | True | button:Turn sound on | True (touch tap) | label ['Turn sound on', 'true'] -> ['Mute sounds', 'false']; restored True |
| 844x390 @200 light | focus | Ambience | end | 3 | [659, 50, 776, 99] | True | button:Ambience: Rain. Change | True (touch tap) | dialog {'open': True, 'text': 'AmbienceTap to listen. The win'}; closed True by none |
| 844x390 @200 dark | over-carried | Close | top | 3 | [784, 13, 828, 57] | True | button:Close | True (touch tap) | hash #/focus -> #/ |
| 844x390 @200 dark | over-carried | Close | end | 3 | [784, 13, 828, 57] | True | button:Close | True (touch tap) | hash #/focus -> #/ |
| 844x390 @200 dark | paused | Mute | top | 3 | [784, 52, 828, 96] | True | button:Turn sound on | True (touch tap) | label ['Turn sound on', 'true'] -> ['Mute sounds', 'false']; restored True |
| 844x390 @200 dark | paused | Ambience | top | 3 | [659, 50, 776, 99] | True | button:Ambience: Rain. Change | True (touch tap) | dialog {'open': True, 'text': 'AmbienceTap to listen. The win'}; closed True by Escape |
| 844x390 @200 dark | paused | Mute | end | 3 | [784, 52, 828, 96] | True | button:Turn sound on | True (touch tap) | label ['Turn sound on', 'true'] -> ['Mute sounds', 'false']; restored True |
| 844x390 @200 dark | paused | Ambience | end | 3 | [659, 50, 776, 99] | True | button:Ambience: Rain. Change | True (touch tap) | dialog {'open': True, 'text': 'AmbienceTap to listen. The win'}; closed True by Escape |
| 844x390 @200 dark | focus | Mute | top | 3 | [784, 52, 828, 96] | True | button:Turn sound on | True (touch tap) | label ['Turn sound on', 'true'] -> ['Mute sounds', 'false']; restored True |
| 844x390 @200 dark | focus | Ambience | top | 3 | [659, 50, 776, 99] | True | button:Ambience: Rain. Change | True (touch tap) | dialog {'open': True, 'text': 'AmbienceTap to listen. The win'}; closed True by none |
| 844x390 @200 dark | focus | Mute | end | 3 | [784, 52, 828, 96] | True | button:Turn sound on | True (touch tap) | label ['Turn sound on', 'true'] -> ['Mute sounds', 'false']; restored True |
| 844x390 @200 dark | focus | Ambience | end | 3 | [659, 50, 776, 99] | True | button:Ambience: Rain. Change | True (touch tap) | dialog {'open': True, 'text': 'AmbienceTap to listen. The win'}; closed True by Escape |
| 375x667 @100 light | over-carried | Close | top | 3 | [319, 10, 363, 54] | True | button:Close | True (touch tap) | hash #/focus -> #/ |
| 375x667 @100 light | over-carried | Close | end | 3 | [319, 10, 363, 54] | True | button:Close | True (touch tap) | hash #/focus -> #/ |
| 375x667 @100 light | paused | Mute | top | 3 | [319, 10, 363, 54] | True | button:Turn sound on | True (touch tap) | label ['Turn sound on', 'true'] -> ['Mute sounds', 'false']; restored True |
| 375x667 @100 light | paused | Ambience | top | 3 | [225, 10, 311, 54] | True | button:Ambience: Rain. Change | True (touch tap) | dialog {'open': True, 'text': 'AmbienceTap to listen. The win'}; closed True by none |
| 375x667 @100 light | paused | Mute | end | 3 | [319, 10, 363, 54] | True | button:Turn sound on | True (touch tap) | label ['Turn sound on', 'true'] -> ['Mute sounds', 'false']; restored True |
| 375x667 @100 light | paused | Ambience | end | 3 | [225, 10, 311, 54] | True | button:Ambience: Rain. Change | True (touch tap) | dialog {'open': True, 'text': 'AmbienceTap to listen. The win'}; closed True by none |
| 375x667 @100 light | focus | Mute | top | 3 | [319, 13, 363, 57] | True | button:Turn sound on | True (touch tap) | label ['Turn sound on', 'true'] -> ['Mute sounds', 'false']; restored True |
| 375x667 @100 light | focus | Ambience | top | 3 | [225, 13, 311, 57] | True | button:Ambience: Rain. Change | True (touch tap) | dialog {'open': True, 'text': 'AmbienceTap to listen. The win'}; closed True by Escape |
| 375x667 @100 light | focus | Mute | end | 3 | [319, 13, 363, 57] | True | button:Turn sound on | True (touch tap) | label ['Turn sound on', 'true'] -> ['Mute sounds', 'false']; restored True |
| 375x667 @100 light | focus | Ambience | end | 3 | [225, 13, 311, 57] | True | button:Ambience: Rain. Change | True (touch tap) | dialog {'open': True, 'text': 'AmbienceTap to listen. The win'}; closed True by Escape |
| 1440x900 @100 light | over-carried | Close | top | 3 | [1356, 24, 1400, 68] | True | button:Close | True (mouse click) | hash #/focus -> #/ |
| 1440x900 @100 light | over-carried | Close | end | 3 | [1356, 24, 1400, 68] | True | button:Close | True (mouse click) | hash #/focus -> #/ |
| 1440x900 @100 light | paused | Mute | top | 3 | [1356, 24, 1400, 68] | True | button:Turn sound on | True (mouse click) | label ['Turn sound on', 'true'] -> ['Mute sounds', 'false']; restored True |
| 1440x900 @100 light | paused | Ambience | top | 6 | [1262, 24, 1348, 68] | True | button:Ambience: Rain. Change | True (mouse click) | dialog {'open': True, 'text': 'AmbienceTap to listen. The win'}; closed True by Escape |
| 1440x900 @100 light | paused | Mute | end | 3 | [1356, 24, 1400, 68] | True | button:Turn sound on | True (mouse click) | label ['Turn sound on', 'true'] -> ['Mute sounds', 'false']; restored True |
| 1440x900 @100 light | paused | Ambience | end | 6 | [1262, 24, 1348, 68] | True | button:Ambience: Rain. Change | True (mouse click) | dialog {'open': True, 'text': 'AmbienceTap to listen. The win'}; closed True by Escape |
| 1440x900 @100 light | focus | Mute | top | 3 | [1356, 24, 1400, 68] | True | button:Turn sound on | True (mouse click) | label ['Turn sound on', 'true'] -> ['Mute sounds', 'false']; restored True |
| 1440x900 @100 light | focus | Ambience | top | 3 | [1262, 24, 1348, 68] | True | button:Ambience: Rain. Change | True (mouse click) | dialog {'open': True, 'text': 'AmbienceTap to listen. The win'}; closed True by none |
| 1440x900 @100 light | focus | Mute | end | 3 | [1356, 24, 1400, 68] | True | button:Turn sound on | True (mouse click) | label ['Turn sound on', 'true'] -> ['Mute sounds', 'false']; restored True |
| 1440x900 @100 light | focus | Ambience | end | 3 | [1262, 24, 1348, 68] | True | button:Ambience: Rain. Change | True (mouse click) | dialog {'open': True, 'text': 'AmbienceTap to listen. The win'}; closed False by none |

## Compact per configuration x state

Across the 4 frame sub-runs (top/end x 1/3 toasts) per control: covered frames / frames, centre-hit frames / frames; taps: activated/attempted (hit before tap).

| cfg | state | Close cov · hit | Ambience cov · hit | Mute cov · hit | taps |
|---|---|---|---|---|---|
| 375x667 @200 light | focus | — | 0/277 · 277/277 | 0/277 · 277/277 | Ambience 2/2 (hit 2); Mute 2/2 (hit 2) |
| 375x667 @200 light | paused | — | 0/477 · 477/477 | 0/477 · 477/477 | Ambience 2/2 (hit 2); Mute 2/2 (hit 2) |
| 375x667 @200 light | over-carried | 0/680 · 680/680 | — | — | Close 2/2 (hit 2) |
| 375x667 @200 dark | focus | — | 0/388 · 388/388 | 0/388 · 388/388 | Ambience 2/2 (hit 2); Mute 2/2 (hit 2) |
| 375x667 @200 dark | paused | — | 0/557 · 557/557 | 0/557 · 557/557 | Ambience 2/2 (hit 2); Mute 2/2 (hit 2) |
| 375x667 @200 dark | over-carried | 0/713 · 713/713 | — | — | Close 2/2 (hit 2) |
| 390x844 @200 light | focus | — | 0/371 · 371/371 | 0/371 · 371/371 | Ambience 2/2 (hit 2); Mute 2/2 (hit 2) |
| 390x844 @200 light | paused | — | 0/583 · 583/583 | 0/583 · 583/583 | Ambience 2/2 (hit 2); Mute 2/2 (hit 2) |
| 390x844 @200 light | over-carried | 0/768 · 768/768 | — | — | Close 2/2 (hit 2) |
| 390x844 @200 dark | focus | — | 0/373 · 373/373 | 0/373 · 373/373 | Ambience 2/2 (hit 2); Mute 2/2 (hit 2) |
| 390x844 @200 dark | paused | — | 0/535 · 535/535 | 0/535 · 535/535 | Ambience 2/2 (hit 2); Mute 2/2 (hit 2) |
| 390x844 @200 dark | over-carried | 0/731 · 731/731 | — | — | Close 2/2 (hit 2) |
| 667x375 @200 light | focus | — | 0/501 · 501/501 | 0/501 · 501/501 | Ambience 2/2 (hit 2); Mute 2/2 (hit 2) |
| 667x375 @200 light | paused | — | 0/719 · 719/719 | 0/719 · 719/719 | Ambience 2/2 (hit 2); Mute 2/2 (hit 2) |
| 667x375 @200 light | over-carried | 0/758 · 758/758 | — | — | Close 2/2 (hit 2) |
| 667x375 @200 dark | focus | — | 0/508 · 508/508 | 0/508 · 508/508 | Ambience 2/2 (hit 2); Mute 2/2 (hit 2) |
| 667x375 @200 dark | paused | — | 0/673 · 673/673 | 0/673 · 673/673 | Ambience 2/2 (hit 2); Mute 2/2 (hit 2) |
| 667x375 @200 dark | over-carried | 0/752 · 752/752 | — | — | Close 2/2 (hit 2) |
| 844x390 @200 light | focus | — | 0/281 · 281/281 | 0/281 · 281/281 | Ambience 2/2 (hit 2); Mute 2/2 (hit 2) |
| 844x390 @200 light | paused | — | 0/570 · 570/570 | 0/570 · 570/570 | Ambience 2/2 (hit 2); Mute 2/2 (hit 2) |
| 844x390 @200 light | over-carried | 0/760 · 760/760 | — | — | Close 2/2 (hit 2) |
| 844x390 @200 dark | focus | — | 0/168 · 168/168 | 0/168 · 168/168 | Ambience 2/2 (hit 2); Mute 2/2 (hit 2) |
| 844x390 @200 dark | paused | — | 0/477 · 477/477 | 0/477 · 477/477 | Ambience 2/2 (hit 2); Mute 2/2 (hit 2) |
| 844x390 @200 dark | over-carried | 0/790 · 790/790 | — | — | Close 2/2 (hit 2) |
| 375x667 @100 light | focus | — | 0/258 · 258/258 | 0/258 · 258/258 | Ambience 2/2 (hit 2); Mute 2/2 (hit 2) |
| 375x667 @100 light | paused | — | 0/461 · 461/461 | 0/461 · 461/461 | Ambience 2/2 (hit 2); Mute 2/2 (hit 2) |
| 375x667 @100 light | over-carried | 0/646 · 646/646 | — | — | Close 2/2 (hit 2) |
| 1440x900 @100 light | focus | — | 0/191 · 191/191 | 0/191 · 191/191 | Ambience 2/2 (hit 2); Mute 2/2 (hit 2) |
| 1440x900 @100 light | paused | — | 0/285 · 285/285 | 0/285 · 285/285 | Ambience 2/2 (hit 2); Mute 2/2 (hit 2) |
| 1440x900 @100 light | over-carried | 0/568 · 568/568 | — | — | Close 2/2 (hit 2) |

## Toast visibility at the last frame (what a person can read): visible px / full px per toast, top toast first; room clip [top,bottom]

| cfg | state | where | toasts | visible / full px per toast | room clip | min visible |
|---|---|---|---|---|---|---|
| 375x667 @200 light | over-carried | top | 1 | 57/57 | [477, 553] | 57 |
| 375x667 @200 light | over-carried | top | 3 | 138/138 · 97/97 · 57/57 | [226, 553] | 57 |
| 375x667 @200 light | over-carried | end | 1 | 57/57 | [241, 317] | 57 |
| 375x667 @200 light | over-carried | end | 3 | 90/138 · 97/97 · 57/57 | [58, 317] | 57 |
| 375x667 @200 light | paused | top | 1 | 57/57 | [580, 656] | 57 |
| 375x667 @200 light | paused | top | 3 | 138/138 · 97/97 · 57/57 | [329, 656] | 57 |
| 375x667 @200 light | paused | end | 1 | 57/57 | [403, 479] | 57 |
| 375x667 @200 light | paused | end | 3 | 138/138 · 97/97 · 57/57 | [152, 479] | 57 |
| 375x667 @200 light | focus | top | 1 | 57/57 | [477, 553] | 57 |
| 375x667 @200 light | focus | top | 3 | 138/138 · 97/97 · 57/57 | [226, 553] | 57 |
| 375x667 @200 light | focus | end | 1 | 57/57 | [417, 493] | 57 |
| 375x667 @200 light | focus | end | 3 | 138/138 · 97/97 · 57/57 | [166, 493] | 57 |
| 375x667 @200 dark | over-carried | top | 1 | 57/57 | [477, 553] | 57 |
| 375x667 @200 dark | over-carried | top | 3 | 138/138 · 97/97 · 57/57 | [226, 553] | 57 |
| 375x667 @200 dark | over-carried | end | 1 | 57/57 | [241, 317] | 57 |
| 375x667 @200 dark | over-carried | end | 3 | 90/138 · 97/97 · 57/57 | [58, 317] | 57 |
| 375x667 @200 dark | paused | top | 1 | 57/57 | [580, 656] | 57 |
| 375x667 @200 dark | paused | top | 3 | 138/138 · 97/97 · 57/57 | [329, 656] | 57 |
| 375x667 @200 dark | paused | end | 1 | 57/57 | [403, 479] | 57 |
| 375x667 @200 dark | paused | end | 3 | 138/138 · 97/97 · 57/57 | [152, 479] | 57 |
| 375x667 @200 dark | focus | top | 1 | 57/57 | [477, 553] | 57 |
| 375x667 @200 dark | focus | top | 3 | 138/138 · 97/97 · 57/57 | [226, 553] | 57 |
| 375x667 @200 dark | focus | end | 1 | 57/57 | [417, 493] | 57 |
| 375x667 @200 dark | focus | end | 3 | 138/138 · 97/97 · 57/57 | [166, 493] | 57 |
| 390x844 @200 light | over-carried | top | 1 | 57/57 | [586, 662] | 57 |
| 390x844 @200 light | over-carried | top | 3 | 138/138 · 97/97 · 57/57 | [335, 662] | 57 |
| 390x844 @200 light | over-carried | end | 1 | 57/57 | [460, 536] | 57 |
| 390x844 @200 light | over-carried | end | 3 | 138/138 · 97/97 · 57/57 | [209, 536] | 57 |
| 390x844 @200 light | paused | top | 1 | 57/57 | [704, 780] | 57 |
| 390x844 @200 light | paused | top | 3 | 138/138 · 97/97 · 57/57 | [453, 780] | 57 |
| 390x844 @200 light | paused | end | 1 | 57/57 | [567, 643] | 57 |
| 390x844 @200 light | paused | end | 3 | 138/138 · 97/97 · 57/57 | [316, 643] | 57 |
| 390x844 @200 light | focus | top | 1 | 57/57 | [606, 682] | 57 |
| 390x844 @200 light | focus | top | 3 | 138/138 · 97/97 · 57/57 | [355, 682] | 57 |
| 390x844 @200 light | focus | end | 1 | 57/57 | [582, 658] | 57 |
| 390x844 @200 light | focus | end | 3 | 138/138 · 97/97 · 57/57 | [331, 658] | 57 |
| 390x844 @200 dark | over-carried | top | 1 | 57/57 | [586, 662] | 57 |
| 390x844 @200 dark | over-carried | top | 3 | 138/138 · 97/97 · 57/57 | [335, 662] | 57 |
| 390x844 @200 dark | over-carried | end | 1 | 57/57 | [460, 536] | 57 |
| 390x844 @200 dark | over-carried | end | 3 | 138/138 · 97/97 · 57/57 | [209, 536] | 57 |
| 390x844 @200 dark | paused | top | 1 | 57/57 | [704, 780] | 57 |
| 390x844 @200 dark | paused | top | 3 | 138/138 · 97/97 · 57/57 | [453, 780] | 57 |
| 390x844 @200 dark | paused | end | 1 | 57/57 | [567, 643] | 57 |
| 390x844 @200 dark | paused | end | 3 | 138/138 · 97/97 · 57/57 | [316, 643] | 57 |
| 390x844 @200 dark | focus | top | 1 | 57/57 | [606, 682] | 57 |
| 390x844 @200 dark | focus | top | 3 | 138/138 · 97/97 · 57/57 | [355, 682] | 57 |
| 390x844 @200 dark | focus | end | 1 | 57/57 | [582, 658] | 57 |
| 390x844 @200 dark | focus | end | 3 | 138/138 · 97/97 · 57/57 | [331, 658] | 57 |
| 667x375 @200 light | over-carried | top | 1 | 57/57 | [181, 257] | 57 |
| 667x375 @200 light | over-carried | top | 3 | 97/97 · 57/57 · 57/57 | [11, 257] | 57 |
| 667x375 @200 light | over-carried | end | 1 | 19/52 | [-12, 19] | 19 |
| 667x375 @200 light | over-carried | end | 3 | 0/52 · 0/52 · 19/52 | [-12, 19] | 0 |
| 667x375 @200 light | paused | top | 1 | 57/57 | [181, 257] | 57 |
| 667x375 @200 light | paused | top | 3 | 25/97 · 57/57 · 57/57 | [103, 257] | 25 |
| 667x375 @200 light | paused | end | 1 | 57/57 | [209, 285] | 57 |
| 667x375 @200 light | paused | end | 3 | 53/97 · 57/57 · 57/57 | [103, 285] | 53 |
| 667x375 @200 light | focus | top | 1 | 57/57 | [265, 341] | 57 |
| 667x375 @200 light | focus | top | 3 | 97/97 · 57/57 · 57/57 | [103, 341] | 57 |
| 667x375 @200 light | focus | end | 1 | 57/57 | [209, 285] | 57 |
| 667x375 @200 light | focus | end | 3 | 53/97 · 57/57 · 57/57 | [103, 285] | 53 |
| 667x375 @200 dark | over-carried | top | 1 | 57/57 | [181, 257] | 57 |
| 667x375 @200 dark | over-carried | top | 3 | 97/97 · 57/57 · 57/57 | [11, 257] | 57 |
| 667x375 @200 dark | over-carried | end | 1 | 19/52 | [-12, 19] | 19 |
| 667x375 @200 dark | over-carried | end | 3 | 0/52 · 0/52 · 19/52 | [-12, 19] | 0 |
| 667x375 @200 dark | paused | top | 1 | 57/57 | [181, 257] | 57 |
| 667x375 @200 dark | paused | top | 3 | 25/97 · 57/57 · 57/57 | [103, 257] | 25 |
| 667x375 @200 dark | paused | end | 1 | 57/57 | [209, 285] | 57 |
| 667x375 @200 dark | paused | end | 3 | 53/97 · 57/57 · 57/57 | [103, 285] | 53 |
| 667x375 @200 dark | focus | top | 1 | 57/57 | [265, 341] | 57 |
| 667x375 @200 dark | focus | top | 3 | 97/97 · 57/57 · 57/57 | [103, 341] | 57 |
| 667x375 @200 dark | focus | end | 1 | 57/57 | [209, 285] | 57 |
| 667x375 @200 dark | focus | end | 3 | 53/97 · 57/57 · 57/57 | [103, 285] | 53 |
| 844x390 @200 light | over-carried | top | 1 | 57/57 | [296, 372] | 57 |
| 844x390 @200 light | over-carried | top | 3 | 97/97 · 57/57 · 57/57 | [126, 372] | 57 |
| 844x390 @200 light | over-carried | end | 1 | 34/52 | [-12, 34] | 34 |
| 844x390 @200 light | over-carried | end | 3 | 0/52 · 0/52 · 34/52 | [-12, 34] | 0 |
| 844x390 @200 light | paused | top | 1 | 57/57 | [196, 272] | 57 |
| 844x390 @200 light | paused | top | 3 | 97/97 · 57/57 · 57/57 | [26, 272] | 57 |
| 844x390 @200 light | paused | end | 1 | 57/57 | [224, 300] | 57 |
| 844x390 @200 light | paused | end | 3 | 97/97 · 57/57 · 57/57 | [54, 300] | 57 |
| 844x390 @200 light | focus | top | 1 | 57/57 | [265, 341] | 57 |
| 844x390 @200 light | focus | top | 3 | 97/97 · 57/57 · 57/57 | [95, 341] | 57 |
| 844x390 @200 light | focus | end | 1 | 57/57 | [224, 300] | 57 |
| 844x390 @200 light | focus | end | 3 | 97/97 · 57/57 · 57/57 | [54, 300] | 57 |
| 844x390 @200 dark | over-carried | top | 1 | 57/57 | [296, 372] | 57 |
| 844x390 @200 dark | over-carried | top | 3 | 97/97 · 57/57 · 57/57 | [126, 372] | 57 |
| 844x390 @200 dark | over-carried | end | 1 | 34/52 | [-12, 34] | 34 |
| 844x390 @200 dark | over-carried | end | 3 | 0/52 · 0/52 · 34/52 | [-12, 34] | 0 |
| 844x390 @200 dark | paused | top | 1 | 57/57 | [196, 272] | 57 |
| 844x390 @200 dark | paused | top | 3 | 97/97 · 57/57 · 57/57 | [26, 272] | 57 |
| 844x390 @200 dark | paused | end | 1 | 57/57 | [224, 300] | 57 |
| 844x390 @200 dark | paused | end | 3 | 97/97 · 57/57 · 57/57 | [54, 300] | 57 |
| 844x390 @200 dark | focus | top | 1 | 57/57 | [265, 341] | 57 |
| 844x390 @200 dark | focus | top | 3 | 97/97 · 57/57 · 57/57 | [95, 341] | 57 |
| 844x390 @200 dark | focus | end | 1 | 57/57 | [224, 300] | 57 |
| 844x390 @200 dark | focus | end | 3 | 97/97 · 57/57 · 57/57 | [54, 300] | 57 |
| 375x667 @100 light | over-carried | top | 1 | 52/52 | [369, 441] | 52 |
| 375x667 @100 light | over-carried | top | 3 | 57/57 · 52/52 · 52/52 | [245, 441] | 52 |
| 375x667 @100 light | over-carried | end | 1 | 52/52 | [369, 441] | 52 |
| 375x667 @100 light | over-carried | end | 3 | 57/57 · 52/52 · 52/52 | [245, 441] | 52 |
| 375x667 @100 light | paused | top | 1 | 52/52 | None | 52 |
| 375x667 @100 light | paused | top | 3 | 57/57 · 52/52 · 52/52 | None | 52 |
| 375x667 @100 light | paused | end | 1 | 52/52 | None | 52 |
| 375x667 @100 light | paused | end | 3 | 57/57 · 52/52 · 52/52 | None | 52 |
| 375x667 @100 light | focus | top | 1 | 52/52 | None | 52 |
| 375x667 @100 light | focus | top | 3 | 57/57 · 52/52 · 52/52 | None | 52 |
| 375x667 @100 light | focus | end | 1 | 52/52 | None | 52 |
| 375x667 @100 light | focus | end | 3 | 57/57 · 52/52 · 52/52 | None | 52 |
| 1440x900 @100 light | over-carried | top | 1 | 52/52 | None | 52 |
| 1440x900 @100 light | over-carried | top | 3 | 52/52 · 52/52 · 52/52 | None | 52 |
| 1440x900 @100 light | over-carried | end | 1 | 52/52 | None | 52 |
| 1440x900 @100 light | over-carried | end | 3 | 52/52 · 52/52 · 52/52 | None | 52 |
| 1440x900 @100 light | paused | top | 1 | 52/52 | None | 52 |
| 1440x900 @100 light | paused | top | 3 | 52/52 · 52/52 · 52/52 | None | 52 |
| 1440x900 @100 light | paused | end | 1 | 52/52 | None | 52 |
| 1440x900 @100 light | paused | end | 3 | 52/52 · 52/52 · 52/52 | None | 52 |
| 1440x900 @100 light | focus | top | 1 | 52/52 | None | 52 |
| 1440x900 @100 light | focus | top | 3 | 52/52 · 52/52 · 52/52 | None | 52 |
| 1440x900 @100 light | focus | end | 1 | 52/52 | None | 52 |
| 1440x900 @100 light | focus | end | 3 | 52/52 · 52/52 · 52/52 | None | 52 |
