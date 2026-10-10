Every row: browser = Chromium 141.0.7390.37 headless, fresh context per run, gate lane L2. "sha" = first 16 hex of the probe's sha256 in `probes/SHA256SUMS.txt` (final version of the file). Logs are in `logs/<job>.log`, per-run data in `raw/<dir>/`.

| job (raw dir) | URL : port, revision | probe (sha) | input | configuration | runs | result |
|---|---|---|---|---|---|---|
| read-R6-phones-light, -dark | http://127.0.0.1:5301, R6 e866118 | read.mjs ({sha:read.mjs}), lib.mjs ({sha:lib.mjs}) | mouse wheel 20 px; CDP touch drags 24 px | 375×667, 390×844 × 150/200 % × alone/stack × light/dark | 32 | check 1: 0 A,C,D,E,F,G,H; B 14 of 16 alone runs |
| read-R6-land | same | same | same | 844×390 × 150/200 % × alone/stack × light/dark | 16 | 0 A,C,D,E,F,G,H; B 7 of 8 alone |
| read-R6-coarse | same | same | wheel 20/53/100 px | 667×375, 200 %, alone/stack, light/dark | 12 | check 2 (R6) |
| read-R6-extra | same | same (`extra.sh`) | wheel 20 px; touch 24 px; flick 120 px | 667×375 at 125/150 % (wheel); 568×320 at 100 % (wheel, touch); 667×375 at 200 % (touch, flick); alone/stack; both themes | 24 | 0 hides/jumps; E/F in the touch/flick runs at 667×375 200 % (see issue 4) |
| nat-R6 (`nat.sh`) | same | read.mjs NAT=1 | wheel 20 px down to the older toasts, wait 600/1200/1800 ms, wheel back up; touch at 1200 ms | stack at 375×667, 844×390, 667×375 @200 %; 667×375, 844×390 @150 %; both themes; 2 reps | 52 | R5-D1: 0 hides, 0 jumps |
| read-INT-coarse | http://127.0.0.1:5303, INT 0d58c5e | read.mjs | wheel 20/53/100 px | 667×375, 200 %, alone/stack, light/dark | 12 (6 alone: warning never shown) | check 2 (INT) |
| read-INT-phones | same | read.mjs | wheel 20 px, touch | 375×667, 390×844, 150/200 %, alone/stack, light | 16 {{INTPHONES}} | see issues 3 and 5 |
| read-INT-land | same | read.mjs | wheel 20 px | 844×390, 200 %, alone/stack, light | {{INTLANDRUNS}} | {{INTLAND}} |
| desk-R6-v0 | R6 | desk.mjs ({sha:desk.mjs}) | none after setup | 1440×900, 100/200 %, light/dark, alone/stack/plain3, 2 reps | 24 | check 3 |
| desk-INT-v0 | INT | desk.mjs | none after setup | same | 24 (8 alone: warning never shown) | check 3 |
| ctl-R6-375b, -390b, -844b, -1440 | R6 | ctl.mjs ({sha:ctl.mjs}) | real taps / clicks, real wheel/touch scroll; app `toast()` default timers | 375×667, 390×844, 844×390, 1440×900 × 100/200 % × light/dark | 16 configurations, 338 windows, 218 taps (206 worked; the 12 that did not were controls off-screen, issue 2) | check 4 |
| ctl-INT-375, ctl-INT-844 | INT | ctl.mjs | same | 375×667 and 844×390 × 100/200 %, light | {{INTCTL}} | check 4 INT comparison |
| sb-R6: d1, d1race, zoom; d2-R6 | R6 | d1.mjs ({sha:d1.mjs}), d1race.mjs ({sha:d1race.mjs}, copy of M2's with the import path changed; original sha in `ORIGINAL-SOURCES-SHA256.txt`), zoom.mjs ({sha:zoom.mjs}), d2.mjs ({sha:d2.mjs}) | live viewport changes by `page.setViewportSize` | see check 5 | 28 / 36 / 84 / 264 | 0 failures in each |
| sb-INT | INT | same | same | control, light, 1 rep | 16 / 20 / 7 / 132 | d1 14 fail, d1race 16 fail, d2 69 fail, zoom 0 fail (probes can fail) |
| specs-R6, specs2-R6, specs3, specs4, specs5 | R6 (KETTLE_PORT 5301, KETTLE_PWA_PORT 5311); specs3 also INT worktree on 5303 | repo specs via `specs.sh` ({sha:specs.sh}), `specs2.sh` ({sha:specs2.sh}), `specs3.sh` ({sha:specs3.sh}), `specs4.sh` ({sha:specs4.sh}), `specs5.sh` ({sha:specs5.sh}), `--workers=1` | Playwright tests | `statusbar`, `toast-room`, `a11y` | 30 + 5 + 4 + 2 + 4 (+2 on INT) | {{SPECS}} |

**Superseded or discarded runs (data kept in `logs/` but not used):**
- `t1` (first 4-run trial of read.mjs, 19:34): quota filled before the brew, so the warning appeared at brew start; judge replaced.
- `read-R6-phones-*` ran 19:38-19:46 with `lib.mjs` that counted lines only at opacity ≥ 0.98; the later edit (≥ 0.5) only changes the per-frame first-line flag at partial opacity, which the offline judge does not use.
- `ctl-R6-375` (first, 20:07-20:44) and `ctl-R6-390` (first): earlier probe versions (no clip of toasts scrolled out of the list room, weaker scrolling); replaced by `ctl-R6-375b` and `ctl-R6-390b`. `ctl-R6-844` (first) replaced by `ctl-R6-844b`. The first `ctl` (20:00) was stopped after one configuration because the intention was not typed (no "Mark it done"). `ctl-R6-390c` was started and stopped (time box). `ctl-R6-390b` has the clip fix but not the 2-toast windows or the final scroll strategies; its off-screen result (`over-c`, 927) stands.
- `d2` inside `sb-R6` (92 false failures): the probe counted a decorative clipped "sheen" layer and visually hidden text as past the edge; fixed and rerun as `d2-R6`.
- `desk-R6`, `desk-INT`, `desk-R6-stack`: first desk runs (with video, stack flow filled the quota before the brew); the INT and stack ones were stopped; `desk-R6-v0`/`desk-INT-v0` replace them.
- `nat-INT` was queued and cancelled.
