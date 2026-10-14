# RECEIPT · Lane I (interaction and visuals) · W3R1 Maker S (Stats and History, I12; F-T2-4; the backup test)

Raw evidence only. No verdict. LEAD-5 decides. Lane I implemented none of this work. A previous Lane I instance was cut by a usage limit; its two integrity logs are reused (§6).

- **Under review:** `pe/w3-stats@344069c` (code `8158134`, src `20a4698`). **Trial** `c7a6b8f` at `/home/user/wt/w5tr-s`; checked `git rev-parse HEAD:kettle/src` = `20a4698…`. Dev **:5522**, preview :5532.
- **Base:** `4d36939` (src `5cd9a44`), dev **:5478**, preview :5488. **Combined** (F+S+G+N) `e478604` (src `07c26ff`), dev **:5520**.
- **Method:** frozen clock `2026-10-12T07:40:00Z` (Monday) then `resume()`, unless a section states another time. Seed `veteran` unless stated. en-GB, UTC, DPR 1. Phones (w < 900): `hasTouch` + `isMobile`, real taps (`locator.tap`, `touchscreen.tap`); 1440: mouse. Real Tab / Shift+Tab / Enter / Escape. 200 % = `html{font-size:200%!important}` at DOMContentLoaded.
- Every browser run went through `slots.py run --lane LI --n 1` (the reused repeat run used `--n 2`), each with its own `--output`. I killed only PIDs of my own probes (two runs of `LI-sheets.mjs` that had a script bug; their logs are kept as `*-run1-*`).
- **Tools** (`tools/`, also in `/home/user/wt/w5tr-s/kettle/.tmp/LI/`): `LI-sheets.mjs` (F-T2-4 and every sheet), `LI-weekboundary.spec.ts` + `LI-pw.config.ts` (§3), `LI-truth.mjs` (§4), `LI-words.mjs` (§5), `LI-cap.mjs` (§7), runner `.sh` files.
- **Time:** 16:53 → see the end. Slots were shared with LR, LI2 and the lead throughout.

## 6. The backup round-trip test (`integrity.spec.ts:781`, was `:768`)

(Sections are appended in the order they finished; numbering follows the brief.)

**Runs reused** (same commit `c7a6b8f`, same frozen date; made by the previous Lane I instance; copied here with their runner `LI-integ.sh`):

| Run | Server | Result | Log |
|---|---|---|---|
| `integrity.spec.ts`, whole file, `--workers=1` | trial :5522, 13:33–13:39 UTC | **25 passed** (6.4 min) | `LI-integ-whole.log` |
| backup test `-g "export → reset (explicit confirmation) → import restores"`, `--repeat-each=5 --workers=2 --fully-parallel` (slot `--n 2`) | trial :5522, 14:37–14:39 UTC | **5 passed** (1.4 min; 20.7–26.7 s each) | `LI-integ-repeat.log` |

**Diff of `integrity.spec.ts`, base `4d36939` → trial `c7a6b8f`** (full: `LI-integrity-diff-base-trial.txt`): one hunk, only inside `profilePills` (+21 / −4 lines). `w3-stats.spec.ts` is the only other test file changed (new).

| Before (base) | After (trial) |
|---|---|
| `navigate('/settings')`; wait for the Settings h1 | same, plus: `expect.poll(hash) == '#/settings'`; `[data-route-leaving]` count 0 |
| read `document.body.innerText` (whole page, including a screen still leaving) | read `main` › region **"Profile"** only (`toHaveCount(1)`) |
| — | wait until that card contains `${stored} leaves`, `stored` = `__kettle.progress.getState().leaves` formatted with `Intl.NumberFormat()` |
| regexes `Level \d+`, `[\d,]+ leaves(?! to level)`, `\d+ days? warm` | the same three regexes |

- **No `expect` was removed** (`grep -c '^-.*expect'` on the diff = 0). The test's callers are unchanged: `pillsBefore.every(Boolean)` (l.791) and `expect(await profilePills(page)).toEqual(pillsBefore)` after the import (l.833), plus the `snapshot()` equality of stored data.
- What changed in strength: the read is narrower (the Profile card, not any text on the page). A wrong number elsewhere on Settings (e.g. the 1440 rail) is no longer read by this helper; it was only read before if it came first in `innerText`. The new wait on the stored total cannot turn a wrong restore into a pass: the pills read after the import are still compared to `pillsBefore`, taken before the export. If the card's number format ever differed from `Intl.NumberFormat()` the wait would time out (a false failure, not a false pass).
- I did not re-run the base control for the old flake (the maker's `S/control-768/leaving-base.json` claims "194 leaves" in 3 of 4 runs on base); unproven by me.

## 3. Vibei's §2: "Last 7 days" is rolling; warm days, Tea Cozy and badges keep their calendar logic

**Spec:** `tools/LI-weekboundary.spec.ts` (+ `tools/LI-pw.config.ts`), kept out of the repo's `tests/`. Run from `/home/user/wt/w5tr-s/kettle` with `-c .tmp/LI/LI-pw.config.ts`, slot `--n 1`, 17:18–17:19 UTC. **3 passed** (`LI-week.log`). A first run failed 3/3 on my own assertion: it compared the stored badges' `unlockedAt` wall-clock times, which differ by milliseconds between two runs; the rerun compares tiers (`LI-week-run1-unlockedAt.log`).

**How:** each test opens BASE :5478 and TRIAL :5522 in turn, 1440×900, UTC, `seed=blank`, and records one history through the real engine (`__kettle.progress.getState().recordSession(r)`, in time order). It then reads, on each build:
- the engine's values from that build's own source (`import('/src/progress/streak.ts')`, `badgeEngine.ts`): current run, best run, Tea Cozies held, the days the Cozy covered, the days earned, every day's state, the `weekend-warmth` metric;
- the stored badge tiers (`progress.getState().badges`) and every badge button's `aria-label`;
- every warm-days calendar cell's `aria-label`;
- the text of Overview, the "Last 7 days" chart card and (trial) the new summary.

**History:** warm Mon 28 Sep – Sun 4 Oct (7 days → a Cozy), **Mon 5 Oct missed** (the Cozy covers it), warm Tue 6 – Sun 11. Day *n* has 20+*n* minutes, so no two days match. Case A adds Monday 12 Oct: a brew from **Sun 23:50 to Mon 00:15** and one at 06:30 (17 min).

| Case | Clock, locale (week starts) | Brews either side of the week change | Engine, base = trial | Stored badge tiers, badge labels, 37 calendar labels | Summary "Last 7 days" (trial) | Calendar-week sum | Chart card (base and trial) |
|---|---|---|---|---|---|---|---|
| A | Mon 12 Oct 12:00, en-GB (Mon) | Sun 11 (26 min) / Mon 12 (25 + 17) | current 14, best 14, Cozies 1, earned on 4 Oct and 12 Oct, 5 Oct = `cozy`, weekend-warmth 4 | identical (e.g. "Warm Days, tier 3 of 5. 14 of 30 toward the next tier.") | **"Last 7 days 6 Oct–12 3h 39m focused"**; Today **42 min** (the 23:50 brew counts on Monday, the day it ended) | 42 min | "Last 7 days 6 Oct–12 3h 39m" on both |
| B | Sun 11 Oct 20:00, en-US (Sun) | Sat 10 / Sun 11 | current 13, best 13, Cozies 0, 5 Oct = `cozy`, weekend-warmth 4 | identical | **"Last 7 days Oct 5–11 2h 57m focused"** | 32 min | "Last 7 days Oct 5–11 2h 57m" on both |
| C (control) | Sun 11 Oct 20:00, en-GB (Mon) | (window = calendar week) | as B | identical | "Last 7 days 5 Oct–11 2h 57m focused" | 2h 57m (equal, as expected) | same on both |

- The summary's label is exactly **"Last 7 days"** (asserted `/(^|\s)Last 7 days\s/`; no "This week"). Its section heading (sr-only) is "Today and the last 7 days".
- The summary total equals the rolling sum computed in the test from the records, and differs from the calendar-week sum in A and B.
- **The base chart card was already rolling, with the same label "Last 7 days".** S's summary reuses that series; base and trial cards show the same values.
- Overview tiles show the same numbers on both builds; only the words changed ("14 Day streak 14 Best streak" → "14 Days warm 14 days Warmest run").
- Code check: `git diff 4d36939 c7a6b8f -- kettle/src/progress/` touches only `dst.test.ts`. `streak.ts`, `badgeEngine.ts`, `badges.ts`, `insights.ts` and `engine.ts` are byte-identical to base.
- Evidence: `weekboundary/<case>.json` (both builds' full readings), `weekboundary/<case>-{base,trial}.png` (full page, 1440).

