# I03 — Data safety and truthful storage consequences · CHECKER r2

**Verdict: APPROVE**

- **Reviewed commit:** `a6ebe00` (branch `pe/m1`; `a6ebe00:kettle/src` = `e2d8326b6aa3b15b609eb1c8e76bda5f68b38d53`, the tree
  named in every r2 `capture-meta.json`). Diff base `c80d068`; r1 `6d5969e` (REJECTED by Checker r1: defects A, B).
- **Checker:** independent round-2 checker; did not build this work; no application or maker files edited.
- Worktrees `/home/user/wt/chk-m1` @ `a6ebe00`, `/home/user/wt/chk-m1-r1` @ `6d5969e` (removed after review); my dev
  servers 5211 (r2) / 5212 (r1) served real fonts through a scratch Vite config (`server.fs.allow` widened, outside the
  repo). Probes: `…/scratchpad/chk-m1r2/probe.mjs` (outside the repo), outputs in `…/scratchpad/chk-m1r2/out/`.

## Summary

Both r1 defects are fixed and I reproduced each one on r1 with my own script before confirming the fix on r2.
**A:** a warning that is on screen when a brew completes is taken away as the whistle / summary / break comes up, on
every layout. Tea time, Skip break and Done / Carry are never under it, apart from its own exit fade (≤ 0.2 s; ≤ 0.4 s
with reduced motion) while the summary itself is still animating in. **B:** on phones the warning is never shown over
Add 5 / Pause / Resume / End. Real touch taps on End open the End sheet, and no download happened in any run. The data-safety work that r1 had already verified
(round trip, invalid files, reset confirmation, no network, D1/D2) is unchanged in r2. Its e2e and unit tests are green again.
The phone trade-off (the warning waits until the person leaves the session screen) is acceptable. It is disclosed
accurately.

## What I ran

| Command / probe | Result |
|---|---|
| `npx tsc --noEmit --pretty false` (r2) | exit 0 |
| `npx vitest run` (r2) | 26 files, **265/265** (incl. both `storageFull.test.ts`) |
| `KETTLE_PORT=5251 KETTLE_PWA_PORT=5261 npx playwright test --project=chromium tests/integrity.spec.ts` (r2) | **25/25** (4.4 min): I03 15–19 ✓, placement 20–25 ✓ at 390×844, 375×667, 1440×900 |
| Timer suites `timer-harness` + `timer-app` (r2) | 26 passed, 2 by-design skips |
| r2's spec copied into the r1 tree, `KETTLE_PORT=5252 KETTLE_PWA_PORT=5262 … -g "never covers a control"` | **5 failed / 1 passed** (1.6 min). Fails: phone 390 + 375 "while brewing" (`Add 5 minutes @0` / `@2` hit-test false) and "just before 0:00" at all three sizes (`saveWarning toHaveCount(0)`, received 1). Passes: desktop "while brewing" (r1 already satisfied it). The new tests detect both defects. |
| **Defect B reproduced on r1** (my probe B, 390×844 dpr 2, touch, storage really full) | Hit-tests: Add 5 / Pause centres under the warning text, **End centre under "Save backup"**, for all 12 samples over 3 s. A real tap on Add 5 was swallowed (added nothing). 70 s later, after a failing Pause: Add 5 / **Resume** / End all covered. **A tap on End started a download ("Saved kettle-backup-…json") and the End sheet did not open** (`out/r1-B-390x844-light/b3-endsheet.png`). |
| **Defect A reproduced on r1** (my probe A, 390×844 dark; failed save 9 s before 0:00) | On `#/done` the warning was present at every 100 ms sample for 3 s, Tea time's centre was under the toast, and **a real tap on Tea time did not start the break** (timeout). |
| **B on r2** — probe B at 390×844 light, 375×667 dark (touch), 1440×900 light (mouse) | PASS. Running: Add 5 / Pause / End clear in 12 samples over 3 s after the brew starts (phones: warning count 0 throughout). Add 5 tap adds 5 min. Pause tap pauses; after that failing save, Add 5 / Resume / End are clear for 3 s. **End tap opens the End sheet. 0 downloads.** Keep brewing → Resume tap resumes, controls clear. End → confirm → Home shows "Saved 1 minute of focus" + the warning, with "Put the kettle on" clear. Desktop: the warning is shown beside the controls, all controls and the sheet's Keep brewing / End session are clear. |
| **A on r2** — probe A (real-tap Pause + Resume 9 s before 0:00) at 390×844 dark, 375×667 light, 375×667 light reduced motion, 1440×900 light + dark | PASS at all five. Summary: no warning, Tea time and Skip break clear at 30 samples over 3 s. **Real tap on Tea time starts the break.** Break: no warning, Skip break / Start next brew clear. Today afterwards: phones show the warning above "Put the kettle on" (CTA clear). Desktop holds it on Today, since the CTA is under the toast zone. 0 downloads. |
| **A, strict form on r2** — probe F/G: warning *visibly up* when the brew completes | 1440×900 dark: warning up on `#/focus`, gone before `#/done`; Tea time clear; shown again on Stats. **Phone 390×844**: the person was on Settings with the warning up while the brew ran out. The completion jumps straight to `#/done` with no whistle beat, and the warning was dismissed at once. Frame log (rAF): the toast fades out over the first **176 ms** (opacity 1 → 0.90 → 0.74 → 0) while the summary panel animates in. Tea time was first hit-testable at 207 ms and never under the toast after the fade. With reduced motion: fade ≤ 371 ms, Tea time hit-testable from 396 ms. A tap during the fade lands on the toast text and only dismisses it. "Save backup" sits above Tea time, not over its centre. Not a defect: see note 2. |
| Cost / cleanup (probe C, 390×844) | While held for a whole brew: one 250 ms interval, ~24 `getBoundingClientRect` calls/s, ~6 ms/s CPU (SwiftShader, loaded host). It runs only while a warning exists. The **interval is cleared** after a tap and after the 12 s timeout (live intervals 0). No page errors. |
| Auto-start (probe D, 390×844, auto breaks + auto brews) | During the auto cycle (focus → summary → break) the warning stays held and is never shown. Navigating to Today (break still running) shows it at once. |
| Other toasts (probe E) | Three newer toasts push the warning out of the max-3 stack. The state is then cleared after 1.5 s and it is not re-shown. The next failed save ≥ 60 s later raises it again, and a failure < 60 s later does not. |
| What it covers when it is allowed to show (probe H) | Today 390×844: the five category chips (68–100 %). Today 375×667: 39 % of the task field. Settings: tea-break length steppers. **"Save backup" sat over no control in any case** (a DIV / P underneath), so a tap on a covered control dismisses the toast and never downloads. |

## What I opened (Read tool, full size)

- Matrix § I03, `PRESERVE_LIST.md`, `PROTOCOL.md`, `M1-BRIEF.md`, `I03/CHECKER-r1.md`, packet
  `a6ebe00:…/I03/READY-FOR-REVIEW.md` (incl. "Response to Checker r1"), I01/I02 packets.
- Code: `git diff 6d5969e a6ebe00 -- kettle/src kettle/tests kettle/docs` (src: `flow.ts` only), full
  `git diff c80d068 a6ebe00 -- kettle/src`, `flow.ts` (whole file), `src/ui/Toast.tsx` + `Toast.module.css`
  (max 3, `onDismiss` not called on programmatic dismiss, `data-toast-above` lift), `DataSection.tsx` (`toast.dismiss()`
  before the import sheet), `docs/areas/timer.md` "Storage full".
- **K02** `VISUAL_BENCHMARK_LIBRARY/assets/current/07-summary.png`.
- BEFORE (`captures/before-r2/`, r1 `6d5969e`) and AFTER (`captures/after/`, r2 tree `e2d8326…`), **all six configs**
  (390×844 light/dark, 375×667 light/dark, 1440×900 light/dark) for **s0b, s1a, s1b** (36 files), plus s0 at 390×844
  light (both), s3 at 375×667 light, 390×844 dark and 1440×900 light (AFTER).
- My probe screenshots: `r1-B…/b3-endsheet.png`, `r2-B-390x844-light/b3-endsheet.png` + `b4-home-after-end.png`,
  `r2-F-390x844-light/f2-summary.png`, `r2-A-1440x900-light/a1-before-end.png` + `a3-summary.png`.

Visual judgement:
- **s0b paused.** BEFORE at both phone sizes and in both themes, the warning hides Add 5 / Resume / End, with Save backup over End. AFTER shows the Paused pill, the dimmed countdown, Add 5 / Resume / End fully visible and no warning. At 1440×900 BEFORE and AFTER are identical: the warning sits bottom-centre over the stage, clear of the controls.
- **s1a, 4 s before 0:00.** The same pattern: BEFORE covers the phone controls; AFTER shows "Almost whistling…" with Add 5 / Pause / End clear. On desktop the warning stays beside the controls.
- **s1b summary.** BEFORE on phones has the warning over Tea time (only Skip break visible). AFTER, at all six configs, matches K02: "25 minutes brewed", Done / Carry forward, reward card, and the docked **Tea time · 5 min** / **Skip break** footer fully visible, with no warning, no carousel and no forced claim.
- **s3.** The warning floats above "Put the kettle on" on phones, and the desktop shows none.

## Per-criterion findings

| Clause | Finding |
|---|---|
| Invalid imports preserve existing data | PASS — e2e 16 green; code unchanged since the r1 verification. |
| Valid backup restores sessions, settings and rewards (round trip) | PASS — e2e 15 green; unchanged. |
| Storage quota failures have understandable feedback | PASS. The copy is plain and carries a working Save backup. The file contains the unsaved brew (e2e 21/23/25). The restore refusal reads "…Nothing was changed." (e2e 18). The feedback is now **placed** so that it never takes a protected control (below). |
| **Defect A** (warning on screen at completion must not obstruct Tea time / Skip / summary actions) | **FIXED.** It fails on r1 in my probe and in the maker's tests. On r2 the e2e passes at 3 sizes. My probes A/F/G pass at 390×844, 375×667 and 1440×900, in both themes and with reduced motion, including the hardest phone path: the warning visible on another screen and the completion jumping straight to the summary. A real tap on Tea time starts the break, and the Skip break tap works. |
| **Defect B** (on phones no warning over Add 5 / Pause / Resume / End; no warning action intercepts an End tap) | **FIXED.** It fails on r1 (an End tap downloaded a backup). On r2, with real touch taps at 390×844 and 375×667, the controls hit-test clear while running, after a failing Pause and after Resume. **End opens the End sheet; 0 downloads.** Desktop is unaffected: the warning shows beside the controls and the sheet buttons stay clear. |
| Failed writes do not corrupt state | PASS — e2e 17 + unit storageFull green. Every storage-full probe completed the brew once (sessions 6 → 7 in memory). |
| Destructive reset requires explicit confirmation | PASS — e2e 15 green; unchanged. |
| Data sentences literally true ("Everything lives on this device") | PASS — e2e 19 green; unchanged. |
| Docs / packet truthful about the trade-off (r1 required it) | PASS. `docs/areas/timer.md` and the packet state that phones wait for the whole brew, that the warning shows on Today afterwards, that wide layouts show it during the brew, and that it may cover ordinary content until tapped away. All of this matches what I observed. r1 doc note 2 (settings-only change does not re-save brews) is corrected. |
| BLOCKED / UNKNOWN honesty | Honest: real-device quotas (iOS Safari / Firefox / Android) are BLOCKED. The `sync.ts` residual and the tab-close loss are disclosed. |

## Trade-off decision (phones: the warning appears only after the session screen)

Acceptable. PRESERVE 4/6/7 make Tea time / Skip and the working controls non-negotiable. With the current toast component (bottom, M2-owned), no phone placement during a brew avoids them. Checker r1 named exactly this hold as an acceptable correction (option a).
Nothing is lost while the warning waits: the brew completes and lives in the tab. The person is told in plain words, with the remedy, at the first moment the warning covers nothing protected: Today after Skip break, That's all for now or End, and any other screen.
The residual exposure is a phone user who closes the tab from the session screen, or who keeps auto-start breaks and brews on and never leaves. Such a user is not told before the in-memory brews are lost. That exposure is disclosed ("only closing the tab before saving a backup loses it"). It is bounded by an exceptional state (storage really full).
Recommended follow-up, not required for this contract: M2 adds `data-toast-above` to the session controls and the summary footer, so that the warning can float above them during the brew on phones. The maker already filed this suggestion.

## Non-blocking notes

1. Pushed out by three newer toasts, the warning is dropped until the next failed save ≥ 60 s later. Since every change
   fails while storage is full, it returns with the next change. Rare (needs three other toasts within 12 s).
2. When a *visible* warning meets a completion that skips the whistle beat (phone on another screen), its exit fade
   overlaps the first ≤ 0.2 s of the summary (≤ 0.4 s reduced motion). The summary is itself still entering. A tap there
   only dismisses the toast. Not a protected-control obstruction.
3. When it is shown on Today or Settings it briefly covers ordinary controls (category chips at 390×844, part of the task
   field at 375×667, Settings steppers). Save backup was never over a control, so there is no mis-tap download. This is the
   existing toast behaviour, owned by M2. The packet discloses it.
4. The 250 ms watcher forces at most about one layout per second while a warning exists (~6 ms/s measured). It is cleared
   reliably. Acceptable for an exceptional state.
5. The Checker r1 note on the `sync.ts` per-key failure flag is unchanged; it remains a documented residual and not reachable here.

## Preserve List

PRESERVE 4/6/7 (Tea time / Skip footer, Pause / Resume / Add 5 / End, compact summary): **now respected in the storage-full
state** (hit-tests + real taps at three sizes, both themes, reduced motion). PRESERVE 1: existing toast component and tones;
no `src/ui/**` change. PRESERVE 9/11: storage format and keys unchanged, no cloud/telemetry, disposable profiles only.
PRESERVE 12: only `flow.ts` changed in r2. Existing suites green.
