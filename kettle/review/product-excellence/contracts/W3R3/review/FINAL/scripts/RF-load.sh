#!/bin/bash
source /home/user/Vibei/kettle/review/product-excellence/contracts/W3R3/review/FINAL/scripts/RF-common.sh
cd $W
W3_LOAD=1 pw w3-notices-load 1 5560 1 tests/w3-notices-load.spec.ts --project=chromium
echo done > $E/runs/w3-notices-load.done
