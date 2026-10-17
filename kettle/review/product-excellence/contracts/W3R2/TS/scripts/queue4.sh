#!/bin/bash
# Fix round, R3: after queue3 has finished, :156 x10 under load in both timer projects.
cd /home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/TS || exit 9
S=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/TS/scripts
until grep -q "whole done" logs/r2/queue.txt 2>/dev/null; do sleep 5; done
./scripts/gate.sh 2 logs/r2/underload-timer156-x10.log.txt $S/underload2.sh timer; echo "timer done $(date -u +%T)" >> logs/r2/queue.txt
