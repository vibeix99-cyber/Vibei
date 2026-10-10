#!/bin/bash
# after driver2: (1) natural-g gesture series (natural flow with fling / fine / kbd), (2) fling page-chain follow-up, (3) diagnostics: R5 alone (one browser)
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
until grep -q "ALL DONE" $SC/driver2.log 2>/dev/null; do sleep 10; done
for g in fling fine kbd; do for c in 375L 375D 844L; do
  read W T <<< "${DIM[$c]}"
  step ng$g-$c 2 --probe natural-g.mjs --env GESTURE=$g -- '{BASE}' '{LABEL}' '{OUT}' $W $T 200 600,900,1200,1500,1800 2
done; done
for c in 375L 375D; do
  step gflingpage-$c 2 --probe gesture6-sel.mjs --env GESTURE=fling --env IDX=0,1,2,0,1,2,0,1,2,0 -- '{BASE}' '{LABEL}' '{OUT}' "${FIL[$c]}" 10 0
done
for c in 375L 375D 844L; do
  read W T <<< "${DIM[$c]}"
  step dnx-$c 1 --probe natural-x.mjs --revs R5 -- '{BASE}' '{LABEL}' '{OUT}' $W $T 200 600,900,1200,1500,1800 2
done
step dn-844L 1 --probe natural.mjs --revs R5 -- '{BASE}' '{LABEL}' '{OUT}' 844x390 light 200 600,900,1200,1500,1800 2
for c in 375L 844L; do
  step drepro-$c 1 --probe repro6-sel.mjs --revs R5 --env IDX=6,8,10,12,14,16,6,8,10,12 -- '{BASE}' '{LABEL}' '{OUT}' "${FIL[$c]}" 10 0
done
echo "=== DIAG DONE $(date -u +%FT%TZ)"
