# DRAFT (interim, before lane receipts) — round-8 lead verdict skeleton

Status: interim. No verdict yet. Pending: the page-navigation diagnosis (`runs/navdiag/`), the sheet / summary / focus
rows of `runs/dockcheck/`, the constructed two-action-toast rows at 375×667 @200, and both lane receipts.

## Revision
R8 = `9ff0d04` (`61a60b2` + `2c3172c`), `kettle/src` `42e106daaf0628ee8429fb6131ab29848931f367`
(= `2c3172c:kettle/src` = `f3c9357:kettle/src`). Only 5 files differ from `b39202f` outside review files.

## Leaning, per item (to confirm)
- R7-D1: FIXED (control reproduced by me and by Lane 1; R8 docked, whole, on top, no bar words in every row so far).
- Disclosure 1 (dock at 100 %): ACCEPTED — nothing under the docked stack; INT covers "Mark it done" in the same state.
- Disclosure 2 (fold hides icon; also clamps the message): FOLLOW-UP — transient (3 toasts at 200 % landscape), every
  action on top, live region read the full text; b39202f showed those toasts 0 px; INT cuts the update prompt over the bar.
- Disclosure 3 (stays docked at top): ACCEPTED — by design, no jumping, covers only the aria-hidden stage art.
- Disclosure 4 (reloads): OPEN — 4+ "Execution context was destroyed" on R8 this session (M8 ×4 incl. superseded,
  Lane 1 ×3, LEAD ×1), none in round 6/7 evidence, no app/dev-server reload path found. If R8-caused → BLOCKS.
- Disclosure 5 (portrait 3-toast limit): FOLLOW-UP — identical on b39202f; update prompt whole & actionable at every
  position; INT's same 3-toast state covers Close; in the real app Break's over raises no second action toast.
