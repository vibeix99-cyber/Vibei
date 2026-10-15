#!/bin/bash
# F1 minimal natural repro: the probe test with the 800 ms wait set to 0 (the brew starts as soon as both tabs have
# booted), no load, one worker. Run on this tree (:5545) and on base (:5478).
E=/home/user/wt/w5q/kettle/review/product-excellence/contracts/W3R1/Q/B/probe
cd /home/user/wt/w5q/kettle
for P in 5545 5478; do
env Q_WAIT=0 KETTLE_PORT=$P PLAYWRIGHT_JSON_OUTPUT_NAME=$E/f1-race-w0-$P.json npx playwright test --config .tmp/q-probes/pw.config.ts .tmp/q-probes/f1-race.spec.ts -g 'Q probe two tabs' --workers=1 --repeat-each=5 --reporter=list,json --output=.tmp/Q-pw/race-$P > $E/f1-race-w0-$P.log.txt 2>&1
echo "$P exit $? $(date -u +%T) load $(cut -d' ' -f1 /proc/loadavg)" >> $E/race.log.txt
done
