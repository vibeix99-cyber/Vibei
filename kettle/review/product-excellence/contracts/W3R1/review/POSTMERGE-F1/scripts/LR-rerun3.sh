#!/bin/bash
# rerun (once) of the two timer-app tests that failed in the first run (by title: the file:line filter found no tests), then the same on the old base :5478 (control)
source /home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/POSTMERGE-F1/scripts/LR-common.sh
cd $W
G='background: the worker completes on time even with main-thread timers frozen|hidden page: completion shows a warm notification'
gated rerun-timer-app-5560 1 env KETTLE_PORT=5560 PLAYWRIGHT_JSON_OUTPUT_NAME=$P/rerun-timer-app-5560.json npx playwright test tests/timer.spec.ts --project=timer-app -g "$G" --workers=1 --reporter=list,json --output=$P/rerun-timer-app-5560
gated control-timer-app-5478 1 env KETTLE_PORT=5478 PLAYWRIGHT_JSON_OUTPUT_NAME=$P/control-timer-app-5478.json npx playwright test tests/timer.spec.ts --project=timer-app -g "$G" --workers=1 --reporter=list,json --output=$P/control-timer-app-5478
gated control-notice-strip-5478 1 env KETTLE_PORT=5478 PLAYWRIGHT_JSON_OUTPUT_NAME=$P/control-notice-5478.json npx playwright test tests/notice-strip.spec.ts --project=chromium -g '844×390 dark 200 %\)$' --workers=1 --reporter=list,json --output=$P/control-notice-5478
echo done > $E/runs/rerun3.done
