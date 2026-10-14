#!/bin/bash
# the two W3_LOAD cases that failed, alone: this tree :5540, base :5478, and 3x on :5540 (390x844 case)
E=/home/user/Vibei/kettle/review/product-excellence/contracts/W3R1/review/FINAL/rerun
cd /home/user/wt/w5-final/kettle
run() { # label port repeat grep
  local label=$1 port=$2 rep=$3 g=$4
  local s=$(date +%s)
  rm -rf .tmp/LR-pw/rr-$label
  env W3_LOAD=1 KETTLE_PORT=$port PLAYWRIGHT_JSON_OUTPUT_NAME=$E/$label.json npx playwright test tests/w3-notices-load.spec.ts --project=chromium --workers=1 --reporter=list,json --repeat-each=$rep --output=.tmp/LR-pw/rr-$label -g "$g" > $E/$label.log.txt 2>&1
  echo "[$(date -u +%T)] $label port=$port repeat=$rep playwright-exit=$? wall=$(( $(date +%s) - s ))s load=$(cut -d' ' -f1 /proc/loadavg)"
}
G1='390×844 light 200 % reduced motion'
G2='375×667 light 200 % reduced motion'
run L1-alone-5540 5540 1 "$G1"
run L1-alone-5478 5478 1 "$G1"
run L2-alone-5540 5540 1 "$G2"
run L2-alone-5478 5478 1 "$G2"
run L1-x3-5540 5540 3 "$G1"
