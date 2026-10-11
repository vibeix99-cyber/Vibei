# I03 × I04 round 7 (combined: M7a banner + M7b break reach + the Close fix) · READY FOR REVIEW

**Maker:** M7a. I submit READY FOR REVIEW only; I do not approve my own work.
**Implements:** option B of `contracts/I04/integration-fix/round6-review/DEFECT-PACKET-AND-OPTIONS.md` (the storage-full
warning becomes an in-page banner), merged with M7b's break reach (`pe/r7-break`), plus the mandatory fix for the
toasts over the session top bar's Close found after the merge.
**Model / effort:** Claude Opus 5.5 (`claude-opus-5-5`); reasoning effort not inspectable.
**Evidence root:** `contracts/I04/integration-fix/r7/M7a/` (probes and their diffs, every run's jsonl and stdout,
captures with per-shot notes, CLS, the integrity diff proof). Earlier, superseded runs are kept, labelled, in
`superseded-<rev>/` folders; nothing below is taken from them unless it says so.

## (a) Hashes

{{HASHES}}

## (b) Changed files, cause and design

Diff base `51521cf` (round 6's combined fix, containing M1's approved `3f00b57`). History on `pe/r7-banner`:
`217489c` banner (code + tests) · `41a25f4` test · `77ba760` outgoing-layer freeze · `eea543d` **merge of
`pe/r7-break@38fc9c6`** · `49ea1de` note CSS · `de7e261` Close fix + regression test · `b8cb9cb` room never folds ·
`980ef2a` room moves only under bar controls above the toasts' column · then this packet commit (review files only).

| File | Change |
|---|---|
| `src/app/flow.ts` | **Removed** the warning toast and everything that placed or held it: `SAVE_TOAST_ID`, `TOAST_ZONE_PX`, `SETTLE_MS`/`WATCH_MS`, the hold state and its 250 ms watcher, `ritualOnScreen()`, `protectedUnderToasts()`, `warningWouldBlock()`, `toastOnScreen()`, `showSaveWarning()`, `watchSaveWarning()`, `recheckSaveWarning()` and its three call sites. **Kept** M1's detection wiring (`onStorageWriteError(warnSaveFailed)`); `warnSaveFailed` hands the failure to the banner state. End-early toast: "Saved N minutes of focus" only while saving works; while it fails, "N minutes of focus, kept in this tab: not saved yet". |
| `src/app/saveWarning.ts` (new) | The warning **state**: on at the first failed save; off once every key whose save failed has been saved again (`lastWriteFailed`, re-checked every 2 s while on — storage state, not geometry). "Save backup" (`downloadBackup`, existing success/failure toasts). Its own polite live region (`#kettle-save-warning-said`, created at start-up), set **once per spell of failing saves** when the first banner/note shows (at most once a minute). `captureAnchor()`/`settleAnchor()`: when a banner appears or goes while its screen is open, the element under the last pointer/touch (or keyboard focus) is kept where it was by scrolling its scroller by however far it moved, before paint. |
| `src/app/SaveWarning.tsx` + `.module.css` (new) | `<SaveWarningBanner home=…/>` (a `<section>` named by its title, not a live region; "Save backup" an ordinary button in DOM order) and `<SaveWarningNote/>` (the summary line). Each follows the warning only while its route is current and no brew/break has just started on it, so an outgoing layer never grows one. Honey tint (`--honey-soft`, `--honey-soft-edge`, `--honey` icon tile), `--ink` text (12.2:1 light, 10.3:1 dark), the cards' `--r-lg` and 2 px edge, body type, no motion. |
| `src/screens/home/HomeScreen.tsx` | Banner in the page flow: phones under the greeting/Chai, before the goal card; side-by-side layouts (landscape phones, tablets, desktop) at the head of the right column. |
| `src/screens/settings/DataSection.tsx` | The same banner right after the "Your data" rows (Export / Import / Reset). |
| `src/screens/done/Summary.tsx` | `<SaveWarningNote/>` under the headline: "Not saved: storage is full." + **Save backup** (blocked storage: "Not saved in this browser."). |
| `src/ui/Toast.tsx` | (1) `toastLiftBottom()` no longer exported. (2) **Close fix:** `toastRoomTop()` + `useToastRoom()` — see "Close fix" below. |
| `src/ui/Toast.module.css` | Comments only; every rule unchanged. |
| `src/app/saveWarning.test.ts` (new) | Unit: on with the first failure; still on after 10 min of storage full; still on while any failed key is unsaved; off when all are saved; a later failure is a new episode; the copy never says "saved". |
| `tests/integrity.spec.ts` | **Only** the block "I03 storage-full warning never covers a control (…)" replaced (proof: `r7/M7a/tests/integrity-diff-proof.md`; lines 1–949 byte-identical to `3f00b57`). |
| `tests/toast-room.spec.ts` | The 8 warning-toast tests replaced by banner tests; the 2 "last toast fades out" tests unchanged; **new** Close regression test (light, dark). |
| `docs/areas/timer.md`, `docs/areas/progress.md` | "Storage full" rewritten for the banner. |
| M7b's files (merged, unchanged by me) | `src/screens/focus/FocusScreen.tsx`, `FocusScreen.module.css`, `parts/RoundButton.module.css`, `tests/break-reach.spec.ts`, its review files. |

**Cause addressed.** Six rounds of the same symptom came from one coupling: M1's rule decided whether the data-safety
warning could be visible by polling the warning's laid-out box, and M2's toast layout decided where that box was. The
warning is no longer in the toast layer at all, so no toast, lift, list order, list scroll, anchoring, entry transform
or other toast can move, hide or withdraw it, and nothing measures geometry to decide whether it may show.

**Design notes.** Benchmarks opened: K01 `01-home.png`, K02 `07-summary.png`, K09 `live-settings.jpg`.
- *Transferred:* K01/K09's card language (cream / plum surfaces, 2 px edge, large radius, Nunito body, Fredoka on the
  button) for a calm block that reads as part of the page; K02's compact rows for the one-line summary note.
- *Avoided:* orange (focus), blue (rest), berry (alarm), any attention motion. Greeting, Chai, status bar, categories,
  brew length, the docked "Put the kettle on · 25 min" and the sky "Change brew length" link are untouched.
- *Tone choice:* in dark theme the note's honey tint is the same family as the summary's reward/unlock card next to it
  (both honey-soft); I kept it for calm and consistency — it is a choice the reviewer may want to classify.
- *Copy:* M1's approved wording, split into a bold title and a sentence.

{{P_replaced}}
Added to `tests/toast-room.spec.ts` for the Close fix: "three toasts never cover the session top bar's Close or a
Break's over control, panel scrolled to its end (375×667, 200 % text, light / dark)".

**Setup note:** the "moves nothing under the finger" spec (and `late.mjs`) bring "Mark done" into view with
`scrollIntoViewIfNeeded()` **before** storage is filled and before recording starts — setup only; the tap is real.

## Close fix (mandatory after the merge)

{{CLOSE_TEXT}}

{{CLOSETABLE}}

**Toast geometry, unfixed vs final** (same runs; the region's top–bottom in CSS px and the three toasts' boxes 1.2 s
after they were raised):

{{GEOTABLE}}

At 100 % text, and wherever no top-bar control sits above the toasts' column, the toasts' boxes are identical; the
room's top only changes where a bar control is above the column. At 844×390 @200 % the room is 26 px on both (the lift
leaves no more; pre-existing, r6 residual 3) — the fix neither empties nor changes it there.

{{M7B_TEXT}}

## (c) Step-2 probes (real input, real timers, fresh contexts, disposable profiles)

{{C_INTRO}}

### LEAD-D1 — "Crossed off · Undo" after a real tap on Mark done, storage full (`actionpair-b.mjs`)

Control **e866118** (:5304); final on :5206. Warning adds/removals over ~7 s from the tap; frames judged from its first
addition. `r7/M7a/runs/lead-ap/`.

{{LEADTABLE}}

**Reproduced on the control** in the four looping configurations (11/10, 11 live-region additions), so the zeros on
the final revision count.

### LEAD-D1 — the never-expiring update prompt underneath (`pwapair-b.mjs`, ~11 s)

{{PPTABLE}}

(The update toast is raised through the app's own `toast()` with PwaUpdatePrompt's options — labelled synthetic setup,
as in the LEAD's probe.)

### R5-D1 — an older toast leaving after the list was scrolled (`natural-b.mjs`, from L1's `natural-x.mjs`)

{{R5_INTRO}}

{{R5TABLE}}

**Reproduced on the control in every configuration**, so the final revision's zeros count. Banner judged per frame:
never taken away or faded, never moved within the page, Save backup never outside its box or clipped.

{{ANNOUNCE_TEXT}}

### Nothing moves under the finger; the banner after a real "Mark done" (`late.mjs`); CLS

{{LATE_TEXT}}

## (d) Tests (final revision)

| Gate | Result |
|---|---|
| `npx tsc --noEmit --pretty false` | {{TSC}} |
| `npx vitest run` | {{VITEST}} |
{{TESTS}}

{{TESTS_NOTES}}

## (e) BEFORE (INT :5303) / AFTER (final, :5206) captures

{{CAPTURES_TEXT}}

## Lead's prep points (answered)

{{LEAD_POINTS}}

{{P_f}}
{{F_EXTRA}}

## (g) Proposed contract state

{{G_TEXT}}
