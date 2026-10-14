#!/bin/sh
S="python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane LI --n 1 --"
cd /home/user/wt/w5tr-s/kettle/.tmp/LI
$S node LI-words.mjs http://127.0.0.1:5522 trial /home/user/wt/w5tr-s/kettle/.tmp/LI/out/words > LI-words-trial.log 2>&1; echo "exit $?" >> LI-words-trial.log
$S node LI-words.mjs http://127.0.0.1:5478 base /home/user/wt/w5tr-s/kettle/.tmp/LI/out/words > LI-words-base.log 2>&1; echo "exit $?" >> LI-words-base.log
