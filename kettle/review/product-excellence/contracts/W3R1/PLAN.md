# Wave 3 round 1: polish, Settings, Stats/History, supportive return

## Basics

- **Base:** `claude/wizardly-galileo-uy89d9`. App code is `4d36939` (kettle/src `5cd9a44`); the integration HEAD carries only review evidence beyond it.
- **Base servers:** worktree `/home/user/wt/w4-final` (detached at `4d36939`; nobody edits it). Dev **:5478** (debug API), preview **:5488**.
- **Vibei's decisions:**
  - F-T2-1, Chai's night readability and all "warm streak" wording are fixed this round.
  - Vibei has deleted the backup branch `pe/w2r3-notices`. **No pushes anywhere**: makers and reviewers commit locally only; the orchestrator archives and merges.
- **Models:**
  - Lead: LEAD-4 on Opus, new; it implemented none of this.
  - Makers: Opus, high effort.
  - Lanes judging visuals or interaction: Opus. Lanes running suites and captures: Sonnet.
- **Rules:**
  - controls first;
  - frozen-date REFERENCE → BEFORE → AFTER at full size, at 390×844, 375×667, 844×390 and 1440×900, light and dark, 100 % and 200 % text, for every state a maker changes;
  - the preserve list (`kettle/.tmp/pkg/kettle-excellence-integrated/PRESERVE_LIST.md`; a copy is in the main checkout);
  - the residual rule (BLOCKS / FOLLOW-UP / ACCEPTED, plus the narrow transient-artifact exception);
  - one 90-minute fix round per rejected maker;
  - merge only on APPROVE;
  - final regression on the merged tree.

## Makers and file ownership (no two makers edit the same file)

| Maker | Worktree / branch | Ports (dev / preview) | Budget |
|---|---|---|---|
| **F**: notices polish, Today copy, warm-days wording, I13 | `/home/user/wt/w5f` · `pe/w3-notices-polish` | 5501 / 5511 | 3 h |
| **S**: Stats and History (I12), F-T2-4, backup test | `/home/user/wt/w5s` · `pe/w3-stats` | 5502 / 5512 | 3 h |
| **G**: Settings and shared controls (I11) | `/home/user/wt/w5g` · `pe/w3-settings` | 5503 / 5513 | 2.5 h |
| **N**: Chai night readability (scene only) | `/home/user/wt/w5n` · `pe/w3-chai-night` | 5504 / 5514 | 2 h |

Paths are relative to `kettle/`.

- **F owns:**
  - `src/ui/Toast.tsx`, `src/ui/Toast.module.css`, `src/ui/InlineUndo.tsx`, `src/ui/moment.ts`, `src/ui/WeekStrip.tsx`;
  - `src/app/{Shell.tsx, Shell.module.css, App.tsx, App.module.css, ShellOverlays.tsx, ShellOverlays.module.css, Rail.tsx, Rail.module.css, debug.ts, flow.ts, intention.ts}`;
  - `src/screens/home/**`, `src/screens/welcome/**`, and `src/screens/focus/**` except `focus/stage/**`;
  - `src/screens/done/{summary.ts, summary.test.ts, rank.test.ts}`: wording only, no change to P's summary layout;
  - `src/progress/{badges.ts, badges.test.ts, engine.test.ts}`: badge description wording and its assertions;
  - tests: `notice-strip`, `summary-notice`, `toast-room`, `w2-home`, `statusbar`, `break-reach`, `a11y`, `w2-firstvisit`, `w2-summary`, `whistle`, plus any new `tests/w3-notices*.spec.ts` / `tests/w3-return*.spec.ts`.
- **S owns:**
  - `src/screens/stats/**` (including `StreakCard.tsx`, `History.tsx`, `stats.module.css`, `format.ts`);
  - `src/ui/Sheet.tsx` and `src/ui/Sheet.module.css` (the Dialog behind "Delete this brew?"), and `src/ui/Stat.tsx`;
  - `src/progress/**` except F's three files, for display/selectors only: no rule, arithmetic or stored-data change;
  - tests: `integrity.spec.ts`, plus new `tests/w3-stats*.spec.ts`.
- **G owns:**
  - `src/screens/settings/**` (`SettingsScreen.tsx`, `rows.tsx`, `Settings.module.css`, `DataSection.tsx`);
  - every other file in `src/ui/**`: Button, Chip, IconButton, ListRow, Misc, NumberStepper, Pill, ProgressBar, Ring, ScreenHeader, SegmentedControl, Card, Divider, Digits, Counter, Gallery, `index.ts`, etc.;
  - `src/styles/**` (no palette or font change) and `src/app/theme.ts`;
  - tests: new `tests/w3-settings*.spec.ts`.
- **N owns:** `src/scene/**` (including `engine/**`), `art-src/chai/**`, `tests/chai3d.spec.ts`, `tests/w2-room.spec.ts`.
- **Nobody edits:** `src/{timer,pwa,audio,art,lib,state}/**`, `src/screens/nook/**`, `src/screens/focus/stage/**`, `src/screens/done/{Summary.tsx, Summary.module.css, LeafConfetti*}`, `src/app/{router.ts, boot.ts, SaveWarning*, saveWarning*, ErrorBoundary.tsx, KitRoute.tsx}`, `src/main.tsx`, `public/**`, `package*.json`, `vite.config.ts`, `tests/{pwa,timer}.spec.ts`, `tests/harness/**`, `tests/e2e.vite.config.ts`.
- **A file you don't own:** don't edit it. Record the need in your packet under "Cross-owner requests" and solve inside your own files where you can. Import from another owner's file by path; do not edit `src/ui/index.ts` unless you are G.

**Overlaps, combined and split by file (said here once):**
- **The "warm streak" wording** is F's item. The strings in files S or G own are changed by that owner, using the glossary below:
  - S: `StatsScreen.tsx` tiles, `StreakCard.tsx`, the History delete dialog's "…stats and streak";
  - G: the `SettingsScreen.tsx` Daily goal footer, `DataSection.tsx` reset text, `ui/Gallery.tsx`.
  The lead checks that F, S and G read as one voice.
- **I13 (supportive return)** is F's item on Today, the rail, Welcome, the session and the summary. Its missed-day and return lines inside Stats (`StreakCard.tsx`) are S's to word, under the same principles.
- **F-T2-4** is S's. The Dialog lives in `ui/Sheet.tsx`, so `Sheet.*` moves to S for this round; G does not edit them.

## Warm-days glossary (F, S and G use it alike)

- No visible text, screen-reader text, `title` or `aria-*` label on a product screen says "streak". Ids (`warm-streak`), stored data, code identifiers and comments may keep it.
- A day with at least one finished brew is a **warm day**.
  - The current run: **"N days warm"** (Today's pill), or **"N warm days in a row"** in sentences.
  - The best run: **"Warmest run · N days"** (or "N days" under the label "Warmest run").
  - Starting: words like "One brew warms the kettle today."
- **Tea Cozy:** "A Tea Cozy keeps the kettle warm through one missed day." Say it only where it is true for this person.
- The badge title "Warm Days" stays.
- No threats, no urgency, no loss framing ("lose", "break", "don't miss"). No rule, eligibility or arithmetic change.

## Common to every maker

- **Commits:** commit locally on your branch and never push. Commit WIP if a usage limit or the hard stop comes.
- **Browsers:** every browser run goes through `python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane <X> --n 1 -- <cmd>`. There are 3 slots for 4 makers: keep jobs short. Give each Playwright run its own `--output`. Never `pkill -f`; kill only your own PIDs.
- **Servers:** `/tmp/rv7-servers/start.sh <name> <worktree> <devport|-> <prevport|->`. The preview serves `/tmp/rv7-servers/dist-<name>`, built with `npx vite build --config .tmp/w2.vite.config.ts --outDir /tmp/rv7-servers/dist-<name> --emptyOutDir`. Verify with `/tmp/rv7-servers/verify.sh <worktree> <devport>` after a restart.
- **Frozen date:** a context clock at `2026-10-12T07:40:00Z` (a Monday, a recipe day), then `resume()`, unless a state needs another day (state it). Set up with `?debug&seed=fresh|newbie|veteran|celebrate|atRisk&theme=…` and `window.__kettle`. Actions under test use real taps, clicks, keys and wheel. 200 % text means `html{font-size:200%!important}` at DOMContentLoaded.
- **REFERENCE images:** `kettle/.tmp/pkg/kettle-excellence-integrated/VISUAL_BENCHMARK_LIBRARY/assets/current/` (K01 `01-home.png`, K07 `live-stats-empty.jpg`, K09 `live-settings.jpg`; see its README). Plan items I11, I12 and I13 are in `PRODUCT_EXCELLENCE_PLAN.md` and `MASTER_EVIDENCE_MATRIX.md` in that folder.
- **Packet:** `kettle/review/product-excellence/contracts/W3R1/<X>-READY-FOR-REVIEW.md` in your worktree. Evidence goes in `contracts/W3R1/<X>/`, ≤ 80 MB, full-size PNGs. The packet gives:
  - hash and `kettle/src` tree hash;
  - files changed (all within your ownership);
  - controls first (each defect reproduced on base :5478 first, then shown fixed);
  - the BEFORE/AFTER table with paths;
  - suites: tsc, vitest, the specs you own, and the full chromium suite if time allows;
  - preserve-list check, open findings, and cross-owner requests.
- **No:** new dependencies, palette or font changes, rule/economy/stored-data/id changes, new settings, or new artwork.
