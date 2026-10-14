#!/bin/bash
S=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
E=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/LR/ALL
while [ ! -f $E/rerun/batch2.done ]; do sleep 5; done
cd /home/user/wt/w5tr-all/kettle
python3 -I $S run --lane LR --n 1 -- bash .tmp/LR-cap03.sh > $E/runs/cap-03-repeat.log 2>&1
echo done > $E/runs/cap03.done
