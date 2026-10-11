#!/bin/bash
# R5-D1 timing variant on R7: older toasts expire BEFORE the gesture (PRE delay). Descriptive; no control possible by construction.
cd /home/user/wt/rv7-r7/kettle/.tmp/A
S="python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane A --n 1 --"
for c in "375x667 light 375L" "844x390 light 844L" "375x667 dark 375D"; do set -- $c
  for pre in 2600 3000 3400 4000; do $S ./one.sh r5d1-wheel-r7pre-$3 natural-a3.mjs 5301 GESTURE=wheel PRE=$pre -- {BASE} R7pre {OUT} $1 $2 200 1200 1; done
  for pre in 3000 4000; do $S ./one.sh r5d1-touch-r7pre-$3 natural-a3.mjs 5301 GESTURE=touch PRE=$pre -- {BASE} R7pre {OUT} $1 $2 200 1200 1; done
done
echo CHAIN6 DONE $(date -u +%FT%TZ)
