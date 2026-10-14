#!/bin/bash
S=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
E=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/LR/ALL
while kill -0 $1 2>/dev/null; do sleep 5; done
cd /home/user/wt/w5tr-all/kettle
python3 -I $S run --lane LR --n 1 -- bash -c 'bash .tmp/LR-cap.sh 375:667:2:light; bash .tmp/LR-cap.sh 1440:900:1:light' > $E/runs/cap-375-1440.log 2>&1
echo done > $E/runs/cap-chain.done
python3 -I $S run --lane LR --n 1 -- bash .tmp/LR-batch2.sh > $E/rerun/batch2.log 2>&1
echo done > $E/rerun/batch2.done
