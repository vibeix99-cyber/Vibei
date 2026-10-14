# W3R1 · Maker F: notices polish (F-T2-1), triage, warm-days wording, I13 supportive return — READY FOR REVIEW

- **Branch:** `pe/w3-notices-polish` (worktree `/home/user/wt/w5f`); local commits only, never pushed.
- **Code:** `9f30a9b` · **kettle/src tree `0acce1a`** (base `4d36939`, src `5cd9a44`). The packet commit on top changes no source.
- **Dev :5501:** `verify.sh` → `PORT 5501 serves 9f30a9b (src 0acce1a): VERIFIED`. Base: dev :5478 (`4d36939`).
- **Evidence:** `contracts/W3R1/F/` — `controls/` (base and fix control logs), `suites/` (every suite log), `shots/{before,after}/<w>x<h>-<theme>-t<pct>/<state>.png` (full size, DPR 1), `REFERENCE-K01-01-home.png`.

## 1. Files changed (all within F's ownership)

| File | What |
|---|---|
| `src/ui/Toast.tsx` | **F-T2-1.** A notice that goes at rest or as a tap's answer leaves its face but the strip **keeps its room** (`Ctl.room`, an empty band of the same height); the next notice is drawn in it. The room is given back only at a safe moment: a new screen (or its first `ENTRY_MS`) or the page hidden. Not when scrolled above the view: a wheel or fling the page has not been handed yet undoes any compensation (measured: 60 px at 1440 @200, 153 px in toast-room), so the band stays until the screen changes. Every at-rest change is now confirmed in a fresh animation frame and skipped while `navigator.scheduling.isInputPending()` reports input on its way. One exception, `NoticeStrip reach` (the session panel only): when the notice itself holds the panel's controls past its edge, the panel keeps no room and closes up as the notice goes, at rest, as before this round; a room that later holds them out of reach is given back at rest (see §4, F-T2-2). `toast.state()` reports `room`. |
| `src/screens/focus/FocusScreen.tsx` | Passes `reach` to the session panel's strip (one prop). |
| `src/screens/focus/FocusScreen.module.css` | **F-T2-8.** Side by side (landscape phones and up) the top bar wraps: when the task (`flex: 1 1 8rem`) and Rain + sound can't share the column's line (200 % text), the buttons take their own line, right-aligned; at 100 % they share one line as before. |
| `src/screens/focus/parts/EndSheet.tsx` | **I13, End honest:** when today is not warm yet, "That's okay — your minutes still count. Today turns warm when a brew runs to the whistle." (the engine's rule: an ended-early brew earns its minutes, not the warm day). Unchanged when today is already warm. |
| `src/screens/home/warm.ts` (new), `warm.test.ts` (new) | Where a person stands with warm days (fresh / returning / warm today / Tea Cozy just used / pending), read only from the engine's `current`, `best`, `todayDone`, `cozies`, `days`; the rail's and the status sheet's lines; the Tea Cozy note, true for this person. |
| `src/screens/home/chai.ts`, `chai.test.ts`, `useHomeData.ts` | Chai's lines in warm-days words; the Tea Cozy return line; the return after an unwarmed day; night and evening invite, rest is welcome. |
| `src/screens/home/StatusBar.tsx` | Status-bar sr text, warm sheet line, "Warmest run", Tea Cozy note. |
| `src/app/Rail.tsx` | Rail title/caption/foot; sidebar mini stat `title` and sr text. |
| `src/progress/badges.ts` + `badges.test.ts`, `engine.test.ts` | Badge line only: "Keep a {n}-day warm streak" → "Brew {n} warm days in a row". Id `warm-streak`, tiers, title "Warm Days" unchanged. |
| `src/screens/done/summary.ts`, `rank.test.ts` | Tea Cozy note and sr wording only (no layout change to P's summary). |
| `tests/notice-strip.spec.ts` | **N-1:** asserts the task is in the field before Start, typing it again for real if it missed. Nothing removed or loosened. |
| `tests/w3-notices.spec.ts` (new) | F-T2-1 controls (§2). |
| `tests/w3-notices-load.spec.ts` (new, opt-in `W3_LOAD=1`) | notice-strip's first part under CPU throttle (the load control, §2). Its early logs name it `w3-notices-probe2.spec.ts`. |

No new dependency, no palette/font change, no rule, economy, stored-data or id change, no new setting, no new art.

## 2. Controls first (base :5478, then fix :5501)

### F-T2-1 — the strip moved content under a pending tap

**Mechanism, measured on the base** (`controls/base-cpu6-1440-200-reduced-x4-timeline.log`): notice-strip's first part at 1440×900 @200 reduced, CPU ×6. Today opens with "Saved 3 minutes of focus" (strip 73 px, Mark done at y 745). At 1440 @200 Mark done sits under the docked "Put the kettle on", so the spec wheels it into reach. The press loop starts (pointer move at 9630 ms); the page sees no input for 2.2 s while the wheel is still on its way; at 11808 ms the notice goes **at rest** and the strip closes (Mark done 745 → 673); the wheel's scroll lands afterwards (sy 60) and the click aimed at Mark done lands on the tag group. Exactly the final regression's record (`sy: 60, why: "rest"`, tap on `_tagGroup`).

| Control | Base `4d36939` | Fix |
|---|---|---|
| `notice-strip` 1440×900 light 200 % reduced, normal load (`controls/base-notice-strip-1440-200-reduced-run1.log`) | passed 1/1 this time (load-dependent; final regression: 2/2 failed) | Mark done part passed in **every** run since the fix (6 runs: run2, x2-final ×2, final-specs, and the earlier x2's valid run). Whole test: passed in `notice-strip-final.log` (25/25, src `2d5719e`) and `final-specs.log` (src `3027de2`); in `notice-strip-1440-200-reduced-x2-final.log` (src `3027de2`) run 1 failed at the **History Undo, 111 px = N-2** (S's focus scroll; Mark done had passed), run 2 passed. **Two consecutive full passes on the final src are not proven** (the next x2 run was dropped for time). |
| Same, CPU ×6, ×4 (`w3-notices-load.spec.ts`) | **2/4 failed, then 2/4 failed again** (`base-cpu6-…-x4.log`, `…-timeline.log`), same symptom | **4/4 passed** (`fix-cpu6-1440-200-reduced-x4.log`, on `96d3187`) |
| No input at all after End (`w3-notices-probe`, log in `fix-cpu6-…-x4.log` test 1 and the first base probe): Mark done's top when the notice goes | 745 → 673 (moves 72 px, `why: rest`) | 745 → 745 (room 73 px kept) |
| `w3-notices.spec.ts` "End's notice goes at rest and nothing moves; a tap aimed at Mark done before it went lands on Mark done" (`controls/base-w3-notices-control-run2.log`, `suites/w3-notices-final.log`) | **4/5 failed**, all "Mark done moved on screen": 1440 @200 reduced (745), 390×844 light and dark (556), 1440 dark @100 (499). 844×390 passes on the base too (Today's strip is in the pinned left column there, so nothing below it moves) | **7/7** in `final-specs.log` (src `3027de2`): every config passes, incl. the 4 the base fails |
| The room stays while the page is scrolled over it and back (nothing moves by layout); a new screen starts with no room | n/a (no room on the base) | passed (`final-specs.log`) |

### N-1 — notice-strip setup miss under load
Not reproducible on demand (it was a one-off under three-browser load: the brew saved as "Study brew"). The spec now asserts the field holds "Chapter 3 notes" before Start and types it again for real if not; the assertion has held in every run since (`notice-strip-final.log` 25/25, `final-specs.log`).

### F-T2-8 — landscape top bar squeezing the task label at 200 %
BEFORE/AFTER `shots/{before,after}/844x390-{light,dark}-t200/session-running.png` (and `end-sheet.png`): base task label one letter per line beside Rain and sound; fix: the task on its own line, Rain and sound on the next. 100 % unchanged (`…-t100/session-running.png`).

## 3. Warm-days wording and I13 — every string changed (S and G own theirs)

| Where | Before | After |
|---|---|---|
| Badge line (`badges.ts`; Stats › Badges shows it) | Keep a {n}-day warm streak | Brew {n} warm days in a row |
| Rail heading, no run | Start a warm streak | Warm the kettle (never had one) · Welcome back (had warm days before) |
| Rail caption | One brew today warms the mug. / Kept warm today. Lovely. / One brew tonight keeps it warm. / Brew today to keep it warm. | One brew today makes it a warm day. / One brew warms the kettle today. (returning) / Warm today. Lovely. / A Tea Cozy kept it warm yesterday. (or "while you were away") / One brew today (tonight) adds another day. |
| Rail foot | Best N | Warmest run N |
| Sidebar mini stat (900–1199) | `title="Warm streak"`, sr "N days warm streak" | `title="Days warm"`, sr "N days warm" |
| Today status bar, sr | "streak, brew today to keep it. Show details" | ", today not brewed yet. Show details" (visible "N days warm" unchanged) |
| Status sheet line | Brew today to start a new streak. Every streak begins with one brew. / You kept the kettle warm N days in a row. / Brew once today to keep it warm. | One brew warms the kettle today. Each day with a finished brew is a warm day. / Welcome back. One brew warms the kettle today. Your warmest run so far: N days. / N warm days in a row, today included. / N warm days in a row. One brew today adds another. |
| Status sheet fact | Best streak | Warmest run |
| Status sheet Tea Cozy note | Tea Cozy. Keeps your streak warm for one missed day. It's used automatically… You'll earn the next one in N days. | Held: "A Tea Cozy keeps the kettle warm through one missed day. It's used for you, so there's nothing to remember. You have one/N." · just used: "… One did yesterday. You have one more." · none yet, run going: "No Tea Cozy yet. You'll earn one after N more warm days in a row: it keeps…" · no run: "Every 7 warm days in a row earn a Tea Cozy: it keeps…" |
| Chai, night, today not warm | It's late. One {brew} keeps your N-day streak warm. | It's late. One {brew} makes it N+1 warm days in a row. Or rest: your Tea Cozy will keep the kettle warm. (Tea Cozy held) / Or rest. The kettle will be here tomorrow. (none) |
| Chai, evening | Your N-day streak is still warm. One {brew} keeps it going. Your Tea Cozy is on standby, too. | N warm days in a row. One {brew} warms today too. And if today slips by, your Tea Cozy keeps the kettle warm. (the last sentence only when one is held) |
| Chai, back after a Tea Cozy covered yesterday (new) | (ordinary line) | Welcome back. A Tea Cozy kept the kettle warm yesterday, so your N warm days in a row carry on. |
| Chai, back after an unwarmed day, no Tea Cozy (new: also after 1–2 days, first visit of the day) | (ordinary line; the "back" line only after ≥3 days) | Welcome back. No catching up needed. One cup is plenty. / Oh, hello again. The kettle's ready when you are. (was "I kept the kettle warm for you", untrue once a run has ended) |
| Summary Tea Cozy highlight note / pill sr | Covers one missed day, so your warm days keep going. / You earned a Tea Cozy: it covers one missed day, so your warm days keep going | Keeps the kettle warm through one missed day. / You earned a Tea Cozy: it keeps the kettle warm through one missed day |
| End sheet (today not warm yet) | That's okay — your minutes still count. | That's okay — your minutes still count. Today turns warm when a brew runs to the whistle. |

Principles kept: no visible, sr, `title` or `aria-*` "streak" left in F's files (`grep -i streak` over F's files finds only ids, identifiers and comments); no "lose", "break", "don't miss", no urgency (unit-tested over every part × run × cozies × best × cozy-day combination: `chai.test.ts`, `warm.test.ts`); a Tea Cozy is named only where it is true for this person (held, or just used for them); Chai says what happened, the status sheet explains the rule once (it does not repeat Chai's line); Skip break and "That's all for now" are untouched and nothing nudges against them; Welcome unchanged (no warm-days wording there; Tea Cozy is not relevant before a first brew). No rule, eligibility, arithmetic, id or stored data changed: `warm.ts` only reads the engine's numbers.

## 4. Triage (F-T2-2, F-T2-8, N-1, N-2, N-3)

| # | Result | Why |
|---|---|---|
| F-T2-1 | **Fixed** (§2) | Room kept; at-rest changes confirmed in a fresh frame, never with input pending. |
| F-T2-8 | **Fixed** (`FocusScreen.module.css`) | §2. |
| N-1 | **Fixed in the spec** (strengthened) | §2. |
| F-T2-2 | **FOLLOW-UP, not worse** | A notice at the session panel's head still pushes the readout/controls below the fold at 375×667 / 844×390 @200 for its life (unchanged). Moving the strip under the controls, or a one-line clamp, conflicts with Vibei's I10 rulings ("the head of its panel"; "every word, never clamped") and with toast-room R8 (the update prompt whole and on top at the panel's top at 667×375 / 844×390 @200). Needs a design ruling. The kept room would have made it last longer, so the session strip gives its room back at rest when the room holds the panel's controls past its edge (`reach`), exactly as the base did; where the panel fits with the room, the room is kept. |
| N-3 | **FOLLOW-UP** (with F-T2-2) | Same class: a long persistent notice on the tea break at landscape @200 runs below the fold; the app raises no persistent notice on `/focus`. |
| N-2 | **Cross-owner (S)** | The History Undo read races the base's focus scroll when the tapped row takes focus (≈110 px). That scroll is in S's `src/screens/stats/History.tsx`. Not changed by F. |

## 5. Suites (dev :5501, src `3027de2` unless stated)

| Suite | Result | Log |
|---|---|---|
| `tsc --noEmit` | exit 0 | `suites/tsc.log` |
| `vitest run` | **31 files, 297/297** (base 290; +7: `warm.test.ts` 4, `chai.test.ts` 3 new) | `suites/vitest.log` |
| `notice-strip` (25 configurations, workers 2) | **25/25** on src `2d5719e` (`notice-strip-final.log`); **25/25** again inside `final-specs.log` on `3027de2` | `suites/notice-strip-final.log`, `suites/final-specs.log` |
| `notice-strip` 1440×900 light 200 % reduced, `--repeat-each=2` | 1/2 on `3027de2`: run 1 failed on N-2 (History Undo 111 px, S's focus scroll), not on Mark done; run 2 passed | `suites/notice-strip-1440-200-reduced-x2-final.log` |
| `w3-notices` | **7/7** (inside `final-specs.log`, src `3027de2`) | `suites/final-specs.log` |
| `notice-strip` + `w3-notices` + `toast-room`, `break-reach`, `a11y`, `w2-home`, `summary-notice`, `statusbar`, `w2-firstvisit`, `w2-summary`, `whistle` (one run, workers 2) | **146/147** on src `3027de2`; the one failure `break-reach:251/340` "100 % text … fit without scrolling" (Break's over at 375×667 @100: the room closed a frame after the notice went) led to the final commit `9f30a9b` (src `0acce1a`: the session panel keeps no room when the notice itself holds its controls past the edge). Re-run of that test on `0acce1a`: **unproven** — queued at 12:48, still waiting for a slot at the 13:00 stop (`suites/break-reach-fit-final.log`). A first attempt against a patched copy on :5511 timed out loading (`break-reach-fit-reachfix-5511.log`, environment, not a verdict) | `suites/final-specs.log` |

Earlier runs, kept for the record (not on the final src):
- `notice-strip-run1.log`: invalid — I edited source while it ran against :5501 (mixed module versions: `__kettle` undefined, notices raised into a second module instance).
- `notice-strip-run2.log`: **25/25** on `96d3187`+wording (src `c4451ae`).
- `w3-notices-fix.log`: 6/7 on src `c4451ae`; the failure was the control test's own aim (Mark done under the docked start at 375×667), fixed in the test.
- `notice-strip-1440-200-reduced-x2.log`: test 1 invalid (I restarted :5501 mid-run; "Kettle's off" = the brew lost), test 2 passed.
- `owned-specs.log` (src `98812ce`): 112/115. The 3 failures led to `e1f50dc`: `break-reach:251` (Break's over at 375×667 @100 no longer fit while a kept room held "That's all for now" below the edge → the session `reach` exception) and `toast-room:192` ×2 (a room given back above the view mid-scroll; the wheel's/fling's scroll animation undid the compensation and the banner moved 153 px → the room above the view is now given back only at rest).

Full chromium suite: **not run** (time; slot contention). Not run on `0acce1a`: anything but the break-reach fit test; the last change touches only the session panel's room (`reach` strips).

## 6. BEFORE / AFTER (full size; REFERENCE K01 `F/REFERENCE-K01-01-home.png`)

Paths: `contracts/W3R1/F/shots/before/<cfg>/<state>.png` (base :5478) → `contracts/W3R1/F/shots/after/<cfg>/<state>.png` (fix :5501), `<cfg>` ∈ {390x844, 375x667, 844x390, 1440x900} × {light, dark} × {t100, t200}. Frozen date 2026-10-12T07:40Z (Monday); the seeds pin the time of day (15:30; atRisk 19:40). "Missed" states: the seed, then the app clock +2 days (Wednesday 15:30; Tuesday went by with no brew).

| State | What to look at |
|---|---|
| `today-blank`, `today-newbie`, `today-veteran`, `today-atRisk` | Today in each state (K01 layout unchanged; Chai's line where it changed: atRisk) |
| `today-missed-cozy` (veteran +2 d: a Tea Cozy covered Tuesday) | Chai: "Welcome back. A Tea Cozy kept the kettle warm yesterday, so your 23 warm days in a row carry on." |
| `today-missed-nocozy` (newbie +2 d: the run ended) | Chai: "Welcome back…" invitation, no tally |
| `sheet-warm-atRisk`, `sheet-warm-missed-cozy` | Status sheet line, "Warmest run", Tea Cozy note |
| `end-sheet` | End's honest line |
| `session-running` | F-T2-8 at 844×390 @200 |
| `today-after-end-gone` | F-T2-1: base — the strip closed (content moved up); fix — the room kept above the greeting (strip height in `facts-*.json`) |
| `rail-blank`, `rail-newbie`, `rail-atRisk`, `rail-missed-cozy`, `rail-missed-nocozy` (1440 only; on Settings, where the rail shows) | Rail card wording |

Per-capture facts (Chai's line, dialog text, rail text, strip heights, whether "streak" appears anywhere on the page): `shots/{before,after}/facts-*.json`.

**Coverage:** BEFORE is complete (132 phone shots + 64 at 1440, `shots/before/`). AFTER on the final src `0acce1a`: the phones are complete (132 shots, `shots/after/{390x844,375x667,844x390}-*`); the 1440 set (incl. the rail states) was still queued at the hard stop and is **unproven** (the capture script `capture.cjs` is in the scratch area; re-run: `node capture.cjs 5501 <out> 390x844,375x667,844x390 <states>` then `1440x900`). Earlier AFTER captures on src `c4451ae` (`today-missed-cozy`, `today-missed-nocozy`, `sheet-warm-missed-cozy`, `today-after-end-gone` at 1440 ×4) are kept in `shots/after-early-c4451ae/` and were looked at: the room band above the greeting at 1440 @200 (73 px), Chai's Tea Cozy line, the sheet.

## 7. Preserve list

- 1 visual identity, 2 Chai, 3 kettle state, 4 ritual, 5 first action: untouched (no palette, font, art, timer or flow change).
- 6 working controls: Pause, Resume, Add 5, End, task Done/Carry/edit, Tea Time, Skip break, next brew, finish for now — semantics unchanged; End's sheet now states its consequence honestly.
- 7 accepted layouts: the top bar change applies only side by side when the line can't hold both (200 % text); duration controls, recipes and the summary are untouched. The kept room adds an empty band at the head of a screen until the next safe moment (visible in `today-after-end-gone`).
- 9 progression: warm days, Tea Cozy and badge arithmetic unchanged (`warm.ts` reads the engine; ids and tiers unchanged; engine and badge tests pass with only the description string updated).
- 11 user data: no stored-data change; a report stored by an older build keeps its badge line; the summary's warm-days badge note is computed from the tier as before.

## 8. Open findings

- **F1 (trade-off, for the checker and Vibei):** the kept room is an empty band (57–97 px) at the head of a tab screen after its notice goes, until the person leaves the screen or hides the page (scrolling past it does not give it back). It is never drawn over anything and holds no text; the next notice on that screen is drawn in it.
- **F2 (residual, session only):** on the session panel, where the room would push the controls past the panel's edge, it is given back at rest (base behaviour, now confirmed in a fresh frame and never with input pending). The F-T2-1 hazard remains in that narrow case; it is the F-T2-2 trade-off.
- **F3:** a notice *entering* at rest still pushes content in view (needed: notices raised with nobody touching, e.g. Break's over on Today or the update prompt, and the specs' raised notices). Hardened the same way (fresh frame, no pending input); not eliminated.
- **F4:** `isInputPending` is Chromium-only; elsewhere the fresh-frame check is the guard.

## 9. Cross-owner requests

- **S** (`src/screens/stats/History.tsx`): N-2, the focus scroll when the tapped History row takes focus (≈110 px) races notice-strip's "where the person saw the row" read at 1440 @200 reduced.
- **S / G:** no requests beyond PLAN.md's own split of the warm-days strings (S: StatsScreen tiles, StreakCard, the History delete dialog; G: Settings Daily goal footer, DataSection reset text, `ui/Gallery.tsx`). F's strings are listed in §3 so the lead can check one voice. Note for S: the badge line now reads "Brew {n} warm days in a row" (Stats › Badges shows it from the catalogue).
