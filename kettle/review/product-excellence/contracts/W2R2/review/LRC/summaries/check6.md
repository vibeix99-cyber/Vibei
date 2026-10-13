Command: `KETTLE_PORT=5460 npx playwright test --project=chromium --workers=2 --output=/tmp/claude-0/lrc-scratch/out-full` (gate `--n 2`), START 2026-10-13T19:19:33Z load=3.36 4.16 5.34, EXIT 1 2026-10-13T19:37:02Z. Machine load was 3 to 14 (check 2 run 2, the unlock-ready supplement and this suite overlapped until about 19:33).

**Result: 106 passed, 1 failed, 7 did not run, 114 total** (Playwright: `1 failed`, `7 did not run`, `106 passed (17.5m)`, exit 1). Log: `runs/check6-full-chromium.txt`.

| spec file | passed | failed | not run (listed) |
|---|---|---|---|
| `a11y.spec.ts` | 3 | 1 | 7 |
| `break-reach.spec.ts` | 7 | 0 | 0 |
| `chai3d.spec.ts` | 9 | 0 | 0 |
| `integrity.spec.ts` | 25 | 0 | 0 |
| `statusbar.spec.ts` | 9 | 0 | 0 |
| `toast-room.spec.ts` | 14 | 0 | 0 |
| `w2-firstvisit.spec.ts` | 6 | 0 | 0 |
| `w2-room.spec.ts` | 7 | 0 | 0 |
| `w2-summary.spec.ts` | 18 | 0 | 0 |
| `whistle.spec.ts` | 8 | 0 | 0 |

The one failure: `tests/a11y.spec.ts:109` "short screen (375×667): every control can be scrolled clear of sticky chrome, no sideways scroll", 51.8 s, between about 19:22 and 19:25, while three of my browser jobs were running (load average 11 to 14). The assertion `expect(out).toEqual([])` received 16 entries, all on the settings page, of the form `settings: "Trailing pothos" stays under h2._groupTitle_...` (the list: Time of day, Window, Trailing pothos, Stack of books, Floor cushion, Fairy lights, Wall shelf, Tea set, Record player, Knitted blanket, Mountain painting, Paper lantern, and four "Locked. Unlocks at cozy level 14/16/18/20" rows). The 7 "did not run" are the remaining tests of `a11y.spec.ts` that follow it in the file (the file runs serially). Trace: `/tmp/claude-0/lrc-scratch/out-full/a11y-short-screen-.../trace.zip`.

Rerun alone (the whole `a11y.spec.ts`, 11 tests, one worker, nothing else of mine running except the other side of this pair):

| Where | Command | Start | End | Result | 109 (the failed case) | Log |
|---|---|---|---|---|---|---|
| trial `:5460` | `KETTLE_PORT=5460 npx playwright test tests/a11y.spec.ts --project=chromium --workers=1` | 2026-10-13T19:37:13Z | 2026-10-13T19:46:03Z | 11 passed (8.8m) | ✓   46.7s | `runs/rerun-a11y-trial-5460.txt` |
| control `:5410` | `KETTLE_PORT=5410 npx playwright test tests/a11y.spec.ts --project=chromium --workers=1` | 2026-10-13T19:37:13Z | 2026-10-13T19:46:03Z | 11 passed (8.8m) | ✓   45.0s | `runs/rerun-a11y-control-5410.txt` |
