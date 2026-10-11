# Round 8 · LEAD · rerun list (written before any rerun)

**Revision under review:** R8 = trial merge `9ff0d04` (`kettle/src` `42e106d`), dev :5306, preview :5326.
**Written:** 2026-10-11 18:15 UTC, by the round-8 lead Checker, from the diff alone.

## What the diff touches (verified myself)

`git diff --stat b39202f 9ff0d04 -- kettle ':!kettle/review'` lists exactly five files, the same five as
`git diff 7ba0d98 2c3172c -- kettle/src kettle/tests`:

| File | Nature of change | Who it can affect |
|---|---|---|
| `src/ui/Toast.tsx` (+195/−14) | New dock (`toastDock`), fold (`foldToFit`), `stackHeight`, `topBarBottom`; `useToastRoom` re-measures on every scroll (capture, `flushSync`), on every stack change (layout effect) and on resize/250 ms as before; `toastRoomTop` column while docked | **Every toast on every screen** (the room hook runs everywhere). Dock and fold only where a `[data-toast-dock]` box is opted in |
| `src/ui/Toast.module.css` (+22, appended) | `.region[data-docked]` padding; folded toast: icon hidden, message clamped to one line | Docked stacks only |
| `src/screens/focus/FocusScreen.tsx` (+2/−1) | `data-toast-dock=""` on `.stageBox` | Session screen (focus, paused, break, Break's over, whistle, summary) |
| `src/screens/focus/FocusScreen.module.css` (+4) | `--toast-dock: on` on `.stageBox` inside `@media (min-aspect-ratio: 5/4) and (min-width: 560px)` | That media query covers **landscape phones, tablets and desktop (1440×900 too)**, every session view including the summary. No layout property changes (a custom property only) |
| `tests/toast-room.spec.ts` (+145, appended) | One new test, 2 rows | Test suite |

Not touched (byte-identical to `b39202f`): M1 (`storage.ts`, `timer/**`, `progress/**`, `flow.ts`), the banner
(`SaveWarning*`, `saveWarning.ts`), the summary note, M7b's panel CSS, Today/Home, every other spec.

## Rule applied

A round-7 check reruns if it exercises a toast (any screen: `Toast.tsx` runs everywhere), the session screen's
layout, or the new spec. A round-7 check stands if it exercises none of these.

## Reruns (with reason and who runs them)

| # | Round-7 check | Why it reruns | Runs it | Control this session |
|---|---|---|---|---|
| 1 | **R7-D1 rows**: `toastroom2.mjs` (sha `7123da04`), 667×375 and 844×390 @200, light and dark, update prompt and arriving toasts, panel top / end / back | The defect itself | **LEAD** (control + fix + INT) and Lane 1 (acceptance with real input) | `b39202f` :5301 must reproduce (11 / 26 px, Update not on top) |
| 2 | **Close / Ambience / Mute sweep**: Lane C `closecheck2.mjs` (sha `863c0a92`), session states × panel top/end × 1 and 3 toasts, real taps | Toast room logic changed (room top while docked, re-measure on scroll) | **LEAD** on R8 | `49ea1de` :5305 must reproduce Close / Ambience covered |
| 3 | **R5-D1 race** | Toast code changed (brief) | Lane 1 (LEAD audits raw rows) | R5 :5302 |
| 4 | **LEAD-D1** ("Mark done" with toasts up) | Toast code changed (brief); "Crossed off · Undo" is a toast on Break's over / Today | Lane 1 (LEAD audits) | `e866118` :5304 |
| 5 | **Toast and panel geometry** at 375×667, 390×844 (portrait), 667×375 and 844×390 (landscape), incl. r6 #5 / #7 / #9 (older toasts below the room, visual order, toasts over Break's over title) | Same hook on every size; portrait must be unchanged | Lane 1; LEAD spot-checks 375×667 @200 n3 (disclosure 5) on INT, `b39202f`, R8 | — (comparison rows) |
| 6 | **The maker's 5 disclosures** (dock at 100 %; folded icon; stays docked; reloads; portrait 3-toast limit) | New behaviour in round 8 | **LEAD** own probe (`.tmp/LEAD8/dockcheck.mjs`) on R8 vs `b39202f` vs INT | n/a (classification rows) |
| 7 | **New-risk checks from the diff** (not in round 7): (a) the dock at desktop 1440×900 and at the landscape **summary** (same media query); (b) a sheet (Ambience) opened over a docked stack; (c) live-region additions while docking / folding (no re-announcement); (d) toasts docked over the stage while focus runs (the kettle arc) | Same media query covers desktop and summary; dock validity is re-checked only on measure | **LEAD** own probe | INT / `b39202f` same state |
| 8 | **Full regression**: tsc, vitest, chromium (incl. `toast-room`, `break-reach`, `integrity` `:768`/`:1090`, `a11y`, `statusbar`), timer-harness / timer-app / pwa | Toast code and a spec changed; `:1090` depends on End's toast lift timing, which the new stack-change layout effect alters | Lane 2 (LEAD reads raw logs / JSON) | — |
| 9 | **Standard capture set** R8 vs INT (light and dark; 390×844, 375×667, 1440) incl. states 10-break-over (D4 toast), 14 summary (reward toasts) | Toast states in the set | Lane 2 (LEAD opens differences) | INT |
| 10 | **R7-4** (toasts over the banner, 844×390 @200 on arrival) and **R7-5** (reward toasts over the summary note) | Toast code; R7-5's summary sits under the new media query in landscape | Covered by #5, #7a and #9; Today has no `[data-toast-dock]` (code) so R7-4's room logic is unchanged except re-measure frequency | INT |
| 11 | **`toastcheck.mjs`** (M7b's, Lane C 5a) | Toast placement | Folded into #2 (same states, stricter) unless time allows | — |
| 12 | **R7-14** (Ambience dialog still open 0.7 s after Escape at 1440, UNKNOWN) | Round 7 asked to re-check in round 8's sweep | #2 / #7b if a 1440 row runs; else stays UNKNOWN | — |

## Round-7 receipts that stand (not rerun)

| Round-7 check | Why it stands |
|---|---|
| M1 data behaviour (`behave`, integrity data tests) | `storage.ts`, `timer/**`, `progress/**`, `flow.ts` byte-identical; Lane 2's full chromium run re-executes the integrity spec anyway |
| Banner first appearance / Mark done ruling (R7-1, R7-2, R7-3), said-log | Banner code untouched; Vibei's ruling stands. LEAD-D1 (#4) covers the toast part |
| Summary note clears the Tea time / Skip footer (B `sum4` gaps) | The note, the summary and the footer are untouched; `FocusScreen.module.css` gains a custom property only (no layout property). Lane 2 capture 14/15 and Lane 1 geometry would show any layout change |
| M7b reach (`reach.mjs`, 30 rows) | Panel CSS unchanged (custom property + data attribute only). `break-reach.spec.ts` reruns inside #8 |
| "Saved" wordings (R7-13), focus on recovery (R7-8), second episode (R7-9) | Files untouched |
| R7-6 shade band, R7-10 Resume rim, R7-11 / r6 #3 Today strip | Not toast-related; files untouched |
| `:768` pill race (R7-12) | Test and app code untouched; reruns inside #8 regardless |
