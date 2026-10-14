#!/bin/bash
# lane alpha: failure reruns, then timer/harness/pwa, then the W3_LOAD run, then X-1
S=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
E=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/FINAL
cd /home/user/wt/w5-final/kettle
g() { python3 -I $S run --lane LR --n 1 -- "$@"; }
g bash .tmp/LR-fb1.sh > $E/rerun/fb1.log.txt 2>&1
g env KETTLE_PORT=5540 KETTLE_PWA_PORT=5499 PLAYWRIGHT_JSON_OUTPUT_NAME=$PWD/.tmp/LR-pw/timer-pwa.json npx playwright test --project=timer-harness --project=timer-app --project=pwa --workers=1 --reporter=list,json --output=$PWD/.tmp/LR-pw/timer-pwa > $E/runs/timer-pwa.log.txt 2>&1
g env KETTLE_PORT=5540 W3_LOAD=1 PLAYWRIGHT_JSON_OUTPUT_NAME=$PWD/.tmp/LR-pw/load.json npx playwright test tests/w3-notices-load.spec.ts --project=chromium --workers=1 --reporter=list,json --output=$PWD/.tmp/LR-pw/load > $E/runs/w3-notices-load.log.txt 2>&1
g env KETTLE_PORT=5540 PLAYWRIGHT_JSON_OUTPUT_NAME=$PWD/.tmp/LR-pw/x1.json npx playwright test tests/integrity.spec.ts --project=chromium --workers=1 --repeat-each=10 --trace=on -g 'I03 storage-full warning is a banner in the page \(phone 390×844\) nothing over the brew' --reporter=list,json --output=$PWD/.tmp/LR-pw/x1 > $E/x1/x1-i03-x10.log.txt 2>&1
echo done > $E/runs/chainA.done
