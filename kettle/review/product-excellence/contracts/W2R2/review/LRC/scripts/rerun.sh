#!/bin/bash
# usage: rerun.sh <port> <label>
cd /home/user/wt/w4tr-c/kettle
echo "START $(date -u +%FT%TZ) port=$1 load=$(cut -d' ' -f1-3 /proc/loadavg)"
KETTLE_PORT=$1 python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane LR --n 1 -- npx playwright test tests/a11y.spec.ts --project=chromium --workers=1 --output=/tmp/claude-0/lrc-scratch/out-rerun-$2
echo "EXIT $? $(date -u +%FT%TZ)"
