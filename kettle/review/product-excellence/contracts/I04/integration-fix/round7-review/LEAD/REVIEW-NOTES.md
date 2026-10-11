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
