#!/bin/bash
# LR-cap.sh <W:H:DPR:theme>: the standard capture set (capture.mjs, 21 states), trial preview :5530 then base preview :5488,
# one browser at a time (one gate slot). Frozen start clock 2026-10-12T07:40:00Z (W3R1 PLAN) via the std-freeze.mjs preload.
CAP=/home/user/wt/w5tr-all/kettle/.tmp/LR-cap
TOOL=/home/user/Vibei/kettle/review/product-excellence/tools/capture.mjs
PRE=/home/user/wt/w5tr-all/kettle/.tmp/LR/std-freeze.mjs
IFS=: read -r W H DPR TH <<< "$1"
tag="${W}x${H}@${DPR}-${TH}"
one() {
  local side=$1 base=$2 wt=$3
  mkdir -p "$CAP/$side/$tag"
  local s=$(date +%s)
  (cd $wt/kettle && LANE_D_FIXED_ISO=2026-10-12T07:40:00.000Z node --import $PRE $TOOL --base $base --out "$CAP/$side/$tag" --w $W --h $H --dpr $DPR --theme $TH) > "$CAP/$side/$tag/run.log" 2>&1
  local rc=$?
  echo "{\"side\":\"$side\",\"base\":\"$base\",\"revision\":\"$(git -C $wt rev-parse --short HEAD)\",\"fixedTime\":\"2026-10-12T07:40:00.000Z\",\"preload\":\"std-freeze.mjs\",\"exit\":$rc,\"wallS\":$(( $(date +%s) - s ))}" > "$CAP/$side/$tag/freeze.json"
  echo "[$(date -u +%T)] $side $tag exit $rc wall $(( $(date +%s) - s ))s"
}
one trial http://127.0.0.1:5530 /home/user/wt/w5tr-all
one ctrl http://127.0.0.1:5488 /home/user/wt/w4-final
