#!/bin/bash
# BD-probe.sh <label> <base-url> <worktree> <n> [extra probe args]: the probe loop in one slot, one browser at a time
BD=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/BACKDROP/scripts
CAPROOT=${CAPROOT:-/tmp/w6bd-cap}
label=$1; base=$2; wt=$3; n=$4; shift 4
out=$CAPROOT/$label; mkdir -p $out
(cd $wt/kettle && LANE_D_FIXED_ISO=2026-10-12T07:40:00.000Z node --import $BD/BD-freeze.mjs $BD/BD-probe.mjs --base $base --out $out --n $n --tag $label "$@") > $out/probe.log 2>&1
echo "[$(date -u +%T)] $label exit $? load $(cut -d' ' -f1 /proc/loadavg)"
