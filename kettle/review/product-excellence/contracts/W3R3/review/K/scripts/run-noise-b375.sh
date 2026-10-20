#!/bin/bash
K=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R3/review/K
SC=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/w3r3
SL=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
python3 -I $SL run --lane K --n 1 -- node $K/scripts/states.mjs http://localhost:5560 $SC/before2 375x667 light normal
python3 -I $SL run --lane K --n 1 -- node $K/scripts/states.mjs http://localhost:5560 $SC/before2 390x844 dark t200
python3 -I $SL run --lane K --n 1 -- node $K/scripts/states.mjs http://localhost:5560 $SC/before2 1440x900 dark normal
echo DONE
