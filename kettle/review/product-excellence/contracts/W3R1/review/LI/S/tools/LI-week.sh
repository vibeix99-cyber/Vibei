#!/bin/sh
S="python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane LI --n 1 --"
cd /home/user/wt/w5tr-s/kettle
date -u +"start %H:%M:%S" > .tmp/LI/LI-week.log
$S env LI_BASE=http://127.0.0.1:5478 LI_TRIAL=http://127.0.0.1:5522 LI_OUT=.tmp/LI/out/weekboundary npx playwright test -c .tmp/LI/LI-pw.config.ts --output=.tmp/LI/LI-pw-week >> .tmp/LI/LI-week.log 2>&1
echo "exit $?" >> .tmp/LI/LI-week.log; date -u +"end %H:%M:%S" >> .tmp/LI/LI-week.log
