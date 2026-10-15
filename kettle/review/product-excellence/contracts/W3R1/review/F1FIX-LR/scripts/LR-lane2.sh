#!/bin/bash
# lane 2: the notice suite on :5562
S=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
E=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/F1FIX-LR
cd /home/user/wt/w6tr-x/kettle
P=$PWD/.tmp/LR-pw
python3 -I $S run --lane LR --n 1 -- env KETTLE_PORT=5562 PLAYWRIGHT_JSON_OUTPUT_NAME=$P/notice.json npx playwright test tests/notice-strip.spec.ts tests/w3-notices.spec.ts tests/w3-notices-idle.spec.ts tests/summary-notice.spec.ts tests/toast-room.spec.ts --project=chromium --workers=1 --reporter=list,json --output=$P/notice > $E/runs/notice-suite.log.txt 2>&1
echo done > $E/runs/lane2.done
