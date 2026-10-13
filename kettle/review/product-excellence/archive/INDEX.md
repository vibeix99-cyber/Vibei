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
