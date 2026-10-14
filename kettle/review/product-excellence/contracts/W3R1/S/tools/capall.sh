#!/bin/bash
# BEFORE (base :5478) and AFTER (candidate :5502) captures. One slot job = one side × one size (4 configs: light/dark ×
# 100/200 %), one browser at a time inside it (so --n 1 is exact).
# capall.sh <outroot> [size ...]
cd /home/user/wt/w5s/kettle
OUT=$1; shift
SIZES=${@:-"375x667 390x844 844x390 1440x900"}
G="python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane S --n 1 --"
T=review/product-excellence/contracts/W3R1/S/tools/statscap.mjs
for sz in $SIZES; do
  for side in after:5502 before:5478; do
    cmd=""
    for c in $sz:light:100 $sz:dark:100 $sz:light:200 $sz:dark:200; do
      full=0; case $c in 390x844:*:100|1440x900:*:100) full=1;; esac
      cmd="$cmd node $T --base http://127.0.0.1:${side#*:} --out $OUT/${side%%:*} --cfg $c --full $full;"
    done
    $G sh -c "$cmd" 2>&1 | grep -v "^\[slots\]"
  done
done
echo CAPALL DONE
