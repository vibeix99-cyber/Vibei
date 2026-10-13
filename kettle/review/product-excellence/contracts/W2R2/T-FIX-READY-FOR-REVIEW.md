# W2R2 · Maker T · fix round (CHECKER-W2R2-T §6)

**Status: WIP.** §6 items missing or failing:
- **4 (T-D3):** invariant 1 is still violated. `notice-zone` End → Today fails at 375×667 @100 in the final full suite, and at 375×667 @200 in a ×2 run. The cause is not found.
- **5:** the safe-area emulation is BLOCKED.
- **6:** the E2 triples, the big day, the arrival, and 1440 are missing.
- **7:** controls rerun, the session waits-at-rest rows, captures, and R8-F1 are missing.
- **2:** 667×375 @200 is not drawn, and the ≤ 1-frame criterion is unproven.
- **3:** the Settings import rows and 375×667 @200 History are missing.

Done:
- T-D1 rows at the portrait configurations;
- T-D2 History with the R-3 fallback;
- T-D4 inset (≥ 8 px);
- D (AX tree);
- `:637` shown to be pre-existing;
- tsc, vitest, and timer/pwa.

| | |
|---|---|
| Branch | `pe/w2r2-toast` (local only, never pushed). New commits sit on top of `4620796`; no history was rewritten |
| Code | `887696e` (`kettle/src` tree `ed027d6ae3a47746ae965ac96a12b365398c6eac`) |
| Packet | the commit that adds this file |
| Trial (integration with P) | Local merge of `2f67fc1` and my revision in `/home/user/wt/w3t-p`. It was kept current by merging each fix commit; the last merge is `1bd4f24` = `2f67fc1` + `887696e`, `kettle/src` tree `958ce86`. Served on dev :5424. None of P's changes are on my branch |
| Changed since `4620796` | `src/ui/Toast.tsx`, `src/screens/home/Composer.tsx`, `src/screens/home/Home.module.css`; no test file changed |
| Control | `b377c62` on :5410 (shared, read-only) |
| Evidence | `T/fix/` (raw probe JSON per run, logs, the announcer AX dump). Probes: `T/tools/nz.mjs` (`undo*`, `history-*` and `summary*` flows), and a copy of the lead's `t-lead.mjs` |

## The changes
- **T-D1, Today Undo:**
  - A drawn notice without an action now yields its place to a waiting Undo the person raised. It goes back to waiting with its remaining time.
  - After Mark done, the carried row's place stays as a notice zone (rank 2) while its Undo can be up. The slot sits right under the field, above Recent, at least 67 px tall at 100 % and `1.27rem + 37px` at 200 %.
  - Focus moving to the Undo no longer collapses Recent. Collapsing it shortened the page and made it scroll back between the tap's press and its click, so the tap missed.
  - A stack drawn taller than its band (rule 4) no longer jumps to another zone.
- **T-D2, R-3:** on a screen with no zone, an action notice that no band in view can hold whole is drawn where the base drew notices: 14 px above the tab bar as drawn (20 px above the bottom without a tab bar), centred, max 440 px, whole. It is the only exception to invariant 1, and the notices drawn there are listed per row.
- **T-D3:** the layout is re-measured in every animation frame while any notice is up, and in the same task on any DOM insertion or removal. A new notice is drawn only into a band that held still since the last measure.
- **T-D4:** every band is inset by 8 px plus `env(safe-area-inset-*)` (read from a probe element) on the top, left and right, and by the safe area plus GRACE at the bottom. GRACE stays inside that box. A leaving notice is removed in the same frame, so it is never drawn outside a band that moved.
- **D:** `aria-atomic="false"` on the announcer. `role=status` implies `true`, which would re-read earlier lines.

## §6 items

### 1. Revision
- Code `887696e`, tree `ed027d6`.
- The trial `1bd4f24` (tree `958ce86`) = integration `2f67fc1` (with P) + `887696e`.
- Some trial rows ran on earlier trial merges of the same series; each row names its revision.

### 2. T-D1 rows (Undo of Mark done; real taps; sampled about every 100 ms in animation frames)
| Config | Flow | Mark done y / scroll | First drawn after tap | Undo box (x,y,w,h) | Hit points | Field after a real Undo | Hit samples | Min notice top |
|---|---|---|---|---|---|---|---|---|
| 390x844@2:light:100 | undo0-early | 489 / 0 | +127 ms | [276, 109, 57, 36] | 9/9 | 'Chapter 3 notes'  | 0/23 | 101 |
| 375x667@2:light:100 | undoS-early | 48 / 440 | +454 ms | [267, 82, 56, 35] | 9/9 | 'Chapter 3 notes'  | 0/50 | 74 |
| 375x667@2:light:200 | undoS-early | 75 / 1200 | +226 ms | [243, 124, 92, 39] | 9/9 | ''  | 0/31 | 8 |
| 390x844@2:dark:200 | undoS-early | 60 / 1169 | +112 ms | [259, 109, 94, 40] | 9/9 | ''  | 0/35 | 8 |
| 667x375@2:light:100 | undoS-early | 26 / 227 | (not sampled) | [258, 165, 56, 35] | 9/9 | 'Chapter 3 notes'  | 0/37 | 200 |
| 844x390@2:light:100 | undoS-early | 15 / 169 | +198 ms | [337, 78, 56, 35] | 9/9 | 'Chapter 3 notes'  | 0/45 | 68 |
| 375x667@2:light:100 | undoS-late | 48 / 440 | +127 ms | [267, 82, 56, 35] | 9/9 | 'Chapter 3 notes'  | 0/66 | 73 |
| 375x667@2:light:200 | undoS-late | 75 / 1200 | +141 ms | [243, 124, 92, 39] | 9/9 | ''  | 2/67 | 8 |
| 390x844@2:dark:200 | undoS-late | 29 / 1200 | +142 ms | [258, 48, 92, 39] | 9/9 | ''  | 0/73 | 8 |
| 390x844@2:light:100 | undoS-late | 88 / 400 | +194 ms | [274, 122, 56, 35] | 9/9 | 'Chapter 3 notes'  | 0/56 | 113 |
| 667x375@2:dark:200 | undoS-late | 60 / 0 | (not sampled) | [] | None/9 | None Undo not drawn in 3 s | 0/119 | 234 |
| 844x390@2:dark:200 | undoS-late | 60 / 396 | +139 ms | [299, 338, 92, 39] | 9/9 | 'Chapter 3 notes'  | 0/60 | 242 |
| **Final code `887696e`** (the @200 rows rerun after the focus/Recent fix) | | | | | | | | |
| 375x667@2:light:200 (887696e) | undoS-early | 75 / 1200 | +101 ms | [243, 124, 92, 39] | 9/9 | 'Chapter 3 notes' | 0/27 | |
| 390x844@2:dark:200 (887696e) | undoS-early | 60 / 1169 | +128 ms | [257, 109, 92, 39] | 9/9 | 'Chapter 3 notes' | 0/30 | |
| 375x667@2:light:200 (887696e) | undoS-late | 75 / 1200 | +176 ms | [243, 124, 92, 39] | 9/9 | 'Chapter 3 notes' | 0/56 | |

- **Drawn and restored on `887696e`:**
  - every portrait row, at 100 and 200 %, scrolled and at scroll 0;
  - 844×390 @100 and @200, and 667×375 @100;
  - first drawn 101–454 ms after the tap. The 454 ms row is 375×667 @100 with End's notices up, on `e5eed8c`, before the yield ran in that frame.
- **On `e5eed8c` (before the blur fix):** the @200 scrolled rows drew the Undo, but the real tap did not restore the task (field `''`). Fixed in `887696e`: the k6 rows above restore `'Chapter 3 notes'`.
- **Missing:**
  - 667×375 @200 dark `undoS-late`: Undo not drawn in 3 s (Mark done at y 60, scroll 0, landscape). **Not passing, not traced.**
  - 390×844 @200 and 375×667 @100 at scroll 0: Mark done sits under the docked start at scroll 0, so it is not "in view". Those rows are N/A.
  - The ≤ 1-frame criterion: first-draw delays are 101–454 ms, measured with ≥ 100 ms sampling.

### 3. T-D2 rows (History delete; real wheel and taps)
| Config | Flow (code) | Rows before / after delete / after real Undo | Notice drawn | Hit samples (R-3 fallback over rows) |
|---|---|---|---|---|
| 375x667@2:light:100 | history-end (a281a30) | 10 / 9 / 10 | yes | 0/19 |
| 390x844@2:light:100 | history-end (a281a30) | 10 / 9 / 10 | yes | 0/21 |
| 390x844@2:dark:200 | history-mid (a281a30) | 10 / 9 / 10 | yes | 18/35 |
| 390x844@2:light:100 | history-mid (a281a30) | 10 / 9 / 10 | yes | 5/23 |
| 390x844@2:light:100 | history-mid (`887696e`, k6) | 10 / 9 / 10 | yes | 8/? (R-3 fallback) |

- **End of page:** a band holds the notice, so 0 hits (390×844 and 375×667 @100).
- **Mid-list:** the R-3 fallback draws it above the tab bar, over rows, as the base did; its hit samples are the declared exception.
- **Every row:** a real Undo brings the row back (10 → 9 → 10).
- **Missing:**
  - 375×667 @200 History (the harness could not open the Edit sheet, the same harness gap as the lead's run);
  - Settings import rows (no flow written);
  - the dialog-leave → first-draw frame delta per row.
- **Lead's `t-lead.mjs history` (390×844 @100) reported "no Undo drawn within 8 s".** That probe taps after 8 s, but the notice was drawn at 1,829 ms (= the dialog leaving) and its 5 s Undo had run out by then. My probe taps within 1 s and restores.

### 4. T-D3
- **The lead's `t-lead.mjs end-scrolled`** on `9ed1613` (:5434) at 375×667 @100/@200 and 390×844 @100/@200: **0 hit samples** in every phase (after End, scrolling, scrolled, after Mark done). Raw: `T/fix/k4/`.
- **The Undo is drawn 138–213 ms after Mark done.** The lead's probe then reports "no Undo within 8 s" only because it looks after 8 s, when the 5 s Undo has expired.
- **`notice-zone.spec.ts` ×2 on `e5eed8c`: 36/38. NOT green.**
  - ✘ End → Today at 390×844 @200, repeat 1: the Undo tap did not restore (fixed in `887696e`).
  - ✘ End → Today at 375×667 @200, repeat 2: "Saved 3 minutes of focus" intersects the tag chips in 17 of 30 samples after Mark done is scrolled into view. **Invariant 1 still fails at this one configuration, intermittently. Cause not found.**
- The ×3 runs at all 10 configurations on the final code are missing. The full suite below runs it once.

### 5. T-D4
- **Minimum notice top in every probe sample** (`undo*` and `summary*` flows; leaving notices are removed in the same frame since `bfc2dfc`): **8 px** on Today scrolled at 200 % and 11 px on the trial summary.
- **One earlier sample at −52** was a leaving notice pinned out of flow. That is the cause fixed in `bfc2dfc`; a run on the final code shows none.
- **Emulated safe-area inset: BLOCKED.** No `Emulation.setSafeAreaInsetsOverride` run was attempted. The code reads `env(safe-area-inset-*)` from a probe element, but that was not proven under emulation.

### 6. T-D5, E2 on the trial (P + T)
- **Two notices on the summary**, 390×844 and 375×667 @100 and @200, light and dark (my probe on trial `25c325c`, and the lead's probe on `39e89c4`): **0 hit samples**. The stack hangs over the window from y 11; the kettle and Chai are clear. Raw: `T/fix/k2/`, `T/fix/k4/summary-*.json`, frames `…/summary2-1500ms.png`.
- The lead's probe confirms the stage zone is present on the summary (`stageZoneInFocus: true`, box 0–422 / 0–313).
- **Missing:**
  - the K02/K03/PRESERVE 8 REFERENCE → BEFORE → AFTER triples;
  - the big day (record player);
  - the whistle → summary arrival with one and two notices;
  - 1440 (the probe's summary flow timed out there).

### 7. T-D6
1. **Full chromium on the final code:** **128/132** on `887696e` (`T/fix/suite-887696e/chromium.log`, `--workers=2`, 22.4 min). Failures: ✘ `integrity.spec.ts:637` (pre-existing flake; see below); ✘ `integrity.spec.ts:1004` at 1440 (the storage banner not gone within 6 s after room was freed: not traced; it passed ×3 on `e44818e`); ✘ `w2-room.spec.ts:144` (Maker C's spec: screenshot timeout under load); ✘ `notice-zone.spec.ts` End → Today at **375×667 @100**: "Saved 3 minutes of focus" over the field, its clear button and Mark done in 15 of 20 samples. **Invariant 1 is still violated (T-D3 not fixed)**.
   - `integrity.spec.ts:637` ×5 fails on both sides: **3/5 on the fix, 4/5 on control `b377c62`**. It is pre-existing (the whistle → summary timing under load). Logs: `T/fix/specs6/i637x5-{fix,control}.log`.
2. **R5-D1, LEAD-D1 and R7-D1 on their own revisions:** missing.
3. **D, the announcer node from the CDP Accessibility tree** (`T/fix/ax-announcer.txt`, on `e5eed8c`'s predecessor; the attribute was then added):
   - role `status`, live `polite`, relevant `additions`;
   - 2 children for 2 notices;
   - 2 mutations for 2 notices (drawn, timed out and gone, with no other mutation).
   - The dump showed `atomic=true` (implied by `role=status`). `e5eed8c` sets `aria-atomic="false"`, but the AX dump was not repeated after that.
4. **Waits-at-rest session rows with a working probe:** missing.
5. **Captures for the full BEFORE set and reduced motion:** missing. The packet's `T/after/` holds 11 configurations from `8d0d8a6`.
6. **R8-F1 measured:** missing. The clip mechanism is gone: no layout animation, and exits are now instant.

### 8. Not worse
- Measured on `8d0d8a6`/`4620796` (CHECKER §2), not rerun on `887696e` beyond the full suite: `:1090` 9/9, `:1004` ×3 at 1440, `toast-room` 14/14, `w2-home` 18/18, `break-reach:179` 7 days, `statusbar :106` ×3.
- tsc: 0 errors on `887696e`.
- vitest: 28/28 files, 275/275 tests on `887696e`.
- timer/pwa: 29 passed, 2 skipped by design (`timer.spec.ts:295` "infra is exercised in the harness", `:439` "render counter lives in the harness") on `887696e`.
- No `screens/done/**`, `scene/**`, art or `SaveWarning*` change (`git diff --name-only 4620796 HEAD`).

## Process
- Every browser went through the gate, lane T.
- Only my own PIDs were killed, by explicit PID: stale waiters and my own playwright job (k3).
- My servers were on :5421, :5434 and :5424 (trial), and are stopped at hand-back.
