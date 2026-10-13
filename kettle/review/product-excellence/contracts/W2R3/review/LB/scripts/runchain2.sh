#!/bin/bash
cd /home/user/wt/w4tr-b/kettle/.tmp/LB
OUT=/home/user/Vibei/kettle/review/product-excellence/contracts/W2R3/review/LB
S=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
until grep -q "end trial 1440x900" $OUT/runlive.log; do sleep 3; done
run() { echo "[$(date -u +%H:%M:%S)] start $*"; timeout "$T" python3 -I $S run --lane LB --n 1 -- "$@"; echo "[$(date -u +%H:%M:%S)] end exit=$? : $1 $2 $3 $4"; }
T=600
run node migrate.mjs --trial http://127.0.0.1:5485 --w 390 --h 844 --dump $OUT/dump-base-390x844.json --out $OUT --tag 390x844
run node migrate.mjs --trial http://127.0.0.1:5485 --w 1440 --h 900 --dump $OUT/dump-base-1440x900.json --out $OUT --tag 1440x900
run node roundtrip.mjs --exporter http://127.0.0.1:5485 --importer http://127.0.0.1:5485 --w 390 --h 844 --dump $OUT/dump-base-390x844.json --out $OUT --tag trial-to-trial-390x844
run node roundtrip.mjs --exporter http://127.0.0.1:5480 --importer http://127.0.0.1:5485 --w 390 --h 844 --dump $OUT/dump-base-390x844.json --out $OUT --tag base-to-trial-390x844
run node kit.mjs --out $OUT
T=2400
cd /home/user/wt/w4tr-b/kettle
echo "[$(date -u +%H:%M:%S)] spec start" 
KETTLE_PORT=5475 timeout 2400 python3 -I $S run --lane LB --n 1 -- npx playwright test tests/w2-summary.spec.ts --project=chromium --workers=1 --reporter=list > $OUT/spec-w2-summary.txt 2>&1
echo "[$(date -u +%H:%M:%S)] spec end exit=$?"
