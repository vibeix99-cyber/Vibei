#!/bin/bash
source /home/user/Vibei/kettle/review/product-excellence/contracts/W3R3/review/FINAL/scripts/RF-common.sh
cd $W
ONLY=844x390-dark-200 REP=3 W3_LOAD=1 pw rep-L1-844dark200x3 1 5560 1 tests/w3-notices-load.spec.ts --project=chromium
