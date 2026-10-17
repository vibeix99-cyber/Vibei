# CHECKER W3R2 · TS: test-only stability (item 3), LEAD-6

**Under review:** `pe/w3r2-test-stability@21e5644` (`a6b3790`, `21e5644` on base `494748b`), tests tree `59f5e49`, src unchanged (`b74e6b3`).
**Trial:** `6babf87` = integration `f4e57e1` + `21e5644`, worktree `/home/user/wt/w8tr-q`; its `kettle/tests` tree is `59f5e49` (checked: identical to `21e5644:kettle/tests`), its `kettle/src` has 0 diff lines against `494748b`. So the trial's specs are run against integration dev **:5560** (`KETTLE_PORT=5560`; `playwright.config.ts` takes the port from `KETTLE_PORT` and has `reuseExistingServer: true`, so no server of its own is started).
**Binding bar** (`VB-DECISIONS-W3R2.md` §3): the two hidden-tab timer tests and the `press()` re-aim; *no assertion may be weakened; LEAD confirms; each test must pass 10/10 under load.*
**Evidence:** `contracts/W3R2/review/LEAD6/TS/` (my job script `lead6-ts-job.sh`, logs `*.log.txt`). Every browser run went through the slot gate, lane `LEAD6`.

## 1. Scope and the diff, read in full

`git -C /home/user/wt/w8q diff 494748b..21e5644`: two files, nothing else.

| File | Change | Read |
|---|---|---|
| `kettle/tests/timer.spec.ts` (+13/−5) | `background: the worker…` (`:156`): the observer, `startFocus`, the read of `endsAt`/`sessionId`, a 100 ms in-page wait and the freeze become one `page.evaluate`. `hidden page: completion…` (was `:183`, now `:189`): `setHidden(page, true)` moved before `start(…)`; two comments | in full, with the base test beside it (`/home/user/wt/w6-int/kettle/tests/timer.spec.ts`, = `494748b`) |
| `kettle/tests/notice-strip.spec.ts` (+33/−5) | new `inView()`; constants `AIM_AGAIN = 8`, `AIM_PAUSE_MS = 250`, `AIM_RESCROLL = 2`; `press()` gains a `rescrolled` parameter and a pause/re-read path inside the aim loop, with a bounded recursive `press()` when the target is out of view | in full, with `onTop()`, the wheel walk, the sheet fallbacks and every caller |

No `src/` file, no other spec, no config. The injection and diagnostic code lives only in git-ignored scratch copies (`.tmp/`), copied into the packet as `.txt`. I regenerated those copies myself with the maker's `scripts/mkinject.py` / `scripts/mkdiag.py` from the trial tree (into `/home/user/wt/w8tr-q/kettle/.tmp/lead6/ts/`): `old`, `new`, `mid` timer and `old`, `new`, `v1` notice copies are **byte-identical** to the packet's `scratch/*.txt`.

Helpers the changed tests depend on, unchanged by the diff: `open`, `settledLeader`, `info`, `state`, `start`, `secs`, `lateBudget` (400 ms harness / 1500 ms app), `storedSessions`, `setHidden` in the timer spec; `onTop` (wholly in the viewport, and the target at its centre, or at 9 of 9 points when strict), `GONE_MS`, the wheel walk, `park`, the sheet fallbacks and the frame recorder in the notice spec.
