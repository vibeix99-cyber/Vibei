#!/bin/bash
cd /home/user/wt/w4tr-b/kettle/.tmp/LB
OUT=/home/user/Vibei/kettle/review/product-excellence/contracts/W2R3/review/LB
S=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
for cfg in "base http://127.0.0.1:5480 390 844" "trial http://127.0.0.1:5485 390 844" "base http://127.0.0.1:5480 1440 900" "trial http://127.0.0.1:5485 1440 900"; do
  set -- $cfg
  echo "[$(date -u +%H:%M:%S)] start $1 $3x$4"
  timeout 900 python3 -I $S run --lane LB --n 1 -- node live.mjs --label $1 --base $2 --w $3 --h $4 --out $OUT
  echo "[$(date -u +%H:%M:%S)] end $1 $3x$4 exit=$?"
done
