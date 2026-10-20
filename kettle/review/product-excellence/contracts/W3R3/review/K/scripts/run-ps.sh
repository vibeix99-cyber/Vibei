#!/bin/bash
# run-ps.sh : pose-switch flow, both sides, 390x844 + 1440x900, light + dark; DPR1 (frames), DPR1 reduced motion (trace), DPR2 (ink at 0.5 css px).
K=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R3/review/K
SC=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/w3r3
SL=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
export K_AB_DIR=$SC/ab; mkdir -p $K/json/ps
g() { python3 -I $SL run --lane K --n 1 -- node $K/scripts/poseswitch.mjs "$@"; }
for cfg in 390x844 1440x900; do for th in light dark; do for side in before after; do
  [ $side = before ] && base=http://localhost:5560 || base=http://localhost:5621
  fd=$SC/frames/$side-$cfg-$th; mkdir -p $fd
  g $base $side $cfg $th 1 full $K/json/ps/$side-$cfg-$th-d1-full.json $fd
  g $base $side $cfg $th 1 reduce $K/json/ps/$side-$cfg-$th-d1-reduce.json
  g $base $side $cfg $th 2 full $K/json/ps/$side-$cfg-$th-d2-full.json
done; done; done
echo DONE ps
