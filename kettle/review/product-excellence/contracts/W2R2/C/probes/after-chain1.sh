#!/bin/bash
C=/home/user/wt/w3c/kettle/review/product-excellence/contracts/W2R2/C
until grep -q "== done" $C/runs/chain1.log; do sleep 10; done
echo "(preview stays up for the night redo; chain2 stops it)"
python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane C --n 1 -- $C/probes/chain3.sh
echo "== full chromium $(date -u +%T)"
cd /home/user/wt/w3c/kettle && python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane C --n 2 -- env KETTLE_PORT=5423 timeout 3600 npx playwright test --project=chromium --workers=2 > $C/runs/chromium-full-workers2.txt 2>&1; echo "full exit $?"; tail -15 $C/runs/chromium-full-workers2.txt
echo "== chain3 done $(date -u +%T)"
