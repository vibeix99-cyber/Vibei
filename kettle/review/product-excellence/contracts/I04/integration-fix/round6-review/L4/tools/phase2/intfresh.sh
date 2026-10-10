#!/bin/bash
# usage: intfresh.sh <w> <h> <dpr> <theme> <rm:0|1> <config>   (INT, fresh, same tool, lane L4, one browser)
W=$1; H=$2; DPR=$3; THEME=$4; RM=$5; CFG=$6
R=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round6-review
P=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/rv6/L4/p2
OUT=$R/L4/captures/INT-fresh/$CFG; EXTRA=""; [ "$RM" = 1 ] && EXTRA="--rm"
cd /home/user/wt/rv6-int/kettle
echo "START $(date -u +%FT%TZ)" > $P/intfresh-$CFG.log
python3 -I $R/tools/slots.py run --lane L4 --n 1 -- node review/product-excellence/tools/capture.mjs --base http://127.0.0.1:5303 --out $OUT --w $W --h $H --dpr $DPR --theme $THEME $EXTRA >> $P/intfresh-$CFG.log 2>&1
echo "END $(date -u +%FT%TZ) rc=$?" >> $P/intfresh-$CFG.log
