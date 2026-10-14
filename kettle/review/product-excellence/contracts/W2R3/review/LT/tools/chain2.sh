#!/bin/bash
# Lane T chain 2: at most 2 browsers at a time, under an n=2 slot.
cd /home/user/wt/w4tr-t2/kettle
L=/home/user/Vibei/kettle/review/product-excellence/contracts/W2R3/review/LT
suite() { KETTLE_PORT=5476 PLAYWRIGHT_JSON_OUTPUT_NAME=$L/runs/suite-$1.json npx playwright test tests/$1.spec.ts --project=chromium --workers=1 --output=/tmp/claude-0/lt3-out-$1 --reporter=list,json > $L/runs/suite-$1.log 2>&1; echo "suite $1 end $(date -u +%T) rc=$?"; }
echo "C+toast-room start $(date -u +%T)"
node .tmp/LT/ltprobe.mjs --base http://127.0.0.1:5476 --base2 http://127.0.0.1:5470 --out $L/probes/cmp2 --par 3 --cfgs "390x844:light:100@B/break+nextbrew+queue,844x390:light:200@B/break+queue+sheetexit,667x375:light:200@B/break+queue,375x667:dark:200@B/break" > $L/runs/probe-cmp2.log 2>&1 &
P1=$!
suite toast-room &
P2=$!
wait $P1; echo "C end $(date -u +%T)"; wait $P2
echo "D start $(date -u +%T)"
KETTLE_PORT=5476 PLAYWRIGHT_JSON_OUTPUT_NAME=$L/runs/notice-strip-5476.json npx playwright test tests/notice-strip.spec.ts --project=chromium --workers=2 --output=/tmp/claude-0/lt3-out-ns --reporter=list,json > $L/runs/notice-strip-5476.log 2>&1
echo "D end $(date -u +%T) rc=$?"
suite w2-home & P3=$!
suite statusbar & P4=$!
wait $P3; wait $P4
echo "chain2 end $(date -u +%T)"
