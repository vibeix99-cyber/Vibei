#!/bin/bash
# chain2.sh : room2 (hint / nook / unlock) for ctrl then trial; then p375 3 runs each
S=/tmp/claude-0/ln-scratch; cd /home/user/wt/w2t-n/kettle
SLOTS=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
for cfg in 390x844@3:light:100 375x667@2:light:200 844x390@3:light:200 1440x900@2:dark:100; do
  for lab in ctrl trial; do
    base=http://127.0.0.1:5330; [ $lab = trial ] && base=http://127.0.0.1:5350
    python3 -I $SLOTS run --lane LN --n 1 -- node .tmp/LN/room2.mjs --base $base --label $lab --out $S/r2 --cfgs $cfg >> $S/chain2.log 2>&1
  done
done
for lab in ctrl trial; do
  base=http://127.0.0.1:5330; [ $lab = trial ] && base=http://127.0.0.1:5350
  python3 -I $SLOTS run --lane LN --n 1 -- node .tmp/LN/p375.mjs --base $base --label $lab --out $S/p375 --runs 3 >> $S/chain2.log 2>&1
done
echo CHAIN2-DONE >> $S/chain2.log
