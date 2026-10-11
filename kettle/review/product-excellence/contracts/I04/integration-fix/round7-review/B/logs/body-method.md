## Method

- **Probes** (written for this lane in `/home/user/wt/rv7-r7/kettle/.tmp/B/`, git-ignored; copies and sha256 in
  `B/probes/`): `blib.mjs` (shared helpers), `read.mjs` (checks 1, 2, 8), `cover.mjs` (checks 3, 4), `behave.mjs`
  (checks 5, 6), `truth.mjs` (End early while saving fails: what is said), `markdone-LEAD.mjs` (the LEAD's
  `markdone.mjs`, byte-identical: sha256 `50f2593d…cd067ad`, as in `LEAD/probes/SHA256SUMS.txt`), `dbg.mjs` (setup
  check), `summarize.py`, and the runner `worker.sh` + `tasks.txt` (a prioritised task list pulled by whichever Lane B
  job held a slot; the list was re-ordered and trimmed during the session as time ran — the final list is in
  `probes/`, the worker log `logs/job1.log` shows what ran and when).
- **Every run:** its own fresh browser context (disposable profile), Chromium (Playwright 1.56) + SwiftShader, DPR 2
  under 900 px wide (DPR 1 at 1440), `isMobile` under 900 px, touch enabled, `html{font-size:150%|200%!important}`
  for large text; URL `http://127.0.0.1:<port>/?debug&theme=<light|dark>[&nooktime=day]#/`. Every browser ran
  through `tools/slots.py run --lane B --n 1`. Revision per run = the server's (5301 → R7 `b39202f`, 5303 → INT
  `0d58c5e`); every jsonl row records `base`, `rev`, viewport, text size, theme, start and end times.
- **Inputs are real:** `page.mouse.wheel` in fixed px steps (20 / 53 / 100, 40–120 on Settings), CDP
  `Input.dispatchTouchEvent` drags (finger held still before lift, so no fling), `page.touchscreen.tap`,
  `page.mouse.click`, `page.keyboard.press` (Tab, ArrowUp/Down, Enter). No `scrollIntoView` / `scrollTo` /
  `scrollBy` / `scrollTop` writes, no synthetic `pointerenter`, no test-only timer changes; toasts run on real timers.
- **Setup by the debug API only** (labelled in each probe): `seed('newbie')` (a returning person's profile), a saved
  timer, localStorage filled to `QuotaExceededError`, then an app save that really fails: the app's own next timer
  write after the fill failed in every run within ~0.1–0.4 s; the probe also grows the settings `name` by trailing
  spaces until a write throws (`failASave`; trailing spaces do not render). `ff` to the end of a brew / break;
  check 6 frees the fillers and makes the app's next saves (`timer` / `progress` / `settings` `setState`), as the
  integrity spec does. Toasts for checks 3/4 are raised with the app's own `toast()` (dynamic import of
  `/src/ui/Toast.tsx`, default timers) with the LEAD closecheck's **synthetic texts** ("Recipe done: … +15 leaves",
  "Saved 12 minutes of focus", "Cozy level 5!") — the "Saved 12 minutes of focus" seen in those screenshots is this
  setup text, **not app wording**.
- **Observation hooks** (init script; behaviour unchanged): `Storage.prototype.setItem` wrapped to log each `kettle:*`
  write's outcome with a timestamp (the original is called; errors re-thrown); a MutationObserver logging every
  addition of warning text (`/storage is full|can’t save|couldn’t save|Not saved/i`) inside any `aria-live` /
  `role=status|alert|log` region, and every add / remove of the warning element (R7 `[data-save-warning]`, INT
  `#toast-kettle:save-failed`).
- **"Readable"** = every text line of the warning (Range client rects grouped by line, button excluded) is, at some
  rest position, inside the viewport **and** `elementFromPoint` at 3 points on the line lands inside the warning (so
  the docked start, the tab bar or a toast over it counts as not readable). **"Reachable"** = `elementFromPoint` at
  Save backup's centre lands on it. **"Covered"** (check 3) = a painted toast box (clipped by the list's scrollport,
  opacity > 0.05) overlaps the control by > 1 px, or `elementFromPoint` at any of 5 points of the control misses it;
  sampled on 12 animation frames 1.5 s after the toasts were raised.

## Static facts (no browser)

- Between INT `0d58c5e` and R7 the persistence, detection and restore code is **unchanged**: `git diff --stat
  0d58c5e b39202f -- kettle/src/lib kettle/src/progress kettle/src/timer kettle/src/screens/home/shims
  kettle/src/settings` is empty. R7 keeps `onStorageWriteError(warnSaveFailed)` (`src/app/flow.ts:183`), which now
  calls `raiseSaveWarning`. `tests/integrity.spec.ts` lines 1–949 are byte-identical on R7, INT and M1's `3f00b57`.
- Banner CSS (`src/app/SaveWarning.module.css`): no `animation`, no `transition`; tokens `--honey-soft`,
  `--honey-soft-edge`, `--honey`, `--ink`. Values (`src/styles/tokens.css`): light bg `#fff1cc`, edge `#f5da92`,
  text `#3b2a20`; dark bg `#433629`, edge `#5c4a31`, text `#fcefe3`. The banner's `Save backup` is the shared
  `Button` (secondary), which has hover/press transitions (transform, box-shadow 0.09 s; background, filter 0.15 s);
  no keyframe animation anywhere in the banner (computed, see check 8).
- Focus ring: global `:focus-visible { outline: 3px solid var(--focus-ring); outline-offset: 3px }`
  (`src/styles/global.css:106`), `--focus-ring` `#2477b8` light / `#8fd0ff` dark. The summary note's own button
  (`.noteAction`) has no focus rule of its own and relies on the global ring (not measured by keyboard in this lane).
- Wording that can say "saved" (grep of R7 `src`): End-early toast — "N minutes of focus, kept in this tab: not saved
  yet" when `saveWarningActive()` is already true at `timer:stop`, otherwise "Saved N minutes of focus"
  (`src/app/flow.ts:261-265`); End sheet pill "N minutes of focus will be saved" (`EndSheet.tsx:44`, unconditional,
  same on INT); screen-reader line "Kettle’s off. N minutes of focus saved." (`src/timer/announce.ts:53`,
  unconditional, same on INT). The packet discloses the last two. `truth.mjs` measures the first (check 4/6 extra).
- Unit tests (vitest, no browser): R7 `app/saveWarning`, `progress/storageFull`, `timer/storageFull`,
  `progress/portability`, `progress/merge`: **39 / 39 passed**; INT (same files minus `saveWarning`): **37 / 37
  passed**. Logs `logs/unit/`.
