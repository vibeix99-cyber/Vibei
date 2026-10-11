## Short version

{{SHORT}}

## The six items the relaunch brief asked me to settle

### 1. The integrity "timeout" — not a timeout; a test read race, pre-existing test code

- **Isolated run (first action, 09:42:15–09:48:25 UTC, `slots --n 3`, workers 1, R7 :5301):** 23 passed / 25.
  Log and load: `round7-review/LEAD/integrity-isolated/` (`run.log`, `loadavg-{before,during,after}.txt`). Slots were
  exclusive; 1-min load went 0.15 → 6.4 from non-browser work by other agents (a `git worktree add` of another
  worktree, lane agents' analysis), 2.76 after.
- **export → reset (explicit confirmation) → import** (`integrity.spec.ts:768`) failed in **19.2 s against its 150 s
  timeout**: an assertion, not a timeout. Line 820 `profilePills` returned "184 leaves" instead of "2,261 leaves".
  Every data assertion before it passed (sessions, ledger, leaves, cozies, badges, settings equal to the export).
  The page snapshot at the failure holds both route layers: the exiting Today (its status bar's screen-reader line
  "Cozy level 12, 184 leaves to the next") and the entering Settings ("2,261 leaves"). The trace shows the read
  331 ms after `navigate('/settings')`; `profilePills` reads `document.body.innerText`, and its regex
  `[\d,]+ leaves(?! to level)` matches Today's line first while that layer is still in the DOM.
  → **Read race in test code that is byte-identical to M1's approved `3f00b57` (lines 1–949, sha `669ff659…`), over app
  code (route cross-fade, status bar) that round 7 did not change.** Not load-only: it failed with exclusive slots.
  Same test elsewhere: failed in the gate's maker run; passed in Lane D's two full runs (04:30, 09:48), the gate's 10/10
  rerun, my R7 run (23.7 s) and my INT run (20.4 s) under load; {{EXPIMP2}}.
  **Class: FOLLOW-UP (test), owner M1** — read the pills after the exit completes (e.g. wait for one `main` layer, or
  read inside the Settings profile region).
- **Second failure in the same run: round 7's own `integrity.spec.ts:1090` at desktop 1440×900** ("a banner that
  appears while Today is open moves nothing under the finger"): "Crossed off. Nice work." never appeared; the snapshot
  shows Mark done still offered, no banner, no toast. The same test failed in Lane D's 04:30 full run (same click
  point 554.5, 453.4) and in 1 of my 6 repeats (`md1440.log`); passed in the gate run, D's rerun, D's 09:48 run and 5 of
  my 6 repeats. **Diagnosed** (`LEAD/runs/L2-md1440diag/`, the spec's own steps replayed with a hit-test just before
  the same coordinate click): in 5/6 R7 runs End's toasts had settled above the docked start (y 560–672) and the
  click hit Mark done; in the run where the click came 778 ms after End, the "Recipe done" toast was still at
  y 410–462, over Mark done, and took the click (tap = dismiss). **On INT the same toast sits over Mark done for its
  whole life** (4/4 runs, y 410–462; 3 of 4 clicks hit it). So the product behaviour is pre-existing and better on R7;
  the test clicks by coordinates ~0.8 s after End without waiting for End's toasts. {{LIFTLAG}}
  **Class: FOLLOW-UP (test), owner M7a** (wait for End's toasts to expire, as the probes do, or for the stack to
  settle); product side = round 6's item 10 (toast lift at 1440 right after End), owner M2.

### 2. The banner and "Mark done" at 200 % — the binding ruling, applied from raw evidence

{{ITEM2}}

### 3. Close, Ambience and Mute — clear at every size and scroll position

{{ITEM3}}

### 4. The summary note and the Tea time / Skip footer

{{ITEM4}}

### 5. M7b's probes not rerun by the maker on the final revision

{{ITEM5}}

### 6. The two "saved" wordings

{{ITEM6}}
