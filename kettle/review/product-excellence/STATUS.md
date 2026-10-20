# Product Excellence — execution status (durable checkpoint)

Resume here after any interruption. Do not overwrite past verdicts; append.

## Authority and restore point

- **Authorized:** user execution authorization, 2026-10-07 ("BEGIN THE KETTLE PRODUCT EXCELLENCE BUILD").
- **Source of truth:** approved package `INTEGRATED-2026-10-06` (independent APPROVE 131/140; all 28 reviewed canonical hashes verified in preflight). Extracted locally at `kettle/.tmp/pkg/kettle-excellence-integrated/` (git-ignored; not app source).
- **Protected pre-rebuild restore point:** `8f1044a` (local annotated tag `pre-product-excellence`; the session's git proxy refuses tag pushes, so on the remote it stays reachable as an ancestor of the integration branch, which is never rewritten). Never reset or rewrite past it.
- **Integration branch:** `claude/wizardly-galileo-uy89d9`. Maker branches are local `pe/*` worktrees, merged only after an independent APPROVE.
- **Orchestrator / model:** Claude Opus 5.5 (`claude-opus-5-5`, verified via session metadata). Makers, Checkers and the Final Product Boss are separate agent instances with their own context; a Checker never reviews work it built.

## ▶ W3R3 · NEW 2D CHAI MASTERS · started 2026-10-20 01:05 UTC (read this first)

**Binding:** `contracts/W3R3/VB-DECISIONS-W3R3.md`. The Final Product Boss stays on hold. Gate record: `contracts/W3R3/review/GATE.md`.

- **Masters:** Vibei's upload `f034205` adds `art-src/chai/2d-v2/chai-{reading,sipping,cheering}.png` (992×1586). Integration HEAD is `f034205`; app unchanged (src `5f504d4`).
- **Maker C2** (Sonnet) handed back `17f5a70`, gate passed. Trial **`4e9961f`** on :5621/:5622: tsc 0, vitest 342/342, three WebPs totalling 58,010 B (≤ 61,476), footprint Δ ≤ 0.47 px.
- **Points for LEAD:** a non-uniform stretch (cheering +3.9 %); WebP only, with no fallback; the shadow only via the Stage CSS; 1.25× density.
- **Now:** capture lane **K** (Sonnet, stop 04:00) and **LEAD-7** (Opus, stop 05:00) are reviewing.
- **Then:** the gate and trial; a Sonnet capture lane (REFERENCE → BEFORE → AFTER, edge close-ups, a pose-switch sequence); LEAD (Opus) with one fix round at most; merge on APPROVE; full regression; report.
- **Servers:** integration :5560/:5570 (BEFORE); trial :5621/:5622 (AFTER). C2 :5611 stopped.

## W3R2 HARDENING ROUND · CLOSED 2026-10-18

**Binding:** `contracts/W3R2/VB-DECISIONS-W3R2.md`. **The Final Product Boss stays on hold** until Vibei says go. Plan: `contracts/W3R2/PLAN.md`; gate record: `contracts/W3R2/review/GATE.md`.

- **All three items are APPROVED and merged.**
- **Full regression** on the merged tree `1c791f3` (Lane RF, `review/FINAL/RECEIPT-FINAL-W3R2.md`): green, apart from three intermittent full-run failures. LEAD-5 classified all three as pre-existing flakes, not W3R2 regressions (`CHECKER-W3R2-FINAL.md`); its matched full run gave 239/239.
- **Integration HEAD:** app `72214c8` (src `5f504d4`). **Nothing is running.**

- **Item 1, stale-tab guard (SG): APPROVE `4b2690f`** after one fix round (LEAD-5) → **merged `72214c8`**. Lane R2's rerun on trial 2 was green. `pwa:85` was ruled an environment artifact (a stray preview held the PWA port); LEAD-5's clean-port pwa run gave 3/3.
- **Item 2, `Toast.tsx:482` hook (TH): APPROVE** (LEAD-5) → **merged `7cb3242`**.
- **Item 3, test stability (TS): APPROVE `89396e8`** after one fix round (LEAD-6) → **merged `a391cdc`**.
- **Full regression done:** Lane RF on `1c791f3`, then LEAD-5's classification. No W3R2 regression; the round is closed.
- **FOLLOW-UPs from the final classification:**
  - the I03 test should wait for Today before filling storage;
  - **product edge:** when Today first opens while storage is full, the failed `lastVisit` save keeps the storage-full banner up until Today is reopened;
  - the Settings "Reset everything" sheet exit held over 10 s (1 in 15);
  - the 3D model-load budget under load.
- **FOLLOW-UPs logged:**
  - R8, the Today dock switching mode after boot at 844×390 @200 % (product, pre-existing);
  - the doubly stale same-brew +5 loss;
  - the composer label.
- **Integration HEAD:** app `72214c8` (src `5f504d4`); all three W3R2 items merged.
- **Also FOLLOW-UP:** `pwa.spec.ts` should refuse a port that already answers, and its `afterAll` leaves the preview running (LEAD-5).
- **Then:** merges on APPROVE only, a full regression on the merged tree (Lane RF, Sonnet), and the report to Vibei.
- **Not this round:** the composer label quirk (for the Final Boss), the low-tier backdrop still vs live (Vibei's phone check), band collapse only off-screen (post-Boss polish).
- **Servers:** integration :5560/:5570; old base :5478/:5488; makers :5581, :5582, :5583.

## ▶ WAVE 3 ROUND 1 · started 2026-10-14 10:00 UTC (read this first)

**Now (2026-10-15 13:35 UTC): Vibei's post-follow-up items 1–3 are DONE; the Final Product Boss is on hold (item 4).**
- **Item 1, F1 fix: MERGED `5f78af1`** (src `b74e6b3`).
  - The first pass `74138d3` was REJECTed for F1X-D1 (`syncIdleLength`); the fix round `10ecf2c` got APPROVE (LEAD-5 `26b37bc`).
  - Post-merge regression (Lane R, `review/POSTMERGE-F1/`) is green apart from three first-run failures under load 13–20. LEAD-5 classified them as flaky and not caused by F1 (test timing, reproduced identically on base), so the APPROVE stands (`4619d21`).
- **Item 2, backdrop:** report only, done. It is capture timing (pre-rendered still vs faded-in live canvas) and pre-existing. Receipt `review/BACKDROP/RECEIPT-BACKDROP.md`.
- **Item 3, N-2: CLOSED as a probe artifact** (LEAD-5's own W2R3 wheel), with no product change. Guard spec `tests/w3-history-focus-scroll.spec.ts` merged (`d71fcfa`, APPROVE `2a46721`). The stale `notice-strip` comment was fixed (`3e7b189`).
- **Item 4:** the Final Product Boss is on hold until Vibei's go, after the 2D sipping and cheering poses.
- **FOLLOW-UPs for Vibei to schedule:**
  - one `sync.ts` receiving-side guard covering `rebase`, the person's own actions in a stale tab, and a typed edit in a doubly stale tab;
  - the Today composer label overwrite (low priority);
  - `NoticeStrip`'s conditional `useIsPresent()` hook (`Toast.tsx:482`, a React hook-order error logged in dev/e2e; pre-existing);
  - test-only: `timer:156`/`:183` observer ordering, and `notice-strip` `press()` re-aim;
  - post-Final-Boss polish: collapse the band "only off-screen or on a screen change".
- **Integration HEAD:** app `5f78af1` (src `b74e6b3`), tests `3e7b189`. Nothing is running: servers, agents and the autocommit loop are all stopped.

**Before the Final Product Boss: Vibei's post-follow-up decisions (2026-10-15 08:55 UTC; `contracts/W3R1/VB-DECISIONS-POSTFOLLOWUP.md`):**
- **Item 1: the `integrity:309` fix.**
  - **Maker:** fix maker F1X (Opus, high) on `pe/w3r1-f1-intention`, worktree `w6x`, :5561; brief `BRIEF-F1FIX.md`; stop 11:30 UTC.
  - **Fix:** `setIntention` writes only the intention, with the storage format unchanged.
  - **Proof:** a deterministic test that fails on base and passes on the fix; `integrity:309` 20/20 under load.
  - **Audit:** the other full-state writers, listed but not fixed.
  - **Then:** the Sonnet regression lane (timer/PWA, full integrity, notice suite, a 2-tab manual check), then LEAD-5's verdict, and merge only on APPROVE.
- **Item 2: backdrop investigation.** Investigator BD (Sonnet) bisects the 390 dark first-brew backdrop difference. Report only; brief `BRIEF-BACKDROP.md`; stop 11:00 UTC.
- **Item 3: N-2 (History focus scroll).** A Sonnet fix maker, after item 1 merges; LEAD-5 gates it separately.
- **Item 4: the Final Product Boss is on hold.** Vibei is generating the 2D sipping and cheering poses first.
- **Servers:** base :5478/:5488; current integration (app `f2298d3`) :5560/:5570 (worktree `w6-int`).

**W3R1 follow-ups done; waiting on Vibei (2026-10-15 02:50 UTC):**
- **Item 2, band idle 1.2 → 4 s:** Maker Q Phase A, APPROVE (LEAD-5: 0/64 aimed taps off target, `w3-notices` + idle 42/42). Merged as `8b1ed4d`.
- **Item 3, test stability:** Maker Q Phase B, tests only, APPROVE (LEAD-5 under load: `notice-strip:292` 6/6, X-1 10/10, `w2-room:167` 3/3, `notice-strip` 25/25, `w3-notices-load` 25/25). Merged as `f2298d3`. X-11 and X-1 are closed.
- **F1, `integrity:309`: a pre-existing product race, severity medium.**
  - **Mechanism:** `Composer.tsx:83–86` syncs the intention 150 ms after Today mounts → `src/timer/store.ts:399 setIntention` → `persist` writes the tab's whole stale idle timer over a brew another tab just started → the brew is lost in both tabs, with no record.
  - Reproduced 3/20 and 2/12 under load, and 1/20 on base `4d36939`. Note: `contracts/W3R1/review/F1-ROOT-CAUSE.md`. No product change made.
  - **Waiting on Vibei:** authorise a fix before the Final Product Boss (it touches `src/timer` and/or `Composer.tsx`).
- **Still open, smaller:** N-2 (the History focus scroll, product side, S's file); the follow-up "collapse only off-screen or on a screen change" (post-Final-Boss polish round).
- **Integration HEAD app code `f2298d3`** (src `db6de7e`). Nothing is running. **The Final Product Boss has not started** (Vibei's go needed).

**W3R1 final regression and Vibei's follow-ups (2026-10-15 00:05 UTC):**
- **Final regression on `2be3de1`** (Lane R, `contracts/W3R1/review/FINAL/RECEIPT-FINAL.md`, through `a2b00cd`):
  - tsc 0; vitest 302/302; build OK.
  - Chromium without `notice-strip`: 243 tests, **215 passed, 3 failed**, 25 skipped (`w3-notices-load`, gated). Of the 3:
    - **F3 `w2-room:167`:** flaky (load timeout; 30.4 s to scene-ready).
    - **F1 `integrity:309`:** **open finding** (1/6 under load; mechanism unknown).
    - **F2 `integrity:1017`:** X-1, not reproduced in 21 runs.
  - `notice-strip` **25/25** (including `:292`).
  - timer/pwa 29 + 2 skipped.
  - `w3-notices-load` (`W3_LOAD=1`): 23/25. The 2 failures happen identically on base: a stale control copy.
  - **X-7:** only G's Haptics wrap (+16.98 px below it).
  - Captures: S's and G's changes, plus one unisolated 390 dark first-brew backdrop difference.
- **Vibei's decisions** (`contracts/W3R1/VB-DECISIONS-FINAL.md`):
  - N kept.
  - F's idle wait goes to 4 s (follow-up).
  - One test-stability task before the Final Product Boss.
  - F1 is a real finding unless shown flaky.
  - **No Final Product Boss until Vibei says so.**
- **Maker Q** (Opus, high; `pe/w3r1-stability`, worktree `w5q`, :5545; brief `BRIEF-Q.md`):
  - Phase A: idle 1.2 → 4 s (stop 00:55).
  - Phase B: `notice-strip:292`, the 4-minute timeouts, `integrity:1017`, F1 root cause (stop 02:55).
  - LEAD-5 verifies; merge on APPROVE.

**W3R1 state (2026-10-14 22:30 UTC):** all four makers are APPROVE and merged. Only the final regression is still running.

| Maker | Verdict | Merge |
|---|---|---|
| N | APPROVE (eye contrast: vb's call) | `3faaf94` |
| G | APPROVE after its fix round (G-D1…D4) | `25b5e26`, plus docs `a859d86` |
| S | APPROVE after its fix round (S-D1) | `0efca36` |
| X-2 (G's pressed-segment test, test only) | APPROVE | `60fdb7e` |
| F | APPROVE after its fix round (F-D1…D3, C-1) | `2be3de1` = the final tree |

- **X-11** (`notice-strip:292` at 1440 light @200 reduced, test only): not achieved, nothing merged. It stays known flaky, with three signatures (`CHECKER-W3R1-CROSS.md` §7).
- **Final regression:** on `2be3de1` (worktree `w5-final`, :5540/:5550), Lane R (Sonnet), receipt `contracts/W3R1/review/FINAL/RECEIPT-FINAL.md`.
  - Done so far: tsc 0; vitest 302/302; build OK; full chromium (without `notice-strip`) 215 passed, 3 failed (`integrity:309`, `integrity:1017` (X-1), `w2-room:167`), being classified.
  - Interrupted at ~21:00 by a usage limit and a container restart; resumed at 22:30.

**Resume after the usage-limit cutoff (2026-10-14 ~16:45 UTC):**
- **What was cut:** at about 14:40 UTC a usage limit stopped LEAD-4, Lane I, Lane I2 and Lane R. The container then restarted.
- **Inventory:** `contracts/W3R1/review/INVENTORY-RESUME.md`.
  - COMPLETE: N's verdict (**APPROVE** by LEAD-4, with the eye contrast as Vibei's call), Lane R's N receipt, Lane I's G receipt.
  - MISSING: the S, F and combined receipts, and the G, S and F verdicts.
- **Infrastructure:** all trial servers are back and verified (base :5478/:5488, F :5521, S :5522, G :5523, N :5524, combined :5520). The slot gate is reset (nproc−1 = 3). Autocommit is restarted. The four single-maker trial merges are now bundled.
- **Vibei's decisions:** `contracts/W3R1/VB-DECISIONS-RESUME.md`.
  - N's eyes: vb's call.
  - S: "Last 7 days" accepted, with the calendar logic unchanged.
  - F: the band must collapse when idle, or F goes to a fix round.
  - G: a fix round with four text fixes.
- **Fresh agents:** LEAD-5 (Opus; G now, then S and F); Lane I (Opus; S, with every `ui/Sheet.*` user and a calendar-week test); Lane I2 (Opus; F, reusing the partial evidence); Lane R (Sonnet; the combined regression, reusing parts A and timer/pwa). Every receipt and verdict is written and committed section by section.

**Brief:** polish, Settings, Stats/History and supportive return. Base: the integration branch at app code `4d36939`. The plan, ownership map, glossary and briefs are in `contracts/W3R1/` (`PLAN.md`, `BRIEF-{F,S,G,N}.md`).

**Vibei's decisions:**
- F-T2-1, Chai's night readability and all "warm streak" wording are fixed this round.
- Vibei has deleted the backup branch `pe/w2r3-notices`. No pushes outside the integration branch.

**Makers** (Opus, high effort; every agent commits locally only):

| Maker | Scope | Worktree / branch | Dev port | Hard stop (UTC) |
|---|---|---|---|---|
| **F** | Notices polish (F-T2-1, triage of F-T2-2/F-T2-8/N-1–N-3), Today copy, warm-days wording, I13 | `w5f` · `pe/w3-notices-polish` | :5501 | 13:00 |
| **S** | Stats and History (I12), F-T2-4, the backup round-trip test | `w5s` · `pe/w3-stats` | :5502 | 13:00 |
| **G** | Settings and shared controls (I11) | `w5g` · `pe/w3-settings` | :5503 | 12:30 |
| **N** | Chai night readability (scene only) | `w5n` · `pe/w3-chai-night` | :5504 | 12:00 |

**Overlaps, split by file:**
- **The warm-days wording:** F's item. The strings in files S and G own are changed by S and G, using the shared glossary.
- **I13's lines inside Stats:** worded by S.
- **`ui/Sheet.*`:** moved to S for F-T2-4.

**Base servers:** `4d36939` in `/home/user/wt/w4-final`, dev :5478 / preview :5488.

**Review plan:** LEAD-4 (Opus, new); Lane I (Opus: interaction and visuals for F, S and G); Lane R (Sonnet: suites, the capture matrix, N's captures and performance) on per-maker trials and a combined trial. Merge only on APPROVE, then the final regression on the merged tree.

## ■ WAVE 2 ROUND 3 CLOSED · 2026-10-14 ~05:50 UTC (read this first)

Integration `claude/wizardly-galileo-uy89d9` now contains **C, B and T2**. App code is `4d36939` (kettle/src `5cd9a44`, kettle/tests `d641e59`). Nothing is running and the slot gate is reset.

**Verdicts and merges:**

| Work | Verdict | Revision | Merge |
|---|---|---|---|
| **C** (3D Chai, `MODEL_ON_LOW=true`) | Vibei's sign-off; the targeted regression passed (`W2R2/review/LRC/RECEIPT-LRC.md`) | `pe/w2r2-chai3d@6fb2136` | **`61aba17`** |
| **B** (badge rename "Warm Streak" → "Warm Days", display name only) | **APPROVE** (`W2R3/CHECKER-W2R3-B.md`) | `pe/w2r3-badge@2994005` | **`8df3076`** |
| **T2** (notices without overlays, I10) | First review REJECT (T2-D1). One fix round, then **APPROVE (final)** (`W2R3/CHECKER-W2R3-T2.md`) | `pe/w2r3-notices@64f29cd` (code `40f92b6`) | **`4d36939`**: src and tests equal trial `99d9368` |

**Final regression** on `4d36939` (`W2R3/review/FINAL/README.md`):
- tsc 0; vitest **290/290**; build OK; timer/pwa **29 + 2 skipped**.
- Full chromium **179/181**, with two failures, each re-run once:
  1. `integrity:768`: a transient on-screen read under load. Data was restored exactly. Re-runs pass 3/3 on merged and 3/3 on base. **FOLLOW-UP** (test robustness).
  2. `notice-strip`, 1440×900 @200 reduced motion: **fails 2/2** (also alone). The cause is **F-T2-1**: the strip's at-rest exit shifts the page 60 px just before the tap. Vibei ruled F-T2-1 a follow-up, so **this one configuration stays red until the polish round**. The test is not skipped.

**Follow-ups closed by T2:**
- W2H-D1: Brew length restored, ≥ 24×24, in view;
- Mark done covered by notices or by the End sheet's frozen frame;
- notices over the Ambience sheet;
- folded notices losing their icon and amount (folding is gone);
- the Next-brew badge over the status line;
- `break-reach:179` (the recipe-day notice over Break's over, Monday and Thursday);
- B-F6 (the badge and "Saved…" notices over the tag chips and Brew length);
- T2-D1.

R5-D1, LEAD-D1, R7-D1 and D4 still pass.

**Waiting on Vibei:**
1. **F-T2-1** (strips change only between interactions): it now keeps `notice-strip` 1440 @200 reduced-motion red. Either accept the red test until the polish round, or authorise a small fix sooner.
2. **The fur readability follow-up for C** (evening and night light).
3. **B-F2 / B-F3 wording:** the badge description "Keep a {n}-day warm streak", and the other "warm streak" wording.
4. **Other follow-ups:** F-T2-2 (200 % short screens push the session readout below the fold), F-T2-4 ("Delete this brew?" at 375×667 @200; Stats/History round), F-T2-8, N-1, N-2 and N-3 (`CHECKER-W2R3-T2.md` §7).
5. **The remote branch `pe/w2r3-notices`** (the off-container backup): Vibei deletes it now that the round is closed.

**Incidents:**
- Two container restarts, at about 00:40 and 04:40 UTC.
- After the first: the T2 WIP was saved as `3462b93`, and Vibei granted a fresh fix window (02:23–03:53).
- After the second: Lane R's receipt was closed by an orchestrator note (B.9), and the orchestrator ran gap runs (`review/ORCH/`: w2-home 18/18, toast-room 14/14).

**Models used in round 3:**
- **Lead:** LEAD-3 on Opus 5.5.
- **Makers:** T2 and B on Opus 5.5, high effort; the C flip by Maker C on Opus 5.5.
- **Lanes:**
  - Lane T on Opus 5.5;
  - Lanes B and R on Sonnet 5.5;
  - the C regression lane (LRC) on Sonnet 5.5.

## ▶ VIBEI'S DECISIONS AFTER W2R2, AND WAVE 2 ROUND 3 · 2026-10-13 18:30 UTC (read this first)

**Decisions:**
1. **C** (`pe/w2r2-chai3d@2843fb0`): Vibei signs off. Before merging, set `MODEL_ON_LOW` to true, because the model has fewer triangles and draw calls than the procedural Chai. Then run a targeted regression for C:
   - the fallback tests;
   - `w2-room`;
   - Nook and unlock captures;
   - frame time and memory against the procedural Chai on the low tier.

   Then merge.
   - **Follow-up for a later polish round:** in evening and night light, make the fur easier to read (a lighter base or a stronger self-fill) so the eyes and nose separate from the body as clearly as in the day renders.
2. **Ruling R-3 is rejected.** No toast may cover a control or a list row anywhere.
3. **The toast architecture is replaced.** No floating toasts.
   - **Undo:** inline in the row or control the person acted on, at their scroll position, for its normal duration, and announced once.
   - **Every other notice:** goes in one in-flow notice strip per screen. The strip takes layout space and pushes content down. One notice at a time, the rest queued; the update prompt never blocks others.
   - **The storage banner:** unchanged.

**Round 3** (base: the integration branch after C merges). Lead: a new Opus lead. Makers: Opus, high effort. Lane T: Opus. Lanes R and B: Sonnet.
- **Maker T2, notices without overlays** (I10; 4 h). It reuses the announcer, timer pausing and queue from `pe/w2r2-toast@6f9756c`, and closes:
  - W2H-D1 (Brew length from `acf1c6a`);
  - Mark done covered by toasts or the End sheet header;
  - toasts over the Ambience sheet;
  - folded toasts;
  - the Next-brew badge over the status line;
  - `break-reach:179`.

  Invariant: zero overlap between any notice and any control, text or list row. R5-D1, LEAD-D1, R7-D1 and D4 stay passing.
- **Maker B, badge rename** (45 min): "Warm Streak" → "Warm Days" (display name only, migration-safe).

**Container restart and Vibei's decisions (2026-10-14 02:23 UTC):**
- **Restart (~00:40 UTC):** it killed every server and agent. Maker T2's uncommitted fix-round work was saved unreviewed as WIP `3462b93` on `pe/w2r3-notices`. That push also created the remote branch `pe/w2r3-notices` by mistake.
- **Vibei's decisions:**
  1. Keep `pe/w2r3-notices` on the remote as the off-container backup of T2's WIP; Vibei deletes it after the round closes. No other pushes outside `claude/wizardly-galileo-uy89d9`.
  2. Commands are allowed again.
  3. **T2 gets a fresh 90-minute fix window from 02:23 UTC (hard stop 03:53 UTC)**, continuing from WIP `3462b93`. It is still T2's one fix round.
  4. **Approved direction for T2-D1:**
     - no notice strip on the summary (`/done`), and no update prompt during a brew (`/focus`) or on the summary;
     - queued notices are never dropped: they appear in order once the person reaches a screen with a strip (for example Today), and are announced once;
     - **acceptance:** the summary sheet never moves when a notice is queued, at every size, text size and theme, including 375×667 at 200 %.
  5. **Follow-ups, not blockers this round:**
     - "Delete this brew?" is unreachable at 375×667 @200. It is pre-existing and goes to the Stats/History round (F-T2-4).
     - Notices shift content as a finger lands. This needs a rule that strips only appear between interactions; it goes to the next polish round (F-T2-1).
- **Plan from here:** restart servers and the slot gate → Maker T2 fix → gate → Lane T (Opus) plus the targeted part of Lane R (Sonnet) → the lead's verdict → merge only on APPROVE → final regression → STATUS → final message.

**T2 fix round (2026-10-14 03:40 UTC):**
- **Hand-back:** Maker T2 handed back at 03:31 UTC (stop 03:53): `pe/w2r3-notices@64f29cd`, code `40f92b6`, kettle/src `aa88587` (same src as WIP `3462b93`).
  - **Src changes vs `6a64fbf`:** `FocusScreen.tsx` / `.module.css` (no strip on the summary) and `ShellOverlays.tsx` (the update prompt waits on `/focus` and `/done`).
  - **Tests:** new `summary-notice.spec.ts`; `notice-strip` and `a11y:332` now expect the notice queued, not drawn, on the summary.
- **Gate passed.** Trial `99d9368` = `8af5430` + `64f29cd`, worktree `/home/user/wt/w4tr-t2f`, src `5cd9a44`, dev :5477 / preview :5487, verified. The servers for `490ca97` (:5476 / :5486) are back up for the controls. Archived: `pe-w2r3-notices-fix-64f29cd` and `w2r3-trial-t2f-99d9368`.
- **Running:**
  - Lane T (Opus): targeted re-review, `RECEIPT-LT-FIX.md`, stop 05:10;
  - Lane R (Sonnet): targeted regression, `RECEIPT-LR.md`, stop 04:55;
  - LEAD-3 (Opus): its own T2-D1 re-check, then the final verdict.

**Round 3 status (2026-10-14 00:30 UTC):**
- **C:** merged as `61aba17` (`MODEL_ON_LOW=true`). It is identical to the trial that passed Lane R's targeted regression.
- **B:** APPROVE, merged as `8df3076`.
- **T2:** gated as trial `490ca97`. The lead's draft verdict is **REJECT** with one blocker, T2-D1: a notice on the summary, typically the update prompt in its first frame, pushes P's sheet down, so a gap opens, rows sit under the footer and at 200 % the content leaves the screen. T2's single 90-minute fix round started at 00:28 UTC (hard stop 01:58).
- **Lanes:** Lane T (Opus) and Lane R (Sonnet) are running on `490ca97`.

**Progress:** Maker C was resumed at 18:32 to flip `MODEL_ON_LOW` (budget 45 min). The control `b377c62` is back on :5410 / :5430. The round-2 trial worktrees are removed.

## ■ WAVE 2 ROUND 2 CLOSED · 2026-10-13 ~15:50 UTC (read this first)

Integration `claude/wizardly-galileo-uy89d9` contains **P only**. App code `2f67fc1` = `b377c62` + P. Nothing is running and the slot gate is reset.

**Verdicts:**

| Maker | Verdict | Revision | Merge |
|---|---|---|---|
| **P** (summary polish, I07) | **APPROVE** | `pe/w2r2-summary@dc7a28d` (code `a4f1773`, src `f255e9f`) | **Merged** as `2f67fc1` |
| **C** (3D Chai, I06) | **APPROVE** | `pe/w2r2-chai3d@2843fb0` (code `c698d74`, src `42b2c1c`) | **Not merged; it waits for Vibei's art sign-off** |
| **T** (toast architecture, I10) | **REJECT**, then **final REJECT** after its one fix round | `pe/w2r2-toast@4620796`, then `@6f9756c` (code `887696e`) | Not merged; branch archived |

Verdict files: `contracts/W2R2/CHECKER-W2R2-{P,C,T}.md`.

**Models used:**
- **Lead:** LEAD-1 ran on Fable 5.1. It ran the design gate and was stopped by a usage limit, then replaced per Vibei's model change. LEAD-2 ran on Opus 5.5.
- **Makers:** T, P and C all ran on Opus 5.5, high effort.
- **Lanes:**
  - Lane P ran on Opus 5.5 first (stopped) and was rerun on Sonnet 5.5.
  - Lane C and Lane R ran on Sonnet 5.5.
  - Lane T ran on Opus 5.5.

**TOAST-ARCHITECTURE.md:** `contracts/W2R2/T/TOAST-ARCHITECTURE.md`, also on `pe/w2r2-toast@dabc8f3`.
- **Decision:** APPROVED with rulings by LEAD-1 (`DESIGN-GATE-T.md`), then AMENDED A–E by LEAD-2 (`DESIGN-GATE-T-RECONFIRM.md`):
  - A: the stage stack is top-aligned;
  - B: an Undo is drawn where the person tapped;
  - C: the composer zone is allowed;
  - D: a light-DOM announcer;
  - E: a loop-guard proof, with the summary proofs run on T+P.
- **Implementation:** rejected. Invariant 1 still fails intermittently: in `notice-zone.spec.ts:150` End→Today, "Saved…" covers the tag chips, Brew length or Mark done in 15 of 20 samples at 390×844 @200 and 375×667 @100. The proof set is also incomplete.
- **What the fix round got right, kept on the branch for the next toast round:**
  - Undo is drawn where it was raised;
  - the R-3 fallback (Undo at the base position on screens with no zone);
  - an 8 px + safe-area edge inset;
  - the light-DOM announcer;
  - `integrity :1090` 9/9.

**Regression on the final merged tree `2f67fc1`** (`review/LR/final-merged-2f67fc1/`):
- chromium **104/105**, 0 skipped. The 1 failure is `integrity.spec.ts:768` (export → reset → import, load timing). Rerun alone, it passed 3/3 on both the final tree and the base.
- timer-harness, timer-app and pwa **29 passed + 2 skipped** by design (`timer.spec.ts:295`, `:439`, harness-only).
- tsc 0; vitest **278/278**.
- The P+C combined trial `032d7a5` (Lane R, Sonnet): chromium 113/113, vitest 288/288, timer/pwa 29 + 2, smoke clean. LEAD-2's regression review: of 60 capture pairs over 0.5 %, 20 are P's intended change and 40 are noise; no defect (`REGRESSION-REVIEW.md`).

**Follow-ups closed this round:** only P's summary items.
- Round 1's opening lift left Chai and the kettle covered by the sheet on arrival (stacked phones covered in 20 of 24 runs; now 24/24 whole).
- The milestone card was louder than the minutes and Tea time.
- The summary used "streak" wording; it now uses "warm days".

**Toast follow-ups stay open** (T not merged): Wave-1 #2 (Brew length under the dock), #3 (Ambience), #4 (folded toasts), #5, #6, #7 (statusbar), #9 (`:1090`), End sheet lingering (b), Next-brew badge (e) and `break-reach:179` (f).

**`break-reach.spec.ts:179`, the real cause** (T's seven-weekday sweep, confirmed by Lane T):
- On recipe-completion days (Monday and Thursday), a "Recipe done: Take a full tea break" notice lands on Break's over over the panel.
- It takes the wheel and touch gesture, so "Put the kettle on" can't be scrolled into view at 200 % text.
- This is a real user-facing cover (the D4 pattern), not a test artefact.
- It is fixed only on T's rejected branch.

**BEFORE/AFTER pairs for Vibei:**
- **P (merged):** `contracts/W2R2/P/captures/{BEFORE,AFTER}/375x667-light-t100/04-summary-task-settled.png`.
- **C (pending sign-off):** `contracts/W2R2/VIBEI-SIGNOFF-C/390x844-light-day-10-nook-3d-{BEFORE,AFTER}.png` and `ART-REVIEW-SHEET.png`. The 1440 pair and the model renders are in the same folder.

**Waiting on Vibei:**
1. **C's art sign-off.** Under the warm room light the fur reads darker and warmer than on the sheet. At scale 1.12 the new Chai is the same height and about 70 % as wide. If you approve, merge `pe/w2r2-chai3d@2843fb0`; the P+C tree has already passed Lane R.
2. **Owner decision:** `MODEL_ON_LOW=false`. Low-tier phones, including many iOS and 4-core devices, keep the old 3D Chai until a real low-end phone is measured.
3. **Confirm ruling R-3** for the next toast round: Undo falls back to the base position above the tab bar on Stats and Settings, a narrow exception to "no toast covers a control".
4. **Note P's accepted trade-offs:**
   - at 375×667, on the task/unlock days and at 200 %, the highlight starts one scroll away;
   - on the first brew at 390×844, "Make Kettle yours" is one scroll away.
5. **Next round:** the toast architecture (T's branch as the starting point), and the "Warm Streak" → "Warm Days" rename (display name only).

## (resume log) ▶ WAVE 2 ROUND 2: resumed 2026-10-13 09:40 UTC after a usage limit (read this first)

**Model change from Vibei:** Fable is no longer used for any role.
- **Lead:** a new Opus lead (LEAD-2). It re-confirms or amends LEAD-1's design ruling on `dabc8f3` before any verdict.
- **Makers T and C:** Opus, high effort.
- **Lane T:** Opus.
- **Lanes P, C and R:** Sonnet. They record raw evidence only; the lead verifies every diagnosis and every visual judgement.

**State at resume:**
- **P:** READY and gated. Trial `d07bd2d` serves on :5442 / :5452; it was rebuilt this session and verified. Its first Lane P run left only probe scripts, so Lane P is rerunning on Sonnet (75 minutes).
- **T:** 8 commits up to `127526e`, plus WIP `a599ee1` saved by the orchestrator (packet draft and runs). Resumed with 2 hours, to about 11:46 UTC.
- **C:** code `c698d74` (src `42b2c1c`), plus evidence and WIP `d59e015`. Resumed with 90 minutes, to about 11:16 UTC.
  - Everything is done except one open diagnosis: the `w2-room` context-loss test fails on C and passes on the control.
  - The model loads only on the high tier (`MODEL_ON_LOW=false`), so the default stays procedural on the low tier.
- **Servers:** all were down after a container restart. The control `b377c62` (:5410 / :5430) and the P trial are rebuilt and verified.

**Verdicts** (LEAD-2, Opus):

| Maker | Verdict | Revision | Status |
|---|---|---|---|
| **P** | **APPROVE** | `pe/w2r2-summary@dc7a28d` | **Merged** as `2f67fc1`; its tree equals trial `d07bd2d` |
| **C** | **APPROVE** | `pe/w2r2-chai3d@2843fb0` | **Not merged**: it waits for Vibei's art sign-off. Owner decision for Vibei: `MODEL_ON_LOW=false` |
| **T** | **REJECT** | `4620796` | Defects T-D1 to T-D6. Its one 90-minute fix round started at 12:05 UTC (hard stop 13:35), followed by a targeted re-review by Lane T (Opus) and the lead. |

- **Ruling R-3 needs Vibei's confirmation.** For Undo notices on screens with no zone (Stats, Settings), the lead ruled that the notice falls back to the base's position above the tab bar. That narrowly relaxes the brief's "no toast ever covers a control". The rows it can cover are follow-up F-T1.
- **Lane R (Sonnet)** is running on the P+C combined trial `032d7a5` (:5445/:5455).

**Resume 2026-10-13 ~14:58 UTC:** a usage limit (reset 14:30) stopped Lane T and the lead, and the container restarted. Servers were restarted and verified, and the slot gate was reset. Lane T (Opus) and LEAD-2 (Opus) were each resumed once. The final merged-tree suite on `2f67fc1` was restarted (attempt 1 died at test 45). Before the stop, Lane T's notice-zone ×3 run on T's fix trial `a8fb34a` gave 56 passed, 1 failed (`notice-zone.spec.ts:150`, End → Today).

**Follow-up recorded for next round:** rename the badge "Warm Streak" to "Warm Days". Vibei has approved it as a display-name-only change: no ids, stored data or arithmetic change.

## (round 2 start) ▶ WAVE 2 ROUND 2 IN PROGRESS · 2026-10-12 (read this first)

- **Scope:** I10 toast architecture (Maker T), I07 summary polish (Maker P) and I06 3D Chai integration (Maker C).
- **Base:** `b377c62` (src `e0aebbf`).
- **Not authorised:**
  - other follow-ups;
  - new artwork beyond the supplied 3D Chai;
  - paid generation, publishing and PRs;
  - merging anywhere but `claude/wizardly-galileo-uy89d9`.
- **C** also needs Vibei's art sign-off before it can merge.
- **Prep:**
  - The round-1 worktrees are removed; their probes are archived in `archive/w2r1-final-probes-2026-10-12.tar.gz`. 16 GB is free.
  - The slot gate is back to nproc−1 = 3.
  - `assets/chai3d-r1@68caa31`: the `chai.glb` SHA-256 matches `b401bc6c…63d7e`.
- **Control `b377c62`:** `/home/user/wt/w3-base`, dev **:5410**, preview **:5430**, both verified.
- **BEFORE set:** `contracts/W2R2/BEFORE-b377c62/`, made by `r2before.mjs`. It is running and covers three passes:
  - 20 configurations (390×844, 375×667, 844×390, 667×375 and 1440×900 × light/dark × 100/200 %) on Sunday 2026-10-11 07:40Z;
  - the toast flows again on Monday 2026-10-12 (`-mon`). Recipes change by day: Monday shows "Recipe done: Take a full tea break" on Break's over, Sunday shows nothing;
  - night (`-night`) at 390×844 and 1440×900.
- **Makers** (Opus, high effort; file sets disjoint):

  | Maker | Item | Branch | Worktree | Ports | Owns |
  |---|---|---|---|---|---|
  | **T** | I10 toasts, design gate first | `pe/w2r2-toast` | `/home/user/wt/w3t` | 5421/5431 | `src/ui/**`, `screens/home/**`, `screens/focus/**` except `stage/**`, `src/app/**`, toast-related specs |
  | **P** | I07 summary polish | `pe/w2r2-summary` | `/home/user/wt/w3p` | 5422/5432 | `screens/done/**`, `screens/focus/stage/**`, `w2-summary.spec` |
  | **C** | I06 3D Chai | `pe/w2r2-chai3d` (from `68caa31`) | `/home/user/wt/w3c` | 5423/5433 | `src/scene/**`, `screens/nook/**`, `public/**`, `vite.config.ts`, `src/pwa/**` |

- **Next:**
  1. T's design note goes to the lead (APPROVE or REJECT, at most one revision).
  2. Gate each packet.
  3. Review by the lead, plus Lanes T, P, C and R.
  4. Verdicts, with at most one 90-minute fix round per rejected maker.
  5. Merge the approved makers (C after Vibei's sign-off) and run the regression.
  6. Stop.

## ■ WAVE 2 ROUND 1 CLOSED at `b377c62` · 2026-10-12 02:10 UTC (read this first)

Finished in economy mode after the usage-limit pause. Nothing is running, the slot gate is reset, and the gate is capped at 2 browsers.

**Verdicts** (LEAD-2, Opus; LEAD-1 issued the H verdict). Files are in `contracts/W2/`.

| Work | Verdict | Revision | File |
|---|---|---|---|
| **S**, summary: I07 + Wave-1 #1 | **APPROVE** | `pe/w2-summary@e0f511a` (code `f95e0be`, src `6750571`) | `CHECKER-W2-S.md` |
| **N**, room and Nook: I09 + I06 prep | **APPROVE** after its one fix round (N-F1: items floated on the bare sky at brew start; Vibei ruled it not acceptable) | `pe/w2-room@92241c2` (fix `c381ccb`, src `4b49254`) | `CHECKER-W2-N.md` |
| **H**, Home and first visit: I08 + #2 | **REJECT** (W2H-D1). The fix round was cut off by the usage limit, so Vibei's ruling split H | `pe/w2-home@acf1c6a` (fix WIP `4baf228`), archived, unmerged | `CHECKER-W2-H.md` |
| **First visit only**, split from H | **APPROVE** | `pe/w2-firstvisit@1b38509` (src `58aac00`; welcome files byte-identical to H's `7a961b7`) | `CHECKER-W2-FV.md` |

**Merged into `claude/wizardly-galileo-uy89d9`:**
- `0aeddcd`: first visit;
- `0698bdb`: N;
- `b377c62`: S.

Merged `kettle/src` is `e0aebbf`, identical to tested candidate `c99611a` (src, tests and configs checked).

**Regression on the final tree** (`review/LR/final/`):
- chromium **93 passed, 2 failed, 2 skipped**. The 2 failures are `break-reach.spec.ts:179` @200 % (375×667 light, 390×844 dark). They fail **identically on base `90a11e5`** (2 of 3 variants failed in 2 of 2 runs alone), so they are pre-existing. Not this round.
- timer/pwa **29 passed + 2 skipped** by design.
- tsc 0; vitest **275/275**.
- Reused from Lane R on `248415c` (N+S): smoke, 0 errors; standard capture set, 6 configurations × 21 states, with every pair over 0.5 % classified by the lead (`review/LR/std/`).

**CHAI-3D-SPEC.md:** `kettle/review/product-excellence/contracts/W2/N/CHAI-3D-SPEC.md` on `claude/wizardly-galileo-uy89d9` (from `pe/w2-room`).

**BEFORE/AFTER pairs:**

| Change | BEFORE | AFTER |
|---|---|---|
| Summary ranking and fold | `contracts/W2/review/LEAD/S/375x667-light-t100-atRisk-BEFORE.png` | `…-AFTER.png` |
| First visit | `contracts/W2/BEFORE-90a11e5/375x667-light-t100/00-first-visit.png` | `contracts/W2/review/FV/AFTER-1b38509-5353/375x667-light-t100/00-first-visit.png` |
| Earned items in the 3D-off backdrop | `contracts/W2/BEFORE-90a11e5/390x844-light-t100/02-focus-3doff.png` | `contracts/W2/review/LN/fix/acceptance-backdrop/fxf/390x844-light-t100/off.jpg` |
| Static Nook hint | `contracts/W2/BEFORE-90a11e5/390x844-light-t100/10-nook-static.png` | `contracts/W2/N/captures/AFTER-5d7bb23-5233/390x844-light-t100/10-nook-static.png` |

**Follow-ups added** (owners are in the verdict files):
1. **Brew length / toast coupling, for I10:** toasts anchor to the start panel's height (`[data-toast-above]`, `src/ui/Toast.tsx` `toastLiftBottom`). Moving Brew length into the docked start (#2) lifted End's toasts over Today's Mark done at 390×844 (W2H-D1). Wave-1 #2 (Brew length under the dock, failing tap-target size) therefore **stays open** and must be solved together with the toast round. H's branch is archived (`archive/pe-w2-home-*.bundle`).
2. `break-reach.spec.ts:179` @200 % fails on base too, as of 2026-10-12. It is likely date- or toast-dependent ("Break's over" with recipe toasts): wheel reach of "Put the kettle on".
3. F1: `integrity.spec.ts:1090` and `:1004` waits at 1440 (R7-7 / M7a).
4. At 200 % text, End's toasts already cover Mark done on the base (F2). The End sheet header takes taps over Mark done for 5–15 s after End (F3).
5. 844×390 @100 big day: the unlock picture starts under the fold, same as on the base. The 3D close-up loads slowly under software rendering.
6. N-F3, N-F6, N-F7 and N-F9, plus optional N-F10 hardening (a 74 ms layer blink on a host swap).
7. The Wave-1 list in `WAVE1-CLOSED.md`: #1 is now fixed by S; #3–#14 are unchanged.

## (superseded) ⏸ WAVE 2 ROUND 1 PAUSED: usage limit, 2026-10-12 00:30 UTC (read this first)

At about 00:30 UTC a usage limit stopped every running agent: the lead, Lanes N, S and R, and Maker H in its fix
round. As the brief requires, the orchestrator saved everything, pushed this STATUS and stopped. **Nothing is merged.**
Integration app code is still `90a11e5`. Every server and job is stopped, and the slot gate is reset.

| Maker | Verdict so far | Where it stands |
|---|---|---|
| **N** (`pe/w2-room@fc9f6d8`) | **pending** | The lead finished the diff review, the CHAI-3D-SPEC check and the visual gate. It was reproducing Lane N's loading-order finding when it stopped: item layers paint before the base still, so items float on a bare sky for 1–2.5 s under load. Draft `contracts/W2/CHECKER-W2-N.md` (verdict line is a placeholder); notes in `review/LEAD/N-interim.md`. Lane N's receipt `review/LN/RECEIPT.md` is nearly complete (its end time is unset) |
| **H** (`pe/w2-home@acf1c6a`) | **REJECT, W2H-D1** (`contracts/W2/CHECKER-W2-H.md`, §7 is the defect packet) | The one 90-minute fix round started at 23:46 and was cut off at about 00:30, unfinished and unmeasured. Its edits (`Composer.tsx`, `Home.module.css`) are saved as WIP commit **`4baf228`** on `pe/w2-home` (src `9d6600d`), archived as `archive/pe-w2-home-fixwip-4baf228.incremental.bundle`. About 46 of its 90 minutes remain. Lane H has not started |
| **S** (`pe/w2-summary@e0f511a`) | **pending** | The lead had not started S beyond `review/LEAD/S-interim.md`. Lane S's partial evidence is in `review/LS/` (no receipt yet): `t1090/` (base vs S, see below), `acceptance-table.md`, `analysis.json`, `spot/`, and same-session captures for 7 AFTER and 8 BEFORE configurations in `captures/` |

**Facts gathered before the stop** (raw logs are in the folders named):
- **`integrity.spec.ts:1090`:**
  - On base `90a11e5`, 390×844 passed every run: 16/16 by the lead's count, 9/9 in Lane S's.
  - On S, 390×844 passed 9/9 and 375×667 passed 9/9. At 1440×900, S failed 3 of 9 runs and the base failed 4 of 9: a pre-existing flake (F1, R7-7). S's two earlier failures were also at 1440.
  - On H (before the fix), 390×844 passed 1 of 7.
- **Lane R on combined N+S trial `248415c`** (`review/LR/logs/`):
  - tsc exit 0; vitest **275/275**.
  - chromium **87 passed, 1 failed**: `integrity.spec.ts:1004`, the 1440×900 storage-full banner test. Rerun alone, it failed once in 3 on both the trial and control, so it is a base flake.
  - timer/pwa **29 passed + 2 skipped** by design.
  - Smoke at 390×844 through Home, focus, End, the summary, Skip and the Nook: 0 page errors, and the Nook hint reads "A drawing of your room".
  - The standard capture set had started (job logs `jobA`–`jobC`). No matrix and no receipt yet.
- **Disclosure from Lane N's receipt:** one lane slip. A `pip download` wrote a 6.9 MB wheel file into N's worktree folder `…/W2/N/probes/`. Checked at 00:40: the file is no longer there, it is not tracked on `pe/w2-room`, and N's worktree is clean.

**To resume:** don't re-derive; follow these steps.
1. Restart the servers listed in the table below, then verify them with `/tmp/rv7-servers/verify.sh` or by hash-checking the served sources against each commit.
2. Resume the lead, sending it this section. It must rule on N first, using its own probes plus Lane N's receipt, then on S.
3. Give Maker H the rest of its fix round (about 46 minutes) from `4baf228`. Then Lane H runs the targeted re-review against §7 "Done when".
4. Relaunch Lane S for its missing captures and its receipt, and Lane R for its capture matrix and receipt.
5. Merge only the approved makers. Lane R reruns on the merged tree if it differs from `248415c`.
6. Stop.

Scratch kept in `/tmp/claude-0/{lr,ln,ls}-scratch` survives only while this container lives. Lane and lead probe scripts
are archived in `archive/w2r1-review-probes-2026-10-12.tar.gz`.

| Server | Worktree | Revision | Dev / preview |
|---|---|---|---|
| control | `/home/user/wt/w2-base` | `90a11e5` | :5310 / :5330 |
| trial N | `/home/user/wt/w2t-n` | `2acc218` | :5340 / :5350 |
| trial S | `/home/user/wt/w2t-s` | `3726a71` | :5341 / :5351 |
| trial H | `/home/user/wt/w2t-h` | `4921ee4` (pre-fix) | :5342 / :5352 |
| combined N+S | `/home/user/wt/w2t-c` | `248415c` | :5345 / :5355 |

Each server runs with the worktree's `.tmp/w2.vite.config.ts`. Each preview serves from `/tmp/rv7-servers/dist-<name>`,
which a rebuild recreates.

## (superseded) WAVE 2 ROUND 1 IN PROGRESS · 2026-10-11

- **Decision:** Vibei chose audit direction A ("One Chai, one room") on top of the approved plan. The base is `90a11e5`,
  where Wave 1 closed.
- **Not authorised:**
  - toast changes (follow-ups #3–#4 go to I10);
  - new Chai or room artwork;
  - Three.js material or lighting passes;
  - paid generation, publishing, PRs, or merging anywhere except `claude/wizardly-galileo-uy89d9`.
- **Prep:**
  - 14 archive bundles verified.
  - `rv8-trial` bundled. `pe/r5-control` is kept as a **local branch only**: its bundle would be 281 MB.
  - Round 7–8 scratch deleted, 13 old worktrees removed. The audit-phase1 *worktree* is removed; the branch is
    untouched.
  - Maker worktrees are sparse. About 18 GB was free at the start.
- **Makers** (Opus 5.5, about 20:47 UTC, 2.5 hours each, file sets disjoint):

  | Maker | Item | Branch | Worktree | Port | Owns |
  |---|---|---|---|---|---|
  | **S** | Summary: I07 + follow-up #1 | `pe/w2-summary` | `/home/user/wt/w2s` | 5211 | `screens/done/**`, `FocusScreen.*` (summary container), `whistle.spec`, new spec |
  | **H** | Home and first visit: I08 + #2 | `pe/w2-home` | `/home/user/wt/w2h` | 5212 | `screens/home/**`, `screens/welcome/**`, `a11y.spec` and probes, new spec |
  | **N** | Room and Nook: I09 + I06 prep | `pe/w2-room` | `/home/user/wt/w2n` | 5213 | `scene/**`, `screens/nook/**`, `screens/focus/stage/**`, `scripts/stills/**`, new spec; plus CHAI-3D-SPEC.md |

- **Control `90a11e5`:** :5310 (dev) and :5330 (preview), verified.
- **BEFORE captures:** `contracts/W2/BEFORE-90a11e5/`.
  - 16 configurations: 390×844, 375×667, 844×390 and 1440×900 × light/dark × 100/200 %.
  - 15 states each, 0 errors, frozen clock.
  - Finished 21:08 UTC, then the edit gate opened.
- **Gates (23:10 UTC)** — record: `contracts/W2/review/GATE.md`:

  | Maker | Packet | Revision | Trial merge (dev / preview) |
  |---|---|---|---|
  | **N** | READY FOR REVIEW, gate passed | `pe/w2-room@fc9f6d8` (code `5d7bb23`) | `2acc218` (:5340 / :5350) |
  | **H** | WIP with a disclosed blocker: `integrity :1090` @390×844. The taller dock lifts End's toasts over Mark done | `pe/w2-home@acf1c6a` (code `7a961b7`) | `4921ee4` (:5342 / :5352) |
  | **S** | WIP: code final, evidence gaps (13 of 16 big-day AFTER captures, same-session BEFORE, `:1090` on base) | `pe/w2-summary@e0f511a` (code `f95e0be`) | `3726a71` (:5341 / :5351) |

  Combined trial for Lane R: `248415c` (N+S), :5345 / :5355.
- **Review in progress:**
  - **Lead (Opus):** a new Checker. It issues a separate verdict per maker in `contracts/W2/CHECKER-W2-{S,H,N}.md`.
  - **Lanes (Sonnet):** N (room acceptance), S (acceptance plus the missing captures and `:1090` on both sides), and R (full regression and standard capture set on `248415c`). Receipts go to `contracts/W2/review/L{N,S,R}/`.
- **Verdict H (23:45 UTC): REJECT**, one blocker **W2H-D1**: End's toasts are lifted over Today's Mark done at 390×844 by the taller dock.
  - Packet: `contracts/W2/CHECKER-W2-H.md` §7.
  - Everything else in H verified independently, including the visual gate.
  - The one 90-minute fix round started at 23:46 UTC; the hard stop is 01:16 UTC. A targeted re-review by Lane H follows.
- **Next:**
  1. Verdicts (S and N pending).
  2. At most one 90-minute fix round per rejected maker, then a targeted re-review.
  3. Merge the approved makers, then Lane R reruns on the merged tree if it differs from `248415c`.
  4. Stop.

## ■ WAVE 1 CLOSED at `90a11e5` · 2026-10-11 19:40 UTC (read this first)

- **Round 8 APPROVED.** The independent lead (Opus 5.5) approved trial merge `9ff0d04` (src `42e106d`). Receipt:
  `contracts/I04/CHECKER-integration-fix-r8.md`.
- **Merged:** `90a11e5` merges `pe/r8-toastroom@2c3172c`, which includes the round-7 combined fix `7ba0d98`.
  - The merged `kettle/src` is `42e106d`, equal to the trial merge, and nothing outside `kettle/review/` differs.
- **R7-D1:**
  - **Control:** `b39202f` reproduced it this session (the update prompt at 11 and 26 px of 52, Update not hittable).
  - **R8:** the prompt is whole (146–186 px), 0 covered-control frames, and every real tap on a toast action
    activated. Portrait is identical to `b39202f`.
- **The R5-D1 and LEAD-D1 reruns:** controls reproduced; R8 0/12 and 0/12.
- **Wave 1 regression (Lane 2):**

  | Suite | Result |
  |---|---|
  | tsc | exit 0 |
  | vitest | 267/267 |
  | chromium | 73/74; `statusbar:106` flake, which passed 1/1 alone |
  | timer/pwa | 29 passed, 2 skipped by design |

  Captures: R8 against INT, light and dark.
- **Record and follow-ups:** `WAVE1-CLOSED.md` holds the ranked follow-up list. The top two:
  1. the third summary chip half under the footer at 375×667;
  2. Brew length under the docked start, failing tap-target size.
- **Stopped:** every server, browser and agent. Wave 2 is not started.

## ROUND 8 (history): fix R7-D1 only · 2026-10-11

- **Decision:** Vibei chose a round 8 scoped to R7-D1 only. All agents run on Opus 5.5.
- **Not authorised:** other follow-ups, Wave 2, audit work, paid generation, publishing, PRs, or merging anywhere except
  `claude/wizardly-galileo-uy89d9`.
- **Maker M8** (new; reviewed nothing in rounds 7–8), launched at about 16:35 UTC with a 2-hour budget.
  - Branch `pe/r8-toastroom` from `7ba0d98` (the round-7 combined revision under trial merge `b39202f`).
  - Worktree `/home/user/wt/r8`.
  - Owns both the break panel and the toast lift and room rules.
- **Controls:** restarted and verified byte for byte.

  | Revision | Port | Role |
  |---|---|---|
  | `b39202f` | :5301 dev, :5321 preview | R7-D1 control |
  | R5 `20671eb` | :5302 | |
  | INT `0d58c5e` | :5303 dev, :5323 preview | |
  | `e866118` | :5304 | |
  | `49ea1de` | :5305 | |

- **Disk:** it filled up (old-round scratch). The scratch directories from rounds 1–6 were deleted, and their evidence
  is already committed. About 6.7 GB is free.
- **18:05 UTC: M8 is READY** with `pe/r8-toastroom@2c3172c` (src `42e106d`). Archived.
- **18:10 UTC: the gate PASSED** (`round8-review/GATE.md`).
  - Trial merge **R8 = `9ff0d04`** (`61a60b2` + `2c3172c`), served on :5306 (dev) and :5326 (preview), both verified.
  - A new lead and Lanes 1–2 (Opus 5.5) launched at about 18:12 UTC.
- **Next:**
  1. Gate the packet (done).
  2. Targeted review: a new lead plus Lane 1 (R7-D1 acceptance, geometry, R5-D1/LEAD-D1) and Lane 2 (full regression
     and standard captures), 75 minutes each.
  3. The verdict.
  4. On APPROVE: merge and close Wave 1. On REJECT: stop with the defect packet.

## ■ ROUND 7 REJECTED — 2026-10-11 11:15 UTC (read this first)

- **Verdict:** **REJECT** of trial merge `b39202f` (src `6db18ad`), by the relaunched lead Checker on Opus 5.5.
  - Receipt: `contracts/I04/CHECKER-integration-fix-r7.md`.
  - Defect packet and decision: `round7-review/DEFECT-PACKET-R7.md`.
- **Single blocker: R7-D1.**
  - What: at 667×375 and 844×390 with 200 % text, Break's over scrolled to its end shrinks the toast room to a 27–42 px
    strip. The update prompt's Update action cannot be hit.
  - Introduced by round 7: M7b's scrollable panel combined with the D4 lift. INT is whole.
  - Owner: M7a.
- **Everything else holds:** the banner, the announcement, Close, Ambience and Mute, reach, the footer, and M1's data.
  The Mark-done banner is ACCEPTED under Vibei's ruling.
- **Not done:**
  - **Nothing merged.** App code is still `0d58c5e`; Wave 1 is not closed.
  - **Round 8 not started** (Vibei decides).
- **Archive:** `archive/rv7-trial-b39202f.incremental.bundle`, local branch `pe/rv7-trial`.
- **Creative audit phase 2: DONE.** Branch `audit/phase2` @ `3508134`, file `kettle/review/creative-audit/PHASE2-REPORT.md`,
  plus `CRITIC.md` and `evidence/`.
  - **Build:** integration `0d58c5e`.
  - **Coverage:** a live walkthrough at 390×844, 375×667, 820×1180, 1440×900 and 844×390; light and dark; reduced
    motion; the static room; a frozen clock.
  - **Critic:** one independent critic (Opus 5.5), reconciled.
  - **Directions:**
    - A "One Chai, one room" (recommended, after Wave 1 closes);
    - B "Quiet clarity";
    - C "Living Nook" (deferred).
  - **First round:** 4 XS–S changes with acceptance criteria. Not started.
- **Nothing running:** all servers, browsers and agents are stopped. The worktrees in `/home/user/wt/` are kept.
- **Waiting for Vibei:**
  - round 8 for R7-D1, or a ruling;
  - the audit direction and its art approvals.

## ROUND 7 REVIEW RESUMED · 2026-10-11 09:50 UTC (history)

- **Instruction:** Vibei's RESUME, which replaces the overnight plan.
- **Recovery:**
  - No agents were alive.
  - Receipts: A partial, B header only (its tasks had finished), C mostly done, D partial.
  - The lead's notes were saved.
  - `b39202f` is intact (src `6db18ad`).
  - All 7 servers were restarted at 09:40 and re-verified: the dev servers byte for byte; the previews by rebuild,
    identical apart from source maps.
- **Relaunched (each lane's one allowed relaunch):**
  - a new lead on Opus 5.5;
  - lanes A–D on Sonnet 5.5, starting from their partial receipts, with 75 minutes each. The original briefs are in
    `round7-review/RELAUNCH/`.
- **Added for the lead:**
  - the isolated full integrity run;
  - the banner after Mark done, under Vibei's ruling;
  - Close, Ambience and Mute at every size;
  - the summary note against the footer;
  - M7b's probes that weren't rerun;
  - the "saved" wordings.
- **Vibei's rulings:**
  - **Transient-artifact exception:** a transient visual artifact introduced in round 7 that hides no text or control
    may be a FOLLOW-UP.
  - **Mark done:** if Mark done itself scrolls a visible banner off screen, that BLOCKS.
- **Next:** the verdict. On APPROVE: merge, confirm the tree matches, and record the Wave 1 regression. On REJECT: the
  defect packet, and no round 8. Then creative audit phase 2 on `audit/phase2`.

## ■ STOPPED (superseded by the resume above): round-7 review interrupted by a usage limit · 2026-10-11 ~04:50 UTC

- **What happened:** the usage limit stopped the lead and lanes A–D mid-review. It also blocked this session until
  09:31 UTC.
- **Following the overnight rule:**
  - State was saved and nothing was relaunched.
  - **No verdict and no merge.** Wave 1 is not closed; app code is still `0d58c5e`.
  - Stage 2 (audit phase 2) and Stage 3 did not run.
- **Partial receipts** are in `round7-review/{A,B,C,D,LEAD}`. The summary is in `MORNING-2026-10-11.md`.
- **To resume:** relaunch a lead and lanes on R7 `b39202f`, with servers rebuilt per `round7-review/SETUP.md`. The
  container restarted, so no servers are running.

## ROUND 7 (history) — option B (storage warning as an in-page banner) · 2026-10-11

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
- **Overnight run** (user asleep until about 10:00 UTC; hard stop 09:30 UTC; morning report at
  `MORNING-2026-10-11.md`):
  - **Stage 1:** finish round 7.
    - The Close-covered-by-toasts fix is mandatory for M7a by 03:55 UTC.
    - A new lead Checker (Opus 5.5) was launched at about 02:20 UTC to prepare; no verdict before the gate.
    - Then lanes A–D and the verdict. On APPROVE: merge, then the Wave 1 regression.
    - On REJECT: one focused round 8 only for a single blocker with one owner (90 minutes).
  - **Stage 2:** creative audit phase 2 (live walkthrough, one critic), on branch `audit/phase2`.
  - **Stage 3:** follow-up fixes, only if Wave 1 closed and time remains before 08:30 UTC.
- M7b is READY at `38fc9c6` (archived). M7a merged it (`eea543d`) and is finishing the combined packet.
- **03:20 UTC:** M7a is READY with the **combined** revision `pe/r7-banner@7ba0d98`.
  - Code `980ef2a`, src `6db18ad`. It includes the Close fix: the toast room sits below the top bar when a bar control
    is above it.
  - Archived as split bundle parts.
- **03:22 UTC:** the **packet gate passed** (`round7-review/GATE.md`).
  - Official trial merge **R7 = `b39202f`** (`2e9095c` + `7ba0d98`, src `6db18ad`).
  - Servers verified: R7 :5301 and :5321, INT :5303 and :5323, R5 :5302, `e866118` :5304, unfixed `49ea1de` :5305.
  - **The lead resumed for the full review. Lanes A–D launched at about 03:25 UTC** (Opus 5.5, 90 minutes each).
- **03:58 UTC: the slot gate was changed to fair share.**
  - Under strict priority, Lane A held all 3 browser slots while LEAD, B, C and D waited 23–32 minutes.
  - `tools/slots.py` now serves waiters fewest-held-lane-first, and a lane holds at most one job while another waits.
    The pre-patch copy is at `/tmp/rv7-servers/slots.py.v1`.
  - Lanes B, C and D get +20 minutes (to about 05:15 UTC) for the wait the gate caused. Lane A's budget is unchanged.
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
