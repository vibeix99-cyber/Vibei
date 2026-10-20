#!/bin/bash
# the 2-tab check with real clicks on :5560 (merged tree), cases g,e,f,a,b,c,d, 3 iterations each, one gate slot
source /home/user/Vibei/kettle/review/product-excellence/contracts/W3R3/review/FINAL/scripts/RF-common.sh
LABEL=${1:-rf-5560}; PORT=${2:-5560}; N=${3:-3}; CASES=${4:-g,e,f,a,b,c,d}
cd $W
mkdir -p $E/manual
cp $E/scripts/RF-2tab.mjs $W/.tmp/RF-2tab.mjs
gated manual-2tab-$LABEL 1 node .tmp/RF-2tab.mjs $LABEL http://127.0.0.1:$PORT $N $E/manual $CASES
echo done > $E/runs/twotab-$LABEL.done
