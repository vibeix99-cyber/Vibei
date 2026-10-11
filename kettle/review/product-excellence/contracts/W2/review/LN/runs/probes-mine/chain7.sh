#!/bin/bash
S=/tmp/claude-0/ln-scratch; cd /home/user/wt/w2t-n/kettle
SLOTS=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
TB=http://127.0.0.1:5350
run() { python3 -I $SLOTS run --lane LN --n 1 -- "$@" >> $S/chain7.log 2>&1; }
run node .tmp/LN/backdrop.mjs --base $TB --label trialHQ-night-rain --extra "&nookq=high" --nolayers 1 --out $S/bd --cfgs 390x844@3:dark:100 --groups off,live
run node .tmp/LN/backdrop.mjs --base $TB --label trialHQ-day-rain --extra "&nookq=high" --nolayers 1 --out $S/bd --cfgs 390x844@3:light:100 --groups off,live
run node .tmp/LN/backdrop.mjs --base $TB --label trialHQ-morning-clear --extra "&nookq=high&nooktime=morning&nookweather=clear" --nolayers 1 --out $S/bd --cfgs 390x844@3:light:100 --groups off,live
run node .tmp/LN/backdrop.mjs --base $TB --label trialHQ-dusk-snow --extra "&nookq=high&nooktime=dusk&nookweather=snow" --nolayers 1 --out $S/bd --cfgs 390x844@3:light:100 --groups off,live
echo CHAIN7-DONE >> $S/chain7.log
