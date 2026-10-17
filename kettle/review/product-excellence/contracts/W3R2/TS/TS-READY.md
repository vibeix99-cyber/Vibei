# TS-READY: W3R2 item 3, test-only stability (maker TS)

**Branch** `pe/w3r2-test-stability`, worktree `/home/user/wt/w8q`, base `494748b`.
**Scope kept:** `kettle/tests/timer.spec.ts` and `kettle/tests/notice-strip.spec.ts` only; no `src/` file, no other spec. The injection code lives in the git-ignored `kettle/.tmp/` and is copied into this folder as `.txt`.

**How every spec was run** (the same for all runs below):
- `playwright.config.ts` takes its base URL from `KETTLE_PORT` and has `webServer.reuseExistingServer: true`, so `KETTLE_PORT=5583` uses the dev server already running for this worktree (:5583, `vite --config .tmp/w2.vite.config.ts`, the debug API on). It serves the same app code as :5560.
- Timer specs: the config's two projects, `timer-app` (`kettlePage: '/?debug&onboarded=1#/'`) and `timer-harness` (`'/tests/harness/timer.html'`), both. Notice spec: project `chromium`. No `playwright install`.
- Every browser run went through the gate: `slots.py run --lane TS --n 1|2 -- …` (`scripts/gate.sh`). Each log has `### start` / `### end` lines with the load average (1, 5, 15 min).
- The injection runs use the scratch config `scratch/ts-pw.config.ts.txt` (the same projects, `testDir` pointed at the scratch copies).

## 1. The changes (`scratch/spec-changes.diff.txt` is the whole diff against the base, 46 insertions, 10 deletions)

Note: after the edit the hidden-page test is at `timer.spec.ts:189` (it was `:183`); `:156` is unchanged. The notice test is still `notice-strip.spec.ts:~358` (the line moved by the added lines in `press()`); it is found by name.

### 1.1 `timer.spec.ts`, "background: the worker completes on time even with main-thread timers frozen"

Before:
```ts
await start(page, secs(kettlePage, 3));
const { endsAt, sessionId } = await state(page);
await page.evaluate(() => {
  const w = window as any;
  w.__kettle.timer.subscribe((s, p) => { if (p.status === 'running' && s.status === 'idle') w.__doneAt = Date.now(); });
  // What an aggressively throttled background tab looks like: main-thread timers never fire.
  w.setTimeout = () => 0; w.setInterval = () => 0; w.requestAnimationFrame = () => 0;
  Object.defineProperty(document, 'visibilityState', …'hidden'); Object.defineProperty(document, 'hidden', …true);
  document.dispatchEvent(new Event('visibilitychange'));
});
```
After:
```ts
const { endsAt, sessionId } = await page.evaluate(async (minutes) => {
  const w = window as any;
  w.__kettle.timer.subscribe((s, p) => { if (p.status === 'running' && s.status === 'idle') w.__doneAt = Date.now(); });   // armed first
  await w.__kettle.timer.getState().startFocus({ minutes, intention: '' });
  const { endsAt, sessionId } = w.__kettle.timer.getState();                                                          // read in the page
  await new Promise((r) => setTimeout(r, 100));          // the moment the separate commands used to take, kept in the page
  w.setTimeout = () => 0; … (the same freeze, the same hidden page)
  return { endsAt, sessionId };
}, secs(kettlePage, 3));
```
**Why this is what the race needs.** The brief's fix is "arm the observer before the brew starts". The traces (`W3R1/…/postmerge/trace-timer156-background.txt`) show three commands after `startFocus` all arriving after the brew had ended: `state()` (10.04 s: `idle`, `sessionId` null, `endsAt` null), then the observer and freeze evaluate (10.18 s). Arming the observer first fixes the first miss, but `state()` is then read from an idle timer (`endsAt` null) and `doneAt − endsAt` is nonsense (§2.1, variant `mid`: it fails 4/4 under the same injection). So the observer, the start, the read of `endsAt` / `sessionId` and the freeze are one page task chain; the freeze keeps its place early in the brew (100 ms after the start, timed in the page, where the separate commands used to leave the gap of two round trips) and can no longer land after the end.

**Why no assertion is weaker.** The assertions after the evaluate are not touched, line for line:

| assertion | before | after |
|---|---|---|
| scheduler is the worker | `expect((await info(page)).scheduler).toBe('worker')` | same line, same place (before the start) |
| the end is seen, in time | `expect.poll(__doneAt ?? null, {timeout: 10_000, intervals: [200]}).not.toBeNull()` | same |
| not early | `doneAt − endsAt ≥ 0` | same |
| on time | `doneAt − endsAt < lateBudget(kettlePage)` (400 ms harness / 1500 ms app) | same, same budgets |
| exactly one record | `storedSessions(page)` filtered by `sessionId` has length 1 | same |
| title | `toHaveTitle('Tea’s ready — Kettle')` | same |

The checks that the main-thread timers are frozen and the page hidden while the brew runs are the same statements; they are now guaranteed to run before the end, not after a runner-dependent gap. `endsAt` and `sessionId` are read from the same `getState()` as before, one statement after `startFocus`.

### 1.2 `timer.spec.ts`, "hidden page: completion shows a warm notification; coming back restores the title"

Before: `await start(page, secs(kettlePage, 2), 'Essay'); await setHidden(page, true);`
After:  `await setHidden(page, true); await start(page, secs(kettlePage, 2), 'Essay');` (and a comment).

**Why no assertion is weaker.** Only the order of two existing statements changed; every `expect` after them is untouched: exactly one fake `Notification` (poll, 10 s), its title `The kettle’s whistling! Time for tea.`, body contains `Essay`, tag `kettle-timer`, page title `Tea’s ready — Kettle` while hidden, and after `setHidden(false)` the title is `baseTitle`. The behaviour under test is unchanged: the brew still ends in a hidden page, and `notifyCompletion` / `tabPresence` read `document.visibilityState` only at the end of the brew (`notify.ts:185–188`, `tabPresence.ts:194–197`), not at the start. Hiding earlier does not make the test easier; it removes the case where the brew ends in a *visible* page, which the app handles by making no notification, so the test could only fail there for a reason that is not the product's.

### 1.3 `notice-strip.spec.ts`, `press()` (two commits: `a6b3790` re-aim, `21e5644` bring back by the wheel)

Before (the aim loop and its check):
```ts
for (let k = 0; ; k++) {
  const t = Date.now();
  await page.mouse.move(Math.round(at!.x), Math.round(at!.y));
  const again = await onTop(page, el, strict);
  const same = !!again && Math.abs(again.x - at!.x) < 0.5 && Math.abs(again.y - at!.y) < 0.5;
  at = again;
  if (!at || (same && Date.now() - t < 800) || k >= 4) break;      // a null re-check ended the loop at once
}
expect(at, `${el} still on top as the tap is aimed`).not.toBeNull();
```
After (final):
```ts
const AIM_AGAIN = 8; const AIM_PAUSE_MS = 250; const AIM_RESCROLL = 2;          // next to GONE_MS
const inView = (el) => el.evaluate((e) => { const r = e.getBoundingClientRect();   // the first test of onTop
  return r.width > 0 && r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth; }, undefined, { timeout: GONE_MS });
async function press(page, touch, el, over?, strict = false, rescrolled = 0): Promise<{ x; y; w; h; top }> {
  …                                                                                // (unchanged up to the aim loop)
  for (let k = 0, covered = 0; ; ) {
    if (!at) {                                                                     // not on top at the last re-check: look again
      if (covered++ >= AIM_AGAIN) break;
      await page.waitForTimeout(AIM_PAUSE_MS);
      at = await onTop(page, el, strict);
      if (!at && rescrolled < AIM_RESCROLL && !(await inView(el))) return press(page, touch, el, over, strict, rescrolled + 1);
      continue;
    }
    const round = k++;
    const t = Date.now();
    await page.mouse.move(Math.round(at.x), Math.round(at.y));
    const again = await onTop(page, el, strict);
    const same = !!again && Math.abs(again.x - at.x) < 0.5 && Math.abs(again.y - at.y) < 0.5;
    at = again;
    if (at && ((same && Date.now() - t < 800) || round >= 4)) break;
  }
  expect(at, `${el} still on top as the tap is aimed`).not.toBeNull();             // the same line, the same words
```
**The bounds, stated:**
- After a re-check finds the target not on top, `press()` waits 250 ms and reads it again, at most 8 times in all (about 2 s plus the reads). A ninth ends the loop with `at === null` and the unchanged `expect` fails with the unchanged message.
- If that read finds the target **not covered but out of the view** (the page moved under it), `press()` is run again from the top, which brings it back by the same wheel walk as at the start (its own limits: 60 wheels, three stuck wheels end it), at most `AIM_RESCROLL` = 2 times.
- Untouched: at most 5 aim rounds (`round >= 4`), a round that took 800 ms or more is made again, a target that has gone fails within `GONE_MS` (15 s) on any read.

**Why the second commit (what the first under-load run showed).** `a6b3790` alone (re-aim only) failed 4 of 10 runs in the first under-load run (`logs/underload-notice-first.log.txt`): each at the first `press()` (the "What are you brewing?" field), after the 8 pauses, with the message above, in 4.7–5.7 s. A covered field would have come free within 2 s; these did not, so the field was not on top for a reason that waiting does not cure. In the injection runs the first `press()` starts with the page already scrolled (`scrollY` 180 at 844×390 dark 200 %: the field needed the wheel walk), so a later move of the page puts the field out of the view. The snapshot at each failure (`error-context.md`) shows an ordinary Today screen, nothing covering. I did not catch the moving page itself (a diagnostic run at one worker with 4 burners, 4 of 4 passed and was stopped; the page-level trace was not available in a spec with `trace: 'off'`). So: the cause "the page moved the field out of the view" is **inferred, not observed**; what is shown is that this condition, injected, fails the old helper and the re-aim-only helper with the very same message and passes the final one (§2.2), and the under-load runs of §3.

**Why no assertion is weaker.**
- The `expect(at, "… still on top as the tap is aimed").not.toBeNull()` line is the same text, reached the same way.
- The tap (`touchscreen.tap` / `mouse.click`) is reached only through the `break`, which needs `at` non-null from an `onTop` read made **after** `mouse.move` onto the target in the same round, or through the nested `press()`, which ends in the same tap under the same rule. "On top at the moment of the tap" is checked as before (strict mode is still 9 of 9 points; `same` and the 800 ms rule are unchanged). After a not-on-top read the next tap-bound read is again a *move, then read* round, never the pause's own read alone.
- A target that stays covered (in the view, something on top of it) still fails, after the 8 pauses, with the same message (§2.2, permanent cover).
- What changed is only that a single not-on-top read no longer ends the walk. A target that has left the view is walked back to as at the start; the same reads that used to fail the test at once now have to be followed by 8 more reads (about 2 s) to fail it.
- `press()` is local to this spec and used by all 25 tests; the whole-file run (§4) covers every configuration.
- The product invariant (zero overlap between any notice and any control) is asserted by the frame recorder (`__inv`, every animation frame of every test) and is untouched; `press()` only gates the test's own input.

## 2. The injected race: old fails, new passes

The injection code is a scratch copy, derived from the committed specs by `scripts/mkinject.py` (text patch; the committed specs are not touched). The `old` copy comes from `494748b`, the `new` copy from the branch. Both get the identical injection. Copies: `scratch/{old,mid,new}.timer.spec.ts.txt`, `scratch/{old,new}.notice-strip.spec.ts.txt`.

### 2.1 Timer pair (`logs/inject-timer.log.txt`)

**Injection:** a `page` fixture whose `evaluate` is followed by a test-side wait of (brew length + 0.5 s) after the command whose function text holds `startFocus` (the command that starts the brew): the reply reaches the test process late, the next command is sent after the brew is over. The page is not touched. Wait 3.5 s / 2.5 s in the harness and 6.5 s / 4.5 s in the app (in the app the delays LEAD-5 used, `W3R1/CHECKER-W3R1-F1FIX.md` §9). Two rounds of each test in each project, one browser at a time, :5583.

| variant | `:156` background (harness ×2, app ×2) | hidden page (harness ×2, app ×2) |
|---|---|---|
| **old** (base `494748b`) | **fails 4/4**: `__doneAt` poll `null` (`expect(received).not.toBeNull()`) | **fails 4/4**: notifications `0`, expected `1` |
| **mid** (old + only the observer moved before the start; the brief's one-line shape) | **fails 4/4** at `doneAt − endsAt < lateBudget`: received 1.79e12 (`endsAt` read as null from an idle timer) | not changed in `mid` (old order): fails 4/4 as old |
| **new** (the branch) | **passes 4/4** | **passes 4/4** |

`mid` shows why 1.1 moves the read of `endsAt` / `sessionId` into the page as well: with only the observer first, a runner that is late after the start still fails, one assertion later.

### 2.2 `press()` (`logs/inject-notice.log.txt`, `logs/inject-notice-bound.log.txt`, `logs/inject-notice2.log.txt`)

**Injection:** just before the re-check read in `press()` of the **first** press of the test (Today's "What are you brewing?" field, the place of the original failure), once per test, 844×390 dark 200 %, workers=1, :5583:
- `COVER=transient`: a fixed-position element (`z-index` max) the size of the target (+4 px) is put over it and removed after 300 ms;
- `COVER=permanent`: the same, never removed;
- `COVER=shift`: the page is scrolled 400 px (`scrollBy`, instant) at that read, so the field is out of the view (the log shows `top -284 bottom -232 of 390`; the page had been at `scrollY` 180).

Variants: `old` = base `494748b`; `v1` = `a6b3790` (re-aim only); `new` = the final `21e5644`.

| injection | old | v1 (re-aim only) | new (final) |
|---|---|---|---|
| transient 300 ms cover | **fails** in 2.7 s: `getByRole('textbox', { name: /What are you brewing/ }) still on top as the tap is aimed`, received `null` | **passes** (whole test, 1.2 min): covered at +81 ms, one `aim again`, tap | **passes** (1.3 min): covered, two `aim again`, tap |
| permanent cover | **fails** in 2.3 s, same message | **fails** after 8 pauses, **same message**, same line | **fails** after 8 pauses (the log lists `aim again 1 … 8`), **same message**, same line (`expect(at, … still on top as the tap is aimed)`) |
| page moved, field out of the view | **fails** in 3.1 s, same message | **fails** after 8 pauses, same message | **passes** (1.2 min): one `aim again`, `out of view: bring it back by the wheel`, the walk, the tap, and the rest of the test |

The transient and permanent rows for `v1` are `logs/inject-notice.log.txt`; the rest of the `old` / `v1` / `new` rows of this table are `logs/inject-notice2.log.txt` (the `new` transient and permanent rows are re-measured there on the final code).

**The bound, shown (v1 code; the covered-in-view path is the same in the final code, `logs/inject-notice-bound.log.txt`):**

| transient cover | result |
|---|---|
| 1500 ms | **passes** (whole test, 1.1 min): covered re-check, 6 `aim again`, then the field is free and the tap follows |
| 3500 ms | **fails** in 4.6 s with the same message: it outlasts the 8 pauses (2.1 s: 29.410 to 31.552) |

So a cover is tolerated only while it lasts less than about 2 s. The frame recorder (`__inv`, every animation frame of the test) is untouched and still counts any real notice-over-control overlap as a hit, whether or not `press()` waited for it.

## 3. Under load: 10/10

**The load:** the recipe of `W3R1/review/FINAL/scripts/LR-stress.sh` (`scripts/underload.sh`): `--workers=2` (two gate slots) plus 4 CPU burners (`( while :; do :; done ) &`, their own PIDs, killed by PID at the end and checked gone), on top of the other makers' browsers on the same four cores (the load average was already 12–20 before my burners started). Dev server :5583, one `playwright test` per row, `--repeat-each=10`. The load average (1, 5, 15 min) is read at the start and the end of each run (`### start` / `### end` lines in the logs).

| run | log / report | result | load at start → end |
|---|---|---|---|
| `timer.spec.ts:156` ×10, `timer-app` | `logs/underload-timer.log.txt`, `logs/load-timer156.json.txt` | **10/10** (117 s of test time) | 19.35 16.55 12.97 (16:36:10) → 19.97 17.97 14.06 (16:38:48) |
| `timer.spec.ts:156` ×10, `timer-harness` | same | **10/10** (50 s) | same run |
| `timer.spec.ts:189` (was :183) ×10, `timer-app` | `logs/underload-timer.log.txt`, `logs/load-timer183.json.txt` | **10/10** (102 s) | 19.97 17.97 14.06 (16:38:48) → 23.51 19.91 15.36 (16:41:21) |
| `timer.spec.ts:189` ×10, `timer-harness` | same | **10/10** (51 s) | same run |

Burners of the timer runs: PIDs 3073 3074 3075 3076, started 16:36:05, stopped 16:41:21, all four reported gone.

`notice-strip.spec.ts` at 844×390 dark 200 % (the original failure), `--repeat-each=10 --workers=2` plus 4 burners, same recipe, same server:

| run | code | log / report | result | load at start → end |
|---|---|---|---|---|
| 1st | `a6b3790` (re-aim only) | `logs/underload-notice-first.log.txt`, `logs/load-notice338-first.json.txt` | **6/10**: 4 failures, all `… still on top as the tap is aimed` at the first `press()` (the composer field), 4.7–5.7 s into the test, i.e. after the 8 pauses | 12.84 16.72 14.97 (16:44:35) → 11.88 15.52 15.05 (16:49:02); burners 13223–13226 stopped, gone |
| 2nd | `21e5644` (final: + bring back by the wheel) | `logs/underload-notice.log.txt`, `logs/load-notice338.json.txt` | **9/10**: 1 failure, the same message at the same first `press()` (6.3 s) | 17.32 17.63 15.48 (17:20:27) → 10.64 15.89 15.83 (17:28:00); burners 5753–5756 stopped, gone |

**So the 10/10 for this test is NOT met.** The change took the failure rate in this load from 4/10 to 1/10 (one sample each), not to 0. The remaining failure is the same line; its cause is not identified (§5.1).

The load is the machine's, not a calibrated one: the other makers' browsers were running on the same four cores throughout (load average 10–23).

## 4. The whole files

| file | run | result | load at start → end |
|---|---|---|---|
| `timer.spec.ts`, `timer-app` + `timer-harness` | `logs/whole-timer.log.txt` (`KETTLE_PORT=5583`, the config's one worker, no burners) | **26 passed, 2 skipped, 0 failed** (3.5 min). The two skips are the spec's own `test.skip(!kettlePage.includes('harness'))` for `:302` and `:446` in `timer-app` | 12.42 13.49 11.29 (16:32:27) → 20.61 16.62 12.93 (16:35:56) |
| `notice-strip.spec.ts`, all 25 | **NOT RUN** | the gate had no two free slots for the 25-minute run before the stop (the other lanes held 2 to 3 slots from 16:50 on; my queued job was waiting from 17:28) | |

Why the missing whole-file run is a smaller risk than it looks (an argument, not a substitute for the run): in `press()` the new code runs only when the re-check read finds the target **not** on top, which used to end the walk with a failure. When the re-check is on top, the loop does what it did (the same `same` / 800 ms / `round >= 4` conditions, the same tap). So a configuration that passed before takes the same path; the change can only turn a former immediate failure into a retry. The two under-load runs above did go through the whole 844×390 dark 200 % walk (the long path: 9 + 6 full passes, 1.0 to 1.6 min each), and the injection runs of §2.2 went through it three more times.

## 5. Open items

1. **`notice-strip.spec.ts`, 844×390 dark 200 %, first `press()`: 1 failure in 10 under load remains** (9/10; 6/10 with the re-aim alone). Same message. What is known: the target is not on top for more than the ~2 s of re-reads; the page snapshot at the failure is an ordinary Today screen; in the injection runs this first press starts with the page already scrolled (`scrollY` 180), and a page that moves under the field makes the old helper and the re-aim-only helper fail with this very message while the final one recovers (§2.2). What is not known: what the page does in the failing runs. I did not observe it: the diagnostic copy (`scratch/diag.notice-strip.spec.ts.txt`: logs, at every not-on-top read, the target's rect, the viewport, scroll, and the element at its centre with its fixed / sticky ancestor, and takes a screenshot at the final failure) ran once at one worker with 4 burners (4 of 4 passed, then stopped; that log was overwritten and is not kept) and once more with the page's CPU throttled (`logs/diag2-notice.log.txt`, see below); the 2-worker run of it never got slots. A candidate cause, unconfirmed: the composer's docked start (sticky; `Composer.tsx:121–144` measures it and may switch it to in-flow at 200 % text on a landscape phone) changing after the first read, so the field ends up under it rather than out of the view. The fix I would try, **not built into the committed spec**: also bring the target back by the wheel when what covers its centre is fixed / sticky page chrome (the recorder's `chromeOf` rule), keeping the pause-only path for any other cover. It would make a `position: fixed` permanent cover escapable by scrolling, so the permanent-cover probe would have to use a cover anchored in the page (the scratch has `COVER=permanent-abs` for that).
2. **Whole `notice-strip.spec.ts` (25/25) not run** (§4).
3. **Line numbers moved** by the added lines: the hidden-page test is `timer.spec.ts:189` (was `:183`); the notice test is `notice-strip.spec.ts:366` (was `:338`). `:156` is unchanged.
4. **The under-load runs are not a control.** I did not run the old tests under my burners: LEAD-5's matched-load control already showed that load alone passes the old timer pair 10/10, which is why the injection (§2.1), not the load, is the proof of the timer fixes. The 10/10 of §3 shows the new tests pass under load; it does not by itself show the old ones would fail.
5. **The 2 s window and the "moved out of the view" rule are judgements** (no one has seen what covered the field in the original failure). The bound is stated and shown (§2.2); a longer cover fails.
6. **`:156` keeps its freeze leg in every run** (the freeze is now inside the page chain; it used to follow a runner-dependent gap). Not an open item, noted so LEAD does not look for a vacuous-freeze case.
