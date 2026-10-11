# Round 8 review, Lane 1: receipt (IN PROGRESS)

- **Lane:** L1. Runs checks and writes receipts only. **No verdict is issued here.** No app code, test or maker file was
  edited; nothing committed or pushed.
- **Model:** Claude Opus 5.5 (`claude-opus-5-5`), newly launched; implemented nothing in rounds 7 or 8.
- **Wall clock:** start 2026-10-11 18:07:24 UTC; end: (pending).
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
| `run1.sh` (runner, logs series.log) | `d7ffd123816ec15d1a612d303e7516dd4ab5ca4b182ffae036cbeb4c506ac0fa` | L1 (modelled on Lane A's `one.sh`) | — |

Every browser launch went through `slots.py run --lane L1 --n 1`. Each probe invocation launches one Chromium and opens a
fresh context (fresh, disposable profile) per configuration/run.

(Sections below are filled as runs complete.)

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
  - 667×375 @200 light, wheel: 24 covered control frames (0 > 400 ms after input); 16 of 16 samples with a toast not
    whole; 8 actions not on top; 7 samples with top-bar words under a toast; **real taps 1 of 7 activated**.
  - 844×390 @200 dark, touch: 35 covered frames (6 > 400 ms after input); 13 of 16 samples not whole; 2 actions not on
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
  scrollport bottom 363 → 31 of 57 px. The phase in which they occur is being pinned with `l1dock2` (1.5).
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
within about 0.5 s; under heavier load (1.3, 18:19 UTC, load ≈ 13) the same clip lasted to 663 ms. No settled
(steady) clipped state was found. No toast with an action was ever not whole on R8 in any frame of 1.3/1.5.

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
- Tally this session at 844×390 @200 wheel on R8: **3 of 8 runs lost the page** (accept 2/2, accept-diag 1/2,
  accept-diag2 0/3, l1dock 0/1); at every other configuration/input on R8 so far (accept 6 runs, l1dock 3, l1dock2 3): 0. Cause not established; the failing runs coincided with higher machine
  load (another lane's 2-browser suite). Every failure happened in the middle of the probe's own `page.evaluate`, so the
  event order after it is not captured.
