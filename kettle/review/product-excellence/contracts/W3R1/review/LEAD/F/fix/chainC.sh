#!/bin/bash
cd /home/user/wt/w5tr-f2/kettle
echo "== C start $(date -u +%T) load $(cut -d' ' -f1-3 /proc/loadavg)"
KETTLE_PORT=5528 npx playwright test tests/notice-strip.spec.ts --project=chromium --workers=1 --reporter=list --output=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/l5-f-nsall > /home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/LEAD/F/fix/notice-strip-all.log 2>&1; echo "ns all exit $?"
echo "== C end $(date -u +%T) load $(cut -d' ' -f1-3 /proc/loadavg)"
