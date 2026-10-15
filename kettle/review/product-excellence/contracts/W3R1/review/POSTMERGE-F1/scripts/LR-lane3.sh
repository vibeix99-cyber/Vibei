#!/bin/bash
# lane 3 (one slot per job): the 2-tab manual checks on :5560. quiet = no CPU throttling (the machine itself is loaded by the other jobs).
source /home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/POSTMERGE-F1/scripts/LR-common.sh
cd $W
cp $E/scripts/LR-manual.mjs $W/.tmp/LR-manual.mjs
gated manual-2tab-quiet 1 bash -c "for sc in LEN S1 S2 S0; do node .tmp/LR-manual.mjs int-5560 http://127.0.0.1:5560 6 quiet $E/manual \$sc; done"
gated manual-2tab-loaded 1 bash -c "for sc in LEN S1 S2; do node .tmp/LR-manual.mjs int-5560 http://127.0.0.1:5560 6 loaded $E/manual \$sc; done"
echo done > $E/runs/lane3.done
