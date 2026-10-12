#!/bin/bash
S=/tmp/claude-0/ln-scratch/fix; cd /home/user/wt/w2t-n/kettle
SL=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
run() { python3 -I $SL run --lane LN --n 1 -- "$@" >> $S/chainA.log 2>&1; }
for cfg in 390x844@3:light:100 375x667@2:dark:100; do
  for pair in fxc:http://127.0.0.1:5350 fxf:http://127.0.0.1:5356; do
    lab=${pair%%:*}; base=${pair#*:}
    run node .tmp/LN/backdrop.mjs --base $base --label $lab --out $S/acc --cfgs $cfg --groups off,loading
  done
done
for cfg in 390x844@3:light:100 375x667@2:dark:100; do
  for pair in fxc:http://127.0.0.1:5350 fxf:http://127.0.0.1:5356; do
    lab=${pair%%:*}; base=${pair#*:}
    run node .tmp/LN/room2.mjs --base $base --label $lab --out $S/acc2 --cfgs $cfg --groups static,nowebgl,unlock
  done
done
echo CHAINA-DONE >> $S/chainA.log
