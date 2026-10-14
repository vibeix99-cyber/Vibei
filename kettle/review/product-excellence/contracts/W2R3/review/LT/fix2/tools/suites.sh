#!/bin/bash
# Lane T fix2 suites on :5477, --workers=1, one browser at a time.
cd /home/user/wt/w4tr-t2f/kettle
F=/home/user/Vibei/kettle/review/product-excellence/contracts/W2R3/review/LT/fix2/runs
for S in summary-notice toast-room a11y notice-strip; do
  echo "$S start $(date -u +%T)"
  KETTLE_PORT=5477 PLAYWRIGHT_JSON_OUTPUT_NAME=$F/suite-$S.json npx playwright test tests/$S.spec.ts --project=chromium --workers=1 --output=/tmp/claude-0/lt4-out-$S --reporter=list,json > $F/suite-$S.log 2>&1
  echo "$S end $(date -u +%T) rc=$?"
done
