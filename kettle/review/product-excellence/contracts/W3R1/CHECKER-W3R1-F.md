# CHECKER W3R1 · Maker F: notices polish (F-T2-1), triage, warm-days wording, I13

**Verdict: REJECT** `pe/w3-notices-polish@5ee3e7c` (code `9f30a9b`, kettle/src `0acce1a`), as gated in trial `e3b9eac`. There is one 90-minute fix round. After it, the verdict is final.

**Defects** (§3; the fix-round packet is §6):
- **F-D1 (Vibei §3):** the empty band a gone notice leaves **never collapses while the screen stays open**. It stays until a new screen, a reload or the page hidden. Vibei ruled this into F's fix round.
- **F-D2:** the F-T2-8 wrap pushes the session controls **17 px further below the fold** at 200 % landscape:
  - 844×390: visible part 38.5 → 20.8 px;
  - 667×375: 23.5 → 5.8 px.
- **F-D3:** the Today status button's accessible name gained a stray space before its punctuation: "3 days warm . Show details", "5 days warm , today not brewed yet. Show details".
- **C-1** (cross-owner, now in F's file): `tests/whistle.spec.ts:203` must assert G's new key sentence.

**The rest verifies (§2):**
- **F-T2-1's tap safety:** base 50 of 66 aimed taps landed off target, trial 0 of 64.
- **The rest of the triage:** N-1, plus the F-T2-2 / N-2 / N-3 reasoning.
- **Wording and I13:** the warm-days glossary in F's files; I13's return copy; End's honest line; badge wording only in `progress/`.
- **The T2 invariant specs.**

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
