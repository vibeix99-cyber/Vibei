#!/bin/bash
# LR-fb1.sh: the three failures of the full run, each alone on :5540, alone on base :5478, then 3x on :5540. One playwright process per line, sequential, one gate slot.
E=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/FINAL/rerun
cd /home/user/wt/w5-final/kettle
run() { # label port repeat grep
  local label=$1 port=$2 rep=$3 g=$4
  local s=$(date +%s)
  rm -rf .tmp/LR-pw/rr-$label
  env KETTLE_PORT=$port PLAYWRIGHT_JSON_OUTPUT_NAME=$E/$label.json npx playwright test --project=chromium --workers=1 --reporter=list,json --repeat-each=$rep --output=.tmp/LR-pw/rr-$label -g "$g" > $E/$label.log.txt 2>&1
  local rc=$?
  echo "[$(date -u +%T)] $label port=$port repeat=$rep playwright-exit=$rc wall=$(( $(date +%s) - s ))s load=$(cut -d' ' -f1 /proc/loadavg)"
}
G1='two tabs, the leading one frozen across the end'
G2='I03 storage-full warning is a banner in the page \(phone 390×844\) nothing over the brew'
G3='3D failure \(WebGL context lost\): the still that takes over carries the same items'
for t in 1 2 3; do
  eval g=\$G$t
  run F$t-alone-5540 5540 1 "$g"
  run F$t-alone-5478 5478 1 "$g"
  run F$t-x3-5540 5540 3 "$g"
done
