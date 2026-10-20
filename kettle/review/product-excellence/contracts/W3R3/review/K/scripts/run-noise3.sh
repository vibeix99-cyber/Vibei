#!/bin/bash
# Noise floor for the final (3x settle) capture of the animated flow states: BEFORE and AFTER each recaptured once more, serial, alternating.
K=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R3/review/K
SC=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/w3r3
SL=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
S=focus-running,home-live,focus-paused,focus-break,home-break
g() { side=$1; shift; [ $side = before ] && base=http://localhost:5560 || base=http://localhost:5621
  K_SETTLE=3 python3 -I $SL run --lane K --n 1 -- node $K/scripts/states.mjs $base $SC/${side}3 "$@" $S; }
for cv in "1440x900 dark normal" "1440x900 light normal" "390x844 light normal" "390x844 dark normal" "375x667 light normal" "390x844 light rm"; do
  g before $cv; g after $cv
done
echo DONE noise3
