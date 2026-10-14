# CHECKER W3R1 · Maker S: Stats and History (I12), F-T2-4, the backup test

**Verdict: REJECT** `pe/w3-stats@344069c` (code `8158134`, kettle/src `20a4698`), as gated in trial `c7a6b8f`. There is one 90-minute fix round, for one defect. After it, the verdict is final.

**Defect (§3; the fix-round packet is §6):**
- **S-D1:** the new "Warmest run" tile does not fit at 200 %.
  - **With the fonts loaded:** its label is cut to "Warm… run", and its new value "23 days" is cut at the tile's edge (390×844 and 844×390 @200).
  - **Before the web fonts arrive** (a first, cold load), the same tile runs past the screen. The phone page is laid out **408 px wide** at 390×844 (401 at 375×667), so Chrome zooms it out.
  - **That is the proven cause of the combined trial's `w3-stats:98` failure:** the tap on a History row landed on page coordinates the row no longer had.

**Vibei's §2 holds:**
- the summary's label is exactly **"Last 7 days"** (rolling, the same series as the chart below);
- warm days, Tea Cozy and badges keep their calendar logic;
- Lane I's test across a calendar-week boundary passed 3/3, with engine values, calendar labels and badge tiers identical to base;
- the engine files are byte-identical to base.

**Everything else verifies (§2):**
- **F-T2-4:** fixed at all 16 configurations, by tap and Tab, and it also fixes "Start fresh?" and the End sheet at 375×667 @200. No sheet regressed.
- **Stats truth:** totals match an independent recompute.
- **The backup test:** hardened, not weakened.
- **Warm-days wording:** in the glossary.

| | |
|---|---|
| Lead checker | LEAD-5 (replaces LEAD-4, cut by a usage limit). I implemented none of this work |
| Under review | `pe/w3-stats@344069c`. `git rev-parse c7a6b8f:kettle/src` = `20a4698…` (Lane I; gate) |
| Trial | `c7a6b8f` = integration + `344069c`; worktree `/home/user/wt/w5tr-s`; dev :5522, preview :5532. `git diff --stat 4d36939 c7a6b8f -- kettle/src kettle/tests` = S's 13 files only |
| Base / control | `4d36939` (src `5cd9a44`); dev :5478 |
| Packet | `/home/user/wt/w5s/kettle/review/product-excellence/contracts/W3R1/S-READY-FOR-REVIEW.md`; evidence `…/W3R1/S/` |
| Lane I | `review/LI/S/RECEIPT-LI-S.md` (complete at `ee72d61`), raw evidence beside it (55 MB) |
| My evidence | `contracts/W3R1/review/LEAD/S/`:<br>• `lead-s-width.mjs` → `width/lead-s-width-{TRIAL,BASE}.json`, `width/{TRIAL,BASE}.log`, `width/*-overview.png` (page width over 6 s, with and without the web fonts; cut tile text);<br>• `lead-s-wide-el.mjs` → `width/wide-el.log`, `width/TRIAL-390x844-200-mobile-nofonts-viewport.png` (which element is past the edge) |

## 1. What I did

### Read
- `PLAN.md`, `BRIEF-S.md`, `VB-DECISIONS-RESUME.md` (§2 binds the rolling week), `review/GATE.md`, the preserve list, the house style.
- The packet in full.
- Lane I's receipt in full.
- The diffs of `StatsScreen.tsx` (the tiles and the summary mount), `Stat.tsx` (doc comment only), `format.ts` (`Math.round` → `Math.floor` in `hm` / `hmLong`, with the policy cited) and `Glance.tsx` (the label at l.75: `Last 7 days <span …>{dayRange(…)}</span>`).
- `git diff --stat 4d36939 c7a6b8f -- kettle/src/progress` = `dst.test.ts` only (+13).

### Ownership
Every changed file is in S's set:
- `screens/stats/{Glance (new), History, StatsScreen, StreakCard, format, format.test, stats.module.css}`;
- `ui/{Sheet.tsx, Sheet.module.css, Stat.tsx}` (S's this round);
- `progress/dst.test.ts`;
- `tests/{integrity, w3-stats}.spec.ts`.

There is no rule, arithmetic, stored-data, id, palette or font change. The at-risk line uses the existing `--persimmon-ink` token.

### Vibei §2, checked against Lane I's raw files
I read `LI/S/weekboundary/{A-mon-enGB,B-sun-enUS,C-sun-enGB}.json`:
- In all three cases, `engine`, `sessions`, `weekCard`, `calendar` (every calendar cell's label) and `badges` (every badge button's label) are **equal** between base and trial.
- The stored badge **tiers** are equal (e.g. A: warm-streak 3, weekend-warmth 1, …). Only the `unlockedAt` milliseconds differ, from the two recordings.
- `LI-week.log`: **3 passed**.
- The summary total is the rolling sum, and it differs from the calendar-week sum in A and B.
- The label's words are exactly "Last 7 days" (the date range is a separate span). The chart card's own label was already "Last 7 days" on base.

### My own runs (S-D1), through the slot gate
`lead-s-width.mjs`: Stats, seed `veteran`, frozen Monday; page width sampled every 50 ms for 6 s from the first frame; the web fonts loaded (normal) or blocked (`*.woff2` aborted: the state of a first load before the fonts arrive, or with them failing).

| Config | Base: layout width / cut tile text | Trial: layout width / cut tile text |
|---|---|---|
| 390×844 @200, `isMobile`, fonts **blocked** | 390 / "Day streak", "Best streak", "Full brews" (fallback font) | **408** / "Warmest run", "Full brews" |
| 375×667 @200, `isMobile`, fonts **blocked** | 375 / the same three | **401** / "Days warm", "Warmest run", "Full brews" |
| 390×844 @200, `isMobile`, fonts loaded | 390 / **none** | 390 / **"Warmest run" (120 > 111 px)** |
| 844×390 @200 (desktop and `isMobile`), fonts loaded | 844 / **none** | 844 / **"Warmest run" (120 > 111 px)** |
| 844×390 @200, fonts blocked | 844 / the same three | 844 / "Days warm", "Warmest run", "Full brews" |

**What is past the edge** (`lead-s-wide-el.mjs`, 390×844 @200 `isMobile`, fonts blocked):
- **trial:** the tile's value `DIV._value` "23 days", its `SPAN._tileUnit` "days" and `DIV._label` "Warmest run", all with their right edge at 408;
- **base:** nothing past 390.

### Opened at full size
- `width/TRIAL-844x390-200-desk-fonts-overview.png`: the second tile reads "23 day…" over "Warm… run". The third tile's "23h 9…" / "Total foc…" is cut too, but that is the base's own (Lane I §7; FOLLOW-UP).
- `width/TRIAL-390x844-200-mobile-nofonts-viewport.png`: the page drawn zoomed out (408 px into 390).
- Lane I's K07 and delete-dialog frames as listed in its §7. I did not re-open its 64 full-page captures; their numbers are in its table.

## 2. What verifies (kept for the fix round)

| Item | Result | Source |
|---|---|---|
| **F-T2-4, controls first** | **Base, every config tried (9 of 16):** Tab and Shift+Tab frozen on "Keep it", so Delete cannot be reached by keyboard; at 375×667 @200 light and dark, Delete is off screen (641–698 of 667).<br>**Trial, all 16 (4 sizes × light/dark × @100/@200):** Keep it and Delete tappable; Tab cycles Delete → Close → Keep it, and Shift+Tab back, every stop inside the top dialog; `data-tight` at 375×667 @200.<br>**Escape and backdrop** close only the dialog and return focus to "Delete this brew"; **Keep it** keeps the brew (83).<br>**Delete** (Tab+Enter) removes it (83 → 82) and leaves the inline Undo.<br>**The cause the maker gives** (portal-bubbled Tab handled by the inert Edit sheet underneath; the panel clipping its footer) is consistent with the change in `Sheet.tsx` | Lane I §1; packet |
| **Every other `ui/Sheet.*` use** (12 uses; probe at 375×667 @200 light/dark and 1440 light @100 / dark @200) | **Base at 375×667 @200:** "Start fresh?", "Delete this brew?" and the End sheet (< 1 min) have controls off screen. **Trial:** all reachable with the footer pinned.<br>**Every sheet:** trap ✓; Escape and backdrop close exactly one sheet and return focus to its opener; no sheet regressed. The last three 1440 dark @200 rows are in Lane I's log | Lane I §2b |
| **`w3-stats:98`** | 5/5 on trial :5522 and 5/5 on combined :5520, warm server. Lane R's one failure is S-D1's cold-load width (§3) | Lane I §2a; my runs |
| **Stats truth** | veteran, celebrate and newbie: **every shown number equals Lane I's own recompute** from the records (Today, the summary's Last 7 days, the chart card and bars, tiles, personal bests, every History day group and row). 0 brews on a day other than the local day they ended. The after-midnight brew (Sun 23:50 → Mon 00:15) counts on Monday, its row reading "23:50" (the policy, same on base). Minutes round down, as the engine counts them (`engine.ts:150–155`, `insights.ts:95`) | Lane I §4, §3 case A |
| **Nothing invented** | Every summary number is computed from the records or already on base. The only new count is "Brewed on N of 7 days", recomputed and matching. No claim about quality, skill or wellbeing | Lane I §4 |
| **The backup test** | One hunk in `profilePills` (+21 / −4). It waits for the hash, no leaving route, and the Profile card showing the stored total, then reads that card only. **No `expect` removed;** the before/after equality stands. Whole file 25/25; the test `--repeat-each=5 --workers=2` 5/5 | Lane I §6 |
| **Warm-days wording and I13 in S's files** | "streak" hits in Stats `main`, Edit brew and the delete dialog: base 2–3 per case, trial **0** in every case (sr text, labels and titles included).<br>**Tea Cozy sentence:** shown only when the run is alive, today is not yet warm, it is ≥ 18:00 and a Cozy is held; Lane I §5b showed it there and absent otherwise. It is true by `streak.ts`.<br>**Missed-day and return lines:** they invite ("Ready for a warm day · One brew today warms the kettle again.") with no threat or loss words. The badge sheet's "Keep a N-day warm streak" is F's `badges.ts`, fixed on F's branch | Lane I §5, §5b |
| **REFERENCE (K07) → BEFORE → AFTER** | 64 full-page captures (16 configs × empty / veteran × 2 builds). The empty state keeps K07's structure and the "Put the kettle on" action, with words changed only. History: the same groups and rows, shifted down by the summary. `scrollWidth` identical B/A in all 32 pairs with fonts loaded | Lane I §7 |
| **Suites** | tsc 0; vitest 292/292; integrity 25/25; `w3-stats` 21/21 (17 fail on base, controls first) | Packet; Lane I §6 |

## 3. Defect

### S-D1 · The "Warmest run" tile does not fit at 200 %: its label and value are cut once the fonts load, and before they load it pushes the phone page to 408 px wide (BLOCKS, introduced)

**Where.**
- `src/screens/stats/StatsScreen.tsx` (the second Overview tile): `value` = `{streak.best}<span className={s.tileUnit}> days</span>`, `label="Warmest run"`.
- Its styles: `stats.module.css` `.tileUnit` and `ui/Stat.tsx`.
- The base tile was `value="23"`, `label="Best streak"`.

**Measured** (§1, my runs; Lane I §7):
- **Fonts loaded:**
  - the label "Warmest run" is cut (scrollWidth 120 > 111 px; on screen "Warm… run") at 390×844 @200 and 844×390 @200;
  - the value "23 days" is cut at the tile's edge ("23 day…").
  - Base: no tile text cut in the same configs.
- **Fonts not yet loaded** (a first, cold load, or fonts failing; emulated by blocking `*.woff2`):
  - the tile's value and label run to x = 408;
  - under `isMobile` Chrome lays the page out **408 px wide at 390×844 @200, 401 px at 375×667 @200**, and draws it zoomed out;
  - base stays at 390 / 375, with nothing past the edge.

**What it broke.** Lane R's combined run failed `w3-stats:98` because of this:
- The run is in `review/LR/ALL/runs/full-C-cut.log`. Lane I read its trace (`LI/S/spec98/`) and found the layout viewport **408×883 at the tap**, with the tile "23 da…" cut at the right in the frame just before.
- The tap on the first History row landed where the row no longer was, so "Edit brew" never opened.
- Lane I saw 408 px on the first cold load of the trial and the combined builds only, never on base. My blocked-font run reproduces it every time and names the element.

**Why it blocks.** It is introduced by S's tile change. A person who opens Stats on a slow first load sees a zoomed-out page whose taps can miss. With the fonts loaded, the tile S reworded shows a cut label and a cut value at two of the brief's sizes.

**Required** (S's files: `StatsScreen.tsx`, `stats.module.css`, `ui/Stat.tsx`):
- The tile keeps the glossary form: "Warmest run" with "N days", or "Warmest run · N days".
- It fits at every size and text size, with the fonts loaded and without them.
- The approach is the maker's: for example, the unit wraps under the number, or the value and label are allowed to wrap rather than overflow.

## 4. Residuals (rule: BLOCKS = introduced or worsened by this change; FOLLOW-UP = present on the base and not worse, or ruled so by Vibei; ACCEPTED = not a defect)

| # | Item | My check | Class | Owner |
|---|---|---|---|---|
| S-D1 | The "Warmest run" tile overflows at 200 % (cut text; 408 px page before the fonts load) | §1, §3 | **BLOCKS** | S (fix round) |
| S-R1 | **"Total focus" tile cut** at 844×390 @200 ("23h 9…" / "Total foc…"); with no web fonts, "Full brews" also cut | Same on base (Lane I §7; my fallback-font run) | **FOLLOW-UP** (pre-existing). May be fixed with S-D1 if the same change does it | S / I12 |
| S-R2 | **Today's warm-days and leaves sheets become `data-tight` at 375×667 @200**, although base reached everything there. The whole panel, header included, scrolls under the pinned footer | Lane I §2b: all reachable, trap ✓, focus returns. The packet says tight is "never set when everything fits"; these two still needed a scroll on base | **ACCEPTED** (not a defect; the packet's claim is slightly too broad) | — |
| S-R3 | **In a tight sheet the × scrolls away** with the content (Escape, the backdrop and the pinned actions stay) | Maker's note | **FOLLOW-UP** | S / Sheet |
| S-R4 | **Focus after deleting by keyboard:** the inline Undo in 14 of 16 configs, `<main>` in 2 (390×844 light @200, 1440 light @200). A tap-delete puts focus on `<main>` on both builds | Lane I §1; base could not delete by keyboard at all | **FOLLOW-UP** (unproven timing; not worse) | S |
| S-R5 | **The summary makes the populated page longer:** +178–316 px at @100, +286–617 px at @200; at 1440 its two halves leave empty space at the right of each column | It is the brief's item 2 (a summary at the top); nothing is covered | **ACCEPTED** (design) | — |
| S-R6 | **Empty state at 390:** "0 days / Warmest run" wraps, so the tile row grows ~18 px | Fits; no cut | **ACCEPTED** | — |
| S-R7 | **`done/summary.ts` rounds minutes to nearest, while Stats now rounds down** | A completed brew is whole minutes and the engine already floors `afterMin`, so no visible difference is possible (CHECKER-W3R1-F §4 F-R11) | **ACCEPTED** | — |
| S-R8 | **The badge sheet says "Keep a N-day warm streak"** | F's `badges.ts`, changed on F's branch ("Brew {n} warm days in a row") | **Not S's**; resolved by F | F |
| N-2 | The History Undo read races the focus scroll when the tapped row takes focus (~110 px), `History.tsx` | Cross-owner from F; S did not change it | **FOLLOW-UP** | S |
| E-1 | **Evidence gaps,** not defects:<br>• base delete dialog at 7 of 16 configs (trial at all 16);<br>• the non-Stats sheets at 390×844 and 844×390;<br>• "ended late" and DST in a browser (cited from code, docs and unit tests);<br>• a non-whole-minute brew in a browser (the maker's "12:40" spec passed in Lane R's rerun);<br>• the full chromium suite on S's trial (Lane R's combined run covers it) | — | Noted | Final regression |

## 5. Lane I receipt (`review/LI/S/RECEIPT-LI-S.md`), and my checks of it

**Read in full.** I checked:
- **Vibei §2:** the three `weekboundary/*.json` files myself (§1); `LI-week.log` shows 3 passed.
- **Engine unchanged:** `git diff --stat 4d36939 c7a6b8f -- kettle/src/progress` (`dst.test.ts` only).
- **The label:** `Glance.tsx:75`.
- **The tile:** the `StatsScreen.tsx` diff.
- **The transient width (its §2a, §2c, "unproven" origin):** I closed it. Blocking the web fonts reproduces 408 px every time on the trial and never on base, and names the "Warmest run" tile (§1). Lane I's warm-server runs did not see it because the fonts were cached by then.

**The receipt's other limits** are carried in §4 E-1.

## 6. Fix round (90 minutes, one round; S's files only)

**Where.** Work on `pe/w3-stats` in `/home/user/wt/w5s`, from `344069c`. Commit locally and never push.

**Hand back** `contracts/W3R1/S-FIX-READY.md`, with evidence in `contracts/W3R1/S/fix/` (full-size PNGs, logs, JSON), giving:
- the new hash and the `kettle/src` tree hash;
- each check below with its result and paths.

**Files you may change:** `src/screens/stats/StatsScreen.tsx`, `src/screens/stats/stats.module.css`, `src/ui/Stat.tsx`, and `tests/w3-stats.spec.ts`. Nothing else: no `Sheet.*` change, no wording change beyond the tile's own form.

### Acceptance checks (all must hold; I rerun the ones marked ◆)
1. **◆ Scope.** `git diff --stat 344069c <fix> -- kettle/` lists only the files above (plus packet and evidence).
2. **◆ Fits with the fonts loaded.** On Stats with seed `veteran`, and with the empty state, at all 16 configs (390×844, 375×667, 844×390, 1440×900 × light/dark × 100/200 %):
   - no text in the "Days warm" or "Warmest run" tile is cut: for every text element in the Overview tiles, `scrollWidth ≤ clientWidth`, and no ellipsis;
   - no tile's content passes the tile's right edge.

   Give the table (base / trial / fix) and full-size crops of the Overview at 390×844 @200 and 844×390 @200, light and dark.
3. **◆ Fits before the fonts arrive.** With the web fonts blocked (`*.woff2` requests aborted), at 390×844 and 375×667 @200 with `isMobile`, the layout width stays 390 / 375 throughout the first 6 s, with nothing past the right edge. Base and trial go beside it.
   - My probes do exactly this and can be reused: `contracts/W3R1/review/LEAD/S/lead-s-width.mjs` and `lead-s-wide-el.mjs`.
   - A spec test asserts it (fonts blocked, `isMobile`, 390×844 @200: `scrollWidth ≤ innerWidth === 390`).
4. **◆ The glossary form stays.** "Warmest run" with "N days" (or "Warmest run · N days"), "Days warm" / "Day warm"; no "streak"; the at-risk hint unchanged.
5. **◆ `w3-stats:98` on a cold load.** Run `w3-stats.spec.ts` ×2, 21/21 plus the new test. The `:98` cases must also pass with the fonts blocked.
6. **No regression.** The `w3-stats` totals and wording tests pass; `integrity.spec.ts` 25/25; tsc; vitest. The Overview's height at 375×667 @200 is reported against the trial.

## 7. BEFORE / AFTER for Vibei (full size)

**REFERENCE:** K07 `contracts/W3R1/review/LI/S/reference/K07-live-stats-empty.jpg`.

**Stats, full page** (Lane I, 16 configs × empty / veteran; `contracts/W3R1/review/LI/S/captures/`):
- BEFORE: `BEFORE-base-4d36939/<w>x<h>-<theme>-<100|200>-<empty|veteran>.png`;
- AFTER: `AFTER-trial-c7a6b8f/…` (same names).

**The summary at the top** (the maker's, 375×667): `/home/user/wt/w5s/kettle/review/product-excellence/contracts/W3R1/S/shots/{before,after}/375x667-{light,dark}-t{100,200}/S02-veteran-top.png`.

**"Delete this brew?" at 375×667 @200** (F-T2-4):
- BEFORE: `…/S/control-ft24/base-375x667-light-t200-dialog.png` (Delete cut off);
- AFTER: `…/S/control-ft24/after-375x667-light-t200-dialog.png` (tight, both actions pinned).

**The other sheets fixed at 375×667 @200:** `contracts/W3R1/review/LI/S/sheets/base-all/375x667-light-200-{settings-reset,focus-end}.png` and the trial's beside them.

**S-D1:**
- `contracts/W3R1/review/LEAD/S/width/TRIAL-844x390-200-desk-fonts-overview.png` ("Warm… run", "23 day…") against `BASE-844x390-200-desk-fonts-overview.png`;
- `TRIAL-390x844-200-mobile-nofonts-viewport.png` (the zoomed-out page).
