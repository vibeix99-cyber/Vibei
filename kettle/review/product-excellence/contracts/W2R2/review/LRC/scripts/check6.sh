#!/bin/bash
cd /home/user/wt/w4tr-c/kettle
echo "START $(date -u +%FT%TZ) load=$(cut -d' ' -f1-3 /proc/loadavg)"
KETTLE_PORT=5460 python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane LR --n 2 -- npx playwright test --project=chromium --workers=2 --output=/tmp/claude-0/lrc-scratch/out-full
echo "EXIT $? $(date -u +%FT%TZ)"
