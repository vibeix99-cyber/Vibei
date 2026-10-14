# W2R3 final regression on the merged tree `4d36939`

Run by the orchestrator after the T2 merge. No verdict.

- **Tree:** `4d36939` = integration + `pe/w2r3-notices@64f29cd`. kettle/src `5cd9a44` and kettle/tests `d641e59` are identical to the approved trial `99d9368`.
- **Worktree:** `/home/user/wt/w4-final`.
- **Servers:** dev :5478 (`verify.sh`: `PORT 5478 serves 4d36939 (src 5cd9a44): VERIFIED`), preview :5488 (built from `4d36939`).
- **Gate:** every browser ran through `slots.py run --lane FINAL`.

| Check | Command | Result | Log |
|---|---|---|---|
| Type-check | `npx tsc --noEmit` | exit 0 | `tsc.log` |
| Unit tests | `npx vitest run` | 30 files, **290/290** | `vitest.log` |
| Production build | `vite build` to `/tmp/rv7-servers/dist-w4final` | OK | `/tmp/rv7-servers/build-w4final.log` |
| Full chromium | `KETTLE_PORT=5478 npx playwright test --project=chromium --workers=2` (n 2), 05:00:51–05:40:32 | **179 passed, 2 failed** of 181 | `chromium-full.log` |
| timer-harness, timer-app, pwa | `--workers=1`, `KETTLE_PWA_PORT=5498` (n 1), 05:00:51–05:04:41 | **29 passed, 2 skipped** (by design; the same two as before) | `timer-pwa.log` |

## The two failures, classified by one re-run each (both results reported)

### 1. `integrity.spec.ts:768`: export → reset → import restores every reward exactly

- **Full run:** failed at line 820, `profilePills` "before" = `["Level 12", "194 leaves", "23 days warm"]` vs after = `["Level 12", "2,251 leaves", "23 days warm"]`.
- **Every stored-data check before line 820 passed:** sessions, ledger, leaves (stored value), cozies, badges and settings were all restored exactly. The 2,251 read after the import is the real total.
- **What the "before" read does:** right after `navigate('/settings')`, it matches the regex over the whole of `document.body.innerText`. In the trace, the last frame before that read still shows Today (`integrity768-trace-frame-before-read.jpeg`). So the 194 was probably text from a screen still leaving, most likely Today's animated leaves counter mid-count. Not confirmed.
- **Re-runs, alone, `--repeat-each=3`:**
  - merged :5478: **3/3 passed** (`classify-integrity768-merged.log`);
  - base `61aba17` :5470: **3/3 passed** (`classify-integrity768-base.log`).
- **Classification:** a transient test read under two-worker load; no data defect. **FOLLOW-UP** (test robustness: read the pills inside Settings' own `main` once the route has settled).

### 2. `notice-strip.spec.ts:275`: 1440×900 light 200 % reduced motion

- **Full run:** "Mark done's Undo not drawn after the tap". Recorded state: `sy: 60`, `why: "rest"`, and the tap landed on the tag group (`_tagGroup`), not Mark done.
- **Re-run alone:** **failed again with the same symptom** (`classify-noticestrip1440-merged.log`). So on the merged tree it is 2/2 failed, not a load-only failure.
- **Earlier runs of the same configuration:**
  - the maker's full run failed with this symptom;
  - Lane T's first run failed with a different symptom (History Undo 111 px off the row), and its re-run alone passed.
- **Cause:** End's "Saved…" notice leaves the strip at rest, scrolling content 60 px just before the tap. That is **F-T2-1** (a notice changing the page as a finger lands), which Vibei ruled a follow-up for the next polish round. No overlap is recorded.
- **Consequence:** until F-T2-1 is fixed, this one configuration of `notice-strip.spec.ts` is red on the integration branch. The test is not skipped or changed.
