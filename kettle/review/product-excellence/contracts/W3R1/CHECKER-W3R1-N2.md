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
