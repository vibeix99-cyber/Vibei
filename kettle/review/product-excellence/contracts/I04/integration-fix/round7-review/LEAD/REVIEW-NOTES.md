# LEAD r7: review working notes (binding revision R7 = trial b39202f, src 6db18ad)

Started 03:24 UTC after GATE PASSED. Servers verified by me with `/tmp/rv7-servers/verify.sh` + `?raw` checks:
R7 :5301 VERIFIED (b39202f, src 6db18ad; 6 banner files OK); unfixed control :5305 VERIFIED (49ea1de, src 939711c; 6
banner files OK); R5 :5302, INT :5303, e866118 :5304 VERIFIED at 02:22. My :5310 (same 49ea1de) stopped at 03:26.

## 1. Diff review (verified myself)

`LEAD/tools/diffcheck.sh /home/user/wt/rv7-r7 b39202f`:
- `src/lib/storage.ts` b73a0c7, `src/timer` 748e7fb, `src/progress` f216f01 = `51521cf` = M1 `3f00b57`. Empty diff.
- `tests/integrity.spec.ts`: lines 1–949 sha 669ff6598fc1ad85 identical in `51521cf`, `3f00b57`, `b39202f`; the replaced
  block starts at the header on line 951 and is the file's last block; every hunk is ≥ line 951.
- `flow.ts`: `onStorageWriteError(warnSaveFailed)` kept in `initFlow()`; `warnSaveFailed` → `raiseSaveWarning(e)`. Removed:
  SAVE_TOAST_ID, TOAST_ZONE_PX, SETTLE/WATCH, hold state, ritualOnScreen, protectedUnderToasts, warningWouldBlock,
  toastOnScreen, showSaveWarning, watchSaveWarning, recheckSaveWarning + its 3 call sites. Only other change: end-early
  toast copy while failing. No leftovers anywhere in src/tests (`git grep` 0).
- R7 src = 7ba0d98 src = 980ef2a src (6db18ad). M7b's 4 files blob-identical to 38fc9c6.
- Since `49ea1de`: only `src/ui/Toast.tsx` (Close fix: `toastRoomTop()` + `useToastRoom()`, layout effect, MIN_ROOM 56)
  and `tests/toast-room.spec.ts` (+2 Close tests).
- Page-level `<header>`s in the app: FocusScreen top bar (not rendered on the summary), WelcomeScreen, the dev UI kit
  Gallery. Shell pages are inside `<main id="main">` → `ScreenHeader` excluded. So Today/Stats/Nook/Settings/summary
  rooms unchanged by construction; the brew/break/Break's over rooms start under the bar when a bar control is above
  the toast column.

## 2. Integrity timeout (gate note 1)

The final full-run failure is NOT a URL-poll timeout: it is `integrity.spec.ts:820`
`expect(profilePills).toEqual(pillsBefore)` — "184 leaves" vs "2,261 leaves". The asserts before it (sessions, ledger,
leaves, cozies, badges, settings equal) passed. `profilePills` reads `document.body.innerText` right after
`navigate('/settings')`; "184 leaves" is Today's status-bar text "Cozy level 12, 184 leaves to the next" (same text on
INT, StatusBar.tsx unchanged since r5) from the outgoing Today layer during the cross-fade. → test race under load, not
data. Pending: Lane D full-suite result.

## 3. M7a raw-evidence audit (verified myself)

- LEAD-D1 (`runs/lead-ap`, `lead-pp`): re-judged from `ev`/`frames`: e866118 11/10 ×4 configs (said 11), 1/0 @150 375,
  2/1 and 3/2 @100 (entry re-mounts), 1/0 @1440; pwa 28/27 and 29/28. Final (:5206, src 6db18ad) 1/0 in 8/8, pwa 1/0
  ×2, banner full opacity in every judged frame, drift 0, said 1. Matches packet. Probe diff vs round-6 original read:
  only measurement + no-seed change; still uses `scrollIntoViewIfNeeded` for setup before recording.
- R5-D1 (`runs/r5d1-*`): 10 rows per config/revision; banner 1/0 in all 30 final rows; R5 1/10, 2/10, 2/10 failing.
- Close (`runs/close/closecheck-*.jsonl`): control 21/35 rows covered (Close in every 375 @200 row; "Mark it done" entry
  frames at 375/390 @100); final 2/29 rows covered, both "Mark it done" 2–4 entry frames at 390×844 @100. Matches.
  Caveat: FINAL series started 02:49:30, 11 s after commit 980ef2a (02:49:19); tree served is not provable from the
  log → not counted as binding; my own runs on :5301 are.
- Test logs (`tests-final-*.log`) are git-ignored (exist in /home/user/wt/r7a only).

## 4. Draft classification (to finalise)

New in R7:
- Banner above the view after a late failure while scrolled (375×667 @100 −200 px, @200 −772 px; 844×390 −141). Design
  consequence of option B (in flow + "nothing moves under the finger" anchoring = browser scroll-anchoring behaviour).
  Mitigations verified in code: new tab screen → `scrollTo(0)` (Shell.tsx:39), active-tab tap → top; announced once;
  Settings; next summary note. Candidate ACCEPTED.
- Banner below the fold at 375×667 @200 on arrival: in-flow at 200 %; INT there is D3 (unreadable). Candidate ACCEPTED.
- End-early "Saved" if End's own progress write is the first failure (timer idle write may fit) — Lane B truth.mjs.
  INT always "Saved" → at worst FOLLOW-UP.
- End sheet "will be saved" / announce.ts "saved": pre-existing → FOLLOW-UP (I03 owner M1).
- Integrity export→import pill read race: test race under load (see §2) → pending Lane D.

## 5. My own runs (binding: R7 :5301 / controls in this session)

- **Close control, :5305 `49ea1de`, 03:57:59** (`runs/close-ctl5305/`): 375×667 @200 light Break's over (task), wheel to
  236/236, 3 toasts → **Close COVERED 152/153 frames (134/134 settled), not hit-testable**; 1 toast clear; at top clear.
  (Also reproduced on my own :5310 at 02:25: 154/155.) → control reproduced this session.
- Slot gate: LEAD waited 03:25–03:58 (Lane A held all slots); orchestrator switched to fair share at 03:58.
- **Close on R7 :5301** (04:24–): 375×667 @200 light and dark, Break's over (task) at top and wheeled to 236/236, paused
  break at top and 177/177, 1 and 3 toasts → **0 covered frames in every row**; with 3 toasts at the end the list clip
  starts at y 58 (Close bottom 54), top toast 90/138 px visible (scrolls inside the room).

## 6. Lane trace checks

- **C check 1a** (reach): `C/check1-reach/{R7,INT}-reach.jsonl` re-judged with `LEAD/tools/judge_reach.py` + tap rows:
  R7 0/30 failing; INT 18 wheel/touch + 4 tap = 22/30. Probe sha256 = M7b's `9d8ef06e…`. Frames opened:
  `R7-375x667-dark-t200-paused-touch-bottom.jpg`, `R7-844x390-dark-t200-over-carried-wheel-bottom.jpg` (match).
- **A check 2** (LEAD-D1): `A/runs/leadd1-case1-r7/markdone-b39202f.jsonl` 12 rows: banner 1/0, min opacity 1, page top
  constant (687 @375; 16 in the landscape column), in view 0 frames, said 1; control `leadd1-case1-ctl-a2` 11/10 ×4.
  Frame opened: `b39202f-844x390-t200-light-t1.3.png` (only "Crossed off · Undo" visible).
- **C check 2** (residuals): `C/check2-residuals/resid.jsonl` rows re-read: tab-t100 R7 press 5 vs INT 15 (INT 2 adds/2
  removals); tab-t200 R7 press 5 vs INT never in 45 (703 gone/faded frames); read-100/53 R7 1/0/1 vs INT 6/6/6, 7/7/7;
  back-t100 INT 74 hit frames over session controls vs R7 0. Match C's table.
- **C 1d-1 (new, R7 only):** 12–19 device-px bottom shade during the break / Break's over entrance at 100 % (entrance
  translate y 12/14 makes the panel scrollable for the entrance; frozen-clock shots hold that frame). 1d-2 duration pending.
- **C item 3 (667×375 @200, coarse wheel):** R7 53 px: 8/8 lines + Save backup; 100 px: 4/8 lines, Save backup never wholly
  in view; INT this session 7/12 + Save backup at both. Same class as r6 follow-up 3 (60 px strip above the docked start).
