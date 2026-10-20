#!/bin/bash
source /home/user/Vibei/kettle/review/product-excellence/contracts/W3R3/review/FINAL/scripts/RF-common.sh
gated timer-pwa 1 bash $E/scripts/RF-pwa-inner.sh
echo done > $E/runs/timer-pwa.done
