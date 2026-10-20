# CHECKER W3R3 FINAL: classification of lane RF3's three failures (LEAD-7)

- **Tree:** merged tree `7e4056d` (src `731e565`) on :5560 / :5570.
- **Control:** pre-round `f034205` (src `5f504d4`) on :5583.
- **Receipt:** `review/FINAL/RECEIPT-FINAL-W3R3.md` (`1e4d0ff`), read in full.
- **Logs:** `review/LEAD7/final/`. Every browser run went through the slot gate, `--lane LEAD7`.
- **Rule (Vibei):** a failure that cannot be shown flaky or pre-existing is a real finding.
- **W3R3's change:** only the three Chai WebPs, plus a script and docs. No test and no app code changed.

## Summary

| # | Failure | Class | Introduced or worsened by W3R3? |
|---|---|---|---|
| F1 | `integrity:543` I02, "Saved 12 minutes of focus" not in `main` | **Pre-existing**, deterministic and hour-dependent (a test-environment defect) | **No**: the control fails identically and passes with the same TZ fix |
| F2 | `integrity:1048` I03, phone 390, `lastVisit` unsaved | **Flaky**, the known W3R2 signature | No |
| F3 | `w3-notices-load` 844×390 dark 200 % #0, "textbox still on top as the tap is aimed" | **Flaky** (load race in the spec's own `press()`, a pre-existing harness gap) | **No**: the Chai images do not change Today's layout or its timing (identical to the control frame by frame) |

**No real finding against W3R3.** There are two FOLLOW-UPs for the test harness (below).

## F1, `integrity.spec.ts:543`: pre-existing and hour-dependent

- **RF3's runs:** fails on :5560 (twice) and on :5583. Passes on :5560 with `TZ=America/Los_Angeles` and with `TZ=Asia/Tokyo`.
- **My matched control on :5583** (05:04 UTC), with the same tests from `w6-int`, unchanged in W3R3:
  - default TZ (local hour 05) **fails**, with the same `toBeVisible` "element(s) not found" at :558;
  - `TZ=Asia/Tokyo` (local hour 14) **passes**, in 16.5 s.
  - Logs: `lead7-F1-control-5583-UTC.txt`, `lead7-F1-control-5583-tzTokyo.txt`.
- **Mechanism, matched on both trees:** the hour decides the result on either tree, and the tree does not.
  - The "Start a brew before 10 am" recipe (`src/progress/quests.ts:59`, `closesAtHour: 10`) completes when the brew starts before 10:00 local.
  - Its extra notices queue ahead of "Saved 12 minutes of focus". RF3's error context shows the Saved notice only in the live region, not in `main`'s strip.
- **Why earlier rounds missed it:** the W3R2 runs were at 21:25 to 00:30 local, outside the window.
- **FOLLOW-UP (test):** pin the clock in `integrity:543`, as the W3 specs do with `page.clock.install`, or assert the Saved notice wherever the queue shows it.
- **Product question for Vibei (FOLLOW-UP, pre-existing):** "Saved 12 minutes of focus" is pushed out of Today's visible strip by recipe notices before 10 am.

## F2, `integrity.spec.ts:1048` I03 (phone 390): flaky, known

- The signature is the known W3R2 one: "every failed save has gone through", `+ [ "kettle:home:lastVisit" ]`, from Today's lazy chunk.
- RF3's rerun on :5560 passed.
- It does not touch Chai.
- No change from W3R2.

## F3, `w3-notices-load` 844×390 dark 200 % #0: flaky, not caused by the Chai swap

**The failure.** It came 1.5 s in, at load about 13, on the first `press()` of Today's "What are you brewing" field: the field was not on top when it was re-read during the aim.
- RF3's reruns passed 1 + 3 quiet.
- **My throttled matched pair** (`W3_LOAD=1 CPU=4 FIRST_ONLY=1 REP=4 ONLY=844x390-dark-200`, run side by side): merged :5560 **4/4 pass**, control :5583 **4/4 pass** (`lead7-F3-cpu4-{merged-5560,control-5583}.txt`).
- **Total on the merged tree:** 1 failure in 9 runs, never repeated. It is flaky.

**Ruling out the new Chai images (the coordinator's question).** On Today in this exact setup the Chai **is** a swapped image. The `newbie` seed is "Good afternoon" with progress, so the pose is `sip` → `chai-sipping.webp`, and all nine pose images are fetched at load. A code-path argument alone would therefore not be enough. I probed the spec's own context:
- the same viewport, DPR, touch, theme, 200 % text and init script;
- the clock at Monday 07:40Z;
- 3 runs on each tree (`lead7-F3-today-probe2.txt`, script `tools/f3probe2.mjs`).

Results:
- **Image:** the Chai `<img>` is `complete` on the first frame it exists, on both trees. Its box is **46×75 → 46×74 CSS px, identical on both trees**, because it is fixed by `PAINTED × size/500` and does not depend on the file's pixel size.
- **Layout-shift log:** identical on both trees in values, sources and order, with the same timing to within about ±40 ms of run-to-run noise:
  - ~0.47 s: 0.0004 (heading text);
  - ~0.9 s: 0.0427 (`main`, h 64 → 390);
  - ~0.91 s: 0.0116 (the dock: `chaiRow` 289 → 238, h 101 → 152).
  - No shift on either tree names the Chai `<img>`.
- **The field:** on both trees, right after first render its centre is covered by the docked composer's `ctaNote`. That is the Today dock settling.

**Cause.** This spec's `press()` is a copy that lacks the "docked chrome" guard which `notice-strip.spec.ts` `press()` gained in W3R2 (`1befde2`, "press() clears a target under the page's docked chrome by the wheel"). The `dock` lines exist only in `notice-strip.spec.ts:192-261`. Under heavy load the dock's late settle can land between the aim and the re-read, which fits a single failure at 1.5 s.
- **Pre-existing:** this gap is in the test harness and predates W3R3. W3R3 changed no test and no layout.
- **Ruled out:** the Chai images change neither the layout nor its timing.
- **FOLLOW-UP (test):** port the docked-chrome handling from `notice-strip.spec.ts` `press()` into `w3-notices-load.spec.ts` `press()`.

## Residual table

| Item | Class |
|---|---|
| F1 hour-dependent `integrity:543` (pre-existing) | FOLLOW-UP (test clock), plus a product question on notice ordering before 10 am |
| F2 `integrity:1048` I03 lazy-chunk flake (known) | ACCEPTED (known flake) |
| F3 `w3-notices-load` `press()` without the dock guard (pre-existing harness gap) | FOLLOW-UP (test) |
| W3R3 regression | **None found** |

## Verdict

**No W3R3 regression.** F1 is pre-existing and hour-dependent; F2 and F3 are flaky; none is introduced or worsened by the Chai swap. The merge `041dd25` stands.
