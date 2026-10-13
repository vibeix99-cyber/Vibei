#!/bin/bash
# usage: batch.sh <listfile> <outjsonl>; each line: base side cfg flow [extra args...]
cd /home/user/wt/w3tr-t2/kettle/.tmp/LT
EV=/home/user/Vibei/kettle/review/product-excellence/contracts/W2R2/review/LT/raw
mkdir -p $EV
while read -r base side cfg flow extra; do
  [ -z "$base" ] && continue
  tag=$(echo "$flow-$side-$cfg-$extra" | sed -e 's#[ :@/]#_#g' -e 's#--##g')
  echo "== $(date -u +%T) $side $cfg $flow $extra -> $tag.json" >> "$2.log"
  timeout 150 node lt.mjs --base $base --side $side --cfg $cfg --flow $flow --out $EV/$tag.json $extra >> "$2" 2>> "$2.log"
  echo "   rc=$? $(date -u +%T)" >> "$2.log"
done < "$1"
