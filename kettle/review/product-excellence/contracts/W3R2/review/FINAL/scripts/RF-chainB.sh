#!/bin/bash
# chain B (one slot each): notice-strip whole, w3-notices-load with W3_LOAD=1, then timer-harness/timer-app/pwa on a verified-free port
source /home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/review/FINAL/scripts/RF-common.sh
cd $W
pw notice-strip 1 5560 1 tests/notice-strip.spec.ts --project=chromium
echo done > $E/runs/notice-strip.done
W3_LOAD=1 pw w3-notices-load 1 5560 1 tests/w3-notices-load.spec.ts --project=chromium
echo done > $E/runs/w3-notices-load.done
