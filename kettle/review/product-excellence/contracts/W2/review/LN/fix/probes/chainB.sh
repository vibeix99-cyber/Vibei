#!/bin/bash
S=/tmp/claude-0/ln-scratch/fix; cd /home/user/wt/w2t-n/kettle
SL=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
run() { python3 -I $SL run --lane LN --n 1 -- "$@" >> $S/chainB.log 2>&1; }
run node .tmp/LN/fix/float.mjs --base http://127.0.0.1:5356 --label fix5356cpu1 --cfg 390x844@3 --starts 3 --cpus 1 --hold 6000 --mode auto --out $S
run node .tmp/LN/fix/float.mjs --base http://127.0.0.1:5350 --label ctrl5350cpu1 --cfg 390x844@3 --starts 2 --cpus 1 --hold 6000 --mode auto --out $S
echo CHAINB-DONE >> $S/chainB.log
