#!/bin/bash
# lane beta: notice-strip whole file, then X-7
S=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
E=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/FINAL
cd /home/user/wt/w5-final/kettle
g() { python3 -I $S run --lane LR --n 1 -- "$@"; }
g env KETTLE_PORT=5540 PLAYWRIGHT_JSON_OUTPUT_NAME=$PWD/.tmp/LR-pw/notice-strip.json npx playwright test tests/notice-strip.spec.ts --project=chromium --workers=1 --reporter=list,json --output=$PWD/.tmp/LR-pw/notice-strip > $E/runs/notice-strip.log.txt 2>&1
g node .tmp/LR-x7.mjs $E/x7 > $E/x7/x7-run.log.txt 2>&1
echo done > $E/runs/chainB.done
