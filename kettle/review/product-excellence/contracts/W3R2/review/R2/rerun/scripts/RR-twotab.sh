#!/bin/bash
# the 2-tab check with real clicks on trial 2 :5601; new/changed cases first (g, e, f), then a, b, c, d; 5 iterations each. One gate slot.
source /home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/review/R2/rerun/scripts/RR-common.sh
cd $W
cp $E/scripts/RR-2tab.mjs $W/.tmp/RR-2tab.mjs
{ echo "### start $(date -u +%H:%M:%S) UTC; load: $(uptime)"; echo "### cmd: node .tmp/RR-2tab.mjs trial2-5601 http://127.0.0.1:5601 5 $E/manual g,e,f,a,b,c,d"; node .tmp/RR-2tab.mjs trial2-5601 http://127.0.0.1:5601 5 $E/manual g,e,f,a,b,c,d; echo "### end $(date -u +%H:%M:%S) UTC; exit=$?; load: $(uptime)"; } > $E/runs/manual-2tab-5601.log.txt 2>&1
echo done > $E/runs/twotab.done
