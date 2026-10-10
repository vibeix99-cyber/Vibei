#!/bin/bash
# diagnostics (beyond the control cap; reported separately): natural-x on R5 ALONE (one browser), to see whether its R5 control depends on the R6 partner process
cd /home/user/wt/rv6-r6/kettle/.tmp/L1
SC=/tmp/claude-0/-home-user-Vibei/af90140e-0279-5682-99d5-a47623d3eed0/scratchpad/rv6/L1
SL=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round6-review/tools/slots.py
until grep -q "ALL DONE" $SC/driver2.log 2>/dev/null; do sleep 10; done
for c in "375L 375x667 light" "375D 375x667 dark"; do
  read K W T <<< "$c"
  name=dnx-$K
  [ -f $SC/$name/DONE ] && continue
  echo "=== $(date -u +%FT%TZ) $name"
  python3 -I $SL run --lane L1 --n 1 -- python3 -I pair.py --series $name --probe natural-x.mjs --revs R5 -- '{BASE}' '{LABEL}' '{OUT}' $W $T 200 600,900,1200,1500,1800 2 && { mkdir -p $SC/$name; touch $SC/$name/DONE; }
done
echo "=== DIAG DONE $(date -u +%FT%TZ)"
