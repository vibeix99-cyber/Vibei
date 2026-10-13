#!/bin/bash
# Lane R (W2R2): second take of selected states with the same tool/preload (noise baseline): <side> <cfg> <only-list>, sequential, one gate slot.
OUT=/tmp/claude-0/lr2-scratch/cap2
TOOL=/home/user/Vibei/kettle/review/product-excellence/tools/capture.mjs
run() {
  SIDE=$1; cfg=$2; ONLY=$3
  if [ $SIDE = trial ]; then BASE=http://127.0.0.1:5445; WT=/home/user/wt/w3tr-pc/kettle; else BASE=http://127.0.0.1:5410; WT=/home/user/wt/w3-base/kettle; fi
  IFS=: read -r W H DPR TH <<< "$cfg"; tag="${W}x${H}@${DPR}-${TH}"
  mkdir -p "$OUT/$SIDE/$tag"
  echo "[$(date -u +%T)] $SIDE $tag only=$ONLY start"
  (cd $WT && node --import ./.tmp/LR/std-freeze.mjs $TOOL --base $BASE --out "$OUT/$SIDE/$tag" --w $W --h $H --dpr $DPR --theme $TH --only $ONLY) > "$OUT/$SIDE/$tag/run.log" 2>&1
  echo "[$(date -u +%T)] $SIDE $tag only=$ONLY exit $?"
}
for item in "390:844:2:dark 19" "1440:900:1:dark 17,18" "375:667:2:dark 02,04,05,06,09" "1440:900:1:dark 09,10,11b"; do
  set -- $item
  run ctrl $1 $2
  run trial $1 $2
done
