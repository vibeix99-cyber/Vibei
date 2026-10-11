#!/bin/bash
# AFTER captures on the final code, the remaining BEFORE (INT) captures, late-banner and CLS on the final code.
SL=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
EV=/home/user/wt/r7a/kettle/review/product-excellence/contracts/I04/integration-fix/r7/M7a
cd /home/user/wt/r7a/kettle/.tmp/M7a
run() { python3 -I $SL run --lane M7a --n 1 -- "$@"; }
run node late.mjs http://127.0.0.1:5206 M7a $EV/cls/late.jsonl "375x667@100:light,390x844@100:light,1440x900@100:light,844x390@100:light,375x667@200:light" > $EV/cls/late-M7a.txt 2>&1
for t in 100 200; do for th in light dark; do
  C="390x844@$t:$th,375x667@$t:$th,1440x900@$t:$th,844x390@$t:$th"
  run node capture-r7.mjs http://127.0.0.1:5206 M7a $EV/captures/AFTER-M7a "$C" >> $EV/captures/capture-M7a.txt 2>&1
  [ $t = 200 ] && run node capture-r7.mjs http://127.0.0.1:5303 INT $EV/captures/BEFORE-INT "$C" >> $EV/captures/capture-INT.txt 2>&1
done; done
CF=1 run node late.mjs http://127.0.0.1:5206 M7a-CF $EV/cls/late.jsonl "375x667@100:light,390x844@100:light,1440x900@100:light,844x390@100:light,375x667@200:light" > $EV/cls/late-M7a-CF.txt 2>&1
run node cls.mjs http://127.0.0.1:5206 M7a $EV/cls/cls.jsonl "390x844:light,375x667:light,1440x900:light,844x390:light" > $EV/cls/cls-M7a.txt 2>&1
run node clsload.mjs http://127.0.0.1:5206 M7a $EV/cls/clsload.jsonl "390x844:light,375x667:light,1440x900:light,844x390:light" 5 >> $EV/cls/clsload.txt 2>&1
echo "DRIVEB DONE $(date -u +%FT%TZ)"
