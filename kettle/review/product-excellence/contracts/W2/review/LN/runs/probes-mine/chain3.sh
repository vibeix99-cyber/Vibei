#!/bin/bash
S=/tmp/claude-0/ln-scratch; cd /home/user/wt/w2t-n/kettle
SLOTS=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
for pair in ctrl:http://127.0.0.1:5330 trial:http://127.0.0.1:5350 ctrldev:http://127.0.0.1:5310 trialdev:http://127.0.0.1:5340; do
  lab=${pair%%:*}; base=${pair#*:}
  python3 -I $SLOTS run --lane LN --n 1 -- node .tmp/LN/net.mjs --base $base --label $lab --out $S/net >> $S/chain3.log 2>&1
done
echo CHAIN3-DONE >> $S/chain3.log
