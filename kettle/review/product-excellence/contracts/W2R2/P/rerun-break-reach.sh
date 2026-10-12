#!/bin/sh
# W2R2 Maker P — break-reach.spec.ts:179 (Break's over at 200 % text) failed 2/105 in the full run: rerun it on the
# control dev server (b377c62, :5410) and on mine (:5422), twice each, same spec file, under the slot gate.
G="python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane P --n 1"
L=/home/user/wt/w3p/kettle/review/product-excellence/contracts/W2R2/P/suites
cd /home/user/wt/w3p/kettle || exit 1
for i in 1 2; do
  for port in 5410 5422; do
    KETTLE_PORT=$port $G -- timeout 900 npx playwright test tests/break-reach.spec.ts -g "Break.s over with a carried task" --project=chromium --workers=1 --reporter=list > $L/rerun-break-reach-$port-r$i.log 2>&1
  done
done
echo rerun-done
