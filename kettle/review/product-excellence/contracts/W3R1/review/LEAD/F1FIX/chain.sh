#!/bin/bash
# LEAD-5 · F1 fix checks: race spec on controls and fix, compat both directions, then integrity:309 ×20 under load on :5562.
cd /home/user/wt/w6tr-x/kettle
echo "== start $(date -u +%T) load $(cut -d' ' -f1-3 /proc/loadavg)"
for port in 5560 5478; do KETTLE_PORT=$port npx playwright test tests/w3-intention-race.spec.ts --repeat-each=3 --project=chromium --workers=1 --reporter=list --output=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/l5-f1x-race-$port > /home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/LEAD/F1FIX/race-$port-x3.log 2>&1; echo "race $port exit $?"; done
KETTLE_PORT=5562 npx playwright test tests/w3-intention-race.spec.ts --repeat-each=5 --project=chromium --workers=1 --reporter=list --output=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/l5-f1x-race-5562 > /home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/LEAD/F1FIX/race-5562-x5.log 2>&1; echo "race 5562 exit $?"
F1X_FROM=http://127.0.0.1:5478 F1X_TO=http://127.0.0.1:5562 npx playwright test --config .tmp/lead5-f1x/pw.config.ts compat.spec.ts --workers=1 --reporter=list --output=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/l5-f1x-c1 > /home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/LEAD/F1FIX/compat-base4d-to-fix.log 2>&1; echo "compat b->f exit $?"
F1X_FROM=http://127.0.0.1:5562 F1X_TO=http://127.0.0.1:5478 npx playwright test --config .tmp/lead5-f1x/pw.config.ts compat.spec.ts --workers=1 --reporter=list --output=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/l5-f1x-c2 > /home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/LEAD/F1FIX/compat-fix-to-base4d.log 2>&1; echo "compat f->b exit $?"
PIDS=""; for i in 1 2 3 4 5 6; do ( while :; do :; done ) & PIDS="$PIDS $!"; done
echo "burners $PIDS $(date -u +%T) load $(cut -d' ' -f1-3 /proc/loadavg)"
KETTLE_PORT=5562 npx playwright test tests/integrity.spec.ts -g 'two tabs, the leading one frozen across the end' --repeat-each=20 --project=chromium --workers=2 --reporter=list --output=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/l5-f1x-i01 > /home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/LEAD/F1FIX/i01-x20-nb6.log 2>&1; echo "i01 exit $? load $(cut -d' ' -f1-3 /proc/loadavg)"
kill $PIDS 2>/dev/null; wait 2>/dev/null
echo "== end $(date -u +%T)"
