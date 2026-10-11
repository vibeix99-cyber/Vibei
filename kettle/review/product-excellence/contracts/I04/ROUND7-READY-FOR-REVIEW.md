# I03 × I04 round 7 (combined: M7a banner + M7b break reach + the Close fix) · READY FOR REVIEW

**Maker:** M7a. I submit READY FOR REVIEW only; I do not approve my own work.
**Implements:** option B of `contracts/I04/integration-fix/round6-review/DEFECT-PACKET-AND-OPTIONS.md` (the storage-full
warning becomes an in-page banner), merged with M7b's break reach (`pe/r7-break`), plus the mandatory fix for the
toasts over the session top bar's Close found after the merge.
**Model / effort:** Claude Opus 5.5 (`claude-opus-5-5`); reasoning effort not inspectable.
**Evidence root:** `contracts/I04/integration-fix/r7/M7a/` (probes and their diffs, every run's jsonl and stdout,
captures with per-shot notes, CLS, the integrity diff proof). Earlier, superseded runs are kept, labelled, in
`superseded-<rev>/` folders (data only); nothing below is taken from them unless it says so.

## (a) Hashes

| | |
|---|---|
| **Final code revision** | `980ef2a` on `pe/r7-banner` — the combined revision (my banner work + the merge of `pe/r7-break@38fc9c6` + the Close fix). `kettle/src` tree **`6db18ada524d3ca6354151ee59a5e3e8c239c604`**. The packet commit on top of it changes review files only (same `kettle/src`); its hash is in the commit log and in my report. |
| My revision before the merge | `77ba760` (`kettle/src` `3f71d2c`); after the note CSS: `49ea1de` = the **unfixed combined revision** used as the Close control. |
| M7b | `pe/r7-break@38fc9c6` (`kettle/src` `ba4707c`), merged with `git merge --no-ff pe/r7-break` → `eea543d`; no overlapping files, no conflicts. |
| **Trial merge** onto the current integration HEAD `f3b70d3` (scratch worktree, removed afterwards) | `d413a1fa580047e812dd40d0780ba27470f79d06`; `kettle/src` **`6db18ada524d3ca6354151ee59a5e3e8c239c604`** (equal to the final revision's: the integration branch's app code is still `0d58c5e`'s). |
| Controls | R5 `20671eb` :5302 (R5-D1), e866118 :5304 (LEAD-D1), INT `0d58c5e` :5303 (BEFORE), unfixed combined `49ea1de` served by me on :5226 from a scratch worktree (Close). |

## (b) Changed files, cause and design

Diff base `51521cf` (round 6's combined fix, containing M1's approved `3f00b57`). History on `pe/r7-banner`:
`217489c` banner (code + tests) · `41a25f4` test · `77ba760` outgoing-layer freeze · `eea543d` **merge of
`pe/r7-break@38fc9c6`** · `49ea1de` note CSS · `de7e261` Close fix + regression test · `b8cb9cb` room never folds ·
`980ef2a` room moves only under bar controls above the toasts' column · then this packet commit (review files only).

| File | Change |
|---|---|
| `src/app/flow.ts` | **Removed** the warning toast and everything that placed or held it: `SAVE_TOAST_ID`, `TOAST_ZONE_PX`, `SETTLE_MS`/`WATCH_MS`, the hold state and its 250 ms watcher, `ritualOnScreen()`, `protectedUnderToasts()`, `warningWouldBlock()`, `toastOnScreen()`, `showSaveWarning()`, `watchSaveWarning()`, `recheckSaveWarning()` and its three call sites. **Kept** M1's detection wiring (`onStorageWriteError(warnSaveFailed)`); `warnSaveFailed` hands the failure to the banner state. End-early toast: "Saved N minutes of focus" only while saving works; while it fails, "N minutes of focus, kept in this tab: not saved yet". |
| `src/app/saveWarning.ts` (new) | The warning **state**: on at the first failed save; off once every key whose save failed has been saved again (`lastWriteFailed`, re-checked every 2 s while on — storage state, not geometry). "Save backup" (`downloadBackup`, existing success/failure toasts). Its own polite live region (`#kettle-save-warning-said`, created at start-up), set **once per spell of failing saves** when the first banner/note shows (at most once a minute). `captureAnchor()`/`settleAnchor()`: when a banner appears or goes while its screen is open, the element under the last pointer/touch (or keyboard focus) is kept where it was by scrolling its scroller by however far it moved, before paint. |
| `src/app/SaveWarning.tsx` + `.module.css` (new) | `<SaveWarningBanner home=…/>` (a `<section>` named by its title, not a live region; "Save backup" an ordinary button in DOM order) and `<SaveWarningNote/>` (the summary line). Each follows the warning only while its route is current and no brew/break has just started on it, so an outgoing layer never grows one. Honey tint (`--honey-soft`, `--honey-soft-edge`, `--honey` icon tile), `--ink` text (12.2:1 light, 10.3:1 dark), the cards' `--r-lg` and 2 px edge, body type, no motion. |
| `src/screens/home/HomeScreen.tsx` | Banner in the page flow: phones under the greeting/Chai, before the goal card; side-by-side layouts (landscape phones, tablets, desktop) at the head of the right column. |
| `src/screens/settings/DataSection.tsx` | The same banner right after the "Your data" rows (Export / Import / Reset). |
| `src/screens/done/Summary.tsx` | `<SaveWarningNote/>` under the headline: "Not saved: storage is full." + **Save backup** (blocked storage: "Not saved in this browser."). |
| `src/ui/Toast.tsx` | (1) `toastLiftBottom()` no longer exported. (2) **Close fix:** `toastRoomTop()` + `useToastRoom()` — see "Close fix" below. |
| `src/ui/Toast.module.css` | Comments only; every rule unchanged. |
| `src/app/saveWarning.test.ts` (new) | Unit: on with the first failure; still on after 10 min of storage full; still on while any failed key is unsaved; off when all are saved; a later failure is a new episode; the copy never says "saved". |
| `tests/integrity.spec.ts` | **Only** the block "I03 storage-full warning never covers a control (…)" replaced (proof: `r7/M7a/tests/integrity-diff-proof.md`; lines 1–949 byte-identical to `3f00b57`). |
| `tests/toast-room.spec.ts` | The 8 warning-toast tests replaced by banner tests; the 2 "last toast fades out" tests unchanged; **new** Close regression test (light, dark). |
| `docs/areas/timer.md`, `docs/areas/progress.md` | "Storage full" rewritten for the banner. |
| M7b's files (merged, unchanged by me) | `src/screens/focus/FocusScreen.tsx`, `FocusScreen.module.css`, `parts/RoundButton.module.css`, `tests/break-reach.spec.ts`, its review files. |

**Cause addressed.** Six rounds of the same symptom came from one coupling: M1's rule decided whether the data-safety
warning could be visible by polling the warning's laid-out box, and M2's toast layout decided where that box was. The
warning is no longer in the toast layer at all, so no toast, lift, list order, list scroll, anchoring, entry transform
or other toast can move, hide or withdraw it, and nothing measures geometry to decide whether it may show.

**Design notes.** Benchmarks opened: K01 `01-home.png`, K02 `07-summary.png`, K09 `live-settings.jpg`.
- *Transferred:* K01/K09's card language (cream / plum surfaces, 2 px edge, large radius, Nunito body, Fredoka on the
  button) for a calm block that reads as part of the page; K02's compact rows for the one-line summary note.
- *Avoided:* orange (focus), blue (rest), berry (alarm), any attention motion. Greeting, Chai, status bar, categories,
  brew length, the docked "Put the kettle on · 25 min" and the sky "Change brew length" link are untouched.
- *Tone choice:* in dark theme the note's honey tint is the same family as the summary's reward/unlock card next to it
  (both honey-soft); I kept it for calm and consistency — it is a choice the reviewer may want to classify.
- *Copy:* M1's approved wording, split into a bold title and a sentence.

### Replaced tests (they asserted the old overlay placement)

`tests/integrity.spec.ts` — the block `I03 storage-full warning never covers a control (…)`, ×3 viewports (phone
390×844, phone 375×667, desktop 1440×900); lines 1–949 are byte-identical to M1's `3f00b57` (proof:
`r7/M7a/tests/integrity-diff-proof.md`):

| Removed (×3 viewports) | Why it no longer applies |
|---|---|
| "while brewing (running and paused): Add 5, Pause, Resume and End stay tappable; End opens its sheet, never a download" | asserted a held/withdrawn toast never over session controls |
| "a warning already up when the next brew starts never covers the session readout or controls (wave-1 integration regression)" | a toast raised on Stats and its withdrawal at brew start |
| "a warning raised just before 0:00 is taken away for the whistle and summary; Tea time and Skip break stay tappable; it comes back after" | the hold/withdraw/re-show cycle and the lift over Today's docked start |

| Added (×3 viewports): `I03 storage-full warning is a banner in the page (…)` |
|---|
| "nothing over the brew; the summary says the brew is not saved, with Save backup; Today and Settings show the banner in the page, said once, kept while storage is full, gone when there is room" (no warning element anywhere during the brew, running and paused; controls hit-testable; the summary's one-line note with a working Save backup; Today's banner in flow, Tab reaches Save backup in DOM order, still there after 13 s and a Settings round trip; in Settings right after the backup tools; announced exactly once; Save backup saves a file holding the unsaved brew; banner kept while full, gone after room is made) |
| "a banner that appears while Today is open moves nothing under the finger (Mark done with storage full)" (real tap; the task field and the docked start never move on screen in any frame; announced once) |

`tests/toast-room.spec.ts` — the 8 tests that measured the warning toast in the toast room:

| Removed | Replaced by |
|---|---|
| "the storage-full warning can be read and an older toast revealed by wheel / touch without the warning going away" (375×667 @200, 844×390 @200; 4 tests) and "… every older toast revealed …" (667×375 @200 level-up; 2 tests) | "the storage-full banner stays in the page, whole and steady, while the toasts in the room are read by wheel / touch" (same 6 configurations): real wheel / CDP touch over the toasts, real timers, nothing held; the banner never removed, at full opacity every frame, never moved within the page (top + scrollY), Save backup inside its box every frame; then the page is scrolled by real input and a real tap / click on Save backup saves a file |
| "an older toast timing out after the list was scrolled never moves the warning out of its room" (375×667 @200, light, dark; 2 tests, synthetic holds) | "toasts timing out, and an endless action toast, never move the banner" (375×667 @200, light, dark): real timers, an update-prompt-shaped `duration: Infinity` action toast in the room, wheel input; same banner checks |
| — | kept unchanged: "the last toast fades out where it was, never over the docked start" (375×667, 844×390) |



Added to `tests/toast-room.spec.ts` for the Close fix: "three toasts never cover the session top bar's Close or a
Break's over control, panel scrolled to its end (375×667, 200 % text, light / dark)".

**Setup note:** the "moves nothing under the finger" spec (and `late.mjs`) bring "Mark done" into view with
`scrollIntoViewIfNeeded()` **before** storage is filled and before recording starts — setup only; the tap is real.

## Close fix (mandatory after the merge)

**Defect** (found by M7b; introduced in round 7 by the combination — M7b made Break's over scroll at 200 % text, and
round 6's toast room ran from the top safe edge down to the lift above the action group): at 375×667 @200 %, Break's
over scrolled to its end, a 3-toast stack fills the room up over the top bar and covers **Close**; a real tap on Close
lands on a toast.

**Fix** (`src/ui/Toast.tsx` only; no CSS rule changed). `toastRoomTop()` looks for a visible page-level `<header>` (the
banner landmark: not inside `main`/`section`/`article`/`aside`/`nav`, not `aria-hidden`/`inert`, in the top 40 % of
the screen, not faded out such as the zen chrome) and, **only if one of its controls sits above the toasts' column**,
starts the room 24 px below that control's bottom (the list's 20 px shadow padding, which its scrollport covers, plus
4 px). The room never folds: it keeps at least 56 px above the lift, and where even that would be above the
stylesheet's own top the stylesheet's top is kept. A stack taller than the room scrolls inside it as in round 6.
Screens without such a bar (Today, Stats, Nook, Settings) never get a `top`: their room is exactly as before. The room
is now measured in a layout effect, so a new stack is never painted for a frame in the old room; the 250 ms
re-measure and the resize listener are unchanged.

**Probe** `r7/M7a/probes/closecheck.mjs` (new): fresh context per run; seed, brew and finish through the debug API
(setup); a real tap on "Tea time"; the panel scrolled to its end by **real wheel** or **CDP touch drags**; three toasts
raised through the app's own `toast()` with its default timers (labelled setup; nothing held); every animation frame for
1.2 s — Close, "Mark it done, start fresh", "Put the kettle on" and "That's all for now" hit-tested at their centres and
their boxes checked against every toast box clipped by the list's scrollport; then a **real tap / click** at one
control's centre while the three toasts are still up, recording the click's target. One run per control and input, so
every control is really tapped. Control: the unfixed combined revision `49ea1de` on :5226. `r7/M7a/runs/close/`.

**Regression test** (`tests/toast-room.spec.ts`, light and dark): against `49ea1de` it **fails in both themes** — Close
covered in 26 of 31 and 42 of 50 frames (`r7/M7a/runs/close/regression-test-on-CTL-49ea1de.txt`); on the final
revision it passes (see (d)).

| Configuration | Input | Unfixed combined `49ea1de` (:5226): runs failing · controls covered (frames) · real tap received | Final: runs failing · covered · tap received |
|---|---|---|---|
| 375×667 @200 dark | touch | 4/4 · {"close": 177, "mark": 2} · close: **no** (SPAN), mark: yes, put: yes, all: yes | 0/4 · none · close: yes, mark: yes, put: yes, all: yes |
| 375×667 @200 dark | wheel | 4/4 · {"close": 208} · close: **no** (SPAN), mark: yes, put: yes, all: yes | 0/4 · none · close: yes, mark: yes, put: yes, all: yes |
| 375×667 @200 light | touch | 4/4 · {"mark": 1, "close": 213} · close: **no** (SPAN), mark: yes, put: yes, all: yes | 0/4 · none · close: yes, mark: yes, put: yes, all: yes |
| 375×667 @200 light | wheel | 4/4 · {"close": 200} · close: **no** (SPAN), mark: yes, put: yes, all: yes | 0/4 · none · close: yes, mark: yes, put: yes, all: yes |
| 390×844 @200 light | touch | 0/1 · none · close: yes | 0/1 · none · close: yes |
| 390×844 @200 light | wheel | 1/1 · {"mark": 1} · close: yes | 0/1 · none · close: yes |
| 844×390 @200 light | touch | 0/2 · none · close: yes, all: yes | 0/2 · none · close: yes, all: yes |
| 844×390 @200 light | wheel | 0/2 · none · close: yes, all: yes | 0/2 · none · close: yes, all: yes |
| 375×667 @100 light | touch | 1/1 · {"mark": 8} · close: yes | 0/1 · none · close: yes |
| 375×667 @100 light | wheel | 1/1 · {"mark": 8} · close: yes | 0/1 · none · close: yes |
| 390×844 @100 light | touch | 1/1 · {"mark": 7, "put": 4} · close: yes | 1/1 · {"mark": 4} · close: yes |
| 390×844 @100 light | wheel | 1/1 · {"mark": 7, "put": 4} · close: yes | 1/1 · {"mark": 2} · close: yes |
| 844×390 @100 light | touch | 0/1 · none · close: yes | 0/1 · none · close: yes |
| 844×390 @100 light | wheel | 0/1 · none · close: yes | 0/1 · none · close: yes |
| 1440×900 @100 light | wheel | 0/1 · none · close: yes | 0/1 · none · close: yes |

**Toast geometry, unfixed vs final** (same runs; the region's top–bottom in CSS px and the three toasts' boxes 1.2 s
after they were raised):

| Configuration | Room top–bottom, unfixed | Room top–bottom, final | Three toasts' boxes |
|---|---|---|---|
| 375×667 @100 light touch | [8, 441] | [78, 441] | identical |
| 375×667 @100 light wheel | [8, 441] | [78, 441] | identical |
| 375×667 @200 dark touch | [8, 317] | [78, 317] | identical |
| 375×667 @200 dark wheel | [8, 317] | [78, 317] | identical |
| 375×667 @200 light touch | [8, 317] | [78, 317] | identical |
| 375×667 @200 light wheel | [8, 317] | [78, 317] | identical |
| 390×844 @100 light touch | [8, 584] | [78, 584] | identical |
| 390×844 @100 light wheel | [8, 584] | [78, 584] | identical |
| 390×844 @200 light touch | [8, 536] | [78, 536] | identical |
| 390×844 @200 light wheel | [8, 536] | [78, 536] | identical |
| 844×390 @100 light touch | [8, 174] | [8, 174] | identical |
| 844×390 @100 light wheel | [8, 174] | [8, 174] | identical |
| 844×390 @200 light touch | [8, 34] | [8, 34] | identical |
| 844×390 @200 light wheel | [8, 34] | [8, 34] | identical |
| 1440×900 @100 light wheel | [8, 434] | [8, 434] | identical |

At 100 % text, and wherever no top-bar control sits above the toasts' column, the toasts' boxes are identical; the
room's top only changes where a bar control is above the column. At 844×390 @200 % the room is 26 px on both (the lift
leaves no more; pre-existing, r6 residual 3) — the fix neither empties nor changes it there.

## M7b (break reach) — merged, included by reference

- **M7b's packet:** `pe/r7-break@38fc9c6` (`kettle/src` `ba4707c`),
  `/home/user/wt/r7b/kettle/review/product-excellence/contracts/I04/ROUND7-M7b-READY-FOR-REVIEW.md`; its evidence came
  in with the merge under `contracts/I04/integration-fix/r7/M7b/`. I make none of M7b's claims; I re-ran its spec and
  probes on the final combined revision so they can be checked after the merge.
- **`break-reach.spec.ts`** ran inside the chromium project on the final revision (see (d)).
- **M7b's toast check** (`toastcheck.mjs`, unchanged; paused break and Break's over with a task, panel at its top and
  wheeled to its end, 1 and 3 toasts; Close, Ambience, Mute and every panel control): final revision, 375×667 light and 844×390 dark (M7b's configurations), 16 rows: **0 with any control covered** — Close, Ambience, Mute and every panel control clear with 1 and with 3 toasts, panel at its top and wheeled to its end. (390×844 dark and 667×375 not re-run for lack of time.) `r7/M7a/m7b-on-final/toast-check/`.
- **M7b's reach probe** (`reach.mjs`, unchanged; wheel, touch and Tab at 200 %): final revision, 375×667 at 200 %, light and dark (5 states each: break, paused break, Break's over with and without a task, tap test): **10 configurations, 0 failing; 0 control × method failures** (wheel, touch, Tab). 390×844 and 844×390 were not re-run on the final revision for lack of time (M7b's own runs on `38fc9c6` cover them). `r7/M7a/m7b-on-final/reach.log`.

## (c) Step-2 probes (real input, real timers, fresh contexts, disposable profiles)

Every run: its own Chromium launch through `tools/slots.py --lane M7a --n 1`, a fresh context (disposable profile),
SwiftShader, DPR 2 and touch under 900 px wide. Inputs are real (`page.mouse.wheel`, CDP touch via `locator.tap()` /
`Input.dispatchTouchEvent`, real clicks). Toast timers are real and nothing is held: no synthetic `pointerenter`, no
programmatic scrolling, no test-only timer changes; the debug API is used for setup only (seed, quota fill,
`startFocus`, `ff`, `end`, `finish`). "Final" = the final combined revision on my dev server :5206, restarted on that
tree; controls on the orchestrator's servers (and :5226 for the Close control).

**Probe adaptation.** Each probe measures *whichever element presents the warning*: the toast
`li#toast-kettle:save-failed` (judged exactly as before) or the banner `section[data-save-warning]` (judged for being
taken away or faded, moving within the page — `top + scrollY` — and its Save backup outside its box or clipped by an
ancestor). Both count every addition of the warning's text to a live region. Diffs against the round-6 originals:
`r7/M7a/probes/natural-b.diff`, `actionpair-b.diff`, `pwapair-b.diff` (originals beside them; `SHA256.txt`). One
setup change in the LEAD probes, on control and revision alike: **no newbie seed** — after midnight UTC the seed's
sessions sort after the new brew, so Today offers no "Mark done" (the original's own guard throws); the brew, End,
quota fill and real tap are unchanged.

### LEAD-D1 — "Crossed off · Undo" after a real tap on Mark done, storage full (`actionpair-b.mjs`)

Control **e866118** (:5304); final on :5206. Warning adds/removals over ~7 s from the tap; frames judged from its first
addition. `r7/M7a/runs/lead-ap/`.

| Config | e866118: adds/removals · frames at full opacity · toast box over the dock · live-region additions | Final: adds/removals · frames at full opacity · banner drift · Save backup cut · live-region additions |
|---|---|---|
| 375×667 @200 light | **11/10** · 256/473 · 234 · 11 | 1/0 · 485/485 · 0 px · 0 · 1 |
| 375×667 @200 dark | **11/10** · 236/471 · 255 · 11 | 1/0 · 497/497 · 0 px · 0 · 1 |
| 844×390 @200 light | **11/10** · 310/506 · 193 · 11 | 1/0 · 506/506 · 0 px · 0 · 1 |
| 667×375 @150 dark | **11/10** · 260/487 · 239 · 11 | 1/0 · 468/468 · 0 px · 0 · 1 |
| 375×667 @150 light | 1/0 · 462/471 · 0 · 1 | 1/0 · 474/474 · 0 px · 0 · 1 |
| 390×844 @100 light | **2/1** · 426/443 · 7 · 2 | 1/0 · 504/504 · 0 px · 0 · 1 |
| 375×667 @100 light | **3/2** · 413/431 · 9 · 3 | 1/0 · 476/476 · 0 px · 0 · 1 |
| 1440×900 @100 light | 1/0 · 514/524 · 5 · 1 | 1/0 · 567/567 · 0 px · 0 · 1 |

**Reproduced on the control** in the four looping configurations (11/10, 11 live-region additions), so the zeros on
the final revision count.

### LEAD-D1 — the never-expiring update prompt underneath (`pwapair-b.mjs`, ~11 s)

| Config | e866118 | Final |
|---|---|---|
| 375×667 @200 light | **28/27**, last removal 13.5 s, 174/782 frames at full opacity, 680 with its box over the dock, **28** live-region additions | **1/0**, 806/806 at full opacity, drift 0 px, Save backup cut in 0 frames, **1** live-region addition |
| 667×375 @150 dark | **29/28**, last removal 14.1 s, 184/797 frames at full opacity, 689 with its box over the dock, **29** live-region additions | **1/0**, 778/778 at full opacity, drift 0 px, Save backup cut in 0 frames, **1** live-region addition |

(The update toast is raised through the app's own `toast()` with PwaUpdatePrompt's options — labelled synthetic setup,
as in the LEAD's probe.)

### R5-D1 — an older toast leaving after the list was scrolled (`natural-b.mjs`, from L1's `natural-x.mjs`)

Storage full, End after 12 minutes with a level-up, 200 % text. The pointer rests on the toast stack, wheels up to the
oldest toast, waits 600–1800 ms, wheels back down in 20 px notches; real timers, nothing synthetic. I used
**natural-x**, not race-x, because race-x holds the toasts with synthetic `pointerenter`, which this round excludes.
5 waits × 2 runs = 10 runs per configuration and revision. `r7/M7a/runs/r5d1-*/`.

| Config (200 % text) | R5 `20671eb` (:5302): failing runs (details) · live-region additions per run | Final: failing runs · banner adds/removals · additions per run |
|---|---|---|
| 375×667 light | **1/10** (wait 1200: warning taken away / faded in 8 frames & drawn below its room in 20 frames (max +43 px; over the docked start by up to 56 px)) · 1 (7), 2 (3) | **0/10** · 1/0 · 0 (7), 1 (3) |
| 844×390 light | **2/10** (wait 600: warning taken away / faded in 8 frames & drawn below its room in 9 frames (max +13 px; over the docked start by up to 3 px); wait 1200: warning taken away / faded in 4 frames & drawn below its room in 4 frames (max +3 px; over the docked start by up to 0 px)) · 1 (6), 2 (3), 3 (1) | **0/10** · 1/0 · 0 (3), 1 (7) |
| 375×667 dark | **2/10** (wait 1200: warning taken away / faded in 29 frames & drawn below its room in 23 frames (max +44 px; over the docked start by up to 80 px); wait 1500: warning taken away / faded in 8 frames & drawn below its room in 8 frames (max +19 px; over the docked start by up to 9 px)) · 1 (7), 2 (3) | **0/10** · 1/0 · 0 (4), 1 (6) |

**Reproduced on the control in every configuration**, so the final revision's zeros count. Banner judged per frame:
never taken away or faded, never moved within the page, Save backup never outside its box or clipped.

**Announced once.** On the final revision every run has at most one live-region addition. Where the R5-D1 window
(which starts just before End) shows 0, the one announcement came earlier: an app save failed while the probe was
still filling storage on Today, so the banner showed and was said then; back on Today after End it was not said again
(`r7/M7a/runs/announce-timing.txt`: three page-load-to-end traces, exactly one addition each). The integrity spec counts
the additions across brew → summary → Today → Settings → Today and requires exactly 1 (see (d)).

### Nothing moves under the finger; the banner after a real "Mark done" (`late.mjs`); CLS

`late.mjs`: Today with a carried task, storage then filled, a **real tap on "Mark done"**; every frame: the task field
(next to the finger), the docked start, the element at the tap point, the banner's top; layout-shift entries.
Counterfactual `CF=1`: `scrollBy` made a no-op in the page (no app code changed). `r7/M7a/cls/`.

| Config | with compensation: task field moved · docked start moved · banner top after · scrollY before→after · CLS (all / without recent input) | counterfactual (no scroll): task field moved · under the finger after |
|---|---|---|
| 375×667 @100 | 0.1 px · 0 px · -200.1 · 323→486 · 0.069 / 0 | 162.9 px · SECTION |
| 390×844 @100 | 0.1 px · 0 px · 99.1 · 0→163 · 0.0156 / 0 | 162.9 px · SECTION |
| 1440×900 @100 | 0 px · 0 px · 44 · 0→0 · 0.027 / 0 | 0 px · DIV |
| 844×390 @100 | 0.2 px · 0 px · -141 · 0→157 · 0.0297 / 0 | 156.8 px · Save backup |
| 375×667 @200 | 0.1 px · 0 px · -772.5 · 1108→1460 · 0.153 / 0 | 352.1 px · SPAN |

- With the compensation the task field moves ≤ 0.2 px; without it, 157–352 px, and at 844×390 "Save backup" lands
  under the finger. Layout-shift entries in this window all have `hadRecentInput` (0 counted towards CLS); part of them
  is "Mark done"'s own line collapse, on every revision.
- **The price, stated plainly (lead point 2):** where the person has scrolled down into the composer, keeping the
  finger's control still puts the new banner **above the view** (375×667 @100 %: −200 px; @200 %: −772 px; 844×390:
  −141 px); at 390×844 @100 % it lands at y 99 (in view); at 1440 it is in the other column (in view, nothing moved).
  The person learns it (1) by the one polite announcement, (2) by scrolling up to the top of Today, (3) on every later
  visit to Today and in Settings › Your data, and (4) on the next summary (the note). **INT** in the same tap shows its
  warning toast in view at once (`captures/BEFORE-INT/lead-d1-*.png`, and the LEAD's INT
  runs), but at 200 % INT's toast rises past the top of the screen one word per line (old D3), and on R6 it looped.
  I chose "never move the control under the finger" over "always in view at once"; this is for the reviewer to judge.

**CLS on Today load (100 % text).** `clsload.mjs`: 5 reloads of a seeded profile per configuration, layout shifts over
4 s after load, on the final revision, on e866118 and on INT:

| Config | final (49ea1de tree for Today) | e866118 | INT |
|---|---|---|---|
| 390×844 | 0.0492, 0, 0, 0, 0 | 0.0492, 0, 0.0492, 0, 0 | 0.0492, 0, 0, 0, 0 |
| 375×667 | 0.0513, 0.0513, 0.0513, 0, 0.0513 | 0.0513, 0, 0, 0, 0 | 0.0513, 0, 0, 0, 0.0513 |
| 1440×900 | 0, 0, 0, 0, 0 | 0, 0, 0, 0, 0 | 0, 0, 0, 0, 0 |
| 844×390 | 0.0741, 0.0741, 0.0427, 0.0427, 0.0741 | 0.0741, 0.0427, 0.0427, 0.0427, 0.0427 | 0.0741, 0.0427, 0.0427, 0.0427, 0.0427 |

The same intermittent late reflows (status bar / categories, `Home.module.css` sources) on all three, and 0 at 1440;
nothing from the banner. With storage full and a failed save, Today mounted by a real tap on the Today tab shows the
banner in its first layout: CLS 390×844: 0 (without recent input 0), 375×667: 0 (without recent input 0), 1440×900: 0.0269 (without recent input 0), 844×390: 0.0071 (without recent input 0) (`cls.mjs` (b); the 1440 / 844 entries are toasts' own shifts with
`hadRecentInput`). After a reload with storage still full no save has failed yet, so no banner (and nothing claims
anything) until the next failed save.

## (d) Tests (final revision)

| Gate | Result |
|---|---|
| `npx tsc --noEmit --pretty false` | clean (exit 0) on `980ef2a` |
| `npx vitest run` | 27 files, **267 / 267** passed (incl. the new `saveWarning.test.ts`, 2 tests), 0 skipped |
| chromium (all specs except timer/pwa) | 1 failed, 71 passed |
| timer-harness | 14 passed |
| timer-app | 2 skipped, 12 passed |
| pwa | 3 passed |

Failures in the chromium run: 
- `✘  26 [chromium] › tests/integrity.spec.ts:768:3 › I03 data safety › export → reset (explicit confirmation) → import restores brews, settings and every reward exactly (13.7s)`

Run on the final code revision `980ef2a` (`kettle/src` `6db18ad`), Playwright on my server :5226 (`KETTLE_PORT=5226
KETTLE_PWA_PORT=5236`), one worker, through `slots.py`, with two other browsers of mine running probes / captures beside
it (load average 11–13 on 4 CPUs). Logs: `r7/M7a/tests/` (copied from my scratch directory).

- **chromium (72 tests: a11y, break-reach, integrity, statusbar, toast-room, whistle):** 71 passed, **1 failed**:
  M1's "export → reset (explicit confirmation) → import restores brews, settings and every reward exactly". The
  failure is a timeout under load: after the restore, `expect.poll(hash).toBe('#/')` gave up at its 10 s default while
  the app was still on `#/welcome` (the page snapshot at the end shows Today and "Welcome back. 52 brews restored.", so
  the restore completed), and the profile-pill read then caught Today's outgoing layer ("184 leaves" from the status
  bar's "184 leaves to the next"). It failed the same way in the full run on `49ea1de` and passed in the full run on
  `217489c`. **Re-run on the same revision right after, with the load lower:** all five "I03 data safety" tests, ×2
  each — **10 / 10 passed** (`tests-final-m1-rerun.log`); the export → import test also passed 2 / 2 in isolation on
  `49ea1de`. None of M1's files or tests were changed (proof above); I classify it as a load-sensitive timeout in the
  test, not a behaviour change, for the reviewer to confirm.
- **M1's data-integrity tests:** every test in `tests/integrity.spec.ts` other than the replaced block passed in the
  full run except the one above (24 integrity tests passed there — my 6 banner tests among them — including both
  storage-full data tests and the restore-refused test), and the five I03 data-safety tests passed 10 / 10 on re-run.
- **break-reach.spec.ts (M7b):** 7 / 7 passed on the final revision. **toast-room.spec.ts:** 12 / 12 (6 banner-in-room,
  2 endless-toast, 2 last-toast-fades, 2 new Close tests). The new banner tests in `integrity.spec.ts`: 6 / 6.
- **Skips:** timer-app skips 2 tests by design — "keyboard shortcuts infra" (`timer.spec.ts:295`, "infra is exercised
  in the harness; screens bind their own keys") and "rendering budget" (`:439`, "render counter lives in the harness");
  both run in timer-harness. No other skips.

## (e) BEFORE (INT :5303) / AFTER (final, :5206) captures

`r7/M7a/captures/BEFORE-INT/` and `r7/M7a/captures/AFTER-final/` (`<state>-<W>x<H>-t<text>-<theme>.png`, full size:
DPR 2 under 900 px wide, DPR 1 at 1440), each with `notes-*.jsonl` (per shot: route, banner / note / warning toast
present, the toasts listed; for AFTER also the summary-end measurement). Script `r7/M7a/probes/capture-r7.mjs`: **one
fixed timestamp for both revisions, 2026-10-10T15:20:00Z** (`page.clock.install({ time })`, then `resume()`, timezone
UTC), screenshots with `animations: 'disabled'` (CSS animations, transitions and Web Animations — the idle loops —
stopped; the 3D scene is off). Same session: BEFORE (02:3x–02:46 UTC) and AFTER (02:49–03:2x UTC) on this machine,
same flow. Viewports 390×844, 375×667, 1440×900, 844×390; light and dark; 100 % and 200 % text — 16 configurations per
revision. Setup through the debug API (fresh profile, quota fill, `startFocus`, `ff`); "Tea time" and "Mark done" are
real taps / clicks; the panel is wheeled to its end for the Close state; toasts in the focus / Break's over states are
raised with the app's own `toast()` (labelled setup).

States: `today` (Today with the warning), `focus-toasts` (brew running, two toasts), `summary` (the failed-save note),
`summary-end` (details expanded, scrolled to the last line), `breakover-toasts` (Break's over, two toasts),
`breakover-end-3toasts` (**the Close state**: Break's over wheeled to its end, three toasts), `settings-data`
(Settings at "Your data"), `lead-d1` (1.3 s after a real tap on Mark done: "Crossed off · Undo").

**What I saw in the files I opened** (full size, Read tool; BEFORE = INT, AFTER = final):

| File(s) | BEFORE | AFTER |
|---|---|---|
| `today-390x844-t100-light`, `today-375x667-t100-light` | The warning toast (dark, berry bell) above "Put the kettle on", over the composer | The honey banner under Chai's bubble, in the page: bold "This browser’s storage is full." + sentence + **Save backup**; status bar, greeting, Chai and goal card unchanged; the composer starts lower (at 375×667 categories and brew length are below the docked start, reached by scrolling); the docked "Put the kettle on · 25 min" and the sky "Change brew length" unchanged; nothing floats |
| `today-1440x900-t100-light` | Warning toast over the brew-length chooser | Banner at the head of the right column; the left column's layout identical |
| `today-375x667-t200-light` | Old D3: the warning toast, one word per line, rising past the top of the screen | Status bar, a 3-line greeting, then the docked start; the banner is in the page below the fold (reached by scrolling) |
| `focus-toasts-375x667-t100-light`, `focus-toasts-390x844-t200-light` | The warning toast on the stage above two toasts | Two toasts only; no warning anywhere during the brew (toasts over the readout: r6 follow-up 8, unchanged) |
| `summary-375x667-t100-light` | Headline, sub, task row, unlock card | One honey line under the sub: "Not saved: storage is full." + **Save backup**; footer unchanged |
| `summary-end-375x667-t100-light` | — | Details expanded and scrolled to the end: the last line ("Your 1-day streak stays warm…") sits above the footer's top edge — clears Tea time / Skip break (measured: lead point 5) |
| `summary-844x390-t100-light` | — | The note in the narrow landscape panel puts Save backup under its text (two rows) |
| `settings-data-844x390-t100-light` | Rows and footer only | The same banner right after "Everything lives on this device…", Save backup beside the text |
| `lead-d1-390x844-t100-light` | Warning toast + "Crossed off · Undo" stacked over the composer | Banner (already up) steady above the goal card; "Crossed off · Undo" alone |
| `breakover-end-3toasts-375x667-t100-light` | — | Three toasts above "Mark it done, start fresh"; Close, Mark, Put and "That's all for now" clear |
| `breakover-end-3toasts-375x667-t200-dark` | The panel does not scroll on INT: "Put the kettle on" and "That's all for now" are below the bottom edge (unreachable, the pre-M7b defect); three toasts over the title area, Close clear | Panel at its end: Mark / Put / All for now in view; the three toasts sit in a room that starts below the top bar, the top one cut at the room's top (scrolls inside it, round-6 behaviour); **Close clear** |

Earlier sessions' runs (my revisions `217489c`–`b8cb9cb`) are kept as jsonl / logs in `superseded-*/` (their
screenshots were removed before commit, see `superseded-PNGS-REMOVED.txt`).

## Lead's prep points (answered)

1. **The Close fix everywhere.** Close probe (above): Close and every Break's over control clear and really tapped at
   375×667 @200 % light and dark, by wheel and by touch, with three toasts; Close also at 390×844 and 844×390 @200 % and
   at 100 % on all four sizes. M7b's toast check on the final revision covers Close, **Ambience and Mute** with **1 and
   3** toasts, panel at its top and at its end (wheel), in the paused break and Break's over (see the M7b section).
   Not measured: Ambience/Mute by touch scrolling (the room top is the same whichever input scrolled the panel). The room
   is **not emptied**: at 844×390 (100 % and 200 %) and 1440×900 no bar control sits above the toasts' column, so the
   room is byte-for-byte the unfixed one (geometry table; 844×390 @200 %: 26 px on both — the lift leaves no more,
   pre-existing); by construction the top never comes closer than 56 px above the lift. 667×375 @200 % was not
   re-measured on the final revision (time). **Round 6 elsewhere:** Today, Stats, Nook
   and Settings have no page-level `<header>`, so their room is untouched (Today's docked start: the "last toast fades
   out" and banner toast-room tests pass); on the summary footer and the brew controls only the room's top can move,
   never its bottom (the lift), and at 100 % the toasts' boxes are identical to the unfixed revision in every measured
   configuration (geometry table).
2. **Banner out of view after a real "Mark done".** Measured and stated in "Nothing moves under the finger" above: yes,
   where the person is scrolled down into the composer the banner goes above the view (−200 px @100 %, −772 px @200 %
   at 375×667); the scroll that keeps the finger's control still is the reason. How the person learns: one polite
   announcement; the banner at the top of Today; Settings › Your data; the next summary's note. INT shows its toast in
   view at once (and at 200 % sends it past the top of the screen; R6 looped it).
3. **"Nothing implies saved."** Two pre-existing wordings outside my files, identical on INT `0d58c5e`: the End sheet's
   "N minutes of focus will be saved" (`src/screens/focus/parts/EndSheet.tsx:44`, same line on INT) and the
   screen-reader line "Kettle’s off. N minutes of focus saved." (`src/timer/announce.ts:53`, frozen, same on INT).
   Neither checks whether saving works. The visible End-early toast and the summary are truthful on this revision.
4. **Brew captures at 100 %.** `captures/brew100/<INT|FINAL>-<WxH>-<theme>[-rm]/` — the repo's `tools/capture.mjs --only 02,03,04,13` (focus start, mid, paused, first brew) at 390×844, 375×667 and 1440×900, light and dark, plus reduced motion at 390×844 light: 14 of 14 runs, INT and final back to back (02:57–03:15 UTC). This tool runs on the real clock (not frozen), so clock-derived text differs by the minute between the two runs. Opened: `03-focus-mid` 375×667 light and `13-first-brew` 390×844 light reduced motion — identical layouts (readout, status and meta lines, Add 5 / Pause / End, brew dots, top bar); the only difference "whistles at 3:30 AM" vs "3:29 AM" (the real clock). Nothing changed in the brew at 100 %.
5. **Summary note.** Last expanded line vs the Tea time / Skip footer with the note present: measured on every AFTER configuration (`summary-end-*.png`, `notes-FINAL.jsonl`): 390x844-t100-light: last line bottom 658 vs footer top 706 → clears; 375x667-t100-light: last line bottom 481 vs footer top 529 → clears; 1440x900-t100-light: last line bottom 700 vs footer top 738 → clears; 844x390-t100-light: last line bottom 212 vs footer top 244 → clears; 390x844-t100-dark: last line bottom 658 vs footer top 706 → clears; 375x667-t100-dark: last line bottom 481 vs footer top 529 → clears; 1440x900-t100-dark: last line bottom 700 vs footer top 738 → clears; 844x390-t100-dark: last line bottom 212 vs footer top 244 → clears; 390x844-t200-light: last line bottom 604 vs footer top 652 → clears; 375x667-t200-light: last line bottom 427 vs footer top 475 → clears; 1440x900-t200-light: last line bottom 692 vs footer top 730 → clears; 844x390-t200-light: last line bottom 158 vs footer top 190 → clears; 390x844-t200-dark: last line bottom 604 vs footer top 652 → clears; 375x667-t200-dark: last line bottom 427 vs footer top 475 → clears; 1440x900-t200-dark: last line bottom 692 vs footer top 730 → clears; 844x390-t200-dark: last line bottom 158 vs footer top 190 → clears. The note
   wraps to two rows at 844×390 (narrow landscape panel) and at 200 %. Dark-theme honey tint: same family as the
   reward/unlock card next to it — a tone choice (see design notes).
6. **Behaviour.**
   - *Announced once:* 1 live-region addition per run in every LEAD-D1 run on the final revision (11 and 28–29 on
     e866118); the integrity spec requires exactly 1 across brew → summary → Today → Settings → Today; Today
     re-mounting or a route change does not announce again (the banner is not a live region; the announcer is set
     once per spell of failing saves, at most once a minute).
   - *When it disappears:* the state re-checks every 2 s whether every key whose save failed has since been written
     successfully (`lastWriteFailed`); the banner goes at the first check after the last of them is saved again —
     i.e. ≤ 2 s after the next successful save of each failed key once room is made. Making room alone is not enough
     until those keys are written again (storage still holds older values until then). The integrity spec frees the
     space, writes timer, progress and settings, and sees the banner gone within its 6 s timeout.
   - *Tab order:* phones — status bar pills, Chai's bubble chip (when shown), **Save backup**, then the composer and
     the docked start; desktop — the left column (status, composer, start) first, then the right column, **Save
     backup** first in it. The integrity spec Tabs from the greeting to Save backup.
   - *Replaced tests:* listed in (b).
   - *`scrollIntoViewIfNeeded`:* used in the "Mark done" spec and in `late.mjs` as setup only, before storage is
     filled and before recording; the tap itself is real.

## (f) BLOCKED / UNKNOWN (never PASS)

- **BLOCKED:** real phones and touch hardware (all touch here is CDP touch under mobile emulation); real wheel notch
  sizes; real OS text-size settings (200 % here is `html{font-size:200%}`); real window managers; **real assistive
  technology** (the single polite announcement and the banner's region name were checked in the DOM / live-region
  mutations only, not heard on VoiceOver, TalkBack or NVDA); real-device performance and GPU timing (SwiftShader,
  4 shared CPUs, other lanes running).
- **UNKNOWN:** iOS Safari / WebKit and Firefox: `scrollBy({behavior:'instant'})` inside a layout effect (the
  "nothing moves under the finger" compensation), `:has()`, and the honey tint's rendering; whether a screen reader
  re-reads a named `<section>` when Today is visited again (it is not a live region, so it should not).
- **Not in scope, recorded for the owners:**
  - `src/timer/announce.ts` (M1/timer, out of my files): ending early while saving fails, the screen-reader line
    still says "Kettle’s off. N minutes of focus saved." (the visible toast no longer does). Follow-up for M1.
  - Stats and Nook do not show the banner (only Today, Settings › Your data and the summary do, as required). A save
    that fails there is announced once and shown on the next visit to Today or Settings.
  - Landscape phones at 200 % text: the docked start leaves a strip of about 75 px above it in the right column
    (pre-existing, follow-ups 3/12); the banner, like the composer, is read by scrolling through that strip.

- **Measured limits of this design (for the reviewer to classify):**
  - *Summary note:* one line at 390×844, 375×667 and 1440×900 at 100 %; two rows in the narrow landscape panel at
    844×390 and at 200 % text.
  - *Visibility without movement:* the banner is in the page, so it can be out of view: below the fold at 375×667
    @200 % on arrival; above the view after a real "Mark done" when the person had scrolled into the composer
    (lead point 2).
  - *Tab order:* phones — Save backup after the status bar and Chai's bubble, before the composer; desktop — in the
    right column, so after the composer and start.
  - *Toasts at 390×844 @100 % on Break's over:* "Mark it done" overlapped by an entering toast for 2–4 frames on the
    final revision (7 frames, plus "Put the kettle on" 4, on the unfixed revision; INT has it too per M7b's check) —
    round 6's entry slide, pre-existing, not worsened.
- **Pre-existing "saved" wording outside my files** (identical on INT): End sheet "N minutes of focus will be saved";
  `src/timer/announce.ts` "Kettle’s off. N minutes of focus saved.".

## (g) Proposed contract state

- **LEAD-D1, R5-D1, R4-D1 and the warning-placement class** (r6 follow-ups 1, 2, 13, 14, 16, 18, 19): **FIXED by
  construction** — there is no warning toast to order, lift, scroll, anchor, withdraw or re-show; no geometry decides
  whether it shows. Controls reproduced; zeros on the final revision. (16: the banner leaves only when storage has
  room again; focus on its button would then fall back to the page — not handled. 10 is the toasts' own lift lag and
  is not claimed.)
- **Close under three toasts (round 7, combined):** **FIXED**, control reproduced 100 % at 375×667 @200 %, regression
  test added.
- **I03 (truthful storage consequences):** **FIXED**, pending independent review, on the screens I own; two
  pre-existing "saved" wordings outside my files are disclosed in the lead points (End sheet, `announce.ts`).
- **I04:** this round's parts **FIXED**; I04 overall **PARTLY BLOCKED** (real devices, real AT, WebKit/Firefox, OS text
  size — see (f)).
