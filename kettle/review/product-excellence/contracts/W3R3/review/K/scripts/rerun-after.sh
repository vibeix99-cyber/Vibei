#!/bin/bash
# rerun-after.sh <dev-port> [label=r2]
# Re-runs lane K's AFTER set on the fix trial served by the dev server at http://localhost:<port> (BEFORE and REFERENCE are NOT re-run):
#   13-state matrix x 9 configs (390x844/375x667/1440x900 light+dark, 200 % text, reduced motion), edge close-ups (kit + stage, dark; light once),
#   pose-switch flow (12 runs), noise recaptures of the animated states, then the post-processing against the existing BEFORE data.
# Output goes to <K>/rerun-<label>/ (shots/after, edges, strips, json, reference, outside-diffs); AFTER-r1 is untouched.
# Every browser run goes through the slot gate (--lane K --n 1); two streams run in parallel (2 slots). ~40 min.
set -u
PORT=${1:?usage: rerun-after.sh <dev-port> [label]}; LABEL=${2:-r2}
K=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R3/review/K
SC0=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/w3r3
SL=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
V=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/k-venv/bin/python
BASE=http://localhost:$PORT
export K_ROOT=$K/rerun-$LABEL K_SC=$SC0-$LABEL K_AB_DIR=$SC0-$LABEL/ab K_SETTLE=3
R=$K_ROOT; SC=$K_SC
mkdir -p $R/shots/after $R/json/ps $R/assets-served $R/logs $SC/ab $SC/frames
curl -sf -o /dev/null $BASE/ || { echo "no server on $BASE"; exit 1; }
# the BEFORE side, reused read-only
[ -e $R/shots/before ] || ln -s $K/shots/before $R/shots/before
cp -n $K/json/master-ink.json $R/json/; cp -n $K/assets-served/before-chai-*.webp $R/assets-served/
cp -n $K/json/ps/before-*.json.gz $R/json/ps/
cp -n $SC0/ab/edge-before-* $SC0/ab/before-* $SC/ab/ 2>/dev/null
for d in $SC0/frames/before-*; do [ -e $SC/frames/$(basename $d) ] || ln -s $d $SC/frames/$(basename $d); done
for d in before2 before3; do [ -e $SC/$d ] || ln -s $SC0/$d $SC/$d; done
for p in reading sipping cheering; do curl -sf -o $R/assets-served/after-chai-$p.webp $BASE/src/art/chai/chai-$p.webp || echo "could not fetch the $p asset from the dev server"; done
ls -l $R/assets-served/after-chai-*.webp
g() { python3 -I $SL run --lane K --n 1 -- "$@"; }
FLOW=focus-running,home-live,focus-paused,focus-break,home-break
CFGS=("390x844 light normal" "390x844 dark normal" "375x667 light normal" "375x667 dark normal" "1440x900 light normal" "1440x900 dark normal" "390x844 light t200" "390x844 dark t200" "390x844 light rm")
streamA() {   # states matrix, then noise recaptures (after2 = full subset, after3 = flow states) 
  for cv in "${CFGS[@]}"; do g node $K/scripts/states.mjs $BASE $R/shots/after $cv; done
  for cv in "390x844 light normal" "390x844 dark normal" "1440x900 light normal" "375x667 dark normal"; do g node $K/scripts/states.mjs $BASE $SC/after2 $cv; done
  for cv in "1440x900 dark normal" "1440x900 light normal" "390x844 light normal" "390x844 dark normal" "375x667 light normal" "390x844 light rm"; do g node $K/scripts/states.mjs $BASE $SC/after3 $cv $FLOW; done
  echo DONE A
}
streamB() {   # edges, then pose-switch (AFTER only)
  for a in "stage 1440x900 dark" "stage 390x844 dark" "kit 1440x900 dark" "stage 1440x900 light" "kit 1440x900 light"; do g node $K/scripts/edges.mjs $BASE after $a; done
  for cfg in 390x844 1440x900; do for th in light dark; do
    fd=$SC/frames/after-$cfg-$th; mkdir -p $fd
    g node $K/scripts/poseswitch.mjs $BASE after $cfg $th 1 full $R/json/ps/after-$cfg-$th-d1-full.json.tmp $fd && $V -c "import gzip,shutil;shutil.copyfileobj(open('$R/json/ps/after-$cfg-$th-d1-full.json.tmp','rb'),gzip.open('$R/json/ps/after-$cfg-$th-d1-full.json.gz','wb'))"
    g node $K/scripts/poseswitch.mjs $BASE after $cfg $th 1 reduce $R/json/ps/after-$cfg-$th-d1-reduce.json.tmp && $V -c "import gzip,shutil;shutil.copyfileobj(open('$R/json/ps/after-$cfg-$th-d1-reduce.json.tmp','rb'),gzip.open('$R/json/ps/after-$cfg-$th-d1-reduce.json.gz','wb'))"
    g node $K/scripts/poseswitch.mjs $BASE after $cfg $th 2 full $R/json/ps/after-$cfg-$th-d2-full.json.tmp && $V -c "import gzip,shutil;shutil.copyfileobj(open('$R/json/ps/after-$cfg-$th-d2-full.json.tmp','rb'),gzip.open('$R/json/ps/after-$cfg-$th-d2-full.json.gz','wb'))"
    rm -f $R/json/ps/*.tmp
  done; done
  echo DONE B
}
streamA > $R/logs/streamA.log 2>&1 &  PA=$!
streamB > $R/logs/streamB.log 2>&1 &  PB=$!
wait $PA $PB
cd $K/scripts
$V pixdiff2.py > $R/logs/pixdiff2.txt 2>&1
$V edge_post.py > $R/logs/edge_post.txt 2>&1
$V ps_post.py > $R/logs/ps_post.txt 2>&1
$V prop_post.py > $R/logs/prop_post.txt 2>&1
$V ref_post.py > $R/logs/ref_post.txt 2>&1
echo "DONE rerun $LABEL: $R   (tables: json/pixdiff2.json, json/edge-halo-table.md, json/poseswitch-tables.md, json/proportions-table.md; sheets: reference/, edges/, strips/)"
