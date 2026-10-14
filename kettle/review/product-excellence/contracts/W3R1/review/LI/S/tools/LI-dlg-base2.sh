#!/bin/sh
S="python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane LI --n 1 --"
cd /home/user/wt/w5tr-s/kettle/.tmp/LI
D=""; for s in 390x844 375x667 844x390 1440x900; do for t in light dark; do for p in 100 200; do D="$D,$s:$t:$p"; done; done; done; D=${D#,}
$S node LI-sheets.mjs http://127.0.0.1:5478 base-dlg3 /home/user/wt/w5tr-s/kettle/.tmp/LI/out dlg $D > LI-dlg-base.log 2>&1; echo "exit $?" >> LI-dlg-base.log
