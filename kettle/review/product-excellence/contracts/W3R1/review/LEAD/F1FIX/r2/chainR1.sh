#!/bin/bash
cd /home/user/wt/w6tr-x2/kettle
echo "== R1 start $(date -u +%T) load $(cut -d' ' -f1-3 /proc/loadavg)"
KETTLE_PORT=5563 npx playwright test tests/integrity.spec.ts --project=chromium --workers=1 --reporter=list --output=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/l5r2-integ > /home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/LEAD/F1FIX/r2/integrity-all.log 2>&1; echo "integrity exit $?"
echo "== R1 end $(date -u +%T)"
