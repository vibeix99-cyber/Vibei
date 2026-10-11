# Round 8 review, Lane 1: receipt

- **Lane:** L1. Runs checks and writes receipts only. **No verdict is issued here.** No app code, test or maker file was
  edited; nothing committed or pushed.
- **Model:** Claude Opus 5.5 (`claude-opus-5-5`), newly launched; implemented nothing in rounds 7 or 8.
- **Wall clock:** start 2026-10-11 18:07:24 UTC; end 2026-10-11 19:13:41 UTC (about 67 minutes; budget 75). Last browser run ended 19:13:12 UTC.
- **Under review:** R8 = trial merge `9ff0d04` (`kettle/src` `42e106daaf06…`, checked with `git rev-parse HEAD:kettle/src`
  in `/home/user/wt/r8-trial`), dev server http://127.0.0.1:5306.
- **Raw evidence:** `L1/runs/<series>/` (jsonl, stdout, frames); every invocation's START/END line (UTC, URL, port,
  revision, probe sha256 prefix, env, args, load) is in `L1/runs/series.log`.
- **Probes** (copies in `/home/user/wt/r8-trial/kettle/.tmp/L1/`, sha256):

| Probe | sha256 | Source | Edited? |
|---|---|---|---|
| `toastroom2.mjs` | `7123da04ab3a894bfb619c9dd34eaedd3dc244579c32b94bbbd0b4c89a440053` | lead, `/home/user/wt/rv7-int/kettle/.tmp/LEAD2/` | no |
| `accept.mjs` | `b65020aba91419215d532c73e8ca97230b4c8bb3f47fbd712a105feeccfdc677` | M8, `r8/M8/probe/` | no |
| `l1dock.mjs` | `d89b19062ece5ab6bdf9e64a37d4427982f419b0579599621898b049a7260a57` | **L1, new** (setup copied from the two above; adds every-control per-frame check, per-frame toast wholeness, taps on a folded Update, scroll back to top) | — |
| `natural-a2.mjs` | `8900b49e78c4225dab08521244dcc9be49ac12a4f8c9762daed572563fbb50bb` | Lane A, `round7-review/A/probes/` | no |
| `markdone-a3.mjs` | `24981c7298ddc649baccc3fd47afe2745c1567fc713634aebf4cd23cfbbfd928` | Lane A (KEY unset = `markdone-a2`) | no |
| `lib.mjs` | `73573546a7469dc1dc1026a043b53f9cd61f8326dce164ce34f0f358ff5eb861` | Lane A | no |
| `closecheck2.mjs` | `863c0a92e0dcd8d55334bf19d90813e80f04fc0a3df217285a33c4a8285af1de` | Lane C | no |
| `l1dock2.mjs` | `933731512d087ba52f80ef94d12e2c45a697371ce61315076824f42cbeb96807` | **L1** = `l1dock` + per-frame time / phase / stack size (diff `probes/l1dock2-vs-l1dock.diff`) | — |
| `accept-diag.mjs` | `a800319b3816296e6ceaa8c6d8e50894ab9f0405c704fb0a9440b828c5c903f4` | **L1 diagnostic** = `accept.mjs` + navigation / console / crash listeners (diff `probes/accept-diag.diff`) | listeners only |
| `accept-diag2.mjs` | `5672ad1ac1a9d424531c2fd1d980599488cbd37c99efb4b734d83b74098a921a` | **L1 diagnostic** = `accept-diag` + load / request-failure / HTTP ≥ 400 listeners, post-failure document check (diff `probes/accept-diag2.diff`) | listeners only |
| `closesum.py` / `geomcmp.py` / `agg.py`-derived `l1sum.py`, `tl.py` | `127f21b9…` / `a89cb0e9…` / `24345bde…`, `c63e4a73…` | Lane C / M8 (unedited) / L1 summarisers | — |
| `run1.sh` (runner, logs series.log) | `d7ffd123816ec15d1a612d303e7516dd4ab5ca4b182ffae036cbeb4c506ac0fa` | L1 (modelled on Lane A's `one.sh`) | — |

Every browser launch went through `slots.py run --lane L1 --n 1`. Each probe invocation launches one Chromium and opens a
fresh context (fresh, disposable profile) per configuration/run.

Copies of every L1 probe, runner, job script and diff, with `SHA256SUMS`, are in `L1/probes/`.

## Summary (counts only; no verdict)

| Check | Control this session | R8 `9ff0d04` | Zeros count? |
|---|---|---|---|
| 1. R7-D1 at 667×375 / 844×390 @200, top/middle/end, wheel + touch, 1–3 toasts incl. the update prompt | `b39202f` **reproduced** with all three probes (lead's `toastroom2`: 11 / 26 px visible, Update not on top; `accept`: 24 / 35 covered frames, taps 1/7, 2/7; `l1dock`: 65 covered frames, 786 not-whole toast frames, taps failing; `accept-diag2` 844 dark wheel: 40 / 43 covered) | **0 covered control frames** in every completed run (accept, l1dock, l1dock2, closecheck); every **settled** toast sample whole (0 of all accept/toastroom2 samples); every action on top; **all real toast-action taps activated** (Update incl. folded, Undo); update prompt at the end 146–186 px whole, docked over the stage | **Yes** at 200 % |
| 1. per-frame toast wholeness (L1 probe) | reproduced (786 frames) | **not zero**: 5–27 frames per run of the action-less "Cozy level 5!" partly clipped (12–41 of 57 px) at the bottom of the docked stack while it re-lays out after a toast arrives/leaves; in `l1dock2` all ended within 0.5 s; in one `l1dock` run under load it lasted to ≥ 0.8 s (one sample, 31/57 px). No toast with an action was ever clipped | Yes (control reproduced) — reported, no verdict |
| 1. page loss | 0 of 2 (`b39202f`, 844 dark wheel, diag2) | **3 of 10** 844×390 @200 **wheel** runs lost the page ("Execution context was destroyed") with no navigation request / framenavigated / console line logged before it; 0 in all other configurations/inputs; cause not established | — |
| 1. 150 % / 100 % (8 of 8 configs, one input each) | not run | 0 covered; 1 not-whole settled sample (667 @150 dark: action-less Cozy 38/49 px as the stack docked); all 56 taps activated; stacks of 2+ dock already at the panel's top | No control (no-regression rows) |
| 1. Close / Ambience / Mute | `49ea1de` reproduced Ambience (138 + 316 covered frames, taps 1/4) at 667×375 and Close (159 covered, tap 1/2) at 375×667 | Ambience 0/1235, Mute 0/1235, Close 0/2126 covered; taps Ambience 4/4, Mute 4/4, Close 4/4 | Yes for Ambience (667) and Close (375); Mute: control not established |
| 1. scroll back to the top with a docked stack | — | stays docked over the stage, whole, actions on top, nothing covered; undocks only when the stack empties | — |
| 2. portrait 375×667 / 390×844 @100/200, light/dark | `b39202f` rows | **32 of 32 samples identical** | equality, not a reproduction |
| 2. landscape dock geometry | — | documented in 2.2 | — |
| 3a. R5-D1, 375×667 @200 wheel, light / dark | R5 **strict reproduction** in 8 runs each | 0 failures in 6 + 6; banner 1/0 in 12/12; live-region additions ≤ 1; Save backup never cut | **Yes** |
| 3b. LEAD-D1, cases 1 and 2, 375×667 @200 light/dark, 844×390 @200 | `e866118` **reproduced** in 6 of 6 (warning toast 9–26 adds) | 12 runs: banner 1/0, opacity 1, one page position, live-region addition 1, Save backup cut 0 | **Yes** |

## Check 1: R7-D1 acceptance on R8

### 1.0 Control `b39202f` (:5301), run first, this session (18:08–18:10 UTC)

**Reproduced.** Both probes reproduced R7-D1 on the control before any R8 row of the same probe ran
(`series.log`: control rows END 18:09:09 / 18:10:52; first R8 rows START 18:10:52 / 18:12:31).

- `toastroom2.mjs` (lead, unedited), update case, real wheel (`runs/c1-control-toastroom2/`, frames
  `v2-b39202f-*-{a-top,b-end}.png`):
  - 667×375 @200 light: top 146/146 px, Update on top; **end 52 px box, 11 px visible, Update NOT on top, over
    "Next: brew 2 of"**; back at top 146/146.
  - 844×390 @200 dark: top 146/146; **end 52 px box, 26 px visible, Update NOT on top, over "Next: brew 2 of"**; back at
    top 146/146.
- `accept.mjs` (M8, unedited) (`runs/c1-control-accept/`):
  - 667×375 @200 light, wheel: 24 covered control frames (0 > 400 ms after input); 16 not-whole toast measurements over the
    16 samples; 8 actions not on top; 7 samples with top-bar words under a toast; **real taps 1 of 7 activated**.
  - 844×390 @200 dark, touch: 35 covered frames (6 > 400 ms after input); 13 not-whole toast measurements over 16 samples; 2 actions not on
    top; 9 bar-word samples; **real taps 2 of 7 activated**.
  - Where: already at the panel's **top** with 3 toasts ("Cozy level 5!" 0 of 57 px visible, the Undo toast 96 of 146
    px with Undo not on top, under "Next: brew 2 of"), at the middle, and at the end (667: Undo toast 4 of 97 px;
    844: update toast box 128 px for its 146 px content, Undo toast 0 of 128 px).
  - As M8 disclosed, a missed tap reaches the page beneath: in both rows the panel's range fell (667: 353 → 198 → 0;
    844: 338 → 183 → 0), consistent with a Break's over action being activated by a missed tap. The later samples
    are therefore not in the same state; the reproduction above is from the samples before that.

### 1.1 R8 `9ff0d04` (:5306), lead's probe `toastroom2.mjs` (unedited), update case, real wheel, 200 %

`runs/c1-r8-toastroom2/` (jsonl + frames `v2-9ff0d04-*-{a-top,b-end}.png`), 18:10:52–18:12:31 UTC.

| Config | Panel top | Panel end | Back at top | Top-bar words under a toast |
|---|---|---|---|---|
| 667×375 @200 light | update 146/146 px, Update on top (above the controls) | **186/186 px, Update on top (docked over the stage)** | 186/186, Update on top (still docked) | none |
| 667×375 @200 dark | 146/146, on top | **186/186, on top (docked)** | 186/186, on top (docked) | none |
| 844×390 @200 light | 146/146, on top | **146/146, on top (docked)** | 146/146, on top (docked) | none |
| 844×390 @200 dark | 146/146, on top | **146/146, on top (docked)** | 146/146, on top (docked) | none |

The control rows for the same probe are in 1.0 (11 px and 26 px visible at the end, Update not on top). Zeros count.

### 1.2 R8, M8's `accept.mjs` (unedited), 200 %, both inputs, all four landscape configurations

`runs/c1-r8-accept/accept-9ff0d04.jsonl` + `stdout.txt`, 18:12:31–18:18:23 UTC. Per run: positions top → middle → end →
middle → top by the run's real input; update prompt (labelled setup, `duration: Infinity`) + "Cozy level 5!" + the
Undo toast (n = 1, 2, 3); real taps on Undo at every position and on Update at the end (same input) and final top (other
input); per-frame `elementFromPoint` on Mark it done / Put the kettle on / That's all for now / Close.

| Config | Input | Frames | Covered control frames (all / >400 ms) | Samples | Toasts not whole | Folded samples | Actions not on top | Bar words under a toast | Docked per sample | Real taps activated | Error |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 667×375 @200 light | wheel | 1734 | 0 / 0 | 16 | 0 | 5 | 0 | 0 | `-DDDDDDDDDDDDDDD` | 7/7 | |
| 667×375 @200 light | touch | 2123 | 0 / 0 | 16 | 0 | 5 | 0 | 0 | `-DDDDDDDDDDDDDDD` | 7/7 | |
| 844×390 @200 dark | wheel | — | — | 8 | 0 | 2 | 0 | 0 | `--DDDDDD` | 2/2 | **page lost: "Execution context was destroyed"** (see 1.6) |
| 844×390 @200 dark | touch | 2008 | 0 / 0 | 16 | 0 | 5 | 0 | 0 | `--DDDDDDDDDDDDDD` | 7/7 | |
| 667×375 @200 dark | wheel | 1659 | 0 / 0 | 16 | 0 | 5 | 0 | 0 | `-DDDDDDDDDDDDDDD` | 7/7 | |
| 667×375 @200 dark | touch | 2012 | 0 / 0 | 16 | 0 | 5 | 0 | 0 | `-DDDDDDDDDDDDDDD` | 7/7 | |
| 844×390 @200 light | wheel | — | — | 15 | 0 | 4 | 0 | 0 | `--DDDDDDDDDDDDD` | 5/5 | **page lost: "Execution context was destroyed"** (see 1.6) |
| 844×390 @200 light | touch | 2092 | 0 / 0 | 16 | 0 | 5 | 0 | 0 | `--DDDDDDDDDDDDDD` | 7/7 | |

Reruns at 844×390 @200 wheel (19:09:00 light, 19:09:46 dark): 1564 / 1632 frames, 0 / 0 covered, 16 samples, 0 not
whole, 5 folded, 0 actions not on top, 0 bar words, `--DDDDDDDDDDDDDD`, 7/7 taps, no error.

Control rows for this probe (1.0): 24 and 35 covered frames, 13–16 of 16 samples not whole, taps 1/7 and 2/7. Zeros
count for the 6 complete runs and for the samples/taps recorded before the two failures.

### 1.3 Independent L1 probe `l1dock.mjs` (control first, then R8), 200 %

`runs/c1-l1dock-ctl/`, `runs/c1-l1dock-r8/` (jsonl, stdout, frames `*-end-n3.png`, `*-back-top.png`,
`*-final-top.png`), 18:18:25–18:21:20 UTC. What it adds to `accept.mjs`: per frame, **every** visible control on the
page (not four named ones) and **every toast's visible px vs its box and its own height**; real taps on Update while
**folded / 3 toasts up** at the end; scroll **back to the top** with the docked stack. A per-frame "toast not whole"
counts only toasts at opacity ≥ 0.98 (so fading exits are excluded, entry and layout movement are not).

| Rev | Config | Input | Frames | Frames with any control covered (all / >600 ms after an input or toast event) | Frames with a toast not whole (all / >600 ms) | Real taps |
|---|---|---|---|---|---|---|
| **b39202f (control)** | 667×375 @200 light | touch | 1033 | **65 / 4** | **786 / 168** | Update (n3) **FAIL**, Undo (n3) **FAIL**, Update back at top: absent (state changed by a missed tap) |
| 9ff0d04 | 667×375 @200 light | touch | 1125 | 0 / 0 | **27 / 17** | Update (n3, **folded**) ok; Undo (n3, folded) ok; Update back at top ok |
| 9ff0d04 | 844×390 @200 light | touch | 1090 | 0 / 0 | 5 / 0 | Update (n3, folded) ok; Undo (n3) ok; Update back at top ok |
| 9ff0d04 | 844×390 @200 dark | wheel | 711 | 0 / 0 | 11 / **2** | Update at end n3: absent (see note); Undo (n3) ok; Update back at top ok |
| 9ff0d04 | 667×375 @200 dark | wheel | 806 | 0 / 0 | 20 / 0 | Update at end n3: absent (see note); Undo (n3, folded) ok; Update back at top (**folded**) ok |

- **Control reproduced** with this probe (65 covered-control frames, 786 not-whole toast frames, taps failing), so its
  zeros on R8 count: **0 frames with any control covered on R8** in 3,732 frames (4 runs).
- **Not-whole toast frames on R8 are not zero.** All are "Cozy level 5!" (no action) partly clipped at the bottom of
  the docked stack: e.g. 667 light touch, 12 of 57 px visible for ≥ 7 consecutive recorded frames at 518–663 ms after the
  last event (opacity ≥ 0.98); 844 dark wheel, 3 and 41 of 57 px at 636 and 719 ms. In the settled samples (800 ms after
  a raise) one sample shows it too: 667 light touch "end n3 (2)", Cozy rect top 332 / bottom 389 against the list's
  scrollport bottom 363 → 31 of 57 px. The phase in which they occur is pinned with `l1dock2` in 1.5.
- **Note (probe sequencing, not a tap failure):** in the two wheel runs the faster gesture left the first three toasts up
  at the end, so raising two more pushed the update prompt out of the stack. The stack cap (`.slice(-3)` in
  `Toast.tsx` l.43) is unchanged from `7ba0d98`. The folded Update was tapped in the two touch runs and at "back at top"
  in 667 dark wheel; all activated.
- **Scroll back to the top with a docked stack:** in all 4 R8 runs the stack **stays docked** over the stage after real
  input back to the panel's top (`back at top: D`), whole, its actions on top, no control covered; after the stack
  empties, a fresh update prompt at the top is **undocked** (above the controls, 146/146 px). Matches M8's disclosure.

### 1.5 Timeline of R8's not-whole toast frames (`l1dock2.mjs`, = `l1dock` + per-frame time, phase, stack size)

`l1dock2.mjs` sha256 `933731512d087ba52f80ef94d12e2c45a697371ce61315076824f42cbeb96807` (diff vs `l1dock`:
`.tmp/L1/l1dock2-vs-l1dock.diff`, timing/labels only). `runs/c1-l1dock2-r8/`, 18:25–18:27 UTC, 667×375 @200, touch.

| Config | Frames | Control covered | Toast-not-whole frames (all / >600 ms) | Where all of them fall | Taps |
|---|---|---|---|---|---|
| 667×375 @200 light (run 1) | 1107 | 0 | 9 / 0 | phase "D: 3 toasts raised at the end while 2 are up" (stack briefly 4, the cap drops one); "Cozy level 5!" (folded) 25–33 of 57 px, its top moving 338 → 330 px, 160–480 ms after the raise | 3/3 |
| 667×375 @200 light (run 2) | 1233 | 0 | 21 / 0 | same phase; Cozy 28–31 of 57 px, top 335 → 332, 90–451 ms | 3/3 |
| 667×375 @200 dark | 1143 | 0 | 21 / 0 | same phase; Cozy 26–29 of 57 px, top 337 → 334, 95–484 ms | 3/3 |

Reading (no verdict): every not-whole frame on R8 is the action-less "Cozy level 5!" being clipped by the docked list's
scrollport while the stack re-lays out after a toast arrives and another leaves (motion `layout` animation), and it ends
within about 0.5 s; under heavier load (1.3, 18:19 UTC, load ≈ 13) the same clip lasted to at least 663 ms in frames
and was still present in that run's "end n3 (2)" sample taken 800 ms after the raise (31/57 px). No clipped state
persisted to a later sample. No toast with an action was ever not whole on R8 in any frame of 1.3/1.5.

### 1.6 Unexplained page loss at 844×390 @200 with wheel input on R8 (reported, not resolved)

- `accept.mjs` lost its page ("page.evaluate: Execution context was destroyed, most likely because of a navigation") in
  **2 of 2** 844×390 @200 wheel runs on R8 (dark 18:14, after 8 samples; light 18:16, after 15 samples). M8's packet
  reports the same error once at 844×390 @200 dark wheel and attributes it to dev-client reloads; note the R8 server here
  runs with `server.hmr: false, watch: null` (`.tmp/rv7.vite.config.ts`).
- Diagnostic copies (labelled; they only add listeners): `accept-diag.mjs` sha256 `a800319b…` (navigation requests,
  `framenavigated`, console, crash/close) and `accept-diag2.mjs` sha256 `5672ad1a…` (+ load/DOMContentLoaded,
  request failures, HTTP ≥ 400, and a post-failure check of the page's document). Diffs in `.tmp/L1/accept-diag*.diff`.
  - R8, 844×390 @200 dark wheel: `accept-diag` 1 of 2 runs lost its page (18:21, after 11 samples, after a successful
    Update click at the end). **No navigation request, no `framenavigated`, no console message, no crash** was logged
    between the last hash change (#/focus at 8.9 s) and the failure. `accept-diag2`: 0 of 3 lost (18:26–18:28), all
    3 complete with 0 covered frames and 7/7 taps.
  - Control `b39202f`, same config, `accept-diag2`: 0 of 2 lost (40 and 43 covered frames, taps failing as R7-D1).
- Tally this session at 844×390 @200 wheel on R8: **3 of 10 runs lost the page** (accept 2/4 — the two reruns at
  19:09–19:10 UTC, light and dark, completed with 0 covered frames, 0 not whole, 7/7 taps; accept-diag 1/2;
  accept-diag2 0/3; l1dock 0/1). Every other configuration/input on R8 (accept 10+ runs, l1dock 3, l1dock2 3,
  closecheck 3): 0. Cause not established; the failing runs coincided with higher machine
  load (another lane's 2-browser suite). Every failure happened in the middle of the probe's own `page.evaluate`, so the
  event order after it is not captured.

### 1.4 R8, `accept.mjs` at 150 % and 100 % (one input per configuration, both inputs per size)

`runs/c1-r8-accept/`, 18:30:22–18:33:20 and 19:10:32–19:13:12 UTC (all 8 configurations, one input each).

| Config | Input | Frames | Covered (all / >400 ms) | Samples | Not whole | Folded | Actions not on top | Bar words | Docked per sample | Taps | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 667×375 @150 light | wheel | 1694 | 0 / 0 | 16 | 0 | 0 | 0 | 0 | `-DDDDDDDDDDDDDDD` | 7/7 | |
| 844×390 @150 dark | wheel | 3013 | 0 / 0 | 16 | 0 | 0 | 0 | 0 | `-DDDDDDDDDDDDDDD` | 7/7 | "middle: not reached" (80 px range, 60 px wheel step; as M8 noted) |
| 667×375 @100 dark | touch | 1630 | 0 / 0 | 16 | 0 | 0 | 0 | 0 | `-DDDDDDDD--DDDDD` | 7/7 | panel does not scroll at 100 % (top = middle = end) |
| 844×390 @100 light | touch | 1607 | 0 / 0 | 16 | 0 | 0 | 0 | 0 | `-DDDDDDDD--DDDDD` | 7/7 | panel does not scroll at 100 % |

| 667×375 @150 dark | touch | 1710 | 0 / 0 | 16 | **1** | 0 | 0 | 0 | `-DDDDDDDDDDDDDDD` | 7/7 | 19:10:32; the 1: top, n = 2, the sample when the stack first docks: "Cozy level 5!" box 49 px (own 52), 38 px visible, rect bottom 374 vs the docked region's bottom 363 |
| 844×390 @150 light | touch | 1753 | 0 / 0 | 16 | 0 | 0 | 0 | 0 | `-DDDDDDDDDDDDDDD` | 7/7 | 19:11:15 |
| 667×375 @100 light | wheel | 1630 | 0 / 0 | 16 | 0 | 0 | 0 | 0 | `-DDDDDDDD--DDDDD` | 7/7 | 19:11:57; panel does not scroll |
| 844×390 @100 dark | wheel | 1628 | 0 / 0 | 16 | 0 | 0 | 0 | 0 | `-DDDDDDDD--DDDDD` | 7/7 | 19:12:35; panel does not scroll |

- At 150 % and 100 % a 2-toast stack already docks over the stage (`-D…`), at the panel's top too (M8's disclosure).
  At 100 % the two `--` samples are the update prompt re-raised alone after the Update tap had emptied the stack: alone
  it fits above the controls, so it is not docked; it docks again when the next toast arrives.
- **Counting:** the control reproduced this probe's defect at 200 % only (1.0); no control row was run at 150 % / 100 %
  (R7-D1 is defined at 200 %). These rows are no-regression rows for the new dock, not R7-D1 acceptance rows.
- **Not run (time):** the second input at each 150 / 100 % configuration (M8's packet reports all 16).
- The one not-whole sample (667×375 @150 dark) was taken 700 ms after "Cozy level 5!" arrived, at the moment the stack
  moved into the dock; it is the same action-less toast clipped at the docked list's bottom as in 1.3/1.5.

### 1.7 Close / Ambience / Mute sweep (Lane C `closecheck2.mjs`, unedited), 667×375 @200 light, modes measure + tap

Control `49ea1de` (:5305) first, 18:33:23–18:35:19 UTC (`runs/c1-close-ctl/`); then R8 18:35:19–18:37:15
(`runs/c1-close-r8/`). States: focus running, paused break, Break's over (carried); panel top and end by real wheel;
1 and 3 toasts; real touch taps on Ambience and Mute (top and end, 3 toasts). Close taps (`closetap` mode) were **not
run** (time).

| Rev | State | Close covered · centre hit | Ambience covered · hit | Mute covered · hit | Real taps |
|---|---|---|---|---|---|
| 49ea1de (control) | focus | — | **138/588** · 454/588 | 0/588 · 588/588 | Ambience **1/2**, Mute 2/2 |
| 49ea1de (control) | paused | — | **316/665** · 353/665 | 0/665 · 665/665 | Ambience **0/2**, Mute 2/2 |
| 49ea1de (control) | over-carried | 0/670 · 670/670 | — | — | — |
| 9ff0d04 | focus | — | 0/511 · 511/511 | 0/511 · 511/511 | Ambience 2/2, Mute 2/2 |
| 9ff0d04 | paused | — | 0/724 · 724/724 | 0/724 · 724/724 | Ambience 2/2, Mute 2/2 |
| 9ff0d04 | over-carried | 0/703 · 703/703 | — | — | — |

- Panel controls (Add 5 minutes, Pause/Resume, End session; Skip break, Resume break, Start next brew; Mark it done, Put
  the kettle on, That's all for now): 0 covered frames on R8 in every sub-run.
- **Counting:** Ambience's control reproduced (zeros count for Ambience at this configuration). **Mute and Close: control
  not established** in this configuration this session (0 covered on `49ea1de` too), so their R8 zeros here do not count
  as control-backed at this configuration; Close's control was then established at 375×667 (1.7b).
- Also seen on the control: Break's over at the end with 1 / 3 toasts, toasts 19/52 and 0/52 px visible (R7-D1 shape).
  On R8 every toast was whole (min 57 px).
- **New geometry seen here:** on R8 the toasts in the **focus-running and paused-break** states also sit in the stage
  dock at this size (room clip [287, 363] for 1 toast, [77, 363] for 3), not above the panel's controls.

## Check 2: toast and panel geometry, R8 against `b39202f`, same session

### 2.1 Portrait 375×667 and 390×844, 100 % and 200 %, light and dark: **unchanged**

`accept.mjs` geom mode (real wheel to panel top and end; n = 1 update prompt, n = 3), `b39202f` :5301 first
(18:37:16–18:39:47 UTC) then R8 :5306 (18:39:47–18:42:18). Rows `runs/c2-geom/accept-{b39202f,9ff0d04}.jsonl`; comparison by M8's
`geomcmp.py` (sha256 `a89cb0e9…`, unedited) in `runs/c2-geom/compare.md`.

- **32 of 32 samples identical** (fields compared: panel scrollTop/max, docked flag, region rect, list clip, every toast's
  text / box / visible px / rect / action hit). No portrait sample was docked on either revision.
- Unchanged pre-existing limit, identical on both: 375×667 @200 (light and dark), panel at its end, 3 toasts:
  "Cozy level 5!" 0 of 57 px visible and the Undo toast 86 of 146 px (list clip [58, 317]). Portrait has no dock.
- "Unchanged" here is equality with the control, not a control-reproduction count.

### 2.2 Landscape 667×375 and 844×390: the new dock (R8), documented

From `accept.mjs` samples (1.2/1.4), `l1dock` (1.3) and `closecheck2` (1.7). CSS px, `[left, top, right, bottom]`.

| | 667×375 | 844×390 |
|---|---|---|
| Stage box `[data-toast-dock]` (= docked region rect) | [12, 12, 315, 363] (303 × 351) | [12, 12, 492, 378] (480 × 366) |
| Region inset when docked | the stage box, `padding: 0 8px` → toast column x 20–307 | toast column x 32–472 |
| Undocked region (control and R8, panel top, 1 toast) | [0, 8, 667, 257]; update toast [114, 110, 554, 255], 146 px | [0, 8, 844, 372]; update toast [202, 225, 642, 370], 146 px |
| Docked update prompt alone | 186/186 px [20, 175, 307, 361] (narrower column → taller) | 146/146 px [32, 231, 472, 376] |
| 3 toasts @200 | all three **folded** (icon hidden, one-line message + action): update 105 px [20, 79, 307, 184], Undo toast 105 px [20, 192, 307, 297], Cozy 57 px [63, 305, 264, 361] | update **folded** 105 px [32, 53, 472, 158]; Undo toast 146 px unfolded [32, 166, 472, 312]; Cozy 57 px [130, 320, 375, 376] |
| 3 toasts @150 / @100 | docked, 0 folded | docked, 0 folded |
| When it docks (200 %) | at n = 2 already at the panel's top | at n = 3 at the top; n = 1 at the end |
| When it docks (150 % / 100 %) | at n = 2 (even with the panel not scrollable at 100 %) | at n = 2 |
| Scroll back to the top | stays docked while any toast is up; undocks when the stack empties | same |
| Focus running / paused break (`closecheck2`, 667 @200) | toasts also docked over the stage (room [287, 363] for 1, [77, 363] for 3) | not measured |
| Visual order in the docked 3-stack | update prompt top, Undo toast middle, Cozy bottom (DOM order: update, Cozy, Undo) | same |

Frame: `runs/c1-l1dock-r8/9ff0d04-667x375-t200-light-touch-end-n3.png` (three folded toasts over the stage: "A fresh
brew of… · Update", "Marked “Chapter… · Undo", "Cozy level 5!"); `runs/c1-r8-toastroom2/v2-9ff0d04-*-b-end.png`.

### 1.7b Close control at the configuration where `49ea1de` reproduces it, then R8 (`closecheck2.mjs`, over-carried, measure + real Close taps)

Control `49ea1de` 19:04:54–19:06:17 UTC (`runs/c1-close2-ctl/`), then R8 19:06:17–19:08:59 (`runs/c1-close2-r8/`).

| Rev | Config | Close covered · centre hit (frames, 4 sub-runs) | Real Close taps (3 toasts, top / end) | Break's over panel controls covered |
|---|---|---|---|---|
| 49ea1de (control) | 375×667 @200 light | **159/671** · 514/671 (all at end · 3 toasts; hit = "Recipe done" toast) | **1/2** (end: hit the toast, not activated) | 0 |
| 9ff0d04 | 375×667 @200 light | 0/729 · 729/729 | 2/2 (`#/focus → #/`) | 0 |
| 9ff0d04 | 667×375 @200 dark | 0/694 · 694/694 | 2/2 | 0 |

**Close's control is established at 375×667 @200 light** this session, so R8's Close zeros count there; at 667×375 the
Close zeros are probe-level (no Close reproduction at a landscape size this session).

### 1.8 Check 1 per configuration (runs · failures). "Covered" = a Break's over control or Close covered in a frame; "not whole" = a toast's visible px below its box or own height; "taps" = real taps that did not activate.

| Config | Control `b39202f` this session | R8 runs (probe × input) | R8 covered-control frames | R8 settled not-whole samples (accept / toastroom2) | R8 per-frame not-whole frames (l1dock/l1dock2) | R8 taps failed | Page lost | Zeros count? |
|---|---|---|---|---|---|---|---|---|
| 667×375 @200 light | **reproduced**: toastroom2 1/1, accept (wheel) 1/1, l1dock (touch) 1/1 | toastroom2 1, accept wheel+touch 2, l1dock touch 1, l1dock2 touch 2, closecheck 1 | 0 | 0 | 27 (17 > 600 ms), 9, 21 — all transient, action-less Cozy (1.5) | 0 of 23 toast-action taps (+ 8 Ambience/Mute taps, all activated) | 0 | **Yes** (controls established at this config) |
| 667×375 @200 dark | not run at this config (reproduced at 667 light and 844 dark) | toastroom2 1, accept 2, l1dock wheel 1, l1dock2 touch 1 | 0 | 0 | 20 (0 > 600 ms), 21 (0) | 0 of 19 (+1 Update absent: probe sequencing) | 0 | Yes at probe level (same probes reproduced on the control this session) |
| 844×390 @200 light | not run at this config | toastroom2 1, accept wheel ×2 + touch 1, l1dock touch 1 | 0 | 0 | 5 (0) | 0 of 22 | **1 of 2 wheel runs** (accept) | Yes at probe level; the lost wheel run counts only for its 15 samples |
| 844×390 @200 dark | **reproduced**: toastroom2 1/1, accept (touch) 1/1, accept-diag2 (wheel) 2/2 (40, 43 covered frames) | toastroom2 1, accept wheel ×2 + touch 1, accept-diag 2, accept-diag2 3, l1dock wheel 1 | 0 | 0 | 11 (2 > 600 ms) | 0 of 50 (+1 Update absent) | **2 of 7 wheel runs** (accept 1/2, accept-diag 1/2) | **Yes** for completed runs |
| 667×375 @150 light / 844×390 @150 dark | not run (R7-D1 is defined at 200 %) | accept wheel 1 each | 0 | 0 | not run | 0 of 14 | 0 | No control at 150 % (no-regression rows) |
| 667×375 @100 dark / 844×390 @100 light | not run | accept touch 1 each | 0 | 0 | not run | 0 of 14 | 0 | No control at 100 % (no-regression rows) |
| 667×375 @150 dark / 844×390 @150 light (touch); 667×375 @100 light / 844×390 @100 dark (wheel) | not run | accept 1 each | 0 | **1** (667 @150 dark, Cozy 38 of 49 px at docking) | not run | 0 of 28 | 0 | No control (no-regression rows) |

## Check 3: quick reruns (toast code changed)

### 3a. R5-D1 race (`natural-a2.mjs`, Lane A, unedited): 375×667 @200, wheel, storage really full, End after 12 min with a level-up, natural expiry

Control R5 `20671eb` :5302 first per configuration, `STOP_ON_FAIL=1` (stop at the first **strict** R5-D1
reproduction, ≤ 15 runs, waits 600/900/1200/1500/1800 ms × 3); then R8 :5306, 6 runs (waits 0, 600, 1200, 1800, 2400,
3000 ms). `runs/r5d1-{ctl,r8}-{375L,375D}/` (stdout + jsonl with every frame).

| Config | Control R5: runs · probe FAIL · strict R5-D1 | R8: runs · failures (banner gone/faded, moved in page, Save backup cut) · banner adds/removals per run · live-region additions with the warning per run | Zeros count? |
|---|---|---|---|
| 375×667 @200 light | 8 · 1 · **1** (run 8, wait 1200 #1, 18:43:57: drawn below its room, 1 linked frame at 5045 ms) | 6 · **0** · 1/0 in 6 of 6 · 0 or 1 (never > 1) | **Yes** |
| 375×667 @200 dark | 8 · 1 · **1** (run 8, wait 1200 #1, 18:47:09: warning taken away/faded 6 frames, drawn below its room 12 frames, 14 linked frames from 4941 ms) | 6 · **0** · 1/0 in 6 of 6 · 0 or 1 (never > 1) | **Yes** |

On R8 the presenter is the in-page banner (`B`) in all 12 runs; older toasts left while the toast list was scrolled in
3 of 6 (light) and 2 of 6 (dark) runs (the R5-D1 precondition), with 0 bad frames. Save backup cut: 0 frames in all 12.

### 3b. LEAD-D1 (`markdone-a3.mjs`, Lane A, unedited; `KEY` unset = `markdone-a2`): storage really full, a real "Mark done" ("Crossed off · Undo"); case 2 with the never-expiring update toast

Control `e866118` :5304 first (18:48:42–18:51:45 UTC), then R8 :5306 × 2 per configuration (18:51:46–18:57:35).
844×390 @200 case 2 uses the keyboard variant (`KEY=1`: real Tab… Enter), because the update toast covers the whole
strip above the docked start on both designs (Lane A, round 7). `runs/leadd1-*/` (jsonl with every frame, screenshots).

| Config | Case | e866118 control: warning toast adds/removals · frames with its box over the dock · live-region additions | R8: runs · crossed off · banner adds/removals · min opacity · page-top values · Save backup cut frames · live-region additions with the warning · banner after the tap | Zeros count? |
|---|---|---|---|---|
| 375×667 @200 light | 1 (touch tap) | **11/10** · 209 · 11 | 2 · 1, 1 · 1/0, 1/0 · 1 · [621] · 0, 0 · 1, 1 · above the view by 425 / 437 px | **Yes** |
| 375×667 @200 dark | 1 (touch tap) | **11/10** · 229 · 11 | 2 · 1, 1 · 1/0, 1/0 · 1 · [621] · 0, 0 · 1, 1 · above by 422 / 434 px | **Yes** |
| 844×390 @200 light | 1 (touch tap) | **9/8** · 144 · 9 | 2 · 1, 1 · 1/0, 1/0 · 1 · [16] · 0, 0 · 1, 1 · above by 158 / 170 px | **Yes** |
| 375×667 @200 light | 2 (touch tap) | **25/24** · 507 · 25 | 2 · 1, 1 · 1/0, 1/0 · 1 · [621] · 0, 0 · 1, 1 · above by 516 / 520 px | **Yes** |
| 375×667 @200 dark | 2 (touch tap) | **26/25** · 603 · 26 | 2 · 1, 1 · 1/0, 1/0 · 1 · [621] · 0, 0 · 1, 1 · above by 580 / 516 px | **Yes** |
| 844×390 @200 light | 2 (keyboard) | **26/25** · 555 · 26 | 2 · 1, 1 · 1/0, 1/0 · 1 · [16] · 0, 0 · 1, 1 · above by 206 / 206 px | **Yes** |

- On R8: the banner is steady (**1 add, 0 removals** in 12 of 12 runs, opacity 1, a single page position per run), the
  warning text is added to a live region **once** per run (no repeat), and **Save backup is never cut** (0 frames).
- The banner sits above the view after the tap on R8, as on R7 (round 7 Lane A: 376–518 px above at 375×667,
  132–177 px at 844×390). That behaviour is the one ACCEPTED under Vibei's ruling (defect packet, "banner after Mark
  done"); this lane records it only.

## Not run / partial

| Item | Status |
|---|---|
| Check 1, 200 %: 4 configurations × wheel and touch with `accept.mjs`; `toastroom2` ×4; `l1dock` ×4; `l1dock2` ×3 | **covered**, except the two 844×390 @200 wheel `accept.mjs` runs that lost their page part-way (counted only up to the loss; 1.6) |
| Check 1, 150 % / 100 % | **partly covered**: 8 of 8 configurations, one input each (1.4); second input not run; no control at these sizes |
| Check 1, Close / Ambience / Mute sweep | **partly covered**: Ambience/Mute at 667×375 @200 light only (Ambience control reproduced; Mute control not established); Close at 375×667 @200 light (control reproduced) and 667×375 @200 light/dark, with 4 real Close taps on R8 (1.7, 1.7b); 844×390 not swept |
| Check 1, toast wholeness per frame | covered by `l1dock`/`l1dock2` at 200 % only (7 R8 runs) |
| Check 1, webm clips | not recorded (frames only) |
| Check 2, portrait | **covered**: 8 configurations × top/end × n 1/3, both revisions, 32/32 identical |
| Check 2, landscape dock geometry | **covered** from the check-1 rows (2.2); 844×390 focus/paused dock not measured |
| Check 3a, R5-D1 | **covered** for 375×667 @200 light and dark, wheel (control reproduced strictly in both; R8 6 runs each) |
| Check 3b, LEAD-D1 | **covered**: cases 1 and 2 at 375×667 @200 light/dark and 844×390 @200 (case 2 by keyboard), control first, R8 2 runs each |
| Cause of the 844×390 @200 wheel page loss on R8 | **not established** (1.6) |
