# W2R3 round 3 · Lane T receipt · Maker T2 notices (I10)

Raw evidence only, no verdict. Lane T did not build this work.

| | |
|---|---|
| Under review | `pe/w2r3-notices@6a64fbf`, code `61b463c`, kettle/src `5aa6228` |
| Trial (fix) | `490ca97` (integration `f1f059c` + T2), worktree `/home/user/wt/w4tr-t2` (clean), `HEAD:kettle/src` = `62672e1`, dev **:5476** (served `src/ui/Toast.tsx` contains `NoticeStrip`, `src/ui/InlineUndo.tsx` contains `data-inline-undo`) |
| Base | `61aba17`, dev **:5470** (served `Toast.tsx` still has `toastLiftBottom` / `foldToFit`) |
| Lane window | 23:22:55 to about 00:54 UTC, 2026-10-13/14 |
| Browser gate | every browser ran through `slots.py run --lane LT --n 1` (LR held 2 slots and LEAD queued jobs the whole time, so Lane T only had one slot) |
| Scripts | `/home/user/wt/w4tr-t2/kettle/.tmp/LT/` (`ltprobe.mjs` = the probe, `agg.py` = the tables, `chain.sh`, `suites.sh`); copies in `LT/tools/` |
| Evidence | `LT/probes/fix/*.json` (one per configuration), `LT/probes/cmp/*.json` (base, plus the tap and storage checks), `LT/probes/*/shot-*.png` (taken automatically on the first non-modal drawn overlap in a group, max 3 per group), `LT/runs/*.log` / `*.json` |
