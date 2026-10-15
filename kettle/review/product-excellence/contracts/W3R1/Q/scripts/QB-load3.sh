#!/bin/bash
# The load control with its per-frame logger removed (scratch copy), the two stale cases, to test the logger's effect.
E=/home/user/wt/w5q/kettle/review/product-excellence/contracts/W3R1/Q/B/proof
cd /home/user/wt/w5q/kettle
env W3_LOAD=1 KETTLE_PORT=5545 npx playwright test --config .tmp/q-probes/pw.config.ts .tmp/q-probes/load-nolog.spec.ts --workers=1 -g '(390×844|375×667) light 200 % reduced motion' --reporter=list --output=.tmp/Q-pw/load-nolog > $E/w3-notices-load-2cfg-nolog-scratch.log.txt 2>&1
