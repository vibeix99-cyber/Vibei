# LEAD-D1 evidence: the storage-full warning behind an older action toast (short rooms)

LEAD Checker, round 6. Revisions:
- R6: trial `e866118` (src `05bb3f8`), http://127.0.0.1:5301
- INT: `0d58c5e` (src `1fc4a1b`), http://127.0.0.1:5303
- R5: `20671eb` (src `b38ad5e`), http://127.0.0.1:5302

Every run used a fresh Playwright context (a disposable profile), went through `tools/slots.py --lane LEAD`, and ran
on Chromium headless with SwiftShader under mobile emulation (DPR 2, touch).

## Mechanism (code)

In `src/ui/Toast.module.css` (r6), `.list:has(.action) > .toast:has(.action) { order: -1; transform: none !important;
max-height: calc(100cqh - 2px) }` applies to **every** toast that carries an action, and DOM order breaks the tie.
When an action toast is older than the storage-full warning, the warning comes second. At list offset 0 its layout
box then starts below the first toast and runs past the room's bottom, over the docked start. M1's
`protectedUnderToasts()` (zone 2, the warning's own rect) takes it away. M1 re-shows it as the newest toast, which
is second again, and the cycle repeats. The packet's (b) "with any set of toasts" assumes there is only one action
toast.

Action toasts in the app:
- Composer "Crossed off. Nice work." (Undo, 5 s, Today);
- PwaUpdatePrompt "A fresh brew of Kettle is ready." (Update, `duration: Infinity`, idle screens);
- History "Brew deleted" (Undo);
- DataSection "Backup restored" (Undo).

## Reproduction (real input, real timers)

1. Fresh profile, `?debug`, newbie seed; text size via `html{font-size:N%}` (as M2's probes do).
2. Start a brew with the intention "Chapter 3 notes", fast-forward 3 min with `__kettle.ff`, end it with
   `end('user')`. This is setup only.
3. On Today, wait for the End toasts to time out. The composer shows "Carried from your last brew · Mark done".
4. Fill localStorage until `QuotaExceededError` (setup).
5. Make a **real tap** on "Mark done" (Playwright `locator.tap()`: a CDP touch after a hit-target check; the route stays
   `#/`). The Composer raises "Crossed off. Nice work." with Undo. The failing save raises the warning 250 ms later.
6. Record every animation frame for 7 s (11 s in pwapair). The recorder logs warning add/remove events, opacity, the
   warning's box, the region's bottom and the docked controls' top.

`pwapair.mjs` is the same flow plus, before the tap, a toast raised through the app's own `toast()` with exactly
PwaUpdatePrompt's options. This is **labelled synthetic setup**: the dev server cannot produce a service-worker update.

## Results

Counts are warning adds/removals (`runs/*/…jsonl`, `logs/*.txt`).

| Config | R6 | INT | R5 |
|---|---|---|---|
| 375x667 @200 light | **11/10** (`actionpair2`), **11/10** (`ap-R6`) | 1/0 | 1/0 |
| 375x667 @200 dark | **12/11** | 1/0 | n/a |
| 844x390 @200 light | **11/10** | 1/0 | 2/1 (entry flicker) |
| 667x375 @150 dark | **11/10** | 1/0 | 2/1 (entry flicker) |
| 375x667 @150 light | 1/0 (the stack fits the room) | 1/0 | n/a |
| 390x844, 375x667, 1440x900 @100 | 2/1 each (entry: the y:18 slide over the dock) | 1/0 each | 375@100 dark 1/0 |
| pwapair 375x667 @200 light | **28/27**, last removal at 15.6 s, after "Crossed off" left at 5.7 s | 1 add, then its own 12 s end | n/a |
| pwapair 667x375 @150 dark | **28/27**, last removal at 13.7 s | 1 add, then its own 12 s end | n/a |

On R6 in the looping configurations:
- the warning's box is 58–305 px below the room;
- its opacity cycles 0 → ~1 → 0 about every 0.5 s;
- "Save backup" is clipped below the room;
- each re-add is a new addition to the polite live region.

INT is steady: at 375x667 @150 it is fully readable, with "Save backup" usable above the start. At 200 % INT has the
old D3 (the warning rises past the top of the screen).

## Files

- `probes/actionpair.mjs` (sha256 `1776d4da…`), `probes/pwapair.mjs` (`9664581d…`). `*-v.mjs` in the worktree's
  `.tmp/LEAD/` are the same probes with video for every configuration (one-line diff).
- `runs/actionpair/` is **INVALID**: the first attempt, whose tap landed on the docked start and started a brew. It is
  kept for honesty and not counted.
- `runs/actionpair2/`: the first valid R6 run, with clip `clip-actionpair-R6-…-375x667-t200-light.webm`. Frames
  `frames/ap-r6/f064.png`, `f066.png` and `f073.png` show the blink; `f090.png` shows it settled after "Crossed off"
  left.
- `runs/ap-R6`, `runs/ap-INT` (with clip), `runs/ap-R5`: per-config jsonl plus `first`/`t1` screenshots for each
  configuration.
- `runs/pp2-R6`, `runs/pp2-INT`: the pwapair runs (with clips for 375x667 @200 light).
- `runs/apv-*`, `runs/pv-*` (added later): clips for every other configuration.
- `logs/`: stdout of every run.

## Clip set for every configuration (added 21:50 UTC; `runs/apv-*`, `runs/pv-*`; video changes timing slightly)

| Config | R6 adds/removals | INT adds/removals |
|---|---|---|
| 375x667 @200 dark | 11/10 | 1/0 |
| 844x390 @200 light | 9/8 | 1/0 |
| 667x375 @150 dark | 9/8 | 1/0 |
| 375x667 @150 light | 1/0 | 1/0 |
| 390x844 @100 light, 375x667 @100 dark | 1/0 each (no entry flicker this time) | 1/0 each |
| 1440x900 @100 light | 2/2 | 1/1 (the known desktop entry gap, F11; outside LEAD-D1) |
| pwapair 667x375 @150 dark | **29/28**, last removal at 16.3 s | 1 add, own 12 s end at 12.6 s |

Pixel scan of the 844x390 @200 clips (`../trace/clipscan.py`, crop x230 y140 300×20; `../trace/scan-clip-*.txt`): on R6
the crop alternates light/dark about 20 times from 12.7 s to the end (the loop window). On INT it settles dark (the
warning) from 15.2 s.
