#!/bin/bash
cd /home/user/wt/w4tr-t2/kettle
L=/home/user/Vibei/kettle/review/product-excellence/contracts/W2R3/review/LT
for S in toast-room w2-home statusbar a11y integrity; do
  echo "$S start $(date -u +%T)"
  KETTLE_PORT=5476 PLAYWRIGHT_JSON_OUTPUT_NAME=$L/runs/suite-$S.json npx playwright test tests/$S.spec.ts --project=chromium --workers=1 --output=/tmp/claude-0/lt3-out-$S --reporter=list,json > $L/runs/suite-$S.log 2>&1
  echo "$S end $(date -u +%T) rc=$?"
done
