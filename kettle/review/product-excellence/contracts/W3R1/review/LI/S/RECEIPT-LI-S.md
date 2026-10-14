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

