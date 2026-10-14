#!/bin/bash
# LR-capF.sh <W:H:DPR:theme>: standard capture (capture.mjs, 21 states): merged-tree preview :5550, base preview :5488, base again (control).
CAP=/home/user/wt/w5-final/kettle/.tmp/LR-capF
TOOL=/home/user/Vibei/kettle/review/product-excellence/tools/capture.mjs
PRE=/home/user/wt/w5-final/kettle/.tmp/LR-freeze2.mjs
IFS=: read -r W H DPR TH <<< "$1"
tag="${W}x${H}@${DPR}-${TH}"
one() {
  local side=$1 base=$2 wt=$3
  mkdir -p "$CAP/$side/$tag"
  local s=$(date +%s)
  (cd $wt/kettle && LANE_D_FIXED_ISO=2026-10-12T07:40:00.000Z node --import $PRE $TOOL --base $base --out "$CAP/$side/$tag" --w $W --h $H --dpr $DPR --theme $TH) > "$CAP/$side/$tag/run.log" 2>&1
  local rc=$?
  echo "{\"side\":\"$side\",\"base\":\"$base\",\"revision\":\"$(git -C $wt rev-parse --short HEAD)\",\"fixedTime\":\"2026-10-12T07:40:00.000Z\",\"preload\":\"LR-freeze2.mjs\",\"started\":\"$(date -u +%T)\",\"exit\":$rc,\"wallS\":$(( $(date +%s) - s )),\"load\":\"$(cut -d' ' -f1 /proc/loadavg)\"}" > "$CAP/$side/$tag/freeze.json"
  echo "[$(date -u +%T)] $side $tag exit $rc wall $(( $(date +%s) - s ))s load $(cut -d' ' -f1 /proc/loadavg)"
}
one trial http://127.0.0.1:5550 /home/user/wt/w5-final
one ctrl http://127.0.0.1:5488 /home/user/wt/w4-final
one ctrl2 http://127.0.0.1:5488 /home/user/wt/w4-final
