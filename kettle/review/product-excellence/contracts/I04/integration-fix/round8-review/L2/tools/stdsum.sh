#!/bin/bash
# Lane 2: std-set diffs for every complete config (both freeze.json present): R8 vs INT matrix (stdmatrix.cjs, diff
# images in <scratch>/diff-std) and R8 vs Lane D's round-7 R7 std captures (cross-session), node only.
S=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/r8/L2
L=/home/user/wt/r8-trial/kettle/.tmp/L2
D=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/D/captures-std
node $L/stdmatrix.cjs $S/std > $S/std-matrix.md
: > $S/std-r7cross.jsonl
for d in $S/std/R8/*; do c=$(basename $d); [ -f $S/std/INT/$c/freeze.json ] && [ -f $d/freeze.json ] || continue; [ -d $D/R7/$c ] || continue
  node $L/pixdiff-node.cjs $d $D/R7/$c | sed "s/^{/{\"cfg\":\"$c\",/" >> $S/std-r7cross.jsonl; done
cat $S/std-matrix.md
python3 - <<'PY'
import json
S='/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/r8/L2'
rows=[json.loads(l) for l in open(S+'/std-r7cross.jsonl')]
cfgs=sorted({r['cfg'] for r in rows}); st=sorted({r['file'] for r in rows})
print('\nR8 vs Lane D R7 (cross-session)\n| State | '+' | '.join(cfgs)+' |\n|---|'+'---|'*len(cfgs))
for s in st: print('| '+s.replace('.png','')+' | '+' | '.join(str(next((r.get('pct','SIZE '+r.get('size','')) for r in rows if r['cfg']==c and r['file']==s),'-')) for c in cfgs)+' |')
PY
