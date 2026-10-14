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

## 4. The invariant and the T2 controls on the trial

(Written before §2 and §3, which wait on a probe job; the numbering follows the brief.)

### 4a. The prior D run

`runs/D-trial-specs.log`, trial :5521, 13:42–14:15 UTC, `--workers=2` (2 slots), 99 tests:

| Spec | Result on trial `e3b9eac` (src `0acce1a`) |
|---|---|
| `toast-room.spec.ts` (R5-D1 / LEAD-D1 / R7-D1 class: banner, docked start, session top bar, Break's over) | **14/14** |
| `a11y.spec.ts` (D4 included: "a toast never covers the session controls or the summary footer", "toasts never cover the break-over controls") | **11/11** |
| `summary-notice.spec.ts` (T2-D1: queued notices never move the summary) | **14/14** |
| `break-reach.spec.ts` (all, including `:251` "100 % text, 375×667 and 390×844: the break and Break's over fit without scrolling", the test the maker could not re-run on `0acce1a`) | **17/17** |
| `w2-home.spec.ts` (W2H-D1) | **17/18**: `:203` failed at 375×667 @100 |
| `notice-strip.spec.ts` | 24/25 (the 1440 dark @200 failure is classified in §1c) |

### 4b. `w2-home:203`, alone

| Build | Result | Log |
|---|---|---|
| TRIAL :5521 | **1/1 passed** (4.1 s) | `runs2/E3-trial-w2home203-375x667-100.log` |
| BASE :5478 (base spec) | **1/1 passed** (3.4 s) | `runs2/E4-base-w2home203-375x667-100.log` |

**The D-run failure:**
- "fits without scrolling": `scrollHeight − innerHeight` = **13** (expected ≤ 0) on Welcome (`seed=fresh&onboarded=0#/welcome`) at 375×667 @100.
- Its snapshot (`.tmp/LI2/LI2-pw-D/w2-home-first-visit-…-375×667-100-text--chromium/error-context.md`) shows Welcome with no notice drawn (two empty `status` regions, no strip content).
- F changed no file under `src/screens/welcome/` (`git diff 4d36939 e3b9eac --stat -- kettle/src`). On Welcome the strip has no room (a new screen starts with `room: 0`).
- The trace's frames are blank (1.5 kB JPEGs), so its cause is not established.
- It did not reproduce alone on either build. It came while the D run held two workers and two other lanes' browsers were running.

### 4c. `w3-notices` "the room a gone notice keeps stays while the page is scrolled over it and back" (390×844, 200 %)

Lane R's `w3-notices.spec.ts:252`. In these worktrees Playwright lists it as `:152` in the combined checkout and `:252` in the trial's. Same file: `diff` of the two specs is empty.

| Server | Result | Log |
|---|---|---|
| Combined `e478604` :5520 (spec from `/home/user/wt/w5tr-all`) | **1/1 passed** (17.0 s), alone | `runs2/E5-comb5520-w3notices-room-scrolled.log` |
| F trial `e3b9eac` :5521 | **1/1 passed** (14.8 s), alone | `runs2/E6-trial5521-w3notices-room-scrolled.log` |

Lane R's failure (`review/LR/ALL/runs/full-C-cut.log`, test 31) came inside a cut full run. It did not reproduce alone on either server.

## 5. Warm-days wording and I13 (supportive return)

(Written before §2 and §3; numbering follows the brief.)

### 5a. "streak" in the trial's `src`

`grep -rnoE` over string literals and JSX text in `kettle/src`, test files excluded, on the trial `/home/user/wt/w5tr-f`.

**In F's files, only comments, ids and identifiers remain:**
- `summary.ts:13`, `warm.ts:9`, `chai.ts:4`: comments;
- `StatusBar.tsx:29`: `data-kind="streak"` and `setOpen('streak')`;
- `Rail.tsx`: `id="rail-streak"`, `useStreak`, class names;
- `badges.ts`: id `warm-streak`.

No visible, sr, `title` or `aria-*` "streak" remains in F's files.

**Other owners' files still say it on the trial** (F-only tree; their owners change them per PLAN.md):
- S: `StreakCard.tsx` "Start a new streak", "Finish a brew to start your warm streak.", sr caption "Warm streak calendar…"; `StatsScreen.tsx` "Day streak"; `History.tsx` "…stats and streak";
- G: `SettingsScreen.tsx` "Your warm streak only needs one brew a day…"; `ui/Gallery.tsx` (kit).

**On the combined `e478604`** (`/home/user/wt/w5tr-all`) the same grep finds none outside `ui/Gallery.tsx` and `art/Gallery.tsx` (kit galleries). The only other hits are F's comment and id lines above.

**Rendered pages** (prior capture facts: `shots/{after,before}/facts-*.json`, visible text, sr-only text, `title`/`aria-*`, and the polite announcer):

| Build | Parts captured (Today, status sheet, End sheet, summary, rail) | Parts containing "streak" |
|---|---|---|
| TRIAL flows (390×844 light @100 and 375×667 dark @200 × 7 states × 4 parts) | 56 | **0** |
| TRIAL phones (Today, 4 configs × 4 states) | 16 | **0** |
| TRIAL 1440 (Today + rail, 4 configs × 6 states) | 48 | 24. All are the **Settings page's** "Your warm streak only needs one brew a day" (G's file): the rail was captured on Settings, where it shows. Today parts: 0 |
| BASE flows | 56 | 28 ("streak. Show details", "Best streak", "Tea Cozy. Keeps your streak warm…", Chai "Your 5-day streak is still warm…") |
| BASE 1440 | 48 | 48 |

**Raw observation, accessible names:**
- The Today status-bar button's name is now **"3 days warm . Show details"** (newbie), and "5 days warm , today not brewed yet. Show details" (atRisk), with a space before the "." / ",".
- Base: "3 days warm streak. Show details". Removing "streak" left the separator after a space.
- Visible text is unchanged ("3 / days warm"). Source: the facts files' `status` field.

### 5b. F's strings against the glossary (packet §3, checked in the trial source and the rendered facts)

| Glossary rule | F's string (trial) | Matches |
|---|---|---|
| Current run, pill: "N days warm" | Today pill "23 days warm"; rail heading "23 days warm"; sidebar mini sr "N days warm", `title="Days warm"` | yes |
| In sentences: "N warm days in a row" | Sheet "23 warm days in a row, today included." / "…in a row. One brew today adds another."; Chai "5 warm days in a row. One 25-minute brew warms today too."; Chai night "…makes it N+1 warm days in a row."; badge "Brew {n} warm days in a row" | yes |
| Best run: "Warmest run · N days" or "N days" under "Warmest run" | Rail foot "Warmest run 23"; sheet fact "23 / Warmest run"; returning sheet "Your warmest run so far: 3 days." | yes (the rail foot shows the bare number, as the base's "Best 23" did) |
| Starting | "One brew warms the kettle today." (sheet, fresh/returning; rail caption, returning); rail caption, fresh: "One brew today makes it a warm day."; rail heading "Warm the kettle" / "Welcome back" | yes |
| Tea Cozy: "A Tea Cozy keeps the kettle warm through one missed day." | Sheet note (verbatim); summary note "Keeps the kettle warm through one missed day."; summary pill sr "You earned a Tea Cozy: it keeps the kettle warm through one missed day" | yes |
| Badge title "Warm Days" stays | `badges.ts` title unchanged | yes |
| No "lose", "break", "don't miss", urgency | `git diff 4d36939 e3b9eac -- src` added lines: no such word in any user string. The hits are test assertions forbidding them, plus "missed day" inside the Tea Cozy sentence (glossary wording) | yes |

### 5c. Truth against `progress/streak.ts` and `warm.ts`

**Engine rules** (`streak.ts:6–14`, constants `COZY_EVERY = 7`, `MAX_COZIES = 2`):
- warm day = ≥1 **completed** focus session that local day;
- today is pending until a brew;
- +1 Tea Cozy each time the run reaches a multiple of 7, max 2 held;
- a missed day while the run is alive and a cozy is held consumes it and the run survives (the cozy day adds no count).

**What the copy says, state by state:**
- **Held** (sheet note): "…keeps the kettle warm through one missed day. It's used for you… You have one / N." True: used automatically, the count is held.
- **Just used** (`cozyKept`, missed-cozy = veteran + 2 days):
  - Chai: "Welcome back. A Tea Cozy kept the kettle warm yesterday, so your 23 warm days in a row carry on."
  - rail: "A Tea Cozy kept it warm yesterday."
  - sheet note: "…One did yesterday. You have one more."
  - The week strip shows Tuesday "kept warm by a Tea Cozy"; the count stays 23 (the cozy day adds none). True.
- **None held, run going:** "No Tea Cozy yet. You'll earn one after N more warm days in a row: …". N is the engine's `toNextCozy`.
- **No run** (fresh, returning): "Every 7 warm days in a row earn a Tea Cozy: it keeps the kettle warm through one missed day."
  - The max-2 cap is not stated. This line shows only when 0 are held.
  - It appears to everyone without a cozy, as how one is earned, e.g. missed-nocozy `shots/after/390x844-light-t100/sheet-missed-nocozy.png`.
- **Evening** (Chai, `cozies > 0` only): "…And if today slips by, your Tea Cozy keeps the kettle warm." Not shown without a cozy (atRisk seed: "5 warm days in a row. One 25-minute brew warms today too.", `shots/after/390x844-light-t100/today-atRisk.png`).
- **Night, no cozy:** "It's late. One {brew} makes it N+1 warm days in a row. Or rest. The kettle will be here tomorrow." It does not say what resting does to the run (with no cozy the run ends tonight). Raw, for the lead.
- **End** (`EndSheet.tsx`): "That's okay — your minutes still count. Today turns warm when a brew runs to the whistle."
  - Shown when today is not warm yet: atRisk, missed-cozy, missed-nocozy, cozy-earn, blank.
  - Absent when today is already warm: newbie, veteran (facts `end.dialog`).
  - Matches the engine (warm = completed focus). "3 minutes of focus will be saved" is unchanged.
- **Skip break and "That's all for now":** F changed none of these strings or controls. Unchanged in the summary captures (`shots/after/*/summary-*.png` show "Skip break").

**Rule change:** `git diff 4d36939 e3b9eac --stat -- kettle/src/progress` touches 3 files, 3 lines:
- the `badges.ts` description string;
- the matching `badges.test.ts` / `engine.test.ts` assertions.

No rule, threshold, id, tier or stored-data change.

**Other differences seen while looking:**
- **Rail level card** at 1440: leaves pill 2,216 (base) vs 2,222 (trial) while the header says 2,266 on both. That pill is an animating `Counter` (`Rail.tsx:150`), caught mid-count; not a data change.
- **Base vs trial Chai** on missed-cozy: base "Afternoon slump? A warm brew of focus helps." (`shots/before/390x844-light-t100/today-missed-cozy.png`) → trial, the Tea Cozy line above.

### 5d. Captures looked at, full size (prior `shots/`; states: fresh/Welcome, blank, newbie, veteran, atRisk, missed-cozy, missed-nocozy, cozy-earn)

**AFTER (trial):**
- `shots/after/390x844-light-t100/{today,sheet,end,summary}-{blank,newbie,veteran,atRisk,missed-cozy,missed-nocozy,cozy-earn}.png`, plus `today-fresh.png`;
- `shots/after/375x667-dark-t200/` (same set);
- `shots/after/1440x900-{light,dark}-t{100,200}/{today,rail}-{blank,newbie,veteran,atRisk,missed-cozy,missed-nocozy}.png`;
- `shots/after/{390x844-dark-t200,375x667-light-t200,844x390-dark-t200}/today-{atRisk,missed-cozy,missed-nocozy,fresh}.png`.

**BEFORE (base):** the same names under `shots/before/` for 390×844 light @100, 375×667 dark @200, and 1440 ×4.

**Opened** (17:03–17:06):
- `after/390x844-light-t100/{today-atRisk, today-missed-cozy, sheet-missed-cozy, sheet-missed-nocozy, end-blank, summary-cozy-earn}`;
- `before/390x844-light-t100/today-missed-cozy`;
- `after` + `before` `1440x900-light-t100/rail-missed-cozy`;
- `after/375x667-dark-t200/{today-missed-nocozy, sheet-atRisk}`.

**What the frames show:**
- No text clipped or overlapping in the sheets or End at 390×844 @100.
- **375×667 dark @200 Today, missed-nocozy:** the greeting shows only "Good". The Chai bubble, goal and composer are scrolled out by the docked start/segmented control (the capture's scroll position). Not a wording issue, and not compared with the base frame.
- **`summary-cozy-earn` at 390×844:** the Tea Cozy note lies below the sheet's fold. The text is confirmed in facts ("Tea Cozy earned", sr "You earned a Tea Cozy: it keeps the kettle warm through one missed day").
