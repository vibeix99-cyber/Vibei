#!/bin/bash
# RF3-rerun.sh <name> <port> <file:line> : one failing test once, workers=1, one gate slot, own output dir
source /home/user/Vibei/kettle/review/product-excellence/contracts/W3R3/review/FINAL/scripts/RF-common.sh
cd $W; mkdir -p $E/rerun
pw "rerun-$1" 1 $2 1 "$3" --project=chromium
