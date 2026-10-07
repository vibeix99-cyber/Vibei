# Maker / Checker protocol (binding for every Product Excellence agent)

Source of truth: the approved package at `/home/user/Vibei/kettle/.tmp/pkg/kettle-excellence-integrated/`:
`CLAUDE_CODE_MASTER_PROMPT.md`, `PRODUCT_EXCELLENCE_PLAN.md`, `MASTER_EVIDENCE_MATRIX.md`, `PRESERVE_LIST.md`,
`REFERENCE-GUIDE.md`, `VISUAL_BENCHMARK_LIBRARY/README.md`. Read the contract sections that apply to you.

## Makers

1. Work only in your own worktree (`/home/user/wt/<maker>/kettle`) and only on files your brief assigns. Never edit
   the main checkout `/home/user/Vibei`. Do not `npm install`, add dependencies, or touch git remotes.
2. **Verify first.** Write down the actual current behavior (code reading + a real run) before changing anything.
   A contract whose observable success already holds closes **without a code change**: say so, with evidence.
   Repair only reproduced defects. Never redesign protected elements (PRESERVE_LIST.md is binding).
3. Open the named benchmark media yourself (Read tool on the image files) before visual work, and state what
   transfers and what must not be copied.
4. For visual changes, capture matched BEFORE and AFTER with
   `node review/product-excellence/tools/capture.mjs --base http://localhost:<your port> --out <dir> --w W --h H --dpr N --theme light|dark [--rm] [--only ids]`
   at 390×844 (dpr 2), 375×667 (dpr 2) and 1440×900 (dpr 1), both themes, plus reduced motion when motion changes.
   BEFORE captures of revision 8f1044a already exist in `/home/user/Vibei/kettle/review/product-excellence/baseline/`.
   **Look at every capture you submit** (Read tool). Full-size files, not only contact sheets.
5. Ports (never reuse another agent's server): dev server on your brief's port; Playwright with
   `KETTLE_PORT=<your port + 20> KETTLE_PWA_PORT=<your port + 30> npx playwright test …` (e.g. M1: 5221 / 5231).
   Stop any server you started before you finish (`pkill -f "port <n>"`).
6. Checks before submitting: `npx tsc --noEmit --pretty false` clean; `npx vitest run` green; relevant Playwright
   specs; any new tests must test real behavior (no tests that mirror implementation details or trivial styling).
7. Commit your work on your own branch (`git add -A && git commit`) with a message starting
   `<IDs> READY FOR REVIEW:` and ending with these two lines:
   `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` and
   `Claude-Session: https://claude.ai/code/session_01Wn1tcRYjBrm68QxmGYwD9K`. Do not push. No model names elsewhere.
8. Write `review/product-excellence/contracts/<ID>/READY-FOR-REVIEW.md` (one per contract, committed) containing:
   revision (commit hash) and the diff base; changed files; exact commands run and their results; references
   opened (IDs + paths) with transfer / do-not-copy notes; BEFORE/AFTER capture paths with viewport, DPR, theme,
   data state; behavior results; preservation checks; remaining limits marked **BLOCKED / UNKNOWN** where the
   environment cannot prove something (never a manufactured PASS); proposed contract state
   (`CLOSED — PASSES WITHOUT CHANGE`, `FIXED`, `PARTLY BLOCKED`).
9. You may return only **READY FOR REVIEW**. You never approve your own work.

## Checkers

1. You did not build what you review. Do not edit application code or the maker's files. You may run anything,
   write scratch tests outside the repo, and write your verdict file.
2. Bind the verdict to the exact commit hash you reviewed. Re-run the maker's commands yourself; planned commands
   are not proof. Open the actual reference media and BEFORE/AFTER files (Read tool) for any visual change.
3. Grade against the contract's observable success criteria in MASTER_EVIDENCE_MATRIX.md and the Preserve List.
4. Verdict is exactly **APPROVE** or **REJECT**. A REJECT lists, per defect: exact defect, affected state,
   affected viewport/theme, required correction, required recapture/retest. "Needs polish" is not a defect.
5. Write `/home/user/Vibei/kettle/review/product-excellence/contracts/<ID>/CHECKER-r<N>.md` (main checkout; do not
   commit) with verdict, reviewed commit, what you ran, what you opened, per-criterion findings.
6. Any change after APPROVE invalidates it.
