# Round 4: reliability review (critic, 2026-09-29)

**Under test:** the uncommitted round-4 diff on top of `9c3aaa7` (`src/progress/merge.ts` + tests, `store.ts` sync, `lib/shortcuts.ts` modality, the `FocusScreen.tsx` route guard + scene hold, the `review/functional.spec.ts` edits and `docs/REAL_DEVICE_CHECKLIST.md`).
Browser checks ran against the production preview on :5190 (`review/test-results/dist`, built 04:37). For before/after comparisons I built `git archive HEAD` into `.tmp/critic-r4/head-dist` and served it on :5197 (now stopped).

**Caveats on the environment:**
- Other work landed in the tree during this review: an intention "outcome" feature (`store.ts editSession`, `types.ts`, `validate.ts`, `src/app/intention.ts`, `DataSection.tsx`). None of the findings below depend on it. The :5190 build predates it.
- The review scripts are in `.tmp/critic-r4/`. `.tmp/` is shared with the implementer. My Write tool reported `.tmp/fv.mjs` as "updated", so a file with that name may already have existed and been overwritten. It now lives at `.tmp/critic-r4/fv.mjs`.

## Verdicts on the claims

| # | Claim | Verdict |
|---|---|---|
| 1 | Cross-tab merge fixes data loss | **Partly.** Sequential two-tab flows converge (details below). Near-simultaneous writes improved: 2 of 12 race pairs failed, against 12 of 12 on HEAD. But it **introduces a P1 regression**: Undo of a delete no longer works when a second tab is open. There are also remaining loss paths (P2). |
| 2 | Two-tabs e2e test fixes | **Verified.** The test passes and the edits are sound. It still misses the follower-tab regression (P1-2) and has no merge-specific coverage. |
| 3 | Space/Enter modality fix | **Partly.** The claimed paths are fixed. The `:focus-visible` rationale is confirmed. The same two bugs come back when the sheet is closed with **Esc** (P2). |
| 4 | FocusScreen route guard | **Guard works as described.** The new e2e test is meaningful: it fails on HEAD (lands on `#/`) and passes now. But the guard **causes a P1 regression**: a follower tab now lands on Today instead of the celebration. |
| 5 | Scene held still under sheets | **Verified for End and Ambience.** 73 draws/s under the sheet vs 164–438 running, and the loop resumes after close. Gaps: the `?` shortcuts sheet is not held, and an Ambience sheet left open freezes the whistle (P2). |
| 6 | Layout tests boot with `nookq=off` | **Acceptable.** 54 of 54 layout tests pass (2.5 min, 3 workers). There is a small coverage reduction, noted below. |
| 7 | Results | **vitest 233 of 233** (the tree gained 7 tests since the claim of 226) and **tsc clean**. The 4 changed/new functional tests pass (1 worker). Layout: 54 of 54. **Timer suites (harness + app): 26 passed, 2 skipped.** **Full functional suite 93/93 is UNVERIFIED:** I started the full run, but reading its log was blocked by a permission check. **PWA project and audio-check were not run (UNVERIFIED).** |

Browser flows that converged, with no double counting and `leaves === Σ ledger` in both tabs and in storage (`twotabs.mjs`, `epoch.mjs`):
- brew in A → edit in B (UI) → delete in A (UI) → early-end brew in B
- Export (UI) → replace-import in A (B adopts the new epoch; a later write in B does not resurrect the pre-import brew)
- merge-import
- Reset everything (B adopts empty; B's next brew is kept alone)

No write ping-pong was seen. Revisions rose by about 2 per action pair.

## Findings, by severity

### P1-1: Undo after deleting a brew is reverted when any other Kettle tab is open (regression)

**Cause:**
- `restoreSession` removes the id from `tombstones` (store.ts:158-168).
- `mergeProgress` treats tombstones as a grow-only set (`merge.ts:70`, union) and `hasExtra` counts a tombstone the other side lacks as an "extra" (`merge.ts:27`).
- The second tab therefore **merges** instead of adopting, re-applies its tombstone, and writes the result at a higher rev. The first tab then adopts that.
- HEAD adopted by rev, so the undo propagated.

**Repro:**
1. Open `/?debug&seed=newbie&nookq=off#/stats` (tab A) and `/?debug&nookq=off#/` (tab B, same context).
2. In A: History → any brew → Delete this brew → Delete → click **Undo** on the toast.
3. Wait 2 s.

**Observed** (`.tmp/critic-r4/undo.mjs`):

| | 150 ms after Undo | A settled | B | Fresh tab (storage) |
|---|---|---|---|---|
| New build | 5 | 5 | 5 | 5 (tombstone `nb_2026-09-29_0` present) |
| HEAD build | 6 | 6 | 6 | 6 |
| Control, no tab B | 6 | 6 | – | 6 |

- The toast's Undo is a false promise: the brew is gone for good.
- Tab B can be idle on Today. An installed PWA window plus a browser tab is enough.
- The unit test also reproduces it (`probe.test.ts`, "undo delete").

**Fix direction:** tombstones need causality, for example `{id, rev}` entries plus a restore marker with a later rev that wins. Add a unit test and a two-tab e2e for Undo.

### P1-2: A follower tab/window no longer shows the celebration; it lands on Today (regression)

**Cause:**
1. When the brew completes in tab A, tab B gets the timer write first. Its `timer:sync complete` handler navigates to `/done`.
2. `DoneScreen` mounts with no report yet and redirects to `/`.
3. The progress write (with `lastReport`) arrives about 40 ms later.
4. On HEAD, the still-mounted outgoing FocusScreen re-ran its effect when `hasReport` flipped and navigated to `/done`.
5. The new `getRoute() === '/focus'` guard blocks that, so B stays on Today with an unseen pending report.

**Repro** (`.tmp/critic-r4/follower.mjs`, `follower-trace.mjs`):
1. Open tab A on `/?debug&seed=newbie&nookq=off#/` and tab B on `/?debug&nookq=off#/`, with clocks aligned.
2. Start a brew in A. B follows to `#/focus`.
3. Run `__kettle.finish()` in A and wait 3.5 s.

**Observed:**
- New build: B ends on `#/` in 3 of 3 runs (`lastReport` present).
- HEAD: B ends on `#/done` in 3 of 3 runs.
- Trace, new build:

  ```
  2305ms timer running→idle, replaceState /done
  2314ms replaceState /
  2350ms progress.lastReport true
  ```

  HEAD shows the same sequence, then `2411ms replaceState /done`.

**Impact:** someone watching the non-leader window misses the celebration. `flow.ts` clearly intends the follower to go to `/done`. The e2e two-tabs test never checks B's route after completion.

**Fix direction:** make `DoneScreen`'s "nothing to celebrate" redirect wait briefly or re-sync progress first (for example, call `syncFromStorage()` before deciding). Or route the follower from `timer:sync` only once the progress record is present. Add a follower-route assertion to the two-tabs test.

### P2-1: Same-rev concurrent writes still lose data (the claimed fix is incomplete)

**Code:** `reconcile` returns `keep` when the local tab holds extras and `stored.rev <= local.rev` (`merge.ts:121`, "our next write carries it"). Storage then lacks the local record until that tab writes again. If the tab is closed first, the record is lost.

**Repro** (`.tmp/critic-r4/race2.mjs`):
- Tab A runs `editSession(x, …)` and tab B runs `recordSession(new)` in one `Promise.all`.
- In 1 of 15 tries, B's brew was in B's memory only: not in storage, not in A.
- After closing B, a fresh tab does not have it.

**Broader race run** (`race.mjs`, 12 near-simultaneous pairs):

| Build | Pairs that failed | What failed |
|---|---|---|
| New | 2 of 12 | one edit+record (record missing from storage and A; A's edit missing in B); one edit+edit (each tab kept only its own edit) |
| HEAD | 12 of 12 | all pairs |

**Related gaps:**
- `hasExtra` compares ids only, so field edits (intention/tag) are invisible to it.
- On an equal-rev merge `newer = stored` (`merge.ts:67`), so a local edit is overwritten by the stored copy of the record.
- Both are shown in `probe.test.ts`: "A (edit) vs B (new session)" → the intention is reverted to `""`.

**Fix direction:**
- Merge whenever `localExtra` is true.
- Give records a per-record version (e.g. `editedAt`) so field edits can be merged.

### P2-2: Esc-closed sheets bring back the exact Space bugs the modality fix targeted

Esc is a keydown, so focus handed back after an Esc close counts as keyboard focus, even though the control was reached by mouse. Results from `.tmp/critic-r4/keys.mjs` (1280×860, running brew):

| Sequence | Observed |
|---|---|
| S1: click End → click Keep brewing → Space | paused ✓ |
| S2: click +5 → Space | paused, +5 applied once ✓ |
| S3: Tab to End → Space | sheet opens ✓ (native) |
| **S4: click End → Esc → Space** | **End sheet re-opens**, timer keeps running |
| **S5: click +5 → Esc (opens End sheet) → Esc → Space** | **planned 35 → 40 min: Space added another 5 min and did not pause** |
| **S9: click Ambience → Esc → Space** | **Ambience sheet re-opens** |
| S8: click Mute → Space | paused (the shortcut wins over native), consistent with the design |
| H2: typing `m ?+ x` in the intention field | typed literally; nothing fired ✓ |

- The on-screen hint reads "Space pause".
- **Fix direction:** remember the modality of the interaction that *opened* the sheet and restore it with the focus, or treat a script focus-return as inheriting the opener's modality.
- The claimed `:focus-visible` limitation is real. In Chromium a mouse-focused button reports `:focus-visible` = false after the click, but true inside the very first keydown handler (`fv.mjs`).

### P2-3: A newer generation can still lose to a stale tab (race); the "can never bring wiped data back" comment is overstated

- Across epochs, `reconcile` keeps local on an equal rev (`merge.ts`, epoch branch).
- If tab B wrote at rev r+1 while tab A reset/imported to rev r+1 (neither had heard of the other), B keeps its old generation. B's next write (rev r+2, old epoch) is then adopted by A. The reset is undone and the old data comes back.
- `resetAll`/`load` don't call `syncFromStorage()` first, and there is no tie-break on epoch age. Proven in `probe.test.ts` ("equal rev across epochs": A ends with 3 sessions after a reset).
- `clearReport` also writes the whole document without reconciling first.
- There is no `pageshow` re-sync for progress, unlike the timer (`ticker.ts:293`). A tab restored from bfcache could overwrite a reset/import this way. **UNVERIFIED in a browser.**
- **Fix direction:**
  - Bump the rev well past both sides on reset/import, or order epochs by creation time.
  - Sync before `resetAll`/`load`/`clearReport`.

### P2-4: Merged documents don't re-evaluate day-level rewards; `lastReport` on a tie follows the stored side

**Missing day-level rewards:**
- Two partial 20-minute brews recorded in two tabs merge to 40 focused minutes on a 30-minute goal.
- The merge has **no `goal:<day>` ledger entry and no recipe `done`**. Leaves are 40 against 50 when the same two brews are recorded in one tab (`probe.test.ts`).
- The UI shows the goal as met (from minutes) but never grants +10 unless another brew is recorded that day.

**`lastReport` on an equal-rev merge:**
- The stored side's `lastReport` wins (`merge.ts:98`), which can null the local tab's pending celebration.
- DoneScreen keeps the report it is already showing, so the visible effect is limited to reload-resume.

### P2-5: Scene-hold gaps

Draw counts are from `.tmp/critic-r4/scene.mjs` and `whistle-sheet.mjs`.

- The global **`?` keyboard-shortcuts sheet** opens over Focus but isn't part of `sheetOpen`. The room keeps rendering at about 256 draws/s under a blurred scrim, which is the cost the change set out to remove.
- The **Ambience sheet is not closed when the view changes** (only the End sheet is, `FocusScreen.tsx` "Close the end sheet if the phase changes"). If it is open when the brew completes:
  - it stays over the whistle beat
  - the room is held still: 82 draws during the whistle vs 340 without the sheet, so no whistle animation.
- **UNVERIFIED:** visual continuity on close. `setRunning` resets `lastFrame`, so there are no dt jumps. Absolute-time animations were not inspected frame by frame.

### P2-6: `docs/REAL_DEVICE_CHECKLIST.md` inaccuracies

- **6.2** "Settings → Export progress": the row is **"Export a backup"**. The import row is "Import a backup".
- **2.1** "turn on notifications": the toggle is labelled **"Nudges"** (Notifications & device).
- **1.3** "(Rain, Lo-fi, Simmer…)": there is **no "Simmer" ambience**. The options are Rain, Fireside, Forest, Brown noise, Lo-fi keys and Quiet. Simmer is the kettle effect in the last 40 s.
- **1.1** "fades in over ~2 s": the session fades ambience in over **3 s** at brew start (`audio/session.ts`, `last.inFocus ? 1500 : 3000`). It is only audible if an ambience other than Quiet is selected.
- **2.1–2.3 on iPhone Safari (browser tab):**
  - `Notification` is absent there, so the toggle is disabled with "This browser can't show notifications".
  - These items can only be tested from the installed Home Screen app (iOS 16.4+).
  - Without that note, testers will report expected platform limits as ❌.
- **2.5:** the denied-permission help ("click the lock or tune icon next to the web address…") is desktop-only wording. It is wrong on phones and in an installed app, which has no address bar. This is a small product-copy defect; the checklist expectation "Kettle explains how to re-enable them" will be judged against it.
- **6.3** "The preview names what will change": the sheet summarises the backup (brews, days, level/leaves, date range) with a Replace/Add choice. It does not show a diff against current data.
- **3.4 theme colour:** `manifest.theme_color`/`background_color` are fixed light values (`#fff9f0`), so the splash screen is light even in dark mode. Only the meta theme-color follows the theme.
- **Setup, "the preview link":**
  - This is the claude.ai artifact "Kettle — cozy focus timer". Its bundle is **not this round's build**: `index-BJ9xhzHv.js`, `FocusScreen-btP_DQVe.js` (24,871 B), against `index-Dg4nF7oS.js`, `FocusScreen-iVfNu7Vt.js` (24,905 B) in `review/test-results/dist`. Testers would verify an older build.
  - **UNVERIFIED:** whether service worker, install (Add to Home Screen), `Notification.requestPermission` and Wake Lock work at all on a claude.ai-hosted artifact page. If it is framed or sandboxed, sections 2–4 would measure the host, not Kettle. The checklist should say where these items must be run.

### P2-7: Test-change review notes

- **Two tabs:**
  - Not re-seeding B and aligning clocks is correct.
  - `endsAt` + clock-offset equality is exact, and no weaker than the old `remainingMs` check, which was also computed from state rather than the DOM.
  - The 20 s polls remove sensitivity to slow cross-tab propagation. Acceptable for infra, but the test can no longer catch a multi-second sync regression.
  - It does not assert B's route after completion (missed P1-2), and nothing covers Undo, concurrent edits or merges in a browser.
- **Space-after-pointer test:**
  - Covers S1–S3 only (not the Esc paths).
  - Its Tab loop proceeds even if End is never reached in 20 presses. The following "dialog visible" assertion would then accept any dialog.
- **Mid-dissolve test:** meaningful (HEAD `["#/","#/","#/"]`, new `["#/stats"×3]`, `dissolve.mjs`). It is debug-API driven; the closest real path is browser Back during a brew that ends inside the ~0.4 s dissolve.
- **`merge.test.ts`:** covers union, adopt, keep, tombstone and badges. It has no cases for `restoreSession`, the equal-rev "keep with local extras" branch, field-edit ties, `lastReport`, or cross-epoch equal revs. Those are exactly the failures above.
- **Layout `nookq=off`:**
  - The audit already skipped `<canvas>` and `aria-hidden` content, and the static nook uses the same box, so element checks are unchanged.
  - Lost coverage: canvas-induced horizontal overflow (`scrollW`), and screenshots that show the real room.

### P2-8: Behaviour change worth documenting

On Today, after clicking **any** control (a tag chip, rhythm segment, "Mark done"…), **Enter now starts a brew**. H1: after clicking a chip, Enter went to `#/focus` with the brew running. Before, Enter activated the focused control.
- Keyboard-focused controls keep native Enter (H3 ✓).
- This is probably intended, given the Composer comment, but it is undocumented.

### Checked and fine

- **FocusScreen guard** (`guard.mjs`):
  - Direct `#/focus` while idle → `#/`.
  - Whistle → `#/done` with full motion (~1.2 s) and reduced motion (~0.85 s).
  - Reload on `#/focus` with a pending report → `#/done` (both motion modes).
  - End sheet → end early → `#/`, idle.
  - `navigate('/stats')` + skip break in the same tick stays on `#/stats`.
- **Imports and reset:** export files carry `epoch`; `load()` overrides it (harmless).
- **Legacy data:** `undefined` and `''` epochs are treated as the same generation (unit test), so existing users' tabs merge normally.
- **Coerce edge cases:** a record that `coerceData` drops (e.g. a far-future session) causes `keep`, not a loop.
- **Performance** (node, this machine), for 4,380 sessions and 11,916 ledger entries (2.3 MB JSON):

  | Storage event handling | Time per event |
  |---|---|
  | parse + coerce + reconcile, adopt | about 28 ms |
  | parse + coerce + reconcile, merge | about 29 ms |

  The veteran seed (83 sessions, 56 KB) is negligible.
- **Mixed-version tabs** (an old-build tab that drops `epoch` while a new one merges): not tested. **UNVERIFIED**, and short-lived.

## Out of scope, noticed in passing

- "Add to what's here" import of the **same** backup changed leaves 158 → 168 (`epoch.mjs`). The replay grants different recipe/goal bonuses than the seeded ledger. This is pre-existing portability behaviour.

## Evidence

Scripts are in `.tmp/critic-r4/` (gitignored):

| Area | Scripts |
|---|---|
| Undo | `undo.mjs` |
| Two-tab flows, import/reset | `twotabs.mjs`, `epoch.mjs` |
| Races | `race.mjs`, `race2.mjs` |
| Keys | `keys.mjs`, `fv.mjs` |
| Route guard, dissolve, follower | `guard.mjs`, `dissolve.mjs`, `follower*.mjs` |
| Scene | `scene.mjs`, `whistle-sheet.mjs` |
| Unit probes | `probe.test.ts` (run with `npx vitest run -c .tmp/critic-r4/vitest.config.ts`) |

`KBASE=http://127.0.0.1:<port>` points the browser scripts at another build.

---

## Repairs (implementer, after this review)

Each item was re-checked with the critic's own scripts in `.tmp/critic-r4/` against a fresh build.

| Finding | Repair | Evidence |
|---|---|---|
| P1-1 Undo after delete reverted by a second tab | Per-record latest event wins: records carry `v` (last edit/restore), deletions carry `deletedAt[id]` (old tombstones without a time stay final). `restoreSession` stamps a version newer than the delete. | `undo.mjs`: A, B and storage all 6 (was 5). New e2e "two tabs: undo after deleting a brew sticks in both tabs". Unit tests for undo across tabs and delete-after-edit. |
| P1-2 Follower tab lands on Today | `DoneScreen` re-reads storage before giving up, and waits up to 2 s when a completed brew isn't recorded yet (timer write arrives before the progress write). | `follower.mjs`: B on `#/done` 3/3. The two-tabs e2e now asserts both tabs reach the celebration. |
| P2-1 Memory-only records, field edits invisible | `reconcile` merges and writes back whenever this tab holds anything storage lacks; `hasExtra`/merge compare per-record versions, so the later edit wins in both directions. | `race.mjs` 12/12 converge (was 10/12), `race2.mjs` 0 of 15 lost. Unit tests for equal-rev write-back and edit ties. |
| P2-2 Esc-closed sheets | Modality only changes on focus-moving keys (Tab, arrows, Home/End…). A script focus after Esc keeps how the user last reached that control. A closing sheet is `inert` and no longer `aria-modal`, so a slow exit can't let Space fall through to the opener. That was the cause of an intermittent S1 failure found while re-running `keys.mjs`. | `keys.mjs` S1–S9 all as expected (S1 6/6 in `s1first.mjs`). The e2e Space test covers the Esc paths and asserts End is reached by Tab. |
| P2-3 Stale tab beats a reset at equal rev | Epochs are ordered by creation time (the id starts with it), so the newest generation wins at any rev. A tab holding a newer generation rewrites storage over an older one. `clearReport` syncs first. | Unit test "a reset and a stale write at the same rev". |
| P2-5 Scene-hold gaps | The `?` sheet also holds the room. The Ambience sheet closes when the phase changes. | Code: `FocusScreen.tsx`. |
| P2-6 Checklist | Labels corrected (Export/Import a backup, Nudges, Keep screen awake, ambience names, 3 s fade). iPhone notification limits added. The hosting caveat for sections 2–4 is stated up front. Undo and import items added. The denied-permission help now matches how Kettle is open (installed app, phone browser, computer). | `docs/REAL_DEVICE_CHECKLIST.md`, `SettingsScreen.tsx`. |
| P2-7 Test gaps | See the e2e additions above. The Tab loop asserts End was reached. | 96/96 functional (3 workers). |

**Still open (minor, documented):**
- **P2-4:** a *concurrent* merge doesn't re-evaluate day-level rewards (goal bonus, recipe completion). They are granted on the next brew recorded that day. Sequential two-tab use (the normal case) is unaffected, because each record is applied on top of the other tab's data.
- **`lastReport` on an equal-rev merge:** it still follows the newer document. `DoneScreen` keeps showing the card it has.
- **P2-8:** after clicking a control on Today, Enter starts a brew (as the Enter shortcut promises). Keyboard-reached controls keep native Enter. This is intended.
- **Layout tests use the static nook.** Canvas-induced overflow is not covered there; the design captures use the live room.
