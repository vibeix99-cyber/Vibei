#!/bin/bash
L=/home/user/Vibei/kettle/review/product-excellence/contracts/W2R2/review/LR/logs
date -u +%T > $L/chromium-full.start
cd /home/user/wt/w3tr-pc/kettle
KETTLE_PORT=5445 npx playwright test --project=chromium --workers=2 --reporter=list --output=/tmp/claude-0/lr2-out > $L/chromium-full.log 2>&1
echo "exit $?" > $L/chromium-full.exit
date -u +%T > $L/chromium-full.end
