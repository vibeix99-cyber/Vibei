#!/bin/bash
# lane 1: timer/pwa, integrity (all), the new race spec on :5562 and :5560. One gate job each, sequential.
S=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
E=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/F1FIX-LR
cd /home/user/wt/w6tr-x/kettle
g() { python3 -I $S run --lane LR --n 1 -- "$@"; }
P=$PWD/.tmp/LR-pw
g env KETTLE_PORT=5562 KETTLE_PWA_PORT=5499 PLAYWRIGHT_JSON_OUTPUT_NAME=$P/timer-pwa.json npx playwright test --project=timer-harness --project=timer-app --project=pwa --workers=1 --reporter=list,json --output=$P/timer-pwa > $E/runs/timer-pwa.log.txt 2>&1
g env KETTLE_PORT=5562 PLAYWRIGHT_JSON_OUTPUT_NAME=$P/integrity.json npx playwright test tests/integrity.spec.ts --project=chromium --workers=1 --reporter=list,json --output=$P/integrity > $E/runs/integrity-5562.log.txt 2>&1
g env KETTLE_PORT=5562 PLAYWRIGHT_JSON_OUTPUT_NAME=$P/race-5562.json npx playwright test tests/w3-intention-race.spec.ts --project=chromium --workers=1 --reporter=list,json --output=$P/race-5562 > $E/runs/race-5562.log.txt 2>&1
g env KETTLE_PORT=5560 PLAYWRIGHT_JSON_OUTPUT_NAME=$P/race-5560.json npx playwright test tests/w3-intention-race.spec.ts --project=chromium --workers=1 --reporter=list,json --output=$P/race-5560 > $E/runs/race-5560.log.txt 2>&1
echo done > $E/runs/lane1.done
