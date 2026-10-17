#!/bin/bash
# the full chromium project without notice-strip.spec.ts on :5560, 2 workers (gate --n 2)
source /home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/review/FINAL/scripts/RF-common.sh
cd $W
SPECS=$(ls tests/*.spec.ts | grep -v -E '/(notice-strip|timer|pwa)\.spec\.ts$' | tr '\n' ' ')
echo $SPECS | tr ' ' '\n' > $E/runs/full-spec-list.txt
pw full 2 5560 2 $SPECS --project=chromium
echo done > $E/runs/full.done
