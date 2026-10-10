#!/bin/bash
# usage: rerun-robust.sh <REV> <set dir name> <w> <h> <dpr> <theme> <text> <only>
REV=$1; SET=$2; W=$3; H=$4; DPR=$5; THEME=$6; TXT=$7; ONLY=$8
R=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round6-review
S=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/rv6/L4
if [ "$REV" = R6 ]; then WT=/home/user/wt/rv6-r6/kettle; PORT=5301; else WT=/home/user/wt/rv6-int/kettle; PORT=5303; fi
OUT=$R/L4/captures/$REV/warning/$SET
LOG=$S/logs/warning-rerun-robust-$REV-$SET.log
cd $WT
CMD="node /home/user/wt/rv6-r6/kettle/.tmp/L4/warning-captures.mjs --base http://127.0.0.1:$PORT --rev $REV --wt $WT --out $OUT --w $W --h $H --dpr $DPR --theme $THEME --text $TXT --only $ONLY --merge --robust 1 --attempts 8 $EXTRA --scratch $S"
echo "START $(date -u +%FT%TZ) CMD (cwd $WT): python3 -I slots.py run --lane L4cap --n 1 -- $CMD" > $LOG
python3 -I $R/tools/slots.py run --lane L4cap --n 1 -- $CMD >> $LOG 2>&1
echo "END $(date -u +%FT%TZ) rc=$?" >> $LOG
