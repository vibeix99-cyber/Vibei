#!/bin/bash
S=/tmp/claude-0/ln-scratch; cd /home/user/wt/w2t-n/kettle
SLOTS=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
for seed in newbie celebrate; do
  python3 -I $SLOTS run --lane LN --n 1 -- node .tmp/LN/backdrop.mjs --base http://127.0.0.1:5350 --label trial-$seed --seed $seed --out $S/bd --cfgs 390x844@3:dark:100 --groups off,live >> $S/chain4.log 2>&1
done
echo CHAIN4-DONE >> $S/chain4.log
