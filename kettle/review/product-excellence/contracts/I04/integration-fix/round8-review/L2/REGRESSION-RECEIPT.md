# Round 8 review, Lane 2: regression receipt (R8 `9ff0d04`)

Checks and receipts only. **No verdict.** IN PROGRESS (written as I go).

- **Wall clock:** started 2026-10-11 18:07:24 UTC; budget to 19:22:24 UTC; ended: (pending).
- **Model:** Claude Opus 5.5 (`claude-opus-5-5`), newly launched; implemented nothing in rounds 7 or 8.
- **Revision under test:** R8 = trial merge `9ff0d04` (integration `61a60b2` + `pe/r8-toastroom@2c3172c`), `kettle/src` tree `42e106daaf0628ee8429fb6131ab29848931f367`. Worktree `/home/user/wt/r8-trial/kettle`, detached at `9ff0d04`, `git status` clean at start (only the untracked private `.tmp/`).
- **Comparison side:** INT `0d58c5e` (dev :5303, worktree `/home/user/wt/rv7-int/kettle`, clean).
- **Servers** (orchestrator-owned; not stopped): R8 dev :5306 (debug API), R8 preview :5326, INT dev :5303, INT preview :5323. All answered HTTP 200 at 18:08 UTC.
- **Gate:** every browser launch went through `slots.py run --lane L2`.
- **Machine load:** LEAD and Lane 1 ran browser jobs at the same time by design; load average 7.6 to 16.8 on 4 CPUs during my runs, so wall times are inflated.

## Summary table

| Check | Result |
|---|---|
| tsc | **exit 0** |
| vitest | **27/27 files, 267/267 tests passed, 0 skipped** |
| Playwright chromium, all specs (gate `--n 2`) | **73/74 passed, 1 failed, 0 skipped, 0 flaky** (retries 0) |
| Rerun of the failing test, alone (gate `--n 1`) | **1/1 passed** (both results stand; see 3) |
| timer-harness + timer-app + pwa (gate `--n 2`) | **29/31 passed, 2 skipped (by design), 0 failed** |
| Standard captures and diffs | see 5 and 6 |

## 1. tsc

- Command: `npx tsc --noEmit --pretty false` (cwd `/home/user/wt/r8-trial/kettle`, revision `9ff0d04`, no server).
- Ran 18:07:52 to 18:07:55 UTC, **wall 3 s**. **Exit 0**, no output. Log `logs/tsc.log`.

## 2. vitest

- Command: `npx vitest run` (cwd as above, revision `9ff0d04`, no server). vitest v5.0.2.
- Ran 18:08:01 UTC, **wall 11 s** (vitest duration 9.34 s). **Test files 27 passed (27); tests 267 passed (267); 0 skipped, 0 todo.** Exit 0. Log `logs/vitest.log`.

## 3. Playwright, chromium project, all specs

- Command (wrapper `tools/job-pw-chromium.sh`), from `/home/user/wt/r8-trial/kettle` at `9ff0d04`:
  `PLAYWRIGHT_JSON_OUTPUT_NAME=<scratch>/pw-chromium.json KETTLE_PORT=5306 KETTLE_PWA_PORT=5316 python3 -I …/round7-review/tools/slots.py run --lane L2 --n 2 -- npx playwright test --project=chromium --workers=2 --output <scratch>/pw-out-chromium --reporter=list,json`
- Server: R8 dev **:5306** (reused; `reuseExistingServer`). Gate: queued 18:07:52, slots taken 18:07:52, freed 18:23:07. **Wall 915 s (15.2 min).**
- **Result: 73 passed, 1 failed, 0 skipped, 0 flaky, of 74** (retries 0). By file: a11y 11/11, break-reach 7/7, integrity 25/25, statusbar 8/9, toast-room 14/14, whistle 8/8.
- **Failure:** `tests/statusbar.spec.ts:106` › `large text with large leaf totals never pushes "Level NN" past the screen (dark)`, failed after 7.5 s:
  `Error: page.evaluate: TypeError: Cannot read properties of null (reading 'children')` at `row (tests/statusbar.spec.ts:22:15)` called from `tests/statusbar.spec.ts:121:27`, i.e. `document.querySelector('nav[aria-label="Your progress"]')` returned null.
  - **Trace:** none. The spec sets `test.use({ trace: 'off' })` (line 17, so resizes are not slowed), so `retain-on-failure` writes no trace.zip. The only artifact is `error-context.md` (copied to `logs/chromium-fail-statusbar-106-dark.error-context.md`; original under `<scratch>/pw-out-chromium/statusbar-large-text-with--c6e57-el-NN-past-the-screen-dark--chromium/`). Its page snapshot shows the Main tab bar (Today, Stats, Nook, Settings) and an **empty `main`**: Today had not rendered its content, so the "Your progress" bar did not exist yet.
  - Which of the six (viewport × text size) contexts failed is not in the error. At 7.5 s it was an early one.
  - Fact for the lead: the test's readiness wait is `open()` in `tests/a11y-probes.mjs` (waits for `window.__kettle`, fonts, then a fixed 900 ms) plus `settle()`; it does not wait for Today's content. The spec file is unchanged by round 8 (not in the round-8 changed-file list).
- **Rerun, once, alone** (wrapper `tools/job-rerun.sh`): `KETTLE_PORT=5306 KETTLE_PWA_PORT=5316 python3 -I …/slots.py run --lane L2 --n 1 -- npx playwright test "tests/statusbar.spec.ts:106" -g "past the screen \(dark\)" --project=chromium --workers=1 --output <scratch>/pw-out-rerun --reporter=list`. Gate: queued 18:23:53, slot 18:25:08, freed 18:26:06, **wall 58 s**. **1 passed (54.5 s).** The light twin of the test passed in the full run.
- **Both results stand:** full run 73/74 with one failure; the rerun of the failing test alone 1/1.
- Logs: `logs/pw-chromium.log`, `logs/pw-chromium.json`, `logs/pw-rerun.log`.

## 4. Playwright, timer-harness + timer-app + pwa

- Command (wrapper `tools/job-pw-timer-pwa.sh`), from `/home/user/wt/r8-trial/kettle` at `9ff0d04`:
  `PLAYWRIGHT_JSON_OUTPUT_NAME=<scratch>/pw-timer-pwa.json KETTLE_PORT=5306 KETTLE_PWA_PORT=5316 python3 -I …/slots.py run --lane L2 --n 2 -- npx playwright test --project=timer-harness --project=timer-app --project=pwa --workers=2 --output <scratch>/pw-out-timer-pwa --reporter=list,json`
- Servers: R8 dev **:5306** for timer-harness/timer-app; the pwa spec builds the worktree into `test-results/pwa-dist` and runs its own `vite preview` on **:5316**. Gate: queued 18:09:37, slots taken 18:23:09, freed 18:25:08. **Wall 119 s.**
- **Result: 29 passed, 2 skipped, 0 failed, of 31**: timer-harness 14/14; timer-app 12 passed + 2 skipped; pwa 3/3.
- **Skips (both by design, `test.skip` in the spec, timer-app project only):**
  - `timer.spec.ts:294` Space toggles…: "infra is exercised in the harness; screens bind their own keys" (skip at line 295).
  - `timer.spec.ts:438` useRemaining re-renders about once per displayed second: "render counter lives in the harness" (skip at line 439).
- Logs: `logs/pw-timer-pwa.log`, `logs/pw-timer-pwa.json`.
