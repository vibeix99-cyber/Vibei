# LEAD r7: preparation notes (before GATE PASSED; no verdict)

LEAD Checker, round 7. Newly launched; built none of round 7; not an earlier maker or Checker. Model: Claude Opus 5.5
(`claude-opus-5-5`); reasoning effort: not inspectable. Prep run 02:20–02:45 UTC, 2026-10-11.
**Nothing here binds a verdict.** The verdict binds only to the trial-merge revision the orchestrator sends.

## Read

- `CHECKER-integration-fix-r6.md` (LEAD-D1, 24-row residual table, BLOCKED/UNKNOWN), `round6-review/DEFECT-PACKET-AND-OPTIONS.md`,
  `round7-review/SETUP.md`, `PROTOCOL.md`, master prompt §7–8, `PRESERVE_LIST.md`, evidence matrix I03 / I04 / I14.
- REFERENCE opened at full size: K01 `01-home.png` (780×1688), K02 `07-summary.png` (780×1688), K09 `live-settings.jpg` (1280×720).
- M7b packet `ROUND7-M7b-READY-FOR-REVIEW.md` in full; M7a's *draft* packet (untracked, moving) sections (b), (f) only.

## Control servers (verified by me with `/tmp/rv7-servers/verify.sh`, ~02:22 UTC)

| Port | Serves | Status |
|---|---|---|
| 5302 | R5 `20671eb` (src `b38ad5e`) | VERIFIED |
| 5303 | INT `0d58c5e` (src `1fc4a1b`) | VERIFIED |
| 5304 | `e866118` (src `05bb3f8`) | VERIFIED |
| **5310 (mine)** | **`49ea1de`** = M7a's last committed combined revision (M7b merged via `eea543d`; **no Close fix**). `git archive 49ea1de kettle` in scratch `…/scratchpad/r7/LEAD/srv-49ea1de/`, node_modules symlinked, vite `--host 127.0.0.1`, no HMR/watch. 7 distinguishing files byte-equal to the `49ea1de` blobs (`?raw` check). | Mine; I stop it when done |

## Controls reproduced in this session (count for later zeros)

| Defect | Control | Probe | Result | Evidence |
|---|---|---|---|---|
| **LEAD-D1** (Mark done) | `e866118` :5304 | `markdone.mjs` (new; see below) | 375×667 @200 light **11 adds / 10 removals**, box over dock 260 frames; 844×390 @200 light **11/10**, 248 frames | `runs/leadd1-e866118/` |
| **LEAD-D1** (Infinity update toast) | `e866118` :5304 | `markdone.mjs` pwa=1, 11 s | 375×667 @200 light **24/24**, still looping, 592 frames over dock | same |
| **Close** under 3 toasts | `49ea1de` :5310 (unfixed combined) | `closecheck.mjs` | 375×667 @200 light, Break's over (task), panel wheeled to 236/236: **Close COVERED 154/155 frames (110/110 settled), not hit-testable**; 1 toast: clear | `runs/close-49ea1de/` |

Not yet reproduced by me (lanes' job; I trace their raw evidence): R5-D1 on R5, the 200 % break controls on INT
(M7b's INT runs reproduce it: re-judged below).

**Probe note (time-of-day bug in round 6's unedited `actionpair.mjs`).** It seeds `newbie` then reloads. The seed pins
15:30 through the in-memory debug clock offset, which the reload drops. Before ~15:30 UTC the seeded brews sort
after the new brew, so Today offers no "Mark done" (`no "Mark done" link on Today` on e866118 at 02:26). Round 6 ran
after 18:00, so it never hit this. `markdone.mjs` starts from an onboarded empty profile (as M7a's spec does), brings
Mark done into view by **real touch/wheel only** (no `scrollIntoView`), and requires its centre to hit-test before the
real tap. First pwa run INVALID (tap landed on the update toast and dismissed it); removed and re-run.

## M7b audit (pe/r7-break@38fc9c6, src ba4707c, code 886acd7)

- **Diff** (`51521cf..38fc9c6`, src): `FocusScreen.module.css` (+16: `.panel:has(> .timer, > .over) { overflow: hidden auto;
  overscroll-behavior: contain; background: 2 gradient layers }`), `FocusScreen.tsx` (panelRef; `toggle()` records Pause's
  top; `useLayoutEffect([paused])` scrolls the panel by the shift; `AnimatePresence onExitComplete` → `scrollTop = 0`;
  `shownTop()`), `RoundButton.module.css` (caption `nowrap` → `text-wrap: balance`), new `tests/break-reach.spec.ts`.
  - `.panel` has no own background (`.screen` paints `--bg`), so the shorthand drops nothing.
  - **Watch:** the rule applies to the **brew's** `.timer` too, not only the break; the brew panel scrolls at 200 %, and the
    paused anchoring applies to the brew's Pause/Resume. M7b's 100 % pixdiffs cover break/over states only, **not the brew
    at 100 %** → need a brew 100 % INT vs R7 compare (Lane D: `13-first-brew`, RM `04`, 375/390/1440, both themes).
- **Hashes:** every probe + spec sha256 in `probe/SHA256SUMS.txt` matches the files.
- **Real input:** `reach.mjs` input loop read in full: `page.mouse.wheel`, CDP `Input.dispatchTouchEvent`, `page.keyboard`;
  MEASURE is read-only; no scrollIntoView/scrollTo/scrollBy/scrollTop writes (grep exit 1 apart from comments). Debug API
  for setup only (`timer.pause()` for `paused`; `finish()`); Tea time by a real tap. `toastcheck.mjs` raises toasts via
  the app's `toast()` (dynamic import), real timers. Captures use `page.clock` freezes (captures only).
- **Raw jsonl re-judged by me** (`tools/judge_reach.py` + tap rows): M7b `final-ba4707c` 2 runs × 30 → **0 failing**;
  INT 2 runs × 30 → **22 failing each** (18 wheel/touch configurations + 4 `tap`). Matches the packet (60/0 vs 60/44).
  Note: at 375×667 the `tap` passes on "in view" (centre hit-tests) with `resumeWhole: false` (button partly below edge).
- **Toast check re-judged:** M7b 24 rows: only `375x667 light over-carried end n3 → Close COVERED`; INT 24 rows: 4 rows
  `390x844 dark over-carried → Mark it done COVERED` (pre-existing). Matches.
- **Frames opened (full size):** BEFORE/AFTER 375×667 dark t200 `over-carried-bottom`; BEFORE/AFTER 390×844 light t200
  `break-running` (captions wrap; bottom shade visible); AFTER 844×390 dark t200 `over-carried-top` (only title +
  question in view; shade subtle in dark; "Next: brew 2 of" under Close: pre-existing); AFTER 844×390 light t200
  `break-paused-bottom` (countdown scrolls up under the top bar; chip "Te/a/b.." pre-existing); toast-check
  `M7b-375x667-light-over-carried-bottom-n3` (Close covered by "Recipe done"); `INT-390x844-dark-over-carried-top-n1`
  ("Cozy level 5!" over "Mark it done": pre-existing). All consistent with the logs.
- **Logs:** tsc exit 0; vitest 265/265; Playwright 37/37 (break-reach 7, a11y 11, statusbar 9, toast-room 10) on `ba4707c`;
  break-reach 6/7 fail on `51521cf` (the 100 % guard passes on both, by design).

## M7a preparation (committed `49ea1de`; moving target; NOT binding)

`diffcheck.sh` (`LEAD/tools/`) on `49ea1de`:
- `storage.ts` b73a0c7, `timer/` 748e7fb, `progress/` f216f01: identical to `51521cf` and M1 `3f00b57`.
- `integrity.spec.ts` lines 1–949 sha `669ff6598fc1ad85` identical in `51521cf`, `3f00b57`, `49ea1de`; the placement block
  (header line 951) is the file's last block; all hunks ≥ 951.
- `flow.ts`: `onStorageWriteError(warnSaveFailed)` kept in `initFlow`; `warnSaveFailed` → `raiseSaveWarning`; no
  `protectedUnderToasts` / `TOAST_ZONE_PX` / hold-path leftovers anywhere in src or tests. Other flow.ts change: end-early
  toast copy ("… kept in this tab: not saved yet" while failing).
- Recovery = every failed key re-saved (`lastWriteFailed`, checked every 2 s). Storage freed but no new write of that key →
  banner stays (truthful). Announce: own polite region, once per episode, ≤ 1 per 60 s.
- Tokens exist in both themes. Contrast: ink on `--honey-soft` 12.16 (light) / 10.34 (dark); icon 8.48. Note button ring
  vs tint 1.38 / 1.21 (text-labelled button; global `:focus-visible` ring exists).

## Concerns to watch in the combined revision

1. **Close fix (mandatory).** Must clear Close (and Ambience/Mute) at every size and scroll, wheel and touch, 1 and 3
   toasts, without (a) emptying the toast room at 844×390 / 667×375 @200 (toasts must stay readable), or (b) changing
   round-6 toast behaviour on Today's dock, the summary footer or the brew controls. Control = `49ea1de` :5310 (reproduced).
2. **Banner visibility (design consequence of B).** Dry run on `49ea1de`, Mark done with storage full: 375×667 @200 the
   banner is added once, steady, but **787 px above the viewport in all 460 frames** (anchor-keeping scroll +352 px);
   375×667 @100 only partly in view (top −52). M7a says it is below the fold on arrival at 200 %. Needs a reasoned
   classification against I03's "understandable feedback" and INT (INT at 100 % showed the toast whole; at 200 % D3).
3. **"Nothing implies saved"**: still `EndSheet.tsx` "N minutes of focus will be saved" (pre-existing) and the SR line in
   frozen `src/timer/announce.ts` "… minutes of focus saved." (pre-existing; now disagrees with the visible toast).
4. Summary note + compact summary: the final expanded line must still clear Tea time / Skip (375, 390, 844×390, 1440;
   100/200 %); note is two rows at 844×390 per M7a.
5. Said once: no re-announcement on Today re-mounts or route changes; banner not a live region.
6. Recovery with real user action after freeing space; banner appears exactly on the first failed write.
7. Tab: Save backup in DOM order (phones after status/Chai, before composer; desktop right column after the start).
8. Honey tint = the reward/unlock card tint on the summary (tone judgement; dark theme).
9. Tests: replaced tests listed; new tests use real input (M7a's Mark-done spec uses `scrollIntoViewIfNeeded` for setup).

## Files

- Probes (git-ignored): `/home/user/wt/rv7-int/kettle/.tmp/LEAD/` (`closecheck.mjs`, `markdone.mjs`, round-6 `actionpair.mjs`,
  `pwapair.mjs` unedited); durable copies + `SHA256SUMS.txt` in `LEAD/probes/`.
- Tools: `LEAD/tools/diffcheck.sh`, `LEAD/tools/judge_reach.py`.
- Runs: `LEAD/runs/{leadd1-e866118,close-49ea1de,prep-markdone-49ea1de}/` (the last is non-binding).
