#!/bin/bash
S=/tmp/claude-0/ln-scratch; cd /home/user/wt/w2t-n/kettle
SLOTS=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
TB=http://127.0.0.1:5350
run() { python3 -I $SLOTS run --lane LN --n 1 -- "$@" >> $S/chain8.log 2>&1; }
run node .tmp/LN/backdrop.mjs --base $TB --label trialN-morning-clear --extra "&nooktime=morning&nookweather=clear" --nolayers 1 --out $S/bd --cfgs 390x844@3:light:100 --groups off
run node .tmp/LN/backdrop.mjs --base $TB --label trialN-dusk-snow --extra "&nooktime=dusk&nookweather=snow" --nolayers 1 --out $S/bd --cfgs 390x844@3:light:100 --groups off
echo CHAIN8-DONE >> $S/chain8.log
