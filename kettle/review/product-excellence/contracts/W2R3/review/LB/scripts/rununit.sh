#!/bin/bash
cd /home/user/wt/w4tr-b/kettle
OUT=/home/user/Vibei/kettle/review/product-excellence/contracts/W2R3/review/LB
echo "[$(date -u +%T)] tsc start" > $OUT/tsc.txt
npx tsc --noEmit >> $OUT/tsc.txt 2>&1; echo "exit=$?" >> $OUT/tsc.txt; echo "[$(date -u +%T)] tsc end" >> $OUT/tsc.txt
echo "[$(date -u +%T)] vitest start" > $OUT/vitest.txt
npx vitest run >> $OUT/vitest.txt 2>&1; echo "exit=$?" >> $OUT/vitest.txt; echo "[$(date -u +%T)] vitest end" >> $OUT/vitest.txt
