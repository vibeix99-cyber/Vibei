#!/bin/bash
# optional control: case (g) Next brew on :5560 (no guard), 5 iterations, trial 2's script
source /home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/review/R2/rerun/scripts/RR-common.sh
cd $W
cp $E/scripts/RR-2tab.mjs $W/.tmp/RR-2tab-g.mjs
{ echo "### start $(date -u +%H:%M:%S) UTC; load: $(uptime)"; echo "### cmd: node .tmp/RR-2tab-g.mjs g-5560-control http://127.0.0.1:5560 5 $E/manual g"; node .tmp/RR-2tab-g.mjs g-5560-control http://127.0.0.1:5560 5 $E/manual g; echo "### end $(date -u +%H:%M:%S) UTC; exit=$?; load: $(uptime)"; } > $E/runs/manual-2tab-5560-g.log.txt 2>&1
echo done > $E/runs/gctl.done
