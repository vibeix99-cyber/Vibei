#!/bin/sh
# W2R2 Maker P — the browser suites, each under the slot gate (lane P), against my dev server on :5422.
G="python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane P"
L=/home/user/wt/w3p/kettle/review/product-excellence/contracts/W2R2/P/suites
cd /home/user/wt/w3p/kettle || exit 1
export KETTLE_PORT=5422
# (run 1, on 23e7494: chromium-touched.log; the full run below includes the same specs on a4f1773)
[ "$1" = touched ] && $G --n 1 -- timeout 2400 npx playwright test tests/w2-summary.spec.ts tests/whistle.spec.ts tests/a11y.spec.ts --project=chromium --workers=1 --reporter=list > $L/chromium-touched.log 2>&1
$G --n 2 -- timeout 3600 npx playwright test --project=chromium --workers=2 --reporter=list > $L/chromium-full-w2.log 2>&1
$G --n 1 -- timeout 1800 npx playwright test --project=timer-harness --project=timer-app --workers=1 --reporter=list > $L/timer.log 2>&1
# pwa builds and previews on my preview port: stop my preview first (captures are done by then)
/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/prev.sh stop
KETTLE_PWA_PORT=5432 $G --n 1 -- timeout 1800 npx playwright test --project=pwa --workers=1 --reporter=list > $L/pwa.log 2>&1
echo chain-done
