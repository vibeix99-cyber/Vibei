# I03 × I04 integration fix (storage-full warning placement) · CHECKER r1

**Verdict: APPROVE**

- **Reviewed commit:** `3f00b5784a8107fc1cf53afe4569c78fad62b69c` (branch `pe/w1-fix`, "I03 I04 INTEGRATION FIX READY FOR REVIEW").
  `3f00b57:kettle/src` = `3c58bf904d3d3df83726a56e52f83e82bf6f67c8`, which is the tree the maker's packet and AFTER captures name.
- **Base (BEFORE):** integrated Wave 1 `455b6c6` (app code = `0d58c5e`).
  Diff reviewed: `git diff 455b6c6 3f00b57 -- kettle/src kettle/tests kettle/docs`. The source changes are in `src/app/flow.ts` and `src/ui/Toast.tsx`; the commit also changes `tests/integrity.spec.ts` and `docs/areas/timer.md`.
- **Checker:** independent; I did not build this work. I edited no application code, tests or maker files, and committed nothing.
  - Worktrees: `/home/user/wt/chk-w1m1/kettle` (detached at `3f00b57`, clean) and `/home/user/wt/chk-w1m1-base/kettle` (detached at `455b6c6`, clean).
  - Servers were Vite instances started through scratch configs outside the repo, each with a private dependency cache and fonts served:
    - Playwright: 5236 (HEAD) and 5237 (base);
    - probes: 5216 (HEAD) and 5217 (base);
    - the pwa preview ran on 5246.
  - I stopped all of them by PID at the end.
  - Scratch: `/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/chk-w1m1/` (written `$S` below).
  - Host load was 10–17 on 4 CPUs because another checker was running. All renders used the CPU SwiftShader renderer.

## Summary

The integration regression is fixed, and I reproduced it on `455b6c6` before confirming the fix. With M2's toast lift, the storage-full warning had sat over the session countdown, status and meta at 375×667. At `3f00b57` it is never shown, in any settled state, over these:
- the readout;
- Add 5 / Pause / Resume / End;
- the summary's Tea time / Skip break footer;
- the break controls;
- "Break's over";
- Today's docked "Put the kettle on".

I checked this at 375×667@2, 390×844@2 and 1440×900@1 in both themes, with real taps and per-frame measurement.

The warning is never lost. Phones hold it for the whole brew, as approved in r2, and show it on Today afterwards. Desktop shows it beside the panel during the brew, and now also on Today.

`toastLiftBottom()` is a behaviour-preserving extraction. For an ordinary toast, the toast rectangles and region offsets on Today, the session and the summary are identical on base and HEAD at all three sizes.

I01, I02 and the rest of the suites are green. The protected visuals are unchanged.

I found three things that are not blocking, listed under "Non-blocking findings":
- a sub-half-second transient on a path the fix does not hook ("Back to your brew");
- two M2-owned toast-layout issues (200 % text, and ordinary toasts on the session). This commit did not introduce either one.

## What I ran (all re-run by me)

| Command / probe | Result | Log |
|---|---|---|
| `npx tsc --noEmit --pretty false` | exit 0 | `$S/tsc-head.txt` |
| `npx vitest run` | 26 files, **265/265** | `$S/vitest-head.txt` |
| `KETTLE_PORT=5236 KETTLE_PWA_PORT=5246 npx playwright test --project=chromium tests/integrity.spec.ts tests/a11y.spec.ts tests/whistle.spec.ts --workers=2` | **45/45 passed** (8.8 min) | `$S/e2e-chromium-head.txt` |
| `KETTLE_PORT=5236 KETTLE_PWA_PORT=5246 npx playwright test --project=timer-harness --project=timer-app --project=pwa --workers=2` (projects as defined in `playwright.config.ts`) | **29 passed, 2 skipped** (2.3 min). The skips are by design and match the integration run: timer-app "Space toggles…" and "useRemaining re-renders…" are harness-only. | `$S/e2e-timer-pwa-head.txt` |
| **Original failure on `455b6c6`**, using base's own spec: `KETTLE_PORT=5237 … tests/integrity.spec.ts -g "never covers a control"` in the base worktree | **1 failed / 5 passed** | `$S/base-ownspec-placement.txt` |
| **HEAD's spec against the `455b6c6` app**: same `-g`, run from the HEAD worktree against base's server on 5237 | **4 failed / 5 passed** | `$S/base-headspec-placement.txt` |
| Same placement tests on `3f00b57` | 9/9 in the gate above. A second run with `-g "never covers a control\|a toast never covers" --repeat-each=2 --workers=2` gave **22/22**. | `$S/head-placement-rerun.txt` |
| My placement probe `$S/probe.mjs` | Real browser, newbie profile, localStorage really filled to quota (QuotaExceededError). Per animation frame it records the warning `li` rect and opacity (own and effective), the readout (parent of `role=timer`), every `main` control on `#/focus` / `#/done`, every `[data-toast-above]`, and the effective opacity of the session layer. Run on HEAD at all six configs; on base at 375 light, 390 dark and 1440 light. | `$S/probe/{head,base}/<config>/report.json` + PNGs |

Details of the two base reproductions:
- **Base's own spec.** The failure is the REGRESSION.md one: 375×667 "…just before 0:00…" fails at `integrity.spec.ts:1051`. After Next brew, `saveWarning toHaveCount(0)` received **1**.
- **HEAD's spec against base.** All three 375×667 tests fail:
  - brewing: `phone: no warning during the brew (@0)`;
  - the new merged-state test: `(next brew @0)`;
  - "just before 0:00": `(next brew @0)`.
  
  Desktop "just before 0:00" also fails, at `:1079`, because the warning never appears on Today (root cause 3). 390×844 "just before 0:00" passed on base in my run, where the maker's run had it fail. That fits the maker's explanation: at 390 the hold depended on a 3 px margin.

The probe exercised these scenarios:
- **A.** Brew started by a real tap on "Put the kettle on", then a real tap on Pause 70 s later.
- **B.** A failing save 4 s before 0:00, followed by:
  - whistle → summary;
  - a real tap on Tea time → the break;
  - a real tap on Next brew → a real tap on End → the End sheet → End → Today.
- **B2.** As B, but the break runs out → "Break's over" → Put the kettle on.
- **C.** Warning raised on Today, then Put the kettle on.
- **D.** Browser back from a running brew → Today → "Back to your brew".
- **D2.** As D, then a real tap on End as soon as End's effective opacity is ≥ 0.5. Five tries with normal motion, five with reduced motion.
- **E.** An ordinary `toast()` on Today, the session and the summary (M2's lift).
- **200 % text** (`html{font-size:200%}`): A and C at 390 dark and 1440 light.

### Probe results on `3f00b57`

| Config | Warning on session / summary / break / Break's over (A, B, B2) | Today (B after End, C) | Leaving Today for a brew (C) |
|---|---|---|---|
| 375×667 light | Never visible: 0 frames in each of 6 sampled phases, about 1,400 frames in total. | Shown above "Put the kettle on" at 372–489, dock at 499. CTA hit-test OK; "Save backup" over no control. | Exit fade only. The warning starts fading in the first frame the session exists; session opacity is 0 at that frame. |
| 375×667 dark | Same: 0 frames. | Same. | Same. |
| 390×844 light | 0 frames. | Shown at 549–666, dock at 676. CTA OK. "Save backup" sits over the **Read** category chip (note 3). | Exit fade only. |
| 390×844 dark | 0 frames. | Same. | Same. |
| 1440×900 light | Shown during the running and paused brew at 500–940 × 445–522. 0 frames over the readout (980–1330 × 282–505) or the controls (1010–1300 × 532–631). Taken away at completion; 0 frames on the summary and the break. | Shown at 493–933 × 595–675, CTA clear (hit-test OK). It covers part of the brew-length chooser (disclosed); "Save backup" is over no control. | Stays shown beside the panel, 0 overlap. |
| 1440×900 dark | Same. | Same. | Same. |

**D2 (real taps on End right after "Back to your brew", 375×667):** in 10 of 10 tries the End sheet opened, with **0 downloads**.

**Base `455b6c6` (same probe):**
- At 375×667 the warning sat at full opacity over the readout:
  - for 2.0–5.9 s at brew start;
  - for 3.3 s while paused;
  - for 4 s after the next brew.

  This matches the defect.
- At 1440×900 the warning was never shown on Today (held).

**E (I04 lift, ordinary toast), identical on base and HEAD:**

| Screen | 375×667 | 390×844 | 1440×900 |
|---|---|---|---|
| Today | toast 437–489 above dock 499 | toast 614–666 above dock 676 | toast 582–634 above dock 644 |
| Session | toast 379–431 above controls 501 | toast 533–585 above controls 655 | toast 410–462, beside the panel |
| Summary | toast 347–399 above footer 529 | toast 524–576 above footer 706 | toast 556–608 above footer 738 |
| Region bottom (Today / session / summary) | 178 / 176 / 148 px | 178 / 199 / 148 px | 266 / 378 / 172 px |

## What I opened (Read tool, full size unless noted)

**Package and history**
- `PROTOCOL.md`;
- `MASTER_EVIDENCE_MATRIX.md` § I01–I04 and `PRESERVE_LIST.md`;
- `integration/wave1/REGRESSION.md`;
- `contracts/I03/CHECKER-r2.md`; the toast parts of `contracts/I04/CHECKER-r1.md` and `READY-FOR-REVIEW.md`;
- the maker's packet `contracts/I03/INTEGRATION-FIX-READY-FOR-REVIEW.md`, `capture-storage-full.mjs`, and `integration-fix/runs/placement-on-455b6c6.txt`;
- all ten `capture-meta.json` state summaries for BEFORE and AFTER × 6 configs.

**Code**
- the full diff: `flow.ts` (whole saving-failed section and event wiring), `Toast.tsx` (whole file), `Toast.module.css`;
- `FocusScreen.tsx` (readout and controls markup), `App.tsx` (layer dissolve timings), `router.ts`, `Composer.tsx` (resume card), `debug.ts`;
- the changed tests and docs.

**Maker BEFORE captures** (`contracts/I03/captures/before-integration/`)
- `phone-375x667-light/s4b` and `s1a`;
- `phone-375x667-dark/s0b`;
- `phone-390x844-light/s0`;
- `desktop-1440x900-light/s4b`;
- `desktop-1440x900-dark/s4a`.

**Maker AFTER captures** (`contracts/I03/captures/after-integration/`)
- `phone-375x667-light/s4b`, `s4a`, `s0b`, `s1a`;
- `phone-375x667-dark/s0b`, `s4b`, `s1b`;
- `phone-390x844-light/s1a`, `s4b`, `s3b`;
- `phone-390x844-dark/s1b`, `s4a`;
- `desktop-1440x900-light/s4a`, `s1a`;
- `desktop-1440x900-dark/s4b`, `s1b`, `s0b`.

All match the packet's description:
- BEFORE at 375 shows the warning over the countdown, status and meta, directly above Add 5 / Pause / End.
- AFTER on phones shows a clear readout and controls.
- AFTER on desktop shows the warning over the stage, beside the readout.
- AFTER `s4a` shows the warning above "Put the kettle on".

**Integrated captures** (`integration/wave1/captures/<config>/`, states 02–05 and 07–10, all six configs)
- I opened the integrated `phone-375x667-light/04-focus-paused.png` full size.
- I compared all six configs against my own HEAD captures, made with `tools/capture.mjs` at the same settings (3D on, `--only 02,03,04,05,07,08,09,10`, revision `3f00b57`, 0 page errors).
- The comparison was done on side-by-side sheets `$S/compare/*.png`:
  - phones in two 4-state sheets per config;
  - desktop one sheet per state.
- Full size, I opened HEAD `phone-375x667-light/08-summary-end.png` and `desktop-1440x900-light/07-summary.png`.

**My probe screenshots** (`$S/probe/head/…` unless noted)
- 375 light: A1, B2, B3, B4, B6;
- 375 light-D: D1;
- 375 dark: A2, D2, E2;
- 390 light: B7;
- 390 dark: C1, B4;
- 1440 light: A2, B2, B6;
- 1440 dark: C1;
- 200 % text: `headT200/390x844@2-dark-t200/C1` and `headT200/1440x900@1-light-t200/A2`;
- base: `base/375x667@2-light/A1`, which shows the defect.

## Code review of the fix

- **`toastLiftBottom()`.** The extraction is identical to the previous inline `measure()` loop: same selector, same `aria-hidden` / `inert` skip, same `height > 0 && top < innerHeight && bottom > 0.6·innerHeight` filter, same `round(innerHeight − top + 10)`. It adds only a `typeof document` guard. `useToastAbove()` behaves the same (250 ms re-measure, resize). The E probe numbers are identical on base and HEAD.
- **`protectedUnderToasts()`.** The predicted zone is `[bottom − 170, bottom]`, where `bottom` is the lifted bottom when `toastLiftBottom()` is non-null and otherwise the region's current bottom. It adds the drawn warning's own rect once the warning is shown. On `/focus` and `/done` the candidates include the readout (the parent of `role=timer`) and every control. When `/focus` has no readout yet, the function returns "covered".
- **Edge cases.** The horizontal test uses the live area, which is a superset of the toast. A warning already exiting still counts as covering, so no flicker. Phone layouts always place the readout inside the zone, so the warning is held, consistently, at every phone size and at 200 % text. Desktop is clear by geometry.
- **No change in this commit:**
  - The 60 s rate limit, the `quota ||=` merge and the 1.5 s "pushed out" rule are unchanged.
  - The 12 s timeout and a tap still end the warning, as approved in r2.
  - A warning dismissed by the flow returns to `held`; it is not dropped.
  - I found no path where a held warning can be lost. One residual is unchanged and disclosed: a phone user who never leaves the session screen (auto-start loop, or the tab is closed) is not told.

## Per-criterion findings

| Criterion | Finding |
|---|---|
| **I03 placement**: never over the readout, session controls, summary footer, break controls or Today's docked start | **PASS.** Settled state: 0 frames on phones in A/B/B2 at four phone configs; 0 overlap on desktop; tests green twice. Two transients during a screen change remain (see notes 1 and 2); neither obstructs a control (10/10 End taps opened the sheet, 0 downloads). |
| **I03 never lost** | **PASS.** Shown on Today after End and after Skip at all six configs; shown during the brew on desktop; re-shown after a flow dismissal. The phone trade-off is unchanged from r2 and disclosed. |
| **I03 truthful copy** | **PASS.** The wording is unchanged and plain ("…this browser's storage is full. Save a backup to keep them.", or the blocked variant). Save backup produces a file containing the unsaved brew (integrity storage-full tests green). `docs/areas/timer.md` matches what I observed: phones wait the whole brew; desktop shows beside the panel; Today shows above the start on every layout; desktop Today may cover part of the brew-length chooser; checks run every 250 ms and at phase events. |
| **I03 data gate** (round trip, invalid files, refusal of an unsaveable restore, reset confirmation, no network) | **PASS.** Integrity I03 data-safety tests all green. |
| **I01**: time across reload, pause/+5 and late return; exactly once; Page Lifecycle freeze; two tabs | **PASS.** Integrity I01 tests (9) and timer-harness / timer-app green, plus the storage-full test "a brew that completes still reaches its summary, once". Each storage-full probe run (B, B2 at six configs) reached the summary and its Tea time / Skip footer. |
| **I02**: End recoverable, dismissal never stops the brew, early-end policy, Done / Carry / edit with no duplicate record | **PASS.** Integrity I02 tests (5) green, including "End within the first minute: … nothing is" saved. Probe: End sheet opened on every real End tap (10/10 in D2, plus B); ending in the first minute led to Today with "Kettle's off. See you soon." |
| **I04 toast behaviour** at 375×667, 390×844 and 1440×900 | **PASS, unchanged.** Ordinary toasts float above session controls, the Tea time / Skip footer and Today's docked start (E table identical on base and HEAD). a11y "a toast never covers the session controls or the summary footer" passed at 390 and 375, three times. Full a11y spec green (axe light / dark, targets, short screen, keyboard journey, live regions). |

## Preservation checks

States 02–05 and 07–10 at all six configs match the integrated captures. The only differences are:
- clock-dependent data: countdown seconds, leaves +60 vs +45, and whether the "Earn 80 leaves" recipe completed (the same real-clock effect REGRESSION.md notes);
- one SwiftShader mid-entry frame: the desktop 09-break panel sits about 5 px higher.

Item by item:

| Preserve item | Result |
|---|---|
| Literal countdown on a solid readable surface (PRESERVE 4) | Unchanged in every capture. During storage-full, the warning now never covers it once settled. |
| Orange focus actions, blue rest (PRESERVE 1) | Orange Resume / Put the kettle on; blue break countdown and Tea time. Unchanged. |
| Kettle orange from the first second; heat stops on pause (PRESERVE 3) | Unchanged. |
| Compact summary, sticky Tea time / Skip footer, final line clears the footer (PRESERVE 7) | 07 and 08 at all six configs: the "Your 23-day streak…" line clears the footer. The storage-full summary (maker `s1b`, my B2) has no warning at all six configs. |
| Docked start | Unchanged; warning and ordinary toasts float above it. |
| Approved Chai (PRESERVE 2) | Unchanged reading, cheering and sipping poses and footprint. |
| Scope (PRESERVE 12) | Only `flow.ts` and an extraction in `Toast.tsx`. No dependency or storage-format change (PRESERVE 9 / 11). |

## Non-blocking findings (not defects of this commit; recorded for the orchestrator)

1. **"Back to your brew" is not re-checked at once.**
   - **Scope.** The event wiring is unchanged since r2 (`a6ebe00`). The path is reached with storage full when the person leaves a running brew (browser back), sees the warning on Today, and taps "Back to your brew". `navigate('/focus')` fires no timer event, so the warning is re-evaluated only at the next 250 ms tick.
   - **Measured, normal motion.** About 0.1–0.25 s at full opacity over the readout and Add 5 / Pause / End while the session layer fades in (session effective opacity 0 → 0.83), then a 0.16 s fade.
   - **Measured, reduced motion.** About 0.12 s at full opacity over a fully visible readout, then about 0.27 s of fade.
   - **Effect.** Real taps on End at opacity ≥ 0.5 opened the End sheet 10/10, with no download. This is the same class as the exit fade r2 accepted and the packet discloses for brew start, so it is not graded as a defect.
   - **Suggested hardening.** Call `recheckSaveWarning()` from a router listener whenever the route becomes `/focus` or `/done`.
2. **Desktop Today: the warning covers part of the brew-length chooser** (25 / 50 / Custom) for up to 12 s. This is new, because the warning used to be held on desktop Today, but it is disclosed in the packet and the docs. "Save backup" is over no control. Each toast's first frame on desktop Today sits about 0.03–0.1 s at the stylesheet position at partial opacity before M2's lift applies; that is M2 behaviour for every toast.
3. **390×844 Today: "Save backup" lies over the "Read" category chip** in both themes. A tap aimed at Read while the warning is up downloads a backup, which is not destructive. This is M2's lift geometry and is the same on base whenever the warning showed there. It differs from r2's note that Save backup was over no control.
4. **200 % text on phones (M2-owned toast layout).** At 390×844 the warning on Today is about 700 px tall, with one word per line beside the action. Its first two lines ("Kettle couldn't save your latest") are above the top of the screen, while the CTA stays clear. On base the warning was held on Today at 200 % and was shown over the session readout instead, which is worse. Route this to the I04 owner (toast max-height, or the action below the text when narrow).
5. **Ordinary toasts on the session screen at phone sizes sit over the readout.** M2's lift places them above the controls; this is unchanged and identical on base (E table). The readout is now protected for the storage-full warning only. For the I04 owner.

## BLOCKED / UNKNOWN (never PASS)

- **BLOCKED:** real browser quota behaviour on Safari, Firefox and Android Chrome. Only Chromium localStorage quota was exercised.
- **BLOCKED:** real OS suspension and app switching on devices. The integrity spec uses a real CDP Page Lifecycle freeze in headless Chromium, which is not an OS suspension.
- **BLOCKED:** real phones and real touch hardware. Viewports were emulated with touch and dpr 2.
- **UNKNOWN:** screen-reader announcement of the held / re-shown warning on real assistive technology. Only the polite live region was checked by the a11y spec.
- **Renderer:** all timings come from CPU SwiftShader under heavy host load. Transient durations on real devices are bounded by the code (250 ms tick + 160 ms fade) rather than measured.
