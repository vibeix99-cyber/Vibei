# Round 8 · LEAD notes (written as I go)

Lead Checker, newly launched for round 8 (built nothing in rounds 7–8). Model Claude Opus 5.5. No app/test/maker edits, no commits.

## 0. Revision (18:07 UTC)
- `/home/user/wt/r8-trial`: HEAD `9ff0d04884ff71cd58aafd173d023b7081b702fb`, `HEAD:kettle/src` = `42e106daaf0628ee8429fb6131ab29848931f367`.
  Parents `61a60b2` (integration) + `2c3172c` (packet). `2c3172c:kettle/src` = `f3c9357:kettle/src` = `42e106d`.
- `git diff --stat b39202f 9ff0d04 -- kettle ':!kettle/review'` = the same 5 files as `7ba0d98..2c3172c`. Nothing else differs
  from the round-7 trial merge outside review files.
- Maker's probe hashes: `sha256sum -c probe/SHA256SUMS` all OK (incl. toastroom2 `7123da04`, closecheck2 `863c0a92`).
- Note: the maker's own trial merge was `1c972f9` (of `f3c9357`); the gate's R8 `9ff0d04` (of `2c3172c`) has the same src tree.

## 1. Diff review (read in full)
- `Toast.tsx`: dock (`toastDock`: `[data-toast-dock]` with computed `--toast-dock: on`, not under aria-hidden/inert, ≥56 px
  each way, no control from CONTROLS intersecting, re-checked on every measure); `stackHeight` (scrollHeight per li + gaps +
  list padding-bottom); `topBarBottom` (leaf text of a page-level header over the toasts' column + 24); `foldToFit` (clears and
  re-sets `data-folded`, oldest first, until it fits); `useToastRoom` measures on mount, 250 ms, resize, **every scroll
  (window capture, flushSync)**, and **every stack change (layout effect)**; docks only when the room above the controls is
  < stack / < 56 / ≤ 4 em AND the dock is taller than the room; stays docked while toasts are up and the dock exists.
  `toastLiftBottom()` and MIN_ROOM_PX fallback unchanged. Undocked path identical except re-measure triggers.
- CSS: appended only. Fold = icon `display:none` + message 1-line clamp. Dock padding 0 8px.
- `FocusScreen`: `data-toast-dock` on `.stageBox`; `--toast-dock: on` in `@media (min-aspect-ratio: 5/4) and (min-width: 560px)`,
  which ALSO matches tablets and desktop 1440×900 and the summary view. Stage = aria-hidden illustration (Stage.tsx l.83), no
  text, no controls.
- Spec: appended 1 test × 2 rows; existing tests untouched.

## 2. Maker evidence audited so far
- geom (portrait 32/32 identical) re-read from raw jsonl: at 375×667 @200 **end n3**, on BOTH b39202f and f3c9357:
  "Marked “Chapter 3 notes” done · Undo" 146 px box, **86 visible, actHit False**; "Cozy level 5!" 0 visible. Room [78, 317].
  At top n3 all whole. 390×844 @200 all whole. → disclosure 5 hides an action toast's action at 375×667 @200 end. Needs INT
  comparison + check whether real input on the stack reveals it (my dockcheck).
- geom-desktop 12/12 identical; 1440 @200 not docked, toasts whole.
- Captures opened at full size: 667×375 L end-n1 BEFORE (sliver behind "Next: brew 2 of") / AFTER (whole over stage, Update
  visible); 667×375 L end-n3 BEFORE (nothing but a sliver) / AFTER (three folded toasts over the stage, Update + Undo visible,
  Cozy folded with no icon); 375×667 L end-n3 AFTER (Undo toast cut at the room's bottom, Undo button not visible).

## 3. Control reproduction this session (LEAD, toastroom2 sha 7123da04, `runs/toastroom2/`, 18:22–18:23 UTC)
- b39202f :5301 667×375 @200 light: top 146/146 Update on top; **end 52 box / 11 visible, Update NOT on top, over "Next: brew 2 of"**; back 146/146.
- b39202f :5301 844×390 @200 dark: top 146/146; **end 52 / 26, NOT on top, over "Next: brew 2 of"**; back 146/146.
- → R7-D1 REPRODUCED by me. (Lane 1 also reproduced it at 18:08–18:10, `L1/runs/c1-control-*`.)
- R8 :5306 667×375 @200 light: top 146/146; end **186/186 on top, no bar words**; back at top 186/186 (docked, stays docked).

## 4. Page "navigations" (disclosure 4) — evidence so far
- Maker: 1 in f3c9357 (844 @200 dark wheel), **3** in superseded 23c781b (667 @200 light touch; 667 @150 dark wheel;
  844 @100 dark wheel) — the packet says "two" (one in 23c781b, one in f3c9357): undercount.
- Lane 1 on R8 :5306: 844 @200 dark wheel (twice incl. diag run) and 844 @200 light wheel; 0 on b39202f (few runs).
- grep of round-6/7 evidence: the string "Execution context was destroyed" occurs nowhere → never seen before round 8.
- App has no full-navigation path in dev (only `pwa/register.ts` location.reload via a real SW update; no SW in dev).
  `href`s are hash links only. R8 dev server config: `hmr:false, watch:null` (`/home/user/wt/r8-trial/kettle/.tmp/rv7.vite.config.ts`)
  → not an HMR file-change reload.
- Lane 1's diag (accept-diag) recorded no navrequest / framenavigated after the hash changes, but the row is written right
  after the error, so late events may be missing. Cause UNKNOWN so far.
- `/tmp/rv7-servers/dev-r8.log`: **38 "[Unhandled error] ResizeObserver loop completed with undelivered notifications"**
  forwarded by the vite 8 client since 18:17:56; **0 in every other server log** (:5301–:5305). But Lane 2 runs the whole
  chromium suite against :5306 too (KETTLE_PORT=5306), so attribution is open. App ROs: SegmentedControl, StatusBar,
  chart-kit, NookScene (none in focus/toast code). Added a window-error counter to my dockcheck (sha 62e98fbe) to attribute.

## 5. toastroom2 complete (18:22:32–18:26:09 UTC, load 12–15)
| rev | config | top | end | back at top |
|---|---|---|---|---|
| b39202f | 667×375 @200 L | 146/146 on top | **52/11 NOT on top, over "Next: brew 2 of"** | 146/146 |
| b39202f | 844×390 @200 D | 146/146 | **52/26 NOT on top, over bar** | 146/146 |
| R8 | 667×375 @200 L / D | 146/146 on top (room [90,257]) | **186/186 on top, docked [155,363], no bar words** | 186/186 docked |
| R8 | 844×390 @200 L / D | 146/146 on top | **146/146 on top, docked [211,378]** | 146/146 docked |
| R8 arrive | 667 L / 844 D | Recipe 97/97, Cozy 57/57 (844 D: 56/57 entry spring, as on b39202f) | 667 L after wheel: Recipe 167/167 docked; Cozy 53/47 (leaving: 3.2 s timer ran out during the wheel) | — |
| INT | 667×375 L / 844×390 D | 97/97 on top (panel cannot scroll: 0/353, 0/338) | same | same |
Frames opened at full size: R8 844 D end (whole over the stage, Update visible, top bar clear); b39202f 844 D end
(sliver behind "Next: brew 2 of"); R8 667 L arrive end (toasts gone by the shot).

## 6. Lane 2 chromium (pre-audit of raw JSON `scratchpad/r8/L2/pw-chromium.json`)
- 73 expected, **1 unexpected**: `statusbar.spec.ts:106` "large text with large leaf totals never pushes Level NN past the
  screen (dark)": `page.evaluate: TypeError: Cannot read properties of null (reading 'children')`. Today/status bar code is
  untouched by round 8 (Toast.tsx runs there). Lane 2 is rerunning it. To check: is it the same unexplained navigation?

## 7. dockcheck (own probe, sha 62e98fbe; `runs/dockcheck/`), R8 "over" rows (18:26–18:28 UTC)
- 375×667 @200 L (portrait, no dock): update 146/146 act at top/end/back; top n3 all whole; end n1 whole. **A REAL tap on
  "Mark it done" at the end raises NO toast** (live-region li count unchanged); the panel's range drops 236 → 81 and the
  room grows to [78, 421]; update + Cozy then whole. → In the real app the only action toast on Break's over is the update
  prompt (app action toasts: ShellOverlays Update; History/DataSection/Composer Undo live on other screens).
- 667×375 @100 L: n1 room [8,166], update 52 px over "Chapter 3 notes" (D4, r6 #9); **n2 → DOCKED** over the stage
  [12,12,315,363], under-text none; n3 docked, whole; end/back docked whole. Undo/Update real taps activated.
- 667×375 @200 L: n1 room [8,257] (146 whole, under "Break’s over" title = D4); **n2 docked** (186+57 whole); **n3 all
  three folded** (105/57/105, icons hidden, 1-line clamp, Update + Undo on top); real Mark-it-done at the end worked with
  docked toasts up; back at top docked 186 whole. Under-text none in every docked sample.
- 1440×900 @200 L: **never docked**; all whole; same rects as M8's geom-desktop.
- 844×390 @100 L: **"Execution context was destroyed"** after "top n2" (docked) — 4th independent occurrence in this
  session on R8 (Lane 1 ×3). navs counter = 4 (hash changes only; a reload event may arrive after the row is written).
- live region: li additions = toasts raised; text 0; other 0 in every sample → docking/folding adds no announcements.
- window errors in my pages: {} (no ResizeObserver loop errors). dev-r8.log's 38 RO errors are all 18:17:56–18:22:35,
  i.e. during Lane 2's chromium run against :5306 (ended 18:23:07); none since → test-suite pages (statusbar resizes), not
  the toast code. 
- INT 375×667 @200 L over: panel cannot scroll (0/236); Mark it done hit-testable (real tap worked); toasts whole
  (update 178 px) BUT at top n3 the stack reaches y 42 and **covers Close** (underCtl ['Close']), and over "Break’s over".
  → disclosure 5's INT counterpart hides a control; R8 keeps Close clear and the update prompt whole/actionable; only
  older plain toasts scroll inside the stack (r6 #5 / D3 class). Leaning FOLLOW-UP.
- Lane 1 l1dock raw (pre-audit): ctlBad 0 in all 4 R8 rows; toastBad frames are "Cozy level 5!" partly visible (3–42 of
  57 px) 100–720 ms after an event (entry / dock transition); 17 "settled" frames at 667 L touch (613–663 ms). Two
  "Update absent" taps in wheel rows (synthetic 'pwa-update' toast gone — possibly ShellOverlays' PwaUpdatePrompt
  dismissing id 'pwa-update' when its deps change; to confirm from Lane 1's receipt).
- INT 667×375 @100 L over: toasts at [54..226] over the panel; **"Mark it done" under a toast in every sample** (underCtl).
  → disclosure 1 (dock at 100 %) is strictly better than INT (R8: nothing under the docked stack).
- INT 667×375 @200 L over: panel cannot scroll; "Mark it done" off screen (real tap impossible; Undo toast raised by
  toast()); n3: update prompt **88 of 97 px, region top −9, over "Next: brew 2 of 4"**. → R8's fold (all 3 folded, whole,
  actions on top, no bar words) is not worse than INT's 3-toast state.
- Lane 2 JSON: integrity (all incl. :768, :1090 ×3), toast-room (incl. new :427 ×2), break-reach, a11y all passed.
- Frames opened (full size): R8 667×375 @100 top n1 — one toast undocked, centred over "Ready for another brew of
  Chapter 3 notes?" (D4 placement, r6 #9 ACCEPTED, as b39202f); top n3 — three toasts docked over the stage, whole,
  Update/Undo visible, panel and top bar fully clear. Suggestion (not a defect): in landscape the dock could take a single
  toast too, which would also clear r6 #9.
- b39202f 375×667 @200 L over: every sample identical to R8 (rects, clips, under-text) → portrait unchanged (my run).
- b39202f 667×375 @100 L over: n2 over the "Break’s over" title; **n3: update prompt over the top bar's "Next: brew 2 of 4",
  Cozy 38/52 px** (region [8,166]). R8 same state: docked, whole, nothing under. → disclosure 1 = improvement over both
  b39202f and INT.
- Lane 1 receipt (in progress) 1.3/1.5: R8 0 covered-control frames in 3,732 (+3,483) frames; transient "Cozy level 5!"
  (no action) clipped 25–33/57 px for ≤ 0.5 s (≤ 663 ms under load) while the docked stack re-lays out after a 4th toast
  arrives and the cap drops one; no action toast ever not whole. Lane 1 1.6: page loss 3 of 8 R8 runs at 844×390 @200
  wheel; no navrequest / framenavigated / console / crash logged; control 0 of 2 (diag2).
- Memory: 16 GB, 12.8 GB available, PSI memory 0, `oom_kill 0` → not the OOM killer.

## 8. Sheet over a docked stack (dockcheck "sheet", Tea break running, 3 toasts, REAL tap on Ambience)
- R8 667×375 @200 L: before: docked, all 3 folded, whole. **Sheet open: the stack leaves the dock** (the sheet's controls
  now intersect the stage box) and returns to the old room [8,257] — **drawn above the sheet**, over its title
  "Ambience", "Tap to listen…", "Rain"; the Undo toast cut at the room's clip (96/146, Undo not on top). Frame opened
  (`9ff0d04-667x375-t200-light-sheet-sheet_open.jpg`). Per-frame (26 frames in 1.6 s, load ≈ 15): dialog buttons Rain /
  Fireside not centre-hit in 14 frames (hit something else, no painted-toast overlap → sheet entry motion), docked
  while the dialog was up for 8 frames (≤ 211 ms after the tap).
- Sheet closed (Escape, +800 ms): docked again; a toast rect still outside the dock and Undo not on top → mid-animation.
- Needs the b39202f sheet row to classify (the old room is the same; b39202f's stack was never docked).
- b39202f 667×375 @200 L sheet: **"sheet open" sample identical to R8** (room [8,257], same rects, same under-text
  "Ambience", "Tap to listen…", "Rain"; Undo 96/146 not on top). Before the sheet (break running) b39202f's stack sat over
  the top bar's "· 5 min" and the countdown digits with Undo 23/146 not on top — R8's dock clears all of that.
- R8 844×390 @200 D sheet: before: docked whole. **Sheet open: room [8,272]; toasts over the sheet's title, text,
  "Sound is off right now · Turn on" and its Close** (underCtl Close, Turn on; per-frame covWho Rain/Fireside/Done/Close/
  Turn on [T]). Frame opened. Control b39202f 844 D sheet + INT 667/844 sheet queued (job-nav) to classify. Expected
  identical on b39202f (undocked path unchanged; the sheet voids the dock). Pre-existing class "toasts above modal
  sheets" (z-order); R7-14 also concerns the Ambience dialog.

## 9. Summary in landscape (dockcheck "summary", 3 toasts raised on the summary)
- R8 667×375 @200 L and 844×390 @200 D: **docked over the stage**, oldest folded, actions on top, **nothing under**
  (summary card, Tea time / Skip break fully clear). Frame opened (667 L top). → the new media-query reach of the dock
  improves the R7-5 class (reward toasts over the summary) in landscape; portrait summary has no dock (unchanged).
- b39202f 667×375 @200 L summary: **room [8,165]; update prompt over "25 minutes brewed" heading; Undo toast 4/146 px,
  Undo NOT on top; Cozy 0 px** (both top and end). → R8's docked summary is a large improvement (R7-5 class, landscape).
- R8 1440×900 @200 L summary: not docked (room [8,720]); toast rects overlap a "Done" control at the summary's top
  sample (rect overlap only, not hit-tested). Undocked path = b39202f code; control + INT 1440 summary queued.

## 10. Focus running (dockcheck "focus")
- R8 667×375 @100 L: n1, n2 undocked, over the countdown digits and "Kettle’s on. Nice…" (r6 #8, unchanged); **n3 docked,
  nothing under**. R8 844×390 @200 L: **docked from n1**, nothing under at n1–n3 (update folded at n3).
- b39202f focus: 667 @100 n1–n3 all over the countdown digits and the status line, Cozy 17/52 at n3; 844 @200 n1–n3 over
  digits and status line, Cozy 26/57 at n3. → R8 improves r6 #8 wherever it docks; identical where it does not.
- dockcheck job ended 18:35:26 (load 7.8). 22 contexts; 1 lost (R8 844×390 @100 over, "Execution context was destroyed").

## 11. INTERIM STATE (18:41 UTC) — waiting for lane receipts
- Done by me: diff review; revision/tree; RERUN-LIST; control reproduction (R7-D1); toastroom2 on R8/INT; dockcheck 22
  contexts (R8 / b39202f / INT; over, sheet, summary, focus); maker evidence audit (hashes, geom raw, captures opened);
  Lane 2 chromium JSON pre-audit; RO-error attribution; statusbar flake snapshot; memory/OOM check.
- Queued (detached, `slots --lane LEAD`, behind Lane 2's capture job): `.tmp/LEAD8/job-nav.sh` → `runs/navdiag/`
  (navigation diagnosis ×4) and `runs/dockcheck/` (synthetic two-action-toast 375×667 rows; sheet controls b39202f 844 D,
  INT 667/844; 1440 summary b39202f/INT). Read `runs/navdiag/navlog-*.jsonl` and `browser-stderr-*.log` first on resume.
- Draft: `LEAD/VERDICT-DRAFT.md` (leanings; disclosure 4 OPEN → BLOCKS if R8-caused).
