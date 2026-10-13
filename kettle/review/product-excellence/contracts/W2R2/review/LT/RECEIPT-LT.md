# RECEIPT · Lane T · W2R2 targeted re-review of Maker T's fix round (I10)

Lane T records results with raw evidence and issues **no verdict**. The tables below come from the run JSON; nothing in them is edited by hand.

| | |
|---|---|
| Under review | `pe/w2r2-toast@6f9756c` (code `887696e`) |
| Fix trial | `a8fb34a` = integration `2f67fc1` (with P) + `6f9756c`. Worktree `/home/user/wt/w3tr-t2`, `git rev-parse HEAD:kettle/src` = `958ce86d001068b2b3840ff2dab3589adf82b797`. `git diff --stat 4620796 6f9756c -- kettle/src` touches only `src/ui/Toast.tsx` (79 lines), `src/screens/home/Composer.tsx` (37) and `src/screens/home/Home.module.css` (6): 3 files, +110/−12 |
| Servers | Fix: dev :5446. Control `b377c62`: dev :5410 (worktree `/home/user/wt/w3-base`). Neither was started or stopped by this lane. They were restarted by the coordinator around 14:57 UTC, after a container restart |
| Browser gate | Every browser job went through `slots.py run --lane LT --n 1`. At most 2 LT jobs ran at once, and only while no other lane was waiting |
| Timeline (UTC) | 13:32–13:41 notice-zone ×3. **About 13:45–14:57: lane stopped by a usage limit, then the container restarted.** 15:03–15:38 probes. 15:11–15:29 specs. Every run time is in `runs/*.jsonl.log` and `logs/specs-index.log` |
| Evidence | `contracts/W2R2/review/LT/`: `raw/*.json` (one per probe run: every ~100 ms sample, steps), `runs/*.jsonl` (one summary line per run) with `*.jsonl.log` (start/end times), `logs/` (spec logs, `notice-zone-x3.log`, failure context `logs/nz-fail/`), `raw/summary-*/arrival-*.png` (frames), `tools/` (probe copy) |

## Probe and changes (`/home/user/wt/w3tr-t2/kettle/.tmp/LT/lt.mjs`, copied to `review/LT/tools/`)

This is a copy of LEAD-2's `t-lead.mjs` (sha256 `99f2991e…`). The following are the lead's and are **unchanged**:
- the sampler, every ~100 ms in an animation frame;
- the protected set and the clipping of each protected box to its scrolling ancestors;
- the 9-point hit test;
- `wheelInto`;
- the End-session setup;
- the `end-scrolled` steps up to and including the Mark done tap.

My changes:
1. **`end-scrolled`:**
   - After Mark done, the Undo is polled for up to 4 s and tapped about 0.4 s after it is found. The lead's version tapped at 8 s, after the notice's 5 s Undo had run out.
   - Sampling then continues for 6 s.
2. **New flow `today --pos 0|end --when up|gone`:**
   - Mark done is tapped at scroll 0, or after a real wheel to the page end. If Mark done is not on top there, one real wheel back puts its top at about 70 px.
   - `up`: tapped 0.6 s after Today arrives, or as soon as positioned if that takes longer. The table states the End notices drawn and waiting at the tap.
   - `gone`: End's notices are first drawn (at scroll 0) and run out, then the page is scrolled to the position.
   - A row is **not tapped** (N/A) when Mark done's centre and its ±30 % points are not on top. The covering element is recorded.
   - Fixes made during the session:
     - (a) The wheel now waits for the scroll to settle. A wheel sent during Today's entry landed late, under the tap (one invalid row, rerun).
     - (b) `gone` originally waited after scrolling, so End's notices could never expire (one row, rerun).
     - (c) If the setup click on the task field cannot land in 5 s, the field is focused and the task typed. 667×375 @200: the real click timed out.
3. **`history --pos last|mid`:**
   - The Undo is polled and tapped promptly.
   - The Edit row is re-tapped up to 3 times if the sheet does not open.
4. **New flow `import`:**
   - Setup through the debug API: an exported backup of the veteran profile, with 3 brews given new ids.
   - Real tap on Settings › Import a backup, then the file chooser.
   - A real tap on "Add", then a real tap on Undo. State is checked through the brew count.
5. **`summary`:**
   - Two notices are raised right after `finish()`.
   - Frames at 300/800/1500/2500/4000 ms.
   - The art boxes are read by class (`_chai_*`).
6. **`--inset t,r,b,l`:**
   - Applies CDP `Emulation.setSafeAreaInsetsOverride`.
   - Every run reads the inset back from a probe element (`safeProbe`).

"Hit samples" means samples in which a drawn notice intersects the protected set (the lead's definition), counted over all phases of the run. "First sample" is the first ~100 ms sample after the tap in which the notice is drawn with its Undo. "poll" is the probe's own 40 ms poll of the same condition.

## §6.4 / T-D3 · invariant 1

### (a) `notice-zone.spec.ts` ×3 on the fix
- **Command**, from `/home/user/wt/w3tr-t2/kettle`, through the gate: `KETTLE_PORT=5446 npx playwright test tests/notice-zone.spec.ts --project=chromium --workers=1 --repeat-each=3 --reporter=list --trace=off`
- **When:** 13:32:25–13:41:40 UTC.
- **Log:** `logs/notice-zone-x3.log`. The failure's page snapshot is in `logs/nz-fail/error-context.md`.
- **Result: 56 passed, 1 failed (exit 1).**

| Test (spec line) | Configuration | Pass / runs |
|---|---|---|
| End → Today (:150) | 390×844 100 % | 3/3 |
| End → Today (:150) | **390×844 200 %** | **2/3** (repeat 2 failed) |
| End → Today (:150) | 375×667 100 % | 3/3 |
| End → Today (:150) | 375×667 200 % | 3/3 |
| End → Today (:150) | 844×390 100 % / 200 % | 3/3 / 3/3 |
| End → Today (:150) | 667×375 100 % / 200 % | 3/3 / 3/3 |
| End → Today (:150) | 1440×900 100 % / 200 % | 3/3 / 3/3 |
| Session stage holds the notices (:226) | 375×667 200 %; 390×844 100 % reduced motion; 667×375 200 %; 844×390 200 % reduced motion | 12/12 |
| Nothing drawn while the Ambience sheet is open (:286) | 844×390, 667×375, both at 200 % | 6/6 |
| Settings › Next brew (:325) | 390×844 100 %, 375×667 200 % | 6/6 |
| A notice that waits keeps its time (:357) | — | 3/3 |

The failure message is verbatim. The spec prints `withNotice of samples`, and does not print the number of hit samples.
```
✘ 40 notice-zone.spec.ts:150:5 › End → Today: … (390×844, 200 %) (8.3s)
Error: notice ∩ protected (15 of 20 samples with a notice)
  + "Saved 3 minutes of focus ∩ Read",
  + "Saved 3 minutes of focus ∩ Create",
  + "Saved 3 minutes of focus ∩ Life",
  + "Saved 3 minutes of focus ∩ 15 min25 min50 minCustom",
  at tests/notice-zone.spec.ts:206:100
```
The controls hit are three tag chips (Read, Create, Life) and the Brew length group.

### (b) Lead probe `end-scrolled` (with change 1)
- Configurations: 375×667 and 390×844 at 100/200 %, light, dpr 2.
- Fix :5446 against control :5410. The hold before the Mark done tap is 6 s, as the lead's default.
- Raw: `raw/end-scrolled-*.json`. Summary lines: `runs/ABC.jsonl`, rows 1–8, run 15:06–15:10.

| Side | Config | Samples hit / total (phases with hits; controls hit) | Mark done box at tap / scroll | Crossed off first sample after tap | Undo box, 9-pt | Real Undo → field | Min notice top | Not-whole samples |
|---|---|---|---|---|---|---|---|---|
| fix | 375x667@2:light:100 | 0/132 | [243, 408, 79, 44] / 80 | 174 ms (poll 120 ms) | 57×35, 9/9 | Chapter 3 notes | 17 | 0 |
| control | 375x667@2:light:100 | 32/150 {'after-End': 1, 'scrolling': 17, 'scrolled': 10, 'after-MarkDone': 3, 'after-Undo': 1} ['Clear what are you brewing? (optional)', 'Create', 'INPUT', 'Life', 'Mark “Chapter 3 notes” done', 'Put the kettle on · 25 min', 'Read', 'Spanish practice', 'Study', 'Work'] | [243, 328, 79, 44] / 160 | 130 ms (poll 138 ms) | 55×34, 9/9 | Chapter 3 notes | 364 | 0 |
| fix | 375x667@2:light:200 | 0/125 | [36, 202, 151, 44] / 1120 | 159 ms (poll 115 ms) | 94×40, 9/9 | Chapter 3 notes | 8 | 5 |
| control | 375x667@2:light:200 | 19/160 {'scrolling': 15, 'after-MarkDone': 4} ['171leavesShow details', '3days warmstreak. Show details', '4Level 4Cozy level 4, 34 leaves to the n', 'Chapter 3 notes', 'Put the kettle on · 25 min', 'Read: The Hobbit', 'Spanish practice'] | [36, 282, 151, 44] / 1040 | 131 ms (poll 168 ms) | 96×41, 9/9 | Chapter 3 notes | 41 | 0 |
| fix | 390x844@2:light:100 | 0/117 | [243, 488, 79, 44] / 0 | 217 ms (poll 136 ms) | 57×36, 9/9 | Chapter 3 notes | 96 | 0 |
| control | 390x844@2:light:100 | 33/133 {'after-End': 1, 'scrolling': 5, 'scrolled': 23, 'after-MarkDone': 3, 'after-Undo': 1} ['Create', 'Life', 'Put the kettle on · 25 min', 'Read', 'Spanish practice', 'Study', 'Work'] | [243, 488, 79, 44] / 0 | 131 ms (poll 123 ms) | 55×34, 9/9 | Chapter 3 notes | 541 | 0 |
| fix | 390x844@2:light:200 | 0/138 | [36, 349, 151, 44] / 880 | 177 ms (poll 100 ms) | 95×40, 9/9 | Chapter 3 notes | 19 | 0 |
| control | 390x844@2:light:200 | 125/151 {'scrolling': 11, 'scrolled': 51, 'after-MarkDone': 4, 'after-Undo': 59} ['15 minGentle', '25 minClassic', 'Clear what are you brewing? (optional)', 'Create', 'INPUT', 'Life', 'Mark “Chapter 3 notes” done', 'Put the kettle on · 25 min', 'Read', 'Spanish practice', 'Study', 'Work'] | [36, 189, 151, 44] / 1040 | 144 ms (poll 130 ms) | 96×41, 9/9 | Chapter 3 notes | 218 | 0 |

- **On the fix,** every sample in all 4 configurations is clear of the protected set, across every phase (after-End, scrolling, scrolled, after-MarkDone, after-Undo).
- The notice-zone spec failure in (a) is the same flow family (End → Today at 390×844 @200), from the spec's own sampler. **It was not reproduced by this probe run.**

## §6.2 / T-D1 · Today Undo

- **Runs:** fix :5446, `today` flow. @100 is light and @200 is dark, as the checker's "light (dark at 200 %)".
- **Raw:** `raw/today-*.json`; summary `runs/ABC.jsonl` rows 9–40 and `runs/R.jsonl` (reruns).
- **Rows replaced by a rerun.** The original raw JSON of each was overwritten by the rerun, which has the same file name. The original summary lines remain in `runs/ABC.jsonl`.
  - **390×844 @100 end/up (original):**
    - The wheel was sent during Today's entry. It landed at the moment of the Mark done tap: scroll went 0 → 593 → 447 in the first 224 ms after the tap.
    - No "Crossed off" was raised: 2 waiting, 0 drawn, for 4.3 s. The tap did not register as Mark done.
    - This is a probe artifact; it was fixed and rerun.
  - **375×667 @100 end/gone (original):** the probe waited for End's notices after scrolling. They stayed waiting (2) because their band was off screen, so the tap was made with 2 waiting, not after they had gone. It was rerun with change 2(b).
    - The original line: first sample 178 ms, 9/9, real Undo restored "Chapter 3 notes", 0 hits.
  - **375×667 @200 0/gone and the 667×375 @200 rows (original):** setup failures.
    - 375×667 @200 0/gone: `page.waitForFunction: Timeout 15000ms exceeded`.
    - 667×375 @200, all 4 rows: `locator.click: Timeout 30000ms exceeded` on the task field.
    - All were rerun, with change 2(c) for 667×375 @200.
- **The table below lists each configuration's final run.** `ABC.jsonl` rows that a rerun replaced are omitted. The "Src" column names the file.

| Config | Pos / End notices | At tap: Mark done box, scroll, ms after Today arrived, End notices drawn / waiting | First sample with Undo (ms after tap; poll) | Notice box at first sample | Undo w×h, 9-pt | Real Undo → field | Hit samples | Min top | Not whole | Src |
|---|---|---|---|---|---|---|---|---|---|---|
| 375x667@2:light:100 | 0 / up | [243, 488, 79, 44], 0, 649, 2 / 0 covered by Put the kettle on · 25 min | None (None) | None | None×None, None/9 | None Mark done not wholly on top at tap time (not tapped): [243,488,79,44] | 0/19 | 96 | 0 | ABC.jsonl |
| 375x667@2:light:100 | 0 / gone | [243, 488, 79, 44], 0, 9401, 0 / 0 covered by Put the kettle on · 25 min | None (None) | None | None×None, None/9 | None Mark done not wholly on top at tap time (not tapped): [243,488,79,44] | 0/71 | 96 | 0 | ABC.jsonl |
| 375x667@2:light:100 | end / up | [243, 20, 79, 44], 468, 2039, 0 / 2 | 178 (111) | [40, 45, 296, 51] | 57×35, 9/9 | Chapter 3 notes  | 0/38 | 45 | 0 | ABC.jsonl |
| 375x667@2:dark:200 | 0 / up | [36, 1322, 151, 44], 0, 645, 1 / 1 | None (None) | None | None×None, None/9 | None Mark done not wholly on top at tap time (not tapped): [36,1322,151,44] | 0/18 | 135 | 4 | ABC.jsonl |
| 375x667@2:dark:200 | end / up | [36, 76, 151, 44], 1246, 3274, 0 / 2 | 227 (216) | [28, 31, 319, 142] | 94×40, 9/9 | Chapter 3 notes  | 0/55 | 29 | 5 | ABC.jsonl |
| 375x667@2:dark:200 | end / gone | [36, 70, 151, 44], 1252, 10326, 0 / 0 | 136 (114) | [30, 26, 315, 140] | 92×39, 9/9 | Chapter 3 notes  | 0/108 | 23 | 29 | ABC.jsonl |
| 390x844@2:light:100 | 0 / up | [243, 488, 79, 44], 0, 630, 2 / 0 | 478 (457) | [50, 97, 291, 50] | 56×35, 9/9 | Chapter 3 notes  | 0/41 | 96 | 0 | ABC.jsonl |
| 390x844@2:light:100 | 0 / gone | [243, 488, 79, 44], 0, 5316, 0 / 0 | 190 (120) | [46, 161, 298, 51] | 57×36, 9/9 | Chapter 3 notes  | 0/74 | 97 | 0 | ABC.jsonl |
| 390x844@2:light:100 | end / gone | [243, 70, 79, 44], 418, 6208, 0 / 0 | 151 (131) | [47, 95, 295, 51] | 57×35, 9/9 | Chapter 3 notes  | 0/88 | 95 | 0 | ABC.jsonl |
| 390x844@2:dark:200 | 0 / up | [36, 1229, 151, 44], 0, 641, 2 / 0 | None (None) | None | None×None, None/9 | None Mark done not wholly on top at tap time (not tapped): [36,1229,151,44] | 0/19 | 144 | 0 | ABC.jsonl |
| 390x844@2:dark:200 | 0 / gone | [36, 1229, 151, 44], 0, 5771, 0 / 0 | None (None) | None | None×None, None/9 | None Mark done not wholly on top at tap time (not tapped): [36,1229,151,44] | 0/49 | 144 | 0 | ABC.jsonl |
| 390x844@2:dark:200 | end / up | [36, 25, 151, 44], 1204, 4142, 0 / 2 | 117 (94) | [31, 10, 328, 110] | 92×39, 9/9 | Chapter 3 notes  | 0/59 | 8 | 3 | ABC.jsonl |
| 390x844@2:dark:200 | end / gone | [36, 70, 151, 44], 1159, 5890, 0 / 0 | 126 (129) | [30, 25, 330, 140] | 93×39, 9/9 | Chapter 3 notes  | 0/87 | 22 | 0 | ABC.jsonl |
| 844x390@2:light:100 | 0 / up | [659, 184, 79, 44], 0, 630, 2 / 0 | 826 (848) | [122, 68, 280, 54] | 56×35, 9/9 | Chapter 3 notes  | 0/46 | 67 | 0 | ABC.jsonl |
| 844x390@2:light:100 | 0 / gone | [659, 184, 79, 44], 0, 5383, 0 / 0 | 209 (100) | [117, 132, 288, 56] | 57×36, 9/9 | Chapter 3 notes  | 0/75 | 72 | 0 | ABC.jsonl |
| 844x390@2:light:100 | end / up | [659, 70, 79, 44], 114, 3002, 2 / 0 | 171 (114) | [119, 64, 286, 55] | 57×35, 9/9 | Chapter 3 notes  | 0/48 | 63 | 0 | ABC.jsonl |
| 844x390@2:light:100 | end / gone | [659, 70, 79, 44], 114, 6083, 0 / 0 | 141 (117) | [120, 128, 283, 55] | 56×35, 9/9 | Chapter 3 notes  | 0/80 | 71 | 0 | ABC.jsonl |
| 844x390@2:dark:200 | 0 / up | [452, 456, 151, 44], 0, 619, 1 / 1 | None (None) | None | None×None, None/9 | None Mark done not wholly on top at tap time (not tapped): [452,456,151,44] | 0/24 | 209 | 0 | ABC.jsonl |
| 844x390@2:dark:200 | 0 / gone | [452, 456, 151, 44], 0, 9821, 0 / 0 | None (None) | None | None×None, None/9 | None Mark done not wholly on top at tap time (not tapped): [452,456,151,44] | 0/91 | 209 | 0 | ABC.jsonl |
| 844x390@2:dark:200 | end / up | [452, 70, 151, 44], 386, 3307, 1 / 1 | 75 (106) | [122, 244, 280, 140] | 92×39, 9/9 | Chapter 3 notes  | 0/50 | 209 | 0 | ABC.jsonl |
| 844x390@2:dark:200 | end / gone | [452, 70, 151, 44], 386, 10334, 0 / 0 | 144 (122) | [119, 243, 285, 142] | 94×40, 9/9 | Chapter 3 notes  | 0/107 | 209 | 0 | ABC.jsonl |
| 667x375@2:light:100 | 0 / up | [371, 253, 79, 44], 0, 1698, 2 / 0 covered by Put the kettle on · 25 min | None (None) | None | None×None, None/9 | None Mark done not wholly on top at tap time (not tapped): [371,253,79,44] | 0/30 | 117 | 0 | ABC.jsonl |
| 667x375@2:light:100 | 0 / gone | [371, 253, 79, 44], 0, 5522, 0 / 0 covered by Put the kettle on · 25 min | None (None) | None | None×None, None/9 | None Mark done not wholly on top at tap time (not tapped): [371,253,79,44] | 0/50 | 117 | 0 | ABC.jsonl |
| 667x375@2:light:100 | end / up | [371, 70, 79, 44], 183, 2956, 1 / 1 | 208 (129) | [117, 174, 208, 99] | 57×36, 9/9 | Chapter 3 notes  | 0/45 | 16 | 0 | ABC.jsonl |
| 667x375@2:light:100 | end / gone | [371, 70, 79, 44], 183, 5991, 0 / 0 | 162 (160) | [120, 175, 203, 97] | 56×35, 9/9 | Chapter 3 notes  | 0/78 | 116 | 0 | ABC.jsonl |
| 390x844@2:light:100 | end / up | [243, 70, 79, 44], 418, 2846, 0 / 2 | 182 (160) | [49, 96, 292, 50] | 56×35, 9/9 | Chapter 3 notes  | 0/58 | 95 | 0 | R.jsonl |
| 375x667@2:light:100 | end / gone | [243, 70, 79, 44], 418, 10409, 0 / 0 | 175 (113) | [39, 95, 297, 51] | 57×36, 9/9 | Chapter 3 notes  | 0/104 | 95 | 0 | R.jsonl |
| 375x667@2:dark:200 | 0 / gone | [36, 1322, 151, 44], 0, 9523, 0 / 0 | None (None) | None | None×None, None/9 | None Mark done not wholly on top at tap time (not tapped): [36,1322,151,44] | 0/73 | 135 | 29 | R.jsonl |
| 667x375@2:dark:200 | 0 / up | [371, 495, 151, 44], 0, 642, 1 / 1 | None (None) | None | None×None, None/9 | None Mark done not wholly on top at tap time (not tapped): [371,495,151,44] | 0/15 | 145 | 5 | R.jsonl |
| 667x375@2:dark:200 | 0 / gone | [371, 495, 151, 44], 0, 9593, 0 / 0 | None (None) | None | None×None, None/9 | None Mark done not wholly on top at tap time (not tapped): [371,495,151,44] | 0/71 | 145 | 29 | R.jsonl |
| 667x375@2:dark:200 | end / up | [371, 70, 151, 44], 425, 10638, 0 / 2 covered by Put the kettle on · 25 min | None (None) | None | None×None, None/9 | None Mark done not wholly on top at tap time (not tapped): [371,70,151,44] | 0/80 | 145 | 6 | R.jsonl |
| 667x375@2:dark:200 | end / gone | [371, 70, 151, 44], 425, 18712, 0 / 0 covered by Put the kettle on · 25 min | None (None) | None | None×None, None/9 | None Mark done not wholly on top at tap time (not tapped): [371,70,151,44] | 0/152 | 145 | 29 | R.jsonl |
| 375x667@2:light:200 inset {'t': 47, 'r': 0, 'bo': 34, 'l': 0} | end / up | [36, 70, 151, 44], 1252, 1954, 0 / 2 | 203 (198) | [30, 57, 314, 110] | 92×39, 9/9 | Chapter 3 notes  | 0/44 | 55 | 11 | D.jsonl |
| 667x375@2:light:100 inset {'t': 0, 'r': 47, 'bo': 21, 'l': 47} | end / gone | [399, 39, 79, 44], 280, 38153, 0 / 2 | 206 (123) | [392, 18, 204, 99] | 57×36, 9/9 | Chapter 3 notes  | 0/288 | 18 | 3 | D.jsonl |

**Notices at tap time.**
- In the "up" rows **at scroll 0**, End's 2 notices were **drawn** at the tap (column "drawn / waiting" = 2 / 0, or 1 / 1).
- In most "up" rows **at the end position**, they were **waiting** (0 / 2): Today's Hero band was off screen after the wheel.
- 844×390 @100 end/up had them drawn (2 / 0).

**Slowest first draws: the two rows where End's notices were drawn at the tap and Mark done was tapped at scroll 0** (samples from `raw/today-fix-{390x844,844x390}_2_light_100-pos_0_when_up.json`):
- **390×844 @100:**
  - "Saved 3 minutes of focus" stays drawn at 0, 112 and 223 ms after the tap.
  - At 336 ms it is gone (1 waiting). In the same sample the composer zone changes (rank-2 box h 279 → 454, plus a new rank-2 zone at y 494, h 67).
  - "Crossed off · Undo" is first drawn at 455 ms.
- **844×390 @100:**
  - "Saved" stays drawn through 559 ms.
  - Yield and zone change at 672 ms.
  - "Crossed off" is first drawn at 784 ms (sampler 826 ms, poll 848 ms).
- **Every other tapped row:** first drawn 75–227 ms after the tap.

**N/A rows.** Mark done was not wholly on top at scroll 0, so it was not tapped:
- 375×667 @100: covered by "Put the kettle on · 25 min", the docked start.
- 375×667 @200 and 390×844 @200: Mark done at y 1322 and y 1229, below the viewport.
- 844×390 @200: Mark done at y 456, outside the 390 px viewport.
- 667×375 @100: covered by the docked start.
- 667×375 @200 (rerun, field focused by fallback 2(c)), at scroll 0: Mark done at y 495, below the 375 px viewport.

These agree with the maker's own N/A statement for 390×844 @200 and 375×667 @100 at scroll 0, and add 375×667 @200, 844×390 @200, 667×375 @100 and 667×375 @200 at scroll 0.

**667×375 @200 end/up and end/gone: no T-D1 row.**
- At the page end (max scroll reached 1962), Mark done was not on top.
- After the one-step wheel back and the lead's `wheelInto` (up to 60 wheel steps), Mark done sat at y 70, scroll 425, and its centre was covered by **"Put the kettle on · 25 min"** (the docked start), so it was not tapped.
- The maker reports the same configuration as "Undo not drawn in 3 s (Mark done at y 60, scroll 0)". No scroll position was found where Mark done was on top for a real tap. **No result on whether the Undo is drawn there.**

## §6.3 / T-D2 · History delete and Settings import

- **Runs:** fix :5446 and control :5410; seed `veteran`, light.
- **History "last":** the first page's last row, wheeled into view. **"mid":** row 5 of 10.
- **Raw:** `raw/history-*.json`, `raw/import-*.json`; summary `runs/ABC.jsonl` rows 41–64 and `runs/R.jsonl` (the 390×844 @200 import reruns).
- **How placement is classified:** "R-3 fallback" when the notice region's bottom equals the tab bar's top − 14 px (±3), which is the fallback's formula in `Toast.tsx` l.368–384; otherwise "band". This is inferred from boxes. The DOM carries no marker for it.
- **"Δ first − gone"** is the first drawn sample minus the first sample with no dialog and no `#root[inert]`. Both are in ~100 ms samples.

| Side | Config | Flow | Scroll / rows | Dialog gone (ms after confirm tap) | First sample drawn with Undo (ms) | Δ first − gone | Notice box / region | Nav top; zones | Placement (inferred) | Undo w×h, 9-pt | Real Undo → state | Hit samples | Edit taps |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| fix | 390x844@2:light:100 | history last | 3120 / 10 | 1547 | 1662 | 115 | [79, 708, 231, 51] / [16, 702, 358, 58] | 774; 0 | R-3 fallback (region bottom = nav top − 14) | 57×36, 9/9 | rows 10→9→10 tapped  | 3/37 {'after-Delete': 2, 'after-Undo': 1} ['Poetry, slowly, 14:32, 25 minutes, Full ', 'Show earlier days'] | 1 |
| fix | 390x844@2:light:100 | history mid | 2720 / 10 | 1187 | 1306 | 119 | [79, 153, 231, 51] / [8, 66, 374, 139] | 774; 0 | band (region bottom 205, nav top 774) | 57×36, 9/9 | rows 10→9→10 tapped  | 0/33 | 1 |
| fix | 390x844@2:light:100 | import | 2080 / — | 672 | 672 | 0 | [13, 611, 364, 55] / [8, 603, 374, 64] | 774; 0 | band (region bottom 667, nav top 774) | 56×35, 9/9 | brews 83→86→83 tapped  | 0/24 | None |
| control | 390x844@2:light:100 | history last | 3120 / 10 | 1598 | 1346 | -252 | [85, 730, 220, 49] / [16, 710, 358, 52] | 774; 0 | R-3 fallback (region bottom = nav top − 14) | 55×34, 9/9 | rows 10→9→10 tapped  | 9/36 {'after-Delete': 4, 'after-Undo': 5} ['A quiet brew, 13:45, 25 minutes, Full br', 'Nook', 'Poetry, slowly, 14:32, 25 minutes, Full ', 'Settings', 'Show earlier days', 'Stats', 'Today'] | 1 |
| control | 390x844@2:light:100 | history mid | 2720 / 10 | 1909 | 1696 | -213 | [85, 730, 220, 49] / [16, 710, 358, 52] | 774; 0 | R-3 fallback (region bottom = nav top − 14) | 55×34, 9/9 | rows 10→9→10 tapped  | 12/43 {'after-Delete': 3, 'after-Undo': 9} ['Nook', 'Quarterly report, 8:00, 25 minutes, Full', 'Settings', 'Stats', 'Thesis chapter 3, 15:00, 25 minutes, Ful', 'Today'] | 1 |
| control | 390x844@2:light:100 | import | 2080 / — | 436 | 211 | -225 | [26, 723, 339, 53] / [16, 706, 358, 57] | 774; 0 | R-3 fallback (region bottom = nav top − 14) | 55×34, 9/9 | brews 83→86→83 tapped  | 20/22 {'after-Import': 3, 'after-Undo': 17} ['Export a backupSave everything as a .jso', 'Import a backupAdd or restore from a Ket', 'Nook', 'Settings', 'Stats', 'Today'] | None |
| fix | 390x844@2:light:200 | history last | 4760 / 10 | 547 | 547 | 0 | [22, 654, 346, 94] / [16, 646, 358, 103] | 763; 0 | R-3 fallback (region bottom = nav top − 14) | 93×39, 9/9 | rows 10→9→10 tapped  | 18/42 {'after-Delete': 2, 'after-Undo': 16} ['Poetry, slowly, 14:32, 25 minutes, Full ', 'Show earlier days'] | 2 |
| fix | 390x844@2:light:200 | history mid | 4760 / 10 | 985 | 985 | 0 | [21, 653, 348, 94] / [16, 646, 358, 103] | 763; 0 | R-3 fallback (region bottom = nav top − 14) | 93×39, 9/9 | rows 10→9→10 tapped  | 4/32 {'after-Delete': 2, 'after-Undo': 2} ['Quarterly report, 8:00, 25 minutes, Full', 'Roadmap draft, 16:10, 50 minutes, Full b'] | 2 |
| control | 390x844@2:light:200 | history last | 4760 / 10 | None | 571 | — | [16, 644, 358, 105] / [16, 644, 358, 107] | 763; 0 | R-3 fallback (region bottom = nav top − 14) | 96×41, 9/9 | rows 10→9→10 tapped  | 11/32 {'after-Delete': 4, 'after-Undo': 7} ['A quiet brew, 13:45, 25 minutes, Full br', 'Poetry, slowly, 14:32, 25 minutes, Full ', 'Show earlier days'] | 2 |
| control | 390x844@2:light:200 | history mid | 4760 / 10 | 580 | 363 | -217 | [16, 644, 358, 105] / [16, 644, 358, 107] | 763; 0 | R-3 fallback (region bottom = nav top − 14) | 96×41, 9/9 | rows 10→9→10 tapped  | 8/28 {'after-Delete': 5, 'after-Undo': 3} ['Quarterly report, 8:00, 25 minutes, Full', 'Roadmap draft, 16:10, 50 minutes, Full b', 'Thesis chapter 3, 15:00, 25 minutes, Ful'] | 2 |
| fix | 375x667@2:light:100 | history last | 3360 / 10 | 1374 | 1374 | 0 | [75, 532, 225, 50] / [16, 525, 343, 58] | 597; 0 | R-3 fallback (region bottom = nav top − 14) | 56×35, 9/9 | rows 10→9→10 tapped  | 4/34 {'after-Delete': 3, 'after-Undo': 1} ['Show earlier days'] | 1 |
| fix | 375x667@2:light:100 | history mid | 2880 / 10 | 1149 | 1149 | 0 | [74, 13, 228, 51] / [8, 8, 359, 56] | 597; 0 | band (region bottom 64, nav top 597) | 56×35, 9/9 | rows 10→9→10 tapped  | 0/33 | 1 |
| fix | 375x667@2:light:100 | import | 2320 / — | 371 | 486 | 115 | [10, 398, 355, 56] / [8, 390, 359, 64] | 597; 0 | band (region bottom 454, nav top 597) | 57×36, 9/9 | brews 83→86→83 [confirm retries None; sheet buttons ['', 'Addkeep what’s here', 'Replaceswap it all', 'Cancel', 'Add']] tapped  | 0/20 | None |
| control | 375x667@2:light:100 | history last | 3360 / 10 | 1063 | 852 | -211 | [77, 552, 221, 49] / [16, 533, 343, 52] | 597; 0 | R-3 fallback (region bottom = nav top − 14) | 55×34, 9/9 | rows 10→9→10 tapped  | 7/32 {'after-Delete': 3, 'after-Undo': 4} ['A quiet brew, 13:45, 25 minutes, Full br', 'Nook', 'Settings', 'Show earlier days', 'Stats', 'Today'] | 1 |
| control | 375x667@2:light:100 | history mid | 2880 / 10 | 1413 | 1188 | -225 | [78, 553, 220, 49] / [16, 533, 343, 52] | 597; 0 | R-3 fallback (region bottom = nav top − 14) | 55×34, 9/9 | rows 10→9→10 tapped  | 9/35 {'after-Delete': 4, 'after-Undo': 5} ['Nook', 'Roadmap draft, 16:10, 50 minutes, Full b', 'Settings', 'Stats', 'Thesis chapter 3, 15:00, 25 minutes, Ful', 'Today'] | 1 |
| control | 375x667@2:light:100 | import | 2320 / — | 393 | 170 | -223 | [22, 540, 331, 54] / [16, 529, 343, 57] | 597; 0 | R-3 fallback (region bottom = nav top − 14) | 56×35, 9/9 | brews 83→86→83 [confirm retries None; sheet buttons ['', 'Addkeep what’s here', 'Replaceswap it all', 'Cancel', 'Add']] tapped  | 17/19 {'after-Import': 3, 'after-Undo': 14} ['Import a backupAdd or restore from a Ket', 'Nook', 'Settings', 'Stats', 'Today'] | None |
| fix | 375x667@2:light:200 | history last | 4769 / 10 | None | None | — | None / None | 586; 0 | — | None×None, None/9 | rows 10→10→10 no Undo drawn within 6 s  | 0/63 | 2 |
| fix | 375x667@2:light:200 | history mid | 4769 / 10 | None | None | — | None / None | 586; 0 | — | None×None, None/9 | rows 10→10→10 no Undo drawn within 6 s  | 0/65 | 2 |
| fix | 375x667@2:light:200 | import | 4800 / — | None | None | — | None / None | None; None | — | None×None, None/9 | brews 83→None→None  page.waitForEvent: Timeout 8000ms exceeded while waiting for event "filechooser" =========================== logs =========================== waiting for event "filechooser" ============================================================ | 0/0 | None |
| control | 375x667@2:light:200 | history last | 4769 / 10 | None | None | — | None / None | 586; 0 | — | None×None, None/9 | rows 10→10→10 no Undo drawn within 6 s  | 0/64 | 2 |
| control | 375x667@2:light:200 | history mid | 4769 / 10 | None | None | — | None / None | 586; 0 | — | None×None, None/9 | rows 10→10→10 no Undo drawn within 6 s  | 0/63 | 2 |
| control | 375x667@2:light:200 | import | 4800 / — | None | None | — | None / None | None; None | — | None×None, None/9 | brews 83→None→None  page.waitForEvent: Timeout 8000ms exceeded while waiting for event "filechooser" =========================== logs =========================== waiting for event "filechooser" ============================================================ | 0/0 | None |
| fix | 390x844@2:light:200 | import | 4800 / — | None | None | — | None / None | None; None | — | None×None, None/9 | brews 83→None→None [confirm retries 4; sheet buttons []]  locator.textContent: Timeout 30000ms exceeded. Call log:   - waiting for getByRole('button', { name: /^(Add/Restore/Replace)$/ }).last()  | 0/0 | None |
| control | 390x844@2:light:200 | import | 4800 / — | None | None | — | None / None | None; None | — | None×None, None/9 | brews 83→None→None [confirm retries 4; sheet buttons []]  locator.textContent: Timeout 30000ms exceeded. Call log:   - waiting for getByRole('button', { name: /^(Add/Restore/Replace)$/ }).last()  | 0/0 | None |

**Harness gaps (both sides, not product results):**
- **375×667 @200 History, last and mid, fix and control:**
  - The Edit sheet opened on the 2nd tap.
  - After the confirm-Delete tap, the dialog and `#root[inert]` stayed for the whole 6 s, and rows stayed 10 → 10. No delete happened, so no Undo could be expected.
  - This is the same harness gap that the lead and the maker reported at this configuration.
- **375×667 @200 import, fix and control:** the real tap on "Import a backup" raised no file chooser in 8 s (`page.waitForEvent: Timeout 8000ms exceeded while waiting for event "filechooser"`).
- **390×844 @200 import:** the first runs failed on the sheet's confirm button. The fix run failed with "Element is not attached to the DOM / element is not stable"; the control run with a 30 s timeout on `Add|Restore|Replace`. Reruns with change 4's retry (15:35–15:36) failed again on both sides: the sheet "Add this backup?" was present, but `[role="dialog"] button` listed **no buttons**, and `getByRole('button', {name: /^(Add|Restore|Replace)$/})` timed out 4 × 4 s. **No result at 390×844 @200 for the import, on either side.**

## §6.5 / T-D4 · edge margin and safe area

- **CDP `Emulation.setSafeAreaInsetsOverride` is available** in this Chromium (Playwright's bundled build). It returned OK, and the probe element read the inset back: requested 47/0/34/0 → `env()` read top 47, bottom 34.
- **Minimum notice top and notice boxes outside the viewport**, per run, for every probe run (fix and control):

| Flow | Side | Config | Inset (CDP) / probe-read inset | Min notice top | Notice boxes outside viewport | Samples |
|---|---|---|---|---|---|---|
| end-scrolled  | fix | 375x667@2:light:100 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | 17 | 0 | 132 |
| end-scrolled  | control | 375x667@2:light:100 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | 364 | 0 | 150 |
| end-scrolled  | fix | 375x667@2:light:200 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | 8 | 0 | 125 |
| end-scrolled  | control | 375x667@2:light:200 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | 41 | 0 | 160 |
| end-scrolled  | fix | 390x844@2:light:100 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | 96 | 0 | 117 |
| end-scrolled  | control | 390x844@2:light:100 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | 541 | 0 | 133 |
| end-scrolled  | fix | 390x844@2:light:200 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | 19 | 0 | 138 |
| end-scrolled  | control | 390x844@2:light:200 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | 218 | 0 | 151 |
| today 0/up | fix | 375x667@2:light:100 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | 96 | 0 | 19 |
| today 0/gone | fix | 375x667@2:light:100 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | 96 | 0 | 71 |
| today end/up | fix | 375x667@2:light:100 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | 45 | 0 | 38 |
| today 0/up | fix | 375x667@2:dark:200 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | 135 | 0 | 18 |
| today end/up | fix | 375x667@2:dark:200 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | 29 | 0 | 55 |
| today end/gone | fix | 375x667@2:dark:200 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | 23 | 0 | 108 |
| today 0/up | fix | 390x844@2:light:100 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | 96 | 0 | 41 |
| today 0/gone | fix | 390x844@2:light:100 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | 97 | 0 | 74 |
| today end/gone | fix | 390x844@2:light:100 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | 95 | 0 | 88 |
| today 0/up | fix | 390x844@2:dark:200 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | 144 | 0 | 19 |
| today 0/gone | fix | 390x844@2:dark:200 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | 144 | 0 | 49 |
| today end/up | fix | 390x844@2:dark:200 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | 8 | 0 | 59 |
| today end/gone | fix | 390x844@2:dark:200 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | 22 | 0 | 87 |
| today 0/up | fix | 844x390@2:light:100 | none  / {'top': 0, 'left': 0, 'right': 15, 'bottom': 0} | 67 | 0 | 46 |
| today 0/gone | fix | 844x390@2:light:100 | none  / {'top': 0, 'left': 0, 'right': 15, 'bottom': 0} | 72 | 0 | 75 |
| today end/up | fix | 844x390@2:light:100 | none  / {'top': 0, 'left': 0, 'right': 15, 'bottom': 0} | 63 | 0 | 48 |
| today end/gone | fix | 844x390@2:light:100 | none  / {'top': 0, 'left': 0, 'right': 15, 'bottom': 0} | 71 | 0 | 80 |
| today 0/up | fix | 844x390@2:dark:200 | none  / {'top': 0, 'left': 0, 'right': 15, 'bottom': 0} | 209 | 0 | 24 |
| today 0/gone | fix | 844x390@2:dark:200 | none  / {'top': 0, 'left': 0, 'right': 15, 'bottom': 0} | 209 | 0 | 91 |
| today end/up | fix | 844x390@2:dark:200 | none  / {'top': 0, 'left': 0, 'right': 15, 'bottom': 0} | 209 | 0 | 50 |
| today end/gone | fix | 844x390@2:dark:200 | none  / {'top': 0, 'left': 0, 'right': 15, 'bottom': 0} | 209 | 0 | 107 |
| today 0/up | fix | 667x375@2:light:100 | none  / {'top': 0, 'left': 0, 'right': 15, 'bottom': 0} | 117 | 0 | 30 |
| today 0/gone | fix | 667x375@2:light:100 | none  / {'top': 0, 'left': 0, 'right': 15, 'bottom': 0} | 117 | 0 | 50 |
| today end/up | fix | 667x375@2:light:100 | none  / {'top': 0, 'left': 0, 'right': 15, 'bottom': 0} | 16 | 0 | 45 |
| today end/gone | fix | 667x375@2:light:100 | none  / {'top': 0, 'left': 0, 'right': 15, 'bottom': 0} | 116 | 0 | 78 |
| history last | fix | 390x844@2:light:100 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | 708 | 0 | 37 |
| history mid | fix | 390x844@2:light:100 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | 153 | 0 | 33 |
| import  | fix | 390x844@2:light:100 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | 610 | 0 | 24 |
| history last | control | 390x844@2:light:100 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | 709 | 0 | 36 |
| history mid | control | 390x844@2:light:100 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | 709 | 0 | 43 |
| import  | control | 390x844@2:light:100 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | 705 | 0 | 22 |
| history last | fix | 390x844@2:light:200 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | 652 | 0 | 42 |
| history mid | fix | 390x844@2:light:200 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | 652 | 0 | 32 |
| history last | control | 390x844@2:light:200 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | 644 | 0 | 32 |
| history mid | control | 390x844@2:light:200 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | 644 | 0 | 28 |
| history last | fix | 375x667@2:light:100 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | 531 | 0 | 34 |
| history mid | fix | 375x667@2:light:100 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | 12 | 0 | 33 |
| import  | fix | 375x667@2:light:100 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | 398 | 0 | 20 |
| history last | control | 375x667@2:light:100 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | 532 | 0 | 32 |
| history mid | control | 375x667@2:light:100 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | 532 | 0 | 35 |
| import  | control | 375x667@2:light:100 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | 528 | 0 | 19 |
| history last | fix | 375x667@2:light:200 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | None | 0 | 63 |
| history mid | fix | 375x667@2:light:200 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | None | 0 | 65 |
| import  | fix | 375x667@2:light:200 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | None | 0 | 0 |
| history last | control | 375x667@2:light:200 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | None | 0 | 64 |
| history mid | control | 375x667@2:light:200 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | None | 0 | 63 |
| import  | control | 375x667@2:light:200 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | None | 0 | 0 |
| today end/up | fix | 390x844@2:light:100 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | 95 | 0 | 58 |
| today end/gone | fix | 375x667@2:light:100 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | 95 | 0 | 104 |
| today 0/gone | fix | 375x667@2:dark:200 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | 135 | 0 | 73 |
| today 0/up | fix | 667x375@2:dark:200 | none  / {'top': 0, 'left': 0, 'right': 15, 'bottom': 0} | 145 | 0 | 15 |
| today 0/gone | fix | 667x375@2:dark:200 | none  / {'top': 0, 'left': 0, 'right': 15, 'bottom': 0} | 145 | 0 | 71 |
| today end/up | fix | 667x375@2:dark:200 | none  / {'top': 0, 'left': 0, 'right': 15, 'bottom': 0} | 145 | 0 | 80 |
| today end/gone | fix | 667x375@2:dark:200 | none  / {'top': 0, 'left': 0, 'right': 15, 'bottom': 0} | 145 | 0 | 152 |
| import  | fix | 390x844@2:light:200 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | None | 0 | 0 |
| import  | control | 390x844@2:light:200 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | None | 0 | 0 |
| summary  | fix | 390x844@2:light:100 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | 11 | 0 | 148 |
| summary  | fix | 375x667@2:light:100 | none  / {'top': 0, 'left': 0, 'right': 0, 'bottom': 0} | 11 | 0 | 110 |
| summary  | fix | 390x844@2:light:100 | {'t': 47, 'r': 0, 'bo': 34, 'l': 0} ok / {'top': 47, 'left': 0, 'right': 0, 'bottom': 34} | 58 | 0 | 74 |
| today end/up | fix | 375x667@2:light:200 | {'t': 47, 'r': 0, 'bo': 34, 'l': 0} ok / {'top': 47, 'left': 0, 'right': 0, 'bottom': 34} | 55 | 0 | 44 |
| today end/gone | fix | 667x375@2:light:100 | {'t': 0, 'r': 47, 'bo': 21, 'l': 47} ok / {'top': 0, 'left': 47, 'right': 62, 'bottom': 21} | 18 | 0 | 288 |

The probe-read `right: 15` at 844×390 and 667×375 is the page's 15 px classic scrollbar, not a safe-area inset. The probe reads `innerWidth − box.right`, and those two contexts are not `isMobile`, so they have a classic scrollbar.

Minimum notice top over all **fix** runs without an inset: **8 (runs: [('end-scrolled', '375x667@2:light:200', None, None), ('today', '390x844@2:dark:200', 'end', 'up')]) px**. Notice boxes outside the viewport, over all fix runs: **0**.

With the inset emulated:
- **Summary, 390×844 @100, top inset 47:** minimum top **58** (= 47 + 11).
- **Today, 375×667 @200, end/up, top inset 47:** minimum top **55** (= 47 + 8).
- **Today, 667×375 @100, end/gone, left and right insets 47:** notice boxes start at x ≥ 392. Minimum top **18**, with top inset 0.

The receipt checks the boxes of the drawn notices (`li`). Region boxes outside the viewport were also counted per phase (`regionOutside` in the run's byTag). It is absent, i.e. 0, in every run.

## §6.6 / T-D5 · summary on T + P (fix trial)

- **Runs:** `summary` flow, light, 390×844 and 375×667 @100. Two notices raised at `finish()`.
- **Raw:** `raw/summary-fix-*.json`. **Frames:** `raw/summary-fix-390x844_2_light_100-/arrival-{300,800,1500,2500,4000}ms.png` and the same names for 375×667.

| Config | Samples | Hit samples | Samples with 2 notices | Notice y-range (all samples) | Two-notice steady boxes (CSS px) | Chai box (`_chai_*`) | Stage zone |
|---|---|---|---|---|---|---|---|
| 390×844 @100 | 148 | **0** | 71 | 11–177 | [8,11,374,57], [68,76,254,52] | [236,216,113,155] | [0,0,390,422] |
| 375×667 @100 | 110 | **0** | 71 | 11–177 | [8,11,359,57], [61,76,254,52] | [227,115,109,149] | [0,0,375,313] |
| 390×844 @100, inset top 47 | 74 | **0** | 71 | 58–214 | [8,58,374,57], [68,123,254,52] | [236,216,113,155] | [0,0,390,422] |

Frames opened, at full size:
- **390×844 1500 ms:**
  - The notices' bottom is at about y 128.
  - The kettle (lid knob, handle, gauge ~290–330, flame) and Chai (face ~250–320) are below them and clear.
- **390×844 300 ms**, the whistle frame ("Tea's ready!", 0:00):
  - The top bar (Rain, mute) is at y ~10–50. The notices are at y 60–177.
  - The steam puffs (x ≈ 10–65) are left of the second notice (x 68–322). The kettle and Chai are clear.
- **375×667 1500 ms:**
  - The second notice's bottom edge (y ≈ 128) meets the top of the kettle's handle and the knob on Chai's head and the sparkles.
  - The gauge (~180–210) and Chai's face (~160–200) are clear. Lead ruling R-1 covers the 375×667 @100 two-line case.
- The kettle gauge has no class or id in the DOM, so the probe has no box for it. Its position comes from the frames.

## §6.8 · not worse (fix :5446 unless stated; `--project=chromium --workers=1`)

Index with times: `logs/specs-index.log`. Each log is `logs/spec-<name>.log`.

| Spec (line on this tree) | Command extras | Result | Time (UTC) |
|---|---|---|---|
| `integrity.spec.ts:1090` (storage-full banner, Mark done; 390×844, 375×667, 1440×900) | `--repeat-each=3` | **9 passed** | 15:11–15:12 |
| `integrity.spec.ts:1004` at 1440 (`--grep 1440`) | `--repeat-each=3` | **3 passed** | 15:12–15:14 |
| `toast-room.spec.ts` + `w2-home.spec.ts` | — | **32 passed** (14 + 18) | 15:14–15:21 |
| `statusbar.spec.ts:114` dark. This is the brief's `:106`, "large text with large leaf totals…", which sits at l.106 on base `b377c62` and at l.114 on this tree | `--grep dark --repeat-each=3` | **3 passed** | 15:21–15:24 |
| `break-reach.spec.ts:184`. This is the brief's `:179`, "Break's over with a carried task", 375×667 light, 390×844 dark, 844×390 light; it is at l.184 on this tree. Monday 2026-10-12, the spec default | — | **3 passed** | 15:27–15:28 |
| `break-reach.spec.ts:184` Thursday (`KETTLE_AT=2026-10-15T07:40:00.000Z`) | — | **3 passed (55.5s)** (rc 0, ended 15:32:46) | 15:31– |
| `integrity.spec.ts:637` (Skip break / Next brew / That's all for now), **fix** :5446 | `--repeat-each=3` | **3 passed** | 15:24–15:26 |
| `integrity.spec.ts:637`, **control** :5410 from `/home/user/wt/w3-base/kettle` | `--repeat-each=3` | **3 passed** | 15:26–15:27 |

Line numbers were checked by reading the test title at each line on both trees: `integrity :1090/:1004/:637` are the same on both.

## Not done / incomplete

- **break-reach weekdays:** only Monday (spec default) and Thursday were run, not all 7.
- **History and import at 375×667 @200:** harness gaps on both sides (above). No product result.
- **≤ 1 frame:** sampling is ~100 ms (accepted by the checker), with a 40 ms poll alongside. No per-frame trace was made.
- **T-D5 coverage:** @200, dark, 1440×900, the big day (record player), and the K02/K03/PRESERVE 8 REFERENCE → BEFORE → AFTER triples were not produced by this lane. Only the two @100 light summaries, plus one with an inset.
- **§6.2 at 844×390 and 667×375:** the brief asks for dark at 200 % only; light @200 was not run. No control runs were made for T-D1. The control's Undo rows are in the end-scrolled table only.
- **Not run by this lane:** §6.8 `a11y`, tsc, vitest, timer/pwa, and the full chromium suite.
- **Lost time:** the usage-limit stop and container restart (about 13:45–14:57) took about 70 minutes of the original box.
