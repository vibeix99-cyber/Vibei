# I03 × I04 integration fix — storage-full warning placement on the integrated code · READY FOR REVIEW

- **Maker:** M1 (I03 owner). Branch `pe/w1-fix`, worktree `/home/user/wt/w1fix/kettle`.
- **Revision:** the commit that adds this file (message `I03 I04 INTEGRATION FIX READY FOR REVIEW: …`;
  `git log -1 --format=%H -- kettle/review/product-excellence/contracts/I03/INTEGRATION-FIX-READY-FOR-REVIEW.md`).
- **Base:** integrated revision `455b6c6` (= `0d58c5e` code: M1 `a6ebe00` + M2 `2becb78`, plus the regression report).
  Diff: `git diff 455b6c6 <rev> -- kettle/src kettle/tests kettle/docs`.
- **Source tree of the fix:** `git rev-parse <rev>:kettle/src` = `3c58bf904d3d3df83726a56e52f83e82bf6f67c8` (all runs and AFTER captures below).
- **Proposed state:** I03 on the integrated revision — **FIXED** (integration regression repaired; I03's approved
  behaviour restored and extended to the readout). I04 toast part — **unchanged behaviour** (`toastLiftBottom()` is a
  behaviour-preserving extraction; M2's toast tests green). PARTLY BLOCKED only for real devices (below).

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
   1440×900 the toast sits over the stage, beside the panel.
3. Second consequence found while verifying: a warning *held* on Today was measured at the unlifted stylesheet position,
   which overlaps Today's docked start, so it stayed held on Today although the real (lifted) toast would clear it.
   Measured on the unfixed revision: 1440×900 (probe: Today, no toast) and 390×844 (debug run of the "just before 0:00"
   test: stylesheet region bottom 658 px vs "Put the kettle on" top 653 px → held for the whole 3 s sampled; scratch
   instrumentation, not committed). 375×667 fails the same assertion; its geometry was not measured separately.

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
(1440×900) M2's lift places the toast over the lower stage, beside the panel, clear of the readout and controls, and it
shows during the brew; after the summary it now also shows on Today (above "Put the kettle on", because M2's lift clears
it) instead of waiting for another screen. There, like any lifted toast, it can sit over part of Today's brew-length
chooser for up to 12 s (ordinary content, as the task field already is on phones; tap to dismiss).

Why this one: it keeps the r2-approved phone behaviour (the person is never interrupted over the countdown or the
controls; the brew is safe in the tab meanwhile), it is defined by what must stay visible rather than by breakpoints, and
it follows M2's toast placement automatically (it reads the same measurement), so a later layout change cannot silently
reintroduce the overlap. M2's toast behaviour for all other toasts is unchanged.

## Fix

| File | Change |
|---|---|
| `src/app/flow.ts` | `protectedUnderToasts()` (was `protectedControlsUnderToasts`): protects the session readout as well as the controls; measures against the prospective toast position (`toastLiftBottom()` when the region floats, else the stylesheet position) and the actual warning rect when shown; holds while the session screen has no readout drawn yet. |
| `src/ui/Toast.tsx` (M2 file, minimal, recorded) | The lift measurement inside `useToastAbove()` is extracted unchanged into an exported `toastLiftBottom()`; `useToastAbove()` calls it. No behaviour change for any toast (a11y toast tests unchanged and green). |
| `tests/integrity.spec.ts` | New test (× 3 viewports) for the exact merged-state scenario: `a warning already up when the next brew starts never covers the session readout or controls (wave-1 integration regression)` — the warning is raised where it covers nothing (Stats), the next brew starts with it on screen, and for 1.5 s the controls must be tappable, the readout clear and (phones) no warning shown. Existing placement tests also assert the **readout** is clear (`readoutClear`) and, on phones, that no warning shows during the brew (`sessionClear`) at start, paused, 4 s before 0:00 and after Next brew. Changed expectation (policy, see above): after the summary the warning shows on **Today on every layout** (previously desktop expected it held on Today and shown on Settings) — justified by M2's lift, which now keeps the toast clear of Today's start on desktop too. |
| `docs/areas/timer.md` | "Storage full" placement rules rewritten to the policy above. |
| `review/…/I03/capture-storage-full.mjs` | New states `s4a` (Today with the pending warning) and `s4b` (next brew started while it is up). |

## Results on the fix (tree `3c58bf904d3d3df83726a56e52f83e82bf6f67c8`)

| Command | Result | Log (`contracts/I03/integration-fix/runs/`) |
|---|---|---|
| `npx tsc --noEmit --pretty false` | exit 0 | `tsc-vitest.txt` |
| `npx vitest run` | 26 files, **265/265** | `tsc-vitest.txt` |
| `KETTLE_PORT=5221 KETTLE_PWA_PORT=5231 npx playwright test tests/integrity.spec.ts tests/a11y.spec.ts tests/whistle.spec.ts --project=chromium` | **45/45** passed (10.4 min): a11y 9, integrity 28 (25 before + the new merged-state test × 3 viewports), whistle 8 | `e2e-chromium.txt` |
| `KETTLE_PORT=5221 KETTLE_PWA_PORT=5231 npx playwright test --project=timer-harness --project=timer-app --project=pwa` | **29 passed, 2 skipped** (2.6 min) — the same 2 skips as the integration run (`timer-app` Space-toggle and render-budget tests are harness-only) | `e2e-timer-pwa.txt` |
| placement tests (`-g "never covers a control"`, 9 = 3 tests × 3 viewports) on a clean copy of the **unfixed** integrated `455b6c6` | **5 failed / 4 passed** — fails: 375×667 brewing (`phone: no warning during the brew (@2)` — the warning over the readout), 375×667 **next brew with a pending warning** (`next brew @0`, the exact merged-state scenario), and the "just before 0:00" test at all 3 sizes (line 1079: the warning never appears on Today — root cause 3). The 390×844 and desktop brewing/next-brew tests pass there (390 only by the 3 px margin). | `placement-on-455b6c6.txt` |

M2's approved toast behaviour still holds: `tests/a11y.spec.ts` "a toast never covers the session controls or the summary
footer" (390×844, 375×667) and the rest of the a11y spec pass; the warning on Today floats above "Put the kettle on" at all
sizes (hit-test in the integrity test, captures `s4a`).

The logged gate runs (`e2e-chromium.txt`, `e2e-timer-pwa.txt`, `tsc-vitest.txt`) are on the final tree `3c58bf9`. An
earlier full pass (45/45, 29+2) on tree `3e350c0` — identical except one comment line in `src/app/flow.ts` ("under" →
"over the stage") — is superseded and not kept.

Note on the runs: a first attempt of the chromium gate on this branch failed 34/42 with `net::ERR_CONNECTION_REFUSED` —
Playwright's own webServer did not come up under host load (another agent's builds); the logged gate runs used the same e2e
server config (`tests/e2e.vite.config.ts`, port 5221) started beforehand, which `reuseExistingServer` picks up.

## Captures (BEFORE / AFTER, looked at, full size)

Script `review/product-excellence/contracts/I03/capture-storage-full.mjs` (states s0, s0b, s1, s1a, s1b, s2, s3, s3b and
the new s4a / s4b), Chromium + SwiftShader, scene off, `newbie` seed, real full quota, fonts served. 390×844 and 375×667 at
dpr 2, 1440×900 at dpr 1, light and dark.

- `captures/before-integration/<config>/` — unfixed integrated `455b6c6` (clean git-archive copy; label in each
  `capture-meta.json`): s0, s0b, s1a, s1b, s4a, s4b. `<config>` = `phone-390x844-{light,dark}` (dpr 2),
  `phone-375x667-{light,dark}` (dpr 2), `desktop-1440x900-{light,dark}` (dpr 1).
- `captures/after-integration/<config>/` — this fix (tree `3c58bf9…`, recorded in each `capture-meta.json`): all 10 states.

| State | BEFORE (455b6c6) | AFTER (fix) |
|---|---|---|
| `s4b` next brew started with the warning up | 375×667: warning over the countdown / status / meta, right above Add 5 / Pause / End (both themes). 390×844: held (3 px margin). Desktop: over the stage. | Phones (both sizes, both themes): no warning; readout and controls clear. Desktop: over the stage, beside the readout and controls (clear). |
| `s0b` paused, storage full | 375×667: warning over "The kettle will wait." / meta, just above Add 5 / Resume / End. | Phones: no warning; Paused flag, digits, status, meta, controls clear. Desktop: over the stage, clear. |
| `s1a` → `s1b` warning just before 0:00 → summary | 375×667 s1a: warning over the readout; s1b: summary clear (r2 rule). | s1a phones: no warning; desktop: over the stage, clear. s1b: summary with Tea time / Skip break fully visible at all six configs. |
| `s4a` Today with the pending warning | Desktop: no warning (held: measured at the unlifted position). | Every config: warning floating above "Put the kettle on" (CTA clear). |

Looked at full size: every `after-integration` s0b, s1a, s1b, s4a, s4b at all six configs, plus s0 / s3 samples, and the
BEFORE 375×667 s4b (light) and s0b (dark).

## Preservation

| Area | Check (integrity tests numbered within `tests/integrity.spec.ts`) | Result |
|---|---|---|
| I01 (session time, exactly once) | integrity tests 1–9 (reload, pause/+5, Page Lifecycle freeze, late return, repeated completion, two tabs); timer-harness + timer-app | all pass |
| I02 (End, dismissal, task disposition) | integrity tests 10–14 | all pass |
| I03 (data safety) | integrity tests 15–19 (round trip, invalid files, storage-full brew + restore, no network) and the 9 placement tests (3 × 3 viewports): controls tappable, End opens its sheet, 0 downloads, Tea time / Skip break tappable, readout clear | all pass |
| I04 — M2's toast lift / `data-toast-above` | `tests/a11y.spec.ts` "a toast never covers the session controls or the summary footer" (390×844, 375×667) + full a11y spec (axe light/dark, targets, short screen, keyboard journey, live regions); `toastLiftBottom()` is the unchanged measurement moved out of `useToastAbove()`; Home docked start clear of the warning (hit-test + `s4a` at all six configs); summary footer clear (`s1b` at all six) | all pass |
| Whistle / notifications | `tests/whistle.spec.ts` (8) | all pass |
| PRESERVE 4 / 6 / 7 | readout protected explicitly; controls and Tea time / Skip footer hit-tested at three viewports | pass |

## BLOCKED / UNKNOWN

- Real phones (iOS Safari / Android Chrome) not available; viewports emulated in Chromium with touch and dpr 2.
- Firefox / Safari not run (Chromium only).
- Desktop: like any lifted toast (M2), the warning sits over the lower stage during a brew, and on Today over part of the
  brew-length chooser, for up to 12 s (tap to dismiss). Not a protected control under this policy; noted for review.
- A visible warning that is taken away when a brew starts fades out over ~0.2 s while the session panel fades in (the
  toast's existing exit animation; not an overlap of a settled screen).
