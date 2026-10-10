# L4 REGRESSION RECEIPT: PARTIAL (phase 2 stopped by user instruction)

**Status: PARTIAL. This is not a pass and not a fail of anything. The Wave 1 regression was NOT run.**

Phase 2 was stopped by the user's order, relayed by the coordinator at about 22:30Z: the lead has an interim finding that is new in round 6, so R6 `e866118` cannot be merged, and the regression will run later on whichever revision is eventually approved. Everything below is what I had done before the stop. Nothing in this receipt covers the chromium suite, timer-harness, timer-app or pwa.

- Lane: L4 (captures and regression). I run checks and write receipts; no verdict is given here.
- Model: claude-sonnet-5-5 (Sonnet 5.5). Effort: not inspectable.
- Wall clock (phase 2): first command 2026-10-10T21:46:09Z, last action 22:33Z, about 47 minutes. Phase 1 (captures) is in `CAPTURES-RECEIPT.md`: 18:24Z to 21:44Z.
- Revision under test: R6 = trial merge `e866118`, worktree `/home/user/wt/rv6-r6/kettle`, dev server http://127.0.0.1:5301 (not touched by me; I did not stop or restart any server).

## What ran, with results

| Check | Command (cwd `/home/user/wt/rv6-r6/kettle`) | Result | Time (UTC) | Log |
|---|---|---|---|---|
| Type check | `npx tsc --noEmit --pretty false` | exit 0, no output | 21:46:14 to 21:46:23 | `logs/phase2/tsc.log` |
| Unit tests | `npx vitest run` | 26 test files passed (26), 265 tests passed (265); no failures, no skips reported | 21:46:28 to 21:46:41 | `logs/phase2/vitest.log` |
| Pixel comparison, R6 standard sets vs the existing BEFORE set | `tools/phase2/pngdiff.mjs` (below) | 134 pairs compared; 63 pairs over 0.5 %; causes stated only for the 25 pairs I opened (below) | 21:50 to 22:31 | `diffs/` |
| Pixel comparison, R6 vs INT captured by me in the same session, 844x390 light and dark | same tool | 42 pairs compared; 10 pairs over 0.5 %; 2 opened | 22:31 | `diffs/` |

tsc and vitest are scoped to what they are. They say the R6 tree type-checks and its 26 unit-test files pass. They do not say the browser suites pass.

## What did NOT run

| Item | State |
|---|---|
| `npx playwright test --project=chromium --workers=2` (all specs) | Queued through `slots.py --lane L4 --n 2` at 21:46:51Z; never started (it waited for 2 free slots behind L2/L3 work for 44 minutes). The waiter was killed. No spec ran. No result, no passed/total count exists. |
| `--project=timer-harness --project=timer-app --project=pwa` | Never queued. No result. (So `pwa.spec`, which builds into `test-results/pwa-dist`, never ran; no `test-results` directory was created.) |
| Same-load re-capture of `10-break-over` and `13-first-brew` on INT (5303) and R6 (5301) side by side | Queued 21:50Z, never started, killed. **Not done.** |
| Fresh INT standard captures for the 7 BEFORE configs (to remove the date effect from the comparison) | Queued 21:51Z, never started, killed. **Not done.** |
| Any skip reasons for the Playwright projects | None to report: no Playwright project ran. |

Cancelled by PID, nothing broader: `slots.py` waiters 3175 (chromium run), 5197 and 5198 (same-load pair), 5844 and 5845 (fresh INT sets), with their wrapper shells (3172, 5191 to 5194, 5835, 5838 to 5840). No command behind any of them had started, so there were no child processes. After the kill I listed processes by my paths, `lane L4`, `.tmp/L4`, `warning-captures`, `pngdiff`, `rerun-`, `intfresh`, `samecheck`, `run-pw`: none left. `slots.py status` shows only L2/L3 holders. I started no browser at all in phase 2. (The Playwright process lines seen at 22:30Z belong to lane L2's `specs.sh`, not to me, and I left them alone.)

## Pixel comparison: method

- BEFORE set = `/home/user/Vibei/kettle/review/product-excellence/integration/wave1/captures/<config>/` (INT app code, `kettle/src` tree `1fc4a1b`, captured 2026-10-08 at 09:04 to 09:20Z). AFTER = my phase 1 R6 set `captures/R6/<config>/` (captured 2026-10-10, 18:24 to 18:43Z).
- `tools/phase2/pngdiff.mjs <dirA> <dirB> ...` decodes both PNGs and counts a pixel as different when any channel differs by more than 24 of 255. It reports the share of differing pixels, the bounding box and a 40-px tile count, and writes a diff image (red = different, grey = the R6 image dimmed). Same file name on both sides; where the sizes differ it compares the overlap (only `19-settings` at 1440x900 light, 0.195 %).
- Outputs: `diffs/R6-vs-BEFORE-<config>.json` (numbers), `diffs/R6-vs-BEFORE/<config>/<state>.png` (diff images), `diffs/R6-vs-INTfresh-<config>.json` and `diffs/R6-vs-INTfresh/...` (same-session 844x390), and 66 side-by-side composites in `diffs/sbs/` (left R6, middle the other revision, right the diff, cropped to the diff box).
- The 844x390 viewport is missing from the BEFORE set, so for it the comparison is R6 vs INT (`0d58c5e`, port 5303) captured by me in the same session, not vs BEFORE.
- Missing on the BEFORE side: the existing reduced-motion BEFORE set has only 8 of 21 states (02, 04, 06, 07, 09, 10, 11, 11b), so 13 R6 reduced-motion states have no BEFORE image.

## Diff tables

### R6 (phase 1) vs the existing BEFORE set (INT app code, captured 2026-10-08): percent of pixels differing by more than 24/255 in any channel

"-" = no BEFORE image exists (the BEFORE reduced-motion set has only 8 of the 21 states). "d" after a number = image sizes differ (compared over the overlap). Cells over 0.5 % are in bold.

| state | phone-390x844-light | phone-390x844-dark | phone-375x667-light | phone-375x667-dark | desktop-1440x900-light | desktop-1440x900-dark | phone-390x844-dark-reduced-motion |
|---|---|---|---|---|---|---|---|
| 01 | **1.263** | **1.267** | **18.132** | **15.891** | **1.137** | **1.16** | - |
| 01b | **1.889** | **1.889** | **1.015** | **1.015** | **1.137** | **1.139** | - |
| 02 | 0.014 | 0.038 | 0 | 0 | 0.037 | 0.017 | 0.148 |
| 03 | 0.38 | **0.532** | 0.042 | **0.52** | **0.789** | 0.262 | - |
| 04 | 0.23 | 0.456 | 0.001 | 0.324 | 0.339 | **2.391** | **6.848** |
| 05 | **0.602** | 0.478 | 0.442 | **0.502** | **0.552** | 0.234 | - |
| 06 | 0.109 | **3.286** | **2.532** | **2.784** | **1.141** | **2.618** | 0 |
| 07 | **12.67** | **11.373** | **0.525** | 0.42 | 0.254 | 0.19 | **11.364** |
| 08 | **17.528** | **11.579** | **8.639** | **5.71** | **6.839** | **5.468** | - |
| 09 | 0.036 | 0.146 | 0.094 | 0.102 | **0.511** | **2.514** | 0 |
| 10 | **5.946** | **5.725** | **7.486** | **7.206** | **1.678** | 0.07 | **5.635** |
| 11 | 0.006 | 0.049 | 0.101 | 0.119 | **4.498** | **14.977** | 0 |
| 11b | 0.183 | 0.03 | 0.348 | 0.248 | **2.938** | **2.734** | 0 |
| 12 | 0 | 0 | 0 | 0 | 0 | 0 | - |
| 13 | **2.311** | **12.195** | 0.286 | **3.44** | 0.071 | **4.478** | - |
| 14 | 0.062 | **3.952** | **6.181** | **3.982** | **12.272** | **7.616** | - |
| 15 | 0 | 0 | 0 | 0 | 0 | 0 | - |
| 16 | **1.607** | **1.561** | **1.638** | **1.601** | **2.065** | **1.207** | - |
| 17 | 0.165 | 0.276 | 0.167 | 0.241 | 0.163 | 0.284 | - |
| 18 | 0.418 | 0.447 | 0.397 | 0.202 | 0.331 | **2.158** | - |
| 19 | 0.028 | 0.007 | 0.007 | 0.018 | 0.195d | 0.153 | - |

Pairs compared: 134. Pairs over 0.5 %: 63.

### R6 vs INT, same session (both captured today by this lane with the same tool): 844x390@2

| state | phone-844x390-light | phone-844x390-dark |
|---|---|---|
| 01 | 0.048 | 0.002 |
| 01b | 0.019 | 0.001 |
| 02 | 0.275 | 0.294 |
| 03 | **1.604** | **1.638** |
| 04 | **1.026** | **2.412** |
| 05 | **0.556** | **0.589** |
| 06 | **0.823** | **5.544** |
| 07 | 0.133 | 0.155 |
| 08 | 0.035 | 0.063 |
| 09 | 0.146 | 0.169 |
| 10 | 0.149 | **13.366** |
| 11 | 0.007 | 0.146 |
| 11b | 0.189 | 0.137 |
| 12 | 0 | 0 |
| 13 | 0.436 | 0 |
| 14 | 0.261 | **8.853** |
| 15 | 0 | 0 |
| 16 | 0 | 0 |
| 17 | 0.092 | 0.15 |
| 18 | 0.145 | 0.215 |
| 19 | 0.005 | 0.003 |

Pairs compared: 42.


## What the differences are (only the pairs I opened; read this before using the numbers)

I opened the composite (R6 | BEFORE | diff) of these 23 BEFORE pairs: 390x844 light 01, 01b, 05, 07, 08, 10, 13, 16; 375x667 light 01, 06, 10; 390x844 dark 03, 06, 13; 1440x900 dark 04, 09, 11, 11b, 18; 1440x900 light 14; 390x844 dark reduced-motion 04, 07, 10. And these 2 same-session R6-vs-INT pairs: 844x390 dark 10 and 14. Findings:

1. **The BEFORE comparison is dominated by the date, not by the code.** The `veteran` seed builds its history relative to today, and the BEFORE set is two days older. In the opened pairs the text differs by data: leaves 2,211 vs 2,296; "brewing since Aug 19" vs "Aug 17"; Stats date range Oct 4 to 10 vs Oct 2 to 8 and a shifted calendar; rotating daily recipes (R6 "Finish a full brew / Take 2 full tea breaks / Earn 130 leaves", BEFORE "Take a full tea break / Earn 80 leaves / Finish 4 full brews"); summary chips (+45 leaves vs +60, "Recipes 1/3" vs "Recipe done · Earn 80 leaves"); speech-bubble copy; "Whistles at 6:42 PM" vs "9:23 AM". The summary panel is bottom-anchored, so its different row count moves the title (07, 08: 11 to 18 %). Pairs 01, 01b, 07, 08, 14, 16 and the leaves text in 18 are this class. This is data, not a layout change.
2. **Clock and idle-animation noise** (opened and consistent with that): timer digits one second apart (03, 05, 04), steam puff, mascot hop and music notes (06), the 3D nook's camera orbit and steam (18), the pause fade (04).
3. **Possibly real, NOT resolved: 375x667 `01-home`** (18.1 % light, 15.9 % dark; 390x844 and 1440x900 differ only 1.1 to 1.3 %). In R6 the status bar (23 days warm / 2,211 leaves / Level 12) is on one row. In BEFORE "Level 12" wraps to a second row and the page below is pushed down by about 50 CSS px; BEFORE's leaves number is wider (2,296). `StatusBar.tsx` differs between R6 and INT (SETUP.md lists it among the distinguishing files), so a code cause is possible, but the data difference alone could also wrap the row at 375 px. A fresh INT capture of this state today would have decided it; I queued it and it was cancelled. **I am not claiming either cause.** The same unopened pair in dark (15.9 %) has the same shape of number.
4. **Probably timing, NOT resolved: chrome hidden in R6 at `13-first-brew` and reduced-motion `04-focus-paused`.** In R6 the top chips (task, Rain, mute), the button captions (Add 5, End) and the cycle dots are absent; in BEFORE they are shown (13: light 2.3 %, dark 12.2 %; the dark pair also shows a different rain-window frame). That is the session screen's idle "zen" fade, and the screenshot comes a fixed time after a click, so it depends on how slow the machine is. The same-load R6-and-INT pair for state 13 would have decided it; it was cancelled. **Not claimed either way.**
5. **`10-break-over`, "Recipe done" toast: present in R6, absent in BEFORE** (390x844 light 5.9 %, dark 5.7 %; 375x667 light 7.5 %, dark 7.2 %; reduced-motion 5.6 %). In R6 the toast covers the sentence "Ready for another brew of Chapter 3 notes?". The tool shoots 2.6 s after the break ends and the toast lives 3.2 s, so presence at the shot is timing-dependent. The same-load pair was cancelled, so this is **not resolved** against BEFORE. New same-session evidence at 844x390 dark (R6 vs INT, both captured today): both revisions show the toast at the moment of the shot, at different positions. In R6 it sits near the top of the stage, above the break-over text; in INT it sits lower over the text ("Ready fo..." / "Chap..."). In the same-session 844x390 light pair neither shows it (0.149 %). So when the toast is up its placement differs between the revisions in this state, which fits the round-6 toast-placement work; whether it is up at all depends on timing.
6. **`11` / `11b` at 1440x900** (up to 15 %): the stage decor differs (R6 lacks the plant and books at the left in the first frame; the decor at the lower right (books) differs in the settled frame). Items shown follow the unlocked set and the 3D-versus-drawing phase of the stage, both of which move with the date-based seed and load timing. Not resolved. Same-session 844x390 dark `14-summary-first` (8.9 %): the unlock card shows a drawn plant in R6 and a 3D render in INT, a load-phase difference.

**Not opened, so not classified (40 BEFORE pairs over 0.5 %).** Their numbers are in the table; I make no statement about their cause:

- desktop-1440x900-dark: 01 01b 06 08 13 14 16
- desktop-1440x900-light: 01 01b 03 05 06 08 09 10 11 11b 16
- phone-375x667-dark: 01 01b 03 05 06 08 10 13 14 16
- phone-375x667-light: 01b 07 08 14 16
- phone-390x844-dark: 01 01b 07 08 10 14 16
(total 40)

Of the 10 same-session 844x390 pairs over 0.5 % (light 03, 04, 05, 06; dark 03, 04, 05, 06, 10, 14), I opened only dark 10 and dark 14. The others (03 to 06) are session-screen states and are probably digit and animation phase, but I did not open them.

## Files

All under `/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round6-review/L4/`:

- `REGRESSION-RECEIPT.md` (this file), `CAPTURES-RECEIPT.md` (phase 1).
- `diffs/` (221 PNGs: diff images and composites, plus the JSON numbers).
- `logs/phase2/` (tsc, vitest, the cancelled chromium run's log (header only), the cancelled queue logs, per-config diff listings).
- `tools/phase2/` (`pngdiff.mjs`, `sbs.mjs`, `mksbs.sh`, and the queue scripts that were cancelled).

## What a later run still has to do

Everything under "What did NOT run", on the revision that is eventually approved: tsc and vitest again on that tree, the chromium project (all specs), timer-harness, timer-app and pwa (each reported as passed/total with every skip and its reason), and a same-day INT comparison so the date effect is removed. The 375x667 `01-home` row (item 3) is the one difference that needs that to be decided.
