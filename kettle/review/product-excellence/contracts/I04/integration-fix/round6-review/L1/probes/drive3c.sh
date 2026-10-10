#!/bin/bash
# reordered remainder (time-boxed): diagnostics (R5 alone) -> natural-g fine -> fling page-chain -> natural-g kbd -> natural-g fling 844L
cd /home/user/wt/rv6-r6/kettle/.tmp/L1
SC=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/rv6/L1
SL=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round6-review/tools/slots.py
declare -A DIM=( [375L]="375x667 light" [375D]="375x667 dark" [844L]="844x390 light" )
declare -A FIL=( [375L]="375x667@200 light" [375D]="375x667@200 dark" [844L]="844x390@200 light" )
step() { local name=$1 n=$2; shift 2
  [ -f $SC/$name/DONE ] && { echo "skip $name"; return; }
  echo "=== $(date -u +%FT%TZ) $name"
  python3 -I $SL run --lane L1 --n $n -- python3 -I pair.py --series $name "$@" && { mkdir -p $SC/$name; touch $SC/$name/DONE; }
}
# the orphaned ngfling-375D (started by drive3b)
until grep -q '"series": "ngfling-375D"' $SC/pairs.jsonl 2>/dev/null; do sleep 5; done; mkdir -p $SC/ngfling-375D; touch $SC/ngfling-375D/DONE
for c in 375L 375D 844L; do
  read W T <<< "${DIM[$c]}"
  step dnx-$c 1 --probe natural-x.mjs --revs R5 -- '{BASE}' '{LABEL}' '{OUT}' $W $T 200 600,900,1200,1500,1800 2
done
step dn-844L 1 --probe natural.mjs --revs R5 -- '{BASE}' '{LABEL}' '{OUT}' 844x390 light 200 600,900,1200,1500,1800 2
for c in 375L 844L; do
  step drepro-$c 1 --probe repro6-sel.mjs --revs R5 --env IDX=6,8,10,12,14,16,6,8,10,12 -- '{BASE}' '{LABEL}' '{OUT}' "${FIL[$c]}" 10 0
done
for c in 375L 375D 844L; do
  read W T <<< "${DIM[$c]}"
  step ngfine-$c 2 --probe natural-g.mjs --env GESTURE=fine -- '{BASE}' '{LABEL}' '{OUT}' $W $T 200 600,900,1200,1500,1800 2
done
for c in 375L 375D; do
  step gflingpage-$c 2 --probe gesture6-sel.mjs --env GESTURE=fling --env IDX=0,1,2,0,1,2,0,1,2,0 -- '{BASE}' '{LABEL}' '{OUT}' "${FIL[$c]}" 10 0
done
for c in 375L 375D 844L; do
  read W T <<< "${DIM[$c]}"
  step ngkbd-$c 2 --probe natural-g.mjs --env GESTURE=kbd -- '{BASE}' '{LABEL}' '{OUT}' $W $T 200 600,900,1200,1500,1800 2
done
step ngfling-844L 2 --probe natural-g.mjs --env GESTURE=fling -- '{BASE}' '{LABEL}' '{OUT}' 844x390 light 200 600,900,1200,1500,1800 2
echo "=== ALL DONE 3c $(date -u +%FT%TZ)"
