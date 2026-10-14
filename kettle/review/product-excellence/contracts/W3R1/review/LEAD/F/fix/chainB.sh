#!/bin/bash
# LEAD-5 · F fix: specs on the fix trial :5528, from its own worktree.
cd /home/user/wt/w5tr-f2/kettle
echo "== B start $(date -u +%T) load $(cut -d' ' -f1-3 /proc/loadavg)"
KETTLE_PORT=5528 npx playwright test tests/w3-notices.spec.ts tests/w3-notices-idle.spec.ts --repeat-each=2 --project=chromium --workers=1 --reporter=list --output=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/l5-f-w3n > /home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/LEAD/F/fix/w3-notices-idle-x2.log 2>&1; echo "w3n exit $?"
KETTLE_PORT=5528 npx playwright test tests/whistle.spec.ts --project=chromium --workers=1 --reporter=list --output=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/l5-f-wh > /home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/LEAD/F/fix/whistle.log 2>&1; echo "whistle exit $?"
KETTLE_PORT=5528 npx playwright test tests/notice-strip.spec.ts -g '\(1440×900 light 200 % reduced motion\)$' --repeat-each=3 --project=chromium --workers=1 --reporter=list --output=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/l5-f-ns1 > /home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/LEAD/F/fix/ns292-1440-light-200-rm-x3.log 2>&1; echo "ns light exit $?"
KETTLE_PORT=5528 npx playwright test tests/notice-strip.spec.ts -g '\(1440×900 dark 200 %\)$' --repeat-each=3 --project=chromium --workers=1 --reporter=list --output=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/l5-f-ns2 > /home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/LEAD/F/fix/ns292-1440-dark-200-x3.log 2>&1; echo "ns dark exit $?"
echo "== B end $(date -u +%T)"
