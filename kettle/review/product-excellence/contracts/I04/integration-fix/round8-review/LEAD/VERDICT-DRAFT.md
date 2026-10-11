# SUPERSEDED by contracts/I04/CHECKER-integration-fix-r8.md (final: APPROVE). Interim draft kept for the record.

Status: **interim, no verdict yet.** Pending:
1. `runs/navdiag/` — who destroys the page's execution context (queued in `slots`, behind Lane 2's 2-slot capture job):
   `accept-nav.mjs` (M8's `accept.mjs` b65020ab + CDP Network/Page/Inspector logging written as events arrive, 4 s
   post-error state incl. `performance` navigation type, browser stderr via `DEBUG=pw:browser`) ×3 on R8 844×390 @200
   wheel, ×1 on b39202f; then the constructed two-action-toast rows at 375×667 @200 (R8, b39202f, INT); then the
   Ambience-sheet controls (b39202f 844 D; INT 667 L and 844 D); then the 1440 @200 summary controls (b39202f, INT).
2. Lane 1 and Lane 2 receipts.

## Revision
R8 = `9ff0d04` (`61a60b2` + `2c3172c`), `kettle/src` `42e106daaf0628ee8429fb6131ab29848931f367`
(= `2c3172c:kettle/src` = `f3c9357:kettle/src`). Only the 5 diff files differ from `b39202f` outside review files.

## Established so far (my own runs unless marked)
- **R7-D1 control reproduced by me** (toastroom2 7123da04, 18:22–18:23): b39202f 667×375 @200 L end 52/11 px, Update
  not on top, over "Next: brew 2 of"; 844×390 @200 D end 52/26 px, same. Lane 1 reproduced it too (18:08–18:10).
- **R7-D1 fixed on R8**: toastroom2 4 configs: end 186/186 (667) and 146/146 (844), Update on top, docked, no bar words;
  back at top whole. dockcheck: every docked sample whole, actions on top, nothing under (text or control). Lane 1
  (accept ×8, l1dock ×4): 0 covered-control frames on R8; taps all activated (pre-audit).
- **Portrait unchanged**: my 375×667 @200 rows identical to b39202f; M8 geom 32/32 (raw re-read).
- **Desktop 1440 @200**: never docked; whole; = M8 geom-desktop.
- **Live region**: li additions = toasts raised; 0 text / 0 other mutations through docking and folding.
- **Landscape summary**: docked, nothing under; b39202f covers "25 minutes brewed" with Undo 4–19/146 px, not on top.
- **Focus running**: docked states clear the countdown (b39202f covers digits + status line at every n).
- **Ambience sheet over 3 toasts**: the sheet voids the dock; the stack returns to the old room and is drawn above the
  sheet (title, text, Rain; at 844 also its Close and Turn on). b39202f 667 identical in the open-sheet sample.
- **Statusbar flake** (Lane 2 run 1, `statusbar.spec.ts:106` dark): snapshot shows Today's lazy route not yet rendered
  (empty `main`) 7.5 s in; passed on rerun; Today untouched by round 8.
- **ResizeObserver loop errors** in `dev-r8.log` (38): all during Lane 2's chromium run against :5306; none from my or
  Lane 1's probe pages (window-error counter {}).

## Leaning (to confirm after pending items)
- Disclosure 1 (dock at 100 %): ACCEPTED — improvement over b39202f (n3 over "Next: brew 2 of 4") and INT (over "Mark it
  done"); nothing under the docked stack.
- Disclosure 2 (fold hides icon; also clamps text): FOLLOW-UP — 3 toasts at 200 % landscape only; every action on top;
  full text in the DOM and announced once; b39202f 0 px / slivers; INT cuts the update prompt over the bar.
- Disclosure 3 (stays docked at top): ACCEPTED — by design; covers only the aria-hidden stage art.
- Disclosure 4 (reloads): OPEN — "Execution context was destroyed" 1× in my 22 contexts (R8 844×390 @100), 3/8 in
  Lane 1's R8 844 @200 wheel runs, 1+3 in M8's; 0 on b39202f this session and none anywhere in round 6–7 evidence; no
  navigation request / console / crash logged by Lane 1; no OOM; no app reload path in dev; server hmr off, watch off.
  **If R8-caused → BLOCKS.**
- Disclosure 5 (portrait 3-toast limit): FOLLOW-UP — identical on b39202f; the update prompt whole and actionable at every
  position; INT's same state covers Close; a real "Mark it done" on Break's over raises no toast (only the update
  prompt can be an action toast there).
- Transient "Cozy level 5!" clip ≤ 0.5 s in the docked stack when a 4th toast arrives (Lane 1 1.5): FOLLOW-UP (same
  state on b39202f/INT clips toasts permanently).
- Toasts above the Ambience sheet: FOLLOW-UP if b39202f/INT match at 844 (pending).
