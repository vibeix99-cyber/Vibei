# Maker TS (Sonnet): test-only stability (W3R2 item 3)

**Binding:** `VB-DECISIONS-W3R2.md` §3.

**The findings** (LEAD-5, `contracts/W3R1/CHECKER-W3R1-F1FIX.md` §9). LEAD-5's evidence is in `contracts/W3R1/review/LEAD/F1FIX/postmerge/`; Lane R's is in `contracts/W3R1/review/POSTMERGE-F1/`.
- **`tests/timer.spec.ts:156`**, "background: the worker completes on time even with main-thread timers frozen".
  - Under load, the test's `subscribe` for `__doneAt` was set up after the brew had already ended. The 10 s poll then saw `null` although the done screen showed.
  - Fix: set up the observer **before** the brew starts.
- **`tests/timer.spec.ts:183`**, "hidden page: completion shows a warm notification; coming back restores the title".
  - Under load, the page was hidden **after** the brew ended. That gave 0 notifications, which is what the app correctly does for a brew ending in a visible page.
  - Fix: hide the page **before** the brew can end.
- **`tests/notice-strip.spec.ts`, the `press()` tap helper.**
  - At 844×390 dark 200 %, `:338` failed at `press` (`:300`): "… still on top as the tap is aimed". The field was briefly covered at the moment of the re-check.
  - Fix: when the re-check finds the target covered, **aim again** (bounded) instead of failing at once.

LEAD-5 reproduced the timer pair deterministically with one test-side delay: it failed 2/2 on :5560 and on :5478, and the observer-first version passed 2/2 on both.

**Base:** integration HEAD `494748b`.
- Branch `pe/w3r2-test-stability`, worktree `/home/user/wt/w8q`, dev **:5583**, which serves the same app code as :5560.
- Run your specs against :5560 or :5583. The app code is identical, so say which you used.

## What must become true
1. **No assertion is weakened.** Same checks, same thresholds, same time budgets for the product behaviour. LEAD confirms this line by line.
   - **timer:156:** still asserts the worker completes on time (`doneAt − endsAt` within `lateBudget`), exactly one record, and the title.
   - **timer:183:** still asserts exactly one warm notification while hidden, and the title restored on return.
   - **`press()`:** still asserts the target is on top **at the moment of the tap**. The re-aim is bounded (a small number of attempts within a short window, which you state). A target that stays covered must still fail, with the same message.
2. **Each fix is shown to remove its race.**
   - Inject the race deterministically: a test-side delay for the timer pair, as LEAD-5 did; a transient cover over the field for `press()`, for example a positioned element for ~300 ms at the re-check.
   - Show the **old** test failing and the **new** test passing under the same injection.
   - For `press()`, also show that a **permanent** cover still fails the new helper.
   - Injection code lives in a scratch copy outside the committed spec. Keep copies in your packet.
3. **Each test passes 10/10 under load** (`--workers=2` plus CPU burners, as in `contracts/W3R1/review/FINAL/scripts/LR-stress.sh`; kill burners by explicit PID):
   - `timer.spec.ts:156` ×10 and `:183` ×10;
   - `notice-strip.spec.ts:338` at 844×390 dark 200 % ×10;
   - then the whole `notice-strip.spec.ts` once (25/25) and the whole `timer.spec.ts` (`timer-app` + `timer-harness`) once.
   - Record the load average at the start and end of each run.

## Scope
- **May change:** `tests/timer.spec.ts` and `tests/notice-strip.spec.ts` only, test code only.
- **Must not touch:** any `src/` file, or any other spec.
- Makers SG (`src/timer/*` and new specs) and TH (`src/ui/Toast.tsx`) work in parallel.

## Packet and rules
- **Packet:** `/home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/TS/TS-READY.md`, in stages:
  - §1 each change, with a before/after excerpt and why no assertion is weaker;
  - §2 the injected-race proof;
  - §3 under-load 10/10 runs;
  - §4 the whole files;
  - §5 open items.

  Evidence goes beside it; logs as `.log.txt`, ≤ 20 MB each. Commit each stage with `/tmp/rv7-servers/commit-evidence.sh /home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/TS "<message>"`.
- **Commits:** commit locally in stages on `pe/w3r2-test-stability`; never push. End each message with:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01Wn1tcRYjBrm68QxmGYwD9K
  ```
  No model names anywhere. Never `pkill -f`.
- **Browsers:** every browser run goes through the slot gate:
  ```
  python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane TS --n 1|2 -- <cmd>
  ```
- **Budget:** 2 h. Hard stop **18:15 UTC**. Hand back what you have at the stop, with an honest status.
