#!/bin/bash
# enq.sh <logname> <cmd...>: queue a browser job through the slot gate (lane LR, n=1), logging to runs/<logname>.log
S=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
E=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/LR/N
cd /home/user/wt/w5tr-n/kettle
name=$1; shift
nohup python3 -I $S run --lane LR --n 1 -- "$@" > $E/runs/$name.log 2>&1 &
sleep 0.7
