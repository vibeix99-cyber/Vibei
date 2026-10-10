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
