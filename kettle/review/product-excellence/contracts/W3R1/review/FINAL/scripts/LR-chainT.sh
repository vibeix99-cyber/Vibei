#!/bin/bash
S=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
E=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/FINAL
while [ ! -f $E/runs/cap-solo.done ] || [ ! -f $E/runs/cap-chainB.done ]; do sleep 5; done
cd /home/user/wt/w5-final/kettle
python3 -I $S run --lane LR --n 2 -- bash .tmp/LR-stress.sh > $E/rerun/stress-gate.log.txt 2>&1
echo done > $E/runs/stress.done
