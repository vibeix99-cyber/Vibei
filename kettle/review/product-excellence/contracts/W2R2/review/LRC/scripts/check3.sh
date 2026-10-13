#!/bin/bash
cd /home/user/wt/w4tr-c/kettle
R=/home/user/Vibei/kettle/review/product-excellence/contracts/W2R2/review/LRC
echo "START $(date -u +%FT%TZ) load=$(cut -d' ' -f1-3 /proc/loadavg)"
node .tmp/LR/capture3.mjs --vp 390x844@2 --looks light,dark,night --control http://127.0.0.1:5430 --trial http://127.0.0.1:5461 --out $R/captures > $R/runs/check3-390.log 2>&1 &
P1=$!
node .tmp/LR/capture3.mjs --vp 1440x900@1 --looks light,dark,night --control http://127.0.0.1:5430 --trial http://127.0.0.1:5461 --out $R/captures > $R/runs/check3-1440.log 2>&1 &
P2=$!
wait $P1; echo "390 exit $?"; wait $P2; echo "1440 exit $?"
echo "END $(date -u +%FT%TZ)"
