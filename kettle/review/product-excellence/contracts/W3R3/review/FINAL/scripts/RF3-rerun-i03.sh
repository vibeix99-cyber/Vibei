#!/bin/bash
source /home/user/Vibei/kettle/review/product-excellence/contracts/W3R3/review/FINAL/scripts/RF-common.sh
cd $W
pw rerun-F2-i03-phone390 1 5560 1 tests/integrity.spec.ts:1048 --project=chromium -g 'phone 390'
