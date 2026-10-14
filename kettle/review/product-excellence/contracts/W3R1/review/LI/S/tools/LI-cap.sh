#!/bin/sh
S="python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane LI --n 1 --"
cd /home/user/wt/w5tr-s/kettle/.tmp/LI
$S node LI-cap.mjs http://127.0.0.1:5478 BEFORE-base-4d36939 /home/user/wt/w5tr-s/kettle/.tmp/LI/out/cap > LI-cap-base.log 2>&1; echo "exit $?" >> LI-cap-base.log
$S node LI-cap.mjs http://127.0.0.1:5522 AFTER-trial-c7a6b8f /home/user/wt/w5tr-s/kettle/.tmp/LI/out/cap > LI-cap-trial.log 2>&1; echo "exit $?" >> LI-cap-trial.log
