#!/bin/bash
# BD-rr.sh <rounds> <prefix> [only] [W H DPR theme]: round-robin 390 dark capture of state 13 on base and the 8 candidate builds, one browser at a time through the gate
BD=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/BACKDROP/scripts
SL=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
R=$1; PFX=$2; ONLY=${3:-13}; W=${4:-390}; H=${5:-844}; DPR=${6:-2}; TH=${7:-dark}
declare -A PORT=( [base]=5488 [3faaf94]=5580 [25b5e26]=5581 [a859d86]=5582 [0efca36]=5583 [60fdb7e]=5584 [2be3de1]=5585 [8b1ed4d]=5586 [f2298d3]=5587 )
LIST=${BUILDS:-"base 3faaf94 25b5e26 a859d86 0efca36 60fdb7e 2be3de1 8b1ed4d f2298d3"}
for r in $(seq 1 $R); do
  for h in $LIST; do
    if [ $h = base ]; then wt=/home/user/wt/w4-final; else wt=/home/user/wt/w6-bd-$h; fi
    python3 -I $SL run --lane BD --n 1 -- $BD/BD-cap.sh $PFX$r-$h http://127.0.0.1:${PORT[$h]} $wt $W $H $DPR $TH $ONLY 2>&1 | grep -v '^\[slots\]'
  done
done
echo RR-DONE
