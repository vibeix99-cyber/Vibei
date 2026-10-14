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
