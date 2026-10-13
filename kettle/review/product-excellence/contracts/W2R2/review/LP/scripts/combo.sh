#!/bin/bash
# one gated job: sequential, one browser at a time
cd /home/user/wt/w3tr-p/kettle/.tmp/LP
L() { echo "$(date -u +%T) $*" >> /tmp/claude-0/lp-scratch/combo.log; }
L start
node lp-input.mjs --out /home/user/Vibei/kettle/review/product-excellence/contracts/W2R2/review/LP/check3b --base http://127.0.0.1:5452 --tag P --sessions A --cfgs "375x667@2:light:200,390x844@2:dark:100" > /tmp/claude-0/lp-scratch/check3b.out 2>&1; L check3b-P done
node lp-probe2.mjs --out /home/user/Vibei/kettle/review/product-excellence/contracts/W2R2/review/LP/check1m --cfgs "375x667@2:light:100,375x667@2:light:200" --days milestone --png "375x667-light-t100/milestone/settled,375x667-light-t200/milestone/settled" > /tmp/claude-0/lp-scratch/check1m.out 2>&1; L check1m done
node lp-probe2.mjs --out /home/user/Vibei/kettle/review/product-excellence/contracts/W2R2/review/LP/check4 --cfgs "844x390@2:light:100,667x375@2:light:100,1440x900@1:light:100,844x390@2:light:200,667x375@2:light:200,1440x900@1:light:200" --days big --png "1440x900-light-t100/big/settled" > /tmp/claude-0/lp-scratch/check4L.out 2>&1; L check4-light done
L spec skipped-for-time
node lp-kettle.mjs --out /home/user/Vibei/kettle/review/product-excellence/contracts/W2R2/review/LP/kettle --cfgs "375x667@2:light:100,390x844@2:light:100,375x667@2:light:200" > /tmp/claude-0/lp-scratch/kettle.out 2>&1; L kettle done
node lp-probe2.mjs --out /home/user/Vibei/kettle/review/product-excellence/contracts/W2R2/review/LP/check4 --cfgs "844x390@2:dark:100,844x390@2:dark:200,667x375@2:dark:100,667x375@2:dark:200,1440x900@1:dark:100,1440x900@1:dark:200" --days big > /tmp/claude-0/lp-scratch/check4D.out 2>&1; L check4-dark done
node lp-input.mjs --out /home/user/Vibei/kettle/review/product-excellence/contracts/W2R2/review/LP/check3b --base http://127.0.0.1:5430 --tag C --sessions A --cfgs "375x667@2:light:200,390x844@2:dark:100" > /tmp/claude-0/lp-scratch/check3bC.out 2>&1; L check3b-C done
L all-done
