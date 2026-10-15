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
| `notice-strip.spec.ts`, all 25 | *(running)* | `Q/A/notice-strip-all.log.txt` |
| `toast-room` + `summary-notice` + `w2-home` | *(pending)* | `Q/A/owned-3.log.txt` |

The band's facts from the 42 (24 band-lifetime cases, from the JSON annotations):
- the collapse came **4037–4125 ms after the later of the leave and the last input**;
- 4092–7508 ms after the leave;
- ms since any input at the collapse: ≥ 4037;
- each case had exactly one collapse, with the pointer up.

Pointer held 3 s: given back 4074 / 4113 ms after release, `why: idle`.

*Chain:* `Q/scripts/QA-chain.sh` (gate `--lane Q --n 2`), timings in `Q/A/chain.log.txt`.
