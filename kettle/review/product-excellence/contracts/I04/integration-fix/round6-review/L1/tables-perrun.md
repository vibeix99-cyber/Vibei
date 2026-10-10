| # | series | rev:port | run | input | timing / key times (ms) | start→end UTC | load1 start→end | result | R5-D1 detail (uniform) | video |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | natural-375L | R6:5301 | 0 | wheel 40 px up / 20 px down | wait=600; top@3572, down@4176; older left [3529, 3529] | 18:43:05→18:43:19 | 8.19→8.51 | OK |  |  |
| 2 | natural-375L | R5:5302 | 0 | wheel 40 px up / 20 px down | wait=600; top@2565, down@3169; older left [3875, 4590] | 18:43:05→18:43:19 | 8.19→8.31 | FAIL | **D1:** faded/absent, below room, over dock/control |  |
| 3 | natural-375L | R6:5301 | 1 | wheel 40 px up / 20 px down | wait=600; top@3662, down@4272; older left [3541, 3541] | 18:43:19→18:43:33 | 8.51→8.98 | OK |  |  |
| 4 | natural-375L | R5:5302 | 1 | wheel 40 px up / 20 px down | wait=600; top@2029, down@2632; older left [4657, 4657] | 18:43:20→18:43:34 | 8.31→8.74 | OK |  |  |
| 5 | natural-375L | R6:5301 | 2 | wheel 40 px up / 20 px down | wait=900; top@3553, down@4454; older left [3497, 3497] | 18:43:33→18:43:46 | 8.98→9.24 | OK |  |  |
| 6 | natural-375L | R5:5302 | 2 | wheel 40 px up / 20 px down | wait=900; top@1889, down@2794; older left [3628, 4845] | 18:43:34→18:43:48 | 8.74→9.24 | OK |  |  |
| 7 | natural-375L | R6:5301 | 3 | wheel 40 px up / 20 px down | wait=900; top@3568, down@4473; older left [3557, 3557] | 18:43:47→18:44:01 | 9.24→10.03 | OK |  |  |
| 8 | natural-375L | R5:5302 | 3 | wheel 40 px up / 20 px down | wait=900; top@1896, down@2802; older left [3494, 4809] | 18:43:48→18:44:03 | 9.24→10.03 | OK |  |  |
| 9 | natural-375L | R6:5301 | 4 | wheel 40 px up / 20 px down | wait=1200; top@3635, down@4838; older left [3504, 3504] | 18:44:01→18:44:15 | 10.03→9.67 | OK |  |  |
| 10 | natural-375L | R5:5302 | 4 | wheel 40 px up / 20 px down | wait=1200; top@1969, down@3171; older left [3781, 4978] | 18:44:03→18:44:18 | 10.03→9.67 | FAIL | **D1:** below room |  |
| 11 | natural-375L | R6:5301 | 5 | wheel 40 px up / 20 px down | wait=1200; top@3713, down@4916; older left [3578, 3578] | 18:44:15→18:44:28 | 9.67→11.11 | OK |  |  |
| 12 | natural-375L | R5:5302 | 5 | wheel 40 px up / 20 px down | wait=1200; top@1820, down@3022; older left [4680, 5189] | 18:44:18→18:44:34 | 9.67→10.94 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 13 | natural-375L | R6:5301 | 6 | wheel 40 px up / 20 px down | wait=1500; top@3572, down@5074; older left [3530, 3530] | 18:44:28→18:44:43 | 11.11→11.37 | OK |  |  |
| 14 | natural-375L | R5:5302 | 6 | wheel 40 px up / 20 px down | wait=1500; top@1918, down@3420; older left [3513, 5979] | 18:44:34→18:44:48 | 10.94→11.82 | OK | [entry-flicker x1] |  |
| 15 | natural-375L | R6:5301 | 7 | wheel 40 px up / 20 px down | wait=1500; top@3586, down@5089; older left [3505, 3505] | 18:44:43→18:44:57 | 11.37→11.99 | OK |  |  |
| 16 | natural-375L | R5:5302 | 7 | wheel 40 px up / 20 px down | wait=1500; top@1970, down@3484; older left [3540, 6227] | 18:44:48→18:45:03 | 11.82→11.83 | OK | [entry-flicker x1] |  |
| 17 | natural-375L | R6:5301 | 8 | wheel 40 px up / 20 px down | wait=1800; top@3627, down@5429; older left [3604, 3604] | 18:44:57→18:45:12 | 11.99→11.76 | OK |  |  |
| 18 | natural-375L | R5:5302 | 8 | wheel 40 px up / 20 px down | wait=1800; top@1647, down@3453; older left [3891, 5557] | 18:45:03→18:45:17 | 11.83→11.86 | OK |  |  |
| 19 | natural-375L | R6:5301 | 9 | wheel 40 px up / 20 px down | wait=1800; top@3774, down@5577; older left [3617, 3617] | 18:45:12→18:45:27 | 11.76→12.01 | OK |  |  |
| 20 | natural-375L | R5:5302 | 9 | wheel 40 px up / 20 px down | wait=1800; top@1788, down@3590; older left [3915, 5547] | 18:45:17→18:45:31 | 11.86→11.05 | OK |  |  |
| 21 | race-375L | R5:5302 | 0 | wheel 20 px (+ one-shot synthetic hold) | release@6409; older left [5874] | 18:45:32→18:45:52 | 11.05→10.74 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 22 | race-375L | R6:5301 | 0 | wheel 20 px (+ one-shot synthetic hold) | release@14760; older left [16386] | 18:45:32→18:46:02 | 11.05→11.33 | OK |  |  |
| 23 | race-375L | R5:5302 | 1 | wheel 20 px (+ one-shot synthetic hold) | release@6514; older left [6026] | 18:45:52→18:46:11 | 10.74→11.78 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 24 | race-375L | R6:5301 | 1 | wheel 20 px (+ one-shot synthetic hold) | release@14964; older left [16625] | 18:46:02→18:46:32 | 11.33→10.51 | OK |  |  |
| 25 | race-375L | R5:5302 | 2 | wheel 20 px (+ one-shot synthetic hold) | release@6396; older left [5937] | 18:46:11→18:46:30 | 11.78→10.51 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 26 | race-375L | R5:5302 | 3 | wheel 20 px (+ one-shot synthetic hold) | release@6475; older left [5948] | 18:46:30→18:46:50 | 10.51→10.22 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 27 | race-375L | R6:5301 | 2 | wheel 20 px (+ one-shot synthetic hold) | release@14805; older left [16502] | 18:46:32→18:47:02 | 10.51→9.64 | OK |  |  |
| 28 | race-375L | R5:5302 | 4 | wheel 20 px (+ one-shot synthetic hold) | release@6714; older left [5920] | 18:46:50→18:47:10 | 10.22→10.47 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 29 | race-375L | R6:5301 | 3 | wheel 20 px (+ one-shot synthetic hold) | release@15009; older left [16684] | 18:47:02→18:47:32 | 9.64→9.66 | OK |  |  |
| 30 | race-375L | R5:5302 | 5 | wheel 20 px (+ one-shot synthetic hold) | release@6402; older left [5894] | 18:47:10→18:47:28 | 10.47→9.64 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 31 | race-375L | R5:5302 | 6 | wheel 20 px (+ one-shot synthetic hold) | release@6476; older left [5966] | 18:47:29→18:47:47 | 9.64→9.57 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 32 | race-375L | R6:5301 | 4 | wheel 20 px (+ one-shot synthetic hold) | release@14759; older left [16334] | 18:47:32→18:48:02 | 9.66→8.54 | OK |  |  |
| 33 | race-375L | R5:5302 | 7 | wheel 20 px (+ one-shot synthetic hold) | release@5937; older left [5964] | 18:47:47→18:48:06 | 9.57→8.82 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 34 | race-375L | R6:5301 | 5 | wheel 20 px (+ one-shot synthetic hold) | release@14743; older left [16439] | 18:48:02→18:48:31 | 8.54→7.73 | OK |  |  |
| 35 | race-375L | R5:5302 | 8 | wheel 20 px (+ one-shot synthetic hold) | release@5914; older left [5943] | 18:48:06→18:48:25 | 8.82→7.88 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 36 | race-375L | R5:5302 | 9 | wheel 20 px (+ one-shot synthetic hold) | release@6505; older left [5831] | 18:48:25→18:48:44 | 7.88→7.63 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 37 | race-375L | R6:5301 | 6 | wheel 20 px (+ one-shot synthetic hold) | release@14625; older left [16232] | 18:48:31→18:49:00 | 7.73→6.62 | OK |  |  |
| 38 | race-375L | R6:5301 | 7 | wheel 20 px (+ one-shot synthetic hold) | release@14651; older left [16275] | 18:49:00→18:49:29 | 6.62→6.19 | OK |  |  |
| 39 | race-375L | R6:5301 | 8 | wheel 20 px (+ one-shot synthetic hold) | release@14609; older left [16295] | 18:49:29→18:49:58 | 6.19→5.35 | OK |  |  |
| 40 | race-375L | R6:5301 | 9 | wheel 20 px (+ one-shot synthetic hold) | release@14636; older left [16280] | 18:49:58→18:50:26 | 5.35→4.41 | OK |  |  |
| 41 | repro6sel-375L | R5:5302 | 0 | wheel | during d=1000; gesture 1283–3824 (12 strokes); warn@271; older left [3471, 3471] | 18:50:27→18:50:39 | 4.41→6.36 | OK |  |  |
| 42 | repro6sel-375L | R6:5301 | 0 | wheel | during d=1000; gesture 1269–5312 (21 strokes); warn@261; older left [4059, 5060] | 18:50:27→18:50:41 | 4.41→6.65 | OK |  |  |
| 43 | repro6sel-375L | R5:5302 | 1 | wheel | during d=1600; gesture 1869–3945 (10 strokes); warn@264; older left [3521, 3521] | 18:50:39→18:50:52 | 6.65→7.9 | FAIL |  |  |
| 44 | repro6sel-375L | R6:5301 | 1 | wheel | during d=1600; gesture 1825–5955 (19 strokes); warn@218; older left [4047, 5518] | 18:50:41→18:50:57 | 6.65→8.95 | OK |  |  |
| 45 | repro6sel-375L | R5:5302 | 2 | wheel | during d=2200; gesture 2492–4801 (11 strokes); warn@285; older left [3510, 3510] | 18:50:52→18:51:05 | 7.9→9.62 | FAIL |  |  |
| 46 | repro6sel-375L | R6:5301 | 2 | wheel | during d=2200; gesture 2524–5027 (12 strokes); warn@285; older left [3524, 4809] | 18:50:57→18:51:11 | 8.95→9.41 | OK |  |  |
| 47 | repro6sel-375L | R5:5302 | 3 | wheel | during d=2800; gesture 3112–4834 (8 strokes); warn@308; older left [3565, 3565] | 18:51:05→18:51:19 | 9.62→9.22 | FAIL |  |  |
| 48 | repro6sel-375L | R6:5301 | 3 | wheel | during d=2800; gesture 3037–4768 (8 strokes); warn@231; older left [3531, 3531] | 18:51:11→18:51:24 | 9.41→10.54 | OK |  |  |
| 49 | repro6sel-375L | R5:5302 | 4 | wheel | after d=300; gesture 852–3236 (8 strokes); warn@518; older left [3680, 3680] | 18:51:19→18:51:30 | 9.22→10.42 | OK |  |  |
| 50 | repro6sel-375L | R6:5301 | 4 | wheel | after d=300; gesture 791–2971 (8 strokes); warn@484; older left [3589, 4035] | 18:51:24→18:51:36 | 10.54→10.87 | OK |  |  |
| 51 | repro6sel-375L | R5:5302 | 5 | wheel | after d=600; gesture 966–3027 (8 strokes); warn@354; older left [3528] | 18:51:30→18:51:42 | 10.42→10.88 | OK |  |  |
| 52 | repro6sel-375L | R6:5301 | 5 | wheel | after d=600; gesture 965–3047 (8 strokes); warn@311; older left [3546, 4026] | 18:51:36→18:51:48 | 10.87→11.21 | OK |  |  |
| 53 | repro6sel-375L | R5:5302 | 6 | wheel | during d=1000; gesture 1341–3904 (11 strokes); warn@326; older left [3500, 3500] | 18:51:42→18:51:54 | 10.88→11.77 | FAIL |  |  |
| 54 | repro6sel-375L | R6:5301 | 6 | wheel | during d=1000; gesture 1352–5902 (22 strokes); warn@238; older left [4047, 5565] | 18:51:48→18:52:02 | 11.21→12.27 | OK |  |  |
| 55 | repro6sel-375L | R5:5302 | 7 | wheel | during d=1600; gesture 1903–3966 (10 strokes); warn@299; older left [3559, 3559] | 18:51:55→18:52:07 | 11.77→12.81 | FAIL |  |  |
| 56 | repro6sel-375L | R6:5301 | 7 | wheel | during d=1600; gesture 1921–5618 (18 strokes); warn@309; older left [4066, 5407] | 18:52:02→18:52:15 | 12.27→12.33 | OK |  |  |
| 57 | repro6sel-375L | R5:5302 | 8 | wheel | during d=2200; gesture 2520–5141 (11 strokes); warn@277; older left [3489, 3489] | 18:52:07→18:52:21 | 12.81→12.3 | FAIL |  |  |
| 58 | repro6sel-375L | R6:5301 | 8 | wheel | during d=2200; gesture 2925–4940 (10 strokes); warn@720; older left [3535, 3535] | 18:52:16→18:52:29 | 12.33→12.12 | OK |  |  |
| 59 | repro6sel-375L | R5:5302 | 9 | wheel | during d=2800; gesture 3065–4746 (8 strokes); warn@255; older left [3476, 3476] | 18:52:21→18:52:34 | 12.3→12.51 | FAIL |  |  |
| 60 | repro6sel-375L | R6:5301 | 9 | wheel | during d=2800; gesture 3030–4631 (8 strokes); warn@225; older left [3478, 3478] | 18:52:29→18:52:42 | 12.12→11.7 | OK |  |  |
| 61 | naturalx-375L | R6:5301 | 0 | wheel 40 px up / 20 px down | wait=600; top@2684, down@3285; older left [3512, 3512] | 18:52:43→18:52:57 | 11.7→12.99 | OK |  | yes |
| 62 | naturalx-375L | R5:5302 | 0 | wheel 40 px up / 20 px down | wait=600; top@2718, down@3330; older left [3794, 4882] | 18:52:43→18:52:59 | 11.7→12.99 | OK |  | yes |
| 63 | naturalx-375L | R6:5301 | 1 | wheel 40 px up / 20 px down | wait=600; top@2025, down@2627; older left [3654, 3654] | 18:52:58→18:53:11 | 12.99→13.97 | OK |  | yes |
| 64 | naturalx-375L | R5:5302 | 1 | wheel 40 px up / 20 px down | wait=600; top@2222, down@2826; older left [4351, 5157] | 18:52:59→18:53:15 | 12.99→14.14 | OK |  | yes |
| 65 | naturalx-375L | R6:5301 | 2 | wheel 40 px up / 20 px down | wait=900; top@2792, down@3760; older left [3794, 3794] | 18:53:11→18:53:25 | 13.97→14.8 | OK |  | yes |
| 66 | naturalx-375L | R5:5302 | 2 | wheel 40 px up / 20 px down | wait=900; top@2319, down@3223; older left [4619, 4930] | 18:53:15→18:53:30 | 14.14→14.73 | OK |  | yes |
| 67 | naturalx-375L | R6:5301 | 3 | wheel 40 px up / 20 px down | wait=900; top@2124, down@3027; older left [3520, 3520] | 18:53:25→18:53:39 | 14.8→14.83 | OK |  | yes |
| 68 | naturalx-375L | R5:5302 | 3 | wheel 40 px up / 20 px down | wait=900; top@2352, down@3258; older left [3837, 4737] | 18:53:30→18:53:44 | 14.73→14.77 | OK |  | yes |
| 69 | naturalx-375L | R6:5301 | 4 | wheel 40 px up / 20 px down | wait=1200; top@2037, down@3238; older left [3550, 3550] | 18:53:39→18:53:52 | 14.83→14.5 | OK |  | yes |
| 70 | naturalx-375L | R5:5302 | 4 | wheel 40 px up / 20 px down | wait=1200; top@1788, down@2991; older left [3517, 4614] | 18:53:44→18:53:58 | 14.77→15.26 | OK |  | yes |
| 71 | naturalx-375L | R6:5301 | 5 | wheel 40 px up / 20 px down | wait=1200; top@2500, down@3761; older left [3534, 3534] | 18:53:52→18:54:05 | 14.5→16.47 | OK |  | yes |
| 72 | naturalx-375L | R5:5302 | 5 | wheel 40 px up / 20 px down | wait=1200; top@2654, down@3885; older left [3904, 5211] | 18:53:58→18:54:13 | 15.26→16.43 | OK |  | yes |
| 73 | naturalx-375L | R6:5301 | 6 | wheel 40 px up / 20 px down | wait=1500; top@2867, down@4380; older left [3759, 3759] | 18:54:05→18:54:20 | 16.47→17.93 | OK |  | yes |
| 74 | naturalx-375L | R5:5302 | 6 | wheel 40 px up / 20 px down | wait=1500; top@2333, down@3923; older left [3542, 6563] | 18:54:13→18:54:28 | 16.43→17.54 | OK | [entry-flicker x1] | yes |
| 75 | naturalx-375L | R6:5301 | 7 | wheel 40 px up / 20 px down | wait=1500; top@2397, down@3921; older left [3549, 3549] | 18:54:20→18:54:34 | 17.93→17.83 | OK |  | yes |
| 76 | naturalx-375L | R5:5302 | 7 | wheel 40 px up / 20 px down | wait=1500; top@2103, down@3606; older left [3676, 4809] | 18:54:28→18:54:44 | 17.54→18.0 | OK |  | yes |
| 77 | naturalx-375L | R6:5301 | 8 | wheel 40 px up / 20 px down | wait=1800; top@2369, down@4177; older left [3626, 3626] | 18:54:35→18:54:49 | 17.83→17.84 | OK |  | yes |
| 78 | naturalx-375L | R5:5302 | 8 | wheel 40 px up / 20 px down | wait=1800; top@2302, down@4106; older left [3497, 6065] | 18:54:44→18:55:00 | 18.0→18.59 | OK | [entry-flicker x1] | yes |
| 79 | naturalx-375L | R6:5301 | 9 | wheel 40 px up / 20 px down | wait=1800; top@2527, down@4338; older left [3680, 3680] | 18:54:49→18:55:03 | 17.84→18.59 | OK |  | yes |
| 80 | naturalx-375L | R5:5302 | 9 | wheel 40 px up / 20 px down | wait=1800; top@1954, down@3759; older left [3783, 5844] | 18:55:00→18:55:15 | 18.59→16.98 | OK |  | yes |
| 81 | racex-375L | R5:5302 | 0 | wheel 20 px (+ one-shot synthetic hold) | release@7091; older left [6089] | 18:55:16→18:55:38 | 16.98→16.68 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control | yes |
| 82 | racex-375L | R6:5301 | 0 | wheel 20 px (+ one-shot synthetic hold) | release@6145; older left [7845] | 18:55:16→18:55:39 | 16.98→16.68 | OK |  | yes |
| 83 | racex-375L | R5:5302 | 1 | wheel 20 px (+ one-shot synthetic hold) | release@7138; older left [6599] | 18:55:38→18:55:59 | 16.68→17.07 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control | yes |
| 84 | racex-375L | R6:5301 | 1 | wheel 20 px (+ one-shot synthetic hold) | release@6302; older left [7959] | 18:55:39→18:56:01 | 17.75→16.91 | OK |  | yes |
| 85 | racex-375L | R5:5302 | 2 | wheel 20 px (+ one-shot synthetic hold) | release@6887; older left [6104] | 18:55:59→18:56:20 | 17.07→17.07 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control | yes |
| 86 | racex-375L | R6:5301 | 2 | wheel 20 px (+ one-shot synthetic hold) | release@6114; older left [7757] | 18:56:01→18:56:23 | 16.91→17.07 | OK |  | yes |
| 87 | racex-375L | R5:5302 | 3 | wheel 20 px (+ one-shot synthetic hold) | release@6866; older left [6013] | 18:56:20→18:56:40 | 17.07→17.51 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control | yes |
| 88 | racex-375L | R6:5301 | 3 | wheel 20 px (+ one-shot synthetic hold) | release@6444; older left [8051] | 18:56:23→18:56:44 | 17.07→17.51 | OK |  | yes |
| 89 | racex-375L | R5:5302 | 4 | wheel 20 px (+ one-shot synthetic hold) | release@7450; older left [6468] | 18:56:40→18:57:02 | 17.51→18.29 | OK |  | yes |
| 90 | racex-375L | R6:5301 | 4 | wheel 20 px (+ one-shot synthetic hold) | release@6485; older left [8118] | 18:56:44→18:57:06 | 17.51→18.26 | OK |  | yes |
| 91 | racex-375L | R5:5302 | 5 | wheel 20 px (+ one-shot synthetic hold) | release@6892; older left [6351] | 18:57:02→18:57:22 | 18.29→18.14 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control | yes |
| 92 | racex-375L | R6:5301 | 5 | wheel 20 px (+ one-shot synthetic hold) | release@6443; older left [8105] | 18:57:06→18:57:28 | 18.26→18.21 | OK |  | yes |
| 93 | racex-375L | R5:5302 | 6 | wheel 20 px (+ one-shot synthetic hold) | release@6830; older left [6217] | 18:57:22→18:57:43 | 18.14→18.98 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control | yes |
| 94 | racex-375L | R6:5301 | 6 | wheel 20 px (+ one-shot synthetic hold) | release@6451; older left [7941] | 18:57:28→18:57:50 | 18.21→19.33 | OK |  | yes |
| 95 | racex-375L | R5:5302 | 7 | wheel 20 px (+ one-shot synthetic hold) | release@8103; older left [6807] | 18:57:43→18:58:04 | 18.98→19.4 | OK | **D1:** faded/absent, below room, over dock/control | yes |
| 96 | racex-375L | R6:5301 | 7 | wheel 20 px (+ one-shot synthetic hold) | release@6807; older left [8557] | 18:57:50→18:58:12 | 19.33→19.11 | OK |  | yes |
| 97 | racex-375L | R5:5302 | 8 | wheel 20 px (+ one-shot synthetic hold) | release@7606; older left [6597] | 18:58:04→18:58:25 | 19.4→18.15 | OK | **D1:** hide/reset, faded/absent, below room, over dock/control | yes |
| 98 | racex-375L | R6:5301 | 8 | wheel 20 px (+ one-shot synthetic hold) | release@6526; older left [8135] | 18:58:12→18:58:34 | 19.11→19.66 | OK |  | yes |
| 99 | racex-375L | R5:5302 | 9 | wheel 20 px (+ one-shot synthetic hold) | release@7349; older left [6542] | 18:58:26→18:58:47 | 18.15→18.68 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control | yes |
| 100 | racex-375L | R6:5301 | 9 | wheel 20 px (+ one-shot synthetic hold) | release@6456; older left [8016] | 18:58:34→18:58:56 | 19.66→16.8 | OK |  | yes |
| 101 | nx-375L | R6:5301 | 0 | wheel 40 px up / 20 px down | wait=600; top@1716, down@2318; older left [3493, 3493] | 18:59:50→19:00:03 | 11.47→10.67 | OK |  |  |
| 102 | nx-375L | R5:5302 | 0 | wheel 40 px up / 20 px down | wait=600; top@1832, down@2435; older left [4378, 4610] | 18:59:50→19:00:04 | 11.47→10.67 | OK |  |  |
| 103 | nx-375L | R6:5301 | 1 | wheel 40 px up / 20 px down | wait=600; top@1817, down@2420; older left [3546, 3546] | 19:00:03→19:00:16 | 10.67→10.12 | OK |  |  |
| 104 | nx-375L | R5:5302 | 1 | wheel 40 px up / 20 px down | wait=600; top@1704, down@2307; older left [4217, 4563] | 19:00:04→19:00:18 | 10.67→10.12 | OK | [entry-flicker x1] |  |
| 105 | nx-375L | R6:5301 | 2 | wheel 40 px up / 20 px down | wait=900; top@1904, down@2817; older left [3643, 3643] | 19:00:16→19:00:28 | 10.12→10.34 | OK |  |  |
| 106 | nx-375L | R5:5302 | 2 | wheel 40 px up / 20 px down | wait=900; top@1946, down@2848; older left [3560, 4724] | 19:00:18→19:00:32 | 10.12→9.99 | OK |  |  |
| 107 | nx-375L | R6:5301 | 3 | wheel 40 px up / 20 px down | wait=900; top@1963, down@2864; older left [3559, 3559] | 19:00:28→19:00:41 | 10.34→9.96 | OK |  |  |
| 108 | nx-375L | R5:5302 | 3 | wheel 40 px up / 20 px down | wait=900; top@1988, down@2890; older left [4500, 4759] | 19:00:32→19:00:46 | 9.99→9.8 | OK |  |  |
| 109 | nx-375L | R6:5301 | 4 | wheel 40 px up / 20 px down | wait=1200; top@2430, down@3638; older left [3541, 3541] | 19:00:41→19:00:54 | 9.96→9.98 | OK |  |  |
| 110 | nx-375L | R5:5302 | 4 | wheel 40 px up / 20 px down | wait=1200; top@1834, down@3036; older left [3546, 4753] | 19:00:46→19:01:00 | 9.8→9.9 | OK |  |  |
| 111 | nx-375L | R6:5301 | 5 | wheel 40 px up / 20 px down | wait=1200; top@2019, down@3221; older left [3567, 3567] | 19:00:54→19:01:07 | 9.98→9.9 | OK |  |  |
| 112 | nx-375L | R5:5302 | 5 | wheel 40 px up / 20 px down | wait=1200; top@2304, down@3505; older left [3556, 5820] | 19:01:00→19:01:15 | 9.9→9.71 | OK | [entry-flicker x1] |  |
| 113 | nx-375L | R6:5301 | 6 | wheel 40 px up / 20 px down | wait=1500; top@1755, down@3270; older left [3499, 3499] | 19:01:07→19:01:20 | 9.9→9.89 | OK |  |  |
| 114 | nx-375L | R5:5302 | 6 | wheel 40 px up / 20 px down | wait=1500; top@2489, down@3991; older left [3805, 6067] | 19:01:15→19:01:31 | 9.71→9.04 | OK | [entry-flicker x1] |  |
| 115 | nx-375L | R6:5301 | 7 | wheel 40 px up / 20 px down | wait=1500; top@1839, down@3342; older left [3487, 3487] | 19:01:21→19:01:34 | 9.89→9.04 | OK |  |  |
| 116 | nx-375L | R5:5302 | 7 | wheel 40 px up / 20 px down | wait=1500; top@1860, down@3366; older left [3939, 5293] | 19:01:31→19:01:44 | 9.04→9.87 | OK |  |  |
| 117 | nx-375L | R6:5301 | 8 | wheel 40 px up / 20 px down | wait=1800; top@1872, down@3676; older left [3505, 3505] | 19:01:34→19:01:47 | 9.04→11.16 | OK |  |  |
| 118 | nx-375L | R5:5302 | 8 | wheel 40 px up / 20 px down | wait=1800; top@1981, down@3783; older left [3808, 5725] | 19:01:44→19:01:59 | 9.87→12.8 | OK |  |  |
| 119 | nx-375L | R6:5301 | 9 | wheel 40 px up / 20 px down | wait=1800; top@1883, down@3686; older left [3529, 3529] | 19:01:47→19:02:00 | 11.16→13.3 | OK |  |  |
| 120 | nx-375L | R5:5302 | 9 | wheel 40 px up / 20 px down | wait=1800; top@1720, down@3524; older left [3747, 5680] | 19:01:59→19:02:12 | 12.8→12.63 | OK |  |  |
| 121 | rx-375L | R6:5301 | 0 | wheel 20 px (+ one-shot synthetic hold) | release@5625; older left [7260] | 19:02:13→19:02:34 | 12.63→12.7 | OK |  |  |
| 122 | rx-375L | R5:5302 | 0 | wheel 20 px (+ one-shot synthetic hold) | release@6465; older left [5942] | 19:02:13→19:02:33 | 12.63→12.7 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 123 | rx-375L | R5:5302 | 1 | wheel 20 px (+ one-shot synthetic hold) | release@7119; older left [6088] | 19:02:33→19:02:53 | 12.7→12.75 | OK | **D1:** faded/absent, below room, over dock/control |  |
| 124 | rx-375L | R6:5301 | 1 | wheel 20 px (+ one-shot synthetic hold) | release@5603; older left [7130] | 19:02:34→19:02:55 | 12.7→12.75 | OK |  |  |
| 125 | rx-375L | R5:5302 | 2 | wheel 20 px (+ one-shot synthetic hold) | release@6757; older left [5995] | 19:02:53→19:03:12 | 12.75→11.39 | OK | **D1:** below room, over dock/control |  |
| 126 | rx-375L | R6:5301 | 2 | wheel 20 px (+ one-shot synthetic hold) | release@5658; older left [7353] | 19:02:55→19:03:16 | 13.09→11.44 | OK |  |  |
| 127 | rx-375L | R5:5302 | 3 | wheel 20 px (+ one-shot synthetic hold) | release@6732; older left [6113] | 19:03:12→19:03:31 | 11.39→9.79 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 128 | rx-375L | R6:5301 | 3 | wheel 20 px (+ one-shot synthetic hold) | release@5617; older left [7243] | 19:03:16→19:03:36 | 11.44→9.65 | OK |  |  |
| 129 | rx-375L | R5:5302 | 4 | wheel 20 px (+ one-shot synthetic hold) | release@6926; older left [6405] | 19:03:31→19:03:50 | 9.79→9.27 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 130 | rx-375L | R6:5301 | 4 | wheel 20 px (+ one-shot synthetic hold) | release@5754; older left [7437] | 19:03:36→19:03:57 | 9.65→9.56 | OK |  |  |
| 131 | rx-375L | R5:5302 | 5 | wheel 20 px (+ one-shot synthetic hold) | release@6575; older left [6035] | 19:03:51→19:04:10 | 9.27→9.78 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 132 | rx-375L | R6:5301 | 5 | wheel 20 px (+ one-shot synthetic hold) | release@5700; older left [7311] | 19:03:57→19:04:18 | 9.56→9.79 | OK |  |  |
| 133 | rx-375L | R5:5302 | 6 | wheel 20 px (+ one-shot synthetic hold) | release@6474; older left [6007] | 19:04:10→19:04:29 | 9.78→10.13 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 134 | rx-375L | R6:5301 | 6 | wheel 20 px (+ one-shot synthetic hold) | release@5927; older left [7546] | 19:04:18→19:04:38 | 9.79→10.66 | OK |  |  |
| 135 | rx-375L | R5:5302 | 7 | wheel 20 px (+ one-shot synthetic hold) | release@6544; older left [5937] | 19:04:29→19:04:48 | 10.13→10.48 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 136 | rx-375L | R6:5301 | 7 | wheel 20 px (+ one-shot synthetic hold) | release@5656; older left [7259] | 19:04:38→19:04:58 | 10.66→11.38 | OK |  |  |
| 137 | rx-375L | R5:5302 | 8 | wheel 20 px (+ one-shot synthetic hold) | release@7065; older left [5992] | 19:04:48→19:05:08 | 10.48→10.85 | OK |  |  |
| 138 | rx-375L | R6:5301 | 8 | wheel 20 px (+ one-shot synthetic hold) | release@5678; older left [7286] | 19:04:58→19:05:18 | 11.38→11.58 | OK |  |  |
| 139 | rx-375L | R5:5302 | 9 | wheel 20 px (+ one-shot synthetic hold) | release@6619; older left [5825] | 19:05:08→19:05:27 | 10.85→11.78 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 140 | rx-375L | R6:5301 | 9 | wheel 20 px (+ one-shot synthetic hold) | release@5602; older left [7278] | 19:05:18→19:05:39 | 11.58→10.53 | OK |  |  |
| 141 | natural-375D | R6:5301 | 0 | wheel 40 px up / 20 px down | wait=600; top@3612, down@4215; older left [3603, 3603] | 19:05:40→19:05:54 | 10.53→12.59 | OK |  |  |
| 142 | natural-375D | R5:5302 | 0 | wheel 40 px up / 20 px down | wait=600; top@2562, down@3164; older left [3913, 4619] | 19:05:40→19:05:55 | 10.53→12.7 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 143 | natural-375D | R6:5301 | 1 | wheel 40 px up / 20 px down | wait=600; top@3709, down@4312; older left [3533, 3533] | 19:05:54→19:06:08 | 12.59→12.25 | OK |  |  |
| 144 | natural-375D | R5:5302 | 1 | wheel 40 px up / 20 px down | wait=600; top@1818, down@2421; older left [4365, 4623] | 19:05:55→19:06:09 | 12.7→12.25 | OK |  |  |
| 145 | natural-375D | R6:5301 | 2 | wheel 40 px up / 20 px down | wait=900; top@3554, down@4465; older left [3528, 3528] | 19:06:08→19:06:22 | 12.25→12.29 | OK |  |  |
| 146 | natural-375D | R5:5302 | 2 | wheel 40 px up / 20 px down | wait=900; top@1659, down@2562; older left [4718, 4718] | 19:06:09→19:06:24 | 12.25→12.29 | OK |  |  |
| 147 | natural-375D | R6:5301 | 3 | wheel 40 px up / 20 px down | wait=900; top@3608, down@4510; older left [3599, 3599] | 19:06:22→19:06:36 | 12.29→12.68 | OK |  |  |
| 148 | natural-375D | R5:5302 | 3 | wheel 40 px up / 20 px down | wait=900; top@1819, down@2721; older left [4695, 4695] | 19:06:24→19:06:38 | 12.29→12.68 | OK |  |  |
| 149 | natural-375D | R6:5301 | 4 | wheel 40 px up / 20 px down | wait=1200; top@3717, down@4919; older left [3604, 3604] | 19:06:36→19:06:50 | 12.68→12.26 | OK |  |  |
| 150 | natural-375D | R5:5302 | 4 | wheel 40 px up / 20 px down | wait=1200; top@1736, down@2938; older left [4572, 5089] | 19:06:38→19:06:54 | 12.68→12.26 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 151 | natural-375D | R6:5301 | 5 | wheel 40 px up / 20 px down | wait=1200; top@3710, down@4914; older left [3530, 3530] | 19:06:50→19:07:05 | 12.26→10.92 | OK |  |  |
| 152 | natural-375D | R5:5302 | 5 | wheel 40 px up / 20 px down | wait=1200; top@1785, down@2988; older left [4634, 5025] | 19:06:54→19:07:10 | 12.26→10.68 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 153 | natural-375D | R6:5301 | 6 | wheel 40 px up / 20 px down | wait=1500; top@3688, down@5255; older left [3542, 3542] | 19:07:05→19:07:19 | 10.92→10.87 | OK |  |  |
| 154 | natural-375D | R5:5302 | 6 | wheel 40 px up / 20 px down | wait=1500; top@1912, down@3415; older left [3903, 5345] | 19:07:10→19:07:24 | 10.68→11.44 | OK |  |  |
| 155 | natural-375D | R6:5301 | 7 | wheel 40 px up / 20 px down | wait=1500; top@3784, down@5287; older left [3620, 3620] | 19:07:19→19:07:34 | 10.87→12.34 | OK |  |  |
| 156 | natural-375D | R5:5302 | 7 | wheel 40 px up / 20 px down | wait=1500; top@1753, down@3255; older left [3551, 4351] | 19:07:24→19:07:38 | 11.44→12.31 | OK |  |  |
| 157 | natural-375D | R6:5301 | 8 | wheel 40 px up / 20 px down | wait=1800; top@3620, down@5427; older left [3611, 3611] | 19:07:34→19:07:50 | 12.34→13.16 | OK |  |  |
| 158 | natural-375D | R5:5302 | 8 | wheel 40 px up / 20 px down | wait=1800; top@1816, down@3630; older left [3513, 6078] | 19:07:38→19:07:53 | 12.31→12.66 | OK | [entry-flicker x1] |  |
| 159 | natural-375D | R6:5301 | 9 | wheel 40 px up / 20 px down | wait=1800; top@3597, down@5428; older left [3573, 3573] | 19:07:50→19:08:04 | 13.16→12.54 | OK |  |  |
| 160 | natural-375D | R5:5302 | 9 | wheel 40 px up / 20 px down | wait=1800; top@1654, down@3457; older left [3796, 5696] | 19:07:53→19:08:08 | 12.66→11.77 | OK |  |  |
| 161 | race-375D | R6:5301 | 0 | wheel 20 px (+ one-shot synthetic hold) | release@15117; older left [16793] | 19:08:08→19:08:38 | 11.77→11.49 | OK |  |  |
| 162 | race-375D | R5:5302 | 0 | wheel 20 px (+ one-shot synthetic hold) | release@6552; older left [6091] | 19:08:08→19:08:29 | 11.77→11.31 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 163 | race-375D | R5:5302 | 1 | wheel 20 px (+ one-shot synthetic hold) | release@7641; older left [5966] | 19:08:29→19:08:49 | 11.31→11.89 | OK | **D1:** faded/absent, below room, over dock/control |  |
| 164 | race-375D | R6:5301 | 1 | wheel 20 px (+ one-shot synthetic hold) | release@14864; older left [16528] | 19:08:38→19:09:08 | 11.49→10.99 | OK |  |  |
| 165 | race-375D | R5:5302 | 2 | wheel 20 px (+ one-shot synthetic hold) | release@5977; older left [5999] | 19:08:49→19:09:07 | 11.89→10.99 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 166 | race-375D | R5:5302 | 3 | wheel 20 px (+ one-shot synthetic hold) | release@5956; older left [6021] | 19:09:07→19:09:27 | 10.99→10.36 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 167 | race-375D | R6:5301 | 2 | wheel 20 px (+ one-shot synthetic hold) | release@14796; older left [16536] | 19:09:08→19:09:38 | 10.99→9.75 | OK |  |  |
| 168 | race-375D | R5:5302 | 4 | wheel 20 px (+ one-shot synthetic hold) | release@6587; older left [5946] | 19:09:27→19:09:46 | 10.36→9.55 | OK | **D1:** below room, over dock/control |  |
| 169 | race-375D | R6:5301 | 3 | wheel 20 px (+ one-shot synthetic hold) | release@14759; older left [16435] | 19:09:38→19:10:07 | 9.75→9.09 | OK |  |  |
| 170 | race-375D | R5:5302 | 5 | wheel 20 px (+ one-shot synthetic hold) | release@6411; older left [5935] | 19:09:46→19:10:05 | 9.55→9.28 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 171 | race-375D | R5:5302 | 6 | wheel 20 px (+ one-shot synthetic hold) | release@5925; older left [5983] | 19:10:05→19:10:23 | 9.28→10.01 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 172 | race-375D | R6:5301 | 4 | wheel 20 px (+ one-shot synthetic hold) | release@15182; older left [16826] | 19:10:07→19:10:38 | 9.09→9.76 | OK |  |  |
| 173 | race-375D | R5:5302 | 7 | wheel 20 px (+ one-shot synthetic hold) | release@5984; older left [6046] | 19:10:23→19:10:41 | 10.01→10.1 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 174 | race-375D | R6:5301 | 5 | wheel 20 px (+ one-shot synthetic hold) | release@14849; older left [16476] | 19:10:38→19:11:07 | 9.76→9.02 | OK |  |  |
| 175 | race-375D | R5:5302 | 8 | wheel 20 px (+ one-shot synthetic hold) | release@6400; older left [5926] | 19:10:41→19:11:01 | 10.1→9.02 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 176 | race-375D | R5:5302 | 9 | wheel 20 px (+ one-shot synthetic hold) | release@6646; older left [5987] | 19:11:01→19:11:20 | 9.02→9.01 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 177 | race-375D | R6:5301 | 6 | wheel 20 px (+ one-shot synthetic hold) | release@14636; older left [16245] | 19:11:07→19:11:36 | 9.02→7.51 | OK |  |  |
| 178 | race-375D | R6:5301 | 7 | wheel 20 px (+ one-shot synthetic hold) | release@14640; older left [16320] | 19:11:36→19:12:05 | 7.51→6.85 | OK |  |  |
| 179 | race-375D | R6:5301 | 8 | wheel 20 px (+ one-shot synthetic hold) | release@14618; older left [16310] | 19:12:05→19:12:34 | 6.85→6.25 | OK |  |  |
| 180 | race-375D | R6:5301 | 9 | wheel 20 px (+ one-shot synthetic hold) | release@14608; older left [16265] | 19:12:34→19:13:03 | 6.25→6.34 | OK |  |  |
| 181 | repro6sel-375D | R6:5301 | 0 | wheel | during d=1000; gesture 1248–5387 (21 strokes); warn@204; older left [4065, 5056] | 19:13:04→19:13:18 | 6.34→7.97 | OK |  |  |
| 182 | repro6sel-375D | R5:5302 | 0 | wheel | during d=1000; gesture 1298–3786 (10 strokes); warn@248; older left [3540, 3540] | 19:13:04→19:13:17 | 6.34→7.97 | FAIL |  |  |
| 183 | repro6sel-375D | R5:5302 | 1 | wheel | during d=1600; gesture 1894–3882 (9 strokes); warn@290; older left [3487, 3487] | 19:13:17→19:13:29 | 7.97→8.72 | FAIL |  |  |
| 184 | repro6sel-375D | R6:5301 | 1 | wheel | during d=1600; gesture 1896–5955 (19 strokes); warn@265; older left [4052, 5499] | 19:13:18→19:13:33 | 7.97→9.63 | OK |  |  |
| 185 | repro6sel-375D | R5:5302 | 2 | wheel | during d=2200; gesture 2531–5295 (11 strokes); warn@325; older left [3714, 3714] | 19:13:29→19:13:42 | 8.72→9.9 | FAIL |  |  |
| 186 | repro6sel-375D | R6:5301 | 2 | wheel | during d=2200; gesture 2484–5330 (13 strokes); warn@279; older left [3514, 4963] | 19:13:33→19:13:47 | 9.63→9.91 | OK |  |  |
| 187 | repro6sel-375D | R5:5302 | 3 | wheel | during d=2800; gesture 3333–5187 (8 strokes); warn@527; older left [3595, 3595] | 19:13:42→19:13:56 | 9.9→10.11 | FAIL |  |  |
| 188 | repro6sel-375D | R6:5301 | 3 | wheel | during d=2800; gesture 3054–4987 (8 strokes); warn@251; older left [3587, 3587] | 19:13:47→19:14:01 | 9.91→10.02 | OK |  |  |
| 189 | repro6sel-375D | R5:5302 | 4 | wheel | after d=300; gesture 590–2845 (8 strokes); warn@277; older left [3675, 3675] | 19:13:56→19:14:07 | 10.11→9.86 | FAIL |  |  |
| 190 | repro6sel-375D | R6:5301 | 4 | wheel | after d=300; gesture 644–2622 (8 strokes); warn@327; older left [3537, 3993] | 19:14:01→19:14:13 | 10.02→10.27 | OK |  |  |
| 191 | repro6sel-375D | R5:5302 | 5 | wheel | after d=600; gesture 803–3292 (8 strokes); warn@196; older left [3511, 3511] | 19:14:07→19:14:19 | 9.86→10.73 | FAIL |  |  |
| 192 | repro6sel-375D | R6:5301 | 5 | wheel | after d=600; gesture 979–3082 (8 strokes); warn@333; older left [3535, 3984] | 19:14:13→19:14:24 | 10.27→11.31 | OK |  |  |
| 193 | repro6sel-375D | R5:5302 | 6 | wheel | during d=1000; gesture 1398–3919 (10 strokes); warn@393; older left [3513, 3513] | 19:14:19→19:14:32 | 10.73→12.41 | FAIL | [entry-flicker x1] |  |
| 194 | repro6sel-375D | R6:5301 | 6 | wheel | during d=1000; gesture 1317–5478 (20 strokes); warn@286; older left [4096, 5146] | 19:14:24→19:14:39 | 11.31→12.3 | OK |  |  |
| 195 | repro6sel-375D | R5:5302 | 7 | wheel | during d=1600; gesture 1930–3784 (9 strokes); warn@315; older left [3495, 3495] | 19:14:32→19:14:44 | 12.41→12.36 | FAIL |  |  |
| 196 | repro6sel-375D | R6:5301 | 7 | wheel | during d=1600; gesture 1880–5931 (19 strokes); warn@277; older left [4112, 5548] | 19:14:39→19:14:53 | 12.3→12.31 | OK |  |  |
| 197 | repro6sel-375D | R5:5302 | 8 | wheel | during d=2200; gesture 2395–4245 (9 strokes); warn@189; older left [3509, 3509] | 19:14:44→19:14:57 | 12.36→12.36 | FAIL |  |  |
| 198 | repro6sel-375D | R6:5301 | 8 | wheel | during d=2200; gesture 2385–5181 (13 strokes); warn@181; older left [3478, 4759] | 19:14:53→19:15:06 | 12.31→12.22 | OK |  |  |
| 199 | repro6sel-375D | R5:5302 | 9 | wheel | during d=2800; gesture 3227–5083 (8 strokes); warn@393; older left [3713, 3713] | 19:14:57→19:15:11 | 12.36→12.44 | FAIL |  |  |
| 200 | repro6sel-375D | R6:5301 | 9 | wheel | during d=2800; gesture 3093–4770 (8 strokes); warn@288; older left [3504, 3504] | 19:15:06→19:15:19 | 12.22→12.09 | OK |  |  |
| 201 | nx-375D | R6:5301 | 0 | wheel 40 px up / 20 px down | wait=600; top@2500, down@3102; older left [3515, 3515] | 19:15:20→19:15:34 | 12.09→12.12 | OK |  |  |
| 202 | nx-375D | R5:5302 | 0 | wheel 40 px up / 20 px down | wait=600; top@2817, down@3419; older left [4164, 4429] | 19:15:20→19:15:35 | 12.09→12.28 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 203 | nx-375D | R6:5301 | 1 | wheel 40 px up / 20 px down | wait=600; top@2048, down@2654; older left [3535, 3535] | 19:15:34→19:15:47 | 12.12→11.89 | OK |  |  |
| 204 | nx-375D | R5:5302 | 1 | wheel 40 px up / 20 px down | wait=600; top@2297, down@2900; older left [3795, 4762] | 19:15:35→19:15:50 | 12.28→11.89 | OK |  |  |
| 205 | nx-375D | R6:5301 | 2 | wheel 40 px up / 20 px down | wait=900; top@1936, down@2840; older left [3900, 3900] | 19:15:47→19:16:01 | 11.89→11.54 | OK |  |  |
| 206 | nx-375D | R5:5302 | 2 | wheel 40 px up / 20 px down | wait=900; top@1719, down@2623; older left [4647, 4647] | 19:15:50→19:16:05 | 11.89→11.54 | OK |  |  |
| 207 | nx-375D | R6:5301 | 3 | wheel 40 px up / 20 px down | wait=900; top@2387, down@3289; older left [3570, 3570] | 19:16:01→19:16:14 | 11.54→12.23 | OK |  |  |
| 208 | nx-375D | R5:5302 | 3 | wheel 40 px up / 20 px down | wait=900; top@1833, down@2736; older left [4679, 5167] | 19:16:05→19:16:20 | 11.54→12.13 | OK |  |  |
| 209 | nx-375D | R6:5301 | 4 | wheel 40 px up / 20 px down | wait=1200; top@2295, down@3513; older left [3561, 3561] | 19:16:14→19:16:27 | 12.23→12.24 | OK |  |  |
| 210 | nx-375D | R5:5302 | 4 | wheel 40 px up / 20 px down | wait=1200; top@2212, down@3415; older left [3783, 5199] | 19:16:20→19:16:35 | 12.13→12.62 | OK |  |  |
| 211 | nx-375D | R6:5301 | 5 | wheel 40 px up / 20 px down | wait=1200; top@2044, down@3245; older left [3539, 3539] | 19:16:27→19:16:41 | 12.24→12.88 | OK |  |  |
| 212 | nx-375D | R5:5302 | 5 | wheel 40 px up / 20 px down | wait=1200; top@2392, down@3596; older left [3522, 4370] | 19:16:35→19:16:49 | 12.62→12.97 | OK |  |  |
| 213 | nx-375D | R6:5301 | 6 | wheel 40 px up / 20 px down | wait=1500; top@1634, down@3136; older left [3506, 3506] | 19:16:41→19:16:54 | 12.88→12.65 | OK |  |  |
| 214 | nx-375D | R5:5302 | 6 | wheel 40 px up / 20 px down | wait=1500; top@2544, down@4046; older left [3988, 5537] | 19:16:49→19:17:03 | 12.97→12.39 | OK |  |  |
| 215 | nx-375D | R6:5301 | 7 | wheel 40 px up / 20 px down | wait=1500; top@1836, down@3386; older left [3628, 3628] | 19:16:54→19:17:07 | 12.65→13.32 | OK |  |  |
| 216 | nx-375D | R5:5302 | 7 | wheel 40 px up / 20 px down | wait=1500; top@2085, down@3587; older left [3786, 5321] | 19:17:03→19:17:18 | 12.39→13.29 | OK |  |  |
| 217 | nx-375D | R6:5301 | 8 | wheel 40 px up / 20 px down | wait=1800; top@1850, down@3700; older left [3478, 3478] | 19:17:07→19:17:21 | 13.32→12.79 | OK |  |  |
| 218 | nx-375D | R5:5302 | 8 | wheel 40 px up / 20 px down | wait=1800; top@2201, down@4004; older left [3726, 3910] | 19:17:18→19:17:31 | 13.29→11.59 | OK |  |  |
| 219 | nx-375D | R6:5301 | 9 | wheel 40 px up / 20 px down | wait=1800; top@1843, down@3646; older left [3689, 3689] | 19:17:21→19:17:35 | 12.79→11.59 | OK |  |  |
| 220 | nx-375D | R5:5302 | 9 | wheel 40 px up / 20 px down | wait=1800; top@1869, down@3672; older left [3499, 5997] | 19:17:31→19:17:45 | 11.59→11.19 | OK | [entry-flicker x1] |  |
| 221 | rx-375D | R5:5302 | 0 | wheel 20 px (+ one-shot synthetic hold) | release@6921; older left [6179] | 19:17:46→19:18:06 | 10.38→9.08 | OK | **D1:** below room, over dock/control |  |
| 222 | rx-375D | R6:5301 | 0 | wheel 20 px (+ one-shot synthetic hold) | release@5660; older left [7256] | 19:17:46→19:18:06 | 10.38→9.08 | OK |  |  |
| 223 | rx-375D | R5:5302 | 1 | wheel 20 px (+ one-shot synthetic hold) | release@6457; older left [5965] | 19:18:06→19:18:26 | 9.08→8.25 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 224 | rx-375D | R6:5301 | 1 | wheel 20 px (+ one-shot synthetic hold) | release@5694; older left [7331] | 19:18:06→19:18:28 | 9.08→8.25 | OK |  |  |
| 225 | rx-375D | R5:5302 | 2 | wheel 20 px (+ one-shot synthetic hold) | release@6399; older left [5971] | 19:18:26→19:18:45 | 8.25→8.82 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 226 | rx-375D | R6:5301 | 2 | wheel 20 px (+ one-shot synthetic hold) | release@5639; older left [7332] | 19:18:28→19:18:49 | 8.25→8.84 | OK |  |  |
| 227 | rx-375D | R5:5302 | 3 | wheel 20 px (+ one-shot synthetic hold) | release@6493; older left [5888] | 19:18:45→19:19:04 | 8.82→8.16 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 228 | rx-375D | R6:5301 | 3 | wheel 20 px (+ one-shot synthetic hold) | release@5689; older left [7369] | 19:18:49→19:19:10 | 8.84→8.47 | OK |  |  |
| 229 | rx-375D | R5:5302 | 4 | wheel 20 px (+ one-shot synthetic hold) | release@6643; older left [6019] | 19:19:04→19:19:24 | 8.16→9.46 | OK | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 230 | rx-375D | R6:5301 | 4 | wheel 20 px (+ one-shot synthetic hold) | release@5651; older left [7326] | 19:19:10→19:19:30 | 8.47→9.9 | OK |  |  |
| 231 | rx-375D | R5:5302 | 5 | wheel 20 px (+ one-shot synthetic hold) | release@6684; older left [6051] | 19:19:24→19:19:43 | 9.46→9.83 | OK | **D1:** below room, over dock/control |  |
| 232 | rx-375D | R6:5301 | 5 | wheel 20 px (+ one-shot synthetic hold) | release@5702; older left [7393] | 19:19:30→19:19:50 | 9.9→10.64 | OK |  |  |
| 233 | rx-375D | R5:5302 | 6 | wheel 20 px (+ one-shot synthetic hold) | release@6563; older left [6018] | 19:19:43→19:20:02 | 9.83→10.18 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 234 | rx-375D | R6:5301 | 6 | wheel 20 px (+ one-shot synthetic hold) | release@5690; older left [7332] | 19:19:50→19:20:11 | 10.64→9.45 | OK |  |  |
| 235 | rx-375D | R5:5302 | 7 | wheel 20 px (+ one-shot synthetic hold) | release@6441; older left [5922] | 19:20:02→19:20:21 | 10.18→8.93 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 236 | rx-375D | R6:5301 | 7 | wheel 20 px (+ one-shot synthetic hold) | release@5777; older left [7401] | 19:20:11→19:20:31 | 9.45→8.55 | OK |  |  |
| 237 | rx-375D | R5:5302 | 8 | wheel 20 px (+ one-shot synthetic hold) | release@6598; older left [5975] | 19:20:21→19:20:40 | 8.93→8.91 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 238 | rx-375D | R6:5301 | 8 | wheel 20 px (+ one-shot synthetic hold) | release@5764; older left [7342] | 19:20:31→19:20:51 | 8.55→8.62 | OK |  |  |
| 239 | rx-375D | R5:5302 | 9 | wheel 20 px (+ one-shot synthetic hold) | release@6434; older left [5898] | 19:20:40→19:20:59 | 8.91→8.73 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 240 | rx-375D | R6:5301 | 9 | wheel 20 px (+ one-shot synthetic hold) | release@5642; older left [7292] | 19:20:51→19:21:10 | 8.62→8.86 | OK |  |  |
| 241 | natural-844L | R6:5301 | 0 | wheel 40 px up / 20 px down | wait=600; top@4187, down@4790; older left [3569, 4078] | 19:21:11→19:21:27 | 8.87→9.66 | OK |  |  |
| 242 | natural-844L | R5:5302 | 0 | wheel 40 px up / 20 px down | wait=600; top@2571, down@3173; older left [4147, 4631] | 19:21:11→19:21:27 | 8.87→9.66 | FAIL | [entry-flicker x2] |  |
| 243 | natural-844L | R5:5302 | 1 | wheel 40 px up / 20 px down | wait=600; top@1969, down@2570; older left [3908, 4292] | 19:21:27→19:21:41 | 9.66→10.45 | OK | [entry-flicker x1] |  |
| 244 | natural-844L | R6:5301 | 1 | wheel 40 px up / 20 px down | wait=600; top@3734, down@4336; older left [3498, 3694] | 19:21:27→19:21:41 | 9.66→10.45 | OK |  |  |
| 245 | natural-844L | R5:5302 | 2 | wheel 40 px up / 20 px down | wait=900; top@3746, down@4648; older left [3506, 3705] | 19:21:41→19:21:56 | 10.45→10.73 | FAIL | [entry-flicker x1] |  |
| 246 | natural-844L | R6:5301 | 2 | wheel 40 px up / 20 px down | wait=900; top@4030, down@4933; older left [3475, 4209] | 19:21:41→19:21:55 | 10.45→10.44 | OK |  |  |
| 247 | natural-844L | R6:5301 | 3 | wheel 40 px up / 20 px down | wait=900; top@3801, down@4703; older left [3555, 4083] | 19:21:55→19:22:10 | 10.44→10.36 | OK |  |  |
| 248 | natural-844L | R5:5302 | 3 | wheel 40 px up / 20 px down | wait=900; top@1834, down@2737; older left [4155, 5055] | 19:21:56→19:22:11 | 10.73→10.74 | OK |  |  |
| 249 | natural-844L | R6:5301 | 4 | wheel 40 px up / 20 px down | wait=1200; top@4028, down@5230; older left [3538, 3994] | 19:22:10→19:22:25 | 10.36→11.31 | OK |  |  |
| 250 | natural-844L | R5:5302 | 4 | wheel 40 px up / 20 px down | wait=1200; top@3851, down@5054; older left [3545, 3746] | 19:22:11→19:22:26 | 10.74→11.53 | FAIL | [entry-flicker x1] |  |
| 251 | natural-844L | R6:5301 | 5 | wheel 40 px up / 20 px down | wait=1200; top@3914, down@5116; older left [3513, 4228] | 19:22:25→19:22:39 | 11.31→11.18 | OK |  |  |
| 252 | natural-844L | R5:5302 | 5 | wheel 40 px up / 20 px down | wait=1200; top@1517, down@2718; older left [3681, 5178] | 19:22:26→19:22:41 | 11.53→11.18 | OK |  |  |
| 253 | natural-844L | R6:5301 | 6 | wheel 40 px up / 20 px down | wait=1500; top@4068, down@5570; older left [3562, 4062] | 19:22:39→19:22:54 | 11.18→10.42 | OK |  |  |
| 254 | natural-844L | R5:5302 | 6 | wheel 40 px up / 20 px down | wait=1500; top@1603, down@3106; older left [4298, 5363] | 19:22:41→19:22:56 | 11.01→10.42 | OK |  |  |
| 255 | natural-844L | R6:5301 | 7 | wheel 40 px up / 20 px down | wait=1500; top@3911, down@5415; older left [3497, 4042] | 19:22:54→19:23:09 | 10.42→11.23 | OK |  |  |
| 256 | natural-844L | R5:5302 | 7 | wheel 40 px up / 20 px down | wait=1500; top@1665, down@3167; older left [3727, 5492] | 19:22:56→19:23:10 | 10.42→11.23 | OK |  |  |
| 257 | natural-844L | R6:5301 | 8 | wheel 40 px up / 20 px down | wait=1800; top@3884, down@5686; older left [3555, 3791] | 19:23:09→19:23:24 | 11.23→11.89 | OK |  |  |
| 258 | natural-844L | R5:5302 | 8 | wheel 40 px up / 20 px down | wait=1800; top@1521, down@3323; older left [3844, 5809] | 19:23:10→19:23:26 | 11.23→11.89 | OK |  |  |
| 259 | natural-844L | R6:5301 | 9 | wheel 40 px up / 20 px down | wait=1800; top@3928, down@5730; older left [3480, 4142] | 19:23:24→19:23:39 | 11.89→11.36 | OK |  |  |
| 260 | natural-844L | R5:5302 | 9 | wheel 40 px up / 20 px down | wait=1800; top@1583, down@3386; older left [3695, 5941] | 19:23:26→19:23:41 | 11.89→10.61 | OK |  |  |
| 261 | race-844L | R5:5302 | 0 | wheel 20 px (+ one-shot synthetic hold) | release@7544; older left [6792] | 19:23:42→19:24:03 | 10.61→9.65 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 262 | race-844L | R6:5301 | 0 | wheel 20 px (+ one-shot synthetic hold) | release@15393; older left [16977] | 19:23:42→19:24:12 | 10.61→9.66 | OK |  |  |
| 263 | race-844L | R5:5302 | 1 | wheel 20 px (+ one-shot synthetic hold) | release@7735; older left [6662] | 19:24:03→19:24:23 | 9.65→10.19 | OK |  |  |
| 264 | race-844L | R6:5301 | 1 | wheel 20 px (+ one-shot synthetic hold) | release@15482; older left [17104] | 19:24:12→19:24:42 | 9.66→10.11 | OK |  |  |
| 265 | race-844L | R5:5302 | 2 | wheel 20 px (+ one-shot synthetic hold) | release@7676; older left [6754] | 19:24:23→19:24:43 | 10.19→10.11 | OK |  |  |
| 266 | race-844L | R6:5301 | 2 | wheel 20 px (+ one-shot synthetic hold) | release@15334; older left [17045] | 19:24:42→19:25:12 | 10.11→10.65 | OK |  |  |
| 267 | race-844L | R5:5302 | 3 | wheel 20 px (+ one-shot synthetic hold) | release@7484; older left [6846] | 19:24:43→19:25:04 | 10.11→9.78 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 268 | race-844L | R5:5302 | 4 | wheel 20 px (+ one-shot synthetic hold) | release@8086; older left [7045] | 19:25:04→19:25:25 | 9.78→10.64 | OK |  |  |
| 269 | race-844L | R6:5301 | 3 | wheel 20 px (+ one-shot synthetic hold) | release@15489; older left [17052] | 19:25:12→19:25:42 | 10.65→9.96 | OK |  |  |
| 270 | race-844L | R5:5302 | 5 | wheel 20 px (+ one-shot synthetic hold) | release@7316; older left [6698] | 19:25:25→19:25:45 | 10.64→9.96 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 271 | race-844L | R6:5301 | 4 | wheel 20 px (+ one-shot synthetic hold) | release@15312; older left [16758] | 19:25:42→19:26:12 | 9.96→9.07 | OK |  |  |
| 272 | race-844L | R5:5302 | 6 | wheel 20 px (+ one-shot synthetic hold) | release@7517; older left [6798] | 19:25:45→19:26:06 | 9.96→9.61 | OK | **D1:** below room, over dock/control |  |
| 273 | race-844L | R5:5302 | 7 | wheel 20 px (+ one-shot synthetic hold) | release@7516; older left [7050] | 19:26:06→19:26:26 | 9.08→9.24 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 274 | race-844L | R6:5301 | 5 | wheel 20 px (+ one-shot synthetic hold) | release@15869; older left [17409] | 19:26:12→19:26:42 | 9.07→9.03 | OK |  |  |
| 275 | race-844L | R5:5302 | 8 | wheel 20 px (+ one-shot synthetic hold) | release@7509; older left [6783] | 19:26:26→19:26:46 | 9.24→9.75 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 276 | race-844L | R6:5301 | 6 | wheel 20 px (+ one-shot synthetic hold) | release@15309; older left [16907] | 19:26:42→19:27:11 | 9.03→8.53 | OK |  |  |
| 277 | race-844L | R5:5302 | 9 | wheel 20 px (+ one-shot synthetic hold) | release@7492; older left [6835] | 19:26:46→19:27:07 | 9.75→8.84 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 278 | race-844L | R6:5301 | 7 | wheel 20 px (+ one-shot synthetic hold) | release@15258; older left [16953] | 19:27:11→19:27:40 | 8.53→9.21 | OK |  |  |
| 279 | race-844L | R6:5301 | 8 | wheel 20 px (+ one-shot synthetic hold) | release@15243; older left [16853] | 19:27:41→19:28:10 | 9.21→8.89 | OK |  |  |
| 280 | race-844L | R6:5301 | 9 | wheel 20 px (+ one-shot synthetic hold) | release@15261; older left [16940] | 19:28:10→19:28:39 | 8.89→8.63 | OK |  |  |
| 281 | repro6sel-844L | R6:5301 | 0 | wheel | during d=1000; gesture 1433–5735 (18 strokes); warn@384; older left [3614, 3615] | 19:28:40→19:28:55 | 8.63→9.85 | OK |  |  |
| 282 | repro6sel-844L | R5:5302 | 0 | wheel | during d=1000; gesture 1418–5053 (16 strokes); warn@404; older left [3600, 3600] | 19:28:40→19:28:54 | 8.63→9.85 | FAIL |  |  |
| 283 | repro6sel-844L | R5:5302 | 1 | wheel | during d=1600; gesture 2198–5331 (16 strokes); warn@592; older left [3539, 3539] | 19:28:54→19:29:09 | 9.85→10.62 | FAIL |  |  |
| 284 | repro6sel-844L | R6:5301 | 1 | wheel | during d=1600; gesture 1801–5706 (20 strokes); warn@196; older left [3476, 4687] | 19:28:55→19:29:10 | 9.85→10.62 | OK |  |  |
| 285 | repro6sel-844L | R5:5302 | 2 | wheel | during d=2200; gesture 2474–5633 (16 strokes); warn@267; older left [3499, 3499] | 19:29:09→19:29:23 | 10.62→10.4 | FAIL |  |  |
| 286 | repro6sel-844L | R6:5301 | 2 | wheel | during d=2200; gesture 2454–5555 (16 strokes); warn@248; older left [3537, 3537] | 19:29:10→19:29:24 | 10.62→10.4 | OK |  |  |
| 287 | repro6sel-844L | R5:5302 | 3 | wheel | during d=2800; gesture 3253–6374 (16 strokes); warn@447; older left [3673, 3673] | 19:29:23→19:29:38 | 10.4→10.56 | FAIL | [entry-flicker x1] |  |
| 288 | repro6sel-844L | R6:5301 | 3 | wheel | during d=2800; gesture 3076–6235 (16 strokes); warn@270; older left [3562, 3562] | 19:29:24→19:29:40 | 10.4→10.56 | OK |  |  |
| 289 | repro6sel-844L | R5:5302 | 4 | wheel | after d=300; gesture 571–3140 (8 strokes); warn@256; older left [3506, 3506] | 19:29:38→19:29:49 | 10.56→11.84 | FAIL | [entry-flicker x1] |  |
| 290 | repro6sel-844L | R6:5301 | 4 | wheel | after d=300; gesture 574–2615 (8 strokes); warn@266; older left [3527, 3527] | 19:29:40→19:29:51 | 10.56→12.09 | OK |  |  |
| 291 | repro6sel-844L | R5:5302 | 5 | wheel | after d=600; gesture 830–2924 (8 strokes); warn@203; older left [3471, 3471] | 19:29:49→19:30:01 | 11.84→12.49 | FAIL |  |  |
| 292 | repro6sel-844L | R6:5301 | 5 | wheel | after d=600; gesture 831–2512 (8 strokes); warn@212; older left [3497, 3497] | 19:29:52→19:30:03 | 12.09→12.37 | OK |  |  |
| 293 | repro6sel-844L | R5:5302 | 6 | wheel | during d=1000; gesture 1291–4784 (16 strokes); warn@284; older left [3508, 3508] | 19:30:01→19:30:14 | 12.49→11.93 | FAIL | [entry-flicker x1] |  |
| 294 | repro6sel-844L | R6:5301 | 6 | wheel | during d=1000; gesture 1349–6427 (26 strokes); warn@341; older left [4025, 5253] | 19:30:03→19:30:18 | 12.37→11.53 | OK |  |  |
| 295 | repro6sel-844L | R5:5302 | 7 | wheel | during d=1600; gesture 2098–5292 (16 strokes); warn@447; older left [3507, 3507] | 19:30:14→19:30:28 | 11.93→12.62 | FAIL | [entry-flicker x1] |  |
| 296 | repro6sel-844L | R6:5301 | 7 | wheel | during d=1600; gesture 1961–6304 (20 strokes); warn@353; older left [3514, 4817] | 19:30:18→19:30:34 | 11.53→12.65 | OK |  |  |
| 297 | repro6sel-844L | R5:5302 | 8 | wheel | during d=2200; gesture 2536–5631 (16 strokes); warn@291; older left [3512, 3512] | 19:30:28→19:30:42 | 12.62→12.55 | FAIL |  |  |
| 298 | repro6sel-844L | R6:5301 | 8 | wheel | during d=2200; gesture 2570–6058 (16 strokes); warn@364; older left [3506, 3506] | 19:30:34→19:30:49 | 12.65→12.26 | OK |  |  |
| 299 | repro6sel-844L | R5:5302 | 9 | wheel | during d=2800; gesture 3037–6191 (16 strokes); warn@231; older left [3506, 3506] | 19:30:42→19:30:57 | 12.55→12.2 | FAIL |  |  |
| 300 | repro6sel-844L | R6:5301 | 9 | wheel | during d=2800; gesture 3096–6169 (16 strokes); warn@290; older left [3500, 3500] | 19:30:49→19:31:04 | 12.26→11.63 | OK |  |  |
| 301 | nx-844L | R6:5301 | 0 | wheel 40 px up / 20 px down | wait=600; top@2671, down@3273; older left [3537, 4353] | 19:31:04→19:31:19 | 11.63→12.87 | OK |  |  |
| 302 | nx-844L | R5:5302 | 0 | wheel 40 px up / 20 px down | wait=600; top@1910, down@2512; older left [3657, 4455] | 19:31:05→19:31:19 | 11.63→12.87 | OK |  |  |
| 303 | nx-844L | R6:5301 | 1 | wheel 40 px up / 20 px down | wait=600; top@2549, down@3152; older left [3645, 4398] | 19:31:19→19:31:33 | 12.87→12.68 | OK |  |  |
| 304 | nx-844L | R5:5302 | 1 | wheel 40 px up / 20 px down | wait=600; top@2057, down@2661; older left [3826, 3826] | 19:31:19→19:31:34 | 12.87→12.68 | FAIL | [entry-flicker x1] |  |
| 305 | nx-844L | R6:5301 | 2 | wheel 40 px up / 20 px down | wait=900; top@2092, down@2994; older left [3517, 4153] | 19:31:33→19:31:47 | 12.68→11.84 | OK |  |  |
| 306 | nx-844L | R5:5302 | 2 | wheel 40 px up / 20 px down | wait=900; top@1660, down@2565; older left [4179, 4853] | 19:31:34→19:31:50 | 12.68→11.84 | FAIL | **D1:** faded/absent, below room, over dock/control |  |
| 307 | nx-844L | R6:5301 | 3 | wheel 40 px up / 20 px down | wait=900; top@2362, down@3288; older left [3503, 3956] | 19:31:47→19:32:00 | 11.84→11.52 | OK |  |  |
| 308 | nx-844L | R5:5302 | 3 | wheel 40 px up / 20 px down | wait=900; top@1732, down@2634; older left [4178, 4976] | 19:31:50→19:32:05 | 11.84→12.44 | OK |  |  |
| 309 | nx-844L | R6:5301 | 4 | wheel 40 px up / 20 px down | wait=1200; top@2318, down@3522; older left [3584, 4098] | 19:32:00→19:32:14 | 11.52→12.66 | OK |  |  |
| 310 | nx-844L | R5:5302 | 4 | wheel 40 px up / 20 px down | wait=1200; top@1572, down@2782; older left [4155, 5132] | 19:32:05→19:32:20 | 12.44→14.05 | OK |  |  |
| 311 | nx-844L | R6:5301 | 5 | wheel 40 px up / 20 px down | wait=1200; top@2528, down@3773; older left [3519, 4176] | 19:32:14→19:32:28 | 12.66→14.32 | OK |  |  |
| 312 | nx-844L | R5:5302 | 5 | wheel 40 px up / 20 px down | wait=1200; top@1665, down@2870; older left [4147, 5099] | 19:32:20→19:32:34 | 14.05→13.97 | OK |  |  |
| 313 | nx-844L | R6:5301 | 6 | wheel 40 px up / 20 px down | wait=1500; top@2214, down@3717; older left [3558, 4127] | 19:32:28→19:32:41 | 14.32→14.46 | OK |  |  |
| 314 | nx-844L | R5:5302 | 6 | wheel 40 px up / 20 px down | wait=1500; top@2130, down@3648; older left [3676, 5291] | 19:32:35→19:32:50 | 13.97→13.91 | OK |  |  |
| 315 | nx-844L | R6:5301 | 7 | wheel 40 px up / 20 px down | wait=1500; top@1849, down@3353; older left [3542, 3931] | 19:32:41→19:32:55 | 14.46→13.91 | OK |  |  |
| 316 | nx-844L | R5:5302 | 7 | wheel 40 px up / 20 px down | wait=1500; top@4131, down@5633; older left [3596, 4096] | 19:32:50→19:33:06 | 13.91→14.88 | FAIL | [entry-flicker x1] |  |
| 317 | nx-844L | R6:5301 | 8 | wheel 40 px up / 20 px down | wait=1800; top@1815, down@3623; older left [3509, 3817] | 19:32:55→19:33:09 | 13.91→15.69 | OK |  |  |
| 318 | nx-844L | R5:5302 | 8 | wheel 40 px up / 20 px down | wait=1800; top@2201, down@4137; older left [4150, 6347] | 19:33:06→19:33:21 | 14.88→15.88 | OK |  |  |
| 319 | nx-844L | R6:5301 | 9 | wheel 40 px up / 20 px down | wait=1800; top@2254, down@4057; older left [3537, 3807] | 19:33:09→19:33:23 | 15.69→15.49 | OK |  |  |
| 320 | nx-844L | R5:5302 | 9 | wheel 40 px up / 20 px down | wait=1800; top@1800, down@3602; older left [4346, 5699] | 19:33:21→19:33:36 | 15.88→14.1 | OK |  |  |
| 321 | rx-844L | R5:5302 | 0 | wheel 20 px (+ one-shot synthetic hold) | release@7743; older left [6985] | 19:33:37→19:33:58 | 13.45→11.77 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 322 | rx-844L | R6:5301 | 0 | wheel 20 px (+ one-shot synthetic hold) | release@6399; older left [6095, 8040] | 19:33:37→19:33:57 | 13.45→11.77 | OK |  |  |
| 323 | rx-844L | R6:5301 | 1 | wheel 20 px (+ one-shot synthetic hold) | release@6282; older left [6091, 7939] | 19:33:57→19:34:16 | 11.77→11.96 | OK |  |  |
| 324 | rx-844L | R5:5302 | 1 | wheel 20 px (+ one-shot synthetic hold) | release@7511; older left [6803] | 19:33:58→19:34:19 | 11.77→11.64 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 325 | rx-844L | R6:5301 | 2 | wheel 20 px (+ one-shot synthetic hold) | release@6692; older left [6463, 8330] | 19:34:16→19:34:35 | 11.96→12.05 | OK |  |  |
| 326 | rx-844L | R5:5302 | 2 | wheel 20 px (+ one-shot synthetic hold) | release@7552; older left [6835] | 19:34:19→19:34:40 | 11.64→12.69 | OK | **D1:** below room, over dock/control |  |
| 327 | rx-844L | R6:5301 | 3 | wheel 20 px (+ one-shot synthetic hold) | release@6661; older left [6085, 8274] | 19:34:35→19:34:54 | 12.05→11.44 | OK |  |  |
| 328 | rx-844L | R5:5302 | 3 | wheel 20 px (+ one-shot synthetic hold) | release@8094; older left [6905] | 19:34:40→19:35:01 | 12.69→11.25 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 329 | rx-844L | R6:5301 | 4 | wheel 20 px (+ one-shot synthetic hold) | release@6661; older left [6455, 8320] | 19:34:54→19:35:14 | 11.44→10.29 | OK |  |  |
| 330 | rx-844L | R5:5302 | 4 | wheel 20 px (+ one-shot synthetic hold) | release@7963; older left [6724] | 19:35:01→19:35:22 | 11.25→10.52 | OK |  |  |
| 331 | rx-844L | R6:5301 | 5 | wheel 20 px (+ one-shot synthetic hold) | release@6682; older left [6244, 8294] | 19:35:14→19:35:33 | 10.29→10.84 | OK |  |  |
| 332 | rx-844L | R5:5302 | 5 | wheel 20 px (+ one-shot synthetic hold) | release@7860; older left [6885] | 19:35:22→19:35:42 | 10.52→10.31 | OK |  |  |
| 333 | rx-844L | R6:5301 | 6 | wheel 20 px (+ one-shot synthetic hold) | release@6386; older left [6151, 8062] | 19:35:33→19:35:52 | 10.84→9.38 | OK |  |  |
| 334 | rx-844L | R5:5302 | 6 | wheel 20 px (+ one-shot synthetic hold) | release@7905; older left [6830] | 19:35:42→19:36:02 | 10.31→8.76 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 335 | rx-844L | R6:5301 | 7 | wheel 20 px (+ one-shot synthetic hold) | release@6547; older left [6110, 8208] | 19:35:52→19:36:10 | 9.38→8.54 | OK |  |  |
| 336 | rx-844L | R5:5302 | 7 | wheel 20 px (+ one-shot synthetic hold) | release@8093; older left [6965] | 19:36:02→19:36:23 | 8.76→8.41 | OK | **D1:** faded/absent, below room, over dock/control |  |
| 337 | rx-844L | R6:5301 | 8 | wheel 20 px (+ one-shot synthetic hold) | release@6319; older left [6034, 7959] | 19:36:10→19:36:29 | 8.54→8.61 | OK |  |  |
| 338 | rx-844L | R5:5302 | 8 | wheel 20 px (+ one-shot synthetic hold) | release@7295; older left [6863] | 19:36:23→19:36:42 | 8.41→7.82 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 339 | rx-844L | R6:5301 | 9 | wheel 20 px (+ one-shot synthetic hold) | release@6471; older left [5965, 8016] | 19:36:29→19:36:48 | 8.61→7.59 | OK |  |  |
| 340 | rx-844L | R5:5302 | 9 | wheel 20 px (+ one-shot synthetic hold) | release@7433; older left [6845] | 19:36:42→19:37:02 | 7.82→6.82 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 341 | naturalx-375D | R6:5301 | 0 | wheel 40 px up / 20 px down | wait=1200; top@2077, down@3279; older left [3586, 3586] | 19:37:03→19:37:16 | 6.82→6.4 | OK |  | yes |
| 342 | naturalx-375D | R5:5302 | 0 | wheel 40 px up / 20 px down | wait=1200; top@2483, down@3684; older left [4929, 4929] | 19:37:03→19:37:17 | 6.82→7.01 | OK |  | yes |
| 343 | naturalx-375D | R6:5301 | 1 | wheel 40 px up / 20 px down | wait=1200; top@2064, down@3266; older left [3666, 3666] | 19:37:16→19:37:30 | 6.4→8.27 | OK |  | yes |
| 344 | naturalx-375D | R5:5302 | 1 | wheel 40 px up / 20 px down | wait=1200; top@2412, down@3614; older left [3816, 5266] | 19:37:17→19:37:32 | 7.01→9.69 | OK |  | yes |
| 345 | naturalx-375D | R6:5301 | 2 | wheel 40 px up / 20 px down | wait=1500; top@2106, down@3611; older left [3519, 3519] | 19:37:30→19:37:43 | 8.27→10.85 | OK |  | yes |
| 346 | naturalx-375D | R5:5302 | 2 | wheel 40 px up / 20 px down | wait=1500; top@1948, down@3463; older left [3841, 5382] | 19:37:33→19:37:48 | 9.69→11.58 | OK |  | yes |
| 347 | naturalx-375D | R6:5301 | 3 | wheel 40 px up / 20 px down | wait=1500; top@2095, down@3598; older left [3493, 3493] | 19:37:43→19:37:58 | 10.85→12.67 | OK |  | yes |
| 348 | naturalx-375D | R5:5302 | 3 | wheel 40 px up / 20 px down | wait=1500; top@2169, down@3674; older left [3904, 5366] | 19:37:48→19:38:03 | 11.58→12.61 | OK |  | yes |
| 349 | racex-375D | R5:5302 | 0 | wheel 20 px (+ one-shot synthetic hold) | release@7356; older left [6579] | 19:38:04→19:38:24 | 12.61→13.64 | OK | **D1:** below room, over dock/control | yes |
| 350 | racex-375D | R6:5301 | 0 | wheel 20 px (+ one-shot synthetic hold) | release@6485; older left [8023] | 19:38:04→19:38:25 | 12.61→13.64 | OK |  | yes |
| 351 | racex-375D | R5:5302 | 1 | wheel 20 px (+ one-shot synthetic hold) | release@7003; older left [6504] | 19:38:24→19:38:44 | 13.64→13.98 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control | yes |
| 352 | racex-375D | R6:5301 | 1 | wheel 20 px (+ one-shot synthetic hold) | release@6057; older left [7731] | 19:38:25→19:38:46 | 13.64→13.98 | OK |  | yes |
| 353 | racex-375D | R5:5302 | 2 | wheel 20 px (+ one-shot synthetic hold) | release@7185; older left [6457] | 19:38:44→19:39:05 | 13.98→14.31 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control | yes |
| 354 | racex-375D | R6:5301 | 2 | wheel 20 px (+ one-shot synthetic hold) | release@6288; older left [7885] | 19:38:47→19:39:08 | 14.94→14.6 | OK |  | yes |
| 355 | racex-375D | R5:5302 | 3 | wheel 20 px (+ one-shot synthetic hold) | release@7149; older left [6606] | 19:39:05→19:39:26 | 14.31→15.0 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control | yes |
| 356 | racex-375D | R6:5301 | 3 | wheel 20 px (+ one-shot synthetic hold) | release@6442; older left [8054] | 19:39:08→19:39:29 | 14.6→14.04 | OK |  | yes |
| 357 | naturalx-844L | R6:5301 | 0 | wheel 40 px up / 20 px down | wait=1200; top@2127, down@3333; older left [3563, 4100] | 19:39:29→19:39:43 | 14.04→13.98 | OK |  | yes |
| 358 | naturalx-844L | R5:5302 | 0 | wheel 40 px up / 20 px down | wait=1200; top@2009, down@3220; older left [4132, 5197] | 19:39:29→19:39:44 | 14.04→13.98 | OK |  | yes |
| 359 | naturalx-844L | R6:5301 | 1 | wheel 40 px up / 20 px down | wait=1200; top@3328, down@4536; older left [3604, 4717] | 19:39:43→19:39:57 | 13.98→14.89 | OK |  | yes |
| 360 | naturalx-844L | R5:5302 | 1 | wheel 40 px up / 20 px down | wait=1200; top@2421, down@3668; older left [3681, 4142] | 19:39:44→19:39:59 | 13.98→14.89 | FAIL | [entry-flicker x2] | yes |
| 361 | naturalx-844L | R6:5301 | 2 | wheel 40 px up / 20 px down | wait=1500; top@2223, down@3738; older left [3522, 4026] | 19:39:58→19:40:11 | 14.89→15.59 | OK |  | yes |
| 362 | naturalx-844L | R5:5302 | 2 | wheel 40 px up / 20 px down | wait=1500; top@2088, down@3590; older left [3685, 5617] | 19:39:59→19:40:16 | 14.89→17.3 | OK |  | yes |
| 363 | naturalx-844L | R6:5301 | 3 | wheel 40 px up / 20 px down | wait=1500; top@2501, down@4064; older left [3649, 4459] | 19:40:12→19:40:26 | 15.59→16.78 | OK |  | yes |
| 364 | naturalx-844L | R5:5302 | 3 | wheel 40 px up / 20 px down | wait=1500; top@2013, down@3528; older left [3693, 5510] | 19:40:16→19:40:32 | 17.3→16.14 | OK |  | yes |
| 365 | racex-844L | R6:5301 | 0 | wheel 20 px (+ one-shot synthetic hold) | release@7213; older left [6700, 8724] | 19:40:32→19:40:54 | 16.14→16.65 | OK |  | yes |
| 366 | racex-844L | R5:5302 | 0 | wheel 20 px (+ one-shot synthetic hold) | release@8372; older left [7252] | 19:40:32→19:40:54 | 16.14→16.65 | OK |  | yes |
| 367 | racex-844L | R6:5301 | 1 | wheel 20 px (+ one-shot synthetic hold) | release@7260; older left [6546, 8819] | 19:40:54→19:41:14 | 16.65→16.71 | OK |  | yes |
| 368 | racex-844L | R5:5302 | 1 | wheel 20 px (+ one-shot synthetic hold) | release@8450; older left [7087] | 19:40:54→19:41:17 | 16.65→16.71 | OK | **D1:** faded/absent, below room, over dock/control | yes |
| 369 | racex-844L | R6:5301 | 2 | wheel 20 px (+ one-shot synthetic hold) | release@7332; older left [6795, 8960] | 19:41:14→19:41:34 | 16.71→16.53 | OK |  | yes |
| 370 | racex-844L | R5:5302 | 2 | wheel 20 px (+ one-shot synthetic hold) | release@8239; older left [7560, 10176] | 19:41:17→19:41:39 | 16.98→16.73 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control | yes |
| 371 | racex-844L | R6:5301 | 3 | wheel 20 px (+ one-shot synthetic hold) | release@7886; older left [6880, 9543] | 19:41:35→19:41:56 | 16.53→16.81 | OK |  | yes |
| 372 | racex-844L | R5:5302 | 3 | wheel 20 px (+ one-shot synthetic hold) | release@8448; older left [7496] | 19:41:39→19:42:01 | 16.73→16.03 | OK | **D1:** hide/reset, faded/absent, below room, over dock/control | yes |
| 373 | repro6-375L | R6:5301 | 0 | wheel | before d=3600; gesture 3885–5551 (8 strokes); warn@280; older left [3565, 3565] | 19:42:02→19:42:16 | 16.03→15.6 | OK |  |  |
| 374 | repro6-375L | R6:5301 | 1 | touch | before d=3600; gesture 3913–8032 (12 strokes); warn@229; older left [3539, 3539] | 19:42:16→19:42:32 | 15.6→15.43 | OK |  |  |
| 375 | repro6-375L | R6:5301 | 2 | wheel | before d=4200; gesture 4655–6287 (8 strokes); warn@445; older left [3554, 3554] | 19:42:32→19:42:48 | 15.43→14.25 | OK |  |  |
| 376 | repro6-375L | R6:5301 | 3 | touch | before d=4200; gesture 4428–7719 (11 strokes); warn@224; older left [3543, 3543] | 19:42:48→19:43:04 | 14.25→14.39 | OK |  |  |
| 377 | repro6-375L | R6:5301 | 4 | wheel | before d=4800; gesture 5124–6981 (8 strokes); warn@301; older left [3528, 3528] | 19:43:05→19:43:21 | 14.39→16.16 | OK |  |  |
| 378 | repro6-375L | R6:5301 | 5 | touch | before d=4800; gesture 5154–8575 (11 strokes); warn@329; older left [3513, 3513] | 19:43:21→19:43:39 | 16.16→15.86 | OK |  |  |
| 379 | repro6-375L | R6:5301 | 6 | wheel | during d=1000; gesture 1926–6441 (22 strokes); warn@900; older left [4507, 6088] | 19:43:39→19:43:55 | 15.86→16.12 | OK |  |  |
| 380 | repro6-375L | R6:5301 | 7 | touch | during d=1000; gesture 1423–6053 (13 strokes); warn@408; older left [3665, 3665] | 19:43:55→19:44:10 | 16.12→16.07 | OK |  |  |
| 381 | repro6-375L | R6:5301 | 8 | wheel | during d=1600; gesture 1815–5711 (19 strokes); warn@197; older left [4046, 5390] | 19:44:10→19:44:25 | 16.07→16.82 | OK |  |  |
| 382 | repro6-375L | R6:5301 | 9 | touch | during d=1600; gesture 1863–6324 (14 strokes); warn@257; older left [3680, 3680] | 19:44:25→19:44:41 | 16.82→17.23 | OK |  |  |
| 383 | repro6-375L | R6:5301 | 10 | wheel | during d=2200; gesture 2421–5018 (12 strokes); warn@213; older left [3500, 4749] | 19:44:41→19:44:55 | 17.23→16.37 | OK |  |  |
| 384 | repro6-375L | R6:5301 | 11 | touch | during d=2200; gesture 2537–6793 (12 strokes); warn@322; older left [3630, 3630] | 19:44:55→19:45:11 | 16.37→16.47 | OK |  |  |
| 385 | repro6-375L | R6:5301 | 12 | wheel | during d=2800; gesture 3020–5010 (8 strokes); warn@212; older left [3510, 3510] | 19:45:11→19:45:26 | 16.47→17.15 | OK |  |  |
| 386 | repro6-375L | R6:5301 | 13 | touch | during d=2800; gesture 3178–7126 (12 strokes); warn@370; older left [3598, 3598] | 19:45:26→19:45:42 | 17.15→16.69 | OK |  |  |
| 387 | repro6-375L | R6:5301 | 14 | wheel | after d=300; gesture 689–2720 (8 strokes); warn@383; older left [3602, 4081] | 19:45:42→19:45:54 | 16.69→16.26 | OK |  |  |
| 388 | repro6-375L | R6:5301 | 15 | touch | after d=300; gesture 576–3320 (8 strokes); warn@256; older left [3646, 3646] | 19:45:54→19:46:06 | 16.26→17.86 | OK |  |  |
| 389 | repro6-375L | R6:5301 | 16 | wheel | after d=600; gesture 829–2657 (8 strokes); warn@224; older left [3479, 3935] | 19:46:06→19:46:17 | 17.86→16.79 | OK |  |  |
| 390 | repro6-375L | R6:5301 | 17 | touch | after d=600; gesture 931–3437 (8 strokes); warn@326; older left [3581, 3581] | 19:46:17→19:46:29 | 16.79→15.75 | OK |  |  |
| 391 | repro6-375L | R6:5301 | 18 | wheel | after d=900; gesture 1432–3082 (8 strokes); warn@528; older left [3580, 4030] | 19:46:29→19:46:41 | 15.75→17.32 | OK |  |  |
| 392 | repro6-375L | R6:5301 | 19 | touch | after d=900; gesture 1204–3751 (8 strokes); warn@291; older left [3619, 3619] | 19:46:41→19:46:53 | 17.32→17.11 | OK |  |  |
| 393 | gfling-375L | R6:5301 | 0 | touch fling (CDP) | before d=3600; gesture 3957–6576 (6 strokes); warn@284; older left [3580, 3580] | 19:47:20→19:47:36 | 14.98→15.56 | OK |  |  |
| 394 | gfling-375L | R5:5302 | 0 | touch fling (CDP) | before d=3600; gesture 3964–6731 (6 strokes); warn@356; older left [3610, 3610] | 19:47:20→19:47:36 | 14.98→15.56 | FAIL |  |  |
| 395 | gfling-375L | R6:5301 | 1 | touch fling (CDP) | before d=4200; gesture 4412–6937 (6 strokes); warn@207; older left [3480, 3480] | 19:47:36→19:47:53 | 15.56→14.42 | OK |  |  |
| 396 | gfling-375L | R5:5302 | 1 | touch fling (CDP) | before d=4200; gesture 4445–7196 (6 strokes); warn@239; older left [3496, 3496] | 19:47:36→19:47:53 | 15.56→14.42 | FAIL |  |  |
| 397 | gfling-375L | R6:5301 | 2 | touch fling (CDP) | before d=4800; gesture 5169–7939 (6 strokes); warn@363; older left [3520, 3520] | 19:47:53→19:48:11 | 14.42→16.12 | OK |  |  |
| 398 | gfling-375L | R5:5302 | 2 | touch fling (CDP) | before d=4800; gesture 5136–7698 (6 strokes); warn@331; older left [3630, 3630] | 19:47:54→19:48:11 | 14.42→16.12 | OK |  |  |
| 399 | gfling-375L | R6:5301 | 3 | touch fling (CDP) | during d=1000; gesture 1345–4939 (7 strokes); warn@338; older left [3669, 3669] | 19:48:11→19:48:27 | 16.12→14.94 | OK |  |  |
| 400 | gfling-375L | R5:5302 | 3 | touch fling (CDP) | during d=1000; gesture 1559–6299 (9 strokes); warn@549; older left [3480, 3480] | 19:48:11→19:48:28 | 16.12→14.63 | FAIL |  |  |
| 401 | gfling-375L | R6:5301 | 4 | touch fling (CDP) | during d=1600; gesture 1891–6340 (9 strokes); warn@285; older left [3611, 3611] | 19:48:27→19:48:42 | 14.94→15.13 | OK |  |  |
| 402 | gfling-375L | R5:5302 | 4 | touch fling (CDP) | during d=1600; gesture 1866–5854 (9 strokes); warn@255; older left [3515, 3515] | 19:48:28→19:48:44 | 14.63→15.13 | FAIL | [entry-flicker x1] |  |
| 403 | gfling-375L | R6:5301 | 5 | touch fling (CDP) | during d=2200; gesture 2764–5638 (6 strokes); warn@555; older left [3557, 3557] | 19:48:42→19:48:57 | 15.13→14.23 | OK |  |  |
| 404 | gfling-375L | R5:5302 | 5 | touch fling (CDP) | during d=2200; gesture 2508–6169 (8 strokes); warn@295; older left [3495, 3495] | 19:48:44→19:49:00 | 15.13→14.23 | FAIL |  |  |
| 405 | gfling-375L | R6:5301 | 6 | touch fling (CDP) | during d=2800; gesture 3204–6318 (6 strokes); warn@397; older left [3616, 3616] | 19:48:57→19:49:13 | 14.23→14.92 | FAIL |  |  |
| 406 | gfling-375L | R5:5302 | 6 | touch fling (CDP) | during d=2800; gesture 3084–5798 (6 strokes); warn@278; older left [3483, 3483] | 19:49:00→19:49:15 | 14.23→14.92 | FAIL |  |  |
| 407 | gfling-375L | R6:5301 | 7 | touch fling (CDP) | after d=300; gesture 731–4917 (7 strokes); warn@416; older left [3686, 3686] | 19:49:13→19:49:26 | 14.92→14.08 | OK |  |  |
| 408 | gfling-375L | R5:5302 | 7 | touch fling (CDP) | after d=300; gesture 754–4768 (7 strokes); warn@428; older left [3608, 3609] | 19:49:15→19:49:30 | 14.92→13.75 | FAIL |  |  |
| 409 | gfling-375L | R6:5301 | 8 | touch fling (CDP) | after d=600; gesture 1092–4789 (7 strokes); warn@487; older left [3690, 3690] | 19:49:26→19:49:40 | 14.08→14.59 | OK |  |  |
| 410 | gfling-375L | R5:5302 | 8 | touch fling (CDP) | after d=600; gesture 831–5116 (7 strokes); warn@218; older left [3529, 3529] | 19:49:30→19:49:45 | 13.75→14.46 | OK |  |  |
| 411 | gfling-375L | R6:5301 | 9 | touch fling (CDP) | after d=900; gesture 1181–5353 (7 strokes); warn@268; older left [3683, 3683] | 19:49:40→19:49:54 | 14.59→14.0 | OK |  |  |
| 412 | gfling-375L | R5:5302 | 9 | touch fling (CDP) | after d=900; gesture 1213–4956 (7 strokes); warn@307; older left [3579, 3579] | 19:49:45→19:49:59 | 14.46→13.12 | OK |  |  |
| 413 | gfine-375L | R5:5302 | 0 | fine wheel 2-5 px | before d=3600; gesture 3992–6910 (6 strokes); warn@379; older left [3554, 3554] | 19:50:00→19:50:16 | 13.12→15.23 | FAIL | **D1:** below room |  |
| 414 | gfine-375L | R6:5301 | 0 | fine wheel 2-5 px | before d=3600; gesture 3969–7049 (6 strokes); warn@361; older left [3568, 3568] | 19:50:00→19:50:17 | 13.12→15.23 | OK |  |  |
| 415 | gfine-375L | R5:5302 | 1 | fine wheel 2-5 px | before d=4200; gesture 4426–7386 (6 strokes); warn@219; older left [3499, 3499] | 19:50:16→19:50:34 | 15.23→14.78 | FAIL |  |  |
| 416 | gfine-375L | R6:5301 | 1 | fine wheel 2-5 px | before d=4200; gesture 4652–7589 (6 strokes); warn@426; older left [3540, 3540] | 19:50:17→19:50:34 | 15.23→14.78 | OK |  |  |
| 417 | gfine-375L | R5:5302 | 2 | fine wheel 2-5 px | before d=4800; gesture 5000–7893 (6 strokes); warn@195; older left [3485, 3485] | 19:50:34→19:50:51 | 14.78→15.54 | FAIL |  |  |
| 418 | gfine-375L | R6:5301 | 2 | fine wheel 2-5 px | before d=4800; gesture 5160–8049 (6 strokes); warn@355; older left [3525, 3525] | 19:50:34→19:50:52 | 14.78→15.1 | OK |  |  |
| 419 | gfine-375L | R5:5302 | 3 | fine wheel 2-5 px | during d=1000; gesture 1236–4689 (6 strokes); warn@229; older left [3520, 3520] | 19:50:51→19:51:05 | 15.54→14.35 | FAIL |  |  |
| 420 | gfine-375L | R6:5301 | 3 | fine wheel 2-5 px | during d=1000; gesture 1211–6716 (10 strokes); warn@204; older left [3665, 3665] | 19:50:52→19:51:09 | 15.1→14.41 | OK |  |  |
| 421 | gfine-375L | R5:5302 | 4 | fine wheel 2-5 px | during d=1600; gesture 1956–6625 (8 strokes); warn@314; older left [3622, 3622] | 19:51:05→19:51:20 | 14.35→13.3 | FAIL |  |  |
| 422 | gfine-375L | R6:5301 | 4 | fine wheel 2-5 px | during d=1600; gesture 2034–6617 (9 strokes); warn@429; older left [3687, 3687] | 19:51:09→19:51:25 | 14.41→12.72 | OK |  |  |
| 423 | gfine-375L | R5:5302 | 5 | fine wheel 2-5 px | during d=2200; gesture 2432–6386 (7 strokes); warn@228; older left [3502, 3502] | 19:51:20→19:51:35 | 13.3→11.66 | FAIL |  |  |
| 424 | gfine-375L | R6:5301 | 5 | fine wheel 2-5 px | during d=2200; gesture 2406–6391 (8 strokes); warn@200; older left [3475, 3475] | 19:51:25→19:51:40 | 12.72→11.45 | OK |  |  |
| 425 | gfine-375L | R5:5302 | 6 | fine wheel 2-5 px | during d=2800; gesture 3002–6201 (6 strokes); warn@197; older left [3512, 3512] | 19:51:35→19:51:49 | 11.66→11.26 | FAIL |  |  |
| 426 | gfine-375L | R6:5301 | 6 | fine wheel 2-5 px | during d=2800; gesture 2980–6173 (6 strokes); warn@172; older left [3568, 3568] | 19:51:40→19:51:56 | 11.45→11.16 | OK |  |  |
| 427 | gfine-375L | R5:5302 | 7 | fine wheel 2-5 px | after d=300; gesture 546–4734 (6 strokes); warn@229; older left [3479, 3479] | 19:51:49→19:52:03 | 11.26→11.34 | FAIL |  |  |
| 428 | gfine-375L | R6:5301 | 7 | fine wheel 2-5 px | after d=300; gesture 598–5344 (8 strokes); warn@293; older left [3509, 4358] | 19:51:56→19:52:10 | 11.16→10.75 | OK |  |  |
| 429 | gfine-375L | R5:5302 | 8 | fine wheel 2-5 px | after d=600; gesture 862–4984 (6 strokes); warn@258; older left [3595, 3595] | 19:52:03→19:52:16 | 11.34→11.25 | FAIL |  |  |
| 430 | gfine-375L | R6:5301 | 8 | fine wheel 2-5 px | after d=600; gesture 955–4840 (7 strokes); warn@267; older left [3814, 3814] | 19:52:10→19:52:24 | 10.75→10.65 | OK |  |  |
| 431 | gfine-375L | R5:5302 | 9 | fine wheel 2-5 px | after d=900; gesture 1094–4282 (6 strokes); warn@187; older left [3479, 3479] | 19:52:16→19:52:30 | 11.25→10.92 | FAIL | [entry-flicker x1] |  |
| 432 | gfine-375L | R6:5301 | 9 | fine wheel 2-5 px | after d=900; gesture 1232–4804 (7 strokes); warn@324; older left [3738, 3738] | 19:52:24→19:52:38 | 10.65→9.9 | OK |  |  |
| 433 | repro6-375D | R6:5301 | 0 | wheel | before d=3600; gesture 3898–5507 (8 strokes); warn@290; older left [3529, 3529] | 19:52:39→19:52:52 | 9.9→9.87 | OK |  |  |
| 434 | repro6-375D | R6:5301 | 1 | touch | before d=3600; gesture 3827–7321 (12 strokes); warn@222; older left [3508, 3508] | 19:52:52→19:53:08 | 9.32→8.22 | OK |  |  |
| 435 | repro6-375D | R6:5301 | 2 | wheel | before d=4200; gesture 4476–6070 (8 strokes); warn@270; older left [3484, 3484] | 19:53:08→19:53:23 | 8.22→6.81 | OK |  |  |
| 436 | repro6-375D | R6:5301 | 3 | touch | before d=4200; gesture 4487–7947 (12 strokes); warn@282; older left [3485, 3485] | 19:53:23→19:53:39 | 6.81→7.14 | OK |  |  |
| 437 | repro6-375D | R6:5301 | 4 | wheel | before d=4800; gesture 5046–6637 (8 strokes); warn@239; older left [3500, 3500] | 19:53:39→19:53:53 | 7.14→7.18 | OK |  |  |
| 438 | repro6-375D | R6:5301 | 5 | touch | before d=4800; gesture 5116–8563 (12 strokes); warn@310; older left [3486, 3486] | 19:53:53→19:54:10 | 7.18→6.72 | OK |  |  |
| 439 | repro6-375D | R6:5301 | 6 | wheel | during d=1000; gesture 1272–5337 (21 strokes); warn@235; older left [4051, 5048] | 19:54:10→19:54:24 | 6.72→7.0 | OK |  |  |
| 440 | repro6-375D | R6:5301 | 7 | touch | during d=1000; gesture 1283–6027 (16 strokes); warn@249; older left [3481, 3481] | 19:54:24→19:54:39 | 7.0→7.59 | OK |  |  |
| 441 | repro6-375D | R6:5301 | 8 | wheel | during d=1600; gesture 1940–5862 (18 strokes); warn@332; older left [4180, 5541] | 19:54:39→19:54:53 | 7.59→7.49 | OK |  |  |
| 442 | repro6-375D | R6:5301 | 9 | touch | during d=1600; gesture 1857–6221 (14 strokes); warn@247; older left [3756, 3756] | 19:54:53→19:55:07 | 7.49→8.73 | OK |  |  |
| 443 | repro6-375D | R6:5301 | 10 | wheel | during d=2200; gesture 2475–5017 (12 strokes); warn@253; older left [3503, 4815] | 19:55:07→19:55:20 | 8.73→9.46 | OK |  |  |
| 444 | repro6-375D | R6:5301 | 11 | touch | during d=2200; gesture 2508–6309 (12 strokes); warn@270; older left [3645, 3645] | 19:55:20→19:55:35 | 9.46→10.8 | OK |  |  |
| 445 | repro6-375D | R6:5301 | 12 | wheel | during d=2800; gesture 3289–4909 (8 strokes); warn@405; older left [3610, 3610] | 19:55:35→19:55:49 | 10.8→9.93 | OK |  |  |
| 446 | repro6-375D | R6:5301 | 13 | touch | during d=2800; gesture 3051–6644 (11 strokes); warn@247; older left [3581, 3581] | 19:55:49→19:56:05 | 9.93→10.96 | OK |  |  |
| 447 | repro6-375D | R6:5301 | 14 | wheel | after d=300; gesture 668–2569 (8 strokes); warn@338; older left [3495, 3959] | 19:56:05→19:56:16 | 10.96→12.57 | OK |  |  |
| 448 | repro6-375D | R6:5301 | 15 | touch | after d=300; gesture 609–3463 (8 strokes); warn@265; older left [3544, 3544] | 19:56:16→19:56:28 | 12.57→13.73 | OK |  |  |
| 449 | repro6-375D | R6:5301 | 16 | wheel | after d=600; gesture 1089–2699 (8 strokes); warn@481; older left [3481, 3947] | 19:56:28→19:56:40 | 13.73→13.53 | OK |  |  |
| 450 | repro6-375D | R6:5301 | 17 | touch | after d=600; gesture 948–3599 (8 strokes); warn@309; older left [3736, 3736] | 19:56:40→19:56:52 | 13.53→13.76 | OK |  |  |
| 451 | repro6-375D | R6:5301 | 18 | wheel | after d=900; gesture 1093–2763 (8 strokes); warn@188; older left [3490, 3922] | 19:56:52→19:57:04 | 13.76→13.94 | OK |  |  |
| 452 | repro6-375D | R6:5301 | 19 | touch | after d=900; gesture 1260–3797 (8 strokes); warn@352; older left [3549, 3549] | 19:57:04→19:57:17 | 13.94→14.24 | OK |  |  |
| 453 | gfling-375D | R6:5301 | 0 | touch fling (CDP) | before d=3600; gesture 3855–6501 (6 strokes); warn@249; older left [3547, 3547] | 19:57:20→19:57:36 | 13.98→14.89 | OK |  |  |
| 454 | gfling-375D | R5:5302 | 0 | touch fling (CDP) | before d=3600; gesture 3881–6590 (6 strokes); warn@275; older left [3468, 3468] | 19:57:20→19:57:36 | 13.98→14.89 | FAIL |  |  |
| 455 | gfling-375D | R5:5302 | 1 | touch fling (CDP) | before d=4200; gesture 4540–7099 (6 strokes); warn@332; older left [3530, 3530] | 19:57:36→19:57:53 | 14.89→13.83 | FAIL |  |  |
| 456 | gfling-375D | R6:5301 | 1 | touch fling (CDP) | before d=4200; gesture 4539–7239 (6 strokes); warn@329; older left [3633, 3633] | 19:57:36→19:57:53 | 14.89→13.83 | OK |  |  |
| 457 | gfling-375D | R5:5302 | 2 | touch fling (CDP) | before d=4800; gesture 5046–7730 (6 strokes); warn@241; older left [3526, 3526] | 19:57:53→19:58:10 | 13.83→13.51 | OK |  |  |
| 458 | gfling-375D | R6:5301 | 2 | touch fling (CDP) | before d=4800; gesture 5091–8033 (6 strokes); warn@284; older left [3482, 3482] | 19:57:53→19:58:11 | 13.83→13.51 | OK |  |  |
| 459 | gfling-375D | R5:5302 | 3 | touch fling (CDP) | during d=1000; gesture 1565–6149 (9 strokes); warn@507; older left [3662, 3662] | 19:58:10→19:58:25 | 13.51→13.9 | FAIL |  |  |
| 460 | gfling-375D | R6:5301 | 3 | touch fling (CDP) | during d=1000; gesture 1408–4818 (7 strokes); warn@400; older left [3569, 3569] | 19:58:11→19:58:26 | 13.51→13.9 | OK |  |  |
| 461 | gfling-375D | R5:5302 | 4 | touch fling (CDP) | during d=1600; gesture 2160–6263 (9 strokes); warn@555; older left [3593, 3593] | 19:58:25→19:58:41 | 13.9→14.62 | FAIL |  |  |
| 462 | gfling-375D | R6:5301 | 4 | touch fling (CDP) | during d=1600; gesture 2200–6054 (8 strokes); warn@561; older left [3621, 3621] | 19:58:26→19:58:41 | 13.9→14.62 | OK |  |  |
| 463 | gfling-375D | R5:5302 | 5 | touch fling (CDP) | during d=2200; gesture 2539–6375 (8 strokes); warn@333; older left [3632, 3632] | 19:58:41→19:58:57 | 14.62→14.87 | FAIL |  |  |
| 464 | gfling-375D | R6:5301 | 5 | touch fling (CDP) | during d=2200; gesture 2466–6354 (8 strokes); warn@258; older left [3693, 3693] | 19:58:41→19:58:58 | 14.62→14.16 | OK |  |  |
| 465 | gfling-375D | R5:5302 | 6 | touch fling (CDP) | during d=2800; gesture 2990–5725 (6 strokes); warn@186; older left [3509, 3509] | 19:58:57→19:59:13 | 14.87→12.79 | FAIL |  |  |
| 466 | gfling-375D | R6:5301 | 6 | touch fling (CDP) | during d=2800; gesture 3143–6195 (6 strokes); warn@327; older left [3569, 3569] | 19:58:58→19:59:14 | 14.16→12.79 | OK |  |  |
| 467 | gfling-375D | R5:5302 | 7 | touch fling (CDP) | after d=300; gesture 692–4970 (7 strokes); warn@368; older left [3582, 3582] | 19:59:13→19:59:27 | 12.79→12.47 | FAIL |  |  |
| 468 | gfling-375D | R6:5301 | 7 | touch fling (CDP) | after d=300; gesture 710–4582 (7 strokes); warn@367; older left [3564, 3564] | 19:59:14→19:59:28 | 12.79→12.03 | OK |  |  |
| 469 | gfling-375D | R5:5302 | 8 | touch fling (CDP) | after d=600; gesture 925–4916 (7 strokes); warn@321; older left [3520, 3520] | 19:59:27→19:59:41 | 12.47→12.49 | FAIL |  |  |
| 470 | gfling-375D | R6:5301 | 8 | touch fling (CDP) | after d=600; gesture 1080–4790 (7 strokes); warn@472; older left [3842, 3842] | 19:59:28→19:59:43 | 12.03→11.49 | OK |  |  |
| 471 | gfling-375D | R5:5302 | 9 | touch fling (CDP) | after d=900; gesture 1144–5336 (7 strokes); warn@214; older left [3480, 3480] | 19:59:41→19:59:56 | 12.49→11.45 | FAIL |  |  |
| 472 | gfling-375D | R6:5301 | 9 | touch fling (CDP) | after d=900; gesture 1106–4611 (7 strokes); warn@202; older left [3549, 3549] | 19:59:43→19:59:57 | 11.49→11.45 | OK |  |  |
| 473 | gfine-375D | R6:5301 | 0 | fine wheel 2-5 px | before d=3600; gesture 3886–6840 (6 strokes); warn@279; older left [3574, 3574] | 19:59:58→20:00:14 | 11.01→9.8 | OK |  |  |
| 474 | gfine-375D | R5:5302 | 0 | fine wheel 2-5 px | before d=3600; gesture 3817–6857 (6 strokes); warn@204; older left [3503, 3503] | 19:59:58→20:00:14 | 11.01→9.8 | FAIL |  |  |
| 475 | gfine-375D | R5:5302 | 1 | fine wheel 2-5 px | before d=4200; gesture 4410–7383 (6 strokes); warn@201; older left [3488, 3488] | 20:00:14→20:00:31 | 9.8→10.38 | FAIL |  |  |
| 476 | gfine-375D | R6:5301 | 1 | fine wheel 2-5 px | before d=4200; gesture 4476–7354 (6 strokes); warn@271; older left [3508, 3508] | 20:00:14→20:00:32 | 9.8→10.38 | OK |  |  |
| 477 | gfine-375D | R5:5302 | 2 | fine wheel 2-5 px | before d=4800; gesture 5015–7941 (6 strokes); warn@207; older left [3494, 3494] | 20:00:31→20:00:49 | 10.38→10.46 | FAIL |  |  |
| 478 | gfine-375D | R6:5301 | 2 | fine wheel 2-5 px | before d=4800; gesture 5076–7960 (6 strokes); warn@254; older left [3498, 3498] | 20:00:32→20:00:49 | 10.38→10.46 | OK |  |  |
| 479 | gfine-375D | R5:5302 | 3 | fine wheel 2-5 px | during d=1000; gesture 1323–4652 (6 strokes); warn@308; older left [3535, 3535] | 20:00:49→20:01:02 | 10.46→10.37 | FAIL |  |  |
| 480 | gfine-375D | R6:5301 | 3 | fine wheel 2-5 px | during d=1000; gesture 1446–6711 (10 strokes); warn@432; older left [3705, 5772] | 20:00:49→20:01:06 | 10.46→9.78 | OK |  |  |
| 481 | gfine-375D | R5:5302 | 4 | fine wheel 2-5 px | during d=1600; gesture 1921–4910 (6 strokes); warn@312; older left [3562, 3562] | 20:01:02→20:01:16 | 10.37→10.25 | FAIL |  |  |
| 482 | gfine-375D | R6:5301 | 4 | fine wheel 2-5 px | during d=1600; gesture 1966–7098 (9 strokes); warn@361; older left [3674, 3674] | 20:01:06→20:01:22 | 9.78→10.71 | OK |  |  |
| 483 | gfine-375D | R5:5302 | 5 | fine wheel 2-5 px | during d=2200; gesture 2492–6620 (8 strokes); warn@266; older left [3533, 3533] | 20:01:16→20:01:31 | 10.25→11.99 | FAIL |  |  |
| 484 | gfine-375D | R6:5301 | 5 | fine wheel 2-5 px | during d=2200; gesture 2392–6179 (7 strokes); warn@185; older left [3613, 3613] | 20:01:22→20:01:38 | 10.71→11.25 | OK |  |  |
| 485 | gfine-375D | R5:5302 | 6 | fine wheel 2-5 px | during d=2800; gesture 3060–6202 (6 strokes); warn@256; older left [3512, 3512] | 20:01:31→20:01:46 | 11.99→11.23 | FAIL |  |  |
| 486 | gfine-375D | R6:5301 | 6 | fine wheel 2-5 px | during d=2800; gesture 3116–6434 (6 strokes); warn@306; older left [3548, 3548] | 20:01:38→20:01:54 | 11.25→10.26 | OK |  |  |
| 487 | gfine-375D | R5:5302 | 7 | fine wheel 2-5 px | after d=300; gesture 537–4433 (6 strokes); warn@232; older left [3479, 3479] | 20:01:46→20:01:59 | 11.23→9.44 | FAIL |  |  |
| 488 | gfine-375D | R6:5301 | 7 | fine wheel 2-5 px | after d=300; gesture 615–5629 (8 strokes); warn@310; older left [3564, 4665] | 20:01:54→20:02:08 | 10.26→8.43 | OK |  |  |
| 489 | gfine-375D | R5:5302 | 8 | fine wheel 2-5 px | after d=600; gesture 839–4238 (6 strokes); warn@234; older left [3509, 3509] | 20:01:59→20:02:12 | 9.44→8.43 | FAIL | [entry-flicker x1] |  |
| 490 | gfine-375D | R6:5301 | 8 | fine wheel 2-5 px | after d=600; gesture 891–4894 (7 strokes); warn@260; older left [3786, 3786] | 20:02:08→20:02:22 | 8.43→9.5 | OK |  |  |
| 491 | gfine-375D | R5:5302 | 9 | fine wheel 2-5 px | after d=900; gesture 1116–4322 (6 strokes); warn@201; older left [3480, 3480] | 20:02:12→20:02:26 | 8.43→9.78 | FAIL |  |  |
| 492 | gfine-375D | R6:5301 | 9 | fine wheel 2-5 px | after d=900; gesture 1131–4758 (7 strokes); warn@226; older left [3727, 3727] | 20:02:22→20:02:36 | 9.5→9.73 | OK |  |  |
| 493 | repro6-844L | R6:5301 | 0 | wheel | before d=3600; gesture 4002–7254 (16 strokes); warn@355; older left [3540, 3540] | 20:02:37→20:02:52 | 9.73→10.63 | OK |  |  |
| 494 | repro6-844L | R6:5301 | 1 | touch | before d=3600; gesture 3935–12394 (28 strokes); warn@328; older left [3549, 3549] | 20:02:52→20:03:13 | 10.63→9.76 | OK |  |  |
| 495 | repro6-844L | R6:5301 | 2 | wheel | before d=4200; gesture 4531–7703 (16 strokes); warn@321; older left [3548, 3548] | 20:03:13→20:03:30 | 9.76→8.93 | OK |  |  |
| 496 | repro6-844L | R6:5301 | 3 | touch | before d=4200; gesture 4450–12477 (28 strokes); warn@243; older left [3501, 3501] | 20:03:30→20:03:51 | 8.93→8.58 | OK | [own end @14772] |  |
| 497 | repro6-844L | R6:5301 | 4 | wheel | before d=4800; gesture 5041–8111 (16 strokes); warn@204; older left [3509, 3509] | 20:03:51→20:04:08 | 8.58→8.1 | OK |  |  |
| 498 | repro6-844L | R6:5301 | 5 | touch | before d=4800; gesture 5072–13080 (28 strokes); warn@264; older left [3550, 3550] | 20:04:08→20:04:30 | 8.1→7.96 | OK | [own end @14748] |  |
| 499 | repro6-844L | R6:5301 | 6 | wheel | during d=1000; gesture 1218–5613 (23 strokes); warn@215; older left [4020, 4669] | 20:04:30→20:04:44 | 7.96→7.38 | OK |  |  |
| 500 | repro6-844L | R6:5301 | 7 | touch | during d=1000; gesture 1303–9244 (27 strokes); warn@286; older left [3515, 3515] | 20:04:44→20:05:02 | 7.38→7.28 | OK |  |  |
| 501 | repro6-844L | R6:5301 | 8 | wheel | during d=1600; gesture 1861–5737 (20 strokes); warn@252; older left [3473, 4689] | 20:05:02→20:05:16 | 7.28→8.07 | OK |  |  |
| 502 | repro6-844L | R6:5301 | 9 | touch | during d=1600; gesture 1855–9779 (27 strokes); warn@250; older left [3525, 3525] | 20:05:16→20:05:35 | 8.07→7.91 | OK |  |  |
| 503 | repro6-844L | R6:5301 | 10 | wheel | during d=2200; gesture 2493–5569 (16 strokes); warn@289; older left [3535, 3535] | 20:05:35→20:05:48 | 7.91→7.42 | OK |  |  |
| 504 | repro6-844L | R6:5301 | 11 | touch | during d=2200; gesture 2508–10617 (28 strokes); warn@298; older left [3556, 3556] | 20:05:48→20:06:08 | 7.42→6.94 | OK |  |  |
| 505 | repro6-844L | R6:5301 | 12 | wheel | during d=2800; gesture 3084–6247 (16 strokes); warn@279; older left [3492, 3492] | 20:06:08→20:06:23 | 6.94→7.65 | OK |  |  |
| 506 | repro6-844L | R6:5301 | 13 | touch | during d=2800; gesture 3049–11277 (28 strokes); warn@243; older left [3499, 3499] | 20:06:23→20:06:43 | 7.65→8.77 | OK |  |  |
| 507 | repro6-844L | R6:5301 | 14 | wheel | after d=300; gesture 540–2708 (8 strokes); warn@228; older left [3543, 3543] | 20:06:43→20:06:55 | 8.77→9.21 | OK |  |  |
| 508 | repro6-844L | R6:5301 | 15 | touch | after d=300; gesture 711–3773 (8 strokes); warn@359; older left [3561, 3561] | 20:06:55→20:07:08 | 9.21→10.12 | OK |  |  |
| 509 | repro6-844L | R6:5301 | 16 | wheel | after d=600; gesture 870–2687 (8 strokes); warn@261; older left [3510, 3510] | 20:07:08→20:07:19 | 10.12→10.71 | OK |  |  |
| 510 | repro6-844L | R6:5301 | 17 | touch | after d=600; gesture 854–3405 (8 strokes); warn@243; older left [3578, 3578] | 20:07:20→20:07:32 | 10.71→10.51 | OK |  |  |
| 511 | repro6-844L | R6:5301 | 18 | wheel | after d=900; gesture 1095–2759 (8 strokes); warn@192; older left [3473, 3473] | 20:07:32→20:07:44 | 10.51→10.31 | OK |  |  |
| 512 | repro6-844L | R6:5301 | 19 | touch | after d=900; gesture 1216–3795 (8 strokes); warn@312; older left [3569, 3569] | 20:07:44→20:07:56 | 10.31→10.61 | OK |  |  |
| 513 | gfling-844L | R6:5301 | 0 | touch fling (CDP) | before d=3600; gesture 3940–7008 (7 strokes); warn@330; older left [3544, 3544] | 20:08:01→20:08:17 | 10.08→9.38 | FAIL |  |  |
| 514 | gfling-844L | R5:5302 | 0 | touch fling (CDP) | before d=3600; gesture 3832–6427 (6 strokes); warn@224; older left [3496, 3496] | 20:08:01→20:08:16 | 10.08→9.38 | FAIL |  |  |
| 515 | gfling-844L | R5:5302 | 1 | touch fling (CDP) | before d=4200; gesture 4531–7589 (7 strokes); warn@327; older left [3510, 3510] | 20:08:16→20:08:33 | 9.38→10.46 | FAIL |  |  |
| 516 | gfling-844L | R6:5301 | 1 | touch fling (CDP) | before d=4200; gesture 4438–7490 (7 strokes); warn@232; older left [3505, 3505] | 20:08:17→20:08:33 | 9.38→9.94 | OK |  |  |
| 517 | gfling-844L | R5:5302 | 2 | touch fling (CDP) | before d=4800; gesture 5003–10516 (11 strokes); warn@196; older left [3501, 3501] | 20:08:33→20:08:52 | 10.46→11.01 | FAIL | [entry-flicker x1] |  |
| 518 | gfling-844L | R6:5301 | 2 | touch fling (CDP) | before d=4800; gesture 5100–8105 (7 strokes); warn@294; older left [3555, 3555] | 20:08:33→20:08:51 | 9.94→11.01 | OK |  |  |
| 519 | gfling-844L | R6:5301 | 3 | touch fling (CDP) | during d=1000; gesture 1276–5484 (9 strokes); warn@271; older left [3570, 3570] | 20:08:51→20:09:06 | 11.01→10.43 | FAIL |  |  |
| 520 | gfling-844L | R5:5302 | 3 | touch fling (CDP) | during d=1000; gesture 1223–4473 (7 strokes); warn@214; older left [3495, 3495] | 20:08:52→20:09:06 | 11.01→10.43 | FAIL |  |  |
| 521 | gfling-844L | R6:5301 | 4 | touch fling (CDP) | during d=1600; gesture 1989–6062 (9 strokes); warn@381; older left [3524, 3524] | 20:09:06→20:09:21 | 10.43→9.8 | OK |  |  |
| 522 | gfling-844L | R5:5302 | 4 | touch fling (CDP) | during d=1600; gesture 1881–4698 (6 strokes); warn@276; older left [3501, 3501] | 20:09:06→20:09:20 | 10.43→9.8 | FAIL |  |  |
| 523 | gfling-844L | R5:5302 | 5 | touch fling (CDP) | during d=2200; gesture 2672–8199 (11 strokes); warn@466; older left [3548, 3548] | 20:09:20→20:09:38 | 9.8→10.76 | FAIL | [entry-flicker x1] |  |
| 524 | gfling-844L | R6:5301 | 5 | touch fling (CDP) | during d=2200; gesture 2448–5471 (7 strokes); warn@240; older left [3578, 3578] | 20:09:21→20:09:36 | 9.8→10.76 | OK |  |  |
| 525 | gfling-844L | R6:5301 | 6 | touch fling (CDP) | during d=2800; gesture 3036–6047 (7 strokes); warn@230; older left [3488, 3488] | 20:09:36→20:09:51 | 10.76→10.93 | FAIL |  |  |
| 526 | gfling-844L | R5:5302 | 6 | touch fling (CDP) | during d=2800; gesture 2999–6172 (7 strokes); warn@193; older left [3506, 3506] | 20:09:38→20:09:52 | 10.76→10.93 | FAIL | [entry-flicker x1] |  |
| 527 | gfling-844L | R6:5301 | 7 | touch fling (CDP) | after d=300; gesture 510–5134 (8 strokes); warn@201; older left [3853, 3853] | 20:09:51→20:10:04 | 10.93→9.88 | OK |  |  |
| 528 | gfling-844L | R5:5302 | 7 | touch fling (CDP) | after d=300; gesture 493–4422 (7 strokes); warn@185; older left [3476, 3476] | 20:09:52→20:10:06 | 10.93→9.88 | FAIL |  |  |
| 529 | gfling-844L | R6:5301 | 8 | touch fling (CDP) | after d=600; gesture 906–4448 (7 strokes); warn@259; older left [3551, 3551] | 20:10:04→20:10:17 | 9.88→9.49 | OK |  |  |
| 530 | gfling-844L | R5:5302 | 8 | touch fling (CDP) | after d=600; gesture 890–4352 (7 strokes); warn@285; older left [3665, 3665] | 20:10:06→20:10:18 | 9.88→10.09 | FAIL |  |  |
| 531 | gfling-844L | R6:5301 | 9 | touch fling (CDP) | after d=900; gesture 1228–4551 (7 strokes); warn@322; older left [3554, 3554] | 20:10:17→20:10:30 | 9.49→10.05 | OK |  |  |
| 532 | gfling-844L | R5:5302 | 9 | touch fling (CDP) | after d=900; gesture 1214–4550 (7 strokes); warn@307; older left [3535, 3535] | 20:10:19→20:10:32 | 10.09→10.05 | FAIL | [entry-flicker x1] |  |
| 533 | gfine-844L | R5:5302 | 0 | fine wheel 2-5 px | before d=3600; gesture 3827–8806 (10 strokes); warn@220; older left [3503, 3503] | 20:10:33→20:10:51 | 9.49→10.2 | FAIL |  |  |
| 534 | gfine-844L | R6:5301 | 0 | fine wheel 2-5 px | before d=3600; gesture 4000–9021 (10 strokes); warn@355; older left [3503, 3503] | 20:10:33→20:10:51 | 9.49→10.2 | OK |  |  |
| 535 | gfine-844L | R5:5302 | 1 | fine wheel 2-5 px | before d=4200; gesture 4548–9511 (10 strokes); warn@340; older left [3573, 3573] | 20:10:51→20:11:09 | 10.2→9.08 | FAIL |  |  |
| 536 | gfine-844L | R6:5301 | 1 | fine wheel 2-5 px | before d=4200; gesture 4471–9465 (10 strokes); warn@266; older left [3511, 3511] | 20:10:51→20:11:10 | 10.2→9.08 | OK |  |  |
| 537 | gfine-844L | R5:5302 | 2 | fine wheel 2-5 px | before d=4800; gesture 5214–10280 (10 strokes); warn@404; older left [3527, 3527] | 20:11:09→20:11:28 | 9.08→8.07 | FAIL |  |  |
| 538 | gfine-844L | R6:5301 | 2 | fine wheel 2-5 px | before d=4800; gesture 5084–10197 (10 strokes); warn@279; older left [3547, 3547] | 20:11:10→20:11:30 | 9.08→8.07 | OK |  |  |
| 539 | gfine-844L | R5:5302 | 3 | fine wheel 2-5 px | during d=1000; gesture 1373–6864 (10 strokes); warn@294; older left [3511, 3511] | 20:11:29→20:11:45 | 8.07→8.25 | FAIL |  |  |
| 540 | gfine-844L | R6:5301 | 3 | fine wheel 2-5 px | during d=1000; gesture 1322–7501 (12 strokes); warn@318; older left [3604, 3604] | 20:11:30→20:11:47 | 8.07→8.25 | OK |  |  |
| 541 | gfine-844L | R5:5302 | 4 | fine wheel 2-5 px | during d=1600; gesture 1944–7611 (10 strokes); warn@339; older left [3575, 3575] | 20:11:45→20:12:02 | 8.25→9.65 | FAIL | [entry-flicker x1] |  |
| 542 | gfine-844L | R6:5301 | 4 | fine wheel 2-5 px | during d=1600; gesture 1879–7649 (11 strokes); warn@270; older left [3677, 3677] | 20:11:47→20:12:05 | 8.25→9.91 | OK |  |  |
| 543 | gfine-844L | R5:5302 | 5 | fine wheel 2-5 px | during d=2200; gesture 2520–7787 (10 strokes); warn@313; older left [3671, 3671] | 20:12:02→20:12:19 | 9.65→10.06 | FAIL |  |  |
| 544 | gfine-844L | R6:5301 | 5 | fine wheel 2-5 px | during d=2200; gesture 2402–7543 (10 strokes); warn@196; older left [3587, 3587] | 20:12:05→20:12:23 | 9.91→10.06 | OK |  |  |
| 545 | gfine-844L | R5:5302 | 6 | fine wheel 2-5 px | during d=2800; gesture 3181–8582 (10 strokes); warn@347; older left [3514, 3514] | 20:12:19→20:12:37 | 10.06→10.29 | FAIL |  |  |
| 546 | gfine-844L | R6:5301 | 6 | fine wheel 2-5 px | during d=2800; gesture 2980–8140 (10 strokes); warn@173; older left [3552, 3552] | 20:12:23→20:12:41 | 10.06→10.83 | OK |  |  |
| 547 | gfine-844L | R5:5302 | 7 | fine wheel 2-5 px | after d=300; gesture 771–6250 (8 strokes); warn@452; older left [3538, 3538] | 20:12:37→20:12:52 | 10.29→10.69 | FAIL | [entry-flicker x1] |  |
| 548 | gfine-844L | R6:5301 | 7 | fine wheel 2-5 px | after d=300; gesture 600–5564 (8 strokes); warn@272; older left [3522, 4355] | 20:12:41→20:12:56 | 10.83→10.39 | OK |  |  |
| 549 | gfine-844L | R5:5302 | 8 | fine wheel 2-5 px | after d=600; gesture 1117–5840 (8 strokes); warn@420; older left [3504, 3504] | 20:12:52→20:13:07 | 10.69→11.14 | FAIL | [entry-flicker x1] |  |
| 550 | gfine-844L | R6:5301 | 8 | fine wheel 2-5 px | after d=600; gesture 868–5582 (8 strokes); warn@262; older left [3984, 3984] | 20:12:56→20:13:11 | 10.39→11.37 | OK |  |  |
| 551 | gfine-844L | R5:5302 | 9 | fine wheel 2-5 px | after d=900; gesture 1132–5417 (8 strokes); warn@227; older left [3539, 3539] | 20:13:07→20:13:21 | 11.14→10.67 | FAIL | [entry-flicker x1] |  |
| 552 | gfine-844L | R6:5301 | 9 | fine wheel 2-5 px | after d=900; gesture 1187–5191 (8 strokes); warn@281; older left [3562, 3562] | 20:13:11→20:13:25 | 11.37→9.82 | OK |  |  |
| 553 | gkbd-375L | R5:5302 | 0 | keyboard | before d=3600; gesture 3882–6187 (7 strokes); warn@279; older left [3501, 3501] | 20:13:26→20:13:40 | 9.82→8.76 | FAIL |  |  |
| 554 | gkbd-375L | R6:5301 | 0 | keyboard | before d=3600; gesture 3883–6230 (7 strokes); warn@281; older left [3527, 3527] | 20:13:26→20:13:40 | 9.82→8.76 | OK |  |  |
| 555 | gkbd-375L | R5:5302 | 1 | keyboard | before d=4200; gesture 4435–6798 (7 strokes); warn@234; older left [3495, 3495] | 20:13:40→20:13:56 | 8.76→10.09 | FAIL |  |  |
| 556 | gkbd-375L | R6:5301 | 1 | keyboard | before d=4200; gesture 4551–7043 (7 strokes); warn@350; older left [3622, 3622] | 20:13:41→20:13:57 | 8.76→10.09 | OK |  |  |
| 557 | gkbd-375L | R5:5302 | 2 | keyboard | before d=4800; gesture 5083–7397 (7 strokes); warn@281; older left [3561, 3561] | 20:13:56→20:14:12 | 10.09→11.76 | FAIL |  |  |
| 558 | gkbd-375L | R6:5301 | 2 | keyboard | before d=4800; gesture 5032–7401 (7 strokes); warn@230; older left [3506, 3506] | 20:13:57→20:14:15 | 10.09→11.62 | OK |  |  |
| 559 | gkbd-375L | R5:5302 | 3 | keyboard | during d=1000; gesture 1434–4095 (8 strokes); warn@431; older left [3585, 3585] | 20:14:12→20:14:25 | 11.76→11.31 | FAIL |  |  |
| 560 | gkbd-375L | R6:5301 | 3 | keyboard | during d=1000; gesture 1228–3821 (8 strokes); warn@225; older left [3510, 3510] | 20:14:15→20:14:28 | 11.62→11.31 | OK |  |  |
| 561 | gkbd-375L | R5:5302 | 4 | keyboard | during d=1600; gesture 1940–4252 (7 strokes); warn@338; older left [3525, 3525] | 20:14:25→20:14:38 | 11.31→10.55 | FAIL |  |  |
| 562 | gkbd-375L | R6:5301 | 4 | keyboard | during d=1600; gesture 1881–4518 (8 strokes); warn@275; older left [3753, 3753] | 20:14:28→20:14:41 | 11.31→10.42 | OK |  |  |
| 563 | gkbd-375L | R5:5302 | 5 | keyboard | during d=2200; gesture 2463–5358 (9 strokes); warn@261; older left [3582, 3582] | 20:14:38→20:14:51 | 10.55→11.11 | FAIL |  |  |
| 564 | gkbd-375L | R6:5301 | 5 | keyboard | during d=2200; gesture 2500–5336 (8 strokes); warn@296; older left [3533, 3533] | 20:14:41→20:14:55 | 10.42→10.54 | OK |  |  |
| 565 | gkbd-375L | R5:5302 | 6 | keyboard | during d=2800; gesture 3046–5744 (7 strokes); warn@244; older left [3506, 3506] | 20:14:51→20:15:06 | 11.11→10.76 | OK |  |  |
| 566 | gkbd-375L | R6:5301 | 6 | keyboard | during d=2800; gesture 3081–5845 (7 strokes); warn@279; older left [3513, 3513] | 20:14:55→20:15:11 | 10.54→11.58 | OK |  |  |
| 567 | gkbd-375L | R5:5302 | 7 | keyboard | after d=300; gesture 755–4098 (7 strokes); warn@450; older left [3574, 3574] | 20:15:06→20:15:20 | 10.76→12.37 | FAIL |  |  |
| 568 | gkbd-375L | R6:5301 | 7 | keyboard | after d=300; gesture 599–4144 (9 strokes); warn@226; older left [3576, 3576] | 20:15:11→20:15:26 | 11.58→13.62 | OK |  |  |
| 569 | gkbd-375L | R5:5302 | 8 | keyboard | after d=600; gesture 933–4094 (8 strokes); warn@329; older left [3506, 3507] | 20:15:20→20:15:33 | 12.37→14.29 | FAIL |  |  |
| 570 | gkbd-375L | R6:5301 | 8 | keyboard | after d=600; gesture 853–4380 (8 strokes); warn@250; older left [3839, 3839] | 20:15:26→20:15:40 | 13.62→14.09 | OK |  |  |
| 571 | gkbd-375L | R5:5302 | 9 | keyboard | after d=900; gesture 1170–4349 (7 strokes); warn@268; older left [3532, 3532] | 20:15:33→20:15:47 | 14.29→14.97 | FAIL |  |  |
| 572 | gkbd-375L | R6:5301 | 9 | keyboard | after d=900; gesture 1147–3829 (8 strokes); warn@246; older left [3491, 3491] | 20:15:40→20:15:54 | 14.09→14.21 | OK |  |  |
| 573 | gkbd-375D | R6:5301 | 0 | keyboard | before d=3600; gesture 4153–6755 (7 strokes); warn@548; older left [3768, 3768] | 20:15:55→20:16:12 | 14.21→14.88 | OK |  |  |
| 574 | gkbd-375D | R5:5302 | 0 | keyboard | before d=3600; gesture 3895–6355 (7 strokes); warn@292; older left [3558, 3558] | 20:15:55→20:16:12 | 14.21→14.88 | FAIL |  |  |
| 575 | gkbd-375D | R5:5302 | 1 | keyboard | before d=4200; gesture 4416–6909 (7 strokes); warn@214; older left [3527, 3527] | 20:16:12→20:16:29 | 14.88→14.26 | FAIL |  |  |
| 576 | gkbd-375D | R6:5301 | 1 | keyboard | before d=4200; gesture 4545–6976 (7 strokes); warn@334; older left [3553, 3553] | 20:16:12→20:16:29 | 14.88→14.26 | OK |  |  |
| 577 | gkbd-375D | R6:5301 | 2 | keyboard | before d=4800; gesture 5149–7506 (7 strokes); warn@343; older left [3533, 3533] | 20:16:29→20:16:46 | 14.26→13.48 | OK |  |  |
| 578 | gkbd-375D | R5:5302 | 2 | keyboard | before d=4800; gesture 5170–7523 (7 strokes); warn@367; older left [3660, 3660] | 20:16:29→20:16:47 | 14.26→13.48 | FAIL |  |  |
| 579 | gkbd-375D | R6:5301 | 3 | keyboard | during d=1000; gesture 1438–4715 (8 strokes); warn@433; older left [3988, 3988] | 20:16:46→20:17:02 | 13.48→15.65 | OK |  |  |
| 580 | gkbd-375D | R5:5302 | 3 | keyboard | during d=1000; gesture 1263–4151 (7 strokes); warn@261; older left [3491, 3491] | 20:16:47→20:17:01 | 13.48→15.65 | FAIL |  |  |
| 581 | gkbd-375D | R5:5302 | 4 | keyboard | during d=1600; gesture 1876–5147 (9 strokes); warn@274; older left [3523, 3523] | 20:17:01→20:17:16 | 15.65→16.49 | OK |  |  |
| 582 | gkbd-375D | R6:5301 | 4 | keyboard | during d=1600; gesture 2078–5715 (10 strokes); warn@476; older left [4051, 4051] | 20:17:02→20:17:17 | 15.65→16.49 | OK |  |  |
| 583 | gkbd-375D | R5:5302 | 5 | keyboard | during d=2200; gesture 2565–5535 (8 strokes); warn@363; older left [3638, 3638] | 20:17:16→20:17:30 | 16.49→16.49 | FAIL |  |  |
| 584 | gkbd-375D | R6:5301 | 5 | keyboard | during d=2200; gesture 2467–5202 (8 strokes); warn@263; older left [3534, 3534] | 20:17:17→20:17:32 | 16.49→16.49 | OK |  |  |
| 585 | gkbd-375D | R5:5302 | 6 | keyboard | during d=2800; gesture 3084–5871 (7 strokes); warn@278; older left [3529, 3529] | 20:17:30→20:17:46 | 16.49→16.55 | FAIL |  |  |
| 586 | gkbd-375D | R6:5301 | 6 | keyboard | during d=2800; gesture 3156–5575 (7 strokes); warn@355; older left [3501, 3501] | 20:17:32→20:17:47 | 16.49→16.55 | OK |  |  |
| 587 | gkbd-375D | R5:5302 | 7 | keyboard | after d=300; gesture 829–3745 (8 strokes); warn@516; older left [3825, 3825] | 20:17:46→20:17:59 | 16.55→15.94 | FAIL | [entry-flicker x1] |  |
| 588 | gkbd-375D | R6:5301 | 7 | keyboard | after d=300; gesture 542–2893 (7 strokes); warn@241; older left [3502, 3502] | 20:17:47→20:18:00 | 16.55→15.94 | OK |  |  |
| 589 | gkbd-375D | R5:5302 | 8 | keyboard | after d=600; gesture 1107–4161 (8 strokes); warn@505; older left [3636, 3636] | 20:17:59→20:18:13 | 15.94→16.12 | OK |  |  |
| 590 | gkbd-375D | R6:5301 | 8 | keyboard | after d=600; gesture 933–4074 (9 strokes); warn@315; older left [3593, 3593] | 20:18:00→20:18:13 | 15.94→16.12 | OK |  |  |
| 591 | gkbd-375D | R5:5302 | 9 | keyboard | after d=900; gesture 1146–3923 (8 strokes); warn@238; older left [3516, 3516] | 20:18:13→20:18:26 | 16.12→16.38 | FAIL |  |  |
| 592 | gkbd-375D | R6:5301 | 9 | keyboard | after d=900; gesture 1169–4181 (9 strokes); warn@267; older left [3676, 3676] | 20:18:13→20:18:27 | 16.12→16.38 | OK |  |  |
| 593 | gkbd-844L | R5:5302 | 0 | keyboard | before d=3600; gesture 3834–6253 (6 strokes); warn@223; older left [3492, 3492] | 20:18:28→20:18:44 | 16.38→16.64 | FAIL |  |  |
| 594 | gkbd-844L | R6:5301 | 0 | keyboard | before d=3600; gesture 4020–6480 (7 strokes); warn@414; older left [3666, 3666] | 20:18:28→20:18:45 | 16.38→16.64 | FAIL |  |  |
| 595 | gkbd-844L | R5:5302 | 1 | keyboard | before d=4200; gesture 4402–6587 (6 strokes); warn@199; older left [3487, 3487] | 20:18:44→20:19:00 | 16.64→14.8 | FAIL | [entry-flicker x3] |  |
| 596 | gkbd-844L | R6:5301 | 1 | keyboard | before d=4200; gesture 4522–6717 (6 strokes); warn@316; older left [3565, 3565] | 20:18:45→20:19:01 | 16.64→14.8 | FAIL |  |  |
| 597 | gkbd-844L | R5:5302 | 2 | keyboard | before d=4800; gesture 5191–8296 (9 strokes); warn@357; older left [3516, 3516] | 20:19:00→20:19:17 | 14.8→14.34 | FAIL | [own end @8430] |  |
| 598 | gkbd-844L | R6:5301 | 2 | keyboard | before d=4800; gesture 5116–7488 (7 strokes); warn@314; older left [3550, 3550] | 20:19:01→20:19:18 | 14.8→14.34 | FAIL |  |  |
| 599 | gkbd-844L | R5:5302 | 3 | keyboard | during d=1000; gesture 1286–4367 (9 strokes); warn@284; older left [3564, 3564] | 20:19:17→20:19:31 | 14.34→14.75 | FAIL | [entry-flicker x2] [own end @4802] |  |
| 600 | gkbd-844L | R6:5301 | 3 | keyboard | during d=1000; gesture 1402–6705 (15 strokes); warn@398; older left [4345, 4345] | 20:19:18→20:19:34 | 14.34→14.77 | FAIL |  |  |
| 601 | gkbd-844L | R5:5302 | 4 | keyboard | during d=1600; gesture 1995–4458 (7 strokes); warn@390; older left [3559, 3559] | 20:19:31→20:19:44 | 14.75→14.4 | FAIL |  |  |
| 602 | gkbd-844L | R6:5301 | 4 | keyboard | during d=1600; gesture 1930–5247 (10 strokes); warn@327; older left [3597, 3597] | 20:19:35→20:19:49 | 14.77→13.89 | OK |  |  |
| 603 | gkbd-844L | R5:5302 | 5 | keyboard | during d=2200; gesture 2512–4746 (6 strokes); warn@310; older left [3595, 3595] | 20:19:44→20:19:58 | 14.4→14.22 | FAIL |  |  |
| 604 | gkbd-844L | R6:5301 | 5 | keyboard | during d=2200; gesture 2457–5009 (6 strokes); warn@254; older left [3535, 3535] | 20:19:49→20:20:04 | 13.89→13.2 | FAIL |  |  |
| 605 | gkbd-844L | R5:5302 | 6 | keyboard | during d=2800; gesture 3171–6377 (9 strokes); warn@368; older left [3573, 3573] | 20:19:58→20:20:13 | 14.22→13.43 | FAIL | [own end @6775] |  |
| 606 | gkbd-844L | R6:5301 | 6 | keyboard | during d=2800; gesture 3274–6135 (7 strokes); warn@423; older left [3819, 3819] | 20:20:04→20:20:19 | 13.2→12.66 | OK |  |  |
| 607 | gkbd-844L | R5:5302 | 7 | keyboard | after d=300; gesture 620–3300 (7 strokes); warn@305; older left [3697, 3697] | 20:20:13→20:20:26 | 13.43→13.49 | FAIL |  |  |
| 608 | gkbd-844L | R6:5301 | 7 | keyboard | after d=300; gesture 975–3711 (7 strokes); warn@630; older left [4650, 4650] | 20:20:19→20:20:33 | 12.66→13.61 | OK |  |  |
| 609 | gkbd-844L | R5:5302 | 8 | keyboard | after d=600; gesture 995–3599 (6 strokes); warn@393; older left [3941, 3941] | 20:20:26→20:20:39 | 13.49→13.4 | FAIL |  |  |
| 610 | gkbd-844L | R6:5301 | 8 | keyboard | after d=600; gesture 1473–4538 (9 strokes); warn@869; older left [4228, 4228] | 20:20:33→20:20:47 | 13.61→13.2 | OK |  |  |
| 611 | gkbd-844L | R5:5302 | 9 | keyboard | after d=900; gesture 1220–3828 (7 strokes); warn@315; older left [3650, 3650] | 20:20:39→20:20:52 | 13.4→13.99 | FAIL |  |  |
| 612 | gkbd-844L | R6:5301 | 9 | keyboard | after d=900; gesture 1306–4253 (9 strokes); warn@372; older left [3903, 3903] | 20:20:47→20:21:01 | 13.2→13.22 | OK |  |  |
| 613 | ngfling-375L | R5:5302 | 0 | touch fling (CDP) | wait=600; top@2775, down@3378; older left [3691, 3691] | 20:27:42→20:27:57 | 5.98→7.5 | FAIL | **D1:** faded/absent |  |
| 614 | ngfling-375L | R6:5301 | 0 | touch fling (CDP) | wait=600; top@2824, down@3427; older left [3879, 3879] | 20:27:42→20:27:59 | 5.98→7.5 | OK |  |  |
| 615 | ngfling-375L | R5:5302 | 1 | touch fling (CDP) | wait=600; top@2021, down@2624; older left [3715, 3715] | 20:27:57→20:28:09 | 7.5→8.52 | OK |  |  |
| 616 | ngfling-375L | R6:5301 | 1 | touch fling (CDP) | wait=600; top@2223, down@2827; older left [3629, 3629] | 20:27:59→20:28:15 | 7.5→8.64 | OK |  |  |
| 617 | ngfling-375L | R5:5302 | 2 | touch fling (CDP) | wait=900; top@1972, down@2875; older left [3912, 3912] | 20:28:09→20:28:22 | 8.52→9.71 | OK |  |  |
| 618 | ngfling-375L | R6:5301 | 2 | touch fling (CDP) | wait=900; top@2483, down@3423; older left [3699, 3699] | 20:28:15→20:28:31 | 8.64→10.45 | OK |  |  |
| 619 | ngfling-375L | R5:5302 | 3 | touch fling (CDP) | wait=900; top@1806, down@2785; older left [3826, 3826] | 20:28:22→20:28:36 | 9.71→10.74 | OK |  |  |
| 620 | ngfling-375L | R6:5301 | 3 | touch fling (CDP) | wait=900; top@2377, down@3285; older left [3721, 3721] | 20:28:31→20:28:46 | 10.45→11.38 | OK |  |  |
| 621 | ngfling-375L | R5:5302 | 4 | touch fling (CDP) | wait=1200; top@1758, down@2961; older left [3565, 3565] | 20:28:36→20:28:48 | 10.74→11.38 | OK |  |  |
| 622 | ngfling-375L | R6:5301 | 4 | touch fling (CDP) | wait=1200; top@2054, down@3256; older left [3548, 3548] | 20:28:46→20:29:00 | 11.38→10.37 | OK |  |  |
| 623 | ngfling-375L | R5:5302 | 5 | touch fling (CDP) | wait=1200; top@1764, down@2965; older left [3538, 3538] | 20:28:48→20:29:01 | 11.38→10.37 | OK |  |  |
| 624 | ngfling-375L | R6:5301 | 5 | touch fling (CDP) | wait=1200; top@2029, down@3232; older left [3537, 3537] | 20:29:00→20:29:15 | 10.37→9.33 | OK |  |  |
| 625 | ngfling-375L | R5:5302 | 6 | touch fling (CDP) | wait=1500; top@2262, down@3765; older left [3482, 3482] | 20:29:01→20:29:14 | 10.37→9.33 | OK |  |  |
| 626 | ngfling-375L | R5:5302 | 7 | touch fling (CDP) | wait=1500; top@2377, down@3899; older left [3524, 3524] | 20:29:14→20:29:27 | 9.33→8.7 | OK |  |  |
| 627 | ngfling-375L | R6:5301 | 6 | touch fling (CDP) | wait=1500; top@1873, down@3377; older left [3575, 3575] | 20:29:15→20:29:30 | 9.33→8.89 | OK |  |  |
| 628 | ngfling-375L | R5:5302 | 8 | touch fling (CDP) | wait=1800; top@1864, down@3667; older left [3485, 3485] | 20:29:27→20:29:39 | 8.7→8.59 | OK | [entry-flicker x1] |  |
| 629 | ngfling-375L | R6:5301 | 7 | touch fling (CDP) | wait=1500; top@1861, down@3365; older left [3579, 3579] | 20:29:30→20:29:46 | 8.89→8.54 | OK |  |  |
| 630 | ngfling-375L | R5:5302 | 9 | touch fling (CDP) | wait=1800; top@2245, down@4050; older left [3521, 3521] | 20:29:39→20:29:52 | 8.59→8.34 | OK |  |  |
| 631 | ngfling-375L | R6:5301 | 8 | touch fling (CDP) | wait=1800; top@2206, down@4009; older left [3512, 3512] | 20:29:46→20:30:00 | 8.54→7.21 | OK |  |  |
| 632 | ngfling-375L | R6:5301 | 9 | touch fling (CDP) | wait=1800; top@2023, down@3826; older left [3551, 3551] | 20:30:00→20:30:14 | 7.21→7.11 | OK |  |  |
| 633 | ngfling-375D | R6:5301 | 0 | touch fling (CDP) | wait=600; top@2101, down@2704; older left [3743, 3744] | 20:30:15→20:30:31 | 7.11→6.61 | OK |  |  |
| 634 | ngfling-375D | R5:5302 | 0 | touch fling (CDP) | wait=600; top@2040, down@2654; older left [3524, 3524] | 20:30:15→20:30:27 | 7.11→6.92 | OK |  |  |
| 635 | ngfling-375D | R5:5302 | 1 | touch fling (CDP) | wait=600; top@1870, down@2472; older left [3701, 3701] | 20:30:27→20:30:39 | 6.92→6.64 | OK | [entry-flicker x1] |  |
| 636 | ngfling-375D | R6:5301 | 1 | touch fling (CDP) | wait=600; top@2161, down@2763; older left [3860, 3860] | 20:30:31→20:30:46 | 6.61→7.02 | OK |  |  |
| 637 | ngfling-375D | R5:5302 | 2 | touch fling (CDP) | wait=900; top@1467, down@2370; older left [3621, 3621] | 20:30:39→20:30:51 | 6.64→6.86 | OK |  |  |
| 638 | ngfling-375D | R6:5301 | 2 | touch fling (CDP) | wait=900; top@2362, down@3265; older left [3711, 3711] | 20:30:46→20:31:01 | 7.02→7.71 | OK |  |  |
| 639 | ngfling-375D | R5:5302 | 3 | touch fling (CDP) | wait=900; top@1894, down@2796; older left [3666, 3666] | 20:30:51→20:31:04 | 6.86→8.38 | OK |  |  |
| 640 | ngfling-375D | R6:5301 | 3 | touch fling (CDP) | wait=900; top@2061, down@2967; older left [3749, 3749] | 20:31:01→20:31:16 | 7.71→9.19 | OK |  |  |
| 641 | ngfling-375D | R5:5302 | 4 | touch fling (CDP) | wait=1200; top@1807, down@3010; older left [3578, 3578] | 20:31:04→20:31:17 | 8.38→9.19 | OK |  |  |
| 642 | ngfling-375D | R6:5301 | 4 | touch fling (CDP) | wait=1200; top@2178, down@3379; older left [3546, 3546] | 20:31:16→20:31:31 | 9.19→9.35 | OK |  |  |
| 643 | ngfling-375D | R5:5302 | 5 | touch fling (CDP) | wait=1200; top@1720, down@2923; older left [3618, 3618] | 20:31:17→20:31:30 | 9.19→9.35 | OK |  |  |
| 644 | ngfling-375D | R5:5302 | 6 | touch fling (CDP) | wait=1500; top@1567, down@3070; older left [3563, 3563] | 20:31:30→20:31:43 | 9.35→10.7 | OK |  |  |
| 645 | ngfling-375D | R6:5301 | 5 | touch fling (CDP) | wait=1200; top@2098, down@3301; older left [3677, 3677] | 20:31:31→20:31:46 | 9.35→9.92 | OK |  |  |
| 646 | ngfling-375D | R5:5302 | 7 | touch fling (CDP) | wait=1500; top@1610, down@3112; older left [3641, 3641] | 20:31:43→20:31:56 | 10.7→9.06 | OK |  |  |
| 647 | ngfling-375D | R6:5301 | 6 | touch fling (CDP) | wait=1500; top@1972, down@3474; older left [3534, 3534] | 20:31:46→20:32:01 | 9.92→8.9 | OK |  |  |
| 648 | ngfling-375D | R5:5302 | 8 | touch fling (CDP) | wait=1800; top@2368, down@4169; older left [3607, 3607] | 20:31:56→20:32:08 | 9.06→8.51 | OK |  |  |
| 649 | ngfling-375D | R6:5301 | 7 | touch fling (CDP) | wait=1500; top@1715, down@3218; older left [3696, 3696] | 20:32:01→20:32:16 | 8.9→8.28 | OK |  |  |
| 650 | ngfling-375D | R5:5302 | 9 | touch fling (CDP) | wait=1800; top@1639, down@3442; older left [3657, 3657] | 20:32:08→20:32:21 | 8.51→8.82 | OK | [entry-flicker x1] |  |
| 651 | ngfling-375D | R6:5301 | 8 | touch fling (CDP) | wait=1800; top@1838, down@3648; older left [3663, 3663] | 20:32:16→20:32:29 | 8.28→7.91 | OK |  |  |
| 652 | ngfling-375D | R6:5301 | 9 | touch fling (CDP) | wait=1800; top@1783, down@3585; older left [3517, 3517] | 20:32:29→20:32:43 | 7.91→7.43 | OK |  |  |
| 653 | dnx-375L | R5:5302 | 0 | wheel 40 px up / 20 px down | wait=600; top@2291, down@2896; older left [3606, 5547] | 20:35:08→20:35:22 | 12.96→13.3 | OK |  |  |
| 654 | dnx-375L | R5:5302 | 1 | wheel 40 px up / 20 px down | wait=600; top@2149, down@2766; older left [4492, 4726] | 20:35:23→20:35:36 | 13.3→12.94 | OK |  |  |
| 655 | dnx-375L | R5:5302 | 2 | wheel 40 px up / 20 px down | wait=900; top@1767, down@2669; older left [3611, 5628] | 20:35:36→20:35:50 | 12.94→10.87 | OK | [entry-flicker x1] |  |
| 656 | dnx-375L | R5:5302 | 3 | wheel 40 px up / 20 px down | wait=900; top@1704, down@2607; older left [4765, 4765] | 20:35:50→20:36:04 | 10.87→10.31 | OK |  |  |
| 657 | dnx-375L | R5:5302 | 4 | wheel 40 px up / 20 px down | wait=1200; top@1717, down@2920; older left [4611, 5226] | 20:36:04→20:36:18 | 10.31→10.52 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 658 | dnx-375L | R5:5302 | 5 | wheel 40 px up / 20 px down | wait=1200; top@1750, down@2953; older left [4582, 5003] | 20:36:18→20:36:32 | 10.52→9.3 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control [entry-flicker x1] |  |
| 659 | dnx-375L | R5:5302 | 6 | wheel 40 px up / 20 px down | wait=1500; top@2000, down@3503; older left [4713, 5195] | 20:36:32→20:36:47 | 9.3→8.72 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 660 | dnx-375L | R5:5302 | 7 | wheel 40 px up / 20 px down | wait=1500; top@2268, down@3780; older left [3548, 6077] | 20:36:47→20:37:01 | 8.72→8.36 | OK | [entry-flicker x1] |  |
| 661 | dnx-375L | R5:5302 | 8 | wheel 40 px up / 20 px down | wait=1800; top@1623, down@3425; older left [3765, 5648] | 20:37:01→20:37:15 | 8.36→7.42 | OK |  |  |
| 662 | dnx-375L | R5:5302 | 9 | wheel 40 px up / 20 px down | wait=1800; top@1704, down@3506; older left [4706, 5630] | 20:37:15→20:37:29 | 7.42→7.45 | FAIL | **D1:** faded/absent, below room, over dock/control [entry-flicker x1] |  |
| 663 | dnx-375D | R5:5302 | 0 | wheel 40 px up / 20 px down | wait=600; top@2184, down@2786; older left [4597, 4597] | 20:37:31→20:37:45 | 7.45→7.97 | OK |  |  |
| 664 | dnx-375D | R5:5302 | 1 | wheel 40 px up / 20 px down | wait=600; top@2147, down@2749; older left [3521, 4837] | 20:37:45→20:37:59 | 7.97→8.88 | OK |  |  |
| 665 | dnx-375D | R5:5302 | 2 | wheel 40 px up / 20 px down | wait=900; top@1873, down@2800; older left [4973, 4973] | 20:37:59→20:38:13 | 8.88→9.23 | OK |  |  |
| 666 | dnx-375D | R5:5302 | 3 | wheel 40 px up / 20 px down | wait=900; top@1902, down@2805; older left [3630, 5645] | 20:38:13→20:38:27 | 9.23→9.36 | OK | [entry-flicker x1] |  |
| 667 | dnx-375D | R5:5302 | 4 | wheel 40 px up / 20 px down | wait=1200; top@2329, down@3539; older left [3806, 5075] | 20:38:27→20:38:41 | 9.36→9.71 | OK |  |  |
| 668 | dnx-375D | R5:5302 | 5 | wheel 40 px up / 20 px down | wait=1200; top@1883, down@3084; older left [3792, 5108] | 20:38:41→20:38:57 | 9.71→10.8 | FAIL | **D1:** hide/reset, faded/absent, below room |  |
| 669 | dnx-375D | R5:5302 | 6 | wheel 40 px up / 20 px down | wait=1500; top@1808, down@3321; older left [3821, 5353] | 20:38:57→20:39:10 | 10.8→9.73 | OK |  |  |
| 670 | dnx-375D | R5:5302 | 7 | wheel 40 px up / 20 px down | wait=1500; top@1888, down@3392; older left [3614, 6262] | 20:39:10→20:39:24 | 9.73→9.86 | OK | [entry-flicker x1] |  |
| 671 | dnx-375D | R5:5302 | 8 | wheel 40 px up / 20 px down | wait=1800; top@2113, down@3916; older left [3522, 4177] | 20:39:24→20:39:38 | 9.86→10.73 | OK |  |  |
| 672 | dnx-375D | R5:5302 | 9 | wheel 40 px up / 20 px down | wait=1800; top@1816, down@3619; older left [3795, 5692] | 20:39:38→20:39:52 | 10.73→11.01 | OK |  |  |
| 673 | dnx-844L | R5:5302 | 0 | wheel 40 px up / 20 px down | wait=600; top@1901, down@2504; older left [4197, 4515] | 20:39:53→20:40:08 | 11.01→12.13 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 674 | dnx-844L | R5:5302 | 1 | wheel 40 px up / 20 px down | wait=600; top@1962, down@2565; older left [3709, 4789] | 20:40:08→20:40:21 | 12.13→12.4 | OK |  |  |
| 675 | dnx-844L | R5:5302 | 2 | wheel 40 px up / 20 px down | wait=900; top@1873, down@2775; older left [3680, 4929] | 20:40:21→20:40:36 | 12.4→12.0 | OK |  |  |
| 676 | dnx-844L | R5:5302 | 3 | wheel 40 px up / 20 px down | wait=900; top@1461, down@2364; older left [4392, 4994] | 20:40:36→20:40:50 | 12.0→10.57 | FAIL | **D1:** hide/reset, faded/absent, below room, over dock/control |  |
| 677 | dnx-844L | R5:5302 | 4 | wheel 40 px up / 20 px down | wait=1200; top@3670, down@4873; older left [3548, 3728] | 20:40:50→20:41:03 | 10.57→9.31 | OK | [entry-flicker x1] |  |
| 678 | dnx-844L | R5:5302 | 5 | wheel 40 px up / 20 px down | wait=1200; top@1603, down@2806; older left [3650, 5200] | 20:41:03→20:41:18 | 9.31→9.74 | OK |  |  |
| 679 | dnx-844L | R5:5302 | 6 | wheel 40 px up / 20 px down | wait=1500; top@2076, down@3597; older left [3796, 3796] | 20:41:18→20:41:31 | 9.74→8.71 | FAIL |  |  |
| 680 | dnx-844L | R5:5302 | 7 | wheel 40 px up / 20 px down | wait=1500; top@1584, down@3087; older left [3702, 5494] | 20:41:31→20:41:45 | 8.71→6.85 | OK | [entry-flicker x1] |  |
| 681 | dnx-844L | R5:5302 | 8 | wheel 40 px up / 20 px down | wait=1800; top@3915, down@5721; older left [3564, 3803] | 20:41:45→20:42:00 | 6.85→7.44 | FAIL | [entry-flicker x1] |  |
| 682 | dnx-844L | R5:5302 | 9 | wheel 40 px up / 20 px down | wait=1800; top@3843, down@5646; older left [3520, 3770] | 20:42:00→20:42:14 | 7.44→8.35 | OK | [entry-flicker x1] |  |
| 683 | dn-844L | R5:5302 | 0 | wheel 40 px up / 20 px down | wait=600; top@3952, down@4554; older left [3598, 3798] | 20:42:15→20:42:29 | 8.24→8.72 | OK | [entry-flicker x1] |  |
| 684 | dn-844L | R5:5302 | 1 | wheel 40 px up / 20 px down | wait=600; top@2009, down@2611; older left [4126, 4863] | 20:42:30→20:42:44 | 8.72→10.11 | OK |  |  |
| 685 | dn-844L | R5:5302 | 2 | wheel 40 px up / 20 px down | wait=900; top@2447, down@3350; older left [3548, 6022] | 20:42:44→20:42:59 | 10.11→10.91 | FAIL | [entry-flicker x1] |  |
| 686 | dn-844L | R5:5302 | 3 | wheel 40 px up / 20 px down | wait=900; top@1938, down@2841; older left [3715, 5048] | 20:42:59→20:43:13 | 10.91→12.25 | OK |  |  |
| 687 | dn-844L | R5:5302 | 4 | wheel 40 px up / 20 px down | wait=1200; top@3822, down@5025; older left [3547, 3794] | 20:43:13→20:43:28 | 12.25→12.16 | FAIL | [entry-flicker x1] |  |
| 688 | dn-844L | R5:5302 | 5 | wheel 40 px up / 20 px down | wait=1200; top@1555, down@2761; older left [4117, 5185] | 20:43:28→20:43:42 | 12.16→12.41 | OK |  |  |
| 689 | dn-844L | R5:5302 | 6 | wheel 40 px up / 20 px down | wait=1500; top@1768, down@3270; older left [4197, 5517] | 20:43:43→20:43:57 | 12.41→11.53 | OK |  |  |
| 690 | dn-844L | R5:5302 | 7 | wheel 40 px up / 20 px down | wait=1500; top@1969, down@3485; older left [3911, 3911] | 20:43:57→20:44:10 | 11.53→11.67 | FAIL | [entry-flicker x1] |  |
| 691 | dn-844L | R5:5302 | 8 | wheel 40 px up / 20 px down | wait=1800; top@1680, down@3496; older left [3626, 5824] | 20:44:11→20:44:25 | 11.67→11.29 | OK |  |  |
| 692 | dn-844L | R5:5302 | 9 | wheel 40 px up / 20 px down | wait=1800; top@1660, down@3473; older left [4288, 5723] | 20:44:25→20:44:41 | 11.29→10.86 | OK |  |  |
| 693 | drepro-375L | R5:5302 | 0 | wheel | during d=1000; gesture 1247–3841 (11 strokes); warn@239; older left [3502, 3502] | 20:44:42→20:44:55 | 10.86→10.89 | OK |  |  |
| 694 | drepro-375L | R5:5302 | 1 | wheel | during d=1600; gesture 1964–3851 (9 strokes); warn@358; older left [3575, 3575] | 20:44:55→20:45:08 | 10.89→11.85 | FAIL | [entry-flicker x1] |  |
| 695 | drepro-375L | R5:5302 | 2 | wheel | during d=2200; gesture 2437–4420 (9 strokes); warn@229; older left [3535, 3535] | 20:45:08→20:45:21 | 11.85→11.99 | FAIL |  |  |
| 696 | drepro-375L | R5:5302 | 3 | wheel | during d=2800; gesture 3042–4843 (8 strokes); warn@236; older left [3489, 3489] | 20:45:21→20:45:35 | 11.99→11.81 | FAIL |  |  |
| 697 | drepro-375L | R5:5302 | 4 | wheel | after d=300; gesture 576–2983 (8 strokes); warn@239; older left [3680, 3680] | 20:45:35→20:45:46 | 11.81→12.84 | OK |  |  |
| 698 | drepro-375L | R5:5302 | 5 | wheel | after d=600; gesture 884–3254 (8 strokes); warn@276; older left [3485] | 20:45:46→20:45:58 | 12.84→12.53 | FAIL |  |  |
| 699 | drepro-375L | R5:5302 | 6 | wheel | during d=1000; gesture 1219–4136 (15 strokes); warn@215; older left [3498] | 20:45:58→20:46:11 | 12.53→12.37 | FAIL |  |  |
| 700 | drepro-375L | R5:5302 | 7 | wheel | during d=1600; gesture 1875–4117 (10 strokes); warn@271; older left [3592, 3592] | 20:46:11→20:46:24 | 12.37→12.51 | FAIL |  |  |
| 701 | drepro-375L | R5:5302 | 8 | wheel | during d=2200; gesture 2493–4295 (9 strokes); warn@288; older left [3490, 3490] | 20:46:24→20:46:37 | 12.51→12.5 | FAIL |  |  |
| 702 | drepro-375L | R5:5302 | 9 | wheel | during d=2800; gesture 3153–4976 (8 strokes); warn@309; older left [3566, 3566] | 20:46:37→20:46:51 | 12.5→13.39 | FAIL | [entry-flicker x1] |  |
| 703 | drepro-844L | R5:5302 | 0 | wheel | during d=1000; gesture 1306–5342 (16 strokes); warn@298; older left [3499, 3499] | 20:46:51→20:47:05 | 13.39→12.69 | FAIL | [entry-flicker x1] |  |
| 704 | drepro-844L | R5:5302 | 1 | wheel | during d=1600; gesture 1853–4969 (16 strokes); warn@249; older left [3500, 3500] | 20:47:05→20:47:18 | 12.69→13.2 | FAIL |  |  |
| 705 | drepro-844L | R5:5302 | 2 | wheel | during d=2200; gesture 2496–5579 (16 strokes); warn@292; older left [3492, 3492] | 20:47:18→20:47:33 | 13.2→13.74 | FAIL |  |  |
| 706 | drepro-844L | R5:5302 | 3 | wheel | during d=2800; gesture 3310–6421 (16 strokes); warn@502; older left [3619, 3619] | 20:47:33→20:47:48 | 13.74→14.08 | FAIL |  |  |
| 707 | drepro-844L | R5:5302 | 4 | wheel | after d=300; gesture 622–2832 (8 strokes); warn@314; older left [3531, 3531] | 20:47:48→20:48:00 | 14.08→13.91 | FAIL |  |  |
| 708 | drepro-844L | R5:5302 | 5 | wheel | after d=600; gesture 929–3045 (8 strokes); warn@200; older left [3575, 3575] | 20:48:00→20:48:11 | 13.91→13.06 | FAIL | [entry-flicker x1] |  |
| 709 | drepro-844L | R5:5302 | 6 | wheel | during d=1000; gesture 1183–4382 (16 strokes); warn@172; older left [3478, 3478] | 20:48:11→20:48:24 | 13.06→12.59 | FAIL | [entry-flicker x1] |  |
| 710 | drepro-844L | R5:5302 | 7 | wheel | during d=1600; gesture 1915–4993 (16 strokes); warn@308; older left [3520, 3520] | 20:48:24→20:48:37 | 12.59→13.17 | FAIL |  |  |
| 711 | drepro-844L | R5:5302 | 8 | wheel | during d=2200; gesture 2503–5603 (16 strokes); warn@297; older left [3538, 3538] | 20:48:37→20:48:51 | 13.17→12.06 | FAIL | [entry-flicker x1] |  |
| 712 | drepro-844L | R5:5302 | 9 | wheel | during d=2800; gesture 3035–6105 (16 strokes); warn@228; older left [3499, 3499] | 20:48:51→20:49:06 | 12.06→11.13 | FAIL |  |  |
| 713 | ngfine-375L | R6:5301 | 0 | fine wheel 2-5 px | wait=600; top@2845, down@3453; older left [4001, 4001] | 20:58:13→20:58:28 | 4.52→6.76 | OK |  |  |
| 714 | ngfine-375L | R5:5302 | 0 | fine wheel 2-5 px | wait=600; top@2899, down@3504; older left [3582, 4812] | 20:58:13→20:58:27 | 4.52→6.76 | OK | [entry-flicker x1] |  |
| 715 | ngfine-375L | R5:5302 | 1 | fine wheel 2-5 px | wait=600; top@2902, down@3507; older left [3498, 4730] | 20:58:27→20:58:40 | 6.76→7.13 | OK | [entry-flicker x1] |  |
| 716 | ngfine-375L | R6:5301 | 1 | fine wheel 2-5 px | wait=600; top@2544, down@3147; older left [3578, 3578] | 20:58:28→20:58:43 | 6.76→7.13 | OK |  |  |
| 717 | ngfine-375L | R5:5302 | 2 | fine wheel 2-5 px | wait=900; top@2517, down@3420; older left [3545, 4576] | 20:58:40→20:58:53 | 7.13→7.27 | OK |  |  |
| 718 | ngfine-375L | R6:5301 | 2 | fine wheel 2-5 px | wait=900; top@2697, down@3600; older left [3563, 3563] | 20:58:43→20:58:57 | 7.13→7.17 | OK |  |  |
| 719 | ngfine-375L | R5:5302 | 3 | fine wheel 2-5 px | wait=900; top@3106, down@4036; older left [3520, 4954] | 20:58:53→20:59:06 | 7.27→6.89 | OK |  |  |
| 720 | ngfine-375L | R6:5301 | 3 | fine wheel 2-5 px | wait=900; top@2565, down@3469; older left [3841, 3841] | 20:58:57→20:59:12 | 7.17→7.54 | OK |  |  |
| 721 | ngfine-375L | R5:5302 | 4 | fine wheel 2-5 px | wait=1200; top@3034, down@4238; older left [3565, 5163] | 20:59:06→20:59:20 | 6.89→7.66 | OK |  |  |
| 722 | ngfine-375L | R6:5301 | 4 | fine wheel 2-5 px | wait=1200; top@2559, down@3764; older left [4056, 4056] | 20:59:12→20:59:27 | 7.54→7.95 | OK |  |  |
| 723 | ngfine-375L | R5:5302 | 5 | fine wheel 2-5 px | wait=1200; top@2836, down@4038; older left [3631, 5449] | 20:59:20→20:59:33 | 7.66→8.2 | OK |  |  |
| 724 | ngfine-375L | R6:5301 | 5 | fine wheel 2-5 px | wait=1200; top@2952, down@4154; older left [3497, 3497] | 20:59:27→20:59:42 | 7.95→8.33 | OK |  |  |
| 725 | ngfine-375L | R5:5302 | 6 | fine wheel 2-5 px | wait=1500; top@2555, down@4060; older left [3520, 5587] | 20:59:33→20:59:47 | 8.2→8.71 | OK |  |  |
| 726 | ngfine-375L | R6:5301 | 6 | fine wheel 2-5 px | wait=1500; top@2949, down@4452; older left [4263, 4263] | 20:59:42→20:59:57 | 8.33→8.34 | OK |  |  |
| 727 | ngfine-375L | R5:5302 | 7 | fine wheel 2-5 px | wait=1500; top@2181, down@3684; older left [3527, 5153] | 20:59:47→21:00:01 | 8.71→8.07 | OK |  |  |
| 728 | ngfine-375L | R6:5301 | 7 | fine wheel 2-5 px | wait=1500; top@2915, down@4417; older left [3702, 3702] | 20:59:57→21:00:12 | 8.34→8.04 | OK |  |  |
| 729 | ngfine-375L | R5:5302 | 8 | fine wheel 2-5 px | wait=1800; top@2928, down@4731; older left [3598, 5959] | 21:00:01→21:00:16 | 8.07→7.96 | OK | [entry-flicker x1] |  |
| 730 | ngfine-375L | R6:5301 | 8 | fine wheel 2-5 px | wait=1800; top@2798, down@4600; older left [3606, 3606] | 21:00:12→21:00:27 | 8.04→8.04 | OK |  |  |
| 731 | ngfine-375L | R5:5302 | 9 | fine wheel 2-5 px | wait=1800; top@2614, down@4416; older left [3624, 5822] | 21:00:16→21:00:30 | 7.96→8.04 | OK |  |  |
| 732 | ngfine-375L | R6:5301 | 9 | fine wheel 2-5 px | wait=1800; top@2385, down@4188; older left [3640, 3640] | 21:00:27→21:00:41 | 8.04→6.88 | OK |  |  |
| 733 | ngfine-375D | R5:5302 | 0 | fine wheel 2-5 px | wait=600; top@3330, down@3937; older left [3542, 4827] | 21:00:42→21:00:56 | 6.88→7.23 | OK |  |  |
| 734 | ngfine-375D | R6:5301 | 0 | fine wheel 2-5 px | wait=600; top@2816, down@3456; older left [4078, 4078] | 21:00:42→21:00:58 | 6.88→7.23 | OK |  |  |
| 735 | ngfine-375D | R5:5302 | 1 | fine wheel 2-5 px | wait=600; top@4435, down@5043; older left [3562, 5430] | 21:00:56→21:01:11 | 7.23→7.77 | OK |  |  |
| 736 | ngfine-375D | R6:5301 | 1 | fine wheel 2-5 px | wait=600; top@3017, down@3622; older left [3541, 3541] | 21:00:58→21:01:13 | 7.23→7.77 | OK |  |  |
| 737 | ngfine-375D | R5:5302 | 2 | fine wheel 2-5 px | wait=900; top@2797, down@3701; older left [3679, 5095] | 21:01:11→21:01:25 | 7.77→9.3 | OK | [entry-flicker x1] |  |
| 738 | ngfine-375D | R6:5301 | 2 | fine wheel 2-5 px | wait=900; top@2890, down@3792; older left [3560, 3560] | 21:01:13→21:01:27 | 7.77→9.27 | OK |  |  |
| 739 | ngfine-375D | R5:5302 | 3 | fine wheel 2-5 px | wait=900; top@3557, down@4458; older left [3534, 5138] | 21:01:25→21:01:39 | 9.3→10.31 | OK |  |  |
| 740 | ngfine-375D | R6:5301 | 3 | fine wheel 2-5 px | wait=900; top@2626, down@3528; older left [3763, 3763] | 21:01:27→21:01:43 | 9.27→10.68 | OK |  |  |
| 741 | ngfine-375D | R5:5302 | 4 | fine wheel 2-5 px | wait=1200; top@3229, down@4431; older left [3493, 5256] | 21:01:39→21:01:54 | 10.31→10.78 | OK |  |  |
| 742 | ngfine-375D | R6:5301 | 4 | fine wheel 2-5 px | wait=1200; top@2635, down@3839; older left [3945, 3945] | 21:01:43→21:01:58 | 10.68→10.48 | OK |  |  |
| 743 | ngfine-375D | R5:5302 | 5 | fine wheel 2-5 px | wait=1200; top@3129, down@4331; older left [3491, 5472] | 21:01:54→21:02:08 | 10.78→11.22 | OK |  |  |
| 744 | ngfine-375D | R6:5301 | 5 | fine wheel 2-5 px | wait=1200; top@2438, down@3643; older left [3523, 3523] | 21:01:58→21:02:13 | 10.48→10.48 | OK |  |  |
| 745 | ngfine-375D | R5:5302 | 6 | fine wheel 2-5 px | wait=1500; top@3107, down@4611; older left [3504, 5490] | 21:02:08→21:02:22 | 11.22→11.46 | OK |  |  |
| 746 | ngfine-375D | R6:5301 | 6 | fine wheel 2-5 px | wait=1500; top@2572, down@4075; older left [4163, 4163] | 21:02:14→21:02:30 | 10.48→11.82 | OK |  |  |
| 747 | ngfine-375D | R5:5302 | 7 | fine wheel 2-5 px | wait=1500; top@2417, down@3920; older left [3548, 5464] | 21:02:22→21:02:37 | 11.46→10.93 | OK |  |  |
| 748 | ngfine-375D | R6:5301 | 7 | fine wheel 2-5 px | wait=1500; top@3282, down@4786; older left [3565, 3565] | 21:02:30→21:02:46 | 11.82→9.79 | OK |  |  |
| 749 | ngfine-375D | R5:5302 | 8 | fine wheel 2-5 px | wait=1800; top@2652, down@4484; older left [3529, 5814] | 21:02:37→21:02:51 | 10.93→9.56 | OK |  |  |
| 750 | ngfine-375D | R6:5301 | 8 | fine wheel 2-5 px | wait=1800; top@3106, down@4908; older left [3598, 3598] | 21:02:46→21:03:01 | 9.79→9.09 | OK |  |  |
| 751 | ngfine-375D | R5:5302 | 9 | fine wheel 2-5 px | wait=1800; top@2568, down@4391; older left [3482, 5836] | 21:02:51→21:03:05 | 9.56→9.09 | OK |  |  |
| 752 | ngfine-375D | R6:5301 | 9 | fine wheel 2-5 px | wait=1800; top@2572, down@4374; older left [3883, 3883] | 21:03:01→21:03:16 | 9.09→8.61 | OK |  |  |
| 753 | ngfine-844L | R5:5302 | 0 | fine wheel 2-5 px | wait=600; top@2845, down@3448; older left [3927, 4940] | 21:03:17→21:03:32 | 8.61→10.37 | OK |  |  |
| 754 | ngfine-844L | R6:5301 | 0 | fine wheel 2-5 px | wait=600; top@3725, down@4329; older left [3534, 5583] | 21:03:17→21:03:36 | 8.61→10.26 | OK |  |  |
| 755 | ngfine-844L | R5:5302 | 1 | fine wheel 2-5 px | wait=600; top@2444, down@3045; older left [4008, 4894] | 21:03:32→21:03:45 | 10.37→10.56 | OK |  |  |
| 756 | ngfine-844L | R6:5301 | 1 | fine wheel 2-5 px | wait=600; top@3330, down@3942; older left [3508, 4593] | 21:03:36→21:03:52 | 10.26→10.79 | OK |  |  |
| 757 | ngfine-844L | R5:5302 | 2 | fine wheel 2-5 px | wait=900; top@3205, down@4175; older left [3748, 5148] | 21:03:45→21:03:59 | 10.56→11.37 | OK | [entry-flicker x1] |  |
| 758 | ngfine-844L | R6:5301 | 2 | fine wheel 2-5 px | wait=900; top@3557, down@4459; older left [3505, 4953] | 21:03:52→21:04:08 | 10.79→11.78 | OK |  |  |
| 759 | ngfine-844L | R5:5302 | 3 | fine wheel 2-5 px | wait=900; top@2233, down@3137; older left [3748, 5197] | 21:03:59→21:04:13 | 11.37→12.52 | OK |  |  |
| 760 | ngfine-844L | R6:5301 | 3 | fine wheel 2-5 px | wait=900; top@5310, down@6213; older left [3498, 4678] | 21:04:08→21:04:25 | 11.78→12.03 | OK |  |  |
| 761 | ngfine-844L | R5:5302 | 4 | fine wheel 2-5 px | wait=1200; top@2713, down@3915; older left [3712, 5194] | 21:04:13→21:04:27 | 12.52→11.79 | OK | [entry-flicker x1] |  |
| 762 | ngfine-844L | R6:5301 | 4 | fine wheel 2-5 px | wait=1200; top@3325, down@4530; older left [3505, 5337] | 21:04:25→21:04:41 | 12.03→11.72 | OK |  |  |
| 763 | ngfine-844L | R5:5302 | 5 | fine wheel 2-5 px | wait=1200; top@3039, down@4243; older left [3956, 5305] | 21:04:28→21:04:42 | 11.79→11.72 | OK |  |  |
| 764 | ngfine-844L | R6:5301 | 5 | fine wheel 2-5 px | wait=1200; top@4698, down@5900; older left [3545, 4564] | 21:04:41→21:04:58 | 11.72→11.5 | OK |  |  |
| 765 | ngfine-844L | R5:5302 | 6 | fine wheel 2-5 px | wait=1500; top@2904, down@4409; older left [3746, 5531] | 21:04:43→21:04:57 | 11.72→11.5 | OK | [entry-flicker x1] |  |
| 766 | ngfine-844L | R5:5302 | 7 | fine wheel 2-5 px | wait=1500; top@2503, down@4009; older left [3716, 5498] | 21:04:57→21:05:11 | 11.5→11.51 | OK |  |  |
| 767 | ngfine-844L | R6:5301 | 6 | fine wheel 2-5 px | wait=1500; top@3115, down@4624; older left [3533, 5527] | 21:04:58→21:05:15 | 11.5→11.51 | OK |  |  |
| 768 | ngfine-844L | R5:5302 | 8 | fine wheel 2-5 px | wait=1800; top@3567, down@5370; older left [3813, 5845] | 21:05:11→21:05:27 | 11.51→11.91 | FAIL | [entry-flicker x2] |  |
| 769 | ngfine-844L | R6:5301 | 7 | fine wheel 2-5 px | wait=1500; top@3241, down@4747; older left [3573, 5571] | 21:05:15→21:05:33 | 11.51→11.83 | OK |  |  |
| 770 | ngfine-844L | R5:5302 | 9 | fine wheel 2-5 px | wait=1800; top@2660, down@4461; older left [3756, 6171] | 21:05:27→21:05:42 | 11.91→11.64 | OK |  |  |
| 771 | ngfine-844L | R6:5301 | 8 | fine wheel 2-5 px | wait=1800; top@3031, down@4834; older left [3554, 5273] | 21:05:33→21:05:50 | 11.83→11.43 | OK |  |  |
| 772 | ngfine-844L | R6:5301 | 9 | fine wheel 2-5 px | wait=1800; top@3007, down@4809; older left [3535, 5218] | 21:05:50→21:06:05 | 11.43→11.38 | OK |  |  |
| 773 | gflingpage-375L | R5:5302 | 0 | touch fling (CDP) | before d=3600; gesture 3787–6585 (6 strokes); warn@176; older left [3497, 3497] | 21:06:07→21:06:23 | 11.43→11.92 | OK |  |  |
| 774 | gflingpage-375L | R6:5301 | 0 | touch fling (CDP) | before d=3600; gesture 3859–6650 (6 strokes); warn@252; older left [3516, 3516] | 21:06:07→21:06:23 | 11.43→11.92 | OK |  |  |
| 775 | gflingpage-375L | R5:5302 | 1 | touch fling (CDP) | before d=4200; gesture 4511–7198 (6 strokes); warn@301; older left [3578, 3578] | 21:06:23→21:06:40 | 11.92→12.38 | FAIL |  |  |
| 776 | gflingpage-375L | R6:5301 | 1 | touch fling (CDP) | before d=4200; gesture 4509–7126 (6 strokes); warn@301; older left [3514, 3514] | 21:06:23→21:06:40 | 11.92→12.38 | OK |  |  |
| 777 | gflingpage-375L | R5:5302 | 2 | touch fling (CDP) | before d=4800; gesture 5048–7675 (6 strokes); warn@243; older left [3506, 3506] | 21:06:40→21:06:58 | 12.38→12.36 | FAIL | [entry-flicker x1] |  |
| 778 | gflingpage-375L | R6:5301 | 2 | touch fling (CDP) | before d=4800; gesture 5118–7801 (6 strokes); warn@313; older left [3584, 3584] | 21:06:40→21:06:58 | 12.38→12.36 | OK |  |  |
| 779 | gflingpage-375L | R5:5302 | 3 | touch fling (CDP) | before d=3600; gesture 3895–6404 (6 strokes); warn@290; older left [3507, 3507] | 21:06:58→21:07:13 | 12.36→12.19 | OK |  |  |
| 780 | gflingpage-375L | R6:5301 | 3 | touch fling (CDP) | before d=3600; gesture 3928–6634 (6 strokes); warn@275; older left [3557, 3557] | 21:06:58→21:07:15 | 12.36→12.19 | OK |  |  |
| 781 | gflingpage-375L | R5:5302 | 4 | touch fling (CDP) | before d=4200; gesture 4573–7065 (6 strokes); warn@365; older left [3556, 3556] | 21:07:13→21:07:29 | 12.19→12.12 | OK |  |  |
| 782 | gflingpage-375L | R6:5301 | 4 | touch fling (CDP) | before d=4200; gesture 4414–6788 (6 strokes); warn@208; older left [3550, 3550] | 21:07:15→21:07:31 | 12.19→11.87 | OK |  |  |
| 783 | gflingpage-375L | R5:5302 | 5 | touch fling (CDP) | before d=4800; gesture 5196–7957 (6 strokes); warn@389; older left [3601, 3601] | 21:07:29→21:07:46 | 12.12→12.39 | FAIL |  |  |
| 784 | gflingpage-375L | R6:5301 | 5 | touch fling (CDP) | before d=4800; gesture 5121–7822 (6 strokes); warn@315; older left [3594, 3594] | 21:07:31→21:07:49 | 11.87→12.39 | OK |  |  |
| 785 | gflingpage-375L | R5:5302 | 6 | touch fling (CDP) | before d=3600; gesture 3972–6964 (6 strokes); warn@365; older left [3577, 3577] | 21:07:46→21:08:03 | 12.39→11.89 | FAIL |  |  |
| 786 | gflingpage-375L | R6:5301 | 6 | touch fling (CDP) | before d=3600; gesture 3880–6650 (6 strokes); warn@273; older left [3623, 3623] | 21:07:49→21:08:06 | 12.39→11.89 | OK |  |  |
| 787 | gflingpage-375L | R5:5302 | 7 | touch fling (CDP) | before d=4200; gesture 4495–7488 (6 strokes); warn@276; older left [3545, 3545] | 21:08:03→21:08:19 | 11.89→11.4 | FAIL |  |  |
| 788 | gflingpage-375L | R6:5301 | 7 | touch fling (CDP) | before d=4200; gesture 4527–7364 (6 strokes); warn@321; older left [3553, 3553] | 21:08:06→21:08:23 | 11.89→11.28 | OK |  |  |
| 789 | gflingpage-375L | R5:5302 | 8 | touch fling (CDP) | before d=4800; gesture 5381–8122 (6 strokes); warn@540; older left [3638, 3638] | 21:08:19→21:08:36 | 11.4→11.35 | FAIL | [entry-flicker x1] |  |
| 790 | gflingpage-375L | R6:5301 | 8 | touch fling (CDP) | before d=4800; gesture 5072–7790 (6 strokes); warn@267; older left [3539, 3539] | 21:08:23→21:08:41 | 11.28→11.35 | OK |  |  |
| 791 | gflingpage-375L | R5:5302 | 9 | touch fling (CDP) | before d=3600; gesture 4034–7049 (6 strokes); warn@428; older left [3503, 3503] | 21:08:36→21:08:52 | 11.35→11.1 | FAIL | [entry-flicker x1] |  |
| 792 | gflingpage-375L | R6:5301 | 9 | touch fling (CDP) | before d=3600; gesture 3889–6490 (6 strokes); warn@284; older left [3507, 3507] | 21:08:41→21:08:57 | 11.35→10.61 | OK |  |  |
| 793 | gflingpage-375D | R5:5302 | 0 | touch fling (CDP) | before d=3600; gesture 3847–6610 (6 strokes); warn@240; older left [3479, 3479] | 21:08:58→21:09:14 | 10.61→10.43 | FAIL |  |  |
| 794 | gflingpage-375D | R6:5301 | 0 | touch fling (CDP) | before d=3600; gesture 3995–6452 (6 strokes); warn@387; older left [3588, 3588] | 21:08:58→21:09:14 | 10.61→10.43 | OK |  |  |
| 795 | gflingpage-375D | R5:5302 | 1 | touch fling (CDP) | before d=4200; gesture 4478–8403 (6 strokes); warn@271; older left [3483, 3483] | 21:09:14→21:09:32 | 10.43→11.06 | FAIL |  |  |
| 796 | gflingpage-375D | R6:5301 | 1 | touch fling (CDP) | before d=4200; gesture 4488–7196 (6 strokes); warn@281; older left [3509, 3509] | 21:09:14→21:09:31 | 10.43→11.06 | OK |  |  |
| 797 | gflingpage-375D | R6:5301 | 2 | touch fling (CDP) | before d=4800; gesture 5138–7717 (6 strokes); warn@329; older left [3485, 3485] | 21:09:31→21:09:49 | 11.06→10.54 | OK |  |  |
| 798 | gflingpage-375D | R5:5302 | 2 | touch fling (CDP) | before d=4800; gesture 5270–7920 (6 strokes); warn@464; older left [3504, 3504] | 21:09:32→21:09:49 | 11.06→10.54 | FAIL | [entry-flicker x1] |  |
| 799 | gflingpage-375D | R6:5301 | 3 | touch fling (CDP) | before d=3600; gesture 3829–6553 (6 strokes); warn@223; older left [3603, 3603] | 21:09:49→21:10:05 | 10.54→12.46 | OK |  |  |
| 800 | gflingpage-375D | R5:5302 | 3 | touch fling (CDP) | before d=3600; gesture 3811–6524 (6 strokes); warn@202; older left [3523, 3523] | 21:09:49→21:10:05 | 10.54→12.46 | FAIL |  |  |
| 801 | gflingpage-375D | R5:5302 | 4 | touch fling (CDP) | before d=4200; gesture 4449–6903 (6 strokes); warn@243; older left [3511, 3511] | 21:10:05→21:10:22 | 12.46→12.3 | FAIL |  |  |
| 802 | gflingpage-375D | R6:5301 | 4 | touch fling (CDP) | before d=4200; gesture 4419–7053 (6 strokes); warn@214; older left [3519, 3519] | 21:10:05→21:10:23 | 12.46→12.3 | FAIL |  |  |
| 803 | gflingpage-375D | R5:5302 | 5 | touch fling (CDP) | before d=4800; gesture 5026–7733 (6 strokes); warn@219; older left [3485, 3485] | 21:10:22→21:10:39 | 12.3→11.5 | OK |  |  |
| 804 | gflingpage-375D | R6:5301 | 5 | touch fling (CDP) | before d=4800; gesture 5114–7710 (6 strokes); warn@308; older left [3559, 3559] | 21:10:23→21:10:40 | 12.3→11.5 | OK |  |  |
| 805 | gflingpage-375D | R5:5302 | 6 | touch fling (CDP) | before d=3600; gesture 3941–6520 (6 strokes); warn@336; older left [3558, 3558] | 21:10:39→21:10:55 | 11.5→11.32 | FAIL |  |  |
| 806 | gflingpage-375D | R6:5301 | 6 | touch fling (CDP) | before d=3600; gesture 3848–6511 (6 strokes); warn@240; older left [3481, 3481] | 21:10:40→21:10:56 | 11.5→10.98 | OK |  |  |
| 807 | gflingpage-375D | R5:5302 | 7 | touch fling (CDP) | before d=4200; gesture 4418–7137 (6 strokes); warn@213; older left [3495, 3495] | 21:10:55→21:11:12 | 11.32→10.85 | FAIL | [entry-flicker x1] |  |
| 808 | gflingpage-375D | R6:5301 | 7 | touch fling (CDP) | before d=4200; gesture 4585–7364 (6 strokes); warn@374; older left [3572, 3572] | 21:10:56→21:11:14 | 10.98→10.85 | OK |  |  |
| 809 | gflingpage-375D | R5:5302 | 8 | touch fling (CDP) | before d=4800; gesture 5174–7936 (6 strokes); warn@371; older left [3522, 3522] | 21:11:12→21:11:29 | 10.85→10.15 | FAIL |  |  |
| 810 | gflingpage-375D | R6:5301 | 8 | touch fling (CDP) | before d=4800; gesture 5011–7483 (6 strokes); warn@207; older left [3501, 3501] | 21:11:14→21:11:31 | 10.85→10.37 | OK |  |  |
| 811 | gflingpage-375D | R5:5302 | 9 | touch fling (CDP) | before d=3600; gesture 4014–6591 (6 strokes); warn@399; older left [3569, 3569] | 21:11:29→21:11:45 | 10.15→11.39 | FAIL |  |  |
| 812 | gflingpage-375D | R6:5301 | 9 | touch fling (CDP) | before d=3600; gesture 3868–6513 (6 strokes); warn@264; older left [3540, 3540] | 21:11:31→21:11:47 | 10.37→10.88 | OK |  |  |
| 813 | dnx6-375L | R6:5301 | 0 | wheel 40 px up / 20 px down | wait=600; top@2611, down@3213; older left [3599, 3599] | 21:14:30→21:14:44 | 15.73→14.57 | OK |  |  |
| 814 | dnx6-375L | R6:5301 | 1 | wheel 40 px up / 20 px down | wait=600; top@1805, down@2411; older left [3556, 3556] | 21:14:44→21:14:57 | 14.57→14.82 | OK |  |  |
| 815 | dnx6-375L | R6:5301 | 2 | wheel 40 px up / 20 px down | wait=900; top@2148, down@3054; older left [3601, 3601] | 21:14:57→21:15:10 | 14.82→14.45 | OK |  |  |
| 816 | dnx6-375L | R6:5301 | 3 | wheel 40 px up / 20 px down | wait=900; top@2006, down@2915; older left [3719, 3719] | 21:15:10→21:15:24 | 14.45→13.52 | OK |  |  |
| 817 | dnx6-375L | R6:5301 | 4 | wheel 40 px up / 20 px down | wait=1200; top@2039, down@3245; older left [3620, 3620] | 21:15:24→21:15:37 | 13.52→13.77 | OK |  |  |
| 818 | dnx6-375L | R6:5301 | 5 | wheel 40 px up / 20 px down | wait=1200; top@1821, down@3025; older left [3565, 3565] | 21:15:37→21:15:50 | 13.77→13.62 | OK |  |  |
| 819 | dnx6-375L | R6:5301 | 6 | wheel 40 px up / 20 px down | wait=1500; top@2075, down@3578; older left [3551, 3551] | 21:15:50→21:16:03 | 13.62→14.21 | OK |  |  |
| 820 | dnx6-375L | R6:5301 | 7 | wheel 40 px up / 20 px down | wait=1500; top@1916, down@3418; older left [3614, 3614] | 21:16:03→21:16:17 | 14.21→13.39 | OK |  |  |
| 821 | dnx6-375L | R6:5301 | 8 | wheel 40 px up / 20 px down | wait=1800; top@2170, down@3976; older left [3686, 3686] | 21:16:17→21:16:30 | 13.39→13.67 | OK |  |  |
| 822 | dnx6-375L | R6:5301 | 9 | wheel 40 px up / 20 px down | wait=1800; top@2047, down@3849; older left [3665, 3665] | 21:16:30→21:16:43 | 13.67→13.04 | OK |  |  |
| 823 | dnx6-375D | R6:5301 | 0 | wheel 40 px up / 20 px down | wait=600; top@2290, down@2894; older left [3497, 3497] | 21:16:45→21:16:58 | 13.04→13.35 | OK |  |  |
| 824 | dnx6-375D | R6:5301 | 1 | wheel 40 px up / 20 px down | wait=600; top@2033, down@2635; older left [3593, 3593] | 21:16:58→21:17:12 | 13.35→13.46 | OK |  |  |
| 825 | dnx6-375D | R6:5301 | 2 | wheel 40 px up / 20 px down | wait=900; top@1846, down@2748; older left [3527, 3527] | 21:17:12→21:17:25 | 13.46→13.64 | OK |  |  |
| 826 | dnx6-375D | R6:5301 | 3 | wheel 40 px up / 20 px down | wait=900; top@2064, down@2968; older left [3582, 3582] | 21:17:25→21:17:38 | 13.64→15.57 | OK |  |  |
| 827 | dnx6-375D | R6:5301 | 4 | wheel 40 px up / 20 px down | wait=1200; top@1967, down@3171; older left [3557, 3557] | 21:17:38→21:17:51 | 15.57→14.17 | OK |  |  |
| 828 | dnx6-375D | R6:5301 | 5 | wheel 40 px up / 20 px down | wait=1200; top@2017, down@3220; older left [3647, 3647] | 21:17:51→21:18:05 | 14.17→14.35 | OK |  |  |
| 829 | dnx6-375D | R6:5301 | 6 | wheel 40 px up / 20 px down | wait=1500; top@1979, down@3495; older left [3557, 3557] | 21:18:05→21:18:18 | 14.35→14.96 | OK |  |  |
| 830 | dnx6-375D | R6:5301 | 7 | wheel 40 px up / 20 px down | wait=1500; top@1925, down@3468; older left [3656, 3656] | 21:18:18→21:18:31 | 14.96→14.39 | OK |  |  |
| 831 | dnx6-375D | R6:5301 | 8 | wheel 40 px up / 20 px down | wait=1800; top@1931, down@3734; older left [3511, 3511] | 21:18:31→21:18:44 | 14.39→13.83 | OK |  |  |
| 832 | dnx6-375D | R6:5301 | 9 | wheel 40 px up / 20 px down | wait=1800; top@1995, down@3797; older left [3569, 3569] | 21:18:44→21:18:58 | 13.83→13.92 | OK |  |  |
| 833 | dnx6-844L | R6:5301 | 0 | wheel 40 px up / 20 px down | wait=600; top@2985, down@3589; older left [3583, 3583] | 21:18:59→21:19:12 | 13.92→13.56 | OK |  |  |
| 834 | dnx6-844L | R6:5301 | 1 | wheel 40 px up / 20 px down | wait=600; top@2363, down@2971; older left [3526, 3942] | 21:19:12→21:19:26 | 13.56→13.38 | OK |  |  |
| 835 | dnx6-844L | R6:5301 | 2 | wheel 40 px up / 20 px down | wait=900; top@2164, down@3067; older left [3510, 3976] | 21:19:26→21:19:40 | 13.38→13.15 | OK |  |  |
| 836 | dnx6-844L | R6:5301 | 3 | wheel 40 px up / 20 px down | wait=900; top@2264, down@3187; older left [3569, 4406] | 21:19:40→21:19:53 | 13.15→12.48 | OK |  |  |
| 837 | dnx6-844L | R6:5301 | 4 | wheel 40 px up / 20 px down | wait=1200; top@2130, down@3335; older left [3542, 3911] | 21:19:53→21:20:07 | 12.48→13.72 | OK |  |  |
| 838 | dnx6-844L | R6:5301 | 5 | wheel 40 px up / 20 px down | wait=1200; top@2097, down@3301; older left [3527, 3924] | 21:20:07→21:20:21 | 13.72→14.86 | OK |  |  |
| 839 | dnx6-844L | R6:5301 | 6 | wheel 40 px up / 20 px down | wait=1500; top@2116, down@3626; older left [3500, 4195] | 21:20:21→21:20:35 | 14.86→14.2 | OK |  |  |
| 840 | dnx6-844L | R6:5301 | 7 | wheel 40 px up / 20 px down | wait=1500; top@2258, down@3762; older left [3487, 4222] | 21:20:35→21:20:48 | 14.2→14.3 | OK |  |  |
| 841 | dnx6-844L | R6:5301 | 8 | wheel 40 px up / 20 px down | wait=1800; top@2536, down@4358; older left [3607, 4353] | 21:20:49→21:21:03 | 14.3→14.8 | OK |  |  |
| 842 | dnx6-844L | R6:5301 | 9 | wheel 40 px up / 20 px down | wait=1800; top@2412, down@4214; older left [3533, 4093] | 21:21:03→21:21:17 | 14.8→13.11 | OK |  |  |
| 843 | drepro6-375L | R6:5301 | 0 | wheel | during d=1000; gesture 1384–5962 (21 strokes); warn@379; older left [4040, 5722] | 21:21:18→21:21:33 | 13.11→12.33 | OK |  |  |
| 844 | drepro6-375L | R6:5301 | 1 | wheel | during d=1600; gesture 1887–5682 (18 strokes); warn@280; older left [4119, 5296] | 21:21:33→21:21:47 | 12.33→12.31 | OK |  |  |
| 845 | drepro6-375L | R6:5301 | 2 | wheel | during d=2200; gesture 2655–5189 (12 strokes); warn@449; older left [3489, 4818] | 21:21:47→21:22:02 | 12.31→12.1 | OK |  |  |
| 846 | drepro6-375L | R6:5301 | 3 | wheel | during d=2800; gesture 3224–4977 (8 strokes); warn@408; older left [3694, 3694] | 21:22:02→21:22:16 | 12.1→12.48 | OK |  |  |
| 847 | drepro6-375L | R6:5301 | 4 | wheel | after d=300; gesture 617–2659 (8 strokes); warn@226; older left [3488, 4001] | 21:22:16→21:22:27 | 12.48→11.64 | OK |  |  |
| 848 | drepro6-375L | R6:5301 | 5 | wheel | after d=600; gesture 858–2728 (8 strokes); warn@253; older left [3532, 3958] | 21:22:27→21:22:38 | 11.64→12.08 | OK |  |  |
| 849 | drepro6-375L | R6:5301 | 6 | wheel | during d=1000; gesture 1372–5485 (20 strokes); warn@367; older left [4086, 5111] | 21:22:38→21:22:52 | 12.08→11.51 | OK |  |  |
| 850 | drepro6-375L | R6:5301 | 7 | wheel | during d=1600; gesture 1889–6384 (19 strokes); warn@284; older left [4169, 5436] | 21:22:52→21:23:07 | 11.51→11.76 | OK |  |  |
| 851 | drepro6-375L | R6:5301 | 8 | wheel | during d=2200; gesture 2429–5378 (13 strokes); warn@223; older left [3591, 4967] | 21:23:07→21:23:21 | 11.76→11.71 | OK |  |  |
| 852 | drepro6-375L | R6:5301 | 9 | wheel | during d=2800; gesture 3114–4877 (8 strokes); warn@309; older left [3509, 3509] | 21:23:22→21:23:35 | 12.14→12.55 | OK |  |  |
| 853 | drepro6-844L | R6:5301 | 0 | wheel | during d=1000; gesture 1211–5635 (21 strokes); warn@205; older left [3467, 4852] | 21:23:36→21:23:51 | 12.55→13.34 | OK |  |  |
| 854 | drepro6-844L | R6:5301 | 1 | wheel | during d=1600; gesture 1828–5729 (20 strokes); warn@220; older left [3473, 4704] | 21:23:51→21:24:06 | 13.34→13.59 | OK |  |  |
| 855 | drepro6-844L | R6:5301 | 2 | wheel | during d=2200; gesture 2542–5744 (16 strokes); warn@335; older left [3563, 3563] | 21:24:06→21:24:20 | 13.59→13.5 | OK |  |  |
| 856 | drepro6-844L | R6:5301 | 3 | wheel | during d=2800; gesture 3086–6372 (16 strokes); warn@280; older left [3506, 3506] | 21:24:20→21:24:36 | 13.5→14.19 | OK |  |  |
| 857 | drepro6-844L | R6:5301 | 4 | wheel | after d=300; gesture 639–3013 (8 strokes); warn@330; older left [3660, 3660] | 21:24:36→21:24:48 | 14.19→15.14 | OK |  |  |
| 858 | drepro6-844L | R6:5301 | 5 | wheel | after d=600; gesture 940–2787 (8 strokes); warn@335; older left [3543, 3543] | 21:24:48→21:25:00 | 15.14→15.12 | OK |  |  |
| 859 | drepro6-844L | R6:5301 | 6 | wheel | during d=1000; gesture 1302–5820 (21 strokes); warn@295; older left [3491, 5183] | 21:25:00→21:25:15 | 15.12→15.36 | OK |  |  |
| 860 | drepro6-844L | R6:5301 | 7 | wheel | during d=1600; gesture 1863–5926 (20 strokes); warn@255; older left [3523, 4787] | 21:25:15→21:25:29 | 15.36→14.48 | OK |  |  |
| 861 | drepro6-844L | R6:5301 | 8 | wheel | during d=2200; gesture 2709–5966 (16 strokes); warn@444; older left [3545, 3545] | 21:25:29→21:25:45 | 14.48→14.58 | OK |  |  |
| 862 | drepro6-844L | R6:5301 | 9 | wheel | during d=2800; gesture 3072–6546 (16 strokes); warn@267; older left [3550, 3550] | 21:25:45→21:26:01 | 14.58→14.46 | OK |  |  |
