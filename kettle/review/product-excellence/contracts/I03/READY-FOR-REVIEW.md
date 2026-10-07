# I03 — Data safety and truthful storage consequences · READY FOR REVIEW (r2)

- **Maker:** M1. Branch `pe/m1`, worktree `/home/user/wt/m1/kettle`.
- **Revision:** the commit that adds this version of the file, message `I01 I02 I03 READY FOR REVIEW (r2): …`
  (`git log -1 --format=%H -- kettle/review/product-excellence/contracts/I03/READY-FOR-REVIEW.md`). Its parent is
  `ade1195` (WIP checkpoint of this r2 work). r1 = `6d5969e` (REJECTED by Checker r1).
- **Source tree of the r2 commit:** `git rev-parse <r2>:kettle/src` = `e2d8326b6aa3b15b609eb1c8e76bda5f68b38d53`; every
  r2 AFTER capture and run below was made from exactly this tree (it is recorded in each `capture-meta.json`).
- **Diff base:** `c80d068` (app source identical to `8f1044a`). r2-only changes: `git diff 6d5969e <r2>`.
- **Proposed state:** **FIXED** (storage-full defects D1–D3, and the r1 warning-placement defects A and B) + **CLOSED —
  PASSES WITHOUT CHANGE** (round trip, invalid files, reset confirmation, "lives on this device"). **PARTLY BLOCKED** only
  for real-device/other-browser quota behaviour (below).

## Response to Checker r1 (`CHECKER-r1.md`, REJECT on `6d5969e`)

| Checker finding | r2 correction | Evidence (fails on r1 → passes on r2) |
|---|---|---|
| **Defect A** — a warning already on screen was not held: shown just before 0:00 it stayed up over the summary's Tea time (phones). | `src/app/flow.ts`: the warning is now a small state machine (`held` / `shown`). A watcher (every 250 ms while a warning exists, and immediately on `timer:complete`, `timer:start`, `timer:sync`, plus once more 60 ms later after the new screen renders) **dismisses a visible warning and holds it** as soon as the whistle, the summary, a tea break or "Break's over" is on screen, on every layout. It is shown again once the person is somewhere it covers nothing protected. | e2e `… a warning raised just before 0:00 is taken away for the whistle and summary; Tea time and Skip break stay tappable; it comes back after` at 390×844, 375×667 and 1440×900: **✘ on r1** (all three: `saveWarning … toHaveCount(0)`, received 1) → **✓ on r2**. It asserts no warning plus `elementFromPoint` hit-tests on **Tea time** and **Skip break** five times over 1.5 s on the summary, a real tap/click on Skip break, then the warning on screen afterwards with a working **Save backup** (the file contains the brew). Captures `s1a` / `s1b` below. |
| **Defect B** — on phones the warning covered Add 5 / Pause-Resume / End for up to 12 s, with **Save backup over End** (a tap on End downloaded a backup); recurring on any failed save. | Same watcher: the toast's own area (measured from the live region, at least 170 px tall) is compared with every control of the session screen and with any screen's docked primary action (`[data-toast-above]`, already present on Today's "Put the kettle on"). If they would overlap, the warning is **not shown, or taken away and held** — measured, not by breakpoint. Result: on phones (controls docked at the bottom) the warning never appears during a brew, running or paused; it appears on Today after the brew (above "Put the kettle on"), and is taken away again at once if the person starts the next brew while it is up. On wide layouts (controls beside the stage) it shows during the brew, clear of the controls. No dependency on M2's work: only the existing `data-toast-above` marker on Home is read; nothing in `src/ui/**` or screen layout changed. | e2e `… while brewing (running and paused): Add 5, Pause, Resume and End stay tappable; End opens its sheet, never a download` at 390×844 / 375×667 (touch taps, `hasTouch`, dpr 2) and 1440×900: **✘ on r1 at both phone sizes** (`Add 5 minutes @0` / `Pause @1` … received false) → **✓ on r2**. It hit-tests Add 5, Pause, End four times after the start; taps **End → the End sheet opens**; 70 s later taps **Pause** (a failing save → a new warning) and hit-tests Add 5, **Resume**, End four times; taps End again → sheet; taps Resume → running; asserts **0 downloads**. The phone variant of the defect-A test also covers "next brew started while the warning is up": no warning, all three controls hit-test clear. Captures `s0` / `s0b` below. |
| Packet under-disclosed the phone trade-off. | Packet and `docs/areas/timer.md` now describe the real rule (below), including what it means on phones (the warning waits for the whole brew) and on wide layouts. | — |
| Note 2 (doc precision): "the next successful save writes everything" is not true for a settings-only change. | `docs/areas/timer.md` now says: once there is room, the next change to brews or rewards (or an export, which re-reads and re-saves progress) writes everything; a settings change alone does not re-save unsaved brews. | Doc text. |
| Note 3: captures labelled `49fcb3d+dirty`. | r2 captures are labelled with the committed source-tree hash (`src tree e2d8326…`); r1 captures from a clean `git archive 6d5969e` copy are labelled `6d5969e`. | `capture-meta.json` |
| Note 1 (non-blocking): `sync.ts` per-key failure flag could skip adopting a newer write from another tab whose `storage` event this tab missed. | Not changed in r2 (Checker: not reachable in Chromium here). Kept as a documented residual risk below; a raw-value comparison would be the follow-up if a reachable case appears. | — |

Full integrity run on r2: **25/25** (`../I01/runs/integrity-e2e-on-fix.txt`). New placement tests on a clean r1 copy:
**5 failed / 1 passed** (`runs/warning-placement-on-r1.txt`; the passing one is the desktop brewing test, which r1 already
satisfied, as the Checker found).

## Changed files (vs `c80d068`)

| File | Change |
|---|---|
| `src/lib/storage.ts` | Failed writes are still swallowed but now counted, remembered per key (`lastWriteFailed`), reported to `onStorageWriteError` listeners; `checkWrites(fn)` for all-or-nothing changes that report their own failure. Additive. |
| `src/timer/sync.ts` | D1 fix: the self-initiated pre-completion re-read does not adopt storage when this tab's own last timer save failed (storage is older); `storage` events still mirror (`event: true`). |
| `src/progress/portability.ts` | D2 fix: `importData` is all or nothing — any failed write puts memory and storage back exactly (a part that landed is overwritten with the earlier saved copy) and returns a plain error; no undo snapshot. |
| `src/app/flow.ts` | D3 fix + r2 placement: warning with **Save backup**, at most once a minute, never over the ritual or a protected control (rules below). |
| `src/timer/storageFull.test.ts`, `src/progress/storageFull.test.ts` | Unit tests (9). |
| `tests/integrity.spec.ts` | I03 tests 15–25 (storage-full tests use a really full Chromium quota; placement tests at three viewports). |
| `docs/areas/timer.md` ("Storage full"), `docs/areas/progress.md` ("Data safety policies") | Actual policies. |
| `review/…/I03/capture-storage-full.mjs`, `captures/{before,before-r2,after}/**`, `runs/*` | Captures and run logs. |

Not changed: `src/screens/settings/DataSection.tsx` (its inline alert shows `importData`'s error), all M2 files (`src/ui/**`,
styles, audio, notify, screen layout). `flow.ts` only *calls* the public `toast()` / `toast.dismiss()` API and
`downloadBackup()`, and reads the existing `data-toast-above` marker.

## Reproduced defects → fix → test (r1 work, unchanged in r2)

| # | Reproduction (base `c80d068`, real Chromium quota filled with filler keys; `setItem` throws `QuotaExceededError`) | Fix | Failing on base → passing on fix |
|---|---|---|---|
| D1 | A returning profile (a saved timer exists) starts a 25-min brew after storage filled up. At 0:00 the brew **vanishes**: no whistle/summary (`#/` instead of `#/done`), no record, no leaves. The pre-completion re-read adopted the older saved (idle) timer. Also +5 after filling: the old unextended end was adopted. | `sync.ts` guard | e2e 17 `storage full: a brew that completes still reaches its summary, once; …` ✘ base → ✓. Unit `a brew started after storage filled up …`, `+5 added after storage filled up …` ✘ with repair reverted → ✓; `another tab's successful write still wins …` ✓ (cross-tab sync preserved). |
| D2 | Import a valid backup while storage is full → "Added 1 brew from your backup." + Undo, but nothing was saved (gone after reload): **false success**. | `importData` all or nothing | e2e 18 `storage full: a restore that cannot be saved is refused …` ✘ base → ✓. Unit `merge: refused …`, `replace: refused …`, `only part of it fits …`, `a refused restore does not raise the general … warning` ✘ reverted → ✓. |
| D3 | Every failed save is silent. | `storage.ts` reporting + `flow.ts` warning | e2e 21/23/25 (warning shown with plain words and a working Save backup whose file contains the unsaved brew) ✘ base → ✓. |

Reverted-repair unit run: `runs/unit-storage-full-on-base.txt` (6 ✘ / 3 ✓).

## How the warning behaves (r2, also in `docs/areas/timer.md`)

- Text: "Kettle couldn't save your latest changes: this browser's storage is full. Save a backup to keep them." (or
  "…in this browser…" when storage is blocked, not full) + **Save backup**. At most one per minute; a tap, its action or its
  12 s timeout ends it.
- Never during the whistle, the summary, a tea break or "Break's over", on any layout (a visible one is taken away, held).
- Never over a session control (Add 5, Pause / Resume, End …) or a screen's docked primary action (Today's "Put the kettle
  on"). Phones: the warning waits for the whole brew and appears on Today afterwards, above "Put the kettle on". Wide
  layouts: it shows during the brew beside the controls; on Today the toast would sit over "Put the kettle on", so it waits
  for another screen (Stats, Nook, Settings) or the next brew.
- Like any toast it may cover ordinary page content for up to 12 s (on 375×667 Today, the task field; on phone Settings, a
  settings row) — not a protected control; one tap puts it away.

## Commands run and results (r2 tree `e2d8326…`)

| Command | Result | Log |
|---|---|---|
| `npx tsc --noEmit --pretty false` | exit 0 | `runs/unit-on-fix.txt` |
| `npx vitest run` | 26 files, **265/265** | `runs/unit-on-fix.txt` |
| `KETTLE_PORT=5221 KETTLE_PWA_PORT=5231 npx playwright test --project=chromium tests/integrity.spec.ts` | **25/25** (4.3 min) | `../I01/runs/integrity-e2e-on-fix.txt` |
| same spec on a clean `c80d068` copy | 20/25 — fail: 17, 18 (D1, D2) and 21, 23, 25 (brew lost / no warning). The "while brewing" placement tests (20, 22, 24) pass on base only because base never shows a warning. I01/I02 1–14 and I03 15, 16, 19 pass. | `../I01/runs/integrity-e2e-on-base.txt` |
| placement tests (`-g "never covers a control"`) on a clean `6d5969e` (r1) copy | **5 ✘ / 1 ✓** (defects A and B reproduced) | `runs/warning-placement-on-r1.txt` |
| `npx playwright test --project=timer-harness --project=timer-app` | **26/26** | `../I01/runs/timer-e2e-on-fix.txt` |
| repair reverted (sync/portability/flow at `c80d068`), storageFull unit tests | 6 ✘ / 3 ✓ | `runs/unit-storage-full-on-base.txt` |

## Policy table

| Situation | Policy |
|---|---|
| Export | `.json` `{app:'kettle', kind:'backup', schema:2, exportedAt, progress, settings}`; includes brews still unsaved in the tab. No network request. |
| Valid backup round trip (export → reset → import) | Brews, ledger, leaves, Tea Cozies, badges, level/Nook items and settings restored exactly and saved (survive reload). |
| Invalid file (not JSON, other app, truncated, newer schema, > 20 MB, empty, no progress, damaged sessions) | Refused before any change, plain inline reason; storage byte-for-byte unchanged; Cancel on a valid preview changes nothing. |
| Reset | Explicit sheet "Start fresh? … It can't be undone." with "Export a backup first"; Esc / Keep my data keep everything. |
| Storage full/blocked — brewing | Brew completes normally, kept in the tab; saved data never partially overwritten; warning + Save backup placed as above; once there is room, the next change to brews/rewards (or an export) writes everything. |
| Storage full/blocked — restoring | Refused: "Kettle couldn't save the backup: this browser's storage is full. Nothing was changed." Memory and storage exactly as before; no general warning on top. |
| "Everything lives on this device." | True (localStorage + IndexedDB in this browser; zero off-device requests during brew, export, import). |

## Coverage map (observable success → test → result)

| Clause (MASTER_EVIDENCE_MATRIX I03) | Test (`tests/integrity.spec.ts` unless noted) | Base | r1 | r2 |
|---|---|---|---|---|
| **Invalid imports preserve existing data** | 16 `invalid files change nothing and say why …`; unit `src/progress/portability.test.ts` | ✓ | ✓ | ✓ |
| **Valid backup restores sessions, settings and rewards** (round trip) | 15 `export → reset (explicit confirmation) → import restores …` | ✓ | ✓ | ✓ |
| **Storage quota failures have understandable feedback** | 18 (restore refusal text); 21/23/25 (warning text + Save backup file), placed per 20–25 | ✘ | text ✓ / placement ✘ | ✓ |
| Feedback never blocks protected controls (Checker r1 A, B; PRESERVE 4/6/7) | 20/22/24 `… while brewing (running and paused) …`; 21/23/25 `… a warning raised just before 0:00 …` | n/a (no warning) | ✘ 5 of 6 | ✓ |
| Failed writes **do not corrupt state** | 17 `storage full: a brew that completes still reaches its summary …`; unit storageFull | ✘ | ✓ | ✓ |
| **Destructive reset requires explicit confirmation** | 15 (with the sheet open, after Esc and after "Keep my data" every brew, reward and setting is unchanged; only "Reset everything" wipes) | ✓ | ✓ | ✓ |
| Settings data sentences literally true | 19 `"Everything lives on this device" …` | ✓ | ✓ | ✓ |

## BEFORE / AFTER captures (looked at, full size)

Script: `node review/product-excellence/contracts/I03/capture-storage-full.mjs --base http://127.0.0.1:5201 --out <dir> --w W --h H --dpr N --theme light|dark --rev <label>`.
Chromium + SwiftShader, 3D scene off (stills), `newbie` seed, saved timer, real quota filled, fonts served (Vite
`server.fs.allow` widened for the symlinked `node_modules`, scratch config). Configs: `phone-390x844` (dpr 2),
`phone-375x667` (dpr 2), `desktop-1440x900` (dpr 1) × light/dark.

- `captures/before/**` — base `c80d068` (D1–D3): s0, s1, s3, s2.
- `captures/before-r2/**` — rejected r1 `6d5969e`, the states the Checker rejected: `s0`, `s0b`, `s1a`, `s1b` (6 configs).
- `captures/after/**` — r2 tree `e2d8326…`: `s0`, `s0b`, `s1`, `s1a`, `s1b`, `s3`, `s3b`, `s2` (6 configs, 48 files).

| State | BEFORE-r2 (r1 `6d5969e`) | AFTER (r2) |
|---|---|---|
| `s0` brew start | Phones: warning over Add 5 / Pause / End, Save backup over End. Desktop: beside the controls. | Phones: no warning; Add 5 / Pause / End clear (390 and 375, both themes). Desktop: warning bottom-centre over the stage, controls clear. |
| `s0b` paused 70 s later (failing save) | Phones: warning over Resume / End. | Phones: no warning; Add 5 / Resume / End clear. Desktop: warning beside the controls. |
| `s1a` 4 s before 0:00 (pause + resume failed) | Phones: warning over the controls. | Phones: no warning. Desktop: warning beside the controls. |
| `s1b` the summary that follows | **Warning over Tea time** (phones, both themes; desktop: next to it). | **No warning; Tea time and Skip break fully visible** at all six configs. |
| `s1` summary (warning tapped away earlier) | — | Summary "25 minutes brewed", no toast. |
| `s3` Today after Skip break | — | Phones: warning above "Put the kettle on" (CTA clear; on 375×667 it covers the task field). Desktop: no warning (it would cover the CTA). |
| `s3b` Settings | — | Warning at the bottom over ordinary settings content (all configs). |
| `s2` restore while full | — | Inline alert "…Nothing was changed."; no toast. |

## References opened (Read tool) — transfer / do not copy

- **K02** `VISUAL_BENCHMARK_LIBRARY/assets/current/07-summary.png`: compact Done / Carry + immediate Tea time. Transfers:
  nothing may sit over Tea time / Skip break (now enforced and hit-tested). Do not copy into a carousel or a forced claim.
- **K09** `…/assets/current/live-settings.jpg`: grouped Settings incl. "Your data". Transfers: the existing inline message
  slot is reused for the restore refusal; no Settings layout change.
- **B08** `research/videos/Du2lkZ_cux8/frames/EDV-03-phantom-character-06m23s.jpg`: friendly art is not safety. Transfers:
  safety shown by inspectable behaviour (tests on stored bytes, plain failure messages). Do not copy: wallet/security claims.
- **B05** `research/videos/sYRhXB_ZcLI/frames/PW-03.png`: say each consequence plainly. Transfers: "Nothing was changed." /
  "Save a backup to keep them." Do not copy: billing mechanics.

## Preservation checks

PRESERVE 4/6/7: Tea time / Skip break and the session controls are never covered by the warning (hit-tests + touch taps at
three viewports; captures s0/s0b/s1a/s1b). PRESERVE 9/11: storage format and keys unchanged, progression arithmetic
untouched, no cloud/telemetry, destructive tests in disposable profiles. PRESERVE 1: existing toast component and tones.

## Limits — BLOCKED / UNKNOWN

- **BLOCKED:** real quota behaviour on iOS Safari / Firefox / Android (eviction, private-mode quotas). Only Chromium's quota is
  exercised; detection also accepts legacy names/codes (`QuotaExceededError`, code 22/1014, `NS_ERROR_DOM_QUOTA_REACHED`).
- **Trade-off (deliberate):** on phones the warning is told only after the brew (or when the person leaves the session
  screen), never during it. The brew is not at risk meanwhile: it completes in the tab; only closing the tab before saving a
  backup loses it.
- **Known limit:** while storage stays full, closing the tab loses what was not saved. A reset while storage is full may not
  persist (not tested).
- **Residual (Checker note 1):** `sync.ts` per-key failure flag — a tab whose own timer save failed *and* that missed another
  tab's `storage` event could keep its own (older) timer. Not reachable in Chromium here.
- **Suggestion for M2 (optional, not required by this fix):** marking the session controls and the summary footer with
  `data-toast-above` would let warnings float above them instead of waiting on phones.
