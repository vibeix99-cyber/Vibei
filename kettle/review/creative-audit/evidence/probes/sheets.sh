#!/bin/bash
# sheets.sh <capdir> <outdir> : one contact sheet per finished config (viewport states only), through the slot gate
CAP=$1; OUT=$2; G=/home/user/Vibei/kettle/review/product-excellence/contracts/I04/integration-fix/round7-review/tools/slots.py; mkdir -p $OUT
cd /home/user/Vibei/kettle
for d in $CAP/*/; do n=$(basename $d); [ -f $d/meta.json ] || continue; [ -f $OUT/$n.png ] && continue
  files=$(ls $d/*.png | grep -v -- '-full' | sort)
  h=360; case $n in 1440*) h=300;; 820*) h=380;; 844*) h=220;; esac
  python3 -I $G run --lane AUDP --n 1 -- timeout 300 node review/contact.mjs --out $OUT/$n.png --h $h --cols 6 $files > /dev/null 2>&1 && echo "sheet $n"
done
