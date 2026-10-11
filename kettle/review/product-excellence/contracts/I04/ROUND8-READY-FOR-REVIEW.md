# I04 round 8 (R7-D1: the toast room on Break's over, landscape phones, 200 % text) · READY FOR REVIEW

**Maker:** M8, newly launched for round 8 (reviewed nothing in rounds 7–8). I submit READY FOR REVIEW only; I issue no
verdicts and do not approve my own work.
**Scope:** exactly one blocker, **R7-D1** (`round7-review/DEFECT-PACKET-R7.md`; `CHECKER-integration-fix-r7.md` §
"Defect packet — R7-D1"). Single owner of M7b's scrollable break panel (`src/screens/focus/**`) and the round-4 toast
lift / room rules (`src/ui/Toast.tsx`, `Toast.module.css`).
**Model:** Claude Opus 5.5 (`claude-opus-5-5`).
**Evidence root:** `contracts/I04/integration-fix/r8/M8/` (probes with their sha256, every run's jsonl and stdout,
captures). Rows from my earlier revisions are kept, labelled, in `superseded-23c781b/` and `superseded-9732fb1/`; nothing
below is taken from them.

## (a) Hashes

| | |
|---|---|
| **Final code revision** | `f3c9357` on `pe/r8-toastroom`; `kettle/src` tree **`42e106daaf0628ee8429fb6131ab29848931f367`**. The packet commit on top changes review files only (same `kettle/src`); its hash is in the commit log and in my report. |
| Base | `7ba0d98` (`pe/r7-banner`, round 7 combined; `kettle/src` `6db18ad`, the same tree as trial merge `b39202f`). |
| **Trial merge** of `f3c9357` onto integration HEAD `61a60b2` (local, detached worktree `/home/user/wt/r8-trial`, not pushed) | `1c972f99d1ac8d223fd4db07250d8bf5e2240f71`; `kettle/src` **`42e106daaf0628ee8429fb6131ab29848931f367`**, the same as the revision's. Integration has no `kettle/src` or `kettle/tests` change since `2e9095c`. The trial merge of the packet commit itself is in my report; it has the same `kettle/src`. |
| Controls this session | `b39202f` on :5301 (R7-D1 reproduced, (d)); INT `0d58c5e` on :5303. |

## (b) Cause, and why the fix removes it

**Cause (reproduced this session on `b39202f`, see (d)).**
- `toastLiftBottom()` floats the toasts' room above the topmost on-screen `[data-toast-above]`. On Break's over that is
  the whole action group (`FocusScreen.tsx` `.overDock`, round-4 D4).
- M7b's scrollable panel (`.panel:has(> .timer, > .over) { overflow: hidden auto }`) brings that group to the top of a
  landscape phone at 200 % text at the end of its range.
- The room above the group is then a strip. `useToastRoom()`'s `MIN_ROOM_PX` fallback cannot make a toast fit there,
  so the stack was cut to 11–34 px, over the top bar's words, with an action toast's action not on top.
- The room logic had nowhere to put toasts once no room was left above the controls.

**Fix (by construction, not a threshold).** A screen can now name a **dock**, a box that holds no control.
- **The dock.** The session's stage box is marked `data-toast-dock`. The stylesheet opts it in (`--toast-dock: on`)
  only in the side-by-side layout, where the stage is a column of its own beside the top bar and the panel. When the
  layout is stacked (portrait), the top bar sits over the stage, so the stage is never a dock there.
- **The check.** Every time it measures, `toastDock()` also confirms that no control of any layer intersects the box
  (`button, a[href], input, select, textarea, [role=button], [tabindex]`). It also requires the box to be at least
  `MIN_ROOM_PX` each way. The stage column is 351 px tall at 667×375 and 366 px at 844×390.
- **When the stack moves.** It moves into the dock when the room above the controls cannot hold it whole. That room is
  bounded below the top bar's controls (round 7's Close fix, unchanged) and its words above the toasts' column. "Cannot
  hold it whole" means any of these:
  - the room is shorter than the stack's own height (each toast's `scrollHeight`, the gaps and the list's end padding);
  - the room is shorter than `MIN_ROOM_PX`;
  - the room is short enough for the stylesheet's squeezed one-line layout (`@container toast-room (max-height: 4em)`).

  In the dock nothing can be covered, at any scroll offset.
- **It stays docked** while toasts are up, so it never jumps back and forth as the panel scrolls. It leaves the dock
  when the dock goes: another screen, a stacked layout, or a control over the box.
- **Folding.** A docked stack can still be taller than its dock. Three toasts at 200 % on a 667×375 phone are 429 px in
  a 351 px column. Then the stack **folds its oldest toasts to their first line**, as many as it takes to fit.
  - A folded toast shows the opening of its message with an ellipsis, using the icon's width as well. Its action stays
    where it always is.
  - The whole message stays in the DOM, and the polite live region read it on arrival.
  - An unfolded toast keeps its natural height.
- **Same-frame updates.** The room now follows a scroll **inside the scroll event** (`flushSync`), before that frame's
  animation callbacks and paint. Before, the room was re-measured only every 250 ms. A panel scrolled under a toast
  could therefore be drawn under it for up to 250 ms: on `b39202f` that was 21–53 covered frames per run, all during or
  just after input.

**Screens without a dock** keep the old room logic: Today, Settings, Stats, Nook and every portrait screen. The only
change there is when the room is re-measured: also on every scroll and every stack change. The portrait rows are
identical to `b39202f`'s (32 of 32 samples), and so are the desktop rows (12 of 12).

## (c) Changed files (diff base `7ba0d98`, the round-7 combined revision under trial merge `b39202f`)

| File | Change |
|---|---|
| `src/ui/Toast.tsx` | New: `toastDock()`, `stackHeight()`, `topBarBottom()` and `foldToFit()`. `useToastRoom()`: the dock decision, kept while toasts are up; folding; a re-measure on every scroll (in the event, with `flushSync`) and on every stack change (a layout effect). `toastRoomTop()`: while the stack is docked, it measures against the centred column the stack returns to. `Toaster`: applies the dock's inset and sets `data-docked`. `toastLiftBottom()` and the `MIN_ROOM_PX` fallback are unchanged. |
| `src/ui/Toast.module.css` | Appended only: `.region[data-docked] { padding: 0 8px }`, and the folded toast's style (icon hidden, message clamped to one line). No existing rule changed. |
| `src/screens/focus/FocusScreen.tsx` | `data-toast-dock=""` on the stage box, plus a comment. |
| `src/screens/focus/FocusScreen.module.css` | `--toast-dock: on` on `.stageBox`, inside the side-by-side media query only. |
| `tests/toast-room.spec.ts` | Appended only: one new test with 2 rows (667×375 wheel light; 844×390 touch dark), "the update prompt and every toast stay whole and tappable, never over a control, on Break's over scrolled to its end". Existing tests are untouched. |

**Not changed.** `git diff --stat 7ba0d98 <rev>` lists only the five files above. In particular:
- the storage banner (`src/app/SaveWarning*`, `saveWarning.ts`) and the summary note;
- `src/lib/storage.ts`, `src/timer/**`, `src/progress/**` and `src/app/flow.ts`;
- the Close fix: `toastRoomTop()` behaves exactly as before on every undocked path (only its column is computed differently while docked);
- M7b's panel CSS and its reach.

**History on `pe/r8-toastroom`:**

| Commit | Change |
|---|---|
| `97d130d` | The dock |
| `23c781b` | The top bar counts; folding |
| `9732fb1` | Same-frame scroll; new test |
| `ab583ef` | The bar's words, not its box (keeps desktop at 200 % as `b39202f`) |
| `f3c9357` | A folded toast's opening on the icon's width |
| Packet commit | Review files only, same `kettle/src` |

## (d) Control: `b39202f` reproduces R7-D1 in this session (before any of my zeros count)

**The lead's probe, unedited.** Copy `.tmp/M8/toastroom2.mjs`, sha256 `7123da04ab3a894b…` (identical to the lead's), run
on :5301 at 16:37 UTC. Rows are in `control/toastroom2-b39202f.jsonl` with frames `control/v2-b39202f-*.png`.

| Configuration | Panel at its top | Panel at its end | Back at top |
|---|---|---|---|
| 667×375 @200 light | update toast 146/146 px, Update on top | **52 px box, 11 px visible, Update NOT on top, over "Next: brew 2 of"** | whole again |
| 844×390 @200 dark | 146/146, Update on top | **52 px box, 26 px visible, Update NOT on top, over "Next: brew 2 of"** | whole again |

This is the same as the lead's 10:51 rows. **R7-D1 reproduced.**

**My acceptance probe on the control** (`control/accept-b39202f.jsonl`, the same probe as (e), 8 runs at 667×375 and
844×390 @200, light and dark, wheel and touch):
- covered control frames: 21–53 per run (all runs);
- toast samples not whole: 13–16 of 16 per run;
- action not on top: 2–8 per run;
- samples with top-bar words under a toast: 7–10 per run.

The real taps on a toast's action activated it 1–4 times out of 7.

Even at the panel's **top**, three toasts at 667×375 are not whole on the control: "Cozy level 5!" shows 0 of 57 px, and
the Undo toast 96 of 146 with Undo not on top, under "Next: brew 2 of".

Caveat on these 8 rows: once a tap missed its action, the click or tap reached the page beneath. In the 667 rows the
panel's range then dropped from 353 to 198 px, which is consistent with "Mark it done" having been activated. Later
samples in those rows are therefore not in the same state, and the notes say "panel does not scroll". The lead's rows
above are the clean control. These rows only add that misses happen at the top, middle and end, with both inputs.

INT `0d58c5e` (:5303, this session, `lead-probe/toastroom2-0d58c5e.jsonl`): the panel cannot scroll. The update toast is
whole at 97 px with Update on top in every position, and no top-bar words are overlapped. This matches the lead.

## (e) Acceptance on the final code `f3c9357` (:5208), real input only

**Probe.** `probe/accept.mjs`, sha256 `b65020ab…`, my own. Its header documents it. Briefly:
- **Setup** as the lead's probe: Tea time by a real tap; the break's own toasts expire on their real timers.
- **Positions** top → middle → end → middle → top, reached by **real wheel** (`page.mouse.wheel`) or **real touch** (CDP
  `Input.dispatchTouchEvent` drags), aimed at the panel's lower right corner.
- **Toasts** (labelled setup, through the app's own `toast()`):
  - the update prompt, raised at the first position in `PwaUpdatePrompt`'s shape: `id 'pwa-update'`, `icon 'sparkle'`,
    `duration: Infinity`, `action Update`;
  - at every position, "Cozy level 5!" (3.2 s timer), then 'Marked “Chapter 3 notes” done' with **Undo** (5 s timer).
  That gives n = 1, 2 and 3.
- **Taps:**
  - a real **Undo** tap at every position (CDP touch on touch runs, mouse click on wheel runs);
  - **Update** at the end by the run's own input, then raised again;
  - **Update** at the final top by the *other* input.
- **Every frame** (rAF), for each of Mark it done, Put the kettle on, That's all for now and the top bar's Close:
  `elementFromPoint` at its visible centre must hit it, and no painted toast box may overlap it by more than 1 px.
- **At each sample:**
  - every toast's box, its own content height (`scrollHeight`) and its visible px (list scrollport and viewport);
  - whether it is folded;
  - whether its action is on top at its centre;
  - whether any top-bar words are under a toast.

**Results.** `accept/accept-f3c9357.jsonl`; stdout in `logs/accept-f3c9357-*.log`.

| rev | config | input | frames | covered frames (all / >400 ms after input) | samples | toasts not whole (visible<box or own>box) | folded samples | actions not on top | top-bar words under a toast | docked (per sample) | real taps activated | error / notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| f3c9357 | 844x390 @200 light | wheel | 1692 | 0 / 0 | 16 | 0 | 5 | 0 | 0 | --DDDDDDDDDDDDDD | 7/7 |  |
| f3c9357 | 667x375 @200 light | wheel | 1718 | 0 / 0 | 16 | 0 | 5 | 0 | 0 | -DDDDDDDDDDDDDDD | 7/7 |  |
| f3c9357 | 667x375 @200 light | touch | 2095 | 0 / 0 | 16 | 0 | 5 | 0 | 0 | -DDDDDDDDDDDDDDD | 7/7 |  |
| f3c9357 | 844x390 @200 light | touch | 2057 | 0 / 0 | 16 | 0 | 5 | 0 | 0 | --DDDDDDDDDDDDDD | 7/7 |  |
| f3c9357 | 844x390 @200 dark | wheel | - | - / - | 7 | 0 | 2 | 0 | 0 | --DDDDD | 2/2 | page.evaluate: Execution context was destroyed, most likely because of a navigation. |
| f3c9357 | 667x375 @200 dark | wheel | 1731 | 0 / 0 | 16 | 0 | 5 | 0 | 0 | -DDDDDDDDDDDDDDD | 7/7 |  |
| f3c9357 | 844x390 @200 dark | touch | 2049 | 0 / 0 | 16 | 0 | 5 | 0 | 0 | --DDDDDDDDDDDDDD | 7/7 |  |
| f3c9357 | 667x375 @200 dark | touch | 2113 | 0 / 0 | 16 | 0 | 5 | 0 | 0 | -DDDDDDDDDDDDDDD | 7/7 |  |
| f3c9357 | 667x375 @150 light | wheel | 1697 | 0 / 0 | 16 | 0 | 0 | 0 | 0 | -DDDDDDDDDDDDDDD | 7/7 |  |
| f3c9357 | 844x390 @150 light | wheel | 2936 | 0 / 0 | 16 | 0 | 0 | 0 | 0 | -DDDDDDDDDDDDDDD | 7/7 | middle: not reached; middle: not reached |
| f3c9357 | 667x375 @150 light | touch | 1751 | 0 / 0 | 16 | 0 | 0 | 0 | 0 | -DDDDDDDDDDDDDDD | 7/7 |  |
| f3c9357 | 844x390 @150 light | touch | 1748 | 0 / 0 | 16 | 0 | 0 | 0 | 0 | -DDDDDDDDDDDDDDD | 7/7 |  |
| f3c9357 | 667x375 @150 dark | wheel | 1666 | 0 / 0 | 16 | 0 | 0 | 0 | 0 | -DDDDDDDDDDDDDDD | 7/7 |  |
| f3c9357 | 844x390 @150 dark | wheel | 2945 | 0 / 0 | 16 | 0 | 0 | 0 | 0 | -DDDDDDDDDDDDDDD | 7/7 | middle: not reached; middle: not reached |
| f3c9357 | 667x375 @150 dark | touch | 1760 | 0 / 0 | 16 | 0 | 0 | 0 | 0 | -DDDDDDDDDDDDDDD | 7/7 |  |
| f3c9357 | 844x390 @150 dark | touch | 1735 | 0 / 0 | 16 | 0 | 0 | 0 | 0 | -DDDDDDDDDDDDDDD | 7/7 |  |
| f3c9357 | 667x375 @100 light | wheel | 1634 | 0 / 0 | 16 | 0 | 0 | 0 | 0 | -DDDDDDDD--DDDDD | 7/7 | top: panel does not scroll (max 0); middle: panel does not scroll (max 0) |
| f3c9357 | 844x390 @100 light | wheel | 1581 | 0 / 0 | 16 | 0 | 0 | 0 | 0 | -DDDDDDDD--DDDDD | 7/7 | top: panel does not scroll (max 0); middle: panel does not scroll (max 0) |
| f3c9357 | 667x375 @100 light | touch | 1615 | 0 / 0 | 16 | 0 | 0 | 0 | 0 | -DDDDDDDD--DDDDD | 7/7 | top: panel does not scroll (max 0); middle: panel does not scroll (max 0) |
| f3c9357 | 844x390 @100 light | touch | 1590 | 0 / 0 | 16 | 0 | 0 | 0 | 0 | -DDDDDDDD--DDDDD | 7/7 | top: panel does not scroll (max 0); middle: panel does not scroll (max 0) |
| f3c9357 | 667x375 @100 dark | wheel | 1615 | 0 / 0 | 16 | 0 | 0 | 0 | 0 | -DDDDDDDD--DDDDD | 7/7 | top: panel does not scroll (max 0); middle: panel does not scroll (max 0) |
| f3c9357 | 844x390 @100 dark | wheel | 1562 | 0 / 0 | 16 | 0 | 0 | 0 | 0 | -DDDDDDDD--DDDDD | 7/7 | top: panel does not scroll (max 0); middle: panel does not scroll (max 0) |
| f3c9357 | 667x375 @100 dark | touch | 1629 | 0 / 0 | 16 | 0 | 0 | 0 | 0 | -DDDDDDDD--DDDDD | 7/7 | top: panel does not scroll (max 0); middle: panel does not scroll (max 0) |
| f3c9357 | 844x390 @100 dark | touch | 1644 | 0 / 0 | 16 | 0 | 0 | 0 | 0 | -DDDDDDDD--DDDDD | 7/7 | top: panel does not scroll (max 0); middle: panel does not scroll (max 0) |
| f3c9357 | 844x390 @200 dark | wheel | 1736 | 0 / 0 | 16 | 0 | 5 | 0 | 0 | --DDDDDDDDDDDDDD | 7/7 |  |

**Every one of the 24 configuration × input runs:**
- **0 covered control frames.** About 1,560–2,950 frames per run, input frames included.
- **0 toast samples not whole.** Each toast shows all of its box, and its box is its own content height, folded or not.
- **0 actions not on top, and 0 samples with top-bar words under a toast.**
- **Real taps: 7 of 7 activated in each run (168 of 168 in all).** That is Undo ×5 and Update ×2, by CDP touch and by
  mouse click, each run using both inputs on Update. Every tapped toast was dismissed.

The "docked" column has one character per sample, in the probe's order: top n1, n2, n3; middle ×3; end ×3 and the
re-raised update prompt; middle ×3; top ×3. D = docked over the stage, - = above the controls.

At 100 % the panel does not scroll (range 0), so the probe's top, middle and end are the same place; the probe notes it.
At 844×390 @150 the panel's range is 80 px, and the wheel's 60 px step cannot land inside its 30–70 % "middle" window.
The notes say "middle: not reached", and those wheel "middle" samples were taken at 0 or 80 px. Touch reached 55 of 80
px there.

**Folded samples** come only with 3 toasts at 200 %: 5 per run, at every position. At 150 % and 100 % three toasts fit
the dock unfolded.

**One run repeated.** 844×390 @200 dark, wheel: the first run lost its page at the end position ("Execution context was destroyed", a full navigation; see (h)) after 7 clean samples. It was rerun at 17:38 UTC and passed; both rows are in the jsonl and the table above. The figures below count the 24 complete runs.

**The lead's probe on the fix.** `lead-probe/toastroom2-f3c9357.jsonl`, the same unedited copy; frames
`lead-probe/v2-f3c9357-*.png`. Combined with the control and INT:

| rev | config | case | place | panel | toasts: text, box px, visible px, action on top | top-bar words under a toast |
|---|---|---|---|---|---|---|
| b39202f | 667x375 @200 light | update | top | 0/353 | A fresh brew o 146/146 on top | none |
| b39202f | 667x375 @200 light | update | end | 353/353 | A fresh brew o 52/11 NOT on top | Next: brew 2 of  |
| b39202f | 667x375 @200 light | update | back at top | 0/353 | A fresh brew o 146/146 on top | none |
| b39202f | 844x390 @200 dark | update | top | 0/338 | A fresh brew o 146/146 on top | none |
| b39202f | 844x390 @200 dark | update | end | 338/338 | A fresh brew o 52/26 NOT on top | Next: brew 2 of  |
| b39202f | 844x390 @200 dark | update | back at top | 0/338 | A fresh brew o 146/146 on top | none |
| f3c9357 | 667x375 @200 light | update | top | 0/353 | A fresh brew o 146/146 on top | none |
| f3c9357 | 667x375 @200 light | update | end | 353/353 | A fresh brew o 186/186 on top | none |
| f3c9357 | 667x375 @200 light | update | back at top | 0/353 | A fresh brew o 186/186 on top | none |
| f3c9357 | 667x375 @200 dark | update | top | 0/353 | A fresh brew o 146/146 on top | none |
| f3c9357 | 667x375 @200 dark | update | end | 353/353 | A fresh brew o 186/186 on top | none |
| f3c9357 | 667x375 @200 dark | update | back at top | 0/353 | A fresh brew o 186/186 on top | none |
| f3c9357 | 844x390 @200 light | update | top | 0/338 | A fresh brew o 146/146 on top | none |
| f3c9357 | 844x390 @200 light | update | end | 338/338 | A fresh brew o 146/146 on top | none |
| f3c9357 | 844x390 @200 light | update | back at top | 0/338 | A fresh brew o 146/146 on top | none |
| f3c9357 | 844x390 @200 dark | update | top | 0/338 | A fresh brew o 146/146 on top | none |
| f3c9357 | 844x390 @200 dark | update | end | 338/338 | A fresh brew o 146/146 on top | none |
| f3c9357 | 844x390 @200 dark | update | back at top | 0/338 | A fresh brew o 146/146 on top | none |
| f3c9357 | 667x375 @200 light | arrive | arrive+0.5s | 0/353 | Recipe done: T 97/97; Cozy level 5! 56/56 | none |
| f3c9357 | 667x375 @200 light | arrive | after wheel to end | 353/353 | (none left: the 3.2 s timers ran out) | none |
| f3c9357 | 667x375 @200 light | arrive | end +0.6s | 353/353 | (none left: the 3.2 s timers ran out) | none |
| f3c9357 | 667x375 @200 dark | arrive | arrive+0.5s | 0/353 | Recipe done: T 97/97; Cozy level 5! 57/57 | none |
| f3c9357 | 667x375 @200 dark | arrive | after wheel to end | 353/353 | Recipe done: T 178/178; Cozy level 5! 57/57 | none |
| f3c9357 | 667x375 @200 dark | arrive | end +0.6s | 353/353 | (none left: the 3.2 s timers ran out) | none |
| f3c9357 | 844x390 @200 light | arrive | arrive+0.5s | 0/338 | Recipe done: T 97/87; Cozy level 5! 57/57 | none |
| f3c9357 | 844x390 @200 light | arrive | after wheel to end | 338/338 | (none left: the 3.2 s timers ran out) | none |
| f3c9357 | 844x390 @200 light | arrive | end +0.6s | 338/338 | (none left: the 3.2 s timers ran out) | none |
| f3c9357 | 844x390 @200 dark | arrive | arrive+0.5s | 0/338 | Recipe done: T 97/97; Cozy level 5! 57/56 | none |
| f3c9357 | 844x390 @200 dark | arrive | after wheel to end | 338/338 | (none left: the 3.2 s timers ran out) | none |
| f3c9357 | 844x390 @200 dark | arrive | end +0.6s | 338/338 | (none left: the 3.2 s timers ran out) | none |
| 0d58c5e | 667x375 @200 light | update | top | 0/353 | A fresh brew o 97/97 on top | none |
| 0d58c5e | 667x375 @200 light | update | end | 0/353 | A fresh brew o 97/97 on top | none |
| 0d58c5e | 667x375 @200 light | update | back at top | 0/353 | A fresh brew o 97/97 on top | none |
| 0d58c5e | 667x375 @200 dark | update | top | 0/353 | A fresh brew o 97/97 on top | none |
| 0d58c5e | 667x375 @200 dark | update | end | 0/353 | A fresh brew o 97/97 on top | none |
| 0d58c5e | 667x375 @200 dark | update | back at top | 0/353 | A fresh brew o 97/97 on top | none |
| 0d58c5e | 844x390 @200 light | update | top | 0/338 | A fresh brew o 97/97 on top | none |
| 0d58c5e | 844x390 @200 light | update | end | 0/338 | A fresh brew o 97/97 on top | none |
| 0d58c5e | 844x390 @200 light | update | back at top | 0/338 | A fresh brew o 97/97 on top | none |
| 0d58c5e | 844x390 @200 dark | update | top | 0/338 | A fresh brew o 97/97 on top | none |
| 0d58c5e | 844x390 @200 dark | update | end | 0/338 | A fresh brew o 97/97 on top | none |
| 0d58c5e | 844x390 @200 dark | update | back at top | 0/338 | A fresh brew o 97/97 on top | none |
| 0d58c5e | 667x375 @200 light | arrive | arrive+0.5s | 0/353 | Recipe done: T 97/97; Cozy level 5! 57/57 | none |
| 0d58c5e | 667x375 @200 light | arrive | after wheel to end | 0/353 | Recipe done: T 97/97; Cozy level 5! 57/57 | none |
| 0d58c5e | 667x375 @200 light | arrive | end +0.6s | 0/353 | Recipe done: T 97/97; Cozy level 5! 57/57 | none |
| 0d58c5e | 667x375 @200 dark | arrive | arrive+0.5s | 0/353 | Recipe done: T 97/97; Cozy level 5! 57/57 | none |
| 0d58c5e | 667x375 @200 dark | arrive | after wheel to end | 0/353 | Recipe done: T 97/97; Cozy level 5! 57/57 | none |
| 0d58c5e | 667x375 @200 dark | arrive | end +0.6s | 0/353 | (none left: the 3.2 s timers ran out) | none |
| 0d58c5e | 844x390 @200 light | arrive | arrive+0.5s | 0/338 | Recipe done: T 97/97; Cozy level 5! 57/57 | none |
| 0d58c5e | 844x390 @200 light | arrive | after wheel to end | 0/338 | Recipe done: T 97/97; Cozy level 5! 57/57 | none |
| 0d58c5e | 844x390 @200 light | arrive | end +0.6s | 0/338 | (none left: the 3.2 s timers ran out) | none |
| 0d58c5e | 844x390 @200 dark | arrive | arrive+0.5s | 0/338 | Recipe done: T 97/97; Cozy level 5! 57/57 | none |
| 0d58c5e | 844x390 @200 dark | arrive | after wheel to end | 0/338 | Recipe done: T 97/97; Cozy level 5! 56/56 | none |
| 0d58c5e | 844x390 @200 dark | arrive | end +0.6s | 0/338 | (none left: the 3.2 s timers ran out) | none |

In the "arrive" case at 844 light, the "Recipe done" toast shows 87 of 97 px at "arrive+0.5s". This is on the undocked
path, identical to `b39202f`'s, and comes from its entry spring (the lead's own `b39202f` row has 56/57 at the same
instant). At +0.7 s my probe has every arriving toast whole. On the fix, the two ordinary toasts' 3.2 s timers run out
during the lead probe's 14-step wheel, so "after wheel to end" is mostly empty. My probe raises toasts at the end
instead.

**Close / Ambience / Mute sweep.** Lane C's `closecheck2.mjs`, an unedited copy (sha256 `863c0a92…`), on :5208.
States: focus running, paused break, Break's over (carried). Panel at top and at end by real wheel; 1 and 3 toasts;
real taps on Ambience, Mute and Close. Configurations 667×375 and 844×390 @200, light and dark.
Rows: `closecheck/closecheck2-f3c9357.jsonl`.

- **0 covered control frames** in 6,506 frames over 48 frame rows: Ambience and Mute 3,523 visible frames each; Add 5 / Pause / End 1,137 each; Skip break / Resume break / Start next brew 1,139 each; Mark it done / Put the kettle on / That's all for now 1,463 each; Close 2,983. The settled-frame count is 0 too.
- **40 of 40 real taps activated**: Mute 16, Ambience 16, Close 8.
- The smallest visible toast in any row is 57 px, i.e. whole. 0 errors. Summary: `closecheck/summary.txt`.

**Portrait unchanged** (`geom/`, the same probe in its `geom` mode: wheel, panel top and end, n = 1 (update) and n = 3).
Configurations 375×667 and 390×844, 100 % and 200 %, light and dark, on the fix and on `b39202f`. Compared fields: the
region's rect, the list's clip, every toast's text, box, visible px and rect, the action hit, docked or not, and the
panel's scroll.

**32 of 32 samples identical** (`geom/compare.md`).

The portrait rows also show a **pre-existing** limit, identical on `b39202f`: at 375×667 @200 with 3 toasts at the
panel's end, "Cozy level 5!" shows 0 of 57 px and the Undo toast 86 of 146 px. Portrait has no dock, and the brief
requires portrait to stay as it is.

**Desktop unchanged** (`geom-desktop/`, 1440×900 @100 light, @200 light and dark): **12 of 12 samples identical** to
`b39202f` (`geom-desktop/compare.md`).

**The new test.** `tests/toast-room.spec.ts`, "the update prompt and every toast stay whole and tappable, never over a
control, on Break's over scrolled to its end", has 2 rows.
- **On `b39202f`** (`KETTLE_PORT=5301`): **2 of 2 fail** (`logs/spec-new-on-b39202f-5301.log`):
  - 667×375: update toast 52 px box with 11 px visible, Update not on top, over the bar;
  - 844×390: 26 px visible.
- **On the fix: passes.** It ran 6 of 6 with `--repeat-each=3` on `9732fb1`, and passes inside the full chromium run on
  the final code (below).

## (f) Tests on the final code `f3c9357` (= the packet commit's `kettle/src`)

| Suite | Result |
|---|---|
| `npx tsc --noEmit` | exit 0 (`logs/test-tsc.log`) |
| `npx vitest run` | **267/267 passed** (`logs/test-vitest.log`) |
| Playwright chromium, all specs: `KETTLE_PORT=5208 KETTLE_PWA_PORT=5228 npx playwright test --project=chromium --workers=2`, through the gate with `--n 2` | **74/74 passed** in 14.8 min, 0 skipped, 0 flaky (`logs/test-chromium-f3c9357.log`). This includes the 2 new R7-D1 rows and every existing `toast-room`, `break-reach`, `integrity`, `a11y`, `statusbar` and `whistle` test. |
| `--project=timer-harness --project=timer-app --project=pwa`, through the gate with `--n 2` | **29 passed, 2 skipped** of 31 in 1.7 min, 0 failed (`logs/test-timer-pwa-f3c9357.log`). Both skips are by design in `timer.spec.ts` and run only in the harness project: l.295 "infra is exercised in the harness; screens bind their own keys", and l.439 "render counter lives in the harness" (timer-app). The same 2 skips were recorded on `b39202f` in round 7. |


## (g) Captures (full size, DPR 2, same session, frozen clock)

`probe/capture.mjs` (sha256 `c55ca6a7…`):
- `page.clock.install({ time: 2026-10-11T09:00:00Z })`, then `clock.resume()`;
- `animations: 'disabled'`;
- the panel scrolled by real wheel;
- toasts through the app's `toast()`.

**BEFORE** is `b39202f` on :5301, taken 17:15–17:19 UTC. **AFTER** is `f3c9357` on :5208, taken about 17:34–17:37 UTC.
Both are in `captures/`, 24 files each: `{BEFORE-b39202f|AFTER-f3c9357}-{W}x{H}-t200-{theme}-{top|end}-{n1|n3}.png`.

| Configuration | Shots |
|---|---|
| 667×375 @200 | light and dark |
| 844×390 @200 | light and dark |
| 375×667 @200 | light |
| 390×844 @200 | light |

For each: top-n1 (update prompt), top-n3 (+ Cozy and Undo), end-n1 and end-n3.

What they show:
- **BEFORE end-n1 (landscape):** the update prompt is a sliver at the top edge behind "Next: brew 2 of".
- **AFTER end-n1:** the update prompt is whole over the stage, Update visible, the panel and top bar clear.
- **AFTER end-n3 at 667×375:** three folded toasts over the stage: "A fresh brew of… · Update", "Marked “Chapter… · Undo",
  "Cozy level 5!".
- **Portrait:** BEFORE and AFTER are the same layout.

## (h) Limits and notes (no verdicts)

- **Behaviour outside R7-D1 that the rule also changes, on purpose.**
  - On a landscape session screen, any stack that cannot fit whole above the controls and below the top bar now
    floats over the stage. This happens at 100 % and 150 % too, for example when a second toast arrives on Break's over
    at 667×375 @100.
  - On `b39202f` such a stack either scrolled inside its room, with toasts out of view, or reached over the top bar's
    words (the control rows at "top").
  - Desktop (1440×900) and every portrait size are unchanged, as measured.
- **Folding hides the icon of every folded toast**, including a one-line toast such as "Cozy level 5!" when it is among
  the oldest (cosmetic). The toast's tone is then carried by its text only.
- **A docked stack stays docked until its toasts are gone.** After scrolling back to the panel's top, the update prompt
  stays over the stage (`end` → `top` rows: `D`) instead of returning above the actions. This is deliberate: no
  jumping while scrolling.
- **Dev-server reloads.** Two probe runs, one in superseded `23c781b` and one in `f3c9357` at 844 dark wheel, lost their
  page to a full navigation mid-run ("Execution context was destroyed"). No pageerror was recorded and the vite log
  shows no reload. My reading is the dev client's reconnect-and-reload under load. This dev server has HMR and file
  watching on, by the brief's command; `tests/e2e.vite.config.ts` turns them off for this reason. The run was repeated;
  see (e).
- **Not done by me:** R7-7 (`integrity.spec.ts:1090` timing), which the defect packet also lists for the round-7 owner.
  My brief scopes me to R7-D1 only.

## (i) Files and evidence

- `probe/`: copies of every probe and runner I used, with sha256 in `probe/SHA256SUMS`:
  - `accept.mjs`, `capture.mjs`, `diag.mjs` (the frame-order diagnostic that led to `9732fb1`);
  - `toastroom2.mjs` (the lead's, unedited) and `closecheck2.mjs` (Lane C's, unedited);
  - `run_*.sh`.
- `control/`, `accept/`, `lead-probe/`, `closecheck/`, `geom/`, `geom-desktop/`, `captures/`, `logs/`.
- `superseded-23c781b/`, `superseded-9732fb1/`: rows from my earlier revisions. They are kept for the record and not
  used above.
