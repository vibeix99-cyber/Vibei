#!/bin/sh
S="python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane LI --n 1 --"
cd /home/user/wt/w5tr-s/kettle/.tmp/LI
$S node LI-sheets.mjs http://127.0.0.1:5522 trial-dlg-r2 /home/user/wt/w5tr-s/kettle/.tmp/LI/out dlg 1440x900:light:100,1440x900:light:200,1440x900:dark:100,1440x900:dark:200,390x844:light:200,375x667:light:200 > LI-dlg-trial-r2.log 2>&1; echo "exit $?" >> LI-dlg-trial-r2.log
$S node LI-sheets.mjs http://127.0.0.1:5478 base-dlg-r2 /home/user/wt/w5tr-s/kettle/.tmp/LI/out dlg 1440x900:light:100,1440x900:light:200,375x667:light:200 > LI-dlg-base-r2.log 2>&1; echo "exit $?" >> LI-dlg-base-r2.log
