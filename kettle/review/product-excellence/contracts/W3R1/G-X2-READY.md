# W3R1 · X-2 · pressed-segment test de-flaked (test only): READY

- **Branch / worktree:** `pe/w3r1-x2-segment-test` · `/home/user/wt/w5g-x2`, cut from integration `4223062`. Local only, nothing pushed.
- **Commit:** `9fb1aca` (test) · `kettle/src` tree `c264faf` (unchanged from `4223062`). This note and the logs are in the next commit.
- **Server:** :5503 from this worktree (`verify.sh`: `PORT 5503 serves 9fb1aca (src c264faf): VERIFIED`).

## Diff (only `kettle/tests/w3-settings.spec.ts`, only "a pressed segment reads as pressed: unlike hover and unlike the selected one")

- The test no longer reads the colour after a fixed 250 ms (hover) or 120 ms (pressed). It waits until `.inner` has no running transition (`getAnimations().length === 0`, polled, 5 s) before reading hover.
- While the button is still held, it polls until the transition has ended **and** the colour differs from hover (5 s), then reads `pressed`.
- Both assertions (`pressed !== hover`, `pressed !== selectedThumb`) and the release-away check (`System` still checked) are unchanged. No source change.

## Results

All runs on :5503 used this worktree, with F's two jobs holding the other slots, so the machine was loaded.
- **`--repeat-each=8 --workers=2` (slot gate `--lane G --n 2`): 8 / 8 passed** in 27.3 s. Log: `G/x2/repeat8-workers2-5503.txt`.
- **`--repeat-each=8 --workers=1` (`--n 1`): 8 / 8 passed** in 59.3 s. I ran this one first, while two slots were not yet free. Log: `G/x2/repeat8-5503.txt`.
- **Base :5478, once: 1 failed, by design.** While the button is held, the pressed colour never differs from hover, so the poll reports `Expected: true / Received: false`. Log: `G/x2/base-5478.txt`.
- **The whole `w3-settings.spec.ts` on :5503: 10 / 10 passed** in 1.2 min. Log: `G/x2/full-spec-5503.txt`.
- `tsc --noEmit` is clean. Nothing else changed: `git diff 4223062 9fb1aca --stat` lists only `kettle/tests/w3-settings.spec.ts`.
