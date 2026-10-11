#!/bin/bash
# Lane D standard capture set: review/product-excellence/tools/capture.mjs (unchanged, R7 copy; byte-identical to INT's)
# on R7 (:5301, run from the R7 worktree so meta.revision = b39202f) and INT (:5303, run from the INT worktree so
# meta.revision = 0d58c5e), back to back per configuration. One browser at a time (runs inside one slot).
#   std-captures.sh <outRoot> <cfg> [<cfg> ...]     cfg = W:H:DPR:theme[:rm]
OUT=$1; shift
TOOL=/home/user/wt/rv7-r7/kettle/review/product-excellence/tools/capture.mjs
for cfg in "$@"; do
  IFS=: read -r W H DPR TH RM <<< "$cfg"
  tag="${W}x${H}@${DPR}-${TH}${RM:+-rm}"
  for side in R7 INT; do
    if [ $side = R7 ]; then base=http://127.0.0.1:5301; wt=/home/user/wt/rv7-r7/kettle; else base=http://127.0.0.1:5303; wt=/home/user/wt/rv7-int/kettle; fi
    echo "[$(date -u +%T)] $side $tag start"
    (cd $wt && node $TOOL --base $base --out "$OUT/$side/$tag" --w $W --h $H --dpr $DPR --theme $TH ${RM:+--rm})
    echo "[$(date -u +%T)] $side $tag exit $?"
  done
done
