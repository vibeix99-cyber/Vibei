# CHECKER W3R2 · FINAL: classifying the intermittent failures in Lane RF's full regression

*Written in stages; the classification table is at the end.*

| | |
|---|---|
| Lead checker | LEAD-5 |
| Tree | integration `1c791f3` (app merge `72214c8`), src `5f504d4`: TH `7cb3242`, TS `a391cdc`, SG `72214c8`. Served from `/home/user/wt/w6-int` on dev :5560 and preview :5570 |
| Controls | :5583: pre-round app `494748b` (src `b74e6b3`), worktree `w8q`. :5478 / :5488: old base `4d36939` |
| Receipt | `review/FINAL/RECEIPT-FINAL-W3R2.md` §0–§12, read in full; failure traces in `review/FINAL/rerun/fullrun*-artifacts/` |
| Rule | Vibei's: a failure that cannot be shown flaky is a real finding. The residual rule: BLOCKS only if introduced or worsened by W3R2 |
| My evidence | `review/LEAD/FINAL/` |

**What W3R2 changed** (`git diff --stat 494748b 1c791f3 -- src tests`):
- `src/timer/{store,sync}.ts`, `src/app/flow.ts`, `src/screens/focus/FocusScreen.tsx` and `src/ui/Toast.tsx`;
- timer tests;
- `tests/{notice-strip,timer}.spec.ts` and the new `w3r2-stale-tab.spec.ts`.

Nothing in `src/scene`, `src/screens/home`, `src/screens/settings`, `src/ui/Sheet.tsx` or `src/lib/storage.ts` changed.

## F2 · `w3-settings.spec.ts:39` "Reset everything": the "Start fresh?" dialog still reported visible 10 s after its confirm
**Read back from the failing trace** (`F2-w3-settings-trace.zip`; DOM snapshots per action, my `trace_find.py.txt`):
- **Before the confirm click:** the sheet is open, `#root` is `inert`, and `html` is `kettle-modal-open` with `overflow: hidden`.
- **Right after the click:**
  - `#root` is no longer inert, the modal class is gone, and the page shows the welcome screen ("Hi, I'm Chai."). Reset everything has done its work and the page is interactive.
  - The sheet's panel element is still in the DOM with `style="opacity: 1; transform: translateY(100%)"`, that is, slid fully below the screen.
  - It is still there at the end of the 10 s `toBeHidden` wait. Playwright counts an element with a box as "visible" even when it is off screen.
- **By the error-context snapshot** taken after the failure, it is gone.
- **So the failure is the closed sheet's exit not being unmounted for ≥ 10 s**, while the person already sees and can use the welcome screen.

**Not from W3R2:**
- None of the files that hold this path changed: `Sheet.tsx`, Settings, the route layers, motion. The reset changes theme and motion back to their defaults, and the theme transition is unchanged.
- **Toast (TH).** The leaving Settings layer holds a `NoticeStrip`, which now calls `useIsPresent()` on every render. That is a context read, which never registers with `AnimatePresence` and so cannot hold an exit (`CHECKER-W3R2-TH.md` ◆2, from the motion 13.4.4 source).
- **`reset()` (SG).** The timer's `reset()` now removes `kettle:timer` before saving the idle kettle. It is synchronous, inside `resetAllData`'s async `import('@/timer')`, and touches nothing visual.

**Flaky (shown):** 1 failure in 13 attempts on this tree, with 12 passes:
- full run 2, and the rerun;
- ×5 quiet and ×5 under load (RF);
- my matched runs, below.

## F4 · `chai3d.spec.ts:197` default tier: the 3D model not swapped in within 30 s (`chaiKind` stayed `procedural`)
**Not from W3R2.** W3R2 changed nothing in `src/scene` or the Nook (diff stat empty).

**Flaky (shown):** once, in full run 2, beside the heavy `a11y` tests on the other worker. It passed in full 1 and on the rerun (16.3 s), and in my matched runs below.

**It is a load-bound budget:** a held model request, released, then a 30 s wait for a 3D model swap on SwiftShader.

## F1 / F3 · `integrity.spec.ts:1048` I03 "nothing over the brew …": `kettle:home:lastVisit` still unsaved 10 s after room returns
### The mechanism (shown from the code, a probe and the three failing traces)
**Who writes the key.** Only Today does (`src/screens/home/useHomeData.ts`, `useFirstVisitToday`): once per mount of the Today screen, `setItem('kettle:home:lastVisit', <today's day key>)`. Nothing retries it, and nothing else writes or removes it.

**How Chromium treats it when storage is full** (`quota-probe.mjs.txt`, this machine's Chromium, storage filled exactly as I03 fills it):

| Write | Result |
|---|---|
| an existing key, same value | ok |
| an existing key, a same-size new value | ok |
| an existing key, one character longer | ok (the fill leaves < 16 bytes) |
| a **new** key | **QuotaExceededError** |

So **a `lastVisit` write fails only if Today mounts for the first time after the storage fill.**

**When it fails, nothing heals it.** After the room is restored the test forces saves of the timer, progress and settings, but not of `lastVisit`. That key is written again only when Today mounts again, so `unsaved()` stays `["kettle:home:lastVisit"]`. That is the failure at :1136.

**The three failing traces show exactly this.** In F1 (full 1, phone 390), G2 (full 2, phone 390) and G3 (full 2, desktop 1440), I read the DOM text of every snapshot:
- After the first load and after the reload, the page shows the shell (nav and status chips) but **no Today content**: no greeting, no "What are you brewing?".
- This holds through `ready()`, the storage fill and the start of the brew.
- **Today's content first appears only after "Skip break"** (at 15.7 s, 17.3 s and 11.7 s into each test), long after storage was filled. So its first `lastVisit` write was a new key in full storage.
- Today is a lazy route chunk (`App.tsx:48`, `lazyScreen(() => import('@/screens/home/HomeScreen'))`). On a dev server loaded by a two-worker full run, it arrived more than about 5 s after the page load. The test's `ready()` waits for the timer and leadership, not for Today.

**In my instrumented passing runs** (`instr-*.log.txt`: the I03 phone test, its I03 describe logging every `lastVisit` write, ×2 on :5560 and ×2 on :5583):
- Today writes `lastVisit` about 0.6–0.8 s after each load, before the fill, so the key exists.
- Every later write in full storage is a same-size replacement and succeeds.
- **4/4 pass on both servers.**

### The matched controls (my runs, through the gate, `--lane LEAD`; nothing else running)
**1 · Deterministic: Today's chunk answered 6 s late** (`integrity-delay.spec.ts.txt`, `fin-delay.sh.txt`).
- The I03 phone test, unchanged, plus one `page.route` that delays `/src/screens/home/HomeScreen.tsx` by 6 s. That is what a loaded dev server did in the failing runs.

| Server | Result | `lastVisit` writes |
|---|---|---|
| :5583, pre-round app `494748b` | **FAIL**, at the same assertion: `every failed save has gone through`, received `["kettle:home:lastVisit"]` | `had: null`, `QuotaExceededError`, at Today's first mount (6.7–7.3 s) and again after Settings |
| :5560, merged `1c791f3` | **FAIL**, identical | identical |

Logs: `delay-6s-{5583,5560}.log.txt`.

**2 · Matched full runs, RF's command** (`fin-full.sh.txt`, `pw-full.config.ts.txt`): the same 20 spec files in the same order, `notice-strip` excluded, `--workers=2`, run :5583 then :5560. The tests are copies of `w6-int`'s; only I03 logs its `lastVisit` writes. Load 0.2–6.6.

| | :5583 pre-round (`full-5583.log.txt`) | :5560 merged (`full-5560.log.txt`) |
|---|---|---|
| totals | 233 passed, 6 failed, 25 skipped | **239 passed, 0 failed, 25 skipped** |
| I03 ×3 configs | 3/3 pass; no failed `lastVisit` write | 3/3 pass; no failed `lastVisit` write |
| `w3-settings:39` | pass | pass |
| `chai3d:197` | **FAIL**, the same signature as F4 (`Expected "model"`, `Received "procedural"`, 30 s) | pass |
| `w3r2-stale-tab` | 5 fail, as expected: no guard there | 5/5 |

### Classification of F1 / F3
- **FLAKY (shown).** On the merged tree it passes:
  - 4/4 instrumented;
  - 3/3 in my full run;
  - 25/25 outside RF's full runs.
- **The cause is known and is test-side timing.** I03 fills storage before Today has mounted. Today is a lazy chunk, and the test's `ready()` does not wait for it. Then Today's first `lastVisit` write is a new key in full storage, and nothing re-saves it after room returns.
- **Pre-existing, not W3R2.** It reproduces identically on the pre-round app when the chunk is late. None of the code it depends on changed in W3R2: `useHomeData.ts`, `App.tsx`'s lazy route, `saveWarning.ts`, `lib/storage.ts`, and `integrity.spec.ts` itself (the wait at :1136 is W3R1 Q's).
- **SG's catch-up, `reset()` and receive rule are not involved.** No `kettle:timer` write is in the failing set, and `lastVisit` is not a timer key.
- **FOLLOW-UP (tests, integrity owner):** I03 should wait for Today to have rendered (its greeting) before filling storage.
- **FOLLOW-UP (product, Today / core loop):** a profile whose first-ever Today mount happens while storage is full keeps `lastVisit` in the failed set. Then `saveWarning.stillFailing()` holds the storage-full banner after room returns, until Today is opened again. It is bookkeeping, not data, so it could be excluded from the warning or retried at the recovery check. This is a rare edge case, unchanged in W3R2.

## Classification
| # | Failure | Real or flaky | W3R2? | Basis | Class |
|---|---|---|---|---|---|
| F1, F3 | `integrity:1048` I03, `lastVisit` unsaved after room returns | **FLAKY** (shown: 4/4 instrumented, 3/3 in my full run and 25/25 outside full runs pass on the same tree) | **Pre-existing** | Mechanism shown in the three traces and reproduced deterministically on **both** :5583 and :5560 with Today's chunk late; every file involved is unchanged in W3R2 | **FOLLOW-UP** (test: wait for Today before the fill; product edge: a failed `lastVisit` holds the banner) |
| F2 | `w3-settings:39` "Start fresh?" still "visible" 10 s after its confirm | **FLAKY** (1 in 15 on the merged tree: RF 12 passes plus my 2) | **Not introduced** | Read from the trace: the page is already interactive (not `inert`), the welcome screen shows, and the closed sheet's element lingers off-screen (`translateY(100%)`) until its exit unmounts. Nothing W3R2 changed can hold that exit: the only W3R2 code in the leaving layer is TH's `useIsPresent()` context read, which never registers presence. Not reproduced on :5583 in one full run, so "pre-existing" is shown by code, not by a run | **FOLLOW-UP** (Settings / Sheet: the sheet can linger ≥ 10 s in the DOM after confirm under load; the test could wait for detach) |
| F4 | `chai3d:197` default tier, model not swapped in 30 s | **FLAKY** | **Pre-existing** | **Failed on the pre-round app :5583** in my matched full run, with the same signature; passes on :5560 in mine. W3R2 changed nothing in `src/scene` | **FOLLOW-UP** (3D load budget under load) |

**No real W3R2 regression. Nothing blocks the round's close.** My matched full run of the merged tree passed **239/239** with 0 failures. Everything I started has exited, and the gate holds 0.
