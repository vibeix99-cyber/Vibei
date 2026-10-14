# W3R1 inventory at resume (2026-10-14 16:45 UTC, after the usage-limit cutoff and a container restart)

## Commits

- **Local:** all present: F trial `e3b9eac`, S trial `c7a6b8f`, G trial `3d91793`, N trial `46f33e2`, combined `e478604`; maker tips F `5ee3e7c`, S `344069c`, G `808421d`, N `4168428`.
- **Remote:** none of these commits is on GitHub as a branch, and none is reachable from the remote integration branch. That is by design ("no pushes outside the integration branch"). Off-container copies are git bundles committed on the integration branch, under `archive/`:
  - `pe-w3-notices-polish-5ee3e7c`, `pe-w3-stats-344069c`, `pe-w3-settings-808421d` and `pe-w3-chai-night-4168428` (maker tips; each verifies OK);
  - `w3r1-trials-e478604` (the combined trial's merge commits; verifies OK).
  - **Gap:** the four single-maker trial merges (`e3b9eac`, `c7a6b8f`, `3d91793`, `46f33e2`) are in no bundle yet. They are rebuildable from the maker tips plus the integration base. Bundled at resume (see INDEX).
- **Remote also still has** `pe/w2r3-notices` (`3462b93`), the old T2 WIP backup that Vibei planned to delete.

## Documents

| File | State |
|---|---|
| `W3R1/PLAN.md`, `BRIEF-{F,S,G,N}.md` | COMPLETE |
| `review/GATE.md` | COMPLETE: N, G, S, F gated, plus the combined trial |
| `W3R1/CHECKER-W3R1-N.md` | **COMPLETE**: LEAD-4's final verdict **APPROVE** on N, with Lane R's receipt checked (§7). The eye-contrast choice is already set out as Vibei's call (§4). BEFORE/AFTER in §8 |
| `review/LR/N/RECEIPT-LR-N.md` (+ `perf/PERF-TABLES.md`, `sep/SEPARATION-TABLES.md`) | COMPLETE, with an "unproven" section (§9) |
| `review/LI/G/RECEIPT-LI-G.md` | COMPLETE, with an "unproven" section |
| `review/LI2/F/RECEIPT-LI2-F.md` | **MISSING**. Lane I2 was cut before writing it. Evidence is PARTIAL (below) |
| `review/LI/S/RECEIPT-LI-S.md` | **MISSING**. Lane I was cut early on S. Only two integrity runs exist, in `/home/user/wt/w5tr-s/kettle/.tmp/LI/` |
| `review/LR/ALL/RECEIPT-LR-ALL.md` | **MISSING**. Lane R was cut mid-run. Evidence is PARTIAL (below) |
| `CHECKER-W3R1-{G,S,F}.md` | **MISSING** (no verdicts yet) |

## Evidence

**COMPLETE (same commits as now):**
- `review/LEAD/N/`: 74 files, including the base/trial pairs.
- `review/LR/N/`: 155 files.
- `review/LI/G/`: 660 files.

**PARTIAL, valid** (same commits, same frozen date, reusable):
- `review/LI2/F/` (374 files, trial `e3b9eac`):
  - `runs/A-base-1440-200-reduced-x1.log`: base 1/1 passed.
  - `runs/A-trial-1440-200-reduced-x3.log`: trial **2 passed, 1 failed** of 3 (`notice-strip:275` at 1440 light 200 % reduced; failure context in `runs/A-trial-repeat2-failure/`).
  - `runs/D-trial-specs.log`: **97 passed, 2 failed**: `w2-home:203` (first visit, 375×667 @100) and `notice-strip:275` at 1440 **dark** 200 %.
  - `probes/` (base and trial), `shots/before` (8 configurations) and `shots/after` (12), `combined/` (12 frames on `e478604`), `topbar/`, `wheel/`.
- `review/LR/ALL/` (combined `e478604`):
  - `runs/full-A.log`: **87 passed, 1 failed** (`integrity:1017`, storage-full banner at 390×844), complete.
  - `runs/full-B.log`: cut after about 85 tests, no failures seen.
  - `runs/full-C.log`: cut; **failures so far `w3-notices:252`** (390×844 @200, "the room a gone notice keeps stays while the page is scrolled") **and `w3-stats:98`** ("Delete this brew?" at 390×844 @200).
  - `runs/timer-pwa.log`: **29 passed, 2 skipped**, complete.
  - Captures: none finished.
- `/home/user/wt/w5tr-s/kettle/.tmp/LI/` (S trial `c7a6b8f`): integrity whole file **25/25**; the backup test `--repeat-each=5 --workers=2` **5/5**.

## N: dark-theme evening/night phone captures (base vs trial, side by side)

- `review/LEAD/N/pairs/390x844-dark-default-dusk-BASE_TRIAL.png` (also `-x2`)
- `review/LEAD/N/pairs/390x844-dark-default-night-BASE_TRIAL.png` (also `-x2`)
- `review/LR/N/captures/montage-face/390x844-dark-low-dusk-close-face_BASE-left_TRIAL-right.png`
- `review/LR/N/captures/montage-face/390x844-dark-low-night-close-face_BASE-left_TRIAL-right.png`
- `review/LR/N/captures/montage-face/390x844-dark-low-night-nook-frame_BASE-left_TRIAL-right.png`
- Singles: `review/LEAD/N/shots/{BASE,TRIAL}/390x844-dark-default-{dusk,night}-{face,nook}.png` and `review/LR/N/sep/{BASE,TRIAL}/390x844-dark-low-{dusk,night}-*.png`.
