#!/bin/bash
# R5-D1, CDP touch: control (R5, stop at first STRICT R5-D1 reproduction, <=15) then R7 (10 runs, waits spread so expiry lands before/during/after), per config; then one clip per config on R7
cd /home/user/wt/rv7-r7/kettle/.tmp/A
S="python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane A --n 1 --"
for c in "375x667 light 375L" "844x390 light 844L" "375x667 dark 375D"; do set -- $c
  $S ./one.sh r5d1-touch-ctl-$3 natural-a2.mjs 5302 GESTURE=touch STOP_ON_FAIL=1 -- {BASE} R5 {OUT} $1 $2 200 600,900,1200,1500,1800 3
  $S ./one.sh r5d1-touch-r7-$3 natural-a2.mjs 5301 GESTURE=touch -- {BASE} R7 {OUT} $1 $2 200 0,300,600,900,1200,1500,1800,2400,3000,4000 1
done
for c in "375x667 light 375L" "844x390 light 844L" "375x667 dark 375D"; do set -- $c
  $S ./one.sh r5d1-touch-r7clip-$3 natural-a2.mjs 5301 GESTURE=touch VIDEO=1 -- {BASE} R7clip {OUT} $1 $2 200 1200 1
done
echo CHAIN2 DONE $(date -u +%FT%TZ)
