#!/bin/bash
cd /home/user/wt/w6tr-x2/kettle
echo "== R2 start $(date -u +%T) load $(cut -d' ' -f1-3 /proc/loadavg)"
KETTLE_PORT=5563 npx playwright test tests/w2-home.spec.ts --project=chromium --workers=1 --reporter=list --output=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/l5r2-w2home > /home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/LEAD/F1FIX/r2/w2-home.log 2>&1; echo "w2-home exit $?"
KETTLE_PORT=5563 KETTLE_PWA_PORT=5598 npx playwright test --project=timer-harness --project=timer-app --project=pwa --workers=1 --reporter=list --output=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/l5r2-timerpwa > /home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/LEAD/F1FIX/r2/timer-pwa.log 2>&1; echo "timer-pwa exit $?"
echo "== R2 end $(date -u +%T)"
