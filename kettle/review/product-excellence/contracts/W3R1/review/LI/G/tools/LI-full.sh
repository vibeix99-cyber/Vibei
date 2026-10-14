#!/bin/sh
# Lane I: full audit, trial first then base (each its own slot job).
S="python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane LI --n 1 --"
cd /home/user/wt/w5tr-g/kettle/.tmp/LI
$S node LI-audit.mjs http://127.0.0.1:5533 trial /home/user/wt/w5tr-g/kettle/.tmp/LI/LI-out persist,focus,fc,states,settings > LI-full-trial.log 2>&1; echo "exit $?" >> LI-full-trial.log
$S node LI-audit.mjs http://127.0.0.1:5488 base /home/user/wt/w5tr-g/kettle/.tmp/LI/LI-out persist,focus,fc,states,settings > LI-full-base.log 2>&1; echo "exit $?" >> LI-full-base.log
