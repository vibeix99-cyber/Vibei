# RECEIPT-R2: Lane R2, regression of the W3R2 stale-tab guard (item 1), raw evidence

Raw evidence only. No verdict. Times are UTC, 2026-10-17. Task received 17:58, box 90 minutes, hard stop 19:45. Written in stages; `*.log` is git-ignored, so logs are saved as `.log.txt`. No source or committed-test edits, no pushes; the only git write is `commit-evidence.sh`. No process of mine was killed with a pattern (two explicit PIDs of my own, listed in section 0).

## 0. What was tested, and how

| | |
|---|---|
| Trial | `/home/user/wt/w8tr-g`, HEAD `88d6b64` (src tree `dd6944e`), `git status` clean. The guard is `pe/w3r2-sync-guard@54a9721` merged on integration app `5f78af1` |
| Servers | dev **:5591** (trial, debug API) and preview :5593 (not used); controls: **:5560** = integration `494748b` (no guard, `/home/user/wt/w6-int`), :5570 not used, :5478 old base `4d36939` (not used unless something failed) |
| Served code | `verify.sh /home/user/wt/w8tr-g 5591`: "PORT 5591 serves 88d6b64 (src dd6944e): VERIFIED". Blob hashes of `src/timer/store.ts`, `sync.ts`, `ticker.ts` as served equal the committed blobs: :5591 `9ea4e0e4bac63470` / `51481caac6ac4361` / `ddbf46b63efc5cdf` (trial); :5560 `ecb09baca37315a7` / `cfc45d0b7bb4ccbe` / `ddbf46b63efc5cdf` (integration, no guard) |
| Machine | 4 CPUs; gate maximum 3. **Load average 9 to 15 throughout** (lead and makers TS and TH share the box; at 17:59 it was 12.7), so every browser run below ran loaded; the load at the start and end of each run is in its log header and trailer |
| Gate | every Playwright and every 2-tab script run went through `slots.py run --lane R2` (`--n 1`, one worker; the notice suites `--n 2`, two workers). Reused the gate helper, JSON summary script and spec lists from `W3R1/review/POSTMERGE-F1` (pointed at :5591) |
| Scripts | `scripts/R2-common.sh` (gate helper with the uptime header and trailer), `R2-unit.sh`, `R2-chainX.sh`, `R2-chainY.sh`, `R2-notice.sh`, `R2-2tab.mjs` (the 2-tab script), `R2-jsum.mjs`; superseded: `R2-chain1.sh` (replaced by `R2-chainX.sh` after its first job; I killed its explicit PID 14439 and the waiting gate PID 16685, which had not started any browser), `R2-smoke.sh` |
| Logs and JSON | `runs/*.log.txt`, `json/*.json` (Playwright JSON), `manual/` (2-tab JSON per iteration, summaries, screenshots) |

