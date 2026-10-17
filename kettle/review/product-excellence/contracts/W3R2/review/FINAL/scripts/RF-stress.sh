#!/bin/bash
source /home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/review/FINAL/scripts/RF-common.sh
cd $W
gated stress 2 bash $E/scripts/RF-stress-inner.sh
echo done > $E/runs/stress.done
