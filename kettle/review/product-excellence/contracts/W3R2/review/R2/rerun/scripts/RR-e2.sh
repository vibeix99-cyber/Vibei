#!/bin/bash
# case (e) again on trial 2 :5601 with a strict note observer (the first run's observer also matched the normal meta line "N min brewed · whistles at ...")
source /home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/review/R2/rerun/scripts/RR-common.sh
cd $W
cp $E/scripts/RR-2tab.mjs $W/.tmp/RR-2tab-e2.mjs
{ echo "### start $(date -u +%H:%M:%S) UTC; load: $(uptime)"; echo "### cmd: node .tmp/RR-2tab-e2.mjs e2-5601 http://127.0.0.1:5601 5 $E/manual e"; node .tmp/RR-2tab-e2.mjs e2-5601 http://127.0.0.1:5601 5 $E/manual e; echo "### end $(date -u +%H:%M:%S) UTC; exit=$?; load: $(uptime)"; } > $E/runs/manual-2tab-5601-e2.log.txt 2>&1
echo done > $E/runs/e2.done
