#!/bin/bash
S=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
E=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/FINAL
while [ ! -f $E/runs/chainA.done ]; do sleep 5; done
cd /home/user/wt/w5-final/kettle
python3 -I $S run --lane LR --n 1 -- bash .tmp/LR-lg.sh > $E/rerun/lg.log.txt 2>&1
for c in 390:844:2:light 390:844:2:dark; do
  python3 -I $S run --lane LR --n 1 -- bash .tmp/LR-capF.sh $c > $E/runs/cap-$(echo $c | tr ':' '-').log.txt 2>&1
done
echo done > $E/runs/cap-chainA.done
