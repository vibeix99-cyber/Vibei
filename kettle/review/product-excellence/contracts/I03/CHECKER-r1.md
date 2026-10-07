# I03 — Data safety and truthful storage consequences · CHECKER r1

**Verdict: REJECT**

- **Reviewed commit:** `6d5969e` (branch `pe/m1`), diff base `c80d068`, WIP parent `49fcb3d`.
- **Checker:** independent; did not build this work; no application or maker files edited.
- Summary: the data-safety work itself is sound and verified (round trip, invalid files, reset confirmation, no network,
  D1 brew loss and D2 false restore really fixed, tests fail on base and pass on the fix). The rejection is about the new
  D3 warning: it **can cover the summary's Tea time** (contradicting the packet's and docs' "never over Tea time"), and on
  phones it covers the whole Add 5 / Pause-Resume / End row with its **Save backup button exactly over End**, so a tap on
  End starts a download instead. Both are protected controls (PRESERVE 4/6/7; Tea time / Skip footer).

## What I ran (worktrees `/home/user/wt/chk-m1` @ `6d5969e`, `/home/user/wt/chk-m1-base` @ `c80d068`)

| Command | Result |
|---|---|
| `npx tsc --noEmit --pretty false` (fix) | exit 0 |
| `npx vitest run` (fix) | 26 files, 265/265 |
| New unit tests with the repair reverted (`sync.ts`, `portability.ts`, `flow.ts` at `c80d068`, scratch copy) | **6 failed / 3 passed** — exactly the maker's claim (the 3 passing are the reporting / cross-tab tests) |
| `KETTLE_PORT=5251 KETTLE_PWA_PORT=5261 npx playwright test --project=chromium tests/integrity.spec.ts` (fix) | **20/20** |
| same spec on base (`KETTLE_PORT=5252 KETTLE_PWA_PORT=5262`) | 17/20 — exactly tests 17, 18, 19 fail: D1 `Expected "#/done", Received "#/"` (brew vanished); D3 warning not found; D2 alert not found |
| Timer suites `timer-harness` + `timer-app` (fix) | 26/26 |
| `capture-storage-full.mjs` at `6d5969e` (my own server, fonts allowed) for 390×844 dark, 375×667 light, 1440×900 light | identical states/text to the maker's AFTER (`capture-meta.json`: s0 toast, s1 no toast + 7 sessions, s3 toast, s2 alert, not imported) — confirms the maker's AFTER set (labelled `49fcb3d+dirty`) matches the commit |
| Checker probes (Playwright, scratch, not in repo; 390×844 dpr 2 touch and 1440×900) | P1–P7 below |

## What I opened (Read tool, full size)

- Matrix § I03, `PRESERVE_LIST.md`, `PROTOCOL.md`, `M1-BRIEF.md`, packet `I03/READY-FOR-REVIEW.md`.
- Diff of `src/lib/storage.ts`, `src/timer/sync.ts`, `src/progress/portability.ts`, `src/app/flow.ts`, both
  `storageFull.test.ts`, I03 tests in `tests/integrity.spec.ts`, `docs/areas/progress.md` / `timer.md`; `src/ui/Toast.tsx`
  and `Toast.module.css` (positioning, `data-toast-above`, reduced motion).
- **K02** `assets/current/07-summary.png`; **K09** `assets/current/live-settings.jpg`.
- BEFORE/AFTER: `after/phone-390x844-light/s0`, `before/phone-390x844-light/s0`, `after/phone-375x667-dark/s0`,
  `after/desktop-1440x900-dark/s0`, `after/phone-390x844-dark/s1`, `before/phone-390x844-dark/s1`,
  `after/phone-375x667-light/s1`, `after/desktop-1440x900-light/s1`, `after/phone-390x844-light/s3`,
  `after/phone-390x844-dark/s2`, `before/phone-390x844-dark/s2`, `after/desktop-1440x900-light/s2`; my recaptures
  `390x844-dark/s0`, `375x667-light/s1`; probe screenshots `p6-paused.png`, `p7-390.png`
  (in `/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/chk-m1/probe/`).

Visual judgement: s1 summaries (all sizes, both themes) match K02's compact Done / Carry forward + Tea time / Skip
footer; s2 uses the existing inline message slot under "Your data" with no Settings layout change (K09). BEFORE s1 shows
the brew vanished (Today, 25 min) vs AFTER summary "25 minutes brewed" — D1 fix is visible. AFTER s0 at 390×844 and
375×667 (both themes): the toast hides the entire Add 5 / Pause / End row and the "Whistles at" line (desktop: controls
clear).

## Per-criterion findings

| Clause | Finding |
|---|---|
| Invalid imports preserve existing data | PASS — 8 invalid files: plain inline reason, `rawData` byte-identical, no dialog; Cancel on a valid preview changes nothing (fix and base). |
| Valid backup restores sessions, settings and rewards (round trip) | PASS — veteran seed (>50 brews, badges, cozies): sessions, ledger, leaves, cozies, badges, settings, profile pills, Nook items identical after export → reset → import, and after reload. |
| Storage quota failures have understandable feedback | Copy PASS ("…this browser's storage is full. Save a backup to keep them." + Save backup that downloads a file containing the unsaved brew; restore refusal "…Nothing was changed."). **Presentation FAILS** — defects A and B. |
| Failed writes do not corrupt state (brief) | PASS — D1: brew completes once, saved bytes untouched, export carries it (base: brew lost). D2: all-or-nothing incl. partial-landing rollback (unit) and real quota (e2e). Probe P4: two brews under full storage both kept once in memory. |
| Destructive reset requires explicit confirmation | PASS — sheet "Start fresh? … It can't be undone."; Esc and Keep my data keep everything. |
| Data sentences literally true | PASS — "Everything lives on this device": zero off-origin and zero non-GET requests across brew/export/import. Minor doc nit below. |
| Reduced motion (probe P3) | PASS — with motion "reduce" the warning enters with `transform: none` throughout (opacity only); existing Toast handles it. |
| Held during ritual (probe P2) | PASS for warnings *raised* while the ritual is on screen: not shown during the tea break or "Break's over"; shown on Home after leaving. |
| BLOCKED / UNKNOWN honesty | Honest for real-device quotas. The phone-controls trade-off is **under-disclosed** (packet says brew start only; it recurs on any failed save during a brew, and the End mis-tap is not mentioned). |

## Defects

### Defect A — a warning already on screen is not held: it covers Tea time on the summary
- **Exact defect:** `warnSaveFailed` / `ritualOnScreen` (`src/app/flow.ts`) only hold *new* warnings. A warning raised
  during focus (any failed save: pause/resume, mute, ambience, task edit…) within ~12 s before 0:00 stays up through the
  whistle onto the summary. Probe P7: storage full; first warning dismissed; 70 s later, 4 s before the end, pause +
  resume (saves fail) → warning shown → at `#/done` the warning is still visible and `elementFromPoint` at Tea time's
  centre returns the toast ("covered by Kettle couldn't save…"); screenshot `p7-390.png` shows the Tea time button
  hidden. This contradicts the packet ("never over Tea time"), `docs/areas/timer.md` ("so it never covers Tea time")
  and PRESERVE 4/6/7 (Tea time / Skip footer).
- **Affected state:** storage full/blocked; failed save during focus ≥ 60 s after the previous warning and < ~12 s
  before 0:00; whistle → summary.
- **Affected viewport/theme:** phones (reproduced 390×844 dpr 2; 375×667 shares the bottom toast position), both themes.
  1440×900: not covered (toast over the stage).
- **Required correction:** when the ritual's docked controls come on screen (whistle start / `timer:complete` / route
  `/done` / break), dismiss a visible `kettle:save-failed` toast and re-hold it (re-show after the ritual ends, as for
  new warnings). Fix the doc sentence if behaviour differs.
- **Required retest/recapture:** e2e at phone size: failed save within 12 s before the end → on the summary no warning,
  Tea time and Skip break hit-tests pass, warning appears after leaving. Re-run the whole integrity spec, vitest, tsc,
  timer suites. Recapture a new state "s1b warning raised just before 0:00 → summary" at 390×844 and 375×667 (both
  themes) and 1440×900 (both themes).

### Defect B — on phones the warning hides every session control, and its Save backup button sits over End
- **Exact defect:** the bottom toast covers the whole Add 5 / Pause-Resume / End row (packet's s0 AFTER captures and my
  recapture). Probe P6 (390×844, touch): at brew start, hit-tests at Add 5 / Pause centres return the toast and at End's
  centre return **Save backup**; a tap on End's position **started a backup download and the End sheet did not open**;
  a tap on Pause's position was swallowed (needed a second tap). It recurs, not only at brew start: 70 s later a Pause
  (failed save) raises it again over **Resume** and End (`p6-paused.png`). The maker disclosed only "brew start, ≤ 12 s".
- **Affected state:** storage full/blocked; session screen during focus (running or paused), up to 12 s per warning,
  at most once a minute.
- **Affected viewport/theme:** 390×844 and 375×667, light and dark. 1440×900 not affected.
- **Required correction:** the warning must not cover the session controls or put an action under an existing control.
  Either (a) hold it while the session controls are on screen on layouts where the toast overlaps them (phones), showing
  it when the person leaves the session screen / at the next safe moment, or (b) land M2's `data-toast-above` on the
  session controls (and the summary footer) first and resubmit against that revision. State the chosen trade-off
  accurately in the packet and docs.
- **Required retest/recapture:** e2e at 390×844 and 375×667 with the warning up: hit-tests on Add 5, Pause, Resume and
  End pass (and a tap on End opens the End sheet, no download). Recapture `s0-brew-start-storage-full` and a new
  "paused under storage full" state at 390×844, 375×667 (dpr 2) and 1440×900 (dpr 1), light and dark; look at each.

## Non-blocking notes (no rejection on these)

1. **D1 guard residual risk** (`src/timer/sync.ts`): a tab whose own timer save failed and that *missed* another tab's
   storage event would skip adopting newer storage; unit probes show a possible repeated summary in that tab (records
   still deduped, 1 record) and an overwrite of another tab's newer brew. Not reachable in Chromium here (storage events
   reach live/hidden tabs; frozen tabs re-settle leadership; probe P5: a Kettle tab with a running brew is not bfcache-
   restored). Consider comparing the stored raw value with the last one this tab saved/read instead of a per-key flag.
   Details in `../I01/CHECKER-r1.md`.
2. **Doc precision:** `docs/areas/timer.md` "The next successful save (any later change once there is room) writes
   everything the tab holds" — probe P4: after making room, a settings change did not re-save the two unsaved brews
   (only a change to progress does), and a reload then lost them. Say "the next change to your brews/rewards".
3. AFTER captures are labelled `49fcb3d+dirty`; my recaptures at `6d5969e` match them. Label future captures with the
   committed revision.

## Preserve List

PRESERVE 9/11: storage format/keys unchanged, progression arithmetic untouched, no cloud/telemetry, destructive tests in
disposable profiles — PASS. PRESERVE 1: existing toast component and tones — PASS. PRESERVE 4/6/7 (Tea time / Skip
footer, working controls): **violated in the storage-full state** — defects A and B.
