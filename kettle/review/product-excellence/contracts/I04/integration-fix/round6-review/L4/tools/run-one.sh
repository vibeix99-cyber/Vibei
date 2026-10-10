#!/bin/bash
# usage: run-one.sh <REV: R6|INT> <w> <h> <dpr> <theme> <rm:0|1> <configname>
REV=$1; W=$2; H=$3; DPR=$4; THEME=$5; RM=$6; CFG=$7
R=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round6-review
S=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/rv6/L4
if [ "$REV" = R6 ]; then WT=/home/user/wt/rv6-r6/kettle; PORT=5301; else WT=/home/user/wt/rv6-int/kettle; PORT=5303; fi
OUT=$R/L4/captures/$REV/$CFG
LOG=$S/logs/capture-$REV-$CFG.log
EXTRA=""; [ "$RM" = 1 ] && EXTRA="--rm"
START=$(date -u +%FT%TZ)
cd $WT
CMD="node review/product-excellence/tools/capture.mjs --base http://127.0.0.1:$PORT --out $OUT --w $W --h $H --dpr $DPR --theme $THEME $EXTRA"
echo "CMD (cwd $WT): $CMD" > $LOG
python3 -I $R/tools/slots.py run --lane L4cap --n 1 -- $CMD >> $LOG 2>&1
RC=$?
END=$(date -u +%FT%TZ)
echo "$REV	$CFG	port=$PORT	rc=$RC	start=$START	end=$END" >> $S/logs/standard-runs.tsv
