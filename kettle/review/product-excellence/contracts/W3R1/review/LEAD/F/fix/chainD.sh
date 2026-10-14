#!/bin/bash
cd /home/user/wt/w5tr-f2/kettle
echo "== D start $(date -u +%T) load $(cut -d' ' -f1-3 /proc/loadavg)"
KETTLE_PORT=5528 npx playwright test tests/toast-room.spec.ts tests/a11y.spec.ts tests/summary-notice.spec.ts tests/break-reach.spec.ts tests/w2-home.spec.ts --project=chromium --workers=1 --reporter=list --output=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/l5-f-owned > /home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/LEAD/F/fix/owned-specs.log 2>&1; echo "owned exit $?"
echo "== D end $(date -u +%T) load $(cut -d' ' -f1-3 /proc/loadavg)"
