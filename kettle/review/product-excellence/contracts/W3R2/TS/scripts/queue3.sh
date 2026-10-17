#!/bin/bash
# Fix round: the gated acceptance runs, one after the other (each its own slot hold).
cd /home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/TS || exit 9
S=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/TS/scripts
./scripts/gate.sh 2 logs/r2/underload-dark844-x20.log.txt $S/underload2.sh dark;  echo "dark done $(date -u +%T)" >> logs/r2/queue.txt
./scripts/gate.sh 2 logs/r2/underload-light844reduced-x10.log.txt $S/underload2.sh light;  echo "light done $(date -u +%T)" >> logs/r2/queue.txt
./scripts/gate.sh 2 logs/r2/diag3-underload.log.txt $S/underload2.sh diag3;  echo "diag3 done $(date -u +%T)" >> logs/r2/queue.txt
./scripts/gate.sh 2 logs/r2/whole-notice.log.txt $S/underload2.sh whole;  echo "whole done $(date -u +%T)" >> logs/r2/queue.txt
