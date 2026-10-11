#!/bin/bash
# Lane 2: recheck of std state 09-break at 1440x900@1 light (capture.mjs --only 09, same preload), R8 and INT side by side.
T=/home/user/wt/r8-trial/kettle/review/product-excellence/tools/capture.mjs; P=/home/user/wt/r8-trial/kettle/.tmp/L2/std-freeze.mjs
(cd /home/user/wt/r8-trial/kettle && node --import $P $T --base http://127.0.0.1:5306 --out /tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/r8/L2/std-recheck/R8/1440x900@1-light --w 1440 --h 900 --dpr 1 --theme light --only 09) > /tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/r8/L2/logs/recheck09-R8.log 2>&1 &
(cd /home/user/wt/rv7-int/kettle && node --import $P $T --base http://127.0.0.1:5303 --out /tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/r8/L2/std-recheck/INT/1440x900@1-light --w 1440 --h 900 --dpr 1 --theme light --only 09) > /tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/r8/L2/logs/recheck09-INT.log 2>&1 &
wait
