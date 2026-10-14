#!/bin/sh
# Lane I: base F-T2-4 controls at the configs base-dlg-r2 does not cover (queued after trial-all).
S="python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane LI --n 1 --"
cd /home/user/wt/w5tr-s/kettle/.tmp/LI
until grep -q "took" LI-all-trial.log 2>/dev/null || grep -q "WAIT LI 1 .*trial-all" /dev/null; do python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py status | grep -q "trial-all" && break; sleep 3; done
$S node LI-sheets.mjs http://127.0.0.1:5478 base-dlg4 /home/user/wt/w5tr-s/kettle/.tmp/LI/out dlg 375x667:dark:200,375x667:light:100,844x390:light:200,844x390:dark:100,1440x900:dark:200,390x844:dark:200,390x844:light:100 > LI-dlg-base4.log 2>&1; echo "exit $?" >> LI-dlg-base4.log
