#!/bin/bash
# focus-mid (03) alone, 3 repeats per side, to see whether the chrome fade seen in the full capture repeats
CAP=/home/user/wt/w5tr-all/kettle/.tmp/LR-cap
TOOL=/home/user/Vibei/kettle/review/product-excellence/tools/capture.mjs
PRE=/home/user/wt/w5tr-all/kettle/.tmp/LR/std-freeze.mjs
for i in 1 2 3; do for side in trial ctrl; do
  if [ $side = trial ]; then base=http://127.0.0.1:5530; wt=/home/user/wt/w5tr-all; else base=http://127.0.0.1:5488; wt=/home/user/wt/w4-final; fi
  d="$CAP/$side/390x844@2-light-03r$i"; mkdir -p "$d"
  (cd $wt/kettle && LANE_D_FIXED_ISO=2026-10-12T07:40:00.000Z node --import $PRE $TOOL --base $base --out "$d" --w 390 --h 844 --dpr 2 --theme light --only 03) > "$d/run.log" 2>&1
  echo "[$(date -u +%T)] $side r$i exit $?"
done; done
