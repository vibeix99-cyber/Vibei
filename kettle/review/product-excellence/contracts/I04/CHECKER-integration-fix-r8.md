# I03 × I04 combined integration fix · CHECKER r8 (LEAD)

**Verdict: APPROVE**

| | |
|---|---|
| **Reviewed revision (binding)** | Trial merge **R8 = `9ff0d04`** (`9ff0d04884ff71cd58aafd173d023b7081b702fb`) = integration `61a60b2` + `pe/r8-toastroom@2c3172c`. **`kettle/src` tree `42e106daaf0628ee8429fb6131ab29848931f367`** (= `2c3172c:kettle/src` = `f3c9357:kettle/src`). Checked by me in `/home/user/wt/r8-trial` (`git rev-parse HEAD HEAD:kettle/src`). |
| **What changed since round 7** | `git diff --stat b39202f 9ff0d04 -- kettle ':!kettle/review'` lists exactly the five round-8 files: `src/ui/Toast.tsx`, `src/ui/Toast.module.css`, `src/screens/focus/FocusScreen.tsx`, `src/screens/focus/FocusScreen.module.css`, `tests/toast-room.spec.ts`. Everything else is byte-identical to the round-7 trial merge `b39202f`. |
| **Controls (reproduced this session)** | `b39202f` :5301 for R7-D1 (by me and Lane 1); R5 `20671eb` :5302 for R5-D1 (Lane 1, raw re-read by me); `e866118` :5304 for LEAD-D1 (Lane 1); `49ea1de` :5305 for Close (at 375×667) and Ambience (at 667×375) (Lane 1, raw re-aggregated by me). INT `0d58c5e` :5303 for comparisons. |
| **Servers** | Orchestrator-owned, never stopped by me. R8 dev :5306 runs `.tmp/rv7.vite.config.ts` (`hmr: false, watch: null`). |
| **Checker** | Round-8 LEAD, newly launched. I built nothing in rounds 7 or 8 and am not an earlier maker or Checker. I edited no app code, tests or maker files, committed nothing, and pushed nothing. |
| **Model / environment** | Claude Opus 5.5 (`claude-opus-5-5`). 4 CPUs shared with Lane 1, Lane 2 and others; load 1–17. Headless Chromium with SwiftShader and emulated viewports; large text is `html{font-size:…%}`. Every browser launch went through `slots.py --lane LEAD`, with a fresh context and a disposable profile each time. Work ran 18:07–19:40 UTC on 2026-10-11. |
| **Notes / runs / probes** | Notes: `integration-fix/round8-review/LEAD/NOTES.md` (sections 0–12). Rerun list: `round8-review/LEAD/RERUN-LIST.md`. Runs: `round8-review/LEAD/runs/{toastroom2,dockcheck,navdiag,navdiag2,navdiag3,capd-667,stddark}/`. Probes (git-ignored): `/home/user/wt/rv7-int/kettle/.tmp/LEAD8/`. These are `toastroom2.mjs` (the round-7 lead's, sha `7123da04`, unedited), `dockcheck.mjs` (mine, `62e98fbe`), `dockcheck2.mjs` (`36e77aaa`, which adds a synthetic-Undo switch), `accept.mjs` (M8's, `b65020ab`, unedited), `accept-nav.mjs` / `accept-nav2.mjs` (M8's probe plus CDP navigation logging and a liveness check after an error, `5529b38a` / `b1555081`), and `cap-d.mjs` (Lane D's, `fbd6cab0`, unedited). |

## Short version

Round 8 fixes R7-D1 by construction.

- **The fix.** On a session screen laid out side by side (landscape phones, tablets, desktop), a stack that cannot fit whole above the controls now moves into a *dock*: the stage column. The stage is an `aria-hidden` illustration (`Stage.tsx` l.83) with no text and no control. The dock is re-checked on every measure: on screen, at least 56 px each way, and no control intersecting it.
- **When three toasts at 200 % still don't fit,** the stack folds its oldest toasts to one line, keeping each action in place.
- **The rest is unchanged.** Portrait, Today, Settings, Stats and Nook keep the round-7 room logic. The room now re-measures inside every scroll event, so it follows a scrolled panel in the same frame.

**R7-D1 is fixed, and its control reproduced this session.**
- On `b39202f`, at Break's over scrolled to its end at 667×375 / 844×390 @200, the update prompt is a 52 px box with 11 / 26 px visible. Update is not on top, and the sliver sits over "Next: brew 2 of".
- On R8 the same rows show it whole (186/186 and 146/146 px), docked, with Update on top and no top-bar words under it. It stays whole when the panel scrolls back to the top.
- Lanes and the maker add the following. Every claim I used was traced to raw rows.
  - 0 covered-control frames in about 3,700 + 3,500 frames (Lane 1's `l1dock` and `l1dock2`).
  - Every real tap on a toast action activated, including Update while folded.
  - Close and Ambience are clear where their controls reproduced: Close 0/729 against 159/671 on `49ea1de`, Ambience 0/1235 against 454/1253.

**Nothing else blocks.**
- **R5-D1 and LEAD-D1 stay fixed.** Their controls reproduced: R5-D1 strictly in 1 of 8 runs in each theme on R5, LEAD-D1 in 6 of 6 on `e866118`. R8 failed 0 of 12 and 0 of 12.
- **Portrait is identical to `b39202f`.** M8 32/32, Lane 1 32/32 and my rows agree.
- **Every UI state captured is pixel-identical to R7** across Lane 2's nine cap-d configurations and my 667×375 set. The only exception is the dock itself.

**The maker's five disclosures:**

| # | Disclosure | Class |
|---|---|---|
| 1 | Two toasts at 100 % dock in landscape | ACCEPTED: an improvement on both `b39202f` and INT |
| 2 | Folded toasts hide their icon (and clamp their text) | FOLLOW-UP |
| 3 | Stays docked after scrolling back to the top | ACCEPTED |
| 4 | Probe page "reloads" | ACCEPTED: diagnosed; nothing reloads |
| 5 | Portrait keeps the 3-toast limit | FOLLOW-UP |

**Disclosure 4 in brief.** The "Execution context was destroyed" error is not a page reload.
- I caught one with full instrumentation (`navdiag3`).
- No navigation request, frame navigation, crash or console line was logged.
- 4 s later the page was still the same document, with `performance.now()` continuous and navigation type `navigate`, on the same route.
- The app's `window.__kettle` and the probe's own recorder object, installed before the error, were still there. The recorder's rAF loop was still counting, and a toast raised after the error rendered.
- The error is the automation channel's. It appeared only under machine load: 0 of 4 runs at load 1–7.

## Rerun list (written first; full reasons in `round8-review/LEAD/RERUN-LIST.md`)

A round-7 check reruns if it exercises a toast on any screen (`Toast.tsx` runs everywhere), the session screen's layout, or the new spec.

| # | Check | Ran it | Control this session |
|---|---|---|---|
| 1 | R7-D1 rows (`toastroom2`, 667×375 / 844×390 @200, light and dark, update / arrive, panel top / end / back) | **LEAD** (control, R8, INT) and Lane 1 | `b39202f` reproduced (LEAD 18:22, L1 18:08) |
| 2 | Close / Ambience / Mute sweep (`closecheck2`) | Lane 1 (raw re-aggregated by me) + M8's run | `49ea1de`: Close at 375×667, Ambience at 667×375 |
| 3 | R5-D1 race | Lane 1 (raw read) | R5 strict 1 of 8 in each theme |
| 4 | LEAD-D1 | Lane 1 (raw read) | `e866118` 6 of 6 |
| 5 | Toast and panel geometry (375×667, 390×844, 667×375, 844×390), including round-6 items #5, #7 and #9 | Lane 1 + **LEAD** (`dockcheck`) | comparison rows (`b39202f`, INT) |
| 6 | The maker's five disclosures | **LEAD** (`dockcheck`, `navdiag*`) | `b39202f`, INT |
| 7 | New risks in the diff: dock at desktop and at the summary (same media query), a sheet over a docked stack, live-region additions, focus running | **LEAD** (`dockcheck`) | `b39202f`, INT |
| 8 | Full regression (tsc, vitest, chromium, timer-harness / timer-app / pwa) | Lane 2 (raw logs and JSON read by me) | — |
| 9 | Standard capture set and cap-d | Lane 2; **LEAD** dark standard set (see "Wave 1 regression") | INT; R7 cross-check |
| 10 | R7-4 / R7-5 (toasts over the banner or the summary note) | covered by 5, 7 and 9 | — |

**Stand from round 7** (untouched by the diff): M1 data behaviour; the banner and Vibei's Mark-done ruling (R7-1 to R7-3); the summary note's footer clearance; M7b's reach (`break-reach.spec.ts` reran green inside #8); the "saved" wordings; R7-6, R7-8, R7-9, R7-10, R7-11 and R7-13.

## Verified myself, and taken from lanes

**Verified myself (raw evidence in `LEAD/runs/`):**
- Revision, tree and changed-file set; the diff, read in full.
- R7-D1 control reproduction and the R8 rows (`toastroom2`, 18:22–18:26 UTC, with INT).
- `dockcheck`, 22 contexts plus 9 more:
  - Break's over on R8 at 375×667 @200, 667×375 @100 / @200, 844×390 @100 and 1440 @200;
  - INT at 375×667 @200 and 667×375 @100 / @200;
  - `b39202f` at 375×667 @200, 667×375 @100 and 844×390 @100;
  - the Ambience sheet on R8 (667 L, 844 D), `b39202f` (667 L, 844 D) and INT (667 L, 844 D);
  - the summary on R8 (667 L, 844 D, 1440), `b39202f` (667 L, 844 D, 1440) and INT (1440);
  - focus running on R8 and `b39202f` (667 @100, 844 @200);
  - the constructed two-action-toast case at 375×667 @200 on R8, `b39202f` and INT.
- The navigation diagnosis: `navdiag` (3 R8 + 1 control), `navdiag2` (4 R8 at low load) and `navdiag3` (6 R8 under load).
- R7 `b39202f` cap-d at 667×375 @200 (Lane 2's flag 1), pixel-diffed against Lane 2's R8 images.
- The maker's evidence: probe hashes (`sha256sum -c` all OK), raw `geom` rows, and 48 BEFORE/AFTER captures sampled at full size (below).
- Lane 2's raw logs and JSON.
- Lane 1's raw Close/Ambience rows, re-aggregated, and the R5-D1 stdout and rows.
- Attribution of the `dev-r8.log` "ResizeObserver loop" errors: all 38 fall at 18:17:56–18:22:35, during Lane 2's chromium run against :5306, and none came from any probe page (my window-error counter read `{}`).
- Memory: `oom_kill 0`, memory pressure 0.

**Taken from lanes, after tracing raw rows:**
- **Lane 1:**
  - `accept` at 200 / 150 / 100 % (stdout and jsonl read);
  - `l1dock` / `l1dock2` per-frame wholeness (raw `toastFirst` rows read);
  - LEAD-D1 (receipt table; control adds and removals 9–26 / 8–25 against R8's 1/0);
  - portrait geometry 32/32.
- **Lane 2:** the capture diffs (`capd-diff`, `r7cross`, `std-matrix`), with images opened where cited.
- **Not relied on:** the maker's claims as such. M8's rows were audited; its count of page losses (it reported 2; the raw rows show 4) and its "dev-client reload" reading were corrected.

## The five disclosures, judged

| # | Disclosure | Evidence | Class and reason |
|---|---|---|---|
| 1 | In landscape, 2 toasts (also at 100 %) dock over the stage when they can't fit above the controls | 667×375 @100, Break's over:<ul><li>**R8:** n2/n3 docked in [12,12,315,363], nothing under (text or control).</li><li>**`b39202f`:** n2 sits over the "Break’s over" title; at n3 the update prompt is over the top bar's "Next: brew 2 of 4" and Cozy shows 38/52 px.</li><li>**INT:** "Mark it done" is under a toast in every sample.</li></ul>844×390 @100: the same pattern. Lane 1's 100 / 150 % accept rows: 0 covered, 56/56 taps. Frames opened: R8 667 @100 top n1 and n3. | **ACCEPTED.** Not a defect; an improvement over both comparison builds. The dock holds no text or control, and every toast is whole with its action on top. |
| 2 | Folded toasts hide their icon, and their message is clamped to one line | Only docked, 3 toasts, 200 %:<ul><li>667×375: all three fold (105 / 57 / 105 px);</li><li>844×390: only the oldest folds.</li></ul>Every action stays on top, and Update / Undo taps activated while folded (L1, M8). The full text stays in the DOM and was announced once. Lane 2 flag 3: "Recipe done: Tak…" hides "+15 leaves". In the same state `b39202f` shows those toasts at 0 px or as slivers (M8 BEFORE end-n3; L1 control rows), and INT cuts the update prompt to 88/97 px over "Next: brew 2 of 4" (my INT 667 @200 row). | **FOLLOW-UP.** It hides part of a toast's own text (and the decorative tone icon) while three toasts are up at 200 % in landscape. It is not worse than `b39202f` or INT, which hide more in the same state. **Cause:** `Toast.tsx` `foldToFit()` and `Toast.module.css` `.region[data-docked] .toast[data-folded]`. **Owner:** M8 / the I04 toast owner (M2). Keep the icon, or fold the newest action-less toast first, so that a reward amount is not the part hidden. |
| 3 | A docked update prompt stays docked after scrolling back to the top | My rows (667 / 844 @200 "back at top": docked, 186/186 and 146/146, Update on top, nothing under); Lane 1's four `l1dock` runs; it undocks once the stack empties | **ACCEPTED.** By design, so the stack does not jump during scrolling. Over the stage it covers only `aria-hidden` art; the old room at the top laid it over the title and sentence (round-6 #9). |
| 4 | Probe pages lost to "reloads" | <ul><li>`Execution context was destroyed` on R8: M8 ×4 (1 on `f3c9357`, 3 on superseded `23c781b`; the packet says 2); Lane 1 3 of 10 at 844×390 @200 wheel; me 1 of 3 (`navdiag`), 0 of 4 at load 1–7 (`navdiag2`), 1 of 6 at 3-browser load (`navdiag3`), and 1 in `dockcheck` (844×390 @100).</li><li>**`navdiag3`, caught with instrumentation:** no document request, no frame navigation, no crash and no console line after the hash changes. 4 s later the page was the same document (`performance.now()` 29,698 ms, type `navigate`), route `#/focus`; `window.__kettle` and the probe's own pre-error `window.__acc` were present; its rAF recorder went 893 → 953 frames in 1 s; a toast raised after the error rendered; the timer read `idle` (Break's over).</li><li>`navdiag` run 3 shows the same (same document, no request).</li><li>The R8 server has `hmr: false, watch: null`; its log shows no optimizer reload.</li><li>The app has no full-navigation path in dev (only hash links, plus the service-worker update in `pwa/register.ts`).</li></ul> | **ACCEPTED (not a product defect).** Nothing navigates, reloads or crashes: the page's JS world and state survive, so a user sees nothing. The failure is in the probe's CDP evaluation channel and appears under load. M8's "dev-client reload" explanation is wrong, and so is its count (4, not 2). **Follow-up (tests):** probes should treat this error as retryable. |
| 5 | Portrait keeps `b39202f`'s 3-toast limit at 375×667 @200 | <ul><li>M8 / Lane 1 / my rows: the update prompt is whole (146/146) with Update on top at the panel's top, end and back.</li><li>At the end with 3 toasts, the oldest plain toast is 0/57 px (scrolled inside the stack, round-6 #5 / D3).</li><li>In the constructed two-action-toast case (update + Undo), the Undo toast shows 86/146 px with Undo not on top. **After a real touch drag on the stack it is whole, Undo on top, and a real tap activated it.** R8 = `b39202f` sample for sample.</li><li>INT in the same 3-toast state shows the toasts whole but **covers Close**.</li><li>In the app, a real "Mark it done" on Break's over raises no toast; the only action toast there is the update prompt.</li></ul> | **FOLLOW-UP.** It is present on approved round-7 behaviour, not worse, and INT's counterpart hides a control. The update prompt (the R7-D1 concern) is whole and actionable in every portrait position. **Cause:** the D4 lift above the Break's over action group (`Toast.tsx` `toastLiftBottom()`, `FocusScreen.tsx` `.overDock`) shortens the portrait room once the scrollable panel is at its end; portrait has no dock. **Owner:** I04 toast owner (M2), with M8. |

## Visual gate: BEFORE (`b39202f`) → AFTER (R8), opened at full size

| State | BEFORE | AFTER | What it shows |
|---|---|---|---|
| 667×375 @200 light, Break's over end, update prompt (M8 `BEFORE/AFTER-…-end-n1`) | A sliver at the top edge behind "Next: brew 2 of" | Whole over the stage, Update visible; top bar and panel clear | **R7-D1 fixed** |
| 667×375 @200 light, end, 3 toasts (M8 `…-end-n3`) | Nothing but the sliver | Three folded toasts over the stage: "A fresh brew of… · Update", "Marked “Chapter… · Undo", "Cozy level 5!" | Fixed; fold (disclosure 2) |
| 844×390 @200 dark, end, update prompt (mine: `toastroom2/v2-{b39202f,9ff0d04}-844x390-t200-dark-update-b-end.png`) | Sliver behind "Next: brew 2 of" | Whole over the stage | **R7-D1 fixed** |
| 844×390 @200 dark, end, 3 toasts (M8 `…-end-n3`) | Sliver only | Oldest folded, others whole, over the stage | Fixed |
| 375×667 @200 light, end, 3 toasts (M8 BEFORE and AFTER `…-end-n3`) | Update whole; the Undo toast cut at the room's bottom | **Identical** | Portrait unchanged (disclosure 5) |
| 667×375 @100 light, top, 1 and 3 toasts (mine, `dockcheck/9ff0d04-667x375-t100-light-over-top_n{1,3}.jpg`) | (`b39202f` rows: over the title, and over "Next: brew 2 of 4" at n3) | n1 over the sentence (round-6 #9, as before); n3 docked whole, panel clear | Disclosure 1 |
| 667×375 @200 light, summary, 3 toasts (mine) | (`b39202f` rows: over "25 minutes brewed"; Undo 4/146) | Docked over the stage; summary card, Tea time and Skip clear | Improves R7-5 in landscape |
| 667×375 / 844×390 @200, Ambience sheet open over 3 toasts (mine) | (`b39202f` rows identical to R8) | Toasts above the sheet's title and text; at 844 also over its Close and Turn on | Pre-existing (FOLLOW-UP R8-F3) |
| 667×375 @200 light, Today with storage full (Lane 2 a2; my R7 cap-d) | Pixel-identical (0 %) | Pixel-identical (0 %) | Round-7 R7-11 class, unchanged |
| 375×667 @200 light, std 07-summary, 01-home (Lane 2) | — (R8 = INT 0 %) | Third chip row half under the footer; Brew length below the docked start | Ranked follow-ups 1 and 2 |

**Judgement:**
- The dock reads as calm and on brand: the same toast tokens over the scene, inset 8 px, and the panel and top bar untouched.
- The fold is legible and keeps every action.
- The preserve list holds:
  - K01 Today with the docked start (std 01 is 0 % against INT at 375, 390 and 1440);
  - the K02 compact summary with its footer (std 07 / 08 0 %);
  - K09 Settings (std 19 0 % against R7).
- **The visual gate passes** for R7-D1 at both landscape sizes, in both themes, and for unchanged portrait.

## Residual table

**New in round 8, or newly seen around the changed code:**

| # | Item | Evidence | Class | Cause / files / owner / reason |
|---|---|---|---|---|
| R7-D1 | Toast room at Break's over's end, landscape @200 | Control reproduced (LEAD, L1); R8 rows above | **RESOLVED** | Dock (`Toast.tsx` `toastDock()`, `FocusScreen.module.css` `--toast-dock`) |
| D-1 | Disclosure 1 | above | **ACCEPTED** | Improvement |
| D-2 | Disclosure 2 (fold) | above | **FOLLOW-UP** | M8 / M2 |
| D-3 | Disclosure 3 | above | **ACCEPTED** | By design |
| D-4 | Disclosure 4 (probe context loss) | above | **ACCEPTED** | Not a page event; probes should retry |
| D-5 | Disclosure 5 (portrait) | above | **FOLLOW-UP** | M2 / M8 |
| R8-F1 | **Transient clip of an action-less toast in the docked stack** when a toast arrives and another leaves: "Cozy level 5!" 12–41 of 57 px for ≤ 0.5 s (≤ 0.8 s under load). One settled sample at 667×375 @150 dark showed 38/49 px at the docking moment. No action toast was ever clipped. | Lane 1 1.3, 1.4 and 1.5 (raw `toastFirst` rows read) | **FOLLOW-UP** | The docked list's scrollport clips the motion `layout` animation (`Toast.tsx` ToastView `layout`, `.list` overflow in `Toast.module.css`). In the same state `b39202f` clips toasts permanently, so it is not worse. Owner M8 / M2. |
| R8-F2 | **A single toast at the panel's top in landscape stays undocked** and covers the panel's sentence ("Ready for another brew…", round-6 #9); at 844×390 @200 with 3 toasts at the top the stack overlaps it too (Lane 2 flag 2) | My 667 @100 n1 row and frame; Lane 2 e0 (R8 = R7, 0 %) | **ACCEPTED** (carried round-6 #9) | D4 trade-off accepted in round 5. A dock-first rule in landscape would clear it; optional, owner M2. |
| R8-F3 | **Toasts drawn above the Ambience sheet.** Opening it voids the dock; the stack returns to the old room above the sheet: title, text, "Rain"; at 844×390 @200 also the sheet's Close and Turn on. | My sheet rows: R8 = `b39202f` sample for sample (667 L, 844 D); INT 844 D also covers Close and Turn on; on INT 667 a toast covered Ambience, so the sheet never opened | **FOLLOW-UP** | Toast z-index above modal sheets (`Toast.module.css` `.region` `--z-toast`; `Sheet`). Present on INT and `b39202f`, not worse. Owner M2 (I04 toast placement). Relates to R7-14. |
| R8-F4 | 1440 @200 summary: the update toast's right edge overlaps the "Done" chip's left 8 px (centre clear) | My 1440 summary rows: R8 = `b39202f`; INT's stack sits lower | **FOLLOW-UP** (minor) | Round-7 toast room at desktop; unchanged by round 8. Owner M2. |
| R8-F5 | `statusbar.spec.ts:106` (dark) failed once (Today not yet rendered at 7.5 s; `main` empty in the snapshot); passed when rerun alone | Lane 2 JSON, `error-context.md` | **FOLLOW-UP (test)** | The test reads `nav[aria-label="Your progress"]` after a fixed wait (`a11y-probes.mjs` `open()`); Today's lazy route can arrive later under load. The spec and Today are untouched by round 8. Owner M2 (statusbar spec). |
| R8-F6 | 38 "ResizeObserver loop completed…" errors forwarded to `dev-r8.log` | Timestamps all inside Lane 2's chromium run against :5306; 0 in my and Lane 1's probe pages | **ACCEPTED** (benign browser notice from the suite's resize tests; no user effect) | `StatusBar` / `SegmentedControl` ROs, untouched |
| R8-F7 | Lane 2 flag 1: 667×375 @200 Today with storage full; the banner lies under the sticky start (only its top edge shows, even scrolled into view) | **R7 `b39202f` captured by me with Lane D's cap-d: a1, a2, b1, b2, c1 and c2 pixel-identical (0 %) to R8** | **FOLLOW-UP** (= R7-11 / round-6 #3, unchanged) | ~60–78 px strip above the 200 % docked start in landscape. INT draws no warning at that size. Owner M2 / I04 (`Home.module.css`). |
| R8-F8 | Lane 2 std 02 at 1440: R8's 3D room was drawn without decorations at shot time | Lane 2 light; **my dark run shows the opposite: INT's room lacked them and R8's had them** (opened) | **ACCEPTED (not a build difference)** | Load timing of the scene's decorations; scene code is not in the round-8 diff. |

**Round-7 residuals on R8** (unchanged unless noted):

| Round-7 # | Class on R8 |
|---|---|
| R7-1, R7-2, R7-3 (banner / Mark done) | **ACCEPTED** under Vibei's ruling. LEAD-D1 rerun: banner steady at 1 add / 0 removals, announced once, Save backup never cut (L1, 12 runs). |
| R7-4 toasts over the banner on arrival | **FOLLOW-UP**, unchanged (Today has no dock; pixel-identical to R7) |
| R7-5 reward toasts over the summary note | **FOLLOW-UP** in portrait (unchanged); **resolved in landscape** (docked; my summary rows) |
| R7-6 shade band | FOLLOW-UP, unchanged |
| R7-7 `integrity.spec.ts:1090` timing | **FOLLOW-UP (test), not fixed in round 8** (scoped out by the brief). Passed ×3 in Lane 2's run. |
| R7-8, R7-9, R7-10, R7-11, R7-12, R7-13 | FOLLOW-UP, unchanged (files untouched). R7-11 also covers R8-F7. |
| R7-14 Ambience dialog after Escape at 1440 | **UNKNOWN** (not run at 1440); see R8-F3 for the sheet at phones |
| Round-6 #8 toasts over the countdown and status line | FOLLOW-UP. **Improved where the stack docks** (`b39202f` covers the digits at every count; my focus rows). |
| Round-6 #5, #7, #9 | ACCEPTED, carried |
| Round-6 #3, #10, #11 | FOLLOW-UP, carried |

## Follow-up list (owners), ranked

| Rank | Item | Evidence | Cause / files | Owner |
|---|---|---|---|---|
| **1** | **Third summary chip half-hidden behind the footer at 375×667** (PRESERVE item: K02 / PRESERVE 7, "the final line clears the footer") | Lane 2 std `07-summary` 375×667 light, R8 = INT (0 %): the third chip row ("23 days warm", "Recipes 1/3") starts half under the Tea time footer on arrival. Creative audit phase 2 U2 (`best yet` pill half under the footer at 390×844). | Bottom-anchored summary with a persistent footer; equal-weight pill order. `src/screens/done/Summary.tsx` / `Summary.module.css` (footer), `src/screens/done/summary.ts` (ordering, audit R3) | **M2 (I04)**, with M3 for milestone-first ordering |
| **2** | **Brew length under the docked start, failing tap-target size** | Lane 2 std `01-home` 375×667 (R8 = INT 0 %): only "Change brew length" shows above the dock. Audit U1: 390×844 Brew length buttons at y 657–705 against the docked start at 676–736 (axe `target-size` at rest); at 844×390 the whole control is behind the dock. | `src/screens/home/Composer.tsx` `.ctaDock` and `Home.module.css` (dock and scroll padding) | **M2 (I04)** |
| 3 | R8-F3: toasts above the Ambience sheet (Close / Turn on covered at 844×390 @200) | above | `Toast.module.css` z-order against `Sheet` | M2 |
| 4 | Disclosure 2: fold hides the icon and the reward amount | above | `foldToFit()`, fold CSS | M8 / M2 |
| 5 | Disclosure 5: portrait 375×667 @200 3-toast limit | above | D4 lift with the scrollable panel; no portrait dock | M2 / M8 |
| 6 | R8-F1: transient clip in the docked stack | above | motion `layout` inside a clipped list | M8 / M2 |
| 7 | R8-F5: `statusbar.spec.ts:106` readiness wait | above | wait for `nav[aria-label="Your progress"]` | M2 |
| 8 | Disclosure 4: probes should retry on "Execution context was destroyed" | above | review probes (`accept.mjs`, `closecheck2.mjs`) | reviewers / M8 |
| 9 | R7-7 `integrity.spec.ts:1090` waits for End's toasts | round 7 | test | **M7a** |
| 10 | R7-8 focus on recovery; R7-9 second-episode announcement; R7-5 reward toasts over the summary note (portrait) | round 7 | `SaveWarning.tsx`, `saveWarning.ts`, toast lift | M7a (with M2) |
| 11 | R7-6 shade band; R7-10 Resume rim after Pause at 375×667 @200 | round 7 | `FocusScreen.*` | M7b |
| 12 | Round-6 #3 / R7-11 / R8-F7 (the 200 % landscape strip on Today); round-6 #8 (toasts over the readout, portrait); round-6 #10 (1440 lift lag after End); round-6 #11 (CLS and over-width); R7-4; R8-F4 | rounds 6–8 | `Home.module.css`, toast lift | M2 / I04 |
| 13 | R7-12 `:768` pill read; R7-13 `announce.ts` "saved" wording | round 7 | tests, `announce.ts` | M1 (I03) |
| 14 | R7-13 End sheet "will be saved" wording | round 7 | `EndSheet.tsx` | Focus area |

## Wave 1 regression (Lane 2, plus mine)

**Tests on `9ff0d04`** (raw logs and JSON read by me):

| Suite | Result |
|---|---|
| tsc | exit 0 |
| vitest | 27/27 files, 267/267 tests |
| Playwright chromium | **73/74** |
| The one failure, `statusbar.spec.ts:106` (dark) | Failed once, then passed 1/1 when rerun alone (R8-F5) |
| timer-harness + timer-app + pwa | **29 passed, 2 skipped by design** (`timer.spec.ts:294`, `:438`), 0 failed |

- The 73 passes include every `integrity` test (`:768` and `:1090` at all three sizes), every `toast-room` test (including the new `:427` rows), `break-reach` and `a11y`.

**Captures:**
- **cap-d:** 10 configurations complete on both sides. R8 is pixel-identical to R7 in every UI state of the nine configurations Lane D also captured, except the dock (e1/e2 at 844×390 @200). I added 667×375 @200 a/b/c against R7: 0 %.
- **Standard set, light:** complete at 390×844, 375×667 and 1440. Every pair over 0.5 % is explained (Lane 2 §5.2).
- **Standard set, dark:** Lane 2 ran it only partially. My run, using Lane 2's `std-L2.sh` (sha `6b35ab94`) unedited, is below.

- **Dark standard set, run by me** (19:18–19:34 UTC; `std-L2.sh` and `std-freeze.mjs` unedited; R8 :5306 and INT :5303 side by side; `--n 2`):
  - **Complete: 21/21 states on both sides at 390×844@2, 375×667@2 and 1440×900@1, exit 0, 0 page errors.**
  - I diffed R8 against INT and against the round-7 lead's R7 dark set (`LEAD/runs/stddark/diff-R8-{INT,R7}-*.jsonl`). Every pair over 0.5 % is explained, and I opened the side-by-side images where marked. None is a round-8 build difference.

| State | Difference | Cause |
|---|---|---|
| 10-break-over | 18.3 / 23.3 / 4.8 % against INT | The round-7 D4 toast room. R8 equals R7 at 0 % on the phones. At 1440, 2.97 % against R7 is "Recipe done" still on screen in R8's shot (crop opened; round-6 #23 timing). |
| 02-focus-start at 1440 | 29.8 % | **INT's** 3D room is the one without decorations this time (opened). Lane 2's light-run flag (R8-F8) therefore flips sides between runs: load timing. |
| 14 and 16 at 1440 | 58 % / 52.5 % | INT shot the whistle and a mid-route Today (opened). |
| 03 at 375 | 11.8 % | The zen fade on the R8 side, with the clock one second apart (opened). |
| 19 at 390 | 1.39 % against both INT and R7 | Text anti-aliasing across the page; the crop opened is identical to the eye. Settings is untouched. |
| 11 / 11b / 17 / 18 | — | Scene phase or page-height flips. |

  - 01, 01b, 07, 08, 12 and 15 are 0 % at every size.

**Judgement:**
- On a merge whose `kettle/src` tree equals `42e106d`, Lane 2's regression **can stand as the Wave 1 regression**, together with my dark standard set above. That makes the standard set complete in light and dark at 390×844, 375×667 and 1440, with cap-d for the landscape session states.
- Two items must be carried as known: the `statusbar.spec.ts:106` flake (R8-F5) and the round-7 test flakes R7-7 and R7-12.
- First check that the merged tree is `42e106d` (`git rev-parse HEAD:kettle/src`).

## BLOCKED / UNKNOWN (never PASS)

- **BLOCKED:** real phones and touch hardware; real wheel notch sizes; real OS text-size settings; real assistive technology (announcements were counted as live-region mutations); WebKit and Firefox; GPU timing (SwiftShader under shared load).
- **UNKNOWN:**
  - R7-14 (Ambience dialog after Escape at 1440; not run);
  - tablet landscape (1024×768), where the dock media query also applies (not measured);
  - reduced motion with a folded stack (not measured).
- **Coverage notes:**
  - Lane 1 ran the 150 / 100 % rows with one input each and no control (no-regression rows).
  - Mute's control was not established (0 covered on `49ea1de` as well).
  - The Close / Ambience sweep at 844×390 was not run by Lane 1. My sheet rows and M8's 844 sweep (0 / 6,506) cover it without a control at that size.
