# I03 × I04 combined integration fix · CHECKER r7 (LEAD)

**Verdict: REJECT**

| | |
|---|---|
| **Reviewed revision (binding)** | Trial merge **`b39202f`** (`b39202f8d391de1e65b9b6c3aa9de902bbd79382`), **`kettle/src` tree `6db18ad`** (`6db18ada524d3ca6354151ee59a5e3e8c239c604`). It is integration `2e9095c` plus the combined fix `pe/r7-banner@7ba0d98` (code `980ef2a`). That fix contains M7b's `pe/r7-break@38fc9c6`, merged in `eea543d`. I checked it myself in `/home/user/wt/rv7-r7` (`git rev-parse HEAD` and `HEAD:kettle/src`). |
| **Controls** | INT `0d58c5e` (src `1fc4a1b`) on :5303. Unfixed combined revision `49ea1de` (src `939711c`) on :5305. R5 `20671eb` on :5302. `e866118` on :5304. |
| **Servers** | Owned by the orchestrator, restarted at 09:40 UTC, never stopped by me. I re-verified them at 10:10 UTC with `/tmp/rv7-servers/verify.sh`, which compares the served `?raw` source with the committed blobs. Ports 5301 to 5305 were all VERIFIED (`round7-review/LEAD/L2-server-verify.txt`). |
| **Checker** | Relaunched LEAD Checker. I replace the round-7 lead, who was stopped at about 04:50 UTC by a usage limit. I built none of round 7 and am not an earlier maker or Checker. I edited no application code, tests or maker files, and committed nothing. |
| **Model** | Claude Opus 5.5 (`claude-opus-5-5`). Reasoning effort: not inspectable. |
| **Environment** | 4 CPUs shared with lanes A–D, Dcap and other agents. Headless Chromium with SwiftShader and emulated viewports; large text is `html{font-size:…}`. Every browser launch went through `tools/slots.py --lane LEAD`, with a fresh context and a disposable profile each run. Work ran 09:42–11:15 UTC on 2026-10-11. The 1-minute load was 0.15 at my first run and 5–15 afterwards. |
| **Notes and probes** | Working notes: `round7-review/LEAD/L2-NOTES.md`, sections 0–32, written as I went. Runs: `round7-review/LEAD/integrity-isolated/` and `round7-review/LEAD/runs/L2-*/`. Probes: `/home/user/wt/rv7-int/kettle/.tmp/LEAD2/` (git-ignored). Scratch: `/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/r7/LEAD2/`. |

## Short version

Round 7 does what option B asked, and it fixes the problems it was asked to fix.

- **Warning presentation.**
  - The storage-full warning is now an in-page banner on Today and in Settings › Your data, plus a one-line note on the summary.
  - Nothing is laid over the brew.
  - Every hold, withdraw and re-show loop of the old toast is gone. That loop caused LEAD-D1, R5-D1, D3/R2-D3/R4-D1 and round-6 items 14, 16, 18 and 19.
  - The warning is announced exactly once per episode.
- **M1's data behaviour is unchanged.**
  - `storage.ts`, `timer/**` and `progress/**` are byte-identical to the approved `3f00b57`.
  - Every data assertion passes.
- **Close, Ambience and Mute** are clear in every configuration measured, on both the earlier lead's runs and Lane C's sweep, and every real tap activates them. The control `49ea1de` reproduces the Close and Ambience defects this session.
- **M7b's reach fix holds.** R7 fails 0 of 30 configurations; INT fails 22 of 30.
- **The summary's last line still clears the Tea time / Skip footer.** The gap is identical to INT at every size.
- **Vibei's ruling on the banner after "Mark done" is satisfied.**
  - When the warning first appears at the tap, it is announced exactly once with its full text.
  - When the banner was already showing, the tap never scrolled it off screen, in 11 runs over 7 configurations, four of them with the banner wholly in view at the tap.

**One round-7 defect blocks: R7-D1, the toast room on Break's over at landscape phones with 200 % text.**

- **Where:** Break's over with a carried task, at 667×375 or 844×390, 200 % text, either theme.
- **What happens:** when the person scrolls the panel to its end (which they must do to reach "Put the kettle on" at that size), the toast room shrinks to a 27–42 px strip at the screen's top edge.
  - A single toast shows 11–34 of its 52–57 px.
  - Older toasts are pushed fully off screen.
  - The endless update prompt ("A fresh brew of Kettle is ready · Update") shrinks to a sliver over the top bar's "Next: brew 2 of" line, and its **Update action cannot be hit** until the person scrolls back up.
- **On INT:** the same toast is whole (97 px) and actionable in every position, because the panel cannot scroll there.
- **Cause:** M7b's new scrollable panel combined with the D4 lift from round 4. The state is new in round 7. The maker's packet calls the 26 px room "pre-existing, r6 residual 3", but the INT control shows it is not.
- **Classification:** it hides text and a control, so it does not fit Vibei's narrow exception, and Vibei's binding ruling covers the storage warning, not toasts. Under the residual rule it **BLOCKS**.
- **Round 8:** this is the **single product blocker, with one owner (M7a) and a clear reproduction**, so a single focused round 8 is appropriate.
- **If Vibei rules otherwise:** if Vibei judges that toasts may be read the way the ruling lets the banner be read (seen on arrival, announced politely, back in view on scrolling back), R7-D1 becomes ACCEPTED. Nothing else in this review blocks.

**The two integrity failures are test-side, not data.**

- **`:768` export → import:** the gate called this a timeout. It is not one: the test failed in 19.2 s against a 150 s limit. It is a read race in test code that is byte-identical to M1's approved version.
- **`:1090` at 1440:** this is round 7's own test, and it is intermittent: 3 failures in 10 executions I can see. The test clicks Mark done while End's toast still covers it. On INT that toast covers Mark done for its whole life.
- Both are FOLLOW-UPs with owners. M7a should fix `:1090` in round 8.

## The six items the relaunch brief asked me to settle

### 1. The integrity "timeout": not a timeout, but a test read race in pre-existing test code

**The isolated run.** This was my first action: 09:42:15–09:48:25 UTC, `slots --n 3`, workers 1, R7 :5301.
- Result: **23 passed of 25.**
- Log and load are in `LEAD/integrity-isolated/` (`run.log`, `loadavg-{before,during,after}.txt`).
- The browser slots were exclusive. The 1-minute load went from 0.15 to 6.4 because of non-browser work by other agents (another agent's `git worktree add`, the lane agents' analysis), and was 2.76 afterwards.

**`integrity.spec.ts:768` export → reset (explicit confirmation) → import.**
- **It failed in 19.2 s against its 150 s timeout.** It was an assertion failure, not a timeout, and it happened with no other browser running, so it is not caused by browser load.
- Line 820: `profilePills` read "184 leaves" where "2,261 leaves" was expected.
- Every data assertion before it passed: sessions, ledger, leaves, cozies, badges and settings all equal the export.
- The page snapshot at the failure holds both route layers:
  - the exiting Today, whose screen-reader status line reads "Cozy level 12, 184 leaves to the next";
  - the entering Settings, whose Profile shows "2,261 leaves".
- The trace shows the read happened 331 ms after `navigate('/settings')`.
- `profilePills` reads `document.body.innerText`. Its regex `[\d,]+ leaves(?! to level)` matches Today's line first while that layer is still in the DOM.
- In my later R7 ×4 run, the race struck the other read instead: `pillsBefore` caught "184 leaves".

Tally:

| Revision | Failed | Passed |
|---|---|---|
| R7 | gate maker run; my isolated run; my ×4 run, repetition 1 | Lane D 04:30; Lane D 09:48; gate rerun 10/10; my run (23.7 s); my ×4 run, repetitions 2–4 |
| INT (same test text, lines 1–949 identical) | none | 5 of 5 (`LEAD/integrity-isolated/expimp.log`, `expimp2.log`) |

Attribution:
- The test code is byte-identical to M1's `3f00b57` (lines 1–949, sha `669ff659…`).
- The app code involved is the route cross-fade in `App.tsx`, the status bar and Settings. Round 7 changed none of it.
- The status bar differs between INT and R7 because of I04 rounds 3–5, but it is byte-identical in round 6's base `51521cf` and in R7.
- **Class: FOLLOW-UP (test), owner M1.** The fix is to read the pills inside the Settings Profile region, or after the exiting layer has gone.

**`integrity.spec.ts:1090` at desktop 1440×900** ("a banner that appears while Today is open moves nothing under the finger").
- This is round 7's own test. It failed in the same isolated run: "Crossed off. Nice work." never appeared, and the snapshot shows Mark done still offered, with no banner and no toast.
- It also failed in Lane D's 04:30 run, at the same click point (554.5, 453.4), and in 1 of my 6 repeats.
- **Diagnosis** (`LEAD/runs/L2-md1440diag/`): I replayed the spec's own steps, with a hit test just before the same click.
  - In 5 of 6 R7 runs, End's toasts had settled at y 560–672 and the click hit Mark done.
  - In the run where the click came 778 ms after End, the "Recipe done" toast was still at y 410–462, over Mark done, and it took the click. Tapping a toast dismisses it.
  - **On INT that toast covers Mark done for its whole life:** 4 of 4 runs, with 3 of 4 clicks hitting the toast.
  - A per-frame timeline (`L2-liftlag/`) was starved of frames, but every recorded frame on both revisions shows End's toasts over Mark done.
- **Class: FOLLOW-UP (test), owner M7a.** The test should wait for End's toasts to expire before tapping, as the probes do.
- The product side is round 6's item 10, the toast lift at 1440 right after End. Its owner is M2, and INT is worse.

### 2. The banner and "Mark done": Vibei's ruling, applied from raw evidence

**Case: the warning first appears at the tap** (storage fills just before Mark done).
- **Lane A's raw data:** 16 LEAD-D1 rows on R7 at 375×667, 844×390 and 667×375, including the update-toast and keyboard variants, plus the relaunch's setup-(a) rows.
  - The banner is added once and never removed.
  - Its first frame comes 63–122 ms after the tap, together with "Crossed off · Undo".
  - scrollTop jumps by the banner's own height (+352 at 375×667 @200, +306 at 844×390). That is `settleAnchor` keeping the finger's neighbourhood still; the composer field moves at most 1 px.
  - The banner ends 122–518 px above the view, with 0 in-view frames.
- **The live region** (`#kettle-save-warning-said`) gets **exactly one** addition, about 150 ms after the banner. The full text is: "This browser’s storage is full. Kettle couldn’t save your latest changes. Save a backup to keep them. Save backup is on Today and in Settings, Your data."
- **Lane B, 375×667 @100:** the banner is partly in view after the tap (top −39 / +6 / −6 px), and is announced once.
- → **The first-appearance branch is met:** the warning is announced exactly once.

**Case: the banner was already showing, and the user scrolled to Mark done.**
- **Lane A, setup (b): 7 R7 rows** at 375×667 @200 light and dark, and 844×390 @200.
  - The banner was shown and announced 12–25 s before the tap.
  - The person's own touch scroll took it off screen.
  - The tap moved scrollTop by 0 at 375×667, and by −54 to −79 at 844×390, where the Mark-done row collapses. Both move the page toward the banner, not away from it.
  - No re-announcement.
- **My 4 runs, with the banner on screen at the tap** (`LEAD/runs/L2-setupb/`, Lane A's `markdone-a4.mjs` copied unedited, sha `561523f7`):
  - At 390×844 @100 light, 375×667 @100 dark and 1440×900 @100 light, the banner was **wholly in view at the tap**. There was **no scroll jump**, and the banner stayed whole, in the same rectangle, in every frame afterwards (411, 394 and 360 frames).
  - At 390×844 @150, the banner was partly in view and the view did not change.
  - No re-announcement.
- → **The blocking branch ("Mark done itself scrolls a visible banner off screen") did not occur in any configuration.**

**"Exactly once", checked from page load** (`LEAD/runs/L2-saidlog/`; recorder installed by an init script).
- **10 of 10 R7 runs** at 375×667 @200 (6 with the debug start, 4 with real taps): one warning utterance per run.
- Lane A's R5-D1 rows that recorded 0 additions are a recorder artefact. In 2 of my 6 runs, the idle `kettle:timer` write failed on Today about 90 ms after the fill. The banner was announced then, before the brew started, which is before Lane A's recorder starts.
- INT control, real taps: the warning toast was announced 5 and 8 times during the brew, plus 1–2 more at End.
- **Second failure episode within 60 s** (Lane B's `episodes`): R7 shows the banner again but does not announce it again (60 s throttle). INT in the same case shows no warning at all. → FOLLOW-UP.

**Ruling: ACCEPTED under Vibei's ruling.**

### 3. Close, Ambience and Mute stay clear at every size and scroll position

| Source | Configurations | Result |
|---|---|---|
| **Lane C relaunch**, raw `C/check4-close/r7-b39202f-5301/closecheck2-b39202f.jsonl`, 220 rows, 0 errors, **aggregated by me** | 375×667, 390×844, 667×375, 844×390 @200 light and dark; 375×667 and 1440 @100 light. Break's over for Close; focus running and paused break for Ambience and Mute; panel at top and at end (real wheel); 1 and 3 toasts | **0 covered frames**, with the centre hit-testing to the control itself in every frame. Close 646–790 frames per configuration; Ambience and Mute 476–1220 each. **100 of 100 real taps activated** |
| **Control `49ea1de` this session** | Close at 375×667 @200 light; Ambience at 667×375 @200 light | Close covered in 166 of 657 frames, and 1 tap was taken by a toast. Ambience covered in 435 of 1169 frames, and 3 taps were taken by a toast |
| **Earlier lead's runs** (`LEAD/runs/close-r7/`) | Same states, plus 568×320 @100 | 0 covered; control reproduced at 03:57 |
| **Lane C 5a**: M7b's `toastcheck.mjs`, unchanged, sha `3380304f` | 390×844 dark; 667×375 light and dark | 24 rows, all clear or off screen |

- Frames opened: control `49ea1de-375x667-t200-light-over-carried-end-n3` (Close under the top toast) and R7 `b39202f-667x375-t200-light-paused-end-n3` (Ambience and Mute clear).
- One Lane C row (1440, focus "end", Ambience) still had the dialog open 0.7 s after Escape. The sheet and shortcut code is untouched by round 7, so I record it as UNKNOWN and not attributable.

**Result: clear everywhere. The toast room in the same rows is R7-D1, below.**

### 4. The summary note clears the Tea time / Skip footer

- **Lane B raw data** (`B/logs/rl/sum4/*`), re-read by me. After a real tap to expand the details and real touch or wheel to the end, the gap between the last line and the footer is **identical on R7 and INT**:

  | Configuration | Gap (px) |
  |---|---|
  | 375×667 @100 | 49 |
  | 375×667 @200 | 50 |
  | 390×844 @100 | 49 |
  | 390×844 @200 | 49 |
  | 844×390 @100 | 33 |
  | 844×390 @200 | 34 |

  The last line's hit test lands inside the details in every row.
- Lane C 1c gives the same numbers, and adds 1440 at 100 % and 200 %.
- **Frames opened:**
  - Lane D's end frames are identical: 375×667 L200 c2; 844×390 L200 c2, R7 and INT.
  - R7 c1: the note is one row at 390×844 @100; two rows at 200 %; at 375×667 and 844×390 @200 it sits behind the footer on arrival and takes 3 or 7–8 drags to reach.
- The note appears only after a real failed save. Its wording is "Not saved: storage is full." Its Save backup downloaded 7 sessions, including the unsaved brew.

**Result: met.** The note being covered by reward toasts is R7-5, below.

### 5. M7b's probes that the maker did not rerun on the final revision

- **Reach at 390×844 and 844×390:** Lane C ran M7b's `reach.mjs` unedited (sha `9d8ef06e`), 30 R7 rows. I **re-judged them myself** with the earlier lead's `judge_reach.py`. R7 0 of 30 failing; INT 18 wheel/touch rows failing (22 including taps). Ambience and Mute are reached by CDP touch in every break and paused row.
- **The toast check at 390 dark and 667×375:** covered by Lane C check 4 and 5a above.
- **Ambience and Mute by touch:** real CDP touch taps with 3 toasts up, 80 of 80 activated.
- **`break-reach.spec.ts`:** 7 of 7 passed (`C/check4-close/logs/R7-break-reach-spec.log`).

**Result: covered** (one run per configuration).

### 6. The two "saved" wordings

- `EndSheet.tsx` ("N minutes of focus will be saved") and `src/timer/announce.ts` ("Kettle’s off. N minutes of focus saved.") are **byte-identical to INT** (blobs `a1a1653` and `7ff6535`).
- Both still fire with storage full on R7 (my real-tap said-log).
- R7 made the visible End toast truthful: "12 minutes of focus, kept in this tab: not saved yet", and announces the warning once after it.
- INT says "Saved 12 minutes of focus", and announces the warning repeatedly.

**Result: not worse; better. FOLLOW-UP, owner M1 (I03) for `announce.ts` and owner M2 / the focus area for `EndSheet.tsx`.**

## Defect packet — R7-D1 (BLOCKS; single blocker; owner M7a)

**State and viewport.**
- Break's over with a carried task (task brew finished, then the break finished).
- **667×375 or 844×390, 200 % text** (`html{font-size:200%}`), light or dark.
- Any toast up, most visibly the endless PWA update prompt.

**Steps (R7 :5301).**
1. Use an onboarded profile.
2. Start a brew with a task ("Chapter 3 notes") and finish it.
3. Real tap on Tea time.
4. Finish the break, so Break's over shows with "Mark it done / Put the kettle on / That’s all for now".
5. Have one toast up, for example the update prompt (`toast('A fresh brew of Kettle is ready.', { id: 'pwa-update', duration: Infinity, action: { label: 'Update' } })`, the shape PwaUpdatePrompt uses), or any app toast.
6. With a real mouse wheel or touch on the panel, scroll Break's over to its end (353 px at 667×375; 338 px at 844×390). That is the only way to reach "Put the kettle on" at that size.

**Measured** (`LEAD/runs/L2-toastroom/toastroom{,2}-b39202f.jsonl`, frames `v2-b39202f-667x375-t200-light-update-b-end.png` and `b39202f-844x390-t200-dark-update-b-end.png`).

| Configuration | Panel at its top | Panel at its end | Back at top |
|---|---|---|---|
| 667×375 @200 light | room [90, 257]; update toast whole, 146 px; "Update" hit-testable | room [−12, 19]; 52 px box with **11 px visible**; **"Update" not hit-testable**; the visible sliver overlaps the top bar's "Next: brew 2 of" | whole again |
| 667×375 @200 dark | same | same | same |
| 844×390 @200 light | whole and hit-testable | **26 px visible**, not hit-testable, overlaps "Next: brew 2 of" | whole again |
| 844×390 @200 dark | whole and hit-testable | 26 px visible, not hit-testable | whole again |

Ordinary toasts, from the earlier lead's `close-r7` and Lane C's `closecheck2` rows in both themes:
- A single toast at the end shows **19 of 52 px at 667×375** and **34 of 52 px at 844×390**.
- With three toasts, the two older ones are 0 px (fully off screen).
- Identical on `49ea1de`, which means it comes from round 7's M7b work, not from the Close fix.

**Control INT** (`toastroom{,2}-0d58c5e.jsonl`, 667×375 light and 844×390 light and dark):
- The panel cannot scroll.
- The update toast is **whole (97 px)** and "Update" is hit-testable in every position.
- No top-bar text is overlapped.
- → **Introduced by round 7.** The state "Break's over at its end" exists only since M7b's reach fix.

**Cause.**
- `src/ui/Toast.tsx` `toastLiftBottom()` (l.112) floats the room above the topmost on-screen `[data-toast-above]` element.
- On Break's over that element is the whole action group, `FocusScreen.tsx` l.369 `<div className={s.overDock} data-toast-above="">` (round-4 D4, `9326de5`).
- M7b's scrollable panel (`FocusScreen.module.css` l.154, `.panel:has(> .timer, > .over) { overflow: hidden auto }`) brings that group to the top of the screen at the end of its range.
- `useToastRoom()` (l.160) then hits the `MIN_ROOM_PX = 56` fallback (l.158 and l.178). `innerHeight − lift − 56 ≤ 8`, so the stylesheet top is kept, leaving a 27–42 px room.
- The packet's geometry note ("844×390 @200 %: 26 px on both — pre-existing, r6 residual 3") compares `49ea1de` with the final revision, both of which are round 7. Round 6's residual 3 is Today's 58 px strip, a different room.

**Classification.**
- It hides text (the toasts' own text, and partly the top bar's progress line) and a control (an action toast's action).
- For the endless update prompt it is not transient.
- The narrow exception for transient artifacts does not apply, and Vibei's ruling concerns the storage warning.
- → **BLOCKS.**

**Owner.** **M7a**, as the combined owner and owner of the round-7 room logic in `Toast.tsx`, consulting M7b. Possible directions, the maker's choice:
- when the lift leaves less than one toast, float the stack over the stage column in landscape (it covers no control there);
- or lift only above the actions still on screen;
- or keep `MIN_ROOM_PX` by letting the room start over non-control content.

Whatever the fix, it must keep Close, Ambience, Mute and every Break's over action clear, as measured in item 3.

**Evidence a fix must bring.**
- The `toastroom2.mjs` rows (sha `7123da04`) on the new revision and on INT, at 667×375 and 844×390 @200, light and dark, with 1 and 3 toasts and the update prompt, panel top, end and back.
- The Close / Ambience / Mute sweep (`closecheck2.mjs`) rerun.
- `toast-room.spec.ts` plus a new test for the room at Break's over's end.

**One focused round 8 is appropriate.** The same owner should also fix the test FOLLOW-UP `integrity.spec.ts:1090` (wait for End's toasts).

## Diff review and M1 re-review (verified myself)

**Diff review**, run with `LEAD/tools/diffcheck.sh`, read in full before use (`LEAD/L2-diffcheck-b39202f.txt`):
- `src/lib/storage.ts` (`b73a0c7`), `src/timer` (`748e7fb`) and `src/progress` (`f216f01`) are identical to `51521cf` and to M1's `3f00b57`.
- `integrity.spec.ts`:
  - lines 1–949 have sha `669ff659…` in all three;
  - the placement block starts at l.951 and is the file's last block;
  - every hunk is at line 951 or later;
  - I read the new block (l.951–1144) in full.
- `flow.ts`:
  - `onStorageWriteError(warnSaveFailed)` is kept in `initFlow`, and `warnSaveFailed` calls `raiseSaveWarning`;
  - the hold, toast and anchor path is removed (not dormant), with 0 leftovers in src or tests;
  - the only other change is the End-early toast's wording while saving fails.
- I read `saveWarning.ts`, `SaveWarning.tsx` and the `Toast.tsx` Close fix in full.
- Since `49ea1de`, only `Toast.tsx` and `toast-room.spec.ts` changed.

**M1 behaviour.**
- Lane B's `behave` raw data, 6 rows:
  - the banner is added 25–92 ms after the **first failed write**, never before one;
  - it is kept 13 of 13 s on Today and across Stats / Nook / Settings;
  - it stays for about 6 s after room is made but before any save, which is truthful;
  - it is removed 0.2–1.8 s after the first successful re-save.
- My isolated run: all I01 and I02 data tests pass, plus:
  - `:867` storage full: the brew reaches its summary once, saved data stays intact, and the backup carries the brew;
  - `:903` an unsavable restore is refused and nothing changes;
  - `:1004` ×3 viewports: no warning during the brew, the note is said once, the banner is in the page, Save backup is reachable by Tab, it is kept for 13 s, and it is gone once there is room.

## Evidence audit (raw evidence traced; the lanes ran on Sonnet 5.5 after the relaunch)

| Lane | Raw evidence I traced or re-judged | Result |
|---|---|---|
| A | `A/runs/leadd1-case*-r7` (16 rows), `markdone-cases/*` (17 rows), `r5d1-*r7*` (said counts), `readwarn-{int,r7}`; clip `leadd1-case1-r7/clip-b39202f-375x667-t200-light.webm` (frames 620/660/720 extracted and opened); frames `r7-setupb/*0top.png`. Probe hashes OK, except `analyze.py`, an analysis script edited after its hash was taken | Consistent with the receipt. "0 announcements" in R5-D1 rows explained (see item 2) |
| B | `B/logs/read/R7` + `rl/read/R7*` (77 rows, re-judged: 76 meet, the exception is 667×375 @200 with 100 px notches); `rl/sum4` (footer gaps); `behave`; `rl/episodes`; `cover-R7.jsonl` (5-summary-toasts); `markdone`; frames `cover/R7-*-5-summary-toasts.png` opened. Probe hashes OK | Consistent |
| C | `check1-reach/*.jsonl` (re-judged); `check2-residuals/resid.jsonl` (items 3, 13, 16, 18, 19, 11 rows); `resid3-flash/resid3.jsonl` (1d-2); `check4-close/*/closecheck2-*.jsonl` (aggregated); `BAND-375x667…png` and check-4 frames opened. Probe hashes OK | Consistent |
| D | `pw-chromium.log` and `.json` (run 1 and relaunch), `pw-timer-pwa.log`, `pw-rerun.json`, `tsc.log`, `vitest.log`, first-instance failure `trace-fail/` (parsed); cap-d `meta.json`; captures opened (below) | Consistent, except one attribution (below) |
| Maker (M7a/M7b) | Packet read: (b), the Close fix, the geometry table, limits. Not relied on: every claim above rests on lane or LEAD runs on :5301 | The geometry note on the 26 px room is mis-classified (see R7-D1) |

**Lane D's attribution corrected.** Lane D attributed "R7's Break's over toast stack sits higher than INT" to round 7's toast-room change. That is not right:
- The toast boxes at Break's over with the panel at its top are identical on `49ea1de` and R7.
- The difference from INT is `9326de5` (I04 round 4, D4), which `git merge-base` confirms is not in INT.
- It is round 6's item 9, ACCEPTED, carried over below.

## Visual gate (REFERENCE → BEFORE → AFTER, opened at full size)

**REFERENCE:** K01 `01-home.png`, K02 `07-summary.png`, K09 `live-settings.jpg`.

**BEFORE (INT) and AFTER (R7):** Lane D cap-d captures with a frozen date, plus lane and LEAD frames.

| Viewport | Captures and frames | What they show |
|---|---|---|
| 390×844 | L100 a1, BEFORE and AFTER | The banner sits under the greeting in honey tint, nothing overlaid. INT shows a dark toast over the composer |
| 390×844 | L100 c1 | The note is one row |
| 390×844 | D200 b2 | Settings with the banner after the backup tools |
| 375×667 | L200 a1 and a2 | The banner is below the fold on arrival; a2 shows it whole |
| 375×667 | L200 c1 and c2 | Note and end frame |
| 375×667 | L200 d2 | Break at its end, with wrapped captions |
| 375×667 | L200 e1, R7 and INT | Close clear; INT's actions are below the edge |
| 375×667 | L200 f2, R7 and INT | Nothing over the brew |
| 375×667 | D100 a1 | Banner in dark theme, legible |
| 844×390 | D200 a1 | Banner at the head of the scrolling column |
| 844×390 | D200 d4 | Break's over at its end |
| 844×390 | L200 c1 and c2, plus INT c2 | Note and end frame |
| 1440×900 | D100 a1 and L200 a1 | Banner heading the right column |
| Lane frames | B `5-summary-toasts` (375/390, @100/@200) | Reward toasts over the note |
| Lane frames | C `BAND-375x667` | Shade on blank background |
| Lane frames | C check-4 control and R7 frames | As in item 3 |
| Lane frames | A setup b `0top` | Banner already showing before any input |
| LEAD frames | `toastroom2` end frames | R7-D1 |
| LEAD frames | `close-r7` (667 and 844 end) | Toast room at the end |
| LEAD frames | Traces of both :1090 failures | Screencast about 2 s stale |

**Judgement.**
- The banner is calm and on brand: honey tokens, contrast 12.16:1 in light and 10.34:1 in dark (Lane B), no animation. It sits in flow and nothing is laid over the brew.
- The preserve list holds: K01 Today with the docked start, the K02 compact summary with the footer cleared, and K09 Settings.
- The note shares the reward card's honey tint. It is set apart by its info icon and its words. ACCEPTED for tone.
- **Visual gate: passes for the banner, the note and M7b. It fails on R7-D1 frames.**

## Wave 1 regression (Lane D, plus mine)

**Tests on `b39202f`:**
- tsc exit 0.
- vitest 27/27 files and 267/267 tests (first instance, same build).
- **Playwright chromium 72/72** (relaunch, 09:48–10:03, workers 2, under load). The integrity tests `:768` and `:1090` both passed in it.
- **timer-harness + timer-app + pwa: 29 passed, 2 skipped by design, 0 failed.**
- I read all of these from the raw logs and JSON.
- Known intermittent failures, both test-side: `:768` (pill read race, 3 failures seen on R7, 0 of 5 on INT) and `:1090@1440` (3 of 10).

**Captures:**
- cap-d covers every round-7 state in all 16 configurations on both sides. The e0/e2 toast-rect states exist in 4 of 8 t200 configurations.
- Standard set:
  - light at 390×844, 375×667 and 1440, by Lane D: differences explained;
  - **dark at 390×844, 375×667 and 1440, captured by me: 21/21 states on both sides at all three sizes, exit 0 (R7 10:52–11:05, INT to 11:11 UTC; Lane D's `std2.sh` and `std-freeze.mjs` unchanged, `capture.mjs` unchanged; matrix from D's `stdmatrix.cjs`). Every difference over 0.5 % was opened or attributed, and none is a round-7 build difference: 10-break-over = D4 (r6 #9); 03-focus-mid = the 7 s zen fade on one side (same countdown); 14-summary-first at 390 dark = the summary sheet's rising phase (17 css px; 375 dark is 0 %); 11/11b/13/17 = scene or 3D animation phase; 1440 14/16 = not the same screen (R7's 16 shot mid-route-change), as in Lane D's light 1440 run; 18 = page-height flip. 01, 01b, 07, 08, 12, 15 and 19 are 0 % (or ≤ 0.04 %)**;
  - 390×844 dark reduced-motion: not run.

**Judgement:**
- Because the verdict is REJECT, this regression does not stand for a merge of tree `6db18ad`.
- The round-8 revision will have a new `kettle/src` tree and needs its own Wave 1 run.
- On this tree, the test regression is complete and green except for the two documented test-side flakes. If Vibei overrules R7-D1, it would stand as the Wave 1 regression for a merge with a matching tree, provided those two flakes are recorded as known.

## Residual table

Rule:
- **BLOCKS:** introduced or worsened by round 7.
- **FOLLOW-UP:** present on INT and not worse; cause, files and owner recorded.
- **ACCEPTED:** not a defect; reason given.
- **Exception (Vibei):** a transient visual artifact that hides no text or control may be FOLLOW-UP.

**New in round 7, or a new form:**

| # | Item | Evidence (verified by me unless marked) | Class | Cause / files / owner / reason |
|---|---|---|---|---|
| R7-D1 | Toast room at Break's over's end, 667×375 / 844×390 @200: toasts 11–34 of 52 px visible; "Update" unreachable; overlaps the top bar's progress line | LEAD `toastroom{,2}`; `close-r7`; C check 4d; INT control | **BLOCKS** | See the defect packet. Owner M7a |
| R7-1 | The banner first appears at "Mark done" while the page is scrolled: added above the view, page held still under the finger | A rows, B markdone, LEAD said-log | **ACCEPTED** (Vibei's ruling) | Announced exactly once with the full text |
| R7-2 | "Mark done" with the banner already showing | A setup b ×7; LEAD setup b ×4 | **ACCEPTED** | Never scrolled a visible banner off screen; no re-announcement |
| R7-3 | Banner below the fold on arrival at 375×667 @200 (top 687–737 of 667) | LEAD said-log, B read, D a1 | **ACCEPTED** (ruling) | Said once; the End toast on screen says "…not saved yet" |
| R7-4 | End's toasts float over the in-page banner on arrival at 844×390 @200 (164 frames); ordinary toasts over the banner's first line at 667×375 @200 (C: 5–12 frames) | A smoke b; C resid (item 13) | **FOLLOW-UP** | Toasts float over page content (round-6 items 8 and 13 class). INT overlays its own warning and often shows none at landscape @200. Said once. Owner M2 (I04 toast placement) |
| R7-5 | The summary note is covered by reward toasts at phone sizes (Save backup centre covered at 375/390 @200; box overlap at @100) | B cover raw, frames | **FOLLOW-UP** | Toast lift above the footer lands on the summary's lower content (INT: toasts over the heading and sub-line, round-6 item 8). The note is said once. Owner M2 + M7a |
| R7-6 | Shade band 12–19 device px at the panel's bottom during the break / Break's over entrance at 100 % | C 1d pixels; C resid3 real clock 146–292 ms | **FOLLOW-UP** (exception) | Transient, painted behind content (hides nothing), no change in behaviour. `FocusScreen.module.css` `.panel:has()` background against the entrance translate (`FocusScreen.tsx` l.351 / l.389). Owner M7b |
| R7-7 | `integrity.spec.ts:1090` @1440 intermittent | LEAD diag + repeats; D run 1 | **FOLLOW-UP (test)** | The test taps 0.8 s after End; End's toast is over Mark done (INT: for its whole life). Owner M7a; fix in round 8 |
| R7-8 | Focus drops to `body` when the banner leaves on recovery with Save backup focused | C c6 | **FOLLOW-UP** | Same class as round-6 item 16 (INT drops focus when its warning is withdrawn), with a narrower trigger. `SaveWarning.tsx`. Owner M7a |
| R7-9 | A second failure episode within 60 s re-shows the banner without announcing it | B episodes | **FOLLOW-UP** | INT shows nothing at all in that case. `saveWarning.ts` `ANNOUNCE_EVERY_MS`. Owner M7a |
| R7-10 | After a tap on Pause at 375×667 @200, Resume is centre-hit-testable but its lower rim is under the edge | C 1a | **FOLLOW-UP** | INT: Resume wholly below the edge and unreachable. `FocusScreen.tsx` paused anchoring. Owner M7b |
| R7-11 | 667×375 @200: with 100 px wheel notches, 4/7–4/8 banner lines and Save backup never hit-testable. Keyboard focus on Save backup lands under the docked start | B 77 rows; C read-100; LEAD `savereach`, `focusobscure` | **FOLLOW-UP** | The ~60–78 px strip above the 200 % docked start (round-6 item 3). INT: no warning drawn at that size (B), or its Save backup focused off screen (LEAD). 7 composer controls are focus-obscured identically on INT and R7. `Home.module.css` l.416 `scroll-padding-bottom`. Owner M2 / I04 |
| R7-12 | `integrity.spec.ts:768` pill read race | LEAD isolated + traces + ×4 control | **FOLLOW-UP (test)** | Test code identical to M1's. Owner M1 (test) |
| R7-13 | "Saved" wordings: End sheet and `announce.ts` | LEAD said-log R7 vs INT | **FOLLOW-UP** | Byte-identical to INT; R7's End toast is truthful. Owners M1 (`announce.ts`), focus area (`EndSheet.tsx`) |
| R7-14 | 1440 focus: Ambience dialog still open 0.7 s after Escape (one row) | C check 4 raw | **UNKNOWN** | Sheet and shortcut code not in round 7's diff. Re-check in round 8's sweep |
| R7-15 | The note shares the reward card's honey tint | frames; B tone | **ACCEPTED** | Calm by brief; the info icon and words set it apart; contrast 12.16:1 / 10.34:1 |

**Round 6's residuals, re-classified on R7 against INT** (Lane C check 2 raw rows, re-read, plus mine):

| r6 # | Item | Class on R7 |
|---|---|---|
| 1, 2, 14, 17, 18 | Warning-toast Tab, withdraw, re-mount and route-change items | **RESOLVED.** There is no warning toast. The controls reproduced on INT this session (C, LEAD said-log) |
| 3 | Coarse notches in the 58 px strip at 667×375 @200 | **FOLLOW-UP**, unchanged class (see R7-11). Owner M2 / I04 |
| 4, 6 | Short rooms lead with the warning; the warning fades without sliding | Moot: there is no warning toast |
| 5 | Older toasts' boxes below the room | **ACCEPTED**, unchanged |
| 7 | Visual order differs from DOM order | **ACCEPTED** for sighted users; real assistive technology **BLOCKED** |
| 8 | Toasts over the countdown and status line | **FOLLOW-UP**, identical (C t8, B cover). Owner M2 / M4 (I10) |
| 9 | Break's over toasts above "Mark it done", over the title and sentence (D4) | **ACCEPTED**, carried. Lane D's std state 10 and cap-d e0/e1 differences are this |
| 10 | 1440 lift lag after End | **FOLLOW-UP**. Now also causes R7-7. INT worse. Owner M2 |
| 11 | 150 % over-width; 200 % CLS with slow fonts | **FOLLOW-UP**. R7 = R6; all-entries CLS lower than INT. Owner M2 / I14 |
| 12 | Break / Break's over controls below the edge at 200 % | **RESOLVED.** R7 0/30; INT 22/30 |
| 13 | Toasts over the warning's first line | **FOLLOW-UP**, in a new form (R7-4) |
| 15 | a11y "short screen" with Settings entries (UNKNOWN) | **RESOLVED in session.** R7 3/3 (C) and D's full run; INT 3/3 failed on D4 |
| 16 | Focus to `body` on withdraw | **RESOLVED** for round 6's trigger. The narrower recovery trigger is R7-8 |
| 19 | After "Back to your brew", the warning over Add 5 / Pause / End | **RESOLVED** at 100 % (INT 74 frames, R7 0). At 200 % **UNKNOWN**: not run validly; no overlay exists by construction |
| 20 | "Change brew length" styled as a link | **ACCEPTED**, unchanged |
| 21 | 375 status-bar row | **ACCEPTED** (C 3.1: code × date data, the intended I04 tight step) |
| 22 | Chrome hidden at 13 / RM 04 (UNKNOWN) | **ACCEPTED** (C 3.2: zen fade timing, identical code, 0 px at equal page time) |
| 23 | "Recipe done" toast at 10-break-over | **ACCEPTED** (C 3.3: date and 3.2 s life; D4 placement) |
| 24 | 667×375 empty-looking room (UNKNOWN) | **RESOLVED as stated** (the container is gone). GPU raster starvation not retested |

## Follow-up list (owners)

| Owner | Follow-ups |
|---|---|
| **M7a** | **R7-D1** (blocker, round 8); R7-7 `:1090` test timing (round 8); R7-8 focus on recovery; R7-9 announcement of a second episode within 60 s; R7-5 (with M2): keep reward toasts off the summary note |
| **M7b** | R7-6 entrance shade band; R7-10 Resume rim after Pause at 375×667 @200 |
| **M2 / I04** | r6 #3 and R7-11 (the 200 % landscape strip; focus scroll-padding against the docked start); r6 #8 toasts over the readout; r6 #10 / R7-7 lift lag at 1440 after End; r6 #11 CLS and over-width; R7-4 toasts over in-page content |
| **M1 (I03)** | R7-12 `:768` pill read in `integrity.spec.ts`; R7-13 `announce.ts` "saved" wording while saving fails |
| **Focus area** | R7-13 End sheet "will be saved" wording while saving fails |

## Verified myself, and taken from lanes

**Verified myself:**
- revision and tree;
- servers, re-verified;
- the diff review;
- the isolated integrity run and its diagnosis (traces, repeats, INT control);
- the `:1090` diagnosis (diag, repeats, INT control);
- item 2 (my said-log, 10 runs; my setup-b, 4 configurations; Lane A and B raw data re-read);
- item 4 (raw gaps and frames);
- item 6 (code identity and the said-log on R7 and INT);
- the R7-D1 measurements and INT control (`toastroom`, `toastroom2`);
- Save-backup keyboard reach and focus obscuring (`savereach`, `focusobscure`, R7 and INT);
- the Lane D attribution check (rows from `49ea1de` and R7, and `git merge-base`);
- the visual gate frames listed above;
- the Wave 1 logs and JSON.

**Taken from lanes after tracing their raw evidence:**
- C: the Close / Ambience / Mute sweep (aggregated by me), reach (re-judged by me), the round-6 residual rows, 1d pixels and 1d-2;
- B: reading (re-judged), Settings, behaviour, episodes, tone, the summary cover;
- A: LEAD-D1, R5-D1, readwarn and the D-series spec runs;
- D: Playwright and capture runs.

**Not relied on:** the maker's own claims. The earlier lead's notes were treated as leads and re-checked.

## BLOCKED / UNKNOWN (never PASS)

- **BLOCKED:**
  - real phones and touch hardware;
  - real wheel notch sizes;
  - real OS text-size settings (large text here was `html{font-size}`);
  - real assistive technology (announcements were counted as live-region mutations, not heard);
  - WebKit and Firefox;
  - GPU timing (all runs were SwiftShader under shared load).
- **UNKNOWN:**
  - R7-14 (Ambience dialog after Escape at 1440, one row);
  - r6 #19 at 200 %;
  - Lane D's standard captures 18-nook-earned (page height flips between runs) and 1440 states 14/16 (not comparable);
  - 390×844 dark reduced-motion standard capture (not run).
- **Coverage notes:**
  - R5-D1 by touch at 375×667 had no control established (Lane A);
  - Lane C's 1a and check 4 ran once per configuration;
  - the R7-D1 measurements ran once per configuration (3 R7 configurations in v2 plus 844 dark in v1; INT 2 configurations twice).

## Files

- **Notes:** `round7-review/LEAD/L2-NOTES.md`. Drafts: `L2-VERDICT-DRAFT.md`, `L2-BODY-DRAFT.md`, `L2-RESIDUALS-DRAFT.md`. Diff check: `L2-diffcheck-b39202f.txt`. Server verification: `L2-server-verify.txt`.
- **Runs:**
  - `round7-review/LEAD/integrity-isolated/` (`run.log`, loadavg, `expimp.log`, `expimp2.log`, `md1440.log`);
  - `round7-review/LEAD/runs/L2-{saidlog,setupb,md1440diag,liftlag,savereach,focusobscure,toastroom}/`.
- **Probes** (git-ignored): `/home/user/wt/rv7-int/kettle/.tmp/LEAD2/` (`saidlog.mjs`, `savereach.mjs` (v2, `608d8cb9`), `md1440diag.mjs`, `liftlag.mjs` (`bef126e3`), `focusobscure.mjs`, `toastroom.mjs`, `toastroom2.mjs` (`7123da04`), and `a4/markdone-a4.mjs` (Lane A's, `561523f7`)).
- **Standard dark captures:** `/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/r7/LEAD2/std/` (with `diff-std/` and `std-diff.json`).
