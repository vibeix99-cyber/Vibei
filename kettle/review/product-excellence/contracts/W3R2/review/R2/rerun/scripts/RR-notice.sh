#!/bin/bash
# the notice suites on trial 2 :5601, two workers (the gate job is --n 2)
E=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/review/R2/rerun
W=/home/user/wt/w8tr-g2/kettle
P=$W/.tmp/RR-pw
cd $W
name=notice-suite-5601
{
  echo "### start $(date -u +%H:%M:%S) UTC; load: $(uptime)"
  echo "### cmd: KETTLE_PORT=5601 npx playwright test notice-strip w3-notices w3-notices-idle summary-notice toast-room --project=chromium --workers=2"
  env KETTLE_PORT=5601 PLAYWRIGHT_JSON_OUTPUT_NAME=$E/json/$name.json npx playwright test tests/notice-strip.spec.ts tests/w3-notices.spec.ts tests/w3-notices-idle.spec.ts tests/summary-notice.spec.ts tests/toast-room.spec.ts --project=chromium --workers=2 --reporter=list,json --output=$P/$name
  echo "### end $(date -u +%H:%M:%S) UTC; exit=$?; load: $(uptime)"
} > $E/runs/$name.log.txt 2>&1
echo done > $E/runs/notice.done
