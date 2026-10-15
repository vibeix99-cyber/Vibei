#!/bin/bash
# BD-trip.sh <triples> <prefix> <only>: Lane R's order, per triple: trial (final 2be3de1 build) then base then base again, 390 dark, one browser at a time through the gate
BD=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/BACKDROP/scripts
SL=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
R=$1; PFX=$2; ONLY=${3:-02,12,13}
for r in $(seq 1 $R); do
  python3 -I $SL run --lane BD --n 1 -- $BD/BD-cap.sh $PFX$r-trial http://127.0.0.1:5585 /home/user/wt/w6-bd-2be3de1 390 844 2 dark $ONLY 2>&1 | grep -v '^\[slots\]'
  python3 -I $SL run --lane BD --n 1 -- $BD/BD-cap.sh $PFX$r-ctrl http://127.0.0.1:5488 /home/user/wt/w4-final 390 844 2 dark $ONLY 2>&1 | grep -v '^\[slots\]'
  python3 -I $SL run --lane BD --n 1 -- $BD/BD-cap.sh $PFX$r-ctrl2 http://127.0.0.1:5488 /home/user/wt/w4-final 390 844 2 dark $ONLY 2>&1 | grep -v '^\[slots\]'
done
echo RR-DONE
