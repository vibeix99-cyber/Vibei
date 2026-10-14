#!/bin/bash
# 16..19 each alone in its own page (no earlier screen in the sequence), 390x844@2 light: trial :5550, base :5488 twice
CAP=/home/user/wt/w5-final/kettle/.tmp/LR-capF
TOOL=/home/user/Vibei/kettle/review/product-excellence/tools/capture.mjs
PRE=/home/user/wt/w5-final/kettle/.tmp/LR-freeze2.mjs
tag="390x844@2-light-solo"
for side in trial ctrl ctrl2; do
  if [ $side = trial ]; then base=http://127.0.0.1:5550; wt=/home/user/wt/w5-final; else base=http://127.0.0.1:5488; wt=/home/user/wt/w4-final; fi
  mkdir -p "$CAP/$side/$tag"
  for id in 19 16 18 17; do
    (cd $wt/kettle && LANE_D_FIXED_ISO=2026-10-12T07:40:00.000Z node --import $PRE $TOOL --base $base --out "$CAP/$side/$tag" --w 390 --h 844 --dpr 2 --theme light --only $id) >> "$CAP/$side/$tag/run.log" 2>&1
    echo "[$(date -u +%T)] $side $id exit $?"
  done
done
