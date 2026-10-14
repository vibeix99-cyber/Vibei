#!/bin/bash
cd /home/user/wt/w5s/kettle
F=review/product-excellence/contracts/W3R1/S/fix
G="python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane S --n 1 --"
SP=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/S
mkdir -p $F/suites $F/fit
for i in 1 2; do
  echo "== w3-stats run $i $(date -u +%T)"
  KETTLE_PORT=5502 $G npx playwright test --project=chromium tests/w3-stats.spec.ts --workers=1 --reporter=list --output=$SP/pw-fix$i > $F/suites/w3-stats-run$i.log 2>&1; sed -i 's/\x1b\[[0-9;]*m//g' $F/suites/w3-stats-run$i.log; tail -2 $F/suites/w3-stats-run$i.log
done
echo "== fit 16 configs FIX / TRIAL / BASE $(date -u +%T)"
$G sh -c "node $F/tools/fitprobe.mjs --base http://127.0.0.1:5502 --label FIX --out $F/fit --mode fit > $F/fit/FIX-fit.log 2>&1; node $F/tools/fitprobe.mjs --base http://127.0.0.1:5502 --label FIX --out $F/fit --mode nofonts --sizes 390x844,375x667 > $F/fit/FIX-nofonts.log 2>&1"
$G sh -c "node $F/tools/fitprobe.mjs --base http://127.0.0.1:5522 --label TRIAL --out $F/fit --mode fit > $F/fit/TRIAL-fit.log 2>&1; node $F/tools/fitprobe.mjs --base http://127.0.0.1:5478 --label BASE --out $F/fit --mode fit > $F/fit/BASE-fit.log 2>&1"
echo "== integrity full $(date -u +%T)"
KETTLE_PORT=5502 $G npx playwright test --project=chromium tests/integrity.spec.ts --workers=1 --reporter=list --output=$SP/pw-fixint > $F/suites/integrity-full.log 2>&1; sed -i 's/\x1b\[[0-9;]*m//g' $F/suites/integrity-full.log; tail -2 $F/suites/integrity-full.log
echo "FIXPIPE DONE $(date -u +%T)"
