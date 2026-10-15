# CHECKER W3R1 · N-2: the History focus scroll (Vibei post-follow-up item 3)

*Written in stages; the verdict is at the end.*

| | |
|---|---|
| Lead checker | LEAD-5. I implemented none of this work. The finding under review comes from **my own** W2R3 probe, so I judge that probe here on its own data and on a rerun with an event log (§2) |
| Under review | `pe/w3r1-n2-history@2280e7d`: one commit on base `5f78af1`; worktree `/home/user/wt/w7n`; dev :5565 |
| Scope (checked) | `git diff --stat 5f78af1 2280e7d` = `kettle/tests/w3-history-focus-scroll.spec.ts` only (+352). `git rev-parse 2280e7d:kettle/src` = `5f78af1:kettle/src` = `b74e6b33…`, so **no product change**, and no trial is needed. The spec in the worktree is byte-equal to `2280e7d` |
| Controls | :5560 (integration `f817931`, src `b74e6b3`, the same src as the branch); :5478 (old base `4d36939`) |
| Brief / decision | `BRIEF-N2.md`; `VB-DECISIONS-POSTFOLLOWUP.md` §3 |
| Packet | `contracts/W3R1/N2/N2-READY.md`, evidence in `N2/{logs,evidence,captures}`; gate record `review/GATE.md` "N-2 … GATE PASSED (scope)" |
| My evidence | `contracts/W3R1/review/LEAD/N2/`: `historytrace-ev.mjs` (my W2R3 probe plus an event log and a positive-control switch); my mutant of the guard spec; logs as `.txt` |

## 1. The finding, and where it came from
- **N-2 as recorded:** "Tapping a History row to open Edit brew scrolls the page by about 110 px." The source is my W2R3 `historytrace` (`CHECKER-W2R3-T2.md`, N-2 row: scrollY 2500 → 2610 at 390×844).
- **F's Run B** (`CHECKER-W3R1-F.md` §4) attributed its 111 px ("the Undo … where the person saw the row", 1440 @200 reduced) to N-2.
- **The maker's claim:**
  - The tap does not scroll the page on any build: 18 scenarios on :5560 and 9 + 9 on :5570 and :5478, all 0 px, with no scroll call and no scroll event.
  - Every `focus()` the app makes passes `preventScroll`.
  - The 110 px is my probe's own wheel: `press()` wheels 110 px because the row lay under the tab bar.
  - Run B is the old spec's read timing against `press()`'s wheel race.

## 2. My own W2R3 probe, re-read on its own data
From `contracts/W2R3/review/LEAD/T2/runs/historytrace-390x844-light-100.json` and `t2-lead.mjs` (flow `historytrace`, `press()`):

- **The 2500 is a loop count.** `scrollY 2500` is 25 × 100: the flow wheels ±100 at most 25 times to bring row 4 into 30–60 % of the screen. The loop ended on its count with the row still at 754 (0.89 of 844).
- **"before tap" is taken before `press(row)`.** `press()` taps only when the row is on top at 9 of 9 points. Row 754–822 lies under the 68 px tab bar (top 776), so `press()` first wheels `110 × pos`, with `pos = +1`.
- **The tap itself proves it.** The recorded tap is `at [195, 677] size [318, 68]`: the row's top at the moment of the tap was 677 − 34 = **643**. That is 754 − 110 + rounding. So the row had already moved 110 px before the finger landed.
- **"edit open" changes nothing further.** It reads row 644, scrollY 2610, the same place as at the tap. The tap and the opening moved nothing; only my `press()` wheel did.

**I misread my own trace in W2R3.** The 2500 → 2610 is my probe's wheel, not a focus scroll. The maker's reading of it (packet §1 C) is correct, and my N-2 row in `CHECKER-W2R3-T2.md` and the "focus scroll" wording I carried into `CHECKER-W3R1-F.md` §4 were wrong about the cause.

## 3. My `historytrace` rerun with an event log (my runs, :5560, through the gate)
**What I ran:**
- **The probe:** `historytrace-ev.mjs` is `t2-lead.mjs` unchanged except for two additions:
  - an event log of every `wheel`, `scroll`, `pointerdown`, `touchstart`, `click` and `focusin`, each with `performance.now`, `scrollY` and the History row it hit;
  - a `--mutant N` switch: a click on a History row scrolls the page by N px in the next task, which is what a product focus scroll would look like.
- **The summary:** `ht_ev.py.txt` produces `historytrace-ev-summary.txt`. The raw JSON is beside it.

| Run | before tap (scrollY, row) | the tap lands at (row top) | edit open | scroll events before the tap | scroll events after the row tap, through Edit, Delete this brew, confirm, Delete |
|---|---|---|---|---|---|
| 390×844 light 100 (touch), my W2R3 config | 2500, 945 | 615 (tap y 649, h 68) | 2830, 615 | 28, each ≤ 1 ms after a probe wheel (25 loop wheels + 3 `press()` wheels of 110) | **0** |
| 1440×900 light @200 reduced (mouse), the X-11 config | 2500, 1037 | 707 (tap y 763, h 111) | 2830, 707 | 28, each ≤ 1 ms after a probe wheel (25 + 3 × 110) | **0** |
| **Positive control:** 390 light 100, `--mutant 110` | 2500, 945 | 615 | **2940, 505** | 28, all after wheels | **1, 9 ms after the tap, with no wheel: scrollY 2830 → 2940** |

**What this shows:**
- This seed needs three `press()` wheels (2500 → 2830), where the W2R3 seed needed one (→ 2610). The pattern is the same, and it matches the maker's replay (packet §1 C).
- In both configurations, every scroll comes from a probe wheel. From the row's pointerdown onwards, there is no scroll event at all.
- The positive control shows the log would have caught a product scroll after the tap: one scroll event, 110 px, with no wheel behind it.

**So N-2 does not reproduce as a product scroll in my own probe either.** The maker's probe matrix (18 + 9 + 9 scenarios, rAF `scrollY` and row top, wrapped scroll APIs; `N2/evidence/scripts/probe.mjs`, read) agrees.

## 4. The guard spec `tests/w3-history-focus-scroll.spec.ts` (read in full; my runs through the gate)
**What it asserts:**
- **Pointer and touch (8 tests):** 1440 @200 reduced light, 1440 @100 light, 390 touch light and 390 touch dark. The row is put mid-screen by an instant script scroll, and the spec checks that it is really hit at the tap point, then taps it with real input. It reads every animation frame from the tap until the sheet has been open and still for five frames. Then:
  - `scrollY` must not move at all, and the row must stay within 2 px;
  - the same through Close (×) and through Escape, with focus back on the row;
  - after Save, the row must stay within 2 px.
- **Why Save does not assert `scrollY`:** Save raises "Brew updated" above the list, and `keepStill` scrolls the page by the strip's height, so `scrollY` changes by 68–73 px while the row stays put (the maker's `save-*.json`). The I10 rule allows this, and the spec records it as an annotation.
- **The preserve list (6 tests at 1440 @200 reduced and 390 touch):**
  - Tab brings an off-screen row into view; Enter and Space open the sheet; focus returns to the row.
  - Delete from the keyboard: the Undo is in the row's place (≤ 2 px), focus lands on the Undo, and Undo restores the row and its label.
  - Delete by pointer or touch: the Undo is in place, and Undo restores the row.

| Run | Result | Log |
|---|---|---|
| Guard on :5560 (my run, 1 worker) | **14/14**, 1.6 min | `LEAD/N2/guard-5560.log.txt` |
| Guard, the maker's runs | 42/42 on :5560, 42/42 on :5565 | `N2/logs/spec-*-x3.log.txt` |
| Maker's mutant: `scrollBy(110)` after a row click | **8/8 fail**, "Received: 110" | `N2/logs/spec-MUTANT-…log.txt` |
| **My own mutant** (different mechanism): a row click calls `scrollIntoView({block:'start'})` in the next task, like a focus scroll without `preventScroll` | **8/8 fail**: `scrollY` moved 394 / 417 / 328 / 328 px; the row through Save moved the same | `LEAD/N2/mutant-scrollIntoView-start-5560.log.txt`, `mutant-siv.spec.ts.txt` (the spec plus one marked init script) |

**It cannot fail first, because there is nothing on the base to fail on (§2, §3).** The two mutants stand in for the fail-first: the spec catches a move after the tap, whether it comes from a fixed-size scroll or a focus-style scroll.

## 5. Rulings
**1 · N-2: CLOSED as a probe artifact. No product change, so there is no fix round.**
- The "110 px focus scroll" was my W2R3 probe's own `press()` wheel. Its own recorded tap point shows this (§2), and my rerun with an event log shows 0 scroll events from the tap on, with a positive control that does see 110 (§3).
- The maker's 18 + 9 + 9 probe matrix agrees: 0 px, no scroll call, and both of the app's `focus()` calls pass `preventScroll`.
- **There is nothing in `History.tsx` to fix.** Any edit there would be untestable against the base, and I agree with the maker not to make a defensive one.
- **F's Run B (111 px, the old spec, 1440 @200 reduced) is not reproduced.** It is closed with N-2, because the product has no scroll source on the tap → Edit → Delete path at that configuration (§3, second row). The fitting mechanism is the old spec's read timing against `press()`'s wheel race, which X-11's test-only change already addressed. Since then, `notice-strip` has passed 25/25 and `:338` 6/6 under load (maker), and the post-merge notice suite was 73/74 with an unrelated Today failure.
- If a 1440 @200 History Undo mismatch ever recurs, treat it first as a test-timing issue.

**2 · The guard spec: MERGE as it is**, as a guard and not as a fix. Say so in the merge message: "guard; no fail-first: N-2 was a probe artifact; mutation-checked".
- **Why:**
  - It holds a person-visible invariant (tapping a row does not move the page) that has now produced two false alarms.
  - It would catch the realistic regression: a `focus()` losing `preventScroll`, or a `scrollIntoView` on open. My mutant fails 8/8.
  - It covers the keyboard and Delete preserve list.
  - It is deterministic: 14/14 + 42/42 + 42/42.
  - It costs about 1.6 min on one worker, and it is a single new test file within the brief's scope.
- **No conditions.**
- **Non-blocking notes:**
  - The Save test starts recording at Save, not at the tap; the opening is covered by the other test.
  - Its `scrollY` exception for Save follows the I10 `keepStill` rule.

**3 · The stale comment in `tests/notice-strip.spec.ts` (History step, lines 462–464): FIX the wording now, as a test-comment-only change by the orchestrator.** Do not leave it as a FOLLOW-UP: it names a product cause that does not exist and points the next reader at `History.tsx`.
- **Keep the wait itself.** It is harmless and still guards the X-11 wheel race.
- **Suggested wording:**
  > read once the Edit sheet is open and the row has been still for five frames (up to 3 s), so a late `press()` wheel cannot land between this read and the Undo read (W3R1 X-11). Opening the sheet does not scroll the page (W3R1 N-2, closed as a probe artifact; guarded by `tests/w3-history-focus-scroll.spec.ts`).
- **No rerun is needed** beyond `npx playwright test tests/notice-strip.spec.ts --list` (it must still parse).

**Errata (mine):**
- The N-2 row in `CHECKER-W2R3-T2.md` and the "This is N-2: … focus scroll" line in `CHECKER-W3R1-F.md` §4 (Run B) are superseded by this file. I add a pointer line to `CHECKER-W3R1-F.md`.
- I leave the W2R3 file as it was, with this file as the correction of record.

## Verdict: **APPROVE** `pe/w3r1-n2-history@2280e7d` (one new test file; src `b74e6b3` = base)
**What the approval covers:**
- **N-2 is closed with no product change.** It was a probe artifact: my own W2R3 wheel.
- **The guard spec merges.** It is mutation-checked (110 px: 8/8; `scrollIntoView` start: 8/8) and passes on :5560 and :5565.
- **The comment fix** in `notice-strip.spec.ts` is for the orchestrator, comment only.
- **Nothing is introduced or worsened** by this change; there is no product diff.
- **Captures:** 1440 is byte-identical. At 390, the differences are base-level noise, the same 8 px when the base is re-captured (maker §6, read).
- **Regressions:** none possible from a test-only change. The maker's runs are all green (§5 of the packet, read).

Any change to the branch after this invalidates it.

*Run logs:* `.log` files are git-ignored, so mine are committed as `.log.txt` in `review/LEAD/N2/`. My mutant and its config live in the git-ignored `/home/user/wt/w7n/kettle/.tmp/lead5-n2/`; copies are in the folder.
