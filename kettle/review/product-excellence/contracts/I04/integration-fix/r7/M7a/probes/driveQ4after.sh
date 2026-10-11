#!/bin/bash
SL=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
EV=/home/user/wt/r7a/kettle/review/product-excellence/contracts/I04/integration-fix/r7/M7a
cd /home/user/wt/r7a/kettle/.tmp/M7a
run() { python3 -I $SL run --lane M7a --n 1 -- "$@"; }
for t in 100 200; do for th in light dark; do
  run node capture-r7.mjs http://127.0.0.1:5206 FINAL $EV/captures/AFTER-final "390x844@$t:$th,375x667@$t:$th,1440x900@$t:$th,844x390@$t:$th" >> $EV/captures/capture-AFTER.txt 2>&1
done; done
run node capture-r7.mjs http://127.0.0.1:5303 INT $EV/captures/BEFORE-INT "390x844@100:light,375x667@100:light,1440x900@100:light,844x390@100:light,390x844@100:dark,375x667@100:dark" >> $EV/captures/capture-INT.txt 2>&1
echo "AFTER CAPTURES DONE $(date -u +%FT%TZ)"
