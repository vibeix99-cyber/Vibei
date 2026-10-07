# M1 brief — Session and data integrity (I01, I02, I03)

**Mission.** Prove, with real runs, that Kettle never loses or doubles a brew and never silently loses data — and
repair only the failures you actually reproduce. These are P0 trust gates: unknowns to verify, not bugs to assume.

- Worktree: `/home/user/wt/m1/kettle` (branch `pe/m1`, base `a8ffbd3` = 8f1044a + tooling). Dev port **5201**.
- Read first: `review/product-excellence/PROTOCOL.md`; package `MASTER_EVIDENCE_MATRIX.md` sections I01–I03;
  `PRESERVE_LIST.md` (items 3, 5, 6, 9, 11, 12); `docs/ARCHITECTURE.md`; `docs/areas/timer.md`, `progress.md`,
  `core-loop.md`.
- **File ownership (exclusive):** `src/timer/**` except `src/timer/notify.ts`; `src/progress/**` logic files (not
  `src/screens/stats/**`); `src/app/flow.ts`, `src/app/intention.ts`; `src/lib/storage.ts`, `src/lib/clock.ts`
  (additive only); `src/screens/settings/DataSection.tsx` (data copy/flows only); new test files
  (`src/**/*.test.ts`, `tests/*.spec.ts`). Another maker (M2) concurrently owns `src/ui/**`, `src/styles/**`,
  `src/audio/**`, `src/timer/notify.ts` and screen-level layout. If you need a change outside your files, describe
  it in your packet instead of making it.

## Concrete benchmarks (open these files; they set the quality bar, not the code)

| ID | File | What it shows / what transfers | Do not copy |
|---|---|---|---|
| K04 | `.tmp/pkg/kettle-excellence-integrated/VISUAL_BENCHMARK_LIBRARY/assets/current/recordings/whistle-to-summary-phone-dark-reduced-motion.mp4` (frames: `…/assets/current/whistle-to-summary-phone-dark-reduced-motion-frames.jpg`) | The literal countdown → whistle → one summary → tea, on one stage. The countdown must always be the truth. | Silent clip proves nothing about audio or background behavior. |
| B03 | `…/assets/official/forest-timer.webp` | An unambiguous operational countdown and focus object. | Forest's visuals/brand. |
| K02 | `…/assets/current/07-summary.png` | Compact Done / Carry forward, immediate Tea time. Consequences must be clear without extra steps. | No five-card carousel, no forced claim. |
| B05 | `.tmp/pkg/kettle-excellence-integrated/research/videos/sYRhXB_ZcLI/frames/PW-03.png` | Explicit consequence sequence + how to cancel: say plainly what an action does. | Billing / trial mechanics. |
| K09 | `…/assets/current/live-settings.jpg` | Existing grouped Settings incl. "Your data" (export / import / reset). | — |
| B08 | `.tmp/pkg/kettle-excellence-integrated/research/videos/Du2lkZ_cux8/frames/EDV-03-phantom-character-06m23s.jpg` | Friendly art does not establish data safety: safety must be inspectable. | Wallet/security claims. |

(`…` = `.tmp/pkg/kettle-excellence-integrated/VISUAL_BENCHMARK_LIBRARY`.)

## I01 — Reliable session time and exactly-once completion (P0)

Current state: the timer uses wall-clock deadlines (`endsAt`), persisted state (`kettle:timer`), IndexedDB
completion claims (`src/timer/claims.ts`), multi-tab leadership (`leader.ts`, `tabPresence.ts`, `sync.ts`), a
completion guard and existing unit tests (`store.test.ts`, `multitab.test.ts`, `dst.test.ts`). Integrity has never
been checked against the contract end to end in a real browser.

Verify and document the actual policies (write them into `docs/areas/timer.md` if missing):
1. Deadline under **pause → reload → resume**, **+5 → reload**, **reload mid-brew**, **tab hidden / suspended**
   (Page Lifecycle freeze/resume where Playwright can emulate it; otherwise CDP `Page.setWebLifecycleState`),
   **late return** (deadline passed while away: exactly one completion, "while away" summary, correct minutes).
2. **Exactly once:** repeated `finish()`/tick, double-click completion, two tabs open on the same profile
   (Playwright: two pages in one context), reload during the whistle/summary. One session record, one leaf
   grant, one history entry, one summary — under the documented policy.
3. Clock edge cases already covered by tests (DST etc.): map them; do not duplicate.
4. No unsupported background-audio guarantee in copy (coordinate with M2 if you find one; it owns audio copy).

Observable success (matrix): started, paused and extended sessions survive reload, suspension and late return
consistently; repeated completion attempts and duplicate tabs produce one record under the documented policy.

## I02 — Recoverable End and task disposition (P0)

Verify actual semantics of: **End** during focus (sheet? confirmation? what gets recorded for an early end —
`MIN_RECORDABLE_MS`, partial leaves?), **Skip break**, **next brew**, **finish for now**, summary **Done / Carry
forward** (toggle back? both reversible?), the carried task on Home, and editing the task. Also: dismissing a
sheet or navigating away never silently resets an active brew.

Observable success: a task can be carried forward or recovered through editing without creating a second focus
record; early-end effort follows the documented existing policy; dismissal never silently resets an active brew.
Guard: keep compact choices and immediate rest; add confirmation **only** for an actually destructive action.

## I03 — Data safety and truthful storage consequences (P0)

Verify with **disposable browser profiles only**: export → reset → import round trip restores sessions, settings
and rewards (leaves, levels, badges, Tea Cozies, Nook items); invalid files (wrong JSON, wrong app, truncated,
future version, huge) leave existing data untouched with a clear message; storage-quota / failed-write behavior
(e.g. `localStorage.setItem` throwing) gives understandable feedback and does not corrupt state; reset requires
explicit confirmation; every data-related sentence in Settings is literally true (e.g. "Everything lives on this
device").

Observable success (matrix): invalid imports preserve existing data; a valid backup restores sessions, settings
and rewards through a round trip; storage-quota failures have understandable feedback; destructive reset requires
explicit confirmation.

## Deliverables

- Real-browser behavior tests where risk is material: add a Playwright spec (e.g. `tests/integrity.spec.ts`, run
  via the repo's Playwright config or your own config against port 5201) plus unit tests only where they add
  coverage. Record pass/fail with output.
- Repairs for reproduced defects only, each with a failing-then-passing test.
- One packet per contract: `review/product-excellence/contracts/I01/READY-FOR-REVIEW.md`, `…/I02/…`, `…/I03/…`
  (format in PROTOCOL.md), including an explicit **policy table** (what happens on End, reload, late return,
  duplicate tab, invalid import, quota failure) and a **coverage map** from each observable-success clause to the
  test that proves it.
- If you change any UI (e.g. data copy in Settings or a confirmation), capture BEFORE/AFTER for the affected state
  at 390×844, 375×667 and 1440×900 in both themes and look at them.
- Commit on `pe/m1` per PROTOCOL.md. Return **READY FOR REVIEW** with the commit hash and a short summary of
  what passed unchanged, what you fixed (with the reproduction), and what is BLOCKED/UNKNOWN here.
