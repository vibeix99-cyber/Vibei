#!/bin/bash
# usage: run-warning.sh <REV: R6|INT> <w> <h> <dpr> <theme> <text:100|200>
REV=$1; W=$2; H=$3; DPR=$4; THEME=$5; TXT=$6
R=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round6-review
S=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/rv6/L4
if [ "$REV" = R6 ]; then WT=/home/user/wt/rv6-r6/kettle; PORT=5301; else WT=/home/user/wt/rv6-int/kettle; PORT=5303; fi
SET=${W}x${H}-${THEME}-${TXT}pct
OUT=$R/L4/captures/$REV/warning/$SET
LOG=$S/logs/warning-$REV-$SET.log
START=$(date -u +%FT%TZ)
cd $WT
CMD="node /home/user/wt/rv6-r6/kettle/.tmp/L4/warning-captures.mjs --base http://127.0.0.1:$PORT --rev $REV --wt $WT --out $OUT --w $W --h $H --dpr $DPR --theme $THEME --text $TXT"
echo "CMD (cwd $WT): python3 -I slots.py run --lane L4cap --n 1 -- $CMD" > $LOG
python3 -I $R/tools/slots.py run --lane L4cap --n 1 -- $CMD >> $LOG 2>&1
RC=$?
echo "$REV	$SET	port=$PORT	rc=$RC	start=$START	end=$(date -u +%FT%TZ)" >> $S/logs/warning-runs.tsv
