#!/bin/bash
cd /home/user/wt/rv7-r7/kettle
date -u +"start %T"
python3 -I /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py run --lane D --n 1 -- .tmp/D/std-captures.sh /tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/r7/D/std 390:844:2:light 390:844:2:dark 375:667:2:light 375:667:2:dark 1440:900:1:light 1440:900:1:dark 390:844:2:dark:rm
echo "exit $?"; date -u +"end %T"
