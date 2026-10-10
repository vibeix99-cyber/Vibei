#!/bin/bash
# B3: 3g link, 3f CLS (production previews), 3c next-brew toast
cd /home/user/wt/rv6-r6/kettle/.tmp/L3
Q='cut -c1-500'
run() { echo "##### $(date -u +%H:%M:%S) $*"; "$@" 2>&1 | grep -E "^(RUN|SUMMARY|END|SCENARIO)|Error|error|toasts seen|final state" | $Q; }
run node sweep.mjs --rev=R6
run node sweep.mjs --rev=INT
run node g.mjs --rev=R6
run node g.mjs --rev=INT
run node cls.mjs --rev=R6 --runs=3
run node cls.mjs --rev=INT --runs=3
# 3c: find a seed whose break-end raises a toast on the auto-started next brew (R6, 375x667), then run the matrix
D=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round6-review/L3/3c
PICK=""
for sd in veteran celebrate newbie atRisk blank; do
  run node nextbrew.mjs --rev=R6 --w=375 --h=667 --seed=$sd
  n=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('$D/nextbrew-R6-375x667-$sd.json','utf8')).toasts.length)}catch(e){console.log(0)}")
  echo "seed $sd -> toasts on next brew: $n"
  if [ "$n" -gt 0 ] && [ -z "$PICK" ]; then PICK=$sd; fi
done
echo "picked seed: ${PICK:-none}"
if [ -n "$PICK" ]; then
  run node nextbrew.mjs --rev=INT --w=375 --h=667 --seed=$PICK --video
  run node nextbrew.mjs --rev=R6 --w=375 --h=667 --seed=$PICK --video
  for vp in "390 844" "1440 900"; do set -- $vp
    run node nextbrew.mjs --rev=R6 --w=$1 --h=$2 --seed=$PICK
    run node nextbrew.mjs --rev=INT --w=$1 --h=$2 --seed=$PICK
  done
fi
echo "##### $(date -u +%H:%M:%S) B3 done"
