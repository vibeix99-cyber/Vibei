# W3R1 Maker S: fix round (S-D1), ready for review

- **Branch:** `pe/w3-stats`, from `344069c`. Local commits only.
- **Hash / src tree:** given in the last section (written last).
- **Evidence:** `contracts/W3R1/S/fix/` (probe `S/fix/tools/fitprobe.mjs`, pipeline `S/fix/tools/fixpipe.sh`; every browser run through `slots.py run --lane S --n 1`).

## The defect and the fix

- **S-D1:** with 200 % text, two Overview tiles a row leave about 90 px for the text. "Warmest run" / "23 days" were cut ("Warm… run", "23 day…"). The nowrap values also overflowed: "23h 9m" ran past its tile, and before the web fonts arrived "23 days" pushed a phone page to 408 px (390×844) or 401 px (375×667).
- **Fix (`stats.module.css` only):** the tiles go one a row when the column is narrower than **21rem**. That is 336 px at 100 %, so phones keep two tiles a row exactly as before. At 200 % it is 672 px, so tiles go one a row with the icon beside the text. Nothing else changed: no wording, value, `Stat.*` or `Sheet.*` edit.
- **Tests (`w3-stats.spec.ts`):**
  - the delete-dialog cases (the old `:98`, now `:101`) also run at 390×844 and 375×667 @200 with fonts blocked;
  - new: tile text fits at 390×844, 375×667 and 844×390 @200;
  - new: with fonts blocked (`isMobile`, 390×844 and 375×667 @200), `scrollWidth ≤ innerWidth`, which equals 390 / 375, and the tiles fit.

## Check 1: scope

`git diff --stat 344069c <fix> -- kettle/` lists:
- `kettle/src/screens/stats/stats.module.css` (+15);
- `kettle/tests/w3-stats.spec.ts`;
- this packet and `S/fix/` evidence.

## Check 2: tile text fits with the fonts loaded (16 configurations × veteran and empty)

`S/fix/tools/fitprobe.mjs --mode fit`: frozen 2026-10-12 07:40 UTC, real load, after `document.fonts.ready`. For every text element in each Overview tile it checks two things:
- `scrollWidth ≤ clientWidth`;
- a Range over its text ends inside the tile's right edge.

The second catches nowrap values that overflow visibly, which a `scrollWidth` check alone misses. Raw results: `S/fix/fit/{BASE,TRIAL,FIX}-fit.json` and `.log`.

| Config | Seed | BASE 4d36939 :5478 | TRIAL c7a6b8f :5522 | FIX :5502 |
|---|---|---|---|---|
| 390x844-light-100 | veteran | fits (2 col, h 159, page 390/390) | fits (2 col, h 159, page 390/390) | fits (2 col, h 159, page 390/390) |
| 390x844-light-100 | empty | fits (2 col, h 159, page 390/390) | fits (2 col, h 159, page 390/390) | fits (2 col, h 159, page 390/390) |
| 390x844-light-200 | veteran | **cut/past:** "23h 9m", "23h 9mTotal focus", "Total focus" (2 col, h 319, page 390/390) | **cut/past:** "23 days", "23 daysWarmest run", "23h 9m", "23h 9mTotal focus", "Total focus", "Warmest run" (2 col, h 319, page 390/390) | fits (1 col, h 504, page 390/390) |
| 390x844-light-200 | empty | **cut/past:** "0 min", "0 minTotal focus", "Total focus" (2 col, h 319, page 390/390) | **cut/past:** "0 daysWarmest run", "0 min", "0 minTotal focus", "Total focus", "Warmest run" (2 col, h 319, page 390/390) | fits (1 col, h 504, page 390/390) |
| 390x844-dark-100 | veteran | fits (2 col, h 159, page 390/390) | fits (2 col, h 159, page 390/390) | fits (2 col, h 159, page 390/390) |
| 390x844-dark-100 | empty | fits (2 col, h 159, page 390/390) | fits (2 col, h 159, page 390/390) | fits (2 col, h 159, page 390/390) |
| 390x844-dark-200 | veteran | **cut/past:** "23h 9m", "23h 9mTotal focus", "Total focus" (2 col, h 319, page 390/390) | **cut/past:** "23 days", "23 daysWarmest run", "23h 9m", "23h 9mTotal focus", "Total focus", "Warmest run" (2 col, h 319, page 390/390) | fits (1 col, h 504, page 390/390) |
| 390x844-dark-200 | empty | **cut/past:** "0 min", "0 minTotal focus", "Total focus" (2 col, h 319, page 390/390) | **cut/past:** "0 daysWarmest run", "0 min", "0 minTotal focus", "Total focus", "Warmest run" (2 col, h 319, page 390/390) | fits (1 col, h 504, page 390/390) |
| 375x667-light-100 | veteran | fits (2 col, h 159, page 375/375) | fits (2 col, h 177, page 375/375) | fits (2 col, h 177, page 375/375) |
| 375x667-light-100 | empty | fits (2 col, h 159, page 375/375) | fits (2 col, h 177, page 375/375) | fits (2 col, h 177, page 375/375) |
| 375x667-light-200 | veteran | **cut/past:** "23h 9m", "23h 9mTotal focus", "Total focus" (2 col, h 319, page 375/375) | **cut/past:** "23 days", "23 daysWarmest run", "23h 9m", "23h 9mTotal focus", "Total focus", "Warmest run" (2 col, h 319, page 375/375) | fits (1 col, h 504, page 375/375) |
| 375x667-light-200 | empty | **cut/past:** "0 min", "0 minTotal focus", "Total focus" (2 col, h 319, page 375/375) | **cut/past:** "0 daysWarmest run", "0 min", "0 minTotal focus", "Total focus", "Warmest run" (2 col, h 319, page 375/375) | fits (1 col, h 504, page 375/375) |
| 375x667-dark-100 | veteran | fits (2 col, h 159, page 375/375) | fits (2 col, h 177, page 375/375) | fits (2 col, h 177, page 375/375) |
| 375x667-dark-100 | empty | fits (2 col, h 159, page 375/375) | fits (2 col, h 177, page 375/375) | fits (2 col, h 177, page 375/375) |
| 375x667-dark-200 | veteran | **cut/past:** "23h 9m", "23h 9mTotal focus", "Total focus" (2 col, h 319, page 375/375) | **cut/past:** "23 days", "23 daysWarmest run", "23h 9m", "23h 9mTotal focus", "Total focus", "Warmest run" (2 col, h 319, page 375/375) | fits (1 col, h 504, page 375/375) |
| 375x667-dark-200 | empty | **cut/past:** "0 min", "0 minTotal focus", "Total focus" (2 col, h 319, page 375/375) | **cut/past:** "0 daysWarmest run", "0 min", "0 minTotal focus", "Total focus", "Warmest run" (2 col, h 319, page 375/375) | fits (1 col, h 504, page 375/375) |
| 844x390-light-100 | veteran | fits (2 col, h 159, page 829/844) | fits (2 col, h 177, page 829/844) | fits (2 col, h 177, page 829/844) |
| 844x390-light-100 | empty | fits (2 col, h 159, page 829/844) | fits (2 col, h 177, page 829/844) | fits (2 col, h 177, page 829/844) |
| 844x390-light-200 | veteran | **cut/past:** "23h 9m", "23h 9mTotal focus", "Total focus" (2 col, h 319, page 829/844) | **cut/past:** "23 days", "23 daysWarmest run", "23h 9m", "23h 9mTotal focus", "Total focus", "Warmest run" (2 col, h 319, page 829/844) | fits (1 col, h 504, page 829/844) |
| 844x390-light-200 | empty | **cut/past:** "0 min", "0 minTotal focus", "Total focus" (2 col, h 319, page 829/844) | **cut/past:** "0 daysWarmest run", "0 min", "0 minTotal focus", "Total focus", "Warmest run" (2 col, h 319, page 829/844) | fits (1 col, h 504, page 829/844) |
| 844x390-dark-100 | veteran | fits (2 col, h 159, page 829/844) | fits (2 col, h 177, page 829/844) | fits (2 col, h 177, page 829/844) |
| 844x390-dark-100 | empty | fits (2 col, h 159, page 829/844) | fits (2 col, h 177, page 829/844) | fits (2 col, h 177, page 829/844) |
| 844x390-dark-200 | veteran | **cut/past:** "23h 9m", "23h 9mTotal focus", "Total focus" (2 col, h 319, page 829/844) | **cut/past:** "23 days", "23 daysWarmest run", "23h 9m", "23h 9mTotal focus", "Total focus", "Warmest run" (2 col, h 319, page 829/844) | fits (1 col, h 504, page 829/844) |
| 844x390-dark-200 | empty | **cut/past:** "0 min", "0 minTotal focus", "Total focus" (2 col, h 319, page 829/844) | **cut/past:** "0 daysWarmest run", "0 min", "0 minTotal focus", "Total focus", "Warmest run" (2 col, h 319, page 829/844) | fits (1 col, h 504, page 829/844) |
| 1440x900-light-100 | veteran | fits (2 col, h 159, page 1425/1440) | fits (2 col, h 159, page 1425/1440) | fits (2 col, h 159, page 1425/1440) |
| 1440x900-light-100 | empty | fits (2 col, h 159, page 1425/1440) | fits (2 col, h 159, page 1425/1440) | fits (2 col, h 159, page 1425/1440) |
| 1440x900-light-200 | veteran | fits (2 col, h 246, page 1425/1440) | fits (2 col, h 282, page 1425/1440) | fits (1 col, h 504, page 1425/1440) |
| 1440x900-light-200 | empty | fits (2 col, h 246, page 1425/1440) | fits (2 col, h 282, page 1425/1440) | fits (1 col, h 504, page 1425/1440) |
| 1440x900-dark-100 | veteran | fits (2 col, h 159, page 1425/1440) | fits (2 col, h 159, page 1425/1440) | fits (2 col, h 159, page 1425/1440) |
| 1440x900-dark-100 | empty | fits (2 col, h 159, page 1425/1440) | fits (2 col, h 159, page 1425/1440) | fits (2 col, h 159, page 1425/1440) |
| 1440x900-dark-200 | veteran | fits (2 col, h 246, page 1425/1440) | fits (2 col, h 282, page 1425/1440) | fits (1 col, h 504, page 1425/1440) |
| 1440x900-dark-200 | empty | fits (2 col, h 246, page 1425/1440) | fits (2 col, h 282, page 1425/1440) | fits (1 col, h 504, page 1425/1440) |

FIX: 32/32 runs with every tile text fitting.

Base shows the same overflow for "23h 9m" / "0 min" at 200 %. That is the value running past its tile, the same family as S-D1; the fix covers it too.

**Overview crops at 200 % (full size):**
- FIX: `S/fix/fit/FIX-{390x844,844x390}-{light,dark}-200-overview.png`;
- TRIAL: `S/fix/fit/TRIAL-…` (same names; "Warm… run", "23 day…");
- BASE: `S/fix/fit/BASE-…` (same names).

**Overview height:**

| Configuration | Trial | Fix | Why |
|---|---|---|---|
| 375×667 @200 | 319 px | 504 px | one tile a row: +185 px, the cost of fitting |
| 375×667 @100 | 177 px | 177 px | unchanged |
| 1440×900 @200 | 282 px, 2 a row | 504 px, 1 a row | the 21rem threshold also applies to the desktop column at 200 %; every text fits in both |

## Check 3: fits before the fonts arrive (fonts blocked)

`fitprobe.mjs --mode nofonts`: `*.woff2/woff/ttf/otf` aborted, `isMobile`, 200 % text, width sampled every 50 ms for 6 s. Logs: `S/fix/fit/{BASE,TRIAL,FIX}-nofonts.log` and `.json`.

| Size | BASE :5478 | TRIAL :5522 | FIX :5502 |
|---|---|---|---|
| 390×844 | max 390 / 390; tiles cut (Day streak, Best streak, Total focus, Full brews) | **max 408 / 408**; tiles cut | **max 390 / 390, 0 of 117 samples wide; every tile text fits** |
| 375×667 | max 375 / 375; tiles cut | **max 401 / 401**; tiles cut | **max 375 / 375, 0 of 120 samples wide; every tile text fits** |

Shots (full size):
- FIX: `S/fix/fit/FIX-{390x844,375x667}-200-mobile-nofonts-{viewport,overview}.png`;
- TRIAL: `S/fix/fit/TRIAL-…` (the zoomed-out page);
- BASE: `S/fix/fit/BASE-…`.

**As a spec test:** "Stats before the web fonts arrive, 390×844 (and 375×667), 200 % text". It checks:
- `isMobile`, fonts blocked, and that 0 fonts loaded;
- `innerWidth` equals 390 / 375 and `scrollWidth ≤ innerWidth` in each of 20 samples over 2 s;
- every tile text fits.

## Check 4: the glossary form stays

- **Unchanged:** "Days warm" / "Day warm", "Warmest run" with "N days", and the at-risk hint "One brew warms today". `StatsScreen.tsx` is untouched.
- **No "streak":** the 5 "never says streak" tests pass in both runs.
- **The summary's label** is still exactly "Last 7 days" (VB decision §2); `Glance.tsx` is untouched.

## Check 5: `w3-stats` twice, including cold loads

`w3-stats.spec.ts` now has 30 tests: the 21 from before, plus 4 delete-dialog cases with fonts blocked, 3 tile-fit cases and 2 blocked-font width cases.

| Run | Server | Result | Log |
|---|---|---|---|
| 1 | :5502 at `1d899b3` | **30/30 passed** (4.0 min) | `S/fix/suites/w3-stats-run1.log` |
| 2 | :5502 at `1d899b3` | **30/30 passed** (4.2 min) | `S/fix/suites/w3-stats-run2.log` |

The old `:98` cases are now at `:101` ("both choices can be tapped, and Tab reaches them in a loop"). Each run passes them at all seven configurations, including "390×844 with 200 % text, fonts blocked" and "375×667 with 200 % text, fonts blocked".
