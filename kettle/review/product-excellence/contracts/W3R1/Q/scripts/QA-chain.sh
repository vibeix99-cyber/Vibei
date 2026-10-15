#!/bin/bash
# Phase A proof on :5545 (gate --lane Q --n 2, --workers=2). Each run has its own --output and JSON.
E=/home/user/wt/w5q/kettle/review/product-excellence/contracts/W3R1/Q/A
cd /home/user/wt/w5q/kettle
run() { # name, args...
  local n=$1; shift
  echo "$n start $(date -u +%T) load $(cut -d' ' -f1 /proc/loadavg)" >> $E/chain.log.txt
  env KETTLE_PORT=5545 PLAYWRIGHT_JSON_OUTPUT_NAME=$E/$n.json npx playwright test "$@" --project=chromium --workers=2 --reporter=list,json --output=.tmp/Q-pw/$n > $E/$n.log.txt 2>&1
  echo "$n exit $? end $(date -u +%T) load $(cut -d' ' -f1 /proc/loadavg)" >> $E/chain.log.txt
}
run w3-notices-idle-x2 tests/w3-notices.spec.ts tests/w3-notices-idle.spec.ts --repeat-each=2
run notice-strip-all tests/notice-strip.spec.ts
run owned-3 tests/toast-room.spec.ts tests/summary-notice.spec.ts tests/w2-home.spec.ts
