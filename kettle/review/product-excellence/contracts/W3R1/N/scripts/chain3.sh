#!/bin/bash
# chain3.sh: after perf, the second spec run, then the reduced dark / phone / unlock set (time box)
S=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
E=review/product-excellence/contracts/W3R1/N
cd /home/user/wt/w5n/kettle
while [ -d /proc/14131 ]; do sleep 3; done; echo "perf done"
G="python3 -I $S run --lane N --n 1 --"
$G env KETTLE_PORT=5504 npx playwright test tests/chai3d.spec.ts tests/w2-room.spec.ts --project=chromium --workers=1 --output /tmp/claude-0/n-pw-2 > $E/runs/chai3d-w2room-run2.txt 2>&1; echo "specs run2 exit $?"
$G node .tmp/N/sep.mjs --base http://127.0.0.1:5478 --label BEFORE-dark-390 --out $E/measure/BEFORE --vps 1440x900@2,390x844@3 --themes dark --tiers low --times day,dusk,night --raw .tmp/N/raw/BEFORE; echo "dark B"
$G node .tmp/N/sep.mjs --base http://127.0.0.1:5504 --label AFTER-dark-390 --out $E/measure/AFTER --vps 1440x900@2,390x844@3 --themes dark --tiers low --times day,dusk,night --raw .tmp/N/raw/AFTER; echo "dark A"
$G node .tmp/N/unlock.mjs --base http://127.0.0.1:5478 --label BEFORE --out $E/unlock/BEFORE --cfg 390x844@3:light:night --tier default; echo "unlock B"
$G node .tmp/N/unlock.mjs --base http://127.0.0.1:5504 --label AFTER --out $E/unlock/AFTER --cfg 390x844@3:light:night --tier default; echo "unlock A"
echo CHAIN3-DONE
