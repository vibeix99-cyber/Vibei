#!/bin/bash
# captures, two lanes: $1 = marker file to wait for, then $2... = configs
S=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
E=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/FINAL
M=$1; shift
while [ ! -f $E/runs/$M ]; do sleep 5; done
cd /home/user/wt/w5-final/kettle
for c in "$@"; do
  python3 -I $S run --lane LR --n 1 -- bash .tmp/LR-capF.sh $c > $E/runs/cap-$(echo $c | tr ':' '-').log.txt 2>&1
done
echo done > $E/runs/cap-$M
