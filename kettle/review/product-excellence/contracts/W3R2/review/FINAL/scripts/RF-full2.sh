#!/bin/bash
# extra: the full chromium project without notice-strip a second time, alone on the machine (nothing else of mine running), :5560, 2 workers
source /home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/review/FINAL/scripts/RF-common.sh
cd $W
SPECS=$(ls tests/*.spec.ts | grep -v -E '/(notice-strip|timer|pwa)\.spec\.ts$' | tr '\n' ' ')
pw full2 2 5560 2 $SPECS --project=chromium
echo done > $E/runs/full2.done
