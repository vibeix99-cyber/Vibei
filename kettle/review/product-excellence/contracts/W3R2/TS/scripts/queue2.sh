#!/bin/bash
# After the re-scroll change: the under-load notice run again (2 slots, 4 burners), then the whole notice file (2 slots, no burners).
cd /home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/TS || exit 9
S=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/TS/scripts
./scripts/gate.sh 2 logs/underload-notice.log.txt $S/underload.sh notice
echo "notice underload (2nd) done $(date -u +%T)" >> logs/queue.txt
./scripts/gate.sh 2 logs/whole-notice.log.txt $S/underload.sh notice-whole
echo "whole notice done $(date -u +%T)" >> logs/queue.txt
