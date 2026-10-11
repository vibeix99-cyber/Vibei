#!/bin/bash
SL=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
cd /home/user/wt/r7a/kettle/.tmp/M7a
python3 -I $SL run --lane M7a --n 1 -- node late.mjs http://127.0.0.1:5206 FINAL /home/user/wt/r7a/kettle/review/product-excellence/contracts/I04/integration-fix/r7/M7a/cls/late.jsonl "375x667@100:light,390x844@100:light,1440x900@100:light,844x390@100:light,375x667@200:light" > /home/user/wt/r7a/kettle/review/product-excellence/contracts/I04/integration-fix/r7/M7a/cls/late-FINAL.txt 2>&1
CF=1 python3 -I $SL run --lane M7a --n 1 -- node late.mjs http://127.0.0.1:5206 FINAL-CF /home/user/wt/r7a/kettle/review/product-excellence/contracts/I04/integration-fix/r7/M7a/cls/late.jsonl "375x667@100:light,390x844@100:light,1440x900@100:light,844x390@100:light,375x667@200:light" > /home/user/wt/r7a/kettle/review/product-excellence/contracts/I04/integration-fix/r7/M7a/cls/late-FINAL-CF.txt 2>&1
echo "LATE DONE $(date -u +%FT%TZ)"
