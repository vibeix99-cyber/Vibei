#!/bin/sh
# Lane I (S): F-T2-4 detail (16 configs) and every Sheet (375x667@200 light/dark, 1440@100/@200) on one build.
# usage: LI-run-sheets.sh <url> <label>
S="python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane LI --n 1 --"
cd /home/user/wt/w5tr-s/kettle/.tmp/LI
D=""
for s in 390x844 375x667 844x390 1440x900; do for t in light dark; do for p in 100 200; do D="$D,$s:$t:$p"; done; done; done
D=${D#,}
$S node LI-sheets.mjs $1 $2-dlg /home/user/wt/w5tr-s/kettle/.tmp/LI/out dlg $D > LI-dlg-$2.log 2>&1; echo "exit $?" >> LI-dlg-$2.log
$S node LI-sheets.mjs $1 $2-all /home/user/wt/w5tr-s/kettle/.tmp/LI/out all 375x667:light:200,375x667:dark:200,1440x900:light:100,1440x900:dark:200 > LI-all-$2.log 2>&1; echo "exit $?" >> LI-all-$2.log
