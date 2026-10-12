#!/bin/bash
S=/tmp/claude-0/ln-scratch/fix; cd /home/user/wt/w2t-n/kettle
SL=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
run() { python3 -I $SL run --lane LN --n 1 -- "$@" >> $S/chainF.log 2>&1; }
# wait for the control 390 job to finish first (control-first)
while pgrep -f "label ctrl5350 --cfg 390x844@3" >/dev/null; do sleep 2; done
run node .tmp/LN/fix/float.mjs --base http://127.0.0.1:5350 --label ctrl5350 --cfg 1440x900@2 --starts 1 --cpus 6 --mode auto --out $S
run node .tmp/LN/fix/float.mjs --base http://127.0.0.1:5356 --label fix5356 --cfg 390x844@3 --starts 5 --cpus 4,4,6,6,6 --mode auto --out $S
run node .tmp/LN/fix/float.mjs --base http://127.0.0.1:5356 --label fix5356 --cfg 1440x900@2 --starts 1 --cpus 6 --mode auto --out $S
echo CHAINF-DONE >> $S/chainF.log
