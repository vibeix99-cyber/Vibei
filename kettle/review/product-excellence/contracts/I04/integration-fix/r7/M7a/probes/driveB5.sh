#!/bin/bash
SL=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py
EV=/home/user/wt/r7a/kettle/review/product-excellence/contracts/I04/integration-fix/r7/M7a/captures/brew100
mkdir -p $EV
cd /home/user/wt/r7a/kettle
for v in "390 844 2 light" "375 667 2 light" "1440 900 1 light" "390 844 2 dark" "375 667 2 dark" "1440 900 1 dark" "390 844 2 light rm"; do set -- $v
  for rv in "INT 5303" "FINAL 5206"; do R=${rv% *}; P=${rv#* }
    O=$EV/$R-$1x$2-$4${5:+-rm}
    python3 -I $SL run --lane M7a --n 1 -- node review/product-excellence/tools/capture.mjs --base http://127.0.0.1:$P --out $O --w $1 --h $2 --dpr $3 --theme $4 ${5:+--rm} --only 02,03,04,13 >> $EV/log.txt 2>&1
    echo "$R $1x$2 $4 ${5:-} rc=$? $(date -u +%FT%TZ)" >> $EV/log.txt
  done
done
echo "BREW DONE $(date -u +%FT%TZ)" >> $EV/log.txt
