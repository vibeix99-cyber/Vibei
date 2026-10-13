#!/bin/bash
cd /home/user/wt/w4tr-c/kettle
R=/home/user/Vibei/kettle/review/product-excellence/contracts/W2R2/review/LRC
echo "START $(date -u +%FT%TZ) load=$(cut -d' ' -f1-3 /proc/loadavg)"
node .tmp/LR/check2.mjs --base http://127.0.0.1:5461 --variants D --out $R/perf/check2d-v2-swap-in-window.json
echo "check2D done $(date -u +%FT%TZ)"
node .tmp/LR/unlockready.mjs --vp 1440x900@1 --look light --control http://127.0.0.1:5430 --trial http://127.0.0.1:5461 --reps 2 --out $R/captures-unlock-ready
echo "1440 done $(date -u +%FT%TZ)"
node .tmp/LR/unlockready.mjs --vp 390x844@2 --look light --control http://127.0.0.1:5430 --trial http://127.0.0.1:5461 --reps 2 --out $R/captures-unlock-ready
echo "END $(date -u +%FT%TZ)"
