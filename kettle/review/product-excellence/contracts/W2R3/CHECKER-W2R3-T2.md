# CHECKER W2R3 · Maker T2: I10, notices without overlays

**Final verdict: APPROVE** `pe/w2r3-notices@64f29cd` (code `40f92b6`, kettle/src `aa88587`), as merged in fix trial `99d9368` (integration `8af5430` + `64f29cd`, src `5cd9a44`). Final: the one fix round is spent. Any change to the branch after this invalidates it.

**History.**
- **First review:** REJECT `6a64fbf` (§1–§4). One blocker, T2-D1: a notice on the summary pushed P's sheet down.
- **Fix round (§6, Vibei's direction):** T2-D1 is closed. My own runs, Lane T's 124 summary runs and Lane R's suites agree.
- **Final classification:** §7 gives every residual under the residual rule; nothing BLOCKS. §8 lists the BEFORE/AFTER pairs for Vibei.

| | |
|---|---|
| Lead checker | LEAD-3. I implemented none of this work |
| Revision | `pe/w2r3-notices@6a64fbf` (packet), code `61b463c`. `git rev-parse 6a64fbf:kettle/src` = `61b463c:kettle/src` = `5aa6228…` |
| Trial | `490ca97` = integration `f1f059c` (with B) + `6a64fbf`; worktree `/home/user/wt/w4tr-t2`; kettle/src `62672e1`; dev :5476 (debug API; all my runs), preview :5486 |
| Base / control | `61aba17`; dev :5470 (my control runs), preview :5480 |
| Packet | `/home/user/wt/w4t2/kettle/review/product-excellence/contracts/W2R3/T2-READY-FOR-REVIEW.md`; evidence `…/W2R3/T2/` |
| My evidence | `contracts/W2R3/review/LEAD/T2/`: `runs/*.json` (trial), `base/*.json` (base), `shots/` and `base/*.png` (frames), `t2-lead.mjs` (probe), `t2-chain.sh` (slot-gated runner) |

## 1. What I did

### Read
- The packet and the gate.
- The full src/tests diff `f1f059c..490ca97` (28 files): `ui/Toast.tsx` (rewritten), `ui/moment.ts`, `ui/InlineUndo.tsx`, `Composer.tsx`, `HomeScreen.tsx`, `FocusScreen.tsx`, `History.tsx`, `DataSection.tsx`, `Shell`, `App`, `Sheet.tsx`, and the test diffs.
- The test diffs weaken nothing:
  - The a11y home exemption is removed, which is stricter.
  - The swaps `[data-toast-above]` → `[data-session-controls]` / `[data-focus-view] footer` target the same boxes.
  - The waits are on real state.
  - `integrity:1090` now waits for End's own notice to have gone before its banner part. The test's subject (the banner) is kept. The strip's own at-rest exit, which this precondition sidesteps, is judged separately (§4, F-T2-1).
- Ownership: every changed file is in T2's set. No change to `SaveWarning*`, `scene/**`, `screens/done/**`, `focus/stage/**`, `public/**` or `badges.ts`.

### My own probe
`t2-lead.mjs`: one browser per run through the slot gate; real taps, wheel and touch; the debug API only seeds, fast-forwards and raises notices that have no button.

Per animation frame, while a notice (strip item or inline Undo row) is drawn and no sheet is open, it records:
1. **Hit-tests both ways:**
   - 7×3 points on each notice: is anything else on top of it?
   - 9 points on every control, text or row in view: is a notice on top of it?
2. **Box intersection** with the same set (a second, geometric measure).
3. **Every height change** of a strip or Undo row, with my own record of input (pointer down, ms since any input, ms since the last tap). This is independent of `moment.ts`, and I audit each change against the four safe moments.

### Opened at full size
**References:**
- K01 `01-home.png`;
- K02 `07-summary.png`;
- K03 `11-summary-unlock.png`.

**Maker's triples:**
- `T2/triples/K01-{1,2,3}`;
- `K02-{1,2,3}-task`.

**Maker's BEFORE / AFTER** (`T2/shots/{before,after}/`):
- `390x844-light-t100/{03-today-after-end-0.6s, 06-break-over-0.6s, 11-mark-done-undo}`;
- `after/…/{12-history-delete-undo, 13-import-undo}`;
- `1440x900-light-t100/03-…`;
- `844x390-light-t200/06-…`.

**Mine:**
- the summary frames in §3;
- `running-none-375x667-light-200-{0,1}`.

## 2. What verifies (kept for the fix round)

| Item | My result |
|---|---|
| **Invariant, no overlap** | 0 cover samples by hit-test, 0 by geometry, 0 notices with anything over them, in every run: End → Today at 390×844 @100, 844×390 @200, 667×375 @100; Break's over (Monday) at 375×667 @100 and 390×844 dark @200; Ambience at 844×390 @200 and 667×375 dark @200; History delete at 390×844 @100 and 375×667 @200; the queue; a break ending while Stats is being scrolled; the summary with a notice at 390×844 and 375×667 dark |
| **W2H-D1** | **390×844 @100:** Mark done is on top 9/9 at +0.75 s after End, and a real tap crosses it off. Its Undo row is drawn at the same top (556 → 556), Undo 43×44, 9/9; a real Undo tap puts "Chapter 3 notes" back.<br>**667×375 @100 and 844×390 @200:** the carried row's top at the pointerdown equals the Undo row's top (100.75 → 100.75; 21.6 → 21.6). The Undo is on top (80×44 at 200 %) and Undo restores the task. The Undo button sits higher than Mark done did only because the shorter message wraps onto fewer lines.<br>No dialog or inert frame on Today after End in any run. Brew length sits in the docked start (K01 AFTER, maker's triple).<br>My harness could not complete End at 375×667 @200 or 1440×900 @200: its strict 9-point checks fail on the tall docked start and the panel edge, before End opens. Those rows rest on the maker's matrix and Lane T |
| **Inline Undo, History** | The Undo row is drawn where the row was once the sheet closes (644 → 644), 9/9 (62×36); Undo brings the row back. The 110 px move I first measured happened earlier: the tapped row took focus as the Edit sheet opened (scrollY 2500 → 2610, `historytrace` run). That is the base's focus scroll, which T2 did not change |
| **(c) Ambience** (844×390 @200, 667×375 dark @200) | Notices sit under the sheet (not on top at their middle); Close, Turn on and Done on top; the queue resumes after Close |
| **Queue / update prompt** (390×844) | One notice at a time; the update prompt steps aside for two timed notices and comes back after them; Update is 72×36 and on top, and a real tap runs its action |
| **Break's over** (Monday, f) | The recipe notice heads the panel; the panel was wheeled to its end and back, then "Put the kettle on" was tapped for real and the next brew started (375×667 @100; 390×844 dark @200 needed a programmatic scroll in my harness, recorded) |
| **Moments** | Every strip or Undo-row height change in every run is at a new screen, out of view (`above`, with scroll compensation), as the answer to a tap, or at rest (≥ 1.2 s without input, no pointer down). My own input record agrees; 0 violations. While a person keeps scrolling Stats through a break's end, the strip changes only above the view; the notices wait with their clocks stopped |
| **Visual** | K01: H's Brew length in the dock, every length in view. K02 without a notice: identical to BEFORE. Today, Break's over (portrait and landscape @200) and the three Undo rows: the notice is whole, in flow, and covers nothing; the BEFORE frames show the floating covers this round removes (Break's over text, End sheet frozen over Today at 1440, Today's tags/field) |

## 3. Defect

### T2-D1 · A notice on the summary pushes P's summary sheet down: a gap opens under the counter, the highlight and task rows start under the footer, and at 200 % the summary leaves the screen (BLOCKS, introduced)

**Where.** `FocusScreen.tsx` puts the summary's strip at the head of the summary layer, above `summaryFill`, so a notice there moves P's whole sheet down by its own height (`summaryNotices`). P's `Summary.tsx` is unchanged.

**When it happens.** Mostly with the update prompt.
- `ShellOverlays.tsx` holds the prompt back while the timer runs (`busy = status !== 'idle'`), and the timer goes idle the moment a brew completes. So a pending update arrives with the summary's first frame.
- With default settings (`autoStartBreaks: true`) it stays for the 10 s Tea time countdown. With auto-breaks off, it stays for the whole summary.
- After every deploy, this is where users with the app open first meet it. Any other notice on the summary does the same for its duration (e.g. "Couldn't save just now. Your summary is still here.").

**Measured** (my runs; the update prompt raised in the same task as the finish, i.e. with the summary's first frame; the same flow on base dev :5470):

| Config | Base `61aba17` | T2 trial |
|---|---|---|
| 375×667 light @100 | Sheet top 284; the prompt floats over Done / Carry forward (the cover this round removes) | Sheet top **359** (+75); a blank band between the counter and the sheet; **Done / Carry forward at 514–558 straddle the footer (529)** |
| 390×844 light @100 | Sheet top 382; the prompt over the lower part of the unlock card | Sheet top **457** (+75); blank band; **the unlock card ("Fairy lights is in your nook") cut by the footer** on arrival: P's single highlight is not whole |
| 375×667 light @200 | Sheet top 285; the prompt (≈150 px) floats over the sheet's heading and first rows | Sheet top **453** with the footer at 475: **the sheet is pushed under the footer, so "25 minutes brewed" is not on screen**. A ~140 px empty band; the prompt (10–160) **lies over Chai's head and the kettle's lid** |
| 390×844 dark @100, 667×375 @100 | — | Same: the band and the cut unlock card (390 dark); in landscape the summary card's content below the heading is pushed under the footer |

**Frames:**
- `review/LEAD/T2/shots/summaryarrive-update-{375x667,390x844}-light-100-arrival.png` against `review/LEAD/T2/base/summaryarrive-update-{375x667,390x844}-light-100-arrival.png`;
- `shots/summarynotice-update-375x667-light-200-1-notice.png` against `…-0-arrival.png`;
- `shots/summarynotice-update-390x844-dark-100-1-notice.png`, `…-667x375-light-100-1-notice.png`;
- `shots/summarynotice-390x844-light-100-1-notice.png` (a timed warning).

**Why it blocks.** It breaks P's approved summary on arrival, which this round must preserve:
- No line starts under the footer on arrival (Wave-1 #1).
- The one highlight is seen whole on arrival.
- Chai's and the kettle's boxes stay clear.
- The sheet rises over the counter with no gap (K02/K03).

At 200 % both builds leave none of the summary readable (the base covers it, T2 pushes it off). T2 adds the gap and a prompt over Chai and the kettle, which the base drew over the sheet instead.

The base's cover was the defect to remove. T2 replaces it with different defects in the same state: the gap, the highlight or task row cut at the fold, and Chai and the kettle covered. These are introduced, not the base's defect carried over. The invariant spec does not see them: nothing overlaps, everything is pushed.

**Required correction** (T2's files only: `src/app/**`, `src/screens/focus/**` except `stage/**`, `src/ui/**`; P's `Summary.tsx` untouched). The approach is the maker's. One natural part: `PwaUpdatePrompt` treats the whole session screen as busy (summary and Break's over included), so the prompt is raised where the person lands next (Today). The outcome must hold for any notice on the summary:
1. P's sheet is where P puts it on arrival, with or without a notice (the sheet's top within 1 px of the no-notice run): no gap between the counter and the sheet.
2. No row or control starts under the footer on arrival, and the highlight (unlock card or milestone) is whole.
3. Nothing covers Chai's face or the kettle's gauge (round-2 ruling A, R-1).
4. The notice itself is whole and its action is reachable.

**Proof required:**
- **Shape:** BEFORE / AFTER pairs and the measured numbers above, at 375×667 and 390×844 @100/@200, 667×375 and 844×390 @100/@200, and 1440×900, light and dark.
- **Cases:** with the update prompt arriving with the summary's first frame, with it raised after arrival, and with a timed notice. Big day (unlock) and task day.
- **Specs:** `w2-summary.spec.ts` green, plus a test of this case (a notice on the summary leaves P's arrival rules intact).

## 4. Residuals

| # | Item | Class | Owner |
|---|---|---|---|
| T2-D1 | §3 | **BLOCKS** | T2 (fix round) |
| F-T2-1 | **The strip closes at rest and moves the page.** A timed notice whose time is up leaves at the first moment of rest (1.2 s with no input), and everything below moves up by the notice's height: 68 px at 390×844, 57 px at 667×375, 97 px at 844×390 @200. With End's "Saved … of focus" that is about 3.3 s after Today opens (measured). On a touch screen nothing signals a finger in the air, so a tap aimed just before may land 57–97 px lower in the new layout (e.g. on Mark done or a tag). The maker states this residual. It is inherent in Vibei's in-flow strip; there is no overlap, and every move the app makes in answer to input is covered by the moment rules (0 violations in my audit). A lower-risk variant for Vibei to weigh: a notice whose time is up fades its face at rest but keeps its room until the next safe moment (a new screen, out of view, or the answer to the person's next tap) | **FOLLOW-UP** (design) | Vibei / I10 |
| F-T2-2 | **The session readout and controls are pushed out of view at 200 % on short screens.** A notice at the panel's head pushes them below the fold for the notice's life:<br>• 375×667 @200: a three-line notice (≈140 px) pushes Pause, End and Add 5 below the fold; before it they sit at the bottom edge.<br>• 844×390 @200: a four-line notice (188 px) pushes the countdown itself below the fold.<br>Nothing covers them, and the panel scrolls to them. The base laid its toast over the same readout (defect e), so this is not worse there. Frames: `running-none-375x667-light-200-{0,1}`, `running-844x390-light-200-{0,1}` | **FOLLOW-UP** (not worse than base) | I10 / session area: a compact one-line notice, or the strip under the controls, on short panels |
| F-T2-3 | **A notice that arrives while a tab is scrolled waits until the person scrolls back up** (clock stopped; shown in full then). Intended: nothing in view moves | **ACCEPTED** (design) | — |
| F-T2-4 | "Delete this brew?" unreachable by tap or Tab at 375×667 @200 (base too; maker §7.1; my harness also needed a programmatic scroll there) | **FOLLOW-UP** (pre-existing) | `ui/Sheet.tsx` dialog variant |
| F-T2-5 | `integrity:1004` at 1440 flake cause not established (maker §7.3); Mark done click under heavy load at 1440 @200 (maker §7.4) | **FOLLOW-UP** / **UNKNOWN** | I10 / M7a |
| F-T2-6 | Polish: at 1440 the strip is 560 px while Today's column is wider; the import Undo row's check is not in an icon tile like its neighbours | **ACCEPTED** (polish, not a defect) | — |
| F-T2-8 | Landscape session top bar at 200 %: the task label is squeezed to one letter per line ("C / h / a..") beside Rain and the sound button (`running-844x390-light-200-0-before.png`, before any notice). The top bar is not changed by T2; the maker's §7.5 reports the same bar cutting "Next: brew 2 of 4" | **FOLLOW-UP** (pre-existing) | Session area |
| F-T2-7 | Real devices, WebKit, Firefox, real AT; safe-area insets on notched phones | **UNKNOWN** (environment) | — |

## 5. Lane receipts

See §7, written after the fix round. Lane T's first receipt for `490ca97` (`review/LT/RECEIPT-LT.md`) was cut by the 00:40 restart and later closed, with the cut noted in its §7–§8.

## 6. Fix round: `pe/w2r3-notices@64f29cd` (code `40f92b6`, kettle/src `aa88587`)

**Context.** The container restarted at about 00:40 UTC. T2 then had a fresh 90-minute window (02:23–03:53) and handed back at 03:31.

| | |
|---|---|
| Fix trial | `99d9368` = integration `8af5430` (C + B) + `64f29cd`; worktree `/home/user/wt/w4tr-t2f`; src `5cd9a44`; dev :5477 (all my fix runs) |
| Revision check | `git rev-parse 64f29cd:kettle/src` = `40f92b6:kettle/src` = `aa88587…` |
| Packet | `/home/user/wt/w4t2/kettle/review/product-excellence/contracts/W2R3/T2-FIX-READY.md`; evidence `…/W2R3/T2/fix/` |
| My evidence | `contracts/W2R3/review/LEAD/T2/fix/` (`summaryarrive-update-*`, `summaryqueue-*`, `breakclock-*` JSON and PNG; `t2-lead.mjs`) |

**Direction (Vibei, binding):**
- no strip on `/done`;
- no update prompt on `/focus` or `/done`;
- queued notices are never dropped, and appear in order on the next screen with a strip, announced once;
- acceptance: the summary sheet never moves when a notice is queued.

### Code delta (`6a64fbf..40f92b6`, src)

`FocusScreen.tsx`:
- the summary's `NoticeStrip` and `summaryFill` wrapper are removed; `<Summary/>` is again the summary box's only child, as on the base;
- the panel strip is still `off` on the summary.

`FocusScreen.module.css`:
- the summary block is identical to `61aba17` again (`git diff 61aba17 40f92b6` shows no line in it).

`ShellOverlays.tsx`:
- `busy = status !== 'idle' || route === '/focus' || route === '/done'`;
- while busy the prompt is dismissed programmatically, so `needRefresh` stays set and the prompt is raised on the next screen.

The session layer has no page-level strip (`App.tsx`: the `session` layer renders `<Session/>` only), so nothing is drawn while the summary is up: no strip is active, and a notice waits with its clock stopped. No P file is touched.

**Tests:**
- `summary-notice.spec.ts` (new) compares the sheet with and without queued notices.
- `notice-strip.spec.ts`'s summary step now asserts nothing is drawn there, the notice waits with its full time, and it is drawn whole on the tea break.
- `a11y.spec.ts:332` now asserts the notice is not drawn on the summary and is queued.

All three are stricter or equivalent; nothing is weakened.

### My reproduction, rerun on the fix (dev :5477)

**1. Update prompt pending as the brew ends** (`summaryarrive`; prompt raised in the same task as the finish). The same flow found the defect on `490ca97`:

| Config | Base `61aba17` (sheet top · prompt) | First trial `490ca97` | **Fix `99d9368`** |
|---|---|---|---|
| 375×667 @100 | 284 · prompt over Done / Carry forward | 359 (+75), task row under the footer, band | **284**, nothing drawn, P's fold as with no notice |
| 375×667 @200 | 285 · prompt over the heading | 453 (summary off screen), prompt over Chai and the kettle | **285**, nothing drawn; "25 minutes brewed" on screen; Chai and the kettle clear |
| 390×844 @100 | 382 · prompt over the unlock card | 457 (+75), unlock card cut, band | **382**, nothing drawn; unlock card whole |
| 390×844 dark @200, 667×375 @100, 844×390 @200 | — | — | Nothing drawn on the summary; sheet top 393 / 15 / 26 (same as their no-notice runs in (2)) |

**2. Three notices queued on a summary already shown** (`summaryqueue`): a timed warning, a persistent prompt stand-in and a recipe notice, raised 2.8 s after arrival. For each run:
- the sheet's top was sampled every 100 ms for 3 s;
- then Tea time was tapped for real, and I recorded what the break panel drew and what the announcer said.

| Config | Sheet top before → with the queue (all samples) | Drawn on the summary | On the tea break | Announced |
|---|---|---|---|---|
| 375×667 @100 | 284.5 → 284.5 | 0 | Drawn whole at the panel's head (frame `summaryqueue-375x667-light-100-2-break-2.png`) | each once |
| 375×667 @200 | 285.5 → 285.5 | 0 | Drawn first | each once |
| 390×844 @100 | 382 → 382 | 0 | Warning → recipe → prompt, in order | each once |
| 844×390 @200 | 26.4 → 26.4 | 0 | Warning → recipe → prompt, in order | each once |
| 1440×900 dark @100 | 29.5 → 29.5 | 0 | Warning → recipe → prompt, in order | each once |

The clocks stood still on the summary (3200 ms left each).

**The 375×667 rows** showed only the first notice in my 15 s window. My diagnostic (`breakclock`) showed why. The notice is drawn at 323–380, in view and on top, but my harness had left the emulated mouse at the screen centre (187, 333), right over it, and a notice under the pointer pauses its clock by design. With the mouse moved off (`breakclock-mouseaway-375x667-light-100.json`), the queue runs down in order (3200 → 2200 → 800 → next → cleared). A harness artifact, not a defect.

**3. Invariant on all fix runs:** 0 cover samples by hit-test and by geometry; 0 notices with anything over them; 0 moment violations.

**Visual, opened at full size:**
- `fix/summaryarrive-update-375x667-light-200-arrival.png` and `…-390x844-light-100-arrival.png`: identical in composition to P's no-notice summary (K02/K03). "25 minutes brewed" on screen at 200 %, the unlock card whole at 390, Chai and the kettle clear.
- The matching T2-D1 frames on `490ca97` are in `shots/`; the base frames are in `base/`.

**T2-D1: closed by my measurements.** P's sheet does not move with a notice queued, at any configuration I ran; nothing is drawn on the summary; the queue is kept and comes in order on the next screen, announced once.

### Follow-ups ruled by Vibei (not blockers this round)

| # | Item | Class | Owner |
|---|---|---|---|
| F-T2-4 | "Delete this brew?" unreachable at 375×667 @200 | **FOLLOW-UP** | Stats/History round |
| F-T2-1 | The strip changing as a finger lands: needs a between-interactions rule | **FOLLOW-UP** | Next polish round |


## 7. Lane receipts on the fix, my checks of them, and the final residuals

**Read in full:**
- Lane T: `review/LT/RECEIPT-LT-FIX.md` (evidence `review/LT/fix2/`).
- Lane R: `review/LR/RECEIPT-LR.md` (Part A on `490ca97`, Part B on `99d9368`; B.9 is the orchestrator's note).
- Orchestrator: `review/ORCH/README.md`.

I checked each fact I rely on against the raw files below, and ran the gaps myself.

### What the receipts establish (fix trial, :5477 unless stated)

**Lane T:**
- **Control first:** the same probe sees T2-D1 on `490ca97` (sheet +74.5 px at 375×667 / 390×844 @100; +155.5–208 px at 375×667 @200, with the notice over Chai's face and the gauge). It sees 0.0 px on the fix.
- **124 summary runs** (20 configurations × task/big day × 3 cases, plus 4 runs of the real update prompt via a served hook on `patch({ needRefresh: true })`):
  - the max change of sheet top, sheet bottom and footer top against each run's own no-notice run is **0.0 px**;
  - **0 frames** with a notice drawn on the summary;
  - footer-cut rows unchanged; the timed notice keeps all 4,000 ms.
- **The next screen:** the queued notice is drawn on the tea break or Today in 120/120 runs, one at a time, never clipped, **said exactly once**. Its action works by a real tap (76/76 where on top).
- **The real prompt** is never drawn or queued during the brew or on the summary. On Today it is drawn whole and said once, and Update reloads the page.
- **Invariant re-probe** (10 configurations): 0 control or row overlaps, 0 nine-point control hits with no sheet.
- **Specs:** `summary-notice` 14/14, `toast-room` 14/14, `a11y` 11/11 (D4 included); `notice-strip` 22/25 on the first run, then the 3 alone 3/3.

**Lane R:**
- tsc 0; vitest 290/290 (base 289; +1 is B's test); production build OK.
- `summary-notice` + `w2-summary` 32/32; `integrity` + `statusbar` 34/34; `break-reach` 17/17 (B.9); timer/pwa 29 + 2 skipped by design.
- Capture matrix, fix preview vs base preview: the summary states without a notice are identical, or differ only in the 3D unlock/scene media timing (11, 14; base vs base-dev noise is of the same size, B.5).
- Part A on `490ca97`: full chromium 167/167.

**Orchestrator:** `w2-home` 18/18, `toast-room` 14/14.

**Mine on the fix:**
- the §6 runs;
- `whistle` + `w2-room` **15/15** (`fix/e2e-whistle-room.txt`);
- the next-screen timing (`fix/nexttiming-*.json`).

### Final residuals (rule: BLOCKS = introduced or worsened by this change; FOLLOW-UP = present on the base and not worse, or ruled so by Vibei; ACCEPTED = not a defect)

| # | Item | My check | Class | Owner |
|---|---|---|---|---|
| T2-D1 | A notice on the summary moved P's sheet | Fixed: 0.0 px in 124 Lane T runs and in all my runs; nothing drawn on the summary | **Closed** | — |
| F-T2-1 | The strip changing as a finger lands, including the at-rest exit 57–97 px after a notice's time is up | Measured in round 3 (§4) | **FOLLOW-UP** (Vibei: needs a between-interactions rule) | Next polish round |
| F-T2-4 | "Delete this brew?" unreachable by tap or Tab at 375×667 @200 | Base too | **FOLLOW-UP** (Vibei) | Stats/History round |
| N-1 | `notice-strip`, first run, 844×390 @200 ×2: timed out waiting for Mark done | Snapshots (`LT/fix2/runs/notice-strip-failure/*/error-context.md`): the ended brew was saved as "Study brew", so the typed "Chapter 3 notes" never reached the field and no carried line could exist. A setup miss under three-browser load. The rerun passed; my own End runs at 844×390 @200 typed the task and crossed it off on both trials; Today's code is unchanged by the fix | **FOLLOW-UP** (test robustness: assert the field holds the task before Start) | I10 tests |
| N-2 | `notice-strip`, first run, 1440 @200 reduced: History Undo 111 px from the row | The spec reads "where the person saw the row" right after the tap. The base's focus scroll when the tapped row takes focus (≈110 px; my `historytrace`, round 3: 2500 → 2610, then the Undo exactly where the row was) lands before or after that read depending on load. The rerun passed. Not T2's Undo placement | **FOLLOW-UP** (spec: read the row's place once the Edit sheet is open; product: the pre-existing focus scroll) | I10 tests / Stats |
| N-3 | A long persistent notice on the tea break at 844×390 / 667×375 @200 runs below the fold; its action needs a ~50 px wheel | Only with Lane T's stand-in persistent notice. The app's one persistent notice (the update prompt) is never raised on `/focus` now. A timed notice of that length has no action, and its clock runs at ≥ 60 % in view. Whole after a short wheel; nothing covered. Same class as F-T2-2 | **FOLLOW-UP** (with F-T2-2) | I10 / session area |
| N-4 | The queued notice is drawn 0.3–4.7 s after the tap, not "in the first frame" | Measured in Lane T's two slowest configurations (1440 dark @100, 667×375 @200): tap at ~20 ms, route to the tea break at ~200 ms (the summary's 180 ms leave), the notice drawn **one frame later** as that screen's arrival (`why: screen`), full opacity. The 2–4.7 s outliers came under heavy load with 120 ms sampling and do not reproduce | **ACCEPTED** (the next screen's arrival; load timing) | — |
| N-5 | The production service-worker path (`onNeedRefresh` → `patch`) is unproven in a run | `src/pwa/**` is unchanged since `61aba17` (empty diff). Lane T proved everything from `patch({ needRefresh: true })` onward with the app's own code. Re-raising (and re-saying) the prompt each time the person leaves the session screen with `needRefresh` still true is by code only, the same as the base | **UNKNOWN** (environment), not a blocker | — |
| N-6 | Text line-box "overlaps" | **(a)** The countdown ":" line box meets the bottom 2–4 px of a panel notice at landscape @200. Hit-test only: the frame (`LT/fix2/probes/inv-fix/shot-844x390-light-t200-nextbrew-0.png`) shows "25:00" wholly below the notice with clear space, and no control is involved. **(b)** The History Undo row "on top" of the sticky Stats bar's "Stats" / "23": the bar is `pointer-events: none` and `aria-hidden` (`stats.module.css:36–56`), opaque, at `z-index: var(--z-sticky)`. It paints over the row; hit-testing falls through to the row beneath. This is in-flow content scrolling under chrome, as every History row does | **ACCEPTED** (not a defect) | — |
| F-T2-2 | Session readout or controls pushed below the fold by a notice at 200 % on short screens | Unchanged by the fix; the base covered the same readout | **FOLLOW-UP** | I10 / session area |
| F-T2-3 | A notice arriving while a tab is scrolled waits until the person scrolls back up | — | **ACCEPTED** (design) | — |
| F-T2-5 | `integrity:1004` flake cause at 1440 not established; Mark done click under heavy load at 1440 @200 | Not seen on the fix: Lane R's `integrity` 25/25 | **FOLLOW-UP / UNKNOWN** | I10 / M7a |
| F-T2-6 | Polish: strip width at 1440; the import Undo row's icon tile | — | **ACCEPTED** | — |
| F-T2-8 | Landscape session top bar squeezes the task label at 200 % | Base too | **FOLLOW-UP** (pre-existing) | Session area |
| F-T2-7 | Real devices, WebKit, Firefox, real AT, notch safe areas | — | **UNKNOWN** (environment) | — |
| E-1 | Evidence gaps, not defects: `chai3d` and `w2-firstvisit` not rerun on the fix (both passed in Lane R's full suite on `490ca97`, 167/167; the fix touches neither); Lane R's Part A dark captures of mixed provenance and its 1440 dark capture not run; `notice-strip`'s other configurations not rerun by Lane R | — | Noted | — |

No item is introduced or worsened by this change in a way that is a defect, so nothing BLOCKS. The narrow transient-artifact exception is not needed for any item.

## 8. BEFORE / AFTER pairs for Vibei (full size)

**Today right after End: the notice heads Today, nothing covered**
- 390×844 light @100:
  - BEFORE `/home/user/wt/w4t2/kettle/review/product-excellence/contracts/W2R3/T2/shots/before/390x844-light-t100/03-today-after-end-0.6s.png`
  - AFTER `…/T2/shots/after/390x844-light-t100/03-today-after-end-0.6s.png`
- 1440×900 light @100 (BEFORE: End sheet frozen over Today):
  - BEFORE `…/T2/shots/before/1440x900-light-t100/03-today-after-end-0.6s.png`
  - AFTER `…/T2/shots/after/1440x900-light-t100/03-today-after-end-0.6s.png`

**Break's over on a recipe day: notice at the panel's head, text uncovered**
- 390×844 light @100:
  - BEFORE `…/T2/shots/before/390x844-light-t100/06-break-over-0.6s.png`
  - AFTER `…/T2/shots/after/390x844-light-t100/06-break-over-0.6s.png`
- 844×390 light @200:
  - BEFORE `…/T2/shots/before/844x390-light-t200/06-break-over-0.6s.png`
  - AFTER `…/T2/shots/after/844x390-light-t200/06-break-over-0.6s.png`

**Inline Undo** (`…/T2/shots/{before,after}/390x844-light-t100/`):
- Mark done: `11-mark-done-undo.png`
- History delete: `12-history-delete-undo.png`
- Import: `13-import-undo.png`

**K01 Today at rest (H's Brew length in the dock):** `…/T2/triples/K01-1-REFERENCE-01-home.png` → `K01-2-BEFORE-61aba17.png` → `K01-3-AFTER.png`

**K02 summary without a notice (unchanged):** `…/T2/triples/K02-1-REFERENCE-07-summary.png` → `K02-2-BEFORE-61aba17-task.png` → `K02-3-AFTER-task.png`

**The summary with an update pending as the brew ends (T2-D1)**, all under `contracts/W2R3/review/LEAD/T2/`:
- 375×667 light @200:
  - base `base/summaryarrive-update-375x667-light-200-arrival.png` (prompt over the heading)
  - first trial `shots/summaryarrive-update-375x667-light-200-arrival.png` (summary pushed off; prompt over Chai and the kettle)
  - **fix** `fix/summaryarrive-update-375x667-light-200-arrival.png` (P's summary, untouched)
- 390×844 light @100: the same three paths, `…-390x844-light-100-arrival.png`.

**The queued notice on the next screen:**
- tea break: `contracts/W2R3/review/LEAD/T2/fix/summaryqueue-375x667-light-100-2-break-2.png`
- Today: `contracts/W2R3/review/LT/fix2/shots/5477-today/390x844-dark-t100-task-b-next-drawn.png`

**Lane T's REFERENCE → BEFORE → AFTER triples** (summary with a queued notice, then the next screen): `contracts/W2R3/review/LT/fix2/shots/` (`REFERENCE-07-summary.png`; `5470*`, `5476*`, `5477*`, `5477-next*`, `5477-today*`), listed in `RECEIPT-LT-FIX.md` §6.
