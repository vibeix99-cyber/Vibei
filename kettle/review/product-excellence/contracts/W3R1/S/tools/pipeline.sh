#!/bin/bash
# Maker S: suites + controls + captures, in order, each through the slot gate (lane S).
cd /home/user/wt/w5s/kettle
S=review/product-excellence/contracts/W3R1/S
G="python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane S"
SP=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/S
mkdir -p $S/suites
echo "== integrity.spec.ts :781 (was :768) --repeat-each=5 --workers=2 (candidate :5502) $(date -u +%T)"
KETTLE_PORT=5502 $G --n 2 -- npx playwright test --project=chromium tests/integrity.spec.ts:781 --repeat-each=5 --workers=2 --fully-parallel --reporter=list --output=$SP/pw-768 > $S/suites/integrity-781-repeat5-w2.log 2>&1; tail -3 $S/suites/integrity-781-repeat5-w2.log
echo "== w3-stats.spec.ts on BASE :5478 (controls) $(date -u +%T)"
KETTLE_PORT=5478 $G --n 1 -- npx playwright test --project=chromium tests/w3-stats.spec.ts --workers=1 --reporter=list --output=$SP/pw-ctl > $S/suites/w3-stats-on-base-CONTROL.log 2>&1; tail -3 $S/suites/w3-stats-on-base-CONTROL.log
echo "== integrity.spec.ts whole file (candidate :5502) $(date -u +%T)"
KETTLE_PORT=5502 $G --n 1 -- npx playwright test --project=chromium tests/integrity.spec.ts --workers=1 --reporter=list --output=$SP/pw-int > $S/suites/integrity-full.log 2>&1; tail -3 $S/suites/integrity-full.log
echo "== captures $(date -u +%T)"
$S/tools/capall.sh $S/shots 375x667 390x844 1440x900 844x390
echo "PIPELINE DONE $(date -u +%T)"
