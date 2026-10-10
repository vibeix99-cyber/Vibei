# Round-6 combined review: REJECT. Defect packet, causal analysis and architecture options

**Prepared by:** the orchestrator, 2026-10-10 23:10 UTC.
**Round 7:** not started. This is a decision document for the user.

**Verdict:** **REJECT** of trial merge `e866118` (integration `bc48a10` + `pe/w1-fix-m2@51521cf`; `kettle/src` `05bb3f8`).
The independent lead Checker issued it: newly launched, Opus 5.5, and it built nothing it reviewed. Its receipt is
`contracts/I04/CHECKER-integration-fix-r6.md`.
**Nothing was merged.** The integration branch's app code is still `0d58c5e`.

## Defect packet: LEAD-D1 (blocks)

| Field | Content |
|---|---|
| Defect | When an older toast carries an action, the storage-full warning comes **second** in the short-room toast stack. Its layout box sits 58–305 px below the room, over Today's docked "Put the kettle on". M1's approved hold rule removes the warning and re-shows it, still second, about twice a second. |
| Introduced by | Round 6 (`Toast.module.css`, `.list:has(.action) > .toast:has(.action) { order: -1 }`). Every action toast gets the same `order`, so DOM order decides the tie and the older toast leads. INT (`0d58c5e`) and R5 (`20671eb`) show the warning steadily in the same state. |
| State | Today, localStorage really full, a carried intention. A real tap on **Mark done** raises "Crossed off. Nice work. · Undo", and the failed save raises the warning 250 ms later. A second variant puts an action toast with `duration: Infinity` underneath, in the shape of the PWA update prompt. |
| Viewports and text size | 375×667 @200 % (light and dark), 844×390 @200 %, 667×375 @150 %. No loop at 375×667 @150 % or at 100 %. |
| Measured (warning adds/removals in about 5 s) | **R6:** 11/10, 12/11, 11/10, 11/10, 9/8. **INT:** 1/0 in every configuration. **Infinity variant:** R6 28/27 and 29/28, still looping when the recording ended; INT steady. |
| User impact | The warning blinks and "Save backup" stays clipped below the room. The live region re-announces the warning up to 28 times. With an update toast present the loop does not end. |
| Cause verified by | A counterfactual on R6. One injected rule, with no app code changed, made the warning lead: 1/0 in 5 of 5 runs, against 11/10 in 3 of 3 runs without it. All 30 removals followed a frame in which the warning sat second with its box over the dock. |
| Evidence | `LEAD/lead-d1/` (probes `actionpair*.mjs` and `pwapair*.mjs`, every run's jsonl, a clip per configuration on R6 and INT, frames, README) |
| Required for re-review | See the verdict's "Evidence needed for re-review", items 1–5. In brief: the warning leads deterministically whatever other action toasts are up; real-input and real-timer runs of this state on the new revision and on INT across the listed viewports and text sizes; a new spec case that fails on `e866118`; R5-D1 and R4-D1 retests with the R5 control reproduced in the same session; then the full Wave 1 regression on the new trial merge. |

## Causal analysis: why six rounds keep reopening the same symptom

Every warning defect M2 has fixed since r4 has the same shape: **"the warning is taken away and re-shown, or covers
something"**.

| Defect | How the warning's layout box was moved |
|---|---|
| R4-D1 | The reader scrolled the list |
| R5-D1 | Scroll anchoring after an older toast expired |
| LEAD-D1 | A second action toast took the lead |
| Follow-up 1 (keyboard) | Tab scrolled the page, so the dock left the lift's 60 % rule |
| Follow-up 2 | A fling or arrow keys scrolled the page and moved the dock |
| Follow-up 14 | Entry: the first frame is laid out before the lift applies |
| Follow-ups 18 and 19 | Route changes before the next 250 ms tick |

**The root is a coupling between two independent systems over the same geometry:**

1. **M1's I03 rule** (`src/app/flow.ts`, `protectedUnderToasts()`): decides whether the data-safety warning may be
   visible by **polling the warning's laid-out box** every 250 ms and at timer events, against protected controls.
2. **M2's toast layout** (`src/ui/Toast.tsx` and `Toast.module.css`): decides **where that box is**, from things
   M1's rule does not control:
   - the lift above `[data-toast-above]`, recomputed every 250 ms;
   - the short-room list order;
   - list scroll and scroll anchoring;
   - other toasts' lifecycles;
   - entry and exit transforms;
   - page scroll moving the dock.

Each round fixed the path the Checker found, and the next real-input test found another. When the overlap condition
persists (an Infinity toast), the remove → re-show → remove cycle becomes an unbounded loop. Whether a data-safety
message is visible therefore depends on unrelated transient toasts. That conflicts with I03's intent: storage
consequences should be truthful and stable.

## Architecture options (for the user to choose; none started)

### A. Deterministic precedence inside the current design (smallest)

**Change:**
- Give urgent toasts a higher order than any other action toast, through a toast `priority` or a tone-based rule
  such as the warning tone with an action. The counterfactual proves this ends LEAD-D1.
- Optionally add hysteresis to M1's rule: no withdrawal for an overlap that lasts less than a few hundred ms, or that
  lies entirely in clipped, unpainted area.

**For:**
- A small diff that keeps everything r6 achieved.
- M1's `flow.ts` can stay frozen if only the ordering changes.

**Against:**
- The coupling stays.
- Follow-ups 1, 2, 10, 14, 18 and 19 remain.
- Any new toast type, animation or layout can reopen the class.
- A seventh full review round is likely to find another path.

### B. Move the storage-full warning into an in-flow banner (removes the class)

**Change:**
- Render the storage-full state as a **persistent banner in document flow**, not as a toast:
  - on Today, below the status bar, above the composer;
  - in Settings › Your data.
- "Save backup" is a normal button in tab order.
- It stays until storage recovers or a backup is saved.
- Session, summary and break layouts simply don't include it. Phones already wait for Today under the r2 rule, so
  the hold becomes **state-based, not geometric**.
- It is announced once, politely, when it first appears.

**For:**
- Removes LEAD-D1, R4-D1, R5-D1, the keyboard window (d), the page-scroll take-aways, the entry re-mount, the
  route-change flash, the Back-to-brew overlap and the warning's 200 %/landscape clipping, **by construction**.
- Natural keyboard and screen-reader behaviour.
- Fits I03's "truthful storage consequences" better than a 12 s toast.
- `protectedUnderToasts()` and `TOAST_ZONE_PX` can be deleted.

**Against:**
- It changes approved I03 behaviour, so it needs M1 + I04 re-review.
- Today gets taller at 375×667, which is already tight. It must keep the docked start, the five categories, the
  brew-length discovery and CLS 0, and needs a new REFERENCE (K01) → BEFORE → AFTER.
- Desktop users no longer see the warning during a brew (they would on Today, after it).
- Medium scope:
  - `flow.ts`, a new banner component, and Home/Settings layout;
  - M2's short-room toast CSS could later be simplified.

### C. A reserved, non-scrolling "notice" slot separate from transient toasts (hybrid)

**Change:**
- The Toaster gets a pinned-notice lane, rendered outside the transient list, directly above the docked controls.
- The **layout reserves its height** through a CSS variable on the dock area, so it cannot overlap controls by
  construction.
- M1's rule shrinks to route and state gating, with no box polling.

**For:**
- Keeps the floating look and most of the current Today layout.
- Transient toasts can no longer push the warning.
- Geometry polling goes away.

**Against:**
- Touches both `Toast.tsx` and `flow.ts`, so it needs a combined owner and a combined review.
- The reserved space must still work at 200 % and in landscape. A 330 px warning in a 58 px landscape room still
  needs internal scrolling.
- More engineering than A, and less simplification than B.

**Orchestrator's recommendation:**
- **B** is the most robust and the most consistent with I03.
- **A** is a quick patch if Wave 1 must close soon, but expect further rounds on the same class.
- **C** sits between them.

Whichever is chosen, the next round should also take **follow-up 12**, a pre-existing I04 failure: at 200 % text some
break and break-over controls sit below the bottom edge with no document scroll.

## Follow-ups recorded (present on INT and not worse on R6; owners suggested by the lead)

| # | Follow-up | Suggested owner |
|---|---|---|
| 1 | Packet (d): forward Tab never reaches "Save backup" at 375×667 / 100 %. Hold window at scrollY 500–550 on R6, 325–550 on INT. Cause verified by the lead | M1 + I04 |
| 2 | Page-scroll take-aways | M1/M2 |
| 3 | Coarse notches in landscape @200 % | M2 |
| 8 | Toasts over the countdown / status line | I10 (M4/M2) |
| 10 | 1440 lift lag | M1/M2 |
| 11 | Late Today reflow at 200 % | I14 |
| **12** | **Controls below the bottom edge at 200 %. High priority** | M2 |
| 13 | Older toasts sliding over the warning's first line at 667×375 @200 % | M2 |
| 14 | Entry re-mount | M1/F11 |
| 16 | Focus drops to `body` when the warning is withdrawn | M1 |
| 18 | Route-change flash | M1 |
| 19 | No re-check on navigation after "Back to your brew" | M1 |

UNKNOWN, to re-check: L2's flaky "short screen" run, the L4 `13` / RM `04` pairs, and the empty-looking room in one
L2 clip.
