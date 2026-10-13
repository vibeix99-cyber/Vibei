#!/bin/bash
# Lane R (W2R2): standard capture set for ONE side (unchanged capture.mjs, run in place; frozen-clock preload .tmp/LR/std-freeze.mjs).
#   std-side.sh trial|ctrl <outRoot> <cfg>...      cfg = W:H:DPR:theme
SIDE=$1; OUT=$2; shift 2
TOOL=/home/user/Vibei/kettle/review/product-excellence/tools/capture.mjs
if [ $SIDE = trial ]; then BASE=http://127.0.0.1:5445; WT=/home/user/wt/w3tr-pc/kettle; else BASE=http://127.0.0.1:5410; WT=/home/user/wt/w3-base/kettle; fi
for cfg in "$@"; do
  IFS=: read -r W H DPR TH <<< "$cfg"
  tag="${W}x${H}@${DPR}-${TH}"
  mkdir -p "$OUT/$SIDE/$tag"
  echo "[$(date -u +%T)] $SIDE $tag start"
  s=$(date +%s)
  (cd $WT && node --import ./.tmp/LR/std-freeze.mjs $TOOL --base $BASE --out "$OUT/$SIDE/$tag" --w $W --h $H --dpr $DPR --theme $TH) > "$OUT/$SIDE/$tag/run.log" 2>&1
  rc=$?
  echo "{\"side\":\"$SIDE\",\"base\":\"$BASE\",\"revision\":\"$(git -C $WT rev-parse --short HEAD)\",\"fixedTime\":\"2026-10-10T16:40:00.000Z\",\"clock\":\"context.clock.install({time})+resume, via .tmp/LR/std-freeze.mjs\",\"screenshots\":\"animations:'disabled' (preload default)\",\"exit\":$rc,\"wallS\":$(( $(date +%s) - s ))}" > "$OUT/$SIDE/$tag/freeze.json"
  echo "[$(date -u +%T)] $SIDE $tag exit $rc wall $(( $(date +%s) - s ))s"
done
