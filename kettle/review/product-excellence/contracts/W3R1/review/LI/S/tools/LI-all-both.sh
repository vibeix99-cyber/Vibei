#!/bin/sh
S="python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane LI --n 1 --"
cd /home/user/wt/w5tr-s/kettle/.tmp/LI
$S node LI-sheets.mjs http://127.0.0.1:5478 base-all /home/user/wt/w5tr-s/kettle/.tmp/LI/out all 375x667:light:200,1440x900:light:100,375x667:dark:200,1440x900:dark:200 > LI-all-base.log 2>&1; echo "exit $?" >> LI-all-base.log
$S node LI-sheets.mjs http://127.0.0.1:5522 trial-all /home/user/wt/w5tr-s/kettle/.tmp/LI/out all 375x667:light:200,1440x900:light:100,375x667:dark:200,1440x900:dark:200 > LI-all-trial.log 2>&1; echo "exit $?" >> LI-all-trial.log
