#!/bin/bash
# Lane R job A (one gate job, --n 1, everything sequential): rerun of the one chromium failure on trial and control (3x each),
# then timer-harness/timer-app/pwa, then the real-input smoke on the trial preview.
L=/home/user/Vibei/kettle/review/product-excellence/contracts/W2/review/LR/logs
S=/tmp/claude-0/lr-scratch
TRIAL=/home/user/wt/w2t-c/kettle; CTRL=/home/user/wt/w2-base/kettle
echo "[$(date -u +%T)] jobA start"
GREP='I03 storage-full warning is a banner in the page \(desktop 1440×900\)'
for i in 1 2 3; do
  echo "[$(date -u +%T)] rerun trial $i"
  (cd $TRIAL && KETTLE_PORT=5345 npx playwright test tests/integrity.spec.ts -g "$GREP" --project=chromium --workers=1 --reporter=list --output=$S/pw-rerun-trial-$i) > $L/rerun-1004-trial-$i.log 2>&1; echo "exit $?" >> $L/rerun-1004-trial-$i.log
  tail -3 $L/rerun-1004-trial-$i.log
done
for i in 1 2 3; do
  echo "[$(date -u +%T)] rerun control $i"
  (cd $CTRL && KETTLE_PORT=5310 npx playwright test tests/integrity.spec.ts -g "$GREP" --project=chromium --workers=1 --reporter=list --output=$S/pw-rerun-ctrl-$i) > $L/rerun-1004-ctrl-$i.log 2>&1; echo "exit $?" >> $L/rerun-1004-ctrl-$i.log
  tail -3 $L/rerun-1004-ctrl-$i.log
done
echo "[$(date -u +%T)] timer-harness timer-app pwa"
(cd $TRIAL && KETTLE_PORT=5345 KETTLE_PWA_PORT=5396 npx playwright test --project=timer-harness --project=timer-app --project=pwa --workers=1 --reporter=list --output=$S/pw-timer-trial) > $L/timer-app-pwa.log 2>&1; echo "exit $?" >> $L/timer-app-pwa.log
tail -8 $L/timer-app-pwa.log
echo "[$(date -u +%T)] smoke"
mkdir -p $S/smoke
(cd $TRIAL && node .tmp/LR/smoke.mjs --base http://127.0.0.1:5355 --out $S/smoke --w 390 --h 844 --dpr 2 --theme light) > $L/smoke.log 2>&1; echo "exit $?" >> $L/smoke.log
tail -5 $L/smoke.log
echo "[$(date -u +%T)] jobA end"
