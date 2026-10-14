# Orchestrator follow-up runs on the T2 fix trial (after the second container restart)

These are gap-filling suite runs. They are not a review and carry no verdict.

- **Trial:** `99d9368` (integration `8af5430` + `pe/w2r3-notices@64f29cd`), worktree `/home/user/wt/w4tr-t2f`, kettle/src `5cd9a44`.
- **Server:** dev :5477, restarted after the restart at about 04:40 UTC. `verify.sh` gives `PORT 5477 serves 99d9368 (src 5cd9a44): VERIFIED`.
- **How they ran:** each run went through `slots.py run --lane ORCH --n 1` with `--project=chromium --workers=1` and its own `--output`.

| Spec | Why | Result | Window (UTC) | Log |
|---|---|---|---|---|
| `tests/w2-home.spec.ts` | Lane R's C3 never ran (cut); W2H-D1 control | **18 passed**, 0 failed | 04:43:46–04:47:02 | `fix-w2-home.log` |
| `tests/toast-room.spec.ts` | Lane R's C2 was cut at 6/14 | **14 passed**, 0 failed | 04:43:46–04:48:21 | `fix-toast-room.log` |
