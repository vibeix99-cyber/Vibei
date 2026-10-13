
## §6.4 / T-D3 · invariant 1

### (a) `notice-zone.spec.ts` ×3 on the fix
- **Command**, from `/home/user/wt/w3tr-t2/kettle`, through the gate: `KETTLE_PORT=5446 npx playwright test tests/notice-zone.spec.ts --project=chromium --workers=1 --repeat-each=3 --reporter=list --trace=off`
- **When:** 13:32:25–13:41:40 UTC.
- **Log:** `logs/notice-zone-x3.log`. The failure's page snapshot is in `logs/nz-fail/error-context.md`.
- **Result: 56 passed, 1 failed (exit 1).**

| Test (spec line) | Configuration | Pass / runs |
|---|---|---|
| End → Today (:150) | 390×844 100 % | 3/3 |
| End → Today (:150) | **390×844 200 %** | **2/3** (repeat 2 failed) |
| End → Today (:150) | 375×667 100 % | 3/3 |
| End → Today (:150) | 375×667 200 % | 3/3 |
| End → Today (:150) | 844×390 100 % / 200 % | 3/3 / 3/3 |
| End → Today (:150) | 667×375 100 % / 200 % | 3/3 / 3/3 |
| End → Today (:150) | 1440×900 100 % / 200 % | 3/3 / 3/3 |
| Session stage holds the notices (:226) | 375×667 200 %; 390×844 100 % reduced motion; 667×375 200 %; 844×390 200 % reduced motion | 12/12 |
| Nothing drawn while the Ambience sheet is open (:286) | 844×390, 667×375, both at 200 % | 6/6 |
| Settings › Next brew (:325) | 390×844 100 %, 375×667 200 % | 6/6 |
| A notice that waits keeps its time (:357) | — | 3/3 |

The failure message is verbatim. The spec prints `withNotice of samples`, and does not print the number of hit samples.
```
✘ 40 notice-zone.spec.ts:150:5 › End → Today: … (390×844, 200 %) (8.3s)
Error: notice ∩ protected (15 of 20 samples with a notice)
  + "Saved 3 minutes of focus ∩ Read",
  + "Saved 3 minutes of focus ∩ Create",
  + "Saved 3 minutes of focus ∩ Life",
  + "Saved 3 minutes of focus ∩ 15 min25 min50 minCustom",
  at tests/notice-zone.spec.ts:206:100
```
The controls hit are three tag chips (Read, Create, Life) and the Brew length group.

### (b) Lead probe `end-scrolled` (with change 1)
- Configurations: 375×667 and 390×844 at 100/200 %, light, dpr 2.
- Fix :5446 against control :5410. The hold before the Mark done tap is 6 s, as the lead's default.
- Raw: `raw/end-scrolled-*.json`. Summary lines: `runs/ABC.jsonl`, rows 1–8, run 15:06–15:10.

{END}

- **On the fix,** every sample in all 4 configurations is clear of the protected set, across every phase (after-End, scrolling, scrolled, after-MarkDone, after-Undo).
- The notice-zone spec failure in (a) is the same flow family (End → Today at 390×844 @200), from the spec's own sampler. **It was not reproduced by this probe run.**

## §6.2 / T-D1 · Today Undo

- **Runs:** fix :5446, `today` flow. @100 is light and @200 is dark, as the checker's "light (dark at 200 %)".
- **Raw:** `raw/today-*.json`; summary `runs/ABC.jsonl` rows 9–40 and `runs/R.jsonl` (reruns).
- **Rows replaced by a rerun.** The original raw JSON of each was overwritten by the rerun, which has the same file name. The original summary lines remain in `runs/ABC.jsonl`.
  - **390×844 @100 end/up (original):**
    - The wheel was sent during Today's entry. It landed at the moment of the Mark done tap: scroll went 0 → 593 → 447 in the first 224 ms after the tap.
    - No "Crossed off" was raised: 2 waiting, 0 drawn, for 4.3 s. The tap did not register as Mark done.
    - This is a probe artifact; it was fixed and rerun.
  - **375×667 @100 end/gone (original):** the probe waited for End's notices after scrolling. They stayed waiting (2) because their band was off screen, so the tap was made with 2 waiting, not after they had gone. It was rerun with change 2(b).
    - The original line: first sample 178 ms, 9/9, real Undo restored "Chapter 3 notes", 0 hits.
  - **375×667 @200 0/gone and the 667×375 @200 rows (original):** setup failures.
    - 375×667 @200 0/gone: `page.waitForFunction: Timeout 15000ms exceeded`.
    - 667×375 @200, all 4 rows: `locator.click: Timeout 30000ms exceeded` on the task field.
    - All were rerun, with change 2(c) for 667×375 @200.
- **The table below lists each configuration's final run.** `ABC.jsonl` rows that a rerun replaced are omitted. The "Src" column names the file.

{TODAY}

**Notices at tap time.**
- In the "up" rows **at scroll 0**, End's 2 notices were **drawn** at the tap (column "drawn / waiting" = 2 / 0, or 1 / 1).
- In most "up" rows **at the end position**, they were **waiting** (0 / 2): Today's Hero band was off screen after the wheel.
- 844×390 @100 end/up had them drawn (2 / 0).

**Slowest first draws: the two rows where End's notices were drawn at the tap and Mark done was tapped at scroll 0** (samples from `raw/today-fix-{390x844,844x390}_2_light_100-pos_0_when_up.json`):
- **390×844 @100:**
  - "Saved 3 minutes of focus" stays drawn at 0, 112 and 223 ms after the tap.
  - At 336 ms it is gone (1 waiting). In the same sample the composer zone changes (rank-2 box h 279 → 454, plus a new rank-2 zone at y 494, h 67).
  - "Crossed off · Undo" is first drawn at 455 ms.
- **844×390 @100:**
  - "Saved" stays drawn through 559 ms.
  - Yield and zone change at 672 ms.
  - "Crossed off" is first drawn at 784 ms (sampler 826 ms, poll 848 ms).
- **Every other tapped row:** first drawn 75–227 ms after the tap.

**N/A rows.** Mark done was not wholly on top at scroll 0, so it was not tapped:
- 375×667 @100: covered by "Put the kettle on · 25 min", the docked start.
- 375×667 @200 and 390×844 @200: Mark done at y 1322 and y 1229, below the viewport.
- 844×390 @200: Mark done at y 456, outside the 390 px viewport.
- 667×375 @100: covered by the docked start.
- 667×375 @200 (rerun, field focused by fallback 2(c)), at scroll 0: Mark done at y 495, below the 375 px viewport.

These agree with the maker's own N/A statement for 390×844 @200 and 375×667 @100 at scroll 0, and add 375×667 @200, 844×390 @200, 667×375 @100 and 667×375 @200 at scroll 0.

**667×375 @200 end/up and end/gone: no T-D1 row.**
- At the page end (max scroll reached 1962), Mark done was not on top.
- After the one-step wheel back and the lead's `wheelInto` (up to 60 wheel steps), Mark done sat at y 70, scroll 425, and its centre was covered by **"Put the kettle on · 25 min"** (the docked start), so it was not tapped.
- The maker reports the same configuration as "Undo not drawn in 3 s (Mark done at y 60, scroll 0)". No scroll position was found where Mark done was on top for a real tap. **No result on whether the Undo is drawn there.**

## §6.3 / T-D2 · History delete and Settings import

- **Runs:** fix :5446 and control :5410; seed `veteran`, light.
- **History "last":** the first page's last row, wheeled into view. **"mid":** row 5 of 10.
- **Raw:** `raw/history-*.json`, `raw/import-*.json`; summary `runs/ABC.jsonl` rows 41–64 and `runs/R.jsonl` (the 390×844 @200 import reruns).
- **How placement is classified:** "R-3 fallback" when the notice region's bottom equals the tab bar's top − 14 px (±3), which is the fallback's formula in `Toast.tsx` l.368–384; otherwise "band". This is inferred from boxes. The DOM carries no marker for it.
- **"Δ first − gone"** is the first drawn sample minus the first sample with no dialog and no `#root[inert]`. Both are in ~100 ms samples.

{HIST}

**Harness gaps (both sides, not product results):**
- **375×667 @200 History, last and mid, fix and control:**
  - The Edit sheet opened on the 2nd tap.
  - After the confirm-Delete tap, the dialog and `#root[inert]` stayed for the whole 6 s, and rows stayed 10 → 10. No delete happened, so no Undo could be expected.
  - This is the same harness gap that the lead and the maker reported at this configuration.
- **375×667 @200 import, fix and control:** the real tap on "Import a backup" raised no file chooser in 8 s (`page.waitForEvent: Timeout 8000ms exceeded while waiting for event "filechooser"`).
- **390×844 @200 import:** the first runs failed on the sheet's confirm button. The fix run failed with "Element is not attached to the DOM / element is not stable"; the control run with a 30 s timeout on `Add|Restore|Replace`. Reruns with change 4's retry (15:35–15:36) failed again on both sides: the sheet "Add this backup?" was present, but `[role="dialog"] button` listed **no buttons**, and `getByRole('button', {name: /^(Add|Restore|Replace)$/})` timed out 4 × 4 s. **No result at 390×844 @200 for the import, on either side.**

## §6.5 / T-D4 · edge margin and safe area

- **CDP `Emulation.setSafeAreaInsetsOverride` is available** in this Chromium (Playwright's bundled build). It returned OK, and the probe element read the inset back: requested 47/0/34/0 → `env()` read top 47, bottom 34.
- **Minimum notice top and notice boxes outside the viewport**, per run, for every probe run (fix and control):

{TOP}

The probe-read `right: 15` at 844×390 and 667×375 is the page's 15 px classic scrollbar, not a safe-area inset. The probe reads `innerWidth − box.right`, and those two contexts are not `isMobile`, so they have a classic scrollbar.

Minimum notice top over all **fix** runs without an inset: **{FIXMIN} px**. Notice boxes outside the viewport, over all fix runs: **{FIXOUT}**.

With the inset emulated:
- **Summary, 390×844 @100, top inset 47:** minimum top **58** (= 47 + 11).
- **Today, 375×667 @200, end/up, top inset 47:** minimum top **55** (= 47 + 8).
- **Today, 667×375 @100, end/gone, left and right insets 47:** notice boxes start at x ≥ 392. Minimum top **18**, with top inset 0.

The receipt checks the boxes of the drawn notices (`li`). Region boxes outside the viewport were also counted per phase (`regionOutside` in the run's byTag). It is absent, i.e. 0, in every run.

## §6.6 / T-D5 · summary on T + P (fix trial)

- **Runs:** `summary` flow, light, 390×844 and 375×667 @100. Two notices raised at `finish()`.
- **Raw:** `raw/summary-fix-*.json`. **Frames:** `raw/summary-fix-390x844_2_light_100-/arrival-{300,800,1500,2500,4000}ms.png` and the same names for 375×667.

| Config | Samples | Hit samples | Samples with 2 notices | Notice y-range (all samples) | Two-notice steady boxes (CSS px) | Chai box (`_chai_*`) | Stage zone |
|---|---|---|---|---|---|---|---|
| 390×844 @100 | 148 | **0** | 71 | 11–177 | [8,11,374,57], [68,76,254,52] | [236,216,113,155] | [0,0,390,422] |
| 375×667 @100 | 110 | **0** | 71 | 11–177 | [8,11,359,57], [61,76,254,52] | [227,115,109,149] | [0,0,375,313] |
| 390×844 @100, inset top 47 | 74 | **0** | 71 | 58–214 | [8,58,374,57], [68,123,254,52] | [236,216,113,155] | [0,0,390,422] |

Frames opened, at full size:
- **390×844 1500 ms:**
  - The notices' bottom is at about y 128.
  - The kettle (lid knob, handle, gauge ~290–330, flame) and Chai (face ~250–320) are below them and clear.
- **390×844 300 ms**, the whistle frame ("Tea's ready!", 0:00):
  - The top bar (Rain, mute) is at y ~10–50. The notices are at y 60–177.
  - The steam puffs (x ≈ 10–65) are left of the second notice (x 68–322). The kettle and Chai are clear.
- **375×667 1500 ms:**
  - The second notice's bottom edge (y ≈ 128) meets the top of the kettle's handle and the knob on Chai's head and the sparkles.
  - The gauge (~180–210) and Chai's face (~160–200) are clear. Lead ruling R-1 covers the 375×667 @100 two-line case.
- The kettle gauge has no class or id in the DOM, so the probe has no box for it. Its position comes from the frames.

## §6.8 · not worse (fix :5446 unless stated; `--project=chromium --workers=1`)

Index with times: `logs/specs-index.log`. Each log is `logs/spec-<name>.log`.

| Spec (line on this tree) | Command extras | Result | Time (UTC) |
|---|---|---|---|
| `integrity.spec.ts:1090` (storage-full banner, Mark done; 390×844, 375×667, 1440×900) | `--repeat-each=3` | **9 passed** | 15:11–15:12 |
| `integrity.spec.ts:1004` at 1440 (`--grep 1440`) | `--repeat-each=3` | **3 passed** | 15:12–15:14 |
| `toast-room.spec.ts` + `w2-home.spec.ts` | — | **32 passed** (14 + 18) | 15:14–15:21 |
| `statusbar.spec.ts:114` dark. This is the brief's `:106`, "large text with large leaf totals…", which sits at l.106 on base `b377c62` and at l.114 on this tree | `--grep dark --repeat-each=3` | **3 passed** | 15:21–15:24 |
| `break-reach.spec.ts:184`. This is the brief's `:179`, "Break's over with a carried task", 375×667 light, 390×844 dark, 844×390 light; it is at l.184 on this tree. Monday 2026-10-12, the spec default | — | **3 passed** | 15:27–15:28 |
| `break-reach.spec.ts:184` Thursday (`KETTLE_AT=2026-10-15T07:40:00.000Z`) | — | {THU} | 15:31– |
| `integrity.spec.ts:637` (Skip break / Next brew / That's all for now), **fix** :5446 | `--repeat-each=3` | **3 passed** | 15:24–15:26 |
| `integrity.spec.ts:637`, **control** :5410 from `/home/user/wt/w3-base/kettle` | `--repeat-each=3` | **3 passed** | 15:26–15:27 |

Line numbers were checked by reading the test title at each line on both trees: `integrity :1090/:1004/:637` are the same on both.

## Not done / incomplete

- **break-reach weekdays:** only Monday (spec default) and Thursday were run, not all 7.
- **History and import at 375×667 @200:** harness gaps on both sides (above). No product result.
- **≤ 1 frame:** sampling is ~100 ms (accepted by the checker), with a 40 ms poll alongside. No per-frame trace was made.
- **T-D5 coverage:** @200, dark, 1440×900, the big day (record player), and the K02/K03/PRESERVE 8 REFERENCE → BEFORE → AFTER triples were not produced by this lane. Only the two @100 light summaries, plus one with an inset.
- **§6.2 at 844×390 and 667×375:** the brief asks for dark at 200 % only; light @200 was not run. No control runs were made for T-D1. The control's Undo rows are in the end-scrolled table only.
- **Not run by this lane:** §6.8 `a11y`, tsc, vitest, timer/pwa, and the full chromium suite.
- **Lost time:** the usage-limit stop and container restart (about 13:45–14:57) took about 70 minutes of the original box.
