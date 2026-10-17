# Archive index — maker-branch bundles (the git proxy accepts pushes to the integration branch only)

Restore a chain in order with `git fetch <bundle> 'refs/heads/*:refs/heads/*'` (reassemble split parts first: `cat <name>.part-* > <name>`, then `sha256sum -c <name>.sha256`). Prerequisites must already be present.

| Bundle | Head(s) | Prerequisite commits (must exist before fetching) | Verified |
|---|---|---|---|
| `maker-branches-2026-10-09.bundle` | pe/w1-fix@1351c99 pe/w1-fix-m2@c9520db  | 1bec1a8 455b6c6  | okay 2026-10-10 |
| `pe-w1-fix-3f00b57.incremental.bundle` | pe/w1-fix@3f00b57  | 1351c99  | okay 2026-10-10 |
| `pe-w1-fix-m2-r2wip.incremental.bundle` | pe/w1-fix-m2@e1e672d  | c9520db  | okay 2026-10-10 |
| `pe-w1-fix-m2-r2-e932f65.incremental.bundle` | pe/w1-fix-m2@e932f65  | e1e672d  | okay 2026-10-10 |
| `pe-w1-fix-m2-r4-adec1a2.incremental.bundle` | pe/w1-fix-m2@adec1a2  | e4be56e  | okay 2026-10-10 |
| `pe-w1-fix-m2-r5-33a72e6.incremental.bundle` | pe/w1-fix-m2@33a72e6  | adec1a2  | okay 2026-10-10 |
| `pe-w1-fix-m2-r6wip.incremental.bundle` | pe/w1-fix-m2@db8220e  | 3f00b57 33a72e6  | okay 2026-10-10 |
| `pe-w1-fix-m2-r6-51521cf.incremental.bundle` | pe/w1-fix-m2@51521cf  | db8220e  | okay 2026-10-10 |
| `pe-w1-fix-m2-r3-e4be56e.incremental.bundle.part-00..02` (+ `.sha256`) | pe/w1-fix-m2@e4be56e | e932f65 | parts reassembled and checksum-verified 2026-10-10 01:30 UTC |
| `rv6-trial-e866118.incremental.bundle` | pe/rv6-trial@e866118 (round-6 review trial merge, REJECTED) | bc48a10 51521cf | okay 2026-10-10 |
| `pe-r7-break-38fc9c6.incremental.bundle` | pe/r7-break@38fc9c6 (round 7, M7b READY FOR REVIEW) | 51521cf | okay 2026-10-11 |
| `pe-r7-banner-7ba0d98.incremental.bundle.part-00..02` (+ `.sha256`) | pe/r7-banner@7ba0d98 (round 7 combined, READY FOR REVIEW) | 51521cf 38fc9c6 | parts reassembled and checksum-verified 2026-10-11 |
| `rv7-trial-b39202f.incremental.bundle` | pe/rv7-trial@b39202f (round-7 review trial merge, REJECTED: R7-D1) | 2e9095c 7ba0d98 | okay 2026-10-11 |
| `pe-r8-toastroom-2c3172c.incremental.bundle` | pe/r8-toastroom@2c3172c (round 8, M8 READY FOR REVIEW: R7-D1) | 7ba0d98 | okay 2026-10-11 |
| `rv8-trial-9ff0d04.incremental.bundle` | pe/rv8-trial@9ff0d04 (round-8 trial merge, APPROVED; merged as 90a11e5) | 61a60b2 2c3172c | okay 2026-10-11 |
| `worktree-probes-2026-10-11.tar.gz` | review probe scripts from the round-6–8 worktrees (.tmp, git-ignored) before cleanup | — | tar ok 2026-10-11 |
| (not bundled) | pe/r5-control@20671eb (round-5 trial, R5-D1 control; obsolete — R5-D1 verified fixed in rounds 6–8) kept as a LOCAL branch only; a full bundle would be 281 MB | — | 2026-10-11 |
| `pe-w2-room-fc9f6d8.incremental.bundle.part-00..02` (+ `.sha256`) | pe/w2-room@fc9f6d8 (Wave 2 R1, Maker N READY FOR REVIEW; code 5d7bb23) | 90a11e5 | parts reassembled and verified 2026-10-11 |
| `pe-w2-home-acf1c6a.incremental.bundle` | pe/w2-home@acf1c6a (Wave 2 R1, Maker H WIP; code 7a961b7) | 90a11e5 | okay 2026-10-11 |
| `pe-w2-summary-e0f511a.incremental.bundle` | pe/w2-summary@e0f511a (Wave 2 R1, Maker S WIP: code final, evidence gaps; code f95e0be) | 90a11e5 | okay 2026-10-11 |
| `pe-w2-home-fixwip-4baf228.incremental.bundle` | pe/w2-home@4baf228 (Wave 2 R1, Maker H fix round for W2H-D1: WIP, interrupted by the usage limit, unvalidated) | acf1c6a | okay 2026-10-12 |
| `w2r1-review-probes-2026-10-12.tar.gz` | W2R1 lead and Lane N/S/R probe scripts (worktree `.tmp`, git-ignored) at the usage-limit pause | — | tar ok 2026-10-12 |
| `pe-w2-room-fix-92241c2.incremental.bundle` | pe/w2-room@92241c2 (Wave 2 R1, Maker N fix round READY FOR REVIEW: N-F1 items float; code c381ccb) | fc9f6d8 | okay 2026-10-12 |
| `w2r1-final-probes-2026-10-12.tar.gz` | W2R1 economy-resume probes (worktree .tmp: LS finish, FV, LEAD2, suites) before worktree cleanup | — | tar ok 2026-10-12 |
| `pe-w2r2-summary-dc7a28d.incremental.bundle.part-00..01` (+ `.sha256`) | pe/w2r2-summary@dc7a28d (W2R2 Maker P READY FOR REVIEW; code a4f1773) | b377c62 | okay 2026-10-12 |
| `pe-w2r2-chai3d-2843fb0.incremental.bundle.part-NN` (+ `.sha256`) | pe/w2r2-chai3d@2843fb0 (W2R2 Maker C READY FOR REVIEW; code c698d74; includes assets/chai3d-r1@68caa31) | 15e8abe | okay 2026-10-13 |
| `pe-w2r2-toast-4620796.incremental.bundle` | pe/w2r2-toast@4620796 (W2R2 Maker T, WIP at its deadline; code 8d0d8a6) | b377c62 | okay 2026-10-13 |
| `pe-w2r2-toast-fix-6f9756c.incremental.bundle` | pe/w2r2-toast@6f9756c (W2R2 Maker T fix round, WIP; code 887696e) | 4620796 | okay 2026-10-13 |
| `pe-w2r2-chai3d-low-6fb2136.incremental.bundle.part-00..01` (+ `.sha256`) | pe/w2r2-chai3d@6fb2136 (C with MODEL_ON_LOW=true per Vibei; code effe8c0) | 2843fb0 | okay 2026-10-13 |
| `pe-w2r3-badge-2994005.incremental.bundle` | pe/w2r3-badge@2994005 (W2R3 Maker B READY: Warm Days; code 0a95fbc) | 61aba17 | okay 2026-10-13 |
| `pe-w2r3-notices-6a64fbf.incremental.bundle.part-NN` (+ `.sha256`) | pe/w2r3-notices@6a64fbf (W2R3 Maker T2 READY; code 61b463c) | 61aba17 | okay 2026-10-13 |
| `pe-w2r3-notices-fix-64f29cd.incremental.bundle.part-00..01` (+ `.sha256`) | pe/w2r3-notices@64f29cd (W2R3 Maker T2 fix round READY, T2-D1; code 40f92b6; includes the orchestrator's WIP save 3462b93) | 6a64fbf | okay 2026-10-14 |
| `w2r3-trial-t2f-99d9368.incremental.bundle` | trial 99d9368 = integration 8af5430 + pe/w2r3-notices@64f29cd (merge commit only) | 8af5430, 64f29cd | okay 2026-10-14 |
| `pe-w3-chai-night-4168428.incremental.bundle` | pe/w3-chai-night@4168428 (W3R1 Maker N READY; code 121f011+43b10f2+76144b4) | 6b88eb0 | okay 2026-10-14 |
| `pe-w3-settings-808421d.incremental.bundle` | pe/w3-settings@808421d (W3R1 Maker G READY; code 876bf18) | 6b88eb0 | okay 2026-10-14 |
| `pe-w3-stats-344069c.incremental.bundle` | pe/w3-stats@344069c (W3R1 Maker S READY; code 8158134) | 6b88eb0 | okay 2026-10-14 |
| `pe-w3-notices-polish-5ee3e7c.incremental.bundle` | pe/w3-notices-polish@5ee3e7c (W3R1 Maker F READY; code 9f30a9b) | 6b88eb0 | okay 2026-10-14 |
| `w3r1-trials-e478604.incremental.bundle` | combined trial e478604 = integration + F + S + G + N (merge commits only) | integration, maker tips | okay 2026-10-14 |
| `w3r1-trial-e3b9eac.incremental.bundle` | trial e3b9eac = integration fc7f1a9 + 5ee3e7c (merge commit only) | fc7f1a9, 5ee3e7c | okay 2026-10-14 |
| `w3r1-trial-c7a6b8f.incremental.bundle` | trial c7a6b8f = integration 1d961af + 344069c (merge commit only) | 1d961af, 344069c | okay 2026-10-14 |
| `w3r1-trial-3d91793.incremental.bundle` | trial 3d91793 = integration 0c32046 + 808421d (merge commit only) | 0c32046, 808421d | okay 2026-10-14 |
| `w3r1-trial-46f33e2.incremental.bundle` | trial 46f33e2 = integration 1af69d7 + 4168428 (merge commit only) | 1af69d7, 4168428 | okay 2026-10-14 |
| `pe-w3-settings-fix-7f95c18.incremental.bundle` | pe/w3-settings@7f95c18 (W3R1 Maker G fix round; code 0320211) | 808421d | okay 2026-10-14 |
| `w3r1-trial-c8b849e.incremental.bundle` | trial c8b849e = integration a8edec2 + 7f95c18 (merge only) | a8edec2, 7f95c18 | okay 2026-10-14 |
| `pe-w3-stats-fix-697c1eb.incremental.bundle` | pe/w3-stats@697c1eb (W3R1 Maker S fix round; code 0d240b6+1d899b3) | 344069c | okay 2026-10-14 |
| `w3r1-trial-f63286e.incremental.bundle` | trial f63286e = integration 283ae93 (N+G) + 697c1eb (merge only) | 283ae93, 697c1eb | okay 2026-10-14 |
| `pe-w3r1-x2-segment-test-7bb8540.incremental.bundle` | pe/w3r1-x2-segment-test@7bb8540 (X-2 test-only; code 9fb1aca) | 4223062 | okay 2026-10-14 |
| `pe-w3-notices-polish-fix-11a7ac6.incremental.bundle` | pe/w3-notices-polish@11a7ac6 (W3R1 Maker F fix round; code 58d1b88) | 5ee3e7c | okay 2026-10-14 |
| `w3r1-trial-1358e00.incremental.bundle` | trial 1358e00 = integration 8af9fcb (N+G+S+X-2) + 11a7ac6 (merge only) | 8af9fcb, 11a7ac6 | okay 2026-10-14 |
| `pe-w3r1-x11-strip-test-f0c84a5.incremental.bundle` | pe/w3r1-x11-strip-test@f0c84a5 (X-11 attempts a4be67b/99f3741/dd519c5, withdrawn; tests = 2be3de1) | 2be3de1 | okay 2026-10-14 |
| `pe-w3r1-stability-01575cb.incremental.bundle` | pe/w3r1-stability@01575cb (Maker Q: Phase A 61aec4b band idle 4 s; Phase B tests e00b5fa/316d9ab/dcf5595; F1 root-cause note) | a2b00cd | okay 2026-10-15 |
| `pe-w3r1-f1-intention-74138d3.incremental.bundle` | pe/w3r1-f1-intention@74138d3 (F1 fix: setIntention writes only the intention; code 9a41a1a+882233b) | 793321b | okay 2026-10-15 |
| `pe-w3r1-f1-intention-fix-10ecf2c.incremental.bundle` | pe/w3r1-f1-intention@10ecf2c (F1 fix round F1X-D1: syncIdleLength writes only the length; src b74e6b3) | 74138d3 | okay 2026-10-15 |
| `pe-w3r1-n2-history-2280e7d.incremental.bundle` | pe/w3r1-n2-history@2280e7d (N-2: no product change; new guard spec tests/w3-history-focus-scroll.spec.ts) | 5f78af1 | okay 2026-10-15 |
| `pe-w3r2-toast-hook-203b057.incremental.bundle` | pe/w3r2-toast-hook@203b057 (W3R2 item 2: NoticeStrip hooks unconditional; src 07df367) | 494748b | okay 2026-10-17 |
