#!/bin/bash
cd /home/user/wt/w4tr-c/kettle
echo "START $(date -u +%FT%TZ) load=$(cut -d' ' -f1-3 /proc/loadavg)"
KETTLE_PORT=5460 KETTLE_PWA_PORT=5493 python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane LR --n 1 -- npx playwright test --project=timer-harness --project=timer-app --project=pwa --workers=1 --output=/tmp/claude-0/lrc-scratch/out-timer
echo "EXIT $? $(date -u +%FT%TZ)"
