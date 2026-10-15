#!/bin/bash
# Regression on the final Phase B tree, :5545, --workers=2: the whole integrity file, then the whole load control
# (W3_LOAD=1), then the w3-notices pair once.
E=/home/user/wt/w5q/kettle/review/product-excellence/contracts/W3R1/Q/B/final
mkdir -p $E
cd /home/user/wt/w5q/kettle
run() { local n=$1; shift
  echo "$n start $(date -u +%T) load $(cut -d' ' -f1 /proc/loadavg)" >> $E/chain.log.txt
  env KETTLE_PORT=5545 PLAYWRIGHT_JSON_OUTPUT_NAME=$E/$n.json npx playwright test "$@" --project=chromium --workers=2 --reporter=list,json --output=.tmp/Q-pw/$n > $E/$n.log.txt 2>&1
  echo "$n exit $? end $(date -u +%T) load $(cut -d' ' -f1 /proc/loadavg)" >> $E/chain.log.txt
}
run integrity-all tests/integrity.spec.ts
export W3_LOAD=1
run w3-notices-load-all tests/w3-notices-load.spec.ts
