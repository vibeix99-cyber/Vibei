#!/bin/bash
source /home/user/Vibei/kettle/review/product-excellence/contracts/W3R3/review/FINAL/scripts/RF-common.sh
cd $W
pw notice-strip 1 5560 1 tests/notice-strip.spec.ts --project=chromium
echo done > $E/runs/notice-strip.done
