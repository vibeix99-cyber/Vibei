# Round 8: packet gate (orchestrator, 2026-10-11 18:10 UTC)

**Packet:** `pe/r8-toastroom@2c3172c`, `/home/user/wt/r8/kettle/review/product-excellence/contracts/I04/ROUND8-READY-FOR-REVIEW.md` (Maker M8, Opus 5.5, newly launched).

| Gate item | Result |
|---|---|
| Revision | `2c3172c` (final code `f3c9357`). `kettle/src` tree `42e106daaf0628ee8429fb6131ab29848931f367` |
| Trial merge | **R8 = `9ff0d04`**: `61a60b2` (integration HEAD) + `2c3172c`. Detached worktree `/home/user/wt/r8-trial`. Its `kettle/src` tree is `42e106d`, the same as the branch's |
| Changed files vs `7ba0d98` (round-7 combined) | `src/ui/Toast.tsx`, `src/ui/Toast.module.css`, `src/screens/focus/FocusScreen.tsx`, `src/screens/focus/FocusScreen.module.css`, `tests/toast-room.spec.ts`; plus review files. **Untouched:** M1 (`storage.ts`, `timer/**`, `progress/**`, `flow.ts`), the banner (`SaveWarning*`, `saveWarning.ts`), the summary note |
| Cause note | Present (packet) |
| Control `b39202f` reproduced R7-D1 this session | The lead's `toastroom2.mjs` (sha `7123da04`): 11/52 px at 667×375 and 26/52 px at 844×390; Update not on top. The new spec fails 2/2 on `b39202f` |
| Acceptance on the fix | 24 runs (667×375 and 844×390 × 100/150/200 % × light/dark × wheel/touch, at top, middle and end, with 1–3 toasts including the update prompt): 0 covered frames out of 44,299, 0 toasts not whole, 168/168 real taps activated. Close/Ambience/Mute sweep: 0/6,506 covered, 40/40 taps. Portrait 32/32 and desktop 12/12 identical to `b39202f` |
| Tests | tsc exit 0; vitest 267/267; chromium 74/74; timer-harness/timer-app/pwa 29 passed, 2 skipped by design (`timer.spec.ts:295`, `:439`) |
| Captures | 48 full-size images, frozen clock, same session: 24 BEFORE (`b39202f`) and 24 AFTER (`f3c9357`), at 667×375 and 844×390 @200 light/dark, plus 375×667 and 390×844 @200 light |
| Maker's disclosures for the reviewer | Two toasts at 100 % in landscape now dock over the stage when they can't fit above the controls. A folded toast hides its icon. A docked update prompt stays docked after scrolling back to the top. Two probe runs lost their page to a dev-server reload (one rerun). Portrait keeps `b39202f`'s 3-toast limit at 375×667 @200 |
| Archive | `archive/pe-r8-toastroom-2c3172c.incremental.bundle` (prerequisite `7ba0d98`) |

**Servers for the review** (orchestrator-owned; dev servers verified with `verify.sh`, previews by main-js hash):

| Server | Revision | Port |
|---|---|---|
| **R8 dev** | **`9ff0d04`** | **:5306** |
| **R8 preview** | **`9ff0d04`** | **:5326** |
| R7 dev / preview (R7-D1 control) | `b39202f` | :5301 / :5321 |
| R5 | `20671eb` | :5302 |
| INT dev / preview | `0d58c5e` | :5303 / :5323 |
| `e866118` | `e866118` | :5304 |
| Unfixed Close control | `49ea1de` | :5305 |

**Gate: PASSED.** The review is next: a new lead plus Lane 1 and Lane 2, 75 minutes each.
