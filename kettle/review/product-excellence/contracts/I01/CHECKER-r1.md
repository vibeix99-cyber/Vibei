# I01 — Reliable session time and exactly-once completion · CHECKER r1

**Verdict: APPROVE**

- **Reviewed commit:** `6d5969e` (branch `pe/m1`), diff base `c80d068`, WIP parent `49fcb3d`.
- **Checker:** independent; did not build this work; no application or maker files edited.
- **Scope of approval:** the I01 behaviour (session time across reload / pause / +5 / suspension / late return,
  exactly-once completion, duplicate tabs, background-audio copy) at `6d5969e`. I03 is rejected in r1 (see
  `../I03/CHECKER-r1.md`); its correction will produce a new commit, so per PROTOCOL rule 6 this approval must be
  re-confirmed at that commit by re-running `tests/integrity.spec.ts` (tests 1–9), the timer suites and vitest. If the
  I03 correction touches `src/timer/**` beyond `flow.ts`-level toast handling, I01 needs a full re-check.

## What I ran (my own worktrees: `/home/user/wt/chk-m1` @ `6d5969e`, `/home/user/wt/chk-m1-base` @ `c80d068`)

| Command | Result |
|---|---|
| `npx tsc --noEmit --pretty false` (fix) | exit 0 |
| `npx vitest run` (fix) | 26 files, **265/265** passed |
| `KETTLE_PORT=5251 KETTLE_PWA_PORT=5261 npx playwright test --project=chromium tests/integrity.spec.ts` (fix) | **20/20** passed (3.7 min); I01 tests 1–9 ✓ |
| same spec copied into the base worktree, `KETTLE_PORT=5252 KETTLE_PWA_PORT=5262` | 17/20: tests 1–16 and 20 ✓; only the 3 storage-full tests ✘ — I01 behaviour already held on base, as claimed |
| `KETTLE_PORT=5251 KETTLE_PWA_PORT=5261 npx playwright test --project=timer-harness --project=timer-app` (fix) | **26/26** passed (3.2 min) |
| Checker unit probes (scratch copy, not in repo) on the `sync.ts` D1 guard — see "Edge cases" | ran with fix and with `sync.ts` reverted |
| Checker browser probe P5 (bfcache eligibility of a tab with a running brew) | see "Edge cases" |

## What I opened

- `MASTER_EVIDENCE_MATRIX.md` § I01; `PRESERVE_LIST.md`; `PROTOCOL.md`; `M1-BRIEF.md`; packet `I01/READY-FOR-REVIEW.md`.
- Full diff `git diff c80d068 6d5969e -- kettle/src kettle/tests kettle/docs`; `src/timer/sync.ts`, `ticker.ts`
  (completion guard wiring, freeze/resume/pageshow), `store.ts` (`tick`, `end`, completion guard), `claims.ts`,
  `src/progress/store.ts` (`recordSession` dedupe, `syncFromStorage`).
- Every I01 test body in `tests/integrity.spec.ts` (not tautological: they assert stored bytes in localStorage, the
  ledger grant ids, `endedAt === endsAt`, real `freeze`/`resume` events via raw CDP, summary heading counts).
- `docs/areas/timer.md` "Integrity policies" (matches observed behaviour).
- K04 frames and B03 are referenced by the packet; no visual change in I01, so no capture review was needed for it.

## Per-criterion findings (matrix: Observable success)

| Clause | Finding |
|---|---|
| Started sessions survive reload | PASS — `+5 → reload` (same `endsAt`), I02 dismissal test reloads on Home, existing timer suites "reload mid-session" (26/26). |
| Paused sessions survive reload | PASS — `pause → reload → resume` asserts same `remainingMs`, `endsAt = resume + remaining` (±50 ms), `pausedTotalMs ≥ 2 s`. |
| Extended sessions survive reload | PASS — `addedMs`, `plannedMs`, `endsAt` +5 min persist; record `focusedMs = 30 min`, grant 30. |
| Survive suspension | PASS — raw-CDP `Page.setWebLifecycleState` freeze with `freeze`/`resume` events asserted; completes once after resume at the real end with `whileAway`. Two-tab frozen-leader case: one record, one `full:` grant. |
| Survive late return | PASS — planted state 2 h past end completes once at `endedAt = endsAt`, 30 min, "while you were away"; two further reloads add nothing; paused brew never completes while away. |
| Repeated completion attempts → one record | PASS — `finish()`×3, `tick()`×5, `end()`/`pause()` at 0:00, double-click Tea time: 1 record, grants exactly `focus:`/`full:`, unique ledger ids, 1 break. Reload during whistle and on summary: no re-grant. |
| Duplicate tabs → one record | PASS — two pages in one context: 1 record, 1 grant, same summary in both, Tea time in one moves both. Plus unit `multitab.test.ts`. |
| "under the documented policy" | PASS — policy table in `docs/areas/timer.md` matches what I observed. |
| No unsupported background-audio guarantee | PASS with note — copy audit (`grep` of `src/**`): no claim that the whistle plays while the page is hidden/suspended. "Kettle will chime instead" (Settings, `SettingsScreen.tsx:182`) and "Kettle will still chime" (`welcome/steps.tsx:236/241`) describe the in-page chime; the maker's suggestion to M2 ("…while Kettle is open") is reasonable but owned by M2. The packet mentions only the Settings string; the two welcome strings should be included in that note to M2. |
| Clock edge cases mapped, not duplicated | PASS — `dst.test.ts` (timer + progress), `store.test.ts` clock-back cases exist and are green. |
| BLOCKED / UNKNOWN honesty | Honest: real mobile OS suspension/kill, hidden-page audibility, Firefox/Safari exactly-once are marked BLOCKED/UNKNOWN, not passed. |

## Edge cases probed (D1 guard in `src/timer/sync.ts`)

The guard skips the self-initiated pre-completion re-read when this tab's own last timer save failed.

- **U1 — duplicate completion?** Tab whose +5 save failed; "another tab" completed the same session and its writes
  landed; this tab missed the storage event. With the fix this tab emits its own `timer:complete` (a second
  summary/whistle in that tab), but `recordSession` dedupes by id: **1 record** in memory and storage. With `sync.ts`
  reverted: 0 extra completions. → no duplicate record; worst case a repeated summary in a tab that missed events.
- **U2 — stale overwrite?** Same tab, while another tab has since completed X and started brew Y (writes landed, event
  missed). With the fix the stale tab completes X and writes `idle` over Y in storage (Y would be reset in the other tab
  via its storage event); with `sync.ts` reverted the re-read adopts Y. So the guard opens a theoretical loss path.
- **Reachability:** it requires (a) this tab's own timer write failed, (b) room was later made so another tab's write
  landed, and (c) this live tab missed that tab's `storage` event. Chromium delivers storage events to every live
  same-origin document (hidden ones included); a frozen page's tasks are queued and its completion is additionally
  gated by re-acquiring leadership + settle on resume. Probe **P5**: a Kettle tab with a running brew navigated away
  and back is **not** restored from bfcache (`pageshow.persisted=false`, fresh document), so the bfcache path does not
  occur in Chromium. → Not reproducible in a real browser here; **non-blocking residual risk**. Recommended (not
  required): make the guard compare the stored raw value with the last value this tab saved/read, and adopt storage
  whenever it differs (i.e. someone else wrote), instead of a per-key "last write failed" flag.

## Preserve List

No change to timer engine semantics, leader/claims, whistle beat, summary, Tea time (3, 4, 6). Storage format and keys
unchanged (11). No cloud/telemetry (11). Existing timer e2e 26/26 and multitab unit tests green (12).
