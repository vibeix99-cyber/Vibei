# Lane C receipt, round-7 review

- Lane C. Checks and receipt only. **No verdict.** I implemented nothing in round 7 and edited no app code, tests or
  maker files. Nothing committed or pushed. Orchestrator servers never stopped or restarted.
- Model: Claude Opus 5.5 (`claude-opus-5-5`). Effort: not inspectable.
- Wall clock: start **2026-10-11T03:23:56Z**; end: see "Wall clock" at the bottom. Budget 90 min, extended by the
  orchestrator at 03:58Z by 20 min (to about 05:15Z) for the slot wait.
- Under review: **R7** = trial merge `b39202f` (worktree `/home/user/wt/rv7-r7`, `kettle/src` `6db18ad`), dev server +
  debug API http://127.0.0.1:5301; production preview :5321 (item 11 only). Control / BEFORE: **INT** `0d58c5e`
  (`kettle/src` `1fc4a1b`), http://127.0.0.1:5303; preview :5323 (item 11 only). At 03:26Z I checked that :5301 serves
  the R7 blobs and :5303 the INT blobs of `FocusScreen.module.css`, `Toast.tsx`, `flow.ts` (`?raw` text, sha256 equal
  to `git show <rev>:kettle/<path>`).
- Folder `round7-review/C/`: `check1-reach/`, `check2-residuals/`, `check3-pixels/`, `probes/` (every probe I ran +
  `SHA256SUMS.txt` + `GREP-no-scroll-calls.txt`), `logs/slots-status.log`. Full-size screenshots are stored as JPEG q88
  at their original pixel size to fit the folder; **every pixel count below was computed on the original PNGs**, kept in
  `/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/r7/C/` (`reach/`, `pix/`, `pix/diff/`,
  `resid*/`). Clips: `check2-residuals/clips/*.webm`.

## Method (all checks)

- Playwright 1.56.1 Chromium headless shell + SwiftShader. Phones `isMobile` + `hasTouch`, DPR 2; 1440×900 DPR 1.
  200 % text = `html{font-size:200%!important}` injected at DOMContentLoaded (or at once when `<head>` exists).
- Every browser through `tools/slots.py run --lane C --n 1`; one Chromium per probe process; **every run is a fresh
  browser context = a new disposable in-memory profile**. URL, port and revision are in every jsonl row.
- **Real input only:** `page.mouse.wheel`, CDP `Input.dispatchTouchEvent` drags, `page.keyboard` (Tab, Shift+Tab,
  arrows), `page.mouse.click` at a control's centre. No `scrollIntoView` / `scrollTo` / `scrollBy` / `scrollTop` writes in
  my probes (`probes/GREP-no-scroll-calls.txt`: every hit is a comment or a read). The repo's own `a11y.spec.ts`, run
  for item 15, uses `scrollIntoView` in its probe; that is the spec under test, not my input.
- Debug API (`window.__kettle`) for setup only: seed, `startFocus`, `ff`, `nearEnd`, `finish`, `timer.pause()`,
  `end('user')`, settings. Storage filled to `QuotaExceededError` with `localStorage` filler keys (setup; checked in
  every row). Toasts for items 8 and 10 raised with the app's own `toast()` (labelled setup; real timers). Toasts expire
  on their real timers everywhere except check 3 / 1d "step" captures, where the page clock itself is frozen (stated).
- Controls: a zero counts only where the defect reproduced on INT in this session; stated per item.

## Browser slots

- 03:24:56–03:45:37Z INT reach run, 03:24:57–03:36Z R7 reach run (1 slot each).
- 03:32:55Z I queued `pix.mjs`, `resid.mjs` and `spec15.sh`. Lane A's continuous rank-0 series, then LEAD, Dcap and B
  were served first; none started until the orchestrator switched the gate to fair share at 03:58Z
  (`logs/slots-status.log`, a snapshot a minute). Then: `pix` 03:59:54–04:10:27Z, `resid` 03:59:55–04:11:26Z,
  `spec15.sh` from 04:04:09Z (footer / panel-end / view-timing group, then item 15). A small real-clock diagnostic
  (`resid3`, "flash") was queued at 04:07Z (1d-2).
- While they were queued I re-ordered their internal order (comments in `pix.mjs` / `resid.mjs`) so check 3 and round
  6's items ran first. I did not resubmit them.
- Probe versions: `probes/` holds the final files (`SHA256SUMS.txt`). `pix.mjs` is byte-identical to what ran (last edit
  03:59:13Z, run started 03:59:54Z). `resid.mjs` only gained scenario definitions after a run had loaded it: the main
  `resid` run (03:59:55Z) predates the `viewlag` and `flash` scenarios; `resid2` (04:04:09Z) predates `flash`; `resid3`
  runs the final file. No scenario that ran was changed afterwards.

---

## Check 1. M7b at 200 % on R7

### 1a. Reach by real wheel, CDP touch drag and Tab / Shift+Tab — DONE (1 run per configuration per revision)

- Probe: M7b's `reach.mjs`, copied unedited to `.tmp/C/m7b/reach.mjs` (copy in `probes/`), sha256 `9d8ef06e…4fcfe`,
  equal to M7b's `probe/SHA256SUMS.txt`. Runner `run-reach.sh`. Wheel 100 px notches, CDP touch drags, keyboard last.
  Reached = whole box inside the visible screen ∩ clipping ancestors **and** `elementFromPoint` at its centre hits it,
  in both directions. `tap` = a real tap on "Pause break" must leave "Resume break" in view, and back.
- States: break running, break paused, Break's over with a carried task, Break's over without one, `tap`; 375×667,
  390×844, 844×390; light and dark; 200 %. Setup: newbie seed, brew with "Chapter 3 notes" (none for `over-plain`),
  `nearEnd` + `finish`, **real tap on Tea time**, `timer.pause()`, `finish()`.
- Judged twice: the probe's verdict, and my `judge_reach_c.py` from the raw rows (any `reached:false`, tap failure or
  page error). Same result on every row.

**Control first, reproduced.** INT ran first and reproduced the off-screen controls (scroller chain `doc 0/0` only;
375×667: "Pause break" y 645, "Resume break" 706, "Put the kettle on" 730, "That's all for now" 840 of 667, all
unreachable by wheel and touch). My INT failing sets equal M7b's INT rows configuration by configuration.

| | Runs | Failing runs | Failing configurations | control × method failures |
|---|---|---|---|---|
| **INT** `0d58c5e` | 30 | **22** | 375×667 10/10 · 390×844 4/10 · 844×390 8/10 | 96 (40 + 20 + 36) |
| **R7** `b39202f` | 30 | **0** | 0/30 | 0 |

Per configuration: `check1-reach/TABLE.md`. Raw `check1-reach/{INT,R7}-reach.jsonl`, `{INT,R7}-run1.log`; re-judged
`{INT,R7}-judged.md`; every probe frame in `check1-reach/{INT,R7}/`. Opened full size:
`INT/INT-375x667-dark-t200-over-carried-touch-bottom.jpg` (stuck at "Mark it done, start fresh"; Put / That's all below
the edge) vs `R7/R7-375x667-dark-t200-over-carried-touch-bottom.jpg` (all three in view).

- R7: the page never scrolls (`doc 0/0`); the session panel does. Ranges at 375×667: break 116, paused 177, Break's over
  (task) 236, (no task) 81; 390×844: 80 / 137 / 126 / fits; 844×390: fits / 83 / 338 / 183.
- Tab order identical on both revisions (break: Skip → Pause/Resume → Start next brew → top-bar chip, Ambience, Mute;
  Break's over: Mark it done → Put the kettle on → That's all for now → chip → Close). On R7 every control was in view
  when focused, forward and back (102 key checks, 0 failures). INT also "passes" Tab because focus scrolls its
  `overflow:hidden` screen (M7b's side finding); wheel and touch cannot.
- `tap` on R7: Pause y 645 → Resume 645 (375×667), 774 → 773 (390×844), 343 → 345 (844×390). **Observation:** at 375×667
  Resume (and Pause after the round trip) is hit-testable at its centre but **not whole** (`resumeWhole:false`; lower rim
  under the bottom edge, `R7/R7-375x667-light-t200-tap-tap-pause-resume.jpg`). The probe counts centre-hit as reached.
- Panel end (`resid.mjs` `pend-*`: real wheel until nothing moves; `check2-residuals/shots-footer-pend/`): R7 375×667 dark
  paused 177/177, captions' bottom 618 < 667 (whole); 390×844 light paused 137/137, captions 783 < 844; 844×390 light
  Break's over 234/234, "That's all for now" bottom 370 < 378. INT does not move (captions 734–781 of 667). The cut
  captions in the probe's own "bottom" frames (`R7/*-paused-wheel-bottom.jpg`) are where it stopped, not the panel's end.

### 1b. Bottom shade hint at 844×390 — DONE: present

`shade.mjs` on the probe's state-open frames (panel at its top), 844×390 @200 %: mean luminance of 4-device-px bands over
the panel column, background-coloured pixels only, bottom 60 device px; delta = darkest band − panel background
(`check1-reach/SHADE-844x390.txt`).

| State (more below?) | INT light | R7 light | INT dark | R7 dark |
|---|---|---|---|---|
| break paused (yes, range 83) | −1.1 | **−24.3** | +0.5 | **−5.8** |
| Break's over with task (yes, 338) | −0.4 | **−24.4** | +0.5 | **−6.4** |
| Break's over, no task (yes, 183) | −0.7 | −0.4 | +0.5 | −0.4 |
| break running (no, fits) | −3.9 | −3.9 (identical) | −9.5 | −9.5 (identical) |

Clear in light (opened `R7/R7-844x390-light-t200-over-carried-0-start.jpg`: grey shade along the panel's bottom edge),
**subtle in dark** (−6 on a background of 29; `R7/R7-844x390-dark-t200-paused-0-start.jpg`: barely visible). Without a
task no measurable shade, because "Put the kettle on" itself is cut at the edge and the shade paints behind content
(`R7/R7-844x390-light-t200-over-plain-0-start.jpg`). Gone at the end of the range (`*-wheel-bottom` frames).

### 1c. The accepted summary footer (Tea time / Skip) — DONE: not undone anywhere measured

`resid.mjs` footer group, INT then R7, fresh context each: summary after a brew; Tea time and Skip whole and
hit-testable; the sheet wheeled (real wheel) until nothing moves; last text line vs the footer's top
(`check2-residuals/resid2-footer-pend.jsonl`, frames `shots-footer-pend/`).

| Size | Text | INT: Tea / Skip whole + hit · last line bottom vs footer top | R7 |
|---|---|---|---|
| 375×667 | 100 % | yes / yes · 481 vs 529 → clears | identical numbers |
| 375×667 | 200 % | yes / yes · 439 vs 475 → clears | identical |
| 390×844 | 200 % | yes / yes · 616 vs 652 → clears | identical |
| 844×390 | 100 % | yes / yes · 212 vs 244 → clears | identical |
| 844×390 | 200 % | yes / yes · 170 vs 190 → clears | identical |
| 1440×900 | 100 % | yes / yes · details expanded, 699 vs 738 → clears | identical |
| 1440×900 | 200 % | yes / yes · 703 vs 730 → clears | identical |
| 390×844 | 100 % | **invalid on both**: my click on the first visible `[aria-expanded]` led to Today (`#/`) on both; before it, identical (Tea 720–780, Skip 784–836, footer top 706) | — |

### 1d. 100 % brew and break layouts (INT vs R7, same session, frozen clock) — DONE, one open point (1d-2)

`pix.mjs` flows: veteran seed, `capture.mjs`'s sequence 02 → 03 → 04 → 07 → Tea time (real click) → 09 → pause → 09p →
`finish` → 10; INT and R7 back to back per configuration; date frozen at 2026-10-10T18:30Z; **step** mode (page clock
paused after load, every wait `page.clock.runFor`); `animations:'disabled'`; "no toasts" shots hide the toast region
with screenshot CSS. Differing pixels (any channel > 2; device px; `check3-pixels/PIXDIFF-all.jsonl`, maps
`check3-pixels/diffmaps/`, shots `check3-pixels/shots/`):

| state | 375×667 light | 375×667 dark | 390×844 light | 390×844 dark | 1440×900 light | 1440×900 dark |
|---|---|---|---|---|---|---|
| 02 brew start | **0** | **0** | **0** | **0** | 523,418 (stage art) | 527,970 (stage art) |
| 03 brew mid | 20,111 (digit, fade edges) | **0** | **0** | **0** | 1,105 (none > 24) | 10,173 (628 > 24) |
| 04 brew paused | **0** | **0** | **0** | **0** | 1,114 (none > 24) | 1,539 (none > 24) |
| 07 summary | **0** | **0** | **0** | **0** | **0** | **0** |
| 09 break running | 8,848 (bottom band) | 5,584 (band) | 9,203 (band) | 5,819 (band) | **0** | 107,301 (artifact) |
| 09p break paused | **0** | **0** | **0** | **0** | **0** | **0** |
| 10 Break's over, no toasts | 11,522 (band) | 7,849 (band) | **0** | 8,179 (band) | 353 (none > 24) | **0** |
| 10 Break's over, toasts | = no toasts | = no toasts | 229,659 (toast) | = no toasts | 29,087 (toast) | 56,788 (toast) |

Causes (maps opened full size):
- **Brew 02–04: unchanged.** Phones 0 px except 375 light 03 (last countdown digit one second apart + anti-aliased edges
  of the status text and buttons, a fade phase; no shifted text). 1440 02: the stage's room art not yet painted on one
  side (`diffmaps/flow-1440x900-light-02-focus-start.jpg`), a load phase of the stage, which M7b does not touch; 03 / 04
  differ only by sub-24 pixels.
- **Summary 07 and paused break 09p: 0 px everywhere.**
- **1d-1, R7 only: a 12–19-device-px shade band at the panel's bottom edge** in 09 (375×667 and 390×844, both themes) and
  10 (375×667, 390×844 dark), at 100 %. At those shots the content is 12 px (break) / 14 px (Break's over) taller than
  the panel on **both** revisions (`panel.scroll` `[0,12]` / `[0,14]` in `pix.jsonl` for INT and R7). INT's panel is
  `overflow: visible`, so nothing shows; R7's is `overflow: hidden auto` with the shade, so it paints the shade and is
  scrollable by 12–14 px. 0.9 s later (09p) the pair is 0 px apart and the range is 0, and the real-clock pair
  `flowreal-390x844-light` (shots 3.8–5.8 s after the action) is **0 px** at 09 and 10 without toasts. Source (code,
  identical on both revisions): the break view enters with `initial={{ opacity: 0, y: 12 }}` and Break's over with
  `y: 14` (`FocusScreen.tsx` l.389 / l.351; 0.35 s ease-out; reduced motion uses opacity only). The translate adds
  12 / 14 px of scrollable overflow during the entrance; INT ignores it, R7's scrolling panel shows its shade for that
  long (opened: `check3-pixels/BAND-375x667-light-09-INT-top-R7-bottom.png`, the bottom 160 device px of the 375×667
  light pair: INT plain, R7 a soft grey shade). The frozen page clock held the entrance's first frame; its real-time
  length is 1d-2.
- **Break's over with toasts:** "Recipe done: Take 2 full tea breaks · +15 leaves" is at y 588 on INT and y 528 on R7
  (390×844, step and real clock alike): round 6's accepted D4 (toasts float above the whole Break's over dock,
  "Mark it done" included), not M7b.
- **1440 dark 09 and the reduced-motion step flow (390×844 dark 09 / 10): frozen-clock artifact, not counted.** One
  revision's panel was still empty at the shot — 1440 dark: **INT** empty, R7 drawn
  (`shots/flow-1440x900-dark-{INT,R7}-09-break-notoasts.jpg`); RM 390×844: **R7** empty. It flips side, 09p is 0 px apart,
  and in real time R7 draws the views as fast as INT (`viewlag`: real clock, real Tea-time click; first frame drawn at
  effective opacity ≥ 0.99; `check2-residuals/resid2-footer-pend.jsonl`):

  | Config | Break countdown drawn after Tea time, INT / R7 | "Break's over" drawn after `finish()`, INT / R7 |
  |---|---|---|
  | 390×844 dark, reduced motion | 578 / 516 ms | 361 / 332 ms |
  | 390×844 light | 988 / 854 ms | 457 / 440 ms |
  | 375×667 light | 717 / 748 ms | 456 / 423 ms |

  The real-clock reduced-motion pair (`flowreal-390x844-dark-rm`) is 0 px at 09 and at 10 without toasts. Why the frozen
  clock leaves a panel empty is not explained (framer-motion's frame loop under a paused page clock).

**1d-2 (real clock, 100 %): how long the R7 shade band shows after the break / Break's over view enters** — see the
section at the end (filled when `resid3` lands, or marked not run).

---

## Check 2. Round 6's 12 follow-ups and 3 unknowns, re-classified on R7 against INT

Probe `resid.mjs` (one Chromium, INT then R7 per scenario, fresh context each). The warning's "presenter" is INT's
toast `li#toast-kettle:save-failed` or R7's banner `section[data-save-warning]`. A rAF recorder logs presence, effective
opacity, box, overlap with the session readout / controls (box, and `elementFromPoint` = "hit"), other toasts over its
first text line, adds / removals, and every addition of its text to a live region. Raw rows
`check2-residuals/resid.jsonl` (+ `resid2-footer-pend.jsonl`), compact `SUMMARY.txt`, frames `shots/`, clips `clips/`,
clip contact sheets `clip-sheets/`. One run per scenario per revision.

Static facts used (code reading, not behaviour by themselves): R7 has no warning toast (`grep -rn "save-failed|
SAVE_TOAST|protectedUnderToasts|recheckSaveWarning|TOAST_ZONE" kettle/src` on R7: nothing; INT `flow.ts` l.166, 232,
274 has it). R7's `saveWarning.ts` re-checks recovery every 2 s and owns the polite region `#kettle-save-warning-said`.

| # | Round-6 item | INT this session | R7 this session | Class | Evidence |
|---|---|---|---|---|---|
| 1 | Forward Tab never reaches "Save backup" at 375×667 / 100 %; Shift+Tab does | 100 %: Tab **reached it at press 15** (after the composer and "Change brew length"; the toast was withdrawn and re-shown twice on the way); Shift+Tab 7. **200 %: never reached in 45 presses** (toast top −380, taken away once, not re-shown) | Tab reaches it at press **5** at 100 % and at 200 % (status pills, Chai's chip, Save backup); Shift+Tab 17 (from the end of the DOM); banner present in every frame, 0 removals | **resolved** (control reproduced at 200 %; at 100 % the "never" did not reproduce on INT this session) | rows `tab-t100-Tab`, `tab-t100-Shift+Tab`, `tab-t200-Tab`; `shots/{INT,R7}-tab-*-end.jpg` |
| 2 | Page scroll / Tab at 200 % / fling / arrows take the warning away | Tab @200 %: taken away (1 removal; absent or faded in 703 of 960 frames after its first). Wheel, touch fling, arrows @200 %: steady, 526/526 frames (this part did not reproduce) | Tab @200 %: 123/123 frames, 0 removals. Wheel 8×100 down / up, touch flings, ArrowDown / ArrowUp ×8 @200 %: 526/526 frames at full opacity, 0 removals | **resolved** (control reproduced via Tab) | `tab-t200-Tab`, `scroll-t200` |
| 3 | Coarse 53 / 100 px notches skip lines in the 58 px room (667×375 @200 %) | 53 px: 7/12 lines wholly seen, Save backup hit-testable; 100 px: 7/12, Save backup yes (the toast re-mounted 6–7 times meanwhile, item 14) | The banner is read through a **~60 px strip above the docked start** in the right column (`shots/R7-read-100-raster-3.jpg`: only its icon tile shows above "Put the kettle on · 25 min"). 53 px: **8/8 lines, Save backup yes**. 100 px: **4/8 lines, Save backup never wholly on screen and hit-testable** | **unchanged** (same class: a ~60 px window and coarse notches; at 53 px R7 reads everything, at 100 px it skips half the lines and misses Save backup, which INT reached this session) | `read-53`, `read-100` (`steps` = per-notch line bitmap); clip `clips/video-R7-read-100.webm`, `clip-sheets/sheet-R7-read100.jpg` |
| 8 | 2–3 ordinary toasts cover the countdown digits / status line | 3 toasts: clock and status covered (box and centre hit = toast) at 375×667 and 390×844, brew and break; 844×390 @200 %: boxes over clock / status, centres not hit | identical toast boxes and hits in all 6 configurations (only the empty room's top differs at 844×390 @200 %: R7 55 vs INT 75 in the brew, 13 vs 33 in the break) | **unchanged** | `t8-*` rows, `shots/{INT,R7}-t8-*.jpg` |
| 10 | 1440: stack over the docked start 0.15–0.54 s after End | 0 overlap in 4 Today frames | 0 overlap in 2 Today frames | **not settled** (rAF starved at 1440 under load: 2–4 frames in 2.5 s, longer than the window) | `lift10` rows |
| 11 | 150 % over-width; 200 % CLS with slow fonts (previews) | 375 @150 %: CLS 0.0519 all / 0 Chrome-counted, over-width 0. 390 @200 %: 0.262 / 0, 12 px; fonts +2.5 s: 0.622 / 0, **180 px**. 375 @200 %: 0.327 / 0, 22 px; fonts +2.5 s: 0.621 / 0, 195 px | 375 @150 %: 0.0519 / 0, 0. 390 @200 %: 0.231 / 0, 0; fonts +2.5 s: **0.378 / 0.378**, 0. 375 @200 %: 0.278 / 0, 2 px; fonts +2.5 s: 0.360 / **0.082**, 2 px | **unchanged** (R7 equals round 6's R6: Chrome-counted 0.378 / 0.082 vs R6 0.384 / 0.082, INT 0; all-entries CLS and transient over-width lower on R7) | `load-*` rows |
| 12 | 200 %: break / Break's over controls below the edge, no scroll | 22/30 configurations failing | 0/30 | **resolved** (control reproduced) | check 1a |
| 13 | 667×375 @200 %: older toasts over the warning's first line just after it appears | toast over its first line: 1 frame (read-100), 1 (read-53); the first line mostly above the screen | ordinary toasts (End's "Kettle's off…") float over the in-page banner's first line: 5 frames (read-100), 9 (read-53), 12 (375×667 scroll run) | **unchanged** (persists in a new form: page content under floating toasts, ≤ 12 frames per run) | `toastOverFirstLineFrames` |
| 14 | Lone warning mounted / removed / re-mounted; extra live-region additions | read-100: 6 adds / 6 removals / **6** live additions; read-53: 7 / 7 / **7**; brew start @200 %: 5 / 5 / 5; Tab @100 %: 2 / 2 / 2 | 1 add / 0 removals / **1** live addition in each run covering the first failure (read-100, read-53); 0 in every other window (Tab, scroll, start, back) | **resolved** (control reproduced) | `adds`, `removals`, `liveAdds` |
| 16 | Focus drops to `body` when the warning is withdrawn under focus | focus in Save backup (Shift+Tab 7), real wheel: toast withdrawn at scrollY 400, focus → **BODY** | focus in Save backup (Shift+Tab 17), wheel 8 down / 8 up: banner stays, focus on Save backup in 16/16 steps. Narrower new case: storage freed + the app saves again → banner gone after 616 ms → focus **BODY** (disclosed by M7a) | **resolved** for round 6's trigger; focus is still not restored when the banner leaves on recovery (INT has no recovery removal to compare) | `c6` rows (`rows` = scrollY : present : focus) |
| 18 | Warning over the leaving Today / countdown at brew start | 375×667 @200 %: over the session readout / controls by hit-test in **15** frames; 5 adds / removals. 1440 @100 %: 0 (11 frames) | 375×667 @200 %: **0** hit frames (8 box-overlap frames of the leaving Today layer, underneath); the banner leaves with Today. 1440: 0 (10 frames) | **resolved** (control reproduced at 375) | `start-*` rows, `shots/*-start-*-end.jpg` |
| 19 | After "Back to your brew" the warning covers Add 5 / Pause / End | 375×667 @100 %: over Add 5 / Pause / End by hit-test in **74 of 80** frames recorded in the 2.2 s after the click | **0** hit frames (2 box frames of the leaving Today layer, underneath; 118 frames recorded) | **resolved** (control reproduced). 200 %: **not run validly** — the button was below the fold on both and my click at off-screen coordinates did nothing (`hash` stayed `#/`) | `back-t100`, `back-t200` |
| 15 (UNKNOWN) | a11y "short screen (375×667)" failed 1 of 3 on R6 with Settings entries | INT's own spec on :5303, `--repeat-each=3 --retries=0`: **3 failed / 3**, each with exactly one entry: `break-over: "Mark it done, start fresh" stays under span._message…` (a toast; the D4 entry round 6 saw on INT); no Settings entry | R7's own spec on :5301, same flags: **3 passed / 3** (51.5 s, 52.0 s, 51.9 s); no Settings entry. (Lane A's full `a11y.spec.ts` on R7 also passed "short screen" once, `A/specs/a11y-b39202f.log`, not my run) | **resolved in this session** (R6's Settings failure did not occur in 3 of 3 runs; a 1-in-3 intermittent cannot be excluded by 3 runs) | `check2-residuals/spec15/{R7,INT}-a11y-short.log` |
| 22 (UNKNOWN) | Session chrome hidden at `13-first-brew` and RM `04` | — | — | **settled: timing of the 7 s zen fade; identical code; identical pixels at equal page time** | check 3.2 |
| 24 (UNKNOWN) | 667×375 clip: empty-looking room ~4.9 s while the DOM shows the warning | — | The warning is no longer in a toast room. In R7's 667×375 @200 % clip (100 px notches; 30 frames sampled 1 s apart) the banner is painted whenever it is in the strip (honey tile; "storage is full." readable in a sampled frame); no empty-looking strip seen. (INT's clip, sampled the same way, shows its toast painted too: the round-6 empty room did not reproduce this session) | **resolved** as stated (the symptom's container is gone); raster starvation itself not re-tested on a GPU | `clip-sheets/sheet-R7-read100.jpg`, `clips/video-R7-read-100.webm` |

---

## Check 3. Round 6's three unresolved pixel differences — causes

Method: `pix.mjs` (the repo's `capture.mjs` has no fixed-clock option: real waits and `new Date()`), one Chromium, **INT
and R7 back to back per state, same session, same load**, fresh context each, `page.clock.install({ time })` before the
app loads, timezone UTC, `scene:'off'`, `animations:'disabled'` unless marked "live". Same states and waits as
`capture.mjs`. **step** = page clock paused after load, every wait `page.clock.runFor(ms)` (identical page time on both
revisions whatever the load); **real** = clock running from the fixed time, real waits, real ms recorded. Dates
2026-10-10T18:30Z (round 6's R6 capture day) and 2026-10-08T09:10Z (the BEFORE set's day). Shots
`check3-pixels/shots/`, per-shot DOM facts `SHOTS.md` / `pix.jsonl`, pixel counts `PIXDIFF-all.jsonl`.

### 3.1 375×667 status-bar row (`01-home`) — cause: code × data (the intended I04 "tight" step)

| Date frozen | Config | Leaves | INT status bar | R7 status bar | Differing px (>2 / >24) |
|---|---|---|---|---|---|
| Oct 10 18:30Z | 375×667 light | 2,211 | one row (height 48) | one row (48) | **0 / 0** |
| Oct 10 18:30Z | 375×667 dark | 2,211 | one row | one row | **0 / 0** |
| Oct 10 18:30Z | 390×844 light | 2,211 | one row | one row | **0 / 0** |
| Oct 8 09:10Z | 375×667 light | 2,296 | **`data-wrap`: "Level 12" on a second row** (stats at y 10, 10, 62; height 100) | **`data-tight`: one row** (48) | 405,194 / 187,006 (**18.7 %**) |
| Oct 8 09:10Z | 375×667 dark | 2,296 | `data-wrap`, two rows | `data-tight`, one row | 402,559 / 164,699 (**16.5 %**) |
| Oct 8 09:10Z | 390×844 light | 2,296 | one row | one row | **0 / 0** |

The veteran seed's numbers follow the date. 2,211 leaves (Oct 10) fit on one row at the designed padding with either
code, so INT and R7 are pixel-identical. 2,296 (Oct 8) does not: INT's status bar has two steps (designed padding, else
wrap) and wraps, pushing Today down 52 css px; R7's has a step in between (6 px "tight" padding, same row), from
`3bc0c66` "I04 integration fix (code): Today's stats keep one row at 375 px (tight padding before wrapping)" (extended in
`24bb9d0`, `c9c263a`, `371f999`; all before round 6). Round 6 compared R6 on Oct 10 with BEFORE (INT code) on Oct 8 and
saw both effects at once (18.1 % / 15.9 %, the magnitudes measured here). Opened full size:
`shots/home-375x667-light-beforeday-{INT,R7}-01-home.jpg`.

### 3.2 Hidden session chrome at `13-first-brew` and reduced-motion `04` — cause: timing of the 7 s zen fade

Code identical on both revisions: `useZen` (`src/screens/focus/parts/hooks.ts`; `git diff --stat 0d58c5e b39202f` empty)
sets `data-zen` 7 s after the last pointer / key / wheel / touch / focus event while a brew runs unpaused; the chrome
fades over 700 ms (no reduced-motion override); controls dim to 0.62, captions to 0. Pause turns zen off and the chrome
fades back in over 700 ms. `capture.mjs` shoots 13 at 3.0 s after the click and 04 at 0.9 s after `pause()`, real waits.

| Pair (step, frozen clock) | INT `data-zen` / chrome opacity | R7 | Differing px |
|---|---|---|---|
| 13 at +3.0 s: 390×844 light, 390×844 dark, 375×667 dark | false / 1,1,1 | false / 1,1,1 | **0 / 0 / 0** |
| 13 at +8.0 s (past 7 s), same three | **true** / 1,1,0 | **true** / 1,1,0 | 3 / 3 / 0 (one dial pixel) |
| 13, real clock, 390×844 dark | false | false | **0** |
| RM 04, 390×844 dark, 5.6 s after start | false / 1,1,1 | false / 1,1,1 | **0** |
| RM 04 with zen already on (8.1 s before Pause): before Pause | true | true | **0** |
| … 0.1 s after Pause, CSS transitions live | false, chrome 0,0,1 (still faded) | false, 0,0,1 | 154,593 (fade progress differs; both hidden) |
| … 2.1 s after Pause | false, 1,1,1 | false, 1,1,1 | **0** |

At equal page time both revisions are identical; past the 7 s mark both hide the chrome; just after Pause both still
show it faded. In round 6's RM `04` pair the countdowns read 12:19 (R6) and 12:21 (BEFORE) against 12:30 right after the
fast-forward, so on both the pause came 9–11 s after the brew started, with zen already on; the chrome was then fading
back in, and the two shots landed at different points of that 700 ms fade (R6 inside it, BEFORE after it). For `13`
the shot lands before or after the 7 s mark depending on how slow the machine is. Cross-check (maker evidence, not my run): M7a's real-clock `captures/brew100`, taken
back to back with `capture.mjs`, show the **opposite** side hidden — INT 390×844 light `02` in zen (top-band sd 15.0 vs
40.7; countdown 24:47, 13 s after the start) while R7 is not (`check3-pixels/crosscheck-M7a-brew100/`). The hidden
chrome follows the machine's timing, not the revision.

### 3.3 "Recipe done" toast at `10-break-over` — cause: the day's recipes and the toast's 3.2 s life; placement is round 6's D4

| Run | INT | R7 |
|---|---|---|
| Oct 10 18:30Z, step, +2.6 s after `finish()` (390×844 light) | "Recipe done: Take 2 full tea breaks · +15 leaves", y 588 | same toast, **y 528** |
| Oct 10, step, +3.4 s (390×844 light) | gone | gone |
| Oct 8 09:10Z, step, +2.6 s (390×844 light) | **no toast** | **no toast** |
| Oct 10, real clock, reduced motion, 390×844 dark (shot 3.7 / 3.5 s after `finish()`) | present, y 588 | present, y 528 |

- Presence depends on the date: on Oct 10 the day's recipe "Take 2 full tea breaks" completes when this break ends; on
  Oct 8 (the BEFORE day) no recipe completes at the break's end, on either revision. Round 6 compared R6 (Oct 10) with
  BEFORE (Oct 8).
- When raised it lives 3.2 s; `capture.mjs` shoots 2.6 s after `finish()` with real waits, so load decides whether it is
  still on screen (present at +2.6 s, gone at +3.4 s of page time here).
- Placement: on R7 it sits 60 css px higher (390×844), above the whole Break's over dock including "Mark it done" —
  round 6's accepted D4 (in the integration since round 6, not M7b). `diffmaps/flow-390x844-light-10-break-over.jpg`
  (229,659 px, the toast only; the same shot without toasts is 0 px apart).

---

## Runs and failures per configuration

| Probe | Configurations | INT | R7 |
|---|---|---|---|
| `reach.mjs` (1a) | 3 sizes × 2 themes × 5 states @200 % | 30 runs / 22 failing | 30 runs / 0 failing |
| `pix.mjs` (1d, 3) | 21 jobs: home ×6, first ×3 + 1 real, RM flow + zen, flows ×7 (incl. BEFORE-day), real flows ×2 | 21 run, 0 errors | 21 run, 0 errors |
| `resid.mjs` (2) | 23 scenarios | 23 run (back-t200 invalid) | 23 run (back-t200 invalid) |
| `resid.mjs` view timing / footer / panel end (1a, 1c, 1d) | 14 scenarios | 14 run (footer 390×844 @100 % invalid) | 14 run (same) |
| `a11y.spec.ts` "short screen" (15) | ×3, `--retries=0`, each revision's own spec | 3 run / 3 failed (D4 entry) | 3 run / 0 failed |

## Not run / partial (never a pass)

- 1a: one run per configuration per revision (M7b ran two).
- 1c: 390×844 @100 % footer run invalid on both revisions (probe step).
- 1d: 1440 dark 09 and the reduced-motion step flow (09, 10) are frozen-clock artifacts and not counted; the real-clock
  checks replace them for the reduced-motion flow at 390×844 only. 1d-2 below.
- 2: item 10 not settled (frame starvation at 1440); item 19 at 200 % not run validly; one run per scenario.
- Everything: SwiftShader on 4 shared CPUs, CDP touch, synthetic wheel notches, `html{font-size}` for large text; no real
  devices, no assistive technology, Chromium only.

## 1d-2. Real-clock shade band after the view enters (100 %)

**Not run (slot).** The real-clock diagnostic (`resid.mjs` `flash-390x844`, `flash-375x667`: per-frame panel scroll range
for 1.6 s after a real Tea-time click and after `finish()`, INT and R7) was queued at 04:07:57Z and had not been given a
slot when this receipt was closed (fair-share queue: a 2-slot Lane D job ahead). If it runs later its rows land in
`…/scratchpad/r7/C/resid3/resid.jsonl`; they are not part of this receipt. What stands without it: the band exists only
while the entering view is translated (12 / 14 px, 0.35 s ease-out, code above); at the frozen first frame it is
present (pixel evidence); 3.8–5.8 s later in real time it is absent (0 px). Its real-time duration is therefore bounded
by the 0.35 s entrance but **not measured**; under reduced motion the views enter with opacity only (no translate, by
code), so no band is expected there (not measured either).

## Wall clock

PENDING_END
