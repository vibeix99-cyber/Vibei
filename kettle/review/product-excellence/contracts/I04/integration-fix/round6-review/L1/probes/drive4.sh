#!/bin/bash
# after drive3c: R6-alone counterparts of the R5-alone diagnostics (natural-x, repro6-sel), same arguments, one browser
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
until grep -q "ALL DONE 3c" $SC/driver3c.log 2>/dev/null; do sleep 10; done
for c in 375L 375D 844L; do
  read W T <<< "${DIM[$c]}"
  step dnx6-$c 1 --probe natural-x.mjs --revs R6 -- '{BASE}' '{LABEL}' '{OUT}' $W $T 200 600,900,1200,1500,1800 2
done
for c in 375L 844L; do
  step drepro6-$c 1 --probe repro6-sel.mjs --revs R6 --env IDX=6,8,10,12,14,16,6,8,10,12 -- '{BASE}' '{LABEL}' '{OUT}' "${FIL[$c]}" 10 0
done
echo "=== ALL DONE 4 $(date -u +%FT%TZ)"
