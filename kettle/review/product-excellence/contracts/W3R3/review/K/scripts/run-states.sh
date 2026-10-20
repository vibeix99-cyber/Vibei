#!/bin/bash
# run-states.sh <before|after> : the full state matrix for one side, each node run through the slot gate (1 slot).
K=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R3/review/K
SL=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
side=$1; [ $side = before ] && base=http://localhost:5560 || base=http://localhost:5621
g() { python3 -I $SL run --lane K --n 1 -- node $K/scripts/states.mjs $base $K/shots/$side "$@"; }
for cfg in 390x844 375x667 1440x900; do for th in light dark; do g $cfg $th normal; done; done
for th in light dark; do g 390x844 $th t200; done
g 390x844 light rm
echo DONE $side
