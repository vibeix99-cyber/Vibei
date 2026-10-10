# LEAD working notes (round-6 review), not the verdict

Model: Claude Opus 5.5 (claude-opus-5-5); reasoning effort not inspectable.
Scratch: /tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/rv6/LEAD/ ($S)
Probes: /home/user/wt/rv6-r6/kettle/.tmp/LEAD/ (git-ignored)

## Step 1, code review (done 18:25–18:45 UTC)

- Revisions: e866118 = R6, src 05bb3f8 == 51521cf:kettle/src == 091249a:kettle/src. INT 0d58c5e src 1fc4a1b. M1 3f00b57 src 3c58bf9.
- flow.ts blob 7a5ed2e and integrity.spec.ts blob 6a70e2b are identical at 3f00b57, 51521cf and e866118;
  `git diff --stat 3f00b57 e866118 -- flow.ts integrity.spec.ts` prints nothing.
- Toast.tsx vs 3f00b57: only the Toaster call site (+drawn state, onExitComplete). toastLiftBottom() and useToastAbove()
  are unchanged (verified in the diff hunk: the only hunk is @@ -79,13 +79,18 @@ in Toaster()).
- R5 trial 20671eb → R6: only Toast.module.css, Toast.tsx, toast-room.spec.ts. StatusBar/Home.css/FocusScreen*/statusbar
  spec/a11y spec/a11y-probes have the same blobs as R5 and 33a72e6.
- INT already has a hold rule (protectedControlsUnderToasts, zone [min(region.top, bottom-170), bottom], data-toast-above
  controls on Today). That matters when classifying hold-rule residuals (keyboard (d)) against INT.

### Construction argument, checked against the CSS
- Holds for ONE action toast: the warning is first (order -1), scrollTop is clamped to [0, max], the live box is
  bottom-aligned in the region, padding-bottom 2px, max-height 100cqh-2px (cqh resolves to .region, the only size
  container), transform none !important beats inline/WAAPI transforms. Layout is per-frame, with no stale state.
- **Breaks with TWO action toasts.** `.list:has(.action) > .toast:has(.action) { order: -1 }` gives every action
  toast order -1, and DOM order breaks the tie. When an action toast is older than the warning, the warning is second,
  and at scrollTop 0 its box starts below the first toast and runs past the room's bottom, over the dock. M1's zone-2
  check (the warning's own rect) then takes it away; M1 re-shows it as the newest, which is still second, so it loops.
  Action toasts in the app: Composer "Crossed off. Nice work." (Undo, 5 s, on Today), PWA "A fresh brew of Kettle is
  ready." (Update, duration Infinity, idle screens), History "Brew deleted" (Undo, Stats), DataSection "Backup
  restored" (Undo, Settings). The packet's (b) says "with any set of toasts" and "No toast id is special-cased", but the
  argument assumes a single action toast.
- Reproduced (actionpair.mjs; real CDP tap on "Mark done", real timers, storage really full):
  R6 375x667@200 light: the warning was added 11× and removed 10× in 5.3 s; its box was 162–476 px with the room ending
  at 324 and the dock at 334 (169 frames over the dock); its opacity cycled 0→1→0 every ~0.5 s; "Save backup" was
  clipped. It settled only when "Crossed off" timed out. Clip $S/actionpair2/clip-*.webm; frames $S/frames/ap-r6/f064,
  f066, f073 (blink) and f090 (settled).
  INT 375x667@200 light: 1 add, 0 removals, 476/480 frames at full opacity, 0 over the dock. But INT at 200 % has D3
  (the warning rises past the top of the screen), so at 200 % the comparison is mixed. Pending: 150 % and landscape
  comparisons (R6 vs INT vs R5).

## Step 2, evidence audit (M2)
- repro6.mjs: real timers, no pointerenter, mouse.wheel / CDP touch only, no programmatic list scroll; debug API used for
  setup only (seed, leaves, startFocus, ff, end('user')). The Checker-r5 probes in w1fix-m2/.tmp/w1fix/chk-r5 match the
  Checker's originals byte for byte (sha256), and the hashes in /tmp/rv6-servers/probe-sha256.txt match.
- repro6-final.jsonl: 60 runs. My re-analysis (audit/repro_audit.py) agrees with the log: one warning add per run, two
  own-end removals (844 touch #3, #5), max(warning bottom − room bottom) = −2 px, 0 box/drawn/hit frames. Caveats:
  frame gaps up to 251 ms (SwiftShader); the dock gap is as low as 2 px (the boundary of the 2-px slack, the entry
  rise).
- Clips: frames extracted from 375x667-light and 844x390-light (ffmpeg -r 2; the Playwright ffmpeg has no fps filter
  and cannot demux mp4). They match the logs.

## Step 3, visual gate
- REFERENCE opened: K01 01-home.png, K02 07-summary.png, K04 -frames.jpg. The K04 mp4 cannot be decoded here: the only
  ffmpeg demuxes WebM only and there is no system ffmpeg.
- AFTER: waiting for L4's R6 captures. M2's 091249a set has the same src; first look at 375x667 home-warning:
  BEFORE/AFTER are consistent with the packet.

## Two-action-toast state: results (actionpair.mjs; real tap on "Mark done", real timers, storage full; 7 s per run)

| Config | R6 e866118 adds/removals | INT 0d58c5e | R5 20671eb |
|---|---|---|---|
| 375x667@200 light | 11/10 (run 1), 11/10 (run 2); box 162–476, room ends 324, dock 334 | 1/0 | 1/0 |
| 375x667@200 dark | 12/11 | 1/0 | n/a |
| 844x390@200 light | 11/10 (box up to 111 px below the room) | 1/0 | 2/1 (entry flicker) |
| 667x375@150 dark | 11/10 (box up to 58 px below the room) | 1/0 | 2/1 (entry flicker) |
| 375x667@150 light | 1/0 (the content fits the room) | 1/0 | n/a |
| 390x844@100, 375x667@100, 1440@100 | 2/1 each (entry: y:18 slide, 2–6 px over the dock at opacity 0) | 1/0 each | 375@100: 1/0 |

The loop ends only when "Crossed off" (5 s) times out. Each re-add is a new polite live-region addition.
Attribution: r6's `.list:has(.action) > .toast:has(.action) { order: -1 }` applies to every action toast. R5 has no
loop, and neither does INT.

### Unbounded variant (pwapair.mjs = actionpair + a toast with exactly PwaUpdatePrompt's options, raised through the app's
### own toast() as labelled synthetic setup, since the dev server cannot produce a SW update; 11 s recording)
| Config | R6 adds/removals, last removal | INT |
|---|---|---|
| 375x667@200 light | 28/27, last at 15.6 s (Crossed off left at 5.7 s); box up to 305 px below the room | 1 add, 1 removal at 12.6 s (its own 12 s end) |
| 667x375@150 dark | 28/27, last at 13.7 s (Crossed off left at 5.3 s) | 1 add, 1 removal at 12.5 s (its own end) |
While an update toast is up, the warning never settles: it blinks about twice a second and is re-added to the live
region each time, and "Save backup" is never reachable.

### 100 % entry hide/re-show (R6 2/1 vs INT 1/0)
The y:18 entry slide puts the box 2–6 px over the dock while it is at opacity 0; M1's own-box check pulls it at about
190 ms and re-shows it at about 250 ms. R5 shows the same class (844@200 and 667@150 entries). r6 does not change
normal-room entry. This is M1's approved behaviour, recorded as non-blocking in r4/r5 (owner M1/F11).

### Probes
/home/user/wt/rv6-r6/kettle/.tmp/LEAD/actionpair.mjs and pwapair.mjs. Outputs: $S/actionpair2/ (first R6 repro plus clip),
$S/ap-R6, $S/ap-INT (plus clip), $S/ap-R5, $S/pp2-R6, $S/pp2-INT (clips), logs in $S/logs/.

## L1 receipt: trace-checked (see trace/L1-TRACE.md)
The results trace to raw data and clips. race-x zeros count. natural-x zeros count only against the R5-alone control
(375L, 844L). repro6 and the extra gestures do not count (controls failed); the orchestrator's alone-rerun is pending.
Page-scroll chain on R5 and R6 needs an INT comparison.

## L4 phase 1 (captures): trace-checked, and the visual gate on these images
- Metas: 43 sets, revisions e866118 / 0d58c5e, 0 page errors.
- REFERENCE → BEFORE → AFTER, opened at full size (all 100 % unless stated):
  - **Home with the warning:**
    - 375x667 light: M2 pair, L4 set.
    - 844x390 dark @100: M2 pair. 844x390 light @200: L4 pair. R6 reads the opening, with "Save backup" as a sticky
      action masking the line behind it; INT's opening and button are off-screen above.
    - 1440 dark: L4 pair, identical.
    - 390x844 light @200: R6.
  - **Focus with the warning and toasts:** 375x667 light (M2) and 390x844 light (L4). On R6 the warning is held, but
    the two ordinary toasts cover the countdown digits and status line. INT covers them with three toasts. A
    pre-existing I10 / Finding 5 class against PRESERVE 4; not worse.
  - **Break's over with toasts:** 375x667 dark (L4). R6 keeps every control clear and covers the title and sentence for
    the 3.2 s toasts. INT covers "Mark it done". The D4 trade-off, accepted in r5 (Still open 9).
  - **Summary after level-up:** 390x844 dark (L4), identical (the K02 composition with the unlock card; the warning is
    held off the summary).
  - **Standard states:**
    - 01 Home: 390 light identical; 375 light shows the status bar on one row (the I04 r1 fix, closer to K01); 844
      light identical; 1440 light identical apart from date data.
    - 07 summary at 390 dark and 08 summary end at 375 light: the final line clears the sticky footer.
    - 10 break-over at 390 light: the timing-dependent "Recipe done" toast sits above "Mark it done".
    - 09 break at 375 dark: blue rest, sipping Chai, K04's tea frame.
- Preserve list: cream and purple identity; approved Chai (reading, cheering, sipping); orange focus and blue rest;
  docked "Put the kettle on · 25 min"; five wrapping categories; 15/25/50/Custom (under the dock on phones, visible at
  1440); compact summary with sticky Tea time/Skip and final-line clearance; break-over composition. All seen and
  unchanged.
- The LEAD-D1 blink is not in L4's states (no second action toast). It is evidenced in lead-d1/ (clips for every
  configuration).
