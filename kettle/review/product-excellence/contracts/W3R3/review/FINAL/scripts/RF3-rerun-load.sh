#!/bin/bash
# RF3-rerun-load.sh <name> <port> [TZ]: the failing w3-notices-load case (844x390 dark 200 %), W3_LOAD=1, workers=1, one slot
source /home/user/Vibei/kettle/review/product-excellence/contracts/W3R3/review/FINAL/scripts/RF-common.sh
cd $W
if [ -n "$3" ]; then export TZ=$3; fi
W3_LOAD=1 pw "rerun-$1" 1 $2 1 tests/w3-notices-load.spec.ts --project=chromium -g '844×390 dark 200 %\)'
