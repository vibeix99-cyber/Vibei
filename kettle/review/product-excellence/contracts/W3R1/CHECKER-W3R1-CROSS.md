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

## 6. After F's fix round (`CHECKER-W3R1-F.md` §8, final APPROVE `11a7ac6` on fix trial `1358e00`, integration with N + G + S + X-2)

| # | Item | Status |
|---|---|---|
| X-3 | `w3-notices` room test | **Closed:** `w3-notices` + `w3-notices-idle` ×2, 42/42 on :5528 |
| X-8 | The 375×667 "Paused" pill 4 px lower | **Closed, not reproduced:** text rows 702–721 device px on base and fix in 3 + 3 runs; 0 differing pixels in the pill box. A capture-timing artifact |
| X-11 (new) | `notice-strip:292` at 1440 light 200 % reduced: 1 failure in 6 (mine) and 1 in 9 (the maker's) on the fix. The causes are the spec's own `press()` wheel race (a wheel queued in the browser lands before the click; the strip unchanged) and N-2 (S's `History.tsx` focus scroll) | **FOLLOW-UP, needed before the final regression:** a test-only change in `tests/notice-strip.spec.ts` (F's file; F's round is spent; the orchestrator assigns it). `press()` waits for the wheel's scroll to actually land; the History read waits for the focus scroll to settle; nothing loosened. I check it with `:292` at that config `--repeat-each=6`: **6/6**. Until then it is recorded as known flaky, and any failure's error context is checked against the two signatures |
| F-R14 | React "change in the order of Hooks called by NoticeStrip" in every dev log, base included (`Toast.tsx` `useContext(Leaving) \|\| !useIsPresent() \|\| off`) | **FOLLOW-UP** (pre-existing; F's file) |

**On the tree with N + G + S + X-2 + F's fix** (fix trial `1358e00`), my runs passed:
- `notice-strip` 25/25;
- `toast-room` / `a11y` / `summary-notice` / `break-reach` / `w2-home` 74/74;
- `w3-notices` (+ idle) 42/42;
- `whistle` 8/8.

No combined-only effect appeared. The final regression still owes: X-1 (I03 ×10), X-7 (Settings dark 390) and X-11, plus one clean full chromium pass.

## 7. X-11 outcome: not achieved; nothing to merge

**What F tried** (`/home/user/wt/w5f-x11/kettle/review/product-excellence/contracts/W3R1/F-X11-READY.md`; logs `…/F/x11/*.log.txt`, read). `pe/w3r1-x11-strip-test@f0c84a5` equals `2be3de1` in `tests/`.
- **Attempt 1** (`a4be67b`: `press()` waits for this wheel's scroll; the History row is read once the Edit sheet is open and the row is still): **3/6**.
  - All three failures are at Mark done, with the same state: `why: "idle"`, room 0, version 14.
  - The tap was aimed at top 672.7 with Mark done then at 612.7, at `scrollY` 60.
  - The History step did not fail.
- **Attempts 2 and 3** (a pointer move and re-read before the tap; a 700 ms wheel cap) hit the 4-minute test timeout, undiagnosed.

**A third signature.** The kept band (F-D1: given back once there has been no input for 1.2 s) went during the ≥ 1.2 s the spec spent without input between its on-top check and its tap. The extra waits made that gap likelier. It is the band's collapse, not a leave, and not the wheel race or N-2.

### 1. Does it change a verdict? **No.** It is within Vibei's §3, and I list it as a finding for Vibei.
- **Within §3's words.** §3 accepts a band that "collapses once touch/scroll goes idle, with no jump under an active pointer". An active pointer is one that is down. F's rule never collapses with a pointer down, within 1.2 s of any input (scroll included), or mid-fling (§8, ◆2). A spec that holds still for ≥ 1.2 s and then taps is exactly "idle".
- **Not worse than base.**
  - **On base,** the strip closed at the same kind of moment (≥ 1.2 s without input, when the notice's time was up) and moved content by the notice's height under a tap aimed just then.
  - **On F,** the leave itself moves nothing (0 of 64 aimed taps off target), and one move of the same height comes later, at the band's idle collapse.

  One move, the same size, the same idle condition; it now no longer coincides with the notice vanishing. F's APPROVE stands, and so do all other verdicts.
- **For Vibei (finding, FOLLOW-UP design).**
  - **On a mouse,** a hand moving to the target sends pointer moves, which count as input, so the band waits.
  - **On touch,** a finger in the air sends nothing. A person who stops scrolling, reads for ≥ 1.2 s and then taps a control below the band can see it move just before the finger lands. That is 57–153.5 px, the band's height, once per notice.

  Vibei's options:
  - (a) accept, as §3 reads now;
  - (b) a longer idle for the band, up to the 4 s §6 allowed (one constant in `Toast.tsx`), which makes the window rarer, not gone;
  - (c) the variant LEAD-3 offered in W2R3 §4: give the room back only at a safe moment (a new screen, out of view, or as the answer to the person's next tap).

  (c) removes the residual, and it is the variant §3 chose against.

### 2. How the final regression treats `:292` at 1440 light 200 % reduced
**Known flaky (X-11)**, as you told Lane R. Each failure's error context is checked against the three signatures. Any one of these is X-11:
- **(a) The wheel race:** the strip unchanged since the screen arrived (`why: "screen"`, the notice still shown or queued); Mark done moved by exactly one wheel step (60 px); `scrollY` one step more than needed.
- **(b) N-2:** the History step's "the Undo is the deleted row … where the person saw the row", about 110 px, with Mark done already passed.
- **(c) The idle band:** `why: "idle"`, room 0, the collapse ≥ 1.2 s after the last input, Mark done moved by no more than the band's height (60–73 px at 1440 @200).

**Anything else is a real failure.** That includes a move with `why: "rest"` at the leave, a move with a pointer down, a strip over a control, or a failure at another configuration or in another test.

### 3. Follow-up: owners and actions (not blocking the merge)
- **F, `tests/notice-strip.spec.ts`, next polish round.**
  - Make `press()` check and tap inside one input window: a pointer move onto the target, then the on-top re-check, then the tap, with no wait between the last input and the tap that could reach 1.2 s.
  - Keep a per-wheel confirmation that the wheel landed, bounded so the History row's long wheel walk cannot hit the 4-minute timeout. Diagnose attempts 2–3 with a trace first.
  - Read the History row once its focus scroll has settled.
  - Done when `:292` at 1440 light 200 % reduced passes `--repeat-each=6` 6/6, and the whole file 25/25.
- **S, `src/screens/stats/History.tsx`:** the focus scroll when the tapped row takes focus (N-2, the product side), the same round.
- **Vibei:** the touch residual of the idle band (§7.1). If (b) or (c) is chosen, the change is F's, in `src/ui/Toast.tsx`.

## Follow-up: test stability (Vibei item 3)

| | |
|---|---|
| Under review | Maker Q, Phase B: `pe/w3r1-stability@01575cb`, **tests only**. `git diff --stat 04b1ad9 01575cb -- kettle/src kettle/tests` lists four test files: `notice-strip`, `integrity`, `w3-notices-load`, `w2-room` (+298 / −109). There is no `src` change (src `db6de7e`, as Phase A, merged `8b1ed4d`) |
| Trial | `d7f9126` = integration (with Phase A) + `01575cb`; worktree `/home/user/wt/w5tr-qb`; dev :5547 (all my runs) |
| Packet | `/home/user/wt/w5q/kettle/review/product-excellence/contracts/W3R1/Q-READY.md` (Phase B); evidence `…/W3R1/Q/B/`; F1 note `contracts/W3R1/review/F1-ROOT-CAUSE.md` |
| My evidence | `contracts/W3R1/review/LEAD/QB/` (`chain.sh`, logs as `.log.txt`) |

### Is anything weakened? (diffs read in full)
**`notice-strip.spec.ts` (X-11).** No assertion is removed: the two `expect(at …).not.toBeNull()` lines move inside the new `if`. Added:
- a check that the target is still on top as the tap is aimed;
- `toHaveValue('Chapter 3 notes')` (N-1).

The strict 9-of-9 on-top check, the 2 px Undo-in-place checks and the frame recorder are unchanged. `press()` now:
- sends one wheel at a time and waits until the target has actually moved (≤ 1 s), then until it is still (≤ 1.5 s). This closes signature (a);
- ends the walk after three wheels in a row that move nothing (the 60-wheel cap stays);
- bounds every target read at 15 s, so a vanished inline Undo fails at once instead of at the 4-minute timeout. That was the mechanism of X-11's attempts 2–3, reproduced in Q's own first version;
- moves the pointer onto the target, re-checks on top and taps at once, which closes signature (c).

The History row is read once the Edit sheet is open and the row has been still for five frames (≤ 3 s), after the page's focus scroll. That is the approach agreed for N-2 (W2R3 §7).

**Not weakened, with one coverage note.** Because the pointer move just before the tap is input, no at-rest strip change can now happen between the aim and the tap. So this spec no longer *incidentally* reproduces F-T2-1's original race (where the base failed it). That property is still guarded by `w3-notices`' dedicated test "End's notice goes at rest and nothing moves: a tap aimed at Mark done before it went lands on Mark done":
- it is unchanged by Phase B, runs in 5 configurations, fails 4/5 on base, and passed 42/42 on the Phase A tree (`CHECKER-W3R1-F.md`, band-idle follow-up);
- the 64-tap aimed-tap probe guards it too (0 off target).

The N-2 product side (S's `History.tsx` focus scroll) stays a FOLLOW-UP.

**`integrity.spec.ts` I03 (X-1): stricter, not looser.**
- **Old:** the banner gone ≤ 6 s of wall time after the room step.
- **New:**
  - (1) every `kettle:` key whose save had failed has saved since, polled ≤ 10 s;
  - (2) the banner gone, waited ≤ 15 s (a bound only);
  - (3) **asserted in page time: gone ≤ 3000 ms after those saves.**

The room step itself performs the saves synchronously (`timer.setState`, `progress.setState`, `settings.set`; Q measured 0 ms), so (3) amounts to gone ≤ about 3 s after the room step, against the old 6 s. A key whose save never goes through now fails by name. The banner coming back is caught too (`gone.shown` must be false).

**`w2-room.spec.ts`:** the test's budget goes 60 → 120 s, for this test only. Its own bound (scene ready within 45 s) and every assertion are unchanged, so a slower scene still fails at 45 s. The budget is not an assertion about the product. **Not weakened.**

**`w3-notices-load.spec.ts`:**
- its `onTop()` / `press()` are synced with `notice-strip`, and the N-1 retry is added;
- the per-frame diagnostic logger becomes opt-in (`W3_LOG=1`); no assertion reads it, only failure messages do (now null-safe);
- this is the opt-in load control (`W3_LOAD=1`), not part of the default run.

**Not weakened.** Not explained (Q's own note): how the logger's per-frame work held a notice's clock back. It failed identically on base, so this is FOLLOW-UP only.

### F1 (`integrity:309`, I01): my assessment
**The evidence supports "product, pre-existing".** I read the note and checked its pointers:
- `Composer.tsx:84–86`: the 150 ms `setIntention` sync on mount and on every keystroke;
- `store.ts:399`: `setIntention`;
- `store.ts:425–440`: `partialize` writes the whole timer;
- `sync.ts:25–35`: `diffTimer` gives `'reset'` for running → idle without `lastEnded`.

`src/timer/**` and `Composer.tsx` are unchanged since `4d36939`. Every failure's write stack names `Composer → setIntention`, and the base reproduces it (1/20 under load). The mechanism (a tab that has not yet received the other tab's write persists its stale idle copy over a just-started brew) explains both of Lane R's signatures.

**Severity: medium.**
- **Impact is high when it hits:** a brew started in one tab is silently undone in both, with no record, and the starting tab is sent back to Today.
- **Exposure is narrow:** two tabs of one profile, with the brew started within ~0.1–0.6 s of the other tab's Today mounting or a keystroke in its composer. Under load it is about 1 in 6 of I01's runs; unloaded the window is a few ms.

**Vibei's §0 applies:** it is not flaky but a real race, so a real finding to fix before the Final Product Boss. The owners are the timer area (`store.ts` / `sync.ts`: e.g. refuse to persist an idle copy over a stored running session it never saw) and Today (`Composer.tsx`: do not write the intention while idle when storage holds another session). Leaving I01 unchanged is right; making it wait would hide the race.

### My runs on :5547, through the gate
**Load:** `--workers=2` plus 2 CPU burners of mine (own PIDs, bounded at 900 s) for the first three runs; the X-1 run on the third slot alongside them. Load average 10.4–10.5 at the ends of the loaded runs (`QB/chain.out`).

| Run | Result | Log |
|---|---|---|
| `notice-strip` 1440×900 light 200 % reduced motion (listed `:338`, the old `:292`), `--repeat-each=6`, `--workers=2` + burners | **6/6** (3.5 min) | `QB/ns-1440-light-200-rm-x6-load.log` |
| I03 storage-full banner at 390×844 (X-1), `--repeat-each=10`, alongside the loaded chain (load 10.4 at its start) | **10/10** (4.8 min) | `QB/x1-i03-x10-load.log` |
| `w2-room` "3D failure (WebGL context lost)", `--repeat-each=3`, `--workers=2` + burners | **3/3**, at **54.1 s, 57.2 s** and 39.1 s. Two of three would have been within 6 s of the old 60 s budget, which supports Q's reading | `QB/w2room-webgl-x3-load.log` |

My first X-1 invocation matched no test: Playwright's `-g` matches the title path joined by spaces, not by `›`. It was rerun with the right filter; the log above is the rerun.
| `notice-strip.spec.ts`, all 25, `--workers=2` (after the burners stopped) | **25/25** (11.8 min) | `QB/notice-strip-all.log` |
| `w3-notices-load.spec.ts`, all 25, `W3_LOAD=1`, `--workers=2` | **25/25** (12.1 min; none skipped). Lane R had 23/25 on `2be3de1` | `QB/w3-notices-load-all.log` |

The maker's runs (`Q/B/proof/`, `Q/B/final/`) agree:
- `:292` 6/6 under 2 workers + 4 burners;
- `notice-strip` 25/25;
- X-1 10/10, with the banner going 365–1890 ms after the saves;
- `w2-room` 3/3;
- `integrity` 25/25;
- `w3-notices-load` 25/25.

### Verdict: **APPROVE** `pe/w3r1-stability@01575cb`, Phase B (tests only)
- **Nothing is weakened** (ruled above).
  - The I03 change is **stricter**: the banner must go ≤ 3 s after the saves in page time, where it used to be ≤ 6 s of wall time.
  - The `w2-room` budget leaves its 45 s scene bound and every assertion as they were.
  - The logger is diagnostic and opt-in.
  - `press()`'s pointer move before the tap removes `notice-strip`'s incidental replay of F-T2-1's race; F-T2-1 stays guarded by `w3-notices`' dedicated test and the aimed-tap probe.
- **Every case Vibei listed passes under load on :5547:**
  - X-11 / `:292`: 6/6;
  - X-1: 10/10;
  - `w2-room:167`: 3/3;
  - the 4-minute timeouts: explained (a 5 s inline Undo gone under load plus an unbounded `locator.evaluate`) and bounded at 15 s;
  - `notice-strip` 25/25 and `w3-notices-load` 25/25 unloaded.
- **X-11 and X-1 close.** For the Final Product Boss, `:292` and I03 count normally; they are no longer "known flaky".

**Open, for Vibei (not test stability):**
- **F1** (`integrity:309`, I01): a real, pre-existing product race. It is not flaky, so per Vibei's §0 it is to be fixed before the Final Product Boss (assessment above). Until fixed, I01 is expected to fail about 1 in 6–20 under load.
- **The N-2 product side:** S's `History.tsx` focus scroll.
- **What the per-frame logger did to a notice's clock:** not explained. It is test-only.

*Run logs:* each `.log` / `.out` in `QB/` is committed as a `.txt` copy beside it.
