# CHECKER W3R1 · Cross-effects of the combined trial (F + S + G + N)

**Finding: no proven combined-only cross-effect.**
- **Four tests were seen failing on the combined trial.** Each is attributed below to an owner by file.
- **One has a proven cause:** S-D1 (closed in S's fix round).
- **One is a flaky test now on the integration branch:** G's pressed-segment test. It needs one test-only change before the final regression (§2, X-2). G's APPROVE stands.
- **Two are one-off or rare load sightings,** carried to F's fix verdict and to the final regression.

| | |
|---|---|
| Lead checker | LEAD-5. I implemented none of this work |
| Combined trial | `e478604` = integration + F `5ee3e7c` + S `344069c` + G `808421d` + N `4168428` (worktree `/home/user/wt/w5tr-all`, src `07c26ff`; dev :5520, preview :5530). It predates G's and S's fix rounds and F's |
| Lane R | `review/LR/ALL/RECEIPT-LR-ALL.md` (complete; six stages, last commit `283ae93`), raw evidence beside it |
| Since then | N `3faaf94` and G `25b5e26` (= `7f95c18`) merged; docs `a859d86`. S's fix `697c1eb` (`CHECKER-W3R1-S.md` §8). F's fix round running |

## 1. What Lane R ran, and what I checked

**The chromium project:** 244/244 tests matched against `--list`, run in three parts on `e478604`:
- **A** (load 10–18): 87 passed, 1 failed;
- **B** (load 6–15): 86/86;
- **C** (load 12): 44 passed, 1 failed, 25 skipped (`w3-notices-load`, gated on `W3_LOAD`).

That is **217 passed, 2 failed, 25 skipped** in the union. Timer, harness and PWA: 29 passed, 2 skipped by design.

**The four failures** were each rerun alone on combined, on base and on the owner's trial (batch 1), then repeated (batch 2, load 5–11). I read the receipt in full, including its rerun tables (§3, §3b, §3c) and its unproven list (§5). For S's case (X-4) I add my own probe's result: the mechanism.

## 2. The four failures, attributed by file

| # | Test | Seen | Reruns (Lane R) | Cause | Class | Owner by file | Action |
|---|---|---|---|---|---|---|---|
| X-1 | `integrity.spec.ts` I03 "storage-full warning is a banner in the page (phone 390×844) › … gone when there is room" (assertion `:1100`: the banner still there 6 s after room is freed) | once, in A (load 10–18) | alone: pass on combined, base, the S trial and the F trial. Repeats: 4/4 on combined. Overall **1 failure in 6 combined-tree runs**, 0 in 3 elsewhere | **Not isolated** (the trace was not opened). The step waits a fixed 6 s for the banner to go after a write succeeds | **FOLLOW-UP / UNKNOWN.** A rare combined-only effect is not excluded on this sample, and none is shown | **Test file:** S (`tests/integrity.spec.ts`; S changed only `profilePills`, not I03). **Surface:** the save-warning (`src/app/SaveWarning*`, nobody's) in F's Shell | **Final regression on the merged tree:** run I03 at 390×844 `--repeat-each=10` with trace on. If it fails, open the trace, before calling it flaky |
| X-2 | `w3-settings.spec.ts` "a pressed segment reads as pressed: unlike hover and unlike the selected one" (assertion `:249`: `pressed` = `hover` = `oklab(0.959197 0.00389533 0.0175539)`) | once, in C | alone: pass on combined and on G's trial. Repeats: **4/8 failed on combined and 4/8 on G's own trial `3d91793`**, same assertion and value. My one run on G's fix trial :5525 passed (`CHECKER-W3R1-G.md` §8) | **The test, not the product.**<br>• The test reads the option's background 120 ms after `mouse.down()` (`w3-settings.spec.ts:244–246`).<br>• `.inner` has `transition: background-color var(--dur-fast)` = 150 ms (`SegmentedControl.module.css:84`, `tokens.css:83`), and reduced motion does not shorten it (`global.css:143–147` sets only `scroll-behavior`).<br>• On a loaded main thread the transition starts late, so the read still returns the colour it starts from: the hover colour.<br>The product's pressed state is distinct when measured on a settled frame: Lane I's probe (`oklab(0.879 …)` light, `oklab(0.381 …)` dark) and my samples of the maker's state sheets (`CHECKER-W3R1-G.md` §1) | **FOLLOW-UP** (test robustness). Present on G's own trial, so not combined-only. **G's final APPROVE stands:** the product behaviour it tests is proven by two independent measurements | **G** (`tests/w3-settings.spec.ts`; feature `src/ui/SegmentedControl.module.css`) | **Needed before the final regression,** since G is merged and this test is now on the integration branch. See below |
| X-3 | `w3-notices.spec.ts` "the room a gone notice keeps stays while the page is scrolled over it and back… (390×844, 200 %)" | once, in the C run the restart cut | passed in the complete C, alone on combined and on the F trial, and 4/4 repeats; it fails on base by design | One sighting under the cut | **FOLLOW-UP / UNKNOWN** (load) | **F** (`tests/w3-notices.spec.ts`, `src/ui/Toast.tsx`) | **This test changes in F's fix round** (F-D1: the room now goes once idle). It is rerun, twice, in F's fix verdict |
| X-4 | `w3-stats.spec.ts` "Delete this brew? at 390×844 with 200 % text › both choices can be tapped, and Tab reaches them in a loop" | once, in the cut C | passed in the complete C, alone, and 4/4 repeats | **Proven: S-D1.**<br>• Lane R's trace shows the layout viewport 408 px wide at the tap.<br>• My probe reproduces 408 px every time on S's trial when the web fonts are not there yet (a cold first load). The "Warmest run" tile's "23 days" runs past the screen, and never does on base.<br>• The tap on the History row then landed where the row no longer was (`CHECKER-W3R1-S.md` §1, §3) | **Was BLOCKS (S-D1); closed** in S's fix round | **S** (`src/screens/stats/StatsScreen.tsx` tile + `stats.module.css`) | Done. The test's cases now also run with the fonts blocked, and pass (§3 of this note) |

### X-2: what is needed before the round closes
- **The test-only change.** Before the final regression, one change to `tests/w3-settings.spec.ts:244–246`, nothing else: while the button is held, wait on the real state instead of a fixed 120 ms. For example, `await expect.poll(() => inner(opt), { timeout: 1000 }).not.toBe(hover)`, then read `pressed`.
- **What stays.** Both assertions (`pressed ≠ hover`, `pressed ≠ selected`) stay as they are. A pressed state that never appears still fails, so nothing is loosened.
- **Owner.** G's file, but G's fix round is spent and this is a test-only follow-up, not a product fix. The orchestrator assigns it (to G, or makes it itself) as its own small commit. I check it on the merged tree with `--repeat-each=8 --workers=1` under the usual load: **8/8**.
- **Until it lands,** the final regression records this test as **known flaky (X-2)**, not as a pass, and a failure of it alone does not block the merge.

## 3. Captures (preview :5530 against base :5488; 4 configs × 21 states)

Lane R's pairs over 0.5 % fall into four groups:
- live clocks;
- 3D idle motion and unlock-card timing;
- capture-sequence artifacts (a leaving screen in the frame; the base `19` frame at 390 light is the Nook, and the base `16` at 1440 is Today);
- the makers' intended changes.

**Today and the summary are pixel-identical (strict 0.0) at all four configs**, except a 64×94 px box in 1440 `09-break` (0.255 %, not opened).

| # | What changed | Owner by file | Class | Note |
|---|---|---|---|---|
| X-5 | Stats: the Today / Last 7 days card at the top (+191 / +209 / +178 css px at 390 / 375 / 1440); tiles "Days warm" / "Warmest run · N days"; empty-state wording | **S** (`Glance.tsx`, `StatsScreen.tsx`, `stats.module.css`) | **ACCEPTED** (intended, I12) | Captured at S@344069c. S's fix adds one tile a row at 200 % only; 100 % is unchanged (`CHECKER-W3R1-S.md` §8) |
| X-6 | Settings: the Daily goal footer, Keep awake and Haptics wording; Haptics +17 css px | **G** (`SettingsScreen.tsx`) | **ACCEPTED** (intended, I11) | Captured at G@808421d. The merged G (`7f95c18`) has shorter Sounds and Nudges On lines and the new Haptics line (`CHECKER-W3R1-G.md` §8) |
| X-7 | Settings, dark, 390: the first screen's content looked about 2 css px lower | G area | **UNKNOWN** (not measured; judged from a downscaled view) | Lane I measured the top 1000 px identical at 390×844 dark @200 on G's trial. **Final regression:** measure the first screen at 390×844 dark @100, base against the merged tree |
| X-8 | 375×667 light `04 focus-paused`: the "Paused" pill's text rows 4 css px lower on the trial (703–721 → 711–730); the controls and the line below are at the same rows; equal at 390 | F area (`FocusScreen.*`). F's CSS change applies only side by side (landscape), so the cause is not established; it may be a transition caught at a different moment | **UNKNOWN** (not isolated, one capture) | **Carried to F's fix verdict:** measure the "Paused" pill at 375×667 light, base against the fix trial, three captures each |
| X-9 | 390 / 375 light `03 focus-mid`: the session chrome caught mid-fade on the trial | F area | **ACCEPTED** (artifact): Lane R's three solo repeats at 390 gave 0.000 / 0.189 (digits) / 0.000 | The 375 pair was not repeated alone. Folded into X-8's captures |
| X-10 | The dark Nook at night: differences around Chai and the room's edges | **N** (`scene/**`) | **ACCEPTED**: N's change. It is not separable from scene motion here; N's still-frame receipts and my N verdict cover it | — |

## 4. Summary for the orchestrator

- **No combined-only cross-effect is proven.** Nothing that fails only when the makers' work is combined was found. X-1 (I03) is the one case where that is not excluded.
- **Before the final regression:**
  - **X-2:** a test-only change to G's `w3-settings.spec.ts:244–246` (wait on the real pressed state while held), checked 8/8 under load. G's APPROVE stands.
- **In the final regression on the merged tree:**
  - **X-1:** I03 ×10 with trace;
  - **X-7:** the Settings first screen at 390 dark @100;
  - one full chromium pass;
  - `whistle.spec.ts` 8/8 once F's C-1 lands.
- **In F's fix verdict:**
  - **X-3:** `w3-notices` ×2;
  - **X-8:** the "Paused" pill at 375×667.

## 5. X-2 verdict: **APPROVE** `pe/w3r1-x2-segment-test@7bb8540` (test change `9fb1aca`)

| | |
|---|---|
| Trial | `7145f49` = integration `8251a74` (N + G + S) + `7bb8540`; worktree `/home/user/wt/w5tr-x2`; dev :5527 |
| Note | `/home/user/wt/w5g-x2/kettle/review/product-excellence/contracts/W3R1/G-X2-READY.md`; logs in `…/W3R1/G/x2/` |
| My run | `contracts/W3R1/review/LEAD/X2/x2-repeat8-5527.log` |

**Scope.** `git diff --stat 4223062 7bb8540 -- kettle/src kettle/tests` lists `tests/w3-settings.spec.ts` only (+6 / −2), in the one test "a pressed segment reads as pressed…". No source change.

**Not weakened** (diff read in full):
- **The two fixed waits become polls on real state.**
  - Before reading hover, it now waits until `.inner` has no running animation (`getAnimations().length === 0`, 5 s) instead of 250 ms.
  - While the button is still held, it now waits until `.inner` has settled **and** its colour differs from hover (5 s) instead of 120 ms.
- **Every assertion stays.** `expect(pressed).not.toBe(hover)`, `expect(pressed).not.toBe(selectedThumb)` and the release-away check (`System` still checked) are unchanged.
- **A missing state still fails.** A pressed state that never appears makes the poll fail (the maker's base control fails exactly so), and so does a state that never settles.
- **The wait matches the mechanism.** It removes the mechanism found in §2 (a read 120 ms into a 150 ms transition on a loaded main thread) without changing what is tested.

**My run.** `KETTLE_PORT=5527 npx playwright test tests/w3-settings.spec.ts -g 'a pressed segment reads as pressed' --repeat-each=8 --workers=1`, through the slot gate, with F's two jobs holding the other slots (load average 5.5 / 7.3 / 8.3): **8/8 passed** (54.5 s). Before the change: 4/8 on combined and 4/8 on G's trial (Lane R).

The maker's results: 8/8 at `--workers=2`, 8/8 at `--workers=1`, the whole `w3-settings` 10/10, and base failing by design.

**X-2 is closed.** The final regression counts this test normally.


*Run logs:* `kettle/.gitignore:6` ignores `*.log`, so every `.log` cited here is committed as a `.log.txt` copy beside it (same name plus `.txt`).
