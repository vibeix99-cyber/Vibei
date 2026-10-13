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
