# Lane C receipt, round-7 review

- Lane C. Checks and receipt only. **No verdict.** I implemented nothing in round 7 and edited no app code, tests or
  maker files. Nothing committed or pushed. Orchestrator servers never stopped or restarted.
- Model: Claude Opus 5.5 (`claude-opus-5-5`). Effort: not inspectable.
- Wall clock: start **2026-10-11T03:23:56Z**; end: see "Wall clock" at the bottom. Budget 90 min, extended by the
  orchestrator at 03:58Z by 20 min (to about 05:15Z) for the slot wait.
- **Relaunch.** The first Lane C instance (model above) stopped at about 04:50Z on a usage limit. This receipt was
  continued by a relaunched Lane C instance, **Claude Sonnet 5.5 (`claude-sonnet-5-5`), effort not inspectable**, started
  **2026-10-11T09:43:11Z** with a 75-minute budget (to about 10:58Z). Every completed check of the first run (1a–1d, 2, 3) is kept
  as it was; the relaunch adds Check 4 (Close / Ambience / Mute), Check 5 (the probes the maker did not re-run), the 1d-2
  results and the closing wall clock, and updates "Not run / partial". Servers restarted by the orchestrator at 09:40Z on the
  same ports and builds (R7 `b39202f` :5301, INT `0d58c5e` :5303, unfixed `49ea1de` :5305); earlier results on those builds stand.
- Under review: **R7** = trial merge `b39202f` (worktree `/home/user/wt/rv7-r7`, `kettle/src` `6db18ad`), dev server +
  debug API http://127.0.0.1:5301; production preview :5321 (item 11 only). Control / BEFORE: **INT** `0d58c5e`
  (`kettle/src` `1fc4a1b`), http://127.0.0.1:5303; preview :5323 (item 11 only). At 03:26Z I checked that :5301 serves
  the R7 blobs and :5303 the INT blobs of `FocusScreen.module.css`, `Toast.tsx`, `flow.ts` (`?raw` text, sha256 equal
  to `git show <rev>:kettle/<path>`).
- Folder `round7-review/C/`: `check1-reach/`, `check2-residuals/`, `check3-pixels/`, `check4-close/` (relaunch), `probes/` (every probe I ran +
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

**Relaunch slots (fair-share gate).** The lead's exclusive integrity run (`LEAD`, n 3) was gone from `slots.py status` by
09:48Z; I prepared probes meanwhile and started no browser before that. Every browser went through `slots.py run --lane C --n 1`
(one Chromium per job). `runC1.sh` (control `49ea1de`, then R7 Break's over / Close over 10 configurations) held its slot
09:49:08–10:04:16Z; `runC2.sh` (R7 focus running + paused break over 10 configurations, then M7b's unchanged
`toastcheck.mjs`) 10:06:18–10:23:50Z; `runC3.sh` (control extras, then M7b's `break-reach.spec.ts`; lowest priority) is
timed in 4e / the spec section. Slot lines: `check4-close/logs/job{1,2,3}.log`. I queued at most two jobs at a time and did
not append work to a running job to keep a slot (`runC2.sh` and `runC3.sh` were edited only while they were still queued).

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

**1d-2 (real clock, 100 %): how long the R7 shade band shows after the break / Break's over view enters** — DONE at the relaunch from rows that landed at 04:46Z: see section 1d-2 at the end (about 0.15–0.3 s from the view's first painted frame, gone by 0.83 s / 0.60 s).

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

## Check 4 (relaunch). Close, Ambience and Mute stay clear at every size and scroll position — R7: DONE (frames and real taps, 10 configurations); control: partly (4a, 4e)

Added at the relaunch (09:43Z). Probe: **`closecheck2.mjs`**, an extension of the lead's `closecheck.mjs`. The lead's file was
checked against `LEAD/probes/SHA256SUMS.txt` first (`c17efde4…`, equal) and copied unedited as `probes/closecheck-lead.mjs`;
the extension is a separate file (`probes/closecheck2.mjs`, `SHA256SUMS.txt`). What it adds to the lead's probe:
- **Per frame (rAF, 2.4 s after the toasts are raised), for Close, Ambience, Mute and every panel control:** the control's
  rect, whether `elementFromPoint` at its visible centre hits it, whether a painted toast box (clipped by the list's
  scrollport) overlaps it by > 1 px, and what was hit instead. "Covered" = overlap or centre not hit; the three counts are
  kept apart (`hit`, `ovl`, `cov` in the tables).
- **A real tap per control**, with the toasts still up: CDP touch (`page.touchscreen.tap`) on the phone sizes, a real mouse
  click at 1440. Activation is judged by its effect: Close → `#/focus` becomes `#/`; Mute → the label / `aria-pressed`
  flips (then tapped back); Ambience → its dialog opens (then a real Escape closes it). Each tap row records the centre
  hit-test before the tap and what element it hit.
- **`focus` (running) as a third state**, kept awake with a real pointer move before each measurement: while a brew runs
  unpaused the top bar fades to opacity 0 and ignores pointers after 7 s idle (`.screen[data-zen] .chrome`, by design:
  "a tap there only wakes"); `zenFrames` is recorded per row (0 everywhere below).
- Everything else as the lead's probe: states set up by the debug API, a real tap on Tea time, the panel scrolled to its
  **end by real mouse wheel** (100 px notches until nothing moves), toasts raised through the app's own `toast()` as
  labelled setup with `duration: 8000` (real timers, nothing held; dismissed between sub-runs), 1 and 3 toasts, panel at
  its top and at its end, one fresh disposable context per (configuration, state); no `scrollIntoView` / `scrollTo` /
  `scrollBy` / `scrollTop` writes.
- **Close taps** are in separate fresh contexts (the tap leaves Break's over): panel top + 3 toasts, panel end + 3 toasts
  (control additionally: end + 1 toast). **Ambience / Mute taps** (focus and paused break): 3 toasts, panel top and end.
- Which control exists where (`FocusScreen.tsx` l.283–320): **Ambience** is in the top bar of the focus view and the break;
  **Mute** likewise; in **Break's over** the bar holds **Close** instead, with no Ambience and no Mute.
- Configurations as asked, in order: 375×667, 390×844, 667×375, 844×390 at 200 % text (`html{font-size:200%}`), light and
  dark; then 375×667 and 1440×900 at 100 %, light. Revision / port: R7 `b39202f` :5301; control unfixed `49ea1de` :5305
  (served byte for byte as re-verified by the orchestrator at 09:40Z). Newbie seed, `nooktime=day` in light.

### Summary: R7 against the control (frames: total / covered / centre hits the control; taps: activated / tried)

| Build | Configuration | **Close**, Break's over: frames | Close taps (3 toasts) | **Ambience · Mute**, focus running: frames | **Ambience · Mute**, paused break: frames | Ambience taps · Mute taps (3 toasts) |
|---|---|---|---|---|---|---|
| **control** `49ea1de` | 375×667 @200 % light | 657 / 166 / 493 | 2/3 | 300 / 0 / 300 · 300 / 0 / 300 | 429 / 0 / 429 · 429 / 0 / 429 | 4/4 · 4/4 |
| **control** `49ea1de` | 667×375 @200 % light | — | — | 414 / 74 / 342 · 414 / 0 / 414 | 755 / 361 / 398 · 755 / 0 / 755 | 1/4 · 4/4 |
| R7 `b39202f` | 375×667 @200 % light | 680 / 0 / 680 | 2/2 | 277 / 0 / 277 · 277 / 0 / 277 | 477 / 0 / 477 · 477 / 0 / 477 | 4/4 · 4/4 |
| R7 `b39202f` | 375×667 @200 % dark | 713 / 0 / 713 | 2/2 | 388 / 0 / 388 · 388 / 0 / 388 | 557 / 0 / 557 · 557 / 0 / 557 | 4/4 · 4/4 |
| R7 `b39202f` | 390×844 @200 % light | 768 / 0 / 768 | 2/2 | 371 / 0 / 371 · 371 / 0 / 371 | 583 / 0 / 583 · 583 / 0 / 583 | 4/4 · 4/4 |
| R7 `b39202f` | 390×844 @200 % dark | 731 / 0 / 731 | 2/2 | 373 / 0 / 373 · 373 / 0 / 373 | 535 / 0 / 535 · 535 / 0 / 535 | 4/4 · 4/4 |
| R7 `b39202f` | 667×375 @200 % light | 758 / 0 / 758 | 2/2 | 501 / 0 / 501 · 501 / 0 / 501 | 719 / 0 / 719 · 719 / 0 / 719 | 4/4 · 4/4 |
| R7 `b39202f` | 667×375 @200 % dark | 752 / 0 / 752 | 2/2 | 508 / 0 / 508 · 508 / 0 / 508 | 673 / 0 / 673 · 673 / 0 / 673 | 4/4 · 4/4 |
| R7 `b39202f` | 844×390 @200 % light | 760 / 0 / 760 | 2/2 | 281 / 0 / 281 · 281 / 0 / 281 | 570 / 0 / 570 · 570 / 0 / 570 | 4/4 · 4/4 |
| R7 `b39202f` | 844×390 @200 % dark | 790 / 0 / 790 | 2/2 | 168 / 0 / 168 · 168 / 0 / 168 | 477 / 0 / 477 · 477 / 0 / 477 | 4/4 · 4/4 |
| R7 `b39202f` | 375×667 @100 % light | 646 / 0 / 646 | 2/2 | 258 / 0 / 258 · 258 / 0 / 258 | 461 / 0 / 461 · 461 / 0 / 461 | 4/4 · 4/4 |
| R7 `b39202f` | 1440×900 @100 % light | 568 / 0 / 568 | 2/2 | 191 / 0 / 191 · 191 / 0 / 191 | 285 / 0 / 285 · 285 / 0 / 285 | 4/4 · 4/4 |

Control rows: Close taps are top · 3, end · 3 and end · 1 toasts (2 of 3 activated); the 667×375 control row has no Break's over run (—). R7 Close taps: top · 3 and end · 3 (2 of 2 in every configuration). Ambience / Mute taps: focus and paused break × panel top and end, 3 toasts (4 + 4 per row).

### 4a. Control, re-run once in this session first — Close covered (reproduced)

`49ea1de` on :5305, 375×667 @200 light, Break's over with a carried task, 09:49–09:50Z (`check4-close/ctl-49ea1de-5305/`,
`TABLES-control-49ea1de.md`). Today's earlier figure (lead): Close covered 152/153 frames.

| Panel · toasts | Frames | Close centre hits Close | Close overlapped by a toast | Covered | Real touch tap on Close (3 toasts) |
|---|---|---|---|---|---|
| top · 1 | 179 | 179 | 0 | 0 | — |
| top · 3 | 134 | 134 | 0 | 0 | hits Close; **activated** (`#/focus` → `#/`) |
| end (236/236) · 1 | 176 | 176 | 0 | 0 | tap with 1 toast: hits Close; **activated** |
| end (236/236) · 3 | 168 | **4** | **166** | **166 of 168** (139 of 139 settled) | centre hit = the "Recipe done" toast (`span`); **not activated** (`#/focus` stays) |

Opened full size: `ctl-49ea1de-5305/49ea1de-375x667-t200-light-over-carried-end-n3.jpg` (Close hidden under the top toast,
only the edge of its tile shows at the right) against R7's frame below.

### 4b. R7 `b39202f` :5301, Break's over (Close) — 0 covered frames in every configuration, every tap activated

Per configuration, frames pooled over the four sub-runs (panel top / end × 1 / 3 toasts); Close covered = overlap or centre
not hit. Close rect is the same in every frame of a configuration (1 distinct rect). Taps: touch (phones) / click (1440),
3 toasts, panel top and panel end. All rows: `check4-close/TABLES-R7-b39202f.md`, raw `r7-b39202f-5301/closecheck2-b39202f.jsonl`.

| Configuration | Panel range at the end | Close rect [l,t,r,b] | Frames | Centre hits Close | Covered | Taps activated |
|---|---|---|---|---|---|---|
| 375×667 @200 light | 236 | [319,10,363,54] | 680 | 680 | **0** | 2/2 (top, end) |
| 375×667 @200 dark | 236 | same | 713 | 713 | **0** | 2/2 |
| 390×844 @200 light | 126 | [334,10,378,54] | 768 | 768 | **0** | 2/2 |
| 390×844 @200 dark | 126 | same | 731 | 731 | **0** | 2/2 |
| 667×375 @200 light | 353 | [607,13,651,57] | 758 | 758 | **0** | 2/2 |
| 667×375 @200 dark | 353 | same | 752 | 752 | **0** | 2/2 |
| 844×390 @200 light | 338 | [784,13,828,57] | 760 | 760 | **0** | 2/2 |
| 844×390 @200 dark | 338 | same | 790 | 790 | **0** | 2/2 |
| 375×667 @100 light | 0 (fits) | [319,10,363,54] | 646 | 646 | **0** | 2/2 |
| 1440×900 @100 light | 0 (fits) | [1356,24,1400,68] | 568 | 568 | **0** | 2/2 (mouse click) |

Opened full size: `r7-b39202f-5301/b39202f-375x667-t200-light-over-carried-end-n3.jpg` (the stack's room starts under the bar; Close
whole above the top toast, which is cut at the room's top and scrolls inside it, 90 of 138 px visible; "Mark it done",
"Put the kettle on", "That's all for now" in view) and `…-667x375-t200-light-over-carried-end-n1.jpg`. A 1-toast tap on R7
was not run (the 1-toast frames are clear in every row; the control's 1-toast tap activated).

### 4c. R7 `b39202f` :5301, Ambience and Mute (focus running, paused break) — 0 covered frames in every configuration, every real tap activated

Same probe and conditions as 4b (frames pooled over the four sub-runs per row: panel top / end × 1 / 3 toasts; real wheel to the
end; fresh disposable context per row). Ambience and Mute sit in the session top bar of the focus view and the break; **each
real touch tap (CDP; mouse click at 1440) was made with 3 toasts up** (at 1440, two of the four Ambience taps were made with 6 up,
because the Mute step's three were still showing when the Ambience step raised three more; the toast count at each tap is in
the rows), panel at its top and at its end: Mute → label flips (and
is tapped back), Ambience → its dialog opens and a real Escape closes it. Every tap row records the centre hit-test just
before the tap (always the control itself). `centre hits` = frames in which `elementFromPoint` at the control's centre was the
control; `covered` = a painted toast box overlapped it by > 1 px or the centre was not the control. Zen: `zenFrames` 0 in every
row (the focus state was kept awake by a real pointer move). Each control's rect was the same in every frame of every row (1 distinct rect in all 80 Ambience, 80 Mute and 40 Close rows). Rows: `check4-close/TABLES-R7-b39202f.md`.

| Configuration | State | Ambience: rect · frames · centre hits · covered | Mute: rect · frames · centre hits · covered | Ambience taps (3 toasts; top / end) | Mute taps (3 toasts; top / end) | Panel controls in view: covered frames after 0.9 s · covered in the entry frames (frames seen) |
|---|---|---|---|---|---|---|
| 375×667 @200 % light | focus running | [194, 48, 311, 97] · 277 · 277 · **0** | [319, 50, 363, 94] · 277 · 277 · **0** | **activated** / **activated** | **activated** / **activated** | 0 settled · 0 in entry frames (831 frames seen) |
| 375×667 @200 % light | paused break | [194, 48, 311, 97] · 477 · 477 · **0** | [319, 50, 363, 94] · 477 · 477 · **0** | **activated** / **activated** | **activated** / **activated** | 0 settled · 0 in entry frames (735 frames seen) |
| 390×844 @200 % dark | focus running | [209, 48, 326, 97] · 373 · 373 · **0** | [334, 50, 378, 94] · 373 · 373 · **0** | **activated** / **activated** | **activated** / **activated** | 0 settled · 0 in entry frames (1119 frames seen) |
| 390×844 @200 % dark | paused break | [209, 29, 326, 78] · 535 · 535 · **0** | [334, 32, 378, 76] · 535 · 535 · **0** | **activated** / **activated** | **activated** / **activated** | 0 settled · 0 in entry frames (1605 frames seen) |
| 667×375 @200 % light | focus running | [482, 50, 599, 99] · 501 · 501 · **0** | [607, 52, 651, 96] · 501 · 501 · **0** | **activated** / **activated** | **activated** / **activated** | 0 settled · 0 in entry frames (1503 frames seen) |
| 667×375 @200 % light | paused break | [482, 50, 599, 99] · 719 · 719 · **0** | [607, 52, 651, 96] · 719 · 719 · **0** | **activated** / **activated** | **activated** / **activated** | 0 settled · 0 in entry frames (1080 frames seen) |
| 667×375 @200 % dark | focus running | [482, 50, 599, 99] · 508 · 508 · **0** | [607, 52, 651, 96] · 508 · 508 · **0** | **activated** / **activated** | **activated** / **activated** | 0 settled · 0 in entry frames (1524 frames seen) |
| 667×375 @200 % dark | paused break | [482, 50, 599, 99] · 673 · 673 · **0** | [607, 52, 651, 96] · 673 · 673 · **0** | **activated** / **activated** | **activated** / **activated** | 0 settled · 0 in entry frames (966 frames seen) |
| 375×667 @200 % dark | focus running | [194, 48, 311, 97] · 388 · 388 · **0** | [319, 50, 363, 94] · 388 · 388 · **0** | **activated** / **activated** | **activated** / **activated** | 0 settled · 0 in entry frames (1164 frames seen) |
| 375×667 @200 % dark | paused break | [194, 48, 311, 97] · 557 · 557 · **0** | [319, 50, 363, 94] · 557 · 557 · **0** | **activated** / **activated** | **activated** / **activated** | 0 settled · 0 in entry frames (861 frames seen) |
| 390×844 @200 % light | focus running | [209, 48, 326, 97] · 371 · 371 · **0** | [334, 50, 378, 94] · 371 · 371 · **0** | **activated** / **activated** | **activated** / **activated** | 0 settled · 0 in entry frames (1113 frames seen) |
| 390×844 @200 % light | paused break | [209, 29, 326, 78] · 583 · 583 · **0** | [334, 32, 378, 76] · 583 · 583 · **0** | **activated** / **activated** | **activated** / **activated** | 0 settled · 0 in entry frames (1749 frames seen) |
| 844×390 @200 % light | focus running | [659, 50, 776, 99] · 281 · 281 · **0** | [784, 52, 828, 96] · 281 · 281 · **0** | **activated** / **activated** | **activated** / **activated** | 0 settled · 0 in entry frames (843 frames seen) |
| 844×390 @200 % light | paused break | [659, 50, 776, 99] · 570 · 570 · **0** | [784, 52, 828, 96] · 570 · 570 · **0** | **activated** / **activated** | **activated** / **activated** | 0 settled · 0 in entry frames (864 frames seen) |
| 844×390 @200 % dark | focus running | [659, 50, 776, 99] · 168 · 168 · **0** | [784, 52, 828, 96] · 168 · 168 · **0** | **activated** / **activated** | **activated** / **activated** | 0 settled · 0 in entry frames (504 frames seen) |
| 844×390 @200 % dark | paused break | [659, 50, 776, 99] · 477 · 477 · **0** | [784, 52, 828, 96] · 477 · 477 · **0** | **activated** / **activated** | **activated** / **activated** | 0 settled · 0 in entry frames (783 frames seen) |
| 375×667 @100 % light | focus running | [225, 13, 311, 57] · 258 · 258 · **0** | [319, 13, 363, 57] · 258 · 258 · **0** | **activated** / **activated** | **activated** / **activated** | 0 settled · 24 in entry frames (774 frames seen) |
| 375×667 @100 % light | paused break | [225, 10, 311, 54] · 461 · 461 · **0** | [319, 10, 363, 54] · 461 · 461 · **0** | **activated** / **activated** | **activated** / **activated** | 0 settled · 23 in entry frames (1383 frames seen) |
| 1440×900 @100 % light | focus running | [1262, 24, 1348, 68] · 191 · 191 · **0** | [1356, 24, 1400, 68] · 191 · 191 · **0** | **activated** / **activated** [click] | **activated** / **activated** [click] | 0 settled · 0 in entry frames (573 frames seen) |
| 1440×900 @100 % light | paused break | [1262, 24, 1348, 68] · 285 · 285 · **0** | [1356, 24, 1400, 68] · 285 · 285 · **0** | **activated** / **activated** [click] | **activated** / **activated** [click] | 0 settled · 0 in entry frames (855 frames seen) |

**Panel controls in the same frames** (focus: Add 5, Pause, End; paused break: Skip, Resume, Start next brew; counted only in
frames where they are on screen; at the panel's top the break's controls are below the fold on the short phones, by M7b's design):
**0 settled-covered frames everywhere**. At **375×667 @100 % light** only, the box of an **entering** toast overlapped the control
row in 19 frames (47 control-frames, up to three controls per frame), all at 32–244 ms after the toasts were raised (the slide-in), in focus and break, with the centre hit-test
still the control itself in every one of those frames; none after 900 ms. That is round 6's accepted behaviour (toasts float
above the dock; M7a's own run saw the same entry frames), not a Close / Ambience / Mute frame.

Frame density, honestly: the rAF recorder ran at 17–60 fps under the shared load. The thinnest rows are 844×390 @200 in the focus
state (31–47 frames per 2.4 s sub-run, largest gap 0.93 s: SwiftShader drawing the stage), pooled 168–281 frames per row; the
screenshot at 1.1 s and the tap rows are not affected by it.

**One odd row:** 1440×900 @100 focus, panel "end", Ambience tap: the dialog opened (activation counted) but was still in the DOM
0.7 s after a real Escape; my fallback (a tap on its Done button) could not run because the probe's finder searches the session
view only. The other 39 Ambience rows closed on Escape within 0.7 s. Cause not investigated (an exit animation slower than my
wait under load, or an Escape that did not reach the sheet); it was the context's last step.

**Control for Ambience / Mute:** 4e below (my own `49ea1de` run at 667×375 and 375×667 @200 light): the unfixed build covers
**Ambience** at 667×375 (181 of 182 frames covered with the panel at its end and 3 toasts, taps not activated) and R7 does not.
The lead's control run agrees (`LEAD/runs/close-ctl5305/closecheck-49ea1de.jsonl`, 667×375 @200 light paused break: Ambience
covered in 173 and 163 frames, 0 in the 1-toast rows; the lead's R7 run `LEAD/runs/close-r7/` 0 everywhere).

### 4d. Toast visibility observed in the same rows (not a Close defect, identical on the control)

With Break's over scrolled to its **end** at the two landscape sizes at 200 %, the toasts' room is a strip at the very top of
the screen (clip `[−12, 19]` at 667×375, `[−12, 34]` at 844×390): **1 toast shows 19 of 52 px (667×375) / 34 of 52 px
(844×390); with 3, two are 0 px (fully above the screen) and the newest shows the same 19 / 34 px**. Close is clear in all
of these frames, and nothing covers the panel's controls, but the toasts cannot be read there. The same numbers are in the
lead's control run on `49ea1de` at 667×375 light (`LEAD/runs/close-ctl5305/closecheck-49ea1de.jsonl`: end · 1 → 19/52,
end · 3 → 0 · 0 · 19), so this is the room the lift leaves (it floats above the docked controls, which at the end of the
range sit high on a short screen), not something the Close fix changed. I did not run my own Break's over control at 667×375 or 844×390 (my 4e control at 667×375 is the paused break and focus state).
In Break's over at 375×667 and 390×844 @200 and at 100 % the toasts are whole except the top one of three at 375×667 @200 (90/138 px,
scrolls inside the room). In the paused break and the focus state every toast is whole in every row except the top of three at 667×375
@200 paused with the panel at its top (25 of 97 px, light and dark; scrolls inside the room). Full table: `TABLES-R7-b39202f.md`, last section.

### 4e. Control for Ambience / Mute: unfixed `49ea1de` :5305 (job 3, 10:23–10:26Z) — Ambience covered and tap not activated at 667×375; not at 375×667

`closecheck2.mjs` with the same flow on `49ea1de`, focus running and paused break, 667×375 and 375×667 @200 light, one run
each (`check4-close/ctl-49ea1de-5305/`, `TABLES-control-49ea1de.md`). Control zeros count only where the defect reproduced:
it did, at 667×375.

| Configuration | State | Ambience: rect · frames · centre hits · covered | Mute: rect · frames · centre hits · covered | Ambience taps (3 toasts; top / end) | Mute taps (3 toasts; top / end) | Panel controls in view: covered frames after 0.9 s · covered in the entry frames (frames seen) |
|---|---|---|---|---|---|---|
| 667×375 @200 % light | focus running | [482, 50, 599, 99] · 414 · 342 · **74** | [607, 52, 651, 96] · 414 · 414 · **0** | **activated** / **NOT activated** (centre hit: span:Recipe done: Take 2 full [TOAST]) | **activated** / **activated** | 0 settled · 1 in entry frames (1242 frames seen) |
| 667×375 @200 % light | paused break | [482, 50, 599, 99] · 755 · 398 · **361** | [607, 52, 651, 96] · 755 · 755 · **0** | **NOT activated** (centre hit: span:Recipe done: Take 2 full [TOAST]) / **NOT activated** (centre hit: span:Recipe done: Take 2 full [TOAST]) | **activated** / **activated** | 0 settled · 0 in entry frames (1167 frames seen) |
| 375×667 @200 % light | focus running | [194, 48, 311, 97] · 300 · 300 · **0** | [319, 50, 363, 94] · 300 · 300 · **0** | **activated** / **activated** | **activated** / **activated** | 0 settled · 0 in entry frames (900 frames seen) |
| 375×667 @200 % light | paused break | [194, 48, 311, 97] · 429 · 429 · **0** | [319, 50, 363, 94] · 429 · 429 · **0** | **activated** / **activated** | **activated** / **activated** | 0 settled · 0 in entry frames (681 frames seen) |

Per sub-run at 667×375 @200 light (centre hits / frames; covered = overlap or centre not hit): paused break, panel top · 3
toasts: **Ambience centre hit 1 of 181 frames, covered 180**, the hit being the "Recipe done" toast; panel end · 3 toasts:
**hit 5 of 182, covered 181**; focus running, panel end · 3 toasts: **hit 5 of 77, covered 74**; every 1-toast sub-run clear;
**Mute never covered**. Real touch taps on Ambience with 3 toasts up: **not activated** (the tap's centre hit-test was the
toast's `span`) in paused top, paused end and focus end; activated in focus top. At 375×667 @200 light the control's
Ambience and Mute are clear in every frame and all taps activate (the unfixed defect there is Close, 4a). R7 at the same
configurations: 0 covered, every tap activated (4c). The lead's own control run (`LEAD/runs/close-ctl5305`, 03:57Z) found the
same Ambience figures at 667×375 light paused (173 / 163 covered frames).

## Check 5 (relaunch). The probes the maker did not re-run on the final revision (GATE.md flags)

| GATE.md flag | What I did | Status |
|---|---|---|
| **M7b reach at 390×844 and 844×390** on the final revision | **Already covered by check 1a, not re-run.** 1a used M7b's unedited `reach.mjs` (sha256 `9d8ef06e…`, equal to M7b's `SHA256SUMS.txt`) on R7 `b39202f` :5301 at **390×844 and 844×390 (and 375×667), light and dark, 200 %, five states each (break, paused break, Break's over with / without a task, tap)**, with real wheel, CDP touch drag and Tab / Shift+Tab: **R7 0 failing of 30 runs, 0 control × method failures**; 390×844: 10 runs 0 failing, 844×390: 10 runs 0 failing (`check1-reach/TABLE.md`, `R7-reach.jsonl`, judged twice). Control INT 390×844 4/10 and 844×390 8/10 failing, reproduced the same session. One run per configuration per revision (M7b ran two). | covered (1 run each) |
| **M7a's toast / Close check at 390×844 dark and 667×375** | **Covered by check 4** (`closecheck2.mjs`, a superset of the lead's `closecheck.mjs`, itself the M7b toast check's flow plus Close taps): 390×844 @200 dark and 667×375 @200 light and dark, Break's over (Close), see 4b; paused break and focus running (Ambience, Mute), see 4c. In addition the unchanged M7b `toastcheck.mjs` (sha256 `3380304f…`, equal to M7b's `SHA256SUMS.txt`, the probe M7a re-ran on 375×667 light and 844×390 dark only) is re-run at those configurations: see 5a. | see 4b / 4c / 5a |
| **Ambience and Mute by touch** | **Covered by check 4c**: a real touch tap (CDP, `page.touchscreen.tap`; a mouse click at 1440) on each, 3 toasts up, panel top and end, focus running and paused break, every configuration. | see 4c |

### 5a. M7b `toastcheck.mjs`, unchanged, on R7 at the configurations M7a did not re-run

Probe copied unedited to `probes/m7b-toastcheck.mjs`; sha256 `3380304f…` equal to M7b's `probe/SHA256SUMS.txt`. `node toastcheck.mjs http://127.0.0.1:5301 R7 <out> <WxH> <theme>`, 200 %, one run per configuration, run in `runC2.sh` (job 2) at 10:20–10:24Z. Raw: `check4-close/m7b-toastcheck-unchanged/` (`toastcheck.log`, `R7-toastcheck.jsonl`, frames).

| Configuration | State | Panel | Toasts seen / raised | Close | Ambience | Mute | Panel controls |
|---|---|---|---|---|---|---|---|
| 390×844 dark @200 % | paused | top 0/137 | 1/1 | — | clear | clear | Skip break: clear; Resume break: clear; Start next brew: clear |
| 390×844 dark @200 % | paused | top 0/137 | 3/3 | — | clear | clear | Skip break: clear; Resume break: clear; Start next brew: clear |
| 390×844 dark @200 % | paused | bottom 137/137 | 1/1 | — | clear | clear | Skip break: clear; Resume break: clear; Start next brew: clear |
| 390×844 dark @200 % | paused | bottom 137/137 | 3/3 | — | clear | clear | Skip break: clear; Resume break: clear; Start next brew: clear |
| 390×844 dark @200 % | over-carried | top 0/126 | 1/1 | clear | — | — | Mark it done: clear; Put the kettle on: clear; That's all for now: off screen |
| 390×844 dark @200 % | over-carried | top 0/126 | 3/3 | clear | — | — | Mark it done: clear; Put the kettle on: clear; That's all for now: off screen |
| 390×844 dark @200 % | over-carried | bottom 126/126 | 1/1 | clear | — | — | Mark it done: clear; Put the kettle on: clear; That's all for now: clear |
| 390×844 dark @200 % | over-carried | bottom 126/126 | 3/3 | clear | — | — | Mark it done: clear; Put the kettle on: clear; That's all for now: clear |
| 667×375 light @200 % | paused | top 0/98 | 1/1 | — | clear | clear | Skip break: off screen; Resume break: off screen; Start next brew: off screen |
| 667×375 light @200 % | paused | top 0/98 | 3/3 | — | clear | clear | Skip break: off screen; Resume break: off screen; Start next brew: off screen |
| 667×375 light @200 % | paused | bottom 98/98 | 1/1 | — | clear | clear | Skip break: clear; Resume break: clear; Start next brew: clear |
| 667×375 light @200 % | paused | bottom 98/98 | 3/3 | — | clear | clear | Skip break: clear; Resume break: clear; Start next brew: clear |
| 667×375 light @200 % | over-carried | top 0/353 | 1/1 | clear | — | — | Mark it done: off screen; Put the kettle on: off screen; That's all for now: off screen |
| 667×375 light @200 % | over-carried | top 0/353 | 3/3 | clear | — | — | Mark it done: off screen; Put the kettle on: off screen; That's all for now: off screen |
| 667×375 light @200 % | over-carried | bottom 353/353 | 1/1 | clear | — | — | Mark it done: clear; Put the kettle on: clear; That's all for now: clear |
| 667×375 light @200 % | over-carried | bottom 353/353 | 1/3 | clear | — | — | Mark it done: clear; Put the kettle on: clear; That's all for now: clear |
| 667×375 dark @200 % | paused | top 0/98 | 1/1 | — | clear | clear | Skip break: off screen; Resume break: off screen; Start next brew: off screen |
| 667×375 dark @200 % | paused | top 0/98 | 3/3 | — | clear | clear | Skip break: off screen; Resume break: off screen; Start next brew: off screen |
| 667×375 dark @200 % | paused | bottom 98/98 | 1/1 | — | clear | clear | Skip break: clear; Resume break: clear; Start next brew: clear |
| 667×375 dark @200 % | paused | bottom 98/98 | 3/3 | — | clear | clear | Skip break: clear; Resume break: clear; Start next brew: clear |
| 667×375 dark @200 % | over-carried | top 0/353 | 1/1 | clear | — | — | Mark it done: off screen; Put the kettle on: off screen; That's all for now: off screen |
| 667×375 dark @200 % | over-carried | top 0/353 | 3/3 | clear | — | — | Mark it done: off screen; Put the kettle on: off screen; That's all for now: off screen |
| 667×375 dark @200 % | over-carried | bottom 353/353 | 1/1 | clear | — | — | Mark it done: clear; Put the kettle on: clear; That's all for now: clear |
| 667×375 dark @200 % | over-carried | bottom 353/353 | 1/3 | clear | — | — | Mark it done: clear; Put the kettle on: clear; That's all for now: clear |

24 rows (3 configurations × paused break / Break's over × panel top / bottom × 1 / 3 toasts); control-state values other than `clear` / `off screen`: **0**. `off screen` = the control is below the fold with the panel at its top (reached by scrolling; M7b's design), never covered. "Toasts seen / raised" below the number raised = toasts hidden above the screen (see 4d: 667×375 over-carried at the panel's bottom shows 1 of 3).

## Runs and failures per configuration

| Probe | Configurations | INT | R7 |
|---|---|---|---|
| `reach.mjs` (1a) | 3 sizes × 2 themes × 5 states @200 % | 30 runs / 22 failing | 30 runs / 0 failing |
| `pix.mjs` (1d, 3) | 21 jobs: home ×6, first ×3 + 1 real, RM flow + zen, flows ×7 (incl. BEFORE-day), real flows ×2 | 21 run, 0 errors | 21 run, 0 errors |
| `resid.mjs` (2) | 23 scenarios | 23 run (back-t200 invalid) | 23 run (back-t200 invalid) |
| `resid.mjs` view timing / footer / panel end (1a, 1c, 1d) | 14 scenarios | 14 run (footer 390×844 @100 % invalid) | 14 run (same) |
| `resid.mjs` flash (1d-2) | 2 sizes × 1 run | 2 run | 2 run |
| `a11y.spec.ts` "short screen" (15) | ×3, `--retries=0`, each revision's own spec | 3 run / 3 failed (D4 entry) | 3 run / 0 failed |
| **`closecheck2.mjs`, Close (4a, 4b)** | control `49ea1de` :5305: 375×667 @200 light, Break's over, 4 frame rows + 3 Close taps (4 contexts). R7: 8 configs @200 + 375×667 and 1440×900 @100 light, each 4 frame rows (panel top / end × 1 / 3 toasts) + 2 Close taps (3 contexts per configuration, 30) | **Close covered 166 of 168 frames** (end · 3), centre hit 4/168; **tap not activated** (hit the toast) in 1 of 3 taps | **0 covered of 7,166 frames, centre hit in all 7,166; 20 of 20 taps activated** |
| **`closecheck2.mjs`, Ambience / Mute (4c)** | R7: the same 10 configurations × focus running and paused break, 4 frame rows each + Mute tap and Ambience tap at panel top and end (20 contexts) | (control: see 4e) | **0 covered of 8,653 frames per control, centre hit in all; 40 of 40 Mute taps and 40 of 40 Ambience taps activated** (1 Ambience dialog still open 0.7 s after Escape, 4c) |
| M7b `toastcheck.mjs`, unchanged (5a) | 390×844 dark, 667×375 light and dark, paused break and Break's over × top / bottom × 1 / 3 toasts | — | 24 rows, 0 not `clear` / `off screen` |

## Not run / partial (never a pass)

Carried over from the first run:
- 1a: one run per configuration per revision (M7b ran two).
- 1c: 390×844 @100 % footer run invalid on both revisions (probe step).
- 1d: 1440 dark 09 and the reduced-motion step flow (09, 10) are frozen-clock artifacts and not counted; the real-clock
  checks replace them for the reduced-motion flow at 390×844 only.
- 2: item 10 not settled (frame starvation at 1440); item 19 at 200 % not run validly; one run per scenario.
- Everything: SwiftShader on 4 shared CPUs, CDP touch, synthetic wheel notches, `html{font-size}` for large text; no real
  devices, no assistive technology, Chromium only.

Changed or added at the relaunch:
- **1d-2: now covered** (rows of 04:46Z), 100 % light at 390×844 and 375×667, one run per revision. **Not run:** 200 %,
  reduced motion, Break's over with toasts, the shade's painted alpha per frame.
- **Check 4, Close (Break's over): covered** for the requested 10 configurations, R7, one run per configuration per state
  and position (panel top and end by real wheel), 1 and 3 toasts; **real taps** with 3 toasts at panel top and end only (a
  1-toast tap on R7 not run; control only). **Scroll by touch drag not run** (wheel only; the lead's probe supports it, I did
  not run it); Break's over **without** a carried task not run in this check; toasts only via the app's `toast()` with
  `duration: 8000` (labelled setup), not by real events, and never with the page's own save-failed banner.
- **Check 4, control: partly covered.** Control runs: **Close at 375×667 @200 light** (as asked; Break's over, 4a) and **Ambience /
  Mute at 667×375 and 375×667 @200 light** (focus and paused break, 4e).  No control in dark, at 390×844, at 844×390 for
  Ambience / Mute, or at 100 %; the control for the toast-visibility observation (4d) is the lead's row (667×375 light)  (my own Break's over control at 667×375 / 844×390 was queued as `runC4.sh` at 10:29Z, sat behind five waiting lead jobs, and I cancelled it at 10:32Z before it started: **not run**).
- **Check 4, Ambience / Mute: covered** on R7 in focus running and paused break; the control pairing is the lead's
  `close-ctl5305` data plus 4e. Focus state: zen kept awake by a real pointer move; the zen-faded top bar (non-interactive by
  design) was not tested. A frame-density caveat applies at 844×390 @200 (4c).
- **One Ambience row (1440×900 @100 focus, panel "end"): the dialog was still open 0.7 s after a real Escape**; not investigated
  (its activation is what the check judges; it was the context's last step).
- **Check 5:** M7b reach at 390×844 and 844×390 covered by 1a (not re-run: one run per configuration); M7a toast / Close
  check at 390×844 dark and 667×375 covered by Check 4 and the unchanged M7b `toastcheck.mjs`, one run each.
- `spec15.sh`: ran in the first session; M7b's `tests/break-reach.spec.ts`: see the spec section above.

## 1d-2. Real-clock shade band after the view enters (100 %) — DONE (rows landed at 04:46Z; used here, not re-run)

Written at the relaunch (09:43Z+). The earlier close of this receipt said "not run (slot)"; the `resid3` job had in fact
been given its slot at 04:45:58Z and finished at 04:46:59Z (`check2-residuals/resid3-flash/resid3.log`, rows
`resid3.jsonl`, `…/resid.jsonl` in scratch), minutes before the previous instance stopped. Those rows are used as they
are (not re-run). `resid.mjs` `flash-390x844` / `flash-375x667`: newbie seed, real clock, 100 % text, light,
fresh context per revision, INT then R7; per animation frame the session panel's scroll range (`scrollHeight −
clientHeight`) and `overflow-y`, from a real Tea-time click and from `finish()` (Break's over), 1.6 s each. One run per
revision per size. R7's panel is `overflow: hidden auto` with the bottom shade; INT's is `overflow: visible`.

| Size | Rev | After the real Tea-time click: frames with range > 0 (of frames in 1.6 s) · first–last ms after the click · max range · overflow-y | After `finish()` (Break's over): same |
|---|---|---|---|
| 390×844 | INT | 8 of 116 · 512–695 ms · 12 px · visible | 12 of 95 · 209–393 ms · 14 px · visible |
| 390×844 | **R7** | 2 of 112 · 655–833 ms · 12 px · auto | 9 of 68 · 303–595 ms · 14 px · auto |
| 375×667 | INT | 8 of 111 · 465–613 ms · 12 px · visible | 10 of 96 · 199–348 ms · 14 px · visible |
| 375×667 | **R7** | 9 of 107 · 518–664 ms · 12 px · auto | 11 of 93 · 229–389 ms · 14 px · auto |

Reading: the 12 / 14 px range exists only on the first painted frames of the entering view (the 0.35 s ease-out
translate of `FocusScreen.tsx` l.389 / l.351); INT has the same range for the same time, and its panel does not clip or
shade it. On R7, where the panel is `auto`, the shade can show only in those frames: 2–11 rAF frames within a window of
0.15–0.29 s (R7 390×844: 178 ms after Tea time, 292 ms after `finish()`; 375×667: 146 ms and 160 ms), ending by 0.83 s
after the Tea-time click and by 0.60 s after `finish()`. It starts at the view's first painted frame, on a view that is
itself fading in. At 1.6 s after the click the real-clock shots are **0 px apart** at 390×844 and 327 px (21 > 24) at
375×667, the kettle's animated steam wisp, not the panel's bottom
(`check2-residuals/resid3-flash/{INT,R7}-flash-*-break-1.6s.jpg`; counts on the PNGs, `flashpair/diff`). So the band
seen in the frozen-clock pairs (1d-1) is a transient of the first ~0.3 s of the entrance; **not measured:** the shade's
painted alpha frame by frame, 200 % text, reduced motion (the views enter by opacity only there, by code, so no range
is expected), and Break's over with toasts.

## spec15.sh and the break-reach spec (relaunch note)

- **`spec15.sh` is not a never-run item: it ran in the first session, 04:04:09–04:17:39Z** (`resid2.log`, `spec/run.log`; its
  rows are in `check2-residuals/`). It runs the footer / panel-end group of `resid.mjs`, then item 15: `a11y.spec.ts` "short screen
  (375×667)" × 3 per revision, `--retries=0`, each revision's own spec — **R7 3 passed / 3, INT 3 failed / 3** (the D4 entry on a
  toast). Results are in 1c and in the item-15 row, unchanged. It does not run M7b's `tests/break-reach.spec.ts`.
- **M7b's `tests/break-reach.spec.ts` on R7 (run at the relaunch, the lead's "break-reach spec run")**: `KETTLE_PORT=5301 npx
  playwright test --project=chromium tests/break-reach.spec.ts --workers=1 --retries=0` in `/home/user/wt/rv7-r7/kettle`, one
  Chromium, slot job `runC3.sh` 10:26:43–10:28:59Z: **7 passed (2.2 m)**. The tests: Break's over with a carried task at 200 % text
  375×667 light, 390×844 dark and 844×390 light (Mark it done, Put the kettle on, That's all for now reachable by wheel, touch
  and Tab); the paused break at 375×667 dark and 844×390 dark (Skip, Resume, Start next brew); tapping Pause break leaves Resume
  under the finger at 375×667; at 100 % text 375×667 and 390×844 the break and Break's over fit with every control wholly on
  screen. Log `check4-close/logs/R7-break-reach-spec.log`. Not run on INT (the maker's own figure, not mine: 6 of 7 fail on
  `51521cf`, `LEAD/PREP-NOTES.md`). One run. I grepped the spec for `scrollIntoView` / `scrollTo` / `scrollBy` / `scrollTop =`: the only hits are its own header
  comment saying it uses none.

## Wall clock

- **First instance:** start 2026-10-11T03:23:56Z; stopped at about 04:50Z (usage limit). Model Claude Opus 5.5.
- **Relaunch (this receipt's additions):** start **2026-10-11T09:43:11Z**; end **2026-10-11T10:32:14Z**; budget 75 min (to 10:58Z).
  Model Claude Sonnet 5.5 (`claude-sonnet-5-5`), effort not inspectable.
- Browser time at the relaunch (one slot each): `runC1.sh` 09:49:08–10:04:16Z, `runC2.sh` 10:06:18–10:23:50Z, `runC3.sh`
  10:23:51–10:28:59Z, `runC4.sh` queued 10:29:35Z and cancelled at about 10:32Z before it started (no browser). Idle waits: 09:43–09:49Z for the lead's exclusive run and my first slot; 10:04–10:06Z
  for the second slot.
- Nothing was edited in app code, tests or maker files; nothing committed or pushed; the orchestrator's servers were not
  stopped or restarted. New probe files only in `/home/user/wt/rv7-r7/kettle/.tmp/C/` (copies in `probes/`).
