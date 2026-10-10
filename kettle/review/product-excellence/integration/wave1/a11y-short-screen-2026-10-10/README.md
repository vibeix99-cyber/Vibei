# Adjudication: a11y "short screen (375×667)" failure, 2026-10-10

- **Question:** M2 disclosed on r3 (`e4be56e`) that this test fails today on its branch, on a trial merge, and on `c9520db`.
  Is it caused by a fix, or is it pre-existing?
- **Run (orchestrator, main checkout, app code `0d58c5e`, src tree `1fc4a1b`):**
  `KETTLE_PORT=5281 KETTLE_PWA_PORT=5291 npx playwright test --project=chromium tests/a11y.spec.ts -g "short screen" --workers=1`
  → **1 failed**: `break-over: "Mark it done, start fresh" stays under span._message…` (`a11y-short-screen-on-0d58c5e.txt`).
- **Probe** (`probe-breakover.mjs`: the test's own `walkJourney`, 375×667@2, light):
  - Summary and break: no toast.
  - Break-over: toast "Recipe done: Take 2 full tea breaks · +15 leaves".
  - Buttons: "Mark it done, start fresh" at y 451–495; "Put the kettle on" at y 511–571.
  - Screenshot: `break-over-375x667-light-recipe-toast-0d58c5e.png`. It shows the toast completely hiding "Mark it done, start fresh".
- **Cause:**
  - Today's recipe rotation completes "Take 2 full tea breaks" when the journey's break ends, so `progress/store.ts` emits the toast on break-over.
  - In `src/screens/focus/FocusScreen.tsx` the carried-task button `.overMark` sits outside the `data-toast-above` group (`.overActions`), so the I04 F11 lift places the toast right over it.
  - The 2026-10-09 runs passed because no recipe completed at break end on that date.
- **Verdict (fact-finding, not an approval):** pre-existing on the Wave 1 integration, independent of both fixes. It is a real I04 defect: a control is fully covered.
- **Routed to M2** as D4, on the same branch before review, with a requirement to make the gate date-independent.
