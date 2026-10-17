#!/bin/bash
# smoke test of the 2-tab script (1 iteration of each case on the trial), through the gate
source /home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/review/R2/scripts/R2-common.sh
cd $W
gated smoke-2tab-5591 1 node .tmp/R2-2tab.mjs smoke http://127.0.0.1:5591 1 $E/manual/smoke a,b,c,d,e
