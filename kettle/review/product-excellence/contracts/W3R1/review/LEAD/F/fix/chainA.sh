#!/bin/bash
# LEAD-5 · F fix: probes on the fix trial :5528 (aimed taps, fling), then X-8 base vs fix. One browser at a time.
cd /home/user/wt/w5tr-f/kettle/.tmp/LI2
echo "== A start $(date -u +%T) load $(cut -d' ' -f1-3 /proc/loadavg)"
node LI2-probe2.mjs LEADFIX http://127.0.0.1:5528 /home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/LEAD/F/fix/probes2 '' L1,L2 > /home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/LEAD/F/fix/probes2.log 2>&1; echo "probe2 exit $?"
node LI2-idle3.mjs LEADFIX http://127.0.0.1:5528 /home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/LEAD/F/fix/idle3 above 390x844 > /home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/LEAD/F/fix/idle3-above.log 2>&1; echo "idle3 exit $?"
node /home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/LEAD/F/fix/lead-x8.mjs http://127.0.0.1:5478 BASE /home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/LEAD/F/fix/x8 3 > /home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/LEAD/F/fix/x8-base.log 2>&1; echo "x8 base exit $?"
node /home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/LEAD/F/fix/lead-x8.mjs http://127.0.0.1:5528 FIX /home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/LEAD/F/fix/x8 3 > /home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/LEAD/F/fix/x8-fix.log 2>&1; echo "x8 fix exit $?"
echo "== A end $(date -u +%T)"
