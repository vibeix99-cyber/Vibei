# Lane A (known defects) receipt, round-7 review

Lane **A**. Checks and receipt only: **no verdict**. No application code, tests or maker files edited; nothing committed
or pushed. The orchestrator's servers were never stopped. Coverage is labelled per item below (**covered**, **partly
covered**, **not run**). Partial coverage is never a pass.

| | |
|---|---|
| Wall-clock start (UTC) | **2026-10-11 03:23:56** (first instance, first command). **Relaunched 2026-10-11 09:43 UTC** after a usage limit stopped the first instance at about 04:50 UTC (the last run it recorded ended 04:55:22); relaunch budget 75 min, to 10:58 |
| Wall-clock end (UTC) | **@@END@@** |
| Model / effort | First instance (03:23 to about 04:55 UTC): Claude Opus 5.5 (`claude-opus-5-5`). **Relaunch (09:43 UTC on): Claude Sonnet 5.5 (`claude-sonnet-5-5`)**. Reasoning effort: not inspectable for either |
| Under review | **R7** trial merge `b39202f8d391…` (worktree `/home/user/wt/rv7-r7`, clean; `kettle/src` `6db18ada524d…`), http://127.0.0.1:5301 (dev, debug API) |
| Controls | **R5** `20671eb` http://127.0.0.1:5302 (R5-D1) · **INT** `0d58c5e` http://127.0.0.1:5303 (BEFORE; the M2 defects) · **e866118** http://127.0.0.1:5304 (LEAD-D1) |
| Servers (relaunch) | The orchestrator restarted all servers at 09:40 UTC on the same ports and builds and re-verified them: R7 `b39202f` :5301, R5 `20671eb` :5302, INT `0d58c5e` :5303, `e866118` :5304, unfixed `49ea1de` :5305. The controls recorded earlier on these builds stand (not rerun). Gate: from 03:58 UTC fair share, slot gate as in section 2; the relaunch waited for the lead's exclusive run (gate entry `LEAD`, `integrity.spec.ts`) to leave `slots.py status` (it was gone at 09:48:26, when the first relaunch job took a slot) |
| Machine | 4 CPUs shared with lanes B, C, D, Dcap, LEAD; every browser through `tools/slots.py`. `/proc/loadavg` (1 min) at series starts/ends: 2.8 – 15.0 (`runs/series.log`, `specs/specs.log`; per run in each jsonl as `loadStart`/`loadEnd`) |
| Evidence | `A/runs/<series>/` (stdout, jsonl with every frame, screenshots, `clip-*.webm`), `A/specs/` (spec logs), `A/probes/` (probes, originals, diffs, `SHA256SUMS.txt`, analysis scripts), `A/tables.md` (all tables regenerated from the jsonl by `probes/analyze.py`) |

## 0. Summary (per check and configuration; no verdict)

### Coverage

| Item | Coverage | What is missing |
|---|---|---|
| Check 1 — R5-D1, wheel, 3 configurations | **covered** (control first; R7 10 runs each, expiry after / during / before (variant)) | the control reproduced the strict mechanism at 375×667 light and dark, at 844×390 only by the probe's own judge |
| Check 1 — R5-D1, touch | @@TOUCHCOV@@ | @@TOUCHMISS@@ |
| Check 1 — clips | **covered** for every configuration (R7 wheel clips: 375×667 light, 375×667 dark, 844×390 light) | no touch clips and no R5-control clips for check 1 (not required: one clip per configuration) |
| Check 2 — LEAD-D1 case 1, 4 configurations | **covered** (control 2 runs per configuration, R7 3 runs per configuration, clips both) | — |
| Check 2 — LEAD-D1 case 2, 4 configurations | **covered, 1 R7 run per configuration** (the 2nd/3rd repetitions were cancelled in the first instance) | 844×390 @200: a tap is impossible on both revisions (the update toast covers Mark done), so it is covered by the keyboard variant: control 28/27, **R7 1 run done at 04:54:59 UTC** (details below) |
| Check 3 — D1, D2, R2-D1, R4-D2 (statusbar spec), D4 (a11y spec) | **covered** at the spec level (INT control established except R4-D2) | R4-D2 has no control; @@D4COV@@ |
| Check 3 — D3 / R2-D3 / R4-D1 readability probe | @@RWCOV@@ | @@RWMISS@@ |
| Item 5 (relaunch) — banner after "Mark done" at 200 %, setups a and b | @@ITEM5COV@@ | @@ITEM5MISS@@ |

"Control" = the same probe on the control server in this session, run **before** the R7 series of that configuration
(`runs/series.log`). "Counts?" says whether R7's zeros count under the counting rule (section 4).

### Check 1 — R5-D1 race (200 % text, storage really full, End after 12 min with a level-up, real wheel / CDP touch, natural expiry)

| Config | Input | R5 control: runs · probe FAIL · strict R5-D1 | R7: runs · failures (banner gone/faded, moved in page, Save backup cut) · banner adds/removals · live-region additions per run | R7 zeros count? |
|---|---|---|---|---|
| 375×667 light | wheel | 1 · 1 · **1** (stopped at the first strict reproduction; + 1 earlier run with `natural-a`, probe FAIL, not strict) | 10 · **0** · 1/0 in 10 · 0 or 1 (never >1) | **Yes** |
| 844×390 light | wheel | 15 · **4** · 0 | 10 · **0** · 1/0 in 10 · 0 or 1 | **Only at the probe-judge level** (control reproduced by the probe's own judge, the criterion M7a used; not by the strict mechanism) |
| 375×667 dark | wheel | 7 · 2 · **1** (stopped at the first strict reproduction) | 10 · **0** · 1/0 in 10 · 0 or 1 | **Yes** |
| 375×667 light | touch | 15 · 0 · 0 | 10 · **0** · 1/0 in 10 · 0 or 1 | **No** — control not established |
| 844×390 light | touch | 15 · 3 · 0 | 10 · **0** · 1/0 in 10 · 0 or 1 | **Only at the probe-judge level** |
| 375×667 dark | touch | 15 · 0 · 0 | @@T375DTXT@@ | **No** — control not established |
| timing variant: expiry **before** the gesture (`natural-a3`, PRE 2600–4000 ms), 375×667 light | wheel | not possible by construction (R5-D1 needs a toast to leave while the list is scrolled) | 4 · **0** · 1/0 · 0 or 1 | **No** (descriptive) |

Expiry landed (R7, per run, older toasts' departures vs the gesture window): wheel 375×667 light: after 5, during+after 1,
during 4; wheel 844×390: after 1, during+after 8, during 1; wheel 375×667 dark: after 5, during+after 1, during 4; touch
375×667 light and 844×390: during 10 each; timing variant: before 3, before+during 1. An older toast left while the
toast list was scrolled in 3 / 8 / 4 (wheel 375L / 844L / 375D) and 6 / 10 (touch 375L / 844L) of the R7 runs.

### Check 2 — LEAD-D1 (storage full, real "Mark done", "Crossed off · Undo"; case 2 with the never-expiring update toast)

| Config | Case | e866118 control: warning toast adds/removals · frames with its box over the dock · live-region additions | R7: valid runs · banner adds/removals · min opacity · page-top drift · Save backup cut (frames) · live-region additions · banner in view after the tap | R7 zeros count? |
|---|---|---|---|---|
| 375×667 @200 light | 1 | **10/9** · 186 · 10 (`markdone-a`, clip); **11/10** · 257 · 11 (`markdone-a2`) | 3 · 1/0 ×3 · 1 · 0 px · 0 · 1 ×3 · **never in view: 0 of 449–473 frames; 429–444 px above the view** | Yes |
| 375×667 @200 dark | 1 | **10/9** · 176 · 10; **11/10** · 251 · 11 | 3 · 1/0 ×3 · 1 · 0 px · 0 · 1 ×3 · **never in view; 376–441 px above** | Yes |
| 844×390 @200 light | 1 | **10/9** · 134 · 10; **11/10** · 244 · 11 | 3 · 1/0 ×3 · 1 · 0 px · 0 · 1 ×3 · **never in view; 167–177 px above** | Yes |
| 667×375 @150 dark | 1 | **9/8** · 139 · 9; **11/10** · 229 · 11 | 3 · 1/0 ×3 · 1 · 0 px · 0 · 1 ×3 · **never in view; 167–176 px above** | Yes |
| 375×667 @200 light | 2 (tap) | **24/23** · 485 · 24 | 1 · 1/0 · 1 · 0 px · 0 · 1 · **never in view; 513 px above** | Yes (1 run) |
| 375×667 @200 dark | 2 (tap) | **25/25** · 527 · 25 | 1 · 1/0 · 1 · 0 px · 0 · 1 · **never in view; 518 px above** | Yes (1 run) |
| 844×390 @200 light | 2 (tap) | **INVALID**: Mark done could not be brought clear of the update toast (it covers the whole strip above the docked start); tap at y −17, nothing crossed off | **INVALID** for the same reason | — |
| 844×390 @200 light | 2 (**keyboard**: Tab… Enter, `markdone-a3`) | **28/27** · 609 · 28 | 1 (run at 04:54:59 UTC) · 1/0 · 1 · 0 px · 0 · 1 · **never in view of 714 frames; 132 px above the view (bottom edge; top −424)**; scrollY 134 → 440 (+306 px) in the frame of the banner's insertion; composer field top constant (−13/−12) | Yes (1 run) |
| 667×375 @150 dark | 2 (tap) | **25/24** · 577 · 25 | 1 · 1/0 · 1 · 0 px · 0 · 1 · **never in view; 184 px above** | Yes (1 run) |

### Check 3 — earlier M2 defects on R7 (INT `0d58c5e` as the control where it discriminates)

| Defect | Evidence | INT (control) | R7 | R7 zeros count? |
|---|---|---|---|---|
| D1 (re-fit after resize/rotation to 375×667) | `statusbar.spec.ts` "resize or rotation … re-fits the row" (light, dark) | **fail 2/2** | pass 2/2 | Yes |
| D2 ("Level NN" at large text) | `statusbar.spec.ts` "large text with large leaf totals …" (light, dark) | **fail 2/2** | pass 2/2 | Yes |
| R2-D1 (narrowing that leaves the bar's box unchanged, from 384 px and 1 px at a time; no sideways scroll) | `statusbar.spec.ts` "narrowing … from 384 px, and 1 px at a time" (light, dark) | **fail 2/2** | pass 2/2 | Yes |
| R4-D2 (rapid live resizes at 200 % and 150 % leave `visualViewport.scale` 1) | `statusbar.spec.ts` "rapid live resizes at large text leave the page unzoomed" (light, dark; 200 % and 150 %; zero-wait bounce, 2 px/16 ms drag, 1 px no-wait) | pass 2/2 (does not discriminate: R4-D2 was introduced and fixed inside M2's branch, INT never had it) | pass 2/2 | **No** — control not established (no server in this session carries R4-D2) |
| (statusbar, other) | "normal text: one row at 390 … and at 375 (tight)" | fail | pass | — |
| D4 (toasts over "Mark it done" / Break's over controls) | `a11y.spec.ts` "toasts never cover the break-over controls, carried task included" (390×844, 375×667) | **fail** at 390×844 ("1 toast(s)" over a control); 375×667 did not run in the full-file run (serial spec stops at the first failure). @@D4INT@@ | pass 2/2 | Yes at 390×844; @@D4ZERO@@ |
| D4 neighbours | `a11y.spec.ts` "a toast never covers the session controls or the summary footer" (390×844, 375×667) | pass 2/2 (no discrimination) | pass 2/2 | No (descriptive) |
| D3 / R2-D3 / R4-D1 (the storage-full warning readable at 200 %: every line wholly seen, Save backup reachable and working, stacked with the level-up toasts) | `readwarn.mjs` (new), real wheel, End after a level-up | **fail 4/4**: 375×667 light 11/18 lines never seen + Save backup never hit-testable; dark 9/18 + same; 390×844 light 5/18 lines; 844×390 light 5/12 lines + Save backup, warning removed/re-added 7× | **0/3 in the first instance**: 375×667 light and dark, 390×844 light — 7/7 lines seen, Save backup hit after 8–14 real strokes, real tap saved `kettle-backup-2026-10-11.json`; no toast squeezed. @@RWR7@@ | Yes for 375×667 light and dark and 390×844 light (wheel). @@RWNOTE@@ |
| Banner and toasts in the room (R7 design) | `toast-room.spec.ts` (12 tests: banner whole and steady while toasts are read by wheel/touch at 375×667, 844×390, 667×375 @200 %; endless action toast; last toast fades; three toasts never cover Close) | not run (the spec asserts the R7 banner; INT has no banner) | **12/12 pass** | Descriptive (no control) |
| Whole a11y spec | `a11y.spec.ts` (11 tests) | 1 failed ("short screen (375×667): every control can be scrolled clear of sticky chrome") then 7 did not run (serial); 3 passed | **11/11 pass** | — |
