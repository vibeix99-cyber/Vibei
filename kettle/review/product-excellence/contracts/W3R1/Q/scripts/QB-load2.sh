#!/bin/bash
E=/home/user/wt/w5q/kettle/review/product-excellence/contracts/W3R1/Q/B/proof
cd /home/user/wt/w5q/kettle
env W3_LOAD=1 KETTLE_PORT=5545 PLAYWRIGHT_JSON_OUTPUT_NAME=$E/${TAG:-w3-notices-load-2cfg-v2}.json npx playwright test tests/w3-notices-load.spec.ts --project=chromium --workers=1 --repeat-each=${REP:-1} -g '(390×844|375×667) light 200 % reduced motion' --reporter=list,json --output=.tmp/Q-pw/${TAG:-w3-notices-load-2cfg-v2} > $E/${TAG:-w3-notices-load-2cfg-v2}.log.txt 2>&1
