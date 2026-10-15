# W3R1 Maker Q: Vibei's follow-ups before the Final Product Boss (item 2, item 3, F1)

- **Branch** `pe/w3r1-stability`, worktree `/home/user/wt/w5q`, from integration `a2b00cd` (app code `2be3de1`, src `d533342`). Local commits only; nothing pushed.
- **Dev** :5545 (`hmr: false`, `watch: null`), restarted after each source commit and checked with `verify.sh`.
- **Gate:** every browser run through `slots.py run --lane Q` (`--n 2` with `--workers=2`). Logs are `.log.txt`. Evidence is in `contracts/W3R1/Q/`, and the scripts are in `Q/scripts/`.

## Phase A: item 2, the band's idle wait from 1.2 s to 4 s

**Commit `61aec4b`** (kettle/src `db6de7e`). `verify.sh /home/user/wt/w5q 5545`: "PORT 5545 serves 61aec4b (src db6de7e): VERIFIED".

### What changed (4 files)

| File | Change |
|---|---|
| `src/ui/moment.ts` | New `export const BAND_IDLE_MS = 4000`, documented. `atRest(now, quiet = QUIET_MS)` gains an optional `quiet`. The default is unchanged, so every existing caller behaves exactly as before. `QUIET_MS` stays 1200 |
| `src/ui/Toast.tsx` | The kept band's give-back branch in `decide()` (the only place Toast used `QUIET_MS`) now reads `now - roomLeftAt >= BAND_IDLE_MS && atRest(now, BAND_IDLE_MS)`. The `QUIET_MS` import is dropped, because nothing else in Toast used it (tsc flags it). Comments are updated |
| `tests/w3-notices-idle.spec.ts` | The band commit now needs ≥ 4000 ms since the last input of any kind, ≥ 4000 ms after the leave, and ≤ **6500** ms after the later of the two. The wait for the collapse goes from 8 s to 12 s (it is a bound, not an assertion) |
| `tests/w3-notices.spec.ts` | The pointer-held test asserts ≥ 4000 ms after the last input and ≤ 6500 ms after release. The poll bounds for the collapse go 6/8 s → 10/12 s. Titles and comments now say 4 s |

Nothing else was loosened. The rest of each assertion is unchanged: one collapse, no other strip commit, pointer up, same screen, room kept while scrolling and while the pointer is held, and nothing moving when the notice leaves.

### The constant decision: a dedicated `BAND_IDLE_MS`; `QUIET_MS` is left as it is

`QUIET_MS` is shared, so changing it would change other behaviour:
- `atRest()` / `untilRest()` / `whenAtRest()` use it for when a notice may **leave or arrive** in view (`why: 'rest'`), for other above-view strip changes, and for `InlineUndo.tsx`'s row changes.
- At 4000, a notice whose time is up would stay drawn until 4 s of stillness, and inline Undo rows would wait as well.

So only the band's give-back gets the 4 s, through a constant of its own.

**One scope note.** The band's give-back branch serves both the in-view collapse (`why: 'idle'`) and the collapse while the band is wholly above the view (`why: 'above'`, page kept still). Both are "a kept band given back on the same screen", so both now wait 4 s. Above the view, nothing in view moves either way.

**Not done (Vibei):** no give-back "in answer to the next tap".

**The upper bound, 6.5 s, and why.** The strip's clock looks every 100 ms and confirms in a fresh animation frame, so on a quiet machine the band goes 4.0–4.2 s after the later of the leave and the last input (measured below: 4037–4125 ms). The old bound left ≈ 2.8 s over its 1.2 s rule; 6.5 s keeps ≈ 2.5 s for a loaded machine's late timers and frames. That is still short enough to catch a wrong rule, such as a second idle window or a missed tick loop.

### Proof (:5545, `61aec4b`)

| Run | Result | Log |
|---|---|---|
| `npx tsc --noEmit` | exit 0 | (console) |
| `npx vitest run` | 32 files, **302/302** | (console) |
| `w3-notices` + `w3-notices-idle` `--repeat-each=2 --workers=2` | **42/42** (4.6 min) | `Q/A/w3-notices-idle-x2.log.txt`, `.json` |
| `notice-strip.spec.ts`, all 25, `--workers=2` | **25/25** (12.5 min; 1440 light 200 % reduced passed, 54.1 s) | `Q/A/notice-strip-all.log.txt`, `.json` |
| `toast-room` 14 + `summary-notice` 14 + `w2-home` 18, `--workers=2` | **46/46** (8.2 min) | `Q/A/owned-3.log.txt`, `.json` |

The band's facts from the 42 (24 band-lifetime cases, from the JSON annotations):
- the collapse came **4037–4125 ms after the later of the leave and the last input**;
- 4092–7508 ms after the leave;
- ms since any input at the collapse: ≥ 4037;
- each case had exactly one collapse, with the pointer up.

Pointer held 3 s: given back 4074 / 4113 ms after release, `why: idle`.

*Chain:* `Q/scripts/QA-chain.sh` (gate `--lane Q --n 2`), 00:08:58–00:34:20 UTC, load 0.3–6.2; timings in `Q/A/chain.log.txt`.

**Phase A: done.** For LEAD-5: the 64-tap aimed-tap check and the notice suite on `61aec4b` (:5545).

## Phase B: item 3 (test stability) and F1

Every change in Phase B is test-only. No `src/**` file changed after `61aec4b` (`git diff 61aec4b HEAD -- kettle/src` is empty). No assertion is loosened.

**Load**, as in `review/FINAL/scripts/LR-stress.sh`: `--workers=2` plus CPU burners (own PIDs, stopped after the run); load average 10–12 at the ends of the runs.

**Scratch probes** live in `kettle/.tmp/q-probes/` (git-ignored). Their sources are copied as `Q/B/probe/*.spec.ts.txt`.

### B1 · `notice-strip.spec.ts` `:292` at 1440 light 200 % reduced (X-11)

Commit `e00b5fa`, test only. Playwright now lists the test at line 458, the listing's own numbering; it is the test at source line 338.

#### The 4-minute timeouts of X-11 attempts 2–3: reproduced and explained

I reproduced them with my own first version of `press()`, which added a pointer move, a park and a re-read before the tap, as F's attempt 2 did. Run ×6 under load: **2 of 6 hit the 240 s test timeout** (`Q/B/proof/ns292-x6-load.log.txt`; error contexts `Q/B/proof/ns292-x6-load-timeout{1,2}-error-context.md.txt`).

**The failure:** `Error: locator.evaluate: Test ended`, waiting for `locator('[data-undo-for="history-delete"]').getByRole('button', { name: /^Undo/ })` inside `press()`'s `onTop()`, at the History Undo step.

**The page at the timeout** is the same as F's attempt-3 context (`/home/user/wt/w5f-x11/.../F/x11/attempt3-timeout-error-context.md.txt`):
- Stats is shown, and "Brew deleted. Undo" has been announced;
- **no Undo button is anywhere in the page** (0 in all three snapshots);
- "Brew updated" is still in the strip.

**Mechanism:**
- The History inline Undo lasts **5 s**, and after that goes at rest (`src/ui/InlineUndo.tsx`: its clock runs while it is visible and not under the pointer or focus).
- Under load, the reads `press()` makes between the Delete tap and the Undo tap took longer than that: `waitFor`, `onTop`, the sheet and scroller probes, the park, and the attempt's extra move, park and re-read. There was no input in between, so the page was at rest and the Undo went.
- `locator.evaluate` has **no timeout by default** (`actionTimeout` 0). A read of a detached element therefore waits for it to come back, and nothing failed until the 4-minute test timeout.

F's long per-wheel waits in attempts 2–3 lengthened the same steps; it is not the History wheel walk, which takes 19 wheels and 5–8 s in every run.

A clean reproduction of F's exact attempt-2 file on `2be3de1` (:5540), ×2 with trace and instrumented, passed (`Q/B/att/ns-att2.log.txt`), so that file's timeouts are explained by the same mechanism, not re-run.

#### The change (`press()`, plus the History read)

1. **One wheel at a time, bounded:**
   - before each wheel, the target's top is recorded;
   - after the wheel, the test waits until the target has **actually moved** from there (at most 1 s), then until it is still across two frames (at most 1.5 s);
   - the next wheel is sent only then, which closes signature (a), the wheel race;
   - three wheels in a row that move nothing end the walk, as nothing more can be brought by wheel; the 60-wheel cap stays.
2. **Aim and tap inside one input window** (signature (c), the idle band, and any at-rest strip change):
   - the pointer moves onto the target (input), the strict on-top check is made right then, and the tap follows at once;
   - if the target moved, or that read took ≥ 800 ms, the move and the read are made again (up to 5 times);
   - so there is never a quiet spell between the check and the tap, whatever `QUIET_MS` / `BAND_IDLE_MS` are;
   - on touch configurations the mouse is parked again after the tap, so no pointer is left over a notice (as before).
3. **Bounded reads:** every target read in `press()` has a 15 s timeout (`GONE_MS`). A target that has gone fails at once, with its locator in the message, instead of a 4-minute hang.
4. **Fewer reads on the common path:** the sheet and scroller probes and the park run only when a wheel is needed. An on-top target costs two reads (it was three on base and four in my first version).
5. **History (N-2):** "where the person saw the row" is read once the Edit sheet is open and the row has been still for five frames (at most 3 s), after the page's focus scroll for the tapped row. This is F's attempt-1 idea, with a longer stillness.

Nothing is removed or loosened. The same assertions, the 2 px Undo-in-place checks, the strict 9-of-9 on-top check for Mark done, and the frame recorder are unchanged.

#### Proof
| Run | Result | Log |
|---|---|---|
| `:292` 1440 light 200 % reduced, `--repeat-each=6`, `--workers=2` + 4 burners (load to 12.4) | **6/6** (1.2–1.6 min each) | `Q/B/proof/ns292-x6-load-v2.log.txt`, `.json` |
| `notice-strip.spec.ts`, all 25, `--workers=2` (right after the burners stopped; load 12 → 6) | **25/25** (11.8 min) | `Q/B/proof/notice-strip-all-v2.log.txt`, `.json` |
| The first version (move, park and re-read before the tap; unbounded reads), ×6 under load, for the record | 4/6: the two 4-minute timeouts above | `Q/B/proof/ns292-x6-load.log.txt` |

### B2 · `integrity:1017` (I03, the storage-full banner, X-1)

Commit `316d9ab`, test only.

**Change:** the fixed `toHaveCount(0, { timeout: 6_000 })` is replaced by waits on the real state. A recorder (`saveRecorder`, an init script) notes the result of the latest write of every `kettle:` key and when the banner section comes or goes, in page time.
1. Make room and save (unchanged).
2. Wait until **every `kettle:` key whose save had failed has been saved since**, polled for at most 10 s.
3. Wait for the banner to go (only a bound, 15 s, for a page slowed by load). **Assert in page time** that it went **≤ 3000 ms after those saves**: one 2 s recovery check (`RECOVERY_CHECK_MS`, `saveWarning.ts`), plus 1 s for a late timer and the render.

That is stricter than the old 6 s of wall time. A failure now says which state did not arrive (a save still refused, or the check late).

| Run | Result | Log |
|---|---|---|
| I03 390×844 `--repeat-each=10`, `--workers=2` + 4 burners (load to 12.4) | **10/10**. Saves went through in the room step itself (0 ms); the banner went **365–1890 ms** after them | `Q/B/proof/x1-i03-x10-load.log.txt`, `.json` (annotations) |
| Instrumented probe ×10 under load (before the change) | 10/10. The failed keys were always `kettle:timer` and `kettle:progress`, both re-saved by the room step; the banner went 139–1718 ms after it | `Q/B/probe/x1-x10.log.txt` |

**The two earlier failures, and what is not proven.**
- **The 2.9 s "slow" case in Lane R's ten traces is Playwright's poll schedule, not the app.** The failing full-run trace (`review/FINAL/rerun/fullrun-artifacts/F2-I03-trace.zip`, read) shows the expect polling at 6, 116, 370, 875, 1879, 2883, 3887, 4892 and 5901 ms, the same numbers as the "step durations".
- In that failing run the page answered every poll; the banner was still there at 5.9 s, and no screencast frame changed after 1.9 s. So the warning stayed on for ≥ 6 s after the room step.
- In 20 loaded runs (10 probe + 10 proof) I could not reproduce that. Which state was late there (a save still refused, or the recovery check not run) is **not shown**.
- The new test would now name it.

### B3 · F1, `integrity:309` (I01, two tabs, the leading one frozen): **a product race; root-cause note written; stopped**

**Note:** `Q/F1-ROOT-CAUSE.md` (commits `2e15567`, `e7d385d`).

**Reproduced under load** with an instrumented copy of the test: 3/20 and 2/12 on :5545, and **1/20 on base :5478**. It passes 10/10 with 4 burners.

**Cause (product, pre-existing).** Today's composer syncs its intention into the timer store 150 ms after Today mounts and after each keystroke (`src/screens/home/Composer.tsx:83–86` → `src/timer/store.ts:399` `setIntention`). The timer's `persist` then writes **that tab's whole timer state**. A tab that has not yet received the other tab's storage event therefore writes its stale `idle` timer over the brew the other tab has just started.
- The starting tab mirrors the idle state: `'reset'`, then Today (`src/timer/sync.ts:31`, `src/app/flow.ts:245`).
- The other tab never sees the brew.
- Both of Lane R's signatures follow ("the other tab idle at `#/`" and "the leader never saw the session").
- In every failing run the non-starting tab's `idle` write comes 4–556 ms after the starting tab's `running` write, before it has mirrored it; its JS stack is `Composer.tsx` → `setIntention`.

**Classification: product.** The test's 0.8 s after boot is something a person can do. Making the test wait until both composers have synced would hide the race, so **I01 is left unchanged** and nothing in `src/timer/**` was touched. The options for the timer owner are in the note.

### B4 · Optional, done (test only, commit `dcf5595`)

**`w3-notices-load.spec.ts`** (the load control; 2 failures at 390×844 / 375×667 light 200 % reduced, also failing on base):
- **Synced with `notice-strip`:** its `onTop()` / `press()` now match `notice-strip`'s (B1), and the N-1 retry for the typed task is added.
- **That alone did not fix the two cases.** Both still failed the same way: the summary's queue held `[200–400, 4000]`, meaning "Saved … of focus" had not run out on Today (`Q/B/proof/w3-notices-load-2cfg{,-v2}.log.txt`).
- **The rest of the difference from the maintained spec is the copy's diagnostic per-frame logger** (an init script that reads notice state and lays out on every frame).
- **A scratch copy without it passes both** (`Q/B/proof/w3-notices-load-2cfg-nolog-scratch.log.txt`, 2/2).
- **Change:** the logger is now opt-in (`W3_LOG=1`), and its read on failure is null-safe.
- **Result:** the two cases, ×2 with `REP=2` → **8/8** (`Q/B/proof/w3-notices-load-2cfg-v3.log.txt`).
- **Not explained:** exactly how the logger's work held the notice's clock back.

**`w2-room:167`** (WebGL lost):
- The test already waits on real state (`data-scene-ready`, bounded at 45 s). Its trouble is that the default 60 s test budget leaves too little after that bound.
- **Change:** `test.setTimeout(120_000)` for this test only; no bound or assertion is changed.
- **Under load, ×3:** **3/3** at **53.4 s, 57.5 s** and 33.9 s, two of them within 3 s of the old 60 s cut (`Q/B/proof/w2room-webgl-x3-load.log.txt`).

### Unproven / open
- **X-1:** the cause of the two historical ≥ 6 s banner failures is not shown; no failure in 20 loaded runs. The new test asserts the real state and would name it.
- **F1:** a product race, stopped for Vibei. `integrity:309` will keep failing about 1 in 6–20 under load until the timer or Composer is fixed. No deterministic, load-free repro: a same-profile Playwright attempt did not reproduce (in the note).
- **X-11, attempt 2's own file:** not re-run to a timeout; ×2 passed. Its timeouts are explained by the mechanism reproduced with my first version (the same snapshot: Stats, Undo announced and gone).
- **Not run on this branch:** the full chromium suite. Run here: tsc and vitest (Phase A; `src` unchanged since), notice-strip 25/25, the owned notice specs, and `integrity` plus `w3-notices-load` in full (below).

### Regression on the final Phase B tree (:5545, `--workers=2`, light load 0.9–6.4)

| Run | Result | Log |
|---|---|---|
| `integrity.spec.ts`, whole file (includes I01 `:309`, unloaded, and the new I03) | **25/25** (4.3 min) | `Q/B/final/integrity-all.log.txt`, `.json` |
| `w3-notices-load.spec.ts`, whole file, `W3_LOAD=1` | **25/25** (11.8 min; Lane R had 23/25 on `2be3de1`) | `Q/B/final/w3-notices-load-all.log.txt`, `.json` |

*Scripts:* `Q/scripts/QB-*.sh`; each ran through the gate (`--lane Q`).
