#!/bin/bash
S=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
E=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/FINAL
while [ ! -f $E/runs/cap-chainA.done ]; do sleep 5; done
cd /home/user/wt/w5-final/kettle
python3 -I $S run --lane LR --n 1 -- bash .tmp/LR-capsoloF.sh > $E/runs/cap-solo-390L.log.txt 2>&1
echo done > $E/runs/cap-solo.done
