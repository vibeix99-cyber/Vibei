#!/bin/bash
# rerun of the two timer-app tests that failed in the first timer-pwa run (once each, file:line)
source /home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/POSTMERGE-F1/scripts/LR-common.sh
cd $W
gated rerun-timer-app 1 env KETTLE_PORT=5560 PLAYWRIGHT_JSON_OUTPUT_NAME=$P/rerun-timer-app.json npx playwright test --project=timer-app tests/timer.spec.ts:156 tests/timer.spec.ts:183 --workers=1 --reporter=list,json --output=$P/rerun-timer-app
echo done > $E/runs/rerun1.done
