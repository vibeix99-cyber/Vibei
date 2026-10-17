#!/bin/bash
# chain X (one slot per job): the 2-tab check on the fix :5591 and the control :5560, then item 3, item 4 (w2-home), item 2
source /home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/review/R2/scripts/R2-common.sh
cd $W
cp $E/scripts/R2-2tab.mjs $W/.tmp/R2-2tab.mjs
gated manual-2tab-5591 1 node .tmp/R2-2tab.mjs fix-5591 http://127.0.0.1:5591 5 $E/manual a,b,c,d,e
gated manual-2tab-5560 1 node .tmp/R2-2tab.mjs control-5560 http://127.0.0.1:5560 5 $E/manual a,b,c,d,e
pw integrity-5591 1 5591 1 tests/integrity.spec.ts --project=chromium
pw integrity309-x10-5591 1 5591 1 tests/integrity.spec.ts -g 'two tabs, the leading one frozen across the end' --project=chromium --repeat-each=10
pw w2-home-5591 1 5591 1 tests/w2-home.spec.ts --project=chromium
pw timer-pwa-5591 1 5591 1 --project=timer-harness --project=timer-app --project=pwa
echo done > $E/runs/chainX.done
