#!/bin/bash
# Lane T chain: one browser at a time, under one slot.
cd /home/user/wt/w4tr-t2/kettle
L=/home/user/Vibei/kettle/review/product-excellence/contracts/W2R3/review/LT
echo "A1 start $(date -u +%T)"
node .tmp/LT/ltprobe.mjs --base http://127.0.0.1:5476 --base2 http://127.0.0.1:5470 --out $L/probes/fix --par 3 --cfgs "844x390:dark:200,390x844:light:200,1440x900:light:200,375x667:light:200,667x375:dark:200,390x844:dark:200,1440x900:dark:200,844x390:light:100,375x667:light:100,667x375:light:100,390x844:light:100,1440x900:light:100,844x390:dark:100,375x667:dark:100,667x375:dark:100,390x844:dark:100,1440x900:dark:100,390x844:light:100:reduced,375x667:dark:200:reduced" 2>&1
echo "A1 end $(date -u +%T)"
node .tmp/LT/ltprobe.mjs --base http://127.0.0.1:5476 --base2 http://127.0.0.1:5470 --out $L/probes/cmp --par 3 --cfgs \
"390x844:light:100@B/home+end,390x844:light:200@B/home+end,375x667:light:100@B/home+end,375x667:light:200@B/home+end,844x390:light:100@B/home+end,844x390:light:200@B/home+end,667x375:light:100@B/home+end,667x375:light:200@B/home+end,390x844:light:100@B/break+nextbrew+queue+storage,844x390:light:200@B/break+nextbrew+queue+storage,667x375:light:200@B/break+queue,375x667:dark:200@B/break+nextbrew+storage,1440x900:light:100@B/storage,390x844:light:100/tap+storage,375x667:light:100/tap,844x390:light:100/tap,1440x900:light:100/tap+storage,844x390:light:200/storage,375x667:dark:200/storage,844x390:light:200/sheetexit,375x667:dark:200/sheetexit,375x667:dark:200/stats,844x390:light:200@B/sheetexit" 2>&1
echo "A end $(date -u +%T)"
for P in 5470 5476; do
  echo "B $P start $(date -u +%T)"
  BREAK_REACH_ALL_DAYS=1 KETTLE_PORT=$P PLAYWRIGHT_JSON_OUTPUT_NAME=$L/runs/break-reach-$P.json npx playwright test tests/break-reach.spec.ts --project=chromium --workers=1 --output=/tmp/claude-0/lt3-out-b$P -g "Break's over with a carried task" --grep-invert "844×390" --reporter=list,json > $L/runs/break-reach-$P.log 2>&1
  echo "B $P end $(date -u +%T) rc=$?"
done
echo "C start $(date -u +%T)"
node .tmp/LT/ltprobe.mjs --base http://127.0.0.1:5476 --base2 http://127.0.0.1:5470 --out $L/probes/cmp2 --par 3 --cfgs "390x844:light:100@B/break+nextbrew+queue,844x390:light:200@B/break+queue+sheetexit,667x375:light:200@B/break+queue,375x667:dark:200@B/break" > $L/runs/probe-cmp2.log 2>&1
echo "C end $(date -u +%T)"
KETTLE_PORT=5476 PLAYWRIGHT_JSON_OUTPUT_NAME=$L/runs/suite-toast-room.json npx playwright test tests/toast-room.spec.ts --project=chromium --workers=1 --output=/tmp/claude-0/lt3-out-toast-room --reporter=list,json > $L/runs/suite-toast-room.log 2>&1
echo "toast-room end $(date -u +%T) rc=$?"
KETTLE_PORT=5476 PLAYWRIGHT_JSON_OUTPUT_NAME=$L/runs/notice-strip-5476-w1.json npx playwright test tests/notice-strip.spec.ts --project=chromium --workers=1 --output=/tmp/claude-0/lt3-out-ns --reporter=list,json > $L/runs/notice-strip-5476-w1.log 2>&1
echo "notice-strip end $(date -u +%T) rc=$?"
