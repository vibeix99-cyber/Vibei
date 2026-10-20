#!/bin/bash
K=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R3/review/K
SC=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/w3r3
SL=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
export K_AB_DIR=$SC/ab
g() { python3 -I $SL run --lane K --n 1 -- node $K/scripts/edges.mjs "$@"; }
for side in before after; do
  [ $side = before ] && base=http://localhost:5560 || base=http://localhost:5621
  g $base $side stage 1440x900 dark; g $base $side stage 390x844 dark; g $base $side stage 1440x900 light
done
echo DONE edgesS
