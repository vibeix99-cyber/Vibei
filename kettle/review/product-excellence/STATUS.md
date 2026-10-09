# Product Excellence — execution status (durable checkpoint)

Resume here after any interruption. Do not overwrite past verdicts; append.

## Authority and restore point

- **Authorized:** user execution authorization, 2026-10-07 ("BEGIN THE KETTLE PRODUCT EXCELLENCE BUILD").
- **Source of truth:** approved package `INTEGRATED-2026-10-06` (independent APPROVE 131/140; all 28 reviewed canonical hashes verified in preflight). Extracted locally at `kettle/.tmp/pkg/kettle-excellence-integrated/` (git-ignored; not app source).
- **Protected pre-rebuild restore point:** `8f1044a` (local annotated tag `pre-product-excellence`; the session's git proxy refuses tag pushes, so on the remote it stays reachable as an ancestor of the integration branch, which is never rewritten). Never reset or rewrite past it.
- **Integration branch:** `claude/wizardly-galileo-uy89d9`. Maker branches are local `pe/*` worktrees, merged only after an independent APPROVE.
- **Orchestrator / model:** Claude Opus 5.5 (`claude-opus-5-5`, verified via session metadata). Makers, Checkers and the Final Product Boss are separate agent instances with their own context; a Checker never reviews work it built.

## ▶ RECOVERY CHECKPOINT — 2026-10-09 19:30 UTC (read this first)

**Restore point:** `8f1044a` — untouched; never reset or rewrite past it (local tag `pre-product-excellence`; on the
remote it is an ancestor of the integration branch).
**Integration branch:** `claude/wizardly-galileo-uy89d9` @ the commit that adds this checkpoint (parent `a9f94b6`),
pushed. **App code on it = `0d58c5e`** (Wave 1 merge: M1 `a6ebe00` + M2 `2becb78`). Integration tree clean.
**Wave 1 is NOT clean:** two integration defects are open (below). **Wave 2 has not started.** No Final Boss yet.

### Branches and worktrees (local only — the git proxy accepts pushes to the integration branch only)

| Worktree | Branch @ commit | Role | State |
|---|---|---|---|
| `/home/user/Vibei` | `claude/wizardly-galileo-uy89d9` | integration | clean, pushed |
| `/home/user/wt/m1` | `pe/m1@a6ebe00` | M1 Wave 1 | APPROVED r2, merged (`7da58f1`) — idle |
| `/home/user/wt/m2` | `pe/m2@2becb78` | M2 Wave 1 | APPROVED r1, merged (`0d58c5e`) — idle |
| `/home/user/wt/w1fix` | `pe/w1-fix@3f00b57` | **M1 integration fix** (I03 × I04) | **APPROVED r1** — held unmerged until M2's fix is approved (any change voids the approval) |
| `/home/user/wt/w1fix-m2` | `pe/w1-fix-m2@e932f65` | **M2 integration fix** (I04 status bar + D3 toast) | `c9520db` REJECTED r1 → **r2 READY FOR REVIEW** `e932f65` (code `0818962`, src tree `c873084`) |
| `/home/user/wt/chk-w1m2r2` (+ `-base` at `c9520db`) | detached `e932f65` | fresh Checker for M2 r2 | review **IN PROGRESS** — no verdict |
| `/home/user/wt/trial-w1` | detached `db3418a` | trial merge: integration + `pe/w1-fix@3f00b57` + `pe/w1-fix-m2@e932f65` (clean, no conflicts) | scratch, for the r2 Checker's interaction check; not the real merge |

Archive of both unmerged fix branches (in case the container is lost):
`review/product-excellence/archive/maker-branches-2026-10-09.bundle` (heads `pe/w1-fix@1351c99`,
`pe/w1-fix-m2@c9520db`; restore with `git fetch <bundle> 'refs/heads/*:refs/heads/*'`).

### Verdicts (exact revisions; independent Checkers only — no maker approved its own work)

| Contract | Revision | Verdict | File |
|---|---|---|---|
| I01, I02 | `6d5969e` | APPROVE (r1) — superseded by r2 | `contracts/I01/CHECKER-r1.md`, `contracts/I02/CHECKER-r1.md` |
| I03 | `6d5969e` | **REJECT** (r1): A warning over Tea time; B warning over Add 5/Pause/Resume/End on phones | `contracts/I03/CHECKER-r1.md` |
| I01, I02, I03 | `a6ebe00` | **APPROVE** (r2; I03 PARTLY BLOCKED: real browser quota, real OS suspension) | `contracts/I0{1,2,3}/CHECKER-r2.md` |
| I04, I05, I14 | `2becb78` | **APPROVE** (r1; sky "Change brew length" link judged acceptable; I05/I14 real-device BLOCKED) | `contracts/{I04,I05,I14}/CHECKER-r1.md` |
| I04 integration fix | `c9520db` | **REJECT** (r1, after the interrupted review resumed): D1 no re-fit after resize/rotation to 375×667 (2 px sideways scroll); D2 200 % text + ≥10,000 leaves spills "Level NN" (13 px sideways scroll, pre-existing but in I04 scope) | `contracts/I04/CHECKER-integration-fix-r1.md` |
| I04 integration fix r2 (D1, D2, D3) | `e932f65` (src `c873084`) | **IN REVIEW — no verdict yet** (fresh Checker; also checks the interaction with M1's approved rule on trial merge `db3418a`) | `contracts/I04/CHECKER-integration-fix-r2.md` (to be written) |
| I03 × I04 integration fix (+ I01, I02 re-confirmed; I04 toast lift unchanged) | `3f00b57` (src `3c58bf9`) | **APPROVE** (r1, fresh Checker; I03 still PARTLY BLOCKED: real browser quota, real OS suspension, real AT) | `contracts/I03/CHECKER-integration-fix-r1.md` |

### Open defects (both on the integrated revision `0d58c5e`)

1. **I03 × I04 — storage-full warning on the session screen at 375×667** (found by the Wave 1 integration regression,
   `integration/wave1/REGRESSION.md`). Verified root cause (M1, on disk): M2's F11 `data-toast-above` lifts toasts above
   the session controls, so M1's r2 hold rule (controls only) shows the warning over the countdown/status/meta readout.
   M1's fix (`src/app/flow.ts`, `src/ui/Toast.tsx`, `tests/integrity.spec.ts`, `docs/areas/timer.md`) is complete on disk
   in `pe/w1-fix@1351c99` (src tree `3c58bf9`) with a drafted packet `contracts/I03/INTEGRATION-FIX-READY-FOR-REVIEW.md`,
   BEFORE/AFTER captures (`contracts/I03/captures/{before,after}-integration/`) and runs: tsc clean, vitest 265/265,
   chromium (integrity + a11y + whistle) **45/45**, timer/pwa 29 passed / 2 skipped, placement tests on `455b6c6`
   5 fail / 4 pass (reproduction). **Not yet submitted** by the maker.
2. **I04 — Today status bar wraps at 375×667, 100% text, both themes** (found by orchestrator inspection of the integrated
   captures). M2 fix submitted as `c9520db` (app change `3bc0c66`, src tree `57f00c46…`): measured normal → tight padding →
   wrap only if still too wide. M2's evidence (`contracts/I04/integration-fix/`): captures 01/01b at 390/375/1440 both
   themes, compare sheets K01 / baseline / integrated / after, CLS 0 on Today load, 200% text and 320 px, brew-length
   discovery, Today audit; tsc clean, vitest 265/265, `tests/a11y.spec.ts` 9/9. **Independent review interrupted.**

### Tests and screenshots (revision each was taken on)

| Evidence | Revision | Result |
|---|---|---|
| Pre-rebuild checks | `8f1044a` (= `0532913` code) | tsc clean, vitest 256/256, e2e 29 passed / 2 skipped, core-loop checker 85/85 |
| BEFORE baseline, 135 captures | `8f1044a` (`baseline/`, commit `d17dda1`) | 0 page errors; orchestrator-inspected |
| I14 baseline perf | `8f1044a` build (`perf/BASELINE.md`) | phone whistle → summary CLS 0.50; real-device BLOCKED |
| Wave 1 integration regression | `0d58c5e` (`integration/wave1/`) | tsc clean, vitest 265/265, timer/pwa 29/2 skipped, chromium **41/42** (defect 1) |
| Integrated captures, 135 | app `0d58c5e` (labelled `455b6c6`/`1bec1a8`, docs-only commits) (`integration/wave1/captures/`) | 0 page errors; orchestrator found defect 2 |
| M1 fix runs | src tree `3c58bf9` (on disk = `1351c99`) | as defect 1 above (maker's own runs, unreviewed) |
| M2 fix runs | src tree `57f00c46` (`3bc0c66` = `c9520db`) | as defect 2 above (maker's own runs, review interrupted) |

### Unchanged commitments

Maker/checker separation holds: makers only submit READY FOR REVIEW; a fresh Checker that did not build the change
reviews the exact commit; any change after APPROVE needs re-review. Protected strengths (PRESERVE_LIST) are untouched by
the open fixes: cream/purple identity, Fredoka/Nunito, orange focus / blue rest, approved Chai, orange kettle, continuous
room, compact summary with sticky Tea time/Skip footer and final-line clearance, five wrapping categories,
15/25/50/Custom with docked start, record-player drawing → close-up, four destinations, progression rules, data
compatibility. Real-device audio, OS suspension, real-phone performance and human screen-reader sessions stay
BLOCKED/UNKNOWN — never PASS.

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
| I03 Data safety, truthful storage consequences | P0 | M1 | **APPROVED r2 on `a6ebe00`**, merged — **integration defect 1 open** (fix in progress, `pe/w1-fix`) | PARTLY BLOCKED: real Safari/Firefox/Android quota, real OS suspension |
| I04 Access and short-screen reachability | P0 | M2 | **APPROVED r1 on `pe/m2@2becb78`**, merged — **integration defect 2 open** (fix `c9520db` READY FOR REVIEW, review interrupted) | gate: retest after all UI work; sky link judged acceptable |
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

## Exact next action (when implementation resumes — not before)

1. ~~M1 (maker) turns `pe/w1-fix@1351c99` into its READY FOR REVIEW commit~~ (done: `3f00b57`) (message `I03 I04 INTEGRATION FIX READY FOR
   REVIEW:`; packet already drafted; re-run nothing unless the tree changes).
2. ~~Checker on `c9520db`~~ → REJECT (D1, D2); ~~fresh Checker on M1's commit~~ → APPROVE `3f00b57`. **Now:** M2 submits
   r2 on `pe/w1-fix-m2` (D1 resize re-fit, D2 200 % level spill, D3 200 % warning toast clipping) → a fresh Checker
   reviews that exact commit.
3. Only after both APPROVE: merge `pe/w1-fix-m2` and `pe/w1-fix` into the integration branch → rerun tsc, vitest,
   timer/pwa, integrity + a11y + whistle (full chromium), recapture affected states (01/01b, session-screen warning
   states, 07/08) at 390×844 / 375×667 / 1440×900 both themes → confirm no interaction between the two fixes → update
   this file and `EVIDENCE-MANIFEST.md`.
4. Wave 1 clean → launch Wave 2 (M3: I08, I07, I09; M4: I06 incl. whistle pose preload/pop-in) from the clean revision
   with the finalized briefs; BEFORE = the recaptured clean revision.
