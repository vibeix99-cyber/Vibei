# Maker TH (Sonnet): the unconditional hook in `Toast.tsx` (W3R2 item 2)

**Binding:** `VB-DECISIONS-W3R2.md` §2.

**The finding (LEAD-5, `CHECKER-W3R1-F1FIX.md` §9):**
- `src/ui/Toast.tsx:482` reads `const leaving = useContext(Leaving) || !useIsPresent() || off;`.
- Because of the `||` short-circuit, `useIsPresent()` is skipped whenever `useContext(Leaving)` is true. The number of hooks therefore changes between renders, and React logs a hook-order error in dev and e2e runs. It is pre-existing; the same line is on base.

**Base:** integration HEAD `494748b` (src `b74e6b3`).
- Branch `pe/w3r2-toast-hook`, worktree `/home/user/wt/w8t`, dev **:5582**.
- **BEFORE / control:** integration :5560 (dev) / :5570 (preview).

## What must become true
1. **Every hook in `Toast.tsx` is called unconditionally, in the same order on every render.**
   - Fix line 482, for example by reading `useContext(Leaving)` and `useIsPresent()` into variables first, then combining them.
   - Audit the rest of the file for any other conditional or short-circuited hook call, early return before a hook, or hook in a loop. List each in the packet with file:line; fix only real violations, in this file.
2. **No visible or behavioural change.**
   - `leaving` must have the same value as before in every state.
   - `useIsPresent()` only reads presence, unlike `usePresence()`, so calling it always must not change exit timing. Confirm that from the `motion` source in `node_modules`, and cite it.

## Proof (own runs, through the gate)
1. **The error exists on base and is gone on the fix.**
   - Run the notice suite with a console listener (a small Playwright fixture or init script in a scratch spec outside `tests/`, or the `page.on('console')` / `pageerror` hooks) that records every `console.error` and warning matching React's hook-order messages:
     - "change in the order of Hooks";
     - "Rendered more hooks" / "Rendered fewer hooks";
     - "Rules of Hooks".
   - The notice suite is `notice-strip`, `w3-notices`, `w3-notices-idle`, `summary-notice` and `toast-room`.
   - Report counts per spec: **> 0 on :5560 (base), 0 on :5582 (fix).**
   - Also count all other `console.error` lines per spec on base vs fix; any new one is a finding.
2. **`notice-strip` 25/25 on the fix**, plus the rest of the notice suite in full (74 tests last time).
3. **Captures, REFERENCE → BEFORE → AFTER, at full size (DPR 1):**
   - **REFERENCE:** `contracts/W3R1/F/REFERENCE-K01-01-home.png` (K01).
   - **BEFORE** on :5560 and **AFTER** on :5582.
   - **Configurations:** {390×844, 375×667, 844×390, 1440×900} × {light, dark} × {100 %, 200 %}.
   - **States:** the notice states from W3R1 Maker F's set (`contracts/W3R1/F/shots/before/<cfg>/`):
     - Today newbie, blank, atRisk, missed-cozy and missed-nocozy;
     - the warm sheets;
     - session-running;
     - the End sheet;
     - Today after End;
     - at least one live notice strip ("Brew updated" on Stats) and one toast.
   - **Conditions:** the frozen date and seeds as in `contracts/W3R1/F-READY-FOR-REVIEW.md` ("Frozen date 2026-10-12T07:40Z …").
   - Write to `TH/shots/{before,after}/<w>x<h>-<theme>-t<pct>/<state>.png`.
   - **Pixel-diff each BEFORE/AFTER pair.** To set the noise floor, recapture BEFORE once and diff base against base. Report per pair: identical, within the noise floor, or a difference (with a crop).
4. **Also:** tsc 0 and full vitest.

## Scope
- **May change:** `src/ui/Toast.tsx` only.
- **Must not touch:** anything else. Scratch probes live outside `tests/`, in the worktree's git-ignored `kettle/.tmp/`, with copies in your packet folder.
- Makers SG (`src/timer/*`) and TS (`tests/timer.spec.ts`, `tests/notice-strip.spec.ts`) work in parallel.

## Packet and rules
- **Packet:** `/home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/TH/TH-READY.md`, in stages:
  - §1 change and audit;
  - §2 hook-order counts, base vs fix;
  - §3 suites;
  - §4 captures;
  - §5 open items.

  Evidence goes beside it; logs as `.log.txt`, ≤ 20 MB each. Commit each stage with `/tmp/rv7-servers/commit-evidence.sh /home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/TH "<message>"`.
- **Commits:** commit locally in stages on `pe/w3r2-toast-hook`; never push. End each message with:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01Wn1tcRYjBrm68QxmGYwD9K
  ```
  No model names anywhere. Never `pkill -f`.
- **Browsers:** every browser run goes through the slot gate:
  ```
  python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane TH --n 1|2 -- <cmd>
  ```
- **Budget:** 2 h. Hard stop **18:15 UTC**. Hand back what you have at the stop, with an honest status.
