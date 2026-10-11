#!/bin/bash
cd /home/user/wt/rv7-r7/kettle
echo "[$(date -u +%T)] std set start"
.tmp/D/std2.sh /tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/r7/D/run2/std 390:844:2:light 390:844:2:dark 375:667:2:light 375:667:2:dark 1440:900:1:light 1440:900:1:dark 390:844:2:dark:rm
echo "[$(date -u +%T)] cap-d T profile start"
node .tmp/D/cap-d.mjs --profiles T --cfgs 1440x900@1:light:200,1440x900@1:dark:200,375x667@2:dark:200,390x844@2:dark:200 --root /home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/D/captures
echo "[$(date -u +%T)] capjob end"
