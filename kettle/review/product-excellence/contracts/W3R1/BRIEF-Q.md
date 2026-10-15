# Maker Q: Vibei's follow-ups before the Final Product Boss (items 2 and 3, plus F1)

**Base:** the integration branch with all four makers merged (app code `2be3de1`).
- Branch `pe/w3r1-stability`, worktree `/home/user/wt/w5q`, dev **:5545**.
- Base for controls: `4d36939` on :5478 / :5488. The current final tree `2be3de1` (worktree `w5-final`) is on :5540 / :5550.

**Read:**
- `VB-DECISIONS-FINAL.md` (binding);
- `CHECKER-W3R1-F.md` §8 and `CHECKER-W3R1-CROSS.md` §7 (X-11, its three signatures, the 4-minute timeouts);
- `review/FINAL/RECEIPT-FINAL.md` §3–§7 (F1, F2/X-1, F3, the `w3-notices-load` base failure);
- Maker F's X-11 note `/home/user/wt/w5f-x11/kettle/review/product-excellence/contracts/W3R1/F-X11-READY.md`; its attempts are in branch `pe/w3r1-x11-strip-test` (`a4be67b`, `99f3741`, `dd519c5`).

**Ownership for this task.** Nobody else is working now. Combined under one maker:
- `src/ui/moment.ts` and `src/ui/Toast.tsx`, **for the band's idle constant only**;
- tests: `w3-notices.spec.ts`, `w3-notices-idle.spec.ts`, `notice-strip.spec.ts`, `integrity.spec.ts`, and optionally `w3-notices-load.spec.ts` and `w2-room.spec.ts`.

No other source change. **No product change in `src/timer/**` or `src/app/saveWarning.ts`:** a product cause there gets a root-cause note and stops for Vibei.

## Phase A: item 2, the band's idle wait from 1.2 s to 4 s (45 min; commit when done)

- Only the wait before a kept band is given back on the same screen goes from 1.2 s to **4 s**.
- `QUIET_MS` (1200, `moment.ts`) is shared by other rest rules. If changing it would change anything else, add a dedicated constant for the band (4000) and leave `QUIET_MS` and every other rule as they are. State which you did and why.
- **Do not** give the room back "in answer to the next tap" (Vibei).
- Update the test expectations in `w3-notices.spec.ts` and `w3-notices-idle.spec.ts`: ≥ 4 s after the last input and after the leave, and an upper bound you justify (e.g. ≤ 6.5 s). Loosen nothing else.
- **Proof:**
  - `w3-notices` + `w3-notices-idle` ×2;
  - `notice-strip.spec.ts` 25/25;
  - `toast-room`, `summary-notice` and `w2-home` once;
  - tsc, vitest.
- LEAD-5 then reruns the 64-tap aimed-tap check and the notice suite.

## Phase B: item 3, test stability, plus F1 (2 h)

Test-only changes, nothing loosened, with root-cause notes for anything that turns out to be a product bug.

1. **`notice-strip.spec.ts:292`** at 1440 light 200 % reduced (X-11):
   - `press()` must check "on top" and tap **within one input window**, with no idle gap; Phase A's 4 s makes the gap less likely, but don't rely on it;
   - wait for the wheel's scroll to land, bounded;
   - read the History row after its focus scroll settles (N-2).
   - **Find the cause of the 4-minute timeouts** seen in X-11 attempts 2–3: reproduce them on a scratch branch and explain them.
   - **Done when:** `:292` ×6 is 6/6 under load, and the file is 25/25.
2. **`integrity:1017`** (I03, the storage-full banner test, X-1). Its fixed 6 s wait for the banner to go should wait on real state: the save-warning removes the banner on a 2 s recovery tick (`saveWarning.ts`). Prove it ×10 under load (`--workers=2`).
3. **F1, `integrity:309`** (I01, two tabs, the leading one frozen across the end): a **real finding** (Vibei §0) until shown otherwise.
   - Reproduce it under load (`--workers=2` plus CPU burners, as in `review/FINAL/scripts/LR-stress.sh`).
   - Determine whether the cause is the test (it fixes an 800 ms wait for the leader election between two freshly opened tabs, then starts a brew in the tab it believes is the follower) or the product's cross-tab hand-off.
   - **If the test:** fix it on real state and prove it ×10 under load.
   - **If the product:** write the root-cause note (file, line, mechanism, a minimal repro) and stop. No timer change.
4. **Optional, if time remains, test-only:**
   - `w3-notices-load.spec.ts`'s 2 failures at 390×844 / 375×667 light 200 % reduced fail identically on base: a stale control copy, so update it to match `notice-strip`'s `press()`;
   - `w2-room:167`: the load-timeout margin (30.4 s to scene-ready out of 60 s); wait on real state.

## Rules

- Commit locally in stages and never push. Trailers as usual.
- **Slot gate** `--lane Q` (at most `--n 2`); LEAD-5 may also use slots. Never `pkill -f`.
- Logs as `.log.txt`, because `*.log` is git-ignored.
- **Packet:** `contracts/W3R1/Q-READY.md` in your worktree, written in stages with phases A and B, each with hashes, diffs, results and log paths. Evidence in `contracts/W3R1/Q/`, ≤ 40 MB.
- **Hard stops:** Phase A by **00:55 UTC**, Phase B by **02:55 UTC**. On a usage limit or the stop, commit WIP and say what is unproven.
