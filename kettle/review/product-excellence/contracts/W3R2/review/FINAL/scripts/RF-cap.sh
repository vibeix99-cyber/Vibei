#!/bin/bash
# RF-cap.sh <W:H:DPR:theme> [ids]: BEFORE (pre-round app, :5583, worktree w8q), AFTER (merged tree, :5560, worktree w6-int), BEFORE again (noise floor).
# capture.mjs unchanged, with the freeze preload (fixed start clock 2026-10-12T07:40Z as W3R1, animations disabled, full-page frames).
CAP=/home/user/wt/w6-int/kettle/.tmp/RF-cap
TOOL=/home/user/Vibei/kettle/review/product-excellence/tools/capture.mjs
PRE=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/review/FINAL/scripts/RF-freeze.mjs
IDS=${2:-01,02,03,04,07,16}
IFS=: read -r W H DPR TH <<< "$1"
tag="${W}x${H}@${DPR}-${TH}"
one() {
  local side=$1 base=$2 wt=$3
  rm -rf "$CAP/$side/$tag"; mkdir -p "$CAP/$side/$tag"
  local s=$(date +%s)
  local l0=$(cut -d' ' -f1 /proc/loadavg)
  (cd $wt/kettle && LANE_D_FIXED_ISO=2026-10-12T07:40:00.000Z node --import $PRE $TOOL --base $base --out "$CAP/$side/$tag" --w $W --h $H --dpr $DPR --theme $TH --only $IDS) > "$CAP/$side/$tag/run.log" 2>&1
  local rc=$?
  echo "{\"side\":\"$side\",\"base\":\"$base\",\"revision\":\"$(git -C $wt rev-parse --short HEAD)\",\"src\":\"$(git -C $wt rev-parse --short HEAD:kettle/src)\",\"fixedTime\":\"2026-10-12T07:40:00.000Z\",\"preload\":\"RF-freeze.mjs\",\"ids\":\"$IDS\",\"started\":\"$(date -u +%T)\",\"exit\":$rc,\"wallS\":$(( $(date +%s) - s )),\"loadStart\":\"$l0\",\"loadEnd\":\"$(cut -d' ' -f1 /proc/loadavg)\"}" > "$CAP/$side/$tag/freeze.json"
  echo "[$(date -u +%T)] $side $tag exit $rc wall $(( $(date +%s) - s ))s load $l0 -> $(cut -d' ' -f1 /proc/loadavg)"
}
one before http://127.0.0.1:5583 /home/user/wt/w8q
one after http://127.0.0.1:5560 /home/user/wt/w6-int
one before2 http://127.0.0.1:5583 /home/user/wt/w8q
