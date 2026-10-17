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
