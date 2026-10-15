#!/bin/bash
# rerun (once) of the notice-strip case that failed in the notice suite, then the same case on the old base :5478 (control)
source /home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/POSTMERGE-F1/scripts/LR-common.sh
cd $W
gated rerun-notice-strip-5560 1 env KETTLE_PORT=5560 PLAYWRIGHT_JSON_OUTPUT_NAME=$P/rerun-notice-5560.json npx playwright test tests/notice-strip.spec.ts --project=chromium -g '844×390 dark 200 %\)$' --workers=1 --reporter=list,json --output=$P/rerun-notice-5560
echo done > $E/runs/rerun2.done
