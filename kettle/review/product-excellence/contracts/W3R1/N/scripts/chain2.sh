#!/bin/bash
# chain2.sh: N's remaining browser jobs in priority order, one at a time through the slot gate
S=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
E=review/product-excellence/contracts/W3R1/N
cd /home/user/wt/w5n/kettle
mkdir -p $E/runs $E/perf
G="python3 -I $S run --lane N --n 1 --"
$G env KETTLE_PORT=5504 npx playwright test tests/chai3d.spec.ts tests/w2-room.spec.ts --project=chromium --workers=1 --output /tmp/claude-0/n-pw-1 > $E/runs/chai3d-w2room-run1.txt 2>&1; echo "specs run1 exit $?"
$G node .tmp/N/perf.mjs --baseUrl http://127.0.0.1:5488 --afterUrl http://127.0.0.1:5514 --time night --rounds 3 --frames 60 --dpr 3 --out $E/perf/perf-low-390x844-night.json; echo "perf done"
$G node .tmp/N/sep.mjs --base http://127.0.0.1:5478 --label BEFORE-1440-dark --out $E/measure/BEFORE --vps 1440x900@2 --themes dark --raw .tmp/N/raw/BEFORE; echo "dark B"
$G node .tmp/N/sep.mjs --base http://127.0.0.1:5504 --label AFTER-1440-dark --out $E/measure/AFTER --vps 1440x900@2 --themes dark --raw .tmp/N/raw/AFTER; echo "dark A"
$G env KETTLE_PORT=5504 npx playwright test tests/chai3d.spec.ts tests/w2-room.spec.ts --project=chromium --workers=1 --output /tmp/claude-0/n-pw-2 > $E/runs/chai3d-w2room-run2.txt 2>&1; echo "specs run2 exit $?"
$G node .tmp/N/sep.mjs --base http://127.0.0.1:5478 --label BEFORE-390 --out $E/measure/BEFORE --vps 390x844@3 --themes light,dark --tiers low --raw .tmp/N/raw/BEFORE; echo "390 B"
$G node .tmp/N/sep.mjs --base http://127.0.0.1:5504 --label AFTER-390 --out $E/measure/AFTER --vps 390x844@3 --themes light,dark --tiers low --raw .tmp/N/raw/AFTER; echo "390 A"
for c in "light:night" "dark:night" "light:day"; do
  $G node .tmp/N/unlock.mjs --base http://127.0.0.1:5478 --label BEFORE --out $E/unlock/BEFORE --cfg 390x844@3:$c --tier default
  $G node .tmp/N/unlock.mjs --base http://127.0.0.1:5504 --label AFTER --out $E/unlock/AFTER --cfg 390x844@3:$c --tier default
done
echo CHAIN2-DONE
