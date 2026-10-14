#!/bin/bash
cd /home/user/wt/w4tr-t2f/kettle
F=/home/user/Vibei/kettle/review/product-excellence/contracts/W2R3/review/LT/fix2
echo "P1 control start $(date -u +%T)"
node .tmp/LT/sumprobe.mjs --base http://127.0.0.1:5476 --out $F/probes/sum-490ca97 --cfgs 375x667:light:100,375x667:light:200,390x844:light:100 --days task --cases none,adebug,c --par 3 2>&1
echo "P1 fix start $(date -u +%T)"
node .tmp/LT/sumprobe.mjs --base http://127.0.0.1:5477 --out $F/probes/sum-fix-ctl --cfgs 375x667:light:100,375x667:light:200,390x844:light:100 --days task --cases none,adebug,c --par 3 2>&1
echo "P1 fix-areal start $(date -u +%T)"
node .tmp/LT/sumprobe.mjs --base http://127.0.0.1:5477 --out $F/probes/sum-fix --cfgs 375x667:light:200,390x844:dark:100,844x390:light:200,1440x900:light:100 --days task --cases areal --par 3 2>&1
echo "P2 captures start $(date -u +%T)"
for B in 5470 5476 5477; do node .tmp/LT/sumprobe.mjs --base http://127.0.0.1:$B --out $F/shots/$B --cfgs 375x667:light:200,390x844:dark:100,1440x900:light:100 --days task --cases adebug --par 3 --shots 1 2>&1; done
echo "P1 matrix start $(date -u +%T)"
node .tmp/LT/sumprobe.mjs --base http://127.0.0.1:5477 --out $F/probes/sum-fix --cfgs 375x667:dark:100,375x667:dark:200,390x844:light:200,390x844:dark:100,390x844:dark:200,844x390:light:100,844x390:light:200,844x390:dark:100,844x390:dark:200,667x375:light:100,667x375:light:200,667x375:dark:100,667x375:dark:200,1440x900:light:100,1440x900:light:200,1440x900:dark:100,1440x900:dark:200,375x667:light:100,375x667:light:200,390x844:light:100 --days task,big --cases none,adebug,b,c --par 3 2>&1
echo "P3 ltprobe start $(date -u +%T)"
node .tmp/LT/ltprobe.mjs --base http://127.0.0.1:5477 --out $F/probes/inv-fix --par 3 --cfgs "375x667:light:200,844x390:light:200,667x375:light:200,390x844:light:200,375x667:dark:200,844x390:dark:200,667x375:dark:200,390x844:dark:200,1440x900:light:200,1440x900:dark:100" --groups home,end,break,nextbrew,stats,import,update,queue 2>&1
echo "chain end $(date -u +%T)"
echo "P1 areal2 start $(date -u +%T)"
node .tmp/LT/sumprobe.mjs --base http://127.0.0.1:5477 --out $F/probes/sum-fix-areal2 --cfgs 375x667:light:200,390x844:dark:100,844x390:light:200,1440x900:light:100 --days task --cases areal --par 3 2>&1
echo "chain2 end $(date -u +%T)"
echo "P2b base 375x667@200 capture retry start $(date -u +%T)"
node .tmp/LT/sumprobe.mjs --base http://127.0.0.1:5470 --out $F/shots/5470-retry --cfgs 375x667:light:200 --days task --cases adebug,none --par 2 --shots 1 2>&1
echo "chain3 end $(date -u +%T)"
echo "P2c captures with the next-screen notice drawn start $(date -u +%T)"
for B in 5470 5476 5477; do node .tmp/LT/sumprobe.mjs --base http://127.0.0.1:$B --out $F/shots/$B-next --cfgs 375x667:light:200,390x844:dark:100,1440x900:light:100 --days task --cases adebug --par 3 --shots 1 2>&1; done
node .tmp/LT/sumprobe.mjs --base http://127.0.0.1:5477 --out $F/shots/5477-today --cfgs 375x667:light:200,390x844:dark:100,1440x900:light:100 --days task --cases b --par 3 --shots 1 2>&1
echo "chain4 end $(date -u +%T)"
echo "P1 wheel start $(date -u +%T)"
node .tmp/LT/sumprobe.mjs --base http://127.0.0.1:5477 --out $F/probes/sum-fix-wheel --cfgs 844x390:light:200,844x390:dark:200,667x375:light:200,667x375:dark:200 --days task --cases adebug --par 3 --wheel 1 2>&1
echo "chain5 end $(date -u +%T)"
echo "P3b import classify start $(date -u +%T)"
node .tmp/LT/ltprobe.mjs --base http://127.0.0.1:5477 --base2 http://127.0.0.1:5476 --out $F/probes/inv-fix-import2 --par 2 --cfgs "667x375:light:200/import,667x375:dark:200/import,667x375:light:200@B/import" 2>&1
echo "chain6 end $(date -u +%T)"
echo "P2d base 375x667@200 capture, cases c and b start $(date -u +%T)"
node .tmp/LT/sumprobe.mjs --base http://127.0.0.1:5470 --out $F/shots/5470-c --cfgs 375x667:light:200 --days task --cases c,b --par 2 --shots 1 2>&1
echo "chain7 end $(date -u +%T)"
