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

## 2a. Every `ui/Sheet.*` use, and `w3-stats.spec.ts:98` on trial and combined

**Uses of `Sheet` / `Dialog` in `src/` (trial; `grep -rn "<Sheet\b\|<Dialog\b"`, excluding `ui/Gallery.tsx`, the dev-only `#/kit` gallery):**

| # | File:line | Sheet (title) | Probe id (§2b) |
|---|---|---|---|
| 1 | `screens/home/StatusBar.tsx:56` | Today › warm-days pill sheet | `today-warm` |
| 2 | `screens/home/StatusBar.tsx:107` | Today › leaves pill sheet | `today-leaves` |
| 3 | `screens/home/StatusBar.tsx:141` | Today › level pill sheet | `today-level` |
| 4 | `screens/home/Composer.tsx:320` | Today › "Your own rhythm" (Custom brew length) | `today-rhythm` |
| 5 | `app/ShellOverlays.tsx:40` | "Keyboard shortcuts" (`?`) | `shortcuts` |
| 6 | `screens/settings/DataSection.tsx:228` | Settings › "Start fresh?" | `settings-reset` |
| 7 | `screens/settings/DataSection.tsx:145` | Settings › import: "Restore / Replace with / Add this backup?" | `settings-import` |
| 8 | `screens/stats/Badges.tsx:118` | Stats › badge sheet | `stats-badge` |
| 9 | `screens/stats/History.tsx:161` | Stats › History › "Edit brew" | `stats-edit` |
| 10 | `screens/stats/History.tsx:221` (`Dialog`) | "Delete this brew?" **over** "Edit brew" (the sheet over a sheet) | `stats-delete-over-edit` |
| 11 | `screens/focus/parts/AmbienceSheet.tsx:25` | Session › Ambience | `focus-ambience` |
| 12 | `screens/focus/parts/EndSheet.tsx:21` | Session › End (< 1 min) | `focus-end` |

- **Welcome's "I have a backup"** (`screens/welcome/WelcomeScreen.tsx:96`) opens the file picker and restores directly with a toast; it uses no Sheet, so there is nothing of S's to check there.
- `ui/Gallery.tsx:647, 664, 687` render Sheet/Dialog only on the dev `#/kit` route; not probed.

**`tests/w3-stats.spec.ts:98`** ("both choices can be tapped, and Tab reaches them in a loop"; the line covers 5 describe blocks). Each run used its own worktree's spec (byte-identical in both), `--workers=1`, slot `--n 1`:

| Build | When (UTC) | Result | Log |
|---|---|---|---|
| Trial :5522 (`/home/user/wt/w5tr-s`) | 16:53–16:54 | **5 passed**; 390×844 @200 in 9.0 s | `spec98/LI-s98-trial.log` |
| Combined :5520 (`/home/user/wt/w5tr-all`) | 16:54–16:55 | **5 passed**; 390×844 @200 in 8.6 s | `spec98/LI-s98-comb.log` |
| (Lane R's own rerun of `full-C` on :5520, read from `/home/user/wt/w5tr-all/kettle/.tmp/LR-pw/full-C.json`) | 17:25–17:32 | all five `:98` cases passed (that run had 1 unrelated failure) | — |

**Lane R's failure** (first `full-C` run, kept by Lane R in `LR-pw/full-C-cut/…`; copied: `spec98/LR-full-C-cut-390x844-200-error-context.md`). From its `trace.zip` (I read it; I did not re-run it):
- It failed at `openDelete` (spec l.71), **before the dialog existed**: the tap on the first History row (`[data-session-row] button`, "Read brew, 1:20 PM, 25 minutes…") reported "tap action done", but "Edit brew" never opened (10 s timeout).
- The trace's DOM snapshots show the **layout viewport at 408×883 at the tap** (`before@`/`input@call@1144`), and 390×844 just after (`after@call@1144`). The tap point was (195, 409.09).
- So, under `isMobile`, the page was wider than the screen at that moment: Chrome zoomed it out to 390/408, and the tap landed on page coordinates the row no longer had.
- The screencast frame just before the input (`spec98/LR-trace-frame-277207ms-just-before-tap.jpeg`) shows the top of Stats, with the tile "23 da…" cut at the right. The frame after (`…277918ms-after.jpeg`) shows History, with the nav label "Setting" cut.

**Transient width, measured** (`tools/LI-overflow.mjs`, 390×844 @200, `isMobile`, veteran, en-US as the spec; `scrollWidth/innerWidth/visualViewport.width/scale` sampled every 100 ms for 4 s; 3 fresh contexts per build, 17:36 UTC; `overflow/*.json`):

| Build | Run 1 (first context, cold) | Runs 2–3 |
|---|---|---|
| Combined :5520 | **408/408/390/1** for part of the 4 s, then 390 | 390 throughout |
| Trial :5522 | **408/408/390/1** for part of the 4 s, then 390 | 390 throughout |
| Base :5478 | 390 throughout | 390 throughout |

- Run 1 on combined and trial gives the same 408 px width as Lane R's trace. The cause of Lane R's failure is therefore present on S's trial alone; it is not specific to the combined build.
- I did not see it on base in 3 runs.
- After the page settles, the elements past the edge are the same on all three builds: a decorative `SPAN._sheen` (r = 450) and the chart's sr-only data table (r = 1055). Neither widens the settled page.
- **Which element widens the page during load is unproven** at this point. A throttled probe was queued (`tools/LI-overflow2.mjs`); see §2b.
- The non-`isMobile` captures (§7) show base already wider than the screen at 390×844 @200 veteran (`scrollWidth` 405, a chart tooltip `SPAN._tip`). That width is pre-existing.

## 4. Stats truth: shown vs recomputed (seeds veteran, celebrate, newbie)

**Tool:** `tools/LI-truth.mjs`, 17:3x UTC, trial :5522 and base :5478; 1440×900, en-GB (weeks start Monday), UTC; frozen Mon 12 Oct 07:40 then real time. The page's numbers are read from the DOM: the summary region, Overview, the "Last 7 days" card and each bar's `aria-label`, Personal bests, and every visible History day group (its `aria-label`, header and total, and each row's `aria-label`).

The script recomputes every number itself from `__kettle.progress.getState().sessions`, using none of the app's functions:
- A brew counts on its `day`. Separately, every `day` is checked against the local day of `endedAt`.
- Minutes are whole minutes, rounded down per day.
- "Goal met" comes from the ledger's `goal` entries (the engine's own record), with the goal from settings.
- Warm runs are replayed from the rules written in `streak.ts`'s header comment.
- The best week uses weeks that start on Monday.

Raw output: `truth/LI-truth-{trial,base}.log`, `truth/{trial,base}-truth.json`, full pages `truth/<build>-<seed>-1440.png`.

My first trial run had two bugs in my own recompute, not in the app; that run is kept as `truth/LI-truth-trial-run1-recompute-bugs.log`:
- I compared "Sat 10 Oct" with the header "Sat, 10 Oct" (punctuation only).
- I took the card's "a day on average" divisor as days since the first brew. The app divides by the window's non-future days (`WeekCard.tsx:29`, `elapsed = bars.filter((b) => !b.future).length`), so newbie shows "13 min a day on average" = 89/7.

Both were fixed and both builds re-run. **Final run: every TRIAL row matches** (`grep -c ^XX LI-truth-trial.log` = 0). The BASE rows differ only where the summary does not exist, or where a tile has the same number under its old words.

**veteran**

| Number | Recomputed from `sessions` (+ ledger for goal days) | TRIAL shows | BASE shows |
|---|---|---|---|
| Today: focused | 50 min focused | = 50 min focused | (no summary) |
| Today: full brews | 2 full brews | = 2 full brews | (no summary) |
| Today: goal line | 50 min of your 1h goal | = 50 min of your 1h goal | (no summary) |
| Last 7 days (summary): focused | 4h 35m focused | = 4h 35m focused | (no summary) |
| Last 7 days (summary): days brewed | Brewed on 7 of 7 days | = Brewed on 7 of 7 days | (no summary) |
| Last 7 days (summary): days at goal | 1 day at goal | = 1 day at goal | (no summary) |
| Last 7 days (chart card): focused | 4h 35m | = 4h 35m | = 4h 35m |
| Last 7 days (chart card): at goal | 1 of 7 days at goal | = 1 of 7 days at goal | = 1 of 7 days at goal |
| Last 7 days (chart card): a day on average | 39 min a day on average | = 39 min a day on average | = 39 min a day on average |
| Chart bar 2026-10-06 | 50 min, 2 full brews | = 50 min, 2 full brews | = 50 min, 2 full brews |
| Chart bar 2026-10-07 | 25 min, 1 full brew | = 25 min, 1 full brew | = 25 min, 1 full brew |
| Chart bar 2026-10-08 | 25 min, 1 full brew | = 25 min, 1 full brew | = 25 min, 1 full brew |
| Chart bar 2026-10-09 | 1h 15m, 2 full brews | = 1h 15m, 2 full brews | = 1h 15m, 2 full brews |
| Chart bar 2026-10-10 | 25 min, 1 full brew | = 25 min, 1 full brew | = 25 min, 1 full brew |
| Chart bar 2026-10-11 | 25 min, 1 full brew | = 25 min, 1 full brew | = 25 min, 1 full brew |
| Chart bar 2026-10-12 | 50 min, 2 full brews | = 50 min, 2 full brews | = 50 min, 2 full brews |
| Tile: Days warm | 23 Days warm | = 23 Days warm | same number, old words (23 Day streak 23 Best streak 23h 9m Total focus 50 Full b…) |
| Tile: Warmest run | 23 days | = 23 days | same number, old words (23 Day streak 23 Best streak 23h 9m Total focus 50 Full b…) |
| Tile: Total focus | 23h 9m Total focus | = 23h 9m Total focus | = 23h 9m Total focus |
| Tile: Full brews | 50 Full brews | = 50 Full brews | = 50 Full brews |
| Best day | 2h 55m | = 2h 55m | = 2h 55m |
| Best week | 6h 16m | = 6h 16m | = 6h 16m |
| Longest brew | 50 min | = 50 min | = 50 min |
| Brews in a day | 6 Brews in a day | = 6 Brews in a day | = 6 Brews in a day |
| History "Today" total | 50 min | = 50 min | = 50 min |
| History "Yesterday" total | 25 min | = 25 min | = 25 min |
| History "Sat, 10 Oct" total | 25 min | = 25 min | = 25 min |
| History "Fri, 9 Oct" total | 1h 15m | = 1h 15m | = 1h 15m |
| History "Thu, 8 Oct" total | 25 min | = 25 min | = 25 min |
| History "Wed, 7 Oct" total | 25 min | = 25 min | = 25 min |
| History "Tue, 6 Oct" total | 50 min | = 50 min | = 50 min |
| History rows: in the group of their own day, with whole minutes | 10 rows | = 10 rows | = 10 rows |
| Brews whose day ≠ local day of their end | 0 | = 0 | = 0 |

(Σ of per-day whole minutes vs whole minutes of the Σ over the last 7 days: 275 vs 275.)

**celebrate**

| Number | Recomputed from `sessions` (+ ledger for goal days) | TRIAL shows | BASE shows |
|---|---|---|---|
| Today: focused | 12 min focused | = 12 min focused | (no summary) |
| Today: full brews | 0 full brews | = 0 full brews | (no summary) |
| Today: goal line | 12 min of your 30 min goal | = 12 min of your 30 min goal | (no summary) |
| Last 7 days (summary): focused | 3h 32m focused | = 3h 32m focused | (no summary) |
| Last 7 days (summary): days brewed | Brewed on 7 of 7 days | = Brewed on 7 of 7 days | (no summary) |
| Last 7 days (summary): days at goal | 2 days at goal | = 2 days at goal | (no summary) |
| Last 7 days (chart card): focused | 3h 32m | = 3h 32m | = 3h 32m |
| Last 7 days (chart card): at goal | 2 of 7 days at goal | = 2 of 7 days at goal | = 2 of 7 days at goal |
| Last 7 days (chart card): a day on average | 30 min a day on average | = 30 min a day on average | = 30 min a day on average |
| Chart bar 2026-10-06 | 50 min, 2 full brews | = 50 min, 2 full brews | = 50 min, 2 full brews |
| Chart bar 2026-10-07 | 25 min, 1 full brew | = 25 min, 1 full brew | = 25 min, 1 full brew |
| Chart bar 2026-10-08 | 25 min, 1 full brew | = 25 min, 1 full brew | = 25 min, 1 full brew |
| Chart bar 2026-10-09 | 50 min, 2 full brews | = 50 min, 2 full brews | = 50 min, 2 full brews |
| Chart bar 2026-10-10 | 25 min, 1 full brew | = 25 min, 1 full brew | = 25 min, 1 full brew |
| Chart bar 2026-10-11 | 25 min, 1 full brew | = 25 min, 1 full brew | = 25 min, 1 full brew |
| Chart bar 2026-10-12 | 12 min, 0 full brews | = 12 min, 0 full brews | = 12 min, 0 full brews |
| Tile: Days warm | 6 Days warm | = 6 Days warm | same number, old words (6 Day streak 6 Best streak 4h 22m Total focus 10 Full bre…) |
| Tile: Warmest run | 6 days | = 6 days | same number, old words (6 Day streak 6 Best streak 4h 22m Total focus 10 Full bre…) |
| Tile: Total focus | 4h 22m Total focus | = 4h 22m Total focus | = 4h 22m Total focus |
| Tile: Full brews | 10 Full brews | = 10 Full brews | = 10 Full brews |
| Best day | 50 min | = 50 min | = 50 min |
| Best week | 3h 20m | = 3h 20m | = 3h 20m |
| Longest brew | 25 min | = 25 min | = 25 min |
| Brews in a day | 2 Brews in a day | = 2 Brews in a day | = 2 Brews in a day |
| History "Today" total | 12 min | = 12 min | = 12 min |
| History "Yesterday" total | 25 min | = 25 min | = 25 min |
| History "Sat, 10 Oct" total | 25 min | = 25 min | = 25 min |
| History "Fri, 9 Oct" total | 50 min | = 50 min | = 50 min |
| History "Thu, 8 Oct" total | 25 min | = 25 min | = 25 min |
| History "Wed, 7 Oct" total | 25 min | = 25 min | = 25 min |
| History "Tue, 6 Oct" total | 50 min | = 50 min | = 50 min |
| History rows: in the group of their own day, with whole minutes | 9 rows | = 9 rows | = 9 rows |
| Brews whose day ≠ local day of their end | 0 | = 0 | = 0 |

(Σ of per-day whole minutes vs whole minutes of the Σ over the last 7 days: 212 vs 212.)

**newbie**

| Number | Recomputed from `sessions` (+ ledger for goal days) | TRIAL shows | BASE shows |
|---|---|---|---|
| Today: focused | 25 min focused | = 25 min focused | (no summary) |
| Today: full brews | 1 full brew | = 1 full brew | (no summary) |
| Today: goal line | 25 min of your 30 min goal | = 25 min of your 30 min goal | (no summary) |
| Last 7 days (summary): focused | 1h 29m focused | = 1h 29m focused | (no summary) |
| Last 7 days (summary): days brewed | Brewed on 3 of 7 days | = Brewed on 3 of 7 days | (no summary) |
| Last 7 days (summary): days at goal | 1 day at goal | = 1 day at goal | (no summary) |
| Last 7 days (chart card): focused | 1h 29m | = 1h 29m | = 1h 29m |
| Last 7 days (chart card): at goal | 1 of 7 days at goal | = 1 of 7 days at goal | = 1 of 7 days at goal |
| Last 7 days (chart card): a day on average | 13 min a day on average | = 13 min a day on average | = 13 min a day on average |
| Chart bar 2026-10-06 | 0 min, 0 full brews | = 0 min, 0 full brews | = 0 min, 0 full brews |
| Chart bar 2026-10-07 | 0 min, 0 full brews | = 0 min, 0 full brews | = 0 min, 0 full brews |
| Chart bar 2026-10-08 | 0 min, 0 full brews | = 0 min, 0 full brews | = 0 min, 0 full brews |
| Chart bar 2026-10-09 | 0 min, 0 full brews | = 0 min, 0 full brews | = 0 min, 0 full brews |
| Chart bar 2026-10-10 | 25 min, 1 full brew | = 25 min, 1 full brew | = 25 min, 1 full brew |
| Chart bar 2026-10-11 | 39 min, 1 full brew | = 39 min, 1 full brew | = 39 min, 1 full brew |
| Chart bar 2026-10-12 | 25 min, 1 full brew | = 25 min, 1 full brew | = 25 min, 1 full brew |
| Tile: Days warm | 3 Days warm | = 3 Days warm | same number, old words (3 Day streak 3 Best streak 1h 29m Total focus 3 Full brew…) |
| Tile: Warmest run | 3 days | = 3 days | same number, old words (3 Day streak 3 Best streak 1h 29m Total focus 3 Full brew…) |
| Tile: Total focus | 1h 29m Total focus | = 1h 29m Total focus | = 1h 29m Total focus |
| Tile: Full brews | 3 Full brews | = 3 Full brews | = 3 Full brews |
| Best day | 39 min | = 39 min | = 39 min |
| Best week | 1h 4m | = 1h 4m | = 1h 4m |
| Longest brew | 25 min | = 25 min | = 25 min |
| Brews in a day | 1 Brews in a day | = 1 Brews in a day | = 1 Brews in a day |
| History "Today" total | 25 min | = 25 min | = 25 min |
| History "Yesterday" total | 39 min | = 39 min | = 39 min |
| History "Sat, 10 Oct" total | 25 min | = 25 min | = 25 min |
| History rows: in the group of their own day, with whole minutes | 4 rows | = 4 rows | = 4 rows |
| Brews whose day ≠ local day of their end | 0 | = 0 | = 0 |

(Σ of per-day whole minutes vs whole minutes of the Σ over the last 7 days: 89 vs 89.)

**Late completions and day attribution (where documented):**
- `src/progress/types.ts:18-19`: `SessionRecord.day` is the "Local day the session ended on."
- `docs/areas/timer.md:13`: "A phase that ended while closed completes at its **real** end (`record.endedAt = endsAt`, `day` = local day it ended)". `:28`: a frozen tab "completes once, at its **real** end".
- `src/progress/dst.test.ts:53`: "A brew starting 11:50 pm ends after midnight → next day". `:71` (S's new case): "the last 7 days across fall-back are 7 calendar days, and a brew past midnight counts on the day it ended".
- `docs/areas/progress.md:16`: "DST-safe (calendar stepping, never +24h)". `:56`: "Calendar week on a Monday was an empty chart → rolling 'Last 7 days'".
- **Shown live by me:** in §3 case A, the brew from Sun 23:50 to Mon 00:15 is under History "Today" (Monday) with the row label **"23:50 · 25 min"**, and in the summary's "Today 42 min" (`weekboundary/A-mon-enGB-trial.png`). So a Monday row reads 23:50, the start time of a brew that ended Monday. This follows the policy and is the same on base.
- In all three seeds, 0 brews have a `day` different from the local day of their end. The seeds have no after-midnight, ended-late or DST brews, so for those cases I rely on the §3 case-A brew plus the cited unit tests. **"Ended late" (app closed past the end) and DST were not exercised in a browser by me.**

**Minutes round down:**
- Engine: `src/progress/engine.ts:150-151` (`beforeMin`/`afterMin = Math.floor(...)`, the daily goal) and `:155` (`add('focus', Math.floor(r.focusedMs / MIN), …)`, leaves). `insights.ts:95` `weekSeries` uses `Math.floor(t.focusMs / MIN)`.
- Stats on trial: `format.ts` `hm`/`hmLong` use `Math.floor` (base: **`Math.round`**, `git show 4d36939:kettle/src/screens/stats/format.ts` l.8 and l.18). The summary (`Glance.tsx:33`) and the calendar cells (`StreakCard.tsx:131`) also floor.
- Two places still round, both outside S's change:
  - `WeekCard.tsx:60` "a day on average": `Math.round(total / elapsed)`. An average, unchanged from base.
  - **The session summary** `src/screens/done/summary.ts:65`: `Math.max(1, Math.round(r.record.focusedMs / 60_000))`, and `:72` `Math.round(g.afterMin)`. That file is F's, outside S's ownership.
- The seeds use whole minutes, so the seeded numbers are the same either way. I did not run a non-whole-minute brew in a browser. The maker's spec `w3-stats.spec.ts` "12:40" covers that case and passed in Lane R's 17:25 rerun (`full-C.json`: "a brew ended early at 12:40 counts 12 minutes in History…" passed).
- On the seeds, the sum of per-day floors equals the floor of the sum over 7 days (275/275, 212/212, 89/89). With non-whole minutes they could differ by up to 6 min between the summary/chart (per-day floors) and a single floor of the sum. No Stats number shows a single floor over 7 days; Total focus floors the all-time sum.

**Nothing invented:**
- Every number in the summary is also either computed from the records above or present elsewhere on base: the chart card's total and goal days, and History's day totals.
- The summary's only new count is "Brewed on N of 7 days" = days in the window with any focus record (`Glance.tsx:37`, `byDay.has`). That includes days with only ended-early brews; I recomputed it the same way and it matches.
- No text claims quality, skill or wellbeing (texts in `truth/*-truth.json` › `raw`).

## 5. Warm-days wording and I13 in S's files; when the Tea Cozy line shows

**Code (trial):** `grep -in streak` over `src/screens/stats/*.tsx`, `ui/Sheet.tsx` and `ui/Stat.tsx` finds only identifiers, prop names and class names: `useStreak`, `StreakMug`, `StreakCard`, `streak.current`, `s.compactStreak`, the badge id `'warm-streak'`. No visible string, sr text, `title` or `aria-*` value contains it.

**Rendered (`tools/LI-words.mjs`, 1440×900, en-GB, UTC; trial 17:46–17:49, base 17:4x).** For each case the probe scanned `main`'s `textContent`, which includes sr-only text and the calendar caption, plus every `aria-label`, `title`, `aria-description`, `alt`, `aria-valuetext` and `placeholder`. It did the same for "Edit brew", "Delete this brew?" and the Warm Days badge sheet. Raw: `words/LI-words-{trial,base}.log`, `words/*-words.json`, full pages `words/<build>-<case>-<time>.png`.

| Case (seed, clock) | BASE: "streak" hits in Stats `main` | TRIAL: in `main` | TRIAL: Edit brew / Delete dialog | Warm Days badge sheet (both builds) |
|---|---|---|---|---|
| fresh 07:40 | 2 ("Your streak, charts and badges…", "Day streak", "Best streak") | **0** | — / — | "Keep a 3-day warm streak" |
| newbie, veteran, celebrate 07:40 | 2 each ("Day streak", "Best streak", sr "Warm streak calendar for October 2026") | **0** | **0 / 0** (base: "…history, stats and streak") | "Keep a 7- / 30- / 7-day warm streak" |
| atRisk (seed pins 19:40) | 2 ("Day streak", "Brew tonight", "Best streak", sr caption) | **0** | 0 / 0 | "Keep a 7-day warm streak" |
| veteran at 19:10 | 2 | **0** | 0 / 0 | as above |
| run broken (custom: warm 1–9 Oct, Cozy used 10 Oct, 11 Oct missed) | 3 (adds "Start a new streak") | **0** | 0 / 0 | "Keep a 14-day warm streak" |

- **The badge sheet's description "Keep a N-day warm streak"** comes from `src/progress/badges.ts`, F's file. S did not change it, and it is listed as a cross-owner item in S's packet. It is still on screen at S's trial; I did not check what the combined build shows.
- **Warm-days card lines on trial** (read from the page):
  - newbie / veteran (today brewed): "N days warm · You kept the kettle warm N days in a row."
  - celebrate / atRisk (today not yet brewed): "N days warm · One brew today makes it N+1 warm days in a row."
  - run broken: "Ready for a warm day · One brew today warms the kettle again. Your warmest run: 9 days."
  - Tile hint at risk: "One brew warms today".
  - None has a threat, countdown, "lose", "break" or "don't miss".
- **The Tea Cozy sentence** ("If today stays quiet, a Tea Cozy keeps the kettle warm.") is shown by `StreakCard.tsx:52-54` only when the run is alive, today is not yet warm, `streak.atRisk` holds (`store.ts`: `current > 0 && !todayDone && hour >= 18`) and `cozies > 0`.
  - That claim is true by `streak.ts`: a missed day while a run is alive and a Cozy is held consumes the Cozy and keeps the run.
  - In every seeded case above the sentence is **absent**. Each case misses one condition: atRisk has 0 Cozies; veteran 19:10 has brewed today.
  - My custom "Cozy held, nothing today, 19:10" case was **invalid in this run**: seed `blank` pins the app clock to 15:30 (`progress/seed.ts:279`), so the app never reached 19:10 (no at-risk hint either). It was re-run with seed `fresh`, which pins nothing: see **§5b**.
- **The always-visible Cozy row** ("N Tea Cozies ready · Fully stocked / Next in N warm days · each covers one missed day", or "No Tea Cozies yet · Earn one in N warm days…") is unchanged from base (`StreakCard.tsx` l.81-88, not in S's diff). It shows in every populated state, not only when a Cozy is relevant.
- My first trial run read the wrong card for the line; that log is kept as `words/LI-words-trial-run1-wrongcard.log`. The "streak" scan in it was valid.

## 7. REFERENCE (K07) → BEFORE → AFTER, full size

- **REFERENCE:** `reference/K07-live-stats-empty.jpg`. Empty Stats: Chai, "Nothing brewed yet.", the explanation, "Put the kettle on", then the four tiles and Badges.
- **Stats pages** (`tools/LI-cap.mjs`, BEFORE base :5478 17:20–17:22 UTC, AFTER trial :5522 17:4x–17:52):
  - Each is a full-page PNG at DPR 1, not `isMobile` (no stitching): `captures/BEFORE-base-4d36939/<w>x<h>-<theme>-<100|200>-<empty|veteran>.png` and the same names under `captures/AFTER-trial-c7a6b8f/`.
  - That is 16 configurations × 2 states × 2 builds = 64 PNGs. "veteran" is the populated page: the top summary, every card and History.
  - Frozen Mon 12 Oct 07:40 then real time, en-GB, UTC, `reducedMotion: reduce`. `meta.json` in each folder lists `scrollWidth`, page height and the elements past the right edge.
- **Side by side** (BEFORE left, AFTER right, magenta = no content): `tools/LI-pair.mjs <before> <after> <prefix> [slice]` builds them from the two folders. I did not commit the pairs, to stay under the size cap.
- **Artefact:** the bottom tab bar of phones is `position: fixed`, so full-page shots paint it once, about one viewport down, over the content (same on both builds).

| Config | Empty: page height B → A | Empty: scrollWidth B / A | Veteran: page height B → A | Veteran: scrollWidth B / A (viewport) |
|---|---|---|---|---|
| 390x844-light-100 | 1752 → 1770 | 375 / 375 | 4177 → 4386 (+209) | 375 / 375 (390) |
| 390x844-light-200 | 3068 → 3068 | 375 / 375 | 7922 → 8455 (+533) | 405 / 405 (390) |
| 390x844-dark-100 | 1752 → 1770 | 375 / 375 | 4177 → 4386 (+209) | 375 / 375 (390) |
| 390x844-dark-200 | 3068 → 3068 | 375 / 375 | 7922 → 8455 (+533) | 405 / 405 (390) |
| 375x667-light-100 | 1867 → 1867 | 360 / 360 | 4604 → 4920 (+316) | 360 / 360 (375) |
| 375x667-light-200 | 3300 → 3300 | 360 / 360 | 8491 → 9108 (+617) | 390 / 390 (375) |
| 375x667-dark-100 | 1867 → 1867 | 360 / 360 | 4604 → 4920 (+316) | 360 / 360 (375) |
| 375x667-dark-200 | 3300 → 3300 | 360 / 360 | 8491 → 9108 (+617) | 390 / 390 (375) |
| 844x390-light-100 | 1235 → 1235 | 829 / 829 | 2481 → 2659 (+178) | 829 / 829 (844) |
| 844x390-light-200 | 1892 → 1892 | 829 / 829 | 4678 → 4964 (+286) | 829 / 829 (844) |
| 844x390-dark-100 | 1235 → 1235 | 829 / 829 | 2481 → 2659 (+178) | 829 / 829 (844) |
| 844x390-dark-200 | 1892 → 1892 | 829 / 829 | 4678 → 4964 (+286) | 829 / 829 (844) |
| 1440x900-light-100 | 1242 → 1242 | 1425 / 1425 | 2913 → 3091 (+178) | 1425 / 1425 (1440) |
| 1440x900-light-200 | 1743 → 1743 | 1425 / 1425 | 4518 → 4804 (+286) | 1425 / 1425 (1440) |
| 1440x900-dark-100 | 1242 → 1242 | 1425 / 1425 | 2913 → 3091 (+178) | 1425 / 1425 (1440) |
| 1440x900-dark-200 | 1743 → 1743 | 1425 / 1425 | 4518 → 4804 (+286) | 1425 / 1425 (1440) |

**What I opened and looked at** (pairs at full size, in my scratch folder; reproducible with `LI-pair.mjs`):
- **Empty, 390×844 dark @100 and 1440×900 light @100 vs K07:**
  - Same structure as K07 and as base: Chai, "Nothing brewed yet.", explanation, "Put the kettle on", tiles, Cozy level, Badges. **No summary in the empty state** (`StatsScreen.tsx:64`).
  - The only changes are words: "Your warm days, charts and badges…", "Days warm", "0 days · Warmest run".
  - At 390 the "0 days / Warmest run" tile wraps to two lines, so the tile row grows by about 18 px.
- **Veteran, 375×667 light @200:** the summary card ("Today · Mon, 12 Oct · 50 min focused · 2 full brews · 50 min of your 1h goal", then "Last 7 days · 6 Oct–12 · 4h 35m focused · Brewed on 7 of 7 days · 1 day at goal") comes first. It pushes the tiles about 600 px down; the page is 533–616 px longer at @200 on phones (table above). The tiles wrap ("Days / warm", "Warmest / run").
- **Veteran, 1440×900 dark @100 and light @200:** the summary spans both columns above the tiles and Badges. Its two halves leave a wide empty area to the right of each column at 1440. Tiles and cards are otherwise unchanged.
- **Veteran, 844×390 light @200 (new clipping on AFTER):**
  - The "Warmest run" tile reads **"Warm… / run"**: "Warmest" is cut with an ellipsis. Its value "23 days" reaches the tile's right border.
  - Crop: open `captures/AFTER-trial-c7a6b8f/844x390-light-200-veteran.png` around x 100–480, y 450–790.
  - On BEFORE the same tile reads "23 / Best streak" without truncation.
  - The "Total focus" tile shows "23h 9ı / Total foc", cut at the right on **both** builds (pre-existing).
- **Veteran, 390×844 light @100, History:** the same day groups, totals, rows and order as BEFORE, only shifted down (the summary is about 210 px tall).
- **Horizontal fit:** `scrollWidth` is identical on BEFORE and AFTER in all 32 pairs. At 390×844 @200 and 375×667 @200 veteran it is 405/390 on both builds, from the chart tooltip `SPAN._tip`. In 844×390 and 1440 no visible element passes the edge, only the sr-only table.

**The delete dialog** (viewport shots from the probes, `isMobile` on phones): see §1 for the paths. I looked at:
- AFTER 375×667 light @200: tight. Chai, title and the start of the text, then a divider, with **Keep it** and **Delete** pinned at the bottom; the text scrolls under the divider.
- BEFORE 375×667 light @200: Delete is cut off below the panel; only Keep it shows.
- AFTER 390×844 light @200: everything fits, not tight.

## 1. F-T2-4: "Delete this brew?" by tap and by keyboard (controls first)

**Tool:** `tools/LI-sheets.mjs … dlg`. For each config: veteran, Stats; tap or click the first History row, then "Edit brew", then "Delete this brew", then the dialog. The probe then does the following, in order:
- Hit-tests Keep it and Delete: on screen, on top at their centre, not clipped by a scrolling ancestor.
- Presses Tab ×5 and Shift+Tab ×5, recording each stop and whether it is inside the top dialog.
- Presses Escape.
- Reopens and taps or clicks the backdrop outside the panel.
- Focuses the opener and presses Enter, then Enter on the initial focus (Keep it).
- Reopens and taps or clicks Keep it.
- Reopens and presses Tab, then Enter on Delete.
- With all sheets closed, opens the next brew and taps or clicks Delete.

It records the open dialogs (`[role=dialog][aria-modal=true]`), the focused element and the stored session count each time.

Runs (UTC):
- **BASE** :5478, 7 configs at 18:0x (`dialog/logs/LI-dlg-base4.log`) + 3 configs (`LI-dlg-base-r2.log`). Plus base 390×844 light @100 and @200 for tap and Tab only (`LI-dlg-base-run1-oldscript.log`, 17:00).
- **TRIAL** :5522, 16 configs at 17:03–17:14 (`LI-dlg-trial.log`) + 1440 ×4, 390 @200 and 375 @200 again at 17:3x (`LI-dlg-trial-r2.log`); the table uses r2 for 1440.
- Screenshots: `dialog/BASE/*-dialog.png`, `dialog/TRIAL/*-dialog.png`, `dialog/TRIAL/*-after-kb-delete.png`.

**Run problems, kept for the record:**
- My first two runs counted dialogs still in their exit animation (files `*-countsExiting.log`). At 1440 that misread "Keep it / outside" as "still open", and the probe then closed "Edit brew" itself.
- The `aria-modal` count fixes that.
- BASE configs marked "not run" were dropped to fit the slot queue. BASE 1440 light @200 timed out on its screenshot (`page.screenshot: Timeout`).

| Config | BASE tap Keep it / Delete | BASE Tab ×5 | TRIAL tap Keep it / Delete (tight) | TRIAL Tab ×5 | TRIAL Shift+Tab ×5 | TRIAL trap Tab/Shift |
|---|---|---|---|---|---|---|
| 390x844-light-100 | ok / ok | Keep it→Keep it→Keep it→Keep it→Keep it | ok / ok (-) | Delete→Close→Keep it→Delete→Close | Delete←Keep it←Close←Delete←Keep it | [True, True] |
| 390x844-light-200 | not run | not run | ok / ok (-) | Delete→Close→Keep it→Delete→Close | Delete←Keep it←Close←Delete←Keep it | [True, True] |
| 390x844-dark-100 | not run | not run | ok / ok (-) | Delete→Close→Keep it→Delete→Close | Delete←Keep it←Close←Delete←Keep it | [True, True] |
| 390x844-dark-200 | ok / ok | Keep it→Keep it→Keep it→Keep it→Keep it | ok / ok (-) | Delete→Close→Keep it→Delete→Close | Delete←Keep it←Close←Delete←Keep it | [True, True] |
| 375x667-light-100 | ok / ok | Keep it→Keep it→Keep it→Keep it→Keep it | ok / ok (-) | Delete→Close→Keep it→Delete→Close | Delete←Keep it←Close←Delete←Keep it | [True, True] |
| 375x667-light-200 | ok / off 641–698/667 | Keep it→Keep it→Keep it→Keep it→Keep it | ok / ok (tight) | Delete→Close→Keep it→Delete→Close | Delete←Keep it←Close←Delete←Keep it | [True, True] |
| 375x667-dark-100 | not run | not run | ok / ok (-) | Delete→Close→Keep it→Delete→Close | Delete←Keep it←Close←Delete←Keep it | [True, True] |
| 375x667-dark-200 | ok / off 641–698/667 | Keep it→Keep it→Keep it→Keep it→Keep it | ok / ok (tight) | Delete→Close→Keep it→Delete→Close | Delete←Keep it←Close←Delete←Keep it | [True, True] |
| 844x390-light-100 | not run | not run | ok / ok (-) | Delete→Close→Keep it→Delete→Close | Delete←Keep it←Close←Delete←Keep it | [True, True] |
| 844x390-light-200 | ok / ok | Keep it→Keep it→Keep it→Keep it→Keep it | ok / ok (-) | Delete→Close→Delete this brew? It leaves your h→Keep it→Delete | Keep it←Delete this brew? It leaves your h←Close←Delete←Keep it | [True, True] |
| 844x390-dark-100 | ok / ok | Keep it→Keep it→Keep it→Keep it→Keep it | ok / ok (-) | Delete→Close→Keep it→Delete→Close | Delete←Keep it←Close←Delete←Keep it | [True, True] |
| 844x390-dark-200 | not run | not run | ok / ok (-) | Delete→Close→Delete this brew? It leaves your h→Keep it→Delete | Keep it←Delete this brew? It leaves your h←Close←Delete←Keep it | [True, True] |
| 1440x900-light-100 | ok / ok | Keep it→Keep it→Keep it→Keep it→Keep it | ok / ok (-) | Delete→Close→Keep it→Delete→Close | Delete←Keep it←Close←Delete←Keep it | [True, True] |
| 1440x900-light-200 | None / None |  | ok / ok (-) | Delete→Close→Keep it→Delete→Close | Delete←Keep it←Close←Delete←Keep it | [True, True] |
| 1440x900-dark-100 | not run | not run | ok / ok (-) | Delete→Close→Keep it→Delete→Close | Delete←Keep it←Close←Delete←Keep it | [True, True] |
| 1440x900-dark-200 | ok / ok | Keep it→Keep it→Keep it→Keep it→Keep it | ok / ok (-) | Delete→Close→Keep it→Delete→Close | Delete←Keep it←Close←Delete←Keep it | [True, True] |

| Config | BASE Escape → dialogs:focus | BASE outside tap → | BASE Enter on initial focus → dialogs:focus:sessions | BASE Tab+Enter "Delete" → | BASE tap Delete → | TRIAL Escape → | TRIAL outside → | TRIAL Enter on Keep it → | TRIAL tap Keep it → | TRIAL Tab+Enter Delete → | TRIAL tap Delete → |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 390x844-light-100 | 1:Delete this brew | DIV._backdrop@8,17->1:Delete this brew | Keep it->1:Delete this brew:83 | Keep it->1:Delete this brew:83/83 undo0 | 0:Stats 23 Stats Robin · brewing sin:82 | 1:Delete this brew | DIV._backdrop@8,17->1:Delete this brew | Keep it->1:Delete this brew:83 | 1:Delete this brew:83 | Delete->0:Undo: bring back Read brew:82/83 undo1 | 0:Stats 22 Stats Robin · brewing sin:81 |
| 390x844-light-200 | — | — | — | — | — | 1:Delete this brew | DIV._backdrop@8,17->1:Delete this brew | Keep it->1:Delete this brew:83 | 1:Delete this brew:83 | Delete->0:Stats 23 Stats Robin · brewing sin:82/83 undo1 | 0:Stats 22 Stats Robin · brewing sin:81 |
| 390x844-dark-100 | — | — | — | — | — | 1:Delete this brew | DIV._backdrop@8,17->1:Delete this brew | Keep it->1:Delete this brew:83 | 1:Delete this brew:83 | Delete->0:Undo: bring back Read brew:82/83 undo1 | 0:Stats 22 Stats Robin · brewing sin:81 |
| 390x844-dark-200 | 1:Delete this brew | DIV._backdrop@8,17->1:Delete this brew | Keep it->1:Delete this brew:83 | Keep it->1:Delete this brew:83/83 undo0 | 0:Stats 23 Stats Robin · brewing sin:82 | 1:Delete this brew | DIV._backdrop@8,17->1:Delete this brew | Keep it->1:Delete this brew:83 | 1:Delete this brew:83 | Delete->0:Undo: bring back Read brew:82/83 undo1 | 0:Stats 22 Stats Robin · brewing sin:81 |
| 375x667-light-100 | 1:Delete this brew | DIV._backdrop@8,13->1:Delete this brew | Keep it->1:Delete this brew:83 | Keep it->1:Delete this brew:83/83 undo0 | 0:Stats 23 Stats Robin · brewing sin:82 | 1:Delete this brew | DIV._backdrop@8,13->1:Delete this brew | Keep it->1:Delete this brew:83 | 1:Delete this brew:83 | Delete->0:Undo: bring back Read brew:82/83 undo1 | 0:Stats 22 Stats Robin · brewing sin:81 |
| 375x667-light-200 | 1:Delete this brew | DIV._backdrop@8,13->1:Delete this brew | Keep it->1:Delete this brew:83 | Keep it->1:Delete this brew:83/undefined undo0 | — | 1:Delete this brew | DIV._backdrop@8,13->1:Delete this brew | Keep it->1:Delete this brew:83 | 1:Delete this brew:83 | Delete->0:Undo: bring back Read brew:82/83 undo1 | 0:Stats 22 Stats Robin · brewing sin:81 |
| 375x667-dark-100 | — | — | — | — | — | 1:Delete this brew | DIV._backdrop@8,13->1:Delete this brew | Keep it->1:Delete this brew:83 | 1:Delete this brew:83 | Delete->0:Undo: bring back Read brew:82/83 undo1 | 0:Stats 22 Stats Robin · brewing sin:81 |
| 375x667-dark-200 | 1:Delete this brew | DIV._backdrop@8,13->1:Delete this brew | Keep it->1:Delete this brew:83 | Keep it->1:Delete this brew:83/83 undo0 | 0:Stats 23 Stats Robin · brewing sin:82 | 1:Delete this brew | DIV._backdrop@8,13->1:Delete this brew | Keep it->1:Delete this brew:83 | 1:Delete this brew:83 | Delete->0:Undo: bring back Read brew:82/83 undo1 | 0:Stats 22 Stats Robin · brewing sin:81 |
| 844x390-light-100 | — | — | — | — | — | 1:Delete this brew | DIV._backdrop@17,8->1:Delete this brew | Keep it->1:Delete this brew:83 | 1:Delete this brew:83 | Delete->0:Undo: bring back Read brew:82/83 undo1 | 0:Stats 22 Stats Robin · brewing sin:81 |
| 844x390-light-200 | 1:Delete this brew | DIV._backdrop@17,8->1:Delete this brew | Keep it->1:Delete this brew:83 | Keep it->1:Delete this brew:83/83 undo0 | 0:Stats 23 Stats Robin · brewing sin:82 | 1:Delete this brew | DIV._backdrop@17,8->1:Delete this brew | Keep it->1:Delete this brew:83 | 1:Delete this brew:83 | Delete->0:Undo: bring back Read brew:82/83 undo1 | 0:Stats 22 Stats Robin · brewing sin:81 |
| 844x390-dark-100 | 1:Delete this brew | DIV._backdrop@17,8->1:Delete this brew | Keep it->1:Delete this brew:83 | Keep it->1:Delete this brew:83/83 undo0 | 0:Stats 23 Stats Robin · brewing sin:82 | 1:Delete this brew | DIV._backdrop@17,8->1:Delete this brew | Keep it->1:Delete this brew:83 | 1:Delete this brew:83 | Delete->0:Undo: bring back Read brew:82/83 undo1 | 0:Stats 22 Stats Robin · brewing sin:81 |
| 844x390-dark-200 | — | — | — | — | — | 1:Delete this brew | DIV._backdrop@17,8->1:Delete this brew | Keep it->1:Delete this brew:83 | 1:Delete this brew:83 | Delete->0:Undo: bring back Read brew:82/83 undo1 | 0:Stats 22 Stats Robin · brewing sin:81 |
| 1440x900-light-100 | 1:Delete this brew | DIV._backdrop@29,18->1:Delete this brew | Keep it->1:Delete this brew:83 | Keep it->1:Delete this brew:83/83 undo0 | 0:Stats 23 Stats Robin · brewing sin:82 | 1:Delete this brew | DIV._backdrop@29,18->1:Delete this brew | Keep it->1:Delete this brew:83 | 1:Delete this brew:83 | Delete->0:Undo: bring back Read brew:82/83 undo1 | 0:Stats 22 Stats Robin · brewing sin:81 |
| 1440x900-light-200 | — | — | — | — | — | 1:Delete this brew | DIV._backdrop@29,18->1:Delete this brew | Keep it->1:Delete this brew:83 | 1:Delete this brew:83 | Delete->0:Stats 23 Stats Robin · brewing sin:82/83 undo1 | 0:Stats 22 Stats Robin · brewing sin:81 |
| 1440x900-dark-100 | — | — | — | — | — | 1:Delete this brew | DIV._backdrop@29,18->1:Delete this brew | Keep it->1:Delete this brew:83 | 1:Delete this brew:83 | Delete->0:Undo: bring back Read brew:82/83 undo1 | 0:Stats 22 Stats Robin · brewing sin:81 |
| 1440x900-dark-200 | 1:Delete this brew | DIV._backdrop@29,18->1:Delete this brew | Keep it->1:Delete this brew:83 | Keep it->1:Delete this brew:83/83 undo0 | 0:Stats 23 Stats Robin · brewing sin:82 | 1:Delete this brew | DIV._backdrop@29,18->1:Delete this brew | Keep it->1:Delete this brew:83 | 1:Delete this brew:83 | Delete->0:Undo: bring back Read brew:82/83 undo1 | 0:Stats 22 Stats Robin · brewing sin:81 |

(Table cells: `dialogs:focused element:sessions stored`. The initial count is 83. "Stats 22/23 Stats Robin…" is `<main>`. The BASE 390×844 light @100 and @200 tap and Tab cells come from the 17:00 run.)

**Facts:**
- **BASE, every config tried (9 of 16): Tab and Shift+Tab are frozen on "Keep it".** Enter therefore keeps the brew (83 → 83). Delete cannot be reached from the keyboard; the dialog is still "trapped", but with one stop.
- **BASE 375×667 @200, light and dark:** Delete is **off screen (641–698 of 667)**; a tap on it cannot land. Everywhere else on BASE, Delete can be tapped and it deletes.
- **TRIAL, all 16 configs (4 sizes × light/dark × @100/@200):** Keep it and Delete are tappable. Tab cycles Delete → Close → Keep it → … and Shift+Tab cycles back; every stop is inside the top dialog. At 844×390 @200 the scrolling description is one extra stop. At 375×667 @200 the dialog is `data-tight`.
- **TRIAL, Escape:** only the top dialog closes; "Edit brew" stays open and **focus returns to "Delete this brew"**.
- **TRIAL, backdrop tap or click:** same as Escape (Edit brew stays; focus on "Delete this brew"). BASE behaves the same.
- **TRIAL, Keep it** (Enter or tap): the dialog closes, the brew stays (83), and focus returns to "Delete this brew" in "Edit brew".
- **TRIAL, Delete by Tab+Enter:**
  - The brew goes (83 → 82). Both sheets close and the row's inline **Undo** exists ("Undo: bring back Read brew").
  - Focus goes to that Undo in 14 of 16 configs. At **390×844 light @200 and 1440 light @200 it was on `<main>`** 1 s after Enter. Timing or a real difference: unproven.
- **TRIAL, Delete by tap or click:** the brew goes (→ 81); focus is on `<main>`. **BASE does the same** (focus `<main>`, 82). The row that opened the sheets no longer exists.

## 2b. Every sheet: reach, focus trap and return, Escape, click outside, scroll, pinned footer

**Tool:** `tools/LI-sheets.mjs … all`, veteran, real taps on phones and clicks at 1440. Runs: BASE :5478 17:21–17:33 (`sheets/LI-all-base.log`), TRIAL :5522 17:4x–18:0x (`sheets/LI-all-trial.log`). For each sheet the probe checks:
- **Reach:** every button, link and input in the top sheet is on screen, on top and not clipped. A control inside a scroller counts as reachable if scrolling it into view makes it so.
- **Scroll:** every scroller in the sheet scrolled to its end; the last content element is then visible above the footer.
- **Footer:** where the footer sits, and whether the sheet is `data-tight`.
- **Trap:** Tab and Shift+Tab, (number of controls + 2) presses each, all stops inside the top sheet.
- **Escape:** open sheets after, and where focus went.
- **Reopen, then a tap or click on the backdrop:** open sheets after, and where focus went.

Screenshots: `sheets/<build>/<cfg>-<sheet>.png` (the sheet as opened).
- Probe errors are in the table, shown as "probe error". They are failures of my openers: a stale "Custom" option, two "Reset everything" matches after an import's Undo row, one screenshot timeout under load. They are not app results.
- Configs: 375×667 @200 light and dark, 1440×900 light @100 and dark @200.


**375x667-light-200**

| Sheet | BASE | TRIAL |
|---|---|---|
| today-warm | all reachable; footer 567-667; last content visible after scroll: True; trap ✓; Esc 1→0:23 days warm streak. Show details; outside 0:23 days warm streak. Show details | all reachable; footer 571-667 tight; last content visible after scroll: True; trap ✓; Esc 1→0:23 days warm streak. Show details; outside 0:23 days warm streak. Show details |
| today-leaves | all reachable; footer 567-667; last content visible after scroll: True; trap ✓; Esc 1→0:2,266 leaves Show details; outside 0:2,266 leaves Show details | all reachable; footer 571-667 tight; last content visible after scroll: True; trap ✓; Esc 1→0:2,266 leaves Show details; outside 0:2,266 leaves Show details |
| today-level | all reachable; footer 525-667; last content visible after scroll: True; trap ✓; Esc 1→0:12 Level 12 Cozy level 12, 179 lea; outside 0:12 Level 12 Cozy level 12, 179 lea | all reachable; footer 525-667; last content visible after scroll: True; trap ✓; Esc 1→0:12 Level 12 Cozy level 12, 179 lea; outside 0:12 Level 12 Cozy level 12, 179 lea |
| today-rhythm | all reachable; footer 484-667; last content visible after scroll: True; trap ✓; Esc 1→0:Custom; outside 0:Custom | all reachable; footer 484-667; last content visible after scroll: True; trap ✓; Esc 1→0:Custom; outside 0:Custom |
| shortcuts | all reachable; footer no footer; last content visible after scroll: True; trap ✓ (Tab stays on 1 stop); Esc 1→0:Custom; outside 0:Custom | all reachable; footer no footer; last content visible after scroll: True; trap ✓ (Tab stays on 1 stop); Esc 1→0:Custom; outside 0:Custom |
| settings-reset | NOT reachable: Export a backup first:off 632–728/667/scroll→off 632–728/667; Keep my data:off 674–737/667; Reset everything:off 747–846; footer 656-870 OFF; last content visible after scroll: True; trap ✓; Esc 1→0:Reset everything Start fresh on th; outside 0:Reset everything Start fresh on th | all reachable; footer 457-667 tight; last content visible after scroll: True; trap ✓; Esc 1→0:Reset everything Start fresh on th; outside 0:Reset everything Start fresh on th |
| settings-import | all reachable; footer 377-667; last content visible after scroll: True; trap ✓; Esc 1→0:Export a backup Save everything as; outside 0:Export a backup Save everything as | all reachable; footer 377-667; last content visible after scroll: True; trap ✓; Esc 1→0:Export a backup Save everything as; outside 0:Export a backup Save everything as |
| stats-badge | all reachable; footer 569-667; last content visible after scroll: True; trap ✓; Esc 1→0:Morning Dew, tier 3 of 5. 15 of 40; outside 0:Morning Dew, tier 3 of 5. 15 of 40 | all reachable; footer 569-667; last content visible after scroll: True; trap ✓; Esc 1→0:Morning Dew, tier 3 of 5. 15 of 40; outside 0:Morning Dew, tier 3 of 5. 15 of 40 |
| stats-edit | all reachable; footer no footer; last content visible after scroll: True; trap ✓; Esc 1→0:Read brew, 13:20, 25 minutes, Full; outside 0:Read brew, 13:20, 25 minutes, Full | all reachable; footer no footer; last content visible after scroll: True; trap ✓; Esc 1→0:Read brew, 13:20, 25 minutes, Full; outside 0:Read brew, 13:20, 25 minutes, Full |
| stats-delete-over-edit | NOT reachable: Delete:off 641–698/667; footer 571-714 OFF; last content visible after scroll: True; trap ✓ (Tab stays on 1 stop); Esc 2→1:Delete this brew; outside 1:Delete this brew | all reachable; footer 487-637 tight; last content visible after scroll: True; trap ✓; Esc 2→1:Delete this brew; outside 1:Delete this brew |
| focus-ambience | all reachable; footer 563-667; last content visible after scroll: True; trap ✓; Esc 1→0:Ambience: Rain. Change; outside 0:Ambience: Rain. Change | all reachable; footer 563-667; last content visible after scroll: True; trap ✓; Esc 1→0:Ambience: Rain. Change; outside 0:Ambience: Rain. Change |
| focus-end | NOT reachable: Keep brewing:off 629–691/667; End session:off 699–755/667; footer 611-779 OFF; last content visible after scroll: True; trap ✓; Esc 1→0:End session; outside 0:End session | all reachable; footer 503-667 tight; last content visible after scroll: True; trap ✓; Esc 1→0:End session; outside 0:End session |

**375x667-dark-200**

| Sheet | BASE | TRIAL |
|---|---|---|
| today-warm | all reachable; footer 567-667; last content visible after scroll: True; trap ✓; Esc 1→0:23 days warm streak. Show details; outside 0:23 days warm streak. Show details | all reachable; footer 571-667 tight; last content visible after scroll: True; trap ✓; Esc 1→0:23 days warm streak. Show details; outside 0:23 days warm streak. Show details |
| today-leaves | all reachable; footer 567-667; last content visible after scroll: True; trap ✓; Esc 1→0:2,266 leaves Show details; outside 0:2,266 leaves Show details | all reachable; footer 571-667 tight; last content visible after scroll: True; trap ✓; Esc 1→0:2,266 leaves Show details; outside 0:2,266 leaves Show details |
| today-level | all reachable; footer 525-667; last content visible after scroll: True; trap ✓; Esc 1→0:12 Level 12 Cozy level 12, 179 lea; outside 0:12 Level 12 Cozy level 12, 179 lea | all reachable; footer 525-667; last content visible after scroll: True; trap ✓; Esc 1→0:12 Level 12 Cozy level 12, 179 lea; outside 0:12 Level 12 Cozy level 12, 179 lea |
| today-rhythm | all reachable; footer 484-667; last content visible after scroll: True; trap ✓; Esc 1→0:Custom; outside 0:Custom | all reachable; footer 484-667; last content visible after scroll: True; trap ✓; Esc 1→0:Custom; outside 0:Custom |
| shortcuts | all reachable; footer no footer; last content visible after scroll: True; trap ✓ (Tab stays on 1 stop); Esc 1→0:Custom; outside 0:Custom | all reachable; footer no footer; last content visible after scroll: True; trap ✓ (Tab stays on 1 stop); Esc 1→0:Custom; outside 0:Custom |
| settings-reset | probe error: locator.scrollIntoViewIfNeeded: Error: strict mode violation | all reachable; footer 457-667 tight; last content visible after scroll: True; trap ✓; Esc 1→0:Reset everything Start fresh on th; outside 0:Reset everything Start fresh on th |
| settings-import | all reachable; footer 377-667; last content visible after scroll: True; trap ✓; Esc 1→0:Reset everything Start fresh on th; outside 0:Reset everything Start fresh on th | all reachable; footer 377-667; last content visible after scroll: True; trap ✓; Esc 1→0:Reset everything Start fresh on th; outside 0:Reset everything Start fresh on th |
| stats-badge | all reachable; footer 569-667; last content visible after scroll: True; trap ✓; Esc 1→0:Morning Dew, tier 3 of 5. 15 of 40; outside 0:Morning Dew, tier 3 of 5. 15 of 40 | all reachable; footer 569-667; last content visible after scroll: True; trap ✓; Esc 1→0:Morning Dew, tier 3 of 5. 15 of 40; outside 0:Morning Dew, tier 3 of 5. 15 of 40 |
| stats-edit | all reachable; footer no footer; last content visible after scroll: True; trap ✓; Esc 1→0:Read brew, 13:20, 25 minutes, Full; outside 0:Read brew, 13:20, 25 minutes, Full | all reachable; footer no footer; last content visible after scroll: True; trap ✓; Esc 1→0:Read brew, 13:20, 25 minutes, Full; outside 0:Read brew, 13:20, 25 minutes, Full |
| stats-delete-over-edit | NOT reachable: Delete:off 641–698/667; footer 571-714 OFF; last content visible after scroll: True; trap ✓ (Tab stays on 1 stop); Esc 2→1:Delete this brew; outside 1:Delete this brew | all reachable; footer 487-637 tight; last content visible after scroll: True; trap ✓; Esc 2→1:Delete this brew; outside 1:Delete this brew |
| focus-ambience | all reachable; footer 563-667; last content visible after scroll: True; trap ✓; Esc 1→0:Ambience: Rain. Change; outside 0:Ambience: Rain. Change | all reachable; footer 563-667; last content visible after scroll: True; trap ✓; Esc 1→0:Ambience: Rain. Change; outside 0:Ambience: Rain. Change |
| focus-end | NOT reachable: Keep brewing:off 629–691/667; End session:off 699–755/667; footer 611-779 OFF; last content visible after scroll: True; trap ✓; Esc 1→0:End session; outside 0:End session | all reachable; footer 503-667 tight; last content visible after scroll: True; trap ✓; Esc 1→0:End session; outside 0:End session |

**1440x900-light-100**

| Sheet | BASE | TRIAL |
|---|---|---|
| today-warm | all reachable; footer 676-762; last content visible after scroll: True; trap ✓; Esc 1→0:23 days warm streak. Show details; outside 0:23 days warm streak. Show details | all reachable; footer 676-762; last content visible after scroll: True; trap ✓; Esc 1→0:23 days warm streak. Show details; outside 0:23 days warm streak. Show details |
| today-leaves | all reachable; footer 617-703; last content visible after scroll: True; trap ✓; Esc 1→0:2,266 leaves Show details; outside 0:2,266 leaves Show details | all reachable; footer 617-703; last content visible after scroll: True; trap ✓; Esc 1→0:2,266 leaves Show details; outside 0:2,266 leaves Show details |
| today-level | all reachable; footer 578-664; last content visible after scroll: True; trap ✓; Esc 1→0:12 Level 12 Cozy level 12, 179 lea; outside 0:12 Level 12 Cozy level 12, 179 lea | all reachable; footer 578-664; last content visible after scroll: True; trap ✓; Esc 1→0:12 Level 12 Cozy level 12, 179 lea; outside 0:12 Level 12 Cozy level 12, 179 lea |
| today-rhythm | all reachable; footer 531-617; last content visible after scroll: True; trap ✓; Esc 1→0:Custom Set it; outside 0:Custom Set it | probe error: locator.scrollIntoViewIfNeeded: Element is not attached to t |
| shortcuts | all reachable; footer no footer; last content visible after scroll: True; trap ✓ (Tab stays on 1 stop); Esc 1→0:Custom Set it; outside 0:Custom Set it | all reachable; footer no footer; last content visible after scroll: True; trap ✓ (Tab stays on 1 stop); Esc 1→0:Custom Set it; outside 0:Custom Set it |
| settings-reset | all reachable; footer 528-684; last content visible after scroll: True; trap ✓; Esc 1→0:Reset everything Start fresh on th; outside 0:Reset everything Start fresh on th | all reachable; footer 528-684; last content visible after scroll: True; trap ✓; Esc 1→0:Reset everything Start fresh on th; outside 0:Reset everything Start fresh on th |
| settings-import | all reachable; footer 556-675; last content visible after scroll: True; trap ✓; Esc 1→0:Reset everything Start fresh on th; outside 0:Reset everything Start fresh on th | all reachable; footer 556-675; last content visible after scroll: True; trap ✓; Esc 1→0:Reset everything Start fresh on th; outside 0:Reset everything Start fresh on th |
| stats-badge | all reachable; footer 706-792; last content visible after scroll: True; trap ✓; Esc 1→0:Morning Dew, tier 3 of 5. 15 of 40; outside 0:Morning Dew, tier 3 of 5. 15 of 40 | all reachable; footer 706-792; last content visible after scroll: True; trap ✓; Esc 1→0:Morning Dew, tier 3 of 5. 15 of 40; outside 0:Morning Dew, tier 3 of 5. 15 of 40 |
| stats-edit | all reachable; footer no footer; last content visible after scroll: True; trap ✓; Esc 1→0:Read brew, 13:20, 25 minutes, Full; outside 0:Read brew, 13:20, 25 minutes, Full | all reachable; footer no footer; last content visible after scroll: True; trap ✓; Esc 1→0:Read brew, 13:20, 25 minutes, Full; outside 0:Read brew, 13:20, 25 minutes, Full |
| stats-delete-over-edit | all reachable; footer 498-630; last content visible after scroll: True; trap ✓ (Tab stays on 1 stop); Esc 2→1:Delete this brew; outside 1:Delete this brew | all reachable; footer 498-630; last content visible after scroll: True; trap ✓; Esc 2→1:Delete this brew; outside 1:Delete this brew |
| focus-ambience | all reachable; footer 642-736; last content visible after scroll: True; trap ✓; Esc 1→0:Ambience: Rain. Change; outside 0:Ambience: Rain. Change | all reachable; footer 642-736; last content visible after scroll: True; trap ✓; Esc 1→0:Ambience: Rain. Change; outside 0:Ambience: Rain. Change |
| focus-end | all reachable; footer 507-661; last content visible after scroll: True; trap ✓; Esc 1→0:End session; outside 0:End session | all reachable; footer 507-661; last content visible after scroll: True; trap ✓; Esc 1→0:End session; outside 0:End session |

**1440x900-dark-200**

| Sheet | BASE | TRIAL |
|---|---|---|
| today-warm | all reachable; footer 732-824; last content visible after scroll: True; trap ✓; Esc 1→0:23 days warm streak. Show details; outside 0:23 days warm streak. Show details | all reachable; footer 732-824; last content visible after scroll: True; trap ✓; Esc 1→0:23 days warm streak. Show details; outside 0:23 days warm streak. Show details |
| today-leaves | all reachable; footer 732-824; last content visible after scroll: True; trap ✓; Esc 1→0:2,266 leaves Show details; outside 0:2,266 leaves Show details | all reachable; footer 732-824; last content visible after scroll: True; trap ✓; Esc 1→0:2,266 leaves Show details; outside 0:2,266 leaves Show details |
| today-level | all reachable; footer 641-733; last content visible after scroll: True; trap ✓; Esc 1→0:12 Level 12 Cozy level 12, 179 lea; outside 0:12 Level 12 Cozy level 12, 179 lea | probe error: page.screenshot: Timeout 30000ms exceeded. / Call log: |
| today-rhythm | probe error: locator.scrollIntoViewIfNeeded: Element is not attached to t | probe error: locator.scrollIntoViewIfNeeded: Element is not attached to t |
| shortcuts | all reachable; footer no footer; last content visible after scroll: True; trap ✓ (Tab stays on 1 stop); Esc 1→0:Custom Set it; outside 0:Custom Set it | all reachable; footer no footer; last content visible after scroll: True; trap ✓ (Tab stays on 1 stop); Esc 1→0:Custom Set it; outside 0:Custom Set it |
| settings-reset | probe error: locator.scrollIntoViewIfNeeded: Error: strict mode violation | all reachable; footer 637-801; last content visible after scroll: True; trap ✓; Esc 1→0:Reset everything Start fresh on th; outside 0:Reset everything Start fresh on th |
| settings-import | all reachable; footer 587-824; last content visible after scroll: True; trap ✓; Esc 1→0:Reset everything Start fresh on th; outside 0:Reset everything Start fresh on th | all reachable; footer 587-824; last content visible after scroll: True; trap ✓; Esc 1→0:Reset everything Start fresh on th; outside 0:Reset everything Start fresh on th |
| stats-badge | all reachable; footer 734-824; last content visible after scroll: True; trap ✓; Esc 1→0:Morning Dew, tier 3 of 5. 15 of 40; outside 0:Morning Dew, tier 3 of 5. 15 of 40 | all reachable; footer 734-824; last content visible after scroll: True; trap ✓; Esc 1→0:Morning Dew, tier 3 of 5. 15 of 40; outside 0:Morning Dew, tier 3 of 5. 15 of 40 |
| stats-edit | all reachable; footer no footer; last content visible after scroll: True; trap ✓; Esc 1→0:Read brew, 13:20, 25 minutes, Full; outside 0:Read brew, 13:20, 25 minutes, Full | all reachable; footer no footer; last content visible after scroll: True; trap ✓; Esc 1→0:Read brew, 13:20, 25 minutes, Full; outside 0:Read brew, 13:20, 25 minutes, Full |
| stats-delete-over-edit | all reachable; footer 579-723; last content visible after scroll: True; trap ✓ (Tab stays on 1 stop); Esc 2→1:Delete this brew; outside 1:Delete this brew | not run |
| focus-ambience | all reachable; footer 728-824; last content visible after scroll: True; trap ✓; Esc 1→0:Ambience: Rain. Change; outside 0:Ambience: Rain. Change | not run |
| focus-end | all reachable; footer 620-780; last content visible after scroll: True; trap ✓; Esc 1→0:End session; outside 0:End session | not run |

**Facts:**
- **Controls reproduced on BASE at 375×667 @200 (light and dark):**
  - "Start fresh?": Export a backup first at 632–728, Keep my data at 674–737, Reset everything at 747–846, all of 667 and off screen, footer off screen.
  - "Delete this brew?": Delete at 641–698, Tab stuck on one stop.
  - End (< 1 min): Keep brewing at 629–691, End session at 699–755.
  - Frames: `sheets/base-all/375x667-light-200-{settings-reset,stats-delete-over-edit,focus-end}.png`.
- **TRIAL, the same three at 375×667 @200:** all reachable. Each is `data-tight`, with the footer pinned on screen ("Start fresh?" 457–667, Delete 487–637, End 503–667). The last content is visible after scrolling. Tab moves and is trapped.
- **Sheets that became `data-tight` on TRIAL although BASE already reached everything:** Today's warm-days and leaves sheets at 375×667 @200. Footer 567–667 on BASE, 571–667 tight on TRIAL. At rest the two frames look alike (I looked at `today-warm` side by side). The difference is that on TRIAL the whole panel, header included, scrolls under the pinned footer; on BASE the header stayed and only the body scrolled. The maker's packet says tight is "never set when everything fits"; here it is set while everything was reachable on BASE.
- **Unchanged on both builds:** "Your own rhythm", the level sheet, the import sheet ("Add this backup?"), the badge sheet, Edit brew and Ambience at 375 @200. Every sheet at 1440 @100 has the same footer position on both builds.
- **Escape and backdrop**, on every sheet and on both builds: exactly one sheet closes. Focus returns to the control that opened it ("23 days warm streak. Show details", "Custom", "Reset everything…", "Morning Dew, tier 3…", "Read brew, 13:20…", "Ambience: Rain. Change", "End session").
  - Sheet over a sheet: Escape or a backdrop tap on "Delete this brew?" leaves "Edit brew" open, with focus on "Delete this brew".
  - The import sheet returns focus to "Export a backup…" (375) or "Reset everything…" (1440), not to the hidden file input. Same on both builds.
- **The "Keyboard shortcuts" sheet** (opened with `?`) has one focusable control, so Tab stays on it. Same on both builds.
- **Not covered:** 844×390 and 390×844 for the other sheets. The "× scrolls away in a tight sheet" note in the maker's packet: in tight sheets on TRIAL the close button is inside the scrolling column; I did not measure it after scrolling.

## 5b. The Tea Cozy line, re-run with an unpinned seed (18:04 UTC, `words/LI-words-custom.log`, `words/trial-c-*.png`, `words/base-c-*.png`)

| History (recorded with `recordSession` on seed `fresh`, which pins nothing), today Mon 12 Oct | Clock | TRIAL warm-days card (verbatim) | TRIAL tile hint |
|---|---|---|---|
| warm 3–11 Oct (9 days; 1 Cozy held), nothing today | **19:10** (at risk) | "9 days warm · One brew today makes it 10 warm days in a row. **If today stays quiet, a Tea Cozy keeps the kettle warm.** · 1 Tea Cozy ready · Next in 5 warm days · each covers one missed day" | "One brew warms today" |
| same | 07:40 | "9 days warm · One brew today makes it 10 warm days in a row. · 1 Tea Cozy ready · …" (**no** Tea Cozy sentence) | none |
| warm 1–9 Oct, Cozy used 10 Oct, 11 Oct missed (run over) | 19:10 | "Ready for a warm day · One brew today warms the kettle again. Your warmest run: 9 days. · No Tea Cozies yet · Earn one in 7 warm days · each covers one missed day" | none |

- In all three cases "streak" appears **0 times** in `main`, Edit brew or Delete on trial. The badge sheet still says "Keep a 14-day warm streak" (`badges.ts`, F's file).
- The engine's values in those cases: current 9, Cozies 1, at risk true / false; then current 0, best 9, Cozy day 10 Oct, missed 11 Oct.

## 2c. The transient width, follow-up

`tools/LI-overflow2.mjs` loaded Stats at 390×844 @200 (`isMobile`) with the CPU throttled ×4 and sampled `scrollWidth` against 390 every 50 ms for 6 s, to find which element widens the page. Runs: trial ×2, base ×2, 18:06 UTC (`overflow/LI-overflow2.log`). **No sample was wider than 390 on either build.** (An earlier run compared with `clientWidth`, which grows with the page under `isMobile`; it is inconclusive and kept as `LI-overflow2-run1-clientWidth.log`.)

So the 408 px layout viewport appeared only on the first, cold load of the 17:36 probe, on trial and on combined. With a warm dev server I could not reproduce it. **Which element causes it is unproven.**

## Unproven / not done

- **Origin of the transient 408 px width** (§2a, §2c). It was seen on trial and combined, on the first cold load only. Base was clean in 5 loads, but a cold base load was not tried after its server had warmed, so "trial-only" is not established.
- **F-T2-4 on BASE**: 9 of 16 configs. Not run: 390×844 dark @100, 375×667 dark @100, 844×390 light @100, 844×390 dark @200, 1440 dark @100. BASE 1440 light @200 timed out. TRIAL covers all 16.
- **Focus after Delete by keyboard**: Undo in 14 of 16 trial configs, `<main>` in 2 (390×844 light @200, 1440 light @200). Not re-run.
- **§2b sheets** at 375×667 @200 and 1440 only, as the brief asked. 390×844 and 844×390 are not covered for the non-Stats sheets.
  - Probe errors: TRIAL 1440 light @100 `today-rhythm`, 1440 dark @200 `today-level`/`today-rhythm`; BASE 375 dark @200 and 1440 dark @200 `settings-reset`, 1440 dark @200 `today-rhythm`.
  - TRIAL 1440 dark @200 was still running its last 3 sheets (`stats-delete-over-edit`, `focus-ambience`, `focus-end`) when I wrote this; see `sheets/LI-all-trial.log` for whatever it recorded.
  - The × position after scrolling a tight sheet was not measured.
- **Late completions in a browser**: only the after-midnight brew (§3 case A). "Ended late" (app closed past the end) and DST were not run by me; they are cited from code, docs and unit tests.
- **A non-whole-minute brew** was not run by me. The maker's spec "12:40" passed in Lane R's 17:25 rerun.
- **Captures** are the Stats page (empty, veteran) at all 16 configs, both builds. Not captured: the at-risk top, newbie and celebrate at every config. The `truth/` and `words/` shots cover those states at 1440 only.
- **Pairs** (BEFORE | AFTER images) were not committed (size cap). `tools/LI-pair.mjs` rebuilds them from `captures/`.
- **The combined build** (`e478604`): only `w3-stats.spec.ts:98` and the overflow probe. No sheet or Stats audit on it, so the badge sheet wording there was not checked.
- **Device behaviour** (real iOS/Android touch, VoiceOver/TalkBack reading the tight sheets): not tested.
- **Time:** 16:53–18:07 UTC (74 min), about 25 min of it waiting for slots.
