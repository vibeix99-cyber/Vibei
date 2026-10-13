# Lane P receipt — W2R2 Maker P summary polish (`pe/w2r2-summary@dc7a28d`, code `a4f1773`, trial `d07bd2d`)

Lane P ran checks and records raw numbers only: no verdict, no visual judgement. Control = `b377c62` (preview :5430). P trial = `d07bd2d` (preview :5452; dev :5442 for the specs).
All runs: one Chromium launch per probe invocation under the slot gate (`slots.py run --lane LP --n 1`), fresh browser context per day and build, frozen clock `2026-10-11T07:40:00Z` + `resume()`, `timezoneId UTC`, `locale en-GB`, SwiftShader flags as the repo's Playwright config. Control and P ran side by side in the same browser launch (two contexts) for every pair in checks 1, 1m and 4.
Setup path (same as `r2before.mjs`): `?debug&seed=…`, settings muted/no auto-start via `__kettle.settings` (setup only), real click on "Put the kettle on" (task days: real click + real typing "Chapter 3 notes" first), 2.5 s on the focus screen, `__kettle.finish()` (setup only), then measurements at 1.5 s ("arrival") and 4.5 s ("settled") after `#/done`; "end" = real click on "How your leaves added up", then real mouse wheel over the scroll area to the bottom.
Days: routine = seed `veteran`; task = `newbie` + "Chapter 3 notes" (also a Fairy-lights unlock day); big = `celebrate` (record-player unlock, badges, Tea Cozy); milestone = `atRisk` (the only seed here that shows the honey `data-highlight` milestone card; extra to the brief's three days).
Text 200 %: `html{font-size:200%!important}` injected at DOMContentLoaded. Phone configs DPR 2 (`isMobile`, touch); 844×390 and 667×375 DPR 2 landscape (touch, not `isMobile`); 1440×900 DPR 1.

## Commands and times (UTC, 2026-10-13)

Scripts (all in `/home/user/wt/w3tr-p/kettle/.tmp/LP/`; copies of the final versions are in the evidence folder under `scripts/`):
- `lp-probe2.mjs` — extended copy of the earlier lane's `lp-probe.mjs` (that script's measurements fit; added: glyph-ink fold test, highlight/unlock-in-view fields, attribute/aria/live-region scan for "streak", MutationObserver log of every live region, sheet-vs-scroll-container hit test, PNG captures, concurrent control+P contexts in one launch).
- `lp-input.mjs` — real-input checks (wheel, CDP touch drag and `synthesizeScrollGesture`, touchscreen tap / mouse click, Tab walk).
- `lp-kettle.mjs` — kettle `<svg>` element anatomy. `analyze*.py`, `glance.py`, `compact.py`, `gen_copy_section.py` — table builders (read the JSON the probes wrote).
- Every browser launch ran as `python3 -I …/round7-review/tools/slots.py run --lane LP --n 1 -- <cmd>`. Servers were not started or stopped. No source edit, commit, push or merge.

| time (UTC) | what | evidence folder |
|---|---|---|
| 09:46:20–09:47:22 | smoke run of `lp-probe2.mjs`, 375×667 light @100 task day (not kept) | – |
| 09:48–09:54 | first matrix launch; stopped by me (SIGINT/SIGTERM to my own node PIDs) after finding two measurement problems in my own probe (a hit test that could not discriminate; glyph-ink on SVG art text); outputs deleted and the run restarted | – |
| 09:52:45–09:59:19 | `lp-input.mjs` on :5452, sessions A/B1/B2/B3/C × 2 configs (check 3, first version). **Session A of this run is superseded**: its touch swipes did nothing (method issue) and its "close details" click used stale coordinates; B and C sessions are valid | `check3/` |
| 09:54:07–10:13:11 | **check 1**: `lp-probe2.mjs --days routine,task,big`, 8 configs {375×667, 390×844} × {light, dark} × {100, 200 %} at DPR 2, control :5430 and P :5452 side by side → 48 pairs, 0 page errors | `check1/` |
| 10:00:55 → 10:25:42 | my gated job (`combo.sh`) waited in the gate queue (T lane held 2 slots; LEAD, LC, T jobs ahead); load average 12–14 | – |
| 10:25:42–10:45:01 | check 3b: `lp-input.mjs --sessions A` on :5452 — 375×667 @200 light finished 10:29:31; the 390×844 @100 dark session made no progress for ~15 min and was killed by me at 10:45 | `check3b/` |
| 10:45:01–10:46:20 | **check 1m**: milestone day (`atRisk`), 375×667 light @100 and @200, control + P | `check1m/` |
| 10:46:20–10:54:14 | **check 4**: big day, light, 844×390 / 667×375 / 1440×900 at @100 and @200, control + P (1440×900 @200: P `NO DATA`, timeout) | `check4/` |
| 10:54:14–10:55:04 | spec skipped for time; kettle anatomy (`lp-kettle.mjs`, 375×667 and 390×844 light @100, control + P); dark check 4 and the control touch re-run dropped | `kettle/` |

## 1. Geometry (check 1)

Definitions used in every table (all px, CSS px, from the live DOM; nothing from P's `data-stage-figure` is used for the numbers — the elements were found independently):
- **sheet edge** = the sheet's top (`getBoundingClientRect().top` of the first child of the scroll area) minus 2, i.e. the 2 px `box-shadow: 0 -2px 0` line on its top. **Clear = sheet edge − figure bottom**; negative = the figure's bottom is under the sheet. (P's packet quotes clearance to the sheet's top without the 2 px line, so its numbers are 2.0 larger than the ones here.)
- **Chai img box** = the painted `<img>` inside `[data-pose]` on the stage (`object-fit: fill`, 108.8×149.3 at 375 wide). **Chai ink** = the lowest pixel row with alpha > 24 in the image, mapped to the box.
- **kettle svg box** = `svg[role=img][data-state]` on the stage. **kettle drawn ink** = union of the bounding boxes of the svg's painted child shapes (outside `defs/clipPath/mask`, not `display:none/visibility:hidden/opacity 0`). Its lowest member in every run is `ellipse._fade_…` (fill `url(#…-glow)`), effective opacity 0.08 at settled (0.5 at arrival), whose bottom is 13.2 px below the svg box at 375 wide (13.7 at 390), the same in every run, both builds; this is a radial-gradient glow, so the box bottom is where the gradient has faded out. `kettle/` (below) lists each element.
- **lift** = scrollTop of the scroll area on arrival (the sheet opens that far above its resting place); **air** = `--air` (extra px above the heading and in each block gap that P adds).
- **fold** = the scroll area's bottom minus the 14 px mask fade (`foldTop`). A text line is "cut" when its extent spans `foldTop` (by the line's *text box* = `Range.getClientRects`, content area of the font; or by *glyph ink* = canvas `measureText` actual ascent/descent on the computed font, SVG art text excluded); "in the fade" = starts at or below `foldTop`.
- "highlighted card visible px / height" = how much of the single highlighted block (the honey `data-highlight` card, or the unlock card — never both) lies between the sheet's visible top and `foldTop` on arrival.
- **arrival (1.5 s) = settled (4.5 s)** for lift, air, Chai/kettle clearance, heading-in-view and cut count in all 48 pairs (checked programmatically); the tables show settled.

### 1a. At a glance (raw counts over the 24 pairs per build; every run is a stacked phone layout)

| build | phase | runs | stacked runs | Chai img box wholly above the sheet top edge (clear ≥ 0) | kettle svg box wholly above | Chai ink wholly above | kettle ink wholly above (incl. faint glow ellipse) | min Chai img clear | min kettle svg clear | text lines cut by the fold (line box / glyph ink) | heading wholly in view (line box / glyph ink) | max highlighted cards on one screen (hl+unlock) | runs whose highlighted card is wholly in view on arrival / has ≥1 px in view / is wholly under the fold | min last line → footer (end) | covered controls (elementFromPoint) | overlapping text lines | errors |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| control | arrival | 24 | 24 | 4/24 | 4/24 | 4/24 | 0/24 | -90.2 | -98.6 | 2 / 0 | 24/24 / 24/24 | 1 | 8/16 · 12/16 · 4/16 | 48.6 | 0 | 0 | 0 |
| control | settled | 24 | 24 | 4/24 | 4/24 | 4/24 | 0/24 | -90.2 | -98.6 | 2 / 0 | 24/24 / 24/24 | 1 | 8/16 · 12/16 · 4/16 | 48.6 | 0 | 0 | 0 |
| P | arrival | 24 | 24 | 24/24 | 24/24 | 24/24 | 0/24 | 8.8 | 0.4 | 6 / 0 | 18/24 / 24/24 | 1 | 4/16 · 10/16 · 6/16 | 48.6 | 0 | 0 | 0 |
| P | settled | 24 | 24 | 24/24 | 24/24 | 24/24 | 0/24 | 8.8 | 0.4 | 6 / 0 | 18/24 / 24/24 | 1 | 4/16 · 10/16 · 6/16 | 48.6 | 0 | 0 | 0 |

Columns, in order: Chai/kettle boxes wholly above the sheet edge (clear ≥ 0); the same by ink; minimum clear over the 24 runs; text lines cut by the fold (sum over 24 runs; line box / glyph ink); heading wholly in view (24 runs; line box / glyph ink); most highlighted blocks on one screen; highlighted block wholly in view / ≥ 1 px in view / entirely under the fold on arrival (counted over the 16 task+big runs that have an unlock card); smallest gap between the last line and the footer's top at the end state; controls (buttons / radios in the summary, footer included; non-footer ones only if above the fold) whose centre `elementFromPoint` returns a different element; overlapping text between different text nodes; page errors.


Which runs sit behind the fold counts (settled = arrival):
- control, text-box cuts (2): "Tea's ready. Take five before the next o[ne]" 2nd line, 375×667 @200 light and dark, routine day. Control glyph-ink cuts: 0.
- P, text-box cuts (6): the 2nd line ("brewed") of the heading "25 minutes brewed", 375×667 @200, light and dark × routine / task / big. Its line box bottom is 462.7 vs fold 460.8 (1.9 px into the fade); its lowest glyph ink is 454.1, i.e. 6.7 px above the fold; air is 34 px, lift 0. P glyph-ink cuts: 0.
- P, lines whose ink starts inside the 14 px fade (not cut): "Tea's ready. Take five…" 0.1 px (6 runs, 375×667 @200) and "Fairy lights is in your nook" 0.2 px (375×667 @100 task day, light and dark).
- P Chai/kettle clearances (24 runs): Chai img box 8.8–20.8 px above the sheet edge (control: −90.2 to 20.8); kettle svg box 0.4 px in four runs (390×844 task @100 light/dark, big @200 light/dark; lift 12), 9.8 px in two (375×667 task @100), 10.4–12.4 px in the other 18. Kettle drawn ink (glow ellipse included) lies under the sheet edge by 1.3–13.3 px in all 24 P runs; in control it lies under it by 1.3–112.3 px in all 24 runs.
- Sheet-over-figure hit samples (27 points on the bottom 12 px of each figure's drawn ink; "under the sheet" = `elementFromPoint` returns an element inside the sheet box, which excludes the 2 px top line): P Chai ink 0/27 in all 24 runs; P kettle ink 0/27 in 16 runs, 9/27 in 4 runs (375×667 task @100; 390×844 big @100) and 27/27 in 4 runs (390×844 task @100, big @200) — those points lie on the glow ellipse's lowest rim (opacity 0.08 at settled). Control: Chai ink 27/27 in 16 runs, 9/27 in 4, 0/27 in 4; kettle ink 27/27 in 22 runs and 0/27 in 2.

### 1b. Control vs P, every pair (settled; arrival is identical)

| cfg | day | build | sheet lift (scrollTop) | air | Chai img box → sheet edge | Chai ink → edge | kettle svg box → edge | kettle drawn ink (incl. faint glow) → edge | heading in view: line box / ink | highlighted card visible px / height (arrival) | text lines cut by fold (box / ink) | last line → footer at end |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 390x844-light-t100 | routine | control | 0 | 0 | 20.8 | 22.2 | 12.4 | -1.3 | True / True | – | 0 / 0 | 49.3 |
| 390x844-light-t100 | routine | P | 0 | 0 | 20.8 | 22.2 | 12.4 | -1.3 | True / True | – | 0 / 0 | 49.3 |
| 390x844-light-t100 | task | control | 26 | 0 | -5.2 | -3.8 | -13.6 | -27.3 | True / True | 133.8/133.8 | 0 / 0 | 49 |
| 390x844-light-t100 | task | P | 12 | 0 | 8.8 | 10.2 | 0.4 | -13.3 | True / True | 125.8/133.8 | 0 / 0 | 49 |
| 390x844-light-t100 | big | control | 27 | 0 | -6.2 | -4.8 | -14.6 | -28.3 | True / True | 133.8/133.8 | 0 / 0 | 49 |
| 390x844-light-t100 | big | P | 2 | 7 | 18.8 | 20.2 | 10.4 | -3.3 | True / True | 133.8/133.8 | 0 / 0 | 49 |
| 390x844-light-t200 | routine | control | 61 | 0 | -40.2 | -38.8 | -48.6 | -62.3 | True / True | – | 0 / 0 | 49.8 |
| 390x844-light-t200 | routine | P | 1 | 0 | 19.8 | 21.2 | 11.4 | -2.3 | True / True | – | 0 / 0 | 49.8 |
| 390x844-light-t200 | task | control | 111 | 0 | -90.2 | -88.8 | -98.6 | -112.3 | True / True | 0/333.4 | 0 / 0 | 49.5 |
| 390x844-light-t200 | task | P | 1 | 0 | 19.8 | 21.2 | 11.4 | -2.3 | True / True | 0/333.4 | 0 / 0 | 49.5 |
| 390x844-light-t200 | big | control | 12 | 0 | 8.8 | 10.2 | 0.4 | -13.3 | True / True | 2.9/333.4 | 0 / 0 | 49.5 |
| 390x844-light-t200 | big | P | 12 | 0 | 8.8 | 10.2 | 0.4 | -13.3 | True / True | 2.9/333.4 | 0 / 0 | 49.5 |
| 390x844-dark-t100 | routine | control | 0 | 0 | 20.8 | 22.2 | 12.4 | -1.3 | True / True | – | 0 / 0 | 49.3 |
| 390x844-dark-t100 | routine | P | 0 | 0 | 20.8 | 22.2 | 12.4 | -1.3 | True / True | – | 0 / 0 | 49.3 |
| 390x844-dark-t100 | task | control | 26 | 0 | -5.2 | -3.8 | -13.6 | -27.3 | True / True | 133.8/133.8 | 0 / 0 | 49 |
| 390x844-dark-t100 | task | P | 12 | 0 | 8.8 | 10.2 | 0.4 | -13.3 | True / True | 125.8/133.8 | 0 / 0 | 49 |
| 390x844-dark-t100 | big | control | 27 | 0 | -6.2 | -4.8 | -14.6 | -28.3 | True / True | 133.8/133.8 | 0 / 0 | 49 |
| 390x844-dark-t100 | big | P | 2 | 7 | 18.8 | 20.2 | 10.4 | -3.3 | True / True | 133.8/133.8 | 0 / 0 | 49 |
| 390x844-dark-t200 | routine | control | 61 | 0 | -40.2 | -38.8 | -48.6 | -62.3 | True / True | – | 0 / 0 | 49.8 |
| 390x844-dark-t200 | routine | P | 1 | 0 | 19.8 | 21.2 | 11.4 | -2.3 | True / True | – | 0 / 0 | 49.8 |
| 390x844-dark-t200 | task | control | 111 | 0 | -90.2 | -88.8 | -98.6 | -112.3 | True / True | 0/333.4 | 0 / 0 | 49.5 |
| 390x844-dark-t200 | task | P | 1 | 0 | 19.8 | 21.2 | 11.4 | -2.3 | True / True | 0/333.4 | 0 / 0 | 49.5 |
| 390x844-dark-t200 | big | control | 12 | 0 | 8.8 | 10.2 | 0.4 | -13.3 | True / True | 2.9/333.4 | 0 / 0 | 49.5 |
| 390x844-dark-t200 | big | P | 12 | 0 | 8.8 | 10.2 | 0.4 | -13.3 | True / True | 2.9/333.4 | 0 / 0 | 49.5 |
| 375x667-light-t100 | routine | control | 44 | 0 | -25.1 | -23.7 | -33.2 | -46.4 | True / True | – | 0 / 0 | 48.8 |
| 375x667-light-t100 | routine | P | 0 | 4 | 18.9 | 20.3 | 10.8 | -2.4 | True / True | – | 0 / 0 | 48.8 |
| 375x667-light-t100 | task | control | 85 | 0 | -66.1 | -64.7 | -74.2 | -87.4 | True / True | 128.7/128.7 | 0 / 0 | 48.6 |
| 375x667-light-t100 | task | P | 1 | 15 | 17.9 | 19.3 | 9.8 | -3.4 | True / True | 2.3/128.7 | 0 / 0 | 48.6 |
| 375x667-light-t100 | big | control | 43 | 0 | -24.1 | -22.7 | -32.2 | -45.4 | True / True | 128.7/128.7 | 0 / 0 | 48.6 |
| 375x667-light-t100 | big | P | 0 | 1 | 18.9 | 20.3 | 10.8 | -2.4 | True / True | 128.7/128.7 | 0 / 0 | 48.6 |
| 375x667-light-t200 | routine | control | 62 | 0 | -43.1 | -41.7 | -51.2 | -64.4 | True / True | – | 1 / 0 | 49.3 |
| 375x667-light-t200 | routine | P | 0 | 34 | 18.9 | 20.3 | 10.8 | -2.4 | False / True | – | 1 / 0 | 49.3 |
| 375x667-light-t200 | task | control | 69 | 0 | -50.1 | -48.7 | -58.2 | -71.4 | True / True | 0/371.2 | 0 / 0 | 50.2 |
| 375x667-light-t200 | task | P | 0 | 34 | 18.9 | 20.3 | 10.8 | -2.4 | False / True | 0/371.2 | 1 / 0 | 50.2 |
| 375x667-light-t200 | big | control | 80 | 0 | -61.1 | -59.7 | -69.2 | -82.4 | True / True | 2.4/449.8 | 0 / 0 | 49.6 |
| 375x667-light-t200 | big | P | 0 | 34 | 18.9 | 20.3 | 10.8 | -2.4 | False / True | 0/449.8 | 1 / 0 | 49.6 |
| 375x667-dark-t100 | routine | control | 44 | 0 | -25.1 | -23.7 | -33.2 | -46.4 | True / True | – | 0 / 0 | 48.8 |
| 375x667-dark-t100 | routine | P | 0 | 4 | 18.9 | 20.3 | 10.8 | -2.4 | True / True | – | 0 / 0 | 48.8 |
| 375x667-dark-t100 | task | control | 85 | 0 | -66.1 | -64.7 | -74.2 | -87.4 | True / True | 128.7/128.7 | 0 / 0 | 48.6 |
| 375x667-dark-t100 | task | P | 1 | 15 | 17.9 | 19.3 | 9.8 | -3.4 | True / True | 2.3/128.7 | 0 / 0 | 48.6 |
| 375x667-dark-t100 | big | control | 43 | 0 | -24.1 | -22.7 | -32.2 | -45.4 | True / True | 128.7/128.7 | 0 / 0 | 48.6 |
| 375x667-dark-t100 | big | P | 0 | 1 | 18.9 | 20.3 | 10.8 | -2.4 | True / True | 128.7/128.7 | 0 / 0 | 48.6 |
| 375x667-dark-t200 | routine | control | 62 | 0 | -43.1 | -41.7 | -51.2 | -64.4 | True / True | – | 1 / 0 | 49.3 |
| 375x667-dark-t200 | routine | P | 0 | 34 | 18.9 | 20.3 | 10.8 | -2.4 | False / True | – | 1 / 0 | 49.3 |
| 375x667-dark-t200 | task | control | 69 | 0 | -50.1 | -48.7 | -58.2 | -71.4 | True / True | 0/371.2 | 0 / 0 | 50.2 |
| 375x667-dark-t200 | task | P | 0 | 34 | 18.9 | 20.3 | 10.8 | -2.4 | False / True | 0/371.2 | 1 / 0 | 50.2 |
| 375x667-dark-t200 | big | control | 80 | 0 | -61.1 | -59.7 | -69.2 | -82.4 | True / True | 2.4/449.8 | 0 / 0 | 49.6 |
| 375x667-dark-t200 | big | P | 0 | 34 | 18.9 | 20.3 | 10.8 | -2.4 | False / True | 0/449.8 | 1 / 0 | 49.6 |

Milestone day (seed `atRisk`, the only day with the honey `data-highlight` card; 2 of the 8 configs were run):

| cfg | day | build | sheet lift (scrollTop) | air | Chai img box → sheet edge | Chai ink → edge | kettle svg box → edge | kettle drawn ink (incl. faint glow) → edge | heading in view: line box / ink | highlighted card visible px / height (arrival) | text lines cut by fold (box / ink) | last line → footer at end |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 375x667-light-t100 | milestone | control | 28 | 0 | -9.1 | -7.7 | -17.2 | -30.4 | True / True | 73.8/73.8 | 0 / 0 | 49 |
| 375x667-light-t100 | milestone | P | 4 | 0 | 14.9 | 16.3 | 6.8 | -6.4 | True / True | 50/50 | 0 / 0 | 48.8 |
| 375x667-light-t200 | milestone | control | 58 | 0 | -39.1 | -37.7 | -47.2 | -60.4 | True / True | 0/207.8 | 1 / 0 | 49.6 |
| 375x667-light-t200 | milestone | P | 0 | 34 | 18.9 | 20.3 | 10.8 | -2.4 | False / True | 0/157.4 | 1 / 0 | 50 |

Per-phase detail with fold lines, lowest kettle element and sample hit counts: `tables/check1-geometry-full.md`, `tables/check1m-geometry-full.md`.

### 1c. Hierarchy: minutes heading, Tea time, highlighted card (settled; selected configs — all 8 configs × 3 days are in `tables/check1-hierarchy-full.md`)

Element areas are `getBoundingClientRect` width × height in CSS px² (minutes = the `h1` box; Tea time = the `<button>` box, with the painted face's area second; highlight / unlock = the `li` / `section` box). "Minutes" and "Tea time" are the same on both builds in every run (P did not change them); the highlighted block is the unlock card on task and big days (unchanged by P) and the honey `data-highlight` card on the milestone day.

| cfg | day | build | minutes: size/weight/colour/area | Tea time label: size/weight/colour | Tea time: button area / face area / fill | highlight card: title size/weight/colour | highlight: card area / box h / art | highlight note (size/weight) | unlock card: title size/weight | unlock: area / h | highlighted cards | highlight/unlock in view on arrival (visible px of h; whole?) | covered controls | text overlaps between different text nodes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 390x844-dark-t200 | routine | C | 56px/600/rgb(252, 239, 227)/43116 | 42px/700/rgb(255, 255, 255) | 37931 / 36540 / rgb(52, 148, 209) | – | – | – | – | – | 0+0 | hl –; unlock – | 0 | 0 |
| 390x844-dark-t200 | routine | P | 56px/600/rgb(252, 239, 227)/43116 | 42px/700/rgb(255, 255, 255) | 37931 / 36540 / rgb(52, 148, 209) | – | – | – | – | – | 0+0 | hl –; unlock – | 0 | 0 |
| 390x844-dark-t200 | task | C | 56px/600/rgb(252, 239, 227)/43116 | 42px/700/rgb(255, 255, 255) | 37931 / 36540 / rgb(52, 148, 209) | – | – | – | 34px/600 | 116681 / 333.4 | 0+1 | hl –; unlock 0/333.4 none | 0 | 0 |
| 390x844-dark-t200 | task | P | 56px/600/rgb(252, 239, 227)/43116 | 42px/700/rgb(255, 255, 255) | 37931 / 36540 / rgb(52, 148, 209) | – | – | – | 34px/600 | 116681 / 333.4 | 0+1 | hl –; unlock 0/333.4 none | 0 | 0 |
| 390x844-dark-t200 | big | C | 56px/600/rgb(252, 239, 227)/43116 | 42px/700/rgb(255, 255, 255) | 37931 / 36540 / rgb(52, 148, 209) | – | – | – | 34px/600 | 116681 / 333.4 | 0+1 | hl –; unlock 2.9/333.4 part | 0 | 0 |
| 390x844-dark-t200 | big | P | 56px/600/rgb(252, 239, 227)/43116 | 42px/700/rgb(255, 255, 255) | 37931 / 36540 / rgb(52, 148, 209) | – | – | – | 34px/600 | 116681 / 333.4 | 0+1 | hl –; unlock 2.9/333.4 part | 0 | 0 |
| 375x667-light-t100 | routine | C | 28px/600/rgb(59, 42, 32)/10317 | 21px/700/rgb(255, 255, 255) | 20100 / 18760 / rgb(52, 148, 209) | – | – | – | – | – | 0+0 | hl –; unlock – | 0 | 0 |
| 375x667-light-t100 | routine | P | 28px/600/rgb(59, 42, 32)/10317 | 21px/700/rgb(255, 255, 255) | 20100 / 18760 / rgb(52, 148, 209) | – | – | – | – | – | 0+0 | hl –; unlock – | 0 | 0 |
| 375x667-light-t100 | task | C | 28px/600/rgb(59, 42, 32)/10317 | 21px/700/rgb(255, 255, 255) | 20100 / 18760 / rgb(52, 148, 209) | – | – | – | 17px/600 | 43100 / 128.7 | 0+1 | hl –; unlock 128.7/128.7 whole | 0 | 0 |
| 375x667-light-t100 | task | P | 28px/600/rgb(59, 42, 32)/10317 | 21px/700/rgb(255, 255, 255) | 20100 / 18760 / rgb(52, 148, 209) | – | – | – | 17px/600 | 43100 / 128.7 | 0+1 | hl –; unlock 2.3/128.7 part | 0 | 0 |
| 375x667-light-t100 | big | C | 28px/600/rgb(59, 42, 32)/10317 | 21px/700/rgb(255, 255, 255) | 20100 / 18760 / rgb(52, 148, 209) | – | – | – | 17px/600 | 43100 / 128.7 | 0+1 | hl –; unlock 128.7/128.7 whole | 0 | 0 |
| 375x667-light-t100 | big | P | 28px/600/rgb(59, 42, 32)/10317 | 21px/700/rgb(255, 255, 255) | 20100 / 18760 / rgb(52, 148, 209) | – | – | – | 17px/600 | 43100 / 128.7 | 0+1 | hl –; unlock 128.7/128.7 whole | 0 | 0 |
| 375x667-light-t200 | routine | C | 56px/600/rgb(59, 42, 32)/41268 | 42px/700/rgb(255, 255, 255) | 36306 / 34974 / rgb(52, 148, 209) | – | – | – | – | – | 0+0 | hl –; unlock – | 0 | 0 |
| 375x667-light-t200 | routine | P | 56px/600/rgb(59, 42, 32)/41268 | 42px/700/rgb(255, 255, 255) | 36306 / 34974 / rgb(52, 148, 209) | – | – | – | – | – | 0+0 | hl –; unlock – | 0 | 0 |
| 375x667-light-t200 | task | C | 56px/600/rgb(59, 42, 32)/41268 | 42px/700/rgb(255, 255, 255) | 36306 / 34974 / rgb(52, 148, 209) | – | – | – | 34px/600 | 124343 / 371.2 | 0+1 | hl –; unlock 0/371.2 none | 0 | 0 |
| 375x667-light-t200 | task | P | 56px/600/rgb(59, 42, 32)/41268 | 42px/700/rgb(255, 255, 255) | 36306 / 34974 / rgb(52, 148, 209) | – | – | – | 34px/600 | 124343 / 371.2 | 0+1 | hl –; unlock 0/371.2 none | 0 | 0 |
| 375x667-light-t200 | big | C | 56px/600/rgb(59, 42, 32)/41268 | 42px/700/rgb(255, 255, 255) | 36306 / 34974 / rgb(52, 148, 209) | – | – | – | 34px/600 | 150671 / 449.8 | 0+1 | hl –; unlock 2.4/449.8 part | 0 | 0 |
| 375x667-light-t200 | big | P | 56px/600/rgb(59, 42, 32)/41268 | 42px/700/rgb(255, 255, 255) | 36306 / 34974 / rgb(52, 148, 209) | – | – | – | 34px/600 | 150671 / 449.8 | 0+1 | hl –; unlock 0/449.8 none | 0 | 0 |
| 375x667-light-t100 | milestone | C | 28px/600/rgb(59, 42, 32)/10317 | 21px/700/rgb(255, 255, 255) | 20100 / 18760 / rgb(52, 148, 209) | 17px/700/rgb(59, 42, 32) | 24711 / 73.8 / [42, 42] | 14px/600 “One full brew a day keeps your streak warm.” | – | – | 1+0 | hl 73.8/73.8 whole; unlock – | 0 | 0 |
| 375x667-light-t100 | milestone | P | 28px/600/rgb(59, 42, 32)/10317 | 21px/700/rgb(255, 255, 255) | 20100 / 18760 / rgb(52, 148, 209) | 16px/600/rgb(59, 42, 32) | 16750 / 50 / [34, 34] | 13px/600 “One full brew a day keeps the kettle warm.” | – | – | 1+0 | hl 50/50 whole; unlock – | 0 | 0 |
| 375x667-light-t200 | milestone | C | 56px/600/rgb(59, 42, 32)/41268 | 42px/700/rgb(255, 255, 255) | 36306 / 34974 / rgb(52, 148, 209) | 34px/700/rgb(59, 42, 32) | 69601 / 207.8 / [42, 42] | 28px/600 “One full brew a day keeps your streak warm.” | – | – | 1+0 | hl 0/207.8 none; unlock – | 0 | 0 |
| 375x667-light-t200 | milestone | P | 56px/600/rgb(59, 42, 32)/41268 | 42px/700/rgb(255, 255, 255) | 36306 / 34974 / rgb(52, 148, 209) | 32px/600/rgb(59, 42, 32) | 52721 / 157.4 / [34, 34] | 26px/600 “One full brew a day keeps the kettle warm.” | – | – | 1+0 | hl 0/157.4 none; unlock – | 0 | 0 |

Contrast and fill, 375×667 light @100, milestone day (same on both builds): minutes `h1` colour `rgb(59,42,32)` on sheet `rgb(255,253,250)` = 13.45:1; Tea time fill `rgb(52,148,209)` vs sheet 3.28:1, label white on fill 3.33:1; highlight card fill `rgb(255,241,204)` vs sheet 1.11:1, inset edge `rgb(245,218,146) 0 0 0 2px`; highlight note colour `rgb(107,84,68)`.
Milestone card, control → P: 375×667 @100 box 335×73.8 → 335×50 (area 24711 → 16750; Tea time button 20100, minutes box 10317); title 17px/700 → 16px/600; note 14px/600 → 13px/600; art 42 → 34 px. @200: box 335×207.8 → 335×157.4 (area 69601 → 52721; Tea time button 36306, minutes box 41268); title 34px/700 → 32px/600; note 28px → 26px; Tea time label 42px/700 and minutes 56px/600 on both. The unlock card (task and big days): title 17px/600 @100 and 34px/600 @200, area 43100 (375 @100) / 124343–150671 (375 @200), identical on both builds.

### 1d. Kettle anatomy (routine day, settled; `kettle/kettle-anatomy.json`, stills `kettle/*-kettle.png`; 375×667 and 390×844, light @100, control and P)

The stage kettle `<svg role=img data-state="rest">` (98 painted elements, `overflow: visible`). Elements with effective opacity (own × ancestors') > 0.3: the lowest is the `_plate_` path (fill `rgb(74,61,78)`) whose bottom is **13.2 px (375 wide) / 13.8 px (390 wide) above the svg box bottom**; then `_plateHi_` rect 23.5 px above, `_trivet_` path 26.4 px above. The only elements reaching below the svg box are two `ellipse._fade_…` glow ellipses (fill `url(#…-glow)`): the lower one has effective opacity **0.08** and its bottom is 13.2 / 13.7 px below the svg box; the other has opacity 0.

| config | build | sheet edge | svg box bottom | svg box clear | lowest element with opacity > 0.3 (bottom) | clear of that element | glow ellipse bottom (opacity 0.08) |
|---|---|---|---|---|---|---|---|
| 375×667 | control | 239.5 | 272.7 | −33.2 | plate path 259.5 | −20.0 | 285.9 |
| 375×667 | P | 283.5 | 272.7 | 10.8 | plate path 259.5 | 24.0 | 285.9 |
| 390×844 | control | 392.0 | 379.6 | 12.4 | plate path 365.8 | 26.2 | 393.3 |
| 390×844 | P | 392.0 | 379.6 | 12.4 | plate path 365.8 | 26.2 | 393.3 |

(The stage kettle does not move with the sheet, so the same offsets (13.2 px at 375 wide, 13.8 px at 390 wide) apply in every check-1 run at that width; adding them to a run's svg-box clear gives that run's clear of the plate — derived, not separately measured: P's 390-wide stacked runs (svg-box clears 0.4, 10.4, 11.4, 12.4) → 14.2, 24.2, 25.2, 26.2 px; P's 375-wide runs (clears 9.8, 10.8) → 23.0, 24.0 px. Control's 390-wide routine runs → 26.2 px; its other 22 runs have negative svg-box clears.)
## 2. Facts and copy (check 2)

Source: the same 48 control/P pairs of check 1 (routine, task, big × 8 configs) — copy was captured at arrival, settled and end (after a real click on "How your leaves added up"). Full per-day lists: `tables/copy-facts-streak.md`. Terms: *innerText* includes visually-hidden `.sr-only` text (clip-hidden text is still in innerText); *textContent* additionally includes the closed arithmetic panel and anything hidden.

**Stability.** Within a build and day, the copy (innerText, textContent, pills, sr-only strings, aria-labels, footer, arithmetic rows/text, live announcement) was identical across all 8 configurations at settled and at end on both builds (1 distinct variant per day/build/phase). The one exception: control big-day *arrival* snapshots — 1 of 8 (390×844 light @200) had an empty live-announcement `<p role=status>` at 1.5 s (the announcement fills in a little later); all 8 are identical at settled. (Load average on the machine was about 10 during the runs.)

### 2a. Reward texts, numbers and sentences, control vs P (settled state; first config of each day; every other config is identical to it per the stability line; the milestone day is from check 1m at 375×667 light @100)

| day | element | control `b377c62` | P trial | same? |
|---|---|---|---|---|
| routine | reward pills (textContent of each Rewards `li`) | +40 leaves ‖ Goal met · 75/60 minDaily goal met: 75 of 60 minutes today ‖ 2323 days warm ‖ Recipes 1/3 ‖ 12144 leaves to level 13144 leaves to cozy level 13 | +40 leaves ‖ Goal met · 75/60 minDaily goal met: 75 of 60 minutes today ‖ 2323 days warm ‖ Recipes 1/3 ‖ 12144 leaves to level 13144 leaves to cozy level 13 | yes |
| routine | headline / sub | 25 minutes brewed / Tea’s ready. Take five before the next one. | 25 minutes brewed / Tea’s ready. Take five before the next one. | yes |
| routine | sr-only strings | Daily goal met: 75 of 60 minutes today ‖ 144 leaves to cozy level 13 ‖ 25 minutes brewed. 40 leaves earned. Daily goal met. | Daily goal met: 75 of 60 minutes today ‖ 144 leaves to cozy level 13 ‖ 25 minutes brewed. 40 leaves earned. Daily goal met. | yes |
| routine | live announcement (role=status) | 25 minutes brewed. 40 leaves earned. Daily goal met. | 25 minutes brewed. 40 leaves earned. Daily goal met. | yes |
| routine | arithmetic rows (after real click on the toggle) | [["25 focused minutes", "+25"], ["Full brew", "+5"], ["Daily goal met", "+10"], ["This brew", "+40"]] | [["25 focused minutes", "+25"], ["Full brew", "+5"], ["Daily goal met", "+10"], ["This brew", "+40"]] | yes |
| routine | arithmetic closing line | Your 23-day streak stays warm with one full brew a day. | 23 days warm. One full brew a day keeps the kettle warm. | **NO** |
| routine | arithmetic text up to the closing line (level line included) | 25 focused minutes+25Full brew+5Daily goal met+10This brew +40Cozy level 12 → 13144 leaves to go | 25 focused minutes+25Full brew+5Daily goal met+10This brew +40Cozy level 12 → 13144 leaves to go | yes |
| routine | footer | Tea time · 5 min Skip break | Tea time · 5 min Skip break | yes |
| routine | innerText lines present on one build only (sr-only text included) | – | – | yes |
| task | reward pills (textContent of each Rewards `li`) | +65 leaves ‖ Goal met · 50/30 minDaily goal met: 50 of 30 minutes today ‖ 33 days warm ‖ 2 recipes done | +65 leaves ‖ Goal met · 50/30 minDaily goal met: 50 of 30 minutes today ‖ 33 days warm ‖ 2 recipes done | yes |
| task | headline / sub | 25 minutes brewed / Tea’s ready. Take five before the next one. | 25 minutes brewed / Tea’s ready. Take five before the next one. | yes |
| task | sr-only strings | Daily goal met: 50 of 30 minutes today ‖ 25 minutes brewed. 65 leaves earned. Daily goal met. Cozy level 5: something new in your nook. | Daily goal met: 50 of 30 minutes today ‖ 25 minutes brewed. 65 leaves earned. Daily goal met. Cozy level 5: something new in your nook. | yes |
| task | live announcement (role=status) | 25 minutes brewed. 65 leaves earned. Daily goal met. Cozy level 5: something new in your nook. | 25 minutes brewed. 65 leaves earned. Daily goal met. Cozy level 5: something new in your nook. | yes |
| task | arithmetic rows (after real click on the toggle) | [["25 focused minutes", "+25"], ["Full brew", "+5"], ["Daily goal met", "+10"], ["Recipe: Name what you’re brewing", "+10"], ["Recipe: Brew for 30 minutes", "+15"], ["This brew", "+65"]] | [["25 focused minutes", "+25"], ["Full brew", "+5"], ["Daily goal met", "+10"], ["Recipe: Name what you’re brewing", "+10"], ["Recipe: Brew for 30 minutes", "+15"], ["This brew", "+65"]] | yes |
| task | arithmetic closing line | Your 3-day streak stays warm with one full brew a day. | 3 days warm. One full brew a day keeps the kettle warm. | **NO** |
| task | arithmetic text up to the closing line (level line included) | 25 focused minutes+25Full brew+5Daily goal met+10Recipe: Name what you’re brewing+10Recipe: Brew for 30 minutes+15This brew +65Cozy level 5 → 6102 leaves to go | 25 focused minutes+25Full brew+5Daily goal met+10Recipe: Name what you’re brewing+10Recipe: Brew for 30 minutes+15This brew +65Cozy level 5 → 6102 leaves to go | yes |
| task | footer | Tea time · 5 min Skip break | Tea time · 5 min Skip break | yes |
| task | innerText lines present on one build only (sr-only text included) | – | – | yes |
| big | reward pills (textContent of each Rewards `li`) | +68 leaves ‖ Goal met · 37/30 minDaily goal met: 37 of 30 minutes today ‖ 77 days warm, your best yet ‖ Tea Cozy earnedYou earned a Tea Cozy: it keeps your streak warm for one missed day ‖ 2 recipes done ‖ 7IIBadge: Warm Streak II ‖ IBadge: Weekend Warmth | +68 leaves ‖ Goal met · 37/30 minDaily goal met: 37 of 30 minutes today ‖ 77 days warm, your best yet ‖ Tea Cozy earnedYou earned a Tea Cozy: it covers one missed day, so your warm days keep going ‖ 2 recipes done ‖ 7IIBadge: Warm Streak II ‖ IBadge: Weekend Warmth | **NO** |
| big | headline / sub | 25 minutes brewed / Tea’s ready. Take five before the next one. | 25 minutes brewed / Tea’s ready. Take five before the next one. | yes |
| big | sr-only strings | Daily goal met: 37 of 30 minutes today ‖ You earned a Tea Cozy: it keeps your streak warm for one missed day ‖ 25 minutes brewed. 68 leaves earned. Daily goal met. Warm streak: 7 days. Cozy level 8: something new in your nook. New badge: Warm Streak. New badge: Weekend Warmth. | Daily goal met: 37 of 30 minutes today ‖ You earned a Tea Cozy: it covers one missed day, so your warm days keep going ‖ 25 minutes brewed. 68 leaves earned. Daily goal met. 7 days warm. Cozy level 8: something new in your nook. New badge: Warm Streak. New badge: Weekend Warmth. | **NO** |
| big | live announcement (role=status) | 25 minutes brewed. 68 leaves earned. Daily goal met. Warm streak: 7 days. Cozy level 8: something new in your nook. New badge: Warm Streak. New badge: Weekend Warmth. | 25 minutes brewed. 68 leaves earned. Daily goal met. 7 days warm. Cozy level 8: something new in your nook. New badge: Warm Streak. New badge: Weekend Warmth. | **NO** |
| big | arithmetic rows (after real click on the toggle) | [["25 focused minutes", "+25"], ["Full brew", "+5"], ["First brew today", "+3"], ["Daily goal met", "+10"], ["Recipe: Finish a full brew", "+10"], ["Recipe: Brew for 30 minutes", "+15"], ["This brew", "+68"]] | [["25 focused minutes", "+25"], ["Full brew", "+5"], ["First brew today", "+3"], ["Daily goal met", "+10"], ["Recipe: Finish a full brew", "+10"], ["Recipe: Brew for 30 minutes", "+15"], ["This brew", "+68"]] | yes |
| big | arithmetic closing line | Your 7-day streak stays warm with one full brew a day. | 7 days warm. One full brew a day keeps the kettle warm. | **NO** |
| big | arithmetic text up to the closing line (level line included) | 25 focused minutes+25Full brew+5First brew today+3Daily goal met+10Recipe: Finish a full brew+10Recipe: Brew for 30 minutes+15This brew +68Cozy level 8 → 9207 leaves to go | 25 focused minutes+25Full brew+5First brew today+3Daily goal met+10Recipe: Finish a full brew+10Recipe: Brew for 30 minutes+15This brew +68Cozy level 8 → 9207 leaves to go | yes |
| big | footer | Tea time · 5 min Skip break | Tea time · 5 min Skip break | yes |
| big | innerText lines present on one build only (sr-only text included) | You earned a Tea Cozy: it keeps your streak warm for one missed day ‖ 25 minutes brewed. 68 leaves earned. Daily goal met. Warm streak: 7 days. Cozy level 8: something new in your nook. New badge: Warm Streak. New badge: Weekend Warmth. | You earned a Tea Cozy: it covers one missed day, so your warm days keep going ‖ 25 minutes brewed. 68 leaves earned. Daily goal met. 7 days warm. Cozy level 8: something new in your nook. New badge: Warm Streak. New badge: Weekend Warmth. | **NO** |
| milestone | reward pills (textContent of each Rewards `li`) | 66 days warm, your best yetOne full brew a day keeps your streak warm. ‖ +33 leaves ‖ 25/30 min todayDaily goal: 25 of 30 minutes ‖ 519 leaves to level 619 leaves to cozy level 6 | 66 days warm, your best yetOne full brew a day keeps the kettle warm. ‖ +33 leaves ‖ 25/30 min todayDaily goal: 25 of 30 minutes ‖ 519 leaves to level 619 leaves to cozy level 6 | **NO** |
| milestone | headline / sub | 25 minutes brewed / Tea’s ready. Take five before the next one. | 25 minutes brewed / Tea’s ready. Take five before the next one. | yes |
| milestone | sr-only strings | Daily goal: 25 of 30 minutes ‖ 19 leaves to cozy level 6 ‖ 25 minutes brewed. 33 leaves earned. Today: 25 of 30 minutes. Warm streak: 6 days. | Daily goal: 25 of 30 minutes ‖ 19 leaves to cozy level 6 ‖ 25 minutes brewed. 33 leaves earned. Today: 25 of 30 minutes. 6 days warm. | **NO** |
| milestone | live announcement (role=status) | 25 minutes brewed. 33 leaves earned. Today: 25 of 30 minutes. Warm streak: 6 days. | 25 minutes brewed. 33 leaves earned. Today: 25 of 30 minutes. 6 days warm. | **NO** |
| milestone | arithmetic rows (after real click on the toggle) | [["25 focused minutes", "+25"], ["Full brew", "+5"], ["First brew today", "+3"], ["This brew", "+33"]] | [["25 focused minutes", "+25"], ["Full brew", "+5"], ["First brew today", "+3"], ["This brew", "+33"]] | yes |
| milestone | arithmetic closing line | Your 6-day streak stays warm with one full brew a day. | 6 days warm. One full brew a day keeps the kettle warm. | **NO** |
| milestone | arithmetic text up to the closing line (level line included) | 25 focused minutes+25Full brew+5First brew today+3This brew +33Cozy level 5 → 619 leaves to go | 25 focused minutes+25Full brew+5First brew today+3This brew +33Cozy level 5 → 619 leaves to go | yes |
| milestone | footer | Tea time · 5 min Skip break | Tea time · 5 min Skip break | yes |
| milestone | innerText lines present on one build only (sr-only text included) | One full brew a day keeps your streak warm. ‖ 25 minutes brewed. 33 leaves earned. Today: 25 of 30 minutes. Warm streak: 6 days. | One full brew a day keeps the kettle warm. ‖ 25 minutes brewed. 33 leaves earned. Today: 25 of 30 minutes. 6 days warm. | **NO** |

### 2b. Every “streak” on the summary (case-insensitive; visible text, innerText, textContent, sr-only elements, every non-`data-` attribute incl. `aria-*`/`alt`/`title`, svg `title/desc`, the summary's live region, every `[aria-live]`/`role=status`/`role=alert` in the document, toasts, and a MutationObserver log of every live-region text from page load to the end of each run)

All 8 configs gave the same result per day. The badge name "Warm Streak" is listed separately in the last two rows (out of scope: rename planned for next round).

| day | control `b377c62` | P trial |
|---|---|---|
| routine (veteran) | 1 — arithmetic closing line "Your 23-day streak stays warm with one full brew a day." (in textContent always; visible after the toggle opens) | **0** |
| task (newbie + task) | 1 — "Your 3-day streak stays warm with one full brew a day." (same place) | **0** |
| milestone (atRisk; 375×667 light, 2 configs) | 3 — highlight note, visible: "One full brew a day keeps your streak warm."; announcement "…Today: 25 of 30 minutes. Warm streak: 6 days." (sr-only `<p role=status>`, same text in the live-region log); arithmetic closing line "Your 6-day streak stays warm with one full brew a day." | **0** (note "One full brew a day keeps the kettle warm."; announcement "…6 days warm."; closing line "6 days warm. One full brew a day keeps the kettle warm.") |
| big (celebrate) | 3 — arithmetic closing line "Your 7-day streak stays warm…"; announcement "…Warm streak: 7 days. Cozy level 8…" (sr-only `<p role=status>` and live-region log); Tea Cozy pill sr-only text "You earned a Tea Cozy: it keeps your streak warm for one missed day" (also in innerText/textContent) | **0** ("it covers one missed day, so your warm days keep going"; announcement "…7 days warm. Cozy level 8…"; closing line "7 days warm. One full brew a day keeps the kettle warm.") |
| badge name "Warm Streak", big day only | 3 places, both builds: visible pill text "Badge: Warm Streak II"; the pill art `svg` `aria-label="Warm Streak II"`; the announcement "New badge: Warm Streak." (sr-only `<p role=status>` and live-region log) | the same 3 places, unchanged |
| internal, not user-facing, all days, both builds | `data-kind="streak"` on the days-warm pill's `<li>` and `data-art="streak-mug"` on its `svg` | same |

No "streak" appeared in any toast, in any live region outside the summary, in `title`/`alt` attributes, or in any visible painted text on P other than the badge pill. Nothing else on the page (focus-screen announcers during the run) contained the word.

Whole-page `document.body.innerText` count of "streak" (settled → end after the toggle opens): control routine 0 → 1, task 0 → 1, milestone 2 → 3, big 4 → 5; P routine 0 → 0, task 0 → 0, milestone 0 → 0, big 2 → 2 (both are the badge name: pill text and the "New badge: Warm Streak." sr-only line).

## 3. Real input on the P trial, :5452, big day (check 3)

Full step tables: `tables/check3b-input-v2.md` (session A, fixed script, 375×667 @200 light), `tables/check3-input-v1.md` (first script version: sessions B1/B2/B3/C for both configs, and session A for 390×844 @100 dark). Clips/screens: `check3/P-*-C-tab0N.png`, `check3/P-*-C-final.png`, `check3/*-after.png`, `check3b/*-A-open-end.png`.
Inputs: wheel = `page.mouse.wheel` over the scroll area; touch drag = CDP `Input.dispatchTouchEvent` touchStart / 14 touchMove / touchEnd; tap = `page.touchscreen.tap`; click = `page.mouse.click`; Tab = `page.keyboard.press('Tab')`. `__kettle.timer`/`location.hash` are read only to state the outcome.

### 3a. Scroll, details toggle, Tea time — session A

**375×667 @200 light** (`check3b`, 15 steps, 0 page errors)

| step | scrollTop before → after (max) | sheet top | Chai / kettle clear after | details toggle | last line → footer top |
|---|---|---|---|---|---|
| arrival | 0 (max 1349) | 285.5 | 18.9 / 10.8 | closed | – |
| wheel 1×240 | 0 → 240 | 45.5 | −221.1 / −229.2 | closed | – |
| wheel 3×240 | 240 → 960 | −674.5 | −941.1 / −949.2 | closed | – |
| wheel 14×300 | 960 → 1349 (= max) | −1063.5 | −1330.1 / −1338.2 | closed | **33.6** |
| wheel 14×−300 | 1349 → 0 | 285.5 | 18.9 / 10.8 | closed | – |
| touch drag, finger up 200 px | 0 → 185 | 100.5 | −166.1 / −174.2 | closed | – |
| touch drag, finger up 3× 300 px | 185 → 1040 | −754.5 | −1021.1 / −1029.2 | closed | – |
| touch drag, finger down 3× 300 px | 1040 → 185 | 100.5 | −166.1 / −174.2 | closed | – |
| `Input.synthesizeScrollGesture` touch, −220 and +400 | 185 → 185 and 185 → 185 (no movement) | 100.5 | – | closed | – |
| wheel to top | 185 → 0 | 285.5 | 18.9 / 10.8 | closed | – |
| **tap** on "How your leaves added up" (after wheel brought it into view) | 1349 → 1349 (max 2107) | −1063.5 | – | **open**, panel 758 px high | −710.4 (panel extends below the fold) |
| wheel to the end with the panel open | 1349 → 2107 (= max) | −1821.5 | – | open | **47.6** |
| wheel up until the toggle shows, then **click** it | 2107 → 1349 | −1063.5 | – | **closed**, panel 0 px | 33.6 |
| wheel to top | 1349 → 0 | 285.5 | 18.9 / 10.8 | closed | – |
| **tap** on "Tea time · 5 min" | summary left | – | – | – | – |

Outcome of the Tea time tap: `location.hash = #/focus`, timer `status running / phase shortBreak`, screen heading "Tea break" (buttons "Rain", "Another idea").
Touch-action / overscroll chain at the scroll area: `touch-action auto`, `overflow-y auto`, `overscroll-behavior-y contain` (scroll area), `overflow-y hidden` on the two ancestors. `synthesizeScrollGesture` also did not move the page in the first script version (0 → 0, on both configs) — in this headless setup that CDP gesture call scrolls nothing, while CDP touch events and the wheel do; recorded as a tooling fact, not an app fact. It was not run against the control.

**390×844 @100 dark** (first script version; session A re-run was cut off at 10:45 after ~15 min without progress — see Incomplete). Valid steps from the first run: wheel 1×240: 2 → 242 (max 275), sheet top 392 → 152; wheel 3×240: → 275 (= max), sheet top 119, last line → footer **34.5**; tap on the toggle: open, panel 318.5 px, max scroll 593; wheel to the end: 593, last line → footer **48.0**; click on the toggle: closed, scroll back to 275, last line → footer 34.5; wheel to the top: scrollTop 0, Chai / kettle clear 20.8 / 12.4; tap on Tea time: summary left, `#/focus`, timer `running / shortBreak`. Touch drags were not run in this config.

### 3b. Tea time and Skip break, each in a fresh session (hit test at the button centre first)

| config | action | element under the centre point | result | time to result |
|---|---|---|---|---|
| 375×667 @200 light | click Skip break | span in "Skip break" | summary closed, `#/`, timer idle/focus, Home ("Good afternoon, Mika") | 254 ms |
| 375×667 @200 light | click Tea time | span in "Tea time · 5 min" | `#/focus`, timer running/shortBreak, "Tea break" | 222 ms |
| 375×667 @200 light | **tap** Skip break | span in "Skip break" | summary closed, `#/`, idle/focus | 353 ms |
| 390×844 @100 dark | click Skip break | span in "Skip break" | summary closed, `#/`, idle/focus | 341 ms |
| 390×844 @100 dark | click Tea time | span in "Tea time · 5 min" | `#/focus`, running/shortBreak | 249 ms |
| 390×844 @100 dark | **tap** Skip break | span in "Skip break" | summary closed, `#/`, idle/focus | 314 ms |
(Tea time by tap: in the two session-A runs above, both configs, same result.)

### 3c. Tab walk through the summary (big day; fresh session per config; 450 ms after each Tab)

| config | stop | element | `:focus-visible` | ring (computed) | wholly in visible area / hit-test returns itself | sheet scrollTop |
|---|---|---|---|---|---|---|
| 375×667 @200 light | 0 (arrival) | h1 "25 minutes brewed" (programmatic focus) | false | outline none | **no** (line box 339.5–462.7 vs fold 460.8) / yes | 0 |
| | 1 | button "How your leaves added up" | true | no outline; `box-shadow: rgb(36,119,184) 0 0 0 3px inset`; outline-offset 3px | yes / yes | 1349 (= max) |
| | 2 | button "Tea time · 5 min" | true | outline solid 3px rgb(36,119,184), offset 3px | yes / yes | 1349 |
| | 3 | button "Skip break" | true | outline solid 3px rgb(36,119,184), offset 3px | yes / yes | 1349 |
| | 4 | focus left the page content (`document.body`) | – | – | – | – |
| 390×844 @100 dark | 0 (arrival) | h1 | false | outline none | yes / yes | 2 |
| | 1 | button "How your leaves added up" | true | `box-shadow: rgb(143,208,255) 0 0 0 3px inset` | yes / yes | 275 (= max) |
| | 2 | button "Tea time · 5 min" | true | outline solid 3px rgb(143,208,255), offset 3px | yes / yes | 275 |
| | 3 | button "Skip break" | true | outline solid 3px rgb(143,208,255), offset 3px | yes / yes | 275 |
| | 4 | focus left the page content | – | – | – | – |

The computed style of each stop differs from its own unfocused baseline in the ring properties listed (outline for Tea time and Skip break; inset box-shadow for the toggle); the first child of each button shows no delta. A 14 px-padded clip of stops 1 and 2 is saved (`check3/P-375x667_2_light_200-C-tab01..02.png`, `check3/P-390x844_2_dark_100-C-tab01..02.png`); the Skip break clip was skipped by my script (its padded box ran past the viewport bottom), so stop 3 (Skip break) has no image; `…-C-final.png` was taken after focus had left the page (stop 4). The big day has no task chips and no auto-start "Wait" button, so these three are the whole tab sequence there.

## 4. Wider configurations, big day only (check 4; light theme; control and P in one launch each)

Day = `celebrate` (record-player unlock). Same measurements as check 1 (`lp-probe2.mjs`); settled state; end = after the real click on the toggle and the wheel to the bottom. Configs run are exactly the rows below: 1440×900 @200 has a control row only (the P run produced NO DATA — its context timed out waiting for `#/done` under machine load); the dark-theme configs were not run (see Incomplete). Full per-phase table: `tables/check4-geometry-full.md`.

| cfg | build | layout (sheet box l–r × t–b) | scroll lift / air | Chai img box (l–r × t–b), in viewport | viewport | kettle svg box (l–r × t–b) | kettle drawn ink (l–r × t–b), incl. faint glow | horizontal overlap sheet ∩ Chai img / ∩ kettle svg | Chai img wholly in viewport | heading in view (box / ink) | text lines cut by fold (box / ink) | unlock card visible px / height; unlock canvas boxes | controls covered (elementFromPoint) | Tea time + Skip break centre hit-test | last line → footer at end | page errors |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1440x900-light-t100 | control | 910.4–1400 × 29.3–732.8 | 0 / 0 | 514.3–700 × 537.9–792.6 | 1440×900 | 71.3–535.3 × 380–806.4 | 197.8–507.7 × 518.8–829 | 0 (and vertical 194.9) / 0 (vertical 352.8) | True | True / True | 0 / 0 | 321.4/321.4; 942.4–1368×145.4–384.8 | 0 | ok | 39 | 0 |
| 1440x900-light-t100 | P | 910.4–1400 × 29.3–732.8 | 0 / 0 | 514.3–700 × 537.9–792.6 | 1440×900 | 71.3–535.3 × 380–806.4 | 197.8–507.7 × 518.8–829 | 0 (and vertical 194.9) / 0 (vertical 352.8) | True | True / True | 0 / 0 | 321.4/321.4; 942.4–1368×145.4–384.8 | 0 | ok | 39 | 0 |
| 1440x900-light-t200 | control | 910.4–1400 × 24–1237.4 | 0 / 0 | 514.3–700 × 537.9–792.6 | 1440×900 | 71.3–535.3 × 380–806.4 | 197.8–507.7 × 518.8–829 | 0 (and vertical 254.7) / 0 (vertical 426.4) | True | True / True | 1 / 0 | 435/452.4; 942.4–1368×291–530.4 | 0 | ok | 39.6 | 0 |
| 844x390-light-t100 | control | 508–828 × 12–775.7 | 0 / 0 | 298.1–425.5 × 146–320.8 | 844×390 | -6–312.4 × 37.7–330.3 | 80.8–293.5 × 132.9–345.7 | 0 (and vertical 174.8) / 0 (vertical 292.6) | True | True / True | 0 / 0 | 111.3/253; 534–802×128.7–279.4 | 0 | ok | 32.8 | 0 |
| 844x390-light-t100 | P | 508–828 × 12–775.7 | 0 / 0 | 298.1–425.5 × 146–320.8 | 844×390 | -6–312.4 × 37.7–330.3 | 80.8–293.5 × 132.9–345.7 | 0 (and vertical 174.8) / 0 (vertical 292.6) | True | True / True | 0 / 0 | 111.3/253; 534–802×128.7–279.4 | 0 | ok | 32.8 | 0 |
| 844x390-light-t200 | control | 508–828 × 26.4–1478 | 0 / 0 | 298.1–425.5 × 146–320.8 | 844×390 | -6–312.4 × 37.7–330.3 | 80.8–293.5 × 132.9–345.7 | 0 (and vertical 174.8) / 0 (vertical 292.6) | True | False / True | 1 / 0 | 0/444.8; 534–802×327.3–478 | 0 | ok | 34.4 | 0 |
| 844x390-light-t200 | P | 508–828 × 26.4–1478 | 0 / 0 | 298.1–425.5 × 146–320.8 | 844×390 | -6–312.4 × 37.7–330.3 | 96.2–293.5 × 139.2–345.7 | 0 (and vertical 174.8) / 0 (vertical 292.6) | True | False / True | 1 / 0 | 0/444.8; 534–802×327.3–478 | 0 | ok | 34.4 | 0 |
| 667x375-light-t100 | control | 331–651 × 12–775.7 | 0 / 0 | 195.3–283.2 × 202.9–323.5 | 667×375 | -14.5–205.2 × 128.2–330.1 | 45.4–192.1 × 193.9–340.7 | 0 (and vertical 120.6) / 0 (vertical 201.9) | True | True / True | 0 / 0 | 96.3/253; 357–625×128.7–279.4 | 0 | ok | 32.8 | 0 |
| 667x375-light-t100 | P | 331–651 × 12–775.7 | 0 / 0 | 195.3–283.2 × 202.9–323.5 | 667×375 | -14.5–205.2 × 128.2–330.1 | 45.4–192.1 × 193.9–340.7 | 0 (and vertical 120.6) / 0 (vertical 201.9) | True | True / True | 0 / 0 | 96.3/253; 357–625×128.7–279.4 | 0 | ok | 32.8 | 0 |
| 667x375-light-t200 | control | 331–651 × 18.9–1470.5 | 0 / 0 | 195.3–283.2 × 202.9–323.5 | 667×375 | -14.5–205.2 × 128.2–330.1 | 45.4–192.1 × 193.9–340.7 | 0 (and vertical 120.6) / 0 (vertical 201.9) | True | False / True | 1 / 0 | 0/444.8; 357–625×319.8–470.5 | 0 | ok | 34.4 | 0 |
| 667x375-light-t200 | P | 331–651 × 18.9–1470.5 | 0 / 0 | 195.3–283.2 × 202.9–323.5 | 667×375 | -14.5–205.2 × 128.2–330.1 | 45.4–192.1 × 193.9–340.7 | 0 (and vertical 120.6) / 0 (vertical 201.9) | True | False / True | 1 / 0 | 0/444.8; 357–625×319.8–470.5 | 0 | ok | 34.4 | 0 |

Reading the rows: the three side-by-side layouts (844×390, 667×375, 1440×900) put the summary in a card to the right of the stage (sheet box l–r above), so the sheet never lies over the Chai image or the kettle (horizontal overlap 0 in every row; the "vertical" figure is only how far their vertical ranges coincide). "Unlock card visible px / height" is how much of the record-player card lies between the card's visible top and the fold at the end of the entrance; "unlock canvas boxes" are the 3D close-up canvas rectangles (viewport coordinates). Kettle svg boxes whose left edge is negative extend past the viewport's left edge; the ink columns give the drawn extent. Control and P give the same numbers for every column of this table in every config run, with these exceptions found by a field-by-field comparison of the two builds' JSON: (a) the presence of `data-stage-figure` on P's Chai and kettle (control has none); (b) animation phase at the 4.5 s snapshot — in one pair (844×390 @200) the kettle's glow ellipse still had opacity 0.5 on P vs 0.08 on control, which moves the drawn-ink left/top (96.2/139.2 vs 80.8/132.9 as shown), and in 667×375 @100 one small svg inside the record-player card sits at a different animation position in the objects-across-the-fold list; (c) at 200 % text the end-state scroll height is 2387 px on control vs 2429 px on P (667×375 and 844×390: scrollTop at the end 2238 vs 2280), 42 px more content on P, while the last line's gap to the footer is the same 34.4 px on both (the closing arithmetic line is worded differently on the two builds — "7 days warm. One full brew a day keeps the kettle warm." vs "Your 7-day streak stays warm with one full brew a day." — the cause of the 42 px was not isolated).

## 5. Captures kept (full size PNG, settled at 4.5 s after `#/done`, control and P from the same launch)

Folder `check1/captures/`, `check4/captures/` (names `<cfg>-<day>-{control,P}.png`; `-end-` = after the real click on "How your leaves added up" and the wheel to the bottom). Phone captures are 2× (750×1334 for 375×667, 780×1688 for 390×844); 1440×900 is 1×.

| requested | file (control / P) |
|---|---|
| 375×667 light @100, task day | `check1/captures/375x667-light-t100-task-control.png` / `…-task-P.png` |
| 375×667 light @200, task day | `check1/captures/375x667-light-t200-task-control.png` / `…-task-P.png` |
| 390×844 dark @200, big day, settled | `check1/captures/390x844-dark-t200-big-control.png` / `…-big-P.png` (the two files are byte-identical: md5 `2bc34777cb1ff222559af143436917e9`) |
| 390×844 dark @200, big day, end (arithmetic open, scrolled to the bottom) | `check1/captures/390x844-dark-t200-big-end-control.png` (md5 `25c1e850…`) / `…-big-end-P.png` (md5 `047779a3…` — differs from control) |
| 375×667 dark @100, routine day | `check1/captures/375x667-dark-t100-routine-control.png` / `…-routine-P.png` |
| 1440×900 light @100, big day | `check4/captures/1440x900-light-t100-big-control.png` / `…-big-P.png` (files differ byte-wise; geometry in §4 is identical on both) |
| extra: milestone day 375×667 light @100 and @200 | `check1m/captures/375x667-light-t100-milestone-{control,P}.png`, `…-t200-milestone-{control,P}.png` |
| extra: real-input stills | `check3/` (Tab-stop clips, post-action screens, details-open end screens), `check3b/*-A-open-end.png` |

Per-run JPEGs (arrival / settled / end, quality 82, DPR 2) for every run of checks 1, 1m and 4 are in each `<cfg>/` sub-folder as `<C|P>-<day>-<phase>.jpg`; the raw numbers per run are `<C|P>-<day>.json` there.
Evidence size: about 28 MB under `…/W2R2/review/LP/` (limit 150 MB).

## 6. Specs on the trial (check 6)

**Not run.** `KETTLE_PORT=5442 npx playwright test tests/w2-summary.spec.ts tests/whistle.spec.ts --project=chromium --workers=1` was queued behind the slot gate as the fourth item of my gated job and was dropped (edited out of the job script) at 10:45 when the time box ran short: my job had waited from 10:00:55 to 10:25:42 for a slot (3 slots, the T lane holding 2 of them and several LEAD/LC jobs queued ahead; machine load average 12–14 throughout), and the earlier items took priority. Result: **0 run, pass/total = n/a**. For reference only: the maker's packet reports w2-summary 18/18 and whistle 8/8 on `a4f1773`; I did not verify that. A queued LEAD job (`KETTLE_PORT=5442 … w2-summary whistle a11y`) was visible in the gate's waiting list.

## Incomplete / deviations (everything not done as briefed)

1. **Spec (check 6): not run** — see above.
2. **Check 3, session A (wheel / touch / toggle / Tea time):** complete for 375×667 @200 light (fixed script, `check3b/`). For 390×844 @100 dark only the first script version ran: wheel, toggle open and close, Tea time tap are valid; **touch drags were not run in that config** (the re-run with the fixed script hung without progress for ~15 min and was killed at 10:45; its leftover is `check3b/P-390x844_2_dark_100-A.KILLED-no-steps.json.txt`). `Input.synthesizeScrollGesture` moved nothing in this headless setup (tooling fact). Touch/wheel were not run on the control, and the Tab walk was not run on the control or on a task day.
3. **Check 4 (wider configs):** run (big day, **light theme only**): 844×390 @100 and @200, 667×375 @100 and @200, 1440×900 @100 — control and P each; 1440×900 @200 — **control only** (the P context timed out after 30 s waiting for `#/done`: `NO DATA`, `check4/1440x900-light-t200/P-big.json` holds the error; machine load). **Not run:** the six dark-theme configs. Captures for 1440×900 light @100 exist for both builds.
4. **Milestone day (extra to the brief's three days):** 2 of 8 configs (375×667 light @100 and @200); the 390×844 and dark configs were not run.
5. **Kettle anatomy** was run for 375×667 and 390×844 light @100 only (routine day), not for 200 % or the other days; the per-run offsets in §1d for other widths/days are derived, not measured.
6. **Captures:** all five requested captures exist for both builds (four from check 1, the 1440×900 light @100 big-day one from check 4); see §5.
7. Not measured: reduced-motion, DPR 1 phones, the BEFORE capture set's other tags (`-mon`, `-night`), the break screens, Home after Skip break beyond the hash/heading, autoplay/auto-start "Wait" countdown.
8. First-attempt runs (09:48–09:54, 09:52–09:59 check 3 session A) and their problems are listed in the commands table; nothing from the discarded runs is in the evidence folder.
9. Machine load average was 9–14 during all runs; arrival (1.5 s) and settled (4.5 s) are wall-clock from `#/done` and were identical for geometry in all 48 pairs, but the live-announcement text can lag the 1.5 s snapshot (1 of 8 control big-day arrivals).
10. No source edit, commit, push or merge. No server started or stopped. Leftover processes of mine: none (`pgrep` for my probe, input, kettle and gate-wrapper processes at 10:56 returned nothing).
