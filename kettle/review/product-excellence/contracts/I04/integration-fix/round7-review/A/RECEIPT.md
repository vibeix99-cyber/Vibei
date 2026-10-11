# Lane A (known defects) receipt, round-7 review — IN PROGRESS (partial; nothing below is a pass until the tables say so)

Lane **A**. Checks and receipt only: **no verdict**. No application code, tests or maker files edited; nothing committed
or pushed. Orchestrator servers never stopped.

| | |
|---|---|
| Wall-clock start (UTC) | 2026-10-11 03:23:56 |
| Wall-clock end (UTC) | (in progress) |
| Model / effort | Claude Opus 5.5 (`claude-opus-5-5`); reasoning effort: not inspectable |
| Under review | R7 trial merge `b39202f` (worktree `/home/user/wt/rv7-r7`, clean, `kettle/src` `6db18ada524d…`), http://127.0.0.1:5301 |
| Controls | R5 `20671eb` :5302 (R5-D1) · INT `0d58c5e` :5303 (BEFORE; M2 defects) · `e866118` :5304 (LEAD-D1) |

## Method (applies to every run)

- **Browser gate:** every browser launch went through `python3 -I …/round7-review/tools/slots.py run --lane A --n 1 -- …`
  (one Chromium or one Playwright worker per call). `/proc/loadavg` is logged at the start and end of every series
  (`runs/series.log`, `specs/specs.log`) and per run inside each jsonl (`loadStart`, `loadEnd`).
- **Isolation:** a new Playwright context (empty, disposable profile) for every run; one Chromium per probe process.
  Phones: `isMobile`, touch, DPR 2; desktop DPR 1. SwiftShader. Large text `html{font-size:150%|200%!important}`.
- **Input:** real only — `page.mouse.wheel`, CDP `Input.dispatchTouchEvent` drags, `page.touchscreen.tap` /
  `page.mouse.click`. No `scrollIntoView` / `scrollTo` / `scrollBy` / `scrollTop` writes, no synthetic
  `pointerenter`, no held toasts, no timer changes. Toasts expire on their real timers (3.2 s default, 5 s with an
  action; the update-prompt-shaped toast has `duration: Infinity`).
- **Debug API = setup only** (labelled in each probe): newbie seed, `progress.setState` one leaf below a level-up,
  filling `localStorage` until `QuotaExceededError` (checked), `startFocus`, `ff`, `timer.end('user')`; and in LEAD-D1
  case 2 the update-prompt toast raised through the app's own `toast()` (PwaUpdatePrompt's options).
- **Control first:** for each probe × configuration the control series ran before the R7 series in the same chain
  (`runs/series.log` timestamps).

(results filled in as runs finish)
