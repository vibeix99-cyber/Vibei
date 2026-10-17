#!/bin/bash
source /home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/review/FINAL/scripts/RF-common.sh
gated rerun-N-I03-with-neighbor 2 bash $E/scripts/RF-neighbor-inner.sh
echo done > $E/runs/neighbor.done
