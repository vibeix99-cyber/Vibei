#!/bin/bash
# usage: samecheck.sh <round> <only> ; runs R6 and INT concurrently (equal load), one browser each, lane L4
ROUND=$1; ONLY=$2
R=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round6-review
L=$R/L4
P=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/rv6/L4/p2
for REV in R6 INT; do
  if [ $REV = R6 ]; then WT=/home/user/wt/rv6-r6/kettle; PORT=5301; else WT=/home/user/wt/rv6-int/kettle; PORT=5303; fi
  OUT=$L/captures/samecheck/round$ROUND/$REV/phone-390x844-light
  ( cd $WT; echo "START $(date -u +%FT%TZ) rev=$REV port=$PORT" > $P/samecheck-$ROUND-$REV.log
    python3 -I $R/tools/slots.py run --lane L4 --n 1 -- node review/product-excellence/tools/capture.mjs --base http://127.0.0.1:$PORT --out $OUT --w 390 --h 844 --dpr 2 --theme light --only $ONLY >> $P/samecheck-$ROUND-$REV.log 2>&1
    echo "END $(date -u +%FT%TZ)" >> $P/samecheck-$ROUND-$REV.log ) &
done
wait
