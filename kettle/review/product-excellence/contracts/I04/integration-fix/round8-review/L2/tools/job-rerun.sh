#!/bin/bash
# Lane 2: rerun the single failing chromium test once, alone (--workers=1), gate --n 1.
cd /home/user/wt/r8-trial/kettle
echo "rev $(git rev-parse --short HEAD)"; date -u +"queued %T"
KETTLE_PORT=5306 KETTLE_PWA_PORT=5316 python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane L2 --n 1 -- bash -c 'date -u +"start %T"; s=$(date +%s); npx playwright test "tests/statusbar.spec.ts:106" -g "past the screen \\(dark\\)" --project=chromium --workers=1 --output /tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/r8/L2/pw-out-rerun --reporter=list; rc=$?; date -u +"end %T"; echo "wall $(($(date +%s)-s))s"; exit $rc'
echo "exit $?"; date -u +"done %T"
