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
