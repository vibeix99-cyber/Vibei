#!/bin/bash
# chain.sh <label> <base> -- runs the backdrop probe per config through the slot gate, one browser each
label=$1; base=$2; S=/tmp/claude-0/ln-scratch
cd /home/user/wt/w2t-n/kettle
SLOTS=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
for cfg in 375x667@2:light:100 844x390@3:light:100 1440x900@2:light:100 390x844@3:dark:100 375x667@2:dark:100 844x390@3:dark:100 1440x900@2:dark:100 375x667@2:light:200 375x667@2:dark:200 844x390@3:light:200 844x390@3:dark:200; do
  g=off,live; case "$cfg" in *light:100) g=off,live,loading;; esac
  python3 -I $SLOTS run --lane LN --n 1 -- node .tmp/LN/backdrop.mjs --base $base --label $label --out $S/bd --cfgs $cfg --groups $g >> $S/chain-$label.log 2>&1
done
echo CHAIN-DONE >> $S/chain-$label.log
