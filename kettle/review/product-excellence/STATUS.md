# Product Excellence — execution status (durable checkpoint)

Resume here after any interruption. Do not overwrite past verdicts; append.

## Authority and restore point

- **Authorized:** user execution authorization, 2026-10-07 ("BEGIN THE KETTLE PRODUCT EXCELLENCE BUILD").
- **Source of truth:** approved package `INTEGRATED-2026-10-06` (independent APPROVE 131/140; all 28 reviewed canonical hashes verified in preflight). Extracted locally at `kettle/.tmp/pkg/kettle-excellence-integrated/` (git-ignored; not app source).
- **Protected pre-rebuild restore point:** `8f1044a` (local annotated tag `pre-product-excellence`; the session's git proxy refuses tag pushes, so on the remote it stays reachable as an ancestor of the integration branch, which is never rewritten). Never reset or rewrite past it.
- **Integration branch:** `claude/wizardly-galileo-uy89d9`. Maker branches are local `pe/*` worktrees, merged only after an independent APPROVE.
- **Orchestrator / model:** Claude Opus 5.5 (`claude-opus-5-5`, verified via session metadata). Makers, Checkers and the Final Product Boss are separate agent instances with their own context; a Checker never reviews work it built.

## ▶ ROUND 7 IN PROGRESS — option B (storage warning as an in-page banner) · 2026-10-11 (read this first)

- **Decision:** the user chose option B from `round6-review/DEFECT-PACKET-AND-OPTIONS.md`. All agents run on Opus 5.5.
- **Starting point:** round 7 starts from `pe/w1-fix-m2@51521cf`, which keeps round 6's fixes, including the verified
  R5-D1 fix.
- **Integration branch:** `claude/wizardly-galileo-uy89d9`. App code is still `0d58c5e`, Wave 1 is not closed, and the
  restore point `8f1044a` is untouched.
- **Makers**, launched 00:07 UTC with a 3-hour budget (deadline about 03:10 UTC), working in parallel because their
  files don't overlap:
  - **M7a** (`pe/r7-banner`, `/home/user/wt/r7a`): the warning as an in-flow banner on Today and in Settings › Your
    data, plus a one-line failed-save note on the summary. It removes the overlay and hide path. M7a is the combined
    owner: it merges `pe/r7-break` and runs the packet gate on the combined revision.
  - **M7b** (`pe/r7-break`, `/home/user/wt/r7b`): every break and Break's over control reachable at 200 % text.
  - At 01:35 UTC both had committed first code (`217489c`, `886acd7`) and were running probes, controls and captures.
- **Controls:** each control was verified byte-for-byte against its server.

  | Revision | Port | Defect it controls |
  |---|---|---|
  | R5 `20671eb` | :5302 | R5-D1 |
  | INT `0d58c5e` | :5303 | Break controls at 200 % text; BEFORE |
  | `e866118` | :5304 | LEAD-D1 |

- **Slot gate:** `contracts/I04/integration-fix/round7-review/tools/slots.py`, at most 3 browsers. Setup is in
  `round7-review/SETUP.md`.
- **Unrelated:** a separate desk-research report was pushed to branch `audit/phase1`. It is not part of round 7, and no
  app code changed.
- **Next:**
  1. Check the packet gate.
  2. Run a fresh review: a new lead plus lanes A–D, 90 minutes per lane.
  3. Only on APPROVE: merge and close Wave 1.

---

## ■ STOPPED: round-6 combined review REJECTED — 2026-10-10 23:10 UTC (read this first)

**The run stopped on a REJECT, as instructed.** There is no round 7. Nothing was merged and Wave 2 has not started. No
agents, servers, browser tests or monitors are running.

- **Integration branch:** `claude/wizardly-galileo-uy89d9`. App code is still `0d58c5e`; Wave 1 is not closed.
- **Restore point:** `8f1044a` and the `pre-product-excellence` tag, untouched.
- **Reviewed:** trial merge `e866118`, which is integration `bc48a10` + `pe/w1-fix-m2@51521cf` with `kettle/src`
  `05bb3f8`.
  - Archived as `archive/rv6-trial-e866118.incremental.bundle`; local branch `pe/rv6-trial`.
- **Verdict: REJECT.** It is in `contracts/I04/CHECKER-integration-fix-r6.md`.
  - Reviewer: a newly launched lead Checker running Opus 5.5 (`claude-opus-5-5`, effort not inspectable). It
    implemented none of the work.
  - **Blocking: LEAD-D1.** An older action toast makes the warning come second. Its box leaves the room, and M1's hold
    rule removes and re-shows it in a loop.
    - R6 gives 9–12 removals in about 5 s, and the loop is unbounded behind a `duration: Infinity` toast. INT is
      steady. Round 6 introduced it.
    - Cause: `Toast.module.css` gives every action toast `order: -1`, so they tie. The lead verified this with a
      counterfactual.
  - **Passed gates:**
    - R5-D1 fixed on the probes that count: race-x R5 9/10/8 → R6 0/0/0, and the natural-x R5-alone control.
    - M1's `flow.ts` and `integrity.spec.ts` are byte-identical to `3f00b57`.
    - Visual gate: no preserve-list regression.
- **Regression:** not run on R6, by user adjustment (a). L4 ran only tsc (exit 0) and vitest (265/265). The chromium
  and timer/PWA suites were not run, so this is partial and not a pass.
- **Partial:** L1's R5 controls for natural.mjs at 844, natural-x under pair load, repro6 and the extra gestures were
  never established. The solo rerun did not fit the user's 60-minute time box, so those R6 zeros don't count.
- **Defect packet, causal analysis and architecture options:**
  `contracts/I04/integration-fix/round6-review/DEFECT-PACKET-AND-OPTIONS.md`.
  - **A:** deterministic precedence (smallest).
  - **B:** move the storage warning into an in-flow banner; this removes the class and is recommended.
  - **C:** a reserved non-scrolling notice slot.
- **Lane receipts** are under `contracts/I04/integration-fix/round6-review/{L1,L2,L3,L4,LEAD}/`. Wall clock from the
  18:24 UTC start:

  | Lane | Finished | Duration / scope |
  |---|---|---|
  | L1 | 21:26 | 3 h 02 m, 862 runs |
  | L4 captures | 21:44 | 3 h 20 m |
  | L4 regression | 22:33 | 47 m, stopped |
  | L3 | 22:46 | 4 h 22 m |
  | L2 | 22:58 | 4 h 34 m |
  | Lead verdict | ~23:04 | — |

- **Never verified here (BLOCKED/UNKNOWN):**
  - real phones and touch hardware;
  - real-device audio, mute and late-return (I05);
  - OS text size;
  - real assistive technology;
  - iOS Safari, WebKit and Firefox;
  - real window managers;
  - GPU timing.

### Next action (only when the user says so)

**User decision:** choose the architecture for the storage-full warning, A, B or C, in `DEFECT-PACKET-AND-OPTIONS.md`.
Then:
1. **Round 7** by one combined maker (the I03 × I04 shared contract), including follow-up 12 (controls below the edge
   at 200 % text).
2. **A fresh independent review** with the evidence the r6 verdict lists:
   - LEAD-D1 retest on R6-new against INT;
   - a new spec case that fails on `e866118`;
   - R5-D1 and R4-D1 retests with the R5 control reproduced in the same session, including a solo L1 control.
3. **Only on APPROVE:** the full Wave 1 regression on that trial merge, then the merge, then Wave 2.

---

## ⏸ PAUSE CHECKPOINT (round 6) — 2026-10-10 15:12 UTC (read this first)  *(superseded by the STOPPED section above)*

**Paused by the user at M2's round-6 submission** (switching the session to Ultracode). No Checker has been launched,
nothing is merged, round 7 and Wave 2 have not started. No agents, dev servers, browser tests or monitors are running.
The last item stopped was an orphaned M2 wait loop for a probe that was no longer running; it was killed by PID and had
no log.

- **Restore point:** `8f1044a`, untouched (tag `pre-product-excellence`).
- **Integration branch:** `claude/wizardly-galileo-uy89d9`.
  - App code `0d58c5e` (Wave 1 merge), not yet clean.
  - Branch HEAD: the commit that adds this checkpoint (parent `c6c7922`).
- **Round-6 submission (combined I03 × I04 fix, maker M2, READY FOR REVIEW, NOT REVIEWED):**
  - `pe/w1-fix-m2@51521cf`, the submission commit, which adds only evidence and the packet.
    - Last code commit `091249a`.
    - `kettle/src` tree `05bb3f8`.
    - Contains M1's approved `pe/w1-fix@3f00b57` via merge `ca23385`.
  - Scratch merge onto integration HEAD `c6c7922`: `859f9fb` (parents `c6c7922`, `091249a`).
    - `kettle/src` tree `05bb3f8`, identical to the branch.
    - No conflicts; tsc clean; vitest 265.
    - Scratch worktree removed; the commit object is kept locally.
  - **Packet:** `kettle/review/product-excellence/contracts/I04/INTEGRATION-FIX-READY-FOR-REVIEW.md` on `pe/w1-fix-m2`,
    section "r6 (combined)", items (a)–(f).
  - **Evidence:** `contracts/I04/integration-fix/r6/`.
    - (c) logs and clips: `c-repro/`.
    - (d) keyboard: `d-keyboard/`.
    - (f) 64 captures: `captures/`.
    - Test logs: `e2e-chromium.txt`, `e2e-timer-pwa.txt`, `tsc-vitest.txt`.
    - Changed files: `changed-files.txt`.
  - **Archived:** `archive/pe-w1-fix-m2-r6-51521cf.incremental.bundle` (38.8 MB, needs `db8220e`).
- **Maker's claims, unverified by any Checker:**
  - **R5-D1 removed by construction:** a stack holding an action toast is a plain top-down list led by that toast. Nothing
    in it is sticky, reversed or transformed, so the warning's box sits at or above its resting place, which is inside
    the room.
  - **Code changes:** `Toast.tsx` changed only at the Toaster call site (lift kept until the last toast has faded out).
    `toastLiftBottom()`, `useToastAbove()`, `flow.ts` and `integrity.spec.ts` are byte-identical to `3f00b57`.
  - **(c) reproduction** (disposable profile, 200 % text, storage full, three toasts after a level-up, real timers, real
    wheel and touch, expiry before / during / after the gesture):
    - 375×667 light: 20 runs, 0 failures.
    - 375×667 dark: 20 runs, 0 failures.
    - 844×390 light: 20 runs, 0 failures.
    - 0 hide/reset events and 0 overlaps throughout; one webm clip per configuration.
  - **Earlier Checkers' probes:** `race` 0/60, `natural` 0/72, `race6` 0/288, R4-D1 reading set 0/72.
  - **Tests:** tsc clean; vitest 265; chromium 66 passed, including M1's integrity spec (28); timer/PWA 29 passed and
    2 skipped (harness-only by design).
  - **Kept:** M1's 60 storage-full states unchanged; D4 0/24; 100 % toast geometry at 375, 390 and 1440 identical;
    phone CLS 0.
- **Disclosed as not fixed or changed (packet "Still open (r6)"):**
  - **(d) 375×667 at 100 %:** forward Tab never reaches "Save backup" (Shift+Tab does, in 7 presses). The cause is
    measured: once the page is scrolled to its end, the docked start falls outside `toastLiftBottom()`'s 60 % rule, so
    M1's hold zone covers "Change brew length" and withdraws the warning. A fix would need frozen `flow.ts`, the must-keep
    lift logic, or Today's 100 % geometry.
  - **(d) at 200 %:** Tab reaches "Save backup" with visible focus and Enter downloads, but the warning blinks out for
    73–92 ms in some runs (same as r5).
  - **R4-D1 set at 667×375 @200 %:** 53 px and 100 px wheel notches are flagged in 12/12 runs (same class as r5). With 53 px
    notches, 7 of 11 warning lines are read (r5: 9 of 11).
  - **Short rooms at 100 %:** stacks holding the warning are reordered, warning first.
  - **568×320, three-stack:** older toasts not yet scrolled in have layout boxes over the docked start. They are clipped,
    not drawn and not clickable.
  - **1440 Home after End:** toasts sit about 110 px higher for 0.5–4 s; BEFORE does the same, and the cause is not
    established.
- **Not produced:** none of (a)–(f). The planned r5-side BEFORE matrices were stopped by the pause; the r5 failure is shown
  by the r5 Checker's runs, the new spec on the r5 trial, and `before-r5-trial/`.

### Next action on resume (only when the user says so)

**A fresh, independent, combined review of `pe/w1-fix-m2@51521cf`** (code `091249a`, src `05bb3f8`), together with a fresh
trial merge onto the then-current integration HEAD.
- **Checker:** a new instance that did not build any of it and is not any earlier Checker.
- **Scope:**
  - I03, I01 and I02 re-confirmed on the combined code;
  - D1, D2, D3, R2-D1, R2-D3, D4, R4-D1, R4-D2 and R5-D1, all with real input and real timers;
  - the (d) keyboard results;
  - CLS;
  - REFERENCE → BEFORE → AFTER using the (f) captures plus the Checker's own.
- **Verdict file:** `contracts/I04/CHECKER-integration-fix-r6.md`.
- **Only after APPROVE:** merge into the integration branch, then the full Wave 1 regression and recaptures. Then Wave 2.
- If the container was lost, restore from the archive bundles listed below. The r6 bundle sits on top of `r6wip`, which
  sits on `r5`, `r4`, and so on.

---

## ⏸ PAUSE CHECKPOINT — 2026-10-10 01:30 UTC (read this first) · ▶ RESUMED 01:40 UTC  *(superseded by the round-6 checkpoint above)*

**Resumed by the user** on 2026-10-10 ~01:40 UTC, with instructions to reread the master prompt, plan and preserve list
and to continue from this checkpoint.
- **Reread and hash-verified** against `PACKAGE-MANIFEST.json`:
  - `CLAUDE_CODE_MASTER_PROMPT.md` `8bc6de59…`
  - `PRODUCT_EXCELLENCE_PLAN.md` `7872d7bf…`
  - `PRESERVE_LIST.md` `9fecdcfd…`
  - The package review still reads **APPROVE 131/140** for this revision.
- **In force:**
  - maker/checker separation;
  - approval bound to exact revisions, with any change voiding it;
  - REFERENCE → BEFORE → AFTER review, with full-size media opened by the reviewer;
  - integration regression after merge;
  - a separate Final Product Boss.
- **Session model:** configured `claude-opus-5-5`, last served `claude-opus-5-5` (via `get_session`), so the direct
  visual-inspection requirement can be met.
- **Progress since resume:** see the log entries dated 2026-10-10 at the end of the Log.

*Paused state as it was recorded at 01:30 UTC:* execution was paused by the user (switching to Ultracode). No Checker
was running, no merge had been made, and Wave 2 had not started.

**Restore point:** `8f1044a`, untouched (local tag `pre-product-excellence`; on the remote it is an ancestor of the
integration branch). Never reset or rewrite past it.
**Integration branch:** `claude/wizardly-galileo-uy89d9` @ the commit that adds this checkpoint (parent `2f5f1f3`),
pushed. **App code on it = `0d58c5e`** (Wave 1 merge: M1 `a6ebe00` + M2 `2becb78`). Integration tree clean.
**Wave 1 is NOT clean:** its two integration defects have fixes that are *not merged*. M1's fix is APPROVED and held;
M2's r3 fix is submitted but **NOT REVIEWED**.
**Running work at pause:** none. All maker and Checker agents have finished. There are no dev servers, Playwright
runs or trial-merge worktrees (`ps` shows no vite/playwright/chromium).

### Branches and worktrees (local only; the git proxy accepts pushes to the integration branch only)

| Worktree | Branch @ commit | Role | State |
|---|---|---|---|
| `/home/user/Vibei` | `claude/wizardly-galileo-uy89d9` | integration | clean, pushed |
| `/home/user/wt/m1` | `pe/m1@a6ebe00` | M1 Wave 1 | APPROVED r2, merged (`7da58f1`). Idle |
| `/home/user/wt/m2` | `pe/m2@2becb78` | M2 Wave 1 | APPROVED r1, merged (`0d58c5e`). Idle |
| `/home/user/wt/w1fix` | `pe/w1-fix@3f00b57` (src `3c58bf9`) | **M1 integration fix** (I03 × I04) | **APPROVED r1** (fresh Checker). Held unmerged; any change voids it. Clean |
| `/home/user/wt/w1fix-m2` | `pe/w1-fix-m2@51521cf` (src `05bb3f8`) | **Combined** Wave 1 integration fix (M2; `pe/w1-fix@3f00b57` merged in `ca23385`) | **r6 READY FOR REVIEW, not reviewed** (paused). Clean |

**Archives** (`review/product-excellence/archive/`, pushed; restore with `git fetch <bundle> 'refs/heads/*:refs/heads/*'`):
- `maker-branches-2026-10-09.bundle`: `pe/w1-fix@1351c99`, `pe/w1-fix-m2@c9520db` (full).
- `pe-w1-fix-3f00b57.incremental.bundle`: `pe/w1-fix@3f00b57` (needs `1351c99`).
- `pe-w1-fix-m2-r2wip.incremental.bundle`: `pe/w1-fix-m2@e1e672d` (needs `c9520db`).
- `pe-w1-fix-m2-r2-e932f65.incremental.bundle`: `pe/w1-fix-m2@e932f65` (needs `e1e672d`).
- `pe-w1-fix-m2-r6-51521cf.incremental.bundle`: `pe/w1-fix-m2@51521cf` (needs `db8220e`).
- `pe-w1-fix-m2-r6wip.incremental.bundle`: `pe/w1-fix-m2@db8220e` (needs `33a72e6` and `3f00b57`).
- `pe-w1-fix-m2-r5-33a72e6.incremental.bundle`: `pe/w1-fix-m2@33a72e6` (needs `adec1a2`).
- `pe-w1-fix-m2-r4-adec1a2.incremental.bundle`: `pe/w1-fix-m2@adec1a2` (needs `e4be56e`).
- `pe-w1-fix-m2-r3-e4be56e.incremental.bundle.part-00..02` + `.sha256`: `pe/w1-fix-m2@e4be56e` (needs `e932f65`).
  Split because the bundle is 112 MB. Reassemble with
  `cat pe-w1-fix-m2-r3-e4be56e.incremental.bundle.part-* > pe-w1-fix-m2-r3-e4be56e.incremental.bundle` and check
  `sha256sum -c pe-w1-fix-m2-r3-e4be56e.incremental.bundle.sha256` (reassembly verified at pause).

### Verdicts (exact revisions; independent Checkers only, no maker approved its own work)

| Contract | Revision | Verdict | File |
|---|---|---|---|
| I01, I02 | `6d5969e` | APPROVE (r1), superseded by r2 | `contracts/I01/CHECKER-r1.md`, `contracts/I02/CHECKER-r1.md` |
| I03 | `6d5969e` | **REJECT** (r1): A warning over Tea time; B warning over Add 5/Pause/Resume/End on phones | `contracts/I03/CHECKER-r1.md` |
| I01, I02, I03 | `a6ebe00` | **APPROVE** (r2; I03 PARTLY BLOCKED: real browser quota, real OS suspension) | `contracts/I0{1,2,3}/CHECKER-r2.md` |
| I04, I05, I14 | `2becb78` | **APPROVE** (r1; sky "Change brew length" link judged acceptable; I05/I14 real-device BLOCKED) | `contracts/{I04,I05,I14}/CHECKER-r1.md` |
| I03 × I04 integration fix (+ I01, I02 re-confirmed; I04 toast lift unchanged) | `3f00b57` (src `3c58bf9`) | **APPROVE** (r1, fresh Checker; I03 still PARTLY BLOCKED: real browser quota, real OS suspension, real AT) | `contracts/I03/CHECKER-integration-fix-r1.md` |
| I04 integration fix r1 | `c9520db` (src `57f00c4`) | **REJECT** (review interrupted by a usage limit, then resumed): D1 no re-fit after resize/rotation to 375×667; D2 200 % text + ≥10,000 leaves spills "Level NN" | `contracts/I04/CHECKER-integration-fix-r1.md` |
| I04 integration fix r2 | `e932f65` (src `c873084`; trial with `3f00b57` = `db3418a`) | **REJECT** (fresh Checker): R2-D1 no re-fit when the window narrows without changing the bar's box; R2-D3 stacked toasts at large text collapse and the warning text spills out of its box | `contracts/I04/CHECKER-integration-fix-r2.md` |
| I04 integration fix r3 | `e4be56e` (src `97d26c5`) | **NOT REVIEWED** (no Checker launched: user pause; then superseded before review by r4 in progress, which adds D4). Not APPROVE, not REJECT | — |
| I04 integration fix r4 (r3 + D4 break-over toast + date-independent short-screen gate) | `adec1a2` (src `dcc3778`; code `9326de5`; trial merge with `3f00b57` = `1f1558e`, src `0d0db47`) | **REJECT** (fresh Checker): R4-D1 a warning taller than its room can't be read by scrolling (scroll moves its box over the dock → M1's hold rule takes it away and re-shows it unscrolled; 375×667 @200 %, landscape @150–200 %, 568×320 three-stack); R4-D2 live mobile resizes at 150–200 % text leave Today zoomed ×1.2–3.2 (regression since r2). Passed: D1/R2-D1 (96 runs), D2 (216 cells), D4, M1 unchanged (60 states), CLS, preserve list; trial 54/54 + timer/pwa 29/2 | `contracts/I04/CHECKER-integration-fix-r4.md` |
| I04 integration fix r5 (R4-D1 pinned warning, R4-D2 contained measurement) | `33a72e6` (src `8d4a979`; trial with `3f00b57` = `20671eb`, src `b38ad5e`) | **REJECT** (fresh Checker): **R5-D1** with real toast timers, an older toast leaving a scrolled reversed list makes scroll anchoring push the sticky warning's layout box 7–47 px below its room (over the dock) → M1's rule withdraws it and re-shows it reset (375×667 @200 % 4/8 light, 4/6 dark; 844×390 @200 % 2/7). Passed: D1, R2-D1, D2, D4, R4-D2 (100/100), M1 unchanged, preservation, trial 60/60 + timer/pwa 29/2. **CLS decided: not a regression** (r5 moves 159 px vs ≈1,600 px on `8f1044a`/`0d58c5e`, whose 0 is masked by a 534–570 px-wide page) | `contracts/I04/CHECKER-integration-fix-r5.md` |
| I03 × I04 combined integration fix r6 (M2's branch with `pe/w1-fix` merged in) | `51521cf` (code `091249a`, src `05bb3f8`); trial merge `e866118` on `bc48a10` | **REJECT** (lead Checker + 4 lanes; LEAD-D1: an older action toast makes the warning come second, so it is removed and re-shown in a loop; introduced in r6). R5-D1 met on the counted probes; regression not run (user adjustment) | `contracts/I04/CHECKER-integration-fix-r6.md` |

### Submitted, awaiting review: M2 r3 `e4be56e` (maker's claims, unverified by any Checker)

- **Packet:** `kettle/review/product-excellence/contracts/I04/INTEGRATION-FIX-READY-FOR-REVIEW.md` on `pe/w1-fix-m2` (r3
  section at the end). **Evidence:** `contracts/I04/integration-fix/r3/` (375 files, ~70 MB, on the branch only). It holds:
  - D1 race logs `d1-race-{c9520db,e932f65,fix}.txt`;
  - stack probes `stack-*.txt` + `stack/`;
  - real early-end flows `earlyend-*.txt` + `earlyend/`;
  - M1's storage-full captures re-run on a trial merge, `m1-capture-storage-full/`;
  - CLS `cls-today-load.txt`;
  - specs `specs-*.txt`, `trial-e2e*.txt`, `tsc-vitest.txt`;
  - 01/01b captures `after/`;
  - `a11y-short-screen-on-c9520db.txt`.
- **Changes vs `e932f65`** (`StatusBar.tsx`, `Toast.module.css`, `tests/statusbar.spec.ts`; `Toast.tsx`, `flow.ts` and
  `integrity.spec.ts` untouched):
  - R2-D1: the status bar re-fits on any screen-width change.
  - R2-D3: in short rooms toasts keep their full height, and a tall stack scrolls bottom-up so the newest toast and
    "Save backup" are in view first. Bottom-up was chosen because M1's frozen hold rule measures where the warning is drawn.
  - The statusbar spec uses a fixed leaf total (date-independent).
  - The finding-5 claim in the packet is corrected.
- **Maker's runs:** tsc clean; vitest 265/265 on both the branch and a scratch trial merge with `3f00b57` (trial src
  `1e91ac3…`; `flow.ts`/`Toast.tsx`/`integrity.spec.ts` byte-identical to `3f00b57`).
  - Branch a11y + statusbar: 15/16. Trial integrity + a11y + statusbar + whistle: 51/52. The one failure on both is a11y
    "short screen", below; the 5 serial a11y tests skipped after it pass on their own.
  - Status-bar resize probe: 0/46 failures (`e932f65`: 27/34).
  - Toast stacks: 0/152 failures (`e932f65`: 50/152). At 100 % text the geometry is identical in 52/56 cases, including
    all six main configs; the 4 that differ are the 568×320 three-stacks.
  - Early-end flows: 0/36, plus 0/18 forced level-up.
  - M1 captures on the trial match M1's AFTER at all six configs.
  - Phone load CLS 0 at 100 %, including slow fonts.
- **Maker-disclosed open items:**
  1. a11y "short screen (375×667)" fails on 2026-10-10 (below).
  2. A warning taller than its whole room (375×667 at 200 %; landscape at 150–200 %) first shows with its opening line
     above the edge, readable by scrolling; "Save backup" stays visible.
  3. In short rooms the bottom toast's shadow is clipped.
  4. BLOCKED/UNKNOWN: real phones, OS text size, iOS Safari CSS support, window managers, screen readers.

### Outstanding defects and risks

1. **Integration defect 1** (I03 × I04: warning over the session readout at 375×667). **Fixed by APPROVED `3f00b57`, not
   merged.**
2. **Integration defect 2** (I04: Today status bar at 375) and its follow-ups D1, D2, D3, R2-D1, R2-D3. **Claimed fixed by
   `e4be56e`; unreviewed.**
3. **ADJUDICATED 2026-10-10 → pre-existing I04 defect D4, routed to M2** (evidence `integration/wave1/a11y-short-screen-2026-10-10/`). Original note: `tests/a11y.spec.ts` "short screen (375×667)" fails on 2026-10-10 on `e4be56e`,
   on the trial merge, and on `c9520db` (maker's run: `r3/a11y-short-screen-on-c9520db.txt`). The message is
   `break-over: "Mark it done, start fresh" stays under span._message…`: a date-dependent progress toast after the tea break
   covers the break-over button. It passed on 2026-10-09 runs. It is probably also red on the integration branch today,
   but neither the orchestrator nor a Checker has verified that. It is the same class as finding 5. Fixing it needs
   `flow.ts`, `progress/store.ts` or `Toast.tsx` (M1-owned and/or frozen by M1's approval), or a test change. Either way the
   owner must decide and it needs independent review. It means the Wave 1 a11y regression gate is date-sensitive and red today.
4. **I10 candidate (calm state feedback):** with Settings › "Next brew" on, a badge/recipe/level toast lands on the running
   next brew and covers its status line for 3.2 s at phone sizes (digits and controls clear). With defaults it covers the
   "Break's over" title, and per item 3 it can cover the break-over button.
5. **M1 hardening candidates** (non-blocking, not reopened because that would void APPROVE `3f00b57`):
   - "Back to your brew" re-checks the warning only on the next 250 ms tick (≈0.1–0.25 s transient).
   - At 200 % text the warning (267–330 px) is taller than `TOAST_ZONE_PX` 170, giving a ≈0.25 s transient over the
     readout at brew start (375×667) or Resume (1440×900).
6. **Non-blocking notes:**
   - Desktop Today: the warning may cover part of the brew-length chooser for ≤12 s.
   - 390×844 Today: "Save backup" lies over the "Read" chip.
   - At 200 % text, a toast's first 150–300 ms on Today are drawn at the stylesheet bottom.
   - At 320 and in landscape, summary toasts cover "Done / Carry forward".
   - On desktop at 150–200 %, toasts cover "How your leaves added up".

### Tests and screenshots (revision each was taken on)

| Evidence | Revision | Result |
|---|---|---|
| Pre-rebuild checks | `8f1044a` (= `0532913` code) | tsc clean, vitest 256/256, e2e 29 passed / 2 skipped, core-loop checker 85/85 |
| BEFORE baseline, 135 captures | `8f1044a` (`baseline/`, commit `d17dda1`) | 0 page errors; orchestrator-inspected |
| I14 baseline perf | `8f1044a` build (`perf/BASELINE.md`) | phone whistle → summary CLS 0.50; real-device BLOCKED |
| Wave 1 integration regression | `0d58c5e` (`integration/wave1/`) | tsc clean, vitest 265/265, timer/pwa 29/2 skipped, chromium **41/42** (defect 1) |
| Integrated captures, 135 | app `0d58c5e` (`integration/wave1/captures/`) | 0 page errors; orchestrator found defect 2 |
| M1 fix, Checker's own runs | `3f00b57` | tsc clean, vitest 265/265, chromium integrity + a11y + whistle 45/45, timer/pwa 29 + 2 skipped; regression reproduced on `455b6c6`; per-frame placement probe 6 configs (`contracts/I03/CHECKER-integration-fix-r1.md`; captures `contracts/I03/captures/{before,after}-integration/` on `pe/w1-fix`) |
| M2 r1, Checker's runs | `c9520db` | tsc clean, vitest 265, a11y 9/9, integrity + whistle 32/33 (known M1 interaction) |
| M2 r2, Checker's runs | `e932f65` + trial `db3418a` | trial tsc clean, vitest 265/265, Playwright 50/50 (2026-10-09); both r2 defects reproduce on the trial |
| M2 r3, maker's runs (UNREVIEWED) | `e4be56e` (src `97d26c5`) + scratch trial (src `1e91ac3`) | see "Submitted, awaiting review" above (2026-10-10; a11y short-screen red) |

### Unchanged commitments

- **Maker/checker separation holds.** Makers only submit READY FOR REVIEW. A fresh Checker that did not build the change
  reviews the exact commit, and any change after APPROVE needs re-review.
- **Protected strengths (PRESERVE_LIST) are untouched by the open fixes:**
  - cream/purple identity, Fredoka/Nunito, orange focus / blue rest;
  - approved Chai, orange kettle, continuous room;
  - compact summary with sticky Tea time/Skip footer and final-line clearance;
  - five wrapping categories, 15/25/50/Custom with docked start;
  - record-player drawing → close-up, four destinations;
  - progression rules and data compatibility.
- **Never PASS:** real-device audio, OS suspension, real-phone performance and human screen-reader sessions stay
  BLOCKED/UNKNOWN.

### Next action on resume (only when the user says so)

0. *(2026-10-10 resume)* Step 2's adjudication is done (pre-existing → D4 routed to M2). Step 3 now reviews **r4**
   (r3 + D4), not r3.
1. **Restore if the container was lost:** fetch the archive bundles above in order (reassemble the r3 parts first), then
   recreate worktrees `/home/user/wt/w1fix` (`pe/w1-fix`) and `/home/user/wt/w1fix-m2` (`pe/w1-fix-m2`), with
   `node_modules` symlinked to `/home/user/Vibei/kettle/node_modules`.
2. **Adjudicate outstanding item 3** before or alongside the review. The orchestrator runs `tests/a11y.spec.ts` "short
   screen" on the integration branch (`0d58c5e`) on the current date to establish whether it is pre-existing. The owner
   (M1 for flow/progress, M2 for toast layout, or I10) then fixes it through maker → independent Checker. Wave 1 is not
   clean while that gate is red.
3. *(superseded by the rounds logged below: r3 → r4 → r5 rejected; r6 = combined branch.)* **Launch a fresh independent Checker** (not any previous Checker or maker) on M2 r3 `e4be56e`. It reviews
   R2-D1/R2-D3 retests, D1/D2/D3, 100 % geometry, CLS, the a11y failure and the maker's disclosures, and checks a fresh
   trial merge with `3f00b57` (warning placement at 6 configs × 100/200 %, M1 behaviour unchanged). Verdict goes to
   `contracts/I04/CHECKER-integration-fix-r3.md`.
4. **Only after both fixes are APPROVED** (and item 3 resolved):
   - merge `pe/w1-fix` and `pe/w1-fix-m2` into the integration branch;
   - rerun tsc, vitest, timer/pwa, and full chromium (integrity + a11y + whistle + statusbar);
   - recapture the affected states (01/01b, session-screen warning states, 07/08) at 390×844 / 375×667 / 1440×900 in both
     themes, and compare them against `integration/wave1/captures/` and the baseline;
   - confirm there is no interaction between the fixes;
   - update this file and `EVIDENCE-MANIFEST.md`.
5. **Wave 1 clean → Wave 2** (M3: I08, I07, I09; M4: I06), from the recaptured clean revision with the finalized briefs.

## Recovered state at start (revision 8f1044a)

- Working tree clean; `8f1044a` = `0532913` code (empty diff) + checkpoint commit.
- Accepted, preserved work (COMPLETE, protected by PRESERVE_LIST): round 6 implementation (`eeff3a0`), follow-up 1 (`0532913`: phone summary room, wrapping Home tags, record-player drawing → close-up).
- Checks at 8f1044a (from the follow-up-1 run): tsc clean · vitest 256/256 · Playwright e2e 29 passed / 2 skipped · core-loop checker 85/85.
- Contract states at start: **I01–I15 NOT STARTED** (no prior Product Excellence work exists).

## Contract board

| ID | Pri | Owner | State | Evidence / verdict |
|---|---|---|---|---|
| I01 Reliable time, exactly-once completion | P0 | M1 | **APPROVED r2 on `pe/m1@a6ebe00`**, merged | passes without change; touched again by open defect 1 (re-confirm on the fix) |
| I02 Recoverable End and task disposition | P0 | M1 | **APPROVED r2 on `a6ebe00`**, merged | passes without change; re-confirm on the defect-1 fix |
| I03 Data safety, truthful storage consequences | P0 | M1 | **APPROVED r2 on `a6ebe00`**, merged — integration defect 1: fix **APPROVED** on `pe/w1-fix@3f00b57`, not merged | PARTLY BLOCKED: real Safari/Firefox/Android quota, real OS suspension |
| I04 Access and short-screen reachability | P0 | M2 | **APPROVED r1 on `pe/m2@2becb78`**, merged — integration defect 2: r1 `c9520db` REJECT, r2 `e932f65` REJECT, **r3 `e4be56e` NOT REVIEWED**; a11y short-screen gate red on 2026-10-10 (unadjudicated) | gate: retest after all UI work; sky link judged acceptable |
| I05 Real whistle, mute, ambience expectations | P0 | M2 | APPROVED r1 on `pe/m2@2becb78` (PARTLY BLOCKED: real-device audio) | real-device cases BLOCKED in this environment |
| I06 Crisp approved Chai | P1 | M4 | NOT STARTED | |
| I07 Effort → leaves → level → Nook, once | P1 | M3 | NOT STARTED | |
| I08 Plain purpose, first useful brew | P1 | M3 | NOT STARTED | |
| I09 Persistent Nook outcome and fallback | P1 | M3 | NOT STARTED | |
| I10 Calm state feedback | P2 | M4 | NOT STARTED | conditional |
| I11 Consistent settings and controls | P2 | M5 | NOT STARTED | conditional |
| I12 Truthful history and Stats | P2 | M5 | NOT STARTED | conditional |
| I13 Supportive return | P2 | M3 | NOT STARTED | conditional |
| I14 Measured responsiveness | P2 | M2 | **Baseline + measured fix APPROVED r1 on `2becb78`**, merged | phone whistle → summary CLS 0.50 → 0.003; real-device BLOCKED |
| I15 Bounded comprehension check | P3 | M3 | NOT STARTED | only if I07/I08 comprehension stays uncertain |

## Waves and file ownership

| Wave | Maker | Contracts | Owns (exclusive while active) |
|---|---|---|---|
| 1 | M1 Session and data integrity | I01, I02, I03 | `src/timer/**` (except `notify.ts`), `src/progress/**` (logic, not UI), `src/app/{flow,intention}.ts`, `src/lib/storage.ts`, `src/screens/settings/DataSection.tsx`, new tests |
| 1 | M2 Access and device quality | I04, I05, I14 baseline | `src/ui/**`, `src/styles/**`, `src/audio/**`, `src/timer/notify.ts`, a11y/layout fixes in `src/screens/**` other than M1's files, new tests and measurement tools |
| 2 | M3 Activation and progression clarity | I08, I07, I09 (+I13, I15 later) | `src/screens/{welcome,home,done,nook}/**` (copy/hierarchy), `src/scene/index.tsx` fallback |
| 2 | M4 Chai and calm feedback | I06 (+I10 later) | `src/art/**`, Chai asset pipeline |
| 3 | M5 Existing system and secondary utility | I11, I12 (if warranted) | `src/screens/{settings,stats}/**` |

## Tools

- Capture: `node review/product-excellence/tools/capture.mjs --base <url> --out <dir> --w <w> --h <h> --dpr <n> --theme light|dark [--rm] [--only ids]` (22 states, writes `capture-meta.json`).
- Dev servers: orchestrator 5191 (main checkout). Makers: M1 5201, M2 5202, M3 5203, M4 5204, M5 5205. Checkers 5211+.

## Log

- 2026-10-07: preflight passed; execution authorized. Package extracted to `.tmp/pkg`. Capture tool written and smoke-tested.
- BEFORE baseline complete (`d17dda1`): 135 captures, zero page errors; inspected by the orchestrator. Observed for
  later contracts: Home Brew length partly under the docked start at 390×844 and below the fold at 375×667 (I04);
  Home duration order Gentle 15 / Classic 25 / Deep 50 / Custom vs Settings preset order Classic / Deep / Gentle /
  Custom (I11 candidate); Chai masters are ~490 px tall, desktop Retina needs ~580 → 1.19× upscale; no genuinely
  higher-resolution approved masters exist (I06).
- Worktrees `/home/user/wt/m1` (`pe/m1`) and `/home/user/wt/m2` (`pe/m2`) created; makers M1 (I01–I03) and M2
  (I14 baseline, I04, I05) launched in parallel (machine: 4 cores, so two makers at a time).

- 2026-10-07 ~05:00 UTC: both Wave 1 makers stopped by an API usage limit (not an implementation failure). On
  recovery (09:15 UTC) their uncommitted work was preserved as WIP commits `pe/m1@49fcb3d` and `pe/m2@ccb4ae4`
  (explicitly NOT READY FOR REVIEW). Recovered findings: M1 — `tests/integrity.spec.ts` 17/18 pass on unmodified
  code; one reproduced I03 defect (storage full → a completed brew never reaches the summary); fix in progress.
  M2 — I14 baseline recorded (`perf/BASELINE.md`; phone CLS 0.5 at whistle → summary); I04 audit-before found
  serious axe violations (Home target size, disabled-slider contrast in Settings, Paused flag contrast at desktop
  light); fixes in progress. Both makers relaunched from their WIP commits and existing briefs.

- 2026-10-07 ~09:20–14:10 UTC: M1 submitted `pe/m1@6d5969e` READY FOR REVIEW (tsc clean, vitest 265/265,
  integrity spec 20/20 on fix vs 17/20 on base, timer suites 26/26). M1 relayed two requests to M2 (toasts must
  float above session controls and the summary footer; Settings "Kettle will chime instead" overstates background
  audio). A second usage-limit stop (resets 14:10 UTC) interrupted M2 and the first M1 Checker (no verdict written).
- 16:16 UTC recovery: M2's uncommitted work preserved as `pe/m2@651bc54` (WIP 2, NOT READY FOR REVIEW); the
  checker's stale worktrees removed; M1 Checker r1 relaunched fresh on `6d5969e`; M2 resumed from `651bc54` with
  the relayed requests.

- Checker r1 on `6d5969e` (`contracts/I0{1,2,3}/CHECKER-r1.md`, commit `a2b096c`): I01 APPROVE, I02 APPROVE,
  I03 REJECT (defects A and B above). Rejection routed back to M1. A third usage-limit stop (resets 21:10 UTC)
  interrupted M1's r2 and M2.
- 21:35 UTC recovery: M1's r2 work preserved as `pe/m1@ade1195`, M2's as `pe/m2@16bde5a` (M2 had also saved its
  own WIP commits 3–4); both resumed with context intact. Integration rule: Wave 1 merges only when M1's current
  revision has APPROVE for I01, I02 and I03 and M2's current revision has APPROVE for I04/I05/I14.

- M1 submitted r2 `pe/m1@a6ebe00` (defects A and B fixed; integrity spec 25/25; vitest 265/265; timer suites
  26/26). M2 submitted `pe/m2@2becb78` (I04/I05/I14: 13 fixes; axe serious/critical 11 → 0; phone whistle →
  summary CLS 0.50 → 0). Checkers launched on both exact commits; a fourth usage-limit stop (resets 02:30 UTC)
  interrupted both. I05 verdict was already written: **APPROVE** on `2becb78`.
- 08:39 UTC: both checkers resumed with context intact. The M2 checker was asked to decide explicitly whether
  the new sky-blue "Change brew length" link (F10) weakens the orange-focus / blue-rest colour semantics
  (REFERENCE → BEFORE → AFTER); the orchestrator does not decide it.

- Checker r2 APPROVED M1 `a6ebe00` (I01–I03); Checker r1 APPROVED M2 `2becb78` (I04, I05, I14; the sky
  "Change brew length" link was explicitly judged acceptable: it reuses Home's existing link style, orange start
  stays the only CTA, blue-for-rest lives on Tea time and the break clock).
- Wave 1 merged into the integration branch: `7da58f1` (M1), `0d58c5e` (M2). Clean merge.
- Wave 1 integration regression (`integration/wave1/REGRESSION.md`): tsc clean, vitest 265/265, timer/pwa
  29 passed / 2 skipped, chromium e2e 41/42 — **one interaction failure**: the I03 warning shows on the session
  screen after Next brew at 375×667 (M2's toast lift × M1's hold logic). Integration changed approved behavior →
  returned to M1 on a new branch `pe/w1-fix` (worktree `/home/user/wt/w1fix`, from `455b6c6`); a fresh Checker
  will review I03 (+ the toast part of I04) on that exact revision before it merges.
- Integrated-revision captures (all 22 states × 6 configs + reduced motion) running into
  `integration/wave1/captures/` — the BEFORE set for Wave 2.

- Integrated-revision captures inspected by the orchestrator: second Wave 1 integration defect found — Today's
  status bar wraps at 375×667, 100% text, both themes (M2 F6); returned to M2 on `pe/w1-fix-m2`
  (`/home/user/wt/w1fix-m2`). A fifth usage-limit stop (resets 13:30 UTC) interrupted both fixes.
- 13:31 UTC recovery: M1's fix preserved as `pe/w1-fix@5ebb01c` (WIP), M2's as `pe/w1-fix-m2@3bc0c66` (code) +
  `d3f4e06` (WIP evidence). Both resumed with context intact. Each fix gets a fresh independent Checker on its
  exact commit; Wave 1 is clean only after both merge and the full regression + affected captures pass.

- 2026-10-09 (resume after checkpoint `8ec8875`): repository and worktrees verified against the checkpoint — integration
  branch `8ec8875` = origin, clean; `pe/w1-fix@1351c99` (src tree `3c58bf9`) and `pe/w1-fix-m2@c9520db` clean; checker
  worktrees unchanged; `8f1044a` untouched. Next actions 1–2 started: M1 resumed to make its READY FOR REVIEW commit;
  the interrupted `c9520db` Checker resumed (still **no verdict** until it writes one). M1's maker runs are not approval.

- M1 submitted `pe/w1-fix@3f00b57` (I03 I04 INTEGRATION FIX READY FOR REVIEW; src tree `3c58bf9`, packet + run logs
  refreshed). Fresh independent Checker launched on `3f00b57` (worktree `chk-w1m1`, base `455b6c6`). Both fix reviews in
  progress; no verdicts yet; nothing merged.

- Checker r1 on `c9520db` (resumed after interruption) → **REJECT**: D1 (no re-fit after resize/rotation to 375×667;
  `document.fonts.status` briefly "loading" on resize, only retry armed at mount) and D2 (200 % text, ≥10,000 leaves:
  fixed 56 px level column spills; pre-existing at `1bec1a8` but inside I04). Passes kept: fresh-load 375 one row, no
  regressions in 95 configs, CLS 0, protected Home elements intact. Routed back to M2 for r2 on `pe/w1-fix-m2`. Checker
  worktrees `chk-w1m2`/`chk-w1m2-base` removed by the Checker.

- Fresh Checker r1 on M1's `3f00b57` → **APPROVE** (`contracts/I03/CHECKER-integration-fix-r1.md`): reproduced the
  regression on `455b6c6` (base spec 1 fail; HEAD spec vs base app 4 fail), HEAD tsc clean, vitest 265/265, chromium
  integrity + a11y + whistle 45/45, timer/pwa 29 + 2 skipped; per-frame placement probe at all 6 configs (warning never
  over readout / controls / footer / docked start once settled; never lost); I01, I02 re-confirmed; I04 toast lift
  identical to base. Held unmerged until M2's fix is approved. Non-blocking findings recorded:
  1. "Back to your brew" re-checks the warning only on the next 250 ms tick (≈0.1–0.25 s transient; End taps 10/10 OK)
     — M1-owned hardening candidate (`recheckSaveWarning()` on route → `/focus` | `/done`); not reopened (would void APPROVE).
  2. Desktop Today: warning may cover part of the brew-length chooser for ≤12 s (disclosed).
  3. 390×844 Today: "Save backup" lies over the "Read" chip while the warning shows (M2 lift geometry; non-destructive).
  4. **200 % text, phones: the warning on Today runs off the top of the screen** → routed to M2 as r2 item **D3**
     (`Toast.module.css` only; `Toast.tsx` / `flow.ts` are frozen by M1's approval).
  5. Ordinary toasts on the phone session screen float over the readout (M2 lift); no ordinary toast fires during a
     running brew in practice — M2 to judge with evidence.
  Checker worktrees `chk-w1m1`/`chk-w1m1-base` removed after the verdict.

- Container restart stopped M2's r2 mid-work. Worktrees survived; M2's uncommitted edits (StatusBar.tsx, Home.module.css,
  Toast.module.css, new tests/statusbar.spec.ts, 5 r2 run logs) preserved as WIP `pe/w1-fix-m2@e1e672d` (NOT READY FOR
  REVIEW) and archived (`archive/pe-w1-fix-m2-r2wip.incremental.bundle`, on `c9520db`). M2 resumed with context intact.

- M2 submitted r2 `pe/w1-fix-m2@e932f65` (READY FOR REVIEW; code `0818962`): D1 re-fit on font load after resize,
  D2 `.statLevel` min-width max-content, D3 long toasts stay on screen at 200 % text (`Toast.module.css` only; `Toast.tsx`,
  `flow.ts`, `integrity.spec.ts` untouched); finding 5 no change with evidence; new `tests/statusbar.spec.ts` (fails on
  `c9520db` 4/5, passes 5/5). Maker disclosures for the Checker: 200 % text + slow fonts load CLS 0.08–0.15 (vs 0); on M2's
  branch alone the old hold rule reads the toast area's top. Archived (`archive/pe-w1-fix-m2-r2-e932f65.incremental.bundle`).
  Trial merge of both fixes `db3418a`: clean. Fresh Checker launched on `e932f65` (+ interaction check on `db3418a`).

- Fresh Checker r2 on `e932f65` → **REJECT** (R2-D1, R2-D3; see verdict table). Routed back to M2 for r3 with the exact
  corrections/retests, plus: make `statusbar.spec.ts` deterministic (date-seeded leaf total), and correct the packet's
  finding-5 claim. Recorded follow-ups (not defects of this round; not fixable inside M2's files without voiding M1's approval):
  - **I10 candidate:** with Settings › "Next brew" on, a badge/recipe/level toast lands on the running next brew and covers
    its status line for 3.2 s at phone sizes (digits and controls clear); with defaults it covers the "Break's over" title.
    Options: hold non-urgent progress toasts while `/focus` shows a running timer and replay them on the summary/Today, or keep
    the lift clear of the readout on phones.
  - **M1 hardening candidate:** at 200 % text the warning (267–330 px) is taller than `TOAST_ZONE_PX` 170, so on 375×667 brew
    start / 1440×900 Resume it can show over the readout for ≈0.25 s before the drawn-rect check holds it (same on `3f00b57`).
  - Pre-existing I04 F11 lift timing: first 150–300 ms of a toast on Today at 200 % drawn at the stylesheet bottom.
  Checker and trial worktrees removed.

- M2 submitted r3 `pe/w1-fix-m2@e4be56e` (READY FOR REVIEW; code `54bf8be`, src `97d26c5`). Archived as split bundle parts.
- 2026-10-10 01:30 UTC: **user paused execution** (switching to Ultracode). M2 finished and committed r3 before stopping;
  no Checker launched, nothing merged, Wave 2 not started; no agents, servers or scratch worktrees running. See the
  PAUSE CHECKPOINT at the top.

- 2026-10-10 ~01:40 UTC: **resumed by the user.** Master prompt, plan and preserve list reread and hash-verified; rules
  reconfirmed (see the checkpoint header). The repository matched the pause checkpoint exactly.
- **Adjudication of the a11y "short screen" failure:** it fails on the integration branch's app code `0d58c5e` too, so it
  is **pre-existing**, not caused by either fix.
  - Cause: today's recipe rotation completes "Take 2 full tea breaks" at the journey's break end, and the resulting toast is
    lifted above "Put the kettle on", fully covering the carried-task button "Mark it done, start fresh". That button
    (`.overMark`) sits outside the `data-toast-above` group.
  - Evidence: `integration/wave1/a11y-short-screen-2026-10-10/` (run log, probe, full-size screenshot inspected by the
    orchestrator).
  - Routed to M2 as **D4** on `pe/w1-fix-m2`, before r3 is reviewed: keep break-over controls clear of toasts, make the gate
    date-independent, and capture BEFORE/AFTER at 3 viewports × 2 themes. M2 is to submit r4. Then a fresh Checker reviews
    r4 plus a trial merge with `3f00b57`.

- M2 submitted **r4** `pe/w1-fix-m2@adec1a2` (code `9326de5`, src `dcc3778`).
  - D4: a new `.overDock[data-toast-above]` wrapper holds "Mark it done, start fresh" and both break-over actions.
  - The short-screen a11y gate now raises 1–2 toasts on break-over on every date, and a new break-over toast test was added.
  - Only `FocusScreen.tsx`/`.module.css` and `tests/a11y.spec.ts` changed vs r3. Frozen M1 files untouched.
  - Maker's runs (unreviewed): branch a11y + statusbar 18/18; gate fails on `e4be56e` and `0d58c5e`; break-over probe
    0/24 on the fix (16/24 on `e4be56e`); trial integrity + a11y + statusbar + whistle 54/54; M1 warning hold on
    break-over 0/40 visible.
  - Evidence: `contracts/I04/integration-fix/r4/` (48 BEFORE/AFTER frames). Archived as
    `archive/pe-w1-fix-m2-r4-adec1a2.incremental.bundle`.
- Trial merge `1f1558e` built by the orchestrator (clean). A fresh independent Checker was launched on `adec1a2` + the
  trial, covering D1, D2, D3, R2-D1, R2-D3 and D4, the M1 interaction, CLS, REFERENCE → BEFORE → AFTER and the disclosures.

- Fresh Checker on r4 `adec1a2` (+ trial `1f1558e`) → **REJECT** (`contracts/I04/CHECKER-integration-fix-r4.md`).
  - **R4-D1:** with real wheel or touch input, scrolling a warning taller than its room moves the warning's drawn box over
    the dock. M1's approved hold rule then takes it away and re-shows it unscrolled, so the whole warning is never
    readable. Earlier "readable by scrolling" checks scrolled inside one `evaluate`, which the 250 ms watcher never sees.
  - **R4-D2:** the status-bar fit forces an unwrapped 475–511 px layout. On mobile viewports, during live resizes at
    150–200 % text, that leaves the page zoomed ×1.2–3.2. This is a regression since r2; base and r1 never do it.
  - **Passed:** everything else (see the verdict table). Non-blocking notes recorded in the verdict (desktop warning
    entry flicker, owned by M1/F11; landscape 200 % break-over room nearly 0, an I10 item).
  - **Routed to M2 for r5.** The CSS-side fix is preferred for R4-D1. If it truly needs M1's rule to measure only the
    visible part, M2 must stop and report, and the orchestrator opens an M1 change with independent review. Checker and
    trial worktrees removed.

- M2 submitted **r5** `pe/w1-fix-m2@33a72e6` (src `8d4a979`). No frozen M1 file changed; M1's hold rule needed no change.
  - **R4-D1:** the warning is pinned to the bottom of the toast list in short rooms. Older toasts slide over it, and tall
    toasts scroll their own message with the action in view.
  - **R4-D2:** the bar is size-contained and clipped while measuring, so the page never widens.
  - **New tests:** `toast-room.spec.ts` (real-input scrolling) and a page-scale assertion in `statusbar.spec.ts`. Both
    fail on r4.
  - **Maker's runs (unreviewed):** branch 24/24; trial `929576d` 60/60 plus M1's 60 storage-full states; real-input
    scroll 0/64 (r4 64/64); live resize 0/60 (r4 27/60).
  - **Maker disclosures:**
    - 200 % slow-font load CLS reads 0.384 at 390×844 (r4: 0.147), with the maker claiming the same movement;
    - a transient 1–4 px over-width during 150 % drags;
    - in a 60 px room, a two-line older toast is wholly visible at only one offset;
    - older toasts cover the pinned warning while slid down.
  - Archived as `archive/pe-w1-fix-m2-r5-33a72e6.incremental.bundle`.
- Trial merge `20671eb` built by the orchestrator (src identical to the maker's trial). A fresh independent Checker was
  launched on `33a72e6` + trial, covering:
  - all prior defects, with real input;
  - CLS measured against `8f1044a` and `0d58c5e`;
  - REFERENCE → BEFORE → AFTER;
  - the disclosures.

- Fresh Checker on r5 `33a72e6` (+ trial `20671eb`) → **REJECT, R5-D1** (see the verdict table).
  - The Checker's CLS decision: 200 %-slow-font load CLS is not a regression.
  - Recorded follow-ups:
    - **I14:** a ≈0.24 late reflow on Today at 200 % (`::before`, `chaiRow`, `card`), now no longer masked.
    - **M1/F11 (non-blocking):** entry flicker of the warning; and at 375×667 100 % keyboard Tab never reaches "Save backup"
      because the warning is withdrawn while focus passes the dock. "Save backup" stays reachable in Settings › Your data.
- **Orchestrator decision (shared contract I03 × I04, master prompt §4: combine makers where ownership overlaps).**
  - Five rounds show the warning-toast interaction can't be fixed reliably with `Toast.tsx` frozen. M2 now owns the
    combined fix: it merges M1's approved `pe/w1-fix@3f00b57` into `pe/w1-fix-m2` and may restructure the toast DOM in
    `Toast.tsx` (a generic "action toasts pinned outside the scroll box" rule).
  - Unchanged: `toastLiftBottom()`/`useToastAbove()` logic. `flow.ts`, `progress/**` and `integrity.spec.ts` stay untouched.
  - The combined revision (r6) gets a fresh independent Checker as one unit, re-confirming I03 placement and M1's behaviour.
    M1's `3f00b57` APPROVE stays on record but no longer covers the shipping code by itself once `Toast.tsx` changes.
  - Retests must use real input **and real toast timers**.
  - r5 review worktrees removed.

- 2026-10-10 ~09:38 UTC: a container restart stopped M2 mid-r6.
  - Worktrees survived. M2 had merged `pe/w1-fix` into its branch (`ca23385`) and had an uncommitted `Toast.module.css`
    edit.
  - Preserved as WIP `db8220e` (NOT READY FOR REVIEW) and archived (`archive/pe-w1-fix-m2-r6wip.incremental.bundle`).
  - M2 resumed with context intact.

- 2026-10-10: **user ordered a pause at M2's round-6 submission.** M2 let its running race and natural-expiry
  probes finish and completed r6 with the user's packet items (a)–(f): **READY FOR REVIEW** `51521cf`. Not reviewed. The
  round-6 checkpoint at the top has all details. One orphaned M2 wait loop, for a probe that was no longer running and had
  no log, was stopped by PID.

- 2026-10-10 18:16–23:10 UTC: **parallel fresh review of round 6** (lead Checker + lanes L1–L4), user-bounded.
  - Prep: trial merge `e866118` (src `05bb3f8`); R6, R5 and INT servers verified byte-for-byte; a browser-slot gate
    capped at nproc−1 = 3.
  - User adjustments mid-run: no regression on R6; a 60-minute time box for L1–L3; Opus 5.5 for any new agent; the
    lead verifies diagnoses itself.
  - **Lead verdict: REJECT (LEAD-D1).**
  - Run stopped. Defect packet and options: `round6-review/DEFECT-PACKET-AND-OPTIONS.md`.

## Exact next action

See the "STOPPED" section at the top: a user decision on architecture A/B/C for the storage-full warning, then round 7,
a fresh review and the regression.
