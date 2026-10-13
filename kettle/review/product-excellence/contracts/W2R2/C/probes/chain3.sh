#!/bin/bash
C=/home/user/wt/w3c/kettle/review/product-excellence/contracts/W2R2/C
cd $C/probes && echo "== night redo $(date -u +%T)"
for cfg in 390x844@3:light:night 1440x900@2:light:night; do
  timeout 900 node capture.mjs --base http://127.0.0.1:5430 --label BEFORE --out $C/captures/BEFORE --cfg $cfg --extra "&nooktime=night"
  timeout 900 node capture.mjs --base http://127.0.0.1:5433 --label AFTER --out $C/captures/AFTER --cfg $cfg --extra "&nooktime=night"
done
timeout 900 node art.mjs --base http://127.0.0.1:5433 --out $C/art --only night
echo "== offline (3 variants) $(date -u +%T)"; timeout 900 node offline.mjs --base http://127.0.0.1:5433 --out $C/offline/offline.json --shots $C/offline
echo "== sheets $(date -u +%T)" && timeout 600 node sheets.mjs --c $C
cd /home/user/wt/w3c/kettle
echo "== chai3d rerun $(date -u +%T)"
KETTLE_PORT=5423 timeout 1500 npx playwright test tests/chai3d.spec.ts --project=chromium --workers=1 > $C/runs/chromium-chai3d.txt 2>&1; echo "chai3d exit $?"; tail -4 $C/runs/chromium-chai3d.txt
$C/probes/chain2.sh
