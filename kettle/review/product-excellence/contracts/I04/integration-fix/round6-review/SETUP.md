# Round-6 combined review — setup (orchestrator, 2026-10-10 18:21 UTC)

**Under review:** `pe/w1-fix-m2@51521cf` (combined I03 × I04 fix, maker M2; code `091249a`; `kettle/src` `05bb3f8`).

**Machine:** `nproc` = 4. Browser limit: 3 concurrent browser processes. Every Chromium launch and every extra
Playwright worker counts. The gate is `tools/slots.py`.

## Revisions and servers (built and verified once by the orchestrator; do not stop or restart them)

| Name | Revision | `kettle/src` | Worktree | Dev server (KETTLE_PORT, debug API) | KETTLE_PWA_PORT (reserved for `pwa.spec`) | Production preview |
|---|---|---|---|---|---|---|
| **R6** | trial merge `e866118` = integration `bc48a10` + `51521cf` (no conflicts) | `05bb3f8` (required; matches) | `/home/user/wt/rv6-r6/kettle` | http://127.0.0.1:5301 | 5311 | http://127.0.0.1:5321 (`/tmp/rv6-servers/dist-r6`) |
| **R5** | `20671eb`: the round-5 Checker's trial, where R5-D1 reproduced (`CHECKER-integration-fix-r5.md`) | `b38ad5e` | `/home/user/wt/rv6-r5/kettle` | http://127.0.0.1:5302 | 5312 | http://127.0.0.1:5322 (`/tmp/rv6-servers/dist-r5`) |
| **INT** | `0d58c5e` (app code of the integration branch `bc48a10`) | `1fc4a1b` | `/home/user/wt/rv6-int/kettle` | http://127.0.0.1:5303 | 5313 | http://127.0.0.1:5323 (`/tmp/rv6-servers/dist-int`) |

**Server configuration:** each dev server runs `vite --config .tmp/rv6.vite.config.ts` from its worktree. That is the
repo config without HMR or file watching, with a private dependency cache and the symlinked `node_modules` allowed.

**Verification:** `/tmp/rv6-servers/verify.sh <worktree> <port>` checks that five distinguishing source files served
by each dev server (`Toast.module.css`, `Toast.tsx`, `StatusBar.tsx`, `flow.ts`, `FocusScreen.tsx`) are
byte-identical to the worktree's committed blobs. All three ports were **VERIFIED**. Each production preview's
`index.html` equals its `dist-*` build.

**Logs:** `/tmp/rv6-servers/`.

## Bundle and archive

- `archive/pe-w1-fix-m2-r6-51521cf.incremental.bundle`: `git bundle verify` reports okay; it requires `db8220e`,
  which is present.
- Prerequisites for every bundle are recorded in `archive/INDEX.md`.

## Probes (unedited sources; sha256 in `/tmp/rv6-servers/probe-sha256.txt`)

- **Round-5 Checker's probes** (`race.mjs`, `natural.mjs`, `lib.mjs`): copied by M2 unedited to
  `/home/user/wt/w1fix-m2/kettle/.tmp/w1fix/chk-r5/`.
- **M2's probes:** `repro6.mjs` (the 20-run harness), `race6.mjs` and `readscroll6.mjs`, in
  `/home/user/wt/w1fix-m2/kettle/.tmp/w1fix/`.

## Rules for every run

- Record the URL, port and revision.
- Use a fresh browser context and a disposable profile.
- Wrap every browser-launching command:
  `python3 -I <round6-review>/tools/slots.py run --lane <L1|L2|L3|L4cap|L4|LEAD> --n <browsers> -- <cmd>`.
- Playwright runs from a shared worktree must pass their own `--output <dir>`.
