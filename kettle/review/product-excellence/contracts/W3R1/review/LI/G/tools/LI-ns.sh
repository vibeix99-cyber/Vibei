#!/bin/sh
# Lane I: the maker's two notice-strip failures at 200 %, once on trial :5523 and once on base :5478.
S="python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane LI --n 1 --"
G='\((375×667 dark 200 %|844×390 light 200 %)\)$'
OUT=/home/user/wt/w5tr-g/kettle/.tmp/LI
date -u +"trial start %H:%M:%S" > $OUT/LI-ns-trial.log
cd /home/user/wt/w5tr-g/kettle && $S env KETTLE_PORT=5523 npx playwright test tests/notice-strip.spec.ts --project=chromium --workers=1 --reporter=list --output=$OUT/LI-pw-ns-trial -g "$G" >> $OUT/LI-ns-trial.log 2>&1
echo "exit $?" >> $OUT/LI-ns-trial.log; date -u +"trial end %H:%M:%S" >> $OUT/LI-ns-trial.log
date -u +"base start %H:%M:%S" > $OUT/LI-ns-base.log
cd /home/user/wt/w4-final/kettle && $S env KETTLE_PORT=5478 npx playwright test tests/notice-strip.spec.ts --project=chromium --workers=1 --reporter=list --output=$OUT/LI-pw-ns-base -g "$G" >> $OUT/LI-ns-base.log 2>&1
echo "exit $?" >> $OUT/LI-ns-base.log; date -u +"base end %H:%M:%S" >> $OUT/LI-ns-base.log
