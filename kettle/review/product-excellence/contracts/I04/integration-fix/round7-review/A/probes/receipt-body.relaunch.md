
### Item 5 (relaunch) — the banner after "Mark done" at 200 % text (summary; per-run rows in section 6 and `A/tables.md`)

@@ITEM5SUMMARY@@

## 1. What was observed (facts only; no verdict)

1. **R5-D1 on R7 (check 1):** 0 failures in @@R7N@@ R7 runs (all from the first instance except @@R7NEW@@). In every R7 run the warning was the in-page banner
   (`section[data-save-warning]`), added once and never removed, at full opacity, never moved within the page
   (top + scrollY constant), Save backup always inside the banner and never clipped, and at most one live-region addition
   with the warning's text. The control reproduced the defect in this session with wheel at 375×667 light and dark
   (strict mechanism: an older toast left while the list was scrolled, and within 78 ms / 46 ms the warning's box was
   drawn below its room — over the docked start by up to 8 / 61 px — and M1's rule took it away and re-showed it). At
   844×390 the probe's own judge failed R5 in 4/15 (wheel) and 3/15 (touch) runs, but those events were not linked to
   an older toast leaving while scrolled (they happen at rest or during the wheel-up, partly inside the re-show entry);
   with touch at 375×667 the control never reproduced in 15 + 15 runs.
2. **LEAD-D1 on R7 (check 2):** in every valid R7 run the banner was added exactly once and never removed, at opacity 1
   in every frame, at one constant page position, Save backup never cut off, no toast drawn over it, and exactly
   **one** live-region addition with the warning's text (the banner's own announcer `#kettle-save-warning-said`). The
   control looped in every configuration (9–11 add/remove cycles in 7 s for case 1, 24–28 in 11 s for case 2, each one
   a new live-region addition).
3. **Banner visibility after the real tap (asked):** in **every** R7 LEAD-D1 run the banner was **never in view** in any
   frame of the 7 s (case 1) / 11 s (case 2) window after the tap. It was added above the viewport, and the page
   scrolled down by 290–352 px at that moment (scrollY e.g. 1100 → 1452 at 375×667 @200 %, 169 → 475 at 844×390
   @200 %) while the composer field stayed where it was (field top constant within 1 px), so the banner ended **167–518
   px above the top of the view** (bottom edge; its top at −443 to −851). The only visible feedback in that window was
   "Crossed off. Nice work. · Undo" (screenshot `runs/leadd1-case1-r7/b39202f-375x667-t200-light-t1.3.png`). The one
   polite announcement did happen (1 per run). This matches M7a's disclosed trade-off (lead point 2); on e866118 the
   warning toast was in view but looped.
4. **Earlier M2 defects (check 3):** D1, D2, R2-D1 fail on INT and pass on R7 (statusbar spec); D4 fails on INT
   at 390×844 and at 375×667 (the latter run alone in the relaunch, 10:42 UTC) and passes on R7 (a11y spec); the
   warning-readability probe (D3 / R2-D3 / R4-D1 shapes) fails on INT in all 5 configurations run (375×667 light and
   dark, 390×844 light, 844×390 light, and, in the relaunch, 667×375 dark) and passes on R7 in the 5 wheel
   configurations (the last two in the relaunch); no touch run on either. R4-D2's test passes on both (no control).
5. **Banner entry frames (descriptive):** in `readwarn` the banner's first 2–3 frames after End are at opacity 0
   (131–184 ms: Today's incoming route layer fading in; the banner arrives with the page, it has no animation of its own).
   The R5-D1 judge starts 1.2 s after the first addition, as in M7a's and L1's probes.

@@ITEM5FACTS@@

## 2. Method

- **Browser gate:** every browser launch went through `python3 -I …/round7-review/tools/slots.py run --lane A --n 1 -- …`
  (one Chromium, or one Playwright worker, per call). From 03:58 UTC the gate was fair-share (one Lane A job at a time
  while another lane waited); Lane A ran nothing between 03:59:44 and 04:27:05 while waiting, then ran the clips and the keyboard run until 04:55:22. The relaunch (09:43 UTC) waited for the lead's exclusive `LEAD` entry to leave the gate, then queued one job at a time (smoke 09:48, then item 5 and the leftovers in bundles of 1–6 runs); at times the gate held B, C, D, Dcap and LEAD jobs ahead of Lane A (waits of 16–18 min).
- **Isolation:** a new Playwright context (empty, disposable profile) for every run; one Chromium per probe process.
  Phones `isMobile`, touch, DPR 2; SwiftShader; large text `html{font-size:150%|200%!important}` injected at
  DOMContentLoaded.
- **Real input only:** `page.mouse.wheel` (40 px notches to the oldest toast, 20 px back), CDP `Input.dispatchTouchEvent`
  drags (60 px / 30 px, finger lifted after 60 ms still), `page.touchscreen.tap` / `page.mouse.click`, `page.keyboard`
  (Tab, Enter) in the keyboard variant. No `scrollIntoView` / `scrollTo` / `scrollBy` / `scrollTop` writes, no
  synthetic `pointerenter`, nothing held, no timer changes. Toasts expire on their real timers (3.2 s; 5 s with an action).
- **Debug API = setup only** (labelled in each probe): newbie seed and one leaf below a level-up (check 1, readwarn),
  `localStorage` filled until `QuotaExceededError` (verified), `startFocus`, `ff`, `timer.end('user')`; LEAD-D1 case 2 raises
  the update prompt (`id 'pwa-update'`, `duration: Infinity`, action "Update", PwaUpdatePrompt's options) through the
  app's own `toast()`.
- **Control first:** each control series ran before the R7 series of the same configuration (timestamps in
  `runs/series.log`).
- **Live-region count:** every addition (child or text) inside any `[aria-live]` (not off), `role=status` or
  `role=alert` whose text matches the warning (`storage is full|couldn’t save your latest`).

### Probes (copies; originals untouched; diffs in `probes/`)

| File | sha256 | From | What differs |
|---|---|---|---|
| `natural-a.mjs` | `ef67f8a342776dd5c443dcee0345fdb97fc480fb8fd61c823c80c4c391c99e4a` | M7a `natural-b.mjs` (`4127f8005d928212426abab1ab447071c91714811fd9e8bf7fc65128281afb6d`) | GESTURE=wheel (original path) / touch (CDP drags); STOP_ON_FAIL; VIDEO; per-run UTC, loadavg, URL, gesture window, expiry class, list scrolled, older toast left while scrolled. Used for 1 control run only (superseded). |
| `natural-a2.mjs` | `8900b49e78c4225dab08521244dcc9be49ac12a4f8c9762daed572563fbb50bb` | `natural-a.mjs` | + strict R5-D1 classification (bad toast frame outside the entry phase within 1000 ms after an older toast left while the list was scrolled); STOP_ON_FAIL stops on the strict class. Judgement of the probe itself unchanged. All check-1 control and R7 series. |
| `natural-a3.mjs` | `adbfd139af2f97ba89fa941a703ebf549a5f534dbe162fde6015a44912fd3c8e` | `natural-a2.mjs` | + PRE delay (pointer off the stack, toasts expire before the gesture). Timing variant only. |
| `markdone-a.mjs` | `b8ab00dddf247d588e0f948fd71bcebc4620521eec243762084ed8beddcc7ad4` | LEAD `markdone.mjs` (`50f2593d60080f7c240a4d20eaa8bde0af1365df95b8fa4f56a9e5b70cd067ad`) | counts every live-region addition with the warning text; UTC/loadavg; banner position after the tap. Case-1 control with clips. |
| `markdone-a2.mjs` | `3f20ca7f7042d9dbba53aa5ea5aa28fcd280150a857198fa7d58f02e1b45dad7` | `markdone-a.mjs` | + Save backup inside the banner and not clipped, per frame (`saveBackupCutFrames`). Case-1 control (again), case-2 control, all R7 LEAD-D1 tap runs. |
| `markdone-a3.mjs` | `24981c7298ddc649baccc3fd47afe2745c1567fc713634aebf4cd23cfbbfd928` | `markdone-a2.mjs` | + KEY=1: Mark done reached by real Tab and activated by real Enter (844×390 @200 % case 2, where no tap can avoid the update toast). |
| `markdone-a4.mjs` (relaunch) | `561523f79e538f1b774c8514a88fa02b8273ab14ca1d4d2d76e8a6019b223e7e` (an earlier smoke used `60623337…`, before the document-height fields) | `markdone-a3.mjs` (diff: `probes/markdone-a4-vs-a3.diff`) | item 5. SETUP=a (storage filled just before the tap) or SETUP=b (storage filled before End, banner already on Today; recorder from before End; real touch drags from the top of Today, then a real tap). Per frame: `document.scrollingElement.scrollTop`, document height, banner rect (and warning-toast rect), Mark done rect, scrollTop of scrollable ancestors, `visualViewport.scale`; events: every scroll event with its scrollTop, `pointerdown`/`click`, banner/toast add/remove; **every** addition to any live region with its full exact text. Series `runs/markdone-cases/{r7-setupb,r7-setupa,int-setupa}`; analysis `probes/analyze_cases.py`. |
| `readwarn.mjs` | `71d1b5b7e1cc14cb4c389de14ee476faf8fc6d6d708578edd80c34bb04d5782a` | new (setup copied from `natural-b`) | warning readability at large text, either presenter |
| `lib.mjs` | `73573546a7469dc1dc1026a043b53f9cd61f8326dce164ce34f0f358ff5eb861` | M7a / L1 (unchanged) | — |
| specs | `statusbar.spec.ts` `d9df7f5b2240d51d564cd5f74a9dc820bd46fc09f199c9e4d42de2dbd3050bc3`, `toast-room.spec.ts` `206d6f77f27655fb31c279423deaaabbc6a0f007158afcaaa8bbc3877c45c0c5`, `a11y.spec.ts` `9a0508260c2f335f3585c6d424c34775dcad65ffce7b0d3c538cffd5d3aa4895` | repo at `b39202f`, unedited | run with `KETTLE_PORT=5301` (R7) or `5303` (INT), `KETTLE_PWA_PORT=5312 npx playwright test --project=chromium <spec> --workers=1 --output <scratch>` (one `-g` run for the INT D4 tests) |

## 3. Deviations, cancellations, invalid runs

- **First R5-D1 control run** (`r5d1-wheel-ctl-375L-firstrun-natural-a`, 03:28): probe FAIL from a single frame 9 px below
  the room with the list unscrolled (not R5-D1's mechanism); `natural-a` stopped there. I added the strict class
  (`natural-a2`) and re-ran the control series; the first run is kept, labelled, and not counted as a reproduction.
- **LEAD-D1 case 2 at 844×390 @200 % by tap is impossible on both revisions**: the endless update toast covers the whole
  strip above the docked start, so Mark done is never clear of it (the view loop ends with Mark done at y −17, the tap
  hits nothing, no warning). Both such runs are marked INVALID and not counted. The configuration was covered instead by
  the keyboard variant (`markdone-a3`, KEY=1).
- **Cancelled at 04:07 UTC** (fair-share gate; coordinator's priority to R5-D1/LEAD-D1 controls and R7 runs): LEAD-D1
  case-2 2nd/3rd repetitions (so case 2 has 1 R7 run per configuration), the readwarn remainder (R7 844×390 wheel,
  667×375 both revisions, every touch run; **in the relaunch** R7 844×390 wheel and 667×375 dark wheel (INT first) were run, touch was not),
  the PRE timing variant remainder (844×390, 375×667 dark, touch).
- **Cancelled at 04:21 UTC** (no Lane A slot since 03:59:44): R7 touch 375×667 dark (10 runs; its zeros would not
  have counted, the touch control was not established there) and the R7 touch clips.
- **Clips:** @@CLIPNOTE@@
- **Relaunch (09:43 UTC):** the first instance's results are kept unchanged and nothing completed was rerun. The queued/partial items were finished as the gate allowed (see the coverage table). Not run in the relaunch: @@NOTRUN@@. A smoke run of `markdone-a4` (844×390 @200 light, setup b then a, R7; `runs/markdone-cases/smoke-r7-a`, `…/smoke-r7-b`, 09:48–09:49 UTC, probe sha256 `60623337…`, before document-height fields were added) is kept for the record and **not counted**; the PNGs of `smoke-r7-b` were deleted by me (the jsonl and stdout are kept).

## 4. Counting (which zeros count)

- A probe's R7 zeros count for a configuration only if the **same probe** reproduced its defect **on its control in this
  session, earlier**. Two levels are reported for R5-D1: the probe's own judge (warning taken away / faded, or its box
  below its room, after the entry window — the criterion M7a's packet and the orchestrator's 1–2-in-10 rate refer to)
  and the strict R5-D1 mechanism (CHECKER-r5: an older toast leaving while the list is scrolled puts the warning below
  its room; bad frames within 1 s after such a departure, outside the entry phase as L1 r6 defined it). A wider link
  (departure within 1.5 s after the list was scrolled) gives the same answer except 375×667 dark wheel (2 instead of 1).
- **Check 1 zeros that count:** wheel 375×667 light (both levels), wheel 375×667 dark (both levels); wheel 844×390 and
  touch 844×390 at the probe-judge level only. **Do not count:** touch 375×667 light and dark (control not established
  in 15 runs each), the timing variant (no control possible).
- **Check 2 zeros that count:** every R7 tap run at 375×667 @200 light/dark and 667×375 @150 (cases 1 and 2), 844×390
  @200 case 1, and the 844×390 @200 keyboard case 2 (control 28/27 reproduced; R7 1 run). **Item 5 zeros:** setup a counts where the control reproduced the defect in this session at the same kind of probe (e866118 looped the warning toast in `markdone-a`/`markdone-a2`/`markdone-a3`); `markdone-a4` itself was not run on e866118, only on INT (:5303, 0d58c5e) as the comparison asked for. Setup b has no defect to reproduce on a control (it asks where the banner is and whether the tap scrolls): its results are descriptive.
- **Check 3 zeros that count:** D1, D2, R2-D1 (statusbar spec), D4 at 390×844 and, since the relaunch, at 375×667 (a11y spec; INT failed both),
  readwarn at 375×667 light and dark, 390×844 light, 844×390 light and 667×375 dark (wheel; INT failed each in this session). **Do not count:** R4-D2 (INT passes; no control), toast-room spec (no control).

## 5. BLOCKED / UNKNOWN (never pass)

Real phones and touch hardware (touch is CDP touch under mobile emulation); real wheel notch sizes; real OS text size
(200 % is `html{font-size:200%}`); real assistive technology (announcements counted as DOM live-region mutations only, not
heard); WebKit / Firefox; GPU timing (SwiftShader on 4 shared CPUs with other lanes running, load 9–15).
