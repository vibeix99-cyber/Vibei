# Investigator BD (Sonnet): the 390 dark first-brew backdrop difference

**Binding:** `VB-DECISIONS-POSTFOLLOWUP.md` §2. **Report only; change no code.**

**The finding** (`review/FINAL/RECEIPT-FINAL.md` §9, Lane R; scripts in `review/FINAL/scripts/`, captures in `review/FINAL/cap/`):
- **State `13` first-brew, 390×844@2 dark:** final `2be3de1` against base `4d36939` is **29.9 % strict / 8.87 % tol**. Base against base is 0.0 / 0.0. The same numbers appeared in the earlier combined matrix.
- **Where:** the red diff area is the **backdrop room image** (window, curtains, wall) behind the kettle and Chai, not Chai.
- The same state in light is 0.0. 375 light shows 22.5 / 0.66 (tint level).

## Steps

1. **Noise.** Repeat base against base, and final against final, at 390 dark `13` (≥ 3 each) to confirm the floor. Use the same capture tool and frozen clock as Lane R.
2. **Bisect the merges** on the first-parent line from `4d36939`:

   | Merge | Change |
   |---|---|
   | `3faaf94` | N |
   | `25b5e26` | G |
   | `a859d86` | docs |
   | `0efca36` | S |
   | `60fdb7e` | X-2 |
   | `2be3de1` | F |
   | `8b1ed4d` | Phase A |
   | `f2298d3` | Phase B |

   - For each candidate, make a detached sparse worktree (`kettle/src kettle/tests kettle/scripts kettle/public kettle/art-src kettle/docs`) under `/home/user/wt/w6-bd-<hash>`, with `node_modules` symlinked and a private `.tmp/w2.vite.config.ts` copied from `/home/user/wt/w6-int/kettle/.tmp/` with the path replaced.
   - Build a preview to `/tmp/rv7-servers/dist-w6bd-<hash>` and serve it with `/tmp/rv7-servers/start.sh w6bd-<hash> <worktree> - <port>`, using ports **5580–5589**.
   - Capture `13` at 390 dark and compare with base. Binary search is fine. Stop servers you no longer need, killing by PID.
3. **Name the merge and the mechanism.** Name the merge where the difference first appears, then the exact file or line and how it changes the backdrop room image. For example: the backdrop still is rendered by the 3D scene and N's night lighting reaches it, or a theme token, or a CSS filter.
4. **Say whether it is intended,** judged against that maker's brief and verdict.
5. If the cause is **non-obvious** or the intent is unclear, say so plainly. The orchestrator hands it to LEAD-5.

## Rules

- **Slot gate** `--lane BD --n 1` (the fix maker F1X shares the gate). Never `pkill -f`.
- **Receipt:** `/home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/BACKDROP/RECEIPT-BACKDROP.md`, written in stages and committed after each with `/tmp/rv7-servers/commit-evidence.sh kettle/review/product-excellence/contracts/W3R1/review/BACKDROP "<message>"`. Evidence ≤ 30 MB, logs as `.log.txt`.
- **Budget:** 2 h. Hard stop **11:00 UTC**.
- At the end, stop your servers and remove your `w6-bd-*` worktrees (`git worktree remove`, these are your own).
