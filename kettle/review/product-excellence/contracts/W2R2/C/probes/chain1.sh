#!/bin/bash
# Chained browser jobs under ONE slot (run via slots.py --lane C --n 1). Each step logs to ../runs/.
C=/home/user/wt/w3c/kettle/review/product-excellence/contracts/W2R2/C
K=/home/user/wt/w3c/kettle
cd $K
echo "== specs $(date -u +%T)"
KETTLE_PORT=5423 timeout 1500 npx playwright test tests/chai3d.spec.ts tests/w2-room.spec.ts --project=chromium --workers=1 > $C/runs/chromium-chai3d-w2room.txt 2>&1; echo "specs exit $?"
tail -5 $C/runs/chromium-chai3d-w2room.txt
cd $C/probes
echo "== captures $(date -u +%T)"
for cfg in 390x844@3:light:day 1440x900@2:light:day 390x844@3:dark:day 1440x900@2:dark:day 390x844@3:light:night 1440x900@2:light:night; do
  timeout 900 node capture.mjs --base http://127.0.0.1:5430 --label BEFORE --out $C/captures/BEFORE --cfg $cfg
  timeout 900 node capture.mjs --base http://127.0.0.1:5433 --label AFTER --out $C/captures/AFTER --cfg $cfg
done
echo "== art $(date -u +%T)"
timeout 1200 node art.mjs --base http://127.0.0.1:5433 --out $C/art
echo "== offline $(date -u +%T)"
timeout 900 node offline.mjs --base http://127.0.0.1:5433 --out $C/offline/offline.json --shots $C/offline
echo "== done $(date -u +%T)"
