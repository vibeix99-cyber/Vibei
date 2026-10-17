# CHECKER W3R2 · TS: test-only stability (item 3), LEAD-6

**Under review:** `pe/w3r2-test-stability@21e5644` (`a6b3790`, `21e5644` on base `494748b`), tests tree `59f5e49`, src unchanged (`b74e6b3`).
**Trial:** `6babf87` = integration `f4e57e1` + `21e5644`, worktree `/home/user/wt/w8tr-q`; its `kettle/tests` tree is `59f5e49` (checked: identical to `21e5644:kettle/tests`), its `kettle/src` has 0 diff lines against `494748b`. So the trial's specs are run against integration dev **:5560** (`KETTLE_PORT=5560`; `playwright.config.ts` takes the port from `KETTLE_PORT` and has `reuseExistingServer: true`, so no server of its own is started).
**Binding bar** (`VB-DECISIONS-W3R2.md` §3): the two hidden-tab timer tests and the `press()` re-aim; *no assertion may be weakened; LEAD confirms; each test must pass 10/10 under load.*
**Evidence:** `contracts/W3R2/review/LEAD6/TS/` (my job script `lead6-ts-job.sh`, logs `*.log.txt`). Every browser run went through the slot gate, lane `LEAD6`.

## 1. Scope and the diff, read in full

`git -C /home/user/wt/w8q diff 494748b..21e5644`: two files, nothing else.

| File | Change | Read |
|---|---|---|
| `kettle/tests/timer.spec.ts` (+13/−5) | `background: the worker…` (`:156`): the observer, `startFocus`, the read of `endsAt`/`sessionId`, a 100 ms in-page wait and the freeze become one `page.evaluate`. `hidden page: completion…` (was `:183`, now `:189`): `setHidden(page, true)` moved before `start(…)`; two comments | in full, with the base test beside it (`/home/user/wt/w6-int/kettle/tests/timer.spec.ts`, = `494748b`) |
| `kettle/tests/notice-strip.spec.ts` (+33/−5) | new `inView()`; constants `AIM_AGAIN = 8`, `AIM_PAUSE_MS = 250`, `AIM_RESCROLL = 2`; `press()` gains a `rescrolled` parameter and a pause/re-read path inside the aim loop, with a bounded recursive `press()` when the target is out of view | in full, with `onTop()`, the wheel walk, the sheet fallbacks and every caller |

No `src/` file, no other spec, no config. The injection and diagnostic code lives only in git-ignored scratch copies (`.tmp/`), copied into the packet as `.txt`. I regenerated those copies myself with the maker's `scripts/mkinject.py` / `scripts/mkdiag.py` from the trial tree (into `/home/user/wt/w8tr-q/kettle/.tmp/lead6/ts/`): `old`, `new`, `mid` timer and `old`, `new`, `v1` notice copies are **byte-identical** to the packet's `scratch/*.txt`.

Helpers the changed tests depend on, unchanged by the diff: `open`, `settledLeader`, `info`, `state`, `start`, `secs`, `lateBudget` (400 ms harness / 1500 ms app), `storedSessions`, `setHidden` in the timer spec; `onTop` (wholly in the viewport, and the target at its centre, or at 9 of 9 points when strict), `GONE_MS`, the wheel walk, `park`, the sheet fallbacks and the frame recorder in the notice spec.

## 2. No assertion weakened: line by line

### 2.1 `timer.spec.ts:156` "background: the worker completes on time even with main-thread timers frozen"

| Item | Base `494748b` | `21e5644` | Ruling |
|---|---|---|---|
| scheduler is the worker | `expect((await info(page)).scheduler).toBe('worker')`, before the start | same line, same place | same |
| brew | `start(page, secs(kettlePage, 3))`, intention `''` | `startFocus({ minutes, intention: '' })` with `minutes = secs(kettlePage, 3)`, inside the evaluate | same call, same length (3 s harness / 6 s app) |
| `endsAt`, `sessionId` | `state(page)` = `getState()` read in a second round trip | `getState()` read in the page, the statement after the awaited `startFocus` | same source; now cannot be read from an idle timer |
| observer | `subscribe`: running → idle sets `__doneAt`; installed **after** the start, in a third round trip | the same callback text, installed **before** the start | idle → running (the start) cannot match it; the page is fresh and idle, so no earlier running → idle exists. No false positive |
| freeze | `setTimeout`, `setInterval`, `requestAnimationFrame` = no-ops; `visibilityState` `hidden`, `hidden` true, `visibilitychange` | the same six statements, 100 ms (real page timer) after the start | same statements; now always in the brew's first ~100 ms rather than after two runner round trips |
| end seen | `expect.poll(__doneAt ?? null, { timeout: 10_000, intervals: [200] }).not.toBeNull()` | same | same |
| not early | `doneAt − endsAt ≥ 0` | same | same |
| on time | `doneAt − endsAt < lateBudget(kettlePage)` | same; `lateBudget` unchanged (400 / 1500 ms) | same budget |
| one record | `storedSessions` filtered by `sessionId` has length 1 | same | same |
| title | `toHaveTitle('Tea’s ready — Kettle')` | same | same |

**Does one `page.evaluate` change what is proven?** No. What the test proves is: with main-thread timers dead and the page hidden from early in the brew, the worker still ends it, on time, once, with the done title. Every assertion of that is unchanged. The merge removes only the test-runner gap between the start and the arming (the gap the W3R1 trace shows: `state()` at 10.04 s already read `idle`).

One exposure is the same as before, not new: if the page's own main thread stalls for longer than the whole brew right after the start, the 100 ms in-page timer fires after the end and the freeze leg is vacuous for that run. On base the same stall left the observer and the freeze queued behind it in the same way. Nothing in either version asserts that the freeze landed before the end. The maker's packet says the freeze is "now guaranteed to run before the end"; that is true for a late *runner*, not for a stalled *page*. **FOLLOW-UP (not a weakening):** return `Date.now()` taken at the freeze and assert it is before `endsAt` (with a margin), so that every run proves its own freeze leg.

### 2.2 `timer.spec.ts:189` (was `:183`) "hidden page: completion shows a warm notification; coming back restores the title"

| Item | Base | `21e5644` | Ruling |
|---|---|---|---|
| order | `start(page, secs(kettlePage, 2), 'Essay')`, then `setHidden(page, true)` | `setHidden(page, true)`, then the same `start` | only these two statements swapped |
| one notification | `expect.poll(__notes.length, { timeout: 10_000 }).toBe(1)` | same | same |
| its words | title `The kettle’s whistling! Time for tea.`; body contains `Essay`; tag `kettle-timer` | same three | same |
| title while hidden | `toHaveTitle('Tea’s ready — Kettle')` | same | same |
| back | `setHidden(page, false)`, `toHaveTitle(baseTitle)` | same | same |

**Does hiding first change what is proven?** No. The claim is about a brew that **ends** in a hidden page. The app decides both observable outcomes at the end: `notifyCompletion` reads `document.visibilityState` when `timer:complete` fires (`src/timer/notify.ts:182–188`), and `tabPresence.render` keeps the done title only if the page is hidden when the timer turns idle (`src/timer/tabPresence.ts:194–197`). The `visibilitychange` handlers that run on a hide in mid-brew (`tabPresence` re-render, `ticker` `queueWake`, `wakeLock` evaluate; `notify` acts only on *visible*) have no assertion in this test, before or after. On base, under no load, the hide already landed within milliseconds of the start, so the case covered is the same; what is removed is only the loaded-runner case where the brew ended in a *visible* page, which the app rightly does not notify.

### 2.3 `notice-strip.spec.ts` `press()`

| Item | Base | `21e5644` | Ruling |
|---|---|---|---|
| final check | `expect(at, \`${el} still on top as the tap is aimed\`).not.toBeNull()` after the loop | same line, same words, same place | same |
| what "on top" means | `onTop`: wholly in the viewport and the target at its centre (strict: 9 of 9 points) | `onTop` unchanged; `strict` passed through, also into the recursive call | same |
| the tap | after the loop, at `at` | same | same |
| how the loop ends with a tap | `at` non-null from the `onTop` read made **after** `mouse.move` in that round, and (`same` within 0.5 px and the round < 800 ms) or round ≥ 4 | identical condition, `if (at && ((same && Date.now() - t < 800) || round >= 4)) break` | same: the tap still needs a move-then-read that found the target on top |
| a not-on-top re-check | ends the loop at once, so the expect fails | up to `AIM_AGAIN` = 8 re-reads, 250 ms apart, **without** a tap; a re-read that finds it on top only re-enters a full move-then-read round; after the 8th the loop ends with `at === null` and the same expect fails | the tap is never made on the pause's own read. **On top at the moment of the tap is still proven.** |
| a target that left the view | fails at once | if a pause re-read finds it not on top **and** not wholly in the view, `press()` starts again from the top (the same wheel walk, its own bounds: 60 wheels, three stuck), at most `AIM_RESCROLL` = 2 times; each fresh call has its own 8 re-reads | bounded, but see the two notes below |
| a permanent cover over a target in view | fails, same message | `inView` is true, so no rescroll; 8 re-reads (about 2 s), then the same expect fails with the same message | still fails (my rerun in §3) |

**Notes on the bounds.**
1. The packet says the target is looked at again "at most 8 times in all". That holds within one `press()` call. With the rescroll, the worst case is 3 calls × 8 re-reads (about 6 s of pauses plus up to three wheel walks) for one target. It is still bounded; the packet's sentence should say so.
2. **A loosening in one corner (BLOCKS while §5's fix round is open; cheap to close).** The recursive call reruns the *whole* of `press()`, including the sheet fallbacks that follow an unsuccessful walk: Tab + Enter, and failing that a **synthetic** `click()`. Both only push a line into `keyboardFallbacks`, which is an annotation, not an assertion (`notice-strip.spec.ts:558`). So a target inside a `[role=dialog]` that was on top, then left the view at the re-check, and then cannot be wheeled back, now ends in a keyboard or synthetic press and the test goes on. On base the same target failed with "still on top as the tap is aimed". No current run takes this path (it needs a sheet's control to leave the view mid-aim), but it turns a failure into a silent non-real input, so it counts as a weakening under Vibei's rule. The fix is one flag: a rescrolled call must not take the sheet fallbacks; it fails as before.

**What the re-aim tolerates, plainly.** Something that is not on top of the target at the one re-check read, for less than about 2 s, no longer fails the test. On base this was a single-sample tripwire (one read, at one moment), not a check that holds over time, so the rule "on top at the tap" is what it protects, and that rule is unchanged. The product invariant (no notice over any control, text or row) is the frame recorder's, every frame, and is untouched.

### 2.4 Ruling

| Test | Weakened? |
|---|---|
| `:156` | **No.** Same six assertions, same budgets, same messages. FOLLOW-UP: assert the freeze landed before `endsAt` |
| `:189` (was `:183`) | **No.** Same six assertions; only the order of the hide and the start |
| `press()` | **No** for the tap rule and the permanent cover. **Yes in one corner:** a rescrolled call can end in the sheet's keyboard / synthetic fallback instead of failing (note 2). To be closed in the fix round |

## 3. The injected races, reproduced (my runs)

**How.** The maker's scratch copies, regenerated by me from the trial tree with the packet's `scripts/mkinject.py` (byte-identical to the packet's `scratch/*.txt`, §1), run with the packet's scratch config (`scratch/ts-pw.config.ts.txt`) from `/home/user/wt/w8tr-q/kettle/.tmp/lead6/`, one worker, no burners, `KETTLE_PORT=5560`, through the gate (`lead6-ts-job.sh`, stage C). Log: `C-inject.log.txt`, 18:31:25–18:34:16, load 17.7 → 6.0.
- **Timer pair:** a `page` fixture waits, in the test process, for brew + 0.5 s after the command whose function text holds `startFocus` (3.5 / 2.5 s harness, 6.5 / 4.5 s app: the runner is late, the page untouched). `old` = base `494748b`, `new` = `21e5644`. Each test once in each project.
- **`press()`:** just before the re-check read of the test's first press (Today's composer field), a fixed element the size of the target is put over it: `COVER=transient` (removed after 300 ms) or `COVER=permanent`. 844×390 dark 200 %.

| Fix | Injection | Old (`494748b`) | New (`21e5644`) |
|---|---|---|---|
| `:156` | runner late after the start | **fails 2/2** (harness 14.4 s, app 18.2 s) at the `__doneAt` poll: received `null` (`old/timer.spec.ts:191`) | **passes 2/2** (4.5 s, 8.6 s) |
| `:189` (`:183`) | runner late after the start | **fails 2/2** (13.3 s, 16.3 s) at the notification poll: expected 1, received 0 (`old/timer.spec.ts:220`) | **passes 2/2** (3.3 s, 6.4 s) |
| `press()` | transient 300 ms cover | **fails** in 2.1 s: `… still on top as the tap is aimed`, received `null` (`old/notice-strip.spec.ts:327`, from `:377`) | **passes** (58.0 s, whole test): covered at the re-check, `aim again` 1, 2, then the tap |
| `press()` | permanent cover | (fails on any cover, row above) | **fails** in 4.0 s after `aim again 1 … 8` (2.2 s), with the **same message** at the same expect (`new/notice-strip.spec.ts:356`, from `:406`) |

**Ruling.** Each fix removes the race it was written for, and the permanent cover still fails the new helper with the unchanged words. This matches the maker's §2 (`TS/logs/inject-timer.log.txt`, `inject-notice*.log.txt`). I did not rerun the maker's `mid`, `v1`, `shift` and 1.5 s / 3.5 s bound variants; I read their logs, and they agree with the code as I read it in §2.3.

**What the injection does not show.** The transient-cover injection proves the helper now survives a cover that clears within ~2 s. It says nothing about the failure actually seen under load, which (§4, §5) is not a cover that clears within ~2 s.

## 4. Under load, on the trial specs (my runs)

**Recipe** (as `W3R1/review/FINAL/scripts/LR-stress.sh`): `--workers=2` (two gate slots, lane `LEAD6`) plus 4 CPU burners `( while :; do :; done ) &`, their PIDs kept and killed by PID at the end, each checked gone; never `pkill -f`. Trial worktree `/home/user/wt/w8tr-q/kettle`, `KETTLE_PORT=5560`. One `playwright test` per row; the load average (1, 5, 15 min) is printed at each start and end. The other lead held one more slot throughout, on the same four cores. Script `lead6-ts-job.sh` (stage A); log `A-underload.log.txt`; reports `A-*.json.txt`.

| Run | Result | Load at start → end |
|---|---|---|
| `notice-strip.spec.ts` "…real input (844×390 dark 200 %)" ×10 (`--repeat-each=10`) | **7/10. FAILS the bar.** 3 failures, all the same: `getByRole('textbox', { name: /What are you brewing/ }) still on top as the tap is aimed` at `press` (`notice-strip.spec.ts:328`) called from `:378`, the **first** `press()` of the test (Today's composer field, before any notice and before anything is typed), 7.1 s, 6.6 s and 5.2 s into the test, i.e. after the 8 pauses. The 7 passes took 1.3–1.5 min each | 6.67 7.81 10.57 (18:22:57) → 13.21 13.50 12.44 (18:28:51) |
| `timer.spec.ts:156` ×10 and `:189` ×10, project `timer-app`, one invocation (20 tests) | **20/20**: `:156` **10/10** (9.4–14.4 s), `:189` **10/10** (11.1–15.3 s) | 13.21 13.50 12.44 (18:28:51) → 17.72 15.68 13.45 (18:31:25) |

Burners PIDs 379 380 381 382, started 18:22:52, stopped 18:31:25, all four gone.

Failure snapshots: `A-notice-fail-repeat{0,4,6}.error-context.txt` (an ordinary Today screen, the composer field present, no dialog, no notice; the spec keeps no trace).

**The whole `notice-strip.spec.ts` once** (stage D, `D-notice-whole.log.txt`, `D-notice-whole.json.txt`): `--project=chromium --workers=2` as the spec's header says, no burners, the other lead's job beside it. **25/25 passed** (12.5 min), including 844×390 dark 200 % (56.7 s) and 844×390 light 200 % reduced motion (49.1 s). Load 6.00 11.40 12.18 (18:34:16) → 6.56 7.75 9.87 (18:46:48). This closes the maker's open item §5.2 (the whole file was not run) for the unloaded case; it does not bear on the under-load bar.

With the maker's two runs this is three independent samples of the final helper at this configuration under load: **9/10, 7/10** (mine), and with `a6b3790` 6/10. The final code does not meet "each test must pass 10/10 under load", and my run does not support the reading that one failure in ten is a rare tail.

### 4.1 The remaining `press()` failure, observed (my diagnostic run)

The maker left the cause unobserved. I ran the maker's diagnostic copy (`scripts/mkdiag.py` on the trial spec, only the screenshot path changed; `E-diag.notice-strip.spec.ts.txt`) under the same load: stage E, `E-diag-underload.log.txt`, `E-diag844-x10.json.txt`, 844×390 dark 200 % ×10, `--workers=2` + 4 burners (PIDs 15442–15445, stopped and gone), load 6.36 7.69 9.84 (18:46:53) → 10.43 10.21 10.39 (18:51:37).

**Result: 7/10 again; the 3 failures are identical** (6.1 s, 5.8 s, 6.1 s), at the first `press()` (the composer field):

| Read | Field | What is on top at its centre | Page |
|---|---|---|---|
| the re-check in round 0 (page time 1.7–1.9 s) | top 296, bottom 348 of 390: **wholly in view** | `p._ctaNote` "Then a 5 min tea break. Change…", inside **`sticky div._ctaDock`**: the docked Start's note | `scrollY` 0, no dialog, no leaving layer, nothing inert, `#/` |
| `aim again` 1 … 8 (2.5 to 5.1 s) | the same box, unmoved | the same, every time | the same |
| the failure (5.5–5.9 s) | the same | the same | the same (screenshot `E-diag-fail-1.png`) |

So the field is **not** briefly crossed and **not** out of the view: it sits, still, under the Today page's own docked Start (`.ctaDock`, `position: sticky`, `z-index: 3`, `src/screens/home/Home.module.css:439`), for the whole 2+ s of re-reads, and would stay there until the page is scrolled. Neither of the maker's two mechanisms (wait; walk back if out of view) can cure that state, which is why the rescroll commit moved 6/10 only to 9/10 and 7/10.

**Why the field was on top a moment earlier (inferred, consistent with every log):** the helper skipped the wheel walk, so its first read found the field on top at `scrollY` 0, while the final state at `scrollY` 0 has the field under the dock. In passing runs the walk is taken (the maker's injection logs show `scrollY` 180 at this press). The Today dock changes mode after boot: `Composer.tsx` measures the dock in a `useLayoutEffect` + `ResizeObserver` and sets `data-tall` when it is taller than 60 % of the screen, which takes the dock out of the sticky position into the page flow (`Home.module.css:1013`); at 844×390 @200 % the settled dock is under that line (~210 of 390 px), so it ends docked. Under CPU load that measurement settles after the test's `ready()` and `document.fonts.ready`, i.e. after the first read. Stage F (below, if it ran) logs `data-tall` and the dock's box at the first read to confirm this; the defect does not depend on it.

**Classification.** A test race with the page's boot-time layout, the same failure as W3R1 §9 item 3 (same field, same first `press()`, same words, before any notice exists) and as the base failure in TH's run at 844×390 light 200 % reduced motion (`W3R2/TH/logs/base-notice-suite.log.txt`). Not a new failure introduced by `21e5644`, and not caused by any `src/` change (src is untouched). It is pre-existing product behaviour that a test must be robust to; it is not a product defect of this round (see §5, product note).

## 5. Residuals

| # | Residual | Class | Why |
|---|---|---|---|
| R1 | `press()` at 844×390 dark 200 % under load: **7/10** (mine, twice: stages A and E), 9/10 and 6/10 (the maker's). The composer field sits, in view, under the Today page's sticky docked Start for the whole re-aim window (§4.1) | **BLOCKS** (TS-D1) | Vibei's bar is 10/10 under load. The remaining failure is the same flake as W3R1 §9.3, now observed: not a momentary cover and not out of the view, so the re-aim's premise does not match it |
| R2 | A rescrolled `press()` can end in the sheet's Tab + Enter or synthetic `click()` instead of failing (§2.3 note 2) | **BLOCKS** (TS-D2) | Turns a former failure into non-real input recorded only as an annotation; "no assertion may be weakened". One-line fix |
| R3 | `:156` does not assert that its freeze landed before `endsAt` (§2.1) | FOLLOW-UP | Not a weakening (the base had the same gap); a one-line strengthening, welcome in the fix round, not required |
| R4 | Packet wording: "at most 8 times in all" is per `press()` call; with `AIM_RESCROLL` = 2 the worst case is 3 × 8 re-reads; "the freeze is now guaranteed to run before the end" holds for a late runner, not a stalled page | FOLLOW-UP | Wording only; correct it in the fix-round packet |
| R5 | The timer pair: **10/10 + 10/10** under load (mine, `timer-app`); the maker's 20/20 + 20/20 in both projects; injected race old fails / new passes (mine and the maker's); whole `timer.spec.ts` 26 + 2 skipped (the maker's) | ACCEPTED | Meets the bar; no assertion weakened |
| R6 | The old tests were not run under the same burners as a control | ACCEPTED | The injection is the proof; LEAD-5's matched-load control (W3R1 §9) already showed load alone passes the old pair |
| R7 | Whole `notice-strip.spec.ts` | ACCEPTED for this round: **25/25** (mine, stage D, no burners) | Closes the maker's open §5.2 |
| R8 | **Product note, not this item:** at 844×390 @200 % the Today dock appears to change mode after boot (in the page flow, then docked) and then covers the task field at `scrollY` 0; a person tapping the field in that moment would hit the dock's note ("Change brew length" is in it). Pre-existing (W3R1, TH base) | FOLLOW-UP for Vibei / the Final Boss (out of scope; no `src/` change allowed in item 3) | Logged so the test fix does not hide it: the test must handle it, the product question stays open |

## Verdict: **REJECT** `pe/w3r2-test-stability@21e5644` (trial `6babf87`), two defects (TS-D1, TS-D2), one 90-minute fix round (§6)

- **Timer pair: done.** No assertion weakened; the injected race fails the old tests and passes the new ones; 10/10 and 10/10 under load on the trial. These two changes may be kept as they are.
- **`press()`: not done.** 7/10 under load (twice), so Vibei's 10/10 is not met, and the failure that remains is now observed and is not one the re-aim can cure. One corner of the rescroll also loosens a former failure into a keyboard or synthetic press.
- Nothing merges from this branch until the fix round passes.

## 6. Fix round (90 minutes, one round): TS-D1 and TS-D2

**Branch:** continue `pe/w3r2-test-stability` from `21e5644` (worktree `/home/user/wt/w8q`). Keep `a6b3790`/`21e5644`; add commits.
**Files allowed:** `kettle/tests/notice-strip.spec.ts` only. `kettle/tests/timer.spec.ts` only for the optional R3 line. No `src/`, no other spec, no config. Scratch/injection/diagnostic copies stay in git-ignored `.tmp/` and are copied into the packet as `.txt`.

### TS-D1 · the composer field under the docked Start (the observed cause)
**Defect.** At 844×390 dark 200 % under load, the first `press()` (Today's "What are you brewing?" field) finds the field on top, then the page's boot layout settles and the field is, from then on, wholly in view but under the sticky docked Start (`.ctaDock`). The re-aim waits 8 × 250 ms and fails with "… still on top as the tap is aimed". 3/10 in two of my runs (§4, §4.1).

**Required outcome.**
1. `press()` brings a target that is in view but covered by the **page's own docked chrome** (the Today `.ctaDock` and the tab bar or side rail, i.e. what the walk at the top of `press()` already treats as "under the docked start / tab bar: bring it up") clear of it by the same real wheel walk, within the existing `AIM_RESCROLL` bound. The maker's `scratch/UNVERIFIED-chrome-aware-rescroll.diff.txt` is a starting point, **but** its rule "any fixed or sticky ancestor" is too wide: it must **not** treat a notice (`[data-notice-strip]`, `[data-inline-undo]`), a sheet (`[role=dialog]`, `#root[inert]`), or a cover the test did not identify as page chrome, as something to wheel away from. Those keep the wait-only path and fail as now. An alternative that also meets the outcome: before the first `press()` of a screen, wait (bounded, stated) until the composer dock's mode and box are stable across frames. Either way, state the bound.
2. Unchanged: the `expect(at, \`${el} still on top as the tap is aimed\`)` line and words; the tap only after a move-then-read that finds the target on top; strict mode; the 800 ms / 0.5 px / 5-round rules; `GONE_MS`.
3. Confirm the cause in the packet with a diagnostic under load before the fix: the dock's `data-tall`, computed `position` and box at the field's first read and at the failing re-check (my stage-F copy does this: `.tmp/lead6/ts/diag3/` in `/home/user/wt/w8tr-q/kettle`, `E-`/`F-` logs here). If what is seen is **not** the docked Start, stop and report; do not widen the helper to fit.

### TS-D2 · a rescroll must not end in a non-real press
**Defect.** The recursive `press(…, rescrolled + 1)` reruns the sheet fallbacks (Tab + Enter, then a synthetic `click()`), which on base could not follow an aim-time failure.
**Required outcome.** A rescrolled (or chrome-cleared) call that cannot bring the target on top **fails**, with "… can be brought on top by real scrolling" or the unchanged "… still on top as the tap is aimed"; it never takes the keyboard or synthetic fallback.

### Optional in the same round (R3, R4)
- R3: return `Date.now()` at the freeze from `:156`'s evaluate and assert it is before `endsAt` (state the margin). If taken, rerun `:156` ×10 under load in both projects.
- R4: correct the two sentences in the packet.

### Acceptance (◆ = I rerun)
1. ◆ **Diff and no-weakening.** Only the allowed file(s); the packet's §1 table updated line by line for the new path; the classes of cover that are wheeled away from are listed and justified; notices and sheets are not among them; the total bound per target is stated.
2. ◆ **Injection, old vs new, 844×390 dark 200 %, workers=1** (scratch copies by `mkinject.py`, extended):
   - `COVER=dock`: at the first press's re-check, put the field under the docked Start the way the page does (e.g. scroll to 0 so the field is at 296–348 under `.ctaDock`, or toggle the dock out of `data-tall`): **`21e5644` fails** with "… still on top as the tap is aimed" after the 8 re-reads, **the fix passes** (whole test);
   - `COVER=transient` (300 ms) passes;
   - `COVER=permanent-abs` (a cover anchored in the page over the field) **fails** with the same words;
   - `COVER=permanent` (the fixed-position cover) **fails** with the same words (it is not page chrome);
   - a sheet target forced through a rescroll (or a code-path argument, if no injection can reach it) shows TS-D2 fails rather than falls back.
3. ◆ **Under load** (recipe of `W3R1/review/FINAL/scripts/LR-stress.sh`: `--workers=2` + 4 burners killed by PID; load average at each start and end): `notice-strip` 844×390 dark 200 % **×20: 20/20**, and 844×390 light 200 % reduced motion **×10: 10/10** (the same flake on TH's base run). I rerun ×10 of each.
4. ◆ **Under load, the fix is exercised, not just lucky:** the diagnostic copy on the fix, ×10 under the same load, logs how many times the new chrome path was taken; 10/10 passes.
5. ◆ **Whole `notice-strip.spec.ts` once: 25/25** (`--workers=2`).
6. **Timer pair unchanged** (or, with R3, `:156` ×10 under load in `timer-app` and `timer-harness`, 10/10 each).
7. Packet `TS-READY.md` §6 (fix round), staged commits, `.txt` evidence ≤ 20 MB each, no model names; hard stop as set by the orchestrator.
