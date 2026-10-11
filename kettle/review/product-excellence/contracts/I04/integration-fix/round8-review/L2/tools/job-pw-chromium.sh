#!/bin/bash
# Lane 2 (round-8 review): full chromium project on R8 9ff0d04 dev :5306, through the slot gate (--n 2).
cd /home/user/wt/r8-trial/kettle
echo "rev $(git rev-parse --short HEAD)"; date -u +"queued %T"
PLAYWRIGHT_JSON_OUTPUT_NAME=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/r8/L2/pw-chromium.json KETTLE_PORT=5306 KETTLE_PWA_PORT=5316 python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane L2 --n 2 -- bash -c 'date -u +"start %T"; s=$(date +%s); npx playwright test --project=chromium --workers=2 --output /tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/r8/L2/pw-out-chromium --reporter=list,json; rc=$?; date -u +"end %T"; echo "wall $(($(date +%s)-s))s"; exit $rc'
echo "exit $?"; date -u +"done %T"
