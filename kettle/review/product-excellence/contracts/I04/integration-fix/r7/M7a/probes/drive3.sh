#!/bin/bash
SL=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
EV=/home/user/wt/r7a/kettle/review/product-excellence/contracts/I04/integration-fix/r7/M7a
cd /home/user/wt/r7a/kettle/.tmp/M7a
C="390x844:light,375x667:light,1440x900:light,844x390:light"
for r in "M7a 5206" "E866 5304" "INT 5303"; do set -- $r
  python3 -I $SL run --lane M7a --n 1 -- node clsload.mjs http://127.0.0.1:$2 $1 $EV/cls/clsload.jsonl "$C" 5 >> $EV/cls/clsload.txt 2>&1
done
echo "DRIVE3 DONE $(date -u +%FT%TZ)" >> $EV/cls/clsload.txt
