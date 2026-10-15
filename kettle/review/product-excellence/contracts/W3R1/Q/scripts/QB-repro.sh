#!/bin/bash
E=/home/user/wt/w5q/kettle/review/product-excellence/contracts/W3R1/Q/B/probe
cd /home/user/wt/w5q/kettle
for P in ${PORTS:-5545 5478}; do
env KETTLE_PORT=$P PLAYWRIGHT_JSON_OUTPUT_NAME=$E/f1-repro-$P.json npx playwright test --config .tmp/q-probes/pw.config.ts .tmp/q-probes/f1-repro.spec.ts --workers=1 --repeat-each=${REP:-3} --reporter=list,json --output=.tmp/Q-pw/repro-$P > $E/f1-repro-$P.log.txt 2>&1
done
