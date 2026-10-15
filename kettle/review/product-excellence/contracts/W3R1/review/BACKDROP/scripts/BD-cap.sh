#!/bin/bash
# BD-cap.sh <label> <base-url> <worktree> [W H DPR theme] [only]: one capture.mjs run (one browser), frozen clock as Lane R
# The wrapper is run through the slot gate by the caller: python3 -I slots.py run --lane BD --n 1 -- BD-cap.sh ...
BD=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/BACKDROP/scripts
CAPROOT=${CAPROOT:-/tmp/w6bd-cap}
TOOL=/home/user/Vibei/kettle/review/product-excellence/tools/capture.mjs
label=$1; base=$2; wt=$3; W=${4:-390}; H=${5:-844}; DPR=${6:-2}; TH=${7:-dark}; ONLY=${8:-13}
out=$CAPROOT/$label
mkdir -p "$out"
s=$(date +%s)
if [ "$ONLY" = all ]; then OA=""; else OA="--only $ONLY"; fi
(cd $wt/kettle && LANE_D_FIXED_ISO=2026-10-12T07:40:00.000Z node --import $BD/BD-freeze.mjs $TOOL --base $base --out "$out" --w $W --h $H --dpr $DPR --theme $TH $OA) > "$out/run.log" 2>&1
rc=$?
echo "{\"label\":\"$label\",\"base\":\"$base\",\"revision\":\"$(git -C $wt rev-parse --short HEAD)\",\"only\":\"$ONLY\",\"started\":\"$(date -u +%T)\",\"exit\":$rc,\"wallS\":$(( $(date +%s) - s )),\"load\":\"$(cut -d' ' -f1 /proc/loadavg)\"}" > "$out/freeze.json"
echo "[$(date -u +%T)] $label exit $rc wall $(( $(date +%s) - s ))s load $(cut -d' ' -f1 /proc/loadavg)"
