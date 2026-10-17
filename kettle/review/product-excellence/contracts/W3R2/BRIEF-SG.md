# Maker SG (Opus): the stale-tab guard (W3R2 item 1)

**Binding:** `VB-DECISIONS-W3R2.md` §1.

**Background (read first):**
- `contracts/W3R1/CHECKER-W3R1-F1FIX.md` §4 (the audit: `rebase`, the action-triggered writers, the doubly stale typed edit, and the recommended receiving-side guard), §7 and §9;
- `contracts/W3R1/F1FIX/F1FIX-READY.md` (how F1 was fixed and tested);
- `contracts/W3R1/review/F1-ROOT-CAUSE.md`.

**Base:** integration HEAD `494748b` (app `5f78af1`, src `b74e6b3`).
- Branch `pe/w3r2-sync-guard`, worktree `/home/user/wt/w8g`, dev **:5581**.
- **Controls:** integration :5560 / :5570; old base `4d36939` :5478 / :5488.

## What must become true
1. **One guard.** A tab whose timer state is older than what storage (or another tab) holds can **never overwrite a newer brew**. It must cover every path below and any future writer of the same shape, so a guard on the shared write or receive path is preferred over one patch per action:
   - **`rebase`** (`store.ts`: the leader's clock-jump correction);
   - **pause, resume, add 5 (`addTime`), end (`end` / `endActive`) and start (`startFocus` / `startBreak`)**, done in a lagging tab;
   - **a typed edit in a lagging tab**: `setIntention` with a real change, including the doubly stale case where that tab's own read of storage is also behind (F1FIX §4, "the maker's open item").
2. **A user action in a lagging tab applies to the current brew, or refreshes first.** It must **never silently discard the other tab's brew.**
   - For each action, state the exact outcome. Examples:
     - pause in the lagging tab pauses the brew that is current in storage, with its real remaining time;
     - start in a lagging tab, while another tab's brew is running, does not replace that brew. The lagging tab joins and shows it.
   - Where a stale read cannot be ruled out (the doubly stale case), the tab that owns the newer brew must restore it. This is LEAD-5's receiving-side re-assert: a running session replaced by an idle or older state with no `lastEnded` for it is put back. The outcome must hold whatever order the events land in.
3. **Storage format unchanged:** the same keys, shape and persist version, with no migration.
   - Prove it both ways: a profile saved by the base loads unchanged on the fix, and a profile saved by the fix loads on the base. Byte-identical where nothing changed, as in F1FIX §3.
   - If the guard needs a notion of "newer", derive it from existing fields (`sessionId`, `startedAt`, `endsAt`, `pausedAt`, `status`, `lastEnded`, the claims) rather than adding a stored field. If you believe a stored field is unavoidable, stop and ask through the packet before adding it.
4. **Unchanged:**
   - **the composer label behaviour.** Words typed in tab 2 can become the running brew's label in both tabs; do NOT change it, only log it in the packet;
   - exactly-once records and leaves (claims, `lastEnded`);
   - the completion path;
   - the F1 fix (`setIntention` writes only its fields; `syncIdleLength`'s following tab writes nothing).

## Proof (own runs, through the gate)
- **Deterministic race tests, one per trigger:** `rebase`, pause, resume, add 5, end, start, typed edit, the doubly stale typed edit, and any trigger you add.
  - Each must **FAIL on the current HEAD** (:5560 / the `494748b` code) **and PASS on the fix**; show both runs.
  - **Vitest** in a new `src/timer/staleTab.test.ts`, using the two-store harness from `intentionRace.test.ts`, with storage events held and released in a chosen order.
  - **Plus a browser case for at least pause, add 5 and end** in a new `tests/w3r2-stale-tab.spec.ts`. Hold the lagging tab's storage events, as `tests/w3-intention-race.spec.ts` does.
- **Existing race tests stay green:** `src/timer/intentionRace.test.ts`, `tests/w3-intention-race.spec.ts`, `multitab.test.ts`, `store.test.ts`, and full vitest. **Never weaken** an existing assertion.
  - If an existing test encodes behaviour that Vibei's rule overturns (for example, "starts replace by design, last writer wins"), do not edit it silently. Quote the assertion in the packet, propose the change, and LEAD rules.
- **`integrity:309` ×20 under load:** `--workers=2` plus 6 CPU burners, as in `contracts/W3R1/review/FINAL/scripts/LR-stress.sh`. **20/20.** Kill burners by explicit PID.
- **Also:**
  - `integrity.spec.ts` whole once;
  - `w2-home` once;
  - `timer.spec.ts` (`timer-app` + `timer-harness`) and `pwa` once;
  - tsc 0.
- **Not yours:** a Sonnet regression lane runs the notice suites and the 2-tab manual check with real clicks on your gated trial.

## Scope
- **May change:**
  - `src/timer/sync.ts` and `src/timer/store.ts`, plus another `src/timer/*` file only if the guard needs it; say why;
  - `src/timer/intentionRace.test.ts` and `tests/w3-intention-race.spec.ts`, to extend only;
  - new `src/timer/staleTab.test.ts` and `tests/w3r2-stale-tab.spec.ts`.
- **Must not touch:**
  - `src/ui/*` and `src/screens/*`, including `Composer.tsx`;
  - `tests/timer.spec.ts` and `tests/notice-strip.spec.ts` (maker TS works on these in parallel), and `src/ui/Toast.tsx` (maker TH);
  - `tests/integrity.spec.ts`;
  - `src/timer/multitab.test.ts`, except as ruled by LEAD.

## Packet and rules
- **Packet:** `/home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/SG/SG-READY.md`, in stages, with evidence beside it (logs as `.log.txt`, ≤ 20 MB each). Commit each stage with `/tmp/rv7-servers/commit-evidence.sh /home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/SG "<message>"`. Sections:
  - §1 design (why one guard covers every trigger, and how "newer" is decided);
  - §2 the outcome per trigger;
  - §3 tests fail/pass;
  - §4 compatibility;
  - §5 `integrity:309` under load;
  - §6 the rest;
  - §7 open items and the logged composer-label note.
- **Commits:** commit locally in stages on `pe/w3r2-sync-guard`; never push. End each message with:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01Wn1tcRYjBrm68QxmGYwD9K
  ```
  No model names anywhere. Never `pkill -f`.
- **Browsers:** every browser run goes through the slot gate:
  ```
  python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane SG --n 1|2 -- <cmd>
  ```
  Makers TH and TS share the machine.
- **Budget:** 3 h. Hard stop **19:15 UTC**. Hand back what you have at the stop, with an honest status.
