#!/bin/bash
source /home/user/Vibei/kettle/review/product-excellence/contracts/W3R3/review/FINAL/scripts/RF-common.sh
cd $W; mkdir -p $E/console
gated offline-preview5570 1 node $E/scripts/RF3-offline.mjs preview5570 http://127.0.0.1:5570 $E/console
echo done > $E/runs/offline.done
