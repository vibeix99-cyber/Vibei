#!/bin/bash
# X-11 attempts 2-3 reproduced (scratch copies of F's 99f3741 / dd519c5 spec, press() instrumented), on :5540 (2be3de1,
# the tree F ran them on), 1440 light 200 % reduced, trace on. Plus the unchanged spec, instrumented, once, for comparison.
E=/home/user/wt/w5q/kettle/review/product-excellence/contracts/W3R1/Q/B/att
mkdir -p $E
cd /home/user/wt/w5q/kettle
for f in ${FILES:-ns-base ns-att2}; do
  echo "$f start $(date -u +%T) load $(cut -d' ' -f1 /proc/loadavg)" >> $E/chain.log.txt
  env KETTLE_PORT=5540 PLAYWRIGHT_JSON_OUTPUT_NAME=$E/$f.json npx playwright test --config .tmp/q-probes/pw.config.ts .tmp/q-probes/$f.spec.ts --workers=1 --repeat-each=${REP:-1} -g '1440×900 light 200 % reduced motion' --reporter=list,json --output=.tmp/Q-pw/att-$f > $E/$f.log.txt 2>&1
  echo "$f exit $? end $(date -u +%T)" >> $E/chain.log.txt
done
