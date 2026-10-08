# Wave 1 integration regression — revision 0d58c5e

Integrated: M1 `pe/m1@a6ebe00` (I01–I03, Checker r2 APPROVE) + M2 `pe/m2@2becb78` (I04/I05/I14, Checker r1 APPROVE).
Clean merge (no conflicts). Run 2026-10-08 08:48 UTC on the idle host (load 0.3), logs in this folder.

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | clean |
| `npx vitest run` | 265/265 |
| Playwright chromium: `integrity.spec.ts` + `a11y.spec.ts` + `whistle.spec.ts` | **41 passed, 1 failed** |
| Playwright timer-harness + timer-app + pwa | 29 passed, 2 skipped (as before) |

## Integration regression (returned to the responsible maker)

`integrity.spec.ts:1015` — "I03 storage-full warning never covers a control (phone 375×667) › a warning raised just
before 0:00 is taken away for the whistle and summary; Tea time and Skip break stay tappable; it comes back after"
fails on the integrated revision: after **Next brew** the save-failed warning is visible on the session screen
(expected held). Same test passes at 390×844 and 1440×900, and passed on each branch alone.

Cause (hypothesis to verify): M2's F11 marks the session control row `data-toast-above`, so toasts are lifted
above it; M1's hold logic only holds the warning when it would overlap session controls or docked buttons, so on
the integrated revision at 375×667 it no longer finds an overlap and shows the warning during the brew — possibly
over the countdown/readout. Integration changed approved behavior → fix on the integrated revision, then fresh
independent review of I03 (and the toast part of I04) on that exact revision.

## Orchestrator visual inspection of the integrated captures (`captures/`, app code = 0d58c5e)

All 22 states × 6 configs + reduced motion captured with zero page errors. Inspected against the 8f1044a baseline.

- **Regression (I04 / M2 F6):** at 375×667, 100% text, both themes, Today's status bar wraps ("Level 12" on its own
  row; greeting ~50 px lower). Baseline and 390×844 are one row. M2's submitted 375 AFTER images predate the final
  F6 rework (captured at `651bc54+dirty`), so neither maker nor checker saw it. Returned to M2 on `pe/w1-fix-m2`.
- Data-only differences (not code): leaf totals and Chai's line on Today, and the first-brew summary (14) showing a
  level-2 unlock, follow the real clock at capture time (~09:30 UTC morning bonuses); the round-6 state machine is
  unchanged.
