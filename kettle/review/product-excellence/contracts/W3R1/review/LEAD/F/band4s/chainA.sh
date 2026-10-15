#!/bin/bash
cd /home/user/wt/w5tr-f/kettle/.tmp/LI2
echo "== A start $(date -u +%T) load $(cut -d' ' -f1-3 /proc/loadavg)"
node LI2-probe2.mjs LEADQA http://127.0.0.1:5546 /home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/LEAD/F/band4s/probes2 '' L1,L2 > /home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/LEAD/F/band4s/probes2.log 2>&1; echo "probe2 exit $?"
cd /home/user/wt/w5tr-qa/kettle
KETTLE_PORT=5546 npx playwright test tests/w3-notices.spec.ts tests/w3-notices-idle.spec.ts --repeat-each=2 --project=chromium --workers=1 --reporter=list --output=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/l5-qa-w3n > /home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/LEAD/F/band4s/w3-notices-idle-x2.log 2>&1; echo "w3n exit $?"
echo "== A end $(date -u +%T) load $(cut -d' ' -f1-3 /proc/loadavg)"
