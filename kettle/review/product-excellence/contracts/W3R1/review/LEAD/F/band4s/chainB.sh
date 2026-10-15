#!/bin/bash
cd /home/user/wt/w5tr-qa/kettle
echo "== B start $(date -u +%T) load $(cut -d' ' -f1-3 /proc/loadavg)"
KETTLE_PORT=5546 npx playwright test tests/notice-strip.spec.ts --project=chromium --workers=1 --reporter=list --output=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/l5-qa-ns > /home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/LEAD/F/band4s/notice-strip-all.log 2>&1; echo "ns exit $?"
echo "== B end $(date -u +%T) load $(cut -d' ' -f1-3 /proc/loadavg)"
