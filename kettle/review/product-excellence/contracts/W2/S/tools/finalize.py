"""Fill the packet placeholders from the evidence (W2 Maker S). python3 -I finalize.py <rev> <src> <status>"""
import os, subprocess, sys
rev, src, status = sys.argv[1:4]
W = '/home/user/wt/w2s/kettle/review/product-excellence/contracts/W2'
E = f'{W}/S'
S = '/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/w2/S'
p = f'{W}/S-READY-FOR-REVIEW.md'
s = open(p).read()
acc = open(f'{E}/acceptance-AFTER.md').read()
fd = open(f'{E}/facts-vs-orchestrator-BEFORE.md').read()
fdv = open(f'{E}/facts-verbatim-375x667.md').read() if os.path.isfile(f'{E}/facts-verbatim-375x667.md') else ''
suites = open(f'{S}/suites.md').read()
notes = open(f'{S}/notes.md').read()
before = open(f'{S}/before-note.md').read()
s = s.replace('ACCEPT_TABLE', acc).replace('FACT_TABLE', fdv + '\n' + fd).replace('SUITES', suites).replace('NOTES', notes).replace('BEFORE_NOTE', before)
s = s.replace('see the header of this file (`REV` / `SRC` filled at hand-off)', f'`{rev}`; `git rev-parse {rev}:kettle/src` = `{src}`')
s = s.replace('`git diff --stat 90a11e5..REV -- kettle/src kettle/tests`', f'`git diff --stat 90a11e5..{rev} -- kettle/src kettle/tests`')
head_old = s[:s.index('## 1. Ranking design and rules')]
head_new = f"""# W2 · Maker S (Summary) — {status}

**Status:** {status}. No verdict is claimed here.
**Item:** I07 (rank the rewards) + Wave-1 follow-up #1 (third pill row half under the footer at 375×667).
**Base:** `90a11e5` (kettle/src `42e106d`). **Branch:** `pe/w2-summary` (not pushed). **Worktree:** `/home/user/wt/w2s/kettle`.
**Revision:** `{rev}` — **kettle/src tree:** `{src}`.
**Maker model:** Opus 5.5 (`claude-opus-5-5`).

"""
s = s.replace(head_old, head_new)
open(p, 'w').write(s)
print('ok', len(s))
