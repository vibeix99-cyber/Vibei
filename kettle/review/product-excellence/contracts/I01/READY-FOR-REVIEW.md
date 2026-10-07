# I01 — Reliable session time and exactly-once completion · READY FOR REVIEW

- **Maker:** M1 (session and data integrity). Branch `pe/m1`, worktree `/home/user/wt/m1/kettle`.
- **Revision:** the commit that adds this file (`git log -1 --format=%H -- kettle/review/product-excellence/contracts/I01/READY-FOR-REVIEW.md`),
  message `I01 I02 I03 READY FOR REVIEW: …`. Parent `49fcb3d` (WIP checkpoint of this same maker work).
- **Diff base:** `c80d068` (= `a8ffbd3` src + review tooling; app source identical to `8f1044a`). `git diff c80d068 <rev> -- kettle/src kettle/tests kettle/docs`.
- **Proposed state:** **CLOSED — PASSES WITHOUT CHANGE** for every I01 behaviour (reload, pause/+5 survival, suspension,
  late return, exactly-once, duplicate tabs). The one timer defect found (a brew lost at 0:00 when storage is full) is a
  storage-failure case and is filed, reproduced and fixed under **I03** (its code touches `src/timer/sync.ts`; see I03).

## Changed files (for I01)

| File | Change |
|---|---|
| `tests/integrity.spec.ts` | **New** real-browser spec (20 tests; I01 = tests 1–9). Disposable profile per test. |
| `docs/areas/timer.md` | New section "Integrity policies" (policy table below) + "Storage full"; test map; real-device gap. |
| `src/timer/sync.ts`, `src/lib/storage.ts`, `src/timer/storageFull.test.ts` | I03 repair (storage full), listed here because they are timer files. |

No other timer behaviour was changed.

## Commands run (final tree) and results

| Command | Result | Log |
|---|---|---|
| `npx tsc --noEmit --pretty false` | exit 0 | `../I03/runs/unit-on-fix.txt` |
| `npx vitest run` | 26 files, **265/265** passed | `../I03/runs/unit-on-fix.txt` |
| `KETTLE_PORT=5221 KETTLE_PWA_PORT=5231 npx playwright test --project=chromium tests/integrity.spec.ts` | **20/20** passed (2.8 min) | `runs/integrity-e2e-on-fix.txt` |
| same spec against a clean `git archive c80d068` copy (base) | 17/20: all I01 and I02 tests pass; the 3 storage-full tests fail (I03) | `runs/integrity-e2e-on-base.txt` |
| `KETTLE_PORT=5221 KETTLE_PWA_PORT=5231 npx playwright test --project=timer-harness --project=timer-app` (existing suite) | **26/26** passed | `runs/timer-e2e-on-fix.txt` |

## Policy table (actual behaviour, verified; also in `docs/areas/timer.md`)

| Situation | Policy |
|---|---|
| Reload mid-brew | Same brew, same `endsAt`; nothing recorded by the reload. |
| Pause → reload → resume | Still paused with the same remaining time; Resume sets `endsAt = now + remaining`; pause/reload cost nothing; paused time goes to `pausedTotalMs`, never counts as focus. |
| +5 → reload | `plannedMs`, `addedMs`, `endsAt` (+5 min) persist; the +5 gauge segment is still shown; completion records the full extended minutes. |
| Tab suspended (real Page Lifecycle freeze) across the end | Completes once, right after resume, at the **real** end (`endedAt = endsAt`), "while you were away" summary. |
| Two tabs, the leading one frozen across the end | The other tab completes it once; the frozen one wakes, mirrors, adds nothing. |
| Late return (closed past the end) | Completes once on next load at the real end with the right minutes + `whileAway`; further reloads add nothing. A **paused** brew never completes while away. |
| Repeated completion attempts | `finish()`×3, `tick()`×5, `end()`/`pause()` at 0:00, double-clicked Tea time → 1 record, 1 grant set (`focus:<id>`, `full:<id>`), 1 summary, 1 break. |
| Reload during whistle / on summary | Summary comes back; no second record or grant. |
| Duplicate tab (two pages, one profile) | 1 record, 1 grant; both tabs show the same summary; Tea time in one moves both. |
| Storage full while brewing | See I03 (was: brew lost at 0:00; now completes, kept in the tab, person warned). |

## Coverage map (observable success → test → result)

| Clause (MASTER_EVIDENCE_MATRIX I01) | Test(s) (`tests/integrity.spec.ts` unless noted) | Result |
|---|---|---|
| Started sessions survive **reload** | `+5 → reload …` (reload mid-brew, same `endsAt`); `dismissing the End sheet … or leaving the screen never stops the brew` (reload on Home) ; existing `timer.spec.ts` "reload mid-session" | PASS (base and fix) |
| **Paused** sessions survive reload | `pause → reload → resume: the paused time is kept and the deadline moves by exactly the pause` | PASS |
| **Extended** sessions survive reload | `+5 → reload: the extension, its deadline and the gauge segment survive; completion records the full 30 min once` | PASS |
| Survive **suspension** | `suspended tab (a real Page Lifecycle freeze) across the end …`; `two tabs, the leading one frozen across the end …` (raw CDP `Page.setWebLifecycleState`, real `freeze`/`resume` events asserted) | PASS |
| Survive **late return** | `late return: an extended brew that ended 2 h ago while the app was closed completes once …`; `late return to a paused brew: nothing completes …` | PASS |
| **Repeated completion attempts** → one record | `repeated finish / tick / end / pause at 0:00 and a double-clicked Tea time …`; `reload during the whistle and again on the summary …` | PASS |
| **Duplicate tabs** → one record | `two tabs on one profile: one record and one grant …`; `two tabs, the leading one frozen …`; unit `src/timer/multitab.test.ts` (split-brain, steal at completion, simultaneous start, follower End at 0:00) | PASS |
| "under the documented policy" | Policy table above + `docs/areas/timer.md` › Integrity policies | Written |
| **No unsupported background-audio guarantee** | Copy audit (grep of `src/**`): no claim that the whistle plays in a background/suspended/locked page. See note below. | PASS with one note for M2 |
| Clock edge cases (mapped, not duplicated) | `src/timer/dst.test.ts` (spring forward / fall back / midnight), `src/progress/dst.test.ts` (day keys, streaks), `src/timer/store.test.ts` ("keeps the countdown continuous when the clock is set back", "caps remaining at the plan when the clock went backwards while closed", "completion while away", "survives corrupt or hand-edited storage") | existing, green |

## References opened (Read tool) — transfer / do not copy

- **K04** `VISUAL_BENCHMARK_LIBRARY/assets/current/whistle-to-summary-phone-dark-reduced-motion-frames.jpg`: countdown 24:58 → 0:00
  "Tea's ready!" → one summary → tea break on one stage. Transfers: the countdown is the truth; exactly one summary; the tests
  assert `toHaveCount(1)` on the summary heading and the real end time. Do not copy: a silent clip proves nothing about audio
  or background behaviour (hence BLOCKED items below).
- **B03** `…/assets/official/forest-timer.webp`: one unambiguous countdown + one focus object. Transfers: the deadline must be
  the single operational truth across reload/suspend. Do not copy: Forest visuals/brand.

## Behaviour results

All I01 behaviours already held on the base revision (`runs/integrity-e2e-on-base.txt`, tests 1–9 ✓). No I01 code change.

## Preservation checks

Timer engine, leader/claims/sync semantics, whistle beat, summary and Tea time untouched (PRESERVE 3, 4, 6). The only edit in
`src/timer/` is the I03 storage-full guard in `sync.ts` (the self-initiated pre-completion re-read skips adopting storage
only when this tab's own last timer save failed); `storage` events from other tabs still mirror (unit test
"another tab's successful write still wins"). Existing timer e2e 26/26 and multitab unit tests green.

## BLOCKED / UNKNOWN

- **BLOCKED:** real mobile OS suspension/kill (iOS Safari, Android Chrome backgrounded, device sleep). Only Chromium's Page
  Lifecycle freeze (CDP) is reproducible here. Expected per design: completion on return with `whileAway`, but unproven on devices.
- **UNKNOWN:** whether the whistle is audible when the page is hidden/suspended on a phone. Kettle's copy does not promise it.
  Note for **M2 (owns audio/notify copy):** Settings › Notifications says "This browser can't show notifications. Kettle will
  chime instead." — that chime only plays while the page is running (not when suspended); consider "…will chime while Kettle is open."
- Cross-browser (Firefox/Safari) exactly-once is not run here (Chromium only).
