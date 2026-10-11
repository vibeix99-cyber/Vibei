#!/bin/bash
# Tests on the final revision: chromium (all specs), timer-harness, timer-app, pwa.
cd /home/user/wt/r7a/kettle
SL=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
SC=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/r7/M7a
echo "rev $(git rev-parse HEAD) src $(git rev-parse HEAD:kettle/src) $(date -u +%FT%TZ)" > $SC/tests-final.log
for pr in chromium timer-harness timer-app pwa; do
  KETTLE_PORT=5226 KETTLE_PWA_PORT=5236 python3 -I $SL run --lane M7a --n 1 -- node node_modules/.bin/playwright test --project=$pr --reporter=list > $SC/tests-final-$pr.log 2>&1
  echo "== $pr rc=$? $(date -u +%FT%TZ) $(grep -E '^\s+[0-9]+ (passed|failed|skipped|flaky)' $SC/tests-final-$pr.log | tr '\n' ' ')" >> $SC/tests-final.log
done
echo "TESTS DONE $(date -u +%FT%TZ)" >> $SC/tests-final.log
