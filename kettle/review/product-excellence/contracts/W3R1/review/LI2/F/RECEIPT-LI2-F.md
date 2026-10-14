# RECEIPT · Lane I2 (interaction and visuals) · W3R1 Maker F (notices polish, warm-days wording, I13)

Raw evidence only. No verdict. LEAD-5 decides. Lane I2 implemented none of this work.

- **Under review:** `pe/w3-notices-polish@5ee3e7c` (code `9f30a9b`, src `0acce1a`). **Trial** `e3b9eac` (integration + F) at `/home/user/wt/w5tr-f`.
- **Servers** (each checked with `/tmp/rv7-servers/verify.sh` at 16:57 UTC): trial dev **:5521** serves `e3b9eac` (src `0acce1a`) VERIFIED; base dev **:5478** serves `4d36939` (src `5cd9a44`) VERIFIED; combined dev **:5520** serves `e478604` (src `07c26ff`) VERIFIED.
- **Method:** frozen clock `2026-10-12T07:40:00Z` then `resume()`; seeds via `?debug&seed=…`; DPR 1; 200 % = `html{font-size:200%!important}` at DOMContentLoaded; phones `hasTouch`/`isMobile` with real `touchscreen.tap` and CDP `Input.synthesizeScrollGesture` (touch) scrolls; 1440 real mouse and wheel. Notices in the probes are raised with the app's own `__kettle.toast()` (the app has no on-demand button); everything aimed at is real input.
- **Slots:** every browser run went through `slots.py run --lane LI2 --n 1`, each Playwright run with its own `--output` (`.tmp/LI2/LI2-pw-*`). I killed no process.
- **Reuse:** the previous Lane I2 instance (cut off before its receipt) left valid evidence on the same commits and frozen date in this folder: `runs/`, `probes/`, `shots/`, `combined/`, `topbar/`, `wheel/`. Its scripts are in `/home/user/wt/w5tr-f/kettle/.tmp/LI2/` (`LI2-probe.mjs`, `LI2-wheel.mjs`, `LI2-cap.mjs`, `LI2-comb.mjs`, `LI2-topbar.mjs`, `LI2-sum.py`). I cite it as "prior". New this session: `runs2/`, `idle/`, `topbar2/` and scripts `LI2-idle.mjs`, `LI2-topbar2.mjs`, `LI2-jobE.sh`, `LI2-jobF.sh` in the same scratch folder.
- **Time:** resumed 16:53 UTC.

## 1. F-T2-1: target movement and where taps land around a notice leaving or entering (controls first)

### 1a. Probe (prior, `probes/{base,trial}/probe-*.json`, logs `probes/probe-{base,trial}.log`, frames `probes/{base,trial}/*.png`)

Seed `newbie`/`veteran`, Today. 17 configurations per build: every size × 100/200 % (16), light with full motion and dark with reduced motion, plus 1440 light 200 % reduced. The target is the first control wholly below the strip and on top at 9/9 points.
- **L1:** intent read ~200 ms before the notice's time is up, nobody touching; the tap lands just after the notice goes.
- **L2:** the tap is fired at the time-up itself.
- **E:** a notice arrives at rest and a tap aimed beforehand lands just after.
- "moved" = the target's top at pointerdown minus at intent.

| Config | BASE L1 / L2: moved, click landed | TRIAL L1 / L2: moved, click landed (leave why / room kept) |
|---|---|---|
| 390×844 light 100 | −68 / −68 px; landed on "Study" chip, **not the target** (task field) | 0 / 0 px; on target (rest / 68) |
| 390×844 dark 100 rm | −68 / −68; "Study", not target | 0 / 0; on target (rest / 68) |
| 390×844 light 200 | −113 / −113; landed on the greeting h1, not target | 0 px; on target (L2 skipped: no target in view) |
| 390×844 dark 200 rm | −113 / −113; greeting, not target | 0 / 0; on target (rest / 113) |
| 375×667 light 100 | 0 / 0; on target (target above the strip's reach) | 0 / 0; on target (rest / 68) |
| 375×667 dark 100 rm | 0 / 0; on target | 0 / 0; on target (rest / 68) |
| 375×667 light 200 | 0 / 0; on target | 0 / 0; on target (rest / 113) |
| 375×667 dark 200 rm | 0 / 0; on target | 0 / 0; on target (rest / 113) |
| 844×390 light 100 | −70.5 / −70.5; landed on an img, not target ("3 days warm streak") | 0 / 0; on target (rest / 56.5) |
| 844×390 dark 100 rm | −70.5 / −70.5; img, not target | 0 / 0; on target (rest / 56.5) |
| 844×390 light 200 | −151.5 / −151.5; greeting, not target | 0 / 0; on target (rest / 137.5) |
| 844×390 dark 200 rm | −151.5 / −151.5; greeting, not target | 0 / 0; on target (rest / 137.5) |
| 1440 light 100 | −68 / −68; greeting, not target | 0 / 0; on target (rest / 68) |
| 1440 dark 100 rm | −68 / −68; greeting, not target | 0 / 0; on target (L2: no change seen in window) |
| 1440 light 200 | −113 / −113; greeting, not target | 0 / 0; on target (rest / 113) |
| 1440 dark 200 rm | −113 / −113; greeting, not target | 0 / 0; on target |
| 1440 light 200 rm | −113 / −113; greeting, not target | 0 / 0; on target (rest / 113) |

**Base:** 26 of 34 L1/L2 taps landed off target, moved 68–151.5 px (the 8 on target are all 375×667, where the target sat above the strip's reach). **Trial:** 0 of 33 off target (one L2 skipped, no target in view); target movement 0 px in every one. In 5 trial L2 runs the notice had not yet left when the tap landed (no change in the window).

**E, a notice arriving at rest** (same probe; also §2c). The arrival still pushes on both builds, by the same amounts:
- 68 px (390×844 @100, 1440 @100);
- 113 px (390×844 @200, 375×667 @200);
- 107 px (844×390 @200);
- 72.5 px (1440 @200);
- −16 px at 844×390 @100 (the pinned column);
- 0 at 375×667 @100.

A tap aimed beforehand lands on the arriving notice (`li._toast…`) or the card on both builds wherever the push is non-zero: base 13 of 17 off target, trial 12 of 16 off target (one trial config had no target in view). The 4 on target on both builds are 375×667 @100 and 844×390 @100, where the push is 0 or −16 px.

### 1b. The "above" path and wheel taps (prior `wheel/wheel-{base,trial}.{log,json}`)

4 configurations × 3 runs per build: a tap right after wheeling, in the spec's own wheel pattern. 12/12 on target on both builds. The notice did not leave during any of these windows (`changes: []`, the clock holds while the strip is out of view), so the probe never exercised the "above" leave. §2d below does.

### 1c. `notice-strip.spec.ts:275` runs

| Build | Config | Result | Log |
|---|---|---|---|
| BASE :5478 (base spec) | 1440 light 200 % reduced | 1/1 passed | prior `runs/A-base-1440-200-reduced-x1.log` |
| TRIAL :5521 | 1440 light 200 % reduced | 2 passed, 1 failed (`--repeat-each=3`) | prior `runs/A-trial-1440-200-reduced-x3.log` |
| TRIAL :5521 | 1440 light 200 % reduced | **2/2 passed** (`--repeat-each=2`, 16:56–16:58) | `runs2/E1-trial-ns275-1440-light-200-reduced-x2.log` |
| TRIAL :5521 | 1440 light 200 % reduced, **all 5** | **4 passed, 1 failed**. The two runs right before the failure passed, and the two after it passed | — |
| TRIAL :5521 | 1440 dark 200 % (full motion) | 0/1, inside the 99-test D run | prior `runs/D-trial-specs.log` |
| TRIAL :5521 | 1440 dark 200 % | **2/2 passed** (16:58–17:00) | `runs2/E2-trial-ns275-1440-dark-200-x2.log` |
| TRIAL :5521 | 1440 dark 200 %, **all 3** | **2 passed, 1 failed** | — |
| TRIAL :5521 | the other 23 configurations | 23/23 passed (D run) | prior `runs/D-trial-specs.log` |

**What happened in the two failures.** Both have the same signature: the click aimed at Mark done landed on the tag group, after the page **scrolled by exactly one more 60 px wheel step**. The strip's change did not cause it.
- **Light 200 % reduced, repeat 2** (`runs/A-trial-repeat2-failure/error-context.md`; message in `A-trial-…x3.log`):
  - aimed at top 685.2; at the error Mark done's top is 624.7 (**−60.5 px**), `scrollY 48`;
  - notices `why: "above", room: 0` (the "Saved…" notice left while its strip was above the view and the page was compensated);
  - 48 = 121 − 73: the page was at about 121 (two 60 px wheel steps) when the 73 px strip went, and the compensation scrolled by its height;
  - Mark done's visible move equals one wheel step (60), not the strip's 73.
- **Dark 200 %, D run** (`runs/D-trial-specs.log`, test 71):
  - aimed at 685.2; at the error 625.2 (**−60.0 px**), `scrollY 120`;
  - notices `shown: "t1"` (still shown, 2,400 ms left), `why: "screen"`, version 12, `changed` 6,801 ms. **The strip had not changed since the screen arrived.** Here the move is the scroll alone.
- **Mechanism, from the spec's own `press()`** (`tests/notice-strip.spec.ts:193–243`). It wheels 60 px, waits 120 ms, then checks `onTop`:
  - under load, the first wheel had not been applied when `onTop` was read, so a second wheel was sent;
  - the first then applied and `onTop` passed with Mark done at 685;
  - the click went out, and the second wheel's 60 px landed before it.

  A test-harness wheel race, not a strip change: the base spec has the same `press()`.
- **Not seen on the trial in 8 runs of :275 at 1440 @200:** the base's mechanism, the strip closing at rest under the aimed tap (`why: rest`, Mark done 745 → 673).

### 1d. `notice-strip.spec.ts` vs base (`git diff 4d36939 e3b9eac -- kettle/tests/notice-strip.spec.ts`)

**+9 lines, 0 removed** (lines 290–298):
- after typing "Chapter 3 notes" into the task field: if the field does not hold it, tap the field for real, `ControlOrMeta+A`, type it again;
- then `await expect(field).toHaveValue('Chapter 3 notes')`.

No assertion, timeout, tolerance, configuration or step is removed or loosened. One retry is added for the setup typing: a typing miss is now repaired rather than failing ~1 min later at Mark done. The assertion after it is new.
