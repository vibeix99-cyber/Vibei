#!/bin/bash
# Lane R job A (one gate job, --n 1, sequential): real-input smoke on the trial preview, then timer-harness/timer-app/pwa.
L=/home/user/Vibei/kettle/review/product-excellence/contracts/W2R2/review/LR/logs
S=/tmp/claude-0/lr2-scratch
TRIAL=/home/user/wt/w3tr-pc/kettle
echo "[$(date -u +%T)] jobA start"
mkdir -p $S/smoke
echo "[$(date -u +%T)] smoke"
(cd $TRIAL && node .tmp/LR/smoke.mjs --base http://127.0.0.1:5455 --out $S/smoke --w 390 --h 844 --dpr 2 --theme light) > $L/smoke.log 2>&1; echo "exit $?" >> $L/smoke.log
tail -3 $L/smoke.log | cut -c1-200
echo "[$(date -u +%T)] timer-harness timer-app pwa"
(cd $TRIAL && KETTLE_PORT=5445 KETTLE_PWA_PORT=5497 npx playwright test --project=timer-harness --project=timer-app --project=pwa --workers=1 --reporter=list --output=/tmp/claude-0/lr2-out-timer) > $L/timer-app-pwa.log 2>&1; echo "exit $?" >> $L/timer-app-pwa.log
tail -6 $L/timer-app-pwa.log | cut -c1-200
echo "[$(date -u +%T)] jobA end"
