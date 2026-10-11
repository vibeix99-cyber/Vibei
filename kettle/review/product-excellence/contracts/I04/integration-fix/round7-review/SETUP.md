# Round 7 — setup (orchestrator, 2026-10-11 00:07 UTC)

**Decision:** the user chose option B from `round6-review/DEFECT-PACKET-AND-OPTIONS.md`: the storage-full warning
becomes an in-page banner. All agents run on Opus 5.5.

**Machine and integration state:** `nproc` = 4. Integration HEAD `2d72bf0` (app code `0d58c5e`). Round 7 starts from
`pe/w1-fix-m2@51521cf`, which carries round 6's fixes, including the R5-D1 fix the lead verified.

## Makers (parallel; file ownership does not overlap)

| Maker | Branch | Worktree | Owns | Dev / Playwright ports |
|---|---|---|---|---|
| M7a | `pe/r7-banner` | `/home/user/wt/r7a` | All warning presentation (see below) | 5206 / 5226 / 5236 |
| M7b | `pe/r7-break` | `/home/user/wt/r7b` | `src/screens/focus/**` (break and Break's over reach at 200 %); new `tests/break-reach.spec.ts` | 5207 / 5227 / 5237 |

**What M7a owns:**
- the presentation parts of `src/app/flow.ts`;
- a new banner component;
- Today placement, Settings › Your data, and the summary note;
- the placement block of `integrity.spec.ts` only.

M1's storage detection, persistence and restore logic, and its data-integrity tests, stay unchanged.

M7a is the combined owner. It merges `pe/r7-break` and runs the packet gate on the combined revision.

**Maker budget:** 3 hours of wall-clock time; deadline 03:10 UTC.

## Control servers (orchestrator-owned; verified byte-for-byte with `/tmp/rv7-servers/verify.sh`)

| Control | Revision | Server | Use |
|---|---|---|---|
| R5 | `20671eb` | http://127.0.0.1:5302 | R5-D1 |
| INT | `0d58c5e` | http://127.0.0.1:5303 | Break controls at 200 %; BEFORE |
| e866118 | `e866118` | http://127.0.0.1:5304 | LEAD-D1 |

## Browser limit

At most 3 browser processes run at once. Every browser-launching command goes through `tools/slots.py` (state in
`/tmp/rv7-slots`). Lane priority: A > LEAD = Dcap > M7a = M7b = B > C > D.
