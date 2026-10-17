# W3R2 gate record (orchestrator)

## Start, 2026-10-17 16:10 UTC

- **Integration HEAD:** `494748b` (app `5f78af1`, src `b74e6b3`, tests `3e7b189`); clean and equal to origin.
- **Servers verified:**
  - :5560 / :5570 integration (`w6-int`);
  - :5478 / :5488 old base `4d36939` (`w4-final`);
  - :5581 SG (`w8g`), :5582 TH (`w8t`), :5583 TS (`w8q`), each at `494748b`.
- **Slot gate:** MAX 3 (nproc 4 − 1), state reset. Autocommit restarted.
- **Ownership** (PLAN.md): SG `src/timer/*` plus new or extended race tests; TH `src/ui/Toast.tsx`; TS `tests/timer.spec.ts` and `tests/notice-strip.spec.ts`. No overlap, so all three run in parallel.
- **Makers launched:** SG (Opus, stop 19:15), TH (Sonnet, stop 18:15), TS (Sonnet, stop 18:15).

## Item 2, TH (`Toast.tsx:482` hook): GATE PASSED, 2026-10-17 ~18:00 UTC

| Item | Result |
|---|---|
| Revision | `pe/w3r2-toast-hook@203b057` (one commit on `494748b`), src `07df367`. Packet `contracts/W3R2/TH/TH-READY.md` (through `5ad2478`) |
| Scope (checked) | `src/ui/Toast.tsx` only, +5/−1. `NoticeStrip` reads `useContext(Leaving)` and `useIsPresent()` into variables, then `leaving = layerLeaving \|\| !present \|\| off`. Nothing else |
| **Trial** | **`0ad85b9`** = integration `36402ba` (app `5f78af1`) + `203b057`, worktree `/home/user/wt/w8tr-t`, src `07df367`, tests `17d135a` (= integration). tsc 0, vitest **314/314**, build OK. Dev **:5592** (verified, `Toast.tsx` served), preview **:5594** (200) |
| The maker's claims | **Hook-order errors, base :5560 vs fix :5582:** `notice-strip` 24 vs 0, `w3-notices` 9 vs 0, `w3-notices-idle` 0 vs 0 (never leaves Today), `summary-notice` 28 vs 0, `toast-room` 12 vs 0; **total 73 vs 0**. No other new console error, warning or pageerror. Reproducer (start, end, back to Today): base 1/1 ×3, fix 0 ×3. **Audit:** AST rules-of-hooks over 21 hook calls; base flags 1 (`:482`), fix flags 0. `useIsPresent` is a context read only (motion 13.4.4 `use-presence.mjs:64-69`), with no register, so exit timing is unchanged. **Suites on the fix:** notice suite 74/74 (`notice-strip` 25/25); base 73/74, with one `notice-strip` 844×390 light 200 % reduced setup-tap failure (the `press()` re-aim flake, TS's item). **Captures:** 16 configs × 12 states = 192 pairs, plus a base recapture for the noise floor: 148 identical, 34 within noise, 10 flagged. The maker reads all 10 as capture variance (AFTER varies among itself as much as it differs from base, or ≤ 5 px; none in a notice strip; the 2 large ones are focus-scene motion phases, and an AFTER recapture matched base exactly) |
| Not run by the maker | the rest of the chromium project; the timer and pwa projects. One 4 s console smoke test at ~16:08 ran outside the slot gate |
| Archive | `archive/pe-w3r2-toast-hook-203b057.incremental.bundle` (requires `494748b`) |
| Next | LEAD verdict (Opus) on trial :5592 |

## Item 1, SG (stale-tab guard): GATE PASSED, 2026-10-17 ~18:10 UTC

| Item | Result |
|---|---|
| Revision | `pe/w3r2-sync-guard@54a9721` (`c917293`, `e18b621` app final, `54a9721` adds a Vitest case), src `dd6944e`. Packet `contracts/W3R2/SG/SG-READY.md` |
| Scope (checked, `494748b..54a9721`) | `src/timer/store.ts` (+79/−6 overall with sync), `src/timer/sync.ts`, new `src/timer/staleTab.test.ts` (+563), new `tests/w3r2-stale-tab.spec.ts` (+193). Nothing else: `multitab.test.ts`, `Composer.tsx`, `timer.spec.ts`, `notice-strip.spec.ts` and `Toast.tsx` are untouched |
| **Trial** | **`88d6b64`** = integration `339d85c` (app `5f78af1`) + `54a9721`, worktree `/home/user/wt/w8tr-g`, src `dd6944e`, tests `4701f04`. tsc 0, vitest **338/338**, build OK. Dev **:5591** (verified; `store.ts` and `sync.ts` served), preview **:5593** (200) |
| Design (the maker's) | **Write side** (`store.ts`): every action except `tick`, `reset`, `setIntention`, `syncIdleLength` and `toggle` first takes in what storage holds now. On the same brew it acts on the brew as it is now; on an ended or replaced brew it does nothing and shows the current one; new actions are guarded by default. **Receive side** (`sync.ts` `olderThanMine`): before adopting a stored state, a tab holding a newer brew keeps it and saves it back, which covers the doubly stale case in any event order. "Newer" uses existing fields only. `reset()` now removes the key first, so other tabs follow a wipe. Storage format unchanged |
| The maker's claims | `staleTab.test.ts` 24 cases: **17 fail on HEAD**, 24/24 on the fix (10× deterministic); per trigger: rebase, pause, resume, +5, end, start, doubly stale typed edit (including 3 tabs), doubly stale pause. Browser spec: **12/12 fail on :5560**, 4/4 fail on :5478; 12/12 + 4/4 pass on the fix. The singly stale typed edit passes on HEAD (F1 already guards it). Existing race tests 71/71; `w3-intention-race` 6/6; vitest 338/338; compatibility 12/12 byte-identical; `integrity:309` ×20 under load **20/20 ×2**; integrity 25/25; `w2-home` 18/18; timer 26 + 2 skipped; pwa 3/3 |
| **LEAD ruling needed** | `multitab.test.ts:229` asserts `intention` is `'from B'` (last writer wins). It stays green only because that harness does not install the new catch-up; with the app's wiring, B joins A's brew. The maker proposes installing the catch-up in the harness and expecting `'from A'` (15/15). The file is not edited |
| Open (packet §7) | Same-brew older fields while doubly stale (e.g. A's +5 lost; telling versions apart would need a stored field). A bfcache-restored paused brew could come back over an idle timer, never over a live one. `flow.ts` `startNextBrew` leaves `suppressNextStop` set when its `end` no-ops (same gap on HEAD at 0:00). The Focus screen "+5 min" note shows when the +5 was dropped. Composer label: unchanged, logged |
| Archive | `archive/pe-w3r2-sync-guard-54a9721.incremental.bundle` (requires `494748b`) |
| Next | **Lane R2** (Sonnet) regression on :5591; then the LEAD verdict |

## Item 3, TS (test-only stability): GATE PASSED (scope), handed back with its 10/10 target NOT met, 2026-10-17 ~18:20 UTC

| Item | Result |
|---|---|
| Revision | `pe/w3r2-test-stability@21e5644` (`a6b3790`, `21e5644`), tests `59f5e49`; src unchanged (`b74e6b3`). Packet `contracts/W3R2/TS/TS-READY.md` (evidence `d1b9080`) |
| Scope (checked) | `tests/timer.spec.ts` (+13/−5) and `tests/notice-strip.spec.ts` (+33/−5) only. No `src/` change |
| **Trial** | **`6babf87`** = integration `f4e57e1` + `21e5644`, worktree `/home/user/wt/w8tr-q`, src `b74e6b3` (= integration, so specs run against **:5560**), tests `59f5e49`. tsc 0; `--list` gives 53 tests in the 2 files |
| The maker's changes | **timer `:156`:** observer, `startFocus`, the `endsAt`/`sessionId` read and the freeze are one `page.evaluate` chain. Observer-first alone was not enough: `state()` then read an idle timer. All six asserts are unchanged line for line. **timer `:183` (now `:189`):** `setHidden(true)` moved before `start()`; every `expect` is untouched. **`press()`:** a not-on-top re-check is re-read up to 8× at 250 ms (~2 s); a target that left the view is walked back by the existing wheel walk (max 2). The tap still follows only a move-then-on-top read; the expect and its message are unchanged |
| The maker's claims | **Injected race:** the timer pair fails 8/8 on old and passes 8/8 on new. A transient 300 ms cover: old fails, new passes. A permanent cover: both fail with the same message. A 1.5 s cover passes, a 3.5 s cover fails. **Under load** (2 workers + 4 burners, load 12–23): `:156` 10/10 + 10/10 (timer-app, harness); hidden page 10/10 + 10/10. **notice 844×390 dark 200 % ×10: 9/10, NOT 10/10** (one failure, same message). Whole `timer.spec.ts` 26 + 2 skipped. **Whole `notice-strip` 25/25 NOT run** (partial 3/3) |
| Open (the maker's) | The cause of the remaining first-press failure is not observed (candidate, unconfirmed: the sticky docked Start). An UNVERIFIED chrome-aware rescroll patch is in the packet's `scratch/`. The old tests were not run under the same burners as a control. The 2 s window is a judgement |
| Archive | `archive/pe-w3r2-test-stability-21e5644.incremental.bundle` (requires `494748b`) |
| Next | LEAD verdict. Vibei's bar ("each test must pass 10/10 under load") is not met for `press()` |

## Item 2, TH: APPROVE (LEAD-5 `f4fb5b3`, `CHECKER-W3R2-TH.md`) → merged as `7cb3242` (2026-10-17 ~19:05 UTC)

- **Merge check:** the merged src `07df367` and tests `17d135a` equal trial `0ad85b9`'s.
- **LEAD-5's results:**
  - **Hook-order errors** (its own count via Chromium's console log), base vs trial: `notice-strip` 4 vs 0, `summary-notice` 28 vs 0, `w3-notices` 9 vs 0. No other console line.
  - **`notice-strip` on :5592:** 23/25 in one full run. Both failures are flaky and not from TH: TS's re-aim flake (2/2 on rerun), and a Stats tab link 0.4 px past the viewport edge (3/3 trial and 3/3 base when rerun alternately).
  - **Captures:** 148/192 identical; each of the other 44 is a frame the base itself reproduces. None is in a notice strip.
- **Integration HEAD app code is now `7cb3242`** (src `07df367`).

## Item 1, SG: REJECT (LEAD-5 `2a33de1`, `CHECKER-W3R2-SG.md`). One 90-minute fix round

- **The design holds:**
  - every trigger fails on HEAD and passes on the fix (Vitest 17/24 vs 24/24; browser 4/4 vs 8/8);
  - compatibility is byte-identical;
  - `integrity:309` 20/20 under load;
  - Lane R2's 2-tab check: 25/25 on the fix, 5/25 on :5560.
- **Blocking defects:**
  - **SG-D1 (introduced):** a tab that missed the other tab's updates (e.g. bfcache) puts back a brew the other tab ended under 1 minute in, then completes it. That writes a false 25-minute record.
  - **SG-D2 (worse than HEAD):** in `flow.ts`, `suppressNextStop` stays set when the lagging tab's end is dropped, so that tab's next stop loses its "Saved" toast and doesn't go home.
  - **SG-D3 (introduced):** Focus shows "+5 min" and plays the pause/resume sound when the action was dropped.
- **Rulings:**
  - `multitab.test.ts:229`: take the maker's proposal (b) in the fix round (install the catch-up, expect `'from A'`). It is not a weakening.
  - `reset()` change: ACCEPTED.
  - FOLLOW-UPs: the doubly stale +5 loss, the bfcache paused brew, and the composer label.

## Item 3, TS: REJECT (LEAD-6 `97f89c9`, `CHECKER-W3R2-TS.md`). One 90-minute fix round, 19:15–20:45 UTC

- **What holds:**
  - **No weakening:** `:156` and `:189` are not weakened, 10/10 each under load. The injected races fail 2/2 on the old code and pass 2/2 on the new.
  - **`press()`'s wait path is sound:** a permanent cover fails with the same words.
  - **Whole `notice-strip`:** 25/25 without burners. All LEAD-6 runs used src `b74e6b3`, before :5560 switched.
- **TS-D1 (BLOCKS):** 844×390 dark 200 % under load is 7/10, 7/10 and 8/10.
  - **The cause is now observed:** the Today composer dock first measures 255 px (`data-tall`, in flow), then about 0.5 s later docks (`.ctaDock`, sticky) over the field for good. It is the same flake as W3R1's and TH's base run.
  - **Required:** a chrome-aware wheel-clear, limited to the page's own dock and tab bar or rail. Notices, sheets and unknown covers keep the wait-only path.
- **TS-D2 (BLOCKS):** a rescrolled `press()` could end in the sheet's Tab+Enter or a synthetic `click()`. It must fail instead.
- **Acceptance (LEAD-6 reruns):**
  - injections: dock fails on old and passes on the fix; transient passes; the permanent covers fail;
  - dark 200 % ×20 20/20, and light 200 % reduced ×10 10/10, under load;
  - the diagnostic copy shows the new path is taken;
  - whole file 25/25.
- **Product note for Vibei** (pre-existing, out of scope): the Today dock switches mode after boot at 844×390 @200 %.

## Item 1, SG fix round (SG-D1..D3): GATE PASSED, 2026-10-17 ~19:45 UTC

| Item | Result |
|---|---|
| Revision | `pe/w3r2-sync-guard@4b2690f` (one commit on `54a9721`), src `8a67658`. Packet `contracts/W3R2/SG/SG-READY.md` §8, logs `SG/logs/r2/` |
| Scope (checked, `54a9721..4b2690f`) | `src/timer/sync.ts` (+9: rule 4), `src/timer/store.ts` (dropped actions return `false`), `src/app/flow.ts` (+4: `suppressNextStop = false` after `end('skip')`, **the flag only**, as widened), `src/screens/focus/FocusScreen.tsx` (**`toggle` and `addFive` only**, as widened), `src/timer/multitab.test.ts` (the ruled edit: catch-up installed, expects `'from A'`), `staleTab.test.ts` (+72), `w3r2-stale-tab.spec.ts` (+41). Nothing else |
| **Trial 2** | **`2c9ec66`** = integration `d8749ad` (app `7cb3242`, with TH) + `4b2690f`, worktree `/home/user/wt/w8tr-g2`, src `5f504d4`, tests `8109152`. tsc 0, vitest **342/342**, build OK. Dev **:5601** (verified; `store.ts`, `sync.ts`, `flow.ts`, `FocusScreen.tsx` and `Toast.tsx` served), preview **:5603**. The first trial :5591/:5593 stays up until Lane R2 finishes |
| The maker's claims | **D1:** LEAD-5's probes (1) and (3) fail on `54a9721` and pass on the fix. (2) fails on HEAD (pre-existing) and now passes. Doubly stale restores #13, #14, #16, #17 and #24 still pass; a new guard case passes. **D2/D3 (browser):** the add 5 case (note shown) and a new Next brew case (toast missing) fail on `54a9721` and pass 10/10 on the fix. Vitest 28 cases: `54a9721` 3 fail, HEAD 19 fail, fix 28/28. **Reruns:** vitest 342/342; tsc 0; race files 10× 55/55; stale-tab spec fix 10/10, HEAD :5560 5/5 fail; compatibility 6/6 byte-identical; `integrity:309` ×20 under load 20/20 |
| Open | LEAD-5's FOLLOW-UPs only (the doubly stale +5 loss, the composer label). The bfcache paused-brew case is now covered, except a very rare third-stale-tab `lastEnded` rollback |
| Archive | `archive/pe-w3r2-sync-guard-fix-4b2690f.incremental.bundle` (requires `54a9721`) |
| Next | LEAD-5's final SG verdict on :5601, with Lane R2's receipt |

## Lane R2 receipt (SG first trial `88d6b64`, :5591), and a correction to the control switch time (2026-10-17 ~19:55 UTC)

- **R2 results** (`review/R2/RECEIPT-R2.md`, last `70661a0`), at load 5–20:
  - tsc 0; vitest 338/338.
  - timer, timer-harness and pwa: 29 passed + 2 skipped (by design).
  - integrity 25/25; `:309` ×10 10/10.
  - `w2-home` 18/18; `w3-intention-race` 2/2; `w3r2-stale-tab` 4/4.
  - Notice suites 74/74.
  - **2-tab check with real clicks, B's storage held, passes out of 5 (fix vs control):**
    - (a) pause: fix 5, control 0 (A's +5 lost);
    - (b) +5 after A paused: fix 5, control 0 (the brew runs again);
    - (c) end: fix 5, control 0 (A's second brew gone);
    - (d) no hold: 5 on both;
    - (e) +5 on a replaced brew: fix 5, control 0;
    - (f) pause on a replaced brew: fix 5, control 0.
  - Page errors: 0.
  - On the first trial, the "+5 min" note still showed after a dropped +5 (5/5): that is **SG-D3, fixed in the fix round**.
- **Correction (orchestrator):** :5560/:5570 switched to the new integration HEAD (app `7cb3242`, src `07df367`) at **19:02:16–19:02:59 UTC**, not "about 19:12" as I told LEAD-6, Lane R2 and maker TS. R2 established this from its own served-file checks.
  - LEAD-6's TS runs dated 19:02–19:07 may have used src `07df367` (TH's `Toast.tsx` hook change) rather than `b74e6b3`.
  - LEAD-6 is asked to note this in its fix-round review.

## Item 3, TS fix round (TS-D1, TS-D2; R3, R4 taken): GATE PASSED, 2026-10-17 ~20:20 UTC

| Item | Result |
|---|---|
| Revision | `pe/w3r2-test-stability@89396e8` (`a6b3790` and `21e5644` kept; adds `1befde2` for TS-D1/D2 and `89396e8` for R3), tests `1f5feee`. Packet `TS-READY.md` §6, logs `TS/logs/r2/` (evidence `34daff1`) |
| Scope (checked, `21e5644..89396e8`) | `tests/notice-strip.spec.ts` (+35/−15) and `tests/timer.spec.ts` (+5/−2, R3 only). No `src/`, no other spec, no config |
| **Trial 2** | **`41b3424`** = integration `34daff1` (app `7cb3242`, src `07df367`) + `89396e8`, worktree `/home/user/wt/w8tr-q2`, tests `1f5feee`. tsc 0; `--list` gives 53 tests in the 2 files. The app equals integration, so specs run against **:5560** |
| The maker's claims | **TS-D1:** `press()` rescrolls (the existing wheel walk, within `AIM_RESCROLL=2`) a target that is in view but whose every non-target read point lies in the page's docked chrome (`.ctaDock` or `nav[aria-label=Main]`). Notices (`[data-notice-strip]`, `[data-inline-undo]`, `[inert]`), open sheets (`[role=dialog]`, `#root[inert]`) and other or mixed covers stay wait-only. Bound: ≤ 3 calls per target, each ≤ 8 re-reads (~2 s) and one walk. **TS-D2:** sheet fallbacks run only when `rescrolled === 0`. **Injection** (:5583, workers=1): `COVER=dock` fails `21e5644` and passes the fix; transient passes; permanent-abs and permanent fail with the same words; a sheet target out of view for good passes `21e5644` by Tab+Enter but fails on the fix. **Under load** (:5560, src `07df367`, 2 workers + 4 burners killed by PID): dark 200 % ×20 **20/20** (load 15.4→12.6); light 200 % reduced ×10 **10/10**. Diagnostic copy ×10: 10/10, docked-chrome path taken 2×. Whole `notice-strip` **25/25**. **R3:** `:156` asserts `endsAt − frozeAt ≥ 1000 ms`; ×10 under load in each project 10/10; a 2.5 s freeze-delay copy fails the new line. **R4:** sentences corrected. §6 records the 19:02 switch |
| Open | `:189` and the whole `timer.spec.ts` were not rerun after R3 (which touches `:156` only). Product note R8 (the dock changes mode after boot) is unchanged |
| Archive | `archive/pe-w3r2-test-stability-fix-89396e8.incremental.bundle` (requires `21e5644`) |
| Next | LEAD-6's final TS verdict |

## Item 1, SG: APPROVE `4b2690f` (LEAD-5 `4db5fa1`), conditional on a Lane R2 rerun on trial 2 (:5601) before merge (2026-10-17 ~20:20 UTC)

- **All three defects closed**, each within the scope widened for the round.
  - **SG-D1:** LEAD-5's unchanged probe passes 3/3. Vitest 28 cases: 3 fail on `54a9721`, 19 on HEAD, 28/28 on the fix. Every doubly stale restore still works.
  - **SG-D2 and SG-D3:** their browser cases fail on :5591 and pass on :5601.
- **LEAD-5 reruns on :5601:** stale-tab spec 10/10 (HEAD :5560 5/5 fail); compatibility 6/6 byte-identical; `integrity:309` ×20 under load 20/20; vitest 342/342; tsc 0. `multitab.test.ts` carries exactly the ruled edit.
- **Condition:** Lane R2 reruns on :5601, because the fix round touched single-tab code (`flow.ts` Next brew, `FocusScreen.tsx` pause/+5) and :5601 is the first build with TH and SG together.
  - The rerun covers timer/PWA, integrity plus `:309` ×10, `w2-home`, the race and stale-tab specs, the notice suite, and the 2-tab check (a)–(e). In (e), no "+5 min" note may show.
  - **Merge if green; any failure goes back to LEAD-5.** Rerun started 20:20 UTC (stop 21:45).
- Servers for superseded trials (:5591/:5593, :5592/:5594) and the TH maker (:5582) are stopped.

## Item 3, TS: APPROVE `89396e8` (LEAD-6 `23c6d1a`, `CHECKER-W3R2-TS.md` fix round) → merged as `a391cdc` (2026-10-17 ~20:45 UTC)

- **Merge check:** the merged src `07df367` and tests `1f5feee` equal trial `41b3424`'s.
- **LEAD-6 on trial 2** (against :5560, src `07df367`):
  - **No assertion weakened.** Only a target under the Today dock or main nav is wheeled clear; notices, sheets, inert parts and other covers wait and fail with the same words. A rescroll never falls back (TS-D2 closed). `:156` gains the freeze-before-end check.
  - **Injections:** dock fails on old and passes on the fix 3/3; transient passes; the permanent covers fail; the sheet passes on old via Tab+Enter but fails on the fix; a 2.5 s freeze delay fails the new `:156` line.
  - **Under load** (load 9–17): dark 200 % 10/10; light 200 % reduced 10/10; diagnostic 10/10 (it did not hit the race; the maker's run hit it twice, and the fix cured both); `:156` 10/10 in both projects.
  - **Whole files:** `notice-strip` 25/25; `timer.spec.ts` 26 + 2 skipped (covering `:189` after R3).
- **FOLLOW-UP for Vibei:** R8, the Today dock switching mode after boot at 844×390 @200 %. Pre-existing.
- **Integration HEAD tests now `1f5feee`**; app unchanged at `7cb3242` (src `07df367`).
- **Item 1 (SG)** merges after Lane R2's rerun on :5601. It does not overlap TS's files. Its merged src must equal trial 2's `5f504d4`, and its merged tests must be trial 2's plus TS's two files.

## Lane R2 rerun on SG trial 2 (:5601), 2026-10-17 ~21:20 UTC: green apart from one PWA failure, sent to LEAD-5

- **R2 §R** (`review/R2/RECEIPT-R2.md`, `bbaee84`), at load 5–20:
  - tsc 0; vitest 342/342; integrity 25/25; `:309` ×10 10/10; race and stale-tab 7/7; `w2-home` 18/18; notice suites 74/74.
  - **2-tab check, real clicks, 5/5 for every case on :5601:** (a) pause; (b) +5; (c) end; (d) no hold; (e) +5 on a replaced brew, with no "+5 min" note (the control shows it 5/5); (f) pause on a replaced brew, with no pause or resume sound; (g) Next brew, joined, then "Saved 1 minute of focus" and home (the control replaces A's brew 5/5).
- **Failure:** `pwa.spec.ts:85` (line 91, the `needRefresh` wait).
  - It failed on :5601 and on :5560, then passed 3/3 on a clean PWA port.
  - R2's cause: its own leftover first-pass preview (PID 409) held the PWA port :5498, so the test ran against an old build.
  - The orchestrator also found and killed SG maker's leftover `test-results/pwa-dist` preview on :5597 (PID 10314).
  - **Sent to LEAD-5 to rule before the SG merge**, per its condition. Every PWA-project result this round is flagged as possibly affected by stray builds.
