# Fix maker N2 (Sonnet): the History focus scroll (N-2)

**Binding:** `VB-DECISIONS-POSTFOLLOWUP.md` §3. This is a separate phase after item 1 (the F1 fix) merged. LEAD-5 gates and reviews it separately.

**The finding (N-2):**
- **Origin:** `CHECKER-W2R3-T2.md` (N-2 row) and `CHECKER-W3R1-F.md` §4 / Run B.
- **What happens:** when a History row is tapped to open "Edit brew", the page scrolls by about 110 px. LEAD-5's `historytrace`, W2R3 round 3, shows scrollY 2500 → 2610 at 1440 × 900 @200 % reduced. The row the person tapped moves under their finger.
- **Today:** `tests/notice-strip.spec.ts` (F's file) waits for this scroll to settle before reading "where the person saw the row" (X-11). That keeps the test stable; the product movement remains.

**Base:** integration HEAD after the F1 fix merge, **`__BASE__`** (src `__SRC__`).
- Branch `pe/w3r1-n2-history`, worktree `/home/user/wt/w7n`, dev **:5565**.
- Controls: the integration on **:5560 / :5570** (rebuilt on `__BASE__`) and old base `4d36939` on :5478 / :5488.

## Scope (only these)

- **Product:** `src/screens/stats/History.tsx` only (S's file).
- **Proof:** one new test file, `tests/w3-history-focus-scroll.spec.ts`. A Vitest file next to `History.tsx` is optional.
- **Nothing else.** No change to:
  - `src/ui/Sheet.tsx` or any other shared UI;
  - `src/ui/moment.ts`;
  - `tests/notice-strip.spec.ts` or any existing spec;
  - CSS outside `History.tsx`'s own module.

  If the root cause is outside `History.tsx`, stop. Do not work around it in another file. Write up the cause with evidence in the packet and hand back; LEAD-5 rules on it.

## Requirements

1. **Root cause first, with a trace.** Find what scrolls the page when a row is tapped. Candidates:
   - focus on the row button;
   - the Sheet's opening, scroll lock or focus return;
   - `keepStill` / `holdTop`;
   - a layout change above the row;
   - `scroll-padding` or `scroll-margin`.

   Show `scrollY` and the row's `top` frame by frame from pointerdown through sheet open and sheet close, with the call that moves it (for example a `scroll` listener stack, or a `scrollTo` / `scrollIntoView` / `focus` wrap). Record it in the packet.
2. **The fix (`History.tsx` only):** opening a row's Edit sheet by pointer or touch **does not move the page**. The row stays where the person saw it, |Δtop| ≤ 2 px:
   - when the sheet is open and settled;
   - after the sheet closes by Cancel / close / Escape;
   - after "Save".

   Check all three at:
   - **1440 × 900 @200 % with reduced motion** (light), where X-11 was found;
   - 1440 × 900 @100 %;
   - **390 × 844** phone (touch).
3. **Preserve list** (show each one still holds):
   - **Keyboard:** a row reached by Tab that is off screen is still brought into view (the browser default for keyboard focus). Enter / Space opens the sheet. When the sheet closes, focus returns to the row.
   - **Delete:** the row turns into its inline Undo in the row's exact place (`keepStill`, ≤ 2 px). From the keyboard, focus lands on the Undo (`:focus-visible` path, `History.tsx:180`). Undo restores the row.
   - **Unchanged:** the row's look, its aria-label, the order and grouping of days, "Show more" paging, and the Edit sheet's contents and behaviour.
   - **Themes:** no change in either light or dark.
4. **A deterministic test** in `tests/w3-history-focus-scroll.spec.ts`:
   - seed a History long enough to scroll (`?debug&seed=…`);
   - scroll so the target row is mid-viewport;
   - read the row's `top`, tap it, and wait for the Edit sheet plus five still frames;
   - assert |Δtop| ≤ 2 px and `scrollY` unchanged, then the same after close.

   It must **FAIL on the base** (:5560) **and PASS on the fix**, 3/3 each, at the configurations in requirement 2 where the base moves. Show which configurations move on the base.
5. **No regressions:**
   - `notice-strip.spec.ts` 25/25 (unchanged), including `:292` at 1440 light @200 reduced **6/6 under load** (`--workers=2` plus CPU burners, as in `review/FINAL/scripts/LR-stress.sh`);
   - every spec touching Stats / History (`grep -l "History\|#/stats" tests/*.spec.ts`), once each;
   - `w3-notices.spec.ts`;
   - tsc and the full Vitest suite.
6. **Captures:** BEFORE (:5560) and AFTER (:5565) of the Stats screen with History scrolled, at 390 light, 390 dark and 1440 light. Use the frozen date, full size, under `N2/captures/{BEFORE,AFTER}/`. They should be pixel-equal except where the fix changes something, and nothing visual should change.

## Rules

- **Commits:** commit locally in stages on `pe/w3r1-n2-history`; never push. Never `pkill -f`; kill by PID. Use the usual trailers. No model names anywhere.
- **Browsers:** every browser run goes through the slot gate:
  ```
  python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane N2 --n 1|2 -- <cmd>
  ```
- **Packet:** the worktree has no contracts folder. Write `/home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/N2/N2-READY.md` in stages, with evidence beside it (logs as `.log.txt`, each ≤ 20 MB). Commit each stage with:
  ```
  /tmp/rv7-servers/commit-evidence.sh /home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/N2 "<message>"
  ```
- **Budget:** 2 h. Hard stop **__STOP__ UTC**. Hand back what you have at the stop, with an honest status.
