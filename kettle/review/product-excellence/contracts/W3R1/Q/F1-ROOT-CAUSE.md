# F1 (`integrity` I01, "two tabs, the leading one frozen across the end"): root cause, a product race. No timer change made (stopped for Vibei)

**Classification: product.**
- A tab that has not yet taken in another tab's write saves its own, stale copy of the whole timer over it.
- Here that tab is a freshly opened Today, through its composer's intention sync. Any timer-store write from a tab that is a moment behind does the same.
- The brew the other tab has just started is undone in both tabs, and no record is made.
- The test only exposes this: it starts a brew in one tab ~0.8 s after the second tab boots, which a person can also do. It is not the cause.
- **Pre-existing:** `src/timer/**` and `Composer.tsx` are unchanged since base `4d36939`.

## Mechanism (file, line)

1. **`src/screens/home/Composer.tsx:83–86`.** On Today's mount, and after every keystroke, an effect runs `setTimeout(() => setIntention(text, tag), 150)`, "keep the timer's intention in sync".
2. **`src/timer/store.ts:399`** `setIntention` → zustand `set({ intention, tag })`. The `persist` middleware (`store.ts:421–441`, `partialize` at 425) then writes **the whole timer state from this tab's memory** to `localStorage['kettle:timer']`, including `status`, `sessionId` and `endsAt`. That happens even when only the intention changed.
3. **Cross-tab state** reaches a tab only through the `storage` event (`src/timer/sync.ts:174` → `mirrorTimerFromStorage` → `persist.rehydrate()` at `sync.ts:81`). The event arrives some time after the other tab's write: 0.3–0.6 s in the failing runs under load.
4. **Race:** tab A starts a brew and writes `running`. Inside that lag, tab Z's composer timeout fires. Z's memory still says `idle`, so Z writes its idle timer over A's running one; storage now holds Z's idle copy.
   - Z then gets A's storage event, but rehydrates from storage, which now holds Z's own idle value. **Z never sees the brew.** This is the stress-run signature: "leader never saw the session", `leader: true`, idle.
   - A gets Z's storage event and mirrors the idle state. `diffTimer` returns `'reset'` (`sync.ts:31`), and flow navigates A to Today (`src/app/flow.ts:245`). **A's brew is gone.** This is the full-run signature: the other tab `idle` at `#/`, `leader: false`, few wakes.
5. **No completion and no record:** neither tab holds the session any more.

## Evidence (instrumented copy of the test; every `kettle:timer` write logged with its JS stack, every storage event, state polled every 50 ms in both tabs)

Probe: `Q/B/probe/f1-probe.spec.ts.txt` (scratch copy of I01's test plus a recorder; not in the suite). Load is as in `review/FINAL/scripts/LR-stress.sh`: `--workers=2` plus CPU burners.

| Run | Tree | Result | Log |
|---|---|---|---|
| ×10, 4 burners | :5545 (`61aec4b`) | 10/10 pass | `Q/B/probe/f1-x10.log.txt` |
| ×20, 6 burners | :5545 | **3 fail / 20** | `Q/B/probe/f1-x20-nb6.log.txt` (`QDUMP` / `QOK` lines hold both tabs' logs) |
| ×12, 6 burners, with write stacks | :5545 | **2 fail / 12** | `Q/B/probe/f1-stack-x12-nb6.log.txt` |
| ×20, 6 burners | base :5478 (`4d36939`) | **1 fail / 20**: the same mechanism. Tab z started the brew; tab a's `Composer.tsx` → `setIntention` wrote idle 102 ms after it; the leader never saw the session | `Q/B/probe/f1-base-x20-nb6.log.txt` |

**What every failure shows:**
- the tab that did not start the brew writes `kettle:timer` with `status: idle` **after** the starting tab's `running` write:
  - x20: 460, 104 and 556 ms after it;
  - x12: 528 and 4 ms after it;
- in each case this happens before that tab has mirrored the start.

The stack of that write, the same in every case:

```
setItem (src/lib/storage.ts) < zustand persist setItem < setIntention (src/timer/store.ts) < (anonymous) src/screens/home/Composer.tsx (the 150 ms effect)
```

**In every passing run, either:**
- that tab's composer write came before the start (it wrote `idle` before A's `running`); or
- its Today had already left for `/focus` when the 150 ms timer would have fired (no write); or
- it wrote `running`, having mirrored first.

In the x12 run (which records stacks), every `idle` write by the non-starting tab (8 writes) comes from `Composer.tsx` → `setIntention`, and every write that tab made at all comes from there (13 writes).

**Failure 1 of the x20 run, as a timeline** (ms relative to the test's start of the brew; tab A started the brew, tab Z was the elected leader):

```
A -1246 write running s_mv8te9ip0e8addaf          (startFocus)
Z  -786 write idle   (sessionId null)              (Composer → setIntention; Z has not mirrored A yet)
Z  -728 storage event kettle:timer = running       (arrives after Z's own write: storage keeps Z's idle)
A   +14 storage event kettle:timer = idle          → A mirrors 'reset' → '#/'
A  +574 state idle, '#/'                           (the brew is gone; Z: idle, leader, never saw the sid)
```

## Minimal repro (natural; no test change)
- Two Kettle tabs of one profile, both on Today. Start a brew in tab A within a few hundred ms of tab Z's Today mounting or of a keystroke in Z's composer, so that Z's 150 ms intention sync lands after A's write and before Z receives A's storage event.
- Under load this window is 0.1–0.6 s wide, and the I01 test's 0.8 s after boot falls into it in about 1 run in 6.
- Without load the window is a few ms wide. With `Q_WAIT=0` (start as soon as both tabs boot), 5/5 passed on :5545 and 5/5 on base (`Q/B/probe/f1-race-w0-*.log.txt`).
- So the reliable reproduction is the load run above, not a deterministic script.
- A same-profile Playwright two-page attempt that holds Z's storage events (`f1-repro.spec.ts.txt`) did not reproduce. Z's store had taken in the running brew anyway (not explained in the time box), so it is **not** offered as a repro.

## What a fix would touch (not done: `src/timer/**` is out of bounds; for Vibei / the timer owner)

**Options:**
- `setIntention` (or the Composer's sync) could write only when this tab's copy is current. For example: re-read storage before a set that only edits the intention, or skip the write while idle when storage holds another session.
- The timer's persist could refuse to replace a stored running session with an idle state that carries no `lastEnded` for it (a version or sequence check).

**Owners:** `src/timer/store.ts` / `sync.ts` (timer area), and `src/screens/home/Composer.tsx` (Today).

**The test (`tests/integrity.spec.ts` I01) is left as it is.** Making it wait until both tabs' Today composers have synced would hide this race, not fix it.
