#!/bin/bash
# AFTER recaptured once (subset) into a scratch dir (not committed): the AFTER noise floor for the BEFORE/AFTER pixel diff.
K=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R3/review/K
SC=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/w3r3
SL=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
g() { python3 -I $SL run --lane K --n 1 -- node $K/scripts/states.mjs http://localhost:5621 $SC/after2 "$@"; }
g 390x844 light normal; g 390x844 dark normal; g 1440x900 light normal; g 375x667 dark normal; g 375x667 light normal; g 390x844 light t200; g 390x844 light rm
echo DONE noise2
