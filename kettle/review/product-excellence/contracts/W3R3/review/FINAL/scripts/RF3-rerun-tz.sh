#!/bin/bash
# control for integrity:543: same test, same server, only the browser's time zone changed (TZ env) so the local hour is not before 10:00
source /home/user/Vibei/kettle/review/product-excellence/contracts/W3R3/review/FINAL/scripts/RF-common.sh
cd $W
TZ=America/Los_Angeles pw rerun-F1-543-tzLA 1 5560 1 tests/integrity.spec.ts:543 --project=chromium
TZ=Asia/Tokyo pw rerun-F1-543-tzTokyo 1 5560 1 tests/integrity.spec.ts:543 --project=chromium
