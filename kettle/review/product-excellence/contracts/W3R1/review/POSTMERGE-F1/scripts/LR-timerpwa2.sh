#!/bin/bash
# extra (not asked): the whole timer-harness, timer-app and pwa set once more, so the count is one run
source /home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/POSTMERGE-F1/scripts/LR-common.sh
cd $W
gated timer-pwa-run2 1 env KETTLE_PORT=5560 KETTLE_PWA_PORT=5499 PLAYWRIGHT_JSON_OUTPUT_NAME=$P/timer-pwa-run2.json npx playwright test --project=timer-harness --project=timer-app --project=pwa --workers=1 --reporter=list,json --output=$P/timer-pwa-run2
echo done > $E/runs/timerpwa2.done
