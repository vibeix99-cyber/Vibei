# I03 — Data safety and truthful storage consequences · READY FOR REVIEW

- **Maker:** M1. Branch `pe/m1`, worktree `/home/user/wt/m1/kettle`.
- **Revision:** the commit that adds this file (`git log -1 --format=%H -- kettle/review/product-excellence/contracts/I03/READY-FOR-REVIEW.md`),
  message `I01 I02 I03 READY FOR REVIEW: …`. Parent `49fcb3d` (WIP checkpoint of this work; its partial fix was reviewed,
  corrected and completed here).
- **Diff base:** `c80d068` (app source identical to `8f1044a`).
- **Proposed state:** **FIXED** (storage-full defects D1–D3) + **CLOSED — PASSES WITHOUT CHANGE** (round trip, invalid
  files, reset confirmation, "lives on this device"), **PARTLY BLOCKED** only for real-device/browser quota behaviour (below).

## Changed files

| File | Change |
|---|---|
| `src/lib/storage.ts` | Failed writes are still swallowed but now counted, remembered per key (`lastWriteFailed`), reported to `onStorageWriteError` listeners; `checkWrites(fn)` for all-or-nothing changes that report their own failure. Additive. |
| `src/timer/sync.ts` | D1 fix: the self-initiated pre-completion re-read does not adopt storage when this tab's own last timer save failed (storage is older); `storage` events still mirror (`event: true`). |
| `src/progress/portability.ts` | D2 fix: `importData` is all or nothing — if any write fails, memory and storage go back exactly (a part that landed is overwritten with the earlier saved copy) and it returns a plain error; no undo snapshot. |
| `src/app/flow.ts` | D3 fix: a warning toast with **Save backup** when saves fail; at most once a minute; held while the summary / whistle / tea break / "Break's over" is on screen (never over Tea time), shown when the person leaves it or starts the next brew. |
| `src/timer/storageFull.test.ts`, `src/progress/storageFull.test.ts` | New unit tests (9). |
| `tests/integrity.spec.ts` | I03 tests 15–20 (3 storage-full tests with a really full Chromium quota). |
| `docs/areas/timer.md` ("Storage full"), `docs/areas/progress.md` ("Data safety policies") | Actual policies. |
| `review/…/I03/capture-storage-full.mjs`, `captures/before|after/**` | BEFORE/AFTER captures. |

Not changed: `src/screens/settings/DataSection.tsx` (its inline alert already shows `importData`'s error), all M2 files
(`src/ui/**`, styles, audio, notify, screen layout). `flow.ts` only *calls* the public `toast()` API and `downloadBackup()`.

## Reproduced defects → fix → test

| # | Reproduction (base `c80d068`, real Chromium quota filled with filler keys; `setItem` throws `QuotaExceededError`) | Fix | Failing on base → passing on fix |
|---|---|---|---|
| D1 | A returning profile (a saved timer exists) starts a 25-min brew after storage filled up. At 0:00 the brew **vanishes**: no whistle/summary (`#/` instead of `#/done`), no record, no leaves. Cause: right before completing, the tab re-reads storage for other tabs' writes; storage still held the last *saved* timer (idle), so the running brew was rolled back. Also +5 after filling: the old unextended end was adopted. | `sync.ts` guard (above) | e2e `storage full: a brew that completes still reaches its summary, once; …` ✘ base (`Expected "#/done", Received "#/"`) → ✓ fix. Unit `a brew started after storage filled up still completes once …`, `+5 added after storage filled up …` ✘ reverted → ✓. Unit `another tab's successful write still wins …` ✓ (cross-tab sync preserved). |
| D2 | Import a valid backup while storage is full → toast "Added 1 brew from your backup." + Undo, but nothing was saved: after a reload the brew is gone (**false success**). | `importData` all-or-nothing | e2e `storage full: a restore that cannot be saved is refused with a plain reason and changes nothing` ✘ base → ✓ fix. Unit `merge: refused …`, `replace: refused …`, `only part of it fits (progress lands, settings don't) while this tab holds an unsaved brew: storage is put back exactly`, `a refused restore does not raise the general … warning` ✘ reverted → ✓. |
| D3 | Every failed save is silent: no feedback at all (`safeStorage.setItem` swallowed errors). | `storage.ts` reporting + `flow.ts` warning | e2e `storage full: the person is told in plain words, with a Save backup action — at once, but never over the summary's Tea time` ✘ base → ✓ fix (also asserts the Save backup action downloads a file containing the unsaved brew). |

Reverted-repair unit run: `runs/unit-storage-full-on-base.txt` (6 ✘ / 3 ✓; the 3 passing are the reporting/cross-tab tests that
do not depend on the repair). Final unit run: `runs/unit-on-fix.txt`.

**Review of the WIP checkpoint (49fcb3d):** its `sync.ts` guard and storage reporting were correct and kept. Corrected here:
(a) the WIP warning toast covered **Tea time** on phones for 12 s at the summary (seen in its own AFTER captures) → now held
while the ritual's docked controls are on screen; (b) a refused import also raised the general "couldn't save your latest
changes" toast (untrue: nothing was pending) → `checkWrites` keeps those failures out of the listeners; (c) if part of a
restore landed and this tab's copy could not be written back, storage kept the imported data while the message said "Nothing
was changed" → the earlier saved copy is written back; (d) the e2e reproduction depended on whether a timer happened to be
saved before the quota filled (a boot race) → the test and capture now save the timer first (as every returning profile has).

## Commands run and results (final tree)

| Command | Result | Log |
|---|---|---|
| `npx tsc --noEmit --pretty false` | exit 0 | `runs/unit-on-fix.txt` |
| `npx vitest run` | 26 files, 265/265 | `runs/unit-on-fix.txt` |
| `KETTLE_PORT=5221 KETTLE_PWA_PORT=5231 npx playwright test --project=chromium tests/integrity.spec.ts` | 20/20 | `../I01/runs/integrity-e2e-on-fix.txt` |
| same spec on clean `c80d068` copy | 17/20 — exactly the 3 storage-full tests fail | `../I01/runs/integrity-e2e-on-base.txt` |
| `npx playwright test --project=timer-harness --project=timer-app` | 26/26 | `../I01/runs/timer-e2e-on-fix.txt` |
| repair reverted (sync/portability/flow at `c80d068`), new unit tests | 6 failed / 3 passed | `runs/unit-storage-full-on-base.txt` |

## Policy table

| Situation | Policy |
|---|---|
| Export | `.json` `{app:'kettle', kind:'backup', schema:2, exportedAt, progress, settings}`; includes brews still unsaved in the tab. No network request. |
| Valid backup round trip (export → reset → import) | Brews, ledger, leaves, Tea Cozies, badges, level/Nook items and settings restored exactly and saved (survive reload). |
| Invalid file (not JSON, other app, truncated, newer schema, > 20 MB, empty, no progress, damaged sessions) | Refused before any change, plain inline reason; storage byte-for-byte unchanged; cancel on a valid preview changes nothing. |
| Reset | Explicit sheet "Start fresh? … It can't be undone." with "Export a backup first"; Esc / Keep my data keep everything. |
| Storage full/blocked — brewing | Brew completes normally, kept in the tab; saved data never partially overwritten; warning + Save backup; next successful save writes everything. |
| Storage full/blocked — restoring | Refused: "Kettle couldn't save the backup: this browser's storage is full. Nothing was changed." Memory and storage exactly as before. |
| "Everything lives on this device." | True (localStorage + IndexedDB in this browser; zero off-device requests during brew, export, import). |

## Coverage map (observable success → test → result)

| Clause (MASTER_EVIDENCE_MATRIX I03) | Test | Base | Fix |
|---|---|---|---|
| **Invalid imports preserve existing data** | `invalid files change nothing and say why (not JSON, another app, truncated, newer version, huge, empty, damaged)`; unit `src/progress/portability.test.ts` | ✓ | ✓ |
| **Valid backup restores sessions, settings and rewards** through a round trip | `export → reset (explicit confirmation) → import restores brews, settings and every reward exactly` (veteran seed: >50 brews, badges, cozies; profile pills; Nook; survives reload) | ✓ | ✓ |
| **Storage quota failures have understandable feedback** | `storage full: the person is told in plain words, with a Save backup action …`; `storage full: a restore that cannot be saved is refused with a plain reason …` | ✘ | ✓ |
| Failed writes **do not corrupt state** (brief) | `storage full: a brew that completes still reaches its summary, once; saved data stays intact; a backup carries the brew; making room saves it`; unit storageFull tests | ✘ | ✓ |
| **Destructive reset requires explicit confirmation** | round-trip test: with the sheet open, after Esc and after "Keep my data" every brew, reward and setting is unchanged; only "Reset everything" in the sheet wipes | ✓ | ✓ |
| Settings data sentences literally true | `"Everything lives on this device": a brew, an export and an import send nothing anywhere`; copy audit in `docs/areas/progress.md` | ✓ | ✓ |

## BEFORE / AFTER captures (looked at, all 48 files, full size)

Script: `node review/product-excellence/contracts/I03/capture-storage-full.mjs --base http://127.0.0.1:5201 --out <dir> --w W --h H --dpr N --theme light|dark`.
BEFORE served from a clean `git archive c80d068` copy, AFTER from this worktree (src identical to the commit), both with a Vite
config that also allows the symlinked `node_modules` so Fredoka/Nunito load. Chromium + SwiftShader, 3D scene off (stills),
data state: `newbie` seed, saved timer, real quota filled. Configs: `phone-390x844` (dpr 2), `phone-375x667` (dpr 2),
`desktop-1440x900` (dpr 1) × light/dark → `captures/{before,after}/<config>-<theme>/` with `capture-meta.json`.

| State | BEFORE | AFTER |
|---|---|---|
| `s0-brew-start-storage-full` (1.2 s into the brew) | No feedback. | Warning toast with **Save backup**. On phones it sits over the Add 5 / Pause / End row for up to 12 s (tap dismisses); on desktop it sits over the stage, controls clear. |
| `s1-brew-completes-storage-full` (6 s after 0:00) | Brew vanished: Today, "25 min brewed", 6 sessions. | Summary "25 minutes brewed", 7 sessions, **no toast** — Tea time and Skip break fully visible at all sizes. |
| `s3-after-summary-storage-full` (Skip break, +1.5 s) | Today, nothing said. | Today (50 min, goal met) with the warning floating above "Put the kettle on" (Home's existing toast offset). |
| `s2-restore-storage-full` | Toast "Added 1 brew from your backup. Undo" — not saved. | Inline alert "Kettle couldn't save the backup: this browser's storage is full. Nothing was changed."; no toast. |

## References opened (Read tool) — transfer / do not copy

- **K09** `…/assets/current/live-settings.jpg`: grouped Settings incl. profile pills and "Your data". Transfers: existing
  grouping and inline message slot reused; no Settings layout change. 
- **B08** `research/videos/Du2lkZ_cux8/frames/EDV-03-phantom-character-06m23s.jpg`: friendly character during wallet
  creation. Transfers: charm does not establish safety — safety is shown by inspectable behaviour (tests on stored bytes,
  plain failure messages). Do not copy: wallet/security claims.
- **B05** `research/videos/sYRhXB_ZcLI/frames/PW-03.png`: states each consequence. Transfers: "Nothing was changed." /
  "Save a backup to keep them." say the consequence and the remedy. Do not copy: billing mechanics.

## Preservation checks

PRESERVE 4/6/7: summary, Tea time and Skip break never covered by the new warning (e2e hit-test on Tea time + s1 captures).
PRESERVE 9/11: progression arithmetic, storage format and keys unchanged; no cloud/telemetry; destructive tests ran in
disposable profiles only. PRESERVE 1: the warning uses the existing toast component and tones (no new styles).

## Limits — BLOCKED / UNKNOWN

- **BLOCKED:** real quota behaviour on iOS Safari / Firefox / Android (eviction, private-mode quotas). Only Chromium's quota
  is exercised; quota detection also accepts legacy names/codes (`QuotaExceededError`, code 22/1014, `NS_ERROR_DOM_QUOTA_REACHED`).
- **Known limit (documented):** while storage stays full, closing the tab loses what was not saved; the warning and its
  backup action are the remedy. A reset while storage is full clears the tab but may not persist (not tested).
- **Known trade-off:** the brew-start warning covers the phone's Add 5 / Pause / End row for ≤ 12 s (tap to dismiss).
  Cleaner fix is outside M1's files: **request to M2** — mark the session screen's docked controls (and the summary footer)
  with `data-toast-above`, as Home's CTA dock already is (`src/screens/home/Composer.tsx`), so toasts float above them; the
  hold in `flow.ts` can then be dropped.
