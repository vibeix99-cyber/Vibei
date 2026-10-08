# I03 × I04 integration fix — storage-full warning placement on the integrated code · READY FOR REVIEW

- **Maker:** M1 (I03 owner). Branch `pe/w1-fix`, worktree `/home/user/wt/w1fix/kettle`.
- **Revision:** the commit that adds this file (message `I03 I04 INTEGRATION FIX READY FOR REVIEW: …`;
  `git log -1 --format=%H -- kettle/review/product-excellence/contracts/I03/INTEGRATION-FIX-READY-FOR-REVIEW.md`).
- **Base:** integrated revision `455b6c6` (= `0d58c5e` code: M1 `a6ebe00` + M2 `2becb78`, plus the regression report).
  Diff: `git diff 455b6c6 <rev> -- kettle/src kettle/tests kettle/docs`.
- **Source tree of the fix:** `git rev-parse <rev>:kettle/src` = __SRCTREE__ (all runs and AFTER captures below).

## What failed

`integration/wave1/REGRESSION.md`: `tests/integrity.spec.ts` "I03 storage-full warning never covers a control (phone
375×667) › a warning raised just before 0:00 …" — after **Next brew** (Put the kettle on pressed while the warning was up)
the save-failed warning was visible on the session screen (the test expected it held). 390×844 and 1440×900 passed; both
branches passed alone.

## Root cause (verified, not assumed)

Probes on the integrated revision (Chromium, real full quota, `.tmp/probe/p1.mjs`/`p2.mjs`, scratch) measured the toast
region, the session controls and the readout:

| 375×667, integrated `455b6c6` | toast region bottom | session controls | readout | warning |
|---|---|---|---|---|
| brew start (nothing shown yet) | 481 (stylesheet) | 499–599 | above 499 | **shown** 0.9 s in, at 374–491 — over the countdown/status/meta |
| next brew from Today | 481 → lifted `bottom: 176px` → 491 | 501–600 | above 501 | **shown** at 374–491, over the readout |

1. M2's F11 marks the session control row, the summary footer and Today's start with `data-toast-above`. That does two
   things: the existing stylesheet rule `body:has([data-toast-above]) .region { bottom: tabbar + 118px }` now also applies
   on the session screen (before F11 it applied only on Today), and `useToastAbove()` in `src/ui/Toast.tsx` lifts a visible
   toast to 10 px above the highest marked element.
2. M1's hold rule (`src/app/flow.ts`, r2) only protected **controls**, and measured the toast at the region's *current*
   position. At 375×667 the toast is now placed just above the controls, so no control overlaps → the warning is shown —
   directly over the **countdown digits, status and meta line** (PRESERVE 4: the literal countdown on a readable surface).
   At 390×844 the region bottom (658) happened to sit 3 px below the controls' top (655), so it was held by luck; at
   1440×900 the toast sits under the stage, beside the panel.
3. Second consequence found while verifying: a warning *held* on Today was measured at the unlifted stylesheet position,
   which overlaps Today's docked start, so it could stay held on Today although the real (lifted) toast would clear it.

So the r2 rule was geometry-correct only for the r2 toast placement; the integration moved the toast, and the readout was
never in the protected set. Integration changed approved behaviour; the fix belongs in the I03 rule.

## Policy (one rule, every layout)

The storage-full warning is never drawn over anything protected, measured against **where the toast is, or would be,
drawn** (stylesheet position, or M2's lifted position):

- never during the whistle, summary (Done / Carry, Tea time, Skip break), tea break or "Break's over" (unchanged from r2);
- never over the session controls (Add 5, Pause / Resume, End …) **or the readout** (flag, countdown digits, status line,
  meta line — the parent of the `role="timer"` status), and never over a docked primary action (`data-toast-above`);
- while the session screen has not drawn its readout yet (just after a route change) it counts as covered.

What that means, consistently across phone sizes: on phones (390×844, 375×667, any size) the session panel — readout plus
docked controls — fills the lower half and a toast always lands in it, so **the warning waits for the whole brew**, running
or paused (as approved in r2), and shows on Today afterwards, floating above "Put the kettle on". On wide layouts
(1440×900) the toast sits under the stage beside the panel and shows during the brew; after the summary it now also shows
on Today (above "Put the kettle on", because M2's lift clears it) instead of waiting for another screen.

Why this one: it keeps the r2-approved phone behaviour (the person is never interrupted over the countdown or the
controls; the brew is safe in the tab meanwhile), it is defined by what must stay visible rather than by breakpoints, and
it follows M2's toast placement automatically (it reads the same measurement), so a later layout change cannot silently
reintroduce the overlap. M2's toast behaviour for all other toasts is unchanged.

## Fix

| File | Change |
|---|---|
| `src/app/flow.ts` | `protectedUnderToasts()` (was `protectedControlsUnderToasts`): protects the session readout as well as the controls; measures against the prospective toast position (`toastLiftBottom()` when the region floats, else the stylesheet position) and the actual warning rect when shown; holds while the session screen has no readout drawn yet. |
| `src/ui/Toast.tsx` (M2 file, minimal, recorded) | The lift measurement inside `useToastAbove()` is extracted unchanged into an exported `toastLiftBottom()`; `useToastAbove()` calls it. No behaviour change for any toast (a11y toast tests unchanged and green). |
| `tests/integrity.spec.ts` | Placement tests also assert the **readout** is clear (`readoutClear`) and, on phones, that no warning shows during the brew (`sessionClear`) at start, paused, 4 s before 0:00 and after Next brew. Changed expectation (policy, see above): after the summary the warning shows on **Today on every layout** (previously desktop expected it held on Today and shown on Settings) — justified by M2's lift, which now keeps the toast clear of Today's start on desktop too. |
| `docs/areas/timer.md` | "Storage full" placement rules rewritten to the policy above. |
| `review/…/I03/capture-storage-full.mjs` | New states `s4a` (Today with the pending warning) and `s4b` (next brew started while it is up). |

## Results on the fix (tree __SRCTREE__)

__RESULTS__

## Captures (AFTER, looked at, full size)

__CAPTURES__

## Preservation

PRESERVE 4 (literal countdown readable): the readout is now protected explicitly. PRESERVE 6/7 (working controls, Tea
time / Skip footer): hit-tests at three viewports. I04 (M2): toast lift for all other toasts unchanged; `tests/a11y.spec.ts`
green. I01/I02: integrity tests 1–14 green.

## BLOCKED / UNKNOWN

- Real phones (iOS Safari / Android Chrome) not available; viewports emulated in Chromium with touch and dpr 2.
- A visible warning that is taken away when a brew starts fades out over ~0.2 s while the session panel fades in (the
  toast's existing exit animation; not an overlap of a settled screen).
