# I03 × I04 combined integration fix · CHECKER r6 (LEAD)

**Verdict: REJECT**

| | |
|---|---|
| **Reviewed revision (binding)** | Trial merge **`e866118`** (tree `4264b40`; `kettle/src` `05bb3f827117545cbbc9f212e0a5f7332490092c`) = integration `bc48a10` + **`pe/w1-fix-m2@51521cf`** (last code commit `091249a`; `51521cf:kettle/src` = `05bb3f8`, identical). The branch contains M1's approved `pe/w1-fix@3f00b57` via merge `ca23385`. |
| **BEFORE** | INT `0d58c5e` (src `1fc4a1b`) at :5303 / :5323. R5 trial `20671eb` (src `b38ad5e`) at :5302 / :5322. |
| **Servers** | R6 :5301 (dev) / :5321 (preview), owned by the orchestrator and never stopped. `/tmp/rv6-servers/verify.sh` reported 5301 and 5303 VERIFIED at 21:33 UTC. |
| **Checker** | LEAD Checker, independent: I built none of this branch and was not an earlier maker or Checker. I edited no application code, tests or maker files and committed nothing. Probes live in the git-ignored `/home/user/wt/rv6-r6/kettle/.tmp/LEAD/`; durable copies and notes are in `contracts/I04/integration-fix/round6-review/LEAD/`. |
| **Model** | Claude Opus 5.5 (`claude-opus-5-5`). Reasoning effort: not inspectable. |
| **Environment** | 4 CPUs shared with lanes L1–L4. Chromium headless with SwiftShader, emulated viewports. Every browser launch went through `tools/slots.py --lane LEAD`, with a fresh context and disposable profile each run. Run 18:25–23:10 UTC, 2026-10-10. |

## Short version

Round 6 fixes R5-D1 as defined, and the counted probes back that up:

- **R5-D1.** On R5, race-x reproduced 9/10, 10/10 and 8/10 (375 light, 375 dark, 844×390). R6 gave 0/10 in each, with the list really scrolled. The natural-x R5-alone control (4/10 at 375 light, 2/10 at 844) is likewise met by 0/10 on R6. In every R6 frame the warning's box sits 2 px inside its room.
- **M1's approved behaviour.** `flow.ts` and `integrity.spec.ts` are byte-identical to `3f00b57`, and the observed behaviour is unchanged.
- **Preserve list.** It holds in every state I opened.
- **Most residuals.** These are the same as INT or better on R6.

**One new defect blocks: LEAD-D1.**

- **What happens.** When an older toast with an action is on screen, the storage-full warning comes second in a short-room stack. Its box is laid out past the room, over the docked start. M1's hold rule then removes it and re-shows it about twice a second for as long as the older action toast lasts.
- **How long.** About 5 s for "Crossed off · Undo". Indefinitely for the update toast ("A fresh brew of Kettle is ready · Update", `duration: Infinity`).
- **Effects.** The warning blinks, "Save backup" stays clipped below the room, and the live region re-announces the warning up to 28 times.
- **Compared with INT and R5.** In the same state, INT and R5 show the warning steadily. So the defect was introduced by round 6.
- **Why it blocks.** It contradicts R5-D1's required correction ("must stay inside its room in **every list state**") and the packet's claim in (b) ("with any set of toasts"). Under the residual rule it **BLOCKS**.

## Defect (REJECT)

### LEAD-D1: an older action toast makes the warning come second; its box leaves the room and M1's rule removes and re-shows it in a loop

- **Cause** (verified by me, including a counterfactual):
  - `src/ui/Toast.module.css` (r6) has `.list:has(.action) > .toast:has(.action) { order: -1; transform: none !important; max-height: calc(100cqh - 2px) }`.
  - That rule gives **every** toast with an action the same `order: -1`, and DOM order breaks the tie.
  - When an action toast is older than the warning, it leads. At list offset 0 the warning's box then starts below it and runs past the room's bottom, over the docked controls.
  - M1's `protectedUnderToasts()` checks the warning's own box (zone 2) and withdraws it. M1 re-shows it as the newest toast, which is second again, so the cycle repeats.
  - Action toasts that exist in the app:
    - Composer "Crossed off. Nice work." (Undo, 5 s, Today);
    - PwaUpdatePrompt "A fresh brew of Kettle is ready." (Update, `duration: Infinity`, idle screens);
    - History "Brew deleted" (Undo);
    - DataSection "Backup restored" (Undo).
- **State.**
  - Today with a carried intention ("Carried from your last brew · Mark done") and localStorage really full.
  - The person taps "Mark done". The Composer raises "Crossed off. Nice work." with Undo, and the failing save raises the storage-full warning 250 ms later.
  - The same happens with any older action toast up, such as an update waiting.
- **Where it loops** (adds/removals of the warning in about 5 s):
  - 375×667 @200 %: light 11/10 in two runs, dark 12/11 and 11/10.
  - 844×390 @200 % light: 11/10 and 9/8.
  - 667×375 @150 % dark: 11/10 and 9/8.
  - With an Infinity action toast older than the warning: 28/27 at 375×667 @200 % light and 29/28 at 667×375 @150 % dark, still looping when the recording ends at 11 s.
  - In the looping runs the box sits 58–305 px below the room. Opacity cycles 0 → ~1 → 0 about every 0.5 s, and "Save backup" stays clipped below the room.
- **Where it does not loop:**
  - 375×667 @150 % (the stack fits the room).
  - 390×844, 375×667 and 1440×900 at 100 % (normal rooms). There the only event is the separate one-off entry re-mount: 2/1 in one run and 1/0 in another per size.
- **On INT and R5,** in the same state, sizes and timing:
  - INT is 1/0 at every size: steady, with the warning at full opacity in 453–503 of the judged frames. At 375×667 @150 % it is fully readable, with "Save backup" usable above the start. At 200 % INT shows the old D3, with the warning rising past the top of the screen.
  - R5 has no loop (1/0, or 2/1 from the known entry flicker).
- **Steps to reproduce:**
  1. Open `http://127.0.0.1:5301/?debug#/` in a fresh profile at 375×667, DPR 2, touch, light, with `html{font-size:200%}`.
  2. Seed `newbie` and reload.
  3. Start a brew with the intention "Chapter 3 notes", fast-forward 3 min, and End it.
  4. On Today, wait for the End toasts to time out. The composer shows "Mark done".
  5. Fill localStorage until `QuotaExceededError`.
  6. Tap "Mark done" for real.
  7. Watch the warning's `li#toast-kettle:save-failed` being added and removed about every 0.5 s until "Crossed off" times out.
  8. Probe: `LEAD/lead-d1/probes/actionpair.mjs <base> <rev> <out> "375x667@200:light"`.
- **Counterfactual.** I injected one scratch rule into the page that makes only the warning lead (`li#toast-kettle:save-failed { order: -2 }`; no app code changed).

| R6, same session | Warning adds/removals | Frames with the warning's box over the dock |
|---|---|---|
| With the rule: 5 runs (375 @200 light ×2 and dark, 844 @200, 667 @150) | 1/0 in every run | 0 |
| Without it: 3 configurations | 11/10 in every run | many |

  In the runs without the rule, all 30 removals came right after a frame where the warning was second and its box overlapped the docked controls (box bottom against dock top: 476 vs 334, 283 vs 182, 224 vs 176).
- **Evidence:** `round6-review/LEAD/lead-d1/`.
  - `README.md`: mechanism, steps, tables and file index.
  - `probes/actionpair.mjs`, `pwapair.mjs`, `actionpair-cf.mjs` and the `-v` video variants.
  - `runs/*`: jsonl for every frame and event, plus screenshots.
  - A webm clip for every configuration on R6 and INT.
  - `frames/ap-r6/f064`, `f066`, `f073` show the blink; `f090` shows it settled.
  - `logs/`.
  - `runs/actionpair/` is marked INVALID: its tap hit the dock.
- **Required correction (M2; `Toast.module.css` or `Toast.tsx`):**
  - Make the storage-full warning (or exactly one action toast, chosen deterministically) lead the short-room stack, so that its box stays inside the room whatever other action toasts are present, in either order.
  - Keep everything r6 achieved: R5-D1 fixed by construction, every line readable, "Save backup" visible and working, older toasts revealable, 100 % geometry unchanged, no squeeze.
  - `flow.ts` (M1) must stay frozen. Changing M1's hold rule instead needs M1 and an independent re-review.
- **Evidence needed for re-review:**
  1. Real input and real timers on a disposable profile with storage really full: the "Mark done" path above, plus an older Infinity action toast, plus a newer action toast raised after the warning. Cover 375×667, 390×844 and 844×390 at 150 % and 200 %, 667×375 at 150 % and 200 %, and 568×320 at 100 %, light and dark. Each run must show exactly one add of the warning with no removal before its own end, a box never below its room or over the dock, "Save backup" tappable, and ≥ 2 s recorded after the last input. Include R6-vs-INT runs of the same state.
  2. A new `toast-room.spec.ts` case with two action toasts (no held timers) that **fails on `e866118`**.
  3. Re-run of the R5-D1 retests: race-x and natural-x, with the R5 control reproduced in the same session, and the R4-D1 readscroll set (wheel 20/53/100 px and touch). Also D4, 100 % toast geometry, the M1 `capture-storage-full.mjs` comparison, and 01/01b/10 captures.
  4. Then the Wave 1 regression on the new trial merge, as user adjustment (a) requires: tsc, vitest, the chromium project, timer-harness / timer-app / pwa, and a same-day INT recapture of 375 `01-home`, `13-first-brew`, RM `04` and `10-break-over`.
  5. Re-check of the UNKNOWN below (L2's 667×375 coarse-notch clip showing an empty room).

## Gates

| Gate | Result |
|---|---|
| **R5-D1** | **Met on the counted probes.** race-x (direction-aware, one synthetic hold/release per run): R5 9/10, 10/10, 8/10 against R6 0/10 in each, with the list scrolled 10/10 per configuration. natural-x: R5-alone 4/10 (375 light) and 2/10 (844) against R6-alone 0/10; 375 dark does not count (R5 1/10). **Partial:** natural.mjs at 844, natural-x under pair load, repro6 / repro6-sel (incl. M2's 60-run zeros) and the extra gestures have no established R5 control, so their R6 zeros do not count. L1's solo rerun did not happen (user adjustment c). Also unedited race.mjs / natural.mjs never scroll the R6 list (vacuous). |
| **Regression** | **Not run on R6** (user adjustment a). L4 phase 2 is partial: tsc exit 0 and vitest 265/265 only. The chromium, timer and pwa suites and the recaptures were not run. None of this counts as a pass. |
| **Visual (REFERENCE → BEFORE → AFTER)** | **No preserve-list regression** in the states opened (section "Visual gate"). LEAD-D1 is a visual defect in a state the capture sets do not contain; it is evidenced by my clips. |

## What I ran (all through the slot gate, with fresh contexts)

| Probe | Revision / URL | Configurations | Output |
|---|---|---|---|
| `actionpair.mjs`: real "Mark done" tap with storage full | R6 :5301, INT :5303, R5 :5302 | R6 and INT: 375 @200 light and dark, 844 @200, 667 @150, 375 @150, 390 / 375 / 1440 @100. R5: 375 @200, 844 @200, 667 @150, 375 @100 | `LEAD/lead-d1/runs/{actionpair2,ap-R6,ap-INT,ap-R5}` |
| `actionpair-v.mjs` (same probe, video for every configuration) | R6, INT | The same 7 configurations | `runs/apv-*` (14 clips) |
| `pwapair.mjs` / `pwapair-v.mjs`: plus an Infinity action toast, labelled synthetic setup | R6, INT | 375 @200 light, 667 @150 dark | `runs/pp2-*`, `runs/pv-*` (clips) |
| `actionpair-cf.mjs`: counterfactual, with and without the injected rule | R6 | 5 + 3 runs | `runs/cf-R6` |
| `trace/l1_judge.py`: independent re-judge of L1's raw jsonl | n/a | race, race-x, natural, natural-x, dnx | `LEAD/trace/L1-TRACE.md` |
| `trace/clipscan.py`: per-frame crop scan of webm clips, because this ffmpeg build has neither an fps filter nor raw output | n/a | L1, L2, L3 and LEAD clips | `LEAD/trace/scan-*.txt` |
| `audit/repro_audit.py`: re-analysis of M2's `repro6-final.jsonl` | n/a | 60 runs | `LEAD/NOTES.md` |

## What I opened (Read tool, full size)

- **REFERENCE:**
  - K01 `VISUAL_BENCHMARK_LIBRARY/assets/current/01-home.png`.
  - K02 `…/07-summary.png`.
  - K04 `…/whistle-to-summary-phone-dark-reduced-motion-frames.jpg`. The mp4 `recordings/whistle-to-summary-phone-dark-reduced-motion.mp4` could not be decoded here: the only ffmpeg reads WebM, and there is no system ffmpeg.
- **BEFORE (INT) and AFTER (R6), matched state by state:**

| State | Viewport, text, theme | Sources |
|---|---|---|
| Home | 390×844 light | wave1 vs L4 |
| Home | 375×667 light | wave1 vs L4 |
| Home | 844×390 light | L4 INT vs L4 R6 |
| Home | 1440×900 light | wave1 vs L4 |
| Summary | 390×844 dark | wave1 vs L4 |
| Summary end | 375×667 light | wave1 vs L4 |
| Break's over | 390×844 light | wave1 vs L4 |
| Break | 375×667 dark | L4 (R6 only) |
| Home with the warning | 375×667 light | M2 |
| Home with the warning | 844×390 dark @100 % | M2 |
| Home with the warning | 844×390 light @200 % | L4 |
| Home with the warning | 1440×900 dark | L4 |
| Home with the warning | 390×844 light @200 % | L4, R6 only |
| Focus with the warning and toasts | 375×667 light | M2 |
| Focus with the warning and toasts | 390×844 light | L4 |
| Break's over with toasts | 375×667 dark | L4 |
| Summary after a level-up | 390×844 dark | L4 |

- **Clip frames:**
  - M2: 375×667 and 844×390 light.
  - L1: R5 375 light event frames (fade, absent) and R6 375 light.
  - L2: 667×375 coarse and 844×390.
  - Mine: the LEAD-D1 R6 frames and the counterfactual screenshots.
- **Packets and receipts:**
  - M2's `INTEGRATION-FIX-READY-FOR-REVIEW.md`: r6 (a)–(f), Still open, BLOCKED/UNKNOWN, Not produced.
  - `CHECKER-integration-fix-r5.md`, and `-r4`, `-r1` and I03 `CHECKER-integration-fix-r1.md` (skimmed).
  - `PROTOCOL.md`, master prompt §7–8, evidence matrix (I03, I04, I14), `PRESERVE_LIST.md`.
  - All lane receipts.

## Code review findings

- **Byte identity.** `flow.ts` (blob `7a5ed2e`) and `integrity.spec.ts` (blob `6a70e2b`) are identical at `3f00b57`, `51521cf` and `e866118`. `git diff --stat 3f00b57 e866118` on those two files prints nothing.
- **`Toast.tsx` against `3f00b57`.** The only change is the Toaster call site, in hunk `@@ -79,13 +79,18 @@`: the new `drawn` state and `onExitComplete`. `toastLiftBottom()` and `useToastAbove()` are unchanged.
  - The render-phase `setDrawn(true)` is the documented React pattern for adjusting state during render.
  - If `onExitComplete` never fired, the lift poll would only keep running. That is harmless.
- **R5 → R6.** Only `Toast.module.css`, `Toast.tsx` and `toast-room.spec.ts` changed. `StatusBar.tsx`, `Home.module.css`, `FocusScreen.*`, `statusbar.spec.ts`, `a11y.spec.ts` and `a11y-probes.mjs` have the same blobs as R5.
- **"Removed by construction."** It holds for **one** action toast, in every frame:
  - The warning comes first (`order: -1`).
  - The block-axis `scrollTop` is clamped to 0 or more.
  - `.live` is bottom-aligned in the region, so the list ends 2 px short of it (`padding-bottom: 2px`).
  - `max-height: calc(100cqh - 2px)`, where `cqh` resolves to `.region`, the only size container (`.live` is inline-size).
  - `transform: none !important` beats framer's inline and WAAPI transforms during entry, exit and layout projection.
  - Older toasts entering or leaving, with anchoring on or off, cannot move the warning below its resting place.
  - It holds at 150 %, in landscape and with 1–3 toasts.
  - At 1440 and 100 % on phones, short-room mode is off and the change is only the kept lift.
- **The construction fails when another action toast is present.** That is LEAD-D1.
- **The 2 px slack is exactly consumed by the 10 px route rise.** M2's own `repro6` frames show the dock gap reaching 2 px. It holds, but with no margin.
- **Tests.** `toast-room.spec.ts` contains real behaviour tests (R5-D1 with a natural expiry, last-exit). They fail on R5 and `d074863`, and L2 ran 10/10 passing on R6. There is no case with two action toasts.
- **Not a change:** the FocusScreen diff (r4, D4) touches only the break-over group. The zen fade is untouched.

## Evidence audit (M2)

- **`repro6.mjs` source.**
  - Real timers, with no synthetic `pointerenter` or `pointerleave`.
  - Input only through `mouse.wheel` and CDP touch, with no programmatic list scrolling.
  - The debug API is used for setup only.
  - Checker r5's probes in `w1fix-m2/.tmp/w1fix/chk-r5/` match the originals byte for byte (sha256), and so do the hashes in `/tmp/rv6-servers/probe-sha256.txt`.
- **`repro6-final.jsonl`, re-analysed by me: the 60 runs agree with the log.**
  - One warning add per run.
  - Two own-end removals (844 touch #3 and #5).
  - max (warning bottom − room bottom) = −2 px.
  - 0 frames with the box over the dock, a toast drawn over a control, or a control hit-testing as a toast.
- **Caveats:**
  - Frame gaps reach 251 ms.
  - Under L1's control rule, the 60 R6 zeros do not count against R5-D1 proper (repro6 never reproduced the reading-phase defect on R5).
- **Clips.** I extracted frames from the 375×667 and 844×390 clips; they match the logs.
- **Packet (d).** M2's keyboard mechanism is correct, verified below. Its "513 = the page's end" is wrong: the maximum scroll is 754 and the hold is a scroll window.

## Visual gate

**Result: no regression against the preserve list or against K01/K02/K04 in any opened state.**

- Cream light and deep-purple dark identity, Fredoka/Nunito, approved Chai (reading, cheering, sipping), and orange focus with blue rest (the 09 break shows K04's tea frame) are all unchanged.
- Docked "Put the kettle on · 25 min" with "Change brew length".
- The five categories wrap on phones and sit in one row at 1440.
- 15/25/50/Custom sit under the dock on phones and are visible at 1440.
- The compact summary keeps its sticky Tea time · 5 min / Skip break, and the final expanded line clears the footer (08 at 375).
- The break-over composition (stage, title, Mark it done, Put the kettle on, That's all for now) is unchanged.
- 375 `01-home` shows the intended I04 r1 change: the status bar fits on one row, closer to K01.
- With the warning, R6 is equal or better:
  - At 844 @200 % the opening is readable and "Save backup" visible, where INT has both off-screen.
  - On the phone focus screen the warning is held off the countdown (M1).
- **Pre-existing on INT, not worse** (classified below):
  - Ordinary toasts cover the focus countdown.
  - At Break's over, toasts cover the title while every control stays clear (the D4 trade-off).
- **LEAD-D1** is the visual defect: a blinking, translucent, clipped warning (`lead-d1/frames/ap-r6/f064.png`, `f073.png`).

## Lane receipts and my trace-check

| Lane | Receipt | Trace-check (raw logs, clips) | Counts? |
|---|---|---|---|
| **L1** (R5-D1 race) | `round6-review/L1/RECEIPT.md` | Probe hashes match, and the race-x and natural-x diffs are as declared. My re-judge of the raw jsonl agrees: race R5 10/10/7 vs R6 0 (vacuous); race-x 9/10/8 vs 0 with the list scrolled; natural-x alone R5 4 and 2 vs R6 0; R6 max −2 px. Clips: R5 375L race-x shows the warning gone at 18.32–18.64 s (frames opened). The R6 375L, 375D and 844L natural-x clips show the warning present throughout (crop scan). → `LEAD/trace/L1-TRACE.md` | Yes for race-x and natural-x (alone control). Partial elsewhere. |
| **L2** (interaction) | `L2/RECEIPT.md` | I aggregated the raw jsonl myself and it matches: 48-run matrix with 0 read-hides, 0 over-dock, 0 below-room, all lines read and 48/48 downloads; 21 entry re-mounts; nat-R6 0 hides in 52; INT fails widely. One clip per configuration scanned (375, 390, 844, 667); frames opened at 844 and 667. One anomaly: in `video/read-R6-coarse/R6-667x375-light-t200-stack-wheel100.webm` the 60 px room looks **empty for about 4.9 s** while the DOM record shows the warning at 2–60 px, opacity 1, with a line and "Save backup" hit-testing. Most likely unrastered scrolled content under SwiftShader load; recorded as UNKNOWN. | Yes. |
| **L3** (behaviour, a11y) | `L3/RECEIPT.md` | 3a verified myself from raw values (below). 3b (`blink2`), 3e (`back2`) and check 1 (`m1-R6-phone.log`) raw files sampled and matching. 3a clips scanned on R6 and INT: absences of about 3.9 s, matching the logs. Checks 2, 3c, 3d, 3f and 3g taken from the receipt. → `LEAD/trace/L3-TRACE.md` | Yes. |
| **L4** captures (phase 1) | `L4/CAPTURES-RECEIPT.md` | 43 metas carry revisions `e866118` / `0d58c5e` with 0 page errors. Images opened as listed above. | Yes. |
| **L4** regression (phase 2) | `L4/REGRESSION-RECEIPT.md` | Partial by user order (tsc 0, vitest 265/265). Unresolved pairs judged below. | Partial; not a pass. |

## Conclusions I verified myself, and those I took from lanes

- **Verified myself from raw evidence:**
  - LEAD-D1: occurrence on R6, INT and R5, and its cause by counterfactual.
  - The construction argument and byte identity, by code review.
  - M2's repro6 data.
  - L3 3a, the keyboard cause: raw `kbd-R6-…-Tab.log`, its 50 ms series, and the `R6`/`INT-sweep-t100.log` wheel sweeps. At scrollY 500–550 the dock's bottom (377/352/327) is below the 400.2 line, so the lift is null and the region falls back to its stylesheet bottom at 481; "Change brew length" (343–367 → 293–317) then lies in [311, 481] and the warning is removed. It is present at 475 (lift active) and at 575 (link above the zone). INT's window is 325–550.
  - L1's race / race-x / natural-x counts.
  - L2's reading-matrix counts.
  - L3 3b and 3e samples.
  - 3e's cause: `recheckSaveWarning()` runs only on `timer:start`, `timer:complete` and `timer:sync`.
  - The FocusScreen diff does not touch the zen fade.
- **Taken from lanes, not re-derived:**
  - L2: checks 3–5 (1440, 338 control windows, earlier defects D1/R2-D1/D2/R4-D2/D4), issues 1, 2 and 6, and the spec results.
  - L3: checks 1 (except the sample), 2, 3c, 3d, 3f and 3g.
  - L4: tsc and vitest.

## Residual classification

Rule: **BLOCKS** if introduced or worsened by round 6 (R6 worse than INT); **FOLLOW-UP** if present on INT and not worse on R6; **ACCEPTED** if not a defect.

| # | Item (source) | R6 vs INT | Class | Cause, files, suggested owner / reason |
|---|---|---|---|---|
| D1 | **LEAD-D1**: warning removed and re-shown in a loop behind an older action toast (LEAD) | INT steady (1/0); R6 9–28 removals | **BLOCKS** | See Defect. `Toast.module.css` `order: -1` tie. Owner M2. |
| 1 | **Packet (d) / Still open 1**: forward Tab never reaches "Save backup" at 375×667 / 100 %; Shift+Tab does in 7 (M2, L3 3a) | Same on INT (not reached in 45); R6's hold window is narrower (500–550 vs 325–550); at 200 % R6 15/15 vs INT 6/15 | **FOLLOW-UP** | `flow.ts` `protectedUnderToasts()` zone and `toastLiftBottom()`'s 60 % rule (`Toast.tsx`): when Today's dock scrolls into flow the lift is null and the zone overlaps "Change brew length". Owner M1 (I03 warning) with I04. Verified by me. |
| 2 | Still open 2 / L3 3b / L1 page-scroll chain: page scroll moves the dock and the warning is taken away for 61–92 ms (Tab at 200 %, fling, arrow keys) | INT worse (3b: 4/6 never re-shown; 3a window wider); R5 has the same | **FOLLOW-UP** | 250 ms lift poll (`useToastAbove`) and the `flow.ts` watch lag a moving dock. Owner M1/M2. |
| 3 | Still open 3 / L2 issue 4: coarse 53/100 px notches and touch slop skip lines in the 58 px room (667×375 @200 %) | INT 1/11 lines and no Save backup; R6 11/11 by 20 px steps, 5/11 (53), 3/11 (100) | **FOLLOW-UP** | Room height at 200 % in landscape. Owner M2 (I04). |
| 4 | Still open 4: short rooms at 100 % lead with the warning (reorder) | Different order; both readable; Save backup visible (844 dark pair opened) | **ACCEPTED** | Intended design. Its tie-break flaw is LEAD-D1. |
| 5 | Still open 5: older toasts scrolled out below the room have layout boxes over the dock | INT lays the overflow out above the screen | **ACCEPTED** | Not painted and not hit-testable (L2 0 controls covered after settling, 218 taps). M1 measures only the warning. |
| 6 | Still open 6: in short rooms the warning fades without sliding | n/a | **ACCEPTED** | Information kept; motion reduced. |
| 7 | Still open 7: visual order differs from DOM order | n/a | **ACCEPTED** for sighted users; real AT **BLOCKED** | Only action buttons are focusable; announcements are in addition order. |
| 8 | Still open 8 / L2 issue 1 / L3 3c: ordinary toasts (2–3, or the next-brew recipe toast) cover the countdown digits or status line on session and break screens (phones; 844 @200 %) | Same on INT (INT adds the warning on top) | **FOLLOW-UP** | Toast lift above `data-toast-above` controls lands on the readout (Finding 5 / I10; PRESERVE 4 tension). Owner M4/M2 (I10). |
| 9 | Still open 9 / L4 obs. 6: Break's over toasts sit above "Mark it done" and cover the title and sentence | INT covers "Mark it done" | **ACCEPTED** | D4 trade-off accepted in r5; every control clear. |
| 10 | Still open 10 / L2 issue 6: 1440 lift lag after End / arrival overlap 0.15–0.54 s | Same at arrival; R6 better at departure | **FOLLOW-UP** | `useToastAbove` 250 ms poll vs the leaving session layer. Owner M1/M2. |
| 11 | Still open 11: 150 % transient over-width; 200 % slow-font CLS 0.384; clipped shadow / L3 3f | All-entries CLS R6 ≤ INT in 8/8; Chrome-counted differs by the `hadRecentInput` masking analysed in r5 | **FOLLOW-UP** (late Today reflow, I14) / **ACCEPTED** (transients recover; shadow is polish) | Owner M2 / I14. |
| 12 | L2 issue 2: at 200 % some controls sit below the bottom edge with no document scroll (Resume break; That's all for now; Mark it done / Put the kettle on at 844) | Identical on INT | **FOLLOW-UP** | Break and break-over layout at large text in `FocusScreen.*`. Fails I04's observable success ("all controls reachable at 200 %"), but pre-existing. Owner M2 (I04), high priority for the next round. |
| 13 | L2 issue 3: 667×375 @200 % stack — older toasts slide over the warning's first line for 99–830 ms after it appears | INT never shows the first line | **FOLLOW-UP** | Older toasts' layout animation passes over the warning. Owner M2. |
| 14 | L2 issue 5 / LEAD: a lone warning is mounted, removed after 167–237 ms at opacity ≤ 0.12 and re-mounted; R6 at 100 % has one entry re-mount in some runs | In L2's state INT never shows the lone warning (worse). In my matched Crossed-off state INT is 1/0 against R6's intermittent 2/1 | **FOLLOW-UP** | The first frame is laid out before the lift (or during the entry slide), and M1's own-box check removes it. Invisible, but one extra live-region addition. Part of M1's approved behaviour (r4/r5 note, owner M1/F11), also on R5. Not user-visibly worse. |
| 15 | L2 issue 7: a11y "short screen" failed 1 of 3 on R6 with Settings entries | INT failed on D4 entries only | **UNKNOWN** | Not reproduced 2/2; R6's diff does not touch Settings. Re-run in the regression of the approved revision. |
| 16 | L3 2 (C6): focus drops to `body` when the warning is withdrawn under focus | Same on INT | **FOLLOW-UP** | `flow.ts` withdraw with no focus restore. Owner M1/I04. |
| 17 | L3 2: leaving "Save backup" by Shift+Tab at 100 % — R6 withdraws for 349 ms and re-shows | INT withdraws and never re-shows | **ACCEPTED** | Not worse; the warning is kept. |
| 18 | L3 3d: warning over the leaving Today / countdown at brew start (375 @200: 163–699 ms, countdown 2/10; 1440 start 1/5) | INT 1.8–2.2 s, and 5–7 s at 1440 Resume | **FOLLOW-UP** | Hold decision at route change (`flow.ts` SETTLE / recheck). Owner M1. |
| 19 | L3 3e: after "Back to your brew" the warning covers Add 5/Pause/End for 134–283 ms | INT about 2 s including the countdown, and blocks the tap at 200 % | **FOLLOW-UP** | `recheckSaveWarning()` not called on navigation (verified). Owner M1. |
| 20 | L3 3g: "Change brew length" is a `<button>` styled as a link; 146×24 at 100 % | Same | **ACCEPTED** | Button semantics are right for an in-page action; contrast 6.04 / 10.07; meets 2.5.8 (24 px). The 44 px goal is optional polish. |
| 21 | L4 phase 2 item 3: 375 `01-home` status-bar row | n/a | **ACCEPTED** | Intended I04 r1 fix (one tight row; Checker r5 D2/D1). |
| 22 | L4 phase 2 item 4: session chrome hidden at `13-first-brew` and RM `04` | n/a | **UNKNOWN** (not attributable) | Zen fade timing; the R6 diff does not touch it. Same-load INT/R6 recapture required in the regression. |
| 23 | L4 phase 2 item 5 / obs. 1: "Recipe done" toast at `10-break-over` | Placement differs (D4) | **ACCEPTED** | Timing-dependent presence; placement is the accepted D4 behaviour. |
| 24 | L2 667×375 coarse clip with an empty-looking room for about 4.9 s while the DOM shows the warning hit-testable | n/a | **UNKNOWN** | Likely raster starvation under SwiftShader; re-check on re-review (GPU or low load). |

## BLOCKED / UNKNOWN (never PASS)

- **BLOCKED:**
  - real phones and touch hardware, real mouse-wheel notch sizes;
  - real OS text-size settings (Android font scale, iOS Dynamic Type); large text here was `html{font-size}`;
  - real window managers (split screen, foldables, Stage Manager, Chromebook);
  - real assistive technology. LEAD-D1 re-adds the warning to the polite live region up to 28 times; the effect on a real screen reader is not measured;
  - real-device audio, lock screen and real-device performance.
- **UNKNOWN:**
  - iOS Safari / WebKit and Firefox handling of `:has()` with `order`, `cqh`, `align-items: safe center`, the sticky action inside a scrolling toast, AnimatePresence `onExitComplete` timing, and scroll clamping;
  - GPU-rendered timing (all timings here are SwiftShader under shared load);
  - the K04 mp4 itself (frames sheet used instead);
  - L2 issue 7 and the L4 13 / RM 04 pairs;
  - the empty-room clip above.
- **Not run on R6:** the Wave 1 regression (chromium, timer-harness, timer-app, pwa) by user adjustment (a). L1's solo rerun by adjustment (c).

## Files

- `contracts/I04/integration-fix/round6-review/LEAD/`:
  - `NOTES.md`, the working notes;
  - `lead-d1/`, the LEAD-D1 evidence, 60 MB;
  - `trace/`, with `L1-TRACE.md`, `L3-TRACE.md`, `l1_judge.py`, `clipscan.py`, scans and frames.
- Probe sources: `/home/user/wt/rv6-r6/kettle/.tmp/LEAD/`, git-ignored and copied into `lead-d1/probes/`.
- Scratch: `/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/rv6/LEAD/`.
