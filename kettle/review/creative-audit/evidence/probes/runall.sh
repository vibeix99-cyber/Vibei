#!/bin/bash
# usage: runall.sh <base> <rev-label> <outdir>  — 3 workers, every browser through the slot gate (lane AUD, n 1)
BASE=$1; REV=$2; OUT=$3; G=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
cd /home/user/Vibei/kettle; mkdir -p $OUT/logs
w(){ for c in "$@"; do echo "$(date -u +%T) start $c" >> $OUT/logs/worker.log; python3 -I $G run --lane AUD --n 1 -- timeout 1200 node .tmp/aud2/walk2.mjs --base $BASE --rev "$REV" --out $OUT --cfg $c >> $OUT/logs/${c//[:@]/_}.log 2>&1; echo "$(date -u +%T) end $c rc=$?" >> $OUT/logs/worker.log; done; }
w 390x844@3:light:video:axe 390x844@3:dark 375x667@2:light 375x667@2:dark 844x390@3:light:land &
w 820x1180@2:light 820x1180@2:dark:axe 1440x900@2:light:video 1440x900@2:dark 844x390@3:dark:land &
w 390x844@3:light:rm 1440x900@2:dark:rm 390x844@3:dark:static 1440x900@2:light:static 390x844@3:light:celebrate 1440x900@2:dark:celebrate &
wait; echo "$(date -u +%T) ALL DONE" >> $OUT/logs/worker.log
