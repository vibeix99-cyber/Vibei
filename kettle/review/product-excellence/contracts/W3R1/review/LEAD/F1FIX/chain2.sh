#!/bin/bash
cd /home/user/wt/w6tr-x/kettle
echo "== start2 $(date -u +%T) load $(cut -d' ' -f1-3 /proc/loadavg)"
PIDS=""; for i in 1 2 3 4 5 6; do ( while :; do :; done ) & PIDS="$PIDS $!"; done
echo "burners $PIDS $(date -u +%T) load $(cut -d' ' -f1-3 /proc/loadavg)"
KETTLE_PORT=5562 npx playwright test tests/integrity.spec.ts -g 'two tabs, the leading one frozen across the end' --repeat-each=20 --project=chromium --workers=2 --reporter=list --output=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/l5-f1x-i01 > /home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/LEAD/F1FIX/i01-x20-nb6.log 2>&1; echo "i01 exit $? load $(cut -d' ' -f1-3 /proc/loadavg)"
kill $PIDS 2>/dev/null; wait 2>/dev/null
echo "== end $(date -u +%T)"
