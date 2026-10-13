#!/bin/bash
# Lane R (W2R2): standard capture set, UNCHANGED capture.mjs run in place, trial (:5445, w3tr-pc) vs control (:5410, w3-base)
# side by side in one gate job (--n 2). Fixed clock + animations:'disabled' via .tmp/LR/std-freeze.mjs.
#   std-LR2.sh <outRoot> <cfg>...      cfg = W:H:DPR:theme
OUT=$1; shift
TOOL=/home/user/Vibei/kettle/review/product-excellence/tools/capture.mjs
TRIAL=/home/user/wt/w3tr-pc/kettle
CTRL=/home/user/wt/w3-base/kettle
one() {
  local side=$1 base=$2 wt=$3 W=$4 H=$5 DPR=$6 TH=$7 tag=$8
  mkdir -p "$OUT/$side/$tag"
  echo "[$(date -u +%T)] $side $tag start"
  local s=$(date +%s)
  (cd $wt && node --import ./.tmp/LR/std-freeze.mjs $TOOL --base $base --out "$OUT/$side/$tag" --w $W --h $H --dpr $DPR --theme $TH) > "$OUT/$side/$tag/run.log" 2>&1
  local rc=$?
  echo "{\"side\":\"$side\",\"base\":\"$base\",\"revision\":\"$(git -C $wt rev-parse --short HEAD)\",\"fixedTime\":\"2026-10-10T16:40:00.000Z\",\"clock\":\"context.clock.install({time})+resume, via .tmp/LR/std-freeze.mjs\",\"screenshots\":\"animations:'disabled' (preload default)\",\"exit\":$rc,\"wallS\":$(( $(date +%s) - s ))}" > "$OUT/$side/$tag/freeze.json"
  echo "[$(date -u +%T)] $side $tag exit $rc wall $(( $(date +%s) - s ))s"
}
for cfg in "$@"; do
  IFS=: read -r W H DPR TH <<< "$cfg"
  tag="${W}x${H}@${DPR}-${TH}"
  one trial http://127.0.0.1:5445 $TRIAL $W $H $DPR $TH $tag &
  one ctrl  http://127.0.0.1:5410 $CTRL  $W $H $DPR $TH $tag &
  wait
done
