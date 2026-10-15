#!/bin/bash
S=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
E=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/F1FIX-LR
cd /home/user/wt/w6tr-x/kettle
python3 -I $S run --lane LR --n 1 -- bash -c "
for spec in 'fix-5562 http://127.0.0.1:5562' 'control-5560 http://127.0.0.1:5560'; do
  set -- \$spec
  for ph in quiet loaded; do for sc in S1 S2; do node .tmp/LR-manual.mjs \$1 \$2 6 \$ph $E/manual \$sc; done; done
done" > $E/runs/manual-2tab.log.txt 2>&1
echo done > $E/runs/lane3.done
