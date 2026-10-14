#!/bin/bash
# waits for the rerun batch (pid $1) to end, then the 4 standard capture configs in two gate jobs (each: trial preview :5530, then base preview :5488, per config)
S=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
E=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/LR/ALL/runs
while kill -0 $1 2>/dev/null; do sleep 5; done
cd /home/user/wt/w5tr-all/kettle
python3 -I $S run --lane LR --n 1 -- bash -c 'bash .tmp/LR-cap.sh 390:844:2:light; bash .tmp/LR-cap.sh 390:844:2:dark' > $E/cap-390.log 2>&1
python3 -I $S run --lane LR --n 1 -- bash -c 'bash .tmp/LR-cap.sh 375:667:2:light; bash .tmp/LR-cap.sh 1440:900:1:light' > $E/cap-375-1440.log 2>&1
echo done > $E/cap-chain.done
