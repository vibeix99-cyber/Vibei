#!/bin/bash
cd /home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/TS || exit 9
until grep -q "TS freed" logs/r2/underload-dark844-x20.log.txt 2>/dev/null; do sleep 3; done
./scripts/gate.sh 2 logs/r2/combo.log.txt /home/user/Vibei/kettle/review/product-excellence/contracts/W3R2/TS/scripts/combo.sh
echo "combo done $(date -u +%T)" >> logs/r2/queue.txt
