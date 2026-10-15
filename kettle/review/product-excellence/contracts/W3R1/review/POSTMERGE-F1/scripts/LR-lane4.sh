#!/bin/bash
# lane 4: loaded S1 and S2 again with a longer typing wait (the first loaded cells gave up typing in tab B 5 of 6 and 3 of 6 times)
source /home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/POSTMERGE-F1/scripts/LR-common.sh
cd $W
cp $E/scripts/LR-manual.mjs $W/.tmp/LR-manual.mjs
gated manual-2tab-loaded-slowtype 1 bash -c "for sc in S1 S2; do TYPE_TIMEOUT_MS=8000 node .tmp/LR-manual.mjs int-5560 http://127.0.0.1:5560 6 loaded $E/manual-loaded-slowtype \$sc; done"
echo done > $E/runs/lane4.done
