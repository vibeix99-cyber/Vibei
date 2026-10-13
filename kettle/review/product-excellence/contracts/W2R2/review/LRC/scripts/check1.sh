#!/bin/bash
# usage: check1.sh <run-label>
cd /home/user/wt/w4tr-c/kettle
echo "START $(date -u +%FT%TZ) load=$(cut -d' ' -f1-3 /proc/loadavg)"
KETTLE_PORT=5460 python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane LR --n 1 -- npx playwright test tests/chai3d.spec.ts tests/w2-room.spec.ts --project=chromium --workers=1
echo "EXIT $? $(date -u +%FT%TZ)"
