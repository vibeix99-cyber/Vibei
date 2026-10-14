#!/bin/sh
# Lane I (S): integrity.spec.ts whole file once, then the backup test --repeat-each=5 --workers=2, on trial :5522.
S="python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane LI"
OUT=/home/user/wt/w5tr-s/kettle/.tmp/LI
cd /home/user/wt/w5tr-s/kettle
date -u +"whole start %H:%M:%S" > $OUT/LI-integ-whole.log
$S --n 1 -- env KETTLE_PORT=5522 npx playwright test tests/integrity.spec.ts --project=chromium --workers=1 --reporter=list --output=$OUT/LI-pw-integ-whole >> $OUT/LI-integ-whole.log 2>&1
echo "exit $?" >> $OUT/LI-integ-whole.log; date -u +"whole end %H:%M:%S" >> $OUT/LI-integ-whole.log
date -u +"repeat start %H:%M:%S" > $OUT/LI-integ-repeat.log
$S --n 2 -- env KETTLE_PORT=5522 npx playwright test tests/integrity.spec.ts --project=chromium --repeat-each=5 --workers=2 --fully-parallel --reporter=list --output=$OUT/LI-pw-integ-repeat -g "export → reset \(explicit confirmation\) → import restores" >> $OUT/LI-integ-repeat.log 2>&1
echo "exit $?" >> $OUT/LI-integ-repeat.log; date -u +"repeat end %H:%M:%S" >> $OUT/LI-integ-repeat.log
