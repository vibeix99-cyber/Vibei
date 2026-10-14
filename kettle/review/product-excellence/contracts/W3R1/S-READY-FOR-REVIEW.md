# W3R1 Maker S: ready for review

Stats and History (I12), F-T2-4 ("Delete this brew?"), the backup round-trip test, and warm-days wording in S's files.

- **Branch:** `pe/w3-stats` (worktree `/home/user/wt/w5s`), local commits only.
- **Hash:** `@@HASH@@`. **kettle/src tree:** `@@SRC@@`. Base: `4d36939` (src `5cd9a44`).
- **Servers:** candidate dev **:5502** (`verify.sh`: `@@VERIFY@@`); base dev :5478, base preview :5488.
- **Evidence:** `contracts/W3R1/S/` (tools in `S/tools/`, all browser runs through `slots.py run --lane S`).

## Files changed (all S's per PLAN.md)

| File | Change |
|---|---|
| `src/ui/Sheet.tsx` | Tab handled only for presses inside the panel (portal bubbling); `useTight` measures when the actions can't fit and marks the panel `data-tight`. |
| `src/ui/Sheet.module.css` | `[data-tight]`: the panel scrolls as one column, footer pinned with a divider; a dialog's header can be touch-scrolled. |
| `src/screens/stats/Glance.tsx` (new) | The summary at the top: today and the last 7 days. |
| `src/screens/stats/StatsScreen.tsx` | Mounts the summary (populated only); tile wording ("Days warm", "Warmest run · N days"), at-risk hint; empty-state copy ("warm days"). |
| `src/screens/stats/StreakCard.tsx` | Warm-days lines (no "streak"), missed-day/return lines per I13, Tea Cozy only when true; sr caption. |
| `src/screens/stats/History.tsx` | Delete dialog: "…history, stats and warm days." |
| `src/screens/stats/format.ts` | `hm`/`hmLong`: whole minutes rounded down (engine policy). |
| `src/screens/stats/stats.module.css` | Summary styles; tile unit; at-risk line/hint persimmon instead of berry. |
| `src/ui/Stat.tsx` | Doc comment example only. |
| `src/screens/stats/format.test.ts` (new), `src/progress/dst.test.ts` | Unit tests: rounding; last 7 days + day attribution across fall-back. |
| `tests/integrity.spec.ts` | `profilePills` waits for the settled route and reads Settings' own Profile card. |
| `tests/w3-stats.spec.ts` (new) | F-T2-4 at five sizes, totals vs recomputed history, after-midnight, 12:40, no "streak". |

No rule, arithmetic, stored-data, id, palette, font, dependency or settings change.

## The documented policy (cited)

- **A brew belongs to the local day it ended on.** `src/progress/types.ts` (`SessionRecord.day`: "Local day the session ended on"); `docs/areas/timer.md` ("A phase that ended while closed completes at its real end (`record.endedAt = endsAt`, `day` = local day it ended)"); late-night/DST cases in `src/progress/dst.test.ts` ("A brew starting 11:50 pm ends after midnight → next day").
- **Minutes are whole focused minutes, rounded down.** `src/progress/engine.ts` (`Math.floor(r.focusedMs / MIN)` for focus leaves; `afterMin = Math.floor(...)` for the daily goal), `insights.weekSeries` (`Math.floor(t.focusMs / MIN)`), the End sheet (`Math.floor(focusedMs / 60_000)` "minutes of focus will be saved"), `quests.ts`, `flow.ts`.
- **"Last 7 days" is rolling, today at the right edge.** `docs/areas/progress.md`, iteration 2: "Calendar week on a Monday was an empty chart → rolling 'Last 7 days'". The summary's week uses the same series, so the two always agree.
- **DST:** day keys step by calendar day, never +24 h (`progress/streak.ts`, `docs/areas/progress.md`); `progress/time.ts` re-renders at local midnight and on clock jumps.

## Controls first (each defect reproduced on base :5478, then shown fixed on :5502)

### F-T2-4: "Delete this brew?" (Stats › History › a brew › Delete this brew)

Probe `S/tools/dlgprobe.mjs` (veteran, frozen Monday; real taps/clicks/keys). BEFORE `S/control-ft24/base-dlgprobe.json` + `base-*.png`; AFTER `after-dlgprobe.json` + `after-*.png`.

| Size | Tab from "Keep it" (BEFORE) | Tab (AFTER) | Tap Delete (BEFORE) | Tap Delete (AFTER) |
|---|---|---|---|---|
| 375×667 @200 | Keep it, Keep it, Keep it… (**frozen**) | Keep it → Delete → Close → Keep it; Tab+Enter deletes | **not reachable**: Delete at 641–698 px of 667, clipped by the panel (`base-375x667-light-t200-dialog.png`) | deleted by a tap (`after-375x667-light-t200-dialog.png`) |
| 390×844 @200 | frozen | loops; Tab+Enter deletes | deleted | deleted |
| 844×390 @200 | frozen | Keep it → Delete → Close → (the scrolling text) → Keep it | deleted | deleted |
| 1440×900 @200 | frozen | loops | deleted | deleted |
| 375×667 @100, 390×844 dark @100 | frozen | loops | deleted | deleted |

- **Cause 1 (keyboard, every size):** React events bubble through portals. The dialog is rendered inside "Edit brew"'s form, so every Tab also reached the Edit sheet's `onKeyDown`; that panel is inert underneath, has no focusables, and called `preventDefault()`. Fix: a panel handles only Tab presses from inside itself (`Sheet.tsx`).
- **Cause 2 (touch, 375×667 @200):** art + title + description were taller than the room, the header doesn't shrink in portrait, and the panel's `overflow: hidden` clipped the footer. Fix: `useTight` measures that case and sets `data-tight`; the panel then scrolls as one column and the footer is pinned with a divider. It is not set when everything fits, and not in compact landscape (which already has its own scrolling header).
- **The same proof as a spec, on base:** `tests/w3-stats.spec.ts` run against :5478 fails all five "Tab reaches them in a loop" cases ("Received: Keep it") and the 375×667 @200 tap case ("off screen 641–698 of 667"); log `S/suites/w3-stats-on-base-CONTROL.log`.

**Other Sheet/Dialog uses (no regression; two more fixed).** `S/tools/sheetprobe.mjs` opens every sheet (Today: days warm, leaves, level; Settings: Start fresh?; Stats: badge, Edit brew, Delete; session: Ambience, End early < 1 min, End after 3 min), checks every button is on screen/on top/not clipped (or inside a scrolling area) and walks Tab. BEFORE `S/sheets/base-*`, AFTER `S/sheets/after-*` (+ `after-probes-run1-*.log` for 390×844 dark, 844×390 @200 and 1440×900 @200).

| Config | BEFORE | AFTER |
|---|---|---|
| 375×667 light @200 | **3 sheets broken**: Start fresh? (Keep my data at 674–737, Reset everything 747–846: off screen), End early < 1 min (Keep brewing 629–691, End session 699–755), Delete this brew? | all 10 reachable; Tab moves in all |
| 390×844 dark @100, 844×390 @200, 1440×900 @200 | all reachable; Delete this brew? Tab frozen | all reachable; Tab moves in all |

Settings' "Start fresh?" (G's screen) and the End sheet (F's) were the same defect in the shared component, so they are fixed with it; their own files are untouched.

### Misleading minutes (I12)

- **BEFORE:** a brew ended at 12:40 shows **"13 min"** in History (`hm()` rounded to nearest), while the End sheet says "12 minutes of focus will be saved", its leaves are 12 minutes' worth and the "Last 7 days" bar says 12. `w3-stats.spec.ts` "12:40" fails on :5478 (no "Today, 12 minutes focused" region).
- **AFTER:** 12 everywhere (whole minutes rounded down, the engine's count). Seeds use whole minutes, so seeded totals are unchanged (table below).

### Warm-days wording

- **BEFORE (:5478):** "Day streak", "Best streak", "Brew tonight", "Start a new streak", "Finish a brew to start your warm streak.", "One brew before midnight keeps it warm.", sr "Warm streak calendar for…", empty "Your streak, charts…", dialog "…stats and streak". The "never says streak" spec fails on base for empty, newbie, veteran, celebrate and atRisk (4 hits each).
- **AFTER:** none (the spec walks `main`'s textContent, incl. sr-only text, plus `aria-label`, `title`, `aria-description`, `alt`, `aria-valuetext`, svg titles).

### Backup round-trip test (`integrity.spec.ts`, now line 781; was 768)

- **Control (base :5478, `S/control-768/leaving-base.json`, `S/tools/leaving.mjs`):** right after `navigate('/settings')` from Today (veteran), at the first frame where Settings' h1 exists, the screen being left is still in the page (`[data-route-leaving]` = 1). The old whole-page read returned **"194 leaves" in 3 of the 4 runs** where Settings' h1 appeared within the 30 sampled frames (the final regression's exact value; run 0 had no h1 yet); in those same frames Settings' own Profile card read "2,251 leaves", the stored total, 4 of 4.
- **Fix:** wait for the hash, the h1, no leaving layer, and the card showing the stored total (formatted as the card formats it); read the pills from `main` › region "Profile" only. Not weakened: the before/after equality stands and the pills must now also equal the stored leaves.
- **Proof under load:** `--repeat-each=5 --workers=2 --fully-parallel` on :5502: **5/5 passed** (`S/suites/integrity-781-repeat5-w2.log`).

@@BEFOREAFTER@@

## Totals: shown vs recomputed from the seeded records

Frozen clock 2026-10-12 07:40 UTC (Monday), profile time zone UTC, 1440×900. `S/tools/totals.mjs` recomputes from `__kettle.progress` records on its own (local day of each brew's **end**, whole minutes rounded down) and reads the screen's text. Raw: `S/totals/after.json` (:5502), `S/totals/before.json` (:5478).

**veteran**

| Number | Recomputed | AFTER shows | BEFORE shows |
|---|---|---|---|
| Brews whose day ≠ local day of their end | 0 | – | – |
| Total focus (tile) | 23h 9m | 23h 9m | 23h 9m |
| Full brews (tile) | 50 | 50 | 50 |
| Today: focused | 50 min | 50 min | (no summary) |
| Today: full brews | 2 | 2 | (no summary) |
| Today: goal met (ledger) | no | no | (no summary) |
| Last 7 days: focused | 4h 35m | 4h 35m | 4h 35m |
| Last 7 days: days brewed | 7 | 7 | (no summary) |
| Last 7 days: days at goal | 1 | 1 | 1 |
| Last 7 days: a day on average | 39 min | 39 min | 39 min |
| Summary: last 7 days focused | 4h 35m | 4h 35m | (no summary) |
| History, newest 7 days (recomputed = shown) | 2026-10-12 (Today) 50 min = 50 min; 2026-10-11 (Yesterday) 25 min = 25 min; 2026-10-10 (Sat) 25 min = 25 min; 2026-10-09 (Fri) 1h 15m = 1h 15m; 2026-10-08 (Thu) 25 min = 25 min; 2026-10-07 (Wed) 25 min = 25 min; 2026-10-06 (Tue) 50 min = 50 min | | |

**celebrate**

| Number | Recomputed | AFTER shows | BEFORE shows |
|---|---|---|---|
| Brews whose day ≠ local day of their end | 0 | – | – |
| Total focus (tile) | 4h 22m | 4h 22m | 4h 22m |
| Full brews (tile) | 10 | 10 | 10 |
| Today: focused | 12 min | 12 min | (no summary) |
| Today: full brews | 0 | 0 | (no summary) |
| Today: goal met (ledger) | no | no | (no summary) |
| Last 7 days: focused | 3h 32m | 3h 32m | 3h 32m |
| Last 7 days: days brewed | 7 | 7 | (no summary) |
| Last 7 days: days at goal | 2 | 2 | 2 |
| Last 7 days: a day on average | 30 min | 30 min | 30 min |
| Summary: last 7 days focused | 3h 32m | 3h 32m | (no summary) |
| History, newest 7 days (recomputed = shown) | 2026-10-12 (Today) 12 min = 12 min; 2026-10-11 (Yesterday) 25 min = 25 min; 2026-10-10 (Sat) 25 min = 25 min; 2026-10-09 (Fri) 50 min = 50 min; 2026-10-08 (Thu) 25 min = 25 min; 2026-10-07 (Wed) 25 min = 25 min; 2026-10-06 (Tue) 50 min = 50 min | | |

**newbie**

| Number | Recomputed | AFTER shows | BEFORE shows |
|---|---|---|---|
| Brews whose day ≠ local day of their end | 0 | – | – |
| Total focus (tile) | 1h 29m | 1h 29m | 1h 29m |
| Full brews (tile) | 3 | 3 | 3 |
| Today: focused | 25 min | 25 min | (no summary) |
| Today: full brews | 1 | 1 | (no summary) |
| Today: goal met (ledger) | no | no | (no summary) |
| Last 7 days: focused | 1h 29m | 1h 29m | 1h 29m |
| Last 7 days: days brewed | 3 | 3 | (no summary) |
| Last 7 days: days at goal | 1 | 1 | 1 |
| Last 7 days: a day on average | 13 min | 13 min | 13 min |
| Summary: last 7 days focused | 1h 29m | 1h 29m | (no summary) |
| History, newest 7 days (recomputed = shown) | 2026-10-12 (Today) 25 min = 25 min; 2026-10-11 (Yesterday) 39 min = 39 min; 2026-10-10 (Sat) 25 min = 25 min | | |

Every shown number equals its recomputation; no brew's `day` differs from the local day of its end. The same comparison runs as a spec (`w3-stats.spec.ts`, "the summary and tiles match the history recomputed from its records", veteran/celebrate/newbie), with two live-clock cases the seeds can't show:

- **After midnight:** a brew started Sun 11 Oct 23:50 and finished after midnight is `day: 2026-10-12`; Stats shows it under History "Today", in the summary's Today, and on Monday in the chart's table (Sunday 0).
- **Ended early at 12:40:** 12 min in History's day total, the row's label, and the summary; leaves and the End sheet say 12.
- **DST:** `dst.test.ts` (new case): the last 7 days across fall-back are 7 calendar days, and a brew from Sat 23:50 ending Sun 00:15 counts on Sun 1 Nov (the 25 h day).
- **Ended late (app closed past the end):** the timer completes it at its real end with `day` = the local day it ended (`docs/areas/timer.md`, covered by `integrity.spec.ts` I01 and `src/timer` tests); Stats only reads `day`, so it follows. Not re-shot here.

Inspected and left alone (no evidence of a misleading number): the tiles, Cozy level, Last 7 days (rolling, goal from the ledger), the warm-days calendar, Personal bests and History grouping. Your rhythm and Badges were not changed and not audited number by number. No fictional records; the summary makes no claim about focus quality, skill or wellbeing ("focused" is minutes in a brew, as everywhere in Kettle).

## Suites

| Check | Where / command | Result | Log |
|---|---|---|---|
| Type-check | `npx tsc --noEmit` | exit 0 | `S/suites/tsc.log` |
| Unit | `npx vitest run` | 31 files, **292/292** (290 before + 2 new) | `S/suites/vitest.log` |
| `integrity.spec.ts`, whole file | `KETTLE_PORT=5502 … --workers=1` on `8158134` | **25/25 passed** (6.3 min) | `S/suites/integrity-full.log` |
| `integrity.spec.ts:781` (was :768) | `--repeat-each=5 --workers=2 --fully-parallel`, slot n 2, while other lanes ran | **5/5 passed** (1.4 min) | `S/suites/integrity-781-repeat5-w2.log` |
| `w3-stats.spec.ts` (new, 21 tests) | :5502 | @@W3STATS@@ | `S/suites/w3-stats.log` |
| `w3-stats.spec.ts` on base (control) | :5478 | 4 passed, **17 failed** as expected (F-T2-4 ×6, no summary ×4, 12:40 ×1, "streak" ×5, wording ×1) | `S/suites/w3-stats-on-base-CONTROL.log` |
| Sheet regression probe | every Sheet/Dialog, 6 configs | all reachable, Tab moves in all (AFTER) | `S/sheets/after-*` |
| Full chromium suite | — | **not run** (slot contention; out of time) | — |

The `:781` repeat ran on the server at `e73f8c4` (before the last Sheet CSS commit, which touches only tight sheets; the test's Reset sheet at 1280×720 is never tight).

## Preserve list

1. Visual identity: no palette or font change. The at-risk line and hint use the existing `--persimmon-ink` instead of `--berry-ink` (an invitation, not an alarm).
7. Accepted layouts: Sheet changes apply only when `data-tight` is set (the actions would otherwise be off screen); compact-landscape sheets keep their own layout; every other sheet/dialog is unchanged (probe above).
9. Progression: no leaves, levels, recipes, warm-day, Tea Cozy or badge arithmetic change; Stats only reads. Minutes are shown as the engine already counts them.
10. The empty Stats keeps its "Put the kettle on" action; the summary appears only once there is history.
11–12. No data, storage, dependency or id change.

## Wording (warm-days glossary, I13)

| Where | BEFORE | AFTER |
|---|---|---|
| Tile 1 | Day streak (hint "Brew tonight") | **Days warm** / Day warm (hint "One brew warms today") |
| Tile 2 | Best streak | **Warmest run**, value "N days" |
| Empty state | Your streak, charts and badges… | Your warm days, charts and badges… |
| Warm-days card, no run yet | Start a new streak · Finish a brew to start your warm streak. | **Warm days** · Finish one brew and today is a warm day. |
| …after a gap | Start a new streak · One brew today warms the kettle again. | **Ready for a warm day** · One brew today warms the kettle again. Your warmest run: N days. |
| …run alive, not yet today | Brew today to keep it going. | One brew today makes it N+1 warm days in a row. |
| …at risk (evening), Cozy ready | Brew tonight — or a Tea Cozy will keep it warm. | One brew today makes it N+1 warm days in a row. If today stays quiet, a Tea Cozy keeps the kettle warm. |
| …at risk, no Cozy | One brew before midnight keeps it warm. | One brew today makes it N+1 warm days in a row. |
| Calendar caption (sr) | Warm streak calendar for… | Warm days calendar for… |
| Delete dialog | …your history, stats and streak. | …your history, stats and warm days. |

The Tea Cozy sentence appears only when a Cozy is ready and today is still open (then it is true that one covers today); no threat, countdown or loss words.

## Open findings

- **BEFORE/AFTER captures are incomplete** (see the table: what is not listed was not captured before the stop, because of slot contention). Missing configurations are unproven visually; the probes and specs above cover the behaviour at 375×667, 390×844, 844×390 and 1440×900.
- **Full chromium suite not run.**
- In a tight sheet the × scrolls away with the content (Esc and the pinned actions stay). FOLLOW-UP at most.
- Compact landscape: the dialog's scrolling header is a Tab stop (Chrome's focusable scrollers). Same on base; harmless (it lets the keyboard scroll the text). ACCEPTED.
- The session summary (`done/summary.ts`, not S's) rounds a brew's minutes to nearest (`Math.round`); everything else, now including Stats, rounds down. FOLLOW-UP for its owner.

## Cross-owner requests

- **G (Settings):** keep `aria-label="Profile"` on the profile card and its pill texts ("Level N", "N leaves", "N days warm"): `integrity.spec.ts` now reads them there. "Start fresh?" still says "warm streak" (`DataSection.tsx`, G's glossary item). The Sheet fix also makes its buttons reachable at 375×667 @200.
- **F:** the badge description "Keep a {n}-day warm streak" (`progress/badges.ts`, F's) shows in Stats' badge sheet; `w3-stats.spec.ts` checks `main` only, so it does not cover that sheet. The End sheet (<1 min) is now reachable at 375×667 @200 through the shared Sheet fix; no change in F's files.
- **Lead:** the summary's week is the rolling "Last 7 days" (as the chart below and docs/areas/progress.md), not a calendar week; on the frozen Monday a calendar week would equal "Today". Say if a calendar "This week" is wanted instead.
