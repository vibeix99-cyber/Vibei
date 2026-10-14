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

**Opened** (about 17:00–17:05):
- `after/390x844-light-t100/{today-atRisk, today-missed-cozy, sheet-missed-cozy, sheet-missed-nocozy, end-blank, summary-cozy-earn}`;
- `before/390x844-light-t100/today-missed-cozy`;
- `after` + `before` `1440x900-light-t100/rail-missed-cozy`;
- `after/375x667-dark-t200/{today-missed-nocozy, sheet-atRisk}`.

**What the frames show:**
- No text clipped or overlapping in the sheets or End at 390×844 @100.
- **375×667 dark @200 Today, missed-nocozy:** the greeting shows only "Good". The Chai bubble, goal and composer are scrolled out by the docked start/segmented control (the capture's scroll position). Not a wording issue, and not compared with the base frame.
- **`summary-cozy-earn` at 390×844:** the Tea Cozy note lies below the sheet's fold. The text is confirmed in facts ("Tea Cozy earned", sr "You earned a Tea Cozy: it keeps the kettle warm through one missed day").

## 2. Vibei's §3: after a notice leaves, does the empty band collapse once touch/scroll goes idle?

Probe `LI2-idle.mjs` (new), trial :5521, 17:03–17:08 UTC. Data: `idle/trial/idle-trial.json`; log `idle/idle-trial.log`; frames `idle/trial/<cfg>-<n>-*.png`, full size.

**Setup:**
- Seed `veteran`, Today at rest (nobody touching ≥ 1.5 s).
- A 3 s notice "Saved 3 minutes of focus · LI2 idle probe" is raised with `__kettle.toast()`.
- A per-frame tracker records the target's top, the strip height, `room`, `why`, `scrollY`, every commit (version change) with ms since the last input event, and whether a pointer was down.

**Configurations:** 390×844 light @100 (touch), 390×844 dark @200 reduced (touch), 1440 light @100 (mouse), 1440 dark @200 reduced (mouse).

### 2a. Measurements (trial)

| Step | 390×844 light 100 | 390×844 dark 200 rm | 1440 light 100 | 1440 dark 200 rm |
|---|---|---|---|---|
| Notice arrives at rest: drawn after raise / why / content pushed | 30 ms / rest / **+68 px** | 29 ms / rest / **+153.5 px** (the probe's text is 3 lines at 200 %) | 22 ms / rest / **+68 px** | 31 ms / rest / **+113 px** |
| Notice leaves at rest: why / room kept / content moved | rest / 68 / **0** | rest / 153.5 / **0** | rest / 68 / **0** | rest / 113 / **0** |
| Idle, sampled at 1, 5, 10 … 45 s: room / target top | **68 at every sample** / 500 constant | **153.5 every sample** / 236.6 constant | **68** / 112 constant | **113** / 157 constant |
| Scroll down 300 px and back (phones: CDP touch gesture; 1440: wheel), then 0.3 / 1.3 / 2.5 / 6 s idle | room 68 at all four. **The touch gesture did not scroll the page** (sy 0, target unchanged): this step proves only idle after touch input. Redone with a real finger drag (§2e) | same: 153.5 at all four; gesture did not scroll | room 68 at all four (wheel reached sy 11, then back to 0) | room 113 at all four (wheel reached sy 300 with the band above the view, then back to 0) |
| Pointer held down 3 s on the greeting, released, 3 s idle | room 68 while down and after | 153.5 / 153.5 | 68 / 68 | 113 / 113 |
| Commits from the leave through idle, scroll and pointer | **none** | **none** | **none** | **none** |
| Page hidden (**emulated**: `document.visibilityState` overridden and `visibilitychange` dispatched), then shown | room → 0 (`why: hidden`); on return the content sits **68 px higher** (target 500 → 432) | → 0; **153.5 px higher** | → 0; **68 px higher** | → 0; **113 px higher** |
| A second notice leaves (room again), then Stats and Today by real taps/clicks on the nav | room 72.5 → **0** after the new screen (`why: screen`) | 153.5 → 0 | 68 → 0 | 113 → 0 |
| A third notice leaves, then `page.reload()` | 72.5 → 0 | 153.5 → 0 | 68 → 0 | 113 → 0 |

**Answers to the brief:**
- **When it collapses.** On the trial the band **never collapsed while the screen stayed open and visible**: 45 s idle, after scrolling and 6 s idle, after a held pointer. It went only at:
  - a new screen (Stats and back);
  - a reload;
  - the page hidden.

  This matches the code. `Toast.tsx` `decide()` gives the room back only for `now − ctl.at < ENTRY_MS` (a screen's first moments), `document.visibilityState === 'hidden'`, or the session panel's `reach` case. There is no idle-timer path for tab screens. The comment says: "Not when scrolled above the view: a scroll still on its way would undo the compensation".
- **How far content moves when it does:**
  - **new screen / reload:** the screen is rebuilt, so nothing in the old layout moves;
  - **page hidden and shown again** (the only in-place collapse): the person returns to content **68–153.5 px higher** than they left it (the band's height). No pointer is down: `moment.ts` zeroes `down` on hide.
- **Any collapse while a pointer is down or within the settle time:** none in any run (0 commits during idle, scroll and pointer steps).
  - The hidden-page collapse came 3.1–3.3 s after the last input.
  - The "above" leave (§2d) is the only change made during active input, by design compensated.
- **Frames (full size):**
  - band present: `idle/trial/390x844-light-t100-2-band-at-leave.png`, `…-3-band-after-45s-idle.png`, `…-4-band-after-scroll-and-6s-idle.png`; the same three for `390x844-dark-t200-rm`, `1440x900-light-t100` and `1440x900-dark-t200-rm`;
  - notice drawn: `…-1-notice.png`;
  - before any notice: `…-0-no-notice.png`;
  - after the emulated hide: `…-5-after-hidden-emulated.png`;
  - after Stats and back: `…-6-after-stats-and-back.png`.

  Opened: `390x844-light-t100-1-notice.png` and `-3-band-after-45s-idle.png`. After 45 s idle the 68 px band is an empty cream gap above the status bar. The page's lower content (Create/Life chips) stays hidden behind the docked start, as it was while the notice showed.

### 2b. A notice arriving at rest (how much, when)

- **How much.** Pushes content by its own height on both builds: §1a "E" and the table above. 68 px at phone and 1440 @100; 113 px with the real "Saved 3 minutes of focus" at 390×844, 375×667 and 1440 @200; 107 px at 844×390 @200; 0 / −16 px where the strip lies outside the content column (375×667 @100, 844×390 @100).
- **When.** With nobody touching for ≥ 1.5 s it is drawn **22–31 ms** after it is raised (`why: rest`, in the next fresh frame). With input in the last 1.2 s (`QUIET_MS`) it waits until 1.2 s after the last input.
- **The maker's packet** lists this as F3 (not eliminated).
- **A tap aimed just before the arrival:**
  - lands on the notice itself in 12 of 16 trial configurations (§1a E);
  - base 13 of 17.

### 2c. The kept band and the next notice

By the code (`Toast.tsx`, `room = … Math.max(ctl.room, ctl.item ? heightOf(el) : 0)`), a later notice on the same screen is drawn in the kept room, and the room after it goes is the larger of the two heights. My probe did not measure two bands in a row: its second notice came after the emulated hide had already given the room back (room 0). That notice ("…LI2 idle probe 2", one line longer at 390×844 @100) left a 72.5 px room.

### 2d. The "above" path: a notice whose time is up leaves while the person scrolls on

Busy at time-up: mouse moves every 150 ms. Then 1440: 12 wheel steps of 60 px; phones: a touch gesture.

| Config | Leave | Commit timing | Visible effect |
|---|---|---|---|
| 1440 light 200 reduced (×2) | `why: above`, room 0, during the wheel | **51 / 78 ms** after a wheel event | In that frame the target's visible move was **0** with `scrollY −113` (compensated). Afterwards the wheel carried on to the page end (max scroll 427 → 314). Total visible move −427 px = the move the wheel alone gives on a 427 px page: no extra jump |
| 1440 dark 100 (×2) | page scrolls only 11 px; the notice left **at rest**, room 68 kept | 1,322–1,349 ms after the last wheel | 0 px |
| 390×844 light 200, 375×667 dark 100 rm (×2 each) | touch gesture did not scroll; the notice left at rest, room kept (153.5 / 72.5) | **1,261–1,285 ms after the last `touchend`**, i.e. just past `QUIET_MS` | 0 px |

**Not covered:** full-motion smooth scrolling while the strip leaves above the view. At 1440 @100 the page cannot scroll far enough. This is the case the maker reports as undoing the compensation (60 px).

**§2e** (a real CDP finger drag on phones: band after a touch scroll; the above path on phones) follows when the job finishes.

### 2f. Control: the same probe on BASE :5478

17:11–17:19 UTC; `idle/base/idle-base.json`, `idle/idle-base.log`, frames `idle/base/<cfg>-{0-no-notice,1-notice,2-band-at-leave}.png`. Frames 3–6 were removed to stay under 60 MB; the JSON keeps every number.

| Step | 390×844 light 100 | 390×844 dark 200 rm | 1440 light 100 | 1440 dark 200 rm |
|---|---|---|---|---|
| Arrival at rest: push | +68 | +153.5 | +68 | +113 |
| Leave at rest: content moved | **−68** (the strip closes) | **−153.5** | **−68** | **−113** |
| After 45 s idle / after scroll | no band (strip 0), target back at its pre-notice top | same | same | same |

On the "above" path (§2d) the base behaves like the trial at 1440 light 200 reduced:
- `why: above`, 39 / 61 ms after a wheel event;
- visible move 0 in that frame, scroll −113.

Where the notice leaves at rest after input, the base moves content:
- **1440 dark 100:** at 1,343–1,346 ms after the last wheel, the target moves −57 px visible (−68 layout, −11 scroll clamp);
- **390×844 light 200:** at 1,280–1,311 ms after the last `touchend`, **−153.5 px**.

The trial in the same steps: 0 px, room kept.

## 3. The session-panel exception (`reach`), F-T2-8 and N-1

### 3a. F-T2-8: the landscape top bar at 200 %

Probe `LI2-topbar2.mjs` (new), base :5478 then trial :5521, 17:01–17:02 UTC. Seed `veteran`, a running brew "Chapter 3 notes · Study", no notice, reduced motion. Data `topbar2/topbar2-{base,trial}.json`; frames `topbar2/{base,trial}-<cfg>-session-running.png`. Prior trial-only frames are in `topbar/`.

| Config | BASE: task label / Rain & sound / Add 5 · Pause · End | TRIAL |
|---|---|---|
| 844×390 @100 | one line; Rain, sound at y 24; controls at y 248, wholly in view | **identical** (y 24; y 248, wholly in view) |
| 667×375 @100 | same; controls y 239 in view | **identical** |
| 844×390 @200 light/dark | task squeezed to one letter per line ("C / h / a.."); Rain, sound at y 50 beside it; controls at y 352, **38.5 px of 54 visible**; panel overflows by 41 px | task on two readable lines ("Chapter 3 / notes · Study"); Rain, sound on their own line at **y 105**; controls at **y 369, 20.8 px visible**; panel overflows by **59 px** |
| 667×375 @200 light/dark | same squeeze; controls y 352, **23.5 px visible**; overflow 56 px | readable two-line task; Rain, sound y 105; controls y 369, **5.8 px visible**; overflow **74 px** |

Opened: `topbar2/base-667x375-light-t200-session-running.png` (the "C h a.." stack beside Rain; the tops of the three control circles at the bottom edge) and `topbar2/trial-667x375-light-t200-session-running.png` (task readable; the controls are below the fold, only a sliver of shadow at the bottom edge). Also `topbar/844x390-light-t200-session-running.png` (trial) and the maker's `…/F/shots/before/844x390-light-t200/session-running.png` (base).

**Measured cost:** at 200 % landscape the wrap moves the session controls down **17 px** further (y 352 → 369). Visible control height drops from 38.5 to 20.8 px at 844×390 and from 23.5 to 5.8 px at 667×375. The panel scrolls to them on both builds (panel overflow +18 px). This is F-T2-2's class: controls below the fold at 200 % on short screens.

### 3b. N-1: the spec change

§1d. The new `toHaveValue('Chapter 3 notes')` held in every trial run of `notice-strip:275`: D run 25 configurations, plus 7 runs at 1440 @200. No failure message mentions the field: both failures are at Mark done, §1c.

### 3c. The session panel's `reach` close: can it move a control under a tap?

**Code** (`Toast.tsx` `decide()`): on a strip with `reach` (only the session panel, `FocusScreen.tsx:359`), a notice going in view keeps **no** room when `holdsOutOfReach(el)`: the panel's `scrollHeight > clientHeight`, whatever its scroll position. The panel then closes up at rest:
- `atRest` = no pointer down and no input for 1.2 s;
- `!inputPending()`, confirmed in a fresh frame;
- `holdTop(el)`: the strip's top is kept still, so everything below it moves up by the notice's height.

A room kept there and later holding the controls out of reach is given back the same way.

**First attempt** (`LI2-idle.mjs` "reach", trial 17:09–17:10, base 17:18–17:19; data in `idle/{trial,base}/idle-*.json`; frames removed for size):
- A brew running; a 6 s notice in the panel's strip at 375×667, 844×390 and 390×844 @200.
- The notice (228 px tall at 375×667 @200) puts Add 5 / Pause / End below the fold on both builds. No control was on top in view below the strip.
- The CDP `synthesizeScrollGesture` touch scroll did not move the panel, so no tap was aimed.
- Redone with a real finger drag in §3d.

## 6. REFERENCE → BEFORE → AFTER (full size)

**REFERENCE:** K01 `kettle/.tmp/pkg/kettle-excellence-integrated/VISUAL_BENCHMARK_LIBRARY/assets/current/01-home.png` (also the maker's copy `…/W3R1/F/REFERENCE-K01-01-home.png`). Opened: Today at 390-class width, "23 days warm" pill, greeting, Chai's bubble, goal card, composer, docked start.

**Coverage.** Paths: maker = `/home/user/wt/w5f/kettle/review/product-excellence/contracts/W3R1/F/shots/{before,after}/<cfg>/`; LI2 = `review/LI2/F/shots/{before,after}/<cfg>/`.

| Config | BEFORE (base) | AFTER (trial src `0acce1a`) |
|---|---|---|
| 390×844, 375×667, 844×390 × light/dark × 100/200 % (12) | maker: `today-{blank,newbie,veteran,atRisk,missed-cozy,missed-nocozy}`, `sheet-warm-{atRisk,missed-cozy}`, `end-sheet`, `session-running`, `today-after-end-gone` (11 each) | maker: the same 11 each, on `0acce1a` = the trial's src |
| 390×844 light @100, 375×667 dark @200 | + LI2 `{today,sheet,end,summary}-{blank,newbie,veteran,atRisk,missed-cozy,missed-nocozy,cozy-earn}` (28 each) | + LI2 the same 28 each, on the trial :5521 |
| 390×844 dark @200, 375×667 light @200, 844×390 dark @200 | maker only | + LI2 `today-{atRisk,missed-cozy,missed-nocozy,fresh}` |
| 1440×900 × light/dark × 100/200 % (4) | maker (16 each, incl. `rail-*`) and LI2 `{today,rail}-{blank,newbie,veteran,atRisk,missed-cozy,missed-nocozy}` (12 each) | **LI2 only** (the maker's 1440 AFTER was not captured): `{today,rail}-*` 12 each. The rail is captured on Settings, where it shows at 1440 |
| The kept band (F-T2-1) | maker `today-after-end-gone` | maker `today-after-end-gone`; LI2 `idle/trial/*-{1-notice,2-band-at-leave,3-band-after-45s-idle,4-band-after-scroll-and-6s-idle,5-after-hidden-emulated,6-after-stats-and-back}.png` (§2) |
| Session top bar (F-T2-8) | LI2 `topbar2/base-{844x390,667x375}-*-session-running.png` | LI2 `topbar2/trial-*`, prior `topbar/*` (§3) |

Missing: none of the brief's 16 configurations lacks a BEFORE/AFTER pair for Today's states and the 1440 rail. The 1440 AFTER rests on LI2 captures alone; the phone AFTER rests on the maker's captures plus LI2's own in 5 of the 12 phone configurations.

**Opened at full size this session** (besides those in §2, §3 and §5):
- K01;
- maker BEFORE/AFTER `844x390-light-t200/today-missed-cozy.png`;
- maker BEFORE/AFTER `375x667-light-t200/today-blank.png`;
- LI2 AFTER `1440x900-dark-t200/today-missed-nocozy.png` and `1440x900-light-t200/rail-blank.png`;
- LI2 BEFORE/AFTER `1440x900-light-t100/rail-missed-cozy.png`.

**What the pairs show:**
- **Today's layout** is the same as BEFORE in every pair opened: pill row, greeting, Chai and bubble, goal card, composer, docked brew length and start. Only Chai's line and the rail's words differ:
  - 844×390 @200 missed-cozy: "Afternoon slump? A…" → "Welcome back. A Tea…";
  - rail: "Brew today to keep it warm." / "Best 23" → "A Tea Cozy kept it warm yesterday." / "Warmest run 23".
- **K01's layout** (pill row, greeting, bubble, goal card, composer, docked start) is kept.
- **375×667 @200 Today** (blank, BEFORE and AFTER identical): the greeting shows only "Good" above the docked brew-length control and start. Pre-existing, not F's change.
- **1440 @200 rail, blank (fresh) person:**
  - heading "Warm the kettle", "One brew today makes it a warm day.";
  - foot "**Warmest run 0**" and "Tea Cozy in 7 days". Base: "Best 0" and the same "Tea Cozy in 7 days".
  - Raw: a warmest run of 0 and a Tea Cozy countdown shown to someone who has never brewed.
- **No overlap or clipping** of F's new copy in the frames opened. The longest new line, the Tea Cozy note in the sheet, wraps inside its card at 390×844 @100.

### 4d. Combined `e478604` :5520, F's surfaces with S/G/N merged

Prior: `combined/comb-comb.json`, `combined/comb.log`, 12 frames `combined/<cfg>-{composer-notice,end-sheet,markdone-undo}.png`, script `LI2-comb.mjs`. Configurations: 375×667 light and dark @200, 390×844 light @200, 1440 dark @200.

| Check | 375×667 L 200 | 375×667 D 200 | 390×844 L 200 | 1440 D 200 |
|---|---|---|---|---|
| A notice over the composer: elements hit under the notice / task field in view | none / yes (`why: above`) | none / yes | none / yes | none / yes (`why: answer`) |
| End sheet (S's `Sheet.*` + F's text): Keep brewing / End session on top 9/9 and in view | yes / yes | yes / yes | yes / yes | yes / yes |
| Kept band after End's notice went (px) | **194** | **194** | **194** | 113 |
| Mark done → inline Undo: on top 9/9; overlaps with notices; Undo restores the task | 9/9; none; yes | 9/9; none; yes | 9/9; none; yes | 9/9; none; yes |

The phone sizes @200 kept a 194 px band. On the trial, "Saved 3 minutes of focus" alone leaves 113 px at these sizes (§1a), so this is not that notice's height. The probe's 3-line composer warning was raised on Today before the brew. Notices queued at a route change move to the next screen, and the room keeps the tallest notice that left. That the warning came back to Today and set the room is my inference; the probe did not record which notice set it.

### 2e. Redone on phones with a real finger drag

`LI2-idle2.mjs`: CDP `Input.dispatchTouchEvent` touchStart, touchMove in 12 px steps every 16 ms, touchEnd. Run 17:22–17:30 UTC. Data `idle2/{trial,base}/idle2-*.json`, logs `idle2/*.log`, frames `idle2/trial/390x844-*.png` (the "above" after-frames removed for size).

**Band after a touch scroll (trial, 10 s idle variant):**
- 390×844 light @100: the drag scrolled the page to **sy 297** with the band above the view (strip top −281). Dragged back to sy 0, then sampled at 0.3 / 1.3 / 2.5 / **6 s**: **room 68 at every sample**, **0 commits**. Before that: 10 s idle with room 68; pointer held 3 s with room 68.
- 390×844 dark @200 reduced: sy 311 (strip top −295). After the drag back, **room 153.5 at every sample to 6 s**, 0 commits.
- Hidden (emulated): room → 0, content **−68 / −153.5 px** on return.
- New screen and reload: room → 0.

Frames: `idle2/trial/390x844-{light-t100,dark-t200-rm}-{2-band-at-leave,3-band-after-10s-idle,4-band-after-scroll-and-6s-idle}.png`.

**The "above" path during a touch fling** (time-up while busy, then a 600 px finger drag released into momentum scrolling):

| Build | Config | The leave | Visible effect in the leave's frame |
|---|---|---|---|
| TRIAL | 390×844 light 200 (×2) | `why: above`, room 0, **513 / 549 ms after the last touch input** (`pointercancel`, i.e. while the fling was still moving the page) | rep 0: target moved **−153.5 px with scroll 0**; rep 1: **−165.5 px with scroll +12**. In both, the layout shift (−153.5, the strip's height) was **not compensated**: everything below the strip jumped up 153.5 px on screen mid-fling |
| BASE | 390×844 light 200 (×2) | `why: above`, 478 / 532 ms after `pointercancel` | rep 0: −165.5 visible with scroll +12; rep 1: −153.5 with scroll 0. **Same jump on the base** |
| TRIAL | 375×667 dark 100 reduced (×2) | `why: above`, 293 / 318 ms after `pointercancel` | the frame scrolled −60 / −72 (the strip is 72.5). The target was the docked brew-length control, which does not move with the page, so the visible content shift is **not measured** |

The target was above the view at that moment (top −118). The 153.5 px jump is of the content in view below the strip. At 1440 with stepped wheel and reduced motion, the same path was compensated (§2d).

**Caveat on the fling rows:** the tracker saved only frames whose layout shifted (`|visible + scroll| > 2 px`). A compensation applied one frame late would show as visible +153.5 with scroll −153.5. That frame would not be saved, so whether the jump was undone a frame later is **not recorded**. In the leave's own frame the content had moved 153.5 px with no matching scroll (both builds).

**Interpretation, raw:** the "above" leave is not part of the band question (it keeps no room). It is the one change the trial makes while a scroll is still running. On a touch fling the compensation did not hold, on both builds.

### 3d. `reach`, redone with a real finger drag

`LI2-idle2.mjs` "reach": trial 17:22–17:25, base 17:28–17:30. Frames `idle2/{trial,base}/{375x667,390x844}-*-reach-{1-notice,2-scrolled}.png` (844×390 frames removed for size); data `idle2/*/idle2-*-reach-all.json`. A 6 s notice "Couldn't save just now. Your summary is still here. · LI2 reach probe" was shown in the panel's strip of a running brew. A finger drag then brought the lowest control (Add 5) into view.

| Config | After the drag | Did the notice leave? |
|---|---|---|
| 375×667 light / dark @200 (both builds) | Add 5 at y 585–590, in view. The whole page scrolled: the strip (228 px) went **under the sticky scene**, its last ~30 px showing below it (`reach-2-scrolled.png`) | **No, not within 30 s** (timeout). Less than 60 % of the strip is in view, so its clock is stopped (the T2 rule, F-T2-3) |
| 390×844 light @200 (both builds) | Add 5 at y 767 in view; strip 309–497, of which ~77 px show below the scene (opened: `idle2/base/390x844-light-t200-reach-2-scrolled.png`) | **No, not within 30 s**, same reason |
| 844×390 light / dark @200 (both builds) | no Add 5 / Pause / End on top in view below the strip (strip 228.5 px, panel 218–236 px tall) | not tapped |

**Raw finding:** at these sizes, with this notice, bringing a control into view by touch hides most of the strip. Its clock stops, so neither build closes the strip while that control is in view. It would leave later, when scrolled back (then "above" or at rest), which these runs did not reach.

The case of a short notice with a control already partly in view at rest is §3e.

### 1e. Gap filled: the other theme/motion pairs (light + reduced motion, dark + full motion)

`LI2-probe2.mjs` = the prior probe with the pairs swapped, scenarios L1, L2, E. Trial :5521, 17:30–17:38 UTC. Data `probes2/trial/probe2-trial.json`; log `probes2/probe2-trial.log`. 16 configurations: 4 sizes × 100/200 % × {light rm, dark full}.

**L1 and L2:** 31 taps (one L2 skipped at 390×844 dark @200, no target in view). **All 31 landed on the target, which moved 0 px.** Every leave was `why: rest` with the room kept:
- 68 px (phones and 1440 @100);
- 113 px (390×844 / 375×667 / 1440 @200);
- 56.5 px (844×390 @100);
- 137.5 px (844×390 @200).

In 6 L2 runs the notice had not yet left in the tap's window (no change seen).

**E, a notice arriving at rest:** pushes as in §1a:
- 68 px at 390×844 @100 and 1440 @100;
- 113 px at 390×844 / 375×667 @200;
- 107 px at 844×390 @200;
- 72.5 px at 1440 @200.

A tap aimed beforehand lands on the arriving notice or the card in **10 of 15** (one skipped). The 5 on target:
- 375×667 @100 ×2 and 844×390 @100 ×2, where the push is 0 / −16 px;
- 390×844 dark @200, where the tap came 2,043 ms before the change the probe saw.

**Base control for 1e** (`probes2/base/probe2-base.json`, 17:38–17:43 UTC, L1/L2, same 16 configurations):
- **24 of 32 taps landed off target**, at −68 px (390×844 @100, 1440 @100), −70.5 (844×390 @100), −113 (390×844 @200, 1440 @200) and −151.5 (844×390 @200). Every one `why: rest`, the strip closing.
- They landed on the "Study" chip, the greeting h1 or a status image.
- The 8 on target are all 375×667, as in §1a.

**Totals with §1a:**
- **base: 50 of 66 L1/L2 taps off target;**
- **trial: 0 of 64.**

### 3e. `reach` with a control already partly in view at rest (no scrolling)

`LI2-reach2.mjs` (new), trial 17:43–17:46, base 17:46–17:48 UTC. Data `reach2/reach2-{trial,base}.json`; logs `reach2/reach2-*.log`; frames kept for 375×667 @100, 390×844 @200 and 844×390 @100 with the 24-character notice: `reach2/{trial,base}-<cfg>-24-{1-notice,2-after-tap}.png` (the rest removed for size).

**Setup:**
- A running brew; light, full motion, touch.
- A 3 s notice in the panel's strip, raised with nobody touching: "Saved 3 minutes of focus" (24 chars) or "Couldn't save just now. Your summary is still here." (51 chars), used as stand-ins of real length.
- Target: the lowest of Add 5 / Pause / End with ≥ 20 px visible and on top at its visible middle.
- Intent read ~200 ms before the time-up; a real tap at that point right after the notice goes.

| Config | Panel with notice (scrollH/clientH) | TRIAL: leave / target moved / tap landed | BASE: leave / moved / landed |
|---|---|---|---|
| 375×667 @100, 24 ch (strip 62) | 368/354, **out of reach** | rest, **room 0** / **−45.1 px** / on "Add 5" **caption** span, **not the button** | rest / −45.1 / same caption span, not the button |
| 375×667 @100, 51 ch (strip 66.5) | 372/354, out of reach | rest, room 0 / **−49.6** / caption, not the button | rest / −49.6 / caption, not the button |
| 390×844 @200, 24 ch (strip 107) | 553/422, out of reach; Add 5 shows 45.4 px | rest, room 0 / **−107 px** / **the countdown** (`DIV._timer…` "24:53 Kettle's on…"), not the button | rest / −107 / the countdown, not the button |
| 844×390 @100, both (strip 62 / 66.5) | 292/292, fits | rest, **room kept 62 / 66.5** / **0** / on target | rest / **−31 / −33.3** / on target (the 54 px button still under the point) |
| 667×375 @100, both | 277/277, fits | rest, room kept / **0** / on target | rest / −31 / −33.2 / on target |
| 375×667 @200, 844×390 @200, 667×375 @200, 390×844 @200 51 ch | out of reach | no control ≥ 20 px visible below the strip: no tap; leave `rest`, room 0 | same |

Opened: `reach2/trial-390x844-light-t200-24-1-notice.png` (notice under the scene; 24:56; the tops of the three control circles at the bottom edge) and `…-2-after-tap.png` (strip gone, countdown and Add 5 / Pause / End moved up 107 px, fully in view).

**Answer, raw:** yes. Where the notice pushes the session controls past the panel's edge (375×667 @100, 390×844 @200), the trial's `reach` close at rest moves a partly visible control 45–107 px up. A tap aimed at it just after lands on its caption or on the countdown, not the button. **The base does exactly the same** (same px, same landing). Where the panel fits (844×390 / 667×375 @100), the trial keeps the room (0 px) and the base moved 31–33 px; there the tap still hit the button on both builds.

### 2g. The fling "above" leave, every frame (resolves §2e's caveat)

`LI2-idle3.mjs` = idle2's "above" with every frame from 6 before to 8 after the leave saved. 390×844 light @200, finger drag 600 px released into momentum, 17:48–17:49 UTC. Data `idle3/{trial,base}/idle3-*.json`; frames `idle3/*/…-above-r*-after.png`.

| Build, rep | Frames before the leave (16 ms apart): target top / sy | The leave's frame | Frames after |
|---|---|---|---|
| TRIAL r0 (leave 632 ms after `pointercancel`) | 47.6 / 189 → 35.6 / 201 (scroll 12 px per frame or none) | **top −129.9, sy 213** (strip 153.5 → 0, `why: above`) | −129.9 / 213, −141.9 / 225, −153.9 / 237 … sy keeps climbing 12 px per frame; **no frame with sy −153.5** |
| TRIAL r1 (500 ms) | 59.6 / 177 → 47.6 / 189 | **top −105.9, sy 189** (scroll 0 in that frame) | −117.9 / 201 … no compensation frame |
| BASE r0 (473 ms) | 78.6 / 158 → 66.6 / 170 | **top −98.9, sy 182** | sy 194, 206, 218 … no compensation |
| BASE r1 (463 ms) | 71.6 / 165 → 59.6 / 177 | **top −93.9, sy 177** | sy 189, 201 … no compensation |

**Result.** During a touch fling, the notice whose time ran out leaves on the "above" path. On both builds, everything below the strip jumps up **153.5 px** on screen in one frame: the target, a status-bar control, went from **35.6 / 47.6 px (in view)** to −129.9 / −105.9. The page's scroll is not compensated in that frame or any of the next 8. **The trial and the base behave the same.** It happens 460–630 ms after the finger lifts, while the page is still moving.

## 7. Unproven, and limits of this evidence

- **Page hidden:** the hidden-page collapse was **emulated** (property override plus a dispatched `visibilitychange`), not a real tab switch or app backgrounding. The −68 to −153.5 px on return is what the app does on that event; real platforms were not driven.
- **Real devices, WebKit, Firefox:** not run. `isInputPending` (the trial's extra guard) is Chromium-only. Touch was CDP-dispatched in headless Chromium, with `hasTouch`/`isMobile`; there was no real finger or momentum physics.
- **Smooth scrolling on the "above" path:** a full-motion wheel scroll while the strip leaves above the view was not exercised at 1440 (the page at @100 scrolls only 11 px). The touch-fling case is §2e; whether its 153.5 px jump is undone a frame later is in §2g if that job finished.
- **`w2-home:203`:** the cause of the 13 px overflow in the D run is not established (blank trace frames). It passes alone on both builds.
- **Lane R's `w3-notices` failure:** not reproduced alone. Its cause inside the full run is not established.
- **The combined probe's 194 px band** (§4d): which notice set it is inferred, not recorded.
- **Not run by me:** tsc, vitest, the full chromium suite (not asked); the maker's `w3-notices-load` CPU×6 control.
- **Seeds and dates:** the captures (prior `LI2-cap.mjs`) build the missed days with the debug API: seed `veteran` (Tea Cozy held) or `newbie` (none), then `__kettle.ff(2 × 86 400 000)` and a fresh visit to Today (Stats and back). "cozy-earn" is `atRisk`, one finished brew, `ff` one day. I did not re-run these captures this session; I read their frames and facts.
- **`reach` with a scrolled panel:** with the panel scrolled so a control was in view, the notice never left within 30 s (§3d). What happens when it finally leaves after the person scrolls back is not measured.
- **Evidence size:** 58 MB after removing redundant new frames (listed where each section cites them). No prior evidence was removed.

## 8. Index of new evidence (this session)

| Path | What |
|---|---|
| `runs2/E1…E6-*.log`, `runs2/{E,F,G,H,I,J}-slots.log` | spec runs (§1c, §4b, §4c) and slot records |
| `idle/{trial,base}/` | §2a, §2d, §2f (Vibei's §3 band; arrival; "above" with stepped wheel) |
| `idle2/{trial,base}/` | §2e, §3d (real finger drag) |
| `idle3/{trial,base}/` | §2g (fling frames) |
| `probes2/{trial,base}/` | §1e (the other theme/motion pairs) |
| `topbar2/` | §3a (F-T2-8 cost) |
| `reach2/` | §3e (`reach` close at rest) |
| Scripts, `/home/user/wt/w5tr-f/kettle/.tmp/LI2/` | `LI2-idle.mjs`, `LI2-idle2.mjs`, `LI2-idle3.mjs`, `LI2-probe2.mjs`, `LI2-topbar2.mjs`, `LI2-reach2.mjs`, `LI2-job{E,F,G,H,I,J}.sh` |

Finished 17:55 UTC. Raw evidence only; LEAD-5 decides.
