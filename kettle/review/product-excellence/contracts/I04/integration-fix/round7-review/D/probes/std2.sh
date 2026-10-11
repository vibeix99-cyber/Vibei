#!/bin/bash
# Lane D relaunch: standard capture set (capture.mjs, all 22 states, UNCHANGED, R7 copy; byte-identical to INT's)
# on R7 (:5301, run from the R7 worktree -> meta.revision b39202f) and INT (:5303, run from the INT worktree ->
# meta.revision 0d58c5e), back to back per configuration, in one slot, with the fixed-date/clock + animations:'disabled'
# preload (.tmp/D/std-freeze.mjs). Sidecar freeze.json per output dir.
#   std2.sh <outRoot> <cfg> [<cfg> ...]     cfg = W:H:DPR:theme[:rm]
OUT=$1; shift
TOOL=/home/user/wt/rv7-r7/kettle/review/product-excellence/tools/capture.mjs
PRE=/home/user/wt/rv7-r7/kettle/.tmp/D/std-freeze.mjs
for cfg in "$@"; do
  IFS=: read -r W H DPR TH RM <<< "$cfg"
  tag="${W}x${H}@${DPR}-${TH}${RM:+-rm}"
  for side in R7 INT; do
    if [ $side = R7 ]; then base=http://127.0.0.1:5301; wt=/home/user/wt/rv7-r7/kettle; else base=http://127.0.0.1:5303; wt=/home/user/wt/rv7-int/kettle; fi
    echo "[$(date -u +%T)] $side $tag start"
    mkdir -p "$OUT/$side/$tag"
    (cd $wt && node --import $PRE $TOOL --base $base --out "$OUT/$side/$tag" --w $W --h $H --dpr $DPR --theme $TH ${RM:+--rm})
    rc=$?
    echo "{\"side\":\"$side\",\"base\":\"$base\",\"revision\":\"$(git -C $wt rev-parse --short HEAD)\",\"fixedTime\":\"2026-10-10T16:40:00.000Z\",\"clock\":\"context.clock.install({time})+resume, via .tmp/D/std-freeze.mjs\",\"screenshots\":\"animations:'disabled' (preload default)\",\"exit\":$rc}" > "$OUT/$side/$tag/freeze.json"
    echo "[$(date -u +%T)] $side $tag exit $rc"
  done
done
