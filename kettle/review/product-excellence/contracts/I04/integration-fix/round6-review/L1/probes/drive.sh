#!/bin/bash
# L1 driver: every step is one slot request (python3 slots.py run --lane L1 --n 2 -- pair.py ...). Resumable (DONE markers).
cd /home/user/wt/rv6-r6/kettle/.tmp/L1
SC=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/rv6/L1
SL=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round6-review/tools/slots.py
declare -A DIM=( [375L]="375x667 light" [375D]="375x667 dark" [844L]="844x390 light" )
declare -A FIL=( [375L]="375x667@200 light" [375D]="375x667@200 dark" [844L]="844x390@200 light" )
step() { # name n pair-args...
  local name=$1 n=$2; shift 2
  [ -f $SC/$name/DONE ] && { echo "skip $name"; return; }
  echo "=== $(date -u +%FT%TZ) $name"
  python3 -I $SL run --lane L1 --n $n -- python3 -I pair.py --series $name "$@" && { mkdir -p $SC/$name; touch $SC/$name/DONE; }
}
IDX=6,8,10,12,14,16,6,8,10,12
phase1() { for c in 375L 375D 844L; do
  read W T <<< "${DIM[$c]}"
  step natural-$c 2 --probe natural.mjs -- '{BASE}' '{LABEL}' '{OUT}' $W $T 200 600,900,1200,1500,1800 2
  step race-$c 2 --probe race.mjs --env POST=100 -- '{BASE}' '{LABEL}' '{OUT}' $W $T 200 wheel 10
  step repro6sel-$c 2 --probe repro6-sel.mjs --env IDX=$IDX -- '{BASE}' '{LABEL}' '{OUT}' "${FIL[$c]}" 10 0
  step naturalx-$c 2 --probe natural-x.mjs --video -- '{BASE}' '{LABEL}' '{OUT}' $W $T 200 600,900,1200,1500,1800 2
  step racex-$c 2 --probe race-x.mjs --env POST=100 --video -- '{BASE}' '{LABEL}' '{OUT}' $W $T 200 wheel 10
done; }
phase2() { for c in 375L 375D 844L; do
  step repro6-$c 1 --probe repro6.mjs --revs R6 -- '{BASE}' '{LABEL}' '{OUT}' "${FIL[$c]}" 20 0
  step gfling-$c 2 --probe gesture6.mjs --env GESTURE=fling -- '{BASE}' '{LABEL}' '{OUT}' "${FIL[$c]}" 10 0
  step gfine-$c 2 --probe gesture6.mjs --env GESTURE=fine -- '{BASE}' '{LABEL}' '{OUT}' "${FIL[$c]}" 10 0
done; }
phase3() { for c in 375L 375D 844L; do
  step gkbd-$c 2 --probe gesture6.mjs --env GESTURE=kbd -- '{BASE}' '{LABEL}' '{OUT}' "${FIL[$c]}" 10 0
done; }
for ph in "$@"; do $ph; done
echo "=== ALL DONE $(date -u +%FT%TZ)"
