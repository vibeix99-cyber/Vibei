# W2R3 · Maker T2 · fix round for T2-D1 (a notice on the summary moved P's sheet)

**Status: READY FOR REVIEW**

| | |
|---|---|
| Branch | `pe/w2r3-notices`, on top of `6a64fbf` (WIP `3462b93` saved by the orchestrator after the container restart, then mine) |
| Code | `40f92b6` (the src is unchanged since the WIP `3462b93`; the later commits are tests, tools and evidence) · kettle/src tree `aa88587e1d5eee83eadec443a207848f14481765` |
| Verdict answered | `CHECKER-W2R3-T2.md` §3 (T2-D1), with Vibei's approved direction (no strip on `/done`; no update prompt on `/focus` or `/done`; queued notices never dropped, shown in order on the next screen with a strip; the summary sheet never moves) |
| Trial merge | `git merge-tree --write-tree claude/wizardly-galileo-uy89d9 40f92b6` → clean |
| Servers | fix dev :5471, fix preview :5481 (rebuilt from this code); base dev :5470 and preview :5480 read only |

## Cause and fix

**Cause.** `FocusScreen.tsx` put a notice strip at the head of the summary layer (`summaryBox`), above P's `Summary`, so any notice there pushed P's sheet down by its own height. The update prompt arrived there with the summary's first frame, because `PwaUpdatePrompt` counted only a running timer as busy.

**Fix (T2's files only; P's `screens/done/**` and `focus/stage/**` untouched):**

| File | Change |
|---|---|
| `src/screens/focus/FocusScreen.tsx` | The summary has **no notice strip**. `<Summary/>` is again the summary box's only child, as on the base. The panel strip stays off while the summary is shown (`off={view === 'summary' …}`, unchanged). |
| `src/screens/focus/FocusScreen.module.css` | `.summaryBox` is byte-identical to `61aba17` again (the flex column, `.summaryFill` and `.summaryNotices` are removed). |
| `src/app/ShellOverlays.tsx` | The update prompt is busy on the whole session screen (`/focus` and `/done`: brew, break, Break's over, whistle, summary), not only while the timer runs. It is raised where the person lands next, within that screen's first frames. |
| `tests/summary-notice.spec.ts` (new) | The case: notices queued on the summary leave P's arrival exactly as with no notice, then appear on Today in order, each announced once. |
| `tests/notice-strip.spec.ts` | Summary step: the notice is **not** drawn on the summary and waits with all its time (4000 ms left), then is drawn whole in the tea break's first frames. |
| `tests/a11y.spec.ts` | "A toast never covers … the summary footer": on the summary the notice is now not drawn at all and is queued (`'missing toast'` plus queue check). This is stricter than "clear". |
| `T2/tools/summary.mjs`, `summary-all.sh` | The proof probe. |

**Queued notices (Vibei's item 3).** Nothing is dropped. While the summary is up, no strip is active, so a notice waits in the queue with its clock stopped.
- **Where it appears:** in the first frames of the next screen that has a strip, in queue order. That is the tea break's panel ("Tea time") or Today ("Skip break" / Close). The order is timed notices by arrival, then the persistent update prompt (it never blocks the others).
- **When it is announced, once:** when it is raised, while the summary is still up. The light-DOM polite announcer adds one line per notice on arrival (`toast()` → `say`). Showing it later on Today changes no live region, so it is never said a second time.
- **Why then:** a screen-reader user learns of it at the moment it happens; the sighted user sees it on the next screen; and nothing on the summary moves or is covered.
- **Proved:** `summary-notice.spec.ts` checks the announcer's lines after all three notices have been shown. Each is present exactly once.

## Proof

### 1. P's sheet with and without a queued notice (`T2/tools/summary.mjs`; `T2/fix/{before,after}/<cfg>/summary.json` and full-size PNGs)

Setup for every case:
- Monday frozen, a fresh profile per case (so P's content and fold are the same in each run), a task "Chapter 3 notes".
- Task day = `newbie`; big day = `celebrate` (unlock).
- Cases:
  - **first**: a persistent prompt raised in the same task as the brew's finish, i.e. pending as the summary arrives;
  - **after**: the prompt raised 2.6 s after arrival;
  - **timed**: "Couldn't save just now…" raised 2.6 s after arrival.

Measured 1.6 s later:
- the sheet's top (and bottom, where recorded) against the same day's no-notice run;
- notices drawn;
- rows cut by the footer (the lead's fold measure).

Servers:
- **BEFORE:** base dev :5470 (`61aba17`). Its preview :5480 has no way to raise a notice: no `__kettle.toast` and no source modules.
- **AFTER:** fix preview :5481.

AFTER then taps "Tea time" for real and checks the notice on the tea break: drawn, whole, in view, action on top, and Update reached by a real tap.

| Config | Day | Case | BEFORE sheet top (Δ vs none) · notices drawn · rows cut | AFTER sheet top / bottom (Δ vs none) · drawn on summary · rows cut (none: n) | AFTER on the tea break: drawn whole · action on top / reached |
|---|---|---|---|---|---|
| 1440x900-dark-t100 | task | first | 30 (+0) · 1 · 0 | 30 (+0) / 733 (+0) · 0 · 0 (none: 0) | True · True / 1 |
| 1440x900-dark-t100 | task | after | 30 (+0) · 1 · 0 | 30 (+0) / 733 (+0) · 0 · 0 (none: 0) | True · True / 1 |
| 1440x900-dark-t100 | task | timed | 30 (+0) · 1 · 0 | 30 (+0) / 733 (+0) · 0 · 0 (none: 0) | True |
| 1440x900-dark-t100 | big | first | 40 (+0) · 1 · 1 | 40 (+0) / 789 (+0) · 0 · 1 (none: 1) | True · True / 1 |
| 1440x900-dark-t100 | big | after | 40 (+0) · 1 · 1 | 40 (+0) / 789 (+0) · 0 · 1 (none: 1) | True · True / 1 |
| 1440x900-dark-t100 | big | timed | 40 (+0) · 1 · 1 | 40 (+0) / 789 (+0) · 0 · 1 (none: 1) | True |
| 1440x900-light-t100 | task | first | 30 (+0) · 1 · 0 | 30 (+0) / 733 (+0) · 0 · 0 (none: 0) | True · True / 1 |
| 1440x900-light-t100 | task | after | 30 (+0) · 1 · 0 | 30 (+0) / 733 (+0) · 0 · 0 (none: 0) | True · True / 1 |
| 1440x900-light-t100 | task | timed | 30 (+0) · 1 · 0 | 30 (+0) / 733 (+0) · 0 · 0 (none: 0) | True |
| 1440x900-light-t100 | big | first | 40 (+0) · 1 · 1 | 40 (+0) / 789 (+0) · 0 · 1 (none: 1) | True · True / 1 |
| 1440x900-light-t100 | big | after | 40 (+0) · 1 · 1 | 40 (+0) / 789 (+0) · 0 · 1 (none: 1) | True · True / 1 |
| 1440x900-light-t100 | big | timed | 40 (+0) · 1 · 1 | 40 (+0) / 789 (+0) · 0 · 1 (none: 1) | True |
| 375x667-dark-t100 | task | first | n/a | 284 (+0) / n/r · 0 · 1 (none: 1) | True · True / 1 |
| 375x667-dark-t100 | task | after | 284 (+0) · 1 · 1 | 284 (+0) / n/r · 0 · 1 (none: 1) | True · True / 1 |
| 375x667-dark-t100 | task | timed | 284 (+0) · 1 · 1 | 284 (+0) / n/r · 0 · 1 (none: 1) | True |
| 375x667-dark-t100 | big | first | 284 (+0) · 1 · 1 | 284 (+0) / n/r · 0 · 1 (none: 1) | True · True / 1 |
| 375x667-dark-t100 | big | after | 284 (+0) · 1 · 1 | 284 (+0) / n/r · 0 · 1 (none: 1) | True · True / 1 |
| 375x667-dark-t100 | big | timed | 284 (+0) · 1 · 1 | 284 (+0) / n/r · 0 · 1 (none: 1) | True |
| 375x667-dark-t200 | task | first | n/a | 285 (+0) / n/r · 0 · 1 (none: 1) | True · True / 1 |
| 375x667-dark-t200 | task | after | 285 (+0) · 1 · 1 | 285 (+0) / n/r · 0 · 1 (none: 1) | True · True / 1 |
| 375x667-dark-t200 | task | timed | 285 (+0) · 1 · 1 | 285 (+0) / n/r · 0 · 1 (none: 1) | True |
| 375x667-dark-t200 | big | first | n/a | 285 (+0) / n/r · 0 · 1 (none: 1) | True · True / 1 |
| 375x667-dark-t200 | big | after | 285 (+0) · 1 · 1 | 285 (+0) / n/r · 0 · 1 (none: 1) | True · True / 1 |
| 375x667-dark-t200 | big | timed | 285 (+0) · 1 · 1 | 285 (+0) / n/r · 0 · 1 (none: 1) | True |
| 375x667-light-t100 | task | first | 284 (+0) · 1 · 1 | 284 (+0) / n/r · 0 · 1 (none: 1) | True · True / 1 |
| 375x667-light-t100 | task | after | 284 (+0) · 1 · 1 | 284 (+0) / n/r · 0 · 1 (none: 1) | True · True / 1 |
| 375x667-light-t100 | task | timed | 284 (+0) · 1 · 1 | 284 (+0) / n/r · 0 · 1 (none: 1) | True |
| 375x667-light-t100 | big | first | 284 (+0) · 1 · 1 | 284 (+0) / n/r · 0 · 1 (none: 1) | True · True / 1 |
| 375x667-light-t100 | big | after | 284 (+0) · 1 · 1 | 284 (+0) / n/r · 0 · 1 (none: 1) | True · True / 1 |
| 375x667-light-t100 | big | timed | 284 (+0) · 1 · 1 | 284 (+0) / n/r · 0 · 1 (none: 1) | True |
| 375x667-light-t200 | task | first | n/a | 285 (+0) / n/r · 0 · 1 (none: 1) | True · True / 1 |
| 375x667-light-t200 | task | after | 285 (+0) · 1 · 1 | 285 (+0) / n/r · 0 · 1 (none: 1) | True · True / 1 |
| 375x667-light-t200 | task | timed | 285 (+0) · 1 · 1 | 285 (+0) / n/r · 0 · 1 (none: 1) | True |
| 375x667-light-t200 | big | first | 285 (+0) · 1 · 1 | 285 (+0) / n/r · 0 · 1 (none: 1) | True · True / 1 |
| 375x667-light-t200 | big | after | 285 (+0) · 1 · 1 | 285 (+0) / n/r · 0 · 1 (none: 1) | True · True / 1 |
| 375x667-light-t200 | big | timed | 285 (+0) · 1 · 1 | 285 (+0) / n/r · 0 · 1 (none: 1) | True |
| 390x844-dark-t100 | task | first | n/a | 382 (+0) / n/r · 0 · 0 (none: 0) | True · True / 1 |
| 390x844-dark-t100 | task | after | 382 (+0) · 1 · 0 | 382 (+0) / n/r · 0 · 0 (none: 0) | True · True / 1 |
| 390x844-dark-t100 | task | timed | 382 (+0) · 1 · 0 | 382 (+0) / n/r · 0 · 0 (none: 0) | True |
| 390x844-dark-t100 | big | first | 382 (+0) · 1 · 0 | 382 (+0) / n/r · 0 · 0 (none: 0) | True · True / 1 |
| 390x844-dark-t100 | big | after | 382 (+0) · 1 · 0 | 382 (+0) / n/r · 0 · 0 (none: 0) | True · True / 1 |
| 390x844-dark-t100 | big | timed | 382 (+0) · 1 · 0 | 382 (+0) / n/r · 0 · 0 (none: 0) | True |
| 390x844-dark-t200 | task | first | 393 (+0) · 1 · 1 | 393 (+0) / 1575 (+0) · 0 · 1 (none: 1) | True · True / 1 |
| 390x844-dark-t200 | task | after | 393 (+0) · 1 · 1 | 393 (+0) / 1575 (+0) · 0 · 1 (none: 1) | True · True / 1 |
| 390x844-dark-t200 | task | timed | 393 (+0) · 1 · 1 | 393 (+0) / 1575 (+0) · 0 · 1 (none: 1) | True |
| 390x844-dark-t200 | big | first | 393 (+0) · 1 · 1 | 393 (+0) / 1767 (+0) · 0 · 1 (none: 1) | True · True / 1 |
| 390x844-dark-t200 | big | after | 393 (+0) · 1 · 1 | 393 (+0) / 1767 (+0) · 0 · 1 (none: 1) | True · True / 1 |
| 390x844-dark-t200 | big | timed | 393 (+0) · 1 · 1 | 393 (+0) / 1767 (+0) · 0 · 1 (none: 1) | True |
| 390x844-light-t100 | task | first | n/a | 382 (+0) / n/r · 0 · 0 (none: 0) | True · True / 1 |
| 390x844-light-t100 | task | after | 382 (+0) · 1 · 0 | 382 (+0) / n/r · 0 · 0 (none: 0) | True · True / 1 |
| 390x844-light-t100 | task | timed | 382 (+0) · 1 · 0 | 382 (+0) / n/r · 0 · 0 (none: 0) | True |
| 390x844-light-t100 | big | first | 382 (+0) · 1 · 0 | 382 (+0) / n/r · 0 · 0 (none: 0) | True · True / 1 |
| 390x844-light-t100 | big | after | 382 (+0) · 1 · 0 | 382 (+0) / n/r · 0 · 0 (none: 0) | True · True / 1 |
| 390x844-light-t100 | big | timed | 382 (+0) · 1 · 0 | 382 (+0) / n/r · 0 · 0 (none: 0) | True |
| 390x844-light-t200 | task | first | 393 (+0) · 1 · 1 | 393 (+0) / n/r · 0 · 1 (none: 1) | True · True / 1 |
| 390x844-light-t200 | task | after | 393 (+0) · 1 · 1 | 393 (+0) / n/r · 0 · 1 (none: 1) | True · True / 1 |
| 390x844-light-t200 | task | timed | 393 (+0) · 1 · 1 | 393 (+0) / n/r · 0 · 1 (none: 1) | True |
| 390x844-light-t200 | big | first | 393 (+0) · 1 · 1 | 393 (+0) / n/r · 0 · 1 (none: 1) | True · True / 1 |
| 390x844-light-t200 | big | after | 393 (+0) · 1 · 1 | 393 (+0) / n/r · 0 · 1 (none: 1) | True · True / 1 |
| 390x844-light-t200 | big | timed | 393 (+0) · 1 · 1 | 393 (+0) / n/r · 0 · 1 (none: 1) | True |
| 667x375-dark-t100 | task | first | n/a | 15 (+0) / 730 (+0) · 0 · 0 (none: 0) | True · True / 1 |
| 667x375-dark-t100 | task | after | 15 (+0) · 1 · 0 | 15 (+0) / 730 (+0) · 0 · 0 (none: 0) | True · True / 1 |
| 667x375-dark-t100 | task | timed | 15 (+0) · 1 · 0 | 15 (+0) / 730 (+0) · 0 · 0 (none: 0) | True |
| 667x375-dark-t100 | big | first | 15 (+0) · 1 · 0 | 15 (+0) / 822 (+0) · 0 · 0 (none: 0) | True · True / 1 |
| 667x375-dark-t100 | big | after | 15 (+0) · 1 · 0 | 15 (+0) / 822 (+0) · 0 · 0 (none: 0) | True · True / 1 |
| 667x375-dark-t100 | big | timed | 15 (+0) · 1 · 0 | 15 (+0) / 822 (+0) · 0 · 0 (none: 0) | True |
| 667x375-light-t100 | task | first | 15 (+0) · 1 · 0 | 15 (+0) / 730 (+0) · 0 · 0 (none: 0) | True · True / 1 |
| 667x375-light-t100 | task | after | 15 (+0) · 1 · 0 | 15 (+0) / 730 (+0) · 0 · 0 (none: 0) | True · True / 1 |
| 667x375-light-t100 | task | timed | 15 (+0) · 1 · 0 | 15 (+0) / 730 (+0) · 0 · 0 (none: 0) | True |
| 667x375-light-t100 | big | first | 15 (+0) · 1 · 0 | 15 (+0) / 822 (+0) · 0 · 0 (none: 0) | True · True / 1 |
| 667x375-light-t100 | big | after | 15 (+0) · 1 · 0 | 15 (+0) / 822 (+0) · 0 · 0 (none: 0) | True · True / 1 |
| 667x375-light-t100 | big | timed | 15 (+0) · 1 · 0 | 15 (+0) / 822 (+0) · 0 · 0 (none: 0) | True |
| 844x390-dark-t100 | task | first | 22 (+0) · 1 · 0 | 22 (+0) / 737 (+0) · 0 · 0 (none: 0) | True · True / 1 |
| 844x390-dark-t100 | task | after | 22 (+0) · 1 · 0 | 22 (+0) / 737 (+0) · 0 · 0 (none: 0) | True · True / 1 |
| 844x390-dark-t100 | task | timed | 22 (+0) · 1 · 0 | 22 (+0) / 737 (+0) · 0 · 0 (none: 0) | True |
| 844x390-dark-t100 | big | first | n/a | 22 (+0) / 829 (+0) · 0 · 0 (none: 0) | True · True / 1 |
| 844x390-dark-t100 | big | after | 22 (+0) · 1 · 0 | 22 (+0) / 829 (+0) · 0 · 0 (none: 0) | True · True / 1 |
| 844x390-dark-t100 | big | timed | 22 (+0) · 1 · 0 | 22 (+0) / 829 (+0) · 0 · 0 (none: 0) | True |
| 844x390-light-t100 | task | first | 22 (+0) · 1 · 0 | 22 (+0) / 737 (+0) · 0 · 0 (none: 0) | True · True / 1 |
| 844x390-light-t100 | task | after | 22 (+0) · 1 · 0 | 22 (+0) / 737 (+0) · 0 · 0 (none: 0) | True · True / 1 |
| 844x390-light-t100 | task | timed | 22 (+0) · 1 · 0 | 22 (+0) / 737 (+0) · 0 · 0 (none: 0) | True |
| 844x390-light-t100 | big | first | 22 (+0) · 1 · 0 | 22 (+0) / 829 (+0) · 0 · 0 (none: 0) | True · True / 1 |
| 844x390-light-t100 | big | after | 22 (+0) · 1 · 0 | 22 (+0) / 829 (+0) · 0 · 0 (none: 0) | True · True / 1 |
| 844x390-light-t100 | big | timed | 22 (+0) · 1 · 0 | 22 (+0) / 829 (+0) · 0 · 0 (none: 0) | True |

- 14 configurations × 2 days × 3 cases, compared against the same day's no-notice run.
- **AFTER, all 84 rows:**
  - sheet top Δ 0, and sheet bottom Δ 0 where recorded (7 configurations; it is also asserted ≤ 1 px by the spec below);
  - nothing drawn on the summary;
  - rows cut by the footer equal to the no-notice run;
  - on the tea break the notice is drawn whole and in view, and Update is on top and reached by a real tap.
- "n/r" means the bottom edge was not recorded: those configurations ran before the probe recorded it.
- **BEFORE "n/a" (8 of the 84 BEFORE cells):** the base dev page navigated during the probe's module import on the "first" case. BEFORE's other 76 cells show the base's floating notice: drawn = 1 over the unmoved sheet.

**Reading the table.**
- **AFTER:** the sheet's top is identical to the no-notice run (Δ 0) in every configuration, day and case; nothing is drawn on the summary; the rows cut at the fold are the same as with no notice (P's own arrival fold). The stage art is untouched, so Chai's face and the kettle's gauge stay clear. Each notice then shows whole on the next screen.
- **BEFORE:** the base also keeps the sheet in place, but draws the notice floating over it. This is the cover the round removes, and also the one the rejected strip turned into a push.

Frames, full size:
- `T2/fix/after/<cfg>/<day>-<case>.png` (summary) and `…-break.png` (the notice on the tea break; the break PNGs kept for 375×667 and 390×844 light only, to bound the evidence size, while every configuration's result is in its `summary.json`);
- `T2/fix/before/<cfg>/<day>-<case>.png`.

### 2. Tests

All on the code below, dev :5471.

| Suite | Result | Log |
|---|---|---|
| tsc | **0 errors** | `T2/runs/fix-tsc.log` |
| vitest | **289 / 289** | `T2/runs/fix-vitest.log` |
| Playwright chromium, all specs, `--workers=2` | **175 / 181 passed, 3 failed, 3 did not run** (`a11y` is a serial file: after its failure the rest of that file did not run). The three failures are explained below | `T2/runs/fix-chromium.{log,json}` |
| ↳ `a11y.spec.ts:332` | Failed in the run: it still expected a notice drawn on the summary. The spec now expects none drawn and the notice queued (stricter). **Rerun 2/2** (`T2/runs/fix-rerun.log`); whole file: **`a11y.spec.ts` rerun as a whole: 11 / 11** (`T2/runs/fix-a11y.log`), D4 included | |
| ↳ `integrity.spec.ts:1004` @1440 | The known flake (F-T2-5; not notice-related). **Rerun 1/1** (`fix-rerun.log`) | |
| ↳ `notice-strip.spec.ts` 1440×900 @200 reduced | 24/25. The diagnostics added last round now name the cause: the tap was aimed at Mark done at y 672; as the click landed, End's "Saved…" left the strip at rest (`why: 'rest'`) and the page moved 60 px, so the click hit the tag group (`pointerdown@774,695→DIV._group…_tagGroup`). That is **F-T2-1** (the strip closing at rest moves content under a finger), which the coordinator ruled a follow-up for this round. No overlap was recorded | |
| `summary-notice.spec.ts` (new) | **14 / 14**: 7 configurations × task / big day | `T2/runs/fix-summary-notice.log` and the full run |
| `w2-summary.spec.ts` | **18 / 18** | full run |
| Controls | R5-D1 / LEAD-D1 / R7-D1 shapes: `toast-room` **14/14**. D4: `a11y` "toasts never cover the break-over controls" in the full run (passed before the file stopped: see **`a11y.spec.ts` rerun as a whole: 11 / 11** (`T2/runs/fix-a11y.log`), D4 included). W2H-D1: `w2-home` **18/18** and `notice-strip` Mark done / Undo rows 24/25 (the 25th is F-T2-1, above). `break-reach` 17/17, `integrity` 24/25 (+1004 rerun 1/1), `statusbar` 9/9, `chai3d` 9/9, `whistle`, `w2-room`, `w2-firstvisit` green | |
| timer / pwa projects | Not rerun this round: no timer or PWA code changed. 29 passed + 2 skipped by design on `61b463c` | `T2/runs/timer-pwa.log` |

## Left open

- The real `PwaUpdatePrompt` path can't be driven on a dev server (`needRefresh` comes only from a service-worker update, in `src/pwa/**`, which is not mine). Its new busy rule is proved by code reading. Its effect (nothing raised on `/focus` or `/done`) is covered by the probe and spec, which queue a persistent prompt the same way.
- Follow-ups F-T2-1 and F-T2-4 were not touched, as instructed.
- F-T2-1, as it surfaced in automation: 1 of 25 invariant runs (1440×900 @200 reduced motion) lost its Mark done tap when End's notice left at rest just before the click. The cause is now recorded; it is the declared follow-up, not a new defect.
- BEFORE pairs are against base **dev :5470**, not preview :5480, because the preview can't raise a notice. Same commit `61aba17`.
