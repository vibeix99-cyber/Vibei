#!/bin/sh
# Lane I (S): w3-stats.spec.ts:98 (Delete this brew? 5 sizes) on trial :5522 then combined :5520, each from its own worktree.
S="python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane LI --n 1"
OUT=/home/user/wt/w5tr-s/kettle/.tmp/LI
cd /home/user/wt/w5tr-s/kettle
date -u +"trial start %H:%M:%S" > $OUT/LI-s98-trial.log
$S -- env KETTLE_PORT=5522 npx playwright test tests/w3-stats.spec.ts:98 --project=chromium --workers=1 --reporter=list --output=$OUT/LI-pw-s98-trial >> $OUT/LI-s98-trial.log 2>&1
echo "exit $?" >> $OUT/LI-s98-trial.log; date -u +"trial end %H:%M:%S" >> $OUT/LI-s98-trial.log
cd /home/user/wt/w5tr-all/kettle
date -u +"combined start %H:%M:%S" > $OUT/LI-s98-comb.log
$S -- env KETTLE_PORT=5520 npx playwright test tests/w3-stats.spec.ts:98 --project=chromium --workers=1 --reporter=list --output=$OUT/LI-pw-s98-comb >> $OUT/LI-s98-comb.log 2>&1
echo "exit $?" >> $OUT/LI-s98-comb.log; date -u +"combined end %H:%M:%S" >> $OUT/LI-s98-comb.log
