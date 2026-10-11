#!/bin/bash
# Lane 2 (round-8 review): standard capture set (review/product-excellence/tools/capture.mjs, 21 states, UNCHANGED,
# R8 copy; byte-identical to INT's) on R8 (:5306, run from the R8 worktree -> meta.revision 9ff0d04) and INT (:5303,
# run from the INT worktree -> meta.revision 0d58c5e). Per configuration the two sides run SIDE BY SIDE (two browsers,
# one gate job of --n 2), with the fixed-date/clock + animations:'disabled' preload (.tmp/L2/std-freeze.mjs, a byte
# copy of Lane D's). Sidecar freeze.json per output dir.
#   std-L2.sh <outRoot> <cfg> [<cfg> ...]     cfg = W:H:DPR:theme
OUT=$1; shift
TOOL=/home/user/wt/r8-trial/kettle/review/product-excellence/tools/capture.mjs
PRE=/home/user/wt/r8-trial/kettle/.tmp/L2/std-freeze.mjs
one() {
  local side=$1 base=$2 wt=$3 W=$4 H=$5 DPR=$6 TH=$7 tag=$8
  mkdir -p "$OUT/$side/$tag"
  echo "[$(date -u +%T)] $side $tag start"
  local s=$(date +%s)
  (cd $wt && node --import $PRE $TOOL --base $base --out "$OUT/$side/$tag" --w $W --h $H --dpr $DPR --theme $TH) > "$OUT/$side/$tag/run.log" 2>&1
  local rc=$?
  echo "{\"side\":\"$side\",\"base\":\"$base\",\"revision\":\"$(git -C $wt rev-parse --short HEAD)\",\"fixedTime\":\"2026-10-10T16:40:00.000Z\",\"clock\":\"context.clock.install({time})+resume, via .tmp/L2/std-freeze.mjs\",\"screenshots\":\"animations:'disabled' (preload default)\",\"exit\":$rc,\"wallS\":$(( $(date +%s) - s ))}" > "$OUT/$side/$tag/freeze.json"
  echo "[$(date -u +%T)] $side $tag exit $rc wall $(( $(date +%s) - s ))s"
}
for cfg in "$@"; do
  IFS=: read -r W H DPR TH <<< "$cfg"
  tag="${W}x${H}@${DPR}-${TH}"
  one R8 http://127.0.0.1:5306 /home/user/wt/r8-trial/kettle $W $H $DPR $TH $tag &
  one INT http://127.0.0.1:5303 /home/user/wt/rv7-int/kettle $W $H $DPR $TH $tag &
  wait
done
