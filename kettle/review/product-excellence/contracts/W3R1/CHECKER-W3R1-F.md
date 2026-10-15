# CHECKER W3R1 · Maker F: notices polish (F-T2-1), triage, warm-days wording, I13

**Final verdict: APPROVE** `pe/w3-notices-polish@11a7ac6` (final code `58d1b88` + spec `cbc88ac`; kettle/src `27d83ac`), as gated in fix trial `1358e00` (integration `8af9fcb` with N + G + S + X-2, plus `11a7ac6`). Final: the one fix round is spent. Any change to the branch after this invalidates it.

**History.**
- **First review:** REJECT `5ee3e7c` (§1–§7) with F-D1 (the band never collapsed; Vibei §3), F-D2 (the top bar wrap pushed the session controls down), F-D3 (a stray space in a name) and C-1.
- **Fix round (§8):** all closed, rerun by me on the final code at :5528:
  - the band goes on the same screen 1.2–1.4 s after touch and scroll are idle, never under a pointer or mid-fling;
  - 64 aimed taps, 0 off target;
  - the wrap is reverted (F-T2-8 is a FOLLOW-UP again);
  - the names are exact;
  - `whistle` 8/8;
  - `notice-strip` 25/25 and the owned specs 74/74.
- **One test stays flaky:** `notice-strip:292` at 1440 light 200 % reduced. Its causes are the spec's own wheel race and N-2 (S's file), not the strip. It gets a test-only action before the final regression (X-11, §8).

| | |
|---|---|
| Lead checker | LEAD-5 (replaces LEAD-4, cut by a usage limit). I implemented none of this work |
| Under review | `pe/w3-notices-polish@5ee3e7c`. `git rev-parse e3b9eac:kettle/src` = `0acce1a38bff…` (checked) |
| Trial | `e3b9eac` = integration + `5ee3e7c`; worktree `/home/user/wt/w5tr-f`. `git diff --stat 4d36939 e3b9eac -- kettle/src kettle/tests kettle/public kettle/package.json` = F's 19 files only. Dev :5521, preview :5531 |
| Base / control | `4d36939` (src `5cd9a44`); dev :5478, preview :5488 |
| Packet | `/home/user/wt/w5f/kettle/review/product-excellence/contracts/W3R1/F-READY-FOR-REVIEW.md`; evidence `…/W3R1/F/` |
| Lane I2 | `review/LI2/F/RECEIPT-LI2-F.md` (§1–8 + Unproven; complete at `cf9d1d2`), raw evidence beside it (58 MB) |
| Combined (Lane R) | `review/LR/ALL/` (receipt still being written); used here only for the runs named |

## 1. What I did

### Read
- `PLAN.md`, `BRIEF-F.md`, `VB-DECISIONS-RESUME.md` (§3 binds F-D1), `review/INVENTORY-RESUME.md`, `review/GATE.md`, the preserve list, the house style (`W2R3/CHECKER-W2R3-T2.md`: F-T2-1, F-T2-2, F-T2-8, N-1…N-3 are defined in its §4 and §7).
- The packet in full.
- Lane I2's receipt in full.
- The `Toast.tsx` diff in full (+156 lines):
  - `Ctl.room`;
  - `decide()`;
  - `inputPending()`;
  - `confirmRestInFrame()`;
  - `holdsOutOfReach()`;
  - the `reach` prop;
  - the visibility listener.
- The `StatusBar.tsx` diff.
- The `done/summary.ts` rounding, for Lane I's S note (§4).

### Ownership
Every changed file is in F's set:
- `ui/Toast.tsx`;
- `app/Rail.tsx`;
- `screens/home/{StatusBar,chai,useHomeData,warm}.ts(x)` and the tests;
- `screens/focus/{FocusScreen.tsx, FocusScreen.module.css, parts/EndSheet.tsx}`;
- `screens/done/{summary.ts, rank.test.ts}`;
- `progress/{badges.ts, badges.test.ts, engine.test.ts}`;
- `tests/{notice-strip, w3-notices, w3-notices-load}.spec.ts`.

Under `src/progress` only the badge description line and its two assertions change (Lane I2 §5c). There is no rule, id, stored-data, palette or font change.

### The code, judged against the brief and Vibei §3
- **What the room does.** A notice that goes at rest, or as the answer to a tap, now leaves its face but keeps its height as `Ctl.room`. The strip draws an empty `min-height` band, and the next notice is drawn in it. That is what makes a tap aimed just before the leave land where it was aimed.
- **When the room comes back.** `decide()` gives the room back on a tab screen only:
  - in a screen's first `ENTRY_MS`;
  - when `document.visibilityState === 'hidden'`;
  - for a `reach` strip whose panel overflows (the session panel only).

  There is **no idle path.** The code comment states it: "Not when scrolled above the view: a scroll still on its way would undo the compensation". So by construction the band stays until a new screen, a reload or a hide. Lane I2 measured exactly that (§3, F-D1).
- **At-rest changes.** These are now confirmed in a fresh animation frame (`confirmRestInFrame`) and skipped while `navigator.scheduling.isInputPending()` reports input (Chromium only; F4 in the packet).

### Opened at full size
- Lane I2's band frames:
  - `idle/trial/390x844-light-t100-0-no-notice.png` → `…-3-band-after-45s-idle.png`. After 45 s idle on the same screen, a 68 px empty cream band sits above the status bar. The Create/Life chips, visible before the notice, stay hidden behind the docked start.
- The top-bar frames (`topbar2/{base,trial}-{844x390,667x375}-light-t200-session-running.png`):
  - **base:** "C / h / a.." beside Rain and sound, with the tops of Add 5 / Pause / End and their icons showing at the bottom edge;
  - **trial:** "Chapter 3 / notes · Study" readable, with Rain and sound on their own line. At 844×390 only slivers of the three circles show; at 667×375 only their shadow.
- I checked Lane I2's top-bar numbers against `topbar2/topbar2-{base,trial}.json`. Controls at y 352 → 369; visible 38.5 → 20.8 (844×390), 23.5 → 5.8 (667×375); panel overflow 41 → 59 / 56 → 74. At @100 they are identical.

## 2. What verifies (kept for the fix round)

| Item | Result | Source |
|---|---|---|
| **F-T2-1, controls first** | A tap aimed ~200 ms before the notice's time is up (L1), or fired at the time-up (L2), across 4 sizes × 100/200 %, light/dark, reduced motion on/off:<br>• **base:** 50 of 66 off target; the target moved 68–151.5 px (`why: rest`, the strip closing); taps landed on "Study", the greeting or a status image;<br>• **trial:** 0 of 64 off target, target moved 0 px. The 8 base taps that hit are all 375×667, where the target sat above the strip's reach | Lane I2 §1a, §1e |
| **`notice-strip:275` without weakening** | Spec diff +9 / −0 (N-1's field check and one real retype). Trial runs:<br>• 1440 light 200 % reduced: **5 of 6** passed, including **2 in a row** (E1, 16:56–16:58), the brief's bar;<br>• 1440 dark 200 %: 2 of 3;<br>• the other 23 configurations: 23/23.<br>**Both failures** carry the spec's own wheel race: Mark done moved by exactly one 60 px wheel step, after `press()` sent a second wheel because the first had not landed when `onTop` was read. In the dark run the strip had not changed since the screen arrived. Neither shows the base's mechanism (`why: rest`, the strip closing under the tap) | Lane I2 §1c, §1d |
| **N-1** | The new `toHaveValue('Chapter 3 notes')` held in every trial run (25 configurations + 7 at 1440 @200) | Lane I2 §3b |
| **The invariant and the T2 controls** (R5-D1, LEAD-D1, R7-D1, D4, W2H-D1, T2-D1) | On trial: toast-room 14/14, a11y 11/11, summary-notice 14/14, break-reach 17/17 (including `:251`, which the maker could not rerun on `0acce1a`).<br>w2-home 17/18 in a 2-worker batch; `:203` (Welcome fits at 375×667 @100, 13 px over) passes alone on trial and base, and F changed nothing under `welcome/` (§4, F-R7) | Lane I2 §4a, §4b |
| **Warm-days wording in F's files** | No visible, sr, `title` or `aria-*` "streak" left in F's files (only ids, identifiers, comments). Rendered: 0 of 120 trial Today/sheet/End/summary parts contain it (base 76 of 104). Every new string matches the glossary. No "lose", "break", "don't miss" or urgency | Lane I2 §5a, §5b |
| **I13, true to the engine** | **Tea Cozy:** named only where it is true for this person (held, or just used); the just-used return line ("…kept the kettle warm yesterday, so your 23 warm days in a row carry on") is true by `streak.ts`.<br>**End:** "Today turns warm when a brew runs to the whistle" shows only when today is not warm yet, and is the engine's rule.<br>**Skip break and "That's all for now":** untouched.<br>**Rules:** no rule, threshold or stored-data change | Lane I2 §5c |
| **F-T2-2, N-2, N-3 triage** | The reasoning holds. F-T2-2 / N-3 need a design ruling (Vibei's I10 rulings: "head of its panel", "never clamped"). N-2 is S's `History.tsx` focus scroll.<br>The session strip's `reach` exception gives its room back at rest exactly as base did. Lane I2 §3e: the same px and the same landing on both builds (Add 5's caption or the countdown, 45–107 px, at 375×667 @100 and 390×844 @200). Where the panel fits, the trial keeps the room (0 px; base 31–33 px) | Lane I2 §3c–§3e |
| **REFERENCE → BEFORE → AFTER** | All 16 configurations paired for Today's states and the 1440 rail. The 1440 AFTER is Lane I2's (the maker's 1440 AFTER was not captured). K01's layout is kept; only Chai's line and the rail's words differ | Lane I2 §6 |
| **Suites** | tsc 0; vitest 297/297; notice-strip 25/25 (src `2d5719e`) and inside `final-specs` (src `3027de2`); w3-notices 7/7 | Packet §5 |

## 3. Defects

### F-D1 · The empty band a gone notice leaves never collapses on the same screen; it stays until a new screen, a reload or the page hidden (BLOCKS, ruled by Vibei §3)

**Vibei's rule (`VB-DECISIONS-RESUME.md` §3, binding):** the band is "acceptable only if [it] collapses once touch/scroll goes idle, with no jump under an active pointer. If it stays until a reload (or until a new screen), it goes into F's fix round."

**Measured** (Lane I2 §2a, §2e, §2f; trial :5521; seed `veteran`; a 3 s notice raised at rest; a per-frame tracker of the target's top, the strip, `room`, `why`, `scrollY` and every commit with ms since the last input). Configs: 390×844 light @100 (touch), 390×844 dark @200 reduced (touch), 1440 light @100 (mouse), 1440 dark @200 reduced (mouse).

| Step | Room (band) on the trial |
|---|---|
| The notice leaves at rest | kept: 68 / 153.5 / 68 / 113 px; content moved 0 |
| Idle, sampled at 1, 5, 10 … **45 s** | **kept at every sample** |
| Scroll down and back (1440 wheel; phones a real finger drag to `scrollY` ≈ 300), then 0.3 / 1.3 / 2.5 / **6 s** idle | **kept at every sample**, 0 commits |
| Pointer held 3 s, released, 3 s idle | kept while down and after |
| Page hidden (emulated), then shown | → 0 (`why: hidden`); on return the content sits **68–153.5 px higher** than when the person left |
| A new screen (Stats and back) or a reload | → 0 |

The code agrees (§1): the room has no idle path. Two consequences:
- **The band hides content.** At 390×844 @100 the Create/Life chips stay hidden behind the docked start for as long as the person stays on Today (frame in §1).
- **The band can be taller than the notice that just left.** The room is the tallest notice that has left (`Math.max(ctl.room, …)`). Lane I2 §4d measured a **194 px** empty band at the phone sizes @200 on the combined trial, after a 3-line warning.

**What is right and must be kept:** the band itself (0 of 64 aimed taps off target, §2). Only its lifetime is the defect.

### F-D2 · The F-T2-8 wrap moves the session controls 17 px further below the fold at 200 % landscape (BLOCKS, worsened by this change)

**Where.** `src/screens/focus/FocusScreen.module.css`. Side by side, when the task and Rain + sound cannot share a line, Rain + sound take their own line.

**Measured** (Lane I2 §3a; `topbar2/topbar2-{base,trial}.json`, which I checked; running brew "Chapter 3 notes · Study", no notice):

| Config | Base: Add 5 / Pause / End top, visible px, panel overflow | Trial |
|---|---|---|
| 844×390 @100, 667×375 @100 | 248 / 239, wholly in view | **identical** |
| 844×390 @200, light and dark | 352, **38.5 px** visible, 41 | **369, 20.8 px** visible, 59 |
| 667×375 @200, light and dark | 352, **23.5 px** visible, 56 | **369, 5.8 px** visible, 74 |

**What I saw** (frames in §1):
- **Base:** the tops of the three control circles and their icons show at the bottom edge, so you can see the controls are there and tap their visible part.
- **Trial:** only slivers at 844×390, and only the circles' shadow at 667×375.

**Why it blocks.** The task label becoming readable is the right fix for F-T2-8 ("C / h / a.." on base). But the session controls (preserve list 6) are pushed further out of reach in the same state. They were already partly out of view on base (F-T2-2's class, a FOLLOW-UP "not worse than base"). This change makes that worse, and under the residual rule a worsening blocks. A trade between label and controls is Vibei's to rule, not mine.

### F-D3 · The Today status button's accessible name has a stray space before its punctuation (BLOCKS, introduced)

**Where.** `src/screens/home/StatusBar.tsx:35`:

> `<span className="sr-only">{mugState === 'atRisk' ? ', today not brewed yet' : ''}. Show details</span>`

The visible "N" and "days warm" are separate elements, so the name is computed with a space before the sr text.

**Measured** (Lane I2 §5a, the facts files' `status` field): the button reads **"3 days warm . Show details"** (newbie) and **"5 days warm , today not brewed yet. Show details"** (atRisk). The base read "3 days warm streak. Show details": removing "streak" left the separator behind a space.

**Required:** "N days warm. Show details", "1 day warm. Show details", "N days warm, today not brewed yet. Show details", with no space before "." or ",".

### C-1 · `tests/whistle.spec.ts:203` (F's) asserts G's old sentence (cross-owner; in F's fix round)

- **The cause.** G's approved fix (`7f95c18`, merged as `25b5e26`) replaced "A locked phone may hold the nudge until you’re back." with "…If Kettle is closed or your phone has paused it by then, no nudge comes."
- **The current state.** `whistle.spec.ts:203` (F's file) is red on the integration branch (`review/GATE.md`).
- **Required change:** the regex at `:203` becomes `/If Kettle is closed or your phone has paused it by then, no nudge comes\./`. Nothing else in the test changes.

## 4. Residuals (rule: BLOCKS = introduced or worsened by this change; FOLLOW-UP = present on the base and not worse, or ruled so by Vibei; ACCEPTED = not a defect)

| # | Item | My check | Class | Owner |
|---|---|---|---|---|
| F-D1 | The band never collapses on the same screen | §3 | **BLOCKS** (Vibei §3) | F (fix round) |
| F-D2 | Session controls 17 px further below the fold at 200 % landscape | §3 | **BLOCKS** (worsened) | F (fix round) |
| F-D3 | Status button name "3 days warm . Show details" | §3 | **BLOCKS** (introduced) | F (fix round) |
| C-1 | `whistle.spec.ts:203` asserts G's old sentence | §3 | **Cross-owner, in F's round** | F |
| F-R1 | **A notice arriving at rest still pushes content** 68–113 px (−16 / 0 where the strip is outside the content column), 22–31 ms after it is raised. A tap aimed just before lands on the notice: base 13/17, trial 12/16 | Lane I2 §1a E, §2b; the packet's F3 | **FOLLOW-UP** (pre-existing, not worse) | I10 design |
| F-R2 | **The "above" leave during a touch fling:** everything below the strip jumps up 153.5 px in one frame, with no compensation in that frame or the next 8, 460–630 ms after the finger lifts | Lane I2 §2g, every frame: **base identical** | **FOLLOW-UP** (pre-existing, not worse) | I10 |
| F-R3 | **The session `reach` close at rest** moves a partly visible control 45–107 px under a tap aimed just before (375×667 @100, 390×844 @200) | Lane I2 §3e: same px and landing on base | **FOLLOW-UP** (F-T2-2 class, not worse) | I10 / session area |
| F-R4 | **`notice-strip:275` at 1440 @200: 2 failures in 9 trial runs,** both the spec's own `press()` double-wheel race (Mark done −60.5 / −60.0 = one wheel step) | Lane I2 §1c. `press()` is the base's | **FOLLOW-UP** (test robustness). F may harden `press()` in the round (wait on real state; nothing loosened) | F tests |
| F-R5 | **The page hidden and shown again:** the band gives its room back while hidden, so the person returns to content 68–153.5 px higher | Nobody is aiming while the page is hidden. Lane I2 §2a (emulated hide) | **ACCEPTED** (not under a pointer; the fix round's idle rule will make it rare) | — |
| F-R6 | **Night line with no Tea Cozy:** "…Or rest. The kettle will be here tomorrow." does not say the run ends tonight | The glossary forbids loss framing; the status sheet states the rule once. True as far as it goes | **ACCEPTED** (design) | — |
| F-R7 | `w2-home:203` (Welcome fits at 375×667 @100) failed once in a 2-worker batch, 13 px over | Passes alone on trial and base (Lane I2 §4b); F changed nothing under `welcome/` | **FOLLOW-UP / UNKNOWN** (load) | Final regression |
| F-R8 | `w3-notices:252` ("the room … stays while the page is scrolled over it and back") failed once in Lane R's cut `full-C` on the combined trial | Passes alone on :5520 and :5521 (Lane I2 §4c). This test changes in the fix round anyway (F-D1) | **UNKNOWN** (load); rerun on the fix | F / final regression |
| F-R9 | **1440 rail for someone who never brewed:** "Warmest run 0" and "Tea Cozy in 7 days" | Base: "Best 0" and the same Cozy line | **FOLLOW-UP** (polish, not worse) | F / I13 |
| F-R10 | **The Tea Cozy cap of 2 is not stated** in "Every 7 warm days in a row earn a Tea Cozy…" | Shown only when 0 are held; true | **ACCEPTED** | — |
| F-R11 | **`done/summary.ts:65, 72` round minutes to nearest, while Stats now rounds down** (S) | A completed brew's `focusedMs` is its whole phase length, and the engine already floors `afterMin`, so the summary and Stats cannot differ for a completed brew. The summary is not shown after End | **ACCEPTED** (no visible difference); note for the final regression | — |
| F-R12 | `ui/Toast.module.css:75` uses the non-token `var(--focus, var(--sky))` | G's cross-owner note | **FOLLOW-UP** | F |
| F-R13 | `isInputPending` is Chromium-only | The fresh-frame check is the guard elsewhere (packet F4) | **ACCEPTED** | — |
| N-2 | The History Undo read races S's focus scroll when the tapped row takes focus (~110 px) | Cross-owner, `History.tsx` (S) | **FOLLOW-UP** | S |
| F-T2-2, N-3 | Session readout or controls pushed below the fold by a notice at 200 % on short screens; a long persistent notice on the tea break at landscape @200 | Unchanged; need a design ruling | **FOLLOW-UP** | Vibei / I10 |
| E-1 | **Evidence gaps,** not defects:<br>• real devices, WebKit, Firefox;<br>• the hidden page only emulated;<br>• smooth full-motion scrolling on the "above" path at 1440;<br>• the full chromium suite on F's trial (the combined run is Lane R's);<br>• the 194 px band's source notice inferred | — | Noted | Fix round / final regression |

## 5. Lane I2 receipt (`review/LI2/F/RECEIPT-LI2-F.md`), and my checks of it

**Read in full.** I checked each fact I rely on:
- **The band.** The receipt's account of when the room is given back (§2a) matches `decide()` line for line (§1). I opened the band frames at full size.
- **F-T2-8.** The top-bar numbers equal the raw JSON (`topbar2/*.json`), and I opened the four frames at 200 %.
- **The spec diff.** `git diff --stat 4d36939 e3b9eac` gives `notice-strip.spec.ts` +9 lines (§1d: +9 / −0).
- **Ownership.** My diff stat shows 19 files, all F's.

**The receipt's own limits** (its §7) are carried in §4 E-1. None of them bears on F-D1…F-D3.

## 6. Fix round (90 minutes, one round; F's files only)

**Where.** Work on `pe/w3-notices-polish` in `/home/user/wt/w5f`, from `5ee3e7c`. Commit locally and never push.

**The fix trial** is the integration branch, which now holds N (`3faaf94`), G (`25b5e26`) and the docs (`a859d86`), plus F's fix. The orchestrator builds it, so C-1 can be proven green there.

**Hand back** `contracts/W3R1/F-FIX-READY.md`, with evidence in `contracts/W3R1/F/fix/` (full-size PNGs, logs, probe JSON), giving:
- the new hash and the `kettle/src` tree hash;
- each check below with its result and paths.

**Files you may change:**
- `src/ui/Toast.tsx` (F-D1), plus `src/ui/moment.ts` only if the idle rule needs it;
- `src/screens/focus/FocusScreen.module.css` (F-D2);
- `src/screens/home/StatusBar.tsx` (F-D3);
- `tests/whistle.spec.ts` (C-1, line 203 only);
- your own specs: `tests/w3-notices*.spec.ts`, and `tests/notice-strip.spec.ts` (for `press()` hardening only, F-R4).

Nothing else.

### F-D1: the rule the band must follow (Vibei §3)
1. **When it goes.** A kept room is given back **on the same screen** once touch and scroll are idle. That means all of these hold, confirmed in a fresh frame:
   - no pointer down;
   - **no input of any kind for at least `QUIET_MS` (1.2 s)**: pointer, touch, wheel, key, **and `scroll` events**, so momentum and smooth scrolling count as activity;
   - at least `QUIET_MS` since the notice left;
   - no input pending.

   You may wait longer, but the room must be gone **no later than 4 s** after the later of the leave and the last input, while the page stays idle.
2. **When it must not go.** Never while a pointer is down, never during a scroll or fling, and never within 1.2 s of the leave or of any input.
3. **Out of view.** When the strip is above the view, the same rule applies, with the page kept still (`holdView`). Nothing in view moves.
4. **What stays as it is.**
   - The band itself: a notice leaving still moves nothing.
   - The next notice is still drawn in a room that is still there.
   - A new screen and the hidden page still give the room back.
   - The session panel's `reach` exception is unchanged.

### Acceptance checks (all must hold; I rerun the ones marked ◆)

1. **◆ Ownership and scope.** `git diff --stat 5ee3e7c <fix> -- kettle/` lists only the files above (plus packet and evidence).
2. **◆ F-D1, the band's lifetime.** Rerun Lane I2's idle probes on the fix trial, at 390×844 light @100, 390×844 dark @200 reduced, 1440 light @100 and 1440 dark @200 reduced (trial in the same table):
   - the probes are `/home/user/wt/w5tr-f/kettle/.tmp/LI2/LI2-idle.mjs`, plus `LI2-idle2.mjs` for a real finger drag on phones;
   - your own probe with the same tracker also counts.

   Report, per config:
   - **(a) No input after the leave:** room → 0 between 1.2 s and 4 s after the leave.
   - **(b) Scroll down and back** (wheel; finger drag), then idle: room kept during the scroll, 0 commits; room → 0 within 1.2–4 s after the last input.
   - **(c) Pointer held 3 s:** room kept while down; → 0 within 1.2–4 s after release.
   - **(d)** Every band commit with its ms since the last input (≥ 1200), the pointer state (up) and the visible move at the collapse (= the band's height, once, or 0 when above the view).
   - **(e) A touch fling** (`LI2-idle3.mjs`): no band commit while the page is still scrolling.

   Give full-size frames before the notice, with the band, and after the collapse.
3. **◆ F-T2-1 is kept.** Lane I2's aimed-tap probe (`LI2-probe.mjs` / `LI2-probe2.mjs`, L1 and L2), on the fix, at least at the 8 configurations where the base lands off target (390×844, 844×390, 1440 × 100/200): **0 taps off target, 0 px moved.**
4. **Specs.**
   - `w3-notices` passes, twice.
   - Its test "the room a gone notice keeps stays while the page is scrolled over it and back" becomes "…stays while the page is scrolled, and goes on the same screen once idle". It must still assert that nothing in view moves during the scroll.
   - A new test asserts that the room is gone on the same screen after idle, and was not given back while a pointer was held.
   - `notice-strip` 25/25, plus `:275` at 1440 light 200 % reduced ×3 and 1440 dark 200 % ×3. Paste the error context of any failure. You may harden `press()` to wait until the wheel's scroll has landed (`scrollY` stable across two frames) before its on-top check (F-R4); remove or loosen nothing.
   - `toast-room` 14/14, `a11y` 11/11, `summary-notice` 14/14, `break-reach` 17/17, `w2-home` 18/18 (R5-D1, LEAD-D1, R7-D1, D4, W2H-D1, T2-D1).
   - tsc; vitest.
5. **◆ F-D2.** At 844×390 and 667×375 @200, light and dark, a running brew "Chapter 3 notes · Study", no notice:
   - Add 5 / Pause / End **top ≤ the base's 352 px**, visible part ≥ 38.5 / 23.5 px;
   - the task label readable: whole words, no line holding a single letter;
   - at @100, identical to base (one line; controls at 248 / 239).
   - Frames: BEFORE (base) / trial / AFTER at full size.

   **Alternatives that also close F-D2:**
   - restore the base's top bar (the F-T2-8 block in `FocusScreen.module.css` identical to `4d36939`), in which case F-T2-8 returns to FOLLOW-UP;
   - or a ruling from Vibei, relayed by the orchestrator, that the trade (readable label for controls 17 px lower) is accepted.
6. **◆ F-D3.** The status button's accessible name is exactly:
   - "23 days warm. Show details" (veteran, today brewed);
   - "1 day warm. Show details";
   - "5 days warm, today not brewed yet. Show details" (atRisk).

   A spec asserts these with `toHaveAccessibleName`. The visible pill is unchanged.
7. **◆ C-1.** `whistle.spec.ts:203` reads `/If Kettle is closed or your phone has paused it by then, no nudge comes\./`. `whistle.spec.ts` is 8/8 on the fix trial (integration with G + F's fix).
8. **Preserve list and wording.** No visible, sr, `title` or `aria-*` "streak" in F's files; the glossary as now. Nothing else in the copy changes.

## 7. BEFORE / AFTER for Vibei (full size)

**REFERENCE:** K01 `kettle/.tmp/pkg/kettle-excellence-integrated/VISUAL_BENCHMARK_LIBRARY/assets/current/01-home.png`.

**Today in each return state** (the maker's, base :5478 → trial src `0acce1a`), in `/home/user/wt/w5f/kettle/review/product-excellence/contracts/W3R1/F/shots/{before,after}/<w>x<h>-<theme>-t<100|200>/`:
- `today-{blank,newbie,veteran,atRisk,missed-cozy,missed-nocozy}.png`;
- `sheet-warm-{atRisk,missed-cozy}.png`;
- `end-sheet.png`;
- `today-after-end-gone.png` (the band).

**The 1440 rail and Today** (Lane I2's AFTER): `contracts/W3R1/review/LI2/F/shots/{before,after}/1440x900-{light,dark}-t{100,200}/{today,rail}-*.png`.

**The band (F-D1):** `contracts/W3R1/review/LI2/F/idle/trial/<cfg>-{0-no-notice,1-notice,2-band-at-leave,3-band-after-45s-idle,4-band-after-scroll-and-6s-idle}.png`.

**The session top bar at 200 % landscape (F-T2-8 / F-D2):** `contracts/W3R1/review/LI2/F/topbar2/{base,trial}-{844x390,667x375}-{light,dark}-t200-session-running.png`.

## 8. Fix round: `pe/w3-notices-polish@11a7ac6` (final code `58d1b88` + spec `cbc88ac`; kettle/src `27d83ac`)

| | |
|---|---|
| Fix trial | `1358e00` = integration `8af9fcb` (N + G + S + X-2 merged) + `11a7ac6`; worktree `/home/user/wt/w5tr-f2`; dev :5528 (all my fix runs), preview :5538. Its src tree is `d533342` (it includes N, G and S); F's own src is `27d83ac` (`git rev-parse 11a7ac6:kettle/src` = `58d1b88:kettle/src`, checked) |
| Timing | Handed back ≈19:31 UTC, inside the 18:16–19:46 window |
| Packet | `/home/user/wt/w5f/kettle/review/product-excellence/contracts/W3R1/F-FIX-READY.md`; evidence `…/W3R1/F/fix/` |
| BEFORE | F trial `e3b9eac` :5521. Base :5478 |
| My evidence | `contracts/W3R1/review/LEAD/F/fix/`:<br>• `chainA.sh` (Lane I2's aimed-tap and fling probes, read-only from `/home/user/wt/w5tr-f/kettle/.tmp/LI2/`, against :5528; then X-8);<br>• `chainB.sh` (specs on :5528);<br>• `lead-x8.mjs`;<br>• outputs `probes2/`, `idle3/`, `x8/`, `*.log` (committed as `.log.txt`) |

### ◆1 · Scope
`git diff --stat 5ee3e7c 11a7ac6 -- kettle/src kettle/tests` lists exactly §6's files:
- `ui/Toast.tsx` (+60 / −15);
- `focus/FocusScreen.module.css` (−10);
- `home/StatusBar.tsx`;
- `tests/whistle.spec.ts` (line 203 only);
- `tests/notice-strip.spec.ts` (`press()` only, +17);
- `tests/w3-notices.spec.ts`;
- the new `tests/w3-notices-idle.spec.ts`.

`moment.ts` is unchanged. **PASS.**

### The code (read in full)
**F-D1 (`Toast.tsx`, `decide()`).** A kept room is given back on the same screen when all of these hold:
- `now − roomLeftAt ≥ QUIET_MS`;
- `atRest(now)`: no pointer down, and no input of any kind for `QUIET_MS`. `moment.ts` stamps pointer, click, wheel, touch, key and `scroll` (capture), so momentum counts;
- `!inputPending()`;
- confirmation in a fresh frame.

Then it commits `room: 0`:
- **in view**, with `holdTop` (the band closes once);
- **above the view**, with `holdBelow`, a new helper: the strip's next sibling is kept still, so nothing in view moves.

Two further changes:
- **A notice leaving above the view** now keeps its room (`keepAbove`), so a mid-fling leave changes no height. Any other above-view change waits for rest, confirmed in a fresh frame.
- **`roomLeftAt`** is stamped when a room is kept with no next notice.

What stays as before: the band itself, the next notice drawn in the room, `ENTRY_MS`, the hidden page, and `reach` (no room where the notice holds the panel's controls past its edge). The old `reach` give-back at rest is now the general idle rule, which is stricter: it adds `QUIET_MS` since the leave.

**F-D2.** `git diff 4d36939 11a7ac6 -- kettle/src/screens/focus/FocusScreen.module.css` is **empty**. The base's top bar is restored (the first alternative in §6), so the controls are where base puts them, and **F-T2-8 returns to FOLLOW-UP**.

**F-D3 (`StatusBar.tsx`).** The button carries `aria-label={`${n} ${n === 1 ? 'day' : 'days'} warm${atRisk ? ', today not brewed yet' : ''}. Show details`}`, and the sr span is removed. The visible pill is unchanged, and the name contains the visible text (label-in-name).

**C-1.** `whistle.spec.ts:203` now reads `/If Kettle is closed or your phone has paused it by then, no nudge comes\./`. No other line changed.

**`press()` (F-R4).** After each wheel it waits until the element's top and `scrollY` are unchanged across two frames (at most 1.5 s), before the existing on-top check. Nothing is removed or loosened.

### ◆2 · F-D1, the band's lifetime, on the final code (:5528)
I ran `w3-notices.spec.ts` + `w3-notices-idle.spec.ts` `--repeat-each=2` from the fix trial's worktree, through the slot gate (`fix/w3-notices-idle-x2.log`): **42/42 passed.** The band-lifetime spec asserts §6's rule directly (`w3-notices-idle.spec.ts:147–159`), at 390×844 light @100, 390×844 dark @200 reduced, 1440 light @100 and 1440 dark @200 reduced, for (a) no input, (b) scroll then idle and (c) pointer held. Per run it asserts:
- exactly one collapse, and no other strip commit between the leave and it;
- the pointer up at the collapse;
- ≥ 1200 ms since the last input of any kind, and ≥ 1200 ms after the leave;
- ≤ 4000 ms after the later of the two;
- the room kept during the scroll and while the pointer is down;
- the same screen (`#/`).

Together with `w3-notices`' pointer-held test (1440 @100) and the scroll test (390×844 @200), that is 15 cases × 2 on the merged tree. The maker's own numbers (collapse 1.25–1.33 s; one commit; visible move = the band, once) agree.

**The touch fling, my run** (`fix/idle3-above.log`, `fix/idle3/idle3-LEADFIX-above-390x844.json`; Lane I2's `LI2-idle3.mjs`, 390×844 light @200, a 600 px finger drag released into momentum), both reps:
- the notice whose time ran out mid-fling leaves **keeping its 153.5 px room** (`why: above`, 482 / 514 ms after `pointercancel`). The frames around it move only by the fling's own 12 px per frame;
- the band goes **1326 / 1359 ms after the last input** (`touchend`), in one frame with the page scrolled −153 px: **visible move −0.5 px** (rounding);
- no band commit while the page was still scrolling.

On the round-1 trial and on base, the same probe showed everything in view jump 153.5 px mid-fling (Lane I2 §2g, F-R2), so F-R2 is now fixed as well.

**PASS.**

### ◆3 · F-T2-1 kept, on the final code
I ran Lane I2's `LI2-probe2.mjs` (L1, L2) against :5528 (`fix/probes2/probe2-LEADFIX.json`, `fix/probes2.log`): 16 configurations (390×844, 375×667, 844×390, 1440×900 × @100/@200 × light/dark, reduced motion on and off), pointerdown and click. **64 events, 0 off target, 0 px moved** (max move in the window 0). Every leave was `why: rest` with its room kept (68 / 113 / 56.5 / 137.5 px). In 3 L2 runs (1440) the notice had not yet left in the tap's window.

This was asked for because the maker's 0/64 ran on `1130a13`, before the two above-view commits. It now holds on the final code. **PASS.**

### ◆5 · F-D2
The base's top bar is restored (code check above). The maker's `LI2-topbar2.mjs` on its fix and base (`F/fix/topbar2/`) shows the controls at the base's 352 px, visible 38.5 / 23.5 px. With the CSS byte-identical to `4d36939`, nothing else is possible. **PASS** (closed by the first alternative). F-T2-8 is a FOLLOW-UP again.

### ◆6 · F-D3
`w3-notices` "the status bar warm-days button is named …" passed in both of my runs, asserting with `toHaveAccessibleName`:
- "23 days warm. Show details";
- "5 days warm, today not brewed yet. Show details";
- "1 day warm. Show details".

**PASS.**

### ◆7 · C-1
`whistle.spec.ts` on :5528 (integration with G + F's fix; `fix/whistle.log`): **8/8 passed**, including `:183` / line 203 on G's sentence. **PASS.** C-1 is closed, and `whistle.spec.ts` is green on the tree that will merge.

### X-3 (cross-effects) · `w3-notices` ×2
42/42 above, including "the room a gone notice keeps stays while the page is scrolled, and goes on the same screen once idle (390×844, 200 %)" twice. **Closed.**

### X-8 (cross-effects) · the "Paused" pill at 375×667
`lead-x8.mjs`, the same steps as Lane R's capture state 04 (375×667@2 light, veteran, a brew, +12.5 min, pause), 3 runs each, base :5478 against the fix :5528 (`fix/x8/`), measured from the saved frames' pixels:
- the pill's text rows are **702–721 device px on both builds in all 6 runs**;
- the pill box has **0 differing pixels**, base against fix, in each run pair;
- the controls' tops are 502.7 css px on both.

Lane R's 4 px (703–721 → 711–730) does not reproduce, so it was a capture-timing artifact. **ACCEPTED (not a defect); closed.**

### ◆4 · `notice-strip:292` (formerly `:275`) at 1440 @200, on the final code, and my ruling on the 2/3

**My runs on :5528** (`--repeat-each=3 --workers=1`, through the gate, load average about 1–4):
- **1440×900 dark 200 %: 3/3** (`fix/ns292-1440-dark-200-x3.log`).
- **1440×900 light 200 % reduced motion: 2/3** (`fix/ns292-1440-light-200-rm-x3.log`). Run 1 failed at **Mark done** after 17.5 s; the error context is copied to `fix/failure-context/ns292-1440-light-200-rm-x3-run1-error-context.md`. The state at the failure:
  - the tap was aimed at Mark done's top 685.2 and landed on the tag group; Mark done was at **625.2 (−60.0 px)**;
  - `scrollY` was **120**: two 60 px wheel steps where one had brought Mark done on top;
  - **the strip had not changed since the screen arrived**: `why: screen`, version 12, room 0, "Saved 3 minutes of focus" still shown with 2,000 ms left. Nothing in the app moved anything.

**The maker's runs** (`F/fix/ns275-1440-light-200-reduced-x3{,-run2}.log`, `F/fix/failure-context/`, read):
- **Run A, 2/3:** #1 lost its brew ("Kettle’s off", "Saved…" never drawn), which fits the reported restart of :5501. I could not verify the restart time from the server log, which `start.sh` overwrites on start. Not counted either way.
- **Run B, 2/3:** #1 failed later, at the History step: "the Undo is the deleted row … on screen where the person saw the row", 111 px. **This is N-2:** S's `History.tsx` focus scroll when the tapped row takes focus, pre-existing since T2 (W2R3 §7). Mark done had passed.
- **Inside the full 25:** passed (src `8b42b9b`).

**Mechanism of the Mark done failure.** It is the one Lane I2 described in round 1 (§2, F-R4).
- `press()` wheels, waits 120 ms, now waits until the element and `scrollY` are still across two frames, then checks on-top.
- A wheel event the browser has received but not yet handed to the page leaves both still, so that wait cannot see it.
- Under load, the first wheel therefore lands only after the second has been sent, and the second lands before the click.

The hardening narrowed this (the dark config went from 2/3 to 3/3, and Mark done failed once in my 6 and once in the maker's 9), but it did not remove it.

**Ruling: not an F defect; F-R4 stays a FOLLOW-UP, with a test-only action before the final regression.**
- **What F-D1 must keep, and does.** No tap moves because a notice leaves. Proven on the final code by 64 aimed events with 0 off target, and by this failure's own state (the strip unchanged).
- **Neither failure cause is introduced or worsened by F.** `press()`'s wheel race is the base spec's own; N-2 is in S's file and pre-existing. Under the residual rule neither blocks.
- **What §6 asked.** It asked for the ×3 runs with the error context of any failure, and allowed `press()` hardening "nothing loosened". The maker did both; the 3/3 is not met only for these two causes.
- **The test-only action (X-11).** The flaky step stays in the suite that will merge, so before the final regression the orchestrator assigns a test-only change in `tests/notice-strip.spec.ts` (F's file; F's fix round is spent), nothing loosened:
  - in `press()`, after each wheel, wait until `scrollY` (or the scroller's `scrollTop`) has actually changed from its value before the wheel, or the end of the scroll is reached, before the stillness and on-top checks;
  - in the History step, read "where the person saw the row" once the Edit sheet is open and its focus scroll has settled (N-2).

  I check it with `:292` at 1440 light @200 reduced `--repeat-each=6`: **6/6**. Until then the final regression records `:292` at that config as **known flaky (X-11)**, with the error context of any failure checked against these two signatures.

### ◆4 · The suites, on the final code (my runs, :5528, `--workers=1`, through the gate)

| Suite | Result | Log |
|---|---|---|
| `notice-strip.spec.ts`, all 25 configurations (including 1440 light 200 % reduced and 1440 dark 200 %, once each) | **25/25** (25.5 min) | `fix/notice-strip-all.log` |
| `toast-room` 14, `a11y` 11, `summary-notice` 14, `break-reach` 17, `w2-home` 18 (R5-D1, LEAD-D1, R7-D1, D4, W2H-D1, T2-D1) | **74/74** (27.9 min) | `fix/owned-specs.log` |
| `w3-notices` + `w3-notices-idle` ×2 | **42/42** | `fix/w3-notices-idle-x2.log` |
| `whistle` | **8/8** | `fix/whistle.log` |
| `notice-strip:292` 1440 dark 200 % ×3 / light 200 % reduced ×3 | 3/3 / 2/3 (ruled above) | `fix/ns292-*.log` |

The maker's own: tsc 0; vitest 297/297 on the branch (302/302 on the trial, the orchestrator's gate).

**Why I ran the full suites myself.** The maker's 25/25 and 81/82 ran one code commit before the final one (`58d1b88` changes the above-view give-back, which `notice-strip` and `toast-room` exercise; `toast-room:192` caught the round-1 above-view problem). On the final code both are clean.

### One more finding while reading the server logs (F-R14)
The dev servers log React's **"change in the order of Hooks called by NoticeStrip"**:
- base `dev-w4final.log` 57 times, round-1 trial 54, combined 101, fix trial 2.

The cause is `ui/Toast.tsx` `NoticeStrip`: `const leaving = useContext(Leaving) || !useIsPresent() || off;`. That short-circuits a hook (`useIsPresent` is skipped once `Leaving` is true), and the line is **identical on base** (`4d36939` `Toast.tsx:349`). Pre-existing and not worsened; it has caused no failure seen this round. **FOLLOW-UP** (F's file): call both hooks unconditionally.

### Final residuals (rule: BLOCKS = introduced or worsened by this change; FOLLOW-UP = present on the base and not worse, or ruled so by Vibei; ACCEPTED = not a defect)

| # | Item | Class |
|---|---|---|
| F-D1 | The band never collapsed on the same screen | **Closed:** it goes 1.2–1.4 s after the later of the leave and the last input, never under a pointer or mid-scroll (◆2) |
| F-D2 | The F-T2-8 wrap pushed the session controls down | **Closed:** reverted, byte-identical to base (◆5) |
| F-D3 | Stray space in the status button's name | **Closed** (◆6) |
| C-1 | `whistle.spec.ts:203` | **Closed:** 8/8 on the trial with G (◆7) |
| F-R2 | The "above" leave mid-fling jumped content 153.5 px (pre-existing) | **Closed** by the fix: −0.5 px |
| F-R4 / X-11 | `notice-strip:292` at 1440 light 200 % reduced: the spec's own wheel race (1 in 6 mine, 1 in 9 the maker's), plus N-2 (S's `History.tsx` focus scroll) | **FOLLOW-UP:** test-only action before the final regression (ruling above) |
| F-T2-8 | Landscape session top bar squeezes the task label at 200 % | **FOLLOW-UP** again (the base's bar restored) |
| F-R1 | A notice arriving at rest still pushes content (F3) | **FOLLOW-UP** (pre-existing, not worse) |
| F-R3 | The session `reach` close moves a partly visible control (same as base) | **FOLLOW-UP** (F-T2-2 class) |
| F-R14 | Conditional hook in `NoticeStrip` (React hooks-order error in the dev logs, base too) | **FOLLOW-UP** (pre-existing) |
| F-R5…F-R13, N-2, F-T2-2, N-3, E-1 | As in §4 (F-R7: `w2-home` 18/18 here; F-R8 = X-3: closed) | Unchanged |
| X-3, X-8 (cross-effects) | `w3-notices` room test; the "Paused" pill | **Closed** (42/42; 0 px against base) |

No item is introduced or worsened by this change in a way that is a defect, so nothing BLOCKS. The narrow transient-artifact exception is not used: the 2/3 is ruled by cause above, not as a transient.

**BEFORE / AFTER for the fix** (full size):
- **The band:** the maker's `/home/user/wt/w5f/kettle/review/product-excellence/contracts/W3R1/F/fix/final2/w3b/**/<cfg>-<case>-{1-band,2-after-collapse}.png` and `F/fix/idle/<cfg>-{0-no-notice,2-band-at-leave,3-band-after-45s-idle}.png`. Frame 3 now shows the page closed up.
- **The fling:** `contracts/W3R1/review/LEAD/F/fix/idle3/390x844-light-t200-above-r{0,1}-after.png`.
- **The top bar:** `F/fix/topbar2/{fix,base}-*-session-running.png` (identical).
- **X-8:** `contracts/W3R1/review/LEAD/F/fix/x8/{BASE,FIX}-375x667-light-paused-r{1,2,3}.png`.

*Run logs:* `kettle/.gitignore:6` ignores `*.log`, so every `.log` cited here is committed as a `.log.txt` copy beside it (same name plus `.txt`).

## Follow-up: band idle 4 s (Vibei item 2)

**Vibei's ruling** (`VB-DECISIONS-FINAL.md` item 2):
- raise the kept band's idle wait from 1.2 s to **4 s**;
- do not give the room back "in answer to the next tap";
- LEAD-5 verifies the 64-tap aimed-tap check and the notice suite on the result.

| | |
|---|---|
| Under review | Maker Q, Phase A: `pe/w3r1-stability@04b1ad9` (code `61aec4b`; kettle/src `db6de7e`, checked: `04b1ad9:kettle/src` = `61aec4b:kettle/src`) |
| Trial | `cf4a89c` = integration (final `2be3de1`) + `04b1ad9`; worktree `/home/user/wt/w5tr-qa`; dev :5546 (all my runs) |
| Packet | `/home/user/wt/w5q/kettle/review/product-excellence/contracts/W3R1/Q-READY.md` (Phase A); logs `…/W3R1/Q/A/` |
| My evidence | `contracts/W3R1/review/LEAD/F/band4s/` (`chainA.sh`, `chainB.sh`, `probes2/`, logs as `.log.txt`) |

### Scope and diff (read in full)
`git diff --stat a2b00cd 04b1ad9 -- kettle/src kettle/tests` lists four files: `src/ui/moment.ts`, `src/ui/Toast.tsx`, `tests/w3-notices-idle.spec.ts` and `tests/w3-notices.spec.ts` (+42 / −32).

**`moment.ts`:**
- adds `BAND_IDLE_MS = 4000`;
- `atRest(now, quiet = QUIET_MS)` gets an optional threshold. The default is unchanged, so every existing caller behaves exactly as before;
- `QUIET_MS` stays 1200, so a notice leaving or arriving at rest, other above-view changes and InlineUndo are unaffected.

**`Toast.tsx`:** only the kept band's give-back branch changes, to `now − roomLeftAt ≥ BAND_IDLE_MS && atRest(now, BAND_IDLE_MS) && !inputPending()`, still confirmed in a fresh frame. It covers both the in-view `idle` collapse and the above-view one (page kept still). No give-back on the next tap was added (Vibei). The unused `QUIET_MS` import is dropped.

**The tests are tightened, not loosened.**
- The band commit must now be ≥ **4000** ms since the last input of any kind and ≥ 4000 ms after the leave (was 1200).
- The upper bound becomes 6500 ms after the later of the two. It was 4000 for a 1200 ms rule, a 2.8 s margin; it is now 2.5 s.
- The pointer-held test: ≥ 4000 after the last input, ≤ 6500 after release.
- Poll timeouts are raised to match (8 → 12 s, 6/8 → 10/12 s); they are bounds, not assertions.
- Everything else stays: one collapse, no other strip commit, pointer up, same screen, room kept during the scroll and while held, and nothing moving when the notice leaves.

### My checks on :5546 (through the gate, one slot, sharing the machine with Maker Q's Phase B; load average 5–8)

**1. The 64-tap aimed-tap check** (Lane I2's `LI2-probe2.mjs`, L1 and L2, run read-only against :5546; `band4s/probes2/probe2-LEADQA.json`, `band4s/probes2.log`):
- **64 events across 16 configurations, 0 off target.** Every pointerdown moved 0 px. One click moved 0.4 px, sub-pixel and on target (1440 dark @200, L1).
- Every leave was `why: rest` with its room kept (56.5 / 68 / 113 / 137.5 px). In 2 L2 runs the notice had not yet left in the tap's window.

**PASS**, unchanged from the 1.2 s code (§8 ◆3).

**2. The band's lifetime and the notice specs:** `w3-notices` + `w3-notices-idle` `--repeat-each=2` (`band4s/w3-notices-idle-x2.log`): **42/42 passed** (9.1 min). From the 24 band-lifetime cases' facts:
- the collapse came **4026–4121 ms after the later of the leave and the last input**, and 4037–7713 ms after the leave;
- one collapse per case, with the pointer up;
- the visible move at the collapse is the band itself (68 or 113 px), once.

The aimed tap on Mark done (5 configs), the scroll test, the pointer-held test (≥ 4 s after the last input, ≤ 6.5 s after release), the new-screen test and the accessible-name test all passed twice. **PASS.**
