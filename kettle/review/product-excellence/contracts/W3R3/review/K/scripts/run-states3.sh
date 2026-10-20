#!/bin/bash
# Final recapture of the animated flow states, strictly serial and alternating BEFORE/AFTER per config (same load for both sides), 3x settle.
K=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R3/review/K
SL=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
S=focus-running,home-live,focus-paused,focus-break,home-break
g() { side=$1; shift; [ $side = before ] && base=http://localhost:5560 || base=http://localhost:5621
  K_SETTLE=3 python3 -I $SL run --lane K --n 1 -- node $K/scripts/states.mjs $base $K/shots/$side "$@" $S; }
for cv in "1440x900 dark normal" "1440x900 light normal" "390x844 light normal" "390x844 dark normal" "375x667 light normal" "375x667 dark normal" "390x844 dark t200" "390x844 light t200" "390x844 light rm"; do
  g before $cv; g after $cv
done
echo DONE states3
