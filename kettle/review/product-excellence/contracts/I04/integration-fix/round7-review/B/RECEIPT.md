# Round 7 review · Lane B (the banner) · RECEIPT (in progress)

Checks and receipts only. **No verdict.** No app code, tests or maker files edited; nothing committed or pushed.

- **Wall clock:** start 2026-10-11T03:23:55Z · end _(pending)_
- **Model / effort:** Claude Opus 5.5 (`claude-opus-5-5`); reasoning effort not inspectable.
- **Under review:** R7 = trial merge `b39202f` (integration `2e9095c` + `pe/r7-banner@7ba0d98`), `kettle/src` tree
  `6db18ada524d3ca6354151ee59a5e3e8c239c604` (checked with `git rev-parse HEAD:kettle/src` in `/home/user/wt/rv7-r7`).
- **Servers used (orchestrator's; never stopped):** R7 dev + debug API http://127.0.0.1:5301 · INT `0d58c5e` (BEFORE,
  warning is a toast) http://127.0.0.1:5303. The production previews :5321 / :5323 were not used (see "Not run").
- **Packet read:** `/home/user/wt/r7a/kettle/review/product-excellence/contracts/I04/ROUND7-READY-FOR-REVIEW.md`,
  including (f) BLOCKED / UNKNOWN and "Measured limits of this design".

_(results below are filled in as runs land)_

## Method

- **Probes** (all in `/home/user/wt/rv7-r7/kettle/.tmp/B/`, git-ignored; copies in `B/probes/`, sha256 in
  `B/probes/SHA256SUMS.txt`): `blib.mjs` (shared helpers), `read.mjs` (checks 1, 2, 8), `cover.mjs` (checks 3, 4),
  `behave.mjs` (checks 5, 6), `truth.mjs` (End early while saving fails: wording), `markdone-LEAD.mjs` (the LEAD's
  `markdone.mjs`, byte-identical: sha256 `50f2593d…cd067ad`, same as `LEAD/probes/SHA256SUMS.txt`), `summarize.py`,
  and the slot runner `worker.sh` + `tasks.txt` (a prioritised task list; each `job<N>.sh` is one slot-holding
  worker that pulls the next task, so whatever slot time Lane B got went to the highest-priority runs first).
- **Every run:** its own fresh browser context (disposable profile), Chromium 1.56 (Playwright) + SwiftShader, DPR 2
  under 900 px wide (DPR 1 at 1440), `isMobile` under 900 px, touch enabled, `html{font-size:150%|200%!important}` for
  large text. Every browser went through `tools/slots.py run --lane B --n 1`.
- **Inputs are real:** `page.mouse.wheel` in fixed px steps (20 / 53 / 100), CDP `Input.dispatchTouchEvent` drags
  (finger held still before lift, so no fling), `page.touchscreen.tap`, `page.mouse.click`, `page.keyboard.press`
  (Tab, ArrowUp/Down, Enter). No `scrollIntoView` / `scrollTo` / `scrollBy` / `scrollTop` writes, no synthetic
  `pointerenter`, no test-only timer changes; toasts run on their real timers.
- **Setup by the debug API only** (labelled in each probe): `seed('newbie')`, a saved timer, localStorage filled to
  `QuotaExceededError`, **one app save that then really fails** (`timer.setState({})` → the persisted write throws
  `QuotaExceededError`), `ff` to the end of a brew / break, and (check 6) freeing the fillers and the app's next saves.
  Toasts for checks 3/4 are raised with the app's own `toast()` (dynamic import of `/src/ui/Toast.tsx`, default
  timers), as in the LEAD/M7a probes.
- **Observation hooks** (init script, no behaviour change): `Storage.prototype.setItem` wrapped to log each
  `kettle:*` write's outcome with a timestamp (the original is called and any error re-thrown); a MutationObserver
  logging every addition of warning text (`/storage is full|can’t save|couldn’t save|Not saved/i`) inside any
  `aria-live` / `role=status|alert|log` region, and every add/remove of the warning element.

## Static facts (no browser)

- `kettle/src` on `b39202f` = `6db18ada…` (as the packet states). Between INT `0d58c5e` and R7 the persistence,
  detection and restore code is **unchanged**: `git diff --stat 0d58c5e b39202f -- kettle/src/lib kettle/src/progress
  kettle/src/timer kettle/src/screens/home/shims kettle/src/settings` is empty; R7 keeps
  `onStorageWriteError(warnSaveFailed)` (`src/app/flow.ts:183`), which now calls `raiseSaveWarning`.
- `tests/integrity.spec.ts` lines 1–949 are byte-identical on R7, on INT and on M1's `3f00b57` (diff run here).
- Banner CSS (`src/app/SaveWarning.module.css`): no `animation`, no `transition`, tokens `--honey-soft`,
  `--honey-soft-edge`, `--honey`, `--ink`. Token values (`src/styles/tokens.css`): light bg `#fff1cc` / edge
  `#f5da92` / text `#3b2a20` → text contrast **12.16:1**, edge vs bg 1.22:1; dark bg `#433629` / edge `#5c4a31` /
  text `#fcefe3` → **10.34:1**, edge 1.38:1. Hues (HSL): light bg 44° (s 1.0, l 0.90), dark bg 30° (s 0.24, l 0.21),
  icon tile `--honey` 41° (s 1.0, l 0.62); for comparison berry (alarm) 348°, persimmon (focus) 17° (s 0.80,
  l 0.54), sky (rest) 203°. Computed values from the live pages are in the check 8 table below.
- Focus ring: global `:focus-visible { outline: 3px solid var(--focus-ring) }` (`src/styles/global.css:106`),
  `--focus-ring` `#2477b8` light / `#8fd0ff` dark. The summary note's own button (`.noteAction`) has no rule of its
  own and relies on this global ring.
- **Wording that can claim "saved"** (grep of R7 `src`): End-early toast — `"N minutes of focus, kept in this tab: not saved
  yet"` when `saveWarningActive()` is already true at `timer:stop`, otherwise `"Saved N minutes of focus"`
  (`src/app/flow.ts:261-265`; so it depends on whether a save failed *before* the stop event is handled); End sheet pill `"N minutes of focus will be saved"`
  (`src/screens/focus/parts/EndSheet.tsx:44`, unconditional, same on INT); screen-reader line `"Kettle’s off. N
  minutes of focus saved."` (`src/timer/announce.ts:53`, unconditional, same on INT). The packet discloses the last
  two. `truth.mjs` measures what is actually shown when End is the *first* save to fail (see check 4/6 below).
- Unit tests (vitest, no browser): R7 `saveWarning`, `progress/storageFull`, `timer/storageFull`,
  `progress/portability`, `progress/merge`: **39/39 passed**; INT (same files minus `saveWarning`): **37/37 passed**.
  Logs `B/logs/unit/`.
