# W3R2 hardening round: plan (orchestrator)

**Binding:** `VB-DECISIONS-W3R2.md`. The Final Product Boss stays on hold.

## Recovered state (2026-10-17 16:00 UTC)

- **Integration HEAD:** `494748b`, equal to origin, tree clean. App `5f78af1` (src `b74e6b3`), tests `3e7b189`.
- **W3R1:** closed. F1 fix merged (`5f78af1`); N-2 closed with its guard spec merged (`d71fcfa`). See STATUS.md and `contracts/W3R1/review/GATE.md`.
- **Machine:** freshly restarted (nproc 4). The slot gate MAX is 3 (nproc−1) and its state was reset. Old W2/W3R1 worktrees were removed to free disk (8.2 GB free). Their branches and archive bundles stay.

## Servers

| Port | What | Worktree |
|---|---|---|
| :5560 / :5570 | integration HEAD `494748b`, the **control** for all three items | `w6-int` |
| :5478 / :5488 | old base `4d36939`, a secondary control | `w4-final` |
| :5581 | item 1 maker SG (dev) | `w8g`, branch `pe/w3r2-sync-guard` |
| :5582 | item 2 maker TH (dev) | `w8t`, branch `pe/w3r2-toast-hook` |
| :5583 | item 3 maker TS (dev) | `w8q`, branch `pe/w3r2-test-stability` |

All five dev servers were verified, serving their HEAD's committed files.

## Ownership check: no overlap, so all three run in parallel

| Item | Maker | Files it may change | Must not touch |
|---|---|---|---|
| 1 Sync guard | **SG** (Opus) | `src/timer/sync.ts`, `src/timer/store.ts` (and other `src/timer/*` only if the guard needs them); `src/timer/intentionRace.test.ts` and `tests/w3-intention-race.spec.ts` (extend only); new `src/timer/staleTab.test.ts` and `tests/w3r2-stale-tab.spec.ts` | `src/ui/*`, `src/screens/*` (including `Composer.tsx`), `tests/timer.spec.ts`, `tests/notice-strip.spec.ts`, `tests/integrity.spec.ts`, `src/timer/multitab.test.ts` (no weakening; a needed change goes to LEAD) |
| 2 Toast hook | **TH** (Sonnet) | `src/ui/Toast.tsx` only | everything else |
| 3 Test stability | **TS** (Sonnet) | `tests/timer.spec.ts`, `tests/notice-strip.spec.ts` only | everything else, including all `src/` |

- Items 2 and 3 never meet item 1's files.
- Item 3's `timer.spec.ts` exercises the timer that item 1 changes, but its edits are test-only and are judged on base. The interaction is covered by the post-merge regression.
- Merge order is as approved. Each merge is checked against its own trial; a later merge gets a fresh trial on the new HEAD.

## Process

- Each maker writes its packet in stages under `contracts/W3R2/<SG|TH|TS>/`.
- **Gate (orchestrator):** scope check, trial merge on the current integration HEAD, tsc + vitest + build, trial servers verified, archive bundle, `review/GATE.md`.
- **LEAD (Opus; LEAD-5, resumed)** gives one verdict per item in `CHECKER-W3R2-<item>.md`, rerunning its ◆ checks. On REJECT there is one 90-minute fix round.
- **Item 1** also gets a Sonnet regression lane (Lane R2) on its trial before LEAD's verdict: timer/PWA, integrity, home, the notice suites, and the 2-tab manual check with real clicks.
- **Merge** only on APPROVE; verify the merged `kettle/src` and `kettle/tests` trees equal the trial's.
- **After all merges:** a Sonnet full regression on the merged tree (Lane RF), LEAD classifies any failure, then the report to Vibei.
- **Budgets:** SG 3 h (hard stop 19:15 UTC); TH and TS 2 h (hard stop 18:15 UTC).
