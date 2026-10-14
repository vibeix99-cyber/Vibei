#!/bin/bash
# LR-capsolo.sh <W:H:DPR:theme> <ids...>: the screens that follow another screen in the standard capture (16..19), each alone in its own page, so no leaving layer is under the frame
CAP=/home/user/wt/w5tr-all/kettle/.tmp/LR-cap
TOOL=/home/user/Vibei/kettle/review/product-excellence/tools/capture.mjs
PRE=/home/user/wt/w5tr-all/kettle/.tmp/LR/std-freeze.mjs
IFS=: read -r W H DPR TH <<< "$1"; shift
tag="${W}x${H}@${DPR}-${TH}-solo"
for side in trial ctrl; do
  if [ $side = trial ]; then base=http://127.0.0.1:5530; wt=/home/user/wt/w5tr-all; else base=http://127.0.0.1:5488; wt=/home/user/wt/w4-final; fi
  mkdir -p "$CAP/$side/$tag"
  for id in "$@"; do
    (cd $wt/kettle && LANE_D_FIXED_ISO=2026-10-12T07:40:00.000Z node --import $PRE $TOOL --base $base --out "$CAP/$side/$tag" --w $W --h $H --dpr $DPR --theme $TH --only $id) >> "$CAP/$side/$tag/run.log" 2>&1
    echo "[$(date -u +%T)] $side $tag $id exit $?"
  done
done
