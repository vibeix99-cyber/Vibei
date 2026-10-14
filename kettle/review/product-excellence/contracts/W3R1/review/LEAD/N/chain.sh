#!/bin/bash
# LEAD-4 · W3R1 N: my captures, one slot-gated job at a time (base dev :5478 = 4d36939; trial dev :5524 = 46f33e2)
S=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
D=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/LEAD/N
G="python3 -I $S run --lane LEAD --n 1 --"
PH=390x844@3:light:default:day,390x844@3:light:default:dusk,390x844@3:light:default:night,390x844@3:dark:default:dusk,390x844@3:dark:default:night
DK=1440x900@2:light:high:day:close,1440x900@2:light:high:dusk:close,1440x900@2:light:high:night:close,1440x900@2:dark:high:dusk:close,1440x900@2:dark:high:night:close,1440x900@2:dark:default:night:close
$G node $D/lead-n.mjs --base http://127.0.0.1:5524 --label TRIAL-phone --out $D/shots/TRIAL --cfgs $PH > $D/runs/TRIAL-phone.log 2>&1; echo "trial phone $?"
$G node $D/lead-n.mjs --base http://127.0.0.1:5478 --label BASE-phone --out $D/shots/BASE --cfgs $PH > $D/runs/BASE-phone.log 2>&1; echo "base phone $?"
$G node $D/lead-n.mjs --base http://127.0.0.1:5524 --label TRIAL-1440 --out $D/shots/TRIAL --cfgs $DK > $D/runs/TRIAL-1440.log 2>&1; echo "trial 1440 $?"
$G node $D/lead-n.mjs --base http://127.0.0.1:5478 --label BASE-1440 --out $D/shots/BASE --cfgs $DK > $D/runs/BASE-1440.log 2>&1; echo "base 1440 $?"
echo CHAIN-DONE
