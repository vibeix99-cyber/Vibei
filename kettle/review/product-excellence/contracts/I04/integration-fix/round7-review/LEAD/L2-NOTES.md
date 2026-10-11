# LEAD2 (relaunched lead) working notes, round 7. Binding revision R7 = trial `b39202f`, src `6db18ad`

Relaunched lead; built none of round 7; not an earlier maker or Checker. Model Claude Opus 5.5 (`claude-opus-5-5`);
reasoning effort: not inspectable. Started 09:42 UTC 2026-10-11. Everything from the earlier lead is a lead to verify.

## 0. Revision (verified myself, 09:42)
`/home/user/wt/rv7-r7`: HEAD `b39202f8d391…`, `HEAD:kettle/src` = `6db18ada524d…`. Matches GATE.md.

## 1. Isolated M1 integrity run (09:42:15 start, `--n 3`, nothing else holding slots)
Log + loadavg: `LEAD/integrity-isolated/`. (in progress; see section 1 result below)
- Note: 09:43–09:47 an unrelated `git worktree add /home/user/wt/audit-phase2` (another agent) and lane agents ran
  non-browser work; 1-min load rose 0.2 → 6.3 while my 3-slot job ran. Not browser load (slots held 3/3 by me).

## 2. Diff review (verified myself)
`LEAD/L2-diffcheck-b39202f.txt` (prev lead's `tools/diffcheck.sh`, read in full before use):
- storage.ts `b73a0c7`, timer `748e7fb`, progress `f216f01` = 51521cf = M1 3f00b57 (empty diff).
- integrity.spec.ts 1..949 sha `669ff6598fc1ad85` in 51521cf, 3f00b57, b39202f; placement block header line 951, last
  block; every hunk ≥ 951. Read the new block in full (lines 951–1144): 3 viewports × 2 tests; real taps/clicks for
  controls; `scrollIntoViewIfNeeded` used once as setup in the Mark-done test (before storage is filled).
- flow.ts: `onStorageWriteError(warnSaveFailed)` in `initFlow`, `warnSaveFailed → raiseSaveWarning`; whole hold/toast
  path removed; only other change = End-early toast copy while failing. 0 leftovers in src/tests.
- saveWarning.ts / SaveWarning.tsx read in full. Announce: own polite region `#kettle-save-warning-said`, set 150 ms
  after the first banner/note mount of an episode; skipped if `episode === announcedEpisode` or < 60 s since the last
  announcement. `settleAnchor` scrolls the page by the shift of the element under finger/pointer/focus.
- Toast.tsx Close fix: `toastRoomTop()` (page-level `<header>` controls above the toast column → room top = their
  bottom + 24) and `MIN_ROOM_PX = 56` fallback (room top moved up to `innerHeight − lift − 56` when the room would be
  < 56 px; null when that is ≤ 8). 250 ms re-measure interval while toasts are up.

## 1 (result). Isolated M1 integrity run on R7 :5301 (09:42:15–09:48:25, `slots --n 3`, workers 1)
`LEAD/integrity-isolated/run.log`, `loadavg-{before,during,after}.txt`. **23 passed / 25; 2 failed.** Load 1-min
0.15 at start, 1.5–6.4 during (slots: only my job; the rise is non-browser work: another agent's `git worktree add
audit-phase2`, lane agents' node/analysis), 2.76 after.
1. `integrity.spec.ts:768` export → reset → import: **failed in 19.2 s against a 150 s test timeout (not a timeout)**.
   Failing assert l.820 `profilePills` = ["Level 12","184 leaves","23 days warm"] vs ["Level 12","2,261 leaves",…].
   Every data assert before it passed (sessions, ledger, leaves, cozies, badges, settings). Error-context page
   snapshot holds BOTH route layers: the exiting Today (`"Cozy level 12, 184 leaves to the next"`, sr text) and the
   entering Settings (`2,261 leaves` in Profile). `profilePills` reads `document.body.innerText` right after the
   Settings h1 is visible; regex `[\d,]+ leaves(?! to level)` matches Today's sr line first. → read race in test code
   (lines 1–949, byte-identical to M1 3f00b57), not data. Same failure seen by the gate under load and by the earlier
   lead. Control run on INT (same test text) queued: `LEAD/integrity-isolated/expimp.log`.
2. `integrity.spec.ts:1090` (round 7's own test) "a banner that appears while Today is open moves nothing under the
   finger", **desktop 1440×900**: failed 12.8 s: after `mouse.click(554.5, 453.4)` on Mark done's box centre,
   "Crossed off. Nice work." never appeared; page snapshot at failure: Mark done still offered, no banner, no toast,
   i.e. the click did nothing. Trace screencast was ~2 s stale (SwiftShader), so it does not show the click target.
   Click came 835 ms after `end('user')`. Repeat ×6 queued: `LEAD/integrity-isolated/md1440.log`.

## 3. Raw-evidence checks so far (mine)
- **LEAD-D1 / Mark done (Lane A raw `A/runs/leadd1-case{1,2,2key}-r7/markdone-b39202f.jsonl`, 16 valid R7 rows):**
  banner adds 1 / removals 0 in every row; `said` = exactly 1 entry per row, 141–158 ms after the banner add
  (the 150 ms announce timer), text "This browser’s storage is full. Kettle couldn’t save your la…"; banner in view
  0 frames in every row; scrollY jumps by +290…+352 at the add (375×667 @200 1100→1452; 844×390 169→475); field top
  constant. 1 row INVALID (844×390 case 2 tap; nothing crossed). Matches A's table. Banner first appears at the tap
  (it did not exist before) → ruling branch "first appears at that moment": announced once = satisfied.
- **Lane B markdone (`scratchpad/r7/B/markdone/markdone-R7.jsonl`), 375×667 @100:** banner partly in view after the
  tap (top −39, bottom 104 of 667; 440 frames in view), scrollY 162→325; said 1.
- **Lane A R5-D1 rows on R7 (`A/runs/r5d1-*r7*/natural-R7.jsonl`):** banner 1/0 in all; announcer addition recorded
  in only ~half (touch 375L 5/10, 844L 5/10, wheel 375D 4/10, 375L 6/10, 844L 5/10). Hypothesis: the first failed
  write happens on idle Today (Lane B `behave`: first failed write `kettle:timer` 25–75 ms after the fill, banner
  added 25–64 ms later, announced once) before A's recorder starts, so End→Today re-mounts an already-announced
  banner. Testing with `LEAD/runs/L2-saidlog/` (recorder from page load).
- **Lane C 1d-2 ran after C's receipt closed** (`C/check2-residuals/resid3-flash/resid3.jsonl`): panel scroll range
  > 0 (shade shows on R7) for 146–292 ms after Tea time / finish(), real clock, both sizes; INT has the same range
  with `overflow: visible` (no shade). → transient bound measured.
- **Toast room at landscape 200 % with Break's over scrolled to its end** (prev lead's `runs/close-r7` +
  `close-ctl5305` jsonl, re-read): 667×375 end: clip [−12,19], least-visible toast 19 px (n=1) / 0 px (n=3); 844×390
  dark end: [−12,34], 34 / 0. Same on `49ea1de` (no Close fix) → from M7b's panel scroll × round 6's D4 lift (group
  marked `data-toast-above` sits at the top when scrolled). At the panel's top the room is 76–246 px and all toasts are
  whole (minVis 57). Frames opened: `b39202f-667x375-…-end-n3.png`, `844x390-dark-…-end-n1/n3.png` (newest toast's
  top cropped by the screen edge, older ones scrolled away in the list; no control covered).

## 4. Visual gate (opened at full size so far)
REFERENCE: K01 `01-home.png`, K02 `07-summary.png`, K09 `live-settings.jpg`.
BEFORE/AFTER (Lane D `D/captures/{INT,R7}/…`, frozen 2026-10-10T16:40Z):
- 390×844 light 100 a1: R7 banner under the greeting, honey tint, Save backup secondary; INT: dark warning toast over
  the composer above the docked start. R7 calm, in flow, nothing overlaid.
- 375×667 light 200 a1/a2: R7 banner below the fold on arrival (a1 identical to INT a1 where INT's toast is held);
  a2 banner whole with body text at 200 %.
- 1440 dark 100 a1: banner heads the right column; legible in dark.
- 390×844 dark 200 b2 (Settings): banner after the backup tools, Save backup whole.
- 375×667 light 200 c1/c2 and 844×390 light 200 c1/c2 (+INT c2): note under the fold on arrival at 200 % (top
  edge of the honey box visible above the footer at 375); end frames identical to INT; last line clears the footer.
- 375×667 light 200 e1 R7 vs INT: R7 Close clear, panel at its end, all three actions whole; top toast's first line
  under the list clip (scrolls in the room). INT: toasts over the question text, actions below the edge.
- 375×667 light 200 d2: break at its end, captions wrap, all three controls whole.
- C `BAND-375x667-light-09-INT-top-R7-bottom.png`: soft shade on blank background, nothing hidden.

## 5. Item 2 (banner after Mark done) — raw rows read so far
- Lane A relaunch smoke (`A/runs/markdone-cases/smoke-r7-{a,b}/stdout.txt`, probe `markdone-a4.mjs` sha 6062333…,
  844×390 @200 light, 09:48 UTC):
  - SETUP=a (first failure at the tap): banner added 79 ms after the tap; page scrollTop 168→474 (+306, settleAnchor);
    banner never in view after; live additions after tap: "Crossed off. Nice work.Undo" then ONE
    `kettle-save-warning-said`: "This browser’s storage is full. Kettle couldn’t save your latest changes. Save a backup
    to keep them. Save backup is on Today and in Settings, Your data." (full text). → announced exactly once.
  - SETUP=b (banner already on Today from End's failed save): banner whole at the top (16–308) before any input; real
    touch drags scroll it off (user's own scroll, st 0→502); tap Mark done → scrollTop 502→430 (−72: the page moved
    DOWN on screen, toward the banner); banner not in view before or after the tap; no new announcement after the tap
    (warning said once at t=281 on arrival). → Mark done did NOT scroll a visible banner off screen in this config.
  - SETUP=b side finding: on arrival at Today (844×390 @200) End's toasts float over the in-page banner for 164 frames
    (toast room [55,172] lies on the banner 16–308); live: "Kettle’s off. 3 minutes of focus saved." (timer announcer,
    pre-existing announce.ts), "Recipe done…", "3 minutes of focus, kept in this tab: not saved yet", then the warning.
  - Full SETUP=b series (375×667 @200 light/dark, …) queued by Lane A.

## 6. Regression raw (Lane D relaunch, read by me)
- `scratchpad/r7/D/run2/logs/pw-chromium.log`: chromium **72 passed** (14.5 m, workers 2, 09:48–10:03, under load);
  integrity :768 and :1090 @1440 both passed in this run.
- `…/run2/logs/pw-timer-pwa.log`: timer-harness + timer-app + pwa **29 passed, 2 skipped** (timer-app :419, :438/596
  "rendering budget"; by design) — 10:04–10:06.
- Earlier D run (`scratchpad/r7/D/pw-chromium.json`, 04:30): 71/72, the failure = integrity :1090 **desktop 1440×900**
  (same click point 554.5,453.4 as my isolated failure); rerun of the three :1090 tests 3/3 (`pw-rerun.json`).
- Tally for the two intermittent integrity tests on R7: :768 failed in gate maker run + my isolated run, passed in D
  run1, D run2, gate rerun 10/10; :1090@1440 failed in D run1 + my isolated run, passed in gate run, D rerun, D run2.

## 7. Close sweep (Lane C relaunch raw, `scratchpad/r7/C/close/{ctl,r7}/closecheck2-*.jsonl`, probe sha 863c0a92…)
- Control 49ea1de 375×667 @200 light end n3: Close covered 139 settled frames (reproduced this session, 09:5x).
- R7 over-carried, 375×667 / 390×844 / 667×375 / 844×390 @200 light+dark, 375×667 / 1440 @100: Close and the three
  actions covered 0 frames in every row. Toast room again: 667×375 end minVis 19 (n1) / 0 (n3); 844×390 end 34 / 0.

## 8. :768 trace (my isolated run, `scratchpad/r7/LEAD/integrity-isolated/…51029…/trace.zip`)
Second pill read: `navigate('/settings')` 214040 → Settings h1 visible 214360 → `body.innerText` read 214371 (331 ms
after navigate). The test primes `motion: 'reduce'` → route layer exit = 0.14 s + 0.05 s fade, then AnimatePresence
removal; under load the exiting Today layer (opacity 0, still in the DOM, so in innerText) is still there. App code of
the route transition (`App.tsx` `layerTransition`) is identical on INT and R7. → test read race.

## 9. Item 5 coverage (re-judged myself)
`LEAD/tools/judge_reach.py` on `C/check1-reach/{R7,INT}-reach.jsonl` (C ran M7b's `reach.mjs` unedited, sha 9d8ef06e):
R7 30 rows, 0 failing (375×667, 390×844, 844×390 × light/dark × 5 states; wheel/touch/key; controls include Ambience
and Mute in break states); INT 18 wheel/touch rows failing. 390×844 + 844×390 reach on R7: covered. Toast check at
390 dark / 667×375: covered by C's close sweep (390×844 dark, 667×375 light+dark @200, Close + actions clear) and the
earlier lead's `close-r7` paused rows (Ambience/Mute clear). Ambience/Mute "by touch": reached by CDP touch in every
break/paused R7 row of the reach probe (activation by tap not in that probe — check C's relaunch receipt).

## 10. Servers re-verified by me 10:10 UTC (`/tmp/rv7-servers/verify.sh`, `LEAD/L2-server-verify.txt`)
5301 b39202f (src 6db18ad), 5303 0d58c5e (1fc4a1b), 5305 49ea1de (939711c), 5302 20671eb, 5304 e866118: VERIFIED.

## 11. :1090 @1440 repeat ×6 (`LEAD/integrity-isolated/md1440.log`, 09:50 queued, ran ~10:08, 1 slot, load ~13)
1 failed / 6 (repetition 1, 18.4 s; same "Crossed off" never visible; snapshot: Mark done still offered, no banner,
no toasts), 5 passed (4.5–11.5 s). Running tally :1090@1440 on R7: 3 failures in 10 executions I can see.
:768 export→import R7 run 1 (expimp.log): passed (23.7 s) under load 13.
- (visual, more) 375×667 dark 100 a1: banner in flow under the greeting, dark tint legible, docked start clear.
  1440 light 200 a1: banner heads the right column; Mark done visible in the left composer at the same time.
  844×390 dark 200 a1: banner at the head of the right column, read through the strip above the docked start.
  844×390 dark 200 d4: Break's over at its end, all three actions whole; "Next: brew 2 of" truncation pre-existing.
  375×667 light 200 f2 R7 vs INT: nothing over the brew on either; R7 adds the panel's bottom shade (brew panel
  scrollable at 200 %, "Pause" caption cut on both).
  390×844 light 100 c1: note one row above the task; same honey tint as the unlock card below (tone: calm; info icon +
  "Not saved: storage is full." distinguishes it).
  B cover `R7-390x844-t200-light-5-summary-toasts.png`: three toasts over heading, sub and the note (Save backup
  centre covered 12/12 frames at 375 and 390 @200; box overlap only at @100; none at 844/1440).

## 12. Said-log (mine: `LEAD/runs/L2-saidlog/saidlog-b39202f.jsonl`, probe `.tmp/LEAD2/saidlog.mjs`, recorder from
page load via init script; R7 :5301, 375×667 @200 light, A's natural-a2 setup, 6 runs, 10:09–10:11 UTC)
- Exactly ONE `kettle-save-warning-said` text per run (6/6): "This browser’s storage is full. Kettle couldn’t save
  your latest changes. Save a backup to keep them. Save backup is on Today and in Settings, Your data."
- Runs 1, 2, 4, 6: first failure at startFocus → no banner on the leaving Today → said once on End→Today (~140 ms
  after the shell layer with the banner is added).
- Runs 3, 5: the idle `kettle:timer` write failed 95/87 ms after the fill, on Today → banner added on Today → said
  once at 1179/1103 ms (already on #/focus); End→Today re-mounts the banner, not said again. → explains Lane A's
  R5-D1 rows with 0 additions (their recorder starts just before End). Not a missing announcement.
- Same run, everything the live regions say at End (storage full): timer announcer "Kettle’s off. 12 minutes of focus
  saved." (announce.ts, byte-identical to INT) → Notifications "Recipe done… · Cozy level 5! · 12 minutes of focus,
  kept in this tab: not saved yet" → the warning. Banner on arrival at 375×667 @200: top 737 of 667 (below the fold).

## 13. :1090 @1440 diagnosis (mine: `LEAD/runs/L2-md1440diag/md1440diag-b39202f.jsonl`, replays the spec's steps)
6 runs R7 (fill on): the same click point (554.5, 453.4) every time. 5/6: `elementFromPoint` = Mark done, toasts
settled at y 560–612 / 620–672 (above the docked start), pointerdown+click on Mark done, crossed off. **Rep 4 (click
778 ms after `end('user')`): toasts still high — "Recipe done: Name what you’re brewing" at y 410–462 covering Mark
done's centre — pointerdown+click went to the toast (tap = dismiss), nothing crossed off.** = the failure in my
isolated run, D's run 1 and md1440 rep 1. Mechanism = round 6's item 10 (toast lift measured against the leaving
session layer for a moment after End at 1440; settles on the 250 ms re-measure). Test-side: :1090 clicks by
coordinates ~0.8 s after End without waiting for End's toasts. INT rows (no fill) pending in the same file.
- INT rows (same file, no fill, 4 runs, clicks 477–1408 ms after End): "Recipe done" toast at y 410–462 over Mark done
  in 4/4 at the measurement; click went to the toast in 3/4 (rep 4 moved first). R7 settles at 560–612 (below Mark
  done) and covers it only in the first ~0.8 s. → INT worse; the :1090@1440 flake = test timing against pre-existing
  toast placement (round-6 item 10 class). Per-frame timeline queued: `LEAD/runs/L2-liftlag/`.

## 14. M1 re-review (behaviour)
- Code: storage.ts/timer/progress byte-identical to M1 3f00b57; detection path `safeStorage.setItem` →
  `reportWriteError` → `onStorageWriteError(warnSaveFailed)` → `raiseSaveWarning` (per failed key);
  recovery = every failed key re-saved (`lastWriteFailed`), polled every 2 s.
- Lane B `behave` raw (`scratchpad/r7/B/behave/R7/behave-R7.jsonl`, 6 rows: 375×667 L/D @100/@200, 1440 L/D):
  banner added 25–92 ms after the FIRST failed write (never before one); kept on Today 13/13 s, through Stats/Nook/
  Settings round trips, and for ~6 s after storage was freed but nothing re-saved (truthful); removed 458–1787 ms
  after the first successful re-save. Live region: one addition per row.
- My isolated integrity run: I01/I02/I03 data tests all pass, incl. :867 (storage full: brew reaches its summary
  once, saved data intact, backup carries the brew), :903 (restore that cannot be saved is refused, nothing changes),
  :1004 ×3 viewports (no warning during the brew; note on the summary said once; banner in flow on Today/Settings;
  Save backup by Tab; kept 13 s; gone when there is room). :768's data asserts all passed (only the pill read failed).

## 15. Second failure episode within 60 s (Lane B relaunch raw `scratchpad/r7/B/rl/episodes/episodes-{INT,R7}.jsonl`)
R7 375×667 @100 and 1440 dark: episode 1 banner + said 1; room made + saves → banner removed; episode 2 (~5 s later)
→ banner present again, said stays 1 (not announced: `ANNOUNCE_EVERY_MS` 60 s in saveWarning.ts). INT same script:
episode 2 → NO warning at all (INT flow.ts `SAVE_WARNING_EVERY_MS` 60 s suppressed the toast) and no announcement.
→ R7 better than INT; the unannounced re-appearance only matters when it re-appears off screen (rare: storage must
recover and fail again within a minute). FOLLOW-UP (owner M7a, saveWarning.ts announce throttle).

## 16. Lane C FINAL receipt (Sonnet 5.5 relaunch, 09:43–10:32Z) — traced by me
- Probe hashes: `C/probes/SHA256SUMS.txt` all OK (sha256sum -c). `closecheck2.mjs` 863c0a92…; copy of my predecessor's
  `closecheck.mjs` c17efde4 (= LEAD/probes).
- **Check 4 aggregated by me from raw** `C/check4-close/r7-b39202f-5301/closecheck2-b39202f.jsonl` (220 rows, 0 errors):
  Close / Ambience / Mute **0 covered frames, centre = the control in every frame** in all 10 configurations (375×667,
  390×844, 667×375, 844×390 @200 light+dark; 375×667 + 1440 @100 light) — Close 646–790 frames per config, Ambience and
  Mute 476–1220 each; **taps 100/100 activated**. Control `…/ctl-49ea1de-5305/closecheck2-49ea1de.jsonl` (39 rows): Close
  375×667 @200 L **166/657 covered**, 1 tap not activated (hit "Recipe done" span); Ambience 667×375 @200 L **435/1169
  covered**, 3 taps not activated (hit the toast); Mute never covered. Frames opened: control
  `49ea1de-375x667-t200-light-over-carried-end-n3.jpg` (Close under the top toast), R7
  `b39202f-667x375-t200-light-paused-end-n3.jpg` (Ambience/Mute clear; room under the bar; toasts over the countdown =
  r6 item 8).
- 1440 focus "end" Ambience tap row: activated, `closed: false, closedBy: 'none'` after a real Escape (focus "top" row:
  closed without the Escape step). Sheet + shortcut code untouched by round 7 (FocusScreen diff = panel ref / scroll
  only; AmbienceSheet not in the diff) → not attributable to round 7; UNKNOWN (one row).
- 5a M7b toastcheck unchanged (3380304f) 24 rows clear/off-screen; break-reach.spec 7/7 (`check4-close/logs/R7-break-
  reach-spec.log`). Reach 1a re-judged by me (section 9).
- 4d = the toast-room collapse at landscape @200 Break's over end (19/52 at 667×375, 34/52 at 844×390; two of three 0 px).
  C's own Break's over control at those sizes not run; control = 49ea1de (lead's row), which is round 7 too.

## 17. My SETUP=b runs (banner visible at the tap) — `LEAD/runs/L2-setupb/markdone-b39202f-setupb.jsonl`, Lane A's
`markdone-a4.mjs` copied unedited (sha 561523f7 = A's series.log), R7 :5301
| config | banner at tap | scroll jump after tap | banner after tap | said after tap |
|---|---|---|---|---|
| 390×844 @100 L | whole in view 149–292 | none | whole, same rect, 411/411 frames | 0 (said 1 on arrival) |
| 375×667 @100 D | whole 9–152 | none | whole, same rect, 394/394 | 0 |
| 1440×900 @100 L | whole 44–153 (right column) | none | whole, 360/360 | 0 |
| 390×844 @150 L | partly (−143…103) | none | same partial, 403 in view | 0 |
→ Mark done never scrolled a visible banner off screen (7 configurations incl. A's 3). Branch BLOCKS not met.

## 18. Said-log, real taps (R7, 375×667 @200 light, 4 runs, 10:33 UTC): REAL tap "Put the kettle on" (storage full
before it), ff 12 min (time only), REAL tap End session + the sheet's End session.
- Sheet text 4/4: "That’s okay — your minutes still count. 12 minutes of focus will be saved" (storage already failing).
- Live regions at End 4/4: "Kettle’s off. 12 minutes of focus saved." (timer announcer) → "12 minutes of focus, kept
  in this tab: not saved yet" (toast) → ONE warning announcement ~140 ms later. Banner on arrival top 573 of 667
  (94 px in view, empty profile). Item 6: both "saved" wordings fire with storage full on R7; files byte-identical to
  INT (EndSheet.tsx a1a1653, announce.ts 7ff6535); R7's visible End toast is truthful where INT's said "Saved".

## 19. Save backup reach v2 (`LEAD/runs/L2-savereach/savereach-*.jsonl`, probe sha 608d8cb9; v1 rows invalid → `invalid-v1/`)
- R7 667×375 @200 light, REAL Tab from the top: Save backup focused at press 4; after the browser's focus scroll
  (scrollY 303) its box is 63–112 (inside the viewport) but **its centre hit-tests to "Put the kettle on · 25 min"**:
  focused control under the docked start. R7 844×390 @200: press 4, box 71–121, centre = Save backup (clear).
- Is this general at 667×375 @200 (other Today controls, INT)? → `LEAD/runs/L2-focusobscure/` queued.
- savereach v2 touch row R7 667×375: INVALID as a reach test — my direction rule (content up only while Save backup's
  top > H/2) oscillated at 171–195 and never pushed it into the ~60 px clear strip; not counted. Fine-step reach is
  established by Lane B raw (`read` R7-667x375-t200 wheel20 / wheel53: Save backup hit-testable, 7/7 lines) and Lane C
  read-53 (8/8, Save backup yes). 100-px notches miss it (B 4/7, C 4/8).

## 20. Lift timeline at 1440 (`LEAD/runs/L2-liftlag/`, 10:40–10:41, no input after End, 3 runs each)
rAF starved (2–4 frames in 3 s under load 8–10) → timing inconclusive. Every recorded frame on BOTH revisions (R7 at
217–2979 ms, INT at 305–2265 ms after End): End's toasts at y 410–462 / 470–522 and Mark done's centre (y 453) hits
the toast. Consistent with the diag: End's toasts over Mark done at 1440 is pre-existing (INT 4/4 diag runs);
R7 is not worse (diag: R7 settled below Mark done in 5/6). → :1090 flake = test timing; FOLLOW-UP (test M7a; lift M2).
