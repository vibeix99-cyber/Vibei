#!/bin/bash
# Lane D relaunch: full chromium project on b39202f, through the slot gate (--n 2).
cd /home/user/wt/rv7-r7/kettle
echo "rev $(git rev-parse --short HEAD)"; date -u +"queued %T"
PLAYWRIGHT_JSON_OUTPUT_NAME=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/r7/D/run2/pw-chromium.json KETTLE_PORT=5301 KETTLE_PWA_PORT=5311 python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane D --n 2 -- bash -c 'date -u +"start %T"; npx playwright test --project=chromium --workers=2 --output /tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/r7/D/run2/pw-out-chromium --reporter=list,json; rc=$?; date -u +"end %T"; exit $rc'
echo "exit $?"; date -u +"done %T"
