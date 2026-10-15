#!/bin/bash
# lane 2 (two slots, two workers): the notice suite on :5560
source /home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/POSTMERGE-F1/scripts/LR-common.sh
cd $W
gated notice-suite 2 env KETTLE_PORT=5560 PLAYWRIGHT_JSON_OUTPUT_NAME=$P/notice.json npx playwright test tests/notice-strip.spec.ts tests/w3-notices.spec.ts tests/w3-notices-idle.spec.ts tests/summary-notice.spec.ts tests/toast-room.spec.ts --project=chromium --workers=2 --reporter=list,json --output=$P/notice
echo done > $E/runs/lane2.done
